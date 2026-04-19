import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { PredictConditionBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = auth.userId;
  next();
}

router.post("/symptoms/predict", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = PredictConditionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { symptoms, severity, duration } = parsed.data;

  const prompt = `You are a compassionate mental health informational assistant. Based on the following symptoms, provide a supportive analysis for INFORMATIONAL and GUIDANCE purposes ONLY. This is NOT a medical diagnosis.

Symptoms: ${symptoms.join(", ")}
Severity: ${severity}
${duration ? `Duration: ${duration}` : ""}

Respond in JSON format with this exact structure:
{
  "conditions": [
    {
      "name": "condition name",
      "likelihood": "low|moderate|high",
      "description": "brief, supportive description (1-2 sentences)"
    }
  ],
  "recommendations": [
    {
      "category": "Meditation",
      "title": "Mindfulness Practice",
      "description": "specific recommendation text"
    },
    {
      "category": "Breathing",
      "title": "Breathing Exercise",
      "description": "specific recommendation text"
    },
    {
      "category": "Movement",
      "title": "Gentle Physical Activity",
      "description": "specific recommendation text"
    },
    {
      "category": "Self-Care",
      "title": "Stress Relief Tip",
      "description": "specific recommendation text"
    }
  ],
  "seekHelpImmediately": true|false,
  "seekHelpReason": "brief reason if seekHelpImmediately is true, otherwise null"
}

Rules:
- Include 2-4 conditions
- Always include all 4 recommendation categories with specific, actionable advice tailored to the symptoms
- If severity is severe OR symptoms suggest serious risk (self-harm, suicidal thoughts, severe dissociation), set seekHelpImmediately to true and provide an urgent, compassionate reason
- For moderate or high likelihood conditions with severe severity, recommend professional consultation in addition to self-help
- Keep all language warm, supportive, and non-alarming`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  let result;
  try {
    const content = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    result = null;
  }

  if (!result) {
    result = {
      conditions: [
        { name: "Generalized Stress Response", likelihood: "moderate", description: "Your symptoms may reflect your body and mind responding to elevated stress levels." }
      ],
      recommendations: [
        { category: "Meditation", title: "5-Minute Mindfulness", description: "Sit quietly, close your eyes, and focus on your breath for 5 minutes. Notice thoughts without judgment." },
        { category: "Breathing", title: "4-7-8 Breathing", description: "Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times to activate your parasympathetic nervous system." },
        { category: "Movement", title: "Gentle Walk", description: "A 15-minute walk outdoors can reduce cortisol levels and improve mood significantly." },
        { category: "Self-Care", title: "Rest and Routine", description: "Prioritize 7-9 hours of sleep, limit caffeine after 2pm, and maintain a gentle daily routine." }
      ],
      seekHelpImmediately: severity === "severe",
      seekHelpReason: severity === "severe" ? "Your symptoms appear significant. Please reach out to a healthcare professional for proper support." : null
    };
  }

  // Convert old-style string recommendations to object format if AI returned strings
  const recommendations = (result.recommendations || []).map((r: any) => {
    if (typeof r === "string") {
      return { category: "Wellness", title: "Recommendation", description: r };
    }
    return r;
  });

  res.json({
    disclaimer: "This analysis is for guidance and informational purposes only. It is not a confirmed medical diagnosis. Results reflect a preliminary assessment based on your input. Always consult a licensed healthcare professional for proper evaluation and treatment.",
    conditions: result.conditions ?? [],
    recommendations,
    seekHelpImmediately: result.seekHelpImmediately ?? (severity === "severe"),
    seekHelpReason: result.seekHelpReason ?? null,
  });
});

export default router;

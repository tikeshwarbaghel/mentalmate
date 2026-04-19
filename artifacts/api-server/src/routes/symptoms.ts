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

  const prompt = `You are a mental health informational assistant. Based on the following symptoms, provide possible mental health conditions for INFORMATIONAL purposes ONLY. This is NOT a medical diagnosis.

Symptoms: ${symptoms.join(", ")}
Severity: ${severity}
${duration ? `Duration: ${duration}` : ""}

Respond in JSON format with this exact structure:
{
  "conditions": [
    {
      "name": "condition name",
      "likelihood": "low|moderate|high",
      "description": "brief description (1-2 sentences)"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "seekHelpImmediately": true|false
}

Include 2-4 conditions. For severe symptoms, set seekHelpImmediately to true. Keep descriptions brief and clear.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  let result;
  try {
    const content = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { conditions: [], recommendations: [], seekHelpImmediately: false };
  } catch {
    result = {
      conditions: [
        { name: "Generalized Anxiety", likelihood: "moderate", description: "A pattern of excessive worry and tension that may be related to your symptoms." }
      ],
      recommendations: [
        "Consider speaking with a licensed mental health professional",
        "Practice daily mindfulness or meditation",
        "Maintain a regular sleep schedule"
      ],
      seekHelpImmediately: severity === "severe"
    };
  }

  res.json({
    disclaimer: "This information is for educational purposes only and is NOT a medical diagnosis. Please consult a licensed healthcare professional for proper evaluation and treatment.",
    conditions: result.conditions ?? [],
    recommendations: result.recommendations ?? [],
    seekHelpImmediately: result.seekHelpImmediately ?? (severity === "severe"),
  });
});

export default router;

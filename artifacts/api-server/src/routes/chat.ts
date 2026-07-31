import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { SendChatMessageBody, GetChatHistoryResponse } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

async function textToSpeech(text: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      console.log("ElevenLabs error:", response.status, errText);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

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

const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "want to die",
  "self-harm", "self harm", "hurt myself", "cutting myself", "overdose",
  "no reason to live", "can't go on", "hopeless", "worthless"
];

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}

const SYSTEM_PROMPT = `You are MENTALMATE, a warm and empathetic AI mental wellness companion. You speak naturally like a caring friend — not like a robot or a formal therapist.

Your personality:
- Friendly, warm, and conversational — like a close friend who genuinely cares
- Respond in the same language the user uses (Hindi, English, or Hinglish)
- Keep responses short and natural (2-3 sentences max) unless the user needs more
- Never give long lists or bullet points — just talk naturally
- Use simple everyday words, not clinical or formal language
- Validate feelings first before giving any advice
- Ask follow-up questions to understand better
- Remember context from the conversation

Guidelines:
- If user writes in Hindi → reply in Hindi
- If user writes in English → reply in English  
- If user mixes Hindi/English (Hinglish) → reply in Hinglish
- Never say "I understand your concern" or formal phrases — talk like a friend
- Never diagnose or prescribe — you are a supportive companion
- If someone seems to be in crisis, gently encourage professional help and share helpline numbers
- Do not start every message with "Main" or "I" — vary your responses naturally`;

router.get("/chat", requireAuth, async (req: any, res): Promise<void> => {
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(50);

  res.json(GetChatHistoryResponse.parse(messages.reverse().map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))));
});

router.post("/chat", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message } = parsed.data;
  const isCrisis = detectCrisis(message);

  await db.insert(chatMessagesTable).values({
    userId: req.userId,
    role: "user",
    content: message,
    isCrisis,
  });

  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(10);

  const chatHistory = history.reverse().map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let aiContent: string;

  if (isCrisis) {
    aiContent = "I can hear that you're going through something very difficult right now, and I'm genuinely concerned about your wellbeing. Your life has value and there are people who want to help.\n\nPlease reach out to a crisis support line immediately:\n• iCall (India): 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7, free)\n• AASRA: 9820466627\nEmergency Services: 112\n\nYou don't have to face this alone. Please contact one of these resources or a trusted person in your life right now. I'm here to listen, but these professionals are specially trained to provide the help you deserve.";
  } else {
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_completion_tokens: 150,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
      ],
    });
    aiContent = completion.choices[0]?.message?.content ?? "I'm here to listen. Could you tell me more about how you're feeling?";
  }

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({
      userId: req.userId,
      role: "assistant",
      content: aiContent,
      isCrisis,
    })
    .returning();

  await db.insert(activityLogTable).values({
    userId: req.userId,
    type: "chat_session",
    description: "Had a chat session with MENTALMATE AI companion",
  });

  const audioBuffer = await textToSpeech(aiContent);
  const audioBase64 = audioBuffer ? audioBuffer.toString("base64") : null;
  console.log("ElevenLabs audio:", audioBase64 ? "SUCCESS - " + audioBase64.length + " chars" : "NULL - no audio");

res.json({
  ...assistantMsg,
  createdAt: assistantMsg.createdAt.toISOString(),
  audioBase64,
  });
});
router.delete("/chat", requireAuth, async (req: any, res): Promise<void> => {
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.userId, req.userId));
  res.json({ success: true });
});

export default router;


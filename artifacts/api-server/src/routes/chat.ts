import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { SendChatMessageBody, GetChatHistoryResponse } from "@workspace/api-zod";
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

const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "want to die",
  "self-harm", "self harm", "hurt myself", "cutting myself", "overdose",
  "no reason to live", "can't go on", "hopeless", "worthless"
];

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}

const SYSTEM_PROMPT = `You are MENTALMATE, a compassionate AI wellness companion designed to provide emotional support and guidance. You are NOT a licensed therapist, psychologist, or medical professional, and you must never present yourself as one.

Your role is to:
- Listen empathetically and respond with warmth and care
- Help users explore their feelings and emotions
- Offer general wellness tips, coping strategies, and self-care suggestions
- Provide a safe, non-judgmental space for emotional expression
- Encourage professional help when appropriate

Important guidelines:
- Always be gentle, kind, and supportive in your responses
- Never diagnose conditions or prescribe treatments
- If a user seems to be in crisis or mentions self-harm, always encourage them to reach out to a mental health crisis line or emergency services
- Keep responses concise but meaningful (2-4 paragraphs)
- Use "I" statements and validate feelings
- Remind users occasionally that speaking with a licensed professional can be very beneficial`;

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
    aiContent = "I can hear that you're going through something very difficult right now, and I'm genuinely concerned about your wellbeing. Your life has value and there are people who want to help.\n\nPlease reach out to a crisis support line immediately:\n• National Suicide Prevention Lifeline: Call or text 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: Call 911\n\nYou don't have to face this alone. Please contact one of these resources or a trusted person in your life right now. I'm here to listen, but these professionals are specially trained to provide the help you deserve.";
  } else {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
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

  res.json({
    ...assistantMsg,
    createdAt: assistantMsg.createdAt.toISOString(),
  });
});

router.delete("/chat", requireAuth, async (req: any, res): Promise<void> => {
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.userId, req.userId));
  res.json({ success: true });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, wellnessDataTable, moodLogsTable, chatMessagesTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { UpdateWellnessDataBody } from "@workspace/api-zod";

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

router.get("/wellness", requireAuth, async (req: any, res): Promise<void> => {
  let [wellness] = await db
    .select()
    .from(wellnessDataTable)
    .where(eq(wellnessDataTable.userId, req.userId));

  if (!wellness) {
    [wellness] = await db
      .insert(wellnessDataTable)
      .values({ userId: req.userId })
      .returning();
  }

  const moodLogs = await db
    .select()
    .from(moodLogsTable)
    .where(eq(moodLogsTable.userId, req.userId));

  const chatSessions = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId));

  const streakDays = calculateStreak(moodLogs);

  res.json({
    userId: wellness.userId,
    stressLevel: wellness.stressLevel,
    bloodPressureSystolic: wellness.bloodPressureSystolic,
    bloodPressureDiastolic: wellness.bloodPressureDiastolic,
    mentalHealthScore: wellness.mentalHealthScore,
    lastUpdated: wellness.lastUpdated?.toISOString() ?? null,
    streakDays,
    totalMoodLogs: moodLogs.length,
    totalChatSessions: chatSessions.filter(m => m.role === "user").length,
  });
});

function calculateStreak(moodLogs: any[]): number {
  if (moodLogs.length === 0) return 0;

  const dates = [...new Set(moodLogs.map(l => {
    const d = typeof l.date === "string" ? l.date : (l.date as Date).toISOString().split("T")[0];
    return d;
  }))].sort().reverse();

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

router.put("/wellness", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateWellnessDataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {
    lastUpdated: new Date(),
  };
  if (parsed.data.stressLevel != null) updateData.stressLevel = parsed.data.stressLevel;
  if (parsed.data.bloodPressureSystolic != null) updateData.bloodPressureSystolic = parsed.data.bloodPressureSystolic;
  if (parsed.data.bloodPressureDiastolic != null) updateData.bloodPressureDiastolic = parsed.data.bloodPressureDiastolic;
  if (parsed.data.mentalHealthScore != null) updateData.mentalHealthScore = parsed.data.mentalHealthScore;

  let [wellness] = await db
    .select()
    .from(wellnessDataTable)
    .where(eq(wellnessDataTable.userId, req.userId));

  if (!wellness) {
    [wellness] = await db
      .insert(wellnessDataTable)
      .values({ userId: req.userId, ...updateData })
      .returning();
  } else {
    [wellness] = await db
      .update(wellnessDataTable)
      .set(updateData)
      .where(eq(wellnessDataTable.userId, req.userId))
      .returning();
  }

  await db.insert(activityLogTable).values({
    userId: req.userId,
    type: "wellness_updated",
    description: "Updated wellness metrics",
  });

  const moodLogs = await db.select().from(moodLogsTable).where(eq(moodLogsTable.userId, req.userId));
  const chatSessions = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.userId, req.userId));

  res.json({
    userId: wellness.userId,
    stressLevel: wellness.stressLevel,
    bloodPressureSystolic: wellness.bloodPressureSystolic,
    bloodPressureDiastolic: wellness.bloodPressureDiastolic,
    mentalHealthScore: wellness.mentalHealthScore,
    lastUpdated: wellness.lastUpdated?.toISOString() ?? null,
    streakDays: calculateStreak(moodLogs),
    totalMoodLogs: moodLogs.length,
    totalChatSessions: chatSessions.filter(m => m.role === "user").length,
  });
});

router.get("/wellness/activity", requireAuth, async (req: any, res): Promise<void> => {
  const activity = await db
    .select()
    .from(activityLogTable)
    .where(eq(activityLogTable.userId, req.userId))
    .orderBy(desc(activityLogTable.createdAt))
    .limit(20);

  res.json(activity.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;

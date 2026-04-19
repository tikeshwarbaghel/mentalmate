import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, moodLogsTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  CreateMoodLogBody,
  GetMoodLogsResponse,
  GetTodayMoodResponse,
} from "@workspace/api-zod";

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

router.get("/mood", requireAuth, async (req: any, res): Promise<void> => {
  const logs = await db
    .select()
    .from(moodLogsTable)
    .where(eq(moodLogsTable.userId, req.userId))
    .orderBy(desc(moodLogsTable.createdAt));
  res.json(GetMoodLogsResponse.parse(logs.map(l => ({
    ...l,
    date: typeof l.date === "string" ? l.date : (l.date as Date).toISOString().split("T")[0],
    createdAt: l.createdAt.toISOString(),
  }))));
});

router.post("/mood", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateMoodLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const [log] = await db
    .insert(moodLogsTable)
    .values({
      userId: req.userId,
      mood: parsed.data.mood,
      note: parsed.data.note ?? null,
      stressLevel: parsed.data.stressLevel ?? null,
      date: today,
    })
    .returning();

  await db.insert(activityLogTable).values({
    userId: req.userId,
    type: "mood_logged",
    description: `Logged mood: ${parsed.data.mood}`,
  });

  res.status(201).json({
    ...log,
    date: typeof log.date === "string" ? log.date : (log.date as Date).toISOString().split("T")[0],
    createdAt: log.createdAt.toISOString(),
  });
});

router.get("/mood/today", requireAuth, async (req: any, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [log] = await db
    .select()
    .from(moodLogsTable)
    .where(
      and(
        eq(moodLogsTable.userId, req.userId),
        eq(moodLogsTable.date, today)
      )
    );

  if (!log) {
    res.status(404).json({ error: "No mood logged today" });
    return;
  }

  res.json(GetTodayMoodResponse.parse({
    ...log,
    date: typeof log.date === "string" ? log.date : (log.date as Date).toISOString().split("T")[0],
    createdAt: log.createdAt.toISOString(),
  }));
});

router.get("/mood/weekly", requireAuth, async (req: any, res): Promise<void> => {
  const logs = await db
    .select()
    .from(moodLogsTable)
    .where(eq(moodLogsTable.userId, req.userId))
    .orderBy(desc(moodLogsTable.createdAt));

  const days = [];
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const log = logs.find(l => {
      const logDate = typeof l.date === "string" ? l.date : (l.date as Date).toISOString().split("T")[0];
      return logDate === dateStr;
    });
    days.push({
      date: dateStr,
      day: dayNames[d.getDay()],
      mood: log?.mood ?? null,
      stressLevel: log?.stressLevel ?? null,
    });
  }

  const moodCounts = { happy: 0, sad: 0, stressed: 0, anxious: 0, calm: 0, tired: 0 };
  let totalStress = 0;
  let stressCount = 0;

  logs.forEach(l => {
    const mood = l.mood as keyof typeof moodCounts;
    if (mood in moodCounts) moodCounts[mood]++;
    if (l.stressLevel != null) {
      totalStress += l.stressLevel;
      stressCount++;
    }
  });

  const dominantMood = Object.entries(moodCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const averageStress = stressCount > 0 ? Math.round(totalStress / stressCount) : null;

  const insights: Record<string, string> = {
    happy: "You've been feeling positive this week. Keep nurturing what brings you joy.",
    calm: "You've maintained a calm and balanced state this week. Well done.",
    tired: "You've been experiencing fatigue this week. Consider prioritizing rest and sleep.",
    stressed: "Stress has been elevated this week. Try breathing exercises or short walks.",
    anxious: "Anxiety has been present this week. Consider talking to someone you trust.",
    sad: "You've been feeling low this week. Remember, it's okay to seek support.",
  };

  res.json({
    days,
    dominantMood,
    averageStress,
    insight: insights[dominantMood] ?? "Keep tracking your mood to discover patterns.",
    moodCounts,
  });
});

export default router;

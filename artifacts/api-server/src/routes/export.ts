import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, chatMessagesTable, moodLogsTable, wellnessDataTable, activityLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

router.get("/export-data", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const [chats, moods, wellness, activity] = await Promise.all([
      db.select().from(chatMessagesTable).where(eq(chatMessagesTable.userId, req.userId)),
      db.select().from(moodLogsTable).where(eq(moodLogsTable.userId, req.userId)),
      db.select().from(wellnessDataTable).where(eq(wellnessDataTable.userId, req.userId)),
      db.select().from(activityLogTable).where(eq(activityLogTable.userId, req.userId)),
    ]);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MentalMate - My Data Export</title>
  <style>
    body { font-family: Inter, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; background: #f8f9fa; }
    h1 { color: #7c3aed; font-size: 28px; margin-bottom: 4px; }
    .subtitle { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
    h2 { font-size: 18px; color: #374151; margin: 32px 0 12px; border-left: 4px solid #7c3aed; padding-left: 12px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 24px; }
    th { background: #7c3aed; color: white; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 500; }
    td { padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #faf5ff; }
    .empty { text-align: center; color: #9ca3af; padding: 24px; font-size: 14px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
    .badge-user { background: #ede9fe; color: #7c3aed; }
    .badge-assistant { background: #d1fae5; color: #065f46; }
    .badge-crisis { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>MentalMate — My Data Export</h1>
  <p class="subtitle">Exported on ${new Date().toLocaleString("en-IN")} &nbsp;|&nbsp; Your Mind. Our Care.</p>

  <h2>Wellness Data</h2>
  ${wellness.length === 0 ? '<p class="empty">No wellness data found.</p>' : `
  <table>
    <tr><th>Stress Level</th><th>Mental Health Score</th><th>BP Systolic</th><th>BP Diastolic</th><th>Last Updated</th></tr>
    ${wellness.map(w => `<tr>
      <td>${w.stressLevel ?? "--"}/10</td>
      <td>${w.mentalHealthScore ?? "--"}/100</td>
      <td>${w.bloodPressureSystolic ?? "--"}</td>
      <td>${w.bloodPressureDiastolic ?? "--"}</td>
      <td>${w.lastUpdated ? new Date(w.lastUpdated).toLocaleString("en-IN") : "--"}</td>
    </tr>`).join("")}
  </table>`}

  <h2>Mood Logs</h2>
  ${moods.length === 0 ? '<p class="empty">No mood logs found.</p>' : `
  <table>
    <tr><th>Date</th><th>Mood</th><th>Stress Level</th><th>Note</th></tr>
    ${moods.map(m => `<tr>
      <td>${new Date(m.date).toLocaleDateString("en-IN")}</td>
      <td>${m.mood}</td>
      <td>${m.stressLevel ?? "--"}/10</td>
      <td>${m.note ?? "--"}</td>
    </tr>`).join("")}
  </table>`}

  <h2>Chat History</h2>
  ${chats.length === 0 ? '<p class="empty">No chat history found.</p>' : `
  <table>
    <tr><th>Time</th><th>Role</th><th>Message</th><th>Crisis</th></tr>
    ${chats.map(c => `<tr>
      <td>${new Date(c.createdAt).toLocaleString("en-IN")}</td>
      <td><span class="badge badge-${c.role}">${c.role}</span></td>
      <td>${c.content.slice(0, 100)}${c.content.length > 100 ? "..." : ""}</td>
      <td>${c.isCrisis ? '<span class="badge badge-crisis">Yes</span>' : "No"}</td>
    </tr>`).join("")}
  </table>`}

  <h2>Activity Log</h2>
  ${activity.length === 0 ? '<p class="empty">No activity found.</p>' : `
  <table>
    <tr><th>Time</th><th>Type</th><th>Description</th></tr>
    ${activity.map(a => `<tr>
      <td>${new Date(a.createdAt).toLocaleString("en-IN")}</td>
      <td>${a.type}</td>
      <td>${a.description}</td>
    </tr>`).join("")}
  </table>`}
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="mentalmate-export-${new Date().toISOString().split("T")[0]}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
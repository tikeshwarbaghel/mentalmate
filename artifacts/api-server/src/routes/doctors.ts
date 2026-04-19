import { Router, type IRouter } from "express";
import { db, doctorsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

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

router.get("/doctors", requireAuth, async (_req, res): Promise<void> => {
  const doctors = await db.select().from(doctorsTable);
  res.json(doctors.map(d => ({
    ...d,
    rating: d.rating / 10,
  })));
});

export default router;

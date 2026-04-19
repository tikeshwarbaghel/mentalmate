import { Router, type IRouter } from "express";
import healthRouter from "./health";
import moodRouter from "./mood";
import chatRouter from "./chat";
import wellnessRouter from "./wellness";
import doctorsRouter from "./doctors";
import symptomsRouter from "./symptoms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(moodRouter);
router.use(chatRouter);
router.use(wellnessRouter);
router.use(doctorsRouter);
router.use(symptomsRouter);

export default router;

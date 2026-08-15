import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bosskeyRouter from "./bosskey";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bosskeyRouter);

export default router;

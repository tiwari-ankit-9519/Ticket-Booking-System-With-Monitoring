import { Router } from "express";
import { getPrometheusMetrics } from "../controllers/metrics.controller";

const router: Router = Router();

router.get("/metrics", getPrometheusMetrics);

export default router;

import { Router } from "express";
import * as queryMonitorController from "../controllers/query-monitoring.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get(
  "/query-monitor/slow-queries",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  queryMonitorController.getSlowQueries,
);

router.get(
  "/query-monitor/stats",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  queryMonitorController.getQueryStats,
);

router.delete(
  "/query-monitor/clear",
  authenticate,
  requireRole("SUPER_ADMIN"),
  queryMonitorController.clearSlowQueries,
);

export default router;

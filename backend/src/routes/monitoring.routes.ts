import { Router } from "express";
import * as monitoringController from "../controllers/monitoring.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get(
  "/monitoring/system",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  monitoringController.getSystemMetrics,
);

router.get(
  "/monitoring/database",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  monitoringController.getDatabaseMetrics,
);

router.get(
  "/monitoring/cache",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  monitoringController.getCacheMetrics,
);

router.get(
  "/monitoring/application",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  monitoringController.getApplicationMetrics,
);

router.get("/monitoring/health", monitoringController.getHealthCheck);

router.get(
  "/monitoring/errors",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  monitoringController.getErrorStats,
);

export default router;

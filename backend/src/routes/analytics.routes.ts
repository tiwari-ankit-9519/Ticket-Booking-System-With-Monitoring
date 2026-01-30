import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get(
  "/analytics/dashboard",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getDashboardStats,
);

router.get(
  "/analytics/revenue",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getRevenueAnalytics,
);

router.get(
  "/analytics/bookings",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getBookingAnalytics,
);

router.get(
  "/analytics/events",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getEventAnalytics,
);

router.get(
  "/analytics/users",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getUserAnalytics,
);

router.get(
  "/analytics/system-health",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getSystemHealth,
);

router.get(
  "/analytics/audit-logs",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  analyticsController.getAuditLogs,
);

export default router;

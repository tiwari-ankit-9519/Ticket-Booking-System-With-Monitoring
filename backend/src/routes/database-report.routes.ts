import { Router } from "express";
import * as databaseReportController from "../controllers/database-report.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get(
  "/database-report/performance",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  databaseReportController.getPerformanceReport,
);

router.get(
  "/database-report/html",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  databaseReportController.getHTMLReport,
);

export default router;

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as databaseReportService from "../services/database-report.service";
import { logger } from "../config/logger.config";

export async function getPerformanceReport(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const report = await databaseReportService.generatePerformanceReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    logger.error("Get performance report error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to generate performance report",
    });
  }
}

export async function getHTMLReport(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const html = await databaseReportService.generateHTMLReport();

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: any) {
    logger.error("Get HTML report error", { error: error.message });

    res.status(500).send("<h1>Failed to generate report</h1>");
  }
}

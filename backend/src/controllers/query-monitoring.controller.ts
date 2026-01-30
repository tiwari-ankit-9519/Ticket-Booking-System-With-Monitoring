import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as queryMonitorService from "../services/query-monitor.service";
import { logger } from "../config/logger.config";

export async function getSlowQueries(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const queries = await queryMonitorService.getSlowQueries(limit);

    res.status(200).json({
      success: true,
      data: {
        queries,
        total: queries.length,
      },
    });
  } catch (error: any) {
    logger.error("Get slow queries error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get slow queries",
    });
  }
}

export async function getQueryStats(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const stats = await queryMonitorService.getQueryStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Get query stats error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get query stats",
    });
  }
}

export async function clearSlowQueries(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const count = await queryMonitorService.clearSlowQueries();

    res.status(200).json({
      success: true,
      message: `Cleared ${count} slow queries`,
      data: { count },
    });
  } catch (error: any) {
    logger.error("Clear slow queries error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to clear slow queries",
    });
  }
}

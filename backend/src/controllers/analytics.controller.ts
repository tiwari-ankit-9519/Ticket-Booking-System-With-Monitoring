import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as analyticsService from "../services/analytics.service";
import { logger } from "../config/logger.config";

export async function getDashboardStats(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const stats = await analyticsService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Get dashboard stats error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
    });
  }
}

export async function getRevenueAnalytics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const analytics = await analyticsService.getRevenueAnalytics(
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error("Get revenue analytics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get revenue analytics",
    });
  }
}

export async function getBookingAnalytics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const analytics = await analyticsService.getBookingAnalytics(
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error("Get booking analytics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get booking analytics",
    });
  }
}

export async function getEventAnalytics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const analytics = await analyticsService.getEventAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error("Get event analytics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get event analytics",
    });
  }
}

export async function getUserAnalytics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const analytics = await analyticsService.getUserAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error("Get user analytics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get user analytics",
    });
  }
}

export async function getSystemHealth(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const health = await analyticsService.getSystemHealth();

    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    logger.error("Get system health error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get system health",
    });
  }
}

export async function getAuditLogs(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const result = await analyticsService.getAuditLogs(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get audit logs error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get audit logs",
    });
  }
}

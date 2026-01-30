import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as monitoringService from "../services/monitoring.service";
import * as errorTrackingService from "../services/error-tracking.service";
import { logger } from "../config/logger.config";

export async function getSystemMetrics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const metrics = await monitoringService.collectSystemMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error("Get system metrics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get system metrics",
    });
  }
}

export async function getDatabaseMetrics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const metrics = await monitoringService.collectDatabaseMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error("Get database metrics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get database metrics",
    });
  }
}

export async function getCacheMetrics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const metrics = await monitoringService.collectCacheMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error("Get cache metrics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get cache metrics",
    });
  }
}

export async function getApplicationMetrics(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const metrics = await monitoringService.collectApplicationMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error("Get application metrics error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get application metrics",
    });
  }
}

export async function getHealthCheck(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const health = await monitoringService.getHealthCheck();

    const statusCode = health.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === "healthy",
      data: health,
    });
  } catch (error: any) {
    logger.error("Health check error", { error: error.message });

    res.status(503).json({
      success: false,
      message: "Health check failed",
    });
  }
}

export async function getErrorStats(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const stats = await errorTrackingService.getErrorStats(timeRange);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Get error stats error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get error stats",
    });
  }
}

import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.config";
import { logUserAction } from "../services/audit.service";
import { getClientIp } from "../utils/user-agent.util";
import { AuthRequest } from "./auth.middleware";

const EXCLUDED_PATHS = [
  "/metrics",
  "/health",
  "/api/monitoring/health",
  "/api/monitoring/system",
  "/api/monitoring/database",
  "/api/monitoring/cache",
  "/api/monitoring/application",
];

function shouldSkipLogging(path: string): boolean {
  return EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
}

export async function requestTracker(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  req.headers["x-request-id"] = requestId;

  const originalSend = res.send;
  res.send = function (data: any) {
    const responseTime = Date.now() - startTime;

    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"],
      userId: req.user?.userId,
    };

    if (res.statusCode >= 400) {
      logger.warn("Request completed with error", logData);
    } else if (!shouldSkipLogging(req.path)) {
      logger.info("Request completed", logData);
    }

    if (req.user?.userId && !shouldSkipLogging(req.path)) {
      logUserAction(
        req.user.userId,
        res.statusCode >= 400 ? "API_ERROR" : "API_REQUEST",
        "SYSTEM",
        undefined,
        getClientIp(req),
        req.headers["user-agent"],
        {
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
        },
      ).catch((error) => {
        logger.error("Failed to log user action", { error: error.message });
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

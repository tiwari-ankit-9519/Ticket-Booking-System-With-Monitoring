import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.config";
import { logApiRequest } from "../services/audit.service";
import { AuthRequest } from "./auth.middleware";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  res.on("finish", async () => {
    const duration = Date.now() - startTime;
    const authReq = req as AuthRequest;

    logger.http("HTTP Request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: authReq.user?.userId,
    });

    if (process.env.ENABLE_REQUEST_LOGGING === "true") {
      await logApiRequest(req, res.statusCode, duration, authReq.user?.userId);
    }
  });

  next();
}

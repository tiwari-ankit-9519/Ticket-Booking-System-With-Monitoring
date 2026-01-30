import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.config";
import { logError } from "../services/audit.service";
import { ZodError } from "zod";

export async function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  logger.error("Error handler triggered", {
    error: error.message,
    stack:
      process.env.ENABLE_ERROR_STACK_TRACE === "true" ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  await logError(req, error, error.statusCode || 500);

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
}

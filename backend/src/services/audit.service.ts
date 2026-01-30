import { prisma } from "../config/database.config";
import { logger } from "../config/logger.config";
import { AuditLogData, AuditQueryFilters } from "../types/audit.types";
import { parseUserAgent } from "../utils/user-agent.util";
import { AuditAction, EntityType } from "../prisma/generated/prisma/client";

const EXCLUDED_ACTIONS_FROM_DB: AuditAction[] = [];

const MONITORING_ENDPOINTS = ["/metrics", "/health", "/api/monitoring"];

function shouldSkipDatabaseLog(
  action: AuditAction,
  endpoint?: string,
): boolean {
  if (EXCLUDED_ACTIONS_FROM_DB.includes(action)) {
    return true;
  }

  if (
    endpoint &&
    MONITORING_ENDPOINTS.some((path) => endpoint.startsWith(path))
  ) {
    return true;
  }

  return false;
}

export async function log(data: AuditLogData): Promise<void> {
  try {
    if (shouldSkipDatabaseLog(data.action, data.endpoint)) {
      logger.debug("Skipping database log for monitoring endpoint", {
        action: data.action,
        endpoint: data.endpoint,
      });
      return;
    }

    const deviceInfo = data.userAgent ? parseUserAgent(data.userAgent) : {};
    const auditData = {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue
        ? JSON.parse(JSON.stringify(data.oldValue))
        : null,
      newValue: data.newValue
        ? JSON.parse(JSON.stringify(data.newValue))
        : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      method: data.method,
      endpoint: data.endpoint,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      errorMessage: data.errorMessage,
      metadata: data.metadata
        ? JSON.parse(JSON.stringify(data.metadata))
        : null,
      ...deviceInfo,
    };
    await prisma.auditLog.create({ data: auditData });
    logger.debug("Audit log created", {
      action: data.action,
      entityType: data.entityType,
      userId: data.userId,
    });
  } catch (error: any) {
    logger.error("Failed to create audit log", {
      error: error.message,
      data,
    });
  }
}

export async function logUserAction(
  userId: string,
  action: AuditAction,
  entityType: EntityType,
  entityId: string | undefined,
  ipAddress: string,
  userAgent?: string,
  metadata?: any,
): Promise<void> {
  await log({
    userId,
    action,
    entityType,
    entityId,
    ipAddress,
    userAgent,
    metadata,
  });
}

export async function logApiRequest(
  req: any,
  statusCode: number,
  responseTime: number,
  userId?: string,
): Promise<void> {
  await log({
    userId,
    action: "API_REQUEST",
    entityType: "SYSTEM",
    ipAddress: req.ip || "unknown",
    userAgent: req.headers["user-agent"],
    method: req.method,
    endpoint: req.originalUrl || req.url,
    statusCode,
    responseTime,
    metadata: {
      query: req.query,
      body: sanitizeBody(req.body),
    },
  });
}

export async function logError(
  req: any,
  error: Error,
  statusCode: number = 500,
  userId?: string,
): Promise<void> {
  await log({
    userId,
    action: "API_ERROR",
    entityType: "SYSTEM",
    ipAddress: req.ip || "unknown",
    userAgent: req.headers["user-agent"],
    method: req.method,
    endpoint: req.originalUrl || req.url,
    statusCode,
    errorMessage: error.message,
    metadata: {
      stack: error.stack,
      body: sanitizeBody(req.body),
    },
  });
}

export async function logUnauthorizedAccess(
  req: any,
  reason: string,
): Promise<void> {
  await log({
    action: "UNAUTHORIZED_ACCESS",
    entityType: "SYSTEM",
    ipAddress: req.ip || "unknown",
    userAgent: req.headers["user-agent"],
    method: req.method,
    endpoint: req.originalUrl || req.url,
    statusCode: 401,
    errorMessage: reason,
  });
}

export async function logRateLimitExceeded(
  req: any,
  userId?: string,
): Promise<void> {
  await log({
    userId,
    action: "RATE_LIMIT_EXCEEDED",
    entityType: "SYSTEM",
    ipAddress: req.ip || "unknown",
    userAgent: req.headers["user-agent"],
    method: req.method,
    endpoint: req.originalUrl || req.url,
    statusCode: 429,
  });
}

export async function getUserActivityLog(userId: string, limit: number = 50) {
  return prisma.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      ipAddress: true,
      browser: true,
      os: true,
      device: true,
      country: true,
      city: true,
      createdAt: true,
    },
  });
}

export async function getAuditLogs(filters: AuditQueryFilters) {
  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = Array.isArray(filters.action)
      ? { in: filters.action }
      : filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.ipAddress) {
    where.ipAddress = filters.ipAddress;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit || 100,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const excludeMonitoring = filters.excludeMonitoring !== false;
  if (excludeMonitoring) {
    return logs.filter((log) => {
      if (!log.endpoint) return true;
      return !MONITORING_ENDPOINTS.some((path) =>
        log.endpoint?.startsWith(path),
      );
    });
  }

  return logs;
}

export async function getSuspiciousActivity(userId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      action: {
        in: ["USER_LOGIN", "UNAUTHORIZED_ACCESS", "RATE_LIMIT_EXCEEDED"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const uniqueIps = [...new Set(logs.map((log) => log.ipAddress))];
  const uniqueCountries = [
    ...new Set(logs.map((log) => log.country).filter(Boolean)),
  ];
  const failedLogins = logs.filter(
    (log) => log.action === "UNAUTHORIZED_ACCESS",
  ).length;

  return {
    totalAttempts: logs.length,
    failedLogins,
    uniqueIpAddresses: uniqueIps.length,
    uniqueCountries: uniqueCountries.length,
    recentActivity: logs.slice(0, 10),
    isSuspicious:
      uniqueIps.length > 5 || uniqueCountries.length > 3 || failedLogins > 5,
  };
}

export async function getSystemErrors(limit: number = 100) {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: ["API_ERROR", "SYSTEM_ERROR"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      endpoint: true,
      errorMessage: true,
      statusCode: true,
      ipAddress: true,
      userId: true,
      createdAt: true,
    },
  });

  return logs.filter((log) => {
    if (!log.endpoint) return true;
    return !MONITORING_ENDPOINTS.some((path) => log.endpoint?.startsWith(path));
  });
}

export async function getEntityHistory(
  entityType: EntityType,
  entityId: string,
) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function cleanupOldAuditLogs(daysToKeep: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        action: {
          in: ["API_REQUEST", "API_ERROR"],
        },
      },
    });

    logger.info("Old audit logs cleaned up", {
      deleted: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });

    return result.count;
  } catch (error: any) {
    logger.error("Failed to cleanup audit logs", { error: error.message });
    throw error;
  }
}

function sanitizeBody(body: any): any {
  if (!body) return null;
  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
    "creditCard",
    "cvv",
    "ssn",
  ];
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  });
  return sanitized;
}

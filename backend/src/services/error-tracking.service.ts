import { logger } from "../config/logger.config";
import { prisma } from "../config/database.config";

interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  stack?: string;
  metadata?: any;
}

export async function trackError(error: Error, context: ErrorContext = {}) {
  try {
    logger.error("Application error", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...context,
    });

    await prisma.auditLog.create({
      data: {
        userId: context.userId || null,
        action: "SYSTEM_ERROR",
        entityType: "SYSTEM",
        entityId: null,
        ipAddress: context.ipAddress || "unknown",
        userAgent: context.userAgent,
        method: context.method,
        endpoint: context.endpoint,
        errorMessage: error.message,
        metadata: {
          errorName: error.name,
          stack: error.stack,
          ...context.metadata,
        },
      },
    });
  } catch (trackingError: any) {
    logger.error("Failed to track error", {
      originalError: error.message,
      trackingError: trackingError.message,
    });
  }
}

export async function getErrorStats(timeRange: string = "24h") {
  try {
    const timeMap: { [key: string]: number } = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const milliseconds = timeMap[timeRange] || timeMap["24h"];
    const startDate = new Date(Date.now() - milliseconds);

    const [totalErrors, errorsByType, errorsByEndpoint] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: "SYSTEM_ERROR",
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.auditLog.groupBy({
        by: ["errorMessage"],
        where: {
          action: "SYSTEM_ERROR",
          createdAt: {
            gte: startDate,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            errorMessage: "desc",
          },
        },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ["endpoint"],
        where: {
          action: "SYSTEM_ERROR",
          createdAt: {
            gte: startDate,
          },
          endpoint: {
            not: null,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            endpoint: "desc",
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalErrors,
      errorsByType: errorsByType.map((e) => ({
        message: e.errorMessage,
        count: e._count,
      })),
      errorsByEndpoint: errorsByEndpoint.map((e) => ({
        endpoint: e.endpoint,
        count: e._count,
      })),
      timeRange,
    };
  } catch (error: any) {
    logger.error("Failed to get error stats", { error: error.message });
    throw error;
  }
}

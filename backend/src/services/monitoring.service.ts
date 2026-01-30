import os from "os";
import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    count: number;
    model: string;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  uptime: number;
  loadAverage: number[];
}

interface DatabaseMetrics {
  connections: number;
  slowQueries: number;
  avgQueryTime: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: number;
}

export async function collectSystemMetrics(): Promise<SystemMetrics> {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~((100 * idle) / total);

  return {
    timestamp: new Date(),
    cpu: {
      usage,
      count: cpus.length,
      model: cpus[0].model,
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercent: (usedMemory / totalMemory) * 100,
    },
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
  };
}

export async function collectDatabaseMetrics(): Promise<DatabaseMetrics> {
  try {
    const slowQueryThreshold = 1000;

    const recentLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
        responseTime: {
          gte: slowQueryThreshold,
        },
      },
      select: {
        responseTime: true,
      },
    });

    const avgQueryTime =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) /
          recentLogs.length
        : 0;

    return {
      connections: 0,
      slowQueries: recentLogs.length,
      avgQueryTime,
    };
  } catch (error: any) {
    logger.error("Failed to collect database metrics", {
      error: error.message,
    });
    return {
      connections: 0,
      slowQueries: 0,
      avgQueryTime: 0,
    };
  }
}

export async function collectCacheMetrics(): Promise<CacheMetrics> {
  try {
    const info = await redis.info("stats");
    const keyspace = await redis.info("keyspace");
    const memory = await redis.info("memory");

    const statsLines = info.split("\r\n");
    const hits = parseInt(
      statsLines
        .find((line) => line.startsWith("keyspace_hits:"))
        ?.split(":")[1] || "0",
    );
    const misses = parseInt(
      statsLines
        .find((line) => line.startsWith("keyspace_misses:"))
        ?.split(":")[1] || "0",
    );

    const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

    const keyspaceLines = keyspace.split("\r\n");
    const db0Line = keyspaceLines.find((line) => line.startsWith("db0:"));
    const keys = db0Line
      ? parseInt(db0Line.match(/keys=(\d+)/)?.[1] || "0")
      : 0;

    const memoryLines = memory.split("\r\n");
    const usedMemory = parseInt(
      memoryLines
        .find((line) => line.startsWith("used_memory:"))
        ?.split(":")[1] || "0",
    );

    return {
      hits,
      misses,
      hitRate,
      keys,
      memory: usedMemory,
    };
  } catch (error: any) {
    logger.error("Failed to collect cache metrics", { error: error.message });
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      keys: 0,
      memory: 0,
    };
  }
}

export async function collectApplicationMetrics() {
  try {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      totalRequests,
      errorRequests,
      avgResponseTime,
      activeUsers,
      activeBookings,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: "API_REQUEST",
          createdAt: {
            gte: last5Minutes,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: "API_ERROR",
          createdAt: {
            gte: last5Minutes,
          },
        },
      }),
      prisma.auditLog.aggregate({
        where: {
          action: "API_REQUEST",
          createdAt: {
            gte: last5Minutes,
          },
        },
        _avg: {
          responseTime: true,
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    return {
      requests: {
        total: totalRequests,
        errors: errorRequests,
        errorRate:
          totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
        avgResponseTime: avgResponseTime._avg.responseTime || 0,
      },
      users: {
        active: activeUsers,
      },
      bookings: {
        pending: activeBookings,
      },
      timestamp: now,
    };
  } catch (error: any) {
    logger.error("Failed to collect application metrics", {
      error: error.message,
    });
    throw error;
  }
}

export async function getHealthCheck() {
  try {
    const [system, database, cache, application] = await Promise.all([
      collectSystemMetrics(),
      collectDatabaseMetrics(),
      collectCacheMetrics(),
      collectApplicationMetrics(),
    ]);

    const isHealthy =
      system.memory.usagePercent < 90 &&
      system.cpu.usage < 90 &&
      cache.hitRate > 50 &&
      application.requests.errorRate < 5;

    return {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date(),
      system,
      database,
      cache,
      application,
    };
  } catch (error: any) {
    logger.error("Health check failed", { error: error.message });
    return {
      status: "unhealthy",
      timestamp: new Date(),
      error: error.message,
    };
  }
}

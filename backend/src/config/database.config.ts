import { PrismaClient } from "../prisma/generated/prisma/client";
import { logger } from "./logger.config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import {
  databaseQueryDuration,
  incrementSlowQueries,
  incrementQueryErrors,
} from "../services/prometheus.service";
import { logSlowQuery } from "../services/query-monitor.service";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const logQueries = process.env.ENABLE_QUERY_LOGGING === "true";
const SLOW_QUERY_THRESHOLD = parseInt(
  process.env.SLOW_QUERY_THRESHOLD || "1000",
);

if (!process.env.DATABASE_URL) {
  throw new Error("Please provide database URL");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg(
  new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
);

const prismaLogConfig = logQueries
  ? [
      { emit: "event" as const, level: "query" as const },
      { emit: "event" as const, level: "error" as const },
      { emit: "event" as const, level: "info" as const },
      { emit: "event" as const, level: "warn" as const },
    ]
  : [{ emit: "event" as const, level: "error" as const }];

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: prismaLogConfig,
    errorFormat: isDevelopment ? "colorless" : "minimal",
  });

if (isProduction) {
  globalForPrisma.prisma = prisma;
}

if (logQueries) {
  prisma.$on(
    "query" as never,
    ((e: any) => {
      const duration = e.duration;

      databaseQueryDuration.observe(
        { operation: e.target || "unknown" },
        duration / 1000,
      );

      if (duration > SLOW_QUERY_THRESHOLD) {
        incrementSlowQueries(e.target || "unknown");

        logSlowQuery(e.query, duration, e.target || "unknown");

        logger.warn("⚠️ Slow Query Detected", {
          query: e.query,
          params: e.params,
          duration: `${duration}ms`,
          target: e.target,
          timestamp: new Date(e.timestamp).toISOString(),
        });
      } else {
        logger.debug("Prisma Query", {
          query: e.query,
          params: e.params,
          duration: `${duration}ms`,
          timestamp: new Date(e.timestamp).toISOString(),
        });
      }
    }) as any,
  );

  prisma.$on(
    "error" as never,
    ((e: any) => {
      incrementQueryErrors(e.target || "unknown");

      logger.error("❌ Prisma Error", {
        message: e.message,
        target: e.target,
        timestamp: new Date(e.timestamp).toISOString(),
      });
    }) as any,
  );

  prisma.$on(
    "info" as never,
    ((e: any) => {
      logger.info("ℹ️ Prisma Info", {
        message: e.message,
        target: e.target,
        timestamp: new Date(e.timestamp).toISOString(),
      });
    }) as any,
  );

  prisma.$on(
    "warn" as never,
    ((e: any) => {
      logger.warn("⚠️ Prisma Warning", {
        message: e.message,
        target: e.target,
        timestamp: new Date(e.timestamp).toISOString(),
      });
    }) as any,
  );
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    const result = await prisma.$queryRaw<
      Array<{ now: Date }>
    >`SELECT NOW() as now`;
    logger.info("Database server time", { serverTime: result[0].now });

    const databaseName = await prisma.$queryRaw<
      Array<{ current_database: string }>
    >`SELECT current_database()`;
    logger.info("Connected to database", {
      database: databaseName[0].current_database,
    });

    await checkDatabaseHealth();
  } catch (error: any) {
    logger.error("❌ Database connection failed", {
      error: error.message,
      stack:
        process.env.ENABLE_ERROR_STACK_TRACE === "true"
          ? error.stack
          : undefined,
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected gracefully");
  } catch (error: any) {
    logger.error("Error disconnecting database", {
      error: error.message,
      stack:
        process.env.ENABLE_ERROR_STACK_TRACE === "true"
          ? error.stack
          : undefined,
    });
  }
}

async function checkDatabaseHealth(): Promise<void> {
  try {
    const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    const activeConnections = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    logger.debug("Database health check", {
      tables: Number(tableCount[0].count),
      activeConnections: Number(activeConnections[0].count),
    });
  } catch (error: any) {
    logger.warn("Could not perform full database health check", {
      error: error.message,
    });
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

export async function getDatabaseStats(): Promise<{
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalAuditLogs: number;
}> {
  try {
    const [users, events, bookings, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.auditLog.count(),
    ]);

    return {
      totalUsers: users,
      totalEvents: events,
      totalBookings: bookings,
      totalAuditLogs: auditLogs,
    };
  } catch (error: any) {
    logger.error("Failed to get database stats", { error: error.message });
    return {
      totalUsers: 0,
      totalEvents: 0,
      totalBookings: 0,
      totalAuditLogs: 0,
    };
  }
}

process.on("beforeExit", async () => {
  await disconnectDatabase();
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received - shutting down database connection");
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received - shutting down database connection");
  await disconnectDatabase();
  process.exit(0);
});

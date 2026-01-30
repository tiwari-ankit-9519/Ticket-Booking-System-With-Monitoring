import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  operation: string;
  count: number;
}

const SLOW_QUERY_THRESHOLD = 1000;
const SLOW_QUERY_KEY = "slow-queries";

export async function logSlowQuery(
  query: string,
  duration: number,
  operation: string,
) {
  try {
    if (duration < SLOW_QUERY_THRESHOLD) {
      return;
    }

    const queryHash = hashQuery(query);
    const key = `${SLOW_QUERY_KEY}:${queryHash}`;

    const existing = await redis.get(key);
    const slowQuery: SlowQuery = existing
      ? JSON.parse(existing)
      : {
          query: sanitizeQuery(query),
          duration,
          timestamp: new Date(),
          operation,
          count: 0,
        };

    slowQuery.count += 1;
    slowQuery.duration = Math.max(slowQuery.duration, duration);
    slowQuery.timestamp = new Date();

    await redis.setex(key, 86400, JSON.stringify(slowQuery));

    logger.warn("Slow query logged", {
      operation,
      duration: `${duration}ms`,
      occurrences: slowQuery.count,
    });
  } catch (error: any) {
    logger.error("Failed to log slow query", { error: error.message });
  }
}

export async function getSlowQueries(limit: number = 50) {
  try {
    const keys = await redis.keys(`${SLOW_QUERY_KEY}:*`);
    const queries: SlowQuery[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        queries.push(JSON.parse(data));
      }
    }

    return queries.sort((a, b) => b.duration - a.duration).slice(0, limit);
  } catch (error: any) {
    logger.error("Failed to get slow queries", { error: error.message });
    return [];
  }
}

export async function getQueryStats() {
  try {
    const queries = await getSlowQueries(100);

    const stats = {
      totalSlowQueries: queries.length,
      slowestQuery: queries[0] || null,
      averageDuration:
        queries.length > 0
          ? queries.reduce((sum, q) => sum + q.duration, 0) / queries.length
          : 0,
      byOperation: queries.reduce(
        (acc, q) => {
          acc[q.operation] = (acc[q.operation] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return stats;
  } catch (error: any) {
    logger.error("Failed to get query stats", { error: error.message });
    throw error;
  }
}

export async function clearSlowQueries() {
  try {
    const keys = await redis.keys(`${SLOW_QUERY_KEY}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    logger.info("Slow queries cleared", { count: keys.length });
    return keys.length;
  } catch (error: any) {
    logger.error("Failed to clear slow queries", { error: error.message });
    throw error;
  }
}

function hashQuery(query: string): string {
  return Buffer.from(query).toString("base64").substring(0, 32);
}

function sanitizeQuery(query: string): string {
  return query
    .replace(/\$\d+/g, "?")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 500);
}

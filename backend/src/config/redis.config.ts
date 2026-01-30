import Redis from "ioredis";
import { logger } from "./logger.config";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn("Redis connection retry attempt", { attempt: times, delay });
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      logger.error("Redis READONLY error, reconnecting", {
        error: err.message,
      });
      return true;
    }
    return false;
  },
});

export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

redis.on("connect", () => {
  logger.info("✅ Redis connected successfully");
});

redis.on("ready", () => {
  logger.info("Redis client is ready");
});

redis.on("error", (error) => {
  logger.error("❌ Redis connection error", {
    error: error.message,
    stack:
      process.env.ENABLE_ERROR_STACK_TRACE === "true" ? error.stack : undefined,
  });
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

redis.on("reconnecting", () => {
  logger.info("Redis reconnecting...");
});

redis.on("end", () => {
  logger.warn("Redis connection ended");
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    logger.info("Redis ping successful");

    const info = await redis.info("server");
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    logger.info("Redis version", { version });
  } catch (error: any) {
    logger.error("Failed to connect to Redis", {
      error: error.message,
      stack:
        process.env.ENABLE_ERROR_STACK_TRACE === "true"
          ? error.stack
          : undefined,
    });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info("Redis disconnected gracefully");
  } catch (error: any) {
    logger.error("Error disconnecting Redis", {
      error: error.message,
    });
  }
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    return false;
  }
}

process.on("SIGINT", async () => {
  logger.info("SIGINT received - shutting down Redis connection");
  await disconnectRedis();
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received - shutting down Redis connection");
  await disconnectRedis();
});

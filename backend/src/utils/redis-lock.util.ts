import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

export async function acquireLock(
  key: string,
  ttl: number = 10,
): Promise<boolean> {
  try {
    const result = await redis.set(key, "1", "EX", ttl, "NX");
    return result === "OK";
  } catch (error: any) {
    logger.error("Failed to acquire lock", { error: error.message, key });
    return false;
  }
}

export async function releaseLock(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error: any) {
    logger.error("Failed to release lock", { error: error.message, key });
  }
}

export async function withLock<T>(
  key: string,
  ttl: number,
  operation: () => Promise<T>,
): Promise<T> {
  const lockAcquired = await acquireLock(key, ttl);

  if (!lockAcquired) {
    throw new Error("Could not acquire lock. Please try again.");
  }

  try {
    const result = await operation();
    return result;
  } finally {
    await releaseLock(key);
  }
}

import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis.config";
import { logger } from "@/config/logger.config";

export interface EmailJob {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  priority?: number;
}

export const emailQueue = new Queue("email", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

emailQueue.on("error", (error) => {
  logger.error("Email queue error", { error: error.message });
});

export async function addEmailToQueue(data: EmailJob) {
  try {
    const job = await emailQueue.add("send-email", data, {
      priority: data.priority || 5,
    });

    logger.debug("Email job added to queue", {
      jobId: job.id,
      to: data.to,
      subject: data.subject,
    });

    return job;
  } catch (error: any) {
    logger.error("Failed to add email to queue", {
      error: error.message,
      to: data.to,
    });
    throw error;
  }
}

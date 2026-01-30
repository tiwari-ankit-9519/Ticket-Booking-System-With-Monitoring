import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config";
import { emailTransporter } from "../config/email.config";
import { logger } from "../config/logger.config";
import { EmailJob } from "../queues/email.queue";

export const emailWorker = new Worker(
  "email",
  async (job: Job<EmailJob>) => {
    const { to, subject, text, html } = job.data;

    logger.info("Processing email job", {
      jobId: job.id,
      to,
      subject,
      attempt: job.attemptsMade + 1,
    });

    if (!emailTransporter) {
      logger.warn("Email not configured. Skipping email send.", {
        jobId: job.id,
        to,
        subject,
      });
      return { success: false, reason: "Email not configured" };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        text,
        html: html || text,
      };

      const info = await emailTransporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        jobId: job.id,
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      return {
        success: true,
        messageId: info.messageId,
        to: mailOptions.to,
      };
    } catch (error: any) {
      logger.error("Failed to send email", {
        jobId: job.id,
        error: error.message,
        to,
        subject,
        attempt: job.attemptsMade + 1,
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

emailWorker.on("completed", (job) => {
  logger.info("Email job completed", {
    jobId: job.id,
    result: job.returnvalue,
  });
});

emailWorker.on("failed", (job, error) => {
  logger.error("Email job failed", {
    jobId: job?.id,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});

emailWorker.on("error", (error) => {
  logger.error("Email worker error", { error: error.message });
});

logger.info("Email worker started");

import "dotenv/config";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "@/config/database.config";
import { connectRedis, disconnectRedis } from "@/config/redis.config";
import { logger } from "./config/logger.config";
import { cleanupExpiredTokens } from "./services/auth.service";
import "./workers/email.worker";
import { initializeScheduledJobs } from "./services/scheduler.service";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    initializeScheduledJobs();

    setInterval(
      async () => {
        await cleanupExpiredTokens();
      },
      60 * 60 * 1000,
    );

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        await disconnectDatabase();
        await disconnectRedis();

        logger.info("Graceful shutdown complete");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection", { reason, promise });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

startServer();

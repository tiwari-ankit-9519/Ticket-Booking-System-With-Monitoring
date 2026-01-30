import cron from "node-cron";
import { prisma } from "../config/database.config";
import { logger } from "../config/logger.config";
import { createNotification } from "./notification.service";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { cleanupOldAuditLogs } from "./audit.service";
import {
  setActiveBookings,
  setTotalRevenue,
  setActiveUsers,
  setCacheHitRate,
} from "./prometheus.service";
import { redis } from "../config/redis.config";
import { generatePerformanceReport } from "./database-report.service";

export function initializeScheduledJobs() {
  logger.info("Initializing scheduled jobs...");

  eventReminders();
  expireOldBookings();
  cleanupOldSessions();
  cleanupAuditLogs();
  generateDailyReports();
  collectMetrics();
  generateDailyDatabaseReport();

  logger.info("Scheduled jobs initialized successfully");
}

function generateDailyDatabaseReport() {
  cron.schedule("0 1 * * *", async () => {
    try {
      logger.info("Generating daily database report...");

      const report = await generatePerformanceReport();

      logger.info("Daily database report generated", {
        slowQueries: report.slowQueries.length,
        cacheHitRate: report.cacheHitRate.rate,
        recommendations: report.recommendations.length,
      });
    } catch (error: any) {
      logger.error("Daily database report failed", { error: error.message });
    }
  });
}

function eventReminders() {
  cron.schedule("0 9 * * *", async () => {
    try {
      logger.info("Running event reminder job...");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          event: {
            eventDate: {
              gte: tomorrow,
              lte: tomorrowEnd,
            },
          },
        },
        include: {
          event: {
            select: {
              title: true,
              eventDate: true,
              venue: true,
              address: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
            },
          },
        },
      });

      for (const booking of upcomingBookings) {
        await createNotification(
          booking.userId,
          "Event Reminder 📅",
          `Your event "${booking.event.title}" is tomorrow at ${new Date(
            booking.event.eventDate,
          ).toLocaleTimeString()}. Venue: ${booking.event.venue}`,
          NotificationType.EVENT_REMINDER,
          {
            bookingId: booking.id,
            eventTitle: booking.event.title,
          },
        );
      }

      logger.info(`Sent ${upcomingBookings.length} event reminders`);
    } catch (error: any) {
      logger.error("Event reminder job failed", { error: error.message });
    }
  });
}

function expireOldBookings() {
  cron.schedule("0 */6 * * *", async () => {
    try {
      logger.info("Running expire old bookings job...");

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const expiredBookings = await prisma.booking.updateMany({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          createdAt: {
            lte: thirtyMinutesAgo,
          },
        },
        data: {
          status: "EXPIRED",
          cancelledAt: new Date(),
          cancellationReason: "Payment not completed within 30 minutes",
        },
      });

      if (expiredBookings.count > 0) {
        const bookingsToRelease = await prisma.booking.findMany({
          where: {
            status: "EXPIRED",
            cancelledAt: {
              gte: new Date(Date.now() - 1000),
            },
          },
          select: {
            eventId: true,
            seatsBooked: true,
          },
        });

        for (const booking of bookingsToRelease) {
          await prisma.event.update({
            where: { id: booking.eventId },
            data: {
              availableSeats: {
                increment: booking.seatsBooked,
              },
            },
          });
        }
      }

      logger.info(`Expired ${expiredBookings.count} old bookings`);
    } catch (error: any) {
      logger.error("Expire old bookings job failed", { error: error.message });
    }
  });
}

function cleanupOldSessions() {
  cron.schedule("0 2 * * *", async () => {
    try {
      logger.info("Running cleanup old sessions job...");

      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
        },
      });

      logger.info(`Cleaned up ${result.count} old sessions`);
    } catch (error: any) {
      logger.error("Cleanup old sessions job failed", { error: error.message });
    }
  });
}

function cleanupAuditLogs() {
  cron.schedule("0 3 * * 0", async () => {
    try {
      logger.info("Running cleanup audit logs job...");

      const deletedCount = await cleanupOldAuditLogs(90);

      logger.info(`Cleaned up ${deletedCount} old audit logs`);
    } catch (error: any) {
      logger.error("Cleanup audit logs job failed", { error: error.message });
    }
  });
}

function generateDailyReports() {
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info("Running daily report generation job...");

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const [newUsers, newBookings, revenue, newEvents] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: yesterday,
              lte: yesterdayEnd,
            },
          },
        }),
        prisma.booking.count({
          where: {
            createdAt: {
              gte: yesterday,
              lte: yesterdayEnd,
            },
          },
        }),
        prisma.booking.aggregate({
          where: {
            paymentStatus: "COMPLETED",
            paidAt: {
              gte: yesterday,
              lte: yesterdayEnd,
            },
          },
          _sum: {
            totalPrice: true,
          },
        }),
        prisma.event.count({
          where: {
            createdAt: {
              gte: yesterday,
              lte: yesterdayEnd,
            },
          },
        }),
      ]);

      logger.info("Daily report generated", {
        date: yesterday.toISOString().split("T")[0],
        newUsers,
        newBookings,
        revenue: parseFloat(revenue._sum.totalPrice?.toString() || "0"),
        newEvents,
      });
    } catch (error: any) {
      logger.error("Daily report generation failed", { error: error.message });
    }
  });
}

function collectMetrics() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.debug("Collecting Prometheus metrics...");

      const [activeBookingsCount, totalRevenueResult, activeUsersCount] =
        await Promise.all([
          prisma.booking.count({
            where: { status: "PENDING" },
          }),
          prisma.booking.aggregate({
            where: { paymentStatus: "COMPLETED" },
            _sum: { totalPrice: true },
          }),
          prisma.user.count({
            where: {
              lastLoginAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

      setActiveBookings(activeBookingsCount);
      setTotalRevenue(
        parseFloat(totalRevenueResult._sum.totalPrice?.toString() || "0"),
      );
      setActiveUsers(activeUsersCount);

      const info = await redis.info("stats");
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
      setCacheHitRate(hitRate);

      logger.debug("Metrics collected successfully", {
        activeBookings: activeBookingsCount,
        totalRevenue: parseFloat(
          totalRevenueResult._sum.totalPrice?.toString() || "0",
        ),
        activeUsers: activeUsersCount,
        cacheHitRate: hitRate,
      });
    } catch (error: any) {
      logger.error("Metrics collection failed", { error: error.message });
    }
  });
}

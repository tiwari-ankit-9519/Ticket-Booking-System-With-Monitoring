import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

export async function getDashboardStats() {
  try {
    const cacheKey = "analytics:dashboard:stats";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalEvents,
      totalBookings,
      totalRevenue,
      activeUsers,
      publishedEvents,
      upcomingEvents,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      monthlyRevenue,
      weeklyRevenue,
      newUsersThisMonth,
      newUsersThisWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { paymentStatus: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          eventDate: { gte: now },
        },
      }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.aggregate({
        where: {
          paymentStatus: "COMPLETED",
          createdAt: { gte: lastMonth },
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: {
          paymentStatus: "COMPLETED",
          createdAt: { gte: lastWeek },
        },
        _sum: { totalPrice: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastMonth } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastWeek } },
      }),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
      },
      events: {
        total: totalEvents,
        published: publishedEvents,
        upcoming: upcomingEvents,
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
      },
      revenue: {
        total: parseFloat(totalRevenue._sum.totalPrice?.toString() || "0"),
        monthly: parseFloat(monthlyRevenue._sum.totalPrice?.toString() || "0"),
        weekly: parseFloat(weeklyRevenue._sum.totalPrice?.toString() || "0"),
      },
    };

    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    return stats;
  } catch (error: any) {
    logger.error("Failed to get dashboard stats", { error: error.message });
    throw error;
  }
}

export async function getRevenueAnalytics(startDate: Date, endDate: Date) {
  try {
    const cacheKey = `analytics:revenue:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: "COMPLETED",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalPrice: true,
        paidAt: true,
        paymentMethod: true,
      },
    });

    const dailyRevenue: { [key: string]: number } = {};
    const paymentMethodRevenue: { [key: string]: number } = {};

    bookings.forEach((booking) => {
      const date = booking.paidAt?.toISOString().split("T")[0] || "";
      const amount = parseFloat(booking.totalPrice.toString());

      dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;

      if (booking.paymentMethod) {
        paymentMethodRevenue[booking.paymentMethod] =
          (paymentMethodRevenue[booking.paymentMethod] || 0) + amount;
      }
    });

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + parseFloat(booking.totalPrice.toString()),
      0,
    );

    const analytics = {
      totalRevenue,
      totalBookings: bookings.length,
      dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue,
      })),
      paymentMethods: Object.entries(paymentMethodRevenue).map(
        ([method, revenue]) => ({
          method,
          revenue,
        }),
      ),
    };

    await redis.setex(cacheKey, 600, JSON.stringify(analytics));

    return analytics;
  } catch (error: any) {
    logger.error("Failed to get revenue analytics", { error: error.message });
    throw error;
  }
}

export async function getBookingAnalytics(startDate: Date, endDate: Date) {
  try {
    const cacheKey = `analytics:bookings:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const bookings = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
      _sum: {
        totalPrice: true,
        seatsBooked: true,
      },
    });

    const statusBreakdown = bookings.map((item) => ({
      status: item.status,
      count: item._count,
      revenue: parseFloat(item._sum.totalPrice?.toString() || "0"),
      seats: item._sum.seatsBooked || 0,
    }));

    const dailyBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const dailyStats: { [key: string]: { [status: string]: number } } = {};

    dailyBookings.forEach((booking) => {
      const date = booking.createdAt.toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {};
      }
      dailyStats[date][booking.status] =
        (dailyStats[date][booking.status] || 0) + 1;
    });

    const analytics = {
      statusBreakdown,
      dailyBookings: Object.entries(dailyStats).map(([date, statuses]) => ({
        date,
        ...statuses,
      })),
    };

    await redis.setex(cacheKey, 600, JSON.stringify(analytics));

    return analytics;
  } catch (error: any) {
    logger.error("Failed to get booking analytics", { error: error.message });
    throw error;
  }
}

export async function getEventAnalytics() {
  try {
    const cacheKey = "analytics:events";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [categoryStats, statusStats, topEvents] = await Promise.all([
      prisma.event.groupBy({
        by: ["category"],
        _count: true,
        _sum: {
          totalSeats: true,
          availableSeats: true,
        },
      }),
      prisma.event.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.event.findMany({
        where: {
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          totalSeats: true,
          availableSeats: true,
          pricePerSeat: true,
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: {
          bookings: {
            _count: "desc",
          },
        },
        take: 10,
      }),
    ]);

    const categoryBreakdown = categoryStats.map((item) => ({
      category: item.category,
      count: item._count,
      totalSeats: item._sum.totalSeats || 0,
      bookedSeats:
        (item._sum.totalSeats || 0) - (item._sum.availableSeats || 0),
      availableSeats: item._sum.availableSeats || 0,
    }));

    const statusBreakdown = statusStats.map((item) => ({
      status: item.status,
      count: item._count,
    }));

    const topEventsList = topEvents.map((event) => ({
      id: event.id,
      title: event.title,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      bookedSeats: event.totalSeats - event.availableSeats,
      occupancyRate:
        ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100,
      totalBookings: event._count.bookings,
      revenue:
        parseFloat(event.pricePerSeat.toString()) *
        (event.totalSeats - event.availableSeats),
    }));

    const analytics = {
      categoryBreakdown,
      statusBreakdown,
      topEvents: topEventsList,
    };

    await redis.setex(cacheKey, 600, JSON.stringify(analytics));

    return analytics;
  } catch (error: any) {
    logger.error("Failed to get event analytics", { error: error.message });
    throw error;
  }
}

export async function getUserAnalytics() {
  try {
    const cacheKey = "analytics:users";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [roleStats, activityStats, topUsers, registrationTrend] =
      await Promise.all([
        prisma.user.groupBy({
          by: ["role"],
          _count: true,
        }),
        prisma.user.groupBy({
          by: ["isActive"],
          _count: true,
        }),
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            _count: {
              select: { bookings: true },
            },
            bookings: {
              where: {
                paymentStatus: "COMPLETED",
              },
              select: {
                totalPrice: true,
              },
            },
          },
          orderBy: {
            bookings: {
              _count: "desc",
            },
          },
          take: 10,
        }),
        prisma.user.findMany({
          where: {
            createdAt: {
              gte: last30Days,
            },
          },
          select: {
            createdAt: true,
          },
        }),
      ]);

    const roleBreakdown = roleStats.map((item) => ({
      role: item.role,
      count: item._count,
    }));

    const activityBreakdown = activityStats.map((item) => ({
      active: item.isActive,
      count: item._count,
    }));

    const topUsersList = topUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      totalBookings: user._count.bookings,
      totalSpent: user.bookings.reduce(
        (sum, booking) => sum + parseFloat(booking.totalPrice.toString()),
        0,
      ),
    }));

    const dailyRegistrations: { [key: string]: number } = {};
    registrationTrend.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0];
      dailyRegistrations[date] = (dailyRegistrations[date] || 0) + 1;
    });

    const analytics = {
      roleBreakdown,
      activityBreakdown,
      topUsers: topUsersList,
      registrationTrend: Object.entries(dailyRegistrations).map(
        ([date, count]) => ({
          date,
          count,
        }),
      ),
    };

    await redis.setex(cacheKey, 600, JSON.stringify(analytics));

    return analytics;
  } catch (error: any) {
    logger.error("Failed to get user analytics", { error: error.message });
    throw error;
  }
}

export async function getSystemHealth() {
  try {
    const [
      dbHealth,
      redisHealth,
      failedPayments,
      pendingBookings,
      recentErrors,
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      prisma.booking.count({
        where: {
          paymentStatus: "FAILED",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: "PENDING",
          createdAt: {
            lte: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: "SYSTEM_ERROR",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      database: dbHealth,
      redis: redisHealth,
      failedPayments,
      staleBookings: pendingBookings,
      recentErrors,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error("Failed to get system health", { error: error.message });
    throw error;
  }
}

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", latency: 0 };
  } catch (error: any) {
    return { status: "unhealthy", error: error.message };
  }
}

async function checkRedisHealth() {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch (error: any) {
    return { status: "unhealthy", error: error.message };
  }
}

export async function getAuditLogs(filters: any = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      entityType,
      startDate,
      endDate,
      excludeMonitoring = true,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (excludeMonitoring) {
      where.NOT = {
        endpoint: {
          in: ["/metrics", "/health"],
        },
      };
      where.OR = [
        { endpoint: { not: { startsWith: "/api/monitoring" } } },
        { endpoint: null },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get audit logs", { error: error.message });
    throw error;
  }
}

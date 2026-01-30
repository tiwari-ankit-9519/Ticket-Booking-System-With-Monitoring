import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";
import {
  CreateOrganizerProfileInput,
  UpdateOrganizerProfileInput,
} from "../validations/organizer.validation";
import { logUserAction } from "./audit.service";
import { OrganizerVerificationStatus } from "../prisma/generated/prisma/client";
import * as notificationService from "./notification.service";

export async function createOrganizerProfile(
  userId: string,
  data: CreateOrganizerProfileInput & { verificationDocuments?: string[] },
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizerProfile: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizerProfile) {
      throw new Error("Organizer profile already exists");
    }

    if (user.role === "ORGANIZER") {
      throw new Error("User is already an organizer");
    }

    const profile = await prisma.organizerProfile.create({
      data: {
        userId,
        businessName: data.businessName,
        businessRegistration: data.businessRegistration,
        taxId: data.taxId,
        website: data.website,
        socialMediaLinks: data.socialMediaLinks || {},
        description: data.description,
        businessAddress: data.businessAddress,
        businessCity: data.businessCity,
        businessState: data.businessState,
        businessCountry: data.businessCountry,
        verificationDocuments: data.verificationDocuments || [],
        verificationStatus: "PENDING",
      },
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
    });

    await notificationService.notifyOrganizerRequestReceived(userId);

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });

    const adminIds = admins.map((admin) => admin.id);
    const userName = `${user.firstName} ${user.lastName}`;

    if (adminIds.length > 0) {
      await notificationService.notifyAdminNewOrganizerRequest(
        adminIds,
        userName,
        data.businessName,
      );
    }

    await logUserAction(
      userId,
      "ORGANIZER_REQUEST",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { businessName: data.businessName },
    );

    await invalidateOrganizerCaches();

    logger.info("Organizer profile created", { userId, profileId: profile.id });

    return profile;
  } catch (error: any) {
    logger.error("Failed to create organizer profile", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function getOrganizerProfile(userId: string) {
  try {
    const cacheKey = `organizer:profile:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    await redis.setex(cacheKey, 1800, JSON.stringify(profile));

    return profile;
  } catch (error: any) {
    logger.error("Failed to get organizer profile", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function updateOrganizerProfile(
  userId: string,
  data: UpdateOrganizerProfileInput & { verificationDocuments?: string[] },
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const existingProfile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new Error("Organizer profile not found");
    }

    if (existingProfile.verificationStatus === "APPROVED") {
      throw new Error(
        "Cannot update approved organizer profile. Contact support.",
      );
    }

    const profile = await prisma.organizerProfile.update({
      where: { userId },
      data: {
        businessName: data.businessName,
        businessRegistration: data.businessRegistration,
        taxId: data.taxId,
        website: data.website,
        socialMediaLinks: data.socialMediaLinks,
        description: data.description,
        businessAddress: data.businessAddress,
        businessCity: data.businessCity,
        businessState: data.businessState,
        businessCountry: data.businessCountry,
        verificationDocuments: data.verificationDocuments,
      },
    });

    await logUserAction(
      userId,
      "ORGANIZER_UPDATE",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { businessName: data.businessName },
    );

    await invalidateOrganizerCaches(userId);

    logger.info("Organizer profile updated", { userId, profileId: profile.id });

    return profile;
  } catch (error: any) {
    logger.error("Failed to update organizer profile", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function getPendingOrganizers(
  page: number = 1,
  limit: number = 20,
) {
  try {
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      prisma.organizerProfile.findMany({
        where: { verificationStatus: "PENDING" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.organizerProfile.count({
        where: { verificationStatus: "PENDING" },
      }),
    ]);

    return {
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get pending organizers", { error: error.message });
    throw error;
  }
}

export async function getAllOrganizers(
  status?: OrganizerVerificationStatus,
  page: number = 1,
  limit: number = 20,
) {
  try {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.verificationStatus = status;
    }

    const [profiles, total] = await Promise.all([
      prisma.organizerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.organizerProfile.count({ where }),
    ]);

    return {
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get all organizers", { error: error.message });
    throw error;
  }
}

export async function approveOrganizer(
  userId: string,
  adminId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    if (profile.verificationStatus === "APPROVED") {
      throw new Error("Organizer already approved");
    }

    const [updatedProfile] = await prisma.$transaction([
      prisma.organizerProfile.update({
        where: { userId },
        data: {
          verificationStatus: "APPROVED",
          approvedBy: adminId,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: "ORGANIZER" },
      }),
    ]);

    await notificationService.notifyOrganizerApproved(
      userId,
      profile.businessName,
    );

    await logUserAction(
      adminId,
      "ORGANIZER_APPROVE",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { businessName: profile.businessName },
    );

    await invalidateOrganizerCaches(userId);

    logger.info("Organizer approved", { userId, adminId });

    return updatedProfile;
  } catch (error: any) {
    logger.error("Failed to approve organizer", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function rejectOrganizer(
  userId: string,
  reason: string,
  adminId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    if (profile.verificationStatus === "APPROVED") {
      throw new Error("Cannot reject approved organizer");
    }

    const updatedProfile = await prisma.organizerProfile.update({
      where: { userId },
      data: {
        verificationStatus: "REJECTED",
        rejectionReason: reason,
      },
    });

    await notificationService.notifyOrganizerRejected(
      userId,
      profile.businessName,
      reason,
    );

    await logUserAction(
      adminId,
      "ORGANIZER_REJECT",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { businessName: profile.businessName, reason },
    );

    await invalidateOrganizerCaches(userId);

    logger.info("Organizer rejected", { userId, adminId, reason });

    return updatedProfile;
  } catch (error: any) {
    logger.error("Failed to reject organizer", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function suspendOrganizer(
  userId: string,
  reason: string,
  adminId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    if (profile.verificationStatus !== "APPROVED") {
      throw new Error("Can only suspend approved organizers");
    }

    const [updatedProfile] = await prisma.$transaction([
      prisma.organizerProfile.update({
        where: { userId },
        data: {
          verificationStatus: "SUSPENDED",
          suspendedBy: adminId,
          suspendedAt: new Date(),
          suspensionReason: reason,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: "USER" },
      }),
    ]);

    await notificationService.notifyOrganizerSuspended(
      userId,
      profile.businessName,
      reason,
    );

    await logUserAction(
      adminId,
      "ORGANIZER_SUSPEND",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { businessName: profile.businessName, reason },
    );

    await invalidateOrganizerCaches(userId);

    logger.info("Organizer suspended", { userId, adminId, reason });

    return updatedProfile;
  } catch (error: any) {
    logger.error("Failed to suspend organizer", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function reactivateOrganizer(
  userId: string,
  adminId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error("Organizer profile not found");
    }

    if (profile.verificationStatus !== "SUSPENDED") {
      throw new Error("Can only reactivate suspended organizers");
    }

    const [updatedProfile] = await prisma.$transaction([
      prisma.organizerProfile.update({
        where: { userId },
        data: {
          verificationStatus: "APPROVED",
          suspendedBy: null,
          suspendedAt: null,
          suspensionReason: null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: "ORGANIZER" },
      }),
    ]);

    await notificationService.notifyOrganizerReactivated(
      userId,
      profile.businessName,
    );

    await logUserAction(
      adminId,
      "ORGANIZER_REACTIVATE",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { businessName: profile.businessName },
    );

    await invalidateOrganizerCaches(userId);

    logger.info("Organizer reactivated", { userId, adminId });

    return updatedProfile;
  } catch (error: any) {
    logger.error("Failed to reactivate organizer", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function getOrganizerStats() {
  try {
    const cacheKey = "organizer:stats";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [
      totalOrganizers,
      pendingApprovals,
      approvedOrganizers,
      rejectedOrganizers,
      suspendedOrganizers,
    ] = await Promise.all([
      prisma.organizerProfile.count(),
      prisma.organizerProfile.count({
        where: { verificationStatus: "PENDING" },
      }),
      prisma.organizerProfile.count({
        where: { verificationStatus: "APPROVED" },
      }),
      prisma.organizerProfile.count({
        where: { verificationStatus: "REJECTED" },
      }),
      prisma.organizerProfile.count({
        where: { verificationStatus: "SUSPENDED" },
      }),
    ]);

    const stats = {
      totalOrganizers,
      pendingApprovals,
      approvedOrganizers,
      rejectedOrganizers,
      suspendedOrganizers,
    };

    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    return stats;
  } catch (error: any) {
    logger.error("Failed to get organizer stats", { error: error.message });
    throw error;
  }
}

export async function updateOrganizerStatistics(userId: string) {
  try {
    const [eventsCreated, eventsPublished, eventsCompleted, totalRevenue] =
      await Promise.all([
        prisma.event.count({ where: { createdBy: userId } }),
        prisma.event.count({
          where: { createdBy: userId, status: "PUBLISHED" },
        }),
        prisma.event.count({
          where: {
            createdBy: userId,
            status: "COMPLETED",
          },
        }),
        prisma.booking.aggregate({
          where: {
            event: { createdBy: userId },
            status: "CONFIRMED",
          },
          _sum: { totalPrice: true },
        }),
      ]);

    const reputationScore = calculateReputationScore(
      eventsCreated,
      eventsCompleted,
      eventsPublished,
    );

    await prisma.organizerProfile.update({
      where: { userId },
      data: {
        eventsCreated,
        eventsPublished,
        eventsCompleted,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        reputationScore,
      },
    });

    await invalidateOrganizerCaches(userId);

    logger.info("Organizer statistics updated", { userId });
  } catch (error: any) {
    logger.error("Failed to update organizer statistics", {
      error: error.message,
      userId,
    });
  }
}

function calculateReputationScore(
  eventsCreated: number,
  eventsCompleted: number,
  eventsPublished: number,
): number {
  if (eventsCreated === 0) return 0;

  const completionRate = eventsCompleted / eventsCreated;
  const publishRate = eventsPublished / eventsCreated;

  const score =
    completionRate * 50 + publishRate * 30 + Math.min(eventsCreated * 2, 20);

  return Math.min(Math.round(score), 100);
}

async function invalidateOrganizerCaches(userId?: string) {
  try {
    const keysToDelete = ["organizer:stats"];

    if (userId) {
      keysToDelete.push(`organizer:profile:${userId}`);
    }

    for (const key of keysToDelete) {
      await redis.del(key);
    }

    logger.debug("Organizer caches invalidated", { userId });
  } catch (error: any) {
    logger.error("Failed to invalidate organizer caches", {
      error: error.message,
    });
  }
}

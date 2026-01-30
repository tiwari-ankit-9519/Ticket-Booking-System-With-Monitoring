import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";
import { NotificationType } from "@/prisma/generated/prisma/enums";
import { incrementNotificationsSent } from "./prometheus.service";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  metadata?: any,
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata,
      },
    });

    await publishNotificationEvent(userId, notification);
    incrementNotificationsSent(type);

    logger.info("Notification created", {
      notificationId: notification.id,
      userId,
      type,
    });

    return notification;
  } catch (error: any) {
    logger.error("Failed to create notification", {
      error: error.message,
      userId,
      type,
    });
    throw error;
  }
}

export async function notifyOrganizerRequestReceived(userId: string) {
  return createNotification(
    userId,
    "Organizer Request Submitted",
    "Your request to become an organizer has been received and is pending admin review. We will notify you once your request is reviewed.",
    "SYSTEM_ANNOUNCEMENT",
    { action: "organizer_request_submitted" },
  );
}

export async function notifyOrganizerApproved(
  userId: string,
  businessName: string,
) {
  return createNotification(
    userId,
    "Organizer Request Approved! 🎉",
    `Congratulations! Your organizer request for "${businessName}" has been approved. You can now create and manage events.`,
    "SYSTEM_ANNOUNCEMENT",
    { action: "organizer_approved", businessName },
  );
}

export async function notifyOrganizerRejected(
  userId: string,
  businessName: string,
  reason: string,
) {
  return createNotification(
    userId,
    "Organizer Request Rejected",
    `Unfortunately, your organizer request for "${businessName}" has been rejected. Reason: ${reason}. You can update your profile and resubmit if you wish.`,
    "SYSTEM_ANNOUNCEMENT",
    { action: "organizer_rejected", businessName, reason },
  );
}

export async function notifyOrganizerSuspended(
  userId: string,
  businessName: string,
  reason: string,
) {
  return createNotification(
    userId,
    "Organizer Account Suspended ⚠️",
    `Your organizer account "${businessName}" has been suspended. Reason: ${reason}. Please contact support for more information.`,
    "SYSTEM_ANNOUNCEMENT",
    { action: "organizer_suspended", businessName, reason },
  );
}

export async function notifyOrganizerReactivated(
  userId: string,
  businessName: string,
) {
  return createNotification(
    userId,
    "Organizer Account Reactivated",
    `Good news! Your organizer account "${businessName}" has been reactivated. You can now create and manage events again.`,
    "SYSTEM_ANNOUNCEMENT",
    { action: "organizer_reactivated", businessName },
  );
}

export async function notifyEventPublished(userId: string, eventTitle: string) {
  return createNotification(
    userId,
    "Event Published Successfully",
    `Your event "${eventTitle}" has been published and is now visible to users. Start promoting it to get bookings!`,
    "EVENT_UPDATED",
    { action: "event_published", eventTitle },
  );
}

export async function notifyEventUnpublished(
  userId: string,
  eventTitle: string,
  reason?: string,
) {
  const message = reason
    ? `Your event "${eventTitle}" has been unpublished. Reason: ${reason}.`
    : `Your event "${eventTitle}" has been unpublished.`;

  return createNotification(
    userId,
    "Event Unpublished",
    message,
    "EVENT_REMINDER",
    { action: "event_unpublished", eventTitle, reason },
  );
}

export async function notifyEventBooking(
  userId: string,
  eventTitle: string,
  seatsBooked: number,
  bookingReference: string,
) {
  return createNotification(
    userId,
    "New Booking Received! 🎫",
    `Someone just booked ${seatsBooked} seat(s) for your event "${eventTitle}". Booking reference: ${bookingReference}`,
    "BOOKING_CONFIRMED",
    {
      action: "event_booking_received",
      eventTitle,
      seatsBooked,
      bookingReference,
    },
  );
}

export async function notifyEventCancellation(
  userId: string,
  eventTitle: string,
  seatsReleased: number,
  bookingReference: string,
) {
  return createNotification(
    userId,
    "Booking Cancelled",
    `A booking for ${seatsReleased} seat(s) was cancelled for your event "${eventTitle}". Booking reference: ${bookingReference}`,
    "BOOKING_CANCELLED",
    {
      action: "event_booking_cancelled",
      eventTitle,
      seatsReleased,
      bookingReference,
    },
  );
}

export async function notifyAdminNewOrganizerRequest(
  adminIds: string[],
  userName: string,
  businessName: string,
) {
  const notifications = [];

  for (const adminId of adminIds) {
    const notification = await createNotification(
      adminId,
      "New Organizer Request",
      `${userName} has requested to become an organizer for "${businessName}". Please review their application.`,
      "SYSTEM_ANNOUNCEMENT",
      { action: "admin_organizer_request", userName, businessName },
    );
    notifications.push(notification);
  }

  return notifications;
}

export async function notifyBookingConfirmation(
  userId: string,
  eventTitle: string,
  bookingReference: string,
  seatsBooked: number,
  totalPrice: number,
) {
  return createNotification(
    userId,
    "Booking Confirmed! 🎉",
    `Your booking for "${eventTitle}" has been confirmed. ${seatsBooked} seat(s) booked. Reference: ${bookingReference}`,
    "BOOKING_CONFIRMED",
    {
      action: "booking_confirmed",
      eventTitle,
      bookingReference,
      seatsBooked,
      totalPrice,
    },
  );
}

export async function notifyBookingCancelled(
  userId: string,
  eventTitle: string,
  bookingReference: string,
  refundAmount: number,
) {
  return createNotification(
    userId,
    "Booking Cancelled",
    `Your booking for "${eventTitle}" has been cancelled. Refund of ₹${refundAmount} will be processed within 5-7 business days. Reference: ${bookingReference}`,
    "BOOKING_CANCELLED",
    {
      action: "booking_cancelled",
      eventTitle,
      bookingReference,
      refundAmount,
    },
  );
}

export async function notifyEventReminder(
  userId: string,
  eventTitle: string,
  eventDate: Date,
  bookingReference: string,
) {
  return createNotification(
    userId,
    "Event Reminder 📅",
    `Reminder: Your event "${eventTitle}" is scheduled for ${eventDate.toLocaleDateString()}. Don't forget to attend! Reference: ${bookingReference}`,
    "EVENT_REMINDER",
    {
      action: "event_reminder",
      eventTitle,
      eventDate,
      bookingReference,
    },
  );
}

export async function notifyPaymentSuccess(
  userId: string,
  amount: number,
  bookingReference: string,
) {
  return createNotification(
    userId,
    "Payment Successful ✅",
    `Your payment of ₹${amount} has been processed successfully. Booking reference: ${bookingReference}`,
    "PAYMENT_SUCCESS",
    {
      action: "payment_success",
      amount,
      bookingReference,
    },
  );
}

export async function notifyPaymentFailed(
  userId: string,
  amount: number,
  reason: string,
) {
  return createNotification(
    userId,
    "Payment Failed ❌",
    `Your payment of ₹${amount} could not be processed. Reason: ${reason}. Please try again.`,
    "PAYMENT_FAILED",
    {
      action: "payment_failed",
      amount,
      reason,
    },
  );
}

export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false,
) {
  try {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  } catch (error: any) {
    logger.error("Failed to get user notifications", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const cacheKey = `notifications:unread:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return parseInt(cached);
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    await redis.setex(cacheKey, 60, count.toString());

    return count;
  } catch (error: any) {
    logger.error("Failed to get unread count", {
      error: error.message,
      userId,
    });
    return 0;
  }
}

export async function markAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (notification.count === 0) {
      throw new Error("Notification not found");
    }

    await invalidateNotificationCaches(userId);

    logger.info("Notification marked as read", { notificationId, userId });

    return notification;
  } catch (error: any) {
    logger.error("Failed to mark notification as read", {
      error: error.message,
      notificationId,
    });
    throw error;
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await invalidateNotificationCaches(userId);

    logger.info("All notifications marked as read", {
      userId,
      count: result.count,
    });

    return result;
  } catch (error: any) {
    logger.error("Failed to mark all notifications as read", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  try {
    const notification = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (notification.count === 0) {
      throw new Error("Notification not found");
    }

    await invalidateNotificationCaches(userId);

    logger.info("Notification deleted", { notificationId, userId });

    return notification;
  } catch (error: any) {
    logger.error("Failed to delete notification", {
      error: error.message,
      notificationId,
    });
    throw error;
  }
}

export async function deleteAllNotifications(userId: string) {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    await invalidateNotificationCaches(userId);

    logger.info("All notifications deleted", {
      userId,
      count: result.count,
    });

    return result;
  } catch (error: any) {
    logger.error("Failed to delete all notifications", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function getNotificationsSince(userId: string, timestamp: Date) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gt: timestamp,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return notifications;
  } catch (error: any) {
    logger.error("Failed to get notifications since timestamp", {
      error: error.message,
      userId,
      timestamp,
    });
    throw error;
  }
}

async function publishNotificationEvent(userId: string, notification: any) {
  try {
    const channel = `notifications:${userId}`;
    await redis.publish(channel, JSON.stringify(notification));

    logger.debug("Notification event published", {
      channel,
      notificationId: notification.id,
    });
  } catch (error: any) {
    logger.error("Failed to publish notification event", {
      error: error.message,
      userId,
    });
  }
}

async function invalidateNotificationCaches(userId: string) {
  try {
    await redis.del(`notifications:unread:${userId}`);
    logger.debug("Notification caches invalidated", { userId });
  } catch (error: any) {
    logger.error("Failed to invalidate notification caches", {
      error: error.message,
    });
  }
}

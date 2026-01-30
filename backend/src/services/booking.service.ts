import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";
import {
  CreateBookingInput,
  CancelBookingInput,
} from "../validations/booking.validation";
import { logUserAction } from "./audit.service";
import * as notificationService from "./notification.service";
import { withLock } from "../utils/redis-lock.util";
import { generateBookingReference } from "../utils/booking-reference.util";
import {
  incrementBookingCreations,
  setActiveBookings,
} from "./prometheus.service";

export async function createBooking(
  data: CreateBookingInput,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  const lockKey = `booking-lock:${data.eventId}`;

  return await withLock(lockKey, 30, async () => {
    try {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
        include: {
          creator: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.status !== "PUBLISHED") {
        throw new Error("Event is not available for booking");
      }

      if (event.eventDate < new Date()) {
        throw new Error("Cannot book past events");
      }

      if (event.availableSeats < data.seatsBooked) {
        throw new Error(`Only ${event.availableSeats} seats available`);
      }

      const totalPrice =
        parseFloat(event.pricePerSeat.toString()) * data.seatsBooked;
      const bookingReference = generateBookingReference();

      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            bookingReference,
            userId,
            eventId: data.eventId,
            seatsBooked: data.seatsBooked,
            totalPrice,
            status: "PENDING",
            paymentStatus: "PENDING",
            ipAddress,
            userAgent,
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                eventDate: true,
                venue: true,
                createdBy: true,
              },
            },
          },
        });

        await tx.event.update({
          where: { id: data.eventId },
          data: {
            availableSeats: {
              decrement: data.seatsBooked,
            },
            status:
              event.availableSeats - data.seatsBooked === 0
                ? "SOLD_OUT"
                : event.status,
          },
        });

        return booking;
      });

      incrementBookingCreations("PENDING");

      const activeCount = await prisma.booking.count({
        where: { status: "PENDING" },
      });
      setActiveBookings(activeCount);

      await notificationService.notifyBookingConfirmation(
        userId,
        result.event.title,
        result.bookingReference,
        data.seatsBooked,
        totalPrice,
      );

      if (result.event.createdBy) {
        await notificationService.notifyEventBooking(
          result.event.createdBy,
          result.event.title,
          data.seatsBooked,
          result.bookingReference,
        );
      }

      await logUserAction(
        userId,
        "BOOKING_CREATE",
        "BOOKING",
        result.id,
        ipAddress,
        userAgent,
        {
          bookingReference: result.bookingReference,
          eventTitle: result.event.title,
          seatsBooked: data.seatsBooked,
        },
      );

      await invalidateBookingCaches(userId);
      await invalidateEventCache(data.eventId);

      logger.info("Booking created", {
        bookingId: result.id,
        bookingReference: result.bookingReference,
        userId,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to create booking", {
        error: error.message,
        userId,
        eventId: data.eventId,
      });
      throw error;
    }
  });
}

export async function getBookingById(
  bookingId: string,
  userId: string,
  userRole: string,
) {
  try {
    const where: any = { id: bookingId };

    if (userRole === "USER") {
      where.userId = userId;
    }

    const booking = await prisma.booking.findFirst({
      where,
      include: {
        event: true,
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

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  } catch (error: any) {
    logger.error("Failed to get booking", { error: error.message, bookingId });
    throw error;
  }
}

export async function getUserBookings(userId: string, filters: any = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      eventId,
      startDate,
      endDate,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              venue: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get user bookings", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function getAllBookings(filters: any = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      eventId,
      startDate,
      endDate,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              venue: true,
            },
          },
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
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get all bookings", { error: error.message });
    throw error;
  }
}

export async function cancelBooking(
  bookingId: string,
  userId: string,
  userRole: string,
  data: CancelBookingInput,
  ipAddress: string,
  userAgent?: string,
) {
  const lockKey = `booking-cancel-lock:${bookingId}`;

  return await withLock(lockKey, 30, async () => {
    try {
      const where: any = { id: bookingId };

      if (userRole === "USER") {
        where.userId = userId;
      }

      const booking = await prisma.booking.findFirst({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              createdBy: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "CANCELLED") {
        throw new Error("Booking is already cancelled");
      }

      if (booking.status === "REFUNDED") {
        throw new Error("Booking is already refunded");
      }

      const refundAmount =
        booking.paymentStatus === "COMPLETED"
          ? parseFloat(booking.totalPrice.toString())
          : 0;

      const result = await prisma.$transaction(async (tx) => {
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: refundAmount > 0 ? "REFUNDED" : "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: data.reason,
            refundAmount: refundAmount > 0 ? refundAmount : undefined,
            paymentStatus:
              refundAmount > 0 ? "REFUNDED" : booking.paymentStatus,
            refundedAt: refundAmount > 0 ? new Date() : undefined,
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                createdBy: true,
              },
            },
          },
        });

        await tx.event.update({
          where: { id: booking.eventId },
          data: {
            availableSeats: {
              increment: booking.seatsBooked,
            },
            status: "PUBLISHED",
          },
        });

        return updatedBooking;
      });

      await notificationService.notifyBookingCancelled(
        booking.userId,
        booking.event.title,
        booking.bookingReference,
        refundAmount,
      );

      if (booking.event.createdBy) {
        await notificationService.notifyEventCancellation(
          booking.event.createdBy,
          booking.event.title,
          booking.seatsBooked,
          booking.bookingReference,
        );
      }

      await logUserAction(
        userId,
        "BOOKING_CANCEL",
        "BOOKING",
        bookingId,
        ipAddress,
        userAgent,
        {
          bookingReference: result.bookingReference,
          eventTitle: result.event.title,
          refundAmount,
        },
      );

      await invalidateBookingCaches(booking.userId);
      await invalidateEventCache(booking.eventId);

      logger.info("Booking cancelled", {
        bookingId,
        userId,
        refundAmount,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to cancel booking", {
        error: error.message,
        bookingId,
        userId,
      });
      throw error;
    }
  });
}

export async function confirmBookingPayment(
  bookingId: string,
  paymentIntentId: string,
  paymentMethod: string,
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "CANCELLED") {
      throw new Error("Cannot confirm payment for cancelled booking");
    }

    if (booking.paymentStatus === "COMPLETED") {
      throw new Error("Payment already completed");
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentMethod,
        paymentIntentId,
        paidAt: new Date(),
      },
    });

    await notificationService.notifyPaymentSuccess(
      booking.userId,
      parseFloat(booking.totalPrice.toString()),
      booking.bookingReference,
    );

    await invalidateBookingCaches(booking.userId);

    logger.info("Booking payment confirmed", {
      bookingId,
      paymentIntentId,
    });

    return updatedBooking;
  } catch (error: any) {
    logger.error("Failed to confirm booking payment", {
      error: error.message,
      bookingId,
    });
    throw error;
  }
}

export async function failBookingPayment(bookingId: string, reason?: string) {
  const lockKey = `booking-payment-fail-lock:${bookingId}`;

  return await withLock(lockKey, 30, async () => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancelledAt: new Date(),
            cancellationReason: reason || "Payment failed",
          },
        });

        await tx.event.update({
          where: { id: booking.eventId },
          data: {
            availableSeats: {
              increment: booking.seatsBooked,
            },
          },
        });

        return updatedBooking;
      });

      await notificationService.notifyPaymentFailed(
        booking.userId,
        parseFloat(booking.totalPrice.toString()),
        reason || "Payment processing failed",
      );

      await invalidateBookingCaches(booking.userId);
      await invalidateEventCache(booking.eventId);

      logger.info("Booking payment failed", {
        bookingId,
        reason,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to process payment failure", {
        error: error.message,
        bookingId,
      });
      throw error;
    }
  });
}

async function invalidateBookingCaches(userId: string) {
  try {
    const patterns = [`bookings:user:${userId}:*`];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    logger.debug("Booking caches invalidated", { userId });
  } catch (error: any) {
    logger.error("Failed to invalidate booking caches", {
      error: error.message,
    });
  }
}

async function invalidateEventCache(eventId: string) {
  try {
    const keys = [`event:${eventId}`, `event:availability:${eventId}`];
    await redis.del(...keys);

    logger.debug("Event cache invalidated", { eventId });
  } catch (error: any) {
    logger.error("Failed to invalidate event cache", { error: error.message });
  }
}

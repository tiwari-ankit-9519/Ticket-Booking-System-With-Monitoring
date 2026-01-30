import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";
import {
  CreateEventInput,
  UpdateEventInput,
} from "../validations/event.validation";
import { logUserAction } from "./audit.service";
import { incrementEventCreations } from "./prometheus.service";
import * as notificationService from "./notification.service";

export async function createEvent(
  data: CreateEventInput & { imageUrl?: string },
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const eventDate = new Date(data.eventDate);
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (eventDate < new Date()) {
      throw new Error("Event date cannot be in the past");
    }

    if (endTime <= startTime) {
      throw new Error("End time must be after start time");
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        venue: data.venue,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        eventDate,
        startTime,
        endTime,
        totalSeats: data.totalSeats,
        availableSeats: data.totalSeats,
        pricePerSeat: data.pricePerSeat,
        currency: data.currency || "INR",
        imageUrl: data.imageUrl,
        status: "DRAFT",
        isFeatured: data.isFeatured || false,
        tags: data.tags || [],
        organizerName: data.organizerName,
        organizerContact: data.organizerContact,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    incrementEventCreations();

    await logUserAction(
      userId,
      "EVENT_CREATE",
      "EVENT",
      event.id,
      ipAddress,
      userAgent,
      { eventTitle: event.title },
    );

    await invalidateEventCaches();

    logger.info("Event created", {
      eventId: event.id,
      title: event.title,
      userId,
    });

    return event;
  } catch (error: any) {
    logger.error("Failed to create event", { error: error.message, userId });
    throw error;
  }
}

export async function getEventById(eventId: string) {
  try {
    const cacheKey = `event:${eventId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug("Event retrieved from cache", { eventId });
      return JSON.parse(cached);
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    await redis.setex(cacheKey, 1800, JSON.stringify(event));

    logger.info("Event retrieved", { eventId });

    return event;
  } catch (error: any) {
    logger.error("Failed to get event", { error: error.message, eventId });
    throw error;
  }
}

export async function getEvents(filters: any = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      city,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      search,
      status = "PUBLISHED",
      isFeatured,
      sortBy = "eventDate",
      sortOrder = "asc",
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerSeat = {};
      if (minPrice !== undefined) where.pricePerSeat.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.pricePerSeat.lte = parseFloat(maxPrice);
    }

    if (startDate || endDate) {
      where.eventDate = {};
      if (startDate) where.eventDate.gte = new Date(startDate);
      if (endDate) where.eventDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === "true";
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get events", { error: error.message });
    throw error;
  }
}

export async function getMyEvents(
  userId: string,
  page: number = 1,
  limit: number = 20,
) {
  try {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { createdBy: userId },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.event.count({
        where: { createdBy: userId },
      }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error("Failed to get user events", {
      error: error.message,
      userId,
    });
    throw error;
  }
}

export async function updateEvent(
  eventId: string,
  data: UpdateEventInput & { imageUrl?: string },
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error("Event not found");
    }

    const updateData: any = { ...data };

    if (data.eventDate) {
      updateData.eventDate = new Date(data.eventDate);
      if (updateData.eventDate < new Date()) {
        throw new Error("Event date cannot be in the past");
      }
    }

    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }

    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    if (updateData.startTime && updateData.endTime) {
      if (updateData.endTime <= updateData.startTime) {
        throw new Error("End time must be after start time");
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    await logUserAction(
      userId,
      "EVENT_UPDATE",
      "EVENT",
      eventId,
      ipAddress,
      userAgent,
      {
        eventTitle: event.title,
        changes: data,
      },
    );

    await invalidateEventCaches(eventId);

    logger.info("Event updated", { eventId, userId });

    return event;
  } catch (error: any) {
    logger.error("Failed to update event", { error: error.message, eventId });
    throw error;
  }
}

export async function deleteEvent(
  eventId: string,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.bookings.length > 0) {
      throw new Error("Cannot delete event with active bookings");
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED" },
    });

    await logUserAction(
      userId,
      "EVENT_DELETE",
      "EVENT",
      eventId,
      ipAddress,
      userAgent,
      { eventTitle: event.title },
    );

    await invalidateEventCaches(eventId);

    logger.info("Event deleted", { eventId, userId });

    return { message: "Event cancelled successfully" };
  } catch (error: any) {
    logger.error("Failed to delete event", { error: error.message, eventId });
    throw error;
  }
}

export async function publishEvent(
  eventId: string,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: "PUBLISHED" },
      include: {
        creator: {
          select: {
            id: true,
          },
        },
      },
    });

    if (event.createdBy) {
      await notificationService.notifyEventPublished(
        event.createdBy,
        event.title,
      );
    }

    await logUserAction(
      userId,
      "EVENT_UPDATE",
      "EVENT",
      eventId,
      ipAddress,
      userAgent,
      { eventTitle: event.title, action: "published" },
    );

    await invalidateEventCaches(eventId);

    logger.info("Event published", { eventId, userId });

    return event;
  } catch (error: any) {
    logger.error("Failed to publish event", { error: error.message, eventId });
    throw error;
  }
}

export async function unpublishEvent(
  eventId: string,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: "DRAFT" },
      include: {
        creator: {
          select: {
            id: true,
          },
        },
      },
    });

    if (event.createdBy) {
      await notificationService.notifyEventUnpublished(
        event.createdBy,
        event.title,
      );
    }

    await logUserAction(
      userId,
      "EVENT_UPDATE",
      "EVENT",
      eventId,
      ipAddress,
      userAgent,
      { eventTitle: event.title, action: "unpublished" },
    );

    await invalidateEventCaches(eventId);

    logger.info("Event unpublished", { eventId, userId });

    return event;
  } catch (error: any) {
    logger.error("Failed to unpublish event", {
      error: error.message,
      eventId,
    });
    throw error;
  }
}

export async function toggleFeatureEvent(
  eventId: string,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error("Event not found");
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { isFeatured: !existingEvent.isFeatured },
    });

    await logUserAction(
      userId,
      "EVENT_UPDATE",
      "EVENT",
      eventId,
      ipAddress,
      userAgent,
      {
        eventTitle: event.title,
        action: event.isFeatured ? "featured" : "unfeatured",
      },
    );

    await invalidateEventCaches(eventId);

    logger.info("Event feature toggled", {
      eventId,
      isFeatured: event.isFeatured,
      userId,
    });

    return event;
  } catch (error: any) {
    logger.error("Failed to toggle feature event", {
      error: error.message,
      eventId,
    });
    throw error;
  }
}

export async function getFeaturedEvents() {
  try {
    const cacheKey = "events:featured";
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug("Featured events retrieved from cache");
      return JSON.parse(cached);
    }

    const events = await prisma.event.findMany({
      where: {
        isFeatured: true,
        status: "PUBLISHED",
        eventDate: {
          gte: new Date(),
        },
      },
      orderBy: { eventDate: "asc" },
      take: 10,
    });

    await redis.setex(cacheKey, 900, JSON.stringify(events));

    return events;
  } catch (error: any) {
    logger.error("Failed to get featured events", { error: error.message });
    throw error;
  }
}

export async function getUpcomingEvents(limit: number = 10) {
  try {
    const cacheKey = `events:upcoming:${limit}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug("Upcoming events retrieved from cache");
      return JSON.parse(cached);
    }

    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        eventDate: {
          gte: new Date(),
        },
      },
      orderBy: { eventDate: "asc" },
      take: limit,
    });

    await redis.setex(cacheKey, 900, JSON.stringify(events));

    return events;
  } catch (error: any) {
    logger.error("Failed to get upcoming events", { error: error.message });
    throw error;
  }
}

export async function checkEventAvailability(eventId: string) {
  try {
    const cacheKey = `event:availability:${eventId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        totalSeats: true,
        availableSeats: true,
        status: true,
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const availability = {
      eventId: event.id,
      title: event.title,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      bookedSeats: event.totalSeats - event.availableSeats,
      isAvailable: event.availableSeats > 0 && event.status === "PUBLISHED",
      status: event.status,
    };

    await redis.setex(cacheKey, 5, JSON.stringify(availability));

    return availability;
  } catch (error: any) {
    logger.error("Failed to check event availability", {
      error: error.message,
      eventId,
    });
    throw error;
  }
}

export async function updateSeatAvailability(
  eventId: string,
  seatsToBook: number,
  operation: "book" | "release",
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    let newAvailableSeats: number;

    if (operation === "book") {
      if (event.availableSeats < seatsToBook) {
        throw new Error("Not enough seats available");
      }
      newAvailableSeats = event.availableSeats - seatsToBook;
    } else {
      newAvailableSeats = event.availableSeats + seatsToBook;
      if (newAvailableSeats > event.totalSeats) {
        newAvailableSeats = event.totalSeats;
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        availableSeats: newAvailableSeats,
        status: newAvailableSeats === 0 ? "SOLD_OUT" : event.status,
      },
    });

    await invalidateEventCaches(eventId);

    logger.info("Seat availability updated", {
      eventId,
      operation,
      seatsChanged: seatsToBook,
      newAvailableSeats,
    });

    return updatedEvent;
  } catch (error: any) {
    logger.error("Failed to update seat availability", {
      error: error.message,
      eventId,
    });
    throw error;
  }
}

async function invalidateEventCaches(eventId?: string) {
  try {
    const keysToDelete = ["events:featured", "events:upcoming:*"];

    if (eventId) {
      keysToDelete.push(`event:${eventId}`);
      keysToDelete.push(`event:availability:${eventId}`);
    }

    for (const pattern of keysToDelete) {
      if (pattern.includes("*")) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.del(pattern);
      }
    }

    logger.debug("Event caches invalidated", { eventId });
  } catch (error: any) {
    logger.error("Failed to invalidate event caches", { error: error.message });
  }
}

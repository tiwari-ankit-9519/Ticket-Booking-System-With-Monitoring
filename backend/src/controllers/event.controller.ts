import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as eventService from "../services/event.service";
import * as imageService from "../services/image.service";
import {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
} from "../validations/event.validation";
import { getClientIp } from "../utils/user-agent.util";
import { logger } from "../config/logger.config";
import { prisma } from "../config/database.config";

export async function createEvent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = createEventSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await imageService.uploadEventImage(req.file as any);
    }

    const eventData = {
      ...validatedData,
      imageUrl,
    };

    const event = await eventService.createEvent(
      eventData,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { event },
    });
  } catch (error: any) {
    logger.error("Create event error", { error: error.message });

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
}

export async function getEvents(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedQuery = eventQuerySchema.parse(req.query);
    const result = await eventService.getEvents(validatedQuery);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get events error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get events",
    });
  }
}

export async function getEventById(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const event = await eventService.getEventById(eventId);

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error: any) {
    logger.error("Get event error", { error: error.message });

    res.status(404).json({
      success: false,
      message: error.message || "Event not found",
    });
  }
}

export async function getMyEvents(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await eventService.getMyEvents(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get my events error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get events",
    });
  }
}

export async function updateEvent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const validatedData = updateEventSchema.parse(req.body);
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    if (userRole === "ORGANIZER" && existingEvent.createdBy !== userId) {
      res.status(403).json({
        success: false,
        message: "You can only update your own events",
      });
      return;
    }

    let updateData: any = { ...validatedData };

    if (req.file) {
      const newImageUrl = await imageService.replaceEventImage(
        req.file as any,
        existingEvent.imageUrl ?? undefined,
      );
      updateData.imageUrl = newImageUrl;
    }

    const event = await eventService.updateEvent(
      eventId,
      updateData,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: { event },
    });
  } catch (error: any) {
    logger.error("Update event error", { error: error.message });

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update event",
    });
  }
}

export async function deleteEvent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const event = await eventService.getEventById(eventId);

    if (userRole === "ORGANIZER" && event.createdBy !== userId) {
      res.status(403).json({
        success: false,
        message: "You can only delete your own events",
      });
      return;
    }

    const result = await eventService.deleteEvent(
      eventId,
      userId,
      ipAddress,
      userAgent,
    );

    if (event.imageUrl) {
      await imageService.deleteEventImage(event.imageUrl);
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    logger.error("Delete event error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete event",
    });
  }
}

export async function publishEvent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const event = await eventService.publishEvent(
      eventId,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: { event },
    });
  } catch (error: any) {
    logger.error("Publish event error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to publish event",
    });
  }
}

export async function unpublishEvent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const event = await eventService.unpublishEvent(
      eventId,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Event unpublished successfully",
      data: { event },
    });
  } catch (error: any) {
    logger.error("Unpublish event error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to unpublish event",
    });
  }
}

export async function toggleFeatureEvent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const event = await eventService.toggleFeatureEvent(
      eventId,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: `Event ${event.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: { event },
    });
  } catch (error: any) {
    logger.error("Toggle feature event error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to toggle feature event",
    });
  }
}

export async function getFeaturedEvents(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const events = await eventService.getFeaturedEvents();

    res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    logger.error("Get featured events error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get featured events",
    });
  }
}

export async function getUpcomingEvents(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await eventService.getUpcomingEvents(limit);

    res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    logger.error("Get upcoming events error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get upcoming events",
    });
  }
}

export async function checkEventAvailability(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const availability = await eventService.checkEventAvailability(eventId);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error: any) {
    logger.error("Check event availability error", { error: error.message });

    res.status(404).json({
      success: false,
      message: error.message || "Event not found",
    });
  }
}

export async function uploadEventImage(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const eventId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No image file provided",
      });
      return;
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    if (userRole === "ORGANIZER" && existingEvent.createdBy !== userId) {
      res.status(403).json({
        success: false,
        message: "You can only upload images for your own events",
      });
      return;
    }

    const imageUrl = await imageService.replaceEventImage(
      req.file as any,
      existingEvent.imageUrl ?? undefined,
    );

    await prisma.event.update({
      where: { id: eventId },
      data: { imageUrl },
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { imageUrl },
    });
  } catch (error: any) {
    logger.error("Upload image error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
}

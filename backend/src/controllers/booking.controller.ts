// src/controllers/booking.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as bookingService from "../services/booking.service";
import {
  createBookingSchema,
  cancelBookingSchema,
  bookingQuerySchema,
} from "../validations/booking.validation";
import { getClientIp } from "../utils/user-agent.util";
import { logger } from "../config/logger.config";

export async function createBooking(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const booking = await bookingService.createBooking(
      validatedData,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (error: any) {
    logger.error("Create booking error", { error: error.message });

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
      message: error.message || "Failed to create booking",
    });
  }
}

export async function getBookingById(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const bookingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const booking = await bookingService.getBookingById(
      bookingId,
      userId,
      userRole,
    );

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error: any) {
    logger.error("Get booking error", { error: error.message });

    res.status(404).json({
      success: false,
      message: error.message || "Booking not found",
    });
  }
}

export async function getUserBookings(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const validatedQuery = bookingQuerySchema.parse(req.query);

    const result = await bookingService.getUserBookings(userId, validatedQuery);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get user bookings error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get bookings",
    });
  }
}

export async function getAllBookings(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedQuery = bookingQuerySchema.parse(req.query);
    const result = await bookingService.getAllBookings(validatedQuery);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get all bookings error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get bookings",
    });
  }
}

export async function cancelBooking(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const bookingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const validatedData = cancelBookingSchema.parse(req.body);

    const booking = await bookingService.cancelBooking(
      bookingId,
      userId,
      userRole,
      validatedData,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  } catch (error: any) {
    logger.error("Cancel booking error", { error: error.message });

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
      message: error.message || "Failed to cancel booking",
    });
  }
}

import { z } from "zod";

export const createBookingSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  seatsBooked: z
    .number()
    .int()
    .min(1, "At least 1 seat required")
    .max(10, "Maximum 10 seats per booking"),
});

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(10, "Cancellation reason must be at least 10 characters")
    .optional(),
});

export const bookingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  eventId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;

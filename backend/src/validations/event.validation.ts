import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "CONCERT",
    "SPORTS",
    "THEATER",
    "CONFERENCE",
    "FESTIVAL",
    "WORKSHOP",
    "OTHER",
  ]),
  venue: z.string().min(3, "Venue is required"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required").default("India"),
  latitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  longitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  eventDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid event date",
  }),
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start time",
  }),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end time",
  }),
  totalSeats: z.number().refine((val) => val >= 1, {
    message: "Total seats must be at least 1",
  }),
  pricePerSeat: z.number().refine((val) => val >= 0, {
    message: "Price must be non-negative",
  }),
  currency: z.string().default("INR"),
  isFeatured: z.boolean(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((tag) => tag.trim()) : [])),
  organizerName: z.string().min(2, "Organizer name is required"),
  organizerContact: z.string().min(10, "Valid contact is required"),
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z
    .enum([
      "CONCERT",
      "SPORTS",
      "THEATER",
      "CONFERENCE",
      "FESTIVAL",
      "WORKSHOP",
      "OTHER",
    ])
    .optional(),
  venue: z.string().min(3).optional(),
  address: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  latitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  longitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  eventDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalSeats: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  pricePerSeat: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  currency: z.string().optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  tags: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map((tag) => tag.trim()) : undefined,
    ),
  organizerName: z.string().min(2).optional(),
  organizerContact: z.string().min(10).optional(),
});

export const eventQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  isFeatured: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

export const APP_NAME = "EventTicket";
export const APP_DESCRIPTION = "Book tickets for amazing events";

export const USER_ROLES = {
  USER: "USER",
  ORGANIZER: "ORGANIZER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const EVENT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  EVENT_REMINDER: "EVENT_REMINDER",
  EVENT_UPDATED: "EVENT_UPDATED",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DATE_FORMAT = "yyyy-MM-dd";
export const DATETIME_FORMAT = "yyyy-MM-dd HH:mm";
export const TIME_FORMAT = "HH:mm";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const EVENT_CATEGORIES = [
  "Music",
  "Sports",
  "Arts",
  "Technology",
  "Business",
  "Education",
  "Food",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const QUERY_KEYS = {
  CURRENT_USER: ["currentUser"],

  EVENTS: ["events"],
  EVENT_DETAIL: (id: string) => ["event", id],
  EVENT_AVAILABILITY: (id: string) => ["event", id, "availability"],
  FEATURED_EVENTS: ["events", "featured"],
  UPCOMING_EVENTS: ["events", "upcoming"],
  MY_EVENTS: ["events", "my"],

  BOOKINGS: ["bookings"],
  BOOKING_DETAIL: (id: string) => ["booking", id],
  MY_BOOKINGS: ["bookings", "my"],

  NOTIFICATIONS: ["notifications"],
  NOTIFICATION_COUNT: ["notifications", "count"],

  ORGANIZER_PROFILE: ["organizer", "profile"],
  ORGANIZER_STATS: ["organizer", "stats"],
  PENDING_ORGANIZERS: ["organizers", "pending"],

  ADMIN_DASHBOARD: ["admin", "dashboard"],
  ADMIN_ANALYTICS: (type: string) => ["admin", "analytics", type],
  ADMIN_BOOKINGS: ["admin", "bookings"],

  SEARCH: (query: string) => ["search", query],
  SEARCH_SUGGESTIONS: (query: string) => ["search", "suggestions", query],
} as const;

export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: "Welcome back!",
  LOGIN_ERROR: "Invalid credentials",
  LOGOUT_SUCCESS: "Logged out successfully",
  REGISTER_SUCCESS: "Account created! Please verify your email.",
  BOOKING_SUCCESS: "Booking confirmed successfully!",
  BOOKING_ERROR: "Failed to create booking",
  PAYMENT_SUCCESS: "Payment completed successfully!",
  PAYMENT_ERROR: "Payment failed. Please try again.",
  UPDATE_SUCCESS: "Updated successfully",
  UPDATE_ERROR: "Failed to update",
  DELETE_SUCCESS: "Deleted successfully",
  DELETE_ERROR: "Failed to delete",
  NETWORK_ERROR: "Network error. Please check your connection.",
} as const;

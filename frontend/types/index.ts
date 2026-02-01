export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  description: string | null;
  website: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string | null;
  panNumber: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  documents: string[];
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  venue: string;
  city: string;
  state: string;
  address: string;
  startDate: string;
  endDate: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  isFeatured: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  organizer?: User;
  _count?: {
    bookings: number;
  };
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  bookingReference: string;
  seatsBooked: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentId: string | null;
  cancelledAt: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
}

export interface Payment {
  id: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  refundId: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingNotificationMetadata {
  action:
    | "booking_confirmed"
    | "booking_cancelled"
    | "event_booking_received"
    | "event_booking_cancelled";
  eventTitle: string;
  seatsBooked?: number;
  seatsReleased?: number;
  bookingReference: string;
  totalPrice?: number;
  refundAmount?: number;
}

export interface PaymentNotificationMetadata {
  action: "payment_success" | "payment_failed";
  amount: number;
  bookingReference: string;
  reason?: string;
}

export interface EventNotificationMetadata {
  action: "event_reminder" | "event_published" | "event_unpublished";
  eventTitle: string;
  eventDate?: string;
  bookingReference?: string;
  reason?: string;
}

export interface OrganizerNotificationMetadata {
  action:
    | "organizer_approved"
    | "organizer_rejected"
    | "organizer_suspended"
    | "organizer_reactivated"
    | "admin_organizer_request";
  businessName: string;
  reason?: string;
  userName?: string;
}

export interface SystemNotificationMetadata {
  action: string;
  [key: string]: string | number | boolean | undefined;
}

export type NotificationMetadata =
  | BookingNotificationMetadata
  | PaymentNotificationMetadata
  | EventNotificationMetadata
  | OrganizerNotificationMetadata
  | SystemNotificationMetadata;

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "PAYMENT_SUCCESS"
    | "PAYMENT_FAILED"
    | "EVENT_REMINDER"
    | "EVENT_UPDATED"
    | "SYSTEM_ANNOUNCEMENT";
  metadata: NotificationMetadata | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalEvents: number;
  totalUsers: number;
  activeEvents: number;
  pendingBookings: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  revenueByEvent: Array<{
    eventId: string;
    eventTitle: string;
    revenue: number;
  }>;
}

export interface BookingAnalytics {
  totalBookings: number;
  bookingsByStatus: Array<{ status: string; count: number }>;
  bookingsByMonth: Array<{ month: string; count: number }>;
  popularEvents: Array<{
    eventId: string;
    eventTitle: string;
    bookingCount: number;
  }>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface CreateEventFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  venue: string;
  city: string;
  state: string;
  address: string;
  startDate: string;
  endDate: string;
  price: number;
  totalSeats: number;
  image?: File;
}

export interface CreateBookingData {
  eventId: string;
  seatsBooked: number;
}

export interface OrganizerApplicationData {
  businessName: string;
  businessType: string;
  description?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  documents: File[];
}

export interface EventsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
  search?: string;
  sortBy?: "startDate" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
}

export interface BookingsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  eventId?: string;
}

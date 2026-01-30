import client from "prom-client";
import { logger } from "../config/logger.config";

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const activeBookings = new client.Gauge({
  name: "active_bookings_total",
  help: "Total number of active bookings",
  registers: [register],
});

export const totalRevenue = new client.Gauge({
  name: "total_revenue",
  help: "Total revenue generated",
  registers: [register],
});

export const databaseQueryDuration = new client.Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const redisOperationDuration = new client.Histogram({
  name: "redis_operation_duration_seconds",
  help: "Duration of Redis operations in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

export const emailQueueSize = new client.Gauge({
  name: "email_queue_size",
  help: "Number of emails in queue",
  registers: [register],
});

export const userRegistrations = new client.Counter({
  name: "user_registrations_total",
  help: "Total number of user registrations",
  registers: [register],
});

export const bookingCreations = new client.Counter({
  name: "booking_creations_total",
  help: "Total number of bookings created",
  labelNames: ["status"],
  registers: [register],
});

export const paymentTransactions = new client.Counter({
  name: "payment_transactions_total",
  help: "Total number of payment transactions",
  labelNames: ["status"],
  registers: [register],
});

export const eventCreations = new client.Counter({
  name: "event_creations_total",
  help: "Total number of events created",
  registers: [register],
});

export const notificationsSent = new client.Counter({
  name: "notifications_sent_total",
  help: "Total number of notifications sent",
  labelNames: ["type"],
  registers: [register],
});

export const cacheHitRate = new client.Gauge({
  name: "cache_hit_rate",
  help: "Cache hit rate percentage",
  registers: [register],
});

export const activeUsers = new client.Gauge({
  name: "active_users_total",
  help: "Total number of active users",
  registers: [register],
});

export const slowQueriesTotal = new client.Counter({
  name: "slow_queries_total",
  help: "Total number of slow queries detected",
  labelNames: ["operation"],
  registers: [register],
});

export const queryErrorsTotal = new client.Counter({
  name: "query_errors_total",
  help: "Total number of database query errors",
  labelNames: ["error_type"],
  registers: [register],
});

export function incrementSlowQueries(operation: string) {
  slowQueriesTotal.inc({ operation });
}

export function incrementQueryErrors(errorType: string) {
  queryErrorsTotal.inc({ error_type: errorType });
}

export async function getMetrics() {
  return await register.metrics();
}

export function incrementUserRegistrations() {
  userRegistrations.inc();
}

export function incrementBookingCreations(status: string) {
  bookingCreations.inc({ status });
}

export function incrementPaymentTransactions(status: string) {
  paymentTransactions.inc({ status });
}

export function incrementEventCreations() {
  eventCreations.inc();
}

export function incrementNotificationsSent(type: string) {
  notificationsSent.inc({ type });
}

export function setActiveBookings(count: number) {
  activeBookings.set(count);
}

export function setTotalRevenue(amount: number) {
  totalRevenue.set(amount);
}

export function setEmailQueueSize(size: number) {
  emailQueueSize.set(size);
}

export function setCacheHitRate(rate: number) {
  cacheHitRate.set(rate);
}

export function setActiveUsers(count: number) {
  activeUsers.set(count);
}

logger.info("Prometheus metrics initialized");

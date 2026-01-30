import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { corsOptions } from "./middlewares/cors.middleware";
import { securityHeaders } from "./middlewares/security.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { requestTracker } from "./middlewares/request-tracker.middleware";
import { prometheusMiddleware } from "./middlewares/prometheus.middleware";
import { generalRateLimit } from "./middlewares/rate-limit.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import notificationRoutes from "./routes/notification.routes";
import eventRoutes from "./routes/event.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import analyticsRoutes from "./routes/analytics.routes";
import searchRoutes from "./routes/search.routes";
import monitoringRoutes from "./routes/monitoring.routes";
import metricsRoutes from "./routes/metrics.routes";
import queryMonitorRoutes from "./routes/query-monitoring.routes";
import databaseReportRoutes from "./routes/database-report.routes";
import organizerRoutes from "./routes/organizer.routes";

const app: Application = express();

app.use(securityHeaders);
app.use(corsOptions);

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(requestLogger);
app.use(requestTracker);
app.use(prometheusMiddleware);
app.use(generalRateLimit);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", notificationRoutes);
app.use("/api", eventRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", searchRoutes);
app.use("/api", monitoringRoutes);
app.use("/", metricsRoutes);
app.use("/api", queryMonitorRoutes);
app.use("/api", databaseReportRoutes);
app.use("/api", organizerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

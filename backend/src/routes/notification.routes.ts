import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { strictRateLimit } from "../middlewares/rate-limit.middleware";

const router: Router = Router();

router.get(
  "/notifications",
  authenticate,
  notificationController.getNotifications,
);

router.get(
  "/notifications/stream",
  authenticate,
  notificationController.streamNotifications,
);

router.get(
  "/notifications/unread-count",
  authenticate,
  notificationController.getUnreadCount,
);

router.get(
  "/notifications/since/:timestamp",
  authenticate,
  notificationController.getNotificationsSince,
);

router.get(
  "/notifications/health",
  authenticate,
  notificationController.getNotificationHealth,
);

router.put(
  "/notifications/:id/read",
  authenticate,
  notificationController.markNotificationRead,
);

router.put(
  "/notifications/read-all",
  authenticate,
  notificationController.markAllRead,
);

router.delete(
  "/notifications/:id",
  authenticate,
  strictRateLimit,
  notificationController.deleteNotification,
);

router.delete(
  "/notifications/delete-all",
  authenticate,
  strictRateLimit,
  notificationController.deleteAllNotifications,
);

export default router;

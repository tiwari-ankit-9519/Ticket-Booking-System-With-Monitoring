import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as notificationService from "../services/notification.service";
import { logger } from "../config/logger.config";
import * as sseManager from "../utils/sse-manager";

export async function getNotifications(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await notificationService.getUserNotifications(
      userId,
      page,
      limit,
      unreadOnly,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get notifications error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
}

export async function streamNotifications(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user!.userId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write('data: {"message": "Connected to notification stream"}\n\n');

  const connectionId = sseManager.addConnection(userId, res);

  req.on("close", () => {
    sseManager.removeConnection(userId, res);
    logger.info("SSE connection closed", { userId, connectionId });
  });
}

export async function getUnreadCount(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    logger.error("Get unread count error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
}

export async function markNotificationRead(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    await notificationService.markAsRead(notificationId, userId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error: any) {
    logger.error("Mark notification read error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
}

export async function markAllRead(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { count: result.count },
    });
  } catch (error: any) {
    logger.error("Mark all read error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
}

export async function deleteNotification(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    await notificationService.deleteNotification(notificationId, userId);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error: any) {
    logger.error("Delete notification error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete notification",
    });
  }
}

export async function deleteAllNotifications(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await notificationService.deleteAllNotifications(userId);

    res.status(200).json({
      success: true,
      message: "All notifications deleted",
      data: { count: result.count },
    });
  } catch (error: any) {
    logger.error("Delete all notifications error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to delete all notifications",
    });
  }
}

export async function getNotificationsSince(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const timestampParam = Array.isArray(req.params.timestamp)
      ? req.params.timestamp[0]
      : req.params.timestamp;

    const timestamp = new Date(parseInt(timestampParam));

    if (isNaN(timestamp.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid timestamp",
      });
      return;
    }

    const notifications = await notificationService.getNotificationsSince(
      userId,
      timestamp,
    );

    res.status(200).json({
      success: true,
      data: { notifications },
    });
  } catch (error: any) {
    logger.error("Get notifications since error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
}

export async function getNotificationHealth(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const stats = sseManager.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Get notification health error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get notification health",
    });
  }
}

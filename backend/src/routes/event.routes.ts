import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import {
  authenticate,
  requireRole,
  optionalAuth,
} from "../middlewares/auth.middleware";
import { upload } from "@/config/multer.config";

const router: Router = Router();

router.get("/events/featured", eventController.getFeaturedEvents);

router.get("/events/upcoming", eventController.getUpcomingEvents);

router.get("/events/:id/availability", eventController.checkEventAvailability);

router.get("/events", optionalAuth, eventController.getEvents);

router.get("/events/:id", optionalAuth, eventController.getEventById);

router.get(
  "/my-events",
  authenticate,
  requireRole("ORGANIZER", "ADMIN", "SUPER_ADMIN"),
  eventController.getMyEvents,
);

router.post(
  "/events",
  authenticate,
  requireRole("ORGANIZER", "ADMIN", "SUPER_ADMIN"),
  upload.single("image"),
  eventController.createEvent,
);

router.patch(
  "/events/:id",
  authenticate,
  requireRole("ORGANIZER", "ADMIN", "SUPER_ADMIN"),
  upload.single("image"),
  eventController.updateEvent,
);

router.delete(
  "/events/:id",
  authenticate,
  requireRole("ORGANIZER", "ADMIN", "SUPER_ADMIN"),
  eventController.deleteEvent,
);

router.post(
  "/events/:id/image",
  authenticate,
  requireRole("ORGANIZER", "ADMIN", "SUPER_ADMIN"),
  upload.single("image"),
  eventController.uploadEventImage,
);

router.patch(
  "/events/:id/publish",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  eventController.publishEvent,
);

router.patch(
  "/events/:id/unpublish",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  eventController.unpublishEvent,
);

router.patch(
  "/events/:id/feature",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  eventController.toggleFeatureEvent,
);

export default router;

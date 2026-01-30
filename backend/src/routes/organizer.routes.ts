import { Router } from "express";
import * as organizerController from "../controllers/organizer.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";
import { upload } from "@/config/multer.config";

const router: Router = Router();

router.post(
  "/organizer/profile",
  authenticate,
  upload.array("documents", 5),
  organizerController.createOrganizerProfile,
);

router.get(
  "/organizer/profile",
  authenticate,
  organizerController.getMyOrganizerProfile,
);

router.patch(
  "/organizer/profile",
  authenticate,
  upload.array("documents", 5),
  organizerController.updateOrganizerProfile,
);

router.get(
  "/organizer/pending",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.getPendingOrganizers,
);

router.get(
  "/organizer/all",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.getAllOrganizers,
);

router.get(
  "/organizer/stats",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.getOrganizerStats,
);

router.get(
  "/organizer/:userId",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.getOrganizerById,
);

router.post(
  "/organizer/approve",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.approveOrganizer,
);

router.post(
  "/organizer/reject",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.rejectOrganizer,
);

router.post(
  "/organizer/suspend",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.suspendOrganizer,
);

router.post(
  "/organizer/reactivate",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  organizerController.reactivateOrganizer,
);

export default router;

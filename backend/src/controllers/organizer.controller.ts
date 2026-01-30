import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as organizerService from "../services/organizer.service";
import * as imageService from "../services/image.service";
import {
  createOrganizerProfileSchema,
  updateOrganizerProfileSchema,
  approveOrganizerSchema,
  rejectOrganizerSchema,
  suspendOrganizerSchema,
} from "../validations/organizer.validation";
import { getClientIp } from "../utils/user-agent.util";
import { logger } from "../config/logger.config";

export async function createOrganizerProfile(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = createOrganizerProfileSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    let verificationDocuments: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const documentUrl = await imageService.uploadEventImage(file as any);
        verificationDocuments.push(documentUrl);
      }
    }

    const profile = await organizerService.createOrganizerProfile(
      userId,
      { ...validatedData, verificationDocuments },
      ipAddress,
      userAgent,
    );

    res.status(201).json({
      success: true,
      message:
        "Organizer profile created successfully. Your request is pending admin approval.",
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Create organizer profile error", { error: error.message });

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create organizer profile",
    });
  }
}

export async function getMyOrganizerProfile(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await organizerService.getOrganizerProfile(userId);

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Get organizer profile error", { error: error.message });

    res.status(404).json({
      success: false,
      message: error.message || "Organizer profile not found",
    });
  }
}

export async function updateOrganizerProfile(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = updateOrganizerProfileSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    let verificationDocuments: string[] | undefined;

    if (req.files && Array.isArray(req.files)) {
      verificationDocuments = [];
      for (const file of req.files) {
        const documentUrl = await imageService.uploadEventImage(file as any);
        verificationDocuments.push(documentUrl);
      }
    }

    const profile = await organizerService.updateOrganizerProfile(
      userId,
      { ...validatedData, verificationDocuments },
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Organizer profile updated successfully",
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Update organizer profile error", { error: error.message });

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update organizer profile",
    });
  }
}

export async function getPendingOrganizers(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await organizerService.getPendingOrganizers(page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get pending organizers error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get pending organizers",
    });
  }
}

export async function getAllOrganizers(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const status = req.query.status as any;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await organizerService.getAllOrganizers(status, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get all organizers error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get organizers",
    });
  }
}

export async function getOrganizerById(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const profile = await organizerService.getOrganizerProfile(userId);

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Get organizer by id error", { error: error.message });

    res.status(404).json({
      success: false,
      message: error.message || "Organizer not found",
    });
  }
}

export async function approveOrganizer(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = approveOrganizerSchema.parse(req.body);
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const profile = await organizerService.approveOrganizer(
      validatedData.userId,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Organizer approved successfully",
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Approve organizer error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve organizer",
    });
  }
}

export async function rejectOrganizer(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = rejectOrganizerSchema.parse(req.body);
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const profile = await organizerService.rejectOrganizer(
      validatedData.userId,
      validatedData.reason,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Organizer rejected",
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Reject organizer error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject organizer",
    });
  }
}

export async function suspendOrganizer(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = suspendOrganizerSchema.parse(req.body);
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const profile = await organizerService.suspendOrganizer(
      validatedData.userId,
      validatedData.reason,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Organizer suspended",
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Suspend organizer error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to suspend organizer",
    });
  }
}

export async function reactivateOrganizer(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const { userId } = req.body;
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const profile = await organizerService.reactivateOrganizer(
      userId,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Organizer reactivated successfully",
      data: { profile },
    });
  } catch (error: any) {
    logger.error("Reactivate organizer error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to reactivate organizer",
    });
  }
}

export async function getOrganizerStats(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const stats = await organizerService.getOrganizerStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Get organizer stats error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get organizer statistics",
    });
  }
}

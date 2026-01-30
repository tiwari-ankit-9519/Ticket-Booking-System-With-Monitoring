import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as paymentService from "../services/payment.service";
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from "../validations/payment.validation";
import { getClientIp } from "../utils/user-agent.util";
import { logger } from "../config/logger.config";

export async function createPaymentOrder(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = createPaymentOrderSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const order = await paymentService.createPaymentOrder(
      validatedData,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: order,
    });
  } catch (error: any) {
    logger.error("Create payment order error", { error: error.message });

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
      message: error.message || "Failed to create payment order",
    });
  }
}

export async function verifyPayment(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = verifyPaymentSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const result = await paymentService.verifyPayment(
      validatedData,
      userId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error("Verify payment error", { error: error.message });

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
      message: error.message || "Payment verification failed",
    });
  }
}

export async function handleWebhook(req: any, res: Response): Promise<void> {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      res.status(400).json({
        success: false,
        message: "Missing signature",
      });
      return;
    }

    await paymentService.handleWebhook(req.body, signature as string);

    res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error: any) {
    logger.error("Webhook error", { error: error.message });

    res.status(400).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
}

export async function refundPayment(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const bookingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const amount = req.body.amount ? parseFloat(req.body.amount) : undefined;

    const result = await paymentService.processRefund(bookingId, amount);

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error("Refund payment error", { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to process refund",
    });
  }
}

import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";
import express from "express";

const router: Router = Router();

router.post(
  "/payments/create-order",
  authenticate,
  paymentController.createPaymentOrder,
);

router.post("/payments/verify", authenticate, paymentController.verifyPayment);

router.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook,
);

router.post(
  "/payments/:id/refund",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  paymentController.refundPayment,
);

export default router;

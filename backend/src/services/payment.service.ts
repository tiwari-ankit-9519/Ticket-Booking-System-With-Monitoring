import crypto from "crypto";
import { razorpay, RAZORPAY_WEBHOOK_SECRET } from "../config/razorpay.config";
import { prisma } from "../config/database.config";
import { logger } from "../config/logger.config";
import {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from "../validations/payment.validation";
import { confirmBookingPayment, failBookingPayment } from "./booking.service";
import { logUserAction } from "./audit.service";
import {
  incrementPaymentTransactions,
  setTotalRevenue,
} from "./prometheus.service";

export async function createPaymentOrder(
  data: CreatePaymentOrderInput,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new Error("Unauthorized access to booking");
    }

    if (booking.status === "CANCELLED") {
      throw new Error("Cannot create payment for cancelled booking");
    }

    if (booking.paymentStatus === "COMPLETED") {
      throw new Error("Payment already completed");
    }

    const amountInPaise = Math.round(
      parseFloat(booking.totalPrice.toString()) * 100,
    );

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking.id,
        userId: booking.userId,
        eventTitle: booking.event.title,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentIntentId: order.id,
        paymentStatus: "PROCESSING",
      },
    });

    await logUserAction(
      userId,
      "PAYMENT_INITIATED",
      "BOOKING",
      booking.id,
      ipAddress,
      userAgent,
      {
        orderId: order.id,
        amount: amountInPaise,
        bookingReference: booking.bookingReference,
      },
    );

    logger.info("Payment order created", {
      orderId: order.id,
      bookingId: booking.id,
      amount: amountInPaise,
    });

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      bookingReference: booking.bookingReference,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error: any) {
    logger.error("Failed to create payment order", {
      error: error.message,
      bookingId: data.bookingId,
    });
    throw error;
  }
}

export async function verifyPayment(
  data: VerifyPaymentInput,
  userId: string,
  ipAddress: string,
  userAgent?: string,
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new Error("Unauthorized access to booking");
    }

    const isValid = verifyRazorpaySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
    );

    if (!isValid) {
      await failBookingPayment(
        booking.id,
        "Payment signature verification failed",
      );

      incrementPaymentTransactions("FAILED");

      await logUserAction(
        userId,
        "PAYMENT_FAILED",
        "BOOKING",
        booking.id,
        ipAddress,
        userAgent,
        {
          reason: "Invalid signature",
          paymentId: data.razorpay_payment_id,
        },
      );

      throw new Error("Payment verification failed");
    }

    const payment = await razorpay.payments.fetch(data.razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      await failBookingPayment(booking.id, `Payment status: ${payment.status}`);
      incrementPaymentTransactions("FAILED");
      throw new Error("Payment not successful");
    }

    const updatedBooking = await confirmBookingPayment(
      booking.id,
      data.razorpay_payment_id,
      payment.method || "unknown",
    );

    incrementPaymentTransactions("COMPLETED");
    const totalRevenueResult = await prisma.booking.aggregate({
      where: { paymentStatus: "COMPLETED" },
      _sum: { totalPrice: true },
    });
    setTotalRevenue(
      parseFloat(totalRevenueResult._sum.totalPrice?.toString() || "0"),
    );

    await logUserAction(
      userId,
      "PAYMENT_SUCCESS",
      "BOOKING",
      booking.id,
      ipAddress,
      userAgent,
      {
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
        method: payment.method,
        amount: payment.amount,
      },
    );

    logger.info("Payment verified successfully", {
      bookingId: booking.id,
      paymentId: data.razorpay_payment_id,
    });

    return {
      success: true,
      booking: updatedBooking,
      paymentId: data.razorpay_payment_id,
    };
  } catch (error: any) {
    logger.error("Payment verification failed", {
      error: error.message,
      bookingId: data.bookingId,
    });
    throw error;
  }
}

export async function handleWebhook(payload: any, signature: string) {
  try {
    const isValid = verifyWebhookSignature(payload, signature);

    if (!isValid) {
      logger.warn("Invalid webhook signature");
      throw new Error("Invalid webhook signature");
    }

    const event = payload.event;
    const paymentEntity = payload.payload.payment.entity;

    logger.info("Webhook received", {
      event,
      paymentId: paymentEntity.id,
    });

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(paymentEntity);
        break;

      case "payment.failed":
        await handlePaymentFailed(paymentEntity);
        break;

      case "order.paid":
        await handleOrderPaid(paymentEntity);
        break;

      default:
        logger.info("Unhandled webhook event", { event });
    }

    return { success: true };
  } catch (error: any) {
    logger.error("Webhook handling failed", { error: error.message });
    throw error;
  }
}

async function handlePaymentCaptured(paymentEntity: any) {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: paymentEntity.order_id,
      },
    });

    if (!booking) {
      logger.warn("Booking not found for payment", {
        orderId: paymentEntity.order_id,
      });
      return;
    }

    if (booking.paymentStatus === "COMPLETED") {
      logger.info("Payment already processed", { bookingId: booking.id });
      return;
    }

    await confirmBookingPayment(
      booking.id,
      paymentEntity.id,
      paymentEntity.method || "unknown",
    );

    logger.info("Payment captured via webhook", {
      bookingId: booking.id,
      paymentId: paymentEntity.id,
    });
  } catch (error: any) {
    logger.error("Failed to handle payment captured", {
      error: error.message,
      paymentId: paymentEntity.id,
    });
  }
}

async function handlePaymentFailed(paymentEntity: any) {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: paymentEntity.order_id,
      },
    });

    if (!booking) {
      logger.warn("Booking not found for failed payment", {
        orderId: paymentEntity.order_id,
      });
      return;
    }

    await failBookingPayment(
      booking.id,
      paymentEntity.error_description || "Payment failed",
    );

    logger.info("Payment failed via webhook", {
      bookingId: booking.id,
      paymentId: paymentEntity.id,
    });
  } catch (error: any) {
    logger.error("Failed to handle payment failure", {
      error: error.message,
      paymentId: paymentEntity.id,
    });
  }
}

async function handleOrderPaid(paymentEntity: any) {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: paymentEntity.order_id,
      },
    });

    if (!booking) {
      logger.warn("Booking not found for order paid", {
        orderId: paymentEntity.order_id,
      });
      return;
    }

    if (booking.paymentStatus !== "COMPLETED") {
      await confirmBookingPayment(
        booking.id,
        paymentEntity.id,
        paymentEntity.method || "unknown",
      );
    }

    logger.info("Order paid via webhook", {
      bookingId: booking.id,
      orderId: paymentEntity.order_id,
    });
  } catch (error: any) {
    logger.error("Failed to handle order paid", {
      error: error.message,
      orderId: paymentEntity.order_id,
    });
  }
}

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(text)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error: any) {
    logger.error("Signature verification error", { error: error.message });
    return false;
  }
}

function verifyWebhookSignature(payload: any, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    return expectedSignature === signature;
  } catch (error: any) {
    logger.error("Webhook signature verification error", {
      error: error.message,
    });
    return false;
  }
}

export async function processRefund(bookingId: string, amount?: number) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (!booking.paymentIntentId) {
      throw new Error("No payment found for this booking");
    }

    if (booking.paymentStatus !== "COMPLETED") {
      throw new Error("Cannot refund unpaid booking");
    }

    const refundAmount = amount || parseFloat(booking.totalPrice.toString());
    const refundAmountInPaise = Math.round(refundAmount * 100);

    const payments = await razorpay.orders.fetchPayments(
      booking.paymentIntentId,
    );

    if (!payments.items || payments.items.length === 0) {
      throw new Error("No payment found for this order");
    }

    const payment = payments.items[0];

    const refund = await razorpay.payments.refund(payment.id, {
      amount: refundAmountInPaise,
      speed: "normal",
      notes: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
      },
    });

    const isPartialRefund =
      refundAmount < parseFloat(booking.totalPrice.toString());

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        refundAmount,
        refundedAt: new Date(),
        paymentStatus: isPartialRefund ? "PARTIALLY_REFUNDED" : "REFUNDED",
        status: isPartialRefund ? booking.status : "REFUNDED",
      },
    });

    logger.info("Refund processed", {
      bookingId,
      refundId: refund.id,
      amount: refundAmountInPaise,
    });

    return {
      refundId: refund.id,
      amount: refundAmount,
      status: refund.status,
    };
  } catch (error: any) {
    logger.error("Failed to process refund", {
      error: error.message,
      bookingId,
    });
    throw error;
  }
}

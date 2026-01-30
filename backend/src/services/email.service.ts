import { addEmailToQueue } from "../queues/email.queue";
import { logger } from "../config/logger.config";
import {
  getBookingConfirmationTemplate,
  getBookingCancellationTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetTemplate,
} from "./email-template.service";

export async function sendBookingConfirmation(data: {
  email: string;
  firstName: string;
  bookingReference: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  seatsBooked: number;
  totalPrice: number;
}) {
  const subject = `Booking Confirmed - ${data.eventTitle}`;
  const html = getBookingConfirmationTemplate(data.firstName, {
    bookingReference: data.bookingReference,
    eventTitle: data.eventTitle,
    eventDate: data.eventDate,
    venue: data.venue,
    seatsBooked: data.seatsBooked,
    totalPrice: data.totalPrice,
  });

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 3,
  });

  logger.info("Booking confirmation email queued", {
    email: data.email,
    bookingReference: data.bookingReference,
  });
}

export async function sendBookingCancellation(data: {
  email: string;
  firstName: string;
  bookingReference: string;
  eventTitle: string;
  refundAmount: number;
}) {
  const subject = `Booking Cancelled - ${data.eventTitle}`;
  const html = getBookingCancellationTemplate(data.firstName, {
    bookingReference: data.bookingReference,
    eventTitle: data.eventTitle,
    refundAmount: data.refundAmount,
  });

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 2,
  });

  logger.info("Booking cancellation email queued", {
    email: data.email,
    bookingReference: data.bookingReference,
  });
}

export async function sendWelcomeEmail(data: {
  email: string;
  firstName: string;
}) {
  const subject = "Welcome to Ticket Booking System!";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome aboard! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${data.firstName},</p>
          <p>Thank you for registering with Ticket Booking System!</p>
          <p>You can now browse and book tickets for exciting events.</p>
          <p>Get started by exploring our upcoming events and finding your next adventure!</p>
          <p>Happy booking!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
          <p>Need help? Contact us anytime at support@ticketbooking.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 5,
  });

  logger.info("Welcome email queued", { email: data.email });
}

export async function sendVerificationEmail(data: {
  email: string;
  firstName: string;
  verificationUrl: string;
}) {
  const subject = "Verify Your Email - Ticket Booking System";
  const html = getWelcomeEmailTemplate(data.firstName, data.verificationUrl);

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 1,
  });

  logger.info("Verification email queued", { email: data.email });
}

export async function sendPasswordResetEmail(data: {
  email: string;
  firstName: string;
  resetToken: string;
  resetUrl: string;
}) {
  const subject = "Password Reset Request - Ticket Booking System";
  const html = getPasswordResetTemplate(data.firstName, data.resetUrl);

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 1,
  });

  logger.info("Password reset email queued", { email: data.email });
}

export async function sendPasswordResetConfirmation(data: {
  email: string;
  firstName: string;
}) {
  const subject = "Password Changed Successfully - Ticket Booking System";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        .alert { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed Successfully</h1>
        </div>
        <div class="content">
          <p>Hi ${data.firstName},</p>
          <p>Your password has been changed successfully.</p>
          <div class="alert">
            <p><strong>Security Notice:</strong></p>
            <p>For your security, all your active sessions have been logged out.</p>
            <p>Please login again with your new password.</p>
          </div>
          <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
          <p>Contact support: support@ticketbooking.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 2,
  });

  logger.info("Password reset confirmation email queued", {
    email: data.email,
  });
}

export async function sendEventReminder(data: {
  email: string;
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  bookingReference: string;
}) {
  const subject = `Reminder: ${data.eventTitle} is tomorrow!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .event-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Event Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${data.firstName},</p>
          <p>This is a reminder that your event is happening soon!</p>
          <div class="event-details">
            <p><strong>Event:</strong> ${data.eventTitle}</p>
            <p><strong>Date:</strong> ${new Date(data.eventDate).toLocaleString()}</p>
            <p><strong>Venue:</strong> ${data.venue}</p>
            <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
          </div>
          <p><strong>Important reminders:</strong></p>
          <ul>
            <li>Arrive at least 30 minutes early</li>
            <li>Bring a valid ID for verification</li>
            <li>Keep your booking reference ready</li>
          </ul>
          <p>We hope you have a great time!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
          <p>Have questions? Contact us at support@ticketbooking.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 4,
  });

  logger.info("Event reminder email queued", {
    email: data.email,
    eventTitle: data.eventTitle,
  });
}

export async function sendAccountDeactivation(data: {
  email: string;
  firstName: string;
}) {
  const subject = "Account Deactivated - Ticket Booking System";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Account Deactivated</h1>
        </div>
        <div class="content">
          <p>Hi ${data.firstName},</p>
          <p>Your account has been deactivated as per your request.</p>
          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <p>If you didn't request this, please contact our support team immediately.</p>
          </div>
          <p>To reactivate your account, please reach out to support@ticketbooking.com</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
          <p>Thank you for being part of Ticket Booking System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await addEmailToQueue({
    to: data.email,
    subject,
    html,
    priority: 3,
  });

  logger.info("Account deactivation email queued", { email: data.email });
}

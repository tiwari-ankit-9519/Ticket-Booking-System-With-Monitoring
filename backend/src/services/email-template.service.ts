import { logger } from "../config/logger.config";

export function getWelcomeEmailTemplate(
  firstName: string,
  verificationUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Ticket Booking!</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <center>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
          <p>This email was sent to you because you signed up for our service.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getBookingConfirmationTemplate(
  firstName: string,
  bookingDetails: {
    bookingReference: string;
    eventTitle: string;
    eventDate: string;
    venue: string;
    seatsBooked: number;
    totalPrice: number;
  },
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .booking-card { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .total { font-size: 24px; font-weight: bold; color: #11998e; text-align: center; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>Your booking has been confirmed. Here are your details:</p>
          
          <div class="booking-card">
            <div class="detail-row">
              <span class="label">Booking Reference:</span>
              <span class="value">${bookingDetails.bookingReference}</span>
            </div>
            <div class="detail-row">
              <span class="label">Event:</span>
              <span class="value">${bookingDetails.eventTitle}</span>
            </div>
            <div class="detail-row">
              <span class="label">Venue:</span>
              <span class="value">${bookingDetails.venue}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date & Time:</span>
              <span class="value">${new Date(bookingDetails.eventDate).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Seats:</span>
              <span class="value">${bookingDetails.seatsBooked}</span>
            </div>
          </div>
          
          <div class="total">
            Total Paid: ₹${bookingDetails.totalPrice.toFixed(2)}
          </div>
          
          <p><strong>Important:</strong> Please arrive at the venue at least 30 minutes before the event starts.</p>
          <p>Show this email or your booking reference at the entrance.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getBookingCancellationTemplate(
  firstName: string,
  bookingDetails: {
    bookingReference: string;
    eventTitle: string;
    refundAmount: number;
  },
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
        .refund-info { background: #f1f8e9; border-left: 4px solid #8bc34a; padding: 15px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Booking Cancelled</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>Your booking has been cancelled as requested.</p>
          
          <div class="info-box">
            <strong>Cancelled Booking Details:</strong><br>
            Reference: ${bookingDetails.bookingReference}<br>
            Event: ${bookingDetails.eventTitle}
          </div>
          
          ${
            bookingDetails.refundAmount > 0
              ? `
          <div class="refund-info">
            <strong>💰 Refund Information:</strong><br>
            Amount: ₹${bookingDetails.refundAmount.toFixed(2)}<br>
            The refund will be processed within 5-7 business days to your original payment method.
          </div>
          `
              : ""
          }
          
          <p>We're sorry to see you go! We hope to serve you again in the future.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getPasswordResetTemplate(
  firstName: string,
  resetUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password will remain unchanged</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

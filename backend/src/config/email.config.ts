import nodemailer from "nodemailer";
import { logger } from "./logger.config";

export const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

emailTransporter.verify((error, success) => {
  if (error) {
    logger.error("Email transporter verification failed", {
      error: error.message,
    });
  } else {
    logger.info("Email server is ready to send messages");
  }
});

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text,
  };

  try {
    logger.debug("Sending email", {
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await emailTransporter.sendMail(mailOptions);

    logger.info("Email sent successfully", {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    return info;
  } catch (error: any) {
    logger.error("Failed to send email", {
      error: error.message,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });
    throw error;
  }
}

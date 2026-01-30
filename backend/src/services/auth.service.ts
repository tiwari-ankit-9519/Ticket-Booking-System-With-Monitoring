import { prisma } from "@/config/database.config";
import { redis } from "@/config/redis.config";
import { logger } from "@/config/logger.config";
import { hashPassword, verifyPassword, needsRehash } from "@/utils/password";
import { isPasswordCompromised } from "@/utils/password-validation";
import { generateTokenPair, verifyRefreshToken } from "@/utils/jwt.util";
import { logUserAction, logUnauthorizedAccess } from "./audit.service";
import { RegisterInput, LoginInput } from "@/validations/auth.validation";
import { User, UserRole } from "@/prisma/generated/prisma/client";
import crypto from "crypto";
import {
  sendPasswordResetConfirmation,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email.service";
import * as notificationService from "./notification.service";
import { incrementUserRegistrations } from "./prometheus.service";

export async function register(
  data: RegisterInput,
  ipAddress: string,
  userAgent?: string,
): Promise<{
  user: Omit<User, "password">;
  tokens: ReturnType<typeof generateTokenPair>;
}> {
  try {
    logger.info("User Registration Attempt", { email: data.email });
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      logger.warn("Registration failed. Email already exists", {
        email: data.email,
      });
      throw new Error("Email already registered");
    }

    const isCompromised = await isPasswordCompromised(data.password);
    if (isCompromised) {
      logger.warn("Registration failed: Compromised password detected", {
        email: data.email,
      });
      throw new Error(
        "This password has been compromised. Please use a different password",
      );
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
      },
    });

    incrementUserRegistrations();

    await logUserAction(
      user.id,
      "USER_REGISTER",
      "USER",
      user.id,
      ipAddress,
      userAgent,
      { email: user.email, registrationMethod: "email" },
    );

    await notificationService.createNotification(
      user.id,
      "Welcome to Ticket Booking System! 🎉",
      "Your account has been created successfully. Start exploring events now!",
      "SYSTEM_ANNOUNCEMENT",
    );

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn,
      ipAddress,
      userAgent,
    );

    const { password: _, ...userWithoutPassword } = user;
    logger.info("User Registered Successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      user: userWithoutPassword,
      tokens,
    };
  } catch (error: any) {
    logger.error("Registration failed", {
      email: data.email,
      error: error.message as string,
    });
    throw error;
  }
}

export async function login(
  data: LoginInput,
  ipAddress: string,
  userAgent?: string,
): Promise<{
  user: Omit<User, "password">;
  tokens: ReturnType<typeof generateTokenPair>;
}> {
  try {
    logger.info("User login attempt", {
      email: data.email,
    });

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      logger.warn("Login failed:User not found", {
        email: data.email,
      });
      await logUnauthorizedAccess(
        { ip: ipAddress, headers: { "user-agent": userAgent } } as any,
        "Invalid credentials",
      );

      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      logger.warn("Login failed: Account is deactivated", {
        user: user.id,
        email: data.email,
      });
      await logUserAction(
        user.id,
        "UNAUTHORIZED_ACCESS",
        "USER",
        user.id,
        ipAddress,
        userAgent,
        { reason: "Account Deactivated" },
      );
      throw new Error("Account has been deactivated");
    }

    const isValidPassword = await verifyPassword(data.password, user.password);

    if (!isValidPassword) {
      logger.warn("Login failed: Invalid password", {
        userId: user.id,
        email: data.email,
      });

      await logUnauthorizedAccess(
        { ip: ipAddress, headers: { "user-agent": userAgent } } as any,
        "Invalid Credentials",
      );

      throw new Error("Invalid email or password");
    }

    if (await needsRehash(user.password)) {
      logger.info("Rehashing password for user", {
        userId: user.id,
      });
      const newHash = await hashPassword(data.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    await logUserAction(
      user.id,
      "USER_LOGIN",
      "USER",
      user.id,
      ipAddress,
      userAgent,
      { loginMethod: "password" },
    );

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn,
      ipAddress,
      userAgent,
    );

    const { password: _, ...userWithoutPassword } = user;
    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });
    return {
      user: userWithoutPassword,
      tokens,
    };
  } catch (error: any) {
    logger.error("Login failed", {
      email: data.email,
      error: error.message,
    });
    throw error;
  }
}

export async function refreshToken(
  refreshToken: string,
  ipAddress: string,
  userAgent?: string,
): Promise<{
  tokens: ReturnType<typeof generateTokenPair>;
}> {
  try {
    logger.info("Token refresh attempt");
    const verification = verifyRefreshToken(refreshToken);
    if (!verification.valid) {
      logger.warn("Token refresh failed: Invalid token", {
        error: verification.error,
      });
      throw new Error("Invalid refresh token");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: { user: true },
    });

    if (!storedToken) {
      logger.warn("Token refresh failed: Token not found in database");
      throw new Error("Invalid refresh token");
    }

    if (storedToken.isRevoked) {
      logger.warn("Token refresh failed: Token has been revoked", {
        userId: storedToken.userId,
      });

      throw new Error("Account has been deactivated");
    }

    if (new Date() > storedToken.expiresAt) {
      logger.warn("Token refresh failed: Token expired", {
        userId: storedToken.userId,
      });
      throw new Error("Refresh token expired");
    }

    if (!storedToken.user.isActive) {
      logger.warn("Token refresh failed: User account deactivated", {
        userId: storedToken.userId,
      });
      throw new Error("Account has been deactivated");
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const tokens = generateTokenPair({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    await storeRefreshToken(
      storedToken.user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn,
      ipAddress,
      userAgent,
    );

    logger.info("Tokens refreshed successfully", {
      userId: storedToken.userId,
    });

    return { tokens };
  } catch (error: any) {
    logger.error("Token refresh failed", { error: error.message });
    throw error;
  }
}

export async function logout(
  refreshToken: string,
  userId: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    logger.info("User logout attempt", { userId });
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId: userId,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    await redis.del(`user:${userId}: session`);

    await logUserAction(
      userId,
      "USER_LOGOUT",
      "USER",
      userId,
      ipAddress,
      userAgent,
    );

    logger.info("User logged out successfully", { userId });
  } catch (error: any) {
    logger.error("Logout failed", { userId, error: error.message });
    throw error;
  }
}

export async function getCurrentUser(
  userId: string,
): Promise<Omit<User, "password">> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error: any) {
    logger.error("Failed to get current user", {
      userId,
      error: error.message,
    });
    throw error;
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    logger.info("Password change attempt", { userId });
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      logger.warn("User does not exists", { userId });
      throw new Error("User not found");
    }

    const isValidPassword = await verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      logger.warn("Password change failed: Invalid current password", {
        userId,
      });
      throw new Error("Current Password is incorrect");
    }

    const isCompromised = await isPasswordCompromised(newPassword);
    if (isCompromised) {
      throw new Error(
        "This password has been compromised. Please use a different password",
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await revokeAllUserTokens(userId);

    await logUserAction(
      userId,
      "USER_PASSWORD_CHANGE",
      "USER",
      userId,
      ipAddress,
      userAgent,
    );
    logger.info("Password changed successfully", { userId });
  } catch (error: any) {
    logger.error("Password change failed", {
      userId,
      error: error.message,
    });
    throw error;
  }
}

async function storeRefreshToken(
  userId: string,
  token: string,
  expiresIn: number,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    logger.debug("Refresh token stored", { userId });
  } catch (error: any) {
    logger.error("Failed to store refresh token", {
      userId,
      error: error.message,
    });
    throw error;
  }
}

async function revokeAllUserTokens(userId: string): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info("All user tokens revoked", { userId });
  } catch (error: any) {
    logger.error("Failed to revoke user tokens", {
      userId,
      error: error.message,
    });
    throw error;
  }
}

export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info("Expired tokens cleaned up", { count: result.count });
  } catch (error: any) {
    logger.error("Failed to cleanup expired tokens", {
      error: error.message,
    });
  }
}

export async function emailVerification(
  userId: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    logger.info("Verification Email sending attempt", { userId });
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      logger.warn("Email sending failed: User does not exists", { userId });
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      logger.warn("Email is already verified", { userId });
      throw new Error("Email already verified");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await redis.setex(
      `email-verification:${verificationToken}`,
      10 * 60 * 60,
      userId,
    );
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      verificationUrl,
    });

    await logUserAction(
      userId,
      "USER_EMAIL_VERIFY",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { action: "verification_email_sent" },
    );
    logger.info("Verification email sent", { userId, email: user.email });
  } catch (error: any) {
    logger.error("Failed to send verification email", { error: error.message });
  }
}

export async function verifyEmail(
  token: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    const userId = await redis.get(`email-verification:${token}`);
    if (!userId) {
      throw new Error("Invalid or expired verification token");
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }
    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isEmailVerified: true,
      },
    });

    await redis.del(`email-verification: ${token}`);
    await logUserAction(
      userId,
      "USER_EMAIL_VERIFY",
      "USER",
      userId,
      ipAddress,
      userAgent,
      { action: "email_verified" },
    );

    await notificationService.createNotification(
      userId,
      "Email Verified Successfully! ✅",
      "Your email has been verified. You can now access all features.",
      "SYSTEM_ANNOUNCEMENT",
    );

    logger.info("Email verified successfully", { userId, email: user.email });
  } catch (error: any) {
    logger.error("Could not verify email", { error: error.message });
    throw error;
  }
}

export async function requestPasswordResetEmail(
  email: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      logger.warn("Password reset requested for non-existent email", { email });
      return;
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await redis.setex(`password-reset:${resetToken}`, 10 * 60, user.id);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail({
      email: user.email,
      resetToken,
      firstName: user.firstName,
      resetUrl,
    });

    await logUserAction(
      user.id,
      "USER_PASSWORD_RESET",
      "USER",
      user.id,
      ipAddress,
      userAgent,
      { action: "reset_email_sent" },
    );

    logger.info("Password reset email sent", {
      userId: user.id,
      email: user.email,
    });
  } catch (error: any) {
    logger.error("Failed to send Password Reset Email", {
      error: error.message,
    });
    throw error;
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  try {
    const userId = await redis.get(`password-reset:${token}`);
    if (!userId) {
      throw new Error("Invalid or expired reset token");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      logger.warn("User does not exists", { userId });
      throw new Error("User not found");
    }
    const isCompromised = await isPasswordCompromised(newPassword);
    if (isCompromised) {
      throw new Error(
        "This password has been compromised. Please use a different password",
      );
    }
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await revokeAllUserTokens(userId);
    await redis.del(`password-reset:${token}`);
    await logUserAction(
      user.id,
      "USER_PASSWORD_RESET",
      "USER",
      user.id,
      ipAddress,
      userAgent,
      { action: "password_reset_completed" },
    );

    await sendPasswordResetConfirmation({
      email: user.email,
      firstName: user.firstName,
    });

    logger.info("Password reset successfully", {
      userId: user.id,
      email: user.email,
    });
  } catch (error: any) {
    logger.error("Failed to reset password", { error: error.message });
    throw error;
  }
}

import { Request, Response } from "express";
import * as authService from "@/services/auth.service";
import { getClientIp } from "@/utils/user-agent.util";
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
} from "@/validations/auth.validation";
import { logger } from "@/config/logger.config";
import { AuthRequest } from "@/middlewares/auth.middleware";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = registerSchema.parse(req.body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    const result = await authService.register(
      validatedData,
      ipAddress,
      userAgent,
    );

    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: result.tokens.refreshTokenExpiresIn * 1000,
    });

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.accessTokenExpiresIn,
      },
    });
  } catch (error: any) {
    logger.error("Register controller error", { error: error.message });
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Registration Failed",
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = loginSchema.parse(req.body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];
    const result = await authService.login(validatedData, ipAddress, userAgent);

    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: result.tokens.refreshTokenExpiresIn * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login Successful",
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.accessTokenExpiresIn,
      },
    });
  } catch (error: any) {
    logger.error("Login Controller Error", { error: error.message });
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation Failed",
        error: error.issues,
      });
      return;
    }

    res.status(401).json({
      succcess: false,
      message: error.message || "Login Failed",
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token not provided",
      });
      return;
    }
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];
    const result = await authService.refreshToken(
      refreshToken,
      ipAddress,
      userAgent,
    );
    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: result.tokens.refreshTokenExpiresIn * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.accessTokenExpiresIn,
      },
    });
  } catch (error: any) {
    logger.error("Refresh Token controller error", { error: error.message });
    res.status(401).json({
      success: false,
      message: error.message || "Token refresh failed",
    });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken;
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    if (refreshToken) {
      await authService.logout(refreshToken, userId, ipAddress, userAgent);
    }

    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error: any) {
    logger.error("Logout controller error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Logout Failed",
    });
  }
}

export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    logger.error("Get current user error", { error: error.message });

    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
}

export async function changePassword(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    await authService.changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword,
      ipAddress,
      userAgent,
    );

    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again",
    });
  } catch (error: any) {
    logger.error("Change Password controller error", { error: error.message });

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: error.issues,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
}

export async function sendVerificationEmail(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];
    await authService.emailVerification(userId, ipAddress, userAgent);
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error: any) {
    logger.error("Send Verification Email Controller Error", {
      error: error.message,
    });

    res.status(400).json({
      success: false,
      message: error.message || "Failed to send verification email",
    });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = verifyEmailSchema.parse(req.query);
    console.log(validatedData);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];
    await authService.verifyEmail(validatedData.token, ipAddress, userAgent);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    logger.error("Verify Email Controller Error", { error: error.message });
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: error.issues,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to verify email",
    });
  }
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    await authService.requestPasswordResetEmail(
      validatedData.email,
      ipAddress,
      userAgent,
    );
    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent",
    });
  } catch (error: any) {
    logger.error("Request Password Reset controller error", {
      error: error.message,
    });
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: error.issues,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to send password reset request",
    });
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    await authService.resetPassword(
      validatedData.newPassword,
      validatedData.token,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      succes: true,
      message:
        "Password reset successfully. Please login again with new password",
    });
  } catch (error: any) {
    logger.error("Reset Password Controller Error", { error: error.message });
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: error.issues,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
}

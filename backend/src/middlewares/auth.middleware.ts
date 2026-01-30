import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractTokenFromHeader } from "../utils/jwt.util";
import { logger } from "../config/logger.config";
import { logUnauthorizedAccess } from "../services/audit.service";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      await logUnauthorizedAccess(req, "No token provided");
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const verification = verifyAccessToken(token);

    if (!verification.valid) {
      await logUnauthorizedAccess(req, verification.error || "Invalid token");

      if (verification.expired) {
        res.status(401).json({
          success: false,
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    req.user = {
      userId: verification.decoded!.userId,
      email: verification.decoded!.email,
      role: verification.decoded!.role,
    };

    logger.debug("User authenticated", {
      userId: req.user.userId,
      email: req.user.email,
    });

    next();
  } catch (error: any) {
    logger.error("Authentication middleware error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn("Insufficient permissions", {
        userId: req.user.userId,
        requiredRoles: roles,
        userRole: req.user.role,
      });

      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    next();
    return;
  }

  const verification = verifyAccessToken(token);

  if (verification.valid) {
    req.user = {
      userId: verification.decoded!.userId,
      email: verification.decoded!.email,
      role: verification.decoded!.role,
    };
  }

  next();
}

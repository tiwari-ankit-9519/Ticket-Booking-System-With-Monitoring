import jwt, { SignOptions } from "jsonwebtoken";
import { logger } from "../config/logger.config";
import {
  JwtPayload,
  TokenPair,
  DecodedToken,
  VerifyTokenResult,
} from "../types/jwt.types";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_TOKEN_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || "15m") as string;
const REFRESH_TOKEN_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || "7d") as string;

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured in environment variables");
}

if (ACCESS_TOKEN_SECRET.length < 32 || REFRESH_TOKEN_SECRET.length < 32) {
  logger.warn("JWT secrets should be at least 32 characters long for security");
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
}

export function generateAccessToken(
  payload: Omit<JwtPayload, "tokenType">,
): string {
  try {
    const tokenPayload: JwtPayload = {
      ...payload,
      tokenType: "access",
    };

    const token = jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: "ticket-booking-system",
      audience: "ticket-booking-users",
    } as SignOptions);

    logger.debug("Access token generated", {
      userId: payload.userId,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    return token;
  } catch (error: any) {
    logger.error("Failed to generate access token", {
      error: error.message,
      userId: payload.userId,
    });
    throw new Error("Failed to generate access token");
  }
}

export function generateRefreshToken(
  payload: Omit<JwtPayload, "tokenType">,
): string {
  try {
    const tokenPayload: JwtPayload = {
      ...payload,
      tokenType: "refresh",
    };

    const token = jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: "ticket-booking-system",
      audience: "ticket-booking-users",
    } as SignOptions);

    logger.debug("Refresh token generated", {
      userId: payload.userId,
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return token;
  } catch (error: any) {
    logger.error("Failed to generate refresh token", {
      error: error.message,
      userId: payload.userId,
    });
    throw new Error("Failed to generate refresh token");
  }
}

export function generateTokenPair(
  payload: Omit<JwtPayload, "tokenType">,
): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: parseExpiry(ACCESS_TOKEN_EXPIRY),
    refreshTokenExpiresIn: parseExpiry(REFRESH_TOKEN_EXPIRY),
  };
}

export function verifyAccessToken(token: string): VerifyTokenResult {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "ticket-booking-system",
      audience: "ticket-booking-users",
    }) as DecodedToken;

    if (decoded.tokenType !== "access") {
      logger.warn("Invalid token type for access token", {
        tokenType: decoded.tokenType,
        userId: decoded.userId,
      });
      return {
        valid: false,
        expired: false,
        decoded: null,
        error: "Invalid token type",
      };
    }

    logger.debug("Access token verified successfully", {
      userId: decoded.userId,
    });

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      logger.debug("Access token expired", {
        expiredAt: error.expiredAt,
      });
      return {
        valid: false,
        expired: true,
        decoded: null,
        error: "Token expired",
      };
    }

    if (error.name === "JsonWebTokenError") {
      logger.warn("Invalid access token", {
        error: error.message,
      });
      return {
        valid: false,
        expired: false,
        decoded: null,
        error: "Invalid token",
      };
    }

    logger.error("Access token verification error", {
      error: error.message,
    });

    return {
      valid: false,
      expired: false,
      decoded: null,
      error: "Token verification failed",
    };
  }
}

export function verifyRefreshToken(token: string): VerifyTokenResult {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: "ticket-booking-system",
      audience: "ticket-booking-users",
    }) as DecodedToken;

    if (decoded.tokenType !== "refresh") {
      logger.warn("Invalid token type for refresh token", {
        tokenType: decoded.tokenType,
        userId: decoded.userId,
      });
      return {
        valid: false,
        expired: false,
        decoded: null,
        error: "Invalid token type",
      };
    }

    logger.debug("Refresh token verified successfully", {
      userId: decoded.userId,
    });

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      logger.debug("Refresh token expired", {
        expiredAt: error.expiredAt,
      });
      return {
        valid: false,
        expired: true,
        decoded: null,
        error: "Token expired",
      };
    }

    if (error.name === "JsonWebTokenError") {
      logger.warn("Invalid refresh token", {
        error: error.message,
      });
      return {
        valid: false,
        expired: false,
        decoded: null,
        error: "Invalid token",
      };
    }

    logger.error("Refresh token verification error", {
      error: error.message,
    });

    return {
      valid: false,
      expired: false,
      decoded: null,
      error: "Token verification failed",
    };
  }
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error: any) {
    logger.error("Failed to decode token", {
      error: error.message,
    });
    return null;
  }
}

export function getTokenExpiry(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded?.exp || null;
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;

  const now = Math.floor(Date.now() / 1000);
  return now >= expiry;
}

export function getTokenRemainingTime(token: string): number {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = expiry - now;

  return remaining > 0 ? remaining : 0;
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

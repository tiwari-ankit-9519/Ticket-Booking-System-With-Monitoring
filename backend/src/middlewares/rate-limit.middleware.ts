import rateLimit from "express-rate-limit";
import { logRateLimitExceeded } from "../services/audit.service";
import { AuthRequest } from "./auth.middleware";

export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const authReq = req as AuthRequest;
    await logRateLimitExceeded(req, authReq.user?.userId);

    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
    });
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes",
  },
  skipSuccessfulRequests: true,
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Rate limit exceeded",
  },
});

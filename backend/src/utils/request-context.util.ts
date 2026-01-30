import { Request } from "express";
import { getClientIp, sanitizeUserAgent } from "./user-agent.util";

export interface RequestContext {
  ipAddress: string;
  userAgent: string;
  method: string;
  endpoint: string;
  userId?: string;
}

export function extractRequestContext(
  req: Request,
  userId?: string,
): RequestContext {
  return {
    ipAddress: getClientIp(req),
    userAgent: sanitizeUserAgent(req.headers["user-agent"]),
    method: req.method,
    endpoint: req.originalUrl || req.url,
    userId,
  };
}

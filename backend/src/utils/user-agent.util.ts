import { UAParser } from "ua-parser-js";
import { DeviceInfo } from "../types/audit.types";

export function parseUserAgent(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: result.browser.name,
    browserVersion: result.browser.version,
    os: result.os.name,
    osVersion: result.os.version,
    device: result.device.model || "Unknown",
    deviceType: result.device.type || "desktop",
    platform: result.os.name,
    isMobile:
      result.device.type === "mobile" || result.device.type === "tablet",
    isBot: /bot|crawler|spider|crawling/i.test(userAgent),
  };
}

export function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = forwarded.split(",");
    return ips[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

export function sanitizeUserAgent(userAgent?: string): string {
  if (!userAgent) return "Unknown";
  return userAgent.substring(0, 500);
}

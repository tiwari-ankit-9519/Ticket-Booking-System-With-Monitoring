import { AuditAction, EntityType } from "../prisma/generated/prisma/client";

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
  metadata?: any;
}

export interface DeviceInfo {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  deviceType?: string;
  platform?: string;
  isMobile?: boolean;
  isBot?: boolean;
}

export interface LocationInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface AuditQueryFilters {
  userId?: string;
  action?: AuditAction | AuditAction[];
  entityType?: EntityType;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  excludeMonitoring?: boolean;
}

import { OrganizerVerificationStatus } from "../prisma/generated/prisma/client";

export interface OrganizerProfileResponse {
  id: string;
  userId: string;
  businessName: string;
  businessRegistration?: string;
  taxId?: string;
  website?: string;
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  description: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessCountry?: string;
  verificationStatus: OrganizerVerificationStatus;
  verificationDocuments: string[];
  rejectionReason?: string;
  eventsCreated: number;
  eventsCompleted: number;
  eventsPublished: number;
  totalRevenue: number;
  reputationScore: number;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizerStats {
  totalOrganizers: number;
  pendingApprovals: number;
  approvedOrganizers: number;
  rejectedOrganizers: number;
  suspendedOrganizers: number;
}

export interface OrganizerListItem {
  id: string;
  userId: string;
  businessName: string;
  email: string;
  firstName: string;
  lastName: string;
  verificationStatus: OrganizerVerificationStatus;
  eventsCreated: number;
  reputationScore: number;
  createdAt: Date;
}

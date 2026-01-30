import { z } from "zod";

export const createOrganizerProfileSchema = z.object({
  businessName: z.string().min(2).max(200),
  businessRegistration: z.string().min(5).max(100).optional(),
  taxId: z.string().min(5).max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  socialMediaLinks: z
    .object({
      facebook: z.string().url().optional(),
      twitter: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    })
    .optional(),
  description: z.string().min(50).max(2000),
  businessAddress: z.string().min(10).max(500).optional(),
  businessCity: z.string().min(2).max(100).optional(),
  businessState: z.string().min(2).max(100).optional(),
  businessCountry: z.string().min(2).max(100).optional(),
});

export const updateOrganizerProfileSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  businessRegistration: z.string().min(5).max(100).optional(),
  taxId: z.string().min(5).max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  socialMediaLinks: z
    .object({
      facebook: z.string().url().optional(),
      twitter: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    })
    .optional(),
  description: z.string().min(50).max(2000).optional(),
  businessAddress: z.string().min(10).max(500).optional(),
  businessCity: z.string().min(2).max(100).optional(),
  businessState: z.string().min(2).max(100).optional(),
  businessCountry: z.string().min(2).max(100).optional(),
});

export const approveOrganizerSchema = z.object({
  userId: z.string().cuid(),
});

export const rejectOrganizerSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(10).max(500),
});

export const suspendOrganizerSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(10).max(500),
});

export type CreateOrganizerProfileInput = z.infer<
  typeof createOrganizerProfileSchema
>;
export type UpdateOrganizerProfileInput = z.infer<
  typeof updateOrganizerProfileSchema
>;
export type ApproveOrganizerInput = z.infer<typeof approveOrganizerSchema>;
export type RejectOrganizerInput = z.infer<typeof rejectOrganizerSchema>;
export type SuspendOrganizerInput = z.infer<typeof suspendOrganizerSchema>;

import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger.config";
import { UploadedFile } from "../types/file.types";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: UploadedFile,
  folder: string = "events",
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `ticket-booking/${folder}`,
      resource_type: "auto",
      transformation: [
        { width: 1200, height: 630, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    logger.info("Image uploaded to Cloudinary", {
      publicId: result.public_id,
      url: result.secure_url,
    });

    return result.secure_url;
  } catch (error: any) {
    logger.error("Cloudinary upload failed", { error: error.message });
    throw new Error("Failed to upload image");
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info("Image deleted from Cloudinary", { publicId });
  } catch (error: any) {
    logger.error("Cloudinary delete failed", { error: error.message });
  }
}

export function extractPublicId(imageUrl: string): string | null {
  const regex = /\/ticket-booking\/(.+)\.[a-z]{3,4}$/i;
  const match = imageUrl.match(regex);
  return match ? `ticket-booking/${match[1]}` : null;
}

export default cloudinary;

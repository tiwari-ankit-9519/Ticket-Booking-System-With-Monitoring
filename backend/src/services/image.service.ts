import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../config/cloudinary.config";
import { deleteLocalFile } from "../config/multer.config";
import { logger } from "../config/logger.config";
import { UploadedFile } from "../types/file.types";

export async function uploadEventImage(file: UploadedFile): Promise<string> {
  try {
    const imageUrl = await uploadToCloudinary(file, "events");

    deleteLocalFile(file.path);

    return imageUrl;
  } catch (error: any) {
    deleteLocalFile(file.path);

    logger.error("Failed to upload event image", { error: error.message });
    throw error;
  }
}

export async function deleteEventImage(imageUrl: string): Promise<void> {
  try {
    const publicId = extractPublicId(imageUrl);

    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  } catch (error: any) {
    logger.error("Failed to delete event image", { error: error.message });
  }
}

export async function replaceEventImage(
  newFile: UploadedFile,
  oldImageUrl?: string,
): Promise<string> {
  try {
    const newImageUrl = await uploadEventImage(newFile);

    if (oldImageUrl) {
      await deleteEventImage(oldImageUrl);
    }

    return newImageUrl;
  } catch (error: any) {
    logger.error("Failed to replace event image", { error: error.message });
    throw error;
  }
}

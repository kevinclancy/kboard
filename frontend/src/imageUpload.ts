import { API_ROOT } from "./config";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export type ImageUploadState =
  | { type: "none" }
  | { type: "uploading"; file: File }
  | { type: "uploaded"; file: File; pendingKey: string; previewUrl: string }
  | { type: "error"; message: string };

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Unsupported file type. Please use JPEG, PNG, GIF, or WebP.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image is too large. Maximum size is 5 MB.";
  }
  return null;
}

export async function getPresignedUrl(
  contentType: string,
): Promise<{ upload_url: string; pending_key: string }> {
  const response = await fetch(`${API_ROOT}/images/presign`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType }),
  });
  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }
  return response.json();
}

export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Failed to upload image");
  }
}

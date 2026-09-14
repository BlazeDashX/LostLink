import { api } from "./api";

export interface UploadResponse {
  message: string;
  url: string;
  storage?: string;
  publicId?: string;
  filename?: string;
}

export interface UploadImageParams {
  base64?: string | null;
  uri?: string;
  filename?: string;
  mimeType?: string;
}

/**
 * Upload an image to the backend persistent cloud storage.
 * @param params Object containing image base64, uri, or filename
 * @param userId Current user ID for authentication header
 * @returns Promise<UploadResponse>
 */
export async function uploadImage(
  params: UploadImageParams,
  userId?: string | null
): Promise<UploadResponse> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await api.post<UploadResponse>(
    "/api/uploads",
    {
      image: params.base64,
      filename: params.filename || "item_photo.jpg",
      mimeType: params.mimeType || "image/jpeg",
    },
    { headers }
  );

  return response.data;
}

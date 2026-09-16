const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// Check for Cloudinary configuration
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
   process.env.CLOUDINARY_API_KEY &&
   process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

// Local persistent uploads directory fallback
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Handle image upload.
 * Uploads to Cloudinary if configured; otherwise persists to server uploads directory.
 * Returns a persistent HTTP/HTTPS image URL.
 */
async function uploadImage(req, res) {
  try {
    const { image, base64, filename, mimeType } = req.body;
    const rawImage = image || base64;

    if (!rawImage) {
      return res.status(400).json({
        message: "No image data provided for upload.",
      });
    }

    const type = mimeType || "image/jpeg";
    const dataUri = rawImage.startsWith("data:")
      ? rawImage
      : `data:${type};base64,${rawImage}`;

    // 1. Cloudinary storage (if configured)
    if (isCloudinaryConfigured) {
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "lostlink/items",
        resource_type: "image",
      });

      return res.status(200).json({
        message: "Image uploaded successfully to cloud storage.",
        url: uploadResult.secure_url || uploadResult.url,
        publicId: uploadResult.public_id,
        storage: "cloudinary",
      });
    }

    // 2. Local persistent storage fallback
    const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const ext = type ? `.${type.split("/")[1]}` : path.extname(filename || "") || ".jpg";
    const uniqueFilename = `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    const persistentUrl = `${protocol}://${host}/uploads/${uniqueFilename}`;

    return res.status(200).json({
      message: "Image uploaded successfully.",
      url: persistentUrl,
      filename: uniqueFilename,
      storage: "local-persistent",
    });
  } catch (error) {
    console.error("Upload controller error:", error);
    return res.status(500).json({
      message: "Image upload failed.",
      error: error.message,
    });
  }
}

module.exports = {
  uploadImage,
};

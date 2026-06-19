import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary if credentials are present
const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn("⚠️ Cloudinary credentials are not configured in backend/.env. Uploads will fall back to storing raw Base64.");
}

/**
 * Uploads a base64 string or file path to Cloudinary.
 * @param {string} base64OrUrl - The base64 data string or an existing URL.
 * @param {string} folder - The folder in Cloudinary to store the file.
 * @returns {Promise<string>} The secure HTTPS URL of the uploaded asset, or the original string on fallback/failure.
 */
export const uploadToCloudinary = async (base64OrUrl, folder = "sanasa_insurance") => {
  if (!base64OrUrl) return "";

  // If it's already a URL (not base64), return it directly
  if (base64OrUrl.startsWith("http://") || base64OrUrl.startsWith("https://")) {
    return base64OrUrl;
  }

  // If not configured, fall back to returning the base64 string
  if (!isConfigured) {
    return base64OrUrl;
  }

  try {
    const result = await cloudinary.uploader.upload(base64OrUrl, {
      folder: folder,
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message || error);
    // Return original base64 as a fallback so the app does not break
    return base64OrUrl;
  }
};

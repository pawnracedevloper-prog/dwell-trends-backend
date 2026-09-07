import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer or base64/path to Cloudinary
 * @param {Buffer|string} file - Buffer from req.file.buffer or file path
 * @param {string} folder - Destination folder name
 */
export const uploadOnCloudinary = (file, folder = "dwell-trends/products") => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // If a Buffer is passed (Vercel / MemoryStorage compatible)
    if (Buffer.isBuffer(file)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary stream upload failed:", error);
            return reject(error);
          }
          console.log("✅ Image uploaded:", result.secure_url);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file);
    } else {
      // Fallback for direct URL or string path
      cloudinary.uploader.upload(file, { folder, resource_type: "auto" })
        .then((result) => resolve(result.secure_url))
        .catch((err) => reject(err));
    }
  });
};

export default uploadOnCloudinary;
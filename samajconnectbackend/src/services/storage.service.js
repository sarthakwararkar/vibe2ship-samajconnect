const fs = require("fs");
const path = require("path");

/**
 * Upload a base64-encoded file to local storage.
 * @param {string} base64Data - Base64 encoded file data
 * @param {string} folder - Storage folder (e.g. "issues", "listings", "profiles")
 * @param {string} fileName - File name (without extension)
 * @param {string} mimeType - MIME type (default: image/jpeg)
 * @returns {string} Local public URL
 */
async function uploadBase64(base64Data, folder, fileName, mimeType = "image/jpeg") {
  // Strip data url prefix if present
  const base64Content = base64Data.includes("base64,")
    ? base64Data.split("base64,")[1]
    : base64Data;

  const extension = mimeType.split("/")[1] || "jpg";
  const uploadDir = path.join(__dirname, "../../public/uploads", folder);

  // Ensure directory exists
  fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `${fileName}_${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(base64Content, "base64");

  fs.writeFileSync(filePath, buffer);

  const port = process.env.PORT || 5000;
  const backendUrl = `http://localhost:${port}`;
  return `${backendUrl}/uploads/${folder}/${filename}`;
}

/**
 * Delete a file from local storage by its URL.
 * @param {string} fileUrl - Public URL of the file to delete
 */
async function deleteFile(fileUrl) {
  try {
    const match = fileUrl.split("/uploads/")[1];
    if (match) {
      const filePath = path.join(__dirname, "../../public/uploads", match);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.warn("Local storage delete failed:", err.message);
  }
}

module.exports = { uploadBase64, deleteFile };


const fs = require("fs");
const path = require("path");

const uploadDir = path.resolve(__dirname, "../uploads");

const deleteUploadFile = async (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;

  const filePath = path.resolve(__dirname, "..", fileUrl.slice(1));
  if (!filePath.startsWith(`${uploadDir}${path.sep}`)) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not delete uploaded file ${fileUrl}:`, error);
    }
  }
};

const deleteUploadFiles = async (fileUrls) => {
  await Promise.all(fileUrls.filter(Boolean).map(deleteUploadFile));
};

module.exports = { deleteUploadFile, deleteUploadFiles };

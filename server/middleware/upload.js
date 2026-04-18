// server/middleware/upload.js  (create this or replace existing)
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary"); // your existing cloudinary config

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "evencers/services",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, quality: "auto", fetch_format: "auto" }],
  },
});

module.exports = multer({ storage, limits: { files: 15 } });
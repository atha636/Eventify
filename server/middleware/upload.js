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

const uploadServiceImages = multer({ storage, limits: { files: 15 } });

// ── Separate storage for user/vendor profile photos ────────────────
// (kept in its own Cloudinary folder so avatars don't mix with
// service gallery images)
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "evencers/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
  },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { files: 1, fileSize: 5 * 1024 * 1024 } });

module.exports = uploadServiceImages;
module.exports.uploadAvatar = uploadAvatar;
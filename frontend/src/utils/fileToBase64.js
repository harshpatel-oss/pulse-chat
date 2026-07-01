// src/utils/fileToBase64.js

// Backend upload handlers (updateProfile, createGroup, updateGroup, sendMessage)
// all check `value?.startsWith("data:")` and pass the raw string straight to
// cloudinary.uploader.upload(). They expect a base64 data URL, not a
// multipart/form-data file. This converts a browser File into that format.
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Basic guardrails before sending a potentially large base64 payload — the
// server's express.json limit is 10mb (see server.js), so we keep client-side
// images comfortably under that after base64 inflation (~33% larger).
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB raw -> ~8MB base64

export const validateImageFile = (file) => {
  if (!file) return { valid: true };
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Only image files are supported." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: "Image is too large. Please choose a file under 6MB." };
  }
  return { valid: true };
};

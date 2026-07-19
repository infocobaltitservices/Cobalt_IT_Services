import { getSiteContent, saveSiteContent } from "../lib/siteContentStore.js";
import { assertAdminAccess, createAdminSessionToken, getAdminCredentials } from "../lib/adminAuth.js";
import { hasCloudinaryConfig, getCloudinary } from "../lib/cloudinary.js";
import multer from "multer";

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 150 * 1024 * 1024,
  },
});

function normalizeContent(payload) {
  return payload && typeof payload === "object" ? payload : null;
}

function uploadBufferToCloudinary(cloudinary, buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export function registerSiteContentRoutes(app) {
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body || {};
    const configured = getAdminCredentials();

    if (email !== configured.email || password !== configured.password) {
      return res.status(401).json({ message: "Invalid admin email or password" });
    }

    return res.json({
      token: createAdminSessionToken(),
      email: configured.email,
    });
  });

  app.get("/api/site-content", async (_req, res) => {
    const content = await getSiteContent();
    res.json(content);
  });

  app.get("/api/admin/site-content", assertAdminAccess, async (_req, res) => {
    const content = await getSiteContent();
    res.json(content);
  });

  app.put("/api/admin/site-content", assertAdminAccess, async (req, res) => {
    const content = normalizeContent(req.body);
    if (!content) {
      return res.status(400).json({ message: "Invalid site content payload" });
    }

    const saved = await saveSiteContent(content);
    return res.json(saved);
  });

  app.post("/api/admin/upload-image", assertAdminAccess, async (req, res) => {
    const { imageData, folder = "cobalt-admin" } = req.body || {};

    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ message: "imageData is required" });
    }

    if (!hasCloudinaryConfig()) {
      return res.status(500).json({
        message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    const cloudinary = getCloudinary();
    const upload = await cloudinary.uploader.upload(imageData, {
      folder,
      resource_type: "image",
    });

    return res.status(201).json({
      url: upload.secure_url,
      publicId: upload.public_id,
      width: upload.width,
      height: upload.height,
    });
  });

  app.post("/api/admin/upload-media", assertAdminAccess, mediaUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "file is required" });
    }

    if (!hasCloudinaryConfig()) {
      return res.status(500).json({
        message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    const folder = req.body?.folder || "cobalt-admin";
    const requestedType = String(req.body?.resourceType || "").toLowerCase();
    const isVideo = requestedType === "video" || req.file.mimetype.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";

    if (!req.file.mimetype.startsWith("image/") && !req.file.mimetype.startsWith("video/")) {
      return res.status(400).json({ message: "Only image and video files are supported" });
    }

    const cloudinary = getCloudinary();
    const upload = await uploadBufferToCloudinary(cloudinary, req.file.buffer, {
      folder,
      resource_type: resourceType,
      filename_override: req.file.originalname,
      use_filename: true,
      unique_filename: true,
    });

    return res.status(201).json({
      url: upload.secure_url,
      publicId: upload.public_id,
      resourceType: upload.resource_type,
      width: upload.width,
      height: upload.height,
      format: upload.format,
      bytes: upload.bytes,
      duration: upload.duration,
    });
  });
}

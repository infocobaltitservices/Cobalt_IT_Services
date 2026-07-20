import mongoose from "mongoose";
import { Inquiry } from "../models/Inquiry.js";
import { sendInquiryEmails } from "../lib/mailer.js";
import { assertAdminAccess } from "../lib/adminAuth.js";
import { validateInquiry } from "../lib/inquiryValidation.js";

export function registerInquiryRoutes(app) {
  app.get("/api/admin/inquiries", assertAdminAccess, async (_req, res) => {
    try {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(100).lean();
      return res.json({
        items: inquiries,
        total: inquiries.length,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Failed to load inquiries" });
    }
  });

  app.delete("/api/admin/inquiries/:inquiryId", assertAdminAccess, async (req, res) => {
    const { inquiryId } = req.params;

    if (!mongoose.isValidObjectId(inquiryId)) {
      return res.status(400).json({ message: "Invalid inquiry id" });
    }

    try {
      const deleted = await Inquiry.findByIdAndDelete(inquiryId).lean();

      if (!deleted) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      return res.json({ message: "Inquiry deleted", item: deleted });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Failed to delete inquiry" });
    }
  });

  app.post("/api/inquiry", async (req, res) => {
    const { inquiry, errors } = validateInquiry(req.body || {});

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        message: "Please correct the highlighted fields.",
        fields: errors,
      });
    }

    let record;

    try {
      record = await Inquiry.create(inquiry);
    } catch (error) {
      return res.status(500).json({ message: error.message || "Failed to save inquiry" });
    }

    const mailResult = await sendInquiryEmails(inquiry).catch((error) => ({
      enabled: false,
      replySent: false,
      notificationSent: false,
      replyError: error.message,
      notificationError: error.message,
    }));

    res.status(201).json({
      message: "Inquiry received",
      payload: record,
      email: mailResult,
    });
  });
}

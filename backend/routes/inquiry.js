import { Inquiry } from "../models/Inquiry.js";

export function registerInquiryRoutes(app) {
  app.post("/api/inquiry", async (req, res) => {
    const { name, email, phone, company, message } = req.body || {};
    const record = await Inquiry.create({ name, email, phone, company, message }).catch(() => null);

    res.status(201).json({
      message: "Inquiry received",
      payload: record || req.body,
    });
  });
}

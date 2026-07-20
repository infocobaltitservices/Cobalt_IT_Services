import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 24 },
    company: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  },
  {
    timestamps: true,
  }
);

export const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);

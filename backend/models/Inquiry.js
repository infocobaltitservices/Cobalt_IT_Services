import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    company: String,
    message: String,
  },
  {
    timestamps: true,
  }
);

export const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);

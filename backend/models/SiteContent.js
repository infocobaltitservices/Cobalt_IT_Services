import mongoose from "mongoose";

const SiteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export const SiteContent = mongoose.models.SiteContent || mongoose.model("SiteContent", SiteContentSchema);

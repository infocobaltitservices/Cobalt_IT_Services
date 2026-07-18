import mongoose from "mongoose";
import { defaultSiteContent } from "../data/defaultSiteContent.js";
import { SiteContent } from "../models/SiteContent.js";

let connectionPromise;

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MONGODB_URI is not set. Using local defaults only.");
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
    });
  }

  await connectionPromise;
  await ensureDefaultSiteContent();
  console.log("MongoDB Atlas connected");
  return mongoose.connection;
}

export async function ensureDefaultSiteContent() {
  const existing = await SiteContent.findOne({ key: "primary" }).lean();
  if (!existing) {
    await SiteContent.create({
      key: "primary",
      content: defaultSiteContent,
    });
  }
}

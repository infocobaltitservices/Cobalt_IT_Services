import { SiteContent } from "../models/SiteContent.js";

export async function getSiteContent() {
  const record = await SiteContent.findOne({ key: "primary" }).lean();
  return record?.content || null;
}

export async function saveSiteContent(content) {
  const payload = structuredClone(content);

  const record = await SiteContent.findOneAndUpdate(
    { key: "primary" },
    { $set: { content: payload }, $setOnInsert: { key: "primary" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return record?.content || payload;
}

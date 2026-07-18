import { defaultSiteContent } from "../data/defaultSiteContent.js";
import { SiteContent } from "../models/SiteContent.js";

let memoryContent = structuredClone(defaultSiteContent);

export async function getSiteContent() {
  const record = await SiteContent.findOne({ key: "primary" }).lean().catch(() => null);
  return record?.content || memoryContent;
}

export async function saveSiteContent(content) {
  const payload = structuredClone(content);
  memoryContent = payload;

  const record = await SiteContent.findOneAndUpdate(
    { key: "primary" },
    { key: "primary", content: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean().catch(() => null);

  return record?.content || payload;
}

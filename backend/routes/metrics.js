import { getSiteContent } from "../lib/siteContentStore.js";

export function registerMetricsRoutes(app) {
  app.get("/api/metrics", async (_req, res) => {
    const content = await getSiteContent();
    const stats = content?.about?.stats || [];

    res.json({
      stats,
    });
  });
}

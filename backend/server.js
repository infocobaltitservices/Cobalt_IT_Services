import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectToDatabase } from "./lib/db.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerMetricsRoutes } from "./routes/metrics.js";
import { registerNavigationRoutes } from "./routes/navigation.js";
import { registerInquiryRoutes } from "./routes/inquiry.js";
import { registerSiteContentRoutes } from "./routes/siteContent.js";

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

registerHealthRoutes(app);
registerMetricsRoutes(app);
registerNavigationRoutes(app);
registerInquiryRoutes(app);
registerSiteContentRoutes(app);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Cobalt backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  });

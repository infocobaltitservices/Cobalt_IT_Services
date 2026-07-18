import { getSiteContent } from "../lib/siteContentStore.js";

export function registerNavigationRoutes(app) {
  app.get("/api/navigation", async (_req, res) => {
    const content = await getSiteContent();
    const pages = ["Home", "About-Us", "Services", "Gallery", "Contact-Us"];

    res.json({
      pages,
      brand: content.brand,
    });
  });

  app.get("/api/pages", async (_req, res) => {
    res.json({
      pages: [
        { slug: "home", title: "Home" },
        { slug: "about-us", title: "About Us" },
        { slug: "services", title: "Services" },
        { slug: "gallery", title: "Gallery" },
        { slug: "contact-us", title: "Contact Us" },
      ],
    });
  });
}

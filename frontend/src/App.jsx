import React, { useEffect, useMemo, useState } from "react";
import { getSiteContent, getSiteMeta } from "./api";
import { defaultSiteContent } from "./defaultSiteContent";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import PortfolioGalleryPage from "./pages/PortfolioGalleryPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import TermsPrivacyPage from "./pages/TermsPrivacyPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import AdminPage from "./pages/AdminPage";

const headerSections = ["home", "about-us", "services", "gallery"];

const socialIconMap = {
  instagram: <path d="M16 6h16a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10H16A10 10 0 0 1 6 32V16A10 10 0 0 1 16 6Zm8 9.5A8.5 8.5 0 1 0 32.5 24 8.51 8.51 0 0 0 24 15.5Zm0 3A5.5 5.5 0 1 1 18.5 24 5.51 5.51 0 0 1 24 18.5Zm10.25-5.75a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z" />,
  x: <path d="M10 9h8.2l7 9.4L33 9H38l-10.6 12.5L39 39h-8.2l-7.5-10.1L14.3 39H9l11-12.9L10 9Zm4 2.9 17.3 23.2h3L17 11.9h-3Z" />,
  linkedin: <path d="M13.8 18.2h6.1V39h-6.1V18.2ZM16.9 8A3.55 3.55 0 1 1 13.35 11.55 3.55 3.55 0 0 1 16.9 8ZM23.7 18.2h5.8V21h.1a6.37 6.37 0 0 1 5.8-3.2c6.2 0 7.4 4.1 7.4 9.5V39h-6V28.7c0-2.5 0-5.8-3.5-5.8s-4.1 2.8-4.1 5.6V39h-6.1V18.2Z" />,
  facebook: <path d="M27 39V25h4.8l.7-5.5H27V16c0-1.6.5-3.1 2.8-3.1h3V8.2A36 36 0 0 0 28.4 8c-4.4 0-7.4 2.7-7.4 7.7v3.8h-5V25h5v14Z" />,
};

function ThemeGlyph({ theme }) {
  if (theme === "light") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2.2M12 19.3v2.2M3.2 12h2.2M18.6 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M5.7 18.3l1.6-1.6M16.7 7.3l1.6-1.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.8 14.8A7.2 7.2 0 1 1 9.2 7.2a6.2 6.2 0 0 0 7.6 7.6Z" />
    </svg>
  );
}

function SocialIcon({ kind }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {socialIconMap[kind] || socialIconMap.instagram}
    </svg>
  );
}

function normalizeAboutSection(about) {
  const team = about?.Team || about?.Teams || about?.founders || [];
  return {
    ...(about || {}),
    Team: team,
    Teams: team,
    founders: team,
    TeamTitle: about?.TeamTitle || about?.TeamsTitle || about?.foundersTitle || "Meet the Team",
  };
}

function normalizeServiceImages(services) {
  return (services || []).map((service) => {
    if (service.heroImage) return service;

    const fallbackImageByIcon = {
      gpu: "/images/gpu-quiz-tab.avif",
      marketing: "/images/Digital-Marketing-1-1.webp",
      printing: "/images/3d.webp",
      infrastructure: "/images/images.jpg",
    };

    return {
      ...service,
      heroImage: fallbackImageByIcon[service.icon] || "/images/images.jpg",
    };
  });
}

function normalizeSiteContent(content) {
  const next = content || defaultSiteContent;
  return {
    ...next,
    about: normalizeAboutSection(next.about),
    faq: next.faq || defaultSiteContent.faq,
    services: {
      ...(next.services || defaultSiteContent.services),
      items: normalizeServiceImages(next.services?.items || defaultSiteContent.services.items),
    },
  };
}

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("cobalt-theme") || document.documentElement.dataset.theme || "light";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [apiStatus, setApiStatus] = useState("Loading backend...");
  const [siteContent, setSiteContent] = useState(normalizeSiteContent(defaultSiteContent));
  const readRoute = () => (window.location.hash.replace("#/", "") || "home").toLowerCase();
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cobalt-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute());
      setMenuOpen(false);
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", closeMenu);
    onScroll();
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", closeMenu);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getSiteMeta(), getSiteContent()]).then(([metaResult, contentResult]) => {
      if (!mounted) return;

      if (metaResult.status === "fulfilled") {
        setApiStatus(`${metaResult.value.health.service} is online on port 5001`);
      } else {
        setApiStatus("Backend unavailable during local preview");
      }

      if (contentResult.status === "fulfilled") {
        setSiteContent(normalizeSiteContent(contentResult.value));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const serviceSlug = route.startsWith("services/") ? route.slice("services/".length) : null;
  const activePage = route === "home" ? "home" : serviceSlug ? "service-detail" : route;
  const activeService = siteContent.services.items.find((item) => item.slug === serviceSlug);
  const footer = siteContent.footer || {};
  const footerColumns =
    footer.columns?.length > 0
      ? footer.columns
      : [
          {
            id: "footer-main",
            title: "Main Page",
            links: [
              { label: "Home", href: "#/home" },
              { label: "About", href: "#/about-us" },
              { label: "Services", href: "#/services" },
              { label: "Gallery", href: "#/gallery" },
              { label: "Contact", href: "#/contact-us" },
            ],
          },
          {
            id: "footer-quick",
            title: "Quick Links",
            links: [
              { label: "Integration", href: "#/services" },
              { label: "Team", href: "#/services" },
              { label: "Career", href: "#/services" },
              { label: "FAQ", href: "#/testimonials" },
              { label: "404", href: "#/terms-privacy-policy" },
            ],
          },
          {
            id: "footer-others",
            title: "Others",
            links: [
              { label: "Privacy Policy", href: "#/terms-privacy-policy" },
              { label: "Terms & Condition", href: "#/terms-privacy-policy" },
              { label: "Waitlist", href: "#/contact-us" },
              { label: "Changelog", href: "#/contact-us" },
            ],
          },
        ];
  const footerSocialLinks = footer.socialLinks?.length ? footer.socialLinks : siteContent.brand.socialLinks || [];
  const footerRightsText = footer.rightsText || "RIF © | All Rights Reserved.";
  const footerDevelopedByLabel = footer.developedByLabel || "DEVELOPED BY";
  const footerDevelopedByName = footer.developedByName || "VUN Tech";
  const footerDevelopedByUrl = footer.developedByUrl || "https://vuntech.online";

  const anchors = useMemo(
    () =>
      headerSections.map((item) => ({
        slug: item,
        label: item === "gallery" ? "Gallery" : item.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        href: `#/${item}`,
      })),
    []
  );

  return (
    <div className="app-shell">
      {activePage !== "admin" && (
        <header className={`topbar ${scrolled ? "topbar-scrolled" : ""}`}>
          <a className="brand" href="#/home" onClick={() => setMenuOpen(false)} aria-label="Go to home page">
            <div className="brand-mark" aria-hidden="true">
              <img src={siteContent.brand.logoUrl} alt="" />
            </div>
            <div>
              <strong>{siteContent.brand.shortName}</strong>
              <p>{siteContent.brand.companySuffix}</p>
            </div>
          </a>

          <button
            className="menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`nav ${menuOpen ? "nav-open" : ""}`} id="primary-navigation" aria-label="Primary">
            {anchors.map((item) => (
              <a key={item.slug} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="toolbar">
            <a className="btn primary header-cta magnetic" href="#/contact-us" onClick={() => setMenuOpen(false)}>
              Enquiry
            </a>
            <button
              className={`theme-mode-button theme-mode-button-${theme}`}
              type="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            >
              <span className={`theme-mode-glyph theme-${theme}`} aria-hidden="true">
                <ThemeGlyph theme={theme} />
              </span>
            </button>
          </div>
        </header>
      )}

      <main>
        {activePage === "home" && <HomePage content={siteContent.home} theme={theme} apiStatus={apiStatus} />}
      {activePage === "about-us" && <AboutPage content={siteContent.about} brand={siteContent.brand} />}
        {activePage === "services" && <ServicesPage content={siteContent.services} />}
        {activePage === "service-detail" && <ServiceDetailPage service={activeService} />}
        {activePage === "gallery" && <PortfolioGalleryPage content={siteContent.gallery} />}
        {activePage === "contact-us" && <ContactPage content={siteContent.contact} brand={siteContent.brand} />}
        {activePage === "faq" && <FAQPage content={siteContent.faq} />}
        {activePage === "testimonials" && <TestimonialsPage content={siteContent.testimonials} />}
        {activePage === "terms-privacy-policy" && <TermsPrivacyPage content={siteContent.legal} />}
        {
          activePage === "admin" && (
            <AdminPage
              initialContent={siteContent}
              onContentSaved={(content) => setSiteContent(normalizeSiteContent(content))}
              theme={theme}
              onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            />
          )
        }
      </main>

      {activePage !== "admin" && (
        <footer className="footer">
          <div className="footer-shell">
            <div className="footer-grid footer-grid-premium">
              <div className="footer-brand-block">
                <div className="footer-brand-row">
                  <span className="footer-logo" aria-hidden="true">
                    <img src={siteContent.brand.logoUrl} alt="" />
                  </span>
                  <div>
                    <strong>{siteContent.brand.shortName}</strong>
                    <p>{siteContent.brand.tagline}</p>
                  </div>
                </div>
                <p className="footer-brand-copy">{siteContent.brand.companyName}</p>
              </div>
              {footerColumns.map((column) => (
                <div className="footer-link-column" key={column.id || column.title}>
                  <span>{column.title}</span>
                  {(column.links || []).map((link) => (
                    <a key={`${column.id || column.title}-${link.label}`} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            <div className="footer-bottom-minimal footer-bottom-premium">
              <div className="footer-credit-stack">
                <p className="footer-credit-line">{footerRightsText}</p>
                <p className="footer-credit-label">{footerDevelopedByLabel}</p>
                <a className="footer-credit-link" href={footerDevelopedByUrl} target="_blank" rel="noreferrer">
                  {footerDevelopedByName}
                </a>
              </div>
              <div className="footer-social-block">
                <div className="footer-social-list">
                  {footerSocialLinks.map((item) => (
                    <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                      <SocialIcon kind={item.icon} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;

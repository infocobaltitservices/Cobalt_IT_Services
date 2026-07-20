import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteAdminInquiry,
  getAdminAccessKey,
  getAdminEmail,
  getAdminInquiries,
  getAdminSiteContent,
  loginAdmin,
  logoutAdmin,
  saveAdminSiteContent,
  uploadAdminImage,
  uploadAdminMedia,
} from "../api";
import { defaultSiteContent } from "../defaultSiteContent";
import ImageCropModal from "../components/ImageCropModal";

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

function clone(value) {
  return structuredClone(value);
}

function linesToArray(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(items) {
  return (items || []).join("\n");
}

function socialLinksToLines(items) {
  return (items || []).map((item) => `${item.label || ""}|${item.href || ""}`).join("\n");
}

function linesToSocialLinks(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", href = ""] = line.split("|");
      return { label: label.trim(), href: href.trim() };
    })
    .filter((item) => item.label || item.href);
}

function footerLinksToLines(items) {
  return (items || []).map((item) => `${item.label || ""}|${item.href || ""}`).join("\n");
}

function linesToFooterLinks(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", href = ""] = line.split("|");
      return { label: label.trim(), href: href.trim() };
    })
    .filter((item) => item.label || item.href);
}

function footerSocialLinksToLines(items) {
  return (items || [])
    .map((item) => `${item.label || ""}|${item.href || ""}|${item.icon || ""}`)
    .join("\n");
}

function linesToFooterSocialLinks(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", href = "", icon = ""] = line.split("|");
      return { label: label.trim(), href: href.trim(), icon: icon.trim() };
    })
    .filter((item) => item.label || item.href || item.icon);
}

function updateItem(list, index, nextItem) {
  return list.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatInquiryDate(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AdminImagePreview({ src, alt, wide = false }) {
  const imageSrc = (src || "").trim();

  if (!imageSrc) {
    return (
      <div className={`admin-thumb admin-thumb-empty${wide ? " admin-thumb-wide" : ""}`}>
        <span>No image</span>
      </div>
    );
  }

  return <img className={`admin-thumb${wide ? " admin-thumb-wide" : ""}`} src={imageSrc} alt={alt} />;
}

function createServiceDraft(overrides = {}) {
  return {
    id: createId("service"),
    slug: "new-service",
    title: "New Service",
    shortText: "",
    icon: "gpu",
    heroLabel: "Service Label",
    heroImage: "",
    intro: "",
    highlights: [],
    deliverables: [],
    outcomes: [],
    ...overrides,
  };
}

function normalizeAboutMembers(about) {
  const team = about?.Team || about?.Teams || about?.founders || [];
  return {
    ...(about || {}),
    Team: team,
    Teams: team,
    founders: team,
    TeamTitle: about?.TeamTitle || about?.TeamsTitle || about?.foundersTitle || "Meet the Team",
  };
}

function normalizeFaqSection(faq) {
  return {
    ...(faq || {}),
    heading: faq?.heading || "Frequently Asked Questions",
    text:
      faq?.text ||
      "Quick answers to the questions we hear most often about services, timelines, support, and next steps.",
    items: faq?.items || [],
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

function normalizeContentDraft(content) {
  const next = clone(content || defaultSiteContent);
  next.about = normalizeAboutMembers(next.about);
  next.faq = normalizeFaqSection(next.faq);
  if (next.services?.items) {
    next.services = { ...(next.services || {}), items: normalizeServiceImages(next.services.items) };
  }
  return next;
}

function syncTeamMembers(nextAbout, teamMembers) {
  const members = teamMembers || [];
  nextAbout.Team = members;
  nextAbout.Teams = members;
  nextAbout.founders = members;
  return nextAbout;
}

const adminSections = [
  { id: "overview", label: "Overview" },
  { id: "brand", label: "Site Settings" },
  { id: "footer", label: "Footer" },
  { id: "home", label: "Homepage" },
  { id: "about", label: "About & Team" },
  { id: "services", label: "Services" },
  { id: "gallery", label: "Gallery" },
  { id: "contact", label: "Contact" },
  { id: "enquiries", label: "Enquiries" },
  { id: "faq", label: "FAQ" },
  { id: "testimonials", label: "Testimonials" },
  { id: "legal", label: "Legal" },
];

function AdminPage({ initialContent, onContentSaved, theme, onThemeToggle }) {
  const [draft, setDraft] = useState(() => normalizeContentDraft(initialContent || defaultSiteContent));
  const draftRef = useRef(draft);
  const [status, setStatus] = useState("idle");
  const [activeSection, setActiveSection] = useState("overview");
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [loginForm, setLoginForm] = useState({ email: getAdminEmail(), password: "" });
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminAccessKey()));
  const [cropConfig, setCropConfig] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [inquiryStatus, setInquiryStatus] = useState("idle");
  const [inquirySearch, setInquirySearch] = useState("");
  const [deletingInquiryId, setDeletingInquiryId] = useState("");

  const overviewStats = useMemo(
    () => [
      { label: "Team", value: draft.about?.Team?.length || 0 },
      { label: "Services", value: draft.services?.items?.length || 0 },
      { label: "Gallery Items", value: draft.gallery?.items?.length || 0 },
      { label: "FAQ Items", value: draft.faq?.items?.length || 0 },
      { label: "Testimonials", value: draft.testimonials?.items?.length || 0 },
      { label: "Enquiries", value: inquiries.length },
      { label: "Footer Columns", value: draft.footer?.columns?.length || 0 },
      { label: "Hero Slides", value: draft.home?.heroTitleLines?.length || 0 },
      { label: "Delivery Steps", value: draft.home?.deliverySteps?.length || 0 },
    ],
    [draft, inquiries.length]
  );

  const visibleInquiries = useMemo(() => {
    const query = inquirySearch.trim().toLowerCase();

    if (!query) return inquiries;

    return inquiries.filter((inquiry) =>
      [inquiry.name, inquiry.email, inquiry.phone, inquiry.company, inquiry.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [inquiries, inquirySearch]);

  function syncDraft(nextDraft) {
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }

  async function loadInquiries() {
    setInquiryStatus("loading");
    try {
      const content = await getAdminInquiries();
      setInquiries(content.items || []);
      setInquiryStatus("loaded");
    } catch (error) {
      setInquiryStatus(error.message || "error");
    }
  }

  async function handleDeleteInquiry(inquiry) {
    const inquiryId = inquiry?._id;

    if (!inquiryId) {
      setInquiryStatus("Unable to delete this inquiry");
      return;
    }

    const confirmed = window.confirm(`Delete enquiry from ${inquiry.name || inquiry.email || "this contact"}?`);
    if (!confirmed) return;

    setDeletingInquiryId(inquiryId);
    setInquiryStatus("deleting");

    try {
      await deleteAdminInquiry(inquiryId);
      setInquiries((items) => items.filter((item) => item._id !== inquiryId));
      setInquiryStatus("deleted");
    } catch (error) {
      setInquiryStatus(error.message || "delete-error");
    } finally {
      setDeletingInquiryId("");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus("authenticating");
    try {
      await loginAdmin(loginForm.email, loginForm.password);
      const content = await getAdminSiteContent();
      syncDraft(normalizeContentDraft(content));
      setAuthenticated(true);
      setStatus("authenticated");
    } catch (error) {
      setStatus(error.message || "login-error");
    }
  }

  async function handleRefresh() {
    setStatus("refreshing");
    try {
      const content = await getAdminSiteContent();
      syncDraft(normalizeContentDraft(content));
      await loadInquiries();
      setStatus("loaded");
    } catch (error) {
      setStatus(error.message || "refresh-error");
    }
  }

  async function handleSave() {
    setStatus("saving");
    try {
      const payload = normalizeContentDraft(draftRef.current);
      const saved = await saveAdminSiteContent(payload);
      syncDraft(normalizeContentDraft(saved));
      onContentSaved(normalizeContentDraft(saved));
      setStatus("saved");
    } catch (error) {
      setStatus(error.message || "save-error");
    }
  }

  async function handleUploadCropped(dataUrl) {
    if (!cropConfig) return;
    setStatus("uploading-media");
    try {
      const uploaded = await uploadAdminImage(dataUrl, cropConfig.folder);
      const nextDraft = normalizeContentDraft(draftRef.current);
      cropConfig.apply(nextDraft, uploaded.url);
      const saved = await saveAdminSiteContent(nextDraft);
      syncDraft(normalizeContentDraft(saved));
      onContentSaved(normalizeContentDraft(saved));
      setStatus("saved");
    } catch (error) {
      setStatus(error.message || "upload-error");
      throw error;
    }
  }

  async function handleMediaUpload(file, folder, apply) {
    if (!file) return;
    setStatus("uploading-media");
    try {
      const uploaded = await uploadAdminMedia(file, folder);
      const nextDraft = normalizeContentDraft(draftRef.current);
      apply(nextDraft, uploaded.url);
      const saved = await saveAdminSiteContent(nextDraft);
      syncDraft(normalizeContentDraft(saved));
      onContentSaved(normalizeContentDraft(saved));
      setStatus("saved");
      return uploaded;
    } catch (error) {
      setStatus(error.message || "upload-error");
      throw error;
    }
  }

  function launchCropper(config) {
    setCropConfig(config);
  }

  function handleLogout() {
    logoutAdmin();
    setAuthenticated(false);
    setLoginForm((prev) => ({ ...prev, password: "" }));
    setStatus("logged-out");
    setInquiries([]);
    setInquiryStatus("idle");
    setInquirySearch("");
  }

  useEffect(() => {
    if (!authenticated) return;
    loadInquiries();
  }, [authenticated]);

  if (!authenticated) {
    return (
      <section className="section admin-login-page">
        <div className="admin-login-shell">
          <div className="admin-login-panel">
            <div className="admin-login-head">
              <span className="admin-login-kicker">Secure Access</span>
              <button
                type="button"
                className={`theme-mode-button theme-mode-button-${theme}`}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                onClick={onThemeToggle}
              >
                <span className={`theme-mode-glyph theme-${theme}`} aria-hidden="true">
                  <ThemeGlyph theme={theme} />
                </span>
              </button>
            </div>
            <h2>Admin panel login</h2>
            <p>Enter the admin email and password to manage site content, Team, services, and uploaded media.</p>

            <form className="admin-login-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="admin@cobalt.local"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Enter your password"
                />
              </label>
              <button type="submit" className="btn primary">
                {status === "authenticating" ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="admin-status">
              Status: <strong>{status}</strong>
            </p>
          </div>
        </div>
      </section>
    );
  }

  const Team = draft.about?.Team || draft.about?.Teams || draft.about?.founders || [];
  const services = draft.services?.items || [];
  const galleryItems = draft.gallery?.items || [];
  const faqItems = draft.faq?.items || [];
  const testimonials = draft.testimonials?.items || [];
  const legalSections = draft.legal?.sections || [];
  const service = services[activeServiceIndex] || services[0];

  return (
    <section className="section admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-head">
            <span className="admin-sidebar-kicker">Manage Content</span>
            <strong>Control Center</strong>
          </div>
          <nav className="admin-sidebar-nav" aria-label="Admin sections">
            {adminSections.map((section) => (
              <button
                type="button"
                key={section.id}
                className={`admin-nav-item ${activeSection === section.id ? "is-active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-content">
          <div className="admin-topbar">
            <div className="admin-topbar-copy">
              <span className="admin-page-kicker">Manage Content</span>
              <h2>{adminSections.find((section) => section.id === activeSection)?.label || "Overview"}</h2>
              <p>Update pages, visuals, copy, footer details, and every reusable content block from one place.</p>
            </div>
            <div className="admin-topbar-actions">
              <button
                type="button"
                className={`theme-mode-button theme-mode-button-${theme}`}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                onClick={onThemeToggle}
              >
                <span className={`theme-mode-glyph theme-${theme}`} aria-hidden="true">
                  <ThemeGlyph theme={theme} />
                </span>
              </button>
              <button type="button" className="btn secondary" onClick={handleRefresh}>
                Refresh
              </button>
              <button type="button" className="btn primary" onClick={handleSave}>
                Save Changes
              </button>
              <button type="button" className="btn secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="admin-toast-row">
            <div className="admin-status-pill">
              <span>Status</span>
              <strong>{status}</strong>
            </div>
          </div>

          {activeSection === "overview" && (
            <div className="admin-section-stack">
              <article className="admin-board admin-board-soft">
                <div className="admin-overview-grid">
                  {overviewStats.map((item) => (
                    <div className="admin-overview-card" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-board admin-board-soft">
                <h3>What this admin covers</h3>
                <ul className="admin-bullet-list">
                  <li>Homepage hero, stats, delivery framework, and selected work.</li>
                  <li>Brand settings, logo, footer social links, and public company details.</li>
                  <li>About page vision, mission, Team, and animated metrics.</li>
                  <li>Services, nested service detail pages, gallery, contact, testimonials, and legal text.</li>
                </ul>
              </article>
            </div>
          )}

          {activeSection === "brand" && (
            <article className="admin-board admin-board-soft">
              <h3>Site settings</h3>
              <div className="admin-form-grid">
                <label>
                  Company name
                  <input value={draft.brand.companyName} onChange={(event) => syncDraft({ ...draft, brand: { ...draft.brand, companyName: event.target.value } })} />
                </label>
                <label>
                  Short name
                  <input value={draft.brand.shortName} onChange={(event) => syncDraft({ ...draft, brand: { ...draft.brand, shortName: event.target.value } })} />
                </label>
                <label>
                  Company suffix
                  <input value={draft.brand.companySuffix} onChange={(event) => syncDraft({ ...draft, brand: { ...draft.brand, companySuffix: event.target.value } })} />
                </label>
                <label>
                  Tagline
                  <input value={draft.brand.tagline} onChange={(event) => syncDraft({ ...draft, brand: { ...draft.brand, tagline: event.target.value } })} />
                </label>
              </div>
              <div className="admin-inline-actions">
                <AdminImagePreview src={draft.brand.logoUrl} alt="Brand logo" />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    launchCropper({
                      folder: "cobalt/brand",
                      apply: (nextDraft, imageUrl) => {
                        nextDraft.brand.logoUrl = imageUrl;
                      },
                    })
                  }
                >
                  Upload logo
                </button>
              </div>
            </article>
          )}

          {activeSection === "footer" && (
            <div className="admin-section-stack">
              <article className="admin-board admin-board-soft">
                <h3>Footer credits</h3>
                <div className="admin-form-grid">
                  <label>
                    Rights text
                    <input
                      value={draft.footer?.rightsText || ""}
                      onChange={(event) => {
                        const next = clone(draft);
                        next.footer = { ...(next.footer || {}), rightsText: event.target.value };
                        syncDraft(next);
                      }}
                      placeholder="RIF © | All Rights Reserved."
                    />
                  </label>
                  <label>
                    Developed by label
                    <input
                      value={draft.footer?.developedByLabel || ""}
                      onChange={(event) => {
                        const next = clone(draft);
                        next.footer = { ...(next.footer || {}), developedByLabel: event.target.value };
                        syncDraft(next);
                      }}
                      placeholder="DEVELOPED BY"
                    />
                  </label>
                  <label>
                    Developer name
                    <input
                      value={draft.footer?.developedByName || ""}
                      onChange={(event) => {
                        const next = clone(draft);
                        next.footer = { ...(next.footer || {}), developedByName: event.target.value };
                        syncDraft(next);
                      }}
                      placeholder="VUN Tech"
                    />
                  </label>
                  <label>
                    Developer URL
                    <input
                      value={draft.footer?.developedByUrl || ""}
                      onChange={(event) => {
                        const next = clone(draft);
                        next.footer = { ...(next.footer || {}), developedByUrl: event.target.value };
                        syncDraft(next);
                      }}
                      placeholder="https://vuntech.online"
                    />
                  </label>
                </div>
              </article>

              <article className="admin-board admin-board-soft">
                <div className="admin-board-head-row">
                  <h3>Footer columns</h3>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      const next = clone(draft);
                      next.footer = next.footer || {};
                      next.footer.columns = [...(next.footer.columns || []), { id: createId("footer-col"), title: "New Column", links: [] }];
                      syncDraft(next);
                    }}
                  >
                    Add column
                  </button>
                </div>
                <div className="admin-form-grid admin-form-grid-three">
                  {(draft.footer?.columns || []).map((column, index) => (
                    <div className="admin-repeater-card" key={column.id || index}>
                      <label>
                        Column title
                        <input
                          value={column.title || ""}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.footer = next.footer || {};
                            next.footer.columns = updateItem(next.footer.columns || [], index, {
                              ...column,
                              title: event.target.value,
                            });
                            syncDraft(next);
                          }}
                        />
                      </label>
                      <label>
                        Links
                        <textarea
                          rows="7"
                          value={footerLinksToLines(column.links)}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.footer = next.footer || {};
                            next.footer.columns = updateItem(next.footer.columns || [], index, {
                              ...column,
                              links: linesToFooterLinks(event.target.value),
                            });
                            syncDraft(next);
                          }}
                          placeholder="Home|#/home"
                        />
                      </label>
                      <div className="admin-inline-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            const next = clone(draft);
                            next.footer = next.footer || {};
                            next.footer.columns = (next.footer.columns || []).filter((_, columnIndex) => columnIndex !== index);
                            syncDraft(next);
                          }}
                        >
                          Delete column
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-board admin-board-soft">
                <h3>Footer social links</h3>
                <label>
                  Social links
                  <textarea
                    rows="5"
                    value={footerSocialLinksToLines(draft.footer?.socialLinks || draft.brand?.socialLinks)}
                    onChange={(event) => {
                      const next = clone(draft);
                      next.footer = {
                        ...(next.footer || {}),
                        socialLinks: linesToFooterSocialLinks(event.target.value),
                      };
                      syncDraft(next);
                    }}
                    placeholder="Instagram|https://instagram.com|instagram"
                  />
                </label>
              </article>
            </div>
          )}

          {activeSection === "home" && (
            <div className="admin-section-stack">
              <article className="admin-board admin-board-soft">
                <h3>Hero panel</h3>
                <div className="admin-form-grid">
                  {draft.home.heroTitleLines.map((line, index) => (
                    <label key={`${line.emphasis}-${index}`}>
                      Hero line {index + 1}
                      <input
                        value={`${line.emphasis}|${line.rest}`}
                        onChange={(event) => {
                          const [emphasis = "", rest = ""] = event.target.value.split("|");
                          const next = clone(draft);
                          next.home.heroTitleLines = updateItem(next.home.heroTitleLines, index, { emphasis: emphasis.trim(), rest: rest.trim() });
                          syncDraft(next);
                        }}
                      />
                    </label>
                  ))}
                  <div className="admin-media-field">
                    <label>
                      Hero video for light mode
                      <input value={draft.home.heroVideoLight} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, heroVideoLight: event.target.value } })} />
                    </label>
                    <label className="admin-upload-button">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            setStatus("uploading-media");
                            await handleMediaUpload(file, "cobalt/home-videos", (nextDraft, url) => {
                              nextDraft.home.heroVideoLight = url;
                            });
                            setStatus("uploaded");
                          } catch (error) {
                            setStatus(error.message || "upload-error");
                          } finally {
                            event.target.value = "";
                          }
                        }}
                      />
                      Upload light video
                    </label>
                  </div>
                  <div className="admin-media-field">
                    <label>
                      Hero video for dark mode
                      <input value={draft.home.heroVideoDark} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, heroVideoDark: event.target.value } })} />
                    </label>
                    <label className="admin-upload-button">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            setStatus("uploading-media");
                            await handleMediaUpload(file, "cobalt/home-videos", (nextDraft, url) => {
                              nextDraft.home.heroVideoDark = url;
                            });
                            setStatus("uploaded");
                          } catch (error) {
                            setStatus(error.message || "upload-error");
                          } finally {
                            event.target.value = "";
                          }
                        }}
                      />
                      Upload dark video
                    </label>
                  </div>
                </div>
                <label>
                  Hero description
                  <textarea rows="4" value={draft.home.heroText} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, heroText: event.target.value } })} />
                </label>
              </article>

              <article className="admin-board admin-board-soft">
                <h3>Delivery framework</h3>
                <div className="admin-form-grid">
                  <label>
                    Eyebrow
                    <input value={draft.home.deliveryEyebrow} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, deliveryEyebrow: event.target.value } })} />
                  </label>
                  <label>
                    Heading
                    <input value={draft.home.deliveryHeading} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, deliveryHeading: event.target.value } })} />
                  </label>
                </div>
                <label>
                  Supporting text
                  <textarea rows="3" value={draft.home.deliveryText} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, deliveryText: event.target.value } })} />
                </label>
              </article>

              <article className="admin-board admin-board-soft">
                <h3>Selected work</h3>
                <div className="admin-stack">
                  {draft.home.selectedWorkItems.map((item, index) => (
                    <div className="admin-repeater-card" key={item.id || index}>
                      <div className="admin-form-grid">
                        <label>
                          Title
                          <input
                            value={item.title}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.home.selectedWorkItems = updateItem(next.home.selectedWorkItems, index, { ...item, title: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                      </div>
                      <label>
                        Description
                        <textarea
                          rows="2"
                          value={item.text}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.home.selectedWorkItems = updateItem(next.home.selectedWorkItems, index, { ...item, text: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                      <div className="admin-inline-actions">
                        <AdminImagePreview src={item.image} alt={item.title} wide />
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() =>
                            launchCropper({
                              folder: "cobalt/home-work",
                              aspect: 16 / 9,
                              outputWidth: 1600,
                              outputHeight: 900,
                              apply: (nextDraft, imageUrl) => {
                                nextDraft.home.selectedWorkItems[index].image = imageUrl;
                              },
                            })
                          }
                        >
                          Upload image
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}

          {activeSection === "about" && (
            <div className="admin-section-stack">
              <article className="admin-board admin-board-soft">
                <h3>About overview</h3>
                <div className="admin-form-grid">
                  {draft.about.introCards.map((card, index) => (
                    <div className="admin-repeater-card" key={card.kicker}>
                      <label>
                        Kicker
                        <input
                          value={card.kicker}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.about.introCards = updateItem(next.about.introCards, index, { ...card, kicker: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                      <label>
                        Title
                        <textarea
                          rows="3"
                          value={card.title}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.about.introCards = updateItem(next.about.introCards, index, { ...card, title: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                      <label>
                        Text
                        <textarea
                          rows="4"
                          value={card.text}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.about.introCards = updateItem(next.about.introCards, index, { ...card, text: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-board admin-board-soft">
                <h3>Team</h3>
                <div className="admin-stack">
                  {Team.map((Team, index) => (
                    <div className="admin-repeater-card" key={Team.id || index}>
                      <div className="admin-form-grid">
                        <label>
                          Number
                          <input
                            value={Team.number}
                            onChange={(event) => {
                              const next = clone(draft);
                              syncTeamMembers(next.about, updateItem(next.about.Team, index, { ...Team, number: event.target.value }));
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Name
                          <input
                            value={Team.name}
                            onChange={(event) => {
                              const next = clone(draft);
                              syncTeamMembers(next.about, updateItem(next.about.Team, index, { ...Team, name: event.target.value }));
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Role
                          <input
                            value={Team.role}
                            onChange={(event) => {
                              const next = clone(draft);
                              syncTeamMembers(next.about, updateItem(next.about.Team, index, { ...Team, role: event.target.value }));
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label className="admin-checkbox">
                          <input
                            type="checkbox"
                            checked={Boolean(Team.reverse)}
                            onChange={(event) => {
                              const next = clone(draft);
                              syncTeamMembers(next.about, updateItem(next.about.Team, index, { ...Team, reverse: event.target.checked }));
                              syncDraft(next);
                            }}
                          />
                          Reverse layout
                        </label>
                      </div>
                      <label>
                        Bio
                        <textarea
                          rows="4"
                          value={Team.bio}
                          onChange={(event) => {
                            const next = clone(draft);
                            syncTeamMembers(next.about, updateItem(next.about.Team, index, { ...Team, bio: event.target.value }));
                            syncDraft(next);
                          }}
                        />
                      </label>
                      <label>
                        Social links
                        <textarea
                          rows="3"
                          value={socialLinksToLines(Team.socialLinks)}
                          onChange={(event) => {
                            const next = clone(draft);
                            syncTeamMembers(next.about, updateItem(next.about.Team, index, { ...Team, socialLinks: linesToSocialLinks(event.target.value) }));
                            syncDraft(next);
                          }}
                          placeholder="LinkedIn|https://www.linkedin.com/in/name"
                        />
                      </label>
                      <div className="admin-inline-actions">
                        <AdminImagePreview src={Team.image} alt={Team.name} wide />
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() =>
                            launchCropper({
                              folder: "cobalt/Team",
                              aspect: 1.62,
                              outputWidth: 1200,
                              outputHeight: 740,
                              apply: (nextDraft, imageUrl) => {
                                const nextTeam = updateItem(nextDraft.about.Team, index, { ...nextDraft.about.Team[index], image: imageUrl });
                                syncTeamMembers(nextDraft.about, nextTeam);
                              },
                            })
                          }
                          >
                          Upload image
                        </button>
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            const next = clone(draft);
                            const nextTeam = next.about.Team.filter((_, itemIndex) => itemIndex !== index);
                            syncTeamMembers(next.about, nextTeam);
                            syncDraft(next);
                          }}
                        >
                          Delete Team
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      const next = clone(draft);
                      const nextTeam = [
                        ...(next.about.Team || []),
                        {
                        id: createId("Team"),
                        number: String((Team.length || 0) + 1).padStart(2, "0"),
                        name: "New Team",
                        role: "Team",
                        bio: "",
                        image: "",
                        reverse: false,
                        socialLinks: [{ label: "LinkedIn", href: "" }],
                        },
                      ];
                      syncTeamMembers(next.about, nextTeam);
                      syncDraft(next);
                    }}
                  >
                    Add Team
                  </button>
                </div>
              </article>
            </div>
          )}

          {activeSection === "services" && (
            <div className="admin-section-layout">
              <aside className="admin-subnav admin-subnav-services">
                <div className="admin-subnav-head">
                  <span className="admin-sidebar-kicker">Service Library</span>
                  <strong>{services.length} service{services.length === 1 ? "" : "s"}</strong>
                  <p>Edit the public cards, detail pages, and service copy from one place.</p>
                </div>

                <div className="admin-subnav-scroll">
                  {services.map((item, index) => (
                    <button
                      type="button"
                      key={item.id || item.slug}
                      className={`admin-subnav-item ${activeServiceIndex === index ? "is-active" : ""}`}
                      onClick={() => setActiveServiceIndex(index)}
                    >
                      <span>{item.title}</span>
                      <small>{item.slug}</small>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="admin-subnav-create"
                  onClick={() => {
                    const next = clone(draft);
                    next.services.items.push(createServiceDraft());
                    syncDraft(next);
                    setActiveServiceIndex(next.services.items.length - 1);
                  }}
                >
                  Add service
                </button>
              </aside>

              <div className="admin-service-editor-stack">
                {service ? (
                  <>
                    <article className="admin-board admin-board-soft admin-service-preview">
                      <div className="admin-service-preview-head">
                        <div>
                          <span className="admin-page-kicker">Live preview</span>
                          <h3>{service.title}</h3>
                        </div>
                        <AdminImagePreview src={service.heroImage} alt={service.title} wide />
                      </div>
                      <p>{service.shortText}</p>
                      <div className="admin-service-preview-meta">
                        <span>{service.slug}</span>
                        <span>{service.icon}</span>
                        <span>{service.highlights?.length || 0} highlights</span>
                        <span>{service.deliverables?.length || 0} deliverables</span>
                        <span>{service.outcomes?.length || 0} outcomes</span>
                      </div>
                    </article>

                    <article className="admin-board admin-board-soft">
                      <div className="admin-board-head-row">
                        <div>
                          <h3>Edit service</h3>
                          <p className="admin-board-subtitle">Shape the card and the detail page together so both stay in sync.</p>
                        </div>
                        <div className="admin-inline-actions">
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => {
                              const next = clone(draft);
                              const duplicate = createServiceDraft({
                                ...service,
                                id: createId("service"),
                                slug: `${service.slug || "new-service"}-copy`,
                                title: `${service.title || "Service"} Copy`,
                              });
                              next.services.items.splice(activeServiceIndex + 1, 0, duplicate);
                              syncDraft(next);
                              setActiveServiceIndex(activeServiceIndex + 1);
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => {
                              const next = clone(draft);
                              next.services.items.splice(activeServiceIndex, 1);
                              syncDraft(next);
                              setActiveServiceIndex((prev) => Math.max(0, Math.min(prev, next.services.items.length - 1)));
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="admin-form-grid admin-form-grid-three">
                        <label>
                          Title
                          <input
                            value={service.title}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, title: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Slug
                          <input
                            value={service.slug}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, slug: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Icon
                          <select
                            value={service.icon}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, icon: event.target.value });
                              syncDraft(next);
                            }}
                          >
                            <option value="gpu">GPU</option>
                            <option value="marketing">Marketing</option>
                            <option value="printing">3D Printing</option>
                            <option value="infrastructure">Infrastructure</option>
                          </select>
                        </label>
                      </div>

                      <div className="admin-inline-actions">
                        <AdminImagePreview src={service.heroImage} alt={service.title} wide />
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() =>
                            launchCropper({
                              folder: "cobalt/services",
                              aspect: 16 / 9,
                              outputWidth: 1600,
                              outputHeight: 900,
                              apply: (nextDraft, imageUrl) => {
                                nextDraft.services.items = updateItem(nextDraft.services.items, activeServiceIndex, {
                                  ...nextDraft.services.items[activeServiceIndex],
                                  heroImage: imageUrl,
                                });
                              },
                            })
                          }
                        >
                          Upload service image
                        </button>
                      </div>

                      <div className="admin-form-grid admin-form-grid-two">
                        <label>
                          Hero label
                          <input
                            value={service.heroLabel}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, heroLabel: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Card text
                          <textarea
                            rows="3"
                            value={service.shortText}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, shortText: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                      </div>

                      <label>
                        Detail intro
                        <textarea
                          rows="4"
                          value={service.intro}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, intro: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                    </article>

                    <div className="admin-service-list-grid">
                      {[
                        { title: "Highlights", key: "highlights", value: service.highlights },
                        { title: "Deliverables", key: "deliverables", value: service.deliverables },
                        { title: "Outcomes", key: "outcomes", value: service.outcomes },
                      ].map((group) => (
                        <article className="admin-board admin-board-soft admin-list-editor" key={group.key}>
                          <h3>{group.title}</h3>
                          <p className="admin-board-subtitle">One item per line. Keep the wording crisp and client-facing.</p>
                          <label>
                            {group.title}
                            <textarea
                              rows="7"
                              value={arrayToLines(group.value)}
                              onChange={(event) => {
                                const next = clone(draft);
                                next.services.items = updateItem(next.services.items, activeServiceIndex, {
                                  ...service,
                                  [group.key]: linesToArray(event.target.value),
                                });
                                syncDraft(next);
                              }}
                              placeholder={`Add ${group.title.toLowerCase()} on separate lines`}
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <article className="admin-board admin-board-soft">
                    <h3>No services yet</h3>
                    <p className="admin-board-subtitle">Create the first service entry to begin editing the public services page.</p>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => {
                        const next = clone(draft);
                        next.services.items.push(createServiceDraft());
                        syncDraft(next);
                        setActiveServiceIndex(next.services.items.length - 1);
                      }}
                    >
                      Add service
                    </button>
                  </article>
                )}
              </div>
            </div>
          )}

          {activeSection === "gallery" && (
            <article className="admin-board admin-board-soft">
              <div className="admin-board-head-row">
                <h3>Gallery items</h3>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    const next = clone(draft);
                    next.gallery.items.push({
                      id: createId("gallery"),
                      title: "New Gallery Item",
                      text: "",
                      image: draft.brand.logoUrl,
                    });
                    syncDraft(next);
                  }}
                >
                  Add gallery item
                </button>
              </div>
              <div className="admin-stack">
                {galleryItems.map((item, index) => (
                  <div className="admin-repeater-card" key={item.id || index}>
                    <div className="admin-form-grid">
                      <label>
                        Title
                        <input
                          value={item.title}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.gallery.items = updateItem(next.gallery.items, index, { ...item, title: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea
                        rows="2"
                        value={item.text}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.gallery.items = updateItem(next.gallery.items, index, { ...item, text: event.target.value });
                          syncDraft(next);
                        }}
                      />
                    </label>
                    <div className="admin-inline-actions">
                      <AdminImagePreview src={item.image} alt={item.title} wide />
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() =>
                          launchCropper({
                            folder: "cobalt/gallery",
                            aspect: 16 / 9,
                            outputWidth: 1600,
                            outputHeight: 900,
                            apply: (nextDraft, imageUrl) => {
                              nextDraft.gallery.items[index].image = imageUrl;
                            },
                          })
                        }
                      >
                        Upload image
                      </button>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          const next = clone(draft);
                          next.gallery.items.splice(index, 1);
                          syncDraft(next);
                        }}
                      >
                        Delete item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeSection === "contact" && (
            <article className="admin-board admin-board-soft">
              <h3>Contact page</h3>
              <div className="admin-form-grid">
                <label>
                  Heading
                  <input value={draft.contact.heading} onChange={(event) => syncDraft({ ...draft, contact: { ...draft.contact, heading: event.target.value } })} />
                </label>
                <label>
                  Eyebrow
                  <input value={draft.contact.eyebrow} onChange={(event) => syncDraft({ ...draft, contact: { ...draft.contact, eyebrow: event.target.value } })} />
                </label>
                <label>
                  Title
                  <input value={draft.contact.title} onChange={(event) => syncDraft({ ...draft, contact: { ...draft.contact, title: event.target.value } })} />
                </label>
                <label>
                  Map label
                  <input value={draft.contact.mapLabel} onChange={(event) => syncDraft({ ...draft, contact: { ...draft.contact, mapLabel: event.target.value } })} />
                </label>
              </div>
              <label>
                Description
                <textarea rows="4" value={draft.contact.description} onChange={(event) => syncDraft({ ...draft, contact: { ...draft.contact, description: event.target.value } })} />
              </label>
            </article>
          )}

          {activeSection === "enquiries" && (
            <div className="admin-section-stack">
              <article className="admin-board admin-board-soft">
                <div className="admin-board-head-row">
                  <div>
                    <span className="admin-page-kicker">Contact desk</span>
                    <h3>Enquiry inbox</h3>
                    <p className="admin-board-subtitle">Review contact submissions, reply quickly, and remove enquiries after they are handled.</p>
                  </div>
                  <div className="admin-inline-actions">
                    <button type="button" className="btn secondary" onClick={loadInquiries} disabled={inquiryStatus === "loading"}>
                      {inquiryStatus === "loading" ? "Refreshing..." : "Refresh inbox"}
                    </button>
                  </div>
                </div>
                <div className="admin-overview-grid admin-enquiry-stats">
                  <div className="admin-overview-card">
                    <strong>{inquiries.length}</strong>
                    <span>Total enquiries</span>
                  </div>
                  <div className="admin-overview-card">
                    <strong>{inquiries[0]?.name || "None"}</strong>
                    <span>Latest sender</span>
                  </div>
                  <div className="admin-overview-card">
                    <strong>{formatInquiryDate(inquiries[0]?.createdAt)}</strong>
                    <span>Latest inquiry</span>
                  </div>
                </div>
                <div className="admin-inquiry-toolbar">
                  <label className="admin-search-field">
                    <span>Search enquiries</span>
                    <input
                      value={inquirySearch}
                      onChange={(event) => setInquirySearch(event.target.value)}
                      placeholder="Search by name, email, phone, company, or message"
                    />
                  </label>
                  <span className="admin-status-pill admin-status-pill-inline">
                    <span>Showing</span>
                    <strong>
                      {visibleInquiries.length} / {inquiries.length}
                    </strong>
                  </span>
                </div>
              </article>

              {visibleInquiries.length > 0 ? (
                <div className="admin-inquiry-list">
                  {visibleInquiries.map((inquiry) => (
                    <article className="admin-board admin-board-soft admin-inquiry-card" key={inquiry._id || `${inquiry.email}-${inquiry.createdAt}`}>
                      <div className="admin-inquiry-head">
                        <div className="admin-inquiry-person">
                          <div className="admin-inquiry-avatar" aria-hidden="true">
                            {(inquiry.name || inquiry.email || "?").trim().charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <span className="admin-page-kicker">New enquiry</span>
                            <h3>{inquiry.name || "Unnamed contact"}</h3>
                            <p className="admin-board-subtitle">{formatInquiryDate(inquiry.createdAt)}</p>
                          </div>
                        </div>
                        <div className="admin-inquiry-actions">
                          {inquiry.email && (
                            <a href={`mailto:${inquiry.email}`} className="btn secondary">
                              Reply
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn danger"
                            onClick={() => handleDeleteInquiry(inquiry)}
                            disabled={deletingInquiryId === inquiry._id}
                          >
                            {deletingInquiryId === inquiry._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                      <dl className="admin-inquiry-details">
                        <div>
                          <dt>Email</dt>
                          <dd>{inquiry.email ? <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a> : "Not provided"}</dd>
                        </div>
                        <div>
                          <dt>Phone</dt>
                          <dd>{inquiry.phone ? <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a> : "Not provided"}</dd>
                        </div>
                        <div>
                          <dt>Company</dt>
                          <dd>{inquiry.company || "Not provided"}</dd>
                        </div>
                      </dl>
                      <div className="admin-inquiry-message">
                        <strong>Message</strong>
                        <p>{inquiry.message || "No message provided."}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <article className="admin-board admin-board-soft admin-inquiry-empty">
                  <h3>{inquiries.length > 0 ? "No matching enquiries" : "No enquiries yet"}</h3>
                  <p className="admin-board-subtitle">
                    {inquiries.length > 0
                      ? "Try another search term or clear the search field to see all submissions."
                      : "When someone submits the contact form, the inquiry will show up here automatically."}
                  </p>
                </article>
              )}
            </div>
          )}

          {activeSection === "faq" && (
            <article className="admin-board admin-board-soft">
              <div className="admin-board-head-row">
                <div>
                  <h3>FAQ page</h3>
                  <p className="admin-board-subtitle">Edit the public FAQ page from here. Keep questions short and answers clear.</p>
                </div>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    const next = clone(draft);
                    next.faq = normalizeFaqSection(next.faq);
                    next.faq.items = [
                      ...(next.faq.items || []),
                      {
                        id: createId("faq"),
                        question: "New question",
                        answer: "Write the answer here.",
                      },
                    ];
                    syncDraft(next);
                  }}
                >
                  Add FAQ item
                </button>
              </div>
              <div className="admin-form-grid">
                <label>
                  Heading
                  <input
                    value={draft.faq?.heading || ""}
                    onChange={(event) => {
                      const next = clone(draft);
                      next.faq = normalizeFaqSection(next.faq);
                      next.faq.heading = event.target.value;
                      syncDraft(next);
                    }}
                  />
                </label>
                <label>
                  Intro text
                  <textarea
                    rows="3"
                    value={draft.faq?.text || ""}
                    onChange={(event) => {
                      const next = clone(draft);
                      next.faq = normalizeFaqSection(next.faq);
                      next.faq.text = event.target.value;
                      syncDraft(next);
                    }}
                  />
                </label>
              </div>
              <div className="admin-stack">
                {faqItems.map((item, index) => (
                  <div className="admin-repeater-card" key={item.id || index}>
                    <label>
                      Question
                      <input
                        value={item.question}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.faq = normalizeFaqSection(next.faq);
                          next.faq.items = updateItem(next.faq.items, index, { ...item, question: event.target.value });
                          syncDraft(next);
                        }}
                      />
                    </label>
                    <label>
                      Answer
                      <textarea
                        rows="4"
                        value={item.answer}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.faq = normalizeFaqSection(next.faq);
                          next.faq.items = updateItem(next.faq.items, index, { ...item, answer: event.target.value });
                          syncDraft(next);
                        }}
                      />
                    </label>
                    <div className="admin-inline-actions">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          const next = clone(draft);
                          next.faq = normalizeFaqSection(next.faq);
                          next.faq.items = next.faq.items.filter((_, itemIndex) => itemIndex !== index);
                          syncDraft(next);
                        }}
                      >
                        Delete item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeSection === "testimonials" && (
            <article className="admin-board admin-board-soft">
              <h3>Testimonials</h3>
              <div className="admin-stack">
                {testimonials.map((item, index) => (
                  <div className="admin-repeater-card" key={item.id || index}>
                    <div className="admin-form-grid">
                      <label>
                        Name
                        <input
                          value={item.name}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.testimonials.items = updateItem(next.testimonials.items, index, { ...item, name: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                    </div>
                    <label>
                      Quote
                      <textarea
                        rows="3"
                        value={item.quote}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.testimonials.items = updateItem(next.testimonials.items, index, { ...item, quote: event.target.value });
                          syncDraft(next);
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeSection === "legal" && (
            <article className="admin-board admin-board-soft">
              <h3>Legal content</h3>
              <div className="admin-stack">
                {legalSections.map((item, index) => (
                  <div className="admin-repeater-card" key={item.id || index}>
                    <div className="admin-form-grid">
                      <label>
                        Title
                        <input
                          value={item.title}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.legal.sections = updateItem(next.legal.sections, index, { ...item, title: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                    </div>
                    <label>
                      Text
                      <textarea
                        rows="3"
                        value={item.text}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.legal.sections = updateItem(next.legal.sections, index, { ...item, text: event.target.value });
                          syncDraft(next);
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>

      <ImageCropModal
        isOpen={Boolean(cropConfig)}
        onClose={() => setCropConfig(null)}
        onSave={handleUploadCropped}
        aspect={cropConfig?.aspect || 1}
        outputWidth={cropConfig?.outputWidth || 1200}
        outputHeight={cropConfig?.outputHeight || 1200}
      />
    </section>
  );
}

export default AdminPage;

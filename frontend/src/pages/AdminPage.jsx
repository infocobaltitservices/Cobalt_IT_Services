import React, { useMemo, useState } from "react";
import {
  getAdminAccessKey,
  getAdminEmail,
  getAdminSiteContent,
  loginAdmin,
  logoutAdmin,
  saveAdminSiteContent,
  uploadAdminImage,
} from "../api";
import { defaultSiteContent } from "../defaultSiteContent";
import ImageCropModal from "../components/ImageCropModal";

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

function updateItem(list, index, nextItem) {
  return list.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const adminSections = [
  { id: "overview", label: "Overview" },
  { id: "brand", label: "Site Settings" },
  { id: "home", label: "Homepage" },
  { id: "about", label: "About & Founders" },
  { id: "services", label: "Services" },
  { id: "gallery", label: "Gallery" },
  { id: "contact", label: "Contact" },
  { id: "testimonials", label: "Testimonials" },
  { id: "legal", label: "Legal" },
];

function AdminPage({ initialContent, onContentSaved }) {
  const [draft, setDraft] = useState(clone(initialContent || defaultSiteContent));
  const [status, setStatus] = useState("idle");
  const [activeSection, setActiveSection] = useState("overview");
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [loginForm, setLoginForm] = useState({ email: getAdminEmail(), password: "" });
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminAccessKey()));
  const [cropConfig, setCropConfig] = useState(null);

  const overviewStats = useMemo(
    () => [
      { label: "Founders", value: draft.about?.founders?.length || 0 },
      { label: "Services", value: draft.services?.items?.length || 0 },
      { label: "Gallery Items", value: draft.gallery?.items?.length || 0 },
      { label: "Testimonials", value: draft.testimonials?.items?.length || 0 },
      { label: "Hero Slides", value: draft.home?.heroTitleLines?.length || 0 },
      { label: "Delivery Steps", value: draft.home?.deliverySteps?.length || 0 },
    ],
    [draft]
  );

  function syncDraft(nextDraft) {
    setDraft(nextDraft);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus("authenticating");
    try {
      await loginAdmin(loginForm.email, loginForm.password);
      const content = await getAdminSiteContent();
      syncDraft(content);
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
      syncDraft(content);
      setStatus("loaded");
    } catch (error) {
      setStatus(error.message || "refresh-error");
    }
  }

  async function handleSave() {
    setStatus("saving");
    try {
      const saved = await saveAdminSiteContent(draft);
      syncDraft(saved);
      onContentSaved(saved);
      setStatus("saved");
    } catch (error) {
      setStatus(error.message || "save-error");
    }
  }

  async function handleUploadCropped(dataUrl) {
    if (!cropConfig) return;
    const uploaded = await uploadAdminImage(dataUrl, cropConfig.folder);
    const nextDraft = clone(draft);
    cropConfig.apply(nextDraft, uploaded.url);
    syncDraft(nextDraft);
  }

  function launchCropper(config) {
    setCropConfig(config);
  }

  function handleLogout() {
    logoutAdmin();
    setAuthenticated(false);
    setLoginForm((prev) => ({ ...prev, password: "" }));
    setStatus("logged-out");
  }

  if (!authenticated) {
    return (
      <section className="section admin-login-page">
        <div className="admin-login-shell">
          <div className="admin-login-panel">
            <span className="admin-login-kicker">Secure Access</span>
            <h2>Admin panel login</h2>
            <p>Enter the admin email and password to manage site content, founders, services, and uploaded media.</p>

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

  const founders = draft.about?.founders || [];
  const services = draft.services?.items || [];
  const galleryItems = draft.gallery?.items || [];
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
            <div>
              <span className="admin-page-kicker">Manage Content</span>
              <h2>{adminSections.find((section) => section.id === activeSection)?.label || "Overview"}</h2>
            </div>
            <div className="admin-topbar-actions">
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
                  <li>About page vision, mission, founders, and animated metrics.</li>
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
                <img className="admin-thumb" src={draft.brand.logoUrl} alt="Brand logo" />
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
                  <label>
                    Hero video for light mode
                    <input value={draft.home.heroVideoLight} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, heroVideoLight: event.target.value } })} />
                  </label>
                  <label>
                    Hero video for dark mode
                    <input value={draft.home.heroVideoDark} onChange={(event) => syncDraft({ ...draft, home: { ...draft.home, heroVideoDark: event.target.value } })} />
                  </label>
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
                        <img className="admin-thumb admin-thumb-wide" src={item.image} alt={item.title} />
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
                <h3>Founders</h3>
                <div className="admin-stack">
                  {founders.map((founder, index) => (
                    <div className="admin-repeater-card" key={founder.id || index}>
                      <div className="admin-form-grid">
                        <label>
                          Number
                          <input
                            value={founder.number}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.about.founders = updateItem(next.about.founders, index, { ...founder, number: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Name
                          <input
                            value={founder.name}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.about.founders = updateItem(next.about.founders, index, { ...founder, name: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label>
                          Role
                          <input
                            value={founder.role}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.about.founders = updateItem(next.about.founders, index, { ...founder, role: event.target.value });
                              syncDraft(next);
                            }}
                          />
                        </label>
                        <label className="admin-checkbox">
                          <input
                            type="checkbox"
                            checked={Boolean(founder.reverse)}
                            onChange={(event) => {
                              const next = clone(draft);
                              next.about.founders = updateItem(next.about.founders, index, { ...founder, reverse: event.target.checked });
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
                          value={founder.bio}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.about.founders = updateItem(next.about.founders, index, { ...founder, bio: event.target.value });
                            syncDraft(next);
                          }}
                        />
                      </label>
                      <label>
                        Social links
                        <textarea
                          rows="3"
                          value={socialLinksToLines(founder.socialLinks)}
                          onChange={(event) => {
                            const next = clone(draft);
                            next.about.founders = updateItem(next.about.founders, index, {
                              ...founder,
                              socialLinks: linesToSocialLinks(event.target.value),
                            });
                            syncDraft(next);
                          }}
                          placeholder="LinkedIn|https://www.linkedin.com/in/name"
                        />
                      </label>
                      <div className="admin-inline-actions">
                        <img className="admin-thumb admin-thumb-wide" src={founder.image} alt={founder.name} />
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() =>
                            launchCropper({
                              folder: "cobalt/founders",
                              aspect: 1.62,
                              outputWidth: 1200,
                              outputHeight: 740,
                              apply: (nextDraft, imageUrl) => {
                                nextDraft.about.founders[index].image = imageUrl;
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
                            next.about.founders.splice(index, 1);
                            syncDraft(next);
                          }}
                        >
                          Delete founder
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      const next = clone(draft);
                      next.about.founders.push({
                        id: createId("founder"),
                        number: "00",
                        name: "New Founder",
                        role: "Founder",
                        bio: "",
                        image: draft.brand.logoUrl,
                        reverse: false,
                        socialLinks: [{ label: "LinkedIn", href: "" }],
                      });
                      syncDraft(next);
                    }}
                  >
                    Add founder
                  </button>
                </div>
              </article>
            </div>
          )}

          {activeSection === "services" && (
            <div className="admin-section-layout">
              <div className="admin-subnav">
                {services.map((item, index) => (
                  <button
                    type="button"
                    key={item.id || item.slug}
                    className={`admin-subnav-item ${activeServiceIndex === index ? "is-active" : ""}`}
                    onClick={() => setActiveServiceIndex(index)}
                  >
                    {item.title}
                  </button>
                ))}
                <button
                  type="button"
                  className="admin-subnav-create"
                  onClick={() => {
                    const next = clone(draft);
                    next.services.items.push({
                      id: `service-${Date.now()}`,
                      slug: "new-service",
                      title: "New Service",
                      shortText: "",
                      icon: "gpu",
                      heroLabel: "Service Label",
                      intro: "",
                      highlights: [],
                      deliverables: [],
                      outcomes: [],
                    });
                    syncDraft(next);
                    setActiveServiceIndex(next.services.items.length - 1);
                  }}
                >
                  Add service
                </button>
              </div>

              {service && (
                <article className="admin-board admin-board-soft">
                  <h3>{service.title}</h3>
                  <div className="admin-form-grid">
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
                  </div>
                  <label>
                    Card text
                    <textarea
                      rows="2"
                      value={service.shortText}
                      onChange={(event) => {
                        const next = clone(draft);
                        next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, shortText: event.target.value });
                        syncDraft(next);
                      }}
                    />
                  </label>
                  <label>
                    Detail intro
                    <textarea
                      rows="3"
                      value={service.intro}
                      onChange={(event) => {
                        const next = clone(draft);
                        next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, intro: event.target.value });
                        syncDraft(next);
                      }}
                    />
                  </label>
                  <div className="admin-form-grid admin-form-grid-three">
                    <label>
                      Highlights
                      <textarea
                        rows="6"
                        value={arrayToLines(service.highlights)}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, highlights: linesToArray(event.target.value) });
                          syncDraft(next);
                        }}
                      />
                    </label>
                    <label>
                      Deliverables
                      <textarea
                        rows="6"
                        value={arrayToLines(service.deliverables)}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, deliverables: linesToArray(event.target.value) });
                          syncDraft(next);
                        }}
                      />
                    </label>
                    <label>
                      Outcomes
                      <textarea
                        rows="6"
                        value={arrayToLines(service.outcomes)}
                        onChange={(event) => {
                          const next = clone(draft);
                          next.services.items = updateItem(next.services.items, activeServiceIndex, { ...service, outcomes: linesToArray(event.target.value) });
                          syncDraft(next);
                        }}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      const next = clone(draft);
                      next.services.items.splice(activeServiceIndex, 1);
                      syncDraft(next);
                      setActiveServiceIndex(Math.max(0, activeServiceIndex - 1));
                    }}
                  >
                    Delete service
                  </button>
                </article>
              )}
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
                      <img className="admin-thumb admin-thumb-wide" src={item.image} alt={item.title} />
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

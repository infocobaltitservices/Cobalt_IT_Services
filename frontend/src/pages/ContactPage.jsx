import React, { useState } from "react";
import { submitInquiry } from "../api";

const initialFormState = { name: "", email: "", phone: "", company: "", message: "" };
const placeholderValues = new Set(["test", "testing", "none", "na", "n/a", "asdf", "qwerty", "demo", "sample"]);

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function hasPlaceholder(value) {
  return placeholderValues.has(cleanText(value).toLowerCase());
}

function isSequentialDigits(digits) {
  if (digits.length < 7) return false;
  return "01234567890123456789".includes(digits) || "98765432109876543210".includes(digits);
}

function validateContactForm(values) {
  const cleaned = {
    name: cleanText(values.name),
    email: cleanText(values.email).toLowerCase(),
    phone: cleanText(values.phone),
    company: cleanText(values.company),
    message: String(values.message || "").trim(),
  };
  const errors = {};

  if (!cleaned.name || cleaned.name.length < 2 || !/[a-z]/i.test(cleaned.name) || hasPlaceholder(cleaned.name)) {
    errors.name = "Enter your real name.";
  }

  if (!cleaned.email || cleaned.email.length > 254 || cleaned.email.includes("..") || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned.email)) {
    errors.email = "Enter a valid email address.";
  } else {
    const [localPart = "", domain = ""] = cleaned.email.split("@");
    if (hasPlaceholder(localPart) || placeholderValues.has(domain.split(".")[0])) {
      errors.email = "Enter a real email address.";
    }
  }

  const phoneDigits = cleaned.phone.replace(/\D/g, "");
  if (!cleaned.phone || !/^\+?[0-9().\-\s]+$/.test(cleaned.phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number.";
  } else if (/^(\d)\1+$/.test(phoneDigits) || isSequentialDigits(phoneDigits)) {
    errors.phone = "Enter a real phone number.";
  }

  if (!cleaned.company || cleaned.company.length < 2 || !/[a-z]/i.test(cleaned.company) || hasPlaceholder(cleaned.company)) {
    errors.company = "Enter your company or organization name.";
  }

  if (!cleaned.message || cleaned.message.length < 10 || !/[a-z]/i.test(cleaned.message) || hasPlaceholder(cleaned.message)) {
    errors.message = "Tell us a little more about your requirement.";
  }

  return { cleaned, errors };
}

function ContactPage({ content, brand }) {
  const [formState, setFormState] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submissionState, setSubmissionState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");

  function updateField(field, value) {
    setFormState((state) => ({ ...state, [field]: value }));
    setFieldErrors((errors) => ({ ...errors, [field]: "" }));
    if (submissionState !== "sending") {
      setSubmissionState("idle");
      setStatusMessage("");
    }
  }

  function validateField(field) {
    const { errors } = validateContactForm(formState);
    setFieldErrors((current) => ({ ...current, [field]: errors[field] || "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { cleaned, errors } = validateContactForm(formState);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmissionState("error");
      setStatusMessage("Please fill every field with valid details.");
      return;
    }

    setSubmissionState("sending");
    setStatusMessage("");

    try {
      await submitInquiry(cleaned);
      setSubmissionState("sent");
      setStatusMessage("Thank you. We received your enquiry and will contact you soon.");
      setFieldErrors({});
      setFormState(initialFormState);
    } catch (error) {
      setFieldErrors(error.fields || {});
      setSubmissionState("error");
      setStatusMessage(error.message || "Something went wrong. Please try again.");
    }
  }

  function renderError(field) {
    if (!fieldErrors[field]) return null;
    return <span className="field-error">{fieldErrors[field]}</span>;
  }

  return (
    <section className="section contact-page" id="contact-us">
      <div className="section-heading">
        <h2>{content.heading}</h2>
        <p>{content.text}</p>
      </div>
      <div className="contact-shell">
        <div className="contact-info-panel">
          <span className="eyebrow">{content.eyebrow || brand.companyName}</span>
          <h3>{content.title}</h3>
          <p>{content.description}</p>

          <div className="contact-info-grid">
            {content.infoCards.map((item) =>
              item.href ? (
                <a className="contact-info-card" href={item.href} key={`${item.label}-${item.value}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </a>
              ) : (
                <div className="contact-info-card" key={`${item.label}-${item.value}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              )
            )}
          </div>

          <div className="contact-channels">
            <h4>{content.channelsTitle}</h4>
            <div className="channel-row">
              {content.channels.map((item) => (
                <a href={item.href} target="_blank" rel="noreferrer" key={item.label}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="contact-form-wrap">
          <form className="contact-form" onSubmit={handleSubmit}>
            <p className="contact-form-note">All fields are required. Please use details our team can reply to.</p>
            <div className="field-row">
              <label className="form-field">
                <span>Name</span>
                <input
                  value={formState.name}
                  onBlur={() => validateField("name")}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  required
                />
                {renderError("name")}
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onBlur={() => validateField("email")}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  required
                />
                {renderError("email")}
              </label>
            </div>
            <div className="field-row">
              <label className="form-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={formState.phone}
                  onBlur={() => validateField("phone")}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  required
                />
                {renderError("phone")}
              </label>
              <label className="form-field">
                <span>Company</span>
                <input
                  value={formState.company}
                  onBlur={() => validateField("company")}
                  onChange={(e) => updateField("company", e.target.value)}
                  placeholder="Company or organization"
                  autoComplete="organization"
                  aria-invalid={Boolean(fieldErrors.company)}
                  required
                />
                {renderError("company")}
              </label>
            </div>
            <label className="form-field">
              <span>Requirement</span>
              <textarea
                rows="5"
                value={formState.message}
                onBlur={() => validateField("message")}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="Tell us what you want to build"
                aria-invalid={Boolean(fieldErrors.message)}
                required
              />
              {renderError("message")}
            </label>
            {statusMessage && <p className={`form-status form-status-${submissionState}`}>{statusMessage}</p>}
            <button className="btn primary" type="submit" disabled={submissionState === "sending"}>
              {submissionState === "sending" ? "Sending..." : submissionState === "sent" ? "Sent" : submissionState === "error" ? "Try Again" : "Send Inquiry"}
            </button>
          </form>

          <div className="contact-map-panel">
            <div className="contact-map-head">
              <strong>{content.mapTitle}</strong>
              <p>{content.mapLabel}</p>
            </div>
            <div className="contact-map-frame">
              <iframe
                title={`${content.mapLabel} map`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(content.mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;

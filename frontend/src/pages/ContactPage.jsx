import React, { useState } from "react";
import { submitInquiry } from "../api";

function ContactPage({ content, brand }) {
  const [formState, setFormState] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submissionState, setSubmissionState] = useState("idle");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmissionState("sending");
    try {
      await submitInquiry(formState);
      setSubmissionState("sent");
      setFormState({ name: "", email: "", phone: "", company: "", message: "" });
    } catch {
      setSubmissionState("error");
    }
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
            <div className="field-row">
              <input value={formState.name} onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))} placeholder="Name" />
              <input value={formState.email} onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))} placeholder="Email" />
            </div>
            <div className="field-row">
              <input value={formState.phone} onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" />
              <input value={formState.company} onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))} placeholder="Company" />
            </div>
            <textarea
              rows="5"
              value={formState.message}
              onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
              placeholder="Tell us what you want to build"
            />
            <button className="btn primary" type="submit">
              {submissionState === "sending"
                ? "Sending..."
                : submissionState === "sent"
                  ? "Sent"
                  : submissionState === "error"
                    ? "Try Again"
                    : "Send Inquiry"}
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

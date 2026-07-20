import React from "react";
import ServiceIcon from "../components/ServiceIcon";

function ServiceDetailPage({ service }) {
  if (!service) {
    return (
      <section className="section service-detail-page">
        <div className="service-detail-shell">
          <span className="service-detail-kicker">Service</span>
          <h2>Service not found</h2>
          <p>The requested service page is not available.</p>
          <a className="btn primary magnetic" href="#/services">
            Back to Services
          </a>
        </div>
      </section>
    );
  }

  const heroImage = (service.heroImage || "").trim();

  return (
    <section className="section service-detail-page">
      <div className="service-detail-shell">
        <a className="service-detail-back" href="#/services">
          Back to Services
        </a>

        <div className="service-detail-hero">
          <div className="service-detail-copy">
            <span className="service-detail-kicker">{service.heroLabel}</span>
            <h2>{service.title}</h2>
            <p>{service.intro}</p>
            <div className="service-detail-actions">
              <a className="btn primary magnetic" href="#/contact-us">
                Start Enquiry
              </a>
              <a className="btn secondary magnetic" href="#/gallery">
                View Gallery
              </a>
            </div>
          </div>

          <div className="service-detail-image-panel" aria-hidden="true">
            {heroImage ? (
              <img className="service-detail-image" src={heroImage} alt="" />
            ) : (
              <span className={`service-icon-tile service-icon-tile-large icon-${service.icon}`}>
                <ServiceIcon kind={service.icon} />
              </span>
            )}
          </div>
        </div>

        <div className="service-detail-grid">
          <article className="service-detail-card">
            <h3>What this service covers</h3>
            <ul className="service-detail-list">
              {service.highlights?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="service-detail-card">
            <h3>Typical deliverables</h3>
            <ul className="service-detail-list">
              {service.deliverables?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="service-detail-card service-detail-card-wide">
            <h3>Why Team choose this</h3>
            <div className="service-outcomes">
              {service.outcomes?.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ServiceDetailPage;

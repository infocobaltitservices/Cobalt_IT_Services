import React from "react";
import ServiceIcon from "../components/ServiceIcon";

function ServicesPage({ content }) {
  return (
    <section className="section" id="services">
      <div className="section-heading">
        <h2>{content.heading}</h2>
        <p>{content.text}</p>
      </div>
      <div className="service-grid">
        {content.items.map((service, index) => (
          <a
            className={`service-card service-${service.icon} reveal-card`}
            key={service.slug}
            href={`#/services/${service.slug}`}
            style={{ "--delay": `${index * 80}ms` }}
          >
            <span className={`service-icon-tile icon-${service.icon}`} aria-hidden="true">
              <ServiceIcon kind={service.icon} />
            </span>
            <h3>{service.title}</h3>
            <p>{service.shortText}</p>
            <span className="service-link-text">View service details</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default ServicesPage;

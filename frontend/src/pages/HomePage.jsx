import React, { useState } from "react";

function HomePage({ content, theme }) {
  const [activeWork, setActiveWork] = useState(null);
  const heroVideoSrc = theme === "light" ? content.heroVideoLight : content.heroVideoDark;

  return (
    <section className="hero section" id="home">
      <div className="hero-panel">
        <div className="hero-copy">
          <h1 className="hero-title" aria-label={content.heroTitleLines.map((item) => `${item.emphasis} ${item.rest}`).join(". ")}>
            {content.heroTitleLines.map((line) => (
              <span className="hero-line" key={`${line.emphasis}-${line.rest}`}>
                <span className="hero-word hero-word-emphasis">{line.emphasis}</span> {line.rest}
              </span>
            ))}
          </h1>
          <p>{content.heroText}</p>
          <div className="hero-metrics" aria-label="Key highlights">
            {content.heroMetrics.map((metric) => (
              <div key={`${metric.value}-${metric.label}`}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-actions">
            <a className="btn primary magnetic" href={content.primaryCta.href}>
              {content.primaryCta.label}
            </a>
            <a className="btn secondary magnetic" href={content.secondaryCta.href}>
              {content.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-frame hero-video-frame">
            <div className="hero-video-shell">
              <video
                key={heroVideoSrc}
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Cobalt services showcase video"
              >
                <source src={heroVideoSrc} type="video/mp4" />
              </video>
              <a className="hero-video-cta btn primary magnetic" href={content.heroVideoCta.href}>
                {content.heroVideoCta.label}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="home-delivery section-block">
        <div className="section-heading home-delivery-heading">
          <span className="section-eyebrow delivery-eyebrow">{content.deliveryEyebrow}</span>
          <h2>{content.deliveryHeading}</h2>
          <p>{content.deliveryText}</p>
        </div>

        <div className="home-delivery-grid" aria-label="Delivery framework steps">
          {content.deliverySteps.map((step) => (
            <article className="home-delivery-card" key={step.number}>
              <span className="home-delivery-number">{step.number}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="home-gallery section-block">
        <div className="section-heading">
          <h2>{content.selectedWorkHeading}</h2>
          <p>{content.selectedWorkText}</p>
        </div>
        <div className="home-work-grid" aria-label="Selected work cards">
          {content.selectedWorkItems.map((item) => {
            const activeKey = item.id || item.title;
            return (
              <article
                className="home-work-card"
                key={activeKey}
                onMouseEnter={() => setActiveWork(activeKey)}
                onMouseLeave={() => setActiveWork(null)}
                onFocus={() => setActiveWork(activeKey)}
                onBlur={() => setActiveWork(null)}
                tabIndex={0}
              >
                <div className="home-work-media">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="home-work-copy">
                  <span className="home-work-label">Selected Work</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
                {activeWork === activeKey && (
                  <div className="home-work-modal" role="dialog" aria-label={`${item.title} details`}>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                    <div className="home-work-modal-meta">
                      {(item.meta || []).map((meta) => (
                        <span key={meta}>{meta}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomePage;

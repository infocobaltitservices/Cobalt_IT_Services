import React, { useEffect, useRef, useState } from "react";

function CountUp({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    let frameId = 0;
    let hasAnimated = false;

    const animate = () => {
      const start = performance.now();
      const duration = 1200;

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));
        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [value]);

  return (
    <strong ref={ref}>
      {displayValue}
      {suffix}
    </strong>
  );
}

function AboutPage({ content, brand }) {
  const founders = content.founders || [];
  const carouselFounders = founders.length > 1 ? [...founders, ...founders] : founders;
  const carouselRef = useRef(null);
  const hoveringRef = useRef(false);

  useEffect(() => {
    const node = carouselRef.current;
    if (!node || founders.length < 2) return undefined;

    let frameId = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = () => {
      if (!reduceMotion && !hoveringRef.current) {
        const loopPoint = node.scrollWidth / 2;
        node.scrollLeft += 0.35;
        if (node.scrollLeft >= loopPoint) {
          node.scrollLeft = 0;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [founders.length]);

  function scrollCarousel(direction) {
    const node = carouselRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction * Math.max(node.clientWidth * 0.8, 300),
      behavior: "smooth",
    });
  }

  return (
    <section className="section page-section about-page">
      <div className="about-page-shell">
        <div className="about-page-header">
          <span className="about-section-label">About</span>
          <h2>{brand.companyName}</h2>
          <span className="about-page-underline" aria-hidden="true" />
        </div>

        <div className="about-intro-grid">
          {content.introCards.map((card) => (
            <article className="about-intro-card" key={card.kicker}>
              <span className="about-intro-kicker">{card.kicker}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>

        <div className="about-cta-row">
          <a className="btn about-cta magnetic" href={content.cta.href}>
            {content.cta.label}
          </a>
        </div>

        <div className="about-stats-strip" aria-label="Key company metrics">
          {content.stats.map((stat) => (
            <article className="about-stat-tile" key={stat.label}>
              <CountUp value={Number(stat.value)} suffix={stat.suffix} />
              <span>{stat.label}</span>
            </article>
          ))}
        </div>

        <div className="about-page-header">
          <h2>{content.foundersTitle}</h2>
          <span className="about-page-underline" aria-hidden="true" />
        </div>
        <div className="about-founder-carousel-shell">
          <button
            type="button"
            className="about-carousel-arrow about-carousel-arrow-left"
            onClick={() => scrollCarousel(-1)}
            aria-label="Scroll founders left"
            disabled={founders.length < 2}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div
            className="about-founder-carousel"
            ref={carouselRef}
            aria-label="Founders carousel"
            onMouseEnter={() => {
              hoveringRef.current = true;
            }}
            onMouseLeave={() => {
              hoveringRef.current = false;
            }}
          >
            <div className="about-founder-track">
              {carouselFounders.map((founder, index) => (
                <article className="about-founder-card" key={`${founder.id || founder.name}-${index}`}>
                  <div className="about-founder-card-media">
                    <img src={founder.image} alt={founder.name} />
                  </div>
                  <div className="about-founder-card-copy">
                    <div className="about-founder-card-head">
                      <span className="about-founder-number">{founder.number}</span>
                      <span className="about-founder-role">{founder.role}</span>
                    </div>
                    <h3>{founder.name}</h3>
                    <p>{founder.bio}</p>
                    {founder.socialLinks?.length ? (
                      <div className="about-founder-socials" aria-label={`${founder.name} social links`}>
                        {founder.socialLinks.map((link) => (
                          <a key={`${founder.id || founder.name}-${link.label}`} href={link.href} target="_blank" rel="noreferrer">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="about-carousel-arrow about-carousel-arrow-right"
            onClick={() => scrollCarousel(1)}
            aria-label="Scroll founders right"
            disabled={founders.length < 2}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;

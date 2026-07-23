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

function TeamCard({ Team, onReadMore }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(Team.image) && !imageFailed;
  const initials = (Team.name || "Team")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const bio = String(Team.bio || "").trim();

  return (
    <article className="about-Team-card">
      <div className="about-Team-card-media">
        {hasImage ? (
          <img
            src={Team.image}
            alt={Team.name}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="about-Team-card-placeholder" aria-hidden="true">
            <span>{initials || "CF"}</span>
            <small>Upload photo</small>
          </div>
        )}
      </div>
      <div className="about-Team-card-copy">
        <div className="about-Team-card-head">
          <span className="about-Team-number">{Team.number}</span>
          <span className="about-Team-role">{Team.role}</span>
        </div>
        <h3>{Team.name}</h3>
        <p>{bio}</p>
        <button type="button" className="about-Team-toggle" onClick={onReadMore} aria-label={`Read more about ${Team.name}`}>
          Read more
        </button>
        {Team.socialLinks?.length ? (
          <div className="about-Team-socials" aria-label={`${Team.name} social links`}>
            {Team.socialLinks.map((link) => (
              <a key={`${Team.id || Team.name}-${link.label}`} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AboutPage({ content, brand }) {
  const [activeTeam, setActiveTeam] = useState(null);
  const teamMembers = content.Team || content.Teams || content.founders || [];
  const Team = teamMembers.filter((Team) => {
    const name = (Team.name || "").trim();
    const bio = (Team.bio || "").trim();
    const image = (Team.image || "").trim();
    const socialLinks = Team.socialLinks || [];
    const hasAnything = Boolean(name || bio || image || socialLinks.length || Team.role || Team.number);

    return hasAnything;
  });
  const carouselRef = useRef(null);

  useEffect(() => {
    if (!activeTeam) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveTeam(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeTeam]);

  function scrollCarousel(direction) {
    const node = carouselRef.current;
    if (!node) return;

    const cardWidth = node.querySelector(".about-Team-card")?.getBoundingClientRect().width || 320;
    const gap = 18;
    node.scrollBy({
      left: direction * (cardWidth + gap),
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
          <h2>{content.TeamTitle || content.TeamsTitle || content.foundersTitle || "Meet the Team"}</h2>
          <span className="about-page-underline" aria-hidden="true" />
        </div>
        <div className="about-Team-carousel-shell">
          <button
            type="button"
            className="about-carousel-arrow about-carousel-arrow-left"
            onClick={() => scrollCarousel(-1)}
            aria-label="Scroll Team left"
            disabled={Team.length < 2}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div
            className="about-Team-carousel"
            ref={carouselRef}
            aria-label="Team carousel"
          >
            <div className="about-Team-track">
              {Team.map((Team) => (
                <TeamCard
                  key={Team.id || Team.name}
                  Team={Team}
                  onReadMore={() => setActiveTeam(Team)}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="about-carousel-arrow about-carousel-arrow-right"
            onClick={() => scrollCarousel(1)}
            aria-label="Scroll Team right"
            disabled={Team.length < 2}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        {activeTeam ? (
          <div className="team-modal-overlay" role="presentation" onClick={() => setActiveTeam(null)}>
            <div
              className="team-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="team-modal-close" onClick={() => setActiveTeam(null)} aria-label="Close team details">
                ×
              </button>
              <div className="team-modal-media">
                {activeTeam.image ? <img src={activeTeam.image} alt={activeTeam.name} /> : null}
              </div>
              <div className="team-modal-copy">
                <div className="about-Team-card-head">
                  <span className="about-Team-number">{activeTeam.number}</span>
                  <span className="about-Team-role">{activeTeam.role}</span>
                </div>
                <h3 id="team-modal-title">{activeTeam.name}</h3>
                <p>{activeTeam.bio}</p>
                {activeTeam.socialLinks?.length ? (
                  <div className="about-Team-socials" aria-label={`${activeTeam.name} social links`}>
                    {activeTeam.socialLinks.map((link) => (
                      <a key={`${activeTeam.id || activeTeam.name}-${link.label}-modal`} href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default AboutPage;

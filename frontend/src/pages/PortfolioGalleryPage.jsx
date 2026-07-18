import React, { useEffect, useState } from "react";

function PortfolioGalleryPage({ content }) {
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    if (!activeItem) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeItem]);

  return (
    <section className="section gallery-page" id="portfolio-gallery">
      <div className="section-heading">
        <h2>{content.heading}</h2>
        <p>{content.text}</p>
      </div>
      <div className="portfolio-grid">
        {content.items.map((item, i) => (
          <button
            type="button"
            className="portfolio-card reveal-card"
            style={{ "--delay": `${i * 70}ms` }}
            key={item.id || item.title}
            onClick={() => setActiveItem(item)}
            aria-label={`Open ${item.title} in a popup`}
          >
            <div className="portfolio-media">
              <img src={item.image} alt={item.title} />
            </div>
          </button>
        ))}
      </div>

      {activeItem && (
        <div className="gallery-modal-overlay" role="presentation" onClick={() => setActiveItem(null)}>
          <div
            className="gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="gallery-modal-close" onClick={() => setActiveItem(null)} aria-label="Close preview">
              ×
            </button>
            <div className="gallery-modal-media">
              <img src={activeItem.image} alt={activeItem.title} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PortfolioGalleryPage;

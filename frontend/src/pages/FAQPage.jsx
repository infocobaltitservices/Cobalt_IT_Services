import React, { useState } from "react";

function FAQPage({ content }) {
  const [openId, setOpenId] = useState(content.items?.[0]?.id || "");

  return (
    <section className="section page-section faq-page">
      <div className="section-heading">
        <span className="eyebrow">FAQ</span>
        <h2>{content.heading}</h2>
        <p>{content.text}</p>
      </div>

      <div className="faq-list">
        {(content.items || []).map((item) => {
          const isOpen = openId === item.id;
          return (
            <article className="faq-item" key={item.id || item.question}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenId(isOpen ? "" : item.id)}
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <span className={`faq-icon ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                  +
                </span>
              </button>
              {isOpen && <p>{item.answer}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default FAQPage;

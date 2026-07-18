import React from "react";

function TermsPrivacyPage({ content }) {
  return (
    <section className="section page-section">
      <div className="section-heading">
        <h2>{content.heading}</h2>
        <p>{content.text}</p>
      </div>
      <div className="legal-grid">
        {content.sections.map((item) => (
          <article className="legal-card" key={item.id || item.title}>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TermsPrivacyPage;

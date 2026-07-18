import React from "react";

function TestimonialsPage({ content }) {
  return (
    <section className="section page-section">
      <div className="section-heading">
        <h2>{content.heading}</h2>
        <p>{content.text}</p>
      </div>
      <div className="testimonial-grid">
        {content.items.map((item) => (
          <article className="testimonial-card testimonial-shift" key={item.id || item.name}>
            <p>"{item.quote}"</p>
            <strong>{item.name}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsPage;

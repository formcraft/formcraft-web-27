import React from "react";
import { testimonials } from "../data/products";
import "./Testimonials.css";

export default function Testimonials() {
  return (
    <section className="section testimonials">
      <div className="container">
        <header className="section-header">
          <h2>What Makers & Collectors Say</h2>
        </header>

        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <blockquote key={t.id} className="testimonial-card">
              <p>“{t.text}”</p>
              <footer>
                <img src={t.avatar} alt={t.name} />
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
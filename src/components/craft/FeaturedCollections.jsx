import React from "react";
import { collections } from "../data/products";
import "./FeaturedCollections.css";

export default function FeaturedCollections() {
  return (
    <section className="section collections">
      <div className="container">
        <header className="section-header">
          <h2>Featured Collections</h2>
          <p>Explore work from different craft creatives</p>
        </header>

        <div className="collections-grid">
          {collections.map((col) => (
            <article key={col.id} className="collection-card">
              <div className="collection-image">
                <img src={col.image} alt={col.title} />
              </div>
              <div className="collection-info">
                <h3>{col.title}</h3>
                <p>{col.maker} · {col.count} pieces</p>
                <button className="btn btn-text">Explore →</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
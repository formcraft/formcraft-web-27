import React from "react";
import "./CommunitySection.css";

export default function CommunitySection() {
  return (
    <section id="community" className="section community">
      <div className="container community-inner">
        <div className="community-text">
          <h2>The Formcraft Community</h2>
          <p>
            Formcraft is more than a marketplace. It’s a living community of
            makers, collectors, and curious minds who believe craft still
            matters. Share techniques, support independent artists, and help
            keep traditional skills alive.
          </p>
          <div className="community-ctas">
            <button className="btn btn-primary">Join the Community</button>
            <button className="btn btn-outline-dark">Read Our Story</button>
            <button className="btn btn-text">Donate / Support</button>
          </div>
        </div>
        <div className="community-image">
          <img
            src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800"
            alt="Makers working together"
          />
        </div>
      </div>
    </section>
  );
}
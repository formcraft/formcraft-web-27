import React from "react";
import "./Hero.css";

export default function Hero() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-shape"></div>
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <h1>
            Handmade pieces.<br />
            A community that makes them.
          </h1>
          <p>
            Discover unique craft objects and join a growing community of makers
            and collectors who believe in the beauty of the handmade.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={() => scrollTo("featured-products")}>
              Shop Featured
            </button>
            <button className="btn btn-outline" onClick={() => scrollTo("community")}>
              Join Community
            </button>
          </div>
        </div>

        <div className="hero-visual">
          {/* Decorative still-life composition */}
          <div className="hero-objects">
            <img
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500"
              alt="Ceramic vase"
              className="obj obj-1"
            />
            <img
              src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400"
              alt="Wooden bowl"
              className="obj obj-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
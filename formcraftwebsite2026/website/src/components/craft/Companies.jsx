import React from "react";
import { companies } from "../data/products";
import "./Companies.css";

export default function Companies() {
  return (
    <section className="section companies">
      <div className="container">
        <p className="companies-label">Trusted by makers, studios & brands</p>
        <div className="logo-strip">
          {companies.map((c) => (
            <img key={c.name} src={c.logo} alt={c.name} />
          ))}
        </div>
      </div>
    </section>
  );
}
import React, { useState, useEffect } from "react";
import { products } from "../data/products";
import "./FeaturedProducts.css";

export default function FeaturedProducts({ onAddToCart }) {
  const [selected, setSelected] = useState(null);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);
  const [displayProducts, setDisplayProducts] = useState([]);

  const bgColors = [
    "#f5e6d3",
    "#e8d5c4",
    "#f0e0d0",
    "#e6d4c0",
    "#f2e8dc",
    "#e9d9c8",
    "#f5e9db",
    "#ebe0d2",
  ];

  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  useEffect(() => {
    const update = () => {
      const shuffled = shuffle(products).slice(0, 8);
      setDisplayProducts(shuffled);
    };

    update();
    const interval = setInterval(update, 14000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (product) => {
    setSelected(product);
    setColor(product.colors?.[0] || "");
    setSize(product.sizes?.[0] || "");
    setQuantity(1);
  };

  const closeModal = () => setSelected(null);

  const handleAdd = () => {
    onAddToCart(selected, { color, size, quantity });
    closeModal();
  };

  // Fixed 8 slots
  const slots = [
    "card-1",
    "card-2",
    "card-3",
    "card-4",
    "card-5",
    "card-6",
    "card-7",
    "card-8",
  ];

  return (
    <section id="featured-products" className="section featured-products">
      <div className="container">
        <header className="section-header">
          <h2>Featured Crafts</h2>
          <p>Carefully selected pieces from independent makers</p>
        </header>

        <div className="shop-grid">
          {displayProducts.map((product, index) => {
            const slot = slots[index];
            if (!slot) return null;

            return (
              <article
                key={`${product.id}-${index}`}
                className={`product-card ${slot}`}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => openModal(product)}
              >
                <div
                  className="image-wrap"
                  style={{ backgroundColor: bgColors[index % bgColors.length] }}
                >
                  <img src={product.image} alt={product.name} />
                </div>

                {hoveredId === product.id && (
                  <div className="hover-popup">
                    <strong>{product.name}</strong>
                    <span>${product.price}</span>
                    <small>Click for details</small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <div className="modal-body">
              <div className="modal-gallery">
                <img
                  src={selected.images?.[0] || selected.image}
                  alt={selected.name}
                />
              </div>

              <div className="modal-details">
                <h2>{selected.name}</h2>
                <p className="modal-price">${selected.price}</p>
                <p className="modal-desc">{selected.description}</p>

                {selected.colors && (
                  <div className="option-group">
                    <label>Color</label>
                    <div className="swatches">
                      {selected.colors.map((c) => (
                        <button
                          key={c}
                          className={`swatch ${color === c ? "active" : ""}`}
                          onClick={() => setColor(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selected.sizes && (
                  <div className="option-group">
                    <label>Size</label>
                    <div className="size-options">
                      {selected.sizes.map((s) => (
                        <button
                          key={s}
                          className={`size-btn ${size === s ? "active" : ""}`}
                          onClick={() => setSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="option-group">
                  <label>Quantity</label>
                  <div className="qty-controls">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                      −
                    </button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity((q) => q + 1)}>+</button>
                  </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={handleAdd}>
                  Add to Cart — ${(selected.price * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
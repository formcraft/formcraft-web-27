// Cart.jsx
import React, { useState, useRef, useEffect } from "react";
import "./Cart.css";

export default function Cart({ items, onUpdateQuantity, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const cartRef = useRef(null);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => {
    if (position.x === null) {
      setPosition({
        x: window.innerWidth - 90,
        y: window.innerHeight - 90,
      });
    }
  }, [position.x]);

  const onMouseDown = (e) => {
    if (e.target.closest(".cart-panel")) return;
    setDragging(true);
    const rect = cartRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  return (
    <div
      ref={cartRef}
      className={`floating-cart ${dragging ? "dragging" : ""}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={onMouseDown}
    >
      <button className="cart-toggle" onClick={() => setIsOpen(!isOpen)}>
        🛒
        {totalItems > 0 && <span className="badge">{totalItems}</span>}
      </button>

      {isOpen && (
        <div className="cart-panel">
          <header>
            <h3>Your Cart</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </header>

          {items.length === 0 ? (
            <p className="empty">Your cart is empty</p>
          ) : (
            <>
              <ul className="cart-items">
                {items.map((item, index) => (
                  <li key={`${item.id}-${item.color}-${item.size}`}>
                    <img src={item.image} alt={item.name} />
                    <div className="item-info">
                      <strong>{item.name}</strong>
                      <span>
                        {item.color} · {item.size}
                      </span>
                      <div className="item-controls">
                        <button onClick={() => onUpdateQuantity(index, -1)}>
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(index, 1)}>
                          +
                        </button>
                        <button
                          className="remove"
                          onClick={() => onRemove(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
              <footer>
                <div className="subtotal">
                  <span>Subtotal</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <button className="btn btn-primary btn-full">Checkout</button>
              </footer>
            </>
          )}
        </div>
      )}
    </div>
  );
}
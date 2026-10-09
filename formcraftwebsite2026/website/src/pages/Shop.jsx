import React, { useState } from "react";
import Hero from "../components/craft/Hero";
import FeaturedProducts from "../components/craft/FeaturedProducts";
import FeaturedCollections from "../components/craft/FeaturedCollections";
import Companies from "../components/craft/Companies";
import CommunitySection from "../components/craft/CommunitySection";
import Testimonials from "../components/craft/Testimonials";
import Cart from "../components/craft/Cart";
import "./Shop.css";

export function CraftPage({ user }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, options) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          item.color === options.color &&
          item.size === options.size
      );
      if (existing) {
        return prev.map((item) =>
          item === existing
            ? { ...item, quantity: item.quantity + options.quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          color: options.color,
          size: options.size,
          quantity: options.quantity,
        },
      ];
    });
  };

  const updateQuantity = (index, delta) => {
    setCartItems((prev) =>
      prev
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="craft-page">
      <Hero />
      <FeaturedProducts onAddToCart={addToCart} />
      <FeaturedCollections />
      <Companies />
      <CommunitySection />
      <Testimonials />
      <Cart
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
      />
    </div>
  );
}
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useCart } from "../context/CartContext";
import { Section } from "../components/page/Section";
import { ProductCard } from "../components/shop/ProductCard";
import { Icon } from "../components/ui/Icon";
import { products, productBySlug, categoryLabel } from "../data/products";
import { formatUGX } from "../lib/money";
import { NotFound } from "./NotFound";
import "./ProductPage.css";

export const ProductPage = () => {
    const { slug } = useParams();
    const product = productBySlug(slug);
    usePageMeta(product?.title ?? "Product not found", product?.description);
    const { add, openCart } = useCart();
    const [color, setColor] = useState(product?.colors[0] ?? null);
    const [size, setSize] = useState(product?.sizes[0] ?? null);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    if (!product) return <NotFound />;
    const related = products.filter((p) => p.id !== product.id).slice(0, 3);

    const onAdd = () => {
        add(product.id, { color, size, qty });
        setAdded(true);
        openCart();
    };

    return (
        <div className="product-page" data-division="stores">
            <div className="wrap product-page-grid">
                <figure className="photo product-page-photo" style={{ "--ar": "1 / 1" }}>
                    <img src={`/images/${product.images[0]}.webp`} srcSet={`/images/${product.images[0]}-800.webp 800w, /images/${product.images[0]}.webp 1600w`} sizes="(max-width: 900px) 100vw, 50vw" alt={product.imageAlt} fetchPriority="high" />
                </figure>
                <div className="product-page-info">
                    <nav className="crumbs" aria-label="Breadcrumb">
                        <Link to="/stores">Stores</Link> <span aria-hidden="true">/</span> <span>{categoryLabel(product.category)}</span> <span aria-hidden="true">/</span> <span aria-current="page">{product.title}</span>
                    </nav>
                    <h1 className="h1-s">{product.title}</h1>
                    <p className="product-page-price">{formatUGX(product.priceUGX)}</p>
                    {product.maker && <p className="small">Made by {product.maker} in the Formcraft workshop, Kampala.</p>}
                    <p className="body">{product.description}</p>

                    {product.colors.length > 0 && (
                        <fieldset className="product-page-set">
                            <legend>Finish: {color}</legend>
                            <div className="row" style={{ "--gap": "8px" }}>
                                {product.colors.map((c) => (
                                    <label key={c} className="chip"><input type="radio" name="color" checked={color === c} onChange={() => setColor(c)} />{c}</label>
                                ))}
                            </div>
                        </fieldset>
                    )}
                    {product.sizes.length > 0 && (
                        <fieldset className="product-page-set">
                            <legend>Size: {size}</legend>
                            <div className="row" style={{ "--gap": "8px" }}>
                                {product.sizes.map((s) => (
                                    <label key={s} className="chip"><input type="radio" name="size" checked={size === s} onChange={() => setSize(s)} />{s}</label>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <div className="row product-page-buy">
                        <div className="cart-qty" role="group" aria-label="Quantity">
                            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One less"><Icon name="minus" size={16} /></button>
                            <span aria-live="polite">{qty}</span>
                            <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="One more"><Icon name="plus" size={16} /></button>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={onAdd}><Icon name="cart" size={18} /> Add to cart</button>
                    </div>
                    {added && <p className="small" role="status">Added to your cart.</p>}

                    <dl className="product-page-facts">
                        {product.leadTime && <div><dt>Made to order</dt><dd>{product.leadTime.replace("Made to order · ", "")}</dd></div>}
                        <div><dt>Delivery</dt><dd className="todo">TODO: areas and price</dd></div>
                        <div><dt>Pay with</dt><dd>MTN · Airtel · Card</dd></div>
                    </dl>
                </div>
            </div>

            <Section tone="sheet" seed={3}>
                <h2 className="h2" style={{ marginBottom: 32 }}>You might also like</h2>
                <div className="product-page-related">
                    {related.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
            </Section>
        </div>
    );
};

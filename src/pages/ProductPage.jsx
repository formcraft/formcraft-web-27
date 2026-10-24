import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useCart } from "../hooks/useCart";
import { Section } from "../components/page/Section";
import { ProductCard } from "../components/shop/ProductCard";
import { Icon } from "../components/ui/Icon";
import { categoryLabel } from "../data/products";
import { useContentItem } from "../hooks/useContent";
import { imgAlt, imgProps } from "../lib/images";
import { formatUGX } from "../lib/money";
import { NotFound } from "./NotFound";
import { Todo, PartFact } from "../components/ui/Todo";
import { known, splitPending } from "../lib/pending";
import "./ProductPage.css";

// Main photo plus a row of thumbnails when a product has more than one image (public/images names
// or Storage URLs uploaded from Admin). Thumbnails are buttons; arrow keys move between them and a
// sideways swipe on the main photo shows the next or previous one.
const ProductGallery = ({ images, title, firstAlt }) => {
    const list = images.filter((img) => imgProps(img));
    const [shown, setShown] = useState(0);
    const thumbs = useRef([]);
    const swipe = useRef(null);
    const i = Math.min(shown, Math.max(0, list.length - 1));
    const current = list[i];
    const total = list.length;
    const altFor = (img, k) => imgAlt(img, k === 0 ? firstAlt : `${title}, photo ${k + 1} of ${total}`);

    const go = (k, focus = false) => {
        const next = (k + total) % total;
        setShown(next);
        if (focus) thumbs.current[next]?.focus();
    };
    const onKeyDown = (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") go(i + 1, true);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(i - 1, true);
        else if (e.key === "Home") go(0, true);
        else if (e.key === "End") go(total - 1, true);
        else return;
        e.preventDefault();
    };
    const onPointerDown = (e) => {
        if (total > 1 && e.isPrimary) swipe.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e) => {
        const start = swipe.current;
        swipe.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(i + (dx < 0 ? 1 : -1));
    };

    return (
        <div className="product-page-gallery">
            <figure className="photo product-page-photo" style={{ "--ar": "1 / 1" }} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => {
                swipe.current = null;
            }}>
                {current ? (
                    <img key={i} {...imgProps(current)} sizes="(max-width: 900px) 100vw, 50vw" alt={altFor(current, i)} fetchPriority={i === 0 ? "high" : undefined} draggable="false" />
                ) : (
                    <div className="placeholder">Photo coming soon</div>
                )}
                {total > 1 && (
                    <figcaption className="product-page-count" aria-live="polite">
                        <span className="sr-only">Showing photo </span>
                        {i + 1} / {total}
                    </figcaption>
                )}
            </figure>
            {total > 1 && (
                <ul className="product-page-thumbs" aria-label={`Photos of ${title}`} onKeyDown={onKeyDown}>
                    {list.map((img, k) => (
                        <li key={k}>
                            <button
                                ref={(el) => {
                                    thumbs.current[k] = el;
                                }}
                                type="button"
                                className="product-page-thumb"
                                aria-label={`Show photo ${k + 1} of ${total}`}
                                aria-pressed={k === i}
                                onClick={() => go(k)}
                            >
                                <img {...imgProps(img, { small: true })} sizes="96px" alt="" loading="lazy" decoding="async" draggable="false" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const ProductPage = () => {
    const { slug } = useParams();
    const { item: product, items: products, loading } = useContentItem("products", slug);
    usePageMeta(product?.title ?? "Product not found", splitPending(product?.description)[0] || undefined, { image: product?.images?.[0], noindex: !product });
    const { add, openCart } = useCart();
    const [picked, setColor] = useState(null);
    const [pickedSize, setSize] = useState(null);
    const color = picked ?? product?.colors?.[0] ?? null;
    const size = pickedSize ?? product?.sizes?.[0] ?? null;
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    if (!product && loading) return <div className="wrap section"><div className="skeleton" style={{ height: 480 }} /></div>;
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
                <ProductGallery key={product.id} images={product.images ?? []} title={product.title} firstAlt={product.imageAlt || product.title} />
                <div className="product-page-info">
                    <nav className="crumbs" aria-label="Breadcrumb">
                        <Link to="/stores">Stores</Link> <span aria-hidden="true">/</span> <span>{categoryLabel(product.category)}</span> <span aria-hidden="true">/</span> <span aria-current="page">{product.title}</span>
                    </nav>
                    <h1 className="h1-s">{product.title}</h1>
                    <p className="product-page-price">{formatUGX(product.priceUGX)}</p>
                    {known(product.maker) && <p className="small">Made by {product.maker} in the Formcraft workshop, Kampala.</p>}
                    <p className="body"><PartFact text={product.description} /></p>

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
                        <Todo as="div">TODO: delivery areas and price</Todo>
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

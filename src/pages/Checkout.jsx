import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { useContent } from "../hooks/useContent";
import { formatUGX } from "../lib/money";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { imgName } from "../lib/images";
import { Icon } from "../components/ui/Icon";
import { Todo } from "../components/ui/Todo";
import "./Checkout.css";

// Checkout, built ahead of Phase 3. Prices on this page are for display only: the browser will send
// product ids and quantities to the createCheckout Cloud Function, which reads the real prices,
// writes the order and returns a Flutterwave link. Nothing here writes an order.
const METHODS = [
    { id: "mtn", label: "MTN Mobile Money", hint: "Approve the prompt on your phone", short: "MTN MoMo" },
    { id: "airtel", label: "Airtel Money", hint: "Approve the prompt on your phone", short: "Airtel Money" },
    { id: "card", label: "Card", hint: "Visa or Mastercard", short: "card" },
];
const AREAS = ["Kampala", "Wakiso", "Mukono", "Entebbe", "Other"];
const STEPS = ["Delivery", "Payment", "Confirmation"];

const thumb = (img) => {
    const name = imgName(img);
    if (!name) return null;
    return /^(https?:|\/|blob:)/.test(name) ? name : `/images/${name}-800.webp`;
};

export const CheckoutSteps = ({ current }) => (
    <ol className="checkout-steps" aria-label="Checkout steps">
        {STEPS.map((s, i) => (
            <li key={s} className={i === current ? "is-current" : i < current ? "is-done" : ""} aria-current={i === current ? "step" : undefined}>
                <span className="checkout-steps-n">{i + 1}</span> {s}
            </li>
        ))}
    </ol>
);

export const Checkout = () => {
    usePageMeta("Checkout", "Check your order, add delivery details and pay with MTN or Airtel mobile money or card.");
    const { items, update, remove } = useCart();
    const { user, loading: authLoading, openSignIn } = useAuth();
    const { items: products, loading } = useContent("products");
    const [form, setForm] = useState({ name: "", phone: "", how: "deliver", area: "Kampala", street: "", notes: "" });
    const [method, setMethod] = useState("mtn");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const lines = items.map((line) => ({ line, product: products.find((p) => p.id === line.productId || p.slug === line.productId) ?? null }));
    const allPriced = lines.length > 0 && lines.every(({ product }) => Number.isInteger(product?.priceUGX));
    const subtotal = allPriced ? lines.reduce((sum, { line, product }) => sum + product.priceUGX * line.qty, 0) : null;
    const chosen = METHODS.find((m) => m.id === method);

    return (
        <div className="checkout">
            <PageHero motif="city" sheet="S201" seed={61} sceneHeight={240} title="Checkout" crumbs={[["/", "Home"], ["/stores", "Stores"], [null, "Checkout"]]}
                lead="Check your order, tell us where it goes, and choose how to pay.">
                <Link to="/stores" className="btn btn-line"><Icon name="arrowLeft" size={18} /> Back to the shop</Link>
            </PageHero>

            <Section tone="sheet" seed={2}>
                {items.length === 0 ? (
                    <div className="card card-pad stack center checkout-empty" style={{ "--gap": "16px" }}>
                        <Icon name="cart" size={40} strokeWidth={1.5} />
                        <h2 className="h3">Your cart is empty.</h2>
                        <p className="body mw" style={{ "--mw": "460px" }}>Pick something from the store first — furniture from the workshop, merch, or plans for a home.</p>
                        <Link to="/stores" className="btn btn-primary">Browse the store <Icon name="arrow" size={18} /></Link>
                    </div>
                ) : (
                    <>
                        <CheckoutSteps current={0} />

                        {!authLoading && !user && (
                            <div className="alert checkout-signin" role="status">
                                <p><strong>Sign in to check out.</strong> Your order and its status are kept in your account, so you can follow it after you pay. You can look around first.</p>
                                <button type="button" className="btn btn-ink btn-sm" onClick={openSignIn}>Sign in</button>
                            </div>
                        )}

                        <div className="checkout-grid">
                            <form className="form checkout-form" onSubmit={(e) => e.preventDefault()} aria-label="Delivery and payment">
                                <fieldset className="checkout-set">
                                    <legend className="h3">Delivery</legend>
                                    <div className="form-row">
                                        <div className="field">
                                            <label htmlFor="co-name">Full name</label>
                                            <input id="co-name" autoComplete="name" value={form.name} onChange={set("name")} />
                                        </div>
                                        <div className="field">
                                            <label htmlFor="co-phone">Phone</label>
                                            <input id="co-phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="field">
                                            <label htmlFor="co-how">How do you want it?</label>
                                            <select id="co-how" value={form.how} onChange={set("how")}>
                                                <option value="deliver">Deliver to me</option>
                                                <option value="collect">Collect from the workshop</option>
                                            </select>
                                        </div>
                                        {form.how === "deliver" && (
                                            <div className="field">
                                                <label htmlFor="co-area">Area</label>
                                                <select id="co-area" value={form.area} onChange={set("area")}>
                                                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                                                </select>
                                                <Todo>TODO: areas served and delivery prices</Todo>
                                            </div>
                                        )}
                                    </div>
                                    {form.how === "deliver" ? (
                                        <div className="field">
                                            <label htmlFor="co-street">Street, building or landmark</label>
                                            <input id="co-street" autoComplete="street-address" value={form.street} onChange={set("street")} />
                                        </div>
                                    ) : (
                                        <p className="small">Collect from the Formcraft workshop, Kampala. <Todo>TODO: workshop address and opening hours.</Todo></p>
                                    )}
                                    <div className="field">
                                        <label htmlFor="co-notes">Notes for the driver (optional)</label>
                                        <textarea id="co-notes" value={form.notes} onChange={set("notes")} />
                                    </div>
                                </fieldset>

                                <fieldset className="checkout-set">
                                    <legend className="h3">Payment</legend>
                                    <div className="checkout-methods">
                                        {METHODS.map((m) => (
                                            <label key={m.id} className="option">
                                                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                                                <strong>{m.label}</strong>
                                                <span className="fine">{m.hint}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="fine">Payments go through Flutterwave, in UGX.</p>
                                </fieldset>
                            </form>

                            <aside className="card card-pad checkout-summary" aria-labelledby="co-summary">
                                <h2 id="co-summary" className="h3">Your order</h2>
                                {loading && products.length === 0 ? (
                                    <div className="stack" style={{ "--gap": "10px" }} aria-hidden="true">
                                        <div className="skeleton" style={{ height: 64 }} />
                                        <div className="skeleton" style={{ height: 64 }} />
                                    </div>
                                ) : (
                                    <ul className="checkout-lines">
                                        {lines.map(({ line, product }) => {
                                            const title = product?.title ?? "Item no longer in the store";
                                            const options = [line.color, line.size].filter(Boolean).join(" · ");
                                            const src = thumb(product?.images?.[0]);
                                            return (
                                                <li key={`${line.productId}-${line.color}-${line.size}`} className="checkout-line">
                                                    {src ? <img src={src} alt="" width="64" height="64" loading="lazy" /> : <span className="placeholder checkout-line-ph" aria-hidden="true" />}
                                                    <div className="checkout-line-info">
                                                        {product ? <Link to={`/stores/${product.slug}`} className="checkout-line-title">{title}</Link> : <span className="checkout-line-title">{title}</span>}
                                                        <span className="fine">{[options, `×${line.qty}`].filter(Boolean).join(" · ")}</span>
                                                        <div className="row checkout-line-actions" style={{ "--gap": "6px" }}>
                                                            <button type="button" className="icon-btn" onClick={() => update(line, -1)} aria-label={`One less ${title}`}><Icon name="minus" size={16} /></button>
                                                            <button type="button" className="icon-btn" onClick={() => update(line, 1)} aria-label={`One more ${title}`}><Icon name="plus" size={16} /></button>
                                                            <button type="button" className="icon-btn" onClick={() => remove(line)} aria-label={`Remove ${title}`}><Icon name="trash" size={16} /></button>
                                                        </div>
                                                    </div>
                                                    <span className="small checkout-line-price">{Number.isInteger(product?.priceUGX) ? formatUGX(product.priceUGX * line.qty) : formatUGX(null)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                <dl className="checkout-totals">
                                    <div><dt>Subtotal</dt><dd>{formatUGX(subtotal)}</dd></div>
                                    {/* Delivery prices aren't set yet: the line says so plainly, and the team sees the note */}
                                    <div><dt>Delivery</dt><dd>Agreed when we call you <Todo>TODO: {form.how === "collect" ? "confirm collecting is free" : "delivery prices by area"}</Todo></dd></div>
                                    <div className="checkout-total"><dt>Total</dt><dd>{subtotal === null ? "Price on request" : `${formatUGX(subtotal)} + delivery`}</dd></div>
                                </dl>
                                <button type="button" className="btn btn-primary btn-block" disabled aria-describedby="co-pay-note">
                                    Pay with {chosen.short}
                                </button>
                                <p id="co-pay-note" className="alert small">
                                    <strong>Payments open in Phase 3 — the server confirms every payment.</strong> You'll go to Flutterwave's secure page to pay. Prices are checked on our server; your order shows as paid in your account once Flutterwave confirms it.
                                </p>
                            </aside>
                        </div>
                    </>
                )}
            </Section>
        </div>
    );
};

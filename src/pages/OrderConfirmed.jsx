import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useCollection } from "../hooks/useCollection";
import { useShowLink } from "../hooks/useSite";
import { formatUGX } from "../lib/money";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Icon } from "../components/ui/Icon";
import { CheckoutSteps } from "./Checkout";
import { PartFact } from "../components/ui/Todo";
import "./OrderConfirmed.css";

// Where Flutterwave sends the customer back. The status comes only from the order in Firestore,
// written by the flutterwaveWebhook Cloud Function after it re-verifies the payment. This page
// never marks anything paid.
const HEADLINES = {
    paid: ["Thank you — your order is in.", "is paid. We've sent a receipt to your phone and email."],
    shipped: ["Your order is on its way.", "is paid and has left the workshop."],
    pending: ["We're waiting for the payment to clear.", "is waiting for Flutterwave to confirm the payment. This page updates on its own."],
    cancelled: ["This order was cancelled.", "was cancelled. Nothing was charged, or the payment was returned."],
};

/** Order confirmed (/checkout/confirmed): reads the order's status from the database (never marks anything paid itself) and says what happens next. */
export const OrderConfirmed = () => {
    usePageMeta("Order confirmation", "The status of your Formcraft order, read from our records after Flutterwave confirms payment.");
    const [params] = useSearchParams();
    const orderId = params.get("order");
    const { user, loading: authLoading, openSignIn } = useAuth();
    const { clear } = useCart();
    const show = useShowLink();
    // Query matches firestore.rules: customers may only read their own orders
    const { docs, loading, error } = useCollection("orders", (fs, ref) => fs.query(ref, fs.where("uid", "==", user.uid)), [user?.uid], Boolean(user && orderId));
    const order = docs.find((d) => d.id === orderId || d.txRef === orderId) ?? null;
    const status = order?.status ?? null;

    // Empty the cart only once the server says the order is paid
    useEffect(() => {
        if (status === "paid" || status === "shipped") clear();
    }, [status, clear]);

    const [title, line] = HEADLINES[status] ?? ["Checking your order.", "is being checked against our records."];
    const checking = authLoading || (user && orderId && loading);

    return (
        <div className="orderconfirmed">
            <PageHero motif="city" sheet="S202" seed={63} sceneHeight={220} title={orderId ? title : "No order to show."} crumbs={[["/", "Home"], ["/stores", "Stores"], [null, "Order"]]}
                lead={orderId ? null : "This page shows an order after you pay for it. Your orders are all in your account."}>
                {!orderId && <Link to="/account" className="btn btn-primary">Go to your account <Icon name="arrow" size={18} /></Link>}
            </PageHero>

            {orderId && (
                <Section tone="sheet" seed={2}>
                    <CheckoutSteps current={2} />
                    <div className="orderconfirmed-grid">
                        <div className="stack" style={{ "--gap": "18px" }}>
                            {checking ? (
                                <div className="stack" style={{ "--gap": "10px" }} aria-hidden="true">
                                    <div className="skeleton" style={{ height: 28, width: "70%" }} />
                                    <div className="skeleton" style={{ height: 18, width: "50%" }} />
                                </div>
                            ) : !user ? (
                                <div className="alert" role="status">
                                    <p><strong>Sign in to see order #{orderId}.</strong> Order details are private to the account that placed them.</p>
                                    <button type="button" className="btn btn-ink btn-sm" onClick={openSignIn}>Sign in</button>
                                </div>
                            ) : error ? (
                                <p className="alert alert-error" role="alert">We couldn't load this order just now. Check your connection, or open it later from your account.</p>
                            ) : !order ? (
                                <p className="alert" role="status">We can't find order #{orderId} in your account yet. If you've just paid, give it a minute — it appears once Flutterwave confirms the payment.</p>
                            ) : (
                                <p className="lead" role="status">Order <b>#{order.id}</b> {line}</p>
                            )}
                            <p className="fine">This page reads the order status from our records after Flutterwave confirms the payment — it never marks anything paid itself.</p>

                            <h2 className="h3">What happens next</h2>
                            <ul className="checklist">
                                {[
                                    "Made-to-order pieces go to the workshop — usually 2–3 weeks.",
                                    "We call you to agree a delivery day. TODO: delivery areas and prices",
                                    "Plans and other downloads are ready in your account once the payment clears.",
                                ].map((t) => (
                                    <li key={t}><span className="tick"><Icon name="check" size={14} /></span><span className="small"><PartFact text={t} /></span></li>
                                ))}
                            </ul>
                            <div className="row">
                                <Link to={`/account?order=${encodeURIComponent(orderId)}`} className="btn btn-primary">View your orders</Link>
                                <Link to="/stores" className="btn btn-line">Keep shopping</Link>
                            </div>
                        </div>

                        <aside className="card card-pad orderconfirmed-summary" aria-labelledby="oc-summary">
                            <h2 id="oc-summary" className="h3">Order summary</h2>
                            {order?.items?.length ? (
                                <ul className="orderconfirmed-lines">
                                    {order.items.map((it, i) => (
                                        <li key={`${it.productId}-${i}`}>
                                            <span className="stack" style={{ "--gap": "2px" }}>
                                                <strong>{it.title}</strong>
                                                <span className="fine">{[it.color, it.size, `×${it.qty}`].filter(Boolean).join(" · ")}</span>
                                            </span>
                                            <span className="small">{formatUGX(Number.isInteger(it.priceUGX) ? it.priceUGX * it.qty : null)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="small dim">{checking ? "Loading…" : "The items appear here once the order is found."}</p>
                            )}
                            <dl className="orderconfirmed-facts">
                                <div><dt>Status</dt><dd>{status ? <span className={status === "paid" || status === "shipped" ? "tag tag-accent" : "tag"}>{status}</span> : "—"}</dd></div>
                                <div><dt>Delivery</dt><dd>{order?.delivery?.area ? [order.delivery.area, order.delivery.street].filter(Boolean).join(", ") : "Agreed when we call you"}</dd></div>
                                <div><dt>Total</dt><dd><strong>{Number.isInteger(order?.totalUGX) ? formatUGX(order.totalUGX) : "Being confirmed"}</strong></dd></div>
                            </dl>
                        </aside>
                    </div>
                </Section>
            )}

            <Section tone="ground" seed={4} small>
                <ul className="grid-3 orderconfirmed-next">
                    {show("/community") && <li><Link to="/community" className="card card-pad orderconfirmed-card"><strong>Meet the makers</strong><span className="small">See who builds your piece</span></Link></li>}
                    {show("/templates") && <li><Link to="/templates" className="card card-pad orderconfirmed-card"><strong>Building a home?</strong><span className="small">Browse template builds</span></Link></li>}
                    {show("/donate") && <li><Link to="/donate" className="card card-pad orderconfirmed-card"><strong>Give back</strong><span className="small">Plant a tree with your order</span></Link></li>}
                </ul>
            </Section>
        </div>
    );
};

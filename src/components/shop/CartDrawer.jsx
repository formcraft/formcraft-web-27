// CartDrawer: the panel that slides in from the right with the cart's contents.
// Each line shows the product, its options, a − / + quantity control, its price and a remove button;
// below them the subtotal and the checkout button ("coming soon" until payments are switched on).
// Prices shown here are for display only: the real total is always worked out on the server at
// checkout (a project rule: the browser never decides what anyone pays).
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useContent } from "../../hooks/useContent";
import { useShowLink } from "../../hooks/useSite";
import { imgProps } from "../../lib/images";
import { formatUGX } from "../../lib/money";
import { Drawer } from "../ui/Drawer";
import { Icon } from "../ui/Icon";
import { Todo } from "../ui/Todo";
import "./CartDrawer.css";

/** Rendered once by Layout.jsx; opens when useCart().openCart() is called. */
export const CartDrawer = () => {
    const { items, count, update, remove, open, closeCart } = useCart();
    const { items: products } = useContent("products");
    const show = useShowLink();
    const lines = items.map((line) => ({ line, product: products.find((p) => p.id === line.productId) })).filter((l) => l.product);
    const allPriced = lines.every(({ product }) => Number.isInteger(product.priceUGX));
    const subtotal = allPriced ? lines.reduce((sum, { line, product }) => sum + product.priceUGX * line.qty, 0) : null;

    return (
        <Drawer
            open={open}
            onClose={closeCart}
            title={`Your cart${count ? ` (${count})` : ""}`}
            labelledBy="cart-title"
            footer={
                lines.length > 0 && (
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <div className="cart-total">
                            <span>Subtotal</span>
                            <strong>{formatUGX(subtotal)}</strong>
                        </div>
                        {show("/checkout") ? (
                            <Link to="/checkout" className="btn btn-primary btn-block" onClick={closeCart}>
                                Go to checkout
                            </Link>
                        ) : (
                            <button type="button" className="btn btn-primary btn-block" disabled>
                                Checkout · coming soon
                            </button>
                        )}
                        <p className="fine">Pay by MTN or Airtel mobile money or card once checkout opens. <Todo>TODO: delivery areas and price.</Todo></p>
                    </div>
                )
            }
        >
            {lines.length === 0 ? (
                <div className="stack center cart-empty" style={{ "--gap": "14px" }}>
                    <Icon name="cart" size={36} strokeWidth={1.5} />
                    <p className="body">Your cart is empty.</p>
                    <Link to="/stores" className="btn btn-line" onClick={closeCart}>
                        Browse the store
                    </Link>
                </div>
            ) : (
                <ul className="cart-lines">
                    {lines.map(({ line, product }) => {
                        const options = [line.color, line.size].filter(Boolean).join(" · ");
                        return (
                            <li key={`${line.productId}-${line.color}-${line.size}`} className="cart-line">
                                <img {...(imgProps(product.images?.[0], { small: true }) ?? {})} alt="" width="72" height="72" loading="lazy" />
                                <div className="cart-line-info">
                                    <Link to={`/stores/${product.slug}`} onClick={closeCart} className="cart-line-title">
                                        {product.title}
                                    </Link>
                                    {options && <span className="fine">{options}</span>}
                                    <div className="cart-qty" role="group" aria-label={`Quantity of ${product.title}`}>
                                        <button type="button" onClick={() => update(line, -1)} aria-label="One less">
                                            <Icon name="minus" size={16} />
                                        </button>
                                        <span aria-live="polite">{line.qty}</span>
                                        <button type="button" onClick={() => update(line, 1)} aria-label="One more">
                                            <Icon name="plus" size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="cart-line-end">
                                    <span className="small">{Number.isInteger(product.priceUGX) ? formatUGX(product.priceUGX * line.qty) : formatUGX(null)}</span>
                                    <button type="button" className="cart-remove" onClick={() => remove(line)} aria-label={`Remove ${product.title}`}>
                                        <Icon name="trash" size={17} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Drawer>
    );
};

import { useCart } from "../../context/CartContext";
import { Icon } from "../ui/Icon";
import "./CartButton.css";

// Fixed in the header: touch-friendly, no dragging. Opens the cart drawer.
export const CartButton = () => {
    const { count, openCart } = useCart();
    return (
        <button type="button" className="icon-btn cart-button" onClick={openCart} aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}>
            <Icon name="cart" size={19} />
            {count > 0 && (
                <span className="cart-button-badge" aria-hidden="true">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </button>
    );
};

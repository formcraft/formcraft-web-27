import { useCart } from "../../hooks/useCart";
import { Icon } from "../ui/Icon";
import "./CartButton.css";

// CartButton: the cart icon in the header, with a small badge showing how many items are in the cart.
// It opens the cart drawer (CartDrawer). Screen readers hear "Cart, 2 items" or "Cart, empty".
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

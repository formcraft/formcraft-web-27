import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { categoryLabel } from "../../data/products";
import { formatUGX } from "../../lib/money";
import { Icon } from "../ui/Icon";
import "./ProductCard.css";

export const ProductCard = ({ product }) => {
    const { add, openCart } = useCart();
    const quickAdd = () => {
        add(product.id, { qty: 1 });
        openCart();
    };
    return (
        <article className="product-card">
            <Link to={`/stores/${product.slug}`} className="product-card-media" aria-label={product.title}>
                <img
                    src={`/images/${product.images[0]}-800.webp`}
                    alt={product.imageAlt}
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="800"
                />
            </Link>
            <div className="product-card-body">
                <div className="product-card-top">
                    <h3 className="h4">
                        <Link to={`/stores/${product.slug}`}>{product.title}</Link>
                    </h3>
                    <span className="product-card-price">{formatUGX(product.priceUGX)}</span>
                </div>
                <p className="fine">
                    {categoryLabel(product.category)}
                    {product.maker ? ` · made by ${product.maker}` : ""}
                </p>
                <button type="button" className="btn btn-line btn-sm product-card-add" onClick={quickAdd}>
                    <Icon name="plus" size={16} /> Add to cart
                </button>
            </div>
        </article>
    );
};

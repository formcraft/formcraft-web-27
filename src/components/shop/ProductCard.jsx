// ProductCard: one product in the Stores grid: photo, name, price, category and maker, and a quick
// "Add to cart" button (or "Choose options" when the product comes in more than one colour or size,
// so nobody adds it without picking). The photo and the name both link to the product page.
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { categoryLabel } from "../../data/products";
import { imgProps } from "../../lib/images";
import { formatUGX } from "../../lib/money";
import { Icon } from "../ui/Icon";
import { known } from "../../lib/pending";
import "./ProductCard.css";

/** @param {{ product: { id: string, slug: string, title: string, priceUGX: number|null, images?: string[], imageAlt?: string, category?: string, maker?: string, colors?: string[], sizes?: string[] } }} props */
export const ProductCard = ({ product }) => {
    const { add, openCart } = useCart();
    // more than one colour or size: the visitor has to choose on the product page
    const needsChoice = (product.colors?.length ?? 0) > 1 || (product.sizes?.length ?? 0) > 1;
    const quickAdd = () => {
        add(product.id, { qty: 1 });
        openCart();
    };
    return (
        <article className="product-card">
            <Link to={`/stores/${product.slug}`} className="product-card-media" aria-label={product.title}>
                {product.images?.[0] ? (
                <img
                    {...imgProps(product.images[0], { small: true })}
                    sizes="(max-width: 700px) 50vw, 25vw"
                    alt={product.imageAlt || product.title}
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="800"
                />
                ) : (
                    <span className="placeholder">Photo coming soon</span>
                )}
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
                    {known(product.maker) ? ` · made by ${product.maker}` : ""}
                </p>
                {needsChoice ? (
                    <Link to={`/stores/${product.slug}`} className="btn btn-line btn-sm product-card-add">
                        Choose options
                    </Link>
                ) : (
                    <button type="button" className="btn btn-line btn-sm product-card-add" onClick={quickAdd}>
                        <Icon name="plus" size={16} /> Add to cart
                    </button>
                )}
            </div>
        </article>
    );
};

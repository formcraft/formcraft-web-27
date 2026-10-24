import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { ProductCard } from "../components/shop/ProductCard";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { CATEGORIES } from "../data/products";
import { useContent } from "../hooks/useContent";
import { Todo, PartFact } from "../components/ui/Todo";
import "./Stores.css";

// Hero → collection → community → made to order (the shop's existing order, rebuilt)
export const Stores = () => {
    usePageMeta("Stores", "Furniture, joinery and everyday goods made in the Formcraft workshop in Kampala. Pay by mobile money or card.");
    const [category, setCategory] = useState("all");
    const { items: products, loading } = useContent("products");
    const shown = products.filter((p) => category === "all" || p.category === category);

    return (
        <div className="stores" data-division="stores">
            <PageHero motif="workshop" sceneHeight={360} brand="stores" title="Made in our Kampala workshop." sheet="S101" seed={91} crumbs={[["/", "Home"], [null, "Stores"]]}
                lead="Furniture, joinery and everyday goods, built by the same hands that fit out our buildings. Pay by mobile money or card.">
                <a href="#collection" className="btn btn-primary">Shop the collection <Icon name="arrow" size={18} /></a>
                <a href="#custom" className="btn btn-line">Order something custom</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="collection">
                <SectionHead eyebrow="The collection" title="Every piece has a maker.">
                    <div className="row" role="group" aria-label="Filter by category" style={{ "--gap": "8px" }}>
                        {CATEGORIES.map((c) => (
                            <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                </SectionHead>
                <div className="stores-grid" aria-busy={loading}>
                    {loading && [0, 1, 2, 3].map((k) => <div key={k} className="skeleton" style={{ aspectRatio: "3 / 4" }} />)}
                    {shown.map((p, i) => (
                        <Reveal key={p.id} delay={(i % 4) * 0.05}>
                            <ProductCard product={p} />
                        </Reveal>
                    ))}
                    {category === "all" && (
                        <>
                            <Reveal>
                                <Link to="/construction#templates" className="card card-pad paper-orange stores-tile">
                                    <span className="fine">Building a home?</span>
                                    <strong className="h3">Ready-to-build home designs for 50 × 100 ft plots</strong>
                                    <span className="link">Home designs <Icon name="arrow" size={16} /></span>
                                </Link>
                            </Reveal>
                            <Reveal>
                                <a href="#custom" className="card card-pad paper-dark stores-tile">
                                    <span className="fine">Custom joinery · quote</span>
                                    <strong className="h3">Kitchens, wardrobes, panelling, doors</strong>
                                    <span className="link">Start a custom order <Icon name="arrow" size={16} /></span>
                                </a>
                            </Reveal>
                        </>
                    )}
                </div>
            </Section>

            <Section tone="dark" seed={4} id="community">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">The Formcraft community</p>
                        <h2 className="h2">Formcraft sets the market for the work — you focus on the craft.</h2>
                        <p className="body">Independent carpenters, welders and sculptors make with us. What you buy here pays them directly — and keeps their trade in Kampala.</p>
                        <div className="row">
                            <Link to="/community" className="btn btn-primary">Join as an artisan</Link>
                            <a href="#custom" className="btn btn-line">Commission a maker</a>
                        </div>
                    </Reveal>
                    <ol className="steps stores-why">
                        {[["Fair pricing", "We agree the price of the work up front, so makers are paid properly for their time and skill."], ["Machinery and workshop", "Access to the tools and space that are hard to afford alone."], ["A steady market", "Orders from Stores customers and fit-outs on Formcraft building projects."]].map(([t, d], i) => (
                            <Reveal as="li" key={t} delay={i * 0.07} className="card step">
                                <h3 className="h4">{t}</h3>
                                <p className="small">{d}</p>
                            </Reveal>
                        ))}
                    </ol>
                </div>
                <Todo as="p">TODO: "Meet the makers": real profiles, with each maker's consent.</Todo>
            </Section>

            <Section tone="ground" seed={6} id="custom">
                <SectionHead eyebrow="Made to order" title="We take a deposit, source the timber, and build it in front of you.">
                    Two to three weeks, start to finish, at an honest price agreed before we start.
                </SectionHead>
                <ol className="steps">
                    {["Tell us what you need, with a photo or sketch", "Agree the design and price, pay a deposit", "We build it — visit the workshop any time", "Delivered and fitted. TODO: delivery areas and pricing"].map((t, i) => (
                        <Reveal as="li" key={t} delay={i * 0.06} className="card step">
                            <p className="body"><PartFact text={t} /></p>
                        </Reveal>
                    ))}
                </ol>
                <Link to="/contact" className="btn btn-primary stores-custom-cta">Start a custom order <Icon name="arrow" size={18} /></Link>
            </Section>
        </div>
    );
};

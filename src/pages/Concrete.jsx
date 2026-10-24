import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { QuoteForm } from "../components/forms/QuoteForm";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import "./Concrete.css";

const PRODUCTS = [
    ["Precast columns", "Structural columns cast in the yard and delivered ready to set."],
    ["Precast beams", "Structural beams for faster frames and fewer site shutters."],
    ["Lintels", "Standard and custom lintels for block and brick openings."],
    ["Concrete pavers", "Paving for driveways, courtyards and estates."],
    ["Architectural facing bricks", "Facing bricks with a finished face."],
    ["Facade panels", "Custom precast panels for building fronts."],
];

const SUPPLY_TYPES = [
    ["b2b-columns", "Precast columns"],
    ["b2b-beams", "Precast beams"],
    ["b2b-lintels", "Lintels"],
    ["b2b-pavers", "Concrete pavers"],
    ["b2b-bricks", "Facing bricks"],
    ["b2b-panels", "Facade panels"],
    ["b2b-green", "Green concrete"],
    ["b2b-mixed", "Several products (list them below)"],
];

// Simple paper drawings of each precast element (no product photos in the repo yet)
const Sketch = ({ i }) => {
    const shapes = [
        <><rect x="70" y="16" width="36" height="128" /><rect x="62" y="136" width="52" height="10" /></>,
        <><rect x="18" y="60" width="140" height="30" /><rect x="18" y="90" width="140" height="10" /></>,
        <><rect x="20" y="70" width="136" height="22" /><path d="M40 70V40h96v30" fill="none" /></>,
        <>{[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={22 + c * 34 + (r % 2) * 16} y={40 + r * 28} width="30" height="24" />))}</>,
        <>{[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={24 + c * 44 + (r % 2) * 22} y={34 + r * 24} width="40" height="20" />))}</>,
        <><rect x="34" y="20" width="108" height="124" /><rect x="52" y="40" width="30" height="40" /><rect x="94" y="40" width="30" height="40" /></>,
    ];
    return (
        <svg viewBox="0 0 176 160" className="concrete-sketch" aria-hidden="true">
            <g>{shapes[i]}</g>
        </svg>
    );
};

export const Concrete = () => {
    usePageMeta("Concrete", "Formcraft Concrete: precast columns, beams, lintels, pavers, facing bricks, facade panels and lower-carbon mixes, supplied to contractors and developers.");
    return (
        <div className="concrete" data-division="concrete">
            <PageHero motif="precast" sceneHeight={360} brand="concrete" title="Precast that arrives ready to build." sheet="A103" seed={52} crumbs={[["/", "Home"], [null, "Concrete"]]}
                lead="Structural and precast concrete elements engineered for durability, aesthetic warmth and rapid site assembly. Led by co-founder Peter Isingoma.">
                <a href="#supply" className="btn btn-primary">Ask for a supply quote <Icon name="arrow" size={18} /></a>
                <a href="#products" className="btn btn-line">See products</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="products">
                <SectionHead eyebrow="Precast & in-situ products" title="Made in the yard, not on your site.">
                    Casting elements off site means faster frames, cleaner sites and a finish you can see before it arrives.
                </SectionHead>
                <div className="grid-3">
                    {PRODUCTS.map(([title, text], i) => (
                        <Reveal key={title} delay={(i % 3) * 0.06} className="card concrete-product">
                            <Sketch i={i} />
                            <div className="card-pad stack" style={{ "--gap": "8px" }}>
                                <h3 className="h4">{title}</h3>
                                <p className="small">{text}</p>
                                <p className="fine todo">TODO: sizes, strength class, price per unit</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </Section>

            <Section tone="dark" seed={4} small id="green">
                <div className="between" style={{ alignItems: "center" }}>
                    <div className="stack mw" style={{ "--gap": "14px", "--mw": "640px" }}>
                        <p className="eyebrow">Green concrete & paving</p>
                        <h2 className="h2">Lower-carbon mixes from local aggregates.</h2>
                        <p className="body">Formulations that reduce the carbon footprint of concrete and use locally sourced raw aggregates.</p>
                    </div>
                    <p className="fine todo">TODO: mix names, carbon figures and test certificates</p>
                </div>
            </Section>

            <Section tone="ground" seed={6} id="supply">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">B2B contractor supply</p>
                        <h2 className="h2">Supply contracts for contractors and developers.</h2>
                        <p className="body">Direct supply for civil engineering firms, estate developers and commercial contractors. List what you need and we'll come back with prices and lead times.</p>
                        <ul className="checklist">
                            <li><span className="tick"><Icon name="check" size={14} /></span>Prices worked out by our team for each order</li>
                            <li><span className="tick"><Icon name="check" size={14} /></span>Delivery to site in Kampala and beyond — <span className="todo">TODO: areas</span></li>
                            <li><span className="tick"><Icon name="check" size={14} /></span>Drawings and BIM families on request</li>
                        </ul>
                    </Reveal>
                    <QuoteForm types={SUPPLY_TYPES} defaultType="b2b-columns" heading="What do you need?" intro="Products, quantities (pieces, m², m³ or linear m) and when you need them." idPrefix="supply" />
                </div>
            </Section>
        </div>
    );
};

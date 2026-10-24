// Templates page (/templates). Template builds, the home library: ready-to-build designs for 50 × 100 ft plots
// (filter by type and bedrooms), what comes with every design, numbered releases, the free catalogue by
// email, and how young architects can design for the library. Sample listings are for the team only;
// visitors see an honest "first designs are being prepared" note until real designs are added.
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContent, useContentItem } from "../hooks/useContent";
import { useShowLink } from "../hooks/useSite";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { imgName } from "../lib/images";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { SubscribeForm } from "../components/forms/SubscribeForm";
import { formatUGX } from "../lib/money";
import { TEMPLATE_KINDS, templateKind, templateKindName, templateSpec, templateArea, isSample } from "../data/templates";
import { Todo, Fact, PartFact } from "../components/ui/Todo";
import { useSeesTodos } from "../hooks/useSeesTodos";
import { isPending } from "../lib/pending";
import "./Templates.css";

const BEDROOMS = [
    ["any", "Any"],
    ["1", "1"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4+"],
];

const INCLUDED = [
    ["Architectural drawings", "Floor plans, elevations, sections, roof plan"],
    ["Structural drawings", "Foundations, columns, slabs and roof structure"],
    ["Electrical & plumbing", "Lighting, power, water supply and drainage layouts"],
    ["Bill of quantities", "Quantities from the model, ready to price"],
    ["Renders & walkthrough", "From the real model — what you see is what gets built"],
    ["Licence", "TODO: how many builds one purchase covers"],
];

const BUY_WAYS = [
    {
        title: "Plans only",
        text: "The full drawing set to build with your own contractor. Delivered as a private download in your account after payment. Site adaptation is extra.",
        note: "Online payment isn't open yet (Phase 3).",
    },
    {
        title: "Plans + Formcraft build",
        text: "We adapt the design to your plot — site survey, soil test, foundations checked against the results, council submission — then build it, modelled zone by zone before work starts.",
        note: "Starts with a site visit.",
    },
];

const RELEASES = [
    { label: "Release 2026.1", title: "The first designs", text: "TODO: designs in the first release" },
    { label: "Release 2026.2", title: "Next release", text: "TODO: date and theme" },
    { label: "v1.0 → v1.1", title: "How versions work", text: "A better layout, a new rule or a better material means a new version. TODO: whether earlier buyers get the update." },
];

const DESIGNER_STEPS = [
    ["Send your concept", "Plans, sketches or a model for a home on a 50 × 100 ft plot."],
    ["We review and select", "Formcraft Studio checks it can be built well and sold at a fair price."],
    ["We develop it together", "Modelled to our standard, engineered, costed — you learn our BIM workflow along the way."],
    ["It's released with your name on it", "You're paid when the plans sell and when we build it."],
];

const TERMS = [
    ["Royalty on each set of plans sold", "TODO %"],
    ["Share when Formcraft builds your design", "TODO %"],
    ["Who owns the design", "TODO"],
    ["When and how you're paid", "TODO"],
    ["Who can apply", "TODO"],
];

const matchesBeds = (t, beds) => beds === "any" || (beds === "4" ? (t.bedrooms ?? 0) >= 4 : t.bedrooms === Number(beds));

const TemplateCard = ({ t }) => {
    const img = t.images?.[0];
    return (
        <article className="card templates-card">
            <Photo name={imgName(img)} alt={img?.alt || `${t.title}: render and floor plan`} ratio="16 / 10" />
            <div className="templates-card-body">
                <div className="between templates-card-top">
                    <span className="row" style={{ "--gap": "6px" }}>
                        {isSample(t) && <span className="tag">Sample</span>}
                        {t.hidden && <span className="tag">Hidden</span>}
                        <span className="tag tag-div">{templateKindName(t)}</span>
                    </span>
                    {t.release && !isPending(t.release) && <span className="fine">Release {t.release}</span>}
                </div>
                <h3 className="h4">
                    <Link to={`/templates/${t.slug}`} className="templates-card-link">{t.title}</Link>
                </h3>
                <p className="small">{[templateSpec(t), `fits a ${t.plot || "50 × 100 ft"} plot`, templateArea(t)].filter(Boolean).join(" · ")}</p>
                <p className="fine">
                    {t.architect && !isPending(t.architect) ? `Designed by ${t.architect} with Formcraft Studio` : "From the Formcraft Studio home library"}
                </p>
                <dl className="templates-card-prices">
                    <div><dt className="fine">Plans</dt><dd className="h4">{formatUGX(t.plansPriceUGX)}</dd></div>
                    <div><dt className="fine">Build from</dt><dd className="h4">{formatUGX(t.buildFromUGX)}</dd></div>
                </dl>
                <div className="row" style={{ "--gap": "10px" }}>
                    <Link to={`/templates/${t.slug}`} className="btn btn-ink btn-sm">See the design</Link>
                    <Link to={`/templates/${t.slug}#build`} className="btn btn-line btn-sm">Build it with us</Link>
                </div>
            </div>
        </article>
    );
};

/** The Templates page. Rendered by src/routes.jsx for /templates. */
export const Templates = () => {
    usePageMeta("Template builds", "Ready-to-build, permit-ready home designs for 50 × 100 ft plots. Buy the plans, or have Formcraft adapt the design to your plot and build it.");
    const show = useShowLink();
    const { items: all, loading } = useContent("templates");
    const seesTodos = useSeesTodos(); // the team also sees sample listings and rows that are still "TODO"
    // Visitors see real designs only; the sample listings are for the team until the first release.
    const items = seesTodos ? all : all.filter((t) => !isSample(t));
    const [kind, setKind] = useState("all");
    const [beds, setBeds] = useState("any");
    const shown = items.filter((t) => (kind === "all" || templateKind(t) === kind) && matchesBeds(t, beds));
    const samples = items.some(isSample);
    const { item: catalogue } = useContentItem("downloads", "template-catalogue");
    const catalogueText = catalogue?.description ?? "";

    return (
        <div className="templates" data-division="construction">
            <PageHero motif="plots" sceneHeight={360} eyebrow="Template builds" title="Choose your home. We'll build it." sheet="A104" seed={51}
                crumbs={[["/", "Home"], [null, "Template builds"]]}
                lead="Ready-to-build home designs for 50 × 100 ft plots, from Formcraft's home library. We fit the design to your plot, take it through approvals and build it — modelled zone by zone before work starts.">
                <a href="#library" className="btn btn-primary">Browse the designs <Icon name="arrow" size={18} /></a>
                <a href="#designers" className="btn btn-line">Design one with us</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="library">
                <SectionHead eyebrow="The home library" title="Pick a home. We'll fit it to your plot and build it.">
                    Complete, permit-ready designs for 50 × 100 ft plots. Buy the plans on their own, or buy them with a build — either way you know the design, the drawings and the likely cost before you commit.
                </SectionHead>

                <div className="templates-filters">
                    <div className="row" role="group" aria-label="Type of home" style={{ "--gap": "8px" }}>
                        {TEMPLATE_KINDS.map((k) => (
                            <button key={k.id} type="button" className="chip" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>
                        ))}
                    </div>
                    <div className="row" role="group" aria-label="Bedrooms" style={{ "--gap": "8px" }}>
                        <span className="fine templates-filter-label" aria-hidden="true">Bedrooms</span>
                        {BEDROOMS.map(([id, label]) => (
                            <button key={id} type="button" className="chip" aria-pressed={beds === id} onClick={() => setBeds(id)}
                                aria-label={id === "any" ? "Any number of bedrooms" : `${label} bedrooms`}>{label}</button>
                        ))}
                    </div>
                    <p className="fine" aria-live="polite">
                        {shown.length} design{shown.length === 1 ? "" : "s"}{samples && seesTodos ? " · sample listings until the first designs are released" : ""}
                    </p>
                </div>

                {loading ? (
                    <div className="templates-grid" aria-busy="true">
                        {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="templates-empty stack" style={{ "--gap": "14px" }}>
                        <h3 className="h4">The first designs are being prepared.</h3>
                        <p className="body">They'll be released here as a numbered release. Get the catalogue by email when it's ready, below.</p>
                        <a href="#catalogue" className="btn btn-line btn-sm" style={{ alignSelf: "flex-start" }}>Get the catalogue</a>
                    </div>
                ) : shown.length === 0 ? (
                    <div className="templates-empty stack" style={{ "--gap": "14px" }}>
                        <p className="body">No designs match those filters yet.</p>
                        <button type="button" className="btn btn-line btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => { setKind("all"); setBeds("any"); }}>Show all designs</button>
                    </div>
                ) : (
                    <div className="templates-grid">
                        {shown.map((t, i) => (
                            <Reveal key={t.slug} delay={(i % 3) * 0.06}>
                                <TemplateCard t={t} />
                            </Reveal>
                        ))}
                    </div>
                )}
            </Section>

            <Section tone="ground" seed={4} id="included">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">What you get with every design</p>
                        <h2 className="h2">The same drawing set we'd build from.</h2>
                        <p className="body">Each design is modelled to the Formcraft standard by Formcraft Studio, so the drawings, quantities and renders all come from one model and agree with each other.</p>
                        <div className="card card-pad stack" style={{ "--gap": "8px" }}>
                            <h3 className="h4">Every plot is different</h3>
                            <p className="small">Before you build, we adapt the design to your plot: site survey, soil test, foundations checked against the results, and the council submission. <Todo>TODO: price for adapting a library design.</Todo></p>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <ul className="checklist">
                            {INCLUDED.filter(([, b]) => seesTodos || !isPending(b)).map(([a, b]) => (
                                <li key={a}>
                                    <span className="tick"><Icon name="check" size={14} /></span>
                                    <span className="stack" style={{ "--gap": "2px" }}>
                                        <strong>{a}</strong>
                                        <Fact as="span" className="small" text={b} />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                </div>

                <div className="templates-buy">
                    <h3 className="h3">Two ways to buy.</h3>
                    <div className="grid-2 templates-buy-grid">
                        {BUY_WAYS.map((w, i) => (
                            <Reveal key={w.title} delay={i * 0.08} className="card card-pad stack" style={{ "--gap": "10px" }}>
                                <span className="card-strip" aria-hidden="true" />
                                <h4 className="h4">{w.title}</h4>
                                <p className="small">{w.text}</p>
                                <p className="fine">{w.note}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </Section>

            <Section tone="sheet" seed={6} id="releases">
                <SectionHead eyebrow="A library that keeps up" title="New designs in releases. Every design versioned.">
                    We add designs in numbered releases as tastes, materials and building rules change. When we improve a design, it gets a new version number and a note of what changed, so you always know which one you're buying.
                </SectionHead>
                <ul className="grid-3 templates-releases">
                    {RELEASES.map((r, i) => (
                        <Reveal as="li" key={r.label} delay={i * 0.06} className="card card-pad stack" style={{ "--gap": "8px" }}>
                            <span className="tag">{r.label}</span>
                            <h3 className="h4">{r.title}</h3>
                            <p className="small"><PartFact text={r.text} /></p>
                        </Reveal>
                    ))}
                </ul>
            </Section>

            <Section tone="ground" seed={7} id="catalogue">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Free download</p>
                        <h2 className="h2">{catalogue?.title || "Template home catalogue"}.</h2>
                        <p className="body">The designs in the home library in one file, to keep, print and share with your family before you decide.</p>
                        <Fact as="p" className="small" text={catalogueText} />
                    </Reveal>
                    <SubscribeForm variant="card" heading="Send me the catalogue" download="template-catalogue" defaultInterests={["Template homes"]} button="Send me the catalogue" />
                </div>
            </Section>

            <Section tone="dark" seed={8} id="designers">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">For young architects</p>
                        <h2 className="h2">Design a home for the library. Earn every time it sells.</h2>
                        <p className="body">Show what you can design. If your home is selected, we develop it with you to the Formcraft standard and publish it under your name. You earn a royalty on every set of plans sold — and a share when Formcraft builds it.</p>
                        <ol className="steps templates-designer-steps">
                            {DESIGNER_STEPS.map(([title, text]) => (
                                <li key={title} className="step">
                                    <h3 className="h4">{title}</h3>
                                    <p className="small">{text}</p>
                                </li>
                            ))}
                        </ol>
                    </Reveal>
                    <Reveal delay={0.1} className="stack" style={{ "--gap": "18px" }}>
                        {/* The terms are all still to be decided: visitors don't see an empty table */}
                        {(seesTodos || TERMS.some(([, v]) => !isPending(v))) && (
                        <div className="card card-pad">
                            <h3 className="h4">The terms</h3>
                            <dl className="templates-terms">
                                {TERMS.map(([k, v]) => (
                                    <div key={k}>
                                        <dt className="small">{k}</dt>
                                        <dd><Fact text={v} /></dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                        )}
                        <div className="row">
                            <Link to="/contact" className="btn btn-primary">Send us your concept <Icon name="arrow" size={18} /></Link>
                            {show("/academy") && <Link to="/academy" className="btn btn-line">See the Academy</Link>}
                        </div>
                        <p className="fine">Send plans, sketches or a portfolio link through the contact form. <Todo>TODO: how often submissions are reviewed.</Todo></p>
                    </Reveal>
                </div>
            </Section>

            <Section tone="orange" seed={10} small id="start">
                <div className="between" style={{ alignItems: "center" }}>
                    <div className="stack" style={{ "--gap": "10px" }}>
                        <h2 className="h2">Found one you like?</h2>
                        <p className="body">Tell us about your plot. We'll call you to book a site visit and talk through the design you picked.</p>
                    </div>
                    <div className="row">
                        {show("/construction") ? (
                            <Link to="/construction#start" className="btn btn-ink">Start a build <Icon name="arrow" size={18} /></Link>
                        ) : (
                            <Link to="/contact" className="btn btn-ink">Talk to us <Icon name="arrow" size={18} /></Link>
                        )}
                        {show("/studio") && <Link to="/studio#fees" className="btn btn-line">How we charge</Link>}
                    </div>
                </div>
            </Section>
        </div>
    );
};

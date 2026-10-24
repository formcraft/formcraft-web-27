import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContentItem } from "../hooks/useContent";
import { useShowLink } from "../hooks/useSite";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { imgName } from "../lib/images";
import { QuoteForm } from "../components/forms/QuoteForm";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { formatUGX } from "../lib/money";
import { track } from "../lib/analytics";
import { templateKindName, templateSpec, isSample } from "../data/templates";
import "./TemplateDesign.css";

// Placeholder views until a design has its renders and plans uploaded in Admin
const VIEWS = ["Render", "Ground floor", "Elevations", "Walkthrough"];

const DRAWING_SET = [
    ["Architectural plans, elevations, sections", "PDF"],
    ["Structural drawings", "PDF"],
    ["Electrical & plumbing layouts", "PDF"],
    ["Bill of quantities", "XLSX"],
    ["Renders & walkthrough", "JPG · MP4"],
];

const BUILD_TYPES = [
    ["template-build", "Build this design"],
    ["template-adapt", "Adapt it to my plot"],
];

const n = (v) => (v ?? v === 0 ? v : "[n]");

export const TemplateDesign = () => {
    const { slug } = useParams();
    const { hash } = useLocation();
    const show = useShowLink();
    const { item: t, loading, items } = useContentItem("templates", slug);
    const viewed = t?.slug;
    useEffect(() => {
        if (viewed) track("select_content", { content_type: "template", item_id: viewed });
    }, [viewed]);
    const [view, setView] = useState(0);
    const [option, setOption] = useState("build");
    usePageMeta(t ? `${t.title} · Template builds` : loading ? "Template builds" : "Design not found", t?.summary, { noindex: (!t && !loading) || (t && isSample(t)) });

    // Deep links like /templates/x#build: scroll once the design has loaded
    useEffect(() => {
        if (!t || !hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    }, [t, hash]);

    if (!t && loading) {
        return (
            <div className="wrap template-design-loading" aria-busy="true">
                <div className="skeleton" style={{ height: 14, width: 180 }} />
                <div className="skeleton" style={{ height: 64, width: "70%" }} />
                <div className="skeleton" style={{ height: 360 }} />
            </div>
        );
    }

    if (!t) {
        return (
            <PageHero eyebrow="Template builds" title="We can't find that design." sheet="A105" seed={53} motif="plots"
                crumbs={[["/templates", "Template builds"], [null, "Not found"]]}
                lead="It may have been renamed or taken out of the library. Browse the designs that are there now.">
                <Link to="/templates" className="btn btn-primary"><Icon name="arrowLeft" size={18} /> All designs</Link>
            </PageHero>
        );
    }

    const gallery = t.images?.length
        ? t.images.map((img, i) => ({ label: img?.alt || `Image ${i + 1}`, name: imgName(img), alt: img?.alt || `${t.title}, image ${i + 1}` }))
        : VIEWS.map((label) => ({ label, name: null, alt: `[${label}]` }));
    const current = gallery[Math.min(view, gallery.length - 1)];
    const others = items.filter((x) => x.slug !== t.slug).slice(0, 3);
    const specs = [
        ["Bedrooms", n(t.bedrooms)],
        ["Bathrooms", n(t.bathrooms)],
        ["Floors", n(t.floors)],
        ["Floor area", `${n(t.areaM2)} m²`],
        ["Plot", t.plot || "50 × 100 ft"],
    ];
    const summaryTodo = t.summary?.includes("TODO");

    return (
        <div className="template-design" data-division="construction">
            <section className="wrap template-design-head">
                <nav className="crumbs" aria-label="Breadcrumb">
                    <Link to="/templates">Template builds</Link> <span aria-hidden="true">/</span> <span aria-current="page">{t.title}</span>
                </nav>
                <div className="template-design-top">
                    <div className="stack template-design-gallery" style={{ "--gap": "12px" }}>
                        <Photo name={current.name} alt={current.alt} caption={current.label} note={`Release ${t.release || "[release]"}`} ratio="4 / 3" eager sizes="(max-width: 900px) 100vw, 60vw" />
                        <div className="row" role="group" aria-label="Choose a view" style={{ "--gap": "8px" }}>
                            {gallery.map((g, i) => (
                                <button key={`${g.label}-${i}`} type="button" className="chip" aria-pressed={i === view} onClick={() => setView(i)}>{g.label}</button>
                            ))}
                        </div>
                    </div>

                    <div className="stack template-design-info" style={{ "--gap": "18px" }}>
                        <div className="row" style={{ "--gap": "6px" }}>
                            {isSample(t) && <span className="tag">Sample listing</span>}
                            {t.hidden && <span className="tag">Hidden</span>}
                            <span className="tag tag-div">{templateKindName(t)}</span>
                            <span className="fine">Release {t.release || "[release]"}</span>
                        </div>
                        <h1 className="h1-s">{t.title}</h1>
                        <p className="small">{templateSpec(t)}</p>
                        {t.summary && (
                            <p className="lead">
                                {summaryTodo ? t.summary.split("TODO")[0] : t.summary}
                                {summaryTodo && <span className="todo">TODO{t.summary.split("TODO")[1]}</span>}
                            </p>
                        )}
                        <dl className="kpis template-design-specs">
                            {specs.map(([k, v]) => (
                                <div key={k}>
                                    <dt className="fine">{k}</dt>
                                    <dd className="h4">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="fine">
                            Designed by {t.architect || "[architect's name]"} with Formcraft Studio
                            {show("/templates") && <> · <Link to="/templates#designers" className="link">Design for the library</Link></>}
                        </p>
                    </div>
                </div>
            </section>

            <Section tone="sheet" seed={2} id="buy">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "16px" }}>
                        <h2 className="h2">Choose how to buy</h2>
                        <fieldset className="template-design-options">
                            <legend className="fine">How would you like this design?</legend>
                            <label className="option">
                                <input type="radio" name="buy" value="plans" checked={option === "plans"} onChange={() => setOption("plans")} />
                                <span className="between template-design-option-head"><strong className="h4">Plans only</strong><span className="h4">{formatUGX(t.plansPriceUGX)}</span></span>
                                <span className="small">The full drawing set to build with your own contractor. Site adaptation is extra.</span>
                            </label>
                            <label className="option">
                                <input type="radio" name="buy" value="build" checked={option === "build"} onChange={() => setOption("build")} />
                                <span className="between template-design-option-head"><strong className="h4">Plans + Formcraft build</strong><span className="h4">from {Number.isInteger(t.buildFromUGX) ? formatUGX(t.buildFromUGX) : "UGX [estimate]"}</span></span>
                                <span className="small">We adapt the design to your plot, take it through approvals and build it.</span>
                            </label>
                        </fieldset>
                        {option === "plans" ? (
                            <div className="stack" style={{ "--gap": "10px" }}>
                                <button type="button" className="btn btn-primary" disabled aria-describedby="plans-note" style={{ alignSelf: "flex-start" }}>Buy the plans</button>
                                <p id="plans-note" className="fine">
                                    Online payment isn't open yet — it opens in Phase 3 (mobile money and card through Flutterwave). Until then, <Link to="/contact" className="link">ask us for the plans</Link>.
                                </p>
                            </div>
                        ) : (
                            <a href="#build" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Book a site visit <Icon name="arrow" size={18} /></a>
                        )}
                        <p className="fine">Plans are delivered as a private download in your account after payment. <span className="todo">TODO: licence — how many builds one purchase covers.</span></p>
                    </Reveal>

                    <Reveal delay={0.1} className="stack" style={{ "--gap": "28px" }}>
                        <div className="stack" style={{ "--gap": "10px" }}>
                            <h2 className="h3">In the drawing set</h2>
                            <ul className="checklist">
                                {DRAWING_SET.map(([a, b]) => (
                                    <li key={a}>
                                        <span className="tick"><Icon name="check" size={14} /></span>
                                        <span className="between template-design-file"><span>{a}</span><span className="fine">{b}</span></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="stack" style={{ "--gap": "10px" }}>
                            <h2 className="h3">Version history</h2>
                            <p className="small">v1.0 · first release <span className="fine">· Release {t.release || "[release]"}</span></p>
                        </div>
                    </Reveal>
                </div>
            </Section>

            <Section tone="ground" seed={4} id="build">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Build this home</p>
                        <h2 className="h2">Tell us about your plot.</h2>
                        <p className="body">We'll call you to book a site visit and talk through this design: the survey, the soil test, fitting the foundations to your ground, and the council submission.</p>
                        <p className="small">Prefer to talk? <a href="tel:+256753929921" className="link">+256 753 929 921</a></p>
                        <p className="fine">Mention “{t.title}” ({templateSpec(t)}) in your message so we know which design you picked.</p>
                    </Reveal>
                    <QuoteForm types={BUILD_TYPES} defaultType="template-build" heading="Build this design" idPrefix="template" />
                </div>
            </Section>

            {others.length > 0 && (
                <Section tone="sheet" seed={6} id="more">
                    <div className="between template-design-more-head">
                        <h2 className="h2">More from the library</h2>
                        <Link to="/templates" className="link">See all designs <Icon name="arrow" size={16} /></Link>
                    </div>
                    <ul className="grid-3 template-design-more">
                        {others.map((o, i) => (
                            <Reveal as="li" key={o.slug} delay={i * 0.06}>
                                <Link to={`/templates/${o.slug}`} className="card template-design-more-card">
                                    <Photo name={imgName(o.images?.[0])} alt={o.images?.[0]?.alt || "[Render]"} ratio="16 / 10" />
                                    <span className="stack" style={{ "--gap": "4px", padding: "16px 18px 20px" }}>
                                        <strong className="h4">{o.title}</strong>
                                        <span className="small">{n(o.bedrooms)} bed · {templateKindName(o).toLowerCase()}</span>
                                    </span>
                                </Link>
                            </Reveal>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

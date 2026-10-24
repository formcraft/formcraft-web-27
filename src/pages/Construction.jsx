// Construction page (/construction). Formcraft Construction: how we build (site process and services), template
// builds (a card leading to the home library), the offer for young architects, and the "start a build" form.
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { QuoteForm } from "../components/forms/QuoteForm";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { Fact, Todo } from "../components/ui/Todo";
import { useSeesTodos } from "../hooks/useSeesTodos";
import { isPending } from "../lib/pending";
import "./Construction.css";

const BUILD_STEPS = [
    { title: "Each zone modelled to G4", text: "Construction detail — finishes split by trade, openings, sleeves — before work starts in that zone." },
    { title: "Zone walk-through", text: "Site engineer, foremen, modellers and QS walk the zone's model together and confirm the materials list." },
    { title: "Quantities and cost from the model", text: "Bills of quantities and orders come straight from the model, checked by our QS." },
    { title: "The model on site", text: "On tablets, with weekly site meetings and a three-week look-ahead. A site logistics model plans access, cranes and storage." },
    { title: "Handover", text: "An as-built model checked on site, with drawings, manuals and warranties — a digital handover of your building." },
];

const INCLUDED = [
    ["Architectural drawings", "Floor plans, elevations, sections, roof plan"],
    ["Structural drawings", "Foundations, columns, slabs and roof structure"],
    ["Electrical & plumbing", "Lighting, power, water supply and drainage layouts"],
    ["Bill of quantities", "Quantities from the model, ready to price"],
    ["Renders & walkthrough", "From the real model — what you see is what gets built"],
    ["Licence", "TODO: how many builds one purchase covers"],
];

const BUILD_TYPES = [
    ["construction-library", "A home from the Formcraft library"],
    ["construction-own", "A home from my own drawings"],
    ["construction-commercial", "Commercial building"],
    ["construction-unsure", "Not sure yet"],
];

/** The Construction page. Rendered by src/routes.jsx for /construction. */
export const Construction = () => {
    const seesTodos = useSeesTodos(); // the team also sees rows that are still "TODO"
    usePageMeta("Construction", "Formcraft builds from a construction-ready model, zone by zone, and offers ready-to-build home designs for 50 × 100 ft plots.");
    return (
        <div className="construction" data-division="construction">
            <PageHero motif="construction" sceneHeight={380} brand="construction" title="Built in the model first, then on site." sheet="A102" seed={41} crumbs={[["/", "Home"], [null, "Construction"]]}
                lead="Every clash, quantity and setting-out problem we find in the model is one we don't find on your site. Bring your own drawings, pick a home from our library, or start from nothing — we'll tell you what it takes.">
                <a href="#start" className="btn btn-primary">Start a build <Icon name="arrow" size={18} /></a>
                <a href="#templates" className="btn btn-line">Template builds</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="how">
                <SectionHead eyebrow="How we build" title="Five steps from model to handover." />
                <ol className="steps construction-steps">
                    {BUILD_STEPS.map((s, i) => (
                        <Reveal as="li" key={s.title} delay={i * 0.06} className="card step">
                            <h3 className="h4">{s.title}</h3>
                            <p className="small">{s.text}</p>
                        </Reveal>
                    ))}
                </ol>
                <ul className="row construction-services" style={{ "--gap": "8px" }}>
                    {["Site supervision", "Quality control", "Contractor valuations", "Milestone sign-offs"].map((s) => <li key={s} className="tag tag-div">{s}</li>)}
                    <Todo as="li">TODO: site safety approach</Todo>
                </ul>
            </Section>

            <Section tone="ground" seed={4} id="templates">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">Template builds</p>
                        <h2 className="h2">Choose your home. We'll build it.</h2>
                        <p className="body">Ready-to-build home designs for 50 × 100 ft plots, from Formcraft's home library. We fit the design to your plot, take it through approvals and build it — modelled zone by zone before work starts.</p>
                        <p className="small">Complete, permit-ready designs. Buy the plans on their own, or buy them with a build — either way you know the design, the drawings and the likely cost before you commit.</p>
                    </Reveal>
                    <Reveal delay={0.1} className="construction-library">
                        {/* One honest card that leads to the library (the designs themselves live on /templates) */}
                        <article className="card card-pad construction-home tilt-l stack" style={{ "--gap": "12px" }}>
                            <span className="tag" style={{ alignSelf: "flex-start" }}>The home library</span>
                            <h3 className="h3">Ready-to-build designs for 50 × 100 ft plots.</h3>
                            <p className="small">The full drawing set, quantities and renders for each design, from one model.</p>
                            <Link to="/templates" className="btn btn-ink btn-sm" style={{ alignSelf: "flex-start" }}>Browse the designs <Icon name="arrow" size={16} /></Link>
                        </article>
                    </Reveal>
                </div>
                <Reveal className="construction-included">
                    <h3 className="h3">What you get with every design</h3>
                    <ul className="grid-3 construction-included-list">
                        {INCLUDED.filter(([, b]) => seesTodos || !isPending(b)).map(([a, b]) => (
                            <li key={a} className="checklist">
                                <span className="row" style={{ "--gap": "12px", alignItems: "flex-start" }}>
                                    <span className="tick"><Icon name="check" size={14} /></span>
                                    <span className="stack" style={{ "--gap": "2px" }}><strong>{a}</strong><Fact as="span" className="small" text={b} /></span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="small">Every plot is different: before you build, we adapt the design to your plot — site survey, soil test, foundations checked against the results, and the council submission. <Todo>TODO: price for adapting a library design.</Todo></p>
                </Reveal>
            </Section>

            <Section tone="dark" seed={6} id="designers">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">For young architects</p>
                        <h2 className="h2">Design a home for the library. Earn every time it sells.</h2>
                        <p className="body">If your home is selected, we develop it with you to the Formcraft standard and publish it under your name. You earn a royalty on every set of plans sold — and a share when Formcraft builds it.</p>
                        <Todo as="p">TODO: royalty, build share, ownership and payment terms.</Todo>
                        <Link to="/contact" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Send us your concept</Link>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <Photo name="muyenga-3" alt="Muyenga School from above, a Formcraft Studio model" caption="Modelled to the Formcraft standard" note="Muyenga School" ratio="16 / 10" className="tilt-r" />
                    </Reveal>
                </div>
            </Section>

            <Section tone="sheet" seed={8} id="start">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Start a build</p>
                        <h2 className="h2">Tell us about your plot.</h2>
                        <p className="body">With your own drawings, one of our home designs, or nothing yet — we'll tell you what it takes. No design yet? <Link to="/studio" className="link">Start with Formcraft Studio</Link>.</p>
                        <p className="small">Prefer to talk? <a href="tel:+256753929921" className="link">+256 753 929 921</a></p>
                    </Reveal>
                    <QuoteForm types={BUILD_TYPES} defaultType="construction-library" heading="Your build" idPrefix="build" />
                </div>
            </Section>
        </div>
    );
};

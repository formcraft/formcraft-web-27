import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { QuoteForm } from "../components/forms/QuoteForm";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { Logo } from "../components/ui/Logo";
import { formatUGX } from "../lib/money";
import "./Studio.css";

const PROCESS = [
    { title: "Surveys & first design", text: "Boundary and site survey, soil test, floor plans, elevations, 3D views", time: "2–3 wks" },
    { title: "Engineering & working drawings", text: "Architecture, structure, electrical, plumbing, landscape and civil sets", time: "2–3 wks" },
    { title: "Costing & submission set", text: "Bills of quantities; signed and stamped drawings ready to lodge", time: "2 wks" },
    { title: "Submissions & permit", text: "We lodge the set with the council, answer its comments and follow it through to your building permit", time: "3–6 wks*" },
];

// Shares of the pre-construction fee (from the fee proposal template)
const PACKAGE = [
    { id: "arch", title: "Architecture & interiors", share: 20, text: "Floor plans, elevations, sections, roof, and interior layouts with cabinetry, finishes and fittings." },
    { id: "struct", title: "Structural & civil engineering", share: 20, text: "Foundations, columns, slabs and roof structure from your soil data, plus driveways, drainage and fencing. Signed and stamped." },
    { id: "mep", title: "Electrical & plumbing", share: 15, text: "Lighting, power, solar and backup provision, water supply, drainage and septic sizing." },
    { id: "qs", title: "Quantity surveying & BoQ", share: 15, text: "Early cost estimates, then priced and unpriced bills of quantities for budgeting and contractor bids." },
    { id: "land", title: "Landscape & exterior", share: 5, text: "Gardens, paths, outdoor living and lighting, rainwater run-off." },
    { id: "viz", title: "3D visualisation", share: 5, text: "Exterior and interior renders so you can see finishes before you buy them." },
    { id: "soil", title: "Soil investigation", share: 5, text: "Field sampling and lab tests to set the right foundations." },
    { id: "survey", title: "Site & boundary survey", share: 5, text: "Topographical and cadastral survey, boundary pegs opened and verified." },
    { id: "permit", title: "Submissions & permits", share: 10, text: "We prepare and lodge the signed submission set, answer the council's comments and follow it through to your building permit. Authority fees are paid by you directly." },
];

const RATES = [
    { id: "res", label: "Residential", rate: 0.1, text: "Family homes. Traditional drawings, no BIM." },
    { id: "com", label: "Commercial", rate: 0.15, text: "Hostels, apartments, shops, offices and other commercial buildings. Traditional drawings, no BIM." },
    { id: "bim", label: "Commercial with BIM", rate: 0.25, text: "Everything coordinated in one 3D model: clash checks, costs straight from the model, open-format handover." },
];

const STAGES = [
    { code: "G1", title: "Concept", text: "Massing and options, enough to decide." },
    { code: "G2", title: "Scheme", text: "The agreed design, coordinated across disciplines." },
    { code: "G3", title: "Detailed / permit", text: "Drawings and quantities for approval and tender." },
    { code: "G4", title: "Construction", text: "Each zone modelled to G4 before work starts on site." },
    { code: "G5", title: "As-built", text: "What was actually built, handed over to you." },
];

const LAYERS = [
    ["1D", "Requirements & rules", "Your requirements, the BIM Execution Plan, delivery schedule", "Always"],
    ["2D", "Documentation", "Drawings, schedules, specifications — generated from the model", "Always"],
    ["3D", "The model", "Coordinated architecture, structure and services; IFC files", "Always"],
    ["4D", "Time", "Construction sequence, look-ahead plans, procurement tracking", "When scoped"],
    ["5D", "Cost", "Quantities and bills of quantities straight from the model", "Always on work we build"],
    ["6D", "Sustainability", "Embodied carbon and material sourcing", "When scoped"],
    ["7D", "Operations", "Asset register, manuals and warranties for the building's owner", "When scoped"],
];

const STANDARDS = ["ISO 19650", "IFC 4 / 4.3", "IDS 1.0", "BCF", "COBie 2.4", "Uniclass 2015", "Revit 2025 / 2026", "Navisworks Manage", "Dynamo", "Robot Structural Analysis"];

const QUOTE_TYPES = [
    ["studio-residential", "Family home (10%)"],
    ["studio-commercial", "Commercial — hostels, apartments, offices (15%)"],
    ["studio-bim", "Commercial with BIM (25%)"],
    ["studio-part", "Part of the package only"],
    ["bim-subcontract", "BIM sub-contracting"],
    ["construction", "Construction"],
    ["template", "A ready-to-build home design"],
];

const parseUGX = (text) => Number(String(text).replace(/\D/g, "")) || 0;

// An estimate, worked out in the browser for guidance only; formal proposals come from the team.
const FeeCalculator = () => {
    const [budget, setBudget] = useState("250,000,000");
    const [rate, setRate] = useState("res");
    const [parts, setParts] = useState(() => new Set(PACKAGE.map((p) => p.id)));
    const r = RATES.find((x) => x.id === rate);
    const amount = parseUGX(budget);
    const calc = useMemo(() => {
        const share = PACKAGE.filter((p) => parts.has(p.id)).reduce((s, p) => s + p.share, 0);
        const fee = Math.round((amount * r.rate * share) / 100);
        const vat = Math.round(fee * 0.18);
        return { share, fee, vat, total: fee + vat, m1: Math.round(fee * 0.3), m2: Math.round(fee * 0.4), m3: fee - Math.round(fee * 0.3) - Math.round(fee * 0.4) };
    }, [amount, r, parts]);
    const toggle = (id) =>
        setParts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <div className="studio-calc">
            <div className="card card-pad stack" style={{ "--gap": "22px" }}>
                <div className="field">
                    <label htmlFor="calc-budget">Estimated construction budget (UGX)</label>
                    <input
                        id="calc-budget"
                        inputMode="numeric"
                        value={budget}
                        onChange={(e) => {
                            const n = parseUGX(e.target.value);
                            setBudget(n ? n.toLocaleString("en-UG") : "");
                        }}
                    />
                </div>
                <fieldset className="studio-fieldset">
                    <legend className="label">Type of building</legend>
                    <div className="studio-rates">
                        {RATES.map((x) => (
                            <label key={x.id} className="option">
                                <input type="radio" name="rate" checked={rate === x.id} onChange={() => setRate(x.id)} />
                                <strong>{x.label}</strong>
                                <span className="fine">{Math.round(x.rate * 100)}% of budget</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <fieldset className="studio-fieldset">
                    <legend className="label">Choose what you need</legend>
                    <div className="studio-parts">
                        {PACKAGE.map((p) => (
                            <label key={p.id} className="chip">
                                <input type="checkbox" checked={parts.has(p.id)} onChange={() => toggle(p.id)} />
                                {p.title} · {p.share}%
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            <div className="card card-pad paper-dark studio-calc-out" aria-live="polite">
                <p className="eyebrow">Your estimated fee</p>
                <p className="num">{formatUGX(calc.fee)}</p>
                <p className="small">{calc.share}% of the package at the {r.label.toLowerCase()} rate of {Math.round(r.rate * 100)}%</p>
                <table className="table studio-calc-table">
                    <tbody>
                        <tr><td>Professional fee</td><td className="num-cell">{formatUGX(calc.fee)}</td></tr>
                        <tr><td>VAT (18%)</td><td className="num-cell">{formatUGX(calc.vat)}</td></tr>
                        <tr><td><strong>Total before printing</strong></td><td className="num-cell"><strong>{formatUGX(calc.total)}</strong></td></tr>
                        <tr><td>1 · To start (30%)</td><td className="num-cell">{formatUGX(calc.m1)}</td></tr>
                        <tr><td>2 · Design approved (40%)</td><td className="num-cell">{formatUGX(calc.m2)}</td></tr>
                        <tr><td>3 · Final drawings &amp; submission</td><td className="num-cell">{formatUGX(calc.m3)}</td></tr>
                    </tbody>
                </table>
                <p className="fine">An estimate, not a quote. Stage 3 is adjusted to the final priced bill of quantities. Printing at cost; council fees paid directly by you.</p>
                <a href="#quote" className="btn btn-primary btn-block">Get a formal proposal</a>
            </div>
        </div>
    );
};

export const Studio = () => {
    usePageMeta("Studio · design, pre-construction & BIM", "Survey, design, engineering, costing and council approval for your building, at a clear percentage of the construction budget. BIM on projects that need it.");
    return (
        <div className="studio" data-division="studio">
            <PageHero motif="design" sceneHeight={360} brand="studio" title="Plan it properly before you build." sheet="A101" seed={31} crumbs={[["/", "Home"], [null, "Studio"]]}
                lead="We survey your plot, design your building, engineer it, cost it and get it approved by council — so construction starts with drawings you can trust and a budget you understand.">
                <a href="#fees" className="btn btn-primary">See what it costs <Icon name="arrow" size={18} /></a>
                <a href="#package" className="btn btn-line">What's included</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="process">
                <SectionHead eyebrow="From plot to building permit" title="Nine to fourteen weeks, in four steps.">
                    *Depends on the council's schedule. Plot to permit: typically 9–14 weeks.
                </SectionHead>
                <ol className="steps">
                    {PROCESS.map((s, i) => (
                        <Reveal as="li" key={s.title} delay={i * 0.07} className="card step">
                            <h3 className="h4">{s.title}</h3>
                            <p className="small">{s.text}</p>
                            <span className="tag tag-div" style={{ alignSelf: "flex-start", marginTop: "auto" }}>{s.time}</span>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            <Section tone="ground" seed={4} id="package">
                <SectionHead eyebrow="The pre-construction package" title="One team for everything before the first brick.">
                    Take the whole package or only the parts you need. Each part is a set share of the fee, so you always know what you're paying for.
                </SectionHead>
                <div className="grid-3">
                    {PACKAGE.map((p, i) => (
                        <Reveal key={p.id} delay={(i % 3) * 0.06} className="card card-pad studio-part">
                            <div className="between" style={{ alignItems: "baseline" }}>
                                <span className="studio-part-letter">{String.fromCharCode(65 + i)}</span>
                                <span className="tag tag-div">{p.share}%</span>
                            </div>
                            <h3 className="h4">{p.title}</h3>
                            <p className="small">{p.text}</p>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="card card-pad studio-template">
                    <div className="stack" style={{ "--gap": "6px" }}>
                        <strong>Don't need a custom design?</strong>
                        <p className="small">Start from a template build — a ready-to-build home for a 50 × 100 ft plot. Full drawing set, quantities and renders. We adapt it to your plot, take it through approvals and build it.</p>
                    </div>
                    <Link to="/construction#templates" className="btn btn-line btn-sm">Browse template builds <Icon name="arrow" size={16} /></Link>
                </Reveal>
            </Section>

            <Section tone="dark" seed={6} id="fees">
                <SectionHead eyebrow="How we charge" title="A clear percentage of your construction budget.">
                    Our fee for the full package is a fixed share of the estimated cost to build. Once the final bill of quantities is priced, the last payment is adjusted to match the real figure — up or down.
                </SectionHead>
                <div className="grid-3">
                    {RATES.map((x) => (
                        <Reveal key={x.id} className="card card-pad stack" style={{ "--gap": "10px" }}>
                            <span className="num">{Math.round(x.rate * 100)}%</span>
                            <h3 className="h4">{x.label}</h3>
                            <p className="small">{x.text}</p>
                        </Reveal>
                    ))}
                </div>
                <div className="grid-3 studio-terms">
                    <div><h3 className="h4">Pay in three stages</h3><p className="small">30% to start, 40% when you approve the design, and the balance with the final drawings and council submission.</p></div>
                    <div><h3 className="h4">Two rounds of changes included</h3><p className="small">Major changes after you approve the design are agreed and billed separately.</p></div>
                    <div><h3 className="h4">What's on top</h3><p className="small">VAT at 18% and printing at cost. Council and permit fees are paid by you directly to the authority.</p></div>
                </div>
            </Section>

            <Section tone="ground" seed={9} id="calculator">
                <SectionHead eyebrow="Fee calculator" title="Work out your fee in a minute." />
                <FeeCalculator />
            </Section>

            <Section tone="sheet" seed={10} id="bim">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">Building something bigger?</p>
                        <h2 className="h2">Add BIM: one model everyone builds from.</h2>
                        <p className="body">BIM — Building Information Modelling — puts the whole building into one coordinated 3D model. Pipes are checked against beams before anything is built, quantities come straight from the model, and every drawing stays in step.</p>
                        <p className="body">Our system stands on two equal foundations: modelling — a model built the way the building will be built — and information management — one source for every figure in it.</p>
                    </Reveal>
                    <Reveal delay={0.1} className="studio-pair">
                        <Photo name="bwebajja-iso" alt="Model view of a terraced landscape: walls, levels and planting as real elements" caption="The model" className="tilt-l" />
                        <Photo name="bwebajja-night" alt="The same terraced landscape rendered at night" caption="The render, from the same model" className="tilt-r studio-pair-b" />
                    </Reveal>
                </div>
                <Reveal className="kpis" style={{ marginTop: "clamp(40px, 5vw, 72px)" }}>
                    <div><span className="num">178</span><span className="small">shared parameters in one data dictionary, in 30 groups</span></div>
                    <div><span className="num">196</span><span className="small">coded building elements, each priced from one approved list</span></div>
                    <div><span className="num">5 mm</span><span className="small">clash tolerance — real clearances for insulation and maintenance checked separately</span></div>
                    <div><span className="num">0</span><span className="small">open critical or high-priority issues before any model is issued</span></div>
                </Reveal>
            </Section>

            <Section tone="ground" seed={11} id="stages">
                <SectionHead eyebrow="Foundation one: modelling" title="Model it as we build it.">
                    The model is a product, not a by-product. We build it storey by storey, with every wall, slab and opening as a real element in the right category.
                </SectionHead>
                <ol className="studio-stages">
                    {STAGES.map((s, i) => (
                        <Reveal as="li" key={s.code} delay={i * 0.06} className="studio-stage" style={{ "--lift": i }}>
                            <span className="studio-stage-code">{s.code}</span>
                            <strong>{s.title}</strong>
                            <span className="small">{s.text}</span>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            <Section tone="dark" seed={12} id="layers">
                <SectionHead eyebrow="The Formcraft 1D–7D framework" title="Seven layers of information. Scoped, never assumed.">
                    Requirements, drawings and the model come as standard on every BIM project. Time, carbon and operations are added when your BIM Execution Plan includes them.
                </SectionHead>
                <div className="table-wrap card">
                    <table className="table">
                        <thead><tr><th>Layer</th><th>Meaning</th><th>What you get</th><th>On BIM projects</th></tr></thead>
                        <tbody>
                            {LAYERS.map(([code, name, what, when]) => (
                                <tr key={code}>
                                    <td><span className="studio-layer">{code}</span></td>
                                    <td><strong>{name}</strong></td>
                                    <td className="small">{what}</td>
                                    <td><span className={`tag ${when === "Always" ? "tag-accent" : ""}`}>{when}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section tone="sheet" seed={14} id="code">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">Why BIM saves money</p>
                        <h2 className="h2">Type it once. Every document agrees.</h2>
                        <p className="body">Each wall, slab or door in the model carries one Formcraft code. From that code come its specification, its rate and its carbon figure — in the drawings, the schedules, the bill of quantities and the files we hand over.</p>
                        <p className="small">Specifications use local materials — Tororo, Hima and Bamburi cements; Mvule, Mahogany, Cypress and Eucalyptus timber — and follow Ugandan building law.</p>
                    </Reveal>
                    <Reveal delay={0.1} className="studio-code">
                        <div className="card card-pad studio-code-core">
                            <span className="tag tag-accent">B.200_00</span>
                            <strong className="h3">200 mm Class A blockwork</strong>
                        </div>
                        <ul className="studio-code-outputs">
                            {[["Drawings", "labelled on every sheet"], ["Schedules", "grouped by code"], ["Bill of quantities", "quantity × approved rate"], ["Clash reports", "traceable to each element"], ["Dashboards", "cost and progress"], ["Handover files", "open IFC format"]].map(([a, b]) => (
                                <li key={a} className="card"><strong>{a}</strong><span className="fine">{b}</span></li>
                            ))}
                        </ul>
                    </Reveal>
                </div>
            </Section>

            <Section tone="ground" seed={15} small id="standards">
                <div className="between">
                    <div className="stack mw" style={{ "--gap": "14px", "--mw": "560px" }}>
                        <p className="eyebrow">For engineers, developers and contractors</p>
                        <h2 className="h3">Closed authoring, open delivery.</h2>
                        <p className="small">We author in Autodesk tools and deliver in open formats, aligned with ISO 19650. We also take on BIM modelling and documentation as a sub-consultant on your projects.</p>
                    </div>
                    <ul className="row studio-standards" style={{ "--gap": "8px" }}>
                        {STANDARDS.map((s) => <li key={s} className="tag">{s}</li>)}
                    </ul>
                </div>
            </Section>

            <Section tone="orange" seed={16} small id="build">
                <div className="between" style={{ alignItems: "center" }}>
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <Logo brand="construction" height={26} tone="dark" />
                        <h2 className="h3">When the permit is in, we can build it too.</h2>
                        <p className="small mw">Site supervision, quality control, contractor valuations and milestone sign-offs — agreed separately once your drawings are complete.</p>
                    </div>
                    <Link to="/construction" className="btn btn-ink">See how we build <Icon name="arrow" size={18} /></Link>
                </div>
            </Section>

            <Section tone="sheet" seed={17} id="quote">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Request a proposal</p>
                        <h2 className="h2">Tell us about the plot.</h2>
                        <p className="body">A few details are enough to start. You'll get a written proposal with the scope, the fee table and the payment stages.</p>
                        <p className="small">Prefer to talk? <a href="tel:+256753929921" className="link">+256 753 929 921</a></p>
                    </Reveal>
                    <QuoteForm types={QUOTE_TYPES} defaultType="studio-residential" heading="Your project" idPrefix="studio" />
                </div>
            </Section>
        </div>
    );
};

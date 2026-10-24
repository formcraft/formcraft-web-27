import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePublicDoc } from "../hooks/usePublicDoc";
import { useShowLink } from "../hooks/useSite";
import { HotelScene, HotelTags, HotelControls } from "../components/scene/HotelScene";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { Reveal, Kinetic } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { Logo, LogoMark } from "../components/ui/Logo";
import { flagship } from "../data/projects";
import "./Home.css";

const DIVISIONS = [
    { brand: "studio", division: "studio", title: "BIM & CAD design, pre-construction", text: "Surveys, architecture, structure, MEP and bills of quantities — resolved in the model before anyone breaks ground.", to: "/studio", cta: "Explore the studio" },
    { brand: "construction", division: "construction", title: "Building what the model promised", text: "Built zone by zone from a construction-ready model — plus ready-to-build home designs.", to: "/construction", cta: "Construction" },
    { brand: "concrete", division: "concrete", title: "Precast and green concrete", text: "Columns, beams, lintels, pavers and facade panels, made for durability and fast site assembly.", to: "/concrete", cta: "Concrete" },
    { brand: "stores", division: "stores", title: "Furniture, joinery and goods", text: "Versioned furniture, kitchens, wardrobes and doors from our Kampala workshop.", to: "/stores", cta: "Visit the store" },
];

const ROADMAP = [
    { year: "2023", text: "First bespoke craft piece made — the design-craft idea, proven." },
    { year: "2025", text: "Formcraft formally launched; architectural project work begins." },
    { year: "2026", text: "Registered as Formcraft Design and Construction Co. Ltd, Kampala." },
    { year: "Next", text: "10 new design contracts, a doubled artisan network, trade training programmes." },
    { year: "2028", text: "$1M annual revenue, 20% of profits reinvested in artisans, Kenya, Rwanda and South Africa." },
];

const DOORS = [
    { who: "Clients & developers", title: "Hire us", text: "Design, construction, concrete and template builds.", to: "/studio#quote", cta: "Request a quote", tone: "orange" },
    { who: "Homes & offices", title: "Shop", text: "Furniture, joinery and goods from our workshop.", to: "/stores", cta: "Visit Stores", tone: "photo" },
    { who: "Artisans & students", title: "Join", text: "Formcraft sets the market for the work — you focus on the craft.", to: "/community", cta: "Join the community", tone: "sheet" },
    { who: "Investors & donors", title: "Back us", text: "Invest in Formcraft developments — from community crowdfunding to partner deals.", to: "/invest", cta: "See the developments", tone: "dark" },
];

const Counter = ({ value, label }) => (
    <div>
        <span className="num">{Number.isInteger(value) ? value.toLocaleString("en-UG") : "[n]"}</span>
        <span className="small">{label}</span>
    </div>
);

export const Home = () => {
    usePageMeta(null, "Formcraft Design and Construction, Kampala: BIM-led design, construction, precast concrete and workshop-made furniture, in one value chain with local artisans.");
    const { data: stats } = usePublicDoc("stats/public");
    const show = useShowLink();

    return (
        <div className="home">
            {/* The live paper model of the hotel sits behind the whole page */}
            <HotelScene />
            <HotelTags />

            {/* Hero: a window onto the model */}
            <section className="home-hero home-window" data-cam="hero">
                <div className="home-drag-hint" id="drag-hint" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 12h8M5 9l-3 3 3 3M19 9l3 3-3 3" /></svg>
                    Drag to turn the model
                </div>
                <HotelControls />
                <div className="wrap home-hero-inner">
                    <div className="home-hero-copy">
                        <p className="eyebrow rise" style={{ "--delay": "0s" }}>Design &amp; Construction · Kampala, Uganda</p>
                        <h1 className="h1 home-hero-title">
                            <Kinetic text="Designing spaces." />
                            <span className="accent">
                                <Kinetic text="Empowering communities." start={2} />
                            </span>
                        </h1>
                        <p className="lead rise" style={{ "--delay": ".45s" }}>
                            One design-build value chain — BIM-led design, structural concrete and hand-crafted joinery — so you get one point of accountability, predictable cost and precision from first survey to finished interior.
                        </p>
                        <div className="row rise" style={{ "--delay": ".6s" }}>
                            <Link to="/studio" className="btn btn-primary">
                                Start a project <Icon name="arrow" size={18} />
                            </Link>
                            <a href="#value-chain" className="btn btn-line">
                                See how we work
                            </a>
                        </div>
                    </div>
                    <ul className="home-hero-strip rise" style={{ "--delay": ".75s" }}>
                        <li><i className="home-key home-key-design" /><b>In design</b> · resolved in the model first</li>
                        <li><i className="home-key home-key-built" /><b>Built</b> · from the same model</li>
                        <li>Four-storey hotel · scale model</li>
                    </ul>
                </div>
            </section>

            {/* The problem */}
            <Section tone="sheet" seed={3} id="why">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">Why Formcraft exists</p>
                        <h2 className="h2">Designers and artisans kept working apart.</h2>
                    </Reveal>
                    <Reveal delay={0.1} className="stack" style={{ "--gap": "22px" }}>
                        <p className="body">
                            Emlyn Atochon and Peter Isingoma met studying interior architecture at Limkokwing University in Mukono. On every project with local craftsmen they hit the same wall: coordination between the drawing board and the workshop broke down, and many artisans saw abstract design as <em>okwekoza</em> — pretence, disconnected from the bench.
                        </p>
                        <p className="body">
                            Formcraft closes that gap. Digital modellers, engineers and workshop artisans work from the same table and the same information, so precision and handcraft improve each other at every step.
                        </p>
                        <p className="row home-bridge">
                            <LogoMark size={20} /> <strong>Bridging blueprint to bench.</strong>
                        </p>
                    </Reveal>
                </div>
            </Section>

            {/* One value chain */}
            <section className="section home-window home-chain" id="value-chain" data-cam="chain">
                <div className="wrap">
                <div className="home-window-head">
                    <SectionHead eyebrow="One value chain" title="From first site survey to the last piece of joinery.">
                        Four divisions under one roof. One contract, one model, one team accountable for the result.
                    </SectionHead>
                </div>
                <div className="grid-4">
                    {DIVISIONS.map((d, i) => (
                        <Reveal key={d.brand} delay={i * 0.08} className="home-division" data-division={d.division}>
                            <Link to={d.to} className="card card-pad home-division-card">
                                <span className="card-strip" />
                                <Logo brand={d.brand} height={24} tone="light" />
                                <h3 className="h3">{d.title}</h3>
                                <p className="small">{d.text}</p>
                                <span className="home-division-cta">
                                    {d.cta} <Icon name="arrow" size={16} />
                                </span>
                            </Link>
                        </Reveal>
                    ))}
                </div>
                </div>
            </section>

            {/* BIM: one model, two outputs (day and night) */}
            <Section tone="ground" seed={8} id="bim">
                <div className="grid-2 home-bim">
                    <Reveal className="stack" style={{ "--gap": "22px" }}>
                        <p className="eyebrow">How every project runs</p>
                        <h2 className="h2">Models built the way the building is built.</h2>
                        <p className="body">
                            Our BIM stands on two equal foundations. <strong>Modelling:</strong> every model is a first, virtual build of the project — right trade, right storey, real sizes. <strong>Information:</strong> a wall coded B.200_00 in the model carries the same specification, rate and carbon factor into the drawing, the schedule, the bill of quantities, the clash report and the IFC file. Nobody retypes any of it.
                        </p>
                        <div className="home-code card">
                            <span className="tag tag-accent">B.200_00</span>
                            <span>200 mm Class A blockwork</span>
                        </div>
                        <Link to="/studio#bim" className="link">
                            How our BIM system works <Icon name="arrow" size={16} />
                        </Link>
                    </Reveal>
                    <Reveal delay={0.1} className="home-pair">
                        <Photo name="bwebajja-iso" alt="Bwebajja landscape: model view, every wall and level a real element" caption="The model" note="Bwebajja landscape" className="tilt-l home-pair-a" />
                        <Photo name="bwebajja-night" alt="The same Bwebajja landscape rendered at night from the model" caption="The render, from the same model" className="tilt-r home-pair-b" />
                    </Reveal>
                </div>
                <Reveal className="kpis home-kpis">
                    <div><span className="num">178</span><span className="small">shared parameters in one data dictionary</span></div>
                    <div><span className="num">196</span><span className="small">coded building elements, priced from one workbook</span></div>
                    <div><span className="num">ISO 19650</span><span className="small">aligned information process</span></div>
                    <div><span className="num">IFC · IDS</span><span className="small">open exchanges, checked before they leave</span></div>
                </Reveal>
            </Section>

            {/* Template builds */}
            <Section tone="orange" seed={13} id="templates">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">Template builds</p>
                        <h2 className="h2">A home you can choose today — and we'll build it.</h2>
                        <p className="body">
                            Ready-to-build home designs for 50 × 100 ft plots, with the full drawing set, quantities and renders. We fit the design to your plot and build it, or you buy the plans on their own.
                        </p>
                        <div className="row">
                            <Link to="/construction#templates" className="btn btn-ink">
                                Browse template builds
                            </Link>
                            <Link to="/studio#quote" className="btn btn-line">
                                Design one with us
                            </Link>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1} className="card card-pad card-stacked home-library">
                        <div className="between">
                            <strong>The home library</strong>
                            <span className="tag">Release 2026.1</span>
                        </div>
                        <div className="placeholder" style={{ aspectRatio: "16 / 10" }}>[Render of a home design]</div>
                        <p className="dim">50 × 100 ft plot</p>
                        <p className="small">Designed by young Ugandan architects, who earn a royalty every time their design sells.</p>
                    </Reveal>
                </div>
            </Section>

            {/* Site plan: the camera rises above the model */}
            <section className="home-window home-plan" data-cam="plan">
                <div className="wrap home-plan-inner">
                    <Reveal className="card card-pad home-plan-card">
                        <span className="tag tag-solid">Site plan · 1:200</span>
                        <h2 className="h2">The model, seen from above.</h2>
                        <p className="body">The hotel stands on a Formcraft A1 sheet: the title block, the grid and the site plan drawn under it are the same ones we issue on real projects.</p>
                    </Reveal>
                </div>
            </section>

            {/* Flagship work */}
            <Section tone="ground" seed={21} id="work" data-cam="work">
                <SectionHead eyebrow="Flagship work" title="Work we've designed, built and made.">
                    <Link to="/projects" className="link">
                        All projects <Icon name="arrow" size={16} />
                    </Link>
                </SectionHead>
                <div className="grid-4">
                    {flagship.map((p, i) => {
                        const inner = (
                            <>
                                {p.image ? (
                                    <img src={`/images/${p.image}-800.webp`} alt={`${p.title}, render`} loading="lazy" />
                                ) : (
                                    <div className="placeholder">[{p.title} photo]</div>
                                )}
                                <div className="home-flag-body">
                                    <span className="tag">{p.division}</span>
                                    <h3 className="h3">{p.title}</h3>
                                    <p className="small">{p.text}</p>
                                </div>
                            </>
                        );
                        return (
                            <Reveal key={p.title} delay={i * 0.06}>
                                {p.slug ? (
                                    <Link to={`/projects/${p.slug}`} className="card home-flag">{inner}</Link>
                                ) : (
                                    <div className="card home-flag">{inner}</div>
                                )}
                            </Reveal>
                        );
                    })}
                </div>
            </Section>

            {/* Impact counters (live from Firestore stats/public) */}
            <Section tone="sheet" seed={34} small id="impact">
                <div className="between home-impact">
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <p className="eyebrow">So far</p>
                        <h2 className="h3">Counted live, not rounded up.</h2>
                    </div>
                    <div className="home-counters">
                        <Counter value={stats?.artisans} label="artisans in the network" />
                        <Counter value={stats?.projectsDone} label="projects delivered" />
                        <Counter value={stats?.treesPlanted} label="trees planted" />
                    </div>
                </div>
            </Section>

            {/* Roadmap */}
            <Section tone="dark" seed={55} id="roadmap">
                <SectionHead eyebrow="Where we're going" title="From one chair to an East African design-build firm." />
                <ol className="home-roadmap">
                    {ROADMAP.map((r, i) => (
                        <Reveal as="li" key={r.year} delay={i * 0.07} className="home-roadmap-item">
                            <span className="home-roadmap-year">{r.year}</span>
                            <p className="small">{r.text}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            {/* Four doors */}
            <section className="home-window home-join" id="join" data-cam="dusk">
                <div className="wrap">
                <h2 className="h1-s home-join-title">Find your way in.</h2>
                <div className="grid-4">
                    {DOORS.filter((d) => show(d.to)).map((d, i) => (
                        <Reveal key={d.title} delay={i * 0.06}>
                            <Link to={d.to} className={`card home-door home-door-${d.tone} ${d.tone === "dark" ? "paper-dark" : ""} ${d.tone === "orange" ? "paper-orange" : ""}`}>
                                {d.tone === "photo" && <img src="/images/chair-800.webp" alt="" loading="lazy" className="home-door-img" />}
                                <span className="home-door-who">{d.who}</span>
                                <span className="h2 home-door-title">{d.title}</span>
                                <span className="small">{d.text}</span>
                                <span className="home-door-cta">
                                    {d.cta} <Icon name="arrow" size={16} />
                                </span>
                            </Link>
                        </Reveal>
                    ))}
                </div>
                </div>
            </section>
        </div>
    );
};

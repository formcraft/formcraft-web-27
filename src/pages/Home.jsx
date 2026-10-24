// Home page (/). The home page: Formcraft's pitch, from top to bottom:
// the hero (the paper 3D hotel model builds itself behind the headline, or a 2D drawing on slow devices),
// "Why Formcraft exists" (the founders' story), the value chain (the four divisions), how every project runs
// (BIM), template builds, the site plan seen from above, flagship work, live counts (only once real numbers
// exist), the roadmap to 2028, and four doors: Hire us, Shop, Join, Back us.
// Its words come from the copy register (src/data/copy.js, page "home") through useCopy, so the team can
// edit them in Admin → Copy; the tagline stays fixed here (Brand Guide).
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePublicDoc } from "../hooks/usePublicDoc";
import { useCopy } from "../hooks/useCopy";
import { useShowLink } from "../hooks/useSite";
import { HotelScene, HotelTags, HotelControls } from "../components/scene/HotelScene";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { Reveal, Kinetic } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { Fact } from "../components/ui/Todo";
import { Logo, LogoMark } from "../components/ui/Logo";
import { flagship } from "../data/projects";
import "./Home.css";

// The words for these lists live in the copy register under ids like "<key>Title", "<key>Text", "<key>Cta"
const DIVISIONS = [
    { key: "studio", to: "/studio" },
    { key: "construction", to: "/construction" },
    { key: "concrete", to: "/concrete" },
    { key: "stores", to: "/stores" },
];

const ROADMAP = ["road1", "road2", "road3", "road4", "road5"];

const DOORS = [
    { key: "hire", titleId: "hireTitle", to: "/studio#quote", tone: "orange" },
    { key: "shop", titleId: "shopTitle", to: "/stores", tone: "photo" },
    { key: "join", titleId: "joinDoorTitle", to: "/community", tone: "sheet" },
    { key: "back", titleId: "backTitle", to: "/invest", tone: "dark" },
];

/** One live number (from Firestore stats/public). Left out entirely until it's a real number. */
const Counter = ({ value, label }) =>
    Number.isInteger(value) ? (
        <div>
            <span className="num">{value.toLocaleString("en-UG")}</span>
            <span className="small">{label}</span>
        </div>
    ) : null;

/** The Home page. Rendered by src/routes.jsx for /. */
export const Home = () => {
    usePageMeta(null, "Formcraft Design and Construction, Kampala: BIM-led design, construction, precast concrete and workshop-made furniture, in one value chain with local artisans.");
    const t = useCopy("home");
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
                    {t("dragHint")}
                </div>
                <HotelControls />
                <div className="wrap home-hero-inner">
                    <div className="home-hero-copy">
                        <p className="eyebrow rise" style={{ "--delay": "0s" }}>{t("heroEyebrow")}</p>
                        <h1 className="h1 home-hero-title">
                            <Kinetic text="Designing spaces." />
                            <span className="accent">
                                <Kinetic text="Empowering communities." start={2} />
                            </span>
                        </h1>
                        <p className="lead rise" style={{ "--delay": ".45s" }}>{t("heroLead")}</p>
                        <div className="row rise" style={{ "--delay": ".6s" }}>
                            <Link to="/studio" className="btn btn-primary">
                                {t("heroCta")} <Icon name="arrow" size={18} />
                            </Link>
                            <a href="#value-chain" className="btn btn-line">
                                {t("heroCta2")}
                            </a>
                        </div>
                    </div>
                    <ul className="home-hero-strip rise" style={{ "--delay": ".75s" }}>
                        <li><i className="home-key home-key-design" /><b>{t("heroKeyDesign")}</b> · {t("heroKeyDesignNote")}</li>
                        <li><i className="home-key home-key-built" /><b>{t("heroKeyBuilt")}</b> · {t("heroKeyBuiltNote")}</li>
                        <li>{t("heroModelNote")}</li>
                    </ul>
                </div>
            </section>

            {/* The problem */}
            <Section tone="sheet" seed={3} id="why">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">{t("whyEyebrow")}</p>
                        <h2 className="h2">{t("whyTitle")}</h2>
                    </Reveal>
                    <Reveal delay={0.1} className="stack" style={{ "--gap": "22px" }}>
                        <p className="body">{t("whyBody")}</p>
                        <p className="body">{t("whyBody2")}</p>
                        <p className="row home-bridge">
                            <LogoMark size={20} /> <strong>{t("whyBridge")}</strong>
                        </p>
                    </Reveal>
                </div>
            </Section>

            {/* One value chain */}
            <section className="section home-window home-chain" id="value-chain" data-cam="chain">
                <div className="wrap">
                <div className="home-window-head">
                    <SectionHead eyebrow={t("chainEyebrow")} title={t("chainTitle")}>
                        {t("chainIntro")}
                    </SectionHead>
                </div>
                <div className="grid-4">
                    {DIVISIONS.map((d, i) => (
                        <Reveal key={d.key} delay={i * 0.08} className="home-division" data-division={d.key}>
                            <Link to={d.to} className="card card-pad home-division-card">
                                <span className="card-strip" />
                                <Logo brand={d.key} height={24} tone="light" />
                                <h3 className="h3">{t(`${d.key}Title`)}</h3>
                                <p className="small">{t(`${d.key}Text`)}</p>
                                <span className="home-division-cta">
                                    {t(`${d.key}Cta`)} <Icon name="arrow" size={16} />
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
                        <p className="eyebrow">{t("bimEyebrow")}</p>
                        <h2 className="h2">{t("bimTitle")}</h2>
                        <p className="body">{t("bimBody")}</p>
                        <div className="home-code card">
                            <span className="tag tag-accent">{t("bimCode")}</span>
                            <span>{t("bimCodeLabel")}</span>
                        </div>
                        <Link to="/studio#bim" className="link">
                            {t("bimLink")} <Icon name="arrow" size={16} />
                        </Link>
                    </Reveal>
                    <Reveal delay={0.1} className="home-pair">
                        <Photo name="bwebajja-iso" alt={t.str("bimModelAlt")} caption={t("bimModelCaption")} note={t.str("bimModelNote")} className="tilt-l home-pair-a" />
                        <Photo name="bwebajja-night" alt={t.str("bimRenderAlt")} caption={t("bimRenderCaption")} className="tilt-r home-pair-b" />
                    </Reveal>
                </div>
                <Reveal className="kpis home-kpis">
                    {["kpi1", "kpi2", "kpi3", "kpi4"].map((k) => (
                        <div key={k}><span className="num">{t(k)}</span><span className="small">{t(`${k}Label`)}</span></div>
                    ))}
                </Reveal>
            </Section>

            {/* Template builds */}
            <Section tone="orange" seed={13} id="templates">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">{t("tplEyebrow")}</p>
                        <h2 className="h2">{t("tplTitle")}</h2>
                        <p className="body">{t("tplBody")}</p>
                        <div className="row">
                            <Link to="/construction#templates" className="btn btn-ink">
                                {t("tplCta")}
                            </Link>
                            <Link to="/studio#quote" className="btn btn-line">
                                {t("tplCta2")}
                            </Link>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1} className="card card-pad card-stacked home-library">
                        <div className="between">
                            <strong>{t("libTitle")}</strong>
                            <span className="tag">{t("libRelease")}</span>
                        </div>
                        <div className="placeholder" style={{ aspectRatio: "16 / 10" }}>{t("libPlaceholder")}</div>
                        <p className="dim">{t("libPlot")}</p>
                        <p className="small">{t("libNote")}</p>
                    </Reveal>
                </div>
            </Section>

            {/* Site plan: the camera rises above the model */}
            <section className="home-window home-plan" data-cam="plan">
                <div className="wrap home-plan-inner">
                    <Reveal className="card card-pad home-plan-card">
                        <span className="tag tag-solid">{t("planTag")}</span>
                        <h2 className="h2">{t("planTitle")}</h2>
                        <p className="body">{t("planBody")}</p>
                    </Reveal>
                </div>
            </section>

            {/* Flagship work */}
            <Section tone="ground" seed={21} id="work" data-cam="work">
                <SectionHead eyebrow={t("workEyebrow")} title={t("workTitle")}>
                    <Link to="/projects" className="link">
                        {t("workLink")} <Icon name="arrow" size={16} />
                    </Link>
                </SectionHead>
                <div className="grid-4">
                    {flagship.map((p, i) => {
                        const inner = (
                            <>
                                {p.image ? (
                                    <img src={`/images/${p.image}-800.webp`} alt={`${p.title}, render`} loading="lazy" />
                                ) : (
                                    <div className="placeholder" role="img" aria-label={`${p.title}, photo coming soon`}>Photo coming soon</div>
                                )}
                                <div className="home-flag-body">
                                    <span className="tag">{p.division}</span>
                                    <h3 className="h3">{p.title}</h3>
                                    <Fact as="p" className="small" text={p.text} />
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

            {/* Impact counters (live from Firestore stats/public). Hidden until there's at least one
                real number, so visitors never see placeholders where the proof should be. */}
            {[stats?.artisans, stats?.projectsDone, stats?.treesPlanted].some(Number.isInteger) && (
            <Section tone="sheet" seed={34} small id="impact">
                <div className="between home-impact">
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <p className="eyebrow">{t("impactEyebrow")}</p>
                        <h2 className="h3">{t("impactTitle")}</h2>
                    </div>
                    <div className="home-counters">
                        <Counter value={stats?.artisans} label={t("countArtisans")} />
                        <Counter value={stats?.projectsDone} label={t("countProjects")} />
                        <Counter value={stats?.treesPlanted} label={t("countTrees")} />
                    </div>
                </div>
            </Section>
            )}

            {/* Roadmap */}
            <Section tone="dark" seed={55} id="roadmap">
                <SectionHead eyebrow={t("roadEyebrow")} title={t("roadTitle")} />
                <ol className="home-roadmap">
                    {ROADMAP.map((r, i) => (
                        <Reveal as="li" key={r} delay={i * 0.07} className="home-roadmap-item">
                            <span className="home-roadmap-year">{t(`${r}Year`)}</span>
                            <p className="small">{t(r)}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            {/* Four doors */}
            <section className="home-window home-join" id="join" data-cam="dusk">
                <div className="wrap">
                <h2 className="h1-s home-join-title">{t("joinTitle")}</h2>
                <div className="grid-4">
                    {DOORS.filter((d) => show(d.to)).map((d, i) => (
                        <Reveal key={d.key} delay={i * 0.06}>
                            <Link to={d.to} className={`card home-door home-door-${d.tone} ${d.tone === "dark" ? "paper-dark" : ""} ${d.tone === "orange" ? "paper-orange" : ""}`}>
                                {d.tone === "photo" && <img src="/images/chair-800.webp" alt="" loading="lazy" className="home-door-img" />}
                                <span className="home-door-who">{t(`${d.key}Who`)}</span>
                                <span className="h2 home-door-title">{t(d.titleId)}</span>
                                <span className="small">{t(`${d.key}Text`)}</span>
                                <span className="home-door-cta">
                                    {t(`${d.key}Cta`)} <Icon name="arrow" size={16} />
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

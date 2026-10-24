import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContentItem } from "../hooks/useContent";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Photo, imageName } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { formatUGX } from "../lib/money";
import { sendInvestorLead } from "../lib/forms";
import { devStatusLabel, isSampleDev } from "../data/developments";
import "./RealEstateProject.css";

// Placeholder views until a development has images uploaded in Admin
const VIEWS = ["Render", "Site plan", "Typical floor", "Unit layout", "Walkthrough"];

const TIMELINE = [
    ["Design & permits", "[status]"],
    ["Funding round", "Open until [date]"],
    ["Construction", "[start] – [end]"],
    ["First returns paid", "[date]"],
];

const DOCUMENTS = [
    ["Project summary", "PDF · TODO: upload"],
    ["Drawings & cost plan", "Verified investors"],
    ["Financial model", "Verified investors"],
    ["Investment agreement & risk statement", "Verified investors"],
];

const LEVELS = ["Community investor", "Verified investor", "Partner investor"];
const TICKETS = ["Prefer not to say", "Up to the community limit (UGX [limit])", "UGX [n] – [n]", "A whole phase or the whole project"];

const money = (v, fallback = "UGX [n]") => (Number.isInteger(v) ? formatUGX(v) : fallback);

const InterestForm = ({ dev }) => {
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    const onSubmit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setStatus("sending");
        setError(null);
        try {
            await sendInvestorLead({
                name: form.get("name"),
                org: form.get("org"),
                email: form.get("email"),
                ticketSize: form.get("ticket"),
                message: [`[Real estate: ${dev.title} (${dev.slug})]`, `Level: ${form.get("level")}`, form.get("message")].filter(Boolean).join("\n"),
            });
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again, or call us.");
            setStatus("error");
        }
    };

    if (status === "sent") {
        return (
            <div className="card card-pad stack" role="status" style={{ "--gap": "12px" }}>
                <h3 className="h3">Interest registered.</h3>
                <p className="body">The Real Estate team will contact you about this development. Nothing is reserved or paid yet. <span className="todo">TODO: confirm reply time.</span></p>
                <button type="button" className="btn btn-ink btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setStatus("idle")}>Send another</button>
            </div>
        );
    }
    return (
        <form className="card card-pad form" onSubmit={onSubmit}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3">Invest in this development</h3>
                <p className="small">Investing online isn't open yet. Register your interest and we'll send the documents when the round opens.</p>
            </div>
            <div className="form-row">
                <div className="field">
                    <label htmlFor="real-estate-project-name">Name</label>
                    <input id="real-estate-project-name" name="name" autoComplete="name" required maxLength={120} />
                </div>
                <div className="field">
                    <label htmlFor="real-estate-project-email">Email</label>
                    <input id="real-estate-project-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                </div>
            </div>
            <div className="field">
                <label htmlFor="real-estate-project-org">Organisation (optional)</label>
                <input id="real-estate-project-org" name="org" autoComplete="organization" maxLength={200} />
            </div>
            <div className="form-row">
                <div className="field">
                    <label htmlFor="real-estate-project-level">Your level</label>
                    <select id="real-estate-project-level" name="level" defaultValue={LEVELS[0]}>
                        {LEVELS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="real-estate-project-ticket">Amount you have in mind</label>
                    <select id="real-estate-project-ticket" name="ticket" defaultValue={TICKETS[0]}>
                        {TICKETS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className="field">
                <label htmlFor="real-estate-project-message">Questions (optional)</label>
                <textarea id="real-estate-project-message" name="message" maxLength={4500} />
            </div>
            <dl className="real-estate-project-terms">
                <div><dt className="small">Units of the development</dt><dd className="small">{dev.units ?? "[n]"} units at {money(dev.unitFromUGX, "UGX [unit price]")}</dd></div>
                <div><dt className="small">Target return</dt><dd className="small">[x]% a year</dd></div>
                <div><dt className="small">Platform fee</dt><dd className="small todo">TODO</dd></div>
            </dl>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Register my interest"}</button>
            <p className="fine">Your capital is at risk and returns aren't guaranteed. Read the risk statement before investing. <span className="todo">TODO: regulatory status and final wording.</span></p>
        </form>
    );
};

export const RealEstateProject = () => {
    const { slug } = useParams();
    const { item: dev, loading, items } = useContentItem("developments", slug);
    const [view, setView] = useState(0);
    usePageMeta(dev ? `${dev.title} · Real estate` : loading ? "Real estate" : "Development not found", dev?.summary);

    if (!dev && loading) {
        return (
            <div className="wrap real-estate-project-loading" aria-busy="true">
                <div className="skeleton" style={{ height: 14, width: 180 }} />
                <div className="skeleton" style={{ height: 64, width: "70%" }} />
                <div className="skeleton" style={{ height: 360 }} />
            </div>
        );
    }

    if (!dev) {
        return (
            <PageHero eyebrow="Real estate" title="We can't find that development." sheet="I103" seed={63} motif="estate"
                crumbs={[["/real-estate", "Real estate"], [null, "Not found"]]}
                lead="It may have been renamed or closed. See the developments that are listed now.">
                <Link to="/real-estate" className="btn btn-primary"><Icon name="arrowLeft" size={18} /> All developments</Link>
            </PageHero>
        );
    }

    const gallery = dev.images?.length
        ? dev.images.map((img, i) => ({ label: img?.alt || `Image ${i + 1}`, name: imageName(img), alt: img?.alt || `${dev.title}, image ${i + 1}` }))
        : VIEWS.map((label) => ({ label, name: null, alt: `[${label}]` }));
    const current = gallery[Math.min(view, gallery.length - 1)];
    const others = items.filter((d) => d.slug !== dev.slug).slice(0, 3);
    const facts = [
        ["Raised", "UGX [n] of UGX [target]"],
        ["Investors", "[n]"],
        ["Closes", "[date]"],
        ["Target return", "[x]% a year"],
        ["Term", "[n] years"],
        ["Returns paid", "[quarterly]"],
        ["Units", dev.units ?? "[n]"],
        ["Units from", money(dev.unitFromUGX)],
        ["Minimum investment", money(dev.minInvestUGX)],
        ["Expected completion", dev.completion || "[date]"],
    ];

    return (
        <div className="real-estate-project">
            <section className="wrap real-estate-project-head">
                <nav className="crumbs" aria-label="Breadcrumb">
                    <Link to="/real-estate">Real estate</Link> <span aria-hidden="true">/</span> <span aria-current="page">{dev.title}</span>
                </nav>
                <div className="real-estate-project-top">
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <Photo name={current.name} alt={current.alt} caption={current.label} note="Render from the coordinated model — artist's impression where noted" ratio="16 / 10" eager sizes="(max-width: 900px) 100vw, 60vw" />
                        <div className="row" role="group" aria-label="Choose a view" style={{ "--gap": "8px" }}>
                            {gallery.map((g, i) => (
                                <button key={`${g.label}-${i}`} type="button" className="chip" aria-pressed={i === view} onClick={() => setView(i)}>{g.label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="stack" style={{ "--gap": "16px" }}>
                        <div className="row" style={{ "--gap": "6px" }}>
                            <span className="tag tag-accent">{devStatusLabel(dev.status)}</span>
                            {isSampleDev(dev) && <span className="tag">Sample listing</span>}
                            {dev.hidden && <span className="tag">Hidden</span>}
                        </div>
                        <h1 className="h1-s">{dev.title}</h1>
                        <p className="small">{dev.kind ? `${dev.kind} · ` : ""}{dev.location || "[location]"}</p>
                        {dev.summary && <p className="lead">{dev.summary}</p>}
                        <div className="stack" style={{ "--gap": "6px" }}>
                            <div className="bar" role="img" aria-label="Amount raised: not published yet"><i style={{ "--value": "0%" }} /></div>
                            <p className="fine">Funding figures appear once this development's terms are approved.</p>
                        </div>
                        <a href="#invest" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Register interest <Icon name="arrow" size={18} /></a>
                    </div>
                </div>
            </section>

            <Section tone="sheet" seed={2} small id="facts">
                <dl className="kpis real-estate-project-facts">
                    {facts.map(([k, v]) => (
                        <div key={k}>
                            <dt className="fine">{k}</dt>
                            <dd className="h4">{v}</dd>
                        </div>
                    ))}
                </dl>
            </Section>

            <Section tone="ground" seed={4} id="project">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "28px" }}>
                        <div className="stack" style={{ "--gap": "12px" }}>
                            <p className="eyebrow">The project</p>
                            <h2 className="h2">Why this development.</h2>
                            <p className="body todo">TODO: the site, who the units are for, expected rent, and why the location works.</p>
                        </div>
                        <div className="stack" style={{ "--gap": "12px" }}>
                            <h2 className="h3">Timeline</h2>
                            <ol className="real-estate-project-timeline">
                                {TIMELINE.map(([a, b]) => (
                                    <li key={a}><strong>{a}</strong><span className="small">{b}</span></li>
                                ))}
                            </ol>
                        </div>
                        <div className="stack" style={{ "--gap": "12px" }}>
                            <h2 className="h3">Documents</h2>
                            <ul className="checklist">
                                {DOCUMENTS.map(([a, b]) => (
                                    <li key={a}>
                                        <span className="tick"><Icon name="file" size={14} /></span>
                                        <span className="between real-estate-project-doc"><span>{a}</span><span className={`fine ${b.includes("TODO") ? "todo" : ""}`}>{b}</span></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                    <div id="invest">
                        <InterestForm dev={dev} />
                    </div>
                </div>
            </Section>

            {others.length > 0 && (
                <Section tone="sheet" seed={6} id="others">
                    <div className="between real-estate-project-others-head">
                        <h2 className="h2">Other developments</h2>
                        <Link to="/real-estate" className="link">All developments <Icon name="arrow" size={16} /></Link>
                    </div>
                    <ul className="grid-3 real-estate-project-others">
                        {others.map((o, i) => (
                            <Reveal as="li" key={o.slug} delay={i * 0.06}>
                                <Link to={`/real-estate/${o.slug}`} className="card real-estate-project-other-card">
                                    <Photo name={imageName(o.images?.[0])} alt={o.images?.[0]?.alt || "[Render]"} ratio="16 / 10" />
                                    <span className="stack" style={{ "--gap": "6px", padding: "16px 18px 20px" }}>
                                        <span className="tag" style={{ alignSelf: "flex-start" }}>{devStatusLabel(o.status)}</span>
                                        <strong className="h4">{o.title}</strong>
                                        <span className="small">{o.kind || o.location || "[location]"}</span>
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

import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContent } from "../hooks/useContent";
import { useShowLink } from "../hooks/useSite";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Photo, imageName } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { formatUGX } from "../lib/money";
import { sendInvestorLead } from "../lib/forms";
import { DEV_STATUSES, devStatusLabel, isSampleDev } from "../data/developments";
import "./RealEstate.css";

const LEVELS = [
    {
        level: "Level 1",
        title: "Community investor",
        text: "For members of the Formcraft community and first-time investors.",
        points: ["Crowdfund from UGX [min] per development", "Pay by mobile money or bank", "Project summaries and progress updates"],
        todo: "TODO: limits per person",
    },
    {
        level: "Level 2",
        title: "Verified investor",
        text: "Identity checked; full access to each development's numbers.",
        points: ["Tickets from UGX [min]", "Financial model, drawings and cost plan", "Quarterly reports and site visits"],
    },
    {
        level: "Level 3",
        title: "Partner investor",
        text: "Institutions, companies and lead investors.",
        points: ["Fund a whole phase or development", "Data room and direct meetings", "Terms agreed one to one"],
    },
];

const HOW = [
    ["Create an account", "Join as a community investor."],
    ["Verify your identity", "ID and proof of address to unlock full details and larger tickets."],
    ["Choose and commit", "Read the documents, sign the agreement and pay. Funds are held until the raise closes — TODO: escrow arrangement."],
    ["Follow the build, earn returns", "Progress from site and the model; returns paid as set out in the terms."],
];

const money = (v, fallback = "UGX [n]") => (Number.isInteger(v) ? formatUGX(v) : fallback);

const InterestForm = () => {
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
                ticketSize: form.get("level"),
                message: `[Real estate] ${form.get("message") || ""}`.trim(),
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
                <h3 className="h3">Thanks — we've got it.</h3>
                <p className="body">The Real Estate team will be in touch. <span className="todo">TODO: confirm reply time.</span></p>
                <button type="button" className="btn btn-ink btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setStatus("idle")}>Send another</button>
            </div>
        );
    }
    return (
        <form className="card card-pad form" onSubmit={onSubmit}>
            <h3 className="h3">Talk to the Real Estate team</h3>
            <div className="form-row">
                <div className="field">
                    <label htmlFor="re-name">Name</label>
                    <input id="re-name" name="name" autoComplete="name" required maxLength={120} />
                </div>
                <div className="field">
                    <label htmlFor="re-email">Email</label>
                    <input id="re-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                </div>
            </div>
            <div className="form-row">
                <div className="field">
                    <label htmlFor="re-org">Organisation (optional)</label>
                    <input id="re-org" name="org" autoComplete="organization" maxLength={200} />
                </div>
                <div className="field">
                    <label htmlFor="re-level">I'm interested as</label>
                    <select id="re-level" name="level" defaultValue="Community investor">
                        {LEVELS.map((l) => <option key={l.title}>{l.title}</option>)}
                    </select>
                </div>
            </div>
            <div className="field">
                <label htmlFor="re-message">Message (optional)</label>
                <textarea id="re-message" name="message" maxLength={4900} />
            </div>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            <div className="row">
                <button type="submit" className="btn btn-primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send"}</button>
                <span className="fine">We use your details only to reply to you.</span>
            </div>
        </form>
    );
};

export const RealEstate = () => {
    usePageMeta("Real estate", "Rental apartments, hostels and homes designed by Formcraft Studio and built by Formcraft Construction. Back a development and share in its returns.");
    const show = useShowLink();
    const { items, loading } = useContent("developments");
    const [stage, setStage] = useState("all");
    const shown = items.filter((d) => stage === "all" || d.status === stage);
    const samples = items.some(isSampleDev);

    return (
        <div className="real-estate">
            <PageHero motif="estate" sceneHeight={360} eyebrow="Formcraft Real Estate" title="Invest in the buildings we design and build." sheet="I102" seed={61}
                crumbs={[["/", "Home"], [null, "Real estate"]]}
                lead="Rental apartments, hostels and homes planned by Formcraft — designed by our Studio, built by our Construction team with our own concrete and joinery. Back a development and share in its returns.">
                <a href="#developments" className="btn btn-primary">See the developments <Icon name="arrow" size={18} /></a>
                <a href="#how" className="btn btn-line">How investing works</a>
            </PageHero>

            <Section tone="sheet" seed={2} small id="facts">
                <dl className="kpis">
                    <div><dt className="fine">Developments planned</dt><dd className="h3">[n]</dd></div>
                    <div><dt className="fine">Raised from investors</dt><dd className="h3">UGX [n]</dd></div>
                    <div><dt className="fine">Led by</dt><dd className="h4">Peter Isingoma</dd><dd className="small">Co-Founder &amp; Real Estate Lead</dd></div>
                </dl>
            </Section>

            <Section tone="ground" seed={4} id="developments">
                <SectionHead eyebrow="Developments" title="Designed, planned and ready to fund." />
                <div className="between real-estate-bar">
                    <div className="row" role="group" aria-label="Filter by stage" style={{ "--gap": "8px" }}>
                        {DEV_STATUSES.map((s) => (
                            <button key={s.id} type="button" className="chip" aria-pressed={stage === s.id} onClick={() => setStage(s.id)}>{s.label}</button>
                        ))}
                    </div>
                    <p className="fine" aria-live="polite">{shown.length} development{shown.length === 1 ? "" : "s"}</p>
                </div>
                {loading ? (
                    <div className="real-estate-grid" aria-busy="true">
                        {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}
                    </div>
                ) : shown.length === 0 ? (
                    <p className="body real-estate-empty">No developments at this stage yet.</p>
                ) : (
                    <ul className="real-estate-grid">
                        {shown.map((d, i) => (
                            <Reveal as="li" key={d.slug} delay={(i % 3) * 0.06}>
                                <article className="card real-estate-card">
                                    <Photo name={imageName(d.images?.[0])} alt={d.images?.[0]?.alt || `[Render: ${d.kind || d.title}]`} ratio="16 / 10" />
                                    <div className="real-estate-card-body">
                                        <div className="row" style={{ "--gap": "6px" }}>
                                            <span className={`tag real-estate-status is-${d.status}`}>{devStatusLabel(d.status)}</span>
                                            {isSampleDev(d) && <span className="tag">Sample</span>}
                                            {d.hidden && <span className="tag">Hidden</span>}
                                        </div>
                                        <p className="fine">{d.kind ? `${d.kind} · ` : ""}{d.location || "[location]"}</p>
                                        <h3 className="h4"><Link to={`/real-estate/${d.slug}`} className="real-estate-card-link">{d.title}</Link></h3>
                                        <dl className="real-estate-facts">
                                            <div><dt className="fine">Units</dt><dd>{d.units ?? "[n]"}</dd></div>
                                            <div><dt className="fine">Units from</dt><dd>{money(d.unitFromUGX)}</dd></div>
                                            <div><dt className="fine">Min. ticket</dt><dd>{money(d.minInvestUGX)}</dd></div>
                                            <div><dt className="fine">Completion</dt><dd>{d.completion || "[date]"}</dd></div>
                                        </dl>
                                        <p className="fine">Target return [x]% a year · <span className="todo">shown once terms are approved</span></p>
                                        <Link to={`/real-estate/${d.slug}`} className="link real-estate-view">View <Icon name="arrow" size={16} /></Link>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </ul>
                )}
                {samples && <p className="fine real-estate-note">Sample listings. Figures appear when each development's plans, costs and terms are approved.</p>}
            </Section>

            <Section tone="sheet" seed={6} id="levels">
                <SectionHead eyebrow="Investor levels" title="Start small, or come in as a partner.">
                    What you can see and how much you can invest depends on your level. Moving up means verifying who you are — that protects you and every other investor.
                </SectionHead>
                <ul className="grid-3 real-estate-levels">
                    {LEVELS.map((l, i) => (
                        <Reveal as="li" key={l.title} delay={i * 0.06} className={`card card-pad stack ${i === 1 ? "real-estate-level-main" : ""}`} style={{ "--gap": "12px" }}>
                            <div className="between" style={{ alignItems: "center" }}>
                                <span className="fine">{l.level}</span>
                                {i === 1 && <span className="tag tag-accent">Most investors</span>}
                            </div>
                            <h3 className="h3">{l.title}</h3>
                            <p className="small">{l.text}</p>
                            <ul className="checklist">
                                {l.points.map((p) => (
                                    <li key={p}><span className="tick"><Icon name="check" size={14} /></span><span className="small">{p}</span></li>
                                ))}
                            </ul>
                            {l.todo && <p className="fine todo">{l.todo}</p>}
                        </Reveal>
                    ))}
                </ul>
            </Section>

            <Section tone="ground" seed={8} id="how">
                <SectionHead eyebrow="Investing" title="How it works." />
                <ol className="steps real-estate-steps">
                    {HOW.map(([title, text], i) => (
                        <Reveal as="li" key={title} delay={i * 0.06} className="card step">
                            <h3 className="h4">{title}</h3>
                            <p className="small">
                                {text.split("TODO")[0]}
                                {text.includes("TODO") && <span className="todo">TODO{text.split("TODO")[1]}</span>}
                            </p>
                        </Reveal>
                    ))}
                </ol>
                <div className="alert alert-error real-estate-risk" role="note">
                    <p className="small"><strong>Your capital is at risk.</strong> Property investments can lose value, returns are not guaranteed and you may not be able to sell early.</p>
                    <p className="fine todo">TODO: approval or licensing from the Capital Markets Authority of Uganda (or the right exemption), and final risk wording from a lawyer, before any investment is offered. Nothing on this page is an offer to sell securities.</p>
                </div>
            </Section>

            <Section tone="sheet" seed={10} id="talk">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Register your interest</p>
                        <h2 className="h2">Hear first when a development opens.</h2>
                        <p className="body">Investing isn't open on the site yet. Leave your details and the Real Estate team will contact you when the first development's terms are approved.</p>
                    </Reveal>
                    <InterestForm />
                </div>
            </Section>

            {show("/invest") && (
                <Section tone="dark" seed={12} small id="company">
                    <div className="between" style={{ alignItems: "center" }}>
                        <div className="stack" style={{ "--gap": "10px" }}>
                            <h2 className="h2">Want to invest in Formcraft itself?</h2>
                            <p className="body">The company roadmap, targets and investor pack are on a separate page.</p>
                        </div>
                        <Link to="/invest" className="btn btn-primary">Invest in Formcraft <Icon name="arrow" size={18} /></Link>
                    </div>
                </Section>
            )}
        </div>
    );
};

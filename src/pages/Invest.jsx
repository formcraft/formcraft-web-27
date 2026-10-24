// Invest page (/invest). Invest in Formcraft: the 2028 targets, the opportunity, the roadmap 2023 → 2028, property
// schemes, and the investor-pack request form. Keeps "Nothing on this page is an offer to sell securities"
// visible to everyone.
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useShowLink } from "../hooks/useSite";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { sendInvestorLead } from "../lib/forms";
import { Honeypot } from "../components/forms/Honeypot";
import { Todo } from "../components/ui/Todo";
import "./Invest.css";

const TARGETS = [
    ["$1M", "annual revenue target by 2028"],
    ["20%", "of profits reinvested in artisan development"],
    ["Kenya · Rwanda · South Africa", "regional expansion planned"],
];

const MARKETS = [
    ["Professional and B2B clients", "Developers, engineers and contractors who need design, pre-construction, BIM and precast supply."],
    ["Homeowners and furniture buyers", "Template homes for 50 × 100 ft plots, custom builds, furniture and joinery."],
    ["Artisans and member investors", "A community that makes the work and can share in the developments."],
];

const ROADMAP = [
    ["2023", "First custom furniture piece — the design-craft idea, proven."],
    ["2025", "Formal launch; architectural project work begins."],
    ["2026", "Registered as Formcraft Design and Construction Co. Ltd."],
    ["Next", "10 new design contracts, a doubled artisan network, flagship trade training programmes."],
    ["2028", "$1M annual revenue, 20% of profits reinvested in artisans, operations across East Africa."],
];

const INTERESTS = ["Investing in Formcraft", "Member property scheme", "Partnership"];
const TICKETS = ["Prefer not to say", "Under USD 10,000", "USD 10,000 – 50,000", "USD 50,000 – 250,000", "Over USD 250,000"];

const PackForm = ({ show }) => {
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setStatus("sending");
        setError(null);
        try {
            await sendInvestorLead({
                website: form.get("website"),
                name: form.get("name"),
                org: form.get("org"),
                email: form.get("email"),
                ticketSize: form.get("ticket"),
                message: [`Interest: ${form.get("interest")}`, form.get("message")].filter(Boolean).join("\n\n"),
            });
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again, or call us.");
            setStatus("error");
        }
    };

    if (status === "sent") {
        return (
            <div className="card card-pad stack" role="status" style={{ "--gap": "14px" }}>
                <span className="checklist"><span className="tick"><Icon name="check" size={16} /></span></span>
                <h3 className="h3">Request received.</h3>
                <p className="body">We'll be in touch for a short call, then email you a private link to the investor pack.</p>
                <div className="row">
                    {show("/real-estate") && <Link to="/real-estate" className="btn btn-line btn-sm">See the developments</Link>}
                    {show("/about") && <Link to="/about" className="btn btn-line btn-sm">About Formcraft</Link>}
                    <button type="button" className="btn btn-ink btn-sm" onClick={() => setStatus("idle")}>Send another</button>
                </div>
            </div>
        );
    }

    return (
        <form className="card card-pad form" onSubmit={onSubmit}>
            <Honeypot />
            <h3 className="h3">Request the investor pack</h3>
            <div className="form-row">
                <div className="field">
                    <label htmlFor="invest-name">Name</label>
                    <input id="invest-name" name="name" autoComplete="name" required maxLength={120} />
                </div>
                <div className="field">
                    <label htmlFor="invest-org">Organisation</label>
                    <input id="invest-org" name="org" autoComplete="organization" maxLength={200} />
                </div>
            </div>
            <div className="field">
                <label htmlFor="invest-email">Email</label>
                <input id="invest-email" name="email" type="email" autoComplete="email" required maxLength={200} />
            </div>
            <div className="form-row">
                <div className="field">
                    <label htmlFor="invest-interest">Interest</label>
                    <select id="invest-interest" name="interest" defaultValue={INTERESTS[0]}>
                        {INTERESTS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="invest-ticket">Ticket size (optional)</label>
                    <select id="invest-ticket" name="ticket" defaultValue={TICKETS[0]}>
                        {TICKETS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                </div>
            </div>
            <div className="field">
                <label htmlFor="invest-message">Message</label>
                <textarea id="invest-message" name="message" maxLength={4800} />
            </div>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            <div className="row">
                <button type="submit" className="btn btn-primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Request the pack"}</button>
                <span className="fine">We use your details only to reply to you.</span>
            </div>
        </form>
    );
};

/** The Invest page. Rendered by src/routes.jsx for /invest. */
export const Invest = () => {
    usePageMeta("Invest in Formcraft", "Formcraft's vision, roadmap from 2023 to 2028 and targets: $1M annual revenue and 20% of profits reinvested in artisans. Request the investor pack.");
    const show = useShowLink();

    return (
        <div className="invest">
            <PageHero motif="estate" sceneHeight={360} eyebrow="Invest in Formcraft" title="Africa's built environment, designed and made locally." sheet="I101" seed={65}
                crumbs={[["/", "Home"], [null, "Invest"]]}
                lead="Our vision is to become Africa's leading design-build firm — transforming spaces and uplifting communities by integrating traditional craftsmanship with modern design.">
                <a href="#pack" className="btn btn-primary">Request the investor pack <Icon name="arrow" size={18} /></a>
                <a href="#roadmap" className="btn btn-line">See the roadmap</a>
            </PageHero>

            <Section tone="sheet" seed={2} small id="targets">
                <dl className="kpis invest-targets">
                    {TARGETS.map(([big, small]) => (
                        <div key={small}>
                            <dt className="h3">{big}</dt>
                            <dd className="small">{small}</dd>
                        </div>
                    ))}
                </dl>
            </Section>

            <Section tone="ground" seed={4} id="opportunity">
                <SectionHead eyebrow="The opportunity" title="One value chain, from survey to joinery.">
                    Formcraft connects architectural design, structural engineering, concrete manufacturing, bespoke joinery and sustainable real estate. Clients get single-source accountability, predictable costs and precision; artisans get fair work.
                </SectionHead>
                <p className="body invest-markets-intro">We serve three markets across East Africa:</p>
                <ul className="grid-3 invest-markets">
                    {MARKETS.map(([title, text], i) => (
                        <Reveal as="li" key={title} delay={i * 0.06} className="card card-pad stack" style={{ "--gap": "8px" }}>
                            <h3 className="h4">{title}</h3>
                            <p className="small">{text}</p>
                        </Reveal>
                    ))}
                </ul>
                <Todo as="p">TODO: market size, revenue to date and unit economics (in the investor pack).</Todo>
            </Section>

            <Section tone="dark" seed={6} id="roadmap">
                <SectionHead eyebrow="2023 → 2028" title="Roadmap." />
                <ol className="invest-roadmap">
                    {ROADMAP.map(([year, text], i) => (
                        <Reveal as="li" key={year} delay={i * 0.06} className={year === "2028" ? "is-target" : ""}>
                            <span className="invest-roadmap-year">{year}</span>
                            <p className="small">{text}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            <Section tone="sheet" seed={8} id="schemes">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Real estate</p>
                        <h2 className="h2">Or invest in a single development.</h2>
                        <p className="body">Formcraft plans rental apartments, hostels and homes that investors can back one development at a time — from community crowdfunding to partner investment.</p>
                        <p className="small">Member property schemes let people in the Formcraft community take part too. <Todo>TODO: scheme terms (in the investor pack).</Todo></p>
                        {show("/real-estate") && (
                            <Link to="/real-estate" className="btn btn-ink" style={{ alignSelf: "flex-start" }}>See the developments <Icon name="arrow" size={18} /></Link>
                        )}
                    </Reveal>
                    <Reveal delay={0.1}>
                        <Photo name={null} alt="[Render: a Formcraft property scheme]" ratio="16 / 10" className="tilt-r" />
                    </Reveal>
                </div>
            </Section>

            <Section tone="ground" seed={10} id="pack">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Investor pack</p>
                        <h2 className="h2">Get the full picture.</h2>
                        <p className="body">Financials, the pipeline and the scheme terms are in the investor pack. Tell us who you are and we'll send a private link.</p>
                        <p className="fine">Nothing on this page is an offer to sell securities. <Todo>TODO: final disclaimer from a lawyer.</Todo></p>
                    </Reveal>
                    <PackForm show={show} />
                </div>
            </Section>

            {show("/real-estate") && (
                <Section tone="orange" seed={12} small id="one-building">
                    <div className="between" style={{ alignItems: "center" }}>
                        <div className="stack" style={{ "--gap": "10px" }}>
                            <h2 className="h2">Prefer to back one building?</h2>
                            <p className="body">Crowdfund or invest in a Formcraft development, with returns set out per project.</p>
                        </div>
                        <Link to="/real-estate" className="btn btn-ink">Real estate developments <Icon name="arrow" size={18} /></Link>
                    </div>
                </Section>
            )}
        </div>
    );
};

// Community page (/community). The Formcraft community for artisans, creatives and students: why join, the artisan
// directory, jobs and commissions, events and workshops (book a place), and the join form. Until there are
// real members, jobs and dated events, visitors see honest empty states; the team sees the samples.
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContent } from "../hooks/useContent";
import { usePublicDoc } from "../hooks/usePublicDoc";
import { useShowLink } from "../hooks/useSite";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { sendInterest } from "../lib/forms";
import { Honeypot } from "../components/forms/Honeypot";
import { formatUGX } from "../lib/money";
import { Todo, Fact } from "../components/ui/Todo";
import { known } from "../lib/pending";
import { useSeesTodos } from "../hooks/useSeesTodos";
import "./Community.css";

const BENEFITS = [
    { title: "Fair pricing", text: "The price of the work is agreed up front, so you're paid properly for your time and skill." },
    { title: "Machinery & workshop", text: "Shared workshop facilities and machines that are hard to afford alone." },
    { title: "A steady market", text: "Commissions from Stores customers and fit-outs on Formcraft projects." },
];

const TRADE_FILTERS = [
    ["all", "All"],
    ["Carpenter", "Carpenters"],
    ["Welder", "Welders"],
    ["Sculptor", "Sculptors"],
    ["Designer", "Designers"],
];
// Sample cards only: the directory shows real, approved members once profiles exist (Phase 4).
const SAMPLE_MAKERS = ["Carpenter", "Carpenter", "Welder", "Sculptor", "Designer", "Carpenter", "Welder", "Designer"];

const SAMPLE_JOBS = [
    ["Carpentry", "Open"],
    ["Welding", "Open"],
    ["Sculpture", "Closing soon"],
    ["Joinery", "Awarded"],
];

const TRADES = ["Carpenter", "Welder", "Sculptor", "Upholsterer", "Designer", "Student", "Other"];

const JOIN_STEPS = [
    "Sign up with your trade and a few photos of your work",
    "We meet you and approve your profile",
    "Take on Stores orders and project commissions",
];

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
};

// Small "send" helper shared by both forms on this page
const useSend = () => {
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);
    const send = async (payload) => {
        setStatus("sending");
        setError(null);
        try {
            await sendInterest(payload);
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again, or call us.");
            setStatus("error");
        }
    };
    return { status, error, send, reset: () => setStatus("idle") };
};

/** The Community page. Rendered by src/routes.jsx for /community. */
export const Community = () => {
    usePageMeta("Community", "Join the Formcraft community: carpenters, welders, sculptors, designers and students working with Formcraft as equals — fair pricing, shared machinery and a steady market.");
    const show = useShowLink();
    const { data: stats } = usePublicDoc("stats/public");
    const { items: allEvents, loading: eventsLoading } = useContent("events");
    // visitors see scheduled events only; sample events (no date yet) are for the team
    const events = useSeesTodos() ? allEvents : allEvents.filter((e) => formatDate(e.date));
    const [trade, setTrade] = useState("all");
    const [eventSlug, setEventSlug] = useState("");
    const eventSelect = useRef(null);
    const join = useSend();
    const booking = useSend();

    const makers = SAMPLE_MAKERS.filter((m) => trade === "all" || m === trade);
    const artisans = Number.isInteger(stats?.artisans) ? stats.artisans.toLocaleString("en-UG") : null;
    const seesTodos = useSeesTodos(); // the team also sees the sample makers, jobs and numbers

    const bookPlace = (slug) => {
        setEventSlug(slug);
        booking.reset();
        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
        // Focus once the scroll has started, so keyboard users land in the form
        window.setTimeout(() => eventSelect.current?.focus({ preventScroll: true }), 300);
    };

    const onJoin = (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const body = [
            `Trade: ${f.get("trade")}`,
            `Phone: ${f.get("phone") || "—"}`,
            `Where they work: ${f.get("area") || "—"}`,
            `Photos of their work: ${f.get("photos") || "—"}`,
            "",
            String(f.get("about") || ""),
        ].join("\n");
        join.send({ topic: "Community sign-up", name: f.get("name"), email: f.get("email"), body, website: f.get("website") });
    };

    const onBook = (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const chosen = events.find((e) => e.slug === f.get("event"));
        const title = chosen?.title ?? "an event";
        const body = [`Place at: ${title}${chosen?.date ? ` (${formatDate(chosen.date)})` : ""}`, `Places: ${f.get("places") || 1}`, `Phone: ${f.get("phone") || "—"}`].join("\n");
        booking.send({ topic: `Event: ${title}`, name: f.get("name"), email: f.get("email"), body, website: f.get("website") });
    };

    return (
        <div className="community">
            <PageHero motif="market" sheet="C101" seed={101} eyebrow="The Formcraft community" crumbs={[["/", "Home"], [null, "Community"]]}
                title="Formcraft sets the market for the work — you focus on the craft."
                lead="Carpenters, welders, sculptors, designers and students, working with Formcraft as equals. Fair pricing, shared machinery and a steady market for what you make.">
                <a href="#join" className="btn btn-primary">Join the community <Icon name="arrow" size={18} /></a>
                <a href="#jobs" className="btn btn-line">See open commissions</a>
            </PageHero>

            {/* Live numbers: shown once there's a real count (never placeholders for visitors) */}
            {(artisans || seesTodos) && (
            <Section tone="sheet" seed={2} small id="numbers">
                <dl className="kpis community-kpis">
                    <div>
                        <dt className="fine">Artisans in the network</dt>
                        <dd className="h3">{artisans ?? <Todo>TODO: artisan count (Firestore stats/public)</Todo>}</dd>
                    </div>
                    {seesTodos && (
                        <div>
                            <dt className="fine">Commissions this year</dt>
                            <dd className="h3"><Todo>TODO: commissions count from Firestore stats once Cloud Functions write it.</Todo></dd>
                        </div>
                    )}
                </dl>
            </Section>
            )}

            <Section tone="ground" seed={3} id="why">
                <SectionHead eyebrow="Why join" title="What you get as a member." />
                <ol className="community-benefits">
                    {BENEFITS.map((b, i) => (
                        <Reveal as="li" key={b.title} delay={i * 0.06} className="card card-pad community-benefit">
                            <span className="community-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                            <h3 className="h4">{b.title}</h3>
                            <p className="small">{b.text}</p>
                        </Reveal>
                    ))}
                    <Reveal as="li" delay={0.18} className="card card-pad community-benefit">
                        <span className="community-num" aria-hidden="true">04</span>
                        <h3 className="h4">Skills training</h3>
                        <p className="small">
                            Workshops and courses
                            {show("/academy") ? <> through the <Link to="/academy" className="link">Formcraft Academy</Link>.</> : " for members."}
                        </p>
                    </Reveal>
                </ol>
            </Section>

            <Section tone="sheet" seed={4} id="directory">
                <SectionHead eyebrow="Artisan directory" title="Find a maker.">
                    <p>Only approved members appear here, with their consent.</p>
                </SectionHead>
                <div className="between community-bar">
                    <div className="row" role="group" aria-label="Filter makers by trade" style={{ "--gap": "8px" }}>
                        {TRADE_FILTERS.map(([id, label]) => (
                            <button key={id} type="button" className="chip" aria-pressed={trade === id} onClick={() => setTrade(id)}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {seesTodos && <p className="fine" aria-live="polite">{makers.length} sample profile{makers.length === 1 ? "" : "s"}</p>}
                </div>
                {!seesTodos ? (
                    <div className="card card-pad stack community-empty" style={{ "--gap": "10px" }}>
                        <h3 className="h4">The directory opens with the first approved members.</h3>
                        <p className="small">Makers appear here with their consent, once they've joined and been approved. Want to be listed? <a href="#join" className="link">Join below</a>.</p>
                    </div>
                ) : (
                <ul className="grid-4 community-makers">
                    {makers.map((m, i) => (
                        <li key={`${m}-${i}`} className="card community-maker">
                            <div className="placeholder community-maker-photo">[Photo of the maker at work]</div>
                            <div className="community-maker-body">
                                <span className="tag">Sample</span>
                                <h3 className="h4">[Artisan name]</h3>
                                <p className="small">{m} · [area of Kampala]</p>
                            </div>
                        </li>
                    ))}
                </ul>
                )}
                <div className="between community-after">
                    <Todo as="p">TODO: real profiles, shared with each maker's consent.</Todo>
                    <Link to="/contact" className="link">Ask us to find a maker <Icon name="arrow" size={16} /></Link>
                </div>
            </Section>

            <Section tone="ground" seed={5} id="jobs">
                <SectionHead eyebrow="Jobs & commissions" title="Open work.">
                    <p>Approved members and the Formcraft team post jobs. Posting opens with member accounts.</p>
                </SectionHead>
                {!seesTodos ? (
                    <div className="card card-pad stack community-empty" style={{ "--gap": "10px" }}>
                        <h3 className="h4">No open commissions listed yet.</h3>
                        <p className="small">Members will post jobs here once member accounts open. <a href="#join" className="link">Join the community</a> to hear about them first.</p>
                    </div>
                ) : (
                <div className="table-wrap card" role="region" aria-label="Open jobs and commissions (sample rows)" tabIndex={0}>
                    <table className="table">
                        <caption className="fine community-caption">Sample rows — real jobs appear here once members can post.</caption>
                        <thead>
                            <tr>
                                <th scope="col">Job</th>
                                <th scope="col">Trade</th>
                                <th scope="col">Budget</th>
                                <th scope="col">Deadline</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SAMPLE_JOBS.map(([t, s], i) => (
                                <tr key={i}>
                                    <td>[Job title]</td>
                                    <td>{t}</td>
                                    <td>UGX [budget]</td>
                                    <td>[date]</td>
                                    <td><span className={`tag ${s === "Open" ? "tag-accent" : ""}`}>{s}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </Section>

            <Section tone="sheet" seed={6} id="events">
                <SectionHead eyebrow="Events & workshops" title="Come to the workshop." />
                {eventsLoading && events.length === 0 ? (
                    <div className="grid-3" aria-hidden="true">
                        {[0, 1, 2].map((i) => <div key={i} className="skeleton community-skeleton" />)}
                    </div>
                ) : events.length === 0 ? (
                    <p className="body">No events planned right now. Join the community and we'll tell you when the next one is on.</p>
                ) : (
                    <ul className="grid-3 community-events">
                        {events.map((e, i) => (
                            <Reveal as="li" key={e.slug} delay={(i % 3) * 0.06} className="card card-pad community-event">
                                <div className="between" style={{ alignItems: "center" }}>
                                    <p className="eyebrow">{formatDate(e.date) ?? <Todo>TODO: date</Todo>}</p>
                                    {e.hidden && <span className="tag">Hidden</span>}
                                </div>
                                <h3 className="h4">{e.title}</h3>
                                <Fact as="p" className="small" text={e.summary} />
                                <p className="fine">
                                    {/* venue · places · price, from whatever is known */}
                                    {[known(e.venue), Number.isInteger(e.capacity) && `${e.capacity} places`, e.priceUGX === 0 ? "Free" : formatUGX(e.priceUGX)].filter(Boolean).join(" · ")}
                                </p>
                                <button type="button" className="btn btn-line btn-sm community-book" onClick={() => bookPlace(e.slug)}>
                                    Book a place
                                </button>
                            </Reveal>
                        ))}
                    </ul>
                )}

                {events.length > 0 && (
                    <div id="book" className="community-book-wrap">
                        {booking.status === "sent" ? (
                            <div className="card card-pad stack" role="status" style={{ "--gap": "12px" }}>
                                <h3 className="h3">Request sent.</h3>
                                <p className="body">We'll confirm your place by email or phone. Paid places are paid for once payments open.</p>
                                <div className="row">
                                    <button type="button" className="btn btn-ink btn-sm" onClick={booking.reset}>Book another</button>
                                </div>
                            </div>
                        ) : (
                            <form className="card card-pad form" onSubmit={onBook}>
                                <Honeypot />
                                <div className="stack" style={{ "--gap": "6px" }}>
                                    <h3 className="h3">Ask for a place</h3>
                                    <p className="small">We confirm places by email or phone. Online payment for paid events opens later (Flutterwave: MTN, Airtel or card).</p>
                                </div>
                                <div className="field">
                                    <label htmlFor="cb-event">Event</label>
                                    <select id="cb-event" name="event" ref={eventSelect} value={eventSlug || events[0].slug} onChange={(ev) => setEventSlug(ev.target.value)}>
                                        {events.map((e) => (
                                            <option key={e.slug} value={e.slug}>{e.title}{e.date ? ` — ${formatDate(e.date)}` : ""}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="field">
                                        <label htmlFor="cb-name">Name</label>
                                        <input id="cb-name" name="name" autoComplete="name" required maxLength={120} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="cb-email">Email</label>
                                        <input id="cb-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="field">
                                        <label htmlFor="cb-phone">Phone (optional)</label>
                                        <input id="cb-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="cb-places">Places</label>
                                        <input id="cb-places" name="places" type="number" min={1} max={20} defaultValue={1} inputMode="numeric" />
                                    </div>
                                </div>
                                {booking.error && <p className="alert alert-error" role="alert">{booking.error}</p>}
                                <div className="row">
                                    <button type="submit" className="btn btn-primary" disabled={booking.status === "sending"}>
                                        {booking.status === "sending" ? "Sending…" : "Ask for a place"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
                {show("/academy") && (
                    <p className="body community-training">
                        Looking for longer training? <Link to="/academy" className="link">See courses at the Formcraft Academy <Icon name="arrow" size={16} /></Link>
                    </p>
                )}
            </Section>

            <Section tone="dark" seed={7} id="join">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "20px" }}>
                        <p className="eyebrow">Join</p>
                        <h2 className="h2">Bring your craft. We'll bring the work.</h2>
                        <ol className="community-join-steps">
                            {JOIN_STEPS.map((s, i) => (
                                <li key={s} className="row" style={{ "--gap": "14px", flexWrap: "nowrap", alignItems: "flex-start" }}>
                                    <span className="community-join-num" aria-hidden="true">{i + 1}</span>
                                    <span className="body">{s}</span>
                                </li>
                            ))}
                        </ol>
                        <p className="small">Your details stay private. Nothing appears in the directory until we've met you and you've approved your profile.</p>
                    </Reveal>

                    {join.status === "sent" ? (
                        <div className="card card-pad stack" role="status" style={{ "--gap": "14px" }}>
                            <h3 className="h3">Application received.</h3>
                            <p className="body">Thanks. We'll get in touch to meet you and see your work. Member accounts open soon — you'll sign in then to finish your profile before it appears in the directory.</p>
                            <div className="row">
                                {show("/academy") && <Link to="/academy" className="btn btn-line btn-sm">See the Academy</Link>}
                                <button type="button" className="btn btn-ink btn-sm" onClick={join.reset}>Send another</button>
                            </div>
                        </div>
                    ) : (
                        <form className="card card-pad form" onSubmit={onJoin}>
                            <Honeypot />
                            <h3 className="h3">Apply to join</h3>
                            <div className="form-row">
                                <div className="field">
                                    <label htmlFor="cj-name">Name</label>
                                    <input id="cj-name" name="name" autoComplete="name" required maxLength={120} />
                                </div>
                                <div className="field">
                                    <label htmlFor="cj-email">Email</label>
                                    <input id="cj-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="field">
                                    <label htmlFor="cj-phone">Phone</label>
                                    <input id="cj-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
                                </div>
                                <div className="field">
                                    <label htmlFor="cj-trade">Trade</label>
                                    <select id="cj-trade" name="trade" defaultValue="Carpenter">
                                        {TRADES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="cj-area">Where you work</label>
                                <input id="cj-area" name="area" placeholder="Area of Kampala" maxLength={200} />
                            </div>
                            <div className="field">
                                <label htmlFor="cj-about">A few words about your work and skills</label>
                                <textarea id="cj-about" name="about" maxLength={3000} />
                            </div>
                            <div className="field">
                                <label htmlFor="cj-photos">Photos of your work (optional)</label>
                                <input id="cj-photos" name="photos" maxLength={500} aria-describedby="cj-photos-hint" />
                                <span id="cj-photos-hint" className="hint">A link to Instagram, Facebook or a Google Drive folder. Or bring photos when we meet.</span>
                            </div>
                            {join.error && <p className="alert alert-error" role="alert">{join.error}</p>}
                            <div className="row">
                                <button type="submit" className="btn btn-primary" disabled={join.status === "sending"}>
                                    {join.status === "sending" ? "Sending…" : "Apply to join"}
                                </button>
                                <span className="fine">We use your details only to reply to you.</span>
                            </div>
                        </form>
                    )}
                </div>
            </Section>
        </div>
    );
};

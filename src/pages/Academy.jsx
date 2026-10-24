import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContent } from "../hooks/useContent";
import { useShowLink } from "../hooks/useSite";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { sendInterest } from "../lib/forms";
import { formatUGX } from "../lib/money";
import "./Academy.css";

const LEVELS = [
    ["beginner", "Beginner"],
    ["intermediate", "Intermediate"],
    ["advanced", "Advanced"],
];
const levelLabel = (id) => LEVELS.find(([value]) => value === id)?.[1] ?? id;

const ENROL_STEPS = [
    { title: "Choose a course", text: "Pick a course below, or tell us what you'd like to learn." },
    { title: "Tell us who you are", text: "Your name, contact details and your school or employer." },
    { title: "Free courses", text: "We confirm your place by email or phone." },
    { title: "Paid courses", text: "Online payment opens soon: a secure Flutterwave page for MTN, Airtel or card. Your place is confirmed when payment clears. Until then, we reserve your interest and call you." },
];

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
};

const priceText = (price) => (price === 0 ? "Free" : formatUGX(price));

export const Academy = () => {
    usePageMeta("Academy", "Formcraft Academy: BIM and CAD courses, workshop sessions and internships for students and young professionals in Kampala, taught from how Formcraft works on projects.");
    const show = useShowLink();
    const { items: courses, loading } = useContent("courses");
    const [level, setLevel] = useState("all");
    const [selected, setSelected] = useState("");
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);
    const courseSelect = useRef(null);

    const levelsInUse = LEVELS.filter(([id]) => courses.some((c) => c.level === id));
    const shown = courses.filter((c) => level === "all" || c.level === level);
    const current = courses.find((c) => c.slug === selected) ?? courses[0] ?? null;

    const choose = (slug) => {
        setSelected(slug);
        setStatus("idle");
        document.getElementById("enrol")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => courseSelect.current?.focus({ preventScroll: true }), 300);
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const course = courses.find((c) => c.slug === f.get("course"));
        const title = course?.title ?? "a course";
        const body = [
            `Course: ${title}${course?.starts ? ` (starts ${formatDate(course.starts)})` : ""}`,
            `Price shown: ${course ? priceText(course.priceUGX) : "—"}`,
            `Phone: ${f.get("phone") || "—"}`,
            `School or employer: ${f.get("org") || "—"}`,
            "",
            String(f.get("note") || ""),
        ].join("\n");
        setStatus("sending");
        setError(null);
        try {
            await sendInterest({ topic: `Course: ${title}`, name: f.get("name"), email: f.get("email"), body });
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again, or call us.");
            setStatus("error");
        }
    };

    return (
        <div className="academy">
            <PageHero motif="academy" sheet="C102" seed={111} eyebrow="Formcraft Academy" crumbs={[["/", "Home"], [null, "Academy"]]}
                title="Learn the way we design and build."
                lead="BIM and CAD courses, workshop sessions and internships for students and young professionals — taught from how Formcraft actually works on projects.">
                <a href="#courses" className="btn btn-primary">See courses <Icon name="arrow" size={18} /></a>
                <a href="#enrol" className="btn btn-line">Enrol</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="courses">
                <SectionHead eyebrow="Courses" title="Pick a course.">
                    <p>Based on Formcraft's internal training programmes.</p>
                </SectionHead>
                <div className="between academy-bar">
                    {levelsInUse.length > 0 ? (
                        <div className="row" role="group" aria-label="Filter courses by level" style={{ "--gap": "8px" }}>
                            <button type="button" className="chip" aria-pressed={level === "all"} onClick={() => setLevel("all")}>All levels</button>
                            {levelsInUse.map(([id, label]) => (
                                <button key={id} type="button" className="chip" aria-pressed={level === id} onClick={() => setLevel(id)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="fine todo">TODO: set a level on each course in Admin to filter by level.</p>
                    )}
                    <p className="fine" aria-live="polite">{shown.length} course{shown.length === 1 ? "" : "s"}</p>
                </div>

                {loading && courses.length === 0 ? (
                    <div className="grid-3" aria-hidden="true">
                        {[0, 1, 2].map((i) => <div key={i} className="skeleton academy-skeleton" />)}
                    </div>
                ) : shown.length === 0 ? (
                    <p className="body">No courses at this level yet. <button type="button" className="link academy-reset" onClick={() => setLevel("all")}>Show all courses</button></p>
                ) : (
                    <ul className="grid-3 academy-courses">
                        {shown.map((c, i) => {
                            const isSel = current?.slug === c.slug;
                            return (
                                <Reveal as="li" key={c.slug} delay={(i % 3) * 0.06} className={`card card-pad academy-course ${isSel ? "is-selected" : ""}`}>
                                    <div className="row" style={{ "--gap": "6px" }}>
                                        {c.level && <span className="tag">{levelLabel(c.level)}</span>}
                                        {(c.tools ?? []).map((t) => <span key={t} className="tag">{t}</span>)}
                                        {c.hidden && <span className="tag">Hidden</span>}
                                    </div>
                                    <h3 className="h4">{c.title}</h3>
                                    {c.summary && <p className="small">{c.summary}</p>}
                                    <dl className="academy-facts">
                                        <div><dt className="fine">Length</dt><dd className={/^\[/.test(c.duration ?? "") || !c.duration ? "todo" : ""}>{c.duration || "[length]"}</dd></div>
                                        <div><dt className="fine">Next start</dt><dd className={c.starts ? "" : "todo"}>{formatDate(c.starts) ?? "[date]"}</dd></div>
                                        <div><dt className="fine">Price</dt><dd>{priceText(c.priceUGX)}</dd></div>
                                    </dl>
                                    <button type="button" className={`btn btn-sm ${isSel ? "btn-ink" : "btn-line"} academy-choose`} aria-pressed={isSel} onClick={() => choose(c.slug)}>
                                        {isSel ? <>Selected <Icon name="check" size={16} /></> : "Choose this course"}
                                    </button>
                                </Reveal>
                            );
                        })}
                    </ul>
                )}
                <p className="fine todo academy-note">TODO: confirm which courses are open to students, their levels, dates and prices.</p>
            </Section>

            <Section tone="ground" seed={3} id="workshops">
                <SectionHead eyebrow="Workshops & internships" title="Learn on real work." />
                <div className="grid-2">
                    <Reveal className="card card-pad stack" style={{ "--gap": "14px" }}>
                        <Icon name="hammer" size={28} />
                        <h3 className="h3">Workshop sessions</h3>
                        <p className="body">Joinery, finishing and machine skills in the Formcraft workshop, alongside the artisans who make for Stores and our projects.</p>
                        <p className="fine todo">TODO: session dates, length and places.</p>
                        {show("/community") && <Link to="/community#events" className="link academy-link">See upcoming workshops <Icon name="arrow" size={16} /></Link>}
                    </Reveal>
                    <Reveal delay={0.08} className="card card-pad stack" style={{ "--gap": "14px" }}>
                        <Icon name="layers" size={28} />
                        <h3 className="h3">Internships</h3>
                        <p className="body">Work on live projects with Formcraft Studio and the workshop — modelling, drawings and time on site.</p>
                        <p className="fine todo">TODO: intake dates, length and how places are chosen.</p>
                        <a href="#enrol" className="link academy-link">Ask about an internship <Icon name="arrow" size={16} /></a>
                    </Reveal>
                </div>
            </Section>

            <Section tone="sheet" seed={4} id="how">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">How enrolment works</p>
                        <h2 className="h2">Four steps to a place.</h2>
                        <ol className="steps academy-steps">
                            {ENROL_STEPS.map((s) => (
                                <li key={s.title} className="card step">
                                    <h3 className="h4">{s.title}</h3>
                                    <p className="small">{s.text}</p>
                                </li>
                            ))}
                        </ol>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <Photo alt="[Photo: a training session in the studio]" caption="Formcraft Academy" note="TODO: photo" ratio="4 / 3" className="tilt-r" />
                    </Reveal>
                </div>
            </Section>

            <Section tone="dark" seed={5} id="enrol">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Enrol</p>
                        <h2 className="h2">{current ? current.title : "Tell us what you'd like to learn."}</h2>
                        <p className="body">
                            Free courses confirm straight away. Paid courses will take you to a secure Flutterwave page to pay by MTN, Airtel or card once online payment opens — your place is confirmed when payment clears.
                        </p>
                        <p className="small">For now, send your details and we'll call you to reserve a place. Nothing is charged on this page.</p>
                    </Reveal>

                    {status === "sent" ? (
                        <div className="card card-pad stack" role="status" style={{ "--gap": "14px" }}>
                            <h3 className="h3">Request received.</h3>
                            <p className="body">Thanks. We'll be in touch by email or phone to confirm your place and, for paid courses, how to pay.</p>
                            <div className="row">
                                <a href="#courses" className="btn btn-line btn-sm">See all courses</a>
                                <button type="button" className="btn btn-ink btn-sm" onClick={() => setStatus("idle")}>Send another</button>
                            </div>
                        </div>
                    ) : (
                        <form className="card card-pad form" onSubmit={onSubmit}>
                            <h3 className="h3">Your place</h3>
                            <div className="field">
                                <label htmlFor="ae-course">Course</label>
                                <select id="ae-course" name="course" ref={courseSelect} value={current?.slug ?? ""} onChange={(e) => setSelected(e.target.value)} disabled={courses.length === 0}>
                                    {courses.map((c) => (
                                        <option key={c.slug} value={c.slug}>{c.title} — {priceText(c.priceUGX)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="field">
                                    <label htmlFor="ae-name">Name</label>
                                    <input id="ae-name" name="name" autoComplete="name" required maxLength={120} />
                                </div>
                                <div className="field">
                                    <label htmlFor="ae-email">Email</label>
                                    <input id="ae-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="field">
                                    <label htmlFor="ae-phone">Phone</label>
                                    <input id="ae-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
                                </div>
                                <div className="field">
                                    <label htmlFor="ae-org">School or employer</label>
                                    <input id="ae-org" name="org" autoComplete="organization" maxLength={200} />
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="ae-note">Anything we should know? (optional)</label>
                                <textarea id="ae-note" name="note" maxLength={2000} />
                            </div>
                            {error && <p className="alert alert-error" role="alert">{error}</p>}
                            <div className="row">
                                <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
                                    {status === "sending" ? "Sending…" : current?.priceUGX === 0 ? "Enrol" : "Reserve my place"}
                                </button>
                                <span className="fine">No payment is taken here.</span>
                            </div>
                        </form>
                    )}
                </div>
            </Section>
        </div>
    );
};

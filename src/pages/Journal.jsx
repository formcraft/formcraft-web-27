import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContent } from "../hooks/useContent";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { imageName } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { sendInterest } from "../lib/forms";
import "./Journal.css";

// Category values come from CONTENT.posts (admin select); shown with a capital letter.
const CATEGORIES = ["project stories", "community", "workshops", "news"];
const label = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");

const TOPICS = [
    ["Construction", "planning, costs, site"],
    ["BIM", "models, standards, tools"],
    ["Craft", "makers, workshop, materials"],
];

const isUrl = (name) => /^(https?:|\/|blob:)/.test(name);
const src = (name, small) => (isUrl(name) ? name : `/images/${name}${small ? "-800" : ""}.webp`);

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
};

// Planned = not written yet; draft = written but not published
const postState = (p) => (/^\s*TODO/.test(p.body ?? "") ? "Planned" : p.publishedAt ? null : "Draft");

const Cover = ({ post, big = false, eager = false }) => {
    const first = post.images?.[0];
    const name = imageName(first);
    const alt = (typeof first === "object" && first?.alt) || "";
    return name ? (
        <img
            className="journal-cover"
            src={src(name, !big)}
            srcSet={isUrl(name) ? undefined : `${src(name, true)} 800w, ${src(name)} 1600w`}
            sizes={big ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 700px) 100vw, 33vw"}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
        />
    ) : (
        <div className="placeholder journal-cover">[Cover photo]</div>
    );
};

const Byline = ({ post }) => {
    const state = postState(post);
    return (
        <p className="fine journal-byline">
            {post.author ?? <span className="todo">[author]</span>} · {formatDate(post.publishedAt) ?? <span className="todo">[date]</span>}
            {state && <span className="tag journal-state">{state}</span>}
            {post.hidden && <span className="tag">Hidden</span>}
        </p>
    );
};

export const Journal = () => {
    usePageMeta("Journal", "The Formcraft Journal: notes on construction, BIM and craft from real projects in Kampala, written by the team.");
    const { items: posts, loading } = useContent("posts");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);

    const inUse = CATEGORIES.filter((c) => posts.some((p) => p.category === c));
    const shown = posts.filter((p) => category === "all" || p.category === category);
    const featured = shown.find((p) => p.featured) ?? shown[0] ?? null;
    const rest = shown.filter((p) => p !== featured);
    const anyPlanned = posts.some((p) => postState(p) === "Planned");

    const onSubscribe = async (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const topics = f.getAll("topics");
        if (topics.length === 0) {
            setError("Pick at least one topic.");
            setStatus("error");
            return;
        }
        setStatus("sending");
        setError(null);
        try {
            await sendInterest({ topic: "Journal newsletter", name: f.get("name"), email: f.get("email"), body: `Newsletter topics: ${topics.join(", ")}` });
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again.");
            setStatus("error");
        }
    };

    return (
        <div className="journal">
            <PageHero motif="city" sheet="A302" seed={121} eyebrow="The Formcraft Journal" crumbs={[["/", "Home"], [null, "Journal"]]}
                title="Notes on construction, BIM and craft."
                lead="How we price, plan and build — and the people who make it. Written by the team, from real projects in Kampala.">
                <a href="#newsletter" className="btn btn-primary"><Icon name="mail" size={18} /> Get it by email</a>
            </PageHero>

            <Section tone="sheet" seed={2} id="posts">
                <div className="between journal-bar">
                    {inUse.length > 1 ? (
                        <div className="row" role="group" aria-label="Filter posts by category" style={{ "--gap": "8px" }}>
                            <button type="button" className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>All</button>
                            {inUse.map((c) => (
                                <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                                    {label(c)}
                                </button>
                            ))}
                        </div>
                    ) : <span />}
                    <p className="fine" aria-live="polite">{shown.length} post{shown.length === 1 ? "" : "s"}</p>
                </div>
                {anyPlanned && <p className="fine journal-planned">Posts marked “Planned” are topics we're writing up — not published yet.</p>}

                {loading && posts.length === 0 ? (
                    <div className="stack" aria-hidden="true">
                        <div className="skeleton journal-skel-big" />
                        <div className="grid-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton journal-skel" />)}</div>
                    </div>
                ) : !featured ? (
                    <p className="body">No posts here yet. <span className="todo">TODO: first published post.</span></p>
                ) : (
                    <>
                        <Reveal>
                            <Link to={`/journal/${featured.slug}`} className="card journal-featured">
                                <Cover post={featured} big eager />
                                <div className="journal-featured-body">
                                    <p className="eyebrow">{label(featured.category) || "Journal"}</p>
                                    <h2 className="h2">{featured.title}</h2>
                                    {featured.excerpt && <p className="body">{featured.excerpt}</p>}
                                    <Byline post={featured} />
                                    <span className="link journal-read">Read the post <Icon name="arrow" size={16} /></span>
                                </div>
                            </Link>
                        </Reveal>
                        {rest.length > 0 && (
                            <ul className="grid-3 journal-grid">
                                {rest.map((p, i) => (
                                    <Reveal as="li" key={p.slug} delay={(i % 3) * 0.06}>
                                        <Link to={`/journal/${p.slug}`} className="card journal-card">
                                            <Cover post={p} />
                                            <div className="journal-card-body">
                                                <span className="tag">{label(p.category) || "Journal"}</span>
                                                <h3 className="h4">{p.title}</h3>
                                                {p.excerpt && <p className="small">{p.excerpt}</p>}
                                                <Byline post={p} />
                                            </div>
                                        </Link>
                                    </Reveal>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </Section>

            <Section tone="dark" seed={3} id="newsletter">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Newsletter</p>
                        <h2 className="h2">The Journal, in your inbox.</h2>
                        <p className="body">New posts, workshop dates and projects as they finish. Pick the topics you care about. Unsubscribe any time.</p>
                        <p className="fine todo">TODO: how often we send, and which email service we use.</p>
                    </Reveal>
                    {status === "sent" ? (
                        <div className="card card-pad stack" role="status" style={{ "--gap": "14px" }}>
                            <h3 className="h3">You're on the list.</h3>
                            <p className="body">Thanks — we'll send the Journal to your inbox when new posts go up.</p>
                            <div className="row">
                                <button type="button" className="btn btn-ink btn-sm" onClick={() => setStatus("idle")}>Add another email</button>
                            </div>
                        </div>
                    ) : (
                        <form className="card card-pad form" onSubmit={onSubscribe}>
                            <div className="form-row">
                                <div className="field">
                                    <label htmlFor="jn-name">Name</label>
                                    <input id="jn-name" name="name" autoComplete="name" required maxLength={120} />
                                </div>
                                <div className="field">
                                    <label htmlFor="jn-email">Email address</label>
                                    <input id="jn-email" name="email" type="email" autoComplete="email" required maxLength={200} placeholder="you@example.com" />
                                </div>
                            </div>
                            <fieldset className="journal-topics">
                                <legend>Send me posts about</legend>
                                <div className="row" style={{ "--gap": "8px" }}>
                                    {TOPICS.map(([t, hint]) => (
                                        <label key={t} className="chip">
                                            <input type="checkbox" name="topics" value={t} defaultChecked />
                                            {t} <span className="fine">{hint}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            {error && <p className="alert alert-error" role="alert">{error}</p>}
                            <div className="row">
                                <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
                                    {status === "sending" ? "Sending…" : "Subscribe"}
                                </button>
                                <span className="fine">We use your email only to send the Journal.</span>
                            </div>
                        </form>
                    )}
                </div>
            </Section>
        </div>
    );
};

import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContent } from "../hooks/useContent";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { imgName } from "../lib/images";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { SubscribeForm } from "../components/forms/SubscribeForm";
import { useSeesTodos } from "../hooks/useSeesTodos";
import { Todo } from "../components/ui/Todo";
import "./Journal.css";

// Category values come from CONTENT.posts (admin select); shown with a capital letter.
const CATEGORIES = ["project stories", "community", "workshops", "news"];
const label = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");

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
    const name = imgName(first);
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
        <div className="placeholder journal-cover">Cover photo coming soon</div>
    );
};

const Byline = ({ post }) => {
    const seesTodos = useSeesTodos();
    const state = seesTodos ? postState(post) : null;
    return (
        <p className="fine journal-byline">
            {/* "By Formcraft" until a named author is set; the date only once the post has one */}
            {post.author || "Formcraft"}
            {formatDate(post.publishedAt) && <> · {formatDate(post.publishedAt)}</>}
            {state && <span className="tag journal-state">{state}</span>}
            {post.hidden && <span className="tag">Hidden</span>}
        </p>
    );
};

export const Journal = () => {
    usePageMeta("Journal", "The Formcraft Journal: notes on construction, BIM and craft from real projects in Kampala, written by the team.");
    const { items: all, loading } = useContent("posts");
    const seesTodos = useSeesTodos();
    // Visitors see written posts only; topics that are still planned ("TODO" body) are for the team.
    const posts = seesTodos ? all : all.filter((p) => postState(p) !== "Planned");
    const [category, setCategory] = useState("all");

    const inUse = CATEGORIES.filter((c) => posts.some((p) => p.category === c));
    const shown = posts.filter((p) => category === "all" || p.category === category);
    const featured = shown.find((p) => p.featured) ?? shown[0] ?? null;
    const rest = shown.filter((p) => p !== featured);
    const anyPlanned = posts.some((p) => postState(p) === "Planned");

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
                    <p className="body">No posts here yet. <Todo>TODO: first published post.</Todo></p>
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
                        <p className="body">New posts, workshop dates and projects as they finish. Pick what you care about. Unsubscribe any time.</p>
                        <Todo as="p">TODO: how often we send, and which email service we use.</Todo>
                    </Reveal>
                    <SubscribeForm variant="card" defaultInterests={["Journal"]} />
                </div>
            </Section>
        </div>
    );
};

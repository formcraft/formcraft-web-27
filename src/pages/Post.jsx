import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useContentItem } from "../hooks/useContent";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Photo, imageName } from "../components/page/Photo";
import { Icon } from "../components/ui/Icon";
import "./Post.css";

const label = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
};

const isPlanned = (p) => /^\s*TODO/.test(p?.body ?? "");

// Plain-text body: a blank line between paragraphs. "## " starts a subheading;
// a block whose lines all start with "- " is a list.
const Body = ({ text }) =>
    String(text ?? "")
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, i) => {
            if (block.startsWith("## ")) return <h2 key={i} className="h3">{block.slice(3)}</h2>;
            const lines = block.split("\n");
            if (lines.every((l) => /^\s*-\s+/.test(l))) {
                return (
                    <ul key={i} className="post-list">
                        {lines.map((l, j) => <li key={j}>{l.replace(/^\s*-\s+/, "")}</li>)}
                    </ul>
                );
            }
            return <p key={i} className={block.startsWith("TODO") ? "todo" : undefined}>{block}</p>;
        });

const readMinutes = (text) => Math.max(1, Math.round(String(text ?? "").split(/\s+/).filter(Boolean).length / 200));

export const Post = () => {
    const { slug } = useParams();
    const { item: post, loading, items } = useContentItem("posts", slug);
    usePageMeta(post ? post.title : loading ? "Journal" : "Post not found", post?.excerpt);

    if (!post && loading) {
        return (
            <div className="post wrap post-loading" aria-busy="true">
                <div className="skeleton post-skel-title" />
                <div className="skeleton post-skel-line" />
                <div className="skeleton post-skel-img" />
            </div>
        );
    }

    if (!post) {
        return (
            <PageHero eyebrow="The Formcraft Journal" title="We couldn't find that post." sheet="A303" seed={131} crumbs={[["/journal", "Journal"], [null, "Not found"]]}
                lead="It may have moved or not be published yet.">
                <Link to="/journal" className="btn btn-primary"><Icon name="arrowLeft" size={18} /> Back to the Journal</Link>
            </PageHero>
        );
    }

    const planned = isPlanned(post);
    const draft = !planned && !post.publishedAt;
    const first = post.images?.[0];
    const cover = imageName(first);
    const coverAlt = (typeof first === "object" && first?.alt) || post.title;
    const related = [
        ...items.filter((p) => p.slug !== post.slug && p.category === post.category),
        ...items.filter((p) => p.slug !== post.slug && p.category !== post.category),
    ].slice(0, 3);

    return (
        <div className="post">
            <PageHero eyebrow={label(post.category) || "Journal"} title={post.title} lead={post.excerpt} sheet="A303" seed={131} sceneHeight={220}
                crumbs={[["/journal", "Journal"], [null, post.title]]} />

            <Section tone="sheet" seed={2} id="article">
                <article className="post-article">
                    <div className="post-meta">
                        <p className="fine">
                            By {post.author ?? <span className="todo">[author]</span>} · {formatDate(post.publishedAt) ?? <span className="todo">[date]</span>}
                            {!planned && <> · {readMinutes(post.body)} min read</>}
                        </p>
                        <div className="row" style={{ "--gap": "6px" }}>
                            {planned && <span className="tag post-state">Planned — not written yet</span>}
                            {draft && <span className="tag post-state">Draft — for review before publishing</span>}
                            {post.hidden && <span className="tag">Hidden</span>}
                        </div>
                    </div>

                    {cover && <Photo name={cover} alt={coverAlt} caption={coverAlt} ratio="16 / 9" eager sizes="(max-width: 900px) 100vw, 900px" className="post-cover" />}

                    <div className="post-body">
                        <Body text={post.body} />
                    </div>

                    <div className="between post-foot">
                        <Link to="/journal" className="link"><Icon name="arrowLeft" size={16} /> Back to the Journal</Link>
                        <Link to="/journal#newsletter" className="link">Get the Journal by email <Icon name="arrow" size={16} /></Link>
                    </div>
                </article>
            </Section>

            {related.length > 0 && (
                <Section tone="ground" seed={3} id="related">
                    <h2 className="h2 post-related-title">Keep reading</h2>
                    <ul className="grid-3 post-related">
                        {related.map((p) => (
                            <li key={p.slug}>
                                <Link to={`/journal/${p.slug}`} className="card card-pad post-related-card">
                                    <span className="tag">{label(p.category) || "Journal"}</span>
                                    <h3 className="h4">{p.title}</h3>
                                    {isPlanned(p) && <span className="fine">Planned</span>}
                                    <Icon name="arrow" size={18} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { DIVISIONS } from "../data/projects";
import { useContent } from "../hooks/useContent";
import { imgProps, imgAlt } from "../lib/images";
import { Todo, Fact } from "../components/ui/Todo";
import "./Projects.css";

const divisionLabel = (id) => DIVISIONS.find((d) => d.id === id)?.label ?? id;

export const Projects = () => {
    usePageMeta("Projects", "Work Formcraft has designed, built and made: from factory complexes and schools to landscapes and joinery.");
    const [filter, setFilter] = useState("all");
    const { items: projects, loading } = useContent("projects");
    const shown = projects.filter((p) => filter === "all" || (p.divisions ?? []).includes(filter));

    return (
        <div className="projects">
            <PageHero eyebrow="Projects" title="Work we've designed, built and made." sheet="A201" seed={71} crumbs={[["/", "Home"], [null, "Projects"]]}
                lead="Filter by division to see what each part of Formcraft does — most projects use more than one." />

            <Section tone="sheet" seed={2} id="list">
                <div className="between projects-bar">
                    <div className="row" role="group" aria-label="Filter by division" style={{ "--gap": "8px" }}>
                        {DIVISIONS.map((d) => (
                            <button key={d.id} type="button" className="chip" aria-pressed={filter === d.id} onClick={() => setFilter(d.id)}>
                                {d.label}
                            </button>
                        ))}
                    </div>
                    <p className="fine" aria-live="polite">{shown.length} project{shown.length === 1 ? "" : "s"}</p>
                </div>
                {loading ? (
                    <div className="projects-grid">{[0, 1, 2].map((k) => <div key={k} className="skeleton" style={{ aspectRatio: "4 / 3" }} />)}</div>
                ) : shown.length === 0 ? (
                    <p className="body projects-empty">No projects in this division on the site yet. <Todo>TODO: add construction, concrete and joinery case studies.</Todo></p>
                ) : (
                    <div className="projects-grid">
                        {shown.map((p, i) => (
                            <Reveal key={p.slug} delay={(i % 3) * 0.06} className={i === 0 ? "projects-wide" : ""}>
                                <Link to={`/projects/${p.slug}`} className="card projects-card">
                                    <img
                                        {...(imgProps(p.images?.[0], { small: true }) ?? {})}
                                        sizes={i === 0 ? "(max-width: 700px) 100vw, 66vw" : "(max-width: 700px) 100vw, 33vw"}
                                        alt={imgAlt(p.images?.[0], p.title)}
                                        loading={i < 2 ? "eager" : "lazy"}
                                    />
                                    <div className="projects-card-body">
                                        <div className="row" style={{ "--gap": "6px" }}>
                                            {(p.divisions ?? []).map((d) => <span key={d} className="tag">{divisionLabel(d)}</span>)}
                                        </div>
                                        <h2 className="h3">{p.title}</h2>
                                        <Fact as="p" className="small" text={p.summary} />
                                        {p.hidden && <span className="tag">Hidden</span>}
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                )}
            </Section>

            <Section tone="dark" seed={4} small id="cta">
                <div className="between" style={{ alignItems: "center" }}>
                    <div className="stack" style={{ "--gap": "10px" }}>
                        <h2 className="h2">Planning something similar?</h2>
                        <p className="body">Tell us about your plot and budget. We'll show you how we'd approach it and what the design fee would be.</p>
                    </div>
                    <div className="row">
                        <Link to="/studio#quote" className="btn btn-primary">Request a quote <Icon name="arrow" size={18} /></Link>
                        <Link to="/studio#fees" className="btn btn-line">How we charge</Link>
                    </div>
                </div>
            </Section>
        </div>
    );
};

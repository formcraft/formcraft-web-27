// ProjectPage page (/projects/:slug). One project's case study: summary, render gallery, the facts that are known
// (client, location and year appear once confirmed), the brief and what Formcraft did, and the next project.
import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { Section } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { DIVISIONS } from "../data/projects";
import { useContentItem } from "../hooks/useContent";
import { imgName, imgAlt } from "../lib/images";
import { NotFound } from "./NotFound";
import { Todo, Fact } from "../components/ui/Todo";
import { useSeesTodos } from "../hooks/useSeesTodos";
import { known } from "../lib/pending";
import "./ProjectPage.css";

/** The ProjectPage page. Rendered by src/routes.jsx for /projects/:slug. */
export const ProjectPage = () => {
    const { slug } = useParams();
    const { item: project, items: projects, loading } = useContentItem("projects", slug);
    const seesTodos = useSeesTodos();
    // Search engines and link previews get the real summary, or a factual line built from the data
    const divisionNames = (project?.divisions ?? []).map((d) => DIVISIONS.find((x) => x.id === d)?.label).filter(Boolean).join(" and ");
    const description = known(project?.summary) ?? (project ? `${project.title}: a Formcraft ${divisionNames || "Studio"} project, with renders.` : undefined);
    usePageMeta(project ? project.title : "Project not found", description, { image: project?.images?.[0], noindex: !project });
    if (!project && loading) return <div className="wrap section"><div className="skeleton" style={{ height: 480 }} /></div>;
    if (!project) return <NotFound />;

    const index = projects.indexOf(project);
    const next = projects[(index + 1) % projects.length];
    const [hero, ...gallery] = project.images ?? [];
    // Facts that aren't known yet are left out for visitors; the team sees them as "To fill in"
    const facts = [
        ["Client", project.client, "TODO: client name (with their permission)"],
        ["Location", project.location, "TODO: location"],
        ["Year", project.year, "TODO: year"],
        ["Divisions", (project.divisions ?? []).map((d) => DIVISIONS.find((x) => x.id === d)?.label).join(", ")],
    ].filter(([, v]) => known(String(v ?? "")) || seesTodos);

    return (
        <div className="project-page">
            <section className="wrap project-page-head">
                <nav className="crumbs" aria-label="Breadcrumb">
                    <Link to="/projects">Projects</Link> <span aria-hidden="true">/</span> <span aria-current="page">{project.title}</span>
                </nav>
                <p className="eyebrow">Case study</p>
                <h1 className="h1-s">{project.title}</h1>
                <Fact as="p" className="lead" text={project.summary} />
                <div className="row">
                    <Link to="/studio#quote" className="btn btn-primary">Plan a project like this <Icon name="arrow" size={18} /></Link>
                    <Link to="/projects" className="btn btn-line">All projects</Link>
                </div>
            </section>
            <div className="wrap">
                <Photo name={imgName(hero)} alt={imgAlt(hero, project.title)} caption="Render" ratio="16 / 9" eager sizes="100vw" className="project-page-hero" />
            </div>

            <Section tone="sheet" seed={2} small>
                <dl className="kpis project-page-facts">
                    {facts.map(([k, v, note]) => (
                        <div key={k}>
                            <dt className="fine">{k}</dt>
                            <dd className="h4">{known(String(v ?? "")) ? v : <Todo>{note}</Todo>}</dd>
                        </div>
                    ))}
                </dl>
                {(project.brief || project.work || seesTodos) && (
                <div className="grid-2 project-page-text">
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <p className="eyebrow">The brief</p>
                        {project.brief ? <p className="body">{project.brief}</p> : <Todo as="p">TODO: the client's problem in two or three sentences; site, constraints, budget range (if the client agrees to share it).</Todo>}
                    </div>
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <p className="eyebrow">What we did</p>
                        {project.work ? <p className="body">{project.work}</p> : <Todo as="p">TODO: survey & design, engineering, costing and approvals for this project.</Todo>}
                    </div>
                </div>
                )}
            </Section>

            {gallery.length > 0 && (
                <Section tone="ground" seed={4}>
                    <h2 className="h2" style={{ marginBottom: 32 }}>Gallery</h2>
                    <div className="project-page-gallery">
                        {gallery.map((img, i) => (
                            <Reveal key={`${imgName(img)}-${i}`} delay={i * 0.08}>
                                <Photo name={imgName(img)} alt={imgAlt(img, project.title)} caption="Render" ratio="4 / 3" className={i % 2 ? "tilt-r" : "tilt-l"} />
                            </Reveal>
                        ))}
                    </div>
                </Section>
            )}

            <Section tone="dark" seed={6} small>
                <div className="between" style={{ alignItems: "center" }}>
                    <Link to="/projects" className="link"><Icon name="arrowLeft" size={16} /> All projects</Link>
                    <Link to={`/projects/${next.slug}`} className="link">Next project: {next.title} <Icon name="arrow" size={16} /></Link>
                </div>
            </Section>
        </div>
    );
};

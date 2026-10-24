import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { Section } from "../components/page/Section";
import { Photo } from "../components/page/Photo";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { projects, projectBySlug, DIVISIONS } from "../data/projects";
import { NotFound } from "./NotFound";
import "./ProjectPage.css";

export const ProjectPage = () => {
    const { slug } = useParams();
    const project = projectBySlug(slug);
    usePageMeta(project ? project.title : "Project not found", project?.summary);
    if (!project) return <NotFound />;

    const index = projects.indexOf(project);
    const next = projects[(index + 1) % projects.length];
    const [hero, ...gallery] = project.images;
    const facts = [
        ["Client", project.client ?? "TODO (with permission)"],
        ["Location", project.location ?? "TODO"],
        ["Year", project.year ?? "TODO"],
        ["Divisions", project.divisions.map((d) => DIVISIONS.find((x) => x.id === d)?.label).join(", ")],
    ];

    return (
        <div className="project-page">
            <section className="wrap project-page-head">
                <nav className="crumbs" aria-label="Breadcrumb">
                    <Link to="/projects">Projects</Link> <span aria-hidden="true">/</span> <span aria-current="page">{project.title}</span>
                </nav>
                <p className="eyebrow">Case study</p>
                <h1 className="h1-s">{project.title}</h1>
                <p className={`lead ${project.summary.startsWith("TODO") ? "todo" : ""}`}>{project.summary}</p>
                <div className="row">
                    <Link to="/studio#quote" className="btn btn-primary">Plan a project like this <Icon name="arrow" size={18} /></Link>
                    <Link to="/projects" className="btn btn-line">All projects</Link>
                </div>
            </section>
            <div className="wrap">
                <Photo name={hero.name} alt={hero.alt} caption="Render" ratio="16 / 9" eager sizes="100vw" className="project-page-hero" />
            </div>

            <Section tone="sheet" seed={2} small>
                <dl className="kpis project-page-facts">
                    {facts.map(([k, v]) => (
                        <div key={k}>
                            <dt className="fine">{k}</dt>
                            <dd className={`h4 ${String(v).startsWith("TODO") ? "todo" : ""}`}>{v}</dd>
                        </div>
                    ))}
                </dl>
                <div className="grid-2 project-page-text">
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <p className="eyebrow">The brief</p>
                        <p className="body todo">TODO: the client's problem in two or three sentences; site, constraints, budget range (if the client agrees to share it).</p>
                    </div>
                    <div className="stack" style={{ "--gap": "12px" }}>
                        <p className="eyebrow">What we did</p>
                        <p className="body todo">TODO: survey & design, engineering, costing and approvals for this project.</p>
                    </div>
                </div>
            </Section>

            {gallery.length > 0 && (
                <Section tone="ground" seed={4}>
                    <h2 className="h2" style={{ marginBottom: 32 }}>Gallery</h2>
                    <div className="project-page-gallery">
                        {gallery.map((img, i) => (
                            <Reveal key={img.name} delay={i * 0.08}>
                                <Photo name={img.name} alt={img.alt} caption="Render" ratio="4 / 3" className={i % 2 ? "tilt-r" : "tilt-l"} />
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

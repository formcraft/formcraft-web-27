// About page (/about). About Formcraft: how it started, the founders and team, mission and vision, the five
// values, who Formcraft works for, and a closing call to action. Written from the Company Profile; team
// portraits show "Portrait coming soon" until photos arrive.
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import "./About.css";

const TEAM = [
    { name: "Emlyn Atochon", role: "Co-Founder & Lead Designer", text: "Leads Formcraft Studio and its team of five architects and designers, and is creative director of the craft workshop." },
    { name: "Peter Isingoma", role: "Co-Founder & Real Estate Lead", text: "Leads Formcraft Concrete and the company's real estate work." },
    { name: "Esther Ahumuza", role: "Marketing, Sales & Interior Design", text: "Holds a diploma in interior architecture. Leads marketing and sales, and Formcraft's interior design work." },
];

const VALUES = [
    ["Community", "Designers, artisans, engineers and clients working as equals from the same table."],
    ["Empowerment", "Skills development, fair market pricing, access to advanced machinery and room to grow for local artisans."],
    ["Innovation", "Traditional handcraft with BIM, CAD and CAM, solving construction friction before anything is built."],
    ["Sustainability", "Eco-conscious materials, efficient workshop fabrication and green concrete on every project."],
    ["Excellence", "Precision and care that last — in durability, in finish and in long-term property value."],
];

const AUDIENCES = [
    { who: "Professional & B2B", title: "Engineers, architects, developers, contractors", text: "Technical confidence, BIM pre-construction precision, accurate bills of quantities and reliable material supply.", to: "/studio", cta: "Studio" },
    { who: "Homeowners & buyers", title: "Homeowners, home builders, furniture clients", text: "Quality design, honest pricing, bespoke timber joinery and delivery dates we keep.", to: "/construction#templates", cta: "Template builds" },
    { who: "Community & investors", title: "Artisans, creative trades, member investors", text: "Market access, skills training, fair economic partnerships and structured real estate returns.", to: "/community", cta: "Community" },
];

/** The About page. Rendered by src/routes.jsx for /about. */
export const About = () => {
    usePageMeta("About", "Formcraft Design and Construction Co. Ltd is a design-build firm in Kampala: architecture, engineering, concrete, joinery and real estate in one value chain, built with local craftspeople.");
    return (
        <div className="about">
            <PageHero eyebrow="About Formcraft" title="Designing spaces. Empowering communities." sheet="A301" seed={61} crumbs={[["/", "Home"], [null, "About"]]}
                lead="Formcraft Design and Construction Co. Ltd is a design-build firm in Kampala. Architecture, engineering, concrete, joinery and real estate in one continuous value chain — built with local craftspeople.">
                <a href="#story" className="btn btn-primary">Our story</a>
                <Link to="/projects" className="btn btn-line">See our work</Link>
            </PageHero>

            <Section tone="sheet" seed={2} id="story">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">How it started</p>
                        <h2 className="h2">From a university workshop to a design-build firm.</h2>
                    </Reveal>
                    <Reveal delay={0.1} className="stack" style={{ "--gap": "20px" }}>
                        <p className="body">Emlyn Atochon and Peter Isingoma met studying interior architecture at Limkokwing University in Mukono. Working with local craftsmen on their university projects, they kept hitting the same problem: designers and workshop artisans worked apart, and many craftsmen saw abstract design as <em>okwekoza</em> — pretence, disconnected from the workshop.</p>
                        <p className="body">After graduating they went straight into custom furniture and met the practical obstacles first-hand: seasoned timber that was hard to source, machinery that cost too much, and skilled artisans who were undervalued. The first Formcraft piece was made in 2023. In 2025 they formally launched Formcraft to solve those problems, and in 2026 it was registered as Formcraft Design and Construction Co. Ltd.</p>
                    </Reveal>
                </div>
                <ol className="about-timeline">
                    {[["2023", "First Formcraft piece"], ["2025", "Formcraft launched"], ["2026", "Registered as a company"]].map(([y, t], i) => (
                        <Reveal as="li" key={y} delay={i * 0.08} className="card card-pad">
                            <span className="num">{y}</span>
                            <span className="small">{t}</span>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            <Section tone="ground" seed={4} id="team">
                <SectionHead eyebrow="Founders & team" title="The people at the table." />
                <div className="grid-3">
                    {TEAM.map((p, i) => (
                        <Reveal key={p.name} delay={i * 0.08} className="card about-person">
                            <div className="placeholder about-portrait" role="img" aria-label={`Portrait of ${p.name}, coming soon`}>Portrait coming soon</div>
                            <div className="card-pad stack" style={{ "--gap": "8px" }}>
                                <h3 className="h3">{p.name}</h3>
                                <p className="tag" style={{ alignSelf: "flex-start" }}>{p.role}</p>
                                <p className="small">{p.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </Section>

            <Section tone="dark" seed={6} id="mission">
                <div className="grid-2">
                    <Reveal className="stack" style={{ "--gap": "14px" }}>
                        <p className="eyebrow">Our mission</p>
                        <p className="h3 about-statement">An integrated design-build ecosystem dedicated to elevating Africa's built environment. By connecting spatial design, structural execution and artisanal craft, we deliver world-class spaces while generating sustainable jobs, building trade skills and empowering generations of local creatives.</p>
                    </Reveal>
                    <Reveal delay={0.1} className="stack" style={{ "--gap": "14px" }}>
                        <p className="eyebrow">Our vision</p>
                        <p className="h3 about-statement">To become Africa's leading design-build firm — transforming spaces and uplifting communities by integrating traditional craftsmanship with modern design.</p>
                    </Reveal>
                </div>
            </Section>

            <Section tone="sheet" seed={8} id="values">
                <SectionHead eyebrow="Five values" title="How we decide what's right.">
                    We aren't a top-down construction firm. Digital modellers, structural engineers and workshop artisans share knowledge as equals.
                </SectionHead>
                <ol className="steps about-values">
                    {VALUES.map(([title, text], i) => (
                        <Reveal as="li" key={title} delay={i * 0.06} className="card step">
                            <h3 className="h4">{title}</h3>
                            <p className="small">{text}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            <Section tone="ground" seed={10} id="who">
                <SectionHead eyebrow="Who we work for" title="Three kinds of people, one table." />
                <div className="grid-3">
                    {AUDIENCES.map((a, i) => (
                        <Reveal key={a.who} delay={i * 0.08}>
                            <Link to={a.to} className="card card-pad about-audience">
                                <span className="fine">{a.who}</span>
                                <h3 className="h3">{a.title}</h3>
                                <p className="small">{a.text}</p>
                                <span className="link">{a.cta} <Icon name="arrow" size={16} /></span>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </Section>

            <Section tone="orange" seed={12} small id="cta">
                <div className="between" style={{ alignItems: "center" }}>
                    <h2 className="h2" style={{ maxWidth: "18ch" }}>Want to build with us, make with us or back us?</h2>
                    <div className="row">
                        <Link to="/contact" className="btn btn-ink">Talk to us</Link>
                        <Link to="/invest" className="btn btn-line">Investor information</Link>
                    </div>
                </div>
            </Section>
        </div>
    );
};

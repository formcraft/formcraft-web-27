import { Link } from "react-router-dom";
import { PaperLayers } from "../scene/PaperLayers";
import { Sky } from "../scene/Sky";
import { Logo } from "../ui/Logo";
import { Kinetic } from "../ui/Reveal";
import "./PageHero.css";

// Opening sheet for inner pages: crumbs, division lockup, headline, lead, actions, and a
// shallow paper landscape whose front hill takes the division colour. The shared <Sky> sits
// under the whole hero (copy included), so it reads as one sky above the paper hills; its
// horizon is where the hills start, about 60 % of the scene's height above the bottom.
export const PageHero = ({ eyebrow, title, lead, children, brand, sheet, crumbs, seed = 21, sceneHeight = 300, city = true, motif = "city" }) => (
    <section className="page-hero">
        <Sky seed={seed} horizon={sceneHeight * 0.6} />
        <div className="wrap page-hero-copy">
            {crumbs && (
                <nav className="crumbs" aria-label="Breadcrumb">
                    {crumbs.map(([to, label]) => (
                        <span key={label} className="row" style={{ "--gap": "8px" }}>
                            {to ? <Link to={to}>{label}</Link> : <span aria-current="page">{label}</span>}
                            {to && <span aria-hidden="true">/</span>}
                        </span>
                    ))}
                </nav>
            )}
            {brand && (
                <div className="page-hero-brand">
                    <Logo brand={brand} height={30} />
                </div>
            )}
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="h1-s page-hero-title">
                <Kinetic text={title} />
            </h1>
            {lead && <p className="lead rise" style={{ "--delay": ".35s" }}>{lead}</p>}
            {children && <div className="row rise" style={{ "--delay": ".5s" }}>{children}</div>}
            {sheet && (
                <p className="page-hero-sheet" aria-hidden="true">
                    Sheet <b>{sheet}</b>
                </p>
            )}
        </div>
        <PaperLayers seed={seed} height={sceneHeight} city={city} motif={motif} tall={motif === "city" ? 0.7 : 0.85} sun={{ x: 1180, y: 70, r: 40 }} accent={Boolean(brand)} className="page-hero-scene" />
    </section>
);

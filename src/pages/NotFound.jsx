// NotFound page (*). The 404 page ("This page isn't on the drawings"), with links back into the site.
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Icon } from "../components/ui/Icon";

const DOORS = [
    { who: "Clients", title: "Hire us", text: "Design, pre-construction and BIM", to: "/studio" },
    { who: "Buyers", title: "Shop", text: "Furniture, joinery and goods", to: "/stores" },
    { who: "Artisans & students", title: "Join", text: "Community and academy", to: "/community" },
    { who: "Investors", title: "Back us", text: "Invest in a development", to: "/invest" },
];

/** The NotFound page. Rendered by src/routes.jsx for *. */
export const NotFound = () => {
    usePageMeta("Page not found", undefined, { noindex: true });
    return (
        <>
            <PageHero eyebrow="404 · page not found" title="This page isn't on the drawings." sheet="X404" seed={404} city={false} lead="The link may be old or mistyped. Try one of these instead.">
                <Link to="/" className="btn btn-primary">Back to the home page</Link>
            </PageHero>
            <Section tone="sheet" seed={5} small>
                <div className="grid-4">
                    {DOORS.map((d) => (
                        <Link key={d.title} to={d.to} className="card card-pad stack" style={{ "--gap": "8px" }}>
                            <span className="fine">{d.who}</span>
                            <strong className="h3">{d.title}</strong>
                            <span className="small">{d.text}</span>
                            <Icon name="arrow" size={18} />
                        </Link>
                    ))}
                </div>
            </Section>
        </>
    );
};

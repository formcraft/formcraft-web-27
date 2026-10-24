import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";

// Placeholder for routes in later phases (was pages/Construction.jsx, renamed so it doesn't clash with the division page)
export const ComingSoon = ({ title, sheet, text }) => {
    usePageMeta(title, text);
    return (
        <PageHero eyebrow="Coming soon" title={title} sheet={sheet} seed={(sheet || "X").charCodeAt(1) * 7} lead={text}>
            <Link to="/" className="btn btn-primary">Back to the home page</Link>
            <Link to="/contact" className="btn btn-line">Talk to us</Link>
        </PageHero>
    );
};

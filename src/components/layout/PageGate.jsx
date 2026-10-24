import { Link } from "react-router-dom";
import { useSite } from "../../hooks/useSite";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PageHero } from "../page/PageHero";
import { pageByKey } from "../../data/pages";
import "./PageGate.css";

// Visitors only see pages the admin has turned on (Admin → Pages). Admins see every page, with a
// strip saying it's hidden. A hidden page's address tells visitors it isn't open yet.
const NotOpen = ({ label }) => {
    usePageMeta("Not open yet", "This part of the Formcraft site isn't open yet.");
    return (
        <PageHero eyebrow="Not open yet" title={`${label} opens soon.`} sheet="X000" seed={13} lead="We're getting this part of the site ready. In the meantime, the rest of Formcraft is open.">
            <Link to="/" className="btn btn-primary">Back to the home page</Link>
            <Link to="/contact" className="btn btn-line">Talk to us</Link>
        </PageHero>
    );
};

export const PageGate = ({ pageKey, children }) => {
    const site = useSite();
    const page = pageByKey(pageKey);
    if (!site || site.isOn(pageKey)) return children;
    if (!site.isAdmin) return <NotOpen label={page?.label ?? "This page"} />;
    return (
        <>
            <p className="page-gate-strip" role="status">
                <b>Hidden from visitors.</b> Only admins can see “{page?.label}”. <Link to="/admin#pages">Turn it on in Admin</Link>
            </p>
            {children}
        </>
    );
};

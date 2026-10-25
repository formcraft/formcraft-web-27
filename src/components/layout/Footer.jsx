// The footer at the bottom of every page.
// It's styled like the title block of a construction drawing: every page has a sheet number and name
// (from src/data/sheets.js), like a set of drawings. It also holds the site links (grouped like the
// header), contact details from Admin → Site details, social links, the email sign-up, the privacy
// link and the cookie settings button. Links to pages the admin has switched off are hidden.
import { Link, useLocation } from "react-router-dom";
import { sheetFor } from "../../data/sheets";
import { useShowLink, useSite } from "../../hooks/useSite";
import { socialLinks, telHref, waHref } from "../../data/contact";
import { openConsent } from "../../lib/analytics";
import { SubscribeForm } from "../forms/SubscribeForm";
import { Icon } from "../ui/Icon";
import { Logo, LogoMark } from "../ui/Logo";
import { TornEdge } from "../ui/TornEdge";
import "./Footer.css";

/** A footer link that disappears when the admin turns its page off. */
const L = ({ to, children }) => {
    const show = useShowLink();
    return show(to) ? <Link to={to}>{children}</Link> : null;
};

/** The site footer. Rendered once by Layout.jsx under every page. */
export const Footer = () => {
    const { pathname } = useLocation();
    const [sheet, name] = sheetFor(pathname);
    const show = useShowLink();
    const { details } = useSite();
    const socials = socialLinks(details);
    const wa = waHref(details.whatsapp);

    return (
        <footer className="footer paper-dark">
            <TornEdge seed={97} />
            <div className="wrap">
                <div className="footer-cols">
                    <div className="stack" style={{ "--gap": "18px" }}>
                        <Link to="/" className="footer-brand" aria-label="Formcraft home">
                            <Logo height={32} tone="light" decorative />
                        </Link>
                        <p className="small" style={{ maxWidth: 260 }}>
                            Designing spaces. Empowering communities.
                        </p>
                        {show("/journal") && (
                            <Link to="/journal" className="link">
                                Read the Journal
                            </Link>
                        )}
                    </div>
                    <nav aria-label="Divisions">
                        <p className="footer-head">Divisions</p>
                        <L to="/studio">Studio</L>
                        <L to="/construction">Construction</L>
                        <L to="/concrete">Concrete</L>
                        <L to="/templates">Template builds</L>
                        <L to="/stores">Stores</L>
                    </nav>
                    <nav aria-label="Get involved">
                        <p className="footer-head">Get involved</p>
                        <L to="/community">Community</L>
                        <L to="/academy">Academy</L>
                        <L to="/invest">Invest in Formcraft</L>
                        <L to="/real-estate">Real estate</L>
                        <L to="/donate">Plant a tree</L>
                    </nav>
                    <nav aria-label="Company">
                        <p className="footer-head">Company</p>
                        <L to="/about">About</L>
                        <L to="/projects">Projects</L>
                        <L to="/journal">Journal</L>
                        <L to="/contact">Contact</L>
                        <L to="/account">Your account</L>
                    </nav>
                    <div className="footer-contact">
                        <p className="footer-head">Talk to us</p>
                        <span>{details.address || "Kampala, Uganda"}</span>
                        {details.phone && <a href={telHref(details.phone)}>{details.phone}</a>}
                        {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp us</a>}
                        {details.email && <a href={`mailto:${details.email}`}>{details.email}</a>}
                        {details.hours && <span className="fine">{details.hours}</span>}
                        {socials.length > 0 && (
                            <ul className="footer-socials" aria-label="Formcraft on social media">
                                {socials.map((s) => (
                                    <li key={s.key}>
                                        <a href={s.href} target="_blank" rel="noreferrer">
                                            {s.label} <span className="fine">{s.text !== s.label ? s.text : ""}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="footer-news">
                    <div className="stack" style={{ "--gap": "6px" }}>
                        <p className="footer-head">Email updates</p>
                        <p className="small">New template homes, Journal stories and workshop dates, now and then.</p>
                    </div>
                    <SubscribeForm variant="footer" />
                </div>

                <div className="footer-grid-ref" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <span key={n}>{n}</span>
                    ))}
                </div>
                <div className="footer-tb" role="group" aria-label="Title block">
                    <div>
                        <small>Practice</small>
                        <span className="footer-tb-mark">
                            <LogoMark size={22} />
                            <strong>Formcraft Design and Construction Co. Ltd</strong>
                        </span>
                    </div>
                    <div>
                        <small>Project</small>
                        <strong>Formcraft website · <span className="footer-ed-day">day</span><span className="footer-ed-night">night</span> edition</strong>
                    </div>
                    <div>
                        <small>Sheet</small>
                        <strong>{name}</strong>
                    </div>
                    <div>
                        <small>Drawn</small>
                        <strong>Kampala, Uganda</strong>
                    </div>
                    <div>
                        <small>North</small>
                        <Icon name="north" size={26} strokeWidth={1.6} />
                    </div>
                    <div>
                        <small>Sheet no.</small>
                        <span className="footer-tb-no">{sheet}</span>
                    </div>
                </div>
                <div className="footer-legal">
                    <span suppressHydrationWarning>© {new Date().getFullYear()} Formcraft Design and Construction Co. Ltd</span>
                    <span className="footer-legal-links">
                        <Link to="/privacy">Privacy</Link>
                        <button type="button" className="footer-cookie" onClick={openConsent}>Cookie settings</button>
                        <span>Made in Kampala</span>
                    </span>
                </div>
            </div>
        </footer>
    );
};

import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useShowLink, useSite } from "../hooks/useSite";
import { socialLinks, waHref } from "../data/contact";
import { Section } from "../components/page/Section";
import { SubscribeForm } from "../components/forms/SubscribeForm";
import { Logo } from "../components/ui/Logo";
import { Icon } from "../components/ui/Icon";
import "./Links.css";

// Link-in-bio page for Instagram, TikTok, X and the rest: one tap to the main pages.
// Tag the link in each profile with Admin → Link builder so the Leads screen shows which one works.
const MAIN = [
    ["/templates", "Template homes", "Ready-to-build designs for 50 × 100 ft plots"],
    ["/studio", "Design & BIM", "Plans, pre-construction and models"],
    ["/construction", "Build with us", "From the model to the finished building"],
    ["/stores", "Stores", "Furniture, joinery and goods"],
    ["/projects", "Our work", "Projects we've designed and built"],
    ["/community", "Join the community", "Artisans and creatives"],
    ["/academy", "Academy", "BIM and CAD courses"],
    ["/journal", "Journal", "Notes on construction, BIM and craft"],
    ["/invest", "Invest", "Roadmap and the investor pack"],
    ["/donate", "Plant a tree", "Give back some of what building takes"],
    ["/contact", "Contact us", "Call, email or send a message"],
];

/** The link-in-bio page (/links) for social profiles: the site's main doors, contact buttons and the email sign-up. */
export const Links = () => {
    usePageMeta("Links", "Formcraft in Kampala: template homes, design and BIM, construction, the Stores and the community — all our links in one place.", { noindex: true });
    const show = useShowLink();
    const { details } = useSite();
    const wa = waHref(details.whatsapp);
    const socials = socialLinks(details);

    return (
        <div className="links">
            <Section tone="ground" torn={false} small>
                <div className="links-sheet">
                    <header className="links-head">
                        <Logo height={34} />
                        <p className="links-tagline">Designing spaces. Empowering communities.</p>
                        <p className="fine">Design and construction · Kampala, Uganda</p>
                    </header>

                    <nav aria-label="Formcraft pages">
                        <ul className="links-list">
                            {wa && (
                                <li>
                                    <a className="links-btn links-btn-accent" href={wa} target="_blank" rel="noreferrer">
                                        <Icon name="chat" size={20} />
                                        <span className="links-btn-text"><strong>WhatsApp us</strong><span className="fine">Ask a question, book a site visit</span></span>
                                    </a>
                                </li>
                            )}
                            {MAIN.filter(([to]) => show(to)).map(([to, label, note]) => (
                                <li key={to}>
                                    <Link className="links-btn" to={to} data-track="cta" data-track-target={`links ${to}`}>
                                        <span className="links-btn-text"><strong>{label}</strong><span className="fine">{note}</span></span>
                                        <Icon name="arrow" size={18} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="links-news">
                        <SubscribeForm variant="inline" heading="Get updates by email" intro="New template homes, Journal stories and workshop dates, now and then." />
                    </div>

                    {socials.length > 0 && (
                        <ul className="links-socials" aria-label="Formcraft on social media">
                            {socials.map((s) => (
                                <li key={s.key}>
                                    <a href={s.href} target="_blank" rel="noreferrer" className="chip">{s.label}</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Section>
        </div>
    );
};

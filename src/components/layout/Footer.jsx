import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { SHEETS } from "../../data/sheets";
import { Icon } from "../ui/Icon";
import { Logo, LogoMark } from "../ui/Logo";
import { TornEdge } from "../ui/TornEdge";
import "./Footer.css";

// Drawing title block: every page has a sheet number, like a set of construction drawings.
const sheetFor = (pathname) => {
    if (SHEETS[pathname]) return SHEETS[pathname];
    if (pathname.startsWith("/stores/")) return ["S102", "Stores · product"];
    if (pathname.startsWith("/projects/")) return ["A202", "Projects · case study"];
    return ["X404", "Page not found"];
};

export const Footer = () => {
    const { pathname } = useLocation();
    const { theme } = useTheme();
    const [sheet, name] = sheetFor(pathname);

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
                        <Link to="/journal" className="link">
                            Get the Journal by email
                        </Link>
                    </div>
                    <nav aria-label="Divisions">
                        <p className="footer-head">Divisions</p>
                        <Link to="/studio">Studio</Link>
                        <Link to="/construction">Construction</Link>
                        <Link to="/concrete">Concrete</Link>
                        <Link to="/stores">Stores</Link>
                    </nav>
                    <nav aria-label="Get involved">
                        <p className="footer-head">Get involved</p>
                        <Link to="/community">Community</Link>
                        <Link to="/academy">Academy</Link>
                        <Link to="/invest">Invest in Formcraft</Link>
                        <Link to="/donate">Plant a tree</Link>
                    </nav>
                    <nav aria-label="Company">
                        <p className="footer-head">Company</p>
                        <Link to="/about">About</Link>
                        <Link to="/projects">Projects</Link>
                        <Link to="/contact">Contact</Link>
                        <Link to="/account">Your account</Link>
                    </nav>
                    <div className="footer-contact">
                        <p className="footer-head">Talk to us</p>
                        <span>Kampala, Uganda</span>
                        <a href="tel:+256753929921">+256 753 929 921</a>
                        <a href="mailto:formcraftdesign@gmail.com">formcraftdesign@gmail.com</a>
                        <span className="fine">Instagram @formcraft.ug · X @formcraft_ug · LinkedIn formcraftinc</span>
                    </div>
                </div>

                <div className="footer-grid-ref" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <span key={n}>{n}</span>
                    ))}
                </div>
                <div className="footer-tb" aria-label="Title block">
                    <div>
                        <small>Practice</small>
                        <span className="footer-tb-mark">
                            <LogoMark size={22} />
                            <strong>Formcraft Design and Construction Co. Ltd</strong>
                        </span>
                    </div>
                    <div>
                        <small>Project</small>
                        <strong>Formcraft website · {theme} edition</strong>
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
                    <span>© {new Date().getFullYear()} Formcraft Design and Construction Co. Ltd</span>
                    <span>Made in Kampala</span>
                </div>
            </div>
        </footer>
    );
};

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Icon } from "../ui/Icon";
import { Logo } from "../ui/Logo";
import { Drawer } from "../ui/Drawer";
import { CartButton } from "../shop/CartButton";
import "./Header.css";

// The four doors from the site map, mirrored in the header
export const NAV_GROUPS = [
    {
        label: "Hire us",
        links: [
            { to: "/studio", label: "Studio", note: "Design, pre-construction & BIM" },
            { to: "/construction", label: "Construction", note: "Building what the model promised" },
            { to: "/concrete", label: "Concrete", note: "Precast and green concrete" },
            { to: "/projects", label: "Projects", note: "Work we've designed and built" },
        ],
    },
    { label: "Shop", to: "/stores" },
    {
        label: "Join",
        links: [
            { to: "/community", label: "Community", note: "Artisans and creatives" },
            { to: "/academy", label: "Academy", note: "BIM and CAD courses" },
        ],
    },
    {
        label: "Back us",
        links: [
            { to: "/invest", label: "Invest", note: "Developments and the investor pack" },
            { to: "/donate", label: "Plant a tree", note: "Give back some of what building takes" },
        ],
    },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];

const NavGroup = ({ group, pathname }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const active = group.links.some((link) => pathname.startsWith(link.to));

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => {
            if (!ref.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
                ref.current?.querySelector("button")?.focus();
            }
        };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    useEffect(() => setOpen(false), [pathname]);

    const id = `nav-${group.label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
        <div className="header-group" ref={ref}>
            <button
                type="button"
                className={`header-link ${active ? "is-active" : ""}`}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((v) => !v)}
            >
                {group.label}
                <svg className="header-caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
            </button>
            <div id={id} className="header-panel" hidden={!open}>
                {group.links.map((link) => (
                    <NavLink key={link.to} to={link.to} className="header-panel-link">
                        <strong>{link.label}</strong>
                        <span>{link.note}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export const ThemeSwitch = ({ className = "" }) => {
    const { theme, toggle } = useTheme();
    const next = theme === "night" ? "day" : "night";
    return (
        <button
            type="button"
            className={`icon-btn header-mode ${className}`}
            onClick={toggle}
            aria-label={`Switch to the ${next} edition`}
            title={`${next === "night" ? "Night" : "Day"} edition`}
        >
            <Icon name={theme === "night" ? "sun" : "moon"} size={19} />
        </button>
    );
};

export const Header = () => {
    const { user, loading, openSignIn } = useAuth();
    const { pathname } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(false), [pathname]);

    return (
        <header className="header">
            <div className="wrap header-bar">
                <Link to="/" className="header-brand" aria-label="Formcraft home">
                    <Logo height={30} decorative />
                </Link>

                <nav className="header-nav" aria-label="Main">
                    {NAV_GROUPS.map((group) =>
                        group.links ? (
                            <NavGroup key={group.label} group={group} pathname={pathname} />
                        ) : (
                            <NavLink key={group.label} to={group.to} className="header-link">
                                {group.label}
                            </NavLink>
                        )
                    )}
                </nav>

                <div className="header-tools">
                    <ThemeSwitch />
                    <CartButton />
                    {user ? (
                        <Link to="/account" className="icon-btn" aria-label="Your account" title={user.email ?? "Your account"}>
                            <Icon name="user" size={19} />
                        </Link>
                    ) : (
                        <button type="button" className="icon-btn" aria-label="Sign in" onClick={openSignIn} disabled={loading}>
                            <Icon name="user" size={19} />
                        </button>
                    )}
                    <Link to="/studio#quote" className="btn btn-primary btn-sm header-cta">
                        Request a quote
                    </Link>
                    <button type="button" className="icon-btn header-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                        <Icon name="menu" />
                    </button>
                </div>
            </div>

            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
                <nav className="header-mobile" aria-label="Main">
                    {NAV_GROUPS.map((group) =>
                        group.links ? (
                            <div key={group.label} className="header-mobile-group">
                                <p className="eyebrow">{group.label}</p>
                                {group.links.map((link) => (
                                    <NavLink key={link.to} to={link.to}>
                                        {link.label}
                                    </NavLink>
                                ))}
                            </div>
                        ) : (
                            <NavLink key={group.label} to={group.to} className="header-mobile-top">
                                {group.label}
                            </NavLink>
                        )
                    )}
                    <Link to="/studio#quote" className="btn btn-primary btn-block">
                        Request a quote
                    </Link>
                </nav>
            </Drawer>
        </header>
    );
};

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export const Header = () => {
    const { user, loading, signOut, openSignIn } = useAuth();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/");
            setShowAccountMenu(false);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const pages = [
        { path: "/", label: "Home" },
        { path: "/services", label: "Services" },
        { path: "/portfolio", label: "Portfolio" },
        { path: "/shop", label: "Shop" },
        { path: "/blog", label: "Blog" },
        { path: "/about", label: "About Us" }
    ];

    // Filter out the current page from navigation
    const navigationPages = pages.filter(page => page.path !== location.pathname);

    return (
        <header className="header">
            <div 
                className="header-logo"
                onClick={() => navigate("/")}
            >
                <span>📝</span>
                <span>FormCraft</span>
            </div>

            <nav>
                <ul className="header-nav">
                    {navigationPages.map((page) => (
                        <li key={page.path}>
                            <a
                                onClick={() => navigate(page.path)}
                                className="header-nav-link"
                            >
                                {page.label}
                            </a>
                        </li>
                    ))}

                    {user && (
                        <li className="header-account-container">
                            <button
                                className="header-account-button"
                                onClick={() => setShowAccountMenu(!showAccountMenu)}
                                title={user.email}
                            >
                                👤
                            </button>

                            {showAccountMenu && (
                                <div className="header-dropdown">
                                    <div className="header-dropdown-item">
                                        <strong>{user.email}</strong>
                                    </div>
                                    <div
                                        className="header-dropdown-item"
                                        onClick={() => setShowAccountMenu(false)}
                                    >
                                        ⚙️ Settings
                                    </div>
                                    <div
                                        className="header-dropdown-item"
                                        onClick={handleLogout}
                                    >
                                        🚪 Logout
                                    </div>
                                </div>
                            )}
                        </li>
                    )}

                    {!user && !loading && (
                        <li>
                            <button type="button" className="header-signin-button" onClick={openSignIn}>
                                Sign in
                            </button>
                        </li>
                    )}
                </ul>
            </nav>
        </header>
    );
};

// SignIn page (/sign-in). Sign in with Google. Nobody has to sign in to browse: this is for the team, accounts and
// (later) checkout. After signing in it returns to the page in ?next=.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../hooks/useAuth";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { LogoMark } from "../components/ui/Logo";
import { Icon } from "../components/ui/Icon";
import "./SignIn.css";

// Only same-site paths are allowed as ?next= so the page can't be used to send people elsewhere
const safeNext = (next) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/account");

/** The SignIn page. Rendered by src/routes.jsx for /sign-in. */
export const SignIn = () => {
    usePageMeta("Sign in", "Sign in to Formcraft to see your orders, download plans, join the community or enrol on a course.");
    const { user, loading, signIn } = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const next = safeNext(params.get("next"));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) navigate(next, { replace: true });
    }, [user, next, navigate]);

    const google = async () => {
        setBusy(true);
        setError(null);
        const message = await signIn();
        setBusy(false);
        if (message) setError(message);
    };

    return (
        <div className="signin">
            <PageHero motif="city" sheet="U102" seed={83} sceneHeight={200} title="Sign in to Formcraft" crumbs={[["/", "Home"], [null, "Sign in"]]}
                lead="Sign in to see orders, download plans, join the community or enrol on a course. Browsing doesn't need an account." />

            <Section tone="sheet" seed={2}>
                <div className="card card-pad stack signin-card" style={{ "--gap": "18px" }}>
                    <LogoMark size={28} />
                    {loading || user ? (
                        <div className="stack" style={{ "--gap": "10px" }} aria-hidden="true">
                            <div className="skeleton" style={{ height: 50 }} />
                            <div className="skeleton" style={{ height: 18, width: "60%" }} />
                        </div>
                    ) : (
                        <>
                            <button type="button" className="btn btn-ink btn-block" onClick={google} disabled={busy} aria-busy={busy}>
                                {busy ? "Signing in…" : "Continue with Google"}
                            </button>
                            {error && <p className="alert alert-error" role="alert">{error}</p>}
                            <p className="small signin-later">
                                <Icon name="mail" size={18} /> Sign-in with email and password arrives in Phase 4, with the community.
                            </p>
                        </>
                    )}
                    <p className="fine">
                        Just looking? <Link to="/" className="link">Keep browsing</Link>
                    </p>
                </div>
            </Section>
        </div>
    );
};

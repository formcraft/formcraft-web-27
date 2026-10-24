import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePublicDoc } from "../hooks/usePublicDoc";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Logo, LogoMark } from "../components/ui/Logo";
import { Icon } from "../components/ui/Icon";
import { Todo } from "../components/ui/Todo";
import "./DonateThanks.css";

// Where Flutterwave sends a donor back. In Phase 3 this page reads the donation's status from our
// records (written by the flutterwaveWebhook Cloud Function); it never marks a payment as paid.
// Until tree payments open, it shows the layout with placeholders.
export const DonateThanks = () => {
    usePageMeta("Thank you for planting", "Thank you for planting trees with Formcraft. Your certificate and the live tree count.");
    const { data: stats } = usePublicDoc("stats/public");
    const planted = Number.isInteger(stats?.treesPlanted) ? new Intl.NumberFormat("en-UG").format(stats.treesPlanted) : null;

    return (
        <div className="donatethanks">
            <PageHero motif="forest" sheet="I105" seed={73} sceneHeight={300} eyebrow="Thank you" title="Thank you. Your trees are on their way." crumbs={[["/", "Home"], ["/donate", "Plant a tree"], [null, "Thank you"]]}
                lead="We'll plant them with our partner and email you when they're in the ground. Your certificate is below.">
                <button type="button" className="btn btn-primary" disabled aria-describedby="dt-note">Download certificate</button>
                <Link to="/donate" className="btn btn-line"><Icon name="leaf" size={18} /> Plant more</Link>
            </PageHero>

            <Section tone="sheet" seed={2}>
                <div className="donatethanks-grid">
                    <div className="stack" style={{ "--gap": "16px" }}>
                        <p id="dt-note" className="alert small">
                            Tree payments aren't open yet — they start once the planting partner and price per tree are agreed. Then this page reads your payment status from our records; it never marks a payment as paid itself. <Todo>TODO: planting partner and price per tree.</Todo>
                        </p>
                        <div className="donatethanks-count paper-dark" role="status">
                            <span className="fine">Trees planted with Formcraft</span>
                            {planted ? (
                                <>
                                    <b className="num">{planted}</b>
                                    <span className="fine">including yours, once it's confirmed</span>
                                </>
                            ) : (
                                <span className="small">The count starts with the first planting.</span>
                            )}
                        </div>
                    </div>

                    {/* A sample of the certificate each donor will get; the real one is filled in from the donation */}
                    <figure className="card donatethanks-cert" aria-label="Sample certificate of planting">
                        <div className="between">
                            <Logo height={24} />
                            <span className="tag">Sample</span>
                        </div>
                        <p className="eyebrow">Certificate of planting</p>
                        <p className="h2 donatethanks-cert-name">Your name</p>
                        <p className="body">planted your trees with Formcraft</p>
                        <p className="fine">The planting date and partner appear here.</p>
                        <div className="between donatethanks-cert-foot">
                            <span className="small">Designing spaces. Empowering communities.</span>
                            <LogoMark size={24} />
                        </div>
                    </figure>
                </div>
            </Section>
        </div>
    );
};

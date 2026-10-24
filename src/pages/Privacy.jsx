import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useSite } from "../hooks/useSite";
import { telHref } from "../data/contact";
import { openConsent } from "../lib/analytics";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Todo } from "../components/ui/Todo";
import { useSeesTodos } from "../hooks/useSeesTodos";
import "./Privacy.css";

// What the site really collects, in plain words. Legal parts are TODO until a lawyer has reviewed
// them against Uganda's Data Protection and Privacy Act, 2019 — never claim registration or
// compliance that isn't confirmed.
const COLLECTED = [
    ["What you type into our forms", "Your name, email or phone number and your message when you contact us, ask for a quote (plus any drawing or photo you attach), ask for the investor pack, or ask for a place on a course or event. We use it to reply to you and to follow up on what you asked about."],
    ["Our email list — only if you tick the box", "Your email, your name if you give it, the topics you picked and any free download you asked for. We email you only because you agreed to it, and you can ask to come off the list at any time."],
    ["Where you came from", "When you send a form or join the list, we save how you first and last reached the site (for example a link from Instagram, WhatsApp or a campaign, or another website's address), the page you landed on and the page you sent the form from. If a link carried an advertising click id, we note only that one was there, not the id itself. This tells us which posts and channels help people find us."],
    ["Taps on our contact links", "When someone taps our phone number, WhatsApp, email or social links, or one of our main buttons, we count it with the page it was on and where the visitor came from. These counts don't include your name or contact details."],
    ["Analytics cookies — only if you accept", "If you press “Accept” on the cookie banner, Google Analytics for Firebase records which pages are visited and how people move between them. If you press “No thanks”, it isn't loaded at all. We don't use advertising cookies."],
    ["Things kept in your own browser", "Your cart, day or night edition, cookie choice and where you came from are saved in your browser (local storage) so the site remembers them. They stay on your device; you can clear them in your browser settings."],
];

/** The Privacy page (/privacy): what the site collects and why, in plain words. Legal parts wait for a lawyer's review (team notes). */
export const Privacy = () => {
    usePageMeta("Privacy", "What the Formcraft website collects, why, who processes it and how to ask us to delete your details.");
    const { details } = useSite();
    const tel = telHref(details.phone);
    const seesTodos = useSeesTodos();

    return (
        <div className="privacy">
            <PageHero eyebrow="Privacy" title="What we collect, and why." sheet="A305" seed={83} crumbs={[["/", "Home"], [null, "Privacy"]]}
                lead="In plain words: what this website saves about you, who handles it for us and how to have it deleted." />

            <Section tone="sheet" seed={2}>
                <div className="privacy-body">
                    {/* A note for the team until a lawyer has reviewed the page; visitors don't see it */}
                    {seesTodos && (
                        <p className="alert privacy-draft">
                            This page describes what the site does today. <Todo>TODO: legal review by a lawyer against Uganda's Data Protection and Privacy Act, 2019 before launch.</Todo>
                        </p>
                    )}

                    <h2 className="h3">What the site collects</h2>
                    <dl className="privacy-list">
                        {COLLECTED.map(([title, text]) => (
                            <div key={title}>
                                <dt className="h4">{title}</dt>
                                <dd className="body">{text}</dd>
                            </div>
                        ))}
                    </dl>

                    <h2 className="h3">Who handles it for us</h2>
                    <p className="body">The site runs on Google Firebase (hosting, sign-in, database, file storage and, after your consent, Analytics). Google processes this data on our behalf. <Todo>TODO: the Firebase data location (region) once it's confirmed.</Todo></p>
                    <p className="body">Online payments aren't open yet. When they are, payments will be handled by Flutterwave (mobile money and cards); we won't see or store your card or mobile-money PIN, and this page will be updated first.</p>
                    <p className="body">We don't sell your details or share them with advertisers.</p>

                    <h2 className="h3">How long we keep it</h2>
                    {/* Until the retention periods are written, visitors get what the page already promises below */}
                    <Todo as="p" fallback={<p className="body">Ask us how long we keep anything you've sent us, or ask us to delete it. How to ask is below.</p>}>
                        TODO: retention periods for messages and quote requests, investor requests, the email list and contact-click counts.
                    </Todo>

                    <h2 className="h3">Your choices</h2>
                    <ul className="privacy-points">
                        <li className="body">
                            <strong>Cookies:</strong> change your answer at any time.{" "}
                            <button type="button" className="btn btn-line btn-sm privacy-cookie" onClick={openConsent}>Cookie settings</button>
                        </li>
                        <li className="body"><strong>Email list:</strong> ask to be removed and we'll take you off it.</li>
                        <li className="body"><strong>See, correct or delete your details:</strong> ask us and we'll do it. Tell us the email or phone number you used so we can find them.</li>
                    </ul>

                    <h2 className="h3">How to ask</h2>
                    <p className="body">
                        {/* Builds "Email x or call y, or use the contact form." from whatever contact details are set */}
                        {details.email && <>Email <a className="link" href={`mailto:${details.email}?subject=${encodeURIComponent("Privacy request")}`}>{details.email}</a></>}
                        {tel && <>{details.email ? " or call " : "Call "}<a className="link" href={tel}>{details.phone}</a></>}
                        {details.email || tel ? <>, or use the </> : <>Use the </>}
                        <Link className="link" to="/contact">contact form</Link>.{" "}
                        {!details.email && <Todo>TODO: contact email (Admin → Site details).</Todo>} <Todo>TODO: how quickly we reply to privacy requests.</Todo>
                    </p>

                    <h2 className="h3">Who we are</h2>
                    <p className="body">Formcraft Design and Construction Co. Ltd, Kampala, Uganda. {details.address ? details.address : <Todo>TODO: registered company address.</Todo>}</p>
                    <Todo as="p">TODO: Personal Data Protection Office (PDPO) registration number, if and when registered.</Todo>

                    <Todo as="p">TODO: "Last updated" date of the reviewed version.</Todo>
                </div>
            </Section>
        </div>
    );
};

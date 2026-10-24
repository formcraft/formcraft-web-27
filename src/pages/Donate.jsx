import { useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePublicDoc } from "../hooks/usePublicDoc";
import { PageHero } from "../components/page/PageHero";
import { Section, SectionHead } from "../components/page/Section";
import { Reveal } from "../components/ui/Reveal";
import { Icon } from "../components/ui/Icon";
import { Todo } from "../components/ui/Todo";
import { useSeesTodos } from "../hooks/useSeesTodos";
import "./Donate.css";

// Plant a tree. Payment stays off until the planting partner and price per tree are agreed
// (open question in the build plan). When it opens, a Cloud Function creates the donation and the
// Flutterwave link; only the webhook marks it paid and adds the trees to stats/public.
const SPECIES = [
    { id: "mvule", name: "Mvule", latin: "Milicia excelsa", note: "Native hardwood that lives for generations." },
    { id: "musizi", name: "Musizi", latin: "Maesopsis eminii", note: "Fast-growing native for shade and soil cover." },
    { id: "ffene", name: "Ffene", latin: "Jackfruit", note: "A fruit tree that feeds a household." },
];
const AMOUNTS = [1, 5, 10];
const PAY = [
    { id: "mtn", label: "MTN Mobile Money" },
    { id: "airtel", label: "Airtel Money" },
    { id: "card", label: "Card" },
];
// Sample donor-wall cards, shown only to the team until real donations exist (Firestore donations).
const WALL = [
    ["[Donor name]", "[n] trees · [date]"],
    ["[Donor name]", "[n] trees · [date]"],
    ["[Company name]", "[n] trees · [date]"],
    ["Anonymous", "[n] trees · [date]"],
];

const count = (n) => new Intl.NumberFormat("en-UG").format(n);

export const Donate = () => {
    const seesTodos = useSeesTodos();
    usePageMeta("Plant a tree", "Give back some of what building takes: choose how many trees to plant with Formcraft and see the live count.");
    const { data: stats } = usePublicDoc("stats/public");
    const [species, setSpecies] = useState("mvule");
    const [amount, setAmount] = useState(5);
    const [custom, setCustom] = useState("");
    const [customOn, setCustomOn] = useState(false);
    const [name, setName] = useState("");
    const [wall, setWall] = useState(true);
    const [pay, setPay] = useState("mtn");

    const n = customOn ? Number(custom) || 0 : amount;
    const trees = `${n} ${n === 1 ? "tree" : "trees"}`;
    const summary = wall ? `Shown on the wall as ${name.trim() || "Anonymous"}` : "Not shown on the wall";
    const chosen = SPECIES.find((s) => s.id === species);

    return (
        <div className="donate">
            <PageHero motif="forest" sheet="I104" seed={71} sceneHeight={340} eyebrow="Plant a tree" title="Plant a tree with Formcraft." crumbs={[["/", "Home"], [null, "Plant a tree"]]}
                lead="Every building takes something from the land. Give some of it back: choose how many trees to plant, and we'll plant them with our partner and add them to the count.">
                <a href="#choose" className="btn btn-primary">Choose your trees <Icon name="arrow" size={18} /></a>
                <div className="donate-counter paper-dark" role="status" aria-live="polite">
                    <span className="fine">Trees planted so far</span>
                    {Number.isInteger(stats?.treesPlanted) ? (
                        <>
                            <b className="num">{count(stats.treesPlanted)}</b>
                            <span className="fine">Live from our records.</span>
                        </>
                    ) : (
                        <span className="small">The count starts with the first planting.</span>
                    )}
                    <Todo>TODO: planting partner and first planting.</Todo>
                </div>
            </PageHero>

            <Section tone="sheet" seed={2} id="choose">
                <SectionHead eyebrow="Your gift" title="Choose your trees." />
                <div className="donate-grid">
                    <form className="form" onSubmit={(e) => e.preventDefault()} aria-label="Choose your trees">
                        <fieldset className="donate-set">
                            <legend className="h4">Which tree?</legend>
                            <div className="donate-species">
                                {SPECIES.map((s) => (
                                    <label key={s.id} className="option">
                                        <input type="radio" name="species" value={s.id} checked={species === s.id} onChange={() => setSpecies(s.id)} />
                                        <span><strong>{s.name}</strong> <em className="dim">{s.latin}</em></span>
                                        <Todo>TODO: price per tree</Todo>
                                        <span className="fine">{s.note}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="donate-set">
                            <legend className="h4">How many trees?</legend>
                            <div className="row" style={{ "--gap": "8px" }}>
                                {AMOUNTS.map((k) => (
                                    <button key={k} type="button" className="chip" aria-pressed={!customOn && amount === k} onClick={() => { setAmount(k); setCustomOn(false); }}>
                                        {k} {k === 1 ? "tree" : "trees"}
                                    </button>
                                ))}
                                <button type="button" className="chip" aria-pressed={customOn} onClick={() => { setCustomOn(true); if (!custom) setCustom("25"); }}>
                                    Custom
                                </button>
                            </div>
                            <div className="field donate-custom">
                                <label htmlFor="donate-custom">Or enter a number</label>
                                <input id="donate-custom" inputMode="numeric" placeholder="e.g. 25" value={customOn ? custom : ""}
                                    onChange={(e) => {
                                        const d = e.target.value.replace(/\D/g, "").slice(0, 5);
                                        setCustom(d === "0" ? "" : d);
                                        setCustomOn(d !== "" && d !== "0");
                                    }} />
                            </div>
                        </fieldset>

                        <fieldset className="donate-set">
                            <legend className="h4">The donor wall</legend>
                            <div className="field">
                                <label htmlFor="donate-name">Name for the donor wall (optional)</label>
                                <input id="donate-name" autoComplete="name" placeholder="Your name or your company" value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} />
                            </div>
                            <label className="donate-check">
                                <input type="checkbox" checked={wall} onChange={() => setWall((w) => !w)} />
                                Show my name on the donor wall
                            </label>
                        </fieldset>

                        <fieldset className="donate-set">
                            <legend className="h4">Pay with</legend>
                            <div className="row" style={{ "--gap": "8px" }}>
                                {PAY.map((p) => (
                                    <label key={p.id} className="chip">
                                        <input type="radio" name="pay" value={p.id} checked={pay === p.id} onChange={() => setPay(p.id)} />
                                        {p.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </form>

                    <aside className="card card-pad donate-summary" aria-labelledby="donate-summary">
                        <p className="eyebrow" id="donate-summary">Your gift</p>
                        <p className="h3" aria-live="polite">{n > 0 ? trees : "Choose a number"}</p>
                        <p className="small">{chosen.name} · {summary}</p>
                        {/* Price and total appear once a price per tree is agreed */}
                        <Todo as="p">TODO: price per tree ({chosen.name}) and the total for {n || "the chosen number of"} trees.</Todo>
                        <button type="button" className="btn btn-primary btn-block" disabled aria-describedby="donate-note">
                            <Icon name="leaf" size={18} /> Plant {n > 0 ? trees : "trees"} with Flutterwave
                        </button>
                        <p id="donate-note" className="alert small">
                            <strong>Payment isn't open yet.</strong> It opens on Flutterwave's secure page once the planting partner and price per tree are agreed; the server confirms every payment. <Todo>TODO: planting partner and price per tree.</Todo>
                        </p>
                    </aside>
                </div>
            </Section>

            {seesTodos && (
            <Section tone="ground" seed={4} id="wall">
                <SectionHead eyebrow="Donor wall" title="Thank you.">
                    <p>Names appear when the donor chooses to show them.</p>
                </SectionHead>
                <ul className="grid-4 donate-wall">
                    {WALL.map(([who, what], i) => (
                        <Reveal as="li" key={i} delay={i * 0.05} className={`card card-pad donate-wall-card ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                            <span className="tag">Sample</span>
                            <strong>{who}</strong>
                            <span className="small dim">{what}</span>
                        </Reveal>
                    ))}
                </ul>
            </Section>
            )}

            <Section tone="dark" seed={6} id="why">
                <div className="grid-2" style={{ alignItems: "center" }}>
                    <Reveal className="stack" style={{ "--gap": "18px" }}>
                        <p className="eyebrow">Why trees</p>
                        <h2 className="h2">Give back some of what building takes.</h2>
                        <p className="body">Every building uses timber, clears ground and draws on the land around it. Planting native hardwoods, shade trees and fruit trees is a plain way to return some of that — and the count stays public, so you can see it grow.</p>
                        <Todo as="p">TODO: where the trees are planted, who looks after them, and how plantings are reported.</Todo>
                    </Reveal>
                    <Reveal delay={0.1} className="stack" style={{ "--gap": "14px" }}>
                        <h3 className="h3">Other causes, coming later</h3>
                        <div className="card card-pad stack" style={{ "--gap": "6px" }}>
                            <div className="between"><strong>Artisan tool fund</strong><span className="tag">Coming later</span></div>
                            <p className="small">Tools and machinery for members of the community.</p>
                        </div>
                        <div className="card card-pad stack" style={{ "--gap": "6px" }}>
                            <div className="between"><strong>Student bursaries</strong><span className="tag">Coming later</span></div>
                            <p className="small">Academy places for students who can't pay.</p>
                        </div>
                    </Reveal>
                </div>
            </Section>
        </div>
    );
};

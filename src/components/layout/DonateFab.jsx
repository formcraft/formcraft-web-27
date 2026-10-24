import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Drawer } from "../ui/Drawer";
import "./DonateFab.css";

// Floating plant-a-tree button on every page. Payments stay off until a planting
// partner and the price per tree are agreed (open question in the build plan).
const SPECIES = [
    { id: "mvule", name: "Mvule", latin: "Milicia excelsa", note: "Native hardwood that lives for generations." },
    { id: "musizi", name: "Musizi", latin: "Maesopsis eminii", note: "Fast-growing native for shade and soil cover." },
    { id: "ffene", name: "Ffene", latin: "Jackfruit", note: "A fruit tree that feeds a household." },
];
const AMOUNTS = [1, 5, 10];

export const DonateFab = () => {
    const [open, setOpen] = useState(false);
    const [species, setSpecies] = useState("mvule");
    const [amount, setAmount] = useState(5);
    const [custom, setCustom] = useState("");

    return (
        <>
            <button type="button" className="donate-fab" onClick={() => setOpen(true)} aria-haspopup="dialog">
                <Icon name="leaf" />
                <span className="donate-fab-label">Plant a tree</span>
            </button>

            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                title="Plant a tree with us"
                side="center"
                footer={
                    <div className="stack" style={{ "--gap": "10px" }}>
                        <button type="button" className="btn btn-primary btn-block" disabled>
                            Pay by mobile money or card · coming soon
                        </button>
                        <p className="fine">
                            TODO: planting partner and price per tree to confirm. <Link to="/donate">How it will work</Link>
                        </p>
                    </div>
                }
            >
                <div className="stack" style={{ "--gap": "18px" }}>
                    <p className="small">Give back some of what building takes.</p>
                    <div className="donate-count paper-dark">
                        <b>[n]</b>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700 }}>trees planted so far</span>
                            <div className="bar" aria-hidden="true">
                                <i style={{ "--value": "38%" }} />
                            </div>
                            <span className="fine">Goal: [n] trees by [year]</span>
                        </div>
                    </div>
                    <fieldset className="donate-set">
                        <legend>Choose a tree</legend>
                        {SPECIES.map((s) => (
                            <label key={s.id} className="option donate-species">
                                <input type="radio" name="tree" value={s.id} checked={species === s.id} onChange={() => setSpecies(s.id)} />
                                <span>
                                    <strong>{s.name}</strong> <em>{s.latin}</em>
                                </span>
                                <span className="fine">{s.note}</span>
                            </label>
                        ))}
                    </fieldset>
                    <fieldset className="donate-set">
                        <legend>How many trees?</legend>
                        <div className="row" style={{ "--gap": "8px" }}>
                            {AMOUNTS.map((n) => (
                                <label key={n} className="chip">
                                    <input
                                        type="radio"
                                        name="trees"
                                        checked={amount === n && !custom}
                                        onChange={() => {
                                            setAmount(n);
                                            setCustom("");
                                        }}
                                    />
                                    {n} {n === 1 ? "tree" : "trees"}
                                </label>
                            ))}
                            <div className="field" style={{ width: 120 }}>
                                <label htmlFor="trees-custom" className="sr-only">
                                    Another number of trees
                                </label>
                                <input
                                    id="trees-custom"
                                    inputMode="numeric"
                                    placeholder="Other"
                                    value={custom}
                                    onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    style={{ minHeight: 42 }}
                                />
                            </div>
                        </div>
                    </fieldset>
                    <div className="field">
                        <label htmlFor="donor-name">Name for the donor wall (optional)</label>
                        <input id="donor-name" autoComplete="name" />
                    </div>
                </div>
            </Drawer>
        </>
    );
};

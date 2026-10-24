import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Popover } from "../ui/Popover";
import { usePublicDoc } from "../../hooks/usePublicDoc";
import { useShowLink } from "../../hooks/useSite";
import { formatUGX } from "../../lib/money";
import "./DonateFab.css";

// Floating plant-a-tree button on every page. It opens a small card just above itself (the page
// stays visible): the live count, quick picks and one Plant button; species, the donor-wall name
// and the rest live on /donate. Payments stay off until a planting partner and the price per tree
// are agreed (open question in the build plan); only the webhook will ever add trees to the count.
const AMOUNTS = [1, 5, 10];
const count = (n) => (Number.isInteger(n) ? new Intl.NumberFormat("en-UG").format(n) : "[n]");

export const DonateFab = () => {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(5);
    const button = useRef(null);
    const showLink = useShowLink();
    const { data: stats } = usePublicDoc("stats/public");
    const trees = `${amount} ${amount === 1 ? "tree" : "trees"}`;

    return (
        <>
            <button
                ref={button}
                type="button"
                className="donate-fab"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <Icon name="leaf" />
                <span className="donate-fab-label">Plant a tree</span>
            </button>

            <Popover
                open={open}
                onClose={() => setOpen(false)}
                anchorRef={button}
                title="Plant a tree"
                className="donate-fab-pop"
                footer={
                    <div className="donate-fab-actions">
                        <button type="button" className="btn btn-primary btn-block" disabled aria-describedby="donate-fab-note">
                            Plant {trees}
                        </button>
                        <p id="donate-fab-note" className="fine">
                            Payments open once our planting partner is confirmed.
                        </p>
                        {showLink("/donate") && (
                            <Link to="/donate" className="link donate-fab-more" onClick={() => setOpen(false)}>
                                More options <Icon name="arrow" size={16} />
                            </Link>
                        )}
                    </div>
                }
            >
                <div className="donate-fab-count paper-dark">
                    <b>{count(stats?.treesPlanted)}</b>
                    <span>trees planted so far</span>
                </div>
                <fieldset className="donate-fab-set">
                    <legend>How many trees?</legend>
                    <div className="donate-fab-picks">
                        {AMOUNTS.map((n) => (
                            <label key={n} className="chip">
                                <input type="radio" name="donate-fab-trees" checked={amount === n} onChange={() => setAmount(n)} />
                                {n} {n === 1 ? "tree" : "trees"}
                            </label>
                        ))}
                    </div>
                </fieldset>
                <p className="donate-fab-price">
                    {trees} · <span className="todo">{formatUGX(null)}</span>
                    <span className="fine"> TODO: price per tree to confirm.</span>
                </p>
            </Popover>
        </>
    );
};

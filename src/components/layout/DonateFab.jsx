import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Popover } from "../ui/Popover";
import { usePublicDoc } from "../../hooks/usePublicDoc";
import { useShowLink } from "../../hooks/useSite";
import { Todo } from "../ui/Todo";
import "./DonateFab.css";

// Floating plant-a-tree button on every page. It opens a small card just above itself (the page
// stays visible): the live count, quick picks and one Plant button; species, the donor-wall name
// and the rest live on /donate. Payments stay off until a planting partner and the price per tree
// are agreed (open question in the build plan); only the webhook will ever add trees to the count.
const AMOUNTS = [1, 5, 10];
const count = (n) => new Intl.NumberFormat("en-UG").format(n);

/**
 * On phones the button would sit on top of the first screen's text, so it waits until the visitor has
 * scrolled about 60% of a screen, then slides in. On wider screens it's always there.
 * @returns {boolean} true while the button should stay out of the way
 */
const useAwayAtTop = () => {
    const [away, setAway] = useState(false);
    useEffect(() => {
        const phone = window.matchMedia?.("(max-width: 700px)");
        const update = () => setAway(Boolean(phone?.matches) && window.scrollY < window.innerHeight * 0.6);
        update();
        window.addEventListener("scroll", update, { passive: true });
        phone?.addEventListener?.("change", update);
        return () => {
            window.removeEventListener("scroll", update);
            phone?.removeEventListener?.("change", update);
        };
    }, []);
    return away;
};

/** The floating plant-a-tree button and its pop-up. Rendered once by Layout.jsx on every page. */
export const DonateFab = () => {
    const [open, setOpen] = useState(false);
    const away = useAwayAtTop() && !open;
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
                className={`donate-fab ${away ? "is-away" : ""}`}
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
                    {Number.isInteger(stats?.treesPlanted) ? (
                        <>
                            <b>{count(stats.treesPlanted)}</b>
                            <span>trees planted so far</span>
                        </>
                    ) : (
                        <span>The count starts with the first planting.</span>
                    )}
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
                    {trees} <Todo>TODO: price per tree to confirm.</Todo>
                </p>
            </Popover>
        </>
    );
};

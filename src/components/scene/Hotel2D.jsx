import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildHotel2D, viewBoxFor } from "./hotel2dGeometry";
import "./Hotel2D.css";

// The 2D edition of the home page hotel: a vector paper-cut drawing of the same model the 3D
// scene shows (same geometry, same hero camera, see hotel2dGeometry.js). Devices that can't run
// the 3D model sharp get this instead. Two stacked SVGs: the torn backdrop sheets behind, the
// board, hotel and greenery in front, so the scroll parallax moves whole layers on the GPU.
// The paper grain comes from the layer it sits in (.hotel-scene-grain in HotelScene).
//
// animate: the build-in (sheets rise, board settles, the hotel assembles floor by floor, the
// trees grow) and the scroll parallax. Off with prefers-reduced-motion. Timing scales with
// --fc-motion-build on <html> (set from Admin).

const f1 = (n) => Math.round(n * 10) / 10;

const useSize = (ref) => {
    const [size, setSize] = useState(() =>
        typeof window === "undefined" ? { w: 1600, h: 1000 } : { w: window.innerWidth, h: window.innerHeight },
    );
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === "undefined") return undefined;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width < 1 || height < 1) return;
            setSize((s) => (Math.abs(s.w - width) < 2 && Math.abs(s.h - height) < 2 ? s : { w: Math.round(width), h: Math.round(height) }));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);
    return size;
};

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The moon (night): a cut-paper disc with a lit crescent, as in the 3D scene, placed in screen
// space like the 3D one (top left of the frame, whatever the screen's shape)
const Moon = ({ vb, kind, uid }) => {
    // portrait: smaller, in the gap between the header and the roof
    const r = kind === "land" ? vb.h * 0.0785 : vb.w * 0.06;
    const cx = vb.x + (kind === "land" ? vb.w * 0.05 : vb.w * 0.13);
    const cy = vb.y + (kind === "land" ? vb.h * 0.1 : vb.w * 0.21);
    const dx = 0.62, ix = dx / 2, iy = Math.sqrt(1 - ix * ix);
    const crescent = `M${ix} ${-iy}A1 1 0 1 0 ${ix} ${iy}A1 1 0 0 1 ${ix} ${-iy}Z`;
    return (
        <g className="h2-moon" transform={`translate(${f1(cx)} ${f1(cy)}) scale(${f1(r)})`}>
            <circle r="5" fill={`url(#${uid}mg)`} />
            <circle r="1.06" className="h2-moon-rim" />
            <circle r="1" className="h2-moon-dark" />
            <path d={crescent} className="h2-moon-lit" />
            <circle cx="-.55" cy=".3" r=".19" className="h2-moon-sea" />
            <circle cx="-.62" cy="-.26" r=".15" className="h2-moon-sea" />
            <circle cx="-.3" cy="-.62" r=".11" className="h2-moon-sea" />
            <circle cx="-.72" cy=".02" r=".08" className="h2-moon-pit" />
            <circle cx="-.42" cy=".62" r=".06" className="h2-moon-pit" />
        </g>
    );
};

const Item = ({ it, uid }) => (
    <g className={it.kind === "lamp" ? "h2-pop" : "h2-grow"} style={{ "--d": it.delay }}>
        {it.kind === "tree" && it.layers[1]?.[0] === "gr1" && <path className="h2-tsh" d={it.layers[1][1]} />}
        {it.layers.map(([cls, d], i) => d && <path key={i} className={cls} d={d} fill={cls.startsWith("cyl-") ? `url(#${uid}${cls})` : undefined} />)}
    </g>
);

export const Hotel2D = ({ edition = "day", animate = true }) => {
    const rootRef = useRef(null);
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const size = useSize(rootRef);
    const vb = viewBoxFor(size.w, size.h);
    const night = edition === "night";
    const g = useMemo(() => buildHotel2D(vb.kind, night ? "night" : "day"), [vb.kind, night]);
    const [reduced] = useState(prefersReduced);
    const moving = animate && !reduced;

    // soft scroll parallax: the backdrop sheets move slower than the hotel (one passive listener)
    useEffect(() => {
        const el = rootRef.current;
        if (!moving || !el) return undefined;
        let raf = 0;
        const update = () => {
            raf = 0;
            el.style.setProperty("--h2-y", Math.min(window.scrollY, window.innerHeight * 1.5).toFixed(1));
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [moving]);

    const viewBox = `${f1(vb.x)} ${f1(vb.y)} ${f1(vb.w)} ${f1(vb.h)}`;
    const { back, front } = g;
    const p = front.print;

    return (
        <div ref={rootRef} className={`h2 ${moving ? "h2-anim" : ""}`} data-edition={night ? "night" : "day"} aria-hidden="true">
            <svg className="h2-back" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" focusable="false">
                <defs>
                    <linearGradient id={`${uid}fl`} gradientUnits="userSpaceOnUse" x1="0" y1={f1(back.horizon)} x2="0" y2={g.h}>
                        <stop offset="0" className="h2-stop-bg" />
                        <stop offset="1" className="h2-stop-floor" />
                    </linearGradient>
                    {night && (
                        <radialGradient id={`${uid}mg`}>
                            <stop offset="0" className="h2-stop-moon" />
                            <stop offset="1" className="h2-stop-moon0" />
                        </radialGradient>
                    )}
                    {back.sheets.map((s) => (
                        <clipPath key={s.i} id={`${uid}c${s.i}`}>
                            <path d={s.clip} />
                        </clipPath>
                    ))}
                    {back.sheets.map((s) => <path key={s.i} id={`${uid}s${s.i}`} d={s.d} />)}
                </defs>
                <path d={back.floor} fill={`url(#${uid}fl)`} />
                {back.sheets.map((s) => (
                    <g key={s.i} clipPath={`url(#${uid}c${s.i})`}>
                        <g className="h2-rise" style={{ "--d": s.delay, "--rise": `${s.rise}px` }}>
                            <use href={`#${uid}s${s.i}`} className="h2-ssh h2-ssh-2" />
                            <use href={`#${uid}s${s.i}`} className="h2-ssh" />
                            <path d={s.rim} className={`h2-rim-${s.i}`} />
                            <use href={`#${uid}s${s.i}`} className={`h2-sheet-${s.i}`} />
                        </g>
                    </g>
                ))}
                {/* the moon hangs in front of the far sheets, as in the 3D scene */}
                {night && <Moon vb={vb} kind={vb.kind} uid={uid} />}
                {back.stars && (
                    <g className="h2-stars">
                        <path d={back.stars.threads} className="h2-thread" />
                        <path d={back.stars.small} className="h2-star" />
                        <path d={back.stars.warm} className="h2-star h2-star-w" />
                        <path d={back.stars.hung} className="h2-star h2-star-w" />
                    </g>
                )}
                {back.scraps.map((s, i) => <path key={i} d={s.d} className={`h2-scrap ${s.m}`} />)}
            </svg>

            <svg className="h2-front" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" focusable="false" style={{ "--drop": `${-front.drop}px`, "--settle": `${-front.settle}px` }}>
                <defs>
                    {["w", "o", "n"].map((m) => (
                        <linearGradient key={m} id={`${uid}cyl-${m}`} x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0" className={`h2-cs-${m} h2-cs-hi`} />
                            <stop offset=".5" className={`h2-cs-${m}`} />
                            <stop offset="1" className={`h2-cs-${m} h2-cs-lo`} />
                        </linearGradient>
                    ))}
                    {night && (
                        <radialGradient id={`${uid}glow`}>
                            <stop offset="0" className="h2-stop-glow" />
                            <stop offset="1" className="h2-stop-glow0" />
                        </radialGradient>
                    )}
                </defs>
                <g className="h2-settle" style={{ "--d": 1.4 }}>
                    {front.board.map((b, i) => <path key={i} className={b.cls} d={b.d} />)}
                    <path className="h2-pr-gfill" d={p.greenFill} />
                    <path className="h2-pr h2-pr-fine" d={p.fine} />
                    <path className="h2-pr h2-pr-contour" d={p.contour} />
                    <path className="h2-pr h2-pr-grid" d={p.grid} />
                    <path className="h2-pr h2-pr-strong" d={p.strong} />
                    <path className="h2-pr h2-pr-acc" d={p.acc} />
                    <path className="h2-pr h2-pr-green" d={p.green} />
                    <path className="h2-pr h2-pr-ink" d={p.ink} />
                    {front.contours.map((c, i) => <path key={i} className={c.cls} d={c.d} />)}
                </g>
                <path className="h2-gshadow" d={front.shadow} style={{ "--d": 4.3 }} />
                {front.pools.map((pl, i) => <path key={i} className={`h2-pool ${pl.cls}`} d={pl.d} fill={`url(#${uid}glow)`} style={{ "--d": 5.2 }} />)}
                <g className="h2-grow" style={{ "--d": 4.6 }}>
                    {front.tufts.map((d, i) => <path key={i} className={`gr${i + 3}`} d={d} />)}
                </g>
                {front.backItems.map((it, i) => <Item key={i} it={it} uid={uid} />)}
                <g className="h2-grow" style={{ "--d": front.creeper.delay }}>
                    {front.creeper.d.map((d, i) => <path key={i} className={`gr${i + 2}`} d={d} />)}
                </g>
                {front.pieces.map((pc, i) => (
                    <g key={i} className={pc.lamp ? "h2-pop" : "h2-drop"} style={{ "--d": pc.delay }}>
                        {pc.items.map((it, j) => <path key={j} className={it.cls} d={it.d} fill={it.cls === "cyl" ? `url(#${uid}cyl-w)` : undefined} />)}
                    </g>
                ))}
                {front.frontItems.map((it, i) => <Item key={i} it={it} uid={uid} />)}
            </svg>
        </div>
    );
};

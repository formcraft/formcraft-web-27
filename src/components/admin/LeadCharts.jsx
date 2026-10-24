import { useState } from "react";
import "./LeadCharts.css";

// Small SVG charts for the Leads screen — no chart library. One series each, in the brand orange;
// text stays in ink colours. Every chart has a one-line summary and a "Show as table" toggle, and
// each bar has a <title> tooltip on hover.

const Frame = ({ title, summary, rows, unit = "leads", children }) => {
    const [table, setTable] = useState(false);
    return (
        <figure className="card card-pad lead-chart">
            <figcaption className="lead-chart-head">
                <span className="h4">{title}</span>
                <button type="button" className="btn btn-line btn-sm lead-chart-toggle" aria-pressed={table} onClick={() => setTable((t) => !t)}>
                    {table ? "Show as chart" : "Show as table"}
                </button>
            </figcaption>
            <p className="small lead-chart-summary">{summary}</p>
            {rows.length === 0 ? (
                <p className="fine">Nothing in this range yet.</p>
            ) : table ? (
                <div className="table-wrap" role="region" aria-label={`${title} (table)`} tabIndex={0}>
                    <table className="table lead-chart-table">
                        <thead>
                            <tr>
                                <th scope="col">{title.split(" by ")[1] ?? "Item"}</th>
                                <th scope="col" className="num-cell">{unit}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(([label, n]) => (
                                <tr key={label}>
                                    <td>{label}</td>
                                    <td className="num-cell">{n}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                children
            )}
        </figure>
    );
};

// Vertical bars over time (rows in order, oldest first)
export const WeekBars = ({ title, rows, summary }) => {
    const W = 600;
    const H = 180;
    const pad = { top: 18, bottom: 26, left: 8, right: 8 };
    const max = Math.max(1, ...rows.map(([, n]) => n));
    const step = (W - pad.left - pad.right) / Math.max(1, rows.length);
    const bw = Math.max(6, Math.min(28, step - 6));
    const y = (n) => pad.top + (H - pad.top - pad.bottom) * (1 - n / max);
    const lastWithData = rows.reduce((acc, [, n], i) => (n > 0 ? i : acc), -1);
    return (
        <Frame title={title} rows={rows} summary={summary}>
            <svg className="lead-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
                <line x1={pad.left} x2={W - pad.right} y1={H - pad.bottom} y2={H - pad.bottom} className="lead-axis" />
                {rows.map(([label, n], i) => {
                    const x = pad.left + i * step + (step - bw) / 2;
                    const top = y(n);
                    const h = H - pad.bottom - top;
                    const r = Math.min(4, bw / 2, h);
                    return (
                        <g key={label} className="lead-bar-group">
                            <rect x={pad.left + i * step} y={pad.top} width={step} height={H - pad.top - pad.bottom} className="lead-hit">
                                <title>{`${label}: ${n}`}</title>
                            </rect>
                            {n > 0 && (
                                <path
                                    className="lead-bar"
                                    d={`M${x},${H - pad.bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${H - pad.bottom} Z`}
                                />
                            )}
                            {(i === lastWithData || n === max) && n > 0 && (
                                <text x={x + bw / 2} y={top - 5} textAnchor="middle" className="lead-value">{n}</text>
                            )}
                            {(i % 2 === rows.length % 2 || i === rows.length - 1) && (
                                <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="lead-label">{label}</text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </Frame>
    );
};

// Horizontal bars, biggest first (top N)
export const RankBars = ({ title, rows, summary, unit }) => {
    const max = Math.max(1, ...rows.map(([, n]) => n));
    return (
        <Frame title={title} rows={rows} summary={summary} unit={unit}>
            <ul className="lead-rank">
                {rows.map(([label, n]) => (
                    <li key={label} title={`${label}: ${n}`}>
                        <span className="lead-rank-label">{label}</span>
                        <span className="lead-rank-track" aria-hidden="true">
                            <i style={{ "--w": `${(n / max) * 100}%` }} />
                        </span>
                        <span className="lead-rank-n">{n}</span>
                    </li>
                ))}
            </ul>
        </Frame>
    );
};

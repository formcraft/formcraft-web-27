import { STATUSES } from "../../../lib/studio";

// A post's status as a small coloured tag (colours in StudioPanel.css, from tokens)
export const StatusTag = ({ status }) => <span className={`mkt-status mkt-st-${status || "draft"}`}>{STATUSES[status] ?? status ?? "Draft"}</span>;

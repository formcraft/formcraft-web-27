// Shown for the split second a page's code is loading: the page shape, never a blank screen.
export const PageSkeleton = () => (
    <div className="wrap section" aria-busy="true" aria-label="Loading page">
        <div className="stack" style={{ "--gap": "18px", maxWidth: 720 }}>
            <div className="skeleton" style={{ height: 14, width: 180 }} />
            <div className="skeleton" style={{ height: 72, width: "90%" }} />
            <div className="skeleton" style={{ height: 72, width: "70%" }} />
            <div className="skeleton" style={{ height: 18, width: "60%", marginTop: 12 }} />
        </div>
    </div>
);

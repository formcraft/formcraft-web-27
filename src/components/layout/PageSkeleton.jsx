// PageSkeleton: grey placeholder bars in the shape of a page, shown for the split second a page's code
// is downloading (App.jsx uses it as the Suspense fallback). The project rule is "never a blank
// screen": visitors always see something page-shaped while they wait.
// aria-busy tells screen readers the page is still loading.
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

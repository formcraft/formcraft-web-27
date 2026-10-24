// The site's starting point. The browser runs this file first (index.html points to it).
// It loads the shared styles once (fonts, colours, layout helpers, shared components), draws the
// whole app into <div id="root"> in index.html, and, on the live site only, switches on the
// service worker (public/sw.js) that keeps a copy of the site for fast repeat visits and offline use.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The shared styles come first, so every component stylesheet (loaded with the app below) can build on them.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Offline cache and fast repeat visits (public/sw.js). Production only, so development
// always shows fresh files.
// The first visit isn't controlled by the worker yet, so once it's ready the page tells it which of
// the site's own files it already loaded (entry script, CSS, lazy page chunks, fonts, textures) and
// the worker caches them: that's what lets Home open offline after a single visit.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
    const loadedFiles = () => {
        try {
            return performance
                .getEntriesByType("resource")
                .map((e) => new URL(e.name, location.href))
                .filter((u) => u.origin === location.origin && /^\/(assets|fonts|textures|logos|images)\//.test(u.pathname))
                .map((u) => u.pathname + u.search);
        } catch {
            return [];
        }
    };
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
        navigator.serviceWorker.ready
            .then((reg) => {
                const send = () => reg.active?.postMessage({ type: "fc-cache-urls", urls: loadedFiles() });
                send();
                // again once it takes control, and after the page has settled (late lazy chunks)
                navigator.serviceWorker.addEventListener("controllerchange", send, { once: true });
                setTimeout(send, 15000);
            })
            .catch(() => {});
    });
}

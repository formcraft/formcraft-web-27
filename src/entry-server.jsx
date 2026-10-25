// Build-time entry for pre-rendering (scripts/prerender.mjs; never shipped to visitors). It renders the same app
// as the browser (App.jsx's AppTree) at a fixed address and returns the HTML that goes inside <div id="root">.
// Device-dependent parts (saved settings, cached text, the cart, the clock, the edition's own markup) render their
// build-time defaults here, exactly as the browser's first render does (src/hooks/useHydration.js), so the browser
// can adopt this HTML without drawing it again.
import { StrictMode } from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { StaticRouter } from "react-router-dom/server";
import { AppTree } from "./App.jsx";
import { registerPages } from "./lib/pageRegistry.js";
import { preloadStarters } from "./hooks/useContent.js";

// every page's code up front, so the HTML holds the finished page (the browser keeps loading pages on demand)
registerPages(import.meta.glob("./pages/*.jsx", { eager: true }));

const streamToString = async (stream) => {
    let html = "";
    for await (const chunk of stream) html += chunk;
    return html;
};

/**
 * Renders one address to HTML, waiting for the page's code (lazy routes) to load.
 * @param {string} url  e.g. "/studio"
 * @returns {Promise<string>} the markup for inside <div id="root">
 */
export const render = async (url) => {
    await preloadStarters(); // the starter content (products, projects, posts…) for the first render
    const Router = ({ children }) => <StaticRouter location={url}>{children}</StaticRouter>;
    // progressiveChunkSize: React would otherwise split big sections out of the HTML and swap them in with a
    // script at the end (useful when streaming); a pre-built file should simply contain the finished page
    const { prelude } = await prerenderToNodeStream(
        <StrictMode>
            <AppTree Router={Router} />
        </StrictMode>,
        { progressiveChunkSize: Number.POSITIVE_INFINITY }
    );
    return streamToString(prelude);
};

// Build time only: the page modules handed over up front by src/entry-server.jsx, so the pre-rendered HTML holds
// each finished page. routes.jsx uses a page from here when it's there, else loads it on demand (the browser).
// Kept in its own file: importing the pages anywhere the browser loads would put them all into its main file.

const ready = {};

/** Hands over the page modules (import.meta.glob("./pages/*.jsx", { eager: true })). @param {Record<string, object>} modules */
export const registerPages = (modules) => Object.assign(ready, modules);

/** A page component already loaded at build time, or undefined (load it on demand). @param {string} name e.g. "Studio" */
export const loadedPage = (name) => ready[`./pages/${name}.jsx`]?.[name];

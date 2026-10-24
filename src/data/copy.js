// The copy register: every piece of text the team can edit in Admin → Copy, page by page, in the order it
// appears. The text here is the built-in wording (the default). An edit published in Admin is saved in
// Firestore `copy/{page}` and shown instead; deleting the edit brings this wording back.
//
// Each entry: id (unique within its page, never reused once deleted), section (a heading in the panel),
// kind ("title", "text", "button", "label", "alt", "meta"), the default text and its length limit.
// Text can use a tiny markup: **bold**, *italic* and line breaks (src/lib/copyText.jsx); nothing else, so
// an edit can't break the design or inject code. Titles and paragraphs can also be made a size
// smaller or larger. The tagline is never in here (Brand Guide: never reworded), and firestore.rules
// refuse a `tagline` key too.
//
// To put another page in Admin → Copy: add it to COPY below, then read the text in the page with
// useCopy("<page key>") (src/hooks/useCopy.js). Keep the defaults identical to the page's current text.
import { ROUTES } from "./seo.js";

// A sensible limit when none is given: room to rephrase, not to write an essay
const roomFor = (kind, text) => {
    const factor = kind === "title" || kind === "button" ? 1.4 : 1.5;
    return Math.max(kind === "button" || kind === "label" ? 24 : 40, Math.ceil((text.length * factor) / 5) * 5);
};

const item = (section, kind) => (id, text, max) => ({ id, section, kind, text, max: max ?? roomFor(kind, text) });

// The search-engine title and description of a route, from src/data/seo.js (limits from seo.js too)
const meta = (path) => {
    const r = ROUTES[path];
    const m = item("Search and link previews", "meta");
    return [
        { ...m("metaTitle", r.fullTitle ?? r.title, 60), full: Boolean(r.fullTitle), label: "Page title (search results and browser tab)" },
        { ...m("metaDescription", r.description, 155), label: "Description (search results and link previews)" },
    ];
};

/** Kinds of text that can be made a size smaller or larger in Admin → Copy. */
export const SIZED_KINDS = ["title", "text"];

/** Size presets: inside the brand's type scale, never free font sizes. */
export const COPY_SIZES = { sm: "Smaller", md: "Standard", lg: "Larger" };

const hero = item("Hero", "text");
const heroT = item("Hero", "button");
const heroL = item("Hero", "label");
const why = item("Why Formcraft exists", "text");
const whyT = item("Why Formcraft exists", "title");
const chain = item("One value chain", "text");
const chainT = item("One value chain", "title");
const chainB = item("One value chain", "button");
const bim = item("How every project runs", "text");
const bimT = item("How every project runs", "title");
const bimL = item("How every project runs", "label");
const bimA = item("How every project runs", "alt");
const tpl = item("Template builds", "text");
const tplT = item("Template builds", "title");
const tplB = item("Template builds", "button");
const tplL = item("Template builds", "label");
const plan = item("Site plan", "text");
const planT = item("Site plan", "title");
const planL = item("Site plan", "label");
const work = item("Flagship work", "label");
const workT = item("Flagship work", "title");
const impact = item("Live counts", "label");
const impactT = item("Live counts", "title");
const road = item("Roadmap", "text");
const roadT = item("Roadmap", "title");
const roadL = item("Roadmap", "label");
const doors = item("Find your way in", "text");
const doorsT = item("Find your way in", "title");
const doorsB = item("Find your way in", "button");
const doorsL = item("Find your way in", "label");

/**
 * Every page in Admin → Copy: { [pageKey]: { label, path, items: [...] } }. The page key matches
 * src/data/pages.js, so the right text loads with the page.
 */
export const COPY = {
    home: {
        label: "Home",
        path: "/",
        items: [
            ...meta("/"),
            heroL("heroEyebrow", "Design & Construction · Kampala, Uganda"),
            hero("heroLead", "One design-build value chain — BIM-led design, structural concrete and hand-crafted joinery — so you get one point of accountability, predictable cost and precision from first survey to finished interior."),
            heroT("heroCta", "Start a project"),
            heroT("heroCta2", "See how we work"),
            heroL("heroKeyDesign", "In design"),
            heroL("heroKeyDesignNote", "resolved in the model first"),
            heroL("heroKeyBuilt", "Built"),
            heroL("heroKeyBuiltNote", "from the same model"),
            heroL("heroModelNote", "Four-storey hotel · scale model"),
            heroL("dragHint", "Drag to turn the model"),

            item("Why Formcraft exists", "label")("whyEyebrow", "Why Formcraft exists"),
            whyT("whyTitle", "Designers and artisans kept working apart."),
            why("whyBody", "Emlyn Atochon and Peter Isingoma met studying interior architecture at Limkokwing University in Mukono. On every project with local craftsmen they hit the same wall: coordination between the drawing board and the workshop broke down, and many artisans saw abstract design as *okwekoza* — pretence, disconnected from the bench."),
            why("whyBody2", "Formcraft closes that gap. Digital modellers, engineers and workshop artisans work from the same table and the same information, so precision and handcraft improve each other at every step."),
            item("Why Formcraft exists", "label")("whyBridge", "Bridging blueprint to bench."),

            item("One value chain", "label")("chainEyebrow", "One value chain"),
            chainT("chainTitle", "From first site survey to the last piece of joinery."),
            chain("chainIntro", "Four divisions under one roof. One contract, one model, one team accountable for the result."),
            chainT("studioTitle", "BIM & CAD design, pre-construction"),
            chain("studioText", "Surveys, architecture, structure, MEP and bills of quantities — resolved in the model before anyone breaks ground."),
            chainB("studioCta", "Explore the studio"),
            chainT("constructionTitle", "Building what the model promised"),
            chain("constructionText", "Built zone by zone from a construction-ready model — plus ready-to-build home designs."),
            chainB("constructionCta", "Construction"),
            chainT("concreteTitle", "Precast and green concrete"),
            chain("concreteText", "Columns, beams, lintels, pavers and facade panels, made for durability and fast site assembly."),
            chainB("concreteCta", "Concrete"),
            chainT("storesTitle", "Furniture, joinery and goods"),
            chain("storesText", "Versioned furniture, kitchens, wardrobes and doors from our Kampala workshop."),
            chainB("storesCta", "Visit the store"),

            bimL("bimEyebrow", "How every project runs"),
            bimT("bimTitle", "Models built the way the building is built."),
            bim("bimBody", "Our BIM stands on two equal foundations. **Modelling:** every model is a first, virtual build of the project — right trade, right storey, real sizes. **Information:** a wall coded B.200_00 in the model carries the same specification, rate and carbon factor into the drawing, the schedule, the bill of quantities, the clash report and the IFC file. Nobody retypes any of it."),
            bimL("bimCode", "B.200_00"),
            bimL("bimCodeLabel", "200 mm Class A blockwork"),
            item("How every project runs", "button")("bimLink", "How our BIM system works"),
            bimL("bimModelCaption", "The model"),
            bimL("bimModelNote", "Bwebajja landscape"),
            bimA("bimModelAlt", "Bwebajja landscape: model view, every wall and level a real element"),
            bimL("bimRenderCaption", "The render, from the same model"),
            bimA("bimRenderAlt", "The same Bwebajja landscape rendered at night from the model"),
            bimL("kpi1", "178"),
            bimL("kpi1Label", "shared parameters in one data dictionary"),
            bimL("kpi2", "196"),
            bimL("kpi2Label", "coded building elements, priced from one workbook"),
            bimL("kpi3", "ISO 19650"),
            bimL("kpi3Label", "aligned information process"),
            bimL("kpi4", "IFC · IDS"),
            bimL("kpi4Label", "open exchanges, checked before they leave"),

            tplL("tplEyebrow", "Template builds"),
            tplT("tplTitle", "A home you can choose today — and we'll build it."),
            tpl("tplBody", "Ready-to-build home designs for 50 × 100 ft plots, with the full drawing set, quantities and renders. We fit the design to your plot and build it, or you buy the plans on their own."),
            tplB("tplCta", "Browse template builds"),
            tplB("tplCta2", "Design one with us"),
            tplL("libTitle", "The home library"),
            tplL("libRelease", "Release 2026.1"),
            tplL("libPlaceholder", "Renders come with the first release"),
            tplL("libPlot", "50 × 100 ft plot"),
            tpl("libNote", "Designed by young Ugandan architects, who earn a royalty every time their design sells."),

            planL("planTag", "Site plan · 1:200"),
            planT("planTitle", "The model, seen from above."),
            plan("planBody", "The hotel stands on a Formcraft A1 sheet: the title block, the grid and the site plan drawn under it are the same ones we issue on real projects."),

            work("workEyebrow", "Flagship work"),
            workT("workTitle", "Work we've designed, built and made."),
            item("Flagship work", "button")("workLink", "All projects"),

            impact("impactEyebrow", "So far"),
            impactT("impactTitle", "Counted live, not rounded up."),
            impact("countArtisans", "artisans in the network"),
            impact("countProjects", "projects delivered"),
            impact("countTrees", "trees planted"),

            roadL("roadEyebrow", "Where we're going"),
            roadT("roadTitle", "From one chair to an East African design-build firm."),
            roadL("road1Year", "2023"),
            road("road1", "First bespoke craft piece made — the design-craft idea, proven."),
            roadL("road2Year", "2025"),
            road("road2", "Formcraft formally launched; architectural project work begins."),
            roadL("road3Year", "2026"),
            road("road3", "Registered as Formcraft Design and Construction Co. Ltd, Kampala."),
            roadL("road4Year", "Next"),
            road("road4", "10 new design contracts, a doubled artisan network, trade training programmes."),
            roadL("road5Year", "2028"),
            road("road5", "$1M annual revenue, 20% of profits reinvested in artisans, Kenya, Rwanda and South Africa."),

            doorsT("joinTitle", "Find your way in."),
            doorsL("hireWho", "Clients & developers"),
            doorsT("hireTitle", "Hire us"),
            doors("hireText", "Design, construction, concrete and template builds."),
            doorsB("hireCta", "Request a quote"),
            doorsL("shopWho", "Homes & offices"),
            doorsT("shopTitle", "Shop"),
            doors("shopText", "Furniture, joinery and goods from our workshop."),
            doorsB("shopCta", "Visit Stores"),
            doorsL("joinWho", "Artisans & students"),
            doorsT("joinDoorTitle", "Join"),
            doors("joinText", "Formcraft sets the market for the work — you focus on the craft."),
            doorsB("joinCta", "Join the community"),
            doorsL("backWho", "Investors & donors"),
            doorsT("backTitle", "Back us"),
            doors("backText", "Invest in Formcraft developments — from community crowdfunding to partner deals."),
            doorsB("backCta", "See the developments"),
        ],
    },
};

/** Ids that can never be published (Brand Guide); firestore.rules refuse them as well. */
export const LOCKED_IDS = ["tagline"];

const INDEX = Object.fromEntries(Object.entries(COPY).map(([page, p]) => [page, new Map(p.items.map((i) => [i.id, i]))]));

/** The register entry for a page's text id, or null. */
export const copyItem = (page, id) => INDEX[page]?.get(id) ?? null;

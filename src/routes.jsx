import { lazy } from "react";
import { Navigate } from "react-router-dom";

// One lazy chunk per page. Pages use named exports that match the file name.
const page = (name) => lazy(() => import(`./pages/${name}.jsx`).then((m) => ({ default: m[name] })));

const Home = page("Home");
const About = page("About");
const Studio = page("Studio");
const Construction = page("Construction");
const Concrete = page("Concrete");
const Stores = page("Stores");
const ProductPage = page("ProductPage");
const Projects = page("Projects");
const ProjectPage = page("ProjectPage");
const Contact = page("Contact");
const ComingSoon = page("ComingSoon");
const NotFound = page("NotFound");

// Pages not built yet get a plain "coming soon" sheet with the right title
const soon = (title, sheet, text) => <ComingSoon title={title} sheet={sheet} text={text} />;

export const routes = [
    { path: "/", element: <Home /> },
    { path: "/about", element: <About /> },
    { path: "/studio", element: <Studio /> },
    { path: "/construction", element: <Construction /> },
    { path: "/concrete", element: <Concrete /> },
    { path: "/stores", element: <Stores /> },
    { path: "/stores/:slug", element: <ProductPage /> },
    { path: "/projects", element: <Projects /> },
    { path: "/projects/:slug", element: <ProjectPage /> },
    { path: "/contact", element: <Contact /> },
    { path: "/community", element: soon("Community", "C101", "Member sign-up, the artisan directory and the commissions board arrive in Phase 4.") },
    { path: "/academy", element: soon("Academy", "C102", "BIM and CAD courses, workshops and internships arrive in Phase 4.") },
    { path: "/invest", element: soon("Invest", "I101", "Our roadmap, the property schemes and the investor pack arrive in Phase 2.") },
    { path: "/donate", element: soon("Plant a tree", "I104", "Tree donations open once a planting partner is agreed. Use the Plant a tree button to see how it will work.") },
    { path: "/donate/thank-you", element: soon("Thank you", "I105", "Thanks for planting with us.") },
    { path: "/account", element: soon("Your account", "U101", "Orders, downloads and your member profile arrive with the shop in Phase 3.") },
    { path: "/admin", element: soon("Admin", "U103", "The team's admin page arrives in Phase 2.") },
    { path: "/journal", element: soon("Journal", "A302", "Project stories and community news. TODO: decide whether the Journal stays.") },

    // Old paths keep working
    { path: "/shop", element: <Navigate to="/stores" replace /> },
    { path: "/portfolio", element: <Navigate to="/projects" replace /> },
    { path: "/services", element: <Navigate to="/studio" replace /> },
    { path: "/blog", element: <Navigate to="/journal" replace /> },

    { path: "*", element: <NotFound /> },
];

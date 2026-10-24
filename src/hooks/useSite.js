import { useContext } from "react";
import { SiteContext } from "../context/contexts";
import { pageForPath } from "../data/pages";

// Which pages visitors can see: { visibility, isOn(key), canSee(key), isAdmin, setPage(key, on) }
export const useSite = () => useContext(SiteContext);

// (to) => whether a link to that address should show: outside links and unknown paths always do;
// links to hidden pages don't (admins still see them).
export const useShowLink = () => {
    const site = useSite();
    return (to) => {
        const page = pageForPath(to);
        return !page || !site || site.canSee(page.key);
    };
};

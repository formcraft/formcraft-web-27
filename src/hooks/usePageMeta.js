import { useEffect } from "react";

// Each route sets its own <title> and meta description.
export const usePageMeta = (title, description) => {
    useEffect(() => {
        document.title = title ? `${title} · Formcraft` : "Formcraft · Designing spaces. Empowering communities.";
        if (description) {
            let tag = document.querySelector('meta[name="description"]');
            if (!tag) {
                tag = document.createElement("meta");
                tag.name = "description";
                document.head.appendChild(tag);
            }
            tag.setAttribute("content", description);
        }
    }, [title, description]);
};

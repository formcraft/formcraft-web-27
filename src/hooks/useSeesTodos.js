// useSeesTodos(): true for signed-in team members (admin, marketing, editor). They see the site's
// "To fill in: …" notes for missing facts; visitors don't (see src/components/ui/Todo.jsx).
import { useAuth } from "./useAuth";

/** @returns {boolean} whether the current visitor should see "To fill in" notes */
export const useSeesTodos = () => useAuth().isEditor;

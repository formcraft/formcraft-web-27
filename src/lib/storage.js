// localStorage that never throws: the site keeps working when storage is blocked.
export const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

export const writeJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage blocked or full: keep the value in memory only
    }
};

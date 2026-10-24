// Formcraft Cloud Functions (2nd gen). Needs the Blaze plan. Deploy with: firebase deploy --only functions
// - submitLead:      every public form goes through here once VITE_FORMS_VIA_FUNCTIONS=true —
//                    App Check, honeypot, validation and rate limits, then the Firestore write.
// - claimTeamRole:   a signed-in team member picks up their role (admin / marketing / editor)
//                    from team/{email}, set by an admin in Admin → Team.
// - onTeamChange:    keeps custom claims in step when an admin adds, changes or removes someone.
// Payment functions (createCheckout, flutterwaveWebhook) arrive in Phase 3.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { createHash } from "node:crypto";

initializeApp();
const db = getFirestore();

// TODO: use the same region as the Firestore database (open question in docs/build-plan.md),
// and set VITE_FUNCTIONS_REGION to match in .env.local.
setGlobalOptions({ region: "africa-south1", maxInstances: 10 });

// App Check is enforced only when it's set up (reCAPTCHA Enterprise key in the web app);
// flip ENFORCE_APP_CHECK to true in .env (functions) once the site sends tokens.
const ENFORCE_APP_CHECK = process.env.ENFORCE_APP_CHECK === "true";

// ---------- helpers ----------
const str = (v, max, required = false) => {
    const s = typeof v === "string" ? v.trim().slice(0, max) : "";
    if (required && !s) throw new HttpsError("invalid-argument", "Please fill in the required fields.");
    return s;
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const email = (v, required = true) => {
    const s = str(v, 200, required).toLowerCase();
    if (s && !EMAIL.test(s)) throw new HttpsError("invalid-argument", "That email address doesn't look right.");
    return s;
};
const hash = (s) => createHash("sha256").update(String(s)).digest("hex").slice(0, 32);

// a bounded copy of the attribution object from src/lib/attribution.js
const cleanSource = (src) => {
    if (!src || typeof src !== "object") return null;
    const touch = (t) =>
        t && typeof t === "object"
            ? Object.fromEntries(["source", "medium", "campaign", "content", "term", "referrer", "landing", "at"].map((k) => [k, str(t[k], 100)]).filter(([, v]) => v))
            : null;
    return { first: touch(src.first), last: touch(src.last), page: str(src.page, 200) };
};

// Simple fixed-window rate limit kept in Firestore (rateLimits/{key}); functions only.
const limit = async (key, max, windowMs) => {
    const ref = db.collection("rateLimits").doc(hash(key));
    const now = Date.now();
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const d = snap.exists ? snap.data() : null;
        if (d && now - d.start < windowMs) {
            if (d.count >= max) throw new HttpsError("resource-exhausted", "Too many messages from here. Please try again later, or call +256 753 929 921.");
            tx.update(ref, { count: d.count + 1 });
        } else {
            tx.set(ref, { start: now, count: 1, expiresAt: new Date(now + windowMs * 2) });
        }
    });
};

// ---------- forms ----------
const BUILDERS = {
    message: (d) => ({
        collection: "messages",
        doc: { name: str(d.name, 120, true), email: email(d.email), subject: str(d.subject, 200), body: str(d.body, 5000, true) },
        who: d.email,
    }),
    quote: (d) => {
        const budget = Number(String(d.budgetUGX ?? "").replace(/\D/g, ""));
        return {
            collection: "quotes",
            doc: {
                type: str(d.type, 40),
                name: str(d.name, 120, true),
                contact: str(d.contact, 200, true),
                location: str(d.location, 200),
                budgetUGX: Number.isSafeInteger(budget) && budget > 0 ? budget : null,
                message: str(d.message, 5000),
                files: Array.isArray(d.files) ? d.files.filter((f) => typeof f === "string" && f.startsWith("quotes/")).slice(0, 3) : [],
            },
            who: d.contact,
        };
    },
    investorLead: (d) => ({
        collection: "investorLeads",
        doc: { name: str(d.name, 120, true), org: str(d.org, 200), email: email(d.email), ticketSize: str(d.ticketSize, 80), message: str(d.message, 5000) },
        who: d.email,
    }),
    subscribe: (d) => {
        if (d.consent !== true) throw new HttpsError("invalid-argument", "Please tick the box to agree to updates.");
        return {
            collection: "subscribers",
            doc: {
                email: email(d.email),
                name: str(d.name, 120),
                interests: Array.isArray(d.interests) ? d.interests.map((i) => str(i, 40)).filter(Boolean).slice(0, 10) : [],
                consent: true,
                download: str(d.download, 80),
            },
            who: d.email,
        };
    },
};

export const submitLead = onCall({ enforceAppCheck: ENFORCE_APP_CHECK, cors: true }, async (req) => {
    const { type, data = {}, website } = req.data ?? {};
    const build = BUILDERS[type];
    if (!build) throw new HttpsError("invalid-argument", "Unknown form.");
    // honeypot: bots fill the hidden "website" field — pretend it worked, write nothing
    if (website) return { ok: true };
    const ip = req.rawRequest?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req.rawRequest?.ip || "unknown";
    await limit(`ip:${ip}`, 8, 10 * 60 * 1000); // 8 submissions per 10 minutes per connection
    const { collection, doc, who } = build(data);
    if (who) await limit(`who:${String(who).toLowerCase()}`, 5, 60 * 60 * 1000); // 5 per hour per email/phone
    const ref = await db.collection(collection).add({
        ...doc,
        source: cleanSource(data.source),
        page: str(data.page, 200),
        createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, id: ref.id };
});

// ---------- team roles ----------
const ROLES = ["admin", "marketing", "editor"];
const claimsFor = (member) => {
    if (!member || member.active === false || !ROLES.includes(member.role)) return { admin: null, role: null };
    return { admin: member.role === "admin" ? true : null, role: member.role };
};
const applyClaims = async (uid, member) => {
    const user = await getAuth().getUser(uid);
    const next = { ...(user.customClaims ?? {}) };
    const c = claimsFor(member);
    for (const [k, v] of Object.entries(c)) {
        if (v === null) delete next[k];
        else next[k] = v;
    }
    await getAuth().setCustomUserClaims(uid, next);
    return c.role;
};

// Called by the site after sign-in (AuthContext) so a newly added member gets their access.
export const claimTeamRole = onCall(async (req) => {
    const token = req.auth?.token;
    if (!token?.email || token.email_verified !== true) throw new HttpsError("unauthenticated", "Sign in with a verified email first.");
    const snap = await db.collection("team").doc(token.email.toLowerCase()).get();
    const role = await applyClaims(req.auth.uid, snap.exists ? snap.data() : null);
    return { role: role ?? null };
});

// When an admin adds, edits or removes someone in Admin → Team, update their claims straight away
// (if they've signed in before; otherwise claimTeamRole does it on their first sign-in).
export const onTeamChange = onDocumentWritten("team/{email}", async (event) => {
    const member = event.data?.after?.exists ? event.data.after.data() : null;
    try {
        const user = await getAuth().getUserByEmail(event.params.email);
        await applyClaims(user.uid, member);
    } catch (error) {
        if (error.code !== "auth/user-not-found") throw error;
    }
});

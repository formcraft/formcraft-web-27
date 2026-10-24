// Give a Formcraft account team access (the `admin: true` custom claim that firestore.rules and
// storage.rules check), or make it the owner. Run on your own machine with a service-account key, never in
// the browser:
//
//   npm install --no-save firebase-admin
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin.js you@example.com
//   node scripts/set-admin.js formcraftinc@gmail.com --owner        # the owner: full access + manages the team
//   node scripts/set-admin.js you@example.com --remove               # take all team access away (owner too)
//   node scripts/set-admin.js them@example.com --role marketing      # a limited role (or --role editor)
// The owner flag (claim `owner: true`) can only be set here: the website and the Cloud Functions never give
// or take it away. Only the owner manages Admin → Team (owner's decision, 2026-10-24); everyone else on the
// team gets the same full access (role "team").
//
// Against the emulators instead: FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/set-admin.js …
// The person signs out and back in to pick up the change. Keep service-account keys out of the repo
// (.gitignore already ignores *service-account*.json).
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, flag, roleArg] = process.argv.slice(2);
if (!email) {
    console.error("Usage: node scripts/set-admin.js <email> [--owner | --remove | --role marketing|editor]");
    process.exit(1);
}

initializeApp(process.env.FIREBASE_AUTH_EMULATOR_HOST ? { projectId: process.env.GCLOUD_PROJECT || "formcraft2027" } : { credential: applicationDefault() });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims ?? {}) };
if (flag === "--remove") {
    delete claims.admin;
    delete claims.role;
    delete claims.owner;
} else if (flag === "--role" && ["marketing", "editor"].includes(roleArg)) {
    claims.role = roleArg;
    delete claims.admin;
} else {
    // full team access; --owner also makes this person the one who manages the team
    claims.admin = true;
    claims.role = "team";
    if (flag === "--owner") claims.owner = true;
}
await auth.setCustomUserClaims(user.uid, claims);
console.log(`${email}: ${claims.owner ? "owner, " : ""}${claims.role ? `role ${claims.role}` : "no team access"}. Sign out and back in to pick it up.`);

// Give a Formcraft account admin rights (the `admin: true` custom claim that firestore.rules and
// storage.rules check). Run on your own machine with a service-account key, never in the browser:
//
//   npm install --no-save firebase-admin
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin.js you@example.com
//   node scripts/set-admin.js you@example.com --remove      # take admin rights away
//   node scripts/set-admin.js them@example.com --role marketing   # or --role editor
// Day to day, admins add people in Admin → Team instead (the claimTeamRole / onTeamChange
// functions set the same claims). This script is for the very first admin.
//
// Against the emulators instead: FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/set-admin.js …
// The person signs out and back in to pick up the change. Keep service-account keys out of the repo
// (.gitignore already ignores *service-account*.json).
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, flag, roleArg] = process.argv.slice(2);
if (!email) {
    console.error("Usage: node scripts/set-admin.js <email> [--remove]");
    process.exit(1);
}

initializeApp(process.env.FIREBASE_AUTH_EMULATOR_HOST ? { projectId: process.env.GCLOUD_PROJECT || "fromcraft-2026" } : { credential: applicationDefault() });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims ?? {}) };
if (flag === "--remove") {
    delete claims.admin;
    delete claims.role;
} else if (flag === "--role" && ["marketing", "editor", "admin"].includes(roleArg)) {
    claims.role = roleArg;
    if (roleArg === "admin") claims.admin = true;
    else delete claims.admin;
} else {
    claims.admin = true;
    claims.role = "admin";
}
await auth.setCustomUserClaims(user.uid, claims);
console.log(`${email}: ${claims.role ? `role ${claims.role}` : "no team role"}. Sign out and back in to pick it up.`);

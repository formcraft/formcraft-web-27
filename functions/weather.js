// Kampala weather for the living sky (ideas #23, docs/brief-living-sky.md Q6, work split C4). Needs the Blaze plan.
// Imported from index.js (the local side adds the line):  export { syncKampalaWeather } from "./weather.js";
//
// syncKampalaWeather (twice an hour, at :07 and :37 so it isn't on the hour like everyone else's):
//   1. does nothing unless Admin → Features "Live Kampala weather" is on (settings/site.features.liveWeather);
//   2. asks MET Norway's Locationforecast for Kampala, but only when their `Expires` time has passed, sending
//      If-Modified-Since with their exact previous Last-Modified (their terms of service), with a User-Agent that
//      names the site;
//   3. keeps the next 12 hours in the private weatherMeta/kampala (firestore.rules allow nobody; only this code);
//   4. writes the hour that covers now to the public stats/weather, which the site reads over REST:
//      { kind, intensity, windMs, windFromDeg, symbol, validFor, prevKind, changedAt, at }.
// Between downloads it still moves stats/weather on to the right hour from the kept forecast.
// Data: MET Norway, CC BY 4.0. Credit it on /privacy and in the footer small print while this is on
// ("Weather data: MET Norway (CC BY 4.0)"); don't use the name "Yr" or its logo.
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { KAMPALA, toSeries, pickNow, recordFor } from "./weatherMap.js";

// This module is evaluated before index.js runs setGlobalOptions(), so the region is set here too (as in studio.js).
// TODO: keep in step with index.js (same region as the Firestore database; open question).
const REGION = process.env.FUNCTIONS_REGION || "africa-south1";
// Same domain as src/data/seo.js SITE_URL; SITE_URL in functions/.env overrides it.
const SITE_URL = String(process.env.SITE_URL || "https://formcraftdesignconstruction.com").replace(/\/+$/, "");
const URL_ = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${KAMPALA.lat}&lon=${KAMPALA.lon}`;
const db = () => getFirestore(); // the app is initialised in index.js

/** Downloads the forecast if it's due; returns the kept series (new or old) and the meta to save. */
const fetchIfDue = async (meta, now) => {
    if (meta?.expires && now < new Date(meta.expires)) return { series: meta.series ?? [], meta, fetched: false };
    const headers = { "User-Agent": `formcraft-web/1.0 ${SITE_URL}`, Accept: "application/json" };
    if (meta?.lastModified) headers["If-Modified-Since"] = meta.lastModified;
    const res = await fetch(URL_, { headers });
    const expires = res.headers.get("expires") || new Date(now.getTime() + 30 * 60 * 1000).toUTCString();
    if (res.status === 304) return { series: meta.series ?? [], meta: { ...meta, expires }, fetched: false };
    if (!res.ok) throw new Error(`MET Norway answered ${res.status}`);
    const json = await res.json();
    return {
        series: toSeries(json, 12),
        meta: { lastModified: res.headers.get("last-modified") || null, expires, fetchedAt: now.toISOString() },
        fetched: true,
    };
};

/** Twice an hour: refresh Kampala's weather for the page heroes (see the notes at the top of this file). */
export const syncKampalaWeather = onSchedule({ schedule: "7,37 * * * *", timeZone: "Africa/Kampala", region: REGION, retryCount: 0 }, async () => {
    const settings = (await db().doc("settings/site").get()).data() ?? {};
    if (settings.features?.liveWeather !== true) return; // switched off in Admin → Features (the default until Blaze)
    const metaRef = db().doc("weatherMeta/kampala"), pubRef = db().doc("stats/weather");
    const [metaSnap, pubSnap] = await Promise.all([metaRef.get(), pubRef.get()]);
    const now = new Date();
    let got;
    try {
        got = await fetchIfDue(metaSnap.data(), now);
    } catch (error) {
        logger.warn("Weather download failed; keeping the last forecast.", error);
        got = { series: metaSnap.data()?.series ?? [], meta: metaSnap.data() ?? {}, fetched: false };
    }
    await metaRef.set({ ...got.meta, series: got.series }, { merge: true });
    const hour = pickNow(got.series, now);
    if (!hour) {
        logger.info("No current forecast hour; the site falls back to clear after 3 h.");
        return;
    }
    const previous = pubSnap.data();
    const { changed, ...record } = recordFor(hour, previous);
    await pubRef.set({
        ...record,
        changedAt: changed ? FieldValue.serverTimestamp() : previous?.changedAt ?? null,
        at: FieldValue.serverTimestamp(),
    });
    logger.info(`Kampala: ${record.kind} (${record.symbol}), ${record.windMs} m/s${got.fetched ? ", new forecast" : ""}.`);
});

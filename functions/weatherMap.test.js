// Tests for weatherMap.js (no Firebase needed): node --test functions/weatherMap.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { sceneFromSymbol, toSeries, pickNow, recordFor } from "./weatherMap.js";

test("symbols map to the six scenes", () => {
    assert.deepEqual(sceneFromSymbol("clearsky_day"), { kind: "clear", intensity: 0 });
    assert.deepEqual(sceneFromSymbol("fair_night"), { kind: "clear", intensity: 0 });
    assert.equal(sceneFromSymbol("partlycloudy_day").kind, "partly");
    assert.equal(sceneFromSymbol("cloudy").kind, "overcast");
    assert.equal(sceneFromSymbol("fog").kind, "mist");
    assert.deepEqual(sceneFromSymbol("lightrainshowers_day"), { kind: "rain", intensity: 0.5 });
    assert.deepEqual(sceneFromSymbol("rain"), { kind: "rain", intensity: 1 });
    assert.deepEqual(sceneFromSymbol("heavyrainshowers_night"), { kind: "rain", intensity: 1.5 });
    assert.equal(sceneFromSymbol("rainandthunder").kind, "storm");
    assert.equal(sceneFromSymbol("lightssleetshowersandthunder_day").kind, "storm");
    assert.equal(sceneFromSymbol("something-new").kind, "clear");
    assert.equal(sceneFromSymbol(undefined).kind, "clear");
});

const sample = { properties: { timeseries: [
    { time: "2026-10-24T15:00:00Z", data: { instant: { details: { wind_speed: 3.4, wind_from_direction: 110 } }, next_1_hours: { summary: { symbol_code: "rainshowers_day" } } } },
    { time: "2026-10-24T16:00:00Z", data: { instant: { details: { wind_speed: 6.1, wind_from_direction: 95 } }, next_1_hours: { summary: { symbol_code: "rainandthunder" } } } },
    { time: "2026-10-24T17:00:00Z", data: { instant: { details: { wind_speed: 2 } } } }, // no symbol: dropped
] } };

test("toSeries keeps the useful fields and drops hours without a symbol", () => {
    const s = toSeries(sample);
    assert.equal(s.length, 2);
    assert.deepEqual(s[1], { time: "2026-10-24T16:00:00Z", symbol: "rainandthunder", windMs: 6.1, windFromDeg: 95 });
});

test("pickNow takes the hour that has started, and refuses stale data", () => {
    const s = toSeries(sample);
    assert.equal(pickNow(s, new Date("2026-10-24T16:20:00Z")).symbol, "rainandthunder");
    assert.equal(pickNow(s, new Date("2026-10-24T15:59:00Z")).symbol, "rainshowers_day");
    assert.equal(pickNow(s, new Date("2026-10-24T14:30:00Z")).symbol, "rainshowers_day"); // first hour just ahead
    assert.equal(pickNow(s, new Date("2026-10-24T19:30:00Z")), null);
    assert.equal(pickNow([], new Date()), null);
});

test("recordFor remembers when the scene changes", () => {
    const hour = { time: "2026-10-24T16:00:00Z", symbol: "clearsky_day", windMs: 3.44, windFromDeg: 95.4 };
    const r = recordFor(hour, { kind: "rain" });
    assert.equal(r.kind, "clear");
    assert.equal(r.changed, true);
    assert.equal(r.prevKind, "rain");
    assert.equal(r.windMs, 3.4);
    const again = recordFor(hour, r);
    assert.equal(again.changed, false);
    assert.equal(again.prevKind, "rain");
});

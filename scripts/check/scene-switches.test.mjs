// Tests for Admin → Features' weather switches with the sky's fallback (run: npm test).
// A scene that's switched off shows the nearest calmer one that's on; with "Weather scenes" off, always clear.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeFeatures, sceneSwitches } from "../../src/data/features.js";
import { fallbackScene } from "../../src/components/scene/sky/weatherShapes.js";

const show = (saved, asked) => fallbackScene(asked, sceneSwitches(mergeFeatures(saved)));

test("every scene shows as itself when everything is on", () => {
    for (const k of ["clear", "partly", "overcast", "mist", "rain", "storm"]) assert.equal(show({}, k), k);
});
test("a switched-off scene falls back to the nearest calmer one", () => {
    assert.equal(show({ sceneStorm: false }, "storm"), "rain");
    assert.equal(show({ sceneStorm: false, sceneRain: false }, "storm"), "overcast");
    assert.equal(show({ sceneRain: false }, "rain"), "overcast");
    assert.equal(show({ sceneMist: false }, "mist"), "partly");
    assert.equal(show({ sceneOvercast: false, sceneMist: false, sceneRain: false, sceneStorm: false }, "rain"), "partly");
});
test("Weather scenes off means a clear sky, day and night", () => {
    for (const k of ["partly", "overcast", "mist", "rain", "storm", "clear"]) assert.equal(show({ weather: false }, k), "clear");
});

// three.js r155+ measures light in physical units; the hotel scenes were tuned with the older
// "legacy" lights. This keeps their look: intensity × π, and for point and spot lights an extra
// factor that matches the old linear fall-off at about a third of the light's range.
const LEGACY_SAMPLE = 0.35;

const factor = (light) => {
    if (!(light.isPointLight || light.isSpotLight) || !light.distance || !light.decay) return Math.PI;
    const r = LEGACY_SAMPLE * light.distance;
    const legacy = Math.pow(1 - LEGACY_SAMPLE, light.decay);
    const physical = Math.pow(1 - Math.pow(LEGACY_SAMPLE, 4), 2) / Math.pow(Math.max(r, 0.01), light.decay);
    return (Math.PI * legacy) / physical;
};

export const legacyLight = (light) => {
    let raw = light.intensity;
    Object.defineProperty(light, "intensity", {
        configurable: true,
        get: () => raw * factor(light),
        set: (value) => {
            raw = value;
        },
    });
    return light;
};

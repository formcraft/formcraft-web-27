// weather3d: Kampala's weather on the Home 3D model (living sky step 5, docs/brief-living-sky.md and work split C5).
// Three things, all cheap: the paper leaves flutter in the wind (a few lines added to their vertex shader), paper-sliver
// rain falls over the model (one line set, moved entirely on the graphics card), and the sun or moonlight dims under
// cloud. Used by hotelDay.js and hotelNight.js only when HotelScene passes env.weather, so without it nothing changes.
// The weather comes in as the site's scene record: { kind: clear|partly|overcast|mist|rain|storm, wind: -2…2, amount }.

const DIM = { clear: 1, partly: 0.92, overcast: 0.7, mist: 0.8, rain: 0.62, storm: 0.5 }; // key and fill light under cloud
const RAIN = { rain: 1, storm: 1.5 };

/**
 * Adds weather to a hotel scene. Call before compileAsync so the leaf shader change is compiled with everything else.
 * @param {typeof import("three")} THREE
 * @param {object} o
 * @param {import("three").Scene} o.scene
 * @param {import("three").Object3D[]} o.green  the greenery objects (the build's "green" group)
 * @param {import("three").Light[]} o.lights  the key and fill lights (their current intensity is the clear-sky value)
 * @param {{ kind?: string, wind?: number, amount?: number }} o.weather
 * @param {boolean} [o.night]  pale rain at night, dark rain by day
 * @param {boolean} [o.small]  phones: fewer drops
 * @param {boolean} [o.reduced]  reduced motion: no flutter, rain held still
 * @returns {{ update: (dt: number) => void, set: (w: object) => void, dispose: () => void }}
 */
export function addWeather3D(THREE, { scene, green, lights, weather, night = false, small = false, reduced = false }) {
    const u = { uTime: { value: 0 }, uWind: { value: 0 } };
    // ---------- leaves flutter: displace each vertex a little, phased by where its leaf sits ----------
    const mats = new Set();
    green.forEach((g) => g.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m)); }));
    mats.forEach((m) => {
        const before = m.onBeforeCompile;
        m.onBeforeCompile = (shader, r) => {
            if (before) before(shader, r);
            shader.uniforms.uTime = u.uTime; shader.uniforms.uWind = u.uWind;
            shader.vertexShader = "uniform float uTime;\nuniform float uWind;\n" + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 fcP = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
#else
  vec3 fcP = vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]);
#endif
  float fcS = sin(uTime * 1.7 + fcP.x * 0.35 + fcP.z * 0.27) * 0.65 + sin(uTime * 2.9 + fcP.x * 0.9 - fcP.z * 0.4) * 0.35;
  transformed.x += uWind * 0.07 * fcS * (0.4 + max(position.y, 0.0) * 1.6);
  transformed.z += uWind * 0.035 * fcS;`);
        };
        m.customProgramCacheKey = () => "fc-wind"; // one program for all of them
        m.needsUpdate = true;
    });

    // ---------- rain: paper slivers in a box around the model, falling in the vertex shader ----------
    const N = small ? 500 : 1100, BOX = 30, TOP = 24;
    const pos = new Float32Array(N * 2 * 3), seed = new Float32Array(N * 2 * 3);
    for (let i = 0; i < N; i++) {
        const x = (Math.random() * 2 - 1) * BOX, z = (Math.random() * 2 - 1) * BOX, ph = Math.random(), speed = 0.85 + Math.random() * 0.3;
        // both ends of a sliver share its phase and speed, so it stays one short sliver
        for (let e = 0; e < 2; e++) { const k = (i * 2 + e) * 3; pos[k] = x; pos[k + 1] = e; pos[k + 2] = z; seed[k] = ph; seed[k + 1] = speed; seed[k + 2] = e; }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("seed", new THREE.BufferAttribute(seed, 3));
    const rainMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: u.uTime, uWind: u.uWind, uColor: { value: new THREE.Color(night ? 0xf1f1f1 : 0x1c252d) }, uAlpha: { value: night ? 0.24 : 0.26 } },
        vertexShader: `uniform float uTime; uniform float uWind; attribute vec3 seed;
            void main() {
                float h = ${TOP.toFixed(1)}, len = 0.55, slant = uWind * 0.18;
                float y = mod(seed.x * h - uTime * 14.0 * seed.y, h) + seed.z * len; // seed.z: 0 = bottom end, 1 = top end
                vec3 p = vec3(position.x + slant * (h - y), y, position.z);       // drifts downwind as it falls, so it's slanted
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`,
        fragmentShader: "uniform vec3 uColor; uniform float uAlpha; void main() { gl_FragColor = vec4(uColor, uAlpha); }",
    });
    const rain = new THREE.LineSegments(geo, rainMat);
    rain.frustumCulled = false; rain.visible = false; rain.renderOrder = 10;
    scene.add(rain);

    const base = lights.map((l) => l.intensity);
    let state = { kind: "clear", wind: 0, amount: 1 };
    const apply = (w) => {
        state = { ...state, ...w };
        const amt = RAIN[state.kind] ? (state.kind === "storm" ? 1.5 : state.amount || 1) : 0;
        rain.visible = amt > 0;
        geo.setDrawRange(0, Math.round(N * Math.min(1, amt / 1.5)) * 2); // light rain draws fewer slivers
        const d = DIM[state.kind] ?? 1;
        lights.forEach((l, i) => { l.intensity = base[i] * d; });
        u.uWind.value = reduced ? 0 : Math.max(-2, Math.min(2, state.wind || 0));
    };
    apply(weather || {});

    return {
        /** Advance the flutter and the rain (call every drawn frame). */
        update(dt) { if (!reduced) u.uTime.value += dt; },
        /** Change the weather live (same shape as env.weather). */
        set: apply,
        dispose() { scene.remove(rain); geo.dispose(); rainMat.dispose(); },
    };
}

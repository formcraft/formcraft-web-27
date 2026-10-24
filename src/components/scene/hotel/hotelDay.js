// The Formcraft hotel model: a four-storey hotel built as a paper scale model on the Formcraft
// A1 drawing sheet, half "in design" (G3) and half "built" (G5), with a cutaway. The visitor can drag
// to turn it, and the camera moves between views as the home page scrolls ([data-cam] sections).
// Ported from the concept file "Formcraft Home — Brand Paper (day)" (three.js r128) to the three.js version in package.json.
// Loaded on demand by HotelScene.jsx, so three.js never sits in the main bundle.
/* oxlint-disable */
import * as THREE from "three";
import { legacyLight } from "./compat";
import { createBuild } from "./build";

// Builds the scene in steps, yielding to the browser between them so the page stays responsive while
// the model is made (env.signal aborts a build that's no longer wanted). Resolves to a handle:
// { dispose, setView(name), zoomBy(step), resetView() } — or null if aborted / WebGL is missing.
export async function createHotelScene(canvas, env) {
  env = env || {};
  // the concept was written for three.js before colour management; keep its colour maths
  THREE.ColorManagement.enabled = false;
  var alive = true, rafId = 0, cleanup = [];
  var addEventListener = function (type, fn, opts) { window.addEventListener(type, fn, opts); cleanup.push(function () { window.removeEventListener(type, fn, opts); }); };
  var requestAnimationFrame = function (fn) { if (alive) rafId = window.requestAnimationFrame(fn); return rafId; };
  var setTimeout = function (fn, ms) { var id = window.setTimeout(function () { if (alive) fn(); }, ms); cleanup.push(function () { window.clearTimeout(id); }); return id; };

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smallScreen = Math.min(innerWidth, innerHeight) < 700;
  var standard = env && env.quality === 'standard'; // mid-range devices: smaller shadows, fewer scraps
  var ultra = env && env.quality === 'ultra';       // strong graphics cards (dev preview for now): 2× pixels, 4096 px shadows, paper drawn in code
  var root = document.documentElement;
  var R;
  try { R = new THREE.WebGLRenderer({ canvas: canvas, antialias: ultra || (window.devicePixelRatio || 1) < 1.5, powerPreference: 'high-performance' }); }
  catch (e) { root.classList.add('nogl'); return null; }
  if (!R.getContext()) { root.classList.add('nogl'); return null; }
  var lastMark = performance.now(), marks = [];
  var pause = function () {
    var now = performance.now(); marks.push(Math.round(now - lastMark)); lastMark = now;
    if (env.debug) console.log('[hotel] step', marks.length, marks[marks.length - 1] + 'ms');
    return new Promise(function (r) { if (window.scheduler && window.scheduler.yield) window.scheduler.yield().then(r); else window.setTimeout(r, 0); });
  };
  var stopped = function () {
    if (!(env.signal && env.signal.aborted)) return false;
    alive = false; cleanup.forEach(function (fn) { fn(); }); R.dispose(); return true;
  };

  var small = Math.min(innerWidth, innerHeight) < 700;
  // always the screen's own sharpness (up to 2×): a device that can't keep up gets the 2D drawing instead of a blurry 3D
  var maxRatio = ultra ? Math.max(2, window.devicePixelRatio || 1) : Math.min(window.devicePixelRatio || 1, standard ? 1.5 : 2), ratio = maxRatio;
  R.setPixelRatio(ratio);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 0.92;
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFShadowMap;
  R.shadowMap.autoUpdate = false; // refreshed every third frame in frame()
  var ANISO = R.capabilities.getMaxAnisotropy();
  var lin = function (h) { return new THREE.Color(h).convertSRGBToLinear(); };

  var BG_DAY = lin('#e4e3df'), BG_EVE = lin('#4a5560');
  var scene = new THREE.Scene();
  scene.background = BG_DAY.clone();
  scene.fog = new THREE.Fog(BG_DAY.clone(), 120, 320);
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1200);

  // ---------- helpers ----------
  function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { var s = 0, a = 0.5, f = 1; for (var i = 0; i < 5; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
  function sstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  var rnd = (function () { var s = 12345; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

  // ---------- textures ----------
  function canvasTex(w, h, draw, rx, ry, color) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    if (color !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = ANISO; return t;
  }
  function fibres(g, w, h, n, light, dark) {
    for (var i = 0; i < n; i++) {
      var x = rnd() * w, y = rnd() * h, a = rnd() * 6.28, L = 8 + rnd() * 30;
      g.strokeStyle = rnd() < 0.6 ? light : dark; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(x, y);
      for (var k = 0; k < 6; k++) { a += (rnd() - 0.5) * 0.7; x += Math.cos(a) * L / 6; y += Math.sin(a) * L / 6; g.lineTo(x, y); }
      g.stroke();
    }
  }
  // toned, handmade-looking paper: cloudy pulp, visible grain, long fibres; 1 tile = 4 m on the model
  function pulp(g, w, h, amp, grain) {
    var img = g.getImageData(0, 0, w, h), d = img.data, cs = 4, cw = Math.ceil(w / cs), ch = Math.ceil(h / cs), C = new Float32Array(cw * ch);
    for (var cy = 0; cy < ch; cy++) for (var cx = 0; cx < cw; cx++) {
      var px = cx * cs, py = cy * cs;
      C[cy * cw + cx] = (fbm(px * 0.006 + 3.1, py * 0.006 + 1.7) - 0.5) * amp + (fbm(px * 0.03, py * 0.03) - 0.5) * amp * 0.45;
    }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var cloud = C[((y / cs) | 0) * cw + ((x / cs) | 0)];
      var n = (hash(x * 1.13, y * 0.77) - 0.5) * grain + cloud;
      var i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.05;
    }
    g.putImageData(img, 0, 0);
  }
  // Paper and bump textures: baked images when HotelScene passes them (env.textures, saves the
  // phone from drawing a megapixel of noise on start-up); otherwise drawn here as in the concept.
  function imageTex(img, color) {
    var t = new THREE.Texture(img); t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (color !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = ANISO; return t;
  }
  var baked = env.textures || {};
  var paperTex = baked.paper ? imageTex(baked.paper) : canvasTex(1024, 1024, function (g, w, h) {
    g.fillStyle = '#f4f3f0'; g.fillRect(0, 0, w, h);
    pulp(g, w, h, 46, 22);
    fibres(g, w, h, 1400, 'rgba(255,255,255,.75)', 'rgba(70,62,55,.28)');
    for (var i = 0; i < 2500; i++) { g.fillStyle = 'rgba(80,70,60,' + (0.1 + rnd() * 0.2) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 1.1, 0, 6.3); g.fill(); }
  }, 1, 1);
  var bumpTex = baked.bump ? imageTex(baked.bump, false) : canvasTex(1024, 1024, function (g, w, h) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    pulp(g, w, h, 90, 120);
    fibres(g, w, h, 1100, 'rgba(255,255,255,.7)', 'rgba(0,0,0,.6)');
  }, 1, 1, false);
  function tiled(t, rx, ry) { var c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; }

  // the model base is the Formcraft A1 sheet (FMC_TB_A1): its frame and title block printed exactly,
  // with the site plan drawn inside the drawing area. Sheet px -> model metres.
  var SHEET_W = 4096, SHEET_H = 2894, BW = 44, BD = BW * SHEET_H / SHEET_W, MPX = BW / SHEET_W;
  var FRAME = { x0: 274, x1: 3479, y0: 186, y1: 2706 };            // inner drawing frame in sheet px
  var BOX = BW / 2 - (FRAME.x0 + FRAME.x1) / 2 * MPX;               // board centre offset so the frame is centred on the hotel
  var BOZ = BD / 2 - (FRAME.y0 + FRAME.y1) / 2 * MPX;
  var sheetCanvas = document.createElement('canvas'); sheetCanvas.width = SHEET_W; sheetCanvas.height = SHEET_H;
  var drawTex = new THREE.CanvasTexture(sheetCanvas); drawTex.colorSpace = THREE.SRGBColorSpace; drawTex.anisotropy = ANISO;
  function paintSheet(img) {
    var g = sheetCanvas.getContext('2d'), w = SHEET_W, h = SHEET_H;
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    if (img) g.drawImage(img, 0, 0, w, h);
    var cx = (FRAME.x0 + FRAME.x1) / 2, cz = (FRAME.y0 + FRAME.y1) / 2;
    function X(x) { return cx + x / MPX; } function Z(z) { return cz + z / MPX; }
    g.save(); g.beginPath(); g.rect(FRAME.x0 + 2, FRAME.y0 + 2, FRAME.x1 - FRAME.x0 - 4, FRAME.y1 - FRAME.y0 - 4); g.clip();
    var ink = 'rgba(28,37,45,', or = 'rgba(232,132,52,'; g.lineCap = 'round';
    // grass: landscape hatch (stipple + tufts) instead of solid green
    function grass(x0, x1, z0, z1) {
      g.fillStyle = 'rgba(122,166,82,.10)'; g.fillRect(X(x0), Z(z0), (x1 - x0) / MPX, (z1 - z0) / MPX);
      var area = (x1 - x0) * (z1 - z0);
      for (var i = 0; i < area * 45; i++) { g.fillStyle = 'rgba(79,125,58,' + (0.25 + rnd() * 0.35) + ')'; g.beginPath(); g.arc(X(x0 + rnd() * (x1 - x0)), Z(z0 + rnd() * (z1 - z0)), 1.4 + rnd() * 1.6, 0, 6.3); g.fill(); }
      g.strokeStyle = 'rgba(79,125,58,.75)'; g.lineWidth = 2.2;
      for (i = 0; i < area * 2.2; i++) {
        var px = X(x0 + 0.3 + rnd() * (x1 - x0 - 0.6)), pz = Z(z0 + 0.3 + rnd() * (z1 - z0 - 0.6));
        g.beginPath(); g.moveTo(px - 9, pz - 12); g.lineTo(px, pz); g.lineTo(px + 2, pz - 15); g.moveTo(px, pz); g.lineTo(px + 10, pz - 11); g.stroke();
      }
      g.strokeStyle = 'rgba(79,125,58,.55)'; g.lineWidth = 2; g.setLineDash([14, 8]); g.strokeRect(X(x0), Z(z0), (x1 - x0) / MPX, (z1 - z0) / MPX); g.setLineDash([]);
    }
    GRASS.forEach(function (r) { grass(r[0], r[1], r[2], r[3]); });
    // structural grid with bubbles
    g.strokeStyle = ink + '.32)'; g.lineWidth = 2; g.setLineDash([24, 10, 4, 10]);
    var gx = [-10.8, -7.2, -3.6, 0, 3.6, 7.2, 10.8], gz = [-6.5, -1, 6.5];
    gx.forEach(function (x) { g.beginPath(); g.moveTo(X(x), Z(-11.6)); g.lineTo(X(x), Z(11.0)); g.stroke(); });
    gz.forEach(function (z) { g.beginPath(); g.moveTo(X(-15.2), Z(z)); g.lineTo(X(15.6), Z(z)); g.stroke(); });
    g.setLineDash([]);
    g.font = '600 38px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3;
    'ABCDEFG'.split('').forEach(function (L, i) { g.strokeStyle = or + '.95)'; g.beginPath(); g.arc(X(gx[i]), Z(-12.5), 30, 0, 6.3); g.stroke(); g.fillStyle = ink + '.9)'; g.fillText(L, X(gx[i]), Z(-12.5) + 2); });
    ['1', '2', '3'].forEach(function (L, i) { g.strokeStyle = or + '.95)'; g.beginPath(); g.arc(X(-16.3), Z(gz[i]), 30, 0, 6.3); g.stroke(); g.fillStyle = ink + '.9)'; g.fillText(L, X(-16.3), Z(gz[i]) + 2); });
    // plot boundary + building setback
    g.strokeStyle = ink + '.85)'; g.lineWidth = 4; g.setLineDash([40, 10, 8, 10]); g.strokeRect(X(-16.9), Z(-13.2), 33.8 / MPX, 26.4 / MPX); g.setLineDash([]);
    g.strokeStyle = or + '.7)'; g.lineWidth = 2; g.setLineDash([12, 10]); g.strokeRect(X(-12.6), Z(-8.4), 25.2 / MPX, 17.4 / MPX); g.setLineDash([]);
    // front dimension
    g.strokeStyle = ink + '.85)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(X(-10.8), Z(13.0)); g.lineTo(X(10.8), Z(13.0)); g.stroke();
    [-10.8, 10.8].forEach(function (x) { g.beginPath(); g.moveTo(X(x) - 11, Z(13.0) + 11); g.lineTo(X(x) + 11, Z(13.0) - 11); g.stroke(); });
    g.fillStyle = ink + '.9)'; g.font = '500 32px Arial, Helvetica, sans-serif'; g.fillText('21 600', X(0), Z(13.0) - 22);
    // forecourt + parking bays
    g.strokeStyle = ink + '.5)'; g.lineWidth = 2;
    for (var p = 0; p < 6; p++) { g.beginPath(); g.moveTo(X(-15.6 + p * 2.5), Z(9.2)); g.lineTo(X(-15.6 + p * 2.5), Z(12.0)); g.stroke(); }
    g.beginPath(); g.moveTo(X(-15.6), Z(12.0)); g.lineTo(X(-3.1), Z(12.0)); g.stroke();
    g.restore();
    drawTex.needsUpdate = true;
  }
  await pause(); if (stopped()) return null;
  // ---------- materials ----------
  function paper(hex, o) {
    o = o || {};
    return new THREE.MeshStandardMaterial({ color: lin(hex), map: o.map || paperTex, bumpMap: bumpTex, bumpScale: o.bump || 0.045, roughness: 0.94, metalness: 0, side: o.side || THREE.FrontSide });
  }
  var W = paper('#efeeea'), W2 = paper('#e2e1dc'), Wd = paper('#efeeea', { side: THREE.DoubleSide });
  var RUST = paper('#d15334'), NAVY = paper('#1c252d'), RUSTd = paper('#ffae61', { side: THREE.DoubleSide }), ORANGE = paper('#ffae61'), NAVYd = paper('#1c252d', { side: THREE.DoubleSide });
  var glassMat = new THREE.MeshStandardMaterial({ color: lin('#d9dee0'), roughness: 0.22, metalness: 0.1, emissive: lin('#ffad5e'), emissiveIntensity: 0 });
  var glassMat2 = glassMat.clone();
  var wireMat = new THREE.LineBasicMaterial({ color: lin('#d15334') });
  var wireFace = new THREE.MeshBasicMaterial({ color: lin('#ffae61'), transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });

  function uvScale(g, w, h, d, tile) {
    var uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (var f = 0; f < 6; f++) for (var k = 0; k < 4; k++) { var i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
    uv.needsUpdate = true;
  }
  var model = new THREE.Group(); scene.add(model);
  function box(w, h, d, x, y, z, mat, o) {
    o = o || {};
    var g = new THREE.BoxGeometry(w, h, d); uvScale(g, w, h, d, o.tile || 4);
    var m = new THREE.Mesh(g, mat); m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry;
    m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || model).add(m); return m;
  }
  function wire(w, h, d, x, y, z) {
    var g = new THREE.BoxGeometry(w, h, d);
    var e = new THREE.LineSegments(new THREE.EdgesGeometry(g), wireMat); e.position.set(x, y, z); model.add(e);
    var f = new THREE.Mesh(g, wireFace); f.position.set(x, y, z); model.add(f);
  }

  // ---------- model base: board + printed site plan ----------
  var GRASS = [[11.9, 16.6, -12.8, 8.6], [-16.6, -11.9, -6.4, 8.2], [-9.9, -7.4, -12.9, -7.9], [9.9, 11.7, -12.9, -7.9]];
  var base = box(BW, 0.8, BD, BOX, -0.4, BOZ, W2, { tile: 20 });
  var top = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: drawTex, bumpMap: bumpTex, bumpScale: 0.006, roughness: 0.95 }));
  top.rotation.x = -Math.PI / 2; top.position.set(BOX, 0.005, BOZ); top.receiveShadow = true; model.add(top);
  paintSheet(null);
  if (env.sheetUrl) { var sheetImg = new Image(); sheetImg.onload = function () { if (alive) { paintSheet(sheetImg); drawTex.needsUpdate = true; } }; sheetImg.src = env.sheetUrl; }
  // laser-cut contour layers (topography) at the back-left corner
  function blob(cx, cz, r, seed) {
    var s = new THREE.Shape(), n = 40;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2, rr = r * (0.75 + fbm(Math.cos(a) * 1.5 + seed, Math.sin(a) * 1.5 + seed) * 0.5);
      var x = cx + Math.cos(a) * rr, y = cz + Math.sin(a) * rr * 0.7;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    return s;
  }
  for (var c = 0; c < 4; c++) {
    var sh = blob(13.6, -11.2, 2.5 - c * 0.55, 3 + c * 0.7);
    var eg = new THREE.ExtrudeGeometry(sh, { depth: 0.36, bevelEnabled: false });
    eg.rotateX(Math.PI / 2);
    var cm = new THREE.Mesh(eg, c % 2 ? W : W2); cm.position.y = 0.36 * (c + 1); cm.castShadow = cm.receiveShadow = true; model.add(cm);
  }

  await pause(); if (stopped()) return null;
  var bi0 = model.children.length; // build groups: see build.js
  // ---------- the hotel ----------
  var BAY = 3.6, NB = 6, X0 = -10.8, ZF = 6.5, ZB = -6.5;
  var LV = [0, 4.5, 7.9, 11.3, 14.7];
  var isCut = function (b, f) { return b >= 4 && (f === 1 || f === 2); };
  var isDesign = function (b, f) { return b <= 1 && f === 3; };

  // slabs (paper bands)
  LV.forEach(function (y, i) { box(22.4, 0.36, 13.8, 0, y + 0.18, 0, W, { tile: 10 }); });
  // ground floor: columns, glazing, entrance canopy
  for (var b = 0; b <= NB; b++) box(0.45, 4.5, 0.45, X0 + b * BAY, 2.25, ZF - 0.1, W);
  var gfGlass = box(21.4, 4.1, 0.08, 0, 2.2, ZF - 0.55, glassMat, { cast: false });
  box(0.12, 4.1, 0.2, -3.6, 2.2, ZF - 0.5, W); box(0.12, 4.1, 0.2, 3.6, 2.2, ZF - 0.5, W);
  box(2.6, 2.6, 0.08, 0, 1.3, ZF - 0.5, NAVY, { cast: false });
  box(8.4, 0.22, 3.4, 0, 4.15, ZF + 1.6, W);
  box(0.18, 4.0, 0.18, -3.8, 2.0, ZF + 3.1, W); box(0.18, 4.0, 0.18, 3.8, 2.0, ZF + 3.1, W);
  // side + back walls with punched window recesses
  [-1, 1].forEach(function (s) {
    box(0.4, 14.7, 13.4, s * 10.95, 7.35, 0, W, { tile: 10 });
    for (var f = 1; f <= 3; f++) for (var k = 0; k < 3; k++)
      box(0.08, 1.9, 1.5, s * 11.17, LV[f] + 1.6, -4 + k * 4, glassMat2, { cast: false });
  });
  box(21.5, 14.7, 0.4, 0, 7.35, ZB, W, { tile: 10 });
  for (var f2 = 1; f2 <= 3; f2++) for (var k2 = 0; k2 < NB; k2++) box(1.8, 1.9, 0.08, X0 + BAY / 2 + k2 * BAY, LV[f2] + 1.6, ZB - 0.22, glassMat2, { cast: false });

  // upper floors, front façade by bay
  for (var f = 1; f <= 3; f++) {
    var y0 = LV[f] + 0.36, y1 = LV[f + 1], hgt = y1 - y0, ym = (y0 + y1) / 2;
    for (var bb = 0; bb < NB; bb++) {
      var xc = X0 + BAY / 2 + bb * BAY;
      if (isCut(bb, f)) continue;
      if (isDesign(bb, f)) {
        wire(BAY - 0.3, hgt - 0.1, 0.08, xc, ym, ZF - 0.55);
        wire(BAY - 0.4, 0.15, 1.3, xc, y0 + 0.05, ZF + 0.6);
        wire(BAY - 0.4, 1.0, 0.05, xc, y0 + 0.6, ZF + 1.22);
        continue;
      }
      box(BAY - 0.3, hgt - 0.1, 0.08, xc, ym, ZF - 0.55, (bb + f) % 3 ? glassMat : glassMat2, { cast: false });
      box(BAY - 0.4, 0.15, 1.3, xc, y0 + 0.05, ZF + 0.6, W);
      box(BAY - 0.4, 1.0, 0.06, xc, y0 + 0.6, ZF + 1.22, W);
      if ((bb * 7 + f * 3) % 5 === 0) box(1.0, 0.35, 0.35, xc + 0.9, y0 + 0.32, ZF + 0.95, ORANGE);
    }
    for (var fn = 0; fn <= NB; fn++) {
      if (f === 3 && fn <= 1) { wire(0.28, hgt, 1.6, X0 + fn * BAY, ym, ZF + 0.3); continue; }
      if ((f === 1 || f === 2) && fn >= 5) continue;
      box(0.28, hgt, 1.6, X0 + fn * BAY, ym, ZF + 0.3, W);
    }
  }
  // structure that already exists in the design bays: white columns
  box(0.4, LV[4] - LV[3], 0.4, X0 + 0.2, (LV[3] + LV[4]) / 2, ZF - 0.3, W);
  box(0.4, LV[4] - LV[3], 0.4, X0 + 2 * BAY, (LV[3] + LV[4]) / 2, ZF - 0.3, W);

  // rooftop
  var RY = LV[4] + 0.36;
  box(22.4, 0.9, 0.18, 0, RY + 0.45, ZF + 0.3, W); box(22.4, 0.9, 0.18, 0, RY + 0.45, ZB - 0.1, W);
  box(8.4, 3.2, 6.2, -3, RY + 1.6, -1.8, W, { tile: 8 });
  box(8.0, 2.6, 0.08, -3, RY + 1.5, 1.33, glassMat, { cast: false });
  for (var pg = 0; pg < 9; pg++) box(0.16, 0.16, 5, 3.4 + pg * 0.85, RY + 3.0, 2.0, W);
  box(8.0, 0.16, 0.16, 6.8, RY + 3.0, 4.4, W); box(0.16, 3.0, 0.16, 3.2, RY + 1.5, 4.4, W); box(0.16, 3.0, 0.16, 10.2, RY + 1.5, 4.4, W);
  [[7.5, -4.2], [9.4, -4.2]].forEach(function (p) {
    var tk = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.8, 32), W); tk.position.set(p[0], RY + 0.9, p[1]); tk.castShadow = tk.receiveShadow = true; model.add(tk);
  });

  await pause(); if (stopped()) return null;
  // ---------- cutaway: torn façade revealing guest rooms ----------
  var CX0 = X0 + 4 * BAY, CX1 = X0 + 6 * BAY, CY0 = LV[1] + 0.36, CY1 = LV[3];
  // room interiors (two floors × two bays)
  for (var cf = 1; cf <= 2; cf++) {
    var fy = LV[cf] + 0.36, fh = LV[cf + 1] - fy;
    box(CX1 - CX0, fh, 0.15, (CX0 + CX1) / 2, fy + fh / 2, -1.0, W2);
    box(0.15, fh, 7.4, CX0 + BAY, fy + fh / 2, 2.6, W);
    for (var cb = 0; cb < 2; cb++) {
      var rx = CX0 + BAY / 2 + cb * BAY;
      box(1.7, 1.1, 0.12, rx, fy + 0.85, -0.85, NAVY);
      box(1.6, 0.45, 2.0, rx, fy + 0.225, 0.2, W);
      box(1.64, 0.12, 1.1, rx, fy + 0.5, 0.75, (cb + cf) % 2 ? ORANGE : RUST);
      box(0.45, 0.45, 0.4, rx - 1.25, fy + 0.22, -0.55, W);
      box(1.1, 0.06, 0.5, rx + 1.0, fy + 0.75, 3.6, W);
      box(0.06, 0.75, 0.5, rx + 1.5, fy + 0.375, 3.6, W);
      box(0.85, 2.1, 0.06, rx + 1.1, fy + 1.05, -0.93, RUST, { cast: false });
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: lin('#fff3e0'), emissive: lin('#ffb36b'), emissiveIntensity: 0.6 }));
      lamp.position.set(rx - 1.25, fy + 0.75, -0.55); model.add(lamp);
    }
  }
  var cutLights = [];
  [[CX0 + BAY, LV[1] + 2.6, 1.5], [CX0 + BAY, LV[2] + 2.6, 1.5]].forEach(function (p) {
    var l = new THREE.PointLight(lin('#ffbf80'), 0.25, 9, 2); l.position.set(p[0], p[1], p[2]); model.add(l); cutLights.push(l);
  });
  // the torn sheet: façade layer with a ragged hole, a rust layer behind it with a larger hole
  function tornHole(x0, x1, y0, y1, inset, seed, rough) {
    var p = new THREE.Path(), pts = [], i, t, n = 60;
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2 - inset, hh = (y1 - y0) / 2 - inset;
    for (i = 0; i < n * 4; i++) {
      var side = Math.floor(i / n); t = (i % n) / n;
      var x, y;
      if (side === 0) { x = -hw + 2 * hw * t; y = -hh; }
      else if (side === 1) { x = hw; y = -hh + 2 * hh * t; }
      else if (side === 2) { x = hw - 2 * hw * t; y = hh; }
      else { x = -hw; y = hh - 2 * hh * t; }
      var k = 1 - 0.18 * Math.pow(Math.abs(Math.sin(i / (n * 4) * Math.PI * 4)), 2);
      var j = (fbm(i * 0.11 + seed, seed) - 0.5) * rough + (hash(i, seed) - 0.5) * rough * 0.25;
      pts.push(new THREE.Vector2(cx + x * k + (side % 2 ? j : 0), cy + y * k + (side % 2 ? 0 : j)));
    }
    p.setFromPoints(pts); return p;
  }
  function tornSheet(mat, inset, seed, rough, z, depth) {
    var s = new THREE.Shape();
    s.moveTo(CX0, CY0); s.lineTo(CX1, CY0); s.lineTo(CX1, CY1); s.lineTo(CX0, CY1); s.lineTo(CX0, CY0);
    s.holes.push(tornHole(CX0, CX1, CY0, CY1, inset, seed, rough));
    var g = new THREE.ExtrudeGeometry(s, { depth: depth || 0.06, bevelEnabled: false, curveSegments: 1 });
    var m = new THREE.Mesh(g, mat); m.position.z = z; m.castShadow = true; m.receiveShadow = true; model.add(m); return m;
  }
  // three sheets torn back one behind the other, spaced apart so each casts its own shadow
  tornSheet(RUSTd, 1.7, 9.3, 1.0, ZF - 0.86, 0.05);
  tornSheet(NAVYd, 1.3, 5.1, 1.2, ZF - 0.72, 0.05);
  tornSheet(Wd, 0.95, 2.7, 1.45, ZF - 0.56, 0.08);
  // fins framing the cut
  box(0.28, CY1 - LV[1], 1.6, CX1, (LV[1] + CY1) / 2, ZF + 0.3, W);

  await pause(); if (stopped()) return null;
  var bi1 = model.children.length;
  // ---------- paper trees and scale figures ----------
  // ---------- landscape: cut-paper greens ----------
  var GREENS = ['#3f6b35', '#4f7d3a', '#5f8f43', '#74a24f', '#8db75e'].map(lin);
  var leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: paperTex, bumpMap: bumpTex, bumpScale: 0.02, roughness: 0.9, side: THREE.DoubleSide });
  var barkMat = paper('#8a6b4c'), barkMat2 = paper('#a0805d');
  var bloomMat = new THREE.MeshStandardMaterial({ color: lin('#ffae61'), map: paperTex, roughness: 0.9, side: THREE.DoubleSide });
  // a single paper leaf card, pointed, with its base at the origin
  var leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.17, 0.12, 0.2, 0.36, 0, 0.56); leafShape.bezierCurveTo(-0.2, 0.36, -0.17, 0.12, 0, 0);
  var leafGeo = new THREE.ShapeGeometry(leafShape, 6); leafGeo.translate(0, -0.08, 0);
  var LEAVES = [], BLOOMS = [];
  var dm = new THREE.Object3D(), up = new THREE.Vector3(), dir = new THREE.Vector3();
  function leafCloud(cx, cy, cz, rx, ry, rz, n, shadeBias, list, sizeMul) {
    for (var i = 0; i < n; i++) {
      var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
      dir.set(rr * Math.cos(th), u, rr * Math.sin(th));
      if (dir.y < -0.55) dir.y = -0.55 + rnd() * 0.2;          // fewer leaves on the underside
      var shell = 0.72 + rnd() * 0.3;
      dm.position.set(cx + dir.x * rx * shell, cy + dir.y * ry * shell, cz + dir.z * rz * shell);
      up.copy(dm.position).add(dir); dm.lookAt(up);
      dm.rotateZ(rnd() * Math.PI * 2); dm.rotateX((rnd() - 0.5) * 1.1);
      var sc = (0.75 + rnd() * 0.6) * (sizeMul || 1); dm.scale.set(sc, sc, sc);
      dm.updateMatrix();
      // lighter greens on top and on the sunny side, darker inside and underneath
      var lightness = 0.5 + dir.y * 0.32 + (-dir.x + dir.z) * 0.12 + (shell - 0.85) + shadeBias + (rnd() - 0.5) * 0.45;
      var ci = Math.max(0, Math.min(4, Math.round(lightness * 4)));
      (list || LEAVES).push({ m: dm.matrix.clone(), c: GREENS[ci] });
    }
  }
  function limb(x0, y0, z0, x1, y1, z1, r0, r1, mat) {
    var a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), len = a.distanceTo(b);
    var g = new THREE.CylinderGeometry(r1, r0, len, 8); g.translate(0, len / 2, 0);
    var m = new THREE.Mesh(g, mat || barkMat); m.position.copy(a);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = m.receiveShadow = true; model.add(m); return b;
  }
  // broadleaf (mango / fig): forked trunk, a canopy of overlapping leaf clusters
  function broadleaf(x, z, s) {
    var top = limb(x, 0, z, x + 0.15 * s, 2.3 * s, z, 0.24 * s, 0.17 * s);
    var forks = 4 + ((rnd() * 2) | 0);
    for (var f = 0; f < forks; f++) {
      var a = f / forks * Math.PI * 2 + rnd() * 0.6, rad = (1.1 + rnd() * 0.5) * s, h = (3.4 + rnd() * 0.9) * s;
      var end = limb(top.x, top.y, top.z, x + Math.cos(a) * rad, h, z + Math.sin(a) * rad, 0.14 * s, 0.06 * s);
      leafCloud(end.x, end.y + 0.35 * s, end.z, 1.35 * s, 1.0 * s, 1.35 * s, 95, 0, null, s);
    }
    leafCloud(x + 0.1 * s, 4.6 * s, z, 1.6 * s, 1.1 * s, 1.6 * s, 120, 0.12, null, s);
  }
  // acacia: the East African umbrella tree, a flat crown of torn paper layers on a leaning, forked trunk
  function tornDisc(r, seed) {
    var sh = new THREE.Shape(), n = 64;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2, k = r * (0.82 + fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + seed) * 0.34) + (hash(i, seed) - 0.5) * 0.18;
      var px = Math.cos(a) * k, py = Math.sin(a) * k * 0.86;
      if (i === 0) sh.moveTo(px, py); else sh.lineTo(px, py);
    }
    var g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g;
  }
  function acacia(x, z, s) {
    var lean = (rnd() - 0.5) * 0.8;
    var mid = limb(x, 0, z, x + lean * s, 2.6 * s, z + 0.2 * s, 0.22 * s, 0.14 * s, barkMat2);
    var tops = [];
    for (var f = 0; f < 3; f++) {
      var a = f * 2.1 + rnd(), rad = (1.4 + rnd() * 0.8) * s;
      tops.push(limb(mid.x, mid.y, mid.z, mid.x + Math.cos(a) * rad, (4.6 + rnd() * 0.4) * s, mid.z + Math.sin(a) * rad, 0.12 * s, 0.05 * s, barkMat2));
    }
    var cy = 4.9 * s;
    [[3.6, 0, 2], [3.1, 0.22, 3], [2.4, 0.42, 4], [1.6, 0.6, 4]].forEach(function (L, i) {
      var m = new THREE.Mesh(tornDisc(L[0] * s, x + i * 3.7), new THREE.MeshStandardMaterial({ color: GREENS[L[2]], map: paperTex, bumpMap: bumpTex, bumpScale: 0.02, roughness: 0.92 }));
      m.position.set(mid.x + 0.2, cy + L[1] * s, mid.z); m.rotation.y = rnd() * 6; m.castShadow = m.receiveShadow = true; model.add(m);
    });
    // leaf fringe under the crown so the edge reads as foliage, not a plate
    for (var i = 0; i < 110; i++) {
      var a2 = rnd() * Math.PI * 2, r2 = (2.2 + rnd() * 1.3) * s;
      leafCloud(mid.x + 0.2 + Math.cos(a2) * r2, cy - 0.1 * s, mid.z + Math.sin(a2) * r2 * 0.86, 0.35 * s, 0.2 * s, 0.35 * s, 1, -0.25, null, s * 0.9);
    }
  }
  // palm: ringed trunk, serrated fronds drooping from the crown
  var frondShape = (function () {
    var sh = new THREE.Shape(), L = 3.2, n = 14; sh.moveTo(0, 0);
    for (var i = 1; i <= n; i++) { var t = i / n, w = Math.sin(t * Math.PI) * 0.42 * (1 - t * 0.35); sh.lineTo(w * (i % 2 ? 1 : 0.55), t * L); }
    for (i = n - 1; i >= 0; i--) { t = i / n; w = Math.sin(t * Math.PI) * 0.42 * (1 - t * 0.35); sh.lineTo(-w * (i % 2 ? 1 : 0.55), t * L); }
    return sh;
  })();
  var frondGeo = new THREE.ShapeGeometry(frondShape);
  function palm(x, z, s) {
    var h = 6.2 * s, bend = (rnd() - 0.5) * 0.9, seg = 9, prev = new THREE.Vector3(x, 0, z);
    for (var i = 1; i <= seg; i++) {
      var t = i / seg; var p = new THREE.Vector3(x + bend * t * t, h * t, z + bend * 0.4 * t * t);
      limb(prev.x, prev.y, prev.z, p.x, p.y, p.z, 0.2 * s * (1 - t * 0.3), 0.17 * s * (1 - t * 0.3), i % 2 ? barkMat : barkMat2);
      prev = p;
    }
    var nf = 11;
    for (var f = 0; f < nf; f++) {
      var m = new THREE.Mesh(frondGeo, new THREE.MeshStandardMaterial({ color: GREENS[1 + (f % 4)], map: paperTex, bumpMap: bumpTex, bumpScale: 0.02, roughness: 0.9, side: THREE.DoubleSide }));
      m.position.copy(prev); m.rotation.order = 'YXZ';
      m.rotation.y = f / nf * Math.PI * 2 + rnd() * 0.3; m.rotation.x = -(0.9 + rnd() * 0.8); m.rotation.z = (rnd() - 0.5) * 0.3;
      m.scale.setScalar(s * (0.85 + rnd() * 0.3)); m.castShadow = m.receiveShadow = true; model.add(m);
    }
  }
  function shrub(x, z, r, blooms) {
    leafCloud(x, r * 0.7, z, r, r * 0.75, r, Math.round(60 * r * r + 20), -0.05, null, 0.8);
    if (blooms) for (var i = 0; i < blooms; i++) {
      var u = rnd() * 2 - 1, th = rnd() * 6.28, rr = Math.sqrt(1 - u * u);
      dm.position.set(x + rr * Math.cos(th) * r, r * 0.7 + Math.abs(u) * r * 0.75, z + rr * Math.sin(th) * r);
      dm.lookAt(dm.position.x, dm.position.y + 1, dm.position.z); dm.rotateZ(rnd() * 6); dm.scale.setScalar(0.55); dm.updateMatrix();
      BLOOMS.push(dm.matrix.clone());
    }
  }
  function hedge(x0, x1, z, h) {
    var n = Math.round((x1 - x0) * 46);
    for (var i = 0; i < n; i++) {
      dm.position.set(x0 + rnd() * (x1 - x0), rnd() * h, z + (rnd() - 0.5) * 0.9);
      dm.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); var sc = 0.6 + rnd() * 0.4; dm.scale.set(sc, sc, sc); dm.updateMatrix();
      LEAVES.push({ m: dm.matrix.clone(), c: GREENS[Math.min(4, Math.max(0, Math.round((dm.position.y / h) * 3 + rnd())))] });
    }
  }
  // layered torn-paper lawns (dark sheet under a lighter one)
  function lawn(x0, x1, z0, z1, seed) {
    [[0, '#4f7d3a', 0.0], [0.35, '#7aa652', 0.07]].forEach(function (L, li) {
      var sh = new THREE.Shape(), pts = [], n = 90, k;
      var ins = L[0];
      for (k = 0; k < n; k++) { var t = k / n; pts.push([x0 + ins + (x1 - x0 - 2 * ins) * t, z0 + ins]); }
      for (k = 0; k < n; k++) { t = k / n; pts.push([x1 - ins, z0 + ins + (z1 - z0 - 2 * ins) * t]); }
      for (k = 0; k < n; k++) { t = k / n; pts.push([x1 - ins - (x1 - x0 - 2 * ins) * t, z1 - ins]); }
      for (k = 0; k < n; k++) { t = k / n; pts.push([x0 + ins, z1 - ins - (z1 - z0 - 2 * ins) * t]); }
      pts.forEach(function (p, i) {
        var j = (fbm(i * 0.09 + seed + li * 7, seed) - 0.5) * 0.9 + (hash(i, seed + li) - 0.5) * 0.12;
        var px = p[0] + (i % (2 * n) < n ? 0 : 0) , pz = p[1];
        var side = Math.floor(i / n);
        if (side % 2 === 0) pz += j; else px += j;
        if (i === 0) sh.moveTo(px, -pz); else sh.lineTo(px, -pz);
      });
      var g = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      var m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: lin(L[1]), map: tiled(paperTex, 0.25, 0.25), bumpMap: bumpTex, bumpScale: 0.03, roughness: 0.95 }));
      m.position.y = 0.012 + L[2]; m.receiveShadow = true; m.castShadow = li === 1; model.add(m);
    });
  }
  // grass is shown by the printed hatch plus sparse paper tufts, not solid green sheets
  var tuftShape = new THREE.Shape(); tuftShape.moveTo(-0.05, 0); tuftShape.lineTo(0.0, 0.5); tuftShape.lineTo(0.05, 0); tuftShape.lineTo(-0.05, 0);
  var tuftGeo = new THREE.ShapeGeometry(tuftShape), TUFTS = [];
  GRASS.forEach(function (r) {
    var n = Math.round((r[1] - r[0]) * (r[3] - r[2]) * 0.55);
    for (var i = 0; i < n; i++) {
      var tx = r[0] + 0.4 + rnd() * (r[1] - r[0] - 0.8), tz = r[2] + 0.4 + rnd() * (r[3] - r[2] - 0.8);
      for (var bl = 0; bl < 5; bl++) {
        dm.position.set(tx + (rnd() - 0.5) * 0.18, 0.01, tz + (rnd() - 0.5) * 0.18);
        dm.rotation.set((rnd() - 0.5) * 0.7, rnd() * 6.28, (rnd() - 0.5) * 0.7);
        var sc = 0.5 + rnd() * 0.6; dm.scale.set(sc, sc, sc); dm.updateMatrix();
        TUFTS.push({ m: dm.matrix.clone(), c: GREENS[2 + ((rnd() * 3) | 0)] });
      }
    }
  });
  var tuftMesh = new THREE.InstancedMesh(tuftGeo, leafMat, TUFTS.length);
  TUFTS.forEach(function (t, i) { tuftMesh.setMatrixAt(i, t.m); tuftMesh.setColorAt(i, t.c); });
  tuftMesh.castShadow = true; tuftMesh.receiveShadow = true; model.add(tuftMesh);

  // trees spaced out around the hotel, all inside the sheet's drawing frame
  broadleaf(-14.2, -9.9, 0.95); broadleaf(-13.9, 9.4, 0.88); broadleaf(11.6, -11.4, 0.82);
  acacia(14.4, 1.0, 0.74); acacia(-14.9, 0.3, 0.7);
  palm(13.7, 9.6, 0.9); palm(-8.4, 10.9, 0.78); palm(8.6, 10.9, 0.82); palm(-9.8, -11.6, 0.85);
  shrub(12.6, -4.8, 0.6, 5); shrub(-12.7, 4.8, 0.6, 4); shrub(12.4, 6.0, 0.5, 0);
  hedge(-15.8, -3.4, 12.6, 0.7); hedge(3.4, 11.2, 12.6, 0.7);

  await pause(); if (stopped()) return null;
  var bi2 = model.children.length;
  // ---------- the back of the hotel: balconies, climbers and a backyard ----------
  var ZBF = ZB - 0.2;                                     // the back wall's outer face
  var deckMat = new THREE.MeshStandardMaterial({ color: lin('#b48c62'), map: tiled(paperTex, 0.5, 0.5), bumpMap: bumpTex, bumpScale: 0.02, roughness: 0.85 });
  var waterMat = new THREE.MeshStandardMaterial({ color: lin('#63b9cf'), metalness: 0.05, roughness: 0.06, emissive: lin('#2f8fb0'), emissiveIntensity: 0.12 });
  var backGlass = typeof winMat === 'function' ? winMat : function () { return glassMat2; };
  // balconies on alternating bays, staggered floor to floor
  for (var bf = 1; bf <= 3; bf++) for (var bb2 = 0; bb2 < NB; bb2++) {
    if ((bf + bb2) % 2) continue;
    var bxc = X0 + BAY / 2 + bb2 * BAY, by = LV[bf] + 0.36, bw = BAY - 0.7;
    box(bw, 0.14, 1.3, bxc, by + 0.07, ZBF - 0.65, W);
    box(bw, 0.92, 0.05, bxc, by + 0.6, ZBF - 1.28, W);
    box(0.05, 0.92, 1.3, bxc - bw / 2, by + 0.6, ZBF - 0.65, W); box(0.05, 0.92, 1.3, bxc + bw / 2, by + 0.6, ZBF - 0.65, W);
    box(1.5, 2.45, 0.08, bxc - 0.55, by + 1.25, ZBF - 0.07, backGlass(), { cast: false });
    box(0.95, 0.3, 0.3, bxc + 0.75, by + 0.29, ZBF - 1.05, (bf + bb2) % 4 ? ORANGE : W2);
    leafCloud(bxc + 0.75, by + 0.55, ZBF - 1.05, 0.5, 0.28, 0.22, 24, 0.12, null, 0.55);
    for (var tr2 = 0; tr2 < 16; tr2++) {                  // greenery trailing over the rail
      dm.position.set(bxc + 0.3 + rnd() * 0.9, by + 0.95 - rnd() * 1.4, ZBF - 1.33 - rnd() * 0.06);
      up.set(dm.position.x + (rnd() - 0.5) * 0.4, dm.position.y - 0.4, dm.position.z - 1); dm.lookAt(up); dm.rotateZ(rnd() * 6.28);
      var ts = 0.4 + rnd() * 0.3; dm.scale.set(ts, ts, ts); dm.updateMatrix(); LEAVES.push({ m: dm.matrix.clone(), c: GREENS[1 + ((rnd() * 4) | 0)] });
    }
  }
  // climbing plants creeping up the back wall from planter beds
  function creeper(x, maxH, seed) {
    var cx = x, y = 0.15;
    while (y < maxH) {
      cx += (hash(y * 3.1, seed) - 0.5) * 0.45;
      var spread = 0.3 + (1 - y / maxH) * 0.55, n = 4 + ((1 - y / maxH) * 4 | 0);
      for (var k = 0; k < n; k++) {
        dm.position.set(cx + (rnd() - 0.5) * spread * 2, y + rnd() * 0.3, ZBF - 0.04 - rnd() * 0.1);
        up.set(dm.position.x + (rnd() - 0.5) * 0.7, dm.position.y + (rnd() - 0.3) * 0.7, dm.position.z - 1); dm.lookAt(up); dm.rotateZ(rnd() * 6.28);
        var sc = 0.4 + rnd() * 0.35; dm.scale.set(sc, sc, sc); dm.updateMatrix();
        LEAVES.push({ m: dm.matrix.clone(), c: GREENS[Math.min(4, (rnd() * 4 + y / maxH * 1.5) | 0)] });
      }
      y += 0.2;
    }
  }
  creeper(-10.0, 12.2, 1.1); creeper(-7.1, 6.8, 2.3); creeper(7.4, 9.6, 3.7); creeper(10.1, 13.6, 4.9); creeper(-3.4, 4.6, 5.3);
  box(4.4, 0.4, 0.8, -8.5, 0.2, ZBF - 0.45, W2); box(4.4, 0.4, 0.8, 8.7, 0.2, ZBF - 0.45, W2);
  shrub(-9.6, ZBF - 0.5, 0.45, 3); shrub(-7.4, ZBF - 0.5, 0.4, 0); shrub(7.6, ZBF - 0.5, 0.42, 3); shrub(9.8, ZBF - 0.5, 0.45, 0);
  // back door and stepping stones down to the deck
  box(1.7, 2.5, 0.08, 0, 1.25, ZBF - 0.04, NAVY, { cast: false });
  box(2.4, 0.18, 0.5, 0, 2.6, ZBF - 0.25, W);
  [-7.25, -7.75].forEach(function (z, i) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.06, 18), W2); st.position.set((i ? 0.25 : -0.2), 0.03, z); st.receiveShadow = true; model.add(st); });
  // timber deck with a swimming pool
  box(11.6, 0.14, 4.9, -1.4, 0.07, -10.65, deckMat, { tile: 2 });
  box(8.6, 0.05, 2.8, -1.8, 0.15, -10.95, waterMat, { cast: false });
  box(9.2, 0.2, 0.3, -1.8, 0.18, -9.4, W); box(9.2, 0.2, 0.3, -1.8, 0.18, -12.5, W);
  box(0.3, 0.2, 3.4, -6.25, 0.18, -10.95, W); box(0.3, 0.2, 3.4, 2.65, 0.18, -10.95, W);
  // sun loungers along the pool
  [-5.9, -3.8, -1.7].forEach(function (x) {
    box(1.9, 0.26, 0.72, x, 0.27, -8.75, W);
    box(1.6, 0.06, 0.66, x + 0.1, 0.43, -8.75, ORANGE, { cast: false });
    var back = box(0.7, 0.07, 0.66, x - 0.72, 0.7, -8.75, ORANGE); back.rotation.z = -0.9;
  });
  // parasol
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), W); pole.position.set(0.6, 1.25, -8.7); pole.castShadow = true; model.add(pole);
  var can = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 1.35, 0.5, 8, 1, true), new THREE.MeshStandardMaterial({ color: lin('#ffae61'), map: paperTex, roughness: 0.9, side: THREE.DoubleSide }));
  can.position.set(0.6, 2.45, -8.7); can.castShadow = true; can.receiveShadow = true; model.add(can);
  // pergola over an outdoor dining table, with greenery climbing it
  [[5.6, -12.4], [9.4, -12.4], [5.6, -8.9], [9.4, -8.9]].forEach(function (p) { box(0.16, 2.6, 0.16, p[0], 1.3, p[1], W); leafCloud(p[0], 1.0, p[1], 0.25, 1.0, 0.25, 26, -0.05, null, 0.5); });
  box(4.2, 0.14, 0.18, 7.5, 2.62, -12.4, W); box(4.2, 0.14, 0.18, 7.5, 2.62, -8.9, W);
  for (var sl = 0; sl < 8; sl++) box(0.1, 0.1, 3.9, 5.75 + sl * 0.5, 2.75, -10.65, W);
  for (var pl = 0; pl < 7; pl++) leafCloud(5.8 + rnd() * 3.4, 2.85, -12.2 + rnd() * 3.2, 0.55, 0.18, 0.55, 18, 0.2, null, 0.55);
  box(1.9, 0.08, 0.95, 7.5, 0.76, -10.65, deckMat); box(0.1, 0.72, 0.1, 6.7, 0.36, -10.3, W); box(0.1, 0.72, 0.1, 8.3, 0.36, -10.3, W); box(0.1, 0.72, 0.1, 6.7, 0.36, -11.0, W); box(0.1, 0.72, 0.1, 8.3, 0.36, -11.0, W);
  [6.8, 7.5, 8.2].forEach(function (x) { box(0.44, 0.45, 0.44, x, 0.23, -9.75, W2); box(0.44, 0.45, 0.44, x, 0.23, -11.55, W2); box(0.44, 0.5, 0.06, x, 0.7, -9.5, W2); box(0.44, 0.5, 0.06, x, 0.7, -11.8, W2); });
  // barbecue
  box(1.0, 0.85, 0.6, 4.6, 0.43, -12.9, NAVY); box(1.0, 0.06, 0.6, 4.6, 0.88, -12.9, W2);


  // all leaves are one instanced mesh, so a detailed landscape stays cheap to draw
  var leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, LEAVES.length);
  LEAVES.forEach(function (L, i) { leafMesh.setMatrixAt(i, L.m); leafMesh.setColorAt(i, L.c); });
  leafMesh.castShadow = true; leafMesh.receiveShadow = true; model.add(leafMesh);
  if (BLOOMS.length) {
    var bloomGeo = new THREE.CircleGeometry(0.16, 7);
    var bloomMesh = new THREE.InstancedMesh(bloomGeo, bloomMat, BLOOMS.length);
    BLOOMS.forEach(function (m, i) { bloomMesh.setMatrixAt(i, m); });
    bloomMesh.castShadow = true; model.add(bloomMesh);
  }
  function person(x, z, ry, mat) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.25, 10), mat); body.position.y = 0.62; body.castShadow = true; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), mat); head.position.y = 1.42; head.castShadow = true; g.add(head);
    g.position.set(x, 0, z); g.rotation.y = ry; model.add(g);
  }
  person(-1.6, 10.2, 0.3, W); person(-1.0, 10.6, 2.6, ORANGE); person(3.2, 10.0, 2.0, NAVY); person(2.4, 9.0, 1, W); person(5.8, 11.2, -0.5, W); person(-6.4, 11.6, 0.8, W); person(1.0, 12.4, 0, W);

  await pause(); if (stopped()) return null;
  var bi3 = model.children.length, sd0 = scene.children.length;
  // ---------- torn paper backdrop ----------
  function tornLayer(width, topY, amp, seed, z, mat, rim, rimMat) {
    var s = new THREE.Shape(), n = 220, x0 = -width / 2;
    s.moveTo(x0, -2); s.lineTo(-x0, -2);
    for (var i = n; i >= 0; i--) {
      var x = x0 + width * i / n;
      var y = topY + (fbm(x * 0.035 + seed, seed * 0.3) - 0.5) * amp * 2 + (hash(i, seed) - 0.5) * 0.35;
      s.lineTo(x, y);
    }
    var g = new THREE.ShapeGeometry(s);
    var m = new THREE.Mesh(g, mat); m.position.z = z; m.receiveShadow = true; m.castShadow = true; scene.add(m);
    if (rim) {
      var s2 = new THREE.Shape(); s2.moveTo(x0, -2); s2.lineTo(-x0, -2);
      for (i = n; i >= 0; i--) {
        x = x0 + width * i / n;
        y = topY + (fbm(x * 0.035 + seed, seed * 0.3) - 0.5) * amp * 2 + 0.45 + hash(i + 7, seed) * 0.55;
        s2.lineTo(x, y);
      }
      var r = new THREE.Mesh(new THREE.ShapeGeometry(s2), rimMat || Wd); r.position.z = z - 0.04; r.receiveShadow = true; scene.add(r);
    }
    return m;
  }
  var deepRust = paper('#1c252d', { map: tiled(paperTex, 0.22, 0.22) });
  // six sheets, deeper tears, wider gaps between them
  var T = function (hex) { return paper(hex, { map: tiled(paperTex, 0.22, 0.22) }); };
  tornLayer(300, 36, 12, 1.3, -46, deepRust, true, RUSTd);
  tornLayer(280, 29, 11, 4.1, -40, T('#efeeea'), true, paper('#d9d8d3'));
  tornLayer(260, 22, 9, 7.7, -34, T('#ffae61'), true);
  tornLayer(240, 15.5, 8, 2.2, -28.5, T('#efeeea'), true, paper('#d9d8d3'));
  tornLayer(220, 9.5, 6, 5.6, -23.5, T('#1c252d'), true, RUSTd);
  tornLayer(200, 4.5, 4.5, 9.9, -19, T('#efeeea'), true, paper('#d9d8d3'));
  var sd1 = scene.children.length;
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), paper('#e9e8e4', { map: tiled(paperTex, 140, 140) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.8; floor.receiveShadow = true; scene.add(floor);
  model.position.y = 0;

  // ---------- drifting paper scraps ----------
  // Their own random sequence (scene changes elsewhere never move them again), a near layer that
  // drops past the hero view, stronger colours and a stone-like fall (ideas log §12).
  var srnd = (function () { var s = 4242; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  var scraps = [], SN = small ? 12 : 34, NEAR = small ? 4 : 6;
  // the hero camera looks from (31, 15, 38) at (0.5, 6.5, 0): near pieces fall in that line of sight
  var PX = 0.78, PZ = -0.626; // sideways, across the view
  function placeNear(m, top) {
    var f = 0.32 + srnd() * 0.3, off = (srnd() - 0.5) * 16;
    m.position.set(31 + (0.5 - 31) * f + PX * off, top ? 17 + srnd() * 7 : 3 + srnd() * 20, 38 - 38 * f + PZ * off);
  }
  for (var si = 0; si < SN; si++) {
    var near = si < NEAR;
    var ss = new THREE.Shape(), k = 5 + ((srnd() * 4) | 0), rr0 = near ? 0.32 + srnd() * 0.35 : 0.25 + srnd() * 0.45;
    for (var q = 0; q < k; q++) { var aa = q / k * Math.PI * 2, rq = rr0 * (0.6 + srnd() * 0.6); if (q === 0) ss.moveTo(Math.cos(aa) * rq, Math.sin(aa) * rq); else ss.lineTo(Math.cos(aa) * rq, Math.sin(aa) * rq); }
    var rq2 = srnd(); var sm = new THREE.Mesh(new THREE.ShapeGeometry(ss), rq2 < 0.35 ? RUSTd : (rq2 < 0.65 ? NAVYd : Wd));
    if (near) placeNear(sm, false); else sm.position.set(-30 + srnd() * 60, 3 + srnd() * 26, -18 + srnd() * 36);
    sm.castShadow = true;
    sm.userData = { v: 0.36 + srnd() * 0.37, r: new THREE.Vector3(srnd() - 0.5, srnd() - 0.5, srnd() - 0.5), ph: srnd() * 6, near: near };
    scene.add(sm); scraps.push(sm);
  }


  await pause(); if (stopped()) return null;
  // ---------- lights ----------
  var hemi = new THREE.HemisphereLight(lin('#ffffff'), lin('#b9bdc1'), 0.5); scene.add(hemi);
  var key = new THREE.DirectionalLight(lin('#fff6ea'), 2.1);
  key.position.set(-40, 30, 30); key.castShadow = true;
  var SM = ultra ? 4096 : small || standard ? 1024 : 2048; key.shadow.mapSize.set(SM, SM);
  var kc = key.shadow.camera; kc.left = -75; kc.right = 75; kc.top = 70; kc.bottom = -45; kc.near = 5; kc.far = 160;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
  scene.add(key);
  var fill = new THREE.DirectionalLight(lin('#ffe2c6'), 0.45); fill.position.set(30, 18, 20); scene.add(fill);

  await pause(); if (stopped()) return null;
  // ---------- camera keyframes ----------
  var KEYS = {
    hero:  { cam: [31, 15, 38], tgt: [0.5, 6.5, 0], eve: 0, fov: 34 },
    chain: { cam: [-24, 12.5, -15.5], tgt: [0.5, 7, -2], eve: 0.15, fov: 36 },  // round the back of the hotel
    plan:  { cam: [0.5, 66, 6], tgt: [0, 0, 0], eve: 0, fov: 32 },
    work:  { cam: [-28, 22, 30], tgt: [0, 6, 0], eve: 0.2, fov: 34 },
    dusk:  { cam: [-7, 8, 36], tgt: [0, 8, 0], eve: 1, fov: 34 }
  };
  var anchors = [];
  function measure() {
    anchors = [];
    document.querySelectorAll('[data-cam]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      anchors.push({ y: r.top + scrollY + r.height / 2, k: KEYS[el.getAttribute('data-cam')] });
    });
    anchors.sort(function (a, b) { return a.y - b.y; });
  }
  function sample(y) {
    if (!anchors.length || y <= anchors[0].y) return { k: anchors.length ? anchors[0].k : KEYS.hero, hw: 1 };
    for (var i = 0; i < anchors.length - 1; i++) {
      var a = anchors[i], b = anchors[i + 1];
      if (y <= b.y) {
        var t = sstep(0, 1, (y - a.y) / (b.y - a.y)), o = {};
        o.eve = a.k.eve + (b.k.eve - a.k.eve) * t; o.fov = a.k.fov + (b.k.fov - a.k.fov) * t;
        // orbit between views (angle, radius and height around the target) instead of cutting straight through the model
        o.tgt = a.k.tgt.map(function (v, j) { return v + (b.k.tgt[j] - v) * t; });
        var ax = a.k.cam[0] - a.k.tgt[0], az = a.k.cam[2] - a.k.tgt[2], bx = b.k.cam[0] - b.k.tgt[0], bz = b.k.cam[2] - b.k.tgt[2];
        var aa = Math.atan2(ax, az), ba = Math.atan2(bx, bz), da = ba - aa;
        while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
        var ang = aa + da * t, rad = Math.hypot(ax, az) + (Math.hypot(bx, bz) - Math.hypot(ax, az)) * t;
        var ry = (a.k.cam[1] - a.k.tgt[1]) + ((b.k.cam[1] - b.k.tgt[1]) - (a.k.cam[1] - a.k.tgt[1])) * t;
        o.cam = [o.tgt[0] + Math.sin(ang) * rad, o.tgt[1] + ry, o.tgt[2] + Math.cos(ang) * rad];
        return { k: o, hw: a.k === KEYS.hero ? 1 - t : 0 };
      }
    }
    return { k: anchors[anchors.length - 1].k, hw: 0 };
  }

  // ---------- labels ----------
  var tags = [
    { el: document.getElementById('tag-design'), p: new THREE.Vector3(X0 + BAY, LV[4] + 1.4, ZF + 1.4) },
    { el: document.getElementById('tag-cut'), p: new THREE.Vector3((CX0 + CX1) / 2, CY1 + 0.9, ZF + 1.2) },
    { el: document.getElementById('tag-built'), p: new THREE.Vector3(X0 + BAY * 3, LV[2] + 1.8, ZF + 1.6) }
  ];
  var pv = new THREE.Vector3();
  function placeTags(op) {
    tags.forEach(function (t) {
      if (!t.el) return;
      pv.copy(t.p).project(camera);
      var vis = pv.z < 1 && op > 0.02;
      t.el.style.opacity = vis ? op.toFixed(3) : '0';
      t.el.style.transform = 'translate(' + ((pv.x * 0.5 + 0.5) * vw).toFixed(1) + 'px,' + ((-pv.y * 0.5 + 0.5) * vh).toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  // ---------- size ----------
  var vw = 1, vh = 1;
  // fit the model to any screen: on tall/narrow screens widen the lens a little and pull the camera back
  // so the hotel keeps the same width in frame as on a desktop; on phones it sits in the top half, above the text
  var fit = 1, fovMul = 1, wide = true;
  function resize() {
    var nw = innerWidth, nh = innerHeight;
    if (vw > 1 && Math.abs(nw - vw) < 2 && Math.abs(nh - vh) < 160 && nw <= 980) return; // mobile address bar showing/hiding
    vw = nw; vh = nh; R.setSize(vw, vh, false);
    var a = vw / vh; camera.aspect = a; wide = vw > 980;
    fovMul = a < 1.5 ? Math.min(1.32, 1 + (1.5 - a) * 0.3) : 1;
    var f = 34 * Math.PI / 360;
    var ref = Math.tan(f) * (wide ? 1.6 : 1.25), now = Math.tan(f * fovMul) * a;
    fit = Math.max(1, ref / now) * (wide ? 1 : 0.95);
    if (wide) camera.setViewOffset(vw, vh, -vw * 0.17, 0, vw, vh);
    else camera.setViewOffset(vw, vh, 0, vh * (a < 0.8 ? 0.24 : 0.16), vw, vh);
    camera.updateProjectionMatrix(); measure();
  }
  addEventListener('resize', resize); resize(); addEventListener('load', measure); setTimeout(measure, 800);
  // ---------- motion: critically damped springs (Apple: damping 1.0 by default, ~0.8 only after a flick) ----------
  function Spring(x, response, damping) { this.x = x; this.v = 0; this.t = x; this.w = 2 * Math.PI / response; this.z = damping; }
  Spring.prototype.step = function (dt) {
    var n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (var i = 0; i < n; i++) { var acc = this.w * this.w * (this.t - this.x) - 2 * this.z * this.w * this.v; this.v += acc * h; this.x += this.v * h; }
    return this.x;
  };
  Spring.prototype.set = function (response, damping) { this.w = 2 * Math.PI / response; this.z = damping; };
  function SpringN(arr, response, damping) { return arr.map(function (v) { return new Spring(v, response, damping); }); }
  // ---------- views and zoom (buttons on the page; pinch and Ctrl + wheel on the model) ----------
  var zoom = new Spring(1, 0.55, 1), ZMIN = 0.6, ZMAX = 1.6;
  var HERO = { cam: KEYS.hero.cam.slice(), tgt: KEYS.hero.tgt.slice(), eve: KEYS.hero.eve, fov: KEYS.hero.fov };
  var VIEWS = {
    front: HERO,
    back: { cam: KEYS.chain.cam.slice(), tgt: KEYS.chain.tgt.slice(), eve: KEYS.hero.eve, fov: KEYS.chain.fov },
    cutaway: { cam: [(CX0 + CX1) / 2 + 6, (CY0 + CY1) / 2 + 2.5, ZF + 15], tgt: [(CX0 + CX1) / 2, (CY0 + CY1) / 2, ZF - 1], eve: KEYS.hero.eve, fov: 32 },
    site: { cam: KEYS.plan.cam.slice(), tgt: KEYS.plan.tgt.slice(), eve: KEYS.hero.eve, fov: KEYS.plan.fov }
  };
  function setView(name) {
    var v = VIEWS[name] || HERO;
    // the hero keyframe is the one the page-top camera follows; anchors keep a reference to it
    KEYS.hero.cam = v.cam.slice(); KEYS.hero.tgt = v.tgt.slice(); KEYS.hero.fov = v.fov;
    yaw.t = 0; dragged = true; if (hint) hint.classList.add('gone');
  }
  function zoomBy(step) { zoom.t = Math.max(ZMIN, Math.min(ZMAX, zoom.t * (1 - step))); }
  function resetView() { setView('front'); zoom.t = 1; }
  // scroll-driven camera: one spring per axis (2D/3D motion decomposed into independent springs)
  var k0 = KEYS.hero;
  var sCam = SpringN(k0.cam, 1.1, 1), sTgt = SpringN(k0.tgt, 1.1, 1);
  var sEve = new Spring(0, 1.2, 1), sFov = new Spring(k0.fov, 1.1, 1);
  var sMx = new Spring(0, 0.9, 1), sMy = new Spring(0, 0.9, 1);

  // ---------- direct manipulation: grab and turn the model ----------
  var LIM = 0.95;                               // soft limit on the turn, radians
  var yaw = new Spring(0, 0.45, 1);             // presentation value lives in yaw.x
  var drag = null, hist = [], dragged = false;
  var hint = document.getElementById('drag-hint');
  function rubber(over, dim, c) { c = c || 0.55; return (over * dim * c) / (dim + c * Math.abs(over)); }
  function soft(raw) {                          // rubber-band past the limits instead of a hard stop
    if (raw > LIM) return LIM + rubber(raw - LIM, 0.8);
    if (raw < -LIM) return -LIM + rubber(raw + LIM, 0.8);
    return raw;
  }
  var RAD_PER_PX = 0.0062;
  canvas.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    // interrupt any running spring: start from the live (presentation) value, never the target
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, yaw0: yaw.x, raw0: yaw.x, live: false };
    yaw.v = 0; yaw.t = yaw.x;
    hist = [{ x: e.clientX, t: performance.now() }];
    root.classList.add('grabbing');
    if (hint) hint.classList.add('pressed');
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.live) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;     // ~10px hysteresis before committing
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; root.classList.remove('grabbing'); return; } // it's a scroll
      drag.live = true; drag.x0 = e.clientX; drag.yaw0 = yaw.x;  // respect where they grabbed
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      dragged = true; if (hint) hint.classList.add('gone');
    }
    var raw = drag.yaw0 + (e.clientX - drag.x0) * RAD_PER_PX;
    yaw.x = soft(raw); yaw.t = yaw.x; yaw.v = 0;                // 1:1 tracking
    hist.push({ x: e.clientX, t: performance.now() }); if (hist.length > 6) hist.shift();
  });
  function release(e) {
    if (!drag) return;
    var wasLive = drag.live; drag = null; root.classList.remove('grabbing'); if (hint) hint.classList.remove('pressed');
    if (!wasLive) return;
    var a = hist[0], b = hist[hist.length - 1], dtm = Math.max(16, b.t - a.t);
    var v = (b.x - a.x) / dtm * 1000 * RAD_PER_PX;              // rad/s at release
    if (performance.now() - b.t > 80) v = 0;                    // finger stopped before lifting
    var d = 0.995, projected = yaw.x + (v / 1000) * d / (1 - d) * 1; // momentum projection (Apple's decay form)
    var target = Math.max(-LIM, Math.min(LIM, projected));
    yaw.set(0.5, Math.abs(v) > 0.4 ? 0.82 : 1);                 // a little bounce only if it was flicked
    yaw.t = target; yaw.v = v;                                  // velocity handoff: no seam between drag and spring
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  // pinch to zoom (two fingers on the model); one finger keeps scrolling the page or turning the model
  var touches = new Map(), pinch0 = 0, zoom0 = 1;
  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { var t = Array.from(touches.values()); pinch0 = Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y); zoom0 = zoom.t; drag = null; }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2 && pinch0 > 0) { var t = Array.from(touches.values()); var d = Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y); zoom.t = Math.max(ZMIN, Math.min(ZMAX, zoom0 * pinch0 / Math.max(1, d))); }
  });
  var endTouch = function (e) { touches.delete(e.pointerId); if (touches.size < 2) pinch0 = 0; };
  canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
  // Ctrl + wheel zooms; the plain wheel keeps scrolling the page
  canvas.addEventListener('wheel', function (e) { if (!e.ctrlKey) return; e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.08 : -0.08); }, { passive: false });

  var tmx = 0, tmy = 0;
  addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && !drag) { tmx = e.clientX / vw * 2 - 1; tmy = e.clientY / vh * 2 - 1; } }, { passive: true });

  var clock = new THREE.Timer(), lastHw = 1; clock.connect(document); cleanup.push(function () { clock.dispose(); });
  // only draw while a see-through section of the page shows the model
  var visible = true, frameNo = 0, slow = 0, vslow = 0, tStart = -1, build = null, settled = 0;
  var windows = document.querySelectorAll('.home-window');
  if (windows.length && 'IntersectionObserver' in window) {
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
      var was = visible; visible = seen.size > 0;
      if (visible && !was) { clock.update(); requestAnimationFrame(frame); }
    });
    windows.forEach(function (w) { io.observe(w); });
    cleanup.push(function () { io.disconnect(); });
  }
  function frame() {
    if (!visible) return; // resumes from the observer
    clock.update(); var dt = Math.min(0.05, clock.getDelta()), el = clock.getElapsed();
    // time starts at the first frame, so the first live frame is exactly the still picture; frozen for the still captures
    if (tStart < 0) tStart = el;
    var t = env.capture ? 0 : el - tStart, moving = !reduced && !env.capture;
    var s = sample(scrollY + vh * 0.5), k = s.k;
    for (var i = 0; i < 3; i++) { sCam[i].t = k.cam[i]; sTgt[i].t = k.tgt[i]; sCam[i].step(dt); sTgt[i].step(dt); }
    sEve.t = k.eve; sFov.t = k.fov; sEve.step(dt); sFov.step(dt);
    sMx.t = tmx; sMy.t = tmy; sMx.step(dt); sMy.step(dt);
    // leaving the hero: the turn the user gave the model eases home, critically damped
    if (s.hw < 0.3 && lastHw >= 0.3 && !drag) { yaw.set(1.0, 1); yaw.t = 0; }
    lastHw = s.hw;
    if (!drag) yaw.step(dt);

    var cx = sCam[0].x, cy = sCam[1].x, cz = sCam[2].x, tx = sTgt[0].x, ty = sTgt[1].x, tz = sTgt[2].x;
    // a slow idle turn once the model has mostly built (eases in over ~4 s), calmer below the hero
    var ti = Math.max(0, t - 3), idleTurn = moving ? Math.sin(ti * 0.15) * 0.16 * Math.min(1, ti / 3) * (0.45 + 0.55 * s.hw) : 0;
    var orbit = idleTurn + sMx.x * 0.05 + yaw.x;
    zoom.step(dt);
    var zf = fit * zoom.x;
    var dx = (cx - tx) * zf, dz = (cz - tz) * zf, ca = Math.cos(orbit), sa = Math.sin(orbit);
    camera.position.set(tx + dx * ca - dz * sa, ty + (cy - ty) * zf - sMy.x * 1.4, tz + dx * sa + dz * ca);
    camera.position.z = Math.max(camera.position.z, -17.5);   // never slip behind the backdrop sheets
    camera.lookAt(tx, ty, tz);
    var wantFov = sFov.x * fovMul; if (Math.abs(camera.fov - wantFov) > 0.01) { camera.fov = wantFov; camera.updateProjectionMatrix(); }

    var ev = Math.max(0, Math.min(1, sEve.x));
    scene.background.copy(BG_DAY).lerp(BG_EVE, ev); scene.fog.color.copy(scene.background);
    key.intensity = 2.1 - 1.35 * ev; hemi.intensity = 0.5 - 0.25 * ev; fill.intensity = 0.4 - 0.22 * ev;
    glassMat.emissiveIntensity = ev * 1.15; glassMat2.emissiveIntensity = ev * 0.55;
    cutLights.forEach(function (l) { l.intensity = 0.25 + ev * 3; });

    // the opening build; leaving the hero or touching the model speeds it up
    if (build && !build.done) {
      if (s.hw < 0.6 || drag || Math.abs(zoom.x - 1) > 0.02) build.hurry();
      if (build.step(dt)) { scraps.forEach(function (m) { m.visible = true; }); document.documentElement.setAttribute('data-hotel-built', ''); }
    }
    if (moving) scraps.forEach(function (m) {
      var u = m.userData, f = dt * 60; m.position.y -= u.v * 0.016 * f; m.position.x += Math.sin(t * 0.4 + u.ph) * 0.01 * f;
      m.rotation.x += u.r.x * 0.01 * f; m.rotation.y += u.r.y * 0.012 * f; m.rotation.z += u.r.z * 0.01 * f;
      if (m.position.y < 0.5) { if (u.near) placeNear(m, true); else m.position.y = 30; }
    });

    placeTags(s.hw);
    if (hint) hint.style.opacity = dragged ? '0' : (s.hw * 1).toFixed(3);
    // first frame without the shadow pass, shadows from the second: splits the first-use shader work over two tasks
    var fi = frameNo++;
    if (fi % 3 === 1 || (build && !build.done && fi % 2 === 0 && fi > 1)) R.shadowMap.needsUpdate = true; // more often while pieces move
    // adaptive resolution: if frames keep running slower than ~40 fps, draw fewer pixels
    // frame check (owner, 2026-10-24: 3D for most devices, the 2D drawing only for the slowest). Counted after the
    // build and ~2 s of settling. Below ~30 fps: step the pixel ratio down, never below 1× (CSS pixels). Still below
    // ~20 fps at 1×: hand over to the 2D drawing. A dev preview never steps down.
    if ((!build || build.done) && ++settled > 120) {
      if (dt > 0.034) slow++; else slow = Math.max(0, slow - 1);
      if (dt > 0.05) vslow++; else vslow = Math.max(0, vslow - 1);
    }
    if (env.fixed) slow = vslow = 0;
    if (slow > 60 && ratio > 1) { ratio = Math.max(1, ratio - 0.5); R.setPixelRatio(ratio); R.setSize(vw, vh, false); slow = 0; vslow = 0; if (env.onStepDown) env.onStepDown(); }
    else if (vslow > 90 && ratio <= 1 && env.onSlow) { env.onSlow(); env.onSlow = null; }
    if (frameNo === 300 && slow === 0 && env.onSmooth) env.onSmooth(ratio === maxRatio);
    R.render(scene, camera);
    if (fi === 1 && env.onReady) { var onReady = env.onReady; env.onReady = null; onReady(); } // fade in once shadows are drawn
    requestAnimationFrame(frame);
  }
  // three.js r155+ uses physical light units; keep the concept's tuned look
  scene.traverse(function (o) { if (o.isLight) legacyLight(o); });
  // the page grows as images load: keep the scroll anchors for the camera in step
  var layoutObserver = new ResizeObserver(function () { measure(); });
  layoutObserver.observe(document.body);
  cleanup.push(function () { layoutObserver.disconnect(); });
  if (env.debug) window.__hotelDebug = { camera: camera, keys: KEYS, sample: function () { return { anchors: anchors.map(function (a) { return a.y; }), vh: vh, vw: vw, fit: fit, scrollY: scrollY }; } };
  if (R.compileAsync) { try { await R.compileAsync(scene, camera); } catch (err) {} }
  if (stopped()) return null;
  // after compiling (hidden objects aren't compiled): hide the model for the opening build
  if (!reduced && !env.capture) {
    build = createBuild({
      backdrop: scene.children.slice(sd0, sd1),
      base: model.children.slice(0, bi0),
      building: model.children.slice(bi0, bi1).concat(model.children.slice(bi2, bi3)),
      green: model.children.slice(bi1, bi2),
      lamps: [],
    }, THREE, { timeScale: env.buildScale });
    scraps.forEach(function (m) { m.visible = false; });
  } else document.documentElement.setAttribute('data-hotel-built', '');
  cleanup.push(function () { document.documentElement.removeAttribute('data-hotel-built'); });
  requestAnimationFrame(frame);

  return {
    setView: setView,
    zoomBy: zoomBy,
    resetView: resetView,
    dispose: function () {
      alive = false;
      window.cancelAnimationFrame(rafId);
      cleanup.forEach(function (fn) { fn(); });
      root.classList.remove('grabbing');
      scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
          Object.keys(m).forEach(function (k) { if (m[k] && m[k].isTexture) m[k].dispose(); });
          m.dispose();
        });
      });
      R.dispose();
    }
  };
}

// The opening build of the hotel model (owner, 2026-10-24): the paper background first, then the
// model builds itself on top of it, like a construction sequence.
//   1. backdrop: the torn paper sheets rise out of the ground, back to front
//   2. base:     the board with the printed site plan settles into place
//   3. building: pieces drop in and settle, floor by floor from the ground up, left to right
//   4. green:    trees, lawns and hedges grow up from the ground with a slight spring
//   5. lamps:    (night) lamp glows, bulbs and fireflies pop on
// Lights themselves are never hidden: changing the number of lights would recompile every shader.
// Only position and scale change, so no extra shaders are compiled. Every object ends exactly
// where the scene put it. Scrolling away or touching the model speeds the sequence up.

var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
var easeBack = function (p) { var c = 1.4; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

// groups: { backdrop, base, building, green, lamps }: arrays of Object3D
// opts.timeScale: Admin → Motion "Home model building itself" (1 = about 6 s in all)
export function createBuild(groups, THREE, opts) {
  var K = 1.35 * ((opts && opts.timeScale) || 1);
  var items = [];
  var keep = function (o) { return !o.isLight; };
  Object.keys(groups).forEach(function (k) { groups[k] = (groups[k] || []).filter(keep); });
  var box = new THREE.Box3();

  function add(obj, kind, start, dur, base) {
    items.push({
      o: obj, kind: kind, start: start * K, dur: dur * K, base: base || 0,
      y: obj.position.y, sy: obj.scale.y, sx: obj.scale.x, sz: obj.scale.z,
    });
  }

  // 1. backdrop: back to front (most negative z first)
  var back = (groups.backdrop || []).slice().sort(function (a, b) { return a.position.z - b.position.z; });
  var zs = [];
  back.forEach(function (o) { var z = Math.round(o.position.z); if (zs.indexOf(z) < 0) zs.push(z); });
  back.forEach(function (o) { add(o, 'rise', 0.05 + zs.indexOf(Math.round(o.position.z)) * 0.16, 0.95); });

  // 2. base
  (groups.base || []).forEach(function (o, i) { add(o, 'settle', 0.85 + i * 0.03, 0.55); });

  // 3. building: order by the bottom of each piece, then left to right
  var pieces = (groups.building || []).map(function (o) {
    box.setFromObject(o);
    var ok = isFinite(box.min.y);
    return { o: o, y: ok ? box.min.y : o.position.y, h: ok ? box.max.y - box.min.y : 0, x: ok ? (box.min.x + box.max.x) / 2 : o.position.x };
  });
  var top = 1, minX = Infinity, maxX = -Infinity;
  pieces.forEach(function (p) { top = Math.max(top, p.y); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
  var spanX = Math.max(1, maxX - minX);
  pieces.forEach(function (p) {
    var level = clamp01(p.y / top), across = clamp01((p.x - minX) / spanX);
    // walls taller than a floor grow up alongside the floors instead of dropping in whole
    if (p.h > 6) add(p.o, 'wall', 1.25 + across * 0.2, 1.9, p.y);
    else add(p.o, 'drop', 1.25 + level * 1.7 + across * 0.32, 0.5);
  });

  // 4. greenery and figures, grown from the ground (scale about y = 0)
  (groups.green || []).forEach(function (o) {
    box.setFromObject(o);
    var x = isFinite(box.min.x) ? (box.min.x + box.max.x) / 2 : 0;
    add(o, 'grow', 3.0 + clamp01((x - minX) / spanX) * 0.5 + (Math.abs(Math.sin(x * 12.9898)) % 1) * 0.12, 0.65);
  });

  // 5. lamps, last
  (groups.lamps || []).forEach(function (o, i) { add(o, 'pop', 3.5 + (i % 12) * 0.05, 0.5); });

  var end = 0;
  items.forEach(function (it) { end = Math.max(end, it.start + it.dur); });
  var t = 0, done = items.length === 0, speed = 1;

  function apply(it, p) {
    var o = it.o;
    if (p <= 0) { o.visible = false; return; }
    o.visible = true;
    if (p >= 1) { o.position.y = it.y; o.scale.set(it.sx, it.sy, it.sz); return; }
    var e;
    if (it.kind === 'rise') { e = easeOut(p); o.position.y = it.y - (1 - e) * 38; }
    else if (it.kind === 'settle') { e = easeOut(p); o.position.y = it.y + (1 - e) * 1.2; }
    else if (it.kind === 'drop') { e = easeOut(p); o.position.y = it.y + (1 - e) * 2.4; o.scale.y = it.sy * (0.35 + 0.65 * e); }
    else if (it.kind === 'pop') { e = Math.max(0.001, easeBack(p)); o.scale.set(it.sx * e, it.sy * e, it.sz * e); }
    else if (it.kind === 'wall') { e = Math.max(0.001, easeOut(p)); o.position.y = it.base + (it.y - it.base) * e; o.scale.y = it.sy * e; }
    else { e = Math.max(0.001, easeBack(p)); o.position.y = it.y * e; o.scale.y = it.sy * e; }
  }

  // hide everything for the first frame: the canvas then fades in showing only the paper ground
  items.forEach(function (it) { apply(it, 0); });

  return {
    get done() { return done; },
    // 0 → 1 over the last second of the sequence (for lights warming up)
    get warm() { return done ? 1 : clamp01((t - (end - 1.2)) / 1.2); },
    hurry: function () { speed = 5; },
    step: function (dt) {
      if (done) return true;
      t += dt * speed;
      for (var i = 0; i < items.length; i++) apply(items[i], clamp01((t - items[i].start) / items[i].dur));
      if (t >= end) { items.forEach(function (it) { apply(it, 1); }); done = true; }
      return done;
    },
    finish: function () { if (!done) { t = end; this.step(0); } },
  };
}

// scene.js - a pixel-art Toronto morning, panned by scroll. window.ParkScene, no deps.
// Buffer: everything is drawn into a W x H ImageData (a Uint32Array view over it) with no AA,
// no gradients, hard edges and Bayer dithering - the pixel-art look is a style, not a resolution.
// The buffer is one art pixel per DEVICE pixel: W = innerWidth * devicePixelRatio, blitted with
// putImageData straight onto a canvas whose CSS size is the viewport, so nothing is resampled.
// Only a buffer past the pixel budget (3.8M desktop, 1.6M touch) steps up to s x s blocks, drawn
// through an offscreen canvas with smoothing off. Frame 0 is drawn on the page; every frame after
// that is drawn in a worker running this same file and handed back as a transferred buffer, so
// the page thread only blits (mountPage). No Worker, ?sync in the URL, or a worker error: it all
// stays on the page. Every hand-set size goes through
// u(n) = round(n * W/480), so the composition is identical at any buffer width and the extra
// pixels buy detail rather than scale.
// HZ = round(H*0.62) is the horizon; every y is anchored to it, so any H works.
// World is four screens: WORLD = 4W, camX = round(progress*(WORLD-W)), t = progress
// (0 = dawn, 1 = mid-morning). Screen x of a world x: sx = wx - camX*p, with parallax
// p = 0 sky/moon/sun, .02 plane, .03 clouds, .035 far skyline, .05 near skyline + CN Tower (2 km
// off, it barely moves), .15 birds, .42 back tree row, .5 tree line, 1 the ground and everything on it.
// Layers back->front: sky, stars, moon, sun, plane, clouds, skyline (+CN Tower), birds, tree line,
// grass, street, then the street row, park objects with their shadows, traffic, props, the tree.
// One camera for everything: focal length W, eye 2.5 m above the ground. Something m metres tall
// standing on ground row y is mpx(m, y) = m*(y-HZ)/2.5 px. One sun (geom): it rises at t~.087 and
// climbs to ~42 deg by t=1, ahead of the viewer and drifting right, so shadows fall toward the viewer
// from the horizon point under it (shadow, sunK, projX, projY). C() grades a colour for the time of
// day (blue hour -> sunrise -> neutral); CR() is the raw colour, for the sky and anything that emits light.
// skyRow[y] holds the flat colour of every sky row, so the moon's bite and the gaps in the
// canopy can be punched back to sky without re-reading the buffer.
// Palette: blog palette only, no additions.
(function () {
'use strict';
// the worker loads this same file; captured now, while the script tag is still current
var SRC = typeof document !== 'undefined' ? ((document.currentScript || (document.querySelector && document.querySelector('script[src*="scene"]')) || {}).src || '') : '';

var LE = (function () { var b = new ArrayBuffer(4); new Uint32Array(b)[0] = 0x01020304; return new Uint8Array(b)[0] === 4; })();
var cc = Object.create(null);
function CR(h) {                       // raw colour: sky, sun, moon, stars, and anything that emits light
  var v = cc[h];
  if (v === undefined) {
    var n = parseInt(h.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    v = cc[h] = (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
  }
  return v;
}
// surfaces lit only by the sky are dark and blue before sunrise, warm at sunrise, neutral by mid-morning.
// graded once per colour per time step (t quantised to 12), so it costs nothing per pixel.
var GK = [[0, 0.58, 0.62, 0.80], [0.12, 0.86, 0.76, 0.72], [0.33, 1.00, 0.93, 0.84], [0.60, 1, 1, 1]];
var gcache = [], gc = null, gm = null;
function gradeAt(q) {
  for (var i = 1; i < GK.length; i++) if (q <= GK[i][0]) { var a = GK[i - 1], b = GK[i], f = (q - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]; }
  return [1, 1, 1];
}
function setGrade(t) { var st = Math.round(t * 12); gc = gcache[st] || (gcache[st] = Object.create(null)); gm = gradeAt(st / 12); }
function C(h) {                        // surface colour, graded for the time of day
  if (!gc) return CR(h);
  var v = gc[h];
  if (v === undefined) {
    var n = parseInt(h.slice(1), 16), r = Math.min(255, Math.round((n >> 16 & 255) * gm[0])), g = Math.min(255, Math.round((n >> 8 & 255) * gm[1])), b = Math.min(255, Math.round((n & 255) * gm[2]));
    v = gc[h] = (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
  }
  return v;
}
var cl01 = function (v) { v = +v; return v > 0 ? (v < 1 ? v : 1) : 0; };
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

var DAWN = ['#141c45', '#22306a', '#2d4079', '#4d4d86', '#6d5b93', '#a8739e', '#e08fa8', '#f4ac6b', '#ffd98a'];
var MORN = ['#1566bd', '#1b78c9', '#2585d4', '#2f93e0', '#48a9e7', '#5cbcec', '#80cdef', '#a3ddf2', '#d6ecf7'];var SKY_SUNUP = ['#1a5aa8', '#1d6bbf', '#2a82d2', '#4a9fdf', '#74b9e6', '#a3cfe8', '#cfdde2', '#ecdcb8', '#f6e2a8'];
        // band i flips dawn->morning here: the
                                                       // top lightens first, the warm strip at the
                                                       // horizon is the last thing to go
var BND = [0, 0.16, 0.30, 0.42, 0.53, 0.63, 0.73, 0.83, 0.92, 1];function skyTint(v, tr, tg, tb, f) {
  // a packed colour moved f of the way toward (tr, tg, tb): the sun's aureole, the moon's earthshine
  var r, g, b;
  if (LE) { r = v & 255; g = v >> 8 & 255; b = v >> 16 & 255; } else { r = v >>> 24; g = v >> 16 & 255; b = v >> 8 & 255; }
  r = Math.round(r + (tr - r) * f); g = Math.round(g + (tg - g) * f); b = Math.round(b + (tb - b) * f);
  return (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
}function skyBands(q) {
  // the 9 sky band colours (top of the frame -> horizon) at time step q = round(t * 12): DAWN at
  // civil dawn, lerped to SKY_SUNUP by t = .30 (sun ~10 deg up) and on to MORN by t = .70
  var c = SKY_BANDS[q], f = q / 12, i, j, a, b, g, n, m, v;
  if (c) return c;
  c = SKY_BANDS[q] = [];
  for (i = 0; i < 9; i++) {
    if (f < 0.30) { a = DAWN[i]; b = SKY_SUNUP[i]; g = f / 0.30; } else { a = SKY_SUNUP[i]; b = MORN[i]; g = Math.min(1, (f - 0.30) / 0.40); }
    n = parseInt(a.slice(1), 16); m = parseInt(b.slice(1), 16); v = [];
    for (j = 0; j < 3; j++) v[j] = Math.round((n >> (16 - 8 * j) & 255) + ((m >> (16 - 8 * j) & 255) - (n >> (16 - 8 * j) & 255)) * g);
    c[i] = (LE ? (255 << 24 | v[2] << 16 | v[1] << 8 | v[0]) : (v[0] << 24 | v[1] << 16 | v[2] << 8 | 255)) >>> 0;
  }
  return c;
}var SKY_MASK = [new Uint8Array(1 << 16), new Float32Array(1024)];var SKY_BANDS = [];        // band edges as fractions of HZ
// y fractions sit high in the sky on purpose: the stop-1 and stop-4 text blocks live in the
// upper left, and a cumulus parked behind a headline reads as a smudge on the type
var CL = [[0.38, 0.24, 6], [0.80, 0.20, 9], [0.70, 0.27, 5], [1.05, 0.14, 8], [1.55, 0.16, 8], [2.10, 0.16, 10], [2.55, 0.17, 6]];
var SKC = [      // skyline materials [body, grid]: blue glass, slate glass, black glass (TD Centre), grey precast, pale stone (FCP)
['#4e5d79', '#43506a'], ['#3d4a63', '#323d52'], ['#2c3840', '#26292d'], ['#51565c', '#464b51'], ['#9aa3a6', '#6d777b']];
var SFC = [   // shop-row bodies: red brick, buff Toronto brick, dark red brick, painted cream, grey, green, tan brick
  '#b34a3a', '#d9b48c', '#8f2f28', '#e9e1cd', '#4a555e', '#1f3f2c', '#b98761'];var PT_POPL = [   // poplar/cypress tones: PT_FRONT rotated a little warmer/yellower - an early-turning column
  // beside maples still mostly green in mid-September
  '#1c3722', '#224025', '#2d5330', '#3b6d3b', '#538d53'];
var PT_CONI = [   // conifer (spruce) needle tones: PT_FRONT rotated cooler/bluer and a touch less saturated, so a
  // needle crown reads apart from a broadleaf one by colour alone, before its silhouette is read
  '#153431', '#193c36', '#224e44', '#2d6754', '#3f8578'];
var PT_PAL2 = [null, null, 0];
var STREET_POLES = [0.22, 0.62, 1.02   // streetlight world x; a fourth stands on the corner
];var STREET_TC = [[0.05, 30], [0.12, 42]   // curve per track: [rise as a fraction of RH, lead-in in u()]
];var STREET_TO = [6.2, 4.7, 3.3, 1.8   // the same rails up the cross street, metres left of the park kerb
];var STREET_TR = [0.08, 0.105, 0.62, 0.76   // Queen St rails as fractions of the road height
];var STREET_PW = 2.5, STREET_RW = 8;var STREET_FONT = { // 3x5 capitals and digits, row by row
  A:'010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '5': '111100110001110' };var STREET_SIGNS = ['CAFE', 'BOOKS', 'VINTAGE', 'RECORDS', 'BAKERY', 'PHO', 'DELI', 'FLOWERS', 'BAR', 'OPTICAL', 'PIZZA', 'GALLERY',
                    'TAILOR', 'HARDWARE', 'SUSHI', 'DINER', 'SHOES', 'CYCLES', 'MARKET', 'NOODLES', 'BARBER', 'WINE'];var STREET_FSEQ = [   // body colour of each building west to east, hand-set: red and buff mix, a painted front now and then
  0, 1, 0, 2, 3, 6, 0, 4, 1, 2, 0, 5, 6, 1, 0, 3, 2, 0, 6, 4, 1, 0, 2, 6, 5, 0, 1, 3, 0, 2, 6, 1];var STREET_TONE = [   // brick stipple per SFC entry; painted fronts stay flat
  '#8f2f28', '#b98761', '#7e3226', 0, 0, 0, '#a27850'];
var LUMP = [ // crown masses of the big maple: [dx/W, dy/H, r/W] around the crown centre. About as wide as
            // the tree is tall, on ~3 m of clear trunk, with a fairly level underside above eye level.
            // 5, 6 and 7 (the lower flanking pair and the big central mass low over the fork) are sized
            // to overlap each other and the two flanking scaffold leaders' whole path up out of the fork,
            // so canopy() never has to paint leaves past a bare run of trunk() bark (tree-2).
            [-0.008, -0.152, 0.076], [-0.104, -0.094, 0.068], [0.090, -0.106, 0.074], [-0.164, 0.035, 0.059],
            [0.160, 0.016, 0.064], [-0.084, 0.122, 0.078], [0.080, 0.118, 0.082], [0.000, 0.028, 0.115]];
// branch: [tip dx as a fraction of W, tip dy as a fraction of H, twig dx, twig dy]. Every tip
// stays inside the crown - a branch that reaches past the leaves reads as a spear, not a tree.
var BR = [ // scaffold leaders out of the fork: [tip dx/W, tip dy/H, base width/trunk, tip width/trunk,
          // secondaries], each secondary [fraction up the leader, dx/W, dy/H, base width/trunk]. Upswept.
          [-0.075, -0.30, 0.50, 0.12, [[0.40, -0.07, -0.08, 0.20], [0.70, 0.03, -0.11, 0.14]]],
          [0.012, -0.42, 0.55, 0.12, [[0.35, -0.05, -0.12, 0.18], [0.55, 0.06, -0.10, 0.18]]],
          [0.085, -0.28, 0.46, 0.12, [[0.45, 0.075, -0.06, 0.20], [0.75, -0.02, -0.10, 0.14]]]];var LIFE_CAR = {
  sedan: { L: 4.7, top: [0, 0.60, 0.07, 0.84, 0.35, 0.94, 1.12, 0.97, 1.62, 1.37, 1.95, 1.44, 2.90, 1.44, 3.50, 1.02, 4.20, 0.90, 4.62, 0.80, 4.70, 0.58], bot: 0.20, belt: 0.97, gl: [1.40, 3.40], pil: [2.33, 2.43], wh: [0.95, 3.75], r: 0.32, tail: [0, 0.10, 0.70, 0.84], head: [4.52, 4.70, 0.64, 0.75], seam: [1.42, 2.38, 3.44] },
  van: { L: 5.9, top: [0, 0.45, 0.03, 2.38, 0.14, 2.48, 4.35, 2.48, 4.58, 2.36, 5.08, 1.34, 5.55, 1.10, 5.86, 0.95, 5.90, 0.55], bot: 0.36, belt: 1.30, gl: [4.48, 5.02], pil: [9, 9], wh: [1.05, 4.72], r: 0.35, tail: [0, 0.06, 0.60, 1.15], head: [5.70, 5.90, 0.84, 0.98], seam: [0.04, 3.30, 4.40] }
};var LIFE_FOLK = [
  { skin: 1, hair: '#26292d', hl: '#4a555e', top: ['#2c3840', '#3d4a63', '#4e5d79'], bot: ['#26292d', '#33373b', '#4a555e'], shoe: '#26292d', hem: 0.42, bag: '#4a555e' },
  { skin: 2, hair: '#33251a', hl: '#57422a', top: ['#403f2b', '#565438', '#6e6a47'], bot: ['#3d4a63', '#4e5d79', '#6d777b'], shoe: '#33251a', hem: 0.44 },
  { skin: 0, hair: '#26292d', hl: '#4a555e', top: ['#6f573c', '#8a6a3f', '#a8854f'], bot: ['#26292d', '#2c3840', '#3d4a63'], shoe: '#26292d', hem: 0.47, cap: '#2c3840' },
  { skin: 1, hair: '#4b3827', hl: '#6f573c', top: ['#565438', '#6e6a47', '#877d72'], bot: ['#3d4a63', '#4e5d79', '#6d777b'], shoe: '#51565c', hem: 0.47 },
  { skin: 0, hair: '#877d72', hl: '#9aa3a6', top: ['#26292d', '#4a555e', '#6d777b'], bot: ['#6f573c', '#8a6a3f', '#a8854f'], shoe: '#26292d', hem: 0.44 },
  { skin: 2, hair: '#26292d', hl: '#4a555e', top: ['#2c3840', '#3d4a63', '#4e5d79'], bot: ['#26292d', '#2c3840', '#3d4a63'], shoe: '#9aa3a6', hem: 0.52, band: '#7e3226' },
  { skin: 1, hair: '#33251a', hl: '#57422a', top: ['#2c3840', '#3d4a63', '#4e5d79'], bot: ['#6f573c', '#8a6a3f', '#a8854f'], shoe: '#33251a', hem: 0.46 },
  { skin: 0, hair: '#26292d', hl: '#4a555e', top: ['#6f573c', '#a8854f', '#b98761'], bot: ['#26292d', '#33373b', '#4a555e'], shoe: '#26292d', hem: 0.45, long: 1 }
];var LIFE_SKIN = [['#6f573c', '#8a6a3f', '#a8854f'], ['#8a6a3f', '#b98761', '#d9b48c'], ['#4b3827', '#6f573c', '#8a6a3f']];var TREE_SHADE = 0.30 /* strength of the crown's shade, the same as every other cast shadow */;var TREE_M = { bg: null, pp: null, mk: 0, lo: null, hi: null, sx: null, sy: null, sr: null, lt: null, ld: null
               /* scratch kept across frames: bg canopy backdrop copy, pp prop pixels, mk/lo/hi the crown's lobe
                  half-width table (size key, row offsets, widths), sx/sy/sr leaf-group centres, lt/ld leader geometry */ };var TREE_G = { cx: [], cy: [], r: [] /* crown geometry, refilled by treeGeo() every call */ };var PT_PAL = [null, null, 0];var PT_PK = new Uint8Array(4096);var PT_BUMP = new Float32Array(4096);var PT_COL = [null];var PT_LB = new Float64Array(64);var PT_HB = new Float64Array(16384);var PT_CR = [0, 0, 1, 1];var PT_S = [0, 0, 0, 0];var PT_BSH = (
  // bump profiles for leaf clusters up to 9 px wide
  (function () { var t = [], w, j, q; for (w = 1; w <= 9; w++) { t[w] = new Float32Array(w); for (j = 0; j < w; j++) { q = (j + 0.5) / w * 2 - 1; t[w][j] = Math.sqrt(1 - q * q); } } return t; })());var PT_CROWNS = (
  // broadleaf habits: [width scale, height scale, leaf masses, sky notches]. Masses run back to front, top
  // first, so each lower mass overlaps the shaded underside of the one above: [x in crown half-widths, y in
  // crown half-heights, radius in r, 1 = sometimes missing]. A notch pairs two masses whose meeting point
  // can open onto the sky. A round maple, a broad spreading oak or elm, a tall uneven vase.
  [[1.00, 1.00, [[0.00, -0.60, 0.44, 0], [-0.48, -0.34, 0.46, 1], [0.46, -0.38, 0.47, 0], [-0.06, -0.14, 0.52, 0],
                 [0.62, 0.08, 0.42, 1], [-0.56, 0.14, 0.44, 0], [0.12, 0.24, 0.48, 0]],
    [[0, 1], [0, 2], [1, 5], [2, 4]]],
   [1.20, 0.85, [[-0.30, -0.54, 0.42, 1], [0.32, -0.58, 0.40, 0], [-0.76, -0.20, 0.40, 0], [0.06, -0.26, 0.48, 0], [0.74, -0.16, 0.42, 1],
                 [-0.44, 0.14, 0.46, 0], [0.44, 0.12, 0.46, 0], [0.94, 0.26, 0.30, 1]],
    [[0, 1], [0, 2], [1, 4], [4, 7]]],
   [0.88, 1.12, [[0.14, -0.74, 0.38, 1], [-0.22, -0.52, 0.42, 0], [0.42, -0.36, 0.42, 0], [-0.44, -0.14, 0.42, 1],
                 [0.08, -0.12, 0.50, 0], [0.50, 0.12, 0.38, 1], [-0.36, 0.14, 0.40, 0]],
    [[0, 1], [0, 2], [1, 3], [2, 5]]]]);var PT_BACK = ['#213a32', '#263f37', '#2f4b41', '#3b5c4b', '#3b5c4b'];var PT_FRONT = (
  // tones, darkest to brightest: shade, body, sky-lit tops, sun rim, glint. The tree line's darkest
  // is a step above the big tree's #152e24 and the back row is lighter and bluer again: ~200 m and ~400 m
  // of morning air between them and the eye.
  ['#1a3628', '#1f3f2c', '#2a5138', '#376b45', '#4d8a62']);var PG_LEAF = (function () {   // leaf pattern for the flower drift, read down a column: 0 deep shade, 1 lit leaf, 2 mid leaf
  var a = new Uint8Array(1024), i, k;
  for (i = 0; i < 1024; i++) { k = (hash(i * 131 + 7) * 8) | 0; a[i] = k < 3 ? 0 : k === 3 ? 1 : 2; }
  return a;
})();var PG_LB = [   // Bayer value -> the first of five lawn ramp levels that covers it
  0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5];var PG_SCR = {   // per-frame scratch and per-size caches for the park ground, reused so scrolling allocates nothing
  u8: new Uint8Array(1 << 16), bg: new Uint32Array(5), bd: new Uint32Array(5), bt: new Uint32Array(5), fc: new Uint32Array(3), so: new Int16Array(64),
  el: new Int32Array(2048), er: new Int32Array(2048), pc: new Int32Array(2048), sp: new Int32Array(32), hl: new Float64Array(96), pp: new Float64Array(16),
  ck: new Uint32Array(32), cd: new Uint32Array(32), rmn: new Int32Array(2048), rmx: new Int32Array(2048), wf: 0, wf2: 0,
  kw: 0, kh: 0, ofn: 0, ofw: new Int8Array(0), brn: 0, brow: new Int32Array(0), bk: new Uint32Array(0),
  elw: new Int32Array(0), erw: new Int32Array(0), pcw: new Int32Array(0), spg: 0, spj: 0, spur: new Int16Array(0), drift: null };var PG_GATE = [   // park gate piers, near then far: [near face, far face] in metres from the eye; 0.5 m piers, a 4 m opening
  [21.5, 22.0], [26.0, 26.5]];

function mount(canvas, opts) {
  opts = opts || {};
  var present = opts.present, ctx = present ? null : canvas.getContext && canvas.getContext('2d');
  if (!present && !ctx) return stub();
  var env = opts.env || readEnv(canvas), visible = env.visible, owed = false;
  var scale = 1, W = 8, H = 8, HZ = 5, WORLD = 32, camX = 0, t = 0;
  var progress = cl01(opts.progress), off, octx, img, buf, skyRow, crowMask;
  var timer = null, ambient = false, frames = 0, clock = 0, rt = 0, dead = false, key = -1;

  // ---------- primitives ----------
  function px(x, y, c) { x = x | 0; y = y | 0; if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; }
  function hline(x0, x1, y, c) { y = y | 0; if (y < 0 || y >= H) return; x0 = x0 | 0; x1 = x1 | 0; if (x0 < 0) x0 = 0; if (x1 > W - 1) x1 = W - 1; if (x1 < x0) return; buf.fill(c, y * W + x0, y * W + x1 + 1); }
  function vline(x, y0, y1, c) { x = x | 0; if (x < 0 || x >= W) return; y0 = y0 | 0; y1 = y1 | 0; if (y0 < 0) y0 = 0; if (y1 > H - 1) y1 = H - 1; for (var y = y0; y <= y1; y++) buf[y * W + x] = c; }
  function rect(x, y, w, h, c) { for (var i = 0; i < h; i++) hline(x, x + w - 1, y + i, c); }
  function frame(x, y, w, h, c) { hline(x, x + w - 1, y, c); hline(x, x + w - 1, y + h - 1, c); vline(x, y, y + h - 1, c); vline(x + w - 1, y, y + h - 1, c); }
  function disc(cx, cy, r, c) { for (var y = -r; y <= r; y++) { var d = Math.round(Math.sqrt(r * r - y * y)); hline(cx - d, cx + d, cy + y, c); } }
  // outline wobble for blob(): smooth noise with knots a sixth of the radius apart. A jitter picked
  // per row reads as combed hair at 1:1. canopy() calls this too, so its mask matches the crown.
  function wob(s, y, r) {
    var st = Math.max(2, r * 0.16), f = (y + r) / st, k = f | 0, a = hash(s * 131 + k * 7 + 11), b = hash(s * 131 + k * 7 + 18);
    f -= k; f = f * f * (3 - 2 * f);
    return 0.86 + (a + (b - a) * f) * 0.22;
  }
  function blob(cx, cy, r, c, s) { for (var y = -r; y <= r; y++) { var d = Math.sqrt(r * r - y * y) * wob(s, y, r); hline(cx - Math.round(d), cx + Math.round(d), cy + y, c); } }
  function dline(y, a, b, k) { y = y | 0; if (y < 0 || y >= H) return; var o = y * W, by = (y & 3) * 4; for (var x = 0; x < W; x++) buf[o + x] = BAY[by + (x & 3)] < k ? b : a; }
  function dline2(x0, x1, y, a, b, k) { if (y < 0 || y >= H) return; if (x0 < 0) x0 = 0; if (x1 > W - 1) x1 = W - 1; var o = y * W, by = (y & 3) * 4; for (var x = x0; x <= x1; x++) buf[o + x] = BAY[by + (x & 3)] < k ? b : a; }
  function dot(x, y, k, c) { if (BAY[((y | 0) & 3) * 4 + ((x | 0) & 3)] < k) px(x, y, c); }
  // a run with thickness that tapers along its length: branches, tower legs, bird wings
  function limb(x0, y0, x1, y1, w0, w1, c, hi) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)), k, f, x, y, w;
    if (n < 1) n = 1;
    for (k = 0; k <= n; k++) {
      f = k / n; x = Math.round(x0 + dx * f); y = Math.round(y0 + dy * f);
      w = Math.max(1, Math.round(w0 + (w1 - w0) * f));
      vline(x, y - (w >> 1), y - (w >> 1) + w - 1, c);
      if (w > 2 && hi) px(x, y - (w >> 1), hi);
    }
  }
  // the one place alpha is allowed. It darkens what is already there, a little cooler than it is, so
  // shade on asphalt stays blue-grey and shade on grass stays green (a fixed green target turned roads teal)
  function shade(x, y, a) {
    x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x, v = buf[i], vr, vg, vb;
    if (LE) { vr = v & 255; vg = v >> 8 & 255; vb = v >> 16 & 255; } else { vr = v >> 24 & 255; vg = v >> 16 & 255; vb = v >> 8 & 255; }
    var nr = vr * (1 - a * 0.78) | 0, ng = vg * (1 - a * 0.70) | 0, nb = vb * (1 - a * 0.52) | 0;
    buf[i] = (LE ? (255 << 24 | nb << 16 | ng << 8 | nr) : (nr << 24 | ng << 16 | nb << 8 | 255)) >>> 0;
  }
  // Cast shadow of an upright box ow wide and oh tall standing on row by. The contact strip is always
  // there (skylight occlusion); the cast part is a quad from the base to the projected top, radiating
  // from the horizon point under the sun. Nothing is cast before sunrise, and a sliver too oblique to
  // read at 1:1 is skipped rather than drawn as a hairline. clip keeps a gate-post shadow off the street.
  function shadow(bx, by, ow, oh, a0, clip) {
    var x, y, k, ty, t1, t2, f, s, xl, xr, o, af;
    if (bx > W + u(400) || bx + ow < -u(400)) return;
    a0 = a0 || 0.30;
    for (x = bx; x < bx + ow; x++) { shade(x, by, a0); shade(x, by + 1, a0 * 0.66); }
    k = sunK(oh); if (!k) return;
    if (ow < u(2)) { bx -= (u(2) - ow) >> 1; ow = u(2); }
    ty = projY(by, k); t1 = projX(bx, k); t2 = projX(bx + ow, k); s = Math.max(1, ty - by);
    // fade out over the last stretch before the cast quad turns too oblique to read, like lifeCast does,
    // instead of a hard cutoff that used to switch a long shadow on or off within one camera pixel
    af = cl01(ow * s / (u(2) * Math.max(1, Math.abs(t1 - bx), Math.abs(t2 - bx - ow))) - 1);
    if (af < 0.02) return;
    a0 *= af;
    for (y = by + 2; y <= Math.min(H - 1, Math.round(ty)); y++) {
      f = (y - by) / s; xl = Math.round(bx + (t1 - bx) * f); xr = Math.round(bx + ow + (t2 - bx - ow) * f);
      if (clip) { o = Math.round(seam(y) - camX) + 1; if (xl < o) xl = o; }
      if (xl < 0) xl = 0;
      if (xr > W - 1) xr = W - 1;
      for (x = xl; x <= xr; x++) {
        if (f > 0.55 && BAY[(y & 3) * 4 + (x & 3)] > 9) continue;
        shade(x, y, a0 * (1 - 0.45 * f));
      }
    }
  }

  // ---------- world geometry ----------
  var ST, GH, KERB, RH, BASE, TREEX, U, sunX, sunY, sunE, sunA;
  function geom() {
    U = W / 480;                         // detail unit: 1 at the old buffer width, 2 at 960
    ST = 1.55 * W;                       // world x of the street/park seam at the horizon
    GH = H - HZ;                         // ground height
    KERB = HZ + Math.round(GH * 0.20);   // sidewalk ends
    RH = H - KERB;                       // road height
    BASE = HZ + Math.round(GH * 0.08);   // storefronts stand here
    TREEX = 3.70 * W;
    // Toronto, mid-September: the sun clears the horizon at t~.087, is ~11 deg up at stop 2, ~27 at
    // stop 3 and ~42 at stop 4, and drifts right as it climbs. Focal length W, so sunE is its height
    // above the horizon in px (negative while it is still below). In frame only between t ~.09 and ~.5.
    sunA = (-4 + 46 * t) * Math.PI / 180;
    sunE = Math.round(W * Math.tan(sunA)); sunY = HZ - sunE; sunX = Math.round((0.36 + 0.54 * t) * W);
  }
  function u(n) { var v = Math.round(n * U); return v < 1 ? 1 : v; }
  function seam(y) { return ST - (y - HZ) * 0.9; }           // the seam leans left as it nears us
  function sxOf(wx, p) { return Math.round(wx - camX * p); }
  function skyAt(y) { return skyRow[y < 0 ? 0 : (y >= H ? H - 1 : y | 0)]; }
  function mpx(m, y) { return m * (y - HZ) / 2.5; }         // metres -> px for something standing on ground row y
  // a point h px above the ground lands on the ground at (projX(x, k), projY(y, k)) with k = sunK(h).
  // k is 0 before sunrise: no cast shadow at all.
  function sunK(h) { if (sunE <= u(9)) return 0; var q = h / sunE; return 1 / (1 - (q < 0.8 ? q : 0.8)); }
  function projX(x, k) { return sunX + (x - sunX) * k; }
  function projY(y, k) { return HZ + (y - HZ) * k; }

  // ---------- sky ----------
  function sky() {
    // one continuous gradient: darkest at the top of the frame, lightest at the horizon, never a
    // lighter band above a darker one. Nine flat bands, their colours lerped dawn -> sunup -> morning
    // by time step (skyBands), joined by Bayer ramps wide enough (skyTd) that no seam reads as a
    // stripe. A ramp row is 4 px copied across.
    var c = skyBands(Math.round(t * 12)), td = skyTd(), yb = [], i, j, y, k, o, n, m, x, a, b, by;
    for (i = 0; i <= 9; i++) yb[i] = Math.round(BND[i] * HZ);
    for (i = 0; i < 9; i++) {
      for (y = yb[i]; y < yb[i + 1]; y++) skyRow[y] = c[i];
      for (y = i ? yb[i] - (td >> 1) + td : 0; y < (i < 8 ? yb[i + 1] - (td >> 1) : yb[9]); y++) hline(0, W - 1, y, c[i]);   // ramp rows are written below
    }
    for (y = yb[9]; y < H; y++) skyRow[y] = c[8];
    for (i = 1; i < 9; i++) {
      a = c[i - 1]; b = c[i];
      for (j = 0; j < td; j++) {
        y = yb[i] - (td >> 1) + j;
        if (y < 0 || y >= H) continue;
        k = 1 + ((j * 15 / td) | 0); o = y * W; by = (y & 3) * 4;
        for (x = 0; x < 4; x++) buf[o + x] = BAY[by + x] < k ? b : a;
        for (n = 4; n < W; n += m) { m = Math.min(n, W - n); buf.copyWithin(o + n, o, o + m); }
      }
    }
  }  function skyDot(x, y, i, j, k, c) {
    // a dither dot keyed to an object's own column i and row j, so the pattern travels with it
    if (BAY[(j & 3) * 4 + (i & 3)] < k) px(x, y, c);
  }  function skyPix(x, y) {
    // the colour sky() left at (x, y), ramp dither included: skyRow alone is flat inside the ramps
    var c = skyBands(Math.round(t * 12)), td = skyTd(), i, j;
    for (i = 1; i < 9; i++) {
      j = y - Math.round(BND[i] * HZ) + (td >> 1);
      if (j >= 0 && j < td) return BAY[(y & 3) * 4 + (x & 3)] < 1 + ((j * 15 / td) | 0) ? c[i] : c[i - 1];
    }
    return skyAt(y);
  }  function skyTd() {
    // rows in each sky ramp: u(9), but never more than the narrowest band (.08 HZ), so ramps never overlap
    return Math.max(2, Math.min(u(9), Math.round(0.08 * HZ)));
  }
  function stars() {
    // downtown Toronto is Bortle 8-9: by civil dawn only a few dozen of the brightest are left, high
    // up, and none once the top band has turned blue. Each keeps its brightness; now and then one dims.
    var q = Math.round(t * 12) / 12;
    if (q >= 0.17) return;   // matches the density formula's own zero point below, so count reaches 0 before the cutoff
    var n = Math.round(7.5 * U * (1 - q / 0.17)), fl = (clock * 10) | 0, i, x, y, b;
    var a = CR('#cfd6d8'), dim = CR('#9aa3a6'), bright = CR('#f6f4ea');
    for (i = 0; i < n; i++) {
      x = Math.round(hash(i * 13 + 1) * W); y = Math.round(hash(i * 13 + 2) * HZ * 0.30);
      if (x > 0.06 * W && x < 0.26 * W && y > 0.105 * H) continue;   // nothing flickers behind the stop-1 headline
      b = hash(i * 13 + 3);
      if (hash(i * 13 + 5 + fl * 7) > 0.96) b -= 0.3;
      px(x, y, b > 0.86 ? bright : (b > 0.45 ? a : dim));
      if (b > 0.95) { px(x - 1, y, dim); px(x + 1, y, dim); px(x, y - 1, dim); px(x, y + 1, dim); }
    }
  }
  function moon() {
    // a waning crescent up in the east before sunrise, the same 0.5 deg as the sun. Its lit limb
    // points at the sun below the horizon; the rest of the disc is earthshine, a shade lighter than
    // the sky behind it, fading to nothing as the sun comes up (earthshine can't be seen in daylight).
    // Gone in the glare a little after sunrise. Rows use radius r + .5, so the poles are short flat
    // runs rather than single-pixel spikes.
    // continuous fade instead of a hard cutoff at a time step: mf is 1 well before sunrise and eases
    // to 0 as the sun climbs u(90) px above the horizon, so the crescent dissolves over several steps.
    var mf = cl01(1 - sunE / u(90));
    if (mf <= 0) return;
    var r = u(5), cx = Math.round(0.60 * W), cy = Math.round(0.19 * HZ), x, y, d, di, a, p, R = r + 0.5, Ri = r - 0.5;
    var vx = sunX - cx, vy = sunY - cy, l = Math.sqrt(vx * vx + vy * vy) || 1, es = 0.09 * cl01(-sunE / u(20)), rim = CR('#e4e0d0'), core = CR('#f6f4ea'), c;
    vx /= l; vy /= l;
    function lit(x, y) {                                         // inside the disc and on the sunlit side of the terminator
      if (y < -r || y > r || Math.abs(x) > Math.floor(Math.sqrt(R * R - y * y))) return false;
      var a = x * vx + y * vy, p = -x * vy + y * vx;             // along / across the sun direction
      return a >= 0.65 * Math.sqrt(Math.max(0, R * R - p * p));
    }
    for (y = -r; y <= r; y++) {
      d = Math.floor(Math.sqrt(R * R - y * y));
      hline(cx - d, cx + d, cy + y, rim);
      if (y > -r && y < r) { di = Math.floor(Math.sqrt(Ri * Ri - y * y)); hline(cx - di, cx + di, cy + y, core); }
      for (x = -d; x <= d; x++) {
        // dark side, plus any lit pixel left on its own where a horn thins out, so the tips end clean
        if (!lit(x, y) || !(lit(x - 1, y) || lit(x + 1, y) || lit(x, y - 1) || lit(x, y + 1))) {
          c = skyPix(cx + x, cy + y);
          px(cx + x, cy + y, es > 0 ? skyTint(c, 246, 244, 234, es) : c);
        } else if (mf < 1) {
          // lit rim/core: cross-fade from sky toward the moon's own tone by mf, the same skyTint
          // mechanism as earthshine above, so the crescent dissolves rather than blinking out
          c = skyPix(cx + x, cy + y);
          px(cx + x, cy + y, skyTint(c, 244, 240, 234, mf));
        }
      }
    }
  }
  function sun() {
    // at (sunX, sunY) from geom(), the same 0.5 deg as the moon: orange on the horizon, yellow-white
    // by ~4 deg, white past ~12, judged on the sky's time step so the colour turns on the same frame
    // as the sky. The aureole brightens toward the disc: the sky pulled 92/80/65% of the way to the
    // sun's colour out to 1.6r, then a 45% tint on 2x2 cells keyed to the disc whose density falls
    // steadily to nothing at 2.8r, so it has no outer edge.
    var r = u(5), cx = sunX, cy = sunY, r1 = 1.15 * r * 1.15 * r, r2 = 1.35 * r * 1.35 * r, r3 = 1.6 * r, rc = Math.round(2.8 * r);
    if (cy - rc >= HZ || cy + rc < 0 || cx + rc < 0 || cx - rc >= W) return;
    var el = -4 + 46 * Math.round(t * 12) / 12, low = el < 4, mid = el < 12;
    var rim = CR(low ? '#f4ac6b' : mid ? '#fff3dc' : '#f6f4ea'), core = CR(low ? '#ffd98a' : mid ? '#fff3dc' : '#fffdf4');
    var gr = low ? 255 : mid ? 255 : 246, gg = low ? 217 : mid ? 243 : 244, gb = low ? 138 : mid ? 220 : 234;
    var y0 = Math.max(-rc, -cy), y1 = Math.min(rc, HZ - 1 - cy), x, y, d, o, i, f, sr = 16 / (1.2 * r);
    for (y = y0; y <= y1; y++) {
      o = (cy + y) * W;
      for (x = -rc; x <= rc; x++) {
        d = x * x + y * y;
        if (d <= r * r || d > rc * rc || cx + x < 0 || cx + x >= W) continue;
        if (d <= r3 * r3) f = d <= r1 ? 0.92 : d <= r2 ? 0.80 : 0.65;
        else if (BAY[(((y + 1024) >> 1) & 3) * 4 + (((x + 1024) >> 1) & 3)] < 16 - (Math.sqrt(d) - r3) * sr) f = 0.45;
        else continue;
        i = o + cx + x; buf[i] = skyTint(buf[i], gr, gg, gb, f);
      }
    }
    disc(cx, cy, r, rim); disc(cx, cy, r - 1, core);
  }

  // ---------- clouds, plane, birds (p = .15) ----------
  // flat-bottomed cumulus: for every column the silhouette is the lowest arc over it, so the
  // lumps merge into one body instead of reading as a row of circles
  function cumulus(cx, by, s, seed) {
    // fair-weather cumulus: turrets over a flat base, about 2.5:1, every billow a lit sphere. Billows
    // are painted back to front (knobs, turrets, then the body on its base), so where one sits over
    // another its rim makes the crease. The sun is ahead of us: the faces toward us sit in their own
    // shade, the flank and edges toward the sun catch the light, the base is darkest - and before
    // sunrise, with the sun below, only the undersides are lit. Tones step on a Bayer dither keyed
    // to the cloud. Lump x is kept relative to cx, so the shading is exact however far the cloud pans.
    var n = 3 + ((hash(seed * 7 + 1) * 3) | 0), i, m = 0, lx = [], ly = [], lr = [], ux = [], uy = [], ur = [], r, w;
    for (i = 0; i < n - 1; i++) {                               // turrets over the gaps, each with a knob on top
      ur[i] = s * (0.50 + hash(seed * 19 + i * 5) * 0.35);
      ux[i] = (i + 0.5 - (n - 1) / 2) * 0.80 * s + (hash(seed * 23 + i) - 0.5) * 0.30 * s;
      uy[i] = by - s * (0.55 + hash(seed * 29 + i) * 0.30);
      lx[m] = ux[i] + (hash(seed * 37 + i) - 0.5) * ur[i]; ly[m] = uy[i] - 0.65 * ur[i]; lr[m++] = ur[i] * (0.35 + hash(seed * 31 + i) * 0.20);
    }
    for (i = 0; i < n - 1; i++) { lx[m] = ux[i]; ly[m] = uy[i]; lr[m++] = ur[i]; }
    var bmin = 1e9, bmax = -1e9, top = by;
    for (i = 0; i < n; i++) {                                   // the body on its base, painted last
      r = s * (0.55 + hash(seed * 13 + i * 5) * 0.45);
      lx[m] = (i - (n - 1) / 2) * 0.80 * s + (hash(seed * 17 + i * 3) - 0.5) * 0.35 * s; ly[m] = by - Math.round(0.15 * r); lr[m] = r;
      w = Math.sqrt(r * r - (by - ly[m]) * (by - ly[m]));
      if (lx[m] - w < bmin) bmin = lx[m] - w;
      if (lx[m] + w > bmax) bmax = lx[m] + w;
      m++;
    }
    var minx = 1e9, maxx = -1e9;
    for (i = 0; i < m; i++) { minx = Math.min(minx, lx[i] - lr[i]); maxx = Math.max(maxx, lx[i] + lr[i]); top = Math.min(top, ly[i] - lr[i]); }
    if (cx + maxx < 0 || cx + minx >= W) return;
    // direction to the sun from the cloud: screen offset in radians (focal length W), and it lies beyond the cloud
    var ax = (sunX - cx) / W, ay = (sunY - by) / W, q = Math.sqrt(ax * ax + ay * ay) || 1e-3, sp = Math.min(1.5, q), sn = Math.sin(sp);
    var tq = Math.round(t * 12) / 12;                            // palettes turn on the sky's own time step
    var sx = ax / q, sy = ay / q, Lx = sx * sn, Ly = sy * sn, Lz = -Math.cos(sp), pre = tq < 0.20, morn = tq >= 0.45;
    var c0 = CR(pre ? '#4d4d86' : morn ? '#b3bec6' : '#9d93ad'), c1 = CR(pre ? '#6d5b93' : morn ? '#cfd8de' : '#d3c4c3');
    var c2 = CR(pre ? '#e08fa8' : morn ? '#eef2f4' : '#e9dccb'), c3 = CR(pre ? '#f4ac6b' : morn ? '#ffffff' : '#fff3dc');
    var amb = pre ? 0.34 : 0.50, eg = pre ? 0.25 : 0.6, CH = Math.max(1, by - top), ya, yb, yy, xx, xa, xb, dy, ir, nx, ny, nz, d, e, v, o, mo, hv, ao, und, gl;
    // painted front to back (body, turrets, knobs) into a coverage mask, so a hidden pixel is never shaded
    var mx0 = Math.max(0, cx + Math.floor(minx)), mx1 = Math.min(W - 1, cx + Math.ceil(maxx)), my0 = Math.max(0, Math.floor(top)), mw = mx1 - mx0 + 1, mh = by - my0, mask = SKY_MASK[0];
    if (mw <= 0 || mh <= 0) return;
    if (mask.length < mw * mh) mask = SKY_MASK[0] = new Uint8Array(mw * mh * 2);
    mask.fill(0, 0, mw * mh);
    if (Ly > 0) {
      // sun below the cloud: its flat base is lit from underneath. How high the glow reaches, per column
      // (fraction of the cloud's height): least under each body billow's belly, which hangs down over the
      // base, most in the gaps between bellies. Each belly is a smooth bump nudged away from the sun, so
      // the glow climbs the sun-side flank; the whole cloud glows deeper toward the sun too. A sum of
      // smooth bumps has no corners, so the glow's top edge is a row of rounded scallops, not spikes.
      gl = SKY_MASK[1];
      if (gl.length < mw) gl = SKY_MASK[1] = new Float32Array(mw * 2);
      for (xx = mx0; xx <= mx1; xx++) {
        e = 0;
        for (i = m - n; i < m; i++) { d = (xx - cx - lx[i] + 0.14 * s * sx) / (0.36 * s); e += Math.exp(-d * d); }
        e = e > 1 ? 1 : e;
        v = (xx - cx) / Math.max(1, (maxx - minx) / 2) * sx;
        gl[xx - mx0] = 0.24 * (1 - 0.62 * e) * Math.max(0.5, 1 + 0.35 * v) + 1e-3;
      }
    }
    for (i = m - 1; i >= 0; i--) {
      r = lr[i]; ir = 1 / r;
      ya = Math.max(my0, Math.ceil(ly[i] - r)); yb = Math.min(by - 1, H - 1, Math.floor(ly[i] + r));
      for (yy = ya; yy <= yb; yy++) {
        dy = yy - ly[i]; w = r * r - dy * dy;
        if (w <= 0) continue;
        w = Math.sqrt(w) * wob(seed * 7 + i, dy, r); xa = Math.max(mx0, cx + Math.ceil(lx[i] - w)); xb = Math.min(mx1, cx + Math.floor(lx[i] + w));
        ny = dy * ir; hv = (by - yy) / CH; o = yy * W; mo = (yy - my0) * mw - mx0;
        ao = Ly > 0 ? 1 : 0.70 + 0.30 * hv;                     // the underside of the mass is in its shadow
        for (xx = xa; xx <= xb; xx++) {
          if (mask[mo + xx]) continue;
          mask[mo + xx] = 1;
          nx = (xx - cx - lx[i]) * ir; nz = 1 - nx * nx - ny * ny; nz = nz > 0 ? Math.sqrt(nz) : 0;
          und = Ly > 0 ? Ly * 2.2 * Math.max(0, 1 - hv / gl[xx - mx0]) : 0;   // ...unless the sun is below the cloud
          d = (nx * Lx + ny * Ly + nz * Lz + 0.35) / 1.35;
          e = nz < 0.7 ? nx * sx + ny * sy : 0; e = e > 0 ? (1 - nz) * (1 - nz) * e * eg : 0;   // thin edges toward the sun glow
          v = (amb + 0.55 * (d > 0 ? d : 0) + e + und) * ao + (BAY[((yy - by) & 3) * 4 + ((xx - cx) & 3)] - 7.5) * 0.007;
          buf[o + xx] = v < 0.42 ? c0 : v < 0.60 ? c1 : v < 0.80 ? c2 : c3;
        }
      }
    }
    hline(cx + Math.round(bmin), cx + Math.round(bmax), by, pre ? c2 : c0);
  }
  function clouds() {
    // drifting right at 2 px/s. A cloud whose base is above every text block (y < .11H) wraps round
    // and comes back in from the left; a lower one drifts off the right edge and stays gone, so none
    // ever crosses a headline however long the page sits open.
    var i, x, y, s, dx, hi = Math.round(0.11 * H);
    for (i = 0; i < CL.length; i++) {
      y = Math.round(CL[i][1] * HZ); s = Math.max(3, u(CL[i][2]));
      dx = y < hi ? (clock * 2) % (3 * W) : Math.min(clock * 2, (1.09 - CL[i][0]) * W + 3 * s + 2);
      x = sxOf(CL[i][0] * W + dx, 0.03);
      if (x > W + u(60)) x = sxOf(CL[i][0] * W + dx - 3 * W, 0.03);
      if (x < -3 * s || x > W + 3 * s) continue;
      cumulus(x, y, s, i + 1);
    }
  }
  function plane() {
    // an airliner at cruise ~20 deg up, so seen almost side-on from below, nose left: full-length
    // fuselage and fin, wings foreshortened. Looking up, the near (port) wing rises above the body and
    // the far one drops below: steady red on the near tip, green on the far one, double white strobes
    // and a red belly beacon. 16 px/s; once across it comes back in past the right edge, never mid-sky.
    // It flies high in the frame, so the long contrail clears the CN Tower's antenna and the gulls.
    var y = Math.round(HZ * 0.075), Lp = u(5), tl = u(160), X0 = 1.1 * W, tq = Math.round(t * 12) / 12;
    var x = sxOf(X0 - (clock * 16 + X0 - 0.30 * W) % (2.6 * W), 0.02);
    if (x + Lp + tl < 0 || x > W) return;
    // contrail, lit gold and pink at dawn because the sun reaches that height first: two engine trails
    // condense a little behind the tail, merge, then spread wider and thinner until they are gone
    var warm = tq < 0.42, tr = CR(warm ? '#f0d69f' : '#f6f4ea'), tr2 = CR(warm ? '#e08fa8' : '#dfe6ea');
    var k0 = u(4), k1 = 2 * Lp, k, a, f, xx, yy, sw;
    for (k = k0; k <= tl; k++) {
      xx = x + Lp + k;
      if (xx < 0) continue;
      if (xx >= W) break;
      if (k < k1) {
        f = 16 * Math.min(1, (k - k0 + 1) / Lp);
        skyDot(xx, y, k, 0, f, tr); skyDot(xx, y + 3, k, 3, f, tr);
      } else {
        a = 1 - k / tl; sw = 1 + 2.2 * (k - k1) / (tl - k1);
        for (yy = y - 2; yy <= y + 5; yy++) {
          f = sw + 0.5 - Math.abs(yy - y - 1.5); f = f > 1 ? 1 : f;
          if (f > 0) skyDot(xx, yy, k, yy - y, 17 * a * f / Math.sqrt(sw), yy > y + 2 ? tr2 : tr);
        }
      }
    }
    var wr = Math.round(x + 0.38 * Lp), ww = Math.max(3, Math.round(0.20 * Lp));
    var hi = CR('#cfd6d8'), md = CR('#b3b8b2'), dk = CR('#6d777b');
    for (k = 1; k <= ww; k++) hline(wr + k, wr + k + Math.max(1, 3 - (k >> 1)), y + 2 + k, dk);   // far wing, below
    rect(wr - 1, y + 3, 3, 2, dk);                                                               // far engine
    hline(x + Lp - 5, x + Lp - 3, y + 3, dk);                                                    // far tailplane
    hline(x + 2, x + Lp - 4, y, hi); hline(x + 1, x + Lp - 1, y + 1, md); hline(x + 2, x + Lp - 5, y + 2, dk);
    px(x, y + 1, md);                                                                            // nose
    for (k = 1; k <= Math.max(3, Math.round(0.18 * Lp)); k++) hline(x + Lp - 6 + k, x + Lp - 2 + Math.min(1, k >> 1), y - k, md);   // fin
    for (k = 1; k <= ww + 1; k++) hline(wr + k, wr + k + Math.max(1, 4 - (k >> 1)), y - k, md);  // near wing, above
    hline(wr - 1, wr + 1, y - 1, dk);                                                            // near engine
    if (tq < 0.5) {
      px(wr + ww + 2, y - ww - 1, CR('#cf6250')); px(wr + ww + 1, y + 2 + ww, CR('#9ed24f'));
      k = ((clock * 10) | 0) % 10;
      if (k === 0 || k === 2) { px(wr + ww + 3, y - ww - 1, CR('#ffffff')); px(wr + ww + 2, y + 2 + ww, CR('#ffffff')); }
      if (k === 5 || k === 6) px(x + (Lp >> 1), y + 3, CR('#cf6250'));
    }
  }
  // A thin 1px vee 30px across reads as a scratch on the sky, not a bird. These are short,
  // thicker at the shoulder than the tip, and they sit below the headline rather than across it.
  function gull(x, y, s, fr, dir, c, tip) {
    // ring-billed gull from below: white body and wings, black tips, the wing 3 px deep at the root
    // tapering to 1, head forward. fr 0 up, 1 mid, 2 down, 3 gliding on bent 'M' wings
    var k, j, dy, th, h = s >> 1, tn = s - Math.max(2, s >> 3), cc;
    for (k = 1; k <= s; k++) {
      if (fr === 0) dy = -Math.round(0.8 * k);
      else if (fr === 1) dy = -Math.round(0.35 * k);
      else if (fr === 2) dy = k <= h ? -Math.round(0.15 * k) : Math.round((k - h) * 0.7);
      else dy = k <= h ? -Math.round(0.45 * k) : -Math.round(0.45 * h) + Math.round((k - h) * 0.35);
      th = k * 3 <= s ? 3 : k <= h + 1 ? 2 : 1; cc = k > tn ? tip : c;
      for (j = 0; j < th; j++) { px(x - k, y + dy + j, cc); px(x + k, y + dy + j, cc); }
    }
    hline(Math.min(x - 4 * dir, x + 3 * dir), Math.max(x - 4 * dir, x + 3 * dir), y + 1, c);
    hline(x - 2, x + 2, y + 2, c); px(x + 4 * dir, y, c); px(x + 5 * dir, y, c);
  }
  function birds() {
    // three gulls crossing at 60-88 px/s: ~1.2 s of 2.5 Hz flapping, then ~1.6 s of glide. They wrap
    // in screen space, so one only ever enters or leaves past an edge, and fly above every text block.
    // y 111-133 at 1271 high: well below the contrail, and even a downstroke stays above the text blocks.
    // Dark silhouettes against the dawn sky, white once it is day, turning on the sky's time step.
    var m = u(12), P = W + 2 * m, o = [0.52, 0.67, 0.29], i, x, y, s, ph, fr;
    // ink -> pale blends continuously on raw t over one grading window (t .26-.34), instead of
    // snapping on a single 12-step quantisation boundary like a hard ternary on q would.
    var bf = cl01((t - 0.26) / 0.08), c = skyTint(C('#26292d'), 223, 230, 234, bf), tip = C('#26292d');
    for (i = 0; i < 3; i++) {
      x = Math.round((((o[i] * W + clock * (60 + 14 * i) - camX * 0.15) % P) + P) % P) - m;
      y = Math.round(HZ * (0.141 + 0.014 * i));
      s = u(2.6 + 0.5 * (i & 1));
      ph = (((clock * 10) | 0) + 9 * i) % 28;
      fr = ph < 12 ? [0, 1, 2, 1][ph % 4] : 3;
      gull(x, y, s, fr, 1, c, tip);
    }
  }  function cityLayer(hz, f) {
    // one distance layer's palette, built once a frame; f is its haze fraction
    var up = sunE > u(9), sunC = cityRGB(C(t < 0.45 ? '#f4ac6b' : '#cfd6d8')), ink = [21, 26, 38], m, i, L, q = Math.round(t * 12) / 12;
    function s(h) { return cityMix(C(h), hz, f); }
    // once the sun is up, glass reflects more daylight than the room light behind it shows through.
    // Stepped with the hour like everything else, and never so far that lit floors stop reading warm.
    var day = q < 0.1 ? 0 : Math.min(0.25, (q - 0.1) * 1.1), glass = cityRGB(s('#4e5d79'));
    function e(h) { return cityMix(cityMix(CR(h), glass, day), hz, f * 0.5); }
    // the tower's face is turned away from the sun: a dark backlit silhouette until the sky brightens,
    // stepping up to daylight concrete over two hour steps, so it is never pale against the stars
    var tg = Math.max(0, Math.min(1, (q - 1 / 6) * 6));
    function tc(dawn, dayH) { return cityMix(s(dayH), cityRGB(s(dawn)), 1 - tg); }
    L = {
      mat: [], slab: s('#6d777b'), roof: s(up ? '#9aa3a6' : '#6d777b'), pent: s('#2c3840'), mast: s('#6d777b'), rim: s('#e0a94e'),
      lit: e('#e9e1cd'), lit2: e('#e0a94e'), red: e('#cf6250'), lampA: e('#ffd98a'), lampB: e('#e0a94e'),
      tmd: tc('#6d777b', '#9aa3a6'), tsh: tc('#5f676b', '#848c90'), tdk: tc('#51565c', '#6d777b'), tlt: tc('#9aa3a6', '#cfd6d8'),
      glass: s('#3d4a63'), gsh: s('#323d52'), fl: 5
    };
    for (i = 0; i < SKC.length; i++) {
      m = [s(SKC[i][0]), s(SKC[i][1])];
      // [body, grid, side toward the sun, side away, grid on each, lit edge, dark edge]
      m[2] = up ? cityMix(m[0], sunC, 0.26) : cityMix(m[0], hz, 0.12);
      m[3] = cityMix(m[0], ink, 0.22);
      m[4] = up ? cityMix(m[1], sunC, 0.22) : cityMix(m[1], hz, 0.10);
      m[5] = cityMix(m[1], ink, 0.22);
      m[6] = up ? cityMix(m[0], sunC, 0.50) : cityMix(m[0], hz, 0.22);
      m[7] = cityMix(m[0], ink, 0.38);
      L.mat.push(m);
    }
    return L;
  }  function cityBump(c, m, w) { var d = (c - m) / w; return d > -1 && d < 1 ? 1 - d * d : 0; }  function cityMix(v, to, f) {                                  // colour v pulled toward an rgb triple by f
    var c = cityRGB(v), r = Math.round(c[0] + (to[0] - c[0]) * f), g = Math.round(c[1] + (to[1] - c[1]) * f), b = Math.round(c[2] + (to[2] - c[2]) * f);
    return (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
  }  function cityRGB(v) { return LE ? [v & 255, v >> 8 & 255, v >> 16 & 255] : [v >>> 24, v >> 16 & 255, v >> 8 & 255]; }  function cityHaze() {
    // Aerial perspective: every skyline colour is the graded surface colour pulled toward the mean
    // sky colour, harder for farther layers and as the morning brightens. Lit floors and beacons are
    // raw light (CR), only dimmed by the haze in front of them.
    var y0 = Math.round(HZ * 0.18), r = 0, g = 0, b = 0, y, v, n = HZ - y0;
    for (y = y0; y < HZ; y++) {
      v = skyRow[y];
      if (LE) { r += v & 255; g += v >> 8 & 255; b += v >> 16 & 255; } else { r += v >>> 24; g += v >> 16 & 255; b += v >> 8 & 255; }
    }
    return [r / n, g / n, b / n];
  }

  // ---------- far skyline + CN Tower ----------
  function farRow(L) {
    // 4-5 km off: flat hazy blocks, the Yonge Street towers rising behind the Financial District
    var ox = Math.round(camX * 0.035), x = -0.20 * W, i = 0, bw, bh, sx, cx, top, y, k, c;
    var pl = t < 0.26 ? 0.20 : t < 0.42 ? 0.07 : 0, fl = Math.max(2, u(0.55));
    while (x < 1.45 * W) {
      bw = u(5) + Math.round(hash(i * 7 + 21) * u(14));
      cx = (x + bw / 2) / W;
      bh = Math.round((0.05 + 0.11 * Math.pow(hash(i * 7 + 22), 1.3) + 0.17 * cityBump(cx, 0.36, 0.14) * (0.5 + 0.5 * hash(i * 7 + 25))) * HZ);
      sx = Math.round(x - ox); top = HZ - bh;
      if (sx < W + 4 && sx + bw > -4) {
        c = L.mat[i & 1 ? 0 : 3][0];
        rect(sx, top, bw, bh + 1, c);
        if (hash(i * 7 + 26) < 0.3 && bw > u(8)) rect(sx + Math.round(bw * 0.3), top - Math.max(2, u(1)), Math.round(bw * 0.4), Math.max(2, u(1)), c);
        if (hash(i * 7 + 23) > 0.82) vline(sx + (bw >> 1), top - u(5), top, c);
        if (pl > 0) for (y = HZ - fl, k = 0; y > top + fl; y -= fl, k++) if (hash(i * 37 + k * 11) < pl) hline(sx + 1, sx + bw - 2, y, L.lit2);
      }
      x += bw + (hash(i * 7 + 24) < 0.5 ? 0 : u(2)); i++;
    }
  }
  function skyline() {
    // Looking east from a west-end park, ~2 km off: the Financial District stands just left of the
    // tower, South Core behind it, CityPlace condos in front and to its right, and the city steps
    // down to mid-rise away from them.
    var hz = cityHaze(), q = Math.round(t * 12) / 12;
    var LF = cityLayer(hz, 0.42 + 0.22 * q), LB = cityLayer(hz, 0.20 + 0.20 * q), LN = cityLayer(hz, 0.08 + 0.14 * q);
    LB.fl = Math.max(3, u(0.9)); LN.fl = Math.max(4, u(1.25));
    farRow(LF);
    var ox = Math.round(camX * 0.05), tx = Math.round(0.48 * W) - ox;       // same integer pan as tower(), so the condos in front never slip against it
    var pass, x, i, bw, bh, sx, cx, fd, sc, cp, env, front;
    // two passes over the same row: the buildings behind the tower, the tower, then the ones in front
    for (pass = 0; pass < 2; pass++) {
      if (pass === 1) {
        tower(LB);
        // Entertainment District condos ~1 km off stand in front of it: you never see its feet
        building(tx - u(19), u(23), Math.round(HZ * 0.23), 907, LN);
        building(tx + u(2), u(15), Math.round(HZ * 0.15), 912, LN);
      }
      x = -0.20 * W; i = 0;
      while (x < 1.50 * W) {
        cx = x / W;
        fd = cityBump(cx, 0.41, 0.10); sc = cityBump(cx, 0.50, 0.05); cp = cityBump(cx, 0.62, 0.07);
        bw = fd > 0 ? u(8) + Math.round(hash(i * 3 + 1) * u(7))
          : hash(i * 3 + 5) < 0.2 ? u(10) + Math.round(hash(i * 3 + 1) * u(9)) : u(5.5) + Math.round(hash(i * 3 + 1) * u(5));
        env = 0.09 + 0.08 * cityBump(cx, 0.50, 0.45);
        bh = Math.round(HZ * Math.max(env * (0.55 + 0.75 * Math.pow(hash(i * 3 + 2), 1.4)), 0.44 * fd * (0.72 + 0.28 * hash(i * 3 + 4)),
          0.31 * sc * (0.75 + 0.25 * hash(i * 3 + 6)), 0.44 * cp * (0.70 + 0.30 * hash(i * 3 + 7))));
        front = hash(i * 3 + 9) < (cp > 0.2 ? 0.8 : fd > 0 ? 0.2 : 0.45);
        sx = Math.round(x - ox);
        if (front && sx < tx + u(14) && sx + bw > tx - u(14)) bh = Math.min(bh, Math.round(HZ * 0.25));
        if ((front ? 1 : 0) === pass && sx < W + u(14) && sx + bw > -u(14)) building(sx, bw, bh, i, front ? LN : LB);
        x += fd > 0.3 ? Math.round(bw * (0.6 + 0.3 * hash(i * 3 + 3))) : bw + (hash(i * 3 + 3) < 0.4 ? 0 : u(2));
        i++;
      }
    }
  }
  function building(sx, bw, bh, i, L) {
    var hs = hash(i * 11 + 5), typ = hs < 0.10 ? 1 : hs < 0.20 ? 3 : hs < 0.45 ? 4 : 0;
    var glassy = hash(i * 11 + 9) >= 0.35, mh = hash(i * 11 + 7), mi = glassy ? (mh < 0.40 ? 0 : mh < 0.66 ? 1 : mh < 0.84 ? 2 : 4) : (mh < 0.55 ? 3 : 0);
    var M = L.mat[mi], stone = mi === 4, curtain = glassy && !stone;
    var top = HZ - bh, t1 = top, t2 = top, a = 0, b = 0, mt = top, k, y, fi, c, cw, pa, pb;
    if (typ === 1 && bw > u(9)) {                              // a shallow setback crown: rare in Toronto
      a = Math.round(bw * 0.18); b = Math.round(bw * 0.36);
      t1 = top - Math.round(bh * 0.08); t2 = t1 - Math.round(bh * 0.06); mt = t2;
    }
    function topAt(kk) { return !a ? top : kk >= b && kk < bw - b ? t2 : kk >= a && kk < bw - a ? t1 : top; }
    // the side face turned toward the middle of the view, as wide as a focal length of W makes it; its
    // roof edge drops toward the horizon as it recedes. It is lit only if it faces the sun's side.
    var mid = sx + bw / 2, right = mid < W / 2, dep = bw * (0.55 + 0.6 * hash(i * 11 + 3));
    var sw = Math.round(dep * Math.abs(mid - W / 2) / W), drop = bh * dep / W;
    // e: where the sun sits across the building, -1 left .. 1 right. Faces and edges fade between lit
    // and shade as it passes behind, rather than flipping on one scroll step.
    var e = (sunX - mid) / u(30); e = e < -1 ? -1 : e > 1 ? 1 : e;
    var fr = right ? (1 + e) / 2 : (1 - e) / 2;
    var sb = fr === 1 ? M[2] : fr === 0 ? M[3] : cityMix(M[3], cityRGB(M[2]), fr), sg = fr === 1 ? M[4] : fr === 0 ? M[5] : cityMix(M[5], cityRGB(M[4]), fr);
    function sideN(yy) { return drop < 0.5 ? (yy >= top ? sw : 0) : Math.max(0, Math.min(sw, Math.floor((yy - top) * (sw + 1) / drop))); }
    function sideRun(yy, nn, col) { if (nn > 0) { if (right) hline(sx + bw, sx + bw + nn - 1, yy, col); else hline(sx - nn, sx - 1, yy, col); } }
    rect(sx, top, bw, HZ - top + 1, M[0]);
    if (a) { rect(sx + a, t1, bw - 2 * a, top - t1, M[0]); rect(sx + b, t2, bw - 2 * b, t1 - t2, M[0]); }
    if (sw > 0) for (y = top; y <= HZ; y++) sideRun(y, sideN(y), sb);
    // floors: dark spandrel lines and mullions on curtain wall, light slab edges on condos, narrow
    // window strips on stone. Office crowns hide two floors of plant behind a blank screen.
    var fl = glassy ? L.fl : Math.max(3, Math.round(L.fl * 0.8)), bay = Math.max(4, Math.round(L.fl * 1.2));
    var gcol = glassy ? M[1] : L.slab, crown = glassy ? mt + fl * 2 : mt + 2;
    if (!stone) for (y = HZ - fl; y > crown; y -= fl) {
      if (y > top + 1) hline(sx, sx + bw - 1, y, gcol);
      else if (y > t1 + 1) hline(sx + a, sx + bw - a - 1, y, gcol);
      else hline(sx + b, sx + bw - b - 1, y, gcol);
      if (sw > 0) sideRun(y, sideN(y - 2), glassy ? sg : L.slab);
    }
    if (curtain) for (k = bay; k < bw - 1; k += bay) vline(sx + k, topAt(k) + fl * 2, HZ, gcol);
    if (stone) for (k = 2; k < bw - 2; k += 3) vline(sx + k, topAt(k) + fl, HZ, gcol);
    // before and around sunrise whole floors are lit (cleaners, early staff), not confetti
    var pl = t < 0.26 ? 0.30 : t < 0.42 ? 0.14 : t < 0.52 ? 0.05 : 0;
    if (pl > 0) {
      cw = curtain ? bay : Math.max(3, u(0.9));
      for (y = HZ - fl, fi = 0; y > crown + fl; y -= fl, fi++) {
        if (hash(i * 131 + fi * 7) >= pl) continue;
        c = hash(i * 7 + fi) < (glassy ? 0.75 : 0.3) ? L.lit : L.lit2;
        for (k = 1; k + cw < bw; k += cw) {
          if (topAt(k) + fl * 2 + 2 > y - fl || hash(i * 17 + fi * 29 + k) > 0.8) continue;
          rect(sx + k, y - fl + 1, cw - 1, fl - 1, c);
        }
        if (sw > 1) for (k = 1; k < fl; k++) sideRun(y - fl + k, sideN(y - fl - 2) - 1, c);
      }
    }
    // roof edges catch the sky; the silhouette edge toward the sun is lit, the other one dark
    hline(sx, sx + bw - 1, top, L.roof);
    if (a) { hline(sx + a, sx + bw - a - 1, t1, L.roof); hline(sx + b, sx + bw - b - 1, t2, L.roof); }
    for (k = 0; k < sw; k++) px(right ? sx + bw + k : sx - 1 - k, top + (drop < 0.5 ? 0 : Math.ceil(drop * (k + 1) / (sw + 1))), L.roof);
    var lx = right || !sw ? sx : sx - sw, rx = right && sw ? sx + bw + sw - 1 : sx + bw - 1, dd = Math.ceil(drop);
    var ly = right || !sw ? topAt(0) : top + dd, ry = right && sw ? top + dd : topAt(bw - 1);
    vline(lx, ly + 1, HZ, e === -1 ? M[6] : e === 1 ? M[7] : cityMix(M[7], cityRGB(M[6]), (1 - e) / 2));
    vline(rx, ry + 1, HZ, e === 1 ? M[6] : e === -1 ? M[7] : cityMix(M[7], cityRGB(M[6]), (1 + e) / 2));
    if (sunE > u(9) && t < 0.6) {
      pa = Math.round(7 * Math.min(1, 1 - e)); pb = Math.round(7 * Math.min(1, 1 + e));
      if (pa) for (y = ly + 1; y < HZ; y++) if (BAY[(y & 3) * 4 + (i & 3)] < pa) px(lx, y, L.rim);
      if (pb) for (y = ry + 1; y < HZ; y++) if (BAY[(y & 3) * 4 + ((i + 2) & 3)] < pb) px(rx, y, L.rim);
    }
    if (typ === 3) {                                           // communications mast on a plant box
      k = sx + (bw >> 1); y = u(8); pb = Math.max(2, u(0.9));
      rect(k - 2, mt - pb, 5, pb, L.pent);
      vline(k, mt - y, mt, L.mast);
      if (t < 0.4 && !(((clock * 1.5) | 0) & 1)) rect(k - 1, mt - y - 1, 2, 2, L.red);
    } else if (typ === 4) {                                    // mechanical penthouse
      pa = Math.round(bw * (0.2 + hash(i * 13) * 0.15)); pb = Math.round(bw * 0.45); y = Math.max(3, u(1.8));
      rect(sx + pa, mt - y, pb, y, L.pent); hline(sx + pa, sx + pa + pb - 1, mt - y, L.roof);
    }
  }
  function tower(L) {
    // ~2 km off it barely moves: .48W / .43W / .38W / .33W across the four stops
    var tx = Math.round(0.48 * W) - Math.round(camX * 0.05);
    if (tx < -u(60) || tx > W + u(60)) return;
    // built in metres: 553 m to the tip, main pod 334-363 m, SkyPod 442-448 m, 102 m steel mast
    var S = Math.round(HZ * 0.88) / 553, y, j, n, hw, f, ya, yb, th;
    var md = L.tmd, sh = L.tsh, dk = L.tdk, lt = L.tlt;
    var sl = tx > sunX, warm = sunE > u(9) && t < 0.60, lampOn = t < 0.42;
    // dd: the sun's side of the tower, -1 right .. 1 left, easing through 0 as it passes behind. Then the
    // whole face is in shade and both edges catch the rim (bk), so nothing mirrors on one scroll step.
    var dd = (tx - sunX) / u(30), ad, bk;
    dd = dd < -1 ? -1 : dd > 1 ? 1 : dd; ad = Math.abs(dd); bk = Math.round(16 * (1 - ad));
    function Y(m) { return HZ - Math.round(m * S); }
    // one row of a round section: the limb away from the light in shade with a dark edge, a lit edge
    // (dithered warm while the sun is low) on the other. The dither is keyed to the tower, not the screen.
    function span(yy, h, body, shd) {
      var s = Math.min(2 * h, Math.max(1, Math.round(h * (0.55 + 1.45 * (1 - ad))))), le = sl ? tx - h : tx + h, se = sl ? tx + h : tx - h;
      hline(tx - h, tx + h, yy, body);
      if (sl) hline(tx + h - s, tx + h, yy, shd); else hline(tx - h, tx - h + s, yy, shd);
      px(se, yy, BAY[(yy & 3) * 4 + ((h + 2) & 3)] < bk ? lt : dk); px(le, yy, lt);
      if (warm && BAY[(yy & 3) * 4 + (h & 3)] < 9) px(le, yy, L.rim);
      if (warm && BAY[(yy & 3) * 4 + ((h + 2) & 3)] < Math.min(9, bk)) px(se, yy, L.rim);
    }
    function band(m0, m1, r0, r1, body, shd, lamp) {
      var y0 = Y(m0), nn = Math.max(1, y0 - Y(m1)), jj, h, xx;
      for (jj = 0; jj < nn; jj++) {
        h = Math.round((r0 + (r1 - r0) * (nn > 1 ? jj / (nn - 1) : 0)) * S);
        span(y0 - jj, h, body, shd);
        if (lamp && lampOn && jj > 0 && jj < nn - 1) for (xx = 1 - h; xx < h; xx++) if (xx & 3) px(tx + xx, y0 - jj, lamp);
      }
    }
    // one continuous concave taper, solid to the ground; the only line on it is the elevator recess
    ya = Y(334);
    for (y = HZ; y > ya; y--) {
      f = (HZ - y) / (HZ - ya);
      hw = Math.max(1, Math.round((8.5 + 17 * Math.pow(1 - f, 2.2)) * S));
      span(y, hw, md, sh);
      px(tx + Math.round(2 * dd), y, dk);
    }
    band(334, 338, 12, 18, sh, dk);                             // underside, always in its own shade
    yb = Y(338); n = yb - Y(343);
    for (j = 0; j < n; j++) {                                   // the white radome doughnut
      hw = Math.round((19.5 + 1.8 * Math.sin(Math.PI * (j + 0.5) / n)) * S);
      span(yb - j, hw, j === 0 ? dk : lt, j === 0 ? dk : md);
    }
    band(343, 350, 18.5, 20.5, L.glass, L.gsh, L.lampA);        // LookOut, windows sloping out
    band(350, 352, 20, 20, md, sh);
    band(352, 357, 20, 20, L.glass, L.gsh, L.lampB);            // 360 Restaurant
    ya = Y(357); n = ya - Y(359);
    for (j = 0; j < n; j++) span(ya - j, Math.round(21 * S), j === 0 ? dk : lt, j === 0 ? dk : md);   // EdgeWalk ledge
    band(359, 363, 18, 6, md, sh);                              // roof
    band(363, 440, 4.5, 4.5, md, sh);                           // upper shaft
    band(440, 442, 5, 8.5, md, sh);
    band(442, 448, 8.5, 8.5, L.glass, L.gsh, L.lampA);          // SkyPod
    band(448, 451, 8.5, 4, md, sh);
    ya = Y(451); yb = Y(553); th = (ya - yb) / 3;               // the mast tapers in three steps
    for (y = ya; y >= yb; y--) {
      f = ya - y;
      j = BAY[(y & 3) * 4 + 2] < bk;
      if (f < th) { hline(tx - 2, tx + 2, y, md); px(sl ? tx - 2 : tx + 2, y, lt); px(sl ? tx + 2 : tx - 2, y, j ? lt : dk); }
      else if (f < 2 * th) { hline(tx - 1, tx + 1, y, md); px(sl ? tx - 1 : tx + 1, y, lt); if (j) px(sl ? tx + 1 : tx - 1, y, lt); }
      else { px(tx, y, md); px(sl ? tx - 1 : tx + 1, y, lt); if (j) px(sl ? tx + 1 : tx - 1, y, lt); }
    }
    if (t < 0.45 && !(((clock * 1.5) | 0) & 1)) rect(tx - 1, yb - 1, 3, 2, L.red);
  }  function ptFar(sx, r, i, top, shd) {
    // The far row, ~400 m off: low-branched crowns merged into one canopy band. Its outline is the union of
    // their leaf masses kept per column, and shd per column is where the shade on each crown's side away from
    // the light begins; it runs down into the understorey.
    if (sx < -2 * r || sx > W + 2 * r) return 0;
    var base = HZ + 1, m = 2 + ((hash(i * 9 + 33) * 3) | 0), sd = (hash(i * 9 + 39) * 2) | 0, k, cx, cyl, R, s, dx, x, yt, hb, my = base, d, f;
    for (k = 0; k < m; k++) {
      if (k === 0) { cx = sx; R = r; cyl = base - Math.round(r * (0.78 + hash(i * 9 + 36) * 0.14)); my = cyl + Math.round(r * 0.5); }
      else if (k < 3) { cx = sx + ((k + sd) & 1 ? -1 : 1) * Math.round(r * (0.48 + hash(i * 9 + k * 5 + 34) * 0.22)); R = Math.round(r * (0.50 + hash(i * 9 + k * 5 + 35) * 0.20)); cyl = base - Math.round(r * (0.30 + hash(i * 9 + k * 5 + 37) * 0.35)); }
      else { cx = sx + Math.round((hash(i * 9 + 38) - 0.5) * r * 0.7); R = Math.round(r * 0.52); cyl = base - Math.round(r * 1.30); }
      s = i * 7 + k; hb = Math.max(1, Math.round(R * 0.12));
      ptBumps(s, 2 * R + 1, hb, PT_BUMP, 0);
      for (dx = -R; dx <= R; dx++) {
        x = cx + dx; if (x < 0 || x >= W) continue;
        yt = cyl - Math.round(Math.sqrt(R * R - dx * dx) + PT_BUMP[dx + R] - hb * 0.5);
        if (yt < top[x]) top[x] = yt;
      }
    }
    R = Math.round(r * (0.34 + hash(i * 9 + 41) * 0.12)); hb = Math.max(1, Math.round(R * 0.3));
    f = sunE <= 0 ? 0 : Math.min(1, sunE / u(40)); d = Math.max(-1, Math.min(1, (sunX - sx) / (0.3 * W)));
    cx = sx - Math.round((0.25 + 0.3 * f) * (d < 0 ? -1 : 1) * Math.min(1, Math.abs(d) * 4) * r);
    ptBumps(i * 11 + 5, 2 * R + 1, hb, PT_BUMP, 0);
    for (dx = -R; dx <= R; dx++) {
      x = cx + dx; if (x < 0 || x >= W) continue;
      yt = my - Math.round(Math.sqrt(R * R - dx * dx) * 0.7 + PT_BUMP[dx + R] - hb * 0.5);
      if (yt < shd[x]) shd[x] = yt;
    }
    return 1;
  }  function ptTree(sx, r, i, ty, T) {
    if (sx < -r * 2.1 || sx > W + r * 2.1) return;
    var base = HZ + 1 + Math.round(hash(i * 5 + 8) * u(1.5));
    if (ty === 1) conifer(sx, base, r, i, T);
    else if (ty === 2) poplar(sx, base, r, i, T);
    else maple(sx, base, r, i, T);
  }  function ptRestore(n) { for (var k = 0; k < n; k += 2) buf[PT_HB[k]] = PT_HB[k + 1]; }  function ptSave(n, cx, cy, hr) {
    // Sky holes: before a crown is drawn, remember what is behind a few small ragged spots where the leaves
    // are thin, then put it back. What shows through is whatever really is behind: sky, towers, the back row.
    var dy, dx, d, x, y, id;
    for (dy = -hr; dy <= hr; dy++) {
      y = cy + dy; if (y < 0 || y >= H) continue;
      d = Math.round(Math.sqrt(hr * hr - dy * dy));
      for (dx = -d; dx <= d; dx++) { x = cx + dx; if (x < 0 || x >= W || n > 16380) continue; id = y * W + x; PT_HB[n++] = id; PT_HB[n++] = buf[id]; }
    }
    return n;
  }  function ptMass(x, y, R, sq, s, hb, k0, T, lite, skyw, fl) {
    // One leaf mass of a crown (PT_CR: centre and half-sizes), drawn over whatever it overlaps. Its outline wanders
    // and breaks into leaf clusters. Below a shallow boundary of hanging lit clusters it is in shade (k0: where that
    // boundary crosses its middle, in radii below the centre; it rises toward the sides). Where its top faces the sky
    // or the sun it wears a cap of the lit tones, whose depth follows the light column by column, so it grows and
    // shrinks smoothly as the tree pans instead of switching tone. fl: 1 hanging clusters, 2 lit clusters over the
    // shade (a mass whose underside the next ones cover skips both).
    x |= 0; y |= 0; R |= 0;
    var R2 = Math.max(1, Math.round(R * 0.84)), r2 = R2 * R2, rr = R * R, n = 2 * R + 1, yr = Math.floor(R2 * sq), kc = k0 * R2, c0 = T[0], c1 = T[1];
    var st = Math.max(4, R * 0.55), dy, v, ar, ws, A, yy, dx, xx, j, a, a2, b1, f, g, g0 = 0, g1 = 0, kk, kn = -1, t0, t1, tp, e, i, k, nx, ny, nz, q, lit, cs, ck, d, m, c2, c3;
    for (dy = -yr; dy <= yr; dy++) {
      v = dy / sq; ar = Math.round(Math.sqrt(Math.max(0, r2 - v * v))); yy = y + dy;
      A = R2 + (v - kc) / 0.55;                                                   // shade where the column's half-height <= A
      if (A <= 0) hline(x - ar, x + ar, yy, c1);
      else if (A >= R2) hline(x - ar, x + ar, yy, c0);
      else {
        ws = Math.round(Math.sqrt(r2 - A * A));
        if (ws >= ar) hline(x - ar, x + ar, yy, c1);
        else { hline(x - ar, x - ws - 1, yy, c0); hline(x - ws, x + ws, yy, c1); hline(x + ws + 1, x + ar, yy, c0); }
      }
    }
    ptBumps(s, n, hb, PT_BUMP, 1);                                                // one cluster profile, read at other offsets for the other edges
    var o2 = (n >> 2) + 1, j2;
    var S0 = PT_S[0], S1 = PT_S[1], S2 = PT_S[2], L = PT_S[3], ccx = PT_CR[0], ccy = PT_CR[1], irx = 0.75 / PT_CR[2], iry = 0.75 / PT_CR[3];
    var hh = hb * 0.5, h4 = hb * 0.4, h3 = hb * 0.3, t2 = T[2], t3 = T[3], t4 = T[4], x0 = x - R < 0 ? 0 : x - R, x1 = x + R > W - 1 ? W - 1 : x + R;
    var cap = lite > 0 && (L > 0 || (skyw > 0 && (ccy - y + R * 1.2) * iry + 0.25 > 0.2));   // sun down and no top facing the sky: no cap anywhere
    for (xx = x0; xx <= x1; xx++) {
      dx = xx - x; j = dx + R;
      a = Math.sqrt(rr - dx * dx); a2 = dx > -R2 && dx < R2 ? Math.sqrt(r2 - dx * dx) : 0; b1 = PT_BUMP[j];
      f = j / st; kk = f | 0; if (kk !== kn) { kn = kk; g0 = hash(s * 13 + kk); g1 = hash(s * 13 + kk + 1) - g0; }
      f -= kk; g = g0 + g1 * f * f * (3 - 2 * f);                                   // the outline wanders
      t1 = Math.round(a2 * sq); t0 = Math.round((a * (0.88 + 0.2 * g) + b1 - hh) * sq);
      tp = y - (t0 > t1 ? t0 : t1);
      if (t0 > t1) for (i = (tp < 0 ? 0 : tp) * W + xx, k = (y - t1) * W + xx; i <= k; i += W) buf[i] = c1;       // clusters on top
      j2 = j + o2 < n ? j + o2 : j + o2 - n;
      if (fl & 1) {
        e = Math.round((a * (1.06 - 0.2 * g) + PT_BUMP[j2] * 1.2 - hh) * sq);
        if (e > t1) for (i = (y + t1) * W + xx, k = (y + e < H ? y + e : H - 1) * W + xx; i <= k; i += W) buf[i] = c0;   // hanging clusters, in shade
      }
      e = fl & 2 ? Math.round(PT_BUMP[n - 1 - j] * 1.1) : 0;
      if (e > 0) {                                                                   // lit leaves over the shade
        k = y + Math.round((kc + 0.55 * (a2 - R2)) * sq); if (k < tp) k = tp;
        e += k - 1; if (e > y + t1 - 1) e = y + t1 - 1;
        for (i = k * W + xx, k = e * W + xx; i <= k; i += W) buf[i] = c1;
      }
      if (!cap) continue;
      nx = (xx - ccx) * irx + dx / R * 0.25; ny = (ccy - tp) * iry + a / R * 0.25;
      q = nx * nx + ny * ny; if (q > 1) { q = Math.sqrt(q); nx /= q; ny /= q; q = 1; }
      nz = Math.sqrt(1 - q);
      lit = L * (nx * S0 + ny * S1 + nz * S2 + 0.16 * (1 - nz));                  // + leaves glowing at the rim
      cs = lit > 0 ? (lit < 0.3 ? lit / 0.3 : 1) : 0;
      ck = ny > 0.2 ? (ny < 0.7 ? (ny - 0.2) / 0.5 : 1) * skyw : 0;
      if (cs + ck <= 0) continue;
      d = Math.sqrt(a * R) * lite; m = d * (0.22 * ck + 0.36 * cs);
      j2 = j2 + 3 < n ? j2 + 3 : j2 + 3 - n;
      c2 = Math.round(m + (PT_BUMP[j2] * 1.2 - h4) * (m < 3 ? m / 3 : 1));
      if (c2 <= 0) continue;
      if (tp + c2 > y) c2 = y - tp;
      m = d * 0.30 * cs; c3 = cs > 0 ? Math.round(m + (b1 * 0.8 - h3) * (m < 3 ? m / 3 : 1)) : 0;
      if (c3 > c2) c3 = c2;
      i = tp * W + xx;
      if (c3 > 0) { for (k = i + (c3 - 1) * W; i <= k; i += W) buf[i] = t3; if (lit > 0.34 && PT_PK[j] && c3 > 2) buf[tp * W + xx] = t4; }
      for (k = (tp + c2 - 1) * W + xx; i <= k; i += W) buf[i] = t2;
    }
  }  function ptBumps(s, n, hb, B, pk) {
    // Leaf clusters along an edge: rounded bumps 4-9 px wide and never taller than 0.6 of their width, for
    // columns 0..n-1 of a mass, into B (with pk, PT_PK marks some bump tops). Keyed to the mass's own seed and
    // columns, never the screen.
    var j = 0, bs = 0, bw, bh, bi = 0, sh, p, h;
    while (j < n) {
      h = hash(s * 5 + bi * 7); bw = 4 + ((h * 6) | 0); h = h * 6 % 1; bh = Math.min(bw * 0.6, hb * (0.5 + h * 0.7)); sh = PT_BSH[bw]; p = pk && h * 7 % 1 > 0.45;
      for (; j < n && j < bs + bw; j++) { B[j] = sh[j - bs] * bh; if (pk) PT_PK[j] = p && j - bs === bw >> 1 ? 1 : 0; }
      bs += bw; bi++;
    }
  }  function ptPal(k) {
    // the rows' five tones (0 tree line, 1 back row), graded once per time step
    if (PT_PAL[2] !== gc) { PT_PAL[2] = gc; PT_PAL[0] = PT_FRONT.map(function (h) { return C(h); }); PT_PAL[1] = PT_BACK.map(function (h) { return C(h); }); }
    return PT_PAL[k];
  }  function ptSun(sx, cy) {
    // The sun as a tree at screen (sx, cy) sees it, into PT_S: [right, up, toward the viewer (negative: it
    // is ahead of us, behind the trees), strength]. Strength is 0 until it clears the horizon, so before
    // sunrise nothing on a tree is sunlit, and it grows over the first few degrees.
    var az = Math.atan2(sunX - sx, W), el = sunA - (HZ - cy) / W, ce = Math.cos(el);
    PT_S[0] = Math.sin(az) * ce; PT_S[1] = Math.sin(el); PT_S[2] = -Math.cos(az) * ce;
    PT_S[3] = sunE <= 0 ? 0 : Math.min(1, sunE / u(40));
  }

  // ---------- tree line ----------
  function backRow() {
    // filled down to the ground, with the sky-lit or sun-lit rim on top, dark notches where crowns meet, each
    // crown's side away from the light in shade, and an uneven understorey at its foot
    var ox = Math.round(camX * 0.42), x = Math.round(0.55 * W), i = 0, r, sx, n = 0;
    var top = PT_COL[0], shd = PT_COL[1], T = ptPal(1), lim = W + u(24), base = HZ + 1, ud = u(1.3), nd = u(1.8);
    if (!top || top.length !== W) { top = PT_COL[0] = new Int32Array(W); shd = PT_COL[1] = new Int32Array(W); }
    top.fill(H); shd.fill(H);
    while (x < 3.4 * W) {
      r = u(6) + Math.round(hash(i * 9 + 31) * u(6));
      if (x < 0.64 * W) r = Math.round(r * 0.66);                          // lower at its west end, under the stop-2 park sign's rooftops
      sx = x - ox;
      if (sx - 2 * r > lim) break;
      n += ptFar(sx, r, i, top, shd);
      x += Math.round(r * (1.1 + hash(i * 9 + 32) * 0.3)) + u(1); i++;
    }
    if (!n) return;
    var L = sunE <= 0 ? 0 : Math.min(1, sunE / u(40)), se = Math.sin(sunA), ce = Math.cos(sunA), yt, yl, yr, sl, sdir, lit, th, rim, y, id, x0, x1, fl, wx;
    var c1 = -1, sp = 24, h1, h2, yd, k, g1 = 0, g2 = 0, d;
    for (x0 = 0; x0 < W; x0 = x1 + 1) {                                     // in chunks: rows below a chunk's lowest crest in one run
      x1 = Math.min(W - 1, x0 + 47); fl = -1;
      for (x = x0; x <= x1; x++) if (top[x] > fl) fl = top[x];
      if (fl <= base) for (y = Math.max(fl + 1, 0); y <= base; y++) hline(x0, x1, y, T[1]);
      for (x = x0; x <= x1; x++) {
        yt = top[x]; if (yt > base) continue;
        if (yt < 0) yt = 0;
        yl = x > 2 && top[x - 3] <= base ? top[x - 3] : yt + 3; yr = x < W - 3 && top[x + 3] <= base ? top[x + 3] : yt + 3;
        sl = (yr - yl) / 6;                                                  // outline normal (right, up) ~ (sl, 1)
        d = sunX - x; sdir = d / Math.sqrt(d * d + W * W) * ce;
        lit = L * ((sl * sdir + se) / Math.sqrt(sl * sl + 1) + 0.12);
        wx = x + ox; th = 0.08 + (hash(wx * 3 + 5) - 0.5) * 0.08;             // a ragged tone edge, keyed to the row
        rim = lit > th ? T[3] : T[2];
        id = yt * W + x; buf[id] = rim;
        for (y = yt + 1, id += W, k = Math.min(fl, base); y <= k; y++, id += W) buf[id] = y === yt + 1 && lit > th + 0.12 ? rim : T[1];
        yl = x > 3 ? top[x - 4] : H; yr = x < W - 4 ? top[x + 4] : H;          // a dark notch where two crowns meet
        if (yl <= base && yr <= base) { d = Math.min(yt - yl, yt - yr); if (d > 1) for (y = yt + 1, k = yt + Math.min(d + 1, nd), id = y * W + x; y <= k; y++, id += W) buf[id] = T[0]; }
        h1 = (wx / 24) | 0;                                                  // understorey shrubs 10-24 px across, keyed to the row's own x
        if (h1 !== c1) { c1 = h1; sp = hash(c1 * 3 + 1) < 0.45 ? 24 : 10 + ((hash(c1 * 3 + 2) * 5) | 0); g1 = 0.3 + hash(c1 * 2) * 0.9; g2 = 0.3 + hash(c1 * 2 + 1) * 0.9; }
        h1 = wx - c1 * 24; h2 = h1 < sp ? (h1 + 0.5) / sp * 2 - 1 : (h1 - sp + 0.5) / (24 - sp) * 2 - 1;
        yd = base - ud - Math.round(Math.max(0, 1 - h2 * h2) * (h1 < sp ? g1 : g2) * ud);
        if (shd[x] < yd) yd = shd[x];                                         // the shaded side of a crown, down into it
        if (yd < yt + 2) yd = yt + 2;
        for (id = yd * W + x, k = base * W + x; id <= k; id += W) buf[id] = T[0];
      }
    }
  }
  function treeline() {
    // Both rows run unbroken from their west ends (back row 0.55W, tree line 0.78W), so no tree ever pops in or
    // waits anywhere; the shops in front hide what they hide. The back row is what covers the skyline's bases,
    // and the tree line starts far enough east to keep its crowns out of the stop-2 park sign.
    backRow();
    var ox = Math.round(camX * 0.5), x = Math.round(0.78 * W), i = 0, r, sx, ht, ty, prev = 0;
    var T = ptPal(0), lim = W + u(40);
    while (x < 2.95 * W) {
      r = u(10) + Math.round(hash(i * 5 + 7) * u(7));
      ht = hash(i * 5 + 9); ty = ht < 0.18 && prev !== 1 ? 1 : ht > 0.92 ? 2 : 0; prev = ty;   // mostly broadleaf, the odd spruce, a rare poplar
      sx = x - ox;
      if (sx - 2 * r > lim) break;
      ptTree(sx, r, i, ty, T);
      x += Math.round(r * (1.55 + hash(i * 5 + 10) * 0.45)) + u(3); i++;
    }
  }
  function maple(sx, base, r, i, T) {
    // maple / oak / elm: a clear trunk under a crown of leaf masses in one of three habits (round, broad, vase),
    // jittered, thinned and mirrored per tree, two limbs into it, and sky through a notch or two at its edge
    var tpl = PT_CROWNS[(hash(i * 5 + 13) * 3) | 0], ms = tpl[2], gp = tpl[3], nl = ms.length, mir = hash(i * 5 + 15) < 0.5 ? -1 : 1;
    var sh = hash(i * 5 + 11), rx = r * (0.92 + sh * 0.20) * tpl[0], ry = r * (0.96 - sh * 0.12) * tpl[1];
    var clear = Math.round(r * (0.36 + hash(i * 5 + 12) * 0.12)), ly0 = base - clear, tw = Math.max(u(1.1), Math.round(r * 0.11)), bark = C('#33251a');
    var cx = sx + Math.round((hash(i * 5 + 14) - 0.5) * r * 0.16), cy, k, q, a, b, R, lx, ly, bot = -1e9, tp = 1e9, wx = 1, n = 0, hx, hy, hr, dx, dy, dl, Rl;
    for (k = 0; k < nl; k++) {
      q = ms[k];
      PT_LB[k * 4 + 3] = q[3] && hash(i * 61 + k) < 0.35 ? 0 : 1;
      R = PT_LB[k * 4 + 2] = Math.max(4, Math.round(r * q[2] * (0.85 + hash(i * 67 + k) * 0.3)));
      lx = PT_LB[k * 4] = Math.round(mir * (q[0] + (hash(i * 71 + k) - 0.5) * 0.28) * rx);
      ly = PT_LB[k * 4 + 1] = Math.round((q[1] + (hash(i * 73 + k) - 0.5) * 0.20) * ry);
      if (!PT_LB[k * 4 + 3]) continue;
      if (ly + R > bot) bot = ly + R;
      if (ly - R < tp) tp = ly - R;
      if (Math.abs(lx) + R > wx) wx = Math.abs(lx) + R;
    }
    cy = ly0 - bot;
    PT_CR[0] = cx; PT_CR[1] = cy + Math.round((tp + bot) / 2); PT_CR[2] = wx * 1.05; PT_CR[3] = (bot - tp) * 0.55;
    ptSun(sx, PT_CR[1]);
    for (k = 0; k < gp.length; k++) {                                            // sky through the notches
      a = gp[k][0] * 4; b = gp[k][1] * 4;
      if (hash(i * 23 + k) > 0.4 || !PT_LB[a + 3] || !PT_LB[b + 3]) continue;
      hx = cx + (PT_LB[a] + PT_LB[b]) / 2; hy = cy + (PT_LB[a + 1] + PT_LB[b + 1]) / 2;
      dx = hx - PT_CR[0]; dy = hy - PT_CR[1]; dl = Math.sqrt(dx * dx + dy * dy) || 1; dx /= dl; dy /= dl;
      Rl = (PT_LB[a + 2] + PT_LB[b + 2]) * 0.5; hr = Math.max(2, Math.round(Rl * (0.07 + hash(i * 29 + k) * 0.06)));
      hx += dx * Rl * (0.74 + hash(i * 31 + k) * 0.16); hy += dy * Rl * (0.74 + hash(i * 31 + k) * 0.16);
      n = ptSave(n, Math.round(hx), Math.round(hy), hr);
      n = ptSave(n, Math.round(hx - dx * hr * 1.4 + dy * hr * 0.6), Math.round(hy - dy * hr * 1.4 - dx * hr * 0.6), Math.max(1, hr - 1));
      n = ptSave(n, Math.round(hx + dx * hr * 1.3 - dy * hr * 0.5), Math.round(hy + dy * hr * 1.3 + dx * hr * 0.5), Math.max(1, hr - 1));
    }
    rect(sx - (tw >> 1), ly0 - Math.round(bot * 0.6), tw, Math.round(bot * 0.6) + clear + 1, bark);
    if (PT_S[3] && Math.abs(PT_S[0]) > 0.15) vline(PT_S[0] > 0 ? sx - (tw >> 1) + tw - 1 : sx - (tw >> 1), ly0 - u(3), base, C('#4b3827'));
    limb(sx, ly0, cx - Math.round(wx * 0.26), cy + Math.round(bot * 0.25), Math.max(1, tw - 2), 1, bark, 0);
    limb(sx, ly0 - u(2), cx + Math.round(wx * 0.24), cy + Math.round(bot * 0.1), Math.max(1, tw - 2), 1, bark, 0);
    for (k = 0; k < nl; k++) {
      if (!PT_LB[k * 4 + 3]) continue;
      R = PT_LB[k * 4 + 2]; q = ms[k][1];
      ptMass(cx + PT_LB[k * 4], cy + PT_LB[k * 4 + 1], R, 0.9, i * 13 + k, Math.max(1, Math.round(R * 0.13)), q < -0.3 ? 0.62 : q < 0 ? 0.36 : 0.08 + hash(i * 79 + k) * 0.1, T, q < 0.15 ? 1 : 0, 1, q < 0 ? 0 : 3);
    }
    ptRestore(n);
  }  function ptPal2(k) {
    // conifer (0) and poplar (1) get their own tree-line ramp instead of the shared PT_FRONT one they used
    // to be painted from, so a needle crown and a broadleaf one read apart by colour before shape is read:
    // PT_CONI rotated cooler/bluer (a spruce), PT_POPL a little warmer/yellower (early-turning poplar/cypress)
    if (PT_PAL2[2] !== gc) { PT_PAL2[2] = gc; PT_PAL2[0] = PT_CONI.map(function (h) { return C(h); }); PT_PAL2[1] = PT_POPL.map(function (h) { return C(h); }); }
    return PT_PAL2[k];
  }
  function ptTip(x, y, d, e, j, c) {
    // a spruce branch tip reaching past its whorl: e px out along the whorl's last row, then bending down j rows
    // and a little further out at its end
    var k, xe = x + d * (e - 1);
    hline(Math.min(x, xe), Math.max(x, xe), y, c);
    for (k = 1; k <= j; k++) { xe += d * (k < 3 ? 1 : 0); hline(k < j ? Math.min(xe, xe - d) : xe, k < j ? Math.max(xe, xe - d) : xe, y + k, c); }
  }  function ptCone(sg) {
    // how far in from its sg edge (+1 right, -1 left) a spruce's cone faces the sun, as a fraction of the half-width
    var q, lit, f = 0;
    if (!PT_S[3]) return 0;
    for (q = 1; q > -1; q -= 0.05) {
      lit = 0.94 * (sg * q * PT_S[0] + Math.sqrt(Math.max(0, 1 - q * q)) * PT_S[2]) + 0.34 * PT_S[1] + 0.10 * (1 - Math.sqrt(Math.max(0, 1 - q * q)));
      if (lit <= 0) break;
      f += 0.05;
    }
    return Math.min(0.5, f);
  }
  function conifer(sx, base, r, i, T) {
    // spruce: a narrow cone of branch whorls of uneven depth, a little lopsided. Each whorl ends in tips that
    // reach out and hang down past the whorl below; its underside is in shade from the silhouette inward, and
    // light catches broken clusters of branch tips only on the edge that faces the sun.
    T = ptPal2(0);                         // needle colour, not the shared broadleaf ramp: a spruce reads cooler/bluer
    var h = Math.round(r * 2.3), top = base - h, tw = Math.max(2, Math.round(r * 0.09)), bot = h - Math.round(h * 0.05);
    var p0 = Math.max(u(1.8), Math.round(h / (8 + hash(i * 7 + 1) * 3))), wmax = r * (0.46 + hash(i * 7 + 3) * 0.10);
    var k, y, f, tk = 0, ts = 2 - ((hash(i * 7 + 2) * p0) | 0), pk = p0, ph, a, wl, wr, el = 1, er = 1, sl = 0.5, sr = 0.5, rl, rr, lc, sf, c, j, e, dl, dr;
    ptSun(sx, top + (h >> 1));
    rr = ptCone(1); rl = ptCone(-1); lc = PT_S[3] > 0.3 ? T[3] : T[2];
    sf = Math.max(-1, Math.min(1, PT_S[0] * 2)) * PT_S[3];                         // + : the sun is to the right
    rect(sx - (tw >> 1), base - Math.round(h * 0.10), tw, Math.round(h * 0.10) + 1, C('#33251a'));
    vline(sx, top - u(1.5), top + 2, T[1]);                                          // leader
    for (k = 2; k <= bot; k++) {
      while (k - ts >= pk) {                                                        // next whorl
        ts += pk; tk++; pk = Math.max(3, Math.round(p0 * (0.75 + hash(i * 7 + tk * 3) * 0.5)));
        el = 0.84 + hash(i * 31 + tk * 7) * 0.32; er = 0.84 + hash(i * 41 + tk * 7) * 0.32;
        sl = (0.15 + hash(i * 43 + tk * 5) * 0.35) * (1 + 0.6 * sf); sr = (0.15 + hash(i * 47 + tk * 5) * 0.35) * (1 - 0.6 * sf);
      }
      f = k / h; ph = (k - ts) / pk;
      a = wmax * Math.pow(f, 0.9) * (0.55 + 0.45 * Math.pow(ph, 1.5));
      wl = Math.round(a * el); wr = Math.round(a * er);
      y = top + k;
      hline(sx - wl, sx + wr, y, T[1]);
      dl = dr = 0;
      if (ph > 0.6 && a > 2) {                                                      // shade under the skirt, in from its edge
        e = (ph - 0.6) / 0.4;
        dl = Math.min(wl, Math.round(wl * sl * e)); dr = Math.min(wr, Math.round(wr * sr * e));
        if (dl > 0) { hline(sx - wl, sx - wl + dl - 1, y, T[0]); if (dl > 2 && hash(i * 83 + k) > 0.5) px(sx - wl + dl, y, T[0]); }
        if (dr > 0) { hline(sx + wr - dr + 1, sx + wr, y, T[0]); if (dr > 2 && hash(i * 89 + k) > 0.5) px(sx + wr - dr, y, T[0]); }
      }
      if (ph < 0.6 && a > 2) {                                                      // light on broken clusters of branch tips
        c = tk * 7 + ((k - ts) >> 1); j = 2 + (hash(i * 57 + c) > 0.5 ? 1 : 0);
        if (rl * wl >= 1 && hash(i * 53 + c) > 0.35) hline(sx - wl, sx - wl + Math.min(j, wl) - 1, y, lc);
        if (rr * wr >= 1 && hash(i * 59 + c) > 0.35) hline(sx + wr - Math.min(j, wr) + 1, sx + wr, y, lc);
      }
      if ((k - ts === pk - 1 || k === bot) && a > 3) {                              // drooping tips, their own reach each side
        ptTip(sx - wl, y, -1, 2 + ((hash(i * 61 + tk) * 3) | 0), 1 + ((hash(i * 67 + tk) * 3) | 0), T[1]);
        ptTip(sx + wr, y, 1, 2 + ((hash(i * 71 + tk) * 3) | 0), 1 + ((hash(i * 73 + tk) * 3) | 0), T[1]);
      }
    }
  }
  // A smooth symmetrical spindle split light-half/dark-half reads as one giant leaf. This one
  // has a roughened outline and clumped tone, so it reads as a column of foliage.
  function poplar(sx, base, r, i, T) {
    // Lombardy poplar: a tall narrow column, widest a third of the way up and tapering to a point, whose edges
    // break into small leaf clumps at uneven heights, set independently on each side, over a continuous core
    T = ptPal2(1);                         // its own colour, not the shared ramp: reads a little warmer/yellower
    var h = Math.round(r * 2.6), w = Math.max(u(1.5), Math.round(r * 0.40)), th0 = Math.round(h * 0.07), tw = Math.max(2, Math.round(r * 0.10));
    var ch = h - th0, y0 = base - th0, k, f, hw, sd, yy, Rl, j, s, nc = Math.round(ch / 14);
    PT_CR[0] = sx; PT_CR[1] = y0 - (ch >> 1); PT_CR[2] = w * 0.9; PT_CR[3] = ch * 0.5;
    ptSun(sx, PT_CR[1]);
    rect(sx - (tw >> 1), y0 - (ch >> 3), tw, th0 + (ch >> 3) + 1, C('#33251a'));
    for (k = 0; k <= ch; k++) { hw = Math.round(w * 0.74 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.88 * k / ch))); hline(sx - hw, sx + hw, y0 - k, T[1]); }
    for (j = 0; j < nc; j++) {                                                    // clumps inside the column
      f = 0.06 + hash(i * 43 + j) * 0.84; hw = w * 0.74 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.88 * f));
      Rl = Math.max(2, Math.round(hw * (0.30 + hash(i * 47 + j) * 0.15)));
      ptMass(sx + Math.round((hash(i * 49 + j) - 0.5) * hw * 0.8), y0 - Math.round(f * ch), Rl, 0.85, i * 51 + j, Math.max(1, Math.round(Rl * 0.3)), 0.2, T, hash(i * 53 + j) < 0.3 ? 0.8 : 0, 0.5, 3);
    }
    for (sd = -1; sd <= 1; sd += 2) {                                               // edge clumps, top down, each side on its own rhythm
      for (yy = y0 - Math.round(ch * 0.95) + ((hash(i * 31 + sd + 2) * 4) | 0), j = 0; yy < y0; j++) {
        s = i * 37 + j * 2 + (sd + 1) / 2; f = (y0 - yy) / ch;
        hw = w * 0.74 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.88 * f));
        Rl = Math.max(2, Math.round(hw * (0.25 + hash(s * 3 + 1) * 0.20)));
        ptMass(sx + sd * Math.round(hw * (0.55 + hash(s * 3 + 2) * 0.30)), yy, Rl, 0.85, s * 5, Math.max(1, Math.round(Rl * 0.3)), 0.22, T, hash(s * 3 + 4) < 0.3 ? 1 : 0, 0.5, 3);
        yy += Math.max(3, Math.round(Rl * (0.8 + hash(s * 3 + 5) * 0.9)));
      }
    }
  }

  // ---------- ground ----------
  function grass() {
    // one hue, darker with distance. Tone edges wander along knots set in world x, so they belong to the
    // ground and pan with it; the wander and the dithered ramp across each edge grow toward the viewer.
    var BG = ['#2a5138', '#376b45', '#488448', '#5a9e4c', '#649b48'], edges = [0.10, 0.25, 0.45, 0.70, 1];
    var BLd = ['#1f3f2c', '#2a5138', '#376b45', '#488448', '#488448'], BLt = ['#2a5138', '#428049', '#5a9e4c', '#6db24f', '#74ae3a'];
    var lit = sunE > u(9), bg = PG_SCR.bg, bd = PG_SCR.bd, bt = PG_SCR.bt, y, i, j, bi;
    pgBuild();                                    // pgSpurFix corrects the spur's width right after pgBuild lays it out
    for (i = 0; i < 5; i++) { bg[i] = C(BG[i]); bd[i] = C(BLd[i]); bt[i] = lit ? C(BLt[i]) : bd[i]; }   // no sunlit tips before sunrise
    // street() paints everything left of the seam straight after this, so the lawn stops 2 px short of it
    if (Math.round(seam(H - 1) - camX) - 2 >= W) return;
    for (y = HZ, bi = 0; y < H; y++) {                         // fill on the same rounded rows the edges use
      while (bi < 4 && y >= HZ + Math.round(edges[bi] * GH)) bi++;
      hline(Math.round(seam(y) - camX) - 2, W - 1, y, bg[bi]);
    }
    for (i = 0; i < 4; i++) pgEdge(i, HZ + Math.round(edges[i] * GH), u(0.6) + Math.round(edges[i] * u(2.6)), Math.max(1, Math.round(0.10 * (edges[i + 1] - edges[i]) * GH)));
    PG_SCR.wf = C('#e9e1cd'); PG_SCR.wf2 = C('#f2d24a');
    for (j = 0; j < PG_SCR.brn; j += 4) pgBlades(j);
  }
  function street() {
    // Queen St: far sidewalk, a kerb with a lit top, a shaded 15 cm face and a gutter, then asphalt. It ends in a
    // T at a cross street running into depth beside the park wall; widths there are metres through mpx, so it
    // narrows to the seam's horizon point, the kerb turns the corner, and a sidewalk runs along the wall.
    var y, sx, xk, xb, c, kf = Math.max(4, u(2.4)); // matches streetXb's return radius, so the corner band it draws covers the whole narrowing return
    var asp = C('#2c3840'), walk = C('#9aa3a6'), walk2 = C('#b3b8b2'), lip = C('#b3b8b2'), face = C('#6d777b'), gut = C('#1d252b');
    for (y = HZ; y < H; y++) {
      sx = Math.round(seam(y) - camX);
      if (sx <= 0) continue;
      xk = Math.round(streetX(y, 0)); xb = streetXb(y);
      if (y < KERB - 1) {
        hline(0, xb - 1, y, y === HZ ? face : walk);
        if (y > HZ) {
          if ((y - HZ) % 3 === 1) streetDots(0, xb - 2, y, walk2, 4);
          px(xb - 1, y, lip); px(xb, y, face); px(xb + 1, y, gut);
        }
        hline(xb + 2, xk - 1, y, asp);
      } else if (y <= KERB + kf) {
        c = y === KERB - 1 ? lip : y === KERB + kf ? gut : face;
        hline(0, xb - 1, y, c);
        hline(xb, xk - 1, y, asp);
      } else hline(0, xk - 1, y, asp);
      if (xk < sx) {
        hline(xk, sx - 1, y, y === HZ ? face : walk);
        if (y > HZ + 1) { px(xk, y, lip); px(xk - 1, y, gut); }
      }
    }
    paving();
    rails();
  }
  function streetX(y, m) { return seam(y) - camX - mpx(STREET_PW + m, y); }
  function streetPoleWX() { return 0.70 * W - mpx(29.5, KERB + Math.round(0.09 * RH)); /* world x of the TTC stop, 1.5 m ahead of the streetcar's cab nose, so the car's front doors line up with it. Shared by streetStop() and streetShadows(). */ }
  function streetXb(y) {
    var cr = Math.max(4, u(2.4)), f;
    // the kerb return: a quarter-ellipse bulge on the approach, then the same curve narrowing back to the
    // base width as the corner turns away, instead of pinning flat past the corner in a hard vertical cut
    if (Math.abs(y - KERB) > cr) return Math.round(streetX(y, STREET_RW));
    f = 1 - Math.abs(y - KERB) / cr;
    return Math.round(streetX(KERB, STREET_RW) - u(9) * (1 - Math.sqrt(1 - f * f)));
  }
  function streetDots(x0, x1, y, c, k) {
    if (y < 0 || y >= H) return;
    if (x0 < 0) x0 = 0;
    if (x1 > W - 1) x1 = W - 1;
    var o = y * W, by = (y & 3) * 4, x;
    for (x = x0; x <= x1; x++) if (BAY[by + ((x + camX) & 3)] < k) buf[o + x] = c;
  }
  function streetPath(yr, o, c) {
    // the lead-in is mpx'd at the rail's own row instead of read from STREET_TC in u(), so the straight run
    // before the curve scales with the streetcar's body length (also mpx'd) at every aspect ratio - a
    // tall/narrow canvas never lets the fixed 28 m body overhang onto track that has already started curving.
    // STREET_TC's u()-tuned lead-ins (30, 42) become these metres at the 2560-wide reference; c[0] (the rise,
    // always < 0.1 for the far pair TC[0] and > 0.1 for the near pair TC[1]) tells the two apart.
    var ye = yr - Math.round(c[0] * RH), xc = streetX(yr, o), leadM = c[0] < 0.1 ? 3.0 : 1.54;
    return { yr: yr, ye: ye, xc: xc, xs: xc - mpx(leadM, yr), xe: streetX(ye, o), lean: 0.9 + (STREET_PW + o) / 2.5, S: ST - camX };
  }
  function streetPathY(P, x) {
    if (x <= P.xs) return P.yr;
    if (x >= P.xe) return HZ + (P.S - x) / P.lean;
    var a = P.xs - 2 * P.xc + P.xe, b = 2 * (P.xc - P.xs), c = P.xs - x, s = -2 * c / (b + Math.sqrt(Math.max(0, b * b - 4 * a * c)));
    return P.yr + s * s * (P.ye - P.yr);
  }

  function paving() {
    // slab joints in grey: cross joints recede with the seam's lean, long joints run with the kerb, and the
    // park-side sidewalk gets joints every 1.5 m that close up as it recedes
    var step = Math.max(5, u(11)), y, x, lim, ln, i, sx, xk, z, yy, prev;
    var i0 = Math.floor(camX / step), i1 = Math.ceil((camX + W + 0.9 * (KERB - HZ)) / step), joint = C('#7f8a8f');
    for (y = HZ + 1; y < KERB - 1; y++) {
      lim = streetXb(y) - 1;
      if (lim <= 0) continue;
      ln = Math.round((y - HZ) * 0.9);
      for (i = i0; i <= i1; i++) { x = i * step - camX - ln; if (x >= 0 && x < lim && x < W) buf[y * W + x] = joint; }
    }
    for (y = HZ + Math.max(2, u(5)); y < KERB - 1; y += Math.max(3, u(7))) { lim = streetXb(y) - 2; if (lim > 0) hline(0, lim, y, joint); }
    for (z = W * 2.5 / (H - 1 - HZ), prev = H + 9; ; z += 1.5) {
      yy = Math.round(HZ + W * 2.5 / z);
      if (prev - yy < 3) break;
      prev = yy; sx = Math.round(seam(yy) - camX); xk = Math.round(streetX(yy, 0));
      if (sx > 0 && xk < W) hline(xk + 1, sx - 1, yy, joint);
    }
  }

  function rails() {
    // aggregate specks keyed to world cells; markings; then embedded track: a concrete slab poured round the
    // rails, 2px railheads, and the flangeway groove on the gauge side. No sleepers: TTC track sits in the road.
    var kf = u(1), x, y0, y1, g, P0, P1, xa, x1, i, i0, i1, gs, gy, xk, pair, js, j, yy, lim;
    var agg = C('#3d4a63'), agg2 = C('#26292d'), slab = C('#333f48'), tar = C('#1d252b'), head = C('#9aa3a6');
    gs = u(5); i0 = Math.floor(camX / gs); i1 = Math.ceil((camX + W) / gs);
    for (gy = KERB + kf + 2; gy < H; gy += Math.max(2, u(1.2))) {
      xk = Math.round(streetX(gy, 0)) - 2;
      for (i = i0; i <= i1; i++) {
        x = Math.round(i * gs + hash(i * 17 + gy * 5) * gs * 0.9 - camX);
        if (x >= 0 && x < xk && x < W) buf[gy * W + x] = hash(i * 5 + gy) < 0.5 ? agg : agg2;
      }
    }
    streetMarkings();
    for (pair = 0; pair < 2; pair++) {
      P0 = streetPath(KERB + Math.round(STREET_TR[pair * 2] * RH), STREET_TO[pair * 2], STREET_TC[pair]);
      P1 = streetPath(KERB + Math.round(STREET_TR[pair * 2 + 1] * RH), STREET_TO[pair * 2 + 1], STREET_TC[pair]);
      x1 = Math.min(W - 1, Math.floor(P0.S) - 2);
      xa = Math.min(x1, Math.floor(Math.min(P0.xs, P1.xs)));
      g = 2 + Math.round((P1.yr - P0.yr) * 0.10);
      // sealed joints where the track bed meets the asphalt - clipped to the seam, like every rail/tie pixel
      // below, so the far-lane track never shows through the park railing once it passes behind the corner pier
      if (xa >= 0) {
        lim = Math.min(xa, streetSeamLim(P0.yr - g)); if (lim >= 0) hline(0, lim, P0.yr - g, tar);
        lim = Math.min(xa, streetSeamLim(P1.yr + g)); if (lim >= 0) hline(0, lim, P1.yr + g, tar);
      }
      for (x = Math.max(0, xa + 1); x <= x1; x++) {
        y0 = Math.round(streetPathY(P0, x)); y1 = Math.round(streetPathY(P1, x));
        if (y0 <= HZ + 4) break;
        g = 2 + Math.round((y1 - y0) * 0.10);
        if (x <= streetSeamLim(y0 - g)) px(x, y0 - g, tar);
        if (x <= streetSeamLim(y1 + g)) px(x, y1 + g, tar);
      }
      streetRail(P0, 1, x1, head, tar);
      streetRail(P1, 0, x1, head, tar);
    }
  }
  function streetSeamLim(y) {
    return Math.round(seam(y) - camX) - 1;   // the park wall's seam: the hard edge for every rail/tie pixel
  }
  function streetRail(P, up, x1, head, groove) {
    // up: the rail of its pair nearer the horizon, so its groove lies below it
    var x, y, d, lim, xa = Math.min(x1, Math.floor(P.xs));
    if (xa >= 0) {
      lim = Math.min(xa, streetSeamLim(P.yr));
      if (lim >= 0) {
        if (up) { hline(0, lim, P.yr - 1, head); hline(0, lim, P.yr, head); hline(0, lim, P.yr + 1, groove); }
        else { hline(0, lim, P.yr - 1, groove); hline(0, lim, P.yr, head); hline(0, lim, P.yr + 1, head); }
      }
    }
    for (x = Math.max(0, xa + 1); x <= x1; x++) {
      y = Math.round(streetPathY(P, x)); d = y - HZ;
      if (d <= 2) break;
      if (x > streetSeamLim(y)) continue;
      px(x, y, head);
      if (d > u(6)) { px(x, up ? y - 1 : y + 1, head); px(x, up ? y + 1 : y - 1, groove); }
    }
  }
  function streetMarkings() {
    // a worn double yellow centre line between the tracks and a dashed white line (3 m on, 6 m off) by the near
    // kerb, both stopping short of the cross street; a zebra crossing over the cross street on the far side;
    // iron manhole covers set in the asphalt
    var yel = C('#e0a94e'), wht = C('#cfd6d8'), asp = C('#2c3840'), y, x, k, j, lim, per, dash, o, a, b, f, hw, cy;
    for (k = 0; k < 2; k++) for (y = KERB + Math.round(0.36 * RH) + k * 4; y < KERB + Math.round(0.36 * RH) + k * 4 + 2; y++) {
      lim = Math.round(streetX(y, STREET_RW)) - u(4);
      hline(0, lim, y, yel); streetDots(0, lim, y, asp, 2);
    }
    y = KERB + Math.round(0.90 * RH); per = Math.round(mpx(9, y)); dash = Math.round(mpx(3, y)); lim = Math.round(streetX(y, STREET_RW)) - u(4);
    for (j = Math.floor(camX / per); j * per - camX < Math.min(W, lim); j++) {
      x = j * per - camX;
      for (k = 0; k < 3; k++) { hline(x, Math.min(x + dash, lim), y + k, wht); streetDots(x, Math.min(x + dash, lim), y + k, asp, 2); }
    }
    for (y = KERB - Math.round(0.45 * (KERB - BASE)); y < KERB - Math.max(4, u(2.4)) - 2; y++) {
      for (o = 0.5; o + 0.5 < STREET_RW - 0.3; o += 1.0) hline(Math.round(streetX(y, o + 0.5)), Math.round(streetX(y, o)) - 1, y, wht);
    }
    var MH = [[0.36, 0.30], [0.93, 0.50], [-0.05, 0.86], [1.12, 0.20], [0.66, 0.84]], iron = C('#26292d'), rim = C('#1d252b'), rib = C('#4a555e');
    for (k = 0; k < MH.length; k++) {
      cy = KERB + Math.round(MH[k][1] * RH); x = Math.round(MH[k][0] * W - camX);
      a = mpx(0.36, cy); b = Math.max(1.5, (cy - HZ) * (cy - HZ) / (W * 2.5) * 0.36);
      if (x + a < 0 || x - a > W || x + a > streetX(cy, STREET_RW) - u(4)) continue;
      for (j = -Math.ceil(b); j <= Math.ceil(b); j++) {
        f = j / b; if (f * f > 1) continue;
        hw = Math.round(a * Math.sqrt(1 - f * f));
        hline(x - hw, x + hw, cy + j, rim);
        if (hw > 3 && Math.abs(j) < b - 0.6) { hline(x - hw + 2, x + hw - 2, cy + j, iron); if ((j & 1) === 0) streetDots(x - hw + 3, x + hw - 3, cy + j, rib, 6); }
      }
    }
  }


  // ---------- shadows ----------
  function streetShadows() {
    // the street lies in the shop row's shade until t~.42: contact shade only, under the shop fronts, the poles, the
    // stop post and the streetcar. After that each streetlight casts toward us from the horizon point under the sun.
    var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), i, sx, x, w, x0, x1, yb, k, L, xr;
    x0 = Math.max(0, Math.round(-0.20 * W - camX)); x1 = Math.min(W - 1, Math.round(seam(BASE) - mpx(STREET_PW + STREET_RW + 2.5, BASE) - camX));
    for (x = x0; x <= x1; x++) { shade(x, BASE, 0.30); shade(x, BASE + 1, 0.14); }
    for (i = 0; i < 4; i++) {
      sx = Math.round(streetPoleX(i) - camX); w = Math.max(3, Math.round(0.3 * m));
      if (sx < -u(80) || sx > W + u(80)) continue;
      if (t >= 0.42) shadow(sx - (w >> 1), y, w, Math.round(8.5 * m), 0.30);
      else for (x = sx - w; x <= sx + w; x++) { shade(x, y + 1, 0.35); shade(x, y + 2, 0.16); }
    }
    sx = sxOf(streetPoleWX(), 1); k = HZ + Math.round(GH * 0.185);
    for (x = sx - 3; x <= sx + 3; x++) shade(x, k + 1, 0.3);
    if (progress <= 0.24) {
      L = Math.round(28 * mpx(1, KERB + Math.round(0.09 * RH))); xr = sxOf(0.70 * W, 1); yb = KERB + Math.round(STREET_TR[1] * RH);
      for (k = 2; k <= 4; k++) for (x = Math.max(0, xr - L + u(2)); x <= Math.min(W - 1, xr - u(1)); x++) shade(x, yb + k, 0.62 - 0.14 * k);
    }
  }

  function parkShadows() {
    var y = HZ + Math.round(GH * 0.66), w = Math.round(0.09 * W), x = sxOf(2.31 * W - w, 1);
    pgWallShadow();                                            // the wall and its gate piers, as one shadow
    pgFlowerShade();                                           // contact shade under the flower bed
    if (x > W + u(120) || x + w < -u(160)) return;
    pgPad(sxOf(2.17 * W, 1) - Math.round(mpx(0.35, y)), y);   // the concrete pad under the bench and bin
    pgBenchShadow(x, y, w);
    pgBinShadow(sxOf(2.17 * W, 1), y);
  }  function treeShadeAt(x, y) {                  // is ground point (x, y) inside the crown's shade?
    if (sunE <= u(9) || y <= HZ) return false;
    var g = treeGeo(), kk = (y - HZ) / (g.by - HZ), hy = sunE * (1 - 1 / kk), ca = Math.cos(sunA), i, h;
    for (i = 0; i < LUMP.length; i++) {
      h = treeShadeHalf(g, i, y, kk, hy, ca);
      if (h > 0 && Math.abs(x - (sunX + (g.cx[i] - sunX) * kk)) < h - u(2)) return true;
    }
    return false;
  }  function treeShadeHalf(g, i, y, kk, hy, ca) {
    // Each crown mass is a ball; its shade on the ground is the ball's shadow, an ellipse r across and
    // r/sin(e) along the sun, cast toward the viewer from the horizon point under the sun. Row y of the
    // ground receives the shadow of height hy = sunE*(1 - 1/k), k = (y-HZ)/(by-HZ) - the inverse of sunK.
    var dd = (hy - g.h[i]) * ca / g.r[i];
    if (dd <= -1 || dd >= 1) return -1;
    return g.r[i] * Math.sqrt(1 - dd * dd) * kk * (0.93 + 0.07 * Math.sin(y / u(3) + i * 1.7));
  }  function treeLobeW(i, r, dy) {
    // half-width of crown mass i at dy from its centre: a circle with a slow two-sine wobble, -1 outside
    if (dy < -r || dy > r) return -1;
    return Math.sqrt(r * r - dy * dy) * (0.93 + 0.05 * Math.sin(dy / u(5) + 1.7 * i) + 0.035 * Math.sin(dy / u(2.2) + 4.1 * i));
  }  function treeGeo() {
    // crown geometry in screen px, shared by the crown, its shade, the scaffold and the falling leaves
    var g = TREE_G, i, L;
    g.tx = sxOf(TREEX, 1); g.tw = Math.max(6, u(13)); g.x = g.tx + Math.round(0.013 * W);
    g.cy0 = HZ - Math.round(H * 0.30); g.by = HZ + Math.round(GH * 0.58); g.fy = HZ - Math.round(H * 0.02);
    for (i = 0; i < LUMP.length; i++) { L = LUMP[i]; g.cx[i] = g.x + Math.round(L[0] * W); g.cy[i] = g.cy0 + Math.round(L[1] * H); g.r[i] = Math.max(5, Math.round(L[2] * W)); }
    // the height each mass casts its shade from, a little above or below its centre, so the far edge of
    // the shade scallops instead of running level
    if (!g.h) g.h = [];
    for (i = 0; i < LUMP.length; i++) g.h[i] = g.by - g.cy[i] + Math.round((hash(i * 37 + 5) - 0.5) * 0.6 * g.r[i]);
    return g;
  }  function pgShadeSpan(r, x0, x1) {
    // darken one span of a ground row by 0.30, once per colour: a run of one colour reuses the result, and a small
    // colour cache kept across frames saves most shade() calls, since the lawn has only a handful of tones
    var CK = PG_SCR.ck, CD = PG_SCR.cd, o = r * W, x, v, pv = -1, nv = 0, hh;
    if (r < 0 || r >= H) return;
    if (x0 < 0) x0 = 0;
    if (x1 > W - 1) x1 = W - 1;
    for (x = x0; x <= x1; x++) {
      v = buf[o + x];
      if (v !== pv) { pv = v; hh = (v ^ (v >>> 13)) & 31; if (CK[hh] !== v) { shade(x, r, 0.30); CK[hh] = v; CD[hh] = buf[o + x]; } nv = CD[hh]; }
      buf[o + x] = nv;
    }
  }  function pgBinShadow(x, by) {
    // the bin's footprint ellipse, swept to the shadow of its rim when the sun is up; sampled every 1.5 px of the
    // sweep, so the sides run straight the way a drum's shadow does
    var dy = by - HZ, w = Math.max(6, Math.round(mpx(0.60, by))), h = Math.max(8, Math.round(mpx(0.92, by))), rw = w / 2, cx = x + rw;
    var eb = Math.max(1, 0.3 * dy * dy / (2.5 * W)), cy = by - eb, k = sunK(h), tx = k ? projX(cx, k) : cx, ty = k ? projY(cy, k) : cy, sc = k || 1;
    var yy, i, s, c, d, a, bb, lo, hi, N = Math.min(64, Math.max(8, Math.ceil(Math.max(Math.abs(tx - cx), Math.abs(ty - cy)) / 1.5)));
    for (yy = Math.floor(cy - eb); yy <= Math.ceil(ty + eb * sc); yy++) {
      lo = 1e9; hi = -1e9;
      for (i = 0; i <= N; i++) {
        s = i / N; c = cx + (tx - cx) * s; d = cy + (ty - cy) * s; a = eb * (1 + (sc - 1) * s); bb = rw * (1 + (sc - 1) * s);
        if (Math.abs(yy - d) >= a) continue;
        a = bb * Math.sqrt(1 - (yy - d) * (yy - d) / (a * a));
        if (c - a < lo) lo = c - a;
        if (c + a > hi) hi = c + a;
      }
      if (hi < lo) continue;
      if (k) pgShadeSpan(yy, Math.round(lo), Math.round(hi));
      else for (i = Math.round(lo); i <= Math.round(hi); i++) shade(i, yy, 0.20);
    }
  }  function pgBenchShadow(x, y, w) {
    // The bench's cast shadow, projected part by part from the same geometry bench() draws: the seat
    // plate, three back slats, legs, uprights and armrests, plus skylight shut out under the seat.
    // Parts are gathered in a mask first so overlapping parts never darken twice.
    var dy = y - HZ, yb = y - Math.round(0.5 * dy * dy / (2.5 * W)), dyb = yb - HZ, sb = dyb / dy;
    var lw = Math.max(3, Math.round(mpx(0.06, y))), ends = [x + u(1), x + w - u(1) - lw], kt = sunK(mpx(0.87, y));
    var x0 = Math.max(-2, Math.min(x, kt ? Math.round(projX(x, kt)) : x) - u(3)), x1 = Math.min(W + 1, Math.max(x + w, kt ? Math.round(projX(x + w, kt)) : x + w) + u(3));
    var r0 = yb - 2, r1 = Math.min(H - 1, (kt ? Math.round(projY(y, kt)) : y) + 3);
    if (x1 < x0 || r1 < r0) return;
    var bw = x1 - x0 + 1, nr = r1 - r0 + 1, nM = bw * nr, M = PG_SCR.u8.length >= nM ? PG_SCR.u8 : (PG_SCR.u8 = new Uint8Array(nM)), j, r, f, k, e, eb, s, xa, xz, a, b, o, i, v, re;
    if (PG_SCR.rmn.length < nr) { PG_SCR.rmn = new Int32Array(nr); PG_SCR.rmx = new Int32Array(nr); }
    var RN = PG_SCR.rmn, RX = PG_SCR.rmx;
    M.fill(0, 0, nM); RN.fill(1e9, 0, nr); RX.fill(-1, 0, nr);
    function mark(rr, p, q, v) {                               // the mask, and each row's marked span so only that is scanned
      rr = Math.round(rr); if (rr < r0 || rr > r1) return;
      p = Math.max(x0, Math.round(p)); q = Math.min(x1, Math.round(q));
      if (p > q) return;
      var ii, oo = (rr - r0) * bw - x0;
      if (p < RN[rr - r0]) RN[rr - r0] = p;
      if (q > RX[rr - r0]) RX[rr - r0] = q;
      for (ii = p; ii <= q; ii++) if (M[oo + ii] < v) M[oo + ii] = v;
    }
    function XB(v) { return W / 2 + (v - W / 2) * sb; }
    for (r = yb; r <= y; r++) { f = (r - yb) / Math.max(1, y - yb); mark(r, XB(x) + (x - XB(x)) * f, XB(x + w) + (x + w - XB(x + w)) * f, 1); }
    for (j = 0; j < 2; j++) { e = ends[j]; eb = XB(e); mark(y, e - 2, e + lw + 1, 2); mark(y + 1, e - 1, e + lw, 2); mark(yb, eb - 1, eb + lw, 2); }
    if (kt) {
      for (r = yb; r <= y; r++) {                              // seat plate, 0.41-0.47 m up
        f = (r - yb) / Math.max(1, y - yb); xa = XB(x) + (x - XB(x)) * f; xz = XB(x + w) + (x + w - XB(x + w)) * f;
        a = sunK(mpx(0.41, r)); b = sunK(mpx(0.47, r));
        for (s = Math.round(projY(r, a)); s <= Math.round(projY(r, b)); s++) { k = (s - HZ) / (r - HZ); mark(s, projX(xa, k), projX(xz, k), 2); }
      }
      xa = XB(x); xz = XB(x + w);
      for (j = 0; j < 3; j++) {                                // back slats
        a = sunK(mpx(0.765 - j * 0.12, yb)); b = sunK(mpx(0.85 - j * 0.12, yb));
        for (s = Math.round(projY(yb, a)); s <= Math.round(projY(yb, b)); s++) { k = (s - HZ) / dyb; mark(s, projX(xa, k), projX(xz, k), 2); }
      }
      for (j = 0; j < 2; j++) {
        e = ends[j]; eb = XB(e);
        b = sunK(mpx(0.87, yb)); for (s = yb; s <= Math.round(projY(yb, b)); s++) { k = (s - HZ) / dyb; mark(s, projX(eb + 1, k), projX(eb + lw - 2, k), 2); }
        b = sunK(mpx(0.66, y)); for (s = y; s <= Math.round(projY(y, b)); s++) { k = (s - HZ) / dy; mark(s, projX(e, k), projX(e + lw - 1, k), 2); }
        for (r = yb; r <= y; r++) {                            // armrest
          f = (r - yb) / Math.max(1, y - yb); k = sunK(mpx(0.66, r)); a = eb + (e - eb) * f; s = projY(r, k);
          mark(s, projX(a - 1, k), projX(a + lw, k), 2); mark(s + 1, projX(a - 1, k), projX(a + lw, k), 2);
        }
      }
    }
    for (r = Math.max(0, r0); r <= r1; r++) {                  // runs of cast shadow share the lawn's shade cache; skylight is lighter
      o = (r - r0) * bw - x0; re = RX[r - r0];
      for (i = RN[r - r0]; i <= re; i = s) {
        v = M[o + i];
        for (s = i + 1; s <= re && M[o + s] === v; s++);
        if (v === 2) pgShadeSpan(r, i, s - 1);
        else if (v) for (; i < s; i++) shade(i, r, 0.14);
      }
    }
  }  function pgPad(xl, y) {
    // a concrete pad set flush at the path edge: 0.9 m behind the bench's front feet to 0.45 m in front,
    // its sides running to the vanishing point
    var dy = y - HZ, D = dy * dy / (2.5 * W), yb = y - Math.round(0.9 * D), yf = y + Math.max(2, Math.round(0.45 * D));
    var top = C('#b3b8b2'), spk = C('#9aa3a6'), lip = C('#877d72'), el = PG_SCR.el, r, a, b, x;
    for (r = Math.max(0, yb); r <= Math.min(H - 1, yf); r++) {
      a = Math.round(W / 2 + (xl - W / 2) * (r - HZ) / dy); b = el[r] - 1;
      hline(a, b, r, r === yf ? lip : r === yf - 1 ? spk : top);
      if (r < yf - 1) for (x = 0; x < (b - a) * 0.08; x++) px(a + Math.round(hash((r - y) * 131 + x * 7 + 9) * (b - a)), r, spk);
    }
  }  function pgWallShadow() {
    // The park wall (0.78 m to the top of its coping) and its two gate piers (2.3 m to the top of the caps) cast
    // one shadow into the park. Each row gathers spans first: the wall's band while the sun is on the street side,
    // each pier's cast (the extent of its twelve box edges, on the ground and projected), and contact shade along
    // the pier's park side. The spans are merged, sunlit slivers narrower than u(2) are closed, and every row starts
    // past the wall base and the piers' faces, so the lawn is darkened once and no stone is touched.
    var E = 2.5 * W;
    if (seam(H - 1) - camX > W + u(12)) return;
    var HL = PG_SCR.hl, PP = PG_SCR.pp, SP = PG_SCR.sp, G = PG_GATE, gap = u(2), cast = sunE > u(9), wall = cast && sunX < seam(HZ + 1) - camX;
    var c = 0.78 / 2.5 / Math.max(1, sunE), w0 = Math.ceil(E / G[1][1]) - 1, w1 = Math.floor(E / G[0][0]) + 1, ys0 = H, ys1 = 0, xmax = seam(HZ + 1) - camX + u(8);
    var f0 = HZ + Math.round(E / G[0][0]), b0 = HZ + Math.round(E / G[0][1]), f1 = HZ + Math.round(E / G[1][0]), b1 = HZ + Math.round(E / G[1][1]);
    var k, i, j, n, r, R, row, mm, kk, xa, xb, ya, yb, dm, cl, s, tt, o, x0, x1;
    if (cast) for (k = 0; k < 2; k++) {
      for (i = 0; i < 2; i++) {                                // i = 0 the near face (corners 0, 1), 1 the far face (2, 3)
        row = HZ + Math.round(E / G[k][i]); mm = (row - HZ) / 2.5; kk = sunK(mm * 2.3);
        xb = seam(row) - camX + mm * 0.075; xa = xb - mm * 0.55; j = 2 * i;
        PP[j * 2] = i ? xb : xa; PP[(j + 1) * 2] = i ? xa : xb; PP[j * 2 + 1] = PP[(j + 1) * 2 + 1] = row;
        PP[(j + 4) * 2] = projX(PP[j * 2], kk); PP[(j + 5) * 2] = projX(PP[(j + 1) * 2], kk); PP[(j + 4) * 2 + 1] = PP[(j + 5) * 2 + 1] = projY(row, kk);
      }
      for (i = 0; i < 4; i++) {                                // base edge, top edge and upright of each side
        j = (i + 1) & 3; o = (k * 12 + i * 3) * 4;
        HL[o] = PP[i * 2]; HL[o + 1] = PP[i * 2 + 1]; HL[o + 2] = PP[j * 2]; HL[o + 3] = PP[j * 2 + 1];
        HL[o + 4] = PP[(i + 4) * 2]; HL[o + 5] = PP[(i + 4) * 2 + 1]; HL[o + 6] = PP[(j + 4) * 2]; HL[o + 7] = PP[(j + 4) * 2 + 1];
        HL[o + 8] = PP[i * 2]; HL[o + 9] = PP[i * 2 + 1]; HL[o + 10] = PP[(i + 4) * 2]; HL[o + 11] = PP[(i + 4) * 2 + 1];
      }
      for (i = 0; i < 16; i += 2) { if (PP[i + 1] < ys0) ys0 = PP[i + 1]; if (PP[i + 1] > ys1) ys1 = PP[i + 1]; if (PP[i] > xmax) xmax = PP[i]; }
    }
    if (xmax < 0) return;
    var r0 = wall ? HZ + 1 : Math.max(HZ + 1, Math.min(b1 - 24, Math.floor(ys0))), r1 = wall ? H - 1 : Math.min(H - 1, Math.max(f0 + 2, Math.ceil(ys1)));
    for (r = r0; r <= r1; r++) {
      R = r - HZ; n = 0;
      if (wall) {                                              // the wall's band: every wall row whose coping reaches this row
        dm = R / (1 + R * c); if (dm * c > 0.8) dm = R / 5;
        for (s = 0; s < 2; s++) {
          ya = Math.max(s ? w1 : 1, Math.ceil(dm)); yb = Math.min(s ? GH - 1 : w0, R);
          if (ya > yb) continue;
          xa = sunX + (ST - 0.9 * ya - camX - sunX) * R / ya; xb = sunX + (ST - 0.9 * yb - camX - sunX) * R / yb;
          SP[n++] = Math.round(Math.min(xa, xb)); SP[n++] = Math.round(Math.max(xa, xb));
        }
      }
      if (cast && r >= ys0 && r <= ys1) for (k = 0; k < 48; k += 24) {
        x0 = 1e9; x1 = -1e9;
        for (i = k * 2; i < k * 2 + 48; i += 4) {
          ya = HL[i + 1]; yb = HL[i + 3];
          if ((r - ya) * (r - yb) > 0) continue;
          if (ya === yb) { xa = HL[i]; xb = HL[i + 2]; } else xa = xb = HL[i] + (HL[i + 2] - HL[i]) * (r - ya) / (yb - ya);
          if (xa < x0) x0 = xa;
          if (xb < x0) x0 = xb;
          if (xa > x1) x1 = xa;
          if (xb > x1) x1 = xb;
        }
        if (x1 >= x0) { SP[n++] = Math.round(x0); SP[n++] = Math.round(x1); }
      }
      cl = Math.round(seam(r) - camX) + 1;
      for (k = 0; k < 2; k++) {                                // the piers' park-side faces, and contact shade at their feet
        i = k ? b1 : b0; j = k ? f1 : f0;
        if (r < i - 24 || r > j + 2) continue;
        row = r < i ? i : r > j ? j : r;
        tt = Math.round(seam(row) - camX) + Math.round((row - HZ) / 2.5 * 0.075);
        if (r <= j && tt + 1 > cl) cl = tt + 1;
        if (r >= i) { SP[n++] = cl; SP[n++] = tt + 2; }
      }
      if (!n) continue;
      for (i = 2; i < n; i += 2) for (j = i; j > 0 && SP[j] < SP[j - 2]; j -= 2) { tt = SP[j]; SP[j] = SP[j - 2]; SP[j - 2] = tt; tt = SP[j + 1]; SP[j + 1] = SP[j - 1]; SP[j - 1] = tt; }
      for (i = 0; i < n; ) {
        x0 = SP[i]; x1 = SP[i + 1];
        for (i += 2; i < n && SP[i] <= x1 + gap; i += 2) if (SP[i + 1] > x1) x1 = SP[i + 1];   // close sunlit slivers
        pgShadeSpan(r, x0 < cl ? cl : x0, x1);
      }
    }
  }
  function treeShadows() {
    // The crown's shade and the trunk's shadow as one patch, with sunflecks in it. No shade before sunrise.
    if (sunE <= u(9)) return;
    var g = treeGeo(), by = g.by, NL = LUMP.length, ca = Math.cos(sunA), M = crowMask, pen = Math.max(3, u(1.2));
    var i, y, x, kk, hy, h, c, lo, up, yA = H, yB = -1, e, xl, xr, q, lv, o, b4, s, dv = 0, ps = -1, vr, vg, vb;
    var tc = g.tx + (g.tw >> 1), hT = by - g.cy0, fr = 1 - TREE_SHADE * 0.78, fg = 1 - TREE_SHADE * 0.70, fb = 1 - TREE_SHADE * 0.52;
    for (i = 0; i < NL; i++) {
      h = g.h[i]; e = g.r[i] * 1.12 / ca;
      q = Math.round(projY(by, sunK(h - e))); if (q < yA) yA = q;
      q = Math.round(projY(by, sunK(h + e))); if (q > yB) yB = q;
    }
    if (by + 1 < yA) yA = by + 1;
    if (yA < HZ + 1) yA = HZ + 1;
    if (yB > H - 1) yB = H - 1;
    kk = (yB - HZ) / (by - HZ);
    xl = Math.min(g.x - Math.round(0.26 * W), sunX + (g.x - Math.round(0.26 * W) - sunX) * kk);
    xr = Math.max(g.x + Math.round(0.26 * W), sunX + (g.x + Math.round(0.26 * W) - sunX) * kk);
    if (yB < yA || xl > W || xr < 0) return;
    function span(a, b) {                     // mark a shaded run; its ends step down into a dithered penumbra
      var p, j, l;
      a = Math.round(a); b = Math.round(b);
      if (b < 0 || a > W - 1 || b < a) return;
      if (a < lo) lo = Math.max(0, a);
      if (b > up) up = Math.min(W - 1, b);
      for (j = 0; j < pen && a + j <= b; j++) {
        l = 1 + ((j * 3 / pen) | 0);
        p = a + j; if (p >= 0 && p < W && M[p] < l) M[p] = l;
        p = b - j; if (p >= 0 && p < W && M[p] < l) M[p] = l;
      }
      if (b - pen >= a + pen) M.fill(3, Math.max(0, a + pen), Math.min(W - 1, b - pen) + 1);
    }
    var fl = dapple(g, ca), m, dep;
    for (i = 0; i < fl.length; i += 5) {              // edge clusters and bites belong on the edge: one floating clear of
      y = Math.round(fl[i + 1]);                      // the patch reads as a puddle, a bite deep inside as a lily pad
      if (fl[i + 4] === 0 || y <= HZ) continue;
      kk = (y - HZ) / (by - HZ); hy = sunE * (1 - 1 / kk); dep = -1e9;
      for (m = 0; m < NL; m++) { h = treeShadeHalf(g, m, y, kk, hy, ca); if (h > 0) dep = Math.max(dep, h - Math.abs(fl[i] - (sunX + (g.cx[m] - sunX) * kk))); }
      if (fl[i + 4] === 1 ? dep < -u(3) : dep > fl[i + 2] * 0.8) fl[i + 4] = 2;
    }
    for (y = yA; y <= yB; y++) {
      kk = (y - HZ) / (by - HZ); hy = sunE * (1 - 1 / kk);
      lo = W; up = -1;
      for (i = 0; i < NL; i++) {
        h = treeShadeHalf(g, i, y, kk, hy, ca);
        if (h > 0) { c = sunX + (g.cx[i] - sunX) * kk; span(c - h, c + h); }
      }
      if (y > by && hy <= hT) { h = g.tw * 0.5 * kk; c = sunX + (tc - sunX) * kk; span(c - h, c + h); }
      for (i = 0; i < fl.length; i += 5) {            // leaf clusters pushing the edge out
        if (fl[i + 4] !== 1) continue;
        q = (y - fl[i + 1]) / fl[i + 3];
        if (q > -1 && q < 1) { e = fl[i + 2] * Math.sqrt(1 - q * q); span(fl[i] - e, fl[i] + e); }
      }
      if (up < lo) continue;
      for (i = 0; i < fl.length; i += 5) {            // sunflecks and bites: sun through the gaps, bright,
        if (fl[i + 4] === 1 || fl[i + 4] === 2) continue;   // never dark dots
        q = (y - fl[i + 1]) / fl[i + 3];
        if (q <= -1 || q >= 1) continue;
        e = fl[i + 2] * Math.sqrt(1 - q * q);
        xl = Math.max(lo, Math.round(fl[i] - e)); xr = Math.min(up, Math.round(fl[i] + e));
        for (x = xl; x <= xr; x++) if (M[x]) M[x] = fl[i + 2] > 4 && (Math.abs(x - fl[i]) > e * 0.6 || q < -0.55 || q > 0.55) ? 1 : 0;
      }
      o = y * W; b4 = (y & 3) * 4;
      for (x = lo; x <= up; x++) {
        lv = M[x]; if (!lv) continue;
        M[x] = 0;
        if (lv === 1 ? BAY[b4 + ((x + camX) & 3)] > 3 : lv === 2 && BAY[b4 + ((x + camX) & 3)] > 9) continue;   // dither keyed to the ground
        s = buf[o + x];
        if (s !== ps) {
          ps = s;
          if (LE) { vr = s & 255; vg = s >> 8 & 255; vb = s >> 16 & 255; } else { vr = s >> 24 & 255; vg = s >> 16 & 255; vb = s >> 8 & 255; }
          vr = vr * fr | 0; vg = vg * fg | 0; vb = vb * fb | 0;
          dv = (LE ? (255 << 24 | vb << 16 | vg << 8 | vr) : (vr << 24 | vg << 16 | vb << 8 | 255)) >>> 0;
        }
        buf[o + x] = dv;
      }
    }
  }
  function dapple(g, ca) {
    // Points in the crown, picked in tree-local terms (a point on mass i's shadow ellipse: height
    // h + r/cos(e)*cos(th), across r*sin(th)) and cast to the ground like the crown itself, so they keep
    // their place in the shade as it pans. Returns [x, y, rx, ry, kind]: kind 1 is a leaf cluster that
    // pushes the shade's edge out, kind 3 a bite out of the edge, kind 0 a sunfleck inside (treeShadows
    // marks strays that miss the edge 2). Every ground ellipse is ~0.24 as tall as wide: stretched
    // 1/sin(e) along the sun, foreshortened by the view. Sunflecks are mostly specks a few px across, with
    // the odd large one, and gather where the crown thins toward its edge.
    var out = [], i, j, n, th, rho, h, k, rx;
    for (i = 0; i < LUMP.length; i++) for (j = 0; j < 20; j++) {
      n = i * 53 + j * 7 + 400; th = hash(n) * 6.283; rho = 0.86 + hash(n + 1) * 0.22;
      h = g.h[i] + g.r[i] / ca * Math.cos(th) * rho;
      k = sunK(h); if (!k) return out;
      rx = ((j & 1) ? u(2) + hash(n + 2) * u(4) : u(1.2) + hash(n + 2) * u(2.6)) * k / 1.4;
      out.push(projX(g.cx[i] + g.r[i] * Math.sin(th) * rho, k), projY(g.by, k), rx, Math.max(1.5, rx * 0.26), j & 1 ? 1 : 3);
    }
    for (j = 0; j < 70; j++) {
      n = j * 11 + 900; i = (hash(n) * LUMP.length) | 0; th = hash(n + 1) * 6.283; rho = 0.7 + Math.sqrt(hash(n + 2)) * 0.3;
      h = g.h[i] + g.r[i] / ca * Math.cos(th) * rho;
      k = sunK(h); if (!k) return out;
      rx = (hash(n + 3) < 0.85 ? 1 + hash(n + 4) * 2 : u(1.5) + hash(n + 4) * u(2.5)) * k / 1.4;
      out.push(projX(g.cx[i] + g.r[i] * Math.sin(th) * rho, k), projY(g.by, k), rx, Math.max(1, rx * 0.3), 0);
    }
    return out;
  }

  // ---------- mid objects (p = 1) ----------
  function storefronts() {
    // Queen St W: two- and three-storey Victorian shop rows on 6-8 m lots, some doubled. Storeys are metres at the
    // row's base (mpx), so a lower building has fewer floors, never squashed ones. The corner building stops a
    // sidewalk short of the cross street.
    var m = mpx(1, BASE), end = seam(BASE) - mpx(STREET_PW + STREET_RW + 2.5, BASE), wx = -0.20 * W, i = 0, r, wm, bw, sx, nUp;
    while (wx < end - 4 * m) {
      r = hash(i * 5 + 1);
      wm = r < 0.55 ? 5.6 + hash(i * 5 + 7) * 2.2 : r < 0.88 ? 10.5 + hash(i * 5 + 7) * 3.5 : 15.5 + hash(i * 5 + 7) * 3;
      bw = Math.round(wm * m);
      if (wx + bw > end) bw = Math.round(end - wx);
      r = hash(i * 5 + 2);
      nUp = r < 0.36 ? 1 : (r < 0.90 || bw < 9 * m ? 2 : 3);
      sx = Math.round(wx - camX);
      if (sx < W + 2 && sx + bw > -2) facade(sx, bw, nUp, i);
      wx += bw; i++;
    }
    streetSideRow(i - 1, nUp);
  }
  function streetSideRow(ci, nUp) {
    // the corner building's side wall, then houses along the cross street receding to the horizon beside the park.
    // Their fronts face the cross street, so each depth row is a thin upright slice and the roofline sinks toward
    // the seam's horizon point. Keyed to depth (world), so it pans with the ground.
    var m = mpx(1, BASE), bh = Math.round(4.3 * m) + nUp * Math.round(3.4 * m) + Math.max(3, Math.round(0.6 * m)) + Math.max(2, Math.round(0.5 * m));
    var zb = W * 2.5 / (BASE - HZ), g, x0, x1, x, z, hi, hm, top, c, s, dk = C('#33251a'), win = C('#26292d');
    for (g = BASE; g > HZ + 1; g--) {
      x0 = Math.round(streetX(g, STREET_RW + 2.5)); x1 = Math.max(x0 + 1, Math.round(streetX(g - 1, STREET_RW + 2.5)));
      if (x0 >= W) break;
      if (x1 <= 0) continue;
      z = W * 2.5 / (g - HZ) - zb;
      if (z < 18) { hi = -1; top = g - Math.round(bh * (g - HZ) / (BASE - HZ)); c = C(STREET_TONE[STREET_FSEQ[ci % STREET_FSEQ.length]] || SFC[STREET_FSEQ[ci % STREET_FSEQ.length]]); }
      else { hi = Math.floor((z - 18) / 6.5); hm = 7 + hash(hi * 7 + 91) * 3.5; top = g - Math.round(mpx(hm, g)); c = C(SFC[STREET_FSEQ[(hi * 5 + 3) % STREET_FSEQ.length]]); }
      for (x = x0; x < x1; x++) {
        vline(x, top, g - 1, c); px(x, top, dk);
        if (((x + camX) & 3) === 0) for (s = 0; s < 3; s++) if (mpx(1.1 + 3.2 * s, g) < g - top - 3) vline(x, g - Math.round(mpx(2.6 + 3.2 * s, g)), g - Math.round(mpx(1.1 + 3.2 * s, g)), win);
      }
    }
  }

  function facade(sx, bw, nUp, i) {
    var m = mpx(1, BASE), shopH = Math.round(4.3 * m), st = Math.round(3.4 * m), corn = Math.max(3, Math.round(0.6 * m)), para = Math.max(2, Math.round(0.5 * m));
    var shop = BASE - shopH, top = shop - nUp * st - corn - para, x, y, k, f, n, x0, x1, step, r;
    var ci = STREET_FSEQ[i % STREET_FSEQ.length], body = C(SFC[ci]), tone = STREET_TONE[ci] ? C(STREET_TONE[ci]) : 0;
    var stone = C('#b3b8b2'), pil = Math.max(2, Math.round(0.3 * m)), dk = C('#33251a');
    var trim = C(ci === 3 ? '#1f3f2c' : (tone && hash(i * 11 + 3) < 0.4) ? '#33251a' : '#e9e1cd');
    var corC = hash(i * 11 + 4) < 0.55 ? C('#4b3827') : trim, head = tone && hash(i * 11 + 6) < 0.5 ? tone : stone;
    rect(sx, top, bw, shop - top, body);
    // brick across a street is a fine even texture: a 3-in-16 stipple anchored to the facade's own corner
    if (tone) for (y = top + para; y < shop; y += 2) {
      step = ((y - top) & 2) ? 4 : 2; x0 = sx + (step === 4 ? 1 : 0);
      if (x0 < 0) x0 += Math.ceil(-x0 / step) * step;
      x1 = Math.min(W - 1, sx + bw - 1);
      for (x = x0; x <= x1; x += step) buf[y * W + x] = tone;
    }
    if (tone) { rect(sx, top + para, pil, shop - top - para, tone); rect(sx + bw - pil, top + para, pil, shop - top - para, tone); }
    // parapet with a stone coping, then a bracketed cornice throwing a little shade on the wall under it
    hline(sx, sx + bw - 1, top, C('#cfd6d8')); hline(sx, sx + bw - 1, top + 1, stone);
    if (sunE > u(9) && t < 0.5) for (x = sx + ((sx + camX) & 1); x < sx + bw; x += 2) px(x, top, C('#f0d69f'));
    y = top + para;
    rect(sx - 1, y, bw + 2, corn, corC);
    hline(sx - 1, sx + bw, y, corC === trim ? C('#f6f4ea') : C('#6f573c'));
    hline(sx - 1, sx + bw, y + corn - 1, dk);
    for (k = y + corn; k < y + corn + 3; k++) for (x = sx; x < sx + bw; x++) shade(x, k, 0.32 - 0.09 * (k - y - corn));
    n = Math.max(2, Math.round(bw / (1.4 * m)));
    for (k = 0; k <= n; k++) {
      x = sx + 1 + Math.round(k * (bw - 5) / n);
      rect(x, y + corn, 3, Math.round(0.4 * m), corC); vline(x + 2, y + corn, y + corn + Math.round(0.4 * m) - 1, dk);
    }
    // roof clutter on some: a chimney or a condenser behind the parapet
    r = hash(i * 11 + 9); x = sx + Math.round(bw * (0.15 + 0.6 * hash(i * 11 + 10)));
    if (r < 0.3) { rect(x, top - Math.round(1.1 * m), Math.round(0.6 * m), Math.round(1.1 * m), tone || body); hline(x - 1, x + Math.round(0.6 * m), top - Math.round(1.1 * m), stone); }
    else if (r < 0.5) { rect(x, top - Math.round(0.75 * m), Math.round(1.1 * m), Math.round(0.75 * m), C('#9aa3a6')); hline(x, x + Math.round(1.1 * m) - 1, top - Math.round(0.75 * m), C('#cfd6d8')); for (k = x + 2; k < x + Math.round(1.1 * m) - 2; k += 2) vline(k, top - Math.round(0.5 * m), top - 2, C('#6d777b')); }
    // upper storeys: tall 2-over-2 sashes in equal bays; lights go out one by one as the morning comes up
    var nWin = Math.max(2, Math.round(bw / m / 2.4)), bay = (bw - 2 * pil) / nWin, ww = Math.round(0.85 * m) | 1, wh = Math.round(1.85 * m), lf = cl01(1 - t / 0.34), sc = hash(i * 11 + 8) < 0.5;
    for (f = 0; f < nUp; f++) {
      y = top + para + corn + f * st;
      if (f > 0 && sc) hline(sx + pil, sx + bw - pil - 1, y, stone);
      for (k = 0; k < nWin; k++) {
        streetWindow(Math.round(sx + pil + bay * (k + 0.5) - ww / 2), y + Math.round(0.75 * m), ww, wh, trim, head, stone,
          hash(i * 17 + f * 5 + k * 3 + 1) < 0.30 * lf, hash(i * 13 + f * 7 + k * 11 + 5));
      }
    }
    // shop storey: moulded shopfront cornice, fascia signs, glazing, a door to the flats at one end
    var fr = C(['#1f3f2c', '#26292d', '#7e3226', '#33251a', '#4a555e'][(i * 7 + 3) % 5]);
    var fh = Math.round(0.85 * m), tr = Math.max(3, Math.round(0.45 * m)), bulk = Math.max(3, Math.round(0.5 * m));
    var fy = shop + 2, ty = fy + fh + 1, gy0 = ty + tr + 1, gy1 = BASE - bulk - 1;
    var dw = Math.round(0.95 * m), left = hash(i * 31 + 7) < 0.5, fx = left ? sx + pil + 1 : sx + bw - pil - 1 - dw;
    var u0 = left ? fx + dw + 2 : sx + pil, u1 = left ? sx + bw - pil - 1 : fx - 3, ns = u1 - u0 > 10 * m ? 2 : 1, a, b;
    rect(sx, shop, bw, shopH, fr);
    hline(sx - 1, sx + bw, shop, stone); hline(sx - 1, sx + bw, shop + 1, C('#6d777b'));
    for (k = 0; k < ns; k++) {
      a = Math.round(u0 + (u1 - u0 + 1) * k / ns); b = Math.round(u0 + (u1 - u0 + 1) * (k + 1) / ns) - 1 - (k < ns - 1 ? pil : 0);
      streetShop(a, b, fy, fh, ty, tr, gy0, gy1, i * 3 + k);
    }
    rect(fx, fy, dw, fh, fr);
    rect(fx, ty, dw, tr, C('#26292d')); hline(fx, fx + dw - 1, ty + 1, C('#3d4a63'));
    var dtop = Math.max(gy0, BASE - Math.round(2.1 * m));
    rect(fx, gy0, dw, dtop - gy0, C('#26292d'));
    rect(fx, dtop, dw, BASE - dtop, C(left ? '#4b3827' : '#1f3f2c'));
    vline(fx, dtop, BASE - 1, dk); vline(fx + dw - 1, dtop, BASE - 1, C('#6f573c'));
    frame(fx + 2, dtop + 3, dw - 4, Math.round((BASE - dtop) * 0.4), C('#6f573c')); frame(fx + 2, dtop + Math.round((BASE - dtop) * 0.5), dw - 4, Math.round((BASE - dtop) * 0.42), C('#6f573c'));
    px(fx + dw - 3, dtop + Math.round((BASE - dtop) * 0.47), stone);
  }
  function streetWindow(x, y, w, h, trim, head, stone, on, r) {
    // a tall 2-over-2 sash under a segmental arch, stone sill below. Lit ones glow (CR) behind a blind now and
    // then; dark ones catch the sky in the top panes. Patterns are keyed to the window, not the screen.
    var mid = y + (h >> 1), gl, re, xx, yy, k, bl;
    hline(x + 2, x + w - 3, y - 3, head); hline(x, x + w - 1, y - 2, head); px(x - 1, y - 1, head); px(x + w, y - 1, head);
    hline(x + 1, x + w - 2, y - 1, trim); rect(x, y, w, h, trim);
    gl = on ? CR('#ffd98a') : C('#26292d'); re = on ? CR('#f4ac6b') : C(t < 0.3 ? '#3d4a63' : '#4e5d79');
    rect(x + 1, y + 1, w - 2, mid - y - 1, gl); rect(x + 1, mid + 1, w - 2, y + h - 2 - mid, gl);
    for (yy = y + 1; yy < y + h - 1; yy++) {
      if (yy === mid) continue;
      k = on ? (yy - y) / h * 9 - 3 : 7 - (yy - y) * 0.8;
      if (k <= 0) continue;
      for (xx = x + 1; xx < x + w - 1; xx++) if (BAY[((yy - y) & 3) * 4 + ((xx - x) & 3)] < k) px(xx, yy, re);
    }
    if (r < 0.4) {
      bl = y + 1 + Math.round(r / 0.4 * (mid - y - 2));
      rect(x + 1, y + 1, w - 2, bl - y, on ? CR('#f4ac6b') : C('#d9b48c'));
      hline(x + 1, x + w - 2, bl, on ? CR('#e0a94e') : C('#b98761'));
    }
    vline(x + (w >> 1), y, y + h - 1, trim); hline(x, x + w - 1, mid, trim);
    hline(x - 1, x + w, y + h, stone);
    for (xx = x - 1; xx <= x + w; xx++) shade(xx, y + h + 1, 0.35);
  }
  function streetShop(u0, u1, fy, fh, ty, tr, gy0, gy1, s) {
    // one shopfront: a painted fascia board with its name, transom lights, display glass on a bulkhead and a
    // recessed glazed door. Dark before opening, a few lit (cafes, bakeries) at dawn; by day the glass holds the sky.
    var m = mpx(1, BASE), uw = u1 - u0 + 1, x, y, k, n, gx, gy, bits, name, sc, lw, lx, ly, bc, lc, dx, dw, gl, re, lit, day = t >= 0.3;
    var fr = C(['#1f3f2c', '#26292d', '#7e3226', '#33251a', '#4a555e'][(s * 3 + 1) % 5]);
    if (uw < 6) return;
    k = (s * 7 + 1) % 5;
    bc = C(['#1f3f2c', '#26292d', '#e9e1cd', '#7e3226', '#33251a'][k]); lc = C(k === 2 ? '#1f3f2c' : (s & 1) ? '#f2d24a' : '#e9e1cd');
    rect(u0, fy, uw, fh, bc); hline(u0, u1, fy + fh - 1, C('#1d252b'));
    name = STREET_SIGNS[(s * 5 + 3) % STREET_SIGNS.length];
    sc = name.length * 8 - 2 <= uw - 8 && fh >= 12 ? 2 : 1;
    if (name.length * 4 * sc - sc > uw - 4) name = name.slice(0, Math.max(1, Math.floor((uw - 4 + sc) / (4 * sc))));
    lw = name.length * 4 * sc - sc; lx = u0 + ((uw - lw) >> 1); ly = fy + ((fh - 5 * sc) >> 1);
    streetText(name, lx, ly, sc, lc);
    lit = !day && hash(s * 7919 + 1013) < 0.30 * cl01(1 - t / 0.30);
    gl = lit ? CR('#8a6a3f') : C(day ? '#3d4a63' : '#26292d'); re = lit ? CR('#e0a94e') : C(day ? '#6d777b' : '#3d4a63');
    rect(u0, ty, uw, tr, gl);
    for (x = u0 + Math.round(0.6 * m); x < u1; x += Math.round(0.6 * m)) vline(x, ty, ty + tr - 1, fr);
    hline(u0, u1, gy0 - 1, fr);
    rect(u0, gy0, uw, gy1 - gy0 + 1, gl);
    if (lit) {                                           // warm back wall, pendants, shelving, a counter
      rect(u0, gy0, uw, 2, re);
      for (x = u0 + Math.round(0.5 * m); x < u1 - 2; x += Math.round(1.3 * m)) { vline(x + 1, gy0, gy0 + 2, CR('#33251a')); rect(x, gy0 + 3, 3, 2, CR('#ffd98a')); }
      k = gy0 + Math.round((gy1 - gy0) * 0.45); hline(u0, u1, k, CR('#57422a')); hline(u0, u1, k + Math.round(0.35 * m), CR('#57422a'));
      k = Math.round((gy1 - gy0) * 0.3); rect(u0, gy1 - k + 1, uw, k, CR('#33251a')); hline(u0, u1, gy1 - k + 1, CR('#b98761'));
    } else for (y = gy0; y < gy0 + ((gy1 - gy0) >> 2) + 2; y++) for (x = u0; x <= u1; x++) if (BAY[((y - gy0) & 3) * 4 + ((x - u0) & 3)] < 4 - (y - gy0) * 0.35) px(x, y, re);
    n = Math.max(1, Math.round(uw / m / 1.9));
    for (k = 1; k < n; k++) vline(u0 + Math.round(uw * k / n), gy0, gy1, fr);
    rect(u0, gy1 + 1, uw, BASE - gy1 - 1, fr); hline(u0, u1, gy1 + 1, C('#6f573c')); frame(u0 + 2, gy1 + 3, uw - 4, BASE - gy1 - 4, C('#1d252b'));
    dw = Math.round(1.0 * m); dx = hash(s * 31 + 9) < 0.5 ? u0 + Math.round(uw * 0.12) : u1 - Math.round(uw * 0.12) - dw;
    if (uw > dw + 8) {
      rect(dx - 2, gy0, dw + 4, BASE - gy0, C('#1d252b'));
      var dtop = Math.max(gy0, BASE - Math.round(2.1 * m));
      rect(dx, dtop + 1, dw, BASE - dtop - 1, fr);
      rect(dx + 2, dtop + 3, dw - 4, BASE - dtop - 4 - Math.round(0.35 * m), gl);
      px(dx + dw - 4, dtop + Math.round((BASE - dtop) * 0.55), C('#b3b8b2'));
      hline(dx - 2, dx + dw + 1, BASE - 1, C('#6d777b'));
    }
    if (hash(s * 23 + 5) < 0.42) streetAwning(u0 - 1, u1 + 1, ty - 1, s);
  }
  function streetAwning(x0, x1, y, s) {
    // a fabric awning seen from the front: its sloped top foreshortened, a valance, and shade on the glass below
    var m = mpx(1, BASE), ah = Math.round(0.6 * m), vh = Math.max(2, Math.round(0.3 * m)), sw = Math.max(2, Math.round(0.3 * m)), x, k, a, b;
    var A = [['#b34a3a', '#e9e1cd'], ['#1f3f2c', '#1f3f2c'], ['#26292d', '#26292d'], ['#376b45', '#e9e1cd'], ['#7e3226', '#7e3226']][s % 5];
    a = C(A[0]); b = C(A[1]);
    for (x = x0, k = 0; x <= x1; x += sw, k++) rect(x, y, Math.min(sw, x1 - x + 1), ah + vh, k & 1 ? b : a);
    for (x = x0; x <= x1; x++) { shade(x, y + ah, 0.25); shade(x, y + ah + vh - 1, 0.35); }
    hline(x0, x1, y, C('#4a555e'));
    for (k = 0; k < Math.round(0.45 * m); k++) for (x = x0 + 1; x < x1; x++) shade(x, y + ah + vh + k, 0.34 - 0.05 * k);
  }

  function wires() {
    // the trolley wire hangs nearer to us than the streetlight poles, so it is drawn at the end of lights()
  }

  function lights() {
    // four streetlights (the last on the corner), the TTC stop post, then the overhead in front of them
    for (var i = 0; i < 4; i++) streetLamp(i);
    streetStop();
    streetOverhead();
  }
  function streetPoleX(i) {
    // world x of streetlight i; the fourth stands on the far corner of the cross street
    var y = HZ + Math.round(GH * 0.17);
    return i < 3 ? STREET_POLES[i] * W : seam(y) - mpx(STREET_PW + STREET_RW + 2.2, y) - u(6);
  }
  function streetLamp(i) {
    // spun-concrete pole, ~8.5 m and tapering, its sun-side edge lit; a davit arm reaching out over the road toward us
    // (so short, leaning with the seam) holds an LED cobra head seen from below. Cool white while lit; the poles
    // switch off one by one around sunrise.
    var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), sx = Math.round(streetPoleX(i) - camX), top = y - Math.round(8.5 * m);
    var k, w, x0, lit = t < 0.10 + hash(i * 7 + 3) * 0.08, hx, hy, hw, hh, R, dx, dy, d, e, yy, xx, cx;
    if (sx < -u(50) || sx > W + u(50)) return;
    var mid = C('#9aa3a6'), dk = C('#6d777b'), hi = C('#b3b8b2'), ink = C('#4a555e'), glow = CR('#dfe6ea');
    for (k = top; k <= y; k++) {
      w = Math.max(3, Math.round((0.17 + 0.12 * (k - top) / (y - top)) * m));
      x0 = sx - (w >> 1);
      hline(x0, x0 + w - 1, k, mid); px(x0, k, ink); px(x0 + 1, k, dk); px(x0 + w - 1, k, hi);
    }
    w = Math.round(0.36 * m) | 1; k = Math.round(0.45 * m);
    rect(sx - (w >> 1), y - k, w, k, dk); hline(sx - (w >> 1), sx + (w >> 1), y - k, mid); hline(sx - (w >> 1) - 1, sx + (w >> 1) + 1, y, ink);
    hx = sx - Math.round(1.0 * m); hy = top - Math.round(0.6 * m);
    limb(sx, top + 3, sx - 1, top - Math.round(0.35 * m), 4, 3, mid, hi);
    limb(sx - 1, top - Math.round(0.35 * m), hx + 2, hy, 3, 3, mid, hi);
    hw = Math.round(0.62 * m); hh = Math.max(3, Math.round(0.16 * m)); cx = hx - (hw >> 1) + 2;
    rect(hx - hw + 2, hy - 1, hw, hh, hi); hline(hx - hw + 4, hx, hy - 2, C('#cfd6d8')); hline(hx - hw + 2, hx + 1, hy + hh - 2, dk);
    hline(hx - hw + 3, hx, hy + hh - 1, lit ? CR('#f6f4ea') : ink);
    if (!lit) return;
    // the pool of light reaches further than the head (the davit arm's reach): without a lamp on screen
    // to cast it, a stray pool at the frame edge reads as noise, so skip it once the head is fully off
    if (hx + 1 < 0 || hx - hw + 2 >= W) return;
    for (dy = 0; dy < 3; dy++) for (dx = -dy - 1; dx < hw + dy - 2; dx++) if (BAY[(dy & 3) * 4 + (dx & 3)] < 7 - dy * 3) px(hx - hw + 3 + dx, hy + hh + dy, glow);
    for (yy = y - u(1.6); yy <= KERB + u(1); yy++) {                 // its pool of light on the pavement
      e = 1 - Math.abs(yy - y - u(0.4)) / u(2.4);
      if (e <= 0) continue;
      w = Math.round(u(13) * Math.sqrt(e));
      for (xx = cx - w; xx <= cx + w; xx++) if (BAY[(yy & 3) * 4 + ((xx + camX) & 3)] < e * (1 - Math.abs(xx - cx) / (w + 1)) * 5) px(xx, yy, CR('#b3b8b2'));
    }
  }
  function streetStop() {
    // TTC stop post on the far sidewalk, 1.5 m ahead of the streetcar's cab nose so the car's front doors
    // line up with it: a grey steel pole about 3 m tall with the red-and-white stop flag (TTC mark, a
    // streetcar symbol, the route number), true scale (readability floor only below 8 px)
    var y = HZ + Math.round(GH * 0.185), m = mpx(1, y), sx = sxOf(streetPoleWX(), 1), top = y - Math.round(3.0 * m), k;
    var sw = Math.max(8, Math.round(0.42 * m)) | 1, sh = Math.max(8, Math.round(0.75 * m)), x0 = sx - (sw >> 1), rh = Math.round(sh * 0.4);
    var red = C('#d9584f'), wht = C('#f6f4ea');
    if (sx < -u(10) || sx > W + u(10)) return;
    vline(sx - 1, top + 2, y, C('#6d777b')); vline(sx, top + 2, y, C('#9aa3a6')); vline(sx + 1, top + 2, y, C('#4a555e'));
    hline(sx - 2, sx + 2, y, C('#4a555e'));
    frame(x0 - 1, top - 1, sw + 2, sh + 2, C('#6d777b'));
    rect(x0, top, sw, sh, wht); rect(x0, top, sw, rh, red);
    streetText('TTC', x0 + ((sw - 11) >> 1), top + ((rh - 5) >> 1), 1, wht);
    k = top + rh + 2;
    rect(x0 + 2, k, sw - 4, 4, red); hline(x0 + 3, x0 + sw - 4, k + 1, wht); px(x0 + 3, k + 4, C('#26292d')); px(x0 + sw - 4, k + 4, C('#26292d'));
    streetText('501', x0 + ((sw - 11) >> 1), k + 6, 1, red);
  }
  function streetText(s, x, y, sc, c) {
    // STREET_FONT at sc px per dot; a space just advances. STREET_FONT's own 'N' is a column short at its
    // top row, so it reads as a lowercase n (NOODLES -> nOODLES) - override it here rather than edit the
    // shared table, with both verticals full height like every other capital.
    var n, gx, gy, b;
    for (n = 0; n < s.length; n++) {
      b = s.charAt(n) === 'N' ? '101111111111101' : STREET_FONT[s.charAt(n)];
      if (b) for (gy = 0; gy < 5; gy++) for (gx = 0; gx < 3; gx++) if (b.charCodeAt(gy * 3 + gx) === 49) rect(x + n * 4 * sc + gx * sc, y + gy * sc, sc, sc, c);
    }
  }
  function streetWire() {
    // the contact wire's centreline follows the far track
    return streetPath(KERB + Math.round((STREET_TR[0] + STREET_TR[1]) / 2 * RH), (STREET_TO[0] + STREET_TO[1]) / 2, STREET_TC[0]);
  }
  function streetWireY(P, x) {
    // screen y of the wire on its straight run: 5.6 m above the rails, sagging a few px between bracket arms
    var y0 = Math.round(P.yr - mpx(5.6, P.yr)), d = Math.round(0.9 * (P.yr - HZ - Math.round(GH * 0.17))), a = -0.18 * W - camX - d, b = a, i, f;
    for (i = 0; i <= 3; i++) {
      b = i < 3 ? STREET_POLES[i] * W - camX - d : P.xs;
      if (x < b) break;
      a = b;
    }
    if (i > 3 || b <= a) return y0;
    f = cl01((x - a) / (b - a));
    return y0 + Math.round(u(1.1) * 4 * f * (1 - f));
  }
  function streetOverhead() {
    // one trolley wire, over the far track only: on bracket arms from the streetlight poles along Queen, pulled
    // round the curve from the corner pole, then up the cross street, sinking to the horizon as it recedes
    var P = streetWire(), ly = HZ + Math.round(GH * 0.17), lm = mpx(1, ly), wc = C('#26292d'), arm = C('#4a555e'), armHi = C('#9aa3a6'), ins = C('#b3b8b2');
    var x, y, g, prev = -1e9, x1 = Math.min(W - 1, Math.floor(P.S) - 2), i, sx, bx, be, wy, s, cx, cy, k, aw;
    for (x = 0; x <= x1; x++) {
      if (x <= P.xs) y = streetWireY(P, x);
      else { g = streetPathY(P, x); if (g <= HZ + 1) break; y = Math.round(g - mpx(5.6, g)); }
      if (prev > -1e9 && Math.abs(y - prev) > 1) vline(x, Math.min(y, prev) + 1, Math.max(y, prev) - 1, wc);
      px(x, y, wc); prev = y;
    }
    for (i = 0; i < 3; i++) {
      sx = Math.round(STREET_POLES[i] * W - camX);
      if (sx < -u(20) || sx > W + u(60)) continue;
      bx = sx - Math.round(0.9 * (P.yr - ly)); wy = streetWireY(P, bx); be = wy - Math.round(mpx(0.35, P.yr));
      g = ly - Math.round(6.1 * lm); k = ly - Math.round(7.3 * lm);
      // 6-8 cm bracket arms and pull-offs are 2-4 px at this scale, not a hairline; a lit top edge sells the round steel
      aw = Math.max(1, Math.round(mpx(0.07, be)));
      limb(sx - 2, g, bx, be, Math.max(1, Math.round(mpx(0.07, g))), aw, arm, armHi);
      limb(sx - 1, g, bx + 1, be, Math.max(1, Math.round(mpx(0.07, g))), aw, arm, armHi);
      limb(sx - 2, k, bx + 1, be, Math.max(1, Math.round(mpx(0.07, k))), aw, arm, armHi);
      aw = Math.max(1, Math.round(mpx(0.08, ly)));
      rect(sx - 4, g, 8, aw, arm); hline(sx - 4, sx + 3, g, armHi);
      rect(sx - 4, k, 8, aw, arm); hline(sx - 4, sx + 3, k, armHi);
      vline(bx, be, wy - 1, arm); px(bx - 1, be + ((wy - be) >> 1), ins); px(bx + 1, be + ((wy - be) >> 1), ins);
    }
    sx = Math.round(streetPoleX(3) - camX);
    if (sx > -u(200) && sx < W + u(200)) {
      g = ly - Math.round(6.1 * lm);
      for (k = 0; k < 3; k++) {
        s = 0.15 + k * 0.4; cx = (1 - s) * (1 - s) * P.xs + 2 * s * (1 - s) * P.xc + s * s * P.xe; cy = P.yr + s * s * (P.ye - P.yr);
        limb(sx - 2, g, Math.round(cx), Math.round(cy - mpx(5.6, cy)) - 1, Math.max(1, Math.round(mpx(0.07, g))), Math.max(1, Math.round(mpx(0.07, cy))), arm, armHi);
      }
      aw = Math.max(1, Math.round(mpx(0.08, ly)));
      rect(sx - 4, g, 8, aw, arm); hline(sx - 4, sx + 3, g, armHi);
    }
  }

  function streetcar() {
    // TTC Flexity Outlook stopped by the stop post, true scale: 28 m by 3.84 m, five sections on three bogies.
    // Traffic keeps right, so a car on the far track heads left: raked cab on the left, and its doors (right side
    // only) open to the far kerb, away from us. Interior lights stay on all day; head and tail lights use CR.
    if (progress > 0.24) return;
    var m = mpx(1, KERB + Math.round(0.09 * RH)), L = Math.round(28 * m), xr = sxOf(0.70 * W, 1), xf = xr - L;
    if (xf > W + u(40) || xr < -u(40)) return;
    var yb = KERB + Math.round(STREET_TR[1] * RH), x, y, k, j, h, a, b, r, c, n, x0, x1, pw, slv, xc;
    var red = C('#d9584f'), red2 = C('#b34a3a'), red3 = C('#7e3226'), blk = C('#26292d'), blk2 = C('#1d252b');
    var gry = C('#9aa3a6'), gry2 = C('#6d777b'), gry3 = C('#cfd6d8'), tread = C('#33373b');
    var ySk = yb - Math.round(0.30 * m), yW0 = yb - Math.round(0.98 * m), yW1 = yb - Math.round(2.55 * m), yRf = yb - Math.round(3.36 * m), yTop = yb - Math.round(3.84 * m);
    var ycab = yb - Math.round(2.95 * m), xcab = xf + Math.round(2.1 * m), SEC = [0, 0.25, 0.375, 0.625, 0.75, 1];
    rect(xf + Math.round(0.4 * m), ySk + 1, L - Math.round(0.8 * m), yb - ySk - 1, blk2);     // under the skirt
    r = Math.round(0.33 * m); slv = Math.max(2, Math.round(0.10 * m));
    for (k = 0; k < 3; k++) {                                    // a Flexity's bogies are shrouded, not exposed
      c = xf + Math.round([0.13, 0.5, 0.87][k] * L);
      rect(c - Math.round(1.5 * m), ySk + 1, Math.round(3.0 * m), Math.max(1, yb - ySk - slv - 1), blk);
      for (j = -1; j <= 1; j += 2) {
        a = c + j * Math.round(0.95 * m);
        for (y = yb - slv; y < yb; y++) {                        // only a sliver of dark wheel/tread shows below
          n = r * r - (y - yb + r) * (y - yb + r);
          if (n < 0) continue;
          h = Math.round(Math.sqrt(n) * 0.6);
          hline(a - h, a + h, y, tread);
        }
      }
    }
    for (y = yRf; y <= ySk; y++) {                                                          // body
      h = (yb - y) / m;
      a = xf + Math.round((h < 0.55 ? (0.55 - h) * 0.3 : h < 1.05 ? 0 : h < 2.85 ? (h - 1.05) / 1.8 * 0.62 : 0.62 + (h - 2.85) / 0.43 * 0.6) * m);
      b = xr - Math.round((h < 1.4 ? 0 : h < 2.9 ? (h - 1.4) / 1.5 * 0.1 : 0.1 + (h - 2.9) / 0.38 * 0.32) * m);
      hline(a, b, y, y >= yW1 && y <= yW0 ? blk : y > ySk - 3 ? red2 : red);
      // the cab glazing rakes from xcab at the 2.95 m roofline down into the full-width 2.55 m glazing
      // line, instead of ending in a hard rectangular step
      if (y >= ycab && y <= yW0) { xc = y >= yW1 ? b : Math.round(xcab + (b - xcab) * (y - ycab) / (yW1 - ycab)); hline(a, xc, y, blk); }
      px(b, y, red3);
    }
    hline(xf + Math.round(1.25 * m), xr - Math.round(0.42 * m), yRf, red2);
    hline(xf + Math.round(0.2 * m), xr - 2, yb - Math.round(0.86 * m), C('#cf6250'));
    for (y = ycab + 2; y < ycab + Math.round(0.9 * m); y++) {                              // sky in the windscreen
      h = (yb - y) / m; a = xf + Math.round((h - 1.05) / 1.8 * 0.62 * m) + 3;
      for (x = a; x < xcab - 3; x++) if (BAY[((y - yb) & 3) * 4 + ((x - xf) & 3)] < 4 - (y - ycab) * 0.1 - (x - a) * 0.04) px(x, y, C('#3d4a63'));
    }
    var bw = Math.max(3, Math.round(0.34 * m));
    for (k = 1; k < 5; k++) {                                                               // bellows
      c = xf + Math.round(SEC[k] * L) - (bw >> 1);
      rect(c, yRf + 1, bw, ySk - yRf, blk2);
      for (y = yRf + 3; y < ySk; y += 3) hline(c, c + bw - 1, y, C('#4a555e'));
      vline(c - 1, yRf, ySk, red3); vline(c + bw, yRf, ySk, red3);
    }
    var p0 = yb - Math.round(2.45 * m), p1 = yb - Math.round(1.08 * m), post = Math.round(0.2 * m), pwant = Math.round(1.3 * m), seed = 0;
    for (k = 0; k < 5; k++) {                                                               // windows, section by section
      x0 = xf + Math.round(SEC[k] * L) + (k ? (bw >> 1) + Math.round(0.35 * m) : Math.round(2.45 * m));
      x1 = xf + Math.round(SEC[k + 1] * L) - (k < 4 ? (bw >> 1) + Math.round(0.35 * m) : Math.round(0.9 * m));
      n = Math.max(1, Math.round((x1 - x0 + post) / (pwant + post)));
      pw = (x1 - x0 - (n - 1) * post) / n;
      for (j = 0; j < n; j++) streetCarPane(Math.round(x0 + j * (pw + post)), p0, Math.round(pw), p1 - p0, seed++, k === 0 && j === 0);
    }
    for (y = yRf - 2; y < yRf; y++) hline(xf, xr, y, gry2);                               // plain roof skin between the fairings
    var pods = [[0.035, 0.225], [0.405, 0.595], [0.775, 0.965]];
    for (k = 0; k < 3; k++) {                                                               // roof equipment fairings
      a = xf + Math.round(pods[k][0] * L); b = xf + Math.round(pods[k][1] * L);
      for (y = yTop; y < yRf; y++) { j = Math.max(0, 3 - (y - yTop)) * 3; hline(a + j, b - j, y, y < yTop + 3 ? gry3 : gry); }
      hline(a + 9, b - 9, yTop, sunE > u(9) ? C('#f6f4ea') : gry3); hline(a + 1, b - 1, yRf - 1, gry2); hline(a + 1, b - 1, yRf - 2, gry2);
    }
    // single-arm pantograph: insulated base frame, lower arm up to a knee trailing rearward, upper arm forward to the
    // collector head, which is seen end-on and presses up under the wire
    var P = streetWire(), pc = xf + Math.round(0.5 * L), hc = pc - Math.round(0.15 * m), wy = streetWireY(P, hc), yB = yTop - Math.round(0.2 * m);
    var hx0 = pc - Math.round(0.75 * m), kx = pc + Math.round(0.9 * m), ky = Math.round(yB - (yB - wy) * 0.42), st = C('#6d777b'), st2 = C('#9aa3a6');
    for (k = -1; k <= 1; k += 2) { rect(pc + k * Math.round(0.6 * m) - 1, yB + 1, 3, yTop - yB - 1, gry3); hline(pc + k * Math.round(0.6 * m) - 2, pc + k * Math.round(0.6 * m) + 2, yB + 3, gry2); }
    hline(pc - Math.round(0.95 * m), pc + Math.round(0.95 * m), yB, blk); hline(pc - Math.round(0.95 * m), pc + Math.round(0.95 * m), yB - 1, st);
    limb(hx0, yB - 2, kx, ky, 2, 2, st, 0); limb(hx0, yB - 1, kx, ky + 1, 1, 1, blk, 0);
    limb(hx0 + Math.round(0.35 * m), yB - 1, kx - 2, ky + 2, 1, 1, st2, 0);
    rect(hx0 - 3, yB - 5, 6, 4, blk); rect(kx - 1, ky - 1, 3, 3, blk);
    limb(kx, ky, hc, wy + 4, 2, 2, st, 0); limb(kx, ky + 1, hc + 1, wy + 5, 1, 1, blk, 0);
    k = Math.round(0.2 * m);
    hline(hc - k, hc + k, wy + 1, blk); hline(hc - k + 1, hc + k - 1, wy + 2, st);
    px(hc - k - 1, wy + 2, blk); px(hc + k + 1, wy + 2, blk); px(hc - k - 2, wy + 3, blk); px(hc + k + 2, wy + 3, blk); px(hc - k - 3, wy + 4, blk); px(hc + k + 3, wy + 4, blk);
    rect(hc - 1, wy + 3, 3, 3, blk);
    y = yb - Math.round(0.8 * m);                                                           // lights
    rect(xf + 1, y - 2, Math.max(3, Math.round(0.12 * m)), 4, CR('#f6f4ea')); px(xf, y - 1, CR('#dfe6ea')); px(xf, y, CR('#dfe6ea'));
    rect(xr - Math.round(0.14 * m) - 2, yb - Math.round(1.2 * m), Math.round(0.14 * m), Math.max(3, Math.round(0.16 * m)), CR('#cf6250'));
    hline(xr - Math.round(0.5 * m), xr - Math.round(0.2 * m), yb - Math.round(3.1 * m), CR('#cf6250'));
    px(xf + Math.round(1.3 * m), yb - Math.round(3.15 * m), CR('#f4ac6b'));
  }
  function streetCarPane(x, y, w, h, s, sign) {
    // one window: the lit interior behind the glass (CR): LED ceiling strip, pale walls, seat backs, now and then
    // a rider facing the front of the car
    var mm = h / 1.37, sb = y + Math.round(h * 0.6), hx, k, c, hw = Math.max(3, Math.round(0.16 * mm)), hh = Math.max(4, Math.round(0.22 * mm));
    rect(x, y, w, h, CR('#9aa3a6'));
    hline(x, x + w - 1, y + 1, CR('#f6f4ea')); hline(x, x + w - 1, y + 2, CR('#dfe6ea'));
    rect(x, sb, w, y + h - sb, CR('#4a555e')); hline(x, x + w - 1, sb, CR('#6d777b'));
    for (k = 0; k < 2; k++) {
      if (hash(s * 13 + k * 7 + 3) > 0.42) continue;
      hx = x + 3 + Math.round(hash(s * 13 + k * 7 + 4) * (w - hw - 10)); c = CR(['#1f3f2c', '#3d4a63', '#7e3226', '#33251a', '#51565c'][(s + k) % 5]);
      rect(hx - 2, sb - Math.round(0.12 * mm), hw + 5, Math.round(0.12 * mm), c);
      rect(hx, sb - Math.round(0.12 * mm) - hh, hw, hh, CR('#33251a'));
      px(hx, sb - Math.round(0.12 * mm) - hh, CR('#9aa3a6')); px(hx + hw - 1, sb - Math.round(0.12 * mm) - hh, CR('#9aa3a6'));
      vline(hx, sb - Math.round(0.12 * mm) - hh + 3, sb - Math.round(0.12 * mm) - 2, CR('#a27850'));
    }
    if (sign && w > 38) { rect(x, y, w, 9, CR('#1d252b')); streetText('501 QUEEN', x + ((w - 35) >> 1), y + 2, 1, CR('#f4ac6b')); }
  }

  function pgGatePier(k) {
    // a gate pier's front face, positioned and sized like pgPier() but with its cross-wall reach
    // clamped so the near and far pier can never merge into one mass. The two piers are close
    // together in world depth (a 4 m opening at ~22-26 m out), so at this raking angle their own
    // natural face widths (each scaled independently from its own row) can add up to more screen
    // space than actually separates their anchor points; clamping the far pier's reach keeps the
    // opening visibly open at every progress. wallgate() calls this in place of pgPier().
    var E = 2.5 * W, G = PG_GATE;
    var fy = HZ + Math.round(E / G[k][0]), mm = (fy - HZ) / 2.5;
    if (fy >= H) return;
    var ph = Math.round(mm * 2.2), fw = Math.max(3, Math.round(mm * 0.55)), ct = Math.max(2, Math.round(mm * 0.14)), ov = Math.max(1, Math.round(mm * 0.05));
    var ax = seam(fy) - camX + mm * 0.075;
    if (k === 1) {
      var fy0 = HZ + Math.round(E / G[0][0]), mm0 = (fy0 - HZ) / 2.5, ax0 = seam(fy0) - camX + mm0 * 0.075;
      var minGap = Math.max(u(3), Math.round((ax - ax0) * 0.3));
      fw = Math.max(3, Math.min(fw, Math.round(ax - ax0 - minGap) + 1));
    }
    var fx = Math.round(ax) - fw + 1, j, n = 7, y0, y1;
    if (fx > W + u(12) || fx + fw < -u(12)) return;
    var face = C('#877d72'), joint = C('#6d777b'), dk = C('#51565c'), lit = C('#9aa3a6'), capc = C('#b3b8b2');
    rect(fx, fy - ph, fw, ph + 1, face);
    for (j = 0; j < n; j++) {
      y0 = fy - ph + Math.round(ph * j / n); y1 = fy - ph + Math.round(ph * (j + 1) / n);
      if (j) hline(fx, fx + fw - 1, y0, joint);
      vline(fx + Math.round(fw * (j & 1 ? 0.34 : 0.66)), y0, y1, joint);
    }
    vline(fx, fy - ph, fy, dk); vline(fx + fw - 1, fy - ph, fy, lit);
    rect(fx - ov, fy - ph - ct, fw + 2 * ov, ct, lit);
    hline(fx - ov, fx + fw + ov - 1, fy - ph - ct, capc);
    hline(fx + ov, fx + fw - ov - 1, fy - ph - ct - 1, capc);
    hline(fx, fx + fw - 1, fy - ph, dk);                       // shade under the cap's overhang
  }

  function pgSpurFix() {
    // pgBuild()'s own spur-width formula falls off with the SQUARE of distance from the horizon,
    // while every other object in the scene (mpx, and the main path's own pgPathW) scales linearly
    // in (y - HZ): recompute the spur's stored rows with that same linear falloff, right after
    // pgBuild() lays them out. Called from grass(), which always calls pgBuild() first. The wider,
    // corrected spur costs more to fill every frame in path(), so a bit 8 flag records, once here
    // at build time, whether this column's whole run clears the main path's worn edge (the common
    // case): path() then skips its per-row elw[] check there instead of paying it every frame.
    if (PG_SCR.spfw === W && PG_SCR.spfh === H) return;   // PG_SCR.spfw/spfh: lazy runtime cache keys, not a source edit to PG_SCR
    PG_SCR.spfw = W; PG_SCR.spfh = H;
    var E = 2.5 * W, gy = HZ + Math.round(E / ((PG_GATE[0][1] + PG_GATE[1][0]) / 2)), jy = HZ + Math.round(GH * 0.34);
    var gx = Math.round(seam(gy)), jx = Math.round(pgPathCx(0.34)), L = Math.max(1, jx - gx), ch = u(2), elw = PG_SCR.elw;
    var SP = PG_SCR.spur, n = SP.length >> 2, pk, j, f, yc, tv, wa, t0 = 0, t1 = 0, b0 = 0, b1 = 0, k, y0, y1, h1, s, r, rr, minE, safe;
    for (pk = -1e9, j = 0; j < n; j++) {
      f = j / L; f = 1 - (1 - f) * (1 - f);                    // heads into the park, then eases onto the path
      yc = gy + (jy - gy) * f; tv = Math.max(2, mpx(1.8, yc)); wa = Math.min(2, tv * 0.12);
      f = j / ch; k = f | 0; f -= k;                           // the wear wanders between knots 2 m apart
      if (k !== pk) { t0 = hash(k * 7 + 3); t1 = hash((k + 1) * 7 + 3); b0 = hash(k * 11 + 5); b1 = hash((k + 1) * 11 + 5); pk = k; }
      y0 = Math.round(yc - tv / 2 + (t0 + (t1 - t0) * f - 0.5) * 2 * wa); y1 = Math.min(H - 2, Math.round(yc + tv / 2 + (b0 + (b1 - b0) * f - 0.5) * 2 * wa) - 1);
      s = Math.max(y0, Math.floor(HZ + (ST - gx - j) / 0.9) + 1);
      h1 = hash(j * 13 + 1); r = h1 > 0.6 && y1 >= y0 ? y0 + ((h1 * 9973) | 0) % (y1 - y0 + 1) : -1;
      SP[j * 4] = s; SP[j * 4 + 1] = y1; SP[j * 4 + 2] = r >= s ? r : -1;
      minE = 1e9; for (rr = s; rr <= y1; rr++) if (elw[rr] < minE) minE = elw[rr];
      safe = (gx + j) < minE - 2 ? 8 : 0;
      SP[j * 4 + 3] = (h1 > 0.82 ? 1 : 0) | (s === y0 && ((h1 * 64) | 0) & 3 ? 2 : 0) | (((h1 * 256) | 0) & 3 ? 4 : 0) | safe;
    }
  }

  function pgFlowerShade() {
    // Contact shade along the flower bed's own base, where its mounded foliage (taller than the bin's
    // rim) meets the lawn - always there, the way any standing mass occludes the sky at its own feet,
    // simpler than a cast shadow since it just needs to read as sitting in the turf, not painted on it.
    // Reuses the same per-column top/bottom the drift was laid out with, so it never lags what flowers()
    // actually drew: the deepest (nearest) foliage row of each column, whichever depth band reaches it.
    // PG_SCR.fbx is created lazily here (a plain runtime property, not a source edit to PG_SCR itself).
    // Called from parkShadows().
    pgBuild();
    var D = PG_SCR.drift;
    if (!D || D.xb - camX < 0 || D.xa - camX >= W) return;
    var nh = D.nh, xm = D.xm - camX, T = D.t, B = D.b, n = D.nb * nh, j, c, x, bb;
    var c0 = Math.max(0, ((-xm) >> 1) - 1), c1 = Math.min(nh - 1, ((W - xm) >> 1) + 1);
    if (!PG_SCR.fbx || PG_SCR.fbx.length < nh) PG_SCR.fbx = new Int32Array(nh);
    var bx = PG_SCR.fbx;
    for (c = c0; c <= c1; c++) bx[c] = -1;
    for (j = 0; j < n; j += nh) for (c = c0; c <= c1; c++) {
      if (T[j + c] > B[j + c]) continue;
      if (B[j + c] > bx[c]) bx[c] = B[j + c];
    }
    for (c = c0; c <= c1; c++) {
      bb = bx[c]; if (bb < 0) continue;
      x = xm + 2 * c;
      if (x >= 0 && x < W) { shade(x, bb + 1, 0.30); shade(x, bb + 2, 0.14); }
      x++;
      if (x >= 0 && x < W) { shade(x, bb + 1, 0.30); shade(x, bb + 2, 0.14); }
    }
  }

  function wallgate() {
    // Low stone wall with an iron railing along the park side of the seam, built in metres. We stand
    // in the park, so we see its park face and, from 2.5 m up, the top of its coping. The wall face is
    // one column per row.
    var stone = C('#6d777b'), stone2 = C('#877d72'), joint = C('#51565c'), capc = C('#b3b8b2'), capd = C('#9aa3a6');
    var iron = C('#26292d'), glint = C('#4a555e'), side = C('#9aa3a6');
    var E = 2.5 * W, G = PG_GATE, g00 = G[0][0], g01 = G[0][1], g10 = G[1][0], g11 = G[1][1], m12 = u(12);
    var done0 = 0, done1 = 0, y, sx, dy, mm, dd, wh, top, th, ct, c1, sid, sid2, psid = -1, psid2 = -1, lj = -9, lj2 = -9;
    var pbid = -1, lb = -9, k, j, ph, x, rt, xc, bw, rh, ja, jb;
    for (y = HZ + 1; y < H; y++) {
      dy = y - HZ; mm = dy / 2.5; dd = E / dy; sx = Math.round(seam(y) - camX); th = Math.round(mm * 0.40);
      if (sx < -th - m12 || sx > W + m12) continue;
      if (!done1 && dd < g10) { pgGatePier(1); done1 = 1; }
      if (!done0 && dd < g00) { pgGatePier(0); done0 = 1; }
      if ((dd >= g00 && dd <= g01) || (dd >= g10 && dd <= g11)) {   // the pier's park-side face, 7 cm proud of the wall
        ph = Math.round(mm * 2.2); x = sx + Math.round(mm * 0.075);
        vline(x, y - ph, y, side);
        for (j = 1; j < 7; j++) px(x, y - ph + Math.round(ph * j / 7), stone);
        vline(x, y - ph - Math.max(2, Math.round(mm * 0.14)), y - ph - 1, capc);
        continue;
      }
      if (dd > g01 && dd < g10) continue;                     // the opening
      wh = Math.max(2, Math.round(mm * 0.70)); ct = Math.max(1, Math.round(mm * 0.08));
      top = y - wh; c1 = top + (wh >> 1);
      // two courses of 1.1 m stones, staggered; a joint closer than 3 rows to the last is dropped
      sid = Math.floor(dd / 1.1); sid2 = Math.floor(dd / 1.1 + 0.5);
      ja = jb = false;
      if (sid !== psid) { if (y - lj >= 3) { ja = true; lj = y; } psid = sid; }
      if (sid2 !== psid2) { if (y - lj2 >= 3) { jb = true; lj2 = y; } psid2 = sid2; }
      hline(sx - th, sx, top - ct, capc);                      // coping top, seen from above
      if (sx >= 0 && sx < W) {
        vline(sx, top - ct, top, capd);                        // coping edge, upper course, bed joint, lower course
        vline(sx, top + 1, c1 - 1, ja ? joint : hash(sid * 31 + 1) < 0.4 ? stone2 : stone);
        buf[c1 * W + sx] = joint;
        vline(sx, c1 + 1, y - 1, jb ? joint : hash(sid2 * 31 + 2) < 0.4 ? stone2 : stone);
        buf[y * W + sx] = jb ? joint : glint;
      }
      // railing on the wall's centre line: top rail, bottom rail, 2 cm bars every 13 cm
      rh = Math.round(mm * 0.9); xc = sx - (th >> 1); rt = top - ct - rh; bw = Math.max(1, Math.round(mm * 0.02));
      if (xc >= 0 && xc < W) {
        vline(xc, rt, rt + Math.max(1, Math.round(mm * 0.03)) - 1, iron);
        buf[(top - ct - Math.max(2, Math.round(mm * 0.10))) * W + xc] = iron;
      }
      k = Math.floor(dd / 0.13);
      if (k !== pbid && y - lb >= 3) {
        for (j = 0; j < bw; j++) vline(xc + j, rt, rt + rh - 1, iron);
        px(xc, rt - 1, glint); lb = y;
      }
      pbid = k;
    }
  }  function pgBlades(j) {
    // One row of blade slots (packed in pgBuild), on world columns so the blades stay rooted as the ground pans. Past
    // ~40 m a blade is under a pixel; toward the viewer rows and slots open up while the blades lengthen, near grass grows
    // as two or three blades fanning from one root, and every root is jittered so no row of tips lines up.
    var BK = PG_SCR.bk, BR = PG_SCR.brow, bg = PG_SCR.bg, bd = PG_SCR.bd, bt = PG_SCR.bt, y = BR[j], bs = BR[j + 1], fl = BR[j + 2], base = BR[j + 3] + 1, bi = fl & 7;
    var i = Math.floor((Math.max(0, Math.round(seam(y) - camX) - 2) + camX) / bs) - 1, i1 = Math.ceil((camX + W) / bs), v, x, o, cv, k, a, b, h, h2, t0, q;
    for (; i <= i1; i++) {
      v = BK[base + i];
      if (!v) continue;
      if (!(v & 0x40000000)) { px(i * bs - camX, y - 1, v & 0x10000000 ? PG_SCR.wf : PG_SCR.wf2); continue; }   // the odd clover or dandelion head
      x = i * bs - camX + (v & 63);
      if (x < 6 || x > W - 7) continue;
      o = (y + ((v >> 6) & 31)) * W + x; cv = buf[o];          // take the tone actually under the root, not the row's band
      k = cv === bg[bi] ? bi : bi < 4 && cv === bg[bi + 1] ? bi + 1 : bi > 0 && cv === bg[bi - 1] ? bi - 1 : bi;
      a = bd[k]; b = bt[k]; h = (v >> 11) & 31;
      for (q = o - (h - 1) * W; q <= o; q += W) buf[q] = a;
      buf[o - h * W + ((v >> 16) & 1)] = b;
      if (!(fl & 8)) continue;
      h2 = (h * 3) >> 2;                                       // a second blade arching left from the same root
      for (t0 = 0; t0 < h2; t0++) buf[o - t0 * W - 1 - (t0 >> 2)] = a;
      buf[o - h2 * W - 1 - (h2 >> 2)] = (v >> 17) & 1 ? b : a;
      if (!((v >> 18) & 1)) continue;
      h2 = (h * 5) >> 3;                                       // and now and then a third, arching right
      for (t0 = 0; t0 < h2; t0++) buf[o - t0 * W + 1 + (t0 >> 2)] = a;
      buf[o - h2 * W + 1 + (h2 >> 2)] = b;
    }
  }  function pgEdge(i, ye, amp, z) {
    // One tone edge of the lawn: a dithered ramp a tenth as deep as the band below it, stepped over five Bayer levels,
    // around a wander cached per 4 px world cell (pgBuild). Only pixels that differ from the fill are written: in each
    // Bayer phase that is one stride of rows, between the fill's edge row and the row where the ramp passes that
    // pixel's threshold. The four phases are written out so the loop stays shallow.
    var OF = PG_SCR.ofw, SO = PG_SCR.so, of = i * PG_SCR.ofn, c0 = PG_SCR.bg[i], c1 = PG_SCR.bg[i + 1], W4 = 4 * W, x, wx, e, q, s, yy, o;
    for (x = Math.max(0, Math.round(seam(ye + 2 * amp + z + 1) - camX) - 2); x < W; x++) {
      wx = x + camX; e = ye + OF[of + (wx >> 2)]; q = i * 16 + ((wx & 3) << 2);
      s = e + SO[q];
      if (s < ye) for (yy = s + ((0 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((0 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0;
      s = e + SO[q + 1];
      if (s < ye) for (yy = s + ((1 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((1 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0;
      s = e + SO[q + 2];
      if (s < ye) for (yy = s + ((2 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((2 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0;
      s = e + SO[q + 3];
      if (s < ye) for (yy = s + ((3 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((3 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0;
    }
  }  function pgDrift() {
    // The flower drift in world x, laid front to back in pairs of columns. Each pair keeps only the rows that show above
    // everything nearer, and a stalk is kept only where it rises out of foliage and its head clears that foliage and
    // everything nearer; flowers() just pans and writes the result.
    var y0 = HZ + Math.round(GH * 0.40), y1 = HZ + Math.round(GH * 0.54), el = PG_SCR.elw, m = u(3), wa = u(3), xa = 1e9, xb = -1e9, gy, uu, k, f, n, le, re;
    var FL = new Int32Array(y1 - y0 + 1);
    for (gy = y0; gy <= y1; gy++) {
      uu = (gy - HZ) / GH; re = el[gy] - m;
      k = Math.floor(gy / 6); f = gy / 6 - k; f = f * f * (3 - 2 * f); n = hash(k * 7 + 77); n += (hash((k + 1) * 7 + 77) - n) * f;
      le = re - Math.round(0.08 * W * uu / 0.43) + Math.round((n - 0.5) * 2 * u(4));
      FL[gy - y0] = le;
      if (le < xa) xa = le;
      if (re > xb) xb = re;
    }
    xb += 3 * wa;                                              // room for plants bulging past the edge
    var xm = xa - (xa & 1), nh = ((xb - xm) >> 1) + 2, nb = 0, g0 = y1 - ((y1 - y0) % 3);
    for (gy = g0; gy >= y0; gy -= 3) nb++;
    var hz = new Int32Array(nh), ot = new Int32Array(nh), DT = new Int16Array(nb * nh), DB = new Int16Array(nb * nh), DO = new Int32Array(nb * nh), SL = new Int32Array(4096);
    hz.fill(1e9); DT.fill(32767);
    var sp = u(2), wc = u(5), ns = 0, bo = 0, cw, kn, pk, pw, na = 0, nb2 = 0, wn0 = 0, wn1 = 0, cl, xt, hc, mh, top, lim, b, c, x, x0, x1, tw, tp, fw, kw, wn;
    var gx, ga, gb, bs, ph, hx, hy, j, sps, hb, nn;
    for (gy = g0; gy >= y0; gy -= 3, bo += nh) {
      f = (gy - y0) / (y1 - y0); tw = Math.min(1, 0.35 + Math.min(f, 1 - f) * 3.25); tp = mpx(0.35, gy) * tw;
      le = FL[gy - y0]; re = el[gy] - m; cw = Math.max(4, Math.round(mpx(0.3, gy))); fw = mpx(0.8, gy); pk = pw = -1e9;
      x0 = Math.max(xm, le); x0 -= x0 & 1; x1 = Math.min(xb, el[gy - 2] - m + 3 * wa);
      for (x = x0; x <= x1; x += 2) {
        c = (x - xm) >> 1;
        kw = Math.floor(x / wc);                               // the path side: a smooth wander, and now and then a plant bulging out
        if (kw !== pw) { wn0 = hash(kw * 37 + 11); wn1 = hash((kw + 1) * 37 + 11); pw = kw; }
        f = x / wc - kw; f = f * f * (3 - 2 * f); f = wn0 + (wn1 - wn0) * f;
        wn = (f - 0.5) * 2 * wa + (f > 0.75 ? (f - 0.75) * 8 * wa : 0);
        b = gy + 1;
        while (b >= gy - 2 && x > el[b] - m + wn) b--;         // the lowest row this column reaches before the path margin
        if (b < gy - 2) { ot[c] = 1e9; continue; }
        kn = Math.floor(x / cw);                               // plant clumps ~30 cm across
        if (kn !== pk) { na = hash(kn * 53 + gy * 7); nb2 = hash((kn + 1) * 53 + gy * 7); pk = kn; }
        f = x / cw - kn; f = f * f * (3 - 2 * f); cl = na + (nb2 - na) * f;
        xt = Math.min(1, 0.2 + 0.8 * (x - le) / fw);           // the drift thins out at its far end
        hc = hash(x * 13 + gy * 7);
        mh = Math.round(tp * xt * (0.30 + cl * 0.70 + hc * 0.20)); top = gy - mh;
        if (top > b) { ot[c] = 1e9; continue; }
        ot[c] = top; lim = hz[c];
        if (top >= lim) continue;
        if (b >= lim) b = lim - 1;
        DT[bo + c] = top; DB[bo + c] = b; DO[bo + c] = (hc * 1048576) | 0;
      }
      bs = Math.max(3, Math.round(mpx(0.06, gy)));
      ga = Math.ceil(le / sp); gb = Math.floor(re / sp);
      for (gx = ga; gx <= gb; gx++) {
        if (hash(gx * 23 + gy * 19 + 1) < 0.45) continue;
        x = gx * sp + Math.round((hash(gx * 29 + gy * 5) - 0.5) * u(1.5));
        if (x < le || x > re) continue;
        xt = Math.min(1, 0.2 + 0.8 * (x - le) / fw);
        if (hash(gx * 31 + gy) > xt) continue;                 // stalks thin out with the foliage
        sps = hash(Math.floor(gx / 7) * 7 + 11) * 0.75 + hash(gx * 7 + gy * 13 + 3) * 0.25;   // species come in drifts
        nn = hash(gx * 3 + gy * 11) < 0.3 ? 2 : 1;
        for (j = 0; j < nn; j++) {
          ph = Math.round(mpx(0.45 + hash(gx * 17 + gy * 3 + j * 5) * 0.30, gy) * tw * xt);
          hx = x + (j ? Math.round((hash(gx * 41 + gy + j) - 0.5) * bs * 3) : 0); hy = gy - ph;
          if (hx < x0 || hx > x1) continue;
          c = (hx - xm) >> 1; lim = ot[c];
          if (lim > gy - 4 || xt < 0.3) continue;              // no foliage here to rise out of
          if (hz[c] < lim) lim = hz[c];
          hb = hy + (sps < 0.62 ? 1 : sps < 0.76 ? 2 : bs + 1);
          if (hb >= lim - 1 || ns > SL.length - 4) continue;   // the head would sit in or behind the foliage
          SL[ns++] = hx; SL[ns++] = hy; SL[ns++] = lim - 1; SL[ns++] = (sps < 0.42 ? 0 : sps < 0.62 ? 1 : sps < 0.76 ? 2 : 3) | bs << 4;
        }
      }
      for (x = x0; x <= x1; x += 2) { c = (x - xm) >> 1; if (ot[c] < hz[c]) hz[c] = ot[c]; }
    }
    PG_SCR.drift = { xa: xa, xb: xb, xm: xm, nh: nh, nb: nb, t: DT, b: DB, o: DO, sl: SL, ns: ns };
  }  function pgBuild() {
    // The park ground's world-fixed geometry, built once per buffer size: the lawn's tone-edge wander and ramp strides,
    // every blade slot, the path's centre and worn edges, the gate spur and the whole flower drift. A frame then only
    // pans it by camX and writes pixels, so no noise, hashing or culling is redone while scrolling.
    if (PG_SCR.kw === W && PG_SCR.kh === H) return;
    PG_SCR.kw = W; PG_SCR.kh = H;
    var edges = [0.10, 0.25, 0.45, 0.70, 1], nc = W + 4, OF = PG_SCR.ofw = new Int8Array(4 * nc), SO = PG_SCR.so, LB = PG_LB;
    var i, j, k, wx, G, amp, gg, kk, ff, v, na = 0, nb = 0, nc2 = 0, nd = 0, pk, pk2, z, nz, s, y, uu, ys = 2, bs, hb, dens, bi, r, rr, n, base, h;
    PG_SCR.ofn = nc;
    for (i = 0; i < 4; i++) {                                  // two octaves of tone-edge wander on 4 px world cells
      G = 0.12 * W * (0.5 + edges[i]); amp = u(0.6) + Math.round(edges[i] * u(2.6)); pk = pk2 = -1e9;
      z = Math.max(1, Math.round(0.10 * (edges[i + 1] - edges[i]) * GH)); nz = 2 * z + 1;
      for (j = 0; j < 16; j++) { s = LB[BAY[(j & 3) * 4 + (j >> 2)]]; SO[i * 16 + j] = (s === 5 ? nz : Math.max(0, Math.ceil(s * nz / 5 - 0.5))) - z; }
      for (k = 0; k < nc; k++) {
        wx = k * 4; gg = wx / G; kk = Math.floor(gg);
        if (kk !== pk) { na = hash(kk * 97 + i * 13 + 5); nb = hash((kk + 1) * 97 + i * 13 + 5); pk = kk; }
        ff = gg - kk; ff = ff * ff * (3 - 2 * ff); v = na + (nb - na) * ff;
        gg = wx * 5 / G; kk = Math.floor(gg);
        if (kk !== pk2) { nc2 = hash(kk * 89 + i * 17 + 3); nd = hash((kk + 1) * 89 + i * 17 + 3); pk2 = kk; }
        ff = gg - kk; ff = ff * ff * (3 - 2 * ff); v += (nc2 + (nd - nc2) * ff - 0.5) * 0.6;
        OF[i * nc + k] = Math.round((v - 0.5) * 2 * amp);
      }
    }
    // blade slots, one packed word each: bit 30 a blade (x in its slot, root row, height, lean, lit tips, a third
    // blade), bit 29 a clover or dandelion head instead
    for (n = 0, j = 0, y = HZ + Math.round(GH * 0.22); y < H; y += ys, n++) {
      uu = (y - HZ) / GH; ys = Math.max(2, Math.round(u(1) + uu * u(1.2))); j += Math.ceil(4 * W / Math.round(u(3) + uu * u(3))) + 4;
    }
    var BR = PG_SCR.brow = new Int32Array(n * 4), BK = PG_SCR.bk = new Uint32Array(j);
    PG_SCR.brn = n * 4;
    for (n = 0, base = 0, y = HZ + Math.round(GH * 0.22); y < H; y += ys, n += 4) {
      uu = (y - HZ) / GH; ys = Math.max(2, Math.round(u(1) + uu * u(1.2))); bs = Math.round(u(3) + uu * u(3));
      hb = mpx(0.045 + 0.035 * uu, y); dens = Math.min(0.95, 0.45 + uu * 0.60); bi = uu < 0.10 ? 0 : uu < 0.25 ? 1 : uu < 0.45 ? 2 : uu < 0.70 ? 3 : 4;
      BR[n] = y; BR[n + 1] = bs; BR[n + 2] = bi | (uu >= 0.45 ? 8 : 0); BR[n + 3] = base;
      k = Math.ceil(4 * W / bs) + 4;
      for (j = 0; j < k; j++) {
        r = hash((j - 1) * 7 + y * 3);
        if (r > dens) { if (r > 0.9965 && uu > 0.3) BK[base + j] = 0x20000000 | (r > 0.9983 ? 0x10000000 : 0); continue; }
        rr = (r * 4294967296) | 0;
        if (y + ((((rr >>> 8) & 255) * ys) >> 8) >= H) continue;
        h = Math.min(31, Math.max(1, Math.round(hb * (0.75 + ((rr >>> 16) & 63) / 126))));
        BK[base + j] = (0x40000000 | Math.min(63, ((rr & 255) * bs) >> 8) | ((((rr >>> 8) & 255) * ys) >> 8) << 6 | h << 11 |
          ((rr >>> 22) & 1) << 16 | ((rr >>> 23) & 1) << 17 | (uu < 0.62 || (rr >>> 24) & 3 ? 0 : 1) << 18) >>> 0;
      }
      base += k;
    }
    // the main path's centre and worn edges in world x
    var elw = PG_SCR.elw = new Int32Array(H), erw = PG_SCR.erw = new Int32Array(H), pcw = PG_SCR.pcw = new Int32Array(H), wr = u(1.5), w, sx;
    for (y = HZ + 1; y < H; y++) {
      uu = (y - HZ) / GH; w = pgPathW(uu); sx = Math.round(pgPathCx(uu)); r = (y / 3) | 0;
      pcw[y] = sx;
      elw[y] = sx - w - Math.round((hash(r * 7 + 3) - 0.5) * wr * uu);
      erw[y] = sx + w + Math.round((hash(r * 11 + 5) - 0.5) * wr * uu);
    }
    // the spur, one world column at a time: its first and last row (clipped to the park side of the wall), a gravel
    // speck, and which worn outline pixels it keeps
    var E = 2.5 * W, gy = HZ + Math.round(E / ((PG_GATE[0][1] + PG_GATE[1][0]) / 2)), jy = HZ + Math.round(GH * 0.34);
    var gx = Math.round(seam(gy)), jx = Math.round(pgPathCx(0.34)), L = Math.max(1, jx - gx), ch = u(2), SP, f, yc, tv, wa, t0 = 0, t1 = 0, b0 = 0, b1 = 0, y0, y1, h1;
    n = Math.max(0, jx - gx + 1); SP = PG_SCR.spur = new Int16Array(n * 4); PG_SCR.spg = gx; PG_SCR.spj = jx;
    for (pk = -1e9, j = 0; j < n; j++) {
      f = j / L; f = 1 - (1 - f) * (1 - f);                    // heads into the park, then eases onto the path
      yc = gy + (jy - gy) * f; tv = Math.max(2, 1.8 * (yc - HZ) * (yc - HZ) / E); wa = Math.min(2, tv * 0.12);
      f = j / ch; k = f | 0; f -= k;                           // the wear wanders between knots 2 m apart
      if (k !== pk) { t0 = hash(k * 7 + 3); t1 = hash((k + 1) * 7 + 3); b0 = hash(k * 11 + 5); b1 = hash((k + 1) * 11 + 5); pk = k; }
      y0 = Math.round(yc - tv / 2 + (t0 + (t1 - t0) * f - 0.5) * 2 * wa); y1 = Math.min(H - 2, Math.round(yc + tv / 2 + (b0 + (b1 - b0) * f - 0.5) * 2 * wa) - 1);
      s = Math.max(y0, Math.floor(HZ + (ST - gx - j) / 0.9) + 1);
      h1 = hash(j * 13 + 1); r = h1 > 0.6 && y1 >= y0 ? y0 + ((h1 * 9973) | 0) % (y1 - y0 + 1) : -1;
      SP[j * 4] = s; SP[j * 4 + 1] = y1; SP[j * 4 + 2] = r >= s ? r : -1;
      SP[j * 4 + 3] = (h1 > 0.82 ? 1 : 0) | (s === y0 && ((h1 * 64) | 0) & 3 ? 2 : 0) | (((h1 * 256) | 0) & 3 ? 4 : 0);
    }
    pgDrift();
  }  function pgPathRows() {
    // the main path's centre and worn left and right edges on every ground row, in screen x for this frame, for
    // path(), pgPad() and tufts(); the world-x rows are built once in pgBuild
    pgBuild();
    if (PG_SCR.el.length < H) { PG_SCR.el = new Int32Array(H); PG_SCR.er = new Int32Array(H); PG_SCR.pc = new Int32Array(H); }
    var el = PG_SCR.el, er = PG_SCR.er, pc = PG_SCR.pc, A = PG_SCR.elw, B = PG_SCR.erw, P = PG_SCR.pcw, y;
    for (y = HZ + 1; y < H; y++) { el[y] = A[y] - camX; er[y] = B[y] - camX; pc[y] = P[y] - camX; }
  }  function pgPathCx(uu) { return 2.78 * W - 0.76 * W * Math.pow(uu, 1.35) + 0.02 * W * uu; }  function pgPathW(uu) {                                     // the main path is 2 m wide on flat ground, so its screen width follows y - HZ
    return Math.max(1, Math.round(0.5 + uu * 0.075 * W));
  }  function pgPier(k) {
    // a gate pier's front face: coursed stone, darker edge away from the sun, an overhanging cap
    var fy = HZ + Math.round(2.5 * W / PG_GATE[k][0]), mm = (fy - HZ) / 2.5;
    if (fy >= H) return;
    var ph = Math.round(mm * 2.2), fw = Math.max(3, Math.round(mm * 0.55)), ct = Math.max(2, Math.round(mm * 0.14)), ov = Math.max(1, Math.round(mm * 0.05));
    var fx = Math.round(seam(fy) - camX + mm * 0.075) - fw + 1, j, n = 7, y0, y1;
    if (fx > W + u(12) || fx + fw < -u(12)) return;
    var face = C('#877d72'), joint = C('#6d777b'), dk = C('#51565c'), lit = C('#9aa3a6'), capc = C('#b3b8b2');
    rect(fx, fy - ph, fw, ph + 1, face);
    for (j = 0; j < n; j++) {
      y0 = fy - ph + Math.round(ph * j / n); y1 = fy - ph + Math.round(ph * (j + 1) / n);
      if (j) hline(fx, fx + fw - 1, y0, joint);
      vline(fx + Math.round(fw * (j & 1 ? 0.34 : 0.66)), y0, y1, joint);
    }
    vline(fx, fy - ph, fy, dk); vline(fx + fw - 1, fy - ph, fy, lit);
    rect(fx - ov, fy - ph - ct, fw + 2 * ov, ct, lit);
    hline(fx - ov, fx + fw + ov - 1, fy - ph - ct, capc);
    hline(fx + ov, fx + fw - ov - 1, fy - ph - ct - 1, capc);
    hline(fx, fx + fw - 1, fy - ph, dk);                       // shade under the cap's overhang
  }
  function path() {
    var g = C('#b98761'), g2 = C('#d9b48c'), e = C('#8a6a3f'), n = Math.max(1, u(2)), el, er, pc, y, sx, i, xl, xr, x, o, k, xs, r;
    pgPathRows(); el = PG_SCR.el; er = PG_SCR.er; pc = PG_SCR.pc;
    for (y = HZ + 1; y < H; y++) {
      xl = el[y]; xr = er[y]; sx = pc[y];
      if (xr < -u(4) || xl > W + u(4)) continue;
      hline(xl, xr, y, g);
      if (y % 3 === 0) for (k = 0, o = y * W; k < 4; k++) if (BAY[(y & 3) * 4 + k] < 6) {   // dither phases, stepped 4 px at a time
        xs = xl + ((k - (xl - sx)) & 3);
        for (x = xs < 0 ? xs + (((3 - xs) >> 2) << 2) : xs; x <= Math.min(W - 1, xr); x += 4) buf[o + x] = g2;
      }
      for (i = 0; i < n; i++) {                                 // gravel
        r = hash(y * 31 + i * 7);
        if (r > 0.55) px(xl + Math.round((r - 0.55) / 0.45 * (xr - xl)), y, ((r * 1e4) | 0) & 1 ? g2 : e);
      }
      if (y - HZ > 0.2 * GH) { px(xl - 1, y, e); px(xr + 1, y, e); }
    }
    // The spur from the gate opening to the main path: 1.8 m of gravel crossing the lawn, dithered like the path, its
    // edges worn (columns cached in pgBuild). On every row it stops at the main path's worn edge and takes over that
    // edge's outline pixel, so the two gravels run together without a seam.
    var SP = PG_SCR.spur, gx = PG_SCR.spg - camX, jx = PG_SCR.spj - camX, elw = PG_SCR.elw, W3 = 3 * W, c, ys, y1, fl, xw, xe;
    if (gx > W || jx < 0) return;
    for (x = Math.max(0, gx), xe = Math.min(W - 1, jx); x <= xe; x++) {
      c = (x - gx) * 4; ys = SP[c]; y1 = SP[c + 1];
      if (ys > y1) continue;
      xw = x + camX; fl = SP[c + 3];
      if (fl & 8) {                                           // pgSpurFix already proved this column's [ys,y1] run clears elw
        for (r = ys, o = r * W + x; r <= y1; r++, o += W) buf[o] = g;
        for (r = ys + (3 - ys % 3) % 3, o = r * W + x; r <= y1; r += 3, o += W3) if (BAY[(r & 3) * 4 + ((x - gx) & 3)] < 6) buf[o] = g2;
      } else {
        for (r = ys, o = r * W + x; r <= y1; r++, o += W) if (xw < elw[r]) buf[o] = g;
        for (r = ys + (3 - ys % 3) % 3, o = r * W + x; r <= y1; r += 3, o += W3) if (xw < elw[r] && BAY[(r & 3) * 4 + ((x - gx) & 3)] < 6) buf[o] = g2;
      }
      r = SP[c + 2];
      if (r >= 0 && xw < elw[r]) buf[r * W + x] = fl & 1 ? g2 : e;
      if (fl & 2 && xw < elw[ys - 1] - 1) buf[(ys - 1) * W + x] = e;      // worn outline, a quarter of it gone
      if (fl & 4 && xw < elw[y1 + 1] - 1) buf[(y1 + 1) * W + x] = e;
    }
  }
  function bench() {
    // A slatted park bench on black cast-iron end frames, 1.8 m x 0.85 m, drawn in true perspective:
    // the back plane sits 0.5 m behind the front legs, so it is a touch smaller and nearer the centre.
    // Its backrest faces us and away from the sun (in shade, top edges lit); the seat top takes the sun.
    var w = Math.round(0.09 * W), x = sxOf(2.31 * W - w, 1), y = HZ + Math.round(GH * 0.66);
    if (x > W + u(40) || x + w < -u(40)) return;
    var dy = y - HZ, yb = y - Math.round(0.5 * dy * dy / (2.5 * W)), dyb = yb - HZ, sb = dyb / dy;
    var iron = C('#26292d'), glint = C('#4a555e'), lit = C('#b98761'), wood = C('#8a6a3f'), shd = C('#6f573c'), deep = C('#57422a'), ink = C('#33251a');
    var lw = Math.max(3, Math.round(mpx(0.06, y))), ah = Math.max(2, Math.round(mpx(0.035, y))), bt = Math.max(2, Math.round(mpx(0.05, y)));
    var ends = [x + u(1), x + w - u(1) - lw], j, e, eb, r, f, xa, xz, ya, yz, n, s, sg;
    function XB(v) { return Math.round(W / 2 + (v - W / 2) * sb); }
    function zf(m) { return y - Math.round(m * dy / 2.5); }
    function zb(m) { return yb - Math.round(m * dyb / 2.5); }
    for (j = 0; j < 2; j++) {                                  // rear legs and back uprights, one casting
      e = XB(ends[j]); rect(e + 1, zb(0.87), lw - 2, yb - zb(0.87) + 1, iron); hline(e - 1, e + lw, yb, iron);
    }
    xa = XB(x); xz = XB(x + w) - 1;
    for (j = 0; j < 3; j++) {                                  // three back slats, 8.5 cm with 3.5 cm gaps
      ya = zb(0.85 - j * 0.12); yz = zb(0.765 - j * 0.12);
      rect(xa, ya, xz - xa + 1, yz - ya, shd);
      hline(xa, xz, ya, lit); hline(xa, xz, yz - 1, deep);
    }
    var sB = zb(0.46), sF = zf(0.46), g1, g2;
    g1 = Math.round((sF - sB) * 0.36); g2 = Math.round((sF - sB) * 0.70);
    for (r = sB; r <= sF; r++) {                               // seat top: back edge to front edge
      f = sF > sB ? (r - sB) / (sF - sB) : 1;
      hline(Math.round(xa + (x - xa) * f) - 1, Math.round(xz + (x + w - 1 - xz) * f) + 1, r, r - sB === g1 || r - sB === g2 ? wood : lit);
    }
    for (j = 0; j < 2; j++) {
      e = ends[j]; eb = XB(e); ya = zf(0.66); yz = zb(0.66); n = Math.max(1, Math.abs(e - eb), ya - yz);
      for (s = 0; s <= n; s++) rect(Math.round(eb + (e - eb) * s / n) - 1, Math.round(yz + (ya - yz) * s / n), lw + 2, ah, iron);   // armrest
      hline(e - 1, e + lw, ya, glint);
      rect(e + 1, ya + ah, lw - 2, sF - ya - ah + 1, iron);    // arm support
      rect(e, sF + 1, lw, y - sF, iron);                       // front leg
      sg = (sunX - e - (lw >> 1)) / (0.30 * W);                // the glint works round the leg with the sun, and is off while the sun is nearly behind it
      if (sg > 0.2 || sg < -0.2) vline(sg > 0 ? e + lw - 1 : e, sF + bt + 1, y - 1, glint);
      hline(e - 2, e + lw + 1, y, iron);                       // foot
    }
    rect(x - 1, sF + 1, w + 2, bt, wood);                      // seat front board, over the frames
    hline(x - 1, x + w, sF + 1, lit); hline(x - 1, x + w, sF + bt, ink);
  }
  function flowers() {
    // A pollinator drift along the path (black-eyed Susan, New England aster, coneflower, goldenrod): a knee-high foliage
    // mass with flower stalks rising out of it, thinning out at its far end; its path side follows the path's worn edge
    // with a plant bulging past it here and there. pgDrift lays it out once in world x, already culled so nothing is
    // painted twice; a frame pans it, writes the visible column pairs and draws the stalks back to front.
    pgBuild();
    var D = PG_SCR.drift, nh = D.nh, xm = D.xm - camX;
    if (D.xb - camX < 0 || D.xa - camX >= W) return;
    var T = D.t, B = D.b, O = D.o, SL = D.sl, FC = PG_SCR.fc, LF = PG_LEAF, lt = C('#376b45'), lt2 = C(sunE > u(9) ? '#4e9b46' : '#376b45'), stem = C(sunE > u(9) ? '#376b45' : '#2a5138');
    FC[0] = C('#1f3f2c'); FC[1] = lt; FC[2] = C('#2a5138');
    var c0 = Math.max(0, ((-xm) >> 1) - 1), c1 = Math.min(nh - 1, ((W - xm) >> 1) + 1), n = D.nb * nh, j, c, x, top, b, o, yy, off, hx, hy, k, bs;
    for (j = 0; j < n; j += nh) for (c = c0; c <= c1; c++) {
      top = T[j + c]; b = B[j + c];
      if (top > b) continue;
      x = xm + 2 * c; off = O[j + c];
      if (x >= 0 && x < W) { o = top * W + x; buf[o] = off & 1 ? lt2 : lt; for (yy = top + 1, o += W; yy <= b; yy++, o += W) buf[o] = FC[LF[(off + yy) & 1023]]; }
      x++;
      if (x >= 0 && x < W) { o = top * W + x; buf[o] = off & 2 ? lt2 : lt; off >>= 10; for (yy = top + 1, o += W; yy <= b; yy++, o += W) buf[o] = FC[LF[(off + yy) & 1023]]; }
    }
    var yel = C('#f2d24a'), amb = C('#e0a94e'), brn = C('#4b3827'), pink = C('#e08fa8'), rust = C('#7e3226'), pur = C('#6d5b93');
    for (j = D.ns - 4; j >= 0; j -= 4) {
      hx = SL[j] - camX;
      if (hx < 2 || hx > W - 3) continue;
      hy = SL[j + 1]; b = SL[j + 2]; k = SL[j + 3] & 15; bs = SL[j + 3] >> 4;
      for (yy = hy + 1, o = yy * W + hx; yy <= b; yy++, o += W) buf[o] = stem;
      if (k === 0) {                                           // black-eyed Susan: gold rays round a dark cone
        hline(hx - 1, hx + 1, hy - 1, yel); hline(hx - 2, hx + 2, hy, yel); hline(hx - 1, hx + 1, hy + 1, amb);
        px(hx, hy, brn); if (bs > 5) px(hx, hy - 1, brn);
      } else if (k === 1) {                                    // New England aster: small purple heads, yellow eye
        px(hx, hy - 1, pur); hline(hx - 1, hx + 1, hy, pur); px(hx, hy + 1, pur); if (bs > 4) px(hx, hy, yel);
      } else if (k === 2) {                                    // coneflower: raised rust cone, pink rays drooping
        px(hx, hy - 1, rust); px(hx, hy, rust); hline(hx - 2, hx + 2, hy + 1, pink); px(hx - 2, hy + 2, pink); px(hx + 2, hy + 2, pink);
      } else {                                                 // goldenrod: an arching plume
        for (c = 0; c < bs + 2; c++) px(hx + (c & 1 ? 1 : -1) * ((c >> 1) % 2) + (c > bs ? 1 : 0), hy + c, c % 3 ? yel : amb);
      }
    }
  }

  // ---------- the things left in the grass ----------
  function props() {
    // true size on the camera (a 32 cm laptop, a cap, a letter-size notebook) and close together, as one
    // armful set down in the shade in front of the tree
    var y = HZ + Math.round(GH * 0.80);
    laptop(sxOf(3.555 * W, 1), y);
    cap(sxOf(3.600 * W, 1), y + 2);
    notebook(sxOf(3.634 * W, 1), y + 1);
  }  function treeLit(x0, y0, x1, y1, dark, paint) {
    // draw a prop, then, when it sits in the crown's shade, shade exactly the pixels it painted
    if (!dark) { paint(); return; }
    var w = x1 - x0 + 1, P = TREE_M.pp, x, y, i = 0, ok;
    if (!P || P.length < w * (y1 - y0 + 1)) P = TREE_M.pp = new Uint32Array(w * (y1 - y0 + 1));
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) P[i++] = x >= 0 && y >= 0 && x < W && y < H ? buf[y * W + x] : 0;
    paint();
    for (i = 0, y = y0; y <= y1; y++) for (x = x0; x <= x1; x++, i++) {
      ok = x >= 0 && y >= 0 && x < W && y < H;
      if (ok && buf[y * W + x] !== P[i]) shade(x, y, TREE_SHADE);
    }
  }
  function parkProps() {
    binProp(sxOf(2.17 * W, 1), HZ + Math.round(GH * 0.66));   // on the bench pad, 0.4 m off its left end
  }
  // A solid light line across the top of a dark box reads as a stripe on a box. The lid catches
  // the sky in a dither instead, and the clamshell seam is what says "laptop".
  function laptop(x, by) {
    // An open 32 cm laptop, screen toward us and asleep: aluminium deck with a keyboard well foreshortened
    // to a few rows, a thin front edge, a dark glass screen in a bezel with the sky caught in one corner.
    var lw = Math.max(9, Math.round(mpx(0.32, by))), f = (by - HZ) / W;          // f: how flat ground foreshortens
    var dd = Math.max(2, Math.round(mpx(0.22, by) * f)), th = Math.max(1, Math.round(mpx(0.016, by)));
    var sh = Math.max(6, Math.round(mpx(0.205, by))), hy = by - th - dd, k, j;
    if (x > W + lw + 2 || x + lw < -2) return;
    var dark = treeShadeAt(x + (lw >> 1), by);
    for (k = x; k < x + lw; k++) shade(k, by + 1, dark ? 0.22 : 0.35);
    if (!dark) shadow(x + 1, hy, lw - 2, sh);
    treeLit(x - 1, hy - sh - 1, x + lw, by, dark, function () {
      var al = C('#9aa3a6'), al2 = C('#b3b8b2'), mid = C('#6d777b'), low = C('#4a555e'), ink = C('#26292d'), sky = C('#3d4a63');
      rect(x, hy - sh, lw, sh, ink);                                              // lid: bezel
      hline(x + 1, x + lw - 2, hy - sh, mid);                                     // lid edge catching the sky
      rect(x + 2, hy - sh + 2, lw - 4, sh - 4, C('#1f2a33'));                     // glass
      for (j = 0; j < sh - 4; j++) {                                              // sky reflection, top right
        for (k = 0; k < lw - 4; k++) {
          if (k - j * 1.4 > (lw - 4) * 0.45 && BAY[(j & 3) * 4 + (k & 3)] < 10 - j) px(x + 2 + k, hy - sh + 2 + j, sky);
        }
      }
      for (j = 0; j < Math.round((lw - 4) * 0.55); j++) {                         // a glint down the glass
        k = x + lw - 4 - j; px(k, hy - sh + 3 + Math.round(j * (sh - 7) / ((lw - 4) * 0.55)), low);
        px(k - 1, hy - sh + 3 + Math.round(j * (sh - 7) / ((lw - 4) * 0.55)), low);
      }
      hline(x + 1, x + lw - 2, hy, low);                                          // hinge
      rect(x, hy + 1, lw, dd, al);                                                // deck top
      for (j = 1; j < dd - 1; j++) {                                              // keyboard well
        hline(x + 3, x + lw - 4, hy + j, mid);
        for (k = x + 4 + (j & 1); k < x + lw - 4; k += 2) px(k, hy + j, low);
      }
      hline(x + (lw >> 1) - Math.round(lw * 0.14), x + (lw >> 1) + Math.round(lw * 0.14), hy + dd, al2);   // trackpad
      rect(x, by - th + 1, lw, th, mid);                                          // front edge
      hline(x + 1, x + lw - 2, by, low);
    });
  }
  // brim on both sides, not a slab off to one side: a cap dropped in the grass, not a dome
  // standing on a shelf
  function cap(x, by) {
    // A baseball cap lying crown-up, seen side-on with its bill to the left: six-panel dome with seams and
    // a button, sweatband, and a curved bill whose top shows as a thin strip.
    var cw = Math.max(8, Math.round(mpx(0.20, by))), ch = Math.round(0.52 * cw), bl = Math.round(0.38 * cw), k;
    if (x > W + cw + 2 || x - bl < -cw) return;
    var dark = treeShadeAt(x + (cw >> 1), by);
    for (k = x - bl; k < x + cw; k++) shade(k, by + 1, dark ? 0.22 : 0.35);
    if (!dark) shadow(x + 2, by, cw - 4, ch);
    treeLit(x - bl - 1, by - ch - 2, x + cw, by, dark, function () {
      var o = C('#dcb26c'), lt = C('#f0d69f'), sd = C('#a8854f'), dk = C('#8a6a3f'), yy, d, cx = x + cw / 2, s1, s2, sc;
      for (yy = 1; yy <= ch; yy++) {
        d = Math.sqrt(1 - ((yy - 0.5) / ch) * ((yy - 0.5) / ch)) * cw / 2;
        hline(Math.round(cx - d), Math.round(cx + d) - 1, by - yy, o);
        if (yy > 0.40 * ch) hline(Math.round(cx - d + 0.35 * d), Math.round(cx + d) - 2, by - yy, lt);   // skylit top
        else px(Math.round(cx + d) - 1, by - yy, sd);
        s1 = Math.round(cx - d * 0.45); s2 = Math.round(cx + d * 0.30);                                 // panel seams
        if (yy > 1 && yy < ch - 1) { sc = yy > 0.40 * ch ? o : sd; px(s1, by - yy, sc); px(s2, by - yy, sc); }
      }
      px(Math.round(cx), by - ch - 1, sd);                                        // button
      hline(x, x + cw - 1, by, dk);                                               // sweatband
      hline(x - bl + 2, x + 1, by - 2, o);                                        // bill: top strip, then its edge
      hline(x - bl, x + 1, by - 1, sd);
      hline(x - bl + 1, x, by, dk);
    });
  }
  // a closed book with its page block showing, and the pen laid along it - the old diagonal
  // across the cover read as a scratch
  function notebook(x, by) {
    // A closed letter-size notebook lying a little askew, red cover foreshortened to a few rows over its
    // page block, with a pen laid across it.
    var nw = Math.max(8, Math.round(mpx(0.216, by))), f = (by - HZ) / W;
    var nd = Math.max(3, Math.round(mpx(0.279, by) * f)), th = Math.max(1, Math.round(mpx(0.012, by))), k, j, sft;
    if (x > W + nw + 4 || x + nw < -4) return;
    var dark = treeShadeAt(x + (nw >> 1), by);
    for (k = x; k < x + nw + Math.round(0.4 * nd); k++) shade(k, by + 1, dark ? 0.22 : 0.35);
    treeLit(x - 1, by - th - nd - 2, x + nw + nd, by, dark, function () {
      var cov = C('#b34a3a'), cov2 = C('#cf6250'), sp = C('#7e3226'), pg = C('#e9e1cd'), pg2 = C('#d9b48c'), ink = C('#26292d');
      for (k = 0; k < nd; k++) {                                                  // cover, far row first
        sft = Math.round(0.4 * k); j = by - th - nd + k;
        hline(x + sft, x + sft + nw - 1, j, k === 0 ? cov2 : cov);
        px(x + sft, j, sp); px(x + sft + 1, j, sp);                               // spine on the left
      }
      sft = Math.round(0.4 * nd);
      for (k = 0; k < th; k++) hline(x + sft + 2, x + sft + nw - 1, by - th + 1 + k, k === th - 1 ? pg2 : pg);   // page block
      px(x + sft, by, sp); px(x + sft + 1, by, sp);
      for (k = 0; k < Math.round(nw * 0.55); k++) {                               // pen, lying across the cover
        j = by - th - nd + 1 + Math.round(k * (nd - 2) / Math.round(nw * 0.55));
        px(x + Math.round(nw * 0.30) + k + Math.round(0.4 * (j - (by - th - nd))), j, k === 0 ? C('#b3b8b2') : ink);
      }
    });
  }
  function binProp(x, by) {
    // A round slatted steel litter bin, 0.6 m across and 0.92 m tall, open at the top. The eye is above
    // it, so the rim is an ellipse we look into; slats bunch toward the sides as the drum turns away,
    // and the side toward the sun catches it.
    var dy = by - HZ, w = Math.max(6, Math.round(mpx(0.60, by))), h = Math.max(8, Math.round(mpx(0.92, by)));
    if (x > W + w || x + w < 0) return;
    var E2 = dy * dy / (6.25 * W), rw = w >> 1, cx = x + rw, et = Math.max(1, Math.round(0.30 * 1.58 * E2)), eb = Math.max(1, Math.round(0.30 * 2.5 * E2));
    var cyb = by - eb, cyt = cyb - h, rb = Math.max(2, Math.round(mpx(0.05, by)));
    var dark = C('#26292d'), slat = C('#4a555e'), hi = C('#6d777b'), ink = C('#152e24'), rimf = C('#9aa3a6');
    var s = Math.max(-1, Math.min(1, (sunX - cx) / (0.30 * W))), dx, q, n, yt, yf, c, j, xx;
    for (dx = -rw; dx <= rw; dx++) {
      n = dx / rw; q = Math.sqrt(Math.max(0, 1 - n * n));
      yt = cyt + Math.round(et * q); yf = cyb + Math.round(eb * q);
      c = n * s > 0.45 ? hi : n * s < -0.55 ? dark : slat;
      vline(cx + dx, yt, yf, c);
      vline(cx + dx, cyt - Math.round(et * q), yt - 1, ink);   // inside the open top
      px(cx + dx, cyt - Math.round(et * q), slat);             // far rim
      px(cx + dx, yt, rimf);                                   // near rim, lit from above
      px(cx + dx, yf, dark);                                   // foot ring on the ground
    }
    for (j = 1; j < 10; j++) {                                 // gaps between slats, 18 degrees apart
      n = Math.sin(-Math.PI / 2 + j * Math.PI / 10); xx = cx + Math.round(n * rw); q = Math.sqrt(Math.max(0, 1 - n * n));
      vline(xx, cyt + Math.round(et * q) + rb + 1, cyb + Math.round(eb * q) - rb - 1, ink);
      if (j > 2 && j < 8 && rw > 12) vline(xx + 1, cyt + Math.round(et * q) + rb + 1, cyb + Math.round(eb * q) - rb - 1, ink);
    }
    for (dx = -rw; dx <= rw; dx++) {                           // top and bottom hoops follow the curve
      n = dx / rw; q = Math.sqrt(Math.max(0, 1 - n * n));
      px(cx + dx, cyt + Math.round(et * q) + rb, dark); px(cx + dx, cyb + Math.round(eb * q) - rb, dark);
    }
  }
  function treeRootDip(dx, span) {
    // smooth turf-line noise for the trunk's root flare: knots `span` px apart (smoothstep between them,
    // never a jitter per column - that reads as static), hashed on dx from the trunk centre and never on
    // camX, so the base undulates in place instead of running as one dead-flat scanline (tree-1). 0..1.
    var f = dx / span, k = Math.floor(f), a = hash(k * 271 + 811), b = hash((k + 1) * 271 + 811);
    f -= k; f = f * f * (3 - 2 * f);
    return a + (b - a) * f;
  }

  // ---------- the tree ----------
  function trunk() {
    // A maple trunk in its crown's shade: grey-brown, tapering from a buttressed flare to the fork, dark on
    // the left, a dithered skylight edge on the right, bark in irregular interlacing furrows.
    var tx = sxOf(TREEX, 1), w = Math.max(6, u(13)), by = HZ + Math.round(GH * 0.58), fy = HZ - Math.round(H * 0.02);
    if (tx > W + u(80) || tx + w < -u(80)) return;
    var tc = tx + w / 2, fmax = 0.60 * w, seg = u(8), top = fy - u(10), hwF = 0.42 * w, y, f, hw, mc, s, fl, flR, x0, x1, xl, j, L, xj, ph, qb, q, cx, a0, b4, gx0 = 0, gx1 = -1, pv = [-1, -1, -1, -1], rspan, roff, bcol;
    var fill = C('#5b4d3f'), dk = C('#3b3028'), lt = C('#877d72'), crL = C('#26292d'), bark = C('#33251a'), ridge = C('#6f6254');
    var ld = treeLeader(1, Math.round(tc), fy, w, TREE_M.lt || (TREE_M.lt = {}));
    // buttress roots, not a bell: each side reaches its own distance and carries a second root bump
    var fmL = 0.8 * fmax, fmR = 1.1 * fmax, bL = 0.030 + hash(4101) * 0.03, bR = 0.030 + hash(4102) * 0.03;
    branches(Math.round(tc), fy, w);
    for (y = top; y <= by; y++) {
      f = (by - y) / (by - fy);
      if (y >= fy) { hw = w * (0.5 - 0.14 * f + (f > 0.86 ? 0.06 * Math.pow((f - 0.86) / 0.14, 2) : 0)); mc = tc; }   // swells into the fork
      else {             // above the fork the trunk narrows into the central leader, so bark and outline flow on into it
        s = (fy - y) / (fy - top); q = (ld.sy - y) / (ld.sy - ld.my);
        hw = hwF + ((ld.wb + (ld.wm - ld.wb) * q) / 2 - 1 - hwF) * Math.pow(s, 0.6);
        mc = tc + (ld.sx + (ld.mx - ld.sx) * q - tc) * s;
      }
      fl = f < 0.09 ? fmL * (Math.pow(1 - f / 0.09, 2.2) + 0.24 * Math.max(0, 1 - Math.pow((f - bL) / 0.022, 2))) : 0;
      flR = f < 0.09 ? fmR * (Math.pow(1 - f / 0.09, 2.2) + 0.18 * Math.max(0, 1 - Math.pow((f - bR) / 0.022, 2))) : 0;
      x0 = Math.round(mc - hw - fl); x1 = Math.round(mc + hw + flR) - 1;
      if (x1 < x0) continue;
      if (y === by) { gx0 = x0; gx1 = x1; }
      hline(x0, x1, y, fill);
      xl = x0 + Math.round(0.30 * (x1 - x0 + 1));
      hline(x0, xl - 3, y, dk);
      b4 = (y & 3) * 4;                                          // dithers keyed to the trunk, never the screen
      for (j = xl - 2; j <= xl + 1; j++) if (BAY[b4 + ((j - tx) & 3)] < 8) px(j, y, dk);
      for (j = x1 - Math.round(0.10 * (x1 - x0 + 1)); j <= x1; j++) if (BAY[b4 + ((j - tx) & 3)] < 9) px(j, y, lt);
      for (q = 0; q < 2; q++) {                                  // creases between the roots, 2 px, each with the
        if (fl < 3) { pv[q * 2] = pv[q * 2 + 1] = -1; continue; }   // wall facing the light as a ridge beside it
        cx = Math.round(mc - hw) - Math.round(fl * (q ? 0.78 : 0.40)); a0 = pv[q * 2] < 0 ? cx : pv[q * 2];
        hline(Math.min(cx, a0), Math.max(cx, a0) + 1, y, crL); px(Math.min(cx, a0) - 1, y, fill); pv[q * 2] = cx;
        if (flR < 3) continue;
        cx = Math.round(mc + hw) - 1 + Math.round(flR * (q ? 0.78 : 0.40)); a0 = pv[q * 2 + 1] < 0 ? cx : pv[q * 2 + 1];
        hline(Math.min(cx, a0) - 1, Math.max(cx, a0), y, dk); px(Math.min(cx, a0) - 2, y, ridge); pv[q * 2 + 1] = cx;
      }
      if (y < by - u(4) && hw > w * 0.22) for (j = -3; j <= 3; j++) {   // bark: shallow furrows keyed to the trunk; each
        L = seg + Math.round((hash(j * 31 + 5) - 0.5) * u(4));          // run takes its own offset, so neighbours
        qb = by - y + Math.round(hash(j * 13 + 7) * L); ph = qb % L;    // merge and part - interlacing ridges
        if (ph < 3) continue;
        xj = Math.round(mc + (j * u(1.9) + (hash(j * 31 + ((qb / L) | 0) * 7 + 11) - 0.5) * u(1.7) + 2.2 * Math.sin((by - y) * 6.283 / L + j * 3.1)) * (hw / (w / 2)));
        if (xj <= x0 || xj >= x1) continue;
        px(xj, y, bark);
        if (j > -2) px(xj + 1, y, ridge);
      }
    }
    // the root flare meets the turf unevenly, not on one dead-flat scanline: a small per-column dip,
    // hashed on distance from the trunk centre so it holds still while the tree pans
    rspan = Math.max(3, u(1.2));
    for (j = gx0 - 1; j <= gx1 + 1; j++) {
      roff = Math.min(3, Math.round(treeRootDip(j - tc, rspan) * 4));
      if (roff > 0 && j >= gx0 && j <= gx1) { bcol = buf[by * W + j]; for (q = 1; q <= roff; q++) px(j, by + q, bcol); }
      shade(j, by + roff + 1, 0.3); shade(j, by + roff + 2, 0.3);
    }
  }  function treeLimb(x0, y0, x1, y1, w0, w1, c, lo, hi, mk) {
    // A limb laid as spans across its run: horizontal spans for a steep limb, vertical for a shallow one, so
    // its thickness holds at any angle. Shaded like the trunk and keyed to the limb itself: the side away from
    // the sky dark with a dithered edge, a dithered lit edge, bark furrows running along it. With mk it only
    // paints over pixels of that colour.
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.abs(dx), Math.abs(dy)), st = Math.abs(dy) >= Math.abs(dx);
    var k, f, x, y, w, j, jj, a, xx, yy, i, sd, le, bk, cc, m, lane, ln1, ln2, L = u(3) + 3, seed = dx * 7 + dy * 13 + w0;
    var bark = C(mk !== undefined ? '#26292d' : '#33251a');
    for (k = 0; k <= n; k++) {
      f = k / n; x = Math.round(x0 + dx * f); y = Math.round(y0 + dy * f);
      w = Math.max(1, Math.round(w0 + (w1 - w0) * f)); a = -(w >> 1); sd = Math.max(1, Math.round(w * 0.3)); le = Math.max(2, Math.round(w * 0.12));
      bk = (k & 3) * 4; lane = -9; ln1 = -9; ln2 = -9;
      if (w > 6) for (m = 0; m < 3; m++) {                         // furrows along the limb, a few px per run
        if ((k + m * 5) % L < 3) continue;
        jj = sd + 2 + Math.round((m + 0.5) * (w - le - sd - 2) / 3) + (hash(seed + m * 31 + (((k + m * 5) / L) | 0) * 7) < 0.5 ? 0 : 1);
        if (m === 0) lane = jj; else if (m === 1) ln1 = jj; else ln2 = jj;
      }
      for (j = 0; j < w; j++) {
        xx = st ? x + a + j : x; yy = st ? y : y + a + j;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        i = yy * W + xx;
        if (mk !== undefined && buf[i] !== mk) continue;
        jj = st ? j : w - 1 - j;                                   // 0 on the side away from the sky
        if (w <= 3) cc = c;
        else if (w <= 6) cc = jj < sd ? lo : jj === w - 1 ? hi : c;
        else {
          cc = jj < sd - 2 ? lo : jj < sd + 2 ? (BAY[bk + (jj & 3)] < 8 ? lo : c) : jj >= w - le ? (BAY[bk + (jj & 3)] < 9 ? hi : c) : c;
          if (cc === c && (jj === lane || jj === ln1 || jj === ln2)) cc = bark;
        }
        buf[i] = cc;
      }
    }
  }  function treeLeader(i, cx, fy, w, o) {
    // scaffold leader i: its base starts inside the trunk below the fork, it bends a little at its midpoint,
    // tapers fast over the part that shows under the crown, and ends in the leaves
    var b = BR[i];
    o.tx = cx + Math.round(b[0] * W); o.ty = fy + Math.round(b[1] * H);
    o.sx = cx + Math.round(b[0] / 0.085 * 0.3 * 0.42 * w); o.sy = fy + u(8);
    o.mx = cx + Math.round(0.5 * b[0] * W) + Math.round((hash(i * 7 + 1) - 0.5) * 2 * u(2)); o.my = fy + Math.round(0.3 * b[1] * H);
    o.wb = Math.max(2, Math.round(w * b[2])); o.wm = Math.max(2, Math.round(w * 0.29)); o.wt = Math.max(1, Math.round(w * b[3]));
    return o;
  }
  function branches(cx, fy, w, mk) {
    var dim = mk !== undefined;                      // glimpsed inside the crown: deep in its shade, darker
    var fill = C(dim ? '#3b3028' : '#5b4d3f'), lo = C(dim ? '#26292d' : '#3b3028'), hi = C(dim ? '#5b4d3f' : '#877d72');
    var i, j, s, fr, sx, sy, L = TREE_M.ld || (TREE_M.ld = {});
    for (i = 0; i < BR.length; i++) {
      treeLeader(i, cx, fy, w, L);
      treeLimb(L.sx, L.sy, L.mx, L.my, L.wb, L.wm, fill, lo, hi, mk);
      treeLimb(L.mx, L.my, L.tx, L.ty, L.wm, L.wt, fill, lo, hi, mk);
      for (j = 0; j < BR[i][4].length; j++) {                     // secondaries start on the leader itself
        s = BR[i][4][j];
        if (s[0] <= 0.3) { fr = s[0] / 0.3; sx = L.sx + (L.mx - L.sx) * fr; sy = L.sy + (L.my - L.sy) * fr; }
        else { fr = (s[0] - 0.3) / 0.7; sx = L.mx + (L.tx - L.mx) * fr; sy = L.my + (L.ty - L.my) * fr; }
        sx = Math.round(sx); sy = Math.round(sy);
        treeLimb(sx, sy, sx + Math.round(s[1] * W), sy + Math.round(s[2] * H), Math.max(2, Math.round(w * s[3])), 2, fill, lo, hi, mk);
      }
    }
  }
  var CY = { ya: 0, yb: 0, c0: 0, c1: 0, sw: 0, bx0: 0, bg: null, cx: null, cy: null, r: null, lo: null, lw: null, nl: 0 };
  function cyRun(y, a0, a1, c) {
    if (y < CY.ya || y > CY.yb) return;
    if (a0 < CY.c0) a0 = CY.c0;
    if (a1 > CY.c1) a1 = CY.c1;
    if (a1 >= a0) buf.fill(c, y * W + a0, y * W + a1 + 1);
  }
  function cyLeaf(ax, ay) { return ax >= CY.c0 && ax <= CY.c1 && ay >= CY.ya && ay <= CY.yb && buf[ay * W + ax] !== CY.bg[(ay - CY.ya) * CY.sw + ax - CY.bx0]; }
  function cyLeafDisc(qx, qy, r, c) { for (var e = -r; e <= r; e++) { var h = Math.round(Math.sqrt(r * r - e * e)); cyRun(qy + e, qx - h, qx + h, c); } }
  function cyRestore(qx, qy, r) {
    for (var e = -r; e <= r; e++) {
      var y = qy + e, h = Math.round(Math.sqrt(r * r - e * e)), a0 = Math.max(CY.c0, qx - h), a1 = Math.min(CY.c1, qx + h), o;
      if (y < CY.ya || y > CY.yb || a1 < a0) continue;
      o = (y - CY.ya) * CY.sw - CY.bx0;
      buf.set(CY.bg.subarray(o + a0, o + a1 + 1), y * W + a0);
    }
  }
  function cyStamp(qx, qy, qrx, qry, c, sid, tips) {
    // A leaf cluster: a round top that most clusters split with a notch into two leaf lobes, a fuller
    // bottom, and sides serrated into overlapping leaf tips - a sawtooth down the rows, never a jitter
    // picked per row (that reads as combed hair). Smooth arcs this size read as bubbles.
    var A = Math.max(1, Math.round(qrx * 0.24)), P = Math.max(3, Math.round(qry * 0.42)), o1 = (hash(sid * 3 + 7) * P) | 0, o2 = (hash(sid * 3 + 8) * P) | 0;
    var nt = qrx > u(3.2) && hash(sid * 3 + 10) < 0.75 ? -0.3 - hash(sid * 3 + 11) * 0.2 : -2, xn = Math.round(qx + (hash(sid * 3 + 9) - 0.4) * qrx * 0.7);
    var e, t, h, hb = 0, xa, xb, nw, n, k2, tx, tl, th, m;
    for (e = -qry; e <= qry; e++) {
      t = e / (qry + 0.5); h = qrx * (t < 0 ? Math.sqrt(1 - t * t) : Math.pow(1 - t * t, 0.45));
      xa = Math.round(qx - h + ((e + 99 + o1) % P) / P * A); xb = Math.round(qx + h - ((e + 99 + o2) % P) / P * A * 0.7);
      if (t < nt) { nw = Math.round((nt - t) / (1 + nt) * qrx * 0.42); cyRun(qy + e, xa, Math.min(xb, xn - nw - 1), c); cyRun(qy + e, Math.max(xa, xn + nw + 1), xb, c); }
      else cyRun(qy + e, xa, xb, c);
      hb = h;
    }
    if (!tips) return;
    // the lower lip breaks into hanging leaf tips, 1-3 px, so clusters never stack as flat ledges
    n = 2 + ((hash(sid * 3 + 1) * 3) | 0); th = Math.max(1, Math.round(qrx * 0.10));
    for (k2 = 0; k2 < n; k2++) {
      tx = Math.round(qx + (hash(sid * 5 + k2 * 7) - 0.5) * 1.7 * hb); tl = 1 + ((hash(sid * 9 + k2 * 3) * 3) | 0);
      for (m = 1; m <= tl; m++) { h = Math.round(th * (1 - (m - 1) / tl)); cyRun(qy + qry + m, tx - h, tx + h, c); }
    }
  }
  function cyCrest(qx, qy, hw, hh, c, sid) {                   // a small lit patch, torn on its lower left
    var e, h, k2, a0;
    for (e = -hh; e <= hh; e++) {
      h = hw * Math.sqrt(1 - (e / (hh + 0.5)) * (e / (hh + 0.5))); k2 = ((e + 40) >> 1) * 17;
      a0 = Math.round(qx - h + hash(sid * 13 + k2) * h * (e > 0 ? 1.1 : 0.45));
      cyRun(qy + e, a0, Math.round(qx + h - hash(sid * 19 + k2) * h * 0.3), c);
    }
  }
  function cyInCrown(qx, qy) {
    var n, e2, cx = CY.cx, cy = CY.cy, r = CY.r, lo = CY.lo, lw = CY.lw;
    for (n = 0; n < CY.nl; n++) { e2 = qy - cy[n]; if (e2 >= -r[n] && e2 <= r[n] && Math.abs(qx - cx[n]) < lw[lo[n] + e2 + r[n]]) return true; }
    return false;
  }
  function canopy() {
    var G = treeGeo(), x = G.x, cy = G.cy0, R = Math.round(0.23 * W), Rb = Math.round(0.31 * H), pad = u(12);
    if (x - R - pad > W || x + R + pad < 0) return;
    // six greens, from the deep interior we look up into to a crest in full sun
    var T = [C('#152e24'), C('#2a5138'), C('#376b45'), C('#5a9e4c'), C('#74ae3a'), C('#9ed24f')], d = T[0];
    var cxs = G.cx, cys = G.cy, rs = G.r, NL = LUMP.length;
    var i, j, k, xx, yy, a, rr, dy, dw, ya = H, yb = -1, row, col, id, px0, py0, best, q, nx, ny, v, b, rx, ry;
    for (i = 0; i < NL; i++) { ya = Math.min(ya, cys[i] - rs[i] - pad); yb = Math.max(yb, cys[i] + rs[i] + pad); }
    if (ya < 0) ya = 0;
    if (yb > H - 1) yb = H - 1;
    // The crown is painted over a copy of what is behind it, so a gap shows the real background - sky,
    // towers, the tree line - and the branches drawn before it. A pixel is leaf where it differs from the copy.
    var bx0 = x - R - pad, sw = 2 * (R + pad) + 1, sh = yb - ya + 1, c0 = Math.max(0, bx0), c1 = Math.min(W - 1, bx0 + sw - 1);
    if (c1 < c0 || yb < ya) return;
    if (!TREE_M.bg || TREE_M.bg.length < sw * sh) TREE_M.bg = new Uint32Array(sw * sh);
    var BG = TREE_M.bg;
    for (yy = ya; yy <= yb; yy++) BG.set(buf.subarray(yy * W + c0, yy * W + c1 + 1), (yy - ya) * sw + c0 - bx0);
    CY.ya = ya; CY.yb = yb; CY.c0 = c0; CY.c1 = c1; CY.sw = sw; CY.bx0 = bx0; CY.bg = BG;
    // half-widths of every mass row, cached for this buffer size: LW[LO[i] + dy + r]
    var LO = TREE_M.lo, LW = TREE_M.hi, top = u(2);
    if (TREE_M.mk !== W * 7 + H) {
      TREE_M.mk = W * 7 + H; LO = TREE_M.lo = []; k = 0;
      for (i = 0; i < NL; i++) { LO[i] = k; k += 2 * rs[i] + 1; }
      LW = TREE_M.hi = new Float32Array(k);
      for (i = 0; i < NL; i++) for (dy = -rs[i]; dy <= rs[i]; dy++) LW[LO[i] + dy + rs[i]] = treeLobeW(i, rs[i], dy);
    }
    CY.cx = cxs; CY.cy = cys; CY.r = rs; CY.lo = LO; CY.lw = LW; CY.nl = NL;
    for (i = 0; i < NL; i++) for (dy = -rs[i]; dy <= rs[i]; dy++) {   // deep interior, inset: the clusters make the outline
      if (cys[i] + dy < top + u(2)) continue;
      dw = Math.round(LW[LO[i] + dy + rs[i]]) - u(3.5);
      if (dw >= 0) cyRun(cys[i] + dy, cxs[i] - dw, cxs[i] + dw, d);
    }
    // Leaf clusters on a jittered grid in tree-local coordinates, painted top to bottom and right to left,
    // big deep in a mass and small at its rim. Each is a body over a darker rim, with a small torn lit patch
    // on the sunny side. The tone follows the sun (ahead, high, to the right): the crown's top and right
    // side and the upper right of each mass and group are brightest, the face toward us is middling, the
    // underside we look up into is darkest.
    var gx = u(5.6), gy = u(3.9), r0 = Math.floor((ya - cy) / gy) - 1, r1 = Math.ceil((yb - cy) / gy) + 1, q1 = Math.ceil((R + pad) / gx) + 1;
    var sec, wi, lt, sc, rim = T[2], lx, ly, ci, cj, ii, jj, sk, sq, snx, sny, ex, ey;
    // Between the masses and the clusters: 1-2 m groups, centres jittered on a coarse grid in tree-local
    // coordinates, each lit on its own upper right, so the clusters gather into sprays instead of an even field
    var SG = u(26), sgx0 = Math.floor(-(R + pad + 2 * gx) / SG) - 2, sgy0 = Math.floor((r0 - 1) * gy / SG) - 2;
    var sgw = 2 * (-sgx0) + 1, sgh = Math.ceil((r1 + 1) * gy / SG) + 3 - sgy0, SX = TREE_M.sx || (TREE_M.sx = []), SY = TREE_M.sy || (TREE_M.sy = []), SR = TREE_M.sr || (TREE_M.sr = []);
    for (jj = 0; jj < sgh; jj++) for (ii = 0; ii < sgw; ii++) {
      q = (ii + sgx0 + 300) * 977 + jj + sgy0 + 300; sk = jj * sgw + ii;
      SX[sk] = (ii + sgx0 + 0.5 + (hash(q * 3 + 1) - 0.5) * 0.7) * SG; SY[sk] = (jj + sgy0 + 0.5 + (hash(q * 3 + 2) - 0.5) * 0.7) * SG; SR[sk] = SG * (0.62 + hash(q * 3 + 3) * 0.3);
    }
    for (row = r0; row <= r1; row++) for (col = q1; col >= -q1; col--) {
      id = (row + 500) * 1013 + col + 500;
      px0 = x + col * gx + (row & 1) * (gx >> 1) + Math.round((hash(id * 5 + 1) - 0.5) * gx * 0.9);
      py0 = cy + row * gy + Math.round((hash(id * 5 + 2) - 0.5) * gy * 0.9);
      best = sec = -1; wi = 0;
      for (i = 0; i < NL; i++) {
        dy = py0 - cys[i];
        if (dy < -rs[i] || dy > rs[i]) continue;
        dw = LW[LO[i] + dy + rs[i]];
        q = (dw - Math.abs(px0 - cxs[i])) / rs[i];
        if (q > best) { sec = best; best = q; wi = i; } else if (q > sec) sec = q;
      }
      if (best < -0.03 || (best > 0.12 && hash(id * 5 + 5) < 0.06)) continue;   // an odd missing cluster: a deep hole
      nx = (px0 - cxs[wi]) / rs[wi]; ny = (py0 - cys[wi]) / rs[wi];
      // big clusters deep in a mass, small ones at its rim
      sc = 0.6 + 0.9 * Math.min(1, best / 0.42);
      rx = Math.max(3, Math.round((u(2.4) + hash(id * 5 + 3) * u(3.2)) * sc)); ry = Math.max(2, Math.round(rx * (0.56 + hash(id * 5 + 6) * 0.2)));
      if (py0 - ry < top) py0 = top + ry;                     // the crown stays whole under the top of the frame
      // Near an edge of the frame (or partway on/off screen as the tree pans through a stop), most of
      // the grid maps outside the visible strip; every stamp/crest call below clips to it internally
      // and no-ops, so skip the group entirely rather than pay for clipped-away work. +8 covers the
      // stamp's own small internal offsets (tips, the rim/lit variants' -1/+1 nudges).
      if (px0 + rx + 8 < c0 || px0 - rx - 8 > c1 || py0 + ry + 8 < ya || py0 - ry - 8 > yb) continue;
      // Light from the sun behind the crown, high on the right: each mass and each group in it is lit on its
      // upper right and sinks into shade over its lower part; where two masses meet a dark valley parts them.
      lx = px0 - x; ly = py0 - cy; ci = Math.floor(lx / SG) - sgx0; cj = Math.floor(ly / SG) - sgy0; sq = 1e9; snx = sny = 0;
      for (jj = cj - 1; jj <= cj + 1; jj++) for (ii = ci - 1; ii <= ci + 1; ii++) {
        sk = jj * sgw + ii; ex = (lx - SX[sk]) / SR[sk]; ey = (ly - SY[sk]) / SR[sk]; q = ex * ex + ey * ey * 1.4;
        if (q < sq) { sq = q; snx = ex; sny = ey; }
      }
      sq = 1 - Math.sqrt(sq);
      lt = -0.62 * ny + 0.30 * nx;
      v = 0.45 * lt + 0.6 * (-0.62 * sny + 0.30 * snx) - 0.62 * (py0 - cy) / Rb + 0.16 * (px0 - x) / R + (hash(id * 5 + 4) - 0.5) * 0.45;
      if (sq < 0.1) v -= 0.3;
      if (ny > 0.2) v -= (ny - 0.2) * 1.5;
      if (best < 0.15 && sec > best - 0.12) v -= 0.55;
      b = v > 0.55 ? 4 : v > 0.05 ? 3 : v > -0.45 ? 2 : 1;
      // Under the crown's lower edge a thin skylit rim, so the underside never melts into the far tree line.
      // Only the shaded lower part of a group shows a dark rim under each cluster; the lit part stays open.
      if (b < 3 && best < 0.25 && !cyInCrown(px0, py0 + ry + u(2))) cyStamp(px0 - 1, py0 + 1, rx, ry, rim, id, 1);
      cyStamp(px0, py0, rx, ry, T[sny > -0.25 || b === 1 || hash(id * 5 + 11) < 0.25 ? b - 1 : b], id, 1);
      cyStamp(px0 + Math.round(rx * 0.14), py0 - Math.round(ry * 0.20), Math.round(rx * 0.80), Math.round(ry * 0.72), T[b], id + 7, 1);
      if (b > 1 && lt > 0.05 && hash(id * 5 + 7) < 0.4 + lt * 0.6 && (b < 4 || (nx > 0.3 && ny < -0.4)))   // lime only on the top-right rim
        cyCrest(px0 + Math.round(rx * (0.18 + hash(id * 5 + 8) * 0.3)), py0 - Math.round(ry * (0.30 + hash(id * 5 + 9) * 0.25)),
          Math.max(2, Math.round(rx * 0.36)), Math.max(1, Math.round(ry * 0.34)), T[b + 1], id + 13);
    }
    // a few see-through gaps near the outer masses, torn rather than round
    var gcx = [], gcy = [], gr = [], hr, a2, qx, qy;
    for (i = 1; i <= 6; i++) {
      a = hash(i * 97 + 5) * 6.283; rr = rs[i] * (0.62 + hash(i * 97 + 6) * 0.22);
      qx = cxs[i] + Math.round(Math.cos(a) * rr); qy = cys[i] + Math.round(Math.sin(a) * rr);
      hr = u(1.2) + Math.round(hash(i * 97 + 7) * u(1.8));
      for (k = 0; k < 4; k++) {
        gcx[k] = qx + Math.round(Math.cos(3.1 * a) * 1.1 * hr * k); gcy[k] = qy + Math.round(Math.sin(3.1 * a) * 0.7 * hr * k) + (k & 1 ? 2 : 0);
        gr[k] = Math.max(3, Math.round(hr * (1 - 0.2 * k)));
        cyRestore(gcx[k], gcy[k], gr[k]);
      }
      for (k = 0; k < 4; k++) for (j = 0; j < 9; j++) {
        a2 = hash(i * 131 + k * 17 + j * 5) * 6.283;
        xx = gcx[k] + Math.round(Math.cos(a2) * (gr[k] + 2)); yy = gcy[k] + Math.round(Math.sin(a2) * (gr[k] + 2));
        if (cyLeaf(xx, yy)) cyLeafDisc(gcx[k] + Math.round(Math.cos(a2) * 0.85 * gr[k]), gcy[k] + Math.round(Math.sin(a2) * 0.85 * gr[k]),
          Math.max(1, Math.round(gr[k] * (0.22 + 0.28 * hash(i * 137 + k * 19 + j)))), buf[yy * W + xx]);
      }
      for (k = 0; k < 4; k++) {                                // a sliver the tearing left over reads as a white
        var nv = 0, lc = d, e1, e2, pass;                      // speck, not a hole: close it with the leaves around it
        for (pass = 0; pass < 2 && (!pass || (nv && nv < 24)); pass++) for (e1 = -gr[k]; e1 <= gr[k]; e1++) for (e2 = -gr[k]; e2 <= gr[k]; e2++) {
          xx = gcx[k] + e2; yy = gcy[k] + e1;
          if (e1 * e1 + e2 * e2 > gr[k] * gr[k] + gr[k] || xx < c0 || xx > c1 || yy < ya || yy > yb) continue;
          if (k > 0 && (xx - gcx[k - 1]) * (xx - gcx[k - 1]) + (yy - gcy[k - 1]) * (yy - gcy[k - 1]) <= gr[k - 1] * gr[k - 1]) continue;
          if (k < 3 && (xx - gcx[k + 1]) * (xx - gcx[k + 1]) + (yy - gcy[k + 1]) * (yy - gcy[k + 1]) <= gr[k + 1] * gr[k + 1]) continue;
          if (cyLeaf(xx, yy)) { if (!pass) lc = buf[yy * W + xx]; }
          else if (!pass) nv++;
          else buf[yy * W + xx] = lc;
        }
      }
    }
    // the scaffold, glimpsed through the darkest leaves of the underside
    branches(G.tx + (G.tw >> 1), G.fy, G.tw, d);
  }
  function leaves() {
    // The odd leaf: it leaves the underside of the crown, side-slips and flips on the way down, and lies on the
    // grass; the next one drops somewhere else. The last two that fell stay put, so no leaf pops out of the
    // grass while you watch - the oldest goes only as a new one lands. In the crown's shade a lying leaf is
    // shaded with the grass under it.
    var G = treeGeo(), s = Math.max(2, u(0.9)), cols = ['#74ae3a', '#9ed24f', '#e0a94e'], OFF = [-0.13, 0.06, 0.15], fall = 4.5;
    if (G.x < -0.4 * W || G.x > 1.4 * W) return;
    var i, j, n, per, ph, cyc, xs, top, land, x, y, c, dk = C('#2a5138'), dx;
    function drop(i, cy) {                                     // where the leaf of cycle cy starts across and lands
      xs = G.x + Math.round(OFF[i] * W) + Math.round((hash(cy * 29 + i * 7 + 3) - 0.5) * u(24));
      land = G.by + Math.round(hash(91 * i + cy * 13) * 0.30 * GH);
    }
    function lie(lx, lc) {
      var k, dark = treeShadeAt(lx, land);
      hline(lx - s, lx + s, land, lc); hline(lx - s + 1, lx + s - 2, land - 1, lc);
      if (dark) for (k = lx - s; k <= lx + s; k++) { shade(k, land, TREE_SHADE); if (k > lx - s && k < lx + s - 1) shade(k, land - 1, TREE_SHADE); }
    }
    for (i = 0; i < 3; i++) {
      per = 10 + 3.5 * i; ph = (clock + 2.3 * i) % per; cyc = Math.floor((clock + 2.3 * i) / per);
      c = C(cols[i]);
      for (n = ph < fall ? 2 : 1; n >= (ph < fall ? 1 : 0); n--) { drop(i, cyc - n); lie(xs + Math.round(Math.sin(2.2 * fall + i) * u(7)), c); }
      if (ph >= fall) continue;
      drop(i, cyc);
      top = HZ - Math.round(H * 0.10);
      for (j = 0; j < LUMP.length; j++) {                      // just under the underside at that column
        dx = xs - G.cx[j];
        if (Math.abs(dx) < G.r[j]) top = Math.max(top, G.cy[j] + Math.round(Math.sqrt(G.r[j] * G.r[j] - dx * dx)) + u(3));
      }
      y = Math.round(top + ph / fall * (land - top));
      x = xs + Math.round(Math.sin(2.2 * ph + i) * u(7));
      if (((ph * 5) | 0) & 1) { hline(x - s, x + s, y, c); hline(x - s + 1, x + s - 1, y - 1, c); px(x + s, y + 1, dk); }
      else {                                                   // edge-on: 2 px wide, never a 1 px scratch
        vline(x, y - s, y + s, c); vline(x + 1, y - s + 1, y + s, c); px(x - 1, y - s + 1, c);
        px(x, y + s + 1, dk); px(x + 1, y + s + 1, dk);
      }
    }
  }
  function tufts() {
    // foreground tufts: clumps of blades fanning from a small base, rooted in the ground at parallax 1,
    // never on the gravel path or against the gate wall. Each tuft's lean flips on its own staggered
    // tick (hash-offset within the 0.6 s period) instead of every other blade in the meadow flicking on
    // the same shared tick. Blades that fall inside the big tree's crown shade darken with the ground
    // around them, instead of sitting on top of it as bright hairlines - only checked once the tree
    // could plausibly be casting that shade on-screen, since treeShadeAt() isn't free.
    var bot = Math.round(seam(H - 1) - camX), a = C('#4e9b46'), b = sunE > u(9) ? C('#6db24f') : a;
    var step = Math.max(3, u(5)), i0 = Math.floor(camX / step) - 2, i1 = Math.ceil((camX + W) / step) + 2, m = u(2), el = PG_SCR.el, er = PG_SCR.er;
    var treeOn = t > 0.68 && sunE > u(9), dark = false;
    var i, x, y, h, lean, n, k;
    function tpx(px_, py_, c) { px(px_, py_, c); if (dark) shade(px_, py_, TREE_SHADE); }
    function tvl(vx, vy0, vy1, c) { vline(vx, vy0, vy1, c); if (dark) { for (var yy = vy0; yy <= vy1; yy++) shade(vx, yy, TREE_SHADE); } }
    for (i = i0; i <= i1; i++) {
      if (hash(i * 5 + 3) > 0.55) continue;
      x = Math.round(i * step + hash(i * 11) * step * 0.8 - camX);
      if (x <= bot || x < -u(4) || x >= W + u(4)) continue;
      y = H - 1 - Math.round(hash(i * 17) * GH * 0.14);
      if (x - m < seam(y) - camX) continue;
      if (x > el[y] - 1 - m && x < er[y] + 1 + m) continue;
      h = Math.max(4, u(3) + Math.round(hash(i * 23) * u(4)));
      lean = (((clock * 10 / 6 + hash(i * 29) * 6) | 0)) & 1;
      dark = treeOn && treeShadeAt(x, y);
      tvl(x, y - h, y, a); tvl(x + 1, y - h + 2, y, a); tpx(x + lean, y - h - 1, b);
      n = Math.round(h * 0.7);
      for (k = 0; k < n; k++) { tpx(x - 1 - (k >> 2), y - k, a); tpx(x + 2 + (k >> 2), y - k, k > h * 0.5 ? b : a); }
    }
  }

  // ---------- people and traffic: hooks in the draw order, filled in by the life pass ----------
  function lifeFarX(cy) {
    // World x of everything queued behind the stopped streetcar in the far lane: its own rear
    // (tail), the sedan waiting right behind it, and the delivery van further along, clear of the
    // sedan. This mirrors the street package's own POLE math (INTEGRATE S1) so the two packages'
    // figures line up once merged; STREET_ units are not ours to touch, so it is recomputed here.
    var tail = 0.70 * W, sx = tail + mpx(1.2, cy), se = sx + mpx(LIFE_CAR.sedan.L, cy), vx = se + mpx(1, cy);
    var vcy = KERB + Math.round(0.03 * RH);                 // the van's own row, parked closer to the far kerb
    return { tail: tail, sx: sx, se: se, vx: vx, ve: vx + mpx(LIFE_CAR.van.L, vcy), vcy: vcy };
  }
  function lifePoleX(cy) {
    return 0.70 * W - mpx(29.5, cy);        // 1.5 m ahead of the cab nose, same as the street package's POLE
  }
  function lifeRider2(cy, y) {
    // waits half a metre out from the stop pole, ahead of the cab where the body does not hide
    // it, checking a phone; faces left, away from the cab, so the far half keeps its left-only rule
    var h = mpx(1.7, y), sx = sxOf(lifePoleX(cy) + mpx(0.5, cy), 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, -1, -1, LIFE_FOLK[1], 0, 2);
  }
  function lifeCommuter2(F, cy, y) {
    // Walks the far sidewalk toward the stop: moving and facing left only, as the far half
    // requires. The loop restarts hidden inside the van's silhouette and ends hidden inside the
    // streetcar's, so the restart and the wrap are never seen. It is not drawn while crossing the
    // queued sedan: the sedan (1.45 m) is shorter than a standing adult on this row, so there is no
    // silhouette tall enough to hide it there, and a floating head over the roofline looks broken -
    // skipping that stretch reads as briefly out of sight behind the car instead.
    var h = mpx(1.7, y), v = mpx(1.3, y), x0 = F.vx + mpx(2, cy), x1 = F.tail - mpx(6, cy), D = x0 - x1;
    var T = D / v, d = clock % T, x = x0 - d * v;
    if (x <= F.se && x >= F.sx) return;
    var sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, -1, (d * v / (0.764 * h)) % 1, LIFE_FOLK[0], 0, 0);
  }
  function lifeWorker2(vanX, y) {
    // Unloading the van: a box at a time from its rear doors, at the van's east end, to a stack
    // clear of the body a few metres further along the sidewalk, then back. Stops at both ends,
    // so there is no wrap at all; walking pace is slower with a load. Gated on the true left/right
    // extent of everything drawn (the walker's own span AND the static box stack), not a mismatched
    // pair of edges, so the boxes never show with nobody around to explain them.
    var h = mpx(1.7, y), v = mpx(1.1, y), xa = vanX + mpx(0.35, y), xb = xa + mpx(4.5, y), T = (xb - xa) / v, P = 5.5 + 2 * T;
    var tau = (clock + 3.5 + 0.45 * T) % P, x, dir = -1, ph = -1, carry = 0, sb = sxOf(xb - mpx(1.3, y), 1), sa = sxOf(xa, 1);
    if (Math.min(sa, sb) > W + 40 || Math.max(sa, sb) < -40) return;
    lifeBoxes(sb, y - 1);
    if (tau < 3.5) { x = xa; dir = -1; }
    else if (tau < 3.5 + T) { x = xa + (tau - 3.5) * v; carry = 1; dir = 1; ph = ((tau - 3.5) * v / (0.764 * h)) % 1; }
    else if (tau < 5.5 + T) x = xb;
    else { x = xb - (tau - 5.5 - T) * v; dir = -1; ph = ((tau - 5.5 - T) * v / (0.764 * h)) % 1; }
    lifeContact(sxOf(x, 1), y, h * 0.14);
    lifeSide(sxOf(x, 1), y, h, dir, ph, LIFE_FOLK[2], 0, carry);
  }
  function sidewalkLife() {
    // Dawn downtown is nearly empty: one rider off the back of the streetcar, one walking up the
    // sidewalk, one delivery worker. Everyone is on the far sidewalk, so they come out 48-62 px tall,
    // and the street is still in the storefronts' shade: contact shade only, no rim light. All three
    // move or face left only, as the far half requires.
    if (camX > 1.1 * W) return;
    var BY = KERB - BASE, cy = KERB + Math.round(0.09 * RH), F = lifeFarX(cy);
    lifeCommuter2(F, cy, BASE + Math.round(0.55 * BY));
    lifeRider2(cy, KERB - Math.round(0.14 * BY));
    lifeWorker2(F.ve, KERB - Math.round(0.10 * BY));
  }
  function parkLife() {
    // Mid-morning park: someone reading on the bench, a dog walker stopped while the dog sniffs, two
    // people sitting far out on the lawn, a walker and a runner coming out from behind the big tree.
    // Sizes come from the row each one stands on, and farther rows draw first. There is no camera
    // gate: every figure culls itself by screen x, so nobody can switch on while in view.
    lifePair(HZ + Math.round(0.11 * GH));
    lifeRunner(HZ + Math.round(0.15 * GH));
    lifeDogWalk(HZ + Math.round(0.18 * GH));
    lifeTreeWalker(HZ + Math.round(0.24 * GH));
    lifeSitter(HZ + Math.round(0.66 * GH));
  }
  function farTraffic() {
    // The lane the streetcar stops in: a sedan waiting right behind it with its doors open
    // (lights on at dawn, brake lights lit), and a delivery van further along at the kerb, clear
    // of the sedan. Traffic keeps right: both face left, same as the car, and nothing drives
    // through - this half of the road runs one way, and it waits for the streetcar.
    if (camX > 1.2 * W) return;
    var cy = KERB + Math.round(0.09 * RH), F = lifeFarX(cy);
    lifeCar(sxOf(F.sx, 1), cy, -1, LIFE_CAR.sedan, ['#33373b', '#4a555e', '#6d777b'], t < 0.35, 1);
    lifeCar(sxOf(F.vx, 1), F.vcy, -1, LIFE_CAR.van, ['#4a555e', '#6d777b', '#9aa3a6'], 0, 0);
  }
  function nearTraffic() {}  function lifeTreeWalker(y) {
    // Comes out from behind the big trunk and walks off the right edge of the world. The lap
    // restarts behind the trunk and waits past the world's edge, so nobody pops in and the loop is not obvious.
    var h = mpx(1.7, y), v = mpx(1.3, y), d = ((clock + 7.5) % 47) * v, x = TREEX + u(4) + d, sx, rim;
    if (x > 4 * W + h) return;
    sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    rim = lifeRim(sx, h * 0.09);
    lifeFoot(sx, y, h, rim);
    lifeSide(sx, y, h, 1, (d / (0.764 * h)) % 1, LIFE_FOLK[6], rim, 0);
  }  function lifeSit(x, y, k, s, rim) {
    // cross-legged on the grass with their backs to us, looking out at the skyline: a low wide base
    // of folded legs, a back that narrows to the shoulders, the back of a head
    var hh = Math.max(3, Math.round(0.23 * k)), hw = Math.max(3, Math.round(0.17 * k)), tw = Math.max(4, Math.round(0.38 * k)), bw = Math.max(6, Math.round(0.66 * k));
    var lb = Math.round(y - 0.13 * k), tt = Math.round(y - 0.66 * k), r, w, a;
    lifeContact(x, y, bw / 2);
    if (rim) lifeCast(x - (tw >> 1), y, tw, Math.round(0.9 * k), 0.22);
    rect(Math.round(x - bw / 2), lb, bw, y - lb + 1, C(s.bot[1]));
    px(Math.round(x - bw / 2), lb, C(s.bot[0])); px(Math.round(x - bw / 2) + bw - 1, lb, C(s.bot[0]));
    for (r = tt; r < lb; r++) {
      w = tw * (0.78 + 0.22 * (r - tt) / (lb - tt)) - (r === tt ? 2 : 0); a = Math.round(x - w / 2);
      hline(a, a + Math.round(w) - 1, r, C(s.top[1]));
      lifeEdge(a, a + Math.round(w) - 1, r, rim, C(s.top[2]));
    }
    a = Math.round(x - hw / 2);
    rect(a, tt - hh + 1, hw, hh - 1, C(s.hair));
    hline(a + 1, a + hw - 2, tt - hh, rim ? C(s.hl) : C(s.hair));
    px(Math.round(x), tt - 1, C(LIFE_SKIN[s.skin][0]));
  }  function lifePair(y) {
    // two people sitting out on the far lawn, a 20 px pair at the treeline's foot
    var k = (y - HZ) / 2.5, sx = sxOf(3.22 * W, 1), rim = lifeRim(sx, 0.55 * k);
    if (sx < -60 || sx > W + 60) return;
    lifeSit(sx - Math.round(0.34 * k), y, k, LIFE_FOLK[7], rim);
    lifeSit(sx + Math.round(0.34 * k), y + 1, k, LIFE_FOLK[1], rim);
  }  function lifeDog(x, y, dir, k, rim) {
    // side view of a medium dog, head down sniffing; returns the collar point for the leash
    // a medium dog, lab-sized: 0.55 m at the shoulder, deep chest, belly tucked up toward the hips
    var c = C('#8a6a3f'), dk = C('#6f573c'), lt = C('#a8854f'), nose = C('#26292d');
    var bl = 0.64 * k, top = Math.round(y - 0.54 * k), bd = Math.max(3, Math.round(0.25 * k)), lg = Math.max(1, Math.round(0.065 * k)), r, a, b, fr;
    var fx = x + dir * 0.22 * k, rx = x - dir * 0.21 * k, lb = top + bd - 1;
    rect(Math.round(fx + dir * 0.08 * k), lb, lg, y - lb + 1, dk);
    rect(Math.round(rx - dir * 0.08 * k), lb, lg, y - lb + 1, dk);
    for (r = 0; r < bd; r++) {
      fr = r / (bd - 1); a = x - bl / 2 + (r === 0 ? 1 : 0); b = x + bl / 2 - (r === 0 ? 1 : 0);
      if (fr > 0.5) { if (dir > 0) a += (fr - 0.5) * 0.36 * k; else b -= (fr - 0.5) * 0.36 * k; }
      hline(Math.round(a), Math.round(b), top + r, r === 0 && rim ? lt : r === bd - 1 ? dk : c);
    }
    rect(Math.round(fx), lb, lg, y - lb + 1, c);
    rect(Math.round(rx), lb, lg, y - lb + 1, c);
    var nx = x + dir * (bl / 2 - 0.04 * k), hx = nx + dir * 0.15 * k;
    lifeLimb(nx, top + 0.07 * k, hx, y - 0.15 * k, Math.max(3, 0.17 * k), Math.max(2, 0.13 * k), c);
    lifeLimb(hx, y - 0.16 * k, hx + dir * 0.10 * k, y - 0.03 * k, Math.max(2, 0.12 * k), Math.max(1, 0.07 * k), c);
    px(Math.round(hx + dir * 0.10 * k), Math.round(y - 0.02 * k), nose);
    lifeLimb(hx - dir * 0.03 * k, y - 0.22 * k, hx - dir * 0.06 * k, y - 0.12 * k, 2, 1, dk);
    var tx = x - dir * bl / 2;
    lifeLimb(tx, top + 1, tx - dir * 0.07 * k, top - 0.16 * k, Math.max(2, 0.05 * k), 1, c);
    return [nx - dir * 0.02 * k, top + 0.08 * k];
  }  function lifeDogWalk(y) {
    // stopped on the lawn while the dog, on its leash, has its nose in the grass
    var k = (y - HZ) / 2.5, sx = sxOf(2.87 * W, 1), dx = sx + Math.round(1.25 * k), rim = lifeRim(sx, 0.15 * k);
    if (sx < -60 || sx > W + 100) return;
    lifeFoot(sx, y, 1.7 * k, rim);
    lifeContact(dx, y, 0.3 * k);
    if (rim) lifeCast(dx - Math.round(0.3 * k), y, Math.round(0.6 * k), Math.round(0.5 * k), 0.22);
    var hand = lifeSide(sx, y, 1.7 * k, 1, -1, LIFE_FOLK[4], rim, 3);
    var col = lifeDog(dx, y, -1, k, rim), i, n = Math.max(8, Math.round(col[0] - hand[0])), f, c = C('#7e3226');
    for (i = 0; i <= n; i++) { f = i / n; px(Math.round(hand[0] + (col[0] - hand[0]) * f), Math.round(hand[1] + (col[1] - hand[1]) * f + 0.12 * k * 4 * f * (1 - f)), c); }
  }  function lifeBench(x, yb, s, rim) {
    // Seen from the front, sitting on the bench and reading. The thighs come toward us, so from 2.5 m up
    // they are a short band at seat height, lighter on top, wider than the waist with the knees apart;
    // both shins drop from the knee ends to shoes a few rows nearer than the bench. The book is held up at
    // chest height with the forearms raised and the head bowed over it. The sun is behind the sitter:
    // the front is in its own shade, and only the tops and the sun-side edges catch light.
    var k = (yb - HZ) / 2.5, dr = (yb - HZ) * (yb - HZ) / (2.5 * W), i, r, fr, w, a, b, g;
    var sk = LIFE_SKIN[s.skin], cS = C(sk[1]), cSd = C(sk[0]), cH = C(s.hair), cHl = C(s.hl), cT = C(s.top[1]), cTd = C(s.top[0]), cTl = C(s.top[2]), cB = C(s.bot[1]), cBd = C(s.bot[0]), cBl = C(s.bot[2]), cSh = C(s.shoe);
    var ys = yb - 0.45 * k, yl = Math.round(ys - 0.13 * k), yk = Math.round(yb + 0.42 * dr - 0.53 * k), yu = Math.round(yb + 0.42 * dr - 0.40 * k);
    var yf = Math.round(yb + 0.55 * dr), sh = Math.max(2, Math.round(0.08 * k)), ysho = Math.round(ys - 0.58 * k), yh = Math.round(ys - 0.84 * k);
    for (r = ysho; r <= yl + 2; r++) {                        // sweater: rounded shoulders narrowing to the waist
      fr = (r - ysho) / (yl - ysho); w = k * (0.40 - 0.07 * Math.min(1, fr * 1.3)) - Math.max(0, 3 - r + ysho) * 2;
      a = Math.round(x - w / 2); b = Math.round(x + w / 2);
      hline(a, b, r, fr > 0.72 ? cTd : cT);
      lifeEdge(a, b, r, rim, cTl);
    }
    hline(Math.round(x - 0.13 * k), Math.round(x + 0.13 * k), ysho, rim ? cTl : cT);
    for (i = -1; i <= 1; i += 2) {                            // upper arms down the sides to the elbows
      lifeLimb(x + i * 0.18 * k, ysho + 0.05 * k, x + i * 0.21 * k, ys - 0.25 * k, 0.09 * k, 0.085 * k, cT);
      lifeLimb(x + i * 0.14 * k, ysho + 0.09 * k, x + i * 0.165 * k, ys - 0.27 * k, 1, 1, cTd);
      if (rim === 2 || rim === i) lifeLimb(x + i * 0.225 * k, ysho + 0.06 * k, x + i * 0.255 * k, ys - 0.27 * k, 1, 1, cTl);
    }
    for (i = -1; i <= 1; i += 2) {                            // shins from the knees, inner side in shade, shoes toe-on
      lifeLimb(x + i * 0.15 * k, yk + 0.06 * k, x + i * 0.13 * k, yf - sh + 1, 0.12 * k, 0.085 * k, cBd);
      lifeLimb(x + i * 0.16 * k, yk + 0.06 * k, x + i * 0.14 * k, yf - sh + 1, 0.10 * k, 0.065 * k, cB);
      a = Math.round(x + i * 0.135 * k - 0.06 * k);
      rect(a, yf - sh + 1, Math.round(0.12 * k), sh, cSh);
      hline(a, a + Math.round(0.12 * k) - 1, yf, cBd);
      lifeContact(x + i * 0.135 * k, yf, 0.07 * k);
    }
    for (r = yl; r <= yu; r++) {                              // the lap: thighs toward us, knees apart
      fr = (r - yl) / (yu - yl); w = k * (0.36 + 0.10 * Math.min(1, fr * 1.6));
      a = Math.round(x - w / 2); b = Math.round(x + w / 2);
      hline(a, b, r, r === yu ? cBd : r < yk ? cBl : cB);
      if (fr > 0.3) { g = Math.max(1, Math.round(0.05 * k * (fr - 0.3) / 0.7)); hline(Math.round(x - g / 2), Math.round(x - g / 2) + g - 1, r, cBd); }
    }
    var bw = Math.round(0.30 * k), bh = Math.round(0.14 * k), bx = Math.round(x - bw / 2), by0 = Math.round(ys - 0.49 * k);
    for (i = -1; i <= 1; i += 2) lifeLimb(x + i * 0.21 * k, ys - 0.25 * k, x + i * 0.14 * k, by0 + 0.08 * k, 0.085 * k, 0.07 * k, cTd);
    rect(bx, by0, bw, bh, C('#4a555e'));                      // the covers, open toward the reader
    hline(bx + 1, bx + bw - 2, by0, C('#d9b48c'));            // page edges
    vline(bx + (bw >> 1), by0, by0 + bh - 1, C('#26292d'));   // spine
    for (i = -1; i <= 1; i += 2) rect(Math.round(x + i * 0.15 * k - 0.035 * k), by0 + Math.round(0.03 * k), Math.round(0.07 * k), Math.round(0.08 * k), cS);
    var n = Math.round(0.23 * k), hw = 0.155 * k, nk = Math.round(0.075 * k);
    rect(Math.round(x - nk / 2), yh + n - 2, nk, ysho - yh - n + 3, cSd);
    for (r = 0; r < n; r++) {                                 // bowed over the book: more crown than face
      fr = (r + 0.5) / n; w = hw * Math.sqrt(Math.max(0.2, 1 - (2 * fr - 1) * (2 * fr - 1)));
      a = Math.round(x - w / 2); b = Math.round(x + w / 2);
      hline(a, b, yh + r, fr < 0.5 ? cH : cSd);
      if (fr >= 0.5 && fr < 0.75) { px(a, yh + r, cH); px(b, yh + r, cH); }
      if (fr > 0.52 && fr < 0.7) { px(a - 1, yh + r, cSd); px(b + 1, yh + r, cSd); }
      if (r === 0 && rim) hline(a + 1, b - 1, yh, cHl);
      else if (fr < 0.5) lifeEdge(a, b, yh + r, rim, cHl);
    }
  }  function lifeSitter(yb) {
    // on the decided bench (world 2.22W-2.31W on this row), 0.42 m in from its left end, so most of the bench still reads
    var k = (yb - HZ) / 2.5, sx = sxOf(2.22 * W + 0.42 * k, 1), rim = lifeRim(sx, 0.25 * k);
    if (sx < -80 || sx > W + 80) return;
    if (rim) lifeCast(Math.round(sx - 0.22 * k), yb, Math.round(0.44 * k), Math.round(1.3 * k), 0.22);
    lifeBench(sx, yb, LIFE_FOLK[3], rim);
  }  function lifeRunner(y) {
    // A runner in a navy top (a dull red headband is the one accent) comes out from behind the big trunk
    // and runs off the right edge of the world at 2.8 m/s, 2.8 steps a second. The lap restarts behind
    // the trunk and waits past the world's edge, so it is hidden at every camera position. It keeps to
    // the lawn: on the far path it would run through the stop-3 notice board.
    var h = mpx(1.7, y), v = mpx(2.8, y), d = ((clock + 24) % 40) * v, x = TREEX + u(6) + d, sx, rim;
    if (x > 4 * W + h) return;
    sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    rim = lifeRim(sx, h * 0.1);
    lifeFoot(sx, y, h, rim);
    lifeSide(sx, y, h, 1, (d / (h * 0.41 / 0.35)) % 1, LIFE_FOLK[5], rim, 4);
  }  function lifeLamp(x0, by, k, dir, Lp, q, c, c2) {
    var a = Math.round(q[0] * k), b = Math.max(a + 1, Math.round(q[1] * k)) - 1, y0 = by - Math.round(q[3] * k), y1 = by - Math.round(q[2] * k);
    if (dir < 0) { var s = Lp - 1 - b; b = Lp - 1 - a; a = s; }
    rect(x0 + a, y0, b - a + 1, Math.max(1, y1 - y0), c);
    hline(x0 + a, x0 + b, y0, c2);
  }  function lifeCar(x0, by, dir, v, col, lit, brake) {
    // Side view of a car or van from a height profile in metres, so the proportions are the real
    // ones at any row: glass dark with a band of sky in it, wheels 0.65 m, sills darker, the road under
    // the body in shade. dir is the way it faces; lit = headlights and tail lights on, brake = brake lights.
    var k = (by - HZ) / 2.5, Lp = Math.round(v.L * k), c, m, tp, g0, g1, i, cx, r, sx, yy, d, fr;
    if (x0 > W + 4 || x0 + Lp < -4) return;
    var body = C(col[1]), dk = C(col[0]), lt = C(col[2]), gl = C('#26292d'), rf = C(t < 0.3 ? '#3d4a63' : '#6d777b');
    var bt = by - Math.round(v.bot * k), belt = by - Math.round(v.belt * k), sill = bt - Math.max(1, Math.round(0.09 * k)), crease = belt + Math.max(2, Math.round(0.10 * k));
    for (c = Math.round(0.12 * k); c < Lp - Math.round(0.12 * k); c++) for (yy = bt + 1; yy <= by; yy++) shade(x0 + c, yy, 0.42);
    for (c = 0; c < Lp; c++) { shade(x0 + c, by + 1, 0.34); if (c > 2 && c < Lp - 3) shade(x0 + c, by + 2, 0.16); }
    for (c = 0; c < Lp; c++) {
      sx = x0 + c;
      if (sx < 0 || sx >= W) continue;
      m = (dir > 0 ? c + 0.5 : Lp - c - 0.5) / k;
      tp = by - Math.round(lifeProf(v.top, m) * k);
      vline(sx, tp, bt, body);
      vline(sx, sill, bt, dk);
      px(sx, tp, lt);
      if (tp < crease - 1) px(sx, crease, lt);
      if (m > v.gl[0] && m < v.gl[1] && (m < v.pil[0] || m > v.pil[1])) {
        g0 = tp + Math.max(1, Math.round(0.07 * k)); g1 = belt - 1;
        if (g1 > g0) {
          vline(sx, g0, g1, gl);
          fr = (m - v.gl[0]) / (v.gl[1] - v.gl[0]);
          vline(sx, g0, g0 + Math.round((g1 - g0) * (0.15 + 0.35 * fr)), rf);
        }
      }
    }
    for (i = 0; i < 3; i++) {
      d = Math.round((dir > 0 ? v.seam[i] : v.L - v.seam[i]) * k); tp = by - Math.round(lifeProf(v.top, v.seam[i]) * k);
      vline(x0 + d, Math.max(tp + 1, belt + 1), sill - 1, dk);
      if (i) px(x0 + d - dir * Math.round(0.28 * k), crease + 1, lt);
    }
    d = Math.round((dir > 0 ? v.gl[1] : v.L - v.gl[1]) * k);
    rect(x0 + d - (dir > 0 ? Math.max(1, Math.round(0.10 * k)) : 0), belt - Math.max(1, Math.round(0.07 * k)), Math.max(2, Math.round(0.11 * k)), Math.max(2, Math.round(0.07 * k)), dk);
    for (i = 0; i < 2; i++) {
      cx = x0 + Math.round((dir > 0 ? v.wh[i] : v.L - v.wh[i]) * k); r = Math.max(2, Math.round(v.r * k)); yy = by - r;
      for (g0 = -r - 2; g0 <= 0; g0++) { g1 = Math.round(Math.sqrt((r + 2) * (r + 2) - g0 * g0)); hline(cx - g1, cx + g1, yy + g0, gl); }
      disc(cx, yy, r, C('#33373b'));
      disc(cx, yy, Math.max(1, Math.round(r * 0.58)), C('#6d777b'));
      for (g0 = -Math.round(r * 0.58); g0 < 0; g0++) px(cx + g0, yy - Math.round(r * 0.58) - g0 - 1 + Math.round(r * 0.1), C('#9aa3a6'));
      px(cx, yy, C('#26292d'));
    }
    var tc = lit || brake ? CR(brake ? '#d9584f' : '#b34a3a') : C('#7e3226');
    lifeLamp(x0, by, k, dir, Lp, v.tail, tc, tc);
    lifeLamp(x0, by, k, dir, Lp, v.head, lit ? CR('#f6f4ea') : C('#b3b8b2'), lit ? CR('#ffd98a') : C('#9aa3a6'));
  }  function lifeBoxes(sx, y) {
    var k = (y - HZ) / 2.5, bw = Math.max(3, Math.round(0.45 * k)), bh = Math.max(2, Math.round(0.34 * k)), i, bx, by;
    var c = C('#a8854f'), dk = C('#8a6a3f'), lt = C('#b98761'), tape = C('#d9b48c');
    lifeContact(sx + bw * 0.9, y, bw);
    for (i = 0; i < 3; i++) {
      bx = sx + (i === 1 ? bw + 1 : i === 2 ? Math.round(bw * 0.2) : 0); by = y - (i === 2 ? bh : 0);
      rect(bx, by - bh + 1, bw, bh, c);
      hline(bx, bx + bw - 1, by - bh + 1, lt);
      vline(bx + bw - 1, by - bh + 1, by, dk);
      vline(bx + (bw >> 1), by - bh + 1, by - (bh >> 1), tape);
    }
  }  function lifeWorker(vanX, y) {
    // Unloading the van: a box at a time from its back doors to a stack by the shops, then back.
    // Stops at both ends, so there is no wrap at all; walking pace is slower with a load.
    var h = mpx(1.7, y), v = mpx(1.1, y), xa = vanX - mpx(0.35, y), xb = xa - mpx(4.5, y), T = (xa - xb) / v, P = 5.5 + 2 * T;
    var tau = (clock + 3.5 + 0.45 * T) % P, x, dir = -1, ph = -1, carry = 0, sb = sxOf(xb - mpx(1.3, y), 1);
    if (sb > W + 40 || sxOf(xa, 1) < -40) return;
    lifeBoxes(sb, y - 1);
    if (tau < 3.5) { x = xa; dir = 1; }
    else if (tau < 3.5 + T) { x = xa - (tau - 3.5) * v; carry = 1; ph = ((tau - 3.5) * v / (0.764 * h)) % 1; }
    else if (tau < 5.5 + T) x = xb;
    else { x = xb + (tau - 5.5 - T) * v; dir = 1; ph = ((tau - 5.5 - T) * v / (0.764 * h)) % 1; }
    lifeContact(sxOf(x, 1), y, h * 0.14);
    lifeSide(sxOf(x, 1), y, h, dir, ph, LIFE_FOLK[2], 0, carry);
  }  function lifeCommuter(rear, cy, y) {
    // Got off at the back doors and walks away to the left. The lap starts hidden behind the
    // streetcar and ends past the left edge of the world, so the wrap is never on screen.
    var h = mpx(1.7, y), v = mpx(1.3, y), xs = rear + 0.05 * W, d = ((clock + (xs - rear + mpx(0.6, cy)) / v) % 41) * v, x = xs - d, sx;
    if (x < -0.05 * W) return;
    sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, -1, (d / (0.764 * h)) % 1, LIFE_FOLK[0], 0, 0);
  }  function lifeRider(y) {
    // waiting a metre past the TTC pole for another car, back turned to the one at the stop, looking at a phone
    var h = mpx(1.7, y), sx = sxOf(0.72 * W + mpx(1.1, y), 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, 1, -1, LIFE_FOLK[1], 0, 2);
  }  function lifeTiny(x, y, h, ph, s) {
    var hh = Math.max(2, Math.round(h * 0.15)), top = Math.round(y - h), hip = Math.round(y - h * 0.47), bw = Math.max(2, Math.round(h * 0.16));
    var f = ph < 0 ? 0.5 : Math.sin(ph * 2 * Math.PI) * h * 0.12;
    lifeLimb(x, hip, x + f, y, 1, 1, C(s.bot[0]));
    lifeLimb(x, hip, x - f, y, 1, 1, C(s.bot[1]));
    rect(x - (bw >> 1), top + hh, bw, hip - top - hh + 1, C(s.top[1]));
    rect(x - (hh >> 1), top, hh, hh, C(LIFE_SKIN[s.skin][1]));
    hline(x - (hh >> 1), x - (hh >> 1) + hh - 1, top, C(s.hair));
    return [x, hip];
  }  function lifeArm(sx, sy, h, dir, an, c, cs, carry) {
    // carry: 0 swinging (upper arm within 0.3 rad, the elbow a little bent on the forward swing), 1 both forearms
    // forward under a box, 2 phone held at the chest, 3 leash hand low and forward, 4 running (elbow near a right angle)
    var al = h * 0.18, fl = h * 0.16, aw = Math.max(1.6, h * 0.05), ex, ey, hx, hy, a2;
    if (carry === 1) { ex = sx + dir * h * 0.03; ey = sy + al * 0.95; hx = ex + dir * fl; hy = ey - h * 0.03; }
    else if (carry === 2) { ex = sx + dir * h * 0.01; ey = sy + al; hx = ex + dir * fl * 0.72; hy = ey - fl * 0.62; }
    else if (carry === 3) { ex = sx + dir * h * 0.05; ey = sy + al * 0.97; hx = ex + dir * fl * 0.75; hy = ey + fl * 0.62; }
    else { ex = sx + dir * Math.sin(an) * al; ey = sy + Math.cos(an) * al; a2 = an + (carry === 4 ? 1.5 : an > 0 ? 0.2 : 0.12); hx = ex + dir * Math.sin(a2) * fl; hy = ey + Math.cos(a2) * fl; }
    lifeLimb(sx, sy, ex, ey, aw * 1.15, aw, c);
    lifeLimb(ex, ey, hx, hy, aw, aw * 0.9, c);
    var hs = Math.max(1, Math.round(aw * 0.9));
    rect(Math.round(hx - hs / 2), Math.round(hy), hs, hs, cs);
    return [hx, hy];
  }  function lifeLeg(hx, hy, ax, y, lift, h, dir, c, cs) {
    var ay = y - lift - h * 0.04, lb = h * 0.235, vx = ax - hx, vy = ay - hy, D = Math.sqrt(vx * vx + vy * vy) || 1, bb = lb * lb - D * D / 4, lw = Math.max(2, h * 0.072);
    bb = bb > 0 ? Math.sqrt(bb) : 0;
    var kx = (hx + ax) / 2 + dir * vy / D * bb, ky = (hy + ay) / 2 - dir * vx / D * bb;
    lifeLimb(hx, hy, kx, ky, lw * 1.2, lw, c);
    lifeLimb(kx, ky, ax, ay, lw, lw * 0.75, c);
    var sl = Math.max(3, Math.round(h * 0.135)), sh = Math.max(1, Math.round(h * 0.04)), x0 = Math.round(ax - dir * h * 0.04);
    rect(dir > 0 ? x0 : x0 - sl + 1, Math.round(y - lift) - sh + 1, sl, sh, cs);
  }  function lifeSide(x, y, h, dir, ph, s, rim, carry) {
    // Side view, feet on row y at x. Proportions: head 1/7.5, legs half. A foot is planted for a share of
    // the cycle (half walking, 0.35 running) and moves back at body speed, so the body covers st/duty per
    // cycle and the foot never slides: 0.764h walking, 1.171h running. The knee is solved from thigh and
    // shin length; arms swing against the legs. carry 4 is a run: longer stride, the heel kicked up behind,
    // a flight phase with the body at its highest, elbows bent. Standing, one foot is a little forward.
    if (h < 16) return lifeTiny(x, y, h, ph, s);
    var run = carry === 4, duty = run ? 0.35 : 0.5, st = h * (run ? 0.41 : 0.382), i, q, f, fst = 0, F = [0, 0], LF = [0, 0], hh;
    for (i = 0; i < 2; i++) {
      if (ph < 0) { F[i] = (i ? -0.05 : 0.10) * h; continue; }
      q = (ph + i * 0.5) % 1;
      if (q < duty) { F[i] = st * (0.5 - q / duty); fst = Math.abs(F[i]); }
      else if (run) { f = (q - duty) / (1 - duty); F[i] = st * (Math.pow(f, 1.6) - 0.5); LF[i] = h * 0.2 * Math.sin(Math.PI * Math.pow(f, 0.7)); }
      else { f = (q - duty) / (1 - duty); F[i] = st * (f - 0.5); LF[i] = h * 0.07 * Math.sin(f * Math.PI); }
    }
    var e = fst / (st * 0.5), yb = y + (ph < 0 ? 0 : run ? h * (0.012 * Math.cos(4 * Math.PI * (ph - 0.175)) - 0.008) : h * 0.02 * e * e), lean = ph < 0 ? 0 : h * (run ? 0.045 : 0.02) * dir;
    var sk = LIFE_SKIN[s.skin], cS = C(sk[1]), cSd = C(sk[0]), cH = C(s.hair), cHl = C(s.hl);
    var cT = C(s.top[1]), cTd = C(s.top[0]), cTl = C(s.top[2]), cB = C(s.bot[1]), cBd = C(s.bot[0]), cSh = C(s.shoe);
    var hipY = yb - h * 0.5, shX = x + lean * 0.9 - dir * h * 0.012, shY = yb - h * 0.80, sw = ph < 0 ? 0.03 : F[0] / (st * 0.5) * (run ? 0.55 : 0.3);
    lifeArm(shX + dir * h * 0.02, shY, h, dir, carry && !run ? 0.03 : sw, cTd, cSd, carry === 3 ? 0 : carry);
    lifeLeg(x - dir * h * 0.012, hipY, x + dir * F[1], y, LF[1], h, dir, cBd, cSh);
    if (s.bag) rect(Math.round(x + lean * 0.6 - dir * h * 0.075) - (dir > 0 ? Math.round(h * 0.075) : 0), Math.round(yb - h * 0.79), Math.round(h * 0.075) + 1, Math.round(h * 0.26), C(s.bag));
    lifeLeg(x + dir * h * 0.012, hipY, x + dir * F[0], y, LF[0], h, dir, cB, cSh);
    var t0 = Math.round(yb - h * 0.845), t1 = Math.round(yb - h * s.hem), r, fr, w, cx, a = 0, b = 0, yy, n, hc;
    for (r = t0; r <= t1; r++) {
      fr = (r - t0) / Math.max(1, t1 - t0);
      w = h * (0.16 - 0.03 * fr) - (r - t0 < 2 ? (2 - r + t0) * Math.max(1, h * 0.015) : 0);
      cx = x + lean * (1 - fr) + dir * h * 0.008;
      a = Math.round(cx - w / 2); b = Math.round(cx + w / 2);
      hline(a, b, r, r === t1 ? cTd : cT);
      px(dir > 0 ? a : b, r, cTd);
      lifeEdge(a, b, r, rim, cTl);
    }
    if (rim) hline(Math.round(x + lean - h * 0.055), Math.round(x + lean + h * 0.055), t0, cTl);
    if (carry === 1) {
      var bw = Math.round(h * 0.22), bx = Math.round(x + lean + dir * h * 0.07);
      rect(dir > 0 ? bx : bx - bw + 1, Math.round(yb - h * 0.74), bw, Math.round(h * 0.19), C('#a8854f'));
      hline(dir > 0 ? bx : bx - bw + 1, dir > 0 ? bx + bw - 1 : bx, Math.round(yb - h * 0.74), C('#b98761'));
      vline(Math.round(bx + dir * bw * 0.5), Math.round(yb - h * 0.74), Math.round(yb - h * 0.56), C('#d9b48c'));
    }
    hh = h * 0.133; n = Math.max(3, Math.round(hh)); hc = x + lean + dir * h * 0.015;
    var hy0 = Math.round(yb - h) + (carry === 2 ? 1 : 0), hw = h * 0.12, nk = Math.max(1, Math.round(h * 0.045));
    rect(Math.round(hc - nk / 2 - dir * h * 0.012), hy0 + n - 1, nk, Math.max(1, t0 - hy0 - n + 2), cSd);
    for (r = 0; r < n; r++) {
      fr = (r + 0.5) / n; yy = hy0 + r;
      w = hw * Math.sqrt(Math.max(0.25, 1 - (2 * fr - 1.05) * (2 * fr - 1.05)));
      a = Math.round(hc - w / 2); b = Math.round(hc + w / 2);
      hline(a, b, yy, cS);
      if (s.cap && fr < 0.42) { hline(a, b, yy, C(s.cap)); if (fr > 0.28) hline(dir > 0 ? b : a - Math.round(h * 0.05), dir > 0 ? b + Math.round(h * 0.05) : a, yy, C(s.cap)); }
      else if (fr < 0.3) hline(a, b, yy, cH);
      else if (fr < 0.8 || s.long) { if (dir > 0) hline(a, Math.round(hc - w * 0.08), yy, cH); else hline(Math.round(hc + w * 0.08), b, yy, cH); }
      if (s.band && r === Math.round(n * 0.3)) hline(a, b, yy, C(s.band));
      if (r === 0 && rim) hline(a + 1, b - 1, yy, s.cap ? C('#4a555e') : cHl);
    }
    if (n >= 7) px(dir > 0 ? b + 1 : a - 1, hy0 + Math.round(n * 0.55), cS);
    if (s.long) rect(dir > 0 ? Math.round(hc - hw * 0.5) : Math.round(hc + hw * 0.15), hy0 + n - 1, Math.max(1, Math.round(hw * 0.35)), Math.round(h * 0.07), cH);
    var hand = lifeArm(shX, shY, h, dir, carry && !run ? 0 : -sw, cT, cS, carry);
    if (carry === 2) {
      px(Math.round(hand[0] + dir), Math.round(hand[1]) - 1, C('#26292d'));
      if (t < 0.35) px(Math.round(hand[0] + dir), Math.round(hand[1]) - 2, CR('#a3ddf2'));
    }
    return hand;
  }  function lifeFoot(sx, y, h, rim) {
    lifeContact(sx, y, h * 0.14);
    if (rim) lifeCast(Math.round(sx - h * 0.09), y, Math.max(2, Math.round(h * 0.18)), Math.round(h), 0.24);
  }  function lifeCast(bx, by, ow, oh, a0) {
    // A figure's cast shadow, projected like shadow() (sunK, projX, projY, same dither) but without its contact
    // strip. shadow() drops a quad that has turned too oblique to read, which switched a long shadow off in one
    // camera pixel while panning; this one fades out over the last stretch before that cut-off instead.
    var k = sunK(oh), ty, t1, t2, s, f, x, y, xl, xr;
    if (!k || bx > W + u(400) || bx + ow < -u(400)) return;
    if (ow < u(2)) { bx -= (u(2) - ow) >> 1; ow = u(2); }
    ty = projY(by, k); t1 = projX(bx, k); t2 = projX(bx + ow, k); s = Math.max(1, ty - by);
    a0 *= cl01(ow * s / (u(2) * Math.max(1, Math.abs(t1 - bx), Math.abs(t2 - bx - ow))) - 1);
    if (a0 < 0.02) return;
    for (y = by + 2; y <= Math.min(H - 1, Math.round(ty)); y++) {
      f = (y - by) / s; xl = Math.max(0, Math.round(bx + (t1 - bx) * f)); xr = Math.min(W - 1, Math.round(bx + ow + (t2 - bx - ow) * f));
      for (x = xl; x <= xr; x++) if (f <= 0.55 || BAY[(y & 3) * 4 + (x & 3)] <= 9) shade(x, y, a0 * (1 - 0.45 * f));
    }
  }  function lifeContact(x, y, hw) {
    var a = Math.round(x - hw), b = Math.round(x + hw), i;
    for (i = a; i <= b; i++) { shade(i, y + 1, 0.30); if (i > a && i < b) shade(i, y + 2, 0.14); }
  }  function lifeEdge(a, b, y, rim, c) { if (rim > 0) px(b, y, c); if (rim < 0 || rim === 2) px(a, y, c); }  function lifeRim(sx, hw) {
    // the edge that catches the low sun: 1 the right one (figure left of the sun), -1 the left one, and 2 both
    // while the sun is behind the figure, so passing under the sun adds an edge instead of swapping sides
    return sunE > u(9) ? (Math.abs(sx - sunX) <= hw ? 2 : sx < sunX ? 1 : -1) : 0;
  }  function lifeProf(p, m) {
    for (var i = 2; i < p.length; i += 2) if (m <= p[i]) return p[i - 1] + (p[i + 1] - p[i - 1]) * (m - p[i - 2]) / Math.max(1e-6, p[i] - p[i - 2]);
    return p[p.length - 1];
  }  function lifeLimb(x0, y0, x1, y1, w0, w1, c) {
    // a thick segment, stepped along its long axis so steep limbs keep their width
    var dx = x1 - x0, dy = y1 - y0, n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))), k, f, w, a, vert = Math.abs(dy) >= Math.abs(dx);
    if (n < 1) n = 1;
    for (k = 0; k <= n; k++) {
      f = k / n; w = Math.max(1, Math.round(w0 + (w1 - w0) * f));
      if (vert) { a = Math.round(x0 + dx * f - w / 2); hline(a, a + w - 1, Math.round(y0 + dy * f), c); }
      else { a = Math.round(y0 + dy * f - w / 2); vline(Math.round(x0 + dx * f), a, a + w - 1, c); }
    }
  }

  // ---------- frame ----------
  function draw() {
    if (!buf) { owed = true; return; }        // in a worker the last frame's buffer is still out at the page
    geom();
    setGrade(t);
    sky(); stars(); moon(); sun(); plane(); clouds(); skyline(); birds(); treeline(); grass(); street(); streetShadows();
    storefronts(); wires(); lights(); sidewalkLife(); wallgate(); path(); flowers(); parkShadows(); bench(); parkProps(); treeShadows(); parkLife();
    farTraffic(); streetcar(); nearTraffic(); props(); trunk(); canopy(); leaves(); tufts();
    frames++;
    if (present) { var b = img.data.buffer; img = buf = null; present(b, W, H, scale); }
    else if (scale === 1) ctx.putImageData(img, 0, 0);
    else {
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false; ctx.mozImageSmoothingEnabled = false; ctx.webkitImageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, W, H, 0, 0, W * scale, H * scale);
    }
  }
  function size() {
    var d = dims(env);
    scale = d.s; W = d.W; H = d.H;
    HZ = Math.round(H * 0.62); WORLD = 4 * W;
    if (present) { off = octx = null; img = new ImageData(W, H); }
    else if (scale === 1) { off = octx = null; img = ctx.createImageData(W, H); }
    else { off = document.createElement('canvas'); off.width = W; off.height = H; octx = off.getContext('2d'); img = octx.createImageData(W, H); }
    buf = new Uint32Array(img.data.buffer);
    skyRow = new Uint32Array(H); crowMask = new Uint8Array(W);
    if (!present) {
      canvas.width = W * scale; canvas.height = H * scale;
      canvas.style.width = (W * scale / env.dpr) + 'px'; canvas.style.height = (H * scale / env.dpr) + 'px';
    }
    key = -1;
  }

  // ---------- ambient: setInterval, never rAF - a backgrounded page never gets a frame ----------
  function tick() { clock += 0.1; draw(); }
  function sync() {
    var want = ambient && !dead && visible && !env.reduce;
    if (want && !timer) timer = setInterval(tick, 100);
    else if (!want && timer) { clearInterval(timer); timer = null; }
  }
  function onVis() { visible = document.visibilityState !== 'hidden'; sync(); }
  function onResize() { clearTimeout(rt); rt = setTimeout(function () { if (!dead) { env = readEnv(canvas); size(); camX = Math.round(progress * (WORLD - W)); t = progress; draw(); } }, 160); }
  // worker side: the page hands back the buffer it just blitted, and a draw asked for while it was out runs now
  function adopt(b) {
    if (dead || buf || b.byteLength !== W * H * 4) return;          // a buffer from before a resize is dropped
    img = new ImageData(new Uint8ClampedArray(b), W, H); buf = new Uint32Array(b);
    if (owed) { owed = false; draw(); }
  }

  size();
  camX = Math.round(progress * (WORLD - W)); t = progress;
  draw();
  if (!present) { document.addEventListener('visibilitychange', onVis); addEventListener('resize', onResize); }

  return {
    set: function (o) {
      if (dead) return;                                     // a destroyed handle draws nothing
      var p = cl01(o && o.progress !== undefined ? o.progress : progress);
      progress = p; camX = Math.round(p * (WORLD - W)); t = p;
      var k = camX * 16 + Math.round(t * 12);                // same camera pixel and same time step -> same frame
      if (k === key) return; key = k;
      draw();
    },
    resize: function () { if (dead) return; if (!present) env = readEnv(canvas); size(); camX = Math.round(progress * (WORLD - W)); t = progress; draw(); },
    env: function (e) { if (dead) return; env = e; visible = e.visible; size(); camX = Math.round(progress * (WORLD - W)); t = progress; draw(); sync(); },
    visible: function (on) { visible = !!on; sync(); },
    adopt: adopt,
    setAmbient: function (on) { ambient = !!on; sync(); },
    destroy: function () { dead = true; ambient = false; sync(); clearTimeout(rt); if (!present) { document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', onResize); } },
    stops: [0, 1 / 3, 2 / 3, 1],
    get progress() { return progress; },
    get frames() { return frames; },
    get ambient() { return !!timer; },
    get info() { return { scale: scale, W: W, H: H, WORLD: WORLD, camX: camX, t: t, U: U }; }
  };
}

// what the renderer needs to know about the page, as plain data so it can cross into a worker
function readEnv(canvas) {
  var mm = typeof matchMedia === 'function';
  return {
    vw: window.innerWidth || (canvas && canvas.clientWidth) || 320, vh: window.innerHeight || (canvas && canvas.clientHeight) || 240,
    dpr: window.devicePixelRatio || 1, coarse: mm && matchMedia('(pointer: coarse)').matches,
    reduce: mm && matchMedia('(prefers-reduced-motion: reduce)').matches, visible: document.visibilityState !== 'hidden'
  };
}
// one art pixel per device pixel. A redraw runs on every scroll step, so a buffer past the budget
// steps up to 2x2 blocks: 2560x1440 is 3.7M and stays 1:1, a 4K panel or a 3x phone would not
function dims(env) {
  var pw = Math.round(Math.max(120, env.vw) * env.dpr), ph = Math.round(Math.max(100, env.vh) * env.dpr);
  var cap = env.coarse ? 1.6e6 : 3.8e6, s = 1;
  while ((pw / s) * (ph / s) > cap) s++;
  return { s: s, W: Math.max(120, Math.ceil(pw / s)), H: Math.max(90, Math.ceil(ph / s)) };
}

function stub() {   // same shape as a real handle, so a caller never has to test for it
  return { set: function () {}, resize: function () {}, setAmbient: function () {}, destroy: function () {}, stops: [0, 1 / 3, 2 / 3, 1], progress: 0, frames: 0, ambient: false, mode: 'none', info: { scale: 0, W: 0, H: 0, WORLD: 0, camX: 0, t: 0, U: 0 } };
}

// ---------- worker side: draws frames, transfers each buffer to the page and waits to get it back ----------
function workerMain() {
  var h;
  self.onmessage = function (e) {
    var m = e.data;
    try {
      if (m.type === 'init') h = mount(null, { progress: m.progress, env: m.env, present: function (b, W, H, s) { self.postMessage({ type: 'frame', buffer: b, W: W, H: H, s: s, info: h && h.info }, [b]); } });
      else if (m.type === 'set') h.set(m);
      else if (m.type === 'env') h.env(m.env);
      else if (m.type === 'buffer') h.adopt(m.buffer);
      else if (m.type === 'ambient') h.setAmbient(m.on);
      else if (m.type === 'visible') h.visible(m.on);
      else if (m.type === 'destroy') { h.destroy(); self.close(); }
    } catch (err) { self.postMessage({ type: 'error', message: String(err && err.stack || err) }); }
  };
}

// ---------- page side ----------
// Frame 0 is drawn right here, so the first paint already has its sky and a worker that never
// starts changes nothing. After that the worker draws and the page only blits: at 1:1 on a 2560
// panel a draw is several ms, and it no longer lands inside the scroll handler.
function mountPage(canvas, opts) {
  opts = opts || {};
  var core = mount(canvas, opts);
  if (!core.info.W || !SRC || typeof Worker === 'undefined' || typeof ImageData === 'undefined' || /[?&]sync\b/.test(location.search)) return core;
  var w, ctx = canvas.getContext('2d'), env = readEnv(canvas), progress = core.progress, ambient = false;
  var live = false, gone = false, done = false, frames = 0, info = core.info, off = null, octx = null, rt = 0;
  try { w = new Worker(SRC); } catch (e) { return core; }
  function fail() {
    if (gone) return;
    gone = true;
    try { w.terminate(); } catch (e) {}
    removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis);
    if (done) return;
    if (live) core = mount(canvas, { progress: progress });      // the page's own renderer was retired at hand-over
    else core.set({ progress: progress });
    core.setAmbient(ambient);
  }
  function onResize() {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (gone) return;
      env = readEnv(canvas);
      if (live) {
        var d = dims(env);
        if (canvas.width !== d.W * d.s || canvas.height !== d.H * d.s) { canvas.width = d.W * d.s; canvas.height = d.H * d.s; }
        canvas.style.width = (d.W * d.s / env.dpr) + 'px'; canvas.style.height = (d.H * d.s / env.dpr) + 'px';
      }
      w.postMessage({ type: 'env', env: env });
    }, 160);
  }
  function onVis() { env.visible = document.visibilityState !== 'hidden'; w.postMessage({ type: 'visible', on: env.visible }); }
  w.onerror = function (e) { if (e && e.preventDefault) e.preventDefault(); fail(); };
  w.onmessage = function (e) {
    var m = e.data, d, id;
    if (gone) return;
    if (m.type === 'error') return fail();
    if (m.type !== 'frame') return;
    d = dims(env);
    if (m.W === d.W && m.H === d.H && m.s === d.s) {             // a frame drawn for an old window size is not shown
      id = new ImageData(new Uint8ClampedArray(m.buffer), m.W, m.H);
      if (m.s === 1) ctx.putImageData(id, 0, 0);
      else {
        if (!off || off.width !== m.W || off.height !== m.H) { off = document.createElement('canvas'); off.width = m.W; off.height = m.H; octx = off.getContext('2d'); }
        octx.putImageData(id, 0, 0);
        ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, m.W, m.H, 0, 0, m.W * m.s, m.H * m.s);
      }
      frames++;
      if (m.info) info = m.info;
      if (!live) { live = true; core.destroy(); }
    }
    w.postMessage({ type: 'buffer', buffer: m.buffer }, [m.buffer]);
  };
  w.postMessage({ type: 'init', progress: progress, env: env });
  addEventListener('resize', onResize); document.addEventListener('visibilitychange', onVis);
  return {
    set: function (o) {
      if (done) return;
      progress = cl01(o && o.progress !== undefined ? o.progress : progress);
      if (!live || gone) core.set({ progress: progress });
      if (!gone) w.postMessage({ type: 'set', progress: progress });
    },
    resize: function () { if (done) return; if (!live || gone) core.resize(); if (!gone) { env = readEnv(canvas); w.postMessage({ type: 'env', env: env }); } },
    setAmbient: function (on) { ambient = !!on; if (done) return; if (!live || gone) core.setAmbient(ambient); if (!gone) w.postMessage({ type: 'ambient', on: ambient }); },
    destroy: function () { if (done) return; done = true; if (!gone) { w.postMessage({ type: 'destroy' }); fail(); } core.destroy(); },
    stops: [0, 1 / 3, 2 / 3, 1],
    get progress() { return progress; },
    get frames() { return live && !gone ? frames : core.frames; },
    get ambient() { return live && !gone ? ambient && env.visible && !env.reduce : core.ambient; },
    get info() { return live && !gone ? info : core.info; },
    get mode() { return gone ? 'page' : live ? 'worker' : 'starting'; }
  };
}

if (typeof window !== 'undefined') window.ParkScene = { mount: function (canvas, opts) { try { return mountPage(canvas, opts); } catch (e) { return stub(); } } };
else if (typeof importScripts === 'function') workerMain();
})();

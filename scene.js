// pixel-art Toronto morning panned by scroll; 1 art px per device px; frames after 0 come from a worker running this file
// u(n)=round(n*W/480), HZ=round(H*.62), camX=round(progress*(WORLD-W)), mpx(m,y)=m*(y-HZ)/2.5 px, blog palette only
(function () {
'use strict';
// the worker loads this same file; captured now, while the script tag is still current
var SRC = typeof document !== 'undefined' ? ((document.currentScript || (document.querySelector && document.querySelector('script[src*="scene"]')) || {
    }).src || '') : '';
var LE = (function () { var b = new ArrayBuffer(4); new Uint32Array(b)[0] = 0x01020304; return new Uint8Array(b)[0] === 4; })();
var cc = Object.create(null);
function CR(h) {
  var v = cc[h];
  if (v === undefined) {
    var n = parseInt(h.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    v = cc[h] = (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
  }
  return v;
}
var GK = [[0, 0.58, 0.62, 0.80], [0.12, 0.86, 0.76, 0.72], [0.33, 1.00, 0.93, 0.84], [0.60, 1, 1, 1]];
var gcache = [], gc = null, gm = null;
function gradeAt(q) {
  for (var i = 1; i < GK.length; i++) if (q <= GK[i][0]) {
      var a = GK[i - 1], b = GK[i], f = (q - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]; }
  return [1, 1, 1];
}
function setGrade(t) { var st = Math.round(t * 12); gc = gcache[st] || (gcache[st] = Object.create(null)); gm = gradeAt(st / 12); }
function C(h) {
  if (!gc) return CR(h);
  var v = gc[h];
  if (v === undefined) {
    var n = parseInt(h.slice(1), 16), r = Math.min(255, Math.round((n >> 16 & 255) * gm[0])), g = Math.min(255, Math.round((n >> 8 & 255) * gm[1])),
        b = Math.min(255, Math.round((n & 255) * gm[2]));
    v = gc[h] = (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
  }
  return v;
}
var cl01 = function (v) { v = +v; return v > 0 ? (v < 1 ? v : 1) : 0; };
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var DAWN = ['#141c45', '#22306a', '#2d4079', '#4d4d86', '#6d5b93', '#a8739e', '#e08fa8', '#f4ac6b', '#ffd98a'];
var MORN = ['#1566bd', '#1b78c9', '#2585d4', '#2f93e0', '#48a9e7', '#5cbcec', '#80cdef', '#a3ddf2', '#d6ecf7'];
var SKY_SUNUP = ['#1a5aa8', '#1d6bbf', '#2a82d2', '#4a9fdf', '#74b9e6', '#a3cfe8', '#cfdde2', '#ecdcb8', '#f6e2a8'];
var BND = [0, 0.16, 0.30, 0.42, 0.53, 0.63, 0.73, 0.83, 0.92, 1];
function skyTint(v, tr, tg, tb, f) {
  var r, g, b;
  if (LE) { r = v & 255; g = v >> 8 & 255; b = v >> 16 & 255; } else { r = v >>> 24; g = v >> 16 & 255; b = v >> 8 & 255; }
  r = Math.round(r + (tr - r) * f); g = Math.round(g + (tg - g) * f); b = Math.round(b + (tb - b) * f);
  return (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
}
function skyBands(q) {
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
}
var SKY_MASK = [new Uint8Array(1 << 16), new Float32Array(1024)];
var SKY_BANDS = [];
var CL = [[0.38, 0.24, 6], [0.80, 0.20, 9], [0.70, 0.27, 5], [1.05, 0.14, 8], [1.55, 0.16, 8], [2.10, 0.16, 10], [2.55, 0.17, 6]];
var SKY_GEESE_V = [[0, 0], [1, -0.55], [2, -1.05], [3, -1.55], [1, 0.55], [2, 1.05], [3, 1.55], [4, 2.00]];
var SKY_CIRRUS = [[0.10, 0.026, 150, 5], [0.42, 0.042, 170, 17], [0.80, 0.032, 140, 29]];
var SKC = [['#4e5d79', '#43506a'], ['#3d4a63', '#323d52'], ['#2c3840', '#26292d'], ['#51565c', '#464b51'], ['#9aa3a6', '#6d777b']];
var SFC = ['#b34a3a', '#d9b48c', '#8f2f28', '#e9e1cd', '#4a555e', '#1f3f2c', '#b98761'];
var PT_POPL = ['#1c3722', '#224025', '#2d5330', '#3b6d3b', '#538d53'];
var PT_CONI = ['#153431', '#193c36', '#224e44', '#2d6754', '#3f8578'];
var PT_PAL2 = [null, null, 0];
var STREET_POLES = [0.22, 0.62, 1.02];
var STREET_TC = [[0.05, 30], [0.12, 42]];
var STREET_TO = [6.2, 4.7, 3.3, 1.8];
var STREET_TR = [0.08, 0.105, 0.62, 0.76];
var STREET_PW = 2.5, STREET_RW = 8;
var STREET_FONT = { A:'010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
    O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
    V: '101101101101010', W: '101101111111101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '5': '111100110001110' }
    ;
var STREET_SIGNS = ['CAFE', 'BOOKS', 'VINTAGE', 'RECORDS', 'BAKERY', 'PHO', 'DELI', 'FLOWERS', 'BAR', 'OPTICAL', 'PIZZA', 'GALLERY', 'TAILOR', 'HARDWARE',
    'SUSHI', 'DINER', 'SHOES', 'CYCLES', 'MARKET', 'NOODLES', 'BARBER', 'WINE'];
var STREET_FSEQ = [0, 1, 0, 2, 3, 6, 0, 4, 1, 2, 0, 5, 6, 1, 0, 3, 2, 0, 6, 4, 1, 0, 2, 6, 5, 0, 1, 3, 0, 2, 6, 1];
var STREET_TONE = ['#8f2f28', '#b98761', '#7e3226', 0, 0, 0, '#a27850'];
var LUMP = [[-0.008, -0.152, 0.076], [-0.104, -0.094, 0.068], [0.090, -0.106, 0.074], [-0.164, 0.035, 0.059], [0.160, 0.016, 0.064], [-0.084, 0.122, 0.078],
    [0.080, 0.118, 0.082], [0.000, 0.028, 0.115]];
var BR = [[-0.075, -0.30, 0.50, 0.12, [[0.40, -0.07, -0.08, 0.20], [0.70, 0.03, -0.11, 0.14]]], [0.012, -0.42, 0.55, 0.12, [[0.35, -0.05, -0.12, 0.18], [0.55,
    0.06, -0.10, 0.18]]], [0.085, -0.28, 0.46, 0.12, [[0.45, 0.075, -0.06, 0.20], [0.75, -0.02, -0.10, 0.14]]]];
var PT_PALA = [null, null, 0];
var PT_AUTUMN = [['#4a2318', '#9c3b26', '#c2642f', '#e08a3c', '#f4b45c'], ['#4a3318', '#8f6b1f', '#c2962f', '#e0bb3c', '#f4d65c']];
var PT_BIRCH_I = 9;
var PG_FOUNTAIN = { x: 2.60, y: 0.56 };
var LIFE_CAR = { sedan: { L: 4.7, top: [0, 0.60, 0.07, 0.84, 0.35, 0.94, 1.12, 0.97, 1.62, 1.37, 1.95, 1.44, 2.90, 1.44, 3.50, 1.02, 4.20, 0.90, 4.62, 0.80,
    4.70, 0.58], bot: 0.20, belt: 0.97, gl: [1.40, 3.40], pil: [2.33, 2.43], wh: [0.95, 3.75], r: 0.32, tail: [0, 0.10, 0.70, 0.84], head: [4.52, 4.70, 0.64, 0.75],
    seam: [1.42, 2.38, 3.44] }, van: { L: 5.9, top: [0, 0.45, 0.03, 2.38, 0.14, 2.48, 4.35, 2.48, 4.58, 2.36, 5.08, 1.34, 5.55, 1.10, 5.86, 0.95, 5.90, 0.55],
    bot: 0.36, belt: 1.30, gl: [4.48, 5.02], pil: [9, 9], wh: [1.05, 4.72], r: 0.35, tail: [0, 0.06, 0.60, 1.15], head: [5.70, 5.90, 0.84, 0.98], seam: [0.04, 3.30,
    4.40] } };
var TRAM_V0 = 6, TRAM_RUN = 82;
var TRAM_TA = 2 * TRAM_RUN / TRAM_V0, TRAM_TD2 = TRAM_TA, TRAM_TD = 25, TRAM_GAP = 15;
var TRAM_CYC = TRAM_TA + TRAM_TD + TRAM_TD2 + TRAM_GAP, TRAM_PH0 = TRAM_TA + 10;
var TRAM_DOOR = 1.2;
var TRAM_SEDAN_WAIT = 2, TRAM_SEDAN_RUN = 25, TRAM_SEDAN_V0 = 7, TRAM_SEDAN_RT = 2 * TRAM_SEDAN_RUN / TRAM_SEDAN_V0;
var TRAM_CYCL_WAIT = 9, TRAM_CYCL_RUN = 10, TRAM_CYCL_V0 = 4, TRAM_CYCL_RT = 2 * TRAM_CYCL_RUN / TRAM_CYCL_V0;
var TRAM_XCAR_WAIT = TRAM_CYCL_WAIT + TRAM_CYCL_RT + 2, TRAM_XCAR_RUN = 20, TRAM_XCAR_V0 = 6;
var TRAM_XCAR_RT = 2 * TRAM_XCAR_RUN / TRAM_XCAR_V0, TRAM_XCAR_BACK = 10;
var CARS_KIND = [['sedan', ['#1d252b', '#2c3840', '#4a555e']], ['sedan', ['#33251a', '#4b3827', '#6f573c']], ['sedan', ['#6f573c', '#e0a94e', '#f4c869']],
    ['van', ['#26292d', '#3d4a63', '#6d777b']], ['sedan', ['#151719', '#26292d', '#4a555e']]];
var LIFE_FOLK = [{ skin: 1, hair: '#26292d', hl: '#4a555e', top: ['#2c3840', '#3d4a63', '#4e5d79'], bot: ['#26292d', '#33373b', '#4a555e'], shoe: '#26292d',
    hem: 0.42, bag: '#4a555e' }, { skin: 2, hair: '#33251a', hl: '#57422a', top: ['#403f2b', '#565438', '#6e6a47'], bot: ['#3d4a63', '#4e5d79', '#6d777b'],
    shoe: '#33251a', hem: 0.44 }, { skin: 0, hair: '#26292d', hl: '#4a555e', top: ['#6f573c', '#8a6a3f', '#a8854f'], bot: ['#26292d', '#2c3840', '#3d4a63'],
    shoe: '#26292d', hem: 0.47, cap: '#2c3840' }, {
    skin: 1, hair: '#4b3827', hl: '#6f573c', top: ['#565438', '#6e6a47', '#877d72'], bot: ['#3d4a63', '#4e5d79', '#6d777b'], shoe: '#51565c', hem: 0.47 }, {
    skin: 0, hair: '#877d72', hl: '#9aa3a6', top: ['#26292d', '#4a555e', '#6d777b'], bot: ['#6f573c', '#8a6a3f', '#a8854f'], shoe: '#26292d', hem: 0.44 }, {
    skin: 2, hair: '#26292d', hl: '#4a555e', top: ['#2c3840', '#3d4a63', '#4e5d79'], bot: ['#26292d', '#2c3840', '#3d4a63'], shoe: '#9aa3a6', hem: 0.52,
    band: '#7e3226' }, { skin: 1, hair: '#33251a', hl: '#57422a', top: ['#2c3840', '#3d4a63', '#4e5d79'], bot: ['#6f573c', '#8a6a3f', '#a8854f'], shoe: '#33251a',
    hem: 0.46 }, { skin: 0, hair: '#26292d', hl: '#4a555e', top: ['#6f573c', '#a8854f', '#b98761'], bot: ['#26292d', '#33373b', '#4a555e'], shoe: '#26292d',
    hem: 0.45, long: 1 }];
var LIFE_SKIN = [['#6f573c', '#8a6a3f', '#a8854f'], ['#8a6a3f', '#b98761', '#d9b48c'], ['#4b3827', '#6f573c', '#8a6a3f']];
var TREE_SHADE = 0.30;
var TREE_M = { bg: null, pp: null, mk: 0, lo: null, hi: null, sx: null, sy: null, sr: null, lt: null, ld: null };
var TREE_G = { cx: [], cy: [], r: [] };
var PT_PAL = [null, null, 0];
var PT_PK = new Uint8Array(4096);
var PT_BUMP = new Float32Array(4096);
var PT_COL = [null];
var PT_LB = new Float64Array(64);
var PT_HB = new Float64Array(16384);
var PT_CR = [0, 0, 1, 1];
var PT_S = [0, 0, 0, 0];
var PT_BSH = ((function () { var t = [], w, j, q; for (w = 1; w <= 9; w++) { t[w] = new Float32Array(w); for (j = 0; j < w; j++) {
    q = (j + 0.5) / w * 2 - 1; t[w][j] = Math.sqrt(1 - q * q); } } return t; })());
var PT_CROWNS = ([[1.00, 1.00, [[0.00, -0.60, 0.44, 0], [-0.48, -0.34, 0.46, 1], [0.46, -0.38, 0.47, 0], [-0.06, -0.14, 0.52, 0], [0.62, 0.08, 0.42, 1], [-0.56,
    0.14, 0.44, 0], [0.12, 0.24, 0.48, 0]], [[0, 1], [0, 2], [1, 5], [2, 4]]], [1.20, 0.85, [[-0.30, -0.54, 0.42, 1], [0.32, -0.58, 0.40, 0], [-0.76, -0.20, 0.40,
    0], [0.06, -0.26, 0.48, 0], [0.74, -0.16, 0.42, 1], [-0.44, 0.14, 0.46, 0], [0.44, 0.12, 0.46, 0], [0.94, 0.26, 0.30, 1]], [[0, 1], [0, 2], [1, 4], [4, 7]]],
    [0.88, 1.12, [[0.14, -0.74, 0.38, 1], [-0.22, -0.52, 0.42, 0], [0.42, -0.36, 0.42, 0], [-0.44, -0.14, 0.42, 1], [0.08, -0.12, 0.50, 0], [0.50, 0.12, 0.38, 1],
    [-0.36, 0.14, 0.40, 0]], [[0, 1], [0, 2], [1, 3], [2, 5]]]]);
var PT_BACK = ['#213a32', '#263f37', '#2f4b41', '#3b5c4b', '#3b5c4b'];
var PT_FRONT = (['#1a3628', '#1f3f2c', '#2a5138', '#376b45', '#4d8a62']);
var PG_LEAF = (function () { var a = new Uint8Array(1024), i, k; for (i = 0; i < 1024; i++) {
    k = (hash(i * 131 + 7) * 8) | 0; a[i] = k < 3 ? 0 : k === 3 ? 1 : 2; } return a; })();
var PG_LB = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5];
var PG_SCR = { u8: new Uint8Array(1 << 16), bg: new Uint32Array(5), bd: new Uint32Array(5), bt: new Uint32Array(5), fc: new Uint32Array(3),
    so: new Int16Array(64), el: new Int32Array(2048), er: new Int32Array(2048), pc: new Int32Array(2048), sp: new Int32Array(32), hl: new Float64Array(96),
    pp: new Float64Array(16), ck: new Uint32Array(32), cd: new Uint32Array(32), rmn: new Int32Array(2048), rmx: new Int32Array(2048), wf: 0, wf2: 0, kw: 0, kh: 0,
    ofn: 0, ofw: new Int8Array(0), brn: 0, brow: new Int32Array(0), bk: new Uint32Array(0), elw: new Int32Array(0), erw: new Int32Array(0), pcw: new Int32Array(0),
    spg: 0, spj: 0, spur: new Int16Array(0), drift: null };
var PG_GATE = [[21.5, 22.0], [26.0, 26.5]];
function mount(canvas, opts) {
  opts = opts || {};
  var present = opts.present, ctx = present ? null : canvas.getContext && canvas.getContext('2d');
  if (!present && !ctx) return stub();
  var env = opts.env || readEnv(canvas), visible = env.visible, owed = false;
  var scale = 1, W = 8, H = 8, HZ = 5, WORLD = 32, camX = 0, t = 0;
  var progress = cl01(opts.progress), off, octx, img, buf, skyRow, crowMask;
  var timer = null, fast = false, ambient = false, frames = 0, clock = 0, rt = 0, dead = false, key = -1;
  function px(x, y, c) { x = x | 0; y = y | 0; if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; }
  function hline(x0, x1, y, c) { y = y | 0; if (y < 0 || y >= H) return; x0 = x0 | 0; x1 = x1 | 0; if (x0 < 0) x0 = 0; if (x1 > W - 1) x1 = W - 1; if (x1 < x0) return; buf.fill(c,
      y * W + x0, y * W + x1 + 1); }
  function vline(x, y0, y1, c) { x = x | 0; if (x < 0 || x >= W) return; y0 = y0 | 0; y1 = y1 | 0; if (y0 < 0) y0 = 0; if (y1 > H - 1) y1 = H - 1; for (var y = y0; y <= y1; y++) buf[y * W + x] = c; }
  function rect(x, y, w, h, c) { for (var i = 0; i < h; i++) hline(x, x + w - 1, y + i, c); }
  function frame(x, y, w, h, c) { hline(x, x + w - 1, y, c); hline(x, x + w - 1, y + h - 1, c); vline(x, y, y + h - 1, c); vline(x + w - 1, y, y + h - 1, c); }
  function disc(cx, cy, r, c) { for (var y = -r; y <= r; y++) { var d = Math.round(Math.sqrt(r * r - y * y)); hline(cx - d, cx + d, cy + y, c); } }
  function wob(s, y, r) { var st = Math.max(2, r * 0.16), f = (y + r) / st, k = f | 0, a = hash(s * 131 + k * 7 + 11),
      b = hash(s * 131 + k * 7 + 18); f -= k; f = f * f * (3 - 2 * f); return 0.86 + (a + (b - a) * f) * 0.22; }
  function blob(cx, cy, r, c, s) { for (var y = -r; y <= r; y++) {
      var d = Math.sqrt(r * r - y * y) * wob(s, y, r); hline(cx - Math.round(d), cx + Math.round(d), cy + y, c); } }
  function dline(y, a, b, k) { y = y | 0; if (y < 0 || y >= H) return; var o = y * W,
      by = (y & 3) * 4; for (var x = 0; x < W; x++) buf[o + x] = BAY[by + (x & 3)] < k ? b : a; }
  function dline2(x0, x1, y, a, b, k) { if (y < 0 || y >= H) return; if (x0 < 0) x0 = 0; if (x1 > W - 1) x1 = W - 1; var o = y * W,
      by = (y & 3) * 4; for (var x = x0; x <= x1; x++) buf[o + x] = BAY[by + (x & 3)] < k ? b : a; }
  function dot(x, y, k, c) { if (BAY[((y | 0) & 3) * 4 + ((x | 0) & 3)] < k) px(x, y, c); }
  function limb(x0, y0, x1, y1, w0, w1, c, hi) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)), k, f, x, y, w;
    if (n < 1) n = 1;
    for (k = 0; k <= n; k++) { f = k / n; x = Math.round(x0 + dx * f); y = Math.round(y0 + dy * f); w = Math.max(1, Math.round(w0 + (w1 - w0) * f)); vline(x,
        y - (w >> 1), y - (w >> 1) + w - 1, c); if (w > 2 && hi) px(x, y - (w >> 1), hi); }
  }
  function shade(x, y, a) {
    x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x, v = buf[i], vr, vg, vb;
    if (LE) { vr = v & 255; vg = v >> 8 & 255; vb = v >> 16 & 255; } else { vr = v >> 24 & 255; vg = v >> 16 & 255; vb = v >> 8 & 255; }
    var nr = vr * (1 - a * 0.78) | 0, ng = vg * (1 - a * 0.70) | 0, nb = vb * (1 - a * 0.52) | 0;
    buf[i] = (LE ? (255 << 24 | nb << 16 | ng << 8 | nr) : (nr << 24 | ng << 16 | nb << 8 | 255)) >>> 0;
  }
  function shadow(bx, by, ow, oh, a0, clip) {
    var x, y, k, ty, t1, t2, f, s, xl, xr, o, af;
    if (bx > W + u(400) || bx + ow < -u(400)) return;
    a0 = a0 || 0.30;
    for (x = bx; x < bx + ow; x++) { shade(x, by, a0); shade(x, by + 1, a0 * 0.66); }
    k = sunK(oh); if (!k) return;
    if (ow < u(2)) { bx -= (u(2) - ow) >> 1; ow = u(2); }
    ty = projY(by, k); t1 = projX(bx, k); t2 = projX(bx + ow, k); s = Math.max(1, ty - by);
    af = cl01(ow * s / (u(2) * Math.max(1, Math.abs(t1 - bx), Math.abs(t2 - bx - ow))) - 1);
    if (af < 0.02) return;
    a0 *= af;
    for (y = by + 2; y <= Math.min(H - 1, Math.round(ty)); y++) {
      f = (y - by) / s; xl = Math.round(bx + (t1 - bx) * f); xr = Math.round(bx + ow + (t2 - bx - ow) * f);
      if (clip) { o = Math.round(seam(y) - camX) + 1; if (xl < o) xl = o; }
      if (xl < 0) xl = 0;
      if (xr > W - 1) xr = W - 1;
      for (x = xl; x <= xr; x++) { if (f > 0.55 && BAY[(y & 3) * 4 + (x & 3)] > 9) continue; shade(x, y, a0 * (1 - 0.45 * f)); }
    }
  }
  var ST, GH, KERB, RH, BASE, TREEX, U, sunX, sunY, sunE, sunA;
  function geom() {
    U = W / 480;
    ST = 1.55 * W;
    GH = H - HZ;
    KERB = HZ + Math.round(GH * 0.20);
    RH = H - KERB;
    BASE = HZ + Math.round(GH * 0.08);
    TREEX = 3.70 * W;
    sunA = (-4 + 46 * t) * Math.PI / 180;
    sunE = Math.round(W * Math.tan(sunA)); sunY = HZ - sunE; sunX = Math.round((0.36 + 0.54 * t) * W);
  }
  function u(n) { var v = Math.round(n * U); return v < 1 ? 1 : v; }
  function seam(y) { return ST - (y - HZ) * 0.9; }
  function sxOf(wx, p) { return Math.round(wx - camX * p); }
  function skyAt(y) { return skyRow[y < 0 ? 0 : (y >= H ? H - 1 : y | 0)]; }
  function mpx(m, y) { return m * (y - HZ) / 2.5; }
  function sunK(h) { if (sunE <= u(9)) return 0; var q = h / sunE; return 1 / (1 - (q < 0.8 ? q : 0.8)); }
  function projX(x, k) { return sunX + (x - sunX) * k; }
  function projY(y, k) { return HZ + (y - HZ) * k; }
  function sky() {
    var c = skyBands(Math.round(t * 12)), td = skyTd(), yb = [], i, j, y, k, o, n, m, x, a, b, by;
    for (i = 0; i <= 9; i++) yb[i] = Math.round(BND[i] * HZ);
    for (i = 0; i < 9; i++) {
      for (y = yb[i]; y < yb[i + 1]; y++) skyRow[y] = c[i];
      for (y = i ? yb[i] - (td >> 1) + td : 0; y < (i < 8 ? yb[i + 1] - (td >> 1) : yb[9]); y++) hline(0, W - 1, y, c[i]);
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
  }
  function skyDot(x, y, i, j, k, c) { if (BAY[(j & 3) * 4 + (i & 3)] < k) px(x, y, c); }
  function skyPix(x, y) {
    var c = skyBands(Math.round(t * 12)), td = skyTd(), i, j;
    for (i = 1; i < 9; i++) {
      j = y - Math.round(BND[i] * HZ) + (td >> 1);
      if (j >= 0 && j < td) return BAY[(y & 3) * 4 + (x & 3)] < 1 + ((j * 15 / td) | 0) ? c[i] : c[i - 1];
    }
    return skyAt(y);
  }
  function skyTd() { return Math.max(2, Math.min(u(9), Math.round(0.08 * HZ))); }
  function stars() {
    var q = Math.round(t * 12) / 12;
    if (q >= 0.17) return;
    var n = Math.round(7.5 * U * (1 - q / 0.17)), fl = (clock * 10) | 0, i, x, y, b;
    var a = CR('#cfd6d8'), dim = CR('#9aa3a6'), bright = CR('#f6f4ea');
    for (i = 0; i < n; i++) {
      x = Math.round(hash(i * 13 + 1) * W); y = Math.round(hash(i * 13 + 2) * HZ * 0.30);
      if (x > 0.06 * W && x < 0.26 * W && y > 0.105 * H) continue;
      b = hash(i * 13 + 3);
      if (hash(i * 13 + 5 + fl * 7) > 0.96) b -= 0.3;
      px(x, y, b > 0.86 ? bright : (b > 0.45 ? a : dim));
      if (b > 0.95) { px(x - 1, y, dim); px(x + 1, y, dim); px(x, y - 1, dim); px(x, y + 1, dim); }
    }
  }
  function moon() {
    var mf = cl01(1 - sunE / u(90));
    if (mf <= 0) return;
    var r = u(5), cx = Math.round(0.60 * W), cy = Math.round(0.19 * HZ), x, y, d, di, a, p, R = r + 0.5, Ri = r - 0.5;
    var vx = sunX - cx, vy = sunY - cy, l = Math.sqrt(vx * vx + vy * vy) || 1, es = 0.09 * cl01(-sunE / u(20)), rim = CR('#e4e0d0'), core = CR('#f6f4ea'), c;
    vx /= l; vy /= l;
    function lit(x, y) { if (y < -r || y > r || Math.abs(x) > Math.floor(Math.sqrt(R * R - y * y))) return false; var a = x * vx + y * vy,
        p = -x * vy + y * vx; return a >= 0.65 * Math.sqrt(Math.max(0, R * R - p * p)); }
    for (y = -r; y <= r; y++) {
      d = Math.floor(Math.sqrt(R * R - y * y));
      hline(cx - d, cx + d, cy + y, rim);
      if (y > -r && y < r) { di = Math.floor(Math.sqrt(Ri * Ri - y * y)); hline(cx - di, cx + di, cy + y, core); }
      for (x = -d; x <= d; x++) { if (!lit(x, y) || !(lit(x - 1, y) || lit(x + 1, y) || lit(x, y - 1) || lit(x, y + 1))) {
          c = skyPix(cx + x, cy + y); px(cx + x, cy + y, es > 0 ? skyTint(c, 246, 244, 234, es) : c); } else if (mf < 1) {
          c = skyPix(cx + x, cy + y); px(cx + x, cy + y, skyTint(c, 244, 240, 234, mf)); } }
    }
  }
  function sun() {
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
  function cumulus(cx, by, s, seed) {
    var n = 3 + ((hash(seed * 7 + 1) * 3) | 0), i, m = 0, lx = [], ly = [], lr = [], ux = [], uy = [], ur = [], r, w;
    for (i = 0; i < n - 1; i++) { ur[i] = s * (0.50 + hash(seed * 19 + i * 5) * 0.35); ux[i] = (i + 0.5 - (n - 1) / 2) * 0.80 * s + (hash(seed * 23 + i) - 0.5) * 0.30 * s; uy[i] = by - s * (0.55 + hash(seed * 29 + i) * 0.30); lx[m] = ux[i] + (hash(seed * 37 + i) - 0.5) * ur[i]; ly[m] = uy[i] - 0.65 * ur[i]; lr[m++] = ur[i] * (0.35 + hash(seed * 31 + i) * 0.20); }
    for (i = 0; i < n - 1; i++) { lx[m] = ux[i]; ly[m] = uy[i]; lr[m++] = ur[i]; }
    var bmin = 1e9, bmax = -1e9, top = by;
    for (i = 0; i < n; i++) { r = s * (0.55 + hash(seed * 13 + i * 5) * 0.45); lx[m] = (i - (n - 1) / 2) * 0.80 * s + (hash(seed * 17 + i * 3) - 0.5) * 0.35 * s; ly[m] = by - Math.round(0.15 * r); lr[m] = r; w = Math.sqrt(r * r - (by - ly[m]) * (by - ly[m])); if (lx[m] - w < bmin) bmin = lx[m] - w; if (lx[m] + w > bmax) bmax = lx[m] + w; m++; }
    var minx = 1e9, maxx = -1e9;
    for (i = 0; i < m; i++) { minx = Math.min(minx, lx[i] - lr[i]); maxx = Math.max(maxx, lx[i] + lr[i]); top = Math.min(top, ly[i] - lr[i]); }
    if (cx + maxx < 0 || cx + minx >= W) return;
    var ax = (sunX - cx) / W, ay = (sunY - by) / W, q = Math.sqrt(ax * ax + ay * ay) || 1e-3, sp = Math.min(1.5, q), sn = Math.sin(sp);
    var tq = Math.round(t * 12) / 12;
    var sx = ax / q, sy = ay / q, Lx = sx * sn, Ly = sy * sn, Lz = -Math.cos(sp), pre = tq < 0.20, morn = tq >= 0.45;
    var c0 = CR(pre ? '#4d4d86' : morn ? '#b3bec6' : '#9d93ad'), c1 = CR(pre ? '#6d5b93' : morn ? '#cfd8de' : '#d3c4c3');
    var c2 = CR(pre ? '#e08fa8' : morn ? '#eef2f4' : '#e9dccb'), c3 = CR(pre ? '#f4ac6b' : morn ? '#ffffff' : '#fff3dc');
    var amb = pre ? 0.34 : 0.50, eg = pre ? 0.25 : 0.6, CH = Math.max(1, by - top), ya, yb, yy, xx, xa, xb, dy, ir, nx, ny, nz, d, e, v, o, mo, hv, ao, und, gl;
    var mx0 = Math.max(0, cx + Math.floor(minx)), mx1 = Math.min(W - 1, cx + Math.ceil(maxx)), my0 = Math.max(0, Math.floor(top)), mw = mx1 - mx0 + 1,
        mh = by - my0, mask = SKY_MASK[0];
    if (mw <= 0 || mh <= 0) return;
    if (mask.length < mw * mh) mask = SKY_MASK[0] = new Uint8Array(mw * mh * 2);
    mask.fill(0, 0, mw * mh);
    if (Ly > 0) {
      gl = SKY_MASK[1];
      if (gl.length < mw) gl = SKY_MASK[1] = new Float32Array(mw * 2);
      for (xx = mx0; xx <= mx1; xx++) { e = 0; for (i = m - n; i < m; i++) {
          d = (xx - cx - lx[i] + 0.14 * s * sx) / (0.36 * s); e += Math.exp(-d * d); } e = e > 1 ? 1 : e; v = (xx - cx) / Math.max(1,
          (maxx - minx) / 2) * sx; gl[xx - mx0] = 0.24 * (1 - 0.62 * e) * Math.max(0.5, 1 + 0.35 * v) + 1e-3; }
    }
    for (i = m - 1; i >= 0; i--) {
      r = lr[i]; ir = 1 / r;
      ya = Math.max(my0, Math.ceil(ly[i] - r)); yb = Math.min(by - 1, H - 1, Math.floor(ly[i] + r));
      for (yy = ya; yy <= yb; yy++) {
        dy = yy - ly[i]; w = r * r - dy * dy;
        if (w <= 0) continue;
        w = Math.sqrt(w) * wob(seed * 7 + i, dy, r); xa = Math.max(mx0, cx + Math.ceil(lx[i] - w)); xb = Math.min(mx1, cx + Math.floor(lx[i] + w));
        ny = dy * ir; hv = (by - yy) / CH; o = yy * W; mo = (yy - my0) * mw - mx0;
        ao = Ly > 0 ? 1 : 0.70 + 0.30 * hv;
        for (xx = xa; xx <= xb; xx++) { if (mask[mo + xx]) continue; mask[mo + xx] = 1; nx = (xx - cx - lx[i]) * ir; nz = 1 - nx * nx - ny * ny; nz = nz > 0 ? Math.sqrt(nz) : 0; und = Ly > 0 ? Ly * 2.2 * Math.max(0,
            1 - hv / gl[xx - mx0]) : 0; d = (nx * Lx + ny * Ly + nz * Lz + 0.35) / 1.35; e = nz < 0.7 ? nx * sx + ny * sy : 0; e = e > 0 ? (1 - nz) * (1 - nz) * e * eg : 0; v = (amb + 0.55 * (d > 0 ? d : 0) + e + und) * ao + (BAY[((yy - by) & 3) * 4 + ((xx - cx) & 3)] - 7.5) * 0.007; buf[o + xx] = v < 0.42 ? c0 : v < 0.60 ? c1 : v < 0.80 ? c2 : c3; }
      }
    }
    hline(cx + Math.round(bmin), cx + Math.round(bmax), by, pre ? c2 : c0);
  }
  function clouds() {
    var i, x, y, s, dx, hi = Math.round(0.11 * H);
    for (i = 0; i < CL.length; i++) { y = Math.round(CL[i][1] * HZ); s = Math.max(3, u(CL[i][2])); dx = y < hi ? (clock * 2) % (3 * W) : Math.min(clock * 2,
        (1.09 - CL[i][0]) * W + 3 * s + 2); x = sxOf(CL[i][0] * W + dx, 0.03); if (x > W + u(60)) x = sxOf(CL[i][0] * W + dx - 3 * W,
        0.03); if (x < -3 * s || x > W + 3 * s) continue; cumulus(x, y, s, i + 1); }
    skyCirrus();
  }
  function skyWisp(seed, i, period) {
    var f = i / period, k = f | 0, a = hash(seed * 131 + k * 7 + 3), b = hash(seed * 131 + (k + 1) * 7 + 3);
    f -= k; f = f * f * (3 - 2 * f);
    return a + (b - a) * f;
  }
  function skyCirrus() {
    var wf = cl01(1 - t / 0.42), tr = 246 - 6 * wf, tg = 244 - 30 * wf, tb = 234 - 75 * wf;
    var i, s, L, y0, seed, x0, j, xx, e, dc, df, g, a, yOff, ea, pc, pf, base;
    for (i = 0; i < SKY_CIRRUS.length; i++) {
      s = SKY_CIRRUS[i]; L = u(s[2]); y0 = Math.round(s[1] * HZ); seed = s[3];
      x0 = sxOf(s[0] * W, 0.03);
      if (x0 + L < 0 || x0 > W) continue;
      ea = Math.max(2, Math.round(0.16 * L)); pc = Math.max(3, Math.round(L / 18)); pf = u(9);
      for (j = 0; j < L; j++) {
        xx = x0 + j; if (xx < 0 || xx >= W) continue;
        e = Math.min(1, j / ea, (L - 1 - j) / ea); if (e <= 0) continue;
        dc = skyWisp(seed, j, pc); df = skyWisp(seed + 53, j, pf);
        g = cl01((dc - 0.46) / 0.16); if (g <= 0) continue;
        a = e * g * g * (0.55 + 0.45 * df) * (0.62 + 0.30 * wf);
        if (a < 0.06) continue;
        yOff = Math.round((df - 0.5) * u(3));
        base = skyPix(xx, y0 + yOff);
        px(xx, y0 + yOff, skyTint(base, tr, tg, tb, a));
        px(xx, y0 + yOff - 1, skyTint(base, tr, tg, tb, a * 0.45));
        px(xx, y0 + yOff + 1, skyTint(base, tr, tg, tb, a * 0.45));
      }
    }
  }
  function plane() {
    var y = Math.round(HZ * 0.075), Lp = u(5), tl = u(160), X0 = 1.1 * W, tq = Math.round(t * 12) / 12;
    var x = sxOf(X0 - (clock * 16 + X0 - 0.30 * W) % (2.6 * W), 0.02);
    if (x + Lp + tl < 0 || x > W) return;
    var warm = tq < 0.42, tr = CR(warm ? '#f0d69f' : '#f6f4ea'), tr2 = CR(warm ? '#e08fa8' : '#dfe6ea');
    var k0 = u(4), k1 = 2 * Lp, k, a, f, xx, yy, sw;
    for (k = k0; k <= tl; k++) { xx = x + Lp + k; if (xx < 0) continue; if (xx >= W) break; if (k < k1) {
        f = 16 * Math.min(1, (k - k0 + 1) / Lp); skyDot(xx, y, k, 0, f, tr); skyDot(xx, y + 3, k, 3, f, tr); } else {
        a = 1 - k / tl; sw = 1 + 2.2 * (k - k1) / (tl - k1); for (yy = y - 2; yy <= y + 5; yy++) {
        f = sw + 0.5 - Math.abs(yy - y - 1.5); f = f > 1 ? 1 : f; if (f > 0) skyDot(xx, yy, k, yy - y, 17 * a * f / Math.sqrt(sw), yy > y + 2 ? tr2 : tr); } } }
    var wr = Math.round(x + 0.38 * Lp), ww = Math.max(3, Math.round(0.20 * Lp));
    var hi = CR('#cfd6d8'), md = CR('#b3b8b2'), dk = CR('#6d777b');
    for (k = 1; k <= ww; k++) hline(wr + k, wr + k + Math.max(1, 3 - (k >> 1)), y + 2 + k, dk);
    rect(wr - 1, y + 3, 3, 2, dk);
    hline(x + Lp - 5, x + Lp - 3, y + 3, dk);
    hline(x + 2, x + Lp - 4, y, hi); hline(x + 1, x + Lp - 1, y + 1, md); hline(x + 2, x + Lp - 5, y + 2, dk);
    px(x, y + 1, md);
    for (k = 1; k <= Math.max(3, Math.round(0.18 * Lp)); k++) hline(x + Lp - 6 + k, x + Lp - 2 + Math.min(1, k >> 1), y - k, md);
    for (k = 1; k <= ww + 1; k++) hline(wr + k, wr + k + Math.max(1, 4 - (k >> 1)), y - k, md);
    hline(wr - 1, wr + 1, y - 1, dk);
    if (tq < 0.5) { px(wr + ww + 2, y - ww - 1, CR('#cf6250')); px(wr + ww + 1, y + 2 + ww,
        CR('#9ed24f')); k = ((clock * 10) | 0) % 10; if (k === 0 || k === 2) {
        px(wr + ww + 3, y - ww - 1, CR('#ffffff')); px(wr + ww + 2, y + 2 + ww, CR('#ffffff')); } if (k === 5 || k === 6) px(x + (Lp >> 1), y + 3, CR('#cf6250')); }
  }
  function gull(x, y, s, fr, dir, c, tip) {
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
    var m = u(12), P = W + 2 * m, o = [0.52, 0.67, 0.29], i, x, y, s, ph, fr;
    var bf = cl01((t - 0.26) / 0.08), c = skyTint(C('#26292d'), 223, 230, 234, bf), tip = C('#26292d');
    for (i = 0; i < 3; i++) { x = Math.round((((o[i] * W + clock * (60 + 14 * i) - camX * 0.15) % P) + P) % P) - m; y = Math.round(HZ * (0.141 + 0.014 * i)); s = u(2.6 + 0.5 * (i & 1)); ph = (((clock * 10) | 0) + 9 * i) % 28; fr = ph < 12 ? [0,
        1, 2, 1][ph % 4] : 3; gull(x, y, s, fr, 1, c, tip); }
    skyGeese();
  }
  function skyGeese() {
    var sp = u(5), y0 = Math.round(HZ * 0.072), m = u(22), P = W + 2 * m, speed = 21;
    var x0 = Math.round((((0.68 * W - clock * speed - camX * 0.15) % P) + P) % P) - m;
    var span = Math.round(sp * 4.3);
    if (x0 + span < -m || x0 - span > W + m) return;
    var c = C('#26292d'), i, k, gx, gy, s, ph, fr;
    for (i = 0; i < SKY_GEESE_V.length; i++) {
        k = SKY_GEESE_V[i]; gx = x0 + Math.round(k[0] * sp); gy = y0 + Math.round(k[1] * sp); if (gx < -m || gx > W + m) continue; s = u(i === 0 ? 2.7 : 2.3); ph = (((clock * 9) | 0) + 7 * i) % 30; fr = ph < 14 ? [0,
        1, 2, 1][ph % 4] : 3; gull(gx, gy, s, fr, -1, c, c); }
  }
  function cityLayer(hz, f) {
    var up = sunE > u(9), sunC = cityRGB(C(t < 0.45 ? '#f4ac6b' : '#cfd6d8')), ink = [21, 26, 38], m, i, L, q = Math.round(t * 12) / 12;
    function s(h) { return cityMix(C(h), hz, f); }
    var day = q < 0.1 ? 0 : Math.min(0.25, (q - 0.1) * 1.1), glass = cityRGB(s('#4e5d79'));
    function e(h) { return cityMix(cityMix(CR(h), glass, day), hz, f * 0.5); }
    var tg = Math.max(0, Math.min(1, (q - 1 / 6) * 6));
    function tc(dawn, dayH) { return cityMix(s(dayH), cityRGB(s(dawn)), 1 - tg); }
    L = { mat: [], slab: s('#6d777b'), roof: s(up ? '#9aa3a6' : '#6d777b'), pent: s('#2c3840'), mast: s('#6d777b'), rim: s('#e0a94e'), lit: e('#e9e1cd'),
        lit2: e('#e0a94e'), red: e('#cf6250'), lampA: e('#ffd98a'), lampB: e('#e0a94e'), tmd: tc('#6d777b', '#9aa3a6'), tsh: tc('#5f676b', '#848c90'),
        tdk: tc('#51565c', '#6d777b'), tlt: tc('#9aa3a6', '#cfd6d8'), glass: s('#3d4a63'), gsh: s('#323d52'), fl: 5 };
    for (i = 0; i < SKC.length; i++) { m = [s(SKC[i][0]), s(SKC[i][1])]; m[2] = up ? cityMix(m[0], sunC, 0.26) : cityMix(m[0], hz, 0.12); m[3] = cityMix(m[0],
        ink, 0.22); m[4] = up ? cityMix(m[1], sunC, 0.22) : cityMix(m[1], hz, 0.10); m[5] = cityMix(m[1], ink, 0.22); m[6] = up ? cityMix(m[0], sunC,
        0.50) : cityMix(m[0], hz, 0.22); m[7] = cityMix(m[0], ink, 0.38); L.mat.push(m); }
    return L;
  }
  function cityBump(c, m, w) { var d = (c - m) / w; return d > -1 && d < 1 ? 1 - d * d : 0; }
  function cityMix(v, to, f) {
    var c = cityRGB(v), r = Math.round(c[0] + (to[0] - c[0]) * f), g = Math.round(c[1] + (to[1] - c[1]) * f), b = Math.round(c[2] + (to[2] - c[2]) * f);
    return (LE ? (255 << 24 | b << 16 | g << 8 | r) : (r << 24 | g << 16 | b << 8 | 255)) >>> 0;
  }
  function cityRGB(v) { return LE ? [v & 255, v >> 8 & 255, v >> 16 & 255] : [v >>> 24, v >> 16 & 255, v >> 8 & 255]; }
  function cityHaze() {
    var y0 = Math.round(HZ * 0.18), r = 0, g = 0, b = 0, y, v, n = HZ - y0;
    for (y = y0; y < HZ; y++) { v = skyRow[y]; if (LE) { r += v & 255; g += v >> 8 & 255; b += v >> 16 & 255; } else {
        r += v >>> 24; g += v >> 16 & 255; b += v >> 8 & 255; } }
    return [r / n, g / n, b / n];
  }
  function farRow(L) {
    var ox = Math.round(camX * 0.035), x = -0.20 * W, i = 0, bw, bh, sx, cx, top, y, k, c;
    var pl = t < 0.26 ? 0.20 : t < 0.42 ? 0.07 : 0, fl = Math.max(2, u(0.55));
    while (x < 1.45 * W) { bw = u(5) + Math.round(hash(i * 7 + 21) * u(14)); cx = (x + bw / 2) / W; bh = Math.round((0.05 + 0.11 * Math.pow(hash(i * 7 + 22),
        1.3) + 0.17 * cityBump(cx, 0.36, 0.14) * (0.5 + 0.5 * hash(i * 7 + 25))) * HZ); sx = Math.round(x - ox); top = HZ - bh; if (sx < W + 4 && sx + bw > -4) {
        c = L.mat[i & 1 ? 0 : 3][0]; rect(sx, top, bw, bh + 1, c); if (hash(i * 7 + 26) < 0.3 && bw > u(8)) rect(sx + Math.round(bw * 0.3), top - Math.max(2, u(1)),
        Math.round(bw * 0.4), Math.max(2, u(1)), c); if (hash(i * 7 + 23) > 0.82) vline(sx + (bw >> 1), top - u(5), top, c); if (pl > 0) for (y = HZ - fl,
        k = 0; y > top + fl; y -= fl, k++) if (hash(i * 37 + k * 11) < pl) hline(sx + 1, sx + bw - 2, y, L.lit2); }
        x += bw + (hash(i * 7 + 24) < 0.5 ? 0 : u(2)); i++; }
  }
  function skyline() {
    var hz = cityHaze(), q = Math.round(t * 12) / 12;
    var LF = cityLayer(hz, 0.42 + 0.22 * q), LB = cityLayer(hz, 0.20 + 0.20 * q), LN = cityLayer(hz, 0.08 + 0.14 * q);
    LB.fl = Math.max(3, u(0.9)); LN.fl = Math.max(4, u(1.25));
    farRow(LF);
    var ox = Math.round(camX * 0.05), tx = Math.round(0.48 * W) - ox;
    var pass, x, i, bw, bh, sx, cx, fd, sc, cp, env, front;
    for (pass = 0; pass < 2; pass++) {
      if (pass === 1) { tower(LB); building(tx - u(19), u(23), Math.round(HZ * 0.23), 907, LN); building(tx + u(2), u(15), Math.round(HZ * 0.15), 912, LN); }
      x = -0.20 * W; i = 0;
      while (x < 1.50 * W) {
        cx = x / W;
        fd = cityBump(cx, 0.41, 0.10); sc = cityBump(cx, 0.50, 0.05); cp = cityBump(cx, 0.62, 0.07);
        bw = fd > 0 ? u(8) + Math.round(hash(i * 3 + 1) * u(7)) : hash(i * 3 + 5) < 0.2 ? u(10) + Math.round(hash(i * 3 + 1) * u(9)) : u(5.5) + Math.round(hash(i * 3 + 1) * u(5));
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
    if (typ === 1 && bw > u(9)) { a = Math.round(bw * 0.18); b = Math.round(bw * 0.36); t1 = top - Math.round(bh * 0.08); t2 = t1 - Math.round(bh * 0.06); mt = t2; }
    function topAt(kk) { return !a ? top : kk >= b && kk < bw - b ? t2 : kk >= a && kk < bw - a ? t1 : top; }
    var mid = sx + bw / 2, right = mid < W / 2, dep = bw * (0.55 + 0.6 * hash(i * 11 + 3));
    var sw = Math.round(dep * Math.abs(mid - W / 2) / W), drop = bh * dep / W;
    var e = (sunX - mid) / u(30); e = e < -1 ? -1 : e > 1 ? 1 : e;
    var fr = right ? (1 + e) / 2 : (1 - e) / 2;
    var sb = fr === 1 ? M[2] : fr === 0 ? M[3] : cityMix(M[3], cityRGB(M[2]), fr), sg = fr === 1 ? M[4] : fr === 0 ? M[5] : cityMix(M[5], cityRGB(M[4]), fr);
    function sideN(yy) { return drop < 0.5 ? (yy >= top ? sw : 0) : Math.max(0, Math.min(sw, Math.floor((yy - top) * (sw + 1) / drop))); }
    function sideRun(yy, nn, col) { if (nn > 0) { if (right) hline(sx + bw, sx + bw + nn - 1, yy, col); else hline(sx - nn, sx - 1, yy, col); } }
    rect(sx, top, bw, HZ - top + 1, M[0]);
    if (a) { rect(sx + a, t1, bw - 2 * a, top - t1, M[0]); rect(sx + b, t2, bw - 2 * b, t1 - t2, M[0]); }
    if (sw > 0) for (y = top; y <= HZ; y++) sideRun(y, sideN(y), sb);
    var fl = glassy ? L.fl : Math.max(3, Math.round(L.fl * 0.8)), bay = Math.max(4, Math.round(L.fl * 1.2));
    var gcol = glassy ? M[1] : L.slab, crown = glassy ? mt + fl * 2 : mt + 2;
    if (!stone) for (y = HZ - fl; y > crown; y -= fl) {
        if (y > top + 1) hline(sx, sx + bw - 1, y, gcol); else if (y > t1 + 1) hline(sx + a, sx + bw - a - 1, y, gcol); else hline(sx + b, sx + bw - b - 1, y,
        gcol); if (sw > 0) sideRun(y, sideN(y - 2), glassy ? sg : L.slab); }
    if (curtain) for (k = bay; k < bw - 1; k += bay) vline(sx + k, topAt(k) + fl * 2, HZ, gcol);
    if (stone) for (k = 2; k < bw - 2; k += 3) vline(sx + k, topAt(k) + fl, HZ, gcol);
    var pl = t < 0.26 ? 0.30 : t < 0.42 ? 0.14 : t < 0.52 ? 0.05 : 0;
    if (pl > 0) {
      cw = curtain ? bay : Math.max(3, u(0.9));
      for (y = HZ - fl, fi = 0; y > crown + fl; y -= fl, fi++) {
          if (hash(i * 131 + fi * 7) >= pl) continue; c = hash(i * 7 + fi) < (glassy ? 0.75 : 0.3) ? L.lit : L.lit2; for (k = 1; k + cw < bw; k += cw) {
          if (topAt(k) + fl * 2 + 2 > y - fl || hash(i * 17 + fi * 29 + k) > 0.8) continue; rect(sx + k, y - fl + 1, cw - 1, fl - 1, c); }
          if (sw > 1) for (k = 1; k < fl; k++) sideRun(y - fl + k, sideN(y - fl - 2) - 1, c); }
    }
    hline(sx, sx + bw - 1, top, L.roof);
    if (a) { hline(sx + a, sx + bw - a - 1, t1, L.roof); hline(sx + b, sx + bw - b - 1, t2, L.roof); }
    for (k = 0; k < sw; k++) px(right ? sx + bw + k : sx - 1 - k, top + (drop < 0.5 ? 0 : Math.ceil(drop * (k + 1) / (sw + 1))), L.roof);
    var lx = right || !sw ? sx : sx - sw, rx = right && sw ? sx + bw + sw - 1 : sx + bw - 1, dd = Math.ceil(drop);
    var ly = right || !sw ? topAt(0) : top + dd, ry = right && sw ? top + dd : topAt(bw - 1);
    vline(lx, ly + 1, HZ, e === -1 ? M[6] : e === 1 ? M[7] : cityMix(M[7], cityRGB(M[6]), (1 - e) / 2));
    vline(rx, ry + 1, HZ, e === 1 ? M[6] : e === -1 ? M[7] : cityMix(M[7], cityRGB(M[6]), (1 + e) / 2));
    if (sunE > u(9) && t < 0.6) { pa = Math.round(7 * Math.min(1, 1 - e)); pb = Math.round(7 * Math.min(1,
        1 + e)); if (pa) for (y = ly + 1; y < HZ; y++) if (BAY[(y & 3) * 4 + (i & 3)] < pa) px(lx, y,
        L.rim); if (pb) for (y = ry + 1; y < HZ; y++) if (BAY[(y & 3) * 4 + ((i + 2) & 3)] < pb) px(rx, y, L.rim); }
    if (typ === 3) { k = sx + (bw >> 1); y = u(8); pb = Math.max(2, u(0.9)); rect(k - 2, mt - pb, 5, pb, L.pent); vline(k, mt - y, mt,
        L.mast); if (t < 0.4 && !(((clock * 1.5) | 0) & 1)) rect(k - 1, mt - y - 1, 2, 2, L.red); } else if (typ === 4) {
        pa = Math.round(bw * (0.2 + hash(i * 13) * 0.15)); pb = Math.round(bw * 0.45); y = Math.max(3, u(1.8)); rect(sx + pa, mt - y, pb, y, L.pent); hline(sx + pa,
        sx + pa + pb - 1, mt - y, L.roof); } else if (bh > Math.round(HZ * 0.15) && hash(i * 41 + 17) < 0.15) { cityCrane(sx, bw, mt, i, L); }
  }
  function cityCrane(sx, bw, mt, seed, L) {
    var mx = sx + Math.round(bw * (0.20 + hash(seed * 41 + 3) * 0.55));
    var mh = Math.max(u(9), Math.round(bw * (0.55 + hash(seed * 41 + 5) * 0.35))), my = mt - mh;
    var jl = Math.max(u(10), Math.round(bw * (0.60 + hash(seed * 41 + 7) * 0.40))), cj = Math.round(jl * 0.32);
    var left = hash(seed * 41 + 9) < 0.5, jx0 = left ? mx - jl : mx - cj, jx1 = left ? mx + cj : mx + jl;
    var iron = L.pent, lt = L.slab, cw = Math.max(1, u(1.6)), ch = Math.max(1, u(1.8));
    hline(jx0, jx1, my - 1, lt);
    hline(jx0, jx1, my, iron);
    vline(mx, my, mt, iron);
    vline(mx + (sunX > mx ? 1 : -1), my, mt, lt);
    px(mx, my + 1, lt);
    rect(left ? jx1 - cw : jx0, my + 1, cw, ch, lt);
    rect(mx - Math.max(1, u(1.6)), my + 1, Math.max(2, u(2.4)), Math.max(1, u(1.4)), iron);
    var hookx = left ? jx0 + Math.round(jl * 0.22) : jx1 - Math.round(jl * 0.22);
    vline(hookx, my + 1, my + Math.max(2, u(3.2)), iron);
    if (t < 0.4 && !(((clock * 1.5 + seed) | 0) & 1)) px(left ? jx0 : jx1, my, L.red);
  }
  function tower(L) {
    var tx = Math.round(0.48 * W) - Math.round(camX * 0.05);
    if (tx < -u(60) || tx > W + u(60)) return;
    var S = Math.round(HZ * 0.88) / 553, y, j, n, hw, f, ya, yb, th;
    var md = L.tmd, sh = L.tsh, dk = L.tdk, lt = L.tlt;
    var sl = tx > sunX, warm = sunE > u(9) && t < 0.60, lampOn = t < 0.42;
    var dd = (tx - sunX) / u(30), ad, bk;
    dd = dd < -1 ? -1 : dd > 1 ? 1 : dd; ad = Math.abs(dd); bk = Math.round(16 * (1 - ad));
    function Y(m) { return HZ - Math.round(m * S); }
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
      for (jj = 0; jj < nn; jj++) { h = Math.round((r0 + (r1 - r0) * (nn > 1 ? jj / (nn - 1) : 0)) * S); span(y0 - jj, h, body,
          shd); if (lamp && lampOn && jj > 0 && jj < nn - 1) for (xx = 1 - h; xx < h; xx++) if (xx & 3) px(tx + xx, y0 - jj, lamp); }
    }
    ya = Y(334);
    for (y = HZ; y > ya; y--) { f = (HZ - y) / (HZ - ya); hw = Math.max(1, Math.round((8.5 + 17 * Math.pow(1 - f, 2.2)) * S)); span(y, hw, md,
        sh); px(tx + Math.round(2 * dd), y, dk); }
    band(334, 338, 12, 18, sh, dk);
    yb = Y(338); n = yb - Y(343);
    for (j = 0; j < n; j++) { hw = Math.round((19.5 + 1.8 * Math.sin(Math.PI * (j + 0.5) / n)) * S); span(yb - j, hw, j === 0 ? dk : lt, j === 0 ? dk : md); }
    band(343, 350, 18.5, 20.5, L.glass, L.gsh, L.lampA);
    band(350, 352, 20, 20, md, sh);
    band(352, 357, 20, 20, L.glass, L.gsh, L.lampB);
    ya = Y(357); n = ya - Y(359);
    for (j = 0; j < n; j++) span(ya - j, Math.round(21 * S), j === 0 ? dk : lt, j === 0 ? dk : md);
    band(359, 363, 18, 6, md, sh);
    band(363, 440, 4.5, 4.5, md, sh);
    band(440, 442, 5, 8.5, md, sh);
    band(442, 448, 8.5, 8.5, L.glass, L.gsh, L.lampA);
    band(448, 451, 8.5, 4, md, sh);
    ya = Y(451); yb = Y(553); th = (ya - yb) / 3;
    for (y = ya; y >= yb; y--) { f = ya - y; j = BAY[(y & 3) * 4 + 2] < bk; if (f < th) {
        hline(tx - 2, tx + 2, y, md); px(sl ? tx - 2 : tx + 2, y, lt); px(sl ? tx + 2 : tx - 2, y, j ? lt : dk); } else if (f < 2 * th) {
        hline(tx - 1, tx + 1, y, md); px(sl ? tx - 1 : tx + 1, y, lt); if (j) px(sl ? tx + 1 : tx - 1, y, lt); } else {
        px(tx, y, md); px(sl ? tx - 1 : tx + 1, y, lt); if (j) px(sl ? tx + 1 : tx - 1, y, lt); } }
    if (t < 0.45 && !(((clock * 1.5) | 0) & 1)) rect(tx - 1, yb - 1, 3, 2, L.red);
  }
  function ptFar(sx, r, i, top, shd) {
    if (sx < -2 * r || sx > W + 2 * r) return 0;
    var base = HZ + 1, m = 2 + ((hash(i * 9 + 33) * 3) | 0), sd = (hash(i * 9 + 39) * 2) | 0, k, cx, cyl, R, s, dx, x, yt, hb, my = base, d, f;
    for (k = 0; k < m; k++) {
      if (k === 0) { cx = sx; R = r; cyl = base - Math.round(r * (0.78 + hash(i * 9 + 36) * 0.14)); my = cyl + Math.round(r * 0.5); }
      else if (k < 3) { cx = sx + ((k + sd) & 1 ? -1 : 1) * Math.round(r * (0.48 + hash(i * 9 + k * 5 + 34) * 0.22)); R = Math.round(r * (0.50 + hash(i * 9 + k * 5 + 35) * 0.20)); cyl = base - Math.round(r * (0.30 + hash(i * 9 + k * 5 + 37) * 0.35)); }
      else { cx = sx + Math.round((hash(i * 9 + 38) - 0.5) * r * 0.7); R = Math.round(r * 0.52); cyl = base - Math.round(r * 1.30); }
      s = i * 7 + k; hb = Math.max(1, Math.round(R * 0.12));
      ptBumps(s, 2 * R + 1, hb, PT_BUMP, 0);
      for (dx = -R; dx <= R; dx++) { x = cx + dx; if (x < 0 || x >= W) continue; yt = cyl - Math.round(Math.sqrt(R * R - dx * dx) + PT_BUMP[dx + R] - hb * 0.5); if (yt < top[x]) top[x] = yt; }
    }
    R = Math.round(r * (0.34 + hash(i * 9 + 41) * 0.12)); hb = Math.max(1, Math.round(R * 0.3));
    f = sunE <= 0 ? 0 : Math.min(1, sunE / u(40)); d = Math.max(-1, Math.min(1, (sunX - sx) / (0.3 * W)));
    cx = sx - Math.round((0.25 + 0.3 * f) * (d < 0 ? -1 : 1) * Math.min(1, Math.abs(d) * 4) * r);
    ptBumps(i * 11 + 5, 2 * R + 1, hb, PT_BUMP, 0);
    for (dx = -R; dx <= R; dx++) { x = cx + dx; if (x < 0 || x >= W) continue; yt = my - Math.round(Math.sqrt(R * R - dx * dx) * 0.7 + PT_BUMP[dx + R] - hb * 0.5); if (yt < shd[x]) shd[x] = yt; }
    return 1;
  }
  function ptTree(sx, r, i, ty, T) {
    if (sx < -r * 2.1 || sx > W + r * 2.1) return;
    var base = HZ + 1 + Math.round(hash(i * 5 + 8) * u(1.5));
    if (ty === 1) conifer(sx, base, r, i, T);
    else if (ty === 2) poplar(sx, base, r, i, T);
    else maple(sx, base, r, i, T);
  }
  function ptRestore(n) { for (var k = 0; k < n; k += 2) buf[PT_HB[k]] = PT_HB[k + 1]; }
  function ptSave(n, cx, cy, hr) {
    var dy, dx, d, x, y, id;
    for (dy = -hr; dy <= hr; dy++) {
      y = cy + dy; if (y < 0 || y >= H) continue;
      d = Math.round(Math.sqrt(hr * hr - dy * dy));
      for (dx = -d; dx <= d; dx++) { x = cx + dx; if (x < 0 || x >= W || n > 16380) continue; id = y * W + x; PT_HB[n++] = id; PT_HB[n++] = buf[id]; }
    }
    return n;
  }
  function ptMass(x, y, R, sq, s, hb, k0, T, lite, skyw, fl) {
    x |= 0; y |= 0; R |= 0;
    var R2 = Math.max(1, Math.round(R * 0.84)), r2 = R2 * R2, rr = R * R, n = 2 * R + 1, yr = Math.floor(R2 * sq), kc = k0 * R2, c0 = T[0], c1 = T[1];
    var st = Math.max(4, R * 0.55), dy, v, ar, ws, A, yy, dx, xx, j, a, a2, b1, f, g, g0 = 0, g1 = 0, kk, kn = -1, t0, t1, tp, e, i, k, nx, ny, nz, q, lit, cs,
        ck, d, m, c2, c3;
    for (dy = -yr; dy <= yr; dy++) {
      v = dy / sq; ar = Math.round(Math.sqrt(Math.max(0, r2 - v * v))); yy = y + dy;
      A = R2 + (v - kc) / 0.55;
      if (A <= 0) hline(x - ar, x + ar, yy, c1);
      else if (A >= R2) hline(x - ar, x + ar, yy, c0);
      else { ws = Math.round(Math.sqrt(r2 - A * A)); if (ws >= ar) hline(x - ar, x + ar, yy, c1); else {
          hline(x - ar, x - ws - 1, yy, c0); hline(x - ws, x + ws, yy, c1); hline(x + ws + 1, x + ar, yy, c0); } }
    }
    ptBumps(s, n, hb, PT_BUMP, 1);
    var o2 = (n >> 2) + 1, j2;
    var S0 = PT_S[0], S1 = PT_S[1], S2 = PT_S[2], L = PT_S[3], ccx = PT_CR[0], ccy = PT_CR[1], irx = 0.75 / PT_CR[2], iry = 0.75 / PT_CR[3];
    var hh = hb * 0.5, h4 = hb * 0.4, h3 = hb * 0.3, t2 = T[2], t3 = T[3], t4 = T[4], x0 = x - R < 0 ? 0 : x - R, x1 = x + R > W - 1 ? W - 1 : x + R;
    var cap = lite > 0 && (L > 0 || (skyw > 0 && (ccy - y + R * 1.2) * iry + 0.25 > 0.2));
    for (xx = x0; xx <= x1; xx++) {
      dx = xx - x; j = dx + R;
      a = Math.sqrt(rr - dx * dx); a2 = dx > -R2 && dx < R2 ? Math.sqrt(r2 - dx * dx) : 0; b1 = PT_BUMP[j];
      f = j / st; kk = f | 0; if (kk !== kn) { kn = kk; g0 = hash(s * 13 + kk); g1 = hash(s * 13 + kk + 1) - g0; }
      f -= kk; g = g0 + g1 * f * f * (3 - 2 * f);
      t1 = Math.round(a2 * sq); t0 = Math.round((a * (0.88 + 0.2 * g) + b1 - hh) * sq);
      tp = y - (t0 > t1 ? t0 : t1);
      if (t0 > t1) for (i = (tp < 0 ? 0 : tp) * W + xx, k = (y - t1) * W + xx; i <= k; i += W) buf[i] = c1;
      j2 = j + o2 < n ? j + o2 : j + o2 - n;
      if (fl & 1) { e = Math.round((a * (1.06 - 0.2 * g) + PT_BUMP[j2] * 1.2 - hh) * sq); if (e > t1) for (i = (y + t1) * W + xx,
          k = (y + e < H ? y + e : H - 1) * W + xx; i <= k; i += W) buf[i] = c0; }
      e = fl & 2 ? Math.round(PT_BUMP[n - 1 - j] * 1.1) : 0;
      if (e > 0) { k = y + Math.round((kc + 0.55 * (a2 - R2)) * sq); if (k < tp) k = tp; e += k - 1; if (e > y + t1 - 1) e = y + t1 - 1; for (i = k * W + xx,
          k = e * W + xx; i <= k; i += W) buf[i] = c1; }
      if (!cap) continue;
      nx = (xx - ccx) * irx + dx / R * 0.25; ny = (ccy - tp) * iry + a / R * 0.25;
      q = nx * nx + ny * ny; if (q > 1) { q = Math.sqrt(q); nx /= q; ny /= q; q = 1; }
      nz = Math.sqrt(1 - q);
      lit = L * (nx * S0 + ny * S1 + nz * S2 + 0.16 * (1 - nz));
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
  }
  function ptBumps(s, n, hb, B, pk) {
    var j = 0, bs = 0, bw, bh, bi = 0, sh, p, h;
    while (j < n) { h = hash(s * 5 + bi * 7); bw = 4 + ((h * 6) | 0); h = h * 6 % 1; bh = Math.min(bw * 0.6,
        hb * (0.5 + h * 0.7)); sh = PT_BSH[bw]; p = pk && h * 7 % 1 > 0.45; for (; j < n && j < bs + bw; j++) {
        B[j] = sh[j - bs] * bh; if (pk) PT_PK[j] = p && j - bs === bw >> 1 ? 1 : 0; } bs += bw; bi++; }
  }
  function ptPal(k) {
    if (PT_PAL[2] !== gc) { PT_PAL[2] = gc; PT_PAL[0] = PT_FRONT.map(function (h) { return C(h); }); PT_PAL[1] = PT_BACK.map(function (h) { return C(h); }); }
    return PT_PAL[k];
  }
  function ptSun(sx, cy) {
    var az = Math.atan2(sunX - sx, W), el = sunA - (HZ - cy) / W, ce = Math.cos(el);
    PT_S[0] = Math.sin(az) * ce; PT_S[1] = Math.sin(el); PT_S[2] = -Math.cos(az) * ce;
    PT_S[3] = sunE <= 0 ? 0 : Math.min(1, sunE / u(40));
  }


  function backRow() {
    var ox = Math.round(camX * 0.42), x = Math.round(0.55 * W), i = 0, r, sx, n = 0;
    var top = PT_COL[0], shd = PT_COL[1], T = ptPal(1), lim = W + u(24), base = HZ + 1, ud = u(1.3), nd = u(1.8);
    if (!top || top.length !== W) { top = PT_COL[0] = new Int32Array(W); shd = PT_COL[1] = new Int32Array(W); }
    top.fill(H); shd.fill(H);
    while (x < 3.4 * W) {
      r = u(6) + Math.round(hash(i * 9 + 31) * u(6));
      if (x < 0.64 * W) r = Math.round(r * 0.66);
      sx = x - ox;
      if (sx - 2 * r > lim) break;
      n += ptFar(sx, r, i, top, shd);
      x += Math.round(r * (1.1 + hash(i * 9 + 32) * 0.3)) + u(1); i++;
    }
    if (!n) return;
    var L = sunE <= 0 ? 0 : Math.min(1, sunE / u(40)), se = Math.sin(sunA), ce = Math.cos(sunA), yt, yl, yr, sl, sdir, lit, th, rim, y, id, x0, x1, fl, wx;
    var c1 = -1, sp = 24, h1, h2, yd, k, g1 = 0, g2 = 0, d;
    for (x0 = 0; x0 < W; x0 = x1 + 1) {
      x1 = Math.min(W - 1, x0 + 47); fl = -1;
      for (x = x0; x <= x1; x++) if (top[x] > fl) fl = top[x];
      if (fl <= base) for (y = Math.max(fl + 1, 0); y <= base; y++) hline(x0, x1, y, T[1]);
      for (x = x0; x <= x1; x++) {
        yt = top[x]; if (yt > base) continue;
        if (yt < 0) yt = 0;
        yl = x > 2 && top[x - 3] <= base ? top[x - 3] : yt + 3; yr = x < W - 3 && top[x + 3] <= base ? top[x + 3] : yt + 3;
        sl = (yr - yl) / 6;
        d = sunX - x; sdir = d / Math.sqrt(d * d + W * W) * ce;
        lit = L * ((sl * sdir + se) / Math.sqrt(sl * sl + 1) + 0.12);
        wx = x + ox; th = 0.08 + (hash(wx * 3 + 5) - 0.5) * 0.08;
        rim = lit > th ? T[3] : T[2];
        id = yt * W + x; buf[id] = rim;
        for (y = yt + 1, id += W, k = Math.min(fl, base); y <= k; y++, id += W) buf[id] = y === yt + 1 && lit > th + 0.12 ? rim : T[1];
        yl = x > 3 ? top[x - 4] : H; yr = x < W - 4 ? top[x + 4] : H;
        if (yl <= base && yr <= base) { d = Math.min(yt - yl, yt - yr); if (d > 1) for (y = yt + 1, k = yt + Math.min(d + 1, nd), id = y * W + x; y <= k; y++, id += W) buf[id] = T[0]; }
        h1 = (wx / 24) | 0;
        if (h1 !== c1) { c1 = h1; sp = hash(c1 * 3 + 1) < 0.45 ? 24 : 10 + ((hash(c1 * 3 + 2) * 5) | 0); g1 = 0.3 + hash(c1 * 2) * 0.9; g2 = 0.3 + hash(c1 * 2 + 1) * 0.9; }
        h1 = wx - c1 * 24; h2 = h1 < sp ? (h1 + 0.5) / sp * 2 - 1 : (h1 - sp + 0.5) / (24 - sp) * 2 - 1;
        yd = base - ud - Math.round(Math.max(0, 1 - h2 * h2) * (h1 < sp ? g1 : g2) * ud);
        if (shd[x] < yd) yd = shd[x];
        if (yd < yt + 2) yd = yt + 2;
        for (id = yd * W + x, k = base * W + x; id <= k; id += W) buf[id] = T[0];
      }
    }
  }
  function treeline() {
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
    var tpl = PT_CROWNS[(hash(i * 5 + 13) * 3) | 0], ms = tpl[2], gp = tpl[3], nl = ms.length, mir = hash(i * 5 + 15) < 0.5 ? -1 : 1;
    var sh = hash(i * 5 + 11), rx = r * (0.92 + sh * 0.20) * tpl[0], ry = r * (0.96 - sh * 0.12) * tpl[1];
    var birch = i === PT_BIRCH_I;
    var clear = Math.round(r * (0.36 + hash(i * 5 + 12) * 0.12)), ly0 = base - clear, tw = Math.max(u(1.1), Math.round(r * (birch ? 0.085 : 0.11))), bark = birch ? C('#c9c1a4') : C('#33251a');
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
    if (birch) {
      var bby = ly0 - Math.round(bot * 0.6), bbh = Math.round(bot * 0.6) + clear + 1, nb = Math.max(2, Math.min(5, Math.round(bbh / u(6)))), lc = C('#241a10'), k2, yy2, mw2, mx2;
      for (k2 = 0; k2 < nb; k2++) {
        yy2 = bby + Math.round((k2 + 0.5 + (hash(i * 97 + 80 + k2) - 0.5) * 0.6) / nb * bbh);
        mw2 = Math.max(1, Math.round(tw * (0.45 + hash(i * 97 + 90 + k2) * 0.45)));
        mx2 = sx - (mw2 >> 1) + Math.round((hash(i * 97 + 95 + k2) - 0.5) * Math.max(0, tw - mw2));
        hline(mx2, mx2 + mw2 - 1, yy2, lc);
      }
    }
    if (PT_S[3] && Math.abs(PT_S[0]) > 0.15) vline(PT_S[0] > 0 ? sx - (tw >> 1) + tw - 1 : sx - (tw >> 1), ly0 - u(3), base, birch ? C('#f2ead2') : C('#4b3827'));
    var limbC = birch ? C('#33251a') : bark;
    limb(sx, ly0, cx - Math.round(wx * 0.26), cy + Math.round(bot * 0.25), Math.max(1, tw - 2), 1, limbC, 0);
    limb(sx, ly0 - u(2), cx + Math.round(wx * 0.24), cy + Math.round(bot * 0.1), Math.max(1, tw - 2), 1, limbC, 0);
    for (k = 0; k < nl; k++) {
      if (!PT_LB[k * 4 + 3]) continue;
      R = PT_LB[k * 4 + 2]; q = ms[k][1];
      var k0v = q < -0.3 ? 0.62 : q < 0 ? 0.36 : 0.08 + hash(i * 79 + k) * 0.1, litev = q < 0.15 ? 1 : 0, flv = q < 0 ? 0 : 3;
      ptMass(cx + PT_LB[k * 4], cy + PT_LB[k * 4 + 1], R, 0.9, i * 13 + k, Math.max(1, Math.round(R * 0.13)), k0v, T, litev, 1, flv);
    }
    ptRestore(n);
  }  function ptPalA(v) {
    if (PT_PALA[2] !== gc) { PT_PALA[2] = gc; PT_PALA[0] = PT_AUTUMN[0].map(function (h) { return C(h); }); PT_PALA[1] = PT_AUTUMN[1].map(function (h) { return C(h); }); }
    return PT_PALA[v];
  }
  function ptPal2(k) {
    if (PT_PAL2[2] !== gc) { PT_PAL2[2] = gc; PT_PAL2[0] = PT_CONI.map(function (h) { return C(h); }); PT_PAL2[1] = PT_POPL.map(function (h) { return C(h); }); }
    return PT_PAL2[k];
  }
  function ptTip(x, y, d, e, j, c) {
    var k, xe = x + d * (e - 1);
    hline(Math.min(x, xe), Math.max(x, xe), y, c);
    for (k = 1; k <= j; k++) { xe += d * (k < 3 ? 1 : 0); hline(k < j ? Math.min(xe, xe - d) : xe, k < j ? Math.max(xe, xe - d) : xe, y + k, c); }
  }  function ptCone(sg) {
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
    T = ptPal2(0);
    var h = Math.round(r * 2.3), top = base - h, tw = Math.max(2, Math.round(r * 0.09)), bot = h - Math.round(h * 0.05);
    var p0 = Math.max(u(1.8), Math.round(h / (8 + hash(i * 7 + 1) * 3))), wmax = r * (0.46 + hash(i * 7 + 3) * 0.10);
    var k, y, f, tk = 0, ts = 2 - ((hash(i * 7 + 2) * p0) | 0), pk = p0, ph, a, wl, wr, el = 1, er = 1, sl = 0.5, sr = 0.5, rl, rr, lc, sf, c, j, e, dl, dr;
    ptSun(sx, top + (h >> 1));
    rr = ptCone(1); rl = ptCone(-1); lc = PT_S[3] > 0.3 ? T[3] : T[2];
    sf = Math.max(-1, Math.min(1, PT_S[0] * 2)) * PT_S[3];
    rect(sx - (tw >> 1), base - Math.round(h * 0.10), tw, Math.round(h * 0.10) + 1, C('#33251a'));
    vline(sx, top - u(1.5), top + 2, T[1]);
    for (k = 2; k <= bot; k++) {
      while (k - ts >= pk) {
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
      if (ph > 0.6 && a > 2) {
        e = (ph - 0.6) / 0.4;
        dl = Math.min(wl, Math.round(wl * sl * e)); dr = Math.min(wr, Math.round(wr * sr * e));
        if (dl > 0) { hline(sx - wl, sx - wl + dl - 1, y, T[0]); if (dl > 2 && hash(i * 83 + k) > 0.5) px(sx - wl + dl, y, T[0]); }
        if (dr > 0) { hline(sx + wr - dr + 1, sx + wr, y, T[0]); if (dr > 2 && hash(i * 89 + k) > 0.5) px(sx + wr - dr, y, T[0]); }
      }
      if (ph < 0.6 && a > 2) {
        c = tk * 7 + ((k - ts) >> 1); j = 2 + (hash(i * 57 + c) > 0.5 ? 1 : 0);
        if (rl * wl >= 1 && hash(i * 53 + c) > 0.35) hline(sx - wl, sx - wl + Math.min(j, wl) - 1, y, lc);
        if (rr * wr >= 1 && hash(i * 59 + c) > 0.35) hline(sx + wr - Math.min(j, wr) + 1, sx + wr, y, lc);
      }
      if ((k - ts === pk - 1 || k === bot) && a > 3) {
        ptTip(sx - wl, y, -1, 2 + ((hash(i * 61 + tk) * 3) | 0), 1 + ((hash(i * 67 + tk) * 3) | 0), T[1]);
        ptTip(sx + wr, y, 1, 2 + ((hash(i * 71 + tk) * 3) | 0), 1 + ((hash(i * 73 + tk) * 3) | 0), T[1]);
      }
    }
  }
  function poplar(sx, base, r, i, T) {
    T = ptPal2(1);
    var h = Math.round(r * 2.6), w = Math.max(u(1.5), Math.round(r * 0.40)), th0 = Math.round(h * 0.07), tw = Math.max(2, Math.round(r * 0.10));
    var ch = h - th0, y0 = base - th0, k, f, hw, sd, yy, Rl, j, s, nc = Math.round(ch / 14);
    PT_CR[0] = sx; PT_CR[1] = y0 - (ch >> 1); PT_CR[2] = w * 0.9; PT_CR[3] = ch * 0.5;
    ptSun(sx, PT_CR[1]);
    rect(sx - (tw >> 1), y0 - (ch >> 3), tw, th0 + (ch >> 3) + 1, C('#33251a'));
    for (k = 0; k <= ch; k++) { hw = Math.round(w * 0.74 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.88 * k / ch))); hline(sx - hw, sx + hw, y0 - k, T[1]); }
    for (j = 0; j < nc; j++) {
      f = 0.06 + hash(i * 43 + j) * 0.84; hw = w * 0.74 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.88 * f));
      Rl = Math.max(2, Math.round(hw * (0.30 + hash(i * 47 + j) * 0.15)));
      ptMass(sx + Math.round((hash(i * 49 + j) - 0.5) * hw * 0.8), y0 - Math.round(f * ch), Rl, 0.85, i * 51 + j, Math.max(1, Math.round(Rl * 0.3)), 0.2, T, hash(i * 53 + j) < 0.3 ? 0.8 : 0, 0.5, 3);
    }
    for (sd = -1; sd <= 1; sd += 2) {
      for (yy = y0 - Math.round(ch * 0.95) + ((hash(i * 31 + sd + 2) * 4) | 0), j = 0; yy < y0; j++) {
        s = i * 37 + j * 2 + (sd + 1) / 2; f = (y0 - yy) / ch;
        hw = w * 0.74 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.88 * f));
        Rl = Math.max(2, Math.round(hw * (0.25 + hash(s * 3 + 1) * 0.20)));
        ptMass(sx + sd * Math.round(hw * (0.55 + hash(s * 3 + 2) * 0.30)), yy, Rl, 0.85, s * 5, Math.max(1, Math.round(Rl * 0.3)), 0.22, T, hash(s * 3 + 4) < 0.3 ? 1 : 0, 0.5, 3);
        yy += Math.max(3, Math.round(Rl * (0.8 + hash(s * 3 + 5) * 0.9)));
      }
    }
  }
  function grass() {
    var BG = ['#2a5138', '#376b45', '#488448', '#5a9e4c', '#649b48'], edges = [0.10, 0.25, 0.45, 0.70, 1];
    var BLd = ['#1f3f2c', '#2a5138', '#376b45', '#488448', '#488448'], BLt = ['#2a5138', '#428049', '#5a9e4c', '#6db24f', '#74ae3a'];
    var lit = sunE > u(9), bg = PG_SCR.bg, bd = PG_SCR.bd, bt = PG_SCR.bt, y, i, j, bi;
    pgBuild();
    for (i = 0; i < 5; i++) { bg[i] = C(BG[i]); bd[i] = C(BLd[i]); bt[i] = lit ? C(BLt[i]) : bd[i]; }
    if (Math.round(seam(H - 1) - camX) - 2 >= W) return;
    for (y = HZ, bi = 0; y < H; y++) {                         // fill on the same rounded rows the edges use
      while (bi < 4 && y >= HZ + Math.round(edges[bi] * GH)) bi++;
      hline(Math.round(seam(y) - camX) - 2, W - 1, y, bg[bi]);
    }
    for (i = 0; i < 4; i++) pgEdge(i, HZ + Math.round(edges[i] * GH), u(0.6) + Math.round(edges[i] * u(2.6)), Math.max(1, Math.round(0.10 * (edges[i + 1] - edges[i]) * GH)));
    PG_SCR.wf = C('#e9e1cd'); PG_SCR.wf2 = C('#f2d24a');
    for (j = 0; j < PG_SCR.brn; j += 4) pgBlades(j);
    pgLeafLitter();
  }
  function pgLeafLitter() {
    var LX = [1.70, 1.82, 1.62, 2.05, 2.90, 2.75], LY = [0.35, 0.58, 0.75, 0.85, 0.45, 0.72], LK = [0, 1, 2, 1, 0, 2], LF = [1, -1, 1, -1, 1, -1], LN = [0, 0, 0, 1, 0, 0];
    var cols = [[C('#e0a94e'), C('#a8854f')], [C('#7e3226'), C('#57422a')], [C('#a8854f'), C('#7e3226')]];
    var i, x, y, s, k, c, c2;
    for (i = 0; i < LX.length; i++) {
      y = HZ + Math.round(GH * LY[i]); x = sxOf(Math.round(LX[i] * W), 1);
      s = Math.max(2, Math.round(mpx(0.10, y)));
      if (x < -s - 3 || x > W + s + 3) continue;
      k = LK[i]; c = cols[k][0]; c2 = cols[k][1];
      if (LN[i]) pgMapleLeaf(x, y, s, c, c2, LF[i]);
      else pgLeafFleck(x, y, s, c, c2, i);
    }
  }
  function pgMapleLeaf(x, y, s, c, c2, dir) {
    var ht = Math.max(4, Math.round(s * 0.85)), hs = Math.max(2, Math.round(s * 0.5)), L = ht + hs;
    var LP = [0, 0.12, 0.28, 0.42, 0.55, 0.72, 0.87, 1], LW = [0, 0.32, 0.26, 1.0, 0.5, 0.6, 0.22, 0];
    var dy, ly, seg, f, w;
    for (dy = -ht; dy <= hs; dy++) {
      ly = (dy + ht) / L;
      for (seg = 0; seg < LP.length - 2 && ly > LP[seg + 1]; seg++);
      f = (ly - LP[seg]) / (LP[seg + 1] - LP[seg]);
      w = Math.round(s * (LW[seg] + (LW[seg + 1] - LW[seg]) * f));
      if (w > 0) hline(x - w, x + w, y + dir * dy, c);
    }
    px(x - 1, y + dir * Math.round(-ht + L * 0.42), c2);
    px(x, y + dir * Math.round(-ht + L * 0.16), c2);
    px(x, y + dir * (hs + 1), c2);
    px(x, y + dir * (hs + 2), c2);
  }
  function pgLeafFleck(x, y, s, c, c2, seed) {
    var n = 3 + (hash(seed * 7 + 2) * 3 | 0), j, dx, dy, r;
    for (j = 0; j < n; j++) {
      r = hash(seed * 31 + j * 5 + 1);
      dx = Math.round((r - 0.5) * s * 1.6);
      dy = Math.round((hash(seed * 41 + j * 5 + 2) - 0.5) * s * 0.9);
      px(x + dx, y + dy, hash(seed * 53 + j * 5 + 3) > 0.7 ? c2 : c);
    }
  }
  function street() {
    var y, sx, xk, xb, c, kf = Math.max(4, u(2.4));
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
  function streetPoleWX() { return 0.70 * W - mpx(29.5, KERB + Math.round(0.09 * RH)); }
  function streetXb(y) {
    var cr = Math.max(4, u(2.4)), f;
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
// track-bed joints, clipped to the seam so the far track never shows through the park railing
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
    return Math.round(seam(y) - camX) - 1;
  }
  function streetRail(P, up, x1, head, groove) {
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
  function streetShadows() {
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
    pgWallShadow();
    pgFlowerShade();
    pgFountainShadow(sxOf(PG_FOUNTAIN.x * W, 1), HZ + Math.round(GH * PG_FOUNTAIN.y));
    if (x > W + u(120) || x + w < -u(160)) return;
    pgPad(sxOf(2.17 * W, 1) - Math.round(mpx(0.35, y)), y);
    pgBenchShadow(x, y, w);
    pgBinShadow(sxOf(2.17 * W, 1), y);
  }  function treeShadeAt(x, y) {
    if (sunE <= u(9) || y <= HZ) return false;
    var g = treeGeo(), kk = (y - HZ) / (g.by - HZ), hy = sunE * (1 - 1 / kk), ca = Math.cos(sunA), i, h;
    for (i = 0; i < LUMP.length; i++) {
      h = treeShadeHalf(g, i, y, kk, hy, ca);
      if (h > 0 && Math.abs(x - (sunX + (g.cx[i] - sunX) * kk)) < h - u(2)) return true;
    }
    return false;
  }  function treeShadeHalf(g, i, y, kk, hy, ca) {
    var dd = (hy - g.h[i]) * ca / g.r[i];
    if (dd <= -1 || dd >= 1) return -1;
    return g.r[i] * Math.sqrt(1 - dd * dd) * kk * (0.93 + 0.07 * Math.sin(y / u(3) + i * 1.7));
  }  function treeLobeW(i, r, dy) {
    if (dy < -r || dy > r) return -1;
    return Math.sqrt(r * r - dy * dy) * (0.93 + 0.05 * Math.sin(dy / u(5) + 1.7 * i) + 0.035 * Math.sin(dy / u(2.2) + 4.1 * i));
  }  function treeGeo() {
    var g = TREE_G, i, L;
    g.tx = sxOf(TREEX, 1); g.tw = Math.max(6, u(13)); g.x = g.tx + Math.round(0.013 * W);
    g.cy0 = HZ - Math.round(H * 0.30); g.by = HZ + Math.round(GH * 0.58); g.fy = HZ - Math.round(H * 0.02);
    for (i = 0; i < LUMP.length; i++) { L = LUMP[i]; g.cx[i] = g.x + Math.round(L[0] * W); g.cy[i] = g.cy0 + Math.round(L[1] * H); g.r[i] = Math.max(5, Math.round(L[2] * W)); }
    if (!g.h) g.h = [];
    for (i = 0; i < LUMP.length; i++) g.h[i] = g.by - g.cy[i] + Math.round((hash(i * 37 + 5) - 0.5) * 0.6 * g.r[i]);
    return g;
  }  function pgShadeSpan(r, x0, x1) {
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
    var dy = y - HZ, yb = y - Math.round(0.5 * dy * dy / (2.5 * W)), dyb = yb - HZ, sb = dyb / dy;
    var lw = Math.max(3, Math.round(mpx(0.06, y))), ends = [x + u(1), x + w - u(1) - lw], kt = sunK(mpx(0.87, y));
    var x0 = Math.max(-2, Math.min(x, kt ? Math.round(projX(x, kt)) : x) - u(3)), x1 = Math.min(W + 1, Math.max(x + w, kt ? Math.round(projX(x + w, kt)) : x + w) + u(3));
    var r0 = yb - 2, r1 = Math.min(H - 1, (kt ? Math.round(projY(y, kt)) : y) + 3);
    if (x1 < x0 || r1 < r0) return;
    var bw = x1 - x0 + 1, nr = r1 - r0 + 1, nM = bw * nr, M = PG_SCR.u8.length >= nM ? PG_SCR.u8 : (PG_SCR.u8 = new Uint8Array(nM)), j, r, f, k, e, eb, s, xa, xz, a, b, o, i, v, re;
    if (PG_SCR.rmn.length < nr) { PG_SCR.rmn = new Int32Array(nr); PG_SCR.rmx = new Int32Array(nr); }
    var RN = PG_SCR.rmn, RX = PG_SCR.rmx;
    M.fill(0, 0, nM); RN.fill(1e9, 0, nr); RX.fill(-1, 0, nr);
    function mark(rr, p, q, v) {
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
      for (r = yb; r <= y; r++) {
        f = (r - yb) / Math.max(1, y - yb); xa = XB(x) + (x - XB(x)) * f; xz = XB(x + w) + (x + w - XB(x + w)) * f;
        a = sunK(mpx(0.41, r)); b = sunK(mpx(0.47, r));
        for (s = Math.round(projY(r, a)); s <= Math.round(projY(r, b)); s++) { k = (s - HZ) / (r - HZ); mark(s, projX(xa, k), projX(xz, k), 2); }
      }
      xa = XB(x); xz = XB(x + w);
      for (j = 0; j < 3; j++) {
        a = sunK(mpx(0.765 - j * 0.12, yb)); b = sunK(mpx(0.85 - j * 0.12, yb));
        for (s = Math.round(projY(yb, a)); s <= Math.round(projY(yb, b)); s++) { k = (s - HZ) / dyb; mark(s, projX(xa, k), projX(xz, k), 2); }
      }
      for (j = 0; j < 2; j++) {
        e = ends[j]; eb = XB(e);
        b = sunK(mpx(0.87, yb)); for (s = yb; s <= Math.round(projY(yb, b)); s++) { k = (s - HZ) / dyb; mark(s, projX(eb + 1, k), projX(eb + lw - 2, k), 2); }
        b = sunK(mpx(0.66, y)); for (s = y; s <= Math.round(projY(y, b)); s++) { k = (s - HZ) / dy; mark(s, projX(e, k), projX(e + lw - 1, k), 2); }
        for (r = yb; r <= y; r++) {
          f = (r - yb) / Math.max(1, y - yb); k = sunK(mpx(0.66, r)); a = eb + (e - eb) * f; s = projY(r, k);
          mark(s, projX(a - 1, k), projX(a + lw, k), 2); mark(s + 1, projX(a - 1, k), projX(a + lw, k), 2);
        }
      }
    }
    for (r = Math.max(0, r0); r <= r1; r++) {
      o = (r - r0) * bw - x0; re = RX[r - r0];
      for (i = RN[r - r0]; i <= re; i = s) {
        v = M[o + i];
        for (s = i + 1; s <= re && M[o + s] === v; s++);
        if (v === 2) pgShadeSpan(r, i, s - 1);
        else if (v) for (; i < s; i++) shade(i, r, 0.14);
      }
    }
  }  function pgPad(xl, y) {
    var dy = y - HZ, D = dy * dy / (2.5 * W), yb = y - Math.round(0.9 * D), yf = y + Math.max(2, Math.round(0.45 * D));
    var top = C('#b3b8b2'), spk = C('#9aa3a6'), lip = C('#877d72'), el = PG_SCR.el, r, a, b, x;
    for (r = Math.max(0, yb); r <= Math.min(H - 1, yf); r++) {
      a = Math.round(W / 2 + (xl - W / 2) * (r - HZ) / dy); b = el[r] - 1;
      hline(a, b, r, r === yf ? lip : r === yf - 1 ? spk : top);
      if (r < yf - 1) for (x = 0; x < (b - a) * 0.08; x++) px(a + Math.round(hash((r - y) * 131 + x * 7 + 9) * (b - a)), r, spk);
    }
  }  function pgWallShadow() {
    var E = 2.5 * W;
    if (seam(H - 1) - camX > W + u(12)) return;
    var HL = PG_SCR.hl, PP = PG_SCR.pp, SP = PG_SCR.sp, G = PG_GATE, gap = u(2), cast = sunE > u(9), wall = cast && sunX < seam(HZ + 1) - camX;
    var c = 0.78 / 2.5 / Math.max(1, sunE), w0 = Math.ceil(E / G[1][1]) - 1, w1 = Math.floor(E / G[0][0]) + 1, ys0 = H, ys1 = 0, xmax = seam(HZ + 1) - camX + u(8);
    var f0 = HZ + Math.round(E / G[0][0]), b0 = HZ + Math.round(E / G[0][1]), f1 = HZ + Math.round(E / G[1][0]), b1 = HZ + Math.round(E / G[1][1]);
    var k, i, j, n, r, R, row, mm, kk, xa, xb, ya, yb, dm, cl, s, tt, o, x0, x1;
    if (cast) for (k = 0; k < 2; k++) {
      for (i = 0; i < 2; i++) {
        row = HZ + Math.round(E / G[k][i]); mm = (row - HZ) / 2.5; kk = sunK(mm * 2.3);
        xb = seam(row) - camX + mm * 0.075; xa = xb - mm * 0.55; j = 2 * i;
        PP[j * 2] = i ? xb : xa; PP[(j + 1) * 2] = i ? xa : xb; PP[j * 2 + 1] = PP[(j + 1) * 2 + 1] = row;
        PP[(j + 4) * 2] = projX(PP[j * 2], kk); PP[(j + 5) * 2] = projX(PP[(j + 1) * 2], kk); PP[(j + 4) * 2 + 1] = PP[(j + 5) * 2 + 1] = projY(row, kk);
      }
      for (i = 0; i < 4; i++) {
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
      if (wall) {
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
      for (k = 0; k < 2; k++) {
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
    function span(a, b) {
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
    for (i = 0; i < fl.length; i += 5) {
      y = Math.round(fl[i + 1]);
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
      for (i = 0; i < fl.length; i += 5) {
        if (fl[i + 4] === 1 || fl[i + 4] === 2) continue;
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
  function dapple(g, ca) { var out = [], i, j, n, th, rho, h, k, rx; for (i = 0; i < LUMP.length; i++) for (j = 0; j < 20; j++) { n = i * 53 + j * 7 + 400;
      th = hash(n) * 6.283; rho = 0.86 + hash(n + 1) * 0.22; h = g.h[i] + g.r[i] / ca * Math.cos(th) * rho; k = sunK(h); if (!k) return out;
      rx = ((j & 1) ? u(2) + hash(n + 2) * u(4) : u(1.2) + hash(n + 2) * u(2.6)) * k / 1.4;
      out.push(projX(g.cx[i] + g.r[i] * Math.sin(th) * rho, k), projY(g.by, k), rx, Math.max(1.5, rx * 0.26), j & 1 ? 1 : 3); } for (j = 0; j < 70; j++) {
      n = j * 11 + 900; i = (hash(n) * LUMP.length) | 0; th = hash(n + 1) * 6.283; rho = 0.7 + Math.sqrt(hash(n + 2)) * 0.3;
      h = g.h[i] + g.r[i] / ca * Math.cos(th) * rho; k = sunK(h); if (!k) return out;
      rx = (hash(n + 3) < 0.85 ? 1 + hash(n + 4) * 2 : u(1.5) + hash(n + 4) * u(2.5)) * k / 1.4;
      out.push(projX(g.cx[i] + g.r[i] * Math.sin(th) * rho, k), projY(g.by, k), rx, Math.max(1, rx * 0.3), 0); } return out; }
  function storefronts() { var m = mpx(1, BASE), end = seam(BASE) - mpx(STREET_PW + STREET_RW + 2.5, BASE), wx = -0.20 * W, i = 0, r, wm, bw, sx, nUp;
      while (wx < end - 4 * m) { r = hash(i * 5 + 1);
      wm = r < 0.55 ? 5.6 + hash(i * 5 + 7) * 2.2 : r < 0.88 ? 10.5 + hash(i * 5 + 7) * 3.5 : 15.5 + hash(i * 5 + 7) * 3; bw = Math.round(wm * m);
      if (wx + bw > end) bw = Math.round(end - wx); r = hash(i * 5 + 2); nUp = r < 0.36 ? 1 : (r < 0.90 || bw < 9 * m ? 2 : 3); sx = Math.round(wx - camX);
      if (sx < W + 2 && sx + bw > -2) facade(sx, bw, nUp, i); wx += bw; i++; } streetSideRow(i - 1, nUp); }
  function streetRowHM(hi) { var st = 4, f = hi / st, k = f | 0, a = 7 + hash(k * 53 + 31) * 3.5, b = 7 + hash((k + 1) * 53 + 31) * 3.5; f -= k;
      f = f * f * (3 - 2 * f); return a + (b - a) * f; }
  function streetSideRow(ci, nUp) { var m = mpx(1, BASE), bh = Math.round(4.3 * m) + nUp * Math.round(3.4 * m) + Math.max(3, Math.round(0.6 * m)) + Math.max(2,
      Math.round(0.5 * m)); var zb = W * 2.5 / (BASE - HZ), g, x0, x1, x, z, hi, hm, top, c, s, dk = C('#33251a'), win = C('#26292d');
      for (g = BASE; g > HZ + 1; g--) { x0 = Math.round(streetX(g, STREET_RW + 2.5)); x1 = Math.max(x0 + 1, Math.round(streetX(g - 1, STREET_RW + 2.5)));
      if (x0 >= W) break; if (x1 <= 0) continue; z = W * 2.5 / (g - HZ) - zb; if (z < 18) { hi = -1; top = g - Math.round(bh * (g - HZ) / (BASE - HZ));
      c = C(STREET_TONE[STREET_FSEQ[ci % STREET_FSEQ.length]] || SFC[STREET_FSEQ[ci % STREET_FSEQ.length]]); } else { hi = Math.floor((z - 18) / 6.5);
      hm = streetRowHM(hi); top = g - Math.round(mpx(hm, g)); c = C(SFC[STREET_FSEQ[(hi * 5 + 3) % STREET_FSEQ.length]]); } for (x = x0; x < x1; x++) {
      vline(x, top, g - 1, c); px(x, top, dk); if (((x + camX) & 3) === 0) for (s = 0; s < 3; s++) if (mpx(1.1 + 3.2 * s, g) < g - top - 3) vline(x,
      g - Math.round(mpx(2.6 + 3.2 * s, g)), g - Math.round(mpx(1.1 + 3.2 * s, g)), win); } } }
  function facade(sx, bw, nUp, i) { var m = mpx(1, BASE), shopH = Math.round(4.3 * m), st = Math.round(3.4 * m), corn = Math.max(3, Math.round(0.6 * m)),
      para = Math.max(2, Math.round(0.5 * m)); var shop = BASE - shopH, top = shop - nUp * st - corn - para, x, y, k, f, n, x0, x1, step, r;
      var ci = STREET_FSEQ[i % STREET_FSEQ.length], body = C(SFC[ci]), tone = STREET_TONE[ci] ? C(STREET_TONE[ci]) : 0;
      var stone = C('#b3b8b2'), pil = Math.max(2, Math.round(0.3 * m)), dk = C('#33251a');
      var trim = C(ci === 3 ? '#1f3f2c' : (tone && hash(i * 11 + 3) < 0.4) ? '#33251a' : '#e9e1cd');
      var corC = hash(i * 11 + 4) < 0.55 ? C('#4b3827') : trim, head = tone && hash(i * 11 + 6) < 0.5 ? tone : stone; rect(sx, top, bw, shop - top, body);
      if (tone) for (y = top + para; y < shop; y += 2) { step = ((y - top) & 2) ? 4 : 2; x0 = sx + (step === 4 ? 1 : 0);
      if (x0 < 0) x0 += Math.ceil(-x0 / step) * step; x1 = Math.min(W - 1, sx + bw - 1); for (x = x0; x <= x1; x += step) buf[y * W + x] = tone; } if (tone) {
      rect(sx, top + para, pil, shop - top - para, tone); rect(sx + bw - pil, top + para, pil, shop - top - para, tone); } hline(sx, sx + bw - 1, top, C('#cfd6d8'));
      hline(sx, sx + bw - 1, top + 1, stone); if (sunE > u(9) && t < 0.5) for (x = sx + ((sx + camX) & 1); x < sx + bw; x += 2) px(x, top, C('#f0d69f'));
      y = top + para; rect(sx - 1, y, bw + 2, corn, corC); hline(sx - 1, sx + bw, y, corC === trim ? C('#f6f4ea') : C('#6f573c'));
      hline(sx - 1, sx + bw, y + corn - 1, dk); for (k = y + corn; k < y + corn + 3; k++) for (x = sx; x < sx + bw; x++) shade(x, k, 0.32 - 0.09 * (k - y - corn));
      n = Math.max(2, Math.round(bw / (1.4 * m))); for (k = 0; k <= n; k++) { x = sx + 1 + Math.round(k * (bw - 5) / n);
      rect(x, y + corn, 3, Math.round(0.4 * m), corC); vline(x + 2, y + corn, y + corn + Math.round(0.4 * m) - 1, dk); } r = hash(i * 11 + 9);
      x = sx + Math.round(bw * (0.15 + 0.6 * hash(i * 11 + 10))); if (r < 0.3) {
      rect(x, top - Math.round(1.1 * m), Math.round(0.6 * m), Math.round(1.1 * m), tone || body);
      hline(x - 1, x + Math.round(0.6 * m), top - Math.round(1.1 * m), stone); } else if (r < 0.5) {
      rect(x, top - Math.round(0.75 * m), Math.round(1.1 * m), Math.round(0.75 * m), C('#9aa3a6'));
      hline(x, x + Math.round(1.1 * m) - 1, top - Math.round(0.75 * m), C('#cfd6d8'));
      for (k = x + 2; k < x + Math.round(1.1 * m) - 2; k += 2) vline(k, top - Math.round(0.5 * m), top - 2, C('#6d777b'));
      } var nWin = Math.max(2, Math.round(bw / m / 2.4)), bay = (bw - 2 * pil) / nWin, ww = Math.round(0.85 * m) | 1, wh = Math.round(1.85 * m),
      lf = cl01(1 - t / 0.34), sc = hash(i * 11 + 8) < 0.5; for (f = 0; f < nUp; f++) { y = top + para + corn + f * st;
      if (f > 0 && sc) hline(sx + pil, sx + bw - pil - 1, y, stone); for (k = 0; k < nWin; k++) {
      streetWindow(Math.round(sx + pil + bay * (k + 0.5) - ww / 2), y + Math.round(0.75 * m), ww, wh, trim, head, stone, hash(i * 17 + f * 5 + k * 3 + 1) < 0.30 * lf,
      hash(i * 13 + f * 7 + k * 11 + 5)); } } var fr = C(['#1f3f2c', '#26292d', '#7e3226', '#33251a', '#4a555e'][(i * 7 + 3) % 5]);
      var fh = Math.round(0.85 * m), tr = Math.max(3, Math.round(0.45 * m)), bulk = Math.max(3, Math.round(0.5 * m));
      var fy = shop + 2, ty = fy + fh + 1, gy0 = ty + tr + 1, gy1 = BASE - bulk - 1;
      var dw = Math.round(0.95 * m), left = hash(i * 31 + 7) < 0.5, fx = left ? sx + pil + 1 : sx + bw - pil - 1 - dw;
      var u0 = left ? fx + dw + 2 : sx + pil, u1 = left ? sx + bw - pil - 1 : fx - 3, ns = u1 - u0 > 10 * m ? 2 : 1, a, b; rect(sx, shop, bw, shopH, fr);
      hline(sx - 1, sx + bw, shop, stone); hline(sx - 1, sx + bw, shop + 1, C('#6d777b')); for (k = 0; k < ns; k++) { a = Math.round(u0 + (u1 - u0 + 1) * k / ns);
      b = Math.round(u0 + (u1 - u0 + 1) * (k + 1) / ns) - 1 - (k < ns - 1 ? pil : 0); streetShop(a, b, fy, fh, ty, tr, gy0, gy1, i * 3 + k);
      } rect(fx, fy, dw, fh, fr); rect(fx, ty, dw, tr, C('#26292d')); hline(fx, fx + dw - 1, ty + 1, C('#3d4a63'));
      var dtop = Math.max(gy0, BASE - Math.round(2.1 * m)); rect(fx, gy0, dw, dtop - gy0, C('#26292d'));
      rect(fx, dtop, dw, BASE - dtop, C(left ? '#4b3827' : '#1f3f2c')); vline(fx, dtop, BASE - 1, dk); vline(fx + dw - 1, dtop, BASE - 1, C('#6f573c'));
      frame(fx + 2, dtop + 3, dw - 4, Math.round((BASE - dtop) * 0.4), C('#6f573c'));
      frame(fx + 2, dtop + Math.round((BASE - dtop) * 0.5), dw - 4, Math.round((BASE - dtop) * 0.42), C('#6f573c'));
      px(fx + dw - 3, dtop + Math.round((BASE - dtop) * 0.47), stone); if (hash(i * 43 + 17) < 0.16) streetSandwichBoard(sx, bw, fx, dw, left, m); }
  function streetSandwichBoard(sx, bw, fx, dw, left, m) {
      var w = Math.max(3, Math.round(0.46 * m)), h = Math.max(9, Math.round(0.95 * m)), gap = Math.max(2, Math.round(0.35 * m));
      var x0 = left ? fx + dw + gap : fx - gap - w; if (x0 < sx + 2 || x0 + w > sx + bw - 2) return;
      var top = BASE - h, wood = C('#4b3827'), wood2 = C('#33251a'), board = C('#1d252b'), chalk = C('#cfd6d8'), cream = C('#e9e1cd'); px(x0 - 1, BASE - 1, wood);
      px(x0 + w, BASE - 1, wood); rect(x0, top, w, h, board); hline(x0 + 1, x0 + w - 2, top, cream); frame(x0 + 1, top + 1, w - 2, h - 3, wood2);
      hline(x0 + 1, x0 + w - 2, top + 1, wood); hline(x0 + 2, x0 + w - 3, top + Math.round(h * 0.32), chalk);
      hline(x0 + 2, x0 + w - 4, top + Math.round(h * 0.32) + Math.max(2, Math.round(0.14 * m)), chalk); shade(x0 - 1, BASE - 1, 0.30); shade(x0 + w, BASE - 1, 0.30);
      }
  function streetWindow(x, y, w, h, trim, head, stone, on, r) { var mid = y + (h >> 1), gl, re, xx, yy, k, bl; hline(x + 2, x + w - 3, y - 3, head);
      hline(x, x + w - 1, y - 2, head); px(x - 1, y - 1, head); px(x + w, y - 1, head); hline(x + 1, x + w - 2, y - 1, trim); rect(x, y, w, h, trim);
      gl = on ? CR('#ffd98a') : C('#26292d'); re = on ? CR('#f4ac6b') : C(t < 0.3 ? '#3d4a63' : '#4e5d79'); rect(x + 1, y + 1, w - 2, mid - y - 1, gl);
      rect(x + 1, mid + 1, w - 2, y + h - 2 - mid, gl); for (yy = y + 1; yy < y + h - 1; yy++) { if (yy === mid) continue;
      k = on ? (yy - y) / h * 9 - 3 : 7 - (yy - y) * 0.8; if (k <= 0) continue;
      for (xx = x + 1; xx < x + w - 1; xx++) if (BAY[((yy - y) & 3) * 4 + ((xx - x) & 3)] < k) px(xx, yy, re); } if (r < 0.4) {
      bl = y + 1 + Math.round(r / 0.4 * (mid - y - 2)); rect(x + 1, y + 1, w - 2, bl - y, on ? CR('#f4ac6b') : C('#d9b48c'));
      hline(x + 1, x + w - 2, bl, on ? CR('#e0a94e') : C('#b98761')); } vline(x + (w >> 1), y, y + h - 1, trim); hline(x, x + w - 1, mid, trim);
      hline(x - 1, x + w, y + h, stone); for (xx = x - 1; xx <= x + w; xx++) shade(xx, y + h + 1, 0.35); }
  function streetShop(u0, u1, fy, fh, ty, tr, gy0, gy1, s) {
      var m = mpx(1, BASE), uw = u1 - u0 + 1, x, y, k, n, gx, gy, bits, name, sc, lw, lx, ly, bc, lc, dx, dw, gl, re, lit, day = t >= 0.3;
      var fr = C(['#1f3f2c', '#26292d', '#7e3226', '#33251a', '#4a555e'][(s * 3 + 1) % 5]); if (uw < 6) return; k = (s * 7 + 1) % 5;
      bc = C(['#1f3f2c', '#26292d', '#e9e1cd', '#7e3226', '#33251a'][k]); lc = C(k === 2 ? '#1f3f2c' : (s & 1) ? '#f2d24a' : '#e9e1cd'); rect(u0, fy, uw, fh, bc);
      hline(u0, u1, fy + fh - 1, C('#1d252b')); name = STREET_SIGNS[(s * 5 + 3) % STREET_SIGNS.length]; sc = name.length * 8 - 2 <= uw - 8 && fh >= 12 ? 2 : 1;
      if (name.length * 4 * sc - sc > uw - 4) name = name.slice(0, Math.max(1, Math.floor((uw - 4 + sc) / (4 * sc)))); lw = name.length * 4 * sc - sc;
      lx = u0 + ((uw - lw) >> 1); ly = fy + ((fh - 5 * sc) >> 1); streetText(name, lx, ly, sc, lc); lit = !day && hash(s * 7919 + 1013) < 0.30 * cl01(1 - t / 0.30);
      gl = lit ? CR('#8a6a3f') : C(day ? '#3d4a63' : '#26292d'); re = lit ? CR('#e0a94e') : C(day ? '#6d777b' : '#3d4a63'); rect(u0, ty, uw, tr, gl);
      for (x = u0 + Math.round(0.6 * m); x < u1; x += Math.round(0.6 * m)) vline(x, ty, ty + tr - 1, fr); hline(u0, u1, gy0 - 1, fr);
      rect(u0, gy0, uw, gy1 - gy0 + 1, gl); if (lit) { rect(u0, gy0, uw, 2, re); for (x = u0 + Math.round(0.5 * m); x < u1 - 2; x += Math.round(1.3 * m)) {
      vline(x + 1, gy0, gy0 + 2, CR('#33251a')); rect(x, gy0 + 3, 3, 2, CR('#ffd98a')); } k = gy0 + Math.round((gy1 - gy0) * 0.45); hline(u0, u1, k, CR('#57422a'));
      hline(u0, u1, k + Math.round(0.35 * m), CR('#57422a')); k = Math.round((gy1 - gy0) * 0.3); rect(u0, gy1 - k + 1, uw, k, CR('#33251a'));
      hline(u0, u1, gy1 - k + 1, CR('#b98761'));
      } else for (y = gy0; y < gy0 + ((gy1 - gy0) >> 2) + 2; y++) for (x = u0; x <= u1; x++) if (BAY[((y - gy0) & 3) * 4 + ((x - u0) & 3)] < 4 - (y - gy0) * 0.35) px(x,
      y, re); n = Math.max(1, Math.round(uw / m / 1.9)); for (k = 1; k < n; k++) vline(u0 + Math.round(uw * k / n), gy0, gy1, fr);
      rect(u0, gy1 + 1, uw, BASE - gy1 - 1, fr); hline(u0, u1, gy1 + 1, C('#6f573c')); frame(u0 + 2, gy1 + 3, uw - 4, BASE - gy1 - 4, C('#1d252b'));
      dw = Math.round(1.0 * m); dx = hash(s * 31 + 9) < 0.5 ? u0 + Math.round(uw * 0.12) : u1 - Math.round(uw * 0.12) - dw; if (uw > dw + 8) {
      rect(dx - 2, gy0, dw + 4, BASE - gy0, C('#1d252b')); var dtop = Math.max(gy0, BASE - Math.round(2.1 * m)); rect(dx, dtop + 1, dw, BASE - dtop - 1, fr);
      rect(dx + 2, dtop + 3, dw - 4, BASE - dtop - 4 - Math.round(0.35 * m), gl); px(dx + dw - 4, dtop + Math.round((BASE - dtop) * 0.55), C('#b3b8b2'));
      hline(dx - 2, dx + dw + 1, BASE - 1, C('#6d777b')); } if (hash(s * 23 + 5) < 0.42) streetAwning(u0 - 1, u1 + 1, ty - 1, s); }
  function streetAwning(x0, x1, y, s) { var m = mpx(1, BASE), ah = Math.round(0.6 * m), vh = Math.max(2, Math.round(0.3 * m)), sw = Math.max(2,
      Math.round(0.3 * m)), x, k, a, b; var A = [['#b34a3a', '#e9e1cd'], ['#1f3f2c', '#1f3f2c'], ['#26292d', '#26292d'], ['#376b45', '#e9e1cd'], ['#7e3226',
      '#7e3226']][s % 5]; a = C(A[0]); b = C(A[1]); for (x = x0, k = 0; x <= x1; x += sw, k++) rect(x, y, Math.min(sw, x1 - x + 1), ah + vh, k & 1 ? b : a);
      for (x = x0; x <= x1; x++) { shade(x, y + ah, 0.25); shade(x, y + ah + vh - 1, 0.35); } hline(x0, x1, y, C('#4a555e'));
      for (k = 0; k < Math.round(0.45 * m); k++) for (x = x0 + 1; x < x1; x++) shade(x, y + ah + vh + k, 0.34 - 0.05 * k); }
  function wires() { }
  function lights() { for (var i = 0; i < 4; i++) streetLamp(i); streetHydrant(); streetGreenP(); streetLitterBin(); streetJunctionSign(); streetStop();
      streetOverhead(); }
  function streetHydrant() { var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), wx = STREET_POLES[2] * W + mpx(2.2, y), sx = Math.round(wx - camX);
      var w = Math.max(4, Math.round(0.34 * m)), h = Math.max(8, Math.round(0.78 * m)); if (sx < -w - 3 || sx > W + w + 3) return;
      var top = y - h, x0 = sx - (w >> 1), domeH = Math.max(2, Math.round(h * 0.34)), nk = top + domeH;
      var red = C('#b34a3a'), red2 = C('#7e3226'), red3 = C('#8f2f28'), sil = C('#9aa3a6'), silD = C('#6d777b'), dk = C('#26292d');
      var litR = sunE > u(9) && sunX > sx; rect(x0, nk, w, y - nk, red); disc(sx, nk, Math.max(2, Math.ceil(w * 0.58)), red); px(sx, top, silD);
      var nh = Math.max(2, Math.round(h * 0.10)), ny = nk + Math.round((y - nk) * 0.18); rect(x0 - 2, ny, 2, nh, sil); rect(x0 + w, ny, 2, nh, sil);
      px(x0 - 2, ny, silD); px(x0 + w + 1, ny, silD); px(sx - (litR ? 1 : -1), nk - 1, C('#f6f4ea')); vline(x0, nk, y - 1, litR ? red : red2);
      vline(x0 + w - 1, nk, y - 1, litR ? C('#cf6250') : red3); var flr = h >= 16 ? 2 : 1, k2; for (k2 = 1; k2 <= flr; k2++) { var ry2 = y - 1 - k2;
      px(x0 - 1, ry2, litR ? red : red2); px(x0 + w, ry2, litR ? C('#cf6250') : red3); } hline(x0 - 1, x0 + w, y - 1, dk); if (sunE > u(9)) shadow(x0, y, w, h, 0.26);
      else { shade(x0 - 1, y, 0.30); shade(x0 + w, y, 0.30); } }
  function streetGreenP() { var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), sx = Math.round(STREET_POLES[2] * W - camX);
      var r = Math.max(4, Math.round(0.30 * m)), cy = y - Math.round(2.35 * m), cx = sx - r - Math.max(2, Math.round(0.10 * m));
      if (cx + r < -2 || cx - r > W + 2) return; disc(cx, cy, r, C('#f6f4ea')); disc(cx, cy, Math.max(2, r - 2), C('#1f3f2c')); hline(cx, sx, cy, C('#4a555e'));
      streetText('P', cx - 2, cy - 2, 1, C('#f6f4ea')); }
  function streetLitterBin() { var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), wx = streetPoleX(3) - mpx(4.5, y), sx = Math.round(wx - camX);
      var w = Math.max(6, Math.round(0.62 * m)), h = Math.max(7, Math.round(0.92 * m)); if (sx < -w - 2 || sx > W + w + 2) return;
      var top = y - h, x0 = sx - (w >> 1), half = w >> 1, lidH = Math.max(2, Math.round(h * 0.14));
      var grey = C('#51565c'), grey2 = C('#33373b'), blue = C('#3d4a63'), lid = C('#26292d'), dk = C('#1d252b'); rect(x0, top + lidH, half, h - lidH, grey);
      rect(x0 + half, top + lidH, w - half, h - lidH, blue); vline(x0 + half, top + lidH, y - 1, dk); rect(x0 - 1, top, w + 2, lidH, lid);
      hline(x0 - 1, x0 + w, top, grey2); hline(x0 + 2, x0 + half - 2, top + 1, C('#26292d')); hline(x0 + half + 2, x0 + w - 2, top + 1, C('#26292d'));
      vline(x0, top + lidH, y - 1, grey2); vline(x0 + w - 1, top + lidH, y - 1, C('#1d252b')); hline(x0 - 1, x0 + w, y - 1, dk);
      if (sunE > u(9)) shadow(x0, y, w, h, 0.26); else { shade(x0 - 1, y, 0.30); shade(x0 + w, y, 0.30); } }
  function streetJunctionSign() { var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), sx = Math.round(streetPoleX(3) - camX);
      if (sx < -u(60) || sx > W + u(60)) return; var gh0 = 6 * 1 + 3, sc = gh0 < 8 ? 2 : 1, gh = 6 * sc + 3, gw = 10 * 4 * sc - sc + 6, by = y - Math.round(2.85 * m);
      var green = C('#1f3f2c'), white = C('#f6f4ea'), post = C('#4a555e'); hline(sx - 1, sx + 1, by - 1, post);
      streetSignBlade(sx - (gw >> 1), by, gw, gh, 'QUEEN ST W', sc, green, white); streetSignBlade(sx - (gw >> 1), by + gh + 2, gw, gh, 'ELM ST', sc, green, white); }
  function streetSignBlade(x, y, w, h, s, sc, bg, fg) { rect(x, y, w, h, bg); frame(x, y, w, h, C('#152e24'));
      streetText(s, x + ((w - (s.length * 4 * sc - sc)) >> 1), y + ((h - 5 * sc) >> 1), sc, fg); }
  function streetPoleX(i) { var y = HZ + Math.round(GH * 0.17); return i < 3 ? STREET_POLES[i] * W : seam(y) - mpx(STREET_PW + STREET_RW + 2.2, y) - u(6); }
  function streetLamp(i) { var y = HZ + Math.round(GH * 0.17), m = mpx(1, y), sx = Math.round(streetPoleX(i) - camX), top = y - Math.round(8.5 * m);
      var k, w, x0, lit = t < 0.10 + hash(i * 7 + 3) * 0.08, hx, hy, hw, hh, R, dx, dy, d, e, yy, xx, cx; if (sx < -u(50) || sx > W + u(50)) return;
      var mid = C('#9aa3a6'), dk = C('#6d777b'), hi = C('#b3b8b2'), ink = C('#4a555e'), glow = CR('#dfe6ea'); for (k = top; k <= y; k++) {
      w = Math.max(3, Math.round((0.17 + 0.12 * (k - top) / (y - top)) * m)); x0 = sx - (w >> 1); hline(x0, x0 + w - 1, k, mid); px(x0, k, ink); px(x0 + 1, k, dk);
      px(x0 + w - 1, k, hi); } w = Math.round(0.36 * m) | 1; k = Math.round(0.45 * m); rect(sx - (w >> 1), y - k, w, k, dk);
      hline(sx - (w >> 1), sx + (w >> 1), y - k, mid); hline(sx - (w >> 1) - 1, sx + (w >> 1) + 1, y, ink); hx = sx - Math.round(1.0 * m);
      hy = top - Math.round(0.6 * m); limb(sx, top + 3, sx - 1, top - Math.round(0.35 * m), 4, 3, mid, hi);
      limb(sx - 1, top - Math.round(0.35 * m), hx + 2, hy, 3, 3, mid, hi); hw = Math.round(0.62 * m); hh = Math.max(3, Math.round(0.16 * m)); cx = hx - (hw >> 1) + 2;
      rect(hx - hw + 2, hy - 1, hw, hh, hi); hline(hx - hw + 4, hx, hy - 2, C('#cfd6d8')); hline(hx - hw + 2, hx + 1, hy + hh - 2, dk);
      hline(hx - hw + 3, hx, hy + hh - 1, lit ? CR('#f6f4ea') : ink); if (!lit) return; if (hx + 1 < 0 || hx - hw + 2 >= W) return;
      for (dy = 0; dy < 3; dy++) for (dx = -dy - 1; dx < hw + dy - 2; dx++) if (BAY[(dy & 3) * 4 + (dx & 3)] < 7 - dy * 3) px(hx - hw + 3 + dx, hy + hh + dy, glow);
      for (yy = y - u(1.6); yy <= KERB + u(1); yy++) { e = 1 - Math.abs(yy - y - u(0.4)) / u(2.4); if (e <= 0) continue; w = Math.round(u(13) * Math.sqrt(e));
      for (xx = cx - w; xx <= cx + w; xx++) if (BAY[(yy & 3) * 4 + ((xx + camX) & 3)] < e * (1 - Math.abs(xx - cx) / (w + 1)) * 5) px(xx, yy, CR('#b3b8b2')); } }
  function streetStop() { var y = HZ + Math.round(GH * 0.185), m = mpx(1, y), sx = sxOf(streetPoleWX(), 1), top = y - Math.round(3.0 * m), k;
      var sw = Math.max(8, Math.round(0.42 * m)) | 1, sh = Math.max(8, Math.round(0.75 * m)), x0 = sx - (sw >> 1), rh = Math.round(sh * 0.4);
      var red = C('#d9584f'), wht = C('#f6f4ea'); if (sx < -u(10) || sx > W + u(10)) return; vline(sx - 1, top + 2, y, C('#6d777b'));
      vline(sx, top + 2, y, C('#9aa3a6')); vline(sx + 1, top + 2, y, C('#4a555e')); hline(sx - 2, sx + 2, y, C('#4a555e'));
      frame(x0 - 1, top - 1, sw + 2, sh + 2, C('#6d777b')); rect(x0, top, sw, sh, wht); rect(x0, top, sw, rh, red);
      streetText('TTC', x0 + ((sw - 11) >> 1), top + ((rh - 5) >> 1), 1, wht); k = top + rh + 2; rect(x0 + 2, k, sw - 4, 4, red);
      hline(x0 + 3, x0 + sw - 4, k + 1, wht); px(x0 + 3, k + 4, C('#26292d')); px(x0 + sw - 4, k + 4, C('#26292d'));
      streetText('501', x0 + ((sw - 11) >> 1), k + 6, 1, red); }
  function streetText(s, x, y, sc, c) { var n, gx, gy, b; for (n = 0; n < s.length; n++) {
      b = s.charAt(n) === 'N' ? '101111111111101' : STREET_FONT[s.charAt(n)];
      if (b) for (gy = 0; gy < 5; gy++) for (gx = 0; gx < 3; gx++) if (b.charCodeAt(gy * 3 + gx) === 49) rect(x + n * 4 * sc + gx * sc, y + gy * sc, sc, sc, c); } }
  function streetWire() { return streetPath(KERB + Math.round((STREET_TR[0] + STREET_TR[1]) / 2 * RH), (STREET_TO[0] + STREET_TO[1]) / 2, STREET_TC[0]); }
  function streetWireY(P, x) { var y0 = Math.round(P.yr - mpx(5.6, P.yr)), d = Math.round(0.9 * (P.yr - HZ - Math.round(GH * 0.17))), a = -0.18 * W - camX - d,
      b = a, i, f; for (i = 0; i <= 3; i++) { b = i < 3 ? STREET_POLES[i] * W - camX - d : P.xs; if (x < b) break; a = b; } if (i > 3 || b <= a) return y0;
      f = cl01((x - a) / (b - a)); return y0 + Math.round(u(1.1) * 4 * f * (1 - f)); }
  function streetOverhead() { var P = streetWire(), ly = HZ + Math.round(GH * 0.17), lm = mpx(1, ly), wc = C('#26292d'), arm = C('#4a555e'),
      armHi = C('#9aa3a6'), ins = C('#b3b8b2'); var x, y, g, prev = -1e9, x1 = Math.min(W - 1, Math.floor(P.S) - 2), i, sx, bx, be, wy, s, cx, cy, k, aw;
      for (x = 0; x <= x1; x++) { if (x <= P.xs) y = streetWireY(P, x); else { g = streetPathY(P, x); if (g <= HZ + 1) break; y = Math.round(g - mpx(5.6, g));
      } if (prev > -1e9 && Math.abs(y - prev) > 1) vline(x, Math.min(y, prev) + 1, Math.max(y, prev) - 1, wc); px(x, y, wc); prev = y; } for (i = 0; i < 3; i++) {
      sx = Math.round(STREET_POLES[i] * W - camX); if (sx < -u(20) || sx > W + u(60)) continue; bx = sx - Math.round(0.9 * (P.yr - ly)); wy = streetWireY(P, bx);
      be = wy - Math.round(mpx(0.35, P.yr)); g = ly - Math.round(6.1 * lm); k = ly - Math.round(7.3 * lm); aw = Math.max(1, Math.round(mpx(0.07, be)));
      limb(sx - 2, g, bx, be, Math.max(1, Math.round(mpx(0.07, g))), aw, arm, armHi);
      limb(sx - 1, g, bx + 1, be, Math.max(1, Math.round(mpx(0.07, g))), aw, arm, armHi);
      limb(sx - 2, k, bx + 1, be, Math.max(1, Math.round(mpx(0.07, k))), aw, arm, armHi); aw = Math.max(1, Math.round(mpx(0.08, ly))); rect(sx - 4, g, 8, aw, arm);
      hline(sx - 4, sx + 3, g, armHi); rect(sx - 4, k, 8, aw, arm); hline(sx - 4, sx + 3, k, armHi); vline(bx, be, wy - 1, arm);
      px(bx - 1, be + ((wy - be) >> 1), ins); px(bx + 1, be + ((wy - be) >> 1), ins); } sx = Math.round(streetPoleX(3) - camX); if (sx > -u(200) && sx < W + u(200)) {
      g = ly - Math.round(6.1 * lm); for (k = 0; k < 3; k++) { s = 0.15 + k * 0.4; cx = (1 - s) * (1 - s) * P.xs + 2 * s * (1 - s) * P.xc + s * s * P.xe;
      cy = P.yr + s * s * (P.ye - P.yr); limb(sx - 2, g, Math.round(cx), Math.round(cy - mpx(5.6, cy)) - 1, Math.max(1, Math.round(mpx(0.07, g))), Math.max(1,
      Math.round(mpx(0.07, cy))), arm, armHi); } aw = Math.max(1, Math.round(mpx(0.08, ly))); rect(sx - 4, g, 8, aw, arm); hline(sx - 4, sx + 3, g, armHi); } }
  function streetcar() { var S = tramSchedule(clock), m = S.m1, L = Math.round(28 * m); if (S.off > 0 && camX > S.gateCam) return;
      var xr = sxOf(0.70 * W + S.off, 1), xf = xr - L; if (xf > W + u(40) || xr < -u(40)) return;
      var yb = KERB + Math.round(STREET_TR[1] * RH), x, y, k, j, h, a, b, r, c, n, x0, x1, pw, slv, xc;
      var red = C('#d9584f'), red2 = C('#b34a3a'), red3 = C('#7e3226'), blk = C('#26292d'), blk2 = C('#1d252b');
      var gry = C('#9aa3a6'), gry2 = C('#6d777b'), gry3 = C('#cfd6d8'), tread = C('#33373b');
      var ySk = yb - Math.round(0.30 * m), yW0 = yb - Math.round(0.98 * m), yW1 = yb - Math.round(2.55 * m), yRf = yb - Math.round(3.36 * m),
      yTop = yb - Math.round(3.84 * m); var ycab = yb - Math.round(2.95 * m), xcab = xf + Math.round(2.1 * m), SEC = [0, 0.25, 0.375, 0.625, 0.75, 1];
      rect(xf + Math.round(0.4 * m), ySk + 1, L - Math.round(0.8 * m), yb - ySk - 1, blk2); r = Math.round(0.33 * m); slv = Math.max(2, Math.round(0.10 * m));
      for (k = 0; k < 3; k++) { c = xf + Math.round([0.13, 0.5, 0.87][k] * L);
      rect(c - Math.round(1.5 * m), ySk + 1, Math.round(3.0 * m), Math.max(1, yb - ySk - slv - 1), blk); for (j = -1; j <= 1; j += 2) {
      a = c + j * Math.round(0.95 * m); for (y = yb - slv; y < yb; y++) { n = r * r - (y - yb + r) * (y - yb + r); if (n < 0) continue;
      h = Math.round(Math.sqrt(n) * 0.6); hline(a - h, a + h, y, tread); } } } for (y = yRf; y <= ySk; y++) { h = (yb - y) / m;
      a = xf + Math.round((h < 0.55 ? (0.55 - h) * 0.3 : h < 1.05 ? 0 : h < 2.85 ? (h - 1.05) / 1.8 * 0.62 : 0.62 + (h - 2.85) / 0.43 * 0.6) * m);
      b = xr - Math.round((h < 1.4 ? 0 : h < 2.9 ? (h - 1.4) / 1.5 * 0.1 : 0.1 + (h - 2.9) / 0.38 * 0.32) * m);
      hline(a, b, y, y >= yW1 && y <= yW0 ? blk : y > ySk - 3 ? red2 : red); if (y >= ycab && y <= yW0) {
      xc = y >= yW1 ? b : Math.round(xcab + (b - xcab) * (y - ycab) / (yW1 - ycab)); hline(a, xc, y, blk); } px(b, y, red3);
      } hline(xf + Math.round(1.25 * m), xr - Math.round(0.42 * m), yRf, red2); hline(xf + Math.round(0.2 * m), xr - 2, yb - Math.round(0.86 * m), C('#cf6250'));
      for (y = ycab + 2; y < ycab + Math.round(0.9 * m); y++) { h = (yb - y) / m; a = xf + Math.round((h - 1.05) / 1.8 * 0.62 * m) + 3;
      for (x = a; x < xcab - 3; x++) if (BAY[((y - yb) & 3) * 4 + ((x - xf) & 3)] < 4 - (y - ycab) * 0.1 - (x - a) * 0.04) px(x, y, C('#3d4a63'));
      } var opY = ycab + Math.round(0.62 * m), opA = xf + Math.round((( (yb - opY) / m - 1.05) / 1.8 * 0.62) * m) + 3;
      var opX = Math.min(xcab - Math.round(0.55 * m), opA + Math.round(0.55 * m)), opR = Math.max(2, Math.round(0.16 * m)), opDk = C('#181b1e');
      disc(opX, opY, opR, opDk); rect(opX - Math.round(opR * 1.3), opY + opR - 1, Math.round(opR * 2.6), Math.round(opR * 1.1), opDk);
      var bw = Math.max(3, Math.round(0.34 * m)); for (k = 1; k < 5; k++) { c = xf + Math.round(SEC[k] * L) - (bw >> 1); rect(c, yRf + 1, bw, ySk - yRf, blk2);
      for (y = yRf + 3; y < ySk; y += 3) hline(c, c + bw - 1, y, C('#4a555e')); vline(c - 1, yRf, ySk, red3); vline(c + bw, yRf, ySk, red3);
      } var p0 = yb - Math.round(2.45 * m), p1 = yb - Math.round(1.08 * m), post = Math.round(0.2 * m), pwant = Math.round(1.3 * m), seed = 0;
      for (k = 0; k < 5; k++) { x0 = xf + Math.round(SEC[k] * L) + (k ? (bw >> 1) + Math.round(0.35 * m) : Math.round(2.45 * m));
      x1 = xf + Math.round(SEC[k + 1] * L) - (k < 4 ? (bw >> 1) + Math.round(0.35 * m) : Math.round(0.9 * m));
      n = Math.max(1, Math.round((x1 - x0 + post) / (pwant + post))); pw = (x1 - x0 - (n - 1) * post) / n;
      for (j = 0; j < n; j++) streetCarPane(Math.round(x0 + j * (pw + post)), p0, Math.round(pw), p1 - p0, seed++, k === 0 && j === 0);
      } for (y = yRf - 2; y < yRf; y++) hline(xf, xr, y, gry2); var pods = [[0.035, 0.225], [0.405, 0.595], [0.775, 0.965]]; for (k = 0; k < 3; k++) {
      a = xf + Math.round(pods[k][0] * L); b = xf + Math.round(pods[k][1] * L); for (y = yTop; y < yRf; y++) { j = Math.max(0, 3 - (y - yTop)) * 3;
      hline(a + j, b - j, y, y < yTop + 3 ? gry3 : gry); } hline(a + 9, b - 9, yTop, sunE > u(9) ? C('#f6f4ea') : gry3); hline(a + 1, b - 1, yRf - 1, gry2);
      hline(a + 1, b - 1, yRf - 2, gry2); } var P = streetWire(), pc = xf + Math.round(0.5 * L), hc = pc - Math.round(0.15 * m), wy = streetWireY(P, hc),
      yB = yTop - Math.round(0.2 * m); var hx0 = pc - Math.round(0.75 * m), kx = pc + Math.round(0.9 * m), ky = Math.round(yB - (yB - wy) * 0.42), st = C('#6d777b'),
      st2 = C('#9aa3a6'); for (k = -1; k <= 1; k += 2) { rect(pc + k * Math.round(0.6 * m) - 1, yB + 1, 3, yTop - yB - 1, gry3);
      hline(pc + k * Math.round(0.6 * m) - 2, pc + k * Math.round(0.6 * m) + 2, yB + 3, gry2); } hline(pc - Math.round(0.95 * m), pc + Math.round(0.95 * m), yB, blk);
      hline(pc - Math.round(0.95 * m), pc + Math.round(0.95 * m), yB - 1, st); limb(hx0, yB - 2, kx, ky, 2, 2, st, 0); limb(hx0, yB - 1, kx, ky + 1, 1, 1, blk, 0);
      limb(hx0 + Math.round(0.35 * m), yB - 1, kx - 2, ky + 2, 1, 1, st2, 0); rect(hx0 - 3, yB - 5, 6, 4, blk); rect(kx - 1, ky - 1, 3, 3, blk);
      limb(kx, ky, hc, wy + 4, 2, 2, st, 0); limb(kx, ky + 1, hc + 1, wy + 5, 1, 1, blk, 0); k = Math.round(0.2 * m); hline(hc - k, hc + k, wy + 1, blk);
      hline(hc - k + 1, hc + k - 1, wy + 2, st); px(hc - k - 1, wy + 2, blk); px(hc + k + 1, wy + 2, blk); px(hc - k - 2, wy + 3, blk); px(hc + k + 2, wy + 3, blk);
      px(hc - k - 3, wy + 4, blk); px(hc + k + 3, wy + 4, blk); rect(hc - 1, wy + 3, 3, 3, blk); y = yb - Math.round(0.8 * m);
      rect(xf + 1, y - 2, Math.max(3, Math.round(0.12 * m)), 4, CR('#f6f4ea')); px(xf, y - 1, CR('#dfe6ea')); px(xf, y, CR('#dfe6ea'));
      rect(xr - Math.round(0.14 * m) - 2, yb - Math.round(1.2 * m), Math.round(0.14 * m), Math.max(3, Math.round(0.16 * m)), CR('#cf6250'));
      hline(xr - Math.round(0.5 * m), xr - Math.round(0.2 * m), yb - Math.round(3.1 * m), CR('#cf6250'));
      px(xf + Math.round(1.3 * m), yb - Math.round(3.15 * m), CR('#f4ac6b')); }
  function streetCarPane(x, y, w, h, s, sign) {
      var mm = h / 1.37, sb = y + Math.round(h * 0.6), hx, k, c, hw = Math.max(3, Math.round(0.16 * mm)), hh = Math.max(4, Math.round(0.22 * mm));
      rect(x, y, w, h, CR('#9aa3a6')); hline(x, x + w - 1, y + 1, CR('#f6f4ea')); hline(x, x + w - 1, y + 2, CR('#dfe6ea'));
      rect(x, sb, w, y + h - sb, CR('#4a555e')); hline(x, x + w - 1, sb, CR('#6d777b')); for (k = 0; k < 2; k++) { if (hash(s * 13 + k * 7 + 3) > 0.42) continue;
      hx = x + 3 + Math.round(hash(s * 13 + k * 7 + 4) * (w - hw - 10)); c = CR(['#1f3f2c', '#3d4a63', '#7e3226', '#33251a', '#51565c'][(s + k) % 5]);
      rect(hx - 2, sb - Math.round(0.12 * mm), hw + 5, Math.round(0.12 * mm), c); rect(hx, sb - Math.round(0.12 * mm) - hh, hw, hh, CR('#33251a'));
      px(hx, sb - Math.round(0.12 * mm) - hh, CR('#9aa3a6')); px(hx + hw - 1, sb - Math.round(0.12 * mm) - hh, CR('#9aa3a6'));
      vline(hx, sb - Math.round(0.12 * mm) - hh + 3, sb - Math.round(0.12 * mm) - 2, CR('#a27850')); } if (sign && w > 38) { rect(x, y, w, 9, CR('#1d252b'));
      streetText('501 QUEEN', x + ((w - 35) >> 1), y + 2, 1, CR('#f4ac6b')); } }
  function tramSchedule(clock) { var cy = KERB + Math.round(0.09 * RH), m1 = mpx(1, cy), run = TRAM_RUN * m1, carL = Math.round(28 * m1);
      var ph = ((clock + TRAM_PH0) % TRAM_CYC + TRAM_CYC) % TRAM_CYC, off, door = 0, f, loc; if (ph < TRAM_TA) { f = 1 - ph / TRAM_TA; off = run * f * f;
      } else if (ph < TRAM_TA + TRAM_TD) { loc = ph - TRAM_TA; off = 0;
      door = loc < TRAM_DOOR ? loc / TRAM_DOOR : loc > TRAM_TD - TRAM_DOOR ? Math.max(0, (TRAM_TD - loc) / TRAM_DOOR) : 1;
      } else if (ph < TRAM_TA + TRAM_TD + TRAM_TD2) { f = (ph - TRAM_TA - TRAM_TD) / TRAM_TD2; off = -run * f * f; } else off = -run; return {
      ph: ph, off: off, door: door, cy: cy, m1: m1, run: run, sinceClose: ph - (TRAM_TA + TRAM_TD), gateCam: 0.70 * W + run - carL - (W + 40) }; }
  function tramSedanOff(S) { if (S.sinceClose < 0) return S.off;
      var sc = S.sinceClose - TRAM_SEDAN_WAIT, run = TRAM_SEDAN_RUN * S.m1, v0 = TRAM_SEDAN_V0 * S.m1, f; if (sc < 0) return 0; if (sc < TRAM_SEDAN_RT) {
      f = sc / TRAM_SEDAN_RT; return -run * f * f; } return -run - v0 * (sc - TRAM_SEDAN_RT); }
  function tramSedanBrake(S) { return S.sinceClose < TRAM_SEDAN_WAIT; }
  function tramCyclistOff(S) { if (S.sinceClose < 0) return S.off;
      var sc = S.sinceClose - TRAM_CYCL_WAIT, run = TRAM_CYCL_RUN * S.m1, v0 = TRAM_CYCL_V0 * S.m1, f; if (sc < 0) return 0; if (sc < TRAM_CYCL_RT) {
      f = sc / TRAM_CYCL_RT; return -run * f * f; } return -run - v0 * (sc - TRAM_CYCL_RT); }
  function tramXCarOff(S) { if (S.sinceClose < 0) return S.off; var sc = S.sinceClose - TRAM_XCAR_WAIT, run = TRAM_XCAR_RUN * S.m1, v0 = TRAM_XCAR_V0 * S.m1, f;
      if (sc < 0) return 0; if (sc < TRAM_XCAR_RT) { f = sc / TRAM_XCAR_RT; return -run * f * f; } return -run - v0 * (sc - TRAM_XCAR_RT); }
  function tramWheel(cx, cy, r, tire, rim, hub) { var y, h, th = Math.max(1, Math.round(r * 0.3)), h2; for (y = -r; y <= r; y++) {
      h = Math.round(Math.sqrt(Math.max(0, r * r - y * y))); if (h <= th) { hline(cx - h, cx + h, cy + y, tire); continue;
      } hline(cx - h, cx - h + th - 1, cy + y, tire); hline(cx + h - th + 1, cx + h, cy + y, tire); h2 = h - th; if (h2 > 0) { px(cx - h2, cy + y, rim);
      px(cx + h2, cy + y, rim); } } px(cx, cy, hub); }
  function pgGatePier(k) { var E = 2.5 * W, G = PG_GATE; var fy = HZ + Math.round(E / G[k][0]), mm = (fy - HZ) / 2.5; if (fy >= H) return;
      var ph = Math.round(mm * 2.2), fw = Math.max(3, Math.round(mm * 0.55)), ct = Math.max(2, Math.round(mm * 0.14)), ov = Math.max(1, Math.round(mm * 0.05));
      var ax = seam(fy) - camX + mm * 0.075; if (k === 1) { var fy0 = HZ + Math.round(E / G[0][0]), mm0 = (fy0 - HZ) / 2.5, ax0 = seam(fy0) - camX + mm0 * 0.075;
      var minGap = Math.max(u(3), Math.round((ax - ax0) * 0.3)); fw = Math.max(3, Math.min(fw, Math.round(ax - ax0 - minGap) + 1));
      } var fx = Math.round(ax) - fw + 1, j, n = 7, y0, y1; if (fx > W + u(12) || fx + fw < -u(12)) return;
      var face = C('#877d72'), joint = C('#6d777b'), dk = C('#51565c'), lit = C('#9aa3a6'), capc = C('#b3b8b2'); rect(fx, fy - ph, fw, ph + 1, face);
      for (j = 0; j < n; j++) { y0 = fy - ph + Math.round(ph * j / n); y1 = fy - ph + Math.round(ph * (j + 1) / n); if (j) hline(fx, fx + fw - 1, y0, joint);
      vline(fx + Math.round(fw * (j & 1 ? 0.34 : 0.66)), y0, y1, joint); } vline(fx, fy - ph, fy, dk); vline(fx + fw - 1, fy - ph, fy, lit);
      rect(fx - ov, fy - ph - ct, fw + 2 * ov, ct, lit); hline(fx - ov, fx + fw + ov - 1, fy - ph - ct, capc);
      hline(fx + ov, fx + fw - ov - 1, fy - ph - ct - 1, capc); hline(fx, fx + fw - 1, fy - ph, dk); }
  function pgSpurFix() { if (PG_SCR.spfw === W && PG_SCR.spfh === H) return; PG_SCR.spfw = W; PG_SCR.spfh = H;
      var E = 2.5 * W, gy = HZ + Math.round(E / ((PG_GATE[0][1] + PG_GATE[1][0]) / 2)), jy = HZ + Math.round(GH * 0.34);
      var gx = Math.round(seam(gy)), jx = Math.round(pgPathCx(0.34)), L = Math.max(1, jx - gx), ch = u(2), elw = PG_SCR.elw;
      var SP = PG_SCR.spur, n = SP.length >> 2, pk, j, f, yc, tv, wa, t0 = 0, t1 = 0, b0 = 0, b1 = 0, k, y0, y1, h1, s, r, rr, minE, safe;
      for (pk = -1e9, j = 0; j < n; j++) { f = j / L; f = 1 - (1 - f) * (1 - f); yc = gy + (jy - gy) * f; tv = Math.max(2, mpx(1.8, yc)); wa = Math.min(2, tv * 0.12);
      f = j / ch; k = f | 0; f -= k; if (k !== pk) { t0 = hash(k * 7 + 3); t1 = hash((k + 1) * 7 + 3); b0 = hash(k * 11 + 5); b1 = hash((k + 1) * 11 + 5); pk = k;
      } y0 = Math.round(yc - tv / 2 + (t0 + (t1 - t0) * f - 0.5) * 2 * wa); y1 = Math.min(H - 2, Math.round(yc + tv / 2 + (b0 + (b1 - b0) * f - 0.5) * 2 * wa) - 1);
      s = Math.max(y0, Math.floor(HZ + (ST - gx - j) / 0.9) + 1); h1 = hash(j * 13 + 1); r = h1 > 0.6 && y1 >= y0 ? y0 + ((h1 * 9973) | 0) % (y1 - y0 + 1) : -1;
      SP[j * 4] = s; SP[j * 4 + 1] = y1; SP[j * 4 + 2] = r >= s ? r : -1; minE = 1e9; for (rr = s; rr <= y1; rr++) if (elw[rr] < minE) minE = elw[rr];
      safe = (gx + j) < minE - 2 ? 8 : 0; SP[j * 4 + 3] = (h1 > 0.82 ? 1 : 0) | (s === y0 && ((h1 * 64) | 0) & 3 ? 2 : 0) | (((h1 * 256) | 0) & 3 ? 4 : 0) | safe; } }
  function pgFlowerShade() { pgBuild(); var D = PG_SCR.drift; if (!D || D.xb - camX < 0 || D.xa - camX >= W) return;
      var nh = D.nh, xm = D.xm - camX, T = D.t, B = D.b, n = D.nb * nh, j, c, x, bb;
      var c0 = Math.max(0, ((-xm) >> 1) - 1), c1 = Math.min(nh - 1, ((W - xm) >> 1) + 1); if (!PG_SCR.fbx || PG_SCR.fbx.length < nh) PG_SCR.fbx = new Int32Array(nh);
      var bx = PG_SCR.fbx; for (c = c0; c <= c1; c++) bx[c] = -1; for (j = 0; j < n; j += nh) for (c = c0; c <= c1; c++) { if (T[j + c] > B[j + c]) continue;
      if (B[j + c] > bx[c]) bx[c] = B[j + c]; } for (c = c0; c <= c1; c++) { bb = bx[c]; if (bb < 0) continue; x = xm + 2 * c; if (x >= 0 && x < W) {
      shade(x, bb + 1, 0.30); shade(x, bb + 2, 0.14); } x++; if (x >= 0 && x < W) { shade(x, bb + 1, 0.30); shade(x, bb + 2, 0.14); } } }
  function wallgate() { var stone = C('#6d777b'), stone2 = C('#877d72'), joint = C('#51565c'), capc = C('#b3b8b2'), capd = C('#9aa3a6');
      var iron = C('#26292d'), glint = C('#4a555e'), side = C('#9aa3a6');
      var E = 2.5 * W, G = PG_GATE, g00 = G[0][0], g01 = G[0][1], g10 = G[1][0], g11 = G[1][1], m12 = u(12);
      var done0 = 0, done1 = 0, y, sx, dy, mm, dd, wh, top, th, ct, c1, sid, sid2, psid = -1, psid2 = -1, lj = -9, lj2 = -9;
      var pbid = -1, lb = -9, k, j, ph, x, rt, xc, bw, rh, ja, jb; for (y = HZ + 1; y < H; y++) { dy = y - HZ; mm = dy / 2.5; dd = E / dy;
      sx = Math.round(seam(y) - camX); th = Math.round(mm * 0.40); if (sx < -th - m12 || sx > W + m12) continue; if (!done1 && dd < g10) { pgGatePier(1); done1 = 1;
      } if (!done0 && dd < g00) { pgGatePier(0); done0 = 1; } if ((dd >= g00 && dd <= g01) || (dd >= g10 && dd <= g11)) { ph = Math.round(mm * 2.2);
      x = sx + Math.round(mm * 0.075); vline(x, y - ph, y, side); for (j = 1; j < 7; j++) px(x, y - ph + Math.round(ph * j / 7), stone);
      vline(x, y - ph - Math.max(2, Math.round(mm * 0.14)), y - ph - 1, capc); continue; } if (dd > g01 && dd < g10) continue;
      wh = Math.max(2, Math.round(mm * 0.70)); ct = Math.max(1, Math.round(mm * 0.08)); top = y - wh; c1 = top + (wh >> 1); sid = Math.floor(dd / 1.1);
      sid2 = Math.floor(dd / 1.1 + 0.5); ja = jb = false; if (sid !== psid) { if (y - lj >= 3) { ja = true; lj = y; } psid = sid; } if (sid2 !== psid2) {
      if (y - lj2 >= 3) { jb = true; lj2 = y; } psid2 = sid2; } hline(sx - th, sx, top - ct, capc); if (sx >= 0 && sx < W) { vline(sx, top - ct, top, capd);
      vline(sx, top + 1, c1 - 1, ja ? joint : hash(sid * 31 + 1) < 0.4 ? stone2 : stone); buf[c1 * W + sx] = joint;
      vline(sx, c1 + 1, y - 1, jb ? joint : hash(sid2 * 31 + 2) < 0.4 ? stone2 : stone); buf[y * W + sx] = jb ? joint : glint; } rh = Math.round(mm * 0.9);
      xc = sx - (th >> 1); rt = top - ct - rh; bw = Math.max(1, Math.round(mm * 0.02)); if (xc >= 0 && xc < W) {
      vline(xc, rt, rt + Math.max(1, Math.round(mm * 0.03)) - 1, iron); buf[(top - ct - Math.max(2, Math.round(mm * 0.10))) * W + xc] = iron;
      } k = Math.floor(dd / 0.13); if (k !== pbid && y - lb >= 3) { for (j = 0; j < bw; j++) vline(xc + j, rt, rt + rh - 1, iron); px(xc, rt - 1, glint); lb = y;
      } pbid = k; } }  function pgBlades(j) { var BK = PG_SCR.bk, BR = PG_SCR.brow, bg = PG_SCR.bg, bd = PG_SCR.bd, bt = PG_SCR.bt, y = BR[j], bs = BR[j + 1],
      fl = BR[j + 2], base = BR[j + 3] + 1, bi = fl & 7;
      var i = Math.floor((Math.max(0, Math.round(seam(y) - camX) - 2) + camX) / bs) - 1, i1 = Math.ceil((camX + W) / bs), v, x, o, cv, k, a, b, h, h2, t0, q;
      for (; i <= i1; i++) { v = BK[base + i]; if (!v) continue; if (!(v & 0x40000000)) { px(i * bs - camX, y - 1, v & 0x10000000 ? PG_SCR.wf : PG_SCR.wf2); continue;
      } x = i * bs - camX + (v & 63); if (x < 6 || x > W - 7) continue; o = (y + ((v >> 6) & 31)) * W + x; cv = buf[o];
      k = cv === bg[bi] ? bi : bi < 4 && cv === bg[bi + 1] ? bi + 1 : bi > 0 && cv === bg[bi - 1] ? bi - 1 : bi; a = bd[k]; b = bt[k]; h = (v >> 11) & 31;
      for (q = o - (h - 1) * W; q <= o; q += W) buf[q] = a; buf[o - h * W + ((v >> 16) & 1)] = b; if (!(fl & 8)) continue; h2 = (h * 3) >> 2;
      for (t0 = 0; t0 < h2; t0++) buf[o - t0 * W - 1 - (t0 >> 2)] = a; buf[o - h2 * W - 1 - (h2 >> 2)] = (v >> 17) & 1 ? b : a; if (!((v >> 18) & 1)) continue;
      h2 = (h * 5) >> 3; for (t0 = 0; t0 < h2; t0++) buf[o - t0 * W + 1 + (t0 >> 2)] = a; buf[o - h2 * W + 1 + (h2 >> 2)] = b; } }  function pgEdge(i, ye, amp, z) {
      var OF = PG_SCR.ofw, SO = PG_SCR.so, of = i * PG_SCR.ofn, c0 = PG_SCR.bg[i], c1 = PG_SCR.bg[i + 1], W4 = 4 * W, x, wx, e, q, s, yy, o;
      for (x = Math.max(0, Math.round(seam(ye + 2 * amp + z + 1) - camX) - 2); x < W; x++) { wx = x + camX; e = ye + OF[of + (wx >> 2)]; q = i * 16 + ((wx & 3) << 2);
      s = e + SO[q]; if (s < ye) for (yy = s + ((0 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((0 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0; s = e + SO[q + 1];
      if (s < ye) for (yy = s + ((1 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((1 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0; s = e + SO[q + 2];
      if (s < ye) for (yy = s + ((2 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((2 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0; s = e + SO[q + 3];
      if (s < ye) for (yy = s + ((3 - s) & 3), o = yy * W + x; yy < ye; yy += 4, o += W4) buf[o] = c1;
      else for (yy = ye + ((3 - ye) & 3), o = yy * W + x; yy < s; yy += 4, o += W4) buf[o] = c0; } }  function pgDrift() {
      var y0 = HZ + Math.round(GH * 0.40), y1 = HZ + Math.round(GH * 0.54), el = PG_SCR.elw, m = u(3), wa = u(3), xa = 1e9, xb = -1e9, gy, uu, k, f, n, le, re;
      var FL = new Int32Array(y1 - y0 + 1); for (gy = y0; gy <= y1; gy++) { uu = (gy - HZ) / GH; re = el[gy] - m; k = Math.floor(gy / 6); f = gy / 6 - k;
      f = f * f * (3 - 2 * f); n = hash(k * 7 + 77); n += (hash((k + 1) * 7 + 77) - n) * f;
      le = re - Math.round(0.08 * W * uu / 0.43) + Math.round((n - 0.5) * 2 * u(4)); FL[gy - y0] = le; if (le < xa) xa = le; if (re > xb) xb = re; } xb += 3 * wa;
      var xm = xa - (xa & 1), nh = ((xb - xm) >> 1) + 2, nb = 0, g0 = y1 - ((y1 - y0) % 3); for (gy = g0; gy >= y0; gy -= 3) nb++;
      var hz = new Int32Array(nh), ot = new Int32Array(nh), DT = new Int16Array(nb * nh), DB = new Int16Array(nb * nh), DO = new Int32Array(nb * nh),
      SL = new Int32Array(4096); hz.fill(1e9); DT.fill(32767);
      var sp = u(2), wc = u(5), ns = 0, bo = 0, cw, kn, pk, pw, na = 0, nb2 = 0, wn0 = 0, wn1 = 0, cl, xt, hc, mh, top, lim, b, c, x, x0, x1, tw, tp, fw, kw, wn;
      var gx, ga, gb, bs, ph, hx, hy, j, sps, hb, nn; for (gy = g0; gy >= y0; gy -= 3, bo += nh) { f = (gy - y0) / (y1 - y0);
      tw = Math.min(1, 0.35 + Math.min(f, 1 - f) * 3.25); tp = mpx(0.35, gy) * tw; le = FL[gy - y0]; re = el[gy] - m; cw = Math.max(4, Math.round(mpx(0.3, gy)));
      fw = mpx(0.8, gy); pk = pw = -1e9; x0 = Math.max(xm, le); x0 -= x0 & 1; x1 = Math.min(xb, el[gy - 2] - m + 3 * wa); for (x = x0; x <= x1; x += 2) {
      c = (x - xm) >> 1; kw = Math.floor(x / wc); if (kw !== pw) { wn0 = hash(kw * 37 + 11); wn1 = hash((kw + 1) * 37 + 11); pw = kw; } f = x / wc - kw;
      f = f * f * (3 - 2 * f); f = wn0 + (wn1 - wn0) * f; wn = (f - 0.5) * 2 * wa + (f > 0.75 ? (f - 0.75) * 8 * wa : 0); b = gy + 1;
      while (b >= gy - 2 && x > el[b] - m + wn) b--; if (b < gy - 2) { ot[c] = 1e9; continue; } kn = Math.floor(x / cw); if (kn !== pk) { na = hash(kn * 53 + gy * 7);
      nb2 = hash((kn + 1) * 53 + gy * 7); pk = kn; } f = x / cw - kn; f = f * f * (3 - 2 * f); cl = na + (nb2 - na) * f; xt = Math.min(1, 0.2 + 0.8 * (x - le) / fw);
      hc = hash(x * 13 + gy * 7); mh = Math.round(tp * xt * (0.30 + cl * 0.70 + hc * 0.20)); top = gy - mh; if (top > b) { ot[c] = 1e9; continue; } ot[c] = top;
      lim = hz[c]; if (top >= lim) continue; if (b >= lim) b = lim - 1; DT[bo + c] = top; DB[bo + c] = b; DO[bo + c] = (hc * 1048576) | 0;
      } bs = Math.max(3, Math.round(mpx(0.06, gy))); ga = Math.ceil(le / sp); gb = Math.floor(re / sp); for (gx = ga; gx <= gb; gx++) {
      if (hash(gx * 23 + gy * 19 + 1) < 0.45) continue; x = gx * sp + Math.round((hash(gx * 29 + gy * 5) - 0.5) * u(1.5)); if (x < le || x > re) continue;
      xt = Math.min(1, 0.2 + 0.8 * (x - le) / fw); if (hash(gx * 31 + gy) > xt) continue;
      sps = hash(Math.floor(gx / 7) * 7 + 11) * 0.75 + hash(gx * 7 + gy * 13 + 3) * 0.25; nn = hash(gx * 3 + gy * 11) < 0.3 ? 2 : 1; for (j = 0; j < nn; j++) {
      ph = Math.round(mpx(0.45 + hash(gx * 17 + gy * 3 + j * 5) * 0.30, gy) * tw * xt); hx = x + (j ? Math.round((hash(gx * 41 + gy + j) - 0.5) * bs * 3) : 0);
      hy = gy - ph; if (hx < x0 || hx > x1) continue; c = (hx - xm) >> 1; lim = ot[c]; if (lim > gy - 4 || xt < 0.3) continue; if (hz[c] < lim) lim = hz[c];
      hb = hy + (sps < 0.62 ? 1 : sps < 0.76 ? 2 : bs + 1); if (hb >= lim - 1 || ns > SL.length - 4) continue; SL[ns++] = hx; SL[ns++] = hy; SL[ns++] = lim - 1;
      SL[ns++] = (sps < 0.42 ? 0 : sps < 0.62 ? 1 : sps < 0.76 ? 2 : 3) | bs << 4; } } for (x = x0; x <= x1; x += 2) { c = (x - xm) >> 1;
      if (ot[c] < hz[c]) hz[c] = ot[c]; } } PG_SCR.drift = { xa: xa, xb: xb, xm: xm, nh: nh, nb: nb, t: DT, b: DB, o: DO, sl: SL, ns: ns }; }  function pgBuild() {
      if (PG_SCR.kw === W && PG_SCR.kh === H) return; PG_SCR.kw = W; PG_SCR.kh = H;
      var edges = [0.10, 0.25, 0.45, 0.70, 1], nc = W + 4, OF = PG_SCR.ofw = new Int8Array(4 * nc), SO = PG_SCR.so, LB = PG_LB;
      var i, j, k, wx, G, amp, gg, kk, ff, v, na = 0, nb = 0, nc2 = 0, nd = 0, pk, pk2, z, nz, s, y, uu, ys = 2, bs, hb, dens, bi, r, rr, n, base, h; PG_SCR.ofn = nc;
      for (i = 0; i < 4; i++) { G = 0.12 * W * (0.5 + edges[i]); amp = u(0.6) + Math.round(edges[i] * u(2.6)); pk = pk2 = -1e9;
      z = Math.max(1, Math.round(0.10 * (edges[i + 1] - edges[i]) * GH)); nz = 2 * z + 1; for (j = 0; j < 16; j++) { s = LB[BAY[(j & 3) * 4 + (j >> 2)]];
      SO[i * 16 + j] = (s === 5 ? nz : Math.max(0, Math.ceil(s * nz / 5 - 0.5))) - z; } for (k = 0; k < nc; k++) { wx = k * 4; gg = wx / G; kk = Math.floor(gg);
      if (kk !== pk) { na = hash(kk * 97 + i * 13 + 5); nb = hash((kk + 1) * 97 + i * 13 + 5); pk = kk; } ff = gg - kk; ff = ff * ff * (3 - 2 * ff);
      v = na + (nb - na) * ff; gg = wx * 5 / G; kk = Math.floor(gg); if (kk !== pk2) { nc2 = hash(kk * 89 + i * 17 + 3); nd = hash((kk + 1) * 89 + i * 17 + 3);
      pk2 = kk; } ff = gg - kk; ff = ff * ff * (3 - 2 * ff); v += (nc2 + (nd - nc2) * ff - 0.5) * 0.6; OF[i * nc + k] = Math.round((v - 0.5) * 2 * amp);
      } } for (n = 0, j = 0, y = HZ + Math.round(GH * 0.22); y < H; y += ys, n++) { uu = (y - HZ) / GH; ys = Math.max(2, Math.round(u(1) + uu * u(1.2)));
      j += Math.ceil(4 * W / Math.round(u(3) + uu * u(3))) + 4; } var BR = PG_SCR.brow = new Int32Array(n * 4), BK = PG_SCR.bk = new Uint32Array(j);
      PG_SCR.brn = n * 4; for (n = 0, base = 0, y = HZ + Math.round(GH * 0.22); y < H; y += ys, n += 4) { uu = (y - HZ) / GH;
      ys = Math.max(2, Math.round(u(1) + uu * u(1.2))); bs = Math.round(u(3) + uu * u(3)); hb = mpx(0.045 + 0.035 * uu, y); dens = Math.min(0.95, 0.45 + uu * 0.60);
      bi = uu < 0.10 ? 0 : uu < 0.25 ? 1 : uu < 0.45 ? 2 : uu < 0.70 ? 3 : 4; BR[n] = y; BR[n + 1] = bs; BR[n + 2] = bi | (uu >= 0.45 ? 8 : 0); BR[n + 3] = base;
      k = Math.ceil(4 * W / bs) + 4; for (j = 0; j < k; j++) { r = hash((j - 1) * 7 + y * 3); if (r > dens) {
      if (r > 0.9965 && uu > 0.3) BK[base + j] = 0x20000000 | (r > 0.9983 ? 0x10000000 : 0); continue; } rr = (r * 4294967296) | 0;
      if (y + ((((rr >>> 8) & 255) * ys) >> 8) >= H) continue; h = Math.min(31, Math.max(1, Math.round(hb * (0.75 + ((rr >>> 16) & 63) / 126))));
      BK[base + j] = (0x40000000 | Math.min(63,
      ((rr & 255) * bs) >> 8) | ((((rr >>> 8) & 255) * ys) >> 8) << 6 | h << 11 | ((rr >>> 22) & 1) << 16 | ((rr >>> 23) & 1) << 17 | (uu < 0.62 || (rr >>> 24) & 3 ? 0 : 1) << 18) >>> 0;
      } base += k; } var elw = PG_SCR.elw = new Int32Array(H), erw = PG_SCR.erw = new Int32Array(H), pcw = PG_SCR.pcw = new Int32Array(H), wr = u(1.5), w, sx;
      for (y = HZ + 1; y < H; y++) { uu = (y - HZ) / GH; w = pgPathW(uu); sx = Math.round(pgPathCx(uu)); r = (y / 3) | 0; pcw[y] = sx;
      elw[y] = sx - w - Math.round((hash(r * 7 + 3) - 0.5) * wr * uu); erw[y] = sx + w + Math.round((hash(r * 11 + 5) - 0.5) * wr * uu);
      } var E = 2.5 * W, gy = HZ + Math.round(E / ((PG_GATE[0][1] + PG_GATE[1][0]) / 2)), jy = HZ + Math.round(GH * 0.34);
      var gx = Math.round(seam(gy)), jx = Math.round(pgPathCx(0.34)), L = Math.max(1, jx - gx), ch = u(2), SP, f, yc, tv, wa, t0 = 0, t1 = 0, b0 = 0, b1 = 0, y0, y1,
      h1; n = Math.max(0, jx - gx + 1); SP = PG_SCR.spur = new Int16Array(n * 4); PG_SCR.spg = gx; PG_SCR.spj = jx; for (pk = -1e9, j = 0; j < n; j++) { f = j / L;
      f = 1 - (1 - f) * (1 - f); yc = gy + (jy - gy) * f; tv = Math.max(2, 1.8 * (yc - HZ) * (yc - HZ) / E); wa = Math.min(2, tv * 0.12); f = j / ch; k = f | 0;
      f -= k; if (k !== pk) { t0 = hash(k * 7 + 3); t1 = hash((k + 1) * 7 + 3); b0 = hash(k * 11 + 5); b1 = hash((k + 1) * 11 + 5); pk = k;
      } y0 = Math.round(yc - tv / 2 + (t0 + (t1 - t0) * f - 0.5) * 2 * wa); y1 = Math.min(H - 2, Math.round(yc + tv / 2 + (b0 + (b1 - b0) * f - 0.5) * 2 * wa) - 1);
      s = Math.max(y0, Math.floor(HZ + (ST - gx - j) / 0.9) + 1); h1 = hash(j * 13 + 1); r = h1 > 0.6 && y1 >= y0 ? y0 + ((h1 * 9973) | 0) % (y1 - y0 + 1) : -1;
      SP[j * 4] = s; SP[j * 4 + 1] = y1; SP[j * 4 + 2] = r >= s ? r : -1;
      SP[j * 4 + 3] = (h1 > 0.82 ? 1 : 0) | (s === y0 && ((h1 * 64) | 0) & 3 ? 2 : 0) | (((h1 * 256) | 0) & 3 ? 4 : 0); } pgDrift(); }  function pgPathRows() {
      pgBuild(); if (PG_SCR.el.length < H) { PG_SCR.el = new Int32Array(H); PG_SCR.er = new Int32Array(H); PG_SCR.pc = new Int32Array(H);
      } var el = PG_SCR.el, er = PG_SCR.er, pc = PG_SCR.pc, A = PG_SCR.elw, B = PG_SCR.erw, P = PG_SCR.pcw, y; for (y = HZ + 1; y < H; y++) { el[y] = A[y] - camX;
      er[y] = B[y] - camX; pc[y] = P[y] - camX; } }  function pgPathCx(uu) { return 2.78 * W - 0.76 * W * Math.pow(uu, 1.35) + 0.02 * W * uu;
      }  function pgPathW(uu) { return Math.max(1, Math.round(0.5 + uu * 0.075 * W)); }  function pgPier(k) {
      var fy = HZ + Math.round(2.5 * W / PG_GATE[k][0]), mm = (fy - HZ) / 2.5; if (fy >= H) return;
      var ph = Math.round(mm * 2.2), fw = Math.max(3, Math.round(mm * 0.55)), ct = Math.max(2, Math.round(mm * 0.14)), ov = Math.max(1, Math.round(mm * 0.05));
      var fx = Math.round(seam(fy) - camX + mm * 0.075) - fw + 1, j, n = 7, y0, y1; if (fx > W + u(12) || fx + fw < -u(12)) return;
      var face = C('#877d72'), joint = C('#6d777b'), dk = C('#51565c'), lit = C('#9aa3a6'), capc = C('#b3b8b2'); rect(fx, fy - ph, fw, ph + 1, face);
      for (j = 0; j < n; j++) { y0 = fy - ph + Math.round(ph * j / n); y1 = fy - ph + Math.round(ph * (j + 1) / n); if (j) hline(fx, fx + fw - 1, y0, joint);
      vline(fx + Math.round(fw * (j & 1 ? 0.34 : 0.66)), y0, y1, joint); } vline(fx, fy - ph, fy, dk); vline(fx + fw - 1, fy - ph, fy, lit);
      rect(fx - ov, fy - ph - ct, fw + 2 * ov, ct, lit); hline(fx - ov, fx + fw + ov - 1, fy - ph - ct, capc);
      hline(fx + ov, fx + fw - ov - 1, fy - ph - ct - 1, capc); hline(fx, fx + fw - 1, fy - ph, dk); }
  function path() {
    var g = C('#b98761'), g2 = C('#d9b48c'), e = C('#8a6a3f'), n = Math.max(1, u(2)), el, er, pc, y, sx, i, xl, xr, x, o, k, xs, r;
    pgPathRows(); el = PG_SCR.el; er = PG_SCR.er; pc = PG_SCR.pc;
    for (y = HZ + 1; y < H; y++) { xl = el[y]; xr = er[y]; sx = pc[y]; if (xr < -u(4) || xl > W + u(4)) continue; hline(xl, xr, y, g);
        if (y % 3 === 0) for (k = 0, o = y * W; k < 4; k++) if (BAY[(y & 3) * 4 + k] < 6) { xs = xl + ((k - (xl - sx)) & 3);
        for (x = xs < 0 ? xs + (((3 - xs) >> 2) << 2) : xs; x <= Math.min(W - 1, xr); x += 4) buf[o + x] = g2; } for (i = 0; i < n; i++) { r = hash(y * 31 + i * 7);
        if (r > 0.55) px(xl + Math.round((r - 0.55) / 0.45 * (xr - xl)), y, ((r * 1e4) | 0) & 1 ? g2 : e); } if (y - HZ > 0.2 * GH) { px(xl - 1, y, e);
        px(xr + 1, y, e); } }
    var SP = PG_SCR.spur, gx = PG_SCR.spg - camX, jx = PG_SCR.spj - camX, elw = PG_SCR.elw, W3 = 3 * W, c, ys, y1, fl, xw, xe;
    if (gx > W || jx < 0) return;
    for (x = Math.max(0, gx), xe = Math.min(W - 1, jx); x <= xe; x++) { c = (x - gx) * 4; ys = SP[c]; y1 = SP[c + 1]; if (ys > y1) continue; xw = x + camX;
        fl = SP[c + 3]; if (fl & 8) { for (r = ys, o = r * W + x; r <= y1; r++, o += W) buf[o] = g;
        for (r = ys + (3 - ys % 3) % 3, o = r * W + x; r <= y1; r += 3, o += W3) if (BAY[(r & 3) * 4 + ((x - gx) & 3)] < 6) buf[o] = g2; } else {
        for (r = ys, o = r * W + x; r <= y1; r++, o += W) if (xw < elw[r]) buf[o] = g;
        for (r = ys + (3 - ys % 3) % 3, o = r * W + x; r <= y1; r += 3, o += W3) if (xw < elw[r] && BAY[(r & 3) * 4 + ((x - gx) & 3)] < 6) buf[o] = g2; } r = SP[c + 2];
        if (r >= 0 && xw < elw[r]) buf[r * W + x] = fl & 1 ? g2 : e; if (fl & 2 && xw < elw[ys - 1] - 1) buf[(ys - 1) * W + x] = e;
        if (fl & 4 && xw < elw[y1 + 1] - 1) buf[(y1 + 1) * W + x] = e; }
  }
  function pgBenchCup(cx, topY) {
    var h = Math.max(4, Math.round(mpx(0.12, topY))), w = Math.max(3, Math.round(mpx(0.075, topY)));
    var cup = C('#d9b48c'), cup2 = C('#b98761'), lid = C('#e9e1cd'), dk = C('#51565c'), x0 = cx - (w >> 1), ly = topY - h;
    rect(x0, ly + 1, w, h - 1, cup);
    vline(x0, ly + 1, topY - 1, cup2); vline(x0 + w - 1, ly + 1, topY - 1, cup2);
    hline(x0 - 1, x0 + w, ly, lid);
    px(x0 + (w >> 1), ly, dk);
  }
  function bench() {
    var w = Math.round(0.09 * W), x = sxOf(2.31 * W - w, 1), y = HZ + Math.round(GH * 0.66);
    if (x > W + u(40) || x + w < -u(40)) return;
    var dy = y - HZ, yb = y - Math.round(0.5 * dy * dy / (2.5 * W)), dyb = yb - HZ, sb = dyb / dy;
    var iron = C('#26292d'), glint = C('#4a555e'), lit = C('#b98761'), wood = C('#8a6a3f'), shd = C('#6f573c'), deep = C('#57422a'), ink = C('#33251a');
    var lw = Math.max(3, Math.round(mpx(0.06, y))), ah = Math.max(2, Math.round(mpx(0.035, y))), bt = Math.max(2, Math.round(mpx(0.05, y)));
    var ends = [x + u(1), x + w - u(1) - lw], j, e, eb, r, f, xa, xz, ya, yz, n, s, sg;
    function XB(v) { return Math.round(W / 2 + (v - W / 2) * sb); }
    function zf(m) { return y - Math.round(m * dy / 2.5); }
    function zb(m) { return yb - Math.round(m * dyb / 2.5); }
    for (j = 0; j < 2; j++) { e = XB(ends[j]); rect(e + 1, zb(0.87), lw - 2, yb - zb(0.87) + 1, iron); hline(e - 1, e + lw, yb, iron); }
    xa = XB(x); xz = XB(x + w) - 1;
    for (j = 0; j < 3; j++) { ya = zb(0.85 - j * 0.12); yz = zb(0.765 - j * 0.12); rect(xa, ya, xz - xa + 1, yz - ya, shd); hline(xa, xz, ya, lit);
        hline(xa, xz, yz - 1, deep); }
    var pgPy = zb(0.85), pgPy2 = zb(0.765), pgPc = pgPy + ((pgPy2 - pgPy) >> 1);
    var pgRows = pgPy2 - pgPy > 2 ? 3 : 2, pgPw = pgRows === 3 ? 4 : 3;
    var pgPx = Math.round((xa + xz) / 2);
    var pgBrs = C('#a8854f'), pgBrL = C('#dcb26c'), pgBrD = deep;
    hline(pgPx - pgPw + 1, pgPx + pgPw - 1, pgPc - 1, pgBrL);
    hline(pgPx - pgPw + 1, pgPx + pgPw - 1, pgPc, pgBrs);
    if (pgRows === 3) hline(pgPx - pgPw + 1, pgPx + pgPw - 1, pgPc + 1, pgBrD);
    vline(pgPx - pgPw, pgPc - 1, pgPc + (pgRows === 3 ? 1 : 0), pgBrD);
    vline(pgPx + pgPw, pgPc - 1, pgPc + (pgRows === 3 ? 1 : 0), pgBrD);
    var sB = zb(0.46), sF = zf(0.46), g1, g2;
    g1 = Math.round((sF - sB) * 0.36); g2 = Math.round((sF - sB) * 0.70);
    for (r = sB; r <= sF; r++) { f = sF > sB ? (r - sB) / (sF - sB) : 1;
        hline(Math.round(xa + (x - xa) * f) - 1, Math.round(xz + (x + w - 1 - xz) * f) + 1, r, r - sB === g1 || r - sB === g2 ? wood : lit); }
    for (j = 0; j < 2; j++) { e = ends[j]; eb = XB(e); ya = zf(0.66); yz = zb(0.66); n = Math.max(1, Math.abs(e - eb), ya - yz);
        for (s = 0; s <= n; s++) rect(Math.round(eb + (e - eb) * s / n) - 1, Math.round(yz + (ya - yz) * s / n), lw + 2, ah, iron); hline(e - 1, e + lw, ya, glint);
        rect(e + 1, ya + ah, lw - 2, sF - ya - ah + 1, iron); rect(e, sF + 1, lw, y - sF, iron); sg = (sunX - e - (lw >> 1)) / (0.30 * W);
        if (sg > 0.2 || sg < -0.2) vline(sg > 0 ? e + lw - 1 : e, sF + bt + 1, y - 1, glint); hline(e - 2, e + lw + 1, y, iron); }
    pgBenchCup(x + Math.round(w * 0.80), sF + 1); rect(x - 1, sF + 1, w + 2, bt, wood); hline(x - 1, x + w, sF + 1, lit); hline(x - 1, x + w, sF + bt, ink);
  }
  function flowers() {
    pgBuild();
    var D = PG_SCR.drift, nh = D.nh, xm = D.xm - camX;
    if (D.xb - camX < 0 || D.xa - camX >= W) return;
    var T = D.t, B = D.b, O = D.o, SL = D.sl, FC = PG_SCR.fc, LF = PG_LEAF, lt = C('#376b45'), lt2 = C(sunE > u(9) ? '#4e9b46' : '#376b45'),
        stem = C(sunE > u(9) ? '#376b45' : '#2a5138');
    FC[0] = C('#1f3f2c'); FC[1] = lt; FC[2] = C('#2a5138');
    var c0 = Math.max(0, ((-xm) >> 1) - 1), c1 = Math.min(nh - 1, ((W - xm) >> 1) + 1), n = D.nb * nh, j, c, x, top, b, o, yy, off, hx, hy, k, bs;
    for (j = 0; j < n; j += nh) for (c = c0; c <= c1; c++) { top = T[j + c]; b = B[j + c]; if (top > b) continue; x = xm + 2 * c; off = O[j + c];
        if (x >= 0 && x < W) { o = top * W + x; buf[o] = off & 1 ? lt2 : lt; for (yy = top + 1, o += W; yy <= b; yy++, o += W) buf[o] = FC[LF[(off + yy) & 1023]];
        } x++; if (x >= 0 && x < W) { o = top * W + x; buf[o] = off & 2 ? lt2 : lt; off >>= 10;
        for (yy = top + 1, o += W; yy <= b; yy++, o += W) buf[o] = FC[LF[(off + yy) & 1023]]; } }
    var yel = C('#f2d24a'), amb = C('#e0a94e'), brn = C('#4b3827'), pink = C('#e08fa8'), rust = C('#7e3226'), pur = C('#6d5b93');
    for (j = D.ns - 4; j >= 0; j -= 4) { hx = SL[j] - camX; if (hx < 2 || hx > W - 3) continue; hy = SL[j + 1]; b = SL[j + 2]; k = SL[j + 3] & 15;
        bs = SL[j + 3] >> 4; for (yy = hy + 1, o = yy * W + hx; yy <= b; yy++, o += W) buf[o] = stem; if (k === 0) { hline(hx - 1, hx + 1, hy - 1, yel);
        hline(hx - 2, hx + 2, hy, yel); hline(hx - 1, hx + 1, hy + 1, amb); px(hx, hy, brn); if (bs > 5) px(hx, hy - 1, brn); } else if (k === 1) { px(hx, hy - 1, pur);
        hline(hx - 1, hx + 1, hy, pur); px(hx, hy + 1, pur); if (bs > 4) px(hx, hy, yel); } else if (k === 2) { px(hx, hy - 1, rust); px(hx, hy, rust);
        hline(hx - 2, hx + 2, hy + 1, pink); px(hx - 2, hy + 2, pink); px(hx + 2, hy + 2, pink); } else {
        for (c = 0; c < bs + 2; c++) px(hx + (c & 1 ? 1 : -1) * ((c >> 1) % 2) + (c > bs ? 1 : 0), hy + c, c % 3 ? yel : amb); } }
  }

  function props() {
    var y = HZ + Math.round(GH * 0.80);
    laptop(sxOf(3.555 * W, 1), y);
    cap(sxOf(3.600 * W, 1), y + 2);
    notebook(sxOf(3.634 * W, 1), y + 1);
  }  function pgFountainShadow(x, by) {
    var m = (by - HZ) / 2.5, bowlR = Math.max(3, Math.round(m * 0.19)), h = Math.max(6, Math.round(m * 0.84));
    if (x - bowlR > W + u(160) || x + bowlR < -u(160)) return;
    shadow(x - bowlR, by, bowlR * 2, h, 0.28);
  }
  function pgFountain(x, by) {
    var m = (by - HZ) / 2.5;
    var postR = Math.max(1, Math.round(m * 0.052)), postH = Math.max(6, Math.round(m * 0.70));
    var bowlR = Math.max(4, Math.round(m * 0.20)), ry = Math.max(2, Math.round(bowlR * 0.38));
    var lipR = Math.max(2, Math.round(bowlR * 0.62)), lipRy = Math.max(1, Math.round(ry * 0.58));
    if (x - bowlR - 1 > W + u(30) || x + bowlR + 1 < -u(30)) return;
    var dark = C('#152e24'), body = C('#1f3f2c'), lit = C('#2a5138'), rim = C('#376b45'), sky = C('#4d8a62'), steel = C('#9aa3a6'), steelLt = C('#b3b8b2');
    var s = Math.max(-1, Math.min(1, (sunX - x) / (0.30 * W))), cyt = by - postH - ry, dx, n, q, y0, y1, c, bw;
    hline(x - postR - 1, x + postR, by - 1, dark);
    rect(x - postR, by - postH, postR * 2, postH, body);
    vline(x - postR, by - postH, by - 1, s < -0.15 ? lit : dark);
    vline(x + postR - 1, by - postH, by - 1, s > 0.15 ? lit : dark);
    for (dx = -bowlR; dx <= bowlR; dx++) { n = dx / bowlR; q = Math.sqrt(Math.max(0, 1 - n * n)); y0 = cyt - Math.round(ry * q); y1 = cyt + Math.round(ry * q);
        c = n * s > 0.15 ? rim : n * s < -0.15 ? body : lit; vline(x + dx, y0, y1, c); }
    for (dx = -Math.round(bowlR * 0.35); dx <= Math.round(bowlR * 0.35); dx++) { n = dx / bowlR; q = Math.sqrt(Math.max(0, 1 - n * n));
        px(x + dx, cyt - Math.round(ry * q), sky); }
    for (dx = -lipR; dx <= lipR; dx++) { n = dx / lipR; q = Math.sqrt(Math.max(0, 1 - n * n)); y0 = cyt - Math.round(lipRy * q) + 1;
        y1 = cyt + Math.round(lipRy * q); if (y1 >= y0) vline(x + dx, y0, y1, dark); }
    bw = Math.max(2, Math.round(lipR * 0.5));
    hline(x - bw, x + bw, cyt, steel);
    hline(x - bw + 1, x + bw - 1, cyt + 1, steel);
    px(x, cyt, steelLt);
  }
  function treeLit(x0, y0, x1, y1, dark, paint) {
    if (!dark) { paint(); return; }
    var w = x1 - x0 + 1, P = TREE_M.pp, x, y, i = 0, ok;
    if (!P || P.length < w * (y1 - y0 + 1)) P = TREE_M.pp = new Uint32Array(w * (y1 - y0 + 1));
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) P[i++] = x >= 0 && y >= 0 && x < W && y < H ? buf[y * W + x] : 0;
    paint();
    for (i = 0, y = y0; y <= y1; y++) for (x = x0; x <= x1; x++, i++) { ok = x >= 0 && y >= 0 && x < W && y < H;
        if (ok && buf[y * W + x] !== P[i]) shade(x, y, TREE_SHADE); }
  }
  function parkProps() {
    binProp(sxOf(2.17 * W, 1), HZ + Math.round(GH * 0.66));
    pgFountain(sxOf(PG_FOUNTAIN.x * W, 1), HZ + Math.round(GH * PG_FOUNTAIN.y));
  }
  function laptop(x, by) {
    var lw = Math.max(9, Math.round(mpx(0.32, by))), f = (by - HZ) / W;
    var dd = Math.max(2, Math.round(mpx(0.22, by) * f)), th = Math.max(1, Math.round(mpx(0.016, by)));
    var sh = Math.max(6, Math.round(mpx(0.205, by))), hy = by - th - dd, k, j;
    if (x > W + lw + 2 || x + lw < -2) return;
    var dark = treeShadeAt(x + (lw >> 1), by);
    for (k = x; k < x + lw; k++) shade(k, by + 1, dark ? 0.22 : 0.35);
    if (!dark) shadow(x + 1, hy, lw - 2, sh);
    treeLit(x - 1, hy - sh - 1, x + lw, by, dark, function () {
      var al = C('#9aa3a6'), al2 = C('#b3b8b2'), mid = C('#6d777b'), low = C('#4a555e'), ink = C('#26292d'), sky = C('#3d4a63');
      rect(x, hy - sh, lw, sh, ink);
      hline(x + 1, x + lw - 2, hy - sh, mid);
      rect(x + 2, hy - sh + 2, lw - 4, sh - 4, C('#1f2a33'));
      for (j = 0; j < sh - 4; j++) { for (k = 0; k < lw - 4; k++) {
          if (k - j * 1.4 > (lw - 4) * 0.45 && BAY[(j & 3) * 4 + (k & 3)] < 10 - j) px(x + 2 + k, hy - sh + 2 + j, sky); } }
      for (j = 0; j < Math.round((lw - 4) * 0.55); j++) {
          k = x + lw - 4 - j; px(k, hy - sh + 3 + Math.round(j * (sh - 7) / ((lw - 4) * 0.55)), low); px(k - 1,
          hy - sh + 3 + Math.round(j * (sh - 7) / ((lw - 4) * 0.55)), low); }
      hline(x + 1, x + lw - 2, hy, low);
      rect(x, hy + 1, lw, dd, al);
      for (j = 1; j < dd - 1; j++) { hline(x + 3, x + lw - 4, hy + j, mid); for (k = x + 4 + (j & 1); k < x + lw - 4; k += 2) px(k, hy + j, low); }
      hline(x + (lw >> 1) - Math.round(lw * 0.14), x + (lw >> 1) + Math.round(lw * 0.14), hy + dd, al2);
      rect(x, by - th + 1, lw, th, mid);
      hline(x + 1, x + lw - 2, by, low);
    });
  }
  function cap(x, by) {
    var cw = Math.max(8, Math.round(mpx(0.20, by))), ch = Math.round(0.52 * cw), bl = Math.round(0.38 * cw), k;
    if (x > W + cw + 2 || x - bl < -cw) return;
    var dark = treeShadeAt(x + (cw >> 1), by);
    for (k = x - bl; k < x + cw; k++) shade(k, by + 1, dark ? 0.22 : 0.35);
    if (!dark) shadow(x + 2, by, cw - 4, ch);
    treeLit(x - bl - 1, by - ch - 2, x + cw, by, dark, function () {
      var o = C('#dcb26c'), lt = C('#f0d69f'), sd = C('#a8854f'), dk = C('#8a6a3f'), yy, d, cx = x + cw / 2, s1, s2, sc;
      for (yy = 1; yy <= ch; yy++) { d = Math.sqrt(1 - ((yy - 0.5) / ch) * ((yy - 0.5) / ch)) * cw / 2; hline(Math.round(cx - d), Math.round(cx + d) - 1,
          by - yy, o); if (yy > 0.40 * ch) hline(Math.round(cx - d + 0.35 * d), Math.round(cx + d) - 2, by - yy, lt); else px(Math.round(cx + d) - 1, by - yy,
          sd); s1 = Math.round(cx - d * 0.45); s2 = Math.round(cx + d * 0.30); if (yy > 1 && yy < ch - 1) {
          sc = yy > 0.40 * ch ? o : sd; px(s1, by - yy, sc); px(s2, by - yy, sc); } }
      px(Math.round(cx), by - ch - 1, sd);
      hline(x, x + cw - 1, by, dk);
      hline(x - bl + 2, x + 1, by - 2, o);
      hline(x - bl, x + 1, by - 1, sd);
      hline(x - bl + 1, x, by, dk);
    });
  }
  function notebook(x, by) {
    var nw = Math.max(8, Math.round(mpx(0.216, by))), f = (by - HZ) / W;
    var nd = Math.max(3, Math.round(mpx(0.279, by) * f)), th = Math.max(1, Math.round(mpx(0.012, by))), k, j, sft;
    if (x > W + nw + 4 || x + nw < -4) return;
    var dark = treeShadeAt(x + (nw >> 1), by);
    for (k = x; k < x + nw + Math.round(0.4 * nd); k++) shade(k, by + 1, dark ? 0.22 : 0.35);
    treeLit(x - 1, by - th - nd - 2, x + nw + nd, by, dark, function () {
      var cov = C('#b34a3a'), cov2 = C('#cf6250'), sp = C('#7e3226'), pg = C('#e9e1cd'), pg2 = C('#d9b48c'), ink = C('#26292d');
      for (k = 0; k < nd; k++) { sft = Math.round(0.4 * k); j = by - th - nd + k; hline(x + sft, x + sft + nw - 1, j, k === 0 ? cov2 : cov); px(x + sft, j,
          sp); px(x + sft + 1, j, sp); }
      sft = Math.round(0.4 * nd);
      for (k = 0; k < th; k++) hline(x + sft + 2, x + sft + nw - 1, by - th + 1 + k, k === th - 1 ? pg2 : pg);
      px(x + sft, by, sp); px(x + sft + 1, by, sp);
      for (k = 0; k < Math.round(nw * 0.55); k++) {
          j = by - th - nd + 1 + Math.round(k * (nd - 2) / Math.round(nw * 0.55)); px(x + Math.round(nw * 0.30) + k + Math.round(0.4 * (j - (by - th - nd))), j,
          k === 0 ? C('#b3b8b2') : ink); }
    });
  }
  function binProp(x, by) {
    var dy = by - HZ, w = Math.max(6, Math.round(mpx(0.60, by))), h = Math.max(8, Math.round(mpx(0.92, by)));
    if (x > W + w || x + w < 0) return;
    var E2 = dy * dy / (6.25 * W), rw = w >> 1, cx = x + rw, et = Math.max(1, Math.round(0.30 * 1.58 * E2)), eb = Math.max(1, Math.round(0.30 * 2.5 * E2));
    var cyb = by - eb, cyt = cyb - h, rb = Math.max(2, Math.round(mpx(0.05, by)));
    var dark = C('#26292d'), slat = C('#4a555e'), hi = C('#6d777b'), ink = C('#152e24'), rimf = C('#9aa3a6');
    var s = Math.max(-1, Math.min(1, (sunX - cx) / (0.30 * W))), dx, q, n, yt, yf, c, j, xx;
    for (dx = -rw; dx <= rw; dx++) { n = dx / rw; q = Math.sqrt(Math.max(0, 1 - n * n)); yt = cyt + Math.round(et * q); yf = cyb + Math.round(eb * q);
        c = n * s > 0.45 ? hi : n * s < -0.55 ? dark : slat; vline(cx + dx, yt, yf, c); vline(cx + dx, cyt - Math.round(et * q), yt - 1, ink);
        px(cx + dx, cyt - Math.round(et * q), slat); px(cx + dx, yt, rimf); px(cx + dx, yf, dark); }
    for (j = 1; j < 10; j++) { n = Math.sin(-Math.PI / 2 + j * Math.PI / 10); xx = cx + Math.round(n * rw); q = Math.sqrt(Math.max(0, 1 - n * n));
        vline(xx, cyt + Math.round(et * q) + rb + 1, cyb + Math.round(eb * q) - rb - 1, ink);
        if (j > 2 && j < 8 && rw > 12) vline(xx + 1, cyt + Math.round(et * q) + rb + 1, cyb + Math.round(eb * q) - rb - 1, ink); }
    for (dx = -rw; dx <= rw; dx++) { n = dx / rw; q = Math.sqrt(Math.max(0, 1 - n * n)); px(cx + dx, cyt + Math.round(et * q) + rb, dark);
        px(cx + dx, cyb + Math.round(eb * q) - rb, dark); }
  }
  function treeRootDip(dx, span) {
    var f = dx / span, k = Math.floor(f), a = hash(k * 271 + 811), b = hash((k + 1) * 271 + 811);
    f -= k; f = f * f * (3 - 2 * f);
    return a + (b - a) * f;
  }

  function trunk() {
    var tx = sxOf(TREEX, 1), w = Math.max(6, u(13)), by = HZ + Math.round(GH * 0.58), fy = HZ - Math.round(H * 0.02);
    if (tx > W + u(80) || tx + w < -u(80)) return;
    var tc = tx + w / 2, fmax = 0.60 * w, seg = u(8), top = fy - u(10), hwF = 0.42 * w, y, f, hw, mc, s, fl, flR, x0, x1, xl, j, L, xj, ph, qb, q, cx, a0, b4,
        gx0 = 0, gx1 = -1, pv = [-1, -1, -1, -1], rspan, roff, bcol;
    var fill = C('#5b4d3f'), dk = C('#3b3028'), lt = C('#877d72'), crL = C('#26292d'), bark = C('#33251a'), ridge = C('#6f6254');
    var ld = treeLeader(1, Math.round(tc), fy, w, TREE_M.lt || (TREE_M.lt = {}));
    var fmL = 0.8 * fmax, fmR = 1.1 * fmax, bL = 0.030 + hash(4101) * 0.03, bR = 0.030 + hash(4102) * 0.03;
    branches(Math.round(tc), fy, w);
    for (y = top; y <= by; y++) { f = (by - y) / (by - fy); if (y >= fy) { hw = w * (0.5 - 0.14 * f + (f > 0.86 ? 0.06 * Math.pow((f - 0.86) / 0.14, 2) : 0));
        mc = tc; } else { s = (fy - y) / (fy - top); q = (ld.sy - y) / (ld.sy - ld.my); hw = hwF + ((ld.wb + (ld.wm - ld.wb) * q) / 2 - 1 - hwF) * Math.pow(s, 0.6);
        mc = tc + (ld.sx + (ld.mx - ld.sx) * q - tc) * s;
        } fl = f < 0.09 ? fmL * (Math.pow(1 - f / 0.09, 2.2) + 0.24 * Math.max(0, 1 - Math.pow((f - bL) / 0.022, 2))) : 0;
        flR = f < 0.09 ? fmR * (Math.pow(1 - f / 0.09, 2.2) + 0.18 * Math.max(0, 1 - Math.pow((f - bR) / 0.022, 2))) : 0; x0 = Math.round(mc - hw - fl);
        x1 = Math.round(mc + hw + flR) - 1; if (x1 < x0) continue; if (y === by) { gx0 = x0; gx1 = x1; } hline(x0, x1, y, fill);
        xl = x0 + Math.round(0.30 * (x1 - x0 + 1)); hline(x0, xl - 3, y, dk); b4 = (y & 3) * 4;
        for (j = xl - 2; j <= xl + 1; j++) if (BAY[b4 + ((j - tx) & 3)] < 8) px(j, y, dk);
        for (j = x1 - Math.round(0.10 * (x1 - x0 + 1)); j <= x1; j++) if (BAY[b4 + ((j - tx) & 3)] < 9) px(j, y, lt); for (q = 0; q < 2; q++) { if (fl < 3) {
        pv[q * 2] = pv[q * 2 + 1] = -1; continue; } cx = Math.round(mc - hw) - Math.round(fl * (q ? 0.78 : 0.40)); a0 = pv[q * 2] < 0 ? cx : pv[q * 2];
        hline(Math.min(cx, a0), Math.max(cx, a0) + 1, y, crL); px(Math.min(cx, a0) - 1, y, fill); pv[q * 2] = cx; if (flR < 3) continue;
        cx = Math.round(mc + hw) - 1 + Math.round(flR * (q ? 0.78 : 0.40)); a0 = pv[q * 2 + 1] < 0 ? cx : pv[q * 2 + 1];
        hline(Math.min(cx, a0) - 1, Math.max(cx, a0), y, dk); px(Math.min(cx, a0) - 2, y, ridge); pv[q * 2 + 1] = cx;
        } if (y < by - u(4) && hw > w * 0.22) for (j = -3; j <= 3; j++) { L = seg + Math.round((hash(j * 31 + 5) - 0.5) * u(4));
        qb = by - y + Math.round(hash(j * 13 + 7) * L); ph = qb % L; if (ph < 3) continue;
        xj = Math.round(mc + (j * u(1.9) + (hash(j * 31 + ((qb / L) | 0) * 7 + 11) - 0.5) * u(1.7) + 2.2 * Math.sin((by - y) * 6.283 / L + j * 3.1)) * (hw / (w / 2)));
        if (xj <= x0 || xj >= x1) continue; px(xj, y, bark); if (j > -2) px(xj + 1, y, ridge); } }
    rspan = Math.max(3, u(1.2));
    for (j = gx0 - 1; j <= gx1 + 1; j++) { roff = Math.min(3, Math.round(treeRootDip(j - tc, rspan) * 4)); if (roff > 0 && j >= gx0 && j <= gx1) {
        bcol = buf[by * W + j]; for (q = 1; q <= roff; q++) px(j, by + q, bcol); } shade(j, by + roff + 1, 0.3); shade(j, by + roff + 2, 0.3); }
    function treeBarkAt(f2) { return { hw: w * (0.5 - 0.14 * f2), y: Math.round(by - f2 * (by - fy)) }; }
    (function () {
      var g2 = treeBarkAt(0.40), kr = Math.max(3, u(2.5)), kh = Math.max(4, Math.round(kr * 1.55)), seedK = 4405;
      var kx = Math.round(tc - 0.12 * g2.hw), ky = g2.y, e, h, xx, nx, ny, rr, rn, lit, c, bIdx;
      for (e = -kh; e <= kh; e++) { ny = e / kh; h = kr * Math.sqrt(Math.max(0, 1 - ny * ny)) * wob(seedK, e,
          kh); for (xx = -Math.round(h); xx <= Math.round(h); xx++) {
          nx = xx / kr; rr = Math.sqrt(nx * nx + ny * ny); rn = rr + (hash(seedK * 3 + xx * 17 + e * 13) - 0.5) * 0.16; if (rn >= 0.60 && hash(seedK * 5 + xx * 11 + e * 9) < 0.16) continue;
              lit = nx * 0.7 - ny * 0.9; bIdx = ((e + kh) & 3) * 4 + ((xx + kr) & 3);
              if (rn < 0.30) c = bark; else if (rn < 0.60) c = dk; else if (lit > 0.15) c = (lit > 0.5 || BAY[bIdx] < Math.round(16 * (lit - 0.15) / 0.35)) ? lt : ridge;
              else if (lit < -0.15) c = (lit < -0.5 || BAY[bIdx] < Math.round(16 * (-lit - 0.15) / 0.35)) ? crL : ridge; else c = ridge;
              px(kx + xx,
          ky + e, c); } }
    })();
    (function () {
      var g2 = treeBarkAt(0.70), sw = Math.max(2, u(1.9)), sh = Math.max(5, Math.round(sw * 1.6)), seedS = 4505;
      var sx = Math.round(tc + 0.55 * g2.hw), sy = g2.y, e, h, xx, nx, ny, rr, lit, c, pw;
      for (e = -sh; e <= sh; e++) { ny = e / sh; pw = ny < 0 ? 0.50 : 0.75; h = sw * Math.pow(Math.max(0, 1 - ny * ny), pw) * wob(seedS, e,
          sh); if (h < 0.4) continue; for (xx = -Math.round(h); xx <= Math.round(h); xx++) {
          nx = xx / sw; rr = Math.sqrt(nx * nx + ny * ny); lit = nx * 0.7 - ny * 0.8; c = rr > 0.80 ? (lit > 0.4 ? lt : lit < -0.3 ? crL : ridge) : (hash(4510 + xx * 13 + e * 9) < 0.22 ? bark : dk); px(sx + xx,
          sy + e, c); } }
    })();
    function treeRoot(xEdge, dir, len, hgt, seedR) {
      var i2, f2, h2, xr, yb2, yy, jj, topB, botB, cc, bIdx;
      for (i2 = 1; i2 <= len; i2++) { f2 = i2 / len; h2 = hgt * Math.sin(Math.PI * Math.pow(f2, 0.72)) * (1 - 0.2 * f2); if (h2 < 0.6) {
          if (i2 > len * 0.4) break; else continue; } h2 = Math.round(h2); xr = xEdge + dir * i2; yb2 = by + Math.min(3, Math.round(treeRootDip(xr - tc, rspan) * 4));
          topB = Math.max(1, Math.round(h2 * 0.30)); botB = Math.max(1, Math.round(h2 * 0.24)); for (yy = 0; yy < h2; yy++) { jj = yy; bIdx = (yy & 3) * 4 + (i2 & 3);
          if (jj < topB) cc = (jj === 0 || BAY[bIdx] < 10) ? lt : fill; else if (jj >= h2 - botB) cc = (jj === h2 - 1 || BAY[bIdx] < 9) ? dk : fill;
          else cc = hash(seedR + i2 * 13 + jj * 7) < 0.10 ? dk : fill; px(xr, yb2 - h2 + yy, cc); } px(xr, yb2, dk); shade(xr, yb2 + 1, 0.22); }
    }
    treeRoot(gx0, -1, Math.round(u(3) + hash(4201) * u(2)), Math.max(2, u(3.4)), 4610);
    treeRoot(gx1, 1, Math.round(u(2.6) + hash(4202) * u(1.8)), Math.max(2, u(3.0)), 4620);
    (function () {
      var mossD = C('#324a3c'), mossL = C('#4d6650'), ns = 10, i2, seedM, xf, len, y0m, y1m, yy, f2, g2, xj, mw, b, e, cc;
      for (i2 = 0; i2 < ns; i2++) { seedM = 4400 + i2 * 17; xf = 0.42 + hash(4310 + i2) * 0.38; len = Math.round(u(6) + hash(4320 + i2) * u(9)); y0m = by - Math.round(hash(4330 + i2) * u(2)); y1m = Math.max(fy + u(2),
          y0m - len); mw = 1 + (hash(4340 + i2) < 0.45 ? 1 : 0); for (yy = y0m; yy >= y1m; yy--) {
          f2 = Math.min(0.85, (by - yy) / (by - fy)); g2 = treeBarkAt(f2); xj = Math.round(tc - g2.hw * xf + Math.sin(yy * 0.4 + seedM) * u(0.6)); e = (y0m - yy) / Math.max(1,
          y0m - y1m); for (b = 0; b < mw; b++) { if (hash(seedM * 3 + yy * 13 + b * 5) > 0.85 * (1 - e * 0.55)) continue; cc = hash(seedM * 5 + yy * 11 + b) < 0.35 ? mossL : mossD; px(xj + b,
          yy, cc); } } }
    })();
  }  function treeLimb(x0, y0, x1, y1, w0, w1, c, lo, hi, mk) {
// limb drawn as spans across its run so thickness holds at any angle; with mk it only paints over that colour
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
// scaffold leader i: starts inside the trunk, bends at its midpoint, tapers under the crown
    var b = BR[i];
    o.tx = cx + Math.round(b[0] * W); o.ty = fy + Math.round(b[1] * H);
    o.sx = cx + Math.round(b[0] / 0.085 * 0.3 * 0.42 * w); o.sy = fy + u(8);
    o.mx = cx + Math.round(0.5 * b[0] * W) + Math.round((hash(i * 7 + 1) - 0.5) * 2 * u(2)); o.my = fy + Math.round(0.3 * b[1] * H);
    o.wb = Math.max(2, Math.round(w * b[2])); o.wm = Math.max(2, Math.round(w * 0.29)); o.wt = Math.max(1, Math.round(w * b[3]));
    return o;
  }
  function branches(cx, fy, w, mk) {
    var dim = mk !== undefined;
    var fill = C(dim ? '#3b3028' : '#5b4d3f'), lo = C(dim ? '#26292d' : '#3b3028'), hi = C(dim ? '#5b4d3f' : '#877d72');
    var i, j, s, fr, sx, sy, L = TREE_M.ld || (TREE_M.ld = {});
    for (i = 0; i < BR.length; i++) { treeLeader(i, cx, fy, w, L); treeLimb(L.sx, L.sy, L.mx, L.my, L.wb, L.wm, fill, lo, hi, mk);
        treeLimb(L.mx, L.my, L.tx, L.ty, L.wm, L.wt, fill, lo, hi, mk); for (j = 0; j < BR[i][4].length; j++) { s = BR[i][4][j]; if (s[0] <= 0.3) { fr = s[0] / 0.3;
        sx = L.sx + (L.mx - L.sx) * fr; sy = L.sy + (L.my - L.sy) * fr; } else { fr = (s[0] - 0.3) / 0.7; sx = L.mx + (L.tx - L.mx) * fr;
        sy = L.my + (L.ty - L.my) * fr; } sx = Math.round(sx); sy = Math.round(sy);
        treeLimb(sx, sy, sx + Math.round(s[1] * W), sy + Math.round(s[2] * H), Math.max(2, Math.round(w * s[3])), 2, fill, lo, hi, mk); } }
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
    for (var e = -r; e <= r; e++) { var y = qy + e, h = Math.round(Math.sqrt(r * r - e * e)), a0 = Math.max(CY.c0, qx - h), a1 = Math.min(CY.c1, qx + h), o;
        if (y < CY.ya || y > CY.yb || a1 < a0) continue; o = (y - CY.ya) * CY.sw - CY.bx0; buf.set(CY.bg.subarray(o + a0, o + a1 + 1), y * W + a0); }
  }
  function cyStamp(qx, qy, qrx, qry, c, sid, tips) {
    var A = Math.max(1, Math.round(qrx * 0.24)), P = Math.max(3, Math.round(qry * 0.42)), o1 = (hash(sid * 3 + 7) * P) | 0, o2 = (hash(sid * 3 + 8) * P) | 0;
    var nt = qrx > u(3.2) && hash(sid * 3 + 10) < 0.75 ? -0.3 - hash(sid * 3 + 11) * 0.2 : -2, xn = Math.round(qx + (hash(sid * 3 + 9) - 0.4) * qrx * 0.7);
    var e, t, h, hb = 0, xa, xb, nw, n, k2, tx, tl, th, m;
    for (e = -qry; e <= qry; e++) { t = e / (qry + 0.5); h = qrx * (t < 0 ? Math.sqrt(1 - t * t) : Math.pow(1 - t * t, 0.45));
        xa = Math.round(qx - h + ((e + 99 + o1) % P) / P * A); xb = Math.round(qx + h - ((e + 99 + o2) % P) / P * A * 0.7); if (t < nt) {
        nw = Math.round((nt - t) / (1 + nt) * qrx * 0.42); cyRun(qy + e, xa, Math.min(xb, xn - nw - 1), c); cyRun(qy + e, Math.max(xa, xn + nw + 1), xb, c);
        } else cyRun(qy + e, xa, xb, c); hb = h; }
    if (!tips) return;
    n = 2 + ((hash(sid * 3 + 1) * 3) | 0); th = Math.max(1, Math.round(qrx * 0.10));
    for (k2 = 0; k2 < n; k2++) { tx = Math.round(qx + (hash(sid * 5 + k2 * 7) - 0.5) * 1.7 * hb); tl = 1 + ((hash(sid * 9 + k2 * 3) * 3) | 0);
        for (m = 1; m <= tl; m++) { h = Math.round(th * (1 - (m - 1) / tl)); cyRun(qy + qry + m, tx - h, tx + h, c); } }
  }
  function cyCrest(qx, qy, hw, hh, c, sid) {
    var e, h, k2, a0;
    for (e = -hh; e <= hh; e++) { h = hw * Math.sqrt(1 - (e / (hh + 0.5)) * (e / (hh + 0.5))); k2 = ((e + 40) >> 1) * 17;
        a0 = Math.round(qx - h + hash(sid * 13 + k2) * h * (e > 0 ? 1.1 : 0.45)); cyRun(qy + e, a0, Math.round(qx + h - hash(sid * 19 + k2) * h * 0.3), c); }
  }
  function cyInCrown(qx, qy) {
    var n, e2, cx = CY.cx, cy = CY.cy, r = CY.r, lo = CY.lo, lw = CY.lw;
    for (n = 0; n < CY.nl; n++) { e2 = qy - cy[n]; if (e2 >= -r[n] && e2 <= r[n] && Math.abs(qx - cx[n]) < lw[lo[n] + e2 + r[n]]) return true; }
    return false;
  }
  function canopy() {
    var G = treeGeo(), x = G.x, cy = G.cy0, R = Math.round(0.23 * W), Rb = Math.round(0.31 * H), pad = u(12);
    if (x - R - pad > W || x + R + pad < 0) return;
    var T = [C('#152e24'), C('#2a5138'), C('#376b45'), C('#5a9e4c'), C('#74ae3a'), C('#9ed24f')], d = T[0];
    var cxs = G.cx, cys = G.cy, rs = G.r, NL = LUMP.length;
    var i, j, k, xx, yy, a, rr, dy, dw, ya = H, yb = -1, row, col, id, px0, py0, best, q, nx, ny, v, b, rx, ry;
    for (i = 0; i < NL; i++) { ya = Math.min(ya, cys[i] - rs[i] - pad); yb = Math.max(yb, cys[i] + rs[i] + pad); }
    if (ya < 0) ya = 0;
    if (yb > H - 1) yb = H - 1;
    var bx0 = x - R - pad, sw = 2 * (R + pad) + 1, sh = yb - ya + 1, c0 = Math.max(0, bx0), c1 = Math.min(W - 1, bx0 + sw - 1);
    if (c1 < c0 || yb < ya) return;
    if (!TREE_M.bg || TREE_M.bg.length < sw * sh) TREE_M.bg = new Uint32Array(sw * sh);
    var BG = TREE_M.bg;
    for (yy = ya; yy <= yb; yy++) BG.set(buf.subarray(yy * W + c0, yy * W + c1 + 1), (yy - ya) * sw + c0 - bx0);
    CY.ya = ya; CY.yb = yb; CY.c0 = c0; CY.c1 = c1; CY.sw = sw; CY.bx0 = bx0; CY.bg = BG;
    var LO = TREE_M.lo, LW = TREE_M.hi, top = u(2);
    if (TREE_M.mk !== W * 7 + H) { TREE_M.mk = W * 7 + H; LO = TREE_M.lo = []; k = 0; for (i = 0; i < NL; i++) { LO[i] = k; k += 2 * rs[i] + 1;
        } LW = TREE_M.hi = new Float32Array(k); for (i = 0; i < NL; i++) for (dy = -rs[i]; dy <= rs[i]; dy++) LW[LO[i] + dy + rs[i]] = treeLobeW(i, rs[i], dy); }
    CY.cx = cxs; CY.cy = cys; CY.r = rs; CY.lo = LO; CY.lw = LW; CY.nl = NL;
    for (i = 0; i < NL; i++) for (dy = -rs[i]; dy <= rs[i]; dy++) { if (cys[i] + dy < top + u(2)) continue; dw = Math.round(LW[LO[i] + dy + rs[i]]) - u(3.5);
        if (dw >= 0) cyRun(cys[i] + dy, cxs[i] - dw, cxs[i] + dw, d); }
    var gx = u(5.6), gy = u(3.9), r0 = Math.floor((ya - cy) / gy) - 1, r1 = Math.ceil((yb - cy) / gy) + 1, q1 = Math.ceil((R + pad) / gx) + 1;
    var sec, wi, lt, sc, rim = T[2], lx, ly, ci, cj, ii, jj, sk, sq, snx, sny, ex, ey;
    var SG = u(26), sgx0 = Math.floor(-(R + pad + 2 * gx) / SG) - 2, sgy0 = Math.floor((r0 - 1) * gy / SG) - 2;
    var sgw = 2 * (-sgx0) + 1, sgh = Math.ceil((r1 + 1) * gy / SG) + 3 - sgy0, SX = TREE_M.sx || (TREE_M.sx = []), SY = TREE_M.sy || (TREE_M.sy = []),
        SR = TREE_M.sr || (TREE_M.sr = []);
    for (jj = 0; jj < sgh; jj++) for (ii = 0; ii < sgw; ii++) { q = (ii + sgx0 + 300) * 977 + jj + sgy0 + 300; sk = jj * sgw + ii;
        SX[sk] = (ii + sgx0 + 0.5 + (hash(q * 3 + 1) - 0.5) * 0.7) * SG; SY[sk] = (jj + sgy0 + 0.5 + (hash(q * 3 + 2) - 0.5) * 0.7) * SG;
        SR[sk] = SG * (0.62 + hash(q * 3 + 3) * 0.3); }
    for (row = r0; row <= r1; row++) for (col = q1; col >= -q1; col--) { id = (row + 500) * 1013 + col + 500;
        px0 = x + col * gx + (row & 1) * (gx >> 1) + Math.round((hash(id * 5 + 1) - 0.5) * gx * 0.9);
        py0 = cy + row * gy + Math.round((hash(id * 5 + 2) - 0.5) * gy * 0.9); best = sec = -1; wi = 0; for (i = 0; i < NL; i++) { dy = py0 - cys[i];
        if (dy < -rs[i] || dy > rs[i]) continue; dw = LW[LO[i] + dy + rs[i]]; q = (dw - Math.abs(px0 - cxs[i])) / rs[i]; if (q > best) { sec = best; best = q; wi = i;
        } else if (q > sec) sec = q; } if (best < -0.03 || (best > 0.12 && hash(id * 5 + 5) < 0.06)) continue; nx = (px0 - cxs[wi]) / rs[wi];
        ny = (py0 - cys[wi]) / rs[wi]; sc = 0.6 + 0.9 * Math.min(1, best / 0.42); rx = Math.max(3, Math.round((u(2.4) + hash(id * 5 + 3) * u(3.2)) * sc));
        ry = Math.max(2, Math.round(rx * (0.56 + hash(id * 5 + 6) * 0.2))); if (py0 - ry < top) py0 = top + ry;
        if (px0 + rx + 8 < c0 || px0 - rx - 8 > c1 || py0 + ry + 8 < ya || py0 - ry - 8 > yb) continue; lx = px0 - x; ly = py0 - cy; ci = Math.floor(lx / SG) - sgx0;
        cj = Math.floor(ly / SG) - sgy0; sq = 1e9; snx = sny = 0; for (jj = cj - 1; jj <= cj + 1; jj++) for (ii = ci - 1; ii <= ci + 1; ii++) { sk = jj * sgw + ii;
        ex = (lx - SX[sk]) / SR[sk]; ey = (ly - SY[sk]) / SR[sk]; q = ex * ex + ey * ey * 1.4; if (q < sq) { sq = q; snx = ex; sny = ey; } } sq = 1 - Math.sqrt(sq);
        lt = -0.62 * ny + 0.30 * nx; v = 0.45 * lt + 0.6 * (-0.62 * sny + 0.30 * snx) - 0.62 * (py0 - cy) / Rb + 0.16 * (px0 - x) / R + (hash(id * 5 + 4) - 0.5) * 0.45;
        if (sq < 0.1) v -= 0.3; if (ny > 0.2) v -= (ny - 0.2) * 1.5; if (best < 0.15 && sec > best - 0.12) v -= 0.55;
        b = v > 0.55 ? 4 : v > 0.05 ? 3 : v > -0.45 ? 2 : 1;
        if (b < 3 && best < 0.25 && !cyInCrown(px0, py0 + ry + u(2))) cyStamp(px0 - 1, py0 + 1, rx, ry, rim, id, 1);
        cyStamp(px0, py0, rx, ry, T[sny > -0.25 || b === 1 || hash(id * 5 + 11) < 0.25 ? b - 1 : b], id, 1);
        cyStamp(px0 + Math.round(rx * 0.14), py0 - Math.round(ry * 0.20), Math.round(rx * 0.80), Math.round(ry * 0.72), T[b], id + 7, 1);
        if (b > 1 && lt > 0.05 && hash(id * 5 + 7) < 0.4 + lt * 0.6 && (b < 4 || (nx > 0.3 && ny < -0.4))) cyCrest(px0 + Math.round(rx * (0.18 + hash(id * 5 + 8) * 0.3)),
        py0 - Math.round(ry * (0.30 + hash(id * 5 + 9) * 0.25)), Math.max(2, Math.round(rx * 0.36)), Math.max(1, Math.round(ry * 0.34)), T[b + 1], id + 13); }
    var gcx = [], gcy = [], gr = [], hr, a2, qx, qy;
    for (i = 1; i <= 6; i++) { a = hash(i * 97 + 5) * 6.283; rr = rs[i] * (0.62 + hash(i * 97 + 6) * 0.22); qx = cxs[i] + Math.round(Math.cos(a) * rr);
        qy = cys[i] + Math.round(Math.sin(a) * rr); hr = u(1.2) + Math.round(hash(i * 97 + 7) * u(1.8)); for (k = 0; k < 4; k++) {
        gcx[k] = qx + Math.round(Math.cos(3.1 * a) * 1.1 * hr * k); gcy[k] = qy + Math.round(Math.sin(3.1 * a) * 0.7 * hr * k) + (k & 1 ? 2 : 0);
        gr[k] = Math.max(3, Math.round(hr * (1 - 0.2 * k))); cyRestore(gcx[k], gcy[k], gr[k]); } for (k = 0; k < 4; k++) for (j = 0; j < 9; j++) {
        a2 = hash(i * 131 + k * 17 + j * 5) * 6.283; xx = gcx[k] + Math.round(Math.cos(a2) * (gr[k] + 2)); yy = gcy[k] + Math.round(Math.sin(a2) * (gr[k] + 2));
        if (cyLeaf(xx, yy)) cyLeafDisc(gcx[k] + Math.round(Math.cos(a2) * 0.85 * gr[k]), gcy[k] + Math.round(Math.sin(a2) * 0.85 * gr[k]), Math.max(1,
        Math.round(gr[k] * (0.22 + 0.28 * hash(i * 137 + k * 19 + j)))), buf[yy * W + xx]); } for (k = 0; k < 4; k++) { var nv = 0, lc = d, e1, e2, pass;
        for (pass = 0; pass < 2 && (!pass || (nv && nv < 24)); pass++) for (e1 = -gr[k]; e1 <= gr[k]; e1++) for (e2 = -gr[k]; e2 <= gr[k]; e2++) { xx = gcx[k] + e2;
        yy = gcy[k] + e1; if (e1 * e1 + e2 * e2 > gr[k] * gr[k] + gr[k] || xx < c0 || xx > c1 || yy < ya || yy > yb) continue;
        if (k > 0 && (xx - gcx[k - 1]) * (xx - gcx[k - 1]) + (yy - gcy[k - 1]) * (yy - gcy[k - 1]) <= gr[k - 1] * gr[k - 1]) continue;
        if (k < 3 && (xx - gcx[k + 1]) * (xx - gcx[k + 1]) + (yy - gcy[k + 1]) * (yy - gcy[k + 1]) <= gr[k + 1] * gr[k + 1]) continue; if (cyLeaf(xx, yy)) {
        if (!pass) lc = buf[yy * W + xx]; } else if (!pass) nv++; else buf[yy * W + xx] = lc; } }
    }
    branches(G.tx + (G.tw >> 1), G.fy, G.tw, d);
  }
  function leaves() {
    var G = treeGeo(), s = Math.max(2, u(0.9)), cols = ['#74ae3a', '#9ed24f', '#e0a94e'], OFF = [-0.13, 0.06, 0.15], fall = 4.5;
    if (G.x < -0.4 * W || G.x > 1.4 * W) return;
    var i, j, n, per, ph, cyc, xs, top, land, x, y, c, dk = C('#2a5138'), dx;
    function drop(i, cy) { xs = G.x + Math.round(OFF[i] * W) + Math.round((hash(cy * 29 + i * 7 + 3) - 0.5) * u(24));
        land = G.by + Math.round(hash(91 * i + cy * 13) * 0.30 * GH); }
    function lie(lx, lc) { var k, dark = treeShadeAt(lx, land); hline(lx - s, lx + s, land, lc); hline(lx - s + 1, lx + s - 2, land - 1, lc);
        if (dark) for (k = lx - s; k <= lx + s; k++) { shade(k, land, TREE_SHADE); if (k > lx - s && k < lx + s - 1) shade(k, land - 1, TREE_SHADE); } }
    for (i = 0; i < 3; i++) { per = 10 + 3.5 * i; ph = (clock + 2.3 * i) % per; cyc = Math.floor((clock + 2.3 * i) / per); c = C(cols[i]);
        for (n = ph < fall ? 2 : 1; n >= (ph < fall ? 1 : 0); n--) { drop(i, cyc - n); lie(xs + Math.round(Math.sin(2.2 * fall + i) * u(7)), c);
        } if (ph >= fall) continue; drop(i, cyc); top = HZ - Math.round(H * 0.10); for (j = 0; j < LUMP.length; j++) { dx = xs - G.cx[j];
        if (Math.abs(dx) < G.r[j]) top = Math.max(top, G.cy[j] + Math.round(Math.sqrt(G.r[j] * G.r[j] - dx * dx)) + u(3));
        } y = Math.round(top + ph / fall * (land - top)); x = xs + Math.round(Math.sin(2.2 * ph + i) * u(7)); if (((ph * 5) | 0) & 1) { hline(x - s, x + s, y, c);
        hline(x - s + 1, x + s - 1, y - 1, c); px(x + s, y + 1, dk); } else { vline(x, y - s, y + s, c); vline(x + 1, y - s + 1, y + s, c); px(x - 1, y - s + 1, c);
        px(x, y + s + 1, dk); px(x + 1, y + s + 1, dk); } }
  }
  function tufts() {
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
  function lifeFarX(cy) {
    var tail = 0.70 * W, sx = tail + mpx(1.2, cy), se = sx + mpx(LIFE_CAR.sedan.L, cy), vx = se + mpx(1, cy);
    var vcy = KERB + Math.round(0.03 * RH);
    return { tail: tail, sx: sx, se: se, vx: vx, ve: vx + mpx(LIFE_CAR.van.L, vcy), vcy: vcy };
  }
  function lifePoleX(cy) {
    return 0.70 * W - mpx(29.5, cy);
  }
  function lifeRider2(cy, y, S) {
    var loc = S.ph - TRAM_TA, alight = TRAM_DOOR + 0.3, pause = 6;
    if (loc < alight || loc > 40) return;
    var h = mpx(1.7, y), v = mpx(1.3, y), walked = Math.max(0, loc - alight - pause);
    var sx = sxOf(lifePoleX(cy) + mpx(0.5, cy) - walked * v, 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, -1, walked > 0 ? (walked * v / (0.764 * h)) % 1 : -1, LIFE_FOLK[1], 0, 2);
  }
  function lifeCommuter2(F, cy, y, S) {
    var h = mpx(1.7, y), v = mpx(1.3, y), x0 = F.vx + mpx(2, cy), x1 = F.tail - mpx(6, cy), Tw = (x0 - x1) / v;
    var boardPh = TRAM_TA + TRAM_TD - 4, toBoard = ((boardPh - S.ph) % TRAM_CYC + TRAM_CYC) % TRAM_CYC;
    if (toBoard > Tw) return;
    var x = x1 + toBoard * v;
    if (x <= F.se && x >= F.sx) return;
    var sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, -1, (toBoard * v / (0.764 * h)) % 1, LIFE_FOLK[0], 0, 0);
  }
  function lifeWorker2(vanX, y) {
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
    if (camX > 1.1 * W) return;
    var BY = KERB - BASE, cy = KERB + Math.round(0.09 * RH), F = lifeFarX(cy), S = tramSchedule(clock);
    lifeCommuter2(F, cy, BASE + Math.round(0.55 * BY), S);
    lifeRider2(cy, KERB - Math.round(0.14 * BY), S);
    lifeWorker2(F.ve, KERB - Math.round(0.10 * BY));
    lifePigeons(KERB - Math.round(0.05 * BY));
  }
  function parkLife() {
    lifePair(HZ + Math.round(0.11 * GH));
    lifeRunner(HZ + Math.round(0.15 * GH));
    lifeDogWalk(HZ + Math.round(0.18 * GH));
    lifeTreeWalker(HZ + Math.round(0.24 * GH));
    lifeGeese(HZ + Math.round(0.35 * GH));
    lifeSquirrel(HZ + Math.round(0.60 * GH));
    lifeSitter(HZ + Math.round(0.66 * GH));
  }
  function farTraffic() {
    if (camX > 1.2 * W) return;
    var cy = KERB + Math.round(0.09 * RH), F = lifeFarX(cy);
    lifeCar(sxOf(F.vx, 1), F.vcy, -1, LIFE_CAR.van, ['#4a555e', '#6d777b', '#9aa3a6'], 0, 0);
    var S = tramSchedule(clock);
    if (S.off > 0 && camX > S.gateCam) return;
    lifeCar(sxOf(F.sx + tramSedanOff(S), 1), cy, -1, LIFE_CAR.sedan, ['#33373b', '#4a555e', '#6d777b'], t < 0.35, tramSedanBrake(S));
    lifeCyclist(sxOf(F.ve + mpx(7, cy) + tramCyclistOff(S), 1), cy);
    lifeCar(sxOf(F.ve + mpx(7 + TRAM_XCAR_BACK, cy) + tramXCarOff(S), 1), cy, -1, LIFE_CAR.sedan, ['#4b3827', '#6f573c', '#8a6a3f'], t < 0.35, S.sinceClose < 0 || S.sinceClose < TRAM_XCAR_WAIT);
  }
  function carsWave(clock, k) {
    var Vc = 7 * k, A = 0.6, w = 6.283185307 / 16, s = Math.sin(w * clock);
    return { dist: Vc * (1 - 0.5 * A) * clock + Vc * 0.5 * A / w * s, brake: s > 0.03 };
  }
  function nearTraffic() {
    var cy = KERB + Math.round(0.40 * RH), TX = seam(cy) - mpx(STREET_PW, cy);
    if (camX > TX) return;
    var SPAWN = -0.6 * W, LOOP = 3 * W, N = 3, step = LOOP / (3 + 2 * cl01(t / 0.4));
    var wv = carsWave(clock, mpx(1, cy)), lit = t < 0.35, i, x, sx, kd, len;
    for (i = 0; i < N; i++) {
      x = SPAWN + (((i * step + wv.dist) % LOOP) + LOOP) % LOOP;
      kd = CARS_KIND[Math.floor(hash(i * 131 + 17) * CARS_KIND.length) % CARS_KIND.length];
      len = mpx(LIFE_CAR[kd[0]].L, cy);
      if (x + len > TX) continue;
      sx = sxOf(x, 1);
      if (sx < -40 || sx > W + 40) continue;
      lifeCar(sx, cy, 1, LIFE_CAR[kd[0]], kd[1], lit, wv.brake);
    }
  }
  function lifeSquirrel(y) {
    var sx = sxOf(3.90 * W, 1), k = (y - HZ) / 2.5, dir = -1;
    if (sx < -60 || sx > W + 60) return;
    var u1 = Math.max(2, Math.round(0.075 * k)), c = C('#26292d'), dk = C('#181b1e'), lt = C('#4a555e'), hd = C('#383f45');
    var F = function (v) { return sx + dir * Math.round(u1 * v); };
    var rim = lifeRim(sx, u1 * 1.5);
    lifeContact(sx, y, u1 * 3.4);
    if (rim) lifeCast(F(-0.5), y, Math.round(u1 * 4.4), Math.round(u1 * 4.4), 0.18);
    var rx = F(-1.6), ry = y - Math.round(u1 * 0.6);
    var m1x = F(-2.0), m1y = y - Math.round(u1 * 2.3);
    var m2x = F(-0.6), m2y = y - Math.round(u1 * 3.6);
    var tpx = F(0.5), tpy = y - Math.round(u1 * 2.9);
    lifeLimb(rx, ry, m1x, m1y, Math.max(2, Math.round(u1 * 1.3)), Math.max(2, Math.round(u1 * 1.15)), c);
    lifeLimb(m1x, m1y, m2x, m2y, Math.max(2, Math.round(u1 * 1.15)), Math.max(2, Math.round(u1 * 0.95)), c);
    lifeLimb(m2x, m2y, tpx, tpy, Math.max(2, Math.round(u1 * 0.95)), Math.max(1, Math.round(u1 * 0.7)), dk);
    disc(F(-0.85), y - Math.round(u1 * 0.85), Math.round(u1 * 1.1), c);
    disc(F(0.25), y - Math.round(u1 * 1.3), Math.round(u1 * 0.85), c);
    if (rim) {
      var thi = 4, thk, thf, thx, thy, sg;
      for (thk = 0; thk <= thi; thk++) {
        thf = thk / thi;
        if (thf < 0.5) { sg = thf * 2; thx = m1x + (m2x - m1x) * sg; thy = m1y + (m2y - m1y) * sg; }
        else { sg = (thf - 0.5) * 2; thx = m2x + (tpx - m2x) * sg; thy = m2y + (tpy - m2y) * sg; }
        px(Math.round(thx), Math.round(thy) - Math.max(1, Math.round(u1 * 0.4 * (1 - thf))), lt);
      }
    }
    var hx = F(1.3), hy = y - Math.round(u1 * 1.5);
    var hr = Math.max(2, Math.round(u1 * 0.62));
    disc(hx, hy, hr, hd);
    var necky = hy + Math.round(u1 * 0.6);
    px(Math.round(hx - dir * hr * 0.8), necky, dk);
    px(Math.round(hx - dir * hr * 0.8), necky + 1, dk);
    px(hx + dir * Math.round(u1 * 0.6), hy + Math.round(u1 * 0.15), dk);
    var erx = Math.round(hx - dir * hr * 0.45);
    px(erx, hy - hr, hd); px(erx, hy - hr - 1, hd); px(erx - dir, hy - hr, hd);
    px(erx, hy - hr + 1, dk);
  }
  function lifePigeon(x, y, k, peck) {
    var body = C('#6d777b'), dk = C('#4a555e'), dark = C('#26292d');
    var br = Math.max(2, Math.round(0.16 * k)), by = y - br;
    disc(x, by, br, body);
    disc(x - Math.round(br * 0.35), by + Math.round(br * 0.25), Math.round(br * 0.8), dk);
    px(x - br - 1, by, dark);
    var hr = Math.max(1, Math.round(br * 0.5)), hx = x + Math.round(br * 0.7);
    var hy = peck ? y - Math.round(hr * 0.4) : by - Math.round(br * 0.75);
    lifeLimb(x + Math.round(br * 0.3), by - Math.round(br * 0.3), hx, hy, 1, 1, dark);
    disc(hx, hy, hr, dark);
    px(x - Math.round(br * 0.2), y, dark); px(x + Math.round(br * 0.3), y, dark);
  }
  function lifePigeons(y) {
    var sx = sxOf(0.035 * W, 1), k = (y - HZ) / 2.5, g = Math.max(3, Math.round(0.30 * k));
    if (sx < -20 || sx > W + 20) return;
    lifeContact(sx, y, g * 1.6);
    lifePigeon(sx - g, y, k, hash(2011) > 0.4);
    lifePigeon(sx + Math.round(g * 0.35), y, k, hash(2012) > 0.4);
    lifePigeon(sx + Math.round(g * 1.5), y - 1, k * 0.96, hash(2013) > 0.4);
  }
  function lifeGoose(x, y, dir, k) {
    var body = C('#6f573c'), dk = C('#4b3827'), neck = C('#26292d'), cheek = C('#cfd6d8');
    var bh = Math.max(3, Math.round(0.19 * k)), bw = Math.max(6, Math.round(0.42 * k));
    disc(x, y - Math.round(bh * 0.85), bh, body);
    disc(Math.round(x - dir * bw * 0.16), y - Math.round(bh * 0.55), Math.round(bh * 0.85), dk);
    var nx = x + dir * Math.round(bw * 0.30), ny = y - Math.round(bh * 1.15);
    lifeLimb(nx, ny, nx + dir * Math.round(bw * 0.14), y, Math.max(2, Math.round(bh * 0.42)), Math.max(1, Math.round(bh * 0.28)), neck);
    var hx = nx + dir * Math.round(bw * 0.14), hr = Math.max(2, Math.round(bh * 0.36));
    disc(hx, y - Math.round(hr * 0.5), hr, neck);
    px(hx + dir * Math.round(hr * 0.4), Math.round(y - hr * 0.4), cheek);
  }
  function lifeGeese(y) {
    var sx = sxOf(3.05 * W, 1), k = (y - HZ) / 2.5, rim = lifeRim(sx, 0.3 * k);
    if (sx < -80 || sx > W + 80) return;
    lifeContact(Math.round(sx - 0.7 * k), y, 0.5 * k);
    lifeContact(Math.round(sx + 0.75 * k), y + 1, 0.42 * k);
    if (rim) { lifeCast(Math.round(sx - k), y, Math.round(0.6 * k), Math.round(0.7 * k), 0.20); lifeCast(Math.round(sx + 0.45 * k), y + 1, Math.round(0.5 * k), Math.round(0.6 * k), 0.20); }
    lifeGoose(Math.round(sx - 0.7 * k), y, -1, k);
    lifeGoose(Math.round(sx + 0.75 * k), y + 1, 1, k * 0.93);
  }
  function lifeCyclist(x0, by) {
    var k = (by - HZ) / 2.5, L = Math.max(u(10), Math.round(1.05 * k)), rr = Math.max(2, Math.round(0.33 * k));
    if (x0 - 20 > W || x0 + L + 20 < 0) return;
    var frame = C('#2c3840'), frameDk = C('#22292d'), frameLt = C('#4a555e'), tire = C('#26292d'), hub = C('#4a555e');
    var fx = x0 + Math.round(L * 0.08), rx = x0 + Math.round(L * 0.92), gy = by - rr;
    lifeContact(x0 + Math.round(L * 0.5), by, L * 0.55);
    var bbx = x0 + Math.round(L * 0.58), bby = by - Math.round(0.30 * k);
    var seatx = x0 + Math.round(L * 0.64), seaty = by - Math.round(0.84 * k);
    var headx = x0 + Math.round(L * 0.14), heady = by - Math.round(0.90 * k);
    var handx = x0 + Math.round(L * 0.04), handy = by - Math.round(0.96 * k);
    var tw = Math.max(2, Math.round(0.05 * k)), tw2 = Math.max(1, tw - 1);
    lifeLimb(bbx, bby, headx, heady, tw, tw, frame);
    lifeLimb(bbx, bby, seatx, seaty, tw, tw, frame);
    lifeLimb(bbx, bby, rx, gy, tw, tw2, frameDk);
    lifeLimb(headx, heady, fx, gy, tw, tw2, frameDk);
    lifeLimb(headx, heady, handx, handy, tw2, tw2, frameDk);
    tramWheel(fx, gy, rr, tire, hub, tire); tramWheel(rx, gy, rr, tire, hub, tire);
    var bskw = Math.max(3, Math.round(L * 0.20)), bskx = x0 - Math.round(L * 0.05), bsky0 = by - Math.round(1.06 * k), bsky1 = by - Math.round(0.80 * k);
    rect(bskx, bsky0, bskw, bsky1 - bsky0, frame);
    hline(bskx, bskx + bskw - 1, bsky0, frameLt);
    vline(bskx, bsky0, bsky1 - 1, frameDk); vline(bskx + bskw - 1, bsky0, bsky1 - 1, frameDk);
    lifeLimb(handx, handy, bskx + Math.round(bskw * 0.6), bsky1, tw2, 1, frameDk);
    var cS = C('#8a6a3f'), cH = C('#26292d'), cT = C('#3d4a63'), cTd = C('#2c3840'), cB = C('#151719'), cBd = C('#0f1213'), cSh = C('#151719');
    var hipx = seatx, hipy = seaty - Math.round(0.02 * k), shx = hipx - Math.round(0.12 * k), shy = hipy - Math.round(0.42 * k);
    var kx2 = bbx + Math.round(0.05 * k), ky2 = bby - Math.round(0.05 * k), pex = bbx + Math.round(0.03 * k), pey = bby - Math.round(0.15 * k);
    lifeLimb(hipx, hipy, kx2, ky2, Math.max(2, Math.round(0.055 * k)), Math.max(1, Math.round(0.045 * k)), cB);
    lifeLimb(kx2, ky2, pex, pey, Math.max(1, Math.round(0.045 * k)), Math.max(1, Math.round(0.035 * k)), cBd);
    px(pex, pey, cSh);
    var kx1 = bbx - Math.round(0.03 * k), ky1 = hipy + Math.round(0.16 * k), gx = bbx + Math.round(0.08 * k);
    lifeLimb(hipx, hipy, kx1, ky1, Math.max(2, Math.round(0.065 * k)), Math.max(1, Math.round(0.05 * k)), cBd);
    lifeLimb(kx1, ky1, gx, by, Math.max(1, Math.round(0.05 * k)), Math.max(1, Math.round(0.04 * k)), cB);
    px(gx, by, cSh);
    var t0 = Math.round(shy), t1 = hipy, r, fr, w, a, b;
    for (r = t0; r <= t1; r++) {
      fr = (r - t0) / Math.max(1, t1 - t0); w = 0.30 * k - 0.07 * k * fr;
      a = Math.round(hipx - (hipx - shx) * (1 - fr) - w * 0.5); b = Math.round(a + w);
      hline(a, b, r, fr > 0.75 ? cTd : cT);
    }
    lifeLimb(shx, shy, handx, handy, Math.max(1, Math.round(0.055 * k)), Math.max(1, Math.round(0.045 * k)), cTd);
    var nkw = Math.max(1, Math.round(0.05 * k)), nkh = Math.max(1, Math.round(0.06 * k));
    rect(Math.round(shx - nkw / 2), t0 - nkh, nkw, nkh + 1, cS);
    var hr = Math.max(2, Math.round(0.115 * k)), hcx = shx, hcy = t0 - nkh - hr;
    disc(hcx, hcy, hr, cS);
    hline(hcx - hr, hcx + hr - 1, hcy - hr, cH);
  }
  function lifeTreeWalker(y) {
    var h = mpx(1.7, y), v = mpx(1.3, y), d = ((clock + 7.5) % 47) * v, x = TREEX + u(4) + d, sx, rim;
    if (x > 4 * W + h) return;
    sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    rim = lifeRim(sx, h * 0.09);
    lifeFoot(sx, y, h, rim);
    lifeSide(sx, y, h, 1, (d / (0.764 * h)) % 1, LIFE_FOLK[6], rim, 0);
  }
  function lifeSit(x, y, k, s, rim) {
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
  }
  function lifePair(y) {
    var k = (y - HZ) / 2.5, sx = sxOf(3.22 * W, 1), rim = lifeRim(sx, 0.55 * k);
    if (sx < -60 || sx > W + 60) return;
    lifeSit(sx - Math.round(0.34 * k), y, k, LIFE_FOLK[7], rim);
    lifeSit(sx + Math.round(0.34 * k), y + 1, k, LIFE_FOLK[1], rim);
  }
  function lifeDog(x, y, dir, k, rim) {
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
  }
  function lifeDogWalk(y) {
    var k = (y - HZ) / 2.5, sx = sxOf(2.87 * W, 1), dx = sx + Math.round(1.25 * k), rim = lifeRim(sx, 0.15 * k);
    if (sx < -60 || sx > W + 100) return;
    lifeFoot(sx, y, 1.7 * k, rim);
    lifeContact(dx, y, 0.3 * k);
    if (rim) lifeCast(dx - Math.round(0.3 * k), y, Math.round(0.6 * k), Math.round(0.5 * k), 0.22);
    var hand = lifeSide(sx, y, 1.7 * k, 1, -1, LIFE_FOLK[4], rim, 3);
    var col = lifeDog(dx, y, -1, k, rim), i, n = Math.max(8, Math.round(col[0] - hand[0])), f, c = C('#7e3226');
    for (i = 0; i <= n; i++) { f = i / n; px(Math.round(hand[0] + (col[0] - hand[0]) * f), Math.round(hand[1] + (col[1] - hand[1]) * f + 0.12 * k * 4 * f * (1 - f)), c); }
  }
  function lifeBench(x, yb, s, rim) {
    var k = (yb - HZ) / 2.5, dr = (yb - HZ) * (yb - HZ) / (2.5 * W), i, r, fr, w, a, b, g;
    var sk = LIFE_SKIN[s.skin], cS = C(sk[1]), cSd = C(sk[0]), cH = C(s.hair), cHl = C(s.hl), cT = C(s.top[1]), cTd = C(s.top[0]), cTl = C(s.top[2]), cB = C(s.bot[1]), cBd = C(s.bot[0]), cBl = C(s.bot[2]), cSh = C(s.shoe);
    var ys = yb - 0.45 * k, yl = Math.round(ys - 0.13 * k), yk = Math.round(yb + 0.42 * dr - 0.53 * k), yu = Math.round(yb + 0.42 * dr - 0.40 * k);
    var yf = Math.round(yb + 0.55 * dr), sh = Math.max(2, Math.round(0.08 * k)), ysho = Math.round(ys - 0.58 * k), yh = Math.round(ys - 0.84 * k);
    for (r = ysho; r <= yl + 2; r++) {
      fr = (r - ysho) / (yl - ysho); w = k * (0.40 - 0.07 * Math.min(1, fr * 1.3)) - Math.max(0, 3 - r + ysho) * 2;
      a = Math.round(x - w / 2); b = Math.round(x + w / 2);
      hline(a, b, r, fr > 0.72 ? cTd : cT);
      lifeEdge(a, b, r, rim, cTl);
    }
    hline(Math.round(x - 0.13 * k), Math.round(x + 0.13 * k), ysho, rim ? cTl : cT);
    for (i = -1; i <= 1; i += 2) {
      lifeLimb(x + i * 0.18 * k, ysho + 0.05 * k, x + i * 0.21 * k, ys - 0.25 * k, 0.09 * k, 0.085 * k, cT);
      lifeLimb(x + i * 0.14 * k, ysho + 0.09 * k, x + i * 0.165 * k, ys - 0.27 * k, 1, 1, cTd);
      if (rim === 2 || rim === i) lifeLimb(x + i * 0.225 * k, ysho + 0.06 * k, x + i * 0.255 * k, ys - 0.27 * k, 1, 1, cTl);
    }
    for (i = -1; i <= 1; i += 2) {
      lifeLimb(x + i * 0.15 * k, yk + 0.06 * k, x + i * 0.13 * k, yf - sh + 1, 0.12 * k, 0.085 * k, cBd);
      lifeLimb(x + i * 0.16 * k, yk + 0.06 * k, x + i * 0.14 * k, yf - sh + 1, 0.10 * k, 0.065 * k, cB);
      a = Math.round(x + i * 0.135 * k - 0.06 * k);
      rect(a, yf - sh + 1, Math.round(0.12 * k), sh, cSh);
      hline(a, a + Math.round(0.12 * k) - 1, yf, cBd);
      lifeContact(x + i * 0.135 * k, yf, 0.07 * k);
    }
    for (r = yl; r <= yu; r++) {
      fr = (r - yl) / (yu - yl); w = k * (0.36 + 0.10 * Math.min(1, fr * 1.6));
      a = Math.round(x - w / 2); b = Math.round(x + w / 2);
      hline(a, b, r, r === yu ? cBd : r < yk ? cBl : cB);
      if (fr > 0.3) { g = Math.max(1, Math.round(0.05 * k * (fr - 0.3) / 0.7)); hline(Math.round(x - g / 2), Math.round(x - g / 2) + g - 1, r, cBd); }
    }
    var bw = Math.round(0.30 * k), bh = Math.round(0.14 * k), bx = Math.round(x - bw / 2), by0 = Math.round(ys - 0.49 * k);
    for (i = -1; i <= 1; i += 2) lifeLimb(x + i * 0.21 * k, ys - 0.25 * k, x + i * 0.14 * k, by0 + 0.08 * k, 0.085 * k, 0.07 * k, cTd);
    rect(bx, by0, bw, bh, C('#4a555e'));
    hline(bx + 1, bx + bw - 2, by0, C('#d9b48c'));
    vline(bx + (bw >> 1), by0, by0 + bh - 1, C('#26292d'));
    for (i = -1; i <= 1; i += 2) rect(Math.round(x + i * 0.15 * k - 0.035 * k), by0 + Math.round(0.03 * k), Math.round(0.07 * k), Math.round(0.08 * k), cS);
    var n = Math.round(0.23 * k), hw = 0.155 * k, nk = Math.round(0.075 * k);
    rect(Math.round(x - nk / 2), yh + n - 2, nk, ysho - yh - n + 3, cSd);
    for (r = 0; r < n; r++) {
      fr = (r + 0.5) / n; w = hw * Math.sqrt(Math.max(0.2, 1 - (2 * fr - 1) * (2 * fr - 1)));
      a = Math.round(x - w / 2); b = Math.round(x + w / 2);
      hline(a, b, yh + r, fr < 0.5 ? cH : cSd);
      if (fr >= 0.5 && fr < 0.75) { px(a, yh + r, cH); px(b, yh + r, cH); }
      if (fr > 0.52 && fr < 0.7) { px(a - 1, yh + r, cSd); px(b + 1, yh + r, cSd); }
      if (r === 0 && rim) hline(a + 1, b - 1, yh, cHl);
      else if (fr < 0.5) lifeEdge(a, b, yh + r, rim, cHl);
    }
  }
  function lifeSitter(yb) {
    var k = (yb - HZ) / 2.5, sx = sxOf(2.22 * W + 0.42 * k, 1), rim = lifeRim(sx, 0.25 * k);
    if (sx < -80 || sx > W + 80) return;
    if (rim) lifeCast(Math.round(sx - 0.22 * k), yb, Math.round(0.44 * k), Math.round(1.3 * k), 0.22);
    lifeBench(sx, yb, LIFE_FOLK[3], rim);
  }
  function lifeRunner(y) {
    var h = mpx(1.7, y), v = mpx(2.8, y), d = ((clock + 24) % 40) * v, x = TREEX + u(6) + d, sx, rim;
    if (x > 4 * W + h) return;
    sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    rim = lifeRim(sx, h * 0.1);
    lifeFoot(sx, y, h, rim);
    lifeSide(sx, y, h, 1, (d / (h * 0.41 / 0.35)) % 1, LIFE_FOLK[5], rim, 4);
  }
  function lifeLamp(x0, by, k, dir, Lp, q, c, c2) {
    var a = Math.round(q[0] * k), b = Math.max(a + 1, Math.round(q[1] * k)) - 1, y0 = by - Math.round(q[3] * k), y1 = by - Math.round(q[2] * k);
    if (dir < 0) { var s = Lp - 1 - b; b = Lp - 1 - a; a = s; }
    rect(x0 + a, y0, b - a + 1, Math.max(1, y1 - y0), c);
    hline(x0 + a, x0 + b, y0, c2);
  }
  function lifeCar(x0, by, dir, v, col, lit, brake) {
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
  }
  function lifeBoxes(sx, y) {
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
  }
  function lifeWorker(vanX, y) {
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
  }
  function lifeCommuter(rear, cy, y) {
    var h = mpx(1.7, y), v = mpx(1.3, y), xs = rear + 0.05 * W, d = ((clock + (xs - rear + mpx(0.6, cy)) / v) % 41) * v, x = xs - d, sx;
    if (x < -0.05 * W) return;
    sx = sxOf(x, 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, -1, (d / (0.764 * h)) % 1, LIFE_FOLK[0], 0, 0);
  }
  function lifeRider(y) {
    var h = mpx(1.7, y), sx = sxOf(0.72 * W + mpx(1.1, y), 1);
    if (sx < -40 || sx > W + 40) return;
    lifeContact(sx, y, h * 0.14);
    lifeSide(sx, y, h, 1, -1, LIFE_FOLK[1], 0, 2);
  }
  function lifeTiny(x, y, h, ph, s) {
    var hh = Math.max(2, Math.round(h * 0.15)), top = Math.round(y - h), hip = Math.round(y - h * 0.47), bw = Math.max(2, Math.round(h * 0.16));
    var f = ph < 0 ? 0.5 : Math.sin(ph * 2 * Math.PI) * h * 0.12;
    lifeLimb(x, hip, x + f, y, 1, 1, C(s.bot[0]));
    lifeLimb(x, hip, x - f, y, 1, 1, C(s.bot[1]));
    rect(x - (bw >> 1), top + hh, bw, hip - top - hh + 1, C(s.top[1]));
    rect(x - (hh >> 1), top, hh, hh, C(LIFE_SKIN[s.skin][1]));
    hline(x - (hh >> 1), x - (hh >> 1) + hh - 1, top, C(s.hair));
    return [x, hip];
  }
  function lifeArm(sx, sy, h, dir, an, c, cs, carry) {
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
  }
  function lifeLeg(hx, hy, ax, y, lift, h, dir, c, cs) {
    var ay = y - lift - h * 0.04, lb = h * 0.235, vx = ax - hx, vy = ay - hy, D = Math.sqrt(vx * vx + vy * vy) || 1, bb = lb * lb - D * D / 4, lw = Math.max(2, h * 0.072);
    bb = bb > 0 ? Math.sqrt(bb) : 0;
    var kx = (hx + ax) / 2 + dir * vy / D * bb, ky = (hy + ay) / 2 - dir * vx / D * bb;
    lifeLimb(hx, hy, kx, ky, lw * 1.2, lw, c);
    lifeLimb(kx, ky, ax, ay, lw, lw * 0.75, c);
    var sl = Math.max(3, Math.round(h * 0.135)), sh = Math.max(1, Math.round(h * 0.04)), x0 = Math.round(ax - dir * h * 0.04);
    rect(dir > 0 ? x0 : x0 - sl + 1, Math.round(y - lift) - sh + 1, sl, sh, cs);
  }
  function lifeSide(x, y, h, dir, ph, s, rim, carry) {
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
  }
  function lifeFoot(sx, y, h, rim) {
    lifeContact(sx, y, h * 0.14);
    if (rim) lifeCast(Math.round(sx - h * 0.09), y, Math.max(2, Math.round(h * 0.18)), Math.round(h), 0.24);
  }
  function lifeCast(bx, by, ow, oh, a0) {
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
  }
  function lifeContact(x, y, hw) {
    var a = Math.round(x - hw), b = Math.round(x + hw), i;
    for (i = a; i <= b; i++) { shade(i, y + 1, 0.30); if (i > a && i < b) shade(i, y + 2, 0.14); }
  }
  function lifeEdge(a, b, y, rim, c) { if (rim > 0) px(b, y, c); if (rim < 0 || rim === 2) px(a, y, c); }
  function lifeRim(sx, hw) {
    return sunE > u(9) ? (Math.abs(sx - sunX) <= hw ? 2 : sx < sunX ? 1 : -1) : 0;
  }
  function lifeProf(p, m) {
    for (var i = 2; i < p.length; i += 2) if (m <= p[i]) return p[i - 1] + (p[i + 1] - p[i - 1]) * (m - p[i - 2]) / Math.max(1e-6, p[i] - p[i - 2]);
    return p[p.length - 1];
  }
  function lifeLimb(x0, y0, x1, y1, w0, w1, c) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))), k, f, w, a, vert = Math.abs(dy) >= Math.abs(dx);
    if (n < 1) n = 1;
    for (k = 0; k <= n; k++) {
      f = k / n; w = Math.max(1, Math.round(w0 + (w1 - w0) * f));
      if (vert) { a = Math.round(x0 + dx * f - w / 2); hline(a, a + w - 1, Math.round(y0 + dy * f), c); }
      else { a = Math.round(y0 + dy * f - w / 2); vline(Math.round(x0 + dx * f), a, a + w - 1, c); }
    }
  }
function draw() {
    if (!buf) { owed = true; return; }
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
function tick() { var f = camX < 1.25 * W; clock += f ? 1 / 30 : 0.1; draw(); if (f !== fast) { clearInterval(timer); timer = null; sync(); } }
function sync() {
    var want = ambient && !dead && visible && !env.reduce;
    if (want && !timer) { fast = camX < 1.25 * W; timer = setInterval(tick, fast ? 1000 / 30 : 100); }
    else if (!want && timer) { clearInterval(timer); timer = null; }
  }
function onVis() { visible = document.visibilityState !== 'hidden'; sync(); }
function onResize() { clearTimeout(rt); rt = setTimeout(function () { if (!dead) { env = readEnv(canvas); size(); camX = Math.round(progress * (WORLD - W)); t = progress; draw(); } }, 160); }
function adopt(b) {
    if (dead || buf || b.byteLength !== W * H * 4) return;
    img = new ImageData(new Uint8ClampedArray(b), W, H); buf = new Uint32Array(b);
    if (owed) { owed = false; draw(); }
  }
  size();
  camX = Math.round(progress * (WORLD - W)); t = progress;
  draw();
  if (!present) { document.addEventListener('visibilitychange', onVis); addEventListener('resize', onResize); }
  return {
    set: function (o) {
      if (dead) return;
      var p = cl01(o && o.progress !== undefined ? o.progress : progress);
      progress = p; camX = Math.round(p * (WORLD - W)); t = p;
      var k = camX * 16 + Math.round(t * 12);
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
function readEnv(canvas) {
  var mm = typeof matchMedia === 'function';
  return {
    vw: window.innerWidth || (canvas && canvas.clientWidth) || 320, vh: window.innerHeight || (canvas && canvas.clientHeight) || 240,
    dpr: window.devicePixelRatio || 1, coarse: mm && matchMedia('(pointer: coarse)').matches,
    reduce: mm && matchMedia('(prefers-reduced-motion: reduce)').matches, visible: document.visibilityState !== 'hidden'
  };
}
function dims(env) {
  var pw = Math.round(Math.max(120, env.vw) * env.dpr), ph = Math.round(Math.max(100, env.vh) * env.dpr);
  var cap = env.coarse ? 1.6e6 : 3.8e6, s = 1;
  while ((pw / s) * (ph / s) > cap) s++;
  return { s: s, W: Math.max(120, Math.ceil(pw / s)), H: Math.max(90, Math.ceil(ph / s)) };
}
function stub() {
  return { set: function () {}, resize: function () {}, setAmbient: function () {}, destroy: function () {}, stops: [0, 1 / 3, 2 / 3, 1], progress: 0, frames: 0, ambient: false, mode: 'none', info: { scale: 0, W: 0, H: 0, WORLD: 0, camX: 0, t: 0, U: 0 } };
}
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
    if (live) core = mount(canvas, { progress: progress });
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
    if (m.W === d.W && m.H === d.H && m.s === d.s) {
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

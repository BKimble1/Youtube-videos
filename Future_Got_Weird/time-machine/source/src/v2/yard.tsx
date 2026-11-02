// V2 yard: the astronaut's HOME and its street in side elevation, one place seen across decades (D = 0 the day he
// left, D = 1 the day he returns) and seasons (season 0..1 cycles spring blossom -> summer -> autumn -> winter -> spring).
// The house, its door and family-room window, the tree, the fence and gate and the camera direction never move; time
// shows through the tree (it grows from a staked sapling into a big tree), the seasons, the city beyond the rooftops
// (low blocks rising into slender towers, flying pods late), the wear on the house (faded paint, a crack, moss, ivy,
// stains, peeling, a sagging gutter) and props (antenna -> solar panels, the lamp and the porch light modernise, the
// car evolves).
// Weird Crew finish: flat fills, one ink outline (OUT) per part, one cel-shadow shape per part (key light from the upper
// left), the crew palette, no text or numerals anywhere.
//
// Depth is a cabinet-style 2.5D: ground depth maps to screen height. The house front stands on HB (the back edge of the
// front lawn), so the lawn and the path read in depth above the fence; the fence stands on FB just behind figures
// standing on the ground line G (= 1600, as in art/house.tsx). Figures are drawn by the integrator at scale 0.62.
//
// YardForeground is drawn in SCREEN coordinates on top of the camera-transformed world: a big foreground trunk and a
// leaf mass, each tied to a world x with parallax factor 2.2, for concealing the time jumps while the camera trucks.
import React from 'react';
import {mix, rgba, shade} from '../core/color';
import {closed, open, P, tube} from '../core/geo';
import {clamp, hash, lerp, noise1, sm, ss} from '../lib';
import {C, INK, OUT} from '../art/crew';
import {Building, makeSkyline, Pod, skyBot, skyTop} from '../art/city';
import {Car, G} from '../art/house';

// =====================================================================================================================
// geometry (world px)
// =====================================================================================================================
const HB = G - 220; // house front base = back edge of the front lawn (1380)
const FB = G - 12; // fence line (1588)
const FENCE_H = 110;
const WX0 = -1800, WX1 = 4000; // horizontal extent of the drawn world

export const YARD = {
  G,
  /** the house front stands on this line (the back edge of the front lawn) */
  houseBase: HB,
  /** posts and pickets stand on this line */
  fenceY: FB,
  fenceH: FENCE_H,
  house: {x0: 1330, x1: 1980, base: HB, floor: HB - 340, wallTop: HB - 680, roofTop: HB - 870},
  /** front door (y0 top, y1 threshold); hinged on its right edge, swings inward */
  door: {x: 1450, w: 130, h: 300, y0: HB - 300, y1: HB, cx: 1515, hingeX: 1580},
  porch: {x0: 1424, x1: 1606, y0: HB, y1: HB + 24},
  /** the family-room window (glass area) */
  window: {x0: 1640, x1: 1880, y0: HB - 305, y1: HB - 125, cx: 1760, cy: HB - 215},
  /** V3: the same window in the room's proportions (380:520) and panes (centre mullion, transom at 31%), for the inside/outside match */
  windowV3: {x0: 1676, x1: 1844, y0: HB - 350, y1: HB - 120, cx: 1760, cy: HB - 235, transom: HB - 350 + 71},
  /** the familiar tree (trunk base); its size for any D: yardTree(D) */
  tree: {x: 860, y: HB + 62},
  /** the gate panel spans x .. x + w on the fence line; hinged on its left edge, swings into the yard */
  gate: {x: 1120, w: 110, h: FENCE_H, y: FB, hingeX: 1120, cx: 1175, postL: 1107, postR: 1243, archY: FB - 330, archTop: FB - 330 - 81},
  fence: {x0: 470, x1: 1990, y: FB, h: FENCE_H},
  /** the garden path: gate threshold -> porch step (feet positions along it: yardPath(u)) */
  path: {x0: 1175, y0: G, x1: 1515, y1: HB + 26},
  pavement: {y0: FB, y1: G + 40},
  /** the street band; the capsule lands at landX; x clear.x0..clear.x1 of the street is kept free of props */
  street: {y0: G + 40, y1: G + 420, landX: 875, clear: {x0: 700, x1: 1050}},
  lamp: {x: 520},
  car: {x: 300},
  /** where the two stand at the gate for the close two-shot (feet on G) */
  reunion: {astroX: 1140, friendX: 1267, y: G},
  figScale: 0.62,
};

const rad = (d: number) => (d * Math.PI) / 180;
const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const wrap01 = (x: number) => x - Math.floor(x);
const wrapR = (x: number, a: number, b: number) => a + wrap01((x - a) / (b - a)) * (b - a);
/** periodic distance between season s and centre c */
const pd = (s: number, c: number) => {
  const d = Math.abs(wrap01(s) - c);
  return Math.min(d, 1 - d);
};
/** 1 within `full` of centre c on the season circle, 0 beyond `zero` (smooth in between) */
const bump = (s: number, c: number, full: number, zero: number) => 1 - ss(pd(s, c), full, zero);
/** periodic keyed colour (keys from 0 to 1, last = first) */
const cyc = (s: number, keys: [number, string][]) => {
  const x = wrap01(s);
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, ca] = keys[i], [b, cb] = keys[i + 1];
    if (x >= a && x <= b) return mix(ca, cb, sm((x - a) / (b - a || 1)));
  }
  return keys[keys.length - 1][1];
};
const qpt = (a: P, c: P, b: P, u: number): P => ({
  x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
});
const cpt = (a: P, b: P, c: P, d: P, u: number): P => {
  const v = 1 - u;
  return {x: v * v * v * a.x + 3 * v * v * u * b.x + 3 * v * u * u * c.x + u * u * u * d.x, y: v * v * v * a.y + 3 * v * v * u * b.y + 3 * v * u * u * c.y + u * u * u * d.y};
};

// =====================================================================================================================
// seasons
// =====================================================================================================================
const LEAF_KEYS: [number, string][] = [
  [0, '#A3CF6E'], [0.12, '#9CCB66'], [0.2, '#86C05A'], [0.3, '#56A04F'], [0.44, '#4E9A4A'], [0.5, '#E3B53A'], [0.57, '#E8892C'],
  [0.66, '#C9592A'], [0.75, '#9A5B36'], [0.86, '#9A5B36'], [0.93, '#A8CF72'], [1, '#A3CF6E'],
];
const LAWN_KEYS: [number, string][] = [
  [0, '#8DC765'], [0.25, '#74B55A'], [0.45, '#86B259'], [0.58, '#A9B35C'], [0.7, '#9EA56C'], [0.82, '#95A27E'], [0.92, '#86C063'], [1, '#8DC765'],
];
const HEDGE_KEYS: [number, string][] = [[0, '#4E9455'], [0.3, '#3E8049'], [0.55, '#5C8A44'], [0.8, '#3B6B4A'], [1, '#4E9455']];
const AUT = ['#F2C14E', '#E8892C', '#D0542A'];

/** V3: the tree's year as phases on the season circle (0 = spring blossom). Every change is a ramp of >= 0.15 of a
 *  cycle, and nothing appears, vanishes or detaches abruptly: buds scale up on the twig tips into blossom, fresh green
 *  clumps grow from the branches while the blossom drops, the full crown turns colour in place, then thins from its
 *  edges while its leaves fall to the lawn, the bare branches take snow, the snow melts, the buds come again. */
export const PH3 = {
  bud0: 0.8, bud1: 1.02, // buds grow into blossom on the twig tips
  drop0: 0.12, drop1: 0.28, // the blossom drops
  green0: 0.08, green1: 0.26, // fresh green clumps grow from the branches
  turn0: 0.36, turn1: 0.54, // the crown turns yellow, orange, red in place
  thin0: 0.5, thin1: 0.8, // the crown thins from its edges; the leaves fall
  snow0: 0.7, snowPk: 0.84, snow1: 0.98, // snow settles on the bare branches, then melts
  fall: 0.1, // how long (in season) a falling leaf takes to reach the ground
};
/** 0 before a, smooth up to 1 at b, 1 until c, smooth down to 0 at d (positions on the season circle, in that order) */
const win4 = (s: number, a: number, b: number, c: number, d: number, ease: (x: number) => number = sm) => {
  const x = wrap01(s - a), B = wrap01(b - a), Cc = wrap01(c - a), Dd = wrap01(d - a);
  if (x < B) return ease(x / B);
  if (x <= Cc) return 1;
  if (x < Dd) return 1 - ease((x - Cc) / (Dd - Cc));
  return 0;
};
/** an even-paced ease (half smoothstep, half linear) for the crown filling in and thinning, and its inverse */
const easeL = (x: number) => 0.5 * (sm(x) + clamp(x));
const easeLInv = (y: number) => {
  let a = 0, b = 1;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (easeL(m) < y) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
/** V3 leaf colours: fresh spring green, deep summer green, then yellow, orange, red and brown before the leaves drop */
const LEAF_KEYS_V3: [number, string][] = [
  [0, '#A8D373'], [0.12, '#A3CF6E'], [0.26, '#7DBB5A'], [0.36, '#5AA350'], [0.42, '#4E9A4A'], [0.47, '#A0B83F'], [0.51, '#E3B53A'],
  [0.55, '#E8892C'], [0.6, '#CC5B2A'], [0.68, '#A85A33'], [0.76, '#9A5B36'], [0.86, '#9A5B36'], [0.92, '#A8D373'], [1, '#A8D373'],
];

/** everything the season drives, as continuous weights and colours. v3: the V3 year (PH3) with the V3 tree */
export const seasonLook = (season: number, smooth = 1, v3 = false) => {
  const s = wrap01(season);
  if (v3) {
    const P = PH3;
    const blossom = BUD_COVER.inv(win4(s, P.bud0, P.bud1, P.drop0, P.drop1, easeL));
    // the crown's (and the blossom's) visible cover follows the season evenly (the cover tables undo the clumps' overlap)
    const leafAmt = LEAF_COVER.inv(win4(s, P.green0, P.green1, P.thin0, P.thin1, easeL));
    const snow = win4(s, P.snow0, P.snowPk, P.snowPk, P.snow1);
    const autumn = win4(s, P.turn0, P.turn1, P.thin1, P.thin1 + 0.12);
    const leaf = cyc(s, LEAF_KEYS_V3);
    return {
      s, blossom, bare: 1 - leafAmt, leafAmt, snow, autumn, falling: 0, fallen: 0, leaf,
      leafDark: shade(leaf, 0.32), leafLight: mix(leaf, '#FFF7E6', 0.28),
      lawn: cyc(s, LAWN_KEYS), hedge: cyc(s, HEDGE_KEYS), v3: true as boolean,
    };
  }
  // smooth > 1 widens every season's ramps (a time-lapse that runs fast but never pops)
  const bz = (c: number, full: number, zero: number) => bump(s, c, full, full + (zero - full) * smooth);
  const blossom = bz(0.05, 0.07, 0.17);
  const bare = bz(0.81, 0.05, 0.12);
  const snow = bz(0.81, 0.06, 0.12);
  const autumn = bz(0.57, 0.07, 0.15);
  const falling = bz(0.6, 0.08, 0.15);
  const fallen = bz(0.66, 0.08, 0.15);
  const leaf = cyc(s, LEAF_KEYS);
  return {
    s, blossom, bare, leafAmt: 1 - bare, snow, autumn, falling, fallen, leaf,
    leafDark: mix(shade(leaf, 0.32), '#C47A93', blossom), leafLight: mix(mix(leaf, '#FFF7E6', 0.28), '#FCD9E4', blossom),
    lawn: cyc(s, LAWN_KEYS), hedge: cyc(s, HEDGE_KEYS), v3: false as boolean,
  };
};
export type Season = ReturnType<typeof seasonLook>;

// =====================================================================================================================
// the tree
// =====================================================================================================================
type Bdef = {p: number; u: number; ang: number; len: number; w0: number; w1: number; bend: number; lvl: number};
/** branch skeleton of the full-grown tree (base at 0,0; ang 0 = up, + = right); index 0 is the trunk */
const BR_DEF: Bdef[] = [
  {p: -1, u: 0, ang: -1, len: 430, w0: 78, w1: 46, bend: 12, lvl: 0},
  {p: 0, u: 1, ang: 3, len: 400, w0: 44, w1: 12, bend: -10, lvl: 1},
  {p: 0, u: 0.93, ang: -54, len: 330, w0: 34, w1: 9, bend: -26, lvl: 1},
  {p: 0, u: 0.98, ang: 56, len: 320, w0: 30, w1: 8, bend: 26, lvl: 1},
  {p: 2, u: 0.55, ang: -82, len: 200, w0: 14, w1: 4, bend: 18, lvl: 2},
  {p: 2, u: 0.82, ang: -16, len: 160, w0: 11, w1: 4, bend: -10, lvl: 2},
  {p: 1, u: 0.45, ang: -42, len: 190, w0: 14, w1: 4, bend: -14, lvl: 2},
  {p: 1, u: 0.68, ang: 40, len: 190, w0: 12, w1: 4, bend: 14, lvl: 2},
  {p: 3, u: 0.55, ang: 84, len: 190, w0: 12, w1: 4, bend: -16, lvl: 2},
  {p: 3, u: 0.8, ang: 14, len: 160, w0: 10, w1: 3.5, bend: 10, lvl: 2},
  {p: 1, u: 0.95, ang: -10, len: 120, w0: 9, w1: 3, bend: 6, lvl: 2},
  {p: 2, u: 0.3, ang: -20, len: 150, w0: 12, w1: 3.5, bend: 8, lvl: 2},
  {p: 3, u: 0.3, ang: 22, len: 150, w0: 11, w1: 3.5, bend: -8, lvl: 2},
  {p: 1, u: 0.25, ang: 58, len: 170, w0: 12, w1: 4, bend: 10, lvl: 2},
  {p: 1, u: 0.82, ang: -48, len: 140, w0: 9, w1: 3, bend: -6, lvl: 2},
];
type Br = {a: P; c: P; b: P; w0: number; w1: number; lvl: number; ang: number};
const BRANCHES: Br[] = (() => {
  const out: Br[] = [];
  const mk = (a: P, ang: number, len: number, bend: number) => {
    const b = {x: a.x + Math.sin(rad(ang)) * len, y: a.y - Math.cos(rad(ang)) * len};
    const m = {x: (a.x + b.x) / 2 + Math.cos(rad(ang)) * bend, y: (a.y + b.y) / 2 + Math.sin(rad(ang)) * bend};
    return {b, c: m};
  };
  BR_DEF.forEach((d) => {
    const a = d.p < 0 ? {x: 0, y: 0} : qpt(out[d.p].a, out[d.p].c, out[d.p].b, d.u);
    const {b, c} = mk(a, d.ang, d.len, d.bend);
    out.push({a, c, b, w0: d.w0, w1: d.w1, lvl: d.lvl, ang: d.ang});
  });
  // twigs off the limbs and every level-2 branch (seen when the tree is bare)
  BR_DEF.forEach((d, i) => {
    if (d.lvl < 1) return;
    const br = out[i];
    const tw: number[][] = d.lvl === 1 ? [[0.4, 40, 80], [0.62, -38, 74], [0.85, 30, 66]] : [[0.4, 34, 54], [0.55, -32, 70], [1, 20, 62], [0.8, 38, 52], [0.95, -26, 48]];
    tw.forEach(([u, da, l], k) => {
      const a = qpt(br.a, br.c, br.b, u);
      const {b, c} = mk(a, d.ang + da, l * (0.85 + 0.3 * hash(i * 5 + k)), 6 * (k % 2 ? 1 : -1));
      out.push({a, c, b, w0: d.lvl === 1 ? 5 : 3.6, w1: 1.4, lvl: 3, ang: d.ang + da});
    });
  });
  return out;
})();
/** canopy blobs of the full-grown tree [x, y, r] */
const CANOPY: [number, number, number][] = [
  [0, -780, 190], [-200, -720, 165], [200, -705, 165], [-330, -610, 125], [330, -600, 125], [-120, -890, 150], [135, -880, 145],
  [0, -610, 165], [-215, -560, 115], [225, -550, 115], [-50, -975, 105], [85, -985, 95], [-365, -720, 95], [370, -715, 95],
  [-90, -540, 110], [100, -530, 105],
];
/** the tree's size at D: k scales positions, wk scales widths; canopy = its bounding ellipse in world px */
export const yardTree = (D: number) => {
  const g = Math.pow(clamp(D), 0.8);
  const k = lerp(0.3, 0.92, g);
  const wk = lerp(0.18, 1, Math.pow(g, 1.15));
  const {x, y} = YARD.tree;
  return {g, k, wk, x, y, height: 1080 * k, trunkW: 78 * wk, canopy: {cx: x, cy: y - 760 * k, rx: 465 * k, ry: 320 * k, bottom: y - 425 * k, top: y - 1080 * k}};
};

/** outline of a tapered, curved branch */
const branchPath = (b: Br, k: number, wk: number, ox: number, oy: number) => {
  const N = 8;
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = qpt(b.a, b.c, b.b, u);
    const p2 = qpt(b.a, b.c, b.b, Math.min(1, u + 0.02)), p1 = qpt(b.a, b.c, b.b, Math.max(0, u - 0.02));
    const tx = p2.x - p1.x, ty = p2.y - p1.y, tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    const w = (lerp(b.w0, b.w1, u) * wk) / 2;
    const ww = Math.max(w, b.lvl === 3 ? 0.7 : 1.2);
    L.push({x: ox + p.x * k + nx * ww, y: oy + p.y * k + ny * ww});
    R.push({x: ox + p.x * k - nx * ww, y: oy + p.y * k - ny * ww});
  }
  const e = qpt(b.a, b.c, b.b, 1);
  const tip = {x: ox + e.x * k + Math.sin(rad(b.ang)) * lerp(b.w0, b.w1, 1) * wk * 0.4, y: oy + e.y * k - Math.cos(rad(b.ang)) * lerp(b.w0, b.w1, 1) * wk * 0.4};
  return closed([...L, tip, ...R.reverse()], 0.7);
};

const BARK = '#8A5A3B', BARK_SH = '#6A4330';

// ---- V3 crown --------------------------------------------------------------------------------------------------------
// Leaf clumps and blossom clusters sit ON the branch skeleton (twig tips, branch tips, points along the limbs), so they
// only ever grow or shrink in place and never float free. Clumps nearer the crown's edge go first in autumn.
type Clump = {x: number; y: number; r: number; e: number; h: number; i: number};
const CANOPY_E = {x: 0, y: -760, rx: 465, ry: 320};
const canopyDepth = (x: number, y: number) => Math.max(...CANOPY.map(([bx, by, r]) => r - Math.hypot(x - bx, y - by)));
const edgeOf = (x: number, y: number, i: number) => clamp(0.88 * Math.hypot((x - CANOPY_E.x) / CANOPY_E.rx, (y - CANOPY_E.y) / CANOPY_E.ry) + (hash(i * 4.7 + 2) - 0.5) * 0.24);
const V3_CLUMPS: Clump[] = (() => {
  const pts: P[] = [];
  BRANCHES.forEach((b) => {
    const us = b.lvl === 3 ? [1] : b.lvl === 2 ? [0.55, 1] : b.lvl === 1 ? [0.7, 1] : [];
    us.forEach((u) => pts.push(qpt(b.a, b.c, b.b, u)));
  });
  // e: how far the clump reaches toward the crown's outline (its far side, in the crown's ellipse metric), so the
  // clumps that make the outline go first and the crown visibly thins from its edges
  const raw = pts.map((p, i) => {
    const r = clamp(52 + 0.62 * canopyDepth(p.x, p.y), 50, 150);
    const dx = p.x - CANOPY_E.x, dy = p.y - CANOPY_E.y, dl = Math.hypot(dx, dy) || 1;
    const reach = Math.hypot((dx + (r * dx) / dl) / CANOPY_E.rx, (dy + (r * dy) / dl) / CANOPY_E.ry);
    return {x: p.x, y: p.y, r, reach, h: hash(i * 2.9 + 5), i};
  });
  const lo = Math.min(...raw.map((q) => q.reach)), hi = Math.max(...raw.map((q) => q.reach));
  return raw
    .map(({reach, ...q}) => ({...q, e: clamp(0.04 + 0.92 * (0.7 * ((reach - lo) / (hi - lo)) + 0.3 * hash(q.i * 4.7 + 2)))}))
    .sort((a, b) => a.e - b.e); // inner clumps first (behind); the crown's edge is drawn last, over them
})();
/** blossom clusters: on every twig tip and branch tip */
const V3_BUDS: Clump[] = (() => {
  const out: Clump[] = [];
  BRANCHES.forEach((b) => {
    if (b.lvl < 2) return;
    const p = qpt(b.a, b.c, b.b, 1);
    const i = out.length;
    out.push({x: p.x, y: p.y, r: b.lvl === 2 ? 74 : 62, e: edgeOf(p.x, p.y, i + 40), h: hash(i * 3.7 + 11), i});
  });
  return out.sort((a, b) => a.y - b.y);
})();
/** inverse of the smoothstep sm on 0..1 */
const smInv = (y: number) => 0.5 - Math.sin(Math.asin(clamp(1 - 2 * y, -1, 1)) / 3);
/** the part of circle (x, y, r) outside the same circle shifted by m*r toward angle ang (degrees): a cel crescent on the
 *  side opposite ang */
const crescent = (x: number, y: number, r: number, ang: number, m: number) => {
  const vx = Math.cos(rad(ang)) * m * r, vy = Math.sin(rad(ang)) * m * r;
  const h = Math.sqrt(Math.max(0, r * r - (m * r * m * r) / 4));
  const nx = -Math.sin(rad(ang)), ny = Math.cos(rad(ang));
  const p1 = {x: x + vx / 2 + h * nx, y: y + vy / 2 + h * ny}, p2 = {x: x + vx / 2 - h * nx, y: y + vy / 2 - h * ny};
  return `M ${f1(p1.x)} ${f1(p1.y)} A ${f1(r)} ${f1(r)} 0 1 1 ${f1(p2.x)} ${f1(p2.y)} A ${f1(r)} ${f1(r)} 0 0 0 ${f1(p1.x)} ${f1(p1.y)} Z`;
};
/** a clump's size (0..1) for the crown's leaf amount: the edge goes first as it thins, the inside first as it fills */
const CL_SPREAD = 0.75, CL_W = 0.25;
const clumpSize = (c: Clump, leafAmt: number) => sm(clamp((leafAmt - CL_SPREAD * c.e) / CL_W));
/** all clumps also slim a little as the crown thins, so gaps open between them from the start */
const crownSlim = (leafAmt: number) => lerp(0.62, 1, leafAmt);
/** how much of the crown (or the blossom) shows, as a strictly increasing function of its amount, sampled once on a
 *  coarse grid; with its inverse. The clumps overlap, so their first shrinking hides behind their neighbours: the
 *  season drives this visible cover evenly, not the raw amount. */
const coverTable = (circles: (L: number) => {x: number; y: number; r: number}[]) => {
  const N = 40;
  const pts: P[] = [];
  for (let y = -1110; y <= -400; y += 22) for (let x = -540; x <= 540; x += 22) pts.push({x, y});
  const counts = Array.from({length: N + 1}, (_, j) => {
    const cs = circles(j / N).filter((c) => c.r > 0);
    return pts.reduce((n, p) => n + (cs.some((c) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 < c.r * c.r) ? 1 : 0), 0);
  });
  const T = counts.map((n, j) => 0.85 * (n / counts[N]) + 0.15 * (j / N));
  const of = (L: number) => {
    const x = clamp(L) * N, i = Math.min(N - 1, Math.floor(x));
    return lerp(T[i], T[i + 1], x - i);
  };
  const inv = (cv: number) => {
    if (cv <= 0) return 0;
    if (cv >= 1) return 1;
    let a = 0, b = 1;
    for (let i = 0; i < 26; i++) {
      const m = (a + b) / 2;
      if (of(m) < cv) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  return {of, inv};
};
const LEAF_COVER = coverTable((L) => V3_CLUMPS.map((c) => ({x: c.x, y: c.y, r: c.r * crownSlim(L) * clumpSize(c, L)})));
/** a blossom cluster's size (0..1, its radius) for the blossom amount: its area grows evenly from a bud */
const BUD_SPREAD = 0.3;
const budSize = (c: Clump, blossom: number) => Math.sqrt(sm(clamp((blossom - BUD_SPREAD * c.h) / (1 - BUD_SPREAD))));
const BUD_COVER = coverTable((B) => V3_BUDS.map((c) => ({x: c.x, y: c.y, r: c.r * 0.95 * budSize(c, B)})));
const clumpColour = (c: Clump, s: number) => cyc(s + (c.h - 0.5) * 0.07, LEAF_KEYS_V3);
const BUD = '#C9547E', PINK = '#F5AFC6', PINK_LT = '#FCDDE7', PINK_SH = '#DE8AA6';
const LEAF_D = 'M 0 -11 Q 9 -2 0 11 Q -9 -2 0 -11 Z';

/** V3: the crown for this season (clumps, blossom), in world coords for the tree at (ox, oy) scaled by k */
const CrownV3: React.FC<{sl: Season; k: number; ox: number; oy: number; ow: number}> = ({sl, k, ox, oy, ow}) => {
  const X = (c: Clump) => ox + c.x * k, Y = (c: Clump) => oy + c.y * k;
  const slim = crownSlim(sl.leafAmt);
  const clumps = sl.leafAmt > 0.001 ? V3_CLUMPS.map((c) => ({c, r: c.r * k * slim * clumpSize(c, sl.leafAmt)})).filter((q) => q.r > 0.4) : [];
  const buds = sl.blossom > 0.001 ? V3_BUDS.map((c) => ({c, q: budSize(c, sl.blossom)})).filter((b) => b.q * b.c.r * k > 0.4) : [];
  return (
    <g>
      {/* leaf clumps: one ink silhouette under all, then each clump with its own cel shadow and light crescent */}
      {clumps.map(({c, r}) => <circle key={`o${c.i}`} cx={f1(X(c))} cy={f1(Y(c))} r={f1(r)} fill={INK} stroke={INK} strokeWidth={ow * 2} />)}
      {clumps.map(({c, r}) => {
        const col = clumpColour(c, sl.s);
        const x = X(c), y = Y(c);
        return (
          <g key={`c${c.i}`}>
            <circle cx={f1(x)} cy={f1(y)} r={f1(r)} fill={col} />
            {r > 3 && <path d={crescent(x, y, r, 225, 0.42)} fill={shade(col, 0.2)} />}
            {r > 3 && c.y < -560 && <path d={crescent(x, y, r * 0.86, 45, 0.36)} transform={`translate(${f1(-r * 0.1)} ${f1(-r * 0.1)})`} fill={mix(col, '#FFF7E6', 0.26)} />}
            {r > 16 && <path d={`M ${f1(x + r * 0.9 * Math.cos(rad(15)))} ${f1(y + r * 0.9 * Math.sin(rad(15)))} A ${f1(r * 0.9)} ${f1(r * 0.9)} 0 0 1 ${f1(x + r * 0.9 * Math.cos(rad(105)))} ${f1(y + r * 0.9 * Math.sin(rad(105)))}`} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.3} strokeLinecap="round" />}
          </g>
        );
      })}
      {/* blossom: buds scale up on the twig tips into pink clusters (opaque), and shrink away as the leaves come */}
      {buds.length > 0 && (() => {
        const lobes = buds.map(({c, q}) => {
          const R = c.r * k * q;
          const a0 = c.h * Math.PI * 2;
          const L = [0, 1, 2].map((j) => ({x: X(c) + Math.cos(a0 + (j * 2 * Math.PI) / 3) * R * 0.42, y: Y(c) + Math.sin(a0 + (j * 2 * Math.PI) / 3) * R * 0.42, r: R * 0.6}));
          return {c, q, R, L: [...L, {x: X(c), y: Y(c), r: R * 0.55}]};
        });
        return (
          <g>
            {lobes.map(({c, L}) => L.map((l, j) => <circle key={`bo${c.i}-${j}`} cx={f1(l.x)} cy={f1(l.y)} r={f1(l.r)} fill={INK} stroke={INK} strokeWidth={ow * 1.5} />))}
            {lobes.map(({c, q, R, L}) => {
              const col = mix(BUD, PINK, ss(q, 0.15, 0.7));
              return (
                <g key={`b${c.i}`}>
                  {L.map((l, j) => <circle key={j} cx={f1(l.x)} cy={f1(l.y)} r={f1(l.r)} fill={col} />)}
                  {R > 4 && L.map((l, j) => <path key={`s${j}`} d={crescent(l.x, l.y, l.r, 225, 0.45)} fill={mix(col, PINK_SH, 0.6)} />)}
                  {R > 4 && <path d={crescent(X(c), Y(c) - R * 0.12, R * 0.5, 45, 0.4)} fill={mix(col, PINK_LT, ss(q, 0.3, 0.8))} />}
                  {q > 0.4 && [0, 1, 2, 3].map((j) => {
                    const a = c.h * 9 + j * 1.9, d = R * (0.2 + 0.18 * (j % 2));
                    const fr = R * 0.12 * ss(q, 0.4, 0.9);
                    return <circle key={`f${j}`} cx={f1(X(c) + Math.cos(a) * d)} cy={f1(Y(c) + Math.sin(a) * d)} r={f1(fr)} fill={j === 3 ? '#E9A91C' : '#FFF4F7'} />;
                  })}
                </g>
              );
            })}
          </g>
        );
      })()}
    </g>
  );
};

/** V3: leaves that leave the thinning crown and fall to the lawn under gravity, lie there until the snow takes them,
 *  and blossom petals that drop as the leaves come (world coords; all a function of the season and the tree size) */
const FallV3: React.FC<{sl: Season; k: number; ox: number; oy: number}> = ({sl, k, ox, oy}) => {
  const P = PH3, s = sl.s;
  const out: React.ReactNode[] = [];
  const ls = 0.55 + 0.5 * k;
  const groundY = (h: number) => HB + 16 + h * (FB - HB - 38);
  const fallTo = (key: string, x0: number, y0: number, sd: number, h: number, fill: string, decay: number, sc: number, edge = INK) => {
    const tau = clamp((s - sd) / P.fall);
    if (s < sd || decay <= 0.01) return;
    const x1 = x0 + (h - 0.3) * 110 * k, y1 = groundY(hash(h * 91.7));
    const x = lerp(x0, x1, sm(tau)) + Math.sin(tau * 8 + h * 20) * 9 * ls * (1 - tau);
    const y = y0 + (y1 - y0) * tau * tau;
    const flat = 1 - 0.5 * ss(tau, 0.8, 1);
    const rot = h * 360 + tau * (h > 0.5 ? 380 : -380);
    out.push(
      <g key={key} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f1(sc * ls * decay)} ${f1(sc * ls * decay * flat)})`}>
        <path d={LEAF_D} fill={fill} stroke={edge} strokeWidth={1.8} strokeLinejoin="round" />
      </g>,
    );
  };
  // autumn leaves: each clump lets go of two leaves as it shrinks (at sizes 0.75 and 0.35)
  if (s > P.thin0 - 0.01 && s < 0.97) {
    const decay = 1 - ss(s, 0.84, 0.95);
    V3_CLUMPS.forEach((c) => {
      [0.75, 0.35].forEach((th, j) => {
        const L = CL_SPREAD * c.e + CL_W * smInv(th);
        if (L >= 1) return;
        const sd = P.thin0 + (P.thin1 - P.thin0) * easeLInv(1 - LEAF_COVER.of(L));
        const h = hash(c.i * 7.1 + j * 3.3);
        const a = h * Math.PI * 2, rr = c.r * k * th * crownSlim(L) * 0.6;
        fallTo(`l${c.i}-${j}`, ox + c.x * k + Math.cos(a) * rr, oy + c.y * k + Math.sin(a) * rr, sd, h, cyc(sd + (c.h - 0.5) * 0.07, LEAF_KEYS_V3), decay, 1);
      });
    });
  }
  // spring petals: one from each cluster as it shrinks; they wither on the grass
  if (s > P.drop0 - 0.01 && s < P.drop1 + P.fall + 0.08) {
    V3_BUDS.forEach((c) => {
      const B = BUD_SPREAD * c.h + (1 - BUD_SPREAD) * smInv(0.25);
      if (B >= 1) return;
      const sd = P.drop0 + (P.drop1 - P.drop0) * easeLInv(1 - BUD_COVER.of(B));
      const h = hash(c.i * 5.3 + 1.7);
      fallTo(`p${c.i}`, ox + c.x * k, oy + c.y * k, sd, h, PINK_LT, 1 - ss(s, sd + P.fall, sd + P.fall + 0.05), 0.85, PINK_SH);
    });
  }
  return <g>{out}</g>;
};

export const YardTree: React.FC<{D: number; sl: Season; t: number; id: string}> = ({D, sl, t, id}) => {
  const T = yardTree(D);
  const {k, wk, x: ox, y: oy} = T;
  const bareVis = sl.bare;
  const leafVis = clamp(sl.leafAmt * 2);
  const v3 = sl.v3;
  const brs = BRANCHES.filter((b) => b.lvl < 3);
  const paths = brs.map((b) => branchPath(b, k, wk, ox, oy));
  // twigs show only while the tree is (nearly) bare, so they never poke out of a full canopy (V3: always there, under
  // the crown, which covers them; they carry the blossom and the leaf clumps)
  const twigVis = v3 ? 1 : clamp((1 - sl.leafAmt) * 2.5) * ss(T.g, 0.05, 0.25);
  const twigs = twigVis > 0.01 ? BRANCHES.filter((b) => b.lvl === 3).map((b) => branchPath(b, k, wk, ox, oy)) : [];
  const tw = 78 * wk;
  const flare = `M ${f1(ox - tw * 0.95)} ${f1(oy + 3)} Q ${f1(ox - tw * 0.52)} ${f1(oy - 6)} ${f1(ox - tw * 0.48)} ${f1(oy - 46 * k)} L ${f1(ox + tw * 0.42)} ${f1(oy - 46 * k)} Q ${f1(ox + tw * 0.5)} ${f1(oy - 6)} ${f1(ox + tw * 0.9)} ${f1(oy + 3)} Z`;
  const stake = 1 - ss(D, 0.1, 0.28);
  const blobs = CANOPY.map(([bx, by, r], i) => {
    const sc = sm(clamp(sl.leafAmt * 1.7 - hash(i * 3.7 + 1) * 0.7));
    return {x: ox + bx * k, y: oy + by * k, r: r * k * sc, i};
  }).filter((b) => b.r > 0.5);
  const cc = T.canopy;
  const ow = Math.max(3, OUT * Math.min(1, 0.6 + k));
  return (
    <g>
      {/* young tree stake and tie */}
      {stake > 0.01 && (
        <g opacity={stake}>
          <rect x={ox + 20} y={oy - 196} width={9} height={200} rx={2} fill="#C9A16E" stroke={INK} strokeWidth={3} />
          <path d={`M ${ox + 22} ${oy - 150} Q ${ox + 8} ${oy - 144} ${ox - 2} ${oy - 150}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M ${ox + 22} ${oy - 150} Q ${ox + 8} ${oy - 144} ${ox - 2} ${oy - 150}`} fill="none" stroke="#4F7CC9" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {twigs.length > 0 && (
        <g opacity={twigVis}>
          {twigs.map((d, i) => <path key={`to${i}`} d={d} fill={INK} stroke={INK} strokeWidth={ow * 1.1} strokeLinejoin="round" />)}
          {twigs.map((d, i) => <path key={`tf${i}`} d={d} fill={BARK} />)}
        </g>
      )}
      {/* branches: one ink silhouette under, the bark fill over, so joints merge */}
      <path d={flare} fill={INK} stroke={INK} strokeWidth={ow * 2} strokeLinejoin="round" />
      {paths.map((d, i) => <path key={`o${i}`} d={d} fill={INK} stroke={INK} strokeWidth={ow * 2} strokeLinejoin="round" />)}
      <path d={flare} fill={BARK} />
      {paths.map((d, i) => <path key={`f${i}`} d={d} fill={BARK} />)}
      <defs>
        <clipPath id={`${id}-trunk`}>
          <path d={paths[0]} />
          <path d={flare} />
        </clipPath>
      </defs>
      {/* trunk cel shading (shadow side right) and bark lines */}
      <g clipPath={`url(#${id}-trunk)`}>
        <rect x={ox + tw * 0.12} y={oy - 460 * k} width={tw} height={470 * k + 10} fill={BARK_SH} />
        {tw > 20 && [-0.22, 0.05, 0.3].map((u, i) => (
          <path key={i} d={open(Array.from({length: 6}, (_, j) => ({x: ox + u * tw + 4 * noise1(j * 0.9, i + 2) * wk - j * 1.2 * k, y: oy - 20 * k - j * 70 * k})))} fill="none" stroke={INK} strokeWidth={2.4} opacity={0.35 * clamp((tw - 20) / 12)} strokeLinecap="round" />
        ))}
      </g>
      {/* lower-side shadow along the limbs */}
      {brs.map((b, i) => (b.lvl === 1 || b.lvl === 2) && b.w0 * wk > 4 ? (
        <path key={`s${i}`} d={open([0.1, 0.4, 0.7, 0.95].map((u) => {
          const p = qpt(b.a, b.c, b.b, u);
          return {x: ox + p.x * k + 0.22 * lerp(b.w0, b.w1, u) * wk * Math.cos(rad(b.ang)), y: oy + p.y * k + 0.22 * lerp(b.w0, b.w1, u) * wk * Math.abs(Math.sin(rad(b.ang)))};
        }))} fill="none" stroke={BARK_SH} strokeWidth={Math.max(1.5, b.w1 * wk * 0.9)} strokeLinecap="round" opacity={0.85 * clamp((b.w0 * wk - 4) / 4)} />
      ) : null)}
      {/* snow along the branch tops (bare tree) */}
      {!v3 && sl.snow * bareVis > 0.01 && brs.map((b, i) => (b.lvl <= 2 && Math.abs(Math.sin(rad(b.ang))) > 0.3 ? (
        <path key={`n${i}`} d={open([0.15, 0.45, 0.75, 0.95].map((u) => {
          const p = qpt(b.a, b.c, b.b, u);
          return {x: ox + p.x * k, y: oy + p.y * k - 0.42 * lerp(b.w0, b.w1, u) * wk};
        }))} fill="none" stroke="#F6FAFD" strokeWidth={Math.max(2.5, b.w1 * wk * 0.8 + 2)} strokeLinecap="round" opacity={sl.snow * bareVis} />
      ) : null))}
      {/* V3: opaque snow that builds up along the branch tops, then melts away (its thickness follows the season) */}
      {v3 && sl.snow > 0.02 && brs.map((b, i) => (b.lvl <= 2 && Math.abs(Math.sin(rad(b.ang))) > 0.3 ? (
        <path key={`n${i}`} d={open([0.15, 0.45, 0.75, 0.95].map((u) => {
          const p = qpt(b.a, b.c, b.b, u);
          return {x: ox + p.x * k, y: oy + p.y * k - 0.42 * lerp(b.w0, b.w1, u) * wk};
        }))} fill="none" stroke="#F6FAFD" strokeWidth={f1(Math.max(2.5, b.w1 * wk * 0.8 + 2.5) * sm(sl.snow))} strokeLinecap="round" />
      ) : null))}
      {v3 && <CrownV3 sl={sl} k={k} ox={ox} oy={oy} ow={ow} />}
      {v3 && <FallV3 sl={sl} k={k} ox={ox} oy={oy} />}
      {/* canopy: union silhouette with one ink outline, one cel shadow, highlights, clump arcs, blossom */}
      {!v3 && blobs.length > 0 && leafVis > 0.01 && (
        <g opacity={leafVis}>
          <defs>
            <clipPath id={`${id}-can`}>{blobs.map((b) => <circle key={b.i} cx={b.x} cy={b.y} r={b.r} />)}</clipPath>
          </defs>
          {blobs.map((b) => <circle key={`o${b.i}`} cx={b.x} cy={b.y} r={b.r} fill={INK} stroke={INK} strokeWidth={ow * 2} />)}
          {blobs.map((b) => <circle key={`f${b.i}`} cx={b.x} cy={b.y} r={b.r} fill={mix(sl.leaf, AUT[b.i % 3], 0.45 * sl.autumn)} />)}
          <g clipPath={`url(#${id}-can)`}>
            {/* blossom: pink clusters over the fresh green (never a pink/green colour blend) */}
            {sl.blossom > 0.01 && blobs.map((b) => [[-0.3, -0.28], [0.32, -0.2], [0.02, 0.3], [-0.05, -0.02]].map(([dx, dy], q) => {
              const s = sm(clamp(sl.blossom * 1.7 - hash(b.i * 4.1 + q * 1.7) * 0.7));
              return s > 0.02 ? <circle key={`p${b.i}-${q}`} cx={b.x + dx * b.r} cy={b.y + dy * b.r} r={b.r * 0.62 * s} fill={q % 2 ? '#F4A9C0' : '#F7B8CB'} /> : null;
            }))}
            <circle cx={cc.cx + cc.rx * 0.55} cy={cc.cy + cc.ry * 0.75} r={cc.rx * 1.02} fill="#22304E" opacity={0.2} />
            {blobs.filter((b) => b.y < cc.cy + cc.ry * 0.2).map((b) => (
              <circle key={`h${b.i}`} cx={b.x - b.r * 0.28} cy={b.y - b.r * 0.34} r={b.r * 0.4} fill="#FFF7E6" opacity={0.3} />
            ))}
            {blobs.map((b) => b.r > 18 ? (
              <path key={`a${b.i}`} d={`M ${f1(b.x + b.r * 0.9 * Math.cos(rad(15)))} ${f1(b.y + b.r * 0.9 * Math.sin(rad(15)))} A ${f1(b.r * 0.9)} ${f1(b.r * 0.9)} 0 0 1 ${f1(b.x + b.r * 0.9 * Math.cos(rad(105)))} ${f1(b.y + b.r * 0.9 * Math.sin(rad(105)))}`} fill="none" stroke={INK} strokeWidth={2.4} opacity={0.3} strokeLinecap="round" />
            ) : null)}
            {sl.blossom > 0.01 && Array.from({length: 130}, (_, j) => {
              const b = blobs[Math.floor(hash(j * 1.31 + 7) * blobs.length)];
              if (!b) return null;
              const a = hash(j * 2.71) * Math.PI * 2, rr = Math.sqrt(hash(j * 3.97)) * b.r * 0.9;
              const r0 = lerp(3.2, 6.5, k);
              return (
                <g key={`b${j}`} opacity={sl.blossom}>
                  <circle cx={b.x + Math.cos(a) * rr} cy={b.y + Math.sin(a) * rr} r={r0} fill={j % 3 ? '#FFF1F5' : '#F7C3D3'} />
                  {j % 4 === 0 && <circle cx={b.x + Math.cos(a) * rr} cy={b.y + Math.sin(a) * rr} r={r0 * 0.35} fill="#E9A91C" />}
                </g>
              );
            })}
          </g>
        </g>
      )}
    </g>
  );
};

/** leaves / petals falling from the tree, and snowflakes (world coords) */
const Drift: React.FC<{D: number; sl: Season; t: number}> = ({D, sl, t}) => {
  const T = yardTree(D);
  const cc = T.canopy;
  const out: React.ReactNode[] = [];
  // (V3: the tree itself drops its leaves and petals, see FallV3)
  const fallW = sl.v3 ? 0 : Math.max(sl.falling, sl.blossom * 0.6);
  if (fallW > 0.01) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const per = 3.2 + hash(i * 1.9) * 2.4;
      const ph = wrap01(t / per + hash(i * 7.3));
      const x0 = cc.cx + (hash(i * 3.3) - 0.5) * cc.rx * 1.7;
      const y0 = cc.cy + (hash(i * 5.1) - 0.2) * cc.ry * 0.9;
      const y1 = HB + 30 + hash(i * 2.2) * (G + 30 - HB);
      const x = x0 + Math.sin(ph * 7 + i) * 28 + ph * 90;
      const y = lerp(y0, y1, ph);
      const op = fallW * sm(ph * 6) * (1 - sm((ph - 0.82) * 5.5));
      const isPetal = sl.blossom > sl.falling;
      const s = isPetal ? 0.6 : 1;
      out.push(
        <g key={`l${i}`} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(ph * 420 + i * 47)}) scale(${s})`} opacity={op}>
          <path d="M 0 -11 Q 9 -2 0 11 Q -9 -2 0 -11 Z" fill={isPetal ? '#F7C3D3' : AUT[i % 3]} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          {!isPetal && <line x1={0} y1={-8} x2={0} y2={8} stroke={INK} strokeWidth={1.4} opacity={0.5} />}
        </g>,
      );
    }
  }
  if (sl.snow > 0.01) {
    for (let i = 0; i < 170; i++) {
      const sp = 50 + hash(i * 4.1) * 40;
      const x = wrapR(-500 + hash(i * 1.7) * 3300 + Math.sin(t * 0.9 + i) * 18, -500, 2800);
      const y = wrapR(-500 + hash(i * 2.9) * 2700 + t * sp, -500, 2200);
      out.push(<circle key={`s${i}`} cx={f1(x)} cy={f1(y)} r={2.6 + 2.6 * hash(i * 6.3)} fill="#FFFFFF" opacity={0.9 * sl.snow} />);
    }
  }
  return <g>{out}</g>;
};

// =====================================================================================================================
// the family home
// =====================================================================================================================
const WALL0 = '#F3DDAA', WALL1 = '#DDD3BF';
const TRIM0 = '#FFF8EA', TRIM1 = '#E6E0D0';
const ROOF0 = '#5B6A8A', ROOF1 = '#5F6776';
const DOOR0 = '#C94A36', DOOR1 = '#A86454';
/** curtain colour of the family-room window (for the room module to match) */
export const YARD_CURTAIN = '#F0B54A';
const INSIDE = '#33405A';
const LIT = '#F6D58A';
const SNOW = '#F5F9FC';

/** the room's curtain colour and its terracotta armchair (src/v2/room.tsx), for the V3 inside/outside match */
const ROOM_CURTAIN = '#E9B653', ROOM_CHAIR = '#C46A4E';
/** the room's drapes overlap the glass by 24 of its 380 px on each side; its armchair's back rises to 86% of the glass
 *  height and (seen from outside, mirrored) spans the left 56% of the glass */
const V3_DRAPE = 24 / 380, V3_CHAIR_TOP = 0.86, V3_CHAIR_W = 0.56;

/** V3: the family room seen from outside through the glass, matching the room (dim): plain yellow drapes hanging just
 *  inside the glass on both sides (their rod is above the glass, behind the wall), the far wall in shadow, and the
 *  terracotta armchair seen from behind at the lower left. No valance, no tie-backs, no lamp. */
const WindowInsideV3: React.FC<{Wn: {x0: number; x1: number; y0: number; y1: number}; wear: number; light: number; inside: string}> = ({Wn, wear, light, inside}) => {
  const ww = Wn.x1 - Wn.x0, wh = Wn.y1 - Wn.y0;
  const dw = ww * V3_DRAPE;
  const cur = mix(mix(ROOM_CURTAIN, '#CBBE9F', 0.6 * wear), shade(ROOM_CURTAIN, 0.1), 0.25 * (1 - light));
  const curS = shade(cur, 0.22);
  const drape = (side: -1 | 1) => {
    const e = side < 0 ? Wn.x0 : Wn.x1; // the glass edge the drape hangs over
    const inner = e - side * dw;
    const d = `M ${f1(e + side * 4)} ${Wn.y0 - 4} L ${f1(inner)} ${Wn.y0 - 4} Q ${f1(inner - side * 1.6)} ${f1(Wn.y0 + wh * 0.55)} ${f1(inner + side * 0.6)} ${Wn.y1 + 6} L ${f1(e + side * 4)} ${Wn.y1 + 6} Z`;
    const fx = e - side * dw * 0.45;
    return (
      <g key={side}>
        <path d={d} fill={cur} />
        <path d={`M ${f1(fx)} ${Wn.y0 - 4} Q ${f1(fx - side * 1.2)} ${f1(Wn.y0 + wh * 0.5)} ${f1(fx + side * 0.4)} ${Wn.y1 + 6} L ${f1(fx + side * 3.2)} ${Wn.y1 + 6} Q ${f1(fx + side * 2)} ${f1(Wn.y0 + wh * 0.5)} ${f1(fx + side * 3)} ${Wn.y0 - 4} Z`} fill={curS} />
        <path d={d} fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      </g>
    );
  };
  // the armchair, seen from behind: a wing-back with two rounded shoulders
  const cx0 = Wn.x0 - 6, cx1 = Wn.x0 + ww * V3_CHAIR_W, cy = Wn.y0 + wh * V3_CHAIR_TOP, cwid = cx1 - cx0;
  const chair = mix(mix(ROOM_CHAIR, inside, 0.3), ROOM_CHAIR, 0.6 * light);
  const chairD = `M ${f1(cx0)} ${Wn.y1 + 8} L ${f1(cx0)} ${f1(cy + 9)} Q ${f1(cx0)} ${f1(cy)} ${f1(cx0 + cwid * 0.12)} ${f1(cy)} Q ${f1(cx0 + cwid * 0.3)} ${f1(cy)} ${f1(cx0 + cwid * 0.36)} ${f1(cy + 5)} L ${f1(cx0 + cwid * 0.64)} ${f1(cy + 5)} Q ${f1(cx0 + cwid * 0.7)} ${f1(cy)} ${f1(cx0 + cwid * 0.88)} ${f1(cy)} Q ${f1(cx1)} ${f1(cy)} ${f1(cx1)} ${f1(cy + 9)} L ${f1(cx1)} ${Wn.y1 + 8} Z`;
  return (
    <g>
      {/* the far wall in shadow, its dado a little darker */}
      <rect x={Wn.x0} y={Wn.y0 + wh * 0.62} width={ww} height={wh * 0.4} fill={shade(inside, 0.14)} />
      <line x1={Wn.x0} y1={Wn.y0 + wh * 0.62} x2={Wn.x1} y2={Wn.y0 + wh * 0.62} stroke={INK} strokeWidth={1.6} opacity={0.35} />
      {/* the armchair's back */}
      <path d={chairD} fill={chair} />
      <path d={`M ${f1(cx0 + cwid * 0.64)} ${f1(cy + 5)} Q ${f1(cx0 + cwid * 0.7)} ${f1(cy)} ${f1(cx0 + cwid * 0.88)} ${f1(cy)} Q ${f1(cx1)} ${f1(cy)} ${f1(cx1)} ${f1(cy + 9)} L ${f1(cx1)} ${Wn.y1 + 8} L ${f1(cx0 + cwid * 0.7)} ${Wn.y1 + 8} Z`} fill={shade(chair, 0.18)} />
      <path d={`M ${f1(cx0 + cwid * 0.5)} ${f1(cy + 8)} L ${f1(cx0 + cwid * 0.5)} ${Wn.y1 + 8}`} stroke={INK} strokeWidth={1.4} opacity={0.3} />
      <path d={chairD} fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      {/* the drapes, just inside the glass */}
      {drape(-1)}
      {drape(1)}
      {/* glass glints */}
      <path d={`M ${Wn.x0 + 60} ${Wn.y1} L ${Wn.x0 + 130} ${Wn.y0} L ${Wn.x0 + 160} ${Wn.y0} L ${Wn.x0 + 90} ${Wn.y1} Z`} fill="#FFFFFF" opacity={0.16} />
      <path d={`M ${Wn.x0 + 112} ${Wn.y1} L ${Wn.x0 + 182} ${Wn.y0} L ${Wn.x0 + 194} ${Wn.y0} L ${Wn.x0 + 124} ${Wn.y1} Z`} fill="#FFFFFF" opacity={0.14} />
    </g>
  );
};

const Home: React.FC<{D: number; sl: Season; t: number; id: string; doorOpen: number; light: number; v3?: boolean}> = ({D, sl, t, id, doorOpen, light, v3 = false}) => {
  const H = YARD.house, Dr = YARD.door, Wn = v3 ? YARD.windowV3 : YARD.window;
  const ww = Wn.x1 - Wn.x0, cw = v3 ? 40 : 64;
  const wear = ss(D, 0.08, 1);
  const wall = mix(WALL0, WALL1, 0.55 * wear);
  const wallSh = shade(wall, 0.2);
  const trim = mix(TRIM0, TRIM1, 0.6 * wear);
  const trimSh = shade(trim, 0.16);
  const roof = mix(ROOF0, ROOF1, 0.5 * wear);
  const door = mix(DOOR0, DOOR1, 0.55 * wear);
  const {x0, x1, base, floor, wallTop, roofTop} = H;
  const RL = 1450, RR = 1860, OV = 44;
  const hipL = (y: number) => lerp(RL, x0 - OV, (y - roofTop) / (wallTop - roofTop));
  const hipR = (y: number) => lerp(RR, x1 + OV, (y - roofTop) / (wallTop - roofTop));
  const sol = ss(D, 0.42, 0.6);
  const inside = mix(INSIDE, LIT, light);
  const moss = ss(D, 0.42, 1);
  const crack = ss(D, 0.3, 0.75);
  const peel = ss(D, 0.55, 1);
  const ivy = ss(D, 0.25, 1);
  const sag = 7 * ss(D, 0.6, 1);
  // door swing (hinge on the right edge, inward): x compresses toward the hinge, the free edge shortens (perspective)
  const th = rad(78 * clamp(doorOpen));
  const dmid = (Dr.y0 + Dr.y1) / 2;
  const dm = (x: number, y: number): P => {
    const u = (Dr.hingeX - x) / Dr.w;
    return {x: Dr.hingeX - (Dr.hingeX - x) * Math.cos(th), y: dmid + (y - dmid) * (1 - 0.07 * Math.sin(th) * u)};
  };
  const dq = (xa: number, ya: number, xb: number, yb: number) => {
    const p = [dm(xa, ya), dm(xb, ya), dm(xb, yb), dm(xa, yb)];
    return `M ${p.map((q) => `${f1(q.x)} ${f1(q.y)}`).join(' L ')} Z`;
  };
  const upperWins = [1515, 1760];
  const blind = [lerp(0.18, 0.5, ss(D, 0.3, 1)), lerp(0.12, 0.78, ss(D, 0.5, 1))];
  const smoke = sl.snow * (1 - ss(D, 0.45, 0.75));
  // V3: the crack runs down the siding left of the porch light (clear of the fixture, whichever one is up)
  const crackD = v3
    ? `M 1362 ${floor + 14} L 1371 ${floor + 50} L 1358 ${floor + 88} L 1372 ${floor + 132} L 1361 ${floor + 176} M 1371 ${floor + 50} L 1352 ${floor + 66}`
    : `M 1372 ${floor + 14} L 1385 ${floor + 50} L 1371 ${floor + 88} L 1393 ${floor + 132} L 1380 ${floor + 176} M 1385 ${floor + 50} L 1404 ${floor + 64}`;
  const wearMarks = (
    <g>
      <path d={crackD} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${f1(200 * crack)} 400`} opacity={0.75 * clamp(crack * 3)} />
      {wear > 0.2 && [Wn.x0 - 10, Wn.x1 + 4, 1440, 1590].map((sx, j) => (
        <path key={j} d={`M ${sx} ${j < 2 ? Wn.y1 + 26 : wallTop + 290} q 4 22 -2 40 q 4 14 0 28`} fill="none" stroke={shade(wall, 0.45)} strokeWidth={7} strokeLinecap="round" opacity={0.3 * ss(D, 0.3, 1)} />
      ))}
      {peel > 0.01 && [[1866, floor - 120], v3 ? [1452, wallTop + 300] : [1424, wallTop + 330], [1906, floor + 200]].map(([px, py], j) => (
        <path key={j} d={`M ${px} ${py} l 12 -5 l 8 6 l -3 9 l -11 3 l -8 -6 Z`} fill={mix(wall, '#FFFFFF', 0.3)} stroke={shade(wall, 0.45)} strokeWidth={1.6} opacity={peel * 0.8} />
      ))}
    </g>
  );
  return (
    <g>
      {/* chimney (behind the roof) with the old TV antenna */}
      <rect x={1480} y={430} width={66} height={100} fill="#B5523B" stroke={INK} strokeWidth={OUT} />
      <rect x={1520} y={432} width={24} height={96} fill={shade('#B5523B', 0.25)} />
      {[452, 474, 496].map((y, i) => <line key={i} x1={1482} y1={y} x2={1544} y2={y} stroke={INK} strokeWidth={2} opacity={0.3} />)}
      <rect x={1472} y={418} width={82} height={16} rx={3} fill="#8E8E96" stroke={INK} strokeWidth={3} />
      {sol < 0.999 && (
        <g opacity={1 - ss(D, 0.3, 0.46)} stroke={INK} strokeLinecap="round" fill="none">
          <path d="M 1534 418 L 1534 318" strokeWidth={5} />
          <path d="M 1500 340 L 1570 340 M 1508 362 L 1562 362 M 1514 384 L 1554 384" strokeWidth={4} />
        </g>
      )}
      {smoke > 0.01 && [0, 1, 2, 3].map((j) => {
        const ph = wrap01(t * 0.35 + j / 4);
        return <circle key={j} cx={1513 + ph * 50 + Math.sin(ph * 5 + j) * 10} cy={404 - ph * 230} r={14 + ph * 26} fill="#FFFFFF" opacity={smoke * 0.6 * (1 - ph)} />;
      })}
      {/* roof */}
      <path d={`M ${x0 - OV} ${wallTop} L ${RL} ${roofTop} L ${RR} ${roofTop} L ${x1 + OV} ${wallTop} Z`} fill={roof} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${RR - 110} ${roofTop + 2} L ${RR} ${roofTop + 2} L ${x1 + OV - 2} ${wallTop - 2} L ${x1 + OV - 190} ${wallTop - 2} Z`} fill={shade(roof, 0.28)} />
      {Array.from({length: 7}, (_, j) => {
        const y = roofTop + 26 + j * 25;
        return <line key={j} x1={hipL(y) + 6} y1={y} x2={hipR(y) - 6} y2={y} stroke={INK} strokeWidth={2} opacity={0.2} />;
      })}
      <rect x={RL - 8} y={roofTop - 7} width={RR - RL + 16} height={12} rx={5} fill={shade(roof, 0.12)} stroke={INK} strokeWidth={3} />
      {/* solar panels arrive */}
      {sol > 0.01 && (
        <g opacity={sol}>
          {[1430, 1720].map((px, g) => (
            <g key={g}>
              {[0, 1, 2].map((j) => (
                <g key={j}>
                  <rect x={px + j * 52} y={598} width={48} height={78} rx={3} fill="#2C3E66" stroke={INK} strokeWidth={2.5} />
                  <path d={`M ${px + j * 52 + 24} 600 L ${px + j * 52 + 24} 674 M ${px + j * 52 + 2} 624 L ${px + j * 52 + 46} 624 M ${px + j * 52 + 2} 650 L ${px + j * 52 + 46} 650`} stroke="#4E6AA0" strokeWidth={2} />
                  <path d={`M ${px + j * 52 + 8} 670 L ${px + j * 52 + 30} 604`} stroke="#FFFFFF" strokeWidth={3} opacity={0.25} strokeLinecap="round" />
                </g>
              ))}
            </g>
          ))}
        </g>
      )}
      {/* dormer */}
      <path d={`M 1598 592 L 1655 544 L 1712 592 Z`} fill={roof} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M 1655 548 L 1706 590 L 1680 590 Z`} fill={shade(roof, 0.28)} />
      <rect x={1612} y={590} width={86} height={92} fill={wall} stroke={INK} strokeWidth={OUT} />
      <rect x={1612} y={590} width={86} height={14} fill={wallSh} />
      <rect x={1628} y={604} width={54} height={62} rx={3} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={1636} y={612} width={38} height={46} fill={inside} stroke={INK} strokeWidth={2} />
      <path d="M 1655 612 L 1655 658 M 1636 635 L 1674 635" stroke={trim} strokeWidth={4} />
      {/* walls */}
      <rect x={x0} y={wallTop} width={x1 - x0} height={base - wallTop} fill={wall} stroke={INK} strokeWidth={OUT} />
      {Array.from({length: Math.floor((base - wallTop - 60) / 22)}, (_, j) => (
        <line key={j} x1={x0 + 4} y1={wallTop + 44 + j * 22} x2={x1 - 4} y2={wallTop + 44 + j * 22} stroke={shade(wall, 0.4)} strokeWidth={2} opacity={0.32} />
      ))}
      <rect x={x0 + 2} y={wallTop + 2} width={x1 - x0 - 4} height={30} fill={wallSh} />
      <rect x={x0 - 6} y={floor - 8} width={x1 - x0 + 12} height={14} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={x0 - 6} y={floor + 6} width={x1 - x0 + 12} height={10} fill={wallSh} opacity={0.8} />
      <rect x={x0} y={wallTop} width={16} height={base - wallTop} fill={trim} stroke={INK} strokeWidth={2.5} />
      <rect x={x1 - 16} y={wallTop} width={16} height={base - wallTop} fill={trimSh} stroke={INK} strokeWidth={2.5} />
      {/* upper windows (blinds come down as the house goes quiet) */}
      {upperWins.map((cx, wi) => {
        const y0 = wallTop + 70, y1 = wallTop + 250, hw = 75;
        const bh = (y1 - y0) * blind[wi];
        return (
          <g key={wi}>
            <rect x={cx - hw - 14} y={y0 - 14} width={2 * hw + 28} height={y1 - y0 + 28} fill={trim} stroke={INK} strokeWidth={3} />
            <rect x={cx - hw} y={y0} width={2 * hw} height={y1 - y0} fill={inside} stroke={INK} strokeWidth={2.5} />
            <clipPath id={`${id}-uw${wi}`}><rect x={cx - hw} y={y0} width={2 * hw} height={y1 - y0} /></clipPath>
            <g clipPath={`url(#${id}-uw${wi})`}>
              <path d={`M ${cx - hw} ${y0} L ${cx - hw + 34} ${y0} Q ${cx - hw + 22} ${y0 + 90} ${cx - hw + 30} ${y1} L ${cx - hw} ${y1} Z`} fill="#9FC3E0" stroke={INK} strokeWidth={2} />
              <path d={`M ${cx + hw} ${y0} L ${cx + hw - 34} ${y0} Q ${cx + hw - 22} ${y0 + 90} ${cx + hw - 30} ${y1} L ${cx + hw} ${y1} Z`} fill="#9FC3E0" stroke={INK} strokeWidth={2} />
              <rect x={cx - hw} y={y0} width={2 * hw} height={bh} fill="#EADFC6" stroke={INK} strokeWidth={2} />
              {Array.from({length: Math.floor(bh / 12)}, (_, j) => <line key={j} x1={cx - hw} y1={y0 + 10 + j * 12} x2={cx + hw} y2={y0 + 10 + j * 12} stroke={INK} strokeWidth={1.4} opacity={0.25} />)}
              <rect x={cx - hw} y={y0 + bh - 6} width={2 * hw} height={8} fill="#C9B79A" stroke={INK} strokeWidth={2} />
              <path d={`M ${cx - hw + 20} ${y1} L ${cx + 10} ${y0} L ${cx + 40} ${y0} L ${cx - hw + 50} ${y1} Z`} fill="#FFFFFF" opacity={0.18} />
              <rect x={cx - hw} y={y0} width={2 * hw} height={10} fill={INK} opacity={0.18} />
            </g>
            <path d={`M ${cx} ${y0} L ${cx} ${y1} M ${cx - hw} ${(y0 + y1) / 2} L ${cx + hw} ${(y0 + y1) / 2}`} stroke={INK} strokeWidth={10} />
            <path d={`M ${cx} ${y0} L ${cx} ${y1} M ${cx - hw} ${(y0 + y1) / 2} L ${cx + hw} ${(y0 + y1) / 2}`} stroke={trim} strokeWidth={5} />
            <rect x={cx - hw - 24} y={y1 + 6} width={2 * hw + 48} height={13} fill={trim} stroke={INK} strokeWidth={3} />
            <rect x={cx - hw - 20} y={y1 + 19} width={2 * hw + 40} height={8} fill={wallSh} />
            {sl.snow > 0.01 && <rect x={cx - hw - 24} y={y1 + 1} width={2 * hw + 48} height={7} rx={3.5} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={sl.snow} />}
          </g>
        );
      })}
      {/* the family-room window: curtains, a dim room (armchair, lamp), glass glints */}
      <g>
        <rect x={Wn.x0 - 14} y={Wn.y0 - 14} width={Wn.x1 - Wn.x0 + 28} height={Wn.y1 - Wn.y0 + 28} fill={trim} stroke={INK} strokeWidth={3} />
        <rect x={Wn.x0} y={Wn.y0} width={Wn.x1 - Wn.x0} height={Wn.y1 - Wn.y0} fill={inside} stroke={INK} strokeWidth={2.5} />
        <clipPath id={`${id}-fw`}><rect x={Wn.x0} y={Wn.y0} width={Wn.x1 - Wn.x0} height={Wn.y1 - Wn.y0} /></clipPath>
        {v3 && (
          <g clipPath={`url(#${id}-fw)`}>
            <WindowInsideV3 Wn={Wn} wear={wear} light={light} inside={inside} />
          </g>
        )}
        {!v3 && <g clipPath={`url(#${id}-fw)`}>
          <rect x={Wn.x0} y={Wn.y1 - 52} width={Wn.x1 - Wn.x0} height={60} fill={mix(shade(INSIDE, 0.25), '#D9A85A', light)} />
          {/* armchair back and a lamp */}
          {(() => {
            const ax = Wn.x0 + ww * 0.25, lx = Wn.x0 + ww * 0.69;
            return (
              <g>
                <path d={`M ${ax} ${Wn.y1 + 4} L ${ax} ${Wn.y1 - 44} Q ${ax} ${Wn.y1 - 64} ${ax + 22} ${Wn.y1 - 64} L ${ax + 52} ${Wn.y1 - 64} Q ${ax + 74} ${Wn.y1 - 64} ${ax + 74} ${Wn.y1 - 44} L ${ax + 74} ${Wn.y1 + 4} Z`} fill={mix('#5B4E6A', '#A8603E', light)} stroke={INK} strokeWidth={2.5} />
                <line x1={lx} y1={Wn.y1} x2={lx} y2={Wn.y0 + 86} stroke={INK} strokeWidth={3} />
                <path d={`M ${lx - 16} ${Wn.y0 + 62} L ${lx + 16} ${Wn.y0 + 62} L ${lx + 24} ${Wn.y0 + 90} L ${lx - 24} ${Wn.y0 + 90} Z`} fill={mix('#8E7F6A', '#FFE7A6', light)} stroke={INK} strokeWidth={2.5} />
              </g>
            );
          })()}
          {/* curtains with tie-backs */}
          <path d={`M ${Wn.x0} ${Wn.y0} L ${Wn.x0 + cw} ${Wn.y0} Q ${Wn.x0 + cw * 0.62} ${Wn.y0 + 92} ${Wn.x0 + cw * 0.47} ${Wn.y0 + 112} Q ${Wn.x0 + cw * 0.62} ${Wn.y0 + 140} ${Wn.x0 + cw * 0.81} ${Wn.y1} L ${Wn.x0} ${Wn.y1} Z`} fill={mix(YARD_CURTAIN, '#D9C29A', 0.4 * wear)} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M ${Wn.x1} ${Wn.y0} L ${Wn.x1 - cw} ${Wn.y0} Q ${Wn.x1 - cw * 0.62} ${Wn.y0 + 92} ${Wn.x1 - cw * 0.47} ${Wn.y0 + 112} Q ${Wn.x1 - cw * 0.62} ${Wn.y0 + 140} ${Wn.x1 - cw * 0.81} ${Wn.y1} L ${Wn.x1} ${Wn.y1} Z`} fill={shade(mix(YARD_CURTAIN, '#D9C29A', 0.4 * wear), 0.18)} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          {[14, 30, 46].map((dx, j) => (
            <g key={j} opacity={0.35}>
              <path d={`M ${Wn.x0 + dx * 0.9} ${Wn.y0 + 6} Q ${Wn.x0 + dx * 0.55} ${Wn.y0 + 100} ${Wn.x0 + dx * 0.8} ${Wn.y1}`} fill="none" stroke={INK} strokeWidth={1.6} />
              <path d={`M ${Wn.x1 - dx * 0.9} ${Wn.y0 + 6} Q ${Wn.x1 - dx * 0.55} ${Wn.y0 + 100} ${Wn.x1 - dx * 0.8} ${Wn.y1}`} fill="none" stroke={INK} strokeWidth={1.6} />
            </g>
          ))}
          <rect x={Wn.x0 + cw * 0.34} y={Wn.y0 + 106} width={18} height={10} rx={4} fill={C.coralDeep} stroke={INK} strokeWidth={1.8} />
          <rect x={Wn.x1 - cw * 0.34 - 18} y={Wn.y0 + 106} width={18} height={10} rx={4} fill={C.coralDeep} stroke={INK} strokeWidth={1.8} />
          {/* valance */}
          <path d={`M ${Wn.x0} ${Wn.y0} L ${Wn.x1} ${Wn.y0} L ${Wn.x1} ${Wn.y0 + 20} ${Array.from({length: 8}, (_, j) => `Q ${Wn.x1 - (j + 0.5) * ww / 8} ${Wn.y0 + 34} ${Wn.x1 - (j + 1) * ww / 8} ${Wn.y0 + 20}`).join(' ')} Z`} fill={mix(YARD_CURTAIN, '#D9C29A', 0.4 * wear)} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          {/* glass glints */}
          <path d={`M ${Wn.x0 + 60} ${Wn.y1} L ${Wn.x0 + 130} ${Wn.y0} L ${Wn.x0 + 160} ${Wn.y0} L ${Wn.x0 + 90} ${Wn.y1} Z`} fill="#FFFFFF" opacity={0.16} />
          <path d={`M ${Wn.x0 + 112} ${Wn.y1} L ${Wn.x0 + 182} ${Wn.y0} L ${Wn.x0 + 194} ${Wn.y0} L ${Wn.x0 + 124} ${Wn.y1} Z`} fill="#FFFFFF" opacity={0.14} />
        </g>}
        {(v3 ? [Wn.cx] : [1720, 1800]).map((mx) => (
          <g key={mx}>
            <line x1={mx} y1={Wn.y0} x2={mx} y2={Wn.y1} stroke={INK} strokeWidth={11} />
            <line x1={mx} y1={Wn.y0 + 2} x2={mx} y2={Wn.y1 - 2} stroke={trim} strokeWidth={6} />
          </g>
        ))}
        {v3 && (
          <g>
            <line x1={Wn.x0} y1={YARD.windowV3.transom} x2={Wn.x1} y2={YARD.windowV3.transom} stroke={INK} strokeWidth={11} />
            <line x1={Wn.x0 + 2} y1={YARD.windowV3.transom} x2={Wn.x1 - 2} y2={YARD.windowV3.transom} stroke={trim} strokeWidth={6} />
          </g>
        )}
        <rect x={Wn.x0} y={Wn.y0} width={Wn.x1 - Wn.x0} height={Wn.y1 - Wn.y0} fill="none" stroke={INK} strokeWidth={3} />
        <rect x={Wn.x0 - 24} y={Wn.y1 + 2} width={Wn.x1 - Wn.x0 + 48} height={14} fill={trim} stroke={INK} strokeWidth={3} />
        <rect x={Wn.x0 - 20} y={Wn.y1 + 16} width={Wn.x1 - Wn.x0 + 40} height={9} fill={wallSh} />
        {sl.snow > 0.01 && <rect x={Wn.x0 - 24} y={Wn.y1 - 3} width={Wn.x1 - Wn.x0 + 48} height={7} rx={3.5} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={sl.snow} />}
      </g>
      {v3 && wearMarks}
      {/* foundation */}
      <rect x={x0} y={base - 28} width={x1 - x0} height={28} fill={mix('#A8A196', '#9A968E', wear)} stroke={INK} strokeWidth={3} />
      {Array.from({length: 11}, (_, j) => <line key={j} x1={x0 + 30 + j * 60} y1={base - 26} x2={x0 + 30 + j * 60} y2={base - 2} stroke={INK} strokeWidth={2} opacity={0.3} />)}
      {/* door: frame, the dark hall behind, the leaf swinging in */}
      <rect x={Dr.x - 14} y={Dr.y0 - 14} width={Dr.w + 28} height={Dr.h + 14} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={Dr.x} y={Dr.y0} width={Dr.w} height={Dr.h} fill="#1E1B26" stroke={INK} strokeWidth={2.5} />
      {doorOpen > 0.001 && (
        <g>
          <path d={`M ${Dr.x} ${Dr.y1} L ${Dr.x + 18} ${Dr.y1 - 34} L ${Dr.x + Dr.w - 6} ${Dr.y1 - 34} L ${Dr.x + Dr.w} ${Dr.y1} Z`} fill="#3A3340" />
          <rect x={Dr.x + 30} y={Dr.y1 - 34 - 170} width={52} height={170} fill={mix('#4B4250', '#F2C46E', light)} stroke={INK} strokeWidth={2} />
          <path d={`M ${Dr.x + 30} ${Dr.y1 - 34} L ${Dr.x + 82} ${Dr.y1 - 34} L ${Dr.x + 96} ${Dr.y1 - 4} L ${Dr.x + 18} ${Dr.y1 - 4} Z`} fill={mix('#4B4250', '#F2C46E', light)} opacity={0.45} />
        </g>
      )}
      <path d={dq(Dr.x, Dr.y0, Dr.x + Dr.w, Dr.y1)} fill={door} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={dq(Dr.x + Dr.w * 0.72, Dr.y0 + 2, Dr.x + Dr.w - 2, Dr.y1 - 2)} fill={shade(door, 0.2)} />
      <path d={dq(Dr.x + 16, Dr.y0 + 20, Dr.x + Dr.w - 16, Dr.y0 + 130)} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.7} />
      <path d={dq(Dr.x + 30, Dr.y0 + 32, Dr.x + Dr.w - 30, Dr.y0 + 92)} fill={mix('#BFDDEB', LIT, light)} stroke={INK} strokeWidth={2.5} />
      <path d={dq(Dr.x + 16, Dr.y0 + 156, Dr.x + Dr.w - 16, Dr.y1 - 20)} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.7} />
      {(() => {
        const k = dm(Dr.x + 16, Dr.y0 + 162);
        return <circle cx={k.x} cy={k.y} r={6.5} fill={C.saffron} stroke={INK} strokeWidth={2.5} />;
      })()}
      {peel > 0.01 && (() => {
        const q = [[Dr.x + 22, Dr.y1 - 66], [Dr.x + 38, Dr.y1 - 72], [Dr.x + 46, Dr.y1 - 58], [Dr.x + 40, Dr.y1 - 44], [Dr.x + 26, Dr.y1 - 46]].map(([x, y]) => dm(x, y));
        return <path d={`M ${q.map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')} Z`} fill={mix(door, '#E8D9C4', 0.45)} stroke={shade(door, 0.3)} strokeWidth={1.6} strokeLinejoin="round" opacity={peel * 0.75} />;
      })()}
      {/* porch canopy */}
      <rect x={Dr.x - 26} y={Dr.y0 - 18} width={14} height={30} fill={trimSh} stroke={INK} strokeWidth={2.5} />
      <rect x={Dr.x + Dr.w + 12} y={Dr.y0 - 18} width={14} height={30} fill={trimSh} stroke={INK} strokeWidth={2.5} />
      <path d={`M ${Dr.x - 36} ${Dr.y0 - 18} L ${Dr.cx} ${Dr.y0 - 64} L ${Dr.x + Dr.w + 36} ${Dr.y0 - 18} Z`} fill={roof} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
      <path d={`M ${Dr.cx} ${Dr.y0 - 60} L ${Dr.x + Dr.w + 28} ${Dr.y0 - 21} L ${Dr.cx + 20} ${Dr.y0 - 21} Z`} fill={shade(roof, 0.28)} />
      <rect x={Dr.x - 38} y={Dr.y0 - 22} width={Dr.w + 76} height={10} fill={trim} stroke={INK} strokeWidth={2.5} />
      {sl.snow > 0.01 && <path d={`M ${Dr.x - 40} ${Dr.y0 - 20} L ${Dr.cx} ${Dr.y0 - 70} L ${Dr.x + Dr.w + 40} ${Dr.y0 - 20} L ${Dr.x + Dr.w + 26} ${Dr.y0 - 24} L ${Dr.cx} ${Dr.y0 - 58} L ${Dr.x - 26} ${Dr.y0 - 24} Z`} fill={SNOW} stroke={INK} strokeWidth={2} strokeLinejoin="round" opacity={sl.snow} />}
      {/* porch light: a lantern that becomes a slim light strip */}
      {(() => {
        const f = ss(D, 0.55, 0.8);
        const lx = 1396, ly = Dr.y0 + 50;
        // V3: never both at once: the lantern shrinks into its wall bracket, then the strip grows from its centre
        const fo = ss(D, 0.55, 0.65), fi = ss(D, 0.67, 0.8);
        const lantern = (
          <g>
            <path d={`M ${lx + 30} ${ly - 8} L ${lx} ${ly - 8} L ${lx} ${ly}`} fill="none" stroke={INK} strokeWidth={5} />
            <path d={`M ${lx - 11} ${ly + 4} L ${lx + 11} ${ly + 4} L ${lx + 14} ${ly + 40} L ${lx - 14} ${ly + 40} Z`} fill={mix('#F3E3B0', '#FFE27A', light)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M ${lx - 15} ${ly + 4} L ${lx} ${ly - 8} L ${lx + 15} ${ly + 4} Z`} fill="#3F5560" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <rect x={lx - 16} y={ly + 38} width={32} height={7} rx={2} fill="#3F5560" stroke={INK} strokeWidth={2.5} />
          </g>
        );
        if (v3) {
          return (
            <g>
              {light > 0.01 && <circle cx={lx} cy={ly + 20} r={58} fill="#FFF6D2" opacity={0.45 * light} />}
              {fo < 0.999 && <g transform={`translate(${lx + 30} ${ly - 8}) scale(${Math.max(0.001, 1 - fo).toFixed(3)}) translate(${-(lx + 30)} ${-(ly - 8)})`}>{lantern}</g>}
              {fi > 0.001 && (
                <g transform={`translate(${lx} ${ly + 18}) scale(${fi.toFixed(3)}) translate(${-lx} ${-(ly + 18)})`}>
                  <rect x={lx - 6} y={ly - 24} width={12} height={84} rx={6} fill={mix('#DDEFF2', '#BFF4F0', light)} stroke={INK} strokeWidth={3} />
                </g>
              )}
            </g>
          );
        }
        return (
          <g>
            {light > 0.01 && <circle cx={lx} cy={ly + 20} r={58} fill="#FFF6D2" opacity={0.45 * light} />}
            <g opacity={1 - f}>
              <path d={`M ${lx + 30} ${ly - 8} L ${lx} ${ly - 8} L ${lx} ${ly}`} fill="none" stroke={INK} strokeWidth={5} />
              <path d={`M ${lx - 11} ${ly + 4} L ${lx + 11} ${ly + 4} L ${lx + 14} ${ly + 40} L ${lx - 14} ${ly + 40} Z`} fill={mix('#F3E3B0', '#FFE27A', light)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
              <path d={`M ${lx - 15} ${ly + 4} L ${lx} ${ly - 8} L ${lx + 15} ${ly + 4} Z`} fill="#3F5560" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
              <rect x={lx - 16} y={ly + 38} width={32} height={7} rx={2} fill="#3F5560" stroke={INK} strokeWidth={2.5} />
            </g>
            <g opacity={f}>
              <rect x={lx - 6} y={ly - 24} width={12} height={84} rx={6} fill={mix('#DDEFF2', '#BFF4F0', light)} stroke={INK} strokeWidth={3} />
            </g>
          </g>
        );
      })()}
      {/* gutter and downpipe */}
      <path d={`M ${x0 - OV} ${wallTop + 2} Q ${(x0 + x1) / 2} ${wallTop + 2 + sag * 2} ${x1 + OV} ${wallTop + 2} L ${x1 + OV} ${wallTop + 14} Q ${(x0 + x1) / 2} ${wallTop + 14 + sag * 2} ${x0 - OV} ${wallTop + 14} Z`} fill="#9AA3AD" stroke={INK} strokeWidth={2.5} />
      <rect x={x1 - 30} y={wallTop + 14} width={12} height={base - wallTop - 22} fill="#9AA3AD" stroke={INK} strokeWidth={2.5} />
      {[0.25, 0.6, 0.9].map((u, j) => <rect key={j} x={x1 - 33} y={wallTop + 14 + (base - wallTop) * u} width={18} height={6} fill="#7D8792" stroke={INK} strokeWidth={1.8} />)}
      {/* wear: crack, stains, peeling (V3: drawn earlier, behind the porch and the door casing), moss, ivy */}
      {!v3 && wearMarks}
      {moss > 0.01 && (
        <g opacity={moss}>
          {Array.from({length: 9}, (_, j) => {
            const mx = x0 - 20 + hash(j * 4.3) * (x1 - x0 + 40);
            return <path key={j} d={`M ${mx - 16} ${wallTop - 1} A 16 ${8 + 6 * hash(j)} 0 0 1 ${mx + 16} ${wallTop - 1} Z`} fill={j % 2 ? '#7FA552' : '#6D9446'} stroke={INK} strokeWidth={2} />;
          })}
          {[x0 + 6, x0 + 120, x1 - 80, 1430, 1600].map((mx, j) => <ellipse key={j} cx={mx} cy={base - 2} rx={18} ry={7} fill="#6D9446" stroke={INK} strokeWidth={2} />)}
        </g>
      )}
      {ivy > 0.01 && (() => {
        const L = 600 * ivy;
        const n = L / 18;
        const ivyPt = (j: number) => ({x: x1 - 6 + 9 * Math.sin(j * 0.7), y: base - j * 18});
        const stem = [...Array.from({length: Math.floor(n) + 1}, (_, j) => ivyPt(j)), ivyPt(n)];
        const ivyC = mix(mix('#4F8A50', '#6AA65E', 0.4), '#B5462E', 0.75 * sl.autumn);
        return (
          <g>
            <path d={open(stem)} fill="none" stroke={shade('#6A4A30', 0.1)} strokeWidth={3} />
            {stem.slice(1, -1).map((p, j) => {
              // (V3: each leaf grows / shrinks over a wider stretch of the season, so none pops)
              const g = (v3 ? clamp((1.3 - 0.7 * sl.bare - hash(j * 2.9)) / 0.3) : clamp((1 - 0.65 * sl.bare - hash(j * 2.9)) / 0.1)) * clamp((n - (j + 1)) * 0.8);
              return g > 0.02 ? (
                <ellipse key={j} cx={p.x + (j % 2 ? 9 : -9)} cy={p.y} rx={10 * g} ry={7 * g} fill={j % 3 ? ivyC : shade(ivyC, 0.2)} stroke={INK} strokeWidth={2} transform={`rotate(${j % 2 ? 30 : -30} ${p.x + (j % 2 ? 9 : -9)} ${p.y})`} />
              ) : null;
            })}
          </g>
        );
      })()}
      {/* snow on the roof */}
      {sl.snow > 0.01 && (
        <g opacity={sl.snow}>
          <path d={`M ${RL - 10} ${roofTop - 8} L ${RR + 10} ${roofTop - 8} L ${hipR(roofTop + 70)} ${roofTop + 70} ${Array.from({length: 10}, (_, j) => {
            const xa = hipR(roofTop + 70) - ((j + 1) / 10) * (hipR(roofTop + 70) - hipL(roofTop + 70));
            return `Q ${f1(xa + 30)} ${roofTop + 84 + 8 * hash(j)} ${f1(xa)} ${roofTop + 70}`;
          }).join(' ')} Z`} fill={SNOW} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M 1594 594 L 1655 540 L 1716 594 L 1702 596 L 1655 556 L 1608 596 Z" fill={SNOW} stroke={INK} strokeWidth={2} />
          <rect x={1470} y={410} width={86} height={12} rx={6} fill={SNOW} stroke={INK} strokeWidth={2} />
          <rect x={x0 - OV - 2} y={wallTop - 6} width={x1 - x0 + 2 * OV + 4} height={9} rx={4.5} fill={SNOW} stroke={INK} strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

/** front-garden bits: path, flower beds, porch step, potted plant */
const FrontGarden: React.FC<{D: number; sl: Season}> = ({D, sl}) => {
  const Pr = YARD.porch;
  const wear = ss(D, 0.1, 1);
  // the path: a ground band around a centre curve (anisotropic offset: depth is foreshortened)
  const P0 = {x: 1175, y: FB + 2}, P1 = {x: 1180, y: HB + 92}, P2 = {x: 1370, y: HB + 40}, P3 = {x: 1515, y: HB + 30};
  const SX = 156, SZ = 35, HW = 0.36; // px per metre across, px per metre in depth, half width (m)
  const N = 16;
  const Lp: P[] = [], Rp: P[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = cpt(P0, P1, P2, P3, u);
    const q = cpt(P0, P1, P2, P3, Math.min(1, u + 0.01)), q0 = cpt(P0, P1, P2, P3, Math.max(0, u - 0.01));
    const gx = (q.x - q0.x) / SX, gz = -(q.y - q0.y) / SZ;
    const gl = Math.hypot(gx, gz) || 1;
    const nx = -gz / gl, nz = gx / gl;
    Lp.push({x: p.x + nx * HW * SX, y: p.y - nz * HW * SZ});
    Rp.push({x: p.x - nx * HW * SX, y: p.y + nz * HW * SZ});
  }
  const pathD = `M ${Lp.map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')} L ${[...Rp].reverse().map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')} Z`;
  const stone = mix('#E8DCC4', '#D7D0C2', wear);
  const bedFlower = sl.blossom * 0.6 + bump(sl.s, 0.3, 0.12, 0.22);
  const plant = lerp(0.6, 1.25, ss(D, 0, 1));
  return (
    <g>
      <path d={pathD} fill={stone} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {Array.from({length: N - 1}, (_, i) => (i % 2 === 1 ? <line key={i} x1={Lp[i + 1].x} y1={Lp[i + 1].y} x2={Rp[i + 1].x} y2={Rp[i + 1].y} stroke={INK} strokeWidth={2} opacity={0.3} /> : null))}
      {sl.snow > 0.01 && <path d={pathD} fill={SNOW} opacity={sl.snow * 0.85} />}
      {/* shrub at the left corner and the flower bed under the family-room window */}
      {[[1362, 30], [1630, 28], [1676, 32], [1724, 30], [1772, 33], [1820, 29], [1866, 32], [1912, 30], [1952, 26]].map(([bx, r], j) => (
        <g key={j}>
          <circle cx={bx} cy={HB - r * 0.55} r={r} fill={INK} stroke={INK} strokeWidth={OUT * 2} />
        </g>
      ))}
      {[[1362, 30], [1630, 28], [1676, 32], [1724, 30], [1772, 33], [1820, 29], [1866, 32], [1912, 30], [1952, 26]].map(([bx, r], j) => (
        <g key={j}>
          <circle cx={bx} cy={HB - r * 0.55} r={r} fill={j % 2 ? sl.hedge : mix(sl.hedge, '#7CC070', 0.25)} />
          <circle cx={bx - r * 0.3} cy={HB - r * 0.85} r={r * 0.4} fill={mix(sl.hedge, '#FFF7E6', 0.2)} opacity={0.7} />
          {bedFlower > 0.02 && j > 0 && [0, 1, 2].map((q) => (
            <circle key={q} cx={bx - r * 0.5 + q * r * 0.5} cy={HB - r * 0.55 - r * 0.5 * hash(j * 3 + q)} r={5} fill={[C.coral, '#FFFFFF', C.saffron][(j + q) % 3]} stroke={INK} strokeWidth={1.5} opacity={bedFlower} />
          ))}
          {sl.snow > 0.01 && <path d={`M ${bx - r * 0.85} ${HB - r * 0.9} A ${r} ${r * 0.7} 0 0 1 ${bx + r * 0.85} ${HB - r * 0.9} Z`} fill={SNOW} opacity={sl.snow} />}
        </g>
      ))}
      {/* porch step */}
      <rect x={Pr.x0} y={Pr.y0} width={Pr.x1 - Pr.x0} height={9} fill={mix('#C9C4B8', '#BDB8AE', wear)} stroke={INK} strokeWidth={3} />
      <rect x={Pr.x0} y={Pr.y0 + 9} width={Pr.x1 - Pr.x0} height={Pr.y1 - Pr.y0 - 9} fill={mix('#A8A196', '#9A968E', wear)} stroke={INK} strokeWidth={3} />
      {sl.snow > 0.01 && <rect x={Pr.x0} y={Pr.y0 - 3} width={Pr.x1 - Pr.x0} height={8} rx={4} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={sl.snow} />}
      {/* potted plant by the door: grows leggy over the years */}
      <g transform={`translate(1606 ${HB + 4})`}>
        {[[-12, -40, 16], [10, -46, 17], [0, -60, 18], [-16, -62, 13], [16, -64, 13], [2, -78, 13]].map(([px, py, r], j) => (
          <circle key={j} cx={px * plant} cy={-30 + (py + 30) * plant} r={r * plant} fill={INK} stroke={INK} strokeWidth={6} />
        ))}
        {[[-12, -40, 16], [10, -46, 17], [0, -60, 18], [-16, -62, 13], [16, -64, 13], [2, -78, 13]].map(([px, py, r], j) => (
          <circle key={`f${j}`} cx={px * plant} cy={-30 + (py + 30) * plant} r={r * plant} fill={j % 2 ? '#4E8F4F' : '#62A55A'} />
        ))}
        {sl.snow > 0.01 && <ellipse cx={2 * plant} cy={-30 + (-78 + 30) * plant - 8} rx={14 * plant} ry={6} fill={SNOW} opacity={sl.snow} />}
        <path d="M -18 -32 L 18 -32 L 13 0 L -13 0 Z" fill="#C8693E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <rect x={-21} y={-36} width={42} height={9} rx={2} fill="#B65A33" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};

// =====================================================================================================================
// fence and gate
// =====================================================================================================================
const PW = 18, PITCH = 30;
/** gate posts: wider than the fence posts; they rise into the arbour arch over the gate */
const GPW = 26;
const ARB_Y = FB - 330; // where the posts meet the arch (the arch's centre line)
const ARB_RO = 81, ARB_RI = 55;

const Arbour: React.FC<{D: number; sl: Season; paint: string; pSh: string; gL: number; gR: number}> = ({D, sl, paint, pSh, gL, gR}) => {
  const cx = (gL + gR) / 2;
  const wear = ss(D, 0.15, 1);
  const arch = `M ${cx - ARB_RO} ${ARB_Y} A ${ARB_RO} ${ARB_RO} 0 0 1 ${cx + ARB_RO} ${ARB_Y} L ${cx + ARB_RI} ${ARB_Y} A ${ARB_RI} ${ARB_RI} 0 0 0 ${cx - ARB_RI} ${ARB_Y} Z`;
  // the climbing rose: up the left post, over the arch, down the right post
  const vinePt = (v: number): P => {
    if (v < 0.4) {
      const y = lerp(FB - 6, ARB_Y, v / 0.4);
      return {x: gL + 9 * Math.sin(y / 23), y};
    }
    if (v < 0.75) {
      const a = Math.PI * (1 + (v - 0.4) / 0.35);
      const r = (ARB_RO + ARB_RI) / 2 + 9 * Math.sin(a * 7);
      return {x: cx + Math.cos(a) * r, y: ARB_Y + Math.sin(a) * r};
    }
    const y = lerp(ARB_Y, ARB_Y + 230, (v - 0.75) / 0.25);
    return {x: gR - 9 * Math.sin(y / 23), y};
  };
  const grown = lerp(0.42, 1, ss(D, 0, 0.75));
  const dens = lerp(0.55, 1, ss(D, 0, 0.8));
  // the rose's leaves stay brown from autumn until they drop (never green again in late autumn)
  const leafC = mix(mix('#4F8A50', '#62A55A', 0.4), '#C2502E', 0.8 * Math.max(sl.autumn, bump(sl.s, 0.68, 0.12, 0.2)));
  const leafVis = 1 - sl.bare;
  const rose = Math.max(bump(sl.s, 0.3, 0.12, 0.22), sl.blossom * 0.5) * leafVis;
  const N = 90;
  const tip = N * grown;
  const stem = [...Array.from({length: Math.floor(tip) + 1}, (_, k) => vinePt(k / N)), vinePt(tip / N)];
  return (
    <g>
      {[gL, gR].map((p, i) => (
        <g key={i}>
          <rect x={p - GPW / 2} y={ARB_Y - 2} width={GPW} height={FB - ARB_Y + 4} fill={paint} stroke={INK} strokeWidth={3.2} />
          <rect x={p + GPW / 2 - 8} y={ARB_Y + 2} width={6} height={FB - ARB_Y - 2} fill={pSh} />
          {i === 0 && [FB - 92, FB - 36].map((hy, q) => <rect key={q} x={p + 4} y={hy} width={18} height={8} rx={2} fill="#3F5560" stroke={INK} strokeWidth={1.8} />)}
          {D > 0.4 && <ellipse cx={p - 2} cy={FB - 2} rx={15} ry={5} fill="#6D9446" stroke={INK} strokeWidth={1.8} opacity={ss(D, 0.4, 1)} />}
        </g>
      ))}
      <path d={arch} fill={paint} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      <path d={`M ${cx + ARB_RI + 1} ${ARB_Y - 1} A ${ARB_RI + 1} ${ARB_RI + 1} 0 0 0 ${cx} ${ARB_Y - ARB_RI - 1} L ${cx} ${ARB_Y - ARB_RI - 7} A ${ARB_RI + 7} ${ARB_RI + 7} 0 0 1 ${cx + ARB_RI + 7} ${ARB_Y - 1} Z`} fill={pSh} />
      {[200, 225, 250, 270, 290, 315, 340].map((deg) => (
        <line key={deg} x1={cx + Math.cos(rad(deg)) * ARB_RI} y1={ARB_Y + Math.sin(rad(deg)) * ARB_RI} x2={cx + Math.cos(rad(deg)) * ARB_RO} y2={ARB_Y + Math.sin(rad(deg)) * ARB_RO} stroke={INK} strokeWidth={2.5} />
      ))}
      {[gL, gR].map((p, i) => <rect key={`c${i}`} x={p - GPW / 2 - 4} y={ARB_Y - 6} width={GPW + 8} height={12} rx={2} fill={paint} stroke={INK} strokeWidth={3} />)}
      {sl.snow > 0.01 && <path d={`M ${cx - ARB_RO - 2} ${ARB_Y - 8} A ${ARB_RO + 2} ${ARB_RO + 2} 0 0 1 ${cx + ARB_RO + 2} ${ARB_Y - 8}`} fill="none" stroke={SNOW} strokeWidth={9} strokeLinecap="round" opacity={sl.snow} />}
      {/* climbing rose */}
      <path d={open(stem)} fill="none" stroke={INK} strokeWidth={6.5} strokeLinecap="round" />
      <path d={open(stem)} fill="none" stroke="#6A5236" strokeWidth={3} strokeLinecap="round" />
      {leafVis > 0.02 && stem.slice(1, -1).map((p, k) => {
        const g = clamp((dens - hash(k * 2.3 + 1)) / 0.1) * clamp((tip - (k + 1)) * 0.8) * leafVis;
        if (g < 0.02) return null;
        const side = k % 2 ? 1 : -1;
        const lx = p.x + side * 8, ly = p.y + (k % 3) * 2;
        return <ellipse key={k} cx={lx} cy={ly} rx={10 * g} ry={6.5 * g} fill={k % 3 ? leafC : shade(leafC, 0.2)} stroke={INK} strokeWidth={1.8} transform={`rotate(${side * 35 + 20 * Math.sin(k)} ${lx} ${ly})`} />;
      })}
      {rose > 0.02 && stem.slice(2, -1).map((p, k) => (k % 6 === 0 ? (
        <g key={`r${k}`} opacity={rose * clamp((tip - (k + 2)) * 0.5)}>
          <circle cx={p.x + (k % 12 ? 6 : -6)} cy={p.y - 4} r={7.5} fill={k % 12 ? C.coral : '#F4A9C0'} stroke={INK} strokeWidth={2} />
          <circle cx={p.x + (k % 12 ? 6 : -6) + 1} cy={p.y - 5} r={2.6} fill={shade(k % 12 ? C.coral : '#F4A9C0', 0.3)} />
        </g>
      ) : null))}
    </g>
  );
};
const Fence: React.FC<{D: number; sl: Season; gateOpen: number}> = ({D, sl, gateOpen}) => {
  const Fc = YARD.fence, Gt = YARD.gate;
  const wear = ss(D, 0.15, 1);
  const paint = mix('#FFFBF0', '#E3DDCF', 0.75 * wear);
  const pSh = shade(paint, 0.2);
  const gL = Gt.x - GPW / 2, gR = Gt.x + Gt.w + GPW / 2; // gate post centres
  const posts = [Fc.x0, 712, 956, gL, gR, 1498, 1744, Fc.x1];
  const half = (i: number) => (i === 3 || i === 4 ? GPW / 2 : 9);
  const railY = [FB - 36, FB - 88];
  const pickets: {x: number; lean: number; j: number}[] = [];
  let j = 0;
  for (let i = 0; i < posts.length - 1; i++) {
    if (i === 3) continue; // the gate span
    const a = posts[i] + half(i) + 6, b = posts[i + 1] - half(i + 1) - 6;
    const n = Math.max(1, Math.round((b - a - PW) / PITCH) + 1);
    const step = n > 1 ? (b - a - PW) / (n - 1) : 0;
    for (let q = 0; q < n; q++) {
      const lean = (hash(j * 1.7 + 3) - 0.5) * 2 * (hash(j * 3.1) > 0.78 ? 5 : 0.6) * wear;
      pickets.push({x: a + q * step, lean, j});
      j++;
    }
  }
  const tipY = FB - FENCE_H;
  const picket = (x: number) => `M ${x} ${FB + 2} L ${x} ${tipY + 10} L ${x + PW / 2} ${tipY} L ${x + PW} ${tipY + 10} L ${x + PW} ${FB + 2} Z`;
  // gate mapping: hinge on the left; u = distance from the hinge; the free edge recedes (rises, shortens) as it opens
  const th = rad(78 * clamp(gateOpen));
  const gm = (u: number, y: number): P => ({x: Gt.hingeX + u * Math.cos(th), y: y - (u / Gt.w) * Math.sin(th) * 16 - (y - FB) * 0.06 * Math.sin(th) * (u / Gt.w)});
  const gpath = (pts: [number, number][], close = true) => `M ${pts.map(([u, y]) => {
    const p = gm(u, y);
    return `${f1(p.x)} ${f1(p.y)}`;
  }).join(' L ')}${close ? ' Z' : ''}`;
  // the gate: a swooping arched top, an arched top rail, a bottom rail and a diagonal brace, five close pickets
  const GPWk = 15;
  const gPick = [5, 27, 47.5, 68, 90];
  const arch = (u: number) => FB - (FENCE_H - 10) - 26 * Math.sin(Math.PI * clamp(u / Gt.w));
  const railTop = Array.from({length: 9}, (_, k) => [(k / 8) * Gt.w, arch((k / 8) * Gt.w) + 20] as [number, number]);
  const railBot = [...railTop].reverse().map(([u, y]) => [u, y + 11] as [number, number]);
  return (
    <g>
      {/* soft cast shadow on the pavement */}
      <rect x={Fc.x0} y={FB} width={Fc.x1 - Fc.x0} height={12} fill={C.shadow} />
      {/* rails */}
      {posts.slice(0, -1).map((p, i) => (i === 3 ? null : (
        <g key={i}>
          {railY.map((ry, r) => (
            <g key={r}>
              <rect x={p} y={ry} width={posts[i + 1] - p} height={10} fill={pSh} stroke={INK} strokeWidth={2.5} />
              {sl.snow > 0.01 && <rect x={p} y={ry - 4} width={posts[i + 1] - p} height={6} rx={3} fill={SNOW} opacity={sl.snow} />}
            </g>
          ))}
        </g>
      )))}
      {/* pickets */}
      {pickets.map((pk) => (
        <g key={pk.j} transform={pk.lean !== 0 ? `rotate(${f1(pk.lean)} ${f1(pk.x + PW / 2)} ${FB})` : undefined}>
          <path d={picket(pk.x)} fill={paint} />
          <rect x={pk.x + PW - 5} y={tipY + 10} width={5} height={FB - tipY - 8} fill={pSh} />
          <path d={picket(pk.x)} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          {D > 0.5 && hash(pk.j * 5.3) > 0.7 && <path d={`M ${pk.x + 4} ${FB - 60 + 20 * hash(pk.j)} l 6 -4 l 4 6 l -6 4 Z`} fill="#BDB6A6" opacity={ss(D, 0.5, 1)} />}
          {sl.snow > 0.01 && <path d={`M ${pk.x - 1} ${tipY + 11} L ${pk.x + PW / 2} ${tipY - 3} L ${pk.x + PW + 1} ${tipY + 11} Q ${pk.x + PW / 2} ${tipY + 6} ${pk.x - 1} ${tipY + 11} Z`} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={sl.snow} />}
        </g>
      ))}
      {/* gate (hinge on the left post) */}
      <g>
        <path d={gpath([...railTop, ...railBot])} fill={pSh} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={gpath([[0, FB - 34], [Gt.w, FB - 34], [Gt.w, FB - 22], [0, FB - 22]])} fill={pSh} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={gpath([[4, FB - 30], [12, FB - 34], [Gt.w - 4, arch(Gt.w - 4) + 26], [Gt.w - 12, arch(Gt.w - 12) + 32]])} fill={pSh} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        {gPick.map((u, q) => {
          const top = arch(u + GPWk / 2);
          const pts: [number, number][] = [[u, FB - 2], [u, top + 9], [u + GPWk / 2, top], [u + GPWk, top + 9], [u + GPWk, FB - 2]];
          return (
            <g key={q}>
              <path d={gpath(pts)} fill={paint} />
              <path d={gpath([[u + GPWk - 4, top + 9], [u + GPWk, top + 9], [u + GPWk, FB - 2], [u + GPWk - 4, FB - 2]])} fill={pSh} />
              <path d={gpath(pts)} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
              {sl.snow > 0.01 && <path d={gpath([[u - 1, top + 10], [u + GPWk / 2, top - 3], [u + GPWk + 1, top + 10], [u + GPWk / 2, top + 6]])} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={sl.snow} />}
            </g>
          );
        })}
        {(() => {
          const l = gm(Gt.w - 4, FB - 62);
          return (
            <g>
              <path d={`M ${f1(l.x)} ${f1(l.y - 7)} L ${f1(l.x + 10 * Math.cos(th) + 6)} ${f1(l.y - 7)}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
              <circle cx={l.x} cy={l.y + 2} r={6} fill="none" stroke="#3F5560" strokeWidth={3.5} />
            </g>
          );
        })()}
      </g>
      {/* fence posts with caps */}
      {posts.map((p, i) => (i === 3 || i === 4 ? null : (
        <g key={i}>
          <rect x={p - 9} y={FB - FENCE_H - 12} width={18} height={FENCE_H + 14} fill={paint} stroke={INK} strokeWidth={3} />
          <rect x={p + 3} y={FB - FENCE_H - 10} width={5} height={FENCE_H + 10} fill={pSh} />
          <path d={`M ${p - 12} ${FB - FENCE_H - 12} L ${p} ${FB - FENCE_H - 28} L ${p + 12} ${FB - FENCE_H - 12} Z`} fill={paint} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          {sl.snow > 0.01 && <path d={`M ${p - 13} ${FB - FENCE_H - 11} L ${p} ${FB - FENCE_H - 32} L ${p + 13} ${FB - FENCE_H - 11} Q ${p} ${FB - FENCE_H - 17} ${p - 13} ${FB - FENCE_H - 11} Z`} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={sl.snow} />}
          {D > 0.4 && <ellipse cx={p - 2} cy={FB - 2} rx={12} ry={5} fill="#6D9446" stroke={INK} strokeWidth={1.8} opacity={ss(D, 0.4, 1)} />}
        </g>
      )))}
      {/* the rose arbour over the gate: two tall posts carry a lattice arch; a climbing rose grows over it with the years */}
      <Arbour D={D} sl={sl} paint={paint} pSh={pSh} gL={gL} gR={gR} />
    </g>
  );
};

// =====================================================================================================================
// the street lamp
// =====================================================================================================================
const Lamp: React.FC<{x: number; D: number; light: number; snow: number}> = ({x, D, light, snow}) => {
  const f = ss(D, 0.45, 0.85);
  const by = G + 24, ty = lerp(1050, 1000, f);
  const pw = lerp(16, 11, f);
  const pole = mix('#2E4A4F', '#E8EEF2', f);
  const ax = lerp(78, 120, f), ay = lerp(16, 4, f);
  const arm = `M ${x} ${ty} q ${f1(-ax * 0.7)} ${f1(-ay * 1.4)} ${f1(-ax)} ${f1(ay)}`;
  const hx = x - ax, hy = ty + ay;
  return (
    <g>
      {light > 0.01 && (
        <g opacity={light}>
          <path d={`M ${hx - 18} ${hy + 12} L ${hx - 150} ${G + 30} L ${hx + 150} ${G + 30} L ${hx + 18} ${hy + 12} Z`} fill={mix('#FFE7A6', '#BFF4F0', f)} opacity={0.16} />
          <circle cx={hx} cy={hy + 12} r={80} fill={mix('#FFE7A6', '#BFF4F0', f)} opacity={0.22} />
          <circle cx={hx} cy={hy + 12} r={40} fill={mix('#FFE7A6', '#BFF4F0', f)} opacity={0.3} />
        </g>
      )}
      <path d={`M ${x} ${by} L ${x} ${ty}`} stroke={INK} strokeWidth={pw + 8} strokeLinecap="round" />
      <path d={`M ${x} ${by} L ${x} ${ty}`} stroke={pole} strokeWidth={pw} strokeLinecap="round" />
      <path d={`M ${x + pw * 0.15} ${by - 4} L ${x + pw * 0.15} ${ty + 4}`} stroke={shade(pole, 0.3)} strokeWidth={pw * 0.35} strokeLinecap="round" />
      <path d={arm} fill="none" stroke={INK} strokeWidth={lerp(10, 9, f) + 8} strokeLinecap="round" />
      <path d={arm} fill="none" stroke={pole} strokeWidth={lerp(10, 9, f)} strokeLinecap="round" />
      <path d={`M ${x - 22 + 6 * f} ${by} L ${x - 13} ${by - 46} L ${x + 13} ${by - 46} L ${x + 22 - 6 * f} ${by} Z`} fill={pole} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* classic lantern head */}
      <g opacity={1 - f}>
        <path d={`M ${hx - 22} ${hy + 6} L ${hx} ${hy - 8} L ${hx + 22} ${hy + 6} Z`} fill="#2E4A4F" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d={`M ${hx - 16} ${hy + 6} L ${hx + 16} ${hy + 6} L ${hx + 10} ${hy + 34} L ${hx - 10} ${hy + 34} Z`} fill={mix('#F3E3B0', '#FFE27A', light)} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {snow > 0.01 && <path d={`M ${hx - 24} ${hy + 6} L ${hx} ${hy - 12} L ${hx + 24} ${hy + 6} Q ${hx} ${hy} ${hx - 24} ${hy + 6} Z`} fill={SNOW} stroke={INK} strokeWidth={1.5} opacity={snow} />}
      </g>
      {/* future light blade */}
      <g opacity={f}>
        <ellipse cx={hx + 6} cy={hy + 2} rx={36} ry={6} fill={mix('#DDEFF2', '#BFF4F0', light * 0.6 + 0.4)} stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};

// =====================================================================================================================
// background: clouds, skyline, pods, distant houses, hedges, neighbours
// =====================================================================================================================
const SKY_FAR = makeSkyline(44, -1800, 4000, 131, 120, 290, 3.4, ['#AEB9C6', '#BCC4CC', '#A7B3C2', '#C2BCB4'], ['#BFE3EE', '#D3E6F6', '#AFD7E6', '#D9D3F0']);
const SKY_MID = makeSkyline(44, -1750, 3950, 59, 90, 220, 2.5, ['#B7A592', '#A9B4BF', '#C3AE98', '#9FB0BE'], ['#E4F2F5', '#CBE0F2', '#F1E6DA', '#BDE2E6']);
type Far = {x: number; w: number; kind: 'house' | 'tree'; h: number; rh: number; c: string; rc: string; seed: number};
const FAR_ROW: Far[] = (() => {
  const out: Far[] = [];
  let x = WX0;
  let i = 0;
  const walls = ['#B9C3CC', '#C9BFAF', '#AFC0B5', '#C4B8C2', '#BFC7BA'];
  const roofs = ['#7E8899', '#93806F', '#8A7E8C'];
  while (x < WX1) {
    const r = hash(i * 7.7 + 2);
    const tree = r > 0.7;
    const w = tree ? 90 + hash(i * 3.3) * 70 : 150 + hash(i * 5.1) * 90;
    out.push({x, w, kind: tree ? 'tree' : 'house', h: 70 + hash(i * 2.3) * 45, rh: 42 + hash(i * 4.4) * 30, c: walls[i % walls.length], rc: roofs[i % roofs.length], seed: i});
    x += w + 8 + hash(i * 1.9) * 40;
    i++;
  }
  return out;
})();

const hex01 = (c: string): [number, number, number] => {
  const v = parseInt(c.replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};
/** atmospheric perspective for distant city layers: the children are drawn OPAQUE (so towers never ghost through each
 *  other), then every colour is pulled toward the sky colour `c` by `h` (0..1), lowering contrast and saturation */
const Haze: React.FC<{id: string; c: string; h: number; children: React.ReactNode}> = ({id, c, h, children}) => {
  if (h <= 0.001) return <g>{children}</g>;
  const [r, g, b] = hex01(c);
  const k = 1 - h;
  return (
    <g>
      <defs>
        <filter id={id} x="-5%" y="-30%" width="110%" height="160%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`${k.toFixed(4)} 0 0 0 ${(h * r).toFixed(4)} 0 ${k.toFixed(4)} 0 0 ${(h * g).toFixed(4)} 0 0 ${k.toFixed(4)} 0 ${(h * b).toFixed(4)} 0 0 0 1 0`} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  );
};

const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
    <path d="M -150 30 Q -160 -10 -110 -14 Q -100 -60 -40 -52 Q -10 -96 50 -70 Q 110 -80 118 -24 Q 168 -18 156 30 Z" fill="#EAF2F7" />
    <path d="M -132 16 Q -138 -14 -102 -18 Q -92 -54 -40 -46 Q -10 -86 46 -62 Q 100 -70 108 -26 Q 140 -20 138 8 Q 20 -6 -132 16 Z" fill="#FFFFFF" />
  </g>
);

const Hedge: React.FC<{x0: number; x1: number; base: number; h: number; sl: Season; seed: number; bumpW?: number}> = ({x0, x1, base, h, sl, seed, bumpW = 64}) => {
  const n = Math.max(1, Math.round((x1 - x0) / bumpW));
  const bw = (x1 - x0) / n;
  const tops = Array.from({length: n + 1}, (_, k) => base - h + 10 * hash(seed + k * 1.3));
  let d = `M ${f1(x0)} ${base} L ${f1(x0)} ${f1(tops[0])}`;
  for (let k = 0; k < n; k++) d += ` A ${f1(bw * 0.62)} ${f1(bw * 0.62)} 0 0 1 ${f1(x0 + (k + 1) * bw)} ${f1(tops[k + 1])}`;
  d += ` L ${f1(x1)} ${base} Z`;
  return (
    <g>
      <path d={d} fill={sl.hedge} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={x0 + 2} y={base - h * 0.38} width={x1 - x0 - 4} height={h * 0.38 - 2} fill={shade(sl.hedge, 0.25)} />
      {Array.from({length: n}, (_, k) => <circle key={k} cx={x0 + (k + 0.4) * bw} cy={tops[k] + 16} r={bw * 0.18} fill={mix(sl.hedge, '#FFF7E6', 0.18)} opacity={0.8} />)}
      {sl.snow > 0.01 && Array.from({length: n}, (_, k) => (
        <path key={`s${k}`} d={`M ${f1(x0 + k * bw + 4)} ${f1(tops[k] + 6)} A ${f1(bw * 0.62)} ${f1(bw * 0.62)} 0 0 1 ${f1(x0 + (k + 1) * bw - 4)} ${f1(tops[k + 1] + 6)}`} fill="none" stroke={SNOW} strokeWidth={10} strokeLinecap="round" opacity={sl.snow} />
      ))}
    </g>
  );
};

const Neighbours: React.FC<{D: number; sl: Season; light: number}> = ({D, sl, light}) => {
  const wear = ss(D, 0.1, 1);
  const lw = mix('#BCD2DC', '#C6D6BC', ss(D, 0.35, 0.55)); // repainted mid-way
  const rw = mix('#DCC6BC', '#D2CBC4', wear);
  const glass = mix('#3E4C63', LIT, light);
  const win = (x: number, y: number, w: number, h: number, trim: string, k: number) => (
    <g key={k}>
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill={trim} stroke={INK} strokeWidth={3} />
      <rect x={x} y={y} width={w} height={h} fill={glass} stroke={INK} strokeWidth={2.5} />
      <path d={`M ${x + w / 2} ${y} L ${x + w / 2} ${y + h} M ${x} ${y + h / 2} L ${x + w} ${y + h / 2}`} stroke={trim} strokeWidth={5} />
      <path d={`M ${x + 14} ${y + h} L ${x + w * 0.5} ${y} L ${x + w * 0.5 + 18} ${y} L ${x + 32} ${y + h} Z`} fill="#FFFFFF" opacity={0.16} />
      {sl.snow > 0.01 && <rect x={x - 14} y={y + h + 6} width={w + 28} height={6} rx={3} fill={SNOW} opacity={sl.snow} />}
    </g>
  );
  return (
    <g>
      {/* left: a bungalow */}
      <g>
        <path d={`M -520 ${HB - 320} L -85 ${HB - 540} L 350 ${HB - 320} Z`} fill={mix('#8E5A4A', '#7E5E54', wear)} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <path d={`M -85 ${HB - 534} L 336 ${HB - 324} L 180 ${HB - 324} Z`} fill={shade('#8E5A4A', 0.3)} />
        {sl.snow > 0.01 && <path d={`M -526 ${HB - 318} L -85 ${HB - 546} L 356 ${HB - 318} L 330 ${HB - 324} L -85 ${HB - 520} L -500 ${HB - 324} Z`} fill={SNOW} stroke={INK} strokeWidth={2} opacity={sl.snow} />}
        <rect x={-470} y={HB - 320} width={770} height={320} fill={lw} stroke={INK} strokeWidth={OUT} />
        <rect x={-468} y={HB - 318} width={766} height={26} fill={shade(lw, 0.2)} />
        {win(-390, HB - 250, 150, 130, '#FFFBF0', 1)}
        {win(70, HB - 250, 150, 130, '#FFFBF0', 2)}
        <rect x={-130} y={HB - 270} width={110} height={270} fill="#4F7CC9" stroke={INK} strokeWidth={3} />
        <rect x={-50} y={HB - 268} width={28} height={266} fill={shade('#4F7CC9', 0.25)} />
        <circle cx={-108} cy={HB - 130} r={5} fill={C.saffron} stroke={INK} strokeWidth={2} />
      </g>
      {/* right: a two-storey house */}
      <g>
        <rect x={2090} y={HB - 640} width={700} height={640} fill={rw} stroke={INK} strokeWidth={OUT} />
        <rect x={2070} y={HB - 662} width={740} height={26} fill={mix('#6E6A72', '#66656B', wear)} stroke={INK} strokeWidth={OUT} />
        {sl.snow > 0.01 && <rect x={2066} y={HB - 670} width={748} height={10} rx={5} fill={SNOW} stroke={INK} strokeWidth={2} opacity={sl.snow} />}
        <rect x={2092} y={HB - 636} width={696} height={28} fill={shade(rw, 0.2)} />
        {win(2160, HB - 560, 150, 150, '#FFFBF0', 3)}
        {win(2420, HB - 560, 150, 150, '#FFFBF0', 4)}
        {win(2420, HB - 250, 150, 140, '#FFFBF0', 5)}
        <rect x={2180} y={HB - 280} width={120} height={280} fill={mix('#3F7C6B', '#2E5F72', ss(D, 0.4, 0.7))} stroke={INK} strokeWidth={3} />
        <circle cx={2282} cy={HB - 140} r={5} fill={C.saffron} stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
};

// =====================================================================================================================
// Yard
// =====================================================================================================================
/** layer: 'back' = sky .. lawn, house, tree (figures standing on the lawn or the garden path go after it);
 *  'front' = the pavement, fence, gate, lamp, street, car (drawn after those figures); 'all' = both */
export const Yard: React.FC<{D: number; season: number; t: number; id: string; gateOpen?: number; doorOpen?: number; light?: number; layer?: 'all' | 'back' | 'front'; v3?: boolean}> = ({D: D0, season, t, id, gateOpen = 0, doorOpen = 0, light = 0, layer = 'all', v3 = false}) => {
  const D = clamp(D0);
  const sl = seasonLook(season, v3 ? 2.2 : 1, v3);
  const fSky = Math.pow(clamp((D - 0.06) / 0.94), 1.45);
  const top = mix(skyTop(0.7 * D), '#A9B7C4', 0.35 * sl.snow);
  const bot = mix(skyBot(0.7 * D), '#E6EAEE', 0.3 * sl.snow);
  const T = yardTree(D);
  const pods = ss(D, 0.55, 0.72);
  const fut = ss(D, 0.6, 0.9);
  const pave = mix('#D9D2C3', '#E3E6EA', fut);
  const asphalt = mix('#6E7884', '#5E6E86', fut);
  const S = YARD.street;
  const back = (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1="-700" x2="0" y2="1350">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect x={WX0 - 2000} y={-4000} width={WX1 - WX0 + 4000} height={4000 + G} fill={`url(#${id}-sky)`} />
      {/* the city beyond the rooftops: low blocks rise into slender towers */}
      {v3 ? (
        // V3: solid distant buildings in atmospheric tint (opaque, so the towers never ghost through each other)
        <Haze id={`${id}-hzf`} c={mix(top, bot, 0.85)} h={0.68}>{SKY_FAR.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 70} detail={0.55} light={light} />)}</Haze>
      ) : (
        <g opacity={0.5}>{SKY_FAR.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 70} detail={0.55} light={light} />)}</g>
      )}
      {/* clouds */}
      {[[-300, 140, 1.2], [520, -160, 0.9], [1250, 250, 1.35], [1950, 30, 1.0], [2650, 290, 1.15], [900, -480, 1.1], [-900, -260, 1.0], [3300, -120, 1.1]].map(([cx, cy, s], k) => (
        <Cloud key={k} x={wrapR(cx + t * (10 + 4 * (k % 3)), WX0, WX1)} y={cy} s={s} />
      ))}
      {!v3 && pods > 0.01 && ([[650, 300, 120, 0.7, C.coral], [1550, 620, -160, 0.55, C.saffron], [1150, -150, 90, 0.85, C.teal], [1850, 480, 70, 0.5, C.blue], [300, 820, 140, 0.6, C.coral], [-700, 160, -110, 0.75, C.teal], [2700, 40, 100, 0.65, C.saffron]] as [number, number, number, number, string][]).map(([x0, y, sp, s, c], k) => (
        <g key={k} opacity={pods}>
          <Pod x={wrapR(x0 + t * sp, WX0, WX1)} y={y} s={s} c={c} dir={sp > 0 ? 1 : -1} />
        </g>
      ))}
      {v3 ? (
        <Haze id={`${id}-hzm`} c={mix(top, bot, 0.88)} h={0.46}>{SKY_MID.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 60} detail={0.7} light={light} />)}</Haze>
      ) : (
        <g opacity={0.82}>{SKY_MID.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 60} detail={0.7} light={light} />)}</g>
      )}
      {/* the neighbourhood behind: low houses and trees */}
      <g opacity={0.92}>
        {FAR_ROW.map((h, i) => {
          const base = HB - 66;
          if (h.kind === 'tree') {
            const r = h.w * 0.34;
            const tc = mix('#9DB8A8', sl.leaf, 0.2 * (1 - sl.bare));
            return (
              <g key={i}>
                <rect x={h.x + h.w * 0.5 - 5} y={base - h.h * 0.6} width={10} height={h.h * 0.6 + 8} fill="#8E8A86" stroke={INK} strokeWidth={2} />
                <circle cx={h.x + h.w * 0.38} cy={base - h.h * 0.9} r={r} fill={tc} stroke={INK} strokeWidth={2.5} />
                <circle cx={h.x + h.w * 0.66} cy={base - h.h * 0.72} r={r * 0.82} fill={shade(tc, 0.1)} stroke={INK} strokeWidth={2.5} />
              </g>
            );
          }
          return (
            <g key={i}>
              <path d={`M ${h.x - 10} ${base - h.h} L ${h.x + h.w / 2} ${base - h.h - h.rh} L ${h.x + h.w + 10} ${base - h.h} Z`} fill={h.rc} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
              {sl.snow > 0.01 && <path d={`M ${h.x - 12} ${base - h.h} L ${h.x + h.w / 2} ${base - h.h - h.rh - 4} L ${h.x + h.w + 12} ${base - h.h} L ${h.x + h.w / 2} ${base - h.h - h.rh + 14} Z`} fill={SNOW} opacity={sl.snow} />}
              <rect x={h.x} y={base - h.h} width={h.w} height={h.h + 10} fill={h.c} stroke={INK} strokeWidth={2.5} />
              <rect x={h.x + h.w * 0.2} y={base - h.h + 18} width={22} height={24} fill={mix('#56647A', LIT, light)} stroke={INK} strokeWidth={2} />
              <rect x={h.x + h.w * 0.6} y={base - h.h + 18} width={22} height={24} fill={mix('#56647A', LIT, light * hash(i))} stroke={INK} strokeWidth={2} />
            </g>
          );
        })}
      </g>
      {/* back hedge and the front lawn */}
      <Hedge x0={WX0} x1={WX1} base={HB + 4} h={92} sl={sl} seed={11} bumpW={70} />
      <rect x={WX0} y={HB} width={WX1 - WX0} height={FB - HB + 6} fill={sl.lawn} />
      <rect x={WX0} y={HB} width={WX1 - WX0} height={10} fill={shade(sl.lawn, 0.22)} />
      {sl.snow > 0.01 && (
        <path d={`M ${WX0} ${FB + 6} L ${WX0} ${HB + 6} ${Array.from({length: 58}, (_, k) => `Q ${WX0 + (k + 0.5) * 100} ${HB - 2 + 6 * hash(k)} ${WX0 + (k + 1) * 100} ${HB + 6}`).join(' ')} L ${WX1} ${FB + 6} Z`} fill={SNOW} opacity={sl.snow} />
      )}
      {/* grass tufts */}
      {Array.from({length: 40}, (_, k) => {
        const gx = -400 + k * 80 + 30 * hash(k * 1.3), gy = HB + 26 + 50 * hash(k * 2.7);
        return <path key={k} d={`M ${f1(gx - 7)} ${f1(gy)} L ${f1(gx - 3)} ${f1(gy - 10)} L ${f1(gx)} ${f1(gy)} L ${f1(gx + 4)} ${f1(gy - 12)} L ${f1(gx + 7)} ${f1(gy)}`} fill="none" stroke={shade(sl.lawn, 0.4)} strokeWidth={2.4} strokeLinejoin="round" opacity={0.7 * (1 - sl.snow)} />;
      })}
      {/* the tree's shadow on the lawn */}
      <ellipse cx={T.x + T.canopy.rx * 0.12} cy={T.y + 6} rx={Math.max(40, T.canopy.rx * 0.95)} ry={16 + 8 * T.k} fill={C.shadow} opacity={lerp(0.5, 1, sl.leafAmt)} />
      <Neighbours D={D} sl={sl} light={light} />
      <Home D={D} sl={sl} t={t} id={`${id}-h`} doorOpen={doorOpen} light={light} v3={v3} />
      <FrontGarden D={D} sl={sl} />
      <YardTree D={D} sl={sl} t={t} id={`${id}-t`} />
      {/* fallen leaves on the lawn */}
      {!sl.v3 && sl.fallen * (1 - sl.snow) > 0.01 && Array.from({length: 46}, (_, k) => {
        const lx = T.x + (hash(k * 2.3) - 0.5) * T.canopy.rx * 2.4 + 20, ly = HB + 18 + hash(k * 4.1) * (FB - HB - 14);
        return <ellipse key={k} cx={f1(lx)} cy={f1(ly)} rx={8} ry={4} fill={AUT[k % 3]} stroke={INK} strokeWidth={1.6} opacity={sl.fallen * (1 - sl.snow)} transform={`rotate(${f1(hash(k) * 180)} ${f1(lx)} ${f1(ly)})`} />;
      })}
    </g>
  );
  const front = (
    <g>
      {/* front hedges of the neighbours */}
      <Hedge x0={WX0} x1={455} base={FB + 2} h={80} sl={sl} seed={31} />
      <Hedge x0={2006} x1={WX1} base={FB + 2} h={80} sl={sl} seed={47} />
      {/* pavement */}
      <rect x={WX0} y={FB} width={WX1 - WX0} height={G + 40 - FB} fill={pave} stroke={INK} strokeWidth={3} />
      {Array.from({length: 50}, (_, k) => <line key={k} x1={WX0 + 40 + k * 120} y1={FB + 3} x2={WX0 + 40 + k * 120 - 6} y2={G + 28} stroke={INK} strokeWidth={2} opacity={0.16} />)}
      {sl.snow > 0.01 && <rect x={WX0} y={FB + 1} width={WX1 - WX0} height={9} fill={SNOW} opacity={sl.snow * 0.9} />}
      <Fence D={D} sl={sl} gateOpen={gateOpen} />
      {!v3 && <Lamp x={YARD.lamp.x} D={D} light={light} snow={sl.snow} />}
      {/* kerb and street */}
      <rect x={WX0} y={G + 26} width={WX1 - WX0} height={16} fill={mix('#CFCAC0', '#D9DCE0', fut)} stroke={INK} strokeWidth={3} />
      {sl.snow > 0.01 && <rect x={WX0} y={G + 22} width={WX1 - WX0} height={8} rx={4} fill={SNOW} opacity={sl.snow * 0.9} />}
      <rect x={WX0} y={S.y0 + 2} width={WX1 - WX0} height={S.y1 - S.y0 - 2} fill={asphalt} stroke={INK} strokeWidth={3} />
      <rect x={WX0} y={S.y0 + 3} width={WX1 - WX0} height={14} fill={shade(asphalt, 0.25)} opacity={0.6} />
      {[[-260, 1870, 160], [1290, 1720, 120], [1740, 1960, 190], [2400, 1800, 140], [140, 1780, 90]].map(([px, py, w], k) => (
        <rect key={k} x={px} y={py} width={w} height={28 + 10 * (k % 2)} rx={10} fill={shade(asphalt, 0.18)} opacity={0.55} />
      ))}
      {/* a drain grate at the kerb and a manhole cover (kept outside the landing zone) */}
      <rect x={1290} y={S.y0 + 4} width={86} height={18} rx={3} fill={shade(asphalt, 0.45)} stroke={INK} strokeWidth={2.5} />
      {[0, 1, 2, 3, 4].map((q) => <line key={q} x1={1300 + q * 16} y1={S.y0 + 7} x2={1300 + q * 16} y2={S.y0 + 19} stroke={mix(asphalt, '#FFFFFF', 0.25)} strokeWidth={3} />)}
      <ellipse cx={1640} cy={G + 316} rx={70} ry={20} fill={shade(asphalt, 0.3)} stroke={INK} strokeWidth={3} />
      <ellipse cx={1640} cy={G + 316} rx={52} ry={13} fill="none" stroke={mix(asphalt, '#FFFFFF', 0.2)} strokeWidth={2.5} />
      {Array.from({length: 30}, (_, k) => <rect key={k} x={WX0 + k * 200} y={G + 224} width={110} height={12} rx={6} fill={mix('#F3E6B5', '#7FE3DC', fut)} />)}
      {fut > 0.01 && [G + 112, G + 340].map((gy, k) => <rect key={k} x={WX0} y={gy} width={WX1 - WX0} height={5} fill="#7FE3DC" opacity={fut * 0.65} />)}
      {sl.snow > 0.01 && <rect x={WX0} y={S.y0 + 4} width={WX1 - WX0} height={10} fill={SNOW} opacity={sl.snow * 0.6} />}
      <rect x={WX0} y={S.y1} width={WX1 - WX0} height={16} fill={mix('#CFCAC0', '#D9DCE0', fut)} stroke={INK} strokeWidth={3} />
      <rect x={WX0} y={S.y1 + 16} width={WX1 - WX0} height={84} fill={pave} stroke={INK} strokeWidth={3} />
      <rect x={WX0} y={S.y1 + 100} width={WX1 - WX0} height={3000} fill={shade(sl.lawn, 0.1)} stroke={INK} strokeWidth={3} />
      {sl.snow > 0.01 && <rect x={WX0} y={S.y1 + 101} width={WX1 - WX0} height={3000} fill={SNOW} opacity={sl.snow * 0.85} />}
      {!v3 && <Car D={D} x={YARD.car.x} t={t} />}
      <Drift D={D} sl={sl} t={t} />
    </g>
  );
  if (layer === 'back') return back;
  if (layer === 'front') return front;
  return (
    <g>
      {back}
      {front}
    </g>
  );
};

/** a point on the garden path for feet (u 0 = in front of the gate on G, u 1 = on the porch step), with a mild depth
 *  scale to multiply the figure scale by */
// =====================================================================================================================
// the reverse angle: the view OUT of the family-room window (view coords, a 1080x1920 frame; content spans x -200..1300)
// the front lawn right under the window, the old tree close by on the right, the picket fence and rose arbour seen from
// inside, the pavement and the street, the houses across the road and the city beyond (low in the past, towers by D 1)
// =====================================================================================================================
export const YOUT = {
  /** the fence line (posts stand on it) and the mirror that maps street-side world x to view x (x_view = mirror - x) */
  fenceY: 1330, mirror: 1840,
  street: {y0: 1135, y1: 1275}, farPave: 1110, nearPave: 1275,
  /** the gate's centre in the view, where his friend waits in the present */
  gateX: 1840 - 1175,
  tree: {x: 985, y: 1585, s: 1.18},
  /** the capsule parked on the road in the present */
  capsule: {x: 255, y: 1258, s: 0.36},
};
/** YardOut's garden path (doorPath), in YardOut view coords: from the porch step outside the front door (the door is at
 *  x_view = mirror - door.cx = 325; the step's front edge at y 1578, about where a doorway view's threshold sits) it
 *  leads away, bends toward the gate and runs straight into the open gate on the fence line (y ~1322, x 665).
 *  DOOR_PATH gives the key points for framing a doorway view. */
const OUT_KD = 1.35;
const STEP_Y0 = YOUT.fenceY + (FB - (HB + 24)) * OUT_KD;
const OUT_PATH: P[] = [{x: YOUT.mirror - YARD.gate.cx, y: YOUT.fenceY - 8}, {x: YOUT.mirror - YARD.gate.cx, y: 1470}, {x: YOUT.mirror - YARD.door.cx + 20, y: 1440}, {x: YOUT.mirror - YARD.door.cx, y: STEP_Y0 + 4}];
export const DOOR_PATH = {
  /** the porch step outside the front door (x0..x1, its front edge y0; it runs on below the frame) */
  step: {x0: YOUT.mirror - YARD.porch.x1, x1: YOUT.mirror - YARD.porch.x0, y0: STEP_Y0},
  /** where the path leaves the step, the middle of its bend toward the gate, and its end in the open gate */
  start: OUT_PATH[3], turn: cpt(OUT_PATH[0], OUT_PATH[1], OUT_PATH[2], OUT_PATH[3], 0.5), end: OUT_PATH[0],
  /** the gate in the fence: post centres (view x), the hinge (the panel folds back against it), the arch's top */
  gate: {postL: YOUT.mirror - (YARD.gate.x + YARD.gate.w + GPW / 2), postR: YOUT.mirror - (YARD.gate.x - GPW / 2), hingeX: YOUT.mirror - YARD.gate.hingeX, cx: YOUT.mirror - YARD.gate.cx, y: YOUT.fenceY, archTop: YOUT.fenceY - 330 - 81},
};
const DoorPathOut: React.FC<{D: number; sl: Season}> = ({D, sl}) => {
  const wear = ss(D, 0.1, 1);
  const [P0, P1, P2, P3] = OUT_PATH;
  const N = 18;
  const scaleAt = (y: number) => 1 + (y - YOUT.fenceY) * (0.18 / 255); // the view's mild perspective (fence 1, tree 1.18)
  const SZ = 35 * OUT_KD, HW = 0.36;
  const Lp: P[] = [], Rp: P[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = cpt(P0, P1, P2, P3, u);
    const q = cpt(P0, P1, P2, P3, Math.min(1, u + 0.01)), q0 = cpt(P0, P1, P2, P3, Math.max(0, u - 0.01));
    const SX = 156 * scaleAt(p.y);
    const gx = (q.x - q0.x) / SX, gz = (q.y - q0.y) / SZ;
    const gl = Math.hypot(gx, gz) || 1;
    const nx = -gz / gl, nz = gx / gl;
    Lp.push({x: p.x + nx * HW * SX, y: p.y + nz * HW * SZ});
    Rp.push({x: p.x - nx * HW * SX, y: p.y - nz * HW * SZ});
  }
  const pathD = `M ${Lp.map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')} L ${[...Rp].reverse().map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')} Z`;
  const stone = mix('#E8DCC4', '#D7D0C2', wear);
  const St = DOOR_PATH.step;
  return (
    <g>
      <path d={pathD} fill={stone} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {Array.from({length: N - 1}, (_, i) => (i % 2 === 1 ? <line key={i} x1={Lp[i + 1].x} y1={Lp[i + 1].y} x2={Rp[i + 1].x} y2={Rp[i + 1].y} stroke={INK} strokeWidth={2} opacity={0.3} /> : null))}
      {sl.snow > 0.01 && <path d={pathD} fill={SNOW} opacity={sl.snow * 0.85} />}
      {/* the porch step right outside the door, seen from above: a stone slab, its far edge toward the path */}
      <rect x={St.x0 + 6} y={St.y0 - 5} width={St.x1 - St.x0 - 12} height={8} fill={C.shadow} />
      <rect x={St.x0} y={St.y0} width={St.x1 - St.x0} height={260} fill={mix('#D6D0C2', '#C9C4B8', wear)} stroke={INK} strokeWidth={3} />
      <rect x={St.x0 + 2} y={St.y0 + 2} width={St.x1 - St.x0 - 4} height={6} fill={mix('#ECE7DC', '#DEDAD0', wear)} />
      {[0.34, 0.68].map((u) => <line key={u} x1={St.x0 + (St.x1 - St.x0) * u} y1={St.y0 + 3} x2={St.x0 + (St.x1 - St.x0) * u - 6} y2={St.y0 + 260} stroke={INK} strokeWidth={2} opacity={0.25} />)}
      {sl.snow > 0.01 && <rect x={St.x0} y={St.y0} width={St.x1 - St.x0} height={260} fill={SNOW} opacity={sl.snow * 0.85} />}
    </g>
  );
};

export const YardOut: React.FC<{D: number; season: number; t: number; id: string; gateOpen?: number; light?: number; beyondFence?: React.ReactNode; onLawn?: React.ReactNode;
  /** V3: the V3 year and tree (see PH3), and solid (opaque, sky-tinted) city towers */
  v3?: boolean;
  /** draw the garden path from the front door's step to the gate (positions: DOOR_PATH) */
  doorPath?: boolean;
  /** 0..1: pull the far city's colours toward the sky (less contrast and saturation) */
  skylineHaze?: number;
}> = ({D: D0, season, t, id, gateOpen = 0, light = 0, beyondFence, onLawn, v3 = false, doorPath = false, skylineHaze = 0}) => {
  const D = clamp(D0);
  const sl = seasonLook(season, 1, v3);
  const fSky = Math.pow(clamp((D - 0.06) / 0.94), 1.45);
  const fut = ss(D, 0.6, 0.9);
  const pave = mix('#D9D2C3', '#E3E6EA', fut);
  const asphalt = mix('#6E7884', '#5E6E86', fut);
  const haze = clamp(skylineHaze) * 0.85;
  const skyC = mix(skyTop(0.7 * D), skyBot(0.7 * D), 0.82);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-osky`} gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="1120">
          <stop offset="0" stopColor={skyTop(0.7 * D)} />
          <stop offset="1" stopColor={skyBot(0.7 * D)} />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-1200} width={3600} height={2400} fill={`url(#${id}-osky)`} />
      {[[60, 230, 1.0], [700, 120, 0.8], [1150, 300, 1.1], [-150, 520, 0.9]].map(([cx, cy, sc], k) => (
        <Cloud key={k} x={wrapR(cx + t * (8 + 3 * k), -400, 1600)} y={cy} s={sc} />
      ))}
      {/* the city beyond the houses across the road */}
      <g transform={`translate(-640 ${1020 - (HB - 70)})`}>
        {v3 ? (
          // V3: opaque layers in the sky tint the old opacities gave (so the towers never ghost through each other)
          <g>
            <Haze id={`${id}-ohf`} c={skyC} h={1 - 0.5 * (1 - haze)}>{SKY_FAR.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 70} detail={0.55} light={light} />)}</Haze>
            <Haze id={`${id}-ohm`} c={skyC} h={1 - 0.82 * (1 - haze)}>{SKY_MID.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 60} detail={0.7} light={light} />)}</Haze>
          </g>
        ) : (
          <Haze id={`${id}-oh`} c={skyC} h={haze}>
            <g opacity={0.5}>{SKY_FAR.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 70} detail={0.55} light={light} />)}</g>
            <g opacity={0.82}>{SKY_MID.map((b, i) => <Building key={i} b={b} f={fSky} base={HB - 60} detail={0.7} light={light} />)}</g>
          </Haze>
        )}
      </g>
      {/* the houses across the road (a little nearer than the street-side view's back row) */}
      <g transform={`translate(540 ${YOUT.farPave}) scale(1.35) translate(-1240 ${-(HB - 66)})`}>
        {FAR_ROW.filter((h) => h.x > 400 && h.x < 2100).map((h, i) => {
          const base = HB - 66;
          if (h.kind === 'tree') {
            const r = h.w * 0.34;
            const tc = mix('#9DB8A8', sl.leaf, 0.35 * (1 - sl.bare));
            return (
              <g key={i}>
                <rect x={h.x + h.w * 0.5 - 5} y={base - h.h * 0.6} width={10} height={h.h * 0.6 + 8} fill="#8E8A86" stroke={INK} strokeWidth={2} />
                <circle cx={h.x + h.w * 0.38} cy={base - h.h * 0.9} r={r} fill={tc} stroke={INK} strokeWidth={2.5} />
                <circle cx={h.x + h.w * 0.66} cy={base - h.h * 0.72} r={r * 0.82} fill={shade(tc, 0.1)} stroke={INK} strokeWidth={2.5} />
              </g>
            );
          }
          return (
            <g key={i}>
              <path d={`M ${h.x - 10} ${base - h.h} L ${h.x + h.w / 2} ${base - h.h - h.rh} L ${h.x + h.w + 10} ${base - h.h} Z`} fill={h.rc} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
              <rect x={h.x} y={base - h.h} width={h.w} height={h.h + 10} fill={h.c} stroke={INK} strokeWidth={2.5} />
              <rect x={h.x + h.w * 0.2} y={base - h.h + 18} width={22} height={24} fill={mix('#56647A', LIT, light)} stroke={INK} strokeWidth={2} />
              <rect x={h.x + h.w * 0.6} y={base - h.h + 18} width={22} height={24} fill={mix('#56647A', LIT, light * hash(i))} stroke={INK} strokeWidth={2} />
            </g>
          );
        })}
      </g>
      <Hedge x0={-400} x1={1600} base={YOUT.farPave + 2} h={34} sl={sl} seed={23} bumpW={46} />
      {/* far pavement, the street, the near pavement */}
      <rect x={-400} y={YOUT.farPave} width={2000} height={YOUT.street.y0 - YOUT.farPave} fill={pave} stroke={INK} strokeWidth={2} />
      <rect x={-400} y={YOUT.street.y0} width={2000} height={YOUT.street.y1 - YOUT.street.y0} fill={asphalt} />
      {Array.from({length: 12}, (_, k) => <rect key={k} x={-380 + k * 170} y={(YOUT.street.y0 + YOUT.street.y1) / 2 - 4} width={80} height={8} rx={4} fill={mix('#F2E6B8', '#9FE6EE', fut)} />)}
      <rect x={-400} y={YOUT.street.y1} width={2000} height={YOUT.fenceY - YOUT.street.y1} fill={pave} stroke={INK} strokeWidth={2} />
      {beyondFence}
      {/* the front lawn under the window */}
      <rect x={-400} y={YOUT.fenceY - 4} width={2000} height={900} fill={sl.lawn} />
      <rect x={-400} y={YOUT.fenceY - 4} width={2000} height={12} fill={shade(sl.lawn, 0.22)} />
      {Array.from({length: 26}, (_, k) => {
        const gx = -300 + k * 62 + 30 * hash(k * 1.3), gy = YOUT.fenceY + 60 + 420 * hash(k * 2.7);
        return <path key={k} d={`M ${f1(gx - 9)} ${f1(gy)} L ${f1(gx - 4)} ${f1(gy - 14)} L ${f1(gx)} ${f1(gy)} L ${f1(gx + 5)} ${f1(gy - 16)} L ${f1(gx + 9)} ${f1(gy)}`} fill="none" stroke={shade(sl.lawn, 0.4)} strokeWidth={3} strokeLinejoin="round" opacity={0.7} />;
      })}
      {doorPath && <DoorPathOut D={D} sl={sl} />}
      {/* the fence and the rose arbour, seen from the house side (mirrored) */}
      <g transform={`translate(${YOUT.mirror} ${YOUT.fenceY - FB}) scale(-1 1)`}>
        <Fence D={D} sl={sl} gateOpen={gateOpen} />
      </g>
      {/* the old tree, close to the window on the right */}
      <g transform={`translate(${YOUT.tree.x} ${YOUT.tree.y}) scale(${-YOUT.tree.s} ${YOUT.tree.s}) translate(${-YARD.tree.x} ${-YARD.tree.y})`}>
        <YardTree D={D} sl={sl} t={t} id={`${id}-otr`} />
      </g>
      {onLawn}
    </g>
  );
};
/** a tree trunk passing right across the lens (SCREEN coords): wide enough to cover the whole frame at its centre */
export const NearTrunk: React.FC<{cx: number; D: number; season: number; id: string; w?: number}> = ({cx, D, season, id, w = 1320}) => (
  <FgTrunk cx={cx} D={D} sl={seasonLook(season)} id={id} w={w} />
);

export const yardPath = (u: number) => {
  const Pp = YARD.path;
  const p = cpt({x: Pp.x0, y: Pp.y0}, {x: Pp.x0, y: HB + 70}, {x: 1400, y: HB + 34}, {x: Pp.x1, y: Pp.y1}, clamp(u));
  return {x: p.x, y: p.y, depth: lerp(1, 0.93, clamp((G - p.y) / (G - HB)))};
};

// =====================================================================================================================
// near-camera foreground for the time-jump wipes (SCREEN coordinates)
// =====================================================================================================================
export const FG = {
  parallax: 2.2,
  zoom: 1.6,
  /** default world x the trunk and the leaf mass are tied to (override with the trunkX / leavesX props) */
  trunkX: 1010,
  leavesX: 1300,
  /** screen widths: the trunk body, and the guaranteed full-height solid core of each piece (half widths) */
  trunkW: 700,
  trunkCore: 322,
  leavesCore: 342,
  /** the screen band whose coverage foregroundCover reports */
  band: {x0: 340, x1: 740},
};
/** screen x of a foreground piece tied to worldX */
export const fgScreenX = (worldX: number, camX: number, zoom: number = FG.zoom) => 540 + (worldX - camX) * zoom * FG.parallax;
/** 0..1: how much of the screen centre band (x 340..740, full height) the foreground solid cores cover */
export const foregroundCover = (camX: number, zoom: number = FG.zoom, trunkX: number = FG.trunkX, leavesX: number = FG.leavesX) => {
  const t = fgScreenX(trunkX, camX, zoom), l = fgScreenX(leavesX, camX, zoom);
  const iv: [number, number][] = [[t - FG.trunkCore, t + FG.trunkCore], [l - FG.leavesCore, l + FG.leavesCore]].map(([a, b]) => [Math.max(a, FG.band.x0), Math.min(b, FG.band.x1)] as [number, number]).filter(([a, b]) => b > a);
  iv.sort((a, b) => a[0] - b[0]);
  let sum = 0, end = -Infinity;
  for (const [a, b] of iv) {
    if (b <= end) continue;
    sum += b - Math.max(a, end);
    end = b;
  }
  return clamp(sum / (FG.band.x1 - FG.band.x0));
};
/** the camX interval over which a piece fully covers the centre band */
export const foregroundCoverRange = (piece: 'trunk' | 'leaves', zoom: number = FG.zoom, worldX?: number): [number, number] => {
  const wx = worldX ?? (piece === 'trunk' ? FG.trunkX : FG.leavesX);
  const core = piece === 'trunk' ? FG.trunkCore : FG.leavesCore;
  const half = (core - (FG.band.x1 - FG.band.x0) / 2) / (zoom * FG.parallax);
  return [wx - half, wx + half];
};

const FG_OUT = 10;
const FG_BARK = '#5B4030', FG_BARK_SH = '#3D2B21', FG_BARK_LIT = '#7A5A43';
/** foreground leaf colours per season: [slot colours..., backing] */
const fgLeafCols = (sl: Season) => {
  const slot = (sp: string, su: string, au: string, wi: string) =>
    cyc(sl.s, [[0, sp], [0.15, sp], [0.25, su], [0.42, su], [0.52, au], [0.66, au], [0.74, wi], [0.88, wi], [0.96, sp], [1, sp]]);
  return {
    leaves: [slot('#7DBB5A', '#4E9A4F', '#E8892C', '#B08A5E'), slot('#93C96A', '#5FAA55', '#F2C14E', '#9C7650'), slot('#6AAE52', '#3F8A47', '#D0542A', '#C29D6E'), slot('#86C163', '#56A04F', '#E3A23A', '#A8825A')],
    back: slot('#3F7A3A', '#2C5E33', '#8A3E1E', '#5E4632'),
  };
};

const Leaf: React.FC<{x: number; y: number; ang: number; L: number; w: number; fill: string; snow: number; sw?: number}> = ({x, y, ang, L, w, fill, snow, sw = 7}) => {
  const d = `M 0 0 C ${f1(w * 0.62)} ${f1(-L * 0.16)} ${f1(w * 0.56)} ${f1(-L * 0.72)} 0 ${f1(-L)} C ${f1(-w * 0.56)} ${f1(-L * 0.72)} ${f1(-w * 0.62)} ${f1(-L * 0.16)} 0 0 Z`;
  const half = `M 0 0 C ${f1(w * 0.62)} ${f1(-L * 0.16)} ${f1(w * 0.56)} ${f1(-L * 0.72)} 0 ${f1(-L)} Z`;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})`}>
      <path d={`M 0 ${f1(L * 0.08)} L 0 0`} stroke={INK} strokeWidth={sw + 6} strokeLinecap="round" />
      <path d={d} fill={fill} />
      <path d={half} fill={shade(fill, 0.22)} />
      {[0.3, 0.5, 0.7].map((u, i) => (
        <path key={i} d={`M 0 ${f1(-L * u)} L ${f1(w * 0.3)} ${f1(-L * (u + 0.1))} M 0 ${f1(-L * u)} L ${f1(-w * 0.3)} ${f1(-L * (u + 0.1))}`} stroke={INK} strokeWidth={2.6} opacity={0.32} strokeLinecap="round" />
      ))}
      <path d={`M 0 -4 L 0 ${f1(-L * 0.9)}`} stroke={INK} strokeWidth={3.6} opacity={0.5} strokeLinecap="round" />
      {snow > 0.01 && <path d={`M ${f1(-w * 0.5)} ${f1(-L * 0.62)} Q 0 ${f1(-L * 0.98)} ${f1(w * 0.5)} ${f1(-L * 0.62)} Q 0 ${f1(-L * 0.74)} ${f1(-w * 0.5)} ${f1(-L * 0.62)} Z`} fill={SNOW} opacity={snow} />}
      <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  );
};

const Blossom: React.FC<{x: number; y: number; r: number; op: number}> = ({x, y, r, op}) => (
  <g transform={`translate(${f1(x)} ${f1(y)})`} opacity={op}>
    {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={Math.cos((k * 2 * Math.PI) / 5) * r * 0.7} cy={Math.sin((k * 2 * Math.PI) / 5) * r * 0.7} r={r * 0.62} fill="#F8C6D6" stroke={INK} strokeWidth={4} />)}
    {[0, 1, 2, 3, 4].map((k) => <circle key={`f${k}`} cx={Math.cos((k * 2 * Math.PI) / 5) * r * 0.7} cy={Math.sin((k * 2 * Math.PI) / 5) * r * 0.7} r={r * 0.58} fill="#FBD6E1" />)}
    <circle r={r * 0.32} fill="#E9A91C" stroke={INK} strokeWidth={3} />
  </g>
);

const FgTrunk: React.FC<{cx: number; D: number; sl: Season; id: string; w?: number}> = ({cx, D, sl, id, w = FG.trunkW}) => {
  const hw = w / 2;
  const ys = Array.from({length: 21}, (_, k) => -160 + k * 115);
  const Lp = ys.map((y) => ({x: cx - hw + 18 * noise1(y / 260 + 3.1, 3), y}));
  const Rp = ys.map((y) => ({x: cx + hw + 18 * noise1(y / 260 + 7.7, 9), y}));
  const body = closed([...Lp, ...[...Rp].reverse()], 0.8);
  const cols = fgLeafCols(sl);
  // a branch out of the right side near the top
  const br = tube([{x: cx + hw - 80, y: 560}, {x: cx + hw + 160, y: 330}, {x: cx + hw + 420, y: 130}, {x: cx + hw + 760, y: -90}], [92, 70, 54, 42], false, false);
  const brD = closed(br.outline, 0.8);
  const tw = tube([{x: cx + hw + 300, y: 220}, {x: cx + hw + 420, y: 340}, {x: cx + hw + 540, y: 420}], [26, 18, 12], true, false);
  const twD = closed(tw.outline, 0.8);
  const leafSpots: [number, number, number][] = [[560, 470, 30], [470, 360, -40], [640, 360, 80], [700, 120, 20], [860, 60, 70], [600, -20, -20], [800, 230, 120], [950, -70, 40]];
  const moss = lerp(0.35, 1, ss(D, 0, 1));
  return (
    <g>
      {/* branch (behind the trunk) and its leaves */}
      <path d={brD} fill={FG_BARK} stroke={INK} strokeWidth={FG_OUT} strokeLinejoin="round" />
      <path d={open(br.C.map((p, i) => ({x: p.x + br.N[i].x * -br.rad[i] * 0.45, y: p.y + br.N[i].y * -br.rad[i] * 0.45})))} fill="none" stroke={FG_BARK_SH} strokeWidth={38} strokeLinecap="round" />
      {sl.snow > 0.01 && <path d={open(br.C.map((p, i) => ({x: p.x + br.N[i].x * br.rad[i] * 0.78, y: p.y + br.N[i].y * br.rad[i] * 0.78})))} fill="none" stroke={SNOW} strokeWidth={22} strokeLinecap="round" opacity={sl.snow} />}
      <path d={twD} fill={FG_BARK} stroke={INK} strokeWidth={FG_OUT * 0.8} strokeLinejoin="round" />
      {leafSpots.map(([dx, y, a], i) => (
        <Leaf key={i} x={cx + hw + dx - 200} y={y + 40} ang={a} L={230 + 40 * hash(i * 2.3)} w={110} fill={cols.leaves[i % 4]} snow={sl.snow} />
      ))}
      {sl.blossom > 0.01 && [[560, 300], [760, 140], [900, 0]].map(([dx, y], i) => <Blossom key={i} x={cx + hw + dx - 200} y={y} r={44} op={sl.blossom} />)}
      {/* trunk body */}
      <path d={body} fill={FG_BARK} />
      <defs>
        <clipPath id={`${id}-fgt`}><path d={body} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-fgt)`}>
        <path d={closed([...ys.map((y) => ({x: cx + hw * 0.34 + 26 * noise1(y / 300, 5), y})), {x: cx + hw + 80, y: 2100}, {x: cx + hw + 80, y: -200}], 0.6)} fill={FG_BARK_SH} />
        <path d={closed([{x: cx - hw - 60, y: -200}, {x: cx - hw - 60, y: 2100}, ...[...ys].reverse().map((y) => ({x: cx - hw + 48 + 14 * noise1(y / 240, 8), y}))], 0.6)} fill={FG_BARK_LIT} />
        {[-0.62, -0.36, -0.1, 0.16, 0.42, 0.66].map((u, k) => {
          const pts = Array.from({length: 13}, (_, j) => ({x: cx + u * hw + 22 * noise1(j * 0.8 + k * 3, k + 1), y: -160 + j * 190}));
          return (
            <g key={k}>
              <path d={open(pts)} fill="none" stroke={shade(FG_BARK, 0.55)} strokeWidth={16} strokeLinecap="round" />
              <path d={open(pts)} fill="none" stroke={INK} strokeWidth={4.5} opacity={0.65} strokeLinecap="round" />
            </g>
          );
        })}
        {Array.from({length: 9}, (_, k) => {
          const y = 120 + k * 210 + 40 * hash(k * 3.3), x = cx + (hash(k * 1.7) - 0.5) * hw * 1.2;
          return <path key={k} d={`M ${f1(x - 40)} ${f1(y)} q 40 -10 80 4`} fill="none" stroke={INK} strokeWidth={4} opacity={0.45} strokeLinecap="round" />;
        })}
        {/* knot */}
        <ellipse cx={cx - 70} cy={1200} rx={56} ry={78} fill={FG_BARK_SH} stroke={INK} strokeWidth={6} />
        <ellipse cx={cx - 64} cy={1206} rx={28} ry={42} fill="#2A1D16" stroke={INK} strokeWidth={4} />
        <path d={`M ${cx - 140} 1110 Q ${cx - 70} 1060 ${cx} 1110`} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />
        {/* moss on the lower left */}
        <g>
          {(() => {
            const top = 2000 - 640 * moss;
            const ys2 = Array.from({length: 12}, (_, j) => lerp(top, 2040, j / 11));
            const edge = ys2.map((y, j) => ({x: cx - hw + 34 + 40 * Math.abs(Math.sin(j * 1.3)) + 70 * ss(y, top, 2000), y}));
            const d = closed([{x: cx - hw - 80, y: top - 20}, ...edge, {x: cx - hw + 160, y: 2100}, {x: cx - hw - 80, y: 2100}], 0.9);
            return (
              <g>
                <path d={d} fill="#6F9A4A" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
                {edge.map((p, j) => (j % 2 ? <circle key={j} cx={p.x - 30} cy={p.y + 10} r={10} fill="#8DB660" /> : null))}
              </g>
            );
          })()}
        </g>
      </g>
      <path d={body} fill="none" stroke={INK} strokeWidth={FG_OUT} strokeLinejoin="round" />
    </g>
  );
};

const FgLeaves: React.FC<{cx: number; sl: Season; t: number}> = ({cx, sl, t}) => {
  const cols = fgLeafCols(sl);
  const sway = Math.sin(t * 1.3) * 6;
  const backs = Array.from({length: 14}, (_, k) => ({x: cx + (k % 2 ? 40 : -40) + 14 * noise1(k * 0.7, 2), y: -220 + k * 180, r: 400}));
  const leaves: {x: number; y: number; ang: number; L: number; w: number; c: number; key: number; o: number}[] = [];
  const offs = [-340, -175, 0, 175, 340];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < offs.length; c++) {
      const k = r * 10 + c;
      const off = offs[c] + (hash(k * 1.3) - 0.5) * 70;
      const outward = off / 340;
      const ang = Math.abs(outward) > 0.8 ? Math.sign(outward) * (65 + 45 * hash(k * 2.1)) : outward * 70 + (hash(k * 2.9) - 0.5) * 110;
      leaves.push({x: cx + off + sway * (1 - Math.abs(outward)), y: -120 + r * 172 + (hash(k * 3.7) - 0.5) * 80, ang, L: 250 + 80 * hash(k * 4.3), w: 115 + 30 * hash(k * 5.9), c: k % 4, key: k, o: hash(k * 6.1)});
    }
  }
  leaves.sort((a, b) => a.o - b.o);
  return (
    <g>
      {backs.map((b, k) => <circle key={`o${k}`} cx={b.x} cy={b.y} r={b.r} fill={INK} stroke={INK} strokeWidth={FG_OUT * 2} />)}
      {backs.map((b, k) => <circle key={`f${k}`} cx={b.x} cy={b.y} r={b.r} fill={cols.back} />)}
      {Array.from({length: 6}, (_, k) => {
        const y0 = -100 + k * 380;
        return <path key={`tw${k}`} d={`M ${cx - 420} ${y0 + 120} Q ${cx} ${y0 - 40} ${cx + 430} ${y0 + 160}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />;
      })}
      {Array.from({length: 6}, (_, k) => {
        const y0 = -100 + k * 380;
        return <path key={`tf${k}`} d={`M ${cx - 420} ${y0 + 120} Q ${cx} ${y0 - 40} ${cx + 430} ${y0 + 160}`} fill="none" stroke={FG_BARK} strokeWidth={10} strokeLinecap="round" />;
      })}
      {leaves.map((l) => <Leaf key={l.key} x={l.x} y={l.y} ang={l.ang} L={l.L} w={l.w} fill={cols.leaves[l.c]} snow={sl.snow * (hash(l.key * 7.7) > 0.35 ? 1 : 0)} />)}
      {sl.blossom > 0.01 && Array.from({length: 16}, (_, k) => (
        <Blossom key={k} x={cx + (hash(k * 8.1) - 0.5) * 640} y={-60 + k * 128 + 40 * hash(k * 9.3)} r={40 + 12 * hash(k * 2.2)} op={sl.blossom} />
      ))}
    </g>
  );
};

/** near-camera foreground, in SCREEN coordinates (draw on top of the camera-transformed world). Each piece is tied to
 *  a world x and moves with parallax FG.parallax relative to camX: screenX = 540 + (worldX - camX) * zoom * 2.2 */
export const YardForeground: React.FC<{camX: number; t: number; D: number; season: number; id: string; zoom?: number; trunkX?: number; leavesX?: number}> = ({camX, t, D, season, id, zoom = FG.zoom, trunkX = FG.trunkX, leavesX = FG.leavesX}) => {
  const sl = seasonLook(season);
  const tx = fgScreenX(trunkX, camX, zoom), lx = fgScreenX(leavesX, camX, zoom);
  return (
    <g>
      {tx > -FG.trunkW / 2 - 1150 && tx < 1080 + FG.trunkW / 2 + 20 ? <FgTrunk cx={tx} D={D} sl={sl} id={`${id}-tr`} /> : null}
      {lx > -760 && lx < 1840 ? <FgLeaves cx={lx} sl={sl} t={t} /> : null}
    </g>
  );
};

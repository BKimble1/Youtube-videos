// One sheet model for PHerc. 1667, shared by every view: the cross-section spiral, the flattening and the page.
// Units are "page units": the surviving sheet is PL long and PH tall (about 41 units per cm: 140 cm x 8 cm).
// The spiral lives in the same units, so a point s along the sheet keeps its identity in every view.
// s = arc length measured from the OUTER end of the surviving roll (s = 0) to the core (s = PL).
// The text runs the same way: column 1 sits at the outer end, column 22 (the end of the book) at the core.
import COLS from '../data/columns.json';
import {clamp, hash, lerp, noise1} from './math';

export const PL = 5800; // sheet length (≈ 1.4 m)
export const PH = 330; // surviving height (≈ 8 cm)
export const TURNS = 36;
export const R_IN = 6;
export const R_OUT = 41; // ≈ 2 cm diameter
export const SQUASH = 0.84; // the roll is slightly flattened
const PITCH = (R_OUT - R_IN) / TURNS;

// --------------------------------------------------------------------------------------------- spiral
export type SP = {x: number; y: number; s: number; th: number};
/** contact points: [turn index from outside (0 = outermost), angle (rad)] where two neighbouring turns press together */
export const CONTACTS: {turn: number; phi: number}[] = [
  {turn: 9, phi: 0.55},
  {turn: 17, phi: 3.7},
  {turn: 24, phi: 5.3},
];
/** the contact used for the wrong-layer demonstration */
export const BEND = CONTACTS[0];

const radiusAt = (th: number) => {
  // th: 0 at the outer end, increasing inward
  const turnF = th / (Math.PI * 2);
  const phi = th % (Math.PI * 2);
  let r = R_OUT - PITCH * turnF;
  // slow, turn-coherent wobble (never larger than a fraction of the pitch between neighbours)
  r += 1.6 * Math.sin(2 * phi + 0.6) * (r / R_OUT) + 1.1 * noise1(phi * 1.3 + 7, 3) * (r / R_OUT);
  r += 0.25 * PITCH * noise1(th * 0.9, 11);
  // contacts: turn k bulges inward, turn k+1 outward, so they touch at phi
  for (const c of CONTACTS) {
    let d = phi - c.phi;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const g = Math.exp(-(d * d) / 0.09);
    const t = Math.floor(turnF);
    if (t === c.turn) r -= 0.5 * PITCH * g;
    if (t === c.turn + 1) r += 0.5 * PITCH * g;
  }
  return Math.max(R_IN * 0.6, r);
};

const buildSpiral = (): SP[] => {
  const N = TURNS * 140;
  const thMax = TURNS * Math.PI * 2;
  const pts: SP[] = [];
  let s = 0;
  let px = 0;
  let py = 0;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * thMax;
    const r = radiusAt(th);
    // the outer end starts at the right and winds anticlockwise inward (on screen)
    const a = -th + 0.15;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a) * SQUASH;
    if (i > 0) s += Math.hypot(x - px, y - py);
    pts.push({x, y, s, th});
    px = x;
    py = y;
  }
  // normalise arc length to PL (the spiral IS the sheet)
  const k = PL / s;
  return pts.map((p) => ({...p, s: p.s * k}));
};
export const SPIRAL: SP[] = buildSpiral();

/** index of the spiral sample nearest arc length s */
export const idxAt = (s: number) => {
  let lo = 0;
  let hi = SPIRAL.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (SPIRAL[m].s < s) lo = m;
    else hi = m;
  }
  return lo;
};
export const spiralAt = (s: number) => {
  const i = idxAt(clamp(s, 0, PL));
  const a = SPIRAL[i];
  const b = SPIRAL[Math.min(SPIRAL.length - 1, i + 1)];
  const t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
  return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)};
};
/** arc length at turn index + angle (for the contacts) */
export const sAtTurnPhi = (turn: number, phi: number) => {
  const th = (turn + phi / (Math.PI * 2)) * Math.PI * 2;
  const thMax = TURNS * Math.PI * 2;
  return SPIRAL[Math.round((th / thMax) * (SPIRAL.length - 1))].s;
};
export const S_BEND = sAtTurnPhi(BEND.turn, BEND.phi); // on the outer of the two touching turns
export const S_BEND_IN = sAtTurnPhi(BEND.turn + 1, BEND.phi); // the same place on the next turn in
export const TURN_LEN = S_BEND_IN - S_BEND;

// --------------------------------------------------------------------------------------------- text layout
export const MARGIN = 70;
export const NCOL = 22;
export const CP = (PL - 2 * MARGIN) / NCOL; // column pitch (≈ 257)
export const ADV = 11.2; // glyph advance (bookhand letters are fairly even)
export const FS = 15.5; // font size
export const LH = 21.5; // line height
export const BOTTOM = PH / 2 - 36; // baseline of the last line (v measured from the sheet's mid-line, + = down)
export const colCenter = (c: number) => MARGIN + (c - 0.5) * CP;

export type Glyph = {ch: string; s: number; v: number; unc: boolean; trace: boolean; col: number; line: number; k: number};
export type Hole = {s: number; v: number; rx: number; ry: number; seed: number};
type ColData = {lines: string[]; maj: string[]; tr: string};
const C = COLS as unknown as Record<string, ColData>;

const layout = () => {
  const glyphs: Glyph[] = [];
  const holes: Hole[] = [];
  for (let c = 1; c <= NCOL; c++) {
    const d = C[String(c)];
    const x0 = colCenter(c) - 9.2 * ADV;
    if (!d) {
      // cols 1-4: only scattered traces survive
      for (let k = 0; k < 14; k++) {
        const r = hash(c * 100 + k, 5);
        glyphs.push({ch: '', s: x0 + hash(k, c) * 200, v: BOTTOM - Math.floor(r * 8) * LH, unc: true, trace: true, col: c, line: -1, k});
      }
      holes.push({s: colCenter(c) + 30, v: -40 + c * 9, rx: 70 + c * 6, ry: 60, seed: c});
      continue;
    }
    const lines = d.maj;
    const n = lines.length;
    lines.forEach((ln, li) => {
      const v = BOTTOM - (n - 1 - li) * LH;
      let lost = false;
      let k = 0;
      let runStart = -1;
      const chars = [...ln];
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch === '[') {
          lost = true;
          runStart = k;
          continue;
        }
        if (ch === ']') {
          lost = false;
          if (runStart >= 0 && k > runStart) holes.push({s: x0 + ((runStart + k) / 2) * ADV, v: v - 5, rx: Math.max(10, ((k - runStart) / 2) * ADV + 4), ry: 14, seed: c * 1000 + li * 31 + k});
          runStart = -1;
          continue;
        }
        if (ch === '(' || ch === ')') continue;
        if (ch === '̣') {
          if (glyphs.length && glyphs[glyphs.length - 1].col === c && glyphs[glyphs.length - 1].line === li) glyphs[glyphs.length - 1].unc = true;
          continue;
        }
        const next = chars[i + 1];
        const isTrace = ch === ' ' && next === '̣';
        if (isTrace) {
          if (!lost) glyphs.push({ch: '', s: x0 + k * ADV, v, unc: true, trace: true, col: c, line: li, k});
          k += 1;
          i += 1;
          continue;
        }
        if (ch === ' ') {
          k += 0.6;
          continue;
        }
        if (!lost) glyphs.push({ch, s: x0 + k * ADV, v, unc: false, trace: false, col: c, line: li, k});
        k += ch === '.' || ch === ',' || ch === "'" ? 0.5 : 1;
      }
      if (lost && runStart >= 0) holes.push({s: x0 + ((runStart + k) / 2) * ADV, v: v - 5, rx: Math.max(10, ((k - runStart) / 2) * ADV + 4), ry: 14, seed: c * 1000 + li * 31 + k});
    });
    // physically missing areas above the surviving text block (the broken upper part of each column)
    const top = BOTTOM - (n - 1) * LH - 30;
    if (hash(c, 9) > 0.35) holes.push({s: colCenter(c) + (hash(c, 2) - 0.5) * 160, v: Math.min(-PH / 2 + 18, top - 30), rx: 30 + hash(c, 3) * 60, ry: 16 + hash(c, 4) * 22, seed: c + 50});
  }
  // a few larger lacunae that cross the mid-line (they appear as breaks in the cross-section too)
  const big: Hole[] = [
    {s: 820, v: 10, rx: 46, ry: 70, seed: 1},
    {s: 2760, v: -20, rx: 38, ry: 90, seed: 2},
    {s: 3420, v: 30, rx: 30, ry: 60, seed: 3},
    {s: 4520, v: -10, rx: 34, ry: 80, seed: 4},
  ];
  holes.push(...big);
  return {glyphs, holes};
};
export const LAYOUT = layout();

/** column-19 glyphs of the quoted lines (lines 11-12, 0-based 10-11) */
export const QUOTE_LINES = [10, 11];
export const isQuote = (g: Glyph) => g.col === 19 && QUOTE_LINES.includes(g.line);

/** breaks of the sheet in the cross-section (where a lacuna crosses the mid-line, v = 0) */
export const BREAKS: [number, number][] = LAYOUT.holes
  .filter((h) => h.ry >= 40 && Math.abs(h.v) < h.ry)
  .map((h) => {
    const half = h.rx * Math.sqrt(1 - (h.v / h.ry) ** 2);
    return [h.s - half, h.s + half] as [number, number];
  })
  .filter(([a, b]) => b - a > 8);
export const isBroken = (s: number) => BREAKS.some(([a, b]) => s > a && s < b);

/** edge profiles of the sheet (top is the broken upper edge, bottom the intact lower margin) */
export const topEdge = (s: number) => -PH / 2 + 10 + 16 * Math.abs(noise1(s / 60, 21)) + 9 * Math.abs(noise1(s / 13, 22));
export const bottomEdge = (s: number) => PH / 2 - 3 - 4 * Math.abs(noise1(s / 40, 23));

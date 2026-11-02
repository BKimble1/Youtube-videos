// The hero: the fractured distal radius, the adhesive bead, the wet wound film and the healing (drawn in the inside
// layer, world millimetres; anatomy.ts holds the geometry). The four fragments never move: the surgeon holds them
// reduced and the adhesive bridges the cracks. Line widths are given in screen pixels (px = mm per pixel) so the ink
// stays even at every zoom, from the 30 mm opening close-up to the 250 mm cutaway.
import React from 'react';
import {P, add, closed, lerpP, mul, nrm, open, perp, pt, sub, len} from '../core/geo';
import {mix, rgba} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, noise1, ss} from '../lib';
import {C} from './palette';
import {C1, C2, C3, RADIUS, jag, radiusEdges} from './anatomy';

const LIGHT = nrm(pt(-0.62, -0.78));

// ---------------------------------------------------------------- the bead path
type Path = {pts: P[]; cum: number[]; L: number};
const mk = (pts: P[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + len(sub(pts[i], pts[i - 1])));
  return {pts, cum, L: cum[cum.length - 1]};
};
/** a smooth resampling of a polyline (Catmull-Rom), every `step` mm */
const smoothSample = (ps: P[], step = 0.25): P[] => {
  const dense: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) {
      const u = k / 12, u2 = u * u, u3 = u2 * u;
      dense.push(pt(
        0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
      ));
    }
  }
  dense.push(ps[ps.length - 1]);
  const d = mk(dense);
  const out: P[] = [];
  for (let s = 0; s <= d.L + 1e-6; s += step) out.push(atS(d, s));
  if (len(sub(out[out.length - 1], dense[dense.length - 1])) > 1e-3) out.push(dense[dense.length - 1]);
  return out;
};
const atS = (p: Path, s: number): P => {
  if (s <= 0) return p.pts[0];
  if (s >= p.L) return p.pts[p.pts.length - 1];
  let lo = 0, hi = p.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.cum[m] <= s) lo = m; else hi = m;
  }
  const u = (s - p.cum[lo]) / (p.cum[hi] - p.cum[lo] || 1);
  return lerpP(p.pts[lo], p.pts[hi], u);
};
/** the bead runs along C1 (ulnar -> radial border), hops to the radial end of C3 and follows it back to C1, then hops
 *  to the C2 junction and runs up C2 toward the joint */
const C3R = [...C3].reverse();
export const BEAD_SEGS: Path[] = [mk(smoothSample(C1)), mk(smoothSample(C3R)), mk(smoothSample(C2))];
const HOP = 4; // mm of "laid" budget used by each hop (the tip lifts and moves; no glue)
export const SEG_START = (() => {
  const o = [0];
  for (let i = 1; i < BEAD_SEGS.length; i++) o.push(o[i - 1] + BEAD_SEGS[i - 1].L + HOP);
  return o;
})();
export const BEAD_TOTAL = SEG_START[SEG_START.length - 1] + BEAD_SEGS[BEAD_SEGS.length - 1].L;
/** where the applicator tip is for a laid length, and whether it is mid-hop (lift 0..1) */
export const beadTip = (laid: number): {p: P; dir: P; lift: number; seg: number} => {
  for (let i = BEAD_SEGS.length - 1; i >= 0; i--) {
    const s = laid - SEG_START[i];
    if (s >= 0) {
      const g = BEAD_SEGS[i];
      if (s <= g.L) {
        const a = atS(g, s), b = atS(g, Math.min(g.L, s + 0.5));
        return {p: a, dir: nrm(sub(b, a.x === b.x && a.y === b.y ? atS(g, s - 0.5) : a)), lift: 0, seg: i};
      }
      // a hop to the next segment: arc over in a straight line, lifted
      const u = clamp((s - g.L) / HOP);
      const from = g.pts[g.pts.length - 1], to = BEAD_SEGS[Math.min(BEAD_SEGS.length - 1, i + 1)].pts[0];
      return {p: lerpP(from, to, ss(u, 0, 1)), dir: nrm(sub(to, from)), lift: Math.sin(Math.PI * u), seg: i};
    }
  }
  return {p: BEAD_SEGS[0].pts[0], dir: pt(1, 0), lift: 0, seg: 0};
};

// ---------------------------------------------------------------- state
export type Heal = {hem: number; soft: number; hard: number; resorb: number; remodel: number};
export type BoneState = {
  t: number;
  /** mm of bead laid along the bead path; and the laid length as a function of time (for each point's age) */
  laid: number;
  laidAt: (s: number) => number; // the time at which bead length s was laid
  /** glue fill seeping along the cracks beyond the bead (0..1, for the cutaway, so every crack is full) */
  seep: number;
  set: number;   // 0 fresh, glossy .. 1 set (satin)
  wet: number;   // 0..1 the blood-tinted fluid film (macro beat)
  heal: Heal;
  px: number;    // world mm per screen pixel (line widths)
};
export const HEAL0: Heal = {hem: 0, soft: 0, hard: 0, resorb: 0, remodel: 0};

// ---------------------------------------------------------------- helpers
const offsetLine = (ps: P[], d: (i: number, n: P) => number): P[] => {
  const n = ps.length;
  return ps.map((p, i) => {
    const t = nrm(sub(ps[Math.min(n - 1, i + 1)], ps[Math.max(0, i - 1)]));
    const nn = perp(t);
    return add(p, mul(nn, d(i, nn)));
  });
};
const dotL = (n: P) => n.x * LIGHT.x + n.y * LIGHT.y;
const RAD_PATH = closed(RADIUS, 0.55);

/** the radius' cel shading across the shaft (lit on the left, core shadow right of centre, a little bounce) */
const BoneShade: React.FC<{gid: string}> = ({gid}) => (
  <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={-14} y1={-6} x2={16} y2={4}>
    <stop offset={0} stopColor={C.boneLit} />
    <stop offset={0.3} stopColor={mix(C.boneLit, C.bone, 0.55)} />
    <stop offset={0.58} stopColor={C.bone} />
    <stop offset={0.8} stopColor={C.boneShade} />
    <stop offset={0.93} stopColor={mix(C.boneShade, C.boneDeep, 0.35)} />
    <stop offset={1} stopColor={mix(C.boneShade, '#B8A7B4', 0.4)} />
  </linearGradient>
);

/** vascular pores on the cortex, in view only (macro detail) */
const Pores: React.FC<{view: [number, number, number, number]; px: number; healed: number}> = ({view, px, healed}) => {
  const cell = 0.55;
  const [x0, y0, x1, y1] = view;
  const out: React.ReactNode[] = [];
  if (px > 0.02) return null;
  const a = clamp((0.02 - px) / 0.008);
  for (let gx = Math.floor(x0 / cell); gx <= Math.ceil(x1 / cell); gx++) {
    for (let gy = Math.floor(y0 / cell); gy <= Math.ceil(y1 / cell); gy++) {
      const h = hash(gx * 91.7 + gy * 13.3);
      if (h > 0.32) continue;
      const x = (gx + 0.15 + 0.7 * hash(gx * 3.1 + gy * 7.7)) * cell, y = (gy + 0.15 + 0.7 * hash(gx * 5.3 + gy * 2.9)) * cell;
      const [l, r] = radiusEdges(y);
      if (!(x > l + 0.5 && x < r - 0.5)) continue;
      const rr = 0.025 + 0.04 * hash(gx * 1.7 + gy * 9.1);
      out.push(<ellipse key={`${gx}_${gy}`} cx={x} cy={y} rx={rr * 1.6} ry={rr} fill={mix(C.cancellousPore, C.newBonePore, healed)} opacity={0.45 * a} />);
    }
  }
  return <g>{out}</g>;
};

/** the cancellous (spongy) face exposed along a crack: a band with pores, then the dark gap */
const CrackBand: React.FC<{ps: P[]; px: number; fill: number; fade: number}> = ({ps, px, fill, fade}) => {
  const d = open(ps, 0.4);
  const gapCol = mix(C.cavity, C.newBone, fill);
  const faceCol = mix(C.cancellous, C.newBone, fill);
  const pores: React.ReactNode[] = [];
  if (px < 0.05) {
    for (let i = 1; i < ps.length - 1; i += 1) {
      const h = hash(i * 7.31 + ps[0].x * 3.3);
      const side = h > 0.5 ? 1 : -1;
      const t = nrm(sub(ps[i + 1], ps[i - 1]));
      const q = add(ps[i], mul(perp(t), side * (0.45 + 0.25 * hash(i * 1.9))));
      pores.push(<circle key={i} cx={q.x} cy={q.y} r={0.06 + 0.07 * hash(i * 4.7)} fill={mix(C.cancellousPore, C.newBonePore, fill)} opacity={0.8} />);
    }
  }
  const lit = offsetLine(ps, (_, n) => -Math.sign(dotL(n) || 1) * 0.62);
  const sh = offsetLine(ps, (_, n) => Math.sign(dotL(n) || 1) * 0.66);
  return (
    <g opacity={1 - fade}>
      <path d={d} stroke={faceCol} strokeWidth={1.75} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pores}
      <path d={open(sh, 0.4)} stroke={mix(C.boneDeep, C.bone, fill)} strokeWidth={Math.max(0.16, 2.2 * px)} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d={open(lit, 0.4)} stroke={C.boneLit} strokeWidth={Math.max(0.12, 1.6 * px)} fill="none" opacity={0.85} strokeLinecap="round" />
      <path d={d} stroke={gapCol} strokeWidth={0.62 + 0.5 * (1 - fill) * 0.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {fill < 0.6 && <path d={d} stroke={C.marrow} strokeWidth={0.22} fill="none" opacity={0.6 * (1 - fill / 0.6)} strokeLinecap="round" />}
    </g>
  );
};

// ---------------------------------------------------------------- the bead
type Ribbon = {L: P[]; R: P[]; C: P[]; hw: number[]; front: boolean};
/** half-width of the bead at a point of the given age (s since laid), with an organic wobble along its length */
const beadHW = (age: number, s: number, resorb: number) => {
  const fresh = 1.2 + 0.52 * (1 - Math.exp(-age / 0.3)); // a gel rope that slumps and wets out over the crack
  const wob = 0.08 * noise1(s * 0.9, 3) + 0.05 * noise1(s * 2.7, 5);
  let w = fresh + wob;
  if (resorb > 0) {
    // the new bone eats in from the edges and breaks the bead into shrinking islands
    const isl = 0.5 + 0.5 * noise1(s * 0.55, 9);
    const k = clamp(1 - resorb * (1.35 - 0.7 * isl)) * clamp((1 - resorb) * 2.2);
    w *= k ** 0.85;
  }
  return w;
};
const ribbonFor = (g: Path, s0: number, s1: number, st: BoneState, segStart: number, isFront: boolean): Ribbon | null => {
  if (s1 - s0 < 0.05) return null;
  const C_: P[] = [], hw: number[] = [];
  const n = Math.max(2, Math.ceil((s1 - s0) / 0.22));
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    C_.push(atS(g, s));
    const laidT = st.laidAt(segStart + s);
    let w = beadHW(Math.max(0, st.t - laidT), segStart + s, st.heal.resorb);
    if (isFront) {
      // the fresh end tapers into the cannula's gel bulb
      const fromTip = s1 - s;
      w *= 0.62 + 0.38 * ss(fromTip, 0, 1.6);
    }
    hw.push(w);
  }
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = nrm(sub(C_[Math.min(n, i + 1)], C_[Math.max(0, i - 1)]));
    const nn = perp(t);
    L.push(add(C_[i], mul(nn, hw[i])));
    R.push(add(C_[i], mul(nn, -hw[i])));
  }
  return {L, R, C: C_, hw, front: isFront};
};
const capPts = (c: P, dirv: P, r: number, sign: number): P[] => {
  const nn = perp(dirv);
  const out: P[] = [];
  for (let k = 1; k < 7; k++) {
    const a = (k / 7) * Math.PI;
    out.push(add(c, add(mul(nn, Math.cos(a) * r * sign), mul(dirv, Math.sin(a) * r * sign))));
  }
  return out;
};
const ribbonOutline = (rb: Ribbon) => {
  const n = rb.C.length - 1;
  const tEnd = nrm(sub(rb.C[n], rb.C[n - 1]));
  const tStart = nrm(sub(rb.C[1], rb.C[0]));
  const endCap = capPts(rb.C[n], tEnd, rb.hw[n], 1);
  const startCap = capPts(rb.C[0], mul(tStart, -1), rb.hw[0], 1);
  return closed([...rb.L, ...endCap, ...[...rb.R].reverse(), ...startCap], 0.5);
};

const computeRibbons = (st: BoneState): Ribbon[] => {
  const ribbons: Ribbon[] = [];
  for (let i = 0; i < BEAD_SEGS.length; i++) {
    const g = BEAD_SEGS[i];
    const laidHere = clamp(st.laid - SEG_START[i], 0, g.L);
    const seepHere = st.seep * g.L;
    const s1 = Math.max(laidHere, seepHere);
    const front = laidHere > 0 && laidHere < g.L && st.laid - SEG_START[i] <= g.L && seepHere < laidHere;
    const rb = ribbonFor(g, 0, s1, st, SEG_START[i], front);
    if (rb) ribbons.push(rb);
  }
  return ribbons;
};
/** the adhesive: each segment laid so far (or seeped), a translucent gel rope that wets out, fills the gap and sets */
const Bead: React.FC<{st: BoneState; ribbons: Ribbon[]}> = ({st, ribbons}) => {
  if (ribbons.length === 0 || st.heal.resorb >= 0.999) return null;
  const px = st.px;
  const gloss = 1 - 0.62 * st.set;
  const base = mix(C.glue, C.glueDeep, 0.12 * st.set);
  const fade = 1 - ss(st.heal.resorb, 0.82, 1);
  const keys: React.ReactNode[] = [];
  if (px < 0.014) {
    // where the gel meets the bone it flows into the surface pores: tiny keyed lobes along both contact edges
    ribbons.forEach((rb, i) => {
      [rb.L, rb.R].forEach((edge, e) => {
        for (let k = 2; k < edge.length - 2; k += 2) {
          const h = hash(k * 3.17 + i * 11.3 + e * 5.1);
          if (h > 0.5) continue;
          const t = nrm(sub(edge[k + 1], edge[k - 1]));
          const out = mul(perp(t), e === 0 ? 1 : -1);
          const r = 0.05 + 0.07 * hash(k * 1.3 + e);
          const c = add(edge[k], mul(out, r * 0.6));
          keys.push(<circle key={`k${i}_${e}_${k}`} cx={c.x} cy={c.y} r={r} fill={C.glue} stroke={C.glueDeep} strokeWidth={Math.max(0.01, 1.1 * px)} opacity={0.95} />);
        }
      });
    });
  }
  return (
    <g opacity={fade}>
      {/* the bead's soft shadow on the bone (thickness), toward the lower right */}
      {ribbons.map((rb, i) => (
        <path key={`s${i}`} d={ribbonOutline(rb)} transform="translate(0.16 0.26)" fill={rgba('#4A3320', 0.28 * (1 - st.heal.resorb))} />
      ))}
      {/* one merged gel body: an ink pass of every ribbon, then every fill on top (the ribbons union at junctions);
          translucent as a whole so the gel-filled gap shows through */}
      <g opacity={0.8}>
        {ribbons.map((rb, i) => <path key={`o${i}`} d={ribbonOutline(rb)} fill={C.glueInk} stroke={C.glueInk} strokeWidth={Math.max(0.05, 4.8 * px)} strokeLinejoin="round" />)}
        {ribbons.map((rb, i) => <path key={`f${i}`} d={ribbonOutline(rb)} fill={base} />)}
      </g>
      {ribbons.map((rb, i) => {
        const deep = offsetLine(rb.C, (k, n) => -dotL(n) * rb.hw[k] * 0.48);
        const hi = offsetLine(rb.C, (k, n) => dotL(n) * rb.hw[k] * 0.42);
        const shine = offsetLine(rb.C, (k, n) => dotL(n) * rb.hw[k] * 0.55);
        const meanW = rb.hw.reduce((a, b) => a + b, 0) / rb.hw.length;
        return (
          <g key={`b${i}`}>
            <path d={open(deep, 0.5)} stroke={C.glueDeep} strokeWidth={meanW * 0.62} fill="none" strokeLinecap="round" opacity={0.36} />
            <path d={open(hi, 0.5)} stroke={C.glueLit} strokeWidth={meanW * 0.5} fill="none" strokeLinecap="round" opacity={0.4 + 0.2 * gloss} />
            <path d={open(shine, 0.5)} stroke={C.glueShine} strokeWidth={Math.max(0.06, meanW * 0.16)} fill="none" strokeLinecap="round"
              strokeDasharray={`${(meanW * 2.6).toFixed(3)} ${(meanW * 0.9).toFixed(3)}`} opacity={0.85 * gloss} />
          </g>
        );
      })}
      {keys}
    </g>
  );
};
/** the contact edge of the laid C1 bead below the crack at x (for the oyster match): the point and the bead's width */
export const beadEdgeBelow = (x: number, st: BoneState): P => {
  const g = BEAD_SEGS[0];
  let best = 0, bd = 1e9;
  for (let s = 0; s <= g.L; s += 0.1) {
    const d = Math.abs(atS(g, s).x - x);
    if (d < bd) { bd = d; best = s; }
  }
  const c = atS(g, best);
  const t = nrm(sub(atS(g, best + 0.2), atS(g, best - 0.2)));
  const nn = perp(t);
  const w = beadHW(Math.max(0, st.t - st.laidAt(best)), best, 0);
  const down = nn.y > 0 ? nn : mul(nn, -1);
  return add(c, mul(down, w));
};

// ---------------------------------------------------------------- the wet wound film (macro)
/** the wet wound: a thin, slightly red-tinted film with a moving sheen, a few translucent puddles of blood drifting down
 *  over bone and bead (they deform as they flow), and small drops sliding. Restrained: the bead stays readable through
 *  it, and its sealed contact edges are redrawn on top (BeadEdges) so the bond reads as holding in the wet. */
const FluidFilm: React.FC<{st: BoneState; view: [number, number, number, number]}> = ({st, view}) => {
  if (st.wet <= 0.001) return null;
  const [x0, y0, x1, y1] = view;
  const W = x1 - x0, H = y1 - y0;
  const t = st.t;
  const px = st.px;
  const gid = uid('sheen');
  const puddles: React.ReactNode[] = [];
  for (let k = 0; k < 6; k++) {
    const speed = 0.045 + 0.02 * hash(k * 7.3);
    const ph = ((t * speed + hash(k * 2.1)) % 1 + 1) % 1;
    const cx = x0 + (0.1 + 0.8 * hash(k * 5.7)) * W + 0.04 * W * Math.sin(t * 0.7 + k);
    const cy = y0 - 0.15 * H + ph * 1.3 * H;
    const R = (0.09 + 0.07 * hash(k * 3.3)) * W;
    const pts: P[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = R * (1 + 0.28 * noise1(i * 0.9 + t * 0.6, k + 11)) * (1 + 0.35 * Math.max(0, Math.sin(a)));
      pts.push(pt(cx + r * Math.cos(a) * 0.8, cy + r * Math.sin(a) * 1.15));
    }
    const fade = Math.sin(Math.PI * ph);
    const d = closed(pts, 0.9);
    const pg = uid('pud');
    puddles.push(
      <g key={k} opacity={st.wet * (0.35 + 0.65 * fade)}>
        <defs>
          <radialGradient id={pg} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R * 1.35}>
            <stop offset={0} stopColor={C.blood} stopOpacity={0.42} />
            <stop offset={0.65} stopColor={C.blood} stopOpacity={0.3} />
            <stop offset={1} stopColor={C.bloodLit} stopOpacity={0.05} />
          </radialGradient>
        </defs>
        <path d={d} fill={`url(#${pg})`} />
        <ellipse cx={cx - R * 0.3} cy={cy - R * 0.45} rx={R * 0.32} ry={R * 0.12} fill="#FFFFFF" opacity={0.5} transform={`rotate(-20 ${cx - R * 0.3} ${cy - R * 0.45})`} />
      </g>,
    );
  }
  const drops: React.ReactNode[] = [];
  for (let k = 0; k < 4; k++) {
    const ph = ((t * (0.16 + 0.05 * hash(k * 1.7)) + 0.31 * k) % 1 + 1) % 1;
    const x = x0 + (0.15 + 0.7 * hash(k * 9.3)) * W, y = y0 + ph * H;
    const r = 0.022 * W * (0.8 + 0.5 * hash(k * 4.1));
    drops.push(
      <g key={`d${k}`} opacity={st.wet * Math.sin(Math.PI * ph)}>
        <path d={`M${x} ${y - r * 2.6}Q${x + r} ${y - r} ${x + r} ${y}A${r} ${r} 0 1 1 ${x - r} ${y}Q${x - r} ${y - r} ${x} ${y - r * 2.6}Z`} fill={C.bloodLit} opacity={0.55} />
        <ellipse cx={x - r * 0.35} cy={y - r * 0.3} rx={r * 0.28} ry={r * 0.2} fill="#FFFFFF" opacity={0.85} />
      </g>,
    );
  }
  const sx = x0 + ((t * 0.12) % 1) * W * 1.4 - 0.2 * W;
  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={sx - 0.25 * W} y1={y0} x2={sx + 0.25 * W} y2={y1}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.5} stopColor="#FFFFFF" stopOpacity={0.16} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={W} height={H} fill={C.blood} opacity={0.06 * st.wet} />
      {puddles}
      {drops}
      <rect x={x0} y={y0} width={W} height={H} fill={`url(#${gid})`} opacity={st.wet} />
    </g>
  );
};
/** the bead's contact edges redrawn over the wet film: crisp, sealed */
const BeadEdges: React.FC<{st: BoneState}> = ({st}) => {
  if (st.wet <= 0.001) return null;
  const ribbons = computeRibbons(st);
  const w = Math.max(0.01, 2.6 * st.px);
  return (
    <g opacity={st.wet}>
      {ribbons.map((rb, i) => (
        <g key={i}>
          <path d={open(rb.L, 0.5)} stroke={C.glueInk} strokeWidth={w} fill="none" />
          <path d={open(rb.R, 0.5)} stroke={C.glueInk} strokeWidth={w} fill="none" />
          <path d={open(offsetLine(rb.L, (_, n) => -n.y * 0.0 - 0.09), 0.5)} stroke={C.glueLit} strokeWidth={w * 0.8} fill="none" opacity={0.8} />
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- healing: hematoma, callus cuff, remodelling
const FX_Y0 = -10, FX_Y1 = 14.5, FX_YC = 2.2;
const collarBulge = (y: number) => {
  const u = (y - FX_YC) / ((FX_Y1 - FX_Y0) / 2);
  return Math.abs(u) >= 1 ? 0 : (1 - u * u) ** 1.6;
};
/** the hematoma: a dark, translucent clot engulfing the fracture zone (drawn over the bone and its edges) */
const Hematoma: React.FC<{h: Heal}> = ({h}) => {
  const a = h.hem * (1 - ss(h.soft, 0.1, 0.8));
  if (a < 0.01) return null;
  const gid = uid('hem');
  const blobs: [number, number, number, number][] = [[-11, 1, 7.5, 6.5], [-3, 0.5, 8, 6], [5, 0.5, 8, 6.5], [12, 2, 7, 7.5], [8, 6, 6, 5.5], [3.5, -9, 4.5, 6]];
  return (
    <g opacity={a}>
      <defs>
        <radialGradient id={gid}>
          <stop offset={0} stopColor={C.hematoma} stopOpacity={0.92} />
          <stop offset={0.55} stopColor={C.hematoma} stopOpacity={0.7} />
          <stop offset={1} stopColor={C.hematoma} stopOpacity={0} />
        </radialGradient>
      </defs>
      {blobs.map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${gid})`} />)}
    </g>
  );
};
/** the callus cuff around the break: soft (grey-pink fibrous) -> hard (woven bone) -> remodelled back to the shaft.
 *  Seen from above it is a shell around a cylinder: dense where it is seen edge-on (the bulging silhouette), thin over
 *  the bone's face so the break and the bead stay readable through it; it tapers to nothing at both ends. */
const Cuff: React.FC<{h: Heal; px: number}> = ({h, px}) => {
  const grow = clamp(h.soft * 1.15) * (1 - 0.88 * ss(h.remodel, 0, 1));
  if (grow < 0.01) return null;
  const maxB = 3.6;
  const ys: number[] = [];
  for (let y = FX_Y0; y <= FX_Y1 + 1e-6; y += 0.5) ys.push(y);
  const b = (y: number) => maxB * grow * collarBulge(y);
  const L = ys.map((y) => pt(radiusEdges(y)[0] - b(y), y));
  const R = ys.map((y) => pt(radiusEdges(y)[1] + b(y), y));
  const hard = clamp(h.hard);
  const col = mix(mix(C.softCallus, C.newBone, hard), C.bone, h.remodel);
  const colLit = mix(mix(C.softCallusLit, '#FFFFFF', hard), C.boneLit, h.remodel);
  const colSh = mix(mix('#9C879C', '#D6C6AA', hard), C.boneShade, h.remodel);
  const gid = uid('cuff'), mid = uid('cuffm'), mgid = uid('cuffmg');
  const ink = Math.max(0.05, 2.6 * px);
  const shape = closed([...L, ...[...R].reverse()], 0.5);
  const mOp = 1 - 0.75 * h.remodel;
  const fib: React.ReactNode[] = [];
  if (hard < 0.95) {
    for (let k = 0; k < 12; k++) {
      const y = FX_Y0 + 3 + (k / 11) * (FX_Y1 - FX_Y0 - 6);
      const [l, r] = radiusEdges(y);
      const sway = 0.5 * Math.sin(k * 1.7);
      for (const side of [-1, 1]) {
        const e = side < 0 ? l : r;
        const bb = b(y);
        fib.push(<path key={`${k}_${side}`} d={open([pt(e + side * bb * 0.9, y + sway), pt(e + side * bb * 0.3, y - 0.35 + sway * 0.3), pt(e - side * 1.6, y + 0.2 + sway)], 0.7)} stroke={mix(C.softCallus, '#6E5468', 0.5)} strokeWidth={Math.max(0.05, 1.7 * px)} fill="none" opacity={0.55 * (1 - hard)} strokeLinecap="round" />);
      }
    }
  }
  const pores: React.ReactNode[] = [];
  if (hard > 0.05 && px < 0.1) {
    for (let k = 0; k < 80; k++) {
      const y = FX_Y0 + 1.5 + hash(k * 3.3) * (FX_Y1 - FX_Y0 - 3);
      const [l, r] = radiusEdges(y);
      const bb = b(y);
      if (bb < 0.6) continue;
      const side = k % 2 ? 1 : -1;
      const e = side < 0 ? l : r;
      const x = e + side * (bb * (0.85 - 1.3 * hash(k * 1.7)));
      pores.push(<ellipse key={k} cx={x} cy={y} rx={0.14 + 0.12 * hash(k)} ry={0.1 + 0.07 * hash(k * 2)} fill={C.newBonePore} opacity={0.8 * hard * (1 - h.remodel)} />);
    }
  }
  return (
    <g opacity={clamp(grow * 2.5)}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={-19} y1={0} x2={19.5} y2={0}>
          <stop offset={0} stopColor={colLit} stopOpacity={0.97} />
          <stop offset={0.12} stopColor={col} stopOpacity={0.9 * mOp} />
          <stop offset={0.26} stopColor={col} stopOpacity={0.34 * mOp} />
          <stop offset={0.72} stopColor={col} stopOpacity={0.34 * mOp} />
          <stop offset={0.87} stopColor={colSh} stopOpacity={0.9 * mOp} />
          <stop offset={1} stopColor={colSh} stopOpacity={0.97} />
        </linearGradient>
        <linearGradient id={mgid} gradientUnits="userSpaceOnUse" x1={0} y1={FX_Y0} x2={0} y2={FX_Y1}>
          <stop offset={0} stopColor="#000" />
          <stop offset={0.2} stopColor="#FFF" />
          <stop offset={0.8} stopColor="#FFF" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-40} y={FX_Y0 - 2} width={80} height={FX_Y1 - FX_Y0 + 4}>
          <rect x={-40} y={FX_Y0} width={80} height={FX_Y1 - FX_Y0} fill={`url(#${mgid})`} />
        </mask>
      </defs>
      <g mask={`url(#${mid})`}>
        <path d={shape} fill={`url(#${gid})`} />
        {fib}
        {pores}
      </g>
      <path d={open(L, 0.5)} stroke={mix('#5E4B5C', C.boneInk, hard)} strokeWidth={ink} fill="none" />
      <path d={open(R, 0.5)} stroke={mix('#5E4B5C', C.boneInk, hard)} strokeWidth={ink} fill="none" />
    </g>
  );
};
/** woven new bone growing into the space the adhesive occupied: revealed as the bead shrinks, then remodelled away */
const NewBoneFill: React.FC<{st: BoneState; px: number}> = ({st, px}) => {
  const h = st.heal;
  const a = ss(h.resorb, 0.02, 0.35) * (1 - ss(h.remodel, 0.15, 0.95));
  if (a < 0.01) return null;
  const geo = computeRibbons({...st, heal: {...h, resorb: 0}, t: st.t + 10});
  const pores: React.ReactNode[] = [];
  if (px < 0.1) {
    geo.forEach((rb, i) => {
      for (let k = 1; k < rb.C.length - 1; k += 2) {
        const hh = hash(k * 2.3 + i * 7.7);
        const t = nrm(sub(rb.C[k + 1], rb.C[k - 1]));
        const q = add(rb.C[k], mul(perp(t), (hh * 2 - 1) * rb.hw[k] * 0.75));
        pores.push(<ellipse key={`${i}_${k}`} cx={q.x} cy={q.y} rx={0.11 + 0.1 * hash(k * 1.1 + i)} ry={0.08 + 0.06 * hash(k * 3.1)} fill={C.newBonePore} opacity={0.9} />);
      }
    });
  }
  return (
    <g opacity={a}>
      {geo.map((rb, i) => <path key={i} d={ribbonOutline(rb)} fill={C.newBone} stroke={mix(C.newBonePore, C.boneShade, 0.3)} strokeWidth={Math.max(0.04, 1.6 * px)} />)}
      {pores}
    </g>
  );
};

// ---------------------------------------------------------------- the radius
const CRACKS_J = [jag(C1, 0.28, 0.5, 1), jag(C2, 0.26, 0.5, 2), jag(C3, 0.24, 0.5, 3)];
export const Radius: React.FC<{st: BoneState; view: [number, number, number, number]}> = ({st, view}) => {
  const px = st.px;
  const gid = uid('rad');
  const clipId = uid('radclip');
  const glueClip = uid('glueclip');
  const sheenId = uid('sheen');
  const h = st.heal;
  // cracks fill with new bone as the glue is resorbed; remodelling erases them
  const fill = clamp(0.25 * h.hard + 0.85 * h.resorb);
  const crackFade = clamp(h.remodel * 1.15) * 0.94;
  const healed = clamp(h.remodel);
  const ink = Math.max(0.06, 2.8 * px);
  const ribbons = computeRibbons(st);
  const lamellae: React.ReactNode[] = [];
  for (let k = 0; k < 7; k++) {
    const xk = -9 + k * 3.0 + 0.6 * hash(k * 2.2);
    const yTop = -14 + 6 * hash(k * 5.1), yBot = 60 + 40 * hash(k * 1.3);
    lamellae.push(<path key={k} d={open([pt(xk, yTop), pt(xk * 0.92 + 0.2, (yTop + yBot) / 2), pt(xk * 0.78, yBot)], 0.6)} stroke={C.boneShade} strokeWidth={Math.max(0.05, 1.3 * px)} fill="none" opacity={0.3} />);
  }
  const glueInGap = mix('#0E5A51', C.newBone, fill);
  return (
    <g>
      <defs>
        <BoneShade gid={gid} />
        <clipPath id={clipId}><path d={RAD_PATH} /></clipPath>
        <clipPath id={glueClip}>{ribbons.map((rb, i) => <path key={i} d={ribbonOutline(rb)} />)}</clipPath>
        <linearGradient id={sheenId} gradientUnits="userSpaceOnUse" x1={-13} y1={0} x2={-2} y2={0}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.35} stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset={0.6} stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={RAD_PATH} fill={`url(#${gid})`} stroke={C.boneInk} strokeWidth={ink} strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}>
        {/* a long wet sheen down the lit side of the shaft */}
        <rect x={-14} y={-40} width={13} height={300} fill={`url(#${sheenId})`} />
        {lamellae}
        <path d={open(RADIUS.slice(0, 9), 0.55)} stroke="#EEF3F2" strokeWidth={1.6} fill="none" opacity={0.9} />
        <Pores view={view} px={px} healed={healed} />
        {CRACKS_J.map((c, i) => <CrackBand key={i} ps={c} px={px} fill={fill} fade={crackFade} />)}
        {/* where the bead has been laid, the gap itself is full of gel: the adhesive bridges the fracture */}
        <g clipPath={`url(#${glueClip})`} opacity={1 - crackFade}>
          {CRACKS_J.map((c, i) => <path key={i} d={open(c, 0.4)} stroke={glueInGap} strokeWidth={1.05} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
        </g>
        <path d={open(RADIUS.slice(37), 0.55)} stroke={C.boneLit} strokeWidth={Math.max(0.12, 6 * px)} fill="none" opacity={0.5} transform="translate(0.5 0)" />
      </g>
      <NewBoneFill st={st} px={px} />
      <Hematoma h={h} />
      <Bead st={st} ribbons={ribbons} />
      <Cuff h={h} px={px} />
    </g>
  );
};

// ---------------------------------------------------------------- the surgical field around the bone (close-ups)
/** retracted muscle beside the bone, small blood pools in the crevices, wet glints: the close-up detail on top of the
 *  arm's deep tissue (only drawn when the camera is close) */
export const FieldDetail: React.FC<{st: BoneState; t: number}> = ({st, t}) => {
  const px = st.px;
  if (px > 0.12) return null;
  const a = clamp((0.12 - px) / 0.05);
  const gid = uid('fld');
  const ys: number[] = [];
  for (let y = -26; y <= 24; y += 1) ys.push(y);
  const flap = (side: number) => {
    const inner = ys.map((y) => pt(radiusEdges(y)[side < 0 ? 0 : 1] + side * 0.6, y));
    const outer = ys.map((y, i) => pt(radiusEdges(y)[side < 0 ? 0 : 1] + side * (7.5 + 1.2 * noise1(i * 0.3, side + 4)), y));
    return closed([...inner, ...[...outer].reverse()], 0.6);
  };
  const fibres: React.ReactNode[] = [];
  for (const side of [-1, 1]) {
    for (let k = 0; k < 16; k++) {
      const y = -24 + k * 3.0 + 0.8 * hash(k * 3.1 + side);
      const [l, r] = radiusEdges(y);
      const e = side < 0 ? l : r;
      fibres.push(<path key={`${side}_${k}`} d={open([pt(e + side * 0.8, y), pt(e + side * 3.5, y + 0.5 * side), pt(e + side * 7.2, y + 0.2)], 0.6)} stroke={C.muscleFibre} strokeWidth={Math.max(0.05, 1.8 * px)} fill="none" opacity={0.45} strokeLinecap="round" />);
    }
  }
  const pools: React.ReactNode[] = [];
  for (const [y, side, s] of [[-12, -1, 1.2], [8, -1, 0.9], [17, 1, 1.1], [-17, 1, 0.8], [4, 1, 0.7]] as [number, number, number][]) {
    const e = radiusEdges(y)[side < 0 ? 0 : 1];
    const c = pt(e + side * 1.1, y);
    pools.push(
      <g key={`p${y}`}>
        <ellipse cx={c.x} cy={c.y} rx={0.9 * s} ry={2.4 * s} fill={C.blood} opacity={0.85} />
        <ellipse cx={c.x - 0.25 * s} cy={c.y - 0.8 * s} rx={0.18 * s} ry={0.5 * s} fill="#FFFFFF" opacity={0.6} />
      </g>,
    );
  }
  // slow wet glints sliding on the muscle
  const glints: React.ReactNode[] = [];
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1;
    const y = -20 + k * 7.5;
    const e = radiusEdges(y)[side < 0 ? 0 : 1];
    const x = e + side * (3 + 2 * hash(k * 8.1));
    const wob = 0.3 * Math.sin(t * 1.4 + k);
    glints.push(<path key={`g${k}`} d={`M${x - 0.8} ${y + wob}Q${x} ${y - 0.35 + wob} ${x + 0.8} ${y + wob}`} stroke="#FFF4F0" strokeWidth={Math.max(0.05, 2 * px)} fill="none" opacity={0.6} strokeLinecap="round" />);
  }
  return (
    <g opacity={a}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset={0} stopColor={C.muscle} />
          <stop offset={1} stopColor={C.muscleLit} />
        </linearGradient>
      </defs>
      <path d={flap(-1)} fill={C.muscle} />
      <path d={flap(1)} fill={mix(C.muscle, C.cavity, 0.25)} />
      {fibres}
      {pools}
      {glints}
    </g>
  );
};

/** everything inside the wrist that this module owns, back to front */
export const BoneInside: React.FC<{st: BoneState; view: [number, number, number, number]}> = ({st, view}) => (
  <g>
    <FieldDetail st={st} t={st.t} />
    <Radius st={st} view={view} />
    <FluidFilm st={st} view={view} />
    <BeadEdges st={st} />
  </g>
);

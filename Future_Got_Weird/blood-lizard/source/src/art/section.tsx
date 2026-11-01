// V2 cross-section of the lizard's head, drawn in the eye's frame (eye centre at 0, x toward the snout, head cm).
// A clean cutaway window opens around the eye and back along the head toward the neck. The eye itself is not cut: it
// is drawn again on top, seated in its lids. Through the window:
//   - the bony socket behind the eye;
//   - the sinus: an even ring of blood round the eye, just outside the lids;
//   - a bright artery bringing blood in from the neck, and a dark vein taking it back out through a band of muscle;
//   - (over the lids) one tiny vessel running through the lid to the pore at the front corner.
// Story: blood circulates; the muscle squeezes the vein shut and the outflow stops; each heartbeat pushes more in; the
// ring swells evenly, its wall stretches thin and glossy, the cells crowd; the lid vessel balloons; it bursts at the pore.
import React from 'react';
import {P, add, closed, mul, nrm, open, perp, pt, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, noise1} from '../lib';
import {EYE_R, PORE_DIR0, PORE_OFF, SectionGeom} from './lizard';

export type SectionState = {
  reveal: number;   // 0 closed .. 1 open
  squeeze: number;  // muscle contraction 0..1
  p: number;        // pressure 0..1
  beat: number;     // heartbeat pulse 0..1
  aPhase: number; vPhase: number;
  burst: number;    // seconds since the rupture (< 0 before)
  shadow: number;   // the predator's shadow 0..1
  t: number;
};
const C = {
  tissue: '#EDB9A5', tissueDk: '#D6988A', bone: '#F3E6CF', boneDk: '#CDBB9C', ink: '#3A0D12', rim: '#B98656', rimDk: '#6E4A31',
  art: '#D8262E', artLit: '#FF7468', vein: '#7C1626', veinLit: '#B8414F', blood: '#A3131C', bloodLit: '#F0544E',
  wall: '#6E0D16', cell: '#C81E27', cellDk: '#7E0A12', muscle: '#C9555C', muscleLit: '#F09A98', muscleDk: '#8E2A33',
};
const deg = Math.PI / 180;
const RIN = EYE_R * 1.68;
const ang = (a: number, r: number) => pt(Math.cos(a) * r, Math.sin(a) * r);
const ART: P[] = [pt(-2.1, 0.5), pt(-1.5, 0.48), pt(-0.9, 0.44), pt(-0.5, 0.36), ang(150 * deg, RIN + 0.03)];
const VEIN: P[] = [ang(200 * deg, RIN + 0.03), pt(-0.75, -0.2), pt(-1.25, -0.12), pt(-1.7, -0.02), pt(-2.15, 0.06)];
const MUSCLE_AT = 0.52;
const polyAt = (pts: P[], u: number) => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const s = clamp(u) * L[L.length - 1];
  let i = 1;
  while (i < pts.length - 1 && L[i] < s) i++;
  const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return {p: add(pts[i - 1], mul(sub(pts[i], pts[i - 1]), k)), d: nrm(sub(pts[i], pts[i - 1]))};
};
const tubeAlong = (pts: P[], r: (u: number) => number, n = 30) => {
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i <= n; i++) {
    const {p, d} = polyAt(pts, i / n);
    const nn = perp(d);
    L.push(add(p, mul(nn, r(i / n))));
    R.push(add(p, mul(nn, -r(i / n))));
  }
  return closed([...L, ...R.reverse()], 0.5);
};
const Cell: React.FC<{p: P; a: number; s?: number; dark?: boolean}> = ({p, a, s = 1, dark}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${(a * 180) / Math.PI})`}>
    <ellipse rx={0.024 * s} ry={0.017 * s} fill={dark ? C.cellDk : C.cell} stroke={C.ink} strokeWidth={0.004 * s} />
    <ellipse rx={0.011 * s} ry={0.007 * s} fill={C.cellDk} opacity={0.6} />
  </g>
);
/** the window: round the eye and back along the head toward the neck; it opens outward from the eye */
const windowPts = (k: number) => {
  const base: P[] = [pt(0.8, 0.02), pt(0.56, -0.56), pt(0, -0.8), pt(-0.7, -0.62), pt(-1.4, -0.44), pt(-2.0, -0.3), pt(-2.3, 0.18), pt(-2.0, 0.72), pt(-1.3, 0.8), pt(-0.6, 0.82), pt(0.1, 0.8), pt(0.6, 0.52)];
  return base.map((q) => {
    const r = Math.hypot(q.x, q.y);
    const reach = clamp(k * 2.6 - r * 0.9, 0, 1);
    return mul(q, Math.max(0.02, reach));
  });
};
const thick = (a: number, p: number) => (0.075 + 0.025 * Math.cos(a - Math.PI)) * (1 + 1.5 * p);
const toLocal = (g: SectionGeom['eye'], q: P) => {
  const d = sub(q, g.c);
  const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
  const r = pt(d.x * c - d.y * s, d.x * s + d.y * c);
  return pt(r.x / (g.mx * g.fs * g.k), r.y / g.k);
};

export const Section: React.FC<{s: SectionState; g: SectionGeom; sw: number; layer: 'under' | 'over'}> = ({s, g, sw, layer}) => {
  const k = clamp(s.reveal);
  if (k <= 0.001) return null;
  const ids = {clip: uid('xc'), win: uid('xw'), glow: uid('xg'), tis: uid('xt')};
  const e = g.eye;
  const tf = `translate(${e.c.x} ${e.c.y}) rotate(${(e.ang * 180) / Math.PI}) scale(${e.mx * e.fs * e.k} ${e.k})`;
  const swL = sw / e.k;
  const after = s.burst;
  const defl = after >= 0 ? clamp(after / 0.8) : 0;
  const pe = clamp(s.p) * (1 - 0.6 * defl);
  const sq = clamp(s.squeeze);
  // the lid vessel: from the ring, through the lid, to the pore; it balloons near the pore
  const duct: P[] = [ang(-38 * deg, RIN + 0.02), pt(0.36, -0.22), pt(0.31, -0.16), PORE_OFF];
  const blister = (0.02 + 0.07 * pe * pe) * (after >= 0 ? 1 - defl : 1);
  if (layer === 'over') {
    const tear = after >= 0 ? clamp(after / 0.1) : 0;
    const bc = add(PORE_OFF, pt(0.02, -0.03));
    return (
      <g transform={tf} opacity={clamp(k * 3)}>
        <path d={open(duct, 0.8)} stroke={mix(C.wall, '#E8737A', 0.6 * pe)} strokeWidth={0.045 + 0.025 * pe + swL} fill="none" strokeLinecap="round" />
        <path d={open(duct, 0.8)} stroke={C.blood} strokeWidth={0.03 + 0.025 * pe} fill="none" strokeLinecap="round" />
        {blister > 0.021 && tear < 1 && (
          <g>
            <circle cx={bc.x} cy={bc.y} r={blister} fill={C.blood} stroke={mix(C.wall, '#F2A0A4', 0.7 * pe)} strokeWidth={swL * (1.4 - pe)} />
            <path d={`M${bc.x - blister * 0.5} ${bc.y - blister * 0.45} q${blister * 0.4} ${-blister * 0.25} ${blister * 0.8} 0`} stroke="#FFE4DC" strokeWidth={0.008} fill="none" opacity={0.9 * pe} />
          </g>
        )}
        {tear > 0 && [-1, 1].map((sd) => {
          const n = perp(PORE_DIR0);
          const b = add(bc, mul(n, sd * 0.035));
          const tip = add(b, add(mul(PORE_DIR0, 0.04 * tear), mul(n, sd * 0.05 * tear)));
          return <path key={sd} d={`M${b.x} ${b.y} L${tip.x} ${tip.y} L${add(b, mul(PORE_DIR0, -0.02)).x} ${add(b, mul(PORE_DIR0, -0.02)).y} Z`} fill={C.wall} stroke={C.ink} strokeWidth={swL * 0.6} />;
        })}
      </g>
    );
  }
  // ring
  const outer: P[] = [], inner: P[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    outer.push(ang(a, RIN + thick(a, pe) * (1 + 0.06 * s.beat)));
    inner.push(ang(a, RIN));
  }
  const ringD = `${closed(outer, 0.8)} ${closed([...inner].reverse(), 0.8)}`;
  const wallW = swL * (1.7 - 1.1 * pe);
  const wallC = mix(C.wall, '#E8737A', 0.6 * pe);
  const ra = (u: number) => (0.045 + 0.007 * s.beat) * (1 + 0.15 * pe);
  const pinch = (u: number) => 1 - sq * 0.9 * Math.exp(-(((u - MUSCLE_AT) / 0.05) ** 2));
  const rv = (u: number) => 0.055 * pinch(u) * (u < MUSCLE_AT ? 1 + 0.3 * pe : 1 - 0.15 * sq);
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const u = (((i / 14 + s.aPhase) % 1) + 1) % 1;
    const {p, d} = polyAt(ART, u);
    cells.push(<Cell key={'a' + i} p={add(p, mul(perp(d), 0.014 * Math.sin(i * 2.1)))} a={Math.atan2(d.y, d.x) + 0.6 * Math.sin(i)} />);
  }
  for (let i = 0; i < 16; i++) {
    let u = (((i / 16 + s.vPhase) % 1) + 1) % 1;
    if (sq > 0.5 && u > MUSCLE_AT - 0.06 && u < MUSCLE_AT + 0.03) u = MUSCLE_AT - 0.06 - 0.02 * hash(i);
    const {p, d} = polyAt(VEIN, u);
    cells.push(<Cell key={'v' + i} p={add(p, mul(perp(d), 0.018 * Math.sin(i * 1.7)))} a={Math.atan2(d.y, d.x) + 0.5 * Math.sin(i * 3)} dark />);
  }
  const NR = Math.round(22 + 46 * pe);
  for (let i = 0; i < NR; i++) {
    const a0 = hash(i * 3.71) * Math.PI * 2;
    const swirl = (1 - pe) * 0.3 * s.t * (hash(i * 1.3) - 0.5);
    const jit = (0.004 + 0.012 * pe) * noise1(s.t * (3 + 9 * pe) + i * 7.3, i);
    const a = a0 + swirl + jit * 4;
    cells.push(<Cell key={'s' + i} p={ang(a, RIN + 0.02 + (thick(a, pe) - 0.04) * hash(i * 5.17) + jit)} a={hash(i * 9.1) * 6 + s.t * (1 + 3 * pe) * (hash(i) - 0.5)} s={0.85} />);
  }
  const glints = Array.from({length: 7}, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const r = RIN + thick(a, pe) - 0.012;
    const q0 = ang(a - 0.12, r), q1 = ang(a + 0.12, r), m = ang(a, r + 0.016);
    return <path key={i} d={`M${q0.x} ${q0.y} Q${m.x} ${m.y} ${q1.x} ${q1.y}`} stroke="#FFE4DC" strokeWidth={0.01} fill="none" opacity={0.85 * pe} strokeLinecap="round" />;
  });
  const mc = polyAt(VEIN, MUSCLE_AT);
  const mN = perp(mc.d);
  const mw = 0.1 + 0.06 * sq, mh = 0.17 - 0.025 * sq;
  const win = windowPts(k);
  const headL = g.head.map((q) => toLocal(e, q)), bodyL = g.body.map((q) => toLocal(e, q));
  return (
    <g transform={tf}>
      <defs>
        <clipPath id={ids.clip}><path d={`${closed(headL, 0.5)} ${closed(bodyL, 0.5)}`} /></clipPath>
        <clipPath id={ids.win}><path d={closed(win, 0.8)} /></clipPath>
        <radialGradient id={ids.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0.6} stopColor={C.bloodLit} stopOpacity={0} />
          <stop offset={0.85} stopColor={C.bloodLit} stopOpacity={0.5} />
          <stop offset={1} stopColor={C.bloodLit} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={ids.tis} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#F4C8B6" />
          <stop offset={1} stopColor={C.tissue} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${ids.clip})`}>
        {/* the cut edge: skin thickness round the window */}
        <path d={closed(win, 0.8)} fill={C.rim} stroke={C.rimDk} strokeWidth={0.05} />
        <g clipPath={`url(#${ids.win})`}>
          <g transform="scale(0.965)">
            <rect x={-3} y={-2} width={6} height={4} fill={`url(#${ids.tis})`} />
            {Array.from({length: 16}, (_, i) => (
              <path key={i} d={`M${-2.2 + hash(i * 2.3) * 2.8} ${-0.7 + hash(i * 6.1) * 1.4} q0.25 ${0.06 * (hash(i) - 0.5)} 0.5 0`} stroke={C.tissueDk} strokeWidth={0.012} fill="none" opacity={0.6} />
            ))}
            {/* bony socket behind the eye and the skull roof */}
            <path d={`M${ang(95 * deg, RIN + 0.27).x} ${ang(95 * deg, RIN + 0.27).y} A${RIN + 0.27} ${RIN + 0.27} 0 0 1 ${ang(275 * deg, RIN + 0.27).x} ${ang(275 * deg, RIN + 0.27).y}`} stroke={C.bone} strokeWidth={0.1} fill="none" strokeLinecap="round" />
            <path d={closed([pt(-2.3, -0.62), pt(-0.6, -0.86), pt(-0.5, -0.62), pt(-2.3, -0.42)], 0.6)} fill={C.bone} stroke={C.boneDk} strokeWidth={swL * 0.6} opacity={0.85} />
            <rect x={-3} y={-2} width={6} height={4} fill="#2A0A10" opacity={0.3 * s.shadow} />
            {/* vessels */}
            <path d={tubeAlong(VEIN, rv)} fill={C.vein} stroke={C.ink} strokeWidth={swL * 0.9} />
            <path d={tubeAlong(ART, ra)} fill={C.art} stroke={C.ink} strokeWidth={swL * 0.9} />
            <path d={tubeAlong(ART, (u) => ra(u) * 0.3)} fill={C.artLit} opacity={0.5} transform="translate(0 -0.012)" />
            {/* the ring */}
            <path d={ringD} fill={C.blood} fillRule="evenodd" stroke={wallC} strokeWidth={wallW} />
            <circle cx={0} cy={0} r={RIN + 0.15 * (1 + 1.5 * pe)} fill={`url(#${ids.glow})`} opacity={pe} />
            {cells}
            {glints}
            {/* muscle band round the vein */}
            <g transform={`translate(${mc.p.x} ${mc.p.y}) rotate(${(Math.atan2(mN.y, mN.x) * 180) / Math.PI})`}>
              <ellipse rx={mh} ry={mw} fill={C.muscle} stroke={C.ink} strokeWidth={swL * 0.9} />
              {[-0.6, -0.2, 0.2, 0.6].map((q, i) => <path key={i} d={`M${-mh * 0.9} ${q * mw} Q0 ${q * mw + 0.012 * sq} ${mh * 0.9} ${q * mw}`} stroke={C.muscleLit} strokeWidth={0.012} fill="none" opacity={0.8} />)}
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

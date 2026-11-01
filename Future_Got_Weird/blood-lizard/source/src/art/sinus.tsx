// The view inside the lizard's head, drawn in head-local coordinates (the same frame as the exterior head, so the
// cutaway is registered to it). The skin thins away locally around the eye and back along the neck (soft organic
// mask, `reveal`), showing:
//   - the eyeball (the same gold iris as outside) in its bony socket;
//   - the sinus: a blood-filled chamber hugging the back of the eyeball, with fine vessels in its wall;
//   - a bright artery bringing blood up from the throat into the sinus;
//   - a dark vein carrying blood back down the neck, with a band of muscle around it;
//   - two tiny vessels running from the sinus to the pore at the rear corner of the lid.
// Story (driven by the state): blood circulates; the muscle squeezes the vein shut (outflow stops); each heartbeat
// pushes more blood in; the sinus and the tiny vessels swell, their walls stretch thin and glossy, the cells crowd and
// jostle; a blister at the lid corner balloons; it bursts and a jet leaves through the pore.
import React from 'react';
import {P, add, closed, mul, nrm, open, perp, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, noise1} from '../lib';
import {EYE_L, EYE_R, PORE_DIR, PORE_L} from './lizard';

export type SinusState = {
  reveal: number;   // 0 skin intact .. 1 cutaway open
  squeeze: number;  // muscle contraction 0..1 (vein shut at 1)
  p: number;        // pressure 0..1
  beat: number;     // heartbeat pulse 0..1 (decaying)
  aPhase: number;   // artery flow phase (cycles along the vessel)
  vPhase: number;   // vein flow phase
  burst: number;    // seconds since the rupture (< 0 before)
  shadow: number;   // the predator's shadow across the head 0..1
  t: number;
};
const C = {
  tissue: '#EDB9A5', tissueDk: '#D9998A', bone: '#F3E6CF', boneDk: '#CDBB9C', ink: '#3A0D12',
  art: '#D8262E', artLit: '#FF7468', vein: '#7C1626', veinLit: '#B8414F', blood: '#A3131C', bloodDk: '#5B060D', bloodLit: '#F0544E',
  wall: '#6E0D16', cell: '#C81E27', cellDk: '#7E0A12', muscle: '#C9555C', muscleLit: '#F09A98', muscleDk: '#8E2A33',
};
const E = EYE_L;
const angP = (a: number, r: number) => add(E, pt(Math.cos(a) * r, Math.sin(a) * r));
const deg = Math.PI / 180;
// the sinus spans the back of the eyeball, from below (a0) round the rear to above (a1)
const A0 = 100 * deg, A1 = 292 * deg;
const RIN = EYE_R * 1.06;
/** sinus thickness at angle a for pressure p */
const thick = (a: number, p: number) => {
  const u = (a - A0) / (A1 - A0);
  return (0.055 + 0.075 * Math.sin(Math.PI * clamp(u)) ** 0.7) * (1 + 1.05 * p);
};
/** rupture site: on the sinus' outer wall toward the pore */
export const RUPTURE_A = Math.atan2(PORE_DIR.y, PORE_DIR.x) + 2 * Math.PI;
// vessels (head local)
const ART: P[] = [pt(-1.3, 0.78), pt(-0.85, 0.66), pt(-0.35, 0.56), pt(0.12, 0.5), pt(0.42, 0.42), angP(122 * deg, RIN + 0.06)];
const VEIN: P[] = [angP(175 * deg, RIN + 0.08), pt(0.28, 0.12), pt(-0.05, 0.12), pt(-0.42, 0.22), pt(-0.82, 0.38), pt(-1.25, 0.58)];
export const MUSCLE_AT = 0.62; // fraction along the vein
const polyAt = (pts: P[], u: number) => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const s = clamp(u) * L[L.length - 1];
  let i = 1;
  while (i < pts.length - 1 && L[i] < s) i++;
  const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
  const p = add(pts[i - 1], mul(sub(pts[i], pts[i - 1]), k));
  return {p, d: nrm(sub(pts[i], pts[i - 1]))};
};
const tubeAlong = (pts: P[], r: (u: number) => number, n = 28) => {
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const {p, d} = polyAt(pts, u);
    const nn = perp(d);
    L.push(add(p, mul(nn, r(u))));
    R.push(add(p, mul(nn, -r(u))));
  }
  return closed([...L, ...R.reverse()], 0.5);
};
const Cell: React.FC<{p: P; a: number; s: number; k: string; dark?: boolean}> = ({p, a, s, k, dark}) => (
  <g key={k} transform={`translate(${p.x} ${p.y}) rotate(${(a * 180) / Math.PI})`}>
    <ellipse rx={0.024 * s} ry={0.017 * s} fill={dark ? C.cellDk : C.cell} stroke={C.ink} strokeWidth={0.004 * s} />
    <ellipse rx={0.011 * s} ry={0.007 * s} fill={C.cellDk} opacity={0.6} />
  </g>
);

/** the organic reveal mask outline (head local) */
const revealPath = (k: number, t: number) => {
  const pts: P[] = [];
  const c = pt(0.05, 0.22);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const wob = 1 + 0.09 * Math.sin(a * 5 + 1.3) + 0.06 * Math.sin(a * 9 + 0.4) + 0.03 * noise1(t * 1.5 + i, 3);
    pts.push(add(c, pt(Math.cos(a) * 1.45 * k * wob, Math.sin(a) * 0.82 * k * wob)));
  }
  return closed(pts, 0.9);
};

export const Sinus: React.FC<{s: SinusState; sw: number; clipD: string}> = ({s, sw, clipD}) => {
  if (s.reveal <= 0.001) return null;
  const ids = {mask: uid('sm'), blur: uid('sb'), glow: uid('sg'), wclip: uid('sw'), clip: uid('sc')};
  const p = clamp(s.p);
  const after = s.burst >= 0 ? s.burst : -1;
  const defl = after >= 0 ? clamp(after / 0.7) : 0;
  const pe = p * (1 - 0.55 * defl); // effective swelling (drops after the rupture)
  const beat = s.beat;
  const sq = clamp(s.squeeze);
  // sinus crescent
  const outer: P[] = [], inner: P[] = [];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const a = lerp(A0, A1, i / N);
    const tk = thick(a, pe) * (1 + 0.06 * beat);
    // the blister: a local balloon toward the pore that grows with pressure
    const da = a - RUPTURE_A;
    const bl = Math.exp(-((da / 0.26) ** 2)) * (0.02 + 0.2 * pe * pe) * (after >= 0 ? 1 - defl * 0.7 : 1);
    outer.push(angP(a, RIN + tk + bl));
    inner.push(angP(a, RIN));
  }
  const sinusD = closed([...outer, ...[...inner].reverse()], 0.6);
  const wallW = sw * (1.7 - 1.1 * pe);
  const wallC = mix(C.wall, '#E8737A', 0.6 * pe);
  // artery and vein radii; the muscle pinches the vein
  const ra = (u: number) => (0.04 + 0.006 * beat) * (1 + 0.15 * pe) * (u > 0.92 ? 1 + (u - 0.92) * 2 : 1);
  const pinch = (u: number) => 1 - sq * 0.88 * Math.exp(-(((u - MUSCLE_AT) / 0.05) ** 2));
  const rv = (u: number) => 0.05 * pinch(u) * (u < MUSCLE_AT ? 1 + 0.35 * pe : 1 - 0.15 * sq);
  // tiny vessels: from the sinus toward the pore, and fine ones in the wall
  const tinyA = [
    [angP(RUPTURE_A - 0.28, RIN + thick(RUPTURE_A - 0.28, pe) * 0.8), add(PORE_L, pt(0.03, 0.06)), PORE_L],
    [angP(RUPTURE_A + 0.3, RIN + thick(RUPTURE_A + 0.3, pe) * 0.8), add(PORE_L, pt(0.06, -0.02)), PORE_L],
  ];
  const fine: P[][] = [];
  for (let k = 0; k < 7; k++) {
    const a0 = lerp(A0 + 0.2, A1 - 0.2, (k + 0.5) / 7);
    const r0 = RIN + thick(a0, pe) * 0.95;
    const pts: P[] = [];
    for (let j = 0; j < 3; j++) pts.push(angP(a0 + 0.06 * Math.sin(k + j * 1.3), r0 + 0.03 + j * 0.05));
    fine.push(pts);
  }
  const tinyR = (0.016 + 0.018 * pe) * (after >= 0 ? 1 - 0.5 * defl : 1);
  // cells
  const cells: React.ReactNode[] = [];
  const NA = 14;
  for (let i = 0; i < NA; i++) {
    const u = (((i / NA + s.aPhase) % 1) + 1) % 1;
    const {p: q, d} = polyAt(ART, u);
    const off = perp(d);
    cells.push(<Cell key={'a' + i} k={'a' + i} p={add(q, mul(off, 0.014 * Math.sin(i * 2.1)))} a={Math.atan2(d.y, d.x) + 0.6 * Math.sin(i)} s={1} />);
  }
  const NV = 16;
  for (let i = 0; i < NV; i++) {
    let u = (((i / NV + s.vPhase) % 1) + 1) % 1;
    // cells pile up before the pinch when the vein is shut
    if (sq > 0.5 && u > MUSCLE_AT - 0.06 && u < MUSCLE_AT + 0.03) u = MUSCLE_AT - 0.06 - 0.02 * hash(i);
    const {p: q, d} = polyAt(VEIN, u);
    const off = perp(d);
    cells.push(<Cell key={'v' + i} k={'v' + i} p={add(q, mul(off, 0.018 * Math.sin(i * 1.7)))} a={Math.atan2(d.y, d.x) + 0.5 * Math.sin(i * 3)} s={1} dark />);
  }
  // in the sinus: more cells as the pressure rises, crowding and jostling faster
  const NS = Math.round(16 + 46 * pe);
  for (let i = 0; i < NS; i++) {
    const a = lerp(A0 + 0.08, A1 - 0.08, hash(i * 3.71));
    const swirl = (1 - pe) * 0.25 * s.t * (hash(i * 1.3) - 0.5);
    const jit = (0.004 + 0.012 * pe) * noise1(s.t * (3 + 9 * pe) + i * 7.3, i);
    const aa = a + swirl + jit * 4;
    const tk = thick(aa, pe);
    const rr = RIN + 0.02 + (tk - 0.04) * hash(i * 5.17) + jit;
    cells.push(<Cell key={'s' + i} k={'s' + i} p={angP(aa, rr)} a={hash(i * 9.1) * 6 + s.t * (1 + 3 * pe) * (hash(i) - 0.5)} s={0.85} />);
  }
  // tension highlights on the stretched outer wall
  const glints: React.ReactNode[] = [];
  for (let k = 0; k < 6; k++) {
    const a = lerp(A0 + 0.4, A1 - 0.3, k / 5);
    const tk = thick(a, pe);
    const q0 = angP(a - 0.1, RIN + tk - 0.012), q1 = angP(a + 0.1, RIN + tk - 0.012);
    glints.push(<path key={k} d={`M${q0.x} ${q0.y} Q${angP(a, RIN + tk + 0.004).x} ${angP(a, RIN + tk + 0.004).y} ${q1.x} ${q1.y}`} stroke="#FFE4DC" strokeWidth={0.008} fill="none" opacity={0.85 * pe} strokeLinecap="round" />);
  }
  // the blister's tear after the rupture
  const tear = after >= 0 ? clamp(after / 0.12) : 0;
  const rs = angP(RUPTURE_A, RIN + thick(RUPTURE_A, pe) + 0.02);
  const muscleC = polyAt(VEIN, MUSCLE_AT);
  const mN = perp(muscleC.d);
  const mw = 0.1 + 0.06 * sq, mh = 0.17 - 0.025 * sq;
  const reveal = clamp(s.reveal);
  return (
    <g>
      <defs>
        <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={0.06} /></filter>
        <mask id={ids.mask} maskUnits="userSpaceOnUse" x={-4} y={-4} width={8} height={8}>
          <path d={revealPath(reveal, s.t)} fill="#FFF" filter={`url(#${ids.blur})`} />
        </mask>
        <clipPath id={ids.clip}><path d={clipD} /></clipPath>
        <radialGradient id={ids.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor={C.bloodLit} stopOpacity={0.55} />
          <stop offset={1} stopColor={C.bloodLit} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${ids.clip})`}>
      <g mask={`url(#${ids.mask})`}>
        {/* tissue and bone */}
        <rect x={-2.5} y={-2} width={5.5} height={4.5} fill={C.tissue} />
        {Array.from({length: 18}, (_, i) => (
          <path key={i} d={`M${-1.6 + hash(i * 2.3) * 3.6} ${-0.8 + hash(i * 6.1) * 2} q0.25 ${0.06 * (hash(i) - 0.5)} 0.5 0`} stroke={C.tissueDk} strokeWidth={0.012} fill="none" opacity={0.6} />
        ))}
        <path d={closed([pt(-0.55, -0.35), pt(0.05, -0.55), pt(0.42, -0.46), pt(0.36, -0.16), pt(-0.1, -0.08), pt(-0.55, -0.12)], 0.8)} fill={C.bone} stroke={C.boneDk} strokeWidth={sw * 0.7} opacity={0.75} />
        <path d={closed([pt(-0.3, 0.62), pt(0.6, 0.58), pt(1.7, 0.42), pt(1.75, 0.55), pt(0.6, 0.76), pt(-0.3, 0.8)], 0.7)} fill={C.bone} stroke={C.boneDk} strokeWidth={sw * 0.7} opacity={0.75} />
        {/* bony socket rim in front of the eye */}
        <path d={open([angP(-60 * deg, EYE_R * 1.55), angP(0, EYE_R * 1.62), angP(60 * deg, EYE_R * 1.55)])} stroke={C.bone} strokeWidth={0.06} fill="none" strokeLinecap="round" />
        {/* the shadow of the predator passing over */}
        <rect x={-2.5} y={-2} width={5.5} height={4.5} fill="#2A0A10" opacity={0.28 * s.shadow} />
        {/* vein (behind), muscle, artery */}
        <path d={tubeAlong(VEIN, rv)} fill={C.vein} stroke={C.ink} strokeWidth={sw * 0.9} />
        <path d={tubeAlong(VEIN, (u) => rv(u) * 0.35)} fill={C.veinLit} opacity={0.35} transform="translate(0 -0.015)" />
        <path d={tubeAlong(ART, ra)} fill={C.art} stroke={C.ink} strokeWidth={sw * 0.9} />
        <path d={tubeAlong(ART, (u) => ra(u) * 0.3)} fill={C.artLit} opacity={0.5} transform="translate(-0.01 -0.012)" />
        {/* fine vessels in the sinus wall, and the two tiny vessels to the pore */}
        {fine.map((f, k) => <path key={k} d={open(f)} stroke={C.blood} strokeWidth={0.014 * (1 + 0.8 * pe)} fill="none" strokeLinecap="round" opacity={0.85} />)}
        {tinyA.map((f, k) => (
          <g key={k}>
            <path d={open(f, 0.8)} stroke={wallC} strokeWidth={tinyR * 2 + wallW} fill="none" strokeLinecap="round" />
            <path d={open(f, 0.8)} stroke={C.blood} strokeWidth={tinyR * 2} fill="none" strokeLinecap="round" />
            <path d={open(f, 0.8)} stroke="#FFD2C8" strokeWidth={tinyR * 0.5} fill="none" strokeLinecap="round" opacity={0.7 * pe} transform="translate(-0.006 -0.006)" />
          </g>
        ))}
        {/* sinus */}
        <path d={sinusD} fill={C.blood} stroke={wallC} strokeWidth={wallW} strokeLinejoin="round" />
        <path d={sinusD} fill={`url(#${ids.glow})`} opacity={0.6 * pe} />
        {cells}
        {glints}
        {/* eyeball (pushed out a little by the swelling behind it) */}
        <g transform={`translate(${E.x} ${E.y}) scale(${1 + 0.05 * pe}) translate(${-E.x} ${-E.y})`}>
          <circle cx={E.x} cy={E.y} r={EYE_R} fill="#F6EEDC" stroke={C.ink} strokeWidth={sw} />
          <circle cx={E.x + 0.02} cy={E.y} r={EYE_R * 0.78} fill="#D29B3C" stroke="#7A4E14" strokeWidth={sw * 0.8} />
          <circle cx={E.x + 0.02} cy={E.y} r={EYE_R * 0.36} fill="#120B08" />
          <ellipse cx={E.x - 0.05} cy={E.y - 0.07} rx={0.05} ry={0.035} fill="#FFF" opacity={0.9} />
          <path d={`M${E.x - EYE_R * 0.9} ${E.y + EYE_R * 0.3} A${EYE_R} ${EYE_R} 0 0 0 ${E.x + EYE_R * 0.9} ${E.y + EYE_R * 0.3}`} stroke="#B9A88C" strokeWidth={0.02} fill="none" opacity={0.6} />
        </g>
        {/* muscle band round the vein */}
        <g transform={`translate(${muscleC.p.x} ${muscleC.p.y}) rotate(${(Math.atan2(mN.y, mN.x) * 180) / Math.PI})`}>
          <ellipse rx={mh} ry={mw} fill={C.muscle} stroke={C.ink} strokeWidth={sw * 0.9} />
          {[-0.6, -0.2, 0.2, 0.6].map((k, i) => <path key={i} d={`M${-mh * 0.9} ${k * mw} Q0 ${k * mw + 0.012 * sq} ${mh * 0.9} ${k * mw}`} stroke={C.muscleLit} strokeWidth={0.012} fill="none" opacity={0.8} />)}
          <ellipse rx={mh * 0.95} ry={mw * 0.95} fill="none" stroke={C.muscleDk} strokeWidth={0.012} opacity={0.6} />
        </g>
        {/* rupture: the blister wall splits and peels back */}
        {tear > 0 && (
          <g>
            {[-1, 1].map((k) => {
              const n = perp(PORE_DIR);
              const b = add(rs, mul(n, k * 0.035));
              const tip = add(b, add(mul(PORE_DIR, 0.05 * tear), mul(n, k * 0.05 * tear)));
              return <path key={k} d={`M${b.x} ${b.y} L${tip.x} ${tip.y} L${add(b, mul(PORE_DIR, -0.01)).x} ${add(b, mul(PORE_DIR, -0.01)).y} Z`} fill={wallC} stroke={C.ink} strokeWidth={sw * 0.6} />;
            })}
          </g>
        )}
      </g>
      {/* the soft cut edge of the skin */}
      <path d={revealPath(reveal, s.t)} fill="none" stroke="#7E4A33" strokeWidth={0.035} opacity={0.25} filter={`url(#${ids.blur})`} />
      </g>
    </g>
  );
};

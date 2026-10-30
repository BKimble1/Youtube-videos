// The infected eyestalk (upper, near-side tentacle) of the amber snail, swollen by a Leucochloridium broodsac.
// The tentacle is a tube of rings along a cubic spine (base inside the head, eye at the tip). Each ring segment is a
// quad filled with a cross-gradient: the broodsac band under it, seen through the snail's thin translucent skin (more
// skin toward the silhouette), lit as a cylinder from the upper left. The broodsac pulses: a contraction wave runs
// from base to tip once per beat (about 63 per minute), swelling and narrowing the tube and squeezing the bands.
// The cutaway opens a cut window in the near wall (skin, then broodsac wall) onto the lumen packed with encysted
// larvae (metacercariae), which the same pumping wave pushes back and forth.
import React from 'react';
import {clamp, hash, keyS} from '../shared/lib';
import {lit, mix, shade} from '../shared/color';
import {INK} from '../shared/ink';
import {add, cubicArc, mul, nrm, P, poly, rot, sub, V} from './geo';
import {beatEnv, PULSE_F, PULSE_T0} from './timeline';

export const STALK_BASE = V(250, -150);
const C1 = V(-8, -110), C2 = V(26, -236), C3 = V(88, -318); // relative to the base
const NS = 90; // spine segments
const NCAP = 9; // cap rings
export const SKIN = '#CDBFA4';
const HEAD_SKIN = '#9E9078';
const f2 = (n: number) => n.toFixed(2);

export const stalkSway = (t: number) => 0.04 * Math.sin(1.05 * t + 0.6) + 0.018 * Math.sin(2.3 * t + 1.7);

/** wave phase along the tube (radians): a crest leaves the base at every beat and travels to the tip */
export const psi = (s: number, t: number) => 2 * Math.PI * (PULSE_F * (t - PULSE_T0) - 0.85 * s);
const env = (s: number) => clamp(s / 0.12) * clamp((1.08 - s) / 0.24);
const r0 = (s: number) => keyS(s, [[0, 38], [0.15, 55], [0.5, 61], [0.8, 58], [1, 44]], (x) => x * x * (3 - 2 * x));
export const radiusAt = (s: number, t: number) => r0(s) * (1 + env(s) * (0.07 * Math.cos(psi(s, t)) + 0.035 * beatEnv(t - 0.12 * s)));

export const spine = (sway: number) => {
  const b = STALK_BASE;
  const p1 = add(b, rot(C1, sway * 0.6)), p2 = add(b, rot(C2, sway)), p3 = add(b, rot(C3, sway * 1.25));
  return cubicArc(b, p1, p2, p3, NS);
};

export type Ring = {c: P; n: P; tg: P; r: number; s: number};
export const stalkRings = (t: number, sway: number) => {
  const {pts, L} = spine(sway);
  const rings: Ring[] = [];
  for (let i = 0; i <= NS; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(NS, i + 1)];
    const tg = nrm(sub(b, a));
    const s = i / NS;
    rings.push({c: pts[i], tg, n: V(-tg.y, tg.x), r: radiusAt(s, t), s});
  }
  const e = rings[NS];
  for (let k = 1; k <= NCAP; k++) {
    const ph = (k / NCAP) * Math.PI / 2;
    const along = e.r * Math.sin(ph);
    rings.push({c: add(e.c, mul(e.tg, along)), tg: e.tg, n: e.n, r: Math.max(0.3, e.r * Math.cos(ph)), s: 1 + along / L});
  }
  return {rings, L};
};
/** interpolated ring at spine coordinate s in [0, 1] */
const ringAt = (rings: Ring[], s: number): Ring => {
  const x = clamp(s, 0, 1) * NS;
  const i = Math.min(NS - 1, Math.floor(x)), u = x - i;
  const a = rings[i], b = rings[i + 1];
  const tg = nrm(add(mul(a.tg, 1 - u), mul(b.tg, u)));
  return {c: add(mul(a.c, 1 - u), mul(b.c, u)), tg, n: V(-tg.y, tg.x), r: a.r * (1 - u) + b.r * u, s};
};
const at = (R: Ring, v: number, k = 1) => add(R.c, mul(R.n, R.r * v * k));

// ---- broodsac bands (sac coordinate u: 0 at its base, 1 at its tip) ----
const STOPS: [number, string][] = [
  [-0.03, SKIN], [0.02, '#D3DBA8'], [0.07, '#C4D596'],
  [0.1, '#2F6B2C'], [0.19, '#245A25'],
  [0.222, '#F3F0DE'], [0.3, '#EDEAD3'],
  [0.333, '#78C240'], [0.43, '#4F9C31'],
  [0.455, '#2A2A19'], [0.5, '#2E2A1A'],
  [0.528, '#F6F3E3'], [0.61, '#F0EDDA'],
  [0.642, '#65B43A'], [0.73, '#3D812A'],
  [0.755, '#3A2A19'], [0.795, '#3A2A19'],
  [0.825, '#EFE8CD'], [0.872, '#ECE4C7'],
  [0.902, '#DD6A2E'], [0.99, '#BC4520'], [1.06, '#6A2616'], [1.1, '#5A2014'], [1.15, SKIN],
];
export const band = (u: number) => {
  if (u <= STOPS[0][0]) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    if (u <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i];
      return mix(ca, cb, (u - a) / (b - a));
    }
  }
  return STOPS[STOPS.length - 1][1];
};
const isGreen = (u: number) => (u > 0.1 && u < 0.19) || (u > 0.333 && u < 0.43) || (u > 0.642 && u < 0.73);
const isDarkRing = (u: number) => (u > 0.455 && u < 0.5) || (u > 0.755 && u < 0.795);
/** band coordinate under spine coordinate s (bands are squeezed by the passing wave) */
const uOf = (s: number, t: number) => (s - 0.04) / 0.96 + 0.018 * Math.sin(psi(s, t)) * env(s);

const L3 = (() => {
  const l = Math.hypot(0.45, 0.55, 0.7);
  return {x: -0.45 / l, y: -0.55 / l, z: 0.7 / l};
})();
const light = (c: string, n: P, v: number, amb = 0.6) => {
  const nz = Math.sqrt(Math.max(0, 1 - v * v));
  const I = n.x * v * L3.x + n.y * v * L3.y + nz * L3.z;
  return I < amb ? shade(c, Math.min(0.8, (amb - I) * 1.15)) : lit(c, (I - amb) * 0.8);
};
const VS = [-1, -0.94, -0.8, -0.55, -0.25, 0.05, 0.35, 0.62, 0.82, 0.94, 1];

// speckles on the sac (dark flecks on the green bands, a few pale ones on the dark rings)
const SPECK = Array.from({length: 150}, (_, k) => ({s: 0.06 + hash(k * 3.1 + 1) * 0.92, v: (hash(k * 7.7 + 2) * 2 - 1) * 0.84, z: 1.4 + hash(k * 1.3 + 5) * 2.4, a: hash(k * 9.1 + 3)}));
// encysted larvae packed in the lumen: jittered grid in (s, v), two depth layers
const CYSTS = (() => {
  const out: {s: number; v: number; a: number; z: number; layer: number; ph: number}[] = [];
  let k = 0;
  for (let layer = 0; layer < 2; layer++) {
    const ds = layer ? 0.036 : 0.04;
    for (let s = 0.08 + layer * 0.018; s < 0.98; s += ds) {
      const cols = layer ? 6 : 6;
      for (let c = 0; c < cols; c++) {
        k++;
        const v = -0.92 + (1.84 * (c + 0.5)) / cols + (hash(k * 2.3) - 0.5) * 0.16 + (layer ? 0 : 0.15);
        out.push({s: s + (hash(k * 5.9) - 0.5) * 0.02, v: clamp(v, -0.95, 0.95), a: (hash(k * 4.4) - 0.5) * 1.6, z: 0.82 + hash(k * 6.6) * 0.3, layer, ph: hash(k * 8.8) * 6.28});
      }
    }
  }
  return out;
})();

export type Cut = {sc: number; A: number; B: number};

export const Eyestalk: React.FC<{t: number; z: number; film: number; cut: Cut}> = ({t, z, film, cut}) => {
  const px = 1 / z;
  const sway = stalkSway(t);
  const {rings} = stalkRings(t, sway);
  const NR = rings.length;
  // --- surface: one cross-gradient quad per ring segment ---
  const defs: React.ReactNode[] = [];
  const quads: React.ReactNode[] = [];
  for (let i = 0; i < NR - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    const sm = (A.s + B.s) / 2;
    const u = uOf(Math.min(sm, 1.2), t);
    const n = nrm(add(A.n, B.n));
    const m = V((A.c.x + B.c.x) / 2, (A.c.y + B.c.y) / 2), r = (A.r + B.r) / 2;
    const fade = clamp((i + 0.5) / 7);
    let base = band(u);
    if (i < 7) base = mix(HEAD_SKIN, base, fade);
    const id = `h06-sg${i}`;
    defs.push(
      <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={f2(m.x - n.x * r)} y1={f2(m.y - n.y * r)} x2={f2(m.x + n.x * r)} y2={f2(m.y + n.y * r)}>
        {VS.map((v, k) => {
          const f = film + (1 - film) * clamp((Math.abs(v) - 0.78) / 0.22) ** 1.4;
          return <stop key={k} offset={f2((v + 1) / 2)} stopColor={light(mix(base, SKIN, clamp(f)), n, v)} />;
        })}
      </linearGradient>,
    );
    // opaque quads drawn base to tip, each reaching half a segment into the next one, so no seams show
    const C = rings[Math.min(NR - 1, i + 2)];
    const B2 = i + 2 < NR ? {...B, c: add(mul(B.c, 0.6), mul(C.c, 0.4)), r: B.r * 0.6 + C.r * 0.4, n: nrm(add(mul(B.n, 0.6), mul(C.n, 0.4)))} : B;
    const d = poly([at(A, -1), at(B, -1), at(B2, -1), at(B2, 1), at(B, 1), at(A, 1)]);
    quads.push(<path key={`q${i}`} d={d} fill={`url(#${id})`} />);
  }
  // --- speckles (under the skin film) ---
  const specks = SPECK.map((q, k) => {
    const s = q.s + 0.012 * Math.sin(psi(q.s, t)) * env(q.s);
    const u = uOf(s, t);
    const green = isGreen(u), darkR = isDarkRing(u) && q.a > 0.55;
    if (!green && !darkR) return null;
    const R = ringAt(rings, s);
    const p = at(R, q.v);
    const ang = (Math.atan2(R.tg.y, R.tg.x) * 180) / Math.PI;
    const fs = Math.sqrt(1 - q.v * q.v);
    return <ellipse key={`s${k}`} cx={f2(p.x)} cy={f2(p.y)} rx={f2(q.z * 1.25)} ry={f2(q.z * fs)} transform={`rotate(${ang.toFixed(1)} ${f2(p.x)} ${f2(p.y)})`}
      fill={green ? '#16240E' : '#E8E2C8'} opacity={(green ? 0.6 : 0.5) * (1 - film) * (0.35 + 0.65 * fs)} />;
  });
  // --- outline (sides and tip; open at the base where the tentacle grows out of the head) ---
  const i0 = 6;
  const left = rings.slice(i0).map((R) => at(R, -1));
  const right = rings.slice(i0).map((R) => at(R, 1)).reverse();
  const outline = poly([...left, ...right], false);
  // --- wet sheen along the lit side ---
  const spec = rings.slice(8, NR - 3).map((R) => at(R, -0.55));
  const spec2 = rings.slice(14, NS - 6).map((R) => at(R, -0.62));
  // --- the eye at the tip (the eye stays at the tip; the broodsac pushes in behind it) ---
  const tipR = rings[NS + 5];
  const eye = at(tipR, -0.1);
  // --- cutaway window ---
  let cutEl: React.ReactNode = null;
  if (cut.A > 0.004 && cut.B > 0.01) {
    const win = (A: number, B: number, rk = 1) => {
      const pts: P[] = [];
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        const R = ringAt(rings, cut.sc + A * Math.cos(a));
        pts.push(at(R, Math.min(0.97, B) * Math.sin(a), rk));
      }
      return pts;
    };
    const wSkin = win(cut.A + 0.02, cut.B + 0.08);
    const wWall = win(cut.A + 0.012, cut.B + 0.05);
    const wIn = win(cut.A, cut.B).map((p, k) => {
      const R = ringAt(rings, cut.sc + cut.A * Math.cos((k / 64) * Math.PI * 2));
      return add(p, mul(R.n, -R.r * 0.035));
    });
    const lo = cut.sc - cut.A - 0.05, hi = cut.sc + cut.A + 0.05;
    const RK = 0.86; // lumen radius relative to the skin
    const wall: React.ReactNode[] = [];
    const inner: React.ReactNode[] = [];
    const idefs: React.ReactNode[] = [];
    for (let i = 0; i < NS; i++) {
      const A = rings[i], B = rings[i + 1];
      const sm = (A.s + B.s) / 2;
      if (sm < lo || sm > hi) continue;
      const bc = band(uOf(sm, t));
      const cw = shade(bc, 0.3);
      wall.push(<path key={`w${i}`} d={poly([at(A, -1), at(B, -1), at(B, 1), at(A, 1)])} fill={cw} stroke={cw} strokeWidth={f2(1.1 * px)} />);
      // far inner wall of the lumen: the same bands seen from inside, darker, lit through the opening
      const n = nrm(add(A.n, B.n));
      const m = V((A.c.x + B.c.x) / 2, (A.c.y + B.c.y) / 2), r = ((A.r + B.r) / 2) * RK;
      const id = `h06-ig${i}`;
      const ci = mix(lit(bc, 0.1), '#7E8E52', 0.35);
      idefs.push(
        <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={f2(m.x - n.x * r)} y1={f2(m.y - n.y * r)} x2={f2(m.x + n.x * r)} y2={f2(m.y + n.y * r)}>
          <stop offset="0" stopColor={shade(ci, 0.72)} />
          <stop offset="0.3" stopColor={shade(ci, 0.4)} />
          <stop offset="0.62" stopColor={shade(ci, 0.26)} />
          <stop offset="1" stopColor={shade(ci, 0.6)} />
        </linearGradient>,
      );
      inner.push(<path key={`i${i}`} d={poly([at(A, -1, RK), at(B, -1, RK), at(B, 1, RK), at(A, 1, RK)])} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={f2(1.1 * px)} />);
    }
    // pumping constriction rings seen inside the lumen (circular muscle of the broodsac wall)
    const rings2: React.ReactNode[] = [];
    const ph = PULSE_F * (t - PULSE_T0);
    for (let k = Math.floor(ph) - 2; k <= Math.floor(ph) + 1; k++) {
      const s0 = (ph - 0.5 - k) / 0.85;
      if (s0 < lo || s0 > hi) continue;
      const pts: P[] = [];
      for (let mm = 0; mm <= 18; mm++) {
        const v = -1 + (2 * mm) / 18;
        pts.push(at(ringAt(rings, s0 + 0.03 * (1 - v * v)), v, RK));
      }
      rings2.push(<path key={`r${k}`} d={poly(pts, false)} fill="none" stroke="#14220C" strokeWidth={5} opacity={0.3} />);
      rings2.push(<path key={`rl${k}`} d={poly(pts.map((p) => add(p, V(-1.6, -1.6))), false)} fill="none" stroke="#E4EFC0" strokeWidth={1.4} opacity={0.4} />);
    }
    // cysts
    const cysts = CYSTS.map((q, k) => {
      if (q.s < lo || q.s > hi) return null;
      const w = psi(q.s, t);
      const s = q.s + 0.026 * Math.sin(w) * env(q.s) + 0.004 * Math.sin(t * 2.1 + q.ph);
      const R = ringAt(rings, s);
      const v = q.v * (0.95 + 0.05 * Math.cos(w));
      const p = at(R, v, RK * (q.layer ? 0.98 : 0.9));
      const ang = (Math.atan2(R.tg.y, R.tg.x) * 180) / Math.PI + q.a * 57 + 14 * Math.sin(w + q.ph);
      const fs = 0.6 + 0.4 * Math.sqrt(1 - v * v);
      const rx = 5.6 * q.z, ry = 4.4 * q.z * fs;
      const front = q.layer === 1;
      const body = front ? '#F6F0DC' : '#B9B08C';
      const larva = front ? '#E5CB8E' : '#A2946A';
      const tf = `translate(${f2(p.x)} ${f2(p.y)}) rotate(${ang.toFixed(1)})`;
      return (
        <g key={`y${k}`} transform={tf}>
          <ellipse cx={0} cy={0} rx={f2(rx)} ry={f2(ry)} fill={body} stroke={front ? '#6E5C38' : '#4F4A2C'} strokeWidth={0.55} />
          <ellipse cx={f2(-rx * 0.06)} cy={f2(ry * 0.05)} rx={f2(rx * 0.68)} ry={f2(ry * 0.62)} fill={larva} />
          <path d={`M${f2(-rx * 0.5)},${f2(ry * 0.12)} Q0,${f2(-ry * 0.5)} ${f2(rx * 0.5)},${f2(ry * 0.14)}`} fill="none" stroke={front ? '#9A7A44' : '#6E6440'} strokeWidth={0.5} />
          <circle cx={f2(rx * 0.4)} cy={f2(-ry * 0.04)} r={f2(0.85 * q.z)} fill={front ? '#8A6236' : '#5E5634'} />
          {front && <ellipse cx={f2(-rx * 0.32)} cy={f2(-ry * 0.46)} rx={f2(rx * 0.3)} ry={f2(ry * 0.15)} fill="#FFFDF4" opacity={0.8} />}
        </g>
      );
    });
    cutEl = (
      <g>
        <defs>
          <clipPath id="h06-wall"><path d={poly(wWall)} /></clipPath>
          <clipPath id="h06-win"><path d={poly(wIn)} /></clipPath>
          {idefs}
        </defs>
        {/* cut skin edge (thin pale tissue), then the cut banded broodsac wall, then the lumen */}
        <path d={poly(wSkin)} fill="#E6CFB6" stroke={INK} strokeWidth={f2(1.2 * px)} strokeOpacity={0.75} />
        <g clipPath="url(#h06-wall)">{wall}</g>
        <g clipPath="url(#h06-win)">
          {inner}
          {rings2}
          {cysts}
          <path d={poly(wIn)} fill="none" stroke="#08120A" strokeWidth={11} opacity={0.2} />
          <path d={poly(wIn)} fill="none" stroke="#08120A" strokeWidth={4} opacity={0.32} />
        </g>
        <path d={poly(wIn)} fill="none" stroke="#1D2A12" strokeWidth={f2(1 * px)} opacity={0.7} />
      </g>
    );
  }
  return (
    <g>
      <defs>{defs}</defs>
      {quads}
      {specks}
      <path d={poly(spec, false)} fill="none" stroke="#FFF6EA" strokeWidth={8} strokeLinecap="round" opacity={0.16} />
      <path d={poly(spec2, false)} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.4} />
      {/* eye at the tip */}
      <ellipse cx={f2(eye.x)} cy={f2(eye.y)} rx={7.2} ry={6.6} fill="#121212" opacity={0.92} />
      <circle cx={f2(eye.x - 2.2)} cy={f2(eye.y - 2.4)} r={1.8} fill="#FFFFFF" opacity={0.8} />
      {cutEl}
      <path d={outline} fill="none" stroke={INK} strokeWidth={f2(2.3 * px)} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

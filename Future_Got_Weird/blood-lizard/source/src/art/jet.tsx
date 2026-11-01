// The blood squirt, V3 (world units, cm). A fast liquid stream, not a line: blood is emitted from the pore at the
// FRONT corner of the lids continuously between t0 and t1 and every parcel flies the arc to the target in `flight`
// seconds. Near the pore the parcels merge into one glossy, rippling stream; further out it breaks up into separate,
// motion-stretched droplets that fan out a little; parcels that arrive splash back off the target and fall. Every
// drop on screen belongs to this stream or to its splash at the target (no loose blood anywhere else).
import React from 'react';
import {P, add, closed, mul, nrm, perp, pt, sub} from '../core/geo';
import {clamp, hash, lerp} from '../lib';

const B = {core: '#B3111B', dk: '#5E060C', lit: '#FF7A6E', ink: '#2A0608'};
export type JetState = {
  from: P; dir: P; to: P;  // pore, launch direction, where the stream lands (this frame)
  t0: number; t1: number;  // emission starts / stops
  flight: number;          // seconds from the pore to the target
  t: number;               // now
  w: number;               // stream width at the pore (cm)
  ground?: boolean;        // the target is sand (splash stays on the ground)
};
/** a point on the arc (quadratic, leaving `from` along `dir`) */
export const jetPoint = (j: {from: P; dir: P; to: P}, u: number) => {
  const d = Math.hypot(j.to.x - j.from.x, j.to.y - j.from.y);
  const c = add(j.from, mul(nrm(j.dir), d * 0.42));
  return add(add(mul(j.from, (1 - u) * (1 - u)), mul(c, 2 * u * (1 - u))), mul(j.to, u * u));
};
const tangent = (j: JetState, u: number) => nrm(sub(jetPoint(j, Math.min(1, u + 0.01)), jetPoint(j, Math.max(0, u - 0.01))));
/** how far the stream reaches now (0..1 of the arc), and where its tail is */
export const jetSpan = (j: JetState) => ({front: clamp((j.t - j.t0) / j.flight), tail: clamp((j.t - j.t1) / j.flight)});

const DT = 1 / 120;
export const Jet: React.FC<{j: JetState; sw: number}> = ({j, sw}) => {
  if (j.t < j.t0) return null;
  const {front, tail} = jetSpan(j);
  const len = Math.hypot(j.to.x - j.from.x, j.to.y - j.from.y);
  const out: React.ReactNode[] = [];
  // the merged stream near the pore, rippling
  const BREAK = 0.42;
  const s0 = tail, s1 = Math.min(front, BREAK);
  if (s1 > s0 + 0.005) {
    const L: P[] = [], R: P[] = [];
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const u = lerp(s0, s1, i / N);
      const p = jetPoint(j, u), n = perp(tangent(j, u));
      const ripple = 1 + 0.28 * Math.sin(2 * Math.PI * (u * 9 - j.t * 22));
      const taperEnd = Math.min(1, (s1 - u) / 0.06 + 0.25) * Math.min(1, (u - s0) / 0.03 + 0.4);
      const half = 0.5 * j.w * (0.6 + 0.9 * u) * ripple * taperEnd;
      L.push(add(p, mul(n, half)));
      R.push(add(p, mul(n, -half)));
    }
    const d = closed([...L, ...R.reverse()], 0.5);
    out.push(<path key="body" d={d} fill={B.core} stroke={B.ink} strokeWidth={sw} strokeLinejoin="round" />);
    const hl: P[] = [];
    for (let i = 0; i <= 12; i++) {
      const u = lerp(s0, s1, i / 12);
      hl.push(add(jetPoint(j, u), mul(perp(tangent(j, u)), 0.18 * j.w)));
    }
    out.push(<path key="hl" d={'M' + hl.map((q) => `${q.x} ${q.y}`).join('L')} stroke={B.lit} strokeWidth={j.w * 0.14} fill="none" strokeLinecap="round" opacity={0.85} />);
  }
  // parcels: droplets beyond the break-up point (and the leading slug), with motion streaks
  const kMax = Math.floor((Math.min(j.t, j.t1) - j.t0) / DT);
  const splash: React.ReactNode[] = [];
  for (let k = 0; k <= kMax; k++) {
    const te = j.t0 + k * DT;
    const u = (j.t - te) / j.flight;
    const h1 = hash(k * 1.37 + 0.3), h2 = hash(k * 2.91 + 0.7), h3 = hash(k * 4.13 + 0.1);
    if (u > 0 && u <= 1) {
      if (u < BREAK - 0.03 && k < kMax - 1) continue;
      const tg = tangent(j, u), n = perp(tg);
      const spread = j.w * 2.2 * Math.max(0, u - 0.3) ** 1.3 * (h1 - 0.5);
      const p = add(jetPoint(j, u), mul(n, spread));
      const lead = k >= kMax - 2 && front < 1;
      const r = j.w * (lead ? 0.62 : 0.3 + 0.32 * h2) * (1 - 0.25 * u);
      const streak = Math.min(len * 0.08, (len / j.flight) * (1 / 30) * 0.5);
      const a = (Math.atan2(tg.y, tg.x) * 180) / Math.PI;
      const tailP = add(p, mul(tg, -streak));
      out.push(<path key={'s' + k} d={`M${tailP.x} ${tailP.y} L${p.x} ${p.y}`} stroke={B.core} strokeWidth={r * 1.1} strokeLinecap="round" opacity={0.35} />);
      out.push(
        <g key={'d' + k} transform={`translate(${p.x} ${p.y}) rotate(${a})`}>
          <ellipse rx={r * 1.5} ry={r * 0.85} fill={B.core} stroke={B.ink} strokeWidth={sw * 0.6} />
          <ellipse cx={-r * 0.3} cy={-r * 0.3} rx={r * 0.5} ry={r * 0.22} fill={B.lit} opacity={0.8} />
        </g>,
      );
    } else if (u > 1 && k % 2 === 0) {
      // splash: arrived parcels bounce back off the target in a fan and fall
      const age = j.t - (te + j.flight);
      if (age > 0.32) continue;
      const tin = tangent(j, 1);
      const ang = Math.atan2(-tin.y, -tin.x) + (h1 - 0.5) * 2.4;
      const sp = 28 + 40 * h2;
      let q = add(j.to, pt(Math.cos(ang) * sp * age, Math.sin(ang) * sp * age + 0.5 * 600 * age * age));
      if (j.ground) q = pt(q.x, Math.min(q.y, j.to.y + 0.3));
      const r = j.w * (0.18 + 0.2 * h3) * (1 - age / 0.4);
      splash.push(<circle key={'p' + k} cx={q.x} cy={q.y} r={r} fill={B.core} stroke={B.ink} strokeWidth={sw * 0.4} />);
    }
  }
  // the wet patch where it lands
  const arrived = clamp((j.t - j.t0 - j.flight) / 0.25) * (1 - clamp((j.t - j.t1 - j.flight - 0.6) / 0.4));
  return (
    <g>
      {arrived > 0 && <ellipse cx={j.to.x} cy={j.to.y} rx={j.w * (0.8 + 1.2 * arrived)} ry={j.w * (0.5 + 0.6 * arrived)} fill={B.core} stroke={B.ink} strokeWidth={sw * 0.5} opacity={0.95} />}
      {out}
      {splash}
    </g>
  );
};

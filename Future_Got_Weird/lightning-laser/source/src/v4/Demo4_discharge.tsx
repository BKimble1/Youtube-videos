// V4 beat F: the demonstration bolt (V3 finding F-2). V3's bolt (bolt3.ts BOLT3V) hugs the cyan line for some 15 m
// past the guided section and two of its branches cross the line, which blurs where the guidance ends. F's bolt is
// BOLT3V with:
//   - the guided section unchanged (it lies on the beam axis, the first BOLT3.guidedS metres);
//   - the unguided path turned off the line where the guidance ends: a leftward offset that grows quickly over the
//     first ~15 m past the guided section and relaxes toward the top (so the bolt still meets the cloud close to
//     BOLT3V's top, where View3 lights the cloud base);
//   - every branch moved with its root, and a branch whose end would lie right of the beam (across the line) mirrored
//     about its root to the open side.
// The drawing is v3/Scene3.tsx Discharge3D (copied: it reads BOLT3V directly), with F's controls: branchK (branch
// width/alpha), streamerK (the brief side jabs along the guided section), tipK (the climbing tip's glow), upperK (the
// unguided part and its branches, so the afterglow can cool there first while the guided section stays hot).
import React from 'react';
import {clamp, fmt, hash} from '../dc/math';
import {axis3, BOLT3, Br3, Cam3, P3, projector, Proj, v3, V3} from '../v2/p3';
import {BOLT3V} from '../v3/bolt3';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');

// ------------------------------------------------------------------ F's bolt
const GS = BOLT3.guidedS;
/** the beam axis's x at world height y (the axis lies in the plane z = 0) */
const A0 = axis3(0), A1 = axis3(100);
const axisX = (y: number) => A0.x + ((A1.x - A0.x) * (y - A0.y)) / (A1.y - A0.y);
/** the leftward offset (m) of the unguided path, u metres past the guided section */
const OFF_A = 6.5, OFF_L = 7;
export const offF = (u: number) => (u <= 0 ? 0 : -OFF_A * (1 - Math.exp(-u / OFF_L)) * (1 - 0.45 * clamp((u - 20) / 46)));
export const BOLT_F = (() => {
  const pts: P3[] = BOLT3V.pts.map((p) => (p.s > GS ? {...p, x: p.x + offF(p.s - GS)} : p));
  const branches: Br3[] = BOLT3V.branches.map((b) => {
    const dx = offF(b.s0 - GS);
    const moved = b.pts.map((q) => ({...q, x: q.x + dx}));
    const root = moved[0], end = moved[moved.length - 1];
    const across = end.x > axisX(end.y) - 1.5;
    return {...b, pts: across ? moved.map((q) => ({...q, x: 2 * root.x - q.x})) : moved};
  });
  return {...BOLT3V, pts, branches};
})();

// ------------------------------------------------------------------ the drawing (v3/Scene3.tsx Discharge3D on BOLT_F)
const partial = (pts: P3[], s: number) => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].s <= s) out.push(pts[i]);
    else {
      if (i > 0) {
        const a = pts[i - 1], b = pts[i];
        const u = (s - a.s) / (b.s - a.s || 1);
        out.push(v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u));
      }
      break;
    }
  }
  return out;
};
const strokeRuns = (P: (p: V3) => Proj, pts: V3[], wM: number, f: number, minW: number, maxW: number) => {
  const runs: {d: string; w: number}[] = [];
  const pp = pts.map(P);
  for (let i = 0; i + 1 < pp.length; i += 4) {
    const seg = pp.slice(i, Math.min(pp.length, i + 5)).filter((q) => q.ok);
    if (seg.length < 2) continue;
    const z = seg[Math.floor(seg.length / 2)].z;
    runs.push({d: line(seg), w: clamp((f * wM) / Math.max(z, 0.5), minW, maxW)});
  }
  return runs;
};
/** the brief side jabs off the guided section (as Scene3's STREAMS3) */
const STREAMS = (() => {
  const up = {x: 0.309, y: 0.951};
  return BOLT3.streamers
    .filter((st, k) => k % 2 === 0 && st.at > 20)
    .map((st, k) => {
      const side = k % 2 ? 1 : -1;
      const ang = (side * (25 + 15 * hash(k, 611)) * Math.PI) / 180;
      const dx = up.x * Math.cos(ang) - up.y * Math.sin(ang), dy = up.x * Math.sin(ang) + up.y * Math.cos(ang);
      const L = 2.2 + 1.6 * hash(k, 613);
      const b0 = st.pts[0];
      const pts: P3[] = [{...b0, s: 0}];
      let q = b0, acc = 0;
      for (let m = 0; m < 3; m++) {
        const j = (hash(k * 5 + m, 617) - 0.5) * 0.5;
        const nq = {x: q.x + (dx + j * dy) * (L / 3), y: q.y + (dy - j * dx) * (L / 3), z: q.z + (hash(k * 7 + m, 619) - 0.5) * 0.4};
        acc += L / 3;
        pts.push({...nq, s: acc});
        q = {...nq, s: acc};
      }
      return {pts, len: acc, at: st.at};
    });
})();
/** the tip of F's leader at length s (for the light and the camera checks) */
export const tipF = (s: number): V3 => {
  const m = partial(BOLT_F.pts, Math.max(0.01, Math.min(s, BOLT_F.total)));
  return m[m.length - 1];
};
export const DischargeF4: React.FC<{cam: Cam3; s: number; core: number; id: string; branchK?: number; streamerK?: number; tipK?: number; upperK?: number}> = ({cam, s, core, id, branchK = 1, streamerK = 1, tipK = 1, upperK = 1}) => {
  if (s <= 0) return null;
  const P = projector(cam);
  const c = clamp(core, 0, 1.8);
  const main = partial(BOLT_F.pts, s);
  // the guided part and the rest (they share the point where the guidance ends, so the line stays joined)
  const nG = BOLT_F.pts.filter((p) => p.s <= GS).length;
  const mainG = s > GS ? main.slice(0, nG) : main, mainU = s > GS ? main.slice(nG - 1) : [];
  const brs = BOLT_F.branches.map((b) => ({b, l: Math.min(b.len, (s - b.s0) * 0.6)})).filter((x) => x.l > 0).map((x) => partial(x.b.pts, x.l));
  const sts = STREAMS
    .map((st) => {
      const age = (s - st.at) / 9;
      if (age <= 0 || age >= 1 || s >= BOLT3.total - 0.5) return null;
      const grow = clamp(age * 4);
      return {pts: partial(st.pts, st.len * grow), a: clamp(1 - age) * 0.9 * streamerK};
    })
    .filter((x): x is {pts: V3[]; a: number} => !!x && x.a > 0.02);
  const f = cam.f;
  const draw = (pts: V3[], k: number, key: string, a = 1) => {
    const halo = strokeRuns(P, pts, 5 * k, f, 5, 70);
    const mid = strokeRuns(P, pts, 1.9 * k, f, 3, 26);
    const cor = strokeRuns(P, pts, 0.7 * k * (0.8 + 0.25 * c), f, 1.8, 11);
    return (
      <g key={key} opacity={a}>
        {halo.map((r, i) => <path key={`h${i}`} d={r.d} fill="none" stroke="#6C78FF" strokeOpacity={0.14 * c} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
        {mid.map((r, i) => <path key={`m${i}`} d={r.d} fill="none" stroke="#B4C2FF" strokeOpacity={0.5 * Math.min(1, c)} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
        {cor.map((r, i) => <path key={`c${i}`} d={r.d} fill="none" stroke="#FFFFFF" strokeOpacity={Math.min(1, 0.6 + 0.4 * c) * clamp(c / 0.25)} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
    );
  };
  const tip = main[main.length - 1];
  const tp = P(tip);
  const growing = s < BOLT3.total - 0.5;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7A84FF" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 60, 6, 26))} />
        </filter>
      </defs>
      <g filter={`url(#${id}-bl)`} opacity={0.32 * Math.min(1.2, c)}>
        {strokeRuns(P, main, 7, f, 8, 130).map((r, i) => <path key={i} d={r.d} fill="none" stroke="#8C96FF" strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
      </g>
      {sts.map((st, i) => draw(st.pts, 0.55, `s${i}`, st.a))}
      {brs.map((b, i) => draw(b, 0.6 * branchK, `b${i}`, Math.min(1, 0.55 + 0.45 * branchK) * upperK))}
      {draw(mainG, 1, 'm')}
      {mainU.length > 1 && draw(mainU, 1, 'u', upperK)}
      {growing && tp.ok && <circle cx={fmt(tp.x)} cy={fmt(tp.y)} r={fmt(clamp((f * 4.5) / tp.z, 12, 80) * (0.75 + 0.25 * tipK))} fill={`url(#${id}-tip)`} opacity={fmt(clamp(0.6 + 0.4 * tipK))} />}
    </g>
  );
};

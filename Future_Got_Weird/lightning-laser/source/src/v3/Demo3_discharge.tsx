// V3 beat F: the demonstration bolt. A copy of Scene3's Discharge3D (same strokes, glow, branches and tip) with two
// extra controls, so the guided section reads as one clean line hugging the cyan path:
//   streamerK  scales the short stalled side streamers along the guided section (Discharge3D draws all 16 at full
//              strength, which reads as a fishbone on the guided part); F keeps a hint of them
//   branchK    the branches past the guided section (restrained)
// View3 is drawn with dk = 0 (no discharge of its own, but its bolt-lit sky and FlashWash still follow st.s), and
// this is drawn as its child. If Scene3's Discharge3D changes, mirror the change here.
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {BOLT3, Br3, Cam3, P3, projector, Proj, V3, v3} from '../v2/p3';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
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

/** tipK scales the growing tip's glow (F flickers it with the leader's crackle) */
export const DischargeF: React.FC<{cam: Cam3; s: number; core: number; id: string; branchK?: number; streamerK?: number; tipK?: number}> = ({cam, s, core, id, branchK = 1, streamerK = 1, tipK = 1}) => {
  if (s <= 0) return null;
  const P = projector(cam);
  const c = clamp(core, 0, 1.8);
  const main = partial(BOLT3.pts, s);
  const brs = BOLT3.branches.map((b: Br3) => ({b, l: Math.min(b.len, (s - b.s0) * 0.6)})).filter((x) => x.l > 0).map((x) => partial(x.b.pts, x.l));
  const sts = BOLT3.streamers
    .map((st) => {
      const age = (s - st.at) / 30;
      if (age <= 0) return null;
      const grow = clamp(age * 3);
      const fade = clamp(1.25 - age) * 0.8 + 0.2 * clamp(c - 0.9);
      const base = 0.45 + 0.55 * clamp((st.at - 8) / 30);
      return {pts: partial(st.pts, st.len * grow * (0.6 + 0.4 * base) * (0.45 + 0.55 * streamerK)), a: fade * base * streamerK};
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
      {sts.map((st, i) => draw(st.pts, 0.45, `s${i}`, st.a))}
      {brs.map((b, i) => draw(b, 0.6 * branchK, `b${i}`, 0.55 + 0.45 * branchK))}
      {draw(main, 1, 'm')}
      {growing && tp.ok && <circle cx={fmt(tp.x)} cy={fmt(tp.y)} r={fmt(clamp((f * 4.5) / tp.z, 12, 80) * (0.75 + 0.25 * tipK))} fill={`url(#${id}-tip)`} opacity={fmt(clamp(0.6 + 0.4 * tipK))} />}
    </g>
  );
};

// V3 beat B: the side streamer and its stalled attempts, drawn once in screen space on top of both the macro view and
// the molecular view (so the zoom-dissolve never doubles it).
//   macro part  a 3D polyline (Air3_cam STR) from the channel: fizz at the root 4.36, the jab on the snap 4.52, steps
//               on the zaps 4.55 / 4.73, stall and sizzle from 4.85
//   micro part  its continuation in micro units from the stalled tip T: on each attempt (5.6, 6.35, 7.05) it re-brightens,
//               pushes a step or two up-right, stalls with a flickering corona, and dims; the last one fades out
// Colour language: white core, violet edges (PAL.core / mid / halo).
import React from 'react';
import {clamp, fmt, hash} from '../dc/math';
import {ss} from '../lib';
import {Cam3, projector, add3, mul3, sub3, V3} from '../v2/p3';
import {AirCam, ROOT3, STR} from './Air3_cam';
import {PAL} from './palette';

type Pt = {x: number; y: number};
const spike = (t: number, t0: number, tau = 0.07) => (t >= t0 ? Math.exp(-(t - t0) / tau) : 0);
const grow = (t: number, t0: number, dur: number) => {
  const x = clamp((t - t0) / dur);
  return 1 - (1 - x) * (1 - x); // shoots out, slows into the step
};

// ------------------------------------------------------------------ the micro continuation (micro units, y down)
/** a jagged 2D polyline (midpoint displacement), for the micro steps and sparks */
const jag2 = (a: Pt, b: Pt, seed: number, amp: number, minL: number): Pt[] => {
  const out: Pt[] = [a];
  const rec = (p: Pt, q: Pt, k: number, lvl: number) => {
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy);
    if (L < minL || lvl > 12) { out.push(q); return; }
    const o = (hash(k, seed) - 0.5) * 2 * amp * L;
    const f = 0.5 + (hash(k, seed + 1) - 0.5) * 0.2;
    const m = {x: p.x + dx * f - (dy / L) * o, y: p.y + dy * f + (dx / L) * o};
    rec(p, m, k * 2 + 1, lvl + 1);
    rec(m, q, k * 2 + 2, lvl + 1);
  };
  rec(a, b, 1, 0);
  return out;
};
type SPt = Pt & {s: number};
const withS2 = (pts: Pt[]): SPt[] => {
  let s = 0;
  return pts.map((p, i) => {
    if (i > 0) s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    return {...p, s};
  });
};
/** the attempts' steps: [angle (deg clockwise from up), length]; each attempt pushes a little less far */
const STEPS: [number, number][][] = [
  [[20, 64], [32, 58], [18, 62]], // attempt 1 (5.6)
  [[34, 58], [14, 54]], // attempt 2 (6.35)
  [[26, 40], [10, 32]], // attempt 3 (7.05)
];
export const ATT = [
  {t0: 5.6, steps: [5.6, 5.69, 5.79], stall: [5.83, 6.08], relax: 6.3},
  {t0: 6.35, steps: [6.35, 6.46], stall: [6.5, 6.78], relax: 6.98},
  {t0: 7.05, steps: [7.05, 7.15], stall: [7.19, 7.36], relax: 7.95}, // still fading out at the cut (7.81)
];
export const EXT = (() => {
  const knots: Pt[] = [{x: 0, y: 0}];
  let p = knots[0];
  STEPS.forEach((att) => att.forEach(([a, L]) => {
    const r = (a * Math.PI) / 180;
    p = {x: p.x + Math.sin(r) * L, y: p.y - Math.cos(r) * L};
    knots.push(p);
  }));
  const raw: Pt[] = [];
  for (let i = 0; i + 1 < knots.length; i++) {
    const seg = jag2(knots[i], knots[i + 1], 900 + i * 7, 0.2, 3);
    raw.push(...(raw.length ? seg.slice(1) : seg));
  }
  const pts = withS2(raw);
  const kS = knots.map((k) => pts.reduce((b, q) => (Math.hypot(q.x - k.x, q.y - k.y) < Math.hypot(b.x - k.x, b.y - k.y) ? q : b), pts[0]).s);
  // the knot index where each attempt stalls
  const stallK = [3, 5, 7];
  return {pts, knots, kS, stallK};
})();
const at2 = (pts: SPt[], s: number): Pt => {
  if (s <= 0) return pts[0];
  for (let i = 1; i < pts.length; i++) if (pts[i].s >= s) {
    const a = pts[i - 1], b = pts[i], u = (s - a.s) / (b.s - a.s || 1);
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u};
  }
  return pts[pts.length - 1];
};

// ------------------------------------------------------------------ timing
/** macro streamer length (m along STR) */
export const macroS = (t: number) => {
  const k = STR.kS;
  if (t < 4.515) return 0;
  if (t < 4.55) return k[1] * grow(t, 4.515, 0.03);
  if (t < 4.725) return k[1] + (k[2] - k[1]) * grow(t, 4.55, 0.05);
  return k[2] + (k[3] - k[2]) * grow(t, 4.725, 0.03);
};
/** micro continuation length (micro units along EXT) */
export const extS = (t: number) => {
  let s = 0, ki = 0;
  for (const a of ATT) for (const t0 of a.steps) {
    const s0 = EXT.kS[ki], s1 = EXT.kS[ki + 1];
    if (t >= t0) s = s0 + (s1 - s0) * grow(t, t0, 0.035);
    ki++;
  }
  return s;
};
export const tipMicro = (t: number) => at2(EXT.pts, extS(t));
const stepTimes = [4.515, 4.55, 4.725, ...ATT.flatMap((a) => a.steps)];
/** body brightness (core opacity and glow), the stalled tip's corona, and the tip glow */
export const leaderLight = (t: number) => {
  const flash = stepTimes.reduce((a, s, i) => a + spike(t, s, i < 3 ? 0.08 : 0.06) * (i < 3 ? 0.7 : 0.55), 0);
  // the macro streamer: bright while it jumps, dims while it stalls (4.85-5.45)
  let base = 0.82 * (1 - 0.5 * ss(t, 4.85, 5.5));
  let cor = t >= 4.85 && t < 5.5 ? 1 - ss(t, 5.1, 5.5) : 0;
  ATT.forEach((a, i) => {
    if (t < a.t0) return;
    const last = i === ATT.length - 1;
    const on = 0.9 - 0.06 * i, rest = last ? 0 : 0.36;
    base = rest + (on - rest) * (1 - ss(t, a.stall[1], a.relax));
    if (t >= a.stall[0] - 0.02 && t < a.stall[1] + 0.2) cor = Math.max(cor, (1 - ss(t, a.stall[1] - 0.04, a.stall[1] + 0.2)) * (0.85 - 0.1 * i));
  });
  return {body: base + flash, tip: base + flash * 1.3, corona: cor};
};

// ------------------------------------------------------------------ drawing
const pathD = (pts: Pt[]) => (pts.length > 1 ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
const inside = (q: Pt, mg: number) => q.x > -mg && q.x < 1080 + mg && q.y > -mg && q.y < 1920 + mg;
/** project a 3D polyline (up to arc length s) into runs of on-screen points, decimated to ~1.5 px */
const screenRuns = (cam: Cam3, pts: (V3 & {s: number})[], s: number, mg = 260): Pt[][] => {
  const P = projector(cam);
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  let last: Pt | null = null;
  const push = (q: Pt, force = false) => {
    if (!force && last && Math.hypot(q.x - last.x, q.y - last.y) < 1.5) return;
    cur.push(q);
    last = q;
  };
  for (let i = 0; i < pts.length; i++) {
    let p: V3 = pts[i];
    let end = false;
    if (pts[i].s > s) {
      if (i === 0) break;
      const a = pts[i - 1], b = pts[i], u = (s - a.s) / (b.s - a.s || 1);
      p = add3(a, mul3(sub3(b, a), u));
      end = true;
    }
    const q = P(p);
    if (q.ok && inside(q, mg)) push(q, end);
    else if (cur.length) { runs.push(cur); cur = []; last = null; }
    if (end) break;
  }
  if (cur.length) runs.push(cur);
  return runs.filter((r) => r.length > 1);
};
/** short flickering corona sparks round a point, pointing roughly along `ang` (deg clockwise from up) */
const corona = (c: Pt, ang: number, len: number, seed: number, frame: number, n = 6) => {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (hash(frame * 13 + i, seed) < 0.42) continue;
    const a = ((ang + (hash(frame * 7 + i, seed + 1) - 0.5) * 150) * Math.PI) / 180;
    const L = len * (0.45 + 0.75 * hash(frame * 11 + i, seed + 2));
    const e = {x: c.x + Math.sin(a) * L, y: c.y - Math.cos(a) * L};
    out.push(pathD(jag2(c, e, seed + frame * 3 + i * 17, 0.28, Math.max(2, L / 5))));
  }
  return out.join(' ');
};

export const Leader3: React.FC<{t: number; ac: AirCam}> = ({t, ac}) => {
  const {cam, L, m, tip} = ac;
  const frame = Math.round(t * 30);
  const lt = leaderLight(t);
  const wc = 2.6 * Math.exp(0.38 * L); // core width (screen px): thin in the wide, matched to the micro view's scale
  const sM = macroS(t);
  const P = projector(cam);
  const els: React.ReactNode[] = [];
  // the fizz at the root before the jab (4.36-4.52): a violet corona flickering on the channel's right side
  const root = P(ROOT3);
  if (t >= 4.355 && t < 4.56) {
    const k = (t < 4.515 ? ss(t, 4.355, 4.4) : 1 - ss(t, 4.515, 4.56));
    els.push(
      <g key="fizz" opacity={k}>
        <circle cx={fmt(root.x)} cy={fmt(root.y)} r={fmt(wc * 13)} fill={PAL.halo} opacity={0.3} />
        <circle cx={fmt(root.x)} cy={fmt(root.y)} r={fmt(wc * 3)} fill={PAL.mid} opacity={0.85} />
        <path d={corona(root, 68, wc * 11, 31, frame, 8)} fill="none" stroke="#E6E0FF" strokeWidth={fmt(wc * 0.6)} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  }
  // the light each jump throws on the air round it (local, brief)
  [4.515, 4.55, 4.725].forEach((t0, i) => {
    const a = spike(t, t0, 0.11);
    if (a < 0.02) return;
    const c = P(STR.knots[i + 1]);
    els.push(<circle key={`bl${i}`} cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(wc * 30)} fill={`url(#b-lbloom-${frame})`} opacity={0.75 * a} />);
  });
  const bloomDef = (
    <radialGradient id={`b-lbloom-${frame}`}>
      <stop offset="0" stopColor="#C9D0FF" stopOpacity={0.55} />
      <stop offset="0.35" stopColor={PAL.halo} stopOpacity={0.22} />
      <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
    </radialGradient>
  );
  if (sM <= 0) return <g style={{mixBlendMode: 'screen'}}><defs>{bloomDef}</defs>{els}</g>;

  // the whole streamer as screen runs: the macro 3D part, then the micro continuation from T
  const runs = screenRuns(cam, STR.pts, sM);
  const sx = extS(t);
  let tipS: Pt = tip;
  if (sx > 0) {
    const ext: Pt[] = [];
    for (const q of EXT.pts) {
      if (q.s > sx) break;
      ext.push({x: tip.x + m * q.x, y: tip.y + m * q.y});
    }
    const tm = tipMicro(t);
    tipS = {x: tip.x + m * tm.x, y: tip.y + m * tm.y};
    ext.push(tipS);
    if (runs.length) runs[runs.length - 1].push(...ext.slice(1));
    else runs.push(ext);
  } else if (sM < STR.total - 1e-3) {
    const r = runs[runs.length - 1];
    tipS = r ? r[r.length - 1] : root;
  }
  // forks at the macro step points: they light with their step and die quickly; the white core goes first, so a dying
  // fork is a fading violet spark, never a grey hair
  const forkEls = STR.forks.map((f, i) => {
    const t0 = i === 0 ? 4.55 : 4.725;
    if (t < t0) return null;
    const a = (1 - ss(t, t0 + 0.05, t0 + 0.1)) * (0.6 + 0.4 * hash(frame, 61 + i));
    if (a <= 0.02) return null;
    const rr = screenRuns(cam, f, f[f.length - 1].s * grow(t, t0, 0.04));
    return {d: rr.map(pathD).join(' '), a, core: 1 - ss(t, t0 + 0.045, t0 + 0.075)};
  }).filter(Boolean) as {d: string; a: number; core: number}[];
  // stall sparks in the micro view: the tip feels for a path a short way and fails
  const stallEls: {d: string; a: number}[] = [];
  ATT.forEach((at, i) => {
    if (t < at.stall[0] || t > at.stall[1] + 0.12) return;
    const kn = EXT.knots[EXT.stallK[i]];
    const c = {x: tip.x + m * kn.x, y: tip.y + m * kn.y};
    for (let j = 0; j < 2; j++) {
      if (hash(frame * 5 + j, 71 + i) < 0.35) continue;
      const ang = 22 + (j ? 38 : -34) + 16 * (hash(i * 9 + j, 73) - 0.5);
      const len = m * (45 + 45 * hash(frame * 3 + j, 75 + i)) * (1 - 0.5 * ss(t, at.stall[1], at.stall[1] + 0.12));
      const r = (ang * Math.PI) / 180;
      const e = {x: c.x + Math.sin(r) * len, y: c.y - Math.cos(r) * len};
      stallEls.push({d: pathD(jag2(c, e, 300 + i * 31 + j * 7 + frame, 0.22, 3 * m)), a: 0.7});
    }
  });
  const body = runs.map(pathD).join(' ');
  const ang = 22;
  const microK = clamp((L - 1.6) / 1.4); // 0 in the wide, 1 once the molecular view is in
  const fall = 1100; // screen px: the stalled body cools away from the tip once we are close
  const gid = `b-lfall-${frame}`;
  const halo = Math.min(1.2, lt.body);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        {bloomDef}
        <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={fmt(tipS.x)} cy={fmt(tipS.y)} r={fall}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.18" stopColor="#FFFFFF" stopOpacity={1 - 0.2 * microK} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={1 - 0.82 * microK} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={1 - microK} />
        </radialGradient>
        <mask id={`${gid}-m`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${gid})`} />
        </mask>
        {/* keep the cooled body out of the caption band once we are in the molecular view */}
        <linearGradient id={`${gid}-cb`} gradientUnits="userSpaceOnUse" x1={0} y1={1440} x2={0} y2={1580}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={1 - 0.85 * microK} />
        </linearGradient>
        <mask id={`${gid}-cm`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${gid}-cb)`} />
        </mask>
        <radialGradient id={`${gid}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.5} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
      <g mask={`url(#${gid}-cm)`}>
      <g mask={`url(#${gid}-m)`}>
        <path d={body} fill="none" stroke={PAL.halo} strokeOpacity={0.16 * halo} strokeWidth={fmt(wc * 9)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={body} fill="none" stroke={PAL.mid} strokeOpacity={0.5 * Math.min(1, lt.body)} strokeWidth={fmt(wc * 3)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={body} fill="none" stroke={PAL.core} strokeOpacity={clamp(lt.body * 1.1)} strokeWidth={fmt(wc)} strokeLinecap="round" strokeLinejoin="round" />
        {forkEls.map((f, i) => (
          <g key={`f${i}`} opacity={f.a}>
            <path d={f.d} fill="none" stroke={PAL.halo} strokeOpacity={0.16} strokeWidth={fmt(wc * 6)} strokeLinecap="round" strokeLinejoin="round" />
            <path d={f.d} fill="none" stroke={PAL.mid} strokeOpacity={0.6} strokeWidth={fmt(wc * 1.8)} strokeLinecap="round" strokeLinejoin="round" />
            {f.core > 0.02 && <path d={f.d} fill="none" stroke={PAL.core} strokeOpacity={f.core} strokeWidth={fmt(wc * 0.55)} strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        ))}
      </g>
      </g>
      {stallEls.map((f, i) => (
        <g key={`s${i}`} opacity={f.a}>
          <path d={f.d} fill="none" stroke={PAL.mid} strokeOpacity={0.45} strokeWidth={fmt(wc * 1.6)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={f.d} fill="none" stroke={PAL.core} strokeWidth={fmt(wc * 0.5)} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* the tip: a glow that stays put while it stalls, and its sizzling corona */}
      <circle cx={fmt(tipS.x)} cy={fmt(tipS.y)} r={fmt(wc * 9)} fill={`url(#${gid}-tip)`} opacity={clamp(lt.tip)} />
      {lt.corona > 0.02 && (
        <path d={corona(tipS, ang, wc * 6, 41, frame, 7)} fill="none" stroke="#E6E0FF" strokeOpacity={lt.corona} strokeWidth={fmt(wc * 0.45)} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
};

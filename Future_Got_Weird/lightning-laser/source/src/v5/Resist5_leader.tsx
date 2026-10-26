// V5 shot B2: the leader that fights its way UP out of a summit through ordinary air toward the storm base, and
// stalls. It continues B's eye trace: on B2's first frame its stalled tip sits exactly where V3's molecular-view
// streamer tip was (screen (512, 932) on frame 189) and it heads the same way, up and to the right; only the scale
// changes (the molecules' air becomes the storm's). Drawn in B2's storm plane (screen units at the shot's base
// framing, y down). Deterministic: the geometry is built once from hash(); every brightness is a pure function of
// film time. Everything is keyed to the mix's two 'streamer attempt stalls' cues (6.35, 7.05) and their crackles:
//   cut      6.31: the channel already runs up from the summit; the tip strains (a push) but does not move yet
//   push 1   6.43-6.62: five jerky steps on the crackle bursts, each shorter than the last; side forks kick off
//   stall 1  6.62-7.05: the tip pushes again and again (a brush of streamers flares ahead of it and collapses back),
//            side probes shoot out and die back, the forks retract, the channel sags
//   push 2   7.06-7.42: six more steps, shorter still, one big fork that runs three steps and dies
//   stall 2  7.42 to the cut (7.81): it sputters, weaker each time, the channel fading, still well below the base
// Colour language: the discharge's white core with violet edges and glow (v3/palette.ts core / mid / halo).
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {sm, ss, ss5} from '../lib';
import {PAL} from '../v3/palette';
import {B5} from './timeline5';

export type Pt = {x: number; y: number};
const DEG = Math.PI / 180;
/** unit vector for an angle from straight up, positive toward screen-right */
const dirU = (a: number): Pt => ({x: Math.sin(a * DEG), y: -Math.cos(a * DEG)});
const spike = (t: number, t0: number, tau: number) => (t >= t0 ? Math.exp(-(t - t0) / tau) : 0);
/** a quick rise then an exponential fall (a push, a flare) */
const bump = (t: number, t0: number, rise: number, fall: number) => (t < t0 ? 0 : t < t0 + rise ? sm((t - t0) / rise) : Math.exp(-(t - t0 - rise) / fall));

// ------------------------------------------------------------------ camera
const T0 = B5.B2, T1 = B5.C;
/** one slow push, tilting up a little with the struggling tip (eased, never reversing): zoom and centre */
export const camB2 = (t: number) => {
  const k = ss5(t, T0 - 0.15, T1 + 0.3);
  return {z: 1 + 0.12 * k, x: 540 + 24 * k, y: 960 - 30 * k};
};
type Cam = ReturnType<typeof camB2>;
const lay = (c: Cam, p: number) => ({z: 1 + (c.z - 1) * p, x: 540 + (c.x - 540) * p, y: 960 + (c.y - 960) * p});
/** the transform of a layer at parallax p (1 = the leader's plane) */
export const layerXf = (c: Cam, p: number) => {
  const l = lay(c, p);
  return `translate(540 960) scale(${fmt(l.z)}) translate(${fmt(-l.x)} ${fmt(-l.y)})`;
};
export const toScreen = (c: Cam, p: number, q: Pt): Pt => {
  const l = lay(c, p);
  return {x: 540 + (q.x - l.x) * l.z, y: 960 + (q.y - l.y) * l.z};
};
export const fromScreen = (c: Cam, p: number, s: Pt): Pt => {
  const l = lay(c, p);
  return {x: l.x + (s.x - 540) / l.z, y: l.y + (s.y - 960) / l.z};
};

/** B's stalled streamer tip on screen in its last frame (189): B2's tip is there on its first frame (190) */
const B_TIP: Pt = {x: 512, y: 932};
export const TIP0 = fromScreen(camB2(Math.ceil(B5.B2 * 30) / 30), 1, B_TIP);
/** the overall heading (deg from straight up, toward screen-right): B's streamer direction */
export const HEAD = 22;

// ------------------------------------------------------------------ timing (sound-locked)
/** the steps already out at the cut, newest first (they are built backward from the tip down to the summit) */
const PRE_L = [44, 52, 58, 54, 60, 56, 62, 58, 64];
const PRE_T = [6.27, 6.2, 6.12, 6.04, 5.95, 5.86, 5.76, 5.65, 5.52];
/** main steps after the cut, on the crackle bursts of the two attempts: each shorter than the last (the air holds it) */
const MAIN: [number, number][] = [
  [6.43, 44], [6.482, 38], [6.515, 30], [6.565, 24], [6.615, 16], // attempt on 6.35
  [7.063, 36], [7.096, 29], [7.146, 23], [7.213, 18], [7.329, 13], [7.412, 9], // attempt on 7.05
];
/** pushes: the tip strains toward the base, a brush of streamers flaring ahead of it and collapsing back [time, force] */
const PUSH: [number, number][] = [[6.345, 1], [6.69, 0.9], [6.79, 0.7], [6.92, 0.5], [7.255, 0.75], [7.455, 0.85], [7.575, 0.65], [7.69, 0.45]];
/** failed probes off the tip: they shoot out sideways and die back at once [time, force] */
const PROBES: [number, number][] = [[6.395, 0.8], [6.648, 1], [6.715, 0.85], [6.855, 0.65], [6.99, 0.4], [7.362, 1], [7.428, 0.9], [7.52, 0.7], [7.62, 0.55], [7.735, 0.4]];
const PUSH_T = PUSH.map((p) => p[0]);

// ------------------------------------------------------------------ geometry
type Step = {pts: Pt[]; t: number; a: Pt; b: Pt};
type Branch = {steps: Step[]; w: number; key: number; die?: number; dim?: number};
/** a jagged step from a to b: 2-3 kinks off the straight line (a leader is crooked at every scale) */
const jag = (a: Pt, b: Pt, seed: number, amp = 0.22): Pt[] => {
  const n = 2 + Math.floor(hash(seed, 3) * 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const out: Pt[] = [a];
  for (let i = 1; i <= n; i++) {
    const u = (i - 0.25 + 0.5 * hash(seed, 10 + i)) / (n + 1);
    const o = (hash(seed, 20 + i) - 0.5) * 2 * amp * L;
    out.push({x: a.x + dx * u + nx * o, y: a.y + dy * u + ny * o});
  }
  out.push(b);
  return out;
};
/** a run of steps from p0 at the given times/lengths, the direction wandering about `head` */
const walk = (p0: Pt, a0: number, head: number, sched: [number, number][], seed: number, turn = 58, pull = 0.42) => {
  const steps: Step[] = [];
  let p = p0, a = a0;
  sched.forEach(([t, L], i) => {
    a = a + (hash(seed, 100 + i) - 0.5) * turn;
    a = a + (head - a) * pull;
    const d = dirU(a);
    const q = {x: p.x + d.x * L, y: p.y + d.y * L};
    steps.push({pts: jag(p, q, seed * 31 + i), t, a: p, b: q});
    p = q;
  });
  return {steps, end: p, ang: a};
};
const stepAng = (s: Step) => Math.atan2(s.b.x - s.a.x, -(s.b.y - s.a.y)) / DEG;

const LEADER = (() => {
  // the channel already out at the cut, walked backward from the tip down to the summit, then turned round
  const back = walk(TIP0, HEAD + 180 - 6, HEAD + 180, PRE_L.map((L) => [0, L] as [number, number]), 5, 54, 0.45);
  const pre: Step[] = back.steps.map((s, i) => ({pts: [...s.pts].reverse(), t: PRE_T[i], a: s.b, b: s.a})).reverse();
  const main = walk(TIP0, stepAng(pre[pre.length - 1]), HEAD, MAIN, 7, 64, 0.38);
  const all = [...pre, ...main.steps];
  const branches: Branch[] = [];
  // old forks low on the channel: they died long before the cut (faint stubs)
  ([[1, -1, 44, 0, [36, 26, 18]], [4, 1, 40, 0, [30, 22]], [6, -1, 38, 0, [26, 18]]] as [number, number, number, number, number[]][]).forEach(([k, side, spread, , Ls], j) => {
    const st = pre[k];
    const a0 = stepAng(st) + side * spread;
    const w = walk(st.b, a0, a0 - side * 6, Ls.map((L, i) => [st.t + 0.04 * i, L] as [number, number]), 70 + j * 7, 44, 0.3);
    branches.push({steps: w.steps, w: 0.5, key: 40 + j, dim: 0.3});
  });
  // live forks: [main step it leaves from, side (+1 right / -1 left), spread (deg), its steps as [delay, length], dies at]
  const forks: [number, number, number, [number, number][], number][] = [
    [1, -1, 42, [[0.0, 34], [0.035, 28], [0.085, 20]], 6.66],
    [3, 1, 46, [[0.0, 26], [0.05, 18]], 6.72],
    [5, -1, 40, [[0.01, 30], [0.05, 22]], 7.2],
    [7, 1, 38, [[0.0, 36], [0.067, 30], [0.116, 24], [0.183, 16]], 7.42],
    [9, -1, 44, [[0.0, 22], [0.033, 16]], 7.5],
  ];
  forks.forEach(([k, side, spread, sch, die], j) => {
    const st = main.steps[k];
    const a0 = stepAng(st) + side * spread;
    const w = walk(st.b, a0, a0 + side * 6, sch.map(([dt, L]) => [st.t + dt, L] as [number, number]), 50 + j * 13, 50, 0.3);
    branches.push({steps: w.steps, w: 0.62, key: j + 1, die});
    // the big one forks once more (a fine twig)
    if (j === 3) {
      const s2 = w.steps[1];
      const w2 = walk(s2.b, a0 - side * 34, a0 - side * 28, [[s2.t + 0.01, 22], [s2.t + 0.07, 15]], 90 + j, 40, 0.3);
      branches.push({steps: w2.steps, w: 0.42, key: 20 + j, die});
    }
  });
  return {main: all, branches};
})();
/** the summit the leader climbs out of (the bottom of the channel) */
export const SUMMIT: Pt = LEADER.main[0].a;

// ------------------------------------------------------------------ state at time t
/** the main tip (the end of the last step out) */
export const mainTip = (t: number): Pt => {
  let p = SUMMIT;
  for (const s of LEADER.main) if (t >= s.t) p = s.b;
  return p;
};
/** where the tip ends up (the deck's lowering hangs over it, out of its reach) */
export const TIP_END = mainTip(99);
const lastStep = (t: number) => LEADER.main.filter((s) => t >= s.t).slice(-1)[0];
const STEP_T = MAIN.map((m) => m[0]);
/** the leader's light: flash (fresh steps), recent, probe, push (the tip straining), body (channel brightness) */
export const leaderLight5 = (t: number) => {
  const flash = STEP_T.reduce((a, s) => a + spike(t, s, 0.05), 0);
  const recent = STEP_T.reduce((a, s) => Math.max(a, spike(t, s, 0.3)), 0);
  const probe = PROBES.reduce((a, [p, f]) => a + f * bump(t, p, 0.03, 0.05), 0);
  const push = PUSH.reduce((a, [p, f]) => a + f * bump(t, p, 0.06, 0.09), 0);
  // the channel is never steady while it hangs there
  const flick = 0.07 * noise1(t * 22, 5) + 0.05 * noise1(t * 41, 9);
  // in each stall it sags (the second stall the deeper: it is fading by the cut)
  const sag = 0.12 * ss(t, 6.66, 7.0) * (1 - ss(t, 7.04, 7.07)) + 0.24 * ss(t, 7.45, 7.85);
  const body = clamp(0.42 + 0.4 * recent + 0.7 * flash + 0.18 * probe + 0.16 * push + flick - sag, 0.12, 1.8);
  return {flash: clamp(flash, 0, 1.6), body, recent, probe: clamp(probe, 0, 1.3), push: clamp(push, 0, 1.2)};
};

// ------------------------------------------------------------------ drawing
const pathD = (pts: Pt[]) => (pts.length > 1 ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
/** the first fraction f (by length) of a polyline */
const cutPts = (pts: Pt[], f: number): Pt[] => {
  if (f >= 0.999 || pts.length < 2) return pts;
  if (f <= 0.001) return [];
  const seg = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  let left = f * seg.reduce((a, b) => a + b, 0);
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
      continue;
    }
    const u = left / (seg[i] || 1);
    out.push({x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u});
    break;
  }
  return out;
};
/** a branch's visible polyline at t (whole steps: a step is either out or not) */
const branchPts = (b: Branch, t: number) => {
  const out: Pt[] = [];
  for (const s of b.steps) {
    if (t < s.t) break;
    out.push(...(out.length ? s.pts.slice(1) : s.pts));
  }
  return out;
};
/** a failed probe: a short crooked spark off the tip, a new direction each time (off to the side, never through) */
const probePts = (tip: Pt, ang: number, k: number) => {
  const side = hash(k, 71) < 0.5 ? -1 : 1;
  const a = ang + side * (38 + 46 * hash(k, 73));
  const L = 26 + 30 * hash(k, 75);
  const d = dirU(a);
  const b = {x: tip.x + d.x * L, y: tip.y + d.y * L};
  const p1 = jag(tip, b, 400 + k * 7, 0.3);
  // a little kink off its end, back toward the head (it tries to turn up, and fails)
  const d2 = dirU(a - side * 40);
  return [...p1, {x: b.x + d2.x * L * 0.45, y: b.y + d2.y * L * 0.45}];
};

/** the three-stroke discharge look (violet halo, pale-violet edge, white core); widths in screen px */
const Strokes: React.FC<{d: string; w: number; k: number}> = ({d, w, k}) => (
  <g>
    <path d={d} fill="none" stroke={PAL.halo} strokeOpacity={fmt(clamp(0.2 * k, 0, 0.42))} strokeWidth={fmt(36 * w)} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={fmt(clamp(0.5 * k, 0, 0.85))} strokeWidth={fmt(12 * w)} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={PAL.core} strokeOpacity={fmt(clamp(0.35 + 0.55 * k, 0, 1))} strokeWidth={fmt((3 + 2 * clamp(k, 0, 1.4)) * w)} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const LeaderB5: React.FC<{t: number; tag: string}> = ({t, tag}) => {
  const lt = leaderLight5(t);
  const tip = mainTip(t);
  const ang = stepAng(lastStep(t));
  const els: React.ReactNode[] = [];
  // the main channel: one path, cooler toward the summit (older), hottest at the fresh end
  const mainPts = branchPts({steps: LEADER.main, w: 1, key: 0}, t);
  const k = lt.body;
  const gr = (id: string, c: string, a0: number, a1: number) => (
    <linearGradient id={`${tag}-${id}`} gradientUnits="userSpaceOnUse" x1={fmt(SUMMIT.x)} y1={fmt(SUMMIT.y)} x2={fmt(tip.x)} y2={fmt(tip.y)}>
      <stop offset="0" stopColor={c} stopOpacity={fmt(clamp(a0))} />
      <stop offset="0.55" stopColor={c} stopOpacity={fmt(clamp((a0 + a1) / 2))} />
      <stop offset="1" stopColor={c} stopOpacity={fmt(clamp(a1))} />
    </linearGradient>
  );
  const md = pathD(mainPts);
  // the other branches (old stubs, live forks; a dying fork fades and dies back toward the channel)
  LEADER.branches.forEach((b) => {
    let pts = branchPts(b, t);
    if (pts.length < 2) return;
    let kb = k * (b.dim ?? 1);
    if (b.die !== undefined) {
      const r = 1 - ss(t, b.die, b.die + 0.24);
      if (r <= 0.01) return;
      pts = cutPts(pts, 0.15 + 0.85 * r);
      kb *= 0.35 + 0.65 * r;
    }
    els.push(<Strokes key={`b${b.key}`} d={pathD(pts)} w={b.w} k={kb} />);
  });
  // the fresh steps flash hot on their own (main and forks)
  [{steps: LEADER.main, w: 1, key: 0} as Branch, ...LEADER.branches.filter((b) => b.die !== undefined)].forEach((b) =>
    b.steps.forEach((s, i) => {
      const f = spike(t, s.t, 0.055);
      if (f < 0.03) return;
      els.push(
        <g key={`f${b.key}-${i}`}>
          <path d={pathD(s.pts)} fill="none" stroke={PAL.mid} strokeOpacity={fmt(0.7 * f)} strokeWidth={fmt(20 * b.w)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD(s.pts)} fill="none" stroke="#FFFFFF" strokeOpacity={fmt(clamp(f))} strokeWidth={fmt(7 * b.w)} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
    }),
  );
  // probes off the tip: out in two frames, a frame's flicker, then back into the tip
  PROBES.forEach(([p, force], j) => {
    if (t < p || t > p + 0.22) return;
    const grow = ss(t, p, p + 0.045), back = 1 - ss(t, p + 0.075, p + 0.2);
    const f = grow * back;
    if (f < 0.03) return;
    const pp = probePts(mainTip(p), stepAng(lastStep(p)), j);
    const d = pathD(cutPts(pp, f));
    const a = clamp(force * (0.55 + 0.45 * back));
    els.push(
      <g key={`p${j}`} opacity={fmt(a)}>
        <path d={d} fill="none" stroke={PAL.halo} strokeOpacity={0.35} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={0.75} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  });
  // the push: a brush of faint streamers flares out ahead of the tip toward the base, and collapses back into it
  const pk = lt.push;
  const brush: React.ReactNode[] = [];
  if (pk > 0.04) {
    // which push is this (a new fan each time)
    const pi = PUSH_T.reduce((a, p, i) => (t >= p ? i : a), 0);
    for (let i = 0; i < 7; i++) {
      const s = 100 + pi * 17 + i;
      const a = ang + (i - 3) * 12 + 8 * (hash(s, 81) - 0.5);
      const L = (36 + 40 * hash(s, 83)) * clamp(pk);
      const d1 = dirU(a), d2 = dirU(a + 18 * (hash(s, 85) - 0.5));
      const m = {x: tip.x + d1.x * L * 0.5, y: tip.y + d1.y * L * 0.5};
      const e = {x: m.x + d2.x * L * 0.5, y: m.y + d2.y * L * 0.5};
      brush.push(<path key={i} d={`M${fmt(tip.x)},${fmt(tip.y)} L${fmt(m.x)},${fmt(m.y)} L${fmt(e.x)},${fmt(e.y)}`} fill="none" stroke={i % 2 ? PAL.mid : '#E4E8FF'} strokeOpacity={fmt(clamp(0.55 * pk * (0.6 + 0.4 * hash(s, 87))))} strokeWidth={fmt(1.8 + 1.4 * hash(s, 89))} strokeLinecap="round" strokeLinejoin="round" />);
    }
  }
  // the tip: a hot point with a flickering corona; flares on each step, probe and push (stretched ahead on a push).
  // At the cut it is still glowing as B's stalled tip was (the eye lands on the same hot point)
  const held = 1 - ss(t, T0, T0 + 0.16);
  const tipK = clamp(0.42 + 0.45 * held + 0.6 * lt.flash + 0.45 * lt.probe + 0.5 * pk + 0.14 * noise1(t * 30, 3) - 0.25 * ss(t, 7.5, 7.85), 0, 1.6);
  const rT = 24 + 12 * held + 22 * clamp(lt.flash) + 10 * clamp(lt.probe) + 14 * clamp(pk);
  const fwd = dirU(ang);
  const tc = {x: tip.x + fwd.x * 10 * pk, y: tip.y + fwd.y * 10 * pk};
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        {gr('gh', PAL.halo, Math.min(0.42, 0.13 * k), Math.min(0.42, 0.22 * k))}
        {gr('gm', PAL.mid, Math.min(0.85, 0.3 * k), Math.min(0.85, 0.52 * k))}
        {gr('gc', PAL.core, 0.3 + 0.3 * k, 0.35 + 0.55 * k)}
        <radialGradient id={`${tag}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.22" stopColor="#DCE2FF" stopOpacity={0.6} />
          <stop offset="0.6" stopColor={PAL.halo} stopOpacity={0.18} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${tag}-air`}>
          <stop offset="0" stopColor={PAL.mid} stopOpacity={0.32} />
          <stop offset="0.45" stopColor={PAL.halo} stopOpacity={0.12} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the air round the fresh end glows briefly on each step and strain */}
      <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(150 + 60 * clamp(lt.flash) + 30 * clamp(pk))} fill={`url(#${tag}-air)`} opacity={fmt(clamp(0.3 + 0.35 * held + 0.8 * lt.flash + 0.3 * lt.probe + 0.4 * pk, 0, 1))} />
      {md && (
        <g>
          <path d={md} fill="none" stroke={`url(#${tag}-gh)`} strokeWidth={36} strokeLinecap="round" strokeLinejoin="round" />
          <path d={md} fill="none" stroke={`url(#${tag}-gm)`} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          <path d={md} fill="none" stroke={`url(#${tag}-gc)`} strokeWidth={fmt(3 + 2 * clamp(k, 0, 1.4))} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {els}
      {brush}
      <ellipse cx={fmt(tc.x)} cy={fmt(tc.y)} rx={fmt(rT)} ry={fmt(rT * (1 + 0.5 * clamp(pk)))} transform={`rotate(${fmt(ang)} ${fmt(tc.x)} ${fmt(tc.y)})`} fill={`url(#${tag}-tip)`} opacity={fmt(clamp(tipK))} />
    </g>
  );
};

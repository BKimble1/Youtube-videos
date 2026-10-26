// V5 shot B2: the stepped leader that fights its way down out of the storm base through ordinary air, and stalls.
// Drawn in B2's storm plane (screen units at the shot's base framing, y down). Deterministic: the geometry is built
// once from hash(); every brightness is a pure function of film time.
//   pre      three steps already out of the base at the cut (6.31): the leader is already fighting
//   burst 1  the attempt on 6.35: four quick steps, each shorter and later than the one before, branches kick off
//   stall 1  6.52-7.05: the tip sputters (short probes that fail and vanish), the channel dims and flickers
//   burst 2  the attempt on 7.05: four more steps, a new fork; then
//   stall 2  7.22 to the cut (7.81): it stops again, sputtering, still far above the ridges
// Colour language: the discharge's white core with violet edges and glow (v3/palette.ts core / mid / halo).
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {PAL} from '../v3/palette';

export type Pt = {x: number; y: number};
const DEG = Math.PI / 180;
/** unit vector for an angle from straight down, positive toward screen-left */
const dirD = (a: number): Pt => ({x: -Math.sin(a * DEG), y: Math.cos(a * DEG)});
const spike = (t: number, t0: number, tau: number) => (t >= t0 ? Math.exp(-(t - t0) / tau) : 0);

/** where the leader leaves the base of the cell (inside the lowering) */
export const ORIGIN: Pt = {x: 664, y: 676};
/** the overall heading (deg from straight down, toward screen-left): the same diagonal as V3's B streamer, reversed */
const HEAD = 25;

// ------------------------------------------------------------------ timing
/** main-channel step times and lengths. Within each attempt the steps come later and shorter: the air holds it back */
const MAIN: [number, number][] = [
  [6.1, 60], [6.19, 56], [6.27, 58], // already out at the cut
  [6.355, 64], [6.405, 55], [6.465, 45], [6.53, 34], // attempt on 6.35
  [7.055, 56], [7.105, 46], [7.165, 36], [7.235, 27], // attempt on 7.05
];
/** failed probes from the stalled tip (short sparks that die at once) */
const PROBES = [6.6, 6.68, 6.79, 6.9, 6.99, 7.31, 7.4, 7.52, 7.63, 7.74];
export const STALLS: [number, number][] = [[6.53, 7.055], [7.235, 7.9]];

// ------------------------------------------------------------------ geometry
type Step = {pts: Pt[]; t: number; a: Pt; b: Pt};
type Branch = {steps: Step[]; w: number; key: number};
/** a jagged step from a to b: 2-3 kinks off the straight line (a stepped leader is crooked at every scale) */
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
/** a run of steps from p at the given times/lengths, the direction wandering about `head` */
const walk = (p0: Pt, a0: number, head: number, sched: [number, number][], seed: number, turn = 58, pull = 0.42) => {
  const steps: Step[] = [];
  let p = p0, a = a0;
  sched.forEach(([t, L], i) => {
    a = a + (hash(seed, 100 + i) - 0.5) * turn;
    a = a + (head - a) * pull;
    const d = dirD(a);
    const q = {x: p.x + d.x * L, y: p.y + d.y * L};
    steps.push({pts: jag(p, q, seed * 31 + i), t, a: p, b: q});
    p = q;
  });
  return {steps, end: p, ang: a};
};

const LEADER = (() => {
  const main = walk(ORIGIN, HEAD + 6, HEAD, MAIN, 7, 62, 0.4);
  const branches: Branch[] = [{steps: main.steps, w: 1, key: 0}];
  // forks: [main step it leaves from, side (+1 left / -1 right), spread (deg), its steps as [delay after the fork, length]]
  const forks: [number, number, number, [number, number][]][] = [
    [1, -1, 40, [[0.0, 40], [0.08, 34], [0.17, 28], [0.34, 22]]],
    [3, 1, 44, [[0.01, 44], [0.06, 36], [0.12, 30], [0.2, 20]]],
    [5, -1, 38, [[0.0, 38], [0.065, 30], [0.6, 26], [0.66, 18]]],
    [7, 1, 36, [[0.0, 46], [0.05, 40], [0.11, 30], [0.18, 22]]],
    [8, -1, 46, [[0.005, 36], [0.06, 28], [0.13, 20]]],
    [9, 1, 30, [[0.0, 30], [0.07, 22]]],
  ];
  forks.forEach(([k, side, spread, sch], j) => {
    const st = main.steps[k];
    const base = st.b;
    const d0 = Math.atan2(-(st.b.x - st.a.x), st.b.y - st.a.y) / DEG; // the step's own angle (from down, + left)
    const a0 = d0 + side * spread;
    const w = walk(base, a0, a0 + side * 8, sch.map(([dt, L]) => [st.t + dt, L] as [number, number]), 50 + j * 13, 50, 0.3);
    branches.push({steps: w.steps, w: 0.62, key: j + 1});
    // a few forks fork once more (fine twigs)
    if (j === 1 || j === 3) {
      const s2 = w.steps[1];
      const w2 = walk(s2.b, a0 - side * 36, a0 - side * 30, [[s2.t + 0.01, 24], [s2.t + 0.07, 17]], 90 + j, 40, 0.3);
      branches.push({steps: w2.steps, w: 0.42, key: 20 + j});
    }
  });
  return {main: main.steps, branches};
})();

// ------------------------------------------------------------------ state at time t
/** the main tip (the last step out), and how far it has come */
export const mainTip = (t: number): Pt => {
  let p = ORIGIN;
  for (const s of LEADER.main) if (t >= s.t) p = s.b;
  return p;
};
const STEP_T = MAIN.map((m) => m[0]);
/** the leader's light: flash (sum of fresh step flashes), body (channel brightness), tip (corona), probe */
export const leaderLight5 = (t: number) => {
  const flash = STEP_T.reduce((a, s) => a + spike(t, s, 0.05), 0);
  const recent = STEP_T.reduce((a, s) => Math.max(a, spike(t, s, 0.32)), 0);
  const probe = PROBES.reduce((a, p) => a + spike(t, p, 0.035), 0);
  // the channel is never steady: a faint flicker while it hangs there
  const flick = 0.06 * noise1(t * 22, 5) + 0.04 * noise1(t * 41, 9);
  // later in each stall it sags further (the second stall is the deeper one)
  const sag = 0.1 * ss(t, 6.6, 7.0) * (1 - ss(t, 7.04, 7.06)) + 0.14 * ss(t, 7.3, 7.8);
  const body = clamp(0.36 + 0.42 * recent + 0.75 * flash + 0.2 * probe + flick - sag, 0.1, 1.8);
  return {flash: clamp(flash, 0, 1.6), body, recent, probe: clamp(probe, 0, 1.3)};
};

// ------------------------------------------------------------------ drawing
const pathD = (pts: Pt[]) => (pts.length > 1 ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
/** a branch's visible polyline at t (whole steps only: a step is either out or not, as in a real stepped leader) */
const branchPts = (b: Branch, t: number) => {
  const out: Pt[] = [];
  for (const s of b.steps) {
    if (t < s.t) break;
    out.push(...(out.length ? s.pts.slice(1) : s.pts));
  }
  return out;
};
/** a failed probe: a short crooked spark off the stalled tip, a new direction each time */
const probeD = (tip: Pt, k: number) => {
  const out: string[] = [];
  const n = 1 + (hash(k, 71) < 0.55 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const a = HEAD + (hash(k * 5 + i, 73) - 0.5) * 150;
    const L = 22 + 22 * hash(k * 5 + i, 75);
    const d = dirD(a);
    out.push(pathD(jag(tip, {x: tip.x + d.x * L, y: tip.y + d.y * L}, 400 + k * 7 + i, 0.3)));
  }
  return out.join(' ');
};

/** the three-stroke discharge look (violet halo, pale-violet edge, white core); widths in screen px */
const Strokes: React.FC<{d: string; w: number; k: number}> = ({d, w, k}) => (
  <g>
    <path d={d} fill="none" stroke={PAL.halo} strokeOpacity={fmt(clamp(0.2 * k, 0, 0.42))} strokeWidth={fmt(38 * w)} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={fmt(clamp(0.5 * k, 0, 0.85))} strokeWidth={fmt(13 * w)} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={PAL.core} strokeOpacity={fmt(clamp(0.35 + 0.55 * k, 0, 1))} strokeWidth={fmt((3 + 2 * clamp(k, 0, 1.4)) * w)} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const LeaderB5: React.FC<{t: number; tag: string}> = ({t, tag}) => {
  const lt = leaderLight5(t);
  const tip = mainTip(t);
  // the base of the channel (inside the cloud) is dimmer than the fresh end; older steps cool a little
  const els: React.ReactNode[] = [];
  LEADER.branches.forEach((b) => {
    const pts = branchPts(b, t);
    if (pts.length < 2) return;
    // a branch that has stopped stepping fades (most forks die; the main channel stays)
    const lastT = b.steps.filter((s) => t >= s.t).slice(-1)[0].t;
    const die = b.key === 0 ? 1 : 1 - 0.55 * ss(t, lastT + 0.15, lastT + 0.6);
    els.push(<Strokes key={`b${b.key}`} d={pathD(pts)} w={b.w} k={lt.body * die} />);
    // the fresh steps flash hot on their own
    b.steps.forEach((s, i) => {
      const f = spike(t, s.t, 0.055);
      if (f < 0.03) return;
      els.push(
        <g key={`f${b.key}-${i}`}>
          <path d={pathD(s.pts)} fill="none" stroke={PAL.mid} strokeOpacity={fmt(0.7 * f)} strokeWidth={fmt(20 * b.w)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD(s.pts)} fill="none" stroke="#FFFFFF" strokeOpacity={fmt(clamp(f))} strokeWidth={fmt(7 * b.w)} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
    });
  });
  // probes off the stalled tip
  PROBES.forEach((p, k) => {
    const a = spike(t, p, 0.04);
    if (t < p || a < 0.05) return;
    const d = probeD(tip, k);
    els.push(
      <g key={`p${k}`} opacity={fmt(a)}>
        <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={0.7} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  });
  // the tip: a hot point with a flickering corona; flares on each step and probe
  const tipK = clamp(0.45 + 0.6 * lt.flash + 0.5 * lt.probe + 0.12 * noise1(t * 30, 3), 0, 1.6);
  const rT = 26 + 22 * clamp(lt.flash) + 10 * clamp(lt.probe);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
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
      {/* the air round the fresh end glows briefly on each step */}
      <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(150 + 60 * clamp(lt.flash))} fill={`url(#${tag}-air)`} opacity={fmt(clamp(0.35 + 0.8 * lt.flash + 0.3 * lt.probe, 0, 1))} />
      {els}
      <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(rT)} fill={`url(#${tag}-tip)`} opacity={fmt(clamp(tipK))} />
    </g>
  );
};

// V2 world B: the same scaffold disc and network seen close up (matched from the robot's dome), then one spike
// followed in one continuous move: along hyphae into the electrode, down its lead into the controller, out to the
// valve, and into the air line that inflates the leg. No labels or text.
import React from 'react';
import {clamp, ss, ss5, lerp, noise1} from '../lib';
import {W, H} from './cam';
import {C, INK} from '../palette';
import {poly, fmt, Pt} from '../g2';
import {NET, ELECTRODES, pulses, routeSlice, electrodeFlash} from './mycelium';
import {DISC_R} from './robot';
import {T, SEG} from './timing';
import {discAffine} from './RobotWorld';

type M = [number, number, number, number, number, number];
const apply = (m: M, p: Pt): [number, number] => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const fromCam = (cx: number, cy: number, s: number, rot: number, mir: number): M => {
  const co = Math.cos(rot) * s, si = Math.sin(rot) * s;
  const a = co * mir, b = si * mir, c2 = -si, d = co;
  return [a, b, c2, d, W / 2 - (a * cx + c2 * cy), H / 2 - (b * cx + d * cy)];
};
const A0 = discAffine(SEG.matchA1);
const MIR = Math.sign(A0.ex[0] * A0.ez[1] - A0.ex[1] * A0.ez[0]) || 1;
const ROT0 = -Math.atan2(A0.ez[0], A0.ez[1]);
const S0 = Math.hypot(A0.ez[0], A0.ez[1]);
const MA: M = [A0.ex[0], A0.ex[1], A0.ez[0], A0.ez[1], A0.o[0], A0.o[1]];
const inv = (m: M, p: [number, number]): [number, number] => {
  const det = m[0] * m[3] - m[2] * m[1], x = p[0] - m[4], y = p[1] - m[5];
  return [(m[3] * x - m[2] * y) / det, (-m[1] * x + m[0] * y) / det];
};
const C0 = inv(MA, [W / 2, H / 2]);

const E0 = ELECTRODES[0], E1 = ELECTRODES[1];
const XC = E0[0];
const Y = {chip: 2.95, valve: 4.55};
// the followed pulse: electrode (T.fired) -> controller -> valve, then air down the line
const P0 = T.fired, PC = T.fired + 0.6, PV = T.fired + 1.1;
export const pulseY = (t: number) =>
  t < PC ? lerp(E0[1], Y.chip, ss5(P0, PC, t) * 0.4 + clamp((t - P0) / (PC - P0)) * 0.6)
    : lerp(Y.chip, Y.valve, ss5(PC, PV, t) * 0.4 + clamp((t - PC) / (PV - PC)) * 0.6);

type BK = {t: number; cx: number; cy: number; s: number; rot: number};
const KEYS: BK[] = [
  {t: SEG.matchA1, cx: C0[0], cy: C0[1], s: S0, rot: ROT0},
  {t: 4.4, cx: 0.05, cy: 0.1, s: 900, rot: ROT0 * 0.4}, // close on the threads: pulses running along them
  {t: 5.75, cx: 0.0, cy: 0.15, s: 440, rot: 0}, // both electrodes, and their leads leaving the scaffold
  {t: 7.4, cx: E0[0] - 0.1, cy: E0[1] - 0.15, s: 700, rot: 0}, // the electrode the next pulse reaches
  {t: T.fired, cx: E0[0] - 0.06, cy: E0[1] - 0.1, s: 760, rot: 0}, // a slow drift in while it arrives
];
const camB = (t: number): M => {
  if (t <= SEG.matchA1) { const a = discAffine(t); return [a.ex[0], a.ex[1], a.ez[0], a.ez[1], a.o[0], a.o[1]]; }
  if (t >= T.fired) {
    const last = KEYS[KEYS.length - 1];
    const k = ss(T.fired, T.fired + 0.45, t);
    const s = lerp(last.s, 330, ss(T.fired, T.fired + 0.55, t));
    const cy = lerp(last.cy, pulseY(t) + 0.55, k) + (t > PV ? (t - PV) * 3.0 : 0);
    return fromCam(lerp(last.cx, XC + 0.1, k), cy, s, 0, MIR);
  }
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const u = ss5(a.t, b.t, t);
  const mb = fromCam(lerp(a.cx, b.cx, u), lerp(a.cy, b.cy, u), a.s * Math.pow(b.s / a.s, u), lerp(a.rot, b.rot, u), MIR);
  if (i === 0) { const k = ss(SEG.matchA1, SEG.matchA1 + 0.35, t); return MA.map((v, j) => lerp(v, mb[j], k)) as M; }
  return mb;
};

const Hyphae: React.FC<{m: M; t: number; s: number}> = ({m, t, s}) => {
  let c0 = '', c1 = '', c2 = '';
  for (const h of NET) {
    const pts = h.pts.map((p) => apply(m, p));
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    if (x1 < -60 || x0 > W + 60 || y1 < -60 || y0 > H + 60) continue;
    const d = poly(pts, false);
    if (h.tier === 0) c0 += d; else if (h.tier === 1) c1 += d; else c2 += d;
  }
  const k = s / 800;
  const w0 = clamp(4.6 * k, 1.6, 8), w1 = clamp(2.6 * k, 1.0, 4.6), w2 = clamp(1.4 * k, 0.7, 2.6);
  const comets = pulses(t).map((q, i) => {
    const d = poly(routeSlice(q.r, q.head - q.tail, q.head).map((p) => apply(m, p)), false);
    const hd = apply(m, routeSlice(q.r, q.head - 0.001, q.head).slice(-1)[0]);
    return <g key={i} opacity={q.k}>
      <path d={d} stroke={C.spike} strokeWidth={Math.min(w0 * 5, 24)} fill="none" strokeLinecap="round" filter="url(#bglow)" />
      <path d={d} stroke={C.spike} strokeWidth={Math.min(w0 * 1.9, 9)} fill="none" strokeLinecap="round" />
      <path d={d} stroke={C.spikeCore} strokeWidth={Math.min(w0 * 0.9, 4)} fill="none" strokeLinecap="round" />
      <circle cx={hd[0]} cy={hd[1]} r={Math.min(w0 * 2.6, 13)} fill={C.spikeCore} />
    </g>;
  });
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <g transform={`translate(${fmt(1.2 * k)} ${fmt(1.6 * k)})`} stroke="#0B1116" opacity={0.5}>
        <path d={c2} strokeWidth={w2 * 1.6} /><path d={c1} strokeWidth={w1 * 1.5} /><path d={c0} strokeWidth={w0 * 1.4} />
      </g>
      <path d={c2} stroke={C.hypha} strokeWidth={w2} opacity={0.75} />
      <path d={c1} stroke={C.hyphaShade} strokeWidth={w1 * 1.35} /><path d={c1} stroke={C.hypha} strokeWidth={w1} />
      <path d={c0} stroke={C.hyphaShade} strokeWidth={w0 * 1.35} /><path d={c0} stroke={C.cord} strokeWidth={w0} />
      <path d={c0} stroke="#FFFFFF" strokeWidth={w0 * 0.4} strokeDasharray={`${fmt(3 * k + 1)} ${fmt(24 * k + 6)}`} strokeDashoffset={fmt(-t * 50 * k)} opacity={0.7} />
      {comets}
    </g>
  );
};

const Scaffold: React.FC<{m: M; s: number}> = ({m, s}) => {
  const out: string[] = [];
  const a = 0.16, rows = Math.ceil((DISC_R * 2) / (a * 1.5));
  for (let r = -rows / 2; r <= rows / 2; r++) for (let q = -rows / 2; q <= rows / 2; q++) {
    const cx = q * a * Math.sqrt(3) + (r % 2 ? (a * Math.sqrt(3)) / 2 : 0), cy = r * a * 1.5;
    if (Math.hypot(cx, cy) > DISC_R - a) continue;
    const sc = apply(m, [cx, cy]);
    if (sc[0] < -80 || sc[0] > W + 80 || sc[1] < -80 || sc[1] > H + 80) continue;
    const ps: Pt[] = [];
    for (let k = 0; k < 6; k++) { const an = (k / 6) * 2 * Math.PI + Math.PI / 6; ps.push(apply(m, [cx + a * 0.92 * Math.cos(an), cy + a * 0.92 * Math.sin(an)])); }
    out.push(poly(ps));
  }
  const disc: Pt[] = Array.from({length: 96}, (_, k) => apply(m, [DISC_R * Math.cos((k / 96) * 2 * Math.PI), DISC_R * Math.sin((k / 96) * 2 * Math.PI)]));
  return <g>
    <path d={poly(disc)} fill="#2A3036" />
    <path d={out.join('')} fill="none" stroke={C.scaffoldLine} strokeWidth={clamp(s * 0.003, 0.7, 3)} opacity={0.32} />
    <path d={poly(disc)} fill="none" stroke={INK} strokeWidth={clamp(s * 0.02, 2, 8)} />
  </g>;
};

const Electrode: React.FC<{m: M; p: [number, number]; s: number; flash: number}> = ({m, p, s, flash}) => {
  const c = apply(m, p), r = 0.085 * s;
  return <g>
    <circle cx={c[0]} cy={c[1]} r={r * 1.35} fill={C.goldDark} />
    <circle cx={c[0]} cy={c[1]} r={r} fill={C.gold} stroke={INK} strokeWidth={2} />
    <circle cx={c[0] - r * 0.3} cy={c[1] - r * 0.3} r={r * 0.35} fill={C.goldLight} />
    {flash > 0.02 && <circle cx={c[0]} cy={c[1]} r={Math.min(r * (1.6 + 2.5 * flash), r + 70)} fill={C.spike} opacity={clamp(flash)} filter="url(#bglow)" />}
  </g>;
};

/** the controller and valve beneath the scaffold: leads in, one chip, a valve on the air line */
const Electronics: React.FC<{m: M; s: number; t: number}> = ({m, s, t}) => {
  const box = (x0: number, y0: number, x1: number, y1: number) => poly([apply(m, [x0, y0]), apply(m, [x1, y0]), apply(m, [x1, y1]), apply(m, [x0, y1])]);
  const tr = (ps: [number, number][], w = 0.05, col: string = C.copper) => <path d={poly(ps.map((p) => apply(m, p)), false)} stroke={col} strokeWidth={w * s} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
  const chipLit = clamp(Math.exp(-Math.max(0, t - PC) * 5) * (t >= PC - 0.03 ? 1 : 0));
  const open = ss(PV - 0.06, PV + 0.02, t) * (1 - ss(PV + 0.45, PV + 0.6, t));
  const out: React.ReactNode[] = [];
  out.push(<path key="pcb" d={box(-1.5, 2.25, 2.3, 3.7)} fill={C.pcb} stroke={INK} strokeWidth={3} />);
  out.push(<g key="leads">
    {tr([[E0[0], E0[1]], [E0[0], 1.4], [XC, Y.chip - 0.4]], 0.045)}
    {tr([[E1[0], E1[1]], [E1[0], 1.5], [-0.72, 2.55], [XC - 0.3, 2.62], [XC - 0.3, Y.chip - 0.4]], 0.045)}
    {tr([[XC, Y.chip], [XC, 3.7], [XC, Y.valve - 0.5]], 0.05, '#C9D5DB')}
  </g>);
  const pins: React.ReactNode[] = [];
  for (let k = 0; k < 5; k++) {
    const x = XC - 0.5 + k * 0.25;
    pins.push(<path key={'a' + k} d={box(x - 0.04, Y.chip - 0.42, x + 0.04, Y.chip - 0.32)} fill="#B8C2C8" />, <path key={'b' + k} d={box(x - 0.04, Y.chip + 0.32, x + 0.04, Y.chip + 0.42)} fill="#B8C2C8" />);
  }
  const led = apply(m, [XC + 0.95, Y.chip]);
  out.push(<g key="chip">{pins}<path d={box(XC - 0.65, Y.chip - 0.32, XC + 0.65, Y.chip + 0.32)} fill={C.chip} stroke={INK} strokeWidth={2.5} />
    <circle cx={led[0]} cy={led[1]} r={0.07 * s} fill={chipLit > 0.05 ? C.spikeCore : '#2E4A52'} />
    {chipLit > 0.05 && <circle cx={led[0]} cy={led[1]} r={0.25 * s} fill={C.spike} opacity={chipLit} filter="url(#bglow)" />}</g>);
  // the air line: supply in from the right, the valve, the line down to the leg
  out.push(<g key="air">
    <path d={box(XC + 0.6, Y.valve - 0.17, 3.4, Y.valve + 0.17)} fill={C.tube} opacity={0.6} stroke={INK} strokeWidth={2} />
    <path d={box(XC - 0.17, Y.valve + 0.4, XC + 0.17, 12)} fill={C.tube} opacity={0.6} stroke={INK} strokeWidth={2} />
    <path d={box(XC - 0.6, Y.valve - 0.5, XC + 0.6, Y.valve + 0.42)} fill="#4D5F6B" stroke={INK} strokeWidth={3} />
    {[0, 1, 2, 3, 4].map((k) => <path key={k} d={poly([apply(m, [XC - 0.48, Y.valve - 0.36 + k * 0.15]), apply(m, [XC + 0.48, Y.valve - 0.36 + k * 0.15])], false)} stroke={C.copper} strokeWidth={0.06 * s} />)}
    <path d={box(XC - 0.12, Y.valve + 0.28 + 0.14 * open, XC + 0.12, Y.valve + 0.48 + 0.14 * open)} fill="#9AA9B2" stroke={INK} strokeWidth={2} />
  </g>);
  if (t > PV - 0.03) {
    const puffs: React.ReactNode[] = [];
    for (let k = 0; k < 7; k++) {
      const yy = Y.valve + 0.5 + (t - (PV - 0.03)) * 7 - k * 0.3;
      if (yy < Y.valve + 0.45) continue;
      const q = apply(m, [XC + 0.04 * Math.sin(k * 2.1), yy]);
      puffs.push(<circle key={k} cx={q[0]} cy={q[1]} r={0.1 * s} fill="#FFFFFF" opacity={0.85} />);
    }
    out.push(<g key="puffs">{puffs}</g>);
  }
  return <g>{out}</g>;
};

/** the followed pulse riding the wire: a small raw spike before the controller, a clean digital pulse after it */
const Pulse: React.FC<{m: M; s: number; t: number}> = ({m, s, t}) => {
  if (t < P0 - 0.02 || t > PV + 0.05) return null;
  const y = pulseY(t);
  const clean = y > Y.chip;
  const pts: Pt[] = [];
  for (let k = 0; k <= 70; k++) {
    const u = k / 70, yy = y - 0.9 + u * 1.1;
    if (yy < E0[1] + 0.05) continue;
    const x = (u - 0.8) / 0.06;
    const v = clean ? (Math.abs(x) < 1.1 ? 0.85 : 0) : 0.8 * Math.exp(-x * x) + 0.3 * (noise1(u * 70 + t * 25, 4) * 0.6 + noise1(u * 150 - t * 40, 9) * 0.4);
    pts.push(apply(m, [(yy < 1.4 ? E0[0] : XC) - 0.3 - 0.26 * v, yy]));
  }
  const head = apply(m, [y < 1.4 ? E0[0] : XC, y]);
  return <g>
    <path d={poly(pts, false)} stroke={C.spike} strokeWidth={0.06 * s} fill="none" opacity={0.3} filter="url(#bglow)" />
    <path d={poly(pts, false)} stroke={C.spike} strokeWidth={0.022 * s} fill="none" strokeLinejoin="round" />
    <circle cx={head[0]} cy={head[1]} r={0.15 * s} fill={C.spike} opacity={0.75} filter="url(#bglow)" />
    <circle cx={head[0]} cy={head[1]} r={0.055 * s} fill={C.spikeCore} />
  </g>;
};

export const SignalWorld: React.FC<{t: number}> = ({t}) => {
  const m = camB(t);
  const s = Math.hypot(m[0], m[1]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="bglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" /></filter>
        <radialGradient id="hubIn" cx="0.5" cy="0.3" r="0.9"><stop offset="0" stopColor="#1C3240" /><stop offset="1" stopColor="#0C171F" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hubIn)" />
      <Electronics m={m} s={s} t={t} />
      <Scaffold m={m} s={s} />
      <Hyphae m={m} t={t} s={s} />
      <Electrode m={m} p={E0} s={s} flash={electrodeFlash(t, 0)} />
      <Electrode m={m} p={E1} s={s} flash={electrodeFlash(t, 1)} />
      <Pulse m={m} s={s} t={t} />
    </svg>
  );
};
export const CHAIN = {electrode: P0, controller: PC, valve: PV};

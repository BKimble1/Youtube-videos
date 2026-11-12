// World B: the macro view of the same scaffold disc (identical network, matched from the robot's dome), then one
// spike followed down a continuous path: hyphae -> electrode -> amplifier -> filter -> spike detection -> valve -> air
// line. Coordinates are scaffold-disc cm; the chain is laid out below the disc (+y).
import React from 'react';
import {clamp, ss, ss5, lerp, noise1} from './lib';
import {W, H} from './cam3d';
import {C, INK} from './palette';
import {poly, fmt, Pt} from './g2';
import {NET, ELECTRODES, glowAt, electrodeFlash, tipGrowth} from './mycelium';
import {DISC_R} from './robot';
import {T, SEG} from './timing';
import {discAffine} from './RobotWorld';

type M = [number, number, number, number, number, number]; // screen = [a c e; b d f] * [x y 1]
const apply = (m: M, p: Pt): [number, number] => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const fromCam = (cx: number, cy: number, s: number, rot: number, mir: number): M => {
  const co = Math.cos(rot) * s, si = Math.sin(rot) * s;
  // x' = mir*x ; then rotate, scale, centre
  const a = co * mir, b = si * mir, c2 = -si, d = co;
  return [a, b, c2, d, W / 2 - (a * cx + c2 * cy), H / 2 - (b * cx + d * cy)];
};
// the macro camera's handedness and orientation follow the robot shot it is matched from
const A0 = discAffine(SEG.matchA1);
const MIR = Math.sign(A0.ex[0] * A0.ez[1] - A0.ex[1] * A0.ez[0]) || 1;
const ROT0 = Math.atan2(A0.ez[0], A0.ez[1]) * -1; // rotation that puts disc +y where the robot shot has it
const S0 = Math.hypot(A0.ez[0], A0.ez[1]);
// centre of the screen in disc coordinates at the match
const inv = (m: M, p: [number, number]): [number, number] => {
  const det = m[0] * m[3] - m[2] * m[1];
  const x = p[0] - m[4], y = p[1] - m[5];
  return [(m[3] * x - m[2] * y) / det, (-m[1] * x + m[0] * y) / det];
};
const MA: M = [A0.ex[0], A0.ex[1], A0.ez[0], A0.ez[1], A0.o[0], A0.o[1]];
const C0 = inv(MA, [W / 2, H / 2]);

// the chain layout (disc cm)
const E0 = ELECTRODES[0], E1 = ELECTRODES[1];
const XC = E0[0];
const Y = {rim: DISC_R, amp: 3.15, filt: 4.55, det: 5.95, valve: 7.55, tube: 8.35};
const PATH: [number, number][] = [[E0[0], E0[1]], [XC, Y.amp], [XC, Y.filt], [XC, Y.det], [XC, Y.valve]];
/** the featured pulse: its position (disc y along the chain) */
const P0 = T.fired, P1 = SEG.wipe0 - 0.12;
export const pulseY = (t: number) => lerp(E0[1], Y.valve, ss5(P0 + 0.05, P1, t) * 0.25 + clamp((t - P0 - 0.05) / (P1 - P0 - 0.05)) * 0.75);

type BK = {t: number; cx: number; cy: number; s: number; rot: number};
const KEYS: BK[] = [
  {t: SEG.matchA1, cx: C0[0], cy: C0[1], s: S0, rot: ROT0},
  {t: 4.4, cx: -0.15, cy: -0.55, s: 1500, rot: ROT0 * 0.35}, // macro: the threads and their growing tips
  {t: 5.75, cx: -0.05, cy: 0.75, s: 430, rot: 0}, // both electrodes and their leads: "into the electronics"
  {t: 7.45, cx: E0[0] - 0.1, cy: E0[1] - 0.15, s: 760, rot: 0}, // close to the electrode as the spikes arrive
];
const camB = (t: number): M => {
  if (t <= SEG.matchA1) {
    const a = discAffine(t);
    return [a.ex[0], a.ex[1], a.ez[0], a.ez[1], a.o[0], a.o[1]];
  }
  if (t >= T.fired) {
    // track the pulse down the chain
    const k = ss(T.fired, T.fired + 0.45, t);
    const last = KEYS[KEYS.length - 1];
    const cy = lerp(last.cy, pulseY(t) + 0.55, k);
    const s = lerp(last.s, 300, ss(T.fired, T.fired + 0.6, t));
    return fromCam(lerp(last.cx, XC + 0.45, k), cy + (t > P1 ? (t - P1) * 3.2 : 0), s, 0, MIR);
  }
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const u = ss5(a.t, b.t, t);
  if (i === 0) {
    // leave the matched affine smoothly: blend matrices, keeping the robot shot's push-in momentum
    const mb = fromCam(lerp(a.cx, b.cx, u), lerp(a.cy, b.cy, u), a.s * Math.pow(b.s / a.s, u), lerp(a.rot, b.rot, u), MIR);
    const ma = MA;
    const k = ss(SEG.matchA1, SEG.matchA1 + 0.35, t);
    return ma.map((v, j) => lerp(v, mb[j], k)) as M;
  }
  return fromCam(lerp(a.cx, b.cx, u), lerp(a.cy, b.cy, u), a.s * Math.pow(b.s / a.s, u), lerp(a.rot, b.rot, u), MIR);
};

// ------------------------------------------------------------------------------------------------ drawing
const Hyphae: React.FC<{m: M; t: number; s: number}> = ({m, t, s}) => {
  const g = tipGrowth(t);
  let c0 = '', c1 = '', c2 = '', glow = '';
  const pad = 60;
  for (const h of NET) {
    const n = h.pts.length;
    const end = Math.max(2, Math.round(h.tipFrom + (n - h.tipFrom) * g));
    const pts = h.pts.slice(0, Math.min(n, end)).map((p) => apply(m, p));
    let xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9;
    for (const p of pts) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
    if (xmax < -pad || xmin > W + pad || ymax < -pad || ymin > H + pad) continue;
    const d = poly(pts, false);
    if (h.tier === 0) c0 += d; else if (h.tier === 1) c1 += d; else c2 += d;
    let run: Pt[] = [];
    for (let k = 0; k < pts.length; k++) {
      if (glowAt(h.pts[k], t) > 0.22) run.push(pts[k]);
      else { if (run.length > 1) glow += poly(run, false); run = []; }
    }
    if (run.length > 1) glow += poly(run, false);
  }
  const k = s / 800;
  const w0 = clamp(3.4 * k, 1.2, 7), w1 = clamp(2.1 * k, 0.9, 4.5), w2 = clamp(1.2 * k, 0.6, 2.6);
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <g transform={`translate(${fmt(1.2 * k)} ${fmt(1.6 * k)})`} stroke="#0B1116" opacity={0.55}>
        <path d={c2} strokeWidth={w2 * 1.6} /><path d={c1} strokeWidth={w1 * 1.5} /><path d={c0} strokeWidth={w0 * 1.4} />
      </g>
      <path d={c2} stroke={C.hypha} strokeWidth={w2} opacity={0.8} />
      <path d={c1} stroke={C.hyphaShade} strokeWidth={w1 * 1.35} />
      <path d={c1} stroke={C.hypha} strokeWidth={w1} />
      <path d={c0} stroke={C.hyphaShade} strokeWidth={w0 * 1.35} />
      <path d={c0} stroke={C.cord} strokeWidth={w0} />
      {/* cytoplasm streaming along the cords */}
      <path d={c0} stroke="#FFFFFF" strokeWidth={w0 * 0.45} strokeDasharray={`${fmt(3 * k + 1)} ${fmt(22 * k + 6)}`} strokeDashoffset={fmt(-t * 60 * k)} opacity={0.8} />
      {glow && <path d={glow} stroke={C.spike} strokeWidth={w0 * 3.2} filter="url(#bglow)" />}
      {glow && <path d={glow} stroke={C.spikeCore} strokeWidth={w0 * 1.1} />}
    </g>
  );
};

const Scaffold: React.FC<{m: M; s: number}> = ({m, s}) => {
  // a 3D-printed lattice (hexagonal cells) on the disc
  const out: string[] = [];
  const a = 0.16;
  const rows = Math.ceil((DISC_R * 2) / (a * 1.5));
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
  return (
    <g>
      <path d={poly(disc)} fill={C.scaffold} />
      <path d={out.join('')} fill="none" stroke={C.scaffoldLine} strokeWidth={clamp(s * 0.004, 0.8, 4)} opacity={0.7} />
      <path d={poly(disc)} fill="none" stroke={INK} strokeWidth={clamp(s * 0.02, 2, 8)} />
    </g>
  );
};

const Electrode: React.FC<{m: M; p: [number, number]; s: number; flash: number}> = ({m, p, s, flash}) => {
  const c = apply(m, p);
  const r = 0.085 * s;
  return (
    <g>
      <circle cx={c[0]} cy={c[1]} r={r * 1.35} fill={C.goldDark} />
      <circle cx={c[0]} cy={c[1]} r={r} fill={C.gold} stroke={INK} strokeWidth={2} />
      <circle cx={c[0] - r * 0.3} cy={c[1] - r * 0.3} r={r * 0.35} fill={C.goldLight} />
      {flash > 0.02 && <circle cx={c[0]} cy={c[1]} r={r * (1.6 + 2.5 * flash)} fill={C.spike} opacity={clamp(flash)} filter="url(#bglow)" />}
    </g>
  );
};

/** the signal as it would look at each stage (drawn as a trace that rides along the copper) */
const stageShape = (y: number) => (y < Y.amp ? 0 : y < Y.filt ? 1 : y < Y.det ? 2 : 3);
const waveAt = (stage: number, u: number, t: number) => {
  // u: 0..1 along the drawn window (pulse at u ~ 0.8)
  const x = (u - 0.78) / 0.06;
  const spike = Math.exp(-x * x) - 0.25 * Math.exp(-((x - 2.2) ** 2) / 1.5);
  const nz = noise1(u * 60 + t * 25, 4) * 0.5 + noise1(u * 140 - t * 40, 9) * 0.35;
  if (stage === 0) return 0.25 * spike + 0.35 * nz; // raw: tiny spike buried in noise
  if (stage === 1) return 0.9 * spike + 0.55 * nz; // amplified: big, still noisy
  if (stage === 2) return 1.0 * spike; // filtered: clean
  return Math.abs(x) < 1.1 ? 0.9 : 0; // detected: a clean digital pulse
};

const Board: React.FC<{m: M; s: number; t: number}> = ({m, s, t}) => {
  const out: React.ReactNode[] = [];
  const box = (x0: number, y0: number, x1: number, y1: number) => poly([apply(m, [x0, y0]), apply(m, [x1, y0]), apply(m, [x1, y1]), apply(m, [x0, y1])]);
  // the board
  out.push(<path key="pcb" d={box(-1.6, 2.35, 2.4, 6.85)} fill={C.pcb} stroke={INK} strokeWidth={3} />);
  // copper traces: electrode leads in, then the chain
  const tr = (ps: [number, number][], w = 0.05) => <path d={poly(ps.map((p) => apply(m, p)), false)} stroke={C.copper} strokeWidth={w * s} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
  out.push(<g key="tr">
    {tr([[E0[0], E0[1]], [E0[0], 1.4], [XC, Y.amp - 0.35]], 0.045)}
    {tr([[E1[0], E1[1]], [E1[0], 1.5], [-0.72, 2.6], [XC - 0.28, 2.85], [XC - 0.28, Y.amp - 0.35]], 0.045)}
    {tr([[XC, Y.amp], [XC, Y.filt]])}{tr([[XC, Y.filt], [XC, Y.det]])}{tr([[XC, Y.det], [XC, 6.85]])}
  </g>);
  // insulated leads where they cross the scaffold
  // chips
  const chip = (y: number, label: string, w = 1.25, h = 0.62) => {
    const c = apply(m, [XC, y]);
    const pins: React.ReactNode[] = [];
    for (let k = 0; k < 5; k++) {
      const x = XC - w / 2 + 0.15 + (k * (w - 0.3)) / 4;
      pins.push(<path key={'a' + k} d={box(x - 0.04, y - h / 2 - 0.1, x + 0.04, y - h / 2)} fill="#B8C2C8" />);
      pins.push(<path key={'b' + k} d={box(x - 0.04, y + h / 2, x + 0.04, y + h / 2 + 0.1)} fill="#B8C2C8" />);
    }
    return <g key={label}>{pins}<path d={box(XC - w / 2, y - h / 2, XC + w / 2, y + h / 2)} fill={C.chip} stroke={INK} strokeWidth={2.5} />
      <circle cx={apply(m, [XC - w / 2 + 0.12, y - h / 2 + 0.12])[0]} cy={apply(m, [XC - w / 2 + 0.12, y - h / 2 + 0.12])[1]} r={0.04 * s} fill="#3A444B" />
      <text x={apply(m, [XC + w / 2 + 0.14, y])[0]} y={c[1] + 0.08 * s} fill={C.silk} fontFamily="JetBrains Mono" fontWeight={700} fontSize={0.16 * s} letterSpacing={0.005 * s}>{label}</text></g>;
  };
  out.push(chip(Y.amp, 'AMP'), chip(Y.filt, 'FILTER'), chip(Y.det, 'SPIKE DETECT'));
  // the valve (off the board, on the air supply), and the soft air line to the leg
  const v0 = apply(m, [XC - 0.55, Y.valve - 0.55]);
  const open = ss(P1 - 0.12, P1 - 0.04, t);
  out.push(<g key="valve">
    {tr([[XC, 6.85], [XC, Y.valve - 0.6]], 0.05)}
    <path d={poly([apply(m, [XC - 0.17, Y.valve + 0.4]), apply(m, [XC + 0.17, Y.valve + 0.4]), apply(m, [XC + 0.17, 12]), apply(m, [XC - 0.17, 12])])} fill={C.tube} opacity={0.65} stroke={INK} strokeWidth={2} />
    <path d={box(XC - 0.6, Y.valve - 0.55, XC + 0.6, Y.valve + 0.45)} fill="#4D5F6B" stroke={INK} strokeWidth={3} />
    {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={poly([apply(m, [XC - 0.5, Y.valve - 0.42 + k * 0.13]), apply(m, [XC + 0.5, Y.valve - 0.42 + k * 0.13])], false)} stroke={C.copper} strokeWidth={0.06 * s} />)}
    <path d={box(XC - 0.12, Y.valve + 0.3 + 0.12 * open, XC + 0.12, Y.valve + 0.5 + 0.12 * open)} fill="#9AA9B2" stroke={INK} strokeWidth={2} />
    <text x={apply(m, [XC + 0.75, Y.valve])[0]} y={apply(m, [XC + 0.75, Y.valve])[1] + 0.08 * s} fill={C.silk} fontFamily="JetBrains Mono" fontWeight={700} fontSize={0.16 * s}>VALVE</text>
    <text x={apply(m, [XC + 0.75, Y.valve + 0.3])[0]} y={apply(m, [XC + 0.75, Y.valve + 0.3])[1] + 0.06 * s} fill="#9FB4BD" fontFamily="JetBrains Mono" fontSize={0.14 * s}>air to the leg</text>
  </g>);
  void v0;
  // air puffs travelling down the line after the valve opens
  if (t > P1 - 0.05) {
    const puffs: React.ReactNode[] = [];
    for (let k = 0; k < 6; k++) {
      const yy = Y.valve + 0.55 + (t - (P1 - 0.05)) * 7 - k * 0.32;
      if (yy < Y.valve + 0.45) continue;
      const q = apply(m, [XC + 0.04 * Math.sin(k * 2.1), yy]);
      puffs.push(<circle key={k} cx={q[0]} cy={q[1]} r={0.1 * s} fill="#FFFFFF" opacity={0.85} />);
    }
    out.push(<g key="puffs">{puffs}</g>);
  }
  return <g>{out}</g>;
};

const Pulse: React.FC<{m: M; s: number; t: number}> = ({m, s, t}) => {
  if (t < T.fired - 0.02 || t > P1 + 0.05) return null;
  const y = pulseY(t);
  const st = stageShape(y);
  // the waveform rides beside the trace: a window of 1.4 cm ending just past the pulse
  const pts: Pt[] = [];
  const N = 90;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const yy = y - 1.1 + u * 1.4;
    if (yy < E0[1] + 0.05) continue;
    const xx = (yy < 1.4 ? E0[0] : XC) - 0.36 - 0.3 * waveAt(st, u, t);
    pts.push(apply(m, [xx, yy]));
  }
  // the wave is plotted sideways (time runs down the trace), next to the copper
  const head = apply(m, [yLeadX(y), y]);
  const flash = st !== stageShape(pulseY(t - 0.06)) ? 1 : 0;
  return (
    <g>
      <path d={poly(pts, false)} stroke={C.spike} strokeWidth={0.07 * s} fill="none" opacity={0.35} filter="url(#bglow)" />
      <path d={poly(pts, false)} stroke={C.spike} strokeWidth={0.025 * s} fill="none" strokeLinejoin="round" />
      <circle cx={head[0]} cy={head[1]} r={0.16 * s} fill={C.spike} opacity={0.8} filter="url(#bglow)" />
      <circle cx={head[0]} cy={head[1]} r={0.06 * s} fill={C.spikeCore} />
      {flash > 0 && <circle cx={head[0]} cy={head[1]} r={0.5 * s} fill={C.spike} opacity={0.5} filter="url(#bglow)" />}
    </g>
  );
};
const yLeadX = (y: number) => (y < 1.4 ? E0[0] : XC);

export const SignalWorld: React.FC<{t: number}> = ({t}) => {
  const m = camB(t);
  const s = Math.hypot(m[0], m[1]);
  const labelA = ss(3.25, 3.55, t) * (1 - ss(5.0, 5.25, t));
  const labelE = ss(5.3, 5.55, t) * (1 - ss(7.3, 7.5, t));
  const e0 = apply(m, E0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="bglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" /></filter>
        <radialGradient id="hubIn" cx="0.5" cy="0.3" r="0.9"><stop offset="0" stopColor="#1C3240" /><stop offset="1" stopColor="#0C171F" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hubIn)" />
      <Board m={m} s={s} t={t} />
      <Scaffold m={m} s={s} />
      <Hyphae m={m} t={t} s={s} />
      <Electrode m={m} p={E0} s={s} flash={electrodeFlash(t, 0)} />
      <Electrode m={m} p={E1} s={s} flash={electrodeFlash(t, 1)} />
      <Pulse m={m} s={s} t={t} />
      {labelA > 0.01 && <g opacity={labelA} fontFamily="Nunito Variable" fontWeight={800}>
        <rect x={46} y={196} width={760} height={126} rx={22} fill="#0C171F" opacity={0.78} />
        <text x={70} y={250} fill="#FFFFFF" fontSize={46}>living mycelium</text>
        <text x={70} y={300} fill="#BFD3DC" fontSize={32} fontWeight={600}>king oyster fungus, on a 3D-printed scaffold</text>
      </g>}
      {labelE > 0.01 && <g opacity={labelE} fontFamily="Nunito Variable" fontWeight={800}>
        <path d={`M${fmt(e0[0] - 0.12 * s)} ${fmt(e0[1] - 0.1 * s)}L${fmt(e0[0] - 0.35 * s)} ${fmt(e0[1] - 0.35 * s)}`} stroke="#FFFFFF" strokeWidth={3} />
        <rect x={e0[0] - 0.37 * s - 220} y={e0[1] - 0.37 * s - 46} width={232} height={62} rx={16} fill="#0C171F" opacity={0.78} />
        <text x={e0[0] - 0.37 * s} y={e0[1] - 0.37 * s} textAnchor="end" fill="#FFFFFF" fontSize={42}>electrode</text>
      </g>}
    </svg>
  );
};

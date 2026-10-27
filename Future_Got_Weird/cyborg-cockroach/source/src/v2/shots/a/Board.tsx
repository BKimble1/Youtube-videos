// Group A: a richer close-up layer for the medic's stimulator board, drawn in the body frame (mm) through the same
// orthographic view as Roach2D / Gear2D, on top of Gear2D: flat PCB traces, pads, vias and two small SMD parts on the
// board's top face, the red status LED as a domed lens in a white package (it covers Gear2D's LED dot at the same
// spot), and the two fine nichrome leads that run from the board's front pad up the tube's near side to the coil at
// the mouth. A bright signal bead can travel LED -> trace -> lead -> coil, lighting the copper behind it.
import React from 'react';
import {V2, V3, Frame, toW} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {mix} from '../../../lib/color';
import {PACK} from '../../../rig/gear';
import {View, P, f2, hull, smoothClosed, smoothOpen, polyD} from '../../roach/ortho';

const TOP = PACK.board.c[1] + PACK.board.h[1] + 0.02; // board top face (body y)
/** Gear2D's LED spot */
export const LED_B: V3 = [11.5, TOP, 4.6];
/** the coil at the tube mouth (as Gear2D draws it) */
const T = PACK.tube;
export const COIL_B: V3 = [T.b[0] - 0.4, T.a[1] + T.r * 0.55, 0];
/** LED lens radius (mm) */
export const LENS_R = 0.8;

/** the signal's run in the body frame: from the LED along a board trace to the front pad, then up the nichrome lead
 *  along the tube's near side, in over the rim to the coil */
const RUN_TRACE: V3[] = [
  [LED_B[0] + 0.9, TOP, LED_B[2]],
  [13.1, TOP, 4.6],
  [13.9, TOP, 4.1],
];
const th = (40 * Math.PI) / 180;
const RUN_LEAD: V3[] = [
  [13.9, TOP + 0.1, 4.1],
  [15.2, TOP + 0.5, 4.4],
  [18.5, 25.0, 4.1],
  [21.8, 26.3, 4.0],
  [23.6, 27.6, 3.6],
  [24.1, T.a[1] + T.r * Math.cos(th) + 0.25, T.r * Math.sin(th) + 0.25],
  [COIL_B[0], COIL_B[1], 0.6],
];
/** the second lead (the return), a little behind the first */
const RUN_LEAD2: V3[] = RUN_LEAD.map(([x, y, z], i) => [x - (i > 0 && i < RUN_LEAD.length - 1 ? 0.15 : 0), y + (i > 0 ? 0.35 : 0), z - 0.7]);

/** decorative traces on the board top (x, z pairs), pads (x, z) and vias */
const TRACES: [number, number][][] = [
  [[8.5, -1.8], [8.5, 1.2], [10.2, 2.9], [10.6, 4.6]],
  [[6.0, -4.2], [3.0, -4.2], [1.4, -2.6], [-2.5, -2.6]],
  [[6.0, -3.0], [4.0, -1.0], [4.0, 3.6], [-3.8, 3.6], [-4.6, 4.4]],
  [[-3.6, -4.6], [-1.4, -6.6], [9.6, -6.6], [11.0, -5.2]],
  [[-8.6, 4.4], [-10.6, 4.4], [-10.6, 0.5], [-11.6, -0.6]],
  [[11.0, -1.8], [12.6, -0.2], [12.6, 2.2]],
];
const PADS: [number, number][] = [[10.6, 4.6], [-2.5, -2.6], [-4.6, 4.4], [11.0, -5.2], [-11.6, -0.6], [12.6, 2.2], [13.9, 4.1]];
const VIAS: [number, number][] = [[1.4, -2.6], [-10.6, 0.5], [4.0, 3.6], [9.6, -6.6]];
/** small SMD parts: centre x, z, half x, half z, body colour */
const SMD: [number, number, number, number, string][] = [
  [2.0, 1.2, 1.0, 0.5, '#2B2F35'],
  [-1.6, -5.0, 0.5, 0.9, '#C9A77A'],
  [12.0, -3.4, 0.45, 0.8, '#2B2F35'],
];

const circ = (c: V3, r: number, n = 28): V3[] => Array.from({length: n}, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r] as V3;
});
const along = (pts: V2[], u: number): V2 => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const x = Math.max(0, Math.min(1, u)) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < x) i++;
  const k = (x - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
};
/** the part of a polyline from 0 to u (fraction of its length) */
const upTo = (pts: V2[], u: number): V2[] => {
  if (u <= 0) return [];
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const x = Math.min(1, u) * L[L.length - 1];
  const out: V2[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] < x) out.push(pts[i]);
    else {
      out.push(along(pts, u));
      break;
    }
  }
  return out;
};
const lineD = (pts: V2[]) => (pts.length > 1 ? `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}` : '');

export type BoardFx = {
  /** LED: 0 off .. 1 fully lit; flash adds a brief bloom */
  led: number;
  flash?: number;
  /** signal position along the whole run (0 = at the LED, 1 = at the coil); < 0 none */
  signal?: number;
  /** how much of the run stays lit behind the signal (0..1) */
  wake?: number;
};

/** the run's screen polyline (trace then lead) and the fraction where the trace ends */
export const runScreen = (v: View, f: Frame) => {
  const a = RUN_TRACE.map((p) => P(v, toW(f, p)));
  const b = RUN_LEAD.map((p) => P(v, toW(f, p)));
  return {pts: [...a, ...b.slice(1)], led: P(v, toW(f, LED_B)), coil: P(v, toW(f, COIL_B))};
};

/** the board detail: drawn after Gear2D; `mask` hides it under the tube and the chips (drawn by Gear2D) */
export const BoardDetail: React.FC<{id: string; v: View; f: Frame; fx: BoardFx}> = ({id, v, f, fx}) => {
  const s = v.s;
  const Q = (x: number, z: number, y = TOP): V2 => P(v, toW(f, [x, y, z]));
  // occluders (Gear2D draws them under this layer): the tube, the chips and the coin cell
  const tubePts: V2[] = hull([T.a[0], T.b[0]].flatMap((x) => Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return P(v, toW(f, [x, T.a[1] + Math.cos(a) * T.r, Math.sin(a) * T.r]));
  })));
  const boxH = (c: V3, h: V3) => {
    const pts: V2[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(P(v, toW(f, [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]])));
    return hull(pts);
  };
  const chipA = boxH(PACK.chipA.c, PACK.chipA.h), chipB = boxH(PACK.chipB.c, PACK.chipB.h);
  const cellPts = hull([...circ([PACK.cell.c[0], PACK.cell.c[1] + PACK.cell.h / 2, PACK.cell.c[2]], PACK.cell.r), ...circ([PACK.cell.c[0], PACK.cell.c[1] - PACK.cell.h / 2, PACK.cell.c[2]], PACK.cell.r)].map((p) => P(v, toW(f, p))));
  const clampPts = PACK.clamps.map((x) => boxH([x, T.a[1] - T.r + 0.6, 0], [1.1, 1.4, T.r + 0.5]));
  const board = boxH([PACK.board.c[0], TOP, PACK.board.c[2]], [PACK.board.h[0] - 0.25, 0.01, PACK.board.h[2] - 0.25]);
  const tw = Math.max(1, 0.32 * s);
  const run = runScreen(v, f);
  const trace = RUN_TRACE.map((p) => P(v, toW(f, p)));
  const lead = RUN_LEAD.map((p) => P(v, toW(f, p)));
  const lead2 = RUN_LEAD2.map((p) => P(v, toW(f, p)));
  const sig = fx.signal ?? -1;
  const wake = fx.wake ?? 0.35;
  const ft = fracTrace(v, f);
  // lit copper: the trace while the signal is on it, then fading; the lead likewise
  const litTrace = sig > 0 ? upTo(trace, sig / ft) : [];
  const traceA = sig > 0 ? Math.max(0, Math.min(1, 1 - (sig - ft) / wake)) : 0;
  const litLead = sig > ft ? upTo(lead, (sig - ft) / (1 - ft)) : [];
  const leadA = sig > ft ? Math.max(0, Math.min(1, 1 - (sig - 1) / wake)) : 0;
  const bead = sig >= 0 && sig <= 1.02 ? along(run.pts, Math.min(1, sig)) : null;
  // LED lens and package
  const lens = circ(LED_B, LENS_R, 32).map((p) => P(v, toW(f, [p[0], TOP + 0.55, p[2]])));
  const lensBase = circ(LED_B, LENS_R, 32).map((p) => P(v, toW(f, [p[0], TOP + 0.2, p[2]])));
  const pkg = boxH([LED_B[0], TOP + 0.15, LED_B[2]], [1.0, 0.15, 0.88]);
  const led = Math.max(0, Math.min(1, fx.led));
  const flash = fx.flash ?? 0;
  const lc = P(v, toW(f, [LED_B[0], TOP + 0.6, LED_B[2]]));
  const lensCol = mix('#7A1E22', '#FF4747', led);
  return (
    <g>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="9000" height="9000">
          <path d={polyD(board)} fill="#FFFFFF" />
          {[tubePts, chipA, chipB, cellPts, ...clampPts].map((q, i) => (
            <path key={i} d={polyD(q)} fill="#000000" stroke="#000000" strokeWidth={f2(0.5 * s)} strokeLinejoin="round" />
          ))}
        </mask>
        <radialGradient id={`${id}-lg`}>
          <stop offset="0" stopColor="#FFE1DC" stopOpacity={0.95} />
          <stop offset="0.25" stopColor="#FF5A4E" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FF2D2D" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-bg`}>
          <stop offset="0" stopColor="#FFFBE6" stopOpacity={1} />
          <stop offset="0.35" stopColor="#FFE58A" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FFC85A" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* copper under the solder mask, pads and vias, small parts: only where the board top shows */}
      <g mask={`url(#${id}-m)`}>
        {TRACES.map((tr, i) => (
          <path key={i} d={lineD(tr.map(([x, z]) => Q(x, z)))} stroke="#45B58C" strokeWidth={f2(tw)} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
        ))}
        <path d={lineD(trace)} stroke="#45B58C" strokeWidth={f2(tw * 1.25)} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {PADS.map(([x, z], i) => {
          const c = Q(x, z);
          return <ellipse key={i} cx={f2(c[0])} cy={f2(c[1])} rx={f2(0.42 * s)} ry={f2(0.42 * s * Math.abs(v.F[1]))} fill="#E6C15A" stroke="#9C7A22" strokeWidth={f2(Math.max(0.6, 0.06 * s))} />;
        })}
        {VIAS.map(([x, z], i) => {
          const c = Q(x, z);
          return (
            <g key={i}>
              <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(0.3 * s)} ry={f2(0.3 * s * Math.abs(v.F[1]))} fill="#D9B24C" />
              <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(0.13 * s)} ry={f2(0.13 * s * Math.abs(v.F[1]))} fill="#1C4E3E" />
            </g>
          );
        })}
        {SMD.map(([x, z, hx, hz, col], i) => {
          const b = boxH([x, TOP + 0.25, z], [hx, 0.25, hz]);
          const e1 = boxH([x - (hx > hz ? hx - 0.2 : 0), TOP + 0.26, z - (hz >= hx ? hz - 0.2 : 0)], [hx > hz ? 0.22 : hx, 0.26, hz >= hx ? 0.22 : hz]);
          const e2 = boxH([x + (hx > hz ? hx - 0.2 : 0), TOP + 0.26, z + (hz >= hx ? hz - 0.2 : 0)], [hx > hz ? 0.22 : hx, 0.26, hz >= hx ? 0.22 : hz]);
          return (
            <g key={i}>
              <path d={polyD(b)} fill={col} stroke={INK} strokeWidth={f2(Math.max(0.8, 0.08 * s))} strokeLinejoin="round" />
              <path d={polyD(e1)} fill="#C9D2D8" />
              <path d={polyD(e2)} fill="#C9D2D8" />
            </g>
          );
        })}
        {/* the signal lighting the trace */}
        {litTrace.length > 1 && traceA > 0 && <path d={lineD(litTrace)} stroke="#FFF0A0" strokeWidth={f2(tw * 1.3)} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9 * traceA} />}
      </g>
      {/* the LED: white package, red domed lens; lit, a bright core and a soft red bloom */}
      <path d={polyD(pkg)} fill="#E9E3D6" stroke={INK} strokeWidth={f2(Math.max(0.8, 0.09 * s))} strokeLinejoin="round" />
      <path d={smoothClosed(lensBase)} fill={mix('#5A1518', '#C82828', led)} />
      <path d={smoothClosed(lens)} fill={lensCol} stroke={INK} strokeWidth={f2(Math.max(0.8, 0.08 * s))} />
      {led > 0 && <ellipse cx={f2(lc[0])} cy={f2(lc[1])} rx={f2(LENS_R * 0.55 * s)} ry={f2(LENS_R * 0.55 * s * Math.abs(v.F[1]))} fill="#FFD9D2" opacity={led} />}
      <ellipse cx={f2(lc[0] - 0.32 * s)} cy={f2(lc[1] - 0.22 * s)} rx={f2(0.22 * s)} ry={f2(0.12 * s)} fill="#FFFFFF" opacity={0.85} transform={`rotate(-25 ${f2(lc[0] - 0.32 * s)} ${f2(lc[1] - 0.22 * s)})`} />
      {led > 0 && <circle cx={f2(lc[0])} cy={f2(lc[1])} r={f2((3.2 + 1.6 * flash) * s)} fill={`url(#${id}-lg)`} opacity={Math.min(1, 0.75 * led + 0.25 * flash)} />}
      {/* the nichrome leads (thin, pale metal), the lit one carrying the signal */}
      {[lead2, lead].map((l, i) => (
        <g key={i}>
          <path d={smoothOpen(l)} stroke={INK} strokeWidth={f2(0.28 * s + 1.6)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={smoothOpen(l)} stroke={i ? '#B9A58A' : '#9C8A72'} strokeWidth={f2(0.28 * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {litLead.length > 1 && leadA > 0 && <path d={smoothOpen(litLead)} stroke="#FFE9A0" strokeWidth={f2(0.2 * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9 * leadA} />}
      {bead && (
        <g>
          <circle cx={f2(bead[0])} cy={f2(bead[1])} r={f2(1.6 * s)} fill={`url(#${id}-bg)`} />
          <circle cx={f2(bead[0])} cy={f2(bead[1])} r={f2(0.32 * s)} fill="#FFFDF2" />
        </g>
      )}
    </g>
  );
};
/** the fraction of the run's screen length taken by the board trace */
export const fracTrace = (v: View, f: Frame) => {
  const a = RUN_TRACE.map((p) => P(v, toW(f, p)));
  const r = runScreen(v, f).pts;
  const len = (q: V2[]) => q.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - q[i - 1][0], p[1] - q[i - 1][1]) : 0), 0);
  return len(a) / len(r);
};

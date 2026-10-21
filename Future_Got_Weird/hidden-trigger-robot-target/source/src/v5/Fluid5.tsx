// Practical-effects gag on the model hand (a theatrical dramatization, not part of the reported experiment):
// a thin effects line runs from a squeeze-bulb reservoir on the bench into the cuff and to a hidden outlet in the
// palm seam. When the blunt blade presses the palm, one short red jet (7 frames) throws a few droplets that arc back
// toward the camera and to the right under gravity and land on the bench in front of the mount. Everything is a function of dt = t - contact.
import React from 'react';
import {Cam3, horiz, projY, clamp01} from '../v3/proj';
import {BENCH, HAND3} from '../v3/World3';

export const FX = {red: '#C8102E', redDark: '#8B0A1E', redLight: '#FF6B7A', tube: '#D7DEE4'};
export const OUTLET = {x: 692, d: 34, h: HAND3.palmTop - 4}; // front edge of the palm seam, beside the blade
const G = 3000; // gravity (units/s²)
const EMIT = 0.23; // jet duration (7 frames)
// droplets: emission time, velocity (x, d, h), radius
const K = Math.sqrt(3000 / 2200); // same arcs as the earlier 2200 tuning, played faster so every drop lands inside the shot
const DROPS: {e: number; v: [number, number, number]; r: number}[] = (
  [
    [0.0, 350, 150, 700, 13],
    [0.03, 310, 125, 650, 10],
    [0.07, 380, 175, 680, 11],
    [0.11, 320, 110, 620, 9],
    [0.15, 290, 165, 640, 10],
    [0.19, 345, 135, 600, 8],
    [0.24, 275, 120, 580, 8],
  ] as const
).map(([e, vx, vd, vh, r]) => ({e: e * 0.85, v: [vx * K, vd * K, vh * K] as [number, number, number], r}));
const at = (e: number, v: [number, number, number], a: number) => ({x: OUTLET.x + v[0] * a, d: OUTLET.d + v[1] * a, h: OUTLET.h + v[2] * a - 0.5 * G * a * a});
const landTime = (v: [number, number, number]) => {
  // h(a) = BENCH.top
  const A = 0.5 * G, B = -v[2], C = BENCH.top - OUTLET.h;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
};
export const LANDINGS = DROPS.map((dr) => {
  const T = landTime(dr.v);
  return {t: dr.e + T, p: at(dr.e, dr.v, T), r: dr.r};
});

// Effects line and reservoir (a static part of the prop; revealed in the cuff close-up).
export const EffectsLine: React.FC<{c: Cam3}> = ({c}) => {
  const t = BENCH.top + 2;
  const pts: [number, number][] = [[862, 40], [900, 70], [955, 92], [992, 100]];
  const path = 'M ' + pts.map(([x, d]) => `${x} ${d}`).join(' L ');
  const yCuffBottom = projY(c, 38, 396), yBench = projY(c, 40, t);
  return (
    <g>
      {/* drop from the cuff underside to the bench */}
      <line x1={862} y1={yCuffBottom} x2={862} y2={yBench} stroke={FX.tube} strokeWidth={8} strokeLinecap="round" />
      <line x1={862} y1={yCuffBottom} x2={862} y2={yBench} stroke={FX.red} strokeWidth={3.5} strokeLinecap="round" />
      <g transform={horiz(c, t)}>
        <path d={path} stroke={FX.tube} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} stroke={FX.red} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* squeeze-bulb reservoir: clear plastic, red fluid, a white cap */}
      <g transform={horiz(c, BENCH.top)}>
        <ellipse cx={1012} cy={104} rx={30} ry={22} fill="#000" opacity={0.2} />
      </g>
      {(() => {
        const y0 = projY(c, 100, BENCH.top), y1 = projY(c, 100, BENCH.top + 30), ry = 20 * Math.sin((c.e * Math.PI) / 180);
        return (
          <g>
            <path d={`M 982 ${y1} L 982 ${y0} A 30 ${ry} 0 0 0 1042 ${y0} L 1042 ${y1} Z`} fill="#E9EEF2" opacity={0.75} stroke="#9AA6B0" strokeWidth={2} />
            <path d={`M 984 ${(y0 + y1) / 2} L 984 ${y0} A 28 ${ry * 0.9} 0 0 0 1040 ${y0} L 1040 ${(y0 + y1) / 2} Z`} fill={FX.red} opacity={0.85} />
            <ellipse cx={1012} cy={y1} rx={30} ry={ry} fill="#F4F7FA" stroke="#9AA6B0" strokeWidth={2} />
            <ellipse cx={1012} cy={y1} rx={9} ry={ry * 0.35} fill="#FFFFFF" />
          </g>
        );
      })()}
    </g>
  );
};

// Landed marks (persist after the main payoff) and drop shadows on the bench. Drawn before the hand.
export const BenchMarks: React.FC<{c: Cam3; dt: number | null}> = ({c, dt}) => {
  if (dt === null || dt < 0) return null;
  return (
    <g>
      {LANDINGS.map((L, i) => {
        if (dt < L.t) return null;
        const g = clamp01((dt - L.t) / 0.06);
        return (
          <g key={i} transform={horiz(c, BENCH.top + 1)}>
            <ellipse cx={L.p.x} cy={L.p.d} rx={L.r * (1 + 1.4 * g)} ry={L.r * (0.9 + 1.1 * g)} fill={FX.red} opacity={0.92} />
            <ellipse cx={L.p.x - L.r * 0.5} cy={L.p.d - L.r * 0.4} rx={L.r * 0.5} ry={L.r * 0.35} fill={FX.redLight} opacity={0.6 * g} />
            {g >= 1 && <circle cx={L.p.x + L.r * 2.6} cy={L.p.d + L.r * 0.8} r={L.r * 0.35} fill={FX.red} />}
          </g>
        );
      })}
      {DROPS.map((dr, i) => {
        const a = dt - dr.e;
        if (a <= 0 || a >= landTime(dr.v)) return null;
        const p = at(dr.e, dr.v, a);
        const k = clamp01(1 - (p.h - BENCH.top) / 220);
        return (
          <g key={'s' + i} transform={horiz(c, BENCH.top + 1)}>
            <ellipse cx={p.x} cy={p.d} rx={dr.r * 0.9} ry={dr.r * 0.7} fill="#0E141A" opacity={0.15 + 0.3 * k} />
          </g>
        );
      })}
    </g>
  );
};

// Pressure dent under the blade while it presses the palm (drawn on the hand top, inside the hand clip).
export const PalmDent: React.FC<{c: Cam3; amount: number; x0: number; x1: number}> = ({c, amount, x0, x1}) =>
  amount <= 0 ? null : (
    <g transform={horiz(c, HAND3.palmTop)} opacity={amount}>
      <ellipse cx={(x0 + x1) / 2} cy={2} rx={(x1 - x0) / 2} ry={9} fill="#9C4A10" opacity={0.55} />
      <ellipse cx={(x0 + x1) / 2} cy={-6} rx={(x1 - x0) / 2} ry={3} fill="#FFC890" opacity={0.6} />
    </g>
  );

// The jet and the droplets in flight (drawn after the hand, before the arm).
export const Jet: React.FC<{c: Cam3; dt: number | null}> = ({c, dt}) => {
  if (dt === null || dt < 0) return null;
  const P = (p: {x: number; d: number; h: number}) => ({x: p.x, y: projY(c, p.d, p.h)});
  const out: React.ReactNode[] = [];
  // continuous stream while emitting: the fluid released over the last 0.09 s, thick at the outlet and thinning
  // toward its head, where it breaks into the separate droplets below
  if (dt < EMIT + 0.09) {
    const e1 = Math.min(dt, EMIT), e0 = Math.max(0, dt - 0.09);
    if (e1 > e0) {
      const v: [number, number, number] = [325 * K, 140 * K, 650 * K];
      const n = 8;
      const pts = Array.from({length: n + 1}).map((_, i) => {
        const e = e0 + ((e1 - e0) * i) / n;
        return P(at(e, v, dt - e));
      });
      for (let i = 0; i < n; i++) {
        const w = 4 + 10 * ((i + 1) / n); // i = n-1 is the segment at the outlet
        out.push(<line key={'j' + i} x1={pts[i].x} y1={pts[i].y} x2={pts[i + 1].x} y2={pts[i + 1].y} stroke={FX.red} strokeWidth={w} strokeLinecap="round" />);
      }
      const d = 'M ' + pts.slice(Math.floor(n / 2)).map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ');
      out.push(<path key="jetHi" d={d} stroke={FX.redLight} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />);
    }
  }
  DROPS.forEach((dr, i) => {
    const a = dt - dr.e;
    if (a <= 0.09 || a >= landTime(dr.v)) return; // still inside the stream until it separates
    const p = P(at(dr.e, dr.v, a));
    // teardrop stretched along the screen-space velocity
    const q = P(at(dr.e, dr.v, a + 0.02));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    out.push(
      <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
        <ellipse cx={0} cy={0} rx={dr.r * 1.5} ry={dr.r} fill={FX.red} />
        <ellipse cx={dr.r * 0.3} cy={-dr.r * 0.35} rx={dr.r * 0.45} ry={dr.r * 0.25} fill={FX.redLight} opacity={0.8} />
      </g>
    );
  });
  return <g>{out}</g>;
};

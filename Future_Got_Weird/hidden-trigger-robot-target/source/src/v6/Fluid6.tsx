// Practical-effects gag on the model hand (a theatrical dramatization, not part of the reported experiment):
// a thin effects line runs from a squeeze-bulb reservoir on the bench into the cuff. V6 aligns the effect with the
// blade: the fluid wells up from the crease the blunt edge presses into the palm, and one short jet (6 frames) leaves
// exactly there, under the pressed middle of the blade edge, moving with the blade as it draws toward the fingertips.
// The droplets arc up and toward the camera (not along the hand toward the wrist) and land on the bench in front of
// the palm, clear of the thumb. The soft prop answers the strike with a small spring-damped dip on its mount.
// Everything is a function of dt = t - contact.
import React from 'react';
import {Cam3, horiz, projY, clamp01} from '../v3/proj';
import {BENCH, HAND3} from '../v3/World3';
import {knifeWorld, KN} from '../v3/rig3';
import {strokePose} from './kin6';

export const FX = {red: '#C8102E', redDark: '#8B0A1E', redLight: '#FF6B7A', tube: '#D7DEE4'};
const G = 3800; // gravity (units/s²): a quick, snappy arc (about 0.5 s of flight)
const EMIT = 0.2; // jet duration (6 frames)
const CREASE_H = HAND3.palmTop - 2; // bottom of the pressed crease
const U_SRC = -44; // the middle of the blade's flat edge (u from -82 to -6)
// The outlet is the pressed point under the blade edge, just in front of the blade plane, at emission time e.
export const origin = (e: number) => ({x: knifeWorld(strokePose(Math.max(0, e))).W(U_SRC, KN.edge).x, d: 6, h: CREASE_H});
// droplets: emission time, velocity (x, d, h), radius. x stays small (slightly toward the fingertips, the stroke
// direction) and fans them out; d carries them toward the camera; h gives a clear rising arc.
const DROPS: {e: number; v: [number, number, number]; r: number}[] = (
  [
    [0.0, -40, 240, 800, 10],
    [0.02, 120, 180, 740, 9],
    [0.04, -150, 300, 760, 10],
    [0.06, 60, 220, 700, 8],
    [0.08, -90, 280, 820, 9],
    [0.1, 160, 190, 680, 7],
    [0.12, 0, 250, 720, 8],
  ] as const
).map(([e, vx, vd, vh, r]) => ({e, v: [vx, vd, vh] as [number, number, number], r}));
const at = (e: number, v: [number, number, number], a: number) => {
  const o = origin(e);
  return {x: o.x + v[0] * a, d: o.d + v[1] * a, h: o.h + v[2] * a - 0.5 * G * a * a};
};
const landTime = (v: [number, number, number]) => {
  const A = 0.5 * G, B = -v[2], C = BENCH.top - CREASE_H;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
};
export const LANDINGS = DROPS.map((dr) => {
  const T = landTime(dr.v);
  return {t: dr.e + T, p: at(dr.e, dr.v, T), r: dr.r};
});
export const OUTLET = origin(0);

// The prop's answer to the strike: a spring-damped rotation about the foot of its mount post (degrees; negative dips
// the fingers). About 0.6° at the peak, settled after ~0.4 s.
export const MOUNT_PIVOT = {x: 918, h: BENCH.top + 10};
export const handJolt = (dt: number | null) => {
  if (dt === null || dt < 0 || dt > 0.6) return 0;
  return -1.6 * (1 - Math.exp(-dt / 0.012)) * Math.exp(-dt / 0.09) * Math.cos((2 * Math.PI * dt) / 0.22);
};
// camera answer: a one-frame punch-in that decays, and a small vertical jolt
export const camPunch = (dt: number | null) => {
  if (dt === null || dt < 0 || dt > 0.6) return {k: 1, dy: 0};
  return {k: 1 + 0.045 * Math.exp(-dt / 0.1), dy: 7 * Math.exp(-dt / 0.05) * Math.sin((2 * Math.PI * dt) / 0.1)};
};

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

// Landed marks on the bench in front of the palm (they persist once landed). Drawn before the hand.
export const BenchMarks: React.FC<{c: Cam3; dt: number | null}> = ({c, dt}) => {
  if (dt === null || dt < 0) return null;
  return (
    <g>
      {LANDINGS.map((L, i) => {
        if (dt < L.t) return null;
        const g = clamp01((dt - L.t) / 0.06);
        return (
          <g key={i} transform={horiz(c, BENCH.top + 1)}>
            <ellipse cx={L.p.x} cy={L.p.d} rx={L.r * (1 + 1.2 * g)} ry={L.r * (0.9 + 1.0 * g)} fill={FX.red} opacity={0.92} />
            <ellipse cx={L.p.x - L.r * 0.4} cy={L.p.d - L.r * 0.4} rx={L.r * 0.5} ry={L.r * 0.35} fill={FX.redLight} opacity={0.6 * g} />
            {g >= 1 && <circle cx={L.p.x + L.r * 2.2} cy={L.p.d + L.r * 1.1} r={L.r * 0.35} fill={FX.red} />}
          </g>
        );
      })}
    </g>
  );
};

// Shadows of the droplets in flight, on the bench (hidden by the hand where they pass behind it).
export const DropShadows: React.FC<{c: Cam3; dt: number | null}> = ({c, dt}) => {
  if (dt === null || dt < 0) return null;
  return (
    <g>
      {DROPS.map((dr, i) => {
        const a = dt - dr.e;
        if (a <= 0 || a >= landTime(dr.v)) return null;
        const p = at(dr.e, dr.v, a);
        const k = clamp01(1 - (p.h - BENCH.top) / 160);
        return (
          <g key={i} transform={horiz(c, BENCH.top + 1)}>
            <ellipse cx={p.x} cy={p.d} rx={dr.r * 0.9} ry={dr.r * 0.7} fill="#0E141A" opacity={0.12 + 0.3 * k} />
          </g>
        );
      })}
    </g>
  );
};

// The crease the blunt edge presses into the soft palm (drawn on the hand top, inside the hand clip), with the fluid
// welling along its front lip from the moment of contact (transient). depth: press depth in units (0..~5).
export const PalmCrease: React.FC<{c: Cam3; depth: number; x0: number; x1: number; dt: number | null}> = ({c, depth, x0, x1, dt}) => {
  const k = clamp01(depth / 4);
  const cx = (x0 + x1) / 2, rx = Math.max(0, (x1 - x0) / 2);
  // fluid at the crease: rises in one frame at the strike, feeds the jet, then drains back into the seam as the blade
  // lifts (the persistent evidence is on the bench)
  const well = dt === null || dt < 0 ? 0 : dt < 0.03 ? dt / 0.03 : dt < EMIT ? 1 : Math.max(0, 1 - (dt - EMIT) / 0.3);
  const o = dt !== null && dt >= 0 ? origin(Math.min(dt, EMIT)) : null;
  return (
    <g>
      {k > 0 && rx > 0 && (
        <g transform={horiz(c, HAND3.palmTop)}>
          {/* raised lips either side of the pressed line, then the shaded trough */}
          <ellipse cx={cx} cy={0} rx={rx + 6} ry={7 + 9 * k} fill="#FFB067" opacity={0.55 * k} />
          <ellipse cx={cx} cy={0} rx={rx} ry={3 + 5 * k} fill="#9C4A10" opacity={0.7 * k} />
        </g>
      )}
      {o && well > 0 && (
        <g transform={horiz(c, HAND3.palmTop)}>
          <ellipse cx={o.x} cy={7} rx={10 + 22 * well} ry={2 + 3.5 * well} fill={FX.red} opacity={0.95} />
          <ellipse cx={o.x - 6} cy={5.5} rx={4 + 8 * well} ry={1.2} fill={FX.redLight} opacity={0.7 * well} />
        </g>
      )}
    </g>
  );
};

// The jet and the droplets in flight (drawn in front of the arm: they leave the front of the blade toward the camera).
export const Jet: React.FC<{c: Cam3; dt: number | null}> = ({c, dt}) => {
  if (dt === null || dt < 0) return null;
  const P = (p: {x: number; d: number; h: number}) => ({x: p.x, y: projY(c, p.d, p.h)});
  const out: React.ReactNode[] = [];
  // continuous stream while emitting: the fluid released over the last 0.08 s, thick at the outlet and thinning
  // toward its head, where it breaks into the separate droplets below
  if (dt < EMIT + 0.08) {
    const e1 = Math.min(dt, EMIT), e0 = Math.max(0, dt - 0.08);
    if (e1 > e0) {
      const v: [number, number, number] = [5, 225, 760];
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
    if (a <= 0.07 || a >= landTime(dr.v)) return; // still inside the stream until it separates
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

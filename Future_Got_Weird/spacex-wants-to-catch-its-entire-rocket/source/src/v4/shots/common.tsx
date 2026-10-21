// Shared set-ups for V2 shots: the catch set under a sky, flying-vehicle framing, approach kinematics.
import React from 'react';
import {Cam3, V3} from '../cam3';
import {ArmState, CatchSet, Light, Place, RAIL_DY, VX, azFor, palFor} from '../site';
import {Booster, Pal, Ship, ShipProps, BoosterProps} from '../vehicles';
import {Clouds, Frame, Sky, SkyName, skyOf} from '../scene';
import {clamp, easeOut, lerp, noise, prog} from '../../kit/anim';

export {clamp, lerp, prog};

/** Ship base height (world Y) when its support fittings rest on the rail of an arm set at carriage height carY. */
export const shipRestY = (carY: number) => carY + RAIL_DY - 35.1;
/** Same for the boosters (V3: catch points on the grid fins; V1: separate catch pins). */
export const boosterRestY = (carY: number, v: 'v3' | 'v1') => carY + RAIL_DY - (v === 'v3' ? 66.6 : 66.4);

/** Powered approach: height above rest from h0 at t0 down to 0 at t1, decelerating to zero (no snap), then a small settle. */
export const approach = (t: number, t0: number, t1: number, h0: number, settle = 0.35) => {
  if (t <= t0) return h0;
  if (t < t1) {
    const u = (t - t0) / (t1 - t0);
    return h0 * Math.pow(1 - u, 2.2);
  }
  // load transfer: the arms take the weight, a slight settle that damps out
  const v = t - t1;
  return -settle * (1 - Math.exp(-v * 4)) - settle * 0.25 * Math.exp(-v * 3) * Math.sin(v * 9);
};
/** Engine throttle for a powered approach: on, then cut shortly after contact. */
export const throttle = (t: number, t0: number, t1: number, cut = 0.5) => clamp(prog(t, t0 - 0.4, t0) * (1 - prog(t, t1, t1 + cut)));

export type CatchViewProps = {
  t: number; c: Cam3; l: Light; s: ArmState; sky?: SkyName; vehicle?: React.ReactNode; clouds?: boolean; hiRail?: number; hiTruss?: number; load?: number;
  hiCarriage?: number; overlay?: React.ReactNode; mount?: boolean; farm?: boolean; sun?: [number, number]; under?: React.ReactNode; fore?: React.ReactNode;
};
export const CatchView: React.FC<CatchViewProps> = ({t, c, l, s, sky, vehicle, clouds = true, overlay, sun, under, ...rest}) => (
  <Frame>
    <Sky k={sky ?? skyOf(l)} sun={sun ?? (l === 'dusk' ? [1500, 760] : undefined)} />
    {under}
    {clouds ? <Clouds n={7} seed={3} y0={60} y1={380} dx={t * 6 - c.at[0] * c.z * 0.15} dy={c.at[1] * c.z * 0.12} s={0.9} tint={l === 'dusk' ? '#f3c0a6' : l === 'night' ? '#253049' : '#f4f6f8'} o={l === 'night' ? 0.6 : 0.75} /> : null}
    <CatchSet c={c} l={l} s={s} vehicle={vehicle} {...rest} />
    {overlay}
  </Frame>
);

/** A ship placed in the catch set (fittings over the rail when `above` = 0). */
export const ShipAt: React.FC<{c: Cam3; carY: number; above: number; dx?: number; dz?: number; tilt?: number; heading?: number; l: Light; props?: ShipProps}> = ({
  c, carY, above, dx = 0, dz = 0, tilt = 0, heading = 90, l, props = {},
}) => {
  const p: V3 = [VX + dx, shipRestY(carY) + above, dz];
  return (
    <Place c={c} p={p} tilt={tilt}>
      <Ship az={azFor(c, heading)} pal={palFor(l) as Pal} {...props} />
    </Place>
  );
};
export const BoosterAt: React.FC<{c: Cam3; carY: number; above: number; v: 'v3' | 'v1'; dx?: number; tilt?: number; heading?: number; l: Light; props?: BoosterProps}> = ({
  c, carY, above, v, dx = 0, tilt = 0, heading = 0, l, props = {},
}) => (
  <Place c={c} p={[VX + dx, boosterRestY(carY, v) + above, 0]} tilt={tilt}>
    <Booster az={azFor(c, heading)} version={v} pal={palFor(l) as Pal} {...props} />
  </Place>
);

/** Screen-space vehicle in flight (sky shots): position, roll in screen, scale px/m. */
export const InFlight: React.FC<{x: number; y: number; rot: number; z: number; children: React.ReactNode}> = ({x, y, rot, z, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${z})`}>{children}</g>
);

/** Rotate a local point (metres) of an in-flight vehicle to screen. */
export const localToScreen = (x: number, y: number, rot: number, z: number, lx: number, ly: number): [number, number] => {
  const r = (rot * Math.PI) / 180;
  return [x + (lx * Math.cos(r) - ly * Math.sin(r)) * z, y + (lx * Math.sin(r) + ly * Math.cos(r)) * z];
};

/** Speed streaks (screen space) moving along a direction, for falling/flying shots. */
export const Streaks: React.FC<{t: number; dir: [number, number]; n?: number; k?: number; color?: string; seed?: number}> = ({t, dir, n = 26, k = 1, color = 'rgba(255,255,255,0.35)', seed = 2}) => {
  if (k <= 0.01) return null;
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / len, uy = dir[1] / len;
  return (
    <g opacity={k}>
      {Array.from({length: n}, (_, i) => {
        const ph = (t * (0.9 + (i % 5) * 0.15) + (i * 0.6180339) % 1) % 1;
        const bx = ((i * 397) % 1920) + noise(i, seed) * 80;
        const by = ((i * 211) % 1080) + noise(i, seed + 3) * 60;
        const off = (ph - 0.5) * 2600;
        const x = ((bx + ux * off) % 2200 + 2200) % 2200 - 140, y = ((by + uy * off) % 1300 + 1300) % 1300 - 110;
        const L = 80 + (i % 4) * 50;
        return <line key={i} x1={x} y1={y} x2={x - ux * L} y2={y - uy * L} stroke={color} strokeWidth={2 + (i % 3)} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const easeO = easeOut;

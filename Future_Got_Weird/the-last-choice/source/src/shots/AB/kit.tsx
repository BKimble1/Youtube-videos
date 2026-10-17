// Group AB helpers: the burning sky, the far district (viaduct → refuge) as a backdrop that any shot can place at a
// given screen scale, small machine formations, and a few staging utilities.
import React from 'react';
import {Cam, inkFor, layerZoom} from '../../kit/cam';
import {CITY, C, F} from '../../theme';
import {clamp, lerp, noise, rnd, smooth} from '../../kit/math';
import {SkylineFar, Facades, Street, BrokenSpan, Viaduct, ViaductFront, Landing, LandingFront, Gantry, TerraceBack, TerraceFront} from '../../sets/city';
import {RefugeExterior, REFUGE, AidSymbol} from '../../sets/refuge';
import {River, FarBank, CantileverBridge, Esplanade, LandingStairs} from '../../sets/refugeFar';
import {Glow} from '../../fx/light';
import {Smoke} from '../../fx/smoke';
import {Drone} from '../../mech';

export const ink = (cam: Cam, p = 1, s = 1) => inkFor(layerZoom(cam, p), s);

/** Screen-space burning sky: dark top → ember low, with a soft fire glow band. */
export const BurningSky: React.FC<{id: string; top?: string; mid?: string; low?: string; glowY?: number; glow?: number}> = ({id, top = CITY.skyTop, mid = CITY.skyMid, low = CITY.skyLow, glowY = 760, glow = 0.5}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={top} />
        <stop offset="55%" stopColor={mid} />
        <stop offset="100%" stopColor={low} />
      </linearGradient>
    </defs>
    <rect x={-20} y={-20} width={1960} height={1120} fill={`url(#${id})`} />
    {glow > 0 && <Glow x={960} y={glowY} r={1300} color={CITY.haze} opacity={0.35 * glow} squash={0.35} id={`${id}g`} />}
  </g>
);

/** World group placed so world point (wx, wy) lands on screen (sx, sy) at scale k. */
export const Place: React.FC<{wx: number; wy: number; sx: number; sy: number; k: number; children: React.ReactNode; opacity?: number}> = ({wx, wy, sx, sy, k, children, opacity}) => (
  <g transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)}) scale(${k.toFixed(5)}) translate(${(-wx).toFixed(2)} ${(-wy).toFixed(2)})`} opacity={opacity}>{children}</g>
);
/** Ink (world units) for a group drawn at scale k so it lands near `px` screen pixels. */
export const inkAt = (k: number, px = 2.4) => px / k;

/** The far side of the district at its geographic positions: the viaduct with the broken span and gantry, the
 *  landing and stairs, the esplanade, the river and the refuge (glowing, with its aid symbol boosted for the wide).
 *  World coords; place it with <Place>. */
export const District: React.FC<{t: number; k: number; x0?: number; facades?: boolean; refugeGlow?: number; symbolPx?: number; river?: boolean; street?: boolean; seed?: number}> = ({t, k, x0 = 5600, facades = true, refugeGlow = 1, symbolPx = 16, river = true, street = true, seed = 3}) => {
  const ik = inkAt(k, 2.2);
  const st = {u: 0, swing: 0, lever: 0};
  const sym = {x: 16000 + REFUGE.symbol.x, y: REFUGE.symbol.y};
  return (
    <g>
      {river && <River x0={13000} x1={26000} y={30} depth={1570} t={t} time="day" seed={seed} ink={ik} />}
      {river && <FarBank x0={17500} x1={26000} y={-200} t={t} time="evening" seed={seed + 2} ink={ik} height={900} />}
      {river && <CantileverBridge x={21000} y={-150} w={6200} h={1100} time="evening" ink={ik} />}
      {facades && <Facades x0={x0} x1={9500} t={t} ink={ik} seed={7} burn={0.25} />}
      {street && <Street x0={x0} x1={14600} t={t} ink={ik} debris={0.4} />}
      <Esplanade x0={14400} x1={16100} t={t} time="evening" ink={ik} seed={seed} />
      <BrokenSpan t={t} ink={ik} />
      <Viaduct t={t} ink={ik} />
      <Landing t={t} ink={ik} barrier={0} />
      <LandingStairs xTop={13500} yTop={-1600} xBottom={14500} yBottom={0} ink={ik} time="evening" />
      <Gantry {...st} t={t} ink={ik} layer="all" />
      <ViaductFront ink={ik} />
      <LandingFront ink={ik} />
      <Glow x={17500} y={-700} r={2600} color="#FFE2A8" opacity={0.35 * refugeGlow} id={`dgl${seed}`} />
      <RefugeExterior x={16000} y={0} scale={1} t={t} ink={ik} far glow={refugeGlow} time="day" seed={seed} glints={1} />
      {/* the aid symbol, boosted so it stays readable at wide-shot scale */}
      {symbolPx > 0 && <AidSymbol x={sym.x} y={sym.y - (symbolPx / k - REFUGE.symbol.r) * 0.6} r={Math.max(REFUGE.symbol.r, symbolPx / k / 2)} ink={ik} glow={0.9 * refugeGlow} seed={seed + 40} />}
    </g>
  );
};

/** A loose formation of surveillance drones (screen or world, whatever the parent transform is). */
export const DroneFormation: React.FC<{x: number; y: number; t: number; s: number; n?: number; dx?: number; dy?: number; seed?: number; ink?: number; drift?: number; look?: {x: number; y: number}; lock?: number}> = ({x, y, t, s, n = 5, dx = 260, dy = 70, seed = 1, ink, drift = 40, look, lock = 0}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const row = i % 2;
      const px = x + (i - (n - 1) / 2) * dx * s + noise(t * 0.4 + i, seed + i) * 14 * s + drift * t * s;
      const py = y + row * dy * s + noise(t * 0.5 + i * 3, seed * 3 + i) * 10 * s;
      return <Drone key={i} x={px} y={py} s={s} t={t + i * 0.13} seed={seed * 10 + i} ink={ink} face={0.85} tilt={6} look={look ?? {x: 0.3, y: 0.6}} lock={lock} />;
    })}
  </g>
);

/** Drifting smoke bank (screen-space or world) — wraps Smoke cloud. */
export const SmokeBank: React.FC<{x: number; y: number; w: number; h: number; t: number; seed?: number; n?: number; color?: string; opacity?: number; drift?: number}> = ({x, y, w, h, t, seed = 1, n = 9, color = CITY.smoke, opacity = 0.8, drift = 30}) => (
  <Smoke mode="cloud" x={x} y={y} w={w} h={h} n={n} t={t} seed={seed} color={color} opacity={opacity} drift={drift} />
);

/** Small series caption (the one location/date overlay). */
export const Caption: React.FC<{text: string; t: number; t0: number; t1: number}> = ({text, t, t0, t1}) => {
  const a = clamp((t - t0) / 0.45) * clamp((t1 - t) / 0.55);
  if (a <= 0) return null;
  const rise = (1 - smooth(clamp((t - t0) / 0.6))) * 10;
  return (
    <g opacity={a}>
      <text x={96} y={986 + rise} fontFamily={F.display} fontSize={40} fontWeight={600} letterSpacing={5} fill={C.cream} stroke="rgba(20,12,16,0.55)" strokeWidth={5} paintOrder="stroke">{text}</text>
    </g>
  );
};

/** Ease a value through key times (thin wrapper with clamped smoothstep). */
export const ease = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a)));
export const mixv = (a: number, b: number, t: number) => lerp(a, b, clamp(t));

/** Deterministic breathing / idle sway for a figure. */
export const sway = (t: number, seed: number, amp = 1) => noise(t * 0.6, seed) * amp;
export const jitter = (seed: number) => rnd(seed) - 0.5;

export {Facades, Street, SkylineFar, TerraceBack, TerraceFront};

/** World point of layer p that lands on screen (sx, sy) under camera c (inverse of the layer transform, no rotation). */
export const layerWorld = (c: Cam, p: number, sx: number, sy: number) => {
  const z = layerZoom(c, p);
  return {x: (sx - 960) / z + c.x * p + (1 - p) * 960, y: (sy - 540) / z + c.y * p + (1 - p) * 540};
};
/** Screen y of a world y on the action plane (p = 1). */
export const screenY = (c: Cam, y: number) => 540 + (y - c.y) * c.z;

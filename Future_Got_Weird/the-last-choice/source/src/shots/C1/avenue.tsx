// The avenue's last stretch (set piece 1) and the viaduct catwalk (set piece 2), assembled from the city kit for
// group C1. One district, west → east = screen left → right: terrace stairs (5650 → 6410), the pier stair (6600 →
// catwalk at 7450), pier 1 (7400), the wreck-choked stretch under the viaduct with its one clear lane (the gap,
// around 7600–8600), the steam vent on the catwalk (8500). Lanes give 2.5D depth on the street: far lane y ≈ −35
// (behind the Crew), the Crew's lane y = 0, near lane y ≈ +300 (in front).
import React from 'react';
import {Cam, Layer, inkFor, layerZoom} from '../../kit/cam';
import {CITY} from '../../theme';
import {clamp, lerp} from '../../kit/math';
import {SkylineFar, Facades, Street, Viaduct, ViaductFront, TerraceBack, TerraceFront, Taxi, Rubble, Streetlight, TrafficLight, Flames, Glow as CityGlow} from '../../sets/city';
import {AutoCar, Hauler, PoleCam, Drone} from '../../mech';

export const VENT_X = 8500;
export const POLE = {x: 7700, y: 620, s: 2.1, h: 720};
// the burned taxi standing in the clear lane at the gap's narrow point (the hauler crushes and shoves it)
export const GAP_TAXI = {x: 8550, y: 40};
// hauler: parked behind the far-lane wreck, facing west
export const HAULER = {s: 0.82, y0: -34, y1: 26, park: 10750};

/** Inverse of toScreen for a layer: the layer-space point that lands on screen (sx, sy). */
export const layerPt = (c: Cam, p: number, sx: number, sy: number) => {
  const z = layerZoom(c, p);
  return {x: (sx - 960) / z + c.x * p + (1 - p) * 960, y: (sy - 540) / z + c.y * p + (1 - p) * 540};
};

/** Sky, skyline and the far row of buildings: everything behind the street. */
export const AvenueSky: React.FC<{cam: Cam; t: number; fire?: number}> = ({cam, t, fire = 1}) => {
  const p = 0.12;
  const a = layerPt(cam, p, -200, 0), b = layerPt(cam, p, 2120, 0);
  // skyline base sits at the facades' roofline region on screen (hidden below by the facades)
  const base = layerPt(cam, p, 0, clamp(560 + (0 - cam.y) * cam.z * 0.25, 380, 900)).y;
  return (
    <Layer cam={cam} p={p}>
      <SkylineFar x0={a.x} x1={b.x} base={base} h={1.05} t={t} ink={2.2} fire={fire} />
    </Layer>
  );
};

export type AvenueState = {
  t: number; ink: number;
  vent?: number;
  taxi?: {shift: number; dents: number; broken: number; tilt: number; lift: number};
};

/** Back of the action plane: facades, street, terrace, viaduct (piers, stair, catwalk floor, pipes, vent). */
export const AvenueBack: React.FC<AvenueState & {x0?: number; x1?: number}> = ({t, ink, vent = 1, x0 = 3200, x1 = 13800}) => (
  <g>
    <Facades x0={x0} x1={x1} t={t} ink={ink} seed={7} burn={0.2} />
    <Street x0={x0} x1={x1} t={t} ink={ink} manholes={[9700]} seed={11} />
    <Streetlight x={6900} t={t} lit={0} ink={ink} bent={6} seed={3} />
    <TrafficLight x={9350} t={t} ink={ink} />
    <TerraceBack ink={ink} />
    <TerraceFront ink={ink} />
    <Viaduct t={t} ink={ink} ventX={VENT_X} vent={vent} />
  </g>
);

/** The wrecks that choke the stretch under the viaduct. Far lane: drawn before the Crew. */
export const WrecksFar: React.FC<{t: number; ink: number}> = ({t, ink}) => (
  <g>
    <AutoCar x={8560} y={-36} s={0.9} t={t} ink={ink} variant={3} wreck={0.85} sensor={0} seed={21} />
    <Rubble x={9420} y={-24} w={560} h={190} ink={ink} seed={5} />
    <AutoCar x={9720} y={-30} s={0.82} t={t} ink={ink} variant={4} wreck={1} sensor={0} seed={24} dir={-1} />
    <g transform="translate(9700 -330)"><Flames w={300} h={260} t={t} seed={12} n={4} /></g>
  </g>
);
/** Near lane wrecks (in front of the Crew's lane). */
export const WrecksNear: React.FC<{t: number; ink: number}> = ({t, ink}) => (
  <g>
    <AutoCar x={8380} y={350} s={0.95} t={t} ink={ink} variant={1} wreck={0.9} sensor={0} seed={22} />
    <Rubble x={9250} y={350} w={640} h={200} ink={ink} seed={11} />
  </g>
);
/** The burned taxi in the clear lane (crushed and shoved by the hauler in C3). */
export const GapTaxi: React.FC<{t: number; ink: number; shift?: number; dents?: number; broken?: number; tilt?: number; lift?: number}> = ({t, ink, shift = 0, dents = 0.6, broken = 0.7, tilt = 0, lift = 0}) => (
  <Taxi x={GAP_TAXI.x} y={GAP_TAXI.y} shiftX={shift} dents={dents} broken={broken} tilt={tilt} lift={lift} ink={ink} t={t} seed={17} dir={-1} />
);

/** The front of the viaduct (deck guardrail, catwalk outer railing, stair handrail) — in front of the Crew. */
export const AvenueViaductFront: React.FC<{ink: number; catwalk?: boolean}> = ({ink, catwalk = true}) => <ViaductFront ink={ink} catwalk={catwalk} />;

/** The pole camera at the corner (near sidewalk, in front of everything on the street). */
export const Pole: React.FC<{t: number; ink: number; pan: number; lock: number; look?: {x: number; y: number}}> = ({t, ink, pan, lock, look}) => (
  <PoleCam x={POLE.x} y={POLE.y} s={POLE.s} height={POLE.h} t={t} ink={ink} pan={pan} lock={lock} look={look} side={-1} seed={4} />
);

/** Warm fire light from the burning facades over the street (screen-agnostic world glow). */
export const FireLight: React.FC<{t: number}> = ({t}) => (
  <g>
    <CityGlow id="c1fl1" cx={6200} cy={-900} rx={2600} ry={1400} color={CITY.fire} op={0.16 + 0.03 * Math.sin(t * 3.1)} />
    <CityGlow id="c1fl2" cx={9600} cy={-700} rx={2200} ry={1200} color={CITY.fire} op={0.12 + 0.03 * Math.sin(t * 2.3 + 1)} />
  </g>
);

export {AutoCar, Hauler, Drone, lerp, inkFor, layerZoom};

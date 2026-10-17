// Group C2: the crossing set as one scene, drawn for a camera at film time T with figure slots in their depth places.
//   sky → far skyline (p .06) → waterfront / far bank (p .26) → [action plane] road + broken span, viaduct, landing,
//   stairs, esplanade, refuge → deckBack (breaker) → gantry back → walk (walkway figures) → gantry walkFront →
//   deck + landing figures → gantry basketBack → basket riders → gantry basketFront → deck guardrail → catwalk /
//   ladder figures → catwalk outer railing → front → air (drones, charge, blast, debris) → foreground haze → grade.
import React from 'react';
import {Cam, Layer, inkFor, layerZoom} from '../../kit/cam';
import {CITY, REF} from '../../theme';
import {clamp} from '../../kit/math';
import {Facades, Street, BrokenSpan, Viaduct, ViaductFront, Landing, LandingFront, Gantry, SkylineFar, Flames} from '../../sets/city';
import {RefugeExterior, REFUGE} from '../../sets/refuge';
import {River, FarBank, CantileverBridge, Esplanade, LandingStairs} from '../../sets/refugeFar';
import {Glow} from '../../fx/light';
import {Smoke, Embers} from '../../fx';
import {gantryAt, barrierAt, REF_X, LADDER_X} from './world';
import {Cast} from '../../rig/actor';

export type Slots = Partial<Record<'deckBack' | 'walk' | 'deck' | 'landing' | 'basket' | 'catwalk' | 'front' | 'air' | 'far', React.ReactNode>>;

export const ik = (cam: Cam, p = 1, s = 1) => inkFor(layerZoom(cam, p), s);

/** Screen-space burning dusk. */
export const Sky: React.FC<{id: string; warm?: number}> = ({id, warm = 1}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CITY.skyTop} />
        <stop offset="50%" stopColor={CITY.skyMid} />
        <stop offset="88%" stopColor={CITY.skyLow} />
        <stop offset="100%" stopColor={CITY.haze} />
      </linearGradient>
    </defs>
    <rect x={-20} y={-20} width={1960} height={1120} fill={`url(#${id})`} />
    <Glow x={1500} y={900} r={1100} color="#FFD9A0" opacity={0.18 * warm} squash={0.45} id={`${id}w`} />
  </g>
);

export type SceneProps = {
  T: number; t: number; cam: Cam; slots?: Slots; id: string;
  refuge?: boolean; refugeDoors?: number; stairs?: boolean; showBreakerFire?: boolean; haze?: number; gaps?: [number, number][];
  esplanade?: boolean; facades?: boolean; road?: boolean;
};

/** Far district for every crossing shot (fixed world coordinates in its layers so pans parallax cleanly). */
const Far: React.FC<{T: number; t: number; cam: Cam}> = ({t, cam}) => {
  const k1 = 2.2 / layerZoom(cam, 0.06), k2 = 2.2 / layerZoom(cam, 0.2);
  return (
    <g>
      <Layer cam={cam} p={0.06}>
        <SkylineFar x0={-900} x1={3600} base={980} h={1.05} t={t} ink={k1} sky={false} seed={5} fire={0.9} />
      </Layer>
      <Layer cam={cam} p={0.2}>
        <SkylineFar x0={1200} x1={6400} base={1240} h={0.62} t={t + 7} ink={k2} sky={false} seed={11} fire={0.6} />
      </Layer>
    </g>
  );
};

export const CrossingScene: React.FC<SceneProps> = ({T, t, cam, slots = {}, id, refuge = true, refugeDoors = 0, stairs = true, haze = 1, gaps = [[9840, 10500]], esplanade = true, facades = true, road = true}) => {
  const st = gantryAt(T);
  const ink = ik(cam);
  const bar = barrierAt(T);
  return (
    <g>
      <Sky id={`${id}sky`} />
      <Far T={T} t={t} cam={cam} />
      {slots.far}
      <Layer cam={cam} p={1}>
        {facades && <Facades x0={5200} x1={10100} t={t} ink={ink} seed={7} burn={0.3} />}
        {road && <Street x0={5200} x1={14380} t={t} ink={ink} debris={0.5} />}
        {/* waterfront: the river wall and the water beyond the road under the gap */}
        {esplanade && <River x0={14300} x1={22000} y={60} depth={3000} t={t} time={2.55} seed={4} ink={ink} lights={[16300, 17500, 18700]} />}
        <BrokenSpan t={t} ink={ink} road={road} />
        <Viaduct t={t} ink={ink} x0={7200} vent={0.7} ladderX={LADDER_X} />
        <Landing t={t} ink={ink} barrier={bar} />
        {stairs && <LandingStairs xTop={13500} yTop={-1600} xBottom={14500} yBottom={0} ink={ink} time="evening" />}
        {esplanade && <Esplanade x0={14400} x1={REF_X + 100} t={t} time="evening" ink={ink} seed={3} />}
        {refuge && (
          <g>
            <Glow x={REF_X + 1500} y={-700} r={2600} color="#FFE2A8" opacity={0.32} squash={0.6} id={`${id}rg`} />
            <RefugeExterior x={REF_X} y={0} t={t} doors={refugeDoors} time={2.15} ink={ink} seed={2} glints={1} />
          </g>
        )}
        {slots.deckBack}
        <Gantry {...st} t={t} ink={ink} layer="back" />
        {slots.walk}
        <Gantry {...st} t={t} ink={ink} layer="walkFront" />
        {slots.deck}
        {slots.landing}
        <Gantry {...st} t={t} ink={ink} layer="basketBack" />
        {slots.basket}
        <Gantry {...st} t={t} ink={ink} layer="basketFront" />
        <ViaductFront ink={ink} gaps={gaps} catwalk={false} stair={false} />
        <LandingFront ink={ink} />
        {slots.catwalk}
        <ViaductFront ink={ink} deckRail={false} stair={false} />
        {slots.front}
        {slots.air}
      </Layer>
      {haze > 0 && (
        <Layer cam={cam} p={1.25}>
          <Smoke mode="cloud" x={12000} y={-1100} w={9000} h={900} n={7} t={t} seed={41} color="#3A2F33" opacity={0.18 * haze} drift={-30} id={`${id}hz`} />
        </Layer>
      )}
      {void clamp}{void REF}{void REFUGE}{void Flames}{void Embers}
    </g>
  );
};

/** Group placed figures into scene slots (each slot is depth-sorted as one Cast). */
export const slotsOf = (placed: {slot: string; p: import('../../rig/actor').ActorProps; key: string}[], ink: number, extra: Slots = {}): Slots => {
  const by: Record<string, import('../../rig/actor').ActorProps[]> = {};
  placed.forEach((q) => { (by[q.slot] = by[q.slot] ?? []).push({ink, ...q.p}); });
  const out: Slots = {...extra};
  Object.entries(by).forEach(([k, actors]) => {
    const prev = (out as Record<string, React.ReactNode>)[k];
    (out as Record<string, React.ReactNode>)[k] = <g>{prev}<Cast actors={actors} /></g>;
  });
  return out;
};

// Set piece 2 — the steel catwalk under the viaduct deck (outboard, floor y = −1250) with the broken steam pipe at
// VENT_X: the steam pours out and hangs in a cloud over the street, which the builder turns into a screen. One layer
// stack for C5–C8: sky, facades, street (+ the sealed gap and the machines), viaduct, the Crew on the catwalk, the
// outer railing (breakable bay for C8), steam in front.
import React from 'react';
import {Cam, Frame, Grade, Layer, inkFor} from '../../kit/cam';
import {Cast, ActorProps} from '../../rig/actor';
import {SYS} from '../../theme';
import {Steam, Embers, Glow} from '../../fx';
import {Facades, Street, Viaduct, ViaductFront, TerraceBack, TerraceFront, CATWALK, DECK} from '../../sets/city';
import {AvenueSky, WrecksFar, WrecksNear, GapTaxi, FireLight, Hauler, AutoCar, HAULER, VENT_X} from './avenue';
import {hauler, gapTaxi, car, CARS} from './machines';
import {CatwalkRail, SteelColumn, DavitHook} from './kit';
import {K} from '../../sets/cityKit';

export {CATWALK, DECK, VENT_X};
export const COLUMN_X = 8640; // steel hanger column the warden is smashed into (C8)
export const DAVIT = {px: 9000, py: -1960, L: 410};
// the steam cloud the decoy is projected on (hangs below and west of the vent)
export const CLOUD = {x0: 7520, y0: -1420, x1: 8620, y1: -330};

export type CatwalkSceneProps = {
  cam: Cam; T: number; crew: ActorProps[]; id: string;
  extraParts?: {z: number; el: React.ReactElement}[];
  street?: React.ReactNode; back?: React.ReactNode; onCloud?: React.ReactNode; front?: React.ReactNode; screen?: React.ReactNode;
  rail?: {bay?: [number, number]; bend?: number; hide?: boolean};
  hook?: {theta: number}; column?: {dent: number};
  steam?: number; flash?: number; shakeInk?: number;
};

// the cloud as a few overlapping billows (lumpy, not a disc): poured from the vent, drifting down and west
export const CLOUD_PARTS = [
  {x0: 8230, y0: -1470, x1: 8700, y1: -1040, seed: 8},
  {x0: 7840, y0: -1360, x1: 8340, y1: -900, seed: 9},
  {x0: 7540, y0: -1160, x1: 8040, y1: -660, seed: 10},
  {x0: 8000, y0: -980, x1: 8540, y1: -470, seed: 11},
  {x0: 7640, y0: -760, x1: 8140, y1: -330, seed: 12},
  {x0: 8280, y0: -720, x1: 8660, y1: -380, seed: 13},
];
export const SteamCloud: React.FC<{T: number; amt?: number; id: string}> = ({T, amt = 1, id}) => (
  <g>
    {CLOUD_PARTS.map((c, i) => <Steam key={i} mode="cloud" t={T} x0={c.x0} y0={c.y0} x1={c.x1} y1={c.y1} density={0.55} opacity={0.42 * amt} seed={c.seed} id={`${id}sc${i}`} />)}
    <Steam mode="jet" t={T} x={VENT_X - 30} y={-1300} dir={150} length={520} width={220} rate={30} opacity={0.75 * amt} seed={9} id={`${id}sj`} />
  </g>
);
export const CatwalkScene: React.FC<CatwalkSceneProps> = ({cam, T, crew, id, extraParts, street, back, onCloud, front, screen, rail, hook, column, steam = 1, flash = 0}) => {
  const ink = inkFor(cam.z);
  const h = hauler(T);
  const gt = gapTaxi(T);
  return (
    <Frame bg={'#2B1B26'}>
      <AvenueSky cam={cam} t={T} />
      <Layer cam={cam}>
        <Facades x0={3200} x1={13800} t={T} ink={ink} seed={7} burn={0.2} />
        <Street x0={3200} x1={13800} t={T} ink={ink} manholes={[9700]} seed={11} />
        <TerraceBack ink={ink} />
        <TerraceFront ink={ink} />
        <FireLight t={T} />
        {/* the sealed gap below */}
        <WrecksFar t={T} ink={ink} />
        <Hauler x={h.x} y={h.y} s={HAULER.s} dir={-1} t={T} dist={h.d} ink={ink} lights={1} lock={1} crush={h.crush} seed={3} glow={0.8} />
        <GapTaxi t={T} ink={ink} shift={gt.shift} dents={gt.dents} broken={gt.broken} tilt={gt.tilt} />
        {CARS.map((_, i) => { const c = car(i, T); return <AutoCar key={i} x={c.x} y={c.y} s={0.85} dir={c.dir} t={T} dist={c.dist} ink={ink} variant={c.variant} sensor={1} lights={1} lock={1} seed={c.seed} />; })}
        {street}
        <WrecksNear t={T} ink={ink} />
        <Viaduct t={T} ink={ink} ventX={VENT_X} vent={0} />
        {column && <SteelColumn x={COLUMN_X} y0={-1510} y1={CATWALK} ink={ink} dent={column.dent} />}
        {back}
        <Cast actors={crew} extra={extraParts} />
        {hook && <DavitHook px={DAVIT.px} py={DAVIT.py} L={DAVIT.L} theta={hook.theta} ink={ink} deckY={DECK} t={T} />}
        <ViaductFront ink={ink} catwalk={false} />
        {rail?.hide ? <rect x={7450} y={CATWALK + 20} width={2930} height={40} fill={K.steelDark} stroke="#162A32" strokeWidth={ink * 0.8} />
          : <CatwalkRail x0={7450} x1={10380} y={CATWALK} ink={ink} bay={rail?.bay} bend={rail?.bend} steel={K.steel} steelDark={K.steelDark} />}
        {steam > 0 && <SteamCloud T={T} amt={steam} id={id} />}
        {onCloud}
        <Embers x={8600} y={-900} w={3400} h={1800} t={T} n={18} seed={14} />
        {front}
      </Layer>
      {screen}
      <Grade tint="#3A1810" tintOp={0.16} vignette={0.45} id={`${id}vg`} flash={flash} />
    </Frame>
  );
};
export {Glow, SYS};

// ------------------------------------------------------------------ the decoy: projected walkers on the steam
import {steamBlobs, LightShaft} from '../../fx';
import {Actor} from '../../rig/actor';
import {CAST} from '../../rig/looks';
import {mover, G_WALK} from './kit';
import {clamp as clamp01x} from '../../kit/math';

export const PROJ = {x: 8950, y: -1386}; // lens of the clip-on projector on the railing
export const FIELD = {cx: 8080, cy: -880, w: 1250, h: 1060};
const WALKERS = [CAST.clerkC, CAST.honest, CAST.checker, CAST.clerkB];

/** Bright field + four giant shadow walkers heading west, clipped to the steam cloud. on 0..1 (lamp warm-up);
 *  shadow: a dark occluder (e.g. a drone in the beam) drawn as a silhouette on the field. */
export const Projection: React.FC<{T: number; t0: number; on: number; id: string; occluder?: React.ReactNode; beam?: number; ink: number}> = ({T, t0, on, id, occluder, beam = 1, ink}) => {
  if (on <= 0) return null;
  const tau = Math.max(0, T - t0);
  const fl = 0.92 + 0.08 * Math.sin(T * 37) * Math.sin(T * 11);
  const cid = `${id}clip`;
  const fx0 = FIELD.cx - FIELD.w / 2, fy0 = FIELD.cy - FIELD.h / 2;
  const ground = FIELD.cy + FIELD.h * 0.38;
  const ang = (Math.atan2(FIELD.cy - PROJ.y, FIELD.cx - PROJ.x) * 180) / Math.PI;
  const len = Math.hypot(FIELD.cx - PROJ.x, FIELD.cy - PROJ.y);
  return (
    <g>
      <defs>
        <clipPath id={cid}>{CLOUD_PARTS.flatMap((c, k) => steamBlobs({mode: 'cloud', t: T, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, density: 0.55, seed: c.seed}).map((b, i) => <circle key={`${k}_${i}`} cx={b.x} cy={b.y} r={b.r * 0.78} />))}</clipPath>
      </defs>
      {beam > 0 && <LightShaft x={PROJ.x} y={PROJ.y} angle={ang} length={len * 1.05} w0={18} w1={FIELD.h * 0.95} color="#FFF3D0" opacity={0.22 * on * beam * fl} id={`${id}sh`} />}
      <g clipPath={`url(#${cid})`} opacity={on * fl}>
        <rect x={fx0} y={fy0} width={FIELD.w} height={FIELD.h} rx={40} fill="#FFF0C8" opacity={0.55} />
        <rect x={fx0 + 40} y={fy0 + 30} width={FIELD.w - 80} height={FIELD.h - 60} rx={60} fill="#FFF6DE" opacity={0.35} />
        {WALKERS.map((lk, i) => {
          const s = [1.95, 1.8, 1.9, 1.75][i];
          const d = 210 * tau + i * 37;
          const m = mover(lk, {x0: FIELD.cx + 470 - i * 300, dist: d, dir: -1, ground: ground + 60 - [0, 40, 15, 55][i], gait: G_WALK, t: T, s}, {seed: 90 + i, silhouette: '#2B2226', shadow: false, ink});
          // treadmill: the loop walks in place on the screen
          const sh = d;
          return (
            <g key={i} transform={`translate(${sh} 0)`} opacity={0.88}>
              <Actor {...m} />
            </g>
          );
        })}
        {occluder}
      </g>
      {void clamp01x}
    </g>
  );
};

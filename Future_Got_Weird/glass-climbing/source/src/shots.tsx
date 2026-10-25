// The shot list: which scene draws each frame, and each shot's camera. Film frames at 30 fps; the cue words and what
// each shot adds are in production/SHOTS_AND_TRANSITIONS.md.
import React from 'react';
import {BayWorld} from './scenes/BayScene';
import {ThroughGlass, tgTilePos} from './scenes/ThroughGlass';
import {BenchWorld, TILE_STAGE} from './scenes/Bench';
import {B0, MicroContent, MicroState, MicroTurn, MicroTurnContent, MicroView, MW, UM} from './scenes/Micro';
import {SpringScene} from './scenes/Springs';
import {climbAt, easeOut, keyN, ss, Y} from './world/climb';
import {padPt, prPad} from './world/geo';
import {benchAt} from './world/bench';
import {H, W} from './lib';
import {camAt, camZoom, inC, inOut, kOf, outC, sm5} from './camera';
import {clamp} from './dc/math';
import {Cam} from './dc/camera';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);

// ------------------------------------------------------------------ the opening, in the bay (0-132)
/** A (0-20): close on the near hand, pad and glass: the pad seats, the foot below takes its strap tight, the plate
 *  shears down on its tiles */
export const CAM_A0: Cam = {x: 112, y: -790, z: 3.05};
const ShotA: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[0, CAM_A0.x, CAM_A0.y, CAM_A0.z], [20, 108, -768, 3.3, inOut]]);
  return <Svg><BayWorld id={`a${f}`} st={climbAt(f)} cam={cam} k={kOf(cam.z)} obl={1.9} /></Svg>;
};
/** B (20-58): wide: he rises on the left stirrup, the right foot leaves the floor and goes into its stirrup;
 *  C (58-80): up the taut left strap to its pad and in to the contact edge */
const ShotBC: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[20, 250, -640, 1.12], [54, 236, -660, 0.98, inOut], [70, 60, -760, 2.4], [80, 18, -760, 5.2, outC]]);
  return <Svg><BayWorld id={`b${f}`} st={climbAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** D (80-114): low: both feet off the floor, he stands up on the right (its strap taut, the left one slackens) */
const ShotD: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[80, 230, -230, 1.55], [114, 230, -420, 1.4, inOut]]);
  return <Svg><BayWorld id={`d${f}`} st={climbAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** E (114-132): wide and rising: the left pad peels off and is carried up the glass */
const ShotE: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[114, 230, -620, 1.05], [132, 205, -860, 0.86, inOut]]);
  return <Svg><BayWorld id={`e${f}`} st={climbAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** F (132-181): through the glass: the left pad arrives and seats, its tiles darken with contact as his foot takes
 *  the stirrup; the camera pushes into one tile */
const ShotF: React.FC<{f: number}> = ({f}) => {
  const t = tgTilePos();
  const cam = camAt(f, [[132, 30, 300, 1.0], [160, 70, 250, 1.12, inOut], [181, t.x, t.y, 14, inC]]);
  return <Svg><ThroughGlass id={`f${f}`} f={f} cam={cam} k={kOf(cam.z)} /></Svg>;
};

// ------------------------------------------------------------------ the bench sample and the dive (181-232)
/** the micro section's origin on the bench tile (its centre), and the micro camera that continues the dive */
const MICRO_Y0 = -80;
const microRows = (cy: number, z: number, pad = 2) => {
  const half = 960 / z + 200;
  const i0 = Math.floor((cy - half - MICRO_Y0) / MW.pitch) - pad;
  const i1 = Math.ceil((cy + half - MICRO_Y0) / MW.pitch) + pad;
  return {y0: MICRO_Y0 + i0 * MW.pitch, count: Math.max(1, Math.min(400, i1 - i0))};
};
const DIVE_END: Cam = {x: 0, y: 150, z: 6.5};
/** G (181-226): the bench: a spare tile on a rotation stage turns to show its face; the camera dives into its surface
 *  until the rows of wedges resolve */
const ShotG: React.FC<{f: number}> = ({f}) => {
  const st = benchAt(f);
  const tile = TILE_STAGE;
  const end = {x: tile.x + DIVE_END.x * UM, y: tile.y + DIVE_END.y * UM};
  const cam = f < 204 ? camAt(f, [[181, -352, -170, 9.5], [204, tile.x, tile.y + 0.5, 20, inOut]]) : camZoom(f, 204, 226, {x: tile.x, y: tile.y + 0.5}, 20, end, DIVE_END.z / UM, (x) => x * x * (3 - 2 * x) * 0.4 + x * 0.6);
  // the true rows, drawn into the tile face once they are big enough to see
  const zm = cam.z * UM;
  const op = clamp((zm * MW.pitch - 3) / 9);
  const mcy = (cam.y - tile.y) / UM;
  const rows = microRows(mcy, zm);
  const nest =
    op > 0.01 ? (
      <g opacity={op} transform={`translate(${tile.x} ${tile.y}) scale(${UM})`}>
        <MicroTurnContent id={`g${f}-mt`} alpha={0} z={zm} y0={rows.y0} count={rows.count} bg={false} wz={Math.max(600, 2400 / zm)} />
      </g>
    ) : null;
  return <Svg><BenchWorld id={`g${f}`} st={st} cam={cam} k={kOf(Math.min(cam.z, 6))} nest={nest} /></Svg>;
};

// ------------------------------------------------------------------ the microscopic mechanism (232-477)
const microAt = (f: number): MicroState => ({
  surface: 'glass',
  // "As you pull downward" (271): the first bend; "bend flat" (310-342); the last of the approach seen close (383-420)
  lam: keyN(f, [[264, 0], [306, 0.34], [340, 0.88], [383, 0.88], [420, 1]]),
  gx: keyN(f, [[246, -260], [262, 0, easeOut]]),
  back: 0,
  glow: ss(f, 429, 458) * (1 - ss(f, 474, 492)),
  slip: 0,
  y0: MICRO_Y0,
  count: 26,
});
/** the strip the close-up studies (wedge 8) */
const STRIP = {x: 4, y: MICRO_Y0 + 8 * MW.pitch + MW.shear + 30};
/** H (226-268): the strip turns from face-on to edge-on: the wedges in section; the glass slides in to meet their tips */
const ShotH: React.FC<{f: number}> = ({f}) => {
  const alpha = keyN(f, [[226, 0], [248, 1, easeOut]]);
  const cam = camAt(f, [[226, DIVE_END.x, DIVE_END.y, DIVE_END.z], [248, 32, 150, 6.5, inOut]]);
  if (f < 244) return <Svg><MicroTurn id={`h${f}`} alpha={alpha} cam={cam} y0={MICRO_Y0} count={26} /></Svg>;
  // the turned strip and the section are the same drawing at alpha 1: a four-frame match dissolve evens out their finish
  const u = clamp((f - 244) / 5);
  return (
    <Svg>
      <MicroView id={`h${f}`} st={microAt(f)} cam={cam} />
      {u < 1 && <g opacity={1 - u}><MicroTurn id={`h${f}t`} alpha={alpha} cam={cam} y0={MICRO_Y0} count={26} /></g>}
    </Svg>
  );
};
/** I (268-383): pulled down, the wedges bend and lie flat against the glass; the camera runs down the array */
const ShotI: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[268, 32, 150, 6.5], [306, 30, 168, 6.7, inOut], [344, 28, 196, 6.9], [383, 26, 330, 6.0, inOut]]);
  return <Svg><MicroView id={`i${f}`} st={microAt(f)} cam={cam} /></Svg>;
};
/** J (383-477): close on one strip: the last hairline of gap closes; the cue at the contact edge; back out over the
 *  neighbouring contacts */
const ShotJ: React.FC<{f: number}> = ({f}) => {
  const cam = f < 420 ? camZoom(f, 383, 420, {x: 26, y: 330}, 6.0, STRIP, 26, sm5) : f < 457 ? camAt(f, [[420, STRIP.x, STRIP.y, 26], [457, STRIP.x + 2, STRIP.y + 14, 33, inOut]]) : camZoom(f, 457, 477, {x: STRIP.x + 2, y: STRIP.y + 14}, 33, {x: 40, y: 300}, 3.0, sm5);
  return <Svg><MicroView id={`j${f}`} st={microAt(f)} cam={cam} /></Svg>;
};

// ------------------------------------------------------------------ back out to the climber (477-535)
/** where the section sits on the left pad's tile layer, in the bay */
const microInBay = (padY: number) => ({x: 0, y: padY - 30});
const nestMicro = (id: string, st: MicroState, origin: {x: number; y: number}, cam: Cam) => {
  const zm = cam.z * UM;
  if (zm * MW.pitch < 1.2) return null;
  const mcy = (cam.y - origin.y) / UM;
  const rows = microRows(mcy, zm);
  const op = clamp((zm * MW.pitch - 1.2) / 6);
  // clip to the pad's tile layer (in micron coordinates, so the section never spills past the tile)
  return (
    <g opacity={op} transform={`translate(${origin.x} ${origin.y}) scale(${UM})`}>
      <defs>
        <clipPath id={`${id}-cl`}>
          <rect x={-60 / UM} y={-300 / UM} width={(60 + 6) / UM} height={600 / UM} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-cl)`}>
        <MicroContent id={id} st={{...st, y0: rows.y0, count: rows.count}} z={zm} bg={false} />
      </g>
    </g>
  );
};
/** K (477-535): from many engaged contacts out through the tile and the pad to the strap and the whole climber,
 *  standing up on the left pad (it holds his entire weight) while the right pad is carried up and seated */
const ShotK: React.FC<{f: number}> = ({f}) => {
  const st = climbAt(f);
  const o = microInBay(Y.L1);
  const p0 = {x: o.x + 40 * UM, y: o.y + 300 * UM};
  const cam = f < 506 ? camZoom(f, 477, 506, p0, 3.0 / UM, {x: 215, y: -1260}, 0.92, sm5) : camAt(f, [[506, 215, -1260, 0.92], [535, 220, -1330, 0.9, inOut]]);
  const nest = nestMicro(`k${f}-n`, {...microAt(f), lam: 1}, o, cam);
  return <Svg><BayWorld id={`k${f}`} st={st} cam={cam} k={kOf(Math.min(cam.z, 8))} nest={nest} /></Svg>;
};

// ------------------------------------------------------------------ the springs (535-681)
const ShotL: React.FC<{f: number}> = ({f}) => <Svg><SpringScene id={`l${f}`} f={f} /></Svg>;

// ------------------------------------------------------------------ the weight shift, release and next reach (681-866)
/** M (681-768): he shifts his weight onto the right pad: the right strap takes the load, the left one goes slack */
const ShotM: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[681, 230, -1240, 1.25], [744, 226, -1320, 1.2, inOut], [768, 120, -1290, 1.6, (x) => x * x]]);
  return <Svg><BayWorld id={`m${f}`} st={climbAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** N (768-802): "The first releases": in the section, the unloaded wedges spring back and their tips leave the glass;
 *  the section is fixed to the pad, so as the pad peels off the glass slides away and the camera pulls back with the pad */
const releaseAt = (f: number, gapUnits: number): MicroState => ({...microAt(470), lam: keyN(f, [[768, 1], [779, 0]]), gx: -keyN(f, [[776, 0], [782, 20]]) - gapUnits / UM, back: 0, glow: 0});
const ShotN: React.FC<{f: number}> = ({f}) => {
  const st = climbAt(f);
  const o = prPad(padPt(st.padL, 0, -30 - Y.L1 + st.padL.y));
  const origin = {x: o.x, y: Y.L1 - 30 + (st.padL.y - Y.L1)};
  const ms = releaseAt(f, st.padL.gap);
  if (f < 783) {
    const cam = camAt(f, [[768, 40, 300, 3.4], [783, 40, 300, 3.0]]);
    return <Svg><MicroView id={`n${f}`} st={ms} cam={cam} /></Svg>;
  }
  const p0 = {x: origin.x + 40 * UM, y: origin.y + 300 * UM};
  const cam = camZoom(f, 783, 802, p0, 3.0 / UM, {x: 70 + st.padL.gap, y: st.padL.y + 10}, 4.2, sm5);
  const nest = nestMicro(`n${f}-n`, ms, origin, cam);
  return <Svg><BayWorld id={`n${f}`} st={st} cam={cam} k={kOf(Math.min(cam.z, 8))} nest={nest} /></Svg>;
};
/** O (802-866): the released pad goes up and is seated higher; his left foot steps up and he starts onto it */
const ShotO: React.FC<{f: number}> = ({f}) => {
  const st = climbAt(f);
  const st0 = climbAt(802);
  const cam = camAt(f, [[802, 70 + st0.padL.gap, st0.padL.y + 10, 4.2], [826, 110, Y.L2 + 40, 2.2, inOut], [866, 210, -1560, 1.05, inOut]]);
  return <Svg><BayWorld id={`o${f}`} st={st} cam={cam} k={kOf(cam.z)} /></Svg>;
};

// ------------------------------------------------------------------ the catch (866-1171)
/** P (866-905): the bench: the pad holds on the glass under its test mass; he lifts it off and the brick slides in */
const ShotP: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[866, 70, -400, 2.3], [905, 60, -380, 2.5, inOut]]);
  return <Svg><BenchWorld id={`p${f}`} st={benchAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** Q (905-971): "They need a smooth surface to grip": on smooth glass, contact closes across many wedges at once (the
 *  mechanism already seen), the camera running down the engaged array */
const glassAt = (f: number): MicroState => ({surface: 'glass', lam: keyN(f, [[912, 0], [936, 1]]), gx: keyN(f, [[905, -24], [915, 0, easeOut]]), back: 0, glow: 0, slip: 0, y0: MICRO_Y0, count: 34});
const Q_CAM: Cam = {x: 30, y: 300, z: 5.2};
const ShotQ: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[905, Q_CAM.x, Q_CAM.y, Q_CAM.z], [932, 30, 330, 5.4, inOut], [971, 30, 520, 4.6, inOut]]);
  return <Svg><MicroView id={`q${f}`} st={glassAt(f)} cam={cam} /></Svg>;
};
/** Qb (971-1018): "So you can climb glass": back on the wall, he stands up on the left pad and carries the right one up */
const ShotQb: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[971, 225, -1620, 1.15], [1018, 215, -1830, 1.0, inOut]]);
  return <Svg><BayWorld id={`qb${f}`} st={climbAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** R (1018-1064): "but switch to rough brick": the same wedges at the same scale and framing as Q's opening, on rough
 *  brick: only a few tips reach a peak; under load the backing slides and those few skid off */
const brickAt = (f: number): MicroState => ({surface: 'brick', lam: keyN(f, [[1024, 0], [1040, 1]]), gx: 0, back: keyN(f, [[1018, 14], [1026, 0]]), glow: 0, slip: keyN(f, [[1042, 0], [1064, 70]]), y0: MICRO_Y0, count: 34});
const ShotR: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[1018, Q_CAM.x, Q_CAM.y, Q_CAM.z], [1064, 30, 340, 5.2]]);
  return <Svg><MicroView id={`r${f}`} st={brickAt(f)} cam={cam} /></Svg>;
};
/** S (1064-1130): the bench: pressed onto the brick and let go, the pad slips down it and the mass lands on the bench */
const ShotS: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f, [[1064, 60, -390, 2.6], [1104, 55, -320, 2.3, inOut], [1130, 70, -350, 2.4]]);
  return <Svg><BenchWorld id={`s${f}`} st={benchAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};
/** T (1130-1171): he takes the pad back, the glass slides down into place and he presses the pad onto it, framed as
 *  frame 0 (the loop) */
const ShotT: React.FC<{f: number}> = ({f}) => {
  const end = {x: CAM_A0.x, y: -420 + (CAM_A0.y + 799) - 9};
  const cam = camAt(f, [[1130, 70, -350, 2.4], [1150, 95, -400, 2.7, inOut], [1171, end.x, end.y, CAM_A0.z, inOut]]);
  return <Svg><BenchWorld id={`t${f}`} st={benchAt(f)} cam={cam} k={kOf(cam.z)} /></Svg>;
};

export const SHOTS: {from: number; to: number; name: string; C: React.FC<{f: number}>}[] = [
  {from: 0, to: 20, name: 'A', C: ShotA},
  {from: 20, to: 80, name: 'BC', C: ShotBC},
  {from: 80, to: 114, name: 'D', C: ShotD},
  {from: 114, to: 132, name: 'E', C: ShotE},
  {from: 132, to: 181, name: 'F', C: ShotF},
  {from: 181, to: 226, name: 'G', C: ShotG},
  {from: 226, to: 268, name: 'H', C: ShotH},
  {from: 268, to: 383, name: 'I', C: ShotI},
  {from: 383, to: 477, name: 'J', C: ShotJ},
  {from: 477, to: 535, name: 'K', C: ShotK},
  {from: 535, to: 681, name: 'L', C: ShotL},
  {from: 681, to: 768, name: 'M', C: ShotM},
  {from: 768, to: 802, name: 'N', C: ShotN},
  {from: 802, to: 866, name: 'O', C: ShotO},
  {from: 866, to: 905, name: 'P', C: ShotP},
  {from: 905, to: 971, name: 'Q', C: ShotQ},
  {from: 971, to: 1018, name: 'Qb', C: ShotQb},
  {from: 1018, to: 1064, name: 'R', C: ShotR},
  {from: 1064, to: 1130, name: 'S', C: ShotS},
  {from: 1130, to: 1172, name: 'T', C: ShotT},
];

export const SceneAt: React.FC<{f: number}> = ({f}) => {
  const s = SHOTS.find((x) => f >= x.from && f < x.to) ?? SHOTS[SHOTS.length - 1];
  return <s.C f={f} />;
};
export {B0};

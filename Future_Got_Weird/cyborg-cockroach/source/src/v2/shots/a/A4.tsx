// A4 (103-135, "decides when it shoots."): the operator at the bench, remote in his near hand (thumb risen just off
// the button, the LED amber: it has fired), his eyes on the arena in the foreground, where the medic stands planted by
// the silicone target with the injector extended from its tube and the needle in the silicone (the hook's aftermath).
// Acting: concentration eases into a small pleased look and he gives one slight, decisive nod on "shoots". The insect
// breathes and its antennae search. One gentle eased push in over the shot (parallax: wall, operator, arena).
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {INJ} from '../../../rig/gear';
import {toW} from '../../../lib/v3';
import {clamp, sr, keys} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {LabWall2, Bench2, Surface2D, Target2D, LAB2} from '../../sets/Lab2';
import {Cam, Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {A1_FACE, A1_TRAVEL} from '../h/A1';
import {OperatorA} from './OperatorA';
import {A4R, FPS_A} from './timingA';

const T0 = A4R.from / FPS_A;
const T1 = A4R.to / FPS_A;
/** the nod: down on "shoots" (4.05 s) and back */
export const A4_NOD = 4.0;
const S_STOP = plantedStop(36);
const PATH = straightPath([-S_STOP, 0, 0], 0);
/** the medic after the shot: planted in the firing stance, breathing, the injector extended into the target */
export const a4Pose = (t: number): RoachPose =>
  poseRoach({path: PATH, s: S_STOP, t, search: 0.75, antL: {yaw: 0.9, pitch: 0.4}, antR: {yaw: 0.95, pitch: 0.45}});
export const A4_INJ_REAR = INJ.loadedRear + A1_TRAVEL;

// layout (scene px at rest)
const OP = {x: 790, y: 1345, scale: 1.5};
const BENCH_FAR = 1265;
const BENCH_FRONT = 1790;
const D_WALL = 2.6, D_OP = 1.5, D_ARENA = 1;
const ARENA = {az: 16, el: 27, s: 5.6, x: 300, y: 1610};
const arenaView = (): View => viewAt(ARENA.az, ARENA.el, ARENA.s, [0, 0, 0], ARENA.x, ARENA.y);

export const a4Cam = (t: number): Cam => {
  const u = sr(t, T0 - 0.1, T1 + 0.1);
  return {x: 540 + 30 * u, y: 960 + 70 * u, z: 1 + 0.05 * u};
};
/** a scene point on a layer of given depth -> screen (as layerTransform) */
const scr = (cam: Cam, d: number, x: number, y: number) => {
  const z = 1 + (cam.z - 1) / d;
  const cx = 540 + (cam.x - 540) / d;
  const cy = 960 + (cam.y - 960) / d;
  return {x: 540 + (x - cx) * z, y: 960 + (y - cy) * z};
};

export const A4: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS_A;
  const cam = a4Cam(t);
  const v = arenaView();
  const pose = a4Pose(t);
  // where he looks: the needle in the silicone (the arena's layer, mapped into his layer at rest)
  const needle = P(v, [A1_FACE + 1, 27, 0]);
  const look = {x: needle[0] - 60, y: needle[1] - 10};
  // acting: focus -> pleased as it lands in his mind; one small nod
  const pleased = sr(t, 3.62, 4.0);
  const nod = 7 * keys(t, [[A4_NOD - 0.08, 0], [A4_NOD + 0.1, 1], [A4_NOD + 0.42, 0.15], [T1, 0.1]]);
  // bench top: the far edge on the operator's layer, the front edge on the arena's
  const fl = scr(cam, D_OP, -200, BENCH_FAR), fr = scr(cam, D_OP, 1280, BENCH_FAR);
  const nl = scr(cam, D_ARENA, -200, BENCH_FRONT), nr = scr(cam, D_ARENA, 1280, BENCH_FRONT);
  const opProps = {
    x: OP.x, y: OP.y, scale: OP.scale, t, expr: 'focus' as const, exprTo: 'pleased' as const, exprMix: pleased,
    thumbPress: 0, thumbLift: 0.55, led: 'fired' as const, gazeX: look.x, gazeY: look.y, benchTopY: BENCH_FAR, farHand: 'bench' as const, farHandX: 120, nod,
  };
  const breath = pose.breath;
  void breath;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="a4-bt" x1="0" y1={fl.y} x2="0" y2={nl.y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={LAB2.benchTop} />
          <stop offset="1" stopColor={LAB2.benchTopLit} />
        </linearGradient>
        <filter id="a4-wb" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <g filter="url(#a4-wb)">
        <Layer cam={cam} depth={D_WALL}>
          <g transform="translate(40 -54) scale(1.2)">
            <LabWall2 id="a4w" />
          </g>
        </Layer>
      </g>
      <Layer cam={cam} depth={D_OP}>
        <OperatorA id="a4ob" layer="body" {...opProps} />
      </Layer>
      {/* the bench top, seen from above its front edge */}
      <path d={`M${fl.x},${fl.y} L${fr.x},${fr.y} L${nr.x},${nr.y} L${nl.x},${nl.y} Z`} fill="url(#a4-bt)" />
      <path d={`M${fl.x},${fl.y} L${fr.x},${fr.y}`} stroke="#172B3A" strokeWidth={5} />
      <path d={`M${fl.x},${fl.y + 5} L${fr.x},${fr.y + 5}`} stroke="#FFFFFF" strokeWidth={2} opacity={0.18} />
      <Layer cam={cam} depth={D_OP}>
        <OperatorA id="a4oh" layer="hands" {...opProps} />
      </Layer>
      <Layer cam={cam} depth={D_ARENA}>
        <Surface2D v={v} x0={-95} x1={115} z0={-46} z1={52} color={LAB2.surface} />
        <Target2D id="a4t" v={v} face={A1_FACE} dir={1} dent={1} />
        <Roach2D pose={pose} v={v} o={{id: 'a4r', gear: <Gear2D id="a4g" v={v} f={pose.frame} g={{kind: 'injector', injRear: A4_INJ_REAR, latched: false, heat: 0, led: 0}} />}} />
        <Target2D id="a4tv" v={v} face={A1_FACE} dir={1} veil={0.62} />
        <Bench2 id="a4b" top={BENCH_FRONT} k={1.2} />
      </Layer>
    </svg>
  );
};
void clamp;
void toW;

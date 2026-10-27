// A3 (67-89, "And a person holding a"): the operator at the bench, the research remote in his gloved hand (thumb risen
// just off the fire button, the status LED amber: it has fired), looking down at the bench. The shot opens on him; the
// camera follows his eye line down and to the left onto the bench, where the medic stands at the clear target with the
// fired injector embedded in it (A1's stance: the empty tube, the spring at its free length, antennae on the face,
// breathing). Near the end his steering command arrives (the board LED blinks, a pulse runs the left antenna wire); it
// draws back off the injector and starts to pivot away (continued in A4). Layered parallax: wall, operator, bench.
import React from 'react';
import {sr, lerp} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, Injector2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {LabWall2, Bench2, Surface2D, Target2D, LAB2} from '../../sets/Lab2';
import {Cam, Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {A1_FACE} from '../h/A1';
import {FoamBox} from '../b/common';
import {OperatorA} from './OperatorA';
import {medPose, medGear, medInjFrame, MED_INJ_REAR} from './medicA';
import {shotRange} from '../../cuts2';

const R = shotRange('A3');
const T0 = R.from / 30;
const T1 = R.to / 30;

// layout at rest (the shot's END framing; scene px)
const OP = {x: 830, y: 960, scale: 1.3};
const BENCH_FAR = 860;
const BENCH_FRONT = 1830;
const D_WALL = 2.6;
const D_OP = 1.45;
const ARENA = {az: 18, el: 26, s: 6.3, x: 330, y: 1330};
export const a3ArenaView = (): View => viewAt(ARENA.az, ARENA.el, ARENA.s, [0, 0, 0], ARENA.x, ARENA.y);

/** the camera: opens on him (looking higher and a little right), then follows his eye line down-left to the bench */
export const A3_MOVE0 = 2.3;
export const A3_MOVE1 = 2.9;
export const a3Cam = (t: number): Cam => {
  const u = sr(t, A3_MOVE0, A3_MOVE1);
  return {x: lerp(660, 540, u), y: lerp(560, 1010, u), z: 1};
};
/** a scene point on a layer of given depth -> screen (as layerTransform) */
const scr = (cam: Cam, d: number, x: number, y: number) => {
  const z = 1 + (cam.z - 1) / d;
  const cx = 540 + (cam.x - 540) / d;
  const cy = 960 + (cam.y - 960) / d;
  return {x: 540 + (x - cx) * z, y: 960 + (y - cy) * z};
};

export const A3Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const cam = a3Cam(t);
  const v = a3ArenaView();
  const pose = medPose(t);
  // his gaze: the needle in the silicone (arena layer at rest, as he sees it from his place)
  const needle = P(v, [A1_FACE - 2, 27, 0]);
  const look = {x: needle[0] - 40, y: needle[1] - 30};
  const fl = scr(cam, D_OP, -300, BENCH_FAR), fr = scr(cam, D_OP, 1400, BENCH_FAR);
  const nl = scr(cam, 1, -300, BENCH_FRONT), nr = scr(cam, 1, 1400, BENCH_FRONT);
  const opProps = {
    x: OP.x, y: OP.y, scale: OP.scale, t, expr: 'focus' as const, exprTo: 'pleased' as const, exprMix: 0.25 * sr(t, 2.4, 2.9),
    thumbPress: 0, thumbLift: 0.6, led: 'fired' as const, gazeX: look.x, gazeY: look.y, benchTopY: BENCH_FAR, farHand: 'bench' as const, farHandX: 150,
    nod: 6 + 2 * sr(t, 2.5, 2.9),
  };
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id={`${id}-bt`} x1="0" y1={fl.y} x2="0" y2={nl.y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={LAB2.benchTop} />
          <stop offset="1" stopColor={LAB2.benchTopLit} />
        </linearGradient>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <g filter={`url(#${id}-wb)`}>
        <Layer cam={cam} depth={D_WALL}>
          <g transform="translate(40 -150) scale(1.2)">
            <LabWall2 id={`${id}w`} />
          </g>
        </Layer>
      </g>
      <Layer cam={cam} depth={D_OP}>
        <OperatorA id={`${id}ob`} layer="body" {...opProps} />
      </Layer>
      {/* the bench top, seen from above its front edge */}
      <path d={`M${fl.x},${fl.y} L${fr.x},${fr.y} L${nr.x},${nr.y} L${nl.x},${nl.y} Z`} fill={`url(#${id}-bt)`} />
      <path d={`M${fl.x},${fl.y} L${fr.x},${fr.y}`} stroke="#172B3A" strokeWidth={5} />
      <path d={`M${fl.x},${fl.y + 5} L${fr.x},${fr.y + 5}`} stroke="#FFFFFF" strokeWidth={2} opacity={0.18} />
      <Layer cam={cam} depth={D_OP}>
        <OperatorA id={`${id}oh`} layer="hands" {...opProps} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Surface2D v={v} x0={-230} x1={150} z0={-95} z1={90} color={LAB2.surface} />
        {/* the foam course waiting further along the tray (where it will go) */}
        <FoamBox id={`${id}f1`} v={v} b={[-190, -150, 0, 30, -85, -50]} color={LAB2.foamB} />
        <Target2D id={`${id}t`} v={v} face={A1_FACE} dir={1} dent={1} />
        <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={medGear(t)} />}} />
        <Injector2D id={`${id}i`} v={v} frame={medInjFrame()} rear={MED_INJ_REAR} />
        <Target2D id={`${id}tv`} v={v} face={A1_FACE} dir={1} veil={0.62} />
        <Bench2 id={`${id}b`} top={BENCH_FRONT} k={1.2} />
      </Layer>
    </svg>
  );
};

export const A3: React.FC<ShotProps> = ({f}) => <A3Scene t={f / 30} id={`a3f${f}`} />;
export {T0 as A3_T0, T1 as A3_T1};

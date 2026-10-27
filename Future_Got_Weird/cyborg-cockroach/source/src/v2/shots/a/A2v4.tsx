// A2 (V4, 39-89, "And a person holding a"): the operator at the bench, the research remote in his gloved hand (his
// thumb just lifted off the fire button after the AR press, the status LED amber), his eyes on the medic, which stands
// at lower left in A1's firing stance (heading screen-right, the fired injector in the clear target, the tube empty).
// He breathes and blinks; his thumb moves over onto the direction pad, gathers and TAPS it (MED_TAP, ~2.2 s): the pad's
// arm sinks under it, the remote's LED flashes green. The insect answers at once: the board's LED blinks, the pulses run
// the left antenna wire, the left antenna flicks, it draws back on planted feet and steps into a right turn away from
// the target on short tripod strides. The camera makes one move: from his hands, it tracks laterally (left and a little
// down) along the bench to the insect, gently from the first frame, fastest as the command goes out, still drifting
// into the cut (A4 trucks on in the same direction). His remote hand stays at the right edge at the end; the eye line
// (down-left) holds throughout. Layered parallax: wall (2.6), the operator and the bench's far edge (1.45), the bench
// top and the insect (1).
import React from 'react';
import {sr, keys} from '../../../lib/ease';
import {toW} from '../../../lib/v3';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, Injector2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {LabWall2, Bench2, Surface2D, Target2D, LAB2} from '../../sets/Lab2';
import {Cam, Layer} from '../../dc/camera';
import {blinkAt} from '../../../crew/operator';
import {ShotProps} from '../index2';
import {A1_FACE} from '../h/A1';
import {FoamBox} from '../b/common';
import {OperatorA, operatorA, OperatorAProps} from './OperatorA';
import {medPose, medGear, medInjFrame, MED_INJ_REAR, MED_TAP} from './medicA';
import {shotRange} from '../../cuts2';

const R = shotRange('A2');
const T0 = R.from / 30;
const T1 = R.to / 30;

// depths and the layout at the END framing (cam = identity: scene px = screen px at t = T1)
const D_WALL = 2.8;
const D_OP = 1.6;
const OP_S = 1.75;
/** where his head sits on screen at the end (upper right, the face whole), and how far the camera travels (scene px at
 *  depth 1: left and a little down) */
const HEAD_END = {x: 860, y: 660};
const MOVE = {dx: 430, dy: 120};
/** the bench's far edge below his hands (operator layer) and its front edge (depth 1) */
const BENCH_FAR_BELOW = 290;
const BENCH_FRONT = 1860;
/** the medic's stance on screen at the end (world origin = its body origin) */
const ARENA = {az: 18, el: 26, s: 7.6, x: 330, y: 1530};
export const a2ArenaView = (): View => viewAt(ARENA.az, ARENA.el, ARENA.s, [0, 0, 0], ARENA.x, ARENA.y);

/** the move: one smooth track, gentle from the first frame, fastest around the tap, still drifting at the cut */
const U_A = 0.95, U_B = 3.25;
const u0 = sr(T0, U_A, U_B), u1 = sr(T1, U_A, U_B);
export const a2Move = (t: number) => (sr(t, U_A, U_B) - u0) / (u1 - u0);
export const a2Cam = (t: number): Cam => {
  const u = a2Move(t);
  return {x: 540 + MOVE.dx * (1 - u), y: 960 - MOVE.dy * (1 - u), z: 1};
};
/** a layer point (depth d) -> screen, and back */
const scr = (cam: Cam, d: number, x: number, y: number) => ({x: x - (cam.x - 540) / d, y: y - (cam.y - 960) / d});
const unscr = (cam: Cam, d: number, x: number, y: number) => ({x: x + (cam.x - 540) / d, y: y + (cam.y - 960) / d});

/** the hip that puts his head at HEAD_END (solved once from the rig at the hip origin), and his remote there */
const G0 = operatorA({x: 0, y: 0, scale: OP_S, t: T1, thumbLift: 0.6, dpad: 1});
const HIP = {x: HEAD_END.x - G0.head.x, y: HEAD_END.y - G0.head.y};
const BENCH_FAR = HIP.y + G0.view.c.y + BENCH_FAR_BELOW;

/** his thumb: off the fire button onto the direction pad, hovering, the tap (down MED_TAP - 0.1 .. MED_TAP), resting on
 *  the pad after it; the pad's arm sinks with the thumb */
export const A2_THUMB_LIFT = MED_TAP - 0.12;
export const A2_THUMB_DOWN = MED_TAP - 0.035;
export const A2_THUMB_UP = MED_TAP + 0.1;
const thumb = (t: number) => {
  const dpad = sr(t, T0 + 0.06, T0 + 0.5);
  const z = keys(t, [[T0, 4.5], [T0 + 0.5, 3.2], [A2_THUMB_LIFT - 0.18, 3.6], [A2_THUMB_LIFT, 11], [A2_THUMB_DOWN, 0.8], [MED_TAP, 0.2], [A2_THUMB_UP, 0.3], [A2_THUMB_UP + 0.22, 3.0], [T1, 2.4]]);
  const press = keys(t, [[A2_THUMB_DOWN, 0], [MED_TAP, 1], [A2_THUMB_UP, 1], [A2_THUMB_UP + 0.1, 0]]);
  return {dpad, z, press};
};
/** the remote's LED: amber (fired), a brief green flash as the command goes out */
const ledAt = (t: number) => (t >= MED_TAP - 0.01 && t < MED_TAP + 0.12 ? 0 : 1);

export const A2Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const cam = a2Cam(t);
  const v = a2ArenaView();
  const pose = medPose(t);
  // his gaze: the insect's head where he sees it now (screen), in his own layer's coordinates
  const hs = P(v, toW(pose.frame, [30, 6, 0]));
  const hsScr = scr(cam, 1, hs[0], hs[1]);
  const look = unscr(cam, D_OP, hsScr.x, hsScr.y);
  const th = thumb(t);
  const tap = Math.max(0, 1 - Math.abs(t - (MED_TAP + 0.03)) / 0.2);
  const fl = scr(cam, D_OP, -400, BENCH_FAR), fr = scr(cam, D_OP, 2200, BENCH_FAR);
  const nl = scr(cam, 1, -400, BENCH_FRONT), nr = scr(cam, 1, 2200, BENCH_FRONT);
  const opProps: OperatorAProps = {
    x: HIP.x, y: HIP.y, scale: OP_S, t, expr: 'focus', exprTo: 'pleased', exprMix: 0.22 * sr(t, MED_TAP + 0.25, MED_TAP + 0.6),
    blink: blinkAt(t, 2.1), thumbPress: 0, thumbLift: 0.6, led: ledAt(t), gazeX: look.x, gazeY: look.y, benchTopY: BENCH_FAR, farHand: 'bench', farHandX: 150,
    nod: 5 + 2.2 * Math.sin(Math.PI * Math.min(1, tap)) * (tap > 0 ? 1 : 0), dpad: th.dpad, dpadZ: th.z, dpadPress: th.press,
  };
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id={`${id}-bt`} x1="0" y1={fl.y} x2="0" y2={nl.y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={LAB2.benchTop} />
          <stop offset="1" stopColor={LAB2.benchTopLit} />
        </linearGradient>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <g filter={`url(#${id}-wb)`}>
        <Layer cam={cam} depth={D_WALL}>
          <g transform="translate(-40 -260) scale(1.3)">
            <LabWall2 id={`${id}w`} />
          </g>
        </Layer>
      </g>
      <Layer cam={cam} depth={D_OP}>
        <OperatorA id={`${id}ob`} layer="body" {...opProps} />
      </Layer>
      {/* the bench top, seen from above its front edge (its far edge with him, its front with the insect) */}
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

export const A2: React.FC<ShotProps> = ({f}) => <A2Scene t={f / 30} id={`a2f${f}`} />;

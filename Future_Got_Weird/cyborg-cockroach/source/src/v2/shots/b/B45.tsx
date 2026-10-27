// B4 (243-282, "then used electrical pulses") and B5 (283-314, "to steer it."): the foam obstacle course on the white
// tray, one continuous camera over one walk, from above.
// B4: close from above (az 0, el 84: it heads screen-right, its LEFT side is up-screen), the camera riding with the
// walking medic, framed on the guidance electronics: the board (chips, coin cell, status LED), the LEFT antenna wire
// running forward over the shield to the electrode at the left antenna's base (the abdomen runs out of frame left).
// On "electrical" the LED flashes and three short pulses leave the board one after another and run the left wire to
// the electrode; each arrival lights it and the left antenna flicks. A yellow block lines its right side.
// B5 (V4): still from above. A blue block stands across its way (its antennae all but touch it); stimulating the left
// antenna makes it veer RIGHT: it turns 90 degrees on its legs (the body follows its own path, the feet stay planted:
// no sideways slide) through the gap past the yellow block's end and the blue block's corner, and walks on screen-down.
// The camera rises from the electronics as it turns (s 12.5 -> 6.6, el 84 -> 79, a fixed azimuth, so the heading change
// reads on screen as right -> down) and keeps drifting after it at half its pace to the cut (no settled hold).
import React from 'react';
import {poseRoach, RoachPose} from '../../../rig/roach';
import {V3, toW, ypr} from '../../../lib/v3';
import {sr, clamp, lerp} from '../../../lib/ease';
import {wiresOn} from '../../../rig/gear';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, D} from '../../roach/ortho';
import {LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {Tray2D, FoamBox, BoxB, turnPath, pulseTrain, PulseTrails, FPS} from './common';

export const B45_SPEED = 46;
/** the turn: heading eases from +x to +z (a right turn) over arc length 0..50 mm */
export const TURN_S0 = 0, TURN_S1 = 50;
const PATH45 = turnPath([0, 0], TURN_S0, TURN_S1, -Math.PI / 2);
/** time the body reaches the start of the turn (just after the last pulse lands) */
export const T_TURN = 9.3;
/** the pulse train leaves the board at T_PULSE ("electrical" 8.49 s): three pulses, 0.1 s apart, 0.26 s along the wire */
export const T_PULSE = 8.52;
export const PULSE_GAP = 0.1, PULSE_RUN = 0.26;
export const b45S = (t: number) => (t - T_TURN) * B45_SPEED;
export const b45Pulse = (t: number) => pulseTrain(t, T_PULSE, PULSE_GAP, PULSE_RUN);

export const b45Pose = (t: number): RoachPose => {
  const s = b45S(t);
  const p = b45Pulse(t);
  // the antennae lead the turn (both swing toward the right), the left one flicks at each pulse
  const look = Math.sin(Math.PI * clamp((s - TURN_S0 + 14) / (TURN_S1 - TURN_S0 + 8)));
  const tw = p.twitch;
  return poseRoach({
    path: PATH45, s, t, search: 0.55, seed: 7,
    antL: {yaw: 0.6 + 0.42 * tw - 0.3 * look, pitch: 0.16 + 0.32 * tw, curl: 0.9 - 0.35 * tw},
    antR: {yaw: 0.6 + 0.34 * look, pitch: 0.14, curl: 0.9},
  });
};

// the course (world mm, y up): the yellow block on the inside of the turn (its corner is where the insect turns; it
// hugs it, the right feet ~3 mm off the wall), the blue one across the way ahead, a red one beyond
export const COURSE: {b: BoxB; c: string}[] = [
  {b: [-190, -6, 0, 28, 46, 160], c: LAB2.foamY},
  {b: [66, 120, 0, 30, -44, 14], c: LAB2.foamB},
  {b: [84, 136, 0, 26, 104, 154], c: LAB2.foamR},
];

/** the camera (V5g): a HIGH THREE-QUARTER from the insect's front-left (az 168: its left side and face toward us, el
 *  39 -> 43), well inside the range the flat renderer draws consistently (all six legs, both antennae, the pack as one
 *  device). It heads screen-left; the right turn takes it away from us (up-screen) past the blue block's far end. */
export const B45_AZ = 168;
const BOARD: V3 = [4, 23, 0];
const S_CLOSE = 11.6, S_WIDE = 5.8;
const EL_CLOSE = 39, EL_WIDE = 43;
/** the wide view looks between the insect and the turn's corner (so it keeps drifting with the walk: no hold) */
const C_END: V3 = [40, 0, 20];
const C_FOLLOW = 0.5;
const A_CLOSE: [number, number] = [680, 960], A_WIDE: [number, number] = [600, 980];
/** the point the close camera rides with: the board, in the path frame (the gait's bob and roll never shake it) */
const follow = (t: number): V3 => {
  const pp = PATH45(b45S(t));
  return toW(ypr(pp.p, pp.yaw), BOARD);
};
/** B5's pull back as it turns (eased in at the cut, still settling at B5's end) */
export const b5Rise = (f: number) => sr(f, 281, 321);
export const b45View = (f: number): View => {
  const t = f / FPS;
  const fo = follow(t);
  const u = b5Rise(f);
  const s = S_CLOSE * Math.pow(S_WIDE / S_CLOSE, u);
  const wide: V3 = [lerp(C_END[0], fo[0], C_FOLLOW), 0, lerp(C_END[2], fo[2], C_FOLLOW)];
  const at: V3 = [lerp(fo[0], wide[0], u), lerp(fo[1], wide[1], u), lerp(fo[2], wide[2], u)];
  return viewAt(B45_AZ, lerp(EL_CLOSE, EL_WIDE, u), s, at, lerp(A_CLOSE[0], A_WIDE[0], u), lerp(A_CLOSE[1], A_WIDE[1], u));
};

const Scene45: React.FC<{f: number; id: string}> = ({f, id}) => {
  const t = f / FPS;
  const v = b45View(f);
  const pose = b45Pose(t);
  const p = b45Pulse(t);
  // depth order: the blocks behind the insect, the insect, the blocks in front of it (by each block's nearest
  // footprint corner against the insect's ground point)
  const insD = D(v, [pose.frame.o[0], 0, pose.frame.o[2]]);
  const nearD = (b: BoxB) => Math.max(...[b[0], b[1]].flatMap((x) => [b[4], b[5]].map((z) => D(v, [x, 0, z]))));
  const boxes = COURSE.map((k, i) => ({k, i, d: nearD(k.b)}));
  const box = (q: {k: {b: BoxB; c: string}; i: number}) => <FoamBox key={q.i} id={`${id}k${q.i}`} v={v} b={q.k.b} color={q.k.c} />;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Tray2D v={v} x0={-320} x1={340} z0={-420} z1={360} grid={20} />
      {boxes.filter((q) => q.d < insD).map(box)}
      <Roach2D
        pose={pose}
        v={v}
        o={{
          id: `${id}r`,
          gear: (
            <g>
              <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector', led: p.led, pulses: {antL: p.fr}, zap: {antL: p.zap}}} />
              {p.fr.length > 0 && <PulseTrails id={`${id}pt`} v={v} wire={wiresOn(pose.frame).antL.map((q) => q.p)} fr={p.fr} />}
            </g>
          ),
        }}
      />
      {boxes.filter((q) => q.d >= insD).map(box)}
    </svg>
  );
};
export const B4: React.FC<ShotProps> = ({f}) => <Scene45 f={f} id={`b4f${f}`} />;
export const B5: React.FC<ShotProps> = ({f}) => <Scene45 f={f} id={`b5f${f}`} />;

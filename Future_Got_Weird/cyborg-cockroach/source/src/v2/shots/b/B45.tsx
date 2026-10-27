// B4 (243-282, "then used electrical pulses") and B5 (283-314, "to steer it."): the foam obstacle course on the white
// tray, one continuous camera over one walk.
// B4: close from above (az 0, el 84: it heads screen-right, its LEFT side is up-screen), the camera riding with the
// walking medic, framed on the guidance electronics: the board (chips, coin cell, status LED), the LEFT antenna wire
// running forward over the shield to the electrode at the left antenna's base (the abdomen runs out of frame left).
// On "electrical" the LED flashes and three short pulses leave the board one after another and run the left wire to
// the electrode; each arrival lights it and the left antenna flicks. A yellow block lines its right side, a blue block
// stands across its way ahead.
// B5: stimulating the left antenna makes it veer RIGHT: the body yaws right and it turns round the corner of the
// yellow block, clear of the blue one; the camera rises and swings a little lower behind the turn (el 84 -> 70) to hold
// the whole turn and the course (blocks, a red one beyond). It ends heading screen-down-ish (world +z), still walking.
import React from 'react';
import {poseRoach, RoachPose} from '../../../rig/roach';
import {V3, toW, ypr} from '../../../lib/v3';
import {sr, clamp, lerp} from '../../../lib/ease';
import {wiresOn} from '../../../rig/gear';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View} from '../../roach/ortho';
import {LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {Tray2D, FoamBox, BoxB, turnPath, pulseTrain, PulseTrails, FPS} from './common';

export const B45_SPEED = 46;
/** the turn: heading eases from +x to +z (a right turn) over arc length 0..50 mm */
export const TURN_S0 = 0, TURN_S1 = 50;
const PATH45 = turnPath([0, 0], TURN_S0, TURN_S1, -Math.PI / 2);
/** time the body reaches the start of the turn (just after the last pulse lands) */
export const T_TURN = 9.12;
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

// the course (world mm, y up): the yellow block on the inside of the turn, the blue one across the way ahead, a red
// one and a small blue one beyond
export const COURSE: {b: BoxB; c: string}[] = [
  {b: [-190, -6, 0, 40, 39, 160], c: LAB2.foamY},
  {b: [80, 142, 0, 30, -90, 30], c: LAB2.foamB},
  {b: [78, 130, 0, 26, 112, 162], c: LAB2.foamR},
  {b: [-110, -56, 0, 24, -96, -60], c: LAB2.foamB},
];

const AZ = 0;
const BOARD: V3 = [1, 23, 0];
const S_CLOSE = 12.5, S_WIDE = 8;
const EL_CLOSE = 84, EL_WIDE = 45;
/** where the wide view looks (the turn's middle) and where it puts it on screen */
const C_END: V3 = [30, 0, 40];
const A_CLOSE: [number, number] = [260, 900], A_WIDE: [number, number] = [540, 900];
/** the point the close camera rides with: the board, in the path frame (the gait's bob and roll never shake it) */
const follow = (t: number): V3 => {
  const pp = PATH45(b45S(t));
  return toW(ypr(pp.p, pp.yaw), BOARD);
};
/** B5's rise as it turns (eased in at the cut, still settling at B5's end) */
export const b5Rise = (f: number) => sr(f, 280, 303);
export const b45View = (f: number): View => {
  const t = f / FPS;
  const fo = follow(t);
  const u = b5Rise(f);
  const s = S_CLOSE * Math.pow(S_WIDE / S_CLOSE, u);
  const at: V3 = [lerp(fo[0], C_END[0], u), lerp(fo[1], C_END[1], u), lerp(fo[2], C_END[2], u)];
  return viewAt(AZ, lerp(EL_CLOSE, EL_WIDE, u), s, at, lerp(A_CLOSE[0], A_WIDE[0], u), lerp(A_CLOSE[1], A_WIDE[1], u));
};

const Scene45: React.FC<{f: number; id: string}> = ({f, id}) => {
  const t = f / FPS;
  const v = b45View(f);
  const pose = b45Pose(t);
  const p = b45Pulse(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Tray2D v={v} x0={-320} x1={340} z0={-260} z1={320} grid={20} />
      {COURSE.map((k, i) => (
        <FoamBox key={i} id={`${id}k${i}`} v={v} b={k.b} color={k.c} />
      ))}
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
    </svg>
  );
};
export const B4: React.FC<ShotProps> = ({f}) => <Scene45 f={f} id={`b4f${f}`} />;
export const B5: React.FC<ShotProps> = ({f}) => <Scene45 f={f} id={`b5f${f}`} />;

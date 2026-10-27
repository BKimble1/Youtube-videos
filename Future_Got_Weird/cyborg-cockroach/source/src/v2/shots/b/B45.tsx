// B4 (255-282, "electrical pulses") and B5 (283-314, "to steer it."): one continuous move over one walk.
// A view from above, a touch behind the insect (az -90, el 84: it heads screen-up, its LEFT side is screen-left), close on
// the backpack as it walks up the tray beside a foam block. Wiring -> electronics -> antenna: the board's status LED
// flashes and three short pulses leave the board one after another and run along the LEFT antenna wire, over the
// shield, to the electrode at the left antenna's base; the camera follows them forward from the board to the head
// (B4's one move). Each arrival lights the electrode and the left antenna flicks. Stimulating the left antenna makes it
// veer RIGHT: the body yaws right and it turns round the corner of the yellow foam block, past the blue block ahead,
// as the camera pulls out (B5's one move) to show the whole turn. It ends heading screen-right (world +z), still
// walking. The cut between B4 and B5 is invisible (the camera is continuous across it).
import React from 'react';
import {poseRoach, RoachPose} from '../../../rig/roach';
import {V3, toW, ypr} from '../../../lib/v3';
import {sr, clamp, lerp} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View} from '../../roach/ortho';
import {Box2D, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {Tray2D, BoxShadow, turnPath, pulseTrain, FPS} from './common';

export const B45_SPEED = 46;
/** the turn: heading eases from +x to +z (a right turn) over arc length 0..66 mm */
export const TURN_S0 = 0, TURN_S1 = 66;
const PATH45 = turnPath([0, 0], TURN_S0, TURN_S1, -Math.PI / 2);
/** time the body reaches the start of the turn */
export const T_TURN = 10.33 - TURN_S1 / B45_SPEED;
/** the pulse train leaves the board at T_PULSE (three pulses, 0.1 s apart, 0.26 s along the wire) */
export const T_PULSE = 8.58;
export const PULSE_GAP = 0.1, PULSE_RUN = 0.26;
export const b45S = (t: number) => (t - T_TURN) * B45_SPEED;
export const b45Pulse = (t: number) => pulseTrain(t, T_PULSE, PULSE_GAP, PULSE_RUN);

export const b45Pose = (t: number): RoachPose => {
  const s = b45S(t);
  const p = b45Pulse(t);
  // the antennae lead the turn (both swing toward the right), the left one flicks at each pulse
  const look = Math.sin(Math.PI * clamp((s - TURN_S0 + 12) / (TURN_S1 - TURN_S0 + 6)));
  const tw = p.twitch;
  return poseRoach({
    path: PATH45, s, t, search: 0.55, seed: 7,
    antL: {yaw: 0.62 + 0.42 * tw - 0.3 * look, pitch: 0.16 + 0.32 * tw, curl: 0.9 - 0.35 * tw},
    antR: {yaw: 0.62 + 0.34 * look, pitch: 0.14, curl: 0.9},
  });
};

// props (world mm, y up): the yellow block on the inside of the turn, the blue one ahead
const BLOCK_Y: [number, number, number, number, number, number] = [-260, 5, 0, 36, 37, 260];
const BLOCK_B: [number, number, number, number, number, number] = [96, 170, 0, 30, -150, 26];

// el 84: nearly straight down (below about 81 degrees from behind, Roach2D draws the shield under the abdomen)
const AZ = -90, EL = 84;
const BOARD: V3 = [2, 24, 0];
const ELECTRODE_L: V3 = [34, 10.4, -4.5];
const S_CLOSE = 21, S_WIDE = 6;
const C_END: V3 = [30, 0, 33];
/** the body point the camera follows: from the board to the left electrode as the pulses run (in the path frame, so the
 *  gait's bob and roll never shake the camera) */
const follow = (t: number): {p: V3; u: number} => {
  const u = sr(t, T_PULSE - 0.04, T_PULSE + 0.5);
  const pp = PATH45(b45S(t));
  const fr = ypr(pp.p, pp.yaw);
  const l: V3 = [lerp(BOARD[0], ELECTRODE_L[0], u), lerp(BOARD[1], ELECTRODE_L[1], u), lerp(BOARD[2], ELECTRODE_L[2], u)];
  return {p: toW(fr, l), u};
};
export const b45View = (f: number): View => {
  const t = f / FPS;
  const fo = follow(t);
  // B4: a slight push as it follows the pulses forward; B5: the pull-out, from the head to the whole turn
  const sClose = S_CLOSE * (1 + 0.06 * fo.u);
  const uo = sr(f, 283, 308);
  const s = sClose * Math.pow(S_WIDE / sClose, uo);
  const at: V3 = [lerp(fo.p[0], C_END[0], uo), lerp(fo.p[1], C_END[1], uo), lerp(fo.p[2], C_END[2], uo)];
  return viewAt(AZ, EL, s, at, 540, lerp(1040, 960, uo));
};

const Scene45: React.FC<{f: number; id: string}> = ({f, id}) => {
  const t = f / FPS;
  const v = b45View(f);
  const pose = b45Pose(t);
  const p = b45Pulse(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Tray2D v={v} x0={-320} x1={340} z0={-260} z1={320} grid={20} />
      <BoxShadow id={`${id}sy`} v={v} b={BLOCK_Y} push={[0.9 * v.s, 1.1 * v.s]} alpha={0.16} />
      <BoxShadow id={`${id}sb`} v={v} b={BLOCK_B} push={[0.9 * v.s, 1.1 * v.s]} alpha={0.16} />
      <Box2D id={`${id}ky`} v={v} b={BLOCK_Y} color={LAB2.foamY} />
      <Box2D id={`${id}kb`} v={v} b={BLOCK_B} color={LAB2.foamB} />
      <Roach2D
        pose={pose}
        v={v}
        o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector', led: p.led, pulses: {antL: p.fr}, zap: {antL: p.zap}}} />}}
      />
    </svg>
  );
};
export const B4: React.FC<ShotProps> = ({f}) => <Scene45 f={f} id="b4" />;
export const B5: React.FC<ShotProps> = ({f}) => <Scene45 f={f} id="b5" />;

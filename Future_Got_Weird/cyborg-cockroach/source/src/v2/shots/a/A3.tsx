// A3 (83-102, "remote"): the match cut. The pressed red button of A2 becomes the backpack's red status LED, lit, at
// the same screen spot and size (an extreme close-up of the medic's board through the ortho kit). The command has
// arrived: a bright signal leaves the LED along a board trace to the front pad and runs up the nichrome lead along the
// tube's near side to the coil at the mouth, which starts to glow (Gear2D heat). One eased pull-back carries the eye
// from the LED to the coil and reveals the board, the loaded injector in its clear tube and the animal's back. The
// injector does not fire here (the hook showed that); this is how it happened.
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {toW, V3} from '../../../lib/v3';
import {clamp, smoother} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {Surface2D, LabWall2, Bench2, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {BoardDetail, LED_B, COIL_B, LENS_R} from './Board';
import {A3R, FPS_A, MATCH_LED as MATCH, matchRadius} from './timingA';

const T0 = A3R.from / FPS_A;
/** the signal leaves the LED, and reaches the coil */
export const A3_SIG0 = T0 + 0.07;
export const A3_SIG1 = T0 + 0.4;
/** the coil heats from the signal's arrival */
export const A3_HEAT0 = A3_SIG1 - 0.02;

// the medic in A1's firing stance (planted, before the release), breathing, antennae searching a little
const S_STOP = plantedStop(36);
const PATH = straightPath([-S_STOP, 0, 0], 0);
export const a3Pose = (t: number): RoachPose =>
  poseRoach({path: PATH, s: S_STOP, t, search: 0.55, antL: {yaw: 0.95, pitch: 0.45}, antR: {yaw: 0.95, pitch: 0.45}});

const AZ = 14, EL = 38;
/** end framing: the LED-coil midpoint here, at this scale */
const S1 = 25;
const SCR1 = {x: 600, y: 1000};
export const a3View = (t: number, pose: RoachPose): View => {
  const s0 = matchRadius() / LENS_R;
  // starts moving at once (a gentle two-frame ease-in), then decelerates into the hold
  const x = clamp((t - T0) / 0.6);
  const u = (1 - Math.pow(1 - x, 2.6)) * smoother(clamp((t - T0) / (2 / FPS_A)) * 0.5 + 0.5);
  const s = Math.exp(Math.log(s0) + (Math.log(S1) - Math.log(s0)) * u);
  const led = toW(pose.frame, [LED_B[0], LED_B[1] + 0.6, LED_B[2]]);
  const coil = toW(pose.frame, COIL_B);
  const mid: V3 = [(led[0] + coil[0]) / 2, (led[1] + coil[1]) / 2, (led[2] + coil[2]) / 2];
  const at: V3 = [led[0] + (mid[0] - led[0]) * u, led[1] + (mid[1] - led[1]) * u, led[2] + (mid[2] - led[2]) * u];
  return viewAt(AZ, EL, s, at, MATCH.x + (SCR1.x - MATCH.x) * u, MATCH.y + (SCR1.y - MATCH.y) * u);
};

export const A3: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS_A;
  const pose = a3Pose(t);
  const v = a3View(t, pose);
  const sig = t < A3_SIG0 ? -1 : (t - A3_SIG0) / (A3_SIG1 - A3_SIG0);
  const heat = clamp((t - A3_HEAT0) / 0.22);
  const flash = Math.exp(-(t - T0) / 0.08);
  const coil = P(v, toW(pose.frame, COIL_B));
  // the tray's far edge (z = -58 mm) where it crosses the frame's centre line, held level
  const farL = P(v, [-400, 0, -58]), farR = P(v, [400, 0, -58]);
  const edge = farL[1] + ((540 - farL[0]) / (farR[0] - farL[0])) * (farR[1] - farL[1]);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="a3-vg" cx="0.5" cy="0.52" r="0.8">
          <stop offset="0.45" stopColor="#0E1820" stopOpacity={0} />
          <stop offset="1" stopColor="#0E1820" stopOpacity={0.28} />
        </radialGradient>
        <filter id="a3-bl" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id="a3-sky">
          <rect x={0} y={-10} width={1080} height={Math.max(0, edge + 10)} />
        </clipPath>
        <radialGradient id="a3-hg">
          <stop offset="0" stopColor="#FFF4C8" stopOpacity={0.9} />
          <stop offset="0.3" stopColor="#FFC85A" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FF9A3A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <Surface2D v={v} x0={-400} x1={400} z0={-200} z1={200} color={LAB2.surface} />
      {/* beyond the tray's far edge (kept level): the lab, far off and soft; it barely moves while the view pulls back */}
      {edge > -40 && (
        <g clipPath="url(#a3-sky)">
          <g filter="url(#a3-bl)">
            <rect x={-100} y={-100} width={1280} height={edge + 140} fill={LAB2.wallBot} />
            <g transform={`translate(-300 ${(edge - 1290).toFixed(1)}) scale(1.3)`}>
              <LabWall2 id="a3w" />
            </g>
            <Bench2 id="a3b" top={edge - 6} k={1.4} />
          </g>
        </g>
      )}
      <Roach2D
        pose={pose}
        v={v}
        o={{
          id: 'a3r',
          gear: (
            <g>
              <Gear2D id="a3g" v={v} f={pose.frame} g={{kind: 'injector', latched: true, heat, led: 1}} />
              <BoardDetail id="a3bd" v={v} f={pose.frame} fx={{led: 1, flash, signal: sig, wake: 0.35}} />
            </g>
          ),
        }}
      />
      {heat > 0 && <circle cx={coil[0].toFixed(1)} cy={coil[1].toFixed(1)} r={(v.s * (2.4 + 3.6 * heat)).toFixed(1)} fill="url(#a3-hg)" opacity={heat} />}
      <rect width={1080} height={1920} fill="url(#a3-vg)" />
    </svg>
  );
};

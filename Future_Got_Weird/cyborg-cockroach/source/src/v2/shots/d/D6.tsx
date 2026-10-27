// D6 (620-654, "But the plan is to send them"): a fresh, loaded medic (a new insect: latched line, full amber dose)
// stands on the bench facing a narrow dark gap between two tall lab blocks, seen three-quarter from behind (az -60,
// el 12). It sets off (from planted feet, accelerating to a steady walk) straight into the gap; the camera follows
// it in with one eased push until the dark gap fills the frame at the cut: a dark vertical opening centred on screen,
// its edges left and right (D6_GAP, matched by E1's opening in the rubble). Inside the gap the walls fall into
// shadow, and the insect darkens as it goes in.
import React from 'react';
import {V2, V3} from '../../../lib/v3';
import {sr, lerp} from '../../../lib/ease';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2, polyD} from '../../roach/ortho';
import {Box2D} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {LabRoomMM} from './room';

const R = shotRange('D6');
/** the gap: its mouth is the plane x = 0, between z = -G and z = +G; the blocks run from x = 0 to x = BL, BH tall */
export const D6_G = 36, D6_BL = 420, D6_BH = 240, D6_BW = 80;
export const D6_AZ = -60, D6_EL = 12;
const S0 = plantedStop(13);
const X_START = -62;
const PATH = straightPath([X_START - S0, 0, 0], 0);
const T_GO = R.from / 30 + 0.12; // it sets off
const V = 62, T_ACC = 0.38;
export const d6S = (t: number) => {
  const u = t - T_GO;
  if (u <= 0) return S0;
  if (u < T_ACC) return S0 + (V * u * u) / (2 * T_ACC);
  return S0 + (V * T_ACC) / 2 + V * (u - T_ACC);
};
export const d6Pose = (t: number): RoachPose => {
  const go = sr(t, T_GO - 0.1, T_GO + 0.3);
  return poseRoach({
    path: PATH, s: d6S(t), t, search: 0.8, seed: 7,
    pitch: -0.025 * go,
    antL: {yaw: lerp(0.75, 0.42, go), pitch: lerp(0.32, 0.12, go), curl: 0.8},
    antR: {yaw: lerp(0.75, 0.42, go), pitch: lerp(0.32, 0.12, go), curl: 0.8},
  });
};
export const d6View = (f: number): View => {
  const u = sr(f, R.from + 2, R.to + 1);
  const e = u * u * (1.6 - 0.6 * u); // a slow start, then it follows into the gap
  return viewAt(D6_AZ, D6_EL, lerp(4.4, 9.4, e), [lerp(-28, 0, e), lerp(55, 66, e), 0], 540, lerp(1000, 880, e));
};
/** the gap's screen geometry (px) at a film frame: x0/x1 the near edges of the opening (left/right), y0 its top
 *  (clamped to the frame), y1 the floor at the mouth */
export const d6Gap = (f: number) => {
  const v = d6View(f);
  const a0 = P(v, [0, 0, -D6_G]), a1 = P(v, [0, D6_BH, -D6_G]);
  const b0 = P(v, [0, 0, D6_G]), b1 = P(v, [0, D6_BH, D6_G]);
  return {x0: Math.round(a0[0]), x1: Math.round(b0[0]), y0: Math.max(0, Math.round(Math.min(a1[1], b1[1]))), y1: Math.round(Math.max(a0[1], b0[1]))};
};

const DARK = '#0A1218';

export const D6: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d6View(f);
  const id = 'd6';
  const pose = d6Pose(t);
  const G = D6_G, L = D6_BL, H = D6_BH, BW = D6_BW;
  const q = (pts: V3[]) => polyD(pts.map((p) => P(v, p)));
  // the far block's inner wall and the gap floor, falling into shadow with depth
  const m0 = P(v, [0, 0, -G]), m1 = P(v, [110, 0, -G]);
  const insectEl = <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />;
  // the insect darkens as it goes into the gap (a gradient over its silhouette from the mouth inward)
  const mouth: V2 = P(v, [0, 0, 0]);
  const deep: V2 = P(v, [55, 0, 0]);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id={`${id}-wg`} gradientUnits="userSpaceOnUse" x1={f2(m0[0])} y1={f2(m0[1])} x2={f2(m1[0])} y2={f2(m1[1])}>
          <stop offset="0" stopColor={DARK} stopOpacity={0.72} />
          <stop offset="1" stopColor={DARK} stopOpacity={0.97} />
        </linearGradient>
        <linearGradient id={`${id}-ig`} gradientUnits="userSpaceOnUse" x1={f2(mouth[0])} y1={f2(mouth[1])} x2={f2(deep[0])} y2={f2(deep[1])}>
          <stop offset="0" stopColor={DARK} stopOpacity={0} />
          <stop offset="1" stopColor={DARK} stopOpacity={0.88} />
        </linearGradient>
        <filter id={`${id}-wh`}>
          <feFlood floodColor="#FFFFFF" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <mask id={`${id}-im`} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
          <g filter={`url(#${id}-wh)`}>{insectEl}</g>
        </mask>
      </defs>
      <LabRoomMM id={`${id}room`} v={v} blur={2 + 0.25 * v.s} plate={1.0} plateDx={-120} tray={[-330, 420, -260, 160]} />
      {/* the far block (left), its inner wall in shadow, the gap's floor */}
      <Box2D id={`${id}bf`} v={v} b={[0, L, 0, H, -G - BW, -G]} color="#5E7C88" />
      <path d={q([[0, 0, -G], [L, 0, -G], [L, H, -G], [0, H, -G]])} fill={`url(#${id}-wg)`} />
      <path d={q([[0, 0, -G], [L, 0, -G], [L, 0, G], [0, 0, G]])} fill={`url(#${id}-wg)`} />
      {/* a soft shadow spilling out of the mouth onto the bench */}
      <path d={q([[-14, 0, -G], [0, 0, -G], [0, 0, G], [-6, 0, G]])} fill={DARK} opacity={0.18} />
      {insectEl}
      <rect x="-200" y="-200" width="1500" height="2400" fill={`url(#${id}-ig)`} mask={`url(#${id}-im)`} />
      {/* the near block (right) */}
      <Box2D id={`${id}bn`} v={v} b={[0, L, 0, H, G, G + BW]} color="#6A8996" />
    </svg>
  );
};

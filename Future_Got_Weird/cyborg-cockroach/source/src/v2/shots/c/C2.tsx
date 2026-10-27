// C2 (345-371, "carries a camera,"): low three-quarter front on the observer (camera module on its back, lighter
// shell) walking toward the viewer's right; one accelerating push to its camera module until the round lens is big
// and centred at the cut. In the last frames the lens glass starts to show what it sees (the feed), so the cut to C3
// (which flies on through the lens) is a match: lens -> feed.
import React from 'react';
import {V3, toW} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {clamp, smoother} from '../../../lib/ease';
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, CAM2, G2} from '../../roach/Gear2D';
import {viewAt, View, P, facing, f2} from '../../roach/ortho';
import {TrayPlane, Beyond2D, farForLip} from './tray';
import {ShotProps} from '../index2';
import {LENS_BODY} from './course';
import {C3Feed} from './Feed';

export const C2_FROM = 345, C2_TO = 372;
export const OBS_TINT = '#6B4030';
const PATH = straightPath([-40, 0, 0], 0);
export const c2Pose = (f: number): RoachPose => {
  const t = f / 30;
  return poseRoach({path: PATH, s: 34 * (t - C2_FROM / 30) + 10, t, seed: 4, search: 0.8, antL: {yaw: 1.0, pitch: 0.42, curl: 0.8}, antR: {yaw: 1.0, pitch: 0.42, curl: 0.8}});
};
/** the push, as log(px per mm): an ease-in through C2 that keeps accelerating on through the lens in C3's first frames */
const S0 = 10.5, S1 = 78;
const logS = (f: number) => {
  const n = C2_TO - 1 - C2_FROM;
  const u = (f - C2_FROM) / n;
  const a = Math.log(S0), b = Math.log(S1);
  if (u <= 1) return a + (b - a) * Math.pow(Math.max(0, u), 1.7);
  const slope = ((b - a) * 1.7) / n, x = f - (C2_TO - 1);
  return b + slope * x + 0.0115 * x * x;
};
export const c2View = (f: number): View => {
  const u = clamp((f - C2_FROM) / (C2_TO - 1 - C2_FROM));
  const k = smoother(Math.min(1, u * 1.15));
  const az = 50 + 16 * k, el = 15 - 6 * k;
  const pose = c2Pose(f);
  const lens = toW(pose.frame, LENS_BODY);
  return viewAt(az, el, Math.exp(logS(f)), lens, 650 - 110 * k, 880 + 80 * k);
};
/** the lens on screen (same geometry Gear2D draws): centre, glass radii (rx is foreshortened by the facing) */
export const c2Lens = (f: number) => {
  const v = c2View(f), pose = c2Pose(f);
  const c = P(v, toW(pose.frame, LENS_BODY));
  const fc = Math.max(0.25, Math.abs(facing(v, pose.frame.x)));
  return {x: c[0], y: c[1], r: CAM2.lens * v.s, rx: CAM2.lens * v.s * fc, ry: CAM2.lens * v.s, fc};
};

/** the lens glass, detailed for close range: bezel, blue glass with depth, inner ring, iris hint, reflections;
 *  `feed` (0..1) shows the camera's image in the glass */
export const LensGlass: React.FC<{id: string; f: number; feed?: number; feedFrame?: number}> = ({id, f, feed = 0, feedFrame}) => {
  const L = c2Lens(f);
  if (L.ry < 14) return null;
  const g = 0.72; // glass / bezel radius ratio (Gear2D)
  const rx = L.rx * g, ry = L.ry * g;
  const W = 1080, H = 1920;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-lg`} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#3C86B8" />
          <stop offset="0.55" stopColor={G2.lens} />
          <stop offset="1" stopColor="#0E2F4A" />
        </radialGradient>
        <clipPath id={`${id}-lc`}>
          <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx)} ry={f2(ry)} />
        </clipPath>
      </defs>
      {/* bezel ring */}
      <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(L.rx)} ry={f2(L.ry)} fill="#3A434B" stroke={INK} strokeWidth={f2(Math.max(2, L.ry * 0.05))} />
      <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(L.rx * 0.9)} ry={f2(L.ry * 0.9)} fill="none" stroke="#56626C" strokeWidth={f2(L.ry * 0.05)} />
      <g clipPath={`url(#${id}-lc)`}>
        <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx)} ry={f2(ry)} fill={`url(#${id}-lg)`} />
        {feed > 0 && feedFrame !== undefined && (
          <g opacity={feed} transform={`translate(${f2(L.x)} ${f2(L.y)}) scale(${(Math.min(1, 2.05 * Math.max(rx / W, ry / H))).toFixed(4)}) translate(${-W / 2} ${-H / 2})`}>
            <C3Feed f={feedFrame} w={W} h={H} id={`${id}-fd`} />
          </g>
        )}
        {/* inner element ring and a hint of the iris */}
        <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx * 0.52)} ry={f2(ry * 0.52)} fill="none" stroke="#0B2236" strokeWidth={f2(ry * 0.05)} opacity={0.55 * (1 - feed)} />
        <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx * 0.22)} ry={f2(ry * 0.22)} fill="#08192A" opacity={0.6 * (1 - feed)} />
        {/* reflections: a soft window arc upper-left and a bright dot */}
        <g opacity={1 - Math.max(0, feed - 0.5) * 2}>
        <path d={`M${f2(L.x - rx * 0.62)},${f2(L.y - ry * 0.12)} A${f2(rx * 0.66)},${f2(ry * 0.66)} 0 0 1 ${f2(L.x - rx * 0.05)},${f2(L.y - ry * 0.64)}`} stroke="#E6F6FF" strokeWidth={f2(ry * 0.09)} fill="none" strokeLinecap="round" opacity={0.55} />
        <ellipse cx={f2(L.x + rx * 0.34)} cy={f2(L.y + ry * 0.4)} rx={f2(rx * 0.16)} ry={f2(ry * 0.07)} fill="#9FD3F0" opacity={0.35} transform={`rotate(-30 ${f2(L.x + rx * 0.34)} ${f2(L.y + ry * 0.4)})`} />
        <circle cx={f2(L.x - rx * 0.3)} cy={f2(L.y - ry * 0.34)} r={f2(ry * 0.07)} fill="#FFFFFF" opacity={0.85} />
        </g>
      </g>
      <ellipse cx={f2(L.x)} cy={f2(L.y)} rx={f2(rx)} ry={f2(ry)} fill="none" stroke={INK} strokeWidth={f2(Math.max(1.5, ry * 0.035))} />
    </g>
  );
};

/** the C2 picture for any frame (C3 keeps pushing through it for its first frames) */
export const C2Scene: React.FC<{f: number; id: string; feed?: number; feedFrame?: number}> = ({f, id, feed, feedFrame}) => {
  const v = c2View(f);
  const pose = c2Pose(f);
  const lu = clamp((f - C2_FROM) / (C2_TO - C2_FROM));
  // the far room: parallax layer (moves and grows much less than the insect)
  // the room beyond is far: the tray's lip and the wall only drift up and grow a little through the push
  const lipY = 640 - 150 * Math.min(1, (f - C2_FROM) / (C2_TO - C2_FROM));
  const trayC: V3 = [pose.frame.o[0], 0, pose.frame.o[2]];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <Beyond2D id={`${id}-lb`} lipY={lipY} k={1.15 + 0.15 * lu} dx={-40 * lu} blur={9 + 4 * lu} />
      <TrayPlane v={v} c={trayC} far={farForLip(v, trayC, lipY)} lip={Math.min(6, 40 / v.s)} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, tint: OBS_TINT, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'camera'}} />}} />
      <LensGlass id={`${id}lg`} f={f} feed={feed} feedFrame={feedFrame} />
    </svg>
  );
};

export const C2: React.FC<ShotProps> = ({f}) => {
  // the glass begins to show the camera's picture in the last frames (the feed frame runs ahead to C3's first)
  const feed = clamp((f - 364) / 7) * 0.5;
  return <C2Scene f={f} id={`c2-${f}`} feed={feed} feedFrame={f} />;
};

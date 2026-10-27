// Group E (V3 rescue journey) shared helpers: per-frame SVG ids, an end-frame authoring wrap for the layer camera,
// uneven ground under the insect's feet (planted feet lifted onto a height field), the feed look (C3's grade,
// vignette and rolling scan band, copied from shots/c/Feed.tsx so the observer's feeds match) and a few flat props.
// Pure functions of their inputs.
import React from 'react';
import {RoachPose} from '../../../../rig/roach';
import {V3} from '../../../../lib/v3';
import {Cam} from '../../../dc/camera';
import {f2} from '../art';

export const FPS = 30;

/** unique SVG id prefix per shot and per frame */
export const idf = (prefix: string, f: number) => `${prefix}f${f}`;

/** content authored in END-frame screen px for a layer at depth d (identity on screen when the camera is at `end`) */
export const endWrap = (end: Cam, d: number) => {
  const z = 1 + (end.z - 1) / d, cx = 540 + (end.x - 540) / d, cy = 960 + (end.y - 960) / d;
  return `translate(${(cx - 540 / z).toFixed(3)} ${(cy - 960 / z).toFixed(3)}) scale(${(1 / z).toFixed(5)})`;
};

/** a height field under the insect: each foot (and its ankle, so the leg re-solves) is lifted to h(x, z) (mm); a
 *  swinging foot clears the higher of where it left and where it lands. The body is raised by the caller (motion
 *  offset) to the mean height under its feet. */
export const onGround = (pose: RoachPose, h: (x: number, z: number) => number): RoachPose => ({
  ...pose,
  legs: pose.legs.map((l) => {
    const dy = h(l.foot[0], l.foot[2]);
    const up = (p: V3): V3 => [p[0], p[1] + dy, p[2]];
    return {...l, foot: up(l.foot), ankle: up(l.ankle)};
  }),
});

/** the feed grade (C3): a cooler colour matrix, applied as a filter on the feed's scene */
export const FeedGrade: React.FC<{id: string}> = ({id}) => (
  <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values="0.86 0.09 0.02 0 0  0.04 0.91 0.06 0 0.005  0.03 0.08 0.95 0 0.035  0 0 0 1 0" />
  </filter>
);

/** the feed look over a w x h feed (as C3's FeedLook): one rolling scan band, a faint cool cast, a soft vignette */
export const FeedLook: React.FC<{f: number; w: number; h: number; id: string; vig?: number}> = ({f, w, h, id, vig = 0.55}) => {
  const k = h / 1920;
  const band = ((f * 23 * k) % (h + 400 * k)) - 200 * k;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-vg`} cx="50%" cy="48%" r="75%">
          <stop offset="0.55" stopColor="#0B1A24" stopOpacity="0" />
          <stop offset="1" stopColor="#0B1A24" stopOpacity={vig} />
        </radialGradient>
        <linearGradient id={`${id}-sb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DFF4FF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#DFF4FF" stopOpacity="0.07" />
          <stop offset="1" stopColor="#DFF4FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={f2(band)} width={w} height={f2(160 * k)} fill={`url(#${id}-sb)`} />
      <path d={`M0,${f2(band + 80 * k)} H${w}`} stroke="#E8F7FF" strokeWidth={f2(Math.max(1, 1.5 * k))} opacity={0.12} />
      <rect x={0} y={0} width={w} height={h} fill="#2C6E8E" opacity={0.06} />
      <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-vg)`} />
    </g>
  );
};

/** a soft blurred blob (out-of-focus foreground or haze), flat colour */
export const Blur: React.FC<{id: string; sd: number; children: React.ReactNode; opacity?: number}> = ({id, sd, children, opacity}) => (
  <g opacity={opacity}>
    <defs>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={f2(sd)} />
      </filter>
    </defs>
    <g filter={`url(#${id})`}>{children}</g>
  </g>
);

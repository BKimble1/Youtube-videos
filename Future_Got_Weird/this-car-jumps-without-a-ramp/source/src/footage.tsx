// The real demonstration footage (BYD's EV-Tech 03 clip, as screen-recorded by the owner; see footage/README.md) and the
// maths that lays the illustrated car exactly over the real one for the match cuts.
//
// What the clip shows (frames 230-328 of the recording, a slow-motion edit by BYD): the car clear of the pavement with a
// shadow under it, a slow push-in, a fast drop and a landing at about frame 305-315, then a settle. It is used here at
// its own 30 fps, one frame per frame, never re-timed or interpolated, so nothing about it measures response time.
import React from 'react';
import {Freeze, OffthreadVideo, Sequence, staticFile} from 'remotion';
import track from './data/wheel_track.json';
import {AXLE_R, WHEEL_R} from './car/geom';

export type Crop = {x0: number; y0: number; w: number; h: number};
export type RealSpec = {file: string; from: number; to: number; crop: Crop; frame0: number};

const FPS = 30;
export const REAL = {
  // frame0 = film frame at which the first real frame is shown
  open: {file: 'footage/real_open.mp4', from: 273, to: 328, crop: {x0: 0, y0: 104, w: 1552, h: 873}, frame0: 0} as RealSpec,
  replay: {file: 'footage/real_replay.mp4', from: 262, to: 328, crop: {x0: 368, y0: 104, w: 1552, h: 873}, frame0: Math.round(108.04 * FPS)} as RealSpec,
  credit: 'BYD demonstration video',
};
export const realFrames = (r: RealSpec) => r.to - r.from + 1;
export const realEnd = (r: RealSpec) => (r.frame0 + realFrames(r)) / FPS; // film time just after the last real frame

type TrackPt = {r: [number, number]; f: [number, number]};
const TRACK = track as unknown as Record<string, TrackPt>;

/** Source-recording pixel -> film screen pixel (1920x1080) for a crop. */
export const srcToScreen = (c: Crop, px: number, py: number) => ({x: ((px - c.x0) * 1920) / c.w, y: ((py - c.y0) * 1080) / c.h});

/** Alignment of the illustrated car with the real car at recording frame n inside a crop. */
export const alignAt = (c: Crop, n: number) => {
  const t = TRACK[String(Math.max(230, Math.min(328, Math.round(n))))];
  const r = srcToScreen(c, t.r[0], t.r[1]);
  const f = srcToScreen(c, t.f[0], t.f[1]);
  const s = (f.x - r.x) / 2900; // screen px per mm
  const th = Math.atan2(f.y - r.y, f.x - r.x);
  return {s, th, r, f};
};
/** SVG matrix mapping car-world mm (y up, origin on the ground below mid-wheelbase) onto the screen at that alignment. */
export const alignMatrix = (c: Crop, n: number) => {
  const {s, th, r} = alignAt(c, n);
  const cs = Math.cos(th), sn = Math.sin(th);
  // world point (x, y): dx from the rear axle, dy from the wheel-centre height; screen y runs down
  return {s, th, m: `matrix(${s * cs} ${s * sn} ${s * sn} ${-s * cs} ${r.x - s * (cs * AXLE_R + sn * WHEEL_R)} ${r.y - s * (sn * AXLE_R - cs * WHEEL_R)})`};
};
/** The standard camera (x, y, z) that frames the car exactly as the alignment does (ignores the sub-degree tilt). */
export const camFromAlign = (c: Crop, n: number) => {
  const {s, r} = alignAt(c, n);
  return {x: AXLE_R - (r.x - 960) / s, y: WHEEL_R + (r.y - 540) / s, z: s};
};
/** Recording frame shown at film time t (clamped to the clip's own frames). */
export const realFrameAt = (r: RealSpec, t: number) => Math.max(r.from, Math.min(r.to, r.from + Math.round(t * FPS) - r.frame0));

/** The real clip full-frame at its own timing. `fadeHold` keeps the last frame under a dissolve that outlasts it. */
export const RealClip: React.FC<{spec: RealSpec; hold?: number; opacity?: number}> = ({spec, hold = 0, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const n = realFrames(spec);
  const vid = (
    <OffthreadVideo src={staticFile(spec.file)} muted pauseWhenBuffering={false} style={{position: 'absolute', inset: 0, width: 1920, height: 1080, objectFit: 'fill'}} />
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <Sequence from={spec.frame0} durationInFrames={n} layout="none">{vid}</Sequence>
      {hold > 0 && (
        <Sequence from={spec.frame0 + n} durationInFrames={hold} layout="none">
          <Freeze frame={n - 1}>
            <Sequence from={-(spec.frame0 + n)} layout="none">{vid}</Sequence>
          </Freeze>
        </Sequence>
      )}
    </div>
  );
};

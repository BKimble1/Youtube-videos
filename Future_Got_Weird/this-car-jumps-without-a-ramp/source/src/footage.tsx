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
export type RealSpec = {file: string; from: number; to: number; crop: Crop; frame0: number; fileFrom?: number};

const FPS = 30;
export const REAL = {
  // frame0 = film frame at which the first real frame is shown
  open: {file: 'footage/real_open.mp4', from: 273, to: 328, crop: {x0: 0, y0: 104, w: 1552, h: 873}, frame0: 0} as RealSpec,
  replay: {file: 'footage/real_replay.mp4', from: 262, to: 328, crop: {x0: 368, y0: 104, w: 1552, h: 873}, frame0: Math.round(108.04 * FPS)} as RealSpec,
  credit: 'BYD demonstration video',
};
// Clips cut from BYD's jump film (second recording; see tools/ingest_footage.py cut2). `use` plays frames [from, to] of a cut
// file (whose first frame is recording frame `fileFrom`) starting at film time t0, one recording frame per film frame.
const CROP_WIDE: Crop = {x0: 100, y0: 130, w: 1369, h: 770};
const use = (file: string, fileFrom: number, from: number, to: number, crop: Crop, t0: number): RealSpec => ({file: `footage/${file}`, fileFrom, from, to, crop, frame0: Math.round(t0 * FPS)});
const DRIVE_CROP: Crop = {x0: 200, y0: 130, w: 1369, h: 770};
export const JUMP_CROP: Crop = {x0: 330, y0: 130, w: 1280, h: 720};
export const FILM = {
  /** the front wheel at the lip of the pit, then the high angle: under "so what does making a supercar jump actually prove?" */
  question: (t0: number) => [use('real_pit.mp4', 480, 536, 570, CROP_WIDE, t0), use('real_pit.mp4', 480, 575, 613, CROP_WIDE, t0 + 35 / FPS)],
  /** the side view from rolling in to takeoff, flight and landing, uninterrupted */
  jump: (t0: number) => use('real_jump.mp4', 316, 316, 458, JUMP_CROP, t0),
  /** the low front three-quarter, the car clear of the road */
  hover: (t0: number) => use('real_pit.mp4', 480, 480, 532, CROP_WIDE, t0),
  corner: (t0: number, to = 732) => use('real_corner.mp4', 691, 691, to, CROP_WIDE, t0),
  /** the drive-away: a steady wide side pass, then the drone from the front, over the roof and down the road behind the car */
  driveA: (t0: number) => use('real_driveA.mp4', 1508, 1508, 1556, DRIVE_CROP, t0),
  driveB: (t0: number) => use('real_driveB.mp4', 1557, 1557, 1700, DRIVE_CROP, t0),
};
/** Where the two wheel centres of the side jump sit at recording frame 318 (cut-in), for the dissolve from the illustration. */
export const JUMP_MATCH = {r: [597, 683] as [number, number], f: [1191, 686] as [number, number]};
export const alignFixed = (c: Crop, r: [number, number], f: [number, number]) => {
  const rr = srcToScreen(c, r[0], r[1]), ff = srcToScreen(c, f[0], f[1]);
  const s = (ff.x - rr.x) / 2900;
  const th = Math.atan2(ff.y - rr.y, ff.x - rr.x);
  const cs = Math.cos(th), sn = Math.sin(th);
  return {s, th, r: rr, f: ff, m: `matrix(${s * cs} ${s * sn} ${s * sn} ${-s * cs} ${rr.x - s * (cs * AXLE_R + sn * WHEEL_R)} ${rr.y - s * (sn * AXLE_R - cs * WHEEL_R)})`, cam: {x: AXLE_R - (rr.x - 960) / s, y: WHEEL_R + (rr.y - 540) / s, z: s}};
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
    <OffthreadVideo src={staticFile(spec.file)} startFrom={spec.from - (spec.fileFrom ?? spec.from)} muted pauseWhenBuffering={false} style={{position: 'absolute', inset: 0, width: 1920, height: 1080, objectFit: 'fill'}} />
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

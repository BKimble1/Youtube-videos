import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** [seconds into the clip file, value] keyframes, linearly interpolated (a repeated time makes a hard step). */
export type Key = [number, number];
export const keyed = (v: number | Key[], t: number) => {
  if (typeof v === 'number') return v;
  if (t <= v[0][0]) return v[0][1];
  for (let i = 1; i < v.length; i++) {
    if (t <= v[i][0]) {
      const [t0, a] = v[i - 1];
      const [t1, b] = v[i];
      return t1 === t0 ? b : a + ((b - a) * (t - t0)) / (t1 - t0);
    }
  }
  return v[v.length - 1][1];
};

export type ClipProps = {
  src: string;            // file in public/footage/
  from: number;           // seconds into the file at the shot's first frame
  rate?: number;          // playback rate
  cx?: number | Key[];    // crop centre, fraction of the 1920 px source width (keys in file seconds)
  cy?: number | Key[];    // crop centre, fraction of the 1080 px source height
  zoom?: number;          // >= 1 on top of the 9:16 cover fit
  push?: number;          // extra zoom gained across the shot (slow push-in)
  volume?: number | ((t: number) => number); // demo audio level; t = seconds into the shot
  dim?: number;           // 0..1 darkening (for overlays)
};

/** Real footage, cropped to 9:16 by a centre that can follow the car. Never shows letterbox edges. */
export const Clip: React.FC<ClipProps> = ({src, from, rate = 1, cx = 0.5, cy = 0.5, zoom = 1, push = 0, volume = 0, dim = 0}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H, durationInFrames} = useVideoConfig();
  const tFile = from + (frame / fps) * rate;
  const S = (H / 1080) * zoom * (1 + push * (frame / Math.max(1, durationInFrames)));
  const vw = 1920 * S;
  const vh = 1080 * S;
  const left = Math.min(0, Math.max(W - vw, W / 2 - keyed(cx, tFile) * vw));
  const top = Math.min(0, Math.max(H - vh, H / 2 - keyed(cy, tFile) * vh));
  const vol = typeof volume === 'number' ? volume : (f: number) => volume(f / fps);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile('footage/' + src)}
        trimBefore={Math.round(from * fps)}
        playbackRate={rate}
        volume={vol}
        style={{position: 'absolute', left, top, width: vw, height: vh}}
      />
      {dim > 0 && <AbsoluteFill style={{background: `rgba(6,12,16,${dim})`}} />}
    </AbsoluteFill>
  );
};

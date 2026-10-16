// 16:9 footage player. `view(ts)` gives the framing at shot time ts (seconds since the shot started): the source
// point (x, y) in 1920x1080 source pixels placed at the frame centre, at zoom z (>= 1). The frame is clamped so the
// picture always covers the frame (no letterbox edges). Holds no camera moves unless a scene asks for one.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type View = {x: number; y: number; z: number};
export const Foot: React.FC<{src: string; from?: number; rate?: number; view?: (ts: number) => View; volume?: number | ((ts: number) => number); dim?: number; muted?: boolean}> = ({src, from = 0, rate = 1, view, volume = 0, dim = 0, muted = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ts = frame / fps;
  const v = view ? view(ts) : {x: 960, y: 540, z: 1};
  const S = Math.max(1, v.z);
  const left = Math.min(0, Math.max(1920 - 1920 * S, 960 - v.x * S));
  const top = Math.min(0, Math.max(1080 - 1080 * S, 540 - v.y * S));
  const vol = typeof volume === 'number' ? volume : (f: number) => volume(f / fps);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('footage/' + src)} trimBefore={Math.round(from * fps)} playbackRate={rate} volume={vol} muted={muted}
        style={{position: 'absolute', left, top, width: 1920 * S, height: 1080 * S}} />
      {dim > 0 && <AbsoluteFill style={{background: `rgba(6,12,16,${dim})`}} />}
    </AbsoluteFill>
  );
};

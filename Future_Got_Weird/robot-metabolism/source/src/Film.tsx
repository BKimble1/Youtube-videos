import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {CAPTIONS, FPS} from './lib/time';
import {CaptionView} from './Captions';
import {SHOTS, capPlace} from './shots';

/** the caption showing at frame f (shows and hides on whole frames) */
const capAt = (f: number) => {
  const i = CAPTIONS.findIndex((c, k) => f >= (k === 0 ? 0 : Math.round(c.show * FPS)) && f < Math.round(c.hide * FPS));
  return i < 0 ? null : i;
};

export const FilmFrame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  const ci = captions ? capAt(f) : null;
  return (
    <AbsoluteFill style={{backgroundColor: '#F2E8D5', overflow: 'hidden'}}>
      {shot.view(t)}
      {ci !== null && <CaptionView c={CAPTIONS[ci]} y={capPlace(ci, t)} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{captions: boolean; audio: string; frame?: number}> = ({captions, audio, frame}) => {
  const cur = useCurrentFrame();
  const f = frame ?? cur;
  return (
    <>
      <FilmFrame f={f} captions={captions} />
      {audio && frame === undefined && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {CAPTIONS, FPS} from './lib/time';
import {CaptionView} from './Captions';
import {SHOTS, capPlace, Shot} from './shots';
import {SHOTS2, capPlace2} from './v2/shots2';

const VERSIONS: Record<number, {shots: Shot[]; cap: (i: number, t: number) => number}> = {1: {shots: SHOTS, cap: capPlace}, 2: {shots: SHOTS2, cap: capPlace2}};

/** the caption showing at frame f (shows and hides on whole frames) */
const capAt = (f: number) => {
  const i = CAPTIONS.findIndex((c, k) => f >= (k === 0 ? 0 : Math.round(c.show * FPS)) && f < Math.round(c.hide * FPS));
  return i < 0 ? null : i;
};

export const FilmFrame: React.FC<{f: number; captions: boolean; v?: number}> = ({f, captions, v = 1}) => {
  const t = f / FPS;
  const {shots, cap} = VERSIONS[v];
  const shot = shots.find((s) => t >= s.from && t < s.to) ?? shots[shots.length - 1];
  const ci = captions ? capAt(f) : null;
  return (
    <AbsoluteFill style={{backgroundColor: '#F2E8D5', overflow: 'hidden'}}>
      {shot.view(t)}
      {ci !== null && <CaptionView c={CAPTIONS[ci]} y={cap(ci, t)} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{captions: boolean; audio: string; frame?: number; v?: number}> = ({captions, audio, frame, v = 1}) => {
  const cur = useCurrentFrame();
  const f = frame ?? cur;
  return (
    <>
      <FilmFrame f={f} captions={captions} v={v} />
      {audio && frame === undefined && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

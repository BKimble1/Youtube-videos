import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {SCENES, MAIN_FRAMES} from './scenes/list';
import {ramp} from './kit/ease';

export {MAIN_FRAMES};
const XF = 9; // cross-dissolve length (frames) where a scene asks for it

// Scenes all read the absolute frame; each is mounted only inside its window (plus the dissolve overlap).
export const Main: React.FC<{audio: 'mix' | 'narration' | false}> = ({audio}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map((sc, i) => {
        const next = SCENES[i + 1];
        const end = next ? next.from + (next.enter === 'dissolve' ? XF : 0) : MAIN_FRAMES;
        if (f < sc.from || f >= end) return null;
        const a = sc.enter === 'dissolve' && i > 0 ? ramp(f, sc.from, sc.from + XF) : 1;
        const S = sc.C;
        return (
          <AbsoluteFill key={sc.id} style={{opacity: a}}>
            <S />
          </AbsoluteFill>
        );
      })}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_review.wav')} />}
      {audio === 'narration' && <Audio src={staticFile('audio/narration_review.wav')} />}
    </AbsoluteFill>
  );
};

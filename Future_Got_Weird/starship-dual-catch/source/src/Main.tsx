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
        // slow documentary drift so no shot holds perfectly still (alternating push-in / pull-out, slight lateral)
        const p = (f - sc.from) / Math.max(1, end - sc.from);
        // keep at least 2% overscan so the lateral move never exposes the frame edge (1920 * 0.01 = 19 px > 14 px)
        const k = i % 2 === 0 ? 1.02 + 0.03 * p : 1.05 - 0.03 * p;
        const dx = (i % 3 === 0 ? -1 : 1) * 14 * p;
        return (
          <AbsoluteFill key={sc.id} style={{opacity: a}}>
            <AbsoluteFill style={{transform: `translateX(${dx}px) scale(${k})`, transformOrigin: '50% 50%'}}>
              <S />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_review.wav')} />}
      {audio === 'narration' && <Audio src={staticFile('audio/narration_review.wav')} />}
    </AbsoluteFill>
  );
};

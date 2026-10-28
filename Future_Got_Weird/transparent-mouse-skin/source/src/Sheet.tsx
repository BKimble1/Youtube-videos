// Contact sheet: 12 frames of the film at 1/4 size with their times (QA).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Frame} from './Film';
import {FPS} from './lib';

export const Sheet: React.FC<{frames: number[]; captions: boolean}> = ({frames, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111', display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
    {frames.map((f) => (
      <div key={f} style={{width: 320, height: 720, position: 'relative', overflow: 'hidden'}}>
        <div style={{width: 1080, height: 1920, transform: 'scale(0.2963)', transformOrigin: '0 0', position: 'absolute'}}>
          <Frame f={f} captions={captions} />
        </div>
        <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', font: '700 22px monospace', textShadow: '0 0 4px #000'}}>{`f${f} ${(f / FPS).toFixed(2)}s`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

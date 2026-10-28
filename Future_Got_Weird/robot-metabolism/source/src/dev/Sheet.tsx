// Contact sheet: 12 film frames at half size (4 x 3), each labelled with its frame and time.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FilmFrame} from '../Film';
import {IdCtx} from '../Scene3D';

export const Sheet: React.FC<{frames: number[]; captions: boolean}> = ({frames, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {frames.slice(0, 12).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 1080, top: Math.floor(i / 4) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
        <IdCtx.Provider value={`c${i}`}>
          <FilmFrame f={f} captions={captions} />
        </IdCtx.Provider>
        <div style={{position: 'absolute', left: 16, top: 12, font: '700 44px monospace', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 10px'}}>{`f${f} ${(f / 30).toFixed(2)}s`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

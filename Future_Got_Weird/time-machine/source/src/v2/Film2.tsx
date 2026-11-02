import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../lib';
import {Scene2} from './Scene2';

export const Frame2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#0B0E1D', overflow: 'hidden'}}>
    <Scene2 t={f / FPS} fkey={`g${f}_`} captions={captions} />
  </AbsoluteFill>
);
export const Film2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Sheet2: React.FC<{fs: number[]; captions: boolean; cols?: number}> = ({fs, captions, cols = 4}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame2 f={f} captions={captions} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 80, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

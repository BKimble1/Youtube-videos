// The film: one Scene per frame, the mix underneath; and a contact sheet of chosen frames for checking.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './lib';
import {Scene} from './Scene';

export const Frame: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{backgroundColor: '#D9B985', overflow: 'hidden'}}>
    <Scene t={f / FPS} fkey={`f${f}_`} />
  </AbsoluteFill>
);
export const Film: React.FC<{audio: string | false}> = ({audio}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Sheet: React.FC<{fs: number[]; cols?: number}> = ({fs, cols = 4}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame f={f} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 80, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

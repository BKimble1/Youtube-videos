// The film: one Scene per frame, the mix underneath; and a contact sheet of chosen frames for checking.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './lib';
import {Scene} from './Scene';
import {Scene2} from './v2/Scene2';
import {Scene3} from './v3/Scene3';
import {Scene4} from './v4/Scene4';
import {Scene5} from './v5/Scene5';

export const Frame: React.FC<{f: number; captions: boolean; v2?: boolean; v3?: boolean; v4?: boolean; v5?: boolean}> = ({f, captions, v2, v3, v4, v5}) => (
  <AbsoluteFill style={{backgroundColor: '#0D111C', overflow: 'hidden'}}>
    {v5 ? <Scene5 t={f / FPS} fkey={`f${f}_`} captions={captions} /> : v4 ? <Scene4 t={f / FPS} fkey={`f${f}_`} captions={captions} /> : v3 ? <Scene3 t={f / FPS} fkey={`f${f}_`} captions={captions} /> : v2 ? <Scene2 t={f / FPS} fkey={`f${f}_`} captions={captions} /> : <Scene t={f / FPS} fkey={`f${f}_`} captions={captions} />}
  </AbsoluteFill>
);
export const Film: React.FC<{audio: string | false; captions: boolean; v2?: boolean; v3?: boolean; v4?: boolean; v5?: boolean}> = ({audio, captions, v2, v3, v4, v5}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} v2={v2} v3={v3} v4={v4} v5={v5} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Sheet: React.FC<{fs: number[]; captions: boolean; cols?: number; v2?: boolean; v3?: boolean; v4?: boolean; v5?: boolean}> = ({fs, captions, cols = 4, v2, v3, v4, v5}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame f={f} captions={captions} v2={v2} v3={v3} v4={v4} v5={v5} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 80, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

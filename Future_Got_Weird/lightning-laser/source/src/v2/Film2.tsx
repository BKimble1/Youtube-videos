// Lightning Laser V2: the composition. One scene function of the frame; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capY2} from './captions2';
import {SceneV2} from './shots2';

export const FrameV2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#0E1826', overflow: 'hidden'}}>
      <SceneV2 t={t} />
      {captions && <Captions t={t} cy={capY2(t)} />}
    </AbsoluteFill>
  );
};
export const FilmV2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FrameV2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStillV2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <FrameV2 f={f} captions={captions} />;
export const SheetV2: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <FrameV2 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

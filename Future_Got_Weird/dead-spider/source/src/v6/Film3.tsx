// The V6 film: one shot per time range (world3.CUT), captions on top, the V6 mix (V2 narration, unchanged) underneath.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../lib';
import {Captions3} from './Captions3';
import {Hook3} from './shots/Hook3';
import {Nature3} from './shots/Nature3';
import {Leaf3} from './shots/Leaf3';
import {Lab3} from './shots/Lab3';
import {CUT} from './world3';

export const shotAt3 = (t: number): React.ReactNode => {
  if (t < CUT.nature) return <Hook3 t={t} />;
  if (t < CUT.leaf) return <Nature3 t={t} />;
  if (t < CUT.lab) return <Leaf3 t={t} />;
  return <Lab3 t={t} />;
};

export const Frame3: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
      {shotAt3(t)}
      {captions && <Captions3 t={t} />}
    </AbsoluteFill>
  );
};
export const Film3: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame3 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Sheet3: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame3 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

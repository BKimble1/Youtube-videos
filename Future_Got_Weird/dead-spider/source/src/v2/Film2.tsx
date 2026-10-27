// The V2 film: one shot per time range (world2.CUT), captions on top, the V2 mix underneath.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../lib';
import {Captions2} from './Captions2';
import {Hook} from './shots/Hook';
import {Overhead} from './shots/Overhead';
import {Cutaway} from './shots/Cutaway';
import {Lab} from './shots/Lab';
import {CUT} from './world2';

export const shotAt2 = (t: number): React.ReactNode => {
  if (t < CUT.overhead) return <Hook t={t} />;
  if (t < CUT.leg) return <Overhead t={t} />;
  if (t < CUT.lab) return <Cutaway t={t} />;
  return <Lab t={t} />;
};

export const Frame2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
      {shotAt2(t)}
      {captions && <Captions2 t={t} />}
    </AbsoluteFill>
  );
};

export const Film2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

/** contact sheet: up to 12 frames, 4 across at quarter size */
export const Sheet2: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame2 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

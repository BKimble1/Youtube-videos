// FGW "Real Web Fluid" V2: the composition. Picture rebuilt on the locked V1 narration (same words, same timing);
// each frame is one scene function of the frame number; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capY2} from './captions2';
import {StreetScene2} from './Street2';
import {LabScene2} from './Lab2';
import {MACRO, MacroScene2} from './Macro2';

export const SceneAt2: React.FC<{f: number}> = ({f}) => (f < MACRO.start ? <StreetScene2 f={f} /> : f < MACRO.end ? <MacroScene2 f={f} /> : <LabScene2 f={f} />);

export const Frame2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
    <SceneAt2 f={f} />
    {captions && <Captions t={f / FPS} cy={capY2(f / FPS)} />}
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
export const FilmStill2: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame2 f={t * FPS} captions={captions} />;

/** contact sheet: up to 12 frames (given as frame numbers), 4 across at quarter size */
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

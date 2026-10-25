// Glass Climbing V5: the composition. One scene function of the frame; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capSide, capY} from './captions5';
import {CamOnly, SceneAt5} from './shots5';

export const Frame5: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <SceneAt5 f={f} />
    {captions && <Captions t={f / FPS} cy={capY(f / FPS)} side={capSide(f / FPS)} />}
  </AbsoluteFill>
);
export const Film5: React.FC<{audio: string | false; captions: boolean; camOnly?: boolean}> = ({audio, captions, camOnly = false}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CamOnly.Provider value={camOnly}>
        <Frame5 f={f} captions={captions} />
      </CamOnly.Provider>
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill5: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Frame5 f={f} captions={captions} />;
/** contact sheet: up to 12 frames, 4 across at quarter size */
export const Sheet5: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame5 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

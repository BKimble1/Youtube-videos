// Glass Climbing V7: the composition. One scene function of the frame; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {FPS} from '../v6/tl6';
import {Captions7} from './Captions7';
import {CamOnly, SceneAt7} from './shots7';

export const Frame7: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <SceneAt7 f={f} />
    {captions && <Captions7 t={f / FPS} />}
  </AbsoluteFill>
);
export const Film7: React.FC<{audio: string | false; captions: boolean; camOnly?: boolean}> = ({audio, captions, camOnly = false}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CamOnly.Provider value={camOnly}>
        <Frame7 f={f} captions={captions} />
      </CamOnly.Provider>
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill7: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Frame7 f={f} captions={captions} />;
/** contact sheet: up to 12 frames, 4 across at quarter size */
export const Sheet7: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame7 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

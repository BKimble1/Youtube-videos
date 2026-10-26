// Glass Climbing V8: the composition. One scene function of the frame; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {FPS} from '../v6/tl6';
import {Captions8} from './Captions8';
import {CamOnly, SceneAt8} from './shots8';

export const Frame8: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <SceneAt8 f={f} />
    {captions && <Captions8 t={f / FPS} />}
  </AbsoluteFill>
);
export const Film8: React.FC<{audio: string | false; captions: boolean; camOnly?: boolean}> = ({audio, captions, camOnly = false}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CamOnly.Provider value={camOnly}>
        <Frame8 f={f} captions={captions} />
      </CamOnly.Provider>
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill8: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Frame8 f={f} captions={captions} />;
/** contact sheet: up to 12 frames, 4 across at quarter size */
export const Sheet8: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame8 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

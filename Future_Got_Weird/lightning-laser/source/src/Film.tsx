// Lightning Laser: the composition. Each frame is one scene function of the frame number; captions and the
// vignette's label in screen space on top (never inside a camera transform).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {Captions, IllustrationTag} from './Captions';
import {FPS, ss} from './lib';
import {capY} from './captions';
import {SceneFrame, T} from './shots';

export const Frame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  const tag = t >= T.D0 && t < T.E0 ? 1 - ss(t, T.E0 - 0.25, T.E0) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#0E1826', overflow: 'hidden'}}>
      <SceneFrame f={f} />
      {tag > 0 && <IllustrationTag opacity={tag} />}
      {captions && <Captions t={t} cy={capY(t)} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Frame f={f} captions={captions} />;

/** contact sheet: up to 16 frames, 4 across at quarter size */
export const Sheet: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

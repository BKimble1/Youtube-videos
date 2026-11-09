// The film: the active shot (a pure function of t) plus burned-in captions in screen space.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions} from './Captions';
import {FPS} from './lib';
import {shotAt} from './story';
import {SHOT_VIEWS, capBox} from './shots';
import {resetIds} from './core/ids';

export const Frame: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  resetIds(`f${Math.round(t * 30)}_`);
  const S = SHOT_VIEWS[shotAt(t)];
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <S t={t} />
      {captions && <Captions t={t} box={capBox} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

/** contact sheet: several frames of the film in one document (cells are phone size: 1080/cols wide) */
export const Sheet: React.FC<{fs: number[]; captions: boolean; cols: number}> = ({fs, captions, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame t={f / FPS} captions={captions} />
          <div style={{position: 'absolute', left: 12, top: 8, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

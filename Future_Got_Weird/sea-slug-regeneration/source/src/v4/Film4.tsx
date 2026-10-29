// V4 film: the V2 compositor (Picture2) driven by the V4 timeline and caption placement
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H} from '../lib';
import {FilmDef, Picture2} from '../v2/Film2';
import {CUTS4, stateAt4} from './shots4';
import {capPlace4} from '../captions';

export const V4DEF: FilmDef = {stateAt: stateAt4, cuts: CUTS4, place: (i) => capPlace4(i)};

export const Picture4: React.FC<{f: number; captions?: boolean; idp?: string}> = ({f, captions = true, idp = 'v'}) => <Picture2 f={f} captions={captions} idp={idp} def={V4DEF} />;

export const Film4: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <>
      <Picture4 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

export const Sheet4: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.slice(0, 16).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Picture4 f={f} captions={captions} idp={`f${f}`} />
        <div style={{position: 'absolute', right: 24, bottom: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f} · {(f / FPS).toFixed(2)}s</div>
      </div>
    ))}
  </AbsoluteFill>
);

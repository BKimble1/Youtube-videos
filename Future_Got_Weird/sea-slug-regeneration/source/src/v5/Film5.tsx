// V5 film: the V2 compositor (Picture2) driven by the V5 timeline and caption placement
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H} from '../lib';
import {FilmDef, Picture2} from '../v2/Film2';
import {CUTS5, stateAt5} from './shots5';
import {capPlace5} from '../captions';

export const V5DEF: FilmDef = {stateAt: stateAt5, cuts: CUTS5, place: (i) => capPlace5(i)};

export const Picture5: React.FC<{f: number; captions?: boolean; idp?: string}> = ({f, captions = true, idp = 'v'}) => <Picture2 f={f} captions={captions} idp={idp} def={V5DEF} />;

export const Film5: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <>
      <Picture5 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

export const Sheet5: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.slice(0, 16).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Picture5 f={f} captions={captions} idp={`f${f}`} />
        <div style={{position: 'absolute', right: 24, bottom: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f} · {(f / FPS).toFixed(2)}s</div>
      </div>
    ))}
  </AbsoluteFill>
);

// V6 film: the V2 compositor (Picture2) driven by the V6 timeline and caption placement
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, W, H} from '../lib';
import {FilmDef, Picture2} from '../v2/Film2';
import {CUTS6, stateAt6} from './shots6';
import {capPlace6} from '../captions';

export const V6DEF: FilmDef = {stateAt: stateAt6, cuts: CUTS6, place: (i) => capPlace6(i)};

export const Picture6: React.FC<{f: number; captions?: boolean; idp?: string}> = ({f, captions = true, idp = 'v'}) => <Picture2 f={f} captions={captions} idp={idp} def={V6DEF} />;

export const Film6: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <>
      <Picture6 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

export const Sheet6: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.slice(0, 16).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: W, height: H, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Picture6 f={f} captions={captions} idp={`f${f}`} />
        <div style={{position: 'absolute', right: 24, bottom: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f} · {(f / FPS).toFixed(2)}s</div>
      </div>
    ))}
  </AbsoluteFill>
);

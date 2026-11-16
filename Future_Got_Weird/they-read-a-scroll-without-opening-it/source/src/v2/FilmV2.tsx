// V2 film: its own scene table (v2/table2.tsx); captions and the narration are unchanged from V1.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions, K} from '../art/kit';
import {FPS} from '../lib/core';
import {SCENES2} from './table2';

export const sceneAt2 = (f: number) => {
  const t = f / FPS;
  let s = SCENES2[0];
  for (const sc of SCENES2) if (t >= sc.start) s = sc;
  return s;
};
export const Frame2: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const S = sceneAt2(f).C;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <S f={f} />
      </svg>
      {captions && <Captions f={f} />}
    </AbsoluteFill>
  );
};
export const FilmV2: React.FC<{captions?: boolean}> = ({captions = true}) => <Frame2 f={useCurrentFrame()} captions={captions} />;
export const StillV2: React.FC<{t: number}> = ({t}) => <Frame2 f={Math.round(t * FPS)} captions />;
export const SheetV2: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => {
  const w = 1920 / cols;
  const h = (w * 9) / 16;
  return (
    <AbsoluteFill style={{background: '#222'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden'}}>
          <div style={{transform: `scale(${1 / cols})`, transformOrigin: '0 0', width: 1920, height: 1080, position: 'relative'}}>
            <Frame2 f={Math.round(t * FPS)} captions />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', fontFamily: 'monospace', fontSize: 18, background: 'rgba(0,0,0,.5)', padding: '0 4px'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

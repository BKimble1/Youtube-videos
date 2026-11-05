// V3 film: the active V2 sequence plus the same burned-in captions as V1 (data/cues.json from the SRT builder).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS} from '../lib/core';
import {K} from '../art/kit';
import {Captions} from '../Film';
import {SCENES3} from './scenes3';
export const sceneAt3 = (f: number) => {
  const t = f / FPS;
  let s = SCENES3[0];
  for (const sc of SCENES3) if (t >= sc.start()) s = sc;
  return s;
};
export const Frame3: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const S = sceneAt3(f).C;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <S f={f} />
      </svg>
      {captions && <Captions f={f} />}
    </AbsoluteFill>
  );
};
export const FilmV3: React.FC<{captions?: boolean}> = ({captions = true}) => <Frame3 f={useCurrentFrame()} captions={captions} />;
export const StillV3: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => <Frame3 f={Math.round(t * FPS)} captions={captions} />;
export const SheetV3: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => {
  const w = 1920 / cols, h = (w * 9) / 16;
  return (
    <AbsoluteFill style={{background: '#222'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden'}}>
          <div style={{transform: `scale(${1 / cols})`, transformOrigin: '0 0', width: 1920, height: 1080, position: 'relative'}}>
            <Frame3 f={Math.round(t * FPS)} captions />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', fontFamily: 'monospace', fontSize: 18, background: 'rgba(0,0,0,.5)', padding: '0 4px'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

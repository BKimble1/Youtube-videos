// V3/V4 film: its own scene table (v3/table3.tsx), the V3 narration and captions. No capsule labels: a brief unboxed
// disclosure where the illustration could be taken for history or for data, and the sources on the final hold.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions, K, Note} from '../art/kit';
import {FPS} from '../lib/core';
import {clamp} from '../lib/math';
import {TM} from '../lib/time';
import {SCENES3} from './table3';

const win = (t: number, a: number, b: number) => clamp((t - a) / 0.4) * (1 - clamp((t - b) / 0.4));
// the eruption/opening scenes (history) and the first scan images (data) carry a short, unboxed disclosure
const DISCLOSE: [number, number][] = [
  [TM.vesuvius + 0.3, TM.centuries + 1.6],
  [TM.slice + 0.2, TM.slice + 4.2],
];
const Notes: React.FC<{t: number}> = ({t}) => {
  const d = Math.max(...DISCLOSE.map(([a, b]) => win(t, a, b)));
  const src = clamp((t - TM.stillEnd - 0.4) / 0.6);
  return (
    <g>
      <Note x={40} y={52} text="Illustrated reconstruction" size={22} anchor="start" color="#F4F1EA" halo="rgba(20,16,12,0.55)" opacity={0.85 * d} />
      <Note x={960} y={1004} text="Translation: PHerc. 1667, column 19" size={22} color="#6B6157" halo="rgba(255,252,244,0.6)" opacity={0.9 * src} />
      <Note x={960} y={1036} text="Sources: Angelotti et al. 2026, arXiv:2606.29085 · Vesuvius Challenge (scrollprize.org)" size={22} color="#6B6157" halo="rgba(255,252,244,0.6)" opacity={0.9 * src} />
    </g>
  );
};

export const sceneAt3 = (f: number) => {
  const t = f / FPS;
  let s = SCENES3[0];
  for (const sc of SCENES3) if (t >= sc.start) s = sc;
  return s;
};
export const Frame3: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const S = sceneAt3(f).C;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <S f={f} />
        <Notes t={f / FPS} />
      </svg>
      {captions && <Captions f={f} />}
    </AbsoluteFill>
  );
};
export const FilmV3: React.FC<{captions?: boolean}> = ({captions = true}) => <Frame3 f={useCurrentFrame()} captions={captions} />;
export const StillV3: React.FC<{t: number}> = ({t}) => <Frame3 f={Math.round(t * FPS)} captions />;
export const SheetV3: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => {
  const w = 1920 / cols;
  const h = (w * 9) / 16;
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

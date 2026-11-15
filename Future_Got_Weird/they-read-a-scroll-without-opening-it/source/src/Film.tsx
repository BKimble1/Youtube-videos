// The film: a table of sequences on the measured narration, plus burned-in captions for the review render.
// Each sequence is a pure function of the absolute frame (no scene holds its own state).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions, K} from './art/kit';
import {FPS} from './lib/core';
import {SCENES} from './scenes/table';

export const sceneAt = (f: number) => {
  const t = f / FPS;
  let s = SCENES[0];
  for (const sc of SCENES) if (t >= sc.start) s = sc;
  return s;
};

export const Frame: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const S = sceneAt(f).C;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <S f={f} />
      </svg>
      {captions && <Captions f={f} />}
    </AbsoluteFill>
  );
};
export const Film: React.FC<{captions?: boolean}> = ({captions = true}) => <Frame f={useCurrentFrame()} captions={captions} />;
export const FilmStill: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => <Frame f={Math.round(t * FPS)} captions={captions} />;
/** contact sheet of times (seconds) for review */
export const Sheet: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => {
  const w = 1920 / cols;
  const h = (w * 9) / 16;
  return (
    <AbsoluteFill style={{background: '#222'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden'}}>
          <div style={{transform: `scale(${1 / cols})`, transformOrigin: '0 0', width: 1920, height: 1080, position: 'relative'}}>
            <Frame f={Math.round(t * FPS)} captions />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', fontFamily: 'monospace', fontSize: 18, background: 'rgba(0,0,0,.5)', padding: '0 4px'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

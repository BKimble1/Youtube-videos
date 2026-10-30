// The film: one function of time. Each act draws its set; the overlay marks what is a stand-in for source footage
// and what is illustration.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, H, keys, W, zkeys} from './lib/core';
import {TT} from './lib/timeline';
import {Worksite} from './shots/Worksite';
import {Cab} from './shots/Cab';
import {Bilateral} from './shots/Bilateral';
import {Touch} from './shots/Touch';
import {Safety} from './shots/Safety';
import {Rollout} from './shots/Rollout';
import {Overlay} from './shots/Overlay';
import {clearedAt, FootageSlots} from './shots/FootageSlot';
import {easeInOut, easeOut} from './dc/math';

const tt = TT;

/** which set is on screen */
export const actAt = (t: number) => {
  if (t < tt.cabin) return 'worksite';
  if (t < tt.looks) return 'cab';
  if (t < tt.another) return 'worksite';
  if (t < tt.imagine) return 'cab';
  if (t < tt.except) return 'hand';
  if (t < tt.stunt) return 'worksite';
  if (t < tt.reason) return 'safety';
  if (t < tt.still) return 'rollout';
  if (t < tt.japan2) return 'worksite';
  if (t < tt.gave + 0.5) return 'cab';
  return 'worksite';
};

const cabCam = (t: number) => {
  if (t < tt.looks) {
    return {
      x: keys(t, [[tt.cabin, 1240], [tt.cameras, 1000], [tt.cameras + 1.2, 560], [tt.moves + 0.2, 640], [tt.looks, 700]]),
      y: keys(t, [[tt.cabin, 430], [tt.cameras, 470], [tt.cameras + 1.2, 640], [tt.moves + 0.2, 620], [tt.looks, 600]]),
      z: zkeys(t, [[tt.cabin, 1.7, easeOut], [tt.cameras, 1.35], [tt.cameras + 1.2, 1.55], [tt.moves + 0.2, 1.08], [tt.looks, 1.0]]),
    };
  }
  if (t < tt.imagine) {
    return {
      x: keys(t, [[tt.another, 1000], [tt.another + 2.4, 1080]]),
      y: keys(t, [[tt.another, 560], [tt.another + 2.4, 690]]),
      z: zkeys(t, [[tt.another, 1.2, easeOut], [tt.another + 2.4, 1.9]]),
    };
  }
  return {
    x: keys(t, [[tt.japan2, 980], [tt.trees, 1000], [tt.gave + 0.2, 1080]]),
    y: keys(t, [[tt.japan2, 520], [tt.trees, 560], [tt.gave + 0.2, 690]]),
    z: zkeys(t, [[tt.japan2, 1.25, easeOut], [tt.trees, 1.15], [tt.gave + 0.2, 2.0, easeInOut]]),
  };
};

export const Frame: React.FC<{t: number}> = ({t}) => {
  const act = actAt(t);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display: 'block'}}>
      {act === 'worksite' && <Worksite t={t} lookout={t > tt.except && t < tt.stunt} />}
      {act === 'cab' && (t < tt.another || t >= tt.japan2) && <Cab t={t} cam={cabCam(t)} />}
      {act === 'cab' && t >= tt.another && t < tt.imagine && <Bilateral t={t} />}
      {act === 'hand' && <Touch t={t} />}
      {act === 'safety' && <Safety t={t} />}
      {act === 'rollout' && <Rollout t={t} />}
      {!clearedAt(t) && <Overlay t={t} />}
    </svg>
  );
};

export const Film: React.FC<{audio: string | false}> = ({audio}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Frame t={f / FPS} />
      <FootageSlots />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

export const FilmStill: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Frame t={t} />
  </AbsoluteFill>
);

/** contact sheet of the film at the given times */
export const Sheet: React.FC<{ts: number[]; cols: number}> = ({ts, cols}) => {
  const w = W / cols;
  const h = H / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden'}}>
          <div style={{transform: `scale(${1 / cols})`, transformOrigin: '0 0', width: W, height: H}}>
            <Frame t={t} />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', font: '600 14px monospace', textShadow: '0 0 3px #000'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

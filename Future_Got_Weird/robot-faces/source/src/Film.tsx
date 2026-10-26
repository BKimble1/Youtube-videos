// The film: an ordered list of shots on the measured timeline. A shot renders from the absolute frame, so the shared
// states (state.ts) continue across every cut.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, H, W} from './lib/core';
import {K} from './state';
import {Hook} from './shots/Hook';
import {MirrorReveal} from './shots/Mirror';
import {Mech} from './shots/Mech';
import {Mouths} from './shots/Mouths';
import {Practice} from './shots/Practice';
import {Skin} from './shots/Skin';
import {Watch} from './shots/Watch';
import {Result} from './shots/Result';
import {Distinction} from './shots/Distinction';
import {Flaws} from './shots/Flaws';
import {Late} from './shots/Late';
import {Study24} from './shots/Study24';
import {Together} from './shots/Together';
import {Callback} from './shots/Callback';

export type Shot = {id: string; a: number; b: number; C: React.FC<{f: number}>};
const Blank: React.FC<{f: number}> = () => <rect width={W} height={H} fill="#30363D" />;
export const SHOTS: Shot[] = [
  {id: 'hook', a: 0, b: K.mirrorCut, C: Hook},
  {id: 'mirror', a: K.mirrorCut, b: K.columbia, C: MirrorReveal},
  {id: 'mech', a: K.columbia, b: K.banana, C: Mech},
  {id: 'mouths', a: K.banana, b: K.practiced, C: Mouths},
  {id: 'practice', a: K.practiced, b: K.skin, C: Practice},
  {id: 'skin', a: K.skin, b: K.once, C: Skin},
  {id: 'watch', a: K.once, b: K.result, C: Watch},
  {id: 'result', a: K.result, b: K.distinction, C: Result},
  {id: 'distinction', a: K.distinction, b: K.flaws, C: Distinction},
  {id: 'flaws', a: K.flaws, b: K.another, C: Flaws},
  {id: 'late', a: K.another, b: K.study24, C: Late},
  {id: 'study24', a: K.study24, b: K.enough, C: Study24},
  {id: 'together', a: K.enough, b: K.again, C: Together},
  {id: 'callback', a: K.again, b: 9999, C: Callback},
];
export const shotAt = (f: number) => {
  const t = f / FPS;
  return SHOTS.find((s) => t >= s.a && t < s.b) ?? SHOTS[SHOTS.length - 1];
};
export const Frame: React.FC<{f: number}> = ({f}) => {
  const S = shotAt(f);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <S.C f={f} />
    </svg>
  );
};
export const Film: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#1E242B'}}>
      <Frame f={f} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{backgroundColor: '#1E242B'}}>
    <Frame f={Math.round(t * FPS)} />
  </AbsoluteFill>
);
/** contact sheet: up to 16 frames, 4 across at quarter size, each labelled with its time */
export const Sheet: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % cols) * (W / cols), top: Math.floor(i / cols) * (H / cols), width: W, height: H, transform: `scale(${1 / cols})`, transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame f={Math.round(t * FPS)} />
        <div style={{position: 'absolute', left: 20, top: 16, fontFamily: 'Nunito Variable', fontWeight: 800, fontSize: 64, color: '#FFE36A', textShadow: '0 0 8px #000'}}>{t.toFixed(2)}</div>
      </div>
    ))}
  </AbsoluteFill>
);

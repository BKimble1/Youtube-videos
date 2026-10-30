// V1 captions: the channel's caption treatment (shared/Captions.tsx, copied), with emphasis per word OCCURRENCE
// (by index in words.json) instead of by word text, so only the creator's listed occurrences go yellow:
// MELTS; MAGNETIC PARTICLES (sentence 2); LIQUID; MODEL STOMACH; HARDENED (scene 6); INSIDE YOU (the final question).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import {clamp, FPS, Words} from '../shared/lib';
import {HookProps} from '../shared/HookFrame';

const EMPH_WORDS = ['melts', 'magnetic particles', 'liquid', 'model stomach', 'hardened', 'inside you'];
const k = (s: string) => s.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
/** indices of the emphasised occurrences: each phrase above, first match at/after the previous one; 'magnetic
 *  particles' is matched as a pair (sentence 2 only), 'inside you' as the final pair */
export const emphIndices = (W: Words): Set<number> => {
  const ws = W.words.map((w) => k(w.word));
  const out = new Set<number>();
  for (const ph of EMPH_WORDS) {
    const parts = ph.split(' ');
    for (let i = ws.length - parts.length; i >= 0; i--) {
      // 'inside you' must be the last pair; everything else is unique as a sequence, searched from the end
      if (parts.every((p, j) => ws[i + j] === p)) {
        parts.forEach((_, j) => out.add(i + j));
        break;
      }
    }
  }
  return out;
};

type Phrase = {i0: number; i1: number; show: number};
const phrases = (W: Words, breaks: number[]): Phrase[] => {
  const idx = [0, ...breaks, W.words.length];
  return idx.slice(0, -1).map((a, i) => ({i0: a, i1: idx[i + 1], show: i === 0 ? 0 : W.words[a].start}));
};

export const FilmFrame: React.FC<{W: Words; bg: string; capY: number; breaks: number[]; props: HookProps; children: (t: number) => React.ReactNode}> = ({W, bg, capY, breaks, props, children}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const P = phrases(W, breaks);
  const E = emphIndices(W);
  let pi = -1;
  for (let q = 0; q < P.length; q++) if (t >= P[q].show) pi = q;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill>{children(t)}</AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 58%, rgba(4,8,14,0.32) 100%)', pointerEvents: 'none'}} />
      {props.captions && pi >= 0 && <CaptionLine key={pi} W={W} ph={P[pi]} E={E} y={capY} a={pi === 0 ? 1 : clamp((t - P[pi].show) / 0.067)} />}
      {props.audio !== 'none' && <Audio src={staticFile(`audio/${props.audio}.wav`)} />}
    </AbsoluteFill>
  );
};

const CaptionLine: React.FC<{W: Words; ph: Phrase; E: Set<number>; y: number; a: number}> = ({W, ph, E, y, a}) => {
  const ids = Array.from({length: ph.i1 - ph.i0}, (_, j) => ph.i0 + j);
  return (
    <div style={{position: 'absolute', left: 110, width: 760, top: y, transform: 'translateY(-50%) translateZ(0)', willChange: 'transform, opacity', opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {ids.map((i, j) => {
          const wd = W.words[i].word;
          const hi = E.has(i);
          return <span key={i} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (j < ids.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

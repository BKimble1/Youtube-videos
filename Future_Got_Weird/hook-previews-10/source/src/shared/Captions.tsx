// Captions: the channel treatment used on Cyborg Cockroach, Dead Spider and Zombie Ant (Nunito Black, white with a dark
// stroke, key words in yellow capitals), phrase by phrase, in screen space (never inside a camera transform), inside the
// Shorts safe area and clear of the right-hand action buttons. Phrases break at the narration's ellipsis (or at an
// explicit break index). The first phrase is on screen from frame 0; each later phrase appears on its first word with a
// 2-frame fade (no pop). The last phrase holds to the end of the clip.
import React from 'react';
import {clamp, Words} from './lib';

export type Phrase = {text: string; show: number};

export const phrases = (W: Words, breaks?: number[]): Phrase[] => {
  const ws = W.words;
  const cut = breaks ?? ws.map((w, i) => (w.word.endsWith('…') ? i + 1 : -1)).filter((i) => i > 0 && i < ws.length);
  const idx = [0, ...cut, ws.length];
  const out: Phrase[] = [];
  for (let i = 0; i < idx.length - 1; i++) {
    const part = ws.slice(idx[i], idx[i + 1]);
    out.push({text: part.map((w) => w.word).join(' '), show: i === 0 ? 0 : part[0].start});
  }
  return out;
};

export const Captions: React.FC<{t: number; W: Words; y: number | number[]; breaks?: number[]}> = ({t, W, y, breaks}) => {
  const P = phrases(W, breaks);
  let i = -1;
  for (let k = 0; k < P.length; k++) if (t >= P[k].show) i = k;
  if (i < 0) return null;
  const yy = Array.isArray(y) ? y[Math.min(i, y.length - 1)] : y;
  return <CaptionLine key={i} text={P[i].text} emph={W.emph} y={yy} a={i === 0 ? 1 : clamp((t - P[i].show) / 0.067)} />;
};

/** one caption, centred on y, kept clear of the right-hand action buttons */
export const CaptionLine: React.FC<{text: string; emph: string[]; y: number; a: number; left?: number; width?: number}> = ({text, emph, y, a, left = 110, width = 760}) => {
  const words = text.split(' ');
  return (
    <div style={{position: 'absolute', left, width, top: y, transform: 'translateY(-50%) translateZ(0)', willChange: 'transform, opacity', opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
          const hi = emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

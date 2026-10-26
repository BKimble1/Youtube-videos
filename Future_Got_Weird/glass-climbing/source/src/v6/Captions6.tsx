// V6 captions: the channel treatment (Captions.tsx) on the V6 timeline. A caption appears whole on its first frame (no
// fade, so no faint half-drawn text on any frame) with a small settle in scale, and is gone on the frame it hides.
import React from 'react';
import {clamp} from '../lib';
import {CAPTIONS6} from './tl6';
import {capAt6} from './captions6';

export const Captions6: React.FC<{t: number}> = ({t}) => {
  const a = capAt6(t);
  if (!a) return null;
  const c = CAPTIONS6[a.i], side = a.side;
  const age = t - c.show;
  const pop = a.i === 0 ? 1 : 1 + 0.04 * (1 - clamp(age / 0.1));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: Array.isArray(side) ? side[0] : side ? 560 : 96, width: Array.isArray(side) ? side[1] : side ? 420 : 840, top: a.y, transform: `translateY(-50%) scale(${pop})`, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

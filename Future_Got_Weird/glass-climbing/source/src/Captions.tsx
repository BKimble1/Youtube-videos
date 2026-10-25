// Captions: the channel treatment (side: a narrower block on the right, over the micro views' plain backing, so a
// caption never crosses the wedge-to-glass gap; or an explicit [left, width] block) (Nunito Black, white with a dark
// stroke, key words in yellow capitals; the invisibility-shield CaptionsV2 style) in screen space, never inside a camera transform. The vertical position is
// chosen per caption (captions.ts) so captions stay off hands, pads, contacts, springs and the wedge/glass gap.
import React from 'react';
import {CAPTIONS, clamp} from './lib';

export const Captions: React.FC<{t: number; cy: number; side?: boolean | [number, number]}> = ({t, cy, side = false}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const age = t - c.show;
  const a = i === 0 ? 1 : clamp(age / 0.07);
  const pop = i === 0 ? 1 : 1 + 0.05 * (1 - clamp(age / 0.12));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: Array.isArray(side) ? side[0] : side ? 560 : 96, width: Array.isArray(side) ? side[1] : side ? 420 : 840, top: cy, transform: `translateY(-50%) scale(${pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
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

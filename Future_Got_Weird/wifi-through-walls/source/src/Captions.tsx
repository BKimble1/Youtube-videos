// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals; the FGW
// CaptionsV2 style) in screen space, never inside a camera transform. Each caption's vertical position is chosen in
// captions.ts so it stays off faces, hands, the skeleton, the waves and the screens' key readouts, and inside the
// Shorts safe area.
import React from 'react';
import {CAPTIONS, clamp} from './lib';

export const Captions: React.FC<{t: number; cy: number}> = ({t, cy}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const age = t - c.show;
  const a = i === 0 ? 1 : clamp(age / 0.07);
  const pop = i === 0 ? 1 : 1 + 0.05 * (1 - clamp(age / 0.12));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 90, width: 800, top: cy, transform: `translateY(-50%) scale(${pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      {/* V8: a soft dark backing keeps the caption's contrast over waves, screens and dissolves */}
      <span style={{display: 'inline', background: 'rgba(6,10,16,0.42)', borderRadius: 22, padding: '2px 18px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 68, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '11px rgba(6,9,14,0.95)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z0-9']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

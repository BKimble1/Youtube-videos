// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals; as in the
// Glass Climbing / Invisibility Shield captions) in screen space, never inside a camera transform. The height is
// chosen per caption (captions.ts) to keep captions off the mechanism.
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
    <div style={{position: 'absolute', left: 96, width: 840, top: cy, transform: `translateY(-50%) scale(${pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z0-9']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

/** the vignette's plain label: it is an imagined example, not the Swiss test */
export const IllustrationTag: React.FC<{opacity: number}> = ({opacity}) => (
  <div style={{position: 'absolute', left: 64, top: 214, opacity, fontFamily: '"Nunito Variable", sans-serif', fontWeight: 800, fontSize: 34, color: '#F2F5F8', letterSpacing: '0.04em',
    padding: '6px 16px', borderRadius: 10, background: 'rgba(10,16,24,0.55)'}}>
    Illustration
  </div>
);

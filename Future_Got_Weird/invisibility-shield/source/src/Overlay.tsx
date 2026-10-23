// Screen-space captions in the channel's established treatment (Nunito Black, white with a dark stroke, key words
// in yellow capitals). Never inside the camera transform or the panel's optics. Placed low in the frame, inside the
// Shorts safe area (clear of the right-hand action column and the bottom title block), away from the panel's edges,
// the floating hand and the section's ray paths.
import React from 'react';
import {clamp} from './lib/math';
import {CAPTIONS} from './world';

export const FONT = {cap: '"Nunito Variable", "Nunito", system-ui, sans-serif'};
export const YEL = '#FFD84A';
export const CAP = {cy: 1500, size: 66, maxW: 840};

export const Captions: React.FC<{t: number}> = ({t}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const age = t - c.show;
  const a = i === 0 ? 1 : clamp(age / 0.07);
  const pop = i === 0 ? 1 : 1 + 0.05 * (1 - clamp(age / 0.12));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: (1080 - CAP.maxW) / 2 - 24, width: CAP.maxW, top: CAP.cy, transform: `translateY(-50%) scale(${pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: FONT.cap, fontWeight: 900, fontSize: CAP.size, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(8,10,14,0.92)', paintOrder: 'stroke fill', textShadow: '0 5px 14px rgba(0,0,0,0.5)'} as React.CSSProperties}>
        {words.map((w, k) => {
          const key = w.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? YEL : '#FFFFFF'}}>{(hi ? w.toUpperCase() : w) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

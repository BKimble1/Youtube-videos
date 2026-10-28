// Captions in the channel treatment (Glass Climbing V8 / Real Web Fluid): Nunito 900, white with a dark stroke, the
// emphasised words in yellow capitals. A caption appears whole on its first frame, holds still and is gone on the
// frame it hides. Placement per caption keeps it clear of the board, the rider's face and the flight action, inside
// the Shorts safe area (top 260 px and bottom 380 px kept clear of the interface).
import React from 'react';
import {CAPS, FPS} from './time10';
import {capY, placeFor} from './capPlace10';
import {FRAMES, T} from './time10';

// V5: a caption that would change within 3 frames of a picture cut changes on the cut frame instead (the caption
// before it holds, or ends, at the same frame), so caption and picture change together rather than as two pops
const capFrames = new Map<string, {s: number[]; h: number[]}>();
const framesFor = (cuts?: number[]) => {
  const key = cuts ? cuts.join(',') : '';
  if (!capFrames.has(key)) {
    const s = CAPS.map((c, k) => (k === 0 ? 0 : Math.round(c.show * FPS)));
    const h = CAPS.map((c) => Math.round(c.hide * FPS));
    if (cuts)
      for (let k = 1; k < CAPS.length; k++) {
        const c = cuts.find((x) => x >= s[k] - 3 && x <= s[k] + 3 && x !== s[k] && x > s[k - 1]);
        if (c === undefined) continue;
        if (h[k - 1] === s[k]) h[k - 1] = c;
        s[k] = c;
      }
    capFrames.set(key, {s, h});
  }
  return capFrames.get(key)!;
};

export const Captions10: React.FC<{t: number; placer?: {placeFor: (a: number, b: number) => number; capY: (i: number) => number}; price?: {y: number; size: number}; cuts?: number[]}> = ({t, placer, price, cuts}) => {
  const pf = placer?.placeFor ?? placeFor, cy = placer?.capY ?? capY;
  const f = Math.round(t * FPS);
  const fr = framesFor(cuts);
  const i = CAPS.findIndex((c, k) => f >= fr.s[k] && f < fr.h[k]);
  // V8: "YOUR PRICE?" sits in the sky while the question is asked (from "PAY YOU" to the last frame), not as a
  // separate beat after it
  const p0 = Math.round(T('pay') * FPS);
  const priceEl = price && f >= p0 && f < FRAMES ? (
    <div style={{position: 'absolute', left: 90, width: 900, top: price.y, transform: 'translateY(-50%)', textAlign: 'center'}}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: price.size, letterSpacing: '0.01em', color: '#FFD84A',
        WebkitTextStroke: '16px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>YOUR PRICE?</span>
    </div>
  ) : null;
  if (i < 0) return priceEl;
  const c = CAPS[i];
  const y = cy(i);
  const words = c.text.split(' ');
  return (
    <>
    {priceEl}
    <div style={{position: 'absolute', left: 90, width: 900, top: y, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 70, lineHeight: 1.14, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '11px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
    </>
  );
};

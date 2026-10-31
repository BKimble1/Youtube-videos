// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals), phrase by
// phrase, in screen space (never inside a camera transform), inside the Shorts safe area. Each caption keeps one
// height while it shows, chosen to stay off the snail’s eyestalks, the bird’s head and the inside views (CAP_Y). A 2-frame fade, no pop.
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

export const CAP_Y: [string, number][] = [
  ['If this', 330], ['it can', 330], ['into moving', 330], ['The worm', 1560], ['and fills', 1560], ['with pulsing,', 1600], ['They start', 1580],
  ['tiny caterpillars.', 1580], ['And that\'s', 330], ['Because when', 250], ['and eats', 1250], ['the parasite', 1640], ['Then its', 1600], ['through the', 1600],
  ['ready to', 330],
];
export const capIndex = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
export const capY = (i: number) => {
  const [first, y] = CAP_Y[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const Captions: React.FC<{t: number}> = ({t}) => {
  const i = capIndex(t);
  if (i < 0) return null;
  // keyed per caption, in its own composited layer: a new caption replaces the old element outright (headless Chrome
  // otherwise left fragments of the previous caption in a few frames when they were only partly repainted)
  return <CaptionLine key={i} c={CAPTIONS[i]} y={capY(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} {...(CAPTIONS[i].text.startsWith('and eats') ? {left: 420, width: 560} : {})} />;
};
/** one caption, centred on y, kept clear of the right-hand action buttons */
export const CaptionLine: React.FC<{c: Caption; y: number; a: number; left?: number; width?: number}> = ({c, y, a, left = 110, width = 760}) => {
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left, width, top: y, transform: 'translateY(-50%) translateZ(0)', willChange: 'transform, opacity', opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
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

// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals), phrase by
// phrase from the measured word times, in screen space (never inside a camera transform), inside the Shorts safe
// area. Each caption keeps one height while it shows, chosen per shot to stay off the eye, the implant and the
// instruments (CAP_Y). A 2-frame fade, no pop.
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

// V3 heights, per shot
export const CAP_Y: [string, number][] = [
  ['Doctors', 1580], ['inside', 1600], ['and he', 330], ['His cornea', 1500], ['a normal', 1460], ['So surgeons', 330], ['one of', 330], ['with a', 330],
  ['drilled', 1560], ['and fitted', 1560], ['They tucked', 1560], ['near his', 1600], ['letting', 1560], ['Then they', 330], ['into his', 330],
  ['allowing', 330], ['After', 330], ['he could', 1600],
];
export const capIndex = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
export const capY = (i: number) => {
  const [first, y] = CAP_Y[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const Captions3: React.FC<{t: number}> = ({t}) => {
  const i = capIndex(t);
  if (i < 0) return null;
  return <CaptionLine key={i} c={CAPTIONS[i]} y={capY(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} />;
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

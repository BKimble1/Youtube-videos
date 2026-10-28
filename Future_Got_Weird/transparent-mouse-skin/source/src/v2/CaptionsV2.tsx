// V2 captions: the channel treatment (as V1's Captions.tsx), placed per caption for V2's compositions.
import React from 'react';
import {CAPTIONS, clamp} from '../lib';

const CAP_Y: [string, number][] = [
  ['They made', 250], ['transparent', 250], ['And watched', 250], ['moving', 1450], ['Without', 1440],
  ['They’d', 300], ['onto', 300],
  ['You see', 280], ['normally', 280], ['scattering', 280], ['But the', 280], ['how the', 280], ['making', 280], ['more like', 280],
  ['Then', 1440], ['and the', 1440], ['the moving', 1440],
];
export const CaptionsV2: React.FC<{t: number}> = ({t}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const [first, cy] = CAP_Y[i];
  if (!c.text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${c.text}`);
  const age = t - c.show;
  const a = i === 0 ? 1 : clamp(age / 0.07);
  const pop = i === 0 ? 1 : 1 + 0.05 * (1 - clamp(age / 0.12));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 120, width: 800, top: cy, transform: `translateY(-50%) scale(${pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 68, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
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

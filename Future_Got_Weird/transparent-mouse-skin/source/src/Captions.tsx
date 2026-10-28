// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals; the
// Glass Climbing / invisibility-shield style), in screen space, never inside a camera transform. Each caption has one
// fixed height chosen for its scene so it stays off the skin patch, the light paths and the hands.
import React from 'react';
import {CAPTIONS, clamp} from './lib';

// [first words, centre y]
const CAP_Y: [string, number][] = [
  ['They made', 1432], ['transparent', 1432], ['And watched', 1432], ['moving', 1432], ['Without', 1432],
  ['They’d', 330], ['onto', 330],
  ['You see', 205], ['normally', 205], ['scattering', 205], ['But the', 205], ['how the', 205], ['making', 205], ['more like', 205],
  ['Then', 1432], ['and the', 1432], ['the moving', 1432],
];

// a caption never runs across the cut into the earlier scene
const CUTS = [7.0];
const hideOf = (k: number) => {
  const c = CAPTIONS[k];
  const cut = CUTS.find((x) => c.show < x && c.hide > x);
  return cut ?? c.hide;
};

export const Captions: React.FC<{t: number}> = ({t}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < hideOf(k));
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

/** a small cue chip (top left): EARLIER for the retrospective application, TIME-LAPSE (with a turning clock) for the
 *  compressed return to opaque skin, so neither reads as instantaneous */
export const Chip: React.FC<{text: string; a: number; clockT?: number}> = ({text, a, clockT}) =>
  a <= 0 ? null : (
    <div style={{position: 'absolute', left: 56, top: 104, opacity: a, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 10px 14px', borderRadius: 18,
      background: 'rgba(12,22,30,0.82)', border: '3px solid rgba(255,255,255,0.85)', fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 34, color: '#FFFFFF', letterSpacing: '0.04em'}}>
      <svg width={40} height={40} viewBox="-20 -20 40 40">
        {clockT === undefined ? (
          <path d="M8,-12 A14,14 0 1 0 14,2 M14,-10 L14,2 L2,2" stroke="#FFD84A" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <g>
            <circle r={15} fill="none" stroke="#FFD84A" strokeWidth={4} />
            <path d={`M0,0 L${(10 * Math.sin(clockT * 9)).toFixed(2)},${(-10 * Math.cos(clockT * 9)).toFixed(2)}`} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
            <path d={`M0,0 L${(7 * Math.sin(clockT * 0.75)).toFixed(2)},${(-7 * Math.cos(clockT * 0.75)).toFixed(2)}`} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
      </svg>
      {text}
    </div>
  );

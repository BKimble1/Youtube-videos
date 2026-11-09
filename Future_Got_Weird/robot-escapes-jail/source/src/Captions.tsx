// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals), phrase by
// phrase, in SCREEN space (never inside a camera transform), inside the Shorts safe area (x 110..870: clear of the
// right-hand action buttons; y kept above ~1450 so the bottom controls/description never cover them).
// A caption's vertical position comes from capY(t) (Film.tsx), chosen per shot so it never covers the robot's face or
// the central action. A short fade-in that starts at half opacity, so the frame where one caption replaces another is
// never blank.
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

const hideOf = (k: number) => {
  const c = CAPTIONS[k];
  if (k === CAPTIONS.length - 1) return c.hide;
  const next = CAPTIONS[k + 1].show;
  return next > c.hide && next - c.hide < 0.12 ? next : c.hide;
};
export const capIndex = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < hideOf(k));
export const Captions: React.FC<{t: number; y: (i: number) => number}> = ({t, y}) => {
  const i = capIndex(t);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const a = i === 0 ? 1 : clamp(0.5 + (t - c.show) / 0.067);
  // a small pop on arrival (scale 0.92 -> 1 over 4 frames), never on the very first frame of the film
  const pop = i === 0 ? 1 : 0.92 + 0.08 * clamp((t - c.show) / 0.13);
  return <CaptionLine key={i} c={c} y={y(i)} a={a} pop={pop} />;
};
export const CaptionLine: React.FC<{c: Caption; y: number; a: number; pop?: number; left?: number; width?: number}> = ({c, y, a, pop = 1, left = 110, width = 760}) => {
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left, width, top: y, transform: `translateY(-50%) scale(${pop}) translateZ(0)`, transformOrigin: '50% 50%', willChange: 'transform, opacity', opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 70, lineHeight: 1.14, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '11px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

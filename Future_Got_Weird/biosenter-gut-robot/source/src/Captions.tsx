// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals), phrase by
// phrase, in screen space (never inside a camera transform), inside the Shorts safe area (left 110..870). Their
// height is chosen per shot so they never sit on the robot's moving parts (see tools/keepout.ts): the TOP zone over the
// far tunnel in S1/S7 and over the cutaway's tether end in S3; the LOW zone in the macro (S2), over the tool close-up's
// upper floor (S5), and below the pig (S4) is "6+ FEET" (captions stay top there).
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

export const capY = (t: number): number => {
  if (t >= 3.47 && t < 6.85) return 1560; // macro: the head anchor (the focal part) stays clear of the low zone
  if (t >= 16.8 && t < 21.15) return 1560; // tools (head and tools fill the upper frame) and the lab (controller)
  return 300;
};
const hideOf = (k: number) => {
  const c = CAPTIONS[k];
  if (k === CAPTIONS.length - 1) return c.hide;
  const next = CAPTIONS[k + 1].show;
  return next > c.hide && next - c.hide < 0.12 ? next : c.hide;
};
export const capIndex = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < hideOf(k));
export const Captions: React.FC<{t: number}> = ({t}) => {
  const i = capIndex(t);
  if (i < 0) return null;
  return <CaptionLine key={i} c={CAPTIONS[i]} y={capY(CAPTIONS[i].show + 0.01)} a={i === 0 ? 1 : clamp(0.5 + (t - CAPTIONS[i].show) / 0.067)} />;
};
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

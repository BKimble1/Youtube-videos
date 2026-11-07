// Captions: the channel treatment (Nunito Black, white with a dark stroke, the one emphasised word or short phrase in
// yellow capitals), phrase by phrase from the measured narration (data/timeline.json), in screen space (never inside a
// camera transform), in the TOP band (y = CAP_Y) inside the Shorts safe area (left 110..870), clear of the bird and its
// wings (the shots keep the subjects below y = 470). A short fade-in that starts at half opacity, so the frame where
// one caption replaces another is never blank.
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

export const CAP_Y = 330;
/** a caption stays up until the next one shows when the gap between them is a frame or two (no blank frame) */
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
  return <CaptionLine key={i} c={CAPTIONS[i]} y={CAP_Y} a={i === 0 ? 1 : clamp(0.5 + (t - CAPTIONS[i].show) / 0.067)} />;
};
/** one caption, centred on y, kept clear of the right-hand action buttons */
export const CaptionLine: React.FC<{c: Caption; y: number; a: number; left?: number; width?: number}> = ({c, y, a, left = 110, width = 760}) => {
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left, width, top: y, transform: 'translateY(-50%) translateZ(0)', willChange: 'transform, opacity', opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z]/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals), phrase by
// phrase, in screen space (never inside a camera transform), inside the Shorts safe area (left 110..870, low captions
// centred at or above y 1520). Each caption keeps one height while it shows, chosen to stay off the joint and the ball
// (CAP_Y). A 2-frame fade, no pop.
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

export const CAP_Y: [string, number][] = [
  ['Doctors turned', 300], ['into a', 300], ['Wyatt had', 300], ['Surgeons had', 300], ['but they', 300],
  ['They turned', 300], ['and attached', 300], ['with his', 300], ['That backward', 1660], ['the same', 1660],
  ['When Wyatt', 1560], ['he could', 1560], ['And once', 280], ['to use', 260], ['that same', 250], ['kick a', 290],
];
/** caption timing adjustments for the picture: a caption that would start a frame or two before a hard cut starts on
 *  the cut; the last caption leaves when the loop's wipe has reset the picture */
let ADJ: {show: Record<number, number>; lastHide: number} = {show: {}, lastHide: 1e9};
export const setCaptionAdjust = (a: typeof ADJ) => { ADJ = a; };
/** a caption stays up until the next one shows when the gap between them is a frame or two (no blank frame) */
const hideOf = (k: number) => {
  const c = CAPTIONS[k];
  if (k === CAPTIONS.length - 1) return Math.min(c.hide, ADJ.lastHide);
  const next = ADJ.show[k + 1] ?? CAPTIONS[k + 1].show;
  return next > c.hide && next - c.hide < 0.12 ? next : c.hide;
};
export const capIndex = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : ADJ.show[k] ?? c.show) && t < hideOf(k));
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
  return <CaptionLine key={i} c={CAPTIONS[i]} y={capY(i)} a={i === 0 ? 1 : clamp((t - (ADJ.show[i] ?? CAPTIONS[i].show)) / 0.067)} />;
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

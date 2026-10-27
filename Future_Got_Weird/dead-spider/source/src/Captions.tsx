// Captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals; the Real Web
// Fluid / Glass Climbing style), phrase by phrase, in screen space (never inside a camera transform). Each caption has
// one vertical position for as long as it shows, chosen so it stays off the needle entry, the joint, the gripping feet
// and the reveal (CAP_Y); inside a conservative Shorts safe area (x 96-984, y 300-1520). No pop or bounce: a 2-frame fade.
import React from 'react';
import {Caption, CAPTIONS, clamp} from './lib';

/** caption centre y per caption (checked against the action in tools/cap_check.ts) */
export const CAP_Y: [string, number][] = [
  ['They stuck', 1500], ['into the', 1500], ['and its', 1520], ['You see', 1480], ['inside', 380], ['to extend', 380], ['When they', 380],
  ['that pressure', 380], ['causing', 380], ['But researchers', 1480], ['they could', 1480], ['to spread', 380], ['And when', 1500],
  ['the legs', 1480], ['around', 1480], ['This turned', 380], ['that could', 380], ['They even', 1500], ['and pick', 1500],
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
  return <CaptionLine c={CAPTIONS[i]} y={capY(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} />;
};

/** one caption in the channel treatment, centred on y */
export const CaptionLine: React.FC<{c: Caption; y: number; a: number}> = ({c, y, a}) => {
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 96, width: 888, top: y, transform: 'translateY(-50%)', opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
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

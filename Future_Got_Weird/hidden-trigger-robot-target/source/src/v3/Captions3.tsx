// Phrase captions from the measured word timings (3-6 words each). The only text layer; no emphasis colours.
import React from 'react';
import {CAPS3} from './theme3';

export const CAP3 = {cy: 1490, size: 66, maxW: 860};

// a caption holds until the next one when the gap is short, so captions do not flicker
export const captionWindows = () =>
  CAPS3.map((c, i) => {
    const next = CAPS3[i + 1];
    const start = Math.max(0, c.start - 0.05);
    const end = next && next.start - c.end < 0.35 ? next.start - 0.05 : c.end + 0.2;
    return {text: c.text, start, end};
  });

export const Captions3: React.FC<{t: number}> = ({t}) => {
  const win = captionWindows().find((c) => t >= c.start && t < c.end);
  if (!win) return null;
  const age = t - win.start;
  const a = win.start < 0.01 ? 1 : Math.min(1, age / 0.08);
  const text = win.text === 'The trap was already there' ? 'The trap was already there —' : win.text;
  return (
    <div style={{position: 'absolute', left: (1080 - CAP3.maxW) / 2, width: CAP3.maxW, top: CAP3.cy, transform: `translateY(-50%) translateY(${(1 - a) * 6}px)`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span
        style={{
          fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: CAP3.size,
          lineHeight: 1.2,
          color: '#F4F7FA',
          background: 'rgba(6,10,14,0.66)',
          padding: '4px 24px',
          borderRadius: 18,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          textShadow: '0 3px 10px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </span>
    </div>
  );
};

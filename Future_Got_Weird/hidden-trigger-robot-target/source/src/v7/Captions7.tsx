// V7 phrase captions: the V3 caption design (same look, position, size and hold rule) on caption starts re-measured
// against the locked narration waveform (tools/measure_captions_v7.py -> data/captions_v7.json), so no caption appears
// before its first word is heard. The only text layer; no emphasis colours.
import React from 'react';
import caps from '../data/captions_v7.json';

const CAPS7 = caps as {text: string; start: number; end: number}[];

export const CAP7 = {cy: 1490, size: 66, maxW: 860};

// a caption holds until the next one when the gap is short, so captions do not flicker
export const captionWindows7 = () =>
  CAPS7.map((c, i) => {
    const next = CAPS7[i + 1];
    const start = Math.max(0, c.start - 0.05);
    const end = next && next.start - c.end < 0.35 ? next.start - 0.05 : c.end + 0.2;
    return {text: c.text, start, end};
  });

export const Captions7: React.FC<{t: number}> = ({t}) => {
  const win = captionWindows7().find((c) => t >= c.start && t < c.end);
  if (!win) return null;
  const age = t - win.start;
  const a = win.start < 0.01 ? 1 : Math.min(1, age / 0.08);
  const text = win.text === 'The trap was already there' ? 'The trap was already there —' : win.text;
  return (
    <div style={{position: 'absolute', left: (1080 - CAP7.maxW) / 2, width: CAP7.maxW, top: CAP7.cy, transform: `translateY(-50%) translateY(${(1 - a) * 6}px)`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span
        style={{
          fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: CAP7.size,
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

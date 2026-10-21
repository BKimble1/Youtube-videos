// Phrase captions from the measured narration timings (same data as the SRT). One highlighted word at most.
import React from 'react';
import {C, F, PHRASES, VO_OFFSET_S} from '../theme';

export const CAPTION = {cy: 1478, size: 70, maxW: 820};

export const activePhrase = (t: number) => {
  const tv = t - VO_OFFSET_S;
  // hold a phrase until the next begins when the gap is short, so captions do not flicker
  return PHRASES.findIndex((p, i) => {
    const next = PHRASES[i + 1];
    const end = next && next.start - p.end < 0.25 ? next.start - 0.04 : p.end + 0.12;
    return tv >= p.start - 0.04 && tv < end;
  });
};

export const CaptionTrack: React.FC<{t: number}> = ({t}) => {
  const idx = activePhrase(t);
  if (idx < 0) return null;
  const p = PHRASES[idx];
  const age = t - VO_OFFSET_S - (p.start - 0.04);
  const inS = p.start < 0.05 ? 1 : Math.min(1, age / 0.1); // the first phrase is fully up on frame 0
  const hl = p.highlight?.toLowerCase();
  const words = p.text.split(' ');
  return (
    <div style={{position: 'absolute', left: (1080 - CAPTION.maxW) / 2, width: CAPTION.maxW, top: CAPTION.cy, transform: `translateY(-50%) translateY(${(1 - inS) * 8}px)`, opacity: inS, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span
        style={{
          display: 'inline',
          fontFamily: F.body,
          fontWeight: 900,
          fontSize: CAPTION.size,
          lineHeight: 1.22,
          color: C.text,
          background: 'rgba(5,9,19,0.62)',
          padding: '2px 24px',
          borderRadius: 18,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          textShadow: '0 3px 10px rgba(0,0,0,0.6)',
        }}
      >
        {words.map((w, i) => {
          const bare = w.replace(/[^A-Za-z]/g, '').toLowerCase();
          return (
            <span key={i} style={{color: hl && bare === hl ? C.cyan : C.text}}>
              {(i ? ' ' : '') + w}
            </span>
          );
        })}
      </span>
    </div>
  );
};

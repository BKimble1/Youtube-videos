// Screen-fixed overlays. Captions: the Death Clock component (Fredoka Bold, white with a thin dark stroke and a small
// soft shadow, no plaque, one yellow emphasis word at most, phrase chunks of 2-5 words on a fixed lane).
// V6: the opening "FICTIONAL FUTURE SCENARIO" cue was removed at the owner's request; only the captions remain.
import React from 'react';
import {CAP_FAMILY, CAP_FONT, UI_FONT} from '../../fonts';
import {chunkWindows} from '../../lib/captions';
import {clamp, inv} from '../../lib/math';
import {FPS} from '../../lib/timeline';

const WINDOWS = chunkWindows();
/** the caption lane (centre y 1450, centre x 495: clear of the Shorts controls at the bottom and right) */
export const CAP = {size: 70, line: 82, maxW: 780, cx: 495, cy: 1450, weight: 700};

let ctx: CanvasRenderingContext2D | null = null;
const measure = (t: string) => {
  if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * CAP.size * 0.56;
  ctx.font = `${CAP.weight} ${CAP.size}px ${CAP_FAMILY}`;
  return ctx.measureText(t).width;
};
/** one line if it fits; otherwise the two-line split with the most even line widths (no one-word widows) */
const wrap = (words: string[]): string[][] => {
  if (measure(words.join(' ')) <= CAP.maxW || words.length < 2) return [words];
  let best: string[][] = [words];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const w = Math.max(measure(words.slice(0, i).join(' ')), measure(words.slice(i).join(' ')));
    if (w < bestW) {
      bestW = w;
      best = [words.slice(0, i), words.slice(i)];
    }
  }
  return best;
};

export const Captions: React.FC<{f: number; fade?: number}> = ({f, fade = 0.08}) => {
  const t = f / FPS;
  const c = WINDOWS.find((w) => t >= w.start && t < w.end);
  if (!c) return null;
  const lines = wrap(c.words);
  const a = Math.min(clamp((t - c.start) / fade), clamp((c.end - t) / fade));
  const top = CAP.cy - (lines.length * CAP.line) / 2;
  const space = measure(' ');
  return (
    <g opacity={a}>
      <defs>
        <filter id="cap-sh" x="-10%" y="-30%" width="120%" height="160%">
          <feDropShadow dx={0} dy={4} stdDeviation={6} floodColor="#06121B" floodOpacity={0.62} />
        </filter>
      </defs>
      <g filter="url(#cap-sh)">
        {lines.map((l, i) => {
          const w = measure(l.join(' '));
          let x = CAP.cx - w / 2;
          return (
            <g key={i}>
              {l.map((word, k) => {
                const el = (
                  <text
                    key={k}
                    x={x.toFixed(1)}
                    y={(top + CAP.line * (i + 0.5) + CAP.size * 0.36).toFixed(1)}
                    fontFamily={CAP_FONT}
                    fontWeight={CAP.weight}
                    fontSize={CAP.size}
                    fill={word === c.hl ? '#FFC744' : '#FFFFFF'}
                    stroke="#0E1A24"
                    strokeWidth={10}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    {word}
                  </text>
                );
                // an em dash joins the next word without a space
                x += measure(word) + (word.endsWith('—') ? 0 : space);
                return el;
              })}
            </g>
          );
        })}
      </g>
    </g>
  );
};

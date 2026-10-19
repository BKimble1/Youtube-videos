// Screen-fixed overlays. Captions: the Death Clock component (Fredoka Bold, white with a thin dark stroke and a small
// soft shadow, no plaque, one yellow emphasis word at most, phrase chunks of 2-5 words on a fixed lane).
// Opening cue: "FICTIONAL FUTURE SCENARIO", small unboxed text in the upper right for about 2.8 s.
import React from 'react';
import {CAP_FAMILY, CAP_FONT, UI_FONT} from '../fonts';
import {chunkWindows} from '../lib/captions';
import {clamp, inv} from '../lib/math';
import {FICTION_CUE, FPS} from '../lib/timeline';

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

export const Captions: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const c = WINDOWS.find((w) => t >= w.start && t < w.end);
  if (!c) return null;
  const lines = wrap(c.words);
  const a = Math.min(clamp((t - c.start) / 0.08), clamp((c.end - t) / 0.08));
  const top = CAP.cy - (lines.length * CAP.line) / 2;
  const space = measure(' ');
  return (
    <g opacity={a}>
      <defs>
        <filter id="cap-sh" x="-10%" y="-30%" width="120%" height="160%">
          <feDropShadow dx={0} dy={4} stdDeviation={5} floodColor="#06121B" floodOpacity={0.55} />
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
                    strokeWidth={9}
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

/** the one genre cue: plain small text, no box, dot or pill; fades in and out */
export const FictionCue: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const a = clamp(inv(FICTION_CUE.from, FICTION_CUE.from + 0.35, t)) * (1 - clamp(inv(FICTION_CUE.to - 0.4, FICTION_CUE.to, t)));
  const s = a * a * (3 - 2 * a);
  if (s <= 0) return null;
  return (
    <g opacity={s}>
      <defs>
        <filter id="cue-sh" x="-10%" y="-60%" width="120%" height="220%">
          <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor="#FFFFFF" floodOpacity={0.9} />
        </filter>
      </defs>
      <text x={1020} y={150} textAnchor="end" fontFamily={UI_FONT} fontWeight={700} fontSize={36} letterSpacing={4} fill="#17324A" filter="url(#cue-sh)">
        FICTIONAL FUTURE SCENARIO
      </text>
    </g>
  );
};

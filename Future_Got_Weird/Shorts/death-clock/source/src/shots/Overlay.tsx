// Screen-fixed overlays (V2): the narration captions (master only) and the one brief opening cue.
// Captions: Fredoka Bold (the channel's display face), 2-5-word phrases, at most two lines, white with a thin
// dark stroke and a small soft shadow (no plaque behind each phrase), at most one emphasis word in a phrase and
// only six emphasised in the film. One fixed lane (centre y 1450 inside the 90-900 working area, clear of the Shorts title block) that every
// shot is framed to keep clear: below the band's digits, the heart, the injection path and his face.
// Opening cue: "FICTIONAL FUTURE DEVICE", small unboxed text in the quiet upper-left corner for about 1.3 s.
import React from 'react';
import {CAP_FAMILY, CAP_FONT, UI_FONT} from '../fonts';
import {chunkWindows} from '../lib/captions';
import {clamp, inv} from '../lib/math';
import {FPS} from '../lib/timeline';

const WINDOWS = chunkWindows();
export const CAP = {size: 70, line: 82, maxW: 780, cx: 495, cy: 1450, weight: 700};

let ctx: CanvasRenderingContext2D | null = null;
const measure = (t: string) => {
  if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * CAP.size * 0.56;
  ctx.font = `${CAP.weight} ${CAP.size}px ${CAP_FAMILY}`;
  return ctx.measureText(t).width;
};
/** One line if it fits; otherwise the two-line split with the most even line widths (no one-word widows). */
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
                x += measure(word) + space;
                return el;
              })}
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** The one brief genre cue: plain small text, no box, dot or pill. */
export const CUE = {from: 4, to: 44, text: 'FICTIONAL FUTURE DEVICE'};
export const FictionCue: React.FC<{f: number}> = ({f}) => {
  const a = clamp(inv(CUE.from, CUE.from + 5, f)) * (1 - clamp(inv(CUE.to - 7, CUE.to, f)));
  if (a <= 0) return null;
  return (
    <g opacity={a}>
      <defs>
        <filter id="cue-sh" x="-10%" y="-60%" width="120%" height="220%">
          <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor="#FFFFFF" floodOpacity={0.9} />
        </filter>
      </defs>
      <text x={74} y={244} fontFamily={UI_FONT} fontWeight={700} fontSize={36} letterSpacing={4} fill="#17324A" filter="url(#cue-sh)">
        {CUE.text}
      </text>
    </g>
  );
};

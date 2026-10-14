// Screen-fixed overlays: the persistent FUTURE CONCEPT label (from frame zero, every shot), the
// TIME COMPRESSED tag during the response montage, and the narration captions (master only).
// Captions: Montserrat ExtraBold, 2-5-word phrases, at most two lines, one highlighted word,
// restrained dark rounded backing, a short fade (no bounce, no scatter). Lanes keep them off the
// watch screen, the injection path and his eyes.
import React from 'react';
import {CAP_FONT, UI_FONT} from '../fonts';
import {chunkWindows} from '../lib/captions';
import {PAL} from '../lib/color';
import {clamp, inv} from '../lib/math';
import {FPS, SHOT, ShotId} from '../lib/timeline';
import {DEV} from '../lib/device';

const WINDOWS = chunkWindows();
const SIZE = 66;
const LINE = 80;
const MAXW = 760;
const CX = 495; // centre of the 90-900 working area

/** Which lane each shot uses: 'top' over sky / empty space, 'low' just above the lower UI zone. */
const LANE: Record<ShotId, 'top' | 'low'> = {
  s01: 'low', s02: 'low', s03: 'low', s04: 'low', s05: 'low', s06: 'low', s07: 'top', s08: 'low',
  s09: 'low', s10: 'low', s11: 'low', s12: 'top', s13: 'low', s14: 'top', s15: 'low', s16: 'low',
};
export const shotAt = (f: number): ShotId => (Object.keys(SHOT) as ShotId[]).find((k) => f >= SHOT[k][0] && f < SHOT[k][1]) ?? 's16';

let ctx: CanvasRenderingContext2D | null = null;
const measure = (t: string) => {
  if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * SIZE * 0.6;
  ctx.font = `800 ${SIZE}px "Montserrat"`;
  return ctx.measureText(t).width;
};
const wrap = (words: string[]) => {
  const lines: string[][] = [[]];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    const trial = [...cur, w].join(' ');
    if (cur.length && measure(trial) > MAXW) lines.push([w]);
    else cur.push(w);
  }
  return lines;
};

export const Captions: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const c = WINDOWS.find((w) => t >= w.start && t < w.end);
  if (!c) return null;
  const words = c.caps ? c.words.map((w) => w.toUpperCase()) : c.words;
  const hl = c.hl ? (c.caps ? c.hl.toUpperCase() : c.hl) : undefined;
  const lines = wrap(words);
  const fadeIn = clamp((t - c.start) / 0.1);
  const fadeOut = clamp((c.end - t) / 0.08);
  const a = Math.min(fadeIn, fadeOut);
  const lane = LANE[shotAt(f)];
  const h = lines.length * LINE + 34;
  const boxBottom = lane === 'low' ? 1466 : 330 + h;
  const top = boxBottom - h;
  const widths = lines.map((l) => measure(l.join(' ')));
  const bw = Math.max(...widths) + 56;
  return (
    <g opacity={a}>
      <rect x={CX - bw / 2} y={top} width={bw} height={h} rx={26} fill="#0F1C26" opacity={0.62} />
      {lines.map((l, i) => {
        let x = CX - widths[i] / 2;
        const space = measure(' ');
        return (
          <g key={i}>
            {l.map((w, k) => {
              const ww = measure(w);
              const el = (
                <text key={k} x={x} y={top + 17 + LINE * (i + 0.5) + SIZE * 0.36} fontFamily={CAP_FONT} fontWeight={800} fontSize={SIZE} fill={w === hl ? '#FFC744' : '#FFFFFF'}>
                  {w}
                </text>
              );
              x += ww + space;
              return el;
            })}
          </g>
        );
      })}
    </g>
  );
};

export const ConceptLabel: React.FC = () => (
  <g>
    <rect x={84} y={178} width={330} height={60} rx={30} fill="#0F1C26" opacity={0.6} />
    <circle cx={116} cy={208} r={10} fill={PAL.signal} />
    <circle cx={116} cy={208} r={4.5} fill="#FFFFFF" />
    <text x={138} y={221} fontFamily={UI_FONT} fontWeight={700} fontSize={37} letterSpacing={2.6} fill="#FFFFFF">
      FUTURE CONCEPT
    </text>
  </g>
);

export const CompressedTag: React.FC<{f: number}> = ({f}) => {
  const a = clamp(inv(DEV.compress0 - 2, DEV.compress0 + 6, f)) * (1 - clamp(inv(DEV.compress1 - 6, DEV.compress1, f)));
  if (a <= 0) return null;
  return (
    <g opacity={a}>
      <rect x={84} y={248} width={286} height={50} rx={25} fill="#0F1C26" opacity={0.55} />
      <path d="M104,261 L120,273 L104,285 Z M120,261 L136,273 L120,285 Z" fill={PAL.signal} />
      <text x={148} y={283} fontFamily={UI_FONT} fontWeight={700} fontSize={30} letterSpacing={2.2} fill="#DDF6FF">
        TIME COMPRESSED
      </text>
    </g>
  );
};

// Screen-fixed overlays: the persistent FUTURE CONCEPT label (from frame zero, every shot), the
// TIME COMPRESSED tag during the response montage, and the narration captions (master only).
// Captions: Fredoka SemiBold (channel display face), 2-5-word phrases, at most two lines, one highlighted word,
// restrained dark rounded backing, a short fade (no bounce, no scatter). Lanes keep them off the
// watch screen, the injection path and his eyes.
import React from 'react';
import {CAP_FAMILY, CAP_FONT, CAP_WEIGHT} from '../fonts';
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
const measureAt = (t: string, size: number, spacing = 0) => {
  if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * size * 0.6;
  ctx.font = `${CAP_WEIGHT} ${size}px ${CAP_FAMILY}`;
  return ctx.measureText(t).width + spacing * Math.max(0, t.length - 1);
};
const measure = (t: string) => measureAt(t, SIZE);
/** One line if it fits; otherwise the two-line split with the most even line widths (no one-word widows). */
const wrap = (words: string[]): string[][] => {
  if (measure(words.join(' ')) <= MAXW || words.length < 2) return [words];
  let best: string[][] = [words];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i);
    const b = words.slice(i);
    const w = Math.max(measure(a.join(' ')), measure(b.join(' ')));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
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
                <text key={k} x={x} y={top + 17 + LINE * (i + 0.5) + SIZE * 0.36} fontFamily={CAP_FONT} fontWeight={CAP_WEIGHT} fontSize={SIZE} fill={w === hl ? '#FFC744' : '#FFFFFF'}>
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

export const ConceptLabel: React.FC = () => {
  const tw = measureAt('FUTURE CONCEPT', 34, 1.6);
  return (
    <g>
      <rect x={84} y={178} width={tw + 92} height={60} rx={30} fill="#0F1C26" opacity={0.62} />
      <circle cx={116} cy={208} r={10} fill={PAL.signal} />
      <circle cx={116} cy={208} r={4.5} fill="#FFFFFF" />
      <text x={140} y={220} fontFamily={CAP_FONT} fontWeight={CAP_WEIGHT} fontSize={34} letterSpacing={1.6} fill="#FFFFFF">
        FUTURE CONCEPT
      </text>
    </g>
  );
};

export const CompressedTag: React.FC<{f: number}> = ({f}) => {
  const a = clamp(inv(DEV.compress0 - 2, DEV.compress0 + 6, f)) * (1 - clamp(inv(DEV.compress1 - 6, DEV.compress1, f)));
  if (a <= 0) return null;
  const tw = measureAt('TIME COMPRESSED', 28, 1.4);
  return (
    <g opacity={a}>
      <rect x={84} y={248} width={tw + 86} height={50} rx={25} fill="#0F1C26" opacity={0.58} />
      <path d="M104,261 L120,273 L104,285 Z M120,261 L136,273 L120,285 Z" fill={PAL.signal} />
      <text x={148} y={283} fontFamily={CAP_FONT} fontWeight={CAP_WEIGHT} fontSize={28} letterSpacing={1.4} fill="#DDF6FF">
        TIME COMPRESSED
      </text>
    </g>
  );
};

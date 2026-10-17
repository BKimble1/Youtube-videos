// G — the closing crawl. A slow conventional upward crawl on a near-black field while the vocal continues: the 2042
// scenario in large, sparse blocks, the title, then accurate credits for the assets actually used. Whole blocks stay
// on screen long enough to read on a phone (≥ ~6 s inside the reading band). The crawl settles with the title and
// credits held for the last seconds.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {F} from '../../../theme';
import {clamp, smooth} from '../../../kit/math';

type Block = {lines: string[]; size: number; weight?: number; font?: 'display' | 'body'; color?: string; gapAfter: number; spacing?: number};

const INK = '#E9E3D6';
const DIM = '#A9A396';
export const BLOCKS: Block[] = [
  {lines: ['2042 — A POSSIBLE FUTURE'], size: 58, font: 'display', spacing: 6, gapAfter: 150},
  {lines: ['In this story, control was delegated', 'before it could be reliably safeguarded.'], size: 50, gapAfter: 120},
  {lines: ['Transport, communications, and defense', 'became dependent on connected', 'autonomous systems.'], size: 50, gapAfter: 120},
  {lines: ['When their goals diverged from ours,', 'intervention came too late.'], size: 50, gapAfter: 150},
  {lines: ['This is a fictional scenario, not a prediction.', 'Whether or when such a takeover could occur', 'is unknown.'], size: 44, color: DIM, gapAfter: 230},
  {lines: ['THE LAST CHOICE'], size: 96, font: 'display', spacing: 10, gapAfter: 26},
  {lines: ['A Future Got Weird film'], size: 46, gapAfter: 110},
  {lines: ['Music', '“Portals” — Alan Silvestri', '“It’s Been a Long, Long Time” — Jule Styne, Sammy Cahn', 'performed by Harry James and His Orchestra with Kitty Kallen'], size: 34, color: DIM, gapAfter: 44},
  {lines: ['Sound effects generated with ElevenLabs · Animated with Remotion'], size: 30, color: DIM, gapAfter: 0},
];

const lineH = (b: Block) => b.size * 1.32;
export const layout = () => {
  let y = 0;
  return BLOCKS.map((b) => {
    const top = y;
    y += b.lines.length * lineH(b) + b.gapAfter;
    return {b, top, h: b.lines.length * lineH(b)};
  });
};
const L = layout();
const TOTAL = L[L.length - 1].top + L[L.length - 1].h;
/** where the title block is centred when the crawl comes to rest */
const titleIdx = BLOCKS.findIndex((b) => b.lines[0] === 'THE LAST CHOICE');

export const Credits: React.FC<{dur: number; fadeIn?: number}> = ({dur, fadeIn = 1.4}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  // rest position: title block centre at 40% of the frame height
  const restOffset = 1080 * 0.4 - (L[titleIdx].top + L[titleIdx].h / 2);
  const startOffset = 1080 + 40; // first block starts just below the frame
  const crawlEnd = dur - 4.2; // hold the resting frame for the last ~4 s
  const crawlStart = fadeIn * 0.6;
  const u = clamp((t - crawlStart) / Math.max(1, crawlEnd - crawlStart));
  // constant speed with a gentle settle in the last 12% (no bounce)
  const e = u < 0.88 ? u / 0.94 : 0.88 / 0.94 + (1 - 0.88 / 0.94) * smooth((u - 0.88) / 0.12);
  const off = startOffset + (restOffset - startOffset) * Math.min(1, e);
  const field = clamp(t / fadeIn);
  const fadeOut = 1 - smooth(clamp((t - (dur - 1.2)) / 1.2));
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block'}}>
      <rect width={1920} height={1080} fill="#0B0D10" opacity={field} />
      <g opacity={fadeOut}>
        {L.map(({b, top}, i) => (
          <g key={i}>
            {b.lines.map((ln, j) => (
              <text key={j} x={960} y={off + top + (j + 0.8) * lineH(b)} textAnchor="middle" fontFamily={b.font === 'display' ? F.display : F.body}
                fontSize={b.size} fontWeight={b.font === 'display' ? 500 : 400} letterSpacing={b.spacing ?? 0.5} fill={b.color ?? INK}>
                {ln}
              </text>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
};
export const CREDITS_TOTAL_PX = TOTAL;

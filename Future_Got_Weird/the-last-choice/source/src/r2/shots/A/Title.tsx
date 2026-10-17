// The black title card after the opening aerial: THE LAST CHOICE / NEW YORK · 2042. Hard cut in from the city,
// a short rise of the text, hold, hard cut out to the hand on the rubble (sound bridges both cuts).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {F} from '../../../theme';
import {clamp, smooth} from '../../../kit/math';

export const TitleCard: React.FC<{dur: number}> = ({dur}) => {
  const t = useCurrentFrame() / 30;
  const a = smooth(clamp((t - 0.15) / 0.6));
  const b = smooth(clamp((t - 0.55) / 0.6));
  const out = 1 - smooth(clamp((t - (dur - 0.25)) / 0.25));
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block', background: '#000'}}>
      <rect width={1920} height={1080} fill="#000" />
      <g opacity={out}>
        <text x={960} y={548 + (1 - a) * 8} textAnchor="middle" fontFamily={F.display} fontSize={104} fontWeight={500} letterSpacing={14} fill="#ECE6D9" opacity={a}>THE LAST CHOICE</text>
        <text x={960} y={626 + (1 - b) * 6} textAnchor="middle" fontFamily={F.body} fontSize={34} letterSpacing={9} fill="#A9A396" opacity={b}>NEW YORK · 2042</text>
      </g>
    </svg>
  );
};

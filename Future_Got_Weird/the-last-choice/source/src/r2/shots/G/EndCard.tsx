// G — the end card (R3). The pullback has faded to black; one restrained line fades up and holds while the song
// arrives home and fades: A FUTURE GOT WEIRD FILM. No tool or production credits (they belong in the release notes:
// production/R3_DESCRIPTION.md). The opening title card is unchanged.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {F} from '../../../theme';
import {clamp, smooth} from '../../../kit/math';

export const END_CARD_TEXT = 'A FUTURE GOT WEIRD FILM';

export const EndCard: React.FC<{dur: number}> = ({dur}) => {
  const t = useCurrentFrame() / 30;
  const a = smooth(clamp((t - 0.5) / 1.0)) * (1 - smooth(clamp((t - (dur - 1.6)) / 1.2)));
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block', background: '#000'}}>
      <rect width={1920} height={1080} fill="#000" />
      <text x={960} y={556} textAnchor="middle" fontFamily={F.display} fontSize={60} fontWeight={500} letterSpacing={12} fill="#E9E3D6" opacity={a}>
        {END_CARD_TEXT}
      </text>
    </svg>
  );
};

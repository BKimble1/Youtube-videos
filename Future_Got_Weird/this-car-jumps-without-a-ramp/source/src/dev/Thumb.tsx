// Thumbnail: a genuine frame of BYD's demonstration (V2 recording frame 386: the U9 clear of the pavement, shadow below, plain sky),
// cropped to 16:9; BYD's on-screen distance graphic under the car is covered with plain pavement from the same frame
// (tools/make_thumb_frame.sh), plus two words. The car, sky and shadow are untouched, and the gap is the real one: no
// exaggeration, no invented obstacle.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F} from '../theme';

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: '#CFE0EE'}}>
    <Img src={staticFile('footage/thumb_frame.png')} style={{position: 'absolute', inset: 0, width: 1920, height: 1080, objectFit: 'fill'}} />
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <text x={96} y={262} fontFamily={F.display} fontWeight={700} fontSize={250} fill={C.white} stroke={C.ink} strokeWidth={24} paintOrder="stroke" letterSpacing={-2}>
        NO RAMP
      </text>
    </svg>
  </AbsoluteFill>
);

export const THUMB_CLEAR = 112; // unused by the real-frame thumbnail; kept for the vector variant in git history

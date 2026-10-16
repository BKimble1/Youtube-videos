// Companion thumbnail (1280×720): one real midair frame from Tesla's demo, cropped large, plus an original vector
// arrow toward a gas jet and at most "HOW DID IT?" (brief). The frame comes from the owner's recording via
// tools/render_thumbnail.sh (source/public/footage/thumb_frame.png, Git-ignored like the other Tesla clips).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F} from '../theme';

export type ThumbProps = {frame: string; scale: number; x0: number; y0: number};
export const THUMB_DEFAULTS: ThumbProps = {frame: 'footage/thumb_frame.png', scale: 1.75, x0: 463, y0: 332};

export const Thumbnail: React.FC<ThumbProps> = ({frame, scale, x0, y0}) => (
  <AbsoluteFill style={{backgroundColor: C.ink, overflow: 'hidden'}}>
    <Img src={staticFile(frame)} style={{position: 'absolute', width: 1920 * scale, height: 1080 * scale, left: -x0 * scale, top: -y0 * scale}} />
    {/* soft darkening behind the words only; the car and jets stay untouched */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 620px 360px at 230px 150px, rgba(10,20,26,0.55), rgba(10,20,26,0) 70%)'}} />
    <svg width={1280} height={720} style={{position: 'absolute', inset: 0}}>
      <g fontFamily={F.display} fontWeight={700} fill={C.saffron} stroke={C.ink} strokeWidth={16} strokeLinejoin="round" style={{paintOrder: 'stroke fill'}}>
        <text x={56} y={168} fontSize={150} letterSpacing={2}>HOW</text>
        <text x={56} y={318} fontSize={150} letterSpacing={2}>DID IT?</text>
      </g>
      {/* hand-drawn arrow: from under the words, curving down to the sideways jet */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 250 360 C 250 440, 290 480, 352 486" stroke={C.ink} strokeWidth={30} />
        <path d="M 250 360 C 250 440, 290 480, 352 486" stroke={C.saffron} strokeWidth={16} />
        <path d="M 314 450 L 364 488 L 306 520" stroke={C.ink} strokeWidth={30} />
        <path d="M 314 450 L 364 488 L 306 520" stroke={C.saffron} strokeWidth={16} />
      </g>
    </svg>
  </AbsoluteFill>
);

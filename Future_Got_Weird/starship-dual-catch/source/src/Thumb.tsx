import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage} from './kit/Stage';
import {CATCH_X} from './assets/Tower';
import {C, FONT} from './theme';

// Thumbnail (render at scale 2/3 for 1280x720): the ship dropping toward the open arms, before contact.
export const Thumb: React.FC<{variant: number}> = ({variant}) => {
  const cam = variant === 0 ? {x: CATCH_X + 120, y: -880, s: 1.18, r: -4} : {x: CATCH_X + 60, y: -820, s: 0.95, r: 0};
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dusk" sun={{x: 900, y: 520}} stars={0.3} armY={-640} open={0.75} vehicle="ship" cy={-643 - 210} tilt={-2} ship={{burn: 1, fwd: -8, aft: -12}} t={7} clouds={0.4} hl />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)'}} />
      <div style={{position: 'absolute', right: 70, top: 300, textAlign: 'right', fontFamily: FONT, fontWeight: 900, fontSize: 210, lineHeight: 0.92, letterSpacing: -6, color: '#fff', textShadow: '0 10px 0 rgba(0,0,0,0.35), 0 0 40px rgba(0,0,0,0.6)', WebkitTextStroke: '6px #0b0f18', paintOrder: 'stroke fill'}}>
        <div>CATCH</div>
        <div style={{color: C.accent}}>BOTH?</div>
      </div>
    </AbsoluteFill>
  );
};

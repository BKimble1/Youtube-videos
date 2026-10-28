// Cover frame: a frame of the film's own artwork (no captions), optionally with a brief "SEE-THROUGH SKIN" treatment
// for the cover only (it never appears over the film's opening action).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Frame} from './Film';

export const Cover: React.FC<{f: number; title: boolean}> = ({f, title}) => (
  <AbsoluteFill>
    <Frame f={f} captions={false} />
    {title && (
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 116, lineHeight: 1.02, whiteSpace: "nowrap",
        color: '#FFFFFF', WebkitTextStroke: '18px rgba(6,9,14,0.95)', paintOrder: 'stroke fill', textShadow: '0 8px 24px rgba(0,0,0,0.55)'} as React.CSSProperties}>
        SEE-THROUGH<br /><span style={{color: '#FFD84A'}}>SKIN</span>
      </div>
    )}
  </AbsoluteFill>
);

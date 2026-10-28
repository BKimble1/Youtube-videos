// The channel caption treatment (Glass Climbing V8 / Living Skin): Nunito Black, white with a dark stroke and soft
// shadow, emphasis words in yellow capitals. A caption appears whole on its first frame, holds perfectly still and is
// gone on the frame it hides; it never inherits a camera transform. Placement per caption is in shots.tsx (CAP_Y).
import React from 'react';
import {Caption} from './lib/time';

export const CaptionView: React.FC<{c: Caption; y: number}> = ({c, y}) => {
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 96, width: 820, top: y, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 68, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

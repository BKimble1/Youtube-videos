// V2 captions: the channel treatment (Nunito Black, white with a dark stroke, yellow uppercase emphasis), compact
// chunks on one line where they fit, whole on their first frame, still, gone on their last. Screen space.
import React from 'react';
import {CAPS2, EMPH2, capAt2} from './captions2';

export const Captions2: React.FC<{f: number}> = ({f}) => {
  const a = capAt2(f);
  if (!a) return null;
  const c = CAPS2[a.i];
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 90, width: 900, top: a.y, transform: 'translateY(-50%)', textAlign: 'center'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 72, lineHeight: 1.12, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '11px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.55)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = c.words[k];
          const hi = EMPH2.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

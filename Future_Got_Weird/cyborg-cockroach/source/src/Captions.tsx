// The channel caption treatment (glass-climbing V8 Captions8): Nunito Black 66 px, white with a dark stroke, restrained
// yellow uppercase emphasis. A caption appears whole on its first frame (no fade or pop), holds still and is gone on the
// frame it hides. It sits in screen space, outside every camera transform.
import React from 'react';
import {CAPTIONS} from './timeline';
import {capAt} from './captions';

export const Captions: React.FC<{f: number}> = ({f}) => {
  const a = capAt(f);
  if (!a) return null;
  const c = CAPTIONS[a.i];
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: a.left, width: a.width, top: a.y, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '').replace(/'/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

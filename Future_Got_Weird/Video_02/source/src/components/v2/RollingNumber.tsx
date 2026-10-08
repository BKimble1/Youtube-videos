import React from 'react';
import {C, F} from '../../theme';

/**
 * A mechanical score counter digit (or digits) that rolls from `from` to `to`. `t` is the roll progress and may
 * overshoot 1 (feed it a spring) so the drum snaps past and settles. Renders a window with a soft shading band.
 */
export const RollingNumber: React.FC<{
  from: number;
  to: number;
  t: number;
  size?: number;
  color?: string;
  bg?: string;
  digits?: number;
}> = ({from, to, t, size = 96, color = C.white, bg = C.ink, digits = 1}) => {
  const lh = size * 1.12;
  const v = from + (to - from) * t;
  const cols = Array.from({length: digits}).map((_, i) => digits - 1 - i);
  return (
    <div style={{display: 'inline-flex', background: bg, borderRadius: size * 0.18, padding: `0 ${size * 0.12}px`, position: 'relative'}}>
      {cols.map((p) => {
        const place = Math.pow(10, p);
        // each column shows (v / place) mod 10, continuous for the units column, stepping for higher columns
        const cv = p === 0 ? v : Math.floor(v / place) % 10 + Math.max(0, Math.min(1, ((v % place) - (place - 1)) * 1));
        const norm = ((cv % 10) + 10) % 10;
        return (
          <div key={p} style={{position: 'relative', width: size * 0.66, height: lh, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: -norm * lh}}>
              {Array.from({length: 11}).map((_, d) => (
                <div key={d} style={{height: lh, lineHeight: `${lh}px`, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: size, color}}>{d % 10}</div>
              ))}
            </div>
          </div>
        );
      })}
      {/* drum shading: darker towards the top and bottom edges */}
      <div style={{position: 'absolute', inset: 0, borderRadius: size * 0.18, background: 'linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0) 26%, rgba(0,0,0,0) 74%, rgba(0,0,0,0.28))', pointerEvents: 'none'}} />
    </div>
  );
};

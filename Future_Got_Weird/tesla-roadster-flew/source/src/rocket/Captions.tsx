// Phrase captions (2-5 words per plate) in the channel's caption style, the spoken word lit in saffron. Three words get
// a restrained emphasis (capitals and colour): AIR, WEIGHT, BALANCE. Placed in y 1290-1450, x 110-930: clear of the
// Shorts title zone (y > 1580) and the right-hand button rail (x > 930).
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {EMPHASIS, PHRASES, Word, words} from './data';

export const RocketCaptions: React.FC<{y?: number; end: number}> = ({y = 1300, end}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const phrases = React.useMemo(() => {
    const out: {ws: Word[]; a: number; b: number}[] = [];
    let i = 0;
    for (const n of PHRASES) {
      const ws = words.slice(i, i + n);
      out.push({ws, a: ws[0].s - 0.08, b: 0});
      i += n;
    }
    out.forEach((p, k) => {
      const next = out[k + 1];
      const last = p.ws[p.ws.length - 1].e;
      p.b = next ? Math.min(next.a, last + 0.4) : Math.min(end, last + 0.4);
    });
    return out;
  }, [end]);
  const p = phrases.find((q) => t >= q.a && t < q.b);
  if (!p) return null;
  const s = interpolate(t, [p.a, p.a + 0.1], [0.94, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 110, width: 820, top: y, display: 'flex', justifyContent: 'center'}}>
      <div style={{
        transform: `scale(${s})`, background: C.cream, border: `5px solid ${C.ink}`, borderRadius: 26, padding: '8px 22px',
        boxShadow: '0 6px 0 rgba(0,0,0,0.35)', fontFamily: F.display, fontWeight: 600, fontSize: 62, color: C.ink,
        lineHeight: 1.16, textAlign: 'center', maxWidth: 820,
      }}>
        {p.ws.map((w, i) => {
          const on = t >= w.s - 0.03 && t < (p.ws[i + 1]?.s ?? p.b);
          const em = EMPHASIS.find(([ew, eb]) => eb === w.b && w.w.replace(/[.,?!]+$/, '').toLowerCase() === ew);
          const text = em ? w.w.toUpperCase() : w.w;
          return (
            <span key={i} style={{background: on ? C.saffron : 'transparent', borderRadius: 12, padding: '0 6px', margin: '0 2px', display: 'inline-block',
              color: em && !on ? em[2] : C.ink, fontWeight: em ? 700 : 600}}>{text}</span>
          );
        })}
      </div>
    </div>
  );
};

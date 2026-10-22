// Text layers: FGW captions (white, key words yellow), compact labels, the day counter. Caption band sits in the
// lower third (centre y 1440), clear of the Shorts title/channel strip and the right-hand action column.
import React from 'react';
import {CAPTIONS, clamp, inv} from './lib';

export const FONT = {
  cap: '"Nunito Variable", "Nunito", system-ui, sans-serif',
  label: '"Fredoka Variable", "Fredoka", "Nunito Variable", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};
export const YEL = '#FFD84A';
export const CAP = {cy: 1440, size: 70, maxW: 880};

export const Captions: React.FC<{t: number}> = ({t}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const age = t - c.show;
  const a = i === 0 ? 1 : clamp(age / 0.07);
  const pop = 1 + 0.06 * (1 - clamp(age / 0.12));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: (1080 - CAP.maxW) / 2, width: CAP.maxW, top: CAP.cy, transform: `translateY(-50%) scale(${i === 0 ? 1 : pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: FONT.cap, fontWeight: 900, fontSize: CAP.size, lineHeight: 1.18, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(8,10,14,0.92)', paintOrder: 'stroke fill', textShadow: '0 5px 14px rgba(0,0,0,0.55)'} as React.CSSProperties}>
        {words.map((w, k) => {
          const key = w.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? YEL : '#FFFFFF'}}>{(hi ? w.toUpperCase() : w) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

// compact chip label (small, brief)
export const Chip: React.FC<{text: string; x: number; y: number; a: number; dot?: string; size?: number; align?: 'left' | 'center'}> = ({text, x, y, a, dot = '#7FF2EA', size = 34, align = 'center'}) => {
  if (a <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: align === 'center' ? x - 500 : x, width: align === 'center' ? 1000 : undefined, top: y, textAlign: align, opacity: a, transform: `translateY(${(1 - a) * 8}px)`}}>
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: FONT.label, fontWeight: 600, fontSize: size, letterSpacing: '0.06em', color: '#F2F6F8',
        background: 'rgba(8,14,20,0.72)', border: '2px solid rgba(255,255,255,0.14)', padding: '8px 22px', borderRadius: 999}}>
        <span style={{width: size * 0.36, height: size * 0.36, borderRadius: 99, background: dot, display: 'inline-block'}} />
        {text}
      </span>
    </div>
  );
};

export const fadeWin = (t: number, a: number, b: number, f = 0.15) => clamp(Math.min(inv(a, a + f, t), 1 - inv(b - f, b, t)));

// DAY 0 -> DAY 7 time-compression indicator (top of frame, clear of the Shorts header)
export const DayCounter: React.FC<{p: number; a: number}> = ({p, a}) => {
  if (a <= 0.001) return null;
  const day = Math.min(7, Math.floor(p * 7 + 1e-6));
  const W = 620;
  return (
    <div style={{position: 'absolute', left: 540 - W / 2, top: 200, width: W, opacity: a, transform: `translateY(${(1 - a) * -10}px)`}}>
      <div style={{background: 'rgba(6,14,18,0.78)', border: '2px solid rgba(127,242,234,0.35)', borderRadius: 28, padding: '18px 34px 24px'}}>
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontFamily: FONT.mono, color: '#EAFBFA'}}>
          <span style={{fontSize: 46, opacity: 0.85}}>DAY 0 →</span>
          <span style={{fontSize: 86, fontWeight: 700, color: day === 7 ? YEL : '#EAFBFA'}}>DAY {day}</span>
        </div>
        <div style={{position: 'relative', height: 14, marginTop: 10, background: 'rgba(255,255,255,0.12)', borderRadius: 7}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(p) * 100}%`, background: '#7FF2EA', borderRadius: 7}} />
          {Array.from({length: 8}, (_, k) => <div key={k} style={{position: 'absolute', left: `${(k / 7) * 100}%`, top: -4, width: 4, height: 22, marginLeft: -2, background: k <= day ? '#EAFBFA' : 'rgba(255,255,255,0.3)'}} />)}
        </div>
      </div>
    </div>
  );
};

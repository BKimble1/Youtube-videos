import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {clamp, ramp} from './ease';
import {interpolate} from 'remotion';

export type Cam = {x: number; y: number; s: number; r?: number};
export const W = 1920;
export const H = 1080;
export const toScreen = (cam: Cam, wx: number, wy: number) => ({x: W / 2 + (wx - cam.x) * cam.s, y: H / 2 + (wy - cam.y) * cam.s});

// World-space group seen through a camera (centre x,y in world units, scale s, optional roll in degrees).
export const World: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.r ?? 0}) scale(${cam.s}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
);

export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, ...style}}>
    {children}
  </svg>
);

// Small leader-line label. (x,y) is the point it refers to, (tx,ty) where the text sits.
export const Tag: React.FC<{x: number; y: number; tx: number; ty: number; text: string; sub?: string; at: number; out?: number; color?: string; align?: 'left' | 'right'}> = ({
  x, y, tx, ty, text, sub, at, out = 1e9, color = C.accent, align = 'left',
}) => {
  const f = useCurrentFrame();
  const a = ramp(f, at, at + 9) * (1 - ramp(f, out, out + 8));
  if (a <= 0) return null;
  const line = ramp(f, at, at + 10);
  const mx = x + (tx - x) * line;
  const my = y + (ty - y) * line;
  return (
    <g opacity={a}>
      <circle cx={x} cy={y} r={5} fill={color} />
      <circle cx={x} cy={y} r={11} fill="none" stroke={color} strokeWidth={2} opacity={0.6} />
      <line x1={x} y1={y} x2={mx} y2={my} stroke={color} strokeWidth={2.5} />
      <g transform={`translate(${tx} ${ty})`}>
        <text x={align === 'left' ? 12 : -12} y={8} textAnchor={align === 'left' ? 'start' : 'end'} fontFamily={MONO} fontWeight={700} fontSize={26} fill="#fff" letterSpacing={2} style={{paintOrder: 'stroke'}} stroke="#05070b" strokeWidth={6}>
          {text}
        </text>
        {sub && (
          <text x={align === 'left' ? 12 : -12} y={38} textAnchor={align === 'left' ? 'start' : 'end'} fontFamily={FONT} fontWeight={700} fontSize={21} fill="#d7dee6" style={{paintOrder: 'stroke'}} stroke="#05070b" strokeWidth={5}>
            {sub}
          </text>
        )}
      </g>
    </g>
  );
};

// Disclosure badge for illustrations of events that have not happened or are reconstructions.
export const Badge: React.FC<{text: string; at?: number; out?: number; tone?: 'warn' | 'info'; pos?: 'tl' | 'tr' | 'bl'}> = ({text, at = 0, out = 1e9, tone = 'warn', pos = 'tl'}) => {
  const f = useCurrentFrame();
  const a = ramp(f, at, at + 8) * (1 - ramp(f, out, out + 8));
  if (a <= 0) return null;
  const style: React.CSSProperties = {position: 'absolute', top: pos === 'bl' ? undefined : 44, bottom: pos === 'bl' ? 44 : undefined, left: pos === 'tr' ? undefined : 52, right: pos === 'tr' ? 52 : undefined};
  return (
    <div style={{...style, opacity: a, display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px 9px 12px', borderRadius: 8, background: 'rgba(6,9,15,0.72)', border: `1.5px solid ${tone === 'warn' ? C.accent : C.accent2}`, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: '#fff'}}>
      <div style={{width: 12, height: 12, borderRadius: 6, background: tone === 'warn' ? C.accent : C.accent2}} />
      {text}
    </div>
  );
};

// Large title card text used sparingly (section openers, key numbers).
export const Big: React.FC<{text: string; at: number; out?: number; x?: number; y?: number; size?: number; color?: string; sub?: string; align?: 'center' | 'left'}> = ({
  text, at, out = 1e9, x = 960, y = 540, size = 92, color = '#fff', sub, align = 'center',
}) => {
  const f = useCurrentFrame();
  const a = ramp(f, at, at + 8) * (1 - ramp(f, out, out + 8));
  if (a <= 0) return null;
  const dy = interpolate(f, [at, at + 12], [18, 0], clamp);
  return (
    <div style={{position: 'absolute', left: align === 'center' ? x - 800 : x, top: y - size * 0.7 + dy, width: align === 'center' ? 1600 : 1400, textAlign: align, opacity: a}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color, letterSpacing: -1, lineHeight: 1.05, textShadow: '0 4px 24px rgba(0,0,0,0.55)'}}>{text}</div>
      {sub && <div style={{fontFamily: MONO, fontWeight: 700, fontSize: size * 0.3, color: '#cfd8e2', letterSpacing: 3, marginTop: 14}}>{sub}</div>}
    </div>
  );
};

export const Fade: React.FC<{children: React.ReactNode; inF?: number; outF?: number; len?: number}> = ({children, inF = 0, outF, len = 10}) => {
  const f = useCurrentFrame();
  const a = ramp(f, inF, inF + len) * (outF === undefined ? 1 : 1 - ramp(f, outF, outF + len));
  return <AbsoluteFill style={{opacity: a}}>{children}</AbsoluteFill>;
};

export const Vignette: React.FC<{k?: number}> = ({k = 0.55}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${k}) 100%)`, pointerEvents: 'none'}} />
);

// Film grain-free letterbox-style lower strip for dates and sources.
export const Note: React.FC<{text: string; at: number; out?: number}> = ({text, at, out = 1e9}) => {
  const f = useCurrentFrame();
  const a = ramp(f, at, at + 8) * (1 - ramp(f, out, out + 8));
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 52, bottom: 46, opacity: a, fontFamily: MONO, fontSize: 20, fontWeight: 500, color: '#c9d2dc', letterSpacing: 1.5, background: 'rgba(6,9,15,0.6)', padding: '7px 14px', borderRadius: 6}}>{text}</div>
  );
};

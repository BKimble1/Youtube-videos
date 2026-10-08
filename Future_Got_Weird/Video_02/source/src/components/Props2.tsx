import React from 'react';
import {C, F, OUTLINE} from '../theme';
import {lerp} from '../lib/anim';

/** Card-catalogue cabinet. One drawer can slide out (open: 0..1) and show a card. Origin: bottom centre. */
export const Catalogue: React.FC<{open?: number; card?: React.ReactNode; scale?: number; style?: React.CSSProperties}> = ({open = 0, card, scale = 1, style}) => (
  <div style={{position: 'absolute', left: -170 * scale, top: -330 * scale, width: 340 * scale, height: 330 * scale, ...style}}>
    <svg viewBox="-170 -330 340 330" width={340 * scale} height={330 * scale} style={{overflow: 'visible'}}>
      <rect x={-160} y={-320} width={320} height={320} rx={10} fill={C.wood} stroke={C.ink} strokeWidth={OUTLINE} />
      {Array.from({length: 4}).map((_, r) =>
        Array.from({length: 3}).map((_, c) => {
          const isOpen = r === 1 && c === 1;
          const dx = isOpen ? open * 150 : 0;
          return (
            <g key={`${r}-${c}`} transform={`translate(${dx} 0)`}>
              <rect x={-150 + c * 104} y={-308 + r * 78} width={96} height={68} rx={6} fill={isOpen ? C.woodLight : C.woodLight} stroke={C.ink} strokeWidth={3} />
              <rect x={-150 + c * 104 + 28} y={-308 + r * 78 + 28} width={40} height={12} rx={4} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2} />
              <rect x={-150 + c * 104 + 20} y={-308 + r * 78 + 8} width={56} height={12} rx={2} fill={C.cream} stroke={C.ink} strokeWidth={2} />
            </g>
          );
        }),
      )}
      {/* the open drawer's body */}
      {open > 0.02 && <rect x={-46 + open * 150 - 150 * open} y={-230} width={150 * open} height={68} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />}
    </svg>
    {card && open > 0.5 && <div style={{position: 'absolute', left: 45 * scale, top: -130 * scale, transform: `scale(${scale})`, transformOrigin: '0 0', opacity: Math.min(1, (open - 0.5) * 3)}}>{card}</div>}
  </div>
);

/** Magnifying glass. Origin at the lens centre. */
export const Magnifier: React.FC<{scale?: number; style?: React.CSSProperties; t?: number}> = ({scale = 1, style, t = 1}) => (
  <svg viewBox="-80 -80 200 200" width={200 * scale} height={200 * scale} style={{position: 'absolute', left: -80 * scale, top: -80 * scale, opacity: t, transform: `scale(${lerp(0.6, 1, t)})`, overflow: 'visible', ...style}}>
    <line x1={48} y1={48} x2={108} y2={108} stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
    <line x1={48} y1={48} x2={108} y2={108} stroke={C.woodDeep} strokeWidth={16} strokeLinecap="round" />
    <circle cx={0} cy={0} r={66} fill="rgba(255,255,255,0.25)" stroke={C.ink} strokeWidth={OUTLINE + 6} />
    <circle cx={0} cy={0} r={66} fill="none" stroke={C.saffron} strokeWidth={8} />
    <path d="M -40 -20 Q -30 -48 -4 -52" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
  </svg>
);

/** Gold embossed seal with text (the "IS ENTITLED" confidence seal). */
export const Seal: React.FC<{text: string; t?: number; size?: number; style?: React.CSSProperties}> = ({text, t = 1, size = 120, style}) => (
  <div style={{position: 'absolute', width: size, height: size, borderRadius: '50%', background: C.saffron, border: `${OUTLINE}px solid ${C.saffronDeep}`, boxShadow: `inset 0 0 0 6px ${C.saffronLight}, 4px 5px 0 ${C.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: size * 0.17, color: C.ink, letterSpacing: '0.04em', lineHeight: 1.05, opacity: t, transform: `rotate(-10deg) scale(${lerp(1.5, 1, Math.min(1, t * 1.3))})`, ...style}}>
    {text}
  </div>
);

/** Speech/thought bubble with a tail pointing down-left. */
export const Bubble: React.FC<{children: React.ReactNode; width?: number; t?: number; style?: React.CSSProperties; thought?: boolean}> = ({children, width = 420, t = 1, style, thought}) => (
  <div style={{position: 'absolute', width, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 26, padding: '18px 24px', fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.ink, opacity: t, transform: `scale(${lerp(0.7, 1, t)})`, transformOrigin: '10% 100%', ...style}}>
    {children}
    {thought ? (
      <>
        <div style={{position: 'absolute', left: 20, bottom: -30, width: 22, height: 22, borderRadius: 11, background: C.white, border: `3px solid ${C.ink}`}} />
        <div style={{position: 'absolute', left: 2, bottom: -52, width: 14, height: 14, borderRadius: 7, background: C.white, border: `3px solid ${C.ink}`}} />
      </>
    ) : (
      <div style={{position: 'absolute', left: 36, bottom: -22, width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: `24px solid ${C.ink}`}} />
    )}
  </div>
);

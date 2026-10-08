import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {Marked} from '../Props';

/* ------------------------------------------------------------------ the index card (catalogue entry) */
/** Card face, CARD_W × CARD_H local px. Same language as components/v2/Catalogue IndexCard (cream, ink border, coral
 *  header rule, mono name line, serif "title:"), laid out so the blank title is a box the answer can fill. */
export const CARD_W = 220;
export const CARD_H = 138;
export const CARD_NAME_FONT = 17;
export const CARD_TITLE_FONT = 19;
/** the blank title box (local px) */
export const TITLE_BOX = {x: 12, y: 64, w: 196, h: 62};
export const FILL_FONT = 13.5;
export type FillWord = {text: string; x: number; y: number; t: number}; // x, y local to the box; t: 0 not landed … 1 landed
// (the words are laid out by canvas measurement, so they render with optical sizing off: at 13.5 px CSS the variable
// serif would otherwise switch to its wider caption cut and the measured line would overrun)

export const IndexCardV2: React.FC<{blank?: number; fill?: FillWord[]; boxDraw?: number; pulse?: number}> = ({blank = 1, fill = [], boxDraw = 1, pulse = 0}) => (
  <div style={{position: 'relative', width: CARD_W, height: CARD_H, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 6, boxSizing: 'border-box', boxShadow: `3px 4px 0 ${C.shadow}`}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 32, height: 2, background: C.coral, opacity: 0.65}} />
    <div style={{position: 'absolute', left: 10, top: 7, fontFamily: F.mono, fontWeight: 700, fontSize: CARD_NAME_FONT, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1.2}}>KALAI, A. · 2001</div>
    <div style={{position: 'absolute', left: 11, top: 38, fontFamily: F.serif, fontSize: CARD_TITLE_FONT, color: C.inkSoft, lineHeight: 1.1}}>title:</div>
    {/* the gap: a dashed coral box (the same style as the outline round the empty shelf slot) */}
    <svg width={TITLE_BOX.w} height={TITLE_BOX.h} style={{position: 'absolute', left: TITLE_BOX.x - 3, top: TITLE_BOX.y - 3, overflow: 'visible'}}>
      <rect x={1.5} y={1.5} width={TITLE_BOX.w - 3} height={TITLE_BOX.h - 3} rx={6} fill={`rgba(239,107,85,${0.08 + 0.18 * pulse})`} stroke={C.coral} strokeWidth={3} strokeDasharray="9 6" opacity={blank} pathLength={1000} strokeDashoffset={0} style={{strokeDasharray: boxDraw < 1 ? `${boxDraw * 1000} 1000` : '9 6'}} />
    </svg>
    {fill.map((w, k) =>
      w.t > 0 ? (
        <div key={k} style={{position: 'absolute', left: TITLE_BOX.x - 3 + w.x, top: TITLE_BOX.y - 3 + w.y - (1 - Math.min(1, w.t)) * 6, fontFamily: F.serif, fontSize: FILL_FONT, fontOpticalSizing: 'none', lineHeight: 1.2, color: C.ink, whiteSpace: 'nowrap', transform: `translateY(${w.t > 1 ? -(w.t - 1) * 14 : 0}px)`}}>
          {w.text}
        </div>
      ) : null,
    )}
  </div>
);

/* ------------------------------------------------------------------ the answer slip (S1's slip art, excerpt text) */
/** The same card as components/v2/AnswerSlip AnswerSlipArt (cream, ink outline, gold inner edge, Fredoka model name,
 *  Nunito detail line, serif body) carrying the published excerpt this scene is about. SLIP_W × SLIP_H local px. */
export const SLIP_W = 360;
export const SLIP_H = 280;
export const SLIP_BODY_FONT = 25;
export const SlipV2: React.FC<{entitled?: number; glint?: number; children?: React.ReactNode}> = ({entitled = 0, glint = 0, children}) => (
  <div style={{position: 'relative', width: SLIP_W, height: SLIP_H}}>
    <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 10, boxShadow: `7px 9px 0 ${C.shadow}`, padding: '16px 22px', boxSizing: 'border-box', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 7, right: 7, top: 7, bottom: 7, border: `2px solid ${C.saffronDeep}`, borderRadius: 6, opacity: 0.75}} />
      {glint > 0 && glint < 1 && (
        <div style={{position: 'absolute', left: -120 + glint * (SLIP_W + 200), top: -40, width: 46, height: SLIP_H + 80, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,240,190,0.95), rgba(255,255,255,0))', transform: 'rotate(18deg)'}} />
      )}
      <div style={{position: 'relative', fontFamily: F.display, fontWeight: 600, fontSize: 27, color: C.ink, lineHeight: 1}}>ChatGPT</div>
      <div style={{position: 'relative', fontFamily: F.body, fontWeight: 800, fontSize: 18, color: C.inkMuted, marginTop: 4, marginBottom: 8}}>GPT-4o · 9 May 2025</div>
      <div style={{position: 'relative', fontFamily: F.serif, fontSize: SLIP_BODY_FONT, lineHeight: 1.26, color: C.ink}}>
        <Marked spans={[{text: '…is entitled:', mark: 'ink', markT: entitled}, {text: ' “Boosting, Online Algorithms, and Other Topics in Machine Learning.”'}]} />
      </div>
    </div>
    {children}
  </div>
);
/** where the body text's first line ("…is entitled:") sits on the slip (local px), for tags that try to clip on */
export const SLIP_LINE1 = {x: 22, y: 16 + 27 + 4 + 18 + 8 + 2, h: SLIP_BODY_FONT * 1.26};

/* ------------------------------------------------------------------ the confidence seal */
export const SealArt: React.FC<{size: number; shine?: number}> = ({size, shine = 0}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    <svg viewBox="-50 -50 100 100" width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {/* scalloped rim */}
      <path
        d={Array.from({length: 24})
          .map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = i % 2 === 0 ? 50 : 45;
            return `${i === 0 ? 'M' : 'L'} ${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
          })
          .join(' ') + ' Z'}
        fill={C.saffronDeep}
        stroke={C.ink}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <circle cx={0} cy={0} r={39} fill={C.saffron} stroke={C.ink} strokeWidth={2} />
      <circle cx={0} cy={0} r={33} fill="none" stroke={C.saffronLight} strokeWidth={3} />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: size * 0.165, color: C.ink, letterSpacing: '0.04em', lineHeight: 1.02, whiteSpace: 'pre-line', transform: 'rotate(-10deg)'}}>
      {'IS\nENTITLED'}
    </div>
    {shine > 0 && shine < 1 && (
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -size * 0.6 + shine * size * 1.8, top: -size * 0.3, width: size * 0.2, height: size * 1.6, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,250,225,0.9), rgba(255,255,255,0))', transform: 'rotate(22deg)'}} />
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ hedge tag ("I think", "maybe") */
export const HedgeTag: React.FC<{text: string; strike?: number; size?: number}> = ({text, strike = 0, size = 30}) => (
  <div style={{position: 'relative', display: 'inline-flex', alignItems: 'center', background: C.white, border: `3px solid ${C.ink}`, borderRadius: `${size * 0.22}px ${size * 0.4}px ${size * 0.4}px ${size * 0.22}px`, padding: `${size * 0.16}px ${size * 0.5}px ${size * 0.16}px ${size * 0.75}px`, boxShadow: `4px 5px 0 ${C.shadow}`, fontFamily: F.serif, fontStyle: 'italic', fontSize: size, lineHeight: 1.15, color: C.inkSoft, whiteSpace: 'nowrap'}}>
    <div style={{position: 'absolute', left: size * 0.22, top: '50%', width: size * 0.26, height: size * 0.26, marginTop: -size * 0.13, borderRadius: '50%', border: `2.5px solid ${C.ink}`, background: C.paperDeep}} />
    <span style={{position: 'relative'}}>
      {text}
      {strike > 0 && <span style={{position: 'absolute', left: -6, top: '50%', height: 6, marginTop: -2, width: `calc(${Math.min(1, strike) * 100}% + 12px)`, background: C.coral, borderRadius: 3, transform: 'rotate(-4deg)', transformOrigin: '0 50%'}} />}
    </span>
  </div>
);

/* ------------------------------------------------------------------ a peeled spine word in flight */
export const WordStrip: React.FC<{text: string; size: number; style?: React.CSSProperties}> = ({text, size, style}) => (
  <div style={{display: 'inline-block', background: C.cream, border: `${Math.max(1.5, size * 0.1)}px solid ${C.ink}`, borderRadius: size * 0.18, padding: `${size * 0.12}px ${size * 0.3}px`, fontFamily: F.serif, fontWeight: 600, fontSize: size, lineHeight: 1.1, color: C.ink, whiteSpace: 'nowrap', boxShadow: `${size * 0.12}px ${size * 0.15}px 0 ${C.shadow}`, ...style}}>
    {text}
  </div>
);

/* ------------------------------------------------------------------ candle flame for the birthday cake */
export const Flame: React.FC<{g: number; scale?: number}> = ({g, scale = 1}) => {
  const f = 1 + 0.12 * Math.sin(g * 0.9) + 0.06 * Math.sin(g * 2.3 + 1);
  const sk = 7 * Math.sin(g * 0.55) + 3 * Math.sin(g * 1.7);
  return (
    <svg viewBox="-12 -26 24 28" width={24 * scale} height={28 * scale} style={{position: 'absolute', left: -12 * scale, top: -26 * scale, overflow: 'visible'}}>
      <g transform={`skewX(${sk}) scale(${1 / Math.sqrt(f)}, ${f})`}>
        <path d="M 0 -24 Q 10 -10 0 0 Q -10 -10 0 -24 Z" fill={C.saffron} stroke={C.ink} strokeWidth={2} />
        <path d="M 0 -14 Q 4 -6 0 -1 Q -4 -6 0 -14 Z" fill={C.coral} />
      </g>
    </svg>
  );
};

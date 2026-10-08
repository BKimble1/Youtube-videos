import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F, OUTLINE} from '../../theme';
import {RollingNumber} from './RollingNumber';

/**
 * S7 (the benchmarks) props. Pure drawings driven by numbers the scene computes from its cue constants.
 * Everything is placed in world px (the 1920×1080 subject plane, camera depth 1). The game-show pieces (navy panel
 * with bulbs, the blue face-down rule card, the trophy) repeat S6's language so the quiz → real-benchmarks bridge is
 * self-evident.
 */

export const NAVY = '#2E3F5C';
export const NAVY_DEEP = '#1F2B40';
export const SLATE = '#B9C6CC';
const TAPE_BG = 'rgba(255,233,168,0.88)';

/* ------------------------------------------------------------------ tape */
export const TapeStrip: React.FC<{x: number; y: number; rot: number; w?: number; h?: number; lift?: number}> = ({x, y, rot, w = 120, h = 32, lift = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      background: TAPE_BG,
      border: `2px solid rgba(22,42,50,0.28)`,
      transform: `rotate(${rot}deg) translateY(${-lift * 3}px) scale(${1 + lift * 0.04})`,
      boxShadow: lift > 0.02 ? `0 ${2 + lift * 5}px 0 rgba(22,42,50,${0.12 * lift})` : 'none',
    }}
  />
);

/* ------------------------------------------------------------------ real document crops */
/** A real crop shown as is (top `cropPx` rows of the image only), on a white card. (x, y) is the card's top-left. */
export const DocCard: React.FC<{
  src: string;
  natW: number;
  natH: number;
  cropPx: number;
  iw: number;
  pad: number;
  x: number;
  y: number;
  rot?: number;
  shadow?: number;
  scale?: number;
  children?: React.ReactNode; // overlays, in card-local px
}> = ({src, natW, natH, cropPx, iw, pad, x, y, rot = 0, shadow = 12, scale = 1, children}) => {
  const k = iw / natW;
  const vh = cropPx * k;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: iw + 2 * (pad + OUTLINE),
        height: vh + 2 * (pad + OUTLINE),
        transform: `rotate(${rot}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.white,
          border: `${OUTLINE}px solid ${C.ink}`,
          borderRadius: 8,
          boxShadow: `${shadow * 0.85}px ${shadow}px 0 ${C.shadow}`,
        }}
      />
      <div style={{position: 'absolute', left: pad + OUTLINE, top: pad + OUTLINE, width: iw, height: vh, overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{width: iw, height: natH * k, display: 'block'}} />
      </div>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ the rail: one slot per table row (S6 answer-panel slots) */
export type SlotFace = 'off' | 'num' | 'check' | 'dash';
export const RailSlot: React.FC<{x: number; cy: number; w: number; h: number; face: SlotFace; n: number; flip: number; shake?: number; glow?: number}> = ({x, cy, w, h, face, n, flip, shake = 0, glow = 0}) => {
  const sy = Math.abs(Math.cos(Math.PI * Math.min(1, Math.max(0, flip)))) * (1 + Math.max(0, flip - 1) * 0.6);
  const s = {
    off: {bg: NAVY_DEEP, bd: '#3B4E6E', fg: 'transparent', g: ''},
    num: {bg: C.cream, bd: C.ink, fg: C.ink, g: String(n)},
    check: {bg: C.teal, bd: C.tealDeep, fg: C.white, g: '✓'},
    dash: {bg: C.cream, bd: C.inkMuted, fg: C.inkMuted, g: '–'},
  }[face];
  return (
    <div
      style={{
        position: 'absolute',
        left: x + shake,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: 7,
        background: s.bg,
        border: `3px ${face === 'dash' ? 'dashed' : 'solid'} ${s.bd}`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: face === 'num' ? F.mono : F.display,
        fontWeight: 700,
        fontSize: face === 'num' ? 19 : 22,
        lineHeight: 1,
        color: s.fg,
        transform: `scaleY(${Math.max(0.02, sy)})`,
        boxShadow: glow > 0 ? `0 0 ${10 * glow}px ${3 * glow}px rgba(28,167,160,${0.7 * glow})` : 'none',
      }}
    >
      {s.g}
    </div>
  );
};

/* ------------------------------------------------------------------ the tally panel (S6 scoreboard language) */
export const CounterPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  value: number; // continuous count (rolls)
  plate: number; // 0 blank flap … 1 "SAMPLED MID-2025" (may overshoot)
  bulbs: number[]; // 0..1 brightness per bulb
  pulse: number;
}> = ({x, y, w, h, value, plate, bulbs, pulse}) => {
  const pf = Math.min(1, Math.max(0, plate));
  const plateSy = Math.abs(Math.cos(Math.PI * pf)) * (1 + Math.max(0, plate - 1) * 0.8);
  const face = pf > 0.5;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `scale(${1 + 0.05 * pulse})`, transformOrigin: '50% 60%'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 20, background: NAVY, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `8px 10px 0 rgba(22,42,50,0.22)`}} />
      {/* bulbs along the bottom edge */}
      {bulbs.map((b, k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 26 + (k * (w - 64)) / (bulbs.length - 1),
            top: h - 21,
            width: 12,
            height: 12,
            borderRadius: 6,
            background: `rgba(255,233,168,${0.35 + 0.65 * b})`,
            border: `2px solid ${C.ink}`,
            boxShadow: b > 0.6 ? `0 0 ${8 * b}px ${2 * b}px rgba(255,199,68,${0.55 * b})` : 'none',
          }}
        />
      ))}
      {/* the date plate: a flap that flips over */}
      <div style={{position: 'absolute', left: 22, right: 22, top: 12, height: 38, transform: `scaleY(${Math.max(0.03, plateSy)})`}}>
        {face ? (
          <div style={{position: 'absolute', inset: 0, borderRadius: 9, background: C.saffron, border: `3px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 32, letterSpacing: '0.04em', color: C.ink, lineHeight: 1, whiteSpace: 'nowrap'}}>
            SAMPLED MID-2025
          </div>
        ) : (
          <div style={{position: 'absolute', inset: 0, borderRadius: 9, background: NAVY_DEEP, border: `3px solid ${C.ink}`}}>
            {[0.12, 0.88].map((f) => (
              <div key={f} style={{position: 'absolute', left: `${f * 100}%`, top: 12, width: 9, height: 9, borderRadius: 5, background: '#56688A'}} />
            ))}
          </div>
        )}
      </div>
      {/* the count: rolling drum + "/ 10" (its box ends just above the bulb row) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 52, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
        <div style={{border: `3px solid ${C.ink}`, borderRadius: 16, lineHeight: 0}}>
          <RollingNumber from={0} to={1} t={value} size={80} color={C.cream} bg={NAVY_DEEP} />
        </div>
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 56, color: C.cream, lineHeight: 1, whiteSpace: 'nowrap'}}>/ 10</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ the rule card (S6's '“I don't know” 0' card) */
export const RuleCard: React.FC<{x: number; y: number; w: number; h: number; flip: number; valueT: number; pulse?: number; wobble?: number}> = ({x, y, w, h, flip, valueT, pulse = 0, wobble = 0}) => {
  const f = Math.min(1, Math.max(0, flip));
  const sx = Math.abs(Math.cos(Math.PI * f)) * (1 + Math.max(0, flip - 1) * 0.5);
  const face = f > 0.5;
  const win = {w: 96, h: 84};
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${wobble}deg) scale(${Math.max(0.02, sx) * (1 + 0.05 * pulse)}, ${1 + 0.05 * pulse})`, transformOrigin: '50% 50%'}}>
      {face ? (
        <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: C.cream, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `6px 8px 0 rgba(22,42,50,0.2)`, boxSizing: 'border-box'}}>
          <div style={{position: 'absolute', left: 20, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 37, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1}}>
            “I don’t know”
          </div>
          <div style={{position: 'absolute', right: 16, top: (h - win.h) / 2 - OUTLINE - 1, width: win.w, height: win.h, borderRadius: 12, background: NAVY_DEEP, border: `3px solid ${C.ink}`, overflow: 'hidden', boxSizing: 'border-box'}}>
            {valueT > 0 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: (valueT - 1) * win.h, height: win.h - 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 56, color: C.white, lineHeight: 1}}>0</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: C.blue, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `6px 8px 0 rgba(22,42,50,0.2)`, overflow: 'hidden'}}>
          {Array.from({length: 9}).map((_, k) => (
            <div key={k} style={{position: 'absolute', left: -60 + k * 64, top: -30, width: 22, height: 220, background: C.blueDeep, opacity: 0.45, transform: 'rotate(28deg)'}} />
          ))}
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 66, color: C.cream, lineHeight: 1}}>?</div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ leaderboard (illustration) */
export const BOARD_ROW = {top: 56, pitch: 64, h: 52, trackX: 112, rankW: 80, plateRight: 196};
export type BoardRow = {label: string; fill: number; tone: string; slot: number; dx: number; barT: number; sag: number; grey: number; jolt: number; z: number; scale: number};
export const Leaderboard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rows: BoardRow[];
  ranks: number[]; // 0..1(+) pop per slot
  pays: number; // "guessing pays" chip pop
  barGlow: number; // 0..1 position of a travelling glow along slot 0's bar (the pulse)
  barGlowOn: number;
  dim: number;
}> = ({x, y, w, h, rows, ranks, pays, barGlow, barGlowOn, dim}) => {
  const trackW = w - BOARD_ROW.trackX - 24;
  const dimF = `saturate(${1 - 0.65 * dim})`;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 20, background: C.cream, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `8px 10px 0 rgba(22,42,50,0.2)`}} />
      {/* sign plate, straddling the top edge; the left part of the edge is free for the coral line, the right end for the trophy */}
      <div style={{position: 'absolute', right: BOARD_ROW.plateRight, top: -30, background: C.saffron, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 14, padding: '8px 30px 6px', fontFamily: F.display, fontWeight: 700, fontSize: 44, letterSpacing: '0.04em', color: C.ink, lineHeight: 1.05, whiteSpace: 'nowrap', boxShadow: `5px 5px 0 ${C.ink}`}}>LEADERBOARD</div>
      {/* rank badges, fixed per slot; they stamp in after the sort */}
      {ranks.map((t, s) =>
        t > 0 ? (
          <div key={s} style={{position: 'absolute', left: 18, top: BOARD_ROW.top + s * BOARD_ROW.pitch, width: BOARD_ROW.rankW, height: BOARD_ROW.h, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: s === 0 ? C.saffron : C.paperDeep, border: `${OUTLINE}px solid ${C.ink}`, fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.ink, lineHeight: 1, transform: `scale(${t})`, boxSizing: 'border-box'}}>
            #{s + 1}
          </div>
        ) : null,
      )}
      {/* rows: track + fill + label (printed inside the track) */}
      {[...rows].sort((a, b) => a.z - b.z).map((r) => (
        <div
          key={r.label}
          style={{
            position: 'absolute',
            left: BOARD_ROW.trackX + r.dx,
            top: BOARD_ROW.top + r.slot * BOARD_ROW.pitch + r.jolt,
            width: trackW,
            height: BOARD_ROW.h,
            transform: `rotate(${r.sag}deg) scale(${r.scale})`,
            transformOrigin: '0% 50%',
          }}
        >
          <div style={{position: 'absolute', inset: 0, borderRadius: BOARD_ROW.h / 2, background: C.paperDeep, border: `${OUTLINE}px solid ${C.ink}`, overflow: 'hidden', boxSizing: 'border-box'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.fill * 100 * r.barT}%`, background: r.tone, boxShadow: 'inset -5px 0 0 rgba(22,42,50,0.22)', filter: dimF, opacity: 1 - 0.35 * dim}} />
            {barGlowOn > 0 && r.slot === 0 && (
              <div style={{position: 'absolute', top: 0, bottom: 0, left: `${barGlow * r.fill * 100 - 12}%`, width: '12%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,250,220,0.9), rgba(255,255,255,0))', opacity: barGlowOn}} />
            )}
          </div>
          <div style={{position: 'absolute', left: 22, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 44, color: r.grey > 0 ? `rgba(22,42,50,${1 - 0.3 * r.grey})` : C.ink, whiteSpace: 'nowrap', lineHeight: 1}}>{r.label}</div>
        </div>
      ))}
      {/* footer: the board's own guard rail, printed from its first frame; "guessing pays" pops in later */}
      <div style={{position: 'absolute', right: 24, bottom: 14, display: 'inline-flex', alignItems: 'center', padding: '7px 20px', borderRadius: 999, background: C.cream, border: `3px dashed ${C.inkMuted}`, fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.inkSoft, lineHeight: 1, whiteSpace: 'nowrap'}}>illustration</div>
      {pays > 0 && (
        <div style={{position: 'absolute', left: BOARD_ROW.trackX, bottom: 11, transform: `scale(${pays}) rotate(-2deg)`, transformOrigin: '20% 60%', filter: dimF, opacity: 1 - 0.35 * dim}}>
          <div style={{display: 'inline-flex', alignItems: 'center', padding: '7px 24px', borderRadius: 999, background: C.coral, border: `3px solid ${C.coralDeep}`, fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.white, lineHeight: 1, whiteSpace: 'nowrap'}}>guessing pays</div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ the trophy (S6's, without its walking feet) */
export const TrophyS7: React.FC<{sx?: number; sy?: number; rot?: number; glint?: number; scale?: number}> = ({sx = 1, sy = 1, rot = 0, glint = 0, scale = 1}) => {
  const s = scale;
  return (
    <svg viewBox="-80 -150 160 190" width={160 * s} height={190 * s} style={{position: 'absolute', left: -80 * s, top: -150 * s, overflow: 'visible'}}>
      <defs>
        <clipPath id="s7cup">
          <path d="M -46 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q -30 -36 -38 -62 Z" />
        </clipPath>
      </defs>
      <g transform={`rotate(${rot} 0 0) scale(${sx} ${sy})`}>
        <rect x={-40} y={-4} width={80} height={16} rx={5} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-22} y={-30} width={44} height={28} rx={4} fill={C.saffronDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        <path d="M -46 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q -30 -36 -38 -62 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <path d="M -46 -104 Q -78 -100 -62 -68 Q -54 -56 -40 -60" fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} strokeLinecap="round" />
        <path d="M -46 -104 Q -78 -100 -62 -68 Q -54 -56 -40 -60" fill="none" stroke={C.saffron} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
        <path d="M 46 -104 Q 78 -100 62 -68 Q 54 -56 40 -60" fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} strokeLinecap="round" />
        <path d="M 46 -104 Q 78 -100 62 -68 Q 54 -56 40 -60" fill="none" stroke={C.saffron} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
        <path d="M -34 -112 L -28 -70" stroke={C.saffronLight} strokeWidth={6} strokeLinecap="round" />
        <text x={0} y={-74} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={30} fill={C.ink}>1</text>
        {glint > 0 && glint < 1 && (
          <path d={`M ${-50 + glint * 110} -122 L ${-36 + glint * 110} -122 L ${-58 + glint * 110} -36 L ${-72 + glint * 110} -36 Z`} fill={C.white} opacity={0.8} clipPath="url(#s7cup)" />
        )}
      </g>
    </svg>
  );
};

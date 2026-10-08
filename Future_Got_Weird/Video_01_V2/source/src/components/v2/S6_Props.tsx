import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {RollingNumber} from './RollingNumber';

/**
 * S6 (game show) props. Pure, state-driven drawings: the scene computes every number from its cue constants.
 * World coordinates are px in the 1920×1080 subject plane (camera depth 1).
 */

export const NAVY = '#2E3F5C';
export const NAVY_DEEP = '#1F2B40';
export const GOLD = '#FFB703';

/* ------------------------------------------------------------------ rules board (hangs from the flies) */
export const BOARD = {x: 275, y: 32, w: 1370, h: 248};
export const CARD = {y: 138, h: 120, xs: [297, 675, 1073], ws: [360, 380, 550]}; // Wrong has room between its label and value
/** World centre of a rule card (board at rest). */
export const cardCentre = (i: number) => ({x: CARD.xs[i] + CARD.ws[i] / 2, y: CARD.y + CARD.h / 2});
export const VALUE = {w: 104, h: 90, pad: 15};
/** World centre of a card's value window (board at rest). */
export const valueCentre = (i: number) => ({x: CARD.xs[i] + CARD.ws[i] - VALUE.pad - VALUE.w / 2, y: CARD.y + CARD.h / 2});

export type RuleCardState = {
  flip: number; // 0 = card back, 1 = face (may overshoot)
  value: string | null;
  valueT: number; // 0..1 the value flap has dropped in (ease with overshoot)
  pulse: number; // 0..1 bounce
  minus: number; // >0: the −1 tile is stuck over the value
  coral: number; // 0..1 border turns coral
  sx?: number;
  sy?: number;
  tilt?: number;
  wobble?: number;
};

const GLYPH = ['✓', '✕', '?'];
const LABEL = ['Right', 'Wrong', '“I don’t know”'];
const GLYPH_COL = [C.tealDeep, C.coralDeep, C.inkSoft];

const RuleCardV2: React.FC<{i: number; s: RuleCardState}> = ({i, s}) => {
  const w = CARD.ws[i];
  const ang = 180 * s.flip;
  const front = ang > 90;
  const rot = front ? ang - 180 : ang;
  const border = s.coral > 0.5 ? C.coral : C.ink;
  return (
    <div style={{position: 'absolute', left: CARD.xs[i] - BOARD.x, top: CARD.y - BOARD.y, width: w, height: CARD.h, perspective: 1100}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${(s.tilt ?? 0) + (s.wobble ?? 0)}deg) rotateY(${rot}deg) scale(${(s.sx ?? 1) * (1 + 0.07 * s.pulse)}, ${(s.sy ?? 1) * (1 + 0.07 * s.pulse)})`,
          transformOrigin: '50% 0%',
        }}
      >
        {front ? (
          <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: C.cream, border: `${OUTLINE + 1}px solid ${border}`, boxShadow: `5px 7px 0 rgba(0,0,0,0.25)`, display: 'flex', alignItems: 'center', padding: '0 0 0 20px', gap: 14, boxSizing: 'border-box'}}>
            <div style={{fontFamily: F.display, fontSize: 52, fontWeight: 700, color: GLYPH_COL[i], width: 46, textAlign: 'center', lineHeight: 1}}>{GLYPH[i]}</div>
            <div style={{fontFamily: F.body, fontSize: 44, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1}}>{LABEL[i]}</div>
            {/* the value window: a dark slot the value flap drops into */}
            <div style={{position: 'absolute', right: VALUE.pad, top: (CARD.h - VALUE.h) / 2 - OUTLINE - 1, width: VALUE.w, height: VALUE.h, borderRadius: 12, background: NAVY_DEEP, border: `3px solid ${C.ink}`, overflow: 'hidden', boxSizing: 'border-box'}}>
              {s.value !== null && s.valueT > 0 && (
                <div style={{position: 'absolute', left: 0, right: 0, top: (s.valueT - 1) * VALUE.h, height: VALUE.h - 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 58, color: i === 0 ? C.tealLight : C.white, lineHeight: 1}}>
                  {s.value}
                </div>
              )}
              {s.minus > 0 && (
                <div style={{position: 'absolute', inset: 0, background: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 56, color: C.white, lineHeight: 1}}>−1</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: C.blue, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `5px 7px 0 rgba(0,0,0,0.25)`, overflow: 'hidden'}}>
            {Array.from({length: 9}).map((_, k) => (
              <div key={k} style={{position: 'absolute', left: -60 + k * 64, top: -20, width: 22, height: 200, background: C.blueDeep, opacity: 0.45, transform: 'rotate(28deg)'}} />
            ))}
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 70, color: C.cream, lineHeight: 1}}>?</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const RulesBoard: React.FC<{dy: number; swing: number; jolt: number; cards: RuleCardState[]}> = ({dy, swing, jolt, cards}) => (
  <div style={{position: 'absolute', left: BOARD.x, top: BOARD.y + dy + jolt, width: BOARD.w, height: BOARD.h, transform: `rotate(${swing}deg)`, transformOrigin: `50% -400px`}}>
    {/* cables to the flies */}
    <div style={{position: 'absolute', left: 60, top: -1400, width: 5, height: 1404, background: C.ink}} />
    <div style={{position: 'absolute', right: 60, top: -1400, width: 5, height: 1404, background: C.ink}} />
    <div style={{position: 'absolute', inset: 0, borderRadius: 22, background: NAVY, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `10px 12px 0 rgba(22,42,50,0.22)`}} />
    {/* bulbs along the top edge */}
    {Array.from({length: 22}).map((_, k) => (
      <div key={k} style={{position: 'absolute', left: 30 + k * 57.5, top: 12, width: 12, height: 12, borderRadius: 6, background: C.saffronLight, border: `2px solid ${C.ink}`}} />
    ))}
    <div style={{position: 'absolute', left: 0, right: 0, top: 28, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: C.saffron, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 14, padding: '10px 40px 8px', fontFamily: F.display, fontWeight: 700, fontSize: 48, letterSpacing: '0.04em', color: C.ink, lineHeight: 1.05, whiteSpace: 'nowrap', boxShadow: `5px 5px 0 ${C.ink}`}}>HOW MODELS GET GRADED</div>
    </div>
    {cards.map((s, i) => (
      <RuleCardV2 key={i} i={i} s={s} />
    ))}
  </div>
);

/** A label hanging on two strings from the flies (citation, guard rail). Centred on cx; `top` is its resting top. */
export const HangingTag: React.FC<{cx: number; top: number; dy: number; swing: number; children: React.ReactNode; size: number; tone?: 'cream' | 'ink'}> = ({cx, top, dy, swing, children, size, tone = 'cream'}) => (
  <div style={{position: 'absolute', left: cx - 1000, top: top + dy, width: 2000, display: 'flex', justifyContent: 'center', transform: `rotate(${swing}deg)`, transformOrigin: `50% -300px`}}>
    <div style={{position: 'relative', background: tone === 'cream' ? C.cream : C.ink, color: tone === 'cream' ? C.inkSoft : C.paper, border: `3px solid ${C.ink}`, borderRadius: 999, padding: `${size * 0.3}px ${size * 0.85}px`, fontFamily: F.body, fontWeight: 800, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', boxShadow: `4px 5px 0 rgba(22,42,50,0.2)`}}>
      <div style={{position: 'absolute', left: 46, top: -800, width: 3, height: 800, background: C.ink, opacity: 0.85}} />
      <div style={{position: 'absolute', right: 46, top: -800, width: 3, height: 800, background: C.ink, opacity: 0.85}} />
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------------ answer panels (one per contestant, hang at the sides) */
export const PANEL = {w: 200, top: 318, slot: 78, gap: 10, pad: 14, head: 40};
export const PANEL_H = PANEL.pad + PANEL.head + 8 + 5 * PANEL.slot + 4 * PANEL.gap + PANEL.pad;
export const PANEL_X = [250, 1670];
/** World centre of slot k (0..9, row-major 2 × 5) on panel side (0 honest, 1 guesser), panel at rest. */
export const slotCentre = (side: number, k: number) => ({
  x: PANEL_X[side] - (PANEL.slot + PANEL.gap) / 2 + (k % 2) * (PANEL.slot + PANEL.gap),
  y: PANEL.top + PANEL.pad + PANEL.head + 8 + Math.floor(k / 2) * (PANEL.slot + PANEL.gap) + PANEL.slot / 2,
});

export type SlotKind = 'off' | 'num' | 'ask' | 'known' | 'blank' | 'reel' | 'wrong' | 'lucky';
export type SlotState = {kind: SlotKind; t: number; reel?: number; speed?: number; letter?: string; glow?: number; shake?: number; zero?: number; lift?: number; spark?: number; flash?: number; flashTone?: string};

const LETTERS = ['A', 'B', 'C', 'D'];

const Slot: React.FC<{k: number; s: SlotState}> = ({k, s}) => {
  const S = PANEL.slot;
  const pop = 1 + 0.16 * (1 - Math.min(1, s.t)) * (s.t > 0 ? 1 : 0);
  const look: Record<SlotKind, {bg: string; bd: string; fg: string; glyph: string; bw: number}> = {
    off: {bg: '#1A2738', bd: C.ink, fg: C.inkMuted, glyph: '', bw: 3},
    num: {bg: '#24364D', bd: C.ink, fg: C.paperLine, glyph: String(k + 1), bw: 3},
    ask: {bg: C.saffron, bd: C.ink, fg: C.ink, glyph: '?', bw: 3},
    known: {bg: C.tealLight, bd: C.teal, fg: C.tealDeep, glyph: '✓', bw: 5},
    blank: {bg: C.cream, bd: C.inkMuted, fg: C.inkMuted, glyph: '—', bw: 5},
    reel: {bg: C.saffronLight, bd: C.saffronDeep, fg: C.ink, glyph: '', bw: 5},
    wrong: {bg: C.coral, bd: C.coralDeep, fg: C.white, glyph: '✕', bw: 5},
    lucky: {bg: C.tealLight, bd: GOLD, fg: C.tealDeep, glyph: '✓', bw: 7},
  };
  const L = look[s.kind];
  const sh = s.shake ?? 0;
  const p = s.reel ?? 0;
  const i0 = ((Math.floor(p) % 4) + 4) % 4;
  const fr = p - Math.floor(p);
  const blur = Math.min(5, (s.speed ?? 0) * 6);
  return (
    <div style={{position: 'relative', width: S, height: S, transform: `translate(${sh}px, ${-(s.lift ?? 0)}px) scale(${pop})`}}>
      {(s.glow ?? 0) > 0 && <div style={{position: 'absolute', inset: -14, borderRadius: 22, background: s.kind === 'lucky' ? GOLD : C.saffron, opacity: 0.55 * (s.glow ?? 0), filter: 'blur(8px)'}} />}
      <div style={{position: 'absolute', inset: 0, borderRadius: 13, background: L.bg, border: `${L.bw}px solid ${L.bd}`, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {s.kind === 'reel' ? (
          <div style={{position: 'absolute', inset: 0, filter: blur > 0.4 ? `blur(${blur}px)` : undefined}}>
            {[0, 1].map((j) => (
              <div key={j} style={{position: 'absolute', left: 0, right: 0, top: (j - fr) * S - 5, height: S, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 48, color: C.ink, lineHeight: 1}}>
                {LETTERS[(i0 + j) % 4]}
              </div>
            ))}
          </div>
        ) : (
          <div style={{fontFamily: s.kind === 'num' ? F.mono : F.display, fontWeight: 700, fontSize: s.kind === 'num' ? 34 : 50, color: L.fg, lineHeight: 1, marginTop: s.kind === 'blank' ? -4 : 0}}>{(s.zero ?? 0) > 0.5 ? '0' : L.glyph}</div>
        )}
        {(s.kind === 'wrong' || s.kind === 'lucky') && s.letter && (
          <div style={{position: 'absolute', left: 6, top: 3, fontFamily: F.mono, fontWeight: 700, fontSize: 18, color: s.kind === 'wrong' ? C.coralLight : C.tealDeep, lineHeight: 1}}>{s.letter}</div>
        )}
        {(s.flash ?? 0) > 0 && <div style={{position: 'absolute', inset: 0, background: s.flashTone ?? C.white, opacity: 0.75 * (s.flash ?? 0)}} />}
      </div>
      {(s.spark ?? 0) > 0 && <Sparkle t={s.spark ?? 0} size={S} />}
    </div>
  );
};

const Sparkle: React.FC<{t: number; size: number}> = ({t, size}) => (
  <svg width={size * 2} height={size * 2} viewBox="-1 -1 2 2" style={{position: 'absolute', left: -size / 2, top: -size / 2, overflow: 'visible', pointerEvents: 'none'}}>
    {[0, 1, 2, 3].map((k) => {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      const r = 0.55 + 0.35 * t;
      const s = Math.sin(Math.min(1, t) * Math.PI) * 0.16;
      return <path key={k} transform={`translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${s})`} d="M 0 -1 Q 0.15 -0.15 1 0 Q 0.15 0.15 0 1 Q -0.15 0.15 -1 0 Q -0.15 -0.15 0 -1 Z" fill={C.cream} stroke={C.ink} strokeWidth={0.18} />;
    })}
  </svg>
);

export const AnswerPanel: React.FC<{side: number; dy: number; swing: number; tone: string; slots: SlotState[]; bulbs: number; lit: number}> = ({side, dy, swing, tone, slots, bulbs, lit}) => {
  const left = PANEL_X[side] - PANEL.w / 2;
  return (
    <div style={{position: 'absolute', left, top: PANEL.top + dy, width: PANEL.w, height: PANEL_H, transform: `rotate(${swing}deg)`, transformOrigin: '50% -500px'}}>
      <div style={{position: 'absolute', left: 30, top: -1400, width: 4, height: 1402, background: C.ink}} />
      <div style={{position: 'absolute', right: 30, top: -1400, width: 4, height: 1402, background: C.ink}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 20, background: NAVY, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `8px 10px 0 rgba(22,42,50,0.2)`}} />
      {/* header strip lights up in the owner's colour */}
      <div style={{position: 'absolute', left: PANEL.pad, right: PANEL.pad, top: PANEL.pad, height: PANEL.head, borderRadius: 10, background: tone, border: `3px solid ${C.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-evenly'}}>
        {Array.from({length: 6}).map((_, k) => {
          const on = lit > 0 && ((k + Math.floor(bulbs)) % 3 === 0);
          return <div key={k} style={{width: 13, height: 13, borderRadius: 7, background: on ? C.cream : 'rgba(255,251,240,0.35)', border: `2px solid ${C.ink}`}} />;
        })}
      </div>
      <div style={{position: 'absolute', left: PANEL.pad, top: PANEL.pad + PANEL.head + 8, display: 'grid', gridTemplateColumns: `repeat(2, ${PANEL.slot}px)`, gap: PANEL.gap, padding: `0 ${(PANEL.w - PANEL.pad * 2 - 2 * PANEL.slot - PANEL.gap) / 2}px`}}>
        {slots.map((s, k) => (
          <Slot key={k} k={k} s={s} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ podium */
export const POD = {lidY: 728, lidH: 22, lidW: 384, frontTop: 750, bottom: 962, wTop: 344, wBot: 370};

export const Podium: React.FC<{
  x: number;
  name: string;
  color: string;
  deep: string;
  score: number;
  scoreBg: string;
  rim: number;
  rimColor: string;
  scorePop: number;
  buzzerX: number; // world x of the buzzer centre
  buzzerColor: string;
  press: number; // 0..1 dome pushed down
  light: number; // 0..1 dome lit
  bulbs: number;
  bulbsOn: number;
  wheel: number; // caster rotation, deg
  shudder: number; // px
  scoreOn: number; // 0..1 the score window lights up
}> = (p) => {
  const {x, name, color, deep} = p;
  const w = POD.lidW;
  const h = POD.bottom - POD.lidY;
  const bx = p.buzzerX - x;
  const domeH = 24 * (1 - 0.55 * p.press);
  return (
    <div style={{position: 'absolute', left: x - w / 2 + p.shudder, top: POD.lidY - 40, width: w, height: h + 70}}>
      <svg width={w} height={h + 70} viewBox={`${-w / 2} -40 ${w} ${h + 70}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* casters */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * (POD.wBot / 2 - 40)} ${h + 8})`}>
            <circle r={13} fill={C.ink} />
            <line x1={0} y1={0} x2={Math.cos((p.wheel * Math.PI) / 180) * 9} y2={Math.sin((p.wheel * Math.PI) / 180) * 9} stroke={C.inkMuted} strokeWidth={3} />
          </g>
        ))}
        {/* front panel */}
        <path d={`M ${-POD.wTop / 2} ${POD.frontTop - POD.lidY} L ${POD.wTop / 2} ${POD.frontTop - POD.lidY} L ${POD.wBot / 2} ${h} L ${-POD.wBot / 2} ${h} Z`} fill={color} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinejoin="round" />
        <path d={`M ${-POD.wTop / 2 + 18} ${POD.frontTop - POD.lidY + 4} L ${-POD.wBot / 2 + 20} ${h - 4}`} stroke={deep} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        <path d={`M ${POD.wTop / 2 - 18} ${POD.frontTop - POD.lidY + 4} L ${POD.wBot / 2 - 20} ${h - 4}`} stroke={deep} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        {/* marquee bulbs under the lid */}
        {Array.from({length: 11}).map((_, k) => {
          const on = p.bulbsOn > 0 && (k + Math.floor(p.bulbs)) % 3 === 0;
          return <circle key={k} cx={-150 + k * 30} cy={POD.frontTop - POD.lidY + 14} r={6} fill={on ? C.cream : C.saffronLight} opacity={on ? 1 : 0.55} stroke={C.ink} strokeWidth={2} />;
        })}
        {/* lid */}
        <rect x={-w / 2} y={0} width={w} height={POD.lidH} rx={8} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE + 1} />
        <rect x={-w / 2 + 10} y={4} width={w - 20} height={5} rx={2} fill={C.cream} opacity={0.6} />
        {/* buzzer on the lid */}
        <g transform={`translate(${bx} 0)`}>
          {p.light > 0 && <ellipse cx={0} cy={-14} rx={46} ry={30} fill={p.buzzerColor} opacity={0.35 * p.light} />}
          <path d={`M -30 0 L -30 ${-domeH * 0.35} Q -30 ${-domeH - 6} 0 ${-domeH - 6} Q 30 ${-domeH - 6} 30 ${-domeH * 0.35} L 30 0 Z`} fill={p.buzzerColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
          <path d={`M -16 ${-domeH * 0.55} Q -10 ${-domeH} 4 ${-domeH - 2}`} stroke={C.cream} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.75 + 0.25 * p.light} />
          <rect x={-40} y={-4} width={80} height={10} rx={4} fill={C.ink} />
        </g>
      </svg>
      {/* score window */}
      <div style={{position: 'absolute', left: w / 2 - 70, top: 40 + (POD.frontTop - POD.lidY) + 26, width: 140, height: 120, transform: `scale(${1 + 0.09 * p.scorePop})`, transformOrigin: '50% 60%'}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 18, background: C.ink, border: `${OUTLINE}px solid ${C.ink}`, boxShadow: p.rim > 0 ? `0 0 0 ${6 * p.rim}px ${p.rimColor}` : undefined}} />
        <div style={{position: 'absolute', left: 14, top: 8, right: 14, bottom: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 12, background: p.scoreBg, overflow: 'hidden'}}>
          <div style={{opacity: 0.25 + 0.75 * p.scoreOn}}>
            <RollingNumber from={0} to={p.score} t={1} size={92} color={C.white} bg="transparent" />
          </div>
        </div>
      </div>
      {/* nameplate */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 40 + (POD.frontTop - POD.lidY) + 150, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, padding: '4px 22px 2px', fontFamily: F.display, fontWeight: 700, fontSize: 46, letterSpacing: '0.05em', color: C.ink, lineHeight: 1.0}}>{name}</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ the trophy (comes alive at the end) */
export const TROPHY_S = 1.12;
/** Trophy-local apex of the lifting bridle (the cable hooks on here while it is lowered). */
export const TROPHY_APEX = -176;
export const TrophyV2: React.FC<{feet: number; step: number; sweat: number; eyes: number; lookX: number; glint: number; sx?: number; sy?: number; rot?: number; bridle?: number}> = ({feet, step, sweat, eyes, lookX, glint, sx = 1, sy = 1, rot = 0, bridle = 0}) => {
  const s = TROPHY_S;
  const lift = (k: number) => Math.max(0, Math.sin(step + k * Math.PI)) * 9;
  return (
    <svg viewBox="-80 -150 160 190" width={160 * s} height={190 * s} style={{position: 'absolute', left: -80 * s, top: -150 * s, overflow: 'visible'}}>
      <g transform={`rotate(${rot} 0 0) scale(${sx} ${sy})`}>
        {/* the lifting bridle: two short lines from the handles to the cable's hook */}
        {bridle > 0 && (
          <g opacity={bridle}>
            <path d={`M -60 -100 L 0 ${TROPHY_APEX} L 60 -100`} fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
            <circle cx={0} cy={TROPHY_APEX} r={6} fill={C.inkSoft} stroke={C.ink} strokeWidth={3} />
          </g>
        )}
        {feet > 0 && (
          <g>
            {[-1, 1].map((k) => (
              <g key={k} transform={`translate(${k * 18} ${8 - lift(k === -1 ? 0 : 1)}) scale(${feet})`}>
                <line x1={0} y1={-6} x2={0} y2={10} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
                <ellipse cx={k * 5} cy={13} rx={15} ry={7} fill={C.ink} />
              </g>
            ))}
          </g>
        )}
        <rect x={-40} y={-4} width={80} height={16} rx={5} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-22} y={-30} width={44} height={28} rx={4} fill={C.saffronDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        <path d="M -46 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q -30 -36 -38 -62 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <path d="M -46 -104 Q -78 -100 -62 -68 Q -54 -56 -40 -60" fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} strokeLinecap="round" />
        <path d="M -46 -104 Q -78 -100 -62 -68 Q -54 -56 -40 -60" fill="none" stroke={C.saffron} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
        <path d="M 46 -104 Q 78 -100 62 -68 Q 54 -56 40 -60" fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} strokeLinecap="round" />
        <path d="M 46 -104 Q 78 -100 62 -68 Q 54 -56 40 -60" fill="none" stroke={C.saffron} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
        <path d="M 18 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q 22 -44 26 -70 Z" fill={C.saffronDeep} opacity={0.75} />
        <path d="M -46 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q -30 -36 -38 -62 Z" fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <path d="M -34 -112 L -28 -70" stroke={C.cream} strokeWidth={7} strokeLinecap="round" />
        <path d="M -22 -112 L -19 -96" stroke={C.cream} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        {eyes > 0 ? (
          <g transform={`translate(0 -84) scale(${eyes})`}>
            {[-1, 1].map((k) => (
              <g key={k}>
                <ellipse cx={k * 14} cy={0} rx={11} ry={13} fill={C.white} stroke={C.ink} strokeWidth={3} />
                <circle cx={k * 14 + lookX * 5} cy={1} r={5.5} fill={C.ink} />
              </g>
            ))}
          </g>
        ) : (
          <text x={0} y={-74} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={30} fill={C.ink}>1</text>
        )}
        {glint > 0 && glint < 1 && (
          <path d={`M ${-50 + glint * 100} -122 L ${-38 + glint * 100} -122 L ${-60 + glint * 100} -40 L ${-72 + glint * 100} -40 Z`} fill={C.white} opacity={0.75} clipPath="url(#cupClip)" />
        )}
        <defs>
          <clipPath id="cupClip">
            <path d="M -46 -120 L 46 -120 L 38 -62 Q 30 -36 0 -34 Q -30 -36 -38 -62 Z" />
          </clipPath>
        </defs>
        {sweat > 0 && (
          <g transform={`translate(54 -118) scale(${sweat})`}>
            <path d="M 0 -14 Q 9 2 0 8 Q -9 2 0 -14 Z" fill={C.blueLight} stroke={C.ink} strokeWidth={2.5} />
          </g>
        )}
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ host props */
/** The host's blue cue cards (hand-local, drawn at the hand). `fan` spreads ten numbered cards; `flip` flicks the top card over. */
export const CueCards: React.FC<{fan: number; flip: number; tilt?: number}> = ({fan, flip, tilt = 0}) => {
  const cw = 72;
  const ch = 100;
  const card = (k: number, extra?: React.CSSProperties) => (
    <rect key={k} x={-cw / 2} y={-ch + 14} width={cw} height={ch} rx={7} fill={C.blue} stroke={C.ink} strokeWidth={3.5} style={extra} />
  );
  if (fan > 0.01) {
    return (
      <g transform={`rotate(${tilt}) scale(${1 + 0.18 * fan})`}>
        {Array.from({length: 10}).map((_, k) => {
          const a = fan * (-84 + k * 16.5);
          return (
            <g key={k} transform={`rotate(${a} 0 10)`}>
              <rect x={-cw / 2} y={-ch + 14} width={cw} height={ch} rx={8} fill={k % 2 ? C.blue : '#5B88D2'} stroke={C.ink} strokeWidth={3.5} />
              <text x={-cw / 2 + 7} y={-ch + 50} textAnchor="start" fontFamily={F.display} fontWeight={700} fontSize={36} fill={C.cream} stroke={C.ink} strokeWidth={1.2}>{k + 1}</text>
            </g>
          );
        })}
      </g>
    );
  }
  const f = Math.max(0, Math.min(1, flip));
  const showTop = f > 0 && f < 1;
  return (
    <g transform={`rotate(${tilt})`}>
      {card(0, {transform: 'translate(4px, 4px)'})}
      {card(1)}
      <rect x={-cw / 2 + 9} y={-ch + 28} width={cw - 18} height={6} rx={3} fill={C.blueLight} />
      <rect x={-cw / 2 + 9} y={-ch + 42} width={cw - 26} height={6} rx={3} fill={C.blueLight} />
      <rect x={-cw / 2 + 9} y={-ch + 56} width={cw - 22} height={6} rx={3} fill={C.blueLight} />
      {showTop && (
        <g transform={`translate(0 ${-26 * Math.sin(f * Math.PI)}) rotate(${-24 * Math.sin(f * Math.PI)}) scale(1 ${Math.max(0.06, Math.abs(Math.cos(f * Math.PI)))})`}>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={7} fill={Math.cos(f * Math.PI) > 0 ? C.blue : C.blueLight} stroke={C.ink} strokeWidth={3.5} />
        </g>
      )}
    </g>
  );
};

/** The options card the host shows for "Four options each". World-sized; drawn at its centre. */
export const OPTION_W = 330;
export const OPTION_H = 170;
export const OptionCard: React.FC<{hi?: number}> = () => (
  <div style={{width: OPTION_W, height: OPTION_H, borderRadius: 20, background: C.cream, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `6px 8px 0 rgba(22,42,50,0.25)`, boxSizing: 'border-box', padding: '14px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
    <div style={{display: 'flex', gap: 12}}>
      {LETTERS.map((l) => (
        <div key={l} style={{width: 62, height: 70, borderRadius: 12, background: C.saffronLight, border: `4px solid ${C.saffronDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 48, color: C.ink, lineHeight: 1}}>{l}</div>
      ))}
    </div>
    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 36, color: C.ink, lineHeight: 1}}>1 in 4 per guess</div>
  </div>
);

/** The coral “−1” tile the host throws at the Wrong card in s25 (matches the value window). */
export const MinusTile: React.FC = () => (
  <div style={{width: VALUE.w, height: VALUE.h, borderRadius: 12, background: C.coral, border: `4px solid ${C.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 56, color: C.white, lineHeight: 1, boxShadow: `4px 5px 0 rgba(22,42,50,0.25)`}}>−1</div>
);

/** A small flying score chip (+1 / −1). */
export const DeltaChip: React.FC<{text: string; tone: 'teal' | 'coral'}> = ({text, tone}) => (
  <div style={{padding: '6px 14px 4px', borderRadius: 14, background: tone === 'teal' ? C.teal : C.coral, border: `4px solid ${C.ink}`, fontFamily: F.mono, fontWeight: 700, fontSize: 46, color: C.white, lineHeight: 1, whiteSpace: 'nowrap'}}>{text}</div>
);

/* ------------------------------------------------------------------ confetti with gravity, drag and flutter */
export type Piece = {x: number; y: number; rot: number; col: string; w: number; h: number; landed: boolean};
const CONF_COLS = [C.coral, C.teal, C.saffron, C.blue, C.cream];
/** Deterministic burst fired at t0 from (x, y). dir in degrees (−90 = straight up). Pieces land on floor y in [floorA, floorB]. */
export const confettiPieces = (g: number, t0: number, x: number, y: number, n: number, seed: number, dir = -90, spread = 70, speed = 26, floorA = 968, floorB = 1004): Piece[] => {
  if (g < t0) return [];
  const out: Piece[] = [];
  const k = 0.085; // drag
  const term = 5.2; // terminal fall speed of paper, px per frame
  for (let i = 0; i < n; i++) {
    const r1 = rand(seed * 97 + i * 13);
    const r2 = rand(seed * 31 + i * 7);
    const r3 = rand(seed * 53 + i * 17);
    const a = ((dir + (r1 - 0.5) * spread) * Math.PI) / 180;
    const v = speed * (0.55 + 0.7 * r2);
    const vx = Math.cos(a) * v;
    const vy = Math.sin(a) * v;
    const fy = floorA + (floorB - floorA) * r3;
    const t = g - t0;
    const e = (1 - Math.exp(-k * t)) / k;
    let px = x + vx * e + Math.sin(t * (0.16 + 0.1 * r3) + i) * 16 * Math.min(1, t / 14);
    let py = y + term * t + (vy - term) * e;
    let landed = false;
    if (py >= fy && t > 6) {
      py = fy;
      landed = true;
      // freeze x where it landed (approximate: keep current)
      px = x + vx * e;
    }
    out.push({x: px, y: py, rot: landed ? (r1 * 180) % 180 : r1 * 360 + t * (9 + 10 * r2), col: CONF_COLS[i % CONF_COLS.length], w: 24, h: 13, landed});
  }
  return out;
};

export const ConfettiPieces: React.FC<{pieces: Piece[]; landed: boolean}> = ({pieces, landed}) => (
  <>
    {pieces
      .filter((p) => p.landed === landed)
      .map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: landed ? p.h * 0.55 : p.h, background: p.col, border: `2.5px solid ${C.ink}`, borderRadius: 3, transform: `rotate(${landed ? (p.rot % 30) - 15 : p.rot}deg) scaleY(${landed ? 1 : Math.cos((p.rot * Math.PI) / 90) * 0.7 + 0.3})`}} />
      ))}
  </>
);

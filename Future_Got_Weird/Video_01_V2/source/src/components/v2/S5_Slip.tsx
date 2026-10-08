import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {RingMark} from '../Props';
import {SLIPS} from './AnswerSlip';
import {S5_GLINT_BG} from './S5_Page';

/**
 * S5's copy of slip A (components/v2/AnswerSlip `AnswerSlipArt`, i = 0): the same card, gold inner edge, type, size
 * and line wrap, with three differences for this scene:
 *  - the card is 30 px taller, so the last title line ("Learning.”") is not clipped by the card edge in close-up;
 *  - the guard-rail detail line ("GPT-4o · 9 May 2025") is set at 24 px (30 world px at S5's scale 1.25), so it is
 *    ≥ 30 px on screen in every S5 framing, the zoom-1.0 wide included;
 *  - the fact-check marks S5 makes on it: a teal ring + tick on "CMU", a coral ring on "2002", a coral strike that
 *    reads along the invented title (one value per word), the final "2" of 2002 flashing coral (off by one), a
 *    glint band at any x (the same gold sheen the record gets), and a lift (shadow) value.
 * Local box S5_SLIP_W × S5_SLIP_H; position / rotate / scale it with a wrapper.
 */
export const S5_SLIP_W = 360;
export const S5_SLIP_H = 310;
export const S5_SLIP_FONT = 23;
export const S5_SLIP_LH = S5_SLIP_FONT * 1.26;
/** top of the first body line (local px): border 4 + padding 16 + model 27 + 4 + detail 28 + 7 */
export const S5_SLIP_BODY_TOP = 86;
/** left of the body text (local px): border 4 + padding 22 */
export const S5_SLIP_BODY_LEFT = 26;
export const S5_SLIP_SERIF = `400 ${S5_SLIP_FONT}px "Source Serif 4 Variable"`;
/** the invented title, word by word (it wraps over body lines 4–7) */
export const S5_TITLE_WORDS = ['“Boosting,', 'Online', 'Algorithms,', 'and', 'Other', 'Topics', 'in', 'Machine', 'Learning.”'];

export type S5SlipMarks = {
  uni?: number; // teal ring round "CMU"
  tick?: number; // teal tick beside it
  year?: number; // coral ring round "2002"
  digit?: {bump: number; on: number}; // the final "2": bump envelope 0..1, coral 0..1
  strike?: number[]; // coral strike per title word
  glintX?: number; // local x of a passing glint band (undefined = none)
  lift?: number; // 0..1 shadow lift
  halo?: number; // warm presentation glow (the 'just as solid' beat)
};

const Tick: React.FC<{t: number}> = ({t}) => (
  <svg viewBox="0 0 30 26" style={{position: 'absolute', left: 'calc(100% + 5px)', top: -21, width: 35, height: 30, overflow: 'visible'}}>
    <path d="M 3 14 L 11 22 L 27 3" fill="none" stroke={C.teal} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, t)} />
  </svg>
);

export const S5SlipArt: React.FC<{marks?: S5SlipMarks; children?: React.ReactNode}> = ({marks = {}, children}) => {
  const s = SLIPS[0];
  const strike = marks.strike ?? [];
  const lift = marks.lift ?? 0;
  const halo = marks.halo ?? 0;
  return (
    <div style={{position: 'relative', width: S5_SLIP_W, height: S5_SLIP_H}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.cream,
          border: `${OUTLINE}px solid ${C.ink}`,
          borderRadius: 10,
          boxShadow: `${8 + 8 * lift}px ${9.6 + 9.6 * lift}px 0 ${C.shadow}${halo > 0 ? `, 0 0 ${37 * halo}px ${8 * halo}px rgba(255,199,68,${0.62 * halo})` : ''}`,
          padding: '16px 22px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: 7, right: 7, top: 7, bottom: 7, border: `2px solid ${C.saffronDeep}`, borderRadius: 6, opacity: 0.75}} />
        {marks.glintX !== undefined && (
          <div style={{position: 'absolute', left: marks.glintX - 36, top: -60, width: 72, height: S5_SLIP_H + 120, background: S5_GLINT_BG, transform: 'rotate(18deg)', mixBlendMode: 'multiply'}} />
        )}
        <div style={{position: 'relative', fontFamily: F.display, fontWeight: 600, fontSize: 27, color: C.ink, lineHeight: 1}}>{s.model}</div>
        <div style={{position: 'relative', fontFamily: F.body, fontWeight: 800, fontSize: 24, lineHeight: '28px', color: C.inkMuted, marginTop: 4, marginBottom: 7}}>{s.detail}</div>
        <div style={{position: 'relative', fontFamily: F.serif, fontSize: S5_SLIP_FONT, lineHeight: 1.26, color: C.ink}}>
          {s.pre}
          <span style={{position: 'relative', whiteSpace: 'nowrap'}}>
            {s.year.slice(0, -1)}
            <span style={{display: 'inline-block', color: (marks.digit?.on ?? 0) > 0.5 ? C.coral : undefined, transform: `scale(${1 + 0.5 * (marks.digit?.bump ?? 0)})`, transformOrigin: '50% 65%'}}>{s.year.slice(-1)}</span>
            <RingMark t={marks.year ?? 0} tone="coral" padX={5} padY={4} width={4} />
          </span>
          {s.mid}
          <span style={{position: 'relative', whiteSpace: 'nowrap'}}>
            {s.uni}
            <RingMark t={marks.uni ?? 0} tone="teal" padX={5} padY={4} width={4} />
            {(marks.tick ?? 0) > 0 && <Tick t={marks.tick ?? 0} />}
          </span>
          {s.mid2}
          {S5_TITLE_WORDS.map((w, i) => (
            <React.Fragment key={i}>
              <span style={{position: 'relative', whiteSpace: 'nowrap'}}>
                {w}
                {(strike[i] ?? 0) > 0 && (
                  <span style={{position: 'absolute', left: -2, top: '54%', height: 4, width: `calc(${Math.min(1, strike[i]) * 100}% + 4px)`, background: C.coral, borderRadius: 2, transform: 'rotate(-1.2deg)', transformOrigin: '0% 50%'}} />
                )}
              </span>
              {i < S5_TITLE_WORDS.length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
};

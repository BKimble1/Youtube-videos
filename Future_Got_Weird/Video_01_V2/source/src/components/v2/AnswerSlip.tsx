import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {Marked, Span, StampMark} from '../Props';

/**
 * The answer slips from the cold open (Kalai et al. 2025, Table 1 excerpts, verbatim; ". . ." are the paper's
 * ellipses). One art for every scene that shows them, so hand-offs between scenes match exactly.
 * The card is SLIP_W × SLIP_H in its own local box; position / rotate / scale it with a wrapper.
 */
export const SLIPS = [
  {model: 'ChatGPT', detail: 'GPT-4o · 9 May 2025', pre: 'Adam Tauman Kalai’s Ph.D. dissertation (completed in ', year: '2002', mid: ' at ', uni: 'CMU', mid2: ') is entitled: ', title: '“Boosting, Online Algorithms, and Other Topics in Machine Learning.”', post: ''},
  {model: 'DeepSeek', detail: 'R1 · 9 May 2025', pre: '', title: '“Algebraic Methods in Interactive Machine Learning”', mid: ' . . . at Harvard University in ', year: '2005', uni: '', mid2: '', post: '.'},
  {model: 'Llama', detail: '4 Scout · 9 May 2025', pre: '', title: '“Efficient Algorithms for Learning and Playing Games”', mid: ' . . . in ', year: '2007', uni: '', mid2: '', post: ' at MIT.'},
];

export const SLIP_W = 360;
export const SLIP_H = 280;
/** Where a stamp prints on the card (local px): the stamp hand aims here. */
export const SLIP_STAMP_AT = {x: 232, y: 214};

/** Mark progress values 0..1 (all optional). title/year = highlighter sweeps, uni = saffron ring (slip A),
 *  ring = coral ring round the year, pulse = glow on the highlighted title, glint = a shine crossing the gold edge. */
export type SlipMarks = {title?: number; uni?: number; year?: number; ring?: number; pulse?: number; glint?: number};
export type SlipStamp = {text: string; tone?: 'coral' | 'teal' | 'ink'; size?: number; rotate?: number; x?: number; y?: number; scale?: number; sx?: number; sy?: number};

export const AnswerSlipArt: React.FC<{i: number; marks?: SlipMarks; stamps?: SlipStamp[]}> = ({i, marks = {}, stamps = []}) => {
  const s = SLIPS[i];
  const fs = i === 0 ? 23 : 25;
  const ringT = marks.ring ?? 0;
  const spans: Span[] =
    i === 0
      ? [
          {text: s.pre},
          ringT > 0 ? {text: s.year, mark: 'ring', markT: ringT, tone: 'coral'} : {text: s.year, mark: 'ink', markT: marks.year ?? 0},
          {text: s.mid},
          {text: s.uni, mark: 'ring', markT: marks.uni ?? 0, tone: 'saffron'},
          {text: s.mid2},
          {text: s.title, mark: 'ink', markT: marks.title ?? 0, pulse: marks.pulse},
        ]
      : [
          {text: s.title, mark: 'ink', markT: marks.title ?? 0, pulse: marks.pulse},
          {text: s.mid},
          {text: s.year, mark: 'ring', markT: ringT, tone: 'coral'},
          {text: s.post},
        ];
  const glint = marks.glint ?? 0;
  return (
    <div style={{position: 'relative', width: SLIP_W, height: SLIP_H}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.cream,
          border: `${OUTLINE}px solid ${C.ink}`,
          borderRadius: 10,
          boxShadow: `7px 9px 0 ${C.shadow}`,
          padding: '16px 22px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: 7, right: 7, top: 7, bottom: 7, border: `2px solid ${C.saffronDeep}`, borderRadius: 6, opacity: 0.75}} />
        {glint > 0 && glint < 1 && (
          <div style={{position: 'absolute', left: -120 + glint * (SLIP_W + 200), top: -40, width: 46, height: SLIP_H + 80, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,240,190,0.95), rgba(255,255,255,0))', transform: 'rotate(18deg)'}} />
        )}
        <div style={{position: 'relative', fontFamily: F.display, fontWeight: 600, fontSize: 27, color: C.ink, lineHeight: 1}}>{s.model}</div>
        <div style={{position: 'relative', fontFamily: F.body, fontWeight: 800, fontSize: 18, color: C.inkMuted, marginTop: 4, marginBottom: 6}}>{s.detail}</div>
        <div style={{position: 'relative', fontFamily: F.serif, fontSize: fs, lineHeight: 1.26, color: C.ink}}>
          <Marked spans={spans} />
        </div>
      </div>
      {stamps.map((st, k) => (
        <div key={k} style={{position: 'absolute', left: st.x ?? SLIP_STAMP_AT.x, top: st.y ?? SLIP_STAMP_AT.y, transform: `translate(-50%, -50%) scale(${(st.scale ?? 1) * (st.sx ?? 1)}, ${(st.scale ?? 1) * (st.sy ?? 1)})`}}>
          <StampMark text={st.text} tone={st.tone ?? 'coral'} t={1} size={st.size ?? 48} rotate={st.rotate ?? -11} />
        </div>
      ))}
    </div>
  );
};

/** A slip drawn in screen space by its centre, scale and rotation (for hand-offs between scenes). */
export const SlipOnScreen: React.FC<{i: number; cx: number; cy: number; scale: number; rot: number; marks?: SlipMarks; stamps?: SlipStamp[]; lift?: number}> = ({i, cx, cy, scale, rot, marks, stamps, lift = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: cx - SLIP_W / 2,
      top: cy - SLIP_H / 2,
      width: SLIP_W,
      height: SLIP_H,
      transform: `rotate(${rot}deg) scale(${scale})`,
      transformOrigin: '50% 50%',
      filter: lift > 0 ? `drop-shadow(0 ${24 * lift}px ${20 * lift}px rgba(22,42,50,${0.28 * lift}))` : undefined,
    }}
  >
    <AnswerSlipArt i={i} marks={marks} stamps={stamps} />
  </div>
);

/** Slip A exactly as it leaves the cold open: every mark made, WRONG stamped, the year ringed. */
export const SLIP_A_FINAL: {marks: SlipMarks; stamps: SlipStamp[]} = {
  marks: {title: 1, uni: 1, year: 1, ring: 1},
  stamps: [{text: 'Wrong'}],
};

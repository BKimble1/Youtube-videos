import React, {useLayoutEffect, useRef, useState} from 'react';
import {Img, continueRender, delayRender, staticFile} from 'remotion';
import {C, F, OUTLINE} from '../../theme';
import {useFontsReady} from '../../lib/measure';
import {DrawBox} from './DrawBox';
import {SLIPS, SLIP_H, SLIP_W} from './AnswerSlip';

/* ------------------------------------------------------------------ the real record (crop of the thesis title page) */
/** Crop of public/img/thesis_titlepage_top.png (4080 × 3894 source px): title, author, date, report number and the
 *  Carnegie Mellon address block. Shown as is (crop + scale only). */
export const REC_SRC = {w: 4080, h: 3894, x0: 694, y0: 350, cw: 2693, ch: 2040};
export const REC_IMG_W = 560;
const K_REC = REC_IMG_W / REC_SRC.cw;
export const REC_IMG_H = REC_SRC.ch * K_REC;
export const REC_PAD = 16;
export const REC_W = REC_IMG_W + REC_PAD * 2 + OUTLINE * 2;
export const REC_H = REC_IMG_H + REC_PAD * 2 + OUTLINE * 2;
/** image-area origin inside the card */
export const REC_IMG_OX = OUTLINE + REC_PAD;
export const REC_IMG_OY = OUTLINE + REC_PAD;

/** A rectangle given in source pixels → image-area px. */
const R = (x0: number, y0: number, x1: number, y1: number) => ({x: (x0 - REC_SRC.x0) * K_REC, y: (y0 - REC_SRC.y0) * K_REC, w: (x1 - x0) * K_REC, h: (y1 - y0) * K_REC});
/** Measured word boxes on the title page (source px, from the image itself). */
export const REC_BOX = {
  title1: R(775, 466, 3305, 588),
  titleWords: [R(775, 466, 1701, 588), R(1756, 466, 2025, 588), R(2078, 466, 2621, 588), R(2671, 466, 3305, 588)],
  name: R(1805, 1229, 2275, 1292),
  y2001: R(2115, 1343, 2288, 1404),
  cmu: R(1536, 2175, 2549, 2257),
};
/** How far each dimming hole reaches past its words (image px). The lines on this page sit only 6–11 px apart, so
 *  the holes are tight: a hole must never uncover part of a neighbouring line. */
const HOLE_PAD: Record<'name' | 'cmu' | 'title1' | 'y2001', {l: number; r: number; t: number; b: number}> = {
  name: {l: 10, r: 10, t: 4, b: 4},
  cmu: {l: 10, r: 10, t: 2.5, b: 2.5},
  title1: {l: 10, r: 10, t: 6, b: 11},
  y2001: {l: 4, r: 10, t: 4, b: 7},
};

export type RecMarks = {
  name?: number; // DrawBox loop round "Adam Kalai"
  cmu?: number; // DrawBox loop round "Carnegie Mellon University"
  sweep?: number; // teal highlighter across title line 1, in image px from its left edge (0 = none)
  y2001?: number; // teal highlighter across "2001" (0..1), the same mark as the title: "what it actually says"
  dim?: number; // dims everything except the active marks
  holes?: {k: 'name' | 'cmu' | 'title1' | 'y2001'; a: number}[];
  pulse?: number; // a glow on the drawn marks (the YES moment)
};

/** marksUnderDim: once a check is done its marks recede with the page (drawn under the dimming) so the next ones lead.
 *  The dimming covers the whole sheet (margins too), so a close-up inside the page never shows a bright margin band. */
export const RecordCard: React.FC<{marks?: RecMarks; marksUnderDim?: boolean}> = ({marks = {}, marksUnderDim = false}) => {
  const holes = (marks.holes ?? []).map((h) => ({...REC_BOX[h.k], p: HOLE_PAD[h.k], a: h.a}));
  const dim = marks.dim ?? 0;
  const t1 = REC_BOX.title1;
  const yb = REC_BOX.y2001;
  const sweepW = Math.max(0, Math.min(t1.w + 12, marks.sweep ?? 0));
  const yT = Math.max(0, Math.min(1, marks.y2001 ?? 0));
  const pulse = marks.pulse ?? 0;
  const firstMarks = (
    <>
      <DrawBox t={marks.name ?? 0} x={REC_BOX.name.x - 14} y={REC_BOX.name.y - 6} w={REC_BOX.name.w + 28} h={REC_BOX.name.h + 9} tone="teal" width={4} seed={2} round={9} />
      <DrawBox t={marks.cmu ?? 0} x={REC_BOX.cmu.x - 14} y={REC_BOX.cmu.y - 6} w={REC_BOX.cmu.w + 28} h={REC_BOX.cmu.h + 10} tone="teal" width={4} seed={5} round={9} />
    </>
  );
  const inner = {x: OUTLINE, y: OUTLINE, w: REC_W - OUTLINE * 2, h: REC_H - OUTLINE * 2};
  const imgBox: React.CSSProperties = {position: 'absolute', left: REC_IMG_OX, top: REC_IMG_OY, width: REC_IMG_W, height: REC_IMG_H, overflow: 'hidden'};
  return (
    <div style={{position: 'relative', width: REC_W, height: REC_H}}>
      <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8, boxShadow: `10px 12px 0 ${C.shadow}`}} />
      <div style={imgBox}>
        <Img src={staticFile('img/thesis_titlepage_top.png')} style={{position: 'absolute', left: -REC_SRC.x0 * K_REC, top: -REC_SRC.y0 * K_REC, width: REC_SRC.w * K_REC, height: REC_SRC.h * K_REC}} />
        {/* teal highlighter across the title line, then across the year (multiply, so the print stays crisp) */}
        {sweepW > 0 && <div style={{position: 'absolute', left: t1.x - 6, top: t1.y - 3, width: sweepW, height: t1.h + 8, background: 'rgba(28,167,160,0.32)', mixBlendMode: 'multiply', borderRadius: 4}} />}
        {sweepW > 0 && <div style={{position: 'absolute', left: t1.x - 6, top: t1.y + t1.h + 5, width: sweepW, height: 5, background: C.teal, borderRadius: 3}} />}
        {yT > 0 && <div style={{position: 'absolute', left: yb.x - 3, top: yb.y - 2.5, width: (yb.w + 6) * yT, height: yb.h + 5, background: 'rgba(28,167,160,0.34)', mixBlendMode: 'multiply', borderRadius: 3}} />}
        {yT > 0 && <div style={{position: 'absolute', left: yb.x - 3, top: yb.y + yb.h + 3, width: (yb.w + 6) * yT, height: 3, background: C.teal, borderRadius: 2}} />}
        {marksUnderDim && firstMarks}
      </div>
      {/* the rest of the sheet recedes */}
      {dim > 0 && (
        <svg width={inner.w} height={inner.h} style={{position: 'absolute', left: inner.x, top: inner.y}}>
          <defs>
            <mask id="s9-rec-dim">
              <rect width={inner.w} height={inner.h} fill="white" />
              {holes.map((b, i) => {
                const v = Math.round(255 * (1 - b.a));
                const ox = REC_IMG_OX - inner.x;
                const oy = REC_IMG_OY - inner.y;
                return <rect key={i} x={ox + b.x - b.p.l} y={oy + b.y - b.p.t} width={b.w + b.p.l + b.p.r} height={b.h + b.p.t + b.p.b} rx={4} fill={`rgb(${v},${v},${v})`} />;
              })}
            </mask>
          </defs>
          <rect width={inner.w} height={inner.h} rx={4} fill={`rgba(244,238,222,${0.72 * dim})`} mask="url(#s9-rec-dim)" />
        </svg>
      )}
      <div style={{...imgBox, pointerEvents: 'none'}}>
        {pulse > 0 && (
          <>
            {[REC_BOX.name, REC_BOX.cmu].map((b, i) => (
              <div key={i} style={{position: 'absolute', left: b.x - 14, top: b.y - 6, width: b.w + 28, height: b.h + 10, borderRadius: 10, boxShadow: `0 0 ${22 * pulse}px ${8 * pulse}px rgba(28,167,160,${0.45 * pulse})`}} />
            ))}
          </>
        )}
        {!marksUnderDim && firstMarks}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ the slip: a scan overlay that sits exactly on its words */
const S = SLIPS[0];
const PLAIN = S.pre + S.year + S.mid + S.uni + S.mid2 + S.title + S.post;
/** The ChatGPT slip's text split into words and spaces (joins back to exactly what AnswerSlipArt prints). */
export const SLIP_TOKENS: string[] = PLAIN.split(/( )/).filter((t) => t.length > 0);
export const tok = (word: string, occurrence = 1) => {
  let n = 0;
  for (let i = 0; i < SLIP_TOKENS.length; i++) if (SLIP_TOKENS[i] === word && ++n === occurrence) return i;
  throw new Error(`slip token ${word} not found`);
};
export type TokBox = {x: number; y: number; w: number; h: number};

/** The same box model as AnswerSlipArt (i = 0), with each word in its own span. Text is transparent unless lit. */
const SlipReplica: React.FC<{lit?: (k: number) => number; coral?: number; wash?: number; measure?: boolean}> = ({lit, coral = 0, wash = 0, measure}) => (
  <div style={{position: 'relative', width: SLIP_W, height: SLIP_H, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: 0, border: `${OUTLINE}px solid transparent`, borderRadius: 10, padding: '16px 22px', boxSizing: 'border-box', overflow: measure ? 'visible' : 'hidden'}}>
      {wash > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(255,251,240,${0.66 * wash})`}} />}
      <div style={{position: 'relative', fontFamily: F.display, fontWeight: 600, fontSize: 27, color: 'transparent', lineHeight: 1}}>{S.model}</div>
      <div style={{position: 'relative', fontFamily: F.body, fontWeight: 800, fontSize: 18, color: 'transparent', marginTop: 4, marginBottom: 6}}>{S.detail}</div>
      <div style={{position: 'relative', fontFamily: F.serif, fontSize: 23, lineHeight: 1.26, color: 'transparent'}}>
        <span>
          {SLIP_TOKENS.map((t, k) => {
            const v = lit ? lit(k) : 0;
            if (v <= 0 || t === ' ') return <span key={k} data-tok={k}>{t}</span>;
            const a = Math.min(1, v);
            const bg = `rgba(${Math.round(255 + (251 - 255) * coral)},${Math.round(214 + (190 - 214) * coral)},${Math.round(110 + (176 - 110) * coral)},${0.85 * a})`;
            const glow = coral > 0.5 ? `rgba(239,107,85,${0.55 * a})` : `rgba(255,199,68,${0.7 * a})`;
            return (
              <span key={k} data-tok={k} style={{color: `rgba(22,42,50,${a})`, background: bg, borderRadius: 4, padding: '0 4px', margin: '0 -4px', boxShadow: `0 0 ${12 * a}px ${3 * a}px ${glow}`}}>
                {t}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  </div>
);

/** Put this over the slip art (same box, same transform): lights words (lit(k) 0..1), optionally coral, and washes the
 *  rest of the card back (wash 0..1). Light only; nothing is printed on the slip. */
export const SlipScan: React.FC<{lit: (k: number) => number; coral?: number; wash?: number}> = (p) => <SlipReplica {...p} />;

/** Measures every slip token's box (slip-local px) once fonts are ready. Render `measurer` anywhere (it is invisible). */
export const useSlipTokenBoxes = () => {
  const ready = useFontsReady();
  const [boxes, setBoxes] = useState<TokBox[] | null>(null);
  const [handle] = useState(() => delayRender('S9: measuring the slip words'));
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ready || boxes || !ref.current) return;
    const root = ref.current.getBoundingClientRect();
    const out: TokBox[] = [];
    ref.current.querySelectorAll('[data-tok]').forEach((el) => {
      const r = el.getBoundingClientRect();
      out[Number((el as HTMLElement).dataset.tok)] = {x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height};
    });
    setBoxes(out);
    continueRender(handle);
  }, [ready, boxes, handle]);
  const measurer = (
    <div ref={ref} style={{position: 'absolute', left: -4000, top: 0, width: SLIP_W, height: SLIP_H, visibility: 'hidden'}}>
      <SlipReplica measure />
    </div>
  );
  return {boxes, measurer};
};

/** Union of several token boxes (slip-local). */
export const unionBox = (boxes: TokBox[] | null, ks: number[]): TokBox => {
  if (!boxes) return {x: 120, y: 120, w: 120, h: 28};
  const bs = ks.map((k) => boxes[k]).filter(Boolean);
  const x0 = Math.min(...bs.map((b) => b.x));
  const y0 = Math.min(...bs.map((b) => b.y));
  const x1 = Math.max(...bs.map((b) => b.x + b.w));
  const y1 = Math.max(...bs.map((b) => b.y + b.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

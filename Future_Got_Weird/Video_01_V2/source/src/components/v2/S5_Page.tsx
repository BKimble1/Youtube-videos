import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F, OUTLINE} from '../../theme';
import {Tape} from '../Props';
import {DrawBox} from './DrawBox';
import {Chip} from '../Text';

/**
 * The real record (Kalai 2001, thesis title page), shown as it is: a crop of public/img/thesis_titlepage_top.png
 * (4080 × 3894) on a white evidence card. All marks are given in the image's own pixel coordinates (TP) and drawn on
 * top of it, so they sit exactly on the printed words; the camera does the zooming.
 */
export const TP_IMG = {w: 4080, h: 3894};
/** the crop shown: from the title's top margin down to just under "Pittsburgh, PA" (the committee list is cut) */
export const PAGE_CROP = {x: 560, y: 300, w: 2960, h: 2100};
/** measured on the image (bounding boxes of the ink, TP px): [x0, y0, x1, y1] */
export const TP = {
  title1: [775, 466, 3305, 588],
  title2: [1248, 676, 2790, 834],
  title1Words: [[775, 1701], [1756, 2025], [2078, 2621], [2671, 3305]],
  title2Words: [[1248, 1384], [1434, 2067], [2119, 2790]],
  kalai: [1805, 1229, 2275, 1293],
  date: [1789, 1343, 2288, 1424],
  y2001: [2115, 1343, 2288, 1410],
  /** the final digit of 2001 (the one ChatGPT got wrong): measured ink box of the "1" */
  d2001: [2257, 1344, 2288, 1403],
  cmu: [1536, 2175, 2549, 2258],
} as const;
export type Rect = readonly [number, number, number, number];

export const PAGE_PAD = 22;
const EDGE = OUTLINE + PAGE_PAD;

/** page geometry for a given scale k (world px per TP px) */
export const pageGeom = (k: number) => {
  const w = PAGE_CROP.w * k + EDGE * 2;
  const h = PAGE_CROP.h * k + EDGE * 2;
  /** TP → card-local px */
  const lx = (x: number) => EDGE + (x - PAGE_CROP.x) * k;
  const ly = (y: number) => EDGE + (y - PAGE_CROP.y) * k;
  return {w, h, lx, ly};
};

export type PageMarks = {
  /** read-along highlight: how far (TP x) the marker has reached on title line 1 / line 2 (undefined = not started) */
  read1?: number;
  read2?: number;
  readA?: number; // highlight strength 0..1
  title?: number; // DrawBox round the title
  kalai?: number; // underline under "Adam Kalai"
  cmu?: number; // DrawBox round "Carnegie Mellon University"
  date?: number; // DrawBox round "May 16, 2001"
  h2001?: number; // saffron highlight swept over 2001 (0..1)
  /** the comparison: the final digit "1" of 2001 bumps (bump 0..1, an envelope) */
  digit?: {bump: number};
  pulse?: {title?: number; cmu?: number; date?: number};
  /** spotlight: cream veil over the page except inside the rects (TP); ops = how clear each hole is (0..1) */
  dim?: {a: number; rects: Rect[]; ops?: number[]};
  glintX?: number; // card-local x of a passing glint band (the same gold sheen as on the slip)
  lift?: number;
  halo?: number; // warm presentation glow round the card (the 'just as solid' beat)
};

/** the label tab's left edge (card-local): clear of the left tape, so it never sits on it */
export const LABEL_X = 96;
/** the gold sheen that crosses both documents in the 'just as solid' beat (identical on the slip) */
export const S5_GLINT_BG = 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,214,120,0.85) 45%, rgba(255,244,214,0.9) 55%, rgba(255,255,255,0))';

const pad = (r: Rect, p: number): Rect => [r[0] - p, r[1] - p, r[2] + p, r[3] + p];

export const PageCard: React.FC<{
  k: number;
  marks?: PageMarks;
  /** label tab that clips over the top edge ("The actual record"): y offset (drop) and whether it is on */
  label?: {on: boolean; dy: number; rot: number; sx?: number; sy?: number};
  /** source tab under the bottom edge: 0 = hidden under the card, 1 = out */
  source?: number;
  /** tape squash per corner: undefined = no tape yet; [sx, sy] otherwise */
  tapes?: [[number, number] | undefined, [number, number] | undefined];
}> = ({k, marks = {}, label, source = 0, tapes = [undefined, undefined]}) => {
  const G = pageGeom(k);
  const box = (r: Rect, p: number) => {
    const q = pad(r, p / k);
    return {x: G.lx(q[0]), y: G.ly(q[1]), w: (q[2] - q[0]) * k, h: (q[3] - q[1]) * k};
  };
  const lift = marks.lift ?? 0;
  const halo = marks.halo ?? 0;
  const readA = marks.readA ?? 0;
  const hl = (line: Rect, to: number | undefined) => {
    if (to === undefined || readA <= 0) return null;
    const x0 = G.lx(line[0]) - 8;
    const x1 = G.lx(Math.min(line[2], to)) + (to >= line[2] ? 8 : 0);
    if (x1 <= x0) return null;
    return <div style={{position: 'absolute', left: x0, top: G.ly(line[1]) - 7, width: x1 - x0, height: (line[3] - line[1]) * k + 12, background: C.tealLight, opacity: 0.9 * readA, mixBlendMode: 'multiply', borderRadius: 6}} />;
  };
  const glow = (r: Rect, p: number, t: number | undefined) => {
    if (!t || t <= 0) return null;
    const b = box(r, p);
    return <div style={{position: 'absolute', left: b.x - 6, top: b.y - 6, width: b.w + 12, height: b.h + 12, borderRadius: 16, boxShadow: `0 0 ${10 + 18 * t}px ${4 + 8 * t}px rgba(28,167,160,${0.5 * t})`}} />;
  };
  const dim = marks.dim;
  const title = box([TP.title1[0], TP.title1[1], TP.title1[2], TP.title2[3]], 16);
  const cmu = box(TP.cmu, 5);
  const date = box(TP.date, 5);
  const r01 = box(TP.y2001, 0);
  const d01 = box(TP.d2001, 0);
  const kal = box(TP.kalai, 0);
  const digit = marks.digit;
  return (
    <div style={{position: 'relative', width: G.w, height: G.h}}>
      {/* source tab: slides out from under the bottom edge */}
      <div
        style={{
          position: 'absolute',
          left: EDGE + 6,
          top: G.h - 22,
          transform: `translateY(${(source - 1) * 110}px)`,
          background: C.cream,
          border: `3px solid ${C.inkMuted}`,
          borderRadius: '0 0 14px 14px',
          padding: '26px 26px 13px',
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: 30,
          lineHeight: 1.22,
          color: C.inkSoft,
          whiteSpace: 'nowrap',
          visibility: source > 0.01 ? 'visible' : 'hidden',
        }}
      >
        <div>Kalai (2001), PhD thesis title page</div>
        <div>Carnegie Mellon University · CMU-CS-01-132</div>
      </div>
      {/* the card */}
      <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8, boxShadow: `${10 + 10 * lift}px ${12 + 12 * lift}px 0 ${C.shadow}${halo > 0 ? `, 0 0 ${46 * halo}px ${10 * halo}px rgba(255,199,68,${0.62 * halo})` : ''}`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: PAGE_PAD, top: PAGE_PAD, width: PAGE_CROP.w * k, height: PAGE_CROP.h * k, overflow: 'hidden'}}>
          <Img src={staticFile('img/thesis_titlepage_top.png')} style={{position: 'absolute', left: -PAGE_CROP.x * k, top: -PAGE_CROP.y * k, width: TP_IMG.w * k, height: TP_IMG.h * k, display: 'block', maxWidth: 'none'}} />
        </div>
        {marks.glintX !== undefined && (
          <div style={{position: 'absolute', left: marks.glintX - 45, top: -80, width: 90, height: G.h + 160, background: S5_GLINT_BG, transform: 'rotate(18deg)', mixBlendMode: 'multiply'}} />
        )}
      </div>
      {/* marks, in card-local px */}
      <div style={{position: 'absolute', left: 0, top: 0, width: G.w, height: G.h}}>
        {hl(TP.title1 as unknown as Rect, marks.read1)}
        {hl(TP.title2 as unknown as Rect, marks.read2)}
        {glow([TP.title1[0], TP.title1[1], TP.title1[2], TP.title2[3]], 16, marks.pulse?.title)}
        {glow(TP.cmu, 5, marks.pulse?.cmu)}
        {glow(TP.date, 5, marks.pulse?.date)}
        <DrawBox t={marks.title ?? 0} x={title.x} y={title.y} w={title.w} h={title.h} tone="teal" width={5} fill={false} round={14} seed={2} />
        {[{b: cmu, t: marks.cmu ?? 0, seed: 5}, {b: date, t: marks.date ?? 0, seed: 7}].map(({b, t, seed}) => (
          <div key={seed} style={{position: 'absolute', left: 0, top: 0, width: G.w, height: G.h, transform: 'scaleY(-1)', transformOrigin: `0px ${b.y + b.h / 2}px`}}>
            <DrawBox t={t} x={b.x} y={b.y} w={b.w} h={b.h} tone="teal" width={4} round={10} seed={seed} />
          </div>
        ))}
        {(marks.kalai ?? 0) > 0 && (
          <>
            <div style={{position: 'absolute', left: kal.x - 6, top: kal.y - 5, width: (kal.w + 12) * Math.min(1, marks.kalai ?? 0), height: kal.h + 10, borderRadius: 5, background: C.tealLight, opacity: 0.9, mixBlendMode: 'multiply'}} />
            <div style={{position: 'absolute', left: kal.x - 6, top: kal.y + kal.h + 6, width: (kal.w + 12) * Math.min(1, marks.kalai ?? 0), height: 5, borderRadius: 3, background: C.teal}} />
          </>
        )}
        {(marks.h2001 ?? 0) > 0 && <div style={{position: 'absolute', left: r01.x - 5, top: r01.y - 4, width: (r01.w + 10) * Math.min(1, marks.h2001 ?? 0), height: r01.h + 8, borderRadius: 5, background: C.saffron, opacity: 0.75, mixBlendMode: 'multiply'}} />}
        {/* off by one: the record's final "1" bumps (a zoomed copy of the real crop, multiplied over it) as the
            slip's final "2" bumps and turns coral */}
        {digit && digit.bump > 0 && (
          <div style={{position: 'absolute', left: d01.x, top: d01.y, width: d01.w, height: d01.h, transform: `scale(${1 + 0.55 * digit.bump})`, transformOrigin: '50% 60%', mixBlendMode: 'multiply'}}>
            <div style={{position: 'absolute', left: -4, top: -4, width: d01.w + 8, height: d01.h + 8, overflow: 'hidden', background: C.white}}>
              <Img src={staticFile('img/thesis_titlepage_top.png')} style={{position: 'absolute', left: -(TP.d2001[0] - 4 / k) * k, top: -(TP.d2001[1] - 4 / k) * k, width: TP_IMG.w * k, height: TP_IMG.h * k, display: 'block', maxWidth: 'none'}} />
            </div>
          </div>
        )}
        {/* the spotlight veil goes over the marks too, so marks outside the current focus recede with their text */}
        {dim && dim.a > 0 && (
          <svg width={G.w} height={G.h} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <filter id="s5-feather" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation={9} />
              </filter>
              <mask id="s5-spot">
                <rect x={OUTLINE} y={OUTLINE} width={G.w - OUTLINE * 2} height={G.h - OUTLINE * 2} fill="white" />
                {dim.rects.map((r, i) => (
                  <rect key={i} x={G.lx(r[0])} y={G.ly(r[1])} width={(r[2] - r[0]) * k} height={(r[3] - r[1]) * k} rx={10} fill="black" opacity={dim.ops?.[i] ?? 1} filter="url(#s5-feather)" />
                ))}
              </mask>
            </defs>
            <rect x={OUTLINE} y={OUTLINE} width={G.w - OUTLINE * 2} height={G.h - OUTLINE * 2} fill={`rgba(250,243,223,${dim.a})`} mask="url(#s5-spot)" />
          </svg>
        )}
      </div>
      {/* tape: pressed on at the top corners */}
      {tapes[0] && <Tape style={{left: -30, top: -12, transform: `rotate(-8deg) scale(${tapes[0][0]}, ${tapes[0][1]})`}} />}
      {tapes[1] && <Tape style={{right: -30, top: -12, transform: `rotate(7deg) scale(${tapes[1][0]}, ${tapes[1][1]})`}} />}
      {/* label tab clipped over the top edge */}
      {label?.on && (
        <div style={{position: 'absolute', left: LABEL_X, top: -20 + label.dy, transform: `rotate(${label.rot}deg) scale(${label.sx ?? 1}, ${label.sy ?? 1})`, transformOrigin: '50% 100%'}}>
          <Chip tone="teal" size={37}>
            The actual record
          </Chip>
        </div>
      )}
    </div>
  );
};

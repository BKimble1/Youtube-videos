import React from 'react';
import {C, E, tw, measure, CAP_FONT, HED_FONT, INK, CREAM, PAPER, Rect, Card, AIMark, Q3} from './kit3';

/* ============================================================================================ the excerpt paper: ONE reusable layout for the opening quote, the checker scene and the takeaway.
   Canonical size 780 x 366, scaled uniformly by s = r.w / 780 (text, highlight, badge and mark scale; border weight and corner radius do not).
   Every extent is derived from the production font's measured glyph runs (fonts.ts holds the render until Montserrat is loaded), never from a character count. */
export const QW = 780, QH = 366;
export const Q_SIZE = 66;                 // 70 px in V3; -5.7 %
const PITCH = 96, C0 = 84;                // line centres at C0 + PITCH * i (card coordinates)
const HL_PAD = 10, HL_H = 94, HL_R = 14;  // highlight padding / height / radius (identical for both highlights)
export const QLINES = ['“I recall seeing', 'someone matching', 'the description…'] as const;
const BORDER = 7;

export type QuoteGeom = {
  tx: number; size: number;
  adv: number[];                                              // advance width of each line
  hl: {line: number; x: number; w: number}[];                 // highlight runs (card coordinates, padding included)
  lineY: (i: number) => number;
  hlTop: (i: number) => number;
};

let cache: QuoteGeom | null = null;
export const quoteGeom = (): QuoteGeom => {
  if (cache) return cache;
  const adv = QLINES.map((t) => measure(t, CAP_FONT, Q_SIZE));
  const wMatching = measure('matching', CAP_FONT, Q_SIZE);
  const offMatching = measure('someone matching', CAP_FONT, Q_SIZE) - wMatching;     // start of the word inside its own line (kerning included)
  const wDesc = measure('the description', CAP_FONT, Q_SIZE);
  // centre the highlight block (left-most highlight start .. right-most highlight end) inside the card
  const block = offMatching + wMatching + 2 * HL_PAD;
  const tx = (QW - block) / 2 + HL_PAD;
  cache = {
    tx, size: Q_SIZE, adv,
    hl: [{line: 1, x: tx + offMatching - HL_PAD, w: wMatching + 2 * HL_PAD}, {line: 2, x: tx - HL_PAD, w: wDesc + 2 * HL_PAD}],
    lineY: (i) => C0 + PITCH * i,
    hlTop: (i) => C0 + PITCH * i - HL_H / 2,
  };
  return cache;
};

/** inner padding (px, card scale) between every highlight / glyph run and the inside of the border */
export const quotePadding = () => {
  const g = quoteGeom();
  const inL = BORDER / 2, inR = QW - BORDER / 2, inB = QH - BORDER / 2;
  const left = Math.min(...g.hl.map((h) => h.x), g.tx) - inL;
  const right = inR - Math.max(...g.hl.map((h) => h.x + h.w), g.tx + Math.max(...g.adv));
  const bottom = inB - (g.hlTop(2) + HL_H);
  return {left, right, bottom};
};

export const QuotePaper: React.FC<{
  r: Rect;
  reveal?: number[];       // opacity of the three lines
  hl?: number[];           // 0..1 sweep of the two highlights
  contain?: number;        // 0..1 coral containment frame
  detail?: number;         // opacity of the badge and the AI mark (the paper's fixed furniture)
  content?: number;        // opacity of everything on the paper (text, highlights, frame, furniture) while the paper surface itself stays opaque
  op?: number;
}> = ({r, reveal = [1, 1, 1], hl = [1, 1], contain = 0, detail = 1, content = 1, op = 1}) => {
  const s = r.w / QW;
  const q = quoteGeom();
  const X = (v: number) => r.x + v * s;
  const Y = (v: number) => r.y + v * s;
  return (
    <g opacity={op}>
      <Card r={r} rad={30} fill={PAPER} sw={BORDER} />
      <g opacity={content}>
      {q.hl.map((h, i) => hl[i] > 0 && (
        <rect key={i} x={X(h.x)} y={Y(q.hlTop(h.line))} width={h.w * s * hl[i]} height={HL_H * s} rx={HL_R * s} fill={C.saffron} />
      ))}
      {QLINES.map((ln, i) => reveal[i] > 0 && (
        <text key={i} x={X(q.tx)} y={Y(q.lineY(i))} dy="0.36em" fontFamily={CAP_FONT} fontWeight={800} fontSize={q.size * s} fill={INK} opacity={reveal[i]}>{ln}</text>
      ))}
      {contain > 0 && (
        <rect x={r.x + 14} y={r.y + 14} width={r.w - 28} height={r.h - 28} rx={22} fill="none" stroke={C.coral} strokeWidth={6} strokeLinejoin="round" pathLength={100} strokeDasharray={`${contain * 100} 100`} />
      )}
      <g opacity={detail}>
        <rect x={X(36)} y={Y(0) - 26 * s} width={196 * s} height={52 * s} rx={14 * s} fill={CREAM} stroke={INK} strokeWidth={5} />
        <text x={X(134)} y={Y(0)} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={38 * s} letterSpacing={3} fill={INK}>EXCERPT</text>
        <AIMark x={X(QW - 56)} y={Y(8)} s={1.3 * s} rot={8} />
      </g>
      </g>
    </g>
  );
};

/** line reveal helper: 3 opacities from two start frames (line 1, lines 2-3) */
export const lineReveal = (g: number, t1: number, t2: number, dur = 4) => {
  const a = E.out(tw(g, t1, dur, (x) => x)), b = E.out(tw(g, t2, dur, (x) => x));
  return [a, b, b];
};

/** browser audit: positioned runs vs the paper's inner rectangle at the smallest (checker scene, 0.75) and largest (takeaway, 1.0) states */
export const auditQuote = async () => {
  await Promise.all([document.fonts.load('800 66px "Montserrat"'), document.fonts.load('800 38px "Barlow Condensed"')]);
  await document.fonts.ready;
  const g = quoteGeom();
  const c = document.createElement('canvas').getContext('2d')!;
  const NS = 'http://www.w3.org/2000/svg';
  const out: Record<string, unknown> = {fontProof: document.fonts.check('800 66px "Montserrat"'), size: g.size, tx: g.tx, padding: quotePadding(), states: []};
  for (const s of [Q3.w / QW, 1]) {   // checker scene (smallest) and takeaway (largest)
    c.font = `800 ${g.size * s}px ${CAP_FONT}`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '1200'); svg.setAttribute('height', '400');
    svg.style.position = 'absolute'; svg.style.left = '-5000px';
    document.body.appendChild(svg);
    const rows = QLINES.map((t, i) => {
      const el = document.createElementNS(NS, 'text');
      el.setAttribute('x', String(g.tx * s)); el.setAttribute('y', String(g.lineY(i) * s));
      el.setAttribute('font-family', CAP_FONT); el.setAttribute('font-weight', '800'); el.setAttribute('font-size', String(g.size * s));
      el.textContent = t;
      svg.appendChild(el);
      const m = c.measureText(t);
      const startX = g.tx * s;
      const domAdv = (el as unknown as SVGTextContentElement).getComputedTextLength();
      const domEnd = (el as unknown as SVGTextContentElement).getEndPositionOfChar(t.length - 1).x;
      return {line: t, canvasAdvance: m.width, domAdvance: domAdv, domEndX: domEnd, inkRight: startX + m.actualBoundingBoxRight, inkLeft: startX - m.actualBoundingBoxLeft};
    });
    // highlight word positions as the browser lays them out
    const el1 = svg.children[1] as unknown as SVGTextContentElement;
    const idx = 'someone matching'.indexOf('matching');
    const wordStartDom = el1.getStartPositionOfChar(idx).x, wordEndDom = el1.getEndPositionOfChar('someone matching'.length - 1).x;
    const hl = g.hl.map((h) => ({line: h.line, x0: h.x * s, x1: (h.x + h.w) * s}));
    const inner = {x0: 3.5, x1: QW * s - 3.5, y1: QH * s - 3.5};
    const maxInk = Math.max(...rows.map((r) => r.inkRight)), minInk = Math.min(...rows.map((r) => r.inkLeft));
    const hlMax = Math.max(...hl.map((h) => h.x1)), hlMin = Math.min(...hl.map((h) => h.x0));
    (out.states as unknown[]).push({
      scale: s, cardW: QW * s, cardH: QH * s, fontPx: g.size * s, rows, highlights: hl,
      matchingWord: {domStart: wordStartDom, domEnd: wordEndDom, highlightStart: hl[0].x0, highlightEnd: hl[0].x1, padLeftOfWord: wordStartDom - hl[0].x0, padRightOfWord: hl[0].x1 - wordEndDom},
      clearanceToBorder: {left: Math.min(hlMin, minInk) - inner.x0, right: inner.x1 - Math.max(hlMax, maxInk), bottom: inner.y1 - (g.hlTop(2) + 94) * s},
    });
    document.body.removeChild(svg);
  }
  return out;
};

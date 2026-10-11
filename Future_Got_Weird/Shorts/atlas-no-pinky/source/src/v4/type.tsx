import React from 'react';
import {C} from '../theme';
import {E, tw} from '../film/common';
import {CAP_FONT, HED_FONT} from './fonts4';
import {CAPS_V4} from './cues';

/* ------------------------------------------------------------------ measured text */
const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d')! : null;
const memo = new Map<string, number>();
/** advance width of `text` in the loaded face (canvas measureText), px */
export const measure = (text: string, font: string, size: number, weight = 800, ls = 0): number => {
  const key = `${weight}|${size}|${font}|${ls}|${text}`;
  let v = memo.get(key);
  if (v === undefined) {
    ctx!.font = `${weight} ${size}px ${font}`;
    v = ctx!.measureText(text).width + ls * text.length;
    memo.set(key, v);
  }
  return v;
};

/* ------------------------------------------------------------------ headlines */
export type HedProps = {
  x?: number; y: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; shadow?: string | null;
  sx?: number; sy?: number; opacity?: number; ls?: number;
};
/** Barlow Condensed ExtraBold, uppercase, one limited hard shadow (offset, no blur). y = baseline-ish centre like the old Headline. */
export const Hed: React.FC<HedProps> = ({x = 540, y, text, size = 150, anchor = 'middle', color = C.ink, shadow = C.coral, sx = 1, sy = 1, opacity = 1, ls = 2}) => {
  const off = Math.max(4, Math.round(size * 0.04));
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} opacity={opacity} fontFamily={HED_FONT} fontWeight={800} fontSize={size} letterSpacing={ls} textAnchor={anchor} strokeLinejoin="round">
      {shadow && (
        <text x={off} y={off} dy="0.36em" fill={shadow} stroke={shadow} strokeWidth={off * 0.6}>{text}</text>
      )}
      <text x={0} y={0} dy="0.36em" fill={color} stroke={color} strokeWidth={size * 0.012}>{text}</text>
    </g>
  );
};

/* ------------------------------------------------------------------ captions */
export const CAP = {size: 76, lh: 90, maxW: 760, cx: 495, baseline: 1428, outline: 13, min: 60};
type Laid = {lines: {words: {text: string; x: number; w: number; idx: number}[]; w: number}[]; size: number};
const layoutCache = new Map<number, Laid>();

/** two lines maximum; split minimising the widest line; shrink only if even the best split exceeds the width */
const layout = (ci: number): Laid => {
  const hit = layoutCache.get(ci);
  if (hit) return hit;
  const words = CAPS_V4[ci].words;
  let size = CAP.size;
  let best: number[] = [];
  for (;;) {
    const space = measure(' ', CAP_FONT, size);
    const wj = words.map((w) => measure(w, CAP_FONT, size));
    const width = (a: number, b: number) => wj.slice(a, b).reduce((s, v) => s + v, 0) + space * Math.max(0, b - a - 1);
    const options: {split: number; max: number}[] = [{split: words.length, max: width(0, words.length)}];
    for (let k = 1; k < words.length; k++) options.push({split: k, max: Math.max(width(0, k), width(k, words.length))});
    const one = options[0];
    const pick = one.max <= CAP.maxW ? one : options.slice(1).sort((a, b) => a.max - b.max)[0];
    if (pick && pick.max <= CAP.maxW) { best = [pick.split]; break; }
    if (size <= CAP.min) { best = [pick ? pick.split : words.length]; break; }
    size -= 2;
  }
  const split = best[0];
  const space = measure(' ', CAP_FONT, size);
  const rows = split >= words.length ? [[0, words.length]] : [[0, split], [split, words.length]];
  const lines = rows.map(([a, b]) => {
    let x = 0;
    const ws = words.slice(a, b).map((text, i) => {
      const w = measure(text, CAP_FONT, size);
      const o = {text, x, w, idx: a + i};
      x += w + space;
      return o;
    });
    const total = x - space;
    return {words: ws.map((o) => ({...o, x: o.x - total / 2})), w: total};
  });
  const out = {lines, size};
  layoutCache.set(ci, out);
  return out;
};
export const captionLayout = layout;

/**
 * V4 captions: Montserrat ExtraBold, cream with an ink outline (no plaque), <= 2 lines in a bottom-anchored lane, one phrase at a time.
 * A phrase rises 14 px into a clipped lane over 4 frames and then holds still; it is replaced (never faded) when the next phrase starts.
 * Emphasis words switch colour at their aligned spoken time; flagged reveals pop 5 %.
 */
export const CaptionsV4: React.FC<{g: number}> = ({g}) => {
  const ci = CAPS_V4.findIndex((k) => g >= k.from && g < k.to);
  if (ci < 0) return null;
  const c = CAPS_V4[ci];
  const L = layout(ci);
  const rise = (1 - E.out(tw(g, c.from, 4))) * 14;
  const nL = L.lines.length;
  const top = CAP.baseline - (nL - 1) * CAP.lh;
  return (
    <g>
      <defs>
        <clipPath id="capLane"><rect x={30} y={top - CAP.size} width={1020} height={(nL - 1) * CAP.lh + CAP.size + 30} /></clipPath>
      </defs>
      <g clipPath="url(#capLane)">
        <g transform={`translate(${CAP.cx} ${rise})`} fontFamily={CAP_FONT} fontWeight={800} fontSize={L.size} strokeLinejoin="round" strokeLinecap="round">
          {L.lines.map((ln, li) =>
            ln.words.map((w) => {
              const k = c.em.indexOf(w.idx);
              const on = k >= 0 && g >= c.emAt[k] - 1;
              const pop = on && c.pop ? 1 + 0.05 * Math.sin(Math.min(1, (g - c.emAt[k] + 1) / 9) * Math.PI) : 1;
              const y = top + li * CAP.lh;
              return (
                <text key={`${li}-${w.idx}`} transform={`translate(${w.x + w.w / 2} ${y}) scale(${pop})`} x={0} y={0} textAnchor="middle" fill={on ? '#FF7A5C' : C.cream} stroke={C.ink} strokeWidth={CAP.outline} paintOrder="stroke">
                  {w.text}
                </text>
              );
            }),
          )}
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ audit (browser-side, used by tools/audit_captions.mjs through calculateMetadata) */
export const HEADLINES: {id: string; text: string; size: number; x: number; anchor: 'start' | 'middle'; ls: number}[] = [
  {id: 'opener kicker', text: 'ATLAS HAND · BOSTON DYNAMICS', size: 46, x: 540, anchor: 'middle', ls: 7},
  {id: 'opener title', text: 'NO PINKY?', size: 190, x: 540, anchor: 'middle', ls: 3},
  {id: 'ONE DAY', text: 'ONE DAY', size: 170, x: 120, anchor: 'start', ls: 2},
  {id: 'NEW HAND', text: 'NEW HAND', size: 170, x: 120, anchor: 'start', ls: 2},
  {id: '4 DIGITS', text: '4 DIGITS', size: 170, x: 120, anchor: 'start', ls: 2},
  {id: '13', text: '13', size: 300, x: 112, anchor: 'start', ls: 0},
  {id: 'TO MOVE', text: 'TO MOVE', size: 120, x: 354, anchor: 'start', ls: 2},
  {id: 'PINCH.', text: 'PINCH.', size: 170, x: 120, anchor: 'start', ls: 2},
  {id: 'TURN.', text: 'TURN.', size: 170, x: 120, anchor: 'start', ls: 2},
  {id: 'PRESS.', text: 'PRESS.', size: 170, x: 120, anchor: 'start', ls: 2},
  {id: 'ONE MORE', text: 'ONE MORE', size: 150, x: 120, anchor: 'start', ls: 2},
  {id: 'FINGER?', text: 'FINGER?', size: 150, x: 120, anchor: 'start', ls: 2},
  {id: 'BUILT', text: 'BUILT', size: 128, x: 76, anchor: 'start', ls: 2},
  {id: 'TO WORK', text: 'TO WORK', size: 128, x: 76, anchor: 'start', ls: 2},
  {id: 'NOT IN', text: 'NOT IN', size: 226, x: 540, anchor: 'middle', ls: 4},
  {id: 'BUDGET', text: 'BUDGET', size: 236, x: 540, anchor: 'middle', ls: 4},
];

export const auditCaptions = async () => {
  await Promise.all([document.fonts.load('800 76px "Montserrat"'), document.fonts.load('800 150px "Barlow Condensed"')]);
  await document.fonts.ready;
  const probe = (font: string) => {
    const c = document.createElement('canvas').getContext('2d')!;
    c.font = `800 100px ${font}, monospace`;
    const a = c.measureText('Mgsw ag').width;
    c.font = '800 100px monospace';
    return {withFace: a, fallbackOnly: c.measureText('Mgsw ag').width};
  };
  const fontProof = {
    montserrat800: {check: document.fonts.check('800 76px "Montserrat"'), ...probe('"Montserrat"')},
    barlow800: {check: document.fonts.check('800 150px "Barlow Condensed"'), ...probe('"Barlow Condensed"')},
  };
  const captions = CAPS_V4.map((c, i) => {
    const L = layout(i);
    return {i, from: c.from, to: c.to, size: L.size, nLines: L.lines.length, lines: L.lines.map((l) => ({text: l.words.map((w) => w.text).join(' '), width: Math.round(l.w * 10) / 10})), maxWidth: Math.max(...L.lines.map((l) => l.w))};
  });
  const headlines = HEADLINES.map((h) => {
    const w = measure(h.text, HED_FONT, h.size, 800, h.ls);
    const left = h.anchor === 'start' ? h.x : h.x - w / 2;
    return {id: h.id, width: Math.round(w), left: Math.round(left), right: Math.round(left + w)};
  });
  return {fontProof, captions, headlines, lane: {cx: CAP.cx, maxW: CAP.maxW, size: CAP.size}};
};

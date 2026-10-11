import React, {createContext, useContext} from 'react';
import {C, OUTLINE, W, H, FPS} from './theme';
import {E, tw, kf, sp, SNAP, SOFT, FIRM, ring, impact, drop, strike, hop, drift} from './lib/motion';
import {lerp, clamp01, rand} from './lib/anim';
import {CAP_FONT, HED_FONT} from './fonts';
import {CAPS} from './cues';

export {C, OUTLINE, W, H, FPS, E, tw, kf, sp, SNAP, SOFT, FIRM, ring, impact, drop, strike, hop, drift, lerp, clamp01, rand, CAP_FONT, HED_FONT};

/* ------------------------------------------------------------------ layout shared by the opener, the page world and the closer */
/** The tip page at the opening framing (world == screen). Content is laid out for scroll = 300. */
export const OY = -40; // content (authored for the old page top at 560) is shifted up by this much
export const PAGE = {x: 110, y: 540, w: 740, h: 700, hdr: 120, r: 30};
/** The SUBMIT button: identical geometry in the opening shot, the consequence shot and the closing match cut. */
export const BTN = {x: 556, y: 1086, w: 254, h: 104};
export const BTN_C = {x: BTN.x + BTN.w / 2, y: BTN.y + BTN.h / 2};
/** Cursor tip: rest pose (last frame of the film == first frame) and press target. */
export const P0 = {x: 440, y: 1096};
export const PRESS = {x: 664, y: 1176};

/* ------------------------------------------------------------------ colour */
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
  const k = clamp01(t);
  const h = (x: number) => Math.round(x).toString(16).padStart(2, '0');
  return `#${h(r1 + (r2 - r1) * k)}${h(g1 + (g2 - g1) * k)}${h(b1 + (b2 - b1) * k)}`;
};

/* ------------------------------------------------------------------ zoom-aware strokes (so outlines stay bold when the camera pulls back) */
export const ZoomCtx = createContext(1);
export const useSw = () => {
  const z = useContext(ZoomCtx);
  return (b: number) => Math.max(b, 4.2 / z);
};

/* ------------------------------------------------------------------ measured text */
const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d')! : null;
const memo = new Map<string, number>();
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
/** font size that makes `text` exactly `targetW` wide (capped) */
export const fitSize = (text: string, font: string, targetW: number, maxSize: number, weight = 800, ls = 0) => {
  const w100 = measure(text, font, 100, weight, ls * (100 / 100));
  return Math.min(maxSize, (targetW / w100) * 100);
};

/* ------------------------------------------------------------------ headlines */
export type HedProps = {x?: number; y: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; shadow?: string | null; sx?: number; sy?: number; opacity?: number; ls?: number; rot?: number; outline?: string};
/** Barlow Condensed ExtraBold, uppercase, one limited hard shadow (offset, no blur). y = visual centre. */
export const Hed: React.FC<HedProps> = ({x = 540, y, text, size = 150, anchor = 'middle', color = C.ink, shadow = C.coral, sx = 1, sy = 1, opacity = 1, ls = 2, rot = 0, outline}) => {
  const off = Math.max(4, Math.round(size * 0.04));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`} opacity={opacity} fontFamily={HED_FONT} fontWeight={800} fontSize={size} letterSpacing={ls} textAnchor={anchor} strokeLinejoin="round">
      {shadow && <text x={off} y={off} dy="0.36em" fill={shadow} stroke={outline ? C.ink : shadow} strokeWidth={outline ? size * 0.065 : off * 0.6} paintOrder="stroke">{text}</text>}
      {outline ? (
        <text x={0} y={0} dy="0.36em" fill={color} stroke={outline} strokeWidth={size * 0.065} paintOrder="stroke">{text}</text>
      ) : (
        <text x={0} y={0} dy="0.36em" fill={color} stroke={color} strokeWidth={size * 0.012}>{text}</text>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ captions (Montserrat ExtraBold, cream + ink outline, no plaque) */
export const CAP = {size: 76, lh: 90, maxW: 760, cx: 488, baseline: 1428, outline: 13, min: 60};
type Laid = {lines: {words: {text: string; x: number; w: number; idx: number}[]; w: number}[]; size: number};
const layoutCache = new Map<number, Laid>();

/** two lines maximum; split minimising the widest line; shrink only if even the best split exceeds the width */
export const captionLayout = (ci: number): Laid => {
  const hit = layoutCache.get(ci);
  if (hit) return hit;
  const words = CAPS[ci].words;
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

/**
 * One phrase at a time in a bottom-anchored lane. A phrase rises 14 px into a clipped lane over 4 frames and then holds still;
 * the next phrase replaces it (never faded). Emphasis words change colour at their aligned spoken frame; flagged reveals pop 5 %.
 */
export const Captions: React.FC<{g: number}> = ({g}) => {
  const ci = CAPS.findIndex((k) => g >= k.from && g < k.to);
  if (ci < 0) return null;
  const c = CAPS[ci];
  const L = captionLayout(ci);
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

/** audit used by tools: caption fit and font proof, measured in the browser with the bundled faces */
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
  const fontProof = {montserrat800: {check: document.fonts.check('800 76px "Montserrat"'), ...probe('"Montserrat"')}, barlow800: {check: document.fonts.check('800 150px "Barlow Condensed"'), ...probe('"Barlow Condensed"')}};
  const captions = CAPS.map((c, i) => {
    const L = captionLayout(i);
    return {i, from: c.from, to: c.to, size: L.size, nLines: L.lines.length, lines: L.lines.map((l) => ({text: l.words.map((w) => w.text).join(' '), width: Math.round(l.w * 10) / 10})), maxWidth: Math.max(...L.lines.map((l) => l.w))};
  });
  return {fontProof, captions, lane: {cx: CAP.cx, maxW: CAP.maxW, size: CAP.size}};
};
void OUTLINE; void rand; void drift;

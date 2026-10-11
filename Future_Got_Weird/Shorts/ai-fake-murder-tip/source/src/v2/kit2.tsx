import React from 'react';
import {C, W, H, E, tw, sp, kf, SNAP, SOFT, FIRM, lerp, clamp01, mix, measure, fitSize, CAP_FONT, HED_FONT} from '../kit';
import {CAPS, EV} from './cues';

export {C, W, H, E, tw, sp, kf, SNAP, SOFT, FIRM, lerp, clamp01, mix, measure, fitSize, CAP_FONT, HED_FONT, EV};

/** V2 palette: ink / cream / coral / teal; saffron is reserved for ONE highlighted phrase (the claim in the invented tip). */
export const INK = C.ink;
export const CREAM = C.paper;          // #FAF3DF scene cream
export const PAPER = C.cream;          // #FFFBF0 lighter paper for windows on cream scenes
export const GREY = '#B8C0BF';         // greeked text lines

/* ------------------------------------------------------------------ layout shared by the opener and the closing return (opening geometry == closing geometry) */
export type Rect = {x: number; y: number; w: number; h: number};
export const SAFE = {x0: 100, x1: 870, y0: 220, y1: 1440};
export const CX = 485;                                     // centre of the 100-870 safe column
export const WIN: Rect = {x: 100, y: 640, w: 770, h: 620}; // the police tip window (opening state)
export const HDR_H = 124;
export const TB1: Rect = {x: 140, y: 830, w: 690, h: 218};  // the message box inside the window (becomes the evidence card)
export const BTN2: Rect = {x: 570, y: 1100, w: 260, h: 104}; // SUBMIT button in the opening state
export const Q2: Rect = {x: 100, y: 590, w: 770, h: 410};    // evidence card, full size
export const Q3: Rect = {x: 177, y: 252, w: 616, h: 328};    // evidence card as the "claim" above the comparison (0.8 scale)
export const P_START = {x: 395, y: 1010};                    // AI pointer tip near frame 0 (already travelling)
export const P_PRESS = {x: 700, y: 1160};                    // contact point on SUBMIT

export const rectLerp = (a: Rect, b: Rect, t: number): Rect => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});

/* ------------------------------------------------------------------ small shapes */
export const Card: React.FC<{r: Rect; rad?: number; fill?: string; sw?: number; shadow?: number; dash?: string; children?: React.ReactNode}> = ({r, rad = 30, fill = PAPER, sw = 7, shadow = 0.2, dash, children}) => (
  <g>
    {shadow > 0 && <rect x={r.x + 10} y={r.y + 14} width={r.w} height={r.h} rx={rad} fill={INK} opacity={shadow} />}
    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={rad} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" strokeDasharray={dash} />
    {children}
  </g>
);

export const Shield: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -42 L 36 -28 L 36 6 Q 36 32 0 48 Q -36 32 -36 6 L -36 -28 Z" fill={CREAM} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 0 -20 L 7 -4 L 24 -4 L 11 7 L 16 24 L 0 14 L -16 24 L -11 7 L -24 -4 L -7 -4 Z" fill={C.teal} />
  </g>
);

/** The teal POLICE TIP header band that tops a window drawn at rect r. */
export const PoliceHeader: React.FC<{r: Rect; h?: number; pulse?: number; rad?: number}> = ({r, h = HDR_H, pulse = 0, rad = 30}) => (
  <g>
    <path d={`M ${r.x} ${r.y + h} L ${r.x} ${r.y + rad} Q ${r.x} ${r.y} ${r.x + rad} ${r.y} L ${r.x + r.w - rad} ${r.y} Q ${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + rad} L ${r.x + r.w} ${r.y + h} Z`} fill={C.teal} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <Shield x={r.x + 84} y={r.y + h / 2} s={1.15} />
    <text x={r.x + 150} y={r.y + h / 2 + 2} dy="0.36em" fontFamily={HED_FONT} fontWeight={800} fontSize={Math.min(100, h * 0.8)} letterSpacing={3} fill={CREAM}>POLICE TIP</text>
    {pulse > 0 && <rect x={r.x - 8 * pulse} y={r.y - 8 * pulse} width={r.w + 16 * pulse} height={h + 8 * pulse} rx={rad + 6} fill="none" stroke={CREAM} strokeWidth={6} opacity={1 - pulse} />}
  </g>
);

/** AI pointer: arrow + "AI AGENT" tag. (x, y) is the arrow tip. */
export const Cursor2: React.FC<{x: number; y: number; s?: number; press?: number; op?: number; tag?: boolean}> = ({x, y, s = 1, press = 0, op = 1, tag = true}) => {
  const k = s * (1 - 0.08 * press);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={op}>
      <path d="M 7 9 L 7 69 L 22 55 L 33 82 L 47 76 L 36 50 L 58 50 Z" fill={INK} opacity={0.3} />
      <path d="M 0 0 L 0 62 L 15 48 L 26 75 L 40 69 L 29 43 L 51 43 Z" fill={CREAM} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {tag && (
        <g transform="translate(-142 70)">
          <rect x={0} y={0} width={138} height={46} rx={14} fill={C.teal} stroke={INK} strokeWidth={5} />
          <text x={69} y={24} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={34} letterSpacing={2} fill={CREAM}>AI AGENT</text>
        </g>
      )}
    </g>
  );
};

/** SUBMIT button: press 0..1 depresses the face; sent switches to SENT; locked greys it out with a padlock (unlock 0..1 opens it). */
export const Button2: React.FC<{r: Rect; press?: number; sent?: boolean; locked?: number; unlock?: number; op?: number}> = ({r, press = 0, sent = false, locked = 0, unlock = 1, op = 1}) => {
  const lift = 12 * (1 - press);
  const grey = locked > 0;
  const fill = grey ? mix(C.coral, '#9AA9AE', locked) : sent ? C.teal : C.coral;
  const base = grey ? mix(C.coralDeep, '#7C8B90', locked) : sent ? C.tealDeep : C.coralDeep;
  const fs = Math.round(r.h * 0.6);
  return (
    <g opacity={op}>
      <rect x={r.x + 6} y={r.y + 18} width={r.w} height={r.h} rx={26} fill={INK} opacity={0.22} />
      <rect x={r.x} y={r.y + 12} width={r.w} height={r.h} rx={26} fill={base} stroke={INK} strokeWidth={7} />
      <g transform={`translate(0 ${12 - lift})`}>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={26} fill={fill} stroke={INK} strokeWidth={7} />
        {sent ? (
          <g>
            <path d={`M ${r.x + r.w / 2 - 82} ${r.y + r.h / 2 + 2} l 20 22 l 34 -42`} fill="none" stroke={CREAM} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
            <text x={r.x + r.w / 2 + 36} y={r.y + r.h / 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={fs} fill={CREAM} letterSpacing={1}>SENT</text>
          </g>
        ) : (
          <g>
            <text x={r.x + r.w / 2 + (grey ? 34 : 0)} y={r.y + r.h / 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={fs} fill={CREAM} letterSpacing={2}>SUBMIT</text>
            {grey && (
              <g transform={`translate(${r.x + 58} ${r.y + r.h / 2 + 6})`} opacity={locked}>
                <path d={`M -15 -12 L -15 -26 Q -15 -44 0 -44 Q 15 -44 15 -26 L 15 ${-12 - 14 * unlock}`} transform={`translate(0 ${-18 * unlock * 0}) rotate(${-38 * unlock} 15 -12)`} fill="none" stroke={CREAM} strokeWidth={9} strokeLinecap="round" />
                <rect x={-26} y={-14} width={52} height={40} rx={9} fill={CREAM} stroke={INK} strokeWidth={4} />
                <circle cx={0} cy={5} r={6} fill={INK} />
              </g>
            )}
          </g>
        )}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ captions (V2: scene-adaptive ink/cream, Montserrat ExtraBold, clean outline) */
export const CAP2 = {size: 76, lh: 90, maxW: 770, cx: 485, baseline: 1428, min: 72};
type Laid = {lines: {words: {text: string; x: number; w: number; idx: number}[]; w: number}[]; size: number};
const cache = new Map<number, Laid>();

/** rewrap (never shrink below 72 px unless a single word would not fit): one line if it fits, else the most balanced two-line split */
export const capLayout = (ci: number): Laid => {
  const hit = cache.get(ci);
  if (hit) return hit;
  const words = CAPS[ci].words;
  let size = CAP2.size;
  let split = words.length;
  for (;;) {
    const space = measure(' ', CAP_FONT, size);
    const wj = words.map((w) => measure(w, CAP_FONT, size));
    const width = (a: number, b: number) => wj.slice(a, b).reduce((s, v) => s + v, 0) + space * Math.max(0, b - a - 1);
    const options = [{split: words.length, max: width(0, words.length)}];
    for (let k = 1; k < words.length; k++) options.push({split: k, max: Math.max(width(0, k), width(k, words.length))});
    const pick = options[0].max <= CAP2.maxW ? options[0] : options.slice(1).sort((a, b) => a.max - b.max)[0];
    if (pick && pick.max <= CAP2.maxW) { split = pick.split; break; }
    if (size <= CAP2.min) { split = pick ? pick.split : words.length; break; }
    size -= 2;
  }
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
  cache.set(ci, out);
  return out;
};

/** 0 = dark scene (cream text), 1 = cream scene (ink text) */
export const creamness = (g: number) => {
  const a = E.inOut(tw(g, EV['b3.start'], 10, (x) => x));
  const b = E.inOut(tw(g, EV['b6.start'], 12, (x) => x));
  return a * (1 - b);
};

export const Captions2: React.FC<{g: number}> = ({g}) => {
  const ci = CAPS.findIndex((k) => g >= k.from && g < k.to);
  if (ci < 0) return null;
  const c = CAPS[ci];
  const L = capLayout(ci);
  const rise = (1 - E.out(tw(g, c.from, 4))) * 14;
  const nL = L.lines.length;
  const top = CAP2.baseline - (nL - 1) * CAP2.lh;
  const k = creamness(g);
  const fill = mix(CREAM, INK, k);
  const halo = mix(INK, CREAM, k);
  return (
    <g>
      <defs>
        <clipPath id="capLane2"><rect x={30} y={top - CAP2.size} width={1020} height={(nL - 1) * CAP2.lh + CAP2.size + 34} /></clipPath>
      </defs>
      <g clipPath="url(#capLane2)">
        <g transform={`translate(${CAP2.cx} ${rise})`} fontFamily={CAP_FONT} fontWeight={800} fontSize={L.size} strokeLinejoin="round" strokeLinecap="round">
          {L.lines.map((ln, li) =>
            ln.words.map((w) => {
              const a = c.em.indexOf(w.idx);
              const on = a >= 0 && g >= c.emAt[a] - 1;
              const pop = on && c.pop ? 1 + 0.05 * Math.sin(Math.min(1, (g - c.emAt[a] + 1) / 9) * Math.PI) : 1;
              const y = top + li * CAP2.lh;
              return (
                <text key={`${li}-${w.idx}`} transform={`translate(${w.x + w.w / 2} ${y}) scale(${pop})`} x={0} y={0} textAnchor="middle" fill={on ? (k > 0.5 ? C.coralDeep : C.coral) : fill} stroke={halo} strokeWidth={9} paintOrder="stroke">
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

/** audit: caption fit and font proof measured in the browser */
export const auditCaptions2 = async () => {
  await Promise.all([document.fonts.load('800 76px "Montserrat"'), document.fonts.load('800 150px "Barlow Condensed"')]);
  await document.fonts.ready;
  const captions = CAPS.map((c, i) => {
    const L = capLayout(i);
    return {i, from: c.from, to: c.to, size: L.size, nLines: L.lines.length, lines: L.lines.map((l) => ({text: l.words.map((w) => w.text).join(' '), width: Math.round(l.w * 10) / 10})), maxWidth: Math.max(...L.lines.map((l) => l.w))};
  });
  const fontProof = {montserrat800: document.fonts.check('800 76px "Montserrat"'), barlow800: document.fonts.check('800 150px "Barlow Condensed"')};
  return {fontProof, captions, lane: CAP2};
};

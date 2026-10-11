import React from 'react';
import {C, W, H, E, tw, sp, kf, SNAP, SOFT, FIRM, lerp, clamp01, mix, measure, fitSize, CAP_FONT, HED_FONT} from '../kit';
import {CAPS, EV} from './cues';

export {C, W, H, E, tw, sp, kf, SNAP, SOFT, FIRM, lerp, clamp01, mix, measure, fitSize, CAP_FONT, HED_FONT, EV};

/** linear 0..1 ramp over `dur` frames from `start` (apply an easing yourself: tw() eases by default) */
export const ramp = (g: number, start: number, dur: number) => tw(g, start, dur, (x) => x);

/** V3 palette: ink / cream / coral / teal / saffron. Saffron = the AI and what the AI wrote (the AI word, pointer tag, packet mark, claim highlight); teal = police; coral = fake / spam. */
export const INK = C.ink;
export const CREAM = C.paper;          // #FAF3DF scene cream
export const PAPER = C.cream;          // #FFFBF0 lighter paper for windows on cream scenes
export const GREY = '#B8C0BF';         // greeked text lines

/* ------------------------------------------------------------------ layout shared by the opener and the closing return (opening geometry == closing geometry) */
export type Rect = {x: number; y: number; w: number; h: number};
export const SAFE = {x0: 96, x1: 876, y0: 240, y1: 1450};
export const CX = 486;                                     // centre of the 96-876 safe column
export const WIN: Rect = {x: 96, y: 660, w: 780, h: 600};  // the police tip window (opening state)
export const HDR_H = 112;
export const TB1: Rect = {x: 136, y: 824, w: 700, h: 200};  // the message box inside the window
export const BTN2: Rect = {x: 536, y: 1086, w: 300, h: 116}; // SUBMIT button in the opening state
export const Q2: Rect = {x: 96, y: 557, w: 780, h: 366};     // the opened tip paper = the quote surface (780 x 366: see quote.tsx)
export const Q3: Rect = {x: 182, y: 292, w: 608, h: 285.4};   // the same paper as the "claim" above the comparison (0.78 scale: the smallest quote state)
export const P_START = {x: 498, y: 1034};                    // AI pointer tip, poised above SUBMIT on frame 0 (and where the loop returns it)
export const P_PRESS = {x: 800, y: 1166};                    // contact point on SUBMIT

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

/** AI pointer: oversized arrow + a readable saffron "AI" tag trailing behind it. (x, y) is the arrow tip. */
export const Cursor2: React.FC<{x: number; y: number; s?: number; press?: number; op?: number; tag?: boolean; tagK?: number}> = ({x, y, s = 1.5, press = 0, op = 1, tag = true, tagK = 1}) => {
  const k = s * (1 - 0.08 * press);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={op}>
      <path d="M 7 9 L 7 69 L 22 55 L 33 82 L 47 76 L 36 50 L 58 50 Z" fill={INK} opacity={0.3} />
      <path d="M 0 0 L 0 62 L 15 48 L 26 75 L 40 69 L 29 43 L 51 43 Z" fill={CREAM} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {tag && (
        <g transform={`translate(${-70 * tagK - 38} ${64 + 8 * tagK}) scale(${tagK})`}>
          <rect x={0} y={0} width={96} height={66} rx={18} fill={C.saffron} stroke={INK} strokeWidth={6} />
          <text x={48} y={34} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={54} letterSpacing={2} fill={INK}>AI</text>
        </g>
      )}
    </g>
  );
};

/** The small AI-coloured corner mark that stays on the tip paper / envelope all the way through the film. */
export const AIMark: React.FC<{x: number; y: number; s?: number; rot?: number; op?: number}> = ({x, y, s = 1, rot = 0, op = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <rect x={-40} y={-27} width={80} height={54} rx={14} fill={C.saffron} stroke={INK} strokeWidth={5} />
    <text x={0} y={2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={44} letterSpacing={2} fill={INK}>AI</text>
  </g>
);

/** SUBMIT button: press 0..1 depresses the face; sent switches to SENT; dim 0..1 greys it out (a button that is not enabled yet) */
export const Button2: React.FC<{r: Rect; press?: number; sent?: boolean; dim?: number; op?: number}> = ({r, press = 0, sent = false, dim = 0, op = 1}) => {
  const lift = 12 * (1 - press);
  const fill = dim > 0 ? mix(sent ? C.teal : C.coral, '#8E9FA5', dim) : sent ? C.teal : C.coral;
  const base = dim > 0 ? mix(sent ? C.tealDeep : C.coralDeep, '#6F8590', dim) : sent ? C.tealDeep : C.coralDeep;
  const fs = Math.round(r.h * 0.6);
  return (
    <g opacity={op}>
      <rect x={r.x + 6} y={r.y + 18} width={r.w} height={r.h} rx={26} fill={INK} opacity={0.22} />
      <rect x={r.x} y={r.y + 12} width={r.w} height={r.h} rx={26} fill={base} stroke={INK} strokeWidth={7} />
      <g transform={`translate(0 ${12 - lift})`}>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={26} fill={fill} stroke={INK} strokeWidth={7} />
        {sent ? (
          <g>
            <path d={`M ${r.x + r.w / 2 - 90} ${r.y + r.h / 2 + 2} l 22 24 l 38 -46`} fill="none" stroke={CREAM} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
            <text x={r.x + r.w / 2 + 40} y={r.y + r.h / 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={fs} fill={CREAM} letterSpacing={1}>SENT</text>
          </g>
        ) : (
          <text x={r.x + r.w / 2} y={r.y + r.h / 2} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={fs} fill={CREAM} letterSpacing={2}>SUBMIT</text>
        )}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ captions (V2: scene-adaptive ink/cream, Montserrat ExtraBold, clean outline) */
export const CAP2 = {size: 76, lh: 90, maxW: 770, cx: 486, baseline: 1428, min: 72};
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

/** Background changes (V3.1): one flat colour field cross-fades over 8 frames; the caption contrast flips ONCE, at the middle of each change (both styles carry a halo, so either reads on either field). */
export const BG_FRAMES = 8;
export const T_CREAM = EV['b3.start'];            // ink -> cream on "Except…"
export const T_INK = EV['b6.start'] - 2;          // cream -> ink at the takeaway
export const bgCream = (g: number) => E.inOut(tw(g, T_CREAM, BG_FRAMES, (x) => x)) * (1 - E.inOut(tw(g, T_INK, BG_FRAMES, (x) => x)));
/** 0 = dark scene (cream text, ink halo), 1 = cream scene (ink text, cream halo): a hard switch, never a cross-fade */
export const creamness = (g: number) => (g >= T_CREAM + BG_FRAMES / 2 && g < T_INK + BG_FRAMES / 2 ? 1 : 0);

export const Captions2: React.FC<{g: number}> = ({g}) => {
  const ci = CAPS.findIndex((k) => g >= k.from && g < k.to);
  if (ci < 0 || CAPS[ci].integrated) return null;   // the first sentence is the giant opening headline (no lane caption under it)
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

/* ------------------------------------------------------------------ the recurring packet: an envelope with the AI corner mark (400 x 280 at s = 1, centred on (x, y)) */
export const DEEP = '#EADFC0';   // darker paper for envelopes / page bars
export const Env3: React.FC<{x: number; y: number; s?: number; rot?: number; flap?: number; children?: React.ReactNode; clipId?: string; front?: number; op?: number; mark?: number}> = ({x, y, s = 1, rot = 0, flap = 1, children, clipId, front = 1, op = 1, mark = 1}) => {
  // flap 0 = open (apex up), 1 = closed
  const apex = lerp(-300, 78, flap);
  const closed = flap > 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
      <rect x={-188} y={-128} width={400} height={280} rx={22} fill={INK} opacity={0.2} />
      <rect x={-200} y={-140} width={400} height={280} rx={22} fill={DEEP} stroke={INK} strokeWidth={8} />
      {!closed && <path d={`M -200 -140 L 0 ${apex} L 200 -140 Z`} fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />}
      {clipId ? <g clipPath={`url(#${clipId})`}>{children}</g> : children}
      <g opacity={front}>
        <path d="M -200 140 L -200 -70 L 0 62 L 200 -70 L 200 140 Z" fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -200 140 L 0 -20" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.35} />
        <path d="M 200 140 L 0 -20" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      </g>
      {closed && <path d={`M -200 -140 L 0 ${apex} L 200 -140 Z`} fill={DEEP} stroke={INK} strokeWidth={8} strokeLinejoin="round" />}
      <circle cx={0} cy={lerp(20, 70, flap)} r={20} fill={C.coral} stroke={INK} strokeWidth={6} opacity={flap > 0.9 ? 1 : 0} />
      <AIMark x={150} y={104} s={1.1} rot={-6} op={mark * front} />
    </g>
  );
};

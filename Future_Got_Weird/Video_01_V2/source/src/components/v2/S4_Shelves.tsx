import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';

/**
 * S4 library bookcase (V2). The same look as Props/BookRow (flat colour spines, ink outline, serif spine words), but
 * every book is an addressable object so the scene can light, tip, pull and glint individual spines, and the one
 * missing book leaves a registered slot. Coordinates are the shelf layer's own space (the scene puts it on a Layer).
 */

export const ROWS = [300, 490, 680, 870]; // top surface of each shelf board
export const BOARD = 16;
export const SHELF_X0 = -340;
export const SHELF_X1 = 2480;
export const UPRIGHTS = [-340, 520, 1210, 1960, 2456];
export const UPRIGHT_W = 24;
export const CORNICE_Y = 112;
export const FLOOR_Y = 896;
export const SLOT = {row: 1, x0: 860, x1: 960}; // the missing book's place (row 1, above the catalogue)

export const PATTERN_WORDS = ['Methods', 'Algorithms', 'Machine Learning', 'Learning', 'Theory', 'Online', 'Topics in', 'Analysis', 'Models', 'Approaches'];
const PALETTE = [C.coral, C.teal, C.blue, C.saffron, C.woodDeep, C.tealDeep, C.blueDeep, C.coralDeep, '#8E6CB8', '#5B9A52'];

export type Book = {
  i: number;
  id?: string;
  row: number;
  x: number;
  w: number;
  h: number;
  bottom: number; // y of the book's bottom edge (board top, or the book below for a flat stack)
  col: string;
  word?: string;
  flat?: boolean;
  lean?: number; // resting lean (deg), pivot at the bottom corner on the side it leans away from
  pivot?: string; // transform origin override (e.g. a book that will lean later)
  pale?: boolean;
  plate?: {font: number; tone: 'cream' | 'saffron'; h: number}; // flat books: a horizontal printed label
  seal?: boolean; // a small gold seal sticker on the spine (the "confident" look; glints in s16)
};

/* ------------------------------------------------------------------ layout (deterministic) */
const SPECIALS: Omit<Book, 'i'>[] = [
  // s16 sources: title words that peel off and fill the card's blank title
  {id: 'boost', row: 1, x: 550, w: 46, h: 142, bottom: ROWS[1], col: C.blue, word: 'Boosting,', seal: true},
  {id: 'online', row: 1, x: 600, w: 44, h: 130, bottom: ROWS[1], col: C.teal, word: 'Online', seal: true},
  {id: 'algo1', row: 1, x: 648, w: 46, h: 140, bottom: ROWS[1], col: C.coral, word: 'Algorithms,', seal: true},
  {id: 'topics', row: 1, x: 698, w: 52, h: 146, bottom: ROWS[1], col: C.tealDeep, word: 'and Other Topics in', seal: true},
  {id: 'mlearn1', row: 1, x: 754, w: 48, h: 136, bottom: ROWS[1], col: '#8E6CB8', word: 'Machine Learning.', seal: true},
  // the slot: a plain pale book fills it until "rarely" (so no hole is on screen before the beat); it then thins,
  // the two neighbours lean in towards it (pivoting on their inner bottom corners), and it is gone on "not at all"
  {id: 'leanL', row: 1, x: 830, w: 28, h: 124, bottom: ROWS[1], col: C.saffronDeep, pivot: '100% 100%'},
  {id: 'pamph', row: 1, x: 865, w: 90, h: 136, bottom: ROWS[1], col: C.paperLine, pale: true},
  {id: 'leanR', row: 1, x: 962, w: 30, h: 130, bottom: ROWS[1], col: C.blueDeep, pivot: '0% 100%'},
  // s14: the three called-out spines round the clerk's first spot
  {id: 'methods', row: 1, x: 1150, w: 48, h: 140, bottom: ROWS[1], col: C.blueDeep, word: 'Methods', seal: true},
  {id: 'ml', row: 1, x: 1446, w: 50, h: 142, bottom: ROWS[1], col: '#5B9A52', word: 'Machine Learning', seal: true},
  // s16: the gold seal lifts off this spine (right of the clerk at the catalogue)
  {id: 'sealsrc', row: 2, x: 1250, w: 50, h: 140, bottom: ROWS[2], col: C.coralDeep, word: 'Theory', seal: true},
  // the opening match cut: a stack of three flat books, the middle one printed "Algorithms"
  {id: 'stackB', row: 2, x: 1536, w: 262, h: 40, bottom: ROWS[2], col: C.teal, flat: true, word: 'Theory', plate: {font: 18, tone: 'cream', h: 29}},
  {id: 'algo0', row: 2, x: 1522, w: 292, h: 66, bottom: ROWS[2] - 40, col: C.blue, flat: true, word: 'Algorithms', plate: {font: 34, tone: 'saffron', h: 52}},
  {id: 'stackT', row: 2, x: 1552, w: 238, h: 36, bottom: ROWS[2] - 106, col: C.coral, flat: true, word: 'Analysis', plate: {font: 17, tone: 'cream', h: 27}},
];
// horizontal ranges no generated book may enter, per row (the specials' footprints, uprights, the slot)
const blocked = (row: number) => {
  const r: [number, number][] = UPRIGHTS.map((u) => [u - 2, u + UPRIGHT_W + 2]);
  for (const s of SPECIALS) if (s.row === row) r.push([s.x - 3, s.x + s.w + 3]);
  if (row === SLOT.row) r.push([SLOT.x0 - 30, SLOT.x1 + 2]);
  return r.sort((a, b) => a[0] - b[0]);
};

const build = (): Book[] => {
  const out: Book[] = [];
  let i = 0;
  for (const s of SPECIALS) out.push({...s, i: i++});
  for (let row = 0; row < ROWS.length; row++) {
    const bl = blocked(row);
    let x = SHELF_X0 + UPRIGHT_W + 4;
    let k = 0;
    while (x < SHELF_X1 - 30) {
      const seed = row * 997 + k * 13 + 5;
      // occasional stack of flat books
      const stack = rand(seed + 1) < 0.05;
      let w = stack ? 96 + Math.floor(rand(seed + 2) * 30) : 26 + Math.floor(rand(seed + 3) * 30);
      const hit = bl.find(([a, b]) => x + w > a && x < b);
      if (hit) {
        // fill up to the obstacle with one narrower book if it fits, then jump past it
        const room = hit[0] - x - 3;
        if (!stack && room >= 22 && hit[0] > x) {
          out.push(mk(i++, row, x, Math.min(room, w), seed));
        }
        x = hit[1] + 2;
        k++;
        continue;
      }
      if (stack) {
        const n = 2 + Math.floor(rand(seed + 4) * 2);
        let bottom = ROWS[row];
        for (let j = 0; j < n; j++) {
          const h = 22 + Math.floor(rand(seed + 10 + j) * 10);
          const ww = w - Math.floor(rand(seed + 20 + j) * 18);
          out.push({i: i++, row, x: x + (w - ww) / 2 + (rand(seed + 30 + j) - 0.5) * 8, w: ww, h, bottom, col: PALETTE[Math.floor(rand(seed + 40 + j) * PALETTE.length)], flat: true});
          bottom -= h;
        }
      } else {
        out.push(mk(i++, row, x, w, seed));
      }
      x += w + 3;
      k++;
    }
  }
  return out;
};
const mk = (i: number, row: number, x: number, w: number, seed: number): Book => {
  const h = 104 + Math.floor(rand(seed + 5) * 42);
  const word = w >= 36 && rand(seed + 6) < 0.42 ? PATTERN_WORDS[Math.floor(rand(seed + 7) * PATTERN_WORDS.length)] : undefined;
  return {i, row, x, w, h, bottom: ROWS[row], col: PALETTE[Math.floor(rand(seed + 8) * PALETTE.length)], word, seal: !!word && rand(seed + 9) < 0.7};
};

export const BOOKS: Book[] = build();
export const BOOK = (id: string) => {
  const b = BOOKS.find((x) => x.id === id);
  if (!b) throw new Error('no book ' + id);
  return b;
};
/** Centre of a book (shelf-layer coords). */
export const bookCenter = (b: Book) => ({x: b.x + b.w / 2, y: b.bottom - b.h / 2});
/** Where the spine word sits (shelf-layer coords): the label's centre. */
export const spineWordAt = (b: Book) => ({x: b.x + b.w / 2, y: b.bottom - b.h / 2});

/* ------------------------------------------------------------------ rendering */
export type BookFx = {dx?: number; dy?: number; rot?: number; s?: number; lit?: number; glint?: number; thin?: number; recede?: number; hidden?: boolean; wordOff?: number; sealOff?: boolean; bright?: number};

const spineFont = (b: Book) => {
  if (!b.word) return 15;
  return Math.max(11, Math.min(15, (b.h - 22) / (b.word.length * 0.5)));
};

const BookArt: React.FC<{b: Book; fx: BookFx}> = ({b, fx}) => {
  if (fx.hidden) return null;
  const lit = Math.max(0, Math.min(1, fx.lit ?? 0));
  const glint = fx.glint ?? 0;
  const thin = fx.thin ?? 0;
  const recede = fx.recede ?? 0;
  const lean = b.lean ?? 0;
  const origin = b.pivot ?? (lean > 0 ? '100% 100%' : lean < 0 ? '0% 100%' : '50% 100%');
  const s = (fx.s ?? 1) * (1 - 0.16 * recede);
  const tr = `translate(${fx.dx ?? 0}px, ${(fx.dy ?? 0) - recede * 6}px) rotate(${lean + (fx.rot ?? 0)}deg) scale(${s * (1 - 0.55 * thin)}, ${s})`;
  const labelBg = lit > 0 ? mix(C.cream, C.saffron, lit) : C.cream;
  const wordOff = fx.wordOff ?? 0; // 1 = the word has peeled off (label left blank)
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x,
        top: b.bottom - b.h,
        width: b.w,
        height: b.h,
        transform: tr,
        transformOrigin: origin,
        filter: recede > 0 || (fx.bright ?? 1) !== 1 ? `brightness(${(1 - 0.75 * recede) * (fx.bright ?? 1)})` : undefined,
      }}
    >
      <div style={{position: 'absolute', inset: 0, background: b.col, border: `3px solid ${C.ink}`, borderRadius: b.flat ? 5 : 4, boxShadow: lit > 0 ? `0 0 ${22 * lit}px ${7 * lit}px rgba(255,199,68,${0.85 * lit})` : undefined}} />
      {b.pale && (
        <>
          <div style={{position: 'absolute', left: 4, right: 4, top: 10, height: 2, background: C.inkMuted, opacity: 0.4}} />
          {/* a blank spine label: the title that is not there */}
          <div style={{position: 'absolute', left: '30%', right: '30%', top: 22, bottom: 30, border: `2px dashed ${C.inkMuted}`, borderRadius: 3, opacity: 0.5}} />
          <div style={{position: 'absolute', left: 4, right: 4, bottom: 10, height: 2, background: C.inkMuted, opacity: 0.3}} />
        </>
      )}
      {!b.flat && !b.word && !b.pale && (
        <>
          <div style={{position: 'absolute', left: 5, right: 5, top: 12, height: 4, background: 'rgba(255,255,255,0.45)', borderRadius: 2}} />
          <div style={{position: 'absolute', left: 5, right: 5, bottom: 12, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2}} />
        </>
      )}
      {!b.flat && b.word && (
        <div style={{position: 'absolute', left: 6, right: 6, top: 10, bottom: b.seal ? 30 : 10, background: labelBg, border: `2px solid ${C.ink}`, borderRadius: 3, overflow: 'hidden'}}>
          {wordOff < 1 && (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', transform: `rotate(180deg) translateX(${wordOff * 30}px)`, fontFamily: F.serif, fontWeight: 600, fontSize: spineFont(b), color: C.ink, whiteSpace: 'nowrap', letterSpacing: '0.01em', opacity: 1 - wordOff}}>
              {b.word}
            </div>
          )}
        </div>
      )}
      {b.flat && b.plate && (
        <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: b.plate.tone === 'saffron' ? mix(C.saffronLight, C.saffron, lit) : labelBg, border: `2px solid ${C.ink}`, borderRadius: 4, padding: `0 ${b.plate.font * 0.45}px`, height: b.plate.h, display: 'flex', alignItems: 'center', boxSizing: 'border-box'}}>
          <div style={{fontFamily: F.serif, fontWeight: 400, fontSize: b.plate.font, lineHeight: 1, color: C.ink, whiteSpace: 'nowrap'}}>{b.word}</div>
        </div>
      )}
      {b.flat && !b.plate && <div style={{position: 'absolute', left: 10, right: 10, top: '45%', height: 3, background: 'rgba(255,255,255,0.45)', borderRadius: 2}} />}
      {b.seal && !b.flat && !fx.sealOff && (
        <div style={{position: 'absolute', left: '50%', bottom: 8, width: 16, height: 16, marginLeft: -8, borderRadius: '50%', background: C.saffron, border: `2px solid ${C.saffronDeep}`, boxShadow: glint > 0 ? `0 0 ${14 * glint}px ${6 * glint}px rgba(255,236,170,${0.95 * glint})` : undefined}} />
      )}
    </div>
  );
};

const hex = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const m = A.map((v, k) => Math.round(v + (B[k] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

/** The whole bookcase wall: back panels, boards, uprights, cornice, books and the floor in front of it. */
export const Bookcase: React.FC<{fx: (b: Book) => BookFx; children?: React.ReactNode; slotShade?: number}> = ({fx, children, slotShade = 0}) => (
  <>
    {/* cornice */}
    <div style={{position: 'absolute', left: SHELF_X0 - 10, top: CORNICE_Y - 22, width: SHELF_X1 - SHELF_X0 + 20, height: 30, background: C.woodDeep, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6}} />
    {/* back panels behind each row: a slightly deeper teal so the slot reads as the back of a shelf, not a hole */}
    {ROWS.map((y, r) => (
      <div key={r} style={{position: 'absolute', left: SHELF_X0, top: y - 178, width: SHELF_X1 - SHELF_X0, height: 178, background: 'rgba(18,128,120,0.16)'}} />
    ))}
    {/* the slot's shadow (the depth of the empty place): only once the pale book has thinned / gone */}
    <div style={{position: 'absolute', left: SLOT.x0 - 4, top: ROWS[SLOT.row - 1] + BOARD, width: SLOT.x1 - SLOT.x0 + 8, height: ROWS[SLOT.row] - ROWS[SLOT.row - 1] - BOARD, background: `linear-gradient(180deg, rgba(22,42,50,${0.54 * slotShade}) 0%, rgba(22,42,50,${0.32 * slotShade}) 100%)`}} />
    {BOOKS.map((b) => (
      <BookArt key={b.i} b={b} fx={fx(b)} />
    ))}
    {ROWS.map((y, r) => (
      <div key={r} style={{position: 'absolute', left: SHELF_X0 - 6, top: y, width: SHELF_X1 - SHELF_X0 + 12, height: BOARD, background: C.wood, border: `3px solid ${C.ink}`, borderRadius: 3}} />
    ))}
    {UPRIGHTS.map((x) => (
      <div key={x} style={{position: 'absolute', left: x, top: CORNICE_Y, width: UPRIGHT_W, height: FLOOR_Y - CORNICE_Y, background: C.woodDeep, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 3}} />
    ))}
    {/* plinth and floor (the floor's far edge meets the bookcase, so it lives on the same layer) */}
    <div style={{position: 'absolute', left: -1200, top: FLOOR_Y, width: 4800, height: 900, background: C.woodLight, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 26, height: 10, background: C.wood, opacity: 0.5}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, height: 8, background: C.wood, opacity: 0.35}} />
    </div>
    {children}
  </>
);

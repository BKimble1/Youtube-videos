import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, SOFT, camKick, camPath, drop, impact, kf, ring, sp, tw} from '../lib/motion';
import {C, F, OUTLINE} from '../theme';
import {Marked, RingMark} from '../components/Props';
import {Sfx} from '../lib/sfx';
import {BOARD_ROW, BoardRow, CounterPanel, DocCard, Leaderboard, NAVY, RailSlot, RuleCard, SLATE, SlotFace, TapeStrip, TrophyS7} from '../components/v2/S7_Props';

/**
 * S7 — the benchmarks (s26–s27). The hinge from S6's illustrative quiz to real evidence: Table 2 of Kalai, Nachum,
 * Vempala & Zhang (2025), shown as is (crop / zoom only), counted row by row; then the consequence on an illustrative
 * leaderboard, and the honest hedge.
 *
 * Beat sheet (every cue is a word of the V2 narration; frames are global):
 *  pre   5838–5857  wipe in (10 f) on a clean, living shot of the stack: the paper's own header (title + four authors,
 *                   the same crop S1 landed on the counter) taped over Table 2, which lies out of focus underneath; the
 *                   camera is already pushing in.
 *  s26 "The researchers"  the push settles on the author line; four teal underlines run under the four names.
 *       "checked"         the header page is peeled up and whisked off; focus racks onto Table 2 underneath and its
 *                         citation tag slides out from under the sheet; the camera pulls back to the whole sheet (frame
 *                         B1: sheet + rail + citation tag).
 *       "ten widely used benchmarks"  a light scans down the ten rows; each row's slot on the rail lights with its
 *                         number (1…10, rising ticks); a "10" badge pops on the rail's head.
 *       "in mid-2025."    a saffron marker swipes "mid-2025" in the citation tag; the camera trucks right and pushes into
 *                         the grading columns (frame B: Binary + IDK columns, rail, tally panel; the caption, cut by the
 *                         frame's left edge, recedes under a paper wash except the definition of binary grading, which
 *                         comes forward with its highlight on "strictly"); the panel's date flap
 *                         flips to SAMPLED MID-2025; then the count runs: each "Yes" gets a teal pill, its slot flips to
 *                         ✓ and the drum rolls one more — WildBench's slot flips to a dashed "–" and the drum holds —
 *                         landing on 9 exactly on "Nine".
 *       "graded strictly … right or wrong,"  the label writes on under the drum in two pops; the paper's own definition
 *                         ("strict correct/incorrect") is highlighted in the caption; on "wrong," WildBench's "No" is
 *                         ringed, its slot shakes, and a "WildBench: partial credit" tag slides out of the rail.
 *       "with no credit at all for “I don't know.”"  the teal pills step back; coral pills cascade down the IDK column
 *                         (WildBench's "Partial" ringed instead); on "I don't know" S6's face-down rule card flips to
 *                         '“I don't know”' and its 0 flap drops on "know"; the coral column pulses once.
 *  s27 "Train and rank models"  pull out to the full exhibit (frame C) as an illustrative leaderboard rises from below
 *                         into the space the close-up never showed; its bars fill in scrambled order on "rank", then the
 *                         rows re-sort into rank order and #1 #2 #3 stamp in.
 *       "on tests like that,"  a coral marker line brackets the IDK column and runs into the #1 row.
 *       "and guessing pays."  a shadow appears on the board's free edge ("guessing"); the S6 trophy drops onto it on
 *                         "pays." (squash, bounce, clink); the #1 bar jolts, the honest row sags; "guessing pays" pops.
 *       "It's one explanation, not the whole story."  the honest note slides up under the table and is taped down; "not
 *                         the whole story" writes on with its words while the argument marks (pills, line, bars, trophy)
 *                         dim; the real table, citation and "illustration" label never dim.
 *       "But it is a simple one."  everything re-brightens; one pulse runs the chain (IDK column → line → #1 bar →
 *                         trophy, which wobbles); "But a simple one." pops in on "simple"; hold, alive, under S8's wipe.
 *
 * Framings (world rectangles they must contain; see SHOTS): A0 = the whole stack with the sheet's bottom edge clear
 * (header x 26–1258); A = the four names (x 122–1161), card and sheet sides cut well outside the frame; B1 = sheet +
 * rail + tag (x 70–1273, y 151–871), never the tally zone (x ≥ 1340); B = Binary/IDK columns + caption + rail + tally
 * zone (x 782–1810, y 187–765): left edge in the white gap after the Scoring-method column, top below the sheet's
 * tapes, bottom above the tag; C = everything (x 70–1948, y 151–1122) with ≈ 50 px side margins.
 */

/* ------------------------------------------------------------------ world layout */
// Table 2 (paper_p14_table2.png, 3933 × 2250): shown down to the table's bottom rule (footnotes cropped).
const NAT_W = 3933;
const NAT_H = 2250;
const CROP = 1840;
const IW = 1100;
const KI = IW / NAT_W;
const SHEET = {x: 70, y: 170, pad: 18};
const SHEET_W = IW + 2 * (SHEET.pad + OUTLINE);
const SHEET_H = CROP * KI + 2 * (SHEET.pad + OUTLINE);
const IX = SHEET.x + OUTLINE + SHEET.pad;
const IY = SHEET.y + OUTLINE + SHEET.pad;
const ix = (px: number) => IX + px * KI;
const iy = (py: number) => IY + py * KI;
/** vertical centre of a data row's cap height (rows measured on the image: cap tops 680 + 112.8 r) */
const rowY = (r: number) => iy(711 + 112.8 * r);
const ROWS = 10;
const WB = 4; // WildBench: the exception (Binary "No", IDK "Partial")
const PILL_H = 27;
const YES = {x0: ix(2805) - 10, x1: ix(2937) + 10};
const YES_A = ix(2973) + 10; // row 2 carries a superscript
const NO_WB = {x0: ix(2818), x1: ix(2925)};
const NONE = {x0: ix(3468) - 10, x1: ix(3666) + 10};
const PARTIAL = {x0: ix(3435), x1: ix(3739)};
const STRICT = {x0: ix(2907) - 4, x1: ix(3815) + 4, y0: iy(186), y1: iy(252)}; // "strict correct/incorrect", caption line 2

const SHEET_TAPE = 64; // tape centres, card-local, in from each side
// the rail of ten slots, clipped to the sheet's right edge, and the tally zone to its right
const RAIL = {x: SHEET.x + SHEET_W + 4, w: 48, top: 324, bottom: 694};
const SLOT = {w: 36, h: 26};
// the column is narrow enough that the trophy (falling at x ≥ 1808) clears it by ≥ 40 px, and its pieces breathe
const ZONE = {x: 1340, w: 410};
const PANEL = {x: ZONE.x, y: 214, w: ZONE.w, h: 170};
const LABEL_Y = 398; // two lines, 38 apart → bottom ≈ 473
const WTAG = {y: 488}; // two lines → bottom ≈ 579
const CARD = {x: ZONE.x, y: 598, w: ZONE.w, h: 102}; // bottom 700 (+8 shadow); the board's sign starts at 742
// citation tag under the sheet; the honest note under that; the leaderboard under the tally zone
const TAG = {x: IX - 4, y: 770}; // hidden behind the sheet (TAG_HIDE) until it slides out on "checked"
const TAG_HIDE = -150;
const BOARD = {x: 900, y: 772, w: 1040, h: 340}; // right edge 1940 (+8 shadow): ≈ 50 px clear of the wide frame // under the grading columns and the tally zone
const NOTE = {x: IX, y: BOARD.y + BOARD.h - 200, w: 768, h: 200}; // the honest note: under the tag, bottoms aligned with the board
const TROPHY = {x: BOARD.x + BOARD.w - 80, s: 0.9}; // stands on the board's free right edge (handles x ≈ 1796–1924)
const SAG = 1.4; // degrees the honest row slumps (its right end stays clear of the "illustration" chip)

// the paper's header (paper_p01_header.png, 4000 × 883), cropped above the date line. It is a little wider than the
// table sheet and sits over the sheet's top edge, so it hides the sheet's own corner tapes (x 36–1248, y 146–198):
// nothing of them can show as a sliver at the frame sides while the camera pushes in. Its own tapes are inboard.
const HEAD = {natW: 4000, natH: 883, crop: 680, iw: 1180, pad: 22};
const KH = HEAD.iw / HEAD.natW;
const HEAD_W = HEAD.iw + 2 * (HEAD.pad + OUTLINE);
const HEAD_H = HEAD.crop * KH + 2 * (HEAD.pad + OUTLINE);
const HEAD_X = SHEET.x + SHEET_W / 2 - HEAD_W / 2; // x 26–1258
const HEAD_Y = 136; // y 136–389: covers the caption, the header row and row 0; the rest of the table is out of focus below
const HEAD_TAPE = 190; // tape centres, card-local, in from each side
const NAMES: [number, number][] = [
  [239, 1130],
  [1358, 1900],
  [2129, 2998],
  [3197, 3760],
];
const NAME_UL_Y = 505; // image px, in the gap between the names' descenders and the affiliations

// the coral line from the IDK column into the #1 row
// a bracket down the IDK column's right margin, then down through the gap under the sheet onto the #1 badge
const STRING_END = {x: BOARD.x + 18 + BOARD_ROW.rankW / 2, y: BOARD.y + BOARD_ROW.top};
const STRING_D = `M 1160 ${rowY(0) - 8} Q 1178 ${rowY(0) - 8} 1178 ${rowY(0) + 8} L 1178 ${rowY(9) - 4} C 1178 ${rowY(9) + 90} ${STRING_END.x} ${STRING_END.y - 76} ${STRING_END.x} ${STRING_END.y - 6}`;

/* ------------------------------------------------------------------ cues (global frames) */
const SC = scene('S7');
const K = {
  first: SC.from - 5, // first rendered frame (the S6 → S7 wipe is centred on SC.from)
  last: SC.to + 5, // last rendered frame (under the S8 wipe)
  // s26
  the: at('s26', 'The'),
  researchers: at('s26', 'researchers'),
  checked: at('s26', 'checked'),
  ten: at('s26', 'ten'),
  widely: at('s26', 'widely'),
  benchmarks: at('s26', 'benchmarks'),
  in: at('s26', 'in'),
  mid: at('s26', 'mid-2025'),
  nine: at('s26', 'Nine'),
  graded: at('s26', 'graded'),
  strictly: at('s26', 'strictly'),
  right: at('s26', 'right'),
  wrong: at('s26', 'wrong'),
  with: at('s26', 'with'),
  no: at('s26', 'no'),
  i: at('s26', 'I'),
  know: at('s26', 'know'),
  knowEnd: at('s26', 'know', 1, 'end'),
  // s27
  train: at('s27', 'Train'),
  rank: at('s27', 'rank'),
  tests: at('s27', 'tests'),
  that: at('s27', 'that'),
  guessing: at('s27', 'guessing'),
  pays: at('s27', 'pays'),
  its: at('s27', "It's"),
  not: at('s27', 'not'),
  story: at('s27', 'story'),
  but: at('s27', 'But'),
  simple: at('s27', 'simple'),
  oneEnd: at('s27', 'one', 2, 'end'),
};
const UL = NAMES.map((_, k) => K.researchers - 2 + 3 * k); // the four name underlines
const LIFT = K.checked; // the header page is peeled up …
const WHISK = K.checked + 4; // … and whisked off; focus racks from the header onto the table underneath
const TAG_OUT = K.checked + 2; // the citation tag slides out from under the sheet's bottom edge
const RAIL_OUT = K.ten; // the rail slides out from behind the sheet …
const ROWT = Array.from({length: ROWS}, (_, r) => K.ten + 7 + 2 * r); // … then the scan numbers its slots 1…10
const BADGE = K.benchmarks - 2;
const SWIPE = K.mid - 3;
const PLATE = K.mid + 20;
const CASC = Array.from({length: ROWS}, (_, r) => K.nine - 24 + Math.round((r * 21) / 9)); // the drum settles on 9 on "Nine"
const LABEL1 = K.graded;
const HILITE = K.strictly;
const LABEL2 = K.right + 1;
const WB_RING = K.wrong + 1;
const WB_TAG = K.wrong + 7;
const TEAL_DIM = K.with - 2;
const CORAL = Array.from({length: ROWS}, (_, r) => K.no + 2 + 3 * r);
const CARD_FLIP = K.i - 3;
const ZERO = K.know + 1;
const COL_PULSE = K.know + 10;
const RISE = K.train + 8; // rises under the pull-out and lands as the camera arrives
const BOARD_LAND = RISE + 13;
const BAR = [0, 1, 2].map((s) => K.rank + 16 + 5 * s); // bars fill in their (scrambled) display order
const SORT = K.tests + 8;
const RANKS = [0, 1, 2].map((s) => SORT + 9 + 2 * s);
const STRING = K.that + 5;
const SHADOW = K.guessing + 2;
const LAND = K.pays + 2;
const PAYS_CHIP = LAND + 10;
const GLINT = LAND + 18;
const NOTE_IN = K.its - 2;
const NOTE_LAND = NOTE_IN + 11;
const TAPES = [NOTE_LAND + 2, NOTE_LAND + 6];
const NOT_WRITE = K.not;
const DIM = K.not + 4;
const BRIGHT = K.but;
const PULSE_STRING = K.but + 1;
const PULSE_BAR = PULSE_STRING + 13;
const WOBBLE = PULSE_BAR + 10;
const LINE2 = K.simple - 1;

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
export const SFX: Sfx[] = [
  {f: UL[0], kind: 'marker_sweep', gain: -5, note: 'teal underlines under the four authors'},
  {f: UL[2], kind: 'marker_sweep', gain: -7, pitch: 3},
  {f: LIFT, kind: 'tape_rip', gain: -8, note: 'the header page is peeled up'},
  {f: LIFT + 1, kind: 'paper_lift', gain: -6},
  {f: WHISK, kind: 'paper_swish', gain: -5},
  {f: TAG_OUT + 5, kind: 'paper_slide', gain: -10, pitch: 3, note: 'citation tag slides out from under the sheet'},
  {f: RAIL_OUT + 5, kind: 'card_slide', gain: -5, note: 'the rail slides out from behind the sheet'},
  ...ROWT.map((f, r) => ({f, kind: 'prob_tick' as const, pitch: r, gain: -10, note: r === 0 ? 'slots light 1…10 as the scan runs down the rows' : undefined})),
  {f: BADGE, kind: 'chip_pop', gain: -4, note: '"10" badge'},
  {f: SWIPE, kind: 'marker_sweep', pitch: 2, gain: -4, note: 'mid-2025 in the citation'},
  {f: PLATE + 2, kind: 'card_flick', gain: -5, note: 'date flap flips on the tally panel'},
  ...CASC.map((f, r) =>
    r === WB
      ? {f, kind: 'thud_soft' as const, gain: -10, note: 'WildBench: dashed slot, the drum holds'}
      : {f, kind: 'score_flip' as const, pitch: Math.min(8, r), gain: r === ROWS - 1 ? 0 : -6, note: r === ROWS - 1 ? 'the ninth tick lands on "Nine"' : undefined},
  ),
  {f: LABEL1, kind: 'pop_tick', gain: -8, note: 'graded strictly'},
  {f: HILITE, kind: 'marker_sweep', pitch: 1, gain: -4, note: '"strict correct/incorrect" in the caption'},
  {f: LABEL2, kind: 'pop_tick', pitch: 2, gain: -8, note: 'right or wrong'},
  {f: WB_RING, kind: 'marker_circle', gain: -4},
  {f: WB_TAG, kind: 'paper_slide', gain: -7, note: 'WildBench tag slides out of the rail'},
  ...CORAL.map((f, r) =>
    r === WB ? {f, kind: 'marker_circle' as const, pitch: -2, gain: -8, note: 'Partial ringed'} : {f, kind: 'prob_tick' as const, pitch: -r, gain: -10},
  ),
  {f: CARD_FLIP + 3, kind: 'card_flick', note: 'S6 rule card flips to “I don’t know”'},
  {f: ZERO, kind: 'score_flip', pitch: -4, gain: -2, note: 'its 0 drops in'},
  {f: BOARD_LAND, kind: 'thud_soft', gain: -2, note: 'leaderboard rises into place'},
  ...BAR.map((f, s) => ({f, kind: 'prob_tick' as const, pitch: 4 + 2 * s, gain: -7})),
  {f: SORT, kind: 'card_slide', gain: -6, note: 'rows re-sort into rank order'},
  ...RANKS.map((f, s) => ({f, kind: 'pop_tick' as const, pitch: 3 - 2 * s, gain: s === 0 ? -4 : -7, note: s === 0 ? '#1 #2 #3' : undefined})),
  {f: STRING, kind: 'marker_sweep', pitch: -4, gain: -6, note: 'coral line from the IDK column to #1'},
  {f: LAND, kind: 'trophy_clink', note: 'the trophy lands on "pays."'},
  {f: PAYS_CHIP, kind: 'chip_pop', gain: -3, note: 'guessing pays'},
  {f: GLINT, kind: 'glint', gain: -10},
  {f: NOTE_IN, kind: 'paper_slide', gain: -6, note: 'the honest note slides up'},
  {f: TAPES[0], kind: 'tape_rip', gain: -7},
  {f: TAPES[1], kind: 'tape_rip', gain: -9, pitch: 2},
  {f: NOT_WRITE, kind: 'marker_sweep', gain: -12, note: 'not the whole story'},
  {f: PULSE_STRING, kind: 'marker_sweep', pitch: 5, gain: -11, note: 'one pulse runs the chain'},
  {f: WOBBLE, kind: 'glint', gain: -9, pitch: 2},
  {f: LINE2, kind: 'chip_pop', gain: -4, note: 'But a simple one.'},
  {f: K.oneEnd + 1, kind: 'paper_swish', gain: -12, note: 'short paper wipe to S8'},
];

/* ------------------------------------------------------------------ camera */
const SHOTS = {
  a0: {cx: 642, cy: 400, zoom: 1.45}, // the whole stack: x -20–1304 (header 26–1258, 67 px clear), y 28–772 (sheet shadow ends 741)
  a: {cx: 642, cy: 322, zoom: 1.74}, // pushed onto the author line: names x 122–1161 sit 56 px in; card and sheet sides cut clearly
  b1: {cx: 652, cy: 515, zoom: 1.4}, // sheet + rail + tag: x -34–1338 (zone starts 1340), y 129–901 (tapes from 151, tag ends 871)
  b1b: {cx: 652, cy: 515, zoom: 1.412},
  b: {cx: 1296, cy: 476, zoom: 1.868}, // x 782–1810 (left edge in the white gap after Scoring method), y 187–765: below the tapes, above the tag (770)
  b2: {cx: 1296, cy: 476, zoom: 1.88},
  c: {cx: 1009, cy: 628, zoom: 0.97}, // the whole exhibit: x 19–1999 (sheet 70 / board 1948 ≈ 50 px in), y 71–1185
  c2: {cx: 1009, cy: 632, zoom: 0.973},
};
const CAM_B1 = K.checked + 2;
const CAM_B = K.mid + 4;
const CAM_C = K.train - 4;
const camAt = (g: number): Cam => {
  const c = camPath(g, SHOTS.a0, [
    {at: K.first, dur: K.researchers + 6 - K.first, to: SHOTS.a, ease: E.inOut},
    {at: CAM_B1, dur: 18, to: SHOTS.b1},
    {at: CAM_B1 + 18, dur: CAM_B - CAM_B1 - 18, to: SHOTS.b1b, ease: E.linear},
    {at: CAM_B, dur: 18, to: SHOTS.b},
    {at: CAM_B + 18, dur: CAM_C - CAM_B - 18, to: SHOTS.b2, ease: E.linear},
    {at: CAM_C, dur: 26, to: SHOTS.c},
    {at: CAM_C + 26, dur: K.last - CAM_C - 26, to: SHOTS.c2, ease: E.inOut},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [CASC[ROWS - 1], LAND], 0.01)};
};

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const DIGIT = {damping: 13, stiffness: 300, mass: 0.6};

/** Face of a rail slot at frame g: (from, to, flip progress). */
const slotState = (r: number, g: number): {from: SlotFace; to: SlotFace; f: number} => {
  const end: SlotFace = r === WB ? 'dash' : 'check';
  if (g >= CASC[r]) return {from: 'num', to: end, f: Math.min(1, (g - CASC[r]) / 4)};
  if (g >= ROWT[r]) return {from: 'off', to: 'num', f: Math.min(1, (g - ROWT[r]) / 4)};
  return {from: 'off', to: 'off', f: 1};
};

/** The count on the drum: one spring per counted row, so each step rolls past and settles. */
const countAt = (g: number) => CASC.reduce((acc, f, r) => (r === WB ? acc : acc + sp(g, f, DIGIT)), 0);

/** Board rows: label, score, colour, their scrambled slot before "rank" and their ranked slot after. */
const ROW_DEF = [
  {label: 'always answers', fill: 0.94, tone: C.coral, s0: 1, s1: 0},
  {label: 'guesses often', fill: 0.78, tone: C.saffron, s0: 2, s1: 1},
  {label: 'says “I don’t know”', fill: 0.42, tone: SLATE, s0: 0, s1: 2},
];

/* ------------------------------------------------------------------ pieces */
const Backdrop: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -2400, top: -1600, width: 7000, height: 4600, background: C.paper, backgroundImage: 'radial-gradient(rgba(22,42,50,0.055) 2px, transparent 2.6px)', backgroundSize: '46px 46px'}} />
    <div style={{position: 'absolute', left: -2400, top: -1600, width: 7000, height: 1930, background: C.tealLight, transform: 'rotate(-2deg)', transformOrigin: '50% 100%'}} />
    <div style={{position: 'absolute', left: -2400, top: 318, width: 7000, height: 10, background: 'rgba(28,167,160,0.28)', transform: 'rotate(-2deg)', transformOrigin: '50% 0%'}} />
  </>
);

const HeaderPage: React.FC<{g: number}> = ({g}) => {
  if (g >= WHISK + 14) return null;
  const lift = tw(g, LIFT, 4, E.out);
  const away = tw(g, WHISK, 12, E.in);
  const rot = -0.4 + 0.15 * Math.sin(g * 0.05) * (1 - lift) + lift * 0.5 + away * 18;
  const flutter = 1.2 * ring(g, K.first + 10, 0.32, 0.06);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${away * 1150}px, ${-away * 760 - lift * 6}px)`}}>
      <DocCard src="img/paper_p01_header.png" natW={HEAD.natW} natH={HEAD.natH} cropPx={HEAD.crop} iw={HEAD.iw} pad={HEAD.pad} x={HEAD_X} y={HEAD_Y} rot={rot} shadow={12 + 14 * lift} scale={1 + 0.025 * lift}>
        {NAMES.map(([a, b], k) => {
          const t = tw(g, UL[k], 8, E.out);
          return t > 0 ? (
            <div key={k} style={{position: 'absolute', left: HEAD.pad + OUTLINE + a * KH, top: HEAD.pad + OUTLINE + NAME_UL_Y * KH - 3, width: (b - a) * KH * t, height: 7, borderRadius: 4, background: C.teal}} />
          ) : null;
        })}
        <TapeStrip x={HEAD_TAPE} y={4} rot={-6} lift={lift} />
        <TapeStrip x={HEAD_W - HEAD_TAPE} y={4} rot={5 + flutter} lift={lift} />
      </DocCard>
    </div>
  );
};

/** The tag sits behind the sheet until the header page comes off ("checked"), then slides down out from under the
 *  sheet's bottom edge with a small overshoot. */
const tagDy = (g: number) =>
  kf(g, [
    [TAG_OUT, TAG_HIDE],
    [TAG_OUT + 9, 7, E.out],
    [TAG_OUT + 14, 0, E.inOut],
  ]);
const CitationTag: React.FC<{g: number}> = ({g}) => (
  <div style={{position: 'absolute', left: TAG.x, top: TAG.y + tagDy(g)}}>
  <div style={{background: C.cream, border: `3px solid ${C.inkMuted}`, borderRadius: 18, padding: '9px 22px 10px', fontFamily: F.body, fontWeight: 800, fontSize: 31, lineHeight: 1.22, color: C.inkSoft, whiteSpace: 'nowrap', boxShadow: `4px 5px 0 rgba(22,42,50,0.12)`}}>
    <div>Kalai, Nachum, Vempala &amp; Zhang (2025) · Table 2</div>
    <div>
      <Marked spans={[{text: 'ten benchmarks sampled '}, {text: 'mid-2025', mark: 'ink', markT: tw(g, SWIPE, 8, E.out)}, {text: ' · CC BY 4.0'}]} />
    </div>
  </div>
  </div>
);

/** marks drawn on the real table (translucent, multiplied, so the glyphs stay on top) */
const SheetMarks: React.FC<{g: number; argDim: number}> = ({g, argDim}) => {
  const tealOp = (1 - 0.5 * tw(g, TEAL_DIM, 10)) * (1 - 0.45 * argDim);
  const coralOp = (1 - 0.45 * argDim) * (1 + 0.0 * argDim);
  const colPulse = bell(g, COL_PULSE, 10);
  const pill = (x0: number, x1: number, r: number, t: number, fill: string, stroke: string, op: number, glow = 0) =>
    t > 0 ? (
      <div
        key={`${fill}${r}`}
        style={{
          position: 'absolute',
          left: x0,
          top: rowY(r) - PILL_H / 2,
          width: (x1 - x0) * t,
          height: PILL_H,
          borderRadius: PILL_H / 2,
          background: fill,
          border: `3px solid ${stroke}`,
          boxSizing: 'border-box',
          mixBlendMode: 'multiply',
          opacity: op,
          filter: argDim > 0 ? `saturate(${1 - 0.65 * argDim})` : undefined,
          boxShadow: glow > 0 ? `0 0 ${14 * glow}px ${4 * glow}px rgba(239,107,85,${0.6 * glow})` : 'none',
        }}
      />
    ) : null;
  const hl = tw(g, HILITE, 10, E.out);
  // frame B cuts the caption at its left edge: recede the caption (paper wash) for the close-up, except the paper's own
  // definition of binary grading, which comes forward on "strictly" with its highlight; the wash lifts on the pull-out
  const veil = 0.62 * tw(g, CAM_B, 14, E.inOut) * (1 - tw(g, CAM_C + 4, 16, E.inOut));
  const cap = {x0: IX - 6, x1: IX + IW + 6, y0: iy(36), y1: iy(404), l0: iy(166), l1: iy(274)};
  const wash = (k: string, x0: number, y0: number, x1: number, y1: number, a: number) =>
    a > 0.004 ? <div key={k} style={{position: 'absolute', left: x0, top: y0, width: x1 - x0, height: y1 - y0, background: C.white, opacity: a}} /> : null;
  return (
    <>
      {wash('v0', cap.x0, cap.y0, cap.x1, cap.l0, veil)}
      {wash('v1', cap.x0, cap.l0, STRICT.x0 - 3, cap.l1, veil)}
      {wash('v2', STRICT.x1 + 3, cap.l0, cap.x1, cap.l1, veil)}
      {wash('v3', cap.x0, cap.l1, cap.x1, cap.y1, veil)}
      {wash('v4', STRICT.x0 - 3, cap.l0, STRICT.x1 + 3, cap.l1, veil * (1 - hl))}
      {/* the scan that numbers the rows */}
      {ROWT.map((f, r) => {
        const a = bell(g, f - 1, 10);
        return a > 0 ? <div key={`w${r}`} style={{position: 'absolute', left: IX - 4, top: rowY(r) - 15, width: IW + 8, height: 30, background: C.saffronLight, mixBlendMode: 'multiply', opacity: a}} /> : null;
      })}
      {/* the paper's own definition of binary grading */}
      {hl > 0 && (
        <>
          <div style={{position: 'absolute', left: STRICT.x0, top: STRICT.y0, width: (STRICT.x1 - STRICT.x0) * hl, height: STRICT.y1 - STRICT.y0, background: C.tealLight, mixBlendMode: 'multiply', borderRadius: 4}} />
          <div style={{position: 'absolute', left: STRICT.x0, top: STRICT.y1 + 1, width: (STRICT.x1 - STRICT.x0) * hl, height: 4, background: C.teal, borderRadius: 2}} />
        </>
      )}
      {/* binary grading: nine Yes pills; IDK credit: nine None pills */}
      {Array.from({length: ROWS}).map((_, r) => (r === WB ? null : pill(YES.x0, r === 2 ? YES_A : YES.x1, r, tw(g, CASC[r], 3, E.out), C.tealLight, C.teal, tealOp)))}
      {Array.from({length: ROWS}).map((_, r) => (r === WB ? null : pill(NONE.x0, NONE.x1, r, tw(g, CORAL[r], 3, E.out), C.coralLight, C.coral, coralOp, colPulse)))}
      {/* the exception: WildBench's "No" and "Partial" ringed in ink */}
      <div style={{position: 'absolute', left: NO_WB.x0 - 2, top: rowY(WB) - 12, width: NO_WB.x1 - NO_WB.x0 + 4, height: 24}}>
        <RingMark t={tw(g, WB_RING, 9, E.inOut)} tone="ink" padX={13} padY={5} width={4} />
      </div>
      <div style={{position: 'absolute', left: PARTIAL.x0 - 2, top: rowY(WB) - 13, width: PARTIAL.x1 - PARTIAL.x0 + 4, height: 26}}>
        <RingMark t={tw(g, CORAL[WB], 9, E.inOut)} tone="ink" padX={11} padY={4} width={4} />
      </div>
    </>
  );
};

const railDx = (g: number) =>
  kf(g, [
    [RAIL_OUT, -RAIL.w - 8],
    [RAIL_OUT + 6, 4, E.out],
    [RAIL_OUT + 10, 0, E.inOut],
  ]);
const Rail: React.FC<{g: number}> = ({g}) => {
  const badge = sp(g, BADGE, SNAP);
  const scanGlow = (r: number) => bell(g, ROWT[r] - 1, 8);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `translateX(${railDx(g)}px)`}}>
      <div style={{position: 'absolute', left: RAIL.x, top: RAIL.top, width: RAIL.w, height: RAIL.bottom - RAIL.top, borderRadius: 12, background: NAVY, border: `${OUTLINE}px solid ${C.ink}`, boxShadow: `5px 6px 0 rgba(22,42,50,0.18)`}} />
      {Array.from({length: ROWS}).map((_, r) => {
        const s = slotState(r, g);
        const face = s.f < 0.5 ? s.from : s.to;
        const shake = r === WB ? 3 * ring(g, WB_RING, 1.5, 0.28) : 0;
        const glow = r === WB ? 0 : Math.max(bell(g, CASC[r], 8), 0.6 * scanGlow(r));
        return <RailSlot key={r} x={RAIL.x + (RAIL.w - SLOT.w) / 2} cy={rowY(r)} w={SLOT.w} h={SLOT.h} face={face} n={r + 1} flip={s.f} shake={shake} glow={glow} />;
      })}
      {badge > 0 && (
        <div style={{position: 'absolute', left: RAIL.x + RAIL.w / 2 - 30, top: iy(551) - 19, width: 60, height: 38, borderRadius: 19, background: C.teal, border: `3px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.white, lineHeight: 1, transform: `scale(${badge})`}}>
          10
        </div>
      )}
    </div>
  );
};

const ZoneLabel: React.FC<{g: number}> = ({g}) => {
  const line = (text: string, t0: number, k: number) => {
    const t = sp(g, t0, SNAP);
    if (t <= 0) return null;
    return (
      <div style={{position: 'absolute', left: ZONE.x, width: ZONE.w, top: LABEL_Y + k * 38, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 34, lineHeight: 1.1, color: C.ink, whiteSpace: 'nowrap', opacity: Math.min(1, t * 3), transform: `translateY(${(1 - Math.min(1, t)) * 10}px) scale(${lerp(0.8, 1, t)})`}}>
        {text}
      </div>
    );
  };
  return (
    <>
      {line('graded strictly', LABEL1, 0)}
      {line('right or wrong', LABEL2, 1)}
    </>
  );
};

const WildTag: React.FC<{g: number}> = ({g}) => {
  const t = sp(g, WB_TAG, SOFT);
  if (t <= 0) return null;
  const clipX = RAIL.x + RAIL.w;
  const w = 300;
  return (
    <div style={{position: 'absolute', left: clipX, top: WTAG.y - 6, width: 620, height: 100, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: ZONE.x - clipX + lerp(-(w + 40), 0, t), top: 6, width: w, padding: '7px 0 8px', textAlign: 'center', borderRadius: 16, background: C.cream, border: `3px dashed ${C.inkSoft}`, fontFamily: F.body, fontWeight: 800, fontSize: 32, lineHeight: 1.1, color: C.ink, boxShadow: `4px 5px 0 rgba(22,42,50,0.12)`}}>
        <div>WildBench:</div>
        <div style={{color: C.inkSoft}}>partial credit</div>
      </div>
    </div>
  );
};

const ChainLine: React.FC<{g: number; argDim: number}> = ({g, argDim}) => {
  const t = tw(g, STRING, 14, E.inOut);
  if (t <= 0) return null;
  const p = tw(g, PULSE_STRING, 13, E.inOut);
  const pulseOn = g >= PULSE_STRING && g < PULSE_BAR + 1 ? 1 : 0;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
      <g style={{filter: argDim > 0 ? `saturate(${1 - 0.65 * argDim})` : undefined}} opacity={1 - 0.45 * argDim}>
        <path d={STRING_D} fill="none" stroke={C.coral} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />
        {t >= 1 && <circle cx={STRING_END.x} cy={STRING_END.y} r={9} fill={C.coral} stroke={C.ink} strokeWidth={3} />}
      </g>
      {pulseOn > 0 && <path d={STRING_D} fill="none" stroke={C.saffronLight} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="0.09 2" strokeDashoffset={-(p * 1.02 - 0.09)} style={{filter: 'drop-shadow(0 0 6px rgba(255,199,68,0.9))'}} />}
    </svg>
  );
};

const HonestNote: React.FC<{g: number}> = ({g}) => {
  if (g < NOTE_IN) return null;
  const dy = kf(g, [
    [NOTE_IN, 360],
    [NOTE_LAND, -9, E.out],
    [NOTE_LAND + 5, 2, E.inOut],
    [NOTE_LAND + 9, 0, E.inOut],
  ]);
  const [sx, sy] = impact(g, NOTE_LAND, 0.04, 8);
  const write = tw(g, NOT_WRITE, 16, E.inOut);
  const l3 = sp(g, LINE2, SNAP);
  const tape = (k: number) => (g >= TAPES[k] ? lerp(1.35, 1, tw(g, TAPES[k], 4, E.out)) : 0);
  const line: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontWeight: 600, fontSize: 48, lineHeight: 1.1, whiteSpace: 'nowrap'};
  return (
    <div style={{position: 'absolute', left: NOTE.x, top: NOTE.y + dy, width: NOTE.w, height: NOTE.h, transform: `rotate(-0.8deg) scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: C.cream, border: `${OUTLINE + 1}px solid ${C.ink}`, boxShadow: `8px 10px 0 rgba(22,42,50,0.18)`}} />
      <div style={{...line, top: 20, color: C.ink}}>One explanation,</div>
      <div style={{...line, top: 20 + 56, color: C.ink, clipPath: `inset(-10px ${(1 - write) * 100}% -10px 0)`}}>not the whole story.</div>
      {l3 > 0 && <div style={{...line, top: 20 + 112, color: C.tealDeep, opacity: Math.min(1, l3 * 3), transform: `scale(${lerp(0.82, 1, l3)})`}}>But a simple one.</div>}
      {[0, 1].map((k) =>
        tape(k) > 0 ? (
          <div key={k} style={{position: 'absolute', left: k === 0 ? -14 : NOTE.w - 106, top: -12, transform: `scale(${tape(k)})`}}>
            <TapeStrip x={60} y={16} rot={k === 0 ? -10 : 9} w={124} />
          </div>
        ) : null,
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ scene */
export const S7Benchmarks: React.FC = () => {
  const g = useG();
  const cam = camAt(g);
  const argDim = tw(g, DIM, 20, E.inOut) * (1 - tw(g, BRIGHT, 12, E.out));
  const focus = 1 - tw(g, LIFT, 12, E.inOut); // 1 = the table is the out-of-focus page under the header

  // tally panel
  const count = countAt(g);
  const nineFlash = bell(g, CASC[ROWS - 1], 16);
  const bulbs = Array.from({length: 9}, (_, k) => Math.max(nineFlash, 0.35 + 0.3 * Math.sin(g * 0.11 - k * 0.8)));
  const plate = sp(g, PLATE, SNAP);

  // the rule card
  const cardFlip = sp(g, CARD_FLIP, SNAP);
  const zero = sp(g, ZERO, SNAP);
  const cardWob = 1.4 * ring(g, CARD_FLIP + 4, 0.8, 0.2);

  // leaderboard
  const boardDy = kf(g, [
    [RISE, 560],
    [BOARD_LAND, -12, E.out],
    [BOARD_LAND + 6, 3, E.inOut],
    [BOARD_LAND + 10, 0, E.inOut],
  ]) + 4 * Math.max(0, ring(g, LAND, 1.0, 0.32));
  const sortT = tw(g, SORT, 9, E.inOut);
  const sw = Math.sin(Math.PI * sortT);
  const sag = tw(g, LAND + 4, 10, E.out);
  const rows: BoardRow[] = ROW_DEF.map((d, i) => ({
    label: d.label,
    fill: d.fill,
    tone: d.tone,
    slot: lerp(d.s0, d.s1, sortT),
    dx: i === 0 ? 24 * sw : i === 1 ? 10 * sw : -14 * sw,
    barT: tw(g, BAR[d.s0], 9, E.out),
    sag: i === 2 ? SAG * sag : 0,
    grey: i === 2 ? sag : 0,
    jolt: i === 0 ? 4 * ring(g, LAND, 1.2, 0.3) : 0,
    z: i === 0 ? 2 : i === 1 ? 1 : 0,
    scale: i === 2 ? 1 - 0.04 * sw : 1,
  }));
  const ranks = RANKS.map((f) => sp(g, f, SNAP));
  const pays = sp(g, PAYS_CHIP, SNAP);
  const barGlowT = tw(g, PULSE_BAR, 10, E.inOut);
  const barGlowOn = g >= PULSE_BAR && g < PULSE_BAR + 12 ? 1 : 0;

  // trophy
  const trophyDy = drop(g, LAND, 760, 11);
  const [tsx, tsy] = impact(g, LAND, 0.14, 9);
  const trophyRot = 3 * ring(g, WOBBLE, 0.7, 0.16) + 0.6 * Math.sin(g * 0.07) * tw(g, LAND + 20, 30);
  const trophyGlint = Math.max(g < GLINT + 12 ? tw(g, GLINT, 11, E.inOut) : 0, g >= WOBBLE && g < WOBBLE + 12 ? tw(g, WOBBLE, 11, E.inOut) : 0, g >= K.oneEnd - 4 ? tw(g, K.oneEnd - 4, 12, E.inOut) : 0);
  const shadowT = tw(g, SHADOW, 10, E.out) * (g < LAND ? lerp(0.55, 1, Math.max(0, 1 + trophyDy / 760)) : 1);

  // sheet life: the right tape lifts a hair now and then
  const tapeR = 0.5 * Math.max(0, ring(g, K.first + 30, 0.35, 0.05)) + 0.5 * Math.max(0, ring(g, TAPES[0], 0.4, 0.08));

  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Layer depth={0.82}>
          <Backdrop />
        </Layer>
        <Layer depth={1}>
          {/* the rail and the citation tag sit behind the sheet until "ten" / "checked" */}
          <Rail g={g} />
          <CitationTag g={g} />
          {/* the real table, pinned; out of focus (and receded) under the header page until it comes off */}
          <div style={{position: 'absolute', left: 0, top: 0, width: 1400, height: 1000, filter: focus > 0.002 ? `blur(${2.4 * focus}px)` : undefined}}>
            <DocCard src="img/paper_p14_table2.png" natW={NAT_W} natH={NAT_H} cropPx={CROP} iw={IW} pad={SHEET.pad} x={SHEET.x} y={SHEET.y}>
              {/* slim and inboard: no overhang at the wide frame's sides; y 151–185, so clear of B1's top (≈130) and B's (187) */}
              <TapeStrip x={SHEET_TAPE} y={-4} rot={-3} w={100} h={24} />
              <TapeStrip x={SHEET_W - SHEET_TAPE} y={-4} rot={3} w={100} h={24} lift={tapeR} />
              {focus > 0.002 && <div style={{position: 'absolute', inset: 0, borderRadius: 8, background: C.white, opacity: 0.4 * focus}} />}
            </DocCard>
          </div>
          <SheetMarks g={g} argDim={argDim} />

          {/* the tally zone */}
          <CounterPanel x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} value={count} plate={plate} bulbs={bulbs} pulse={nineFlash} />
          <ZoneLabel g={g} />
          <WildTag g={g} />
          <RuleCard x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} flip={cardFlip} valueT={zero} pulse={bell(g, COL_PULSE, 10)} wobble={cardWob} />

          {/* the leaderboard (illustration) rises from below on "Train" */}
          {g >= RISE && (
            <Leaderboard x={BOARD.x} y={BOARD.y + boardDy} w={BOARD.w} h={BOARD.h} rows={rows} ranks={ranks} pays={pays} barGlow={barGlowT} barGlowOn={barGlowOn} dim={argDim} />
          )}
          <ChainLine g={g} argDim={argDim} />
          {/* the trophy's shadow on the board's free edge, then the trophy */}
          {shadowT > 0 && <div style={{position: 'absolute', left: TROPHY.x - 62 * TROPHY.s, top: BOARD.y - 9, width: 124 * TROPHY.s, height: 18, borderRadius: '50%', background: 'rgba(22,42,50,0.2)', transform: `scaleX(${shadowT})`}} />}
          {g >= LAND - 11 && (
            <div style={{position: 'absolute', left: TROPHY.x, top: BOARD.y - 12 * TROPHY.s + trophyDy, width: 0, height: 0, transform: `scale(${tsx}, ${tsy})`, transformOrigin: `0px ${12 * TROPHY.s}px`, filter: argDim > 0 ? `saturate(${1 - 0.65 * argDim}) brightness(${1 - 0.08 * argDim})` : undefined, opacity: 1 - 0.3 * argDim}}>
              <TrophyS7 scale={TROPHY.s} rot={trophyRot} glint={trophyGlint} />
            </div>
          )}

          <HonestNote g={g} />
          {/* the paper's header, on top of the stack until "checked" */}
          <HeaderPage g={g} />
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};

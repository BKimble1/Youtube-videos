import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Camera, Cam, Layer} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene} from '../lib/timeline';
import {lerp, rand} from '../lib/anim';
import {E, Move, SNAP, camKick, drift, hop, impact, kf, ring, sp, tw} from '../lib/motion';
import {Sfx} from '../lib/sfx';
import {C} from '../theme';
import {Chip} from '../components/Text';
import {StampMark} from '../components/Props';
import {
  ASM,
  BENCH_Y,
  BOOTH,
  BUB,
  BUBBLE,
  CART_DOCK_X,
  LANE,
  NOG,
  PITCH,
  PUFF,
  REC,
  REC_IN,
  REC_ON_CART_DX,
  SLIP,
  SLIP_OUT,
  SLIP_PARK,
  SLIP_STAMP,
  S8Assembly,
  S8Bench,
  S8Booth,
  S8Bubble,
  S8Cart,
  S8Equals,
  S8Flaps,
  S8NoGuarantee,
  S8Plate,
  S8Puff,
  S8Record,
  S8Sign,
  S8Slip,
  S8Wall,
  ThoughtDot,
  WIN,
} from '../components/v2/S8_Parts';

/**
 * S8 — What helps (s28). Back in the blue machine room: ASSEMBLY (the answer machine, its randomness dial twitching at
 * HIGH) on the left, the EVIDENCE CHECK booth from S2 (still shut, CLOSED sign) on the right.
 *
 *  "So what helps?"            the question drops in on strings; the shut booth's lamp blinks once.
 *  "Search and retrieval,"     camera follows the rail right; the RETRIEVAL cart rolls in from off-frame with the real
 *  "when they bring the real   record standing on it, brakes, docks (bump) → the shutter ratchets up, CLOSED riding up
 *   record into the room."     with it → the record slides through the intake slit into the window → push into the
 *                              window: the title gets the teal evidence frame, "the real record is now in the room".
 *  "Reasoning, sometimes."     pull back across to ASSEMBLY (the booth leaves frame): it puffs a thought bubble and the
 *                              steps write on as a staircase, the bubble growing a line per step; on "sometimes" the
 *                              bubble grows once more, the hedge flips in and the machine shrugs.
 *  "Turning down the           the bubble folds to a parked "…"; push to the dial: the knob ratchets from HIGH to LOW
 *   randomness makes answers   (four clicks, overshoot, settle), the twitching stops, "turned down" stamps in.
 *   more consistent,"          the tunnel lamp lights; three identical slips are pushed out onto the belt, one per beat,
 *                              the camera following the belt; one highlight sweeps all three; "=" "=".
 *  "not necessarily more       the verdict plate flips down under them (the guard rail, readable); on "correct." each
 *   correct."                  slip takes a WRONG stamp, left to right.
 *  "None of it is a            pull back to the whole room: the three helps answer in turn (booth lamp, the "…", the
 *   guarantee."                dial) and NO GUARANTEE slams across the middle; the room jolts. Then a slow push toward
 *                              the EVIDENCE CHECK booth as the wipe takes us to S9's checking machine.
 * Every beat is keyed to a word of the V2 narration (timeline.json); see V2_DIRECTION.md for the conventions.
 */

/* ------------------------------------------------------------------ cues (global frames) */
const K = {
  mount: scene('S8').from - 5, // mounted 5 frames early under the S7 → S8 wipe
  start: scene('S8').from,
  end: scene('S8').to, // the S8 → S9 wipe is centred here; we draw until end + 4
  so: at('s28', 'So'),
  what: at('s28', 'what'),
  helps: at('s28', 'helps?'),
  helpsEnd: at('s28', 'helps?', 1, 'end'),
  search: at('s28', 'Search'),
  retrieval: at('s28', 'retrieval,'),
  when: at('s28', 'when'),
  bring: at('s28', 'bring'),
  the: at('s28', 'the'),
  real: at('s28', 'real'),
  record: at('s28', 'record'),
  into: at('s28', 'into'),
  room: at('s28', 'room.'),
  roomEnd: at('s28', 'room.', 1, 'end'),
  reasoning: at('s28', 'Reasoning,'),
  sometimes: at('s28', 'sometimes.'),
  sometimesEnd: at('s28', 'sometimes.', 1, 'end'),
  turning: at('s28', 'Turning'),
  down: at('s28', 'down'),
  randomness: at('s28', 'randomness'),
  makes: at('s28', 'makes'),
  answers: at('s28', 'answers'),
  more: at('s28', 'more'),
  consistent: at('s28', 'consistent,'),
  consistentEnd: at('s28', 'consistent,', 1, 'end'),
  not: at('s28', 'not'),
  necessarily: at('s28', 'necessarily'),
  correct: at('s28', 'correct.'),
  correctEnd: at('s28', 'correct.', 1, 'end'),
  none: at('s28', 'None'),
  of: at('s28', 'of'),
  a: at('s28', 'a'),
  guarantee: at('s28', 'guarantee.'),
};

/* ------------------------------------------------------------------ beats derived from the cues */
// s28a: the question
const SIGN_LAND = K.so; // the sign lands on its strings
const TEASE = K.helps + 2; // the shut booth's lamp blinks once, the shutter rattles
const SIGN_UP = K.helpsEnd - 6; // the sign is hauled up out of the way (after a 2-frame dip)
// retrieval
const CAM_DOCK = K.search - 9; // follow the rail toward the booth (lands as the cart appears)
const DOCK = K.bring; // the cart bumps into the dock
const CART_DEC = 36; // braking frames before the dock
const CART_V = 29; // world px / frame while cruising
const LAMP_BLINK = [DOCK - 22, DOCK - 14, DOCK - 6];
const CART_RUN = (CART_V * CART_DEC) / 2; // distance covered while braking
/** frames where a wheel crosses a rail joint while braking (the cart's 2 px bump, see `bob`) */
const RAIL_BUMPS = [292.5, 162.5, 32.5].map((d) => Math.round(DOCK - CART_DEC * Math.sqrt(d / CART_RUN)));
const SHUT = [K.the, K.the + 4, K.real + 2]; // three ratchet detents
const SHUT_TOP = K.real + 5; // the shutter clacks home at the top
const REC_GO = K.record; // the record slides off the cart through the slit
const REC_LAND = K.record + 11;
const CAM_INSERT = K.record - 1; // the camera follows it into the window (lands as "room." starts)
const CART_OUT = REC_LAND + 3; // the empty cart backs away
const ROOM_CHIP = REC_LAND + 3; // "the real record is now in the room" rises into the window
const TITLE_BOX = K.room - 2; // evidence frame drawn round the title
// reasoning
const CAM_TWO = TITLE_BOX + 13; // once the evidence frame is drawn: back out to the answer machine (lands K.reasoning + 17)
const PUFFS = [K.reasoning + 10, K.reasoning + 14]; // ASSEMBLY's top is in frame by now
const BUBBLE_T = K.reasoning + 17;
const STEPS = [BUBBLE_T + 2, BUBBLE_T + 7, BUBBLE_T + 12]; // the last one writes on in the pause before "sometimes"
const HEDGE = K.sometimes + 1;
const GROW = HEDGE - 2; // the bubble grows once more to take the hedge (leads the chip flip by 2 frames)
const SHRUG = K.sometimes + 4;
// randomness
const COLLAPSE = K.sometimesEnd; // the bubble folds into the parked "…" (gone before the push to the dial reaches it)
const CAM_DIAL = K.sometimesEnd + 1; // lands before the knob is gripped on "down"
const KNOB0 = K.down; // grip: a small counter-turn (anticipation) …
const DETENT = [K.down + 4, K.down + 8, K.down + 12, K.down + 16]; // … four clicks down to LOW
const CALM = DETENT[3]; // the twitching and the hum stop
const TURNED = CALM + 6; // "turned down" stamps in
const MOUTH_ON = K.makes; // the output tunnel lights
const PRINTS = [K.answers - 2, K.more - 1, K.consistent + 7]; // one identical slip per beat
const EJECT = 10;
const CAM_SLIPS = K.makes - 2; // follow the belt to the row
const HL = PRINTS[2] + EJECT + 1; // one highlight sweeps all three titles
const HL_YEAR = HL + 8; // … then the same year on all three
const EQ = [HL + 4, HL + 10];
const PLATE = K.not + 2; // the guard-rail plate flips down
const STAMPS = [K.correct + 1, K.correct + 7, K.correct + 13]; // WRONG × 3, left to right
// none
const CAM_END = K.correctEnd + 1;
const ACKS = [K.of, K.of + 3, K.of + 6]; // booth lamp, the "…", the dial — the three helps, in order (camera landed)
const NO_SHOW = K.a; // NO GUARANTEE comes down …
const NO_HIT = K.guarantee + 1; // … and hits
const PUSH = NO_HIT + 8; // toward the checking booth, into the wipe

/** the needle at HIGH: a new random target every 4–7 frames, reached in 2 (visible randomness) */
const HIGH = 0.8;
const jitter = (g: number) => {
  let f = K.mount - 40;
  let k = 0;
  let prev = HIGH;
  let cur = HIGH;
  for (;;) {
    const len = 4 + Math.floor(rand(k * 7 + 3) * 4);
    if (f + len > g) break;
    f += len;
    prev = cur;
    const big = rand(k * 11 + 1) < 0.2;
    cur = HIGH + (rand(k * 13 + 5) - 0.5) * (big ? 0.2 : 0.1);
    k++;
  }
  return prev + (cur - prev) * E.out(Math.min(1, (g - f) / 2));
};
/** frames where the HIGH needle makes one of its big jumps (for the twitch ticks) — mirrors `jitter` */
const jitterJumps = (from: number, to: number) => {
  const out: number[] = [];
  let f = K.mount - 40;
  for (let k = 0; ; k++) {
    f += 4 + Math.floor(rand(k * 7 + 3) * 4);
    if (f > to) break;
    if (rand(k * 11 + 1) < 0.2 && f >= from) out.push(f);
  }
  return out;
};

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
const LAST = K.end + 4;
export const SFX: Sfx[] = [
  {f: K.mount, kind: 'amb_machine', dur: (LAST - K.mount + 1) / 30, note: 'machine-room tone under the whole scene'},
  {f: K.mount, kind: 'machine_hum', dur: (CALM - K.mount) / 30, gain: -12, note: 'ASSEMBLY hums at HIGH until the turn-down'},
  {f: CALM, kind: 'machine_hum', dur: (LAST - CALM) / 30, gain: -16, pitch: -3, note: 'calmer, lower hum after LOW'},
  ...jitterJumps(K.mount + 4, SIGN_UP).slice(0, 3).map((f, i) => ({f, kind: 'prob_tick' as const, gain: -16, pitch: i * 2, note: 'needle twitch at HIGH'})),
  {f: SIGN_LAND - 1, kind: 'hanger_click', note: 'the sign catches on its strings'},
  {f: SIGN_LAND, kind: 'paper_flap', gain: -8},
  {f: TEASE, kind: 'indicator_no', gain: -12, note: 'the shut booth blinks once'},
  {f: TEASE + 1, kind: 'machine_clunk', gain: -16, pitch: 4, note: 'shutter rattle'},
  {f: SIGN_UP, kind: 'paper_swish', gain: -10, note: 'the sign is hauled up'},
  {f: K.search - 2, kind: 'conveyor_run', dur: (DOCK - K.search + 2) / 30, gain: -8, pitch: 3, note: 'cart rolling in (starts off-frame)'},
  ...RAIL_BUMPS.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -13, pitch: -6 + i, note: 'rail joint'})),
  ...LAMP_BLINK.map((f, i) => ({f, kind: 'indicator_yes' as const, gain: -12, pitch: i * 2, note: 'booth lamp blinks teal'})),
  {f: DOCK, kind: 'machine_clunk', note: 'cart bumps the dock'},
  {f: DOCK + 1, kind: 'paper_flap', gain: -9, note: 'the record rattles'},
  ...SHUT.map((f, i) => ({f, kind: 'conveyor_clunk' as const, gain: -6, pitch: 2 + i * 2, note: 'shutter ratchet'})),
  {f: SHUT_TOP, kind: 'machine_clunk', gain: -5, pitch: 3, note: 'shutter clacks home'},
  {f: REC_GO, kind: 'paper_slide'},
  {f: REC_LAND, kind: 'thud_soft', gain: -6},
  {f: CART_OUT, kind: 'conveyor_run', dur: 0.6, gain: -12, pitch: 3, note: 'empty cart rolls away'},
  {f: ROOM_CHIP, kind: 'chip_pop', gain: -3},
  {f: TITLE_BOX, kind: 'marker_circle'},
  ...PUFFS.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -9, pitch: i * 3, note: 'thought puffs'})),
  {f: BUBBLE_T, kind: 'chip_pop', gain: -5, note: 'bubble opens'},
  ...STEPS.map((f, i) => ({f, kind: 'pencil_tap' as const, gain: -8, pitch: i * 2, note: 'steps write on'})),
  {f: HEDGE, kind: 'card_flick', note: '"helps sometimes" flips in'},
  {f: HEDGE + 6, kind: 'indicator_no', gain: -11, pitch: 2, note: 'two-note "hmm"'},
  {f: HEDGE + 11, kind: 'indicator_no', gain: -12, pitch: -1},
  {f: COLLAPSE + 2, kind: 'pop_tick', gain: -10, pitch: -4, note: 'bubble folds into the "…"'},
  ...jitterJumps(KNOB0 - 16, KNOB0).slice(-2).map((f, i) => ({f, kind: 'prob_tick' as const, gain: -15, pitch: i, note: 'last twitches'})),
  {f: KNOB0 + 1, kind: 'pop_tick', gain: -8, note: 'knob counter-turn'},
  ...DETENT.slice(0, 3).map((f, i) => ({f, kind: 'prob_tick' as const, gain: -4, pitch: -2 * i, note: 'ratchet click'})),
  {f: CALM, kind: 'machine_clunk', gain: -4, pitch: -2, note: 'final detent at LOW'},
  {f: TURNED, kind: 'stamp_light', gain: -8, note: '"turned down"'},
  {f: MOUTH_ON, kind: 'indicator_yes', gain: -10, note: 'tunnel lamp'},
  ...PRINTS.flatMap((f) => [
    {f, kind: 'printer_feed' as const, gain: -3, note: 'identical print (same pitch each time)'},
    {f: f + EJECT - 1, kind: 'conveyor_clunk' as const, gain: -5, note: 'belt indexes'},
  ]),
  {f: HL, kind: 'marker_sweep', note: 'one sweep across all three titles'},
  {f: HL_YEAR, kind: 'marker_sweep', gain: -6, pitch: 3, note: 'the same year, three times'},
  ...EQ.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -6, pitch: 2 + i * 2, note: '='})),
  {f: PLATE + 5, kind: 'hanger_click', gain: -2, note: 'verdict plate flips down'},
  {f: STAMPS[0], kind: 'stamp_light'},
  {f: STAMPS[1], kind: 'stamp_light', pitch: -1},
  {f: STAMPS[2], kind: 'stamp_heavy', gain: -3},
  ...ACKS.map((f, i) => ({f, kind: 'glint' as const, gain: -10, pitch: i * 2, note: 'the three helps answer'})),
  {f: NO_HIT, kind: 'stamp_heavy', gain: 2, note: 'NO GUARANTEE'},
  {f: NO_HIT + 1, kind: 'machine_clunk', gain: -8, pitch: -3, note: 'the room rattles'},
  {f: NO_HIT + 2, kind: 'paper_flap', gain: -10, note: 'slips flutter'},
  {f: PUSH + 2, kind: 'whoosh_soft', gain: -14, note: 'push toward the booth, into the wipe'},
];

/* ------------------------------------------------------------------ camera */
const SINE = Easing.bezier(0.37, 0, 0.63, 1);
const SHOTS: Record<string, Cam> = {
  wide0: {cx: 1060, cy: 440, zoom: 0.9}, // the room: ASSEMBLY · belt · booth
  wide0b: {cx: 1092, cy: 437, zoom: 0.93}, // slow drift right, toward where the cart will come from
  dock: {cx: 2003, cy: 494, zoom: 1.73}, // booth + the cart's lane (x 1448–2558)
  insert: {cx: 1810, cy: 500, zoom: 3.0}, // the window: frame y 320–680 (header out), title ≈ 43 px cap height
  // ASSEMBLY + its thought bubble (frame x 38–1562): the booth (x ≥ 1600) is wholly out, steps ≈ 58 px, hedge ≈ 60 px
  two: {cx: 800, cy: 470, zoom: 1.26},
  dial: {cx: 340, cy: 460, zoom: 1.8}, // centred on the dial; ASSEMBLY whole, the tunnel at the right
  slips: {cx: 1110, cy: 662, zoom: 2.04}, // the row (x 640–1580): ASSEMBLY and booth both clear of the frame
  slipsB: {cx: 1110, cy: 658, zoom: 2.09}, // creep while the verdict lands
  end: {cx: 1060, cy: 440, zoom: 0.9},
  out: {cx: 1600, cy: 450, zoom: 1.4}, // toward EVIDENCE CHECK (reached only after the wipe)
};
/** A camera move whose pan and zoom may run on their own sub-ranges of [0, 1] of the move: a pull-back opens the
 *  zoom first and pans late (so the pan happens wide, where it costs little screen travel); a push-in pans first and
 *  closes the zoom last. Keeps every big move under ≈ 100 px/frame of on-screen travel (no whips). */
type CamMove = Move & {pan?: [number, number]; zoomR?: [number, number]};
const PULL: Pick<CamMove, 'pan' | 'zoomR'> = {pan: [0.2, 1], zoomR: [0, 0.8]};
const PUSHIN: Pick<CamMove, 'pan' | 'zoomR'> = {pan: [0, 0.75], zoomR: [0.2, 1]};
const sub = (u: number, r?: [number, number]) => (r ? Math.max(0, Math.min(1, (u - r[0]) / (r[1] - r[0]))) : u);
/** camPath with the zoom interpolated in log space, so big push-ins and pull-backs feel even. */
const camGo = (g: number, start: Cam, moves: CamMove[]): Cam => {
  let c = start;
  for (const m of moves) {
    const u = tw(g, m.at, m.dur, E.linear);
    if (u <= 0) break;
    const ease = m.ease ?? E.inOut;
    const tp = ease(sub(u, m.pan));
    const tz = ease(sub(u, m.zoomR));
    c = {cx: lerp(c.cx, m.to.cx, tp), cy: lerp(c.cy, m.to.cy, tp), zoom: Math.exp(lerp(Math.log(c.zoom), Math.log(m.to.zoom), tz))};
  }
  return c;
};
const camAt = (g: number): Cam => {
  const c = camGo(g, SHOTS.wide0, [
    {at: K.mount, dur: CAM_DOCK - K.mount, to: SHOTS.wide0b, ease: E.inOut},
    {at: CAM_DOCK, dur: 26, to: SHOTS.dock, ease: SINE},
    {at: CAM_INSERT, dur: 20, to: SHOTS.insert, ease: SINE, ...PUSHIN},
    {at: CAM_TWO, dur: 32, to: SHOTS.two, ease: SINE, ...PULL},
    {at: CAM_DIAL, dur: 21, to: SHOTS.dial, ease: SINE, ...PUSHIN},
    {at: CAM_SLIPS, dur: 40, to: SHOTS.slips, ease: SINE},
    {at: CAM_SLIPS + 40, dur: CAM_END - CAM_SLIPS - 40, to: SHOTS.slipsB, ease: E.inOut},
    {at: CAM_END, dur: 20, to: SHOTS.end, ease: SINE},
    {at: PUSH, dur: 24, to: SHOTS.out, ease: E.in},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [STAMPS[2]], 0.012) * camKick(g, [NO_HIT], 0.022)};
};

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

const needleAt = (g: number) => {
  if (g < KNOB0) return jitter(g);
  const v0 = jitter(KNOB0);
  const D = DETENT;
  return kf(g, [
    [KNOB0, v0],
    [KNOB0 + 2, v0 + 0.03, E.out],
    [D[0], 0.62, E.in],
    [D[0] + 1, 0.627, E.out],
    [D[1], 0.44, E.in],
    [D[1] + 1, 0.447, E.out],
    [D[2], 0.26, E.in],
    [D[2] + 1, 0.267, E.out],
    [D[3], 0.1, E.in],
    [D[3] + 2, 0.072, E.out],
    [D[3] + 6, 0.1, E.inOut],
  ]);
};

/** cart offset from its docked position (world px, + = further right) */
const cartOff = (g: number) => {
  const dec0 = DOCK - CART_DEC;
  const run = CART_RUN;
  let off: number;
  if (g < dec0) off = run + CART_V * (dec0 - g);
  else if (g < DOCK) {
    const u = (DOCK - g) / CART_DEC;
    off = run * u * u;
  } else off = kf(g, [[DOCK, 0], [DOCK + 3, 7, E.out], [DOCK + 7, 0, E.in], [DOCK + 9, 1.5, E.out], [DOCK + 11, 0, E.in]]);
  if (g >= CART_OUT) off += kf(g, [[CART_OUT, 0], [CART_OUT + 2, -3, E.out], [CART_OUT + 20, 760, E.in]]);
  return off;
};

/* ------------------------------------------------------------------ scene */
export const S8Helps: React.FC = () => {
  const g = useG();
  const cam = camAt(g);

  /* --- ASSEMBLY */
  const calm = g >= CALM;
  const printKick = PRINTS.reduce((a, p) => a - 1.6 * ring(g, p, 1.8, 0.4), 0);
  const vib: [number, number] = [
    (calm ? 0 : 0.9 * Math.sin(g * 2.2)) + printKick,
    (calm ? 0 : 0.7 * Math.sin(g * 3.1 + 1)) + 3 * ring(g, NO_HIT, 1.5, 0.4) + 1.2 * ring(g, CALM, 1.6, 0.4),
  ];
  const squash = kf(g, [[SHRUG, 1], [SHRUG + 4, 0.972, E.out], [SHRUG + 9, 1.012, E.inOut], [SHRUG + 14, 1, E.inOut]]) * impact(g, NO_HIT, 0.025, 8)[1];
  const led = calm ? 1 : (g - K.mount) % 36 < 6 ? 1 : 0;
  const mouthLamp = g >= MOUTH_ON && g < PRINTS[2] + 22 ? (PRINTS.some((p) => g >= p && g < p + 3) ? 0.55 : 1) : 0;
  const turned = g < TURNED ? 0 : kf(g, [[TURNED, 1.32], [TURNED + 3, 0.95, E.in], [TURNED + 7, 1, E.out]]);
  const glint = g >= ACKS[2] && g < ACKS[2] + 9 ? tw(g, ACKS[2], 9, E.inOut) : 0;

  /* --- booth */
  const open = kf(g, [[SHUT[0] - 3, 0], [SHUT[0], 0.3, E.in], [SHUT[0] + 1, 0.285, E.out], [SHUT[1], 0.6, E.in], [SHUT[1] + 1, 0.585, E.out], [SHUT[2], 0.93, E.in], [SHUT_TOP, 1, E.out]]);
  const rattle = 3 * ring(g, TEASE, 2.4, 0.3) + 2 * ring(g, DOCK, 2.4, 0.35) + 2 * ring(g, SHUT[0] - 3, 2.6, 0.4);
  const signRot = 1.2 * drift(g, 4, 90) + 7 * ring(g, TEASE, 0.5, 0.12) + 8 * ring(g, DOCK, 0.55, 0.12) + 6 * ring(g, SHUT[0], 0.6, 0.12) + 5 * ring(g, SHUT[1], 0.6, 0.12);
  let lamp = 0;
  if (g >= TEASE && g < TEASE + 4) lamp = 1;
  if (LAMP_BLINK.some((b) => g >= b && g < b + 4)) lamp = 1;
  if (g >= DOCK + 1) lamp = g === NO_HIT + 1 || g === NO_HIT + 3 ? 0 : 1;
  const glow = g >= DOCK + 1 ? 0.55 + 1.3 * bell(g, ACKS[0], 7) + 0.5 * tw(g, PUSH, 18, E.inOut) : 0.4;
  const boothShake = 2 * ring(g, DOCK, 1.6, 0.4) + 1.2 * ring(g, SHUT_TOP, 1.8, 0.5) + 3 * ring(g, NO_HIT, 1.5, 0.4);

  /* --- cart and record */
  const off = cartOff(g);
  const cartX = CART_DOCK_X + off;
  const moving = g < DOCK || (g >= CART_OUT && g < CART_OUT + 24);
  const bob = moving ? -2 * Math.max(0, Math.sin((off / 130) * Math.PI * 2)) ** 6 : 0;
  const wheel = (off / 22) * (180 / Math.PI);
  const braking = g >= DOCK - CART_DEC && g < DOCK ? tw(g, DOCK - CART_DEC, 8) : 0;
  const lean = -1.8 * braking - 4 * ring(g, DOCK, 0.7, 0.18);
  const recU = g < REC_GO ? 0 : kf(g, [[REC_GO, 0], [REC_GO + 2, -0.012, E.out], [REC_LAND, 1.012, E.out], [REC_LAND + 4, 1, E.inOut]]);
  const recOnCartX = cartX + REC_ON_CART_DX;
  const recX = lerp(g < REC_GO ? recOnCartX : CART_DOCK_X + REC_ON_CART_DX, REC_IN.x, recU);
  const recY = REC_IN.y + (g < REC_GO ? bob : 0) + (g >= REC_LAND ? 3 * bell(g, REC_LAND, 6) : 0);
  const recRot = g < REC_GO ? lean : 0.8 * ring(g, REC_LAND, 0.9, 0.3);
  const titleBox = tw(g, TITLE_BOX, 12, E.inOut);
  const roomChipU = g < ROOM_CHIP ? 0 : sp(g, ROOM_CHIP, SNAP);
  const record = (
    <div style={{position: 'absolute', left: recX, top: recY, width: REC.w, height: REC.h, transform: `rotate(${recRot}deg)`, transformOrigin: '50% 100%'}}>
      <S8Record box={titleBox} />
    </div>
  );

  /* --- slips */
  const ej = (p: number) => tw(g, p, EJECT, E.softBack);
  const beltPos = PRINTS.reduce((a, p) => a + PITCH * ej(p), 0);
  const slips = [0, 1, 2].map((k) => {
    if (g < PRINTS[k]) return null;
    let x = SLIP_PARK + (SLIP_OUT - SLIP_PARK) * ej(PRINTS[k]);
    for (let c = k + 1; c < 3; c++) x += PITCH * ej(PRINTS[c]);
    const hit = STAMPS[2 - k]; // stamped left to right: the last one printed sits leftmost
    let rot = 2.4 * ring(g, PRINTS[k] + EJECT - 2, 0.8, 0.22);
    for (let c = k + 1; c < 3; c++) rot += 1.8 * ring(g, PRINTS[c] + EJECT - 2, 0.8, 0.22);
    rot += 1.2 * ring(g, hit, 1.2, 0.3) + 2.2 * ring(g, NO_HIT + k, 1.0, 0.22);
    const [sx, sy] = impact(g, hit, 0.05, 8);
    const jolt = g >= hit ? 3 * Math.exp(-(g - hit) * 0.5) * Math.max(0, Math.cos((g - hit) * 0.9)) : 0;
    const mark = g < hit - 3 ? 0 : kf(g, [[hit - 3, 1.34], [hit, 0.93, E.in], [hit + 5, 1, E.out]]);
    const [mx, my] = impact(g, hit, 0.12, 8);
    return {x, rot, sx, sy, jolt, mark, mx, my};
  });
  const hl = tw(g, HL, 10, E.inOut);
  const hlYear = tw(g, HL_YEAR, 6, E.out);
  const flaps = [0, 1, 2, 3].map((j) => PRINTS.reduce((a, p) => a - 16 * bell(g, p + 1 + j, 6) + 7 * ring(g, p + 7 + j, 0.75, 0.2), 0));
  const eqT = EQ.map((f) => (g < f ? 0 : sp(g, f, SNAP)));
  const plateFlap = g < PLATE ? 90 : kf(g, [[PLATE, 90], [PLATE + 6, -14, E.in], [PLATE + 11, 7, E.inOut], [PLATE + 16, -3, E.inOut], [PLATE + 21, 0, E.inOut]]) + 5 * ring(g, NO_HIT, 1.0, 0.25);

  /* --- bubble and the parked "…" */
  const collapsing = g >= COLLAPSE;
  const bubOpen = g < BUBBLE_T ? 0 : kf(g, [[BUBBLE_T, 0], [BUBBLE_T + 5, 1.035, E.out], [BUBBLE_T + 10, 1, E.inOut]]); // small overshoot: stays inside the frame
  const bubFold = tw(g, COLLAPSE, 8, E.in);
  const bubScale = lerp(0.55, 1, bubOpen) * (1 - bubFold);
  const steps = STEPS.map((f) => tw(g, f, 6, E.out));
  // the bubble grows one line per step, then once more to take the hedge (each with a small overshoot)
  const growK = (f: number) => (g < f ? 0 : kf(g, [[f, 0], [f + 5, 1.06, E.out], [f + 9, 0.98, E.inOut], [f + 13, 1, E.inOut]]));
  const bubH = BUBBLE.h1 + BUB.line * (growK(STEPS[1] - 1) + growK(STEPS[2] - 1)) + (BUBBLE.h - BUBBLE.h3) * growK(GROW);
  const hedge = g < HEDGE ? 0 : kf(g, [[HEDGE, 0], [HEDGE + 5, 1.08, E.in], [HEDGE + 9, 0.97, E.inOut], [HEDGE + 13, 1, E.inOut]]);
  const dotsRot = 7 * ring(g, HEDGE + 4, 0.7, 0.18);
  const dotT = PUFFS.map((f) => (g < f ? 0 : sp(g, f, SNAP) * (1 - bubFold)));
  const puffT = g < COLLAPSE + 6 ? 0 : sp(g, COLLAPSE + 6, SNAP);
  const puffBob = hop(g, ACKS[1], 12, 8) - 4 * ring(g, NO_HIT, 1.2, 0.3) + 2 * drift(g, 2, 70);

  /* --- the sign (wall layer) */
  const signY = 150 + (g < SIGN_LAND - 11 ? -540 : -540 * Math.max(0, 1 - ((g - (SIGN_LAND - 11)) / 11) ** 2)) - 0.07 * 540 * bell(g, SIGN_LAND, 7) + 6 * bell(g, SIGN_UP - 2, 4) - 760 * tw(g, SIGN_UP, 10, E.in);
  const signRotW = 2.4 * ring(g, SIGN_LAND, 0.42, 0.11);

  /* --- NO GUARANTEE */
  const noScale = g < NO_SHOW ? 0 : kf(g, [[NO_SHOW, 1.45], [NO_HIT, 0.93, E.in], [NO_HIT + 5, 1.02, E.out], [NO_HIT + 9, 1, E.inOut]]);
  const [nsx, nsy] = impact(g, NO_HIT, 0.08, 9);

  return (
    <AbsoluteFill style={{background: C.blueLight, overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Layer depth={0.85}>
          <S8Wall />
          {g < SIGN_UP + 12 && <S8Sign x={1046} y={signY} rot={signRotW} />}
        </Layer>
        <Layer depth={1}>
          <S8Bench beltPos={beltPos} />
          {/* EVIDENCE CHECK booth; the record and its chip live inside the window */}
          <S8Booth s={{open, dip: 0, rattle, signRot, lamp, glow, shake: boothShake}}>
            {g >= REC_GO && record}
            <div style={{position: 'absolute', left: WIN.x0 + 6, top: REC_IN.y + REC.h - 2, width: WIN.x1 - WIN.x0 - 12, height: 10, background: C.paperLine, border: `3px solid ${C.ink}`, borderRadius: 4, boxSizing: 'border-box'}} />
            {roomChipU > 0 && (
              <div style={{position: 'absolute', left: WIN.x0, width: WIN.x1 - WIN.x0, top: lerp(WIN.y1 + 8, REC_IN.y + REC.h + 22, roomChipU), textAlign: 'center'}}>
                <Chip tone="teal" size={16.5}>
                  the real record is now in the room
                </Chip>
              </div>
            )}
          </S8Booth>
          {/* the cart, and the record while it is still outside the booth (clipped at the booth's right wall) */}
          <S8Cart x={cartX} wheel={wheel} bob={bob} />
          <div style={{position: 'absolute', left: BOOTH.x1, top: 0, width: 3000, height: 1100, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -BOOTH.x1, top: 0}}>{record}</div>
          </div>
          {g < CART_OUT + 24 && (
            <div style={{position: 'absolute', left: cartX + 4, top: REC_IN.y + REC.h - 10 + bob, width: 372, height: 14, background: C.wood, border: `3px solid ${C.ink}`, borderRadius: 4, boxSizing: 'border-box'}} />
          )}
          {/* ASSEMBLY, the slips coming out of its tunnel, the rubber flaps over them */}
          <S8Assembly s={{needle: needleAt(g), vib, squash, led, mouthLamp, turned, glint}} />
          <div style={{position: 'absolute', left: LANE.x0, top: 0, width: LANE.x1 - LANE.x0, height: 1100, overflow: 'hidden'}}>
            {slips.map((s, k) =>
              s ? (
                <div key={k} style={{position: 'absolute', left: s.x - SLIP.w / 2 - LANE.x0, top: BENCH_Y - SLIP.h + s.jolt, width: SLIP.w, height: SLIP.h, transform: `rotate(${s.rot}deg) scale(${s.sx}, ${s.sy})`, transformOrigin: '50% 100%'}}>
                  <S8Slip hl={hl} hlYear={hlYear} />
                  {s.mark > 0 && (
                    <div style={{position: 'absolute', left: SLIP_STAMP.x, top: SLIP_STAMP.y, transform: `translate(-50%, -50%) scale(${s.mark * s.mx}, ${s.mark * s.my})`}}>
                      <StampMark text="Wrong" tone="coral" t={1} size={SLIP_STAMP.size} rotate={-10} />
                    </div>
                  )}
                </div>
              ) : null,
            )}
          </div>
          <S8Flaps swing={flaps} vib={vib} />
          <S8Equals x={(SLIP_OUT + SLIP_OUT + PITCH) / 2} y={BENCH_Y - SLIP.h / 2} t={eqT[0]} />
          <S8Equals x={SLIP_OUT + PITCH * 1.5} y={BENCH_Y - SLIP.h / 2} t={eqT[1]} />
          {g >= PLATE && <S8Plate flap={plateFlap} />}
          {/* reasoning */}
          {g >= BUBBLE_T && bubScale > 0.02 && (
            <div style={{position: 'absolute', left: BUBBLE.x, top: BUBBLE.y, width: BUBBLE.w, height: BUBBLE.h, transform: `scale(${bubScale})`, transformOrigin: collapsing ? `${PUFF.x - BUBBLE.x}px ${PUFF.y - BUBBLE.y}px` : `0px ${BUBBLE.h1 * 0.75}px`}}>
              <S8Bubble steps={steps} hedge={hedge} dotsRot={dotsRot} h={bubH} />
            </div>
          )}
          <ThoughtDot x={620} y={226 - 8 * (1 - Math.min(1, dotT[1]))} r={13} t={dotT[1]} />
          <ThoughtDot x={585} y={254 - 6 * (1 - Math.min(1, dotT[0]))} r={8} t={dotT[0]} />
          <S8Puff t={puffT} bob={puffBob} />
          {/* the verdict */}
          {noScale > 0 && <S8NoGuarantee scale={noScale} sx={nsx} sy={nsy} />}
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};


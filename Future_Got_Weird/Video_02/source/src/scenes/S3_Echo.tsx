import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, camPath, hop, kf, sp, tw} from '../lib/motion';
import {CAM_PATH_SIDE, HANDOFF_S2S3, HANDOFF_S2S3_EXTEND, PLAN_CARD_AREA, PLAN_CARD_RECT, RAISED_TILT} from '../lib/shots';
import {
  LAYOUT,
  assertAroundTheEnd,
  hiddenByPartition,
  partitionCrossings,
  partitionHides,
  partitionTopH,
  projectWith,
  SLAB_T,
  WALL_T,
  rigAt,
  rigStyle,
  viewAt,
  type HiddenTest,
  type PlanPt,
  type ViewState,
} from '../lib/room';
import {
  LAYOUT as OLAYOUT,
  assertPath,
  confocalPath,
  firstOccluderHit,
  layoutPoints,
  lerpP,
  normalize,
  pathCumulative,
  pathLength,
  pathSchedule,
  scatterDirections,
  sub,
  timeNs,
  visibleIntervals,
  type P2,
  type ScatterDir,
} from '../lib/optics';
import {rand} from '../lib/anim';
import {CAST} from '../components/cast';
import {GapMarker, RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {ScatterFan, mixHex, type ToPx} from '../components/v02/Optics';
import {ARMS_CROSSED, Character2, EXPR, HANDS_ON_HIPS, eyesWorld, figuresHide, mixPose2, rigCovers, rimFlash, settlePose, withPose, type Pose2, type RigPlace} from '../components/v02/Cast2';
import {SensorStand, standGeometry} from '../components/v02/S3_SensorStand';
import {BlockCard, type BlockDrop} from '../components/v02/S3_BlockCard';
import {EchoBoard, EchoCard} from '../components/v02/S3_EchoBoard';
import {PLAN_VIEW, PlanCard, PlanRoute, planCardSize, viewForArea} from '../components/v02/PlanCard';
import {TimingCard, TIMING_CARD} from '../components/v02/S3_TimingCard';

/**
 * S3 · The faint echo (s13–s16). Storyboard shots S3.1–S3.3.
 *
 *  S3.1 s13  S2 ends on the room at tilt 0; S3 opens on S2's last frame exactly (tilt 0, S2.4's framing HANDOFF_S2S3,
 *            both people in S2's last poses and S2's settled "what survives: timing" card, which slides out left as the
 *            move starts: one room across the cut, no pop) and, in one move on "follow the path that matters", rises to
 *            RAISED_TILT (0.10) and pushes to CAM_TRIP, carrying the room clear of the plan card's column. The "seen from
 *            above" PlanCard comes in as soon as that column is clear and is in before the route preview draws (on
 *            "path"); the gap at the wall is marked on the floor in ink (GapMarker, as in S1.4) while the light goes
 *            through it and back. The sensor's far lens flashes on "sensor" (the sound's frame) and a cluster of 24 light
 *            dots leaves it, out over its box a few frames later, and reaches each stop on its word
 *            (wall, person, wall, sensor) at one constant, slowed speed. At each bounce most of the dots scatter away
 *            and fade; 8, then 3, then 1 carry on (seeded). In the room the wall -> person leg is seen crossing the slot
 *            between the partition's far end and the wall, then goes behind the far end (lib/room assertAroundTheEnd)
 *            and ends at his outline (the partition as drawn and the people hide light: partitionHides, figuresHide);
 *            on "person" his wall-side outline flashes (rimFlash) (the stop rings never cross a person). The card runs the
 *            same dots (dotAt), stop rings and fans on the same frames, so "round the end, by way of the wall" reads
 *            from above. A tally of the 24 greys out as they are lost ("not to scale"). "Each bounce spreads the light": scatter fans at
 *            the wall spot and at him; "most of it is lost": they leave. Chip "slowed down · illustrative".
 *  S3.2 s14  pan to CAM_PATH_SIDE to make room; an illustrative arrival card slides in: blocks drop into time slots, a
 *            tall stack "1 bounce · wall", then one small late block "3 bounces · him" ("tiny": he looks smug).
 *  S3.3 s15–s16  the evidence board slides over: the authors' released raw histogram (centre zone of the 3×3-zone
 *            sensor) on a linear axis; one tall spike ("the wall's big echo"); a bar magnifier slides over the tail and
 *            stretches its height ×1 → ×ZOOM ("zoom in to see"); "hundreds of times weaker (this capture)"; the bump is
 *            ringed ("That bump is the clue"), its time after the wall echo is measured ("timing") and turned into
 *            "≈ 1.1 m extra path" ("farther"). Every number comes from S3_EchoBoard's checks against the data file.
 *
 * Every beat is cued from narration words (K); gaps are clamped so the scene survives ±20 % timing changes. Every light
 * leg the room draws (route preview, the dots' lanes, the scattered dots, the fans) is checked at module load with the
 * kit's light-path rule at every tilt and zoom it is drawn at, and the screen furniture (tags, tally, chip, plan card)
 * is checked against the rigs and each other (≥ GAP_PX); any failure throws.
 */

/* ================================================================== cues (narration words) */

const SC = scene('S3');
const K = {
  start: SC.from,
  end: SC.to,
  // s13
  follow: at('s13', 'follow'),
  path: at('s13', 'path'),
  sensorA: at('s13', 'sensor', 1),
  wallA: at('s13', 'wall', 1),
  person: at('s13', 'person'),
  wallB: at('s13', 'wall', 2),
  sensorB: at('s13', 'sensor', 2),
  each: at('s13', 'each'),
  spreads: at('s13', 'spreads'),
  most: at('s13', 'most'),
  lost: at('s13', 'lost'),
  s13End: segEnd('s13'),
  // s14
  s14: seg('s14').from,
  coming: at('s14', 'coming'),
  once: at('s14', 'once'),
  wall14: at('s14', 'wall'),
  our: at('s14', 'our'),
  echo14: at('s14', 'echo'),
  three: at('s14', 'three'),
  tiny: at('s14', 'tiny'),
  s14End: segEnd('s14'),
  // s15
  this15: at('s15', 'this'),
  real: at('s15', 'real'),
  data: at('s15', 'data'),
  same: at('s15', 'same'),
  sensor15: at('s15', 'sensor'),
  object: at('s15', 'object'),
  walls: at('s15', "wall's"),
  echo15: at('s15', 'echo'),
  then: at('s15', 'then'),
  later: at('s15', 'later'),
  bump15: at('s15', 'bump'),
  zoom: at('s15', 'zoom'),
  see: at('s15', 'see'),
  capture: at('s15', 'capture'),
  hundreds: at('s15', 'hundreds'),
  s15End: segEnd('s15'),
  // s16
  bump16: at('s16', 'bump'),
  clue: at('s16', 'clue'),
  timing: at('s16', 'timing'),
  farther: at('s16', 'farther'),
  s16End: segEnd('s16'),
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== geometry (same choices as S1.4–S1.7) */

/** The light-path plane: S, the wall spots and his point H share one height (layout sensor.h, 0.95 m: his chest). */
const LIGHT_H = LAYOUT.sensor.h;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;
const P3 = (p: P2, h = LIGHT_H): PlanPt => ({x: p.x, z: p.z, h});

/* ================================================================== beats derived from the cues (camera-free) */

// S3.1 — the rise and push in (one move, from S2's last framing, on "Follow the path that matters"), the plan card,
// the route preview, the cluster's trip, the recap fans. The move ends ~24 frames before the launch so the card can
// come in (once the room has cleared its column) and the route can draw before the dots leave.
const PUSH0 = Math.max(K.start + 2, K.follow - 6);
const PUSH_DUR = clamp(K.sensorA - 24 - PUSH0, 30, 44);
const PUSH_END = PUSH0 + PUSH_DUR;
/** S2's "what survives: timing" card, carried across the cut where S2 left it (S3_TimingCard), holds a few frames and
 *  slides out left, accelerating (quadratic: no last-frame jump), as the push starts (review r1 D03); fully off the
 *  frame after TCARD_OUT_DUR. */
const TCARD_OUT = PUSH0 + 1;
const TCARD_OUT_DUR = 16;
const accel = (x: number) => x * x;
const TCARD_TRAVEL = TIMING_CARD.x1 + TIMING_CARD.shadow.dx + 12;
/**
 * The S3.2 pan shows the room's open left end around the arrivals card (review r1 D20): the set's shell (wall,
 * skirting, wall top, floor, slab front, shadow) runs EXT_M further left (RoomSet extendLeft). Merge r3: S2.4 now
 * draws its room with the same extension (lib/shots HANDOFF_S2S3_EXTEND), so S3 opens with it (EXT_ON = K.start) and
 * the S2 -> S3 match cut, the carried card's exit and the push show wall and floor left of the room, never bare paper.
 * The extended end stays out of frame from the cut until the board covers the room (asserted below).
 */
const EXT_M = HANDOFF_S2S3_EXTEND;
const EXT_ON = K.start;
// S3.2 — pan, card, blocks
const PAN0 = K.s13End - 4;
const PAN_DUR = 30;
const ROUTE_GONE = PAN0 + 12; // the dimmed route fades with the pan's start
// "seen from above": the plan card comes in as soon as the push has cleared its column (CARD_IN, derived from the
// camera below), is fully in before the route preview draws, and leaves before the S3.2 pan
const CARD_IN_DUR = 14;
const CARD_OUT = PAN0 - 9;
const CARD_OUT_DUR = 10;

/* ================================================================== screen furniture and cameras */

type Rect = {x0: number; y0: number; x1: number; y1: number};
/** Smallest gap (screen px) between the screen furniture (tags, tally, chip, plan card) and the rigs or each other. */
const GAP_PX = 20;
/** The caption band: no critical text below this line (bottom 12 %); text stays inside a 5 % margin. */
const CAPTION_Y = 1080 * 0.88;
const SAFE = {x0: 1920 * 0.05, y0: 1080 * 0.05, x1: 1920 * 0.95};
/** "slowed down · illustrative" chip, top right, its right edge on the 5 % margin (measured on renders: 447 x 58; review
 *  r1 D44: it used to start at the card's left edge and reach x 1847). */
const CHIP_BOX: Rect = {x0: SAFE.x1 - 447, y0: 60, x1: SAFE.x1, y1: 118};
/** The plan card (lib/shots PLAN_CARD_RECT's column and size, 432 x 372 = PLAN_CARD_AREA inside the 5 % margin, review
 *  r1 D44), under the chip; its box includes the 9 / 11 px hard shadow. */
const CARD_SIZE = planCardSize(PLAN_CARD_AREA);
const CARD_VIEW = viewForArea(PLAN_VIEW, PLAN_CARD_AREA);
const CARD_POS = {x: PLAN_CARD_RECT.x, y: CHIP_BOX.y1 + 24};
const CARD_BOX: Rect = {x0: CARD_POS.x, y0: CARD_POS.y, x1: CARD_POS.x + CARD_SIZE.w + 9, y1: CARD_POS.y + CARD_SIZE.h + 11};
/** The tally (top left; measured on renders: 456 x 133; its text starts 23 px in, at the 5 % margin). */
const TALLY_POS = {x: SAFE.x0 - 20, y: 50};
const TALLY_BOX: Rect = {x0: TALLY_POS.x, y0: TALLY_POS.y, x1: TALLY_POS.x + 456, y1: TALLY_POS.y + 133};
/** Screen y of the soles + 30 world px at CAM_TRIP (baseline: the same). */
const FEET_Y = 1040;

/**
 * Rig boxes in rig units (scale 1, feet at 0), measured on full-res renders of this scene's poses (+4..8 units of
 * slack): head (hair, glasses, her pencil) and body (arms, hands). She stands with her arms crossed, as in S2 (the
 * readout stays clear: CRITIC_cast-props), elbows at ±84. His left arm is behind the partition throughout S3, so his
 * body box starts at his visible left side.
 */
const RIG_BOX = {
  checker: {head: {l: 80, r: 92, top: 452, bottom: 312}, body: {l: 92, r: 92, top: 315}},
  guesser: {head: {l: 84, r: 60, top: 468, bottom: 300}, body: {l: 78, r: 136, top: 315}},
};
const rigRects = (pl: {x: number; y: number; scale: number}, b: (typeof RIG_BOX)['checker']): Rect[] => [
  {x0: pl.x - b.head.l * pl.scale, x1: pl.x + b.head.r * pl.scale, y0: pl.y - b.head.top * pl.scale, y1: pl.y - b.head.bottom * pl.scale},
  {x0: pl.x - b.body.l * pl.scale, x1: pl.x + b.body.r * pl.scale, y0: pl.y - b.body.top * pl.scale, y1: pl.y},
];
const toScreenRect = (cam: Cam, r: Rect): Rect => {
  const a = worldToScreen(cam, r.x0, r.y0);
  const b = worldToScreen(cam, r.x1, r.y1);
  return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
};
/** Gap between two rects (px; negative = overlap depth). */
const rectGap = (a: Rect, b: Rect) => Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1);

/**
 * S2 -> S3 is a one-room match cut (review r1 D03, lead L1 option a): S2.4 ends on the room at tilt 0 framed by
 * lib/shots HANDOFF_S2S3 (S2's CAM_D) with its "what survives: timing" card settled in the left column, and S3 opens on
 * the same camera, at tilt 0, with both people in S2's final poses and that card where S2 left it (S3_TimingCard), so
 * only S2's light routes go at the cut. The card slides out left as the push starts, over the wall and floor both scenes
 * continue past the room's left end (HANDOFF_S2S3_EXTEND, merge r3: no bare paper in this framing); the push to
 * CAM_TRIP then carries the room left, clear of the plan card's column (CAM_PATH's room-right-of-card layout, closer).
 */
const CAM_OPEN: Cam = HANDOFF_S2S3;
/**
 * S3.1 at RAISED_TILT, framed from the projected subjects: both characters head to feet, the wall spot W3 and the
 * partition's far top corner (the light goes round that end), in screen x 40 .. the card column (PLAN_CARD_RECT.x -
 * GAP_PX), her hair GAP_PX under the tally, soles at FEET_Y. As close as those allow (the 2 m screen's far top and the
 * card column cap it).
 */
const CAM_TRIP: Cam = (() => {
  const s = viewAt(RAISED_TILT);
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
  const gu = rigAt(H.x, H.z, RAISED_TILT);
  const her = rigRects(op, RIG_BOX.checker);
  const him = rigRects(gu, RIG_BOX.guesser);
  const farTop = projectWith(s, {x: OCC.x - OCC.thickness / 2, z: OCC.z0, h: partitionTopH(OCC.z0)});
  const w3 = projectWith(s, P3(W.find((p) => p.id === 'W3')!));
  const x0 = Math.min(...her.map((r) => r.x0), w3.x);
  const x1 = Math.max(...him.map((r) => r.x1), w3.x);
  const y1 = Math.max(op.y, gu.y) + 30;
  const xL = 40;
  const xR = CARD_BOX.x0 - GAP_PX;
  const zoom = Math.min((xR - xL) / (x1 - x0), (FEET_Y - TALLY_BOX.y1 - GAP_PX) / (y1 - her[0].y0), (FEET_Y - 40) / (y1 - farTop.y));
  return {cx: (x0 + x1) / 2 - ((xL + xR) / 2 - 960) / zoom, cy: y1 - (FEET_Y - 540) / zoom, zoom};
})();

/** Tilt and camera of the room shot at frame g: tilt 0 -> RAISED_TILT with the push (same ease), then the S3.2 pan. */
const tiltOf = (g: number) => RAISED_TILT * tw(g, PUSH0, PUSH_DUR, E.inOut);
const camOf = (g: number): Cam =>
  camPath(g, CAM_OPEN, [
    {at: PUSH0, dur: PUSH_DUR, to: CAM_TRIP},
    {at: PAN0, dur: PAN_DUR, to: CAM_PATH_SIDE},
  ]);
/** Screen boxes of both rigs at frame g (room camera and tilt of that frame). */
const rigScreenRects = (g: number) => {
  const cam = camOf(g);
  const tilt = tiltOf(g);
  return [...rigRects(rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt), RIG_BOX.checker), ...rigRects(rigAt(H.x, H.z, tilt), RIG_BOX.guesser)].map((r) => toScreenRect(cam, r));
};
/** First frame of the push from which the card's column stays clear of both rigs (≥ GAP_PX) until the card leaves. */
const CARD_IN = (() => {
  const clearAt = (g: number) => rigScreenRects(g).every((r) => rectGap(CARD_BOX, r) >= GAP_PX);
  let first = -1;
  for (let g = CARD_OUT + CARD_OUT_DUR; g >= PUSH0; g--) {
    if (!clearAt(g)) break;
    first = g;
  }
  if (first < 0) throw new Error('S3: the plan card column never clears the rigs during S3.1');
  return Math.max(K.start + 6, first);
})();
/** The route preview draws on "path", once the card is fully in, and is done before the dots launch on "sensor". */
const ROUTE0 = Math.max(K.path, CARD_IN + CARD_IN_DUR);
const ROUTE1 = Math.max(ROUTE0 + 18, Math.min(ROUTE0 + 36, K.sensorA - 4));

/** Every distinct (tilt, zoom) the room shows over frames [g0, g1] (for the module-load light checks). */
const viewsOver = (g0: number, g1: number) => {
  const out: {g: number; tilt: number; zoom: number}[] = [];
  const seen = new Set<string>();
  for (let g = Math.floor(g0); g <= Math.ceil(g1); g++) {
    const tilt = tiltOf(g);
    const zoom = camOf(g).zoom;
    const key = `${tilt.toFixed(5)}|${zoom.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({g, tilt, zoom});
  }
  return out;
};

/**
 * The wall spot of the round trip: W3, S1's choice (the ~7 ns the storyboard labels). In plan the legs clear the
 * partition (assertPath); the screen checks (assertAroundTheEnd, spot in view, clear of her head) run below at every
 * view the route and the trip are drawn at. W1 and W2 sit behind her head at 0.95 m and W4 behind the far edge, so
 * there is no fallback spot: a failing check throws.
 */
const WP = W.find((p) => p.id === 'W3')!;
const PATH = confocalPath(S, WP, H); // S, W, H, W, S
assertPath(PATH, OLAYOUT);
const CUM = pathCumulative(PATH);
const TOTAL = CUM[CUM.length - 1];

/* ================================================================== beats on the light's schedule */

const LAUNCH = K.sensorA;
const ARRIVE = Math.max(LAUNCH + 72, K.sensorB);
const SCHED = pathSchedule(PATH, {start: LAUNCH, dur: ARRIVE - LAUNCH});
const VF = SCHED.vertexFrames; // S, W, H, W, S
const SPEED = TOTAL / (ARRIVE - LAUNCH); // metres per frame (slowed: illustrative)
const FANS0 = Math.max(ARRIVE + 10, K.spreads - 6);
const FANS_OUT = Math.max(FANS0 + 24, K.most);
const FANS_GONE = FANS_OUT + 22;
const RELAX = Math.max(FANS_OUT, K.lost - 4); // he relaxes as the light is lost
const TAGS_OUT = K.s13End - 6;
/** The light reaches him: the rim flash on his wall-side outline (and his flinch). */
const HIT = VF[2];
const rimT = (g: number) => tw(g, HIT - 1, 3) * (1 - tw(g, HIT + 6, 10));

// S3.2 — card and blocks (the pan is above)
const CARD0 = Math.max(PAN0 + PAN_DUR - 10, K.s14 - 6); // after the camera has made room
const CARD_DUR = 16;
const WALL_N = 9;
const WALL0 = Math.max(CARD0 + CARD_DUR + 4, K.coming - 4);
const WALL_STEP = clamp((K.once - 2 - WALL0) / (WALL_N - 1), 2, 4);
const HIM_LAND = Math.max(WALL0 + WALL_STEP * (WALL_N - 1) + 14, K.echo14 + 6);
const WALL_LAST = Math.round(WALL0 + WALL_STEP * (WALL_N - 1));
const WALL_LABEL = Math.max(K.once - 2, WALL_LAST + 2);
const HIM_LABEL = Math.max(K.three - 2, HIM_LAND + 4);
const TINY = Math.max(K.tiny, HIM_LAND + 10);
const SMUG = TINY;

// S3.3 — the evidence board
const BOARD0 = Math.max(SMUG + 14, K.this15 - 2);
const BOARD_DUR = 14;
const LAND = BOARD0 + BOARD_DUR;
/** The board's slide (E.out) has no overshoot, so its tail is a crawl of a few px: it reads as landed once less than
 *  1 % of its travel is left. The paper_slap goes there, not on LAND (review r1 D14, checked for S3). */
const BOARD_TRAVEL = 1960;
const boardOffset = (g: number) => (1 - tw(g, BOARD0, BOARD_DUR, E.out)) * BOARD_TRAVEL;
const BOARD_HIT = (() => {
  for (let g = BOARD0; g <= LAND; g++) if (boardOffset(g) <= 0.01 * BOARD_TRAVEL) return g;
  return LAND;
})();
/** The wall's echo is plotted on "real data" (review r1 D05: the board sat empty under "Real measurements" for ~4 s);
 *  the conditions chip, the source chip, the 3×3 box and "plotted: the centre zone" then build over a plotted curve,
 *  "wall's echo" is labelled on "the wall's" and the peak pulses on "big echo" (two beats, so the board does not sit
 *  still from the label to "then"). */
const DRAW_A0 = Math.max(LAND + 10, K.real);
const DRAW_A1 = Math.max(DRAW_A0 + 16, K.data + 10);
const SPIKE_LABEL = Math.max(DRAW_A1 + 2, K.walls - 2);
const SPIKE_PULSE = Math.max(SPIKE_LABEL + 10, K.echo15 - 2);
const SPIKE_PULSE_DUR = 14;
/** The pen-head dot leaves the curve's foot while the board waits for "then" (back on the curve for the tail). */
const PEN_OUT = DRAW_A1 + 2;
const PEN_OUT_DUR = 6;
const DRAW_B0 = Math.max(DRAW_A1 + 6, K.then);
const DRAW_B1 = Math.max(DRAW_B0 + 24, K.later + 8);
const LENS0 = Math.max(DRAW_B1 + 2, K.bump15 - 6);
const SLIDE0 = LENS0 + 8;
const SLIDE1 = Math.max(SLIDE0 + 14, K.zoom);
const ZOOM0 = SLIDE1 + 2;
const ZOOM1 = Math.max(ZOOM0 + 22, K.see + 12);
const RATIO0 = Math.max(ZOOM1 + 4, K.hundreds - 4);
const RING0 = Math.max(RATIO0 + 20, K.bump16 - 2);
const DIM0 = Math.max(RING0 + 18, K.timing - 2);
const EXTRA0 = Math.max(DIM0 + 14, K.farther - 4);

/* ================================================================== the light dots (S3.1) */

const NDOTS = 24;
/** Dot radius (world px): ~16 px on screen at CAM_TRIP's zoom. */
const DOT_R = 16 / CAM_TRIP.zoom;
/** Lane offset (world px) of the cluster beside the dashed route, plus each dot's own spread across it. */
const LANE_PX = 7;
/** Dots carried on each leg (S->W, W->H, H->W, W->S): most are lost at every bounce (illustrative). */
const SURVIVE = [24, 8, 3, 1];
/** A seeded ranking: dot i survives leg L when RANK[i] < SURVIVE[L]. */
const RANK = (() => {
  const idx = Array.from({length: NDOTS}, (_, i) => i);
  idx.sort((a, b) => rand(7100 + a * 13) - rand(7100 + b * 13));
  const r = new Array<number>(NDOTS);
  idx.forEach((dot, k) => (r[dot] = k));
  return r;
})();
// spread of the cluster: along the path (m) and across it (px); the last survivor rides at the front
const LAG = Array.from({length: NDOTS}, (_, i) => (RANK[i] === 0 ? 0.01 : 0.03 + rand(7300 + i * 7) * 0.24));
const ACROSS = Array.from({length: NDOTS}, (_, i) => (RANK[i] === 0 ? 0 : (rand(7500 + i * 11) - 0.5) * 30));
/** Leg each dot is lost at (1..3 = the bounce at PATH[L]), or 4 for the one that comes home. */
const LOST_AT = RANK.map((r) => (r < SURVIVE[3] ? 4 : r < SURVIVE[2] ? 3 : r < SURVIVE[1] ? 2 : 1));
/** Least screen px below a partition end's top corner at which a scattered dot may slip behind that end. */
const MIN_BELOW_CORNER_PX = 24;
/**
 * Scatter direction of each lost dot (cosine-weighted about the surface normal, seeded) and how far it flies before it
 * has faded out: its reach, stopped at the partition in plan (firstOccluderHit) and, in the raised room view, where it
 * first goes behind the partition (a lost dot is not followed round behind the screen). A dot that would go behind
 * within MIN_BELOW_CORNER_PX of a top corner (rays skimming the wall to the right come out over the near end's top
 * corner) fades out just before the edge instead, so no scattered dot ever crosses the top band (assertAroundTheEnd
 * below checks every ray).
 */
const SCATTER: (P2 & {max: number})[] = (() => {
  const out: (P2 & {max: number})[] = new Array(NDOTS);
  const s = viewAt(RAISED_TILT);
  for (const L of [1, 2, 3]) {
    const lost = Array.from({length: NDOTS}, (_, i) => i).filter((i) => LOST_AT[i] === L);
    const V = PATH[L];
    const normal = L === 2 ? normalize(sub(WP, H)) : {x: 0, z: 1};
    const dirs = scatterDirections(normal, lost.length, 40 + L, 0.9);
    // shuffle the directions over the lost dots so neighbours in the cluster do not fan in order
    const order = lost.map((_, k) => k).sort((a, b) => rand(7700 + L * 31 + a) - rand(7700 + L * 31 + b));
    lost.forEach((i, k) => {
      const d = dirs[order[k]];
      const reach = 0.7 + rand(7900 + i * 5) * 0.55;
      const end = {x: V.x + d.x * reach, z: V.z + d.z * reach};
      let max = reach * firstOccluderHit(V, end, OLAYOUT, 0.02);
      const c = partitionCrossings(P3(V), P3({x: V.x + d.x * max, z: V.z + d.z * max}), s, {zoom: CAM_TRIP.zoom}).crossings[0];
      if (c) max *= c.edge !== 'top' && c.belowCornerPx >= MIN_BELOW_CORNER_PX + 6 ? Math.min(1, c.u + 0.02) : Math.max(0, c.u - 0.04);
      out[i] = {x: d.x, z: d.z, max};
    });
  }
  return out;
})();
const LEG_I = [1, 0.62, 0.42, 0.3]; // intensity per leg (thinner, paler later)

type DotState = {p: P2; leg: number; op: number; r: number; I: number; across: number; scattering: boolean};
/** Where dot i is at frame g (null when not in flight). */
const dotAt = (i: number, g: number): DotState | null => {
  const d = SPEED * (g - LAUNCH) - LAG[i];
  if (d <= 0) return null;
  const lostAt = LOST_AT[i];
  const dEnd = CUM[lostAt];
  if (d < dEnd) {
    let L = 0;
    while (L < 3 && d >= CUM[L + 1]) L++;
    const u = (d - CUM[L]) / (CUM[L + 1] - CUM[L]);
    return {p: lerpP(PATH[L], PATH[L + 1], u), leg: L, op: 1, r: DOT_R * (0.75 + 0.25 * LEG_I[L]), I: LEG_I[L], across: ACROSS[i] * (0.6 + 0.4 * LEG_I[L]), scattering: false};
  }
  if (lostAt === 4) return null; // home: absorbed by the detector
  const sc = SCATTER[i];
  const s = d - dEnd;
  if (s >= sc.max) return null;
  const V = PATH[lostAt];
  const I = LEG_I[lostAt - 1];
  const fade = 1 - E.in(clamp01(s / sc.max));
  return {p: {x: V.x + sc.x * s, z: V.z + sc.z * s}, leg: lostAt - 1, op: fade, r: DOT_R * (0.75 + 0.25 * I) * (1 - 0.35 * clamp01(s / sc.max)), I, across: 0, scattering: true};
};
/** Frame at which dot i leaves the path (its bounce), or Infinity for the one that comes home. */
const lostFrame = (i: number) => (LOST_AT[i] === 4 ? Infinity : LAUNCH + (CUM[LOST_AT[i]] + LAG[i]) / SPEED);
/** Last frame any dot is drawn (the last scattered dot fades out). */
const DOTS_GONE = Math.ceil(
  Math.max(ARRIVE, ...Array.from({length: NDOTS}, (_, i) => (LOST_AT[i] === 4 ? LAUNCH + (TOTAL + LAG[i]) / SPEED : LAUNCH + (CUM[LOST_AT[i]] + LAG[i] + SCATTER[i].max) / SPEED))),
);

/** Screen-perpendicular unit vector of each leg of PATH at a view (the cluster rides in a lane beside the route). */
const legNormals = (s: ViewState) =>
  PATH.slice(0, -1).map((a, k) => {
    const pa = projectWith(s, P3(a));
    const pb = projectWith(s, P3(PATH[k + 1]));
    const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
    return {x: -(pb.y - pa.y) / L, y: (pb.x - pa.x) / L};
  });
/**
 * A light-plane point moved by a screen offset (ox, oy) world px, as a true 3D point (x and h only: x maps to screen x
 * and h to screen y), so the kit's occlusion tests apply to what is drawn exactly.
 */
const lift = (p: P2, ox: number, oy: number, s: ViewState): PlanPt => ({x: p.x + ox / s.ppm, z: p.z, h: LIGHT_H - oy / (s.ppm * Math.max(s.height, 1e-6))});

/**
 * The flash on "sensor" (review r1 D15): the sensor_pulse sound is on LAUNCH, but the dots leave from the sensor's far
 * face, behind its box, and only come out over its top edge a few frames later. So the far face's lens flashes on
 * LAUNCH (HandheldSensor / SensorTop opt-in `burst`, a saffron halo, plus one expanding ring): the halo holds until
 * the first dot is out of the box (EMERGE: its centre past the box's drawn outline, at the drawn lane offset), then
 * fades over BURST_FADE frames.
 */
const BURST_FADE = 4;
const BURST_RING = 9;
const EMERGE = (() => {
  for (let g = LAUNCH; g <= LAUNCH + 20; g++) {
    const tilt = tiltOf(g);
    const s = viewAt(tilt);
    const nrm = legNormals(s);
    const box = standGeometry(tilt).box;
    for (let i = 0; i < NDOTS; i++) {
      const d = dotAt(i, g);
      if (!d || d.scattering) continue;
      const off = LANE_PX + d.across;
      const q = projectWith(s, lift(d.p, nrm[d.leg].x * off, nrm[d.leg].y * off, s));
      const pad = 2; // half the box's ink outline
      if (q.x < box.x0 - pad || q.x > box.x1 + pad || q.y < box.y0 - pad || q.y > box.y1 + pad) return g;
    }
  }
  throw new Error('S3: no light dot comes out of the sensor box within 20 frames of the launch');
})();
if (EMERGE - LAUNCH > 10) throw new Error(`S3: the first dot leaves the sensor box ${EMERGE - LAUNCH} frames after the flash (the burst would hang)`);
const burstAt = (g: number) => (g < LAUNCH ? 0 : 1 - tw(g, EMERGE, BURST_FADE, E.inOut));
const burstRingAt = (g: number) => (g < LAUNCH || g > LAUNCH + BURST_RING ? undefined : (g - LAUNCH) / BURST_RING);

/* ================================================================== fans (S3.1 recap) */

const FAN_W = {origin: WP, dirs: scatterDirections({x: 0, z: 1}, 9, 4), length: 0.6, seed: 5};
const FAN_H = {origin: H, dirs: scatterDirections(sub(WP, H), 7, 9), length: 0.5, seed: 8};
/** The rays a ScatterFan draws (same lengths and occluder stop as components/v02/Optics ScatterFan, stopMargin 0.05). */
const fanRays = (f: {origin: P2; dirs: ScatterDir[]; length: number; seed: number}) =>
  f.dirs.map((d, i) => {
    const L = f.length * (0.3 + 0.7 * d.w) * (0.85 + 0.3 * rand(f.seed * 53 + i * 7));
    const end = {x: f.origin.x + d.x * L, z: f.origin.z + d.z * L};
    return [f.origin, lerpP(f.origin, end, firstOccluderHit(f.origin, end, OLAYOUT, 0.05))] as [P2, P2];
  });

/* ================================================================== module-load checks: the light-path rule */

/** S3.1 stop tags: world anchors at a tilt, screen offsets, settled sizes (measured on renders). */
type TagDef = {text: string; at: number; again?: number; anchor: (tilt: number) => {x: number; y: number}; dx: number; dy: number; w: number; h: number};
const TAG_H = 56;
// No "sensor" tag: the readout is in plain view (her arms are crossed) and fires on "sensor"; between the stand and
// the partition's far end there is no room for one that clears her and does not sit across that end's edge.
const TAGS: TagDef[] = [
  // above-left of the spot, between her hair and the partition's far end
  {text: 'wall', at: K.wallA, again: K.wallB, anchor: (tilt) => projectWith(viewAt(tilt), P3(WP)), dx: 12, dy: -84, w: 114, h: TAG_H},
  // above his hair (the plan card holds the column to his right)
  {text: 'person', at: K.person, anchor: (tilt) => {
    const gu = rigAt(H.x, H.z, tilt);
    return {x: gu.x, y: gu.y - RIG_BOX.guesser.head.top * gu.scale};
  }, dx: 0, dy: -(TAG_H / 2 + GAP_PX + 6), w: 170, h: TAG_H},
];
const tagRect = (tg: TagDef, cam: Cam, tilt: number, k = 1): Rect => {
  const q = worldToScreen(cam, tg.anchor(tilt).x, tg.anchor(tilt).y);
  const cx = q.x + tg.dx;
  const cy = q.y + tg.dy;
  return {x0: cx - (tg.w * k) / 2, x1: cx + (tg.w * k) / 2, y0: cy - (tg.h * k) / 2, y1: cy + (tg.h * k) / 2};
};

/** Margins measured by the checks below (screen px), for the report and the dev overlay. */
export const S3_MARGINS: Record<string, number> = {};
const MIN_SPOT_CLEAR_PX = 40;

(() => {
  const fails: string[] = [];
  const keep = (key: string, v: number) => (S3_MARGINS[key] = Math.min(S3_MARGINS[key] ?? Infinity, v));
  // (0) the W3 round trip over the rise's tilts at CAM_TRIP's zoom (plan §4 S3.1, as S1's pickWall)
  for (const f of [0, 0.25, 0.5, 0.75, 1]) assertAroundTheEnd(`S3 W3 round trip @tilt ${f} x RAISED`, [PATH.map((p) => P3(p))], viewAt(f * RAISED_TILT), {zoom: CAM_TRIP.zoom});
  // (1) the route preview S -> W -> H, at every tilt and zoom it is drawn at (the rise, the hold, the pan's first frames)
  for (const v of viewsOver(ROUTE0, ROUTE_GONE)) {
    const s = viewAt(v.tilt);
    assertAroundTheEnd(`S3 route @${v.g}`, [[S, WP, H].map((p) => P3(p))], s, {zoom: v.zoom});
    for (const r of [partitionCrossings(P3(WP), P3(H), s, {zoom: v.zoom})]) for (const c of r.crossings) keep(`route W->H ${c.dir} ${c.edge} (px below corner)`, c.belowCornerPx);
    keep('route S->W clear of the partition (px)', partitionCrossings(P3(S), P3(WP), s, {zoom: v.zoom}).frontClearPx);
  }
  // (2) the trip: the round trip, each leg's dot lanes (the extreme screen offsets), every scattered dot's ray and the
  // recap fans, at every view they are drawn at
  for (const v of viewsOver(LAUNCH, Math.max(DOTS_GONE, FANS_GONE))) {
    const s = viewAt(v.tilt);
    const nrm = legNormals(s);
    const lo = LANE_PX - 15;
    const hi = LANE_PX + 15;
    const lanes = [lo, hi].map((o) => PATH.slice(0, -1).map((a, k) => [lift(a, nrm[k].x * o, nrm[k].y * o, s), lift(PATH[k + 1], nrm[k].x * o, nrm[k].y * o, s)]));
    assertAroundTheEnd(`S3 round trip @${v.g}`, [PATH.map((p) => P3(p))], s, {zoom: v.zoom});
    lanes.forEach((legs, j) => assertAroundTheEnd(`S3 dot lane ${j ? hi : lo}px @${v.g}`, legs, s, {zoom: v.zoom}));
    for (const r of [partitionCrossings(P3(WP), P3(H), s, {zoom: v.zoom})]) for (const c of r.crossings) keep(`trip W->H ${c.dir} ${c.edge} (px below corner)`, c.belowCornerPx);
    for (const legs of lanes) for (const [a, b] of legs) for (const c of partitionCrossings(a, b, s, {zoom: v.zoom}).crossings) keep(`dot lanes ${c.dir} ${c.edge} (px below corner)`, c.belowCornerPx);
    // scattered dots and fan rays: front rays that end on the partition's camera-side face are allowed there (they
    // stop on it, fading); every ray that goes behind the partition must still do it by an end, never the top
    const rays: [P2, P2][] = [];
    for (let i = 0; i < NDOTS; i++) if (LOST_AT[i] < 4) rays.push([PATH[LOST_AT[i]], {x: PATH[LOST_AT[i]].x + SCATTER[i].x * SCATTER[i].max, z: PATH[LOST_AT[i]].z + SCATTER[i].z * SCATTER[i].max}]);
    rays.push(...fanRays(FAN_W), ...fanRays(FAN_H));
    assertAroundTheEnd(`S3 scatter and fan rays @${v.g}`, rays.map(([a, b]) => [P3(a), P3(b)]), s, {zoom: v.zoom, allowFront: true});
    for (const [a, b] of rays) for (const c of partitionCrossings(P3(a), P3(b), s, {zoom: v.zoom}).crossings) keep(`rays ${c.dir} ${c.edge} (px below corner)`, c.belowCornerPx);
    // the stop rings (StopRing below: radius 0.06 -> 0.36 m at the light plane, the room side of the wall only)
    const rings: PlanPt[][] = [];
    for (const v4 of [1, 2, 3, 4])
      for (const r of [0.06, 0.16, 0.26, 0.36]) {
        const pts: PlanPt[] = [];
        for (let k = 0; k <= 64; k++) {
          const a = (k / 64) * Math.PI * 2;
          const p = {x: PATH[v4].x + Math.cos(a) * r, z: PATH[v4].z + Math.sin(a) * r};
          if (p.z >= 0) pts.push(P3(p));
        }
        rings.push(pts);
      }
    assertAroundTheEnd(`S3 stop rings @${v.g}`, rings, s, {zoom: v.zoom, allowFront: true});
    for (const pl of rings) for (let k = 0; k + 1 < pl.length; k++) for (const c of partitionCrossings(pl[k], pl[k + 1], s, {zoom: v.zoom}).crossings) keep(`stop rings ${c.dir} ${c.edge} (px below corner)`, c.belowCornerPx);
  }
  // (3) the wall spot is in view and clear of her head, hair and pencil (≥ MIN_SPOT_CLEAR_PX), of him and of the stand,
  // wherever the route or the dots touch it
  for (const v of viewsOver(ROUTE0, ROUTE_GONE)) {
    const s = viewAt(v.tilt);
    const w = P3(WP);
    if (hiddenByPartition(w, s)) fails.push(`W3 behind the partition @${v.g}`);
    const q = projectWith(s, w);
    const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, v.tilt);
    const gu = rigAt(H.x, H.z, v.tilt);
    let lo = 0;
    let hi = 400;
    if (rigCovers(op, q, 0)) fails.push(`W3 behind her @${v.g}`);
    else {
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        if (rigCovers(op, q, m)) hi = m;
        else lo = m;
      }
      keep('W3 spot clear of her head (px)', lo * v.zoom);
      if (lo * v.zoom < MIN_SPOT_CLEAR_PX) fails.push(`W3 only ${(lo * v.zoom).toFixed(0)} px from her head @${v.g} (needs ${MIN_SPOT_CLEAR_PX})`);
    }
    if (rigCovers(gu, q, MIN_SPOT_CLEAR_PX / v.zoom)) fails.push(`W3 within ${MIN_SPOT_CLEAR_PX} px of him @${v.g}`);
    const b = standGeometry(v.tilt).box;
    if (q.x > b.x0 - 20 && q.x < b.x1 + 20 && q.y > b.y0 - 20 && q.y < b.y1 + 20) fails.push(`W3 on the sensor @${v.g}`);
  }
  // (4) screen furniture: the plan card clears both rigs by GAP_PX on every frame it is up (it comes in during the rise)
  for (let g = CARD_IN; g <= CARD_OUT + CARD_OUT_DUR; g++) {
    const cam = camOf(g);
    const tilt = tiltOf(g);
    const rigs = [...rigRects(rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt), RIG_BOX.checker), ...rigRects(rigAt(H.x, H.z, tilt), RIG_BOX.guesser)].map((r) => toScreenRect(cam, r));
    for (const r of rigs) {
      keep('plan card to the rigs (px)', rectGap(CARD_BOX, r));
      if (rectGap(CARD_BOX, r) < GAP_PX) fails.push(`plan card ${rectGap(CARD_BOX, r).toFixed(0)} px from a rig @${g}`);
    }
  }
  // (5) at the settled trip framing: tags, tally, chip, card and rigs pairwise ≥ GAP_PX apart; text above the captions
  {
    const cam = CAM_TRIP;
    const tilt = RAISED_TILT;
    const rigs = [...rigRects(rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt), RIG_BOX.checker), ...rigRects(rigAt(H.x, H.z, tilt), RIG_BOX.guesser)].map((r) => toScreenRect(cam, r));
    const ui: [string, Rect][] = [...TAGS.map((tg) => [`tag "${tg.text}"`, tagRect(tg, cam, tilt)] as [string, Rect]), ['tally', TALLY_BOX], ['chip', CHIP_BOX], ['plan card', CARD_BOX]];
    // text extents inside each element (pill padding + border; the card's title row only)
    const text: Rect[] = [
      ...TAGS.map((tg) => {
        const r = tagRect(tg, cam, tilt);
        return {x0: r.x0 + 21, x1: r.x1 - 21, y0: r.y0 + 9, y1: r.y1 - 11};
      }),
      {x0: TALLY_BOX.x0 + 23, x1: TALLY_BOX.x1 - 23, y0: TALLY_BOX.y0 + 15, y1: TALLY_BOX.y1 - 15},
      {x0: CHIP_BOX.x0 + 27, x1: CHIP_BOX.x1 - 27, y0: CHIP_BOX.y0 + 12, y1: CHIP_BOX.y1 - 14},
      {x0: CARD_BOX.x0 + 20, x1: CARD_BOX.x0 + 300, y0: CARD_BOX.y0 + 12, y1: CARD_BOX.y0 + 50},
    ];
    ui.forEach(([na, a], i) => {
      const tx = text[i];
      if (tx.y1 > CAPTION_Y || tx.x0 < SAFE.x0 - 0.5 || tx.x1 > SAFE.x1 + 0.5 || tx.y0 < SAFE.y0) fails.push(`${na}: text outside the safe area`);
      rigs.forEach((r, j) => {
        keep(`${na} to the rigs (px)`, rectGap(a, r));
        if (rectGap(a, r) < GAP_PX) fails.push(`${na} ${rectGap(a, r).toFixed(0)} px from rig box ${j}`);
      });
      ui.slice(i + 1).forEach(([nb, b]) => {
        keep(`${na} to ${nb} (px)`, rectGap(a, b));
        if (rectGap(a, b) < GAP_PX) fails.push(`${na} ${rectGap(a, b).toFixed(0)} px from ${nb}`);
      });
    });
    // the tags never sit on the light they name: clear of the visible route (both lanes) by GAP_PX / 2
    const s = viewAt(tilt);
    const nrm = legNormals(s);
    for (const tg of TAGS) {
      const r = tagRect(tg, cam, tilt, 1.08 * 1.12);
      let dmin = Infinity;
      for (let k = 0; k < 2; k++)
        for (const o of [LANE_PX - 15, 0, LANE_PX + 15])
          for (const [u0, u1] of partitionCrossings(lift(PATH[k], nrm[k].x * o, nrm[k].y * o, s), lift(PATH[k + 1], nrm[k].x * o, nrm[k].y * o, s), s).spans)
            for (let u = u0; u <= u1; u += 0.01) {
              const p = projectWith(s, lift(lerpP(PATH[k], PATH[k + 1], u), nrm[k].x * o, nrm[k].y * o, s));
              const q = worldToScreen(cam, p.x, p.y);
              dmin = Math.min(dmin, Math.max(r.x0 - q.x, q.x - r.x1, r.y0 - q.y, q.y - r.y1) - DOT_R * cam.zoom);
            }
      keep(`tag "${tg.text}" to the light (px)`, dmin);
      if (dmin < GAP_PX / 2) fails.push(`tag "${tg.text}" ${dmin.toFixed(0)} px from the light it names`);
    }
  }
  if (fails.length) throw new Error(`S3 path-legibility checks: ${fails.join('; ')}`);
})();

/**
 * Largest screen x (camera `cam`, tilt) of the room set's cross-section at plan x `xe` (the wall's end, the slab's end
 * and its drop shadow, drawn 10, 14 world px down-right), over the samples inside the frame's height: < 0 means that
 * cross-section is out of frame to the left.
 */
const setSliceMaxX = (cam: Cam, tilt: number, xe: number) => {
  const s = viewAt(tilt);
  const {z0, z1, wallHeight: HW} = LAYOUT.room;
  const pts: PlanPt[] = [];
  for (let k = 0; k <= 60; k++) {
    const z = z0 - WALL_T + (z1 - z0 + WALL_T) * (k / 60);
    pts.push({x: xe, z, h: -SLAB_T}, {x: xe, z, h: 0});
    pts.push({x: xe, z: z0 - WALL_T, h: (HW * k) / 60}, {x: xe, z: z0, h: (HW * k) / 60});
  }
  let mx = -Infinity;
  for (const p of pts) {
    const q = projectWith(s, p);
    for (const [dx, dy] of [[0, 0], [10, 14]]) {
      const sc = worldToScreen(cam, q.x + dx, q.y + dy);
      if (sc.y >= -OUTLINE && sc.y <= 1080 + OUTLINE) mx = Math.max(mx, sc.x + OUTLINE);
    }
  }
  return mx;
};

/** Module-load checks of the review r1 fixes (D03 hand-off, D20 set extension, D05 board beats); any failure throws. */
(() => {
  const fails: string[] = [];
  // D03: S3 opens on S2's last framing at tilt 0; the carried card holds a few frames, then has left the frame
  // before the plan card comes in (one card moves at a time)
  const c0 = camOf(K.start);
  if (tiltOf(K.start) !== 0 || c0.cx !== HANDOFF_S2S3.cx || c0.cy !== HANDOFF_S2S3.cy || c0.zoom !== HANDOFF_S2S3.zoom) fails.push('S3 does not open on HANDOFF_S2S3 at tilt 0');
  if (TCARD_OUT - K.start < 3) fails.push(`the carried timing card holds only ${TCARD_OUT - K.start} frames after the cut`);
  if (TCARD_OUT + TCARD_OUT_DUR > CARD_IN) fails.push(`the carried timing card is still leaving (to ${TCARD_OUT + TCARD_OUT_DUR}) when the plan card comes in (${CARD_IN})`);
  if (TIMING_CARD.x1 + TIMING_CARD.shadow.dx - TCARD_TRAVEL >= -OUTLINE) fails.push('the carried timing card does not leave the frame');
  // D20 (+ merge r3): the set extension is on from S3's first frame with the same length S2.4 ends with (so the cut
  // is one set and no frame of S3 switches it on), and from the cut until the board covers the room the extended
  // set's left end stays out of frame (the wall and floor run past the frame's left edge through the push, the carried
  // card's exit and around the arrivals card)
  if (EXT_ON !== K.start || EXT_M !== HANDOFF_S2S3_EXTEND || !(EXT_M > 0)) fails.push(`S3 does not open on S2.4's extended set (EXT_ON ${EXT_ON}, EXT_M ${EXT_M})`);
  const x0 = LAYOUT.room.x0;
  for (let g = EXT_ON; g <= LAND; g++) {
    const mx = setSliceMaxX(camOf(g), tiltOf(g), x0 - EXT_M);
    if (mx >= 0) fails.push(`the extended set's left end is in frame (to ${mx.toFixed(0)} px) @${g}`);
  }
  // D05 (+ D14): the spike is plotted on "real data", once the board has landed and its axes are in, and before
  // "the wall's big echo" labels it; the pen-head dot is gone before the tail draws on "then"; the slap is on the landing
  if (DRAW_A0 < LAND + 10) fails.push('the curve starts before the axes are in');
  if (DRAW_A1 > K.walls - 2) fails.push(`the spike is still drawing (to ${DRAW_A1}) on "the wall's" (${K.walls})`);
  if (SPIKE_LABEL < DRAW_A1 + 2) fails.push("the spike's label comes before the spike");
  if (SPIKE_PULSE + SPIKE_PULSE_DUR > DRAW_B0) fails.push("the peak's pulse is still running when the tail starts");
  if (PEN_OUT + PEN_OUT_DUR > DRAW_B0 - 4) fails.push('the pen-head dot is still fading out when the tail starts');
  if (BOARD_HIT < BOARD0 + 6 || BOARD_HIT > LAND) fails.push(`paper_slap frame ${BOARD_HIT} is not on the board's landing (${BOARD0}..${LAND})`);
  if (fails.length) throw new Error(`S3 review-fix checks: ${fails.join('; ')}`);
})();

/* ================================================================== S3.2 drops (illustrative slots from the room's geometry) */

const SLOT_NS = 1; // one slot per nanosecond on the card
const T_WALL = timeNs(2 * pathLength([S, WP]));
const T_HIM = timeNs(TOTAL);
const DROPS: BlockDrop[] = [
  ...Array.from({length: WALL_N}, (_, k) => ({slot: Math.floor(T_WALL / SLOT_NS), land: Math.round(WALL0 + k * WALL_STEP), tone: 'teal' as const})),
  {slot: Math.floor(T_HIM / SLOT_NS), land: HIM_LAND, tone: 'saffron' as const},
];

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -2},
  {f: LAUNCH, kind: 'sensor_pulse', gain: -4},
  {f: Math.round(VF[1]), kind: 'bounce_tick', pitch: 2, gain: -2},
  {f: Math.round(VF[2]), kind: 'bounce_tick', pitch: -1, gain: -4},
  {f: Math.round(VF[3]), kind: 'bounce_tick', pitch: 3, gain: -7},
  {f: Math.round(VF[4]), kind: 'echo_return', gain: -6},
  // the sample swells from its onset: on the start of the card's slide (review r1 D04)
  {f: CARD0, kind: 'paper_slide', gain: -4},
  {f: DROPS[0].land, kind: 'block_drop', gain: -2},
  {f: DROPS[5].land, kind: 'block_drop', pitch: 2, gain: -6},
  {f: DROPS[WALL_N - 1].land, kind: 'block_drop', pitch: 4, gain: -5},
  {f: HIM_LAND, kind: 'block_drop', pitch: -5, gain: -9},
  {f: SMUG + 4, kind: 'smug_exhale', gain: -3},
  {f: BOARD_HIT, kind: 'paper_slap'},
  {f: SLIDE0, kind: 'magnifier_slide', gain: -3},
  {f: RING0, kind: 'marker_circle'},
];

/* ================================================================== helpers */

/** Room-view mapping for a plan point at the light paths' height (the 2D model's plane, h = LIGHT_H). */
const roomToPx = (s: ViewState): ToPx => (p) => {
  const q = projectWith(s, P3(p));
  return {x: q.x, y: q.y};
};
const pulseAt = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

/**
 * S2's last poses (S2_Mirror guesserBlend / checkerBlend at the end of S2.4, every blend complete), so the cut at 2874
 * does not pop: he is uneasy (a sweat drop) looking left at S2's timing card; she has her arms crossed (CHECKER_BASE),
 * one brow up, looking at the same card.
 */
const S2_END_GUESSER: Pose2 = withPose(HANDS_ON_HIPS, {...EXPR.smug, ...settlePose(1, -1), lid: 0.1, eyes: 1.1, pupil: 1, brows: 0.6, browAsym: 0, mouth: 'hmm', sweat: 0.8, lookX: -0.95, lookY: 0.2, tilt: -4});
const S2_END_LOOK = {lookX: -0.85, lookY: 0.3, tilt: -2, brows: 0.25, browAsym: 0.5};
/** Out of S2's end poses: the timing card has gone, so both look back into the room (just after the cut). */
const settleIn = (g: number) => tw(g, K.start + 2, 12, E.inOut);

const guesserState = (g: number, tilt: number, cluster: {x: number; y: number} | null) => {
  const place0 = rigAt(H.x, H.z, tilt);
  // idle life: S2.4's 0.5 at the cut (so his outline matches S2's last frame), easing to S3's 0.45 with the settle
  const place: RigPlace = {x: place0.x, y: place0.y, scale: place0.scale, frame: g, seed: GUESSER_SEED, life: lerp(0.5, 0.45, settleIn(g))};
  // wary at the start (S2 left him uneasy, sweating), hands on hips; the sweat goes when he relaxes on "lost"
  const wary: Pose2 = withPose(withPose(HANDS_ON_HIPS, {lid: 0.12, eyes: 1.06, brows: 0.4, browAsym: 0.2, mouth: 'hmm', sweat: 0.8, lookX: -0.6, lookY: -0.4, tilt: -3}), settlePose(1, -1));
  let pose: Pose2 = mixPose2(S2_END_GUESSER, wary, settleIn(g));
  // his eyes follow the light while it travels
  const follow = Math.min(tw(g, LAUNCH - 6, 8, E.inOut), 1 - tw(g, ARRIVE + 4, 12, E.inOut));
  if (follow > 0 && cluster) {
    const eye = eyesWorld(place, pose);
    const lx = clamp((cluster.x - eye.x) / 260, -1, 1);
    const ly = clamp((cluster.y - eye.y) / 220, -1, 1);
    pose = {...pose, lookX: lerp(pose.lookX, lx, follow), lookY: lerp(pose.lookY, ly, follow)};
  }
  // the light reaches him: a flinch (blink, wide eyes, small hop), then wary again
  const fl = pulseAt(g, HIT - 1, 16);
  if (fl > 0) pose = mixPose2(pose, {...pose, eyes: 1.2, pupil: 0.7, brows: 0.95, mouth: 'o', lid: 0, tilt: -6, hunch: 0.05}, fl);
  if (g >= HIT - 1 && g < HIT + 2) pose = {...pose, blink: 0.1};
  if (fl > 0) pose = {...pose, bob: hop(g, HIT, 6, 8)};
  // "most of it is lost": relief, smug again
  const relax = tw(g, RELAX, 16, E.inOut);
  if (relax > 0) {
    const smug: Pose2 = withPose(withPose(HANDS_ON_HIPS, {...EXPR.smug, lookX: -0.5, lookY: -0.15}), settlePose(1, -1));
    pose = mixPose2(pose, smug, relax);
  }
  // S3.2: watches the card (left)
  const card = tw(g, CARD0 + 4, 12, E.inOut);
  if (card > 0) pose = mixPose2(pose, {...pose, lookX: -0.95, lookY: 0.1, tilt: 2}, card);
  // "Our friend's echo": the narration turns to him; brows up, eyes wide, the sweat drop back, until his block lands
  // (small): relief, then "tiny" below
  const worry = Math.min(tw(g, K.our - 3, 8, E.inOut), 1 - tw(g, HIM_LAND + 4, 10, E.inOut));
  if (worry > 0) pose = mixPose2(pose, {...pose, eyes: 1.14, pupil: 0.85, lid: 0, brows: 0.75, browAsym: 0.1, mouth: 'hmm', tilt: -2, hunch: 0.04, sweat: 0.8, lookY: 0.2}, worry);
  // "tiny": the smuggest he gets (chin up, eyes closed a moment, smirk)
  const sm = tw(g, SMUG, 10, E.out);
  if (sm > 0) {
    const ex = pulseAt(g, SMUG + 2, 26);
    const very: Pose2 = withPose(withPose(HANDS_ON_HIPS, {...EXPR.smug, lid: 0.55 + 0.4 * ex, browAsym: 0.8, tilt: 8, lookX: -0.7, lookY: -0.2, mouth: 'smirk'}), settlePose(1.1, -1));
    pose = mixPose2(pose, very, sm);
  }
  return {pose, place};
};

const checkerState = (g: number, tilt: number) => {
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const place: RigPlace = {x: op.x, y: op.y, scale: op.scale, frame: g, seed: CHECKER_SEED, life: 0.35};
  const back = settleIn(g);
  const atReadout = {lookX: lerp(S2_END_LOOK.lookX, 0.62, back), lookY: lerp(S2_END_LOOK.lookY, 0.32, back), tilt: lerp(S2_END_LOOK.tilt, 3, back)};
  const atWall = {lookX: 0.25, lookY: -0.75, tilt: -2};
  const atCard = {lookX: -0.85, lookY: 0.15, tilt: -2};
  const atHim = {lookX: 0.95, lookY: -0.05, tilt: -1};
  // she glances up at the wall spot as the light goes out, back to her readout for the return
  const up = Math.min(tw(g, VF[1] - 10, 10, E.inOut), 1 - tw(g, VF[3] + 2, 10, E.inOut));
  const card = Math.min(tw(g, CARD0 + 10, 12, E.inOut), 1 - tw(g, SMUG + 2, 8, E.inOut));
  const him = tw(g, SMUG + 2, 8, E.inOut);
  // S3.2 "bounced once, off the wall": a glance up at the wall, back to the card
  const glance = Math.min(tw(g, K.wall14 - 14, 9, E.inOut), 1 - tw(g, K.wall14 + 12, 10, E.inOut));
  const mixL = (a: number, b: number, c: number, d: number) => {
    let v = a;
    v = lerp(v, b, up);
    v = lerp(v, c, card);
    v = lerp(v, b, glance);
    v = lerp(v, d, him);
    return v;
  };
  const look = {
    lookX: mixL(atReadout.lookX, atWall.lookX, atCard.lookX, atHim.lookX),
    lookY: mixL(atReadout.lookY, atWall.lookY, atCard.lookY, atHim.lookY),
    tilt: mixL(atReadout.tilt, atWall.tilt, atCard.tilt, atHim.tilt),
  };
  // a raised brow when the one dot comes home
  const brow = sp(g, ARRIVE + 2, SNAP) * (1 - tw(g, ARRIVE + 30, 14));
  const s2 = 1 - back;
  // arms crossed, as in S2: the readout on the stand stays in plain view
  const pose: Pose2 = withPose(ARMS_CROSSED, {...EXPR.deadpan, ...look, brows: -0.05 + (S2_END_LOOK.brows + 0.05) * s2 + 0.35 * brow + 0.15 * him, browAsym: S2_END_LOOK.browAsym * s2 + 0.45 * brow + 0.35 * him});
  return {pose, place};
};

/* ================================================================== the room shot (S3.1, S3.2) */

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const tilt = tiltOf(g);
  const s = viewAt(tilt);
  const toPx = roomToPx(s);
  const cam = camOf(g);

  /* ---- dots now */
  const dots: (DotState & {i: number})[] = [];
  for (let i = 0; i < NDOTS; i++) {
    const st = dotAt(i, g);
    if (st) dots.push({...st, i});
  }
  const flying = dots.filter((d) => !d.scattering);
  const clusterPx = flying.length ? (() => {
    const q = flying.map((d) => toPx(d.p));
    return {x: q.reduce((a, p) => a + p.x, 0) / q.length, y: q.reduce((a, p) => a + p.y, 0) / q.length};
  })() : null;

  const gu = guesserState(g, tilt, clusterPx);
  const ch = checkerState(g, tilt);
  const geo = standGeometry(tilt);

  /* ---- what the camera cannot see: the partition as drawn and the two people (kit tests), and the sensor's own box
     (the light leaves its far face, which faces the wall) */
  const figs = [
    {z: LAYOUT.operator.z, place: ch.place},
    {z: H.z, place: gu.place},
  ];
  const box = geo.box;
  const behindStand = (p: PlanPt, grow = 0) => {
    if (Math.hypot(p.x - S.x, p.z - S.z) >= 0.25) return false;
    const q = projectWith(s, {x: p.x, z: p.z, h: p.h ?? LIGHT_H});
    return q.x > box.x0 - 2 - grow && q.x < box.x1 + 2 + grow && q.y > box.y0 - 2 - grow && q.y < box.y1 + 2 + grow;
  };
  const byPartition = partitionHides(s, LIGHT_H);
  const byPeople = figuresHide(s, LIGHT_H, figs);
  const hidden: HiddenTest = (p) => byPartition(p) || byPeople(p) || behindStand(p);
  /** The stop rings are ripples at a stop, not light that travels: never drawn across a person, in front or behind
   *  (a ring round him read as a hoop across his shirt), only where the room around them shows. */
  const rigBoxes = [...rigRects(ch.place, RIG_BOX.checker), ...rigRects(gu.place, RIG_BOX.guesser)];
  const ringHidden: HiddenTest = (p) => {
    if (hidden(p)) return true;
    const q = projectWith(s, {x: p.x, z: p.z, h: p.h ?? LIGHT_H});
    return rigBoxes.some((r) => q.x > r.x0 && q.x < r.x1 && q.y > r.y0 && q.y < r.y1);
  };
  /**
   * The dots are discs (radius r world px), so they must slide behind an edge, not pop off before it: each is painted
   * in the layer whose depth order hides it exactly. 'back' = RoomSet's backdrop, under the partition, the people and
   * the stand: every dot on his side of the partition (the partition and he are in front of it wherever they overlap
   * it on screen, the kit's partitionHides / figuresHide geometry), and every dot on the sensor's side that neither
   * overlaps the partition's drawn silhouette nor passes in front of a person. 'front' = the overlay, over the set:
   * sensor-side dots in front of the partition's face or of a person. Dots fully hidden (kit tests) are not drawn.
   */
  const coversScreen = (P: PlanPt, padPx: number) => {
    // the partition covers this screen point: test a point on the same camera ray well behind the partition
    const k = (OCC.x + 1 - P.x) / -s.toCam[0];
    return hiddenByPartition({x: P.x - s.toCam[0] * k, z: P.z - s.toCam[1] * k, h: (P.h ?? LIGHT_H) - s.toCam[2] * k}, s, {padPx});
  };
  const dotLayer = (P: PlanPt, r: number): 'back' | 'front' | null => {
    if (P.x > OCC.x - OCC.thickness / 2) return hiddenByPartition(P, s, {padPx: 3 - r}) ? null : 'back';
    const q = projectWith(s, P);
    if (figs.some((f) => P.z < f.z + 0.05 && rigCovers(f.place, q, -r))) return null; // wholly behind a person
    if (coversScreen(P, 3 + r) || figs.some((f) => P.z >= f.z + 0.05 && rigCovers(f.place, q, r))) return 'front';
    return 'back';
  };

  /* ---- readout: bars; the late bump lights when the one dot comes home */
  const homeHl = sp(g, ARRIVE, SNAP) * (1 - tw(g, ARRIVE + 50, 20));
  const firing = pulseAt(g, LAUNCH - 3, 9);
  // the flash on "sensor": the far face's lens bursts on the launch frame (the sound's frame), until the dots are out
  const burst = burstAt(g);
  const burstRing = burstRingAt(g);

  const items: RoomItem[] = [
    {
      key: 'checker',
      x: LAYOUT.operator.x,
      z: LAYOUT.operator.z,
      w: 0.3,
      node: <Character2 look={CAST.checker} pose={ch.pose} frame={g} seed={CHECKER_SEED} x={ch.place.x} y={ch.place.y} scale={ch.place.scale} life={ch.place.life} style={rigStyle(tilt, ch.place.scale)} />,
    },
    {
      key: 'stand',
      x: S.x,
      z: LAYOUT.operator.z + 0.04,
      w: 0.17,
      height: LIGHT_H + 0.2,
      node: <SensorStand tilt={tilt} sensor={{reveal: 1, bumpHighlight: homeHl, led: 1, firing, burst, burstRing}} />,
    },
    {
      key: 'guesser',
      x: H.x,
      z: H.z,
      w: 0.3,
      node: (
        <Character2
          look={CAST.guesser}
          pose={gu.pose}
          frame={g}
          seed={GUESSER_SEED}
          x={gu.place.x}
          y={gu.place.y}
          scale={gu.place.scale}
          life={gu.place.life}
          style={{...rigStyle(tilt, gu.place.scale), filter: rimFlash(rimT(g), gu.place.scale)}}
        />
      ),
    },
  ];

  /* ---- overlay: route preview, recap fans, the dots */
  const route = tw(g, ROUTE0, ROUTE1 - ROUTE0, E.inOut);
  const routeOp = 0.9 * (1 - 0.5 * tw(g, LAUNCH, 10)) * (1 - tw(g, PAN0, 12));
  const fanT = tw(g, FANS0, 14);
  const fanOut = tw(g, FANS_OUT, 22, E.inOut);
  const fanTH = tw(g, FANS0 + 5, 14);
  const nrm = legNormals(s);
  const dotsDrawn = dots
    .map((d) => {
      const n = d.scattering ? {x: 0, y: 0} : nrm[d.leg];
      const off = d.scattering ? 0 : LANE_PX + d.across;
      const P = lift(d.p, n.x * off, n.y * off, s);
      return {d, P, q: projectWith(s, P), layer: dotLayer(P, d.r)};
    })
    .filter((x) => x.layer !== null);
  const dotSvg = (layer: 'back' | 'front') => (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {dotsDrawn
        .filter((x) => x.layer === layer)
        .map(({d, q}) => (
          <g key={d.i} opacity={f2(d.op)}>
            <circle cx={f2(q.x)} cy={f2(q.y)} r={f2(d.r)} fill={mixHex(C.saffron, C.paper, (1 - d.I) * 0.55)} stroke={C.ink} strokeWidth={2.5} />
            {!d.scattering && d.I > 0.5 && <circle cx={f2(q.x - d.r * 0.3)} cy={f2(q.y - d.r * 0.3)} r={f2(d.r * 0.3)} fill={C.cream} opacity={0.7} />}
          </g>
        ))}
    </svg>
  );
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {route > 0 && routeOp > 0 && <Route points={[S, WP, H]} head={route * pathLength([S, WP, H])} toPx={toPx} hidden={hidden} opacity={routeOp} />}
      {fanT > 0 && fanOut < 1 && (
        <g>
          <ScatterFan asGroup origin={FAN_W.origin} dirs={FAN_W.dirs} length={FAN_W.length} toPx={toPx} t={fanT} release={fanOut} layout={OLAYOUT} hidden={hidden} seed={FAN_W.seed} />
          <ScatterFan asGroup origin={FAN_H.origin} dirs={FAN_H.dirs} length={FAN_H.length} toPx={toPx} t={fanTH} release={fanOut} layout={OLAYOUT} hidden={hidden} seed={FAN_H.seed} width={3.5} color={C.saffron} />
        </g>
      )}
      {[1, 2, 3, 4].map((v) => (
        <StopRing key={v} center={PATH[v]} g={g} at={VF[v]} toPx={toPx} I={v === 4 ? 0.5 : LEG_I[v - 1]} hidden={ringHidden} />
      ))}
    </svg>
  );

  /* ---- the opening between the partition's far end and the wall, marked in ink on the floor (kit GapMarker, as in
     S1.4-S1.5 and S9.2) while the route is drawn and the light goes through it and back; it leaves once the last dot
     is home. Under the stand, the people and the partition (backdrop). */
  const gapIn = tw(g, ROUTE0 - 8, 12, E.out);
  const gapOut = 1 - tw(g, ARRIVE + 4, 14);
  const gapMark = gapIn > 0 && gapOut > 0 && (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: gapOut}}>
      <GapMarker tilt={tilt} t={gapIn} />
    </div>
  );

  /* ---- screen-space: stop tags, tally, chip, the plan card */
  const tagOut = 1 - tw(g, TAGS_OUT, 10);
  const chipT = tw(g, LAUNCH - 8, 10) * (1 - tw(g, PAN0 + 4, 10));
  const tallyT = tw(g, LAUNCH - 4, 10) * (1 - tw(g, PAN0, 10));
  // linear in: PlanCard applies the one ease (E.out) to its slide and opacity (review r1 D16: E.out here as well made
  // the entry a near-pop, the slide spent in one frame)
  const cardT = tw(g, CARD_IN, CARD_IN_DUR, E.linear) * (1 - tw(g, CARD_OUT, CARD_OUT_DUR, E.inOut));
  // S2's timing card, carried across the cut, leaves to the left as the push starts
  const tcardDx = -TCARD_TRAVEL * tw(g, TCARD_OUT, TCARD_OUT_DUR, accel);

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet
            tilt={tilt}
            items={items}
            extendLeft={g >= EXT_ON ? EXT_M : 0}
            backdrop={
              <>
                {gapMark}
                {dotSvg('back')}
              </>
            }
          >
            {overlay}
            {dotSvg('front')}
          </RoomSet>
        </Layer>
      </Camera>
      {g < TCARD_OUT + TCARD_OUT_DUR && <TimingCard dx={tcardDx} />}
      {tagOut > 0 &&
        TAGS.map((tg) => {
          const k = sp(g, tg.at - 2, SNAP);
          if (k <= 0) return null;
          const again = tg.again ? pulseAt(g, tg.again - 2, 12) : 0;
          const a = tg.anchor(tilt);
          const q = worldToScreen(cam, a.x, a.y);
          return (
            <div
              key={tg.text}
              style={{
                position: 'absolute',
                left: f2(q.x + tg.dx),
                top: f2(q.y + tg.dy),
                transform: `translate(-50%, -50%) scale(${f2(Math.min(1.08, k) * (1 + 0.12 * again))})`,
                opacity: clamp01(k * 2) * tagOut,
                padding: '6px 18px 8px',
                borderRadius: 999,
                background: again > 0.05 ? mixHex(C.cream, C.saffronLight, again) : C.cream,
                border: `3px solid ${C.ink}`,
                fontFamily: F.body,
                fontWeight: 800,
                fontSize: 36,
                color: C.ink,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {tg.text}
            </div>
          );
        })}
      {tallyT > 0 && <Tally g={g} t={tallyT} />}
      {chipT > 0 && (
        <div style={{position: 'absolute', right: 1920 - CHIP_BOX.x1, top: CHIP_BOX.y0, opacity: chipT, transform: `translateY(${f2((1 - E.out(chipT)) * -10)}px)`}}>
          <div style={{padding: '9px 24px 11px', borderRadius: 999, background: C.saffron, border: `3px solid ${C.saffronDeep}`, fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink, lineHeight: 1, whiteSpace: 'nowrap'}}>
            slowed down · illustrative
          </div>
        </div>
      )}
      {/* seen from above: the same route preview, dots (dotAt), stop rings and recap fans, on the same frames, in plan */}
      {cardT > 0 && (
        <PlanCard
          x={CARD_POS.x}
          y={CARD_POS.y}
          t={cardT}
          area={PLAN_CARD_AREA}
          view={CARD_VIEW}
          gap={1}
          checker={{x: LAYOUT.operator.x, z: LAYOUT.operator.z}}
          guesser={{x: H.x, z: H.z}}
          sensor={{firing, burst, burstRing}}
          light={(tp) => {
            const cn = PATH.slice(0, -1).map((a, k) => {
              const pa = tp(a);
              const pb = tp(PATH[k + 1]);
              const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
              return {x: -(pb.y - pa.y) / L, y: (pb.x - pa.x) / L};
            });
            return (
              <>
                {route > 0 && routeOp > 0 && <PlanRoute points={[S, WP, H]} head={route * pathLength([S, WP, H])} toPx={tp} opacity={routeOp} dash="4 11" width={5} />}
                {fanT > 0 && fanOut < 1 && (
                  <>
                    <ScatterFan asGroup origin={FAN_W.origin} dirs={FAN_W.dirs} length={FAN_W.length} toPx={tp} t={fanT} release={fanOut} layout={OLAYOUT} seed={FAN_W.seed} width={3.5} />
                    <ScatterFan asGroup origin={FAN_H.origin} dirs={FAN_H.dirs} length={FAN_H.length} toPx={tp} t={fanTH} release={fanOut} layout={OLAYOUT} seed={FAN_H.seed} width={3} color={C.saffron} />
                  </>
                )}
                {[1, 2, 3, 4].map((v) => (
                  <StopRing key={v} center={PATH[v]} g={g} at={VF[v]} toPx={tp} I={v === 4 ? 0.5 : LEG_I[v - 1]} />
                ))}
                {dots.map((d) => {
                  const q = tp(d.p);
                  const n = d.scattering ? {x: 0, y: 0} : cn[d.leg];
                  const off = d.scattering ? 0 : (LANE_PX + d.across) * 0.5;
                  return <circle key={d.i} cx={f2(q.x + n.x * off)} cy={f2(q.y + n.y * off)} r={f2(d.r * 0.8)} fill={mixHex(C.saffron, C.paper, (1 - d.I) * 0.55)} stroke={C.ink} strokeWidth={2} opacity={f2(d.op)} />;
                })}
              </>
            );
          }}
        />
      )}
      <BlockCard g={g} drops={DROPS} t={{enter: tw(g, CARD0, CARD_DUR, E.linear), wallLabel: tw(g, WALL_LABEL, 10), himLabel: tw(g, HIM_LABEL, 10), tiny: tw(g, TINY, 10)}} />
    </AbsoluteFill>
  );
};


/**
 * A ring that spreads on the floor plane (at the path's height) where the light touches a stop: a circle in plan,
 * projected, kept to the room side of the wall (z >= 0), so a ring at a wall spot never runs into the wall.
 */
const StopRing: React.FC<{center: P2; g: number; at: number; toPx: ToPx; I: number; hidden?: (p: P2) => boolean}> = ({center, g, at: t0, toPx, I, hidden}) => {
  const dur = 18;
  if (g < t0 || g > t0 + dur) return null;
  const u = (g - t0) / dur;
  const r = 0.06 + 0.3 * E.out(u);
  const runs: string[] = [];
  let cur: string[] = [];
  for (let k = 0; k <= 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const p = {x: center.x + Math.cos(a) * r, z: center.z + Math.sin(a) * r};
    const ok = p.z >= 0 && !(hidden && hidden(p));
    if (ok) {
      const q = toPx(p);
      cur.push(`${f2(q.x)} ${f2(q.y)}`);
    } else if (cur.length) {
      if (cur.length > 1) runs.push('M ' + cur.join(' L '));
      cur = [];
    }
  }
  if (cur.length > 1) runs.push('M ' + cur.join(' L '));
  return (
    <g opacity={f2((1 - u) * 0.9)}>
      {runs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={mixHex(C.saffronDeep, C.paper, (1 - I) * 0.5)} strokeWidth={f2(5 * (1 - 0.5 * u))} strokeLinecap="round" />
      ))}
    </g>
  );
};

/**
 * The 24 dots of one flash: each greys out when its dot leaves the path. No count (review r1 D19: a bare "24 -> 1"
 * numeral read as "1 in 24 comes back", while the real echo is hundreds to thousands of times weaker); a guard-rail line
 * says the tally is not to scale. Same 456 x 133 box as before (TALLY_BOX: a taller tally would push CAM_TRIP out), so
 * the dots run in one row.
 */
const TALLY_DOT = {pitch: 17, r: 6.5};
const Tally: React.FC<{g: number; t: number}> = ({g, t}) => {
  const order = Array.from({length: NDOTS}, (_, i) => i).sort((a, b) => RANK[a] - RANK[b]); // survivors first
  const P = TALLY_DOT.pitch;
  return (
    <div style={{position: 'absolute', left: TALLY_POS.x, top: TALLY_POS.y, opacity: t, transform: `translateY(${f2((1 - E.out(t)) * -10)}px)`}}>
      <div style={{boxSizing: 'border-box', width: TALLY_BOX.x1 - TALLY_BOX.x0, height: TALLY_BOX.y1 - TALLY_BOX.y0, padding: '12px 20px 12px', borderRadius: 20, background: C.cream, border: `3px solid ${C.ink}`, boxShadow: `6px 7px 0 ${C.shadow}`}}>
        <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.inkSoft, lineHeight: 1, whiteSpace: 'nowrap'}}>light still on the path</div>
        <svg width={NDOTS * P} height={P + 4} style={{display: 'block', marginTop: 8}}>
          {order.map((dot, k) => {
            const lf = lostFrame(dot);
            const gone = clamp01((g - lf) / 8);
            const cx = P / 2 + k * P;
            const r = TALLY_DOT.r * (1 - 0.25 * gone);
            return <circle key={dot} cx={cx} cy={P / 2 + 3 * E.out(gone)} r={f2(r)} fill={mixHex(C.saffron, C.paperLine, gone)} stroke={gone > 0.5 ? C.inkMuted : C.ink} strokeWidth={2} />;
          })}
        </svg>
        <div style={{marginTop: 7, fontFamily: F.body, fontWeight: 700, fontSize: 30, color: C.inkSoft, lineHeight: 1, whiteSpace: 'nowrap'}}>not to scale · far more is lost</div>
      </div>
    </div>
  );
};

/**
 * A dashed route along a plan polyline, drawn on up to `head` metres; stretches the camera cannot see are skipped.
 * Where a drawn run reaches the edge of something that hides it (the partition's far end, his outline), it ends on a
 * dot, so the route visibly goes in behind that edge instead of stopping up to a dash gap short of it.
 */
const Route: React.FC<{points: P2[]; head: number; toPx: ToPx; hidden: (p: P2) => boolean; opacity: number}> = ({points, head, toPx, hidden, opacity}) => {
  assertPath(points, OLAYOUT);
  const runs: string[] = [];
  const ends: {x: number; y: number}[] = [];
  let s0 = 0;
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k];
    const b = points[k + 1];
    const L = pathLength([a, b]);
    const uMax = clamp01((head - s0) / L);
    s0 += L;
    if (uMax <= 0) break;
    for (const [u0, u1] of visibleIntervals(a, b, hidden, 48)) {
      const e = Math.min(u1, uMax);
      if (e <= u0) continue;
      const p = toPx(lerpP(a, b, u0));
      const q = toPx(lerpP(a, b, e));
      runs.push(`M ${f2(p.x)} ${f2(p.y)} L ${f2(q.x)} ${f2(q.y)}`);
      if (u1 < 1 && uMax >= u1) ends.push(q);
    }
  }
  return (
    <g opacity={opacity}>
      {runs.map((d, i) => (
        <path key={i} d={d} stroke={C.saffronDeep} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" fill="none" />
      ))}
      {ends.map((q, i) => (
        <circle key={`e${i}`} cx={f2(q.x)} cy={f2(q.y)} r={3.5} fill={C.saffronDeep} />
      ))}
    </g>
  );
};

/* ================================================================== the evidence board (S3.3) */

const BoardShot: React.FC<{g: number}> = ({g}) => {
  const off = boardOffset(g);
  const drawNs = g < DRAW_A0 ? -99 : kf(g, [
    [DRAW_A0, -2.7],
    [DRAW_A1, 0.35, E.inOut],
    [DRAW_B0, 0.35],
    [DRAW_B1, 8.6, E.inOut],
  ]);
  return (
    <AbsoluteFill style={{transform: `translateX(${f2(-off)}px)`}}>
      <EchoCard>
        <EchoBoard
          t={{
            content: 1,
            axes: tw(g, LAND + 2, 14),
            chip: tw(g, K.same - 2, 10),
            source: tw(g, K.same + 8, 10),
            box: tw(g, K.sensor15 - 4, 14),
            boxCentre: tw(g, Math.max(K.object, K.sensor15 + 10), 12),
            drawNs,
            pen: Math.max(1 - tw(g, PEN_OUT, PEN_OUT_DUR), tw(g, DRAW_B0 - 4, 4)),
            spikeLabel: tw(g, SPIKE_LABEL, 10),
            spikePulse: tw(g, SPIKE_PULSE, SPIKE_PULSE_DUR, E.inOut),
            lens: tw(g, LENS0, 10),
            lensSlide: tw(g, SLIDE0, SLIDE1 - SLIDE0, E.linear),
            zoom: tw(g, ZOOM0, ZOOM1 - ZOOM0, E.inOut),
            ratio: tw(g, RATIO0, 14),
            ring: tw(g, RING0, 16, E.inOut),
            dim: tw(g, DIM0, 18),
            extra: tw(g, EXTRA0, 14),
          }}
        />
      </EchoCard>
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const S3Echo: React.FC = () => {
  const g = useG();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {g < LAND + 1 && <RoomShot g={g} />}
      {g >= BOARD0 && <BoardShot g={g} />}
    </AbsoluteFill>
  );
};

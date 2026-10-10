import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import layoutJson from '../data/layout.json';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, SNAP, SOFT, camPath, hop, kf, sp, tw} from '../lib/motion';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {depthSort, figureMix, projectWith, rigAt, rigStyle, tiltAt, tokenAt, viewAt} from '../lib/room';
import {LAYOUT, assertPath, dist, pathSchedule, possibleCloud, sampleArc, type P2, type ScalarField} from '../lib/optics';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {Character2, EXPR, HANDS_ON_HIPS, IDLE2, handWorld2, reach2, settlePose, withPose, type Pose2} from '../components/v02/Cast2';
import {CheckerToken, GuesserToken} from '../components/v02/Tokens';
import {Band, LightPath, PossibleCloud, polyD} from '../components/v02/Optics';
import {facingOf} from '../components/v02/HandheldSensor';
import {CAST} from '../components/cast';
import {rand} from '../lib/anim';
import {SensorStand, s4ColumnAt} from '../components/v02/S4_Stand';
import {FaceInset, INSET_RIG} from '../components/v02/S4_Inset';
import {CrossMark, LIKELY_DIM, LIKELY_RING, LikelyRing, Ruler} from '../components/v02/S4_Parts';
import {QuestionTitle} from '../components/v2k/QuestionTitle';
import {Chip, Label, SubLabel, TeachLabel, labelBox, leaderEnds} from '../components/v2k/Labels';
import {Chip40, EchoStrip, Pointer, TapRing, pointerAt} from '../components/v2s/V5_Parts';
import {Tape, tapeEdges, tapeLanePoint} from '../components/v2s/V5_Tape';

/**
 * V5 · Delay to distance to place (n10, n11, s18–s23, n12). The film's central explanation, on the plan of our room
 * (illustrative record I1, layout.json frame A, confocal simplification). Adapted from v1 S4 (S4_Geometry).
 *
 *  V5.1 n10   Graphic match from V4.3: the first frame is the room view (tilt 0) with a 90 px ink ring centred on
 *             screen (960, 520) round wall spot W1, marked on bare wall above the people's heads (SPOT_H; its projection
 *             lands there under CAM_OPEN). The room folds at once into the full-frame plan; the people become tokens;
 *             the ring rides W1 down onto the wall line and settles into W1's glow. The fold
 *             lands on CAM_LEG (W1, the sensor and the W1 → him leg, close enough for the V5.2 tape). Question title
 *             "How does a delay become a location?" for "Farther from where?" only; chip "simplified picture · sends
 *             and listens at one spot" (40) from "Simplify" through V5.7. On "flashes" the sensor's field-of-view wedge
 *             lights the wall; on "one spot" it narrows to one beam on W1; then the confocal route draws once, out and
 *             back on the same lines: S → W1 → him → W1 → S.
 *  V5.2 n11   One ruler on the W1 → him leg: a measuring tape graduated in nanoseconds of light travel (one 30 cm
 *             stroke per ns). A pulse runs out along it to him and back along the same line; the tape pays out with
 *             the pulse's travel, so on the way back it keeps going past his token: two strokes of travel per stroke
 *             of distance. Then it folds in half at his token. "1 ns ≈ 30 cm of travel" (64), then
 *             "there and back → ≈ 15 cm farther" (64); the stroke that straddles his token (15 cm out, 15 cm back:
 *             one extra nanosecond) turns coral. His token is half-dimmed while the tape lies over it.
 *  V5.3 s18   The worked example, one step replacing the last, each held at least 2 s (the first from the end of n11):
 *             "≈ 8.9 ns later" (the whole tape flashes) →
 *             "≈ 2.65 m there and back" → "≈ 1.33 m each way" (the folded tape becomes one ruler, W1 → him) +
 *             "illustrative · our room" (30). On "Not which direction" the ruler wavers; "distance known · direction
 *             unknown" (48) comes with the arc (V5.4). J3a opens in the face inset (lower right): nervous, relieved, he
 *             leans on the partition.
 *  V5.4 s19   The camera pulls back once to CAM_WIDE (the whole arc, and the paper behind the wall for V5.5, so no rise
 *             later). The ruler swings down to the wall and sweeps the dashed arc round W1 (a constraint, not light; it may
 *             cross the partition), faint copies of him appear along it; the ruler taps three of them, retracts.
 *  V5.5 s20   W4 lights (one flash); a second ruler from W4 sweeps a second dashed arc; "second spot" (48). The two
 *             circles continue behind the wall and cross again there: that crossing greys out, "behind the wall:
 *             impossible" (40). The checker's pointer (her sleeve and mitt from the frame edge) taps the crossing at his
 *             token in the pause before "one place", on the music's full stop; J3b on "one": his smile drops and his
 *             mitt comes off the partition, then his arm drops.
 *  V5.6 s21   The camera pushes in once to CAM_NEAR (the spots, the crossing and the hidden side) and holds to the cut.
 *             Each arc thickens into a band (one 250 ps bin, ±3.75 cm); their overlap fills as a small patch.
 *             "fuzzy timing → band" (48) + "illustrative" (30).
 *  V5.7 s22   The two spots slide together (W2, W3): long, blurry patch; apart (W1, W4): small. Bands and patch are
 *             recomputed every frame. "close → long, blurry", then "spread out → smaller" (48).
 *  V5.8 s23   Four spots flash; candidate dots scatter over the hidden side; one candidate's predicted echo ticks are
 *             laid against the measured ticks on a large strip across the lower third (48 px row labels; a miss: ✗, it
 *             fades; a match: ✓, it stays); poor matches fade, the rest cluster on him. "candidate positions" (48);
 *             card "assumption: one small object" (40).
 *  V5.9 n12   The cluster settles into the soft (feathered) likely-location blob inside a teal ring (never a dot); "likely
 *             location" (48). No photo frame. Hard cut to V6 (the real U board) at the scene end.
 *
 * Light is drawn only in the flat plan (tilt 1): every pulse starts after the fold lands (asserted), so no room-view
 * light path exists here and assertAroundTheEnd has no tilt to check. Every path passes assertPath (layout.json), and
 * LightPath re-checks it on every render.
 */

/* ------------------------------------------------------------------ geometry (layout.json, frame A) */

const L = layoutJson;
const ROOM = {x0: L.room.x0, x1: L.room.x1, z0: L.room.z0, z1: L.room.z1};
const Hp: P2 = {x: L.hidden.x, z: L.hidden.z};
const Sp: P2 = {x: L.sensor.x, z: L.sensor.z};
const OPp: P2 = {x: L.operator.x, z: L.operator.z};
const WX: Record<string, number> = Object.fromEntries(L.wallSamples.map((w) => [w.id, w.x]));
const Wat = (x: number): P2 => ({x, z: L.relayWall.z});
const W1 = Wat(WX.W1);
const W2 = Wat(WX.W2);
const W3 = Wat(WX.W3);
const W4 = Wat(WX.W4);
const WALL = [W1, W2, W3, W4];
const RADII = L.confocalA.map((c) => c.circle_radius_m);
WALL.forEach((w, i) => {
  if (Math.abs(dist(w, Hp) - RADII[i]) > 2e-3) throw new Error(`V5: confocalA[${i}] radius ${RADII[i]} != |W${i + 1}H| ${dist(w, Hp)}`);
});
const R1 = RADII[0];
const R4 = RADII[3];
const HW = L.bandHalfWidth.oneBin; // ±3.75 cm: one 250 ps bin (illustrative)
const C_NS = L.c_m_per_ns;
const arrivalNs = (w: P2, p: P2) => (2 * dist(Sp, w) + 2 * dist(w, p)) / C_NS;
/** where the two full circles cross again, behind the wall (the mirror image of H) */
const Hm: P2 = {x: Hp.x, z: 2 * L.relayWall.z - Hp.z};
const AIM: P2 = {x: L.sensor.aimX, z: L.relayWall.z};
/** unit vector W1 → him, and his bearing from W1 */
const U1: P2 = {x: (Hp.x - W1.x) / R1, z: (Hp.z - W1.z) / R1};
const H_BEARING = Math.atan2(Hp.z - W1.z, Hp.x - W1.x);
const H4_BEARING = Math.atan2(Hp.z - W4.z, Hp.x - W4.x);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
const polar = (c: P2, r: number, a: number): P2 => ({x: c.x + r * Math.cos(a), z: c.z + r * Math.sin(a)});

/**
 * The worked example (evidence brief §3.3, record I1, frame A, hider at H_A): |W1 H_A| = 1.3265 m, so the detour
 * W1 → him → W1 is 2.6530 m of path, 2.6530 / 0.29979 = 8.8496 ns (layout: 8.85 ns). On screen, the brief's internally
 * consistent chain: "≈ 8.9 ns later" (8.85 rounded half-up, as S4 printed it) → "≈ 2.65 m there and back" →
 * "≈ 1.33 m each way". Checked here: c × delay = the round trip = 2|W1 H|; the three rounded numbers agree.
 */
const DELAY1_NS = L.confocalA[0].delay_after_first_bounce_ns;
if (Math.abs(C_NS * DELAY1_NS - 2 * R1) > 0.005) throw new Error(`V5: c × ${DELAY1_NS} ns != 2 × ${R1} m`);
if (Math.abs((2 * dist(W1, Hp)) / C_NS - DELAY1_NS) > 0.01) throw new Error('V5: layout delay disagrees with |W1 H| / c');
const DELAY1_TXT = (Math.round(DELAY1_NS * 10 + 1e-6) / 10).toFixed(1); // 8.85 -> "8.9"
const TRIP1_TXT = (2 * R1).toFixed(2); // "2.65"
const EACH1_TXT = R1.toFixed(2); // "1.33"
if (DELAY1_TXT !== '8.9' || TRIP1_TXT !== '2.65' || EACH1_TXT !== '1.33') throw new Error(`V5: worked example now reads ${DELAY1_TXT} ns / ${TRIP1_TXT} m / ${EACH1_TXT} m: update the shot plan wording`);
if (Math.abs(parseFloat(TRIP1_TXT) / 2 - parseFloat(EACH1_TXT)) > 0.006) throw new Error('V5: "there and back" is not twice "each way" on screen');

// every light path drawn in V5 (plan view) is legal: straight legs, none through the partition
const ROUTE: P2[] = [Sp, W1, Hp, W1, Sp];
assertPath(ROUTE, LAYOUT);
WALL.forEach((w) => assertPath([Sp, w, Sp], LAYOUT));
assertPath([W1, Hp, W1], LAYOUT);

/* ------------------------------------------------------------------ cues (narration words; nothing absolute) */

const K = {
  start: scene('V5').from,
  end: scene('V5').to,
  // n10
  farther: at('n10', 'farther'),
  whereEnd: at('n10', 'where', 1, 'end'),
  simplify: at('n10', 'simplify'),
  sensor: at('n10', 'sensor'),
  flashes: at('n10', 'flashes'),
  listens: at('n10', 'listens'),
  one10: at('n10', 'one'),
  spot10: at('n10', 'spot'),
  on10: at('n10', 'on'),
  wallEnd10: at('n10', 'wall', 1, 'end'),
  // n11
  n11: seg('n11').from,
  covers: at('n11', 'covers'),
  thirty: at('n11', 'thirty'),
  nanosecondEnd: at('n11', 'nanosecond', 1, 'end'),
  but: at('n11', 'but'),
  there: at('n11', 'there'),
  backEnd: at('n11', 'back', 1, 'end'),
  so11: at('n11', 'so'),
  extra11: at('n11', 'extra'),
  nanosecond2: at('n11', 'nanosecond', 2),
  puts: at('n11', 'puts'),
  fifteen: at('n11', 'fifteen'),
  wall11: at('n11', 'wall'),
  spotEnd11: at('n11', 'spot', 1, 'end'),
  n11End: segEnd('n11'),
  // s18
  s18: seg('s18').from,
  extra18: at('s18', 'extra'),
  delay18: at('s18', 'delay'),
  know: at('s18', 'know'),
  how18: at('s18', 'how'),
  that18: at('s18', 'that'),
  not18: at('s18', 'not'),
  direction: at('s18', 'direction'),
  directionEnd: at('s18', 'direction', 1, 'end'),
  just18: at('s18', 'just'),
  far18b: at('s18', 'far', 2),
  // s19
  he19: at('s19', 'he'),
  anywhere: at('s19', 'anywhere'),
  arc19: at('s19', 'arc'),
  all19: at('s19', 'all'),
  dist19: at('s19', 'distance'),
  from19: at('s19', 'from'),
  spot19: at('s19', 'spot'),
  // s20
  s20: seg('s20').from,
  listen20: at('s20', 'listen'),
  second: at('s20', 'second'),
  another1: at('s20', 'another'),
  another2: at('s20', 'another', 2),
  arcEnd20: at('s20', 'arc', 1, 'end'),
  on20: at('s20', 'on'),
  cross20: at('s20', 'cross'),
  one20: at('s20', 'one'),
  place20: at('s20', 'place'),
  // s21
  s21: seg('s21').from,
  fuzzy: at('s21', 'fuzzy'),
  band21: at('s21', 'band'),
  overlap: at('s21', 'overlap'),
  small: at('s21', 'small'),
  // s22
  s22: seg('s22').from,
  close: at('s22', 'close'),
  long_: at('s22', 'long'),
  spread: at('s22', 'spread'),
  shrinks: at('s22', 'shrinks'),
  s22end: segEnd('s22'),
  // s23
  s23: seg('s23').from,
  computer: at('s23', 'computer'),
  weighs: at('s23', 'weighs'),
  trying: at('s23', 'trying'),
  positions: at('s23', 'positions'),
  keeping: at('s23', 'keeping'),
  predicted: at('s23', 'predicted'),
  match: at('s23', 'match'),
  assumptions: at('s23', 'assumptions'),
  kind: at('s23', 'kind'),
  // n12
  n12: seg('n12').from,
  answer: at('n12', 'answer'),
  likely: at('n12', 'likely'),
};

/* ------------------------------------------------------------------ cameras and the fold */

/** the V4.3 → V5.1 graphic match: the ring (ink, 6 px, no fill, r 90) centred on screen (960, 520) */
export const V5_MATCH = {x: 960, y: 520, r: 90, stroke: 6};
/**
 * The matched wall spot: W1 (x, z from layout.json) marked on the wall at SPOT_H, above the people's heads. At tilt 0
 * the light-plane point (h 0.95 m) sits exactly behind the checker's head (she stands in front of the wall, and the
 * room view's oblique puts her face over it), so a ring there would circle her face. Higher up the wall the spot is
 * bare paint in the first frame. The plan point is the same: as the room folds, the height scale goes to 0 and the
 * spot slides down onto W1 on the wall line (no light is drawn in the room view, so the height is only where the mark
 * sits on the wall).
 */
const SPOT_H = 1.9;
/** W1's wall spot in the room view (tilt 0), world px */
const W1_ROOM = projectWith(viewAt(0), {x: W1.x, z: W1.z, h: SPOT_H});
const Z_OPEN = 1.0;
/** the opening room view: chosen so that W1's wall spot lands exactly on the match point */
const CAM_OPEN: Cam = {cx: W1_ROOM.x, cy: W1_ROOM.y - (V5_MATCH.y - 540) / Z_OPEN, zoom: Z_OPEN};
{
  const s = worldToScreen(CAM_OPEN, W1_ROOM.x, W1_ROOM.y);
  if (Math.abs(s.x - V5_MATCH.x) > 0.01 || Math.abs(s.y - V5_MATCH.y) > 0.01) throw new Error(`V5: W1 lands at (${s.x}, ${s.y}), not the match point`);
  // the ring is on bare wall: clear of the checker's head (hair top = feet - 1.7 m) and below the wall's top edge
  const feet = rigAt(OPp.x, OPp.z, 0);
  const head = worldToScreen(CAM_OPEN, feet.x, feet.y - 1.7 * viewAt(0).ppm);
  const top = projectWith(viewAt(0), {x: W1.x, z: W1.z, h: L.room.wallHeight});
  const wallTop = worldToScreen(CAM_OPEN, top.x, top.y);
  if (head.y < V5_MATCH.y + V5_MATCH.r + 30) throw new Error(`V5: the match ring (bottom y ${V5_MATCH.y + V5_MATCH.r}) is within 30 px of the checker's head (y ${head.y.toFixed(0)})`);
  if (wallTop.y > V5_MATCH.y - V5_MATCH.r - 30) throw new Error(`V5: the match ring is within 30 px of the wall's top edge (y ${wallTop.y.toFixed(0)})`);
}
/** W1's wall spot at a tilt (world px): the match ring, the room-view mark and W1's glow all ride this point */
const w1Spot = (st: ReturnType<typeof viewAt>) => {
  const q = projectWith(st, {x: W1.x, z: W1.z, h: SPOT_H});
  return {x: q.x, y: q.y};
};
const VP = viewAt(1);
const W1_PLAN = projectWith(VP, {x: W1.x, z: W1.z, h: 0});
/**
 * The fold lands on CAM_LEG: the plan framed on W1, the sensor and the W1 → him leg, close enough that the V5.2 tape
 * (the path meter, unrolled to 2|W1 H| past his token, z ≈ 1.70 m) reads at phone size: W1 on screen (640, 330), the
 * tape's unrolled end above y 950, the paper behind the wall free for the one 64 px label of each beat.
 */
const Z_LEG = 1.45;
const CAM_LEG: Cam = {cx: W1_PLAN.x - (640 - 960) / Z_LEG, cy: W1_PLAN.y - (330 - 540) / Z_LEG, zoom: Z_LEG};
/**
 * On the ruler's swing (V5.4) the camera pulls back once to CAM_WIDE and holds it to the end: the whole first arc, the
 * hidden side and the paper behind the wall where the two circles cross again (V5.5 needs no rise).
 */
const CAM_WIDE: Cam = {cx: 960, cy: 268, zoom: 1.15};
/**
 * On "Measured timings are a bit fuzzy" the camera pushes in once to CAM_NEAR and holds it to the cut: the four wall
 * spots, the crossing and the whole hidden side (x 1.5–3.95 m, z 0–1.65 m), big enough that the ±3.75 cm bands, the
 * patch and the candidate dots read at phone size. Plan x 1.5 m lands at screen x 480, the wall at y 340.
 */
const Z_NEAR = 1.5;
const CAM_NEAR: Cam = (() => {
  const a = projectWith(VP, {x: 1.5, z: 0, h: 0});
  return {cx: a.x - (480 - 960) / Z_NEAR, cy: a.y - (340 - 540) / Z_NEAR, zoom: Z_NEAR};
})();

// the fold starts at once (2 frames on the match) and lands before "Simplify"
const FOLD0 = K.start + 2;
const FOLD_DUR = Math.max(36, Math.min(50, K.simplify - FOLD0 - 4));
const FOLD_END = FOLD0 + FOLD_DUR;
/** The fold: a short ease-in from the matched frame (the ring reads in place first), then a long, slow landing. */
const FOLD_EASE = Easing.bezier(0.45, 0, 0.3, 1);
const foldCam = (g: number): Cam => {
  const pp = FOLD_EASE(tw(g, FOLD0, FOLD_DUR * 0.85, E.linear));
  const pz = E.inOut(tw(g, FOLD0 + FOLD_DUR * 0.2, FOLD_DUR * 0.8, E.linear));
  return {cx: lerp(CAM_OPEN.cx, CAM_LEG.cx, pp), cy: lerp(CAM_OPEN.cy, CAM_LEG.cy, pp), zoom: lerp(CAM_OPEN.zoom, CAM_LEG.zoom, pz)};
};
/** plan point -> screen px under a camera (tilt 1) */
const planScreen = (cam: Cam, p: P2) => {
  const q = projectWith(VP, {x: p.x, z: p.z, h: 0});
  const s = worldToScreen(cam, q.x, q.y);
  return {x: s.x, y: s.y};
};


/* ------------------------------------------------------------------ beats (derived from the cues) */

// V5.1
const TITLE_TO = K.whereEnd + 8;
const CHIP_IN = Math.max(FOLD_END + 2, K.simplify);
// held through V5.7: until the s22 bands and patch clear for the four flashes (no empty plan before "weighs")
const CHIP_OUT = Math.max(K.s23 - 4, K.weighs - 16);
const RING_SETTLE = FOLD_END; // the match ring has shrunk into W1's glow
const W1_POP = FOLD_END - 6;
const WEDGE_IN = Math.max(FOLD_END + 4, K.flashes - 2);
const NARROW0 = K.one10 - 4;
const NARROW_DUR = Math.max(10, Math.min(16, K.spot10 + 6 - NARROW0));
const ROUTE_SCH = pathSchedule(ROUTE, {start: Math.max(NARROW0 + NARROW_DUR + 2, K.on10 - 6)});
const BEAM_OUT = ROUTE_SCH.start + 10;
const FLASH_FIRE = K.flashes;
// the route stays as a faint reminder through V5.3, then clears
const ROUTE_DIM = K.n11;
const ROUTE_OUT = K.s20 - 10;

// V5.2: the tape (path meter). Light keeps one speed for the whole round trip: out from "covers", home on "back,".
const TAPE0 = K.covers;
const TAPE_SPEED = (2 * R1) / Math.max(120, K.backEnd - TAPE0);
const TAPE_HOME = TAPE0 + (2 * R1) / TAPE_SPEED; // the pulse is back at W1 (the tape is fully paid out)
const TAPE_TURN = TAPE0 + R1 / TAPE_SPEED; // the pulse turns at his token
const LBL_30 = Math.max(TAPE0 + 6, K.thirty - 2);
const FOLD_T0 = Math.max(TAPE_HOME + 3, K.so11);
const FOLD_T_DUR = Math.max(14, Math.min(22, K.nanosecond2 - FOLD_T0));
const LBL_15 = Math.min(FOLD_T0 + FOLD_T_DUR + 2, K.nanosecond2 + 2);
const STRADDLE = Math.max(LBL_15 + 4, K.nanosecond2);
/**
 * "puts him only about fifteen centimetres": a light runs down the folded tape from W1, stroke pair by stroke pair (each
 * pair = one nanosecond = 15 cm), and reaches the coral pair at his token on "fifteen" (where that pair flashes);
 * "farther from the wall spot": one ring from W1.
 */
const RUN0 = Math.max(STRADDLE + 8, K.puts);
const RUN1 = Math.max(RUN0 + 18, K.fifteen);
const SPOT_PING = K.wall11;
// V5.3: the chain, one step replacing the last. None of the numbers is spoken (s18 talks over them), so each step
// holds at least 2 s (review V2-R1-05): the first one cuts in as n11 ends, the last holds to the end of V5.4.
const STEP_MIN = 60;
const STEP1 = K.n11End;
const STEP2 = STEP1 + STEP_MIN;
const STEP3 = STEP2 + STEP_MIN;
const TAPE_TO_RULER = STEP3; // the folded tape becomes one ruler W1 → him (1.33 m each way)
const RULER_IN_DUR = 12;
// the ruler wavers on "Not which direction", once it has fully taken over from the tape
const WAG0 = Math.max(K.not18, TAPE_TO_RULER + RULER_IN_DUR + 2);
const WAG1 = Math.max(WAG0 + 30, K.just18 - 2);
const ILLUS_CHIP = STEP1; // the first I1 number and its "illustrative" chip arrive together
const CHAIN_OUT = K.s20 - 8;
{
  // every 64 px label of V5.2–V5.3 stays up at least 2 s; the tape's last action ends before the chain starts
  const holds = [STEP1 - LBL_15, STEP2 - STEP1, STEP3 - STEP2, CHAIN_OUT - STEP3];
  if (Math.min(...holds) < STEP_MIN) throw new Error(`V5: a slot-A label holds only ${Math.min(...holds)} frames (needs ${STEP_MIN})`);
  if (RUN1 + 10 > STEP1) throw new Error('V5: the light on the folded tape is still running when "8.9 ns later" cuts in');
  if (WAG1 + 2 > K.he19) throw new Error('V5: the ruler is still wavering when s19 starts');
}
// the face inset (J3a, J3b)
const INSET_OPEN = K.how18 - 12;
const INSET_CLOSE = K.s21;
const LEAN0 = K.just18 - 4;
const RELAX = Math.max(K.directionEnd - 2, Math.min(K.direction + 14, LEAN0 - 11));

// V5.4: the ruler swings down to the wall's right end, sweeps the arc 0 → 180°, taps three ghosts, retracts
const SWING0 = Math.max(WAG1 + 2, K.he19 - 4);
const SWING_DUR = 12;
const SWEEP0 = SWING0 + SWING_DUR;
const PASS_H = SWEEP0 + Math.round(((K.arc19 + 6 - SWEEP0) * H_BEARING) / Math.PI);
const SWEEP1 = Math.max(SWEEP0 + 30, K.arc19 + 6);
const GHOST_A = [12, 58, 92, 128, 148].map((d) => d * D2R);
const HOP_DUR = 14;
const HOPS = (() => {
  const h0 = Math.max(SWEEP1 + 4, K.all19 - 2);
  const h1 = Math.max(h0 + HOP_DUR + 3, K.dist19 - 2);
  const h2 = Math.max(h1 + HOP_DUR + 3, K.from19 - 2);
  return [h0, h1, h2];
})();
const HOP_TO = [GHOST_A[4], GHOST_A[2], GHOST_A[1]];
const RETRACT_DUR = 12;
const RETRACT0 = Math.min(Math.max(HOPS[2] + HOP_DUR + 4, K.spot19), K.s20 - RETRACT_DUR - 4);
const GHOSTS_OFF = K.s20 - 4;
const LBL_KNOWN_OUT = K.s20 - 8;
const LBL_DIR = SWING0 + 22; // "distance known · direction unknown" once the arc is under way (wide framing)

// the one pull back: on the ruler's swing to the wall, to see the whole arc
const PULL0 = SWING0 - 4;
const PULL_DUR = 28;
// the one push in: on "Measured timings are a bit fuzzy", to look closely at the crossing and the hidden side
const PUSH0 = K.s21;
const PUSH_DUR = 30;
const camAt = (g: number): Cam =>
  g < FOLD_END
    ? foldCam(g)
    : camPath(g, CAM_LEG, [
        {at: PULL0, dur: PULL_DUR, to: CAM_WIDE},
        {at: PUSH0, dur: PUSH_DUR, to: CAM_NEAR},
      ]);
/** plan point -> screen px at frame g (after the fold) */
const toS = (g: number, p: P2) => planScreen(camAt(g), p);

// V5.5: the second spot
const W4_POP = K.listen20 - 6;
const SCH4 = pathSchedule([Sp, W4, Sp], {start: K.listen20 + 2});
const LBL_SECOND = K.second;
const LBL_SECOND_OUT = K.on20 - 8;
const R4_EXT0 = Math.max(SCH4.end + 4, K.another1);
const R4_EXT_DUR = Math.max(10, Math.min(16, K.another2 - R4_EXT0 - 4));
const TH4_0 = 8 * D2R; // ruler 2 comes out just off the wall, pointing right
const SWEEP4_0 = Math.max(R4_EXT0 + R4_EXT_DUR + 2, K.another2);
const SWEEP4_1 = Math.max(SWEEP4_0 + 26, Math.min(K.on20 - 2, SWEEP4_0 + 34));
const RETRACT4_0 = SWEEP4_1 + 3;
const BH0 = Math.max(RETRACT4_0 + 4, K.on20);
const BH_DUR = Math.max(16, Math.min(28, K.cross20 - BH0 - 2));
const BH_END = BH0 + BH_DUR;
const IMPOSSIBLE = Math.max(BH_END + 2, K.cross20 - 2);
const CROSS_RING = K.cross20 - 2;
/**
 * J3b (review V2-R1-12). "...they cross in just [pause] one place": the narration pauses between "just" and "one", and
 * the music makes its full stop 0.25 s before "one" (tools/make_music_v02v2.py, cue j3b). The pointer's tip meets the
 * crossing there, so its tap, its stop and the music's stop are one event. His smile snaps on "one" (BUSTED0, a SNAP
 * spring: the face has visibly changed by FACE_DROP); the uh-oh sting follows 2 frames later, quieter.
 */
const TAP = K.one20 - 8;
const BUSTED0 = K.one20 - 2;
const FACE_DROP = K.one20;
const UHOH = FACE_DROP + 2;
/** V2-R1-26: his mitt lifts off the partition over LIFT_DUR frames as the face snaps, then the arm drops */
const LIFT_DUR = 4;
const DROP_DUR = 8;
if (TAP + 4 > BUSTED0) throw new Error('V5: J3b reacts before the pointer has tapped the crossing');
const BH_OUT = K.s21;
/**
 * The circles continued behind the wall: from each arc's right end at the wall, round past their second crossing
 * (the mirror image of H), ending at these angles (rad, atan2(dz, dx) about the spot: W1 to z ≈ -1.06 m, W4 to
 * z ≈ -0.93 m). Partial on purpose: the full back halves would reach z = -1.33 m and run under the chip.
 */
const BACK_TO = [5.35, 4.95];

// V5.6
const FUZZ0 = K.fuzzy;
const BAND0 = Math.max(FUZZ0 + 12, K.band21 - 22);
const BAND_DUR = 26;
const LBL_BAND = BAND0 + 14;
const PATCH0 = K.overlap;
const PATCH_DUR = 24;
const PATCH_RING = Math.max(PATCH0 + 8, K.small - 2);

// V5.7
const SLIDE_IN0 = K.s22 - 8;
const SLIDE_IN_DUR = Math.max(14, Math.min(26, K.close - SLIDE_IN0 - 2));
// each rule label cuts in whole (no part-built text: a centred label would shift when its second half arrived)
const LBL_CLOSE = K.close + 2;
const SPREAD0 = K.spread;
const SPREAD_DUR = Math.max(20, Math.min(36, K.shrinks - K.spread + 4));
const LBL_CLOSE_OUT = 4; // "close → long, blurry" is gone before "spread out → smaller" cuts in (same slot)
const LBL_SPREAD = SPREAD0 + LBL_CLOSE_OUT;

// V5.8
const CLEAR0 = CHIP_OUT;
/** the two spots not yet shown (W2, W3) are marked on "computer", before all four flash on "weighs" */
const SPOTS_IN = K.computer - 2;
const MANY_SCH = WALL.map((w, i) => pathSchedule([Sp, w, Sp], {start: K.weighs + i * 5}));
const DOTS0 = K.trying - 2;
const DOTS_DUR = Math.max(14, Math.min(26, K.keeping - K.trying));
const LBL_CAND = K.positions;
const EX1 = K.keeping - 4;
const EX2 = Math.max(EX1 + 34, K.predicted + 8);
const CHECK = Math.max(EX2 + 16, K.match);
const X_POP = EX1 + 12;
const X_POP_DUR = 6;
const X_OUT = EX2 - 5;
const xVt = (g: number) => tw(g, X_POP, X_POP_DUR) * (1 - tw(g, X_OUT, 5));
{
  const full = Array.from({length: EX2 - EX1}, (_, i) => EX1 + i).filter((g) => 1.6 * xVt(g) >= 1).length;
  if (full < 15) throw new Error(`V5: the reject ✗ is at full opacity for only ${full} frames (needs 15)`);
  if (CHECK - (EX2 + 2) < 12) throw new Error(`V5: the match's ticks have ${CHECK - EX2 - 2} frames before the ✓ (needs 12)`);
}
const CULL0 = CHECK + 6;
const CULL_SPAN = 24;
const CLUSTER0 = CULL0 + 20;
const CLUSTER_DUR = 40;
const CARD_OFF = CULL0 + 14;
const ASSUME = K.assumptions;
const MODEL = Math.max(ASSUME + 10, K.kind - 4);
const MODEL_SHRINK0 = MODEL + 12;
const MODEL_SHRINK_DUR = Math.max(16, Math.min(40, K.n12 - MODEL_SHRINK0));
const LBL_CAND_OUT = CLUSTER0 + 10;

// V5.9
const BLOB0 = Math.min(K.likely - 6, Math.max(K.answer - 4, CLUSTER0 + CLUSTER_DUR + 10));
const BLOB_DUR = 26;
const LBL_LIKELY = K.likely + 2;
const RING_IN = LBL_LIKELY;
const RING_DUR = 14;
const DIM_DUR = 12;

// light only after the fold has landed (no room-view light in V5)
[ROUTE_SCH, SCH4, ...MANY_SCH].forEach((q, i) => {
  if (q.start <= FOLD_END) throw new Error(`V5: pulse ${i} starts at ${q.start}, before the fold lands (${FOLD_END})`);
});
if (TAPE0 <= ROUTE_SCH.end) throw new Error('V5: the tape pulse starts before the route has drawn');
if (TAPE_HOME > FOLD_T0) throw new Error('V5: the tape folds before the pulse is home');

/* ------------------------------------------------------------------ the rulers (V5.3–V5.5) */

type RulerState = {angle: number; len: number; arc: number; arcFrom: number; on: boolean};
/** ruler 1 (W1): appears on him (STEP3), wavers on "Not which direction", swings to 0 and sweeps to 180°, taps ghosts */
const ruler1 = (g: number): RulerState => {
  let angle = H_BEARING;
  if (g >= WAG0 && g < WAG1) {
    const D = WAG1 - WAG0;
    angle = kf(g, [
      [WAG0, H_BEARING],
      [WAG0 + 0.28 * D, H_BEARING + 22 * D2R],
      [WAG0 + 0.55 * D, H_BEARING - 14 * D2R],
      [WAG0 + 0.8 * D, H_BEARING + 9 * D2R],
      [WAG1, H_BEARING],
    ]);
  } else if (g >= SWING0 && g < SWEEP0) {
    angle = H_BEARING * (1 - E.inOut(tw(g, SWING0, SWING_DUR, E.linear)));
  } else if (g >= SWEEP0 && g < SWEEP1) {
    angle = Math.PI * Easing.bezier(0.45, 0, 0.55, 1)(tw(g, SWEEP0, SWEEP1 - SWEEP0, E.linear));
  } else if (g >= SWEEP1) {
    angle = kf(g, [
      [HOPS[0], Math.PI],
      [HOPS[0] + HOP_DUR, HOP_TO[0]],
      [HOPS[1], HOP_TO[0]],
      [HOPS[1] + HOP_DUR, HOP_TO[1]],
      [HOPS[2], HOP_TO[1]],
      [HOPS[2] + HOP_DUR, HOP_TO[2]],
    ]);
  }
  const arc = g >= SWEEP1 ? Math.PI : g >= SWEEP0 ? angle : 0;
  const len = R1 * (1 - E.in(tw(g, RETRACT0, RETRACT_DUR, E.linear)));
  return {angle, len, arc, arcFrom: 0, on: g >= TAPE_TO_RULER && g < RETRACT0 + RETRACT_DUR};
};
const ruler4 = (g: number): RulerState => {
  const ext = E.out(tw(g, R4_EXT0, R4_EXT_DUR, E.linear));
  const angle = g < SWEEP4_0 ? TH4_0 : lerp(TH4_0, Math.PI, Easing.bezier(0.45, 0, 0.55, 1)(tw(g, SWEEP4_0, SWEEP4_1 - SWEEP4_0, E.linear)));
  const len = R4 * ext * (1 - E.in(tw(g, RETRACT4_0, RETRACT_DUR, E.linear)));
  // the arc is drawn from the wall (0) up to the ruler; its first 8° are there as soon as the ruler is out
  const arc = g >= R4_EXT0 + R4_EXT_DUR ? angle : 0;
  return {angle, len, arc, arcFrom: 0, on: g >= R4_EXT0 && g < RETRACT4_0 + RETRACT_DUR};
};
// no ruler step larger than 12.5° a frame (v1 review D25)
(() => {
  for (const [name, f, a, b] of [
    ['ruler 1', ruler1, WAG0, RETRACT0],
    ['ruler 2', ruler4, R4_EXT0, RETRACT4_0],
  ] as const) {
    for (let g = a; g < b; g++) {
      const d = Math.abs(f(g + 1).angle - f(g).angle);
      if (d > 12.5 * D2R) throw new Error(`V5: ${name} steps ${(d / D2R).toFixed(1)}° at frame ${g} (max 12.5°)`);
    }
  }
})();
/** first frame the sweeping ruler 1 has passed angle a */
const sweepFrameAt = (a: number) => {
  for (let g = SWEEP0; g < SWEEP1; g++) if (ruler1(g).angle >= a - 1e-9) return g;
  return SWEEP1;
};
const GHOST_IN = GHOST_A.map((a, i) => Math.max(K.anywhere - 6 + i * 3, sweepFrameAt(a) + 1));
const PASS_H_FRAME = sweepFrameAt(H_BEARING);

/* ------------------------------------------------------------------ V5.7 spots, V5.8 candidates (seeded) */

/** the two listening spots (x on the wall) through s21–s22: W1/W4, slide close to W2/W3, spread back */
const spotXs = (g: number): [number, number] => [
  kf(g, [[SLIDE_IN0, W1.x], [SLIDE_IN0 + SLIDE_IN_DUR, W2.x, E.inOut], [SPREAD0, W2.x], [SPREAD0 + SPREAD_DUR, W1.x, E.inOut]]),
  kf(g, [[SLIDE_IN0, W4.x], [SLIDE_IN0 + SLIDE_IN_DUR, W3.x, E.inOut], [SPREAD0, W3.x], [SPREAD0 + SPREAD_DUR, W4.x, E.inOut]]),
];
const sliding = (g: number) => g >= SLIDE_IN0 && g < SPREAD0 + SPREAD_DUR;

type Dot = {p: P2; err: number; delay: number; keep: boolean; target: P2; id: number};
const errOf = (p: P2) => Math.sqrt(WALL.reduce((a, w, i) => a + (dist(p, w) - RADII[i]) ** 2, 0) / WALL.length);
const KEEP_ERR = 0.15;
const HIDDEN_BOX = {x0: L.occluder.x + 0.1, x1: ROOM.x1 - 0.12, z0: 0.08, z1: 1.6};
/** the final likely-location field: all four spots, one-bin bands */
const FINAL_FIELD: ScalarField = possibleCloud({x0: 2.2, x1: 3.0, z0: 0.5, z1: 1.2, step: 0.008}, WALL.map((w, i) => ({W: w, r: RADII[i], halfWidth: HW})));
/**
 * The likely location's look (review V2-R1-27): the same four-band region (size kept, so it never reads as a point),
 * feathered: nested levels with no outlines and no paper rim, under a blur of 3.5 world px (about 5 screen px at
 * CAM_NEAR), the outer level filled denser so the soft patch still reads at phone size.
 */
const LIKELY_SOFT = {levels: [0.02, 0.2, 0.5], blur: 3.5, outline: false, outerOutline: false, rim: 0, outerFillOpacity: 0.85};
const fieldAt = (f: ScalarField, p: P2) => {
  const i = Math.round((p.x - f.spec.x0) / f.spec.step);
  const j = Math.round((p.z - f.spec.z0) / f.spec.step);
  if (i < 0 || j < 0 || i >= f.nx || j >= f.nz) return 0;
  return f.values[j * f.nx + i];
};
const TARGETS: P2[] = (() => {
  const out: P2[] = [];
  for (let s = 0; out.length < 90 && s < 20000; s++) {
    const p = {x: 2.3 + rand(9001 + s * 2) * 0.6, z: 0.6 + rand(9002 + s * 2) * 0.5};
    if (fieldAt(FINAL_FIELD, p) > 0.45) out.push(p);
  }
  return out;
})();
const BAD_EX: P2 = {x: 3.35, z: 0.4};
const GOOD_EX: P2 = {x: Hp.x + 0.03, z: Hp.z - 0.02};
const DOTS: Dot[] = (() => {
  const n = 200;
  const out: Dot[] = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    const p = {x: lerp(HIDDEN_BOX.x0, HIDDEN_BOX.x1, rand(101 + i * 3)), z: lerp(HIDDEN_BOX.z0, HIDDEN_BOX.z1, rand(102 + i * 3))};
    const err = errOf(p);
    const keep = err < KEEP_ERR;
    out.push({p, err, delay: rand(103 + i * 3), keep, target: keep ? TARGETS[t++ % TARGETS.length] : p, id: i});
  }
  out.push({p: BAD_EX, err: errOf(BAD_EX), delay: 0.2, keep: false, target: BAD_EX, id: n});
  out.push({p: GOOD_EX, err: errOf(GOOD_EX), delay: 0.4, keep: true, target: TARGETS[t++ % TARGETS.length], id: n + 1});
  return out;
})();
const SURVIVORS = DOTS.filter((d) => d.keep);
const CHILDREN = SURVIVORS.flatMap((d, i) => [0, 1].map((c) => ({from: d, target: TARGETS[(SURVIVORS.length + i * 2 + c) % TARGETS.length], delay: rand(7001 + i * 5 + c)})));
const MEASURED = WALL.map((w) => arrivalNs(w, Hp));
/**
 * V5.8's measured-versus-predicted comparison, large (review V2-R1-25): two tick rows across the lower third, 48 px
 * labels, x 480–1776 (right of her token and the sensor), y 770–938 (clear of the caption band). The axis range spans
 * the measured times and both examples' predictions with a margin, so the ticks spread across the strip.
 */
const ECHO_STRIP = {x: 480, y: 770, w: 1296, h: 168};
const ECHO_RANGE: [number, number] = (() => {
  const all = [...MEASURED, ...WALL.map((w) => arrivalNs(w, BAD_EX)), ...WALL.map((w) => arrivalNs(w, GOOD_EX))];
  return [Math.min(...all) - 0.45, Math.max(...all) + 0.45];
})();
if (ECHO_STRIP.y + ECHO_STRIP.h + 10 > 950) throw new Error('V5: the comparison strip reaches the caption band');

/* ------------------------------------------------------------------ the guesser's face (inset, J3a / J3b) */

const INSET = {cx: 1662, cy: 700, r: 160};

/** his face and body in the inset, before his left arm is placed */
const guesserBody = (g: number): {p: Pose2; lean: number} => {
  let p: Pose2 = withPose(IDLE2, {...EXPR.smug, lookX: -0.2});
  // "you know how far he is": nervous, eyes toward the wall
  const nerv = tw(g, K.how18 - 4, 10) * (1 - tw(g, RELAX, 8));
  p = withPose(p, {lid: 0, eyes: 1.12, pupil: 0.85, brows: 0.5, browAsym: 0, mouth: 'flat', tilt: 0, lookX: -0.75, lookY: -0.15, sweat: 0.45}, nerv);
  // "not which direction": relief (eyes shut on the exhale), then the smug lean on the partition
  const relief = tw(g, RELAX, 6) * (1 - tw(g, RELAX + 12, 6));
  p = withPose(p, {mouth: 'smile', hunch: 0.07, brows: 0.15, lookX: 0}, relief);
  const lean = sp(g, LEAN0, SOFT);
  p = withPose(p, {...EXPR.smug, lean: -7, tilt: -8, lid: 0.5, lookX: 0.3, lookY: 0.05, sweat: 0}, Math.min(1, lean));
  // s20 "a second spot": alert; "another arc": the smile goes
  const alert = tw(g, K.second - 4, 10);
  p = withPose(p, {lid: 0.12, brows: 0.35, browAsym: 0.1, lookX: -0.65, lookY: -0.1, tilt: -4}, alert);
  const flat = tw(g, K.another2, 10);
  p = withPose(p, {mouth: 'flat', lean: -4, eyes: 1.06}, flat);
  // "one place": busted (J3b), straightens up off the partition
  const busted = sp(g, BUSTED0, SNAP);
  p = withPose(p, {...EXPR.busted, lean: 0, tilt: -3, lookX: -0.4, lookY: 0}, Math.min(1.05, busted));
  p = {...p, bob: hop(g, BUSTED0, 10, 8)};
  if (g >= RELAX && g < RELAX + 15) p = {...p, blink: 1 - tw(g, RELAX + 1, 2, E.linear) * (1 - tw(g, RELAX + 11, 3, E.linear))};
  return {p, lean: clamp01(lean)};
};
/** FaceInset's own rig placement (S4_Inset) and the partition edge his left mitt leans on */
const insetRig = (g: number) => ({x: INSET.r + INSET_RIG.dx * INSET.r, y: INSET.r + INSET_RIG.headY * INSET_RIG.scale, scale: INSET_RIG.scale, frame: g, seed: 5, life: 0.5});
const LEAN_EDGE = {x: 0.36 * INSET.r + 2, y: insetRig(0).y - 318 * INSET_RIG.scale};
/** his left arm on the partition edge the frame before the snap: the J3b lift-off starts from it */
const LEAN_ARM0 = reach2(insetRig(BUSTED0 - 1), guesserBody(BUSTED0 - 1).p, -1, LEAN_EDGE.x, LEAN_EDGE.y, 1);
/** wrap an angle (deg) to within 180 of a reference, so a blend takes the short way round */
const near180 = (d: number, ref: number) => d - 360 * Math.round((d - ref) / 360);

/**
 * J3a/J3b in the inset. His left mitt is reached onto the partition edge with the lean (J3a, as built in S4_Inset).
 * On the snap (review V2-R1-26) it comes off the edge over LIFT_DUR frames, drawn in toward his chest (the shoulder
 * swings in 25°, the elbow closes 45°), then the arm drops to its hanging pose over DROP_DUR frames, the shoulder
 * leading and the elbow following, so the mitt visibly leaves the partition instead of vanishing in two frames.
 */
const guesserFace = (g: number): {pose: Pose2; lean: number} => {
  const {p, lean} = guesserBody(g);
  if (lean <= 0.001) return {pose: p, lean: 0};
  if (g < BUSTED0) {
    const arm = reach2(insetRig(g), p, -1, LEAN_EDGE.x, LEAN_EDGE.y, 1);
    return {pose: {...p, armL: {a: lerp(p.armL.a, arm.a, lean), b: lerp(p.armL.b, arm.b, lean)}, armsFront: 'L'}, lean: 0};
  }
  const u = tw(g, BUSTED0 + LIFT_DUR, DROP_DUR, E.linear);
  if (u >= 1) return {pose: p, lean: 0};
  const lift = E.inOut(tw(g, BUSTED0, LIFT_DUR, E.linear));
  const a1 = LEAN_ARM0.a - 25 * lift;
  const b1 = near180(LEAN_ARM0.b + 45 * lift, p.armL.b);
  const ua = E.inOut(u);
  const ub = E.inOut(clamp01((u - 0.35) / 0.65));
  return {pose: {...p, armL: {a: lerp(a1, p.armL.a, ua), b: lerp(b1, p.armL.b, ub)}, armsFront: 'L'}, lean: 0};
};

/* ------------------------------------------------------------------ screen layout (labels) */

/** slot A: the 64 px teaching label (centred above the wall, on the paper behind it); slot B: the 48 px line under it */
const SLOT_A = {x: 960, y: 215};
const SLOT_B = {x: 960, y: 300};
/** CAM_NEAR's label line (48 px), on the paper behind the wall, above the 0.5 m ticks */
const SLOT_N = {x: 960, y: 236};
const CHIP_POS = {x: 1824, y: 54};
/** "likely location" (48), right of the ring round him in CAM_NEAR */
const LIKELY_LBL = (() => {
  const h = planScreen(CAM_NEAR, Hp);
  return {x: h.x + 170, y: h.y - 80};
})();
// the pointer for V5.5: from the upper right, over the room, to the crossing (clear of the face inset)
const H_S = planScreen(CAM_WIDE, Hp);
const POINTER_DIR = {x: 0.9, y: -0.43};
(() => {
  // the stick + sleeve line from the crossing toward the upper right stays clear of the inset bubble
  const n = Math.hypot(POINTER_DIR.x, POINTER_DIR.y);
  const d = {x: POINTER_DIR.x / n, y: POINTER_DIR.y / n};
  for (let s = 0; s < 1400; s += 10) {
    const p = {x: H_S.x + d.x * s, y: H_S.y + d.y * s};
    if (Math.hypot(p.x - INSET.cx, p.y - INSET.cy) < INSET.r + 30 + 40) throw new Error('V5: the pointer passes over the face inset');
  }
})();

/* ------------------------------------------------------------------ the scene */

const STAND_SORT_Z = OPp.z + 0.2;
const arcPts = (c: P2, r: number, a0: number, a1: number) => sampleArc(c, r, a0, a1, Math.max(2, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 120))));

export const V5DelayPlace: React.FC = () => {
  const g = useG();
  const tilt = tiltAt(g, FOLD0, FOLD_DUR, FOLD_EASE);
  const cam = camAt(g);
  const st = viewAt(tilt);
  const k = 1 / cam.zoom;
  const toW = (p: P2) => {
    const q = projectWith(st, {x: p.x, z: p.z, h: 0});
    return {x: q.x, y: q.y};
  };
  const ppm = st.ppm;
  const mix = figureMix(tilt);

  /* ---- people (room view, during the fold) */
  const op = rigAt(OPp.x, OPp.z, tilt);
  const gu = rigAt(Hp.x, Hp.z, tilt);
  let chkPose: Pose2 = withPose({...IDLE2}, {...EXPR.deadpan, lookX: 0.6, lookY: 0.32, tilt: 3});
  {
    const chk = {x: op.x, y: op.y, scale: op.scale, frame: g, seed: 3, life: 0.35};
    const hand = handWorld2(chk, chkPose, 1);
    const col = s4ColumnAt(tilt, hand.y);
    chkPose = {...chkPose, armR: reach2(chk, chkPose, 1, col.x, col.y, 1)};
  }
  let guPose: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), settlePose(1, 1));
  guPose = withPose(guPose, {lookY: -0.8, lookX: -0.15, brows: 0.45, browAsym: 0.15, lid: 0.12, mouth: 'flat', tilt: 2}, tw(g, FOLD0, 10, E.inOut));

  /* ---- light */
  const firing = Math.max(...[FLASH_FIRE, ROUTE_SCH.start, SCH4.start, ...MANY_SCH.map((q) => q.start)].map((s) => Math.max(0, 1 - Math.abs(g - s) / 5)));
  const routeProg = ROUTE_SCH.progress(g);
  const routeOp = g < ROUTE_SCH.start ? 0 : lerp(1, 0.32, tw(g, ROUTE_DIM, 14)) * (1 - tw(g, ROUTE_OUT, 12));
  const wedgeIn = tw(g, WEDGE_IN, 10) * (1 - tw(g, BEAM_OUT, 12));
  const narrow = E.inOut(tw(g, NARROW0, NARROW_DUR, E.linear));
  const zoneEdges = L.frames.A.zoneEdgesX;
  const wedgeL = lerp(zoneEdges[0], W1.x - 0.03, narrow);
  const wedgeR = lerp(zoneEdges[zoneEdges.length - 1], W1.x + 0.03, narrow);

  /* ---- tape (V5.2) and the ruler (V5.3–V5.4) */
  const tapeP = clamp01((g - TAPE0) / (TAPE_HOME - TAPE0)) * 2 * R1;
  const tapeFold = tw(g, FOLD_T0, FOLD_T_DUR, E.linear);
  const tapeOp = g < TAPE0 ? 0 : 1 - tw(g, TAPE_TO_RULER, RULER_IN_DUR);
  const straddle = tw(g, STRADDLE, 8) * (1 - tw(g, STEP1, 8));
  const tapeFlash = Math.sin(Math.PI * tw(g, STEP1, 16, E.linear));
  // "fifteen centimetres": the straddling stroke (the one extra nanosecond) brightens once
  const straddleFlash = Math.sin(Math.PI * tw(g, K.fifteen - 2, 16, E.linear));
  // the pulse on the tape: out on the near lane, home on the other lane (as LightPath runs out-and-back legs)
  const pulseS = clamp01((g - TAPE0) / (TAPE_HOME - TAPE0)) * 2 * R1;
  const pulseOn = g >= TAPE0 && g < TAPE_HOME + 2;
  const pulseD = pulseS <= R1 ? pulseS : 2 * R1 - pulseS;
  const pulseLane = pulseS <= R1 ? 0.06 : -0.06;
  const pulseP = tapeLanePoint(W1, U1, pulseD, pulseLane);
  const turnRing = tw(g, TAPE_TURN, 14, E.linear);
  const spotPing = tw(g, SPOT_PING, 16, E.linear);
  const r1 = ruler1(g);
  const r1Op = tw(g, TAPE_TO_RULER, RULER_IN_DUR);
  const r4 = ruler4(g);

  /* ---- arcs, bands, patch */
  const arcsOut = 1 - tw(g, CLEAR0, 16);
  const arcW = lerp(6, 3.5, tw(g, BAND0, BAND_DUR)) * k;
  const fuzz = 0.032 * E.out(tw(g, FUZZ0, 14)) * (1 - tw(g, BAND0 + BAND_DUR - 8, 12));
  const hw = HW * E.out(tw(g, BAND0, BAND_DUR, E.linear));
  const [ax, bx] = spotXs(g);
  const spots: P2[] = [Wat(ax), Wat(bx)];
  const spotR = spots.map((w) => dist(w, Hp));
  const patchT = tw(g, PATCH0, PATCH_DUR) * arcsOut;
  const field = g >= PATCH0 && patchT > 0 ? possibleCloud({x0: 1.85, x1: 3.45, z0: 0.0, z1: 1.75, step: 0.012}, spots.map((w, i) => ({W: w, r: spotR[i], halfWidth: Math.max(hw, 0.004)}))) : null;
  const bh = E.inOut(tw(g, BH0, BH_DUR, E.linear));
  const bhGrey = tw(g, IMPOSSIBLE, 12);
  const bhOut = 1 - tw(g, BH_OUT, 16);

  /* ---- candidates */
  const dotsIn = (d: Dot) => sp(g, DOTS0 + d.delay * DOTS_DUR, SNAP);
  const cullT = (d: Dot) => {
    if (d.keep) return 0;
    if (d.id === DOTS.length - 2) return tw(g, EX2 - 6, 8); // the rejected example leaves with its ✗
    return tw(g, CULL0 + (1 - clamp01(d.err / 0.9)) * CULL_SPAN * 0.7 + d.delay * CULL_SPAN * 0.3, 10);
  };
  const clusterT = (d: {delay: number}) => E.inOut(tw(g, CLUSTER0 + d.delay * 10, CLUSTER_DUR - 10, E.linear));
  const dotsFade = 1 - tw(g, BLOB0 + 6, 18);
  const blobT = tw(g, BLOB0, BLOB_DUR);
  const hPulse = Math.sin(Math.PI * tw(g, PASS_H_FRAME - 1, 10, E.linear));
  const hDim = lerp(1, LIKELY_DIM, tw(g, BLOB0, DIM_DUR)) * (1 - 0.5 * tw(g, TAPE_TURN - 12, 10) * (1 - tw(g, TAPE_TO_RULER, RULER_IN_DUR)));

  /* ---- tokens */
  const tokOp = tokenAt(OPp.x, OPp.z, tilt);
  const tokH = tokenAt(Hp.x, Hp.z, tilt);
  const sW = projectWith(st, {x: Sp.x, z: Sp.z, h: L.sensor.h});
  const opFacing = facingOf(sW.x - tokOp.x, sW.y - tokOp.y);
  const ghostT = (i: number) => tw(g, GHOST_IN[i], 10) * (1 - tw(g, GHOSTS_OFF, 14));

  /* ---- spots (diamonds on the wall) */
  const slide = sliding(g);
  const popAt = (t0: number) => (g < t0 ? 0 : E.back(clamp01((g - t0) / 12)));
  const markerPop = [popAt(W1_POP), popAt(SPOTS_IN), popAt(SPOTS_IN + 4), popAt(W4_POP)];
  const lit1 = Math.max(tw(g, W1_POP, 8) * (1 - tw(g, K.s20, 12)), tw(g, ROUTE_SCH.vertexFrames[1], 6) * 0);
  const lit4 = tw(g, SCH4.vertexFrames[1], 6) * (1 - tw(g, K.s21, 12));
  const litMany = (i: number) => tw(g, MANY_SCH[i].vertexFrames[1], 6) * (1 - tw(g, MANY_SCH[i].end + 10, 12));
  const markerLit = [slide ? 0 : Math.max(lit1, litMany(0)), litMany(1), litMany(2), slide ? 0 : Math.max(lit4, litMany(3))];
  const w1Glow = tw(g, FOLD0 + FOLD_DUR * 0.5, FOLD_DUR * 0.5) * (1 - tw(g, K.s20 - 6, 14));

  /* ---- items standing in the room */
  const items: RoomItem[] = [
    {
      key: 'checker',
      x: OPp.x,
      z: OPp.z,
      w: 0.3,
      node: mix.rig > 0.001 ? <Character2 look={CAST.checker} pose={chkPose} frame={g} seed={3} x={op.x} y={op.y} scale={op.scale} life={0.35} style={rigStyle(tilt, op.scale)} /> : null,
    },
    {
      key: 'guesser',
      x: Hp.x,
      z: Hp.z,
      w: 0.3,
      node: mix.rig > 0.001 ? <Character2 look={CAST.guesser} pose={guPose} frame={g} seed={5} x={gu.x} y={gu.y} scale={gu.scale} life={0.5} style={rigStyle(tilt, gu.scale)} /> : null,
    },
    {key: 'stand', x: Sp.x, z: STAND_SORT_Z, w: 0.17, height: L.sensor.h + 0.2, node: <SensorStand tilt={tilt} aim={AIM} firing={firing} />},
  ];

  /* ---- floor drawings */
  const roomClip = polyD([toW({x: ROOM.x0, z: ROOM.z0}), toW({x: ROOM.x1, z: ROOM.z0}), toW({x: ROOM.x1, z: ROOM.z1}), toW({x: ROOM.x0, z: ROOM.z1})], true);
  const arcLine = (c: P2, r: number, a0: number, a1: number, width: number, color: string, opa = 1, dash?: string) =>
    a1 - a0 > 1e-3 ? <path d={polyD(arcPts(c, r, a0, a1).map(toW))} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opa} strokeDasharray={dash} /> : null;
  const DASH = `${16 * k} ${11 * k}`;
  const diamond = (p: P2, pop: number, lit: number, key: string) => {
    if (pop <= 0.001) return null;
    const c = toW(p);
    const s = 16 * k * pop * (1 + 0.18 * lit);
    return <path key={key} d={`M ${c.x} ${c.y - s} L ${c.x + s} ${c.y} L ${c.x} ${c.y + s} L ${c.x - s} ${c.y} Z`} fill={lit > 0 ? mixColor(C.cream, C.saffron, lit) : C.cream} stroke={C.ink} strokeWidth={OUTLINE * k} strokeLinejoin="round" />;
  };
  const rulerEl = (w: P2, s: RulerState, opa = 1) => (s.on && s.len > 0.005 ? <Ruler o={toW(w)} angle={s.angle} len={s.len * ppm} ppm={ppm} k={k} opacity={opa} /> : null);
  const w1L = w1Spot(st);
  // the wall spot inside the match ring at the opening; W1's diamond takes over as the plan lands
  const roomSpot = 1 - tw(g, FOLD0 + FOLD_DUR * 0.55, FOLD_DUR * 0.3);

  const backdrop = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="v5room">
          <path d={roomClip} />
        </clipPath>
      </defs>
      {/* W1's glow (the match ring settles into it) */}
      {w1Glow > 0.001 && <circle cx={w1L.x} cy={w1L.y} r={34 * k} fill={C.saffronLight} opacity={0.9 * w1Glow} />}
      {/* the wall spot at the opening (bare wall above the people), inside the match ring */}
      {roomSpot > 0.001 && <circle cx={w1L.x} cy={w1L.y} r={11 * k} fill={C.saffron} stroke={C.ink} strokeWidth={3 * k} opacity={roomSpot} />}
      {/* the sensor's field-of-view wedge, narrowing to one beam on W1 */}
      {wedgeIn > 0.001 && (
        <path d={polyD([toW(Sp), toW(Wat(wedgeL)), toW(Wat(wedgeR))], true)} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={2.5 * k} strokeOpacity={0.6} opacity={0.75 * wedgeIn} />
      )}
      {/* tokens */}
      {mix.token > 0.001 && <GuesserToken asGroup x={tokH.x} y={tokH.y} size={2 * tokH.r} scale={tokH.scale * (1 + 0.12 * hPulse)} opacity={tokH.opacity * hDim} facing={200} />}
      {/* "anywhere on this arc": faint ghosts of him along the first arc */}
      {GHOST_A.map((a, i) => {
        const t = ghostT(i);
        if (t <= 0.001) return null;
        const p = toW(polar(W1, R1, a));
        const touch = g >= SWEEP1 && r1.on ? clamp01(1 - Math.abs(r1.angle - a) / 0.12) * clamp01(r1.len / R1) : 0;
        return <GuesserToken key={`gh${i}`} asGroup x={p.x} y={p.y} size={2 * tokH.r} scale={0.62 + 0.08 * clamp01(t)} opacity={(0.32 + 0.3 * touch) * t} facing={200} shadow={false} />;
      })}
      {/* the two circles continue behind the wall and cross again there (constraints, dashed) */}
      {bh > 0 && bhOut > 0 && (
        <g opacity={bhOut}>
          {arcLine(W1, R1, lerp(2 * Math.PI, BACK_TO[0], bh), 2 * Math.PI, 5 * k, mixColor(C.blue, C.inkMuted, bhGrey), lerp(0.9, 0.45, bhGrey), DASH)}
          {arcLine(W4, R4, lerp(2 * Math.PI, BACK_TO[1], bh), 2 * Math.PI, 5 * k, mixColor(C.blue, C.inkMuted, bhGrey), lerp(0.9, 0.45, bhGrey), DASH)}
        </g>
      )}
      <g clipPath="url(#v5room)" opacity={arcsOut}>
        {hw > 0.0005 && spots.map((w, i) => <Band key={`b${i}`} asGroup center={w} r={spotR[i]} halfWidth={hw} toPx={toW} t={1} tone="blue" fillOpacity={0.3} />)}
        {g < FUZZ0 ? (
          <>
            {arcLine(W1, R1, r1.arcFrom, r1.arc, arcW, C.blue, 1, DASH)}
            {arcLine(W4, R4, r4.arcFrom, r4.arc, arcW, C.blue, 1, DASH)}
          </>
        ) : (
          spots.map((w, i) => (
            <g key={`a${i}`}>
              {fuzz > 0.0005 && arcLine(w, spotR[i] - fuzz, 0, Math.PI, 3 * k, C.blue, 0.55, DASH)}
              {fuzz > 0.0005 && arcLine(w, spotR[i] + fuzz, 0, Math.PI, 3 * k, C.blue, 0.55, DASH)}
              {arcLine(w, spotR[i], 0, Math.PI, arcW, C.blue, 1, hw > 0.02 ? undefined : DASH)}
            </g>
          ))
        )}
        {field && <PossibleCloud asGroup toPx={toW} field={field} t={patchT} tone="teal" />}
      </g>
      {/* candidate positions (s23) */}
      {g >= DOTS0 && dotsFade > 0 && (
        <g opacity={dotsFade}>
          {DOTS.map((d) => {
            const a = dotsIn(d);
            if (a <= 0.001) return null;
            const c = cullT(d);
            if (c >= 1) return null;
            const ct = d.keep ? clusterT(d) : 0;
            const p = toW({x: lerp(d.p.x, d.target.x, ct), z: lerp(d.p.z, d.target.z, ct)});
            const r = 8 * k * Math.min(1.1, a) * (1 - 0.5 * c) * (d.keep && g >= CULL0 ? 1.15 : 1);
            return <circle key={`d${d.id}`} cx={p.x} cy={p.y} r={r} fill={c > 0 ? mixColor(C.teal, C.paperLine, c) : C.teal} stroke={C.ink} strokeWidth={2.5 * k} opacity={1 - c} />;
          })}
          {CHILDREN.map((ch, i) => {
            const t0 = CLUSTER0 + ch.delay * 12;
            const a = sp(g, t0, SNAP);
            if (a <= 0.001) return null;
            const ct = E.inOut(tw(g, t0, CLUSTER_DUR - 4, E.linear));
            const from = ch.from.target;
            const pp = {x: lerp(lerp(ch.from.p.x, from.x, clusterT(ch.from)), ch.target.x, ct), z: lerp(lerp(ch.from.p.z, from.z, clusterT(ch.from)), ch.target.z, ct)};
            const p = toW(pp);
            return <circle key={`c${i}`} cx={p.x} cy={p.y} r={8 * k * Math.min(1.1, a)} fill={C.teal} stroke={C.ink} strokeWidth={2.5 * k} />;
          })}
        </g>
      )}
      {/* the likely location (n12) */}
      {blobT > 0 && <PossibleCloud asGroup toPx={toW} field={FINAL_FIELD} t={blobT} tone="teal" {...LIKELY_SOFT} />}
      <LikelyRing cx={toW(Hp).x} cy={toW(Hp).y} r={LIKELY_RING.rM * ppm} t={tw(g, RING_IN, RING_DUR, E.inOut)} k={k} />
      {/* light: the confocal route (drawn once, then faint), the second spot, the four spots */}
      {routeOp > 0.001 && routeProg > 0 && <LightPath asGroup points={ROUTE} toPx={toW} t={routeProg} layout={LAYOUT} opacity={routeOp} width={7 * k} pulseRadius={13 * k} ringRadius={52 * k} lane={12 * k} clearPx={0} arrive="hide" />}
      {[{sch: SCH4, w: W4}, ...MANY_SCH.map((sch, i) => ({sch, w: WALL[i]}))].map((q, i) => {
        const prog = q.sch.progress(g);
        const trail = g >= q.sch.start ? 1 - tw(g, q.sch.end + 4, 12) : 0;
        return trail > 0 && prog > 0 ? <LightPath key={`lp${i}`} asGroup points={[Sp, q.w, Sp]} toPx={toW} t={prog} layout={LAYOUT} opacity={trail} width={7 * k} pulseRadius={13 * k} ringRadius={52 * k} lane={12 * k} clearPx={0} /> : null;
      })}
      {/* the tape (path meter) and its pulse */}
      {tapeOp > 0.001 && <Tape W={W1} u={U1} F={R1} P={tapeP} fold={tapeFold} toW={toW} k={k} straddle={straddle} flash={tapeFlash} straddleFlash={straddleFlash} runner={R1 * tw(g, RUN0, RUN1 - RUN0, E.linear)} runnerOn={tw(g, RUN0, 4, E.linear) * (1 - tw(g, RUN1 + 2, 8, E.linear))} opacity={tapeOp} />}
      {/* "from the wall spot": one ring from W1 */}
      {spotPing > 0 && spotPing < 1 && <circle cx={w1L.x} cy={w1L.y} r={(14 + 46 * E.out(spotPing)) * k} fill="none" stroke={C.saffronDeep} strokeWidth={5 * k * (1 - 0.6 * spotPing)} opacity={1 - spotPing} />}
      {pulseOn && (
        <g>
          {turnRing > 0 && turnRing < 1 && <circle cx={toW(Hp).x} cy={toW(Hp).y} r={(10 + 44 * E.out(turnRing)) * k} fill="none" stroke={C.saffronDeep} strokeWidth={5 * k * (1 - 0.6 * turnRing)} opacity={1 - turnRing} />}
          <circle cx={toW(pulseP).x} cy={toW(pulseP).y} r={13 * k} fill={C.saffron} stroke={C.ink} strokeWidth={3.5 * k} />
          <circle cx={toW(pulseP).x - 3.6 * k} cy={toW(pulseP).y - 3.6 * k} r={4.2 * k} fill={C.cream} opacity={0.8} />
        </g>
      )}
      {/* wall spots */}
      {WALL.map((w, i) => {
        const near = slide && (i === 0 || i === 3) ? Math.abs((i === 0 ? ax : bx) - w.x) * ppm / k : 1e9;
        const opa = clamp01((near - 42) / 14);
        return opa > 0.001 ? (
          <g key={`w${i}`} opacity={opa}>
            {diamond(w, markerPop[i], markerLit[i], `wd${i}`)}
          </g>
        ) : null;
      })}
      {slide && spots.map((w, i) => diamond(w, 1, 1, `m${i}`))}
      {rulerEl(W1, r1, r1Op)}
      {rulerEl(W4, r4)}
    </svg>
  );

  /* ---- overlays on top of the set (world space) */
  const hW = toW(Hp);
  const crossRing = sp(g, CROSS_RING, SNAP) * (1 - tw(g, K.s21 + 4, 14));
  const patchRing = tw(g, PATCH_RING, 12, E.inOut) * (1 - tw(g, SLIDE_IN0, 10));
  const modelRing = tw(g, MODEL, 14, E.inOut) * (1 - tw(g, BLOB0 + 4, 14));
  const modelR = lerp(0.44, 0.26, tw(g, MODEL_SHRINK0, MODEL_SHRINK_DUR, E.inOut));
  const markerCircle = (r: number, t: number, color: string, opa: number, dash?: string) => {
    if (t <= 0.001 || opa <= 0.001) return null;
    const circ = 2 * Math.PI * r;
    return <circle cx={hW.x} cy={hW.y} r={r} fill="none" stroke={color} strokeWidth={6 * k} strokeLinecap="round" strokeDasharray={dash ?? `${circ * t} ${circ}`} transform={`rotate(-120 ${hW.x} ${hW.y})`} opacity={dash ? t * opa : opa} />;
  };
  const top = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {mix.token > 0.001 && <CheckerToken asGroup x={tokOp.x} y={tokOp.y} size={2 * tokOp.r} scale={tokOp.scale} opacity={tokOp.opacity} facing={opFacing} />}
      {markerCircle(0.3 * ppm, patchRing, C.tealDeep, 1)}
      {markerCircle(modelR * ppm, modelRing, C.saffronDeep, 1, `${12 * k} ${10 * k}`)}
      {crossRing > 0.001 && <circle cx={hW.x} cy={hW.y} r={(0.2 + 0.12 * Math.min(1.1, crossRing)) * ppm} fill="none" stroke={C.tealDeep} strokeWidth={7 * k} opacity={Math.min(1, crossRing)} />}
    </svg>
  );

  /* ---- screen space: the match ring, labels, cards, inset, pointer */
  // the match ring: on W1's light-plane point, shrinking into W1's glow as the room folds
  const ringT = tw(g, FOLD0, RING_SETTLE - FOLD0, E.inOut);
  const ringC = (() => {
    const q = w1Spot(st);
    return worldToScreen(cam, q.x, q.y);
  })();
  const ringOp = 1 - tw(g, RING_SETTLE - 4, 10);
  const ringR = lerp(V5_MATCH.r, 40, ringT);
  const ringCol = mixColor(C.ink, C.saffronDeep, ringT);

  const lblOp = (t0: number, t1 = 1e7, din = 6, dout = 8) => tw(g, t0, din) * (1 - tw(g, t1, dout));
  const sH = toS(g, Hp);
  const w1S = toS(g, W1);
  const w4S = toS(g, W4);
  const HmS = toS(g, Hm);
  // slot A sequence (64 px): one at a time; each one cuts in on its cue as the previous one goes
  const slotA: {text: string; t0: number; t1: number; leader?: {x: number; y: number}}[] = [
    {text: '1 ns ≈ 30 cm of travel', t0: LBL_30, t1: LBL_15, leader: toS(g, tapeLanePoint(W1, U1, 0.43, 0.06))},
    {text: 'there and back → ≈ 15 cm farther', t0: LBL_15, t1: STEP1, leader: toS(g, tapeLanePoint(W1, U1, R1 - 0.06, -0.12))},
    {text: `≈ ${DELAY1_TXT} ns later`, t0: STEP1, t1: STEP2},
    {text: `≈ ${TRIP1_TXT} m there and back`, t0: STEP2, t1: STEP3},
    {text: `≈ ${EACH1_TXT} m each way`, t0: STEP3, t1: CHAIN_OUT},
  ];
  // a label that replaces the previous one in the slot cuts straight in (no blank frame between the two); the first one
  // fades in over 4 frames, the last one fades out before s20
  const replaces = (t0: number) => slotA.some((p) => p.t1 === t0);
  const cut = (t0: number, t1: number) => (g >= t0 && g < t1 ? (replaces(t0) ? 1 : tw(g, t0, 4, E.linear)) * (t1 >= CHAIN_OUT ? 1 - tw(g, t1 - 8, 8) : 1) : 0);
  // the worked example's "illustrative · our room" chip stays put for the whole chain (settled labels do not move): it
  // sits right of the widest step, so it never jumps when a shorter step replaces a longer one
  const chainChipX = Math.max(...slotA.filter((s) => s.t0 >= STEP1).map((s) => labelBox(s.text, SLOT_A.x, SLOT_A.y, 64, 'middle').x1)) + 26;
  const illusChipOp = g >= STEP1 && g < CHAIN_OUT ? lblOp(ILLUS_CHIP, CHAIN_OUT - 8) : 0;
  // V5.8: the comparison card
  const ex = g < EX2 ? DOTS[DOTS.length - 2] : DOTS[DOTS.length - 1];
  const exPos = ex.keep ? {x: lerp(ex.p.x, ex.target.x, clusterT(ex)), z: lerp(ex.p.z, ex.target.z, clusterT(ex))} : ex.p;
  const exS = toS(g, exPos);
  const cardOp = tw(g, EX1 - 2, 8) * (1 - tw(g, CARD_OFF, 10));
  const reveal = g < EX2 ? tw(g, EX1 + 4, 12) * (1 - tw(g, EX2 - 5, 5)) : tw(g, EX2 + 2, 12);
  const verdict: -1 | 1 = g < EX2 ? -1 : 1;
  const vt = g < EX2 ? xVt(g) : tw(g, CHECK, 8);
  const exRing = cardOp * (g < EX2 ? tw(g, EX1, 6) * (1 - tw(g, X_OUT, 5)) : tw(g, EX2, 6));
  // the comparison, large, across the lower third (right of her token and the sensor, above the caption band)
  const STRIP = ECHO_STRIP;
  // the inset and the pointer
  const face = guesserFace(g);
  const insetOpen = sp(g, INSET_OPEN, SNAP) * (1 - E.in(tw(g, INSET_CLOSE, 12, E.linear)));
  const ptr = pointerAt(g, {target: sH, dir: POINTER_DIR, hit: TAP, travel: 1100, inDur: 16, hold: 16, outDur: 16});
  const ringLeadEnd = (() => {
    const tx = LIKELY_LBL.x - 10;
    const ty = LIKELY_LBL.y - 16;
    const dx = tx - sH.x;
    const dy = ty - sH.y;
    const n = Math.hypot(dx, dy);
    const rr = LIKELY_RING.rM * VP.ppm * cam.zoom + 6;
    return {x: sH.x + (dx / n) * rr, y: sH.y + (dy / n) * rr};
  })();

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={tilt} items={items} backdrop={backdrop}>
            {top}
          </RoomSet>
        </Layer>
      </Camera>

      {/* the V4.3 → V5.1 match ring, riding W1 into the plan */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {ringOp > 0.001 && <circle cx={ringC.x} cy={ringC.y} r={ringR} fill="none" stroke={ringCol} strokeWidth={V5_MATCH.stroke} opacity={ringOp} />}
        {/* V5.8 example ring and leader */}
        {exRing > 0.001 && (
          <g opacity={exRing}>
            <path d={`M ${Math.max(STRIP.x + 380, Math.min(STRIP.x + STRIP.w - 200, exS.x))} ${STRIP.y} L ${exS.x} ${exS.y + 24}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
            <circle cx={exS.x} cy={exS.y} r={22} fill="none" stroke={C.saffronDeep} strokeWidth={6} />
          </g>
        )}
        {lblOp(IMPOSSIBLE, BH_OUT) > 0 && <CrossMark x={HmS.x} y={HmS.y} r={24} t={tw(g, IMPOSSIBLE - 2, 10) * bhOut} />}
        {lblOp(LBL_LIKELY) > 0 && <path d={`M ${LIKELY_LBL.x - 10} ${LIKELY_LBL.y - 16} L ${ringLeadEnd.x} ${ringLeadEnd.y}`} stroke={C.tealDeep} strokeWidth={4} strokeLinecap="round" opacity={lblOp(LBL_LIKELY)} />}
        {/* the slot-A leaders down to the tape: plain ink, no white halo (a halo would notch the wall line they cross) */}
        {slotA.map((s) => {
          const o = cut(s.t0, s.t1);
          if (o <= 0 || !s.leader) return null;
          const ends = leaderEnds(labelBox(s.text, SLOT_A.x, SLOT_A.y, 64, 'middle'), s.leader, 12, 14);
          if (!ends) return null;
          const t = tw(g, s.t0, 8);
          return <path key={`ld-${s.text}`} d={`M ${ends.s.x} ${ends.s.y} L ${lerp(ends.s.x, ends.e.x, t)} ${lerp(ends.s.y, ends.e.y, t)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={o} />;
        })}
      </svg>

      {/* question title: "Farther from where?" only */}
      <QuestionTitle text="How does a delay become a location?" from={K.farther} to={TITLE_TO} frame={g} />

      {/* slot A: the 64 px teaching label of the beat */}
      {slotA.map((s) => {
        const o = cut(s.t0, s.t1);
        return o > 0 ? (
          <TeachLabel key={s.text} x={SLOT_A.x} y={SLOT_A.y} anchor="middle" opacity={o}>
            {s.text}
          </TeachLabel>
        ) : null;
      })}
      {illusChipOp > 0 && <Chip x={chainChipX} y={SLOT_A.y - 22} valign="middle" size={30} opacity={illusChipOp}>illustrative · our room</Chip>}
      {/* slot B (48 px) */}
      <SubLabel x={SLOT_B.x} y={SLOT_B.y} anchor="middle" opacity={lblOp(LBL_DIR, LBL_KNOWN_OUT)}>
        distance known · direction unknown
      </SubLabel>
      <SubLabel x={w4S.x} y={SLOT_B.y} anchor="middle" opacity={lblOp(LBL_SECOND, LBL_SECOND_OUT)} leader={{x: w4S.x, y: w4S.y - 20, gap: 6}}>
        second spot
      </SubLabel>
      <Label x={HmS.x + 124} y={HmS.y + 14} size={40} opacity={lblOp(IMPOSSIBLE, BH_OUT)} color={C.inkSoft} leader={{x: HmS.x + 26, y: HmS.y, gap: 4, color: C.inkSoft}}>
        behind the wall: impossible
      </Label>
      <SubLabel x={SLOT_N.x} y={SLOT_N.y} anchor="middle" opacity={lblOp(LBL_BAND, SLIDE_IN0)}>
        fuzzy timing → band
      </SubLabel>
      {lblOp(LBL_BAND, SLIDE_IN0) > 0 && <Chip x={labelBox('fuzzy timing → band', SLOT_N.x, SLOT_N.y, 48, 'middle').x1 + 24} y={SLOT_N.y - 17} valign="middle" size={30} opacity={lblOp(LBL_BAND + 4, SLIDE_IN0)}>illustrative</Chip>}
      <SubLabel x={SLOT_N.x} y={SLOT_N.y} anchor="middle" opacity={lblOp(LBL_CLOSE, SPREAD0, 6, LBL_CLOSE_OUT)}>
        close → long, blurry
      </SubLabel>
      <SubLabel x={SLOT_N.x} y={SLOT_N.y} anchor="middle" opacity={lblOp(LBL_SPREAD, CLEAR0)}>
        spread out → smaller
      </SubLabel>
      <SubLabel x={700} y={SLOT_N.y} anchor="middle" opacity={lblOp(LBL_CAND, LBL_CAND_OUT)}>
        candidate positions
      </SubLabel>
      <SubLabel x={LIKELY_LBL.x} y={LIKELY_LBL.y} opacity={lblOp(LBL_LIKELY)} color={C.tealDeep}>
        likely location
      </SubLabel>

      {/* the comparison card and the assumption card */}
      <div style={{position: 'absolute', inset: 0}}>
        <EchoStrip box={STRIP} measured={MEASURED} predicted={WALL.map((w) => arrivalNs(w, ex.p))} range={ECHO_RANGE} reveal={reveal} verdict={verdict} vt={vt} opacity={cardOp} />
        <AssumptionCard40 x={1200} y={150} opacity={tw(g, ASSUME, 6) * (1 - tw(g, BLOB0 + 4, 12))} />
      </div>

      {/* J3: the face inset */}
      <FaceInset cx={INSET.cx} cy={INSET.cy} r={INSET.r} open={insetOpen} frame={g} pose={face.pose} lean={face.lean} tail={{x: sH.x, y: sH.y, r: tokH.r * cam.zoom}} />

      {/* the checker's pointer taps the crossing on "one place" */}
      <Pointer pose={ptr} />
      <TapRing x={sH.x} y={sH.y} t={tw(g, TAP, 12, E.linear)} r={46} color={C.tealDeep} />

      {/* the guard-rail chip, held through V5.7 */}
      <Chip40 x={CHIP_POS.x} y={CHIP_POS.y} anchor="end" opacity={lblOp(CHIP_IN, CHIP_OUT)}>
        simplified picture · sends and listens at one spot
      </Chip40>
    </AbsoluteFill>
  );
};

/** S4's assumption card at 40 px (the shot plan's size for "assumption: one small object"); fades in, no pop. */
const AssumptionCard40: React.FC<{x: number; y: number; opacity: number}> = ({x, y, opacity}) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '16px 28px 18px 20px',
        background: C.cream,
        border: `${OUTLINE}px solid ${C.ink}`,
        borderRadius: 22,
        boxShadow: `8px 10px 0 ${C.shadow}`,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={54} height={54} style={{flex: 'none'}}>
        <circle cx={27} cy={27} r={23} fill={C.saffronLight} stroke={C.ink} strokeWidth={3.5} />
        <circle cx={27} cy={27} r={8} fill={C.teal} stroke={C.ink} strokeWidth={3} />
      </svg>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.ink, lineHeight: 1}}>
        <span style={{color: C.inkSoft}}>assumption:</span> one small object
      </div>
    </div>
  );
};

/** #rrggbb mix (t = 0 → a, 1 → b). */
function mixColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const u = clamp01(t);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', gain: -2, dur: (K.end - K.start) / 30, note: 'room tone under the plan, whole scene (the quietest bed)'},
  {f: FOLD_END - 2, kind: 'paper_flap', gain: -5, note: 'the room settles flat into the plan'},
  {f: FLASH_FIRE, kind: 'sensor_pulse', gain: -4, note: 'the sensor flashes: the field-of-view wedge lights the wall'},
  {f: ROUTE_SCH.start, kind: 'sensor_pulse', note: 'the confocal route: out to W1'},
  {f: Math.round(ROUTE_SCH.vertexFrames[1]), kind: 'bounce_tick', note: 'W1'},
  {f: Math.round(ROUTE_SCH.vertexFrames[2]), kind: 'bounce_tick', pitch: 3, gain: -3, note: 'him'},
  {f: Math.round(ROUTE_SCH.end), kind: 'echo_return', gain: -3, note: 'back at the sensor (listens)'},
  {f: TAPE0, kind: 'ruler_extend', gain: -3, note: 'the path meter starts paying out'},
  {f: Math.round(TAPE_TURN), kind: 'bounce_tick', pitch: 3, gain: -4, note: 'the pulse turns at his token'},
  {f: RELAX, kind: 'relief_sigh', gain: -3, dur: 0.6, note: 'J3a: not which direction (after the word)'},
  {f: SWEEP0, kind: 'arc_draw', dur: (SWEEP1 - SWEEP0) / 30, note: 'arc 1 sweep'},
  {f: SCH4.start, kind: 'sensor_pulse', pitch: 2, gain: -2, note: 'flash at W4'},
  {f: Math.round(SCH4.end), kind: 'echo_return', gain: -4, pitch: 1, note: 'listens'},
  {f: SWEEP4_0, kind: 'arc_draw', dur: (SWEEP4_1 - SWEEP4_0) / 30, pitch: 2, note: 'arc 2 sweep'},
  {f: TAP, kind: 'pencil_tap', gain: -2, note: "the checker's pointer taps the crossing: contact on the music's full stop, in the pause before \"one place\""},
  {f: UHOH, kind: 'uh_oh', gain: -6, note: 'J3b: 2 frames after his face drops (on "one"), at -6 dB: its 0.65 s ring runs under "one place." about 7-19 dB below the voice\'s core (speech band), level with the tail of "place."'},
  ...MANY_SCH.map((q, i) => ({f: q.start, kind: 'sensor_pulse' as const, gain: -6 - i, pitch: i, note: `flash at W${i + 1} (many spots)`})),
];

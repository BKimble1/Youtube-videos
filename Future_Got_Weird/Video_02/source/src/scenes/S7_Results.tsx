import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, SNAP, SOFT, camPath, drop, ring, sp, tw} from '../lib/motion';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {CAM_RAISED, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, RIG_PX, type HiddenTest, type PlanPt, assertAroundTheEnd, partitionCrossings, partitionTopH, projectWith, rigAt, viewAt, visibleSpans} from '../lib/room';
import {assertPath} from '../lib/optics';
import {GapMarker, RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {PlanCard, PlanSpot, planCardSize, type PlanView} from '../components/v02/PlanCard';
import type {ToPx} from '../components/v02/Optics';
import {
  ARMS,
  Character2,
  EXPR,
  HANDS_ON_HIPS,
  handWorld2,
  IDLE2,
  SNEAK_ARMS,
  mixPose2,
  planTrip,
  reach2,
  figuresHide,
  rigCovers,
  tripContacts,
  tripDistance,
  tripDuration,
  tripPose,
  withPose,
  type Pose2,
  type RigPlace,
} from '../components/v02/Cast2';
import {reachLocal} from '../components/Character';
import {HandheldSensor, SENSOR, sensorPoint} from '../components/v02/HandheldSensor';
import {PulseDot, mixHex} from '../components/v02/Optics';
import {CAST} from '../components/cast';
import {Chip} from '../components/Text';
import {StampMark, Tape} from '../components/Props';
import {N_POS, RasterPanel, TRACK_ASPECT, TRACK_FRAMES, TrackPlot, UFront} from '../components/v02/S7_Plots';
import {CodeCard, FilmFrames, Plaque, Plinth, ReflectiveStrip, SensorStand, TargetBoard, filmStripHeight} from '../components/v02/S7_Props';

/**
 * S7 · Real results (s36–s39), storyboard shots S6.7–S6.10.
 *  S7.1 (s36) the evidence board: the authors' released person-tracking data seen from above (x mirrored to match our
 *        room), our run of their tracker as a marker stepping through the stored frames (frame numbers, never seconds);
 *        conditions chips pop on their words.
 *  S7.2 (s37) the camera trucks along the board to the U: the 3×3-zone box steps through the 36 known positions while
 *        the front view builds; after ONE position it is an arc (held, with a callout); it ends on the U and holds.
 *  S7.3 (s38) the room (raised view): the guesser presses a reflective strip onto a target board and the returning pulse
 *        fattens, in the room and on the "seen from above" PlanCard beside it (same pulses, same schedule; the gap at
 *        the wall marked on the floor); a "files don't say" stamp lands on our clip's card; the checker shoos him out,
 *        the kit records the empty room, he sidles back.
 *  S7.4 (s39) he walks behind the partition while a film strip ticks; cut to the museum: the code on its plinth, an
 *        empty slot labelled "independent reproduction".
 * Every beat is cued from narration words (module-level K); durations shrink from the cues when gaps shrink.
 */

/* ================================================================== cues */

const SC = scene('S7');
const K = {
  start: SC.from,
  end: SC.to,
  // s36
  s36: seg('s36').from,
  our: at('s36', 'our'),
  kit: at('s36', 'kit'),
  under: at('s36', 'under'),
  sixteen: at('s36', 'sixteen'),
  held: at('s36', 'held'),
  walked: at('s36', 'walked'),
  partition: at('s36', 'partition'),
  ran: at('s36', 'ran'),
  s36end: segEnd('s36'),
  // s37
  s37: seg('s37').from,
  moved: at('s37', 'moved'),
  known: at('s37', 'known'),
  sensor37: at('s37', 'sensor'),
  rough: at('s37', 'rough'),
  U: at('s37', 'u'),
  s37end: segEnd('s37'),
  // s38
  s38: seg('s38').from,
  many: at('s38', 'many'),
  vest: at('s38', 'safety-vest'),
  reflective: at('s38', 'reflective'),
  sends: at('s38', 'sends'),
  far: at('s38', 'far'),
  ourClip: at('s38', 'our'),
  say: at('s38', 'say'),
  and: at('s38', 'and'),
  kit38: at('s38', 'kit'),
  flat: at('s38', 'flat'),
  few: at('s38', 'few'),
  first: at('s38', 'first'),
  s38end: segEnd('s38'),
  // s39
  s39: seg('s39').from,
  report: at('s39', 'report'),
  tracking: at('s39', 'tracking'),
  ordinary: at('s39', 'ordinary'),
  theCode: at('s39', 'the', 3),
  public: at('s39', 'public'),
  though: at('s39', 'though'),
  no: at('s39', 'no'),
  hardware: at('s39', 'hardware'),
  s39end: segEnd('s39'),
};

/* ---------------------------------------------------------------- S7.1 / S7.2 board beats */

const RUN_FROM = 6; // stored frames 1-6 are the tracker's start-up jumps; the run starts at frame 7 (counter stays honest)
const TRUCK0 = Math.max(K.ran + 24, K.s36end - 12);
const TRUCK1 = Math.max(TRUCK0 + 22, K.moved + 2); // a 2000 px truck: at least 22 frames, so it is a move, not a whip
const RUN0 = K.our - 2;
const RUN1 = TRUCK0 - 4;
const POS1 = TRUCK1 + 2; // the box fires at position 1
const STEP0 = Math.max(POS1 + 26, K.sensor37); // the arc is held until here
const STEP1 = Math.max(STEP0 + 48, K.U - 2); // 36th position
const ARC0 = POS1 + 9;
const ARC1 = STEP0 + 2;
const CUT_ROOM = K.s38;

/* ---------------------------------------------------------------- S7.3 / S7.4 room beats */

const TILT = RAISED_TILT;
const VS = viewAt(TILT);
const pj = (x: number, z: number, h = 0) => projectWith(VS, {x, z, h});
// The checker stands 0.2 m further left than the shared layout's operator spot: at the layout spot her right side and
// hanging right arm covered the left half of the sensor box and its readout in the pushed-in scan framing (the
// empty-room scan's whole point). Her plan depth is unchanged; the light paths start at the sensor and do not move.
const OP = {x: LAYOUT.operator.x - 0.2, z: LAYOUT.operator.z};
const OPR = rigAt(OP.x, OP.z, TILT);
const RIG_S = OPR.scale;
const SENS_K = 0.6 * RIG_S;
const S_PX = pj(PTS.S.x, PTS.S.z, PTS.S.h);
const FAR = sensorPoint('farFace', SENS_K);
const GRIP = {x: S_PX.x - FAR.x, y: S_PX.y - FAR.y};
// she presses the box's top face from above, over its right half: her mitt sits on the top face (its centre one mitt
// radius above it) and her forearm comes in level from her shoulder, so neither covers the readout on the front face
// (with the sensor at chest height, a press at the box's corner put her fist and forearm over the readout)
const MITT_R = 21; // rig units: the mitt's radius
const BUTTON = {x: GRIP.x + (SENSOR.box.x1 - 12 + SENSOR.depth.dx / 2) * SENS_K, y: GRIP.y + (SENSOR.box.y0 + SENSOR.depth.dy / 2) * SENS_K - MITT_R * RIG_S};
const LIFT = {x: BUTTON.x - 14 * RIG_S, y: BUTTON.y - 34 * RIG_S}; // where the hand hovers before and after the press
const SCREEN_C = {x: GRIP.x + (SENSOR.screen.x0 + SENSOR.screen.w / 2) * SENS_K, y: GRIP.y + (SENSOR.screen.y0 + SENSOR.screen.h / 2) * SENS_K};
const TRIPOD_HEAD = {x: GRIP.x, y: GRIP.y + 16 * SENS_K};
const TRIPOD_FEET = [pj(PTS.S.x - 0.17, PTS.S.z + 0.1), pj(PTS.S.x + 0.18, PTS.S.z + 0.07), pj(PTS.S.x + 0.03, PTS.S.z - 0.17)];

// the target board stands where the layout's hidden point H is, its centre on the light-path plane (0.95 m, the
// chibi's chest: the same plane as the sensor and the wall spot, so the drawn 3D lengths equal the plan lengths)
const LIGHT_H = LAYOUT.sensor.h;
const BD = {x: LAYOUT.hidden.x, z: LAYOUT.hidden.z};
const B_C = pj(BD.x, BD.z, LIGHT_H);
const B_F = pj(BD.x, BD.z, 0);
const B_W = 0.4 * VS.ppm;
const B_H = 0.44 * VS.ppm;
const STRIP_W = 0.33 * VS.ppm;
const STRIP_H = 0.085 * VS.ppm;
const STRIP_AT = {x: B_C.x + 2, y: B_C.y + 4}; // where the strip sits on the board

// the guesser's marks (plan metres, z = his depth): by the board, the way out (right), and the s39 walk behind the
// partition (x1 and x3 are behind its near end from this camera)
const G = {z: 1.15, x0: 3.15, out: 3.86, x1: 2.32, x2: 3.05, x3: 2.42};
const HIM0 = rigAt(G.x0, G.z, TILT); // where he stands for the whole pulse beat

// the pulse path: sensor -> wall spot W3 -> board -> W3 -> sensor, all on the light-path plane
const PW = PTS.W.W3;
const PATH3: PlanPt[] = [PTS.S, PW, {x: BD.x, z: BD.z, h: LIGHT_H}, PW, PTS.S];
assertPath(PATH3.map((p) => ({x: p.x, z: p.z})), LAYOUT);

/*
 * The light rule (STORYBOARD continuity rules; lib/room assertAroundTheEnd): every leg that passes the partition goes
 * behind its END, never across its top. Checked at module load against the partition AS DRAWN, at this shot's tilt and
 * at every zoom the room camera has while a pulse is on screen (see PULSE_ZOOMS below); a layout, tilt or framing
 * change that breaks it throws. Measured at zoom 1.25 (CAM_RAISED, CAM_S38): the W3 -> board leg goes behind the far
 * end 313 px below its top corner and comes out at the near end 53 px below it; S -> W3 stays 88 px clear in front.
 * Overlay light is hidden exactly: by the partition as drawn (hiddenByPartition, via partitionCrossings), by the
 * people (figuresHide; her at her spot, him at his mark by the board), by the board itself (the pulse comes to the
 * board from the wall side, behind it, so the leg ends at the board's outline and the hit shows as a rim flash on its
 * wall-side edge) and by the sensor box (the legs leave and return through its far face: they show from its top edge).
 */
const BOARD_PAD = 2; // half the board's 4 px ink outline
const boardHides: HiddenTest = (p) => {
  if (p.z >= BD.z) return false; // only light behind the board's plane
  const q = projectWith(VS, {x: p.x, z: p.z, h: p.h ?? LIGHT_H});
  return Math.abs(q.x - B_C.x) <= B_W / 2 + BOARD_PAD && Math.abs(q.y - B_C.y) <= B_H / 2 + BOARD_PAD;
};
const PEOPLE = [
  {z: OP.z, place: OPR},
  {z: G.z, place: HIM0},
];
// the sensor box: the pulse leaves (and comes back to) its far face, which faces the wall, so the box's own silhouette
// (front face plus the top face drawn above it) hides the legs until they clear its top edge
const SENSOR_BOX = {
  x0: GRIP.x + SENSOR.box.x0 * SENS_K - 2,
  x1: GRIP.x + (SENSOR.box.x1 + SENSOR.depth.dx) * SENS_K + 2,
  y0: GRIP.y + (SENSOR.box.y0 + SENSOR.depth.dy) * SENS_K - 2,
  y1: GRIP.y + SENSOR.box.y1 * SENS_K + 2,
};
const sensorHides: HiddenTest = (p) => {
  if (p.z >= PTS.S.z) return false;
  const q = projectWith(VS, {x: p.x, z: p.z, h: p.h ?? LIGHT_H});
  return q.x >= SENSOR_BOX.x0 && q.x <= SENSOR_BOX.x1 && q.y >= SENSOR_BOX.y0 && q.y <= SENSOR_BOX.y1;
};
const HIDE_PEOPLE = figuresHide(VS, LIGHT_H, PEOPLE);
/** Everything but the partition that hides overlay light (the partition's own spans come from partitionCrossings). */
const HIDDEN_BY_PROPS: HiddenTest = (p) => HIDE_PEOPLE(p) || boardHides(p) || sensorHides(p);
const SPEED = 0.18; // m per frame (PULSE_SPEED): visibly slowed
const segLen = (a: PlanPt, b: PlanPt) => Math.hypot(b.x - a.x, b.z - a.z);
const LEGS = PATH3.slice(0, -1).map((a, i) => segLen(a, PATH3[i + 1]));
const CUM = LEGS.reduce<number[]>((acc, l) => [...acc, acc[acc.length - 1] + l], [0]);
const PATH_LEN = CUM[CUM.length - 1];
const PATH_DUR = PATH_LEN / SPEED;
const lerpP = (a: PlanPt, b: PlanPt, u: number): PlanPt => ({x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: (a.h ?? 0) + ((b.h ?? 0) - (a.h ?? 0)) * u});
/** Visible parts of each leg: the partition AS DRAWN (partitionCrossings' spans, the same test partitionHides runs),
 *  then cut where the people, the board or the sensor box hide it. */
const LEG_SPANS = PATH3.slice(0, -1).map((a, i) => {
  const b = PATH3[i + 1];
  return partitionCrossings(a, b, VS, {zoom: CAM_RAISED.zoom}).spans.flatMap(([u0, u1]) =>
    visibleSpans(lerpP(a, b, u0), lerpP(a, b, u1), TILT, {noOccluder: true, hidden: HIDDEN_BY_PROPS, steps: 120})
      .map(([v0, v1]): [number, number] => [u0 + (u1 - u0) * v0, u0 + (u1 - u0) * v1])
      .filter(([v0, v1]) => v1 - v0 > 1e-4),
  );
});
const vertexFrame = (start: number, v: number) => start + CUM[v] / SPEED;

// pulses: two thin (bare board), then two fat (reflective strip on)
const PULSE_A1 = K.many + 2;
const PULSE_A2 = PULSE_A1 + Math.min(28, Math.max(20, K.vest - 6 - PULSE_A1 - Math.ceil(PATH_DUR)));
const STRIP_HIT = K.reflective;
const STRIP_LIFT = Math.max(PULSE_A2 + Math.ceil(PATH_DUR) - 6, Math.min(K.vest - 2, STRIP_HIT - 16));
const PULSE_B1 = Math.max(STRIP_HIT + 20, Math.round(K.far - CUM[2] / SPEED)); // the fat return leaves the board on "far"
const PULSE_B2 = PULSE_B1 + 26;
const PULSES: {start: number; fat: boolean}[] = [
  {start: PULSE_A1, fat: false},
  {start: PULSE_A2, fat: false},
  {start: PULSE_B1, fat: true},
  {start: PULSE_B2, fat: true},
];
const FAT_LABEL = Math.round(vertexFrame(PULSE_B1, 2));

// our clip's card and the stamp
const CARD_IN = K.ourClip;
const STAMP = K.say;
// the push-in to the sensor starts just before "And" and settles as the shoo lands; the card is gone before it starts
const SCANCAM0 = K.and - 12;
const CARD_OUT = Math.max(STAMP + 20, SCANCAM0 - 12);

// the shoo, the walk out, the empty-room scan, the sidle back
const pxd = (a: number, b: number) => Math.abs(b - a) * VS.ppm;
const EXIT_PLAN = planTrip(pxd(G.x0, G.out), RIG_S, 'walk');
const SIDLE_PLAN = planTrip(pxd(G.out, G.x0), RIG_S, 'tiptoe');
const WALK1_PLAN = planTrip(pxd(G.x0, G.x1), RIG_S, 'walk');
const WALK2_PLAN = planTrip(pxd(G.x1, G.x2), RIG_S, 'walk');
const WALK3_PLAN = planTrip(pxd(G.x2, G.x3), RIG_S, 'walk');
const FPS_EXIT = 8;
const FPS_TIP = 9;
const FPS_WALK = 12;
const TIP_PULSE = 0.55;
const LOOK_AT_HER = K.and + 4;
const SHOO0 = K.and + 6;
const SHOO_FLAPS = 3;
const SHOO_PERIOD = 8;
const SHOO1 = SHOO0 + SHOO_FLAPS * SHOO_PERIOD;
/** The shoo (her right arm, rig-local units, elbow up): the arm comes up straight toward him, raised (SHOO_NEAR), and
 *  flicks down-and-out to level (SHOO_FAR), three times: "out you go". (A hand raised beside the head read as a raised
 *  fist; a full-length level point put her mitt on the partition's far edge.) The whole arm stays above the sensor box
 *  (its lower edge 49+ rig units over the box top) and the mitt 24+ screen px short of the partition (asserted with the
 *  hands-on-props checks). */
const SHOO_NEAR = {x: 196, y: -396};
const SHOO_FAR = {x: 192, y: -352};
const SHOO_ELBOW = -1 as const;
/** how far her shoo arm is up (0..1) and where the flick is (0 near .. 1 far): snappy outward, easier back */
const shooUp = (g: number) => Math.min(tw(g, SHOO0 - 7, 7, E.out), 1 - tw(g, SHOO1, 10, E.inOut));
const shooOut = (g: number) => {
  if (g < SHOO0 || g >= SHOO1) return 0;
  const ph = (g - SHOO0) / SHOO_PERIOD;
  const u = ph - Math.floor(ph);
  return u < 0.35 ? E.out(u / 0.35) : 1 - E.inOut((u - 0.35) / 0.65);
};
const EXIT0 = Math.max(SHOO0 + 12, K.kit38 + 4);
const EXIT1 = EXIT0 + tripDuration(EXIT_PLAN, FPS_EXIT);
const SCAN_TAP = Math.max(EXIT1 + 10, K.few - 2);
const SCAN_END = Math.max(SCAN_TAP + 36, K.first + 2);
/*
 * Paint order of her and the sensor stand. Her right hand is ON the box only for the press (the mitt on its top face,
 * from LIFT down to BUTTON and back up): then she paints over the stand. The rest of the shot the stand paints over her
 * (its sort depth just in front of hers, as in S1/S9), so a swinging arm (the shoo, the reach in and out of the tap)
 * passes behind the box and never covers the readout (with the sensor at 0.95 m the reach-out swing used to sweep her
 * forearm across it). The order switches only while her hand hovers at LIFT, above the box and clear of it (asserted
 * with the hands-on-props checks), so nothing pops.
 */
const TAP_FRONT0 = SCAN_TAP - 4; // the hand has reached LIFT; it drops onto the button
const TAP_FRONT1 = SCAN_TAP + 9; // the hand is back at LIFT; the arm swings down
const depthAt = (x: number, z: number) => projectWith(VS, {x, z, h: 0}).depth;
const STAND_Z_OVER = PTS.S.z + (depthAt(OP.x, OP.z) - depthAt(PTS.S.x, PTS.S.z) + 0.01) / VS.toCam[1];
const standZ = (g: number) => (g >= TAP_FRONT0 && g < TAP_FRONT1 ? PTS.S.z : STAND_Z_OVER);
const SIDLE0 = SCAN_END + 6;
const SIDLE1 = SIDLE0 + tripDuration(SIDLE_PLAN, FPS_TIP);
const WALK1_0 = Math.max(SIDLE1 + 20, K.tracking - 2);
const WALK1_1 = WALK1_0 + tripDuration(WALK1_PLAN, FPS_WALK);
const WALK2_0 = WALK1_1 + 12;
const WALK2_1 = WALK2_0 + tripDuration(WALK2_PLAN, FPS_WALK);
const WALK3_0 = WALK2_1 + 12;
const WALK3_1 = WALK3_0 + tripDuration(WALK3_PLAN, FPS_WALK);
const CUT_MUSEUM = K.theCode;

/*
 * Cameras (world px, DEFAULT_VIEW room at TILT), derived from the projected subjects so a layout or rig change moves
 * them with the room; the constraints they are built from are asserted below (a throw, never a warning).
 *  - CAM_S38, the pulse beat and "our clip" (s38 first half): CAM_RAISED's zoom and height (the asserted light rule's
 *    zoom), slid right so a column of cards on the left (the "far more light" label, then the "our clip" card) clears
 *    her hair; both people head to feet, the partition's far top, W3 and the board.
 *  - CAM_SCAN, the shoo and the empty-room scan: the push-in to her and the sensor, her head to feet; the frame's right
 *    edge stops just short of where he waits outside (G.out), so the scan shows the room empty, while at his mark by
 *    the board (the shoo) he is still in frame.
 *  - CAM_S39, the walk behind the partition (s39): his whole height fits between the film strip (top) and the
 *    "reported" chip (bottom); both people in the 5 % margins; the film strip starts right of the partition's top band.
 */
const SAFE = {x0: 96, x1: 1824, y0: 54, y1: 950}; // 5 % margins; y1 = the top of the caption band (bottom 12 %)
const HAIR_R = 96; // rig units: the head and hair half-width (Cast2 rigCovers 92, plus the outline)
const ELBOW_R = 118; // rig units: the half-width with hands on hips
const herLeft = OPR.x - HAIR_R * RIG_S;
const herTop = OPR.y - RIG_PX * RIG_S;
const himRight = HIM0.x + ELBOW_R * RIG_S;
// rig units: the guesser's hair spikes, ink outline included, reach above the rig's nominal 440 (measured on the s39
// walk render: the tallest tip at 466; 456 let the tips touch the film strip's shadow)
const SPIKES = 468;
const himTop = HIM0.y - SPIKES * RIG_S;
const FAR_TOP = pj(LAYOUT.occluder.x - LAYOUT.occluder.thickness / 2, LAYOUT.occluder.z0, partitionTopH(LAYOUT.occluder.z0));
/** Screen-space cards (px): the left card column of s38, the scan inset, the s39 film strip and chip. */
const CARD = {x: 56, y: 64, w: 470, tape: 28};
const SCAN_BOX = {x: 1190, y: 610, w: 520, h: 200};
const FILM_Y = 40;
const FILM_CELL = 140;
const FILM_BOTTOM = FILM_Y + filmStripHeight(FILM_CELL) + 9; // + its drop shadow
const ORD_TOP = 822; // the "reported: person in ordinary clothes" chip
const scr = (cam: Cam, p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);

/*
 * S7.3 "seen from above" (PATH_LEGIBILITY_PLAN risk 1, the storyboard's continuity rule): in the room the wall -> board
 * leg shows only from the wall spot to the partition's far edge (it goes behind the far end, through the gap) and as a
 * short stub at the board's outline, so "where does the light go?" needs the plan. The PlanCard sits in the left card
 * column (the right of the frame is his), in from the room's first frame (before the first pulse reaches the wall) and
 * out before "our clip" takes the column; it runs the same four round trips on the same schedule (SPEED, PULSES), thin
 * then fat, the wall spot, the board with the strip, both people and the sensor. The gap at the wall is marked on the
 * room's floor (GapMarker) for the same window. The "far more light" label moves below the card.
 */
const PLAN_POS = {x: CARD.x, y: CARD.y};
const PLAN_SIZE = planCardSize();
/** both people (her token at 1.03 m, his at 3.15 m, 0.5 m wide), the wall, the 0.65 m gap (109 px), the board */
const PLAN_VIEW_S7: PlanView = {cx: 2.09, zTop: -0.14, ppm: 168};
const PLAN_IN = CUT_ROOM; // present from the room's first frame
const PLAN_OUT_DUR = 8;
const LAST_ARRIVAL = Math.ceil(PULSES[PULSES.length - 1].start + PATH_DUR);
const PLAN_OUT = Math.min(LAST_ARRIVAL + 6, CARD_IN - PLAN_OUT_DUR - 2);
const FAT_LABEL_Y = PLAN_POS.y + PLAN_SIZE.h + 28;
const FAT_LABEL_H = 236; // the label card's height (padding, strip icon, three 40 px lines, outline)
const SLOWED_Y = 868; // the "slowed down" chip (bottom left)
{
  const bad: string[] = [];
  if (!(PLAN_IN <= PULSE_A1)) bad.push(`the card comes in (${PLAN_IN}) after the first pulse leaves (${PULSE_A1})`);
  if (!(PLAN_OUT >= Math.ceil(vertexFrame(PULSES[2].start, 4)))) bad.push(`the card leaves (${PLAN_OUT}) before the first fat return is back at the sensor`);
  if (!(PLAN_OUT + PLAN_OUT_DUR <= CARD_IN)) bad.push(`the card is still out (${PLAN_OUT + PLAN_OUT_DUR}) when "our clip" comes into its column (${CARD_IN})`);
  if (!(FAT_LABEL_Y + FAT_LABEL_H + 12 <= SLOWED_Y)) bad.push('the "far more light" label reaches the "slowed down" chip');
  if (bad.length) throw new Error(`S7 plan card: ${bad.join('; ')}`);
}

const CAM_S38: Cam = {cx: herLeft - (CARD.x + CARD.w + CARD.tape + 40 - 960) / CAM_RAISED.zoom, cy: CAM_RAISED.cy, zoom: CAM_RAISED.zoom};
const SCAN_ZOOM = 1.6;
const CAM_SCAN: Cam = {
  cx: rigAt(G.out, G.z, TILT).x - ELBOW_R * RIG_S - 960 / SCAN_ZOOM - 4,
  cy: herTop - (SAFE.y0 + 30 - 540) / SCAN_ZOOM,
  zoom: SCAN_ZOOM,
};
const S39_GAP = 12; // screen px between his hair and the film strip (incl. its shadow), and between his soles and the chip
const S39_ZOOM = Math.min(1.12, (ORD_TOP - S39_GAP - (FILM_BOTTOM + S39_GAP)) / (HIM0.y + 8 - himTop));
const CAM_S39: Cam = {cx: (herLeft + himRight) / 2, cy: himTop - (FILM_BOTTOM + S39_GAP - 540) / S39_ZOOM, zoom: S39_ZOOM};
/** The film strip starts right of every part of the partition's top that reaches up level with it at CAM_S39. */
const FILM_X = (() => {
  let x = 780;
  for (let k = 0; k <= 60; k++) {
    const z = LAYOUT.occluder.z0 + ((LAYOUT.occluder.z1 - LAYOUT.occluder.z0) * k) / 60;
    const q = scr(CAM_S39, pj(LAYOUT.occluder.x + LAYOUT.occluder.thickness / 2, z, partitionTopH(z)));
    if (q.y < FILM_BOTTOM + S39_GAP) x = Math.max(x, q.x + 22);
  }
  return Math.round(x);
})();
const FILM_W = 1840 - FILM_X;
/** The "flat wall" tag: on the bare relay wall between her hair and the partition's far edge (where the sensor
 *  looks), at screen y 160 in the scan framing (it pops after the push-in has settled). */
const FLAT_TAG = {x: (OPR.x + HAIR_R * RIG_S + FAR_TOP.x) / 2, y: CAM_SCAN.cy + (160 - 540) / CAM_SCAN.zoom};
const FLAT_TAG_HALF = {w: 105, h: 31}; // the chip's half-size at 36 px (screen px)

{
  const bad: string[] = [];
  const need = (ok: boolean, what: string) => ok || bad.push(what);
  // s38: the card column clears her hair; both people and the partition's far top inside the margins
  need(scr(CAM_S38, {x: himRight, y: 0}).x <= SAFE.x1, 'CAM_S38: his elbow beyond the right margin');
  need(scr(CAM_S38, FAR_TOP).y >= SAFE.y0, "CAM_S38: the partition's far top above the top margin");
  need(scr(CAM_S38, {x: herLeft, y: 0}).x >= CARD.x + CARD.w + CARD.tape + 24, 'CAM_S38: the card column reaches her hair');
  // the PlanCard (480 px, its tape pokes ~26 px past its right edge) clears her hair by 20 px
  need(scr(CAM_S38, {x: herLeft, y: 0}).x >= PLAN_POS.x + PLAN_SIZE.w + 26 + 20, 'CAM_S38: the "seen from above" card reaches her hair');
  // scan: her head to feet inside; he is in frame at his mark (the shoo) and fully out of it at G.out (the empty room)
  need(scr(CAM_SCAN, {x: 0, y: OPR.y + 10}).y <= SAFE.y1, "CAM_SCAN: her feet in the caption band");
  need(scr(CAM_SCAN, {x: herLeft, y: herTop}).x >= SAFE.x0, 'CAM_SCAN: her hair beyond the left margin');
  need(scr(CAM_SCAN, {x: HIM0.x, y: 0}).x <= 1920 - 60, 'CAM_SCAN: he is not in frame at his mark for the shoo');
  need(scr(CAM_SCAN, {x: rigAt(G.out, G.z, TILT).x - ELBOW_R * RIG_S, y: 0}).x >= 1920, 'CAM_SCAN: he is still in frame at G.out');
  const ro = scr(CAM_SCAN, SCREEN_C);
  need(ro.x + 40 < SCAN_BOX.x || ro.y + 40 < SCAN_BOX.y, 'CAM_SCAN: the scan inset covers the readout');
  // the "flat wall" tag: on bare wall, 12+ px clear of her hair and of the partition's far edge
  const tag = scr(CAM_SCAN, FLAT_TAG);
  const toWorld = (sx: number, sy: number) => ({x: CAM_SCAN.cx + (sx - 960) / SCAN_ZOOM, y: CAM_SCAN.cy + (sy - 540) / SCAN_ZOOM});
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0]])
    need(!rigCovers(OPR, toWorld(tag.x + dx * FLAT_TAG_HALF.w, tag.y + dy * FLAT_TAG_HALF.h), 12 / SCAN_ZOOM), 'CAM_SCAN: the "flat wall" tag touches her hair');
  need(tag.x + FLAT_TAG_HALF.w + 12 <= scr(CAM_SCAN, FAR_TOP).x, 'CAM_SCAN: the "flat wall" tag touches the partition');
  need(tag.y - FLAT_TAG_HALF.h >= SAFE.y0, 'CAM_SCAN: the "flat wall" tag above the top margin');
  // s39: his whole height between the film strip and the chip at every mark; both people inside the margins
  for (const x of [G.x0, G.x1, G.x2, G.x3]) {
    const r = rigAt(x, G.z, TILT);
    const top = scr(CAM_S39, {x: r.x, y: r.y - SPIKES * r.scale});
    const feet = scr(CAM_S39, {x: r.x, y: r.y + 8});
    need(top.y >= FILM_BOTTOM + 6 || top.x + HAIR_R * r.scale * S39_ZOOM < FILM_X, `CAM_S39: his hair under the film strip at x ${x}`);
    need(feet.y <= ORD_TOP - 8, `CAM_S39: his feet under the chip at x ${x}`);
  }
  need(scr(CAM_S39, {x: herLeft, y: herTop}).x >= SAFE.x0 && scr(CAM_S39, {x: herLeft, y: herTop}).y >= SAFE.y0, 'CAM_S39: her hair outside the margins');
  need(scr(CAM_S39, {x: herLeft + 2 * HAIR_R * RIG_S, y: herTop}).x < FILM_X || scr(CAM_S39, {x: 0, y: herTop}).y >= FILM_BOTTOM + 8, 'CAM_S39: her hair under the film strip');
  need(scr(CAM_S39, {x: himRight, y: 0}).x <= SAFE.x1, 'CAM_S39: his elbow beyond the right margin');
  need(FILM_W >= 4 * (FILM_CELL + 14), 'CAM_S39: the film strip is narrower than four frames');
  if (bad.length) throw new Error(`S7 framing: ${bad.join('; ')}`);
}
const SCANCAM_DUR = Math.min(26, Math.max(16, SHOO0 + 6 - SCANCAM0));
const S39CAM0 = Math.max(SIDLE1 + 4, K.s39 + 2);
const S39CAM_DUR = Math.min(30, Math.max(22, K.report - 2 - S39CAM0));
const roomCam = (g: number) =>
  camPath(g, CAM_S38, [
    {at: SCANCAM0, dur: SCANCAM_DUR, to: CAM_SCAN},
    {at: S39CAM0, dur: S39CAM_DUR, to: CAM_S39},
  ]);

// The light rule at module load (a throw, never a warning), at the zooms the room camera has while any pulse is on
// screen: CAM_S38 (CAM_RAISED's zoom) for the whole beat on the current timings; if the cue gaps shrink and the push-in starts while a
// pulse is still out, its zooms are covered too (the margins scale with the zoom, so the extremes bound the range).
const PULSE_END = Math.ceil(PULSES[PULSES.length - 1].start + PATH_DUR + 16);
const PULSE_ZOOMS = Array.from({length: PULSE_END - PULSE_A1 + 1}, (_, i) => roomCam(PULSE_A1 + i).zoom);
for (const zoom of [Math.min(...PULSE_ZOOMS), Math.max(...PULSE_ZOOMS)]) assertAroundTheEnd('S7 W3 round trip', [PATH3], VS, {zoom});

// film strip
const STRIP_DROP = Math.max(K.report, S39CAM0 + S39CAM_DUR - 4); // drops in once the pull-back has (nearly) settled
const TICK0 = STRIP_DROP + 12;
const TICK = 5;
const FILM_START = 5; // frames already on the strip when it drops in

// museum
const PLAQUE_A = K.public;
const MUSEUM_PUSH0 = Math.max(K.though - 2, PLAQUE_A + 10);
const MUSEUM_PUSH_DUR = Math.min(28, Math.max(14, K.no - 2 - MUSEUM_PUSH0));
const PLAQUE_B = Math.max(K.no, MUSEUM_PUSH0 + MUSEUM_PUSH_DUR + 2);
const FINAL_CHIP = Math.max(PLAQUE_B + 24, K.hardware);

/* ================================================================== small helpers */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** pop-in style for a label that then stays put (scale about its left edge) */
const popStyle = (g: number, t0: number, origin = 'left center'): React.CSSProperties => {
  const t = tw(g, t0, 12, E.linear);
  return {opacity: tw(g, t0, 5), transform: `scale(${0.72 + 0.28 * E.back(t)})`, transformOrigin: origin, visibility: g < t0 ? 'hidden' : undefined};
};
const fadeWin = (g: number, a: number, b: number, dIn = 8, dOut = 8) => Math.min(tw(g, a, dIn), 1 - tw(g, b - dOut, dOut));

const Headline: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', fontFamily: F.display, fontWeight: 600, fontSize: 58, color: C.ink, lineHeight: 1.05, letterSpacing: '-0.005em', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

const Card: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; tape?: boolean}> = ({style, children, tape = true}) => (
  <div style={{position: 'absolute', background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, boxShadow: `10px 12px 0 ${C.shadow}`, ...style}}>
    {children}
    {tape && (
      <>
        <Tape style={{left: -28, top: -14}} rotate={-8} />
        <Tape style={{right: -28, top: -14}} rotate={7} />
      </>
    )}
  </div>
);

const Pill: React.FC<{g: number; t0: number; tone?: 'teal' | 'ink' | 'saffron' | 'coral' | 'paper'; size?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({g, t0, tone = 'teal', size = 36, children, style}) => (
  <div style={{position: 'absolute', ...popStyle(g, t0), ...style}}>
    <Chip tone={tone} size={size}>
      {children}
    </Chip>
  </div>
);

/** A block of guard-rail text (source, provenance): cream card, ink outline. */
const InfoBlock: React.FC<{lines: React.ReactNode[]; size?: number; style?: React.CSSProperties; width?: number}> = ({lines, size = 32, style, width}) => (
  <div style={{position: 'absolute', width, padding: '14px 22px', background: C.cream, border: `3px solid ${C.inkMuted}`, borderRadius: 14, fontFamily: F.body, fontWeight: 800, fontSize: size, color: C.inkSoft, lineHeight: 1.25, ...style}}>
    {lines.map((l, i) => (
      <div key={i}>{l}</div>
    ))}
  </div>
);

/* ================================================================== S7.1 + S7.2: the evidence board */

const BOARD_B_X = 2000;
const PLOT_W = 740;
const PLOT_H = PLOT_W * TRACK_ASPECT;

const runIdx = (g: number) => RUN_FROM + (TRACK_FRAMES - 1 - RUN_FROM) * clamp01((g - RUN0) / Math.max(1, RUN1 - RUN0));

const BoardA: React.FC<{g: number}> = ({g}) => {
  const idx = runIdx(g);
  const frameNo = Math.floor(idx) + 1;
  const marker = tw(g, RUN0 - 4, 6);
  const wallPulse = tw(g, K.sixteen, 26, E.linear);
  const partPulse = Math.min(tw(g, K.walked, 8), 1 - tw(g, K.ran - 6, 10));
  const card = {x: 96, y: 136, pad: 24};
  return (
    <AbsoluteFill>
      <Headline style={{left: 100, top: 42}}>Real measurements · authors' released data</Headline>
      <Card style={{left: card.x, top: card.y, padding: card.pad, width: PLOT_W + card.pad * 2, boxSizing: 'border-box'}}>
        <TrackPlot width={PLOT_W} idx={idx} fromIdx={RUN_FROM} trail={70} wallPulse={wallPulse} partitionPulse={partPulse} marker={marker} stackTag={tw(g, K.sixteen + 6, 16, E.linear)} />
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>
            <svg width={36} height={36}>
              <circle cx={18} cy={18} r={14} fill={C.saffron} stroke={C.ink} strokeWidth={4} />
            </svg>
            estimated position
          </div>
          <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 34, color: C.inkSoft, opacity: marker}}>
            frame {String(frameNo).padStart(3, ' ')} / {TRACK_FRAMES}
          </div>
        </div>
      </Card>
      {/* right column: conditions in spoken order, then the source */}
      <Pill g={g} t0={K.kit} tone="teal" style={{left: 960, top: 172}}>
        evaluation-kit sensor
      </Pill>
      <Pill g={g} t0={K.under} tone="saffron" style={{left: 960, top: 262}}>
        kit: under US$100 (authors)
      </Pill>
      <Pill g={g} t0={K.sixteen} tone="teal" style={{left: 960, top: 352}}>
        16 listening spots
      </Pill>
      <Pill g={g} t0={K.held} tone="teal" style={{left: 960, top: 442}}>
        held still
      </Pill>
      <Pill g={g} t0={K.ran} tone="ink" style={{left: 960, top: 532}}>
        processed with the authors' code
      </Pill>
      <InfoBlock style={{left: 960, top: 650}} lines={["Somasundaram et al., Nature 2026", 'plot mirrored to match our room']} />
      <div style={{position: 'absolute', left: 964, top: 790, width: 840, fontFamily: F.body, fontWeight: 700, fontSize: 30, color: C.inkMuted, lineHeight: 1.25}}>
        wall spots: measured · sensor and partition: from the authors' plot
      </div>
    </AbsoluteFill>
  );
};

/** Position along the raster (1..36, float), positions done, and the front view's k at frame g. */
const rasterAt = (g: number) => {
  if (g < POS1) return {pos: 1, done: 0, k: 0, fire: 0};
  if (g < STEP0) return {pos: 1, done: 1, k: g >= POS1 + 3 ? 1 : 0, fire: 1 - tw(g, POS1, 9, E.linear)};
  const u = clamp01((g - STEP0) / Math.max(1, STEP1 - STEP0));
  const pos = 1 + (N_POS - 1) * E.inOut(u);
  const done = Math.floor(pos + 1e-6);
  const frac = pos - done;
  return {pos, done, k: done, fire: done < N_POS ? 0.75 * clamp01(1 - frac * 3) : 1 - tw(g, STEP1, 10, E.linear)};
};

const UCELL = 14;
const ARC_W = 512; // the arc callout's width: it ends 20+ px short of the front view
const BoardB: React.FC<{g: number}> = ({g}) => {
  const r = rasterAt(g);
  const imgT = r.k === 1 && g < POS1 + 9 ? tw(g, POS1 + 3, 6) : 1;
  const arc = fadeWin(g, ARC0, ARC1 + 8, 8, 10);
  const card = {x: 96, y: 136, w: 1150, h: 760};
  // the 40×40 front view (560 px) sits inside the card with a 24 px margin on the right (it used to overrun the edge)
  const img = {x: card.x + card.w - 40 * UCELL - 24, y: card.y + 96};
  const ras = {x: card.x + 34, y: card.y + 110, w: 470};
  // the arc callout points at the arc of the one-position view (cells ~ (8, 22) from the image's top-left)
  const tip = {x: img.x + 7 * UCELL, y: img.y + 23 * UCELL};
  return (
    <AbsoluteFill>
      <Headline style={{left: 100, top: 42}}>Real measurements · authors' released data</Headline>
      <Card style={{left: card.x, top: card.y, width: card.w, height: card.h}} />
      <div style={{position: 'absolute', left: ras.x, top: card.y + 34, fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>known sensor positions</div>
      <div style={{position: 'absolute', left: ras.x, top: ras.y}}>
        <RasterPanel width={ras.w} pos={r.pos} done={r.done} firing={r.fire} boxSize={66} t={1} />
      </div>
      <div style={{position: 'absolute', left: ras.x, top: ras.y + 300, fontFamily: F.mono, fontWeight: 500, fontSize: 34, color: C.inkSoft}}>
        positions: {String(r.done).padStart(2, ' ')} / {N_POS}
      </div>
      <div style={{position: 'absolute', left: img.x, top: card.y + 34, fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>front view, rebuilt</div>
      <div style={{position: 'absolute', left: img.x, top: img.y}}>
        <UFront cell={UCELL} k={r.k} t={imgT} />
      </div>
      {/* one position: an arc */}
      {arc > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, opacity: arc}}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <path d={`M ${ras.x - 8 + ARC_W} ${card.y + 560} Q ${tip.x - 60} ${card.y + 560} ${tip.x - 8} ${tip.y + 10}`} fill="none" stroke={C.coralDeep} strokeWidth={5} strokeLinecap="round" />
            <circle cx={tip.x} cy={tip.y} r={9} fill={C.coral} stroke={C.ink} strokeWidth={3} />
          </svg>
          <div style={{position: 'absolute', left: ras.x - 8, top: card.y + 516, width: ARC_W, padding: '12px 18px', boxSizing: 'border-box', background: C.coralLight, border: `${OUTLINE}px solid ${C.coralDeep}`, borderRadius: 14, ...popStyle(g, ARC0)}}>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.ink, lineHeight: 1.15}}>one position: an arc</div>
            <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 34, color: C.inkSoft, lineHeight: 1.2, marginTop: 4}}>(like our simplified picture)</div>
          </div>
        </div>
      )}
      {g >= K.rough && (
        <div style={{position: 'absolute', left: img.x + 20 * UCELL, top: img.y + 40 * UCELL + 14, transform: 'translateX(-50%)'}}>
          <div style={{...popStyle(g, K.rough, 'center top'), display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <svg width={30} height={16} style={{display: 'block', marginBottom: -3}}>
              <path d="M 2 16 L 15 2 L 28 16 Z" fill={C.teal} stroke={C.tealDeep} strokeWidth={3} strokeLinejoin="round" />
            </svg>
            <Chip tone="teal" size={36}>
              rough outline
            </Chip>
          </div>
        </div>
      )}
      {/* right column */}
      <Pill g={g} t0={K.known} tone="teal" style={{left: 1300, top: 172}}>
        same 3×3 sensor
      </Pill>
      <Pill g={g} t0={K.known + 6} tone="teal" style={{left: 1300, top: 262}}>
        36 known positions
      </Pill>
      <Pill g={g} t0={K.known + 12} tone="teal" style={{left: 1300, top: 352}}>
        object held still
      </Pill>
      <InfoBlock style={{left: 1300, top: 650}} size={30} lines={['Somasundaram et al., Nature 2026', "authors' code, run by us", 'on their data']} />
    </AbsoluteFill>
  );
};

const Boards: React.FC<{g: number}> = ({g}) => {
  const cam = camPath(g, {cx: 960, cy: 540, zoom: 1}, [{at: TRUCK0, dur: TRUCK1 - TRUCK0, to: {cx: 960 + BOARD_B_X, cy: 540, zoom: 1}, ease: E.inOut}]);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          {g <= TRUCK1 && <BoardA g={g} />}
          {g >= TRUCK0 && (
            <div style={{position: 'absolute', left: BOARD_B_X, top: 0, width: 1920, height: 1080}}>
              <BoardB g={g} />
            </div>
          )}
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};

/* ================================================================== S7.3 + S7.4: the room */

const pxOf = (p: PlanPt) => projectWith(VS, p);

/** One pulse along PATH3 (overlay, partition-hidden stretches removed); `fat` = the reflective strip is on. */
const Pulse: React.FC<{g: number; start: number; fat: boolean}> = ({g, start, fat}) => {
  const head = (g - start) * SPEED;
  const fade = 1 - tw(g, start + PATH_DUR + 4, 12);
  if (head <= 0 || fade <= 0) return null;
  const I = fat ? [1, 0.62, 0.95, 0.8] : [1, 0.62, 0.3, 0.18];
  const widthOf = (i: number) => (fat && i >= 2 ? 9 - (i - 2) * 1.5 : 7 * (0.35 + 0.65 * I[i]));
  const radOf = (i: number) => (fat && i >= 2 ? 19 - (i - 2) * 2 : 13 * (0.4 + 0.6 * I[i]));
  const colOf = (i: number) => mixHex(C.saffronDeep, C.paper, (1 - I[i]) * 0.65);
  const lane = 8;
  const legs = LEGS.map((len, i) => {
    const a = PATH3[i];
    const b = PATH3[i + 1];
    const pa = pxOf(a);
    const pb = pxOf(b);
    const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
    const n = {x: (-(pb.y - pa.y) / L) * (lane / 2), y: ((pb.x - pa.x) / L) * (lane / 2)};
    const at = (u: number) => ({x: pa.x + (pb.x - pa.x) * u + n.x, y: pa.y + (pb.y - pa.y) * u + n.y});
    return {a, b, at, len, s0: CUM[i], spans: LEG_SPANS[i]};
  });
  const trail: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  const rings: React.ReactNode[] = [];
  legs.forEach((l, i) => {
    const u = clamp01((head - l.s0) / l.len);
    if (u <= 0) return;
    l.spans.forEach(([u0, u1], k) => {
      const e = Math.min(u1, u);
      if (e <= u0) return;
      const p0 = l.at(u0);
      const p1 = l.at(e);
      trail.push(<line key={`t${i}.${k}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={colOf(i)} strokeWidth={widthOf(i)} strokeLinecap="round" />);
    });
  });
  // bounce rings at W3 (twice) and the board
  [1, 2, 3].forEach((v) => {
    const age = head - CUM[v];
    const life = 0.5;
    if (age <= 0 || age >= life) return;
    const q = age / life;
    const p = pxOf(PATH3[v]);
    const big = fat && v === 2;
    rings.push(<circle key={`r${v}`} cx={p.x} cy={p.y} r={10 + (big ? 58 : 38) * E.out(q)} fill="none" stroke={colOf(Math.min(3, v))} strokeWidth={(big ? 7 : 4.5) * (1 - q * 0.6)} opacity={(1 - q) * 0.9} />);
  });
  if (head < PATH_LEN) {
    const train = fat ? 3 : 1;
    for (let k = train - 1; k >= 0; k--) {
      const d = head - k * 0.13;
      if (d <= 0) continue;
      const i = Math.max(0, CUM.findIndex((c, j) => j > 0 && d <= c) - 1);
      const l = legs[i];
      const u = clamp01((d - l.s0) / l.len);
      const visible = l.spans.some(([u0, u1]) => u >= u0 && u <= u1);
      if (!visible) continue;
      const p = l.at(u);
      const r = radOf(i) * (k === 0 ? 1 : 0.7 - k * 0.12);
      if (k === 0) dots.push(<PulseDot key="p0" x={p.x} y={p.y} r={r} intensity={I[i]} />);
      else dots.push(<circle key={`p${k}`} cx={p.x} cy={p.y} r={r} fill={colOf(i)} stroke={C.ink} strokeWidth={2.5} opacity={0.85 - k * 0.2} />);
    }
  }
  return (
    <g opacity={fade}>
      {trail}
      {rings}
      {dots}
    </g>
  );
};

/** The lit spot on the relay wall at W3 (real light, so saffron), in the backdrop so the people and the partition paint
 *  over it: faint while the pulses run (where the sensor aims), brighter as each pulse bounces there. On the wall plane:
 *  0.24 m wide, 0.16 m tall, as in S1. */
const W3_PX = pxOf(PW);
const WALL_SPOT = {rx: 0.12 * VS.ppm, ry: 0.08 * VS.ppm * VS.height};
const WallSpot: React.FC<{g: number}> = ({g}) => {
  const base = 0.45 * fadeWin(g, Math.floor(vertexFrame(PULSE_A1, 1)) - 2, PULSE_END, 6, 10);
  const flash = PULSES.reduce((m, p) => Math.max(m, ...[1, 3].map((v) => tw(g, vertexFrame(p.start, v) - 1, 2) * (1 - tw(g, vertexFrame(p.start, v) + 3, 8)))), 0);
  const o = Math.max(base, flash);
  if (o <= 0.01) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={W3_PX.x} cy={W3_PX.y} rx={WALL_SPOT.rx} ry={WALL_SPOT.ry} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="7 6" opacity={o} />
    </svg>
  );
};

/* ---------------------------------------------------------------- S7.3 "seen from above" (card content) */

/** One pulse along PATH3 in the plan card: the room Pulse's schedule (head = (g - start) * SPEED metres of plan path)
 *  and intensities, at card sizes (paths 6 px, pulses r 11, as PlanCard asks), nothing hidden (seen from above); the
 *  fat return (strip on) is drawn markedly wider so thin vs fat reads at phone size. */
const PlanPulse: React.FC<{g: number; start: number; fat: boolean; toPx: ToPx}> = ({g, start, fat, toPx}) => {
  const head = (g - start) * SPEED;
  const fade = 1 - tw(g, start + PATH_DUR + 4, 12);
  if (head <= 0 || fade <= 0) return null;
  const I = fat ? [1, 0.62, 0.95, 0.8] : [1, 0.62, 0.3, 0.18];
  const widthOf = (i: number) => (fat && i >= 2 ? 10 - (i - 2) * 1.5 : 6 * (0.35 + 0.65 * I[i]));
  const radOf = (i: number) => (fat && i >= 2 ? 15 - (i - 2) * 2 : 11 * (0.4 + 0.6 * I[i]));
  const colOf = (i: number) => mixHex(C.saffronDeep, C.paper, (1 - I[i]) * 0.65);
  const lane = 7;
  const legs = LEGS.map((len, i) => {
    const pa = toPx(PATH3[i]);
    const pb = toPx(PATH3[i + 1]);
    const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
    const n = {x: (-(pb.y - pa.y) / L) * (lane / 2), y: ((pb.x - pa.x) / L) * (lane / 2)};
    return {at: (u: number) => ({x: pa.x + (pb.x - pa.x) * u + n.x, y: pa.y + (pb.y - pa.y) * u + n.y}), len, s0: CUM[i]};
  });
  const parts: React.ReactNode[] = [];
  legs.forEach((l, i) => {
    const u = clamp01((head - l.s0) / l.len);
    if (u <= 0) return;
    const p0 = l.at(0);
    const p1 = l.at(u);
    parts.push(<line key={`t${i}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={colOf(i)} strokeWidth={widthOf(i)} strokeLinecap="round" />);
  });
  [1, 2, 3].forEach((v) => {
    const age = head - CUM[v];
    if (age <= 0 || age >= 0.5) return;
    const q = age / 0.5;
    const p = toPx(PATH3[v]);
    const big = fat && v === 2;
    parts.push(<circle key={`r${v}`} cx={p.x} cy={p.y} r={8 + (big ? 40 : 26) * E.out(q)} fill="none" stroke={colOf(Math.min(3, v))} strokeWidth={(big ? 6 : 4) * (1 - q * 0.6)} opacity={(1 - q) * 0.9} />);
  });
  if (head < PATH_LEN) {
    const train = fat ? 3 : 1;
    for (let k = train - 1; k >= 0; k--) {
      const d = head - k * 0.13;
      if (d <= 0) continue;
      const i = Math.max(0, CUM.findIndex((c, j) => j > 0 && d <= c) - 1);
      const l = legs[i];
      const p = l.at(clamp01((d - l.s0) / l.len));
      const r = radOf(i) * (k === 0 ? 1 : 0.7 - k * 0.12);
      if (k === 0) parts.push(<PulseDot key="p0" x={p.x} y={p.y} r={r} intensity={I[i]} />);
      else parts.push(<circle key={`p${k}`} cx={p.x} cy={p.y} r={r} fill={colOf(i)} stroke={C.ink} strokeWidth={2.5} opacity={0.85 - k * 0.2} />);
    }
  }
  return <g opacity={fade}>{parts}</g>;
};

/** The target board seen from above (0.40 m wide, a thin bar at H), with the reflective strip once it is on. */
const PlanBoard: React.FC<{toPx: ToPx; ppm: number; strip: number}> = ({toPx, ppm, strip}) => {
  const c = toPx(BD);
  const w = 0.4 * ppm;
  const sw = 0.33 * ppm;
  return (
    <g>
      <rect x={c.x - w / 2} y={c.y - 7} width={w} height={14} rx={5} fill={C.blueLight} stroke={C.ink} strokeWidth={3.5} />
      {strip > 0 && (
        <g opacity={clamp01(strip)}>
          <rect x={c.x - sw / 2} y={c.y - 4} width={sw} height={8} rx={3} fill={C.saffron} stroke={C.ink} strokeWidth={2} />
          <line x1={c.x - sw / 2 + 4} y1={c.y} x2={c.x + sw / 2 - 4} y2={c.y} stroke="#DCE5E8" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

type GState = {x: number; pose: Pose2; holdStrip: boolean; life: number};

const standAt = (xm: number) => rigAt(xm, G.z, TILT);

const sneakFace: Partial<Pose2> = {lid: 0.25, brows: -0.4, browAsym: 0.2, mouth: 'hmm', lookX: -0.85, lookY: 0.05, tilt: -4};

/** The guesser: x (metres) and pose at frame g. */
const guesserAt = (g: number): GState => {
  const s = RIG_S;
  // P0..P2: at x0, the strip in his left hand, pressing it onto the board
  if (g < EXIT0) {
    const ch0 = standAt(G.x0);
    const place: RigPlace = {x: ch0.x, y: ch0.y, scale: s, frame: g, seed: 22, life: 0.35};
    const after = tw(g, STRIP_HIT + 6, 14, E.inOut);
    const impressed = Math.min(sp(g, FAT_LABEL - 2, SOFT), 1 - tw(g, LOOK_AT_HER - 4, 8));
    const caught = sp(g, LOOK_AT_HER, SNAP);
    const sulk = tw(g, EXIT0 - 10, 8, E.inOut);
    let face: Partial<Pose2> = {mouth: 'smile', lookX: -0.75, lookY: 0.15, lid: 0.15, brows: 0};
    if (after > 0) face = {...EXPR.smug, lookX: -0.6, lookY: 0.15};
    let pose: Pose2 = withPose({...IDLE2, armR: ARMS.handsOnHips.armR, armsFront: 'L'}, face);
    if (impressed > 0) pose = withPose(pose, {brows: 0.7, eyes: 1.1, lid: 0, mouth: g < FAT_LABEL + 14 ? 'o' : 'grin', lookX: -0.7, lookY: -0.35, tilt: -2}, Math.min(1, impressed));
    if (caught > 0) pose = withPose(pose, {brows: 0.85, eyes: 1.15, lid: 0, mouth: 'o', lookX: -1, lookY: 0.1, tilt: 3}, Math.min(1, caught));
    if (sulk > 0) pose = withPose(pose, {brows: -0.35, browAsym: 0.3, lid: 0.3, mouth: 'hmm', eyes: 1, lookX: -0.6, tilt: -3}, sulk);
    // the left hand: chest -> wind-up above the board -> press -> back to the hip
    const rest = {x: ch0.x - 54 * s, y: ch0.y - 214 * s};
    const contact = {x: STRIP_AT.x + 30 * s, y: STRIP_AT.y - 2 * s};
    const wind = {x: contact.x + 34, y: contact.y - 44};
    const t1 = tw(g, STRIP_LIFT, Math.max(6, STRIP_HIT - 6 - STRIP_LIFT), E.inOut);
    const t2 = tw(g, STRIP_HIT - 6, 6, E.in);
    const hx = g < STRIP_HIT - 6 ? rest.x + (wind.x - rest.x) * t1 : wind.x + (contact.x - wind.x) * t2;
    const hy = g < STRIP_HIT - 6 ? rest.y + (wind.y - rest.y) * t1 : wind.y + (contact.y - wind.y) * t2;
    const lean = -4 * Math.min(tw(g, STRIP_LIFT, 10), 1 - after);
    pose = {...pose, lean};
    const armL = reach2(place, pose, -1, hx, hy, 1);
    if (after <= 0) pose = {...pose, armL};
    else pose = mixPose2({...pose, armL}, {...pose, armL: ARMS.handsOnHips.armL, armsFront: 'none'}, after);
    // before the walk: hands come off the hips
    const pre = tw(g, EXIT0 - 8, 8, E.inOut);
    if (pre > 0) pose = mixPose2(pose, {...pose, armL: IDLE2.armL, armR: IDLE2.armR, armsFront: 'none'}, pre);
    return {x: G.x0, pose, holdStrip: g < STRIP_HIT, life: 0.35};
  }
  // P3: walks out to the right (sulky)
  if (g < SIDLE0) {
    const d = tripDistance(g, EXIT0, EXIT_PLAN, FPS_EXIT);
    const pose = tripPose(d, EXIT_PLAN, {dir: 1, base: {...IDLE2, brows: -0.35, browAsym: 0.3, lid: 0.3, mouth: 'hmm', lookX: 0.6, tilt: -2}});
    return {x: G.x0 + d / VS.ppm, pose, holdStrip: false, life: 0.3};
  }
  // P4: sidles back in on tiptoe
  if (g < WALK1_0) {
    const d = tripDistance(g, SIDLE0, SIDLE_PLAN, FPS_TIP, TIP_PULSE);
    let pose = tripPose(d, SIDLE_PLAN, {dir: -1, base: {...SNEAK_ARMS, ...sneakFace}});
    const settle = tw(g, SIDLE1 - 3, 14, E.inOut);
    if (settle > 0) pose = mixPose2(pose, withPose(HANDS_ON_HIPS, {mouth: 'smile', lid: 0.2, lookX: 0.15, lookY: 0.05, brows: 0.1, tilt: 3}), settle);
    const pre = tw(g, WALK1_0 - 8, 8, E.inOut);
    if (pre > 0) pose = mixPose2(pose, {...pose, armL: IDLE2.armL, armR: IDLE2.armR, armsFront: 'none'}, pre);
    return {x: G.out - d / VS.ppm, pose, holdStrip: false, life: 0.3 + 0.3 * settle};
  }
  // P5: walks behind the partition (left), pauses, walks back (right)
  if (g < WALK2_0) {
    const d = tripDistance(g, WALK1_0, WALK1_PLAN, FPS_WALK);
    let pose = tripPose(d, WALK1_PLAN, {dir: -1, base: {...IDLE2, mouth: 'smile', lookX: -0.5}});
    const turn = tw(g, WALK1_1, 10, E.inOut);
    if (turn > 0) pose = mixPose2(pose, {...IDLE2, mouth: 'smile', lookX: 0.4, lookY: 0.05, feet: undefined}, turn);
    return {x: G.x0 - d / VS.ppm, pose, holdStrip: false, life: 0.4};
  }
  if (g < WALK3_0) {
    const d = tripDistance(g, WALK2_0, WALK2_PLAN, FPS_WALK);
    let pose = tripPose(d, WALK2_PLAN, {dir: 1, base: {...IDLE2, mouth: 'smile', lookX: 0.4}});
    const turn = tw(g, WALK2_1, 10, E.inOut);
    if (turn > 0) pose = mixPose2(pose, {...IDLE2, mouth: 'smile', lookX: -0.3, lookY: 0.05, feet: undefined}, turn);
    return {x: G.x1 + d / VS.ppm, pose, holdStrip: false, life: 0.4};
  }
  // a third, shorter leg back toward the partition, then he settles (only if there is time before the cut)
  const d = tripDistance(g, WALK3_0, WALK3_PLAN, FPS_WALK);
  let pose = tripPose(d, WALK3_PLAN, {dir: -1, base: {...IDLE2, mouth: 'smile', lookX: -0.4}});
  const stop = tw(g, WALK3_1, 12, E.inOut);
  if (stop > 0) pose = mixPose2(pose, withPose(HANDS_ON_HIPS, {...EXPR.smug, lookX: 0.2}), stop);
  return {x: G.x2 - d / VS.ppm, pose, holdStrip: false, life: 0.4};
};

/** The checker: pose at frame g (deadpan; shoo; taps the sensor's button). */
const checkerAt = (g: number): Pose2 => {
  const place: RigPlace = {x: OPR.x, y: OPR.y, scale: RIG_S, frame: g, seed: 9, life: 0.4};
  // where she looks: the readout, then him (shoo), the readout (scan), us; side-eye when he sidles back; him in s39
  const lookHim = Math.min(tw(g, K.and, 6, E.inOut), 1 - tw(g, SCAN_TAP - 14, 8, E.inOut));
  const lookScan = Math.min(tw(g, SCAN_TAP - 14, 8, E.inOut), 1 - tw(g, SCAN_END + 2, 8, E.inOut));
  const sideEye = tw(g, SIDLE0 + 8, 8, E.inOut);
  let look = {x: 0.5, y: 0.3};
  look = {x: look.x + (1 - look.x) * lookHim, y: look.y + (0.05 - look.y) * lookHim};
  look = {x: look.x + (0.5 - look.x) * lookScan, y: look.y + (0.4 - look.y) * lookScan};
  if (g >= SCAN_END) {
    const out = tw(g, SCAN_END + 2, 8, E.inOut);
    look = {x: 0.5 + (0 - 0.5) * out, y: 0.4 + (0 - 0.4) * out};
    look = {x: look.x + (0.95 - look.x) * sideEye, y: look.y + (0.05 - look.y) * sideEye};
  }
  const brow = sp(g, FAT_LABEL + 2, SNAP) * (1 - tw(g, FAT_LABEL + 30, 12));
  const face: Partial<Pose2> = {...EXPR.deadpan, lookX: look.x, lookY: look.y, brows: -0.05 + 0.35 * brow, browAsym: 0.45 * brow};
  // arms crossed while she watches (clear of the stand); uncrossed for the shoo and the tap, crossed again after
  const open = Math.min(tw(g, SHOO0 - 12, 9, E.inOut), 1 - tw(g, SCAN_TAP + 14, 12, E.inOut));
  const crossed: Pose2 = withPose({...IDLE2, ...ARMS.armsCrossed, armsFront: 'both'}, face);
  let pose: Pose2 = mixPose2(crossed, withPose({...IDLE2, armsFront: 'none'}, face), open);
  pose = {...pose, armsFront: open < 0.8 ? 'both' : 'none'};
  // the shoo: the right hand comes up beside her head, then sweeps out toward him (and the way out) three times,
  // snappy outward and easier back. With the sensor on its 0.95 m stand the box sits just right of and below her
  // shoulder, so the hand works ABOVE it (SHOO_NEAR / SHOO_FAR, asserted clear of the box at module load) and the stand
  // paints over her while her arm is up (standZ), so the raise and the drop pass behind the box, never over the readout
  const up = shooUp(g);
  if (up > 0) {
    const out = shooOut(g);
    const shoo = reachLocal(SHOO_NEAR.x + (SHOO_FAR.x - SHOO_NEAR.x) * out, SHOO_NEAR.y + (SHOO_FAR.y - SHOO_NEAR.y) * out, 1, SHOO_ELBOW);
    pose = {...mixPose2(pose, {...pose, armR: shoo, lean: 1 + 1.5 * out}, up), armsFront: up > 0.15 ? 'R' : pose.armsFront};
  }
  // the tap: the right hand comes up to a point above the box (LIFT), drops onto the top face (contact at SCAN_TAP),
  // presses, lifts straight back up, then the arm swings down; the swings in and out pass behind the box (standZ), so
  // the readout is never covered (the press is seen on the box, the progress in the readout and its inset)
  const reachIn = tw(g, SCAN_TAP - 11, 7, E.inOut);
  const reachOut = tw(g, SCAN_TAP + 8, 9, E.inOut);
  const tap = Math.min(reachIn, 1 - reachOut);
  if (tap > 0) {
    const down = Math.min(tw(g, SCAN_TAP - 4, 4, E.in), 1 - tw(g, SCAN_TAP + 4, 4, E.out));
    const press = g >= SCAN_TAP && g < SCAN_TAP + 4 ? 3 : 0;
    const tx = LIFT.x + (BUTTON.x - LIFT.x) * down;
    const ty = LIFT.y + (BUTTON.y - LIFT.y) * down + press;
    const armR = reach2(place, pose, 1, tx, ty, -1);
    pose = {...mixPose2(pose, {...pose, armR}, tap), armsFront: tap > 0.3 ? 'R' : pose.armsFront};
  }
  return pose;
};

/** Sensor readout content during the scan (screen-local px 52 × 34). */
const ScanScreen: React.FC<{p: number; done: boolean}> = ({p, done}) => (
  <g>
    {!done && <rect x={6} y={13} width={40} height={9} rx={3} fill={C.paperDeep} stroke={C.inkSoft} strokeWidth={1.5} />}
    {!done && <rect x={6} y={13} width={40 * clamp01(p)} height={9} rx={3} fill={C.teal} />}
    {done && <path d="M 16 18 L 23 25 L 37 10" fill="none" stroke={C.tealDeep} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
  </g>
);

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const cam = roomCam(g);
  const gs = guesserAt(g);
  const gch = standAt(gs.x);
  const cPose = checkerAt(g);
  const scanP = tw(g, SCAN_TAP, SCAN_END - SCAN_TAP, E.linear);
  const scanning = g >= SCAN_TAP && g < SCAN_END;
  const scanDone = g >= SCAN_END; // the kit's own screen keeps its tick (no pop-off during the s39 pull-back)
  const firing = PULSES.reduce((m, p) => Math.max(m, g >= p.start && g < p.start + 8 ? 1 - (g - p.start) / 8 : 0), 0);
  const echo = PULSES.reduce((m, p) => {
    const arr = p.start + PATH_DUR;
    return Math.max(m, g >= arr && g < arr + 14 ? (p.fat ? 1 : 0.35) * (1 - (g - arr) / 14) : 0);
  }, 0);
  const led = scanning ? (Math.floor((g - SCAN_TAP) / 6) % 2 === 0 ? 1 : 0.3) : 0.9;
  const sensor = (
    <g transform={`translate(${GRIP.x} ${GRIP.y})`}>
      <HandheldSensor scale={SENS_K} led={led} ledColor={scanning ? C.coral : C.saffron} firing={firing} bumpHighlight={echo} screen={scanning || scanDone ? <ScanScreen p={scanP} done={scanDone} /> : undefined} />
    </g>
  );
  const strikeBoard = ring(g, STRIP_HIT, 0.9, 0.25) * 2.2;
  const stripOn = g >= STRIP_HIT;
  const glint = g >= STRIP_HIT ? Math.max(0, Math.sin(clamp01((g - STRIP_HIT - 2) / 12) * Math.PI)) : 0;
  const glint2 = g >= FAT_LABEL - 2 ? Math.max(0, Math.sin(clamp01((g - FAT_LABEL + 2) / 12) * Math.PI)) : 0;
  // the arrival cue at the board (the leg itself ends at the board's outline): a rim flash on its wall-side edge
  const boardRim = PULSES.reduce((m, p) => {
    const hit = vertexFrame(p.start, 2);
    return Math.max(m, (p.fat ? 1 : 0.7) * tw(g, hit - 1, 3) * (1 - tw(g, hit + 6, 10)));
  }, 0);
  const items: RoomItem[] = [
    {
      key: 'stand',
      x: PTS.S.x,
      z: standZ(g), // paints over her except during the tap (see TAP_FRONT0)
      w: 0.16,
      height: LIGHT_H + 0.1, // the tripod head and box on the 0.95 m light-path plane
      node: (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <SensorStand head={TRIPOD_HEAD} feet={TRIPOD_FEET} scale={RIG_S * 0.8} />
          {sensor}
        </svg>
      ),
    },
    {
      key: 'board',
      x: BD.x,
      z: BD.z,
      w: 0.22,
      height: LIGHT_H + 0.24, // centre on the light-path plane, 0.44 m tall
      node: (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <TargetBoard center={B_C} floor={B_F} w={B_W} h={B_H} wobble={strikeBoard} rim={boardRim} rimScale={RIG_S}>
            {stripOn && <ReflectiveStrip x={STRIP_AT.x} y={STRIP_AT.y} w={STRIP_W} h={STRIP_H} glint={Math.max(glint, glint2)} />}
          </TargetBoard>
        </svg>
      ),
    },
    {
      key: 'checker',
      x: OP.x,
      z: OP.z,
      w: 0.3,
      node: <Character2 look={CAST.checker} pose={cPose} frame={g} seed={9} x={OPR.x} y={OPR.y} scale={RIG_S} life={0.4} />,
    },
    {
      key: 'guesser',
      x: gs.x,
      z: G.z,
      w: 0.3,
      node: (
        <Character2
          look={CAST.guesser}
          pose={gs.pose}
          frame={g}
          seed={22}
          x={gch.x}
          y={gch.y}
          scale={RIG_S}
          life={gs.life}
          eyeDarts={false}
          holdL={gs.holdStrip ? <ReflectiveStrip x={-30} y={2} w={STRIP_W / RIG_S} h={STRIP_H / RIG_S} /> : undefined}
        />
      ),
    },
  ];
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {PULSES.map((p, i) => (
        <Pulse key={i} g={g} start={p.start} fat={p.fat} />
      ))}
    </svg>
  );
  // S7.3 "seen from above": the gap at the wall marked on the room's floor and the plan card, for the pulse beat
  const planT = g >= PLAN_IN && g < PLAN_OUT + PLAN_OUT_DUR ? 1 - tw(g, PLAN_OUT, PLAN_OUT_DUR, E.inOut) : 0;
  const gapT = g >= PLAN_IN ? tw(g, PLAN_IN, 10, E.out) * (1 - tw(g, PLAN_OUT, PLAN_OUT_DUR)) : 0;
  const spotT = tw(g, Math.floor(vertexFrame(PULSE_A1, 1)) - 2, 8);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet
            tilt={TILT}
            items={items}
            backdrop={
              <>
                <GapMarker tilt={TILT} t={gapT} />
                <WallSpot g={g} />
              </>
            }
          >
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {planT > 0 && (
        <PlanCard
          x={PLAN_POS.x}
          y={PLAN_POS.y}
          t={planT}
          view={PLAN_VIEW_S7}
          checker={{x: OP.x, z: OP.z}}
          guesser={{x: G.x0, z: G.z, facing: -90}}
          sensor={{firing}}
          gap={gapT}
          light={(tp, ppm) => (
            <>
              <PlanBoard toPx={tp} ppm={ppm} strip={tw(g, STRIP_HIT, 4)} />
              {PULSES.map((p, i) => (
                <PlanPulse key={i} g={g} start={p.start} fat={p.fat} toPx={tp} />
              ))}
            </>
          )}
          marks={(tp) => <PlanSpot {...tp(PW)} t={spotT} />}
        />
      )}
      <RoomLabels g={g} cam={cam} />
    </AbsoluteFill>
  );
};


/** Screen-space labels and cards of the room shots. */
const RoomLabels: React.FC<{g: number; cam: Cam}> = ({g, cam}) => {
  const slowed = fadeWin(g, PULSE_A1, PULSE_B2 + PATH_DUR + 10);
  const fatLab = fadeWin(g, FAT_LABEL, CARD_IN, 8, 10); // gone as "our clip" slides into the column
  const cardX = CARD.x - 616 + 616 * E.out(tw(g, CARD_IN, 14, E.linear)) - 640 * E.in(tw(g, CARD_OUT, 12, E.linear));
  const stampT = tw(g, STAMP - 3, 3, E.in);
  const kick = ring(g, STAMP, 0.9, 0.3) * 1.5;
  const flat = fadeWin(g, K.flat, SIDLE0, 8, 10);
  const scan = fadeWin(g, SCAN_TAP, SIDLE0 + 8, 6, 6); // the magnified readout appears at the button press
  const scanP = tw(g, SCAN_TAP, SCAN_END - SCAN_TAP, E.linear);
  const readout = worldToScreen(cam, SCREEN_C.x, SCREEN_C.y);
  const wallTag = scr(cam, FLAT_TAG);
  const film = g >= STRIP_DROP;
  const filmY = FILM_Y - 300 + 300 * E.out(tw(g, STRIP_DROP, 14, E.linear));
  const ticks = g < TICK0 ? 0 : Math.floor((g - TICK0) / TICK) + 1;
  const tickFrac = g < TICK0 ? 1 : E.inOut(clamp01(((g - TICK0) % TICK) / 4));
  const filmPos = FILM_START + Math.max(0, ticks - 1) + (ticks > 0 ? tickFrac : 0);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {slowed > 0 && (
        <div style={{position: 'absolute', left: 96, top: SLOWED_Y, opacity: slowed}}>
          <Chip tone="paper" size={30}>
            slowed down
          </Chip>
        </div>
      )}
      {fatLab > 0 && (
        // the left card column, below the "seen from above" card (CAM_S38 keeps both clear of her); the "our clip" card
        // takes the column next
        <div style={{position: 'absolute', left: CARD.x, top: FAT_LABEL_Y, opacity: fatLab}}>
          <div style={{...popStyle(g, FAT_LABEL, 'left top'), width: CARD.w, boxSizing: 'border-box', padding: '16px 26px 18px', background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 18, boxShadow: `6px 7px 0 ${C.shadow}`}}>
            <svg width={120} height={36} style={{display: 'block', overflow: 'visible', marginBottom: 8}}>
              <ReflectiveStrip x={60} y={18} w={116} h={30} />
            </svg>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.ink, lineHeight: 1.15}}>
              reflective material:
              <br />
              far more light
              <br />
              straight back
            </div>
          </div>
        </div>
      )}
      {g >= CARD_IN && g < CARD_OUT + 14 && (
        <div style={{position: 'absolute', left: cardX, top: CARD.y, transform: `rotate(${-1.5 + kick}deg)`, transformOrigin: '50% 0'}}>
          <Card style={{position: 'relative', width: CARD.w, padding: '20px 26px 24px', boxSizing: 'border-box'}}>
            <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 46, color: C.ink, lineHeight: 1}}>our clip</div>
            <div style={{marginTop: 14, marginLeft: 20}}>
              <TrackPlot width={370} idx={TRACK_FRAMES - 1} wholeRun labels={false} marker={1} />
            </div>
            <div style={{marginTop: 12, fontFamily: F.body, fontWeight: 800, fontSize: 36, color: C.ink, lineHeight: 1.2}}>
              clothing:
              <br />
              not recorded
            </div>
            <div style={{position: 'absolute', left: '50%', top: 236, transform: 'translate(-50%, -50%)'}}>
              <StampMark text="files don't say" tone="coral" t={stampT} size={40} rotate={-9} />
            </div>
          </Card>
        </div>
      )}
      {flat > 0 && (
        <div style={{position: 'absolute', left: wallTag.x, top: wallTag.y, transform: 'translate(-50%, -50%)', opacity: flat}}>
          <div style={popStyle(g, K.flat, 'center')}>
            <Chip tone="paper" size={36}>
              flat wall
            </Chip>
          </div>
        </div>
      )}
      {scan > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, opacity: scan}}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
            <line x1={readout.x - 24} y1={readout.y + 16} x2={SCAN_BOX.x + 10} y2={SCAN_BOX.y} stroke={C.ink} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" />
            <line x1={readout.x + 24} y1={readout.y + 16} x2={SCAN_BOX.x + SCAN_BOX.w - 10} y2={SCAN_BOX.y} stroke={C.ink} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" />
            <rect x={readout.x - 26} y={readout.y - 20} width={52} height={38} rx={8} fill="none" stroke={C.coralDeep} strokeWidth={4} />
          </svg>
          <div style={{position: 'absolute', left: SCAN_BOX.x, top: SCAN_BOX.y, width: SCAN_BOX.w, height: SCAN_BOX.h, boxSizing: 'border-box', padding: '22px 30px', background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 22, boxShadow: `8px 9px 0 ${C.shadow}`, ...popStyle(g, SCAN_TAP, 'left top')}}>
            <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 46, color: C.ink, lineHeight: 1}}>empty-room scan</div>
            <div style={{position: 'relative', marginTop: 26, height: 40, borderRadius: 12, background: C.paperDeep, border: `3px solid ${C.ink}`, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${scanP * 100}%`, background: C.teal}} />
            </div>
            {g >= SCAN_END && (
              <svg width={60} height={60} style={{position: 'absolute', right: 26, top: 14, overflow: 'visible'}}>
                <circle cx={30} cy={30} r={26} fill={C.teal} stroke={C.ink} strokeWidth={4} transform={`scale(${0.6 + 0.4 * E.back(tw(g, SCAN_END, 10, E.linear))})`} style={{transformOrigin: '30px 30px'}} />
                <path d="M 18 31 L 27 40 L 43 21" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      )}
      {film && g < CUT_MUSEUM && (
        <>
          <div style={{position: 'absolute', left: FILM_X, top: filmY, width: FILM_W, borderRadius: 6, boxShadow: `8px 9px 0 ${C.shadow}`}}>
            <FilmFrames width={FILM_W} cell={FILM_CELL} pos={filmPos} />
          </div>
          <div style={{position: 'absolute', left: FILM_X + FILM_W - 6, top: filmY + filmStripHeight(FILM_CELL) + 15, transform: 'translateX(-100%)', opacity: tw(g, STRIP_DROP + 10, 8)}}>
            <Chip tone="paper" size={30}>
              slowed down
            </Chip>
          </div>
        </>
      )}
      {g >= K.ordinary && g < CUT_MUSEUM && (
        <div style={{position: 'absolute', left: 960, top: ORD_TOP, transform: 'translateX(-50%)'}}>
          <div style={{...popStyle(g, K.ordinary, 'center'), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
            <Chip tone="teal" size={38}>
              reported: person in ordinary clothes · 30 frames/s capture
            </Chip>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.inkSoft, background: C.cream, padding: '2px 14px', borderRadius: 10}}>a different capture from our clip</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== S7.4b: the museum slot */

const MUSEUM_CAM0: Cam = {cx: 960, cy: 540, zoom: 1};
const MUSEUM_CAM1: Cam = {cx: 1040, cy: 510, zoom: 1.1};
const PL = {y: 520, w: 540, h: 310, ax: 520, bx: 1300};

const Museum: React.FC<{g: number}> = ({g}) => {
  const cam = camPath(g, MUSEUM_CAM0, [{at: MUSEUM_PUSH0, dur: MUSEUM_PUSH_DUR, to: MUSEUM_CAM1}]);
  const dropA = drop(g, PLAQUE_A, 46, 7);
  const dropB = drop(g, PLAQUE_B, 46, 7);
  const swingB = ring(g, PLAQUE_B, 0.7, 0.2) * 3;
  return (
    <AbsoluteFill style={{background: '#D3E1F8'}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <rect x={-800} y={-600} width={3520} height={1430} fill="#D3E1F8" />
            <rect x={-800} y={790} width={3520} height={46} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
            {/* the gallery floor: paperDeep, as in S5's shelf and S6.1's plinth, so the museum reads as one place */}
            <rect x={-800} y={834} width={3520} height={900} fill={C.paperDeep} stroke={C.ink} strokeWidth={OUTLINE} />
            <Plinth x={PL.ax} y={PL.y} w={PL.w} h={PL.h + 10}>
              <g transform="translate(0 -22)">
                <CodeCard w={220} />
              </g>
              <g transform={`translate(0 ${118 + dropA})`} opacity={g >= PLAQUE_A - 7 ? 1 : 0}>
                <Plaque text="code: public" w={330} size={38} />
              </g>
            </Plinth>
            <Plinth x={PL.bx} y={PL.y} w={PL.w} h={PL.h + 10}>
              {/* the empty slot: a dashed outline where an exhibit would stand */}
              <rect x={-130} y={-22 - 270} width={260} height={262} rx={18} fill="none" stroke={C.inkMuted} strokeWidth={5} strokeDasharray="18 14" strokeLinecap="round" />
              <g transform={`translate(0 ${118 + dropB}) rotate(${swingB})`} opacity={g >= PLAQUE_B - 7 ? 1 : 0}>
                <Plaque text="independent reproduction" w={520} size={36} />
              </g>
            </Plinth>
          </svg>
        </Layer>
      </Camera>
      {g >= FINAL_CHIP && (
        <div style={{position: 'absolute', left: 960, top: 74, transform: 'translateX(-50%)'}}>
          <div style={popStyle(g, FINAL_CHIP, 'center')}>
            <Chip tone="ink" size={40}>
              code public · none found (Oct 2026)
            </Chip>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== scene */

export const S7Results: React.FC = () => {
  const g = useG();
  if (g < CUT_ROOM) return <Boards g={g} />;
  if (g < CUT_MUSEUM) return <RoomShot g={g} />;
  return <Museum g={g} />;
};

/* ================================================================== sound cue sheet */

const exitSteps = tripContacts(EXIT0, EXIT_PLAN, FPS_EXIT);
const sidleSteps = tripContacts(SIDLE0, SIDLE_PLAN, FPS_TIP, TIP_PULSE);
const walkSteps = [...tripContacts(WALK1_0, WALK1_PLAN, FPS_WALK), ...tripContacts(WALK2_0, WALK2_PLAN, FPS_WALK), ...tripContacts(WALK3_0, WALK3_PLAN, FPS_WALK)].filter((f) => f < CUT_MUSEUM);
const filmTicks = Array.from({length: Math.max(0, Math.floor((CUT_MUSEUM - TICK0) / TICK))}, (_, i) => TICK0 + i * TICK).filter((_, i) => i % 3 === 0);

/* ================================================================== hands on props (module-load checks) */

// Hands touch what they move: his left hand on the strip at the press, her right fingertips on the sensor's button at
// the tap (two-bone reach2 on the projected points; the contact error is measured on the drawn rig).
{
  const bad: string[] = [];
  const him = guesserAt(STRIP_HIT);
  const himPlace: RigPlace = {...standAt(G.x0), scale: RIG_S, frame: STRIP_HIT, seed: 22, life: 0.35};
  const h = handWorld2(himPlace, him.pose, -1);
  const want = {x: STRIP_AT.x + 30 * RIG_S, y: STRIP_AT.y - 2 * RIG_S};
  const eHim = Math.hypot(h.x - want.x, h.y - want.y);
  if (eHim > 1) bad.push(`his hand misses the strip by ${eHim.toFixed(2)} px at the press`);
  const her = checkerAt(SCAN_TAP);
  const herPlace: RigPlace = {x: OPR.x, y: OPR.y, scale: RIG_S, frame: SCAN_TAP, seed: 9, life: 0.4};
  const b = handWorld2(herPlace, her, 1);
  const eHer = Math.hypot(b.x - BUTTON.x, b.y - (BUTTON.y + 3));
  if (eHer > 1) bad.push(`her hand misses the sensor's button by ${eHer.toFixed(2)} px at the tap`);
  // paint order: the stand over her for the whole shot except the tap, her over the stand for the tap
  const dHer = depthAt(OP.x, OP.z);
  if (!(depthAt(PTS.S.x, STAND_Z_OVER) > dHer && depthAt(PTS.S.x, PTS.S.z) < dHer)) bad.push('the stand / checker paint order does not switch as designed');
  // ... and it switches only while her right hand is clear of the box (hovering above it at LIFT): no pop
  const MITT = MITT_R * RIG_S;
  for (const f of [TAP_FRONT0 - 1, TAP_FRONT0, TAP_FRONT1 - 1, TAP_FRONT1]) {
    const hw = handWorld2({x: OPR.x, y: OPR.y, scale: RIG_S, frame: f, seed: 9, life: 0.4}, checkerAt(f), 1);
    const clear = hw.x + MITT < SENSOR_BOX.x0 - 2 || hw.x - MITT > SENSOR_BOX.x1 + 2 || hw.y + MITT < SENSOR_BOX.y0 - 2 || hw.y - MITT > SENSOR_BOX.y1 + 2;
    if (!clear) bad.push(`her hand overlaps the sensor box at frame ${f}, where the paint order switches`);
  }
  // the shoo hand works above the box (seen whole, never behind it) whenever the arm is fully up
  for (let f = SHOO0; f < SHOO1; f++) {
    if (shooUp(f) < 1) continue;
    const hw = handWorld2({x: OPR.x, y: OPR.y, scale: RIG_S, frame: f, seed: 9, life: 0.4}, checkerAt(f), 1);
    if (!(hw.y + MITT <= SENSOR_BOX.y0 - 6)) bad.push(`her shoo hand dips to the sensor box at frame ${f}`);
    if (!(hw.x + MITT <= FAR_TOP.x - 24 / SCAN_ZOOM)) bad.push(`her shoo hand reaches the partition's far edge at frame ${f}`);
  }
  if (bad.length) throw new Error(`S7 contact: ${bad.join('; ')}`);
}

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (CUT_MUSEUM - K.start) / 30, note: 'S7 board + room'},
  // S7.1 chips
  {f: K.kit, kind: 'chip_pop', gain: -4},
  {f: K.under, kind: 'chip_pop', gain: -4, pitch: 2},
  {f: K.sixteen, kind: 'pop_tick', gain: -3, note: 'wall spots pulse'},
  {f: K.held, kind: 'chip_pop', gain: -4, pitch: 4},
  {f: K.ran, kind: 'chip_pop', gain: -3, pitch: -2},
  // S7.2 the raster
  {f: POS1, kind: 'sensor_pulse', note: 'first position'},
  {f: ARC0, kind: 'chip_pop', gain: -4, note: 'one position: an arc'},
  {f: K.known, kind: 'chip_pop', gain: -5},
  {f: STEP0, kind: 'scanner_sweep', dur: (STEP1 - STEP0) / 30, gain: -6, note: '35 more positions'},
  {f: K.rough, kind: 'chip_pop', gain: -3, pitch: 3},
  {f: STEP1, kind: 'readout_beep', gain: -3, note: 'the U complete'},
  // S7.3 pulses, strip, card, stamp
  ...PULSES.flatMap((p, i) => [
    {f: p.start, kind: 'sensor_pulse' as const, gain: -4, pitch: i},
    {f: Math.round(vertexFrame(p.start, 1)), kind: 'bounce_tick' as const, gain: -8, pitch: 2 + i},
    {f: Math.round(p.start + PATH_DUR), kind: 'echo_return' as const, gain: p.fat ? 2 : -10, pitch: p.fat ? 0 : 3},
  ]),
  {f: STRIP_HIT, kind: 'strip_rip', note: 'strip pressed onto the board'},
  {f: STRIP_HIT + 3, kind: 'glint', gain: -8},
  {f: CARD_IN, kind: 'paper_slide', gain: -3},
  {f: STAMP, kind: 'stamp_heavy', note: "files don't say"},
  {f: CARD_OUT, kind: 'paper_swish', gain: -6},
  // the shoo, the walk out, the scan, the sidle back
  {f: SHOO0 + 2, kind: 'shoo'},
  {f: SHOO0 + SHOO_PERIOD + 2, kind: 'shoo', gain: -3, pitch: 2},
  ...exitSteps.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -6 - i, pitch: i % 2})),
  {f: K.flat, kind: 'chip_pop', gain: -5},
  {f: SCAN_TAP, kind: 'readout_beep', note: 'empty-room scan starts'},
  {f: SCAN_TAP + 2, kind: 'sensor_hum', dur: (SCAN_END - SCAN_TAP) / 30, gain: -6},
  {f: SCAN_END, kind: 'readout_beep', pitch: 5, note: 'scan done'},
  ...sidleSteps.map((f, i) => ({f, kind: 'tiptoe_step' as const, gain: -4, pitch: i % 2 ? 1 : -1})),
  // S7.4 film strip, walk, chip
  {f: STRIP_DROP, kind: 'paper_slide', gain: -4, note: 'film strip drops in'},
  ...filmTicks.map((f, i) => ({f, kind: 'film_tick' as const, gain: -9, pitch: (i % 3) - 1})),
  ...walkSteps.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -7, pitch: i % 2})),
  {f: K.ordinary, kind: 'chip_pop', gain: -3},
  // museum
  {f: CUT_MUSEUM, kind: 'amb_museum', dur: (K.end + 6 - CUT_MUSEUM) / 30},
  {f: CUT_MUSEUM + 2, kind: 'shelf_creak', gain: -6},
  {f: PLAQUE_A, kind: 'thud_soft', gain: -3},
  {f: PLAQUE_B, kind: 'thud_soft', pitch: -2},
  {f: FINAL_CHIP, kind: 'chip_pop', gain: -2},
];

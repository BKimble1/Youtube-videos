import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, SNAP, SOFT, camPath, ring, sp, tw} from '../lib/motion';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {CAM_RAISED, PLINTH, RAISED_TILT} from '../lib/shots';
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
import {AUTHORS_BOX, AuthorsSensor, CodeCard, FilmFrames, ReflectiveStrip, SensorStand, TargetBoard, filmStripHeight} from '../components/v02/S7_Props';
import {MU, MuseumHall, Plinth as ShelfPlinth, RopePost, RopeSpan, ropePoint} from '../components/v02/S5_Museum';

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
 *  S7.4 (s39) cut to an evidence card, "the authors' separate test · our drawing": a neutral grey device (not the
 *        kit), the partition, he walks behind it while a film strip ticks; the authors' claim under the card, with what
 *        it is not. Cut to the museum (S5's shelf, its plinths, plates and rope): the code on its plinth, an empty slot
 *        plated "independent reproduction".
 * Every beat is cued from narration words (module-level K); durations shrink from the cues when gaps shrink.
 */

/* ================================================================== cues */

const SC = scene('S7');
/** The word right before `word` in a segment, which must be `prev` (e.g. the "The" of "The code is public"): found by its
 *  neighbour, not by counting occurrences, so a re-worded line that adds or drops an earlier "the" still cues the cut. */
const atBefore = (segId: string, prev: string, word: string) => {
  const ws = seg(segId).words;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
  const i = ws.findIndex((w) => norm(w.w) === norm(word));
  if (i < 1 || norm(ws[i - 1].w) !== norm(prev)) throw new Error(`S7 cue: "${prev} ${word}" not found in ${segId}`);
  return ws[i - 1].from;
};
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
  theCode: atBefore('s39', 'the', 'code'),
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

// the guesser's marks (plan metres, z = his depth): by the board, the way out (right)
const G = {z: 1.15, x0: 3.15, out: 3.86};
// his marks in the s39 drawing of the authors' test (same depth): a start mark nearer the partition than his s38 mark
// (no board there now), so the drawing's window keeps more of the room and less of the paper outside its right wall;
// x1 and x3 are behind the partition's near end from this camera
const GC = {x0: 2.8, x1: 2.32, x2: 2.72, x3: 2.42};
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

/*
 * The strip has to face the light it sends back (D35). The pulses reach the board from the wall side (behind it), so
 * after pressing the strip onto the board's front he takes the board by its right edge and turns it half a revolution
 * on its pole (front, strip and all, to the wall), well before the first fat pulse gets there. His left hand rides the
 * board's edge nearest him for the whole turn (asserted with the hands-on-props checks), then goes back to his hip. The
 * plan card turns its board the same way, so at the arrival the strip is on the wall-facing edge there too.
 */
const FAT_HIT = vertexFrame(PULSE_B1, 2); // the first fat pulse reaches the board
const TURN_DUR = 10;
const TURN0 = Math.min(STRIP_HIT + 18, Math.floor(FAT_HIT) - TURN_DUR - 6);
const TURN1 = TURN0 + TURN_DUR;
const SLIDE0 = STRIP_HIT + 4; // the hand leaves the strip for the board's right edge (after the press and its glint)
const SLIDE1 = TURN0 - 3; // at the edge: a beat, then the turn
const HIP0 = TURN1 + 2; // the hand goes back to the hip
const turnAt = (g: number) => tw(g, TURN0, TURN_DUR, E.inOut);
const EDGE_Y = B_C.y + 0.12 * B_H; // his hand holds the edge just below its middle
/** The board's silhouette edge nearest him (screen x) at turn u: the right edge, edge-on at the centre, then the other
 *  edge coming round. */
const edgeX = (u: number) => B_C.x + (Math.abs(Math.cos(Math.PI * u)) * B_W) / 2;
{
  const bad: string[] = [];
  if (!(SLIDE1 >= SLIDE0 + 6)) bad.push(`no time to slide his hand to the board's edge (${SLIDE0}..${SLIDE1})`);
  if (!(TURN0 + TURN_DUR + 4 <= FAT_HIT)) bad.push(`the board is still turning (${TURN1}) when the first fat pulse reaches it (${FAT_HIT.toFixed(1)})`);
  // the thin pulses reach the bare board before the turn, the fat ones only after it
  for (const p of PULSES) {
    const hit = vertexFrame(p.start, 2);
    if (!p.fat && !(hit < TURN0)) bad.push(`a thin pulse reaches the board during or after the turn (${hit.toFixed(1)})`);
    if (p.fat && !(hit >= TURN1 + 4)) bad.push(`a fat pulse reaches the board before the turn is done (${hit.toFixed(1)})`);
  }
  if (bad.length) throw new Error(`S7 board turn: ${bad.join('; ')}`);
}

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
const WALK1_PLAN = planTrip(pxd(GC.x0, GC.x1), RIG_S, 'walk');
const WALK2_PLAN = planTrip(pxd(GC.x1, GC.x2), RIG_S, 'walk');
const WALK3_PLAN = planTrip(pxd(GC.x2, GC.x3), RIG_S, 'walk');
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
/** The "flat wall" tag pops once her shoo arm is on its way down (D36: on "flat" it popped over her raised fist); the
 *  clearance from her hand is asserted for every frame it is up (hands-on-props checks). */
const FLAT_IN = Math.max(K.flat, SHOO1 + 4);
/** s39 cuts away from the room (the kit, the checker, the strip board) to the authors' separate test, drawn on a card
 *  (D09): once his sidle-back has settled, on "(in a) separate (test)". */
const S39_CUT = Math.max(SIDLE1 + 12, at('s39', 'separate'));
const CUT_MUSEUM = K.theCode; // "The code is public": cut to the museum
const WALK1_0 = Math.max(S39_CUT + 20, K.tracking - 2);
const WALK1_1 = WALK1_0 + tripDuration(WALK1_PLAN, FPS_WALK);
// the pauses between his legs spread the walk over the line (12..22 frames, leaving ~1 s of settle before the cut)
const WALK_PAUSE = Math.max(12, Math.min(22, Math.floor((CUT_MUSEUM - 30 - WALK1_1 - tripDuration(WALK2_PLAN, FPS_WALK) - tripDuration(WALK3_PLAN, FPS_WALK)) / 2)));
const WALK2_0 = WALK1_1 + WALK_PAUSE;
const WALK2_1 = WALK2_0 + tripDuration(WALK2_PLAN, FPS_WALK);
const WALK3_0 = WALK2_1 + WALK_PAUSE;
const WALK3_1 = WALK3_0 + tripDuration(WALK3_PLAN, FPS_WALK);

/*
 * Cameras (world px, DEFAULT_VIEW room at TILT), derived from the projected subjects so a layout or rig change moves
 * them with the room; the constraints they are built from are asserted below (a throw, never a warning).
 *  - CAM_S38, the pulse beat and "our clip" (s38 first half): CAM_RAISED's zoom and height (the asserted light rule's
 *    zoom), slid right so a column of cards on the left (the "far more light" label, then the "our clip" card) clears
 *    her hair; both people head to feet, the partition's far top, W3 and the board.
 *  - CAM_SCAN, the shoo and the empty-room scan: the push-in to her and the sensor, her head to feet; the frame's right
 *    edge stops just short of where he waits outside (G.out), so the scan shows the room empty, while at his mark by
 *    the board (the shoo) he is still in frame.
 *  (s39 is not a room camera any more: it is the authors' separate test, drawn on a card; see AuthorsTestCard.)
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
/** Screen-space cards (px): the left card column of s38, the scan inset. */
const CARD = {x: 56, y: 64, w: 470, tape: 28};
const SCAN_BOX = {x: 1190, y: 610, w: 520, h: 200};
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
  if (bad.length) throw new Error(`S7 framing: ${bad.join('; ')}`);
}
const SCANCAM_DUR = Math.min(26, Math.max(16, SHOO0 + 6 - SCANCAM0));
const roomCam = (g: number) => camPath(g, CAM_S38, [{at: SCANCAM0, dur: SCANCAM_DUR, to: CAM_SCAN}]);

// The light rule at module load (a throw, never a warning), at the zooms the room camera has while any pulse is on
// screen: CAM_S38 (CAM_RAISED's zoom) for the whole beat on the current timings; if the cue gaps shrink and the push-in starts while a
// pulse is still out, its zooms are covered too (the margins scale with the zoom, so the extremes bound the range).
const PULSE_END = Math.ceil(PULSES[PULSES.length - 1].start + PATH_DUR + 16);
const PULSE_ZOOMS = Array.from({length: PULSE_END - PULSE_A1 + 1}, (_, i) => roomCam(PULSE_A1 + i).zoom);
for (const zoom of [Math.min(...PULSE_ZOOMS), Math.max(...PULSE_ZOOMS)]) assertAroundTheEnd('S7 W3 round trip', [PATH3], VS, {zoom});

/* ---------------------------------------------------------------- S7.4 (s39): the authors' separate test, on a card */
/*
 * The research number firewall (D09; claims C37): "ordinary clothes" and "30 frames/s capture" belong to the authors'
 * separate test, never to the kit, whose own clip's capture rate is unresolved. So s39 shows no kit: at S39_CUT the room
 * (the teal kit with its tick, the checker, the strip board) is cut away for an evidence-board card, "the authors'
 * separate test · our drawing". In it our drawing of that test, in a window onto the same room set (no plant, no door):
 * the partition, a neutral grey device on a plain stand (AuthorsSensor: no teal, screen, tick or saffron; tagged only
 * "their sensor", since the device's identity is unresolved), and the guesser walking behind the partition while a film
 * strip ticks ("slowed down"). The checker is not in it (she belongs to the kit). Under the card, the authors' claim and
 * what it is not. Layout (screen px), all inside the 5 % margins and above the caption band; asserted below.
 */
const ACARD = {x: 96, y: 56, w: 1728, h: 752}; // the card, outline included
const AWIN = {x: 124, y: 138, w: 1672, h: 646}; // the drawing's window inside it
const AHEAD = {x: 130, y: 70, size: 44}; // the card's header
const AW_MARGIN = 18; // screen px between his hair / soles and the window's edges
const FILM_CELL = 140;
const FILM_H = filmStripHeight(FILM_CELL);
const FILM_W = 4 * (FILM_CELL + 14) + 70; // four whole frames and a half
const FILM_X = AWIN.x + AWIN.w - 14 - FILM_W; // top right of the window, over the bare wall
const FILM_Y = AWIN.y + 14;
const FILM_BOTTOM = FILM_Y + FILM_H + 9; // + its drop shadow
const SLOW_TOP = FILM_Y + FILM_H + 15; // its "slowed down" chip, under its right end
const ACHIP_TOP = ACARD.y + ACARD.h + 12; // the authors' claim, two lines under the card
const ACHIP_L1 = 42; // px: critical-size line
const ACHIP_L2 = 34; // px: body-size line
const ACHIP_H = ACHIP_L1 * 1.6 + 6 + 6 + ACHIP_L2 * 1.15 + 4; // chip (0.3 em padding, 3 px border), gap, line 2 (+ padding)
/** The window's camera: him (hair tip to soles) fills the window's height, his right elbow at his rightmost mark just
 *  left of the film strip, so the strip never covers him. */
const himFeetY = HIM0.y + 8;
const AW_ZOOM = Math.min(1.12, (AWIN.h - 2 * AW_MARGIN) / (himFeetY - himTop));
const CAM_AUTH: Cam = {
  cx: rigAt(GC.x0, G.z, TILT).x + ELBOW_R * RIG_S - (FILM_X - 24 - 960) / AW_ZOOM,
  cy: himFeetY - (AWIN.y + AWIN.h - AW_MARGIN - 540) / AW_ZOOM,
  zoom: AW_ZOOM,
};
/** The neutral device stands where the kit stood in our room (the drawing's sensor spot), its box on the light plane. */
const DEV_BOX = pj(PTS.S.x, PTS.S.z, LIGHT_H);
const DEV_FLOOR = pj(PTS.S.x, PTS.S.z, 0);
const THEIR_TAG_IN = Math.max(S39_CUT + 8, at('s39', 'authors'));
const THEIR_TAG = {x: DEV_BOX.x - 0.3 * VS.ppm, y: DEV_BOX.y - 0.36 * VS.ppm}; // world px: on the bare wall up and left of the device (the partition's far edge is close on its right)
const THEIR_TAG_HALF = {w: 132, h: 30}; // the tag's half-size at 34 px (screen px; measured 260 x 60)
const STRIP_DROP = Math.max(K.report, S39_CUT + 12); // the film strip drops in on "report"
{
  const bad: string[] = [];
  const need = (ok: boolean, what: string) => ok || bad.push(what);
  const inWin = (p: {x: number; y: number}, m = 6) => p.x >= AWIN.x + m && p.x <= AWIN.x + AWIN.w - m && p.y >= AWIN.y + m && p.y <= AWIN.y + AWIN.h - m;
  // the card, its header and the claim inside the margins, the claim above the caption band
  need(ACARD.x >= SAFE.x0 && ACARD.x + ACARD.w <= SAFE.x1 && ACARD.y >= SAFE.y0, 'the authors\' card outside the 5 % margins');
  need(AWIN.x > ACARD.x && AWIN.x + AWIN.w < ACARD.x + ACARD.w && AWIN.y >= AHEAD.y + AHEAD.size + 14 && AWIN.y + AWIN.h < ACARD.y + ACARD.h, 'the drawing window is not inside the card, under its header');
  need(ACHIP_TOP + ACHIP_H <= SAFE.y1 - 4, `the authors' claim reaches the caption band (${(ACHIP_TOP + ACHIP_H).toFixed(0)})`);
  need(FILM_W >= 4 * (FILM_CELL + 14), 'the film strip is narrower than four frames');
  // him at every mark: hair tip to soles inside the window, clear of the film strip; elbows inside the window
  for (const x of [GC.x0, GC.x1, GC.x2, GC.x3]) {
    const r = rigAt(x, G.z, TILT);
    const top = scr(CAM_AUTH, {x: r.x, y: r.y - SPIKES * r.scale});
    const feet = scr(CAM_AUTH, {x: r.x, y: r.y + 8});
    const left = scr(CAM_AUTH, {x: r.x - ELBOW_R * r.scale, y: r.y});
    const right = scr(CAM_AUTH, {x: r.x + ELBOW_R * r.scale, y: r.y});
    need(top.y >= AWIN.y + AW_MARGIN - 2 && feet.y <= AWIN.y + AWIN.h - AW_MARGIN + 2, `his height is cut by the window at x ${x}`);
    need(left.x >= AWIN.x + 12, `his elbow is cut by the window's left edge at x ${x}`);
    need(right.x <= FILM_X - 12 || top.y >= FILM_BOTTOM + 8, `his hair or elbow under the film strip at x ${x}`);
  }
  // the device: stand, box and its tag inside the window, the tag clear of the film strip and of the partition
  const dev = [scr(CAM_AUTH, {x: DEV_BOX.x - (AUTHORS_BOX.w / 2 + 0.17) * VS.ppm, y: DEV_FLOOR.y + 10}), scr(CAM_AUTH, {x: DEV_BOX.x + (AUTHORS_BOX.w / 2 + AUTHORS_BOX.dx) * VS.ppm, y: DEV_BOX.y + AUTHORS_BOX.dy * VS.ppm - 12})];
  need(dev.every((p) => inWin(p, 16)), 'the authors\' device is cut by the window');
  const tag = scr(CAM_AUTH, THEIR_TAG);
  need(inWin({x: tag.x - THEIR_TAG_HALF.w, y: tag.y - THEIR_TAG_HALF.h}, 12) && inWin({x: tag.x + THEIR_TAG_HALF.w, y: tag.y + THEIR_TAG_HALF.h}, 12), 'the "their sensor" tag is cut by the window');
  need(tag.x + THEIR_TAG_HALF.w + 16 <= scr(CAM_AUTH, FAR_TOP).x, 'the "their sensor" tag touches the partition');
  need(tag.x + THEIR_TAG_HALF.w + 16 <= FILM_X || tag.y - THEIR_TAG_HALF.h >= FILM_BOTTOM + 8, 'the "their sensor" tag touches the film strip');
  need(tag.y + THEIR_TAG_HALF.h + 10 <= scr(CAM_AUTH, {x: 0, y: DEV_BOX.y + AUTHORS_BOX.dy * VS.ppm - 0.03 * VS.ppm}).y, 'the "their sensor" tag sits on the device');
  // timing: the card is up well before the claim lands; he has stood a moment before he walks
  need(S39_CUT + 30 <= K.ordinary, `the cut to the card (${S39_CUT}) comes too late for "ordinary" (${K.ordinary})`);
  need(WALK1_0 >= S39_CUT + 12, 'he starts walking on the cut');
  need(STRIP_DROP + 14 <= K.ordinary, 'the film strip is still dropping in when the claim lands');
  if (bad.length) throw new Error(`S7 authors' card: ${bad.join('; ')}`);
}
const TICK0 = STRIP_DROP + 12;
const TICK = 5;
const FILM_START = 5; // frames already on the strip when it drops in

// museum
const PLAQUE_A = K.public;
const MUSEUM_PUSH0 = Math.max(K.though - 2, PLAQUE_A + 10);
const MUSEUM_PUSH_DUR = Math.min(28, Math.max(14, K.no - 2 - MUSEUM_PUSH0));
const PLAQUE_B = Math.max(K.no, MUSEUM_PUSH0 + MUSEUM_PUSH_DUR + 2);
// the dated summary lands once the second plate has set (D38: on "hardware" it was readable for about a second); it
// moves up to the plate's landing if the line gets shorter, and must be readable 2.5 s before the S8 wipe (12 frames,
// centred on the scene's end) starts to cover it
const FINAL_CHIP = Math.max(PLAQUE_B + 2, Math.min(PLAQUE_B + 8, K.end - 6 - 80));
{
  const readable = K.end - 6 - (FINAL_CHIP + 6); // from the end of its pop to the start of the wipe
  if (!(readable >= 75)) throw new Error(`S7 museum: the dated chip is readable for only ${readable} frames`);
  if (!(MUSEUM_PUSH0 + MUSEUM_PUSH_DUR <= FINAL_CHIP)) throw new Error('S7 museum: the dated chip pops during the push-in');
}

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
            {/* the estimate's swatch: teal with a cream highlight, as the marker (and S1.3's legend) */}
            <svg width={36} height={36}>
              <circle cx={18} cy={18} r={14} fill={C.teal} stroke={C.ink} strokeWidth={4} />
              <circle cx={14} cy={14} r={4} fill={C.cream} opacity={0.85} />
            </svg>
            estimated position
          </div>
          <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 34, color: C.inkSoft, opacity: marker}}>
            frame {String(frameNo).padStart(3, ' ')} / {TRACK_FRAMES}
          </div>
        </div>
      </Card>
      {/* right column: conditions in spoken order, then the source. Colour code as S1.3 and the plan: the listening spots
          (the wall points) saffron, the kit teal, the price a plain fact (the authors' framing) */}
      <Pill g={g} t0={K.kit} tone="teal" style={{left: 960, top: 172}}>
        evaluation-kit sensor
      </Pill>
      <Pill g={g} t0={K.under} tone="paper" style={{left: 960, top: 262}}>
        kit: under US$100 (authors)
      </Pill>
      <Pill g={g} t0={K.sixteen} tone="saffron" style={{left: 960, top: 352}}>
        16 listening spots
      </Pill>
      <Pill g={g} t0={K.held} tone="teal" style={{left: 960, top: 442}}>
        held still
      </Pill>
      <Pill g={g} t0={K.ran} tone="ink" style={{left: 960, top: 532}}>
        authors' code, run by us
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

/** The target board seen from above (0.40 m wide, a thin bar at H), with the reflective strip once it is on: on the
 *  board's camera-facing edge (as he presses it on), and turning with the board (`turn` 0..1, half a revolution, the
 *  same way the room's board turns: its right end goes back toward the wall), so at the fat arrivals the strip is on
 *  the wall-facing edge, facing the light. */
const PlanBoard: React.FC<{toPx: ToPx; ppm: number; strip: number; turn: number}> = ({toPx, ppm, strip, turn}) => {
  const c = toPx(BD);
  const w = 0.4 * ppm;
  const sw = 0.33 * ppm;
  return (
    <g transform={`rotate(${(-180 * clamp01(turn)).toFixed(2)} ${c.x.toFixed(2)} ${c.y.toFixed(2)})`}>
      <rect x={c.x - w / 2} y={c.y - 7} width={w} height={14} rx={5} fill={C.blueLight} stroke={C.ink} strokeWidth={3.5} />
      {strip > 0 && (
        <g opacity={clamp01(strip)}>
          <rect x={c.x - sw / 2} y={c.y + 3} width={sw} height={9} rx={3} fill={C.saffron} stroke={C.ink} strokeWidth={2} />
          <line x1={c.x - sw / 2 + 4} y1={c.y + 7.5} x2={c.x + sw / 2 - 4} y2={c.y + 7.5} stroke="#DCE5E8" strokeWidth={3} strokeLinecap="round" />
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
  // P0..P2: at x0, the strip in his left hand, pressing it onto the board, then turning the board to the wall
  if (g < EXIT0) {
    const ch0 = standAt(G.x0);
    const place: RigPlace = {x: ch0.x, y: ch0.y, scale: s, frame: g, seed: 22, life: 0.35};
    const smugT = tw(g, STRIP_HIT + 6, 14, E.inOut); // his face, once the strip is on
    const after = tw(g, HIP0, 14, E.inOut); // his left hand back to the hip, once the board is turned
    const impressed = Math.min(sp(g, FAT_LABEL - 2, SOFT), 1 - tw(g, LOOK_AT_HER - 4, 8));
    const caught = sp(g, LOOK_AT_HER, SNAP);
    const sulk = tw(g, EXIT0 - 10, 8, E.inOut);
    let face: Partial<Pose2> = {mouth: 'smile', lookX: -0.75, lookY: 0.15, lid: 0.15, brows: 0};
    if (smugT > 0) face = {...EXPR.smug, lookX: -0.6, lookY: 0.15};
    let pose: Pose2 = withPose({...IDLE2, armR: ARMS.handsOnHips.armR, armsFront: 'L'}, face);
    if (impressed > 0) pose = withPose(pose, {brows: 0.7, eyes: 1.1, lid: 0, mouth: g < FAT_LABEL + 14 ? 'o' : 'grin', lookX: -0.7, lookY: -0.35, tilt: -2}, Math.min(1, impressed));
    if (caught > 0) pose = withPose(pose, {brows: 0.85, eyes: 1.15, lid: 0, mouth: 'o', lookX: -1, lookY: 0.1, tilt: 3}, Math.min(1, caught));
    if (sulk > 0) pose = withPose(pose, {brows: -0.35, browAsym: 0.3, lid: 0.3, mouth: 'hmm', eyes: 1, lookX: -0.6, tilt: -3}, sulk);
    // the left hand: chest -> wind-up above the board -> press the strip on -> slide to the board's right edge -> turn
    // the board on that edge (the hand rides the silhouette edge nearest him: the right edge, edge-on at the centre,
    // then the other edge comes round into it) -> back to the hip
    const rest = {x: ch0.x - 54 * s, y: ch0.y - 214 * s};
    const contact = {x: STRIP_AT.x + 30 * s, y: STRIP_AT.y - 2 * s};
    const wind = {x: contact.x + 34, y: contact.y - 44};
    const t1 = tw(g, STRIP_LIFT, Math.max(6, STRIP_HIT - 6 - STRIP_LIFT), E.inOut);
    const t2 = tw(g, STRIP_HIT - 6, 6, E.in);
    let hx: number;
    let hy: number;
    if (g < STRIP_HIT - 6) {
      hx = rest.x + (wind.x - rest.x) * t1;
      hy = rest.y + (wind.y - rest.y) * t1;
    } else if (g < SLIDE0) {
      hx = wind.x + (contact.x - wind.x) * t2;
      hy = wind.y + (contact.y - wind.y) * t2;
    } else if (g < TURN0) {
      const u = tw(g, SLIDE0, SLIDE1 - SLIDE0, E.inOut);
      hx = contact.x + (edgeX(0) - contact.x) * u;
      hy = contact.y + (EDGE_Y - contact.y) * u;
    } else {
      hx = edgeX(turnAt(g));
      hy = EDGE_Y;
    }
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
    // from the cut to the authors' card on he stands at his start mark in our drawing of their test
    return {x: g >= S39_CUT ? GC.x0 : G.out - d / VS.ppm, pose, holdStrip: false, life: 0.3 + 0.3 * settle};
  }
  // P5: walks behind the partition (left), pauses, walks back (right)
  if (g < WALK2_0) {
    const d = tripDistance(g, WALK1_0, WALK1_PLAN, FPS_WALK);
    let pose = tripPose(d, WALK1_PLAN, {dir: -1, base: {...IDLE2, mouth: 'smile', lookX: -0.5}});
    const turn = tw(g, WALK1_1, 10, E.inOut);
    if (turn > 0) pose = mixPose2(pose, {...IDLE2, mouth: 'smile', lookX: 0.4, lookY: 0.05, feet: undefined}, turn);
    return {x: GC.x0 - d / VS.ppm, pose, holdStrip: false, life: 0.4};
  }
  if (g < WALK3_0) {
    const d = tripDistance(g, WALK2_0, WALK2_PLAN, FPS_WALK);
    let pose = tripPose(d, WALK2_PLAN, {dir: 1, base: {...IDLE2, mouth: 'smile', lookX: 0.4}});
    const turn = tw(g, WALK2_1, 10, E.inOut);
    if (turn > 0) pose = mixPose2(pose, {...IDLE2, mouth: 'smile', lookX: -0.3, lookY: 0.05, feet: undefined}, turn);
    return {x: GC.x1 + d / VS.ppm, pose, holdStrip: false, life: 0.4};
  }
  // a third, shorter leg back toward the partition, then he settles (only if there is time before the cut)
  const d = tripDistance(g, WALK3_0, WALK3_PLAN, FPS_WALK);
  let pose = tripPose(d, WALK3_PLAN, {dir: -1, base: {...IDLE2, mouth: 'smile', lookX: -0.4}});
  const stop = tw(g, WALK3_1, 12, E.inOut);
  if (stop > 0) pose = mixPose2(pose, withPose(HANDS_ON_HIPS, {...EXPR.smug, lookX: 0.2}), stop);
  return {x: GC.x2 - d / VS.ppm, pose, holdStrip: false, life: 0.4};
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
  const scanDone = g >= SCAN_END; // the kit's own screen keeps its tick until the cut to the authors' card
  // the research number firewall (D09): the teal kit (and the strip board) are never on screen with the authors'
  // separate-test claim; the room shot ends at S39_CUT, before "ordinary" (asserted at module load)
  if (g >= S39_CUT || g >= K.ordinary) throw new Error(`S7: the room with the teal kit is drawn at frame ${g}, after the cut to the authors' card`);
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
  // the fat returns leave the strip (now facing the wall): a sparkle on the board's up-left (wall-side) corner, over
  // its rim flash, as each fat pulse arrives
  const sparkle = PULSES.filter((p) => p.fat).reduce((m, p) => {
    const hit = vertexFrame(p.start, 2);
    return Math.max(m, g >= hit - 1 ? Math.max(0, Math.sin(clamp01((g - hit + 1) / 12) * Math.PI)) : 0);
  }, 0);
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
          <TargetBoard center={B_C} floor={B_F} w={B_W} h={B_H} wobble={strikeBoard} rim={boardRim} rimScale={RIG_S} sparkle={sparkle} turn={turnAt(g)}>
            {stripOn && <ReflectiveStrip x={STRIP_AT.x} y={STRIP_AT.y} w={STRIP_W} h={STRIP_H} glint={glint} />}
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
              <PlanBoard toPx={tp} ppm={ppm} strip={tw(g, STRIP_HIT, 4)} turn={turnAt(g)} />
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
  const flat = fadeWin(g, FLAT_IN, SIDLE0, 8, 10);
  const scan = fadeWin(g, SCAN_TAP, SIDLE0 + 8, 6, 6); // the magnified readout appears at the button press
  const scanP = tw(g, SCAN_TAP, SCAN_END - SCAN_TAP, E.linear);
  const readout = worldToScreen(cam, SCREEN_C.x, SCREEN_C.y);
  const wallTag = scr(cam, FLAT_TAG);
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
          <div style={popStyle(g, FLAT_IN, 'center')}>
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
    </AbsoluteFill>
  );
};

/* ================================================================== S7.4a: the authors' separate test (s39) */

/** The film strip's position (frames, float while a tick slides) at frame g. */
const filmPosAt = (g: number) => {
  const ticks = g < TICK0 ? 0 : Math.floor((g - TICK0) / TICK) + 1;
  const tickFrac = g < TICK0 ? 1 : E.inOut(clamp01(((g - TICK0) % TICK) / 4));
  return FILM_START + Math.max(0, ticks - 1) + (ticks > 0 ? tickFrac : 0);
};

/** s39: an evidence-board card with our drawing of the authors' separate test (see ACARD); no kit, no checker. */
const AuthorsTestCard: React.FC<{g: number}> = ({g}) => {
  const gs = guesserAt(g);
  const gch = standAt(gs.x);
  const items: RoomItem[] = [
    {
      key: 'device',
      x: PTS.S.x,
      z: PTS.S.z,
      w: 0.2,
      height: LIGHT_H + 0.1,
      node: (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <AuthorsSensor box={DEV_BOX} floor={DEV_FLOOR} ppm={VS.ppm} />
        </svg>
      ),
    },
    {
      key: 'guesser',
      x: gs.x,
      z: G.z,
      w: 0.3,
      node: <Character2 look={CAST.guesser} pose={gs.pose} frame={g} seed={22} x={gch.x} y={gch.y} scale={RIG_S} life={gs.life} eyeDarts={false} />,
    },
  ];
  const filmY = FILM_Y - 300 + 300 * E.out(tw(g, STRIP_DROP, 14, E.linear));
  const tag = scr(CAM_AUTH, THEIR_TAG);
  const devTop = scr(CAM_AUTH, {x: DEV_BOX.x, y: DEV_BOX.y + AUTHORS_BOX.dy * VS.ppm - 0.03 * VS.ppm});
  const tagT = tw(g, THEIR_TAG_IN, 8);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Card style={{left: ACARD.x, top: ACARD.y, width: ACARD.w, height: ACARD.h, boxSizing: 'border-box'}} />
      <div style={{position: 'absolute', left: AHEAD.x, top: AHEAD.y, fontFamily: F.display, fontWeight: 600, fontSize: AHEAD.size, color: C.ink, lineHeight: 1, whiteSpace: 'nowrap'}}>
        the authors' separate test · our drawing
      </div>
      {/* the drawing: the room set (no plant, no door) seen through a window in the card, at its own fixed framing */}
      <div style={{position: 'absolute', left: AWIN.x, top: AWIN.y, width: AWIN.w, height: AWIN.h, overflow: 'hidden', borderRadius: 10}}>
        <div style={{position: 'absolute', left: -AWIN.x, top: -AWIN.y, width: 1920, height: 1080}}>
          <Camera cam={CAM_AUTH}>
            <Layer depth={1}>
              <RoomSet tilt={TILT} items={items} plant={false} door={false} />
            </Layer>
          </Camera>
        </div>
      </div>
      <div style={{position: 'absolute', left: AWIN.x, top: AWIN.y, width: AWIN.w, height: AWIN.h, boxSizing: 'border-box', border: `3px solid ${C.ink}`, borderRadius: 10}} />
      {/* "their sensor": what the grey box is, and no more (the device's identity is not documented) */}
      {tagT > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, opacity: tagT}}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
            <line x1={tag.x} y1={tag.y + THEIR_TAG_HALF.h + 2} x2={devTop.x} y2={devTop.y} stroke={C.inkSoft} strokeWidth={3} strokeDasharray="3 8" strokeLinecap="round" />
          </svg>
          <div style={{position: 'absolute', left: tag.x, top: tag.y, transform: 'translate(-50%, -50%)'}}>
            <div style={popStyle(g, THEIR_TAG_IN, 'center')}>
              <Chip tone="paper" size={34}>
                their sensor
              </Chip>
            </div>
          </div>
        </div>
      )}
      {/* the film strip: frames captured one after another, slowed down */}
      {g >= STRIP_DROP && (
        <>
          <div style={{position: 'absolute', left: FILM_X, top: filmY, width: FILM_W, borderRadius: 6, boxShadow: `8px 9px 0 ${C.shadow}`}}>
            <FilmFrames width={FILM_W} cell={FILM_CELL} pos={filmPosAt(g)} />
          </div>
          <div style={{position: 'absolute', left: FILM_X + FILM_W - 6, top: filmY - FILM_Y + SLOW_TOP, transform: 'translateX(-100%)', opacity: tw(g, STRIP_DROP + 10, 8)}}>
            <Chip tone="paper" size={30}>
              slowed down
            </Chip>
          </div>
        </>
      )}
      {/* the authors' claim (claims C37), and what it is not */}
      {g >= K.ordinary && (
        <div style={{position: 'absolute', left: 960, top: ACHIP_TOP, transform: 'translateX(-50%)'}}>
          <div style={{...popStyle(g, K.ordinary, 'center'), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            <Chip tone="ink" size={ACHIP_L1}>
              Reported by the authors: person in ordinary clothes · 30 frames/s capture
            </Chip>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: ACHIP_L2, lineHeight: 1.15, color: C.inkSoft, background: C.cream, padding: '2px 16px', borderRadius: 10, whiteSpace: 'nowrap'}}>a separate test, not our kit clip · device data not released</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== S7.4b: the museum slot */

/*
 * D37: the same history shelf as S5/S6, built from S5_Museum's parts (read-only): its gallery (wall, pools of light,
 * skirting, floor), plinths with screwed saffron plates, brass rope posts and the velvet rope. A self-contained pair:
 * S5's third and fourth plinth spots (3020, 3980) at 480 and 1440 (S7 museum world = S5 world - 2540, so the pools,
 * posts and rope land where S5 has them), framed like S6.1's wide shot. The plate text is set as S6 sets it (display
 * line at y0 + 56, a 44 px body line at y0 + 112, fading in with a 0.92 -> 1 scale).
 */
const MUSEUM_CAM0: Cam = {cx: 960, cy: 540, zoom: 1};
const MUSEUM_CAM1: Cam = {cx: 1040, cy: 510, zoom: 1.1};
const MX = -2540;
const PA = MU.P[2] + MX;
const PB = MU.P[3] + MX;
const ROPE_POSTS = MU.posts.slice(2).map((x) => x + MX);
const SLOT = {w: 260, h: 262};
const CODE_W = 230;
const CODE_TOP = MU.slabTop - (CODE_W * 1.18 + 10); // CodeCard: page height 1.18 w, 10 px above its easel's feet
const FINAL_CHIP_TOP = 74;
const FINAL_CHIP_SIZE = 40;
{
  const bad: string[] = [];
  const pq = MU.plaque;
  if (!(PA === 480 && PB === 1440 && ROPE_POSTS.join() === '0,960,1920')) bad.push(`the shelf pair moved (${PA}, ${PB}; posts ${ROPE_POSTS.join()})`);
  // the rope's top edge clears the plates' bottom edge wherever it passes in front of a plate
  for (let i = 0; i + 1 < ROPE_POSTS.length; i++) {
    for (let k = 0; k <= 100; k++) {
      const p = ropePoint(ROPE_POSTS[i], MU.ropeY, ROPE_POSTS[i + 1], MU.ropeY, MU.sag, k / 100);
      const onPlate = [PA, PB].some((x) => Math.abs(p.x - x) <= pq.w / 2 + 4);
      if (onPlate && p.y - 17 < pq.y0 + pq.h + 4) bad.push(`the rope crosses a plate at x ${p.x.toFixed(0)}`);
    }
  }
  // the final chip sits above the code card and the empty slot all through the push (screen px)
  for (const cam of [MUSEUM_CAM0, MUSEUM_CAM1]) {
    const tops = [scr(cam, {x: PA, y: CODE_TOP}).y, scr(cam, {x: PB, y: MU.slabTop - SLOT.h - 6}).y];
    if (!(FINAL_CHIP_TOP + FINAL_CHIP_SIZE * 1.6 + 6 + 24 <= Math.min(...tops))) bad.push('the final chip reaches the exhibits');
    // the plate text inside the 5 % margins (the widest line, "independent" at 60 px, is under 420 px)
    for (const x of [PA, PB]) {
      const c = scr(cam, {x, y: pq.y0}).x;
      if (!(c - (210 * cam.zoom) >= SAFE.x0 && c + 210 * cam.zoom <= SAFE.x1)) bad.push(`plate text at x ${x} outside the margins`);
    }
  }
  if (bad.length) throw new Error(`S7 museum: ${bad.join('; ')}`);
}

/** Two lines of plate text (S6_Plinth's setting), fading in with a 0.92 -> 1 scale; `t` is a spring 0..1. */
const PlateText: React.FC<{x: number; top: string; bottom: string; t: number}> = ({x, top, bottom, t}) => {
  if (t <= 0) return null;
  const pq = MU.plaque;
  const k = (0.92 + 0.08 * t).toFixed(4);
  return (
    <g opacity={Math.min(1, t * 1.6)}>
      <g transform={`translate(${x} ${pq.y0 + 56}) scale(${k})`}>
        <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={60} fill={C.ink}>
          {top}
        </text>
      </g>
      <g transform={`translate(${x} ${pq.y0 + 112}) scale(${k})`}>
        <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.ink}>
          {bottom}
        </text>
      </g>
    </g>
  );
};

const Museum: React.FC<{g: number}> = ({g}) => {
  const cam = camPath(g, MUSEUM_CAM0, [{at: MUSEUM_PUSH0, dur: MUSEUM_PUSH_DUR, to: MUSEUM_CAM1}]);
  const top = MU.slabTop;
  return (
    <AbsoluteFill style={{background: PLINTH.wall}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <g transform={`translate(${MX} 0)`}>
              <MuseumHall />
              <ShelfPlinth x={MU.P[2]} />
              <ShelfPlinth x={MU.P[3]} />
            </g>
            <PlateText x={PA} top="code" bottom="public" t={sp(g, PLAQUE_A, SOFT)} />
            <PlateText x={PB} top="independent" bottom="reproduction" t={sp(g, PLAQUE_B, SOFT)} />
            {/* the code on its plinth; the empty slot: a dashed outline where an exhibit would stand */}
            <g transform={`translate(${PA} ${top})`}>
              <CodeCard w={CODE_W} />
            </g>
            <rect x={PB - SLOT.w / 2} y={top - SLOT.h - 6} width={SLOT.w} height={SLOT.h} rx={18} fill="none" stroke={C.inkMuted} strokeWidth={5} strokeDasharray="18 14" strokeLinecap="round" />
            {/* the velvet rope as S5 hangs it: spans post to post, the posts over the rope ends */}
            {ROPE_POSTS.slice(0, -1).map((x0, i) => (
              <RopeSpan key={`r${i}`} x0={x0} y0={MU.ropeY} x1={ROPE_POSTS[i + 1]} y1={MU.ropeY} sag={MU.sag} />
            ))}
            {ROPE_POSTS.map((x) => (
              <RopePost key={`p${x}`} x={x} />
            ))}
          </svg>
        </Layer>
      </Camera>
      {g >= FINAL_CHIP && (
        <div style={{position: 'absolute', left: 960, top: FINAL_CHIP_TOP, transform: 'translateX(-50%)'}}>
          <div style={popStyle(g, FINAL_CHIP, 'center')}>
            <Chip tone="ink" size={FINAL_CHIP_SIZE}>
              code public · no independent reproduction found (Oct 2026)
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
  if (g < S39_CUT) return <RoomShot g={g} />;
  if (g < CUT_MUSEUM) return <AuthorsTestCard g={g} />;
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
  // ... and rides the board's edge nearest him for the whole turn (D35)
  for (let f = TURN0; f <= TURN1 + 1; f++) {
    const pl: RigPlace = {...standAt(G.x0), scale: RIG_S, frame: f, seed: 22, life: 0.35};
    const hw = handWorld2(pl, guesserAt(f).pose, -1);
    const e = Math.hypot(hw.x - edgeX(turnAt(f)), hw.y - EDGE_Y);
    if (e > 1) bad.push(`his hand misses the board's edge by ${e.toFixed(2)} px at frame ${f} of the turn`);
  }
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
  // the "flat wall" tag (D36): from its pop to its exit her right mitt stays 12+ px outside the tag's box (its pop
  // overshoot allowed for), in the room camera's screen space
  for (let f = FLAT_IN; f <= SIDLE0 + 10; f++) {
    const cam = roomCam(f);
    const hw = scr(cam, handWorld2({x: OPR.x, y: OPR.y, scale: RIG_S, frame: f, seed: 9, life: 0.4}, checkerAt(f), 1));
    const tag = scr(cam, FLAT_TAG);
    const over = 1.05;
    const dx = Math.max(0, Math.abs(hw.x - tag.x) - FLAT_TAG_HALF.w * over);
    const dy = Math.max(0, Math.abs(hw.y - tag.y) - FLAT_TAG_HALF.h * over);
    if (Math.hypot(dx, dy) < MITT * cam.zoom + 12) bad.push(`her hand is ${(Math.hypot(dx, dy) - MITT * cam.zoom).toFixed(1)} px from the "flat wall" tag at frame ${f}`);
  }
  if (bad.length) throw new Error(`S7 contact: ${bad.join('; ')}`);
}

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (CUT_MUSEUM - K.start) / 30, note: 'S7 boards + room + the authors\' card'},
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
  {f: TURN1, kind: 'card_flick', gain: -8, note: 'board turned: the strip faces the wall'},
  {f: Math.round(FAT_HIT), kind: 'glint', gain: -10, pitch: 3, note: 'the fat return leaves the strip'},
  {f: CARD_IN, kind: 'paper_slide', gain: -3},
  {f: STAMP, kind: 'stamp_heavy', note: "files don't say"},
  {f: CARD_OUT, kind: 'paper_swish', gain: -6},
  // the shoo, the walk out, the scan, the sidle back
  {f: SHOO0 + 2, kind: 'shoo'},
  {f: SHOO0 + SHOO_PERIOD + 2, kind: 'shoo', gain: -3, pitch: 2},
  ...exitSteps.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -6 - i, pitch: i % 2})),
  {f: FLAT_IN, kind: 'chip_pop', gain: -5},
  {f: SCAN_TAP, kind: 'readout_beep', note: 'empty-room scan starts'},
  {f: SCAN_TAP + 2, kind: 'sensor_hum', dur: (SCAN_END - SCAN_TAP) / 30, gain: -6},
  {f: SCAN_END, kind: 'readout_beep', pitch: 5, note: 'scan done'},
  ...sidleSteps.map((f, i) => ({f, kind: 'tiptoe_step' as const, gain: -4, pitch: i % 2 ? 1 : -1})),
  // S7.4 the authors' separate test (card): film strip, walk, chip
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

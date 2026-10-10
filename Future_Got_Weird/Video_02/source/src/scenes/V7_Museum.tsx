import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {E, camPath, drop, impact, kf, ring, tw, type Ease} from '../lib/motion';
import {worldToScreen, type Cam} from '../lib/camera';
import {PLINTH} from '../lib/shots';
import {CAST} from '../components/cast';
import {ScrollRoll} from '../components/v02/S5_Board';
import {ropePoint} from '../components/v02/S5_Museum';
import {E21} from '../components/v02/S5_Exhibits';
import {GripFingers, ReachArm} from '../components/v02/S6_Plinth';
import {GenericPhone, PHONE, PHONE_SCREEN, Padlock} from '../components/v02/S6_Phone';
import {HandheldSensor} from '../components/v02/HandheldSensor';
import {QuestionTitle} from '../components/v2k/QuestionTitle';
import {Chip, Overlay, SubLabel, leaderEnds} from '../components/v2k/Labels';
import {MU7, SPOT_DIM, lerpSpot, type Spot} from '../components/v2s/V7_Set';
import {DotModule, FrameFan, FAN, FAN_NUDGE_MAX, fanPose} from '../components/v2s/V7_Props';
import {BOX_CENTRE, CAM_TIGHT, MuseumShot, P4, SENSOR_ORIGIN, SENSOR_SPOT, SETTLED_SPANS, S_K, TIGHT_SPOT, TIGHT_STATE, TightShot, type MuseumState, type RopeSpanState} from '../components/v2s/V7_Plinth';

/**
 * V7 · Museum bridge (n14, n15, s30, s31, n16). v2/SHOTPLAN_V2.md V7; adapted from v1 S5 (S5_Museum, S5_Exhibits) and
 * S6.1–S6.2 (S6_Plinth arm, S6_Phone). All exhibits are generic illustrations based on the papers (no brands, no copies
 * of paper figures, no equipment names, no timing numbers).
 *
 *  In    V6 ends with its board rolled into a paper scroll (S5_Board ScrollRoll at screen cx 960, cy 430, len 560, r 46,
 *        spin 0, sw 4) on PLINTH.wall for 6 frames. V7's first frame is that frame: a close framing (zoom 2) of bare
 *        museum wall, with the identical scroll drawn at the identical place and size.
 *  V7.1  n14 The scroll drops onto the first ledge (the camera follows it down and pulls back), then a brisk truck
 *        along the shelf: "2012 · MIT" (the table-sized rig; on "rebuilt" the beam lights the wall, on "3D shape" a
 *        teal mannequin outline rises), the "2018 · Stanford" plate in passing (the truck slows over it), "2021 ·
 *        Wisconsin + Milan" (the big laser fires, the strip detector lights, on "live video" the monitor plays a
 *        blobby live picture). Chapter title "How new is this?" (QuestionTitle, 2 s, not spoken). Chip
 *        "illustrations based on the papers" (30).
 *  V7.2  n15 Pull back to the shelf: on "But those ran on" the velvet rope clips across the three exhibits post by
 *        post and the "research equipment" sign drops onto it. On "One team" the hall lights dim and a spotlight
 *        sweeps along the shelf, past the empty fourth plinth, and finds the stool at the shelf's end: a
 *        fingertip-sized sensor board; its card "2021 · tracking with a cheap sensor kit (Callenberg et al.)" (40);
 *        the board blinks on "cheap sensor". The card goes dark as the spotlight leaves on "Then"; it is never in
 *        another framing.
 *  V7.3  s30 The spotlight swings back and isolates the empty fourth plinth. The checker's arm carries her small
 *        sensor in from above and sets it on the plinth (grip foot on the slab on "2026", hand off, it rocks once);
 *        plate "published 2026 · MIT + Dartmouth" (40+). One push in; "time-of-flight sensors (LiDAR)" (48). The
 *        spotlight tightens on the sensor and MATCHES to the two drawn hardware types: the kit at the same place and
 *        size on plain paper (the style visibly changes), "off-the-shelf kit" (40); then a smartphone-grade research
 *        device (saffron slab, uncountable dot field, no brand) slides in beside it, "smartphone-grade research
 *        device" (40).
 *  V7.4  s31 Cut: a generic phone slides in showing raw data; a padlock drops onto it and snaps shut on "private".
 *        "not on your phone (yet)" (48), "per the lead researcher, in interviews" (30).
 *  V7.5  n16 Cut back to the plinth, wide: on "a model that keeps track" a stack of faint frames fans out from the
 *        sensor like cards; on "what moved", card after card, the figure slides from where it was to where it is
 *        while a small arrow draws, and the card is nudged the way it moved; on "weak frames" they fold back into the
 *        sensor. "their new idea (2026)" (48). The plinth plates fade off, then the spotlight tightens on the sensor
 *        (CAM_TIGHT / TIGHT_SPOT): V7's last frames are V8.1's first (TightShot).
 */

/* ================================================================== cues (narration words; nothing absolute) */

const SC = scene('V7');
const K = {
  start: SC.from,
  end: SC.to,
  // n14
  y2012: at('n14', '2012'),
  mit: at('n14', 'MIT'),
  rebuilt: at('n14', 'rebuilt'),
  threeD: at('n14', '3D'),
  mannequin: at('n14', 'mannequin'),
  by: at('n14', 'By'),
  y2021: at('n14', '2021'),
  others: at('n14', 'others'),
  live: at('n14', 'live'),
  corners: at('n14', 'corners'),
  n14end: segEnd('n14'),
  // n15
  but: at('n15', 'But'),
  research: at('n15', 'research'),
  one: at('n15', 'One'),
  tracked: at('n15', 'tracked'),
  hidden: at('n15', 'hidden'),
  objects: at('n15', 'objects'),
  cheap: at('n15', 'cheap'),
  sensor15: at('n15', 'sensor'),
  // s30
  then: at('s30', 'Then'),
  y2026: at('s30', '2026'),
  mit30: at('s30', 'MIT'),
  tried: at('s30', 'tried'),
  tof: at('s30', 'time-of-flight'),
  sensors: at('s30', 'sensors'),
  often: at('s30', 'often'),
  lidar: at('s30', 'LiDAR'),
  phones: at('s30', 'phones'),
  // s31
  dont: at('s31', "Don't"),
  phone31: at('s31', 'phone'),
  yet: at('s31', 'yet'),
  keep: at('s31', 'keep'),
  priv: at('s31', 'private'),
  // n16
  their: at('n16', 'Their'),
  idea: at('n16', 'idea'),
  model: at('n16', 'model'),
  what: at('n16', 'what'),
  many: at('n16', 'many'),
  combined: at('n16', 'combined'),
  n16end: segEnd('n16'),
};

/* ================================================================== beats (derived from the cues) */

// V7.1 · the drop, the truck. The first frame is V6's last (the still scroll on bare wall); the tilt down to the ledge
// and the drop both start on the very next frame, so the ledge is in shot within a few frames of the cut and the
// rolled board never hangs alone on blank wall on this side of the cut (v2 review r1, V2-R1-28).
const FALL0 = K.start;
const FALL_DUR = 14;
const LAND = FALL0 + FALL_DUR;
const MOVE_L = K.start;
const MOVE_L_DUR = 22;
/** the tilt's ease: an even ~28 px a frame from the first frame after the cut (no jolt out of the still match frame),
 *  the ledge's top in shot from that frame on, then a long settle */
const TILT_IN: Ease = Easing.bezier(0.3, 0.55, 0.3, 1);
const TRUCK1 = Math.max(LAND + 10, MOVE_L + MOVE_L_DUR + 2);
const TRUCK1_DUR = Math.max(22, Math.min(30, K.mit + 6 - TRUCK1));
const ARRIVE1 = TRUCK1 + TRUCK1_DUR;
const TITLE0 = K.start + 6;
const TITLE1 = TITLE0 + 60; // 2 s on screen (fades included), not spoken
const BEAM1 = Math.max(ARRIVE1 + 2, K.rebuilt - 2);
const BEAM1_DUR = 15;
const SCATTER1 = BEAM1 + BEAM1_DUR;
const SKETCH0 = Math.max(SCATTER1 + 10, K.threeD - 2);
const SKETCH_DUR = Math.max(20, Math.min(36, K.mannequin + 10 - SKETCH0));
// the truck leaves the finished 2012 outline on "mannequin" and passes the 2018 plate in the pause before "By", so the
// 2021 plate (not the 2018 one) is centred when the voice says "2021"
const TRUCK2 = Math.max(SKETCH0 + SKETCH_DUR + 2, K.mannequin - 2);
const TRUCK2_DUR = Math.max(36, Math.min(54, K.y2021 + 8 - TRUCK2));
const ARRIVE3 = TRUCK2 + TRUCK2_DUR;
const WARM3 = ARRIVE3 - 10;
const FIRE3 = Math.max(ARRIVE3 + 4, K.others - 8);
const VIDEO0 = Math.max(FIRE3 + 12, K.live - 2);
// V7.2 · the rope and the sign, the spotlight to the stool
const PULL = Math.max(VIDEO0 + 30, K.but - 8);
const PULL_DUR = Math.max(20, Math.min(30, K.research - 6 - PULL));
const VIDEO_END = PULL + PULL_DUR; // the monitor holds its last picture from here (no perpetual motion)
const ROPE0 = PULL + PULL_DUR - 8;
const ROPE_SEG = 6;
const CLIP = [1, 2, 3].map((i) => ROPE0 + ROPE_SEG * i);
const SIGN_LAND = Math.max(CLIP[1] + 6, K.research + 6);
const SIGN_FALL = 9;
const DIM0 = K.one - 4;
const TRUCK_S = K.one - 2;
const TRUCK_S_DUR = Math.max(30, Math.min(44, K.hidden - TRUCK_S));
const ARRIVE_S = TRUCK_S + TRUCK_S_DUR;
const CARD = ARRIVE_S + 4;
const LED = K.cheap;
const PING = Math.max(CARD + 10, K.sensor15 - 2);
// V7.3 · the swing back, the arm, the push, the match
const SWING0 = K.then - 2;
const SWING_DUR = 26;
const CONTACT = K.y2026; // the sensor's grip foot touches the plinth on "2026"
const ARM_IN = CONTACT - 30;
const HOVER = CONTACT - 11;
const RELEASE = CONTACT + 5;
const RELEASE_END = RELEASE + 7;
const ARM_GONE = RELEASE_END + 24;
const WAKE = CONTACT + 10;
const PUSH0 = Math.max(ARM_GONE + 4, K.tried - 6);
const PUSH_DUR = Math.max(16, Math.min(30, K.tof - 2 - PUSH0));
const TOF_LBL = K.tof;
const IRIS0 = K.sensors + 4;
const IRIS_DUR = 14;
const MATCH = Math.max(IRIS0 + IRIS_DUR + 2, K.often - 2);
const KIT_MOVE0 = MATCH + 2;
const KIT_MOVE_DUR = 14;
const KIT_LBL = KIT_MOVE0 + KIT_MOVE_DUR;
const MOD0 = KIT_LBL + 8;
const MOD_DUR = 14;
const MOD_LBL = MOD0 + MOD_DUR + 2;
// V7.4 · the phone
const CUT_PHONE = K.dont - 4;
const PHONE_IN = CUT_PHONE - 3;
const PHONE_LAND = PHONE_IN + 16;
const PHONE_LBL = K.phone31 - 2;
const SRC_LBL = K.yet;
const LOCK_LAND = Math.max(K.keep + 2, PHONE_LAND + 8);
const LOCK_FALL = 10;
// V7.5 · the fan, the tight spotlight
const CUT_FAN = K.their - 3;
const IDEA_LBL = K.idea - 4;
const FAN0 = K.model - 4;
const FAN_DUR = Math.max(16, Math.min(30, K.what - 4 - FAN0));
const ARROWS0 = K.what - 4;
// on "what moved", card after card (left to right): its figure slides from where it was to where it is as its arrow
// draws, and the card is nudged the way the figure moved (v2 review r1, V2-R1-30: the fan no longer sits still under
// "keeps track of what moved, so many weak frames")
const ARROW_STEP = 6;
const ARROW_DUR = 10;
const NUDGE = 10; // card-local px (≈ 13 px on screen), <= FAN_NUDGE_MAX
const NUDGE_DUR = 12;
const arrowAt = (k: number) => ARROWS0 + ARROW_STEP * k;
// the frames fold back into the sensor on "weak frames", after the full fan has held briefly with all its arrows
const FOLD0 = Math.max(arrowAt(FAN.n - 1) + ARROW_DUR + 8, K.many + 8);
const FOLD_DUR = 14;
const TIGHT0 = Math.max(FOLD0 + 12, K.combined - 18);
const TIGHT_DUR = Math.max(18, Math.min(30, K.end - 6 - TIGHT0));
const TIGHT_DONE = TIGHT0 + TIGHT_DUR;
// the plinth plates fade off before the push into the tight spotlight (none passes through the caption band;
// v2 review r1, V2-R1-29)
const PLATE_FADE = 10;
const PLATE_OUT0 = TIGHT0 - PLATE_FADE;
const platesAt = (g: number) => 1 - tw(g, PLATE_OUT0, PLATE_FADE, E.linear);

// beats in order, inside the scene, with the reads the shot plan asks for
{
  const order: [string, number][] = [
    ['start', K.start], ['LAND', LAND], ['ARRIVE1', ARRIVE1], ['TRUCK2', TRUCK2], ['ARRIVE3', ARRIVE3], ['VIDEO0', VIDEO0], ['PULL', PULL],
    ['SIGN_LAND', SIGN_LAND], ['TRUCK_S', TRUCK_S], ['CARD', CARD], ['SWING0', SWING0], ['ARM_IN', ARM_IN], ['CONTACT', CONTACT],
    ['ARM_GONE', ARM_GONE], ['PUSH0', PUSH0], ['IRIS0', IRIS0], ['MATCH', MATCH], ['MOD_LBL', MOD_LBL], ['CUT_PHONE', CUT_PHONE],
    ['LOCK_LAND', LOCK_LAND], ['CUT_FAN', CUT_FAN], ['FAN0', FAN0], ['FOLD0', FOLD0], ['TIGHT_DONE', TIGHT_DONE], ['end', K.end],
  ];
  for (let i = 1; i < order.length; i++) if (!(order[i][1] > order[i - 1][1])) throw new Error(`V7: beat ${order[i][0]} (${order[i][1]}) is not after ${order[i - 1][0]} (${order[i - 1][1]})`);
  if (!(ARM_IN >= SWING0 + SWING_DUR - 6)) throw new Error('V7.3: the arm comes in before the swing has landed on the plinth');
  if (!(SWING0 - CARD >= 45)) throw new Error(`V7.2: the cheap-sensor card gets ${SWING0 - CARD} frames (< 1.5 s)`);
  if (!(CUT_PHONE - MOD_LBL >= 45)) throw new Error(`V7.3: the hardware-type labels get ${CUT_PHONE - MOD_LBL} frames (< 1.5 s)`);
  if (!(K.end - TIGHT_DONE >= 3)) throw new Error('V7.5: the tight spotlight must hold at least 3 frames before V8');
  if (!(FOLD0 + FAN.n - 1 + FOLD_DUR <= TIGHT0 + 8)) throw new Error('V7.5: the frames are still folding well into the tight push');
  if (!(NUDGE <= FAN_NUDGE_MAX)) throw new Error('V7.5: the card nudge is larger than the fan allows');
  if (!(arrowAt(FAN.n - 1) + 4 + NUDGE_DUR <= FOLD0)) throw new Error('V7.5: the last card is still being nudged when the fan folds');
  if (!(PLATE_OUT0 >= FOLD0)) throw new Error('V7.5: the plates fade before the fold has started (keep the wide shot intact under "what moved")');
}

/* ================================================================== framings (world px) */

const [P1, P2, P3] = MU7.P;
/** V7's first frame: bare wall, zoom 2; the scroll (world len 280, r 23) sits where V6 leaves it on screen */
const CAM0: Cam = {cx: MU7.ledge.x0 + (MU7.ledge.x1 - MU7.ledge.x0) / 2, cy: 150, zoom: 2};
const SCROLL_W = {len: 280, r: 23, sw: 2};
const SCROLL0 = {x: CAM0.cx + (960 - 960) / CAM0.zoom, y: CAM0.cy + (430 - 540) / CAM0.zoom};
/** follows the drop: the ledge, the landing scroll, the start of the shelf */
const CAM_L: Cam = {cx: 60, cy: 330, zoom: 1.4};
const CU1: Cam = {cx: P1 + 64, cy: 440, zoom: 1.3};
const CU3: Cam = {cx: P3, cy: 440, zoom: 1.3};
/** the shelf with the rope: the three exhibits and the start of the empty fourth plinth */
const WIDE: Cam = {cx: 1900, cy: 520, zoom: 0.7};
const CAM_STOOL: Cam = {cx: MU7.stool.x, cy: 560, zoom: 1.1};
const CAM_P4: Cam = {cx: P4 + 60, cy: 470, zoom: 1.1};
/** the push: the kit sensor's origin lands at screen (700, 610), leaving the right of frame for the second type */
const KIT_AT = {x: 700, y: 610};
const Z_CLOSE = 1.35;
const CAM_P4_CLOSE: Cam = {cx: SENSOR_ORIGIN.x - (KIT_AT.x - 960) / Z_CLOSE, cy: SENSOR_ORIGIN.y - (KIT_AT.y - 540) / Z_CLOSE, zoom: Z_CLOSE};
/** wide on the plinth, low enough that the open fan (radius 400 round the sensor) clears the top of the frame */
const CAM_FAN: Cam = {cx: BOX_CENTRE.x, cy: 330, zoom: 1.0};

/** the 2018 plate read in passing: a truck that slows to about a third of its speed over the middle plinth */
const SLOW_PASS: Ease = (t) => {
  const s = t * t * (3 - 2 * t);
  return s + (0.7 * Math.sin(2 * Math.PI * s)) / (2 * Math.PI);
};

/** V7.1's truck to the 2012 exhibit: its height and zoom lead its sideways travel. The rise starts RISE_LEAD frames
 *  before the truck, out of the tilt's settle (it accelerates from rest, no jolt), and is mostly done by the time the
 *  plate's text slides in from the right, so the "2012 · MIT" plate is already at exhibit height and its text never
 *  passes through the caption band (with one ease for both it rose through y 950–1060 at about 4466–4472). */
const RISE_LEAD = 6;
const RISE0 = TRUCK1 - RISE_LEAD;
const TRUCK1_RISE: Ease = Easing.bezier(0.3, 0, 0.15, 1);

const camAt = (g: number): Cam => {
  if (g >= CUT_FAN) return camPath(g, CAM_FAN, [{at: TIGHT0, dur: TIGHT_DUR, to: CAM_TIGHT, ease: E.inOut}]);
  const path = (truck1: {at: number; dur: number; ease: Ease}) =>
    camPath(g, CAM0, [
      {at: MOVE_L, dur: MOVE_L_DUR, to: CAM_L, ease: TILT_IN},
      {...truck1, to: CU1},
      {at: TRUCK2, dur: TRUCK2_DUR, to: CU3, ease: SLOW_PASS},
      {at: PULL, dur: PULL_DUR, to: WIDE, ease: E.inOut},
      {at: TRUCK_S, dur: TRUCK_S_DUR, to: CAM_STOOL, ease: E.inOut},
      {at: SWING0, dur: SWING_DUR, to: CAM_P4, ease: E.inOut},
      {at: PUSH0, dur: PUSH_DUR, to: CAM_P4_CLOSE, ease: E.inOut},
    ]);
  const c = path({at: TRUCK1, dur: TRUCK1_DUR, ease: E.inOut});
  if (g <= RISE0 || g >= ARRIVE1) return c;
  // sideways from the truck, height and zoom from the rise (both end on CU1 at ARRIVE1)
  const v = path({at: RISE0, dur: ARRIVE1 - RISE0, ease: TRUCK1_RISE});
  return {cx: c.cx, cy: v.cy, zoom: v.zoom};
};

// the stool's card is outside every framing of the fourth plinth (SHOTPLAN V7.2; v1 S5 review defect 1)
{
  const cardX0 = MU7.card.x - MU7.card.w / 2;
  for (const [name, cam] of [['CAM_P4', CAM_P4], ['CAM_P4_CLOSE', CAM_P4_CLOSE], ['CAM_FAN', CAM_FAN], ['CAM_TIGHT', CAM_TIGHT]] as [string, Cam][]) {
    const right = cam.cx + 960 / cam.zoom;
    if (right >= cardX0 - 40) throw new Error(`V7: ${name} reaches the stool's card (frame right edge x ${right.toFixed(0)} >= ${cardX0 - 40})`);
  }
  // V7's first frame sees only bare wall: no ledge, lamp, pool or plinth inside it
  const x0 = CAM0.cx - 960 / CAM0.zoom;
  const x1 = CAM0.cx + 960 / CAM0.zoom;
  const y0 = CAM0.cy - 540 / CAM0.zoom;
  const y1 = CAM0.cy + 540 / CAM0.zoom;
  if (!(y1 < MU7.ledge.y - 3 && y0 > MU7.railY + 12 && x1 < P1 - MU7.pool.rx && x0 > -3000)) throw new Error(`V7: the first framing (${x0}..${x1}, ${y0}..${y1}) is not bare wall`);
  // the open fan stays inside the safe area under CAM_FAN (every card corner, at rest and at the peak of its nudge)
  for (let k = 0; k < FAN.n; k++) {
    const p = fanPose(k, 1);
    const r = (p.rot * Math.PI) / 180;
    for (const nx of [0, NUDGE]) {
      for (const [lx, ly] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const cx = ((lx * FAN.cardW) / 2 + nx) * p.s;
        const cy = (ly * FAN.cardH * p.s) / 2;
        const c = worldToScreen(CAM_FAN, BOX_CENTRE.x + p.x + cx * Math.cos(r) - cy * Math.sin(r), BOX_CENTRE.y + p.y + cx * Math.sin(r) + cy * Math.cos(r));
        if (!(c.y >= 54 && c.x >= 96 && c.x <= 1824)) throw new Error(`V7.5: fan card ${k} leaves the safe area (corner at ${c.x.toFixed(0)}, ${c.y.toFixed(0)})`);
      }
    }
  }
  // V7.1: the "2012 · MIT" plate's text (its two lines lie within x ± 80, y0 + 30 .. y0 + 131 world px) is never on
  // screen inside the caption band while it slides in on the truck
  if (!(TRUCK2 >= ARRIVE1)) throw new Error('V7.1: the truck to the 2012 exhibit overlaps the next truck');
  if (!(RISE0 >= LAND + 3)) throw new Error('V7.1: the camera starts rising before the scroll has landed');
  for (let g = RISE0; g <= ARRIVE1; g++) {
    const cam = camAt(g);
    const a = worldToScreen(cam, P1 - 80, MU7.plaque.y0 + 30);
    const b = worldToScreen(cam, P1 + 80, MU7.plaque.y0 + 131);
    if (b.x > 0 && a.x < 1920 && b.y > 950) throw new Error(`V7.1: at ${g} the 2012 plate's text reaches y ${b.y.toFixed(0)} (caption band)`);
  }
  // V7.5 → V8: no plinth plate is on screen inside the caption band (y >= 950) at any frame of the wide shot or the push
  for (let g = CUT_FAN; g < TIGHT_DONE; g++) {
    if (platesAt(g) <= 0.001) continue;
    const cam = camAt(g);
    for (const x of MU7.P) {
      const a = worldToScreen(cam, x - MU7.plaque.w / 2, MU7.plaque.y0);
      const b = worldToScreen(cam, x + MU7.plaque.w / 2, MU7.plaque.y0 + MU7.plaque.h);
      const onScreen = b.x > 0 && a.x < 1920 && a.y < 1080;
      if (onScreen && b.y > 950) throw new Error(`V7.5: at ${g} the plate on plinth ${x} reaches y ${b.y.toFixed(0)} (caption band) while still visible (${platesAt(g).toFixed(2)})`);
    }
  }
}

/* ================================================================== spotlight keys */

const FLOOR = MU7.floorY;
const SPOT_SWEEP0: Spot = {x: P3, y: FLOOR, rx: 330, ry: 46, top: 60, dim: SPOT_DIM};
const SPOT_STOOL: Spot = {x: MU7.stool.x, y: FLOOR, rx: 190, ry: 34, top: 44, dim: SPOT_DIM};
const SPOT_P4: Spot = {x: P4, y: FLOOR, rx: 340, ry: 50, top: 64, dim: SPOT_DIM};
const SPOT_FAN: Spot = {x: BOX_CENTRE.x, y: FLOOR, rx: 600, ry: 60, top: 480, dim: SPOT_DIM};

const spotAt = (g: number): Spot => {
  if (g >= CUT_FAN) return lerpSpot(SPOT_FAN, TIGHT_SPOT, tw(g, TIGHT0, TIGHT_DUR, E.inOut));
  const dim = SPOT_DIM * tw(g, DIM0, 10, E.inOut);
  // the spot runs along the rail a little ahead of the camera, from the 2021 exhibit to the stool; then back to the
  // fourth plinth; then it narrows onto the sensor (the match)
  let s: Spot = SPOT_SWEEP0;
  s = lerpSpot(s, SPOT_STOOL, tw(g, TRUCK_S - 2, TRUCK_S_DUR - 4, E.inOut));
  s = lerpSpot(s, SPOT_P4, tw(g, SWING0, SWING_DUR - 4, E.inOut));
  s = lerpSpot(s, TIGHT_SPOT, tw(g, IRIS0, IRIS_DUR, E.inOut));
  return {...s, dim};
};

/* ================================================================== the scroll (V6 → V7 match) */

const LAND_Y = MU7.ledge.y - SCROLL_W.r;
const scrollWorld = (g: number) => {
  if (g <= FALL0) return {x: SCROLL0.x, y: SCROLL0.y, spin: 0, sx: 1, sy: 1};
  if (g < LAND) {
    const u = (g - FALL0) / FALL_DUR;
    return {x: SCROLL0.x, y: SCROLL0.y + (LAND_Y - SCROLL0.y) * u * u, spin: -2.2 * u, sx: 1, sy: 1};
  }
  const [sx, sy] = impact(g, LAND, 0.16, 10);
  const roll = 10 * ring(g, LAND + 3, 0.3, 0.12);
  return {x: SCROLL0.x + roll, y: LAND_Y + drop(g, LAND, 30, 1) * (g > LAND && g < LAND + 8 ? 1 : 0) + SCROLL_W.r * (1 - sy), spin: -2.2 - roll / SCROLL_W.r, sx, sy};
};

/* ================================================================== museum state per frame */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const BALL_REST = 214;
/** the recovered 2012 outline rises only this far toward S5's end point (the 2018 rig is nearer than in v1) */
const SKETCH_RISE = 0.78;

const museumState = (g: number): MuseumState => {
  // 2012
  const lights1 = 1 - tw(g, TRUCK2 + 6, 12, E.inOut);
  const sketchOut = 1 - tw(g, TRUCK2 + 4, 12, E.inOut);
  const flash = g >= BEAM1 && g < BEAM1 + 14 ? ((g - BEAM1) % 7) / 7 : 0;
  const e12 = {
    beam: tw(g, BEAM1, BEAM1_DUR, E.linear) * lights1,
    scatter: tw(g, SCATTER1, 12, E.linear) * lights1,
    view: tw(g, SCATTER1 + 12, 8, E.linear) * lights1,
    flash,
    sketch: sketchOut > 0.001 && g >= SKETCH0 ? {draw: tw(g, SKETCH0, SKETCH_DUR * 0.8, E.inOut) * sketchOut, rise: SKETCH_RISE * tw(g, SKETCH0, SKETCH_DUR, E.inOut)} : undefined,
  };
  // 2021: the strip arms, the laser fires, the monitor plays a blobby live picture (redrawn every 6 frames), then holds
  const gv = Math.min(g, VIDEO_END);
  const ballAt = (f: number) => lerp(E21.ballRange[0], E21.ballRange[1], 0.5 - 0.5 * Math.cos((Math.max(0, f - (VIDEO0 - 8)) / 46) * Math.PI));
  const ballPos = (f: number) => lerp(ballAt(f), BALL_REST, tw(f, PULL, PULL_DUR, E.inOut));
  const frameIdx = gv >= VIDEO0 ? Math.floor((gv - VIDEO0) / 6) : -1;
  const cells = g < WARM3 ? 0 : g < FIRE3 ? Math.min(8, (g - WARM3) / 2) : g >= VIDEO0 && g < VIDEO_END ? 8 * (0.55 + 0.45 * Math.abs(Math.sin(Math.floor((g - VIDEO0) / 6) * 1.7))) : g >= VIDEO_END ? 6 : 8;
  const e21 = {
    beam: tw(g, FIRE3, 8, E.linear),
    view: tw(g, FIRE3 + 8, 8, E.linear),
    cells,
    monitor: g >= FIRE3 + 6 ? 1 : 0,
    ballX: ballPos(gv),
    frameBallX: frameIdx >= 0 ? ballPos(VIDEO0 + frameIdx * 6) : ballPos(VIDEO0),
    frameIdx: g >= VIDEO_END ? 0 : frameIdx,
  };
  // the rope clips across post by post, then the sign drops onto the middle span's hook
  const spans: (RopeSpanState | null)[] = [0, 1, 2].map((i) => {
    const t0 = ROPE0 + ROPE_SEG * i;
    if (g < t0) return null;
    const a = MU7.posts[i];
    const b = MU7.posts[i + 1];
    const u = clamp01((g - t0) / ROPE_SEG);
    const ue = E.inOut(u);
    if (u < 1) return {x0: a, y0: MU7.ropeY, x1: lerp(a, b, ue), y1: MU7.ropeY - 70 * Math.sin(Math.PI * ue), sag: MU7.sag * ue * 0.9};
    return {...SETTLED_SPANS[i], sag: MU7.sag * (1 + 0.16 * ring(g, CLIP[i], 0.45, 0.16))};
  });
  const s1 = spans[1];
  const hook = s1 && g >= CLIP[1] ? ropePoint(s1.x0, s1.y0, s1.x1, s1.y1, s1.sag, 0.5) : null;
  const signU = clamp01((g - (SIGN_LAND - SIGN_FALL)) / SIGN_FALL);
  const sign = hook && g >= SIGN_LAND - SIGN_FALL ? {x: hook.x, y: hook.y - (1 - signU * signU) * 260, rot: g >= SIGN_LAND ? 9 * ring(g, SIGN_LAND, 0.42, 0.11) : 0} : null;
  // the stool: the card lights with the spotlight, the board blinks and pings on "cheap sensor"; dark as the spot leaves
  const card = tw(g, CARD, 8, E.linear) * (1 - tw(g, SWING0, 8, E.linear));
  const led = g >= LED && g < LED + 30 ? (Math.floor((g - LED) / 5) % 2 === 0 ? 1 : 0) : 0;
  const stool = {led, ping: tw(g, PING, 22, E.linear), hop: g >= LED - 1 && g <= LED + 9 ? -14 * Math.sin(((g - LED + 1) / 10) * Math.PI) : 0, card};
  // the kit sensor on the fourth plinth (carried in until CONTACT: drawn by the arm layer)
  const teeter = 5.5 * ring(g, RELEASE_END, 0.8, 0.2);
  const sensor = g >= CONTACT ? {x: SENSOR_ORIGIN.x, y: SENSOR_ORIGIN.y, teeter, led: tw(g, WAKE, 5), reveal: tw(g, WAKE + 2, 24, E.inOut)} : null;
  return {e12, e21, spans, sign, p4: {t1: tw(g, CONTACT + 4, 8, E.linear), t2: tw(g, K.mit30, 8, E.linear)}, stool, sensor};
};

/* ================================================================== the checker's arm (V7.3) */

const HOLD = 30;
const C_HAND = {x: SENSOR_SPOT.x, y: SENSOR_SPOT.y - (14 + HOLD) * S_K};
const SHOULDER = {x: P4 + 670, y: -380};
const H_OUT = {x: P4 + 290, y: -150};
const H_HOVER = {x: C_HAND.x + 30, y: C_HAND.y - 92};
const H_REL = {x: C_HAND.x + 110, y: C_HAND.y};
const H_GONE = {x: P4 + 330, y: -170};
const handAt = (g: number) => ({
  x: kf(g, [[ARM_IN, H_OUT.x], [HOVER, H_HOVER.x, E.out], [CONTACT, C_HAND.x, E.inOut], [RELEASE, C_HAND.x], [RELEASE_END, H_REL.x, E.inOut], [ARM_GONE, H_GONE.x, E.in]]),
  y: kf(g, [[ARM_IN, H_OUT.y], [HOVER, H_HOVER.y, E.out], [CONTACT, C_HAND.y, E.inOut], [RELEASE, C_HAND.y], [RELEASE_END, H_REL.y, E.inOut], [ARM_GONE, H_GONE.y, E.in]]),
});

/** The arm itself is always drawn BEHIND the sensor (in MuseumShot's `under` slot, before the placed sensor), so the
 *  sensor box stays in front of the sleeve before and after contact (no layering pop at CONTACT). */
const ArmUnder: React.FC<{g: number}> = ({g}) => {
  if (g < ARM_IN || g > ARM_GONE) return null;
  return <ReachArm hand={handAt(g)} shoulder={SHOULDER} k={S_K} skin={CAST.checker.skin} sleeve={CAST.checker.overlayColor ?? C.coral} />;
};

/** The held sensor (before contact), her fingers round its grip and the contact ticks, in front of the sensor. */
const ArmLayer: React.FC<{g: number}> = ({g}) => {
  if (g < ARM_IN || g > ARM_GONE) return null;
  const hand = handAt(g);
  const held = g < CONTACT;
  const tickT = g >= CONTACT && g < CONTACT + 7 ? 1 - (g - CONTACT) / 7 : 0;
  return (
    <g>
      {held && (
        <g transform={`translate(${hand.x} ${hand.y + HOLD * S_K})`}>
          <HandheldSensor scale={S_K} reveal={0} led={0} />
        </g>
      )}
      {g < RELEASE && <GripFingers x={hand.x} y={hand.y} k={S_K} skin={CAST.checker.skin} />}
      {tickT > 0 && (
        <g stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={tickT}>
          <path d={`M ${SENSOR_ORIGIN.x - 24} ${SENSOR_SPOT.y - 4} L ${SENSOR_ORIGIN.x - 44} ${SENSOR_SPOT.y - 14}`} />
          <path d={`M ${SENSOR_ORIGIN.x + 24} ${SENSOR_SPOT.y - 4} L ${SENSOR_ORIGIN.x + 44} ${SENSOR_SPOT.y - 14}`} />
        </g>
      )}
    </g>
  );
};

/* ================================================================== screen labels */

/** "time-of-flight sensors (LiDAR)" (48): one line, centred; "(LiDAR)" fades into space reserved from the start, so the
 *  settled label never moves. Same screen place in the plinth push and the hardware-types shot. */
const TOF = {x: 980, y: 196, size: 48};
const TofLabel: React.FC<{t: number; t2: number; leader?: {x: number; y: number}}> = ({t, t2, leader}) => {
  if (t <= 0.001) return null;
  const w = 760;
  const ends = leader ? leaderEnds({x0: TOF.x - w / 2, x1: TOF.x + w / 2, y0: TOF.y - TOF.size * 0.74, y1: TOF.y + TOF.size * 0.2}, leader, 12, 10) : null;
  return (
    <Overlay>
      <g opacity={clamp01(t)}>
        {ends && (
          <g>
            <path d={`M ${ends.s.x} ${ends.s.y} L ${ends.e.x} ${ends.e.y}`} stroke={C.white} strokeWidth={10} strokeLinecap="round" />
            <path d={`M ${ends.s.x} ${ends.s.y} L ${ends.e.x} ${ends.e.y}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        <text x={TOF.x} y={TOF.y} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={TOF.size} fill={C.ink} stroke={C.white} strokeWidth={8} strokeLinejoin="round" paintOrder="stroke">
          time-of-flight sensors <tspan opacity={clamp01(t2)}>(LiDAR)</tspan>
        </text>
      </g>
    </Overlay>
  );
};

/* ================================================================== shots */

const MuseumPart: React.FC<{g: number}> = ({g}) => {
  const cam = camAt(g);
  const spot = spotAt(g);
  const st = museumState(g);
  // the scroll in screen px (V7's first frame: exactly V6's last)
  const sw = scrollWorld(g);
  const sp = worldToScreen(cam, sw.x, sw.y);
  const title = <QuestionTitle text="How new is this?" from={TITLE0} to={TITLE1} frame={g} />;
  const chip = tw(g, TITLE0 + 20, 8, E.linear) * (1 - tw(g, SWING0, 8, E.linear));
  // the label's leader to the sensor box's top-right corner (screen)
  const boxTR = worldToScreen(cam, SENSOR_ORIGIN.x + 51 * S_K, SENSOR_ORIGIN.y - 120 * S_K);
  const screen = (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ScrollRoll cx={sp.x} cy={sp.y} len={SCROLL_W.len * cam.zoom} r={SCROLL_W.r * cam.zoom} spin={sw.spin} sw={SCROLL_W.sw * cam.zoom} sx={sw.sx} sy={sw.sy} />
      </svg>
      {title}
      <Chip x={1824} y={54} anchor="end" size={30} opacity={chip}>
        illustrations based on the papers
      </Chip>
      <TofLabel t={tw(g, TOF_LBL, 6, E.linear)} t2={tw(g, K.lidar, 6, E.linear)} leader={{x: boxTR.x + 6, y: boxTR.y - 4}} />
    </>
  );
  return <MuseumShot cam={cam} spot={spot} state={st} under={<ArmUnder g={g} />} over={<ArmLayer g={g} />} screen={screen} />;
};

/** V7.3 second half: the kit (matched in place and size from the plinth push) and the smartphone-grade research device.
 *  After the match the kit eases to a larger pose on the left while the research device slides in on the right. */
const KIT_SCREEN = worldToScreen(CAM_P4_CLOSE, SENSOR_ORIGIN.x, SENSOR_ORIGIN.y);
const KIT_SCALE = S_K * CAM_P4_CLOSE.zoom;
const KIT2 = {x: 640, y: 640, scale: 2.6};
const KIT2_FOOT_Y = KIT2.y + 14 * KIT2.scale;
const MOD = {x: 1320, scale: 0.95};
const MOD_Y = KIT2_FOOT_Y - (430 * MOD.scale) / 2;
const PAIR_LBL_Y = 770;
{
  if (Math.abs(KIT_SCREEN.x - KIT_AT.x) > 0.5 || Math.abs(KIT_SCREEN.y - KIT_AT.y) > 0.5) throw new Error('V7.3: the kit match point moved');
  const modTop = MOD_Y - (430 * MOD.scale) / 2;
  if (!(modTop - TOF.y >= 60)) throw new Error(`V7.3: the research device crowds the header (${modTop - TOF.y} px)`);
  if (!(PAIR_LBL_Y - KIT2_FOOT_Y >= 60)) throw new Error('V7.3: the type labels crowd the drawings');
}

const PairShot: React.FC<{g: number}> = ({g}) => {
  const m = tw(g, KIT_MOVE0, KIT_MOVE_DUR, E.inOut);
  const kx = lerp(KIT_SCREEN.x, KIT2.x, m);
  const ky = lerp(KIT_SCREEN.y, KIT2.y, m);
  const ks = lerp(KIT_SCALE, KIT2.scale, m);
  const slide = tw(g, MOD0, MOD_DUR, E.out);
  const mx = lerp(2200, MOD.x, slide);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* the kit: at the cut, the same drawing, place and size as on the plinth; a soft floor shadow */}
        <ellipse cx={kx + 10} cy={ky + 14 * ks + 4} rx={34 * ks} ry={10} fill={C.shadow} />
        <g transform={`translate(${kx} ${ky})`}>
          <HandheldSensor scale={ks} reveal={1} led={1} />
        </g>
        {g >= MOD0 && <ellipse cx={mx + 14} cy={KIT2_FOOT_Y + 6} rx={124} ry={12} fill={C.shadow} />}
        {g >= MOD0 && <DotModule x={mx} y={MOD_Y} scale={MOD.scale} dots={1} />}
      </svg>
      <TofLabel t={1} t2={tw(g, K.lidar, 6, E.linear)} />
      <SubLabel x={KIT2.x} y={PAIR_LBL_Y} size={48} anchor="middle" opacity={tw(g, KIT_LBL, 6, E.linear)}>
        off-the-shelf kit
      </SubLabel>
      <SubLabel x={MOD.x} y={PAIR_LBL_Y} size={48} anchor="middle" opacity={tw(g, MOD_LBL, 6, E.linear)}>
        smartphone-grade research device
      </SubLabel>
    </AbsoluteFill>
  );
};

const PHONE_X = 470;
const PhoneShot: React.FC<{g: number}> = ({g}) => {
  const slide = tw(g, PHONE_IN, 16, E.out);
  const py = 150 + (1 - slide) * 1000;
  const lockY = drop(g, LOCK_LAND, 560, LOCK_FALL);
  const shut = tw(g, K.priv - 3, 3, E.in);
  const sq = impact(g, K.priv, 0.1, 9);
  const veil = tw(g, LOCK_LAND, 10);
  const lockLocal = {x: PHONE_SCREEN.x + PHONE_SCREEN.w / 2, y: PHONE_SCREEN.y + 330};
  const lx = PHONE_X + PHONE.w + 130;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <GenericPhone x={PHONE_X} y={py} veil={veil}>
          {g >= LOCK_LAND - LOCK_FALL && <Padlock x={lockLocal.x} y={lockLocal.y + lockY} scale={1.2} shut={shut} squash={sq} />}
        </GenericPhone>
      </svg>
      <SubLabel x={lx} y={500} opacity={tw(g, PHONE_LBL, 6, E.linear)}>
        not on your phone (yet)
      </SubLabel>
      <Chip x={lx} y={552} size={30} opacity={tw(g, SRC_LBL, 6, E.linear)}>
        per the lead researcher, in interviews
      </Chip>
    </AbsoluteFill>
  );
};

const FanPart: React.FC<{g: number}> = ({g}) => {
  if (g >= TIGHT_DONE) return <TightShot />;
  const cam = camAt(g);
  const spot = spotAt(g);
  const n = FAN.n;
  const open = Array.from({length: n}, (_, k) => tw(g, FAN0 + 2 * k, FAN_DUR, E.out) * (1 - tw(g, FOLD0 + (n - 1 - k), FOLD_DUR, E.inOut)));
  const opacity = open.map((o) => clamp01(o * 3)); // opaque once out: overlapping cards never show through each other
  const arrow = Array.from({length: n}, (_, k) => tw(g, arrowAt(k), ARROW_DUR, E.inOut));
  const nudge = Array.from({length: n}, (_, k) => NUDGE * Math.sin(Math.PI * tw(g, arrowAt(k) + 4, NUDGE_DUR, E.linear)));
  const fan = <FrameFan x={BOX_CENTRE.x} y={BOX_CENTRE.y} open={open} arrow={arrow} move={arrow} nudge={nudge} opacity={opacity} />;
  const lbl = tw(g, IDEA_LBL, 6, E.linear) * (1 - tw(g, TIGHT0, 8, E.linear));
  const screen = (
    // below the rail lamps (the lamp over the 2021 exhibit hangs at x 130-215, y 10-110 in this framing), clear of the fan
    <SubLabel x={96} y={196} opacity={lbl}>
      their new idea (2026)
    </SubLabel>
  );
  return <MuseumShot cam={cam} spot={spot} state={{...TIGHT_STATE, plates: platesAt(g)}} under={fan} screen={screen} />;
};

/* ================================================================== the scene */

export const V7Museum: React.FC = () => {
  const g = useG();
  let shot: React.ReactNode;
  if (g < MATCH) shot = <MuseumPart g={g} />;
  else if (g < CUT_PHONE) shot = <PairShot g={g} />;
  else if (g < CUT_FAN) shot = <PhoneShot g={g} />;
  else shot = <FanPart g={g} />;
  return <AbsoluteFill style={{background: PLINTH.wall}}>{shot}</AbsoluteFill>;
};

/* ================================================================== sound cue sheet */

// The trimmed vocabulary only (SHOTPLAN V7 sound: a brisker pulse, rope clip, tiny clink, padlock click), one cue per
// physical event at its contact; no sounds for labels, slides or the fan (music carries those).
export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_museum', dur: (K.end - K.start) / 30, note: 'museum hall tone, whole scene'},
  {f: LAND, kind: 'thud_soft', gain: -3, note: 'the scroll lands on the ledge'},
  {f: BEAM1, kind: 'sensor_pulse', gain: -7, pitch: 3, note: '2012: the laser lights the wall (brisk pulse)'},
  {f: FIRE3, kind: 'sensor_pulse', gain: -7, pitch: 5, note: '2021: the big laser fires'},
  ...CLIP.map((f, i): Sfx => ({f: Math.round(f), kind: 'rope_clip', gain: -3 - i, pitch: i - 1, note: `rope hooks onto post ${i + 2}`})),
  {f: SIGN_LAND, kind: 'hanger_click', gain: -2, note: 'sign: research equipment'},
  {f: DIM0, kind: 'machine_clunk', gain: -14, note: 'the hall lights dim, the spotlight swings'},
  {f: LED, kind: 'readout_beep', gain: -10, pitch: 5, note: 'the tiny board hops and blinks ("cheap")'},
  {f: CONTACT, kind: 'tiny_clink', note: 'her sensor set down on the fourth plinth'},
  {f: LOCK_LAND, kind: 'thud_soft', gain: -8, note: 'the padlock lands on the screen'},
  {f: K.priv, kind: 'lock_click', note: 'the padlock snaps shut'},
];

/** Beat frames (global), for review and the lead's merge notes. */
export const V7_BEATS = {K, FALL0, LAND, RISE0, TRUCK1, ARRIVE1, TITLE0, TITLE1, BEAM1, SCATTER1, SKETCH0, SKETCH_DUR, TRUCK2, TRUCK2_DUR, ARRIVE3, FIRE3, VIDEO0, PULL, PULL_DUR, CLIP, SIGN_LAND, DIM0, TRUCK_S, ARRIVE_S, CARD, LED, PING, SWING0, ARM_IN, CONTACT, RELEASE_END, ARM_GONE, PUSH0, PUSH_DUR, IRIS0, MATCH, KIT_LBL, MOD0, MOD_LBL, CUT_PHONE, PHONE_LAND, LOCK_LAND, CUT_FAN, FAN0, FAN_DUR, ARROWS0, ARROW_STEP, ARROW_DUR, FOLD0, PLATE_OUT0, TIGHT0, TIGHT_DONE};

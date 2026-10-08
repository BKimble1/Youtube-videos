import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, SOFT, camPath, drop, hop, impact, sp, tw} from '../lib/motion';
import {CAM_RAISED, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, projectWith, rigAt, viewAt, type PlanPt} from '../lib/room';
import {LAYOUT as OLAYOUT, assertPath, scatterDirections, type P2} from '../lib/optics';
import {rand} from '../lib/anim';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {LightPath, PulseDot, ScatterFan, mixHex, type ToPx} from '../components/v02/Optics';
import {ARMS, CROUCH, Character2, EXPR, HANDS_ON_HIPS, IDLE2, handsOnKnees, mixPose2, settlePose, withPose, type Pose2} from '../components/v02/Cast2';
import {SensorStand} from '../components/v02/S2_SensorStand';
import {BENCH, BenchTable, MattePanel, MirrorPanel, Torch} from '../components/v02/S2_Bench';
import {SectionBackdrop, grainTipNear} from '../components/v02/S2_Section';
import {CARD, EYE_PIECE, PostcardBody, ShredCard, lastLanding, type CardPlace} from '../components/v02/S2_Postcard';

/**
 * S2 · The wall relays information (s09–s12). Storyboard shots S2.1–S2.4.
 *
 *  S2.1 s09-s10a  the MirrorBench close-up (plan view, wall line on top): a painted panel slides into place; on
 *                 "plain wall" a torch lights a patch that sweeps along it; on "Start with a mirror" a small mirror
 *                 slides in (ting) and the torch swivels to it; the camera pushes in; on "Light" the torch fires one slowed
 *                 ray that bounces off the mirror; the normal and two equal angle arcs draw: "in = out". On "so the
 *                 picture" the guesser's postcard replaces the torch: three rays (hair, face, shirt colours) bounce as
 *                 a parallel bundle and the picture reappears whole (mirror image) on the far side ("whole").
 *  S2.2 s10b      cut to the raised room (RAISED_TILT, CAM_RAISED raised to show the wall above their heads). On
 *                 "here" a framed mirror panel slides down onto the relay wall at x 1.9–2.6 m; the camera pushes in
 *                 past the checker to the mirror; his mirror image is in the glass, placed where the sensor sees him:
 *                 the specular point of S -> H on the wall, computed below from layout.json (x = 2.139 m). A slowed
 *                 pulse runs S -> mirror -> H. "Friend": busted. "Visible" (J2): he ducks fast (squash, hold); his
 *                 reflection ducks too.
 *  S2.3 s11       the mirror slides off ("A painted wall"), he stands up, relieved; a magnifier lands on the bare wall
 *                 where the mirror hung (handle into empty wall, clear of him and the partition)
 *                 and irises open ("rough up close") into a magnified cross-section of the paint. "throws light": one
 *                 ray in, a cosine-weighted spray out every which way; "each spot": two neighbouring spots spray too;
 *                 "less like a mirror": the mirror's single reflected ray appears as a dashed ghost and fades; "more
 *                 like a tiny lamp": every lit spot sends out waves along all its rays (spoken, not captioned).
 *  S2.4 s12       flat graphic: the postcard drops in ("picture"), "metaphor" chip, postmarked on "postcard",
 *                 shreds into confetti ("shredded") that flutters into a pile ("waiting to be sorted"). On "worse"
 *                 cut to the raised room: an inset keeps the pile, and on "bits" one piece still shows his eye. Three
 *                 valid paths (head, shoulder, feet -> three wall spots -> sensor, all through the gap) draw on; on
 *                 "Everything coming back" coloured pulses run them and merge into one plain blip at the sensor
 *                 ("blend"); on "What survives" the blip is tossed over the checker's head into a row of empty time
 *                 slots and fills the one it arrived in: "what survives: timing". Small markers show where each path
 *                 leaves him (head, shoulder, foot); the confetti inset stays until the slots card takes over.
 *  Every slowed pulse (bench ray, mirror pulse, blend pulses) carries S1's saffron "slowed down" chip, top right.
 *
 * Every beat is cued from narration words (K); action lengths are clamped against the gaps so the scene survives
 * +-20 % timing changes.
 */

/* ================================================================== cues */

const SC = scene('S2');
const K = {
  start: SC.from,
  end: SC.to,
  // s09
  plain: at('s09', 'plain'),
  start9: at('s09', 'start'),
  mirror9: at('s09', 'mirror'),
  // s10
  s10: seg('s10').from,
  light10: at('s10', 'light'),
  same10: at('s10', 'same'),
  arrived: at('s10', 'arrived'),
  so10: at('s10', 'so'),
  picture10: at('s10', 'picture'),
  whole: at('s10', 'whole'),
  put: at('s10', 'put'),
  here: at('s10', 'here'),
  friend: at('s10', 'friend'),
  visible: at('s10', 'visible'),
  s10End: segEnd('s10'),
  // s11
  s11: seg('s11').from,
  is11: at('s11', 'is'),
  rough: at('s11', 'rough'),
  close: at('s11', 'close'),
  it11: at('s11', 'it'),
  light11: at('s11', 'light'),
  way: at('s11', 'way'),
  each: at('s11', 'each'),
  spot: at('s11', 'spot'),
  less: at('s11', 'less'),
  mirror11: at('s11', 'mirror'),
  more: at('s11', 'more'),
  tiny: at('s11', 'tiny'),
  lamp: at('s11', 'lamp'),
  s11End: segEnd('s11'),
  // s12
  s12: seg('s12').from,
  picture12: at('s12', 'picture'),
  postcard: at('s12', 'postcard'),
  shredded: at('s12', 'shredded'),
  waiting: at('s12', 'waiting'),
  worse: at('s12', 'worse'),
  bits: at('s12', 'bits'),
  everything: at('s12', 'everything'),
  blend: at('s12', 'blend'),
  many: at('s12', 'many'),
  what: at('s12', 'what'),
  survives: at('s12', 'survives'),
  timing: at('s12', 'timing'),
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== geometry (layout.json) */

const SH = LAYOUT.sensor.h;
const S2D: P2 = {x: PTS.S.x, z: PTS.S.z};
const H2D: P2 = {x: PTS.H.x, z: PTS.H.z};

/**
 * The mirror's specular point for sensor -> hider: reflect H across the wall line (z = 0) and intersect the straight
 * line S -> H' with the wall. On the layout this is x = 2.139 m (the storyboard's "x ≈ 2.14"); checked below by equal
 * angles of incidence and reflection and by the path test (S -> M passes the partition's far end through the gap).
 */
const SPEC: P2 = (() => {
  const Hm = {x: H2D.x, z: -H2D.z};
  const u = S2D.z / (S2D.z - Hm.z);
  return {x: S2D.x + u * (Hm.x - S2D.x), z: 0};
})();
/** The framed mirror panel on the relay wall (plan metres; h = height on the wall). */
const MIR = {x0: 1.9, x1: 2.6, h0: 0.85, h1: 1.95};
{
  const aIn = Math.atan2(S2D.x - SPEC.x, S2D.z);
  const aOut = Math.atan2(H2D.x - SPEC.x, H2D.z);
  if (Math.abs(aIn + aOut) > 1e-9) throw new Error(`S2: specular point check failed (${aIn}, ${aOut})`);
  if (SPEC.x < MIR.x0 + 0.1 || SPEC.x > MIR.x1 - 0.1) throw new Error(`S2: specular point x=${SPEC.x.toFixed(3)} is not inside the mirror panel`);
  assertPath([S2D, SPEC, H2D], OLAYOUT);
}

const VS = viewAt(RAISED_TILT);
const PX = (x: number, z: number, h: number = SH) => projectWith(VS, {x, z, h});
const roomToPx: ToPx = (p) => {
  const q = PX(p.x, p.z);
  return {x: q.x, y: q.y};
};
const SPX = PX(S2D.x, S2D.z);
const MPX = PX(SPEC.x, SPEC.z);

/** Raised room framings. A: CAM_RAISED raised to show the wall above their heads (the mirror lands there). B: the push
 *  past the checker to the mirror and him. D: the room on the right, a column for the cards on the left (as S1 ends). */
const CAM_A: Cam = {...CAM_RAISED, cy: 395};
const CAM_B: Cam = {cx: 950, cy: 240, zoom: 1.7};
const CAM_D: Cam = {cx: 640, cy: 392, zoom: 1.25};

const OP = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
const GU = rigAt(H2D.x, H2D.z, RAISED_TILT);

/** The mirror's glass rectangle on screen (world px, before its slide offset). The relay wall faces the camera, so a
 *  rectangle on it stays a rectangle. */
const GLASS = (() => {
  const a = PX(MIR.x0, 0.004, MIR.h1);
  const b = PX(MIR.x1, 0.004, MIR.h0);
  return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
})();
const FRAME_PX = 15;
/** His mirror image: the same rig, mirrored, its chin at the specular point (where the sensor sees him). */
const REF_SCALE = GU.scale * 0.94;
const REF = {x: MPX.x + 18, y: MPX.y + 313 * REF_SCALE};

/* ---- partition silhouette on screen at RAISED_TILT (for the path clearance check) */
const OCC = LAYOUT.occluder;
const ARCH = 0.09;
const FOOT_H = 0.07;
const topH = (z: number) => {
  const Lp = (OCC.z1 - OCC.z0) / 3;
  const v = (z - OCC.z0) / Lp;
  const u = clamp01(v - Math.floor(Math.min(2.9999, v)));
  return OCC.height - ARCH * (1 - Math.sin(Math.PI * u));
};
const FACE_X = OCC.x - OCC.thickness / 2;
const FACE_POLY = (() => {
  const pts: {x: number; y: number}[] = [];
  for (let k = 0; k <= 40; k++) {
    const z = OCC.z0 + ((OCC.z1 - OCC.z0) * k) / 40;
    pts.push(PX(FACE_X, z, topH(z)));
  }
  pts.push(PX(FACE_X, OCC.z1, FOOT_H), PX(FACE_X, OCC.z0, FOOT_H));
  return pts;
})();
const inPoly = (poly: {x: number; y: number}[], q: {x: number; y: number}) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const segDist = (q: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const u = clamp01(((q.x - a.x) * dx + (q.y - a.y) * dy) / l2);
  return Math.hypot(q.x - a.x - u * dx, q.y - a.y - u * dy);
};
const screenClearance = (a: Required<PlanPt>, b: Required<PlanPt>) => {
  let m = Infinity;
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const q = PX(lerp(a.x, b.x, u), lerp(a.z, b.z, u), lerp(a.h, b.h, u));
    if (inPoly(FACE_POLY, q)) return -1;
    for (let k = 0; k < FACE_POLY.length; k++) m = Math.min(m, segDist(q, FACE_POLY[k], FACE_POLY[(k + 1) % FACE_POLY.length]));
  }
  return m;
};
const dist3 = (a: Required<PlanPt>, b: Required<PlanPt>) => Math.hypot(a.x - b.x, a.z - b.z, a.h - b.h);

/**
 * S2.4: three paths from the hider to the sensor via three different wall spots. Each starts at a point of the drawn
 * rig (head centre, left shoulder, left foot); the rig is drawn at full height while the raised view compresses
 * heights, so the drawn start is the rig point's "effective" 3D point (same plan position, the height that projects
 * onto the drawn body part). Checked here: (1) in plan every path is valid (assertPath: no leg crosses the
 * partition; each crosses from his side to the sensor's side through the gap at the wall); (2) on screen every leg
 * stays at least MIN_CLEAR px outside the partition's drawn silhouette; (3) with his real body heights (head 1.45 m,
 * shoulder 1.13 m, feet 0.04 m) the three path lengths agree within one 250 ps bin (7.5 cm of path), so the three
 * returns really are one blip at the sensor.
 */
const MIN_CLEAR = 14;
const PARTS = [
  {id: 'head', local: {x: 0, y: -372}, trueH: 1.45, wall: {x: 1.7, h: 1.9}, color: '#C0392B'},
  {id: 'shoulder', local: {x: -66, y: -292}, trueH: 1.13, wall: {x: 2.25, h: 1.9}, color: C.saffronDeep},
  {id: 'feet', local: {x: -33, y: -8}, trueH: 0.04, wall: {x: 2.1, h: 1.2}, color: C.blue},
];
const S3D: Required<PlanPt> = {x: S2D.x, z: S2D.z, h: SH};
const BLEND = PARTS.map((p) => {
  const eff: Required<PlanPt> = {x: H2D.x + (p.local.x * GU.scale) / VS.ppm, z: H2D.z, h: (-p.local.y * GU.scale) / (VS.ppm * VS.height)};
  const W: Required<PlanPt> = {x: p.wall.x, z: 0, h: p.wall.h};
  assertPath([{x: eff.x, z: eff.z}, {x: W.x, z: 0}, S2D], OLAYOUT);
  const c1 = screenClearance(eff, W);
  const c2 = screenClearance(W, S3D);
  if (Math.min(c1, c2) < MIN_CLEAR) throw new Error(`S2: blend path ${p.id} is only ${Math.min(c1, c2).toFixed(1)} px from the partition on screen`);
  const real = {...eff, h: p.trueH};
  const L1 = dist3(real, W);
  const L2 = dist3(W, S3D);
  const px = [PX(eff.x, eff.z, eff.h), PX(W.x, W.z, W.h), SPX].map((q) => ({x: q.x, y: q.y}));
  return {...p, eff, W, L1, L2, L: L1 + L2, px};
});
{
  const Ls = BLEND.map((b) => b.L);
  if (Math.max(...Ls) - Math.min(...Ls) > 0.075) throw new Error(`S2: blend paths differ by more than one 250 ps bin (${Ls.map((l) => l.toFixed(3)).join(', ')})`);
}
const L_MAX = Math.max(...BLEND.map((b) => b.L));
/** Where each path visibly leaves his body (world px): the head path from the edge of his head along leg 1, the
 *  shoulder and foot paths from the drawn point. A small marker sits there so "head, shoulder, feet" reads. */
const ORIGIN_PX = BLEND.map((b) => {
  const out = b.id === 'head' ? 62 * GU.scale : 0;
  const dx = b.px[1].x - b.px[0].x;
  const dy = b.px[1].y - b.px[0].y;
  const l = Math.hypot(dx, dy) || 1;
  return {x: b.px[0].x + (dx / l) * out, y: b.px[0].y + (dy / l) * out};
});

/* ================================================================== beats derived from the cues */

// S2.1 the bench
const MATTE_IN0 = K.start + 2;
const MATTE_LAND = MATTE_IN0 + 12;
const BEAM0 = Math.max(MATTE_LAND + 6, K.plain - 2);
const MIRROR_IN0 = Math.max(BEAM0 + 20, K.start9);
const MIRROR_LAND = Math.max(MIRROR_IN0 + 10, K.mirror9 + 2);
const PUSH1_0 = MIRROR_LAND + 3;
const PUSH1_DUR = clamp(K.light10 - PUSH1_0 - 2, 14, 26);
const RAY0 = Math.max(PUSH1_0 + PUSH1_DUR, K.light10 + 2);
const RAY_HIT = Math.max(RAY0 + 14, Math.min(K.same10, K.arrived - 8));
const SWIVEL0 = MIRROR_IN0 + 2;
const SWIVEL_DUR = clamp(MIRROR_LAND - SWIVEL0, 10, 18);
const ARC_OUT = RAY_HIT + 9;
const INOUT = Math.max(ARC_OUT + 6, K.arrived + 2);
const PIC0 = Math.max(INOUT + 8, K.so10 - 2);
const PIC_LAND = Math.max(PIC0 + 10, K.picture10);
const PRAYS0 = PIC_LAND + 2;
const PRAYS_DUR = clamp(K.whole + 4 - PRAYS0, 12, 24);
const CUT2 = Math.max(PRAYS0 + PRAYS_DUR + 6, K.put - 8);

// S2.2 the room and the mirror
const DROP_LAND = Math.max(CUT2 + 12, K.here + 2);
const PUSH2_0 = DROP_LAND + 6;
const PUSH2_DUR = clamp(K.friend - PUSH2_0 - 6, 16, 30);
const NOTICE = DROP_LAND + 4;
const RAY2_0 = PUSH2_0 + PUSH2_DUR;
const RAY2_DUR = clamp(K.visible - 5 - RAY2_0, 12, 24);
const SPEC_LEN = Math.hypot(SPEC.x - S2D.x, SPEC.z - S2D.z);
const RAY2_LEN = SPEC_LEN + Math.hypot(H2D.x - SPEC.x, H2D.z - SPEC.z);
const RAY2_M = RAY2_0 + (RAY2_DUR * SPEC_LEN) / RAY2_LEN; // the pulse meets the mirror
const BUSTED = Math.max(K.friend + 2, Math.round(RAY2_M) + 2);
const DUCK = Math.max(BUSTED + 8, K.visible + 1);
const DUCK_DOWN = 4; // frames: a fast duck
const DUCK_HIT = DUCK + DUCK_DOWN;

// S2.3 mirror off, magnifier, iris, the rough wall
const MIRROR_OFF0 = Math.max(DUCK_HIT + 14, K.s11 + 2);
const RISE0 = MIRROR_OFF0 + 4;
const LENS_POP = Math.max(RISE0 + 10, K.is11 - 8);
const IRIS0 = Math.max(LENS_POP + 12, K.rough - 2);
const IRIS_DUR = clamp(K.close + 2 - IRIS0, 10, 18);
const IRIS_END = IRIS0 + IRIS_DUR;
const ROUGH_LABEL = Math.max(IRIS_END + 2, K.close + 3);
const IN0 = Math.max(ROUGH_LABEL + 8, K.it11);
const HIT3 = Math.max(IN0 + 10, K.light11 + 2);
const SPRAY_DUR = clamp(K.way + 2 - HIT3, 14, 26);
const EACH0 = Math.max(HIT3 + SPRAY_DUR + 4, K.each - 4);
const EACH_HIT = Math.max(EACH0 + 8, K.spot);
const GHOST0 = Math.max(EACH_HIT + 14, K.less);
const LAMP_W0 = Math.max(GHOST0 + 18, K.mirror11 + 4);
const GHOST_OUT = Math.max(GHOST0 + 12, LAMP_W0 - 6); // the mirror's ghost ray leaves just before the lamp waves
const LAMP_W1 = Math.max(LAMP_W0 + 10, K.tiny - 4);
const LAMP_W2 = Math.max(LAMP_W1 + 10, K.lamp - 2);
const WAVE = 18; // frames a lamp wave takes to run out along the rays

// S2.4 postcard, shred, room
const PC0 = Math.max(LAMP_W2 + WAVE, K.s12 - 2);
const CARD_LAND = Math.max(PC0 + 9, K.picture12 + 2);
const CARD_FALL = clamp(CARD_LAND - PC0, 9, 14);
const METAPHOR = CARD_LAND + 8;
const POSTMARK = Math.max(METAPHOR + 4, K.postcard);
const CUTLINES = Math.max(POSTMARK + 8, K.shredded - 4);
const SHRED = CUTLINES + 6;
const CUT4 = Math.max(SHRED + 50, K.worse);
const PUSH4_0 = Math.max(SHRED + 30, K.waiting - 4);
const PUSH4_DUR = clamp(CUT4 - PUSH4_0 - 6, 16, 40);
const ROUTES0 = CUT4 + 10;
const ROUTE_STAGGER = 10;
const ROUTE_DUR = 22;
const BITS = Math.max(CUT4 + 16, K.bits);
const PULSE0 = Math.max(ROUTES0 + 2 * ROUTE_STAGGER + ROUTE_DUR, K.everything + 2);
const ARRIVE = Math.max(PULSE0 + 30, K.blend + 4);
const BARS_IN = Math.max(ARRIVE + 6, K.many - 4);
const INSET_OUT = Math.max(BITS + 16, BARS_IN - 6); // the inset hands over to the bars card (no empty left third)
const DROP0 = Math.max(BARS_IN + 14, K.what);
const DROP_DUR = clamp(K.survives + 10 - DROP0, 10, 18);
const DROP_HIT = DROP0 + DROP_DUR;
const LABEL_T = DROP_HIT + 3;

/** Postcard place (screen px) and the pile's floor. */
const CARD_PLACE: CardPlace = {x: 960, y: 486, scale: 1.05, rot: -3};
const PILE_FLOOR = 842;
const SETTLED = SHRED + lastLanding(CARD_PLACE, PILE_FLOOR);

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -2},
  // S2.1
  {f: MATTE_IN0, kind: 'book_slide', gain: -6, note: 'painted panel slid into place'},
  {f: BEAM0, kind: 'pop_tick', gain: -8, note: 'torch switched on'},
  {f: MIRROR_IN0, kind: 'mirror_slide', gain: -4, note: 'bench mirror slides in'},
  {f: MIRROR_LAND, kind: 'mirror_ting', gain: -3},
  {f: RAY_HIT, kind: 'bounce_tick', pitch: 2, gain: -2},
  {f: PIC_LAND, kind: 'card_flick', gain: -5},
  // S2.2
  {f: DROP_LAND - 10, kind: 'mirror_slide', gain: -2, note: 'wall mirror slides down'},
  {f: DROP_LAND, kind: 'mirror_ting'},
  {f: RAY2_0, kind: 'sensor_pulse', gain: -4},
  {f: Math.round(RAY2_M), kind: 'bounce_tick', pitch: 3, gain: -3},
  {f: DUCK, kind: 'cloth_rustle', gain: -2},
  {f: DUCK_HIT, kind: 'thud_soft', gain: -6, note: 'duck squash'},
  // S2.3
  {f: MIRROR_OFF0, kind: 'mirror_slide', gain: -6, pitch: 1},
  {f: RISE0 + 8, kind: 'relief_sigh', gain: -3},
  {f: LENS_POP, kind: 'magnifier_slide', gain: -4},
  {f: HIT3, kind: 'bounce_tick', pitch: -1, gain: -3},
  // S2.4
  {f: CARD_LAND, kind: 'paper_slap', gain: -3},
  {f: POSTMARK, kind: 'stamp_light', gain: -6},
  {f: SHRED, kind: 'paper_shred'},
  {f: SETTLED - 10, kind: 'confetti_settle', gain: -4},
  {f: BITS, kind: 'chip_pop', gain: -8},
  {f: ARRIVE, kind: 'echo_return'},
  {f: DROP_HIT, kind: 'block_drop'},
];

/* ================================================================== small helpers */

const pulse01 = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

const ScreenLabel: React.FC<{x: number; y: number; t: number; children: React.ReactNode; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; display?: boolean}> = ({x, y, t, children, size = 44, color = C.ink, anchor = 'start', display}) =>
  t <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${anchor === 'end' ? '-100%' : anchor === 'middle' ? '-50%' : '0'}, -50%) scale(${f2(Math.max(0, t))})`,
        transformOrigin: anchor === 'end' ? '100% 50%' : anchor === 'middle' ? '50% 50%' : '0 50%',
        fontFamily: display ? F.display : F.body,
        fontWeight: display ? 600 : 800,
        fontSize: size,
        color,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        background: C.cream,
        border: `3px solid ${color}`,
        borderRadius: 16,
        padding: '6px 16px 9px',
      }}
    >
      {children}
    </div>
  );

const Pill: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 34}) => (
  <div
    style={{
      display: 'inline-flex',
      padding: `${size * 0.26}px ${size * 0.72}px`,
      borderRadius: 999,
      background: C.cream,
      color: C.inkSoft,
      border: `3px solid ${C.inkMuted}`,
      fontFamily: F.body,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.05,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

/** The episode's guard-rail chip for slowed pulses (same look as S1's: a saffron pill), top right, faded by `t`. */
const SlowedChip: React.FC<{t: number}> = ({t}) =>
  t <= 0 ? null : (
    <div style={{position: 'absolute', right: 96, top: 96, opacity: f2(clamp01(t)), transform: `translateY(${f2((1 - E.out(clamp01(t))) * -10)}px)`}}>
      <div
        style={{
          display: 'inline-flex',
          padding: `${32 * 0.26}px ${32 * 0.72}px`,
          borderRadius: 999,
          background: C.saffron,
          color: C.ink,
          border: `3px solid ${C.saffronDeep}`,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: 32,
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
        }}
      >
        slowed down
      </div>
    </div>
  );

/* ================================================================== S2.1 the bench */

const BU = 300; // bench px per optics unit (so the kit's LightPath bounce rings have a sensible size)
const benchToPx: ToPx = (p) => ({x: p.x * BU, y: p.z * BU});
const bp = (x: number, y: number): P2 => ({x: x / BU, z: y / BU});
const TH = (BENCH.thetaDeg * Math.PI) / 180;
const CON = BENCH.contact;
const D_IN = {x: Math.sin(TH), y: -Math.cos(TH)}; // toward the mirror
const D_OUT = {x: Math.sin(TH), y: Math.cos(TH)}; // away from it
const REACH = 520;
const LENS = {x: CON.x - D_IN.x * REACH, y: CON.y - D_IN.y * REACH};
const OUT_END = {x: CON.x + D_OUT.x * REACH, y: CON.y + D_OUT.y * REACH};
const TORCH_ANGLE = (Math.atan2(D_IN.y, D_IN.x) * 180) / Math.PI;
/** Before the mirror: the torch lies aimed at the painted panel; it swivels (about its body) to the mirror. */
const MATTE_C = {x: (BENCH.matte.x0 + BENCH.matte.x1) / 2, y: BENCH.faceY};
const TORCH_PIVOT_BACK = 90;
const TORCH_PIVOT = {x: LENS.x - D_IN.x * TORCH_PIVOT_BACK, y: LENS.y - D_IN.y * TORCH_PIVOT_BACK};
const SWEEP = 130; // the lit patch sweeps across the painted panel, +-SWEEP px about its centre
const aimAngle = (x: number) => (Math.atan2(BENCH.faceY - TORCH_PIVOT.y, x - TORCH_PIVOT.x) * 180) / Math.PI;
const PIC_REACH = 600;
const PIC_C = {x: CON.x - D_IN.x * PIC_REACH, y: CON.y - D_IN.y * PIC_REACH};
const RCV_C = {x: CON.x + D_OUT.x * PIC_REACH, y: CON.y + D_OUT.y * PIC_REACH};
const PIC_SCALE = 0.3;
const PERP = {x: -D_IN.y, y: D_IN.x};
/** The three rays of the picture: from three bands of the postcard (hair, face, shirt), a parallel bundle. */
const PIC_RAYS = [
  {k: -1, color: '#C0392B'},
  {k: 0, color: C.coral},
  {k: 1, color: C.saffronDeep},
].map((r) => {
  const o = {x: PIC_C.x + PERP.x * r.k * 30, y: PIC_C.y + PERP.y * r.k * 30};
  const t = (CON.y - o.y) / D_IN.y;
  const hit = {x: o.x + D_IN.x * t, y: CON.y};
  const end = {x: hit.x + D_OUT.x * (PIC_REACH - 70), y: hit.y + D_OUT.y * (PIC_REACH - 70)};
  return {...r, pts: [bp(o.x, o.y), bp(hit.x, hit.y), bp(end.x, end.y)]};
});
const CAM_BENCH0: Cam = {cx: 960, cy: 556, zoom: 1.0};
const CAM_BENCH1: Cam = {cx: 1240, cy: 548, zoom: 1.3};

const arcD = (cx: number, cy: number, r: number, a0: number, a1: number, t: number) => {
  const n = 24;
  const pts: string[] = [];
  const e = a0 + (a1 - a0) * clamp01(t);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((e - a0) * i) / n;
    pts.push(`${i ? 'L' : 'M'} ${f2(cx + r * Math.cos(a))} ${f2(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
};

const BenchShot: React.FC<{g: number}> = ({g}) => {
  const cam = camPath(g, CAM_BENCH0, [{at: PUSH1_0, dur: PUSH1_DUR, to: CAM_BENCH1}]);
  // the torch: on at "plain" (a lit patch on the painted panel), off when the mirror comes, swivels to it
  const beam = tw(g, BEAM0, 6) * (1 - tw(g, MIRROR_IN0, 5));
  const sweep = tw(g, BEAM0 + 4, Math.max(12, MIRROR_IN0 - BEAM0 - 6), E.inOut);
  const aimX = MATTE_C.x - SWEEP + 2 * SWEEP * sweep;
  const swivel = E.inOut(tw(g, SWIVEL0, SWIVEL_DUR, E.linear));
  const torchA = lerp(aimAngle(aimX), TORCH_ANGLE, swivel);
  const matteDx = -900 * (1 - E.back(tw(g, MATTE_IN0, MATTE_LAND - MATTE_IN0, E.linear)));
  const torchLens = {x: TORCH_PIVOT.x + TORCH_PIVOT_BACK * Math.cos((torchA * Math.PI) / 180), y: TORCH_PIVOT.y + TORCH_PIVOT_BACK * Math.sin((torchA * Math.PI) / 180)};
  const mirrorIn = tw(g, MIRROR_IN0, MIRROR_LAND - MIRROR_IN0, E.linear);
  const mirrorDx = (1 - E.back(mirrorIn)) * 980;
  const glint = tw(g, MIRROR_LAND, 12, E.linear);
  // the single ray: constant speed, bounce at RAY_HIT
  const v = REACH / Math.max(1, RAY_HIT - RAY0);
  const travelled = g < RAY0 ? 0 : (g - RAY0) * v;
  const rayT = travelled / (2 * REACH);
  const rayFade = 1 - tw(g, PRAYS0, 10);
  const torchOut = E.in(tw(g, PIC0 - 6, 12, E.linear));
  const torchOn = (g >= RAY0 - 2 && g < PIC0) || beam > 0.5 ? 1 : 0;
  const normalT = tw(g, RAY_HIT, 8);
  const arcIn = tw(g, RAY_HIT + 2, 9, E.inOut);
  const arcOut = tw(g, ARC_OUT, 9, E.inOut);
  const label = g >= INOUT ? E.back(clamp01((g - INOUT) / 9)) : 0;
  // the picture
  const picIn = tw(g, PIC0, PIC_LAND - PIC0, E.out);
  const picX = lerp(PIC_C.x - 520, PIC_C.x, picIn);
  const picY = lerp(PIC_C.y + 420, PIC_C.y, picIn) + (g >= PIC_LAND ? 0 : 0);
  const picT = clamp01((g - PRAYS0) / PRAYS_DUR);
  const rcv = tw(g, PIC_LAND - 4, 8);
  const wipe = tw(g, PRAYS0 + PRAYS_DUR * 0.7, PRAYS_DUR * 0.45, E.inOut);
  const cardW = CARD.w * PIC_SCALE;
  const cardH = CARD.h * PIC_SCALE;
  const aN = Math.PI / 2;
  const aIn = Math.atan2(-D_IN.y, -D_IN.x);
  const aOut = Math.atan2(D_OUT.y, D_OUT.x);
  const tick = (a: number, r: number) => `M ${f2(CON.x + (r - 13) * Math.cos(a))} ${f2(CON.y + (r - 13) * Math.sin(a))} L ${f2(CON.x + (r + 13) * Math.cos(a))} ${f2(CON.y + (r + 13) * Math.sin(a))}`;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <rect x={-2000} y={-2000} width={6000} height={6000} fill={C.paper} />
            <BenchTable />
            <MattePanel dx={matteDx} />
            {beam > 0 && (
              <g opacity={beam}>
                <path d={`M ${f2(torchLens.x)} ${f2(torchLens.y)} L ${f2(aimX - 80)} ${BENCH.faceY + 2} L ${f2(aimX + 80)} ${BENCH.faceY + 2} Z`} fill={C.saffronLight} opacity={0.75} />
                <rect x={f2(aimX - 80)} y={BENCH.faceY - 16} width={160} height={16} rx={4} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="9 7" />
              </g>
            )}
            <MirrorPanel dx={mirrorDx} glint={glint} />
            {/* the normal and the two equal angles */}
            {normalT > 0 && (
              <path d={`M ${CON.x} ${CON.y + 4} L ${CON.x} ${f2(CON.y + 4 + 236 * normalT)}`} stroke={C.inkSoft} strokeWidth={4} strokeDasharray="10 10" strokeLinecap="round" fill="none" />
            )}
            {arcIn > 0 && (
              <g>
                <path d={arcD(CON.x, CON.y, 122, aN, aIn, arcIn)} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
                {arcIn >= 1 && <path d={tick((aN + aIn) / 2, 122)} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />}
              </g>
            )}
            {arcOut > 0 && (
              <g>
                <path d={arcD(CON.x, CON.y, 122, aN, aOut, arcOut)} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
                {arcOut >= 1 && <path d={tick((aN + aOut) / 2, 122)} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />}
              </g>
            )}
            {/* the one ray (a mirror keeps nearly all of it: the outgoing leg is barely paler) */}
            {g >= RAY0 && rayFade > 0 && (
              <LightPath asGroup points={[bp(LENS.x, LENS.y), bp(CON.x, CON.y), bp(OUT_END.x, OUT_END.y)]} toPx={benchToPx} t={rayT} pulses={3} pulseGap={0.1} intensityFalloff={0.9} arrive="hide" opacity={rayFade} />
            )}
            {/* the picture's three rays: a parallel bundle stays a parallel bundle */}
            {g >= PRAYS0 &&
              PIC_RAYS.map((r) => (
                <LightPath key={r.k} asGroup points={r.pts} toPx={benchToPx} t={picT} pulses={2} pulseGap={0.1} width={6} intensityFalloff={0.9} color={r.color} pulseColor={r.color} bounceRings={r.k === 0} arrive="hide" />
              ))}
            {/* the torch, sliding away when the picture arrives */}
            {torchOut < 1 && <Torch x={torchLens.x - D_IN.x * 520 * torchOut} y={torchLens.y - D_IN.y * 520 * torchOut} angle={torchA} on={torchOn} opacity={1 - torchOut} />}
            {/* the receiving frame: the picture reappears whole (a mirror image) */}
            {rcv > 0 && (
              <g transform={`translate(${f2(RCV_C.x)} ${f2(RCV_C.y)}) rotate(4)`} opacity={rcv}>
                <rect x={-cardW / 2} y={-cardH / 2} width={cardW} height={cardH} rx={8} fill={C.cream} stroke={C.inkMuted} strokeWidth={4} strokeDasharray="12 9" />
                {wipe > 0 && (
                  <g>
                    <defs>
                      <clipPath id="s2rcvwipe">
                        <rect x={-cardW / 2 - 4} y={-cardH / 2 - 4} width={(cardW + 8) * wipe} height={cardH + 8} />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#s2rcvwipe)">
                      <g transform={`scale(${-PIC_SCALE} ${PIC_SCALE}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
                        <PostcardBody />
                      </g>
                    </g>
                  </g>
                )}
              </g>
            )}
            {/* the postcard on the bench */}
            {picIn > 0 && (
              <g transform={`translate(${f2(picX)} ${f2(picY)}) rotate(${f2(-4 + 10 * (1 - picIn))})`}>
                <rect x={-cardW / 2 + 6} y={-cardH / 2 + 8} width={cardW} height={cardH} rx={8} fill={C.shadow} />
                <g transform={`scale(${PIC_SCALE}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
                  <PostcardBody />
                </g>
              </g>
            )}
          </svg>
          {label > 0 && (
            <ScreenLabel x={CON.x} y={CON.y + 336} t={label} size={56} anchor="middle" display>
              in = out
            </ScreenLabel>
          )}
        </Layer>
      </Camera>
      <SlowedChip t={tw(g, RAY0 - 2, 8) * (1 - tw(g, CUT2 - 8, 8))} />
    </AbsoluteFill>
  );
};

/* ================================================================== the room (S2.2, S2.4) */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

/** S1 ends with him arms crossed, glancing at the wall, uneasy: S2.2 picks him up there. */
const UNEASY: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both', lid: 0.12, eyes: 1.12, brows: 0.6, browAsym: 0, mouth: 'hmm', lookX: -0.7, lookY: -0.85, tilt: -5, hunch: 0.04, sweat: 0.8};
const AT_MIRROR = {lookX: -0.92, lookY: -0.35};
const crouchBase: Pose2 = {...IDLE2, ...CROUCH, hunch: 0.17, ...EXPR.busted, mouth: 'flat', lookX: -0.85, lookY: -0.55, tilt: 4} as Pose2;
const DUCKED: Pose2 = {...crouchBase, ...handsOnKnees(crouchBase)};
const RELIEVED: Pose2 = withPose(HANDS_ON_HIPS, {lid: 0.5, eyes: 1, pupil: 1, brows: 0.15, browAsym: 0.2, mouth: 'smile', lookX: -0.55, lookY: -0.35, tilt: 3, sweat: 0});

const guesserMirror = (g: number) => {
  let pose: Pose2 = UNEASY;
  pose = mixPose2(pose, {...pose, ...AT_MIRROR, eyes: 1.06, sweat: 0.6}, tw(g, NOTICE, 8, E.inOut));
  const bust = sp(g, BUSTED, SNAP);
  if (bust > 0) pose = mixPose2(pose, {...pose, ...EXPR.busted, ...AT_MIRROR, tilt: -2}, Math.min(1.05, bust));
  if (g >= BUSTED) pose = {...pose, bob: hop(g, BUSTED, 9, 7)};
  // J2: the duck. Down in DUCK_DOWN frames (accelerating), squash at the bottom, hold.
  const duck = tw(g, DUCK, DUCK_DOWN, E.in);
  if (duck > 0) pose = mixPose2(pose, DUCKED, duck);
  if (g >= DUCK_HIT) pose = {...pose, lookY: -0.55 + 0.1 * Math.sin(Math.min(1, (g - DUCK_HIT) / 20) * Math.PI)};
  // the mirror leaves: he stands back up, relieved
  const rise = tw(g, RISE0, 14, E.inOut);
  if (rise > 0) pose = mixPose2(pose, RELIEVED, rise);
  const squash = impact(g, DUCK_HIT, 0.14, 10);
  const life = g >= DUCK && g < RISE0 + 10 ? 0.12 : 0.5;
  return {pose, squash, life};
};

const checkerLook = (g: number, keys: [number, {lookX: number; lookY: number; tilt: number}][]) => {
  let l = {lookX: 0.62, lookY: 0.32, tilt: 3};
  for (const [t0, to] of keys) {
    const k = tw(g, t0, 9, E.inOut);
    if (k <= 0) break;
    l = {lookX: lerp(l.lookX, to.lookX, k), lookY: lerp(l.lookY, to.lookY, k), tilt: lerp(l.tilt, to.tilt, k)};
  }
  return l;
};

const checkerMirror = (g: number): Pose2 => {
  const look = checkerLook(g, [
    [NOTICE + 6, {lookX: 0.95, lookY: -0.5, tilt: -2}],
    [DUCK + 8, {lookX: 0.95, lookY: 0.25, tilt: 2}],
    [RISE0 + 6, {lookX: 0.62, lookY: 0.32, tilt: 3}],
  ]);
  const brow = tw(g, DUCK + 10, 8) * (1 - tw(g, RISE0 + 6, 10));
  return withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, ...look, brows: -0.05 + 0.3 * brow, browAsym: 0.5 * brow});
};

/** Items standing in the raised room: the checker, the sensor on its stand, the guesser (optionally squashed). */
const roomItems = (g: number, checker: Pose2, guesser: {pose: Pose2; squash: [number, number]; life: number}, sensor: React.ComponentProps<typeof SensorStand>['sensor']): RoomItem[] => [
  {
    key: 'checker',
    x: LAYOUT.operator.x,
    z: LAYOUT.operator.z,
    w: 0.3,
    node: <Character2 look={CAST.checker} pose={checker} frame={g} seed={CHECKER_SEED} x={OP.x} y={OP.y} scale={OP.scale} life={0.35} />,
  },
  {
    key: 'stand',
    x: PTS.S.x,
    z: LAYOUT.operator.z + 0.04,
    w: 0.17,
    height: 1.4,
    node: <SensorStand tilt={RAISED_TILT} sensor={sensor} />,
  },
  {
    key: 'guesser',
    x: H2D.x,
    z: H2D.z,
    w: 0.3,
    node: (
      <Character2
        look={CAST.guesser}
        pose={guesser.pose}
        frame={g}
        seed={GUESSER_SEED}
        x={GU.x}
        y={GU.y}
        scale={GU.scale}
        life={guesser.life}
        style={guesser.squash[0] !== 1 ? {transform: `scale(${f2(guesser.squash[0])}, ${f2(guesser.squash[1])})`, transformOrigin: `${f2(200 * GU.scale)}px ${f2(500 * GU.scale)}px`} : undefined}
      />
    ),
  },
];

/** The framed mirror on the wall, with his mirror image clipped to the glass (world px). */
const WallMirror: React.FC<{g: number; dy: number; guesser: {pose: Pose2; squash: [number, number]; life: number}}> = ({g, dy, guesser}) => {
  const x0 = GLASS.x0;
  const x1 = GLASS.x1;
  const y0 = GLASS.y0 + dy;
  const y1 = GLASS.y1 + dy;
  const fr = FRAME_PX;
  const clip = `polygon(${f2(x0 + fr)}px ${f2(y0 + fr)}px, ${f2(x1 - fr)}px ${f2(y0 + fr)}px, ${f2(x1 - fr)}px ${f2(y1 - fr)}px, ${f2(x0 + fr)}px ${f2(y1 - fr)}px)`;
  const svg = {position: 'absolute' as const, left: 0, top: 0, overflow: 'visible' as const};
  return (
    <>
      <svg width={1920} height={1080} style={svg}>
        <rect x={x0 + 8} y={y0 + 10} width={x1 - x0} height={y1 - y0} rx={10} fill={C.shadow} />
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={10} fill={C.wood} stroke={C.ink} strokeWidth={4} />
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} rx={4} fill={C.blueLight} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clip}}>
        <Character2
          look={CAST.guesser}
          pose={guesser.pose}
          frame={g}
          seed={GUESSER_SEED}
          x={REF.x}
          y={REF.y}
          scale={REF_SCALE}
          flip
          shadow={false}
          life={guesser.life}
          style={guesser.squash[0] !== 1 ? {transform: `scale(${f2(guesser.squash[0])}, ${f2(guesser.squash[1])})`, transformOrigin: `${f2(200 * REF_SCALE)}px ${f2(500 * REF_SCALE)}px`} : undefined}
        />
      </div>
      <svg width={1920} height={1080} style={svg}>
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} fill={C.blueLight} opacity={0.3} />
        {/* two flat sheen strokes in the top-right corner (static on the glass) */}
        <path d={`M ${f2(x1 - fr - 64)} ${f2(y0 + fr + 4)} L ${f2(x1 - fr - 4)} ${f2(y0 + fr + 64)}`} stroke={C.white} strokeWidth={13} strokeLinecap="round" opacity={0.75} />
        <path d={`M ${f2(x1 - fr - 26)} ${f2(y0 + fr + 4)} L ${f2(x1 - fr - 4)} ${f2(y0 + fr + 26)}`} stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} rx={4} fill="none" stroke={C.ink} strokeWidth={3} />
      </svg>
    </>
  );
};

/* ---- the magnifier iris (S2.2 -> S2.3) */
const SEC_C = grainTipNear(960);
const LENS_R = 124;

const Iris: React.FC<{g: number; from: {x: number; y: number}}> = ({g, from}) => {
  if (g < LENS_POP) return null;
  const pop = E.back(clamp01((g - LENS_POP) / 8));
  const e = E.inOut(clamp01((g - IRIS0) / IRIS_DUR));
  const r = g < IRIS0 ? LENS_R * pop : lerp(LENS_R, 1500, Math.pow(e, 1.6));
  const c = {x: lerp(from.x, SEC_C.x, e), y: lerp(from.y, SEC_C.y, e)};
  const s = lerp(0.8, 1, e);
  const handle = 1 - clamp01(e * 2.5);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="s2iris">
          <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(0.1, r))} />
        </clipPath>
      </defs>
      {handle > 0 && (
        <g opacity={handle}>
          {/* handle up and to the left, into bare wall (down-right would cross his head) */}
          <line x1={f2(c.x - r * 0.7)} y1={f2(c.y - r * 0.7)} x2={f2(c.x - r * 0.7 - 110 * pop)} y2={f2(c.y - r * 0.7 - 110 * pop)} stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
          <line x1={f2(c.x - r * 0.7)} y1={f2(c.y - r * 0.7)} x2={f2(c.x - r * 0.7 - 110 * pop)} y2={f2(c.y - r * 0.7 - 110 * pop)} stroke={C.woodDeep} strokeWidth={22} strokeLinecap="round" />
        </g>
      )}
      <g clipPath="url(#s2iris)">
        <g transform={`translate(${f2(c.x - s * SEC_C.x)} ${f2(c.y - s * SEC_C.y)}) scale(${f2(s)})`}>
          <SectionContent g={g} />
        </g>
      </g>
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(0.1, r))} fill="none" stroke={C.ink} strokeWidth={22} />
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(0.1, r))} fill="none" stroke={C.saffron} strokeWidth={11} />
    </svg>
  );
};

const RoomMirrorShot: React.FC<{g: number}> = ({g}) => {
  const cam = camPath(g, CAM_A, [{at: PUSH2_0, dur: PUSH2_DUR, to: CAM_B}]);
  const gu = guesserMirror(g);
  const ch = checkerMirror(g);
  const mirrorDy = g < MIRROR_OFF0 ? drop(g, DROP_LAND, 420, 10) : -E.in(tw(g, MIRROR_OFF0, 12, E.linear)) * 460;
  const mirrorOn = g >= DROP_LAND - 10;
  // the specular ray (fades as he ducks out of it)
  const rayT = clamp01((g - RAY2_0) / RAY2_DUR);
  const rayOp = 1 - tw(g, DUCK, 10);
  const backdrop = (
    <>
      {mirrorOn && <WallMirror g={g} dy={mirrorDy} guesser={gu} />}
      {g >= RAY2_0 && rayOp > 0 && (
        <LightPath points={[S2D, SPEC, H2D]} toPx={roomToPx} t={rayT} pulses={3} pulseGap={0.09} intensityFalloff={0.92} layout={OLAYOUT} arrive="hide" opacity={rayOp} />
      )}
    </>
  );
  const items = roomItems(g, ch, gu, {led: 1, reveal: 1});
  // the magnifier lands on the bare wall where the mirror hung (the glass centre), clear of the partition and of him
  const lensScr = worldToScreen(cam, (GLASS.x0 + GLASS.x1) / 2, (GLASS.y0 + GLASS.y1) / 2);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={RAISED_TILT} items={items} backdrop={backdrop} />
        </Layer>
      </Camera>
      <SlowedChip t={tw(g, RAY2_0 - 2, 8) * (1 - tw(g, DUCK + 6, 8))} />
      <Iris g={g} from={{x: lensScr.x - 30, y: lensScr.y}} />
    </AbsoluteFill>
  );
};

/* ================================================================== S2.3 the rough wall up close */

const SU = 300; // section px per optics unit
const secToPx: ToPx = (p) => ({x: p.x * SU, y: p.z * SU});
const sp2 = (x: number, y: number): P2 => ({x: x / SU, z: y / SU});
const IN_TH = (36 * Math.PI) / 180;
const IN_DIR = {x: Math.sin(IN_TH), y: -Math.cos(IN_TH)};
const IN_LEN = 600;
const SPOTS = [
  {...grainTipNear(960), n: 15, len: 1.35, seed: 3, main: true},
  {...grainTipNear(560), n: 11, len: 0.85, seed: 7, main: false},
  {...grainTipNear(1360), n: 11, len: 0.85, seed: 11, main: false},
].map((s) => ({...s, dirs: scatterDirections({x: 0, z: 1}, s.n, s.seed, 0.6), from: {x: s.x - IN_DIR.x * IN_LEN, y: s.y - IN_DIR.y * IN_LEN}}));
const SPRAY_COLOR = mixHex(C.saffronDeep, C.paper, 0.2);

/** Tips of a spot's spray rays (same lengths as the kit's ScatterFan, so the lamp waves run along the drawn rays). */
const rayTips = (s: (typeof SPOTS)[number]) =>
  s.dirs.map((d, i) => {
    const L = s.len * (0.3 + 0.7 * d.w) * (0.85 + 0.3 * rand(s.seed * 53 + i * 7));
    return {x: s.x + d.x * L * SU, y: s.y + d.z * L * SU};
  });
const TIPS = SPOTS.map(rayTips);

const SectionContent: React.FC<{g: number}> = ({g}) => {
  const svgG = (
    <g>
      <SectionBackdrop />
      {SPOTS.map((s, k) => {
        const t0 = s.main ? IN0 : EACH0;
        const hit = s.main ? HIT3 : EACH_HIT;
        if (g < t0) return null;
        const inT = clamp01((g - t0) / Math.max(1, hit - t0));
        const spray = tw(g, hit, s.main ? SPRAY_DUR : 16, E.linear);
        const pale = s.main ? 0 : 0.25;
        return (
          <g key={k}>
            <LightPath asGroup points={[sp2(s.from.x, s.from.y), sp2(s.x, s.y)]} toPx={secToPx} t={inT} pulses={3} pulseGap={0.1} width={s.main ? 8 : 6} color={mixHex(C.saffronDeep, C.paper, pale)} arrive="hide" bounceRings={false} />
            {spray > 0 && <ScatterFan asGroup origin={sp2(s.x, s.y)} dirs={s.dirs} length={s.len} toPx={secToPx} t={spray} color={mixHex(SPRAY_COLOR, C.paper, pale)} width={s.main ? 4.5 : 3.5} seed={s.seed} />}
            {/* the lamp: waves run out along every ray of every lit spot */}
            {[LAMP_W0, LAMP_W1, LAMP_W2].map((w0, wi) => {
              const u = (g - w0 - (s.main ? 0 : 3)) / WAVE;
              if (u <= 0 || u >= 1) return null;
              return (
                <g key={wi} opacity={1 - Math.pow(u, 3)}>
                  {TIPS[k].map((tp, i) => (
                    <circle key={i} cx={f2(lerp(s.x, tp.x, E.out(u)))} cy={f2(lerp(s.y, tp.y, E.out(u)))} r={s.main ? 8 : 6.5} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
                  ))}
                </g>
              );
            })}
            <circle cx={f2(s.x)} cy={f2(s.y)} r={spray > 0 ? 8 : 0} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
      {/* "less like a mirror": the mirror's one reflected ray, as a dashed ghost that fades */}
      {g >= GHOST0 && g < GHOST_OUT + 10 && (
        <g opacity={f2(1 - tw(g, GHOST_OUT, 10))}>
          {/* drawn in the mirror's glass blue, bold enough to read muted, gone before the lamp waves */}
          <path
            d={`M ${f2(SEC_C.x)} ${f2(SEC_C.y)} L ${f2(SEC_C.x + IN_DIR.x * 540 * tw(g, GHOST0, 10))} ${f2(SEC_C.y - IN_DIR.y * 540 * tw(g, GHOST0, 10))}`}
            stroke={C.white}
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${f2(SEC_C.x)} ${f2(SEC_C.y)} L ${f2(SEC_C.x + IN_DIR.x * 540 * tw(g, GHOST0, 10))} ${f2(SEC_C.y - IN_DIR.y * 540 * tw(g, GHOST0, 10))}`}
            stroke={C.blue}
            strokeWidth={8}
            strokeDasharray="18 13"
            strokeLinecap="round"
            fill="none"
          />
          {g < GHOST0 + 16 && (
            <circle cx={f2(SEC_C.x + IN_DIR.x * 540 * E.out(clamp01((g - GHOST0) / 15)))} cy={f2(SEC_C.y - IN_DIR.y * 540 * E.out(clamp01((g - GHOST0) / 15)))} r={13} fill={C.blueLight} stroke={C.ink} strokeWidth={3.5} />
          )}
        </g>
      )}
    </g>
  );
  return svgG;
};

const SectionShot: React.FC<{g: number}> = ({g}) => {
  const lab = g >= ROUGH_LABEL ? E.back(clamp01((g - ROUGH_LABEL) / 9)) : 0;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <SectionContent g={g} />
      </svg>
      <ScreenLabel x={1520} y={196} t={lab} size={56} anchor="middle" display>
        rough up close
      </ScreenLabel>
    </AbsoluteFill>
  );
};

/* ================================================================== S2.4 the postcard */

const PostcardShot: React.FC<{g: number}> = ({g}) => {
  // falls in from the top edge (already peeking in on the cut), lands, settles
  const fall = drop(g, CARD_LAND, CARD_PLACE.y + CARD.h * 0.5 * CARD_PLACE.scale - 90, CARD_FALL);
  const cam = camPath(g, {cx: 960, cy: 540, zoom: 1}, [{at: PUSH4_0, dur: PUSH4_DUR, to: {cx: 960, cy: PILE_FLOOR - 50, zoom: 1.3}}]);
  const rot = CARD_PLACE.rot + (g < CARD_LAND ? -7 * clamp01((CARD_LAND - g) / 10) : 2.5 * Math.exp(-(g - CARD_LAND) * 0.25) * Math.sin((g - CARD_LAND) * 0.9));
  const place: CardPlace = {...CARD_PLACE, y: CARD_PLACE.y + fall, rot};
  const chip = g >= METAPHOR ? E.back(clamp01((g - METAPHOR) / 8)) : 0;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <ShredCard place={place} t={g - SHRED} cut={tw(g, CUTLINES, 6)} floorY={PILE_FLOOR} postmark={tw(g, POSTMARK, 6)} />
        </Layer>
      </Camera>
      {chip > 0 && (
        <div style={{position: 'absolute', left: 96, top: 92, transform: `scale(${f2(chip)})`, transformOrigin: '0 50%'}}>
          <Pill size={36}>metaphor</Pill>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== S2.4 the room: a blend of paths */

const INSET = {x0: 92, y0: 92, x1: 792, y1: 470};
const INSET_K = 0.72;
const BARS = {x0: 92, y0: 540, x1: 792, y1: 912, n: 12, slot: 7, base: 846, x: 152, w: 40, gap: 10, hMax: 150};
const SLOT_C = {x: BARS.x + BARS.slot * (BARS.w + BARS.gap) + BARS.w / 2, y: BARS.base - 24};

const guesserBlend = (g: number): Pose2 => {
  let pose: Pose2 = withPose(HANDS_ON_HIPS, {...EXPR.smug, lookX: -0.35, ...settlePose(1, -1)});
  pose = mixPose2(pose, {...pose, lid: 0, eyes: 1.12, pupil: 0.85, brows: 0.55, browAsym: 0, mouth: 'o', lookX: -0.8, lookY: -0.55, tilt: -3}, tw(g, ROUTES0 + 4, 9, E.inOut));
  pose = mixPose2(pose, {...pose, ...EXPR.smug, lookX: -0.45, lookY: 0.05}, tw(g, ARRIVE + 4, 10, E.inOut));
  pose = mixPose2(pose, {...pose, lid: 0.1, eyes: 1.1, brows: 0.6, browAsym: 0, mouth: 'hmm', sweat: 0.8, lookX: -0.95, lookY: 0.2, tilt: -4}, tw(g, LABEL_T + 6, 9, E.inOut));
  return pose;
};

const checkerBlend = (g: number): Pose2 => {
  const look = checkerLook(g, [
    [ROUTES0 + 10, {lookX: 0.9, lookY: -0.55, tilt: -2}],
    [ARRIVE - 4, {lookX: 0.62, lookY: 0.32, tilt: 3}],
    [DROP0, {lookX: -0.85, lookY: 0.3, tilt: -2}],
  ]);
  const brow = tw(g, LABEL_T + 2, 8);
  return withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, ...look, brows: -0.05 + 0.3 * brow, browAsym: 0.5 * brow});
};

/** A point along a drawn polyline, by fraction of each leg's REAL length (constant light speed). */
const pathPoint = (b: (typeof BLEND)[number], d: number) => {
  if (d <= b.L1) {
    const u = clamp01(d / b.L1);
    return {x: lerp(b.px[0].x, b.px[1].x, u), y: lerp(b.px[0].y, b.px[1].y, u), leg: 0};
  }
  const u = clamp01((d - b.L1) / b.L2);
  return {x: lerp(b.px[1].x, b.px[2].x, u), y: lerp(b.px[1].y, b.px[2].y, u), leg: 1};
};

const RoomBlendShot: React.FC<{g: number}> = ({g}) => {
  const cam = CAM_D;
  const gu = {pose: guesserBlend(g), squash: [1, 1] as [number, number], life: 0.5};
  const ch = checkerBlend(g);
  const v = L_MAX / Math.max(1, ARRIVE - PULSE0);
  const travelled = (g - PULSE0) * v;
  const arrivedFrac = BLEND.filter((b) => travelled >= b.L).length / BLEND.length;
  const flash = sp(g, ARRIVE, SNAP) * (1 - tw(g, ARRIVE + 30, 20));
  const backdrop = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {BLEND.map((b, k) => {
        const r = tw(g, ROUTES0 + k * ROUTE_STAGGER, ROUTE_DUR, E.inOut);
        if (r <= 0) return null;
        // draw-on of the dashed route by drawn length
        const l1 = Math.hypot(b.px[1].x - b.px[0].x, b.px[1].y - b.px[0].y);
        const l2 = Math.hypot(b.px[2].x - b.px[1].x, b.px[2].y - b.px[1].y);
        const head = r * (l1 + l2);
        const pts = [b.px[0]];
        if (head <= l1) pts.push({x: lerp(b.px[0].x, b.px[1].x, head / l1), y: lerp(b.px[0].y, b.px[1].y, head / l1)});
        else pts.push(b.px[1], {x: lerp(b.px[1].x, b.px[2].x, (head - l1) / l2), y: lerp(b.px[1].y, b.px[2].y, (head - l1) / l2)});
        const routeD = pts.map((q, i) => `${i ? 'L' : 'M'} ${f2(q.x)} ${f2(q.y)}`).join(' ');
        // the pulse and its trail
        const on = g >= PULSE0 && travelled < b.L;
        const pp = on ? pathPoint(b, travelled) : null;
        const trail = g >= PULSE0 ? (travelled >= b.L ? [b.px[0], b.px[1], b.px[2]] : pp!.leg === 0 ? [b.px[0], pp!] : [b.px[0], b.px[1], pp!]) : null;
        const trailOp = 1 - tw(g, DROP0, 14);
        return (
          <g key={b.id}>
            <path d={routeD} fill="none" stroke={mixHex(b.color, C.paper, 0.35)} strokeWidth={5} strokeDasharray="12 11" strokeLinecap="round" strokeLinejoin="round" />
            {r > 0.45 && <circle cx={f2(b.px[1].x)} cy={f2(b.px[1].y)} r={f2(9 * E.back(clamp01((r - 0.45) / 0.2)))} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />}
            {trail && trailOp > 0 && (
              <path d={trail.map((q, i) => `${i ? 'L' : 'M'} ${f2(q.x)} ${f2(q.y)}`).join(' ')} fill="none" stroke={b.color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.85 * trailOp} />
            )}
            {pp && <PulseDot x={pp.x} y={pp.y} r={13} color={b.color} />}
          </g>
        );
      })}
    </svg>
  );
  // the merged blip sits on the sensor's far face until it drops
  const blipOn = g >= PULSE0 && arrivedFrac > 0 && g < DROP0;
  const throb = pulse01(g, K.many, 14);
  const markerOp = 1 - tw(g, DROP0, 14);
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* where each path leaves him: head, shoulder, foot (in front of him, so the origins read) */}
      {markerOp > 0 &&
        BLEND.map((b, k) => {
          const m = E.back(clamp01((g - ROUTES0 - k * ROUTE_STAGGER) / 8));
          if (m <= 0) return null;
          const o = ORIGIN_PX[k];
          return (
            <g key={b.id} opacity={f2(markerOp)} transform={`translate(${f2(o.x)} ${f2(o.y)}) scale(${f2(m)})`}>
              <circle r={14} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
              <circle r={7.5} fill={b.color} />
            </g>
          );
        })}
      {blipOn && (
        <>
          <circle cx={SPX.x} cy={SPX.y} r={f2(14 + 40 * E.out(clamp01((g - ARRIVE) / 14)))} fill="none" stroke={C.saffronDeep} strokeWidth={5} opacity={f2(1 - clamp01((g - ARRIVE) / 14))} />
          <PulseDot x={SPX.x} y={SPX.y} r={10 + 5 * arrivedFrac + 3 * throb} color={C.saffron} />
        </>
      )}
    </svg>
  );
  const items = roomItems(g, ch, gu, {led: 1, reveal: 1, bumpHighlight: flash});
  // screen-space: the inset, the bars card, the dropping blip
  const sScr = worldToScreen(cam, SPX.x, SPX.y);
  const insetIn = 1 - tw(g, INSET_OUT, 10, E.in);
  const lift = tw(g, BITS, 10, E.out);
  const barsIn = tw(g, BARS_IN, 12, E.out);
  const dropU = clamp01((g - DROP0) / DROP_DUR);
  // the blip is tossed up and over the checker's head (not across her body) and drops into its time slot
  const lobC = {x: sScr.x + 60, y: sScr.y - 900};
  const bz = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  const blipScr = g >= DROP0 && g < DROP_HIT ? {x: bz(sScr.x, lobC.x, SLOT_C.x, dropU), y: bz(sScr.y, lobC.y, SLOT_C.y, dropU)} : null;
  const barRise = sp(g, DROP_HIT, SNAP);
  const lab = g >= LABEL_T ? E.back(clamp01((g - LABEL_T) / 9)) : 0;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={RAISED_TILT} items={items} backdrop={backdrop}>
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {/* the metaphor, kept in an inset: confetti still holds bits of the picture */}
      {insetIn > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: insetIn, transform: `scale(${f2(0.9 + 0.1 * insetIn)})`, transformOrigin: `${INSET.x0}px ${INSET.y0}px`}}>
          <div style={{position: 'absolute', left: INSET.x0 + 10, top: INSET.y0 + 14, width: INSET.x1 - INSET.x0, height: INSET.y1 - INSET.y0, borderRadius: 22, background: C.shadow}} />
          <div style={{position: 'absolute', left: INSET.x0, top: INSET.y0, width: INSET.x1 - INSET.x0, height: INSET.y1 - INSET.y0, borderRadius: 22, background: C.cream, border: `4px solid ${C.ink}`, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -INSET.x0, top: -INSET.y0, width: 1920, height: 1080, transform: `translate(${f2((INSET.x0 + INSET.x1) / 2 - 960 * INSET_K)}px, ${f2(INSET.y1 - 16 - (PILE_FLOOR + 104) * INSET_K)}px) scale(${INSET_K})`, transformOrigin: '0 0'}}>
              <ShredCard place={CARD_PLACE} t={g - SHRED} floorY={PILE_FLOOR} lift={{i: EYE_PIECE, k: lift, to: {x: 1180, y: 640}, extra: 2.0}} />
            </div>
            <div style={{position: 'absolute', left: 22, top: 20}}>
              <Pill size={34}>metaphor</Pill>
            </div>
          </div>
        </div>
      )}
      {/* the row of timing bars */}
      {barsIn > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: barsIn, transform: `translateX(${f2(-40 * (1 - barsIn))}px)`}}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <rect x={BARS.x0 + 10} y={BARS.y0 + 14} width={BARS.x1 - BARS.x0} height={BARS.y1 - BARS.y0} rx={22} fill={C.shadow} />
            <rect x={BARS.x0} y={BARS.y0} width={BARS.x1 - BARS.x0} height={BARS.y1 - BARS.y0} rx={22} fill={C.cream} stroke={C.ink} strokeWidth={4} />
            {/* a row of empty time slots (no toy data): the blended blip fills the one slot it arrived in */}
            {Array.from({length: BARS.n}, (_, i) => {
              const x = BARS.x + i * (BARS.w + BARS.gap);
              const isSlot = i === BARS.slot;
              const fill = isSlot ? Math.min(1.06, Math.max(0, barRise)) : 0;
              const h = fill * BARS.hMax;
              return (
                <g key={i}>
                  <rect x={x} y={BARS.base - BARS.hMax} width={BARS.w} height={BARS.hMax} rx={6} fill={C.paperDeep} stroke={C.tealDeep} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.75} />
                  {h > 0.5 && <rect x={x} y={f2(BARS.base - h)} width={BARS.w} height={f2(h)} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={4} />}
                </g>
              );
            })}
            <line x1={BARS.x - 14} y1={BARS.base} x2={BARS.x + BARS.n * (BARS.w + BARS.gap) + 4} y2={BARS.base} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <text x={BARS.x + BARS.n * (BARS.w + BARS.gap) + 4} y={BARS.base + 46} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.inkSoft}>
              time →
            </text>
          </svg>
        </div>
      )}
      {lab > 0 && (
        <div style={{position: 'absolute', left: BARS.x0 + 36, top: BARS.y0 + 58, transform: `translateY(-50%) scale(${f2(lab)})`, transformOrigin: '0 50%', fontFamily: F.display, fontWeight: 600, fontSize: 52, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1}}>
          what survives: timing
        </div>
      )}
      {blipScr && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <PulseDot x={blipScr.x} y={blipScr.y} r={f2(lerp(18 * cam.zoom, 20, dropU))} color={C.saffron} />
        </svg>
      )}
      <SlowedChip t={tw(g, PULSE0 - 2, 8) * (1 - tw(g, ARRIVE + 10, 10))} />
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const S2Mirror: React.FC = () => {
  const g = useG();
  if (g < CUT2) return <BenchShot g={g} />;
  if (g < IRIS_END) return <RoomMirrorShot g={g} />;
  if (g < PC0) return <SectionShot g={g} />;
  if (g < CUT4) return <PostcardShot g={g} />;
  return <RoomBlendShot g={g} />;
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, camPath, drop, hop, impact, sp, tw} from '../lib/motion';
import {HANDOFF_S2S3, HANDOFF_S2S3_EXTEND, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, SLAB_T, WALL_T, assertAroundTheEnd, hiddenByPartition, partitionCrossings, partitionHides, projectWith, rigAt, roomBounds, viewAt, visibleSpans, type HiddenTest, type PlanPt} from '../lib/room';
import {LAYOUT as OLAYOUT, assertPath, scatterDirections, type P2} from '../lib/optics';
import {rand} from '../lib/anim';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {LightPath, PulseDot, ScatterFan, mixHex, type ToPx} from '../components/v02/Optics';
import {ARMS, CROUCH, Character2, EXPR, HANDS_ON_HIPS, IDLE2, eyesWorld, figuresHide, mixPose2, mouthWorld, reach2, rigCovers, rimFlash, settlePose, withPose, type Pose2, type RigPlace} from '../components/v02/Cast2';
import {S2Reflection} from '../components/v02/S2_BackHead';
import {SensorStand, standGeometry} from '../components/v02/S2_SensorStand';
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
 *  S2.2 s10b      cut to the raised room (RAISED_TILT 0.10, CAM_A: bare wall above them). On "here" a framed mirror
 *                 (0.8 x 1.4 m, x 1.95-2.75 m) drops onto the relay wall; the camera pushes past the checker's shoulder
 *                 to the glass and him (CAM_B). In the glass is his virtual image (H reflected through the wall, at his
 *                 own scale, clipped to the glass, the partition and people painting over it); he faces the room, so the
 *                 glass shows his BACK (S2_BackHead: back of the head, striped back, arms behind; lead override). A
 *                 slowed pulse runs S -> mirror -> H at the 0.95 m light plane, hidden exactly behind the partition and
 *                 both people: it goes into the slot and vanishes behind the far end (the specular point x = 2.139 m is
 *                 under the far end's ink outline at this tilt); a glint "tings" on the visible glass just left of the far
 *                 edge as it bounces, and his wall-side outline rim-flashes when it reaches him. "Friend": busted.
 *                 "Visible" (J2): the A02 #4 duck: both mitts clamp on his crown (elbows out), deep squat, squash; his
 *                 reflection ducks in sync (hands over the back hair).
 *  S2.3 s11       the mirror slides off ("A painted wall"), he stands up, relieved; a magnifier lands on the bare wall
 *                 where the mirror hung (handle into empty wall, clear of him and the partition)
 *                 and irises open ("rough up close") into a magnified cross-section of the paint. "throws light": one
 *                 ray in, a cosine-weighted spray out every which way; "each spot": two neighbouring spots spray too;
 *                 "less like a mirror": the mirror's single reflected ray appears as a dashed ghost and fades; "more
 *                 like a tiny lamp": every lit spot sends out waves along all its rays (spoken, not captioned).
 *  S2.4 s12       flat graphic: the postcard drops in ("picture"), "metaphor" chip, postmarked on "postcard",
 *                 shreds into confetti ("shredded") that flutters into a pile ("waiting to be sorted"). On "worse"
 *                 cut to the room at TILT 0 (no head path obeys the light-path rule at the raised 0.10; S3 opens at
 *                 tilt 0 too): an inset keeps the pile, and on "bits" one piece still shows his eye. Three valid paths
 *                 (head, shoulder, feet -> three wall spots -> sensor) draw on ONE AT A TIME (review r1 D17), each round
 *                 the partition's far end through the gap and hidden exactly where the partition or a person covers it:
 *                 a small marker pops where the path leaves him (head, shoulder, foot), its route draws body-first,
 *                 and on the frame its stub comes out from behind the partition's far end
 *                 the marker throbs again and sends one ring in the path's colour; its wall spot pops when the route
 *                 reaches it. On "Everything coming back" coloured pulses run them and merge into one plain blip at the
 *                 sensor ("blend"); the confetti inset slides out left, solid, as the slots card slides in (no
 *                 see-through swap, D18); on "What survives" the blip is tossed over the checker's head into a row of
 *                 empty time slots and fills the one it arrived in, while the routes, spots and markers clear: "what
 *                 survives: timing". The card then stays put (settled labels do not move) and the room stays opaque
 *                 to the last frame: S3 opens on the same camera (HANDOFF_S2S3) in the same poses, a one-room cut (D03).
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

/** The light-path plane (layout sensor.h = hidden.h = 0.95 m, the chibi rig's chest). */
const LIGHT_H = LAYOUT.sensor.h;
const SH = LIGHT_H;
const S2D: P2 = {x: PTS.S.x, z: PTS.S.z};
const H2D: P2 = {x: PTS.H.x, z: PTS.H.z};
const S3D: Required<PlanPt> = {x: S2D.x, z: S2D.z, h: LIGHT_H};
const H3D: Required<PlanPt> = {x: H2D.x, z: H2D.z, h: LIGHT_H};
const dist3 = (a: Required<PlanPt>, b: Required<PlanPt>) => Math.hypot(a.x - b.x, a.z - b.z, a.h - b.h);

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
const SPEC3D: Required<PlanPt> = {x: SPEC.x, z: 0, h: LIGHT_H};
/** The framed mirror panel on the relay wall (plan metres; h = height on the wall): big enough that the camera sees
 *  his whole head in it above the 2 m partition (PATH_LEGIBILITY_PLAN §4 S2.2). */
const MIR = {x0: 1.95, x1: 2.75, h0: 0.9, h1: 2.3};
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

/** S2.2 framings at RAISED_TILT (world px at tilt 0.10: the glass top at y -87, her feet at 772, her left edge 518,
 *  his elbow 1261). A: the raised room with the bare wall above them, where the mirror lands. B: the push past the
 *  checker's shoulder onto the glass and him (zoom kept so the 0.8 x 1.4 m glass, his reflection's hair and his duck
 *  all stay in frame). */
const CAM_A: Cam = {cx: 900, cy: 345, zoom: 1.2};
const CAM_B: Cam = {cx: 985, cy: 268, zoom: 1.4};

const OP = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
const GU = rigAt(H2D.x, H2D.z, RAISED_TILT);
/** His virtual image in the wall mirror: H reflected through the wall z = 0, at his own scale (exact for a planar
 *  mirror under this parallel projection). He faces the room, so the image faces away: the glass shows his BACK
 *  (S2_BackHead). Replaces the old "chin at the specular point" placement (REF, REF_SCALE 0.94). */
const RF = rigAt(H2D.x, -H2D.z, RAISED_TILT);
if (Math.abs(RF.scale - GU.scale) > 1e-9) throw new Error('S2: the reflection must be drawn at his own scale');

/** The mirror's glass rectangle on screen (world px, before its slide offset). The relay wall faces the camera, so a
 *  rectangle on it stays a rectangle. */
const GLASS = (() => {
  const a = PX(MIR.x0, 0.004, MIR.h1);
  const b = PX(MIR.x1, 0.004, MIR.h0);
  return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
})();
const FRAME_PX = 15;

/** The light-path rule at the two S2.2 zooms (the pulse runs after the push, at CAM_B; checked at both). The pulse
 *  goes S -> SPEC behind the partition's FAR end (through the slot) and SPEC -> H comes out by the near end where his
 *  body covers it; SPEC itself sits under the far end's ink outline at tilt 0.10. */
const MIRROR_PATH: Required<PlanPt>[] = [S3D, SPEC3D, H3D];
for (const cam of [CAM_A, CAM_B]) assertAroundTheEnd('S2.2 mirror pulse', [MIRROR_PATH], VS, {zoom: cam.zoom});

/** The "ting" glint: on the visible glass just left of the far edge (the true bounce point is under the far end's ink
 *  outline). The plan's x 1.99 falls on the mirror's wooden frame (the glass starts 15 px in), so it sits at 2.03. */
const GLINT3D: Required<PlanPt> = {x: 2.03, z: 0, h: LIGHT_H + 0.12};
const GLINT = PX(GLINT3D.x, GLINT3D.z, GLINT3D.h);
if (hiddenByPartition(GLINT3D, VS, {padPx: 12})) throw new Error('S2: the mirror glint is behind the partition');
if (GLINT.x < GLASS.x0 + FRAME_PX || GLINT.y > GLASS.y1 - FRAME_PX - 12) throw new Error('S2: the mirror glint is not on the glass');

/** How much of his reflection the camera sees in the glass (the partition paints over the glass's lower right). Rig
 *  zones in rig px (rule_check.ts §2), mapped to the virtual image (x and h kept, z = -H.z, 1.7/440 m per rig px). */
const REFLECTION_VIS = (() => {
  const mpp = 1.7 / 440;
  const zones: Record<string, [number, number, number, number]> = {head: [-80, 80, -470, -300], chest: [-80, 80, -300, -200], belly: [-80, 80, -200, -140]};
  const gx0 = GLASS.x0 + FRAME_PX;
  const gx1 = GLASS.x1 - FRAME_PX;
  const gy0 = GLASS.y0 + FRAME_PX;
  const gy1 = GLASS.y1 - FRAME_PX;
  const out: Record<string, number> = {};
  for (const [name, [x0, x1, y0, y1]] of Object.entries(zones)) {
    let n = 0;
    let v = 0;
    for (let lx = x0; lx <= x1; lx += 8)
      for (let ly = y0; ly <= y1; ly += 8) {
        n++;
        const p = {x: H2D.x + lx * mpp, z: -H2D.z, h: -ly * mpp};
        const q = projectWith(VS, p);
        if (q.x >= gx0 && q.x <= gx1 && q.y >= gy0 && q.y <= gy1 && !hiddenByPartition(p, VS)) v++;
      }
    out[name] = v / n;
  }
  return out;
})();
if (REFLECTION_VIS.head < 0.9) throw new Error(`S2: only ${(100 * REFLECTION_VIS.head).toFixed(0)} % of his reflected head is visible in the glass (needs 90 %)`);

/** The sensor box hides light on its wall side (S is on its far face, the readout faces the camera). */
const sensorBoxHides = (s: typeof VS, tilt: number): HiddenTest => {
  const b = standGeometry(tilt).box;
  return (p) => {
    if (p.z > S2D.z + 0.02) return false;
    const q = projectWith(s, {x: p.x, z: p.z, h: p.h ?? LIGHT_H});
    return q.x > b.x0 - 2 && q.x < b.x1 + 2 && q.y > b.y0 - 2 && q.y < b.y1 + 2;
  };
};

/** Overlay light at RAISED_TILT is hidden behind the partition AS DRAWN, behind both people and behind the sensor box. */
const HIDE_A: HiddenTest = (() => {
  const ph = partitionHides(VS, LIGHT_H);
  const fh = figuresHide(VS, LIGHT_H, [
    {z: LAYOUT.operator.z, place: OP},
    {z: H2D.z, place: GU},
  ]);
  const sb = sensorBoxHides(VS, RAISED_TILT);
  return (p) => ph(p) || fh(p) || sb(p);
})();

/**
 * S2.4: three paths from the hider to the sensor via three different wall spots, in the room at TILT 0 (at the
 * raised 0.10 no head path both obeys the light-path rule and has a visible wall spot: his head is above the near
 * panels' tops on screen and wall spots right of the screen are behind him; PATH_LEGIBILITY_PLAN §4 S2.4). Each path
 * starts at a point of the drawn rig (head centre, left shoulder, left foot). Rigs are on the set's height scale
 * (rigScale), so the drawn body points ARE the true heights (head 1.45, shoulder 1.13, feet 0.04 m; asserted within
 * 2 cm). Checked here, all as throws: (1) in plan every path is valid (assertPath: no leg crosses the partition; each
 * crosses from his side to the sensor's side through the gap at the wall); (2) on screen every leg obeys the light-path
 * rule (assertAroundTheEnd at the shot's zoom: behind the partition only by its ends, 24 px below the corner; S -> W
 * legs 18 px clear); (3) every wall spot is visible, clear of both people, and the spots are 0.3 m apart; (4) the three
 * path lengths agree within one 250 ps bin (7.5 cm of path), so the three returns really are one blip at the sensor.
 * Wall spots picked with the rule_check.ts §3 search at tilt 0 (30 px corner margin, 24 px front clearance), scored
 * for legibility by the length of each path the camera really sees (partition and both people hidden), each leg one
 * unbroken visible run reaching its spot: the head's spot low by the gap, the feet's at mid height by the far end,
 * the shoulder's high on the bare wall between her head and the partition; no spot behind the sensor or its tripod.
 * Director review (pathfix rev): the shoulder spot moved from x 1.78 to 1.86 and the feet spot from 1.92 to 1.98, so
 * the sensor-bound legs fan into the sensor from above and upper right instead of grazing her pencil and ear (the
 * shoulder leg passed 8 world px from the pencil tip; now >= 20, asserted below). The three lengths agree within 55 mm.
 */
const TILT4 = 0;
const V4 = viewAt(TILT4);
const OP4 = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, TILT4);
const GU4 = rigAt(H2D.x, H2D.z, TILT4);
/** S2.4 framing: the tilt-0 room on the right, a column on the left (x 92..792) for the confetti inset and the bars
 *  card (as S1 ends), over the wall and floor continued past the room's open left end (HANDOFF_S2S3_EXTEND). The room spans screen x ~840..1790; his feet stand just above the caption band. It is the shared
 *  S2 -> S3 hand-off camera (lib/shots HANDOFF_S2S3, review r1 D03, lead L1 option a): S3 opens on this camera at tilt 0
 *  in S2's last poses, so the cut at the scene boundary is one room (asserted below). */
const CAM_D: Cam = HANDOFF_S2S3;
if (CAM_D.cx !== 585 || CAM_D.cy !== 470 || CAM_D.zoom !== 1.2)
  throw new Error(`S2: HANDOFF_S2S3 moved (${CAM_D.cx}, ${CAM_D.cy}, ${CAM_D.zoom}); S2.4's column, inset, bars card and marker clearances were laid out for {585, 470, 1.2}`);
/** Merge r3 (S2 -> S3 hand-off): S2.4's room is drawn with the wall and floor continued HANDOFF_S2S3_EXTEND m past its
 *  open left end (RoomSet extendLeft), so the left column behind the inset and the bars card is wall and floor, not
 *  bare paper, and S3 opens on the same set. The shot starts on a hard cut (CUT4), so no frame shows it switch on. The
 *  extended end (wall end, slab end and drop shadow, with the outline) must be out of frame at CAM_D. */
{
  const s = viewAt(TILT4);
  const {z0, z1, wallHeight: HW} = LAYOUT.room;
  const xe = LAYOUT.room.x0 - HANDOFF_S2S3_EXTEND;
  let mx = -Infinity;
  for (let k = 0; k <= 60; k++) {
    const z = z0 - WALL_T + (z1 - z0 + WALL_T) * (k / 60);
    for (const p of [{x: xe, z, h: -SLAB_T}, {x: xe, z, h: 0}, {x: xe, z: z0 - WALL_T, h: (HW * k) / 60}, {x: xe, z: z0, h: (HW * k) / 60}]) {
      const q = projectWith(s, p);
      for (const [dx, dy] of [[0, 0], [10, 14]]) {
        const sc = worldToScreen(CAM_D, q.x + dx, q.y + dy);
        if (sc.y >= -OUTLINE && sc.y <= 1080 + OUTLINE) mx = Math.max(mx, sc.x + OUTLINE);
      }
    }
  }
  if (!(HANDOFF_S2S3_EXTEND > 0) || mx >= 0) throw new Error(`S2: the S2.4 set's extended left end is in frame (to ${mx.toFixed(0)} px): the left column would show bare paper`);
}
/** `local`: the rig point (rig px, feet at 0,0) each path starts from. The shoulder is the top of his left shoulder
 *  (the arm root at x -66 stands right on the partition's near edge at tilt 0, so its marker would sit on the screen).
 *  `mark`: where the origin marker sits if not on that point (rig px): the head path leaves his head on the
 *  partition's side (his left cheek and ear stand behind its near end at tilt 0), so the head's marker sits on his
 *  hair at the up-left of the head, the head's side the camera sees, not as a red dot on his face; the shoulder's sits
 *  a little in from the shoulder's edge, so the marker and its departure ring stay clear of the partition. */
const PARTS = [
  {id: 'head', local: {x: 0, y: -372}, trueH: 1.45, wall: {x: 1.98, h: 0.43}, mark: {x: -34, y: -414}, color: '#C0392B'},
  {id: 'shoulder', local: {x: -44, y: -294}, trueH: 1.13, wall: {x: 1.86, h: 1.84}, mark: {x: -30, y: -290}, color: C.saffronDeep},
  {id: 'feet', local: {x: -33, y: -8}, trueH: 0.04, wall: {x: 1.98, h: 1.19}, mark: null, color: C.blue},
];
/** S2.4 drawing sizes (world px at CAM_D zoom 1.2), sized for a phone (40 %): route and trail strokes, wall-spot rings,
 *  origin markers on him, pulses. */
const R4 = {route: 7, dash: '15 11', trail: 9, spot: 12, mark: 18, markDot: 10, pulse: 15};
/** Overlay light at tilt 0: the partition as drawn, both people (figuresHide), and his outline grown by 10 px (the
 *  shared silhouette leaves a notch between his shoulder and head where a path leaving his shoulder for the wall would
 *  otherwise be drawn across his shirt). */
const HIDE4: HiddenTest = (() => {
  const ph = partitionHides(V4, LIGHT_H);
  const fh = figuresHide(V4, LIGHT_H, [
    {z: LAYOUT.operator.z, place: OP4},
    {z: H2D.z, place: GU4},
  ]);
  const him = (p: PlanPt) => p.z < H2D.z + 0.05 && rigCovers(GU4, projectWith(V4, {x: p.x, z: p.z, h: p.h ?? LIGHT_H}), 10);
  const sb = sensorBoxHides(V4, TILT4);
  return (p) => ph(p) || fh(p) || him(p) || sb(p);
})();
/** Is a world-px point on the sensor stand at tilt 0 (the box, the column, the tripod legs; 20 px margin)? */
const behindStand = (q: {x: number; y: number}) => {
  const s0 = projectWith(V4, S3D);
  const hub = projectWith(V4, {x: S3D.x, z: S3D.z, h: 0.49});
  if (Math.abs(q.x - s0.x) < 70 && Math.abs(q.y - s0.y) < 60) return true;
  if (q.y > s0.y && q.y < hub.y && Math.abs(q.x - s0.x) < 28) return true;
  if (q.y < hub.y - 10) return false;
  const f1 = projectWith(V4, {x: S3D.x - 0.16, z: S3D.z + 0.1, h: 0});
  const f2 = projectWith(V4, {x: S3D.x + 0.17, z: S3D.z + 0.08, h: 0});
  const u = (q.y - hub.y) / (f1.y - hub.y);
  return q.x > hub.x + (f1.x - hub.x) * u - 22 && q.x < hub.x + (f2.x - hub.x) * u + 22;
};
const P4 = (p: Required<PlanPt>) => {
  const q = projectWith(V4, p);
  return {x: q.x, y: q.y};
};
const BLEND = PARTS.map((p) => {
  const eff: Required<PlanPt> = {x: H2D.x + (p.local.x * GU4.scale) / V4.ppm, z: H2D.z, h: (-p.local.y * GU4.scale) / (V4.ppm * V4.height)};
  if (Math.abs(eff.h - p.trueH) >= 0.02) throw new Error(`S2: blend path ${p.id}: the drawn rig point is at h ${eff.h.toFixed(3)} m, not its true ${p.trueH} m`);
  const W: Required<PlanPt> = {x: p.wall.x, z: 0, h: p.wall.h};
  assertPath([{x: eff.x, z: eff.z}, {x: W.x, z: 0}, S2D], OLAYOUT);
  assertAroundTheEnd(`S2.4 blend ${p.id}`, [[eff, W, S3D]], V4, {zoom: CAM_D.zoom});
  const wq = projectWith(V4, W);
  if (hiddenByPartition(W, V4, {padPx: 12}) || rigCovers(GU4, wq, 12) || rigCovers(OP4, wq, 12) || behindStand(wq)) throw new Error(`S2: blend path ${p.id}: its wall spot is not clear on screen`);
  const real = {...eff, h: p.trueH};
  const L1 = dist3(real, W);
  const L2 = dist3(W, S3D);
  const px = [P4(eff), P4(W), P4(S3D)];
  // the visible pieces of each leg (u ranges along the leg): the partition as drawn and both people hide the rest
  const vis = [visibleSpans(eff, W, TILT4, {noOccluder: true, hidden: HIDE4, steps: 96}), visibleSpans(W, S3D, TILT4, {noOccluder: true, hidden: HIDE4, steps: 96})];
  return {...p, eff, W, L1, L2, L: L1 + L2, px, vis};
});
{
  const Ls = BLEND.map((b) => b.L);
  if (Math.max(...Ls) - Math.min(...Ls) > 0.075) throw new Error(`S2: blend paths differ by more than one 250 ps bin (${Ls.map((l) => l.toFixed(3)).join(', ')})`);
  for (let i = 0; i < BLEND.length; i++)
    for (let j = i + 1; j < BLEND.length; j++)
      if (Math.hypot(BLEND[i].W.x - BLEND[j].W.x, BLEND[i].W.h - BLEND[j].W.h) < 0.3) throw new Error(`S2: blend wall spots ${BLEND[i].id} and ${BLEND[j].id} are closer than 0.3 m`);
}
const L_MAX = Math.max(...BLEND.map((b) => b.L));
/** Where each path's origin marker sits (world px): on the drawn start point (shoulder, foot), or on `mark` (the
 *  head's, on his hair). Asserted: every marker centre is on him, and the whole marker (its ring plus the departure
 *  burst ring, R4.mark * 1.35 + 4 px plus its stroke) is clear of the partition as drawn. */
const atHisDepth = (q: {x: number; y: number}): Required<PlanPt> => {
  const x = V4.pivot.x + (q.x - V4.ax) / V4.ppm - V4.shear * (H2D.z - V4.pivot.z);
  const h = V4.pivot.h + (V4.floor * (H2D.z - V4.pivot.z) - (q.y - V4.ay) / V4.ppm) / V4.height;
  return {x, z: H2D.z, h};
};
const ORIGIN_PX = BLEND.map((b) => {
  const q = b.mark ? {x: GU4.x + b.mark.x * GU4.scale, y: GU4.y + b.mark.y * GU4.scale} : b.px[0];
  if (!rigCovers(GU4, q)) throw new Error(`S2: the ${b.id} marker is not on his body`);
  const rr = R4.mark * 1.35 + 8;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 2 * Math.PI;
    if (hiddenByPartition(atHisDepth({x: q.x + rr * Math.cos(a), y: q.y + rr * Math.sin(a)}), V4, {padPx: 3})) throw new Error(`S2: the ${b.id} marker overlaps the partition`);
  }
  return q;
});
/** The sensor-bound legs keep clear of her head, hair and pencil (rigCovers grown by 10 px) above her shoulders. */
for (const b of BLEND)
  for (let u = 0; u <= 0.9; u += 0.02) {
    const q = P4({x: b.W.x + (S3D.x - b.W.x) * u, z: b.W.z + (S3D.z - b.W.z) * u, h: b.W.h + (S3D.h - b.W.h) * u});
    if (q.y < OP4.y - 300 * OP4.scale && rigCovers(OP4, q, 10)) throw new Error(`S2: blend path ${b.id}: the leg to the sensor grazes her head`);
  }

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
const RAY2_HIT = RAY2_0 + RAY2_DUR; // the pulse reaches him (hidden behind his body): rim flash
const BUSTED = Math.max(K.friend + 2, Math.round(RAY2_M) + 2);
const DUCK = Math.max(BUSTED + 8, K.visible + 1);
const DUCK_DOWN = 4; // frames: a fast duck (A02 #4: both mitts clamp on the crown, deep squat)
const DUCK_HIT = DUCK + DUCK_DOWN;
const HANDS_UP0 = DUCK - 2; // the hands lead the squat by two frames
const HANDS_UP_DUR = 4;

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
/** The three paths draw one at a time (review r1 D17): path k's marker pops at ROUTES0 + k * ROUTE_STAGGER and its route
 *  draws body-first over ROUTE_DUR, so each stub comes out from behind the partition right after its own marker (and
 *  its second throb, ROUTE_EMERGE below) and the previous path has finished drawing before the next marker pops. All
 *  three must be drawn before the pulses leave on "Everything". */
const ROUTE_STAGGER = 26;
const ROUTE_DUR = 20;
if (ROUTE_DUR > ROUTE_STAGGER - 4) throw new Error('S2: the S2.4 routes must draw one at a time (ROUTE_DUR <= ROUTE_STAGGER - 4)');
if (ROUTES0 + 2 * ROUTE_STAGGER + ROUTE_DUR > K.everything + 2)
  throw new Error(`S2: the three S2.4 routes (one at a time from ${ROUTES0}) are not drawn by "Everything" (${K.everything}): ${ROUTES0 + 2 * ROUTE_STAGGER + ROUTE_DUR}`);
const BITS = Math.max(CUT4 + 16, K.bits);
const PULSE0 = Math.max(ROUTES0 + 2 * ROUTE_STAGGER + ROUTE_DUR, K.everything + 2);
/** Route k's draw-on (0..1 of its drawn length, body first), exactly as RoomBlendShot draws it. */
const routeAt = (g: number, k: number) => tw(g, ROUTES0 + k * ROUTE_STAGGER, ROUTE_DUR, E.inOut);
/** Drawn (world px) lengths of each route's two legs (him -> wall spot, wall spot -> sensor). */
const ROUTE_PX = BLEND.map((b) => ({l1: Math.hypot(b.px[1].x - b.px[0].x, b.px[1].y - b.px[0].y), l2: Math.hypot(b.px[2].x - b.px[1].x, b.px[2].y - b.px[1].y)}));
/** First frame of route k's draw-on at which its drawn head is past `frac` of the route's drawn length. */
const routeFrame = (k: number, frac: number, what: string) => {
  for (let g = ROUTES0 + k * ROUTE_STAGGER; g <= ROUTES0 + k * ROUTE_STAGGER + ROUTE_DUR; g++) if (routeAt(g, k) > frac) return g;
  throw new Error(`S2: route ${BLEND[k].id} never reaches its ${what}`);
};
/** The frame each route's stub comes out from behind the partition's FAR end (review r1 D17): the leg him -> wall spot
 *  is hidden from his body (behind the partition's near end) until its last "out" crossing at the far edge; that is
 *  also where its first visible run starts (asserted), so the stub really appears on this frame. The origin marker
 *  throbs again and sends one ring in the path's colour on it. */
const ROUTE_EMERGE = BLEND.map((b, k) => {
  const cr = partitionCrossings(b.eff, b.W, V4, {zoom: CAM_D.zoom}).crossings;
  const out = cr[cr.length - 1];
  if (!out || out.dir !== 'out' || out.edge !== 'far') throw new Error(`S2: blend path ${b.id}: the leg to the wall does not come out at the partition's far end`);
  const run0 = b.vis[0][0];
  if (!run0 || Math.abs(run0[0] - out.u) > 0.01) throw new Error(`S2: blend path ${b.id}: its first visible stretch starts at u ${run0?.[0]}, not at the far-end exit ${out.u.toFixed(3)}`);
  const {l1, l2} = ROUTE_PX[k];
  return routeFrame(k, ((run0[0] + 1e-4) * l1) / (l1 + l2), 'far-end exit');
});
/** The frame each route's drawn head reaches its wall spot: the spot pops then (it used to pop at 45 % of the draw,
 *  before the head stub had even come out from behind the partition). */
const SPOT_HIT = BLEND.map((_, k) => routeFrame(k, ROUTE_PX[k].l1 / (ROUTE_PX[k].l1 + ROUTE_PX[k].l2) - 1e-6, 'wall spot'));
for (let k = 0; k < BLEND.length; k++) {
  const pop = ROUTES0 + k * ROUTE_STAGGER;
  // each stub comes out after its own marker has popped (8 frames) and before the next marker pops
  if (ROUTE_EMERGE[k] < pop + 6 || SPOT_HIT[k] < ROUTE_EMERGE[k] || (k + 1 < BLEND.length && SPOT_HIT[k] + 4 > ROUTES0 + (k + 1) * ROUTE_STAGGER))
    throw new Error(`S2: blend path ${BLEND[k].id}: marker ${pop}, stub out ${ROUTE_EMERGE[k]}, spot ${SPOT_HIT[k]} are not one path at a time`);
}
const ARRIVE = Math.max(PULSE0 + 30, K.blend + 4);
const BARS_IN = Math.max(ARRIVE + 6, K.many - 4);
const INSET_OUT = Math.max(BITS + 16, BARS_IN - 6); // the inset hands over to the bars card (no empty left third)
const DROP0 = Math.max(BARS_IN + 14, K.what);
const DROP_DUR = clamp(K.survives + 10 - DROP0, 10, 18);
const DROP_HIT = DROP0 + DROP_DUR;
const LABEL_T = DROP_HIT + 3;
/** The routes, wall spots and origin markers clear with the trails as the blip is tossed ("what survives": the paths
 *  do not), so S2's last frames hold only the room, both people and the settled card: S3 opens on exactly that. */
const ROUTES_OUT = DROP0;
const ROUTES_OUT_DUR = 14;
/** Review r1 D03, lead L1 option a: NO takeover. The "what survives: timing" card stays at its settled size and place
 *  (settled labels do not move) and the room stays opaque to S2's last frame; S3 opens on the same camera
 *  (HANDOFF_S2S3, at tilt 0, both people in S2's last poses) and carries the same card out left during its push, so
 *  the scene cut is one room (PATH_LEGIBILITY_PLAN: "the S2->S3 pair must read as one room at tilt 0"). The old
 *  takeover (the card grew 2.06x over a dissolving room, held 0.3 s, then a hard cut to a reframed room) is kept only
 *  as the lead's option b and is off: TAKEOVER_DUR = 0. */
const TAKEOVER0 = Math.min(Math.max(LABEL_T + 12, K.end - 26), K.end - 14);
const TAKEOVER_DUR = 0;
/** One room to the cut: everything S2.4 adds over the room has cleared, and the label has settled, a beat before the
 *  last frame (so S3's first frame, which draws none of it, is the same picture). */
if (ROUTES_OUT + ROUTES_OUT_DUR > K.end - 8) throw new Error(`S2: the S2.4 routes are still clearing at the cut (${ROUTES_OUT + ROUTES_OUT_DUR} > ${K.end - 8})`);
if (LABEL_T + 9 > K.end - 8) throw new Error(`S2: "what survives: timing" has not settled a beat before the cut (${LABEL_T + 9} > ${K.end - 8})`);

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

type GuesserState = {pose: Pose2; squash: [number, number]; life: number; handsUp: number; rim: number};

/** S1 ends with him arms crossed, glancing at the wall, uneasy: S2.2 picks him up there. */
const UNEASY: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both', lid: 0.12, eyes: 1.12, brows: 0.6, browAsym: 0, mouth: 'hmm', lookX: -0.7, lookY: -0.85, tilt: -5, hunch: 0.04, sweat: 0.8};
const AT_MIRROR = {lookX: -0.92, lookY: -0.35};
/** J2's duck after A02 #4: a deep squat (knees out), shoulders hunched, both mitts clamped on his crown (the arms are
 *  solved per frame with reach2 on the crown of the current body, so the hands stay on his hair as he drops),
 *  worried brows, eyes up and to the side. The mouth is 'o' as he drops, then a frown. */
const DUCK_BODY: Pose2 = {...IDLE2, ...CROUCH, sink: 98, hunch: 0.15, tilt: 4, lean: 0, lid: 0, eyes: 1.14, pupil: 0.72, brows: 1, browAsym: 0, mouth: 'frown', sweat: 1, lookX: -0.8, lookY: -0.6, armsFront: 'both'} as Pose2;
const RELIEVED: Pose2 = withPose(HANDS_ON_HIPS, {lid: 0.5, eyes: 1, pupil: 1, brows: 0.15, browAsym: 0.2, mouth: 'smile', lookX: -0.55, lookY: -0.35, tilt: 3, sweat: 0});

/** Both arms with the mitts on his crown for the body pose `body` (world-exact via the rig's head transform). */
const crownArms = (place: RigPlace, body: Pose2) => {
  const e = eyesWorld(place, body);
  const m = mouthWorld(place, body);
  const k = 1 / 40; // eyes -> mouth = 40 rig px
  const d = {x: (m.x - e.x) * k, y: (m.y - e.y) * k}; // one rig px "down the head", world px
  const r = {x: d.y, y: -d.x}; // one rig px to screen-right of the head
  const at = (lx: number, ly: number) => ({x: e.x + r.x * lx + d.x * ly, y: e.y + r.y * lx + d.y * ly});
  // mitt centres on the hair, just under the crown spikes (eyes are 52 rig px below the head top)
  const L = at(-30, -58);
  const R = at(30, -58);
  // elbow 1 here puts the elbows up and out to the sides (A02 #4): the forearms frame his face, never cross it
  return {armL: reach2(place, body, -1, L.x, L.y, 1), armR: reach2(place, body, 1, R.x, R.y, 1)};
};

/** Blend two arms so the upper arm swings OUT round the side (through the branch where the elbow is outside the
 *  body) and the forearm turns the short way: hands go from crossed-on-chest to the crown, and from the crown to the
 *  hips, beside his face, never across it (a plain angle lerp sweeps both forearms over his face). */
const armOut = (p: Pose2['armL'], q: Pose2['armL'], t: number): Pose2['armL'] => {
  if (t <= 0) return p;
  if (t >= 1) return q;
  let a1 = q.a;
  let best = Infinity;
  for (const k of [-2, -1, 0, 1, 2]) {
    const cand = q.a + 360 * k;
    if (Math.sin((((p.a + cand) / 2) * Math.PI) / 180) > 0.2 && Math.abs(cand - p.a) < best) {
      best = Math.abs(cand - p.a);
      a1 = cand;
    }
  }
  const c0 = p.a + p.b;
  let c1 = q.a + q.b;
  while (c1 - c0 > 180) c1 -= 360;
  while (c1 - c0 < -180) c1 += 360;
  const a = p.a + (a1 - p.a) * t;
  return {a, b: c0 + (c1 - c0) * t - a};
};

const guesserMirror = (g: number): GuesserState => {
  let pose: Pose2 = UNEASY;
  pose = mixPose2(pose, {...pose, ...AT_MIRROR, eyes: 1.06, sweat: 0.6}, tw(g, NOTICE, 8, E.inOut));
  const bust = sp(g, BUSTED, SNAP);
  if (bust > 0) pose = mixPose2(pose, {...pose, ...EXPR.busted, ...AT_MIRROR, tilt: -2}, Math.min(1.05, bust));
  if (g >= BUSTED) pose = {...pose, bob: hop(g, BUSTED, 9, 7)};
  // J2: the duck. Hands snap up to the crown (leading by 2 frames), the body drops in DUCK_DOWN frames
  // (accelerating), squash at the bottom, hold.
  const handsUp = tw(g, HANDS_UP0, HANDS_UP_DUR, E.out);
  const duck = tw(g, DUCK, DUCK_DOWN, E.in);
  const life = g >= HANDS_UP0 && g < RISE0 + 10 ? 0.12 : 0.5;
  if (handsUp > 0) {
    const pre = pose;
    const body = duck > 0 ? mixPose2(pre, {...DUCK_BODY, bob: 0, mouth: g < DUCK_HIT + 8 ? 'o' : 'frown'}, duck) : {...pre, brows: pre.brows + (1 - pre.brows) * handsUp};
    const place: RigPlace = {x: GU.x, y: GU.y, scale: GU.scale, frame: g, seed: GUESSER_SEED, life};
    const arms = crownArms(place, body);
    pose = {...body, armL: armOut(pre.armL, arms.armL, handsUp), armR: armOut(pre.armR, arms.armR, handsUp), armsFront: 'both'};
  }
  if (g >= DUCK_HIT) pose = {...pose, lookY: -0.6 + 0.1 * Math.sin(Math.min(1, (g - DUCK_HIT) / 20) * Math.PI)};
  // the mirror leaves: he stands back up, relieved (hands come down to his hips)
  const rise = tw(g, RISE0, 14, E.inOut);
  if (rise > 0) pose = {...mixPose2(pose, RELIEVED, rise), armL: armOut(pose.armL, RELIEVED.armL, rise), armR: armOut(pose.armR, RELIEVED.armR, rise)};
  const squash = impact(g, DUCK_HIT, 0.14, 10);
  // the pulse reaches him from behind (its last stretch is hidden by the partition and his body): rim flash
  const rim = tw(g, RAY2_HIT - 1, 3) * (1 - tw(g, RAY2_HIT + 6, 10));
  return {pose, squash, life, handsUp: rise > 0.5 ? 0 : handsUp, rim};
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

/** The checker stands with her arms crossed (CRITIC_cast-props: never a forearm over the sensor's readout). */
const CHECKER_BASE: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both'};

const checkerMirror = (g: number): Pose2 => {
  const look = checkerLook(g, [
    [NOTICE + 6, {lookX: 0.95, lookY: -0.5, tilt: -2}],
    [DUCK + 8, {lookX: 0.95, lookY: 0.25, tilt: 2}],
    [RISE0 + 6, {lookX: 0.62, lookY: 0.32, tilt: 3}],
  ]);
  const brow = tw(g, DUCK + 10, 8) * (1 - tw(g, RISE0 + 6, 10));
  return withPose(CHECKER_BASE, {...EXPR.deadpan, ...look, brows: -0.05 + 0.3 * brow, browAsym: 0.5 * brow});
};

/** Items standing in the room at a tilt: the checker, the sensor on its stand, the guesser (optionally squashed and
 *  rim-lit). */
const roomItems = (g: number, tilt: number, checker: Pose2, guesser: GuesserState, sensor: React.ComponentProps<typeof SensorStand>['sensor']): RoomItem[] => {
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const gu = rigAt(H2D.x, H2D.z, tilt);
  const squashed = guesser.squash[0] !== 1;
  const filter = rimFlash(guesser.rim, gu.scale);
  return [
    {
      key: 'checker',
      x: LAYOUT.operator.x,
      z: LAYOUT.operator.z,
      w: 0.3,
      node: <Character2 look={CAST.checker} pose={checker} frame={g} seed={CHECKER_SEED} x={op.x} y={op.y} scale={op.scale} life={0.35} />,
    },
    {
      key: 'stand',
      x: PTS.S.x,
      z: LAYOUT.operator.z + 0.04,
      w: 0.17,
      height: LIGHT_H + 0.15,
      node: <SensorStand tilt={tilt} sensor={sensor} />,
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
          x={gu.x}
          y={gu.y}
          scale={gu.scale}
          life={guesser.life}
          style={squashed || filter ? {transform: squashed ? `scale(${f2(guesser.squash[0])}, ${f2(guesser.squash[1])})` : undefined, transformOrigin: `${f2(200 * gu.scale)}px ${f2(500 * gu.scale)}px`, filter} : undefined}
        />
      ),
    },
  ];
};

/** The framed mirror on the wall, with his reflection (his back) clipped to the glass (world px). */
const WallMirror: React.FC<{g: number; dy: number; guesser: GuesserState; glint: number}> = ({g, dy, guesser, glint}) => {
  const x0 = GLASS.x0;
  const x1 = GLASS.x1;
  const y0 = GLASS.y0 + dy;
  const y1 = GLASS.y1 + dy;
  const fr = FRAME_PX;
  const clip = `polygon(${f2(x0 + fr)}px ${f2(y0 + fr)}px, ${f2(x1 - fr)}px ${f2(y0 + fr)}px, ${f2(x1 - fr)}px ${f2(y1 - fr)}px, ${f2(x0 + fr)}px ${f2(y1 - fr)}px)`;
  const svg = {position: 'absolute' as const, left: 0, top: 0, overflow: 'visible' as const};
  const gl = {x: GLINT.x, y: GLINT.y + dy};
  return (
    <>
      <svg width={1920} height={1080} style={svg}>
        <rect x={x0 + 8} y={y0 + 10} width={x1 - x0} height={y1 - y0} rx={10} fill={C.shadow} />
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={10} fill={C.wood} stroke={C.ink} strokeWidth={4} />
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} rx={4} fill={C.blueLight} />
      </svg>
      {/* his virtual image stays put in the world (a planar mirror sliding in its own plane does not move the image):
          the moving glass only reveals it */}
      <S2Reflection
        look={CAST.guesser}
        pose={guesser.pose}
        frame={g}
        seed={GUESSER_SEED}
        life={guesser.life}
        place={{x: RF.x, y: RF.y, scale: RF.scale}}
        armsOverHead={guesser.handsUp > 0.5}
        squash={guesser.squash}
        clipPath={clip}
        id="s2ref"
      />
      <svg width={1920} height={1080} style={svg}>
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} fill={C.blueLight} opacity={0.14} />
        {/* two flat sheen strokes in the top-right corner (static on the glass) */}
        <path d={`M ${f2(x1 - fr - 64)} ${f2(y0 + fr + 4)} L ${f2(x1 - fr - 4)} ${f2(y0 + fr + 64)}`} stroke={C.white} strokeWidth={13} strokeLinecap="round" opacity={0.75} />
        <path d={`M ${f2(x1 - fr - 26)} ${f2(y0 + fr + 4)} L ${f2(x1 - fr - 4)} ${f2(y0 + fr + 26)}`} stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} rx={4} fill="none" stroke={C.ink} strokeWidth={3} />
        {/* the "ting": a four-point glint on the visible glass just left of the far edge as the pulse bounces */}
        {glint > 0 && glint < 1 && (
          <g transform={`translate(${f2(gl.x)} ${f2(gl.y)}) scale(${f2(Math.sin(glint * Math.PI) * 1.15)}) rotate(${f2(20 * glint)})`}>
            <path d="M 0 -34 Q 4 -4 34 0 Q 4 4 0 34 Q -4 4 -34 0 Q -4 -4 0 -34 Z" fill={C.saffronLight} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
            <circle r={7} fill={C.white} />
          </g>
        )}
      </svg>
    </>
  );
};

/* ---- the magnifier iris (S2.2 -> S2.3) */
const SEC_C = grainTipNear(960);
const LENS_R = 124;
const HANDLE = {x: 0.94, y: 0.34}; // unit vector from the handle's tip toward the lens centre

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
          {/* handle to the left and a little up, into bare wall above her head (down-right would cross his head) */}
          <line x1={f2(c.x - r * HANDLE.x)} y1={f2(c.y - r * HANDLE.y)} x2={f2(c.x - (r + 110 * pop) * HANDLE.x)} y2={f2(c.y - (r + 110 * pop) * HANDLE.y)} stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
          <line x1={f2(c.x - r * HANDLE.x)} y1={f2(c.y - r * HANDLE.y)} x2={f2(c.x - (r + 110 * pop) * HANDLE.x)} y2={f2(c.y - (r + 110 * pop) * HANDLE.y)} stroke={C.woodDeep} strokeWidth={22} strokeLinecap="round" />
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

/** S2.3: the magnifier lands on bare wall where the mirror hung (upper glass area), clear of the 2 m partition's far
 *  top and of his hair at CAM_B: checked at module load on a ring 24 world px outside the lens. */
const LENS_W = PX(2.27, 0, 2.0);
{
  const R = LENS_R / CAM_B.zoom + 24;
  const dz = 0 - VS.pivot.z;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 2 * Math.PI;
    const q = {x: LENS_W.x + R * Math.cos(a), y: LENS_W.y + R * Math.sin(a)};
    const wall = {x: VS.pivot.x + (q.x - VS.ax) / VS.ppm - VS.shear * dz, z: 0, h: VS.pivot.h + (VS.floor * dz - (q.y - VS.ay) / VS.ppm) / VS.height};
    if (hiddenByPartition(wall, VS) || rigCovers(GU, q) || rigCovers(OP, q)) throw new Error(`S2: the magnifier does not land on bare wall (ring point ${q.x.toFixed(0)}, ${q.y.toFixed(0)})`);
  }
}

const RoomMirrorShot: React.FC<{g: number}> = ({g}) => {
  const cam = camPath(g, CAM_A, [{at: PUSH2_0, dur: PUSH2_DUR, to: CAM_B}]);
  const gu = guesserMirror(g);
  const ch = checkerMirror(g);
  // the mirror drops in from above the frame and later slides out of it upward
  const mirrorDy = g < MIRROR_OFF0 ? drop(g, DROP_LAND, 600, 10) : -E.in(tw(g, MIRROR_OFF0, 12, E.linear)) * 620;
  const mirrorOn = g >= DROP_LAND - 10;
  // the specular pulse S -> mirror -> him (fades as he ducks out of it); hidden behind the partition as drawn and
  // behind both people, so it goes into the slot, vanishes at the far end, and the glint and his rim flash take over
  const rayT = clamp01((g - RAY2_0) / RAY2_DUR);
  const rayOp = 1 - tw(g, DUCK, 10);
  const glint = (g - (Math.round(RAY2_M) - 1)) / 12;
  const backdrop = <>{mirrorOn && <WallMirror g={g} dy={mirrorDy} guesser={gu} glint={glint} />}</>;
  const items = roomItems(g, RAISED_TILT, ch, gu, {led: 1, reveal: 1});
  const lensScr = worldToScreen(cam, LENS_W.x, LENS_W.y);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={RAISED_TILT} items={items} backdrop={backdrop}>
            {g >= RAY2_0 && rayOp > 0 && (
              <LightPath points={[S2D, SPEC, H2D]} toPx={roomToPx} t={rayT} pulses={3} pulseGap={0.09} intensityFalloff={0.92} layout={OLAYOUT} clearPx={0} hidden={HIDE_A} arrive="hide" opacity={rayOp} />
            )}
          </RoomSet>
        </Layer>
      </Camera>
      <SlowedChip t={tw(g, RAY2_0 - 2, 8) * (1 - tw(g, DUCK + 6, 8))} />
      <Iris g={g} from={{x: lensScr.x, y: lensScr.y}} />
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
/** The inset -> slots card hand-over (review r1 D18, r2 N04): both cards are opaque on every frame they are drawn and
 *  travel the whole way between off frame and their place, so neither pops, fades or stands see-through.
 *  - The inset slides out left by its right edge plus its shadow (INSET_SLIDE), so at insetIn 0 it is already past the
 *    frame edge. (It used to fade over its last third; since merge r3 the set runs on to the frame's left edge
 *    (extendLeft), so that fade left one see-through frame over the wall, 2766 in REVIEW2.)
 *  - The slots card comes in from off frame the same way (BARS_SLIDE = its right edge plus its shadow, plus 10) and
 *    decelerates into its place over BARS_DUR (E.out). It used to slide only 60 px, so its first frame showed the
 *    whole 700 x 372 card at once (review r2 N04: a pop at 2764). The settled place is unchanged, so S2's last frame
 *    (and S3's first) are too.
 *  Asserted: never see-through over the set, never both see-through, the card off frame at barsIn 0, its first drawn
 *  frame shows at most 400 px of it, and it has settled before the blip drops into its slot. */
const INSET_SLIDE = INSET.x1 + 20;
const BARS_SLIDE = BARS.x1 + 20;
const BARS_DUR = 14;
/** The inset's exit: a steady ease-in (quadratic) slide, so it accelerates out without E.in's last-frame jump. */
const insetInAt = (g: number) => {
  const u = tw(g, INSET_OUT, 10, E.linear);
  return 1 - u * u;
};
const insetOpAt = (g: number) => (insetInAt(g) > 0 ? 1 : 0);
const barsInAt = (g: number) => tw(g, BARS_IN, BARS_DUR, E.out);
const barsOpAt = (g: number) => (barsInAt(g) > 0 ? 1 : 0);
{
  // the set covers the whole frame width behind both cards (extendLeft, asserted above), so "over the room" is "on screen"
  const rb = roomBounds(TILT4);
  const setLeft = Math.min(0, worldToScreen(CAM_D, rb.x0, rb.y0).x);
  /** right-most screen x of a card (its drop shadow is 10 px right of it) for slide progress u */
  const insetRight = (u: number) => INSET.x1 + 10 - INSET_SLIDE * (1 - u);
  const barsRight = (u: number) => BARS.x1 + 10 - BARS_SLIDE * (1 - u);
  let barsSeeThrough = 0;
  let barsFirst = -1;
  for (let g = Math.min(INSET_OUT, BARS_IN) - 1; g <= Math.max(INSET_OUT + 10, BARS_IN + BARS_DUR) + 1; g++) {
    const ii = insetInAt(g);
    const io = insetOpAt(g);
    const bo = barsOpAt(g);
    const insetGhost = io > 0 && io < 1;
    const barsGhost = bo > 0 && bo < 1;
    if (insetGhost && insetRight(ii) > setLeft) throw new Error(`S2: frame ${g}: the confetti inset is see-through over the room`);
    if (insetGhost && barsGhost) throw new Error(`S2: frame ${g}: the inset and the slots card are both see-through`);
    if (barsGhost) barsSeeThrough++;
    if (barsFirst < 0 && barsInAt(g) > 0) barsFirst = g;
  }
  if (barsSeeThrough > 0) throw new Error(`S2: the slots card is see-through for ${barsSeeThrough} frames`);
  if (insetRight(0) > 0) throw new Error(`S2: the confetti inset is still in frame (to x ${insetRight(0)}) when it stops being drawn`);
  if (barsRight(0) > 0) throw new Error(`S2: the slots card is not off frame at barsIn 0 (its right edge at x ${barsRight(0)}): it would pop in`);
  if (barsFirst < 0) throw new Error('S2: the slots card never arrives');
  const shown = barsRight(barsInAt(barsFirst));
  if (shown > 400) throw new Error(`S2: frame ${barsFirst}: the slots card's first frame shows ${shown.toFixed(0)} px of it (> 400): a pop`);
  if (DROP0 < BARS_IN + BARS_DUR - 2) throw new Error(`S2: the blip drops (${DROP0}) before the slots card has settled (${BARS_IN + BARS_DUR})`);
}
/** The takeover (TAKEOVER0): the bars card's centre moves to TAKE_C and it grows to 1440 px wide (x 240..1680, y
 *  138..903: inside the 5 % margins and above the caption band; the label becomes 107 px, "time ->" 70 px). */
const BARS_C = {x: (BARS.x0 + BARS.x1) / 2, y: (BARS.y0 + BARS.y1) / 2};
const TAKE_C = {x: 960, y: 520};
const TAKE_K = 1440 / (BARS.x1 - BARS.x0);
{
  const y0 = TAKE_C.y - ((BARS.y1 - BARS.y0) / 2) * TAKE_K;
  const y1 = TAKE_C.y + ((BARS.y1 - BARS.y0 + 14) / 2) * TAKE_K;
  if (y0 < 1080 * 0.05 || y1 > 1080 * 0.88 || TAKE_C.x - 720 < 1920 * 0.05) throw new Error('S2: the takeover card leaves the safe area');
}

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
  return withPose(CHECKER_BASE, {...EXPR.deadpan, ...look, brows: -0.05 + 0.3 * brow, browAsym: 0.5 * brow});
};

type Blend = (typeof BLEND)[number];
const legEnds = (b: Blend, leg: number): [Required<PlanPt>, Required<PlanPt>] => (leg === 0 ? [b.eff, b.W] : [b.W, S3D]);
const legAt = (b: Blend, leg: number, u: number): Required<PlanPt> => {
  const [p, q] = legEnds(b, leg);
  return {x: p.x + (q.x - p.x) * u, z: p.z + (q.z - p.z) * u, h: p.h + (q.h - p.h) * u};
};
/** SVG path data for the visible pieces of a leg between u0 and u1 (the leg is straight on screen: affine map). */
const legRuns = (b: Blend, leg: number, u0: number, u1: number) =>
  b.vis[leg]
    .map(([a, c]) => [Math.max(a, u0), Math.min(c, u1)])
    .filter(([a, c]) => c > a + 1e-4)
    .map(([a, c]) => {
      const p = P4(legAt(b, leg, a));
      const q = P4(legAt(b, leg, c));
      return `M ${f2(p.x)} ${f2(p.y)} L ${f2(q.x)} ${f2(q.y)}`;
    })
    .join(' ');
const SPX4 = P4(S3D);

const RoomBlendShot: React.FC<{g: number}> = ({g}) => {
  const cam = CAM_D;
  const gu: GuesserState = {pose: guesserBlend(g), squash: [1, 1], life: 0.5, handsUp: 0, rim: 0};
  const ch = checkerBlend(g);
  const v = L_MAX / Math.max(1, ARRIVE - PULSE0);
  const travelled = (g - PULSE0) * v;
  const arrivedFrac = BLEND.filter((b) => travelled >= b.L).length / BLEND.length;
  const flash = sp(g, ARRIVE, SNAP) * (1 - tw(g, ARRIVE + 30, 20));
  const trailOp = 1 - tw(g, DROP0, 14);
  // the dashed routes and their wall spots clear with the trails (gone well before the one-room cut to S3)
  const routeOp = 1 - tw(g, ROUTES_OUT, ROUTES_OUT_DUR);
  const routes = BLEND.map((b, k) => {
    const r = routeAt(g, k);
    if (r <= 0) return null;
    // draw-on of the dashed route by drawn length; only the stretches the camera sees (partition, people) are drawn
    const {l1, l2} = ROUTE_PX[k];
    const head = r * (l1 + l2);
    const routeD = [legRuns(b, 0, 0, clamp01(head / l1)), legRuns(b, 1, 0, clamp01((head - l1) / l2))].join(' ').trim();
    // the pulse (constant real speed along the true path lengths) and its trail
    const on = g >= PULSE0 && travelled < b.L;
    const leg = travelled <= b.L1 ? 0 : 1;
    const u = leg === 0 ? clamp01(travelled / b.L1) : clamp01((travelled - b.L1) / b.L2);
    const p3 = on ? legAt(b, leg, u) : null;
    const pp = p3 && !HIDE4(p3) ? P4(p3) : null;
    const trailD = g < PULSE0 ? '' : [legRuns(b, 0, 0, leg === 0 && on ? u : 1), on && leg === 0 ? '' : legRuns(b, 1, 0, on ? u : 1)].join(' ').trim();
    const spot = g >= SPOT_HIT[k] ? E.back(clamp01((g - SPOT_HIT[k] + 1) / 6)) : 0;
    return (
      <g key={b.id}>
        {routeD && routeOp > 0 && <path d={routeD} fill="none" stroke={mixHex(b.color, C.paper, 0.22)} strokeWidth={R4.route} strokeDasharray={R4.dash} strokeLinecap="round" strokeLinejoin="round" opacity={f2(routeOp)} />}
        {spot > 0 && routeOp > 0 && <circle cx={f2(b.px[1].x)} cy={f2(b.px[1].y)} r={f2(R4.spot * spot)} fill={C.cream} stroke={C.ink} strokeWidth={4} opacity={f2(routeOp)} />}
        {trailD && trailOp > 0 && <path d={trailD} fill="none" stroke={b.color} strokeWidth={R4.trail} strokeLinecap="round" strokeLinejoin="round" opacity={0.9 * trailOp} />}
        {pp && <PulseDot x={pp.x} y={pp.y} r={R4.pulse} color={b.color} />}
      </g>
    );
  });
  // the merged blip sits on the sensor's far face until it drops
  const blipOn = g >= PULSE0 && arrivedFrac > 0 && g < DROP0;
  const throb = pulse01(g, K.many, 14);
  const markerOp = 1 - tw(g, ROUTES_OUT, ROUTES_OUT_DUR);
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {routes}
      {/* where each path leaves him: head, shoulder, foot (in front of him, so the origins read) */}
      {markerOp > 0 &&
        BLEND.map((b, k) => {
          const m = E.back(clamp01((g - ROUTES0 - k * ROUTE_STAGGER) / 8));
          if (m <= 0) return null;
          const o = ORIGIN_PX[k];
          // the light leaves him: each marker throbs and sends out one ring in its path's colour, first on the frame
          // its own stub comes out from behind the partition's far end (ROUTE_EMERGE), again as the pulses depart
          const ring = (t0: number) => {
            const u = clamp01((g - t0) / 12);
            return u > 0 && u < 1 ? <circle r={f2(R4.mark * (1 + 0.35 * E.out(u)) + 4)} fill="none" stroke={b.color} strokeWidth={f2(5 * (1 - u) + 1)} opacity={f2(1 - u)} /> : null;
          };
          const throb = 1 + 0.35 * (pulse01(g, ROUTE_EMERGE[k] - 2, 12) + pulse01(g, PULSE0 - 2, 12));
          return (
            <g key={b.id} opacity={f2(markerOp)} transform={`translate(${f2(o.x)} ${f2(o.y)})`}>
              {ring(ROUTE_EMERGE[k])}
              {ring(PULSE0)}
              <g transform={`scale(${f2(m * throb)})`}>
                <circle r={R4.mark} fill={C.cream} stroke={C.ink} strokeWidth={4} />
                <circle r={R4.markDot} fill={b.color} />
              </g>
            </g>
          );
        })}
      {blipOn && (
        <>
          <circle cx={SPX4.x} cy={SPX4.y} r={f2(14 + 40 * E.out(clamp01((g - ARRIVE) / 14)))} fill="none" stroke={C.saffronDeep} strokeWidth={5} opacity={f2(1 - clamp01((g - ARRIVE) / 14))} />
          <PulseDot x={SPX4.x} y={SPX4.y} r={10 + 5 * arrivedFrac + 3 * throb} color={C.saffron} />
        </>
      )}
    </svg>
  );
  const items = roomItems(g, TILT4, ch, gu, {led: 1, reveal: 1, bumpHighlight: flash});
  // screen-space: the inset, the bars card, the dropping blip
  const sScr = worldToScreen(cam, SPX4.x, SPX4.y);
  const insetIn = insetInAt(g);
  const lift = tw(g, BITS, 10, E.out);
  const barsIn = barsInAt(g);
  const dropU = clamp01((g - DROP0) / DROP_DUR);
  // the blip is tossed up and over the checker's head (not across her body) and drops into its time slot
  const lobC = {x: sScr.x + 60, y: sScr.y - 900};
  const bz = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  const blipScr = g >= DROP0 && g < DROP_HIT ? {x: bz(sScr.x, lobC.x, SLOT_C.x, dropU), y: bz(sScr.y, lobC.y, SLOT_C.y, dropU)} : null;
  const barRise = sp(g, DROP_HIT, SNAP);
  const lab = g >= LABEL_T ? E.back(clamp01((g - LABEL_T) / 9)) : 0;
  const take = TAKEOVER_DUR > 0 ? E.inOut(tw(g, TAKEOVER0, TAKEOVER_DUR, E.linear)) : 0;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={TILT4} items={items} extendLeft={HANDOFF_S2S3_EXTEND}>
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {/* the metaphor, kept in an inset: confetti still holds bits of the picture */}
      {/* review r1 D18: it leaves solid, sliding out left past the frame edge (no see-through card over the room) */}
      {insetIn > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: f2(insetOpAt(g)), transform: `translateX(${f2(-INSET_SLIDE * (1 - insetIn))}px)`}}>
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
      {/* the takeaway takes over: a paper ground rises over the room while the card grows to the middle */}
      {take > 0 && <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: C.paper, opacity: f2(Math.min(1, take * 1.25))}} />}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, ...(take > 0 ? {transform: `translate(${f2((TAKE_C.x - BARS_C.x) * take)}px, ${f2((TAKE_C.y - BARS_C.y) * take)}px) scale(${f2(1 + (TAKE_K - 1) * take)})`, transformOrigin: `${BARS_C.x}px ${BARS_C.y}px`} : {})}}>
      {/* the row of timing bars */}
      {/* review r1 D18, r2 N04: it arrives solid, sliding in from off frame left and settling (no one-frame pop) */}
      {barsIn > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: f2(barsOpAt(g)), transform: `translateX(${f2(-BARS_SLIDE * (1 - barsIn))}px)`}}>
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
      </div>
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


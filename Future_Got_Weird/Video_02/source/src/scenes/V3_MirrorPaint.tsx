import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {C} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, drop, hop, impact, sp, tw} from '../lib/motion';
import {CAM_ROOM, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, assertAroundTheEnd, hiddenByPartition, partitionCrossings, partitionHides, projectWith, rigAt, viewAt, visibleSpans, type HiddenTest, type PlanPt} from '../lib/room';
import {LAYOUT as OLAYOUT, assertPath, scatterDirections, type P2} from '../lib/optics';
import {rand} from '../lib/anim';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {LightPath, PulseDot, ScatterFan, mixHex, type ToPx} from '../components/v02/Optics';
import {ARMS, CROUCH, Character2, EXPR, HANDS_ON_HIPS, IDLE2, eyesWorld, figuresHide, handWorld2, mixPose2, mouthWorld, reach2, rigCovers, rimFlash, withPose, type Pose2, type RigPlace} from '../components/v02/Cast2';
import {S2Reflection} from '../components/v02/S2_BackHead';
import {SensorStand, standGeometry} from '../components/v02/S2_SensorStand';
import {SectionBackdrop, grainTipNear} from '../components/v02/S2_Section';
import {QuestionTitle} from '../components/v2k/QuestionTitle';
import {Chip, Label, SubLabel, TeachLabel} from '../components/v2k/Labels';
import {PAINT, PaintGrain, PointerStick, TICK_TOP, TimelineHandoff, WallGrain} from '../components/v2s/V3_Parts';

/**
 * V3 · Mirror versus paint (n07, n08, s11, n09). v2/SHOTPLAN_V2.md V3.1–V3.4.
 *
 *  V3.1 n07  Hand-off from V2 (push into W1's paint): the first 4 frames are the relay wall's paint
 *            (ROOM_COLORS.relayWall) with its static paint grain, exactly V2's last frame (V3_Parts PaintGrain = G1's
 *            V2_Plan PAINT_GRAIN; v2 review r1, V2-R1-02). The pull-back starts on the 5th frame and moves visibly from its
 *            first frame (the grain shrinks with the zoom, then fades before it could read as texture): out of a patch of
 *            bare wall paint (no wall-spot marker: W1 is never drawn in the raised view) to the raised room view, S2.2's
 *            CAM_A at RAISED_TILT. The guesser leans on the partition (weight on it, shoulder against its edge) and looks
 *            at the bare wall, untroubled; a small smug nod on "work at all". Question title "What survives the bounce?"
 *            from n07, but only once the room is in view (ROOM_VIS), to the end of n07. The side wall's door is left out
 *            of the room framings (V2-R1-21: only a sliver of it reached the frame's right edge).
 *  V3.2 n08  On "here" a framed mirror (x 1.9–2.72 m) slides down onto the wall; "mirror" (64). The checker's right
 *            arm comes up, her telescopic pointer extends and taps the glass (contact), retracts. One slowed pulse runs
 *            sensor → mirror → him → mirror → sensor (specular point x 2.139 m: under the partition's far-end outline at
 *            this tilt, so the pulse goes into the slot and vanishes; a glint on the visible glass marks each bounce);
 *            "in = out" angle marks for 1 s (a small mirror-law card beside the glass, pointing at the glint); his
 *            wall-side outline rim-flashes when it reaches him ("friend": busted, he straightens); the glass shows his
 *            BACK (S2_BackHead). J2 on "visible": anticipation (a small rise), the duck (mitts clamped on his crown,
 *            squash), held; his reflection ducks in sync. The S2.1 bench is dropped.
 *  V3.3 s11  The mirror slides off, he stands up relieved (hands to hips). A magnifier lands on bare wall and irises into
 *            the paint cross-section (S2_Section): "rough up close" (64); one ray hits the bumps and sprays every which
 *            way; neighbouring spots spray too; a ghost mirror ray fades for comparison; on "tiny lamp" each lit spot glows
 *            (a flat lamp disc and one wave out along its rays); "tiny lamp (our analogy)" (48). Chip "illustration".
 *  V3.4 n09  Iris out onto the room at TILT 0 (S2.4's tilt, re-centred on the room and zoom 1.15 because the postcard /
 *            confetti column is cut). Three pulses leave his head, shoulder and foot, run by three different wall spots
 *            (round the partition's far end, hidden exactly where it or a person covers them) and merge into ONE blip at
 *            the sensor ("blend"); he glances at the wall, uneasy. v2 review r1, V2-R1-06: the three origin markers are
 *            48 px; on the launch frame each one pops and flashes a ring in its path's colour, and it stays lit in that
 *            colour while its pulse is hidden behind the partition, going out on the frame the pulse comes out at the
 *            partition's far edge (that frame is the hidden leg's length at the pulse speed), where the pulse pops in. On "What survives" the kit ArrivalTimeline rises from
 *            below on its paper sheet to fill the frame while the blip is tossed up and drops onto the axis as ONE tick at
 *            one time; "what survives: timing" (64). The last frames are V3_Parts TimelineHandoff, V4's first frame.
 *
 * Every beat is cued from narration words (K) and clamped against the gaps. Every light leg drawn in the room is checked at
 * module load (assertPath in plan, assertAroundTheEnd on screen at the shot's tilt and zoom); failures throw.
 */

/* ================================================================== cues */

const SC = scene('V3');
const K = {
  start: SC.from,
  end: SC.to,
  // n07
  n07: seg('n07').from,
  puzzle: at('n07', 'puzzle'),
  plain7: at('n07', 'plain'),
  work7: at('n07', 'work'),
  all7End: at('n07', 'all', 1, 'end'),
  // n08
  put: at('n08', 'put'),
  mirror8: at('n08', 'mirror'),
  here: at('n08', 'here'),
  friend: at('n08', 'friend'),
  simply: at('n08', 'simply'),
  visible: at('n08', 'visible'),
  // s11 (v1 take)
  s11: seg('s11').from,
  painted: at('s11', 'painted'),
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
  // n09
  n09: seg('n09').from,
  everything: at('n09', 'everything'),
  coming: at('n09', 'coming'),
  blend: at('n09', 'blend'),
  many: at('n09', 'many'),
  paths: at('n09', 'paths'),
  what: at('n09', 'what'),
  survives: at('n09', 'survives'),
  survivesEnd: at('n09', 'survives', 1, 'end'),
  timing: at('n09', 'timing'),
  n09End: segEnd('n09'),
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;
const pulse01 = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/* ================================================================== geometry (layout.json), raised room */

/** The light-path plane (layout sensor.h = hidden.h = 0.95 m, the rig's chest). */
const LIGHT_H = LAYOUT.sensor.h;
const S2D: P2 = {x: PTS.S.x, z: PTS.S.z};
const H2D: P2 = {x: PTS.H.x, z: PTS.H.z};
const S3D: Required<PlanPt> = {x: S2D.x, z: S2D.z, h: LIGHT_H};
const H3D: Required<PlanPt> = {x: H2D.x, z: H2D.z, h: LIGHT_H};
const dist3 = (a: Required<PlanPt>, b: Required<PlanPt>) => Math.hypot(a.x - b.x, a.z - b.z, a.h - b.h);

/** The mirror's specular point for sensor → him: reflect H across the wall line (z = 0), intersect S → H' with the wall
 *  (x = 2.139 m; checked by equal angles and by the plan path test). */
const SPEC: P2 = (() => {
  const Hm = {x: H2D.x, z: -H2D.z};
  const u = S2D.z / (S2D.z - Hm.z);
  return {x: S2D.x + u * (Hm.x - S2D.x), z: 0};
})();
const SPEC3D: Required<PlanPt> = {x: SPEC.x, z: 0, h: LIGHT_H};
/** The framed mirror on the relay wall (plan metres along the wall; h = height on the wall). Shot plan: x 1.9–2.6 m; the
 *  right edge sits at 2.72 because his reflected head (it stands 0.43 m left of him on screen) must be at least 90 % on
 *  the glass (REFLECTION_VIS below: 80 % at 2.65, 89 % at 2.70). */
const MIR = {x0: 1.9, x1: 2.72, h0: 0.9, h1: 2.3};
{
  const aIn = Math.atan2(S2D.x - SPEC.x, S2D.z);
  const aOut = Math.atan2(H2D.x - SPEC.x, H2D.z);
  if (Math.abs(aIn + aOut) > 1e-9) throw new Error(`V3: specular point check failed (${aIn}, ${aOut})`);
  if (SPEC.x < MIR.x0 + 0.1 || SPEC.x > MIR.x1 - 0.1) throw new Error(`V3: specular point x=${SPEC.x.toFixed(3)} is not inside the mirror`);
  if (Math.abs(SPEC.x - 2.14) > 0.01) throw new Error(`V3: specular point moved (${SPEC.x.toFixed(3)}; the shot plan says ≈ 2.14 m)`);
  assertPath([S2D, SPEC, H2D, SPEC, S2D], OLAYOUT);
}

const VS = viewAt(RAISED_TILT);
const PX = (x: number, z: number, h: number = LIGHT_H) => projectWith(VS, {x, z, h});
const roomToPx: ToPx = (p) => {
  const q = PX(p.x, p.z);
  return {x: q.x, y: q.y};
};

/** S2.2's raised framing (world px at tilt 0.10): the bare wall above them where the mirror lands, both people. */
const CAM_A: Cam = {cx: 900, cy: 345, zoom: 1.2};

const OP = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
const GU = rigAt(H2D.x, H2D.z, RAISED_TILT);
/** His virtual image in the wall mirror: H reflected through z = 0 at his own scale; it faces away, so the glass shows
 *  his BACK (S2_BackHead). */
const RF = rigAt(H2D.x, -H2D.z, RAISED_TILT);
if (Math.abs(RF.scale - GU.scale) > 1e-9) throw new Error('V3: the reflection must be drawn at his own scale');

/** The mirror's glass rectangle (world px, before its slide offset); the relay wall faces the camera. */
const GLASS = (() => {
  const a = PX(MIR.x0, 0.004, MIR.h1);
  const b = PX(MIR.x1, 0.004, MIR.h0);
  return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
})();
const FRAME_PX = 15;

/** The light-path rule at CAM_A (V3.2 has no camera move): S → SPEC behind the partition's FAR end, SPEC → H out by the
 *  near end behind his body; the return retraces it. */
assertAroundTheEnd('V3.2 mirror pulse', [[S3D, SPEC3D, H3D]], VS, {zoom: CAM_A.zoom});

/** The glint: on the visible glass just left of the far edge (the true bounce point is under the far end's outline). */
const GLINT3D: Required<PlanPt> = {x: 2.03, z: 0, h: LIGHT_H + 0.12};
const GLINT = PX(GLINT3D.x, GLINT3D.z, GLINT3D.h);
if (hiddenByPartition(GLINT3D, VS, {padPx: 12})) throw new Error('V3: the mirror glint is behind the partition');
if (GLINT.x < GLASS.x0 + FRAME_PX || GLINT.y > GLASS.y1 - FRAME_PX - 12) throw new Error('V3: the mirror glint is not on the glass');

/** How much of his reflected head the camera sees in the glass (the partition paints over its lower right). */
const REFLECTION_VIS = (() => {
  const mpp = 1.7 / 440;
  const zones: Record<string, [number, number, number, number]> = {head: [-80, 80, -470, -300], chest: [-80, 80, -300, -200]};
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
if (REFLECTION_VIS.head < 0.9) throw new Error(`V3: only ${(100 * REFLECTION_VIS.head).toFixed(0)} % of his reflected head is visible in the glass (needs 90 %)`);

/** The sensor box hides light on its wall side (S is on its far face, the readout faces the camera). */
const sensorBoxHides = (s: typeof VS, tilt: number): HiddenTest => {
  const b = standGeometry(tilt).box;
  return (p) => {
    if (p.z > S2D.z + 0.02) return false;
    const q = projectWith(s, {x: p.x, z: p.z, h: p.h ?? LIGHT_H});
    return q.x > b.x0 - 2 && q.x < b.x1 + 2 && q.y > b.y0 - 2 && q.y < b.y1 + 2;
  };
};
/** Overlay light at RAISED_TILT is hidden behind the partition as drawn, both people and the sensor box. */
const HIDE_A: HiddenTest = (() => {
  const ph = partitionHides(VS, LIGHT_H);
  const fh = figuresHide(VS, LIGHT_H, [
    {z: LAYOUT.operator.z, place: OP},
    {z: H2D.z, place: GU},
  ]);
  const sb = sensorBoxHides(VS, RAISED_TILT);
  return (p) => ph(p) || fh(p) || sb(p);
})();

/** Where her telescopic pointer taps the glass: the visible lower-left glass, left of the partition's far end. */
const TAP3D: Required<PlanPt> = {x: 1.99, z: 0.004, h: 1.34};
const TAP_W = PX(TAP3D.x, TAP3D.z, TAP3D.h);
if (hiddenByPartition(TAP3D, VS, {padPx: 16})) throw new Error('V3: the pointer tap point is behind the partition');
if (TAP_W.x < GLASS.x0 + FRAME_PX + 8 || TAP_W.y > GLASS.y1 - FRAME_PX - 8) throw new Error('V3: the pointer tap point is not on the glass');
/** Her right hand while she taps (world px): up by her right shoulder, a little toward the wall. Her arm crosses the
 *  sensor box in this pose, so the whole tap (up, tap, down) is over before the sensor fires (see FIRE). */
const TAP_HAND = {x: OP.x + 92 * OP.scale, y: OP.y - 300 * OP.scale};

/** V3.1's pull-back starts inside the wall paint at P0 (bare wall high up where the mirror will hang) at zoom Z0: the
 *  frame then shows wall paint only (checked: the window round P0 stays clear of the wall top, the partition and both
 *  people). It ends on CAM_A. */
const P0_3D: Required<PlanPt> = {x: 2.3, z: 0, h: 2.15};
const P0 = PX(P0_3D.x, P0_3D.z, P0_3D.h);
const Z0 = 12;
{
  const hw = 960 / Z0 + 6;
  const hh = 540 / Z0 + 6;
  const wallTop = PX(P0_3D.x, 0, LAYOUT.room.wallHeight).y;
  if (P0.y - hh <= wallTop + 6) throw new Error('V3: the pull-back window reaches the wall top');
  for (let i = 0; i <= 20; i++)
    for (let j = 0; j <= 12; j++) {
      const q = {x: P0.x - hw + (2 * hw * i) / 20, y: P0.y - hh + (2 * hh * j) / 12};
      const wall = {x: VS.pivot.x + (q.x - VS.ax) / VS.ppm - VS.shear * (0 - VS.pivot.z), z: 0, h: VS.pivot.h + (VS.floor * (0 - VS.pivot.z) - (q.y - VS.ay) / VS.ppm) / VS.height};
      if (hiddenByPartition(wall, VS, {padPx: 6}) || rigCovers(GU, q, 20) || rigCovers(OP, q, 20)) throw new Error(`V3: the pull-back window is not all wall paint (${q.x.toFixed(0)}, ${q.y.toFixed(0)})`);
    }
}
/** P0's screen position at CAM_A (where the pull-back delivers it). */
const P0_END = worldToScreen(CAM_A, P0.x, P0.y);

/** The relay wall's face at RAISED_TILT (world px), above the skirting and inside its ink outline: the paint grain's clip. */
const WALL_FACE = (() => {
  const {x0, x1, wallHeight} = LAYOUT.room;
  return [PX(x0 + 0.01, 0, wallHeight - 0.012), PX(x1 - 0.01, 0, wallHeight - 0.012), PX(x1 - 0.01, 0, 0.14), PX(x0 + 0.01, 0, 0.14)].map((q) => ({x: q.x, y: q.y}));
})();

/* ================================================================== geometry, the room at tilt 0 (V3.4) */

const T0 = 0;
const VT0 = viewAt(T0);
const OP0 = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, T0);
const GU0 = rigAt(H2D.x, H2D.z, T0);
/** V3.4 framing: the tilt-0 room of S2.4, re-centred on the room (S2.4 kept a left column for the postcard / confetti
 *  inset, which is cut) and a touch wider than CAM_ROOM so the shoulder path's high wall spot (h 1.84 m) and the foot
 *  marker both sit inside the frame and above the caption band (checked below). */
const CAM_D: Cam = {cx: CAM_ROOM.cx, cy: 482, zoom: 1.15};
/**
 * Three paths from the hider to the sensor via three different wall spots (S2.4's, as reviewed): head, shoulder and
 * foot leave from points of the drawn rig at their true heights; each path is valid in plan (assertPath), obeys the
 * light-path rule on screen at this zoom (assertAroundTheEnd), reaches a visible wall spot clear of both people, and the
 * three lengths agree within one 250 ps bin (7.5 cm of path), so the three returns really are one blip at the sensor.
 */
const PARTS = [
  {id: 'head', local: {x: 0, y: -372}, trueH: 1.45, wall: {x: 1.98, h: 0.43}, mark: {x: -34, y: -414}, color: '#C0392B'},
  {id: 'shoulder', local: {x: -44, y: -294}, trueH: 1.13, wall: {x: 1.86, h: 1.84}, mark: {x: -30, y: -290}, color: C.saffronDeep},
  {id: 'feet', local: {x: -33, y: -8}, trueH: 0.04, wall: {x: 1.98, h: 1.19}, mark: {x: -26, y: -10}, color: C.blue},
];
/** Drawing sizes (world px at zoom 1.2), sized for a phone. */
const R4 = {trail: 15, spot: 13, mark: 21, markDot: 12, pulse: 18}; // trail 12 → 15: director fix for the phone check; mark 18 → 21 (48 px on screen at zoom 1.15): V2-R1-06
const HIDE0: HiddenTest = (() => {
  const ph = partitionHides(VT0, LIGHT_H);
  const fh = figuresHide(VT0, LIGHT_H, [
    {z: LAYOUT.operator.z, place: OP0},
    {z: H2D.z, place: GU0},
  ]);
  const him = (p: PlanPt) => p.z < H2D.z + 0.05 && rigCovers(GU0, projectWith(VT0, {x: p.x, z: p.z, h: p.h ?? LIGHT_H}), 10);
  const sb = sensorBoxHides(VT0, T0);
  return (p) => ph(p) || fh(p) || him(p) || sb(p);
})();
const behindStand = (q: {x: number; y: number}) => {
  const s0 = projectWith(VT0, S3D);
  const hub = projectWith(VT0, {x: S3D.x, z: S3D.z, h: 0.49});
  if (Math.abs(q.x - s0.x) < 70 && Math.abs(q.y - s0.y) < 60) return true;
  if (q.y > s0.y && q.y < hub.y && Math.abs(q.x - s0.x) < 28) return true;
  if (q.y < hub.y - 10) return false;
  const fa = projectWith(VT0, {x: S3D.x - 0.16, z: S3D.z + 0.1, h: 0});
  const fb = projectWith(VT0, {x: S3D.x + 0.17, z: S3D.z + 0.08, h: 0});
  const u = (q.y - hub.y) / (fa.y - hub.y);
  return q.x > hub.x + (fa.x - hub.x) * u - 22 && q.x < hub.x + (fb.x - hub.x) * u + 22;
};
const P4 = (p: Required<PlanPt>) => {
  const q = projectWith(VT0, p);
  return {x: q.x, y: q.y};
};
const BLEND = PARTS.map((p) => {
  const eff: Required<PlanPt> = {x: H2D.x + (p.local.x * GU0.scale) / VT0.ppm, z: H2D.z, h: (-p.local.y * GU0.scale) / (VT0.ppm * VT0.height)};
  if (Math.abs(eff.h - p.trueH) >= 0.02) throw new Error(`V3: blend path ${p.id}: the drawn rig point is at h ${eff.h.toFixed(3)} m, not its true ${p.trueH} m`);
  const W: Required<PlanPt> = {x: p.wall.x, z: 0, h: p.wall.h};
  assertPath([{x: eff.x, z: eff.z}, {x: W.x, z: 0}, S2D], OLAYOUT);
  assertAroundTheEnd(`V3.4 blend ${p.id}`, [[eff, W, S3D]], VT0, {zoom: CAM_D.zoom});
  const wq = projectWith(VT0, W);
  if (hiddenByPartition(W, VT0, {padPx: 12}) || rigCovers(GU0, wq, 12) || rigCovers(OP0, wq, 12) || behindStand(wq)) throw new Error(`V3: blend path ${p.id}: its wall spot is not clear on screen`);
  const real = {...eff, h: p.trueH};
  const L1 = dist3(real, W);
  const L2 = dist3(W, S3D);
  const px = [P4(eff), P4(W), P4(S3D)];
  const vis = [visibleSpans(eff, W, T0, {noOccluder: true, hidden: HIDE0, steps: 96}), visibleSpans(W, S3D, T0, {noOccluder: true, hidden: HIDE0, steps: 96})];
  return {...p, eff, W, L1, L2, L: L1 + L2, px, vis};
});
{
  const Ls = BLEND.map((b) => b.L);
  if (Math.max(...Ls) - Math.min(...Ls) > 0.075) throw new Error(`V3: blend paths differ by more than one 250 ps bin (${Ls.map((l) => l.toFixed(3)).join(', ')})`);
  for (let i = 0; i < BLEND.length; i++)
    for (let j = i + 1; j < BLEND.length; j++)
      if (Math.hypot(BLEND[i].W.x - BLEND[j].W.x, BLEND[i].W.h - BLEND[j].W.h) < 0.3) throw new Error(`V3: blend wall spots ${BLEND[i].id} and ${BLEND[j].id} are closer than 0.3 m`);
  // each him → wall leg is hidden from his body until it comes out from behind the partition's FAR end
  for (const b of BLEND) {
    const cr = partitionCrossings(b.eff, b.W, VT0, {zoom: CAM_D.zoom}).crossings;
    const out = cr[cr.length - 1];
    if (!out || out.dir !== 'out' || out.edge !== 'far') throw new Error(`V3: blend path ${b.id}: the leg to the wall does not come out at the partition's far end`);
  }
}
const L_MAX = Math.max(...BLEND.map((b) => b.L));
const atHisDepth = (q: {x: number; y: number}): Required<PlanPt> => {
  const x = VT0.pivot.x + (q.x - VT0.ax) / VT0.ppm - VT0.shear * (H2D.z - VT0.pivot.z);
  const h = VT0.pivot.h + (VT0.floor * (H2D.z - VT0.pivot.z) - (q.y - VT0.ay) / VT0.ppm) / VT0.height;
  return {x, z: H2D.z, h};
};
/** Where each path's origin marker sits on him (world px), clear of the partition as drawn. */
const ORIGIN_PX = BLEND.map((b) => {
  const q = b.mark ? {x: GU0.x + b.mark.x * GU0.scale, y: GU0.y + b.mark.y * GU0.scale} : b.px[0];
  if (!rigCovers(GU0, q)) throw new Error(`V3: the ${b.id} marker is not on his body`);
  const rr = R4.mark * 1.35 + 8;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 2 * Math.PI;
    if (hiddenByPartition(atHisDepth({x: q.x + rr * Math.cos(a), y: q.y + rr * Math.sin(a)}), VT0, {padPx: 3})) throw new Error(`V3: the ${b.id} marker overlaps the partition`);
  }
  return q;
});
/** The sensor-bound legs keep clear of her head (rigCovers grown by 10 px) above her shoulders. */
for (const b of BLEND)
  for (let u = 0; u <= 0.9; u += 0.02) {
    const q = P4({x: b.W.x + (S3D.x - b.W.x) * u, z: b.W.z + (S3D.z - b.W.z) * u, h: b.W.h + (S3D.h - b.W.h) * u});
    if (q.y < OP0.y - 300 * OP0.scale && rigCovers(OP0, q, 10)) throw new Error(`V3: blend path ${b.id}: the leg to the sensor grazes her head`);
  }
const SPX4 = P4(S3D);
/** The iris out lands on the bare wall between the three wall spots (world px at tilt 0). */
const IRIS_OUT_3D: Required<PlanPt> = {x: 1.95, z: 0, h: 1.55};
const IRIS_OUT_W = P4(IRIS_OUT_3D);
if (hiddenByPartition(IRIS_OUT_3D, VT0, {padPx: 20}) || rigCovers(OP0, IRIS_OUT_W, 30)) throw new Error('V3: the iris-out point is not on bare wall');
/** The V3.4 framing keeps the high wall spot inside the frame and every origin marker above the caption band. */
{
  for (const b of BLEND) {
    const s = worldToScreen(CAM_D, b.px[1].x, b.px[1].y);
    if (s.y - R4.spot * CAM_D.zoom < 24 || s.x < 96 || s.x > 1824) throw new Error(`V3: the ${b.id} wall spot is out of frame at V3.4 (${s.x.toFixed(0)}, ${s.y.toFixed(0)})`);
  }
  for (const q of ORIGIN_PX) {
    const s = worldToScreen(CAM_D, q.x, q.y);
    if (s.y + R4.mark * 1.35 * CAM_D.zoom > 950) throw new Error(`V3: an origin marker reaches the caption band (${s.y.toFixed(0)})`);
  }
}

/* ================================================================== beats derived from the cues */

// V3.1: the hand-off paint (4 frames), the pull back (from the 5th frame), the title once the room is in view
const FLAT_END = K.start + 4; // 911..914: the paint and its grain, still (V2 → V3 hand-off)
/** The pull-back's (virtual) start is the last still frame, so the scene's 5th frame (FLAT_END) is already moving. */
const PULL0 = FLAT_END - 1;
const PULL_DUR = clamp(K.puzzle + 16 - PULL0, 36, 60);
const PULL_END = PULL0 + PULL_DUR;
const TITLE_TO = K.all7End + 4;
const NOD = Math.max(PULL_END + 8, K.work7);

// V3.2: the mirror, the tap, the pulse, J2
const DROP_LAND = K.here + 2;
const MIRROR_LABEL = DROP_LAND + 3;
const NOTICE = DROP_LAND + 3;
const TAP = DROP_LAND + 8; // the pointer tip meets the glass
const ARM_UP0 = TAP - 16;
const ARM_UP_DUR = 8;
const EXT0 = ARM_UP0 + ARM_UP_DUR; // the pointer telescopes out
const RETRACT0 = TAP + 3;
const RETRACT_DUR = 4;
const ARM_DOWN0 = RETRACT0 + 2; // the arm folds while the stick slides home
const ARM_DOWN_DUR = 8;
/** The sensor fires once her arm is folded again (director fix: firing at TAP + 4 put the burst and the outgoing pulse
 *  under her raised forearm, and her arm then swept down across the sensor and the pulse's first leg). */
const FIRE = ARM_DOWN0 + ARM_DOWN_DUR;
const L1M = dist3(S3D, SPEC3D);
const L2M = dist3(SPEC3D, H3D);
const HIT = Math.max(FIRE + 12, K.friend); // the pulse reaches him (rim flash, busted)
const HALF = HIT - FIRE;
const M1 = FIRE + (HALF * L1M) / (L1M + L2M); // first bounce on the mirror
const M2 = HIT + (HALF * L2M) / (L1M + L2M); // second bounce, on the way back
const RET = HIT + HALF; // back at the sensor
if (HIT > K.friend + 6) throw new Error(`V3: the pulse reaches him (${HIT}) well after "friend" (${K.friend})`);
const BUSTED = HIT;
const INOUT0 = Math.round(M1);
const INOUT_DUR = 28; // "in = out" marks for about 1 s (out before the duck's squash)
const DUCK = Math.max(BUSTED + 10, K.visible + 1);
const ANTIC = 4; // anticipation: a small rise before the drop
const DUCK_DOWN = 4;
const DUCK_HIT = DUCK + DUCK_DOWN;
const HANDS_UP0 = DUCK - 2;
const HANDS_UP_DUR = 4;
if (RET > DUCK + 4) throw new Error(`V3: the mirror pulse is not home (${RET.toFixed(1)}) before J2 (${DUCK})`);

// V3.3: mirror off, magnifier, iris, the rough wall (s11, the v1 take: S2.3's beats)
const MIRROR_OFF0 = Math.max(DUCK_HIT + 15, K.s11 + 2); // the duck holds at least 0.5 s
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
const GHOST_OUT = Math.max(GHOST0 + 12, K.more - 6);
const LAMP0 = Math.max(GHOST_OUT + 6, K.tiny);
const LAMP_LABEL = LAMP0 + 4;
const WAVE = 18;

// V3.4: iris out, the three paths, the blend, the sheet, the tick
const IRIS_OUT0 = Math.max(LAMP0 + 30, K.everything - 4); // "tiny lamp (our analogy)" reads for about 1 s first
const IRIS_OUT_DUR = 12;
const LABELS_OUT = IRIS_OUT0 - 6; // the section's labels and chip fade before the iris closes
const IRIS_OUT_END = IRIS_OUT0 + IRIS_OUT_DUR;
const MARKS0 = IRIS_OUT_END + 1;
const PULSE0 = Math.max(MARKS0 + 6, K.coming);
const ARRIVE = Math.max(PULSE0 + 30, K.many);
const UNEASY = Math.max(ARRIVE + 4, K.paths);
const SHEET0 = Math.max(UNEASY + 14, K.what);
const SHEET_DUR = 18;
const TOSS0 = SHEET0;
const TICK_HIT = Math.max(SHEET0 + SHEET_DUR + 2, K.survives + 14);
const TICK_SETTLE = 8;
const LABEL_T = Math.max(TICK_HIT + 4, K.survivesEnd - 4);
const CHIP_T = SHEET0 + SHEET_DUR;
/** The pulses' speed (m of path per frame): the longest path takes PULSE0 → ARRIVE. */
const V_PULSE = L_MAX / Math.max(1, ARRIVE - PULSE0);
/** The frame each pulse comes out from behind the partition (its leg to the wall is hidden from his body to the
 *  partition's far edge): the hidden length at the pulse speed. Its origin marker stays lit until then. */
const EMERGE = BLEND.map((b) => {
  const u = b.vis[0].length ? b.vis[0][0][0] : 1;
  return PULSE0 + (u * b.L1) / V_PULSE;
});
if (EMERGE.some((f) => f > ARRIVE - 8)) throw new Error('V3: a blend pulse comes out from behind the partition too late');
/** Where each pulse comes out (world px): its leg to the wall at the first visible point. While hidden, a ghost of the
 *  pulse (a dashed ring, the "behind" convention) travels from its marker to this point at the pulse speed, so the
 *  marker, the hidden travel and the pulse that comes out read as one path (V2-R1-06). */
const EMERGE_PT = BLEND.map((b) => {
  const u = b.vis[0].length ? b.vis[0][0][0] : 1;
  return P4({x: b.eff.x + (b.W.x - b.eff.x) * u, z: b.eff.z + (b.W.z - b.eff.z) * u, h: b.eff.h + (b.W.h - b.eff.h) * u});
});
/** The launch ring round each marker grows only as far as it stays off the partition and out of the caption band. */
const BURST_R = ORIGIN_PX.map((q) => {
  const wallAt = (p: {x: number; y: number}) => ({x: VT0.pivot.x + (p.x - VT0.ax) / VT0.ppm - VT0.shear * (0 - VT0.pivot.z), z: 0, h: VT0.pivot.h + (VT0.floor * (0 - VT0.pivot.z) - (p.y - VT0.ay) / VT0.ppm) / VT0.height});
  const s = worldToScreen(CAM_D, q.x, q.y);
  let r = R4.mark * 1.35 + 8;
  for (let rr = r; rr <= R4.mark * 2.2; rr += 1) {
    let ok = s.y + (rr + 5) * CAM_D.zoom <= 948;
    for (let i = 0; ok && i < 32; i++) {
      const a = (i / 32) * 2 * Math.PI;
      if (hiddenByPartition(wallAt({x: q.x + (rr + 5) * Math.cos(a), y: q.y + (rr + 5) * Math.sin(a)}), VT0, {padPx: 2})) ok = false;
    }
    if (!ok) break;
    r = rr;
  }
  return r;
});
if (LABEL_T + 6 > K.end - 2) throw new Error(`V3: "what survives: timing" is not in a beat before the cut (${LABEL_T + 6} > ${K.end - 2})`);
if (TICK_HIT + TICK_SETTLE > K.end - 2) throw new Error('V3: the tick has not settled before the cut');

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -4},
  // V3.2
  // mirror_slide is synced on its stop (the sample's last loud frame, sfx_lib 'stop' class, 1.5 s in): its rising slide
  // fills the 5 frames before the stop, so the stop one frame before the contact covers the visible drop (DROP_LAND − 5 to
  // − 1) and leaves the contact frame to the ting (V2-R1-22: cued 9 frames early it was over before the mirror moved)
  {f: DROP_LAND - 1, kind: 'mirror_slide', gain: -3, note: 'wall mirror slides down (covers the visible drop)'},
  {f: DROP_LAND, kind: 'mirror_ting', gain: -2},
  {f: TAP, kind: 'pencil_tap', gain: -3, pitch: 4, note: 'pointer taps the glass'},
  {f: FIRE, kind: 'sensor_pulse', gain: -4},
  {f: Math.round(M1), kind: 'bounce_tick', pitch: 3, gain: -3},
  {f: Math.round(M2), kind: 'bounce_tick', pitch: 2, gain: -6},
  {f: Math.round(RET), kind: 'echo_return', gain: -4},
  {f: BUSTED + 7, kind: 'footstep_wood', gain: -12, pitch: 2, note: 'his resting foot plants back at the stance'},
  {f: DUCK, kind: 'cloth_rustle', gain: -2},
  {f: DUCK_HIT, kind: 'thud_soft', gain: -6, note: 'duck squash'},
  // V3.3
  {f: MIRROR_OFF0 + 10, kind: 'mirror_slide', gain: -7, pitch: 1, note: 'slides off: the stop lands as it leaves the frame'},
  {f: RISE0 + 8, kind: 'relief_sigh', gain: -4},
  {f: LENS_POP, kind: 'magnifier_slide', gain: -4},
  {f: HIT3, kind: 'bounce_tick', pitch: -1, gain: -3},
  {f: EACH_HIT, kind: 'bounce_tick', pitch: 1, gain: -9},
  {f: LAMP0, kind: 'indicator_yes', gain: -10, pitch: -3, note: 'soft glow tone on "tiny lamp"'},
  // V3.4
  {f: ARRIVE, kind: 'echo_return', gain: -2, note: 'three returns blend into one blip'},
  {f: TICK_HIT, kind: 'pop_tick', gain: -4, note: 'one tick at one time'},
];

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

type GuesserState = {pose: Pose2; squash: [number, number]; life: number; handsUp: number; rim: number};

/** V3.1: leaning on the partition (his left shoulder against its edge, weight over it), arms crossed, looking at the
 *  bare wall, untroubled. Feet planted at the standing stance (so the later duck and rise never slide them). */
const LEANING: Pose2 = {
  ...IDLE2,
  ...ARMS.armsCrossed,
  armsFront: 'both',
  lean: -8,
  shift: -5,
  tilt: 5,
  lid: 0.42,
  eyes: 1,
  pupil: 1,
  brows: 0.05,
  browAsym: 0.35,
  mouth: 'smirk',
  lookX: -0.85,
  lookY: -0.75,
  sweat: 0,
  // weight on the partition side: the free right foot rests on its toe, knee in (it steps back to the stance when he
  // is busted); the foot stays close under the hip so the standing leg is not shortened
  feet: {L: {x: -33}, R: {x: 20, pitch: 24, turn: -0.3, knee: -0.5}},
};
const AT_MIRROR = {lookX: -0.92, lookY: -0.35};
/** J2's duck (A02 #4): a deep squat, shoulders hunched, both mitts clamped on his crown, worried brows. */
const DUCK_BODY: Pose2 = {...IDLE2, ...CROUCH, sink: 98, hunch: 0.15, tilt: 4, lean: 0, lid: 0, eyes: 1.14, pupil: 0.72, brows: 1, browAsym: 0, mouth: 'frown', sweat: 1, lookX: -0.8, lookY: -0.6, armsFront: 'both'} as Pose2;
const RELIEVED: Pose2 = withPose(HANDS_ON_HIPS, {lid: 0.5, eyes: 1, pupil: 1, brows: 0.15, browAsym: 0.2, mouth: 'smile', lookX: -0.55, lookY: -0.35, tilt: 3, sweat: 0});

/** Both arms with the mitts on his crown for the body pose `body`. */
const crownArms = (place: RigPlace, body: Pose2) => {
  const e = eyesWorld(place, body);
  const m = mouthWorld(place, body);
  const k = 1 / 40;
  const d = {x: (m.x - e.x) * k, y: (m.y - e.y) * k};
  const r = {x: d.y, y: -d.x};
  const pt = (lx: number, ly: number) => ({x: e.x + r.x * lx + d.x * ly, y: e.y + r.y * lx + d.y * ly});
  const L = pt(-30, -58);
  const R = pt(30, -58);
  return {armL: reach2(place, body, -1, L.x, L.y, 1), armR: reach2(place, body, 1, R.x, R.y, 1)};
};

/** Blend two arms so the upper arm swings OUT round the side and the forearm turns the short way (hands never sweep
 *  across the face). */
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

/** The guesser in the raised room (V3.1–V3.3). */
const guesserMirror = (g: number): GuesserState => {
  let pose: Pose2 = LEANING;
  // a small smug nod on "work at all": the head dips and comes back
  pose = {...pose, tilt: pose.tilt + 5 * pulse01(g, NOD, 12)};
  // the mirror lands: his eyes go to it, a little wider
  pose = mixPose2(pose, {...pose, ...AT_MIRROR, eyes: 1.08, lid: 0.15, mouth: 'flat'}, tw(g, NOTICE, 8, E.inOut));
  // the pulse reaches him: busted; he comes off the partition (lean back to upright)
  const bust = sp(g, BUSTED, SNAP);
  if (bust > 0) pose = mixPose2(pose, {...pose, ...EXPR.busted, ...AT_MIRROR, tilt: -2, lean: 0, shift: 0}, Math.min(1.05, bust));
  // the crossed foot steps back to the stance (lifted, so it is a step, not a slide)
  const step = tw(g, BUSTED, 7, E.inOut);
  if (step > 0) {
    const f = LEANING.feet!.R;
    pose = {...pose, feet: {L: {x: -33}, R: {x: lerp(f.x, 33, step), pitch: lerp(f.pitch ?? 0, 0, step), turn: lerp(f.turn ?? 0, 0, step), knee: lerp(f.knee ?? 0, 0.35, step), lift: 10 * Math.sin(Math.PI * step)}}};
  }
  if (g >= BUSTED) pose = {...pose, bob: hop(g, BUSTED, 9, 7)};
  // J2 anticipation: a small rise just before the drop
  if (g >= DUCK - ANTIC && g < DUCK) pose = {...pose, sink: -7 * Math.sin(((g - (DUCK - ANTIC)) / ANTIC) * Math.PI * 0.5)};
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
  // the mirror leaves: he stands back up, relieved; the mitts lift off his crown out to the sides first (never down
  // across his face), then drop to his hips
  const rise = tw(g, RISE0, 14, E.inOut);
  if (rise > 0) {
    const body = mixPose2(pose, RELIEVED, rise);
    const a = clamp01(rise / 0.45);
    const b = clamp01((rise - 0.45) / 0.55);
    const armL = b > 0 ? armOut(ARMS.handsUp.armL, RELIEVED.armL, b) : armOut(pose.armL, ARMS.handsUp.armL, a);
    const armR = b > 0 ? armOut(ARMS.handsUp.armR, RELIEVED.armR, b) : armOut(pose.armR, ARMS.handsUp.armR, a);
    pose = {...body, armL, armR, armsFront: b > 0.5 ? RELIEVED.armsFront : 'none'};
  }
  const squash = impact(g, DUCK_HIT, 0.14, 10);
  const rim = tw(g, HIT - 1, 3) * (1 - tw(g, HIT + 6, 10));
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
/** The checker stands with her arms crossed (never a forearm over the sensor's readout). */
const CHECKER_BASE: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both'};
const CHECKER_LIFE = 0.35;
const checkerPlace = (g: number): RigPlace => ({x: OP.x, y: OP.y, scale: OP.scale, frame: g, seed: CHECKER_SEED, life: CHECKER_LIFE});

/** Her right arm and the pointer: up (anticipation is the arm swinging out), the stick telescopes to the glass (contact
 *  at TAP), back, the arm folds again. Returns the pose and the stick ends (world px) or null. */
const checkerMirror = (g: number): {pose: Pose2; stick: {hand: {x: number; y: number}; tip: {x: number; y: number}} | null} => {
  const look = checkerLook(g, [
    [ARM_UP0, {lookX: 0.95, lookY: -0.6, tilt: -3}],
    [DUCK + 6, {lookX: 0.95, lookY: 0.2, tilt: 2}],
    [RISE0 + 6, {lookX: 0.62, lookY: 0.32, tilt: 3}],
  ]);
  const brow = tw(g, DUCK + 10, 8) * (1 - tw(g, RISE0 + 6, 10));
  let pose = withPose(CHECKER_BASE, {...EXPR.deadpan, ...look, brows: -0.05 + 0.3 * brow, browAsym: 0.5 * brow});
  const up = tw(g, ARM_UP0, ARM_UP_DUR, E.inOut) * (1 - tw(g, ARM_DOWN0, ARM_DOWN_DUR, E.inOut));
  if (up <= 0) return {pose, stick: null};
  const place = checkerPlace(g);
  const target = reach2(place, pose, 1, TAP_HAND.x, TAP_HAND.y, 1);
  pose = {...pose, armR: armOut(CHECKER_BASE.armR, target, up), armsFront: up > 0.5 ? 'L' : 'both'};
  const hand = handWorld2(place, pose, 1);
  // the telescopic pointer slides out of her mitt to the glass (contact at TAP) and back into it
  const ext = tw(g, EXT0, TAP - EXT0, E.out) * (1 - tw(g, RETRACT0, RETRACT_DUR, E.inOut));
  const full = Math.hypot(TAP_W.x - hand.x, TAP_W.y - hand.y);
  const len = full * ext;
  if (len < 8) return {pose, stick: null};
  const u = {x: (TAP_W.x - hand.x) / full, y: (TAP_W.y - hand.y) / full};
  return {pose, stick: {hand, tip: {x: hand.x + u.x * len, y: hand.y + u.y * len}}};
};

/** The room's standing things at a tilt: the checker, the sensor on its stand, the guesser. */
const roomItems = (g: number, tilt: number, checker: Pose2, guesser: GuesserState, sensor: React.ComponentProps<typeof SensorStand>['sensor']): RoomItem[] => {
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const gu = rigAt(H2D.x, H2D.z, tilt);
  const squashed = guesser.squash[0] !== 1;
  const filter = rimFlash(guesser.rim, gu.scale);
  return [
    {key: 'checker', x: LAYOUT.operator.x, z: LAYOUT.operator.z, w: 0.3, node: <Character2 look={CAST.checker} pose={checker} frame={g} seed={CHECKER_SEED} x={op.x} y={op.y} scale={op.scale} life={CHECKER_LIFE} />},
    {key: 'stand', x: PTS.S.x, z: LAYOUT.operator.z + 0.04, w: 0.17, height: LIGHT_H + 0.15, node: <SensorStand tilt={tilt} sensor={sensor} />},
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

/* ================================================================== V3.2 the wall mirror */

/** The framed mirror on the wall, his reflection (his back) clipped to the glass, the glint (world px). */
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
      {/* his virtual image stays put in the world (a planar mirror sliding in its own plane does not move it) */}
      <S2Reflection look={CAST.guesser} pose={guesser.pose} frame={g} seed={GUESSER_SEED} life={guesser.life} place={{x: RF.x, y: RF.y, scale: RF.scale}} armsOverHead={guesser.handsUp > 0.5} squash={guesser.squash} clipPath={clip} id="v3ref" />
      <svg width={1920} height={1080} style={svg}>
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} fill={C.blueLight} opacity={0.14} />
        <path d={`M ${f2(x1 - fr - 64)} ${f2(y0 + fr + 4)} L ${f2(x1 - fr - 4)} ${f2(y0 + fr + 64)}`} stroke={C.white} strokeWidth={13} strokeLinecap="round" opacity={0.75} />
        <path d={`M ${f2(x1 - fr - 26)} ${f2(y0 + fr + 4)} L ${f2(x1 - fr - 4)} ${f2(y0 + fr + 26)}`} stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
        <rect x={x0 + fr} y={y0 + fr} width={x1 - x0 - 2 * fr} height={y1 - y0 - 2 * fr} rx={4} fill="none" stroke={C.ink} strokeWidth={3} />
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

/** "in = out": a small mirror-law card beside the glass (screen px): the mirror edge, its normal, the ray in and the ray
 *  out with two equal angle marks, and the words; a leader to the glint. Shown 1 s from the first bounce. The bounce
 *  point itself is under the partition's far-end outline in this view, so the angles are drawn on the card, not over it. */
/** Director fix: the words go up to 48 px (44 read at ~9 px on a phone); the card moves up 14 px so its bottom stays
 *  clear of her hair. */
const INOUT_CARD = {x: 440, y: 136, w: 372, h: 262};
const InOutCard: React.FC<{t: number; glint: {x: number; y: number}}> = ({t, glint}) => {
  if (t <= 0) return null;
  const {x, y, w, h} = INOUT_CARD;
  const cx = x + w / 2;
  const my = y + 52; // mirror line
  const th = (36 * Math.PI) / 180;
  const R = 110;
  const a = {x: cx - R * Math.sin(th), y: my + R * Math.cos(th)};
  const b = {x: cx + R * Math.sin(th), y: my + R * Math.cos(th)};
  const arc = (from: number, to: number) => {
    const r = 46;
    const p = (ang: number) => `${f2(cx + r * Math.sin(ang))} ${f2(my + r * Math.cos(ang))}`;
    return `M ${p(from)} A ${r} ${r} 0 0 ${to > from ? 0 : 1} ${p(to)}`;
  };
  const lead = {x: x + w, y: y + h * 0.62};
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={f2(clamp01(t))}>
      <path d={`M ${lead.x - 4} ${lead.y} L ${f2(glint.x - 30)} ${f2(glint.y)}`} stroke={C.white} strokeWidth={10} strokeLinecap="round" />
      <path d={`M ${lead.x - 4} ${lead.y} L ${f2(glint.x - 30)} ${f2(glint.y)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 9" />
      <rect x={x + 8} y={y + 10} width={w} height={h} rx={20} fill={C.shadow} />
      <rect x={x} y={y} width={w} height={h} rx={20} fill={C.cream} stroke={C.ink} strokeWidth={4} />
      <rect x={cx - 110} y={my - 16} width={220} height={16} rx={4} fill={C.blueLight} stroke={C.ink} strokeWidth={3.5} />
      <path d={`M ${cx} ${my + 4} L ${cx} ${my + 112}`} stroke={C.inkSoft} strokeWidth={4} strokeDasharray="9 8" strokeLinecap="round" />
      <path d={`M ${f2(a.x)} ${f2(a.y)} L ${cx} ${my}`} stroke={C.saffronDeep} strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${cx} ${my} L ${f2(b.x)} ${f2(b.y)}`} stroke={C.saffronDeep} strokeWidth={7} strokeLinecap="round" />
      <path d={arc(0, -th)} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d={arc(0, th)} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Label asGroup x={cx} y={y + h - 22} size={48} anchor="middle" halo={false}>
        in = out
      </Label>
    </svg>
  );
};

/** Integrity chips ("slowed down", "illustration") at 40 px, legible at phone width and the size of V2's "illustration" chip
 *  in the same corner one scene earlier (v2 review r1, V2-R1-14: 30 px chips were about 6 px at 390 px). */
const CHIP_PX = 40;
const SlowedChip: React.FC<{t: number}> = ({t}) => (t > 0 ? <Chip x={1790} y={92} anchor="end" valign="middle" size={CHIP_PX} opacity={t} tone="saffron">slowed down</Chip> : null);

/* ---- the magnifier iris (V3.2 room → V3.3 section) */
const SEC_C = grainTipNear(960);
const LENS_R = 124;
const HANDLE = {x: 0.94, y: 0.34};
/** The magnifier lands on bare wall where the mirror hung (upper glass area), clear of the partition and both people
 *  at CAM_A (a ring 24 world px outside the lens). */
const LENS_W = PX(1.7, 0, 1.86);
{
  const R = LENS_R / CAM_A.zoom + 24;
  const dz = 0 - VS.pivot.z;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 2 * Math.PI;
    const q = {x: LENS_W.x + R * Math.cos(a), y: LENS_W.y + R * Math.sin(a)};
    const wall = {x: VS.pivot.x + (q.x - VS.ax) / VS.ppm - VS.shear * dz, z: 0, h: VS.pivot.h + (VS.floor * dz - (q.y - VS.ay) / VS.ppm) / VS.height};
    if (hiddenByPartition(wall, VS) || rigCovers(GU, q) || rigCovers(OP, q)) throw new Error(`V3: the magnifier does not land on bare wall (ring point ${q.x.toFixed(0)}, ${q.y.toFixed(0)})`);
  }
  const s = worldToScreen(CAM_A, LENS_W.x, LENS_W.y);
  if (s.y - LENS_R < 20) throw new Error(`V3: the magnifier's lens leaves the frame top (${(s.y - LENS_R).toFixed(0)})`);
}

const IrisIn: React.FC<{g: number; from: {x: number; y: number}}> = ({g, from}) => {
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
        <clipPath id="v3irisin">
          <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(0.1, r))} />
        </clipPath>
      </defs>
      {handle > 0 && (
        <g opacity={handle}>
          <line x1={f2(c.x - r * HANDLE.x)} y1={f2(c.y - r * HANDLE.y)} x2={f2(c.x - (r + 110 * pop) * HANDLE.x)} y2={f2(c.y - (r + 110 * pop) * HANDLE.y)} stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
          <line x1={f2(c.x - r * HANDLE.x)} y1={f2(c.y - r * HANDLE.y)} x2={f2(c.x - (r + 110 * pop) * HANDLE.x)} y2={f2(c.y - (r + 110 * pop) * HANDLE.y)} stroke={C.woodDeep} strokeWidth={22} strokeLinecap="round" />
        </g>
      )}
      <g clipPath="url(#v3irisin)">
        <g transform={`translate(${f2(c.x - s * SEC_C.x)} ${f2(c.y - s * SEC_C.y)}) scale(${f2(s)})`}>
          <SectionContent g={g} />
        </g>
      </g>
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(0.1, r))} fill="none" stroke={C.ink} strokeWidth={22} />
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(0.1, r))} fill="none" stroke={C.saffron} strokeWidth={11} />
    </svg>
  );
};

/** V3.1–V3.3's room camera: the pull back from inside the paint (log-space zoom, P0 glides to its CAM_A place). The ease
 *  starts with speed (v2 review r1, V2-R1-02: the old ease-in held the first ~14 pulled frames visually still, so the
 *  in-paint run read as a blank frame): the zoom drops about 4 % on the scene's 5th frame, the first pulled one. */
const PULL_EASE = Easing.bezier(0.2, 0.12, 0.2, 1);
const camRoomA = (g: number): Cam => {
  const u = PULL_EASE(clamp01((g - PULL0) / PULL_DUR));
  if (u >= 1) return CAM_A;
  const z = Z0 * Math.pow(CAM_A.zoom / Z0, u);
  const sx = lerp(960, P0_END.x, u);
  const sy = lerp(540, P0_END.y, u);
  return {cx: P0.x - (sx - 960) / z, cy: P0.y - (sy - 540) / z, zoom: z};
};
/** The paint grain's layer opacity on the pull-back: full while a grain bump is still at least 45 % of its hand-off size,
 *  gone by 20 % (it never stays on as a texture over the room). */
const grainLayer = (zoom: number) => clamp01((zoom / Z0 - 0.2) / 0.25);
/** Is the camera window at frame g all wall paint (nothing of the room but the wall face)? */
const allPaint = (g: number) => {
  const c = camRoomA(g);
  const hw = 960 / c.zoom;
  const hh = 540 / c.zoom;
  const dz = 0 - VS.pivot.z;
  for (let i = 0; i <= 24; i++)
    for (let j = 0; j <= 14; j++) {
      const q = {x: c.cx - hw + (2 * hw * i) / 24, y: c.cy - hh + (2 * hh * j) / 14};
      const wall = {x: VS.pivot.x + (q.x - VS.ax) / VS.ppm - VS.shear * dz, z: 0, h: VS.pivot.h + (VS.floor * dz - (q.y - VS.ay) / VS.ppm) / VS.height};
      if (wall.h > LAYOUT.room.wallHeight - 0.005 || hiddenByPartition(wall, VS) || rigCovers(GU, q) || rigCovers(OP, q)) return false;
    }
  return true;
};
/** The first pulled frame whose window shows more than wall paint (the wall top, the partition or a person). */
const ROOM_VIS = (() => {
  for (let g = FLAT_END; g <= PULL_END; g++) if (!allPaint(g)) return g;
  return PULL_END;
})();
/** The question title fades in only once the room is in view (V2-R1-02): from n07, and from 4 frames after the first
 *  non-paint frame (the wall top and the people are then entering the frame). */
const TITLE_FROM = Math.max(K.n07, ROOM_VIS + 4);
{
  // the hand-off: at most 4 still frames; the pull-back moves on the scene's 5th frame and the grain is visible there
  if (FLAT_END > K.start + 4) throw new Error('V3: more than 4 still paint frames at the hand-off');
  const z1 = camRoomA(FLAT_END).zoom;
  if (!(Z0 / z1 > 1.025)) throw new Error(`V3: the 5th frame barely moves (zoom ${Z0} → ${z1.toFixed(3)})`);
  if (grainLayer(z1) < 1) throw new Error('V3: the paint grain must be fully visible as the pull-back starts');
  if (ROOM_VIS <= FLAT_END + 2) throw new Error('V3: the room must not be in view on the first pulled frames (we are inside the paint)');
  if (grainLayer(CAM_A.zoom) > 0 || grainLayer(camRoomA(TITLE_FROM).zoom) > 0.5) throw new Error('V3: the paint grain must be fading by the title and gone at CAM_A');
  if (TITLE_FROM + 6 > TITLE_TO - 8) throw new Error('V3: the question title has no time on screen');
}

const RoomMirrorShot: React.FC<{g: number}> = ({g}) => {
  const cam = camRoomA(g);
  const gu = guesserMirror(g);
  const ch = checkerMirror(g);
  // the mirror drops in from above the frame onto the wall, and later slides out of it upward
  const mirrorDy = g < MIRROR_OFF0 ? drop(g, DROP_LAND, 600, 10) : -E.in(tw(g, MIRROR_OFF0, 12, E.linear)) * 620;
  const mirrorOn = g >= DROP_LAND - 10 && g < MIRROR_OFF0 + 13;
  const rayT = clamp01((g - FIRE) / (RET - FIRE));
  const rayOp = 1 - tw(g, DUCK, 10);
  // a glint on the visible glass at each bounce (out and back)
  const gl1 = (g - (Math.round(M1) - 1)) / 12;
  const gl2 = (g - (Math.round(M2) - 1)) / 12;
  const glint = gl1 > 0 && gl1 < 1 ? gl1 : gl2 > 0 && gl2 < 1 ? gl2 : 0;
  const grain = g < PULL_END ? grainLayer(cam.zoom) : 0;
  const backdrop = (
    <>
      {grain > 0 && <WallGrain anchor={P0} z0={Z0} zoom={cam.zoom} clip={WALL_FACE} view={{x0: cam.cx - 960 / cam.zoom, y0: cam.cy - 540 / cam.zoom, x1: cam.cx + 960 / cam.zoom, y1: cam.cy + 540 / cam.zoom}} opacity={grain} id="v3grain" />}
      {mirrorOn && <WallMirror g={g} dy={mirrorDy} guesser={gu} glint={glint} />}
    </>
  );
  const fireK = pulse01(g, FIRE - 1, 8);
  const items = roomItems(g, RAISED_TILT, ch.pose, gu, {led: 1, reveal: 1, burst: fireK, burstRing: g >= FIRE && g < FIRE + 12 ? (g - FIRE) / 12 : undefined, bumpHighlight: tw(g, Math.round(RET), 4) * (1 - tw(g, Math.round(RET) + 16, 10))});
  const lensScr = worldToScreen(cam, LENS_W.x, LENS_W.y);
  const mirrorLabel = tw(g, MIRROR_LABEL, 6, E.linear) * (1 - tw(g, MIRROR_OFF0, 6, E.linear));
  const glintScr = worldToScreen(cam, GLINT.x, GLINT.y);
  const glassScr = worldToScreen(cam, GLASS.x1, GLASS.y0 + 120);
  const inout = tw(g, INOUT0, 5, E.linear) * (1 - tw(g, INOUT0 + INOUT_DUR - 5, 5, E.linear));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={RAISED_TILT} items={items} backdrop={backdrop} door={false}>
            {g >= FIRE && rayOp > 0 && (
              <LightPath points={[S2D, SPEC, H2D, SPEC, S2D]} toPx={roomToPx} t={rayT} pulses={3} pulseGap={0.09} intensityFalloff={0.92} lane={12} layout={OLAYOUT} clearPx={0} hidden={HIDE_A} arrive="hide" opacity={rayOp} />
            )}
            {ch.stick && (
              <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                <PointerStick hand={ch.stick.hand} tip={ch.stick.tip} w={9} skin={CAST.checker.skin} />
              </svg>
            )}
          </RoomSet>
        </Layer>
      </Camera>
      <QuestionTitle text="What survives the bounce?" from={TITLE_FROM} to={TITLE_TO} frame={g} />
      {mirrorLabel > 0 && (
        <TeachLabel x={glassScr.x + 28} y={glassScr.y} opacity={mirrorLabel} leader={{x: glassScr.x + 6, y: glassScr.y - 22, gap: 4}}>
          mirror
        </TeachLabel>
      )}
      <InOutCard t={inout} glint={glintScr} />
      <SlowedChip t={tw(g, FIRE - 2, 6, E.linear) * (1 - tw(g, Math.round(RET) + 6, 8, E.linear))} />
      <IrisIn g={g} from={{x: lensScr.x, y: lensScr.y}} />
    </AbsoluteFill>
  );
};

/* ================================================================== V3.3 the rough wall up close */

const SU = 300; // section px per optics unit
const secToPx: ToPx = (p) => ({x: p.x * SU, y: p.z * SU});
const sp2 = (x: number, y: number): P2 => ({x: x / SU, z: y / SU});
const IN_TH = (36 * Math.PI) / 180;
const IN_DIR = {x: Math.sin(IN_TH), y: -Math.cos(IN_TH)};
const IN_LEN = 560;
const SPOTS = [
  {...grainTipNear(960), n: 15, len: 1.35, seed: 3, main: true},
  {...grainTipNear(560), n: 11, len: 0.85, seed: 7, main: false},
  {...grainTipNear(1360), n: 11, len: 0.85, seed: 11, main: false},
].map((s) => ({...s, dirs: scatterDirections({x: 0, z: 1}, s.n, s.seed, 0.6), from: {x: s.x - IN_DIR.x * IN_LEN, y: s.y - IN_DIR.y * IN_LEN}}));
const SPRAY_COLOR = mixHex(C.saffronDeep, C.paper, 0.2);
/** Every ray start stays above the caption band. */
for (const s of SPOTS) if (s.from.y > 940) throw new Error('V3: a section ray starts in the caption band');
const rayTips = (s: (typeof SPOTS)[number]) =>
  s.dirs.map((d, i) => {
    const L = s.len * (0.3 + 0.7 * d.w) * (0.85 + 0.3 * rand(s.seed * 53 + i * 7));
    return {x: s.x + d.x * L * SU, y: s.y + d.z * L * SU};
  });
const TIPS = SPOTS.map(rayTips);

const SectionContent: React.FC<{g: number}> = ({g}) => (
  <g>
    <SectionBackdrop />
    {SPOTS.map((s, k) => {
      const t0 = s.main ? IN0 : EACH0;
      const hit = s.main ? HIT3 : EACH_HIT;
      if (g < t0) return null;
      const inT = clamp01((g - t0) / Math.max(1, hit - t0));
      const spray = tw(g, hit, s.main ? SPRAY_DUR : 16, E.linear);
      const pale = s.main ? 0 : 0.25;
      // "tiny lamp": each lit spot glows (a flat lamp disc), and one wave runs out along its rays
      const lamp = tw(g, LAMP0 + (s.main ? 0 : 3), 8, E.out);
      const u = (g - LAMP0 - (s.main ? 0 : 3)) / WAVE;
      return (
        <g key={k}>
          <LightPath asGroup points={[sp2(s.from.x, s.from.y), sp2(s.x, s.y)]} toPx={secToPx} t={inT} pulses={3} pulseGap={0.1} width={s.main ? 8 : 6} color={mixHex(C.saffronDeep, C.paper, pale)} arrive="hide" bounceRings={false} />
          {spray > 0 && <ScatterFan asGroup origin={sp2(s.x, s.y)} dirs={s.dirs} length={s.len} toPx={secToPx} t={spray} color={mixHex(SPRAY_COLOR, C.paper, pale)} width={s.main ? 4.5 : 3.5} seed={s.seed} />}
          {lamp > 0 && (
            <g>
              <circle cx={f2(s.x)} cy={f2(s.y)} r={f2((s.main ? 46 : 36) * lamp)} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={5} />
              <circle cx={f2(s.x)} cy={f2(s.y)} r={f2((s.main ? 24 : 19) * lamp)} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
            </g>
          )}
          {u > 0 && u < 1 && (
            <g opacity={1 - Math.pow(u, 3)}>
              {TIPS[k].map((tp, i) => (
                <circle key={i} cx={f2(lerp(s.x, tp.x, E.out(u)))} cy={f2(lerp(s.y, tp.y, E.out(u)))} r={s.main ? 8 : 6.5} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
              ))}
            </g>
          )}
          <circle cx={f2(s.x)} cy={f2(s.y)} r={spray > 0 ? 8 : 0} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
        </g>
      );
    })}
    {/* "less like a mirror": the mirror's one reflected ray, as a dashed ghost that fades */}
    {g >= GHOST0 && g < GHOST_OUT + 10 && (
      <g opacity={f2(1 - tw(g, GHOST_OUT, 10))}>
        <path d={`M ${f2(SEC_C.x)} ${f2(SEC_C.y)} L ${f2(SEC_C.x + IN_DIR.x * 540 * tw(g, GHOST0, 10))} ${f2(SEC_C.y - IN_DIR.y * 540 * tw(g, GHOST0, 10))}`} stroke={C.white} strokeWidth={15} strokeLinecap="round" fill="none" />
        <path d={`M ${f2(SEC_C.x)} ${f2(SEC_C.y)} L ${f2(SEC_C.x + IN_DIR.x * 540 * tw(g, GHOST0, 10))} ${f2(SEC_C.y - IN_DIR.y * 540 * tw(g, GHOST0, 10))}`} stroke={C.blue} strokeWidth={8} strokeDasharray="18 13" strokeLinecap="round" fill="none" />
        {g < GHOST0 + 16 && <circle cx={f2(SEC_C.x + IN_DIR.x * 540 * E.out(clamp01((g - GHOST0) / 15)))} cy={f2(SEC_C.y - IN_DIR.y * 540 * E.out(clamp01((g - GHOST0) / 15)))} r={13} fill={C.blueLight} stroke={C.ink} strokeWidth={3.5} />}
      </g>
    )}
  </g>
);

/** The section's labels and chip (screen px). */
const SectionLabels: React.FC<{g: number}> = ({g}) => (
  <>
    <TeachLabel x={140} y={236} opacity={tw(g, ROUGH_LABEL, 6, E.linear) * (1 - tw(g, LABELS_OUT, 6, E.linear))}>
      rough up close
    </TeachLabel>
    <SubLabel x={1780} y={890} anchor="end" opacity={tw(g, LAMP_LABEL, 6, E.linear) * (1 - tw(g, LABELS_OUT, 6, E.linear))}>
      tiny lamp (our analogy)
    </SubLabel>
    <Chip x={1790} y={92} anchor="end" valign="middle" size={CHIP_PX} opacity={tw(g, IRIS_END, 6, E.linear) * (1 - tw(g, LABELS_OUT, 6, E.linear))}>
      illustration
    </Chip>
  </>
);

const SectionShot: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{background: C.paper}}>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <SectionContent g={g} />
    </svg>
    <SectionLabels g={g} />
  </AbsoluteFill>
);

/* ================================================================== V3.4 the room at tilt 0: a blend of paths */

const guesserBlend = (g: number): Pose2 => {
  let pose: Pose2 = RELIEVED;
  // the light leaves him: he looks down at himself, then follows it up to the wall
  pose = mixPose2(pose, {...pose, lid: 0, eyes: 1.1, pupil: 0.85, brows: 0.5, browAsym: 0, mouth: 'o', lookX: -0.3, lookY: 0.55, tilt: -3}, tw(g, MARKS0 + 2, 8, E.inOut));
  pose = mixPose2(pose, {...pose, lookX: -0.85, lookY: -0.5, tilt: -4}, tw(g, PULSE0 + 12, 10, E.inOut));
  // the blend lands at the sensor: he glances at the wall, uneasy
  pose = mixPose2(pose, {...pose, lid: 0.1, eyes: 1.1, pupil: 0.9, brows: 0.65, browAsym: 0, mouth: 'hmm', sweat: 0.9, lookX: -0.95, lookY: -0.35, tilt: -5}, tw(g, UNEASY, 10, E.inOut));
  return pose;
};
const checkerBlend = (g: number): Pose2 => {
  const look = checkerLook(g, [
    [PULSE0 + 8, {lookX: 0.9, lookY: -0.55, tilt: -2}],
    [ARRIVE - 4, {lookX: 0.75, lookY: 0.35, tilt: 3}],
  ]);
  return withPose(CHECKER_BASE, {...EXPR.deadpan, ...look});
};

type Blend = (typeof BLEND)[number];
const legEnds = (b: Blend, leg: number): [Required<PlanPt>, Required<PlanPt>] => (leg === 0 ? [b.eff, b.W] : [b.W, S3D]);
const legAt = (b: Blend, leg: number, u: number): Required<PlanPt> => {
  const [p, q] = legEnds(b, leg);
  return {x: p.x + (q.x - p.x) * u, z: p.z + (q.z - p.z) * u, h: p.h + (q.h - p.h) * u};
};
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

/** The blip's flight from the sensor up over the room and down onto the timeline's axis (screen px). */
const blipFlight = (g: number, sensorScr: {x: number; y: number}) => {
  if (g < TOSS0 || g >= TICK_HIT) return null;
  const u = clamp01((g - TOSS0) / (TICK_HIT - TOSS0));
  const e = Easing.bezier(0.3, 0.1, 0.6, 1)(u);
  const end = {x: TICK_TOP.x, y: TICK_TOP.y + 24};
  const ctrl = {x: (sensorScr.x + end.x) / 2, y: -260};
  const bz = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  return {x: bz(sensorScr.x, ctrl.x, end.x, e), y: bz(sensorScr.y, ctrl.y, end.y, e)};
};

const RoomBlendShot: React.FC<{g: number}> = ({g}) => {
  const cam = CAM_D;
  const gu: GuesserState = {pose: guesserBlend(g), squash: [1, 1], life: 0.5, handsUp: 0, rim: 0};
  const ch = checkerBlend(g);
  const v = V_PULSE;
  const travelled = (g - PULSE0) * v;
  const arrivedFrac = BLEND.filter((b) => travelled >= b.L).length / BLEND.length;
  const flash = sp(g, ARRIVE, SNAP) * (1 - tw(g, ARRIVE + 30, 20));
  const paths = BLEND.map((b, k) => {
    const on = g >= PULSE0 && travelled < b.L;
    const leg = travelled <= b.L1 ? 0 : 1;
    const u = leg === 0 ? clamp01(travelled / b.L1) : clamp01((travelled - b.L1) / b.L2);
    const p3 = on ? legAt(b, leg, u) : null;
    const pp = p3 && !HIDE0(p3) ? P4(p3) : null;
    const trailD = g < PULSE0 ? '' : [legRuns(b, 0, 0, leg === 0 && on ? u : 1), on && leg === 0 ? '' : legRuns(b, 1, 0, on ? u : 1)].join(' ').trim();
    const spotHit = PULSE0 + b.L1 / v;
    // the hidden stretch: a ghost ring from the marker to where the pulse comes out
    const ghU = (g - PULSE0) / Math.max(1, EMERGE[k] - PULSE0);
    const ghost = ghU >= 0 && ghU < 1 ? {x: lerp(ORIGIN_PX[k].x, EMERGE_PT[k].x, ghU), y: lerp(ORIGIN_PX[k].y, EMERGE_PT[k].y, ghU)} : null;
    const spot = g >= spotHit ? E.out(clamp01((g - spotHit + 1) / 5)) : 0;
    return (
      <g key={b.id}>
        {trailD && <path d={trailD} fill="none" stroke={b.color} strokeWidth={R4.trail} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />}
        {spot > 0 && <circle cx={f2(b.px[1].x)} cy={f2(b.px[1].y)} r={f2(R4.spot * (0.6 + 0.4 * spot))} fill={C.cream} stroke={C.ink} strokeWidth={4} opacity={f2(spot)} />}
        {ghost && !pp && (
          <g opacity={f2(Math.min(1, (g - PULSE0 + 1) / 3))}>
            <circle cx={f2(ghost.x)} cy={f2(ghost.y)} r={R4.pulse} fill={C.white} fillOpacity={0.35} stroke={C.white} strokeWidth={10} strokeOpacity={0.75} />
            <circle cx={f2(ghost.x)} cy={f2(ghost.y)} r={R4.pulse} fill={b.color} fillOpacity={0.4} stroke={b.color} strokeWidth={5} strokeDasharray="8 6" />
          </g>
        )}
        {pp && <PulseDot x={pp.x} y={pp.y} r={f2(R4.pulse * (1 + 0.4 * Math.sin(Math.PI * clamp01((g - EMERGE[k]) / 7))))} color={b.color} />}
      </g>
    );
  });
  const blipOn = g >= PULSE0 && arrivedFrac > 0 && g < TOSS0;
  const throb = pulse01(g, K.paths, 14);
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {paths}
      {BLEND.map((b, k) => {
        const m = E.out(clamp01((g - MARKS0 - k * 2) / 6));
        if (m <= 0) return null;
        const o = ORIGIN_PX[k];
        // launch (V2-R1-06): a pop and a ring in the path's colour; the marker stays lit while its pulse is hidden
        const launch = g - PULSE0;
        const pop = launch >= 0 && launch <= 8 ? 1 + 0.28 * Math.sin((Math.PI * launch) / 8) : 1;
        const lit = tw(g, PULSE0 - 1, 3, E.linear) * (1 - tw(g, EMERGE[k], 6, E.inOut));
        const bu = launch / 16;
        const r0 = R4.mark * 1.1;
        return (
          <g key={b.id} transform={`translate(${f2(o.x)} ${f2(o.y)})`}>
            {bu > 0 && bu < 1 && <circle r={f2(r0 + (BURST_R[k] - r0) * E.out(bu))} fill="none" stroke={b.color} strokeWidth={f2(8 * (1 - bu) + 2)} opacity={f2(1 - bu * bu)} />}
            <g transform={`scale(${f2(m * pop)})`} opacity={f2(m)}>
              <circle r={R4.mark} fill={C.cream} stroke={C.ink} strokeWidth={4} />
              <circle r={f2(lerp(R4.markDot, R4.mark - 4, lit))} fill={b.color} />
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
  const items = roomItems(g, T0, ch, gu, {led: 1, reveal: 1, bumpHighlight: flash});
  const sScr = worldToScreen(cam, SPX4.x, SPX4.y);
  const sheet = Easing.bezier(0.25, 0.1, 0.25, 1)(clamp01((g - SHEET0) / SHEET_DUR));
  const sheetY = 1080 * (1 - sheet);
  const blip = blipFlight(g, sScr);
  const tickT = g < TICK_HIT ? 0 : 0.7 + 0.3 * clamp01((g - TICK_HIT) / TICK_SETTLE);
  const full = g >= SHEET0 + SHEET_DUR;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {!full && (
        <Camera cam={cam}>
          <Layer depth={1}>
            <RoomSet tilt={T0} items={items} door={false}>
              {overlay}
            </RoomSet>
          </Layer>
        </Camera>
      )}
      {g < SHEET0 && <SlowedChip t={tw(g, PULSE0 - 2, 6, E.linear) * (1 - tw(g, ARRIVE + 8, 8, E.linear))} />}
      {g >= SHEET0 && <TimelineHandoff t={{label: tw(g, LABEL_T, 6, E.linear), tick: tickT, chip: tw(g, CHIP_T, 6, E.linear)}} y={sheetY} />}
      {blip && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <PulseDot x={blip.x} y={blip.y} r={f2(lerp(18 * cam.zoom, 16, clamp01((g - TOSS0) / (TICK_HIT - TOSS0))))} color={C.saffron} />
        </svg>
      )}
      {/* the iris out: the section shrinks into a closing lens on the bare wall between the spots */}
      {g < IRIS_OUT_END && <IrisOut g={g} to={worldToScreen(cam, IRIS_OUT_W.x, IRIS_OUT_W.y)} />}
    </AbsoluteFill>
  );
};

const IrisOut: React.FC<{g: number; to: {x: number; y: number}}> = ({g, to}) => {
  const e = E.inOut(clamp01((g - IRIS_OUT0) / IRIS_OUT_DUR));
  const r = lerp(1500, 0, Math.pow(e, 0.6));
  if (r < 1) return null;
  const c = {x: lerp(SEC_C.x, to.x, e), y: lerp(SEC_C.y, to.y, e)};
  const s = lerp(1, 0.6, e);
  const ring = Math.min(1, r / 40);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="v3irisout">
          <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} />
        </clipPath>
      </defs>
      <g clipPath="url(#v3irisout)">
        <g transform={`translate(${f2(c.x - s * SEC_C.x)} ${f2(c.y - s * SEC_C.y)}) scale(${f2(s)})`}>
          <SectionContent g={g} />
        </g>
      </g>
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} fill="none" stroke={C.ink} strokeWidth={f2(22 * ring)} />
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} fill="none" stroke={C.saffron} strokeWidth={f2(11 * ring)} />
    </svg>
  );
};

/* ================================================================== the scene */

export const V3MirrorPaint: React.FC = () => {
  const g = useG();
  if (g < FLAT_END)
    return (
      <AbsoluteFill style={{background: PAINT}}>
        <PaintGrain />
      </AbsoluteFill>
    );
  if (g < IRIS_END) return <RoomMirrorShot g={g} />;
  if (g < IRIS_OUT0) return <SectionShot g={g} />;
  return <RoomBlendShot g={g} />;
};

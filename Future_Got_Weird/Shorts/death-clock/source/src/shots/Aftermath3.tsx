// V3 arrival -> treatment -> recovery -> the question -> the loop bridge, in his street world with the same rig.
// The drone arrives as assistance and hovers beside him (a data link to the band, no healing light); the band
// treats: its case turns, the port presses, one blue pulse runs into the established vessel; a hard cut into the
// same chest window as the journey (already open) shows the pulse arrive through the superior vena cava and the
// heart's rhythm settle (lib/reveal4.ts, lib/heart4.ts); the window closes cleanly and he breathes. The support hand
// loads, he pushes up to sitting and lifts the wrist: green replaces red, "Life Expectancy: 42 Years". Unease.
// The camera returns to the glass; one local "?" glitch turns into the red 00:02:14 of the opening, and the same
// push carries on through frames 0-7 of the next play (the cold open), so the loop is one camera move.
import React from 'react';
import {armFrame, DeviceView, PORT_GEO} from '../art/Device';
import {Drone, DronePose} from '../art/Drone';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {PortLight, PortMech, portPress, SEC, SectionLayers, SkinDimple, TREAT_SLUG, TreatChannel, treatPath, VesselTube} from '../art/Interior';
import {CHEST4, chestToWorld, ChestWindow, HAND_GRIP, svcAt} from '../art/Cutaway';
import {manJoints, ManPose, torsoPath} from '../art/Man';
import {Cam} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState3} from '../lib/device3';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, inv, lerp, mul, noise1, rot, smooth, sub, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B, TOTAL} from '../lib/timeline3';
import {revealAt} from '../lib/reveal4';
import {TREAT_MATCH} from '../lib/beats4';
import {dogAt, PROP} from './Opening';
import {BAND_C, CASE_W, CHEST, frameOn, LOCAL_PER_WORLD, PJ, PORT_W, SEC_ROLL, SF, VP, W, withLowGrip, Z_CHEST} from './Journey3';
import {Scene} from './Scene';
import {B4} from '../lib/beats4';
import {DRONE_S, droneBeacon, flightPitch, flyCam, flyDrone, hermite, rotorPhase, toScreenD} from './Dispatch';
import {SoftShadow} from '../lib/shade';
import {GROUND} from './StreetShots';
import {armPt, armR, DEV_GEO} from '../art/Device';

const ease = easeInOut;
/** C2 ease (smootherstep): at rest, with no acceleration, at both ends */
const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
/** position, speed and acceleration (per frame) of one channel at a frame */
type Jet = [number, number, number];
/** a channel's jet at t from one side (dir -1: from frames before t, 1: after), by one-sided differences */
const jet = (fn: (t: number) => number, t: number, dir: 1 | -1): Jet => {
  const d = 0.02 * dir;
  const [p0, p1, p2] = [fn(t), fn(t + d), fn(t + 2 * d)];
  return [p0, (-3 * p0 + 4 * p1 - p2) / (2 * d), (p0 - 2 * p1 + p2) / (d * d)];
};
/** quintic Hermite from jet j0 at t0 to jet j1 at t1 (clamped outside): C2 at both ends */
const quintic = (t0: number, t1: number, [p0, v0, a0]: Jet, [p1, v1, a1]: Jet, t: number) => {
  const h = t1 - t0;
  const u = clamp((t - t0) / h);
  const [u2, u3, u4, u5] = [u * u, u ** 3, u ** 4, u ** 5];
  return (
    (1 - 10 * u3 + 15 * u4 - 6 * u5) * p0 +
    (u - 6 * u3 + 8 * u4 - 3 * u5) * h * v0 +
    (0.5 * u2 - 1.5 * u3 + 1.5 * u4 - 0.5 * u5) * h * h * a0 +
    (0.5 * u3 - u4 + 0.5 * u5) * h * h * a1 +
    (-4 * u3 + 7 * u4 - 3 * u5) * h * v1 +
    (10 * u3 - 15 * u4 + 6 * u5) * p1
  );
};
const zLog = (f: number, keys: [number, number][]) => Math.exp(spline(f, keys.map(([t, z]) => [t, Math.log(z)])));
/** loop time: frames 0-7 of the film continue the end of this scene */
export const loopF = (f: number) => (f < B.cut ? f + TOTAL : f);

// ---------------------------------------------------------------- body
const SIT: ManPose = {...PROP, torso: 2, chest: 8, neck: 2, lW: 0, lTu: -150, lTv: -170, lElb: -1, lWr: -4, turn: 0.42};
const BODY: SKey<ManPose>[] = [
  [B.release0, {...PROP}, 'stop'],
  // the support hand loads: weight shifts onto the arm before the push
  [B.release0 + 14, {...PROP, torso: 18, chest: 35, neck: -10}],
  // the push: the torso rises round the hips while the hand still holds the grass
  [B.rise0 + 14, {...PROP, torso: 9, chest: 20, neck: -4}],
  [B.rise1 - 6, {...PROP, torso: 3, chest: 10, neck: 0, lWr: 70}],
  // the hand leaves the grass and the wrist comes up in front of him
  [B.green + 14, {...SIT, lW: 0, lWr: 0}],
  [B.life + 10, {...SIT, neck: 4}],
  [B.uneasy0 + 12, {...SIT, neck: 0, turn: 0.38}],
  [B.return0, {...SIT, neck: 2}],
  [TOTAL + B.cut, {...SIT, neck: 3}],
];

/** V4: his free hand grips his raised knee (clear of the chest window) while the chest is shown, then rises to his
 *  chest again (the same world-pinned grip as the journey) */
export const manAt = (f: number): ManPose => withLowGrip(manAt0(f), revealAt(f).rHandLow);
/** the treatment's breathing (held while the camera is inside the arm: the section frame is built on the still pose),
 *  as offsets from the pose; also evaluated just past B.release0, where it hands over to the recovery breathing */
const heldBreath = (f: number) => {
  const env = clamp(1 - inv(B.act0 - 6, B.act0, f) + inv(B.settleHeart1 - 6, B.release0, f));
  const br = Math.sin(f * 0.21) * env;
  return {breath: 0.5 + 0.5 * br, torso: 0.6 * br, chest: 1.4 * Math.sin(f * 0.21 + 0.6) * env};
};
const manAt0 = (f: number): ManPose => {
  const held = heldBreath(f);
  if (f < B.release0) return {...PROP, breath: held.breath, torso: PROP.torso + held.torso, chest: PROP.chest + held.chest};
  let m = splineRec(f, BODY);
  // the hand target blends from the grass to the raised position (the arm IK stays continuous)
  const lift = ease(inv(B.rise1 - 4, B.green + 12, f));
  m = {...m, lW: 1 - lift, lWx: PROP.lWx, lWy: PROP.lWy};
  // a deep breath out at the release, then calmer breathing
  const deep = Math.sin(Math.PI * clamp(inv(B.release0 - 2, B.release0 + 24, f)));
  const br = Math.sin(f * 0.16);
  // V4 continuity: the treatment's breathing hands over to this over 12 frames (V3 switched at B.release0 in one frame:
  // breath 0.17 -> 0.84, a 1 deg chest step and a 9 world head jump)
  const w = ease(inv(B.release0, B.release0 + 12, f));
  return {...m, breath: lerp(held.breath, 0.5 + 0.4 * br + 0.5 * deep, w), torso: m.torso + lerp(held.torso, 0, w), chest: m.chest + lerp(held.chest, 0.8 * br - 3 * deep, w)};
};

export const exprAt = (f: number): Expr => {
  const atBand: Expr = {...EXPR_PAIN, shut: 0, lid: 0.18, squint: 0.25, gx: 0.55, gy: 0.75, pupil: 0.7};
  // the treatment's look (eyes on the band, half gasping); V4 continuity: relief now grows out of it from B.release0 (V3
  // dropped the gasp and moved the eyes in one frame there)
  const treat = mixExpr(atBand, {...EXPR_GASP, gx: 0.4, gy: 0.6}, 0.3 + 0.2 * Math.sin(f * 0.1));
  if (f < B.release0) return treat;
  const relieved: Expr = {...EXPR_RELIEF, gx: -0.35, gy: 0.75};
  const reading: Expr = {...EXPR_RELIEF, gx: -0.45, gy: 0.8, smile: 0, open: 0.12};
  const uneasy: Expr = {...EXPR_UNEASY, gx: 0.1, gy: 0.05};
  const backDown: Expr = {...EXPR_UNEASY, gx: -0.45, gy: 0.75};
  if (f < B.green) return mixExpr(treat, relieved, ease(inv(B.release0, B.rise1, f)));
  if (f < B.uneasy0) return mixExpr(relieved, reading, ease(inv(B.green, B.life, f)));
  if (f < B.return0) return mixExpr(reading, uneasy, ease(inv(B.uneasy0, B.uneasy0 + 16, f)));
  return mixExpr(uneasy, backDown, ease(inv(B.return0, B.return0 + 18, f)));
};

const handsAt = (f: number): {l: HandPose; r: HandPose} => {
  const dig = {...HAND_BRACE, curl: [0.34, 0.38, 0.4, 0.42] as HandPose['curl'], spread: 0.8, thumbCurl: 0.35};
  const flat = {...HAND_BRACE, curl: [0.12, 0.12, 0.16, 0.18] as HandPose['curl'], spread: 0.9};
  const claw = {...HAND_CLUTCH, curl: [0.5, 0.56, 0.6, 0.64] as HandPose['curl'], spread: 0.6, thumb: 40};
  let l: HandPose = mixHand(dig, flat, ease(inv(B.release0, B.release0 + 10, f)));
  l = mixHand(l, HAND_RELAXED, ease(inv(B.rise1 - 4, B.green + 10, f)));
  // the callback: the fingers tense again with the red screen (and keep tensing into the cold open)
  l = mixHand(l, claw, ease(inv(B.callback - 2, TOTAL + B.cut, f)));
  const r0 = mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.55, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3));
  const r1 = mixHand(r0, {...HAND_CLUTCH, curl: [0.3, 0.34, 0.38, 0.42], spread: 0.5}, ease(inv(B.release0, B.release0 + 20, f)));
  const r = mixHand(r1, HAND_GRIP, revealAt(f).rHandLow);
  return {l, r};
};

// ---------------------------------------------------------------- the drone: arrives beside him and hovers
/** HOVER2: above and to the right of his head, so the data link drops almost vertically to the band, with a clear
 *  air gap over the hair (the minimum drone-to-hair distance stays >= 60 world on every frame it is drawn). */
export const HOVER2 = {x: BAND_C.x - 10, y: PJ.head.y - 345};
/** The flyover's drone carried into this camera: same screen position (and, with TRUCK.z0, the same size). While the
 *  trunk passes (arrive0..wipeLock) the two shots show one drone at one screen point. */
const lockW = (f: number): V => {
  const s = toScreenD(flyCam(f), 1, flyDrone(f));
  const c = camAt(f, BAND_C, PJ.head);
  return {x: c.x + (s.x - 540) / c.z, y: c.y + (s.y - 960) / c.z};
};
let arriveFrom: {p: V; v: V} | null = null;
const arriveStart = () => {
  if (!arriveFrom) {
    const p = lockW(B4.wipeLock);
    const q = lockW(B4.wipeLock - 1);
    arriveFrom = {p, v: {x: p.x - q.x, y: p.y - q.y}};
  }
  return arriveFrom;
};
/** Arrival: behind the trunk it is the flyover's drone (lockW); it then comes out from behind the trunk, crosses to
 *  HOVER2 and brakes with a nose-up flare, settles (hover0) and hovers with a small bob, and climbs out of frame
 *  (retreat0-1) while the camera is still on his chest, before the recovery framing returns. */
export const arriveDrone3 = (f: number): DronePose => {
  const back = ease(inv(B4.retreat0, B4.retreat1, f));
  const bob = Math.sin(f * 0.2) * 5 * clamp(inv(B4.hover0 - 2, B4.hover0 + 10, f));
  let p: V;
  if (f <= B4.wipeLock) p = lockW(f);
  else {
    const a = arriveStart();
    p = {x: hermite(B4.wipeLock, B4.hover0, a.p.x, HOVER2.x, a.v.x, 0, f), y: hermite(B4.wipeLock, B4.hover0, a.p.y, HOVER2.y, a.v.y, 0, f)};
  }
  const flare = -8 * Math.sin(Math.PI * clamp(inv(B4.flare0 - 3, B4.hover0 + 5, f)));
  return {
    x: p.x + 30 * back,
    y: p.y - 210 * back + bob,
    s: DRONE_S,
    pitch: flightPitch(f) * (1 - ease(inv(B4.wipeLock, B4.flare0, f))) + flare,
    spin: rotorPhase(f),
    beacon: droneBeacon(f),
  };
};

// ---------------------------------------------------------------- V4 treatment (device area; keys in lib/beats4.ts B4)
// One mechanism chain at the established contact point, all a pure function of the frame: approach and roll (the hand
// is swept into the backdrop first), actuation (shutter, piston, the nose's press with a dimple and attached shadow), entry (the
// compact section at the same point; one blue-white slug, not the sensor cyan, from the small reservoir down the rod and
// a straight channel through the wall into the lumen), internal response (tracked with the flow among red cells while
// the piston retracts and the shutter closes), ending on the slug decelerating at TREAT_MATCH for the 987 match cut.
const TP = treatPath(SF, VP);
const PRESS_T = PORT_GEO.pressTreat * SEC.units;
const T_INJ = B4.tSlugLumen - B4.tSlug0;
const V_INJ = TP.uMerge / (T_INJ - 1.5 * (1 - Math.exp(-T_INJ / 1.5))); // injection speed (local units / frame)
const V_FLOW = 12; // the blood's speed (VesselTube FLOW)
/** the slug's head along TP (local units; < 0 before it leaves the reservoir): it gathers speed out of the reservoir,
 *  runs the channel, then slows from the injection speed toward the blood's as the flow carries it */
export const slugHead = (g: number) => {
  const t = g - B4.tSlug0;
  if (t < 0) return -1;
  if (t <= T_INJ) return V_INJ * (t - 1.5 * (1 - Math.exp(-t / 1.5)));
  const t2 = t - T_INJ;
  return TP.uMerge + V_FLOW * t2 + (V_INJ - V_FLOW) * 5 * (1 - Math.exp(-t2 / 5));
};
/** world point of the slug's middle */
export const slugWorld = (g: number) => {
  const q = TP.arc.at(Math.max(0, slugHead(g) - TREAT_SLUG.len / 2)).p;
  return W(q.x, q.y);
};
export const treatState = (g: number) => {
  const T = B4;
  const on = g >= T.tRoll0 && g < T.treatMatch;
  // V4 continuity: the roll to the underside reads as a camera orbit, not a whip: a smoothstep over 11 frames (peak
  // 12.3 deg/frame; V3/V4 cubic over tRoll0..tRoll1 peaked at 26 deg/frame). It starts one frame before tRoll0 (the hand
  // veil is then half way and the roll is still 0; 2 deg at tRoll0 when the veil has left only a speck behind the case)
  // and comes to rest exactly at the punch-in (tCut), so the port-end detail opens on the exact profile
  const roll = on ? SEC_ROLL * smooth(inv(T.tRoll0 - 1, T.tCut, g)) : 0;
  const shutter = ease(inv(T.tShut0, T.tShut1, g)) * (1 - ease(inv(T.tShutClose0, T.tShutClose1, g)));
  const stroke = ease(inv(T.tStroke0, T.tStroke1, g)) * (1 - ease(inv(T.tRetract0, T.tRetract1, g)));
  const head = slugHead(g);
  const inLumen = head - TP.uMerge;
  // V4 match cut: it bunches as it brakes into its match point (shorter and wider, about its middle, so the point the
  // camera tracks is unchanged) to the proportions of the SVC pulse on the chest view's first frame
  const bunch = smoother(inv(T.treatMatch - 9, T.treatMatch - 1, g));
  const w = lerp(1, SLUG_END.w, bunch);
  const lenK = lerp(1, SLUG_END.len, bunch);
  return {
    on,
    roll,
    // the cut-away is open from the punch-in (the cut to the port end), never fading in on the overview
    caseOpen: g >= T.tCut ? 1 : 0,
    shutter,
    stroke,
    dimple: portPress(stroke, PRESS_T),
    level: 1 - 0.7 * ease(inv(T.tSlug0, T.tSlugTip + 3, g)),
    open: ease(inv(T.tWin0, T.tWin1, g)),
    head,
    trail: Math.max(0, head - Math.max(0, slugHead(g - 10))),
    /** round the bend in the lumen the trace fades within about 3 frames (no J left behind) */
    trailLumen: Math.max(0, head - Math.max(0, slugHead(g - 3))),
    w,
    dose:
      inLumen > 0
        ? {
            s: TP.sMerge + inLumen - ((1 - lenK) * TREAT_SLUG.len) / 2,
            a: clamp(inLumen / 60),
            w,
            len: lenK,
            glow: 0.25 + 0.75 * Math.sin(Math.PI * clamp((g - (T.tSlugLumen - 2)) / 7)),
            body: head - TREAT_SLUG.len >= TP.uMerge,
            from: TP.sMerge,
            // a short trail behind it: how far it travelled in the last 4 frames (it shortens as the slug slows)
            wake: head - slugHead(g - 4),
          }
        : undefined,
  };
};
// ---------------------------------------------------------------- the 987 match cut (device -> chest)
/** On the last device frame (986) the slug rests at MATCH_AT (screen px); on the first chest frame (987) the treatment
 *  pulse in the superior vena cava sits on the same point, with the same calibre, about the same length and along the
 *  same screen axis:
 *  - the chest view holds one framing from the cut (MATCH.cam: the pulse on MATCH_AT at MATCH_K x the journey's chest
 *    zoom), so it is still while the pulse runs into the atrium and the light plays (no settle after the cut);
 *  - the slug bunches as it brakes (treatState: shorter and wider, SLUG_END) to about the pulse's proportions (the
 *    pulse is drawn 2:1, art/Heart4 rx 5.2 / ry 2.6);
 *  - the device camera's last zoom (Z_MATCH) gives the slug the pulse's rim width on screen, and the tracking rolls
 *    (TRACK_ROLL, from rest at TRACK0 to rest at 986, C2) so the vessel lies along the vena cava's screen axis. */
const MATCH_AT = {x: TREAT_MATCH.x, y: TREAT_MATCH.y};
const SLUG_END = {len: 0.55, w: 1.25};
const MATCH_K = 1.1;
const MATCH = (() => {
  const g = B4.chestCut;
  const man = manAt(g);
  const j = manJoints(man);
  const rv = revealAt(g);
  const heartL = {x: CHEST4.heart[1], y: -CHEST4.heart[0]};
  const t = rv.treat?.t ?? 0;
  const at = (u: number) => chestToWorld(j.C, j.tc, man.s, svcAt(rv.heart, heartL, CHEST4.heartK, u));
  const p = at(t);
  const z = Z_CHEST * MATCH_K;
  const cam: Cam = {x: p.x - (MATCH_AT.x - 540) / z, y: p.y - (MATCH_AT.y - 960) / z, z, roll: 0};
  // the heart (its camera landmark), which the chest view's slow push is centred on
  const heart = chestToWorld(j.C, j.tc, man.s, {x: CHEST4.heart[1], y: -CHEST4.heart[0]});
  // the pulse as Heart4 draws it: its axis (from 0.12 behind it to it) and its rim width (ry 2.6), screen
  const q = sub(p, at(Math.max(0, t - 0.12)));
  const pulseAxis = (Math.atan2(q.y, q.x) * 180) / Math.PI;
  const rimW = 2 * 2.6 * CHEST4.heartK * man.s * z;
  // the slug's axis on the last device frame (its chord along the vessel; screen = world at roll 0)
  const d = treatState(g - 1).dose;
  const s1 = d?.s ?? 0;
  const s0 = s1 - TREAT_SLUG.len * (d?.len ?? 1);
  const c = sub(W(VP.at(s1).p.x, VP.at(s1).p.y), W(VP.at(s0).p.x, VP.at(s0).p.y));
  const slugAxis = (Math.atan2(c.y, c.x) * 180) / Math.PI;
  // an axis, not a direction: the smallest roll that lays one on the other
  const roll = ((((pulseAxis - slugAxis + 90) % 180) + 180) % 180) - 90;
  return {cam, heart, roll, zMatch: (rimW / (TREAT_SLUG.w * SLUG_END.w)) * LOCAL_PER_WORLD};
})();

/** the treatment camera: profile overview at z <= 12.5 after the roll, then (cut) the port end with the case running
 *  off frame, contact and entry, then it tracks the slug to its match point (MATCH_AT), rolling onto the vena cava's
 *  axis, and comes to rest */
const TREAT_OVER: [number, V, number][] = [
  [B4.tRoll1, frameOn(CASE_W, 425, 1075, 11.8), 11.8],
  [B4.tCut, frameOn(CASE_W, 423, 1072, 12.3), 12.3],
];
/** the camera that puts p at screen (sx, sy) at zoom z with roll (lib/camera: about the screen centre, clockwise deg) */
const frameOnR = (p: V, sx: number, sy: number, z: number, roll: number): Cam => ({...sub(p, rot({x: (sx - 540) / z, y: (sy - 960) / z}, -roll)), z, roll});
/** The port-end detail (as in the sensor shot): the compact mechanism and its cut-away above the caption lane, about a
 *  quarter of the case running off the bottom of the frame. The contact point's screen position is keyed (it comes to
 *  rest at TRACK0, where the tracking takes over); the zoom is one ease from the full stroke to the match frame, so it
 *  is already pulling back gently as the slug leaves the nose and the case clears the caption lane while it tracks. */
const DETAIL_AT: [number, number, number][] = [
  [B4.tCut, 440, 850],
  [B4.tStroke1, 432, 855],
  [B4.tTrack0, 422, 858],
];
const Z_DETAIL = 41;
const Z_MATCH = MATCH.zMatch;
const TRACK_ROLL = MATCH.roll;
const Z_PULL0 = B4.tStroke1 + 2; // 953
const TRACK0 = B4.tTrack0; // 965
const TRACK1 = B4.treatMatch - 1; // 986
const detailZ = (g: number) => Math.exp(lerp(Math.log(Z_DETAIL), Math.log(Z_MATCH), smooth(inv(Z_PULL0, TRACK1, g))));
/** the roll onto the vena cava's axis (about 43 deg counter-clockwise): C2 from rest at the hand-over to the tracking
 *  to rest on the last device frame, peak 3.9 deg/frame at 975 (started earlier, a roll already turning at the
 *  hand-over added its own flow to the hand-over's acceleration: 11.5 px/frame^2 against HEAD's 8.2; this: 8.2) */
const ROLL0 = B4.tTrack0; // 965
const trackRoll = (g: number) => TRACK_ROLL * smoother(inv(ROLL0, TRACK1, g));
const detailCam = (g: number): Cam =>
  frameOnR(PORT_W, spline(g, DETAIL_AT.map(([t, x]) => [t, x])), spline(g, DETAIL_AT.map(([t, , y]) => [t, y])), detailZ(g), trackRoll(g));
/** The tracking (internal response): from TRACK0 the camera follows a point that runs along the vessel at the slug's
 *  pace (upstream of the merge while the slug is still in the channel, the slug itself once it is in the lumen), so it
 *  never follows the slug's turn into the flow. That point's screen position eases from where the detail camera sees
 *  it, at its screen speed there (so the camera's motion is continuous), to MATCH_AT on the last frame, at rest. So
 *  the slug rises on screen and slows into its match point, never sinking as the camera pulls back. The camera rolls
 *  about that point (TRACK_ROLL, C2 from rest to rest), so the roll never moves the slug on screen. */
const trackPt = (g: number) => {
  const q = VP.at(TP.sMerge + slugHead(g) - TREAT_SLUG.len / 2 - TP.uMerge).p;
  return W(q.x, q.y);
};
/** world -> screen, with the camera's roll */
const toScr = (c: Cam, p: V): V => add({x: 540, y: 960}, rot(mul(sub(p, c), c.z), c.roll ?? 0));
/** where the detail camera sees the tracked point (screen) */
const seenByDetail = (g: number) => toScr(detailCam(g), trackPt(g));
const TRACK = (() => {
  const camEnd = frameOnR(slugWorld(TRACK1), MATCH_AT.x, MATCH_AT.y, Z_MATCH, TRACK_ROLL);
  const a0 = seenByDetail(TRACK0);
  const a1 = toScr(camEnd, trackPt(TRACK1));
  const s0 = seenByDetail(TRACK0 - 0.5);
  const s1 = seenByDetail(TRACK0 + 0.5);
  return {a0, a1, v0: {x: s1.x - s0.x, y: s1.y - s0.y}, T: TRACK1 - TRACK0, jx: jet((t) => seenByDetail(t).x, TRACK0, -1)};
})();
/** one component of the anchor: from a0 at speed v0 (per frame) to a1 at rest over T frames, without overshoot (a cubic
 *  while that is monotone, otherwise a power ease-out with the same start speed) */
const anchorAt = (s: number, a0: number, a1: number, v0: number, T: number) => {
  const d = a1 - a0;
  const m = v0 * T;
  const r = Math.abs(d) > 1e-6 ? m / d : 0;
  if (r > 3) return a1 - d * Math.pow(1 - s, r);
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * a0 + (s3 - 2 * s2 + s) * m + (-2 * s3 + 3 * s2) * a1;
};
/** V4 continuity: across the hand-over the anchor's x (where the slug, running on at 66 px/frame, has to turn back to
 *  its match point) is a quintic that also takes on the detail camera's acceleration there (C2; the cubic braked at
 *  14 px/frame^2 from the first tracking frame); y keeps the eased path, which never lets the slug sink on screen (the
 *  camera still takes up the slug's turn into the flow at 966-968, as in V4 HEAD: about 8 px/frame^2) */
const trackCam = (g: number): Cam => {
  const {a0, a1, v0, T, jx} = TRACK;
  const s = clamp((g - TRACK0) / T);
  return frameOnR(trackPt(g), quintic(TRACK0, TRACK1, jx, [a1.x, 0, 0], g), anchorAt(s, a0.y, a1.y, v0.y, T), detailZ(g), trackRoll(g));
};

// ---------------------------------------------------------------- camera
const SEC_VIEW = W(SF.Xp - 760, 420);
const PORT_VIEW = W(SF.Xp - 80, 200);
const VES_VIEW = W(SF.Xp - 900, 520);
const MED = {x: 560, y: 1450};

/** the camera (world centre) that puts the band (BAND_C) at screen (x, y) at zoom z */
const onBand = (x: number, y: number, z: number): V => ({x: BAND_C.x - (x - 540) / z, y: BAND_C.y - (y - 960) / z});
/** The trunk-wipe truck (frames before B.arrive): one rightward move that starts at the flyover's camera speed (v0,
 *  world/frame) and decelerates into the B.arrive key (C1 there, whatever that key holds); the start zoom gives the
 *  drone the flyover's screen size (DRONE_S * z0), and y0 keeps the band under the caption lane while it holds. */
const TRUCK = {x0: -16, y0: 1250, z0: 1.25, v0: 30};
/** the V4 dispatch's B.arrive key: the truck runs into it exactly as built up to B4.wipeLock (the flyover drone is held
 *  at its screen point through the camera until then, so its world path, and its clearance over his hair, depend on
 *  this camera) */
const ARRIVE_DISPATCH: [V, number] = [{x: 500, y: 1360}, 1.6];
/** V4 captions: from wipeLock the band rises from under the caption lane to ARRIVE_BAND_Y above it while it is still
 *  right of 'While help is coming,' (x <= 853), and holds there, so the push into the band (B.arrive -> act0 + 3)
 *  never crosses the lane under 'the band delivers' (V4 dispatch: 921-925); held there the band and the data-link ring
 *  round it stay >= 52 / 44 px over 'coming,'. The zoom at B.arrive is lower (1.6 -> 1.37), so the hovering drone
 *  keeps its headroom at the top of frame (>= 64 px through B.arrive - 1; it leaves through the top as the push
 *  starts). The push lands on the band a frame later than V3's act0 + 2 (peak 14.7 %/frame, was 16). */
const ARRIVE_BAND_Y = 1298;
const PUSH_LAND = B.act0 + 3;
const ARRIVE_RISE = 12; // frames from wipeLock (an even C2 rise; the trunk clears at WIPE.out1)
const ARRIVE_KEY: [V, number] = [onBand(727, ARRIVE_BAND_Y, 1.37), 1.37];

export const camAt = (g: number, wristW: V, headW: V): Cam => {
  if (g >= B4.chestCut && g < B4.treatPull1) {
    // V4: the treatment chest view holds the match framing from the cut (MATCH.cam: the pulse where the slug came to
    // rest) with a slow push while the rhythm settles; the window closes (1025-1035) before the pull gathers speed, and
    // the pull lands on the recovery path itself at treatPull1 (same position, zoom and velocity), so there is no seam
    const hold = ease(inv(B4.chestCut, B4.treatPull0, g));
    const mc = MATCH.cam;
    // the push (4 %) is centred on the heart, so the window grows evenly round it and stays clear of the frame's edge
    const za = mc.z * (1 + 0.04 * hold);
    const a = add(MATCH.heart, mul(sub(mc, MATCH.heart), mc.z / za));
    // smoothstep (peak speed 1.5x the average, half that of the cubic in-out): an even pull, no whip
    const e = smooth(inv(B4.treatPull0, B4.treatPull1, g));
    const r = recoveryCam(g, wristW, headW);
    return {x: lerp(a.x, r.x, e), y: lerp(a.y, r.y, e), z: Math.exp(lerp(Math.log(za), Math.log(r.z), e)), roll: lerp(0, r.roll ?? 0, e)};
  }
  if (g < B.release0 + 4 && g < B4.chestCut) {
    // the push lands on the band at PUSH_LAND (V4 picture fix: a frame later than V3's act0 + 2, peak 14.7 %/frame, was
    // 16); the trunk-wipe truck keeps the V4 dispatch's own keys (act0 + 2), so it runs into B.arrive exactly as built
    const keysWith = ([pA, zA]: [V, number], land: number): [number, V, number][] => [
      [B4.arrive0, {x: TRUCK.x0, y: TRUCK.y0}, TRUCK.z0],
      [B.arrive, pA, zA],
      [land, BAND_C, 6.5],
      // V4: the treatment's own cameras (TREAT_OVER, detailCam, trackCam) run from here to B4.treatMatch, with cuts at B4.tCut
      // and B4.treatMatch; the keys below are the V3 chest/recovery path after the match cut
      [B.settleHeart0 + 6, add(mul(BAND_C, 0.4), mul(PJ.L.E, 0.6)), 3.6],
      [B.settleHeart0 + 18, add(mul(CHEST.heart, 0.7), mul(CHEST.centroid, 0.3)), 4.8],
      [B.settleHeart1 - 4, CHEST.heart, 5.2],
      [B.release0 + 4, MED, 2.2],
    ];
    const keys = keysWith(ARRIVE_KEY, PUSH_LAND);
    const sx = (t: number) => spline(t, keys.map(([k, p]) => [k, p.x]));
    const sy = (t: number) => spline(t, keys.map(([k, p]) => [k, p.y]));
    const sz = (t: number) => Math.log(zLog(t, keys.map(([k, , z]) => [k, z])));
    if (g < B.arrive) {
      const a = B.arrive;
      const e = 1e-3;
      // the truck behind the trunk as the V4 dispatch built it: Hermite into ITS B.arrive key with its spline's slope there
      const truck = (t: number): Cam => {
        const kd = keysWith(ARRIVE_DISPATCH, B.act0 + 2);
        const dx = (u: number) => spline(u, kd.map(([k, p]) => [k, p.x]));
        const dy = (u: number) => spline(u, kd.map(([k, p]) => [k, p.y]));
        const dz = (u: number) => Math.log(zLog(u, kd.map(([k, , z]) => [k, z])));
        const md = (s: (u: number) => number) => (s(a + e) - s(a)) / e;
        return {
          x: hermite(B4.arrive0, a, TRUCK.x0, dx(a), TRUCK.v0, md(dx), t),
          y: hermite(B4.arrive0, a, TRUCK.y0, dy(a), 0, md(dy), t),
          z: Math.exp(hermite(B4.arrive0, a, Math.log(TRUCK.z0), dz(a), 0, md(dz), t)),
          roll: 0,
        };
      };
      const L = B4.wipeLock;
      if (g <= L) return truck(g);
      // V4 captions: from the lock on, in band-screen terms: the band keeps the truck's screen x path into the new B.arrive
      // key, rises to ARRIVE_BAND_Y over ARRIVE_RISE frames and holds; the zoom runs into the new key (x, zoom and the
      // hold: C1 at the lock and at B.arrive, with the push's own spline slopes there). The rise is a quintic that
      // matches the truck's speed and acceleration at the lock and lands with no acceleration, so the trunk wipe's
      // truck turns into one even C2 rise (a cubic rise over 7 frames jerked at 898 and stopped hard at 904-906)
      const bandS = (c: Cam) => ({x: 540 + (BAND_C.x - c.x) * c.z, y: 960 + (BAND_C.y - c.y) * c.z});
      const push = (t: number): Cam => ({x: sx(t), y: sy(t), z: Math.exp(sz(t)), roll: 0});
      const chan = {x: (c: Cam) => bandS(c).x, y: (c: Cam) => bandS(c).y, lz: (c: Cam) => Math.log(c.z)};
      const atL = (k: keyof typeof chan) => jet((t) => chan[k](truck(t)), L, -1);
      const atA = (k: keyof typeof chan) => jet((t) => chan[k](push(t)), a, 1);
      const c1 = (t0: number, t1: number, j0: Jet, j1: Jet) => hermite(t0, t1, j0[0], j1[0], j0[1], j1[1], g);
      const z = Math.exp(c1(L, a, atL('lz'), atA('lz')));
      const bx = c1(L, a, atL('x'), atA('x'));
      // (the rise ends 20 px under the hold height, still rising a little, so the band runs on into the push without a bob)
      const rest: Jet = [ARRIVE_BAND_Y + 20, -1.5, 0];
      const by = g < L + ARRIVE_RISE ? quintic(L, L + ARRIVE_RISE, atL('y'), rest, g) : c1(L + ARRIVE_RISE, a, rest, atA('y'));
      return {x: BAND_C.x - (bx - 540) / z, y: BAND_C.y - (by - 960) / z, z, roll: 0};
    }
    // V4 treatment (device area): the overview approach, the punch-in to the port end (B4.tCut), then the tracking of the
    // slug with the flow (TRACK0) up to the match cut into the chest view (B4.treatMatch = B4.chestCut)
    const run = (ks: [number, V, number][]): Cam => ({x: spline(g, ks.map(([t, p]) => [t, p.x])), y: spline(g, ks.map(([t, p]) => [t, p.y])), z: zLog(g, ks.map(([t, , z]) => [t, z])), roll: 0});
    if (g >= TRACK0 && g < B4.treatMatch) return trackCam(g);
    if (g >= B4.tCut && g < B4.treatMatch) return detailCam(g);
    if (g < B4.treatMatch) return run([...keys.filter(([t]) => t <= PUSH_LAND), ...TREAT_OVER]);
    return {x: sx(g), y: sy(g), z: Math.exp(sz(g)), roll: 0};
  }
  return recoveryCam(g, wristW, headW);
};

/** screen px the band is held higher as it settles over the caption lane after the readout (recoveryCam) */
const UNEASY_LIFT = 40;
/** recovery and the question; the end pushes into the glass and keeps going through the loop point (before its
 *  first key it holds the medium shot) */
const recoveryCam0 = (g: number, wristW: V, headW: V): Cam => {
  const twoShot = (k: number) => ({x: lerp(headW.x, wristW.x, k) + 10, y: lerp(headW.y, wristW.y, k)});
  /** the camera that puts the band (wristW, this frame) at screen (x, y) at zoom z */
  const onWrist = (x: number, y: number, z: number): [V, number] => [{x: wristW.x - (x - 540) / z, y: wristW.y - (y - 960) / z}, z];
  const keys: [number, V, number][] = [
    [B.release0 + 4, MED, 2.2],
    [B.rise0, {x: 560, y: 1420}, 2.0],
    // V4 captions: the push-up framing drifts so the band sits right of the short 'as he sits up.' (x 266-724), the
    // tilt to the band starts 8 frames earlier and lifts it through the caption lane there (at most 45 px/frame), so it
    // is above the lane before 'Green replaces red:' (x 156-834) fades in and green starts on a clear glass; the zoom
    // holds near 2 until then, so his face stays in frame to the end of 'as he sits up.', and the push in follows; the
    // green close-up holds the band at the right (V3: twoShot(0.86), the band at x 486, which crossed the lane under
    // 'red:' at 1098-1101)
    [B.rise1 - 8, ...onWrist(790, 1655, 1.9)],
    [B.green - 2, ...onWrist(810, 1318, 2.0)],
    [B.green + 6, ...onWrist(770, 1200, 4.2)],
    // "life expectancy, forty-two years": the readout large and readable
    [B.life + 4, wristW, 9.0],
    [B.life + 46, wristW, 9.4],
    // his uneasy reaction: face and band together, the band above the caption lane
    [B.uneasy0 + 6, twoShot(0.6), 2.4],
    [B.return0, twoShot(0.6), 2.3],
    [B.glitch - 8, wristW, 7.5],
    [B.callback, wristW, 9.4],
    [TOTAL + B.cut, wristW, 11.6],
  ];
  const c = {x: spline(g, keys.map(([t, p]) => [t, p.x])), y: spline(g, keys.map(([t, p]) => [t, p.y])), z: zLog(g, keys.map(([t, , z]) => [t, z]))};
  // a slow roll during the push to the glass gives the bridge its own steady motion
  const roll = lerp(0, -5, ease(inv(B.return0, TOTAL + B.cut, g)));
  // V4 captions: pulling out of the readout the band settles just over the caption lane under 'forty-two years.'; a C2
  // tilt of at most UNEASY_LIFT px holds it higher while it settles (a mid key there made the pull-out hesitate): the
  // glass stays >= 64 px over the caption (28 px of lift: 52)
  const lift = UNEASY_LIFT * smoother(inv(B.uneasy0 - 19, B.uneasy0 - 7, g)) * (1 - smoother(inv(B.uneasy0 - 3, B.uneasy0 + 11, g)));
  return {...c, y: c.y + lift / c.z, roll};
};
/** the band (as the shot computes it) and the head, world, at any frame (for the camera's jets) */
const bandHeadAt = (t: number): [V, V] => {
  const m = manAt(t);
  const j = manJoints(m);
  return [add(j.L.W, mul(j.L.foreDir, -1.75 * 17 * m.s)), j.head];
};
/** V4 continuity: the tilt that lifts the band through the caption lane (keys B.rise1 - 8 -> B.green - 2) eased in
 *  from rest without a kick: over TILT the band's screen y runs one quintic, C2 with the keyed path at both ends (it
 *  started from rest at the B.rise1 - 8 key with its largest acceleration on the first frame, a step of about 7 px/frame^2;
 *  it also takes out the acceleration step at the B.green - 2 key); x and the zoom stay on the keys */
const TILT: [number, number] = [B.rise1 - 13, B.green];
let tiltJets: [Jet, Jet] | null = null;
const recoveryCam = (g: number, wristW: V, headW: V): Cam => {
  const c = recoveryCam0(g, wristW, headW);
  if (g <= TILT[0] || g >= TILT[1]) return c;
  if (!tiltJets) {
    const by = (t: number) => {
      const [bw, hw] = bandHeadAt(t);
      const k = recoveryCam0(t, bw, hw);
      return 960 + (bw.y - k.y) * k.z;
    };
    tiltJets = [jet(by, TILT[0], -1), jet(by, TILT[1], 1)];
  }
  const y = quintic(TILT[0], TILT[1], tiltJets[0], tiltJets[1], g);
  return {...c, y: wristW.y - (y - 960) / c.z};
};

/** The data link drone -> band (world): its alpha, the dashed line's ends and the ring round the glass it ends on (also
 *  read by scripts/check_captions4.ts). It appears once the drone is clear to the right of his head and is gone before
 *  the case turns (V4 device: and before the case starts to roll, so no spare circle beside the turning case). The
 *  ring starts just outside the case's corners (as the alarm ring does), so neither the dashed line nor the ring ever
 *  crosses the digits; the case has not turned yet (roll 0) while the link is on. */
export const dataLink = (g: number, man: ManPose, dp: DronePose) => {
  const j = manJoints(man);
  const a = clamp(inv(B4.link0 - 2, B4.link0 + 2, g)) * (1 - clamp(inv(B4.link1 - 5, B4.link1, g))) * (1 - clamp(inv(B4.tApproach0 + 2, B4.tBack1, g)));
  const from = {x: dp.x - Math.sin((dp.pitch * Math.PI) / 180) * 80 * dp.s, y: dp.y + Math.cos((dp.pitch * Math.PI) / 180) * 80 * dp.s};
  const rw = 17 * man.s;
  const arm = armFrame(j.L.E, j.L.W, 23.5 * man.s, rw);
  const u = arm.L - DEV_GEO.bandFromWrist * rw;
  const c = armPt(arm, u, 0, armR(arm, u) + DEV_GEO.caseT * rw, Math.sin((14 * Math.PI) / 180));
  const r = (0.5 * Math.hypot(DEV_GEO.caseL, DEV_GEO.caseW) + 0.16 + 0.3 * (0.5 + 0.5 * Math.sin(g * 0.5))) * rw;
  const d = Math.max(1e-6, Math.hypot(from.x - c.x, from.y - c.y));
  return {a, from, to: {x: c.x + ((from.x - c.x) / d) * r, y: c.y + ((from.y - c.y) / d) * r}, c, r};
};

// ---------------------------------------------------------------- render
export const Aftermath3: React.FC<{id: string; f: number}> = ({id, f}) => {
  const g = loopF(f);
  const man = manAt(g);
  const j = manJoints(man);
  const bandW = add(j.L.W, mul(j.L.foreDir, -1.75 * 17 * man.s));
  // V4: one camera trajectory through the loop point (no frame-0 shake: the alarm is a periodic ring that is already
  // running before the wrap, drawn by the device itself; lib/device3.ts alarmAt)
  const cam: Cam = camAt(g, bandW, j.head);
  const expr = exprAt(g);
  const hands = handsAt(g);
  const blink = Math.max(0, 1 - Math.abs(((g - 20) % 85) - 3) / 3) * (g > B.return0 + 20 ? 0 : 1);

  // V4 treatment (device area, B4 keys): approach, actuation, entry, tracking; it ends at B4.treatMatch, where the
  // anatomy area's chest view cuts in (one reveal authority, lib/reveal4.ts); no frame shows both
  const rv = revealAt(g);
  const tr = treatState(g);
  const secOn = tr.on && g < B4.chestCut;
  const roll = tr.roll;
  const pxs = cam.z / LOCAL_PER_WORLD;
  // the backdrop (a vignette closing in toward the band) is complete before the hand veil sweeps the hand away
  // (fingertips first) as the roll starts; it is gone from the cut into the chest view (it would cover the torso)
  const backdrop = g < B4.chestCut ? clamp(inv(B4.tBack0, B4.tBack1, g)) : 0;
  // V4 polish: the veil's progress is eased out against the push-in (the hand grows on screen as it goes), so the
  // hand recedes at an even pace
  const handVeil = g < B4.treatMatch ? 1 - Math.pow(1 - clamp(inv(B4.tVeil0, B4.tVeil1, g)), 1.5) : 0;
  // the vessel at the contact point: red cells for scale, the dose; no sensor beads (no repeated sensor emission)
  const tube = <VesselTube id={`${id}-vt`} path={VP} f={g} px={pxs} s0={VP.entry - 900} s1={99999} sensors={0} sensorFront={0} dose={tr.dose} />;
  // the treatment chest view: the same window and interior as the journey, open from the cut
  const chest =
    rv.chestOpen > 0.004 ? (
      <ChestWindow
        id={`${id}-cw`}
        f={g}
        C={j.C}
        tc={j.tc}
        s={man.s}
        open={rv.chestOpen}
        organDim={rv.organDim}
        organSense={rv.organSense}
        organWarn={rv.organWarn}
        heart={rv.heart}
        heartSense={rv.heartSense}
        heartWarn={rv.heartWarn}
        traceA={0}
        pulses={[]}
        treat={rv.treat}
        treatLight={rv.treatLight}
      />
    ) : null;

  const dev: DeviceView = {
    screen: deviceState3(f < B.cut ? f : g),
    roll,
    yaw: 14,
    flip: false,
    upright: true,
    glow: 1,
    caseOpen: secOn ? tr.caseOpen : 0,
    caseCut: () => (
      <g transform={SF.matrix}>
        <SkinDimple id={`${id}-dg`} sf={SF} amp={tr.dimple} part="gap" />
        <PortMech id={`${id}-pm`} sf={SF} f={g} shutter={tr.shutter} stroke={tr.stroke} press={PRESS_T} treatLevel={tr.level} sensorLeft={0} />
        <TreatChannel id={`${id}-tcc`} tp={TP} head={tr.head} trail={tr.trail} w={tr.w} part="case" bore={{sf: SF, stroke: tr.stroke, press: PRESS_T}} />
      </g>
    ),
    inArm: () =>
      secOn ? (
        <g transform={SF.matrix}>
          <SectionLayers id={`${id}-sec`} sf={SF} f={g} open={tr.open} dimple={tr.dimple} tube={tube}>
            <TreatChannel id={`${id}-tct`} tp={TP} head={tr.head} trail={tr.trail} trailLumen={tr.trailLumen} w={tr.w} part="tissue" />
          </SectionLayers>
          <PortLight id={`${id}-pl`} sf={SF} press={tr.dimple} a={clamp(tr.dimple / PRESS_T)} color="#A9C8FF" />
          <SkinDimple id={`${id}-dm`} sf={SF} amp={tr.dimple} />
        </g>
      ) : null,
  };
  const dp = arriveDrone3(g);
  const showDrone = g < B.return0 + 30;
  const {a: linkA, from: linkFrom, to: linkTo, c: glassC, r: linkR} = dataLink(g, man, dp);
  // the drone's soft ground shadow: broad and faint at this height, it follows the drone (and its bob)
  const shK = clamp(1 - (GROUND - dp.y) / 2200);
  return (
    <Scene
      id={id}
      f={g}
      cam={cam}
      man={man}
      expr={expr}
      blink={blink}
      lHand={hands.l}
      rHand={hands.r}
      dog={dogAt(g)}
      hairSway={0}
      dev={dev}
      backdrop={backdrop}
      backdropC={W(SF.Xp - 600, 400)}
      handVeil={handVeil}
      nearLegFront
      noTufts
      overTorso={chest}
      under={showDrone && shK > 0.01 ? <SoftShadow id={`${id}-drs`} c={{x: dp.x + 40, y: GROUND + 6}} rx={190 * dp.s * shK} ry={24 * dp.s * shK} alpha={0.16 * shK} /> : null}
      extra={
        <g>
          {showDrone && <Drone id={`${id}-dr`} p={dp} blur={1} />}
          {/* the drone has found him: a thin data link dropping almost vertically to the band (no light on him) */}
          {linkA > 0.01 && (
            <g opacity={fmt(linkA)}>
              <path d={`M${fmt(linkFrom.x)},${fmt(linkFrom.y)} L${fmt(linkTo.x)},${fmt(linkTo.y)}`} stroke={PAL.signal} strokeWidth={3} strokeDasharray="6 10" opacity={0.8} />
              <circle cx={fmt(glassC.x)} cy={fmt(glassC.y)} r={fmt(linkR)} fill="none" stroke={PAL.signal} strokeWidth={3} />
            </g>
          )}
        </g>
      }
    />
  );
};

export {EXPR_UNEASY, easeIn};

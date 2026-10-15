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
import {ChestWindow, HAND_GRIP} from '../art/Cutaway';
import {manJoints, ManPose, torsoPath} from '../art/Man';
import {Cam} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState3} from '../lib/device3';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, inv, lerp, mul, noise1, smooth, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B, TOTAL} from '../lib/timeline3';
import {revealAt} from '../lib/reveal4';
import {TREAT_MATCH} from '../lib/beats4';
import {dogAt, PROP} from './Opening';
import {BAND_C, CASE_W, CHEST, CHEST_CAM, frameOn, LOCAL_PER_WORLD, PJ, PORT_W, SEC_ROLL, SF, VP, W, withLowGrip, Z_CHEST} from './Journey3';
import {Scene} from './Scene';
import {B4} from '../lib/beats4';
import {DRONE_S, droneBeacon, flightPitch, flyCam, flyDrone, hermite, rotorPhase, toScreenD} from './Dispatch';
import {SoftShadow} from '../lib/shade';
import {GROUND} from './StreetShots';
import {armPt, armR, DEV_GEO} from '../art/Device';

const ease = easeInOut;
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
const manAt0 = (f: number): ManPose => {
  if (f < B.release0) {
    // breathing is held while the camera is inside the arm (the section frame is built on the still pose)
    const env = clamp(1 - inv(B.act0 - 6, B.act0, f) + inv(B.settleHeart1 - 6, B.release0, f));
    const br = Math.sin(f * 0.21) * env;
    return {...PROP, breath: 0.5 + 0.5 * br, torso: PROP.torso + 0.6 * br, chest: PROP.chest + 1.4 * Math.sin(f * 0.21 + 0.6) * env};
  }
  let m = splineRec(f, BODY);
  // the hand target blends from the grass to the raised position (the arm IK stays continuous)
  const lift = ease(inv(B.rise1 - 4, B.green + 12, f));
  m = {...m, lW: 1 - lift, lWx: PROP.lWx, lWy: PROP.lWy};
  // a deep breath out at the release, then calmer breathing
  const deep = Math.sin(Math.PI * clamp(inv(B.release0 - 2, B.release0 + 24, f)));
  const br = Math.sin(f * 0.16);
  return {...m, breath: 0.5 + 0.4 * br + 0.5 * deep, chest: m.chest + 0.8 * br - 3 * deep};
};

const exprAt = (f: number): Expr => {
  const atBand: Expr = {...EXPR_PAIN, shut: 0, lid: 0.18, squint: 0.25, gx: 0.55, gy: 0.75, pupil: 0.7};
  if (f < B.release0) return mixExpr(atBand, {...EXPR_GASP, gx: 0.4, gy: 0.6}, 0.3 + 0.2 * Math.sin(f * 0.1));
  const relieved: Expr = {...EXPR_RELIEF, gx: -0.35, gy: 0.75};
  const reading: Expr = {...EXPR_RELIEF, gx: -0.45, gy: 0.8, smile: 0, open: 0.12};
  const uneasy: Expr = {...EXPR_UNEASY, gx: 0.1, gy: 0.05};
  const backDown: Expr = {...EXPR_UNEASY, gx: -0.45, gy: 0.75};
  if (f < B.green) return mixExpr(atBand, relieved, ease(inv(B.release0, B.rise1, f)));
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
  const roll = on ? SEC_ROLL * ease(inv(T.tRoll0, T.tRoll1, g)) : 0;
  const shutter = ease(inv(T.tShut0, T.tShut1, g)) * (1 - ease(inv(T.tShutClose0, T.tShutClose1, g)));
  const stroke = ease(inv(T.tStroke0, T.tStroke1, g)) * (1 - ease(inv(T.tRetract0, T.tRetract1, g)));
  const head = slugHead(g);
  const inLumen = head - TP.uMerge;
  const w = 1 + 0.12 * ease(inv(T.treatMatch - 7, T.treatMatch - 1, g));
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
            s: TP.sMerge + inLumen,
            a: clamp(inLumen / 60),
            w,
            glow: 0.25 + 0.75 * Math.sin(Math.PI * clamp((g - (T.tSlugLumen - 2)) / 7)),
            body: head - TREAT_SLUG.len >= TP.uMerge,
            from: TP.sMerge,
            // a short trail behind it: how far it travelled in the last 4 frames (it shortens as the slug slows)
            wake: head - slugHead(g - 4),
          }
        : undefined,
  };
};
/** the treatment camera: profile overview at z <= 12.5 after the roll, then (cut) the port end with the case running
 *  off frame, contact and entry, then it tracks the slug to its match point (TREAT_MATCH) and comes to rest */
const TREAT_OVER: [number, V, number][] = [
  [B4.tRoll1, frameOn(CASE_W, 425, 1075, 11.8), 11.8],
  [B4.tCut, frameOn(CASE_W, 423, 1072, 12.3), 12.3],
];
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
const Z_MATCH = 27.5;
const Z_PULL0 = B4.tStroke1 + 2; // 953
const TRACK0 = B4.tTrack0; // 965
const TRACK1 = B4.treatMatch - 1; // 986
const detailZ = (g: number) => Math.exp(lerp(Math.log(Z_DETAIL), Math.log(Z_MATCH), smooth(inv(Z_PULL0, TRACK1, g))));
const detailCam = (g: number): Cam => ({
  ...frameOn(PORT_W, spline(g, DETAIL_AT.map(([t, x]) => [t, x])), spline(g, DETAIL_AT.map(([t, , y]) => [t, y])), detailZ(g)),
  roll: 0,
});
/** The tracking (internal response): from TRACK0 the camera follows a point that runs along the vessel at the slug's
 *  pace (upstream of the merge while the slug is still in the channel, the slug itself once it is in the lumen), so it
 *  never follows the slug's turn into the flow. That point's screen position eases from where the detail camera sees
 *  it, at its screen speed there (so the camera's motion is continuous), to TREAT_MATCH on the last frame, at rest. So
 *  the slug rises on screen and slows into its match point, never sinking as the camera pulls back. */
const trackPt = (g: number) => {
  const q = VP.at(TP.sMerge + slugHead(g) - TREAT_SLUG.len / 2 - TP.uMerge).p;
  return W(q.x, q.y);
};
const toScr = (c: {x: number; y: number; z: number}, p: V) => ({x: 540 + (p.x - c.x) * c.z, y: 960 + (p.y - c.y) * c.z});
const TRACK = (() => {
  const camEnd = {...frameOn(slugWorld(TRACK1), TREAT_MATCH.x, TREAT_MATCH.y, Z_MATCH), z: Z_MATCH};
  const a0 = toScr(detailCam(TRACK0), trackPt(TRACK0));
  const a1 = toScr(camEnd, trackPt(TRACK1));
  const s0 = toScr(detailCam(TRACK0 - 0.5), trackPt(TRACK0 - 0.5));
  const s1 = toScr(detailCam(TRACK0 + 0.5), trackPt(TRACK0 + 0.5));
  return {a0, a1, v0: {x: s1.x - s0.x, y: s1.y - s0.y}, T: TRACK1 - TRACK0};
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
const trackCam = (g: number): Cam => {
  const {a0, a1, v0, T} = TRACK;
  const s = clamp((g - TRACK0) / T);
  return {...frameOn(trackPt(g), anchorAt(s, a0.x, a1.x, v0.x, T), anchorAt(s, a0.y, a1.y, v0.y, T), detailZ(g)), roll: 0};
};

// ---------------------------------------------------------------- camera
const SEC_VIEW = W(SF.Xp - 760, 420);
const PORT_VIEW = W(SF.Xp - 80, 200);
const VES_VIEW = W(SF.Xp - 900, 520);
const MED = {x: 560, y: 1450};

/** The trunk-wipe truck (frames before B.arrive): one rightward move that starts at the flyover's camera speed (v0,
 *  world/frame) and decelerates into the B.arrive key (C1 there, whatever that key holds); the start zoom gives the
 *  drone the flyover's screen size (DRONE_S * z0), and y0 keeps the band under the caption lane while it holds. */
const TRUCK = {x0: -16, y0: 1250, z0: 1.25, v0: 30};

export const camAt = (g: number, wristW: V, headW: V): Cam => {
  if (g >= B4.chestCut && g < B4.treatPull1) {
    // V4: the hard cut into the treatment chest view (the journey's framing) and a slow push while the rhythm
    // settles; the window closes (1025-1035) before the pull gathers speed, and the pull lands on the recovery
    // path itself at treatPull1 (same position, zoom and velocity), so there is no seam
    const hold = ease(inv(B4.chestCut, B4.treatPull0, g));
    const a = {x: CHEST_CAM.x - 3 * hold, y: CHEST_CAM.y - 2 * hold};
    const za = Z_CHEST * (1 + 0.04 * hold);
    // smoothstep (peak speed 1.5x the average, half that of the cubic in-out): an even pull, no whip
    const e = smooth(inv(B4.treatPull0, B4.treatPull1, g));
    const r = recoveryCam(g, wristW, headW);
    return {x: lerp(a.x, r.x, e), y: lerp(a.y, r.y, e), z: Math.exp(lerp(Math.log(za), Math.log(r.z), e)), roll: lerp(0, r.roll ?? 0, e)};
  }
  if (g < B.release0 + 4 && g < B4.chestCut) {
    const keys: [number, V, number][] = [
      [B4.arrive0, {x: TRUCK.x0, y: TRUCK.y0}, TRUCK.z0],
      // V4 (dispatch): 60 world lower than V3, so the band holds at about y 1585 under the caption through 920 and the
      // hovering drone has headroom; the push to the band then crosses the caption lane at the 921 caption change
      [B.arrive, {x: 500, y: 1360}, 1.6],
      [B.act0 + 2, BAND_C, 6.5],
      // V4: the treatment's own cameras (TREAT_OVER, detailCam, trackCam) run from here to B4.treatMatch, with cuts at B4.tCut
      // and B4.treatMatch; the keys below are the V3 chest/recovery path after the match cut
      [B.settleHeart0 + 6, add(mul(BAND_C, 0.4), mul(PJ.L.E, 0.6)), 3.6],
      [B.settleHeart0 + 18, add(mul(CHEST.heart, 0.7), mul(CHEST.centroid, 0.3)), 4.8],
      [B.settleHeart1 - 4, CHEST.heart, 5.2],
      [B.release0 + 4, MED, 2.2],
    ];
    const sx = (t: number) => spline(t, keys.map(([k, p]) => [k, p.x]));
    const sy = (t: number) => spline(t, keys.map(([k, p]) => [k, p.y]));
    const sz = (t: number) => Math.log(zLog(t, keys.map(([k, , z]) => [k, z])));
    if (g < B.arrive) {
      // the truck behind the trunk: Hermite into the B.arrive key with the spline's own slope there (C1)
      const a = B.arrive;
      const e = 1e-3;
      const m = (s: (t: number) => number) => (s(a + e) - s(a)) / e;
      return {
        x: hermite(B4.arrive0, a, TRUCK.x0, sx(a), TRUCK.v0, m(sx), g),
        y: hermite(B4.arrive0, a, TRUCK.y0, sy(a), 0, m(sy), g),
        z: Math.exp(hermite(B4.arrive0, a, Math.log(TRUCK.z0), sz(a), 0, m(sz), g)),
        roll: 0,
      };
    }
    // V4 treatment (device area): the overview approach, the punch-in to the port end (B4.tCut), then the tracking of the
    // slug with the flow (TRACK0) up to the match cut into the chest view (B4.treatMatch = B4.chestCut)
    const run = (ks: [number, V, number][]): Cam => ({x: spline(g, ks.map(([t, p]) => [t, p.x])), y: spline(g, ks.map(([t, p]) => [t, p.y])), z: zLog(g, ks.map(([t, , z]) => [t, z])), roll: 0});
    if (g >= TRACK0 && g < B4.treatMatch) return trackCam(g);
    if (g >= B4.tCut && g < B4.treatMatch) return detailCam(g);
    if (g < B4.treatMatch) return run([...keys.filter(([t]) => t <= B.act0 + 2), ...TREAT_OVER]);
    return {x: sx(g), y: sy(g), z: Math.exp(sz(g)), roll: 0};
  }
  return recoveryCam(g, wristW, headW);
};

/** recovery and the question; the end pushes into the glass and keeps going through the loop point (before its
 *  first key it holds the medium shot) */
const recoveryCam = (g: number, wristW: V, headW: V): Cam => {
  const twoShot = (k: number) => ({x: lerp(headW.x, wristW.x, k) + 10, y: lerp(headW.y, wristW.y, k)});
  const keys: [number, V, number][] = [
    [B.release0 + 4, MED, 2.2],
    [B.rise0, {x: 560, y: 1420}, 2.0],
    [B.rise1, {x: 560, y: 1380}, 1.9],
    [B.green + 6, twoShot(0.86), 4.2],
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
  return {...c, roll};
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
  // the backdrop is complete before the hand veil sweeps the hand away (fingertips first), and both before the roll;
  // it is gone from the cut into the chest view (it would cover the torso)
  const backdrop = g < B4.chestCut ? clamp(inv(B4.tBack0, B4.tBack1, g)) : 0;
  const handVeil = g < B4.treatMatch ? clamp(inv(B4.tVeil0, B4.tVeil1, g)) : 0;
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
  // the data link appears once the drone is clear to the right of his head and is gone before the case turns
  // (V4 device: and it is gone before the case starts to roll, so no spare circle beside the turning case)
  const linkA = clamp(inv(B4.link0 - 2, B4.link0 + 2, g)) * (1 - clamp(inv(B4.link1 - 5, B4.link1, g))) * (1 - clamp(inv(B4.tApproach0 + 2, B4.tBack1, g)));
  const linkFrom = {x: dp.x - Math.sin((dp.pitch * Math.PI) / 180) * 80 * dp.s, y: dp.y + Math.cos((dp.pitch * Math.PI) / 180) * 80 * dp.s};
  // it ends on a ring round the glass that starts just outside the case's corners (as the alarm ring does), so neither
  // the dashed line nor the ring ever crosses the digits; the case has not turned yet (roll 0) while the link is on
  const linkRw = 17 * man.s;
  const linkA3 = armFrame(j.L.E, j.L.W, 23.5 * man.s, linkRw);
  const linkU = linkA3.L - DEV_GEO.bandFromWrist * linkRw;
  const glassC = armPt(linkA3, linkU, 0, armR(linkA3, linkU) + DEV_GEO.caseT * linkRw, Math.sin((14 * Math.PI) / 180));
  const linkR = (0.5 * Math.hypot(DEV_GEO.caseL, DEV_GEO.caseW) + 0.16 + 0.3 * (0.5 + 0.5 * Math.sin(g * 0.5))) * linkRw;
  const linkD = Math.max(1e-6, Math.hypot(linkFrom.x - glassC.x, linkFrom.y - glassC.y));
  const linkTo = {x: glassC.x + ((linkFrom.x - glassC.x) / linkD) * linkR, y: glassC.y + ((linkFrom.y - glassC.y) / linkD) * linkR};
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

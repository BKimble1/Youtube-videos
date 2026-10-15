// V3 arrival -> treatment -> recovery -> the question -> the loop bridge, in his street world with the same rig.
// The drone arrives as assistance and hovers beside him (a data link to the band, no healing light); the band
// treats: its case turns, the port presses, one blue pulse runs into the established vessel; a hard cut into the
// same chest window as the journey (already open) shows the pulse arrive through the superior vena cava and the
// heart's rhythm settle (lib/reveal4.ts, lib/heart4.ts); the window closes cleanly and he breathes. The support hand
// loads, he pushes up to sitting and lifts the wrist: green replaces red, "Life Expectancy: 42 Years". Unease.
// The camera returns to the glass; one local "?" glitch turns into the red 00:02:14 of the opening, and the same
// push carries on through frames 0-7 of the next play (the cold open), so the loop is one camera move.
import React from 'react';
import {armFrame, DeviceView} from '../art/Device';
import {Drone, DronePose} from '../art/Drone';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {PortModule, SectionLayers, VesselTube} from '../art/Interior';
import {ChestWindow, HAND_GRIP} from '../art/Cutaway';
import {manJoints, ManPose} from '../art/Man';
import {Cam} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState3} from '../lib/device3';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, inv, lerp, mul, noise1, smooth, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B, TOTAL} from '../lib/timeline3';
import {revealAt} from '../lib/reveal4';
import {dogAt, PROP} from './Opening';
import {BAND_C, CHEST, CHEST_CAM, LOCAL_PER_WORLD, PJ, SEC_ROLL, SF, VP, W, withLowGrip, Z_CHEST} from './Journey3';
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
      [B.act0 + 14, SEC_VIEW, 11],
      [B.inject0 - 4, PORT_VIEW, 18],
      [B.inject0 + 10, PORT_VIEW, 20],
      [B.inject1 - 6, VES_VIEW, 15],
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

  // treatment (in the established section) and the heart settling (the chest window)
  // V4: the arm section (device/treatment area) ends at the hard cut into the chest view; no frame shows both
  const rv = revealAt(g);
  const secOn = g >= B.act0 + 4 && g < B4.chestCut;
  const roll = g < B.act0 ? 0 : g < B.settleHeart0 + 4 ? SEC_ROLL * ease(inv(B.act0, B.act0 + 12, g)) : SEC_ROLL * (1 - ease(inv(B.settleHeart0 + 4, B.settleHeart0 + 16, g)));
  const open = ease(inv(B.act0 + 4, B.act0 + 16, g)) * (1 - ease(inv(B.settleHeart0, B.settleHeart0 + 6, g)));
  const portExt = clamp(inv(B.inject0 - 8, B.inject0, g)) * (1 - clamp(inv(B.inject1, B.inject1 + 10, g)));
  const treat = clamp(inv(B.inject0, B.inject0 + 16, g));
  const waveS = lerp(VP.entry, VP.entry + 5200, clamp(inv(B.inject0 + 10, B.settleHeart0 + 6, g)));
  const pxs = cam.z / LOCAL_PER_WORLD;
  const backdrop = rv.backdrop;
  const tube = <VesselTube id={`${id}-vt`} path={VP} f={g} px={pxs} s0={VP.entry - 900} s1={99999} sensors={1} sensorFront={VP.entry + 4000} wave={g >= B.inject0 + 10 ? {s: waveS, a: 1} : undefined} dimFrom={waveS} />;
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
    caseOpen: secOn ? open : 0,
    caseCut: () => (
      <g transform={SF.matrix}>
        <PortModule id={`${id}-pm`} sf={SF} f={g} ext={portExt} reservoir={1} blue={1} />
      </g>
    ),
    inArm: () =>
      secOn ? (
        <g transform={SF.matrix}>
          <SectionLayers id={`${id}-sec`} sf={SF} f={g} open={open} tube={tube} stream={0} streamA={0} treat={treat} />
        </g>
      ) : null,
  };
  const dp = arriveDrone3(g);
  const showDrone = g < B.return0 + 30;
  // the data link appears once the drone is clear to the right of his head and is gone before the case turns
  const linkA = clamp(inv(B4.link0 - 2, B4.link0 + 2, g)) * (1 - clamp(inv(B4.link1 - 5, B4.link1, g)));
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

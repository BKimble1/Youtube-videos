// S7 (22.45–27.82) "Scientists are exploring whether robots like this could one day retrieve objects from inside your body."
//
// IN (S6 -> S7, CONTRACTS.md): the first frame is exactly the S6 hand-off: ONE field line FIELD_PATH (C.field, 12 px,
// round caps, the FieldLine glow) on flat C.navy1. RouteLine at m = 0, up = 0, w = 1 with the identity camera draws it
// pixel-identically (same recipe as science.tsx FieldLine).
// OUT (S7 -> S8): deliberate cut (new place). The last frame is the reveal: the solid stomach MODEL (tag LAB DEMO)
// inside the dotted ghost torso (tag FUTURE IDEA), the device carrying the bead back up the oesophagus.
//
// BEATS (film seconds; word times from story.ts T / data/timeline.json):
//   22.47–22.60  the field line alone (a light pulse starts along it)                   "Scientists" 22.59
//   22.56–23.55  the line bends into the stomach route, the upper route draws up to the oesophagus, the silicone model
//                inflates around it (lower part first, then upward), camera eases out to frame the whole model
//   23.38/23.60  "STOMACH MODEL" + tag "LAB DEMO (2023)" pop (upper-left, clear of the oesophagus)  "exploring" 23.24
//   23.50–25.35  the tiny device drops into the oesophagus; the magnet slides in OUTSIDE the model (in the J hollow),
//                field lines lock on (23.95) and it drags the device down the route to the blue bead       "robots like this"
//   24.25–25.55  camera pushes in on the bottom of the model (the bead); lab labels fade      "could one day"
//   25.38–25.95  "retrieve": the warm AC-field arcs (S6's heat language, not body heat, not the steering magnet) +
//                heat glow -> the device melts and flows around the bead (engulfs it)   T.retrieve 25.515
//   25.90–26.20  cools: ice shimmer sweeps up, sparkle -> solid nub holding the bead          "objects" 25.96
//   26.22–27.65  the magnet pulls it back up the route into the oesophagus tube (ends fully visible, s = 0.1)
//   26.30–27.45  pull back: the model sits inside a dotted ghost torso (draws on outward); tag FUTURE IDEA  "from inside your body"
//   27.45–27.82  hold the reveal (alive: device still travelling, dots twinkle, magnet moving)
import React from 'react';
import {C} from '../art/palette';
import {clamp, lerp, ss, ss5, noise1} from '../lib';
import {uid} from '../core/ids';
import {T} from '../story';
import {ACFieldArcs, FieldLine, SciBg} from '../art/science';
import {V} from '../art/liquid';
import {
  stomachD, Bead, BEAD, Cam2, CAM_ID, camPt, Device, deviceOutline, FieldBundle, GhostHuman, MAG_HALF, MedTag, MedText,
  polyAt, ROUTE_POLY, RouteLine, SEG_S, SmallMagnet, Sparkle, StomachModel,
} from '../art/medical';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};

// ---------------------------------------------------------------------------------------------------------------------
// timing
// ---------------------------------------------------------------------------------------------------------------------
export const B7 = {
  morph0: 22.56, morph1: 23.4, up0: 22.78, up1: 23.32, cam1: 23.55,
  lbl1: 23.38, lbl2: 23.6, lblOut0: 24.2, lblOut1: 24.45,
  drop0: 23.5, magIn0: 23.68, magIn1: 24.08, field0: 23.95, arrive: 25.35,
  push0: 24.2, push1: 25.55,
  heat0: 25.42, melt0: T.retrieve + 0.02, melt1: 25.86, cool0: 25.9, cool1: 26.2, spark: 26.12,
  pull0: 26.22, pull1: 27.65,
  rev0: 26.3, rev1: 27.45, ghost0: 26.42, ghost1: 27.4, future: 26.92, labTag2: 27.15,
};
const S_BEAD = 0.835; // route fraction where the device stops beside the bead
const S_START = -0.06; // just inside the oesophagus' top cut (hidden by the rim)

// ---------------------------------------------------------------------------------------------------------------------
// camera: overlapping C2 moves (log zoom), so velocity carries across beats
// ---------------------------------------------------------------------------------------------------------------------
const CAM_B = {k: 0.82, F: {x: 576, y: 946}, O: {x: 540, y: 1000}};
const CAM_C = {k: 2.0, F: {x: 425, y: 1360}, O: {x: 540, y: 1125}};
const CAM_D = {k: 0.36, F: {x: 640, y: 300}, O: {x: 540, y: 1080}};
export const camAt = (t: number): Cam2 => {
  const u1 = ss5(t, B7.morph0, B7.cam1), u2 = ss5(t, B7.push0, B7.push1), u3 = ss5(t, B7.rev0, B7.rev1);
  const drift = ss5(t, 23.3, 24.9) - ss5(t, B7.push0, B7.push1); // a slow drift toward the device while the move holds
  const drift2 = ss5(t, 25.3, 26.6) - ss5(t, B7.rev0, B7.rev1); // keeps creeping in on the retrieval
  const lk = Math.log(CAM_B.k) * u1 + Math.log(CAM_C.k / CAM_B.k) * u2 + Math.log(CAM_D.k / CAM_C.k) * u3 + 0.05 * drift + 0.08 * drift2;
  const ax = (a: number, b: number, c: number, d: number) => a + (b - a) * u1 + (c - b) * u2 + (d - c) * u3;
  return {
    k: Math.exp(lk),
    F: {x: ax(CAM_ID.F.x, CAM_B.F.x, CAM_C.F.x, CAM_D.F.x) + 30 * drift - 14 * drift2, y: ax(CAM_ID.F.y, CAM_B.F.y, CAM_C.F.y, CAM_D.F.y) + 40 * drift + 18 * drift2},
    O: {x: ax(CAM_ID.O.x, CAM_B.O.x, CAM_C.O.x, CAM_D.O.x), y: ax(CAM_ID.O.y, CAM_B.O.y, CAM_C.O.y, CAM_D.O.y)},
  };
};

// ---------------------------------------------------------------------------------------------------------------------
// device route position (arc fraction s of the final route)
// ---------------------------------------------------------------------------------------------------------------------
const deviceS = (t: number) => {
  if (t < B7.pull0) {
    // one smooth glide: dropped in, then dragged by the magnet to the bead (gentle settle at the end)
    const u = clamp((t - B7.drop0) / (B7.arrive - B7.drop0));
    const e = u < 0.5 ? 2 * u * u : 1 - (2 - 2 * u) ** 2 / 2; // quad in-out (no long creep)
    return lerp(S_START, S_BEAD, e);
  }
  const u = clamp((t - B7.pull0) / (B7.pull1 - B7.pull0));
  const e = u * u * u * (u * (u * 6 - 15) + 10);
  return lerp(S_BEAD, 0.1, e); // ends fully visible in the oesophagus tube (not half-hidden under the cut rim)
};
const deviceVel = (t: number) => (deviceS(t + 1 / 60) - deviceS(t - 1 / 60)) * 30;

// the magnet's path (model space) as a function of the device's s: Catmull-Rom through keys, all OUTSIDE the model
// (in the hollow of the J: left of the lesser curvature, above the antrum)
const MAG_KEYS: [number, V][] = [
  [0.0, {x: 500, y: 560}], [0.12, {x: 590, y: 640}], [0.22, {x: 650, y: 720}], [0.36, {x: 680, y: 900}], [0.5, {x: 630, y: 1030}],
  [0.66, {x: 540, y: 1095}], [S_BEAD, {x: 425, y: 1110}], [1.0, {x: 330, y: 1110}],
];
const magAtS = (s: number): V => {
  const ks = MAG_KEYS;
  const x = clamp(s, ks[0][0], ks[ks.length - 1][0]);
  let i = 0;
  while (i < ks.length - 2 && x > ks[i + 1][0]) i++;
  const p0 = ks[Math.max(0, i - 1)][1], p1 = ks[i][1], p2 = ks[i + 1][1], p3 = ks[Math.min(ks.length - 1, i + 2)][1];
  const u = (x - ks[i][0]) / (ks[i + 1][0] - ks[i][0]);
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return {x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y)};
};

// ---------------------------------------------------------------------------------------------------------------------
// the shot
// ---------------------------------------------------------------------------------------------------------------------
export const S7: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const k = cam.k;
  const kd = Math.max(k, 0.5); // device / bead / eye scale: never shrinks below readable in the wide reveal

  // --- route + model build
  const m = ss5(t, B7.morph0, B7.morph1);
  const up = ss(t, B7.up0, B7.up1);
  const tUp = (s: number) => B7.up0 + (1 - s / SEG_S[2]) * (B7.up1 - B7.up0); // when the draw-on reaches s
  const grow = (s: number) => {
    const low = s >= SEG_S[2];
    const t0 = low ? 22.72 + (s - SEG_S[2]) * 0.28 : tUp(s) - 0.05;
    const g = clamp((t - t0) / (low ? 0.42 : 0.24)); // the upper tube inflates right behind the draw-on front
    // inflate with a little silicone overshoot
    return g <= 0 ? 0 : g >= 1 ? 1 : 1 - (1 - g) ** 3 + 0.06 * Math.sin(Math.PI * g);
  };
  const tipS = SEG_S[2] * (1 - up); // the upper route's draw-on front (arc fraction)
  const routeW = lerp(1, 0.5, ss(t, 22.95, 23.55));
  const routeOp = lerp(1, 0.6, ss(t, 23.0, 23.6)) * (1 - 0.25 * ss(t, B7.rev0, B7.rev1));
  const pulse = ss(t, B7.morph0, B7.morph0 + 0.2) * (1 - ss(t, 25.2, 25.5));

  // --- device
  const sD = deviceS(t);
  const vS = deviceVel(t);
  const dOn = ss(t, B7.drop0, B7.drop0 + 0.12);
  const rp = polyAt(ROUTE_POLY, sD);
  const devW = 64, devH = 50; // model units (solid gumdrop)
  const heat = ss(t, B7.heat0, B7.melt0 + 0.12) * (1 - ss(t, 25.78, 25.98));
  const melt = ss(t, B7.melt0, B7.melt1);
  const cool = ss(t, B7.cool0, B7.cool1);
  // the solid's centre rides on the route, a touch above it (sits on the line)
  const nearBead = {x: BEAD.c.x + 66, y: BEAD.c.y - 10};
  const toBead = ss(sD, 0.72, S_BEAD) * (t < B7.pull0 ? 1 : 0);
  const cSolidM = {x: lerp(rp.p.x, nearBead.x, toBead), y: lerp(rp.p.y - devH * 0.32, nearBead.y, toBead)};
  // the puddle / nub centre: flows onto the bead, then (pull) eases back onto the route
  const beadM = BEAD.c;
  const offPull = 1 - ss(t, B7.pull0, B7.pull0 + 0.4);
  const flowU = ss(t, B7.melt0 + 0.04, B7.melt1);
  const nubM = t < B7.pull0 ? {x: lerp(cSolidM.x, beadM.x, flowU), y: lerp(cSolidM.y, beadM.y - 4, flowU)} : {
    x: rp.p.x + (beadM.x - polyAt(ROUTE_POLY, S_BEAD).p.x) * offPull,
    y: rp.p.y + (beadM.y - 4 - polyAt(ROUTE_POLY, S_BEAD).p.y) * offPull - 6 * (1 - offPull),
  };
  const cS = camPt(cam, cSolidM), pcS = camPt(cam, nubM);
  const dirS = {x: rp.tan.x * Math.sign(vS || 1), y: rp.tan.y * Math.sign(vS || 1)};
  const stretch = clamp(Math.abs(vS) * 0.55, 0, 0.32) * (1 - melt) + 0.05 * Math.sin(t * 7.3) * (1 - melt) * (Math.abs(vS) > 0.05 ? 1 : 0.3);
  const devPts = deviceOutline({
    c: cS, w: devW * kd, h: devH * kd, dir: dirS, stretch, melt, cool, pc: pcS,
    prx: 56 * kd, pry: 34 * kd, nw: 74 * kd, nh: 62 * kd, t,
  });
  // eyes: on the solid's face / the puddle's top / the nub's top
  const eyeSolid = {x: cS.x + dirS.x * 6 * kd * clamp(Math.abs(vS) * 3), y: cS.y - devH * 0.06 * kd};
  const eyePud = {x: pcS.x + 8 * kd, y: pcS.y - 30 * kd};
  const eyeNub = {x: pcS.x + 4 * kd, y: pcS.y - 18 * kd};
  const eyeA = {x: lerp(eyeSolid.x, eyePud.x, melt), y: lerp(eyeSolid.y, eyePud.y, melt)};
  const eyeC = {x: lerp(eyeA.x, eyeNub.x, cool), y: lerp(eyeA.y, eyeNub.y, cool)};
  const blinkAt = [23.9, 24.95, 26.32, 27.25];
  const blink = blinkAt.reduce((a, b) => Math.max(a, 1 - clamp(Math.abs(t - b) / 0.07)), 0);
  const squint = 0.45 * ss(t, B7.heat0, B7.melt0 + 0.1) * (1 - ss(t, B7.cool1 - 0.05, B7.cool1 + 0.12));
  const lookBead = ss(t, 24.95, 25.3) * (1 - ss(t, B7.pull0, B7.pull0 + 0.3));
  const lookX = lerp(rp.tan.x * Math.sign(vS || 1) * 0.6, -0.8, lookBead) + 0.25 * noise1(t * 1.3, 4) * (1 - lookBead);
  const lookY = lerp(0.2, 0.65, lookBead);
  const eyes = {c: eyeC, s: Math.max(1.4, 12.5 * kd * lerp(1, 0.85, melt)), open: (1 - blink) * (1 - squint), lookX, lookY, mood: 0, glow: 0.8 + 0.2 * heat};
  const acOn = ss(t, B7.heat0 - 0.04, B7.heat0 + 0.14) * (1 - ss(t, B7.melt1 - 0.06, B7.cool0 + 0.06));
  const beadWin = lerp(1, 0.6, ss(t, B7.melt0 + 0.08, B7.melt1));
  const beadC = t < B7.pull0 ? camPt(cam, beadM) : camPt(cam, {x: nubM.x, y: nubM.y + 4});
  const sparkA = Math.sin(Math.PI * clamp((t - B7.spark) / 0.28));

  // --- magnet (outside the model) + field to the device
  const magIn = ss5(t, B7.magIn0, B7.magIn1);
  const magTarget = magAtS(Math.max(0.1, sD + (t > B7.pull0 ? -0.04 : 0.03) * clamp(Math.abs(vS) * 4)));
  const magOff = {x: -260, y: 520};
  // reveal: the magnet moves OUTSIDE the ghost body (future idea: steered from outside), keeps pulling
  const rvM = ss5(t, 26.5, 27.35);
  const magOut = {x: -430, y: 250 - 120 * ss(t, 26.9, 27.9)};
  const magTrack = {x: lerp(magOff.x, magTarget.x, magIn), y: lerp(magOff.y, magTarget.y, magIn) + 4 * Math.sin(t * 2.1)};
  const magM = {x: lerp(magTrack.x, magOut.x, rvM), y: lerp(magTrack.y, magOut.y, rvM)};
  const devM = t < B7.melt0 ? cSolidM : nubM;
  const magS = camPt(cam, magM), devS = camPt(cam, devM);
  const dx = devS.x - magS.x, dy = devS.y - magS.y;
  const dl = Math.hypot(dx, dy) || 1;
  const magAng = Math.atan2(dy, dx) + Math.PI; // S pole (local -x) faces the device
  const magSc = 0.78;
  const magScS = lerp(magSc * k, 0.6, rvM); // screen scale (stays readable when the camera pulls back)
  const poleS = {x: magS.x + (dx / dl) * MAG_HALF * magScS, y: magS.y + (dy / dl) * MAG_HALF * magScS};
  const fieldOn = ss(t, B7.field0, B7.field0 + 0.2) * lerp(1, 0.45, ss(t, B7.heat0, B7.melt0) * (1 - ss(t, B7.cool1, B7.pull0 + 0.05)));

  // --- labels
  const lblOut = 1 - ss(t, B7.lblOut0, B7.lblOut1);
  const pLbl1 = clamp((t - B7.lbl1) / 0.3), pLbl2 = clamp((t - B7.lbl2) / 0.3);
  const lblA = camPt(cam, {x: 372, y: 409}), lblB = camPt(cam, {x: 372, y: 496});
  const lsc = k / CAM_B.k;
  const pFut = clamp((t - B7.future) / 0.32);
  const futA = camPt(cam, {x: 600, y: 60});
  const pLab2 = clamp((t - B7.labTag2) / 0.3);
  const lab2A = camPt(cam, {x: 470, y: 975}); // in the J hollow: clear of the ghost outline and the field lines

  const vig = ss(t, 22.6, 23.5);
  const idClip = uid('s7c'), idHeat = uid('s7h');
  const clipD = stomachD(cam, grow, m, tipS);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <SciBg vig={vig} cy={lerp(930, 1180, ss(t, B7.push0, B7.push1)) - 200 * ss(t, B7.rev0, B7.rev1)} />
      <GhostHuman cam={cam} p={ss(t, B7.ghost0, B7.ghost1)} t={t} fadeY={1900} />
      <StomachModel cam={cam} grow={grow} m={m} t={t} layer="back" tip={tipS} />
      <defs>
        <clipPath id={idClip}>
          <path d={clipD} />
        </clipPath>
      </defs>
      {/* WHAT melts it: the alternating field (S6's warm AC arcs = heat; under the metal, as in S6), distinct from the cyan steering field */}
      <g clipPath={`url(#${idClip})`}>
        <ACFieldArcs cx={lerp(cS.x, pcS.x, melt)} cy={lerp(cS.y, pcS.y, melt) + 16 * kd} span={150 * kd} h={120 * kd} t={t} on={acOn} />
      </g>
      <Bead c={beadC} r={BEAD.r * kd * (t < B7.pull0 ? 1 : 0.98)} window={beadWin} opacity={ss(t, 23.05, 23.4)} />
      {t < B7.morph0 ? (
        // the hand-off frames: literally S6's FieldLine (CONTRACTS.md S6 -> S7)
        <FieldLine />
      ) : (
        <RouteLine cam={cam} m={m} up={up} w={routeW * Math.max(0.6, Math.sqrt(k))} opacity={routeOp} pulse={pulse} t={t} />
      )}
      <g clipPath={`url(#${idClip})`}>
        {heat > 0.01 && (
          <g>
            <defs>
              <radialGradient id={idHeat}>
                <stop offset="0" stopColor={C.heat} stopOpacity={0.75} />
                <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={lerp(cS.x, pcS.x, melt)} cy={lerp(cS.y, pcS.y, melt)} rx={95 * k} ry={70 * k} fill={`url(#${idHeat})`} opacity={heat} />
          </g>
        )}
      {dOn > 0.001 && (
        <Device
          pts={devPts} t={t} k={kd} heat={heat} ripple={melt * (1 - cool)} cool={cool} opacity={dOn}
          gloss={{c: t < B7.melt0 ? cS : pcS, w: (t < B7.melt0 ? devW : 70) * kd, h: (t < B7.melt0 ? devH : 60) * kd, on: (1 - melt) + cool * 0.9}}
          eyes={eyes}
        />
      )}
      {/* the bead shows through the metal's socket once engulfed (drawn over the liquid) */}
      {melt > 0.4 && <Bead c={beadC} r={BEAD.r * kd} window={beadWin} opacity={ss(melt, 0.4, 0.7)} />}
      <Sparkle c={{x: pcS.x + 26 * k, y: pcS.y - 30 * k}} r={22 * k} a={sparkA} color={C.ice} />
      <Sparkle c={{x: pcS.x - 30 * k, y: pcS.y - 6 * k}} r={13 * k} a={Math.sin(Math.PI * clamp((t - B7.spark - 0.07) / 0.24))} />
      </g>
      <StomachModel cam={cam} grow={grow} m={m} t={t} layer="front" tip={tipS} />
      <FieldBundle a={poleS} b={devS} spread={Math.max(48, 70 * k)} w={Math.max(2.2, 4.2 * k)} t={t} on={fieldOn * magIn} />
      <SmallMagnet c={magS} ang={magAng} sc={magScS} opacity={magIn} />
      {/* research demo labels (solid) */}
      <MedText x={lblA.x} y={lblA.y} text="STOMACH MODEL" size={54 * lsc} p={pLbl1} opacity={lblOut} />
      <MedTag x={lblB.x} y={lblB.y} w={364} h={62} text="LAB DEMO (2023)" size={36} p={pLbl2} opacity={lblOut} />
      {/* the future possibility (ghost) + the model's own tag again, small */}
      <MedTag x={futA.x} y={futA.y} w={300} h={66} text="FUTURE IDEA" size={40} p={pFut} ghost t={t} />
      <MedTag x={lab2A.x} y={lab2A.y} w={196} h={50} text="LAB DEMO" size={30} p={pLab2} />
    </svg>
  );
};

/** where captions must NOT go (screen y ranges), per time window */
export const S7_NO_CAPTION = [
  {t0: 22.45, t1: 27.82, y0: 480, y1: 1520, note: 'model, device, labels, ghost torso (captions belong in the top band 250-420)'},
];

export const CUES_S7 = (): Cue[] => [
  {t: 22.5, kind: 'swish', gain: -7, dur: 0.3},                 // the line starts to bend (before "Scientists" 22.59)
  {t: 22.78, kind: 'reveal', gain: -8},                         // the model inflates around the route
  {t: B7.lbl1 - 0.02, kind: 'pop', gain: -6},                   // STOMACH MODEL
  {t: B7.lbl2 - 0.02, kind: 'pop', gain: -7},                   // LAB DEMO (2023)
  {t: B7.drop0 + 0.05, kind: 'drip', gain: -6},                 // the device drops in at the top
  {t: B7.magIn0, kind: 'swish', gain: -6, dur: 0.3},            // the magnet slides in outside the model
  {t: B7.field0, kind: 'mag_hum', gain: -2, dur: 1.45},         // field locks on, drags the device 23.95 -> 25.4
  {t: 24.15, kind: 'flow', gain: -7, dur: 1.1},                 // the device glides along the route
  {t: B7.arrive - 0.02, kind: 'mech_click', gain: -7, variant: 3}, // it stops beside the bead
  {t: B7.heat0, kind: 'heat_coil', gain: -6, dur: 0.45},        // warm-up
  {t: B7.melt0 + 0.02, kind: 'melt', gain: -3, dur: 0.6},       // melts around the bead (25.54)
  {t: B7.cool0, kind: 'cool', gain: -3, dur: 0.6},              // cools -> solid (25.90)
  {t: B7.spark, kind: 'mech_click', gain: -6, variant: 0},      // solid (26.12, before "objects" ends)
  {t: B7.pull0 - 0.02, kind: 'mag_hum', gain: -5, dur: 1.3},    // the magnet pulls it back out
  {t: B7.rev0 + 0.05, kind: 'swish', gain: -8, dur: 0.4},       // pull back (gap "objects" -> "from")
  {t: B7.future - 0.02, kind: 'reveal', gain: -5},              // FUTURE IDEA (the ghost torso)
];

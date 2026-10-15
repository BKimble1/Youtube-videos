// V3 arrival -> treatment -> recovery -> the question -> the loop bridge, in his street world with the same rig.
// The drone arrives as assistance and hovers beside him (a data link to the band, no healing light); the band
// treats: its case turns, the port presses, one blue pulse runs into the established vessel and up the arm to
// the heart, whose rhythm settles; the window closes as his fingers release and he breathes. The support hand
// loads, he pushes up to sitting and lifts the wrist: green replaces red, "Life Expectancy: 42 Years". Unease.
// The camera returns to the glass; one local "?" glitch turns into the red 00:02:14 of the opening, and the same
// push carries on through frames 0-7 of the next play (the cold open), so the loop is one camera move.
import React from 'react';
import {armFrame, DeviceView} from '../art/Device';
import {Drone, DronePose} from '../art/Drone';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {PortModule, SectionLayers, VesselTube} from '../art/Interior';
import {ChestCut, cutGeo, cutPathD} from '../art/Cutaway';
import {manJoints, ManPose, torsoPath} from '../art/Man';
import {Cam} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState3} from '../lib/device3';
import {limbGeo} from '../lib/limb';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, inv, lerp, mul, noise1, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B, TOTAL} from '../lib/timeline3';
import {dogAt, PROP} from './Opening';
import {BAND_C, LOCAL_PER_WORLD, PJ, R0, SEC_ROLL, SF, VP, VPX, W} from './Journey3';
import {Scene} from './Scene';
import {B4} from '../lib/beats4';
import {DRONE_S, droneBeacon, flightPitch, flyCam, flyDrone, hermite, rotorPhase, toScreenD} from './Dispatch';
import {SoftShadow} from '../lib/shade';
import {GROUND} from './StreetShots';

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

export const manAt = (f: number): ManPose => {
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
  const r = mixHand(r0, {...HAND_CLUTCH, curl: [0.3, 0.34, 0.38, 0.42], spread: 0.5}, ease(inv(B.release0, B.release0 + 20, f)));
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
const CUT0 = cutGeo(PJ.C, PJ.tc, PROP.s, 1);
const HEART0 = CUT0.loc(86, -46);
const MED = {x: 560, y: 1450};

/** The trunk-wipe truck (frames before B.arrive): one rightward move that starts at the flyover's camera speed (v0,
 *  world/frame) and decelerates into the B.arrive key (C1 there, whatever that key holds); the start zoom gives the
 *  drone the flyover's screen size (DRONE_S * z0), and y0 keeps the band under the caption lane while it holds. */
const TRUCK = {x0: -16, y0: 1250, z0: 1.25, v0: 30};

export const camAt = (g: number, wristW: V, headW: V): Cam => {
  if (g < B.release0 + 4) {
    const keys: [number, V, number][] = [
      [B4.arrive0, {x: TRUCK.x0, y: TRUCK.y0}, TRUCK.z0],
      [B.arrive, {x: 500, y: 1420}, 1.6],
      [B.act0 + 2, BAND_C, 6.5],
      [B.act0 + 14, SEC_VIEW, 11],
      [B.inject0 - 4, PORT_VIEW, 18],
      [B.inject0 + 10, PORT_VIEW, 20],
      [B.inject1 - 6, VES_VIEW, 15],
      [B.settleHeart0 + 6, add(mul(BAND_C, 0.4), mul(PJ.L.E, 0.6)), 3.6],
      [B.settleHeart0 + 18, add(mul(HEART0, 0.7), mul(CUT0.c, 0.3)), 4.8],
      [B.settleHeart1 - 4, HEART0, 5.2],
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
  // recovery and the question; the end pushes into the glass and keeps going through the loop point
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
  const secOn = g >= B.act0 + 4 && g < B.settleHeart0 + 4;
  const roll = g < B.act0 ? 0 : g < B.settleHeart0 + 4 ? SEC_ROLL * ease(inv(B.act0, B.act0 + 12, g)) : SEC_ROLL * (1 - ease(inv(B.settleHeart0 + 4, B.settleHeart0 + 16, g)));
  const open = ease(inv(B.act0 + 4, B.act0 + 16, g)) * (1 - ease(inv(B.settleHeart0, B.settleHeart0 + 6, g)));
  const portExt = clamp(inv(B.inject0 - 8, B.inject0, g)) * (1 - clamp(inv(B.inject1, B.inject1 + 10, g)));
  const treat = clamp(inv(B.inject0, B.inject0 + 16, g));
  const waveS = lerp(VP.entry, VP.entry + 5200, clamp(inv(B.inject0 + 10, B.settleHeart0 + 6, g)));
  const pxs = cam.z / LOCAL_PER_WORLD;
  const backdrop = clamp(inv(B.act0 + 2, B.act0 + 12, g)) * (1 - clamp(inv(B.settleHeart0, B.settleHeart0 + 10, g)));
  const tube = <VesselTube id={`${id}-vt`} path={VP} f={g} px={pxs} s0={VP.entry - 900} s1={99999} sensors={1} sensorFront={VP.entry + 4000} wave={g >= B.inject0 + 10 ? {s: waveS, a: 1} : undefined} dimFrom={waveS} />;
  // the see-through arm and the chest window while the wave climbs to the heart
  const xA = clamp(inv(B.settleHeart0 - 4, B.settleHeart0 + 6, g)) * (1 - clamp(inv(B.settleHeart1 + 4, B.release0 + 8, g)));
  const cutOpen = ease(inv(B.settleHeart0 + 2, B.settleHeart0 + 14, g)) * (1 - ease(inv(B.settleHeart1, B.release0 + 6, g)));
  const cg = cutGeo(j.C, j.tc, man.s, cutOpen);
  const chaos = 1 - ease(inv(B.settleHeart0 + 16, B.settleHeart1 - 2, g));
  const waveX = lerp(40, VPX.L - 40, ease(inv(B.settleHeart0, B.settleHeart0 + 22, g)));
  const chest = (key: string) => (
    <ChestCut id={`${id}-${key}`} f={g} g={cg} cam={cam} open={cutOpen} organ={1 - 0.5 * ease(inv(B.settleHeart0 + 20, B.settleHeart1, g))} chaos={chaos} organSense={0.8} heartSense={1} heartPos={cg.loc(86, -46)} heartSize={27 * man.s} bodyD={torsoPath(man)} />
  );
  const limbD = limbGeo(j.L.S, j.L.E, j.L.W, 29 * man.s, 23.5 * man.s, 17 * man.s).d;
  const A = armFrame(j.L.E, j.L.W, R0.rE, R0.rW);
  const u0 = A.L - (1.75 + 0.62) * A.rW;
  const bandCut = (() => {
    const a = add(A.E, mul(A.u, u0));
    const b = add(A.E, mul(A.u, A.L + 400));
    const n = mul(A.n, 400);
    return `M${fmt(a.x + n.x)},${fmt(a.y + n.y)} L${fmt(b.x + n.x)},${fmt(b.y + n.y)} L${fmt(b.x - n.x)},${fmt(b.y - n.y)} L${fmt(a.x - n.x)},${fmt(a.y - n.y)} Z`;
  })();
  const vline = `M${VPX.pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`;
  const overAll =
    xA > 0.01 ? (
      <g>
        <defs>
          <mask id={`${id}-lc`}>
            <path d={limbD} fill="#FFF" />
            <path d={bandCut} fill="#000" />
          </mask>
          <clipPath id={`${id}-cc`}>
            <path d={cutPathD(cg)} />
          </clipPath>
        </defs>
        <g mask={`url(#${id}-lc)`} opacity={xA}>
          {cutOpen > 0.01 && (
            <g clipPath={`url(#${id}-cc)`}>
              {chest('cx2')}
              <path d={limbD} fill="#F7D3BD" opacity={0.14} />
            </g>
          )}
          <g transform={SF.matrix}>
            <path d={vline} fill="none" stroke="#C9566A" strokeWidth={560} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />
            <path d={vline} fill="none" stroke="#E07A88" strokeWidth={300} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
            <VesselTube id={`${id}-xt`} path={VPX} f={g} px={pxs} s0={0} s1={99999} sensors={1} sensorFront={VPX.L} wave={{s: waveX, a: 1}} dimFrom={waveX} />
            {/* the treatment pulse climbing the arm toward the heart */}
            {[0, 90, 180, 270].map((d, i) => {
              const q = VPX.at(Math.max(0, waveX - d));
              return <circle key={i} cx={fmt(q.p.x)} cy={fmt(q.p.y)} r={fmt(i ? 120 - i * 22 : 190)} fill={i ? '#7FE3FF' : '#39C6F4'} opacity={i ? 0.5 - i * 0.12 : 0.35} />;
            })}
            <circle cx={fmt(VPX.at(waveX).p.x)} cy={fmt(VPX.at(waveX).p.y)} r={70} fill="#E4FBFF" />
          </g>
        </g>
      </g>
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
      afterRightArm={cutOpen > 0.01 ? chest('cx') : null}
      overAll={overAll}
      under={showDrone && shK > 0.01 ? <SoftShadow id={`${id}-drs`} c={{x: dp.x + 40, y: GROUND + 6}} rx={190 * dp.s * shK} ry={24 * dp.s * shK} alpha={0.16 * shK} /> : null}
      extra={
        <g>
          {showDrone && <Drone id={`${id}-dr`} p={dp} blur={1} />}
          {/* the drone has found him: a thin data link dropping almost vertically to the band (no light on him) */}
          {linkA > 0.01 && (
            <g opacity={fmt(linkA)}>
              <path d={`M${fmt(linkFrom.x)},${fmt(linkFrom.y)} L${fmt(bandW.x)},${fmt(bandW.y)}`} stroke={PAL.signal} strokeWidth={3} strokeDasharray="6 10" opacity={0.8} />
              <circle cx={fmt(bandW.x)} cy={fmt(bandW.y)} r={fmt(22 + 8 * Math.sin(g * 0.5))} fill="none" stroke={PAL.signal} strokeWidth={3} />
            </g>
          )}
        </g>
      }
    />
  );
};

export {EXPR_UNEASY, easeIn};

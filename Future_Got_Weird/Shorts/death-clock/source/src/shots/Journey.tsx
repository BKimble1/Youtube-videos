// V2 opening through the help alert (0 s -> "seek help."), as ONE continuous world: the street, the same rig,
// the same left forearm and band. The camera follows the fall, travels down the attached arm to the device,
// tips round the wrist to the band's side, opens a section, follows the port's sensor stream into the vessel,
// rides with one hero sensor, then pulls back out of the SAME arm into an x-ray of his arm and chest, moves to
// one organ and the heart, follows the heart's signal back down the arm and lands on the band's red warning.
// Two invisible switches happen deep inside the vessel (section view -> front-view x-ray), where only the lumen
// fills the frame; everything else is one camera path.
import React from 'react';
import {DeviceView} from '../art/Device';
import {EXPR_GASP, EXPR_PAIN, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_CLUTCH, HAND_LIMP, mixHand} from '../art/Hand';
import {ArmXray, arc, Arc, ChestXray, heartCenter, Hero, PortModule, SEC, secFrame, SecFrame, SectionLayers, VesselTube, vesselPath, WallCell} from '../art/Interior';
import {foreRadii, manJoints, ManPose, torsoPath} from '../art/Man';
import {armFrame, ArmFrame} from '../art/Device';
import {Cam} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState} from '../lib/device';
import {SKey, spline, splineRec} from '../lib/motion';
import {add, clamp, easeInOut, easeOut, inv, lerp, mul, noise1, sub, V} from '../lib/math';
import {B} from '../lib/timeline';
import {fallState} from './StreetShots';
import {Scene} from './Scene';

const ease = easeInOut;
const expLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const blinkAt = (f: number, at: number[]) => Math.max(0, ...at.map((b) => 1 - Math.abs(f - b) / 3));

// ---------------------------------------------------------------- geometry of the lying pose (static during the section)
export const LIE = fallState(B.fallEnd);
export const LJ = manJoints(LIE.man);
export const R0 = foreRadii(LIE.man.s);
export const LIE_ARM: ArmFrame = armFrame(LJ.L.E, LJ.L.W, R0.rE, R0.rW);
/** The case turns to the arm's screen-upper side in the section (n points down for this arm). */
export const SIGMA: 1 | -1 = LIE_ARM.n.y > 0 ? -1 : 1;
export const SF: SecFrame = secFrame(LIE_ARM, SIGMA);
/** Section roll that puts the case on the upper edge. */
export const SEC_ROLL = 90 * SIGMA;
const HEART = heartCenter(LJ.C, LJ.tc, LIE.man.s);
const torsoPt = (u: number, v: number) => {
  const tc = LJ.tc;
  const up = {x: -Math.sin((tc * Math.PI) / 180), y: -Math.cos((tc * Math.PI) / 180)};
  const px = {x: Math.cos((tc * Math.PI) / 180), y: -Math.sin((tc * Math.PI) / 180)};
  return add(LJ.C, add(mul(up, u * LIE.man.s), mul(px, v * LIE.man.s)));
};
const LIVER = torsoPt(-48, 22);
/** Forearm vessel (section) and the same vessel continued through the elbow, upper arm and chest to the heart. */
export const VP = vesselPath(SF);
export const VPX = vesselPath(SF, [
  add(LJ.L.E, mul(sub(LJ.L.S, LJ.L.E), 0.1)),
  add(LJ.L.E, mul(sub(LJ.L.S, LJ.L.E), 0.55)),
  add(LJ.L.S, mul(sub(LJ.L.E, LJ.L.S), 0.1)),
  add(mul(add(LJ.L.S, HEART), 0.5), {x: 0, y: -10}),
  HEART,
]);
export const W = (X: number, D: number) => SF.toWorld(X, D);
export const LOCAL_PER_WORLD = SF.k;

// ---------------------------------------------------------------- the hero sensor's ride (arc length along VP)
const E0 = VP.entry; // arc length of the entry point under the port
const S_TARGET = E0 + 1720; // the wall cell that changes state
const heroS = (f: number) => E0 + heroS0(f);
const heroS0 = (f: number) => {
  if (f < B.heroRing - 14) return lerp(-60, 40, inv(B.stream1 - 10, B.heroRing - 14, f));
  if (f < B.dive1) return lerp(40, 330, ease(inv(B.heroRing - 14, B.dive1, f)) * 0.6 + inv(B.heroRing - 14, B.dive1, f) * 0.4);
  if (f < B.wall0) return lerp(330, 1500, inv(B.dive1, B.wall0, f));
  if (f < B.decay - 2) return lerp(1500, 1690, easeOut(inv(B.wall0, B.decay - 2, f)));
  return 1690 + 6 * Math.sin((f - B.decay) * 0.08);
};
const WALL_SIDE: 1 | -1 = 1;
const heroL = (f: number) => {
  const wander = 26 * Math.sin(f * 0.05) + 10 * noise1(f * 0.04, 3);
  const toWall = easeInOut(inv(B.wall0 - 4, B.decay - 4, f));
  return lerp(wander, WALL_SIDE * (SEC.rho - 70), toWall);
};
const hero = (f: number): Hero => ({
  s: heroS(f),
  l: heroL(f),
  r: 22,
  ring: clamp(inv(B.heroRing, B.heroRing + 10, f)),
  signal: clamp(inv(B.signal0, B.signal1, f)),
  signalColor: '#FFB23E',
});
const heroWorld = (f: number) => {
  const q = VP.at(heroS(f));
  const p = add(q.p, mul(q.nrm, heroL(f)));
  return W(p.x, p.y);
};
/** Camera roll that turns the flow direction to screen-up, smoothed over the vessel's bends. */
const travelRoll = (s: number) => {
  const a = VP.at(Math.max(0, s - 260)).p;
  const b = VP.at(s + 260).p;
  const wa = W(a.x, a.y);
  const wb = W(b.x, b.y);
  const ang = (Math.atan2(wb.y - wa.y, wb.x - wa.x) * 180) / Math.PI;
  return -90 - ang;
};

// ---------------------------------------------------------------- the man over time
export const HAND_UP = {x: 268, y: 1826};
const breathEnv = (f: number) => clamp(1 - inv(B.tip0 - 8, B.tip0, f) + inv(B.pull1 - 6, B.pull1 + 6, f));

const CHAIN: SKey<ManPose>[] = [
  [B.eyes0, {...LIE.man}, 'stop'],
  // his head lifts a little toward the wrist; the hand comes up off the grass a touch as the wrist turns to him
  [B.turn0 + 10, {...LIE.man, neck: -8, lWx: HAND_UP.x - 4, lWy: HAND_UP.y + 10, lWr: 6}],
  [B.turn1, {...LIE.man, neck: -5, lWx: HAND_UP.x, lWy: HAND_UP.y, lWr: 4}, 'stop'],
];

export const lyingMan = (f: number): ManPose => {
  const env = breathEnv(f);
  const br = 0.5 * Math.sin(f * 0.5) * env;
  let m: ManPose = {...LIE.man, breath: 0.5 + br, torso: LIE.man.torso + br * 1.2};
  if (f >= B.eyes0) {
    const c = splineRec(f, CHAIN);
    m = {...c, breath: m.breath, torso: c.torso + br * 1.2};
  }
  return m;
};

const lyingExpr = (f: number): Expr => {
  const pained = mixExpr(EXPR_WINCE, EXPR_PAIN, 0.5 + 0.5 * Math.sin(f * 0.13));
  if (f < B.eyes0) return pained;
  // eyes open and find the screen: fear, gaze down toward the band
  const look = ease(inv(B.eyes0, B.eyes0 + 10, f));
  // eyes snap open (straight ahead), then drop to the band (down on screen = left/down in his rolled head frame)
  const down = ease(inv(B.eyes0 + 10, B.eyes0 + 20, f));
  const gaze: Expr = {...EXPR_GASP, gx: lerp(0, -0.85, down), gy: lerp(0, 0.45, down), pupil: 0.55};
  const tense = mixExpr(gaze, {...EXPR_PAIN, gx: -0.85, gy: 0.45, shut: 0, lid: 0.12, squint: 0.2}, 0.35 + 0.25 * Math.sin(f * 0.2));
  return mixExpr(pained, f < B.help0 ? gaze : tense, look);
};

// ---------------------------------------------------------------- camera
export const BAND_C = add(LJ.L.W, mul(LJ.L.foreDir, -1.75 * R0.rW));
export const SEC_VIEW = W(SF.Xp - 760, 420);
export const PORT_VIEW = W(SF.Xp - 80, 160);
export const STREAM_VIEW = W(SF.Xp - 200, 380);

const camA = (f: number): Cam => {
  // fall (follow the wrist), travel down the arm, the macro, the tip and the injection (no camera roll)
  const keysX: [number, number, ('auto' | 'stop' | 'hit')?][] = [
    [0, 620], [24, 600], [40, 470], [B.fallEnd, 400], [B.medium, 350], [B.medium + 7, 430], [B.macro, BAND_C.x],
    [B.tip0, BAND_C.x + 4], [B.tip1, SEC_VIEW.x], [B.port0, SEC_VIEW.x - 20], [B.port1 + 4, PORT_VIEW.x], [B.stream1, STREAM_VIEW.x], [B.dive0 + 2, STREAM_VIEW.x],
  ];
  const keysY: [number, number, ('auto' | 'stop' | 'hit')?][] = [
    [0, 1084], [24, 1130], [40, 1420], [B.fallEnd, 1700], [B.medium, 1745], [B.medium + 7, 1800], [B.macro, BAND_C.y],
    [B.tip0, BAND_C.y], [B.tip1, SEC_VIEW.y], [B.port0, SEC_VIEW.y], [B.port1 + 4, PORT_VIEW.y], [B.stream1, STREAM_VIEW.y], [B.dive0 + 2, STREAM_VIEW.y],
  ];
  const keysZ: [number, number, ('auto' | 'stop' | 'hit')?][] = [
    [0, 1.1], [24, 1.14], [40, 1.16], [B.fallEnd, 1.5], [B.medium, 2.7], [B.medium + 7, 4.4], [B.macro, 8.6],
    [B.tip0, 9.0], [B.tip1, 14], [B.port0, 17], [B.port1 + 4, 30], [B.stream1, 40], [B.dive0 + 2, 42],
  ];
  return {x: spline(f, keysX), y: spline(f, keysY), z: spline(f, keysZ)};
};

const Z_RIDE = 4.0 * LOCAL_PER_WORLD; // 4 px per section unit inside the vessel
const rideCam = (f: number): Cam => {
  const h = heroWorld(f);
  const roll = travelRoll(heroS(f));
  // keep the hero a little below centre so the way ahead is visible
  const lead = 150 / Z_RIDE;
  const q = VP.at(heroS(f) + 1);
  const dir = W(q.p.x, q.p.y);
  const here = W(VP.at(heroS(f)).p.x, VP.at(heroS(f)).p.y);
  const tdir = sub(dir, here);
  const tl = Math.hypot(tdir.x, tdir.y) || 1;
  const fwd = {x: tdir.x / tl, y: tdir.y / tl};
  const zz = Z_RIDE * (1 + 0.12 * ease(inv(B.wall0, B.decay, f)) - 0.08 * ease(inv(B.signal0, B.signal1, f)));
  return {x: h.x + fwd.x * lead, y: h.y + fwd.y * lead, z: zz, roll};
};

const MED_X = {x: 360, y: 1700};
const pullCam = (f: number): Cam => {
  const t = inv(B.pull0, B.pull1, f);
  const e = ease(t);
  const a = rideCam(B.pull0);
  const z = expLerp(a.z, 2.0, e);
  // the centre stays on the vessel while close, then travels up the arm to frame his upper body
  const k = Math.pow(e, 2.2);
  const viaElbow = add(mul(LJ.L.E, 0.5), mul(MED_X, 0.5));
  const c = k < 0.5 ? add(mul({x: a.x, y: a.y}, 1 - k * 2), mul(viaElbow, k * 2)) : add(mul(viaElbow, 2 - k * 2), mul(MED_X, k * 2 - 1));
  return {x: c.x, y: c.y, z, roll: lerp(a.roll ?? 0, 0, ease(clamp(t * 1.3)))};
};

const diveCam = (f: number): Cam => {
  const a = camA(B.dive0 + 2);
  const b = rideCam(B.dive1);
  const t = inv(B.dive0 + 2, B.dive1, f);
  const e = ease(t);
  const k = Math.pow(e, 0.6);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: expLerp(a.z, b.z, e), roll: lerp(0, b.roll ?? 0, ease(clamp((t - 0.15) / 0.85)))};
};

const RAISED = (() => {
  const j = manJoints(CHAIN[CHAIN.length - 1][1]);
  return add(j.L.W, mul(j.L.foreDir, -1.75 * R0.rW));
})();
const TWO_SHOT = {x: (LJ.head.x + RAISED.x) / 2 + 10, y: (LJ.head.y + RAISED.y) / 2 + 20};
/** his eyes at the top of frame, the band below: the chain and the help alert */
const TWO_SHOT2 = {x: 290, y: 1790};

const camB = (f: number): Cam => {
  // organ, heart, the signal back down the arm, the band's warning, the chain
  const p0 = pullCam(B.pull1);
  const seconds = add(BAND_C, mul(LIE_ARM.u, -0.42 * R0.rW)); // the seconds digits (UI is flipped: +x is screen-right)
  const keys: [number, V, number][] = [
    [B.pull1, {x: p0.x, y: p0.y}, p0.z],
    [B.organ0 + 6, add(mul(LIVER, 0.6), mul(MED_X, 0.4)), 3.0],
    [B.fail + 8, LIVER, 4.4],
    [B.heart0 + 4, add(mul(LIVER, 0.4), mul(HEART, 0.6)), 4.6],
    [B.heart1, HEART, 6.4],
    [B.sig0, HEART, 7.0],
    [B.sig0 + 12, add(mul(HEART, 0.4), mul(LJ.L.E, 0.6)), 4.2],
    [B.sig1 - 4, BAND_C, 9.0],
    [B.sig1 + 6, BAND_C, 11.0],
    [B.exact0, BAND_C, 11.6],
    [B.exact1 - 6, seconds, 14.5],
    [B.eyes0 - 1, seconds, 14.2],
  ];
  // after "second.": a cut to his face as his eyes snap open, then the camera follows his gaze down to the wrist
  if (f >= B.eyes0) {
    const face = add(LJ.head, {x: 16, y: 110});
    const wrist = add(RAISED, {x: 10, y: -30});
    const k2: [number, V, number][] = [
      [B.eyes0, face, 3.0],
      [B.eyes0 + 12, face, 3.1],
      [B.turn0 + 14, TWO_SHOT2, 3.8],
      [B.clench1, TWO_SHOT2, 4.0],
      [B.alert, add(TWO_SHOT2, {x: 4, y: 10}), 4.3],
      [B.map0, add(wrist, {x: 4, y: 6}), 6.4],
    ];
    return {
      x: spline(f, k2.map(([t, p]) => [t, p.x])),
      y: spline(f, k2.map(([t, p]) => [t, p.y])),
      z: Math.exp(spline(f, k2.map(([t, , z]) => [t, Math.log(z)]))),
      roll: 0,
    };
  }
  const sx = spline(f, keys.map(([t, p]) => [t, p.x]));
  const sy = spline(f, keys.map(([t, p]) => [t, p.y]));
  const sz = Math.exp(spline(f, keys.map(([t, , z]) => [t, Math.log(z)])));
  return {x: sx, y: sy, z: sz, roll: 0};
};

/** The band on his wrist (world) at frame f. */
export const bandWorldAt = (f: number) => {
  const j = manJoints(f < B.fallEnd ? fallState(f).man : lyingMan(f));
  return add(j.L.W, mul(j.L.foreDir, -1.75 * R0.rW));
};

export const journeyCam = (f: number): Cam => {
  if (f < B.dive0 + 2) return {...camA(f), roll: 0};
  if (f < B.dive1) return diveCam(f);
  if (f < B.pull0) return rideCam(f);
  if (f < B.pull1) return pullCam(f);
  return camB(f);
};

// ---------------------------------------------------------------- render
const SWITCH = B.pull0 + 2; // section view -> x-ray (deep inside the vessel)

export type JourneyFrame = {node: React.ReactNode; cam: Cam};

export const Journey: React.FC<{id: string; f: number}> = ({id, f}) => {
  const cam = journeyCam(f);
  const fallen = f >= B.fallEnd;
  const base = fallen ? null : fallState(f);
  const man = fallen ? lyingMan(f) : base!.man;
  const j = manJoints(man);
  const expr = fallen ? lyingExpr(f) : base!.expr;
  const twitch = f >= B.timer && f < B.eyes0 ? 0.5 + 0.5 * Math.sin((f - B.timer) * 0.35) * Math.sin((f - B.timer) * 0.09) : 0;
  const lHand = fallen
    ? f < B.clench0
      ? mixHand(HAND_LIMP, {...HAND_LIMP, curl: [0.5, 0.56, 0.6, 0.64], thumbCurl: 0.75}, twitch)
      : mixHand(HAND_LIMP, {...HAND_CLUTCH, curl: [0.62, 0.68, 0.72, 0.76]}, ease(inv(B.clench0, B.clench1, f)))
    : base!.lHand;
  const rHand = fallen ? mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.55, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3)) : base!.rHand;
  const dog = fallen ? {...LIE.dog, head: LIE.dog.head + 4 * Math.sin(f * 0.06), tail: LIE.dog.tail + 3 * Math.sin(f * 0.21)} : base!.dog;
  const hairSway = fallen ? 0 : base!.hairSway ?? 0;

  // section / x-ray modes
  const sectionMode = f >= B.tip0 - 2 && f < SWITCH;
  const xrayMode = f >= SWITCH && f < B.sig1 + 10;
  const backdrop = clamp(inv(B.tip0 + 2, B.tip0 + 16, f)) * (f < SWITCH ? 1 : 1 - clamp(inv(B.pull0 + 10, B.pull0 + 28, f)));
  const roll =
    f < B.tip0 ? 0 : f < SWITCH ? SEC_ROLL * ease(inv(B.tip0, B.tip1, f)) : f < B.turn0 ? 0 : 0.42 * SEC_ROLL * ease(inv(B.turn0, B.turn1, f));
  const portExt = clamp(inv(B.port0, B.port1, f)) * (1 - clamp(inv(B.retract0, B.retract1, f)));
  const openAmt = ease(inv(B.open0, B.open1, f));
  const px = cam.z / LOCAL_PER_WORLD;
  const hs = heroS(f);
  const inRide = f >= B.dive0 && f < SWITCH + 40;
  const cells: WallCell[] = [-640, -320, 0, 330, 660].map((ds, i) => ({
    s: S_TARGET + ds,
    side: WALL_SIDE,
    decay: ds === 0 ? clamp(inv(B.decay - 2, B.decay + 12, f)) : 0,
    scan: ds === 0 ? clamp(inv(B.wall0 + 10, B.decay, f)) * (1 - 0.5 * clamp(inv(B.signal1, B.signal1 + 10, f))) : 0,
  }));
  const sensorFront = E0 + Math.max(0, (f - (B.stream0 + 34)) * 22);
  const tubeCommon = {
    f,
    px,
    sensors: clamp(inv(B.stream0 + 30, B.stream0 + 40, f)),
    sensorFront,
    cells,
    s0: inRide ? hs - 900 : E0 - 900,
    s1: inRide ? hs + 1400 : 99999,
  };
  const tubeSection = <VesselTube id={`${id}-vt`} path={VP} {...tubeCommon} hero={f >= B.stream1 - 10 ? hero(f) : undefined} occluder={{s: heroS(B.dive1 + 44) + (f - (B.dive1 + 44)) * 12, l: 14}} />;
  // x-ray: same vessel continued to the heart; organ and heart states; the warning pulse back to the band
  const pulseS = lerp(VPX.L - 40, 40, ease(inv(B.sig0, B.sig1, f)));
  const xTube = (key: string) => (
    <VesselTube
      id={`${id}-${key}`}
      path={VPX}
      {...tubeCommon}
      s1={f < SWITCH + 30 ? hs + 1400 : 99999}
      hero={f < B.pull1 ? hero(f) : undefined}
      pulse={f >= B.sig0 && f < B.sig1 + 4 ? {s: pulseS, a: 1} : undefined}
    />
  );
  const xA = xrayMode ? 1 - clamp(inv(B.sig1 - 2, B.sig1 + 8, f)) : 0;
  const armReach = xrayMode ? 1 - clamp(inv(B.sig0 + 14, B.sig1, f)) : 0;
  const chestA = xrayMode ? clamp(inv(B.pull0 + 18, B.pull1 - 4, f)) * (1 - clamp(inv(B.sig0 + 4, B.sig0 + 16, f))) : 0;
  const chaos = clamp(inv(B.lethal - 2, B.lethal + 10, f));

  const dev: DeviceView = {
    screen: deviceState(f),
    roll,
    yaw: 14,
    flip: true,
    caseOpen: sectionMode ? openAmt : 0,
    caseCut: (A, c) => {
      void A;
      void c;
      return <g transform={SF.matrix}><PortModule id={`${id}-pm`} sf={SF} f={f} ext={portExt} reservoir={1 - 0.4 * clamp(inv(B.stream0, B.stream1, f))} blue={0} /></g>;
    },
    inArm: (A) => {
      void A;
      if (sectionMode)
        return (
          <g transform={SF.matrix}>
            <SectionLayers id={`${id}-sec`} sf={SF} f={f} open={openAmt} tube={tubeSection} stream={clamp(inv(B.stream0, B.stream1, f))} streamA={clamp(inv(B.stream0, B.stream0 + 4, f)) * (1 - clamp(inv(B.dive1 - 10, B.dive1, f)))} />
          </g>
        );
      if (xrayMode) return <g transform={SF.matrix}><ArmXray id={`${id}-ax`} sf={SF} a={xA} reach={armReach} tube={xTube('xa')} /></g>;
      return null;
    },
  };
  const torsoD = torsoPath(man);
  const chest = (key: string, clipArm: boolean) =>
    xrayMode && chestA > 0.01 ? (
      <ChestXray
        id={`${id}-${key}`}
        f={f}
        torsoD={clipArm ? 'M0,0 Z' : torsoD}
        arm={clipArm ? {a: j.L.S, b: j.L.E, r: 33 * man.s} : {a: {x: 0, y: 0}, b: {x: 0, y: 0}, r: 0}}
        organs={!clipArm}
        C={j.C}
        tc={j.tc}
        s={man.s}
        a={chestA}
        organ={clamp(inv(B.fail - 6, B.fail + 8, f))}
        chaos={chaos}
        organSense={clamp(inv(B.organ0, B.organ0 + 10, f))}
        heartSense={clamp(inv(B.heart0, B.heart0 + 10, f))}
        tube={xTube(`${key}t`)}
        secMatrix={SF.matrix}
      />
    ) : null;
  return (
    <Scene
      id={id}
      cam={cam}
      man={man}
      expr={expr}
      blink={fallen ? blinkAt(f, [B.eyes0 + 30, B.help0 + 40]) : 0}
      lHand={lHand}
      rHand={rHand}
      dog={dog}
      hairSway={hairSway}
      dev={dev}
      backdrop={backdrop}
      backdropC={sectionMode ? W(SF.Xp - 600, 400) : BAND_C}
      afterRightArm={chest('cx', false)}
      beforeLeftForearm={chest('ax2', true)}
      leash={!xrayMode}
    />
  );
};

export {PAL};

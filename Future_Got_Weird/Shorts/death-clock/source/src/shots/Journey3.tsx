// V3, from the low three-quarter collapse to the transmission pulse (0.27 s -> "Every second matters."), one
// world and one camera path: the supported collapse, the camera follows the bracing wrist into the band, the band
// buzzes and the fingers dig in, the camera tilts round the case to its underside, a clean cut edge sweeps the
// skin open, the port extends, the sensor stream enters the vessel, the camera follows one hero sensor across the
// near wall, past a red cell, round a bend to a changed cell, scans it, and follows its signals back up the SAME
// arm (now seen through) to a cutaway in his chest: the liver dims, the heart turns irregular, and its warning
// races down the arm into the red screen. Then the critical seconds and the transmission pulse.
// One invisible switch happens deep inside the vessel (section view -> see-through arm), where only the lumen
// fills the frame; both draw the vessel from the same path and the same arc-length generator.
import React from 'react';
import {armFrame, DeviceView} from '../art/Device';
import {EXPR_GASP, EXPR_PAIN, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HandPose, mixHand} from '../art/Hand';
import {Hero, PortModule, SEC, secFrame, SecFrame, SectionLayers, VesselTube, vesselPath, WallCell, TissueFill} from '../art/Interior';
import {ChestCut, CutEdge, cutGeo, cutPathD} from '../art/Cutaway';
import {foreRadii, manJoints, ManPose, torsoPath} from '../art/Man';
import {Cam} from '../lib/camera';
import {deviceState3} from '../lib/device3';
import {limbGeo} from '../lib/limb';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeInOut, easeOut, fmt, inv, lerp, mul, noise1, sub, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B} from '../lib/timeline3';
import {collapseCam, collapseState, dogAt, PROP} from './Opening';
import {Scene} from './Scene';

const ease = easeInOut;
const expLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const zKeys = (f: number, keys: [number, number][]) => Math.exp(spline(f, keys.map(([t, z]) => [t, Math.log(z)])));

// ---------------------------------------------------------------- the supported pose (held still in the section)
export const PJ = manJoints(PROP);
export const R0 = foreRadii(PROP.s);
export const P_ARM = armFrame(PJ.L.E, PJ.L.W, R0.rE, R0.rW);
/** the case turns to the arm's screen-left edge, away from his body */
export const SIGMA: 1 | -1 = P_ARM.n.x > 0 ? -1 : 1;
export const SF: SecFrame = secFrame(P_ARM, SIGMA);
export const SEC_ROLL = 90 * SIGMA;
export const W = (X: number, D: number) => SF.toWorld(X, D);
export const LOCAL_PER_WORLD = SF.k;
export const BAND_C = add(PJ.L.W, mul(PJ.L.foreDir, -1.75 * R0.rW));
const CUT = cutGeo(PJ.C, PJ.tc, PROP.s, 1);
export const HEART = CUT.loc(86, -46);
const LIVER = CUT.loc(26, -30);

/** forearm vessel (section) and the same vessel continued up the arm and into the chest to the heart */
export const VP = vesselPath(SF);
export const VPX = vesselPath(SF, [
  add(PJ.L.E, mul(sub(PJ.L.S, PJ.L.E), 0.08)),
  add(PJ.L.E, mul(sub(PJ.L.S, PJ.L.E), 0.5)),
  add(PJ.L.S, mul(sub(PJ.L.E, PJ.L.S), 0.12)),
  add(mul(add(PJ.L.S, HEART), 0.5), {x: 6, y: -8}),
  HEART,
]);

// ---------------------------------------------------------------- the hero sensor's ride (arc length along VP)
const E0 = VP.entry;
const S_TARGET = E0 + 1660; // the wall cell that changes state
const heroS = (f: number) =>
  E0 +
  spline(f, [
    [B.heroRing - 12, -50],
    [B.dive0, 30],
    [B.dive1, 340],
    [B.pass0 + 8, 640],
    [B.pass1, 1380],
    [B.wall0 + 6, 1520],
    [B.decay - 4, 1630, 'stop'],
    [B.signal1, 1640, 'stop'],
    [B.pull1, 1650],
  ]);
const WALL_SIDE: 1 | -1 = 1;
const heroL = (f: number) => {
  const wander = 30 * Math.sin(f * 0.07) + 14 * noise1(f * 0.05, 3);
  const toWall = ease(inv(B.wall0 - 4, B.decay - 6, f));
  return lerp(wander, WALL_SIDE * (SEC.rho - 70), toWall);
};
const hero = (f: number): Hero => ({
  s: heroS(f),
  l: heroL(f),
  r: 22,
  ring: clamp(inv(B.heroRing, B.heroRing + 8, f)),
  signal: clamp(inv(B.signal0, B.signal0 + 8, f)),
  signalColor: '#FFB23E',
});
const onVP = (path: typeof VP, s: number, l = 0) => {
  const q = path.at(s);
  const p = add(q.p, mul(q.nrm, l));
  return W(p.x, p.y);
};
const heroWorld = (f: number) => onVP(VP, heroS(f), heroL(f));
/** camera roll that turns the flow to screen-up, smoothed over the bends */
const travelRoll = (s: number) => {
  const wa = onVP(VP, Math.max(0, s - 260));
  const wb = onVP(VP, s + 260);
  return -90 - (Math.atan2(wb.y - wa.y, wb.x - wa.x) * 180) / Math.PI;
};
/** the signals: four amber pulses leave the hero and run up the vessel ahead of the camera */
const SIG_V = 34; // local units per frame
export const signalS = (f: number, k: number) => heroS(B.signal0) + (f - (B.signal0 + 6 + k * 5)) * SIG_V * (1 + 0.6 * ease(inv(B.pull0, B.pull1, f)));

// ---------------------------------------------------------------- the man over time
/** breathing is held while the camera is inside the arm (the section frame is built on the still pose) */
const breathEnv = (f: number) => clamp(1 - inv(B.tip0 - 10, B.tip0, f) + inv(B.sig1, B.sig1 + 20, f));

const CRIT_KEYS: SKey<ManPose>[] = [
  [B.count0, {...PROP}, 'stop'],
  // the critical seconds: his head lifts toward the street, then drops back to the band
  [B.crit0 + 6, {...PROP, neck: -20, chest: 31}],
  [B.crit0 + 24, {...PROP, neck: -24, chest: 30}],
  [B.tx0 + 4, {...PROP, neck: -10, chest: 33}],
  [B.map0, {...PROP, neck: -14, chest: 32}],
];

export const propMan = (f: number): ManPose => {
  const env = breathEnv(f);
  const br = Math.sin(f * 0.21);
  let m: ManPose = f >= B.count0 ? splineRec(f, CRIT_KEYS) : {...PROP};
  m = {...m, breath: 0.5 + 0.5 * br * env, torso: m.torso + 0.6 * br * env, chest: m.chest + 1.4 * Math.sin(f * 0.21 + 0.6) * env};
  // the organ phase: his free hand grips lower, over the stomach, clear of the window in his chest
  const low = clamp(inv(B.pull0, B.organ0, f)) * (1 - clamp(inv(B.count0, B.count0 + 12, f)));
  return {...m, rTu: lerp(m.rTu, -168, low), rTv: lerp(m.rTv, -26, low)};
};

export const manAt = (f: number): ManPose => (f < B.settle ? collapseState(f).man : propMan(f));

const pained = (f: number) => mixExpr(EXPR_WINCE, EXPR_PAIN, 0.5 + 0.5 * Math.sin(f * 0.13));
const exprAt = (f: number): Expr => {
  if (f < B.settle) return collapseState(f).expr;
  const atBand: Expr = {...EXPR_PAIN, shut: 0, lid: 0.18, squint: 0.25, gx: 0.55, gy: 0.75, pupil: 0.7};
  if (f < B.crit0) return mixExpr(collapseState(B.settle).expr, mixExpr(pained(f), atBand, 0.55), ease(inv(B.settle, B.settle + 14, f)));
  // critical seconds: eyes find the band, lift to the street (where help would come from), drop back
  const street: Expr = {...EXPR_GASP, gx: -0.75, gy: -0.45, pupil: 0.6, open: 0.32};
  const k = ease(inv(B.crit0 + 4, B.crit0 + 12, f)) * (1 - ease(inv(B.tx0 - 6, B.tx0 + 2, f)));
  return mixExpr(atBand, street, k);
};

const BUZZ: [number, number][] = [
  [B.buzz0, B.buzz0 + 9],
  [B.buzz0 + 16, B.buzz0 + 25],
  [B.count0 + 4, B.count0 + 12],
  [B.crit0 + 2, B.crit0 + 11],
];
/** band vibration: short buzzes, a high-frequency roll jitter of the case */
export const buzz = (f: number) => BUZZ.reduce((a, [s, e]) => a + (f >= s && f < e ? Math.sin(((f - s) / (e - s)) * Math.PI) : 0), 0);

const handAt = (f: number): {l: HandPose; r: HandPose} => {
  const st = f < B.settle ? collapseState(f) : null;
  const press = clamp(inv(B.tense0, B.tense0 + 10, f)) * (1 - 0.6 * clamp(inv(B.tip0, B.tip0 + 20, f))) + clamp(inv(B.crit0, B.crit0 + 8, f)) * (1 - clamp(inv(B.map0 - 4, B.map0, f)));
  const planted = {...HAND_BRACE, curl: [0.16, 0.16, 0.2, 0.22] as HandPose['curl'], spread: 0.95};
  const dig = {...HAND_BRACE, curl: [0.34, 0.38, 0.4, 0.42] as HandPose['curl'], spread: 0.8, thumbCurl: 0.35};
  const l = st ? st.lHand : mixHand(planted, dig, clamp(press));
  const r = st ? st.rHand : mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.56, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3));
  return {l, r};
};


// ---------------------------------------------------------------- camera
export const SEC_VIEW = W(SF.Xp - 760, 420);
export const PORT_VIEW = W(SF.Xp + 520, 160);
export const STREAM_VIEW = W(SF.Xp + 420, 380);

const camOpen = (f: number): Cam => {
  if (f < 46) return {...collapseCam(f), roll: 0};
  const c46 = collapseCam(46);
  const xs: [number, number][] = [[46, c46.x], [58, lerp(c46.x, BAND_C.x, 0.45)], [B.macro, BAND_C.x], [B.tip0, BAND_C.x + 2], [B.tip1, SEC_VIEW.x], [B.open0, SEC_VIEW.x], [B.port0 + 6, PORT_VIEW.x], [B.stream0 + 10, PORT_VIEW.x], [B.heroRing, STREAM_VIEW.x], [B.dive0 + 2, STREAM_VIEW.x]];
  const ys: [number, number][] = [[46, c46.y], [58, lerp(c46.y, BAND_C.y, 0.5)], [B.macro, BAND_C.y + 2], [B.tip0, BAND_C.y], [B.tip1, SEC_VIEW.y], [B.open0, SEC_VIEW.y], [B.port0 + 6, PORT_VIEW.y], [B.stream0 + 10, PORT_VIEW.y], [B.heroRing, STREAM_VIEW.y], [B.dive0 + 2, STREAM_VIEW.y]];
  const zs: [number, number][] = [[46, c46.z], [58, 2.4], [B.macro, 7.2], [B.tip0, 7.8], [B.tip1, 12.5], [B.open0, 13], [B.port0 + 6, 20], [B.stream0 + 10, 24], [B.heroRing, 30], [B.dive0 + 2, 33]];
  return {x: spline(f, xs), y: spline(f, ys), z: zKeys(f, zs), roll: 0};
};

const Z_RIDE = 4.0 * LOCAL_PER_WORLD;
const rideCam = (f: number): Cam => {
  const s = heroS(f);
  const h = heroWorld(f);
  const fwd = sub(onVP(VP, s + 2), onVP(VP, s));
  const fl = Math.hypot(fwd.x, fwd.y) || 1;
  // distance and depth vary: closer as the hero meets the cell, back off as the signals leave
  const zz = Z_RIDE * (1 + 0.25 * ease(inv(B.pass0, B.pass0 + 14, f)) * (1 - ease(inv(B.pass1 - 10, B.pass1, f))) + 0.3 * ease(inv(B.wall0, B.decay, f)) - 0.3 * ease(inv(B.signal0, B.signal1, f)));
  const lead = 150 / zz;
  return {x: h.x + (fwd.x / fl) * lead, y: h.y + (fwd.y / fl) * lead, z: zz, roll: travelRoll(s)};
};

const diveCam = (f: number): Cam => {
  const a = camOpen(B.dive0 + 2);
  const b = rideCam(B.dive1);
  const t = inv(B.dive0 + 2, B.dive1, f);
  const e = ease(t);
  const k = Math.pow(e, 0.6);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: expLerp(a.z, b.z, e), roll: lerp(0, b.roll ?? 0, ease(clamp((t - 0.15) / 0.85)))};
};

/** the lead signal's world position (on the continued vessel, after the switch) */
const signalWorld = (f: number) => onVP(VPX, Math.min(VPX.L - 10, signalS(f, 0)));
const ARM_TORSO = {x: 560, y: 1470};
const pullCam = (f: number): Cam => {
  // follow the lead signal up the arm while the scale changes, then settle on the arm and chest
  const t = inv(B.pull0, B.pull1, f);
  const a = rideCam(B.pull0);
  const z = expLerp(a.z, 2.5, ease(t));
  const sw = signalWorld(f);
  const k = Math.pow(ease(t), 2.4);
  const c = add(mul(sw, 1 - k), mul(ARM_TORSO, k));
  return {x: c.x, y: c.y, z, roll: lerp(a.roll ?? 0, 0, ease(clamp(t * 1.4)))};
};

const seconds = add(BAND_C, {x: 0, y: -2});
// the critical seconds: his face at the top of frame, the band above the caption lane
const TWO = {x: (PJ.head.x + BAND_C.x) / 2, y: BAND_C.y - 340 / 2.2};
const camBody = (f: number): Cam => {
  const pathDown = (q: number) => onVP(VPX, lerp(VPX.L - 40, 40, q));
  const keys: [number, V, number][] = [
    [B.pull1, ARM_TORSO, 2.5],
    [B.organ0 + 12, add(mul(CUT.c, 0.7), mul(ARM_TORSO, 0.3)), 3.3],
    [B.fail + 6, add(mul(LIVER, 0.6), mul(CUT.c, 0.4)), 4.2],
    [B.heart0 + 6, add(mul(HEART, 0.7), mul(CUT.c, 0.3)), 4.6],
    [B.lethal + 6, HEART, 5.6],
    [B.sig0 + 2, HEART, 5.6],
    [B.sig0 + 16, pathDown(0.45), 3.6],
    [B.sig1 - 4, BAND_C, 5.2],
    [B.red + 4, BAND_C, 7.0],
    [B.count0 + 4, seconds, 8.6],
    [B.crit0 - 4, seconds, 9.2],
    [B.crit0 + 14, TWO, 2.2],
    [B.tx0, add(TWO, {x: 6, y: 8}), 2.3],
    // the transmission pulse lifts off the band; the camera tilts up with it
    [B.map0, add(BAND_C, {x: -40, y: -520}), 2.4],
  ];
  return {
    x: spline(f, keys.map(([t, p]) => [t, p.x])),
    y: spline(f, keys.map(([t, p]) => [t, p.y])),
    z: Math.exp(spline(f, keys.map(([t, , z]) => [t, Math.log(z)]))),
    roll: 0,
  };
};

export const journeyCam3 = (f: number): Cam => {
  let c: Cam;
  if (f < B.dive0 + 2) c = camOpen(f);
  else if (f < B.dive1) c = diveCam(f);
  else if (f < B.pull0) c = rideCam(f);
  else if (f < B.pull1) c = pullCam(f);
  else c = camBody(f);
  // a little handheld energy on the macro while the band buzzes
  const bz = buzz(f);
  if (bz > 0 && c.z < 20) c = {...c, x: c.x + (bz * noise1(f * 3.1, 41) * 2.2) / c.z * 6, y: c.y + (bz * noise1(f * 2.7, 42) * 2.2) / c.z * 6};
  return c;
};

// ---------------------------------------------------------------- render
const SWITCH = B.pull0 + 2; // section view -> see-through arm (deep inside the vessel)

export const Journey3: React.FC<{id: string; f: number}> = ({id, f}) => {
  const cam = journeyCam3(f);
  const man = manAt(f);
  const j = manJoints(man);
  const expr = exprAt(f);
  const hands = handAt(f);
  const dog = dogAt(f);
  const hairSway = f < B.settle ? collapseState(f).hairSway : 0;
  const blink = f < B.settle ? collapseState(f).blink : Math.max(0, 1 - Math.abs(((f - 70) % 95) - 3) / 3) * (f > B.tip0 - 10 && f < B.count0 ? 0 : 1);

  const sectionMode = f >= B.tip0 - 2 && f < SWITCH;
  const xMode = f >= SWITCH && f < B.count0 + 14;
  const backdrop = clamp(inv(B.tip0 + 2, B.tip0 + 16, f)) * (f < SWITCH ? 1 : 1 - clamp(inv(B.pull0 + 8, B.pull0 + 26, f)));
  const bz = buzz(f);
  const roll = (f < B.tip0 ? 0 : f < SWITCH ? SEC_ROLL * ease(inv(B.tip0, B.tip1, f)) : 0) + bz * 3.2 * Math.sin(f * 2.6);
  const portExt = clamp(inv(B.port0, B.port1, f)) * (1 - clamp(inv(B.retract0, B.retract1, f)));
  const openAmt = ease(inv(B.open0, B.open1 + 8, f));
  const caseOpen = ease(inv(B.tip1 - 6, B.open0 + 4, f));
  const pxs = cam.z / LOCAL_PER_WORLD;
  const hs = heroS(f);
  const inRide = f >= B.dive0 && f < SWITCH + 40;
  const cells: WallCell[] = [-640, -320, 0, 330, 660].map((ds) => ({
    s: S_TARGET + ds,
    side: WALL_SIDE,
    decay: ds === 0 ? clamp(inv(B.decay - 2, B.decay + 10, f)) : 0,
    scan: ds === 0 ? clamp(inv(B.scan0, B.decay, f)) * (1 - 0.5 * clamp(inv(B.signal1, B.signal1 + 10, f))) : 0,
  }));
  const sensorFront = E0 + Math.max(0, (f - (B.stream0 + 30)) * 24);
  const tubeCommon = {f, px: pxs, sensors: clamp(inv(B.stream0 + 26, B.stream0 + 36, f)), sensorFront, cells, s0: inRide ? hs - 900 : E0 - 900, s1: inRide ? hs + 1500 : 99999};
  // the red cell the hero passes behind: it overtakes on the near side
  const occluder = {s: hs + lerp(-260, 300, ease(inv(B.pass0 + 2, B.pass0 + 26, f))), l: 18};
  const sigGlows = (path: typeof VP, a: number) =>
    f >= B.signal0 && a > 0.01
      ? [0, 1, 2, 3].map((k) => {
          const s = signalS(f, k);
          if (s < heroS(B.signal0) + 20 || s > path.L - 10) return null;
          const q = path.at(s);
          return (
            <g key={k} opacity={a}>
              <circle cx={fmt(q.p.x)} cy={fmt(q.p.y)} r={70} fill="#FFB23E" opacity={0.28} />
              <circle cx={fmt(q.p.x)} cy={fmt(q.p.y)} r={30} fill="#FFE2A8" />
            </g>
          );
        })
      : null;
  const tubeSection = <VesselTube id={`${id}-vt`} path={VP} {...tubeCommon} hero={f >= B.stream1 - 12 ? hero(f) : undefined} occluder={occluder} />;
  const pulseS = lerp(VPX.L - 40, 40, ease(inv(B.sig0, B.sig1, f)));
  const xTube = (key: string) => (
    <VesselTube id={`${id}-${key}`} path={VPX} {...tubeCommon} s1={f < SWITCH + 30 ? hs + 1500 : 99999} hero={f < B.pull1 ? hero(f) : undefined} pulse={f >= B.sig0 && f < B.sig1 + 4 ? {s: pulseS, a: 1} : undefined} />
  );
  // see-through arm: strength, and how far up the arm it reaches
  const xA = xMode ? 1 - clamp(inv(B.red, B.count0 + 12, f)) : 0;
  const cutOpen = ease(inv(B.organ0 - 8, B.organ0 + 12, f)) * (1 - ease(inv(B.sig1 - 6, B.red + 6, f)));
  const chaos = clamp(inv(B.lethal - 2, B.lethal + 8, f));
  const cg = cutGeo(j.C, j.tc, man.s, cutOpen);
  const heartPos = cg.loc(86, -46);
  const bodyD = torsoPath(man);

  const dev: DeviceView = {
    screen: deviceState3(f),
    roll,
    yaw: 14,
    flip: false,
    upright: true,
    glow: 1 + 0.6 * bz,
    caseOpen: sectionMode ? caseOpen : 0,
    caseCut: () => (
      <g transform={SF.matrix}>
        <PortModule id={`${id}-pm`} sf={SF} f={f} ext={portExt} reservoir={1 - 0.4 * clamp(inv(B.stream0, B.stream1, f))} blue={0} />
      </g>
    ),
    inArm: () => {
      if (sectionMode)
        return (
          <g transform={SF.matrix}>
            <SectionLayers id={`${id}-sec`} sf={SF} f={f} open={openAmt} tube={<g>{tubeSection}{sigGlows(VP, 1)}</g>} stream={clamp(inv(B.stream0, B.stream1, f))} streamA={clamp(inv(B.stream0, B.stream0 + 4, f)) * (1 - clamp(inv(B.dive1 - 10, B.dive1, f)))} />
          </g>
        );
      return null;
    },
  };

  // the see-through arm (drawn over everything, clipped to the arm): tissue, the vessel, the signals, and the
  // chest window seen through the upper arm
  const limbD = limbGeo(j.L.S, j.L.E, j.L.W, 29 * man.s, 23.5 * man.s, 17 * man.s).d;
  const bandCut = (() => {
    const A = armFrame(j.L.E, j.L.W, R0.rE, R0.rW);
    const u0 = A.L - (1.75 + 0.62) * A.rW;
    const a = add(A.E, mul(A.u, u0));
    const b = add(A.E, mul(A.u, A.L + 400));
    const n = mul(A.n, 400);
    return `M${fmt(a.x + n.x)},${fmt(a.y + n.y)} L${fmt(b.x + n.x)},${fmt(b.y + n.y)} L${fmt(b.x - n.x)},${fmt(b.y - n.y)} L${fmt(a.x - n.x)},${fmt(a.y - n.y)} Z`;
  })();
  const cutD = cutPathD(cg);
  const chest = (key: string) => <ChestCut id={`${id}-${key}`} f={f} g={cg} cam={cam} open={cutOpen} organ={clamp(inv(B.fail - 4, B.fail + 10, f))} chaos={chaos} organSense={clamp(inv(B.organ0 + 4, B.organ0 + 14, f))} heartSense={clamp(inv(B.heart0, B.heart0 + 10, f))} heartPos={heartPos} heartSize={27 * man.s} bodyD={bodyD} />;
  // the arm stays his arm: the vessel shows through the skin as a glowing band with the signals and the
  // warning pulse running along it; only where the arm crosses the chest window does it turn see-through
  const vesselGlow = (
    <g transform={SF.matrix}>
      <path d={`M${VPX.pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`} fill="none" stroke="#C9566A" strokeWidth={560} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />
      <path d={`M${VPX.pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`} fill="none" stroke="#E07A88" strokeWidth={300} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
    </g>
  );
  const overAll =
    xA > 0.01 ? (
      <g>
        <defs>
          <mask id={`${id}-lc`}>
            <path d={limbD} fill="#FFF" />
            {/* the band and the hand stay as they are */}
            <path d={bandCut} fill="#000" />
          </mask>
          <clipPath id={`${id}-cc`}>
            <path d={cutD} />
          </clipPath>
        </defs>
        <g mask={`url(#${id}-lc)`} opacity={xA}>
          {cutOpen > 0.01 && (
            <g clipPath={`url(#${id}-cc)`}>
              {chest('cx2')}
              <path d={limbD} fill="#F7D3BD" opacity={0.14} />
            </g>
          )}
          {vesselGlow}
          <g transform={SF.matrix}>
            {xTube('xa')}
            {sigGlows(VPX, 1 - clamp(inv(B.organ0 + 10, B.heart0, f)))}
          </g>
        </g>
        {cutOpen > 0.01 && (
          <g clipPath={`url(#${id}-cc)`} mask={`url(#${id}-lc)`}>
            <path d={limbD} fill="none" stroke="#FFF1E6" strokeWidth={fmt(2.4 * man.s)} opacity={0.8 * xA} />
          </g>
        )}
      </g>
    ) : null;

  const cutEdgeT = inv(B.organ0 - 8, B.organ0 + 14, f);
  return (
    <Scene
      id={id}
      f={f}
      cam={cam}
      man={man}
      expr={expr}
      blink={blink}
      lHand={hands.l}
      rHand={hands.r}
      dog={dog}
      hairSway={hairSway}
      dev={dev}
      backdrop={backdrop}
      backdropC={sectionMode ? W(SF.Xp - 600, 400) : BAND_C}
      nearLegFront={f > 24}
      noTufts={f > B.macro - 30}
      afterRightArm={
        cutOpen > 0.01 ? (
          <g>
            {chest('cx')}
            <CutEdge g={cg} t={cutEdgeT} />
          </g>
        ) : null
      }
      overAll={overAll}
      extra={(() => {
        // V4: the warning landing at B.red is the device's own alarm ring (lib/device3.ts alarmAt, drawn by Wrist3D
        // round the glass, outside the case), the same helper as the loop alarm
        const tx = inv(B.tx0, B.tx1, f);
        return (
          <g>
            {/* the transmission pulse: a blue ring leaves the band and rises toward the street; it is drawn through
                its last frame (B.tx1) and the map picks it up one frame on at the same screen point and speed
                (Dispatch.tsx txPulseW/txHandoff replicate this world path: keep them in step) */}
            {tx > 0 && f <= B.tx1 && (
              <g>
                <Glow id={`${id}-txg`} c={add(BAND_C, {x: -40 * ease(tx), y: -520 * Math.pow(tx, 1.4)})} r={60 + 40 * tx} color="#39C6F4" alpha={0.8 * (1 - tx * 0.3)} />
                <circle cx={fmt(BAND_C.x - 40 * ease(tx))} cy={fmt(BAND_C.y - 520 * Math.pow(tx, 1.4))} r={fmt(10 + 34 * tx)} fill="none" stroke="#BFF3FF" strokeWidth={fmt(4)} opacity={0.95} />
                <circle cx={fmt(BAND_C.x - 40 * ease(tx))} cy={fmt(BAND_C.y - 520 * Math.pow(tx, 1.4))} r={fmt(6)} fill="#FFFFFF" />
              </g>
            )}
          </g>
        );
      })()}
    />
  );
};

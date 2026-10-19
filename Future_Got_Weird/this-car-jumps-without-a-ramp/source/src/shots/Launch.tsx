// 0:00-0:41 (and the drive-off that carries into the bend).
//   0.0-1.9   BYD's real jump, full frame, its own frames at its own speed
//   1.5-2.1   match cut: the illustrated car appears exactly over the real one (wheel centres tracked frame by frame),
//             then the photographic background gives way to the proving ground
//   2.3-4.3   pull back; a localized window opens in the rear wheel well on "suspension"
//   4.3-7.9   the hook hop (slowed): contact patches, push, takeoff on "leave", flight, landing
//   8-14      the question; the U9 name
//   14-24.5   wheel-well cutaway: spring, damper, powered actuator, one at a time
//   24.5-29.6 tyre contact close-up: tyre pushes on pavement, pavement pushes back
//   29.6-41   grounded push, takeoff, flight, landing with the whole-car force diagram
//   41-42     the car drives off; a passing barrier carries the cut to the overhead
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {w, we} from '../cues';
import {SideCar, bodyToWorld, STRUT_TOP} from '../car/side';
import {Arrow} from '../car/parts';
import {AXLE_F, AXLE_R, COM, WHEEL_R} from '../car/geom';
import {Cam, Callout, Caption, Label, Stage, camKeys, toScreen, World} from '../kit/stage';
import {ProvingSide, Look} from '../kit/proving';
import {CarForces, ContactPatch, LW, MOTION_LIFT} from '../kit/forces';
import {RealClip, REAL, FILM, alignMatrix, camFromAlign, realFrameAt, realEnd} from '../footage';
import {LAUNCH, LaunchState, MTOT, G, sampleLaunch, STATIC} from '../sim/launch';
import {clamp01, easeInOut, easeOut, pchip, seg, smooth, wheelBlur, win} from '../kit/util';

export const T = {
  suspension: w('b1', 'suspension'),
  launches: w('b1', 'launches'),
  it: w('b1', 'it'),
  moment: w('b1', 'moment'),
  tires1: w('b1', 'tires'),
  leave: w('b1', 'leave'),
  lose: w('b1', 'lose'),
  grip: w('b1', 'grip'),
  so: w('b1', 'so'),
  prove: w('b1', 'prove'),
  name: w('b2', 'this', 0),
  u9: w('b2', 'u9'),
  ordinary: w('b2', 'ordinary'),
  springs: w('b2', 'springs'),
  release: w('b2', 'release'),
  dampers: w('b2', 'dampers'),
  motion: w('b2', 'motion'),
  adds: w('b2', 'adds'),
  active: w('b2', 'active'),
  powered: w('b2', 'powered'),
  actuators: w('b2', 'actuators'),
  apply: w('b2', 'apply'),
  body: w('b2', 'body'),
  during: w('b2', 'during'),
  tires: w('b2', 'tires'),
  push: w('b2', 'push'),
  pavement0: w('b2', 'pavement', 0),
  pavement1: w('b2', 'pavement', 1),
  back: w('b2', 'back', 0),
  that: w('b2', 'that'),
  accelerates: w('b2', 'accelerates'),
  takeoffWord: w('b2', 'takeoff'),
  lift: w('b2', 'lift'),
  clear: w('b2', 'clear'),
  ground: w('b2', 'ground'),
  stops: w('b2', 'stops'),
  momentum: w('b2', 'momentum'),
  gravity: w('b2', 'gravity'),
  slows: w('b2', 'slows'),
  then: w('b2', 'then'),
  downEnd: we('b2', 'down'),
  now: w('b3', 'now'),
};

// ------------------------------------------------------------------------------------------------ the model's clock
// Slow motion is a smooth time-warp of the model (video time -> model time), so up and down are one trajectory.
const HOOK = {take: T.leave + 0.1, apex: T.leave + 0.85, land: T.grip + 0.1};
const MAIN = {crouch: T.tires - 0.1, push: T.that, take: T.clear, apex: T.gravity + 0.05, land: T.downEnd};
const S = {crouch: 0.5, push: 0.92, take: 1.104, apex: 1.254, land: 1.404};
const HOOK_KEYS: [number, number][] = [[HOOK.take - 1.55, S.crouch], [HOOK.take - 0.65, S.push], [HOOK.take, S.take], [HOOK.apex, S.apex], [HOOK.land, S.land], [HOOK.land + 0.75, 1.62], [HOOK.land + 1.6, 1.9]];
const MAIN_KEYS_FULL: [number, number][] = [[MAIN.crouch, S.crouch], [MAIN.push, S.push], [MAIN.take, S.take], [MAIN.apex, S.apex], [MAIN.land, S.land], [MAIN.land + 0.75, 1.62], [MAIN.land + 1.5, 1.9]];
// Real footage takes over the flight: BYD's car crossing a strip of road spikes with all four wheels clear of the pavement, from
// "ground stops pushing" to "brings it back down". A hard cut in and out. The illustration resumes with the car back on the road
// (settled), so the road-force arrow returns exactly when contact does.
export const SPIKE_CLIP = FILM.spikes(35.25);
export const SPIKE_T0 = SPIKE_CLIP.frame0 / 30;
export const SPIKE_END = (SPIKE_CLIP.frame0 + (SPIKE_CLIP.to - SPIKE_CLIP.from + 1)) / 30;
export const SPIKE_LAND = SPIKE_T0 + (1036 - 900) / 30; // the wheels touch down beyond the strip (recording frame ~1036)
const MAIN_KEYS: [number, number][] = [[MAIN.crouch, S.crouch], [MAIN.push, S.push], [MAIN.take, S.take], [SPIKE_T0, pchip(SPIKE_T0, MAIN_KEYS_FULL)], [SPIKE_END, 1.62], [SPIKE_END + 1.2, 1.9]];
const inHookWindow = (t: number) => t >= HOOK_KEYS[0][0] - 0.1 && t < 10;
export const simTime = (t: number) => (inHookWindow(t) ? pchip(t, HOOK_KEYS) : t >= MAIN_KEYS[0][0] - 0.1 ? pchip(t, MAIN_KEYS) : 0);
export const LAUNCH_EV = {hookTake: HOOK.take, hookLand: HOOK.land, take: MAIN.take, apex: MAIN.apex, land: MAIN.land, push: MAIN.push, crouch: MAIN.crouch};

/** Side-view state of the model at video time t, in drawing units (mm, m/s, weights). */
const poseAt = (t: number) => {
  const st: LaunchState = sampleLaunch(LAUNCH, Math.max(0, simTime(t)));
  return {st, dz: (st.zb - LAUNCH[0].zb) * 1000, wz: (st.zw - STATIC.zw) * 1000, force: Math.max(-1, Math.min(1, st.Fa / 30e3)), n: st.N / 2 / (MTOT * G), v: st.vb, air: st.air};
};

// ------------------------------------------------------------------------------------------------ hand-press demo
// Mass-spring-damper integrated once (deterministic): a hand presses the rear deck, lets go; first the spring alone
// rings, then the damper takes the ring out. The actuator then lifts the same corner on its own.
const P1 = {a: T.ordinary + 0.6, b: T.ordinary + 1.1, rel: T.release - 0.02};
const P2 = {a: T.dampers + 0.05, b: T.dampers + 0.55, rel: T.motion - 0.1};
const ACT = {a: T.apply - 0.1, b: T.apply + 0.7, c: T.body + 0.45, d: T.body + 1.0, mm: 36};
const DAMP_ON = T.dampers + 0.1;
const DEMO_T0 = T.ordinary - 0.5, DEMO_T1 = 26;
type Demo = {t: number; x: number; v: number};
const DEMO: Demo[] = (() => {
  const out: Demo[] = [];
  const dt = 1 / 1000;
  const om = 2 * Math.PI * 1.15;
  let x = 0, v = 0;
  const hand = (t: number): number | null => {
    for (const p of [P1, P2]) {
      if (t >= p.a && t < p.rel) {
        const k = easeInOut(clamp01((t - p.a) / (p.b - p.a)));
        return -58 * k;
      }
    }
    return null;
  };
  let prevHand: number | null = null;
  for (let t = DEMO_T0; t <= DEMO_T1; t += dt) {
    const h = hand(t);
    if (h !== null) {
      // kinematic while the hand is on the body; the contact point blends from wherever the body was
      if (prevHand === null) prevHand = x;
      const p = t < P2.a ? P1 : P2;
      const k = easeInOut(clamp01((t - p.a) / (p.b - p.a)));
      const nx = prevHand + (-58 - prevHand) * k;
      v = (nx - x) / dt;
      x = nx;
    } else {
      prevHand = null;
      const zeta = 0.06 + 0.5 * smooth(seg(t, DAMP_ON, DAMP_ON + 0.5));
      const a = -om * om * x - 2 * zeta * om * v;
      v += a * dt;
      x += v * dt;
    }
    if (Math.round((t - DEMO_T0) / dt) % 8 === 0) out.push({t, x, v});
  }
  return out;
})();
const demo = (t: number): {x: number; v: number} => {
  if (t <= DEMO[0].t) return {x: 0, v: 0};
  if (t >= DEMO[DEMO.length - 1].t) return {x: 0, v: 0};
  const step = DEMO[1].t - DEMO[0].t;
  const i = Math.floor((t - DEMO[0].t) / step);
  const a = DEMO[i], b = DEMO[Math.min(DEMO.length - 1, i + 1)];
  const u = (t - a.t) / step;
  return {x: a.x + (b.x - a.x) * u, v: a.v + (b.v - a.v) * u};
};
export const DEMO_EV = {press1: P1.a, release1: P1.rel, press2: P2.a, release2: P2.rel, act: ACT.a, actEnd: ACT.c};
const actLift = (t: number) => ACT.mm * smooth(seg(t, ACT.a, ACT.b)) * (1 - smooth(seg(t, ACT.c, ACT.d)));

// ------------------------------------------------------------------------------------------------ camera
const CAM0 = camFromAlign(REAL.open.crop, 328);
const CAM_MID: Cam = {x: -900, y: 700, z: 0.5};
export const CAM_WIDE: Cam = {x: -40, y: 747, z: 0.375};
const CAM_WIDE2: Cam = {x: 380, y: 720, z: 0.318};
const WELL_R: Cam = {x: AXLE_R + 20, y: 640, z: 0.76};
const WELL_R2: Cam = {x: AXLE_R + 90, y: 610, z: 0.88};
const TIRE: Cam = {x: AXLE_R + 120, y: 115, z: 1.45};
const CAM_FULL: Cam = {x: -40, y: 800, z: 0.372};
export const GO_T = T.now + 0.0;
/** Real footage under "so what does making a supercar jump actually prove?": the front wheel at the lip of the pit, then the high angle. */
export const QUESTION_T0 = T.so;
export const QUESTION_CLIPS = FILM.question(QUESTION_T0);
export const QUESTION_END = (QUESTION_CLIPS[1].frame0 + (QUESTION_CLIPS[1].to - QUESTION_CLIPS[1].from + 1)) / 30;
/** The car accelerates away after settling; the camera follows it. */
export const carX = (t: number) => (t > GO_T ? 0.5 * 8500 * (t - GO_T) ** 2 : 0);
const camAt = (t: number): Cam => {
  const base = camKeys(t, [
    [0, CAM0],
    [2.0, CAM0],
    [2.9, CAM_MID],
    [3.55, CAM_MID],
    [4.5, CAM_WIDE],
    [T.so, CAM_WIDE],
    [T.name + 1.0, CAM_WIDE2],
    [T.ordinary - 0.9, CAM_WIDE2],
    [T.ordinary + 0.1, WELL_R],
    [T.actuators + 0.2, WELL_R],
    [T.body + 0.4, WELL_R2],
    [T.during - 0.15, WELL_R2],
    [T.tires - 0.5, TIRE],
    [T.that - 0.2, TIRE],
    [T.that + 1.7, CAM_FULL],
    [T.downEnd + 0.8, CAM_FULL],
  ], easeInOut);
  const cx = carX(t);
  return {...base, x: base.x + cx * smooth(seg(t, GO_T - 0.2, GO_T + 0.5)) * 1};
};

// the car moves through the proving ground: the demonstration pad, the cornering section, the braking zone, back to the pad
const LOOK_CUTS: [number, Look][] = [[0, 'pad'], [QUESTION_END, 'corner'], [T.ordinary - 0.7, 'brake'], [T.tires - 0.5, 'pad']];
const lookBlend = (t: number): [Look, number][] => {
  let c = 0;
  LOOK_CUTS.forEach(([t0], i) => { if (t >= t0) c = i; });
  const fade = c === 0 ? 1 : smooth(seg(t, LOOK_CUTS[c][0], LOOK_CUTS[c][0] + 0.45));
  return fade < 0.999 ? [[LOOK_CUTS[c - 1][1], 1], [LOOK_CUTS[c][1], fade]] : [[LOOK_CUTS[c][1], 1]];
};
export const Launch: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const looks = lookBlend(t);
  const px = cam.z;
  const realOver = t < realEnd(REAL.open);
  // -------------------------------------------------------------------- how the real clip hands over to the illustration
  // a crisp match cut: the real clip's last frame, then the illustration with the car on the same wheel centres (no dissolve, no double image)
  const carA = 0;
  const bgA = realOver ? 0 : 1;
  const n = realFrameAt(REAL.open, t);
  const al = alignMatrix(REAL.open.crop, n);

  // -------------------------------------------------------------------- the car's state
  const sag = 18 * smooth(seg(t, 3.0, 4.0)); // tyre squash under the car's weight (not drawn in the match frame)
  const hookOn = t >= HOOK_KEYS[0][0] - 0.1 && t < 10;
  const mainOn = t >= MAIN_KEYS[0][0] - 0.1;
  const lp = hookOn || mainOn ? poseAt(t) : poseAt(0);
  let dz = -sag, pitch = 0, wf = -sag, wr = -sag;
  let forceR = 0;
  if (hookOn || mainOn) {
    dz += lp.dz;
    wf += lp.wz;
    wr += lp.wz;
    forceR = lp.force;
  }
  const demoOn = t > DEMO_T0 && t < T.tires - 0.05;
  const dm = demoOn ? demo(t) : {x: 0, v: 0};
  const lift = demoOn ? actLift(t) : 0;
  if (demoOn) {
    // the rear corner is pressed / lifted while the front axle stays put: rotate about the front axle
    const d = dm.x + lift;
    const th = -d / 2900;
    pitch = (th * 180) / Math.PI;
    dz = -sag - (AXLE_F - COM.x) * th;
    wf = -sag;
    wr = -sag;
    forceR = lift > 1 ? clamp01(lift / 30) : 0;
  }
  const X = carX(t);
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;
  const pose = {x: X, dz, pitch};
  const com = bodyToWorld(pose, COM.x, COM.y);

  // -------------------------------------------------------------------- the cutaway window and its parts
  const open = Math.max(
    smooth(seg(t, T.suspension - 0.1, T.suspension + 0.45)) * (1 - smooth(seg(t, 3.7, 4.2))),
    smooth(seg(t, T.ordinary - 0.7, T.ordinary + 0.1)) * (1 - smooth(seg(t, T.during + 0.1, T.tires - 0.1))),
  );
  const early = t < 6; // the hook-time strut is one plain unit (spring + damper), no actuator
  const springVis = early ? 1 : smooth(seg(t, T.springs - 0.15, T.springs + 0.35)) * (1 - 0.55 * smooth(seg(t, T.dampers + 0.3, T.dampers + 0.9)));
  const damperVis = early ? 1 : smooth(seg(t, T.dampers - 0.1, T.dampers + 0.4)) * (1 - 0.5 * smooth(seg(t, T.actuators - 0.2, T.actuators + 0.4)));
  const springDim = early ? 1 : springVis * (1 - 0.35 * smooth(seg(t, T.actuators - 0.2, T.actuators + 0.4)));
  const actVis = smooth(seg(t, T.adds - 0.1, T.adds + 0.9));
  const actSlide = smooth(seg(t, T.adds + 0.0, T.actuators + 0.1));
  const springGlow = early ? smooth(seg(t, T.suspension, T.suspension + 0.4)) * (1 - smooth(seg(t, T.launches + 0.3, T.it + 0.2))) : win(t, T.springs, T.dampers + 0.2, 0.2, 0.4) * clamp01(Math.abs(dm.x) / 40 + 0.35);
  const damperGlow = win(t, T.dampers, T.adds, 0.2, 0.4) * clamp01(Math.abs(dm.v) / 220 + 0.4);
  const wells = open > 0.001 ? [{axle: 'r' as const, open, spring: springDim, damper: early ? 1 : damperVis, actuator: early ? 0 : actVis, slide: actSlide, force: forceR, springGlow, damperGlow}] : [];

  // -------------------------------------------------------------------- force diagram
  const diag = win(t, T.that - 0.35, T.downEnd + 0.9, 0.5, 0.5);
  const grounded = !lp.air;
  const roadVis = t >= T.that - 0.35 ? 1 : 0;
  const hookPatches = win(t, T.tires1 - 0.3, T.leave + 0.1, 0.25, 0.04) + win(t, HOOK.land - 0.05, T.so + 0.6, 0.05, 0.3);
  const ax: [number, number] = [X + AXLE_R, X + AXLE_F];
  const closeUp = t >= T.during && t < T.that + 1.5;
  const pairVis = win(t, T.tires, T.pavement1 + 0.1, 0.3, 0.3);
  const backVis = smooth(seg(t, T.pavement1 - 0.1, T.pavement1 + 0.35));
  const nAx = lp.n;
  const squashChord = (cy0: number) => {
    const cyMin = WHEEL_R + wr; // wheel-centre height above the road
    void cy0;
    const dd = Math.max(0, WHEEL_R - cyMin);
    return 2 * Math.sqrt(Math.max(0, 2 * WHEEL_R * dd - dd * dd));
  };

  // -------------------------------------------------------------------- screen-space annotation anchors
  const toS = (x: number, y: number) => toScreen(cam, x, y);
  const strutTop = bodyToWorld(pose, AXLE_R, STRUT_TOP);
  const mid = (strutTop[1] + WHEEL_R + wr) / 2;
  const sp = toS(strutTop[0] + 50, mid - 20);
  const dp = toS(strutTop[0] - 150, strutTop[1] - 125);
  const ap = toS(strutTop[0] + 175, mid + 20);

  const hand = (() => {
    const hp = bodyToWorld(pose, -1400, 1062);
    return toS(hp[0], hp[1]);
  })();
  const handUp = (p: {a: number; b: number; rel: number}) => {
    const inn = easeOut(seg(t, p.a - 0.5, p.a));
    const out = easeInOut(seg(t, p.rel, p.rel + 0.4));
    return {vis: t > p.a - 0.5 && t < p.rel + 0.45, lift: (1 - inn) * 380 + out * 420};
  };
  const h1 = handUp(P1), h2 = handUp(P2);
  const handNow = h1.vis ? h1 : h2.vis ? h2 : null;

  const caption = (() => {
    if (t < 2.1) return <Caption text="BYD DEMONSTRATION VIDEO" opacity={smooth(seg(t, 0.15, 0.5)) * (1 - smooth(seg(t, 1.55, 1.8)))} />;
    if (t < 3.5 && t > 2.3) return null;
    const slow = Math.max(win(t, HOOK.take - 0.9, HOOK.land + 0.5, 0.3, 0.4), win(t, T.that - 0.2, SPIKE_T0 - 0.05, 0.4, 0.05));
    const cut = open * smooth(seg(t, T.ordinary - 0.1, T.ordinary + 0.4)) * (1 - smooth(seg(t, T.during - 0.2, T.during + 0.2)));
    return (
      <g>
        <Caption text="SLOW MOTION · SIMPLIFIED MODEL" opacity={slow} />
        <Caption text="SIMPLIFIED CUTAWAY" opacity={cut * (1 - slow)} />
      </g>
    );
  })();

  return (
    <AbsoluteFill>
      {realOver && <RealClip spec={REAL.open} />}
      <Stage bg="transparent">
        {/* photographic backdrop gives way to the proving ground */}
        <g opacity={bgA}>
          {looks.map(([lk, a]) => <g key={lk} opacity={a}><ProvingSide cam={cam} look={lk} /></g>)}
        </g>
        {/* the illustrated car, over the real one while the clip plays (aligned frame by frame), then in the world */}
        {t < realEnd(REAL.open) + 0.0 ? (
          <g opacity={carA}>
            <g transform={al.m}>
              <SideCar x={0} px={al.s} shadow={0} id="match" />
            </g>
          </g>
        ) : (
          <World cam={cam}>
            <ContactPatch cx={ax[0]} chord={squashChord(0)} px={px} opacity={hookPatches * (grounded ? 1 : 0)} />
            <ContactPatch cx={ax[1]} chord={squashChord(0)} px={px} opacity={hookPatches * (grounded ? 1 : 0)} />
            <SideCar x={X} dz={dz} pitch={pitch} wf={wf} wr={wr} rot={rot} px={px} wells={wells} shadow={bgA} blur={wheelBlur(Math.max(0, 8500 * (t - GO_T)))} id="launch" />
            {/* the actuator's equal-and-opposite pair, on the body mount and on the hub */}
            {(() => {
              const a = win(t, ACT.a + 0.2, ACT.c + 0.1, 0.25, 0.3) * (t > T.apply ? 1 : 0);
              if (a <= 0) return null;
              return (
                <g>
                  <Arrow x={strutTop[0] + 150} y={strutTop[1] + 20} dx={0} dy={230} px={px} color={C.teal} opacity={a} />
                  <Arrow x={X + AXLE_R + 150} y={WHEEL_R + wr - 20} dx={0} dy={-230} px={px} color={C.teal} opacity={a} />
                </g>
              );
            })()}
            {/* tyre contact close-up: equal and opposite, side by side at the patch */}
            {closeUp && (
              <g>
                <ContactPatch cx={X + AXLE_R} chord={squashChord(0)} px={px} opacity={smooth(seg(t, T.during + 0.2, T.tires))} />
              </g>
            )}
            <CarForces px={px} com={com} axles={ax} n={nAx} v={lp.v} road={diag * roadVis} gravity={diag} motion={diag * smooth(seg(t, T.that, T.accelerates)) * (1 - smooth(seg(t, SPIKE_T0 - 0.05, SPIKE_T0)))} pair={closeUp ? pairVis : 0} />
            {closeUp && backVis > 0 && nAx > 0.01 && (
              <Arrow x={X + AXLE_R + 70} y={-nAx * LW - 10} dx={0} dy={nAx * LW} px={px} color={C.teal} width={16} opacity={backVis} />
            )}
          </World>
        )}
        {/* hand pressing the rear deck: a crew sleeve reaching in from above */}
        {handNow && open > 0.5 && (
          <g transform={`translate(${hand.x} ${hand.y - handNow.lift})`}>
            <path d="M 36 -40 C 60 -260 90 -520 110 -760 L 220 -760 C 190 -520 140 -250 96 -30 Z" fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            <path d="M 30 -60 C 50 -80 100 -78 108 -50 L 100 -20 C 80 -40 50 -40 34 -26 Z" fill={C.cream} stroke={C.ink} strokeWidth={4} />
            <ellipse cx={58} cy={-8} rx={62} ry={30} fill="#F2C9A8" stroke={C.ink} strokeWidth={5} />
            <ellipse cx={8} cy={-14} rx={20} ry={14} fill="#F2C9A8" stroke={C.ink} strokeWidth={4} />
          </g>
        )}
        {/* one focal label at a time while the parts are named */}
        <Callout x={sp.x + 390} y={sp.y - 200} tx={sp.x + 8} ty={sp.y} text="SPRING" color={C.saffronLight} opacity={win(t, T.springs - 0.05, T.dampers - 0.15, 0.25, 0.25) * open} />
        <Callout x={dp.x - 330} y={dp.y - 130} tx={dp.x - 18} ty={dp.y} text="DAMPER" color={C.blueLight} opacity={win(t, T.dampers - 0.05, T.adds - 0.2, 0.25, 0.25) * open} />
        <Callout x={ap.x + 380} y={ap.y - 240} tx={ap.x + 20} ty={ap.y} text="POWERED ACTUATOR" color={C.tealLight} opacity={win(t, T.actuators - 0.1, T.body + 0.9, 0.25, 0.3) * open} />
        {/* tyre close-up labels, beside their arrows (below the road line, clear of the tyre) */}
        {(() => {
          const g = toS(X + AXLE_R, 0);
          const a = win(t, T.tires, T.pavement0 + 0.5, 0.25, 0.3);
          const b = win(t, T.pavement1 - 0.05, T.that + 0.6, 0.25, 0.4);
          return (
            <g>
            </g>
          );
        })()}
        {/* whole-car forces: gravity at the arrow tip under the car, motion above the roof with a leader */}
        {(() => {
          const gtip = toS(com[0], com[1] - LW);
          const mpos = toS(com[0] + 80, com[1] + MOTION_LIFT);
          const gOn = win(t, T.lift + 0.1, MAIN.land + 0.6, 0.3, 0.4) * diag;
          const mOn = win(t, T.momentum - 0.1, SPIKE_T0 - 0.05, 0.3, 0.04) * diag * (Math.abs(lp.v) > 0.05 ? 1 : 0);
          return (
            <g>
              <Label x={gtip.x} y={gtip.y + 38} text="GRAVITY" color={C.blueLight} size={30} opacity={gOn} />
              <Label x={mpos.x + 100} y={mpos.y} text="MOTION" color={C.saffronLight} size={30} opacity={mOn} />
            </g>
          );
        })()}
        {/* hook: the claim, once, where the gap is */}
        {(() => {
          const g = toS(X, -120);
          return <Label x={g.x} y={g.y + 80} text="NO ROAD CONTACT" color={C.coral} fg={C.white} size={36} opacity={win(t, HOOK.take + 0.1, HOOK.land - 0.12, 0.2, 0.15) * (lp.air && t < 10 ? 1 : 0)} />;
        })()}
        {caption}
      </Stage>
      {t >= SPIKE_T0 - 0.001 && t < SPIKE_END && (
        <AbsoluteFill>
          <RealClip spec={SPIKE_CLIP} />
          <Stage bg="transparent">
            <Caption text="BYD DEMONSTRATION VIDEO" opacity={win(t, SPIKE_T0 + 0.2, SPIKE_END - 0.2, 0.2, 0.25)} />
          </Stage>
        </AbsoluteFill>
      )}
      {t >= QUESTION_T0 - 0.01 && t < QUESTION_END && (
        <AbsoluteFill>
          <RealClip spec={QUESTION_CLIPS[0]} />
          <RealClip spec={QUESTION_CLIPS[1]} opacity={1 - smooth(seg(t, QUESTION_END - 0.13, QUESTION_END))} />
          <Stage bg="transparent">
            <Caption text="BYD DEMONSTRATION VIDEO" opacity={win(t, QUESTION_T0 + 0.2, QUESTION_END - 0.1, 0.25, 0.3)} />
          </Stage>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// 0:00–0:41 in side view: the vector car after the real clip (hook hop with contact patches), the name, the
// spring/damper press test, the actuator, and the slowed launch with its force diagram, flight and landing.
import React from 'react';
import {C} from '../theme';
import {w} from '../cues';
import {SideCar, bodyToWorld, STRUT_TOP} from '../car/side';
import {Arrow, Pin, Tag} from '../car/parts';
import {AXLE_F, AXLE_R, COM, WHEEL_R} from '../car/geom';
import {Cam, Chip, Label, camKeys, toScreen, World} from '../kit/stage';
import {SideWorld} from '../kit/sideworld';
import {LAUNCH, LaunchState, MTOT, G, sampleLaunch, STATIC} from '../sim/launch';
import {clamp01, easeInOut, easeOut, keys, seg, smooth, warp, win} from '../kit/util';

export const LW = 450; // weight arrow length (mm); road-force arrows use the same scale (two arrows sum to it at rest)
const W = MTOT * G;

/** Side-view state of the launch model at sim time s, in drawing units (mm). */
export const launchPose = (s: number) => {
  const st: LaunchState = sampleLaunch(LAUNCH, Math.max(0, s));
  const dz = (st.zb - LAUNCH[0].zb) * 1000;
  const wz = (st.zw - STATIC.zw) * 1000;
  return {st, dz, wz, force: Math.max(-1, Math.min(1, st.Fa / 30e3))};
};

// The opening framing must match the real clip (see footage.tsx); this is the side-view framing used throughout.
export const CAM_WIDE: Cam = {x: 0, y: 700, z: 0.3};
export const CAM_DIAG: Cam = {x: -60, y: 640, z: 0.335};

export const T = {
  suspension: w('b1', 'suspension'),
  launches: w('b1', 'launches'),
  lose: w('b1', 'lose'),
  grip: w('b1', 'grip'),
  so: w('b1', 'so'),
  name: w('b2', 'this'),
  ordinary: w('b2', 'ordinary'),
  release: w('b2', 'release'),
  dampers: w('b2', 'dampers'),
  motion: w('b2', 'motion'),
  adds: w('b2', 'adds'),
  powered: w('b2', 'powered'),
  between: w('b2', 'between'),
  bodyEnd: w('b2', 'body'),
  during: w('b2', 'during'),
  tiresPush: w('b2', 'tires'),
  back: w('b2', 'back', 0),
  that: w('b2', 'that'),
  accelerates: w('b2', 'accelerates'),
  once: w('b2', 'once'),
  lift: w('b2', 'lift'),
  stops: w('b2', 'stops'),
  momentum: w('b2', 'momentum'),
  gravity: w('b2', 'gravity'),
  then: w('b2', 'then'),
  down: w('b2', 'down'),
  now: w('b3', 'now'),
};

// Slow-motion maps from video time to model time. Takeoff in the hook falls on "lose their grip"; in the launch it
// falls on "lift clear", and the flight is one uniform slow-motion so up and down take the same time.
const HOOK_WARP: [number, number][] = [[4.4, 0.45], [5.6, 0.92], [T.grip - 0.15, 1.104], [T.grip + 0.75, 1.404], [T.grip + 1.75, 1.9], [T.grip + 3, 3.0]];
const take = T.lift - 0.05;
const land = T.down + 0.15;
const LAUNCH_WARP: [number, number][] = [[T.during - 0.1, 0.45], [T.tiresPush + 0.2, 0.92], [T.tiresPush + 1.2, 0.975], [T.accelerates + 1.0, 1.07], [take, 1.104], [land, 1.404], [land + 0.8, 1.62], [land + 1.4, 1.9], [land + 3, 3.0]];
export const GO_T = T.down + 1.3;
/** The car drives off after the landing settles (and drags the next shot in behind it). */
export const launchCarX = (t: number) => (t > GO_T ? 0.5 * 14000 * (t - GO_T) ** 2 : 0);
export const simTime = (t: number) => (t < 10.5 ? warp(t, HOOK_WARP) : warp(t, LAUNCH_WARP));

// Hand-press test (rear corner): press, release, damped rebound.
const PRESS_IN = T.ordinary + 0.75, PRESS_OUT = T.release - 0.05;
const pressD = (t: number) => {
  if (t < PRESS_IN) return 0;
  if (t < PRESS_OUT) return -58 * easeInOut(seg(t, PRESS_IN, PRESS_OUT - 0.1));
  const tau = t - PRESS_OUT;
  const wn = 2 * Math.PI * 1.05, z = 0.27, wd = wn * Math.sqrt(1 - z * z);
  return -58 * Math.exp(-z * wn * tau) * (Math.cos(wd * tau) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tau));
};
export const LAUNCH_EV = {hookTake: T.grip - 0.15, hookLand: T.grip + 0.75, take, land, press: PRESS_IN, release: PRESS_OUT};
const pressV = (t: number) => (pressD(t + 1 / 60) - pressD(t - 1 / 60)) * 30;
// Actuator demo: pushes the rear body corner up while pushing the wheel down
const actD = (t: number) => 34 * smooth(seg(t, T.between - 0.2, T.between + 0.5)) * (1 - smooth(seg(t, T.bodyEnd + 0.35, T.during)));

export const SideLaunch: React.FC<{t: number}> = ({t}) => {
  // ---------------------------------------------------------------- camera
  const corner: Cam = {x: AXLE_R - 60, y: 690, z: 0.74};
  const cam = camKeys(t, [
    [0, CAM_WIDE],
    [T.so, CAM_WIDE],
    [T.so + 2.2, {x: 0, y: 760, z: 0.27}],
    [T.ordinary - 0.35, {x: 0, y: 760, z: 0.27}],
    [T.ordinary + 0.55, corner],
    [T.bodyEnd + 0.1, {...corner, x: corner.x + 60, z: 0.78}],
    [T.during + 0.5, CAM_DIAG],
    [T.down + 0.6, CAM_DIAG],
  ], easeInOut);
  const px = cam.z;

  // ---------------------------------------------------------------- car state
  const inHook = t < 10.5;
  const s = simTime(t);
  const lp = launchPose(s);
  let dz = lp.dz, pitch = 0, wf = lp.wz, wr = lp.wz, forceF = lp.force, forceR = lp.force;
  // press test and actuator demo (rear corner moves, front stays): rotate about the front axle
  if (t > T.ordinary && t < T.during) {
    const d = pressD(t) + actD(t);
    const th = -d / 2900;
    pitch = (th * 180) / Math.PI;
    dz = -(AXLE_F - COM.x) * th;
    wf = 0;
    wr = 0;
    forceR = actD(t) > 0.5 ? clamp01(actD(t) / 30) : 0;
    forceF = 0;
  }
  // drive away after the landing settles
  const carX = launchCarX(t);
  const rot = -(carX / (2 * Math.PI * WHEEL_R)) * 360;

  const cutaway = Math.max(
    smooth(seg(t, T.launches - 0.25, T.launches + 0.55)) * (1 - smooth(seg(t, T.so + 0.4, T.so + 1.4))),
    smooth(seg(t, T.ordinary - 0.2, T.ordinary + 0.4)) * (1 - smooth(seg(t, GO_T, GO_T + 0.6))),
  );
  const actuator = t > 10.5 ? smooth(seg(t, T.adds - 0.1, T.adds + 0.7)) : 1;
  const springGlow = t > T.ordinary && t < T.adds ? clamp01(-pressD(t) / 45) : 0;
  const damperGlow = t > PRESS_OUT && t < T.adds ? clamp01(Math.abs(pressV(t)) / 140) : 0;

  // ---------------------------------------------------------------- forces (whole-car diagram: only external forces)
  const diag = t > 10.5 ? win(t, T.during - 0.2, GO_T + 0.2, 0.5, 0.4) : 0;
  const Nax = lp.st.N / 2 / W; // per axle, in weights
  const com = bodyToWorld({x: carX, dz, pitch}, COM.x, COM.y);
  const v = lp.st.vb; // m/s
  const motionVis = t > 10.5 ? smooth(seg(t, T.that, T.accelerates)) * (1 - smooth(seg(t, land + 0.2, land + 0.8))) : 0;
  const pushPair = win(t, T.tiresPush - 0.1, T.back + 0.9, 0.3, 0.5);
  const grounded = !lp.st.air;
  const patches = inHook ? win(t, T.lose - 0.35, T.grip - 0.15, 0.2, 0.08) : 0;
  const noContactHook = inHook && lp.st.air ? 1 : 0;
  const noContact = (t > 10.5 && lp.st.air ? 1 : 0) * diag;
  const ax = [carX + AXLE_R, carX + AXLE_F];

  // ---------------------------------------------------------------- hand for the press test (screen space)
  const handPt = bodyToWorld({x: carX, dz, pitch}, -1980, 1030);
  const hs = toScreen(cam, handPt[0], handPt[1]);
  const handIn = seg(t, PRESS_IN - 0.45, PRESS_IN), handOut = seg(t, PRESS_OUT, PRESS_OUT + 0.35);
  const handLift = (1 - easeOut(handIn)) * 420 + easeInOut(handOut) * 520;
  const handVis = t > PRESS_IN - 0.5 && t < PRESS_OUT + 0.4;

  const labelPos = (wx: number, wy: number) => toScreen(cam, wx, wy);
  const cs = labelPos(com[0], com[1]);
  return (
    <g>
      <SideWorld cam={cam} />
      <World cam={cam}>
        {/* contact patches (hook) */}
        {patches > 0 && grounded && ax.map((x, i) => <ellipse key={i} cx={x} cy={4} rx={190} ry={44} fill={C.teal} opacity={0.85 * patches} stroke={C.ink} strokeWidth={3 / px} />)}
        <SideCar x={carX} dz={dz} pitch={pitch} wf={wf} wr={wr} rot={rot} px={px} cutaway={cutaway} actuator={actuator} forceF={forceF * diag + (t < 10.5 ? 0 : 0)} forceR={forceR} springGlow={springGlow} damperGlow={damperGlow} id="launch" />
        {/* actuator demo arrows: equal and opposite, on the body mount and on the hub */}
        {(() => {
          const a = win(t, T.between - 0.25, T.bodyEnd + 0.4, 0.25, 0.3);
          if (a <= 0) return null;
          const top = bodyToWorld({x: carX, dz, pitch}, AXLE_R, STRUT_TOP);
          return (
            <g>
              <Arrow x={top[0] + 150} y={top[1] + 20} dx={0} dy={230} px={px} color={C.teal} opacity={a} />
              <Arrow x={carX + AXLE_R + 150} y={WHEEL_R - 20} dx={0} dy={-230} px={px} color={C.teal} opacity={a} />
            </g>
          );
        })()}
        {/* COM marker and the whole-car forces */}
        {diag > 0 && (
          <g opacity={diag}>
            <circle cx={com[0]} cy={com[1]} r={58} fill={C.white} stroke={C.ink} strokeWidth={3.5 / px} />
            <path d={`M ${com[0]} ${com[1]} L ${com[0] + 58} ${com[1]} A 58 58 0 0 1 ${com[0]} ${com[1] + 58} Z M ${com[0]} ${com[1]} L ${com[0] - 58} ${com[1]} A 58 58 0 0 1 ${com[0]} ${com[1] - 58} Z`} fill={C.ink} />
            <Arrow x={com[0]} y={com[1] - 70} dx={0} dy={-(LW - 70)} px={px} color={C.blue} width={16} />
            {/* road on tyres: tips at the contact patches */}
            {ax.map((x, i) => (
              <Arrow key={i} x={x + 70} y={-Nax * LW - 10} dx={0} dy={Nax * LW} px={px} color={C.teal} width={16} opacity={Nax > 0.01 ? 1 : 0} />
            ))}
            {/* tyres on road (the other half of the pair), only while the narration names it */}
            {ax.map((x, i) => (
              <Arrow key={`p${i}`} x={x - 90} y={-6} dx={0} dy={-Nax * LW} px={px} color={C.inkMuted} width={12} opacity={pushPair * (Nax > 0.01 ? 1 : 0)} />
            ))}
            {/* motion (velocity), dashed */}
            <Arrow x={com[0] - 140} y={com[1]} dx={0} dy={v * 330} px={px} color={C.saffronDeep} kind="motion" width={16} opacity={motionVis * (Math.abs(v) > 0.05 ? 1 : 0)} />
          </g>
        )}
        {/* the name, pinned above the roof */}
        <Pin x={carX - 300} y={1700} px={px} opacity={win(t, T.name - 0.1, T.ordinary - 0.4, 0.3, 0.3)}>
          <Tag text="BYD YANGWANG U9" size={40} color={C.white} />
        </Pin>
      </World>

      {/* hand pressing the rear deck: a crew sleeve reaching in from above */}
      {handVis && (
        <g transform={`translate(${hs.x} ${hs.y - handLift})`}>
          <path d="M 36 -40 C 60 -260 90 -520 110 -760 L 220 -760 C 190 -520 140 -250 96 -30 Z" fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M 30 -60 C 50 -80 100 -78 108 -50 L 100 -20 C 80 -40 50 -40 34 -26 Z" fill={C.cream} stroke={C.ink} strokeWidth={4} />
          <ellipse cx={58} cy={-8} rx={62} ry={30} fill="#F2C9A8" stroke={C.ink} strokeWidth={5} />
          <ellipse cx={8} cy={-14} rx={20} ry={14} fill="#F2C9A8" stroke={C.ink} strokeWidth={4} />
        </g>
      )}

      {/* labels (screen space) */}
      {(() => {
        const sp = labelPos(carX + AXLE_R, 600);
        const top = bodyToWorld({x: carX, dz, pitch}, AXLE_R - 60, 640);
        const tp = labelPos(top[0], top[1]);
        const damp = bodyToWorld({x: carX, dz, pitch}, AXLE_R + 40, 760);
        const dp = labelPos(damp[0], damp[1]);
        const act = bodyToWorld({x: carX, dz, pitch}, AXLE_R + 120, 700);
        const ap = labelPos(act[0], act[1]);
        return (
          <g>
            <CalloutL x={sp.x - 470} y={sp.y - 300} tx={tp.x - 20} ty={tp.y} text="SPRING" color={C.saffronLight} opacity={win(t, T.ordinary + 0.3, T.adds, 0.3, 0.3)} />
            <CalloutL x={sp.x - 420} y={sp.y - 150} tx={dp.x - 10} ty={dp.y + 40} text="DAMPER" color={C.blueLight} opacity={win(t, T.dampers - 0.1, T.adds, 0.3, 0.3)} />
            <CalloutL x={sp.x + 470} y={sp.y - 330} tx={ap.x + 40} ty={ap.y} text="POWERED ACTUATOR" color={C.tealLight} opacity={win(t, T.powered - 0.1, T.during, 0.3, 0.3)} />
          </g>
        );
      })()}
      {/* force labels for the whole-car diagram, each beside its arrow */}
      {(() => {
        const wl = labelPos(com[0] + 90, com[1] - LW * 0.5);
        const rf = labelPos(carX + AXLE_F + 150, -Nax * LW * 0.5 - 10);
        const pp = labelPos(carX + AXLE_R - 140, -Nax * LW * 0.5 - 10);
        const mv = labelPos(com[0] - 190, com[1] + Math.max(120, v * 330 * 0.6));
        const on = smooth(seg(t, T.during, T.during + 0.5));
        return (
          <g>
            <LabelL x={wl.x} y={wl.y} text="GRAVITY" color={C.blueLight} opacity={diag * on} />
            <LabelL x={rf.x} y={rf.y} text={t > T.back - 0.3 && t < T.that ? 'ROAD PUSHES BACK' : 'ROAD FORCE'} color={C.tealLight} opacity={diag * on * (Nax > 0.02 ? 1 : 0)} />
            <LabelR x={pp.x} y={pp.y} text="TIRES PUSH ON ROAD" color={C.white} opacity={pushPair * diag} />
            <LabelR x={mv.x} y={mv.y} text="MOTION" color={C.saffronLight} opacity={motionVis * diag * (Math.abs(v) > 0.05 ? 1 : 0)} />
            <Label x={960} y={130} text="ROAD FORCE > GRAVITY" color={C.tealLight} size={44} opacity={win(t, T.accelerates - 0.2, take - 0.1, 0.3, 0.25)} />
          </g>
        );
      })()}
      {/* NO TIRE CONTACT: hook and launch */}
      {(() => {
        const p = labelPos(carX, -330);
        return <Label x={p.x} y={p.y + 30} text="NO TIRE CONTACT" color={C.coral} fg={C.white} size={38} opacity={Math.max(noContactHook, noContact)} />;
      })()}
      <Chip x={40} y={40} text="SLOWED DOWN" opacity={Math.max(win(t, 4.6, T.so + 1.2, 0.3, 0.4), win(t, T.during - 0.1, GO_T, 0.3, 0.4))} />
      <Chip x={40} y={92} text="SIMPLIFIED" opacity={cutaway * 0.95} dark={false} size={22} />
    </g>
  );
};

/** Screen-space callout (label with a leader to a point). */
const CalloutL: React.FC<{x: number; y: number; tx: number; ty: number; text: string; color: string; opacity: number}> = ({x, y, tx, ty, text, color, opacity}) => {
  if (opacity <= 0.001) return null;
  const size = 34;
  const wd = text.length * size * 0.6 + size * 1.1;
  const h = size * 1.55;
  return (
    <g opacity={opacity}>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={tx} cy={ty} r={8} fill={C.ink} />
      <rect x={x - wd / 2} y={y - h / 2} width={wd} height={h} rx={h * 0.3} fill={color} stroke={C.ink} strokeWidth={4} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily="'Fredoka Variable'" fontWeight={700} fontSize={size} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

/** Labels anchored by their left (LabelL) or right (LabelR) edge, vertically centred. */
const LabelL: React.FC<{x: number; y: number; text: string; color: string; opacity: number; size?: number}> = ({x, y, text, color, opacity, size = 34}) => {
  if (opacity <= 0.001) return null;
  const wd = text.length * size * 0.6 + size * 1.1;
  return <Label x={x + wd / 2} y={y} text={text} color={color} size={size} opacity={opacity} />;
};
const LabelR: React.FC<{x: number; y: number; text: string; color: string; opacity: number; size?: number}> = ({x, y, text, color, opacity, size = 34}) => {
  if (opacity <= 0.001) return null;
  const wd = text.length * size * 0.6 + size * 1.1;
  return <Label x={x - wd / 2} y={y} text={text} color={color} size={size} opacity={opacity} />;
};

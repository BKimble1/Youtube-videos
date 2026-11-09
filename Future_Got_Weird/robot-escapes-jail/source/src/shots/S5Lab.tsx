// S5 — RETURN TO SOLID (13.55–17.02 s): "Then scientists collected the metal and molded it back into shape."
//
// MATCH CUT (object): S4's last frames are the silver puddle puddleOutline(540, 1040, 300, 140, t, 7) drawn with
// LiquidMetal; our first frame draws the SAME outline with LiquidMetal (same default bevel), now lying in a glass
// collection dish on a bright lab bench (a deliberate contrast to the dark jail), seen from above at a steep angle.
// The puddle is defined ON the bench (bench px, radius 300) and the camera's start state (Z 1, k = 140/300, the dish
// centre at screen (540, 1040)) maps it exactly onto that outline. A two-part orange silicone mold waits below the dish.
//
// Beats (every step done by the scientist's gloved hands; nothing happens on its own):
//   13.75–14.45  the right hand brings in a transfer pipette, squeezes the bulb (expels air) and dips the tip in the puddle
//   "collected" 14.47  releases the bulb: the puddle shrinks toward the tip as the barrel fills silver (volume reads 1:1)
//   14.95–15.45  lifts and carries it to the mold; the camera follows, tilting to straight down and pushing in
//   "molded" 15.43  squeezes: the silver fills the robot-shaped cavity from the feet up while the barrel empties
//   15.55–16.02  the left hand takes the lid's pull tab and flips the lid half closed (the pipette leaves)
//   16.02–16.32  cooling (passive, room air): a cool frost shimmer sweeps the closed mold, cold wisps, the window light
//                slides across the bench (time passing)
//   16.28–16.48  the fingers flip the lid back open: the re-formed SOLID figure lies in the cavity, eyes dark
//   "shape" 16.47  its cyan eyes light up, then a smug squint at us
//   16.56–16.87  the camera dives into its chest; MetalSurface fades in inside the torso; the last 5 frames
//                (t >= 16.865) are the full-frame <MetalSurface t={t}/> (S5 -> S6 contract)
import React from 'react';
import {EYE, LiquidMetal, MetalSurface, V, puddleOutline, smoothPath, polyPath} from '../art/liquid';
import {Robot, POSE_IDLE, POSE_SMUG, RobotPose, mixPose, robotEyeScreen} from '../art/robot';
import {
  BenchCam, ColdWisps, DishBack, DishFront, GloveArm, LabRoom, LAB_ENV, MOLD, MoldBase, MoldLid, Pipette, PIPETTE_GRIP,
  benchPt, lidTab, LidTabShape, moldTopMap, pinchWrist, robotSilhouette, silToFace,
} from '../art/lab';
import {HandPose, mixHand} from '../dc/Hand';
import {C, INK} from '../art/palette';
import {uid} from '../core/ids';
import {clamp, keyS, lerp, ss, ss5} from '../lib';
import {SHOTS, T} from '../story';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};

const T0 = SHOTS.S5[0];
const K0 = 140 / 300; // camera start: the bench foreshortening that maps the radius-300 bench puddle onto 300 x 140
const ROBOT_X = MOLD.hinge + MOLD.w / 2; // the figure's centre line on the bench
const CHEST_V = MOLD.feetV - 5.26 * MOLD.sb; // torso centre (robot h 5.26) on the bench
const DIVE0 = 16.59, DIVE1 = 16.865; // the push into the chest; from DIVE1 on: full-frame MetalSurface. DIVE0 is set so
// that the eyes jump the caption band (y 250-420) between two frames (501: y 505 -> 502: y 129) instead of sitting under it
const Z_END = 31;
const Z_MOLD = 1.65, Z_REV = 2.0; // over the mold (fill, lid) / at the reveal
const PIP_K = 0.8; // pipette scale (bench px -> pipette units)
const CHEAP_T = 16.75; // from here on (s > 300 px/u) the figure is drawn without robot.tsx's filters
const MS0 = DIVE0 + 0.04, MS1 = DIVE0 + 0.165; // MetalSurface fades in inside the torso

// ---- beat times (all keyed to the narration) ----
const B = {
  inA: 13.64, // pipette hand starts coming in
  pre: T.collected - 0.33, // squeeze the bulb before dipping
  dip: T.collected - 0.05, // tip in the puddle
  draw0: T.collected + 0.03, // release: the metal is drawn up
  draw1: T.collected + 0.45,
  lift: T.collected + 0.5,
  travel1: T.molded - 0.1, // over the cavity
  disp0: T.molded + 0.03, // squeeze: fill the mold
  disp1: T.molded + 0.3,
  out0: T.molded + 0.32,
  lid0: T.molded + 0.37, // lid flips closed (15.80 -> 16.01)
  lid1: T.molded + 0.58,
  cool0: T.molded + 0.58, // 16.01: cooling (passive)
  cool1: T.molded + 0.82,
  open0: T.molded + 0.78, // 16.21: lid flips open, so the re-formed figure is on show before "shape"
  open1: T.molded + 0.97,
  eyes: T.shape, // 16.47 eyes light up
};

// ---------------------------------------------------------------------------------------------------------------
// camera (sums of overlapping C2 moves, so velocity carries from beat to beat)
export const camAt = (t: number): BenchCam => {
  const mv = (a: number, b: number) => ss5(t, a, b);
  const cx = 0 + 30 * mv(13.6, 14.8) + (-10 - 30) * mv(14.92, 15.55) + (ROBOT_X - -10) * mv(15.5, 16.5);
  const cz = 0 + 20 * mv(13.6, 14.8) + (640 - 20) * mv(14.92, 15.55) + (CHEST_V - 640) * mv(DIVE0 - 0.05, DIVE1);
  const lz =
    Math.log(1.08) * mv(13.6, 14.8) +
    Math.log(1.06) * mv(14.4, 15.05) +
    Math.log(Z_MOLD / (1.08 * 1.06)) * mv(14.92, 15.55) +
    Math.log(Z_REV / Z_MOLD) * mv(15.5, 16.5) +
    Math.log(Z_END / Z_REV) * mv(DIVE0, DIVE1);
  const k = K0 + (1 - K0) * mv(14.9, 15.5);
  const oy = 1040 - 70 * mv(14.92, 15.55) - 10 * mv(DIVE0 - 0.05, DIVE1) + 0 * t;
  return {cx, cz, Z: Math.exp(lz), k, oy};
};

// ---------------------------------------------------------------------------------------------------------------
// the pipette (tip on the bench, bench px + height) and its state
const TIP_KEYS: [number, number, number, number][] = [
  // t, bx, bz, h
  [B.inA, 760, -40, 210],
  [B.pre - 0.02, 120, -12, 110],
  [B.dip, 92, 0, 4],
  [B.draw1 + 0.02, 92, 0, 6],
  [B.lift + 0.14, 92, 20, 150],
  [B.travel1, ROBOT_X - 10, MOLD.feetV - 10, 120],
  [B.disp0 - 0.01, ROBOT_X - 14, MOLD.feetV - 14, 26],
  [B.disp1 + 0.03, ROBOT_X - 14, MOLD.feetV - 14, 30],
  [B.out0 + 0.1, ROBOT_X + 40, MOLD.feetV - 40, 180],
  [B.out0 + 0.42, 820, 520, 320],
];
const key = (t: number, i: number) => keyS(t, TIP_KEYS.map((k) => [k[0], k[i]] as [number, number]));
const tipAt = (t: number) => ({x: key(t, 1), z: key(t, 2), h: key(t, 3)});
/** collected fraction (drawn up into the barrel) and dispensed fraction */
const collectAt = (t: number) => ss(t, B.draw0, B.draw1);
const dispenseAt = (t: number) => ss(t, B.disp0, B.disp1);
const squeezeAt = (t: number) => ss(t, B.pre, B.pre + 0.16) - ss(t, B.draw0, B.draw0 + 0.25) + ss(t, B.disp0 - 0.02, B.disp0 + 0.14) - ss(t, B.out0 + 0.15, B.out0 + 0.4);
/** pipette screen angle (deg): tip -> bulb; bulb up-right over the dish, down-right over the mold */
const pipAngAt = (t: number) => -40 - 28 * ss5(t, B.lift, B.travel1) + 6 * Math.sin((t - 13.5) * 2.1) * (1 - ss(t, B.pre, B.dip));
/** the fill level in the cavity, 0..1 (feet -> head) */
const levelAt = (t: number) => ss(t, B.disp0 + 0.02, B.disp1 + 0.03);

// ---------------------------------------------------------------------------------------------------------------
// the lid hand + lid angle
const lidAngAt = (t: number) => {
  const close = ss5(t, B.lid0, B.lid1);
  const flop = 6 * Math.exp(-(t - B.lid1) / 0.05) * Math.sin(((t - B.lid1) / 0.09) * Math.PI) * (t > B.lid1 ? 1 : 0);
  const open = ss5(t, B.open0, B.open1);
  return clamp(180 * close - flop - 180 * open, 0, 180);
};

/** the lid hand: relaxed on the way in, a firm pinch on the tab from just before the flip until it lets go */
const lidPoseAt = (t: number): HandPose => {
  const grip = ss(t, B.lid0 - 0.1, B.lid0) * (1 - ss(t, B.open1, B.open1 + 0.06));
  return mixHand(
    {curl: [0.35, 0.5, 0.6, 0.65], spread: 0.3, thumb: 42, thumbCurl: 0.3},
    {curl: [0.6, 0.8, 0.9, 0.95], spread: 0.12, thumb: 22, thumbCurl: 0.45},
    grip,
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the robot figure (lying in the cavity, seen from above = its front view)
const SIL_POSE = POSE_IDLE; // the cavity is cast around the idle pose
const SIL = robotSilhouette(SIL_POSE);
const TORSO_I = SIL.findIndex((p) => p.kind === 'torso');
const figPose = (t: number): RobotPose => {
  const on = ss(t, B.eyes, B.eyes + 0.06);
  const smug = ss(t, B.eyes + 0.05, B.eyes + 0.16);
  // only the face moves once it is revealed: eyes light, a pop, then the mischievous squint and a small head tilt
  const base: RobotPose = {...SIL_POSE, glow: on, eyeOpen: 1 + 0.18 * Math.sin(Math.PI * ss(t, B.eyes, B.eyes + 0.12))};
  const sm: RobotPose = {...base, mood: 1, headTilt: 0, headTurn: 0, lookX: 0.05, lookY: -0.05, eyeOpen: 1};
  void POSE_SMUG;
  return mixPose(base, sm, smug);
};

// ---------------------------------------------------------------------------------------------------------------
const Scene: React.FC<{t: number}> = ({t}) => {
  if (t >= DIVE1) {
    return (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <MetalSurface t={t} />
      </svg>
    );
  }
  const c = camAt(t);
  const top = moldTopMap(c);
  const P = (bx: number, bz: number, h = 0) => benchPt(c, bx, bz, h);

  // ---- puddle in the dish (bench coords; exact S4 outline while untouched)
  const col = collectAt(t);
  const tip = tipAt(t);
  const rem = 1 - col;
  const puddle: V[][] = [];
  if (rem > 0.004) {
    const k = Math.sqrt(rem);
    const pull = 1 - k;
    const pcx = lerp(0, tip.x, pull), pcz = lerp(0, tip.z, pull);
    const ring = puddleOutline(pcx, pcz, 300 * k, 300 * k, t, 7);
    puddle.push(ring.map((q) => {
      const s = P(q.x, q.y, 0);
      return {x: s.x, y: s.y};
    }));
  }
  const dipK = ss(t, B.dip - 0.04, B.dip + 0.02) * (1 - ss(t, B.lift, B.lift + 0.1));
  const ripple = 0.5 * ss(t, B.dip - 0.05, B.dip) * (1 - ss(t, B.dip + 0.1, B.draw1));

  // ---- pipette
  const tipS = P(tip.x, tip.z, tip.h);
  const ang = pipAngAt(t);
  const pipSc = c.Z * tipS.m * PIP_K;
  const fillB = clamp(col - dispenseAt(t));
  const sq = clamp(squeezeAt(t));
  const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const nrm = {x: -dir.y, y: dir.x};
  const bulb = {x: tipS.x + dir.x * PIPETTE_GRIP * pipSc, y: tipS.y + dir.y * PIPETTE_GRIP * pipSc};
  const HL = 360 * pipSc; // hand size (wrist -> middle fingertip), px
  // pinch grip: index fingertip + thumb tip around the bulb; the squeeze closes the pinch
  const pipPose: HandPose = {curl: [0.42 + 0.12 * sq, 0.62 + 0.06 * sq, 0.72, 0.8], spread: 0.2, thumb: 30 - 8 * sq, thumbCurl: 0.35 + 0.15 * sq};
  const pipHandAng = ang + 180 + 75; // the hand wraps the bulb from below-right, the bulb's end showing
  const wristP = pinchWrist(bulb, pipHandAng, HL, 1, pipPose);
  const pipOn = t < B.out0 + 0.42;

  // ---- mold: liquid fill / figure / lid
  const theta = lidAngAt(t);
  const lv = levelAt(t);
  const fillOn = lv > 0.002 && t < B.open0 - 0.03; // swapped for the solid figure while the lid is shut
  const figOn = t >= B.open0 - 0.03;
  const feet = top(MOLD.w / 2, MOLD.feetV);
  const mTop = benchPt(c, ROBOT_X, MOLD.feetV, MOLD.tau).m;
  const sR = c.Z * MOLD.sb * mTop; // px per robot unit
  const silScreen = SIL.map((p) => p.pts.map((q) => {
    const f = silToFace(MOLD, q);
    return top(f.x, f.y);
  }));
  let fillEl: React.ReactNode = null;
  if (fillOn) {
    // clip below the (gently sloshing) level line, in face-local units -> screen
    const vL = MOLD.feetV + 10 - lv * (10.7 * MOLD.sb);
    const pts: V[] = [];
    for (let i = 0; i <= 16; i++) {
      const u = -40 + ((MOLD.w + 80) * i) / 16;
      pts.push(top(u, vL + 5 * Math.sin(u * 0.05 + t * 14) * (1 - ss(lv, 0.85, 1))));
    }
    pts.push(top(MOLD.w + 40, MOLD.z1 + 60), top(-40, MOLD.z1 + 60));
    const clipId = uid('s5fc'), silClip = uid('s5sc');
    const meniscus = 'M' + pts.slice(0, 17).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('L');
    const tipF = top(tip.x - MOLD.hinge, tip.z);
    fillEl = (
      <g>
        <defs>
          <clipPath id={clipId}>
            <path d={polyPath(pts)} />
          </clipPath>
          <clipPath id={silClip}>
            {silScreen.map((q, i) => <path key={i} d={SIL[i].smooth ? smoothPath(q) : polyPath(q)} />)}
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <LiquidMetal pts={silScreen} t={t} env={LAB_ENV} px={sR * 0.3} ripple={0.4 * (1 - ss(lv, 0.8, 1))} />
        </g>
        {/* the advancing meniscus: a bright wet edge (with an ink line) across the cavity, inside the figure's outline */}
        {lv < 0.985 && (
          <g clipPath={`url(#${silClip})`}>
            <path d={meniscus} fill="none" stroke={INK} strokeWidth={2.4} transform="translate(0 2)" opacity={0.7} />
            <path d={meniscus} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(2, sR * 0.07)} strokeLinecap="round" />
          </g>
        )}
        {/* rings where the stream enters */}
        {lv < 0.97 &&
          [0, 1].map((i) => {
            const ph = (t * 3 + i * 0.5) % 1;
            return <ellipse key={i} cx={tipF.x} cy={tipF.y} rx={sR * (0.4 + 1.4 * ph)} ry={sR * (0.25 + 0.8 * ph) * c.k} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.6 * (1 - ph) * (1 - ss(lv, 0.8, 0.97))} />;
          })}
      </g>
    );
  }
  let figEl: React.ReactNode = null;
  if (figOn) {
    const pose = figPose(t);
    const sy = c.k;
    // deep in the dive (s > ~300 px/u) robot.tsx's liquid filters cost ~20 s/frame: by then the chest is MetalSurface
    // and only the edges of the arms / head / pelvis remain on screen, drawn with flat chrome fills instead
    const cheap = t >= CHEAP_T;
    figEl = (
      <g transform={sy < 0.999 ? `translate(${feet.x} ${feet.y}) scale(1 ${sy.toFixed(4)}) translate(${-feet.x} ${-feet.y})` : undefined}>
        {cheap ? (
          <CheapFigure parts={silScreen} sR={sR} />
        ) : (
          <Robot x={feet.x} y={feet.y} s={sR} t={t} pose={pose} env={LAB_ENV} />
        )}
        <DarkEyes x={feet.x} y={feet.y} s={sR} pose={pose} k={1 - ss(t, B.eyes, B.eyes + 0.05)} />
      </g>
    );
  }

  // frost + time-lapse light
  const frostP = ss(t, B.cool0, B.cool1);
  const frostK = ss(t, B.cool0 - 0.03, B.cool0 + 0.06) * (1 - ss(t, B.open0 + 0.05, B.open0 + 0.2));
  const light = ss(t, B.cool0 - 0.05, B.cool1 + 0.05);
  const wispK = ss(t, B.cool0, B.cool0 + 0.1) * (1 - ss(t, B.open0, B.open1));

  // ---- lid hand (left), holding the pull tab
  const tab = lidTab(c, theta);
  const lidIn = ss5(t, B.lid0 - 0.26, B.lid0 - 0.02);
  const lidOut = ss5(t, B.open1 + 0.02, B.open1 + 0.26);
  const LL = 235 * c.Z * tab.m;
  // the forearm always points back at the scientist's elbow, below the frame on the near side of the bench (bench
  // coords, so it rides with the camera): as the tab arcs over the hinge the arm pivots there (about 30 deg), it never
  // swings its root across the frame
  const elbow = P(MOLD.hinge + 20, MOLD.z1 + 760, 160);
  const towardTab = (q: {x: number; y: number}) => (Math.atan2(q.y - elbow.y, q.x - elbow.x) * 180) / Math.PI;
  const handAng = towardTab(pinchWrist(tab, towardTab(tab), LL, 1, lidPoseAt(t)));
  const away = {x: -Math.cos((handAng * Math.PI) / 180), y: -Math.sin((handAng * Math.PI) / 180)};
  const off = (1 - lidIn) + lidOut; // 0 = on the tab, 1 = off-screen
  const lidPose = lidPoseAt(t);
  const press = 0.05 * LL * Math.sin(Math.PI * ss(t, B.lid1, B.lid1 + 0.14));
  const pinchAt = pinchWrist(tab, handAng, LL, 1, lidPose);
  const lidWrist = {x: pinchAt.x + away.x * LL * 2.4 * off, y: pinchAt.y + away.y * LL * 2.4 * off + press};
  const lidHandOn = t > B.lid0 - 0.27 && t < B.open1 + 0.27;

  // ---- dive: MetalSurface fades in inside the torso as the chest fills the frame
  const torsoD = smoothPath(silScreen[TORSO_I]);
  const msK = ss(t, MS0, MS1);

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <LabRoom c={c} t={t} light={light} />
      <DishBack c={c} />
      {puddle.length > 0 && (
        <LiquidMetal pts={puddle} t={t} env={LAB_ENV} ripple={ripple} />
      )}
      {dipK > 0.01 && puddle.length > 0 && (
        <ellipse cx={P(tip.x, tip.z, 0).x} cy={P(tip.x, tip.z, 0).y} rx={c.Z * 18} ry={c.Z * 18 * c.k} fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.7 * dipK} />
      )}
      <DishFront c={c} />
      <MoldBase c={c} sil={SIL}>
        {fillEl}
        {figEl}
      </MoldBase>
      <MoldLid c={c} theta={theta} sil={SIL} frost={frostP} frostK={frostK} t={t} />
      <ColdWisps x0={P(MOLD.hinge + 30, 0).x} x1={P(MOLD.hinge + MOLD.w - 30, 0).x} y={P(0, lerp(MOLD.z0, MOLD.z1, 0.45), MOLD.tau * 2).y} k={wispK * 0.6} t={t} s={c.Z * 0.6} />
      {pipOn && (
        <g>
          <Pipette tip={tipS} ang={ang} sc={pipSc} fill={fillB} squeeze={sq} t={t} part="tube" />
          <GloveArm wrist={wristP} ang={pipHandAng} L={HL} pose={pipPose} thumbSide={1} hold={{front: [0, 't'], obj: <Pipette tip={tipS} ang={ang} sc={pipSc} fill={fillB} squeeze={sq} t={t} part="bulb" />}} />
        </g>
      )}
      {lidHandOn && <GloveArm wrist={lidWrist} ang={handAng} L={LL} pose={lidPose} thumbSide={1} hold={off < 0.15 ? {front: [0, 't'], obj: <LidTabShape c={c} theta={theta} />} : undefined} />}
      {msK > 0.001 && <TorsoMetal d={torsoD} t={t} k={msK} />}
    </svg>
  );
};

/** flat chrome stand-in for the figure's limbs and head at extreme zoom (the torso is covered by MetalSurface) */
const CheapFigure: React.FC<{parts: V[][]; sR: number}> = ({parts}) => {
  const ds = parts.map((p, i) => (SIL[i].smooth ? smoothPath(p) : polyPath(p)));
  const idL = uid('s5cl'), idH = uid('s5ch');
  const head = SIL.length - 1;
  return (
    <g>
      <defs>
        {/* the chrome cylinder ramp of robot.tsx's CapFill / TorsoFill (lit left, dark band right of centre) */}
        <linearGradient id={idL} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.chrome} />
          <stop offset="0.2" stopColor={C.silverLit} />
          <stop offset="0.45" stopColor={C.silver} />
          <stop offset="0.64" stopColor={C.silverMid} />
          <stop offset="0.74" stopColor={C.silverDeep} />
          <stop offset="0.84" stopColor={C.silverDark} />
          <stop offset="1" stopColor={C.silverMid} />
        </linearGradient>
        <radialGradient id={idH} gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.56" fx="0.36" fy="0.3">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.25" stopColor={C.silverLit} />
          <stop offset="0.55" stopColor={C.chrome} />
          <stop offset="0.78" stopColor={C.silver} />
          <stop offset="0.92" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverDark} />
        </radialGradient>
      </defs>
      {ds.map((d, i) => <path key={'i' + i} d={d} fill={INK} stroke={INK} strokeWidth={5.6} strokeLinejoin="round" />)}
      {ds.map((d, i) => (i === TORSO_I ? null : <path key={'f' + i} d={d} fill={`url(#${i === head || SIL[i].kind === 'ball' ? idH : idL})`} stroke={INK} strokeWidth={1.5} />))}
    </g>
  );
};

/** unlit eyes: dark glass over the lenses until the figure "wakes" (robot.tsx's eyes stay cyan even at glow 0) */
const DarkEyes: React.FC<{x: number; y: number; s: number; pose: RobotPose; k: number}> = ({x, y, s, pose, k}) => {
  if (k <= 0.01) return null;
  const e = robotEyeScreen(x, y, s, pose);
  return (
    <g opacity={k}>
      {[e.l, e.r].map((q, i) => (
        <g key={i}>
          <ellipse cx={q.x} cy={q.y} rx={EYE.w * s * 1.08} ry={EYE.h * s * 1.06} fill="#1C3B49" stroke="#0E1C2B" strokeWidth={1.2} opacity={0.92} />
          <ellipse cx={q.x - EYE.w * s * 0.35} cy={q.y - EYE.h * s * 0.45} rx={EYE.w * s * 0.22} ry={EYE.h * s * 0.13} fill="#FFFFFF" opacity={0.35} />
        </g>
      ))}
    </g>
  );
};

const TorsoMetal: React.FC<{d: string; t: number; k: number}> = ({d, t, k}) => {
  const id = uid('s5tm');
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} opacity={k}>
        <MetalSurface t={t} />
      </g>
    </g>
  );
};

export const S5: React.FC<{t: number}> = ({t}) => <Scene t={t} />;

// =====================================================================================================================
// SOUND (film seconds; kinds from tools/sfx_lib.py). Transients sit in the gaps between stressed syllables.
// =====================================================================================================================
export const CUES_S5 = (): Cue[] => [
  {t: B.inA + 0.2, kind: 'swish', gain: -6, dur: 0.35},          // the gloved hand brings the pipette in
  {t: B.dip + 0.01, kind: 'drip', gain: -6},                      // tip touches the puddle
  {t: B.draw0 + 0.12, kind: 'pipette', gain: -1},                 // bulb released: suction, the metal is drawn up
  {t: B.draw0 + 0.1, kind: 'flow', gain: -7, dur: 0.45},
  {t: B.lift + 0.1, kind: 'swish', gain: -7, dur: 0.4},           // carried to the mold (camera follows)
  {t: B.disp0 + 0.04, kind: 'glug', gain: -2, dur: 0.35},          // squeezed into the cavity (after "mol-")
  {t: B.lid1 + 0.01, kind: 'pop', gain: -2},                      // the silicone lid flops shut
  {t: B.cool0, kind: 'cool', dur: 0.5, gain: -1},                 // cooling shimmer
  {t: B.open0 + 0.06, kind: 'pipette', gain: -8},                 // the lid peels open
  {t: B.eyes + 0.02, kind: 'reveal', gain: -4},                   // the re-formed figure; eyes light up on "shape"
  {t: B.eyes + 0.12, kind: 'mech_click', variant: 2, gain: -5},    // smug squint
  {t: DIVE0 + 0.06, kind: 'swish', gain: -5, dur: 0.3},           // the dive into the chest
];

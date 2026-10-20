// V4 café interior world: one room, two seated people, one small table with two cups. The shots are cameras into this
// world (wide, two-shot, close-ups, the hands on the table) plus its subjective/red variant. Everything is a pure
// function of time: the acting is keyframes (monotone cubic) over intent-level parameters (torso, head yaw, hand
// targets, cup lift); the arms and legs are solved from those targets every frame by the rig's fixed-length IK with
// a constant elbow side.
import React from 'react';
import {clamp, lerp, rot, V} from '../../lib/math';
import {splineRec, SKey} from '../../lib/motion';
import {EXPR_NEUTRAL, Expr, mixExpr} from '../../art/Head';
import {HAND_RELAXED, HandPose, mixHand} from '../../art/Hand';
import {Cam, Layer} from '../../lib/camera';
import {Man, manJoints} from '../rig/Man';
import {Woman, womanJoints} from '../rig/Woman';
import {Fig, figure} from '../rig/poses';
import {Chair, Cup, PROP, Table} from '../env/Props';
import {FLOOR, InteriorBack, InteriorFloor} from '../env/Interior';
import {Implant4} from '../art/Implant';
import {LensRead, lensA} from '../art/Lens';

export const S = 0.78;
export const TX = 540;
export const HIPX = 345 * S;
export const SEAT_Y = FLOOR - PROP.seatH * S;
export const TABLE_Y = FLOOR - PROP.tableH * S;
export const CUP_S = 0.62;
export const HAND_L = 96 * S;

export const W_HIP = TX - HIPX;
export const M_HIP = TX + HIPX;
export const CUP_W_X = 468;
export const CUP_M_X = 612;
export const CUP_Y = TABLE_Y - 2;

export const GRIP: HandPose = {curl: [0.62, 0.66, 0.7, 0.74], spread: 0.25, thumb: 28, thumbCurl: 0.55};
export const FIST: HandPose = {curl: [0.9, 0.92, 0.94, 0.96], spread: 0.1, thumb: 20, thumbCurl: 0.8};
export const OPEN: HandPose = {curl: [0.08, 0.1, 0.14, 0.18], spread: 0.55, thumb: 36, thumbCurl: 0.2};
export const FLAT: HandPose = {curl: [0.04, 0.05, 0.07, 0.1], spread: 0.3, thumb: 18, thumbCurl: 0.15};

export type Rec = {
  bx: number;
  torso: number;
  chest: number;
  neck: number;
  yaw: number;
  /** near / far hand world targets (used when hold = 0, and the far hand always) */
  nhx: number;
  nhy: number;
  fhx: number;
  fhy: number;
  /** 1 = the near hand grips the cup handle (the target comes from the cup) */
  hold: number;
  /** cup lift 0 (on the saucer) .. 1 (at the lips) */
  lift: number;
  ng: number;
  fg: number;
  chairDx: number;
  chairTilt: number;
};

export type ExprKey = [number, Expr, ('auto' | 'stop' | 'hit')?];
const E = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});

// ---- expressions
export const X = {
  mEasy: E({smile: 0.55, lid: 0.1, gx: -0.75, flush: 0.2, browIn: 0.05, open: 0.06}),
  mGlow: E({smile: 0.85, lid: 0.16, gx: -0.75, flush: 0.35, browIn: 0, open: 0.22, wide: 1.05}),
  mFalter: E({smile: 0.18, lid: 0.04, gx: -0.4, gy: 0.2, flush: 0.2, browIn: 0.45, pupil: 0.92, open: 0.05}),
  mFreeze: E({smile: -0.05, lid: 0, gx: -0.2, gy: 0.1, browIn: 0.8, pupil: 0.72, open: 0.08, wide: 0.9, sweat: 0.3, flush: 0.15}),
  mDisturb: E({smile: -0.45, lid: 0.05, gx: -0.1, gy: 0.35, browIn: 0.95, browDown: 0.2, pupil: 0.7, open: 0.14, wide: 0.88, sweat: 0.7, flush: 0.3}),
  mShut: E({smile: -0.85, shut: 0.85, lid: 0.6, squint: 0.75, browIn: 1, browDown: 0.9, pupil: 0.9, open: 0.22, wide: 0.9, teeth: 0.35, sweat: 0.9, flush: 0.5}),
  mStrain: E({smile: -0.7, lid: 0.1, squint: 0.45, gx: -0.2, gy: 0.3, browIn: 0.9, browDown: 0.7, pupil: 0.78, open: 0.22, wide: 0.85, teeth: 0.65, sweat: 0.9, flush: 0.5}),
  mForced: E({smile: 0.2, lid: 0.12, gx: -0.6, gy: 0.1, browIn: 0.55, pupil: 0.86, open: 0.04, sweat: 0.55, flush: 0.3}),
  mRealize: E({smile: -0.55, lid: 0, gx: -0.9, gy: 0.05, browIn: 0.95, pupil: 0.62, open: 0.2, wide: 0.82, sweat: 0.85, flush: 0.25}),
  mCrushed: E({smile: -0.75, lid: 0.22, gx: -0.8, gy: 0.35, browIn: 1, browDown: 0.3, pupil: 0.8, open: 0.1, wide: 0.8, sweat: 0.7, flush: 0.35}),
  wWarm: E({smile: 0.7, lid: 0.12, gx: 0.75, flush: 0.35, open: 0.12}),
  wGlad: E({smile: 0.95, lid: 0.2, gx: 0.75, flush: 0.5, open: 0.3, wide: 1.05, browIn: 0}),
  wSip: E({smile: 0.3, lid: 0.3, gx: 0.6, flush: 0.2, open: 0.03}),
  wCalm: E({smile: 0.45, lid: 0.1, gx: 0.7, flush: 0.2, open: 0.05}),
  wBlank: E({smile: 0.02, lid: 0.04, gx: 0.8, browIn: 0.35, pupil: 0.9, flush: 0.1, open: 0.04}),
  wRecog: E({smile: -0.55, lid: 0, gx: 0.9, gy: 0.0, browIn: 1, pupil: 0.55, open: 0.2, wide: 0.84, sweat: 0.3, flush: 0.0}),
  wRead: E({smile: 0.25, lid: 0.05, gx: 0.15, gy: -0.55, browIn: 0.3, pupil: 0.9, open: 0.05, flush: 0.2}),
  wAlarm: E({smile: -0.6, lid: 0, gx: 0.85, browIn: 1, pupil: 0.55, open: 0.22, wide: 0.82, sweat: 0.6, flush: 0.0}),
};

export const exprAt = (t: number, keys: ExprKey[]): Expr => splineRec(t, keys as SKey<Expr>[]) as Expr;
void mixExpr;

/** deterministic blink (0..1): about every 3.1 s, 5 frames long, per-actor offset */
export const blinkAt = (t: number, seed: number, hold: [number, number][] = []) => {
  for (const [a, b] of hold) if (t >= a && t <= b) return 0;
  const T = 3.1 + 0.4 * Math.sin(seed * 7.1);
  const ph = ((t + seed * 0.83) % T) / T;
  const d = 5 / 30 / T;
  return ph < d ? Math.sin((ph / d) * Math.PI) : 0;
};

const base = (o: Partial<Rec>): Rec => ({bx: 0, torso: 4, chest: 0, neck: 0, yaw: 20, nhx: 0, nhy: 0, fhx: 0, fhy: 0, hold: 1, lift: 0, ng: 0.5, fg: 0, chairDx: 0, chairTilt: 0, ...o});

// the far hand rests in the lap
const W_LAP = {x: W_HIP + 105, y: SEAT_Y - 66};
const M_LAP = {x: M_HIP - 105, y: SEAT_Y - 66};

// ---------------------------------------------------------------------------------------------------------------
// the receiver (left, faces right)
// ---------------------------------------------------------------------------------------------------------------
const wRest = base({fhx: W_LAP.x, fhy: W_LAP.y, ng: 0.5, nhx: CUP_W_X - 96, nhy: CUP_Y - 24});
export const W_KEYS: SKey<Rec>[] = [
  [9.9, wRest],
  [10.4, {...wRest, yaw: 26, torso: 3}],
  [10.62, {...wRest, yaw: 18, torso: 4}],
  [10.8, {...wRest, lift: 0, ng: 0.6}],
  [11.5, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [11.95, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [12.55, {...wRest, lift: 0, torso: 5, neck: 2}],
  [12.8, {...wRest, torso: 6, neck: 2, yaw: 22}],
  [13.4, {...wRest, torso: 5}],
  [14.15, {...wRest, torso: 5}],
  // 14.15-14.65 the subjective image has its own state; reality returns
  [14.65, {...wRest, lift: 0}],
  [15.0, {...wRest, lift: 0.0}],
  [15.6, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [15.95, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [16.5, {...wRest, lift: 0, torso: 4, neck: 0}],
  [17.0, {...wRest, torso: 5}],
  [18.0, {...wRest, lift: 0, torso: 4}],
  [19.5, {...wRest, yaw: 6, torso: 3, neck: -5}],
  [20.4, {...wRest, yaw: 6, torso: 3, neck: -5}],
  [21.1, {...wRest, yaw: 20, torso: 5, neck: 1}],
  [24.9, {...wRest, yaw: 20, torso: 5}],
  [25.35, {...wRest, yaw: 20, torso: 5}],
  // the freeze, then the withdrawal
  [25.8, {...wRest, yaw: 20, torso: 5, ng: 0.6}],
  [26.15, {...wRest, yaw: 20, torso: 3, neck: -2, ng: 0.6}],
  [26.5, {...wRest, yaw: 14, torso: -12, chest: -6, neck: -2, hold: 0, nhx: W_HIP + 58, nhy: SEAT_Y - 268, fhx: W_HIP + 30, fhy: SEAT_Y - 246, ng: 0.15, chairDx: -34, chairTilt: 3}, 'stop'],
  [27.4, {...wRest, yaw: 14, torso: -14, chest: -7, neck: -3, hold: 0, nhx: W_HIP + 52, nhy: SEAT_Y - 262, fhx: W_HIP + 24, fhy: SEAT_Y - 240, ng: 0.15, chairDx: -42, chairTilt: 4}],
];

export const W_EXPR: ExprKey[] = [
  [9.9, X.wWarm],
  [10.4, X.wBlank],
  [10.62, X.wGlad],
  [11.2, X.wSip],
  [12.0, X.wSip],
  [12.6, X.wGlad],
  [12.95, X.wWarm],
  [14.65, X.wCalm],
  [15.5, X.wSip],
  [16.0, X.wSip],
  [16.5, X.wCalm],
  [19.5, X.wBlank],
  [20.5, X.wBlank],
  [21.0, X.wWarm],
  [24.9, X.wWarm],
  [25.38, X.wWarm],
  [25.5, X.wRead],
  [25.66, X.wRead],
  [25.8, X.wRecog],
  [26.2, X.wRecog],
  [26.5, X.wAlarm],
  [27.4, X.wAlarm],
];

// ---------------------------------------------------------------------------------------------------------------
// the sender (right, faces left)
// ---------------------------------------------------------------------------------------------------------------
const mRest = base({fhx: M_LAP.x, fhy: M_LAP.y, ng: 0.5, torso: 6, yaw: 22, nhx: CUP_M_X + 96, nhy: CUP_Y - 24});
export const M_KEYS: SKey<Rec>[] = [
  [9.9, mRest],
  [10.5, {...mRest, torso: 6, yaw: 22}],
  [11.2, {...mRest, torso: 4, yaw: 24}],
  [12.3, {...mRest, torso: 4, yaw: 22}],
  [12.75, {...mRest, torso: 5, yaw: 22}],
  [13.2, {...mRest, torso: 3, yaw: 18, ng: 0.7}],
  [14.65, {...mRest, torso: 2, yaw: 14, ng: 0.85}],
  [15.4, {...mRest, torso: 2, yaw: 24, ng: 0.9}],
  [15.7, {...mRest, torso: 2, yaw: 40, ng: 0.9}],
  [16.0, {...mRest, torso: 2, yaw: 6, ng: 0.9}],
  [16.3, {...mRest, torso: 2, yaw: 34, ng: 0.9}],
  [16.7, {...mRest, torso: 2, yaw: 12, ng: 0.95}],
  [17.2, {...mRest, torso: 1, yaw: 14, ng: 1}],
  [17.6, {...mRest, torso: 1, yaw: 14, ng: 1}],
  [18.0, {...mRest, torso: 0, yaw: 14, ng: 0.5, hold: 0, nhx: M_HIP - 70, nhy: SEAT_Y - 60}],
  [19.5, {...mRest, torso: 1, yaw: 16, ng: 0.4, hold: 0, nhx: M_HIP - 70, nhy: SEAT_Y - 60}],
  [21.0, {...mRest, torso: 3, yaw: 20, ng: 0.4, hold: 0, nhx: M_HIP - 70, nhy: SEAT_Y - 60}],
  [24.0, {...mRest, torso: 4, yaw: 20, ng: 0.5, hold: 0, nhx: M_HIP - 70, nhy: SEAT_Y - 60}],
  [24.6, {...mRest, torso: 6, yaw: 24, ng: 0.7, hold: 0, nhx: M_HIP - 70, nhy: SEAT_Y - 60}],
  [26.0, {...mRest, torso: 6, yaw: 24, ng: 0.7, hold: 0, nhx: M_HIP - 70, nhy: SEAT_Y - 60}],
  [26.6, {...mRest, torso: 5, yaw: 24, ng: 0.35, hold: 0, nhx: M_HIP - 175, nhy: SEAT_Y - 104}],
  [27.4, {...mRest, torso: 4, yaw: 22, neck: 4, ng: 0.3, hold: 0, nhx: M_HIP - 190, nhy: SEAT_Y - 96}],
];

export const M_EXPR: ExprKey[] = [
  [9.9, X.mEasy],
  [10.5, X.mGlow],
  [11.2, X.mEasy],
  [12.2, X.mGlow],
  [12.7, X.mEasy],
  [13.0, X.mFalter],
  [13.4, X.mFreeze],
  [14.65, X.mDisturb],
  [15.4, X.mDisturb],
  [15.7, X.mShut],
  [16.5, X.mShut],
  [16.75, X.mStrain],
  [18.0, X.mStrain],
  [19.5, X.mForced],
  [21.0, X.mForced],
  [23.0, X.mForced],
  [24.15, X.mRealize],
  [26.2, X.mRealize],
  [27.0, X.mCrushed],
  [27.4, X.mCrushed],
];

// ---------------------------------------------------------------------------------------------------------------
// solving a frame
// ---------------------------------------------------------------------------------------------------------------
type CupPose = {x: number; y: number; tilt: number; fill: number};

const handleOf = (cup: CupPose, fx: -1 | 1): V => {
  // the handle grip point, rotated with the cup about its base
  const local = {x: fx * 46 * (CUP_S / 0.62), y: -27.6 * (CUP_S / 0.62)};
  const r = rot(local, cup.tilt);
  return {x: cup.x + r.x, y: cup.y + r.y};
};

const cupFor = (who: 'w' | 'm', r: Rec, mouth: V, spill = 0): CupPose => {
  const rest = {x: who === 'w' ? CUP_W_X : CUP_M_X, y: CUP_Y};
  const L = r.lift;
  const dir = who === 'w' ? 1 : -1;
  const to = {x: mouth.x + dir * 8, y: mouth.y + 36};
  const arc = Math.sin(Math.PI * L) * 16;
  return {x: lerp(rest.x, to.x, L), y: lerp(rest.y, to.y, L) - arc, tilt: dir * 24 * L, fill: 1 - 0.25 * spill};
};

const grip = (S: V, handle: V): V => {
  const d = {x: handle.x - S.x, y: handle.y - S.y};
  const l = Math.hypot(d.x, d.y) || 1;
  return {x: handle.x - (d.x / l) * HAND_L * 0.62, y: handle.y - (d.y / l) * HAND_L * 0.62};
};

export type Solved = {
  fig: Fig;
  pose: ReturnType<typeof figure>;
  expr: Expr;
  blink: number;
  nearHand: HandPose;
  farHand: HandPose;
  cup: CupPose;
  held: boolean;
  chair: {x: number; tilt: number};
  head: V;
  rec: Rec;
};

const solveActor = (who: 'w' | 'm', t: number, keys: SKey<Rec>[], ek: ExprKey[], over?: Partial<Rec>): Solved => {
  const r = {...splineRec(t, keys), ...over} as Rec;
  const fx = who === 'w' ? 1 : -1;
  const hip = who === 'w' ? W_HIP : M_HIP;
  const x = hip + r.bx + r.chairDx;
  const mk = (hands: Partial<Fig>): Fig => ({
    fx: fx as -1 | 1,
    x,
    floor: FLOOR,
    s: S,
    hipH: PROP.seatH + 64,
    torso: r.torso,
    chest: r.chest,
    neck: r.neck,
    yaw: r.yaw,
    nearFoot: fx * 190 + (r.chairDx ? r.chairDx * 0.0 : 0),
    farFoot: fx * 150,
    nearElbow: -1,
    farElbow: -1,
    ...hands,
  });
  // pass 1: the body without hands gives the shoulder and the mouth
  const p0 = figure(mk({}));
  const J0 = who === 'w' ? womanJoints(p0) : manJoints(p0);
  const mouth = {x: J0.head.x + fx * 0.46 * 96 * S, y: J0.head.y + 0.54 * 96 * S};
  const cup = cupFor(who, r, mouth);
  const handle = handleOf(cup, who === 'w' ? -1 : 1);
  const held = r.hold > 0.5;
  const gr = grip(J0.L.S, handle);
  const nx = lerp(r.nhx || gr.x, gr.x, clamp(r.hold));
  const ny = lerp(r.nhy || gr.y, gr.y, clamp(r.hold));
  // strain: a fine tremor in the gripping hand while he holds the thought in (the sender, 16.6-17.6 s)
  const trem = who === 'm' ? Math.max(0, Math.min(1, (t - 16.6) / 0.3)) * Math.max(0, Math.min(1, (17.7 - t) / 0.2)) : 0;
  const tx0 = Math.sin(t * 30 * 2.3) * 1.8 * trem;
  const ty0 = Math.cos(t * 30 * 1.9) * 1.4 * trem;
  const fig = mk({nearHand: {x: nx + tx0, y: ny + ty0}, farHand: {x: r.fhx, y: r.fhy}, nearWrist: (who === 'm' ? -42 : 46) * clamp(r.hold)});
  const pose = figure(fig);
  const J = who === 'w' ? womanJoints(pose) : manJoints(pose);
  const blink = blinkAt(t, who === 'w' ? 1 : 2);
  return {
    fig,
    pose,
    expr: exprAt(t, ek),
    blink,
    nearHand: mixHand(HAND_RELAXED, GRIP, r.ng),
    farHand: mixHand(HAND_RELAXED, GRIP, r.fg),
    cup: {...cup, x: cup.x + tx0 * 0.5, y: cup.y + ty0 * 0.5},
    held,
    chair: {x: hip + r.chairDx, tilt: r.chairTilt},
    head: J.head,
    rec: r,
  };
};

export type InteriorOpts = {
  /** subjective overrides */
  w?: Partial<Rec>;
  m?: Partial<Rec>;
  /** implant glow 0..1 and colour */
  glow?: number;
  glowColor?: string;
  /** steam and cups' coffee fill */
  steam?: number;
  /** a cup that is not on the table (dropped/shattered) hides the table cup */
  hideCupW?: boolean;
  extra?: React.ReactNode;
};

export const solveInterior = (t: number, o: InteriorOpts = {}) => ({
  w: solveActor('w', t, W_KEYS, W_EXPR, o.w),
  m: solveActor('m', t, M_KEYS, M_EXPR, o.m),
});

export const InteriorWorld: React.FC<{t: number; f: number; cam: Cam; opts?: InteriorOpts; solved?: ReturnType<typeof solveInterior>}> = ({t, f, cam, opts = {}, solved}) => {
  const {w, m} = solved ?? solveInterior(t, opts);
  const glow = opts.glow ?? 0.35;
  const steam = opts.steam ?? 0.7;
  const ripple = Math.max(0, Math.min(1, (t - 16.6) / 0.3)) * Math.max(0, Math.min(1, (17.75 - t) / 0.2));
  const cupEl = (id: string, who: Solved, fx: -1 | 1, hide?: boolean) =>
    hide ? null : <Cup id={id} x={who.cup.x} y={who.cup.y} s={CUP_S} fx={fx} f={f} steam={steam * (1 - who.rec.lift * 0.4)} tilt={who.cup.tilt} fill={who.cup.fill} ripple={fx === 1 ? ripple : 0} saucer={who.rec.lift < 0.02} />;
  const implant = <Implant4 yaw={m.rec.yaw} glow={glow} color={opts.glowColor ?? '#46CFFF'} f={f} />;
  return (
    <g>
      <Layer cam={cam} depth={1}>
        <InteriorBack f={f} />
        <InteriorFloor />
        <Chair id="chW" x={w.chair.x} floor={FLOOR} s={S} fx={1} tilt={w.chair.tilt} />
        <Chair id="chM" x={m.chair.x} floor={FLOOR} s={S} fx={-1} tilt={m.chair.tilt} />
        <Table id="tb" x={TX} floor={FLOOR} s={S} />
        {w.rec.lift >= 0.02 && !opts.hideCupW && <Cup id="sauW" x={CUP_W_X} y={CUP_Y} s={CUP_S} fx={-1} body={false} />}
        {m.rec.lift >= 0.02 && <Cup id="sauM" x={CUP_M_X} y={CUP_Y} s={CUP_S} fx={1} body={false} />}
        <Woman id="W" pose={w.pose} expr={w.expr} blink={w.blink} lHand={w.nearHand} rHand={w.farHand} held={cupEl('cupW', w, -1, opts.hideCupW)} headOverlay={<LensRead yaw={w.pose.yaw ?? 20} a={lensA(t)} f={f} />} />
        <Man id="M" pose={m.pose} expr={m.expr} blink={m.blink} lHand={m.nearHand} rHand={m.farHand} held={cupEl('cupM', m, 1)} headOverlay={implant} />
        {opts.extra}
      </Layer>
    </g>
  );
};

/** world position of the sender's implant disc (head space: x = -98 sin(yaw), y = -84 on a head of radius 96*S) */
export const implantWorld = (m: Solved): V => {
  const R = (96 * S) / 100;
  const yaw = ((m.pose.yaw ?? 20) * Math.PI) / 180;
  const roll = (-((m.pose.torso ?? 0) + (m.pose.chest ?? 0) + (m.pose.neck ?? 0)) * Math.PI) / 180;
  const lx = -98 * Math.sin(yaw) * R;
  const ly = -84 * R;
  return {x: m.head.x + lx * Math.cos(roll) - ly * Math.sin(roll), y: m.head.y + lx * Math.sin(roll) + ly * Math.cos(roll)};
};
export const IMPLANT_R = 21.5 * ((96 * S) / 100);

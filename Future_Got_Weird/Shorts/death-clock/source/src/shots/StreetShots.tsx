// S01-S03 (collapse and wrist reveal) and S14 (recovery wide) share this street world.
// World units: the front lawn's ground line under the man is GROUND; the camera names the world point at
// screen centre. Every pose, the leash, the contact shadows and the camera are pure functions of the frame.
import React from 'react';
import {Dog, DogPose, DOG_IDLE, collarRing} from '../art/Dog';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_LIMP, HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {bandCenter, Man, manJoints, ManPose} from '../art/Man';
import {FrontTufts, Street} from '../art/Street';
import {Cam} from '../lib/camera';
import {PAL, shade} from '../lib/color';
import {clamp, easeIn, easeInOut, easeOut, inv, Key, lerp, noise1, P, settle, track, trackRec, V} from '../lib/math';
import {SoftShadow} from '../lib/shade';
import {chainLag, SKey, spline, splineRec, spring} from '../lib/motion';

export const GROUND = 1800;

const BASE: ManPose = {
  x: 600, y: 1180, s: 1.22, torso: 14, chest: 10, neck: 10, turn: 0.45, pelvis: 6,
  // world-space hand targets (lWx/lWy, rWx/rWy) are unused while lW/rW = 0, but they must sit near where the hand will
  // be planted: blending toward a target at the origin would swing the arm over his head mid-move
  lTu: -322, lTv: 56, lWx: 380, lWy: 1770, lW: 0, lElb: -1, lWr: 6,
  rTu: -84, rTv: -2, rWx: 560, rWy: GROUND + 4, rW: 0, rElb: 1, rWr: -16,
  lHip: -10, lKnee: 16, lAnk: 0, rHip: 16, rKnee: 10, rAnk: 4, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.4,
};
const K = (over: Partial<ManPose>): ManPose => ({...BASE, ...over});

// the fall, frame keys (S01 0-24 stumble + buckling knee, S02 24-51 knees -> brace -> onto his side)
const HAND_PLANT = {x: 262, y: 1858}; // the left hand braces here and stays planted (recovery-position arm)
const FALL: SKey<ManPose>[] = [
  [0, K({}), 'stop'],
  [14, K({y: 1198, torso: 19, chest: 12, neck: 14, lKnee: 34, lHip: -2, rKnee: 16, lTu: -318, lTv: 30})],
  [24, K({y: 1240, torso: 24, chest: 14, neck: 12, lHip: 6, lKnee: 58, rHip: 22, rKnee: 30, lTu: -306, lTv: -4, lWr: 14})],
  // knees hit; the left hand reaches for the grass ahead of him
  [34, K({x: 596, y: 1446, torso: 34, chest: 16, neck: 8, pelvis: 8, lHip: 2, lKnee: 96, rHip: 8, rKnee: 98, lTu: -220, lTv: -110, lWx: HAND_PLANT.x, lWy: HAND_PLANT.y, lW: 0.55, lElb: -1, lWr: 20}), 'hit'],
  // the hand plants: the arm takes the weight, nearly straight
  [42, K({x: 610, y: 1500, torso: 52, chest: 12, neck: 0, pelvis: 30, lHip: 20, lKnee: 104, rHip: 26, rKnee: 100, lWx: HAND_PLANT.x, lWy: HAND_PLANT.y, lW: 1, lElb: -1, lWr: 16}), 'hit'],
  // he rolls onto his side; the planted hand stays put and the elbow folds in front of his chest
  [51, K({x: 790, y: 1684, torso: 86, chest: 4, neck: -14, turn: 0.35, pelvis: 86, lHip: 26, lKnee: 46, rHip: 18, rKnee: 36, lAnk: 10, rAnk: 10, lWx: HAND_PLANT.x, lWy: HAND_PLANT.y, lW: 1, lElb: -1, lWr: 8, rTu: -96, rTv: 6}), 'hit'],
];

export type StreetState = {man: ManPose; expr: Expr; lHand: HandPose; rHand: HandPose; dog: DogPose; cam: Cam; bandColor: string; bandGlow: number; nearLegFront?: boolean; hairSway?: number};

/** The fall's body pose without follow-through (monotone spline through the keys; knees and side land 'hit'). */
const fallBody = (f: number): ManPose => {
  let man = splineRec(f, FALL);
  // breathing / tremor while standing
  const shake = (1 - inv(26, 40, f)) * noise1(f * 0.7, 3) * 1.2;
  man = {...man, torso: man.torso + shake, neck: man.neck + noise1(f * 0.5, 9) * 1.5, breath: 0.5 + 0.5 * Math.sin(f * 0.45)};
  // impact settle: a small rebound of the torso on contact
  if (f > 48) {
    const st = settle((f - 48) / 30, 4, 14);
    man = {...man, torso: man.torso + (1 - st) * 2.5, y: man.y - (1 - st) * 4};
  }
  return man;
};

/** Overlapping action for any body-pose function: the head trails the torso's rotation and the hair spikes
 *  swing behind the head (springs over the last frames). */
export const followThrough = (body: (f: number) => ManPose, f: number) => {
  const torsoAng = (t: number) => {
    const m = body(t);
    return m.torso + m.chest;
  };
  const r = chainLag(torsoAng, f);
  return {headLag: clamp(r.head, -18, 18), hairSway: clamp(r.hair * 0.9, -14, 14)};
};

export const fallState = (f: number): StreetState => {
  const ft = followThrough(fallBody, f);
  const body = fallBody(f);
  const man = {...body, neck: body.neck + ft.headLag};
  const expr =
    f < 14 ? mixExpr(EXPR_PAIN, EXPR_WINCE, inv(0, 14, f)) : f < 30 ? mixExpr(EXPR_WINCE, EXPR_PAIN, inv(14, 30, f)) : f < 44 ? mixExpr(EXPR_PAIN, EXPR_GASP, inv(30, 40, f)) : mixExpr(EXPR_GASP, EXPR_WINCE, inv(44, 52, f));
  const lHand = f < 28 ? HAND_RELAXED : f < 44 ? mixHand(HAND_RELAXED, HAND_BRACE, inv(28, 38, f)) : mixHand(HAND_BRACE, HAND_LIMP, inv(44, 54, f));
  const rHand = mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.55, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3));
  // dog: looks up, startles a step back as he goes down, ears perk, stays alert
  const back = easeOut(inv(30, 46, f));
  const dog: DogPose = {
    ...DOG_IDLE,
    x: 1000 + 70 * back,
    y: GROUND - 10,
    s: 1.4,
    facing: -1,
    head: lerp(22, 30, inv(24, 40, f)),
    // ears perk with a springy overshoot, the tail drops and settles (follow-through)
    ears: clamp(spring((t) => lerp(0.3, 0.95, inv(26, 36, t)), f, 0.09, 0.22), 0, 1.2),
    tail: spring((t) => lerp(16, -6, inv(30, 44, t)) + 6 * Math.sin(t * 0.5) * (1 - inv(26, 40, t)), f, 0.07, 0.3),
    lean: 9 * Math.sin(Math.PI * inv(30, 50, f)),
    step: f * 0.55,
    stepAmt: Math.sin(Math.PI * inv(30, 48, f)),
    worry: lerp(0.5, 1, inv(26, 40, f)),
  };
  // framed for the crew proportions (bigger head): head clear of the label at the start, kept in frame as he drops
  const cam: Cam = {
    x: spline(f, [[0, 620], [24, 600], [40, 476], [51, 500]]),
    y: spline(f, [[0, 1084], [24, 1130], [40, 1390], [51, 1620]]),
    z: spline(f, [[0, 1.1], [24, 1.14], [40, 1.13], [51, 1.3]]),
  };
  return {man, expr, lHand, rHand, dog, cam, bandColor: PAL.normal, bandGlow: 0.7, hairSway: ft.hairSway};
};

/** Contact shadows from whichever joints are near the ground. */
export const Contacts: React.FC<{id: string; j: ReturnType<typeof manJoints>; ground: number}> = ({id, j, ground}) => {
  const pts: [V, number, number][] = [
    [j.lLeg.A, 70, 16],
    [j.rLeg.A, 64, 15],
    [j.lLeg.toe, 50, 12],
    [j.rLeg.toe, 46, 12],
    [j.lLeg.K, 60, 16],
    [j.rLeg.K, 56, 15],
    [j.H, 120, 22],
    [j.C, 130, 22],
    [j.Sh, 110, 20],
    [j.head, 90, 18],
  ];
  return (
    <g>
      {pts.map(([p, rx, ry], i) => {
        const a = clamp(1 - (ground - p.y) / 150) * 0.42;
        if (a < 0.01) return null;
        return <SoftShadow key={i} id={`${id}-c${i}`} c={{x: p.x + 14, y: ground + 4}} rx={rx * j.s} ry={ry * j.s} alpha={a} />;
      })}
    </g>
  );
};

/** The leash: a cord from his right hand to the collar ring, sagging with slack. Two stacked strokes give it a round, lit form. */
export const Leash: React.FC<{a: V; b: V; slack: number}> = ({a, b, slack}) => {
  const mid = {x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + slack};
  const d = `M${P(a)} Q${P(mid)} ${P(b)}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={shade('#1CA7A0', 0.45)} strokeWidth={9} transform="translate(2 3)" opacity={0.5} />
      <path d={d} stroke="#1CA7A0" strokeWidth={8} />
      <path d={d} stroke="#9FE3DD" strokeWidth={2.5} transform="translate(-1.5 -2)" opacity={0.8} />
    </g>
  );
};

export const StreetScene: React.FC<{st: StreetState; id: string; hideLeftForearm?: boolean}> = ({st, id, hideLeftForearm}) => {
  const j = manJoints(st.man);
  const ring = collarRing(st.dog);
  const hand = j.R.W;
  return (
    <Street
      id={`${id}-st`}
      cam={st.cam}
      fg={<FrontTufts id={`${id}-fg`} xs={[[60, 2050, 1.6], [980, 2080, 1.8], [820, 2120, 1.4]]} />}
    >
      <Contacts id={`${id}-ct`} j={j} ground={GROUND} />
      <Dog id={`${id}-dog`} pose={st.dog} />
      <Man id={`${id}-man`} pose={st.man} expr={st.expr} lHand={st.lHand} rHand={st.rHand} bandColor={st.bandColor} bandGlow={st.bandGlow} hideLeftForearm={hideLeftForearm} hairSway={st.hairSway} />
      <Leash a={hand} b={ring} slack={60 + 40 * clamp((hand.y - 1300) / 400)} />
    </Street>
  );
};

export const bandWorld = (st: StreetState) => bandCenter(manJoints(st.man));
export {EXPR_RELIEF, EXPR_UNEASY};

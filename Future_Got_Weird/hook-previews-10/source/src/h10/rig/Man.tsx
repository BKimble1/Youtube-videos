// Copied from the Death Clock V4 project (Shorts/death-clock/source/src/art/Man.tsx, commit e5b4770e) for Real Web
// Fluid V2 (and from there for Glass Climbing, which adds only the draw-order hooks afterFarLeg / afterNearLeg and a
// one-sided hands pass; the design is unchanged). Changes: the device model is removed, and an Outfit sets the colours (the guesser's striped tee by
// default; a plain jacket with long sleeves for the street runner). Everything else is unchanged.
//
// The man: the Weird Crew's "guesser" (Future Got Weird cast, Video 01 rig colours and face), one outfit
// (white tee with saffron stripes, navy trousers, white shoes), the band on his LEFT wrist. Drawn in the crew's
// cutout style: every part has an ink contour (lib/ink.tsx), with dimensional gradient shading from one key light
// and glossy highlights. Seen in 3/4 view facing screen-left, so his LEFT side (and left arm) is nearest the camera
// and his RIGHT hand can clutch his chest. Arms are two-bone IK chains whose hand targets are given either in
// upper-torso space (hand stays on the chest while the body moves) or in world space (hand planted on the ground).
// Joint positions come from one pure function shared by the drawing, the contact shadows and the camera targets
// (V4: nothing is tied to his hands; the dog's leash lies on the grass, art/Leash.tsx).
import React from 'react';
import {lit, mix, PAL, shade} from './color';
import {Deco, INK, Inked, InkLine, InkPath} from './ink';
import {Limb, limbGeo} from './limb';
import {add, clamp, dirDown, dot, fmt, len, lerpV, mul, norm, P, perp, sub, V} from './math';
import {Blob, Capsule, Lin, LIGHT} from './shade';
import {Expr, Head} from './Head';
import {Hand, HandPose} from './Hand';

export type Outfit = {
  skin: string;
  hair: string;
  shirt: string;
  /** saffron stripes on the tee (null: plain) */
  stripe: string | null;
  pants: string;
  shoe: string;
  /** sleeves to the wrist (the arm is drawn in the shirt colour, the hand in skin) */
  longSleeve?: boolean;
  hat?: {color: string; band: string};
  mask?: string;
  glasses?: boolean;
  /** glove colour for both hands (lab) */
  glove?: string;
  /** H10: short neutral crop instead of the spiky hair */
  crop?: boolean;
  /** H10: cheek flush scale */
};
/** the Weird Crew's guesser (Video 01 cast.ts), as in Death Clock */
export const GUESSER: Outfit = {skin: PAL.skin, hair: PAL.hair, shirt: PAL.shirt, stripe: PAL.stripe, pants: PAL.pants, shoe: PAL.shoe};

export type ManPose = {
  x: number;
  y: number;
  s: number;
  /** torso lean from vertical (deg, + = toward screen-left, his front) */
  torso: number;
  /** extra bend of the upper torso */
  chest: number;
  /** head tilt relative to the upper torso */
  neck: number;
  /** 3/4 head turn (0 = facing camera) */
  turn: number;
  pelvis: number;
  // left (near) arm: hand target in upper-torso space (u along spine from shoulder line, v toward his back) ...
  lTu: number;
  lTv: number;
  // ... or in world space, blended by lW (0 = torso target, 1 = world target)
  lWx: number;
  lWy: number;
  lW: number;
  /** elbow side: +1 elbow toward his back (+v), -1 toward his front */
  lElb: number;
  /** wrist bend relative to the forearm (deg) */
  lWr: number;
  rTu: number;
  rTv: number;
  rWx: number;
  rWy: number;
  rW: number;
  rElb: number;
  rWr: number;
  // legs (deg from down relative to the pelvis). knee + = shin swings back.
  lHip: number;
  lKnee: number;
  lAnk: number;
  rHip: number;
  rKnee: number;
  rAnk: number;
  /** apparent length of each thigh / shin (1 = side-on, < 1 = pointing toward the camera) */
  lFs: number;
  lFsh: number;
  rFs: number;
  rFsh: number;
  breath: number;
  /** V2 (Real Web Fluid): apparent length of each arm (1 = side-on, < 1 = pointing toward or away from the camera) */
  lFa?: number;
  rFa?: number;
  /** Death Clock's planted palm (a world-targeted hand turns flat onto the grass); off in V2 */
  plantPalm?: boolean;
  /** V3: world-space ankle targets (feet planted on the ground), blended in by lA / rA (0 = angles above) */
  lAx?: number;
  lAy?: number;
  lA?: number;
  rAx?: number;
  rAy?: number;
  rA?: number;
};

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});
const ang = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const cross2 = (a: V, b: V) => a.x * b.y - a.y * b.x;

export const DIM = {
  waist: 200,
  chestH: 138,
  neck: 50, // H10: an adult neck (Glass Climbing: 18), so the cervical spine shows above the collar
  headR: 96,
  headUp: 100,
  upperArm: 199,
  foreArm: 178,
  hand: 96,
  thigh: 226,
  shin: 216,
};

/** V4 soft IK: past SOFT_IK of full reach the solve eases toward full extension instead of snapping through the
 *  straight (singular) pose, so an elbow or knee never pops. */
export const SOFT_IK = 0.96;
/** most a planted limb may stretch (both bones scaled) to keep its effector exactly on target */
/** V3: no stretch: a hand that cannot reach falls short (the QA reports it) instead of the arm growing */
export const MAX_STRETCH = 1.0;
/** Two-bone IK: elbow on side `side` (+1 = clockwise of the shoulder->target line). `plant` 0..1: how firmly the
 *  effector is planted in the world; a planted effector stays exactly on its target (bones stretch <= 4.5%). */
const ik = (S: V, T: V, l1: number, l2: number, side: number, plant = 0) => {
  const d0 = sub(T, S);
  const Lt = l1 + l2;
  const d = Math.max(len(d0), Math.abs(l1 - l2) + 0.5);
  const ds = SOFT_IK * Lt;
  const soft = d <= ds ? d : ds + (Lt - ds) * (1 - Math.exp(-(d - ds) / (Lt - ds)));
  const sc = 1 + (clamp(d / soft, 1, MAX_STRETCH) - 1) * clamp(plant);
  const reach = soft * sc;
  const b1 = l1 * sc;
  const b2 = l2 * sc;
  const dir = norm(d0);
  const a = (b1 * b1 + reach * reach - b2 * b2) / (2 * reach);
  const h = Math.sqrt(Math.max(0, b1 * b1 - a * a));
  const E = add(add(S, mul(dir, a)), mul(perp(dir), h * side));
  const W = add(S, mul(dir, reach));
  return {E, W, sc};
};
/** smoothstep */
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** shortest-way angle blend (deg) */
const lerpAng = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;
/** the planted left palm lies flat on the grass, fingers toward his front: its angle is held in world space */
export const PLANT_HAND_ANG = 172.6;

export type Joints = ReturnType<typeof manJoints>;

export const manJoints = (p: ManPose) => {
  const s = p.s;
  const H: V = {x: p.x, y: p.y};
  const tc = p.torso + p.chest;
  const C = add(H, mul(up(p.torso), DIM.waist * s));
  const Sh = add(C, mul(up(tc), DIM.chestH * s));
  const N = add(Sh, mul(up(tc), DIM.neck * s));
  const head = add(N, mul(up(tc + p.neck), DIM.headUp * s));
  const lS = add(add(Sh, mul(px(tc), 46 * s)), mul(up(tc), -18 * s));
  const rS = add(add(Sh, mul(px(tc), -54 * s)), mul(up(tc), -14 * s));
  const toWorld = (u: number, vv: number) => add(Sh, add(mul(up(tc), u * s), mul(px(tc), vv * s)));
  const arm = (S: V, tu: number, tv: number, wx: number, wy: number, w: number, elb: number, wr: number, fa = 1) => {
    const wc = clamp(w);
    // V4: the last of the torso -> world blend is taken as the hand touches down, so a planted hand never creeps
    const wt = wc + (1 - wc) * sstep(0.95, 0.99, wc);
    const T = lerpV(toWorld(tu, tv), {x: wx, y: wy}, wt);
    // elbow side in screen terms: the torso's +v axis rotated into the shoulder->target frame; a (nearly) planted
    // hand stays exactly on its target (soft IK with a small stretch instead of a clamp that leaves it short)
    const {E, W} = ik(S, T, DIM.upperArm * s * fa, DIM.foreArm * s * fa, elb >= 0 ? 1 : -1, sstep(0.8, 0.9, wc));
    const fd = norm(sub(W, E));
    // the planted palm keeps its angle in world space (it turns flat onto the grass as it lands, no flap or rock)
    return {S, E, W, foreDir: fd, handAng: p.plantPalm ? lerpAng(ang(fd) + wr, PLANT_HAND_ANG, sstep(0.75, 1, wc)) : ang(fd) + wr};
  };
  const L = arm(lS, p.lTu, p.lTv, p.lWx, p.lWy, p.lW, p.lElb, p.lWr, p.lFa ?? 1);
  // V4: when the far elbow hangs low beside the lap (seated), it tucks in behind the tee's front contour instead of
  // poking out under the hem as a spike or hook (the arm swivels; the hand keeps its place and angle). The blend runs
  // over a wide band of elbow heights (86-118 above the hips), so it tucks gradually as he slumps (18-31) and comes
  // out over about 20 frames as he sits up (1062-1082), never in a swing; the SIT clutch (elbow at about 125) is
  // untouched.
  const tuckFar = (A: ReturnType<typeof arm>) => {
    const X = px(p.torso);
    const d = sub(A.E, H);
    const u = dot(d, up(p.torso)) / s;
    const v = dot(d, X) / s;
    const k = sstep(118, 86, u);
    const vMin = -60; // tee front edge (-85) + elbow radius (23.5) + a little
    return k > 0 && v < vMin ? {...A, E: add(A.E, mul(X, (vMin - v) * k * s))} : A;
  };
  const R = tuckFar(arm(rS, p.rTu, p.rTv, p.rWx, p.rWy, p.rW, p.rElb, p.rWr, p.rFa ?? 1));
  const hipL = add(add(H, mul(px(p.pelvis), 34 * s)), mul(up(p.pelvis), -44 * s));
  const hipR = add(add(H, mul(px(p.pelvis), -40 * s)), mul(up(p.pelvis), -42 * s));
  const leg = (hp: V, hip: number, knee: number, ank: number, fs: number, fsh: number, tx?: number, ty?: number, tw?: number) => {
    // legs rotate with the pelvis in the same sense as the torso lean (a lean of +a is a CCW turn of the body)
    const a1 = hip - p.pelvis;
    let K = add(hp, mul(dirDown(a1), DIM.thigh * s * (fs ?? 1)));
    let a2 = a1 - knee;
    let A = add(K, mul(dirDown(a2), DIM.shin * s * (fsh ?? 1)));
    let footDir = dirDown(a2 + 90 + ank);
    const w = clamp(tw ?? 0);
    if (w > 0 && tx !== undefined && ty !== undefined) {
      // planted foot: two-bone IK from the hip to the ankle target, knee forward (toward his front, screen-left)
      const T = {x: tx, y: ty};
      const r = ik(hp, T, DIM.thigh * s * (fs ?? 1), DIM.shin * s * (fsh ?? 1), 1, sstep(0.8, 0.9, w));
      K = lerpV(K, r.E, w);
      A = lerpV(A, r.W, w);
      const sd = norm(sub(A, K));
      a2 = (Math.atan2(-sd.x, sd.y) * 180) / Math.PI;
      // the planted foot stays flat on the grass, toes toward his front
      footDir = norm(lerpV(footDir, dirDown(90 + ank * 0.3), w));
    }
    // a foot pointing toward the camera foreshortens with the shin
    const fl = clamp(0.5 + 0.5 * (fsh ?? 1), 0.5, 1);
    const toe = add(A, mul(footDir, 84 * s * fl));
    return {hp, K, A, toe, footDir, shinAng: a2, fl};
  };
  const lLeg = leg(hipL, p.lHip, p.lKnee, p.lAnk, p.lFs, p.lFsh, p.lAx, p.lAy, p.lA);
  const rLeg = leg(hipR, p.rHip, p.rKnee, p.rAnk, p.rFs, p.rFsh, p.rAx, p.rAy, p.rA);
  return {H, C, Sh, N, head, tc, L, R, lLeg, rLeg, s, toWorld};
};

/** Forearm radii (elbow, wrist) at the rig's scale. */
export const foreRadii = (s: number) => ({rE: 23.5 * s, rW: 17 * s});

const smoothClosed = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, 1 / 6));
    const c2 = add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, 1 / 6));
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + ' Z';
};

/** The tee's outline (shared by the drawing and the x-ray clip). */
export const torsoPath = (p: ManPose) => {
  const j = manJoints(p);
  const s = p.s;
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, vv: number) => add(O, add(mul(up(a), u * s), mul(px(a), vv * s)));
  const br = 1 + 0.03 * p.breath;
  return smoothClosed([
    loc(j.H, p.torso, -18, -84),
    loc(j.H, p.torso, 64, -86),
    loc(j.H, p.torso, 140, -82),
    loc(j.C, tc, 52, -98 * br),
    loc(j.C, tc, 118, -88),
    loc(j.C, tc, 146, -40),
    loc(j.C, tc, 154, 0),
    loc(j.C, tc, 150, 36),
    loc(j.C, tc, 128, 92),
    loc(j.C, tc, 48, 94 * br),
    loc(j.H, p.torso, 104, 84),
    loc(j.H, p.torso, -16, 90),
  ]);
};
/** Torso-local point (u along the spine from O, v across), as the drawing uses. */
export const torsoPt = (p: ManPose, O: V, a: number, u: number, vv: number) => add(O, add(mul(up(a), u * p.s), mul(px(a), vv * p.s)));

type Props = {
  id: string;
  pose: ManPose;
  expr: Expr;
  blink?: number;
  lHand: HandPose;
  rHand: HandPose;
  /** colour of the band face (green normal, crimson warning, blue alert) */
  bandColor?: string;
  /** 0..1 glow of the band face onto the skin */
  bandGlow?: number;
  /** skip the left forearm and hand (when a close-up asset replaces it) */
  hideLeftForearm?: boolean;
  /** optional extra drawn between the torso and the arms (e.g. hand shadow on the chest) */
  children?: React.ReactNode;
  /** draw the near leg in front of the torso (sitting with the near knee raised toward the camera) */
  nearLegFront?: boolean;
  /** hair spike follow-through (deg) */
  hairSway?: number;
  /** colours (default: the guesser's striped tee) */
  outfit?: Outfit;
  /** contour width multiplier (thin selective edges at macro scale) */
  inkK?: number;
  /** drawn over the torso and head, under the arms (x-ray of the chest) */
  overTorso?: React.ReactNode;
  /** drawn over the left upper arm, under the left forearm (x-ray of the upper arm, section backdrop) */
  beforeLeftForearm?: React.ReactNode;
  /** drawn over the right forearm and hand, under the left arm (the chest x-ray shows through the clutching hand) */
  afterRightArm?: React.ReactNode;
  /** V3: drawn over everything (the torso cutaway seen through the near arm) */
  overAll?: React.ReactNode;
  /** V2 (Real Web Fluid): draw only the two hands (a second pass over apparatus the hands hold) */
  handsOnly?: boolean;
  /** V3: objects held in the hands (drawn between rear and front digits in the hands-only pass) */
  holdL?: {front: (number | 't')[]; obj: React.ReactNode; palmFront?: boolean};
  holdR?: {front: (number | 't')[]; obj: React.ReactNode; palmFront?: boolean};
  /** Glass Climbing: drawn right after the far leg (the far foot's stirrup over the far shoe) */
  afterFarLeg?: React.ReactNode;
  /** Glass Climbing: drawn right after the near leg, before the tee (the near stirrup over the near shoe) */
  afterNearLeg?: React.ReactNode;
  /** Glass Climbing: in the hands-only pass, draw only this hand */
  handsOnlySide?: 'L' | 'R';
  /** V8 (Glass Climbing): the near short sleeve drawn as a whole sleeve with a rounded, outlined crown over the shoulder,
   *  and the near arm's skin starting under it (for views where the near arm hangs in front of the torso) */
  sleeveCap?: boolean;
};

export const Man: React.FC<Props> = ({id, pose: p, expr, blink = 0, lHand, rHand, hideLeftForearm, children, nearLegFront, hairSway = 0, outfit = GUESSER, inkK = 1, overTorso, beforeLeftForearm, afterRightArm, overAll, handsOnly, holdL, holdR, afterFarLeg, afterNearLeg, handsOnlySide, sleeveCap}) => {
  const j = manJoints(p);
  const s = p.s;
  const OUT = 7 * s * inkK; // crew contour
  if (handsOnly) {
    const IN0 = OUT * 0.72;
    const hc = (isFar: boolean) => (outfit.glove ? (isFar ? shade(outfit.glove, 0.14) : outfit.glove) : isFar ? shade(outfit.skin, 0.14) : outfit.skin);
    return (
      <g>
        {handsOnlySide !== 'L' && <Inked w={IN0}>
          <Hand id={`${id}-ho-r`} wrist={add(j.R.W, mul(j.R.foreDir, -6 * s))} ang={j.R.handAng} L={DIM.hand * s} thumbSide={-1} view="back" pose={rHand} color={hc(true)} ink={IN0 * 0.9} sheen={outfit.glove ? 0.2 : 1} hold={holdR} />
        </Inked>}
        {handsOnlySide !== 'R' && <Inked w={IN0}>
          <Hand id={`${id}-ho-l`} wrist={add(j.L.W, mul(j.L.foreDir, -6 * s))} ang={j.L.handAng} L={DIM.hand * s} thumbSide={1} view="back" pose={lHand} color={hc(false)} ink={IN0 * 0.9} sheen={outfit.glove ? 0.2 : 1} hold={holdL} />
        </Inked>}
      </g>
    );
  }
  const o = outfit;
  const skin = o.skin;
  const far = (c: string) => shade(c, 0.14);
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, vv: number) => add(O, add(mul(up(a), u * s), mul(px(a), vv * s)));
  const br = 1 + 0.03 * p.breath;

  const torsoD = torsoPath(p);
  const torsoC = loc(j.C, tc, 60, -30);
  // saffron stripes across the tee (the guesser's shirt), following the torso's own frame
  const stripeAng = p.torso + p.chest * 0.5;
  const stripes = [0, 1, 2, 3, 4, 5].map((i) => {
    const u = 6 + i * 62;
    const a = loc(j.H, stripeAng, u, -240);
    const b = loc(j.H, stripeAng, u, 240);
    const c2 = loc(j.H, stripeAng, u + 27, 240);
    const d2 = loc(j.H, stripeAng, u + 27, -240);
    return `M${P(a)} L${P(b)} L${P(c2)} L${P(d2)} Z`;
  });

  // --- pelvis (trousers)
  const pelPts: V[] = [loc(j.H, p.pelvis, 10, -86), loc(j.H, p.pelvis, 10, 90), loc(j.H, p.pelvis, -52, 94), loc(j.H, p.pelvis, -84, 30), loc(j.H, p.pelvis, -80, -60)];
  const pelD = smoothClosed(pelPts);

  // V3 construction: one outer contour group for the whole figure (its exterior silhouette), thinner occlusion
  // lines inside it, and limbs that are single continuous shapes (lib/limb.tsx). No joint is drawn as a separate
  // round piece; a contour that would cross a joint where a part grows out of the body is dissolved there.
  const IN = OUT * 0.72;
  const Leg = (k: string, L: Joints['lLeg'], isFar: boolean) => {
    const pc = isFar ? far(o.pants) : o.pants;
    const shoe = isFar ? far(o.shoe) : o.shoe;
    const sd = dirDown(L.shinAng);
    const F = (x: number, y: number) => add(add(L.A, mul(L.footDir, x * s * (x > 0 ? L.fl : 1))), mul(sd, y * s));
    const upper = smoothClosed([F(-34, -8), F(-30, 16), F(30, 20), F(90, 18), F(100, 6), F(86, -10), F(46, -20), F(10, -34), F(-14, -34), F(-32, -26)]);
    const sole = smoothClosed([F(-35, 10), F(98, 12), F(100, 24), F(40, 28), F(-33, 26)]);
    const ankle = add(L.A, mul(sd, -8 * s));
    const cuff0 = add(L.A, mul(sd, -40 * s));
    const nb = perp(sd);
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}i`} fade={[{c: L.hp, r: 62 * s}]}>
          <Limb id={`${id}-${k}lb`} A={L.hp} B={L.K} C={ankle} rA={43 * s} rB={33 * s} rC={28 * s} color={pc} spec={0.12} crease={IN * 0.8} />
        </Inked>
        <Deco>
          {/* trouser hem: a darker turned band and its fold line, not a separate piece */}
          <path d={`M${P(add(cuff0, mul(nb, 29 * s)))} Q${P(add(add(cuff0, mul(sd, 5 * s)), mul(nb, 0)))} ${P(add(cuff0, mul(nb, -29 * s)))} L${P(add(ankle, mul(nb, -28 * s)))} L${P(add(ankle, mul(nb, 28 * s)))} Z`} fill={shade(pc, 0.12)} opacity={0.8} />
          <InkLine d={`M${P(add(cuff0, mul(nb, 27 * s)))} Q${P(add(cuff0, mul(sd, 5 * s)))} ${P(add(cuff0, mul(nb, -27 * s)))}`} w={IN * 0.6} opacity={0.6} />
        </Deco>
        {/* white crew shoe: rounded upper, grey sole, glossy toe */}
        <Inked w={IN * 0.9}>
          <Blob id={`${id}-${k}so`} d={sole} c={F(30, 18)} r={80 * s} color={mix(shoe, '#B9C4CC', 0.7)} k={0.5} />
          <Blob id={`${id}-${k}sp`} d={upper} c={F(20, -8)} r={90 * s} color={shoe} k={0.9} stops={[[0, '#FFFFFF'], [0.55, mix(shoe, '#E9EEF2', 0.5)], [1, mix(shoe, '#AFC0CE', isFar ? 0.8 : 0.6)]]} />
        </Inked>
        <Deco>
          <Capsule id={`${id}-${k}lc`} a={F(4, -24)} b={F(48, -12)} ra={6 * s} rb={5 * s} color={o.stripe ?? '#FFC744'} k={0.4} />
          <ellipse cx={fmt(F(66, -6).x)} cy={fmt(F(66, -6).y)} rx={fmt(16 * s)} ry={fmt(5 * s)} transform={`rotate(${fmt(ang(L.footDir) - 12)} ${fmt(F(66, -6).x)} ${fmt(F(66, -6).y)})`} fill="#FFFFFF" opacity={0.95} />
        </Deco>
      </g>
    );
  };

  // the tee's short sleeve: a tube that grows out of the shoulder (its contour and fill dissolve into the tee there)
  // and ends in an open hem; the arm comes out of the opening
  const sleeveParts = (k: string, A: Joints['L'], isFar: boolean) => {
    const u = norm(sub(A.E, A.S));
    const n = perp(u);
    const r0 = 38 * s;
    const r1 = 34 * s;
    // V4: the near sleeve has no crown outline of its own: its top runs on past the shoulder joint and is cut by the
    // tee's own outline (clip below), so there is one shoulder line, the tee's, and the sleeve's sides dissolve into
    // the shoulder under it (no dome, no second lobe). The far sleeve, behind the tee, keeps the low crown.
    const top = A.S;
    const hc = (isFar ? 32 : 64) * s;
    const hem = add(A.S, mul(u, DIM.upperArm * 0.56 * s));
    const p1 = add(top, mul(n, r0));
    const p2 = add(hem, mul(n, r1));
    const p3 = add(hem, mul(n, -r1));
    const p4 = add(top, mul(n, -r0));
    const d = `M${P(p1)} L${P(p2)} Q${P(add(hem, mul(u, r1 * 0.36)))} ${P(p3)} L${P(p4)} A${fmt(r0)} ${fmt(hc)} ${fmt(ang(n))} 0 ${cross2(sub(p4, top), mul(u, -1)) > 0 ? 1 : 0} ${P(p1)} Z`;
    let ln = n;
    if (dot(ln, LIGHT) < 0) ln = mul(ln, -1);
    const mid = mul(add(top, hem), 0.5);
    const c = isFar ? far(o.shirt) : o.shirt;
    const fadeR = r0 * 1.15;
    const inner = (
      <ellipse key="in" cx={fmt(hem.x)} cy={fmt(hem.y)} rx={fmt(r1 * 0.24)} ry={fmt(r1 * 0.93)} transform={`rotate(${fmt(ang(u))} ${fmt(hem.x)} ${fmt(hem.y)})`} fill={shade(c, 0.42)} />
    );
    // near sleeve: the tee's stripes run on through the whole crown (they match the tee's on both sides) and fade
    // out down the tube; the side contours fade out toward the shoulder line
    const sf0 = add(A.S, mul(u, r0 * 0.5));
    const sf1 = add(A.S, mul(u, fadeR));
    const big = 4000;
    const hemSide = `M${P(add(A.S, mul(n, big)))} L${P(add(add(A.S, mul(n, big)), mul(u, big)))} L${P(add(add(A.S, mul(n, -big)), mul(u, big)))} L${P(add(A.S, mul(n, -big)))} Z`;
    // near sleeve (V4 fix): a copy of the tee covers the crown and the tube's top, opaque down to tm0 and gone by tm1,
    // over the sleeve's fill and side lines; the copy's stripes end on a soft, slightly arched edge (radial ramp about
    // sc, from S + 10 s on the axis). The crown never covers the head (its ellipse, hm).
    const tm0 = add(A.S, mul(u, 20 * s));
    const tm1 = add(A.S, mul(u, 38 * s));
    const scR = 130 * s;
    const sc = add(A.S, mul(u, 10 * s + scR));
    const inkFade = isFar ? [{c: add(top, mul(u, -hc * 0.5)), r: r0 * 1.25}] : [{c: add(top, mul(u, -24 * s)), r: r0 * 1.65}];
    const hR = DIM.headR * s + 7 * inkK * 0.36 + 1;
    if (sleeveCap && !isFar) {
      // V8: a whole short sleeve: a rounded crown over the shoulder joint, its sides down the upper arm to the hem, one
      // ink contour, the tee's stripes not carried onto it (as the far sleeve and the bay's front views)
      const capH = 30 * s;
      const q1 = add(top, mul(n, r0)), q4 = add(top, mul(n, -r0));
      const crownTop = add(top, mul(u, -capH));
      const dCap = `M${P(q1)} L${P(p2)} Q${P(add(hem, mul(u, r1 * 0.36)))} ${P(p3)} L${P(q4)} C${P(add(q4, mul(u, -capH * 1.1)))} ${P(add(crownTop, mul(n, -r0 * 0.6)))} ${P(crownTop)} C${P(add(crownTop, mul(n, r0 * 0.6)))} ${P(add(q1, mul(u, -capH * 1.1)))} ${P(q1)} Z`;
      return {
        inner,
        body: (
          <g key="sl">
            <Inked w={IN} id={`${id}-${k}si`}>
              <Lin id={`${id}-${k}sg`} d={dCap} from={add(mid, mul(ln, r0))} to={add(mid, mul(ln, -r0))} stops={[[0, '#FFFFFF'], [0.45, mix(c, '#F2F5F8', 0.5)], [0.85, mix(c, '#C9D5E0', 0.8)], [1, mix(c, '#B4C3D1', 0.8)]]} />
            </Inked>
            <Deco>
              <path d={`M${P(add(add(A.S, mul(u, 30 * s)), mul(n, -r0 * 0.55)))} Q${P(add(A.S, mul(u, 44 * s)))} ${P(add(add(A.S, mul(u, 34 * s)), mul(n, r0 * 0.5)))}`} fill="none" stroke="#2E4A66" strokeOpacity={0.08} strokeWidth={fmt(4 * s)} strokeLinecap="round" />
            </Deco>
          </g>
        ),
      };
    }
    const body = (
      <g key="sl">
        <defs>
          {isFar ? (
            <radialGradient id={`${id}-${k}sf`} gradientUnits="userSpaceOnUse" cx={fmt(A.S.x)} cy={fmt(A.S.y)} r={fmt(fadeR)}>
              <stop offset="0" stopColor="#FFF" />
              <stop offset="0.45" stopColor="#FFF" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
          ) : (
            <linearGradient id={`${id}-${k}sf`} gradientUnits="userSpaceOnUse" x1={fmt(sf0.x)} y1={fmt(sf0.y)} x2={fmt(sf1.x)} y2={fmt(sf1.y)}>
              <stop offset="0" stopColor="#FFF" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
          )}
          <mask id={`${id}-${k}sm`}>
            <rect x="-20000" y="-20000" width="40000" height="40000" fill={`url(#${id}-${k}sf)`} />
          </mask>
          {!isFar && (
            // the crown is cut by the tee's outline: the tee itself plus everything on the hem side of the shoulder
            <clipPath id={`${id}-${k}cc`}>
              <path d={torsoD} />
              <path d={hemSide} />
            </clipPath>
          )}
        </defs>
        {!isFar && (
          <defs>
            <mask id={`${id}-${k}hm`}>
              <rect x="-20000" y="-20000" width="40000" height="40000" fill="#FFF" />
              <ellipse cx={fmt(j.head.x)} cy={fmt(j.head.y)} rx={fmt(hR)} ry={fmt(hR + 0.07 * DIM.headR * s)} transform={`rotate(${fmt(-(tc + p.neck))} ${fmt(j.head.x)} ${fmt(j.head.y)})`} fill="#000" />
              <path d={hemSide} fill="#FFF" />
            </mask>
          </defs>
        )}
        <g clipPath={isFar ? undefined : `url(#${id}-${k}cc)`} mask={isFar ? undefined : `url(#${id}-${k}hm)`}>
        {/* the crown's contour dissolves into the shoulder; the sides keep theirs below it */}
        <Inked w={IN} id={`${id}-${k}si`} fade={inkFade}>
          <Lin id={`${id}-${k}sg`} d={d} from={add(mid, mul(ln, r0))} to={add(mid, mul(ln, -r0))} stops={o.stripe ? [[0, '#FFFFFF'], [0.45, mix(c, '#F2F5F8', 0.5)], [0.85, mix(c, '#C9D5E0', 0.8)], [1, mix(c, '#B4C3D1', 0.8)]] : [[0, lit(c, 0.2)], [0.45, c], [0.85, shade(c, 0.22)], [1, shade(c, 0.34)]]} />
        </Inked>
        {!isFar && (
          // V4 fix: the sleeve's top IS the tee: the tee's own fill, stripes and form shading (its gradients, by id) are
          // painted again, opaque, over the crown and the crown's side lines, and fade out down the tube, so the sleeve
          // emerges from the shoulder with no run-on lines and no translucent strip; the stripes end on a clean,
          // slightly rounded edge (no smear) where the plain sleeve begins
          <Deco>
            <defs>
              <linearGradient id={`${id}-${k}tg`} gradientUnits="userSpaceOnUse" x1={fmt(tm0.x)} y1={fmt(tm0.y)} x2={fmt(tm1.x)} y2={fmt(tm1.y)}>
                <stop offset="0" stopColor="#FFF" />
                <stop offset="1" stopColor="#000" />
              </linearGradient>
              <mask id={`${id}-${k}tm`}>
                <path d={d} fill={`url(#${id}-${k}tg)`} stroke={`url(#${id}-${k}tg)`} strokeWidth={fmt(2 * (IN * 0.36 + 2 * s))} strokeLinejoin="round" />
              </mask>
              <radialGradient id={`${id}-${k}rg`} gradientUnits="userSpaceOnUse" cx={fmt(sc.x)} cy={fmt(sc.y)} r={fmt(scR)}>
                <stop offset="0" stopColor="#000" />
                <stop offset={fmt((scR - 10 * s) / scR)} stopColor="#000" />
                <stop offset="1" stopColor="#FFF" />
              </radialGradient>
              <mask id={`${id}-${k}sc`}>
                <rect x="-20000" y="-20000" width="40000" height="40000" fill={`url(#${id}-${k}rg)`} />
              </mask>
            </defs>
            <g clipPath={`url(#${id}-tclip)`}>
              <g mask={`url(#${id}-${k}tm)`}>
                <path d={torsoD} fill={`url(#${id}-tor)`} />
                <g mask={`url(#${id}-${k}sc)`}>
                  {o.stripe && stripes.map((sd, i) => (
                    <path key={i} d={sd} fill={o.stripe ?? undefined} />
                  ))}
                </g>
                <path d={torsoD} fill={`url(#${id}-tf)`} />
                <path d={torsoD} fill={`url(#${id}-tb)`} />
                <InkLine d={`M${P(loc(j.C, tc, 146, -36))} Q${P(loc(j.C, tc, 128, 0))} ${P(loc(j.C, tc, 148, 32))}`} w={OUT * 0.7} />
              </g>
            </g>
          </Deco>
        )}
        {!isFar && (
          // where the far forearm or hand passes behind the crown, the sleeve's edge stays drawn as an occlusion line
          // (only over that arm: an alpha mask of its silhouette), so the fingers tuck behind the arm, not into the tee
          <Deco>
            <defs>
              <mask id={`${id}-${k}om`} style={{maskType: 'alpha'}}>
                <Inked w={IN}>
                  <Capsule id={`${id}-${k}oa`} a={j.R.E} b={j.R.W} ra={23.5 * s} rb={17 * s} color="#000" />
                  <Hand id={`${id}-${k}oh`} wrist={add(j.R.W, mul(j.R.foreDir, -6 * s))} ang={j.R.handAng} L={DIM.hand * s} thumbSide={-1} view="back" pose={rHand} color="#000" ink={IN * 0.9} bare />
                </Inked>
              </mask>
              <clipPath id={`${id}-${k}ox`}>
                <path d={`M-20000 -20000 H20000 V20000 H-20000 Z ${d}`} clipRule="evenodd" />
              </clipPath>
            </defs>
            <g mask={`url(#${id}-${k}om)`}>
              <path d={d} fill="none" stroke={INK} strokeWidth={fmt(IN * 0.72)} strokeLinejoin="round" clipPath={`url(#${id}-${k}ox)`} />
            </g>
          </Deco>
        )}
        <Deco>
          {/* soft fold where the sleeve gathers at the shoulder, and a sheen along the lit side */}
          <path d={`M${P(add(add(A.S, mul(u, 30 * s)), mul(n, -r0 * 0.55)))} Q${P(add(A.S, mul(u, 44 * s)))} ${P(add(add(A.S, mul(u, 34 * s)), mul(n, r0 * 0.5)))}`} fill="none" stroke="#2E4A66" strokeOpacity={0.06} strokeWidth={fmt(4 * s)} strokeLinecap="round" />
          <ellipse cx={fmt(add(mid, mul(ln, r0 * 0.55)).x)} cy={fmt(add(mid, mul(ln, r0 * 0.55)).y)} rx={fmt(26 * s)} ry={fmt(4 * s)} transform={`rotate(${fmt(ang(u))} ${fmt(add(mid, mul(ln, r0 * 0.55)).x)} ${fmt(add(mid, mul(ln, r0 * 0.55)).y)})`} fill="#FFFFFF" opacity={0.5} />
        </Deco>
        </g>
      </g>
    );
    return {inner, body};
  };

  // the near arm's skin starts a little down its own axis from the shoulder joint, so its rounded top (and its contour)
  // stays inside the tee's shoulder line, under the sleeve, which is now cut by that line
  const nearArmTop = add(j.L.S, mul(norm(sub(j.L.E, j.L.S)), (sleeveCap ? 32 : 5) * s));
  // V4: the flesh in the crook of a tightly folded arm. Where the upper arm and the forearm close to a narrow V (the
  // far arm's chest clutch), the two tubes alone leave a sliver between them through which the far knee showed as a
  // dark tick beside the tee; this fills the crook in a shaded skin tone, out to where the tee covers it.
  const crookWeb = (A: Joints['L']) => {
    const uS = norm(sub(A.S, A.E));
    const uW = norm(sub(A.W, A.E));
    const th = (Math.acos(clamp(dot(uS, uW), -1, 1)) * 180) / Math.PI;
    const k = sstep(55, 35, th);
    if (k <= 0) return null;
    const dd = k * 0.78 * Math.min(len(sub(A.S, A.E)), len(sub(A.W, A.E)));
    return `M${P(A.E)} L${P(add(A.E, mul(uS, dd)))} L${P(add(A.E, mul(uW, dd)))} Z`;
  };
  // an arm's skin + hand as one contour group (the hand's palm and fingers join the forearm's silhouette)
  const armGroup = (k: string, A: Joints['L'], isFar: boolean, hp: HandPose, thumbSide: 1 | -1) => {
    const sk = isFar ? far(skin) : skin;
    const web = isFar ? crookWeb(A) : null;
    return (
      <Inked w={IN} key={k}>
        {web && <InkPath d={web} fill={shade(sk, 0.18)} />}
        {/* the far arm's tightly folded elbow shows no inner crease (that side of the fold is hidden) */}
        <Limb id={`${id}-${k}lb`} A={isFar ? A.S : nearArmTop} B={A.E} C={A.W} rA={29 * s} rB={23.5 * s} rC={o.longSleeve ? 21 * s : 17 * s} color={o.longSleeve ? (isFar ? far(o.shirt) : o.shirt) : sk} spec={0.22} crease={isFar ? 0 : IN * 0.8} />
        <Hand id={`${id}-${k}h`} wrist={add(A.W, mul(A.foreDir, -6 * s))} ang={A.handAng} L={DIM.hand * s} thumbSide={thumbSide} view="back" pose={hp} color={o.glove ? (isFar ? far(o.glove) : o.glove) : sk} ink={IN * 0.9} bare sheen={o.glove ? 0.2 : 1} />
      </Inked>
    );
  };
  // the far (right) arm: the whole arm behind the torso, then the forearm and hand again in front of it, cut at the
  // elbow's bisector so the forearm crosses the chest while the upper arm stays behind
  const farSleeve = sleeveParts('rs', j.R, true);
  const nearSleeve = sleeveParts('ls', j.L, false);
  // the near leg in front of the torso (sitting): cut past the hip so the tee's hem stays over the top of the thigh
  const nearLeg = Leg('ll', j.lLeg, false);

  return (
    <Inked w={OUT}>
      {Leg('rl', j.rLeg, true)}
      {afterFarLeg && <Deco>{afterFarLeg}</Deco>}
      {farSleeve.inner}
      {armGroup('ra', j.R, true, rHand, -1)}
      {farSleeve.body}
      <Inked w={IN}>
        <Blob id={`${id}-pel`} d={pelD} c={loc(j.H, p.pelvis, -10, -30)} r={120 * s} color={o.pants} />
      </Inked>
      {nearLeg}
      {afterNearLeg && <Deco>{afterNearLeg}</Deco>}
      {/* neck behind the tee's neckline */}
      <Inked w={IN}>
        <Capsule id={`${id}-nk`} a={add(j.N, mul(up(tc), -24 * s))} b={add(j.N, mul(up(tc + p.neck), 46 * s))} ra={30 * s} rb={28 * s} color={shade(skin, 0.08)} />
      </Inked>
      {/* tee */}
      <Inked w={IN}>
        <Blob id={`${id}-tor`} d={torsoD} c={torsoC} r={210 * s} color={o.shirt} k={1.1} stops={o.stripe ? [[0, '#FFFFFF'], [0.5, '#F8FAFC'], [0.82, '#DCE3EA'], [1, '#B9C6D3']] : [[0, lit(o.shirt, 0.22)], [0.5, o.shirt], [0.82, shade(o.shirt, 0.2)], [1, shade(o.shirt, 0.38)]]} />
      </Inked>
      <Deco>
        <defs>
          <clipPath id={`${id}-tclip`}>
            <path d={torsoD} />
          </clipPath>
          {/* the far forearm is in front of the tee where it crosses it; elsewhere the arm behind the body shows */}
          <mask id={`${id}-rfm`}>
            <path d={torsoD} fill="#FFF" stroke="#FFF" strokeWidth={fmt(OUT * 0.8 + 2)} strokeLinejoin="round" />
          </mask>
          {/* the near thigh is in front of the body, except where the tee's lower edge hangs over the hip */}
          <clipPath id={`${id}-llh`}>
            <circle cx={fmt(j.lLeg.hp.x)} cy={fmt(j.lLeg.hp.y)} r={fmt(96 * s)} />
          </clipPath>
          <mask id={`${id}-llm`}>
            <rect x="-20000" y="-20000" width="40000" height="40000" fill="#FFF" />
            <g clipPath={`url(#${id}-llh)`}>
              <path d={torsoD} fill="#000" />
            </g>
          </mask>
        </defs>
        <g clipPath={`url(#${id}-tclip)`}>
          {o.stripe && stripes.map((d, i) => (
            <path key={i} d={d} fill={o.stripe ?? undefined} />
          ))}
          {/* cylindrical form shading across the tee and stripes: lit front edge -> cool shadowed back edge */}
          <Lin id={`${id}-tf`} d={torsoD} from={loc(j.C, tc, 40, -100)} to={loc(j.C, tc, 40, 96)} stops={[[0, '#FFFFFF', 0.4], [0.3, '#FFFFFF', 0], [0.6, '#2E4A66', 0], [1, '#2E4A66', 0.32]]} />
          <Lin id={`${id}-tb`} d={torsoD} from={loc(j.H, p.torso, 120, 0)} to={loc(j.H, p.torso, -20, 0)} stops={[[0, '#2E4A66', 0], [1, '#2E4A66', 0.16]]} />
          {/* soft folds where the tee gathers at the waist: shallow crease strokes that fade at both ends (V4: no
              filled discs) */}
          {[
            [70, 0, 46, 9, 8],
            [36, -30, 34, 7, -6],
          ].map(([u, vv, rx, ry, a], i) => {
            const e = (t: number, h: number) => loc(j.H, p.torso + a * 0.2, u + h, vv + t * rx);
            const fid = `${id}-wf${i}`;
            const g0 = e(-1, 0);
            const g1 = e(1, 0);
            return (
              <g key={i}>
                <defs>
                  <linearGradient id={fid} gradientUnits="userSpaceOnUse" x1={fmt(g0.x)} y1={fmt(g0.y)} x2={fmt(g1.x)} y2={fmt(g1.y)}>
                    <stop offset="0" stopColor="#2E4A66" stopOpacity={0} />
                    <stop offset="0.5" stopColor="#2E4A66" stopOpacity={0.16} />
                    <stop offset="1" stopColor="#2E4A66" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={`M${P(g0)} Q${P(e(0, -ry * 1.4))} ${P(g1)}`} fill="none" stroke={`url(#${fid})`} strokeWidth={fmt(3.2 * s)} strokeLinecap="round" />
              </g>
            );
          })}
          {/* glossy sheen across the chest */}
          <ellipse cx={fmt(loc(j.C, tc, 96, -40).x)} cy={fmt(loc(j.C, tc, 96, -40).y)} rx={fmt(44 * s)} ry={fmt(16 * s)} transform={`rotate(${fmt(-tc - 30)} ${fmt(loc(j.C, tc, 96, -40).x)} ${fmt(loc(j.C, tc, 96, -40).y)})`} fill="#FFFFFF" opacity={0.35} />
        </g>
        {/* neckline */}
        <InkLine d={`M${P(loc(j.C, tc, 146, -36))} Q${P(loc(j.C, tc, 128, 0))} ${P(loc(j.C, tc, 148, 32))}`} w={OUT * 0.7} />
      </Deco>
      <Head id={`${id}-hd`} c={j.head} R={DIM.headR * s} roll={-(tc + p.neck)} turn={p.turn} expr={expr} blink={blink} hairSway={hairSway} inkW={7 * inkK} skin={o.skin} hair={o.hair} hat={o.hat} mask={o.mask} glasses={o.glasses} crop={o.crop} />
      <Deco>
        {children}
        {overTorso}
      </Deco>
      {/* the far forearm and hand cross the chest in front of the tee (behind the raised near thigh) */}
      <g mask={`url(#${id}-rfm)`}>
        <Inked w={IN}>
          <Capsule id={`${id}-rffa`} a={j.R.E} b={j.R.W} ra={23.5 * s} rb={o.longSleeve ? 21 * s : 17 * s} color={o.longSleeve ? far(o.shirt) : far(skin)} spec={0.2} />
          <Hand id={`${id}-rfh`} wrist={add(j.R.W, mul(j.R.foreDir, -6 * s))} ang={j.R.handAng} L={DIM.hand * s} thumbSide={-1} view="back" pose={rHand} color={far(o.glove ?? skin)} ink={IN * 0.9} bare sheen={o.glove ? 0.2 : 1} />
        </Inked>
      </g>
      {nearLegFront && (
        <g mask={`url(#${id}-llm)`}>
          <Inked w={IN}>
            <Limb id={`${id}-llf`} A={j.lLeg.hp} B={j.lLeg.K} C={add(j.lLeg.A, mul(dirDown(j.lLeg.shinAng), -8 * s))} rA={43 * s} rB={33 * s} rC={28 * s} color={o.pants} spec={0.12} crease={IN * 0.8} />
          </Inked>
        </g>
      )}
      {nearLegFront && (
        // V4: where the tee's lower edge lies over the raised thigh (the edge of the hidden disc round the hip) it is
        // drawn as the tee's own edge, an ink line with a soft shadow on the thigh, so the thigh passes under the tee
        // instead of ending in an unlined navy point on the shirt
        <Deco>
          <defs>
            <clipPath id={`${id}-llt`}>
              <path d={limbGeo(j.lLeg.hp, j.lLeg.K, add(j.lLeg.A, mul(dirDown(j.lLeg.shinAng), -8 * s)), 43 * s, 33 * s, 28 * s).d} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-tclip)`}>
            <g clipPath={`url(#${id}-llt)`}>
              <circle cx={fmt(j.lLeg.hp.x)} cy={fmt(j.lLeg.hp.y)} r={fmt(96 * s + 5 * s)} fill="none" stroke="#0B1622" strokeOpacity={0.22} strokeWidth={fmt(10 * s)} />
              <circle cx={fmt(j.lLeg.hp.x)} cy={fmt(j.lLeg.hp.y)} r={fmt(96 * s)} fill="none" stroke={INK} strokeWidth={fmt(IN * 0.62)} />
            </g>
          </g>
        </Deco>
      )}
      <Deco>{afterRightArm}</Deco>
      {!hideLeftForearm && nearSleeve.inner}
      {!hideLeftForearm && armGroup('la', j.L, false, lHand, 1)}
      {!hideLeftForearm && nearSleeve.body}
      <Deco>{beforeLeftForearm}</Deco>
      <Deco>{overAll}</Deco>
    </Inked>
  );
};

export const lerpPose = (a: ManPose, b: ManPose, t: number): ManPose => {
  const o = {} as ManPose;
  const A = a as unknown as Record<string, number>, B = b as unknown as Record<string, number>, O = o as unknown as Record<string, number>;
  Object.keys(A).forEach((k) => (O[k] = (A[k] ?? 0) + ((B[k] ?? 0) - (A[k] ?? 0)) * t));
  return o;
};

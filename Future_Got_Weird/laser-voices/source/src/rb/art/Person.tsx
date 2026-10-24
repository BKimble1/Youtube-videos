// The rebuild's body rig, drawn in the Death Clock finish (one ink contour per figure, cylinder-shaded single-contour
// limbs from lib/limb, five-digit hands, a fixed key light). One rig for all three characters; the outfit and the face
// (art/Face) make them different people. The body is seen anywhere from profile (yaw 0) to three-quarter (yaw 1),
// facing screen-left, or screen-right with `flip` (the geometry is mirrored; shading stays world-lit).
// Units: the face's head units (head half-width ~90, crown to chin 226). Proportions are adult: about 7.3 heads tall.
// Arms are two-bone IK chains to hand targets in the body's own frame (u forward, v down from the shoulder line) or in
// the world; legs are two-bone IK chains to planted ankles in the world, so feet never slide.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../lib/ink';
import {Limb} from '../lib/limb';
import {add, clamp, fmt, len, lerp, lerpV, mul, norm, P, perp, sub, V} from '../lib/math';
import {Blob, Capsule, Lin, LIGHT, SoftShadow} from '../lib/shade';
import {Expr, Face, Look} from './Face';
import {Hand, HandPose, HAND_RELAXED} from './Hand';
import {Outfit} from '../cast';

export const DIM = {
  neck: 62,
  headUp: 112,
  torso: 500,
  upperArm: 280,
  foreArm: 252,
  hand: 150,
  thigh: 400,
  shin: 392,
  foot: 205,
};

export type Pose = {
  /** hip centre in the world */
  x: number;
  y: number;
  s: number;
  /** 0 profile .. 1 three-quarter */
  yaw: number;
  /** face turn passed to the head (0 front .. 1 profile facing the body's way; negative turns the other way) */
  head: number;
  /** torso lean (deg, + = forward) */
  lean: number;
  /** extra bend of the chest (deg, + = forward) */
  chest: number;
  /** head tilt on the neck (deg, + = chin down / forward) */
  nod: number;
  /** head roll in the picture plane (deg) */
  roll: number;
  /** shoulder shrug 0..1 */
  shrug: number;
  // hands in the body frame: u forward, v down from the shoulder line (units); or in the world, blended by nW/fW
  nU: number;
  nV: number;
  fU: number;
  fV: number;
  nWx?: number;
  nWy?: number;
  nW?: number;
  fWx?: number;
  fWy?: number;
  fW?: number;
  /** elbow side +1 (elbow back/down) / -1; with a pole, the elbow goes toward the pole instead */
  nElb: number;
  fElb: number;
  /** elbow pole in the chest frame (u forward, v down from the shoulder line) */
  nPoleU?: number;
  nPoleV?: number;
  fPoleU?: number;
  fPoleV?: number;
  /** wrist bend (deg) */
  nWr: number;
  fWr: number;
  /** absolute hand direction (deg, wrist to knuckles), overriding the wrist bend, blended by the world weight */
  nHandAng?: number;
  fHandAng?: number;
  // planted ankles (world), with the foot's lift off the ground (units) and its pitch (deg)
  nAx: number;
  nAy: number;
  fAx: number;
  fAy: number;
  nLift?: number;
  fLift?: number;
  nPitch?: number;
  fPitch?: number;
  breath?: number;
};

const RAD = Math.PI / 180;
const ang = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const rotV = (p: V, a: number): V => ({x: p.x * Math.cos(a * RAD) - p.y * Math.sin(a * RAD), y: p.x * Math.sin(a * RAD) + p.y * Math.cos(a * RAD)});

const SOFT_IK = 0.97;
const ik = (S: V, T: V, l1: number, l2: number, side: number) => {
  const d0 = sub(T, S);
  const Lt = l1 + l2;
  const d = Math.max(len(d0), Math.abs(l1 - l2) + 0.5);
  const ds = SOFT_IK * Lt;
  const reach = d <= ds ? d : ds + (Lt - ds) * (1 - Math.exp(-(d - ds) / (Lt - ds)));
  const dir = norm(d0);
  const a = (l1 * l1 + reach * reach - l2 * l2) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const E = add(add(S, mul(dir, a)), mul(perp(dir), h * side));
  const W = add(S, mul(dir, reach));
  return {E, W};
};

export type Joints = ReturnType<typeof joints>;
/** All joint positions in the world (shared by the drawing, contact shadows, beam tests and camera targets). */
export const joints = (p: Pose, flip = false) => {
  const s = p.s;
  const fx = flip ? -1 : 1;
  // forward is -x (facing screen-left), mirrored by flip
  const F: V = {x: -fx, y: 0};
  const H: V = {x: p.x, y: p.y};
  // the body's frame: up and forward, leaned
  const lean = p.lean * fx;
  const up = rotV({x: 0, y: -1}, -lean);
  const fwd = rotV(F, -lean);
  const chestA = (p.lean + p.chest) * fx;
  const upC = rotV({x: 0, y: -1}, -chestA);
  const fwdC = rotV(F, -chestA);
  const W0 = add(H, mul(up, DIM.torso * 0.45 * s)); // waist
  const Sh = add(W0, mul(upC, DIM.torso * 0.55 * s)); // shoulder line centre
  const loc = (O: V, u: number, v: number, U = fwdC, D = mul(upC, -1)) => add(O, add(mul(U, u * s), mul(D, v * s)));
  const yaw = p.yaw;
  const shrug = p.shrug * 18;
  const nS = loc(Sh, lerp(-6, -78, yaw), 14 - shrug);
  const fS = loc(Sh, lerp(6, 66, yaw), 4 - shrug * 0.8);
  const neckBase = loc(Sh, lerp(8, 4, yaw), -6);
  const nodA = chestA + p.nod * fx;
  const upN = rotV({x: 0, y: -1}, -nodA);
  const chin = add(neckBase, mul(upN, DIM.neck * s));
  const head = add(add(chin, mul(upN, DIM.headUp * s * 0.9)), mul(rotV(F, -nodA), 8 * s));
  const arm = (S: V, u: number, v: number, wx: number | undefined, wy: number | undefined, w: number | undefined, elb: number, wr: number, pu?: number, pv?: number, ha?: number) => {
    const local = loc(S, u, v);
    const T = w && wx !== undefined && wy !== undefined ? lerpV(local, {x: wx, y: wy}, clamp(w)) : local;
    // the elbow takes whichever side of the shoulder-hand line is nearer its pole (default: behind and below the
    // shoulder), so it never flips across the body when the hand rises
    const pole = loc(S, pu ?? -90 * elb, pv ?? 300);
    const a1 = ik(S, T, DIM.upperArm * s, DIM.foreArm * s, 1);
    const a2 = ik(S, T, DIM.upperArm * s, DIM.foreArm * s, -1);
    const {E, W} = len(sub(a1.E, pole)) < len(sub(a2.E, pole)) ? a1 : a2;
    const fd = norm(sub(W, E));
    const rel = ang(fd) + wr * -fx;
    const abs = ha === undefined ? rel : rel + ((((ha - rel) % 360) + 540) % 360 - 180) * clamp(w ?? 0);
    return {S, E, W, fd, handAng: abs};
  };
  const N = arm(nS, p.nU, p.nV, p.nWx, p.nWy, p.nW, p.nElb, p.nWr, p.nPoleU, p.nPoleV, p.nHandAng);
  const Fa = arm(fS, p.fU, p.fV, p.fWx, p.fWy, p.fW, p.fElb, p.fWr, p.fPoleU, p.fPoleV, p.fHandAng);
  const nHip = loc(H, lerp(-8, -62, yaw), 0, fwd, mul(up, -1));
  const fHip = loc(H, lerp(8, 56, yaw), -4, fwd, mul(up, -1));
  const leg = (hp: V, ax: number, ay: number, lift: number, pitch: number) => {
    const T = {x: ax, y: ay - lift * s};
    // knee forward
    const {E: K, W: A} = ik(hp, T, DIM.thigh * s, DIM.shin * s, fx);
    const footDir = rotV(F, -pitch * fx);
    return {hp, K, A, footDir};
  };
  const nL = leg(nHip, p.nAx, p.nAy, p.nLift ?? 0, p.nPitch ?? 0);
  const fL = leg(fHip, p.fAx, p.fAy, p.fLift ?? 0, p.fPitch ?? 0);
  return {H, W0, Sh, nS, fS, neckBase, chin, head, N, F: Fa, nL, fL, up, upC, fwd, fwdC, F0: F, s, fx, nodA, loc};
};

const smoothClosed = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    d += ` C${P(add(p1, mul(sub(p2, p0), 1 / 6)))} ${P(add(p2, mul(sub(p1, p3), 1 / 6)))} ${P(p2)}`;
  }
  return d + ' Z';
};

type Props = {
  id: string;
  pose: Pose;
  flip?: boolean;
  look: Look;
  fit: Outfit;
  expr: Expr;
  blink?: number;
  nHand?: HandPose;
  fHand?: HandPose;
  /** drawn in the near hand (world space, after the hand) */
  prop?: React.ReactNode;
  /** contour width multiplier */
  inkK?: number;
  sway?: number;
  /** ground contact shadow at this y (world) */
  ground?: number;
  /** skip drawing the head (a close-up draws its own) */
  noHead?: boolean;
  /** the near ear in anatomical detail 0..1 */
  earDetail?: number;
};

export const Person: React.FC<Props> = ({id, pose: p, flip = false, look, fit, expr, blink = 0, nHand = HAND_RELAXED, fHand = HAND_RELAXED, prop, inkK = 1, sway = 0, ground, noHead, earDetail = 0}) => {
  const j = joints(p, flip);
  const s = p.s;
  const yaw = p.yaw;
  const fx = j.fx;
  const OUT = 7 * s * inkK;
  const IN = OUT * 0.72;
  const far = (c: string) => shade(c, 0.16);
  const br = 1 + 0.025 * (p.breath ?? 0);
  // torso outline in the chest frame (u forward, v down from the shoulder line); the lower part follows the pelvis frame
  const T = (u: number, v: number) => j.loc(j.Sh, u, v);
  const Hp = (u: number, v: number) => j.loc(j.H, u, v, j.fwd, mul(j.up, -1));
  const fr = (a: number, b: number) => lerp(a, b, yaw);
  const hemV = 30; // jacket hem below the hip line (pelvis frame)
  const torsoPts: V[] = [
    T(fr(18, 4), -18), // neck front
    T(fr(78, 120), 24), // chest top / far shoulder front
    T(fr(104, 140) * br, 100),
    T(fr(90, 126), 230),
    Hp(fr(82, 118), -120),
    Hp(fr(84, 120), -10),
    Hp(fr(80, 116), hemV), // hem front
    Hp(fr(-78, -118), hemV + 4), // hem back
    Hp(fr(-92, -124), -20),
    Hp(fr(-78, -112), -130),
    T(fr(-84, -134), 230),
    T(fr(-98, -146), 90),
    T(fr(-84, -138), 20), // near shoulder top
    T(fr(-30, -24), -18), // neck back
  ];
  const torsoD = smoothClosed(torsoPts);
  // shirt showing in the open jacket's front (3/4: a band on the far-front side; profile: a sliver)
  const openD = fit.open
    ? smoothClosed([T(fr(4, 4), -14), T(fr(54, 84), 28), T(fr(66, 96), 180), Hp(fr(54, 82), hemV - 2), Hp(fr(42, 38), hemV - 2), T(fr(42, 22), 150), T(fr(24, 6), 30)])
    : '';
  const pelD = smoothClosed([Hp(fr(-84, -116), -40), Hp(fr(82, 114), -40), Hp(fr(86, 118), 40), Hp(fr(50, 76), 100), Hp(fr(-50, -66), 104), Hp(fr(-90, -120), 40)]);

  const jacket = fit.jacket;
  const sleeveR = {S: 47 * s, E: 38 * s, W: 31 * s};
  const Arm = (k: string, A: Joints['N'], isFar: boolean, hp: HandPose, thumbSide: 1 | -1) => {
    const c = isFar ? far(jacket) : jacket;
    const sk = isFar ? far(look.skin) : look.skin;
    const cuffA = add(A.W, mul(A.fd, -26 * s));
    const nrm = perp(A.fd);
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}i`}>
          <Limb id={`${id}-${k}l`} A={A.S} B={A.E} C={add(A.W, mul(A.fd, -4 * s))} rA={sleeveR.S} rB={sleeveR.E} rC={sleeveR.W} color={c} spec={0.14} crease={IN * 0.7} capC="flat" />
        </Inked>
        <Inked w={IN * 0.9}>
          <Hand id={`${id}-${k}h`} wrist={add(A.W, mul(A.fd, -2 * s))} ang={A.handAng} L={DIM.hand * s} thumbSide={(thumbSide * fx) as 1 | -1} view="back" pose={hp} color={sk} ink={IN * 0.85} />
        </Inked>
        <Deco>
          {/* the cuff: a darker turned band at the wrist end of the sleeve */}
          <path d={`M${P(add(cuffA, mul(nrm, sleeveR.W * 1.04)))} L${P(add(add(A.W, mul(A.fd, -2 * s)), mul(nrm, sleeveR.W * 1.04)))} L${P(add(add(A.W, mul(A.fd, -2 * s)), mul(nrm, -sleeveR.W * 1.04)))} L${P(add(cuffA, mul(nrm, -sleeveR.W * 1.04)))} Z`} fill={shade(c, 0.22)} opacity={0.9} />
          <InkLine d={`M${P(add(cuffA, mul(nrm, sleeveR.W)))} L${P(add(cuffA, mul(nrm, -sleeveR.W)))}`} w={IN * 0.5} opacity={0.6} />
        </Deco>
      </g>
    );
  };
  const Leg = (k: string, L: Joints['nL'], isFar: boolean) => {
    const pc = isFar ? far(fit.pants) : fit.pants;
    const shoe = isFar ? far(fit.shoe) : fit.shoe;
    const sd = norm(sub(L.A, L.K));
    const F = (x: number, y: number) => add(add(L.A, mul(L.footDir, x * s)), mul({x: 0, y: 1}, y * s));
    const upper = smoothClosed([F(-34, -16), F(-36, 16), F(40, 26), F(150, 28), F(178, 20), F(172, 2), F(120, -14), F(50, -30), F(0, -40), F(-26, -34)]);
    const sole = smoothClosed([F(-38, 14), F(176, 18), F(176, 34), F(60, 38), F(-36, 34)]);
    const ankle = add(L.A, mul(sd, -16 * s));
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}i`}>
          <Limb id={`${id}-${k}l`} A={L.hp} B={L.K} C={ankle} rA={68 * s} rB={47 * s} rC={37 * s} color={pc} spec={0.1} crease={IN * 0.7} capC="flat" />
        </Inked>
        <Inked w={IN * 0.9}>
          <Blob id={`${id}-${k}so`} d={sole} c={F(60, 26)} r={120 * s} color={fit.sole} k={0.5} />
          <Blob id={`${id}-${k}sh`} d={upper} c={F(40, -10)} r={130 * s} color={shoe} k={0.9} />
        </Inked>
        <Deco>
          <ellipse cx={fmt(F(110, -2).x)} cy={fmt(F(110, -2).y)} rx={fmt(26 * s)} ry={fmt(7 * s)} transform={`rotate(${fmt(ang(L.footDir))} ${fmt(F(110, -2).x)} ${fmt(F(110, -2).y)})`} fill="#FFFFFF" opacity={0.6} />
          <path d={`M${P(F(10, -30))} Q${P(F(50, -18))} ${P(F(70, -8))}`} fill="none" stroke={shade(shoe, 0.35)} strokeWidth={fmt(4 * s)} strokeLinecap="round" opacity={0.6} />
        </Deco>
      </g>
    );
  };

  // collars
  const collar = () => {
    if (fit.collar === 'hood') {
      // a soft hood gathered behind the neck
      const hd = smoothClosed([T(fr(-12, -20), -30), T(fr(-60, -86), -20), T(fr(-92, -118), 30), T(fr(-60, -70), 62), T(fr(-8, 10), 30)]);
      return (
        <Inked w={IN}>
          <Blob id={`${id}-hood`} d={hd} c={T(-50, 10)} r={110 * s} color={shade(jacket, 0.06)} />
        </Inked>
      );
    }
    if (fit.collar === 'lapel') {
      const ld = smoothClosed([T(fr(-16, -40), -22), T(fr(16, 10), -26), T(fr(44, 70), 24), T(fr(30, 52), 80), T(fr(8, 20), 30), T(fr(-20, -46), 10)]);
      return (
        <Inked w={IN}>
          <Lin id={`${id}-lap`} d={ld} from={T(0, -20)} to={T(40, 70)} stops={[[0, lit(jacket, 0.18)], [1, shade(jacket, 0.15)]]} />
        </Inked>
      );
    }
    const bd = smoothClosed([T(fr(-22, -40), -30), T(fr(14, 16), -32), T(fr(22, 26), -6), T(fr(-18, -34), -2)]);
    return (
      <Inked w={IN}>
        <Lin id={`${id}-band`} d={bd} from={T(0, -30)} to={T(0, 0)} stops={[[0, lit(jacket, 0.15)], [1, shade(jacket, 0.18)]]} />
      </Inked>
    );
  };

  const headTilt = -(j.nodA) ; // deg in picture plane
  const torsoC = T(fr(-20, -40), 80);
  return (
    <g>
      {ground !== undefined && (
        <SoftShadow id={`${id}-gs`} c={{x: (j.nL.A.x + j.fL.A.x) / 2 - fx * 40 * s, y: ground}} rx={(Math.abs(j.nL.A.x - j.fL.A.x) / 2 + 200 * s)} ry={34 * s} alpha={0.42} color="#04141A" />
      )}
      <Inked w={OUT}>
        {Leg('fl', j.fL, true)}
        {Arm('fa', j.F, true, fHand, -1)}
        <Inked w={IN}>
          <Blob id={`${id}-pel`} d={pelD} c={Hp(-20, 0)} r={160 * s} color={fit.pants} />
        </Inked>
        {Leg('nl', j.nL, false)}
        {/* neck */}
        <Inked w={IN}>
          <Capsule id={`${id}-nk`} a={add(j.neckBase, mul(j.upC, -20 * s))} b={add(j.chin, mul(j.upC, 30 * s))} ra={40 * s} rb={36 * s} color={shade(look.skin, 0.12)} />
        </Inked>
        {fit.collar === 'hood' && collar()}
        {/* torso: the jacket, the shirt in its open front, form shading */}
        <Inked w={IN}>
          <Blob id={`${id}-tor`} d={torsoD} c={torsoC} r={300 * s} color={jacket} k={1.05} />
        </Inked>
        <Deco>
          <defs>
            <clipPath id={`${id}-tc`}>
              <path d={torsoD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-tc)`}>
            {openD && <path d={openD} fill={fit.shirt} />}
            {openD && <path d={openD} fill="none" stroke={INK} strokeWidth={fmt(IN * 0.5)} opacity={0.7} />}
            {fit.collar === 'hood' && (
              // the bomber's zip and ribbed hem
              <>
                <path d={`M${P(T(fr(30, 60), -10))} L${P(Hp(fr(40, 66), hemV))}`} stroke={shade(jacket, 0.4)} strokeWidth={fmt(4 * s)} />
                <path d={`M${P(Hp(fr(-80, -130), hemV - 26))} L${P(Hp(fr(80, 130), hemV - 26))} L${P(Hp(fr(80, 130), hemV + 10))} L${P(Hp(fr(-80, -130), hemV + 10))} Z`} fill={shade(jacket, 0.2)} />
              </>
            )}
            <Lin id={`${id}-tf`} d={torsoD} from={T(fr(80, 130), 80)} to={T(fr(-80, -130), 80)} stops={[[0, '#FFFFFF', 0.12], [0.35, '#FFFFFF', 0], [0.7, '#0B1D2A', 0], [1, '#0B1D2A', 0.3]]} />
            <ellipse cx={fmt(T(fr(20, 30), 70).x)} cy={fmt(T(fr(20, 30), 70).y)} rx={fmt(60 * s)} ry={fmt(18 * s)} transform={`rotate(${fmt(-30)} ${fmt(T(fr(20, 30), 70).x)} ${fmt(T(fr(20, 30), 70).y)})`} fill="#FFFFFF" opacity={0.22} />
            {/* the arm's shadow on the side of the jacket */}
            <ellipse cx={fmt(j.nS.x)} cy={fmt(j.nS.y + 150 * s)} rx={fmt(40 * s)} ry={fmt(150 * s)} fill="#06121A" opacity={0.18} />
          </g>
        </Deco>
        {fit.collar !== 'hood' && collar()}
        {!noHead && (
          <Face id={`${id}-f`} c={j.head} s={s} roll={headTilt} turn={Math.abs(p.head)} flip={p.head < 0 ? !flip : flip} expr={p.head < 0 ? {...expr, gx: -expr.gx} : expr} blink={blink} look={look} inkW={7 * inkK} sway={sway} earDetail={earDetail} />
        )}
        {Arm('na', j.N, false, nHand, 1)}
      </Inked>
      {prop}
    </g>
  );
};

/** The near ear in the world (where the beam lands), for overlays and beam tests. */
export const earOf = (p: Pose, flip = false) => {
  const j = joints(p, flip);
  const t = Math.min(1, Math.abs(p.head));
  const ex = 88 * Math.sin((96 - t * 90) * RAD);
  const roll = -j.nodA;
  const local = {x: ex * p.s * j.fx * (p.head < 0 ? -1 : 1), y: 6 * p.s};
  return add(j.head, rotV(local, roll));
};

/** A planted-foot walk: explicit steps (each foot lifts at t0 and lands at t1, moving from x0 to x1). The hips follow
 *  the feet: centred between them, a little ahead while moving, and as high as the legs allow (so they bob). */
export type Step = {foot: 'n' | 'f'; t0: number; t1: number; x0: number; x1: number};
export const footAt = (steps: Step[], foot: 'n' | 'f', t: number, x0: number) => {
  let x = x0;
  let lift = 0;
  let pitch = 0;
  for (const st of steps) {
    if (st.foot !== foot) continue;
    if (t >= st.t1) x = st.x1;
    else if (t > st.t0) {
      const u = (t - st.t0) / (st.t1 - st.t0);
      const e = u * u * (3 - 2 * u);
      x = lerp(st.x0, st.x1, e);
      lift = Math.sin(Math.PI * u) * 46 * Math.min(1, Math.abs(st.x1 - st.x0) / 200);
      pitch = u < 0.3 ? -26 * (u / 0.3) : u < 0.85 ? lerp(-26, 14, (u - 0.3) / 0.55) : 14 * (1 - (u - 0.85) / 0.15);
      break;
    } else break;
  }
  return {x, lift, pitch};
};

// V4 receiver: the Weird Crew "fact-checker" (grey bob, round glasses, cream shirt, coral cardigan) built on the same
// full-body skeleton, proportions and drawing finish as the Death Clock man (rig/Man.tsx), mirrored to face
// screen-right: a rounded torso with a finite cardigan hem, a pelvis, two legs with boots, two-bone arms whose
// elbow side is fixed (solved per frame from the animated hand target), long cardigan sleeves with cuffs, and the
// crew's five-finger hand. Pose fields are the same as the man's (ManPose); +torso leans toward her front.
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {Deco, INK, Inked, InkLine, InkPath} from '../../lib/ink';
import {Limb} from '../../lib/limb';
import {add, clamp, dot, fmt, len, lerpV, mul, norm, P, perp, sub, V} from '../../lib/math';
import {Blob, Capsule, Lin} from '../../lib/shade';
import {Expr} from '../../art/Head';
import {Hand, HandPose} from '../../art/Hand';
import {Head4} from './Head4';
import {DIM, ManPose} from './Man';

const FX = 1; // faces screen-right
const up = (a: number): V => ({x: FX * Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: -FX * Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});
const dirDownF = (a: number): V => ({x: FX * Math.sin((a * Math.PI) / 180), y: Math.cos((a * Math.PI) / 180)});
const ang = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;

const SOFT_IK = 0.96;
const MAX_STRETCH = 1.045;
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerpAng = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;
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
  return {E: add(add(S, mul(dir, a)), mul(perp(dir), h * side)), W: add(S, mul(dir, reach)), sc};
};

export const WOMAN = {
  skin: '#F7D9C4',
  hair: '#8A8A93',
  cardigan: '#EF6B55',
  shirt: '#F4EFE3',
  pants: '#474C6B',
  shoe: '#6B4E3D',
  sole: '#E9DFD0',
};

export type WJoints = ReturnType<typeof womanJoints>;

export const womanJoints = (p: ManPose) => {
  const s = p.s;
  const H: V = {x: p.x, y: p.y};
  const tc = p.torso + p.chest;
  const C = add(H, mul(up(p.torso), DIM.waist * s));
  const Sh = add(C, mul(up(tc), DIM.chestH * s));
  const N = add(Sh, mul(up(tc), DIM.neck * s));
  const head = add(N, mul(up(tc + p.neck), DIM.headUp * s));
  const lS = add(add(Sh, mul(px(tc), (p.lSv ?? 44) * s)), mul(up(tc), -18 * s));
  const rS = add(add(Sh, mul(px(tc), (p.rSv ?? -50) * s)), mul(up(tc), -14 * s));
  const toWorld = (u: number, vv: number) => add(Sh, add(mul(up(tc), u * s), mul(px(tc), vv * s)));
  const arm = (S: V, tu: number, tv: number, wx: number, wy: number, w: number, elb: number, wr: number, ha?: number, hw?: number) => {
    const wc = clamp(w);
    const wt = wc + (1 - wc) * sstep(0.95, 0.99, wc);
    const T = lerpV(toWorld(tu, tv), {x: wx, y: wy}, wt);
    const {E, W} = ik(S, T, DIM.upperArm * s, DIM.foreArm * s, (elb >= 0 ? 1 : -1) * -FX, sstep(0.8, 0.9, wc));
    const fd = norm(sub(W, E));
    return {S, E, W, foreDir: fd, handAng: lerpAng(ang(fd) + wr, ha ?? 0, clamp(hw ?? 0))};
  };
  const L = arm(lS, p.lTu, p.lTv, p.lWx, p.lWy, p.lW, p.lElb, p.lWr, p.lHa, p.lHw);
  const R = arm(rS, p.rTu, p.rTv, p.rWx, p.rWy, p.rW, p.rElb, p.rWr, p.rHa, p.rHw);
  const hipL = add(add(H, mul(px(p.pelvis), 34 * s)), mul(up(p.pelvis), -44 * s));
  const hipR = add(add(H, mul(px(p.pelvis), -40 * s)), mul(up(p.pelvis), -42 * s));
  const leg = (hp: V, hip: number, knee: number, ank: number, fs: number, fsh: number, tx?: number, ty?: number, tw?: number) => {
    const a1 = hip - p.pelvis;
    let K = add(hp, mul(dirDownF(a1), DIM.thigh * s * (fs ?? 1)));
    let a2 = a1 - knee;
    let A = add(K, mul(dirDownF(a2), DIM.shin * s * (fsh ?? 1)));
    let footDir = dirDownF(a2 + 90 + ank);
    const w = clamp(tw ?? 0);
    if (w > 0 && tx !== undefined && ty !== undefined) {
      const T = {x: tx, y: ty};
      const r = ik(hp, T, DIM.thigh * s * (fs ?? 1), DIM.shin * s * (fsh ?? 1), -FX, sstep(0.8, 0.9, w));
      K = lerpV(K, r.E, w);
      A = lerpV(A, r.W, w);
      const sd = norm(sub(A, K));
      a2 = (Math.atan2(FX * sd.x, sd.y) * 180) / Math.PI;
      footDir = norm(lerpV(footDir, dirDownF(90 + ank * 0.3), w));
    }
    const fl = clamp(0.5 + 0.5 * (fsh ?? 1), 0.5, 1);
    const toe = add(A, mul(footDir, 84 * s * fl));
    return {hp, K, A, toe, footDir, shinAng: a2, fl};
  };
  const lLeg = leg(hipL, p.lHip, p.lKnee, p.lAnk, p.lFs, p.lFsh, p.lAx, p.lAy, p.lA);
  const rLeg = leg(hipR, p.rHip, p.rKnee, p.rAnk, p.rFs, p.rFsh, p.rAx, p.rAy, p.rA);
  return {H, C, Sh, N, head, tc, L, R, lLeg, rLeg, s, toWorld};
};

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

const loc = (O: V, a: number, u: number, vv: number, s: number) => add(O, add(mul(up(a), u * s), mul(px(a), vv * s)));

/** cardigan outline (hem at the hip) */
export const cardiganPath = (p: ManPose, j: WJoints) => {
  const s = p.s;
  const tc = j.tc;
  const br = 1 + 0.03 * p.breath;
  return smoothClosed([
    loc(j.H, p.torso, -34, -80, s),
    loc(j.H, p.torso, 64, -82, s),
    loc(j.H, p.torso, 140, -78, s),
    loc(j.C, tc, 52, -94 * br, s),
    loc(j.C, tc, 118, -84, s),
    loc(j.C, tc, 146, -40, s),
    loc(j.C, tc, 154, 0, s),
    loc(j.C, tc, 150, 36, s),
    loc(j.C, tc, 128, 88, s),
    loc(j.C, tc, 48, 92 * br, s),
    loc(j.H, p.torso, 104, 82, s),
    loc(j.H, p.torso, -30, 90, s),
  ]);
};

type Props = {
  id: string;
  pose: ManPose;
  expr: Expr;
  blink?: number;
  lHand: HandPose;
  rHand: HandPose;
  nearLegFront?: boolean;
  /** draw the far (right) forearm and hand in front of the torso (resting on the table, holding a cup) */
  farArmFront?: boolean;
  hairSway?: number;
  inkK?: number;
  children?: React.ReactNode;
  /** drawn between the far arm and the torso (e.g. nothing) / over the torso */
  overTorso?: React.ReactNode;
  headOverlay?: React.ReactNode;
  held?: React.ReactNode;
};

export const Woman: React.FC<Props> = ({id, pose: p, expr, blink = 0, lHand, rHand, nearLegFront, farArmFront, hairSway = 0, inkK = 1, children, overTorso, headOverlay, held}) => {
  const j = womanJoints(p);
  const s = p.s;
  const OUT = 7 * s * inkK;
  const IN = OUT * 0.72;
  const tc = j.tc;
  const skin = WOMAN.skin;
  const far = (c: string) => shade(c, 0.14);
  const cardD = cardiganPath(p, j);
  const shirtD = smoothClosed([
    loc(j.H, p.torso, -10, -74, s),
    loc(j.H, p.torso, 64, -76, s),
    loc(j.C, tc, 52, -88, s),
    loc(j.C, tc, 118, -78, s),
    loc(j.C, tc, 148, -36, s),
    loc(j.C, tc, 150, 34, s),
    loc(j.C, tc, 128, 84, s),
    loc(j.C, tc, 48, 88, s),
    loc(j.H, p.torso, 104, 78, s),
    loc(j.H, p.torso, -6, 84, s),
  ]);
  const torsoC = loc(j.C, tc, 60, -30, s);
  // trousers
  const pelPts: V[] = [loc(j.H, p.pelvis, 10, -82, s), loc(j.H, p.pelvis, 10, 86, s), loc(j.H, p.pelvis, -52, 90, s), loc(j.H, p.pelvis, -82, 30, s), loc(j.H, p.pelvis, -78, -58, s)];

  const Leg = (k: string, L: WJoints['lLeg'], isFar: boolean) => {
    const pc = isFar ? far(WOMAN.pants) : WOMAN.pants;
    const shoe = isFar ? far(WOMAN.shoe) : WOMAN.shoe;
    const sd = dirDownF(L.shinAng);
    const F = (x: number, y: number) => add(add(L.A, mul(L.footDir, x * s * (x > 0 ? L.fl : 1))), mul(sd, y * s));
    const upper = smoothClosed([F(-32, -8), F(-28, 14), F(28, 18), F(84, 16), F(96, 4), F(84, -10), F(46, -22), F(10, -36), F(-14, -36), F(-30, -26)]);
    const sole = smoothClosed([F(-33, 8), F(94, 10), F(98, 22), F(40, 26), F(-31, 24)]);
    const ankle = add(L.A, mul(sd, -8 * s));
    const cuff0 = add(L.A, mul(sd, -38 * s));
    const nb = perp(sd);
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}i`} fade={[{c: L.hp, r: 58 * s}]}>
          <Limb id={`${id}-${k}lb`} A={L.hp} B={L.K} C={ankle} rA={40 * s} rB={31 * s} rC={26 * s} color={pc} spec={0.12} crease={IN * 0.8} />
        </Inked>
        <Deco>
          <InkLine d={`M${P(add(cuff0, mul(nb, 26 * s)))} Q${P(add(cuff0, mul(sd, 5 * s)))} ${P(add(cuff0, mul(nb, -26 * s)))}`} w={IN * 0.6} opacity={0.6} />
        </Deco>
        {/* ankle boot: rounded dark-brown upper, cream sole, glossy toe */}
        <Inked w={IN * 0.9}>
          <Blob id={`${id}-${k}so`} d={sole} c={F(30, 18)} r={80 * s} color={WOMAN.sole} k={0.5} />
          <Blob id={`${id}-${k}sp`} d={upper} c={F(20, -8)} r={90 * s} color={shoe} k={0.9} />
        </Inked>
        <Deco>
          <ellipse cx={fmt(F(64, -8).x)} cy={fmt(F(64, -8).y)} rx={fmt(15 * s)} ry={fmt(5 * s)} transform={`rotate(${fmt(ang(L.footDir) - 12)} ${fmt(F(64, -8).x)} ${fmt(F(64, -8).y)})`} fill="#FFFFFF" opacity={0.45} />
        </Deco>
      </g>
    );
  };

  // the arm: a long coral cardigan sleeve (one continuous limb) with a cream cuff and the crew hand
  const Arm = (k: string, A: WJoints['L'], isFar: boolean, hp: HandPose, thumbSide: 1 | -1) => {
    const sl = isFar ? far(WOMAN.cardigan) : WOMAN.cardigan;
    const sk = isFar ? far(skin) : skin;
    const wristIn = add(A.W, mul(A.foreDir, -4 * s));
    const cuffA = add(A.W, mul(A.foreDir, -34 * s));
    const nb = perp(A.foreDir);
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}ai`} fade={[{c: A.S, r: 50 * s}]}>
          <Limb id={`${id}-${k}lb`} A={A.S} B={A.E} C={A.W} rA={31 * s} rB={25 * s} rC={19.5 * s} color={sl} spec={0.18} crease={isFar ? 0 : IN * 0.8} />
          <Hand id={`${id}-${k}h`} wrist={wristIn} ang={A.handAng} L={DIM.hand * s} thumbSide={thumbSide} view="back" pose={hp} color={sk} ink={IN * 0.9} bare />
        </Inked>
        <Deco>
          {/* cream shirt cuff under the cardigan sleeve end */}
          <path d={`M${P(add(cuffA, mul(nb, 20 * s)))} L${P(add(A.W, mul(nb, 19.5 * s)))} L${P(add(A.W, mul(nb, -19.5 * s)))} L${P(add(cuffA, mul(nb, -20 * s)))} Z`} fill="none" />
          <InkLine d={`M${P(add(add(A.W, mul(A.foreDir, -6 * s)), mul(nb, 19 * s)))} Q${P(add(A.W, mul(A.foreDir, -1 * s)))} ${P(add(add(A.W, mul(A.foreDir, -6 * s)), mul(nb, -19 * s)))}`} w={IN * 0.8} opacity={0.8} />
        </Deco>
      </g>
    );
  };

  const nearLeg = Leg('ll', j.lLeg, false);
  const farLeg = Leg('rl', j.rLeg, true);
  const buttons = [30, 66, 102].map((u) => loc(j.C, tc, u - 20, -52 + u * 0.12, s));

  return (
    <Inked w={OUT}>
      {farLeg}
      {Arm('ra', j.R, true, rHand, 1)}
      <Inked w={IN}>
        <Blob id={`${id}-pel`} d={smoothClosed(pelPts)} c={loc(j.H, p.pelvis, -10, -30, s)} r={118 * s} color={WOMAN.pants} />
      </Inked>
      {nearLeg}
      <Inked w={IN}>
        <Capsule id={`${id}-nk`} a={add(j.N, mul(up(tc), -24 * s))} b={add(j.N, mul(up(tc + p.neck), 46 * s))} ra={28 * s} rb={26 * s} color={shade(skin, 0.08)} />
      </Inked>
      {/* cream shirt */}
      <Inked w={IN}>
        <Blob id={`${id}-sh`} d={shirtD} c={torsoC} r={210 * s} color={WOMAN.shirt} k={0.8} stops={[[0, '#FFFDF8'], [0.5, WOMAN.shirt], [0.82, '#D9D2C0'], [1, '#B5AE9C']]} />
      </Inked>
      {/* coral cardigan over it: finite hem at the hip, an open front that leaves a cream V and a button placket */}
      <Inked w={IN}>
        <Blob id={`${id}-cd`} d={cardD} c={torsoC} r={215 * s} color={WOMAN.cardigan} k={1} stops={[[0, lit(WOMAN.cardigan, 0.35)], [0.45, lit(WOMAN.cardigan, 0.06)], [0.8, WOMAN.cardigan], [1, shade(WOMAN.cardigan, 0.32)]]} />
      </Inked>
      <Deco>
        <defs>
          <clipPath id={`${id}-cc`}>
            <path d={cardD} />
          </clipPath>
        </defs>
        <mask id={`${id}-rfx`}>
          <rect x="-20000" y="-20000" width="40000" height="40000" fill="#FFF" />
          <path d={cardD} fill="#000" stroke="#000" strokeWidth={fmt(OUT * 0.8 + 2)} strokeLinejoin="round" />
        </mask>
        <g clipPath={`url(#${id}-cc)`}>
          {/* the open front: the cream shirt shows between the cardigan's two edges at the neck, narrowing to the placket */}
          <path d={smoothClosed([loc(j.C, tc, 156, -22, s), loc(j.C, tc, 156, 30, s), loc(j.C, tc, 110, 8, s), loc(j.C, tc, 70, -30, s), loc(j.C, tc, 100, -48, s)])} fill={`url(#${id}-sh)`} />
          <Lin id={`${id}-cf`} d={cardD} from={loc(j.C, tc, 40, -100, s)} to={loc(j.C, tc, 40, 96, s)} stops={[[0, '#FFFFFF', 0.34], [0.3, '#FFFFFF', 0], [0.6, '#5A1E2A', 0], [1, '#5A1E2A', 0.3]]} />
          {/* knit rib at the hem */}
          <path d={`M${P(loc(j.H, p.torso, -26, -78, s))} Q${P(loc(j.H, p.torso, -34, 0, s))} ${P(loc(j.H, p.torso, -24, 86, s))}`} fill="none" stroke={shade(WOMAN.cardigan, 0.32)} strokeWidth={fmt(5 * s)} opacity={0.4} strokeLinecap="round" />
          <ellipse cx={fmt(loc(j.C, tc, 96, -44, s).x)} cy={fmt(loc(j.C, tc, 96, -44, s).y)} rx={fmt(42 * s)} ry={fmt(15 * s)} transform={`rotate(${fmt(-tc + 30)} ${fmt(loc(j.C, tc, 96, -44, s).x)} ${fmt(loc(j.C, tc, 96, -44, s).y)})`} fill="#FFFFFF" opacity={0.3} />
        </g>
        {/* placket edge and buttons */}
        <InkLine d={`M${P(loc(j.C, tc, 126, -16, s))} Q${P(loc(j.C, tc, 40, -40, s))} ${P(loc(j.H, p.torso, -26, -42, s))}`} w={OUT * 0.7} opacity={0.75} />
        {buttons.map((b, i) => (
          <g key={i}>
            <circle cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(7.5 * s)} fill={lit(WOMAN.cardigan, 0.45)} stroke={INK} strokeWidth={fmt(2.2 * s)} />
          </g>
        ))}
        <InkLine d={`M${P(loc(j.C, tc, 146, -36, s))} Q${P(loc(j.C, tc, 124, 0, s))} ${P(loc(j.C, tc, 148, 32, s))}`} w={OUT * 0.7} />
        {children}
        {overTorso}
      </Deco>
      <Head4 id={`${id}-hd`} c={j.head} R={DIM.headR * s} roll={(tc + p.neck)} yaw={p.yaw ?? p.turn * 20} flip expr={expr} blink={blink} skin={skin} hair={WOMAN.hair} style="bob" glasses hairSway={hairSway} inkW={7 * inkK} overlay={headOverlay} />
      {farArmFront && Arm('raf', j.R, true, rHand, 1)}
      {p.rFront === 0 && (
        // V5: the far forearm and hand again, in front of the near thigh but behind the cardigan's front contour: the arm
        // comes out from behind the body instead of ending in a hidden elbow
        <g mask={`url(#${id}-rfx)`}>
          <Inked w={IN}>
            <Limb id={`${id}-rfl`} A={j.R.E} B={add(j.R.E, mul(sub(j.R.W, j.R.E), 0.5))} C={add(j.R.W, mul(j.R.foreDir, -4 * s))} rA={25 * s} rB={22 * s} rC={19.5 * s} color={far(WOMAN.cardigan)} spec={0.18} crease={0} />
            <Hand id={`${id}-rfh`} wrist={add(j.R.W, mul(j.R.foreDir, -4 * s))} ang={j.R.handAng} L={DIM.hand * s} thumbSide={1} view="back" pose={rHand} color={far(skin)} ink={IN * 0.9} bare />
          </Inked>
        </g>
      )}
      {nearLegFront && (
        <Inked w={IN}>
          <Limb id={`${id}-llf`} A={j.lLeg.hp} B={j.lLeg.K} C={add(j.lLeg.A, mul(dirDownF(j.lLeg.shinAng), -8 * s))} rA={40 * s} rB={31 * s} rC={26 * s} color={WOMAN.pants} spec={0.12} crease={IN * 0.8} />
        </Inked>
      )}
      {held}
      {Arm('la', j.L, false, lHand, -1)}
    </Inked>
  );
};

export const _unused = {mix, dot, Lin};

// The man: one outfit (muted terracotta tee, blue-grey jeans, white trainers), one face, the band on his
// LEFT wrist. A 2.5D clay mannequin built from tapered capsules and shaded blobs, seen in 3/4 view
// facing screen-left, so his LEFT side (and left arm) is nearest the camera and his RIGHT hand can
// clutch his chest. Arms are two-bone IK chains whose hand targets are given either in upper-torso
// space (hand stays on the chest while the body moves) or in world space (hand planted on the ground).
// Joint positions come from one pure function shared by the drawing, the contact shadows, the leash
// and the camera targets.
import React from 'react';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, dirDown, fmt, len, lerpV, mul, norm, P, perp, sub, V} from '../lib/math';
import {Blob, Capsule, Glow, Lin, Sphere} from '../lib/shade';
import {Expr, Head} from './Head';
import {Hand, HandPose} from './Hand';

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
};

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});
const ang = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;

export const DIM = {
  waist: 200,
  chestH: 138,
  neck: 18,
  headR: 72,
  headUp: 86,
  upperArm: 176,
  foreArm: 158,
  hand: 96,
  thigh: 226,
  shin: 216,
};

/** Two-bone IK: elbow on side `side` (+1 = clockwise of the shoulder->target line). */
const ik = (S: V, T: V, l1: number, l2: number, side: number) => {
  const d0 = sub(T, S);
  const dist = clamp(len(d0), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
  const dir = norm(d0);
  const a = (l1 * l1 + dist * dist - l2 * l2) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const E = add(add(S, mul(dir, a)), mul(perp(dir), h * side));
  const W = add(S, mul(dir, dist));
  return {E, W};
};

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
  const arm = (S: V, tu: number, tv: number, wx: number, wy: number, w: number, elb: number, wr: number) => {
    const T = lerpV(toWorld(tu, tv), {x: wx, y: wy}, clamp(w));
    // elbow side in screen terms: the torso's +v axis rotated into the shoulder->target frame
    const {E, W} = ik(S, T, DIM.upperArm * s, DIM.foreArm * s, elb >= 0 ? 1 : -1);
    const fd = norm(sub(W, E));
    return {S, E, W, foreDir: fd, handAng: ang(fd) + wr};
  };
  const L = arm(lS, p.lTu, p.lTv, p.lWx, p.lWy, p.lW, p.lElb, p.lWr);
  const R = arm(rS, p.rTu, p.rTv, p.rWx, p.rWy, p.rW, p.rElb, p.rWr);
  const hipL = add(add(H, mul(px(p.pelvis), 34 * s)), mul(up(p.pelvis), -44 * s));
  const hipR = add(add(H, mul(px(p.pelvis), -40 * s)), mul(up(p.pelvis), -42 * s));
  const leg = (hp: V, hip: number, knee: number, ank: number, fs: number, fsh: number) => {
    // legs rotate with the pelvis in the same sense as the torso lean (a lean of +a is a CCW turn of the body)
    const a1 = hip - p.pelvis;
    const K = add(hp, mul(dirDown(a1), DIM.thigh * s * (fs ?? 1)));
    const a2 = a1 - knee;
    const A = add(K, mul(dirDown(a2), DIM.shin * s * (fsh ?? 1)));
    const footDir = dirDown(a2 + 90 + ank);
    // a foot pointing toward the camera foreshortens with the shin
    const fl = clamp(0.5 + 0.5 * (fsh ?? 1), 0.5, 1);
    const toe = add(A, mul(footDir, 84 * s * fl));
    return {hp, K, A, toe, footDir, shinAng: a2, fl};
  };
  const lLeg = leg(hipL, p.lHip, p.lKnee, p.lAnk, p.lFs, p.lFsh);
  const rLeg = leg(hipR, p.rHip, p.rKnee, p.rAnk, p.rFs, p.rFsh);
  return {H, C, Sh, N, head, tc, L, R, lLeg, rLeg, s, toWorld};
};

/** World position of the band face on the left wrist (for glows, camera targets and UI anchoring). */
export const bandCenter = (j: Joints) => add(j.L.W, mul(j.L.foreDir, -20 * j.s));

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
};

export const Man: React.FC<Props> = ({id, pose: p, expr, blink = 0, lHand, rHand, bandColor = PAL.normal, bandGlow = 0.6, hideLeftForearm, children, nearLegFront}) => {
  const j = manJoints(p);
  const s = p.s;
  const skin = PAL.skin;
  const far = (c: string) => shade(c, 0.16);
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, vv: number) => add(O, add(mul(up(a), u * s), mul(px(a), vv * s)));
  const br = 1 + 0.03 * p.breath;

  // --- torso / tee (front contour on the screen-left side, back on the right)
  const torsoPts: V[] = [
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
  ];
  const torsoD = smoothClosed(torsoPts);
  const torsoC = loc(j.C, tc, 60, -30);

  // --- pelvis (jeans)
  const pelPts: V[] = [loc(j.H, p.pelvis, 10, -86), loc(j.H, p.pelvis, 10, 90), loc(j.H, p.pelvis, -52, 94), loc(j.H, p.pelvis, -84, 30), loc(j.H, p.pelvis, -80, -60)];
  const pelD = smoothClosed(pelPts);

  const Leg = (k: string, L: Joints['lLeg'], isFar: boolean) => {
    const pc = isFar ? far(PAL.pants) : PAL.pants;
    const shoe = isFar ? far(PAL.shoe) : PAL.shoe;
    const sd = dirDown(L.shinAng);
    return (
      <g key={k}>
        <Capsule id={`${id}-${k}th`} a={L.hp} b={L.K} ra={44 * s} rb={33 * s} color={pc} spec={0.1} />
        <Sphere id={`${id}-${k}kn`} c={L.K} r={33 * s} color={pc} k={0.5} />
        <Capsule id={`${id}-${k}sh`} a={L.K} b={add(L.A, mul(sd, -6 * s))} ra={32 * s} rb={25 * s} color={pc} spec={0.08} />
        <Capsule id={`${id}-${k}hm`} a={add(L.A, mul(sd, -36 * s))} b={add(L.A, mul(sd, -12 * s))} ra={27 * s} rb={27 * s} color={shade(pc, 0.12)} />
        {/* trainer: outline in the foot's own frame (x forward along the foot, y toward the ground) */}
        {(() => {
          const F = (x: number, y: number) => add(add(L.A, mul(L.footDir, x * s * (x > 0 ? L.fl : 1))), mul(sd, y * s));
          const upper = smoothClosed([F(-34, -8), F(-30, 16), F(30, 20), F(90, 18), F(100, 6), F(86, -10), F(46, -20), F(10, -34), F(-14, -34), F(-32, -26)]);
          const sole = smoothClosed([F(-35, 10), F(98, 12), F(100, 24), F(40, 28), F(-33, 26)]);
          const c0 = F(20, -8);
          return (
            <g>
              <Blob id={`${id}-${k}sp`} d={upper} c={c0} r={90 * s} color={shoe} k={0.9} />
              <Blob id={`${id}-${k}so`} d={sole} c={F(30, 18)} r={80 * s} color={mix(shoe, '#8E99A6', 0.55)} k={0.5} />
              <Capsule id={`${id}-${k}lc`} a={F(4, -26)} b={F(48, -14)} ra={7 * s} rb={6 * s} color={mix(shoe, PAL.band, 0.22)} k={0.4} />
              <ellipse cx={fmt(F(70, -6).x)} cy={fmt(F(70, -6).y)} rx={fmt(14 * s)} ry={fmt(5 * s)} transform={`rotate(${fmt(ang(L.footDir) - 12)} ${fmt(F(70, -6).x)} ${fmt(F(70, -6).y)})`} fill="#FFFFFF" opacity={0.8} />
            </g>
          );
        })()}
      </g>
    );
  };

  const UpperArm = (k: string, A: Joints['L'], isFar: boolean) => {
    const sl = add(A.S, mul(sub(A.E, A.S), 0.44));
    return (
      <g key={k}>
        <Capsule id={`${id}-${k}ua`} a={A.S} b={A.E} ra={30 * s} rb={23 * s} color={isFar ? far(skin) : skin} spec={0.2} />
        {/* short sleeve */}
        <Capsule id={`${id}-${k}sl`} a={add(A.S, mul(sub(A.E, A.S), -0.05))} b={sl} ra={34 * s} rb={30 * s} color={isFar ? far(PAL.shirt) : PAL.shirt} spec={0.1} />
        <Capsule id={`${id}-${k}so`} a={add(sl, mul(sub(A.E, A.S), -0.05))} b={sl} ra={30 * s} rb={29 * s} color={shade(isFar ? far(PAL.shirt) : PAL.shirt, 0.2)} k={0.4} />
      </g>
    );
  };

  const ForeArm = (k: string, A: Joints['L'], isFar: boolean, hp: HandPose, thumbSide: 1 | -1, withBand: boolean) => {
    const sk = isFar ? far(skin) : skin;
    const nb = perp(A.foreDir);
    const bc = add(A.W, mul(A.foreDir, -20 * s));
    return (
      <g key={k}>
        <Sphere id={`${id}-${k}el`} c={A.E} r={23 * s} color={sk} k={0.6} />
        <Capsule id={`${id}-${k}fa`} a={A.E} b={A.W} ra={23 * s} rb={16 * s} color={sk} spec={0.22} />
        <Hand id={`${id}-${k}h`} wrist={add(A.W, mul(A.foreDir, -6 * s))} ang={A.handAng} L={DIM.hand * s} thumbSide={thumbSide} view="back" pose={hp} color={sk} />
        {withBand && (
          <g>
            <Glow id={`${id}-bg`} c={bc} r={70 * s} color={bandColor} alpha={0.5 * bandGlow} />
            {/* cobalt band wrapping the wrist */}
            <Capsule id={`${id}-bd`} a={add(bc, mul(nb, -20 * s))} b={add(bc, mul(nb, 20 * s))} ra={13 * s} rb={13 * s} color={PAL.band} spec={0.7} k={1.2} />
            {/* glass face */}
            <g transform={`translate(${fmt(bc.x)} ${fmt(bc.y)}) rotate(${fmt(ang(A.foreDir) - 90)})`}>
              <rect x={fmt(-15 * s)} y={fmt(-12 * s)} width={fmt(30 * s)} height={fmt(24 * s)} rx={fmt(8 * s)} fill={PAL.bandDeep} />
              <rect x={fmt(-12.5 * s)} y={fmt(-9.5 * s)} width={fmt(25 * s)} height={fmt(19 * s)} rx={fmt(6 * s)} fill={mix(bandColor, '#0B1622', 0.4)} />
              <rect x={fmt(-9.5 * s)} y={fmt(-6.5 * s)} width={fmt(19 * s)} height={fmt(13 * s)} rx={fmt(4 * s)} fill={lit(bandColor, 0.2)} opacity={0.9} />
              <rect x={fmt(-11 * s)} y={fmt(-8.5 * s)} width={fmt(8 * s)} height={fmt(3 * s)} rx={fmt(1.5 * s)} fill="#FFFFFF" opacity={0.75} />
            </g>
          </g>
        )}
      </g>
    );
  };

  return (
    <g>
      {Leg('rl', j.rLeg, true)}
      {UpperArm('ra', j.R, true)}
      <Blob id={`${id}-pel`} d={pelD} c={loc(j.H, p.pelvis, -10, -30)} r={120 * s} color={PAL.pants} />
      {!nearLegFront && Leg('ll', j.lLeg, false)}
      <Blob id={`${id}-tor`} d={torsoD} c={torsoC} r={210 * s} color={PAL.shirt} k={1.1} />
      {/* cylindrical form shading across the torso: lit front edge -> shadowed back edge (light is upper-left) */}
      <Lin id={`${id}-tf`} d={torsoD} from={loc(j.C, tc, 40, -100)} to={loc(j.C, tc, 40, 96)} stops={[[0, '#FFF3E6', 0.22], [0.3, '#FFF3E6', 0], [0.62, '#5A2A1A', 0], [1, '#5A2A1A', 0.34]]} />
      {/* chest plane and the shadow under the pecs */}
      <ellipse cx={fmt(loc(j.C, tc, 64, -40).x)} cy={fmt(loc(j.C, tc, 64, -40).y)} rx={fmt(58 * s)} ry={fmt(40 * s)} transform={`rotate(${fmt(-tc)} ${fmt(loc(j.C, tc, 64, -40).x)} ${fmt(loc(j.C, tc, 64, -40).y)})`} fill="#FFF3E6" opacity={0.12} />
      <ellipse cx={fmt(loc(j.C, tc, 14, -26).x)} cy={fmt(loc(j.C, tc, 14, -26).y)} rx={fmt(70 * s)} ry={fmt(12 * s)} transform={`rotate(${fmt(-tc)} ${fmt(loc(j.C, tc, 14, -26).x)} ${fmt(loc(j.C, tc, 14, -26).y)})`} fill={shade(PAL.shirt, 0.5)} opacity={0.22} />
      {/* soft folds where the tee gathers at the waist */}
      {[
        [70, 0, 46, 9, 8],
        [36, -30, 34, 7, -6],
        [100, 40, 30, 6, 4],
      ].map(([u, vv, rx, ry, a], i) => {
        const q = loc(j.H, p.torso, u, vv);
        return <ellipse key={i} cx={fmt(q.x)} cy={fmt(q.y)} rx={fmt(rx * s)} ry={fmt(ry * s)} transform={`rotate(${fmt(-p.torso + a)} ${fmt(q.x)} ${fmt(q.y)})`} fill={shade(PAL.shirt, 0.45)} opacity={0.22} />;
      })}
      {/* collar band and neck */}
      <Capsule id={`${id}-nk`} a={add(j.N, mul(up(tc), -14 * s))} b={add(j.N, mul(up(tc + p.neck), 44 * s))} ra={31 * s} rb={29 * s} color={skin} />
      <Capsule id={`${id}-col`} a={loc(j.C, tc, 140, -36)} b={loc(j.C, tc, 146, 30)} ra={11 * s} rb={11 * s} color={shade(PAL.shirt, 0.22)} k={0.6} />
      <Head id={`${id}-hd`} c={j.head} R={DIM.headR * s} roll={-(tc + p.neck)} turn={p.turn} expr={expr} blink={blink} />
      {children}
      {nearLegFront && Leg('ll', j.lLeg, false)}
      {ForeArm('rf', j.R, true, rHand, -1, false)}
      {UpperArm('la', j.L, false)}
      {!hideLeftForearm && ForeArm('lf', j.L, false, lHand, 1, true)}
    </g>
  );
};

export const lerpPose = (a: ManPose, b: ManPose, t: number): ManPose => {
  const o = {} as ManPose;
  (Object.keys(a) as (keyof ManPose)[]).forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
  return o;
};

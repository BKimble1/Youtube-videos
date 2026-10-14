// The man: the Weird Crew's "guesser" (Future Got Weird cast, Video 01 rig colours and face), one outfit
// (white tee with saffron stripes, navy trousers, white shoes), the band on his LEFT wrist. Drawn in the crew's
// cutout style: every part has an ink contour (lib/ink.tsx), with dimensional gradient shading from one key light
// and glossy highlights. Seen in 3/4 view facing screen-left, so his LEFT side (and left arm) is nearest the camera
// and his RIGHT hand can clutch his chest. Arms are two-bone IK chains whose hand targets are given either in
// upper-torso space (hand stays on the chest while the body moves) or in world space (hand planted on the ground).
// Joint positions come from one pure function shared by the drawing, the contact shadows, the leash and the
// camera targets.
import React from 'react';
import {lit, mix, PAL, shade} from '../lib/color';
import {Deco, Inked, InkLine} from '../lib/ink';
import {Limb} from '../lib/limb';
import {add, clamp, dirDown, dot, fmt, len, lerpV, mul, norm, P, perp, sub, V} from '../lib/math';
import {Blob, Capsule, Lin, LIGHT} from '../lib/shade';
import {Expr, Head} from './Head';
import {Hand, HandPose} from './Hand';
import {DeviceView, Wrist3D, DEV_GEO} from './Device';

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
  neck: 18,
  headR: 96,
  headUp: 100,
  upperArm: 199,
  foreArm: 178,
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
      const r = ik(hp, T, DIM.thigh * s * (fs ?? 1), DIM.shin * s * (fsh ?? 1), 1);
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

/** World position of the band on the left wrist's axis (for glows, camera targets and UI anchoring). */
export const bandCenter = (j: Joints) => add(j.L.W, mul(j.L.foreDir, -DEV_GEO.bandFromWrist * 17 * j.s));
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
  /** V2: the left forearm, band and hand drawn by the device model (one design at every scale) */
  device?: DeviceView;
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
};

export const Man: React.FC<Props> = ({id, pose: p, expr, blink = 0, lHand, rHand, hideLeftForearm, children, nearLegFront, hairSway = 0, device, inkK = 1, overTorso, beforeLeftForearm, afterRightArm, overAll}) => {
  const j = manJoints(p);
  const s = p.s;
  const OUT = 7 * s * inkK; // crew contour
  const skin = PAL.skin;
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
    const pc = isFar ? far(PAL.pants) : PAL.pants;
    const shoe = isFar ? far(PAL.shoe) : PAL.shoe;
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
          <Capsule id={`${id}-${k}lc`} a={F(4, -24)} b={F(48, -12)} ra={6 * s} rb={5 * s} color={PAL.stripe} k={0.4} />
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
    const top = add(A.S, mul(u, -10 * s));
    const hem = add(A.S, mul(u, DIM.upperArm * 0.56 * s));
    const p1 = add(top, mul(n, r0));
    const p2 = add(hem, mul(n, r1));
    const p3 = add(hem, mul(n, -r1));
    const p4 = add(top, mul(n, -r0));
    const d = `M${P(p1)} L${P(p2)} Q${P(add(hem, mul(u, r1 * 0.36)))} ${P(p3)} L${P(p4)} A${fmt(r0)} ${fmt(r0)} 0 0 ${cross2(sub(p4, top), mul(u, -1)) > 0 ? 1 : 0} ${P(p1)} Z`;
    let ln = n;
    if (dot(ln, LIGHT) < 0) ln = mul(ln, -1);
    const mid = mul(add(top, hem), 0.5);
    const c = isFar ? far(PAL.shirt) : PAL.shirt;
    const fadeR = r0 * 1.15;
    const inner = (
      <ellipse key="in" cx={fmt(hem.x)} cy={fmt(hem.y)} rx={fmt(r1 * 0.24)} ry={fmt(r1 * 0.93)} transform={`rotate(${fmt(ang(u))} ${fmt(hem.x)} ${fmt(hem.y)})`} fill={shade(c, 0.42)} />
    );
    const body = (
      <g key="sl">
        <defs>
          <radialGradient id={`${id}-${k}sf`} gradientUnits="userSpaceOnUse" cx={fmt(A.S.x)} cy={fmt(A.S.y)} r={fmt(fadeR)}>
            <stop offset="0" stopColor="#FFF" />
            <stop offset="0.45" stopColor="#FFF" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id={`${id}-${k}sm`}>
            <rect x="-20000" y="-20000" width="40000" height="40000" fill={`url(#${id}-${k}sf)`} />
          </mask>
        </defs>
        <Inked w={IN} id={`${id}-${k}si`} fade={[{c: A.S, r: fadeR * 1.1}]}>
          <Lin id={`${id}-${k}sg`} d={d} from={add(mid, mul(ln, r0))} to={add(mid, mul(ln, -r0))} stops={[[0, '#FFFFFF'], [0.45, mix(c, '#F2F5F8', 0.5)], [0.85, mix(c, '#C9D5E0', 0.8)], [1, mix(c, '#B4C3D1', 0.8)]]} />
        </Inked>
        {!isFar && (
          <Deco>
            <defs>
              <clipPath id={`${id}-${k}sc`}>
                <path d={d} />
              </clipPath>
            </defs>
            {/* the tee's stripes and shading run on into the top of the sleeve, so it grows out of the shoulder */}
            <g clipPath={`url(#${id}-${k}sc)`} mask={`url(#${id}-${k}sm)`}>
              {stripes.map((sd, i) => (
                <path key={i} d={sd} fill={PAL.stripe} />
              ))}
            </g>
          </Deco>
        )}
        <Deco>
          {/* soft fold where the sleeve gathers at the shoulder, and a sheen along the lit side */}
          <path d={`M${P(add(add(A.S, mul(u, 30 * s)), mul(n, -r0 * 0.55)))} Q${P(add(A.S, mul(u, 44 * s)))} ${P(add(add(A.S, mul(u, 34 * s)), mul(n, r0 * 0.5)))}`} fill="none" stroke="#2E4A66" strokeOpacity={0.06} strokeWidth={fmt(4 * s)} strokeLinecap="round" />
          <ellipse cx={fmt(add(mid, mul(ln, r0 * 0.55)).x)} cy={fmt(add(mid, mul(ln, r0 * 0.55)).y)} rx={fmt(26 * s)} ry={fmt(4 * s)} transform={`rotate(${fmt(ang(u))} ${fmt(add(mid, mul(ln, r0 * 0.55)).x)} ${fmt(add(mid, mul(ln, r0 * 0.55)).y)})`} fill="#FFFFFF" opacity={0.5} />
        </Deco>
      </g>
    );
    return {inner, body};
  };

  // an arm's skin + hand as one contour group (the hand's palm and fingers join the forearm's silhouette)
  const armGroup = (k: string, A: Joints['L'], isFar: boolean, hp: HandPose, thumbSide: 1 | -1) => {
    const sk = isFar ? far(skin) : skin;
    return (
      <Inked w={IN} key={k}>
        <Limb id={`${id}-${k}lb`} A={A.S} B={A.E} C={A.W} rA={29 * s} rB={23.5 * s} rC={17 * s} color={sk} spec={0.22} crease={IN * 0.8} />
        <Hand id={`${id}-${k}h`} wrist={add(A.W, mul(A.foreDir, -6 * s))} ang={A.handAng} L={DIM.hand * s} thumbSide={thumbSide} view="back" pose={hp} color={sk} ink={IN * 0.9} bare />
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
      {farSleeve.inner}
      {armGroup('ra', j.R, true, rHand, -1)}
      {farSleeve.body}
      <Inked w={IN}>
        <Blob id={`${id}-pel`} d={pelD} c={loc(j.H, p.pelvis, -10, -30)} r={120 * s} color={PAL.pants} />
      </Inked>
      {nearLeg}
      {/* neck behind the tee's neckline */}
      <Inked w={IN}>
        <Capsule id={`${id}-nk`} a={add(j.N, mul(up(tc), -24 * s))} b={add(j.N, mul(up(tc + p.neck), 46 * s))} ra={30 * s} rb={28 * s} color={shade(skin, 0.08)} />
      </Inked>
      {/* tee */}
      <Inked w={IN}>
        <Blob id={`${id}-tor`} d={torsoD} c={torsoC} r={210 * s} color={PAL.shirt} k={1.1} stops={[[0, '#FFFFFF'], [0.5, '#F8FAFC'], [0.82, '#DCE3EA'], [1, '#B9C6D3']]} />
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
          {stripes.map((d, i) => (
            <path key={i} d={d} fill={PAL.stripe} />
          ))}
          {/* cylindrical form shading across the tee and stripes: lit front edge -> cool shadowed back edge */}
          <Lin id={`${id}-tf`} d={torsoD} from={loc(j.C, tc, 40, -100)} to={loc(j.C, tc, 40, 96)} stops={[[0, '#FFFFFF', 0.4], [0.3, '#FFFFFF', 0], [0.6, '#2E4A66', 0], [1, '#2E4A66', 0.32]]} />
          <Lin id={`${id}-tb`} d={torsoD} from={loc(j.H, p.torso, 120, 0)} to={loc(j.H, p.torso, -20, 0)} stops={[[0, '#2E4A66', 0], [1, '#2E4A66', 0.16]]} />
          {/* soft folds where the tee gathers at the waist */}
          {[
            [70, 0, 46, 9, 8],
            [36, -30, 34, 7, -6],
          ].map(([u, vv, rx, ry, a], i) => {
            const q = loc(j.H, p.torso, u, vv);
            return <ellipse key={i} cx={fmt(q.x)} cy={fmt(q.y)} rx={fmt(rx * s)} ry={fmt(ry * s)} transform={`rotate(${fmt(-p.torso + a)} ${fmt(q.x)} ${fmt(q.y)})`} fill="#2E4A66" opacity={0.12} />;
          })}
          {/* glossy sheen across the chest */}
          <ellipse cx={fmt(loc(j.C, tc, 96, -40).x)} cy={fmt(loc(j.C, tc, 96, -40).y)} rx={fmt(44 * s)} ry={fmt(16 * s)} transform={`rotate(${fmt(-tc - 30)} ${fmt(loc(j.C, tc, 96, -40).x)} ${fmt(loc(j.C, tc, 96, -40).y)})`} fill="#FFFFFF" opacity={0.35} />
        </g>
        {/* neckline */}
        <InkLine d={`M${P(loc(j.C, tc, 146, -36))} Q${P(loc(j.C, tc, 128, 0))} ${P(loc(j.C, tc, 148, 32))}`} w={OUT * 0.7} />
      </Deco>
      <Head id={`${id}-hd`} c={j.head} R={DIM.headR * s} roll={-(tc + p.neck)} turn={p.turn} expr={expr} blink={blink} hairSway={hairSway} inkW={7 * inkK} />
      <Deco>
        {children}
        {overTorso}
      </Deco>
      {nearLegFront && (
        <g mask={`url(#${id}-llm)`}>
          <Inked w={IN}>
            <Limb id={`${id}-llf`} A={j.lLeg.hp} B={j.lLeg.K} C={add(j.lLeg.A, mul(dirDown(j.lLeg.shinAng), -8 * s))} rA={43 * s} rB={33 * s} rC={28 * s} color={PAL.pants} spec={0.12} crease={IN * 0.8} />
          </Inked>
        </g>
      )}
      {/* the far forearm and hand cross the chest in front of the tee */}
      <g mask={`url(#${id}-rfm)`}>
        <Inked w={IN}>
          <Capsule id={`${id}-rffa`} a={j.R.E} b={j.R.W} ra={23.5 * s} rb={17 * s} color={far(skin)} spec={0.2} />
          <Hand id={`${id}-rfh`} wrist={add(j.R.W, mul(j.R.foreDir, -6 * s))} ang={j.R.handAng} L={DIM.hand * s} thumbSide={-1} view="back" pose={rHand} color={far(skin)} ink={IN * 0.9} bare />
        </Inked>
      </g>
      <Deco>{afterRightArm}</Deco>
      {!hideLeftForearm && nearSleeve.inner}
      {!hideLeftForearm && !device && armGroup('la', j.L, false, lHand, 1)}
      {!hideLeftForearm && !device && nearSleeve.body}
      <Deco>{beforeLeftForearm}</Deco>
      {!hideLeftForearm && device && (
        <Wrist3D
          id={`${id}-dv`}
          E={j.L.E}
          W={j.L.W}
          rE={23.5 * s}
          rW={17 * s}
          S={j.L.S}
          rS={29 * s}
          afterArm={nearSleeve.body}
          dev={device}
          hand={{pose: lHand, L: DIM.hand * s, ang: j.L.handAng, thumbSide: 1, offset: 6 * s}}
          ink={IN}
        />
      )}
      <Deco>{overAll}</Deco>
    </Inked>
  );
};

export const lerpPose = (a: ManPose, b: ManPose, t: number): ManPose => {
  const o = {} as ManPose;
  (Object.keys(a) as (keyof ManPose)[]).forEach((k) => (o[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * t));
  return o;
};

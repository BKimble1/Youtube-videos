// V5 jump: weight shift → planted push-off → ballistic flight → outcome. Built for clean contact:
//   - the feet stay on IK targets from the ready stance through the whole push (no skating, no pop at mid-push);
//   - the push accelerates (pelvis speed at takeoff matches the flight's launch speed), so the body never hovers;
//   - at takeoff the planted pose is converted to joint angles (solveIK), so the airborne pose starts exactly where
//     the planted one ended;
//   - landings put the soles on the surface at the contact frame and hand over to IK-planted feet that absorb and
//     settle; a plunge keeps travelling down and is masked by the surface, never faded.
import {RPose, rig, solveIK, soleY} from '../../v4/rig/Robot2D';
import {AIR, blend, STAND_H, ANK, A, L} from '../../v4/rig/poses';

export type J5Outcome = 'plunge' | 'stick' | 'short' | 'faceplant';
export type J5 = {
  toeX: number; deckY: number;   // ledge edge and top
  endX: number; endY: number;    // where the soles arrive
  s: number; face?: 1 | -1;
  tReady: number;                // ready stance starts sinking into the crouch (weight shift)
  tPush: number;                 // push-off starts
  tTO: number;                   // takeoff
  apex: number;                  // apex above the takeoff pelvis (world units)
  outcome: J5Outcome;
  depth?: number;                // crouch depth (1 = standard; > 1 deeper)
  swing?: number;                // arm back-swing (1 = standard)
  rate?: number;                 // flight playback speed (1 = real time)
  settleArms?: [number, number]; // arm angles the landing settles into (stick)
  reachArms?: number;            // 0..1: after a stick landing the arms come forward, hands open (follow-through)
};

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const keys = (t: number, k: [number, number][]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], smooth((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
  return k[k.length - 1][1];
};
/** Ankle target for a flat foot whose sole rests on `ground`. */
export const flatFoot = (ax: number, ground: number, s: number) => ({x: ax, y: ground - ANK * s, pitch: 0});
/** Ankle target for a foot standing on its toes at (toeX, ground), sole pitched `pitch` deg (negative = heel up). */
export const toeFoot = (toeX: number, ground: number, pitch: number, s: number, face: 1 | -1 = 1, yaw = 0.5) => {
  const th = (-pitch * Math.PI) / 180; // clockwise screen rotation for a face-right foot
  const tx = lerp(20, 66, yaw), ty = 31;
  const rx = tx * Math.cos(th) - ty * Math.sin(th), ry = tx * Math.sin(th) + ty * Math.cos(th);
  return {x: toeX - rx * s * face, y: ground - ry * s, pitch};
};
/** Joint angles that keep a foot flat for a given body lean (FK legs). */
const flatAn = (rot: number, hip: number, kn: number, yaw = 0.5) => rot / yaw - (hip - kn);

export const LAND_AIR = (() => {
  const rot = 4;
  return {rot, waist: 4, neck: -2, head: 2, armN: A(62, 30, {grip: 0.3}), armF: A(50, 34, {grip: 0.3}),
    legN: L(26, 40, flatAn(rot, 26, 40)), legF: L(10, 30, flatAn(rot, 10, 30))};
})();

export const makeJump5 = (j: J5) => {
  const face = j.face ?? 1, s = j.s;
  const depth = j.depth ?? 1, swing = j.swing ?? 1;
  const fN = flatFoot(j.toeX - 40 * s * face, j.deckY, s);
  const fF = flatFoot(j.toeX - 60 * s * face, j.deckY, s);
  const READY: RPose = {x: j.toeX - 64 * s * face, y: j.deckY - 262 * s, rot: 14, waist: 6, neck: -6, head: -4,
    armN: A(-10, 24, {grip: 0.4}), armF: A(-16, 28, {grip: 0.4}), legN: L(0, 0), legF: L(0, 0), yaw: 0.5, footN: fN, footF: fF};
  const K0: RPose = {x: j.toeX - (74 + 12 * (depth - 1)) * s * face, y: j.deckY - (200 - 46 * (depth - 1)) * s, rot: 30 + 8 * (depth - 1), waist: 10, neck: -14, head: -8,
    armN: A(-62 * swing, 26, {grip: 0.5}), armF: A(-52 * swing, 30, {grip: 0.5}), legN: L(0, 0), legF: L(0, 0), yaw: 0.5, footN: fN, footF: fF};
  const K1: RPose = {x: j.toeX - 22 * s * face, y: j.deckY - 296 * s, rot: 22, waist: 2, neck: -10, head: -6,
    armN: A(150, 12, {grip: 0.2}), armF: A(138, 16, {grip: 0.2}), legN: L(0, 0), legF: L(0, 0), yaw: 0.5,
    footN: toeFoot(j.toeX + 2 * s * face, j.deckY, -38, s, face), footF: toeFoot(j.toeX - 14 * s * face, j.deckY, -46, s, face)};
  const K1fk = solveIK(K1, s, face);
  const p0 = {x: K1.x, y: K1.y};
  const g = 3554 * s;
  const vy0 = Math.sqrt(2 * g * j.apex);
  const final = j.outcome === 'plunge' ? AIR.entry : LAND_AIR;
  // contact height: the pelvis height at which the arrival pose's soles touch endY
  let p1 = {x: j.endX - 10 * s * face, y: j.endY - (STAND_H - 6) * s};
  if (j.outcome !== 'plunge') {
    const probe = {...K1fk, ...final, x: p1.x, y: 0, footN: undefined, footF: undefined} as RPose;
    const sy = soleY(rig(probe, s, face));
    p1 = {x: p1.x, y: j.endY - sy};
  }
  const dy = p1.y - p0.y;
  const T = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * dy)) / g;
  const vx = (p1.x - p0.x) / T;
  const at = (tp: number) => ({x: p0.x + vx * tp, y: p0.y - vy0 * tp + 0.5 * g * tp * tp});
  const rate = j.rate ?? 1;
  const tEnd = j.tTO + T / rate;
  const arc = (n = 40) => Array.from({length: n + 1}, (_, i) => at((T * i) / n));

  const air = (u: number, c: {x: number; y: number}): RPose => {
    const key = (k: Partial<RPose>) => ({...K1fk, ...k, x: c.x, y: c.y} as RPose);
    if (u < 0.15) return blend(key({}), key(AIR.rise), smooth(u / 0.15));
    if (u < 0.55) return blend(key(AIR.rise), key(AIR.tuck), smooth((u - 0.15) / 0.4));
    return blend(key(AIR.tuck), key(final), smooth((u - 0.55) / 0.37));
  };
  const contact = air(1, p1);
  const rc = rig(contact, s, face);
  const ankN = rc.pts.ankleN, ankF = rc.pts.ankleF;

  type Out = {pose: RPose; phase: 'ready' | 'push' | 'air' | 'after'; u: number};
  const pose = (t: number): Out => {
    if (t < j.tPush) {
      const u = smooth(seg(t, j.tReady, j.tPush));
      return {pose: blend(READY, K0, u), phase: 'ready', u};
    }
    if (t < j.tTO) {
      // accelerating extension: e'(1) ≈ 2.6× the average speed, close to the launch speed
      const u = seg(t, j.tPush, j.tTO);
      return {pose: blend(K0, K1, Math.pow(u, 2.6)), phase: 'push', u};
    }
    if (t < tEnd) {
      const tp = (t - j.tTO) * rate;
      return {pose: air(tp / T, at(tp)), phase: 'air', u: tp / T};
    }
    const d = t - tEnd;
    if (j.outcome === 'plunge') {
      const dd = Math.min(d, 0.78);
      const sink = (2333 * dd - 1500 * dd * dd) * s + Math.max(0, d - 0.78) * 300 * s;
      const p: RPose = {...contact, x: p1.x + vx * 0.04 * (1 - Math.exp(-d * 6)), y: p1.y + sink};
      return {pose: p, phase: 'after', u: d};
    }
    const standY = j.endY - (STAND_H - 4) * s;
    const slide = (0.5 * vx * (1 - Math.exp(-d * 14))) / 14;
    const feet = {footN: flatFoot(ankN[0], j.endY, s), footF: flatFoot(ankF[0], j.endY, s)};
    if (j.outcome === 'stick') {
      const dip = keys(d, [[0, 0], [0.13, 1], [0.45, 0.22], [0.75, 0]]);
      const lean = keys(d, [[0, LAND_AIR.rot], [0.13, 20], [0.5, 6], [0.8, 2]]);
      const fwd = smooth(seg(d, 0.18, 0.6)) * (j.reachArms ?? 0);
      const settle = j.settleArms ?? [6, 14];
      const armsDown = smooth(seg(d, 0.25, 0.75));
      const armN = A(lerp(lerp(62, 80, seg(d, 0, 0.13)), settle[0], armsDown), lerp(30, settle[1], armsDown), {grip: 0.3});
      const armF = A(lerp(lerp(50, 70, seg(d, 0, 0.13)), settle[0] - 8, armsDown), lerp(34, settle[1] + 2, armsDown), {grip: 0.3});
      const reachN = A(72, 26, {grip: 0.05}), reachF = A(64, 30, {grip: 0.05});
      const p: RPose = {
        ...contact, ...feet,
        // the pelvis travels over the base of support while the legs absorb (no sliding feet, no backward-leaning legs)
        x: lerp(p1.x, (ankN[0] + ankF[0]) / 2 + 10 * s * face, smooth(seg(d, 0.0, 0.5))), y: lerp(p1.y, standY, smooth(seg(d, 0.3, 0.8))) + 70 * s * dip,
        rot: lean, waist: lerp(LAND_AIR.waist, 2, smooth(seg(d, 0.1, 0.7))) + 10 * dip, neck: lerp(-2, 0, seg(d, 0, 0.6)), head: lerp(2, 0, seg(d, 0, 0.6)),
        armN: fwd > 0 ? {...armN, sh: lerp(armN.sh, reachN.sh, fwd), el: lerp(armN.el, reachN.el, fwd), grip: lerp(0.3, 0.05, fwd)} : armN,
        armF: fwd > 0 ? {...armF, sh: lerp(armF.sh, reachF.sh, fwd), el: lerp(armF.el, reachF.el, fwd), grip: lerp(0.3, 0.05, fwd)} : armF,
      };
      return {pose: p, phase: 'after', u: d};
    }
    if (j.outcome === 'faceplant') {
      // over-rotates: pivots forward over the planted feet and ends face down, arms out (feet stay on their marks)
      const r = smooth(seg(d, 0.05, 0.62));
      const ang = LAND_AIR.rot + 86 * r * r;
      const R0 = 292 * s;
      const fx = (ankN[0] + ankF[0]) / 2;
      const p: RPose = {
        ...contact, ...feet,
        x: fx + Math.sin((ang * Math.PI) / 180) * R0 * face * 0.92, y: j.endY - 36 * s - Math.cos((ang * Math.PI) / 180) * R0,
        rot: ang, waist: 4, neck: lerp(-2, -20, r), head: lerp(2, -14, r),
        armN: A(lerp(62, 170, r), lerp(30, 14, r), {grip: 0.1}), armF: A(lerp(50, 160, r), lerp(34, 18, r), {grip: 0.1}),
        footN: {x: ankN[0], y: j.endY - ANK * s, pitch: -70 * r}, footF: {x: ankF[0], y: j.endY - ANK * s, pitch: -74 * r},
      };
      return {pose: p, phase: 'after', u: d};
    }
    // short: lands at the pad's edge, pitches forward, one hand down, settles on a knee
    const fall = smooth(seg(d, 0.0, 0.32)), kneel = smooth(seg(d, 0.26, 0.62));
    const handX = ankN[0] + 170 * s * face;
    const p: RPose = {
      ...contact,
      footN: feet.footN,
      footF: kneel > 0 ? {x: lerp(ankF[0], ankF[0] - 40 * s * face, kneel), y: lerp(j.endY - ANK * s, j.endY - 52 * s, kneel), pitch: -62 * kneel} : feet.footF,
      x: p1.x + slide + 26 * s * face * fall, y: p1.y + 120 * s * fall + 40 * s * kneel,
      rot: lerp(LAND_AIR.rot, 40, fall) - 6 * kneel, waist: lerp(4, 18, fall), neck: lerp(-2, -16, fall), head: lerp(2, -10, fall),
      armN: A(lerp(62, 70, fall), lerp(30, 8, fall), {grip: 0.1}), armF: A(lerp(50, 96, fall), lerp(34, 20, fall), {grip: 0.2}),
    };
    // the near hand travels from where the arm already is to the floor (no pop between FK and IK)
    const kh = smooth(seg(d, 0.14, 0.34));
    if (kh > 0) {
      const w = rig(p, s, face).pts.wrN;
      p.handN = {x: lerp(w[0], handX, kh), y: lerp(w[1], j.endY - 34 * s, kh)};
    }
    return {pose: p, phase: 'after', u: d};
  };
  return {pose, at, arc, T, tEnd, p0, p1, K0, K1, READY, vx, vy0, tReady: j.tReady, tPush: j.tPush, tTO: j.tTO, spec: j};
};
export type Jump5 = ReturnType<typeof makeJump5>;

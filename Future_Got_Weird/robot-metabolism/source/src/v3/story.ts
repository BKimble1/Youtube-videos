// V3 story: the hero's whole timeline as a pure function of film time, in world coordinates.
//
//  0.00 - 2.95  the hook (pair.ts at H): V0 meets L, L telescopes to V1, L pulls the feet in, the robot stands.
//  3.05 - 7.55  three crawl strides (the base side links stretch while the front edge reaches, shrink while the rear
//               follows). L's housing is opened on "motorized rods ... stretch and shrink"; its connector at V1 is
//               opened on "magnets at their ends".
//  8.70 - 9.30  the response to the key press: the apex leans forward (V1 unloaded).
//  9.30 - 11.92 V1 slides back toward S; the last 12 mm close fast; contact (S's ball joins V1's cluster).
// 12.05 - 13.25 S's tip stays put while V1 rises and re-centres: S extends into a support (rear-up, 22 deg).
// 13.30 - ...   the ratchet gait: S's tip planted, S extends, the body slides forward (push); body planted, S
//               shortens, its tip slides forward (recovery). Over the deck, the rounded crest, the ramp, the foot.
// 17.50         a push stalls: S's light turns red, then dark; S is back-driven shorter under the load; the rear sinks.
// 18.60         V1 lets go: S's ball parts from the cluster, S drops onto the floor (pivoting on its tip) and rolls
//               aside; the body settles onto its three feet.
// 19.10 - 20.00 a side step toward the spare R (front feet, then the rear foot, which continues to R's end); contact.
// 20.10 - 20.80 R extends into a support; one push shows the gait restored.
// The second group waits at H2 the whole time; from tau = -1 (t = 24.7) its foot starts toward its L: the loop.
import {add, clamp, easeIn, len, lerp, mul, norm, ss, ss5, sub, V3, v3} from '../lib/v3';
import {FPS, FRAMES} from '../lib/time';
import {clusterDeltas, COL, L_MIN, LinkSpec, RB, RigState} from './rig';
import {apexOf, CRAWL_D, CRAWL_N, LA, LB, pair, placeRig, PT, REACH_S, S_A, S_B, SQ, standing, tetLinks} from './pair';
import {DH, onSurf, prof, XF, Z_P} from './world';
import {trilat} from '../rig/body';

/** apex from three different lengths (above the base) */
const trilat3 = (V0: V3, V1: V3, V2: V3, l03: number, l13: number, l23: number): V3 => {
  // trilat(p1, p2, p3, r1, r2, r3, up)
  return trilatU(V0, V1, V2, l03, l13, l23);
};
const trilatU = (a: V3, b: V3, c: V3, ra: number, rb: number, rc: number) => {
  // the solution on the side of the base's upward normal
  const n = norm(crossV(sub(b, a), sub(c, a)));
  const up = n.y >= 0 ? n : mul(n, -1);
  return trilat(a, b, c, ra, rb, rc, up);
};
const crossV = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

export const DUR = FRAMES / FPS;
export const H = v3(-0.4, DH, Z_P);
export const H2 = v3(1.35, 0, -0.38);
/** the end group is the hook group turned a quarter round (its matching camera then looks away from the ramp and the
 *  robot) */
export const YAW2 = -Math.PI / 2;
const TAU = (22 * Math.PI) / 180;
const TAU_SINK = (11 * Math.PI) / 180;

export const EV = {
  crawl: [3.05, 4.55, 6.05, 7.55],
  cut: [3.15, 3.45, 5.75, 6.05],
  sec: [6.15, 6.4, 7.3, 7.55],
  lean: [8.7, 9.3],
  reach: [9.3, 11.45, 11.92],
  snapS: 11.92,
  support: [12.05, 12.85],
  gait0: 12.9,
  stall: 17.76,
  dark: 18.02,
  sink: [18.02, 18.52],
  release: 18.6,
  part: [18.6, 18.74],
  fall: [18.72, 19.02],
  drop: [18.86, 19.1],
  roll: [19.02, 19.4],
  stepF: [19.08, 19.48],
  stepR: [19.48, 19.88, 20.0],
  snapR: 20.0,
  supportR: [20.1, 20.75],
  rec2: [20.8, 21.06],
  push2: [21.1, 21.4],
};

// ------------------------------------------------------------------------------------------- the ratchet gait
// Each push slides the body until S has extended to S_PUSH; each recovery slides the tip until S has shortened to
// S_REC. The distances follow from the surface under the robot (more travel per push on the incline), solved once.
type Stroke = {t0: number; t1: number; kind: 'push' | 'rec'; dx: number; dz: number};
const T_PUSH = 0.32, T_REC = 0.27, GAP = 0.015;
const S_PUSH = 0.384, S_REC = 0.264;
const CAP = 0.13; // longest stroke (keeps every part under ~2.7 cm per frame)
export let STROKES: Stroke[] = [];
// ------------------------------------------------------------------------------------------- body helpers
/** the body in its own frame (front edge centre at the origin, feet joints at y = 0) */
const bodyFrame = (la = LA) => {
  const V0 = v3(0, 0, LB / 2), V2 = v3(0, 0, -LB / 2), V1 = v3(-LB * SQ, 0, 0);
  return {V0, V1, V2, V3: apexOf(V0, V1, V2, la)};
};
const BF = bodyFrame();
/** rotate a body-frame point about z by a, then place at F */
const place = (p: V3, a: number, F: V3) => v3(F.x + p.x * Math.cos(a) - p.y * Math.sin(a), F.y + p.x * Math.sin(a) + p.y * Math.cos(a), F.z + p.z);
/** the rigid ratchet pose: front edge at x (on the profile), lateral position z, rear raised by tau */
export const ratchetPose = (x: number, z: number, tau: number) => {
  const F = onSurf(x, z, RB);
  const a = prof(x).ang - tau;
  return {V0: place(BF.V0, a, F), V1: place(BF.V1, a, F), V2: place(BF.V2, a, F), V3: place(BF.V3, a, F)};
};

const W = (p: V3) => add(p, H); // hook-local -> world

/** S's length for a front edge at fx (lateral z), tip at (tx, tz), rear raised by tau */
const sLen = (fx: number, tx: number, tz: number, tau = TAU) => {
  const P = ratchetPose(fx, Z_P, tau);
  const tip = onSurf(tx, tz, RB);
  const ds = clusterDeltas([norm(sub(P.V2, P.V1)), norm(sub(P.V3, P.V1)), norm(sub(P.V0, P.V1)), norm(sub(tip, P.V1))]);
  const a = add(P.V1, mul(norm(sub(tip, P.V1)), ds[3]));
  return len(sub(tip, a));
};
const solve = (f: (d: number) => number, target: number) => {
  let lo = 0, hi = 0.3;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < target === f(0) < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

// front edge (world x) when the gait starts, and the tip's start (S at rest, world)
const FX0 = H.x + CRAWL_N * CRAWL_D;
const TIP0 = W(S_B);
{
  // build the stroke list: a first recovery (which also brings the tip in toward the centre line), then alternate
  let t = EV.gait0, fx = FX0, tx = TIP0.x, tz = TIP0.z, i = 0;
  const zGoal = Z_P + 0.035;
  while (t < EV.stall + 0.5) {
    const dz = i < 3 ? (zGoal - tz) * [0.45, 0.6, 1][i] : 0;
    const dxr = Math.min(CAP, solve((d) => sLen(fx, tx + d, tz + dz), S_REC));
    STROKES.push({t0: t, t1: t + T_REC, kind: 'rec', dx: dxr, dz});
    tx += dxr;
    tz += dz;
    t += T_REC + GAP;
    const dxp = Math.min(CAP, solve((d) => sLen(fx + d, tx, tz), S_PUSH));
    STROKES.push({t0: t, t1: t + T_PUSH, kind: 'push', dx: dxp, dz: 0});
    fx += dxp;
    t += T_PUSH + GAP;
    i++;
  }
  // nothing after the stalled push
  const k = STROKES.findIndex((s) => s.kind === 'push' && s.t1 > EV.stall);
  STROKES = STROKES.slice(0, k + 1);
}
const lastPush = STROKES[STROKES.length - 1];
/** the stalled push: it follows its stroke until the stall, then runs down over ~0.06 s (no instant stop) */
const stallK = (t: number) => {
  const a = lastPush.t0, b = lastPush.t1;
  if (t <= EV.stall) return ss5(a, b, t);
  const k0 = ss5(a, b, EV.stall);
  const v0 = (ss5(a, b, EV.stall + 1e-4) - ss5(a, b, EV.stall - 1e-4)) / 2e-4;
  const td = 0.06;
  return k0 + v0 * td * (1 - Math.exp(-(t - EV.stall) / td));
};
const travel = (t: number, kind: 'push' | 'rec') =>
  STROKES.reduce(
    (a, s) => {
      if (s.kind !== kind) return a;
      const k = s === lastPush ? stallK(t) : ss5(s.t0, s.t1, t);
      return {x: a.x + s.dx * k, z: a.z + s.dz * k};
    },
    {x: 0, z: 0},
  );

/** where the replacement R lies: where V1 ends up after the side step and its reach (local to the stop position) */
const STEP_Z = -0.13; // toward the far side, where the spare lies (out of the path the front feet swept)
const REACH_R = v3(-0.045, 0, -0.095);
const R_DIR = norm(v3(-0.96, 0, -0.28));

// position of the body at the stall (it never moves again until the side step)
const xStop = FX0 + travel(99, 'push').x;
/** a foot joint resting on whatever surface is under it */
const grounded = (p: V3) => {
  const q = prof(p.x);
  return v3(p.x, q.y + RB / Math.cos(q.ang), p.z);
};
/** V1's target at the end of the side step: behind and to the near side, toward R */
const V1R = (() => grounded(add(ratchetPose(xStop, Z_P + STEP_Z, 0).V1, REACH_R)))();
/** the body after the release (no R): settles, side step, the rear foot slides on to R */
const postBody = (t: number) => {
  const tau = TAU_SINK * (1 - ss5(EV.drop[0], EV.drop[1], t));
  const P0 = ratchetPose(xStop, Z_P, tau);
  const kf = ss5(EV.stepF[0], EV.stepF[1], t);
  const V0 = add(P0.V0, v3(0, 0, STEP_Z * kf));
  const V2 = add(P0.V2, v3(0, 0, STEP_Z * kf));
  const kr = t < EV.stepR[1] ? 0.9 * ss5(EV.stepR[0], EV.stepR[1], t) : 0.9 + 0.1 * easeIn(EV.stepR[1], EV.stepR[2], t, 2.2);
  const V1 = lerp(P0.V1, V1R, Math.min(1, kr));
  return {V0, V1, V2, V3: trilat3(V0, V1, V2, LA, LA, LA)};
};
const restR = (() => {
  const B = postBody(EV.snapR);
  const V1 = B.V1;
  // R lies along the surface behind V1: its motor-end ball exactly where V1's cluster takes it, its far ball on the
  // profile, and it is contracted (L_MIN)
  const far = (d: number) => onSurf(V1.x + R_DIR.x * d, V1.z + R_DIR.z * d, RB);
  let b = far(0.25);
  let bd = 0.25;
  let a = V1;
  for (let i = 0; i < 6; i++) {
    const u = norm(sub(b, V1));
    const ds = clusterDeltas([norm(sub(B.V2, V1)), norm(sub(B.V3, V1)), norm(sub(B.V0, V1)), u]);
    a = add(V1, mul(u, ds[3]));
    let lo = 0.1, hi = 0.5;
    for (let k = 0; k < 40; k++) {
      const m = (lo + hi) / 2;
      if (len(sub(far(m), a)) < L_MIN + 0.002) lo = m;
      else hi = m;
    }
    bd = (lo + hi) / 2;
    b = far(bd);
  }
  // bx, bz: the far ball's place on the surface (its recovery slides it along the surface from there)
  return {V1, a, b, bx: V1.x + R_DIR.x * bd, bz: V1.z + R_DIR.z * bd};
})();
export const R_REST = restR;
// after R's support: one recovery and one push, by length like the gait
const rLen = (fx: number, tx: number) => {
  const P = ratchetPose(fx, Z_P + STEP_Z, TAU);
  const tip = onSurf(restR.bx + tx, restR.bz, RB);
  const ds = clusterDeltas([norm(sub(P.V2, P.V1)), norm(sub(P.V3, P.V1)), norm(sub(P.V0, P.V1)), norm(sub(tip, P.V1))]);
  return len(sub(tip, add(P.V1, mul(norm(sub(tip, P.V1)), ds[3]))));
};
const R_REC = solve((d) => rLen(xStop, d), S_REC);
const R_PUSH = solve((d) => rLen(xStop + d, R_REC), S_PUSH);

// ------------------------------------------------------------------------------------------- the hero
export type Story = RigState & {
  /** contact moments for sound and probe */
  snaps: number[];
  /** the hero's own link ids (for the probe: these must always exist) */
  hero: string[];
  fx: number; // front edge x (world)
};

const hp = 'h';
const id = (s: string) => `${hp}${s}`;

export const heroState = (t: number): Story => {
  if (t < PT.r1) {
    // the hook group carries the hero
    const s = placeRig(pair(t, hp), H);
    s.links.push({id: id('R'), a: {p: restR.a}, b: {p: restR.b}, band: COL.bandR, led: 0.55, ledCol: COL.ledIdle});
    return {...s, snaps: [PT.snap1, PT.snap2], hero: [], fx: H.x};
  }
  // after the hook: the group without O (now the hero) is just B and S at H; S is the hero's from the snap
  const g = placeRig(pair(PT.r1 + 1, hp, false), H);
  const links: LinkSpec[] = g.links.filter((l) => l.id.startsWith(`${hp}B`));
  const joints: Record<string, V3> = Object.fromEntries(Object.entries(g.joints).filter(([k]) => k.startsWith(`${hp}B`)));
  const order: Record<string, string[]> = Object.fromEntries(Object.entries(g.order).filter(([k]) => k.startsWith(`${hp}B`)));

  let V0: V3, V1: V3, V2: V3, V3_: V3;
  let fx = FX0;
  // S, R ends (free or joined)
  let Sa: V3 | 'j' = W(S_A), Sb: V3 = TIP0, Sjoined = false, Sled = 0.55, SledCol = COL.ledIdle, Sroll = 0, Sdead = false;
  let Ra: V3 | 'j' = restR.a, Rb: V3 = restR.b, Rjoined = false, Rled = 0.55, RledCol = COL.ledIdle;
  let Lcut = 0, Lsec = 0;

  if (t < EV.support[0]) {
    // ---------------- flat on the deck: crawl, lean, reach (local frame, then world)
    let front = 0, rear = 0;
    for (let i = 0; i < CRAWL_N; i++) {
      const a = EV.crawl[i], b = EV.crawl[i + 1], m = (a + b) / 2;
      front += CRAWL_D * ss5(a, m, t);
      rear += CRAWL_D * ss5(m, b, t);
    }
    const s0 = standing(0);
    let v0 = add(s0.V0, v3(front, 0, 0)), v2 = add(s0.V2, v3(front, 0, 0)), v1 = add(s0.V1, v3(rear, 0, 0));
    // reach: V1 slides to its reach point (the last 12 mm accelerate)
    const kr = t < EV.reach[1] ? 0.85 * ss5(EV.reach[0], EV.reach[1], t) : 0.85 + 0.15 * easeIn(EV.reach[1], EV.reach[2], t, 2.2);
    v1 = add(v1, mul(REACH_S, Math.min(1, kr)));
    // lean: the apex moves forward (front apex links shorten, rear lengthens), back again during the support
    const lean = ss5(EV.lean[0], EV.lean[1], t);
    const l03 = LA - 0.03 * lean, l13 = LA + 0.035 * lean, l23 = LA - 0.03 * lean;
    const v3_ = trilat3(v0, v1, v2, l03, l13, l23);
    V0 = W(v0);
    V1 = W(v1);
    V2 = W(v2);
    V3_ = W(v3_);
    fx = W(v0).x;
    // the cut-aways
    Lcut = ss(EV.cut[0], EV.cut[1], t) * (1 - ss(EV.cut[2], EV.cut[3], t));
    Lsec = ss(EV.sec[0], EV.sec[1], t) * (1 - ss(EV.sec[2], EV.sec[3], t));
    if (t >= EV.snapS) {
      Sjoined = true;
      Sa = 'j';
    }
  } else if (t < EV.release) {
    // ---------------- S joined: support, then the gait on the profile, the stall and the sink
    Sjoined = true;
    Sa = 'j';
    const tr = travel(t, 'rec'), tp = travel(t, 'push');
    fx = FX0 + tp.x;
    let tau = TAU;
    if (t < EV.support[1]) {
      // V1 rises from its reach point to the raised, centred pose; the apex returns from its lean
      const k = ss5(EV.support[0], EV.support[1], t);
      const P = ratchetPose(fx, Z_P, TAU);
      const s0 = standing(CRAWL_N * CRAWL_D);
      const v1r = W(add(s0.V1, REACH_S));
      V0 = W(s0.V0);
      V2 = W(s0.V2);
      V1 = lerp(v1r, P.V1, k);
      const l03 = LA - 0.03 * (1 - k), l13 = LA + 0.035 * (1 - k), l23 = LA - 0.03 * (1 - k);
      V3_ = trilat3(V0, V1, V2, l03, l13, l23);
    } else {
      if (t > EV.dark) tau = TAU - (TAU - TAU_SINK) * ss5(EV.sink[0], EV.sink[1], t);
      const P = ratchetPose(fx, Z_P, tau);
      V0 = P.V0;
      V1 = P.V1;
      V2 = P.V2;
      V3_ = P.V3;
    }
    // the tip: slides forward on each recovery, along the profile
    const tx = TIP0.x + tr.x, tz = TIP0.z + tr.z;
    Sb = onSurf(tx, tz, RB);
    Sled = 1;
    SledCol = COL.ledOn;
    if (t >= EV.stall) {
      const blink = t < EV.dark ? (Math.floor((t - EV.stall) * 8) % 2 === 0 ? 1 : 0.35) : 0;
      Sled = blink;
      SledCol = COL.ledFail;
      Sdead = t >= EV.dark;
    }
    // the sink: S shortens under the load (the tip stays planted); handled by tau above
  } else {
    // ---------------- after the release: S parts and drops, the body settles, side step, R, support, push
    const tr = travel(99, 'rec');
    const tipX = TIP0.x + tr.x, tipZ = TIP0.z + tr.z; // the tip's place on the surface (not its ball centre)
    const tip0 = onSurf(tipX, tipZ, RB);
    ({V0, V1, V2, V3: V3_} = postBody(t));
    fx = xStop;
    if (t >= EV.snapR) {
      // R joined: it extends into a support (V1 rises and re-centres), then one recovery and one push
      Rjoined = true;
      Ra = 'j';
      Rled = 1;
      RledCol = COL.ledOn;
      const k = ss5(EV.supportR[0], EV.supportR[1], t);
      const push = R_PUSH * ss5(EV.push2[0], EV.push2[1], t);
      Rb = onSurf(restR.bx + R_REC * ss5(EV.rec2[0], EV.rec2[1], t), restR.bz, RB);
      const PR = ratchetPose(xStop + push, Z_P + STEP_Z, TAU);
      V0 = PR.V0;
      V2 = PR.V2;
      if (push > 0) {
        V1 = PR.V1;
        V3_ = PR.V3;
      } else {
        V1 = lerp(restR.V1, PR.V1, k);
        V3_ = trilat3(V0, V1, V2, LA, LA, LA);
      }
      fx = xStop + push;
    }
    // S: first it slides 22 mm straight back along its own axis (its ball leaves the cluster, its tip skids), then it
    // falls, pivoting on its tip at constant length, until it lies on the surface; then it rolls aside
    const a0 = S_AT_RELEASE(tip0);
    const ax = norm(sub(tip0, a0));
    const bh = mul(norm(v3(ax.x, 0, ax.z)), 0.022 * ss5(EV.part[0], EV.part[1], t));
    const tipS = onSurf(tipX + bh.x, tipZ + bh.z, RB);
    const a1 = add(a0, sub(tipS, tip0));
    const Lp = len(sub(a1, tipS));
    const hd = norm(v3(a1.x - tipS.x, 0, a1.z - tipS.z));
    // fall to the surface: from the start elevation down to the angle at which the upper ball rests on the surface
    const phi0 = Math.asin(clamp((a1.y - tipS.y) / Lp, -1, 1));
    const restY = (phi: number) => {
      const p = add(tipS, add(mul(hd, Lp * Math.cos(phi)), v3(0, Lp * Math.sin(phi), 0)));
      return p.y - (prof(p.x).y + RB / Math.cos(prof(p.x).ang));
    };
    let lo = -0.5, hi = phi0;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (restY(m) > 0) hi = m;
      else lo = m;
    }
    const phiEnd = (lo + hi) / 2;
    const phi = phi0 + (phiEnd - phi0) * easeIn(EV.fall[0], EV.fall[1], t, 1.7);
    const a = add(tipS, add(mul(hd, Lp * Math.cos(phi)), v3(0, Lp * Math.sin(phi), 0)));
    const rz = 0.07 * ss5(EV.roll[0], EV.roll[1], t);
    Sa = add(a, v3(0, 0, rz));
    Sb = add(tipS, v3(0, 0, rz));
    Sroll = -rz / RB;
    Sled = 0;
    Sdead = true;
  }

  // ---------------- assemble the hero
  Object.assign(joints, {[id('V0')]: V0, [id('V1')]: V1, [id('V2')]: V2, [id('V3')]: V3_});
  // the connector cut-away is opened on the rear foot's ball that faces the far side (the camera there)
  links.push(...tetLinks(hp, COL.bandT).map((l) => (l.id === id('12') ? {...l, secA: Lsec} : l)));
  links.push({id: id('L'), a: {j: id('V0')}, b: {j: id('V1')}, band: COL.bandX, led: 1, cut: Lcut});
  const v1order = [id('12:a'), id('13:a'), id('L:b')];
  if (Sjoined) v1order.push(id('S:a'));
  if (Rjoined) v1order.push(id('R:a'));
  links.push({id: id('S'), a: Sa === 'j' ? {j: id('V1')} : {p: Sa}, b: {p: Sb}, band: COL.bandS, led: Sled, ledCol: SledCol, roll: Sroll, dead: Sdead});
  links.push({id: id('R'), a: Ra === 'j' ? {j: id('V1')} : {p: Ra}, b: {p: Rb}, band: COL.bandR, led: Rled, ledCol: RledCol});
  Object.assign(order, {
    [id('V0')]: [id('02:a'), id('03:a'), id('L:a')],
    [id('V1')]: v1order,
    [id('V2')]: [id('02:b'), id('12:b'), id('23:a')],
    [id('V3')]: [id('03:b'), id('13:b'), id('23:b')],
  });
  return {joints, order, links, snaps: [PT.snap1, PT.snap2, EV.snapS, EV.snapR], hero: [id('02'), id('03'), id('12'), id('13'), id('23'), id('L')], fx};
};


/** S's ball as V1's cluster holds it (fourth ball) in the sunk pose, the moment it is let go */
const S_AT_RELEASE = (tip: V3): V3 => {
  const P = ratchetPose(xStop, Z_P, TAU_SINK);
  const ds = clusterDeltas([norm(sub(P.V2, P.V1)), norm(sub(P.V3, P.V1)), norm(sub(P.V0, P.V1)), norm(sub(tip, P.V1))]);
  return add(P.V1, mul(norm(sub(tip, P.V1)), ds[3]));
};

// ------------------------------------------------------------------------------------------- everything at t
export const world = (t: number): RigState & {snaps: number[]; fx: number} => {
  const h = heroState(t);
  const e = placeRig(pair(t - DUR, 'e'), H2, YAW2);
  return {
    joints: {...h.joints, ...e.joints},
    order: {...h.order, ...e.order},
    links: [...h.links, ...e.links],
    snaps: h.snaps,
    fx: h.fx,
  };
};

export {XF};

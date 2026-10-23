// Every V2 state as a pure function of time. The clerk's walk is solved against the locked audio: her feet land on
// the footsteps already in the mix (world2.STRIKES), her torso enters the infrared path on frame 815 and leaves it on
// frame 958, which is exactly where the mix's message is cut and restored. `blocked` is computed from her body
// geometry; tools/check_v2.ts asserts that it matches audio/cues.json frame for frame.
import {P, Pt, clamp, lerp, inv, eio, eout, ramp, fadeWin, pw} from './lib2';
import {LeadPose, POSE0} from './art/LeadHead';
import {LeadBodyPose, BODY0} from './art/LeadFigure';
import {ClerkHeadPose, CHEAD0, ClerkBodyPose, LegState} from './art/Clerk';
import {CROSS, EAR, EXIT, WALK_Z, MPU, GROUND_U, STRIKES, T_BLOCK, T_CLEAR, msgOn, v3, V3, w, we} from './world2';

// ---- the clerk's body against the path (metres). Torso box: front/back extents along X at chest height (figure
// units -170 .. +200, from the cardigan outline at the path's height) and +-0.12 m in depth.
export const BODY = {front: 170 * MPU, back: 200 * MPU, half: 0.12};
const SLOPE = (EAR.x - EXIT.x) / (EAR.z - EXIT.z); // dX/dZ of the path
const SPREAD = BODY.half * SLOPE;
export const X_ENTER = CROSS.x + SPREAD + BODY.front; // her origin X when the torso first touches the path
export const X_EXIT = CROSS.x - SPREAD - BODY.back; // ... and when it has fully cleared it
export const blockedAt = (xp: number) => xp - BODY.front < CROSS.x + SPREAD && xp + BODY.back > CROSS.x - SPREAD;

// ---- her origin X(t): cubic Hermite through keyed (t, x, v) ----
type HK = [number, number, number];
const hermite = (t: number, ks: HK[]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, x0, v0] = ks[i - 1], [t1, x1, v1] = ks[i], h = t1 - t0, s = (t - t0) / h;
      const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
      return h00 * x0 + h10 * h * v0 + h01 * x1 + h11 * h * v1;
    }
  }
  const [tl, xl, vl] = ks[ks.length - 1];
  return xl + vl * (t - tl);
};
export const WALK = {x0: 1.2, go0: 22.62, pause: 25.42, xPause: X_ENTER + 0.12, goB: 26.66, stop: 28.24, xStop: X_EXIT + 0.27, go1: 31.36};
const XK: HK[] = [
  [WALK.go0, WALK.x0, 0],
  [23.3, WALK.x0 - 0.3, -0.78],
  [23.95, WALK.x0 - 0.84, -0.62],
  [24.9, WALK.xPause + 0.09, -0.22],
  [WALK.pause, WALK.xPause, 0],
  [WALK.goB, WALK.xPause, 0],
  [T_BLOCK - 0.012, X_ENTER, -0.42],
  [27.75, X_ENTER - 0.13, -0.12],
  [WALK.stop, WALK.xStop, 0],
  [WALK.go1, WALK.xStop, 0],
  [T_CLEAR - 0.012, X_EXIT, -0.78],
  [33.0, X_EXIT - 0.93, -0.92],
  [34.2, X_EXIT - 2.04, -0.93],
];
export const clerkX = (t: number) => hermite(t, XK);
export const clerkFeet = (t: number): V3 => v3(clerkX(t), 0, WALK_Z);
export const blocked = (t: number) => blockedAt(clerkX(t));
export const received = (t: number) => msgOn(t) && !blocked(t);

// ---- footfalls: strikes alternate feet (near first); each foot lands ahead of the pelvis ----
type Plant = {t: number; x: number; foot: 0 | 1};
const PLANTS: Plant[] = (() => {
  const out: Plant[] = [];
  STRIKES.forEach((t, i) => {
    const nx = i + 1 < STRIKES.length ? clerkX(STRIKES[i + 1]) : clerkX(t + 0.45);
    const ahead = clamp(0.5 * (clerkX(t) - nx) + 0.03, 0, 0.2);
    out.push({t, x: clerkX(t) - ahead, foot: (i % 2) as 0 | 1});
  });
  return out;
})();
const FOOT0 = [WALK.x0 - 30 * MPU, WALK.x0 + 56 * MPU];
export const footAt = (t: number, foot: 0 | 1) => {
  const mine = PLANTS.filter((p) => p.foot === foot);
  let prevX = FOOT0[foot], prevT = -1;
  for (const p of mine) {
    if (t < p.t) {
      // swinging toward p? lift-off just after the other foot's last strike before p, at most 0.5 s ahead of landing
      const other = PLANTS.filter((q) => q.foot !== foot && q.t < p.t && q.t > prevT);
      const lastOther = other.length ? other[other.length - 1].t : prevT;
      const lift = Math.max(lastOther + 0.07, p.t - 0.5, prevT + 0.1);
      if (t <= lift) {
        const heel = ramp(lift - 0.14, lift, t, (x) => x);
        return {x: prevX, lift: 0, pitch: -24 * heel * (prevT > 0 ? 1 : 0)};
      }
      const s = inv(lift, p.t, t);
      return {x: lerp(prevX, p.x, eio(s) * 0.85 + s * 0.15), lift: 70 * Math.sin(Math.PI * Math.min(1, s * 1.08)), pitch: lerp(-24, 16, s)};
    }
    prevX = p.x;
    prevT = p.t;
  }
  return {x: prevX, lift: 0, pitch: 0};
};
const strikePulse = (t: number) => STRIKES.reduce((m, s) => Math.max(m, Math.exp(-(((t - s) / 0.1) ** 2))), 0);
// walking amount (0 standing .. 1 striding): from her speed
export const clerkSpeed = (t: number) => Math.abs(clerkX(t + 0.02) - clerkX(t - 0.02)) / 0.04;

// ---- the clerk's actions ----
// A: holding her cup, she blows across it (0.1-1.5), glances at the lead on "beside you" (2.2-3.4), looks back down.
// D/E: idle, sets off (22.6) toward the doorway on the left; at the edge she pauses and blows on the coffee
// (25.5-26.5); she steps on and stops for a sip (28.4-31.0) right in the path, unaware; then walks on.
const cupPose = (t: number): {cup: Pt; ang: number; blow: number; lid: number; tilt: number} => {
  const hold = {cup: P(-330, 744), ang: 0};
  const chin = {cup: P(-318, 452), ang: -4};
  const lips = {cup: P(-196, 270), ang: 34};
  const blowA = fadeWin(t, 0.0, 1.55, 0.45) * (t < 5 ? 1 : 0);
  const blowE = fadeWin(t, 25.42, 26.62, 0.42);
  const sip = fadeWin(t, 28.3, 31.12, 0.55);
  const kChin = Math.max(blowA, blowE) * (1 - sip);
  const c = P(lerp(lerp(hold.cup.x, chin.cup.x, kChin), lips.cup.x, sip), lerp(lerp(hold.cup.y, chin.cup.y, kChin), lips.cup.y, sip));
  const ang = lerp(lerp(hold.ang, chin.ang, kChin), lips.ang, sip) + 6 * sip * Math.sin(Math.PI * inv(28.85, 30.6, t));
  const blow = Math.max(fadeWin(t, 0.35, 1.3, 0.2), fadeWin(t, 25.75, 26.4, 0.18));
  return {cup: c, ang, blow, lid: 0.55 * sip, tilt: -7 * sip + 5 * kChin};
};
export const clerkHead = (t: number): ClerkHeadPose => {
  const c = cupPose(t);
  const glance = fadeWin(t, 2.2, 3.45, 0.3);
  return {...CHEAD0, look: lerp(0.1, 0.9, glance) - 0.4 * Math.max(fadeWin(t, 0, 1.6, 0.4), fadeWin(t, 25.4, 26.6, 0.4)), lookY: 0.7 * Math.max(fadeWin(t, 0, 1.6, 0.4), fadeWin(t, 25.4, 26.6, 0.4)) - 0.2 * glance,
    smile: 0.15, lid: c.lid, blow: c.blow, tilt: c.tilt + 2 * glance};
};
export const clerkBody = (t: number): ClerkBodyPose => {
  const xp = clerkX(t);
  const toFig = (x: number) => (x - xp) / MPU;
  const n = footAt(t, 0), f = footAt(t, 1);
  const legs = (s: {x: number; lift: number; pitch: number}, dx: number): LegState => ({ank: P(toFig(s.x) + dx, GROUND_U - 52 - s.lift), pitch: s.pitch});
  const near = legs(n, 0), far = legs(f, 0);
  const sp = clamp(clerkSpeed(t) / 0.6);
  const c = cupPose(t);
  return {
    bob: 10 * sp * strikePulse(t) - 4 * sp, lean: 3 * sp, near, far,
    swing: clamp((far.ank.x - near.ank.x) * 0.055, -17, 17) * clamp(sp * 1.5),
    cup: P(c.cup.x, c.cup.y + 6 * sp * Math.sin(t * 9)), cupAng: c.ang, breath: Math.sin(t * 2 * Math.PI * 0.25),
  };
};

// ---- the lead: surprise -> concentration -> puzzlement -> recognition ----
const EXPR = {
  surprise: {lid: -0.55, brow: 1.8, knit: 0, smirk: 0, open: 0.7, gx: -0.6, gy: -0.3, tilt: -3},
  wonder: {lid: -0.15, brow: 0.9, knit: 0.15, smirk: 0, open: 0, gx: -0.4, gy: -0.1, tilt: -1},
  concentration: {lid: 0.42, brow: -0.3, knit: 1, smirk: 0, open: 0, gx: -0.9, gy: 0.35, tilt: 5},
  puzzlement: {lid: -0.1, brow: 1.0, knit: 1, smirk: -1, open: 0.15, gx: -0.35, gy: -0.6, tilt: -9},
  recognition: {lid: -0.25, brow: 1.45, knit: 0, smirk: 1, open: 0, gx: -0.55, gy: -0.1, tilt: 3},
};
type E = typeof EXPR.surprise;
const mixE = (a: E, b: E, k: number): E => Object.fromEntries(Object.keys(a).map((key) => [key, lerp(a[key as keyof E], b[key as keyof E], k)])) as E;
export const leadExpr = (t: number): E => {
  // frame 0 is already mid-reaction; it settles as the message stops (3.9) into wonder; concentration when it
  // returns (17.73); puzzlement exactly on the cut (27.167, fast onset); recognition on the return (31.933)
  let e = EXPR.surprise;
  e = mixE(e, EXPR.wonder, ramp(3.95, 5.0, t));
  e = mixE(e, EXPR.concentration, ramp(17.75, 18.45, t));
  e = mixE(e, EXPR.wonder, 0.4 * ramp(20.0, 21.0, t) * (1 - ramp(23.95, 24.5, t)));
  e = mixE(e, EXPR.puzzlement, ramp(T_BLOCK, T_BLOCK + 0.2, t, eout));
  e = mixE(e, EXPR.recognition, ramp(T_CLEAR, T_CLEAR + 0.3, t, eout));
  return e;
};
export const leadPose = (t: number): LeadPose => {
  const e = leadExpr(t);
  // small life: surprise eye darts at the start, a searching glance during the cut, a nod of recognition
  const dart = t < 3.9 ? 0.25 * Math.sin(t * 5.3) * (1 - ramp(2.8, 3.9, t)) : 0;
  const search = fadeWin(t, T_BLOCK + 0.3, T_CLEAR, 0.4) * 0.3 * Math.sin((t - T_BLOCK) * 2.2);
  const blink = [4.6, 9.0, 16.4, 21.3, 25.0, 30.2].reduce((m, b) => Math.max(m, 1 - Math.abs(t - b) / 0.08), 0);
  const nod = 2.5 * Math.sin(Math.PI * inv(T_CLEAR + 0.2, T_CLEAR + 1.0, t)) * (t > T_CLEAR + 0.2 && t < T_CLEAR + 1.0 ? 1 : 0);
  return {...POSE0, ...e, lid: Math.max(e.lid, clamp(blink)), gx: e.gx + dart + search, gy: e.gy, tilt: e.tilt + nod, squeeze: 0.25 * clamp(e.knit)};
};
export const leadBody = (t: number): LeadBodyPose => ({
  ...BODY0,
  breath: Math.sin(t * 2 * Math.PI * 0.27),
  hands: lerp(0.55, 0.15, ramp(4, 7, t)) + 0.75 * ramp(T_BLOCK, T_BLOCK + 0.45, t, eout) * (1 - ramp(T_CLEAR + 0.2, T_CLEAR + 1.1, t)),
  sheet: lerp(-10, 0, ramp(4, 7, t)),
  lean: -1.5 * (1 - ramp(3.9, 5.5, t)) + 1.2 * ramp(17.75, 18.6, t) - 2.2 * ramp(T_BLOCK, T_BLOCK + 0.4, t, eout) * (1 - ramp(T_CLEAR, T_CLEAR + 0.6, t)),
  weight: 0.3,
});
// the ear accent (the "you hear it" marker): on while the message is received, never on the clerk
export const earAccent = (t: number) => (received(t) ? 1 : 0);
export {EAR, EXIT, w, we};

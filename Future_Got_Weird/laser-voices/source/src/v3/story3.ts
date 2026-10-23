// Every V3 state as a pure function of time.
//   - The narration is the locked V1/V2 recording; nothing here moves a word.
//   - The transmitted message is now a short nonverbal "alien" motif (tools/make_audio_v3.py). It sounds in four
//     places only: a fragment that straddles the loop seam (the opening reaction), a quiet return just before the
//     obstruction, its cut on the blocking frame, and its return at restoration. MOTIFS lists them; the picture's ear
//     accent and the audio both read `motifEnv` x `received`.
//   - The companion's walk is solved against the footsteps already in the locked effects stem (world3.STRIKES): her
//     feet land on them, her shoulder enters the optical path on frame 815 (27.167 s, "stops") and clears it on frame
//     958 (31.933 s, between "move" and "You").
//   - Near the loop seam every performance curve is written in loop time (lt), so the last frame flows into frame 0.
import {P, Pt, clamp, lerp, inv, eio, eout, ramp, fadeWin, pw} from './lib3';
import {LeadPose, POSE0} from './art/LeadHead';
import {LeadBodyPose, BODY0, REST_N, REST_F} from './art/LeadFigure';
import {ClerkHeadPose, CHEAD0, ClerkBodyPose, LegState} from './art/Clerk';
import {EAR, EXIT, WALK_Z, MPU, GROUND_U, STRIKES, T_BLOCK, T_CLEAR, DUR, v3, V3, w, we} from './world3';

// ---- loop time: the last SEAM seconds are also "before frame 0" ----
export const SEAM = 1.0;
export const lt = (t: number) => (t > DUR - SEAM ? t - DUR : t);
// periodic idle (whole cycles over the film, so it is continuous across the loop)
export const cyc = (t: number, approxHz: number, ph = 0) => Math.sin((2 * Math.PI * Math.max(1, Math.round(approxHz * DUR)) * t) / DUR + ph);

// ---- the motif (shared with the audio builder through tools/export_cues_v3.ts) ----
// each instance: onset time (s) and nominal length; the seam instance starts before the end and finishes after frame 0
export const MOTIF_LEN = 0.6;
export const MOTIFS = [
  {name: 'seam/opening reaction', t0: DUR - 0.2, len: MOTIF_LEN},
  {name: 'quiet return before the obstruction', t0: 25.9, len: 1.6}, // cut by the block at 27.167
  {name: 'restoration', t0: T_CLEAR, len: MOTIF_LEN},
];
const mEnv = (x: number, len: number) => {
  // attack 40 ms, waver/sustain, 180 ms release (the audio uses the same envelope)
  if (x < 0 || x > len) return 0;
  const a = Math.min(1, x / 0.04), r = Math.min(1, (len - x) / 0.18);
  return Math.sin((Math.PI / 2) * a) * Math.sin((Math.PI / 2) * r);
};
export const motifEnv = (t: number) => {
  let e = 0;
  for (const m of MOTIFS) {
    e = Math.max(e, mEnv(t - m.t0, m.len));
    if (m.t0 + m.len > DUR) e = Math.max(e, mEnv(t + DUR - m.t0, m.len)); // the part after the seam
  }
  return e;
};
// transmission windows: the source is active from the quiet return to the end (and through the seam fragment)
export const txOn = (t: number) => t < 0.75 || t >= 25.86;

// ---- the obstruction, as the viewer sees it: she blocks the path while her drawn outline (head, neck, torso) touches
// the drawn path on screen (occlude3.screenBlocked). The walk passes through these two X positions on the locked
// frames; tools/solve_v3.ts solves them and tools/check_v3.ts verifies, frame by frame, that the outline first touches
// the path on frame 815 and has left it on frame 958.
export const X_ENTER = 0.3881, X_EXIT = -0.4611;
export const blockedAt = (xp: number) => xp < X_ENTER && xp > X_EXIT;

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
export const WALK = {x0: 1.12, go0: 22.62, pause: 25.42, xPause: X_ENTER + 0.2, goB: 26.66, stop: 28.3, xStop: X_ENTER - 0.2, go1: 30.85};
const XK: HK[] = [
  [WALK.go0, WALK.x0, 0],
  [23.3, WALK.x0 - 0.06, -0.14],
  [23.95, WALK.x0 - 0.2, -0.2],
  [24.9, WALK.xPause + 0.04, -0.1],
  [WALK.pause, WALK.xPause, 0],
  [WALK.goB, WALK.xPause, 0],
  [T_BLOCK - 0.012, X_ENTER, -0.4],
  [27.75, X_ENTER - 0.15, -0.14],
  [WALK.stop, WALK.xStop, 0],
  [WALK.go1, WALK.xStop, 0],
  [T_CLEAR - 0.012, X_EXIT, -0.82],
  [32.6, X_EXIT - 0.5, -0.85],
  [34.2, X_EXIT - 1.86, -0.86],
];
export const clerkX = (t: number) => hermite(t, XK);
// she starts beside him (a little in front, to his right) and drifts onto the crossing line as she walks to the door
export const START_Z = 3.5;
export const clerkZ = (t: number) => lerp(START_Z, WALK_Z, eio(inv(22.75, 25.2, t)));
export const clerkFeet = (t: number): V3 => v3(clerkX(t), 0, clerkZ(t));
export const blocked = (t: number) => blockedAt(clerkX(t));
export const received = (t: number) => txOn(t) && !blocked(t);
export const msgOn = txOn;

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
      const other = PLANTS.filter((q) => q.foot !== foot && q.t < p.t && q.t > prevT);
      const lastOther = other.length ? other[other.length - 1].t : prevT;
      const lift = Math.max(lastOther + 0.07, p.t - 0.5, prevT + 0.1);
      if (t <= lift) {
        const heel = ramp(lift - 0.14, lift, t, (x) => x);
        return {x: prevX, lift: 0, pitch: -24 * heel * (prevT > 0 ? 1 : 0)};
      }
      const s = inv(lift, p.t, t);
      return {x: lerp(prevX, p.x, eio(s) * 0.85 + s * 0.15), lift: 64 * Math.sin(Math.PI * Math.min(1, s * 1.08)), pitch: lerp(-24, 14, s)};
    }
    prevX = p.x;
    prevT = p.t;
  }
  return {x: prevX, lift: 0, pitch: 0};
};
const strikePulse = (t: number) => STRIKES.reduce((m, s) => Math.max(m, Math.exp(-(((t - s) / 0.1) ** 2))), 0);
export const clerkSpeed = (t: number) => Math.abs(clerkX(t + 0.02) - clerkX(t - 0.02)) / 0.04;

// ---- the companion's actions (she never hears the motif) ----
// A: blows across her cup (0.45-1.6), notices the lead acting oddly on "voice" (2.25-3.4), sips calmly (3.6-4.7).
// E: a sip at 20.3-21.4 in the distance view; the weight shift and first step (22.62 -> 23.03).
// F: at the path's edge she pauses and blows on the coffee (25.45-26.6), steps into the path, stops and sips
//    (28.3-31.1) right in it, unaware, then walks on and out of the room.
const HOLD = P(-262, 752), CHIN = P(-300, 452), LIPS = P(-196, 270);
const cupPose = (t: number): {cup: Pt; ang: number; blow: number; lid: number; tilt: number} => {
  const blowA = fadeWin(t, 0.35, 1.75, 0.4);
  const blowE = fadeWin(t, 25.42, 26.62, 0.42);
  const sip = Math.max(fadeWin(t, 3.55, 4.75, 0.42), fadeWin(t, 20.2, 21.45, 0.42), fadeWin(t, 28.3, 31.12, 0.55));
  const kChin = Math.max(blowA, blowE) * (1 - sip);
  const c = P(lerp(lerp(HOLD.x, CHIN.x, kChin), LIPS.x, sip), lerp(lerp(HOLD.y, CHIN.y, kChin), LIPS.y, sip));
  const ang = lerp(lerp(0, -4, kChin), 34, sip) + 5 * fadeWin(t, 28.3, 31.12, 0.55) * Math.sin(Math.PI * inv(28.85, 30.6, t));
  const blow = Math.max(fadeWin(t, 0.6, 1.5, 0.15), fadeWin(t, 25.75, 26.4, 0.18));
  return {cup: c, ang, blow, lid: 0.55 * sip, tilt: -7 * sip + 5 * kChin};
};
export const clerkHead = (t: number): ClerkHeadPose => {
  const c = cupPose(t);
  const glance = fadeWin(t, 2.25, 3.4, 0.25);
  const down = Math.max(fadeWin(t, 0.3, 1.8, 0.35), fadeWin(t, 25.4, 26.6, 0.35));
  return {...CHEAD0, look: lerp(0.1, 0.95, glance) - 0.4 * down, lookY: 0.7 * down - 0.15 * glance,
    smile: 0.15 - 0.1 * glance, lid: Math.max(c.lid, blink(t, [5.2, 12.4, 19.6, 24.6, 32.6])), blow: c.blow, tilt: c.tilt + 3 * glance};
};
const blink = (t: number, at: number[]) => at.reduce((m, b) => Math.max(m, clamp(1 - Math.abs(t - b) / 0.075)), 0);
export const clerkBody = (t: number): ClerkBodyPose => {
  const xp = clerkX(t);
  const toFig = (x: number) => (x - xp) / MPU;
  const n = footAt(t, 0), f = footAt(t, 1);
  const legs = (s: {x: number; lift: number; pitch: number}): LegState => ({ank: P(toFig(s.x), GROUND_U - 52 - s.lift), pitch: s.pitch});
  const near = legs(n), far = legs(f);
  const sp = clamp(clerkSpeed(t) / 0.5);
  // the preparatory weight shift before the first step (22.62-23.0): she sinks and leans into the walk
  const prep = fadeWin(t, 22.5, 23.1, 0.25);
  const c = cupPose(t);
  return {
    bob: 9 * sp * strikePulse(t) - 3 * sp + 6 * prep, lean: 3 * sp + 2.5 * prep, near, far,
    swing: clamp((far.ank.x - near.ank.x) * 0.05, -15, 15) * clamp(sp * 1.5),
    cup: P(c.cup.x, c.cup.y + 4 * sp * Math.sin(t * 9)), cupAng: c.ang, breath: cyc(t, 0.25, 1.1),
  };
};

// ---- the lead: hearing something unusual -> checking the source/ear -> concentrating -> the interruption ->
// recognising the returning signal (and, across the seam, the opening reaction again) ----
const EXPR = {
  neutral: {lid: 0, brow: 0.3, knit: 0, smirk: 0, open: 0, gx: 0.15, gy: 0},
  alert: {lid: -0.42, brow: 1.65, knit: 0, smirk: 0, open: 0.22, gx: -0.85, gy: -0.15}, // the involuntary reaction
  wonder: {lid: -0.12, brow: 0.9, knit: 0.15, smirk: 0, open: 0, gx: -0.5, gy: 0.05},
  concentration: {lid: 0.4, brow: -0.25, knit: 0.9, smirk: 0, open: 0, gx: -0.9, gy: 0.35},
  puzzlement: {lid: -0.1, brow: 1.0, knit: 1, smirk: -1, open: 0.12, gx: -0.4, gy: -0.5},
  recognition: {lid: -0.22, brow: 1.4, knit: 0, smirk: 1, open: 0, gx: -0.5, gy: -0.1},
};
type E = typeof EXPR.alert;
const mixE = (a: E, b: E, k: number): E => Object.fromEntries(Object.keys(a).map((key) => [key, lerp(a[key as keyof E], b[key as keyof E], k)])) as E;
export const leadExpr = (t: number): E => {
  const u = lt(t);
  // seam: recognition (from the restoration) -> the reaction as the next fragment arrives (u = -0.2)
  let e = mixE(EXPR.recognition, EXPR.alert, ramp(-0.17, 0.22, u, eout));
  if (u >= 0) {
    e = mixE(e, EXPR.wonder, ramp(1.2, 2.2, u));
    e = mixE(e, EXPR.alert, 0.45 * fadeWin(u, 2.4, 3.7, 0.35)); // "nobody beside you": he looks to her, she shrugs it off
    e = mixE(e, EXPR.wonder, ramp(4.0, 4.6, u) * 0.6);
    e = mixE(e, EXPR.concentration, 0.55 * fadeWin(u, 5.8, 8.6, 0.6)); // checking his ear / the source
    e = mixE(e, EXPR.concentration, ramp(9.0, 9.8, u) * (1 - ramp(22.6, 23.6, u)));
    e = mixE(e, EXPR.wonder, ramp(22.6, 23.6, u) * (1 - ramp(25.86, 26.2, u)));
    e = mixE(e, EXPR.concentration, ramp(25.86, 26.3, u, eout)); // the message returns: he concentrates
    e = mixE(e, EXPR.puzzlement, ramp(T_BLOCK, T_BLOCK + 0.2, u, eout)); // the cut, on the blocking frame
    e = mixE(e, EXPR.recognition, ramp(T_CLEAR, T_CLEAR + 0.28, u, eout));
  }
  return e;
};
const blinks = [4.75, 7.45, 12.9, 18.2, 21.3, 24.9, 30.05, 33.05];
export const leadPose = (t: number): LeadPose => {
  const u = lt(t);
  const e = leadExpr(t);
  // eyes: a quick dart back toward the source at the reaction; a searching glance while the message is cut; toward
  // her (forward-down) as she stands in the path
  const dart = -0.25 * Math.sin(Math.PI * clamp(inv(0.05, 0.55, u)));
  const toHer = fadeWin(u, 2.45, 3.6, 0.3) * 1.3 + fadeWin(u, 28.3, 30.2, 0.45) * 0.55;
  const search = fadeWin(u, T_BLOCK + 0.25, 28.2, 0.3) * 0.35 * Math.sin((u - T_BLOCK) * 6);
  const nod = 2.5 * Math.sin(Math.PI * clamp(inv(T_CLEAR + 0.15, T_CLEAR + 0.95, u))) * (u > T_CLEAR + 0.15 && u < T_CLEAR + 0.95 ? 1 : 0);
  // the head check: a small tilt back toward the ear side, carried by the shoulders (see leadBody twist)
  const check = pw(u, [[-0.2, 0], [0.45, 1, eout], [1.5, 1], [2.3, 0.2], [5.6, 0.2], [6.3, 0.75], [8.4, 0.75], [9.2, 0.3], [27.2, 0.3], [27.5, 0.75], [29.0, 0.5], [31.9, 0.2], [33.0, 0]]);
  const bl = blinks.reduce((m, b) => Math.max(m, clamp(1 - Math.abs(t - b) / 0.075)), 0);
  return {...POSE0, ...e, lid: Math.max(e.lid, bl), gx: e.gx + dart + toHer, gy: e.gy + 0.25 * fadeWin(u, 28.3, 30.2, 0.45),
    tilt: -4.5 * check + nod + 1.2 * cyc(t, 0.11, 0.4), squeeze: 0.25 * clamp(e.knit)};
};
// the near hand: across the seam it is rising toward his chin (a thoughtful gesture after the recognition) and is
// halted mid-air by the reaction; it settles; it lifts slightly at the interruption and drops at the return
const HAND_UP = P(176, 262);
const EAR_TOUCH = P(-106, 166);
export const leadBody = (t: number): LeadBodyPose => {
  const u = lt(t);
  const up = pw(u, [[-0.75, 0], [0.12, 1, eout], [0.95, 1], [2.1, 0, eio]]);
  const cut = ramp(T_BLOCK + 0.05, T_BLOCK + 0.5, u, eout) * (1 - ramp(T_CLEAR + 0.2, T_CLEAR + 0.9, u));
  // "anything in your ears": he checks his ear, fingertips at the lobe (the canal stays clear), then lets it drop
  const ear = fadeWin(u, 5.6, 7.45, 0.42);
  const hn0 = P(lerp(lerp(REST_N.x, 96, cut), HAND_UP.x, up), lerp(lerp(REST_N.y, 760, cut), HAND_UP.y, up));
  const hn = P(lerp(hn0.x, EAR_TOUCH.x, ear), lerp(hn0.y, EAR_TOUCH.y, ear));
  const check = pw(u, [[-0.2, 0], [0.45, 1, eout], [1.5, 1], [2.3, 0.2], [5.6, 0.2], [6.3, 0.7], [8.4, 0.7], [9.2, 0.2], [27.2, 0.2], [27.5, 0.6], [29.0, 0.45], [31.9, 0.15], [33.0, 0]]);
  // weight: settles onto the near leg after the reaction, back to the far leg as he concentrates, shifts at the cut
  const weight = pw(u, [[-0.6, 0.35], [0.4, -0.25], [2.4, 0.3], [9.0, -0.2], [23.0, 0.3], [27.4, -0.35], [31.9, 0.1], [33.4, 0.35]]);
  return {
    ...BODY0,
    breath: cyc(t, 0.27),
    lean: -1.2 * check + 1.0 * ramp(25.9, 26.6, u) * (1 - ramp(T_BLOCK, T_BLOCK + 0.4, u)),
    weight, twist: -0.75 * check - 0.35 * fadeWin(u, 28.3, 30.2, 0.45),
    handN: hn, handF: P(REST_F.x + 6 * cyc(t, 0.27), REST_F.y), angN: -22 * up - 25 * ear, gripN: lerp(lerp(0.3, 0.65, up), 0.15, ear),
  };
};
export {EAR, EXIT, w, we};

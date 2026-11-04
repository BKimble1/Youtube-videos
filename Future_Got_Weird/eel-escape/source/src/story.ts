// The timeline. Every beat is keyed to the narration's measured word times (data/timeline.json via lib.word).
// World units = the fish-local units of anatomy.ts (the predator sits at the origin, facing left, on the riverbed).
import {P, pt} from './core/geo';
import {Cam, glide, Key, travel} from './camera';
import {clamp, DUR, lerp, ss, ss5, word} from './lib';
import {Drivers, eelPose, EelPose, EXIT_TANGENT, releaseMid, S_CHAMBER, S_EXIT, S_SLIT, S_THROAT} from './eel';
import {EEL_L} from './anatomy';

const W = (w: string, n = 0) => word(w, n);
/** narration anchors (seconds) */
export const T = {
  tail: W('tail').start, fish: W('fish').start, belongs: W('belongs').start, eel: W('eel').start, swallowed: W('swallowed').start,
  swallowedEnd: W('swallowed').end, scientists: W('scientists').start, xray: W('x-ray').start, xrayEnd: W('x-ray').end,
  inside: W('inside').start, stomach: W('stomach').start, starts: W('starts').start, backing: W('backing').start, up: W('up').end,
  its: W('its').start, tail2: W('tail', 1).start, slides: W('slides').start, throat: W('throat').start, throatEnd: W('throat').end,
  slips: W('slips').start, gap: W('gap').start, gills: W('gills').start, gillsEnd: W('gills').end, pokes: W('pokes').start,
  side: W('side').start, sideEnd: W('side').end, then: W('then').start, body: W('body').start, follows: W('follows').start,
  followsEnd: W('follows').end, its2: W('its', 2).start, head: W('head').start, comes: W('comes').start, last: W('last').start,
  lastEnd: W('last').end, the3: W('eel', 2).start, curls: W('curls').start, outside: W('outside').start, fish3: W('fish', 1).start,
  fish3End: W('fish', 1).end, gives: W('gives').start, final: W('final').start, pull: W('pull').start, pullEnd: W('pull').end,
  and: W('and', 1).start, swims: W('swims').start, away: W('away').start, animal: W('animal').start, ate: W('ate').start, itEnd: W('it', 2).end,
};

// ---------------------------------------------------------------- monotone cubic (Fritsch–Carlson) through keys
export const mono = (keys: [number, number][]) => {
  const n = keys.length;
  const xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]);
  const d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const tau = 3 / Math.sqrt(h); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]) * 0;
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
};

// ---------------------------------------------------------------- events
const S = S_EXIT, L = EEL_L;
/** the tail's length outside the fish in the opening (and again when the exterior is restored after the cutaway) */
export const OPEN_OUT = 21;
export const EV = {
  beat0: 0.0, beat1: 0.46,
  reveal0: T.belongs, reveal1: T.swallowed + 0.15,
  xray0: T.scientists - 0.05, xray1: T.xray - 0.05,
  rew0: T.xray + 0.02, rew1: T.inside - 0.08,
  back0: T.starts - 0.05,
  throat: T.throatEnd,
  slit: T.gap + 0.1, chamber: T.gills + 0.05,
  poke: T.pokes + 0.12,
  cut0: T.throat + 0.15, cut1: T.slips + 0.45, cutHold1: T.sideEnd - 0.05, restore1: T.then + 0.02,
  follow1: T.followsEnd + 0.05,
  headAt: T.head + 0.15,
  curl0: T.curls - 0.2, curl1: T.fish3End,
  tug0: T.gives - 0.1,
  release: T.pull - 0.04,
  clear: T.pull + 0.12,
  swim0: T.and,
  lens0: T.itEnd + 0.2,
  end: DUR,
};

/** the tail tip's route coordinate: it LEADS the whole way (monotone except the rewind, which plays the escape back) */
const sigOpen = (t: number) => S + OPEN_OUT + 0.55 * Math.min(1, Math.max(0, t) / 4.9) + 0.35 * Math.sin(t * 2.1);
const sigKeys = mono([
  [EV.rew1, -0.6], [T.stomach, -0.5], [EV.back0, -0.35],
  [T.backing + 0.25, 1.6], [T.its, 4.6], [T.slides + 0.25, 8.6], [EV.throat, S_THROAT],
  [T.slips + 0.25, S_THROAT + 1.6], [EV.slit, S_SLIT + 0.4], [EV.chamber, S_CHAMBER + 0.9], [EV.poke, S + 0.4],
  [T.side, S + 5.5], [EV.cutHold1, S + 9.5], [EV.restore1, S + OPEN_OUT - 3.0], [EV.restore1 + 0.3, S + OPEN_OUT + 0.6],
  [T.body, S + 26], [T.follows, S + 38], [EV.follow1, S + L - 5.5], [EV.headAt, S + L - 1.9],
]);
export const HEAD_CAUGHT = S + L - 1.75; // the snout 1.75 u inside the gill opening: the eye just behind the cover's edge
const sigTip = (t: number) => {
  if (t < EV.rew0) return sigOpen(t);
  if (t < EV.rew1) {
    // the rewind: the escape played backward, fast, along the same route
    const u = ss5(t, EV.rew0, EV.rew1);
    return lerp(sigOpen(EV.rew0), -0.6, u);
  }
  if (t < EV.headAt) return sigKeys(t);
  // the head is caught: the snout stays just inside the opening (forward strain only, never back inside), then it
  // comes free on "pull"
  if (t < EV.release - 0.14) return lerp(S + L - 1.9, HEAD_CAUGHT, ss(t, EV.headAt, EV.headAt + 0.6)) + 0.12 * ss(t, EV.tug0, EV.release - 0.14);
  return lerp(HEAD_CAUGHT + 0.12, S + L, ss(t, EV.release - 0.14, EV.release));
};

// ---------------------------------------------------------------- the gill cover's breathing and the opening flex
/** gill cover flare: 0 closed, 1 fully open. One full beat in the first half-second, then calm breathing */
export const gillAt = (t: number) => {
  const rest = 0.16;
  if (t >= -0.25 && t < EV.beat1) {
    // a sharp beat: open to full, close again
    const u = clamp((t + 0.25) / (EV.beat1 + 0.25));
    return rest + (1 - rest) * Math.pow(Math.sin(Math.PI * u), 1.6);
  }
  const P = 1.05;
  const ph = (t - EV.beat1) / P;
  let g = rest + 0.42 * Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * ph), 1.3);
  // the struggle at the gill: the cover is lifted while the eel works its head out, and flutters after the release
  g += 0.3 * ss(t, EV.headAt, EV.headAt + 0.5) * (1 - ss(t, EV.release, EV.release + 0.25));
  g += 0.25 * Math.exp(-Math.max(0, t - EV.release) / 0.35) * (t > EV.release ? 1 : 0) * Math.abs(Math.sin((t - EV.release) * 16));
  return clamp(g);
};
const gillVel = (t: number) => (gillAt(t + 0.01) - gillAt(t - 0.01)) / 0.02;

// ---------------------------------------------------------------- outside rod curvature
const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));
const EXIT_BEND = (-58 * Math.PI) / 180 - EXIT_TANGENT; // turn from the chamber's direction up to the exit angle
const kOut = (a: number, lo: number, t: number) => {
  // the body turns out from under the cover (fixed in space: the tail follows its tip through it)
  let k = (EXIT_BEND * Math.PI) / (2 * 2.6) * bump(a / 2.6);
  // a gentle arc back over the fish, building into an arch as more of the body comes out
  k += 0.022 + 0.04 * ss(lo, 16, 44) * ss(a, 6, 20);
  // the tail's own flexing: a wave that grows toward the tip; in the opening it flexes against the gill beat
  const tipW = clamp(a / Math.max(6, lo));
  const live = t < EV.rew0 ? 1 : 0.8;
  // an eel's travelling S-wave, strongest toward the tip (the free tail is clearly a separate, moving animal)
  k += live * 0.105 * Math.pow(tipW, 0.7) * Math.sin((2 * Math.PI * a) / 13 - 2 * Math.PI * 1.15 * t);
  // while only the tail is out it leans back over the fish's back
  k += 0.028 * (1 - ss(lo, 24, 34)) * ss(a, 3, 9);
  if (t < EV.rew0 + 0.1) k += -0.075 * (gillAt(t - 0.05 - a * 0.012) - 0.16) * bump((a - 1.5) / 9) * 1.7;
  // the curl outside the fish, tightening on "curls … outside the fish"; the strongest just before the pull
  const c = ss(t, EV.curl0, EV.curl1) * (1 + 0.2 * ss(t, EV.tug0, EV.release)) ;
  k += c * 0.145 * ss(a, 6, 14);
  return k;
};
const wiggle = (u: number, sig: number, t: number) => {
  // inside: a small lateral undulation, larger in the roomy stomach than in the tract; active while it backs up
  const room = sig < 0 ? 0.42 : sig < S_THROAT ? 0.12 : 0.06;
  const active = 0.35 + 0.65 * ss(t, EV.back0 - 0.4, EV.back0 + 0.3);
  return room * active * Math.sin(2 * Math.PI * (u * 3.2 + 1.6 * t));
};

// ---------------------------------------------------------------- free mode: the release, the stroke, the swim
const relax = (t: number) => ss(t, EV.release + 0.05, EV.release + 1.05);
const kSwim = (u: number, t: number) =>
  // the wave calms as it nears the lens, so the departing tail is one clean band when it sweeps across
  (1 - 0.85 * ss(t, EV.lens0 - 0.35, EV.lens0 + 0.25)) * (0.035 + 0.11 * u) * Math.sin(2 * Math.PI * (u / 0.62 - 2.4 * (t - EV.release)));
// mid-body motion after the release: the coil pulls up and away from the gill as it straightens (both ends swing about
// mid-body), turning so the head leads up and to the right, clear of the fish; then a quick swim along that heading
export const SWIM_DIR = (-28 * Math.PI) / 180;
const M_AFTER = pt(-8.5, -27.5);
let REL0: {M: P; th: number} | null = null;
const rel0 = () => (REL0 ??= releaseMid(DRIVERS));
const angTo = (from: number, to: number) => {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
/** the swimmer's heading (snout direction): up and to the right, clear of the fish; at the end it turns up toward the
 *  lens, then its tail sweeps across the lens (pivotRot) */
export const headingAt = (t: number) => SWIM_DIR + ss(t, EV.lens0 - 0.55, EV.lens0 + 0.2) * ((-62 * Math.PI) / 180);
const swimSpeed = (t: number) => 15 * ss(t, EV.release + 0.5, EV.release + 1.3) + 9 * ss(t, EV.lens0 - 0.5, EV.lens0 + 0.3);
const SW_DT = 1 / 240;
const swimTable: P[] = (() => {
  const out: P[] = [];
  let x = 0, y = 0;
  const n = Math.ceil((DUR + 0.5 - EV.release) / SW_DT);
  for (let i = 0; i <= n; i++) {
    const t = EV.release + i * SW_DT;
    out.push(pt(x, y));
    const v = swimSpeed(t), h = headingAt(t);
    x += v * Math.cos(h) * SW_DT;
    y += v * Math.sin(h) * SW_DT;
  }
  return out;
})();
const swimOffset = (t: number) => swimTable[Math.min(swimTable.length - 1, Math.max(0, Math.round((t - EV.release) / SW_DT)))];
const freeMove = (t: number) => {
  const r = rel0();
  const u = ss5(t, EV.release - 0.02, EV.release + 1.0);
  const w = ss5(t, EV.release + 0.05, EV.release + 1.15);
  const dth = angTo(r.th, headingAt(t) + Math.PI) * w + (headingAt(t) - SWIM_DIR) * (1 - w);
  const so = swimOffset(t);
  return {d: pt((M_AFTER.x - r.M.x) * u + so.x, (M_AFTER.y - r.M.y) * u + so.y), dth};
};
/** the lens pass: how far the eel has come toward the lens (fraction of the camera distance; its layer z = -lens·d) */
export const SWEEP0 = DUR - 0.5;
export const LENS = {near: 0.85, end: 0.935, r1: 40, r2: 28};
export const lensAt = (t: number) => LENS.near * ss(t, EV.lens0 - 0.4, SWEEP0) + (LENS.end - LENS.near) * ss(t, SWEEP0, DUR);
/** the departing tail's stroke past the lens: the body (vertical, its head already above the frame) swings out just past
 *  the right edge, then sweeps right to left across the whole frame; a sideways shift keeps the band upright, so every
 *  height clears the edges together (no dead frames) */
export const SWEEP = {out: 7.4, back: 5.2, outT: 0.2};
const pivotRot = (_t: number) => 0;
const sweepShift = (t: number) => {
  const outU = ss(t, SWEEP0 - SWEEP.outT, SWEEP0);
  // the sweep back: quick from the start (a cubic ease-out), still moving at the loop point
  const u = clamp((t - SWEEP0) / (DUR + 0.06 - SWEEP0));
  const back = 1 - Math.pow(1 - u, 2.2);
  return pt(SWEEP.out * outU - (SWEEP.out + SWEEP.back) * (t > SWEEP0 ? back : 0), 0);
};

export const DRIVERS: Drivers = {
  sigTip, kOut, wiggle, tRelease: EV.release, relax, kSwim, freeMove,
  outZ: (t) => 6.9,
  pivotRot,
  sweepShift,
};
export const eelAt = (t: number): EelPose => eelPose(t, DRIVERS);
/** the same eel without the final stroke's rotation (the camera follows this, so the stroke itself crosses the frame) */
const DRIVERS_STEADY: Drivers = {...DRIVERS, pivotRot: () => 0, sweepShift: () => pt(0, 0)};

// ---------------------------------------------------------------- the fish's state
export type FishState = {
  gill: number;
  /** the skin's see-through amount along the eel (the reveal) and over the whole body */
  reveal: number;
  revealSig: number;
  translucent: number;
  xray: number;
  /** the cutaway window over the gills (0 closed .. 1 open) and the camera's yaw (radians) */
  cut: number;
  yaw: number;
  /** pectoral and other fin phase, and a startle after the release */
  finPhase: number;
  startle: number;
};
export const fishAt = (t: number): FishState => {
  const pose = (t >= EV.reveal0 && t < EV.rew1 + 0.5) ? eelAt(Math.min(t, EV.rew0)) : null;
  const headSig = pose ? pose.sigTip - EEL_L : 0;
  const translucent = ss(t, EV.reveal1 - 0.45, EV.reveal1 + 0.15) * (1 - ss(t, EV.cut0, EV.cut1));
  return {
    gill: gillAt(t),
    reveal: ss(t, EV.reveal0 - 0.05, EV.reveal0 + 0.3) * (1 - ss(t, EV.cut0, EV.cut1)),
    revealSig: lerp(S, headSig - 4, ss(t, EV.reveal0, EV.reveal1)),
    translucent,
    xray: ss(t, EV.xray0, EV.xray1) * (1 - ss(t, EV.cut0, EV.cut1)),
    cut: ss(t, EV.cut0, EV.cut1) * (1 - ss(t, EV.cutHold1, EV.restore1)),
    yaw: ((22 * Math.PI) / 180) * ss5(t, EV.cut0 + 0.2, EV.cut1 + 0.2) * (1 - ss5(t, EV.cutHold1 - 0.05, EV.restore1)),
    finPhase: t * 2 * Math.PI * 0.8,
    startle: Math.exp(-Math.max(0, t - EV.release) / 0.5) * (t > EV.release ? 1 : 0),
  };
};

// ---------------------------------------------------------------- the camera
export const CAM_A: Cam = {x: -30, y: -6, w: 44};
const C = (x: number, y: number, w: number): Cam => ({x, y, w});
const CAM_KEYS: Key[] = [
  [EV.reveal0 - 0.1, CAM_A],
  [EV.reveal1 + 0.3, C(-13.5, 1.0, 64), travel],
  [EV.rew1, C(-11.5, 2.0, 54), travel],
  [EV.back0 + 0.9, C(-12.0, 2.0, 51), travel],
  [T.slides + 0.5, C(-20.0, 1.0, 40), travel],
  [EV.throat + 0.15, C(-24.0, -2.0, 50), travel],
  [EV.cut1 + 0.2, C(-28.5, -3.0, 40), travel],
  [EV.cutHold1, C(-28.0, -3.6, 39), travel],
  [EV.restore1, CAM_A, travel],
  [EV.follow1, C(-21.0, -13.0, 66), travel],
  [T.comes, C(-21.0, -10.5, 50), travel],
  [T.lastEnd + 0.1, C(-22.5, -9.0, 40), travel],
  [EV.curl1, C(-19.5, -13.0, 54), travel],
  [EV.release + 0.2, C(-19.5, -13.5, 56), travel],
];
const CAM_SWIM: Cam = {x: -10, y: -16, w: 82};
export const camAt = (t: number): Cam => {
  const base = glide(t, [...CAM_KEYS, [EV.lens0 - 0.7, CAM_SWIM, travel]]);
  if (t < EV.lens0 - 0.7) return base;
  // the lens pass: the camera eases onto the approaching eel (its mid-body, a little right of centre)
  const e = eelPose(t, DRIVERS_STEADY);
  const m = e.pts[Math.round(e.pts.length * 0.42)];
  const k = ss(t, EV.lens0 - 0.7, EV.lens0 + 0.1);
  return {x: lerp(base.x, m.x, k), y: lerp(base.y, m.y, k), w: base.w};
};

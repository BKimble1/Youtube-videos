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

/** the visual clock for cyclic motion (drifting motes, fins, breathing, the tail's own flex). It runs BACKWARD through
 *  the rewind, so the rewind reads as time played in reverse, then carries on (offset) without a jump */
export const visT = (t: number) => (t < EV.rew0 ? t : t < EV.rew1 ? 2 * EV.rew0 - t : t - 2 * (EV.rew1 - EV.rew0));
/** a trapezoid-velocity ramp 0→1 (constant speed, short accelerations at the ends): a mechanical, scrubbed move */
const trap = (x: number, e = 0.12) => {
  const u = clamp(x), v = 1 / (1 - e);
  if (u < e) return (v * u * u) / (2 * e);
  if (u < 1 - e) return v * (u - e / 2);
  return 1 - (v * (1 - u) * (1 - u)) / (2 * e);
};

/** the tail tip's route coordinate: it LEADS the whole way (monotone except the rewind, which plays the escape back) */
const sigOpen = (t: number) => S + OPEN_OUT + 0.55 * Math.min(1, Math.max(0, t) / 4.9) + 0.35 * Math.sin(t * 2.1);
const sigKeys = mono([
  [EV.rew1, -0.6], [T.stomach, -0.5], [EV.back0, -0.35],
  [T.backing + 0.15, 2.8], [T.up, 5.4], [T.its, 7.6], [T.slides + 0.25, 10.6], [EV.throat, S_THROAT],
  [T.slips + 0.25, S_THROAT + 1.6], [EV.slit, S_SLIT + 0.4], [EV.chamber, S_CHAMBER + 0.9], [EV.poke, S + 0.4],
  [T.side, S + 5.5], [EV.cutHold1, S + 9.5], [EV.restore1, S + OPEN_OUT - 1.5], [EV.restore1 + 0.38, S + OPEN_OUT + 0.3],
  [T.body, S + 26], [T.follows, S + 38], [EV.follow1, S + L - 5.5], [EV.headAt, S + L - 1.9],
]);
export const HEAD_CAUGHT = S + L - 1.75; // the snout 1.75 u inside the gill opening: the eye just behind the cover's edge
const sigTip = (t: number) => {
  if (t < EV.rew0) return sigOpen(t);
  if (t < EV.rew1) {
    // the rewind: the escape played backward, fast, along the same route
    const u = trap((t - EV.rew0) / (EV.rew1 - EV.rew0));
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
  const ph = (visT(t) - EV.beat1) / P;
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
  k += 0.022 + 0.062 * ss(lo, 16, 44) * ss(a, 6, 20);
  // the tail's own flexing: a wave that grows toward the tip; in the opening it flexes against the gill beat
  const tipW = clamp(a / Math.max(6, lo));
  const live = t < EV.rew0 ? 1 : 0.8;
  // an eel's travelling S-wave, strongest toward the tip (the free tail is clearly a separate, moving animal)
  k += live * 0.105 * Math.pow(tipW, 0.7) * Math.sin((2 * Math.PI * a) / 13 - 2 * Math.PI * 1.15 * visT(t));
  // while only the tail is out it leans back over the fish's back
  k += 0.004 * (1 - ss(lo, 24, 34)) * ss(a, 3, 9);
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
  return room * active * Math.sin(2 * Math.PI * (u * 3.2 + 1.6 * visT(t)));
};

// ---------------------------------------------------------------- free mode: the release, the stroke, the swim
const relax = (t: number) => ss(t, EV.release + 0.05, EV.release + 1.05);
// the tail's stroke grows in as it swims clear (so the tail never flops back over the fish while it straightens)
const kSwim = (u: number, t: number) => (0.035 + 0.11 * u * (0.35 + 0.65 * ss(t, EV.swim0 + 0.2, EV.swim0 + 0.8))) * Math.sin(2 * Math.PI * (u / 0.62 - 2.4 * (t - EV.release)));
// mid-body motion after the release: the coil pulls up and away from the gill as it straightens (both ends swing about
// mid-body), turning so the head leads up and to the right, clear of the fish; then a quick swim along that heading
export const SWIM_DIR = (-62 * Math.PI) / 180;
const M_AFTER = pt(-8.5, -34.5);
let REL0: {M: P; th: number} | null = null;
const rel0 = () => (REL0 ??= releaseMid(DRIVERS));
const angTo = (from: number, to: number) => {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
/** the swimmer's heading (snout direction): up and to the right, clear of the fish, out of the frame */
export const headingAt = (_t: number) => SWIM_DIR;
const swimSpeed = (t: number) => 15 * ss(t, EV.release + 0.3, EV.release + 0.9) + 12 * ss(t, EV.swim0 + 0.9, EV.swim0 + 1.6);
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
export const DRIVERS: Drivers = {
  sigTip, kOut, wiggle, tRelease: EV.release, relax, kSwim, freeMove,
  outZ: (t) => 6.9,
  pivotRot: () => 0,
  sweepShift: () => pt(0, 0),
};
export const eelAt = (t: number): EelPose => eelPose(t, DRIVERS);

// ---------------------------------------------------------------- the fish's state
export type FishState = {
  gill: number;
  /** the skin's see-through amount along the eel (the reveal) and over the whole body */
  reveal: number;
  revealSig: number;
  translucent: number;
  xray: number;
  /** the cutaway window over the gills (0 closed .. 1 open), its opening size and its closing fade, and the yaw */
  cut: number;
  cutOpen: number;
  cutClose: number;
  yaw: number;
  /** pectoral and other fin phase, and a startle after the release */
  finPhase: number;
  startle: number;
};
export const fishAt = (t: number): FishState => {
  const pose = (t >= EV.reveal0 && t < EV.rew1 + 0.5) ? eelAt(Math.min(t, EV.rew0)) : null;
  const headSig = pose ? pose.sigTip - EEL_L : 0;
  // the skin stays see-through (a little less) around the cutaway window, so the whole eel shows at once: its head in the
  // stomach, the body in the throat, the slit, the exit and the tail outside; it turns opaque as the window closes
  const translucent = ss(t, EV.reveal1 - 0.45, EV.reveal1 + 0.15) * (1 - ss(t, EV.cutHold1, EV.restore1));
  return {
    gill: gillAt(t),
    reveal: ss(t, EV.reveal0 - 0.05, EV.reveal0 + 0.3) * (1 - ss(t, EV.cut0, EV.cut1)),
    revealSig: lerp(S, headSig - 4, ss(t, EV.reveal0, EV.reveal1)),
    translucent,
    xray: ss(t, EV.xray0, EV.xray1) * (1 - ss(t, EV.cut0, EV.cut1)),
    cut: ss(t, EV.cut0, EV.cut1) * (1 - ss(t, EV.cutHold1, EV.restore1)),
    cutOpen: ss(t, EV.cut0, EV.cut1),
    cutClose: ss(t, EV.cutHold1, EV.restore1),
    yaw: ((14 * Math.PI) / 180) * ss5(t, EV.cut0 + 0.2, EV.cut1 + 0.2) * (1 - ss5(t, EV.cutHold1 - 0.05, EV.restore1)),
    finPhase: visT(t) * 2 * Math.PI * 0.8,
    startle: Math.exp(-Math.max(0, t - EV.release) / 0.5) * (t > EV.release ? 1 : 0),
  };
};

// ---------------------------------------------------------------- the camera
// ---------------------------------------------------------------- the departing tail's sweep across the lens
/** after the eel has swum out of frame, its tail passes close in front of the lens once, right to left (a big blurred
 *  band), and the region it has crossed shows frame 0: the loop. Depth as a fraction of the camera distance. */
export const SWEEP0 = DUR - 0.52;
export const LENS = {depth: 0.75};
export const CAM_A: Cam = {x: -29.3, y: -6.2, w: 47};
const C = (x: number, y: number, w: number): Cam => ({x, y, w});
const CAM_KEYS: Key[] = [
  [EV.reveal0 - 0.1, CAM_A],
  [EV.reveal1 + 0.3, C(-13.5, 1.0, 64), travel],
  // "Inside the fish's stomach": the stomach and the route to the throat; push in as it starts backing up
  [EV.rew1, C(-11.5, 2.0, 54), travel],
  [EV.back0 + 0.35, C(-15.0, 1.5, 44), travel],
  // follow the leading tip up the throat, then widen before it reaches the gills
  [T.slides + 0.5, C(-21.0, 1.0, 38), travel],
  [EV.throat + 0.15, C(-24.0, -2.0, 50), travel],
  // the exit: in on the slit for "slips through a gap", along the chamber to the cover, then out to the whole eel
  [T.gap, C(-29.5, -2.5, 36), travel],
  [EV.chamber + 0.2, C(-28.0, -3.5, 40), travel],
  [T.side + 0.05, C(-19.0, -1.5, 56), travel],
  // the exterior is restored around it: the opening composition, held, then the body follows
  [EV.restore1, CAM_A, travel],
  [EV.restore1 + 0.38, CAM_A, travel],
  [EV.follow1, C(-18.0, -12.0, 62), travel],
  // the head is the last part caught: its eye at the gill and the whole free body in view
  [T.comes, C(-18.5, -11.5, 56), travel],
  [T.lastEnd + 0.1, C(-18.4, -11.0, 54), travel],
  [EV.curl1, C(-19.5, -13.0, 54), travel],
  [EV.release + 0.2, C(-21.0, -17.0, 62), travel],
  // it swims clear, up and away, the predator below in frame all along; ONE smooth move then settles on the opening
  // camera (the predator alive and upright), so the tail's sweep past the lens reveals frame 0 on an identical fish
  [SWEEP0 - 0.3, CAM_A, travel],
];
export const camAt = (t: number): Cam => glide(t, CAM_KEYS);

/** the band's screen x (px) of its centre line at the frame's middle height: from past the right edge to past the left */
export const sweepX = (t: number) => {
  const u = clamp((t - SWEEP0) / (DUR + 0.05 - SWEEP0));
  // quick from the start and still moving at the loop point (it carries straight into the opening's tail flick)
  const e = 0.25 * u + 0.75 * (1 - Math.pow(1 - u, 1.8));
  return lerp(1080 + 240, -520, e);
};
/** @deprecated the lens pass is now a screen-space sweep (sweepX); kept for the module test entries */
export const lensAt = (_t: number) => 0;

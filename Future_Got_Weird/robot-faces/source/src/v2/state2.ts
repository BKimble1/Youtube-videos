// V2 expression states. Same rule as V1 (state.ts): one state per character, a pure function of the absolute frame,
// sampled by every shot. V2 keeps V1's states where the beat is unchanged and replaces them where the staging
// changed: the opening exchange (re-phased so the cue, the robot's response and the shared smile each land on their
// own words and cuts), the mirror's first seconds, the listener in the distinction, the callback. The robot's yaw in
// these states is its heading in its own set; a shot may present a different camera angle on it (see shots2).
import {Expr} from '../dc/Head';
import {clamp, smooth} from '../dc/math';
import {RobotState} from '../art/Robot';
import {mixExpr, VX} from '../art/Visitor';
import {FPS, T} from '../lib/core';
import {robotAt, visitorAt, K, SPEECH} from '../state';
import {robotVis, Track} from '../lib/visemes';

const ss = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a)));
const blinkAt = (t: number, times: number[], dur = 0.2) => {
  let b = 0;
  for (const t0 of times) {
    const u = (t - t0) / dur;
    if (u > 0 && u < 1) b = Math.max(b, u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65);
  }
  return b;
};

export const END = 6400 / FPS; // 213.333 s: 1.6 s after the last word ends (the V2 narration master)

/** V2 opening exchange from t0: the visitor's cue is already rising at t0 (about 30 % at frame 0), his smile follows;
 *  the robot starts once the cue is visible ("watches for a smile before it fully appears") and arrives with him */
export const exchange2 = (t: number, t0: number) => ({
  vc: ss(t, t0 - 1.2, t0 + 2.0),
  vs: ss(t, t0 + 2.4, t0 + 6.2),
  r: ss(t, t0 + 2.6, t0 + 6.7),
});

/** the callback's exchange: the same shapes as the opening, phased to its three shots (the visitor's cue is up on
 *  the cut, the robot's smile forms in its close-up, the visitor's reaction carries the last line) */
const cbExchange = (t: number) => ({vc: ss(t, K.again - 0.5, K.again + 1.3), vs: ss(t, K.again + 1.1, K.again + 3.5), r: ss(t, K.again + 1.5, K.again + 3.4)});
const OPEN_END = K.columbia; // the V2 opening (lab + mirror) runs to "At Columbia"
const CB = K.again; // the callback restarts the opening exchange on "Watch the smile again."

export const rob2 = (f: number): RobotState => {
  const t = f / FPS;
  const st = robotAt(f);
  if (t < OPEN_END) {
    const blink = blinkAt(t, [1.1, 7.0, 11.0, 15.3]);
    const e = exchange2(t, 0);
    let smile = 0.04 + 0.92 * e.r;
    // "That takes more than moving the corners": in the cheek section the corner relaxes and lifts again, so the
    // servo, rod and corner can be seen working together
    smile -= 0.5 * (ss(t, K.corner + 0.7, K.corner + 1.4) - ss(t, K.corner + 1.6, K.corner + 2.5));
    const lab = t < T('Researchers');
    st.blink = blink;
    st.lid = 0.16;
    st.brow = 0;
    st.asym = 0;
    st.pull = undefined;
    if (lab) {
      st.yaw = 40 + 2 * ss(t, 0.2, 2.0);
      st.gx = 0.6;
      st.gy = -0.05;
      st.smile = smile;
      st.open = 0.04 * e.r;
      st.round = 0;
      st.press = 0;
      st.wide = 0;
    } else {
      // at the mirror: the smile carried over from the exchange relaxes, then small test movements while it watches
      st.yaw = 152;
      st.gx = 0;
      st.gy = 0;
      st.smile = smile * (1 - ss(t, T('Researchers') + 0.1, T('Researchers') + 1.1));
      st.open = 0;
      st.round = 0;
      st.press = 0;
      st.wide = 0;
      // "to study their own movements": a lopsided test (one corner, a brow), then back
      const m1 = ss(t, K.mirrorCut + 0.1, K.mirrorCut + 0.45) - ss(t, K.mirrorCut + 1.0, K.mirrorCut + 1.35);
      st.asym = 0.7 * m1;
      st.brow = 0.6 * m1;
      st.smile += 0.25 * m1;
      // "copy human lips": an open, then a rounding; "predict an expression as it begins": the corners start to rise
      st.open = 0.32 * (ss(t, T('copy human') - 0.1, T('copy human') + 0.3) - ss(t, T('lips,') + 0.05, T('lips,') + 0.45));
      st.round = 0.6 * (ss(t, T('lips,') - 0.1, T('lips,') + 0.2) - ss(t, T('lips,') + 0.35, T('lips,') + 0.7));
      st.smile += 0.45 * (ss(t, T('predict an') - 0.1, T('expression as') + 0.25) - ss(t, T('begins.') + 0.2, T('begins.') + 0.9));
      // "And the place to start was a mirror.": it holds still and looks
      st.gy = 0;
    }
    return st;
  }
  if (t >= CB) {
    const e = cbExchange(t);
    st.yaw = 40 + 2 * ss(t, CB + 0.2, CB + 2.0);
    st.gx = 0.6;
    st.gy = -0.05;
    st.smile = 0.04 + 0.92 * e.r;
    st.open = 0.04 * e.r;
    st.round = 0;
    st.press = 0;
    st.wide = 0;
    st.asym = 0;
    st.brow = 0;
    st.blink = blinkAt(t, [CB + 1.1, CB + 4.6]);
    return st;
  }
  // no blink on the cut into the notebook insert
  if (t > 204.3 && t < 205.0) st.blink = 0;
  // the song's narrowed eyes ease in and out (V1 switched the lid in one frame)
  if (t >= K.song && t < K.distinction) st.lid = 0.16 + 0.14 * ss(t, K.song + 0.2, K.song + 0.5) * (1 - ss(t, K.languages - 0.15, K.languages + 0.15));
  // the one followed example (training): speech audio drives the lips through the motors, from "drive"
  if (t >= K.speechAudio && t < K.result) {
    const on = ss(t, K.speechAudio + 0.5, K.speechAudio + 0.8);
    const v = robotVis(sampleT(t), SAMPLE, 0.06);
    st.yaw = 0;
    st.gx = 0;
    st.gy = 0.05;
    st.smile = v.smile * on;
    st.open = v.open * on;
    st.round = v.round * on;
    st.press = v.press * on;
    st.wide = v.wide * on;
    return st;
  }
  // "The movements still had flaws.": it is still speaking as the line begins, then stops
  if (t >= K.flaws && t < T('The team reported')) {
    const on = 1 - ss(t, T('had flaws.') - 0.1, T('had flaws.') + 0.3);
    const v = robotVis(t, SPEECH(K.distinction - 0.5, K.flaws + 2, 17), 0.06);
    st.open = v.open * on + st.open * (1 - on);
    st.round = v.round * on + st.round * (1 - on);
    st.press = v.press * on + st.press * (1 - on);
    st.wide = v.wide * on;
    st.smile = v.smile * on;
    return st;
  }
  // "difficulties with sounds like": a first try at "ba" (the closure leaves the same gap), before the labelled "B"
  if (t >= FIRST_BA - 0.3 && t < FIRST_BA + 0.9) {
    const b = ss(t, FIRST_BA - 0.1, FIRST_BA + 0.06) * (1 - ss(t, FIRST_BA + 0.16, FIRST_BA + 0.26));
    const a = ss(t, FIRST_BA + 0.16, FIRST_BA + 0.28) * (1 - ss(t, FIRST_BA + 0.42, FIRST_BA + 0.6));
    st.press = Math.max(st.press, 0.55 * b);
    st.open = Math.max(st.open, 0.075 * b + 0.5 * a);
    return st;
  }
  // "Another translated the expression into movements the robot could make.": one translated movement (a smile begun
  // and released) while its corner motor is shown
  if (t >= K.another2 && t < K.ms840) {
    st.smile += 0.55 * (ss(t, K.another2 + 0.7, K.another2 + 1.5) - ss(t, K.another2 + 2.4, K.ms840 - 0.1));
    return st;
  }
  // the study nook: it looks down at the open workbook, then "A machine looks toward you."
  if (t >= K.picture && t < T('Its mouth follows')) {
    const lk = ss(t, T('A machine looks') + 0.1, T('toward you.') + 0.1);
    st.yaw = 16 + 26 * lk;
    st.gx = -0.2 + 0.8 * lk;
    st.gy = 0.35 * (1 - lk) - 0.05 * lk;
    return st;
  }
  return st;
};

/** the one speech example followed through training (a deterministic syllable track, looped), shown as a human
 *  source mouth, as its sound trace, as the matching robot image and finally driving the robot's lips */
/** the first "ba" in the B/W comparison (on "difficulties") */
export const FIRST_BA = T('difficulties') + 0.05;
export const SAMPLE: Track = SPEECH(0, 3.0, 9);
export const SAMPLE_T0 = T('The important');
export const sampleT = (t: number) => (((t - SAMPLE_T0) % 3.4) + 3.4) % 3.4;

export const vis2 = (f: number): {expr: Expr; blink: number} => {
  const t = f / FPS;
  if (t < OPEN_END) {
    const e = exchange2(t, 0);
    return {expr: mixExpr(mixExpr(VX.rest, VX.cue, e.vc), VX.smile, e.vs), blink: blinkAt(t, [0.75, 5.0, 9.2])};
  }
  if (t >= CB) {
    const e = cbExchange(t);
    let x = mixExpr(mixExpr(VX.rest, VX.cue, e.vc), VX.smile, e.vs);
    // "You're the one deciding what it means.": the warm smile settles into a knowing one (eyes narrow, a small
    // tilt of the brows, the smile kept but closed)
    x = mixExpr(x, KNOWING, ss(t, K.deciding + 0.2, K.deciding + 1.6));
    return {expr: x, blink: blinkAt(t, [CB + 0.9, K.deciding - 0.15])};
  }
  const v = visitorAt(f);
  // the distinction: he listens (rest), then a small questioning brow on "understanding what you are saying"
  if (t >= K.distinction && t < K.flaws) {
    const q = ss(t, T('understanding') - 0.1, T('understanding') + 0.6) * (1 - ss(t, K.flaws - 0.5, K.flaws));
    return {expr: mixExpr(v.expr, QUERY, q), blink: blinkAt(t, [116.4, 120.5])};
  }
  // the flaws: he notices the small error (eyes narrow a little, gaze down to the mouth)
  if (t >= K.flaws && t < K.another) {
    const n = ss(t, T('easy to notice') - 0.2, T('easy to notice') + 0.4) * (1 - ss(t, K.another - 0.6, K.another));
    return {expr: mixExpr(v.expr, NOTICE, n), blink: blinkAt(t, [124.0, 128.0])};
  }
  return v;
};

const KNOWING: Expr = {...VX.smile, smile: 0.78, open: 0.04, teeth: 0.1, wide: 1.06, lid: 0.3, squint: 0.4, browIn: 0.22, gx: -0.55, gy: 0.02, flush: 0.4};
const QUERY: Expr = {...VX.rest, browIn: 0.45, lid: 0.1, smile: 0.08, gx: -0.7, gy: 0.05};
const NOTICE: Expr = {...VX.rest, lid: 0.3, squint: 0.25, browIn: 0.3, smile: 0.05, gx: -0.7, gy: 0.35};
export {ss, blinkAt};

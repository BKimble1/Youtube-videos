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
  r: ss(t, t0 + 3.9, t0 + 6.5),
});

/** the callback's exchange: the same shapes as the opening, phased to its three shots (the visitor's cue is up on
 *  the cut, the robot's smile forms in its close-up, the visitor's reaction carries the last line) */
const cbExchange = (t: number) => ({vc: ss(t, K.again - 0.5, K.again + 1.3), vs: ss(t, K.again + 1.1, K.again + 3.5), r: ss(t, K.again + 1.5, K.again + 3.4)});
const OPEN_END = K.columbia; // the V2 opening (lab + mirror) runs to "At Columbia"
const CB = K.again; // the callback restarts the opening exchange on "Watch the smile again."

/** keyed expression sequence: each key blends in over `w` seconds and holds until the next */
const keyed = (t: number, ks: [number, Partial<RobotState>][], w = 0.14): Partial<RobotState> => {
  const o: Record<string, number> = {smile: 0, open: 0, round: 0, press: 0, wide: 0, asym: 0, brow: 0};
  for (const [t0, v] of ks) {
    const k = ss(t, t0 - w / 2, t0 + w / 2);
    if (k <= 0) continue;
    for (const key of Object.keys(o)) o[key] = o[key] + (((v as any)[key] ?? 0) - o[key]) * k;
  }
  return o as Partial<RobotState>;
};
const applyMouth = (st: RobotState, v: Partial<RobotState>, k = 1) => {
  (['smile', 'open', 'round', 'press', 'wide', 'asym', 'brow'] as const).forEach((key) => ((st as any)[key] = (st as any)[key] * (1 - k) + ((v as any)[key] ?? 0) * k));
};

/** frame 0: the robot's mouth is already moving (silent shapes, not the narration), eyes on the camera */
export const OPEN_TRACK: Track = [[-1, 'N'], [0, 'O'], [0.3, 'E'], [0.54, 'B'], [0.72, 'A'], [1.0, 'W'], [1.26, 'E'], [1.52, 'rest']];
/** "copy human lips": the person's shapes, then the robot's copy of them 0.62 s later */
export const LIPS_H: Track = [[0, 'rest'], [T('copy human') + 0.03, 'B'], [T('copy human') + 0.16, 'A'], [T('copy human') + 0.3, 'W'], [T('copy human') + 0.44, 'E'], [T('copy human') + 0.56, 'rest']];
export const COPY_DT = 0.62;
/** the stiff traditional face (the contrast on "That takes more than moving the corners of a mouth") */
export const OLDBOT = {grinOn: K.corner + 0.32, grinOff: K.corner + 1.05};
/** "predict an expression as it begins": the visitor's cue starts, the robot's smile starts before his is visible */
export const PRED = {cue: T('predict an') + 0.05, robot: T('predict an') + 0.45, visible: T('expression as') + 0.25, full: T('begins.') + 0.3};
/** the ending: its last lip movement opens into the shape it had on frame 0 (the loop) */
export const END_TRACK: Track = [[0, 'rest'], [END - 1.15, 'B'], [END - 0.78, 'O']];

export const rob2 = (f: number): RobotState => {
  const t = f / FPS;
  const st = robotAt(f);
  if (t < OPEN_END) {
    st.blink = blinkAt(t, [2.15, 7.0, 11.0, 15.25, 19.4]);
    st.lid = 0.16;
    st.brow = 0;
    st.asym = 0;
    st.pull = undefined;
    st.round = 0;
    st.press = 0;
    st.wide = 0;
    st.open = 0;
    const e = exchange2(t, 0);
    // the response smile, then (offscreen, during the stiff face) a relax, then the full lift in its close-up
    let smile = 0.04 + 0.92 * e.r;
    smile -= 0.62 * (ss(t, K.corner + 0.3, K.corner + 1.4) - ss(t, K.corner + 2.05, K.corner + 2.65));
    if (t < T('smile before')) {
      // the opening shapes, eyes on the camera (until the cut to the pair)
      st.smile = smile;
      const v = robotVis(t, OPEN_TRACK, 0.08);
      const k = 1 - ss(t, 1.45, 1.75);
      applyMouth(st, v, k);
      st.smile = Math.max(st.smile, 0.04);
      st.yaw = 0;
      st.gx = 0;
      st.gy = 0;
      return st;
    }
    if (t < T('Researchers')) {
      st.yaw = 40;
      st.gx = 0.6;
      // the gaze dips to his mouth as his cue forms, then back to his eyes
      st.gy = -0.05 + 0.32 * (ss(t, 2.3, 2.6) - ss(t, 3.2, 3.5));
      st.smile = smile;
      st.open = 0.04 * e.r;
      return st;
    }
    // at the mirror
    st.yaw = 152;
    st.gx = 0;
    st.gy = 0;
    st.smile = smile * (1 - ss(t, T('Researchers') + 0.1, T('Researchers') + 1.0));
    // "to study their own movements": several distinct tests in quick succession
    const m = K.mirrorCut;
    const tests = keyed(t, [
      [m + 0.06, {asym: 0.75, brow: 0.6, smile: 0.25}],
      [m + 0.42, {round: 0.9, open: 0.3, brow: 0.2}],
      [m + 0.78, {smile: 0.95, wide: 0.45, open: 0.06}],
      [m + 1.12, {press: 0.9, brow: -0.5}],
      [m + 1.42, {}],
    ]);
    const tk = ss(t, m - 0.08, m + 0.04) * (1 - ss(t, m + 1.42, m + 1.52));
    applyMouth(st, tests, tk);
    // "copy human lips": the person's shapes, copied
    const ck = ss(t, T('copy human') + COPY_DT - 0.05, T('copy human') + COPY_DT + 0.05) * (1 - ss(t, PRED.cue - 0.05, PRED.cue + 0.1));
    if (ck > 0) applyMouth(st, robotVis(t - COPY_DT, LIPS_H, 0.06), ck);
    // "predict an expression as it begins": its smile starts before his is plainly visible
    st.smile += 0.85 * ss(t, PRED.robot, PRED.full) * (1 - ss(t, K.mirrorWord - 1.6, K.mirrorWord - 0.6));
    return st;
  }
  if (t >= CB) {
    // the ending, to the camera: the smile forms, softens, the brows lift a little, and the last lip movement opens
    // into the shape of frame 0
    const e = cbExchange(t);
    st.yaw = 0;
    st.gx = 0;
    st.gy = 0;
    st.round = 0;
    st.press = 0;
    st.wide = 0;
    st.asym = 0;
    st.smile = (0.04 + 0.92 * e.r) * (1 - 0.5 * ss(t, K.deciding + 0.3, K.deciding + 1.2));
    st.open = 0.04 * e.r;
    st.brow = 0.35 * ss(t, K.deciding + 0.9, K.deciding + 1.5);
    const lk = ss(t, END - 1.3, END - 1.1);
    if (lk > 0) applyMouth(st, {...robotVis(t, END_TRACK, 0.1), brow: st.brow, smile: Math.max(0.2, st.smile * 0.6)}, lk);
    st.blink = blinkAt(t, [CB + 0.9, K.deciding + 0.45]);
    return st;
  }
  // "create the shapes it needs.": the sections close and it makes distinct expressions, one after another
  if (t >= T('create the') && t < K.banana) {
    const c = T('create the');
    const ex = keyed(t, [
      [c + 0.12, {smile: 0.95, wide: 0.3}],
      [c + 0.55, {round: 0.95, open: 0.32}],
      [c + 0.95, {brow: 0.9, open: 0.45, wide: 0.2}],
      [c + 1.35, {press: 0.9, asym: 0.35, brow: -0.4}],
      [K.banana - 0.12, {}],
    ]);
    applyMouth(st, ex, 1);
    st.yaw = 0;
    st.gx = 0;
    st.gy = 0;
    return st;
  }
  // "So the robot practiced.": it turns to its reflection
  if (t >= K.practiced && t < T('It moved its face')) {
    st.yaw = 100 + 52 * ss(t, K.practiced + 0.1, K.practiced + 1.2);
    st.gx = 0.3 * (1 - ss(t, K.practiced + 0.1, K.practiced + 1.2));
    return st;
  }
  // "building a relationship between motor commands and the appearance they produced": a run of trials, each a
  // different expression, each looked at
  if (t >= T('building a relationship') && t < K.moveThese) {
    const b = T('building a relationship') + 0.15;
    const ex = keyed(t, MONTAGE.map(([d, v]) => [b + d, v] as [number, Partial<RobotState>]), 0.12);
    applyMouth(st, ex, 1);
    return st;
  }
  // the humanoid assistant: a still, attentive face while he reads it, then the well-timed smile ("a well-timed
  // response"), which relaxes as the camera arrives at the opening's framing (the cut that follows starts from rest)
  if (t >= K.question && t < CB) {
    st.smile = 0.1 + 0.77 * ss(t, T('a well-timed') - 0.1, T('response.') + 0.2) * (1 - ss(t, K.again - 0.95, K.again - 0.1));
    st.open = 0.03;
    st.round = 0;
    st.press = 0;
    st.wide = 0;
    st.yaw = 30;
    st.gx = 0.5;
    st.gy = 0;
    return st;
  }
  // no blink on the cut into the notebook insert
  if (t > 204.3 && t < 205.0) st.blink = 0;
  // the song's narrowed eyes ease in and out (V1 switched the lid in one frame)
  if (t >= K.song && t < K.distinction) st.lid = 0.16 + 0.14 * ss(t, K.song + 0.2, K.song + 0.5) * (1 - ss(t, K.languages - 0.15, K.languages + 0.15));
  // the one followed example (training): the robot attempts the same shapes ("the robot's model of its own face"),
  // then speech audio drives the lips through the motors
  if (t >= T('robot’s model') - 0.3 && t < K.result) {
    const on = t < K.speechAudio ? ss(t, T('robot’s model') - 0.3, T('robot’s model')) : 1;
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

/** the trial run at the mirror: offsets (s) and shapes */
export const MONTAGE: [number, Partial<RobotState>][] = [
  [0.0, {asym: -0.7, open: 0.2, brow: 0.3}],
  [0.6, {round: 0.9, open: 0.25}],
  [1.2, {smile: 0.9, wide: 0.4}],
  [1.8, {open: 0.5, brow: 0.8}],
  [2.4, {press: 0.9, smile: 0.2, asym: 0.4}],
  [3.0, {wide: 0.9, smile: 0.5, open: 0.1}],
  [3.55, {}],
];
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
    let x = mixExpr(mixExpr(VX.rest, VX.cue, e.vc), VX.smile, e.vs);
    // the stiff face's grin: his smile drops into a wary recoil, then settles
    x = mixExpr(x, VX.rest, ss(t, K.corner, K.corner + 0.6));
    x = mixExpr(x, WARY, ss(t, OLDBOT.grinOn + 0.35, OLDBOT.grinOn + 0.6) * (1 - ss(t, K.corner + 2.1, K.corner + 2.6)));
    // "predict an expression as it begins": a new cue, then the smile
    x = mixExpr(x, VX.cue, ss(t, PRED.cue, PRED.visible));
    x = mixExpr(x, VX.smile, ss(t, PRED.visible, PRED.full) * (1 - ss(t, K.mirrorWord, K.columbia)));
    return {expr: x, blink: blinkAt(t, [0.75, 5.0, 9.6, 16.2])};
  }
  if (t >= CB) {
    const e = cbExchange(t);
    let x = mixExpr(mixExpr(VX.rest, VX.cue, e.vc), VX.smile, e.vs);
    // "You're the one deciding what it means.": the warm smile settles into a knowing one (eyes narrow, a small
    // tilt of the brows, the smile kept but closed)
    x = mixExpr(x, KNOWING, ss(t, K.deciding + 0.2, K.deciding + 1.6));
    return {expr: x, blink: blinkAt(t, [CB + 0.9, K.learned + 0.6])};
  }
  const v = visitorAt(f);
  // "a very expensive sock puppet.": a deadpan look (one brow up, a flat half-smile)
  if (t >= T('puppet.') - 0.2 && t < K.follow + 0.3) {
    const d = ss(t, T('puppet.'), T('puppet.') + 0.25);
    return {expr: mixExpr(v.expr, DEADPAN, d), blink: blinkAt(t, [T('puppet.') + 0.55])};
  }
  // "The meaning of those words wasn't required": he listens to a language he doesn't know (puzzled)
  if (t >= K.meaning && t < K.distinction) {
    const q = ss(t, K.meaning + 0.2, K.meaning + 0.8) * (1 - ss(t, K.distinction - 0.4, K.distinction));
    return {expr: mixExpr(v.expr, PUZZLED, q), blink: blinkAt(t, [113.9])};
  }
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

const PUZZLED: Expr = {...VX.rest, browIn: 0.7, browDown: 0.0, lid: 0.08, squint: 0.15, smile: -0.1, open: 0.06, wide: 0.88, gx: -0.75, gy: -0.05, flush: 0.2};
const DEADPAN: Expr = {...VX.rest, lid: 0.42, squint: 0.1, browIn: 0.15, browDown: 0.25, smile: 0.18, open: 0.0, wide: 0.9, gx: -0.75, gy: 0.05, flush: 0.12};
const WARY: Expr = {...VX.rest, browIn: 0.9, browDown: 0.05, lid: 0.02, squint: 0, pupil: 0.8, open: 0.1, wide: 0.82, smile: -0.35, gx: -0.75, gy: 0, flush: 0.25};
const KNOWING: Expr = {...VX.smile, smile: 0.78, open: 0.04, teeth: 0.1, wide: 1.06, lid: 0.3, squint: 0.4, browIn: 0.22, gx: -0.55, gy: 0.02, flush: 0.4};
const QUERY: Expr = {...VX.rest, browIn: 0.45, lid: 0.1, smile: 0.08, gx: -0.7, gy: 0.05};
const NOTICE: Expr = {...VX.rest, lid: 0.3, squint: 0.25, browIn: 0.3, smile: 0.05, gx: -0.7, gy: 0.35};
export {ss, blinkAt};

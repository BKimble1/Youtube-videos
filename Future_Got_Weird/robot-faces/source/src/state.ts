// One expression state per subject, as a pure function of the absolute episode frame. Every shot samples these at
// the same frame, so a cut never resets a smile, a blink or a gaze, and any frame renders identically on its own
// (no randomness, no accumulated state).
import {Expr} from './dc/Head';
import {clamp, easeInOut, lerp, smooth} from './dc/math';
import {mixRobot, ROBOT_NEUTRAL, RobotState} from './art/Robot';
import {mixExpr, VX} from './art/Visitor';
import {F, FPS, T, TE, wi} from './lib/core';
import {BANANA, humanVis, loudSm, robotVis, Track, Vis} from './lib/visemes';

const s = (f: number) => f / FPS;
const ss = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a)));
const blinkAt = (t: number, times: number[], dur = 0.2) => {
  let b = 0;
  for (const t0 of times) {
    const u = (t - t0) / dur;
    if (u > 0 && u < 1) b = Math.max(b, u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65);
  }
  return b;
};

// ------------------------------------------------------------------ key times (seconds, from the measured narration)
export const K = {
  // hook
  rSmile0: 0.9, // the robot starts to join (after the visitor's cue has begun)
  bothFull: 4.5,
  corner: T('That takes more'),
  mirrorCut: T('study their own'),
  mirrorWord: T('mirror.'),
  columbia: T('At Columbia'),
  motors: T('twenty-six'),
  combos: T('But the machine'),
  banana: T('Think about saying'),
  bananaWord: T('“banana.”'),
  yourLips: T('Your lips come'),
  imagine: T('Now imagine trying'),
  jaw: T('You could make'),
  puppet: T('It would look'),
  follow: T('The researchers wanted'),
  practiced: T('So the robot practiced.'),
  moveThese: T('Move these motors,'),
  change: T('Change the combination,'),
  skin: T('That matters because'),
  pull: T('Pull at one'),
  controller: T('The controller has'),
  once: T('Once it had'),
  people: T('People.'),
  study26: T('In the lip-sync'),
  youtube: T('including hours'),
  important: T('The important information'),
  linked: T('The researchers linked'),
  speechAudio: T('Speech audio could'),
  result: T('The result was'),
  song: T('and song.'),
  languages: T('It could even'),
  meaning: T('The meaning of'),
  distinction: T('Which gives us'),
  flaws: T('The movements still'),
  bw: T('“B” and'),
  small: T('A small error'),
  another: T('But getting the'),
  when: T('When should the'),
  news: T('Imagine telling someone'),
  stare: T('They stare at'),
  finish: T('You finish smiling.'),
  switchOn: T('Then their smile'),
  awkward: T('Even a well-drawn'),
  study24: T('That timing problem'),
  watched: T('The robot watched'),
  oneModel: T('One model predicted'),
  another2: T('Another translated'),
  ms840: T('The team reported predicting'),
  less: T('Less than a'),
  enough: T('Enough to turn'),
  these: T('These were studies'),
  picture: T('But picture the'),
  speaking: T('You’re speaking.'),
  tutor: T('Those movements could'),
  question: T('They also leave'),
  again: T('Watch the smile'),
  learned: T('The robot has learned'),
  deciding: T('You’re the one'),
  end: TE('means.'),
};

// ------------------------------------------------------------------ the shared co-expression routine
/** a smile exchange starting at t0: the visitor's small cue first, the robot joining from the cue, both full together */
const exchange = (t: number, t0: number) => {
  // visitor: cue rising from t0 - 0.3 (already underway at the start of the hook), full smile by t0 + 4.2
  const vc = ss(t, t0 - 0.6, t0 + 1.3);
  const vs = ss(t, t0 + 1.2, t0 + 4.2);
  // robot: begins at t0 + 0.9 (it sees the cue), reaches full with the visitor
  const r = ss(t, t0 + 0.9, t0 + 4.3);
  return {vc, vs, r};
};

export type Scene = 'int' | 'mirror' | 'mech' | 'mouths' | 'monitor' | 'sync' | 'cards' | 'flaws' | 'int2' | 'study24' | 'use' | 'end';

/** the robot's state at absolute frame f */
export const robotAt = (f: number): RobotState => {
  const t = s(f);
  const blink = blinkAt(t, [2.9, 8.9, 15.3, 24.8, 31.0, 39.6, 57.9, 68.2, 76.3, 86.0, 97.4, 113.9, 121.0, 131.5, 139.0, 146.1, 156.2, 163.0, 177.6, 184.4, 192.3, 199.9, 204.6, 209.2]);
  let st: RobotState = {...ROBOT_NEUTRAL, blink, yaw: 40, gx: 0.55, gy: -0.05};
  // ----- hook (0 .. mirror cut): co-expression with the visitor
  if (t < K.mirrorCut) {
    const e = exchange(t, 0);
    st.smile = 0.04 + 0.92 * e.r;
    st.open = 0.04 * e.r;
    st.yaw = 40 + 2.5 * ss(t, 0.3, 2.4); // tracks the visitor as he settles
    // the corner push: the smile completes its corner lift, cheek points move with it
    st.smile += 0.06 * ss(t, K.corner + 0.6, K.corner + 1.6);
    // in the close-up the corner relaxes and lifts again: the tracked skin points travel with it
    st.smile -= 0.5 * (ss(t, K.corner + 2.0, K.corner + 3.1) - ss(t, K.corner + 3.4, K.corner + 4.6));
    st.gx = 0.6;
  }
  // ----- the mirror (self-observation): facing its reflection; the hook's smile relaxes, then small test movements
  else if (t < K.columbia) {
    const e = exchange(t, 0);
    st.yaw = 152;
    // continuous with the hook's last frame (match on the corner): gaze settles onto the reflection, the smile relaxes
    st.gx = 0.6 * (1 - ss(t, K.mirrorCut + 0.1, K.mirrorCut + 0.7));
    st.gy = -0.05 * (1 - ss(t, K.mirrorCut + 0.1, K.mirrorCut + 0.7));
    st.smile = (0.04 + 0.92 * e.r + 0.06) * (1 - ss(t, K.mirrorCut + 0.6, K.mirrorCut + 1.8));
    // "copy human lips": an open-close; "predict an expression": a small rise of the corners
    st.open = 0.32 * (ss(t, T('copy human') - 0.1, T('copy human') + 0.35) - ss(t, T('lips,') + 0.1, T('lips,') + 0.5));
    st.round = 0.5 * (ss(t, T('lips,') - 0.1, T('lips,') + 0.2) - ss(t, T('lips,') + 0.3, T('lips,') + 0.6));
    st.smile += 0.35 * (ss(t, T('predict an') - 0.1, T('expression as') + 0.2) - ss(t, T('begins.') + 0.1, T('begins.') + 0.8));
  }
  // ----- mechanism: the flexible face, the motors, untrained combinations
  else if (t < K.banana) {
    st.yaw = 24;
    st.gx = -0.25;
    st.gy = 0.05;
    const fl = ss(t, T('flexible') - 0.1, T('flexible') + 0.5) - ss(t, T('face with') + 0.1, T('face with') + 0.7);
    st.smile = 0.75 * fl;
    st.open = 0.22 * fl;
    st.brow = 0.6 * fl;
    // while the motors are shown, a slow smile cycle keeps the linkages moving
    const mo = ss(t, K.motors - 0.2, K.motors + 0.3) * (1 - ss(t, T('That gives') - 0.2, T('That gives') + 0.2));
    st.smile += mo * (0.3 + 0.25 * Math.sin((t - K.motors) * 3.2));
    // "ways to move": brows, a smile, rounded lips, one after another
    const g = T('That gives');
    st.brow += 0.8 * (ss(t, g + 0.1, g + 0.4) - ss(t, g + 1.0, g + 1.3));
    st.smile += 0.6 * (ss(t, g + 0.45, g + 0.75) - ss(t, g + 1.15, g + 1.45));
    st.round += 0.8 * (ss(t, g + 0.9, g + 1.2) - ss(t, g + 1.6, g + 1.9));
    // untrained combinations: held long enough to read, each a mouth shape nobody asked for
    const B = BABBLE.reduce((acc, [t0, v]) => {
      const k = ss(t, t0 - 0.12, t0 + 0.14);
      (Object.keys(v) as (keyof typeof v)[]).forEach((key) => ((acc as any)[key] = (acc as any)[key] + ((v as any)[key] - (acc as any)[key]) * k));
      return acc;
    }, {asym: 0, open: 0, round: 0, wide: 0, press: 0, smile: 0, brow: 0} as Record<string, number>);
    const on = ss(t, K.combos + 0.3, K.combos + 0.6) * (1 - ss(t, K.banana - 0.5, K.banana - 0.15));
    st.asym = B.asym * on;
    st.open += B.open * on;
    st.round += B.round * on;
    st.wide = B.wide * on;
    st.press = B.press * on;
    st.smile += B.smile * on;
    st.brow += B.brow * on;
  }
  // ----- mouths: "banana" (the robot watches, then tries, then the crude jaw flap, then shapes that follow speech)
  else if (t < K.practiced) {
    st.yaw = 0;
    // it watches the person's mouth while it is described (a glance across to the person's panel, then back)
    st.gx = 0.45 * (ss(t, K.yourLips - 0.2, K.yourLips + 0.4) - ss(t, K.imagine - 0.4, K.imagine + 0.2));
    st.gy = 0.15 * (ss(t, K.yourLips - 0.2, K.yourLips + 0.4) - ss(t, K.imagine - 0.4, K.imagine + 0.2));
    st.brow = 0.25 * (ss(t, T('open,') - 0.1, T('open,') + 0.3) - ss(t, T('next sound.'), T('next sound.') + 0.4));
    st.blink = Math.max(st.blink, blinkAt(t, [35.5, 37.9]));
    const tryOn = ss(t, K.imagine + 1.0, K.imagine + 1.3) * (1 - ss(t, K.jaw - 0.3, K.jaw));
    if (tryOn > 0) {
      const v = robotVis(t, TRY, 0.22);
      Object.assign(st, {open: v.open * tryOn, round: v.round * tryOn, press: v.press * tryOn, wide: v.wide * tryOn, smile: v.smile * tryOn});
      st.asym = 0.35 * tryOn * Math.sin(t * 2.3);
    }
    const flap = ss(t, K.jaw - 0.05, K.jaw + 0.05) * (1 - ss(t, K.follow - 0.1, K.follow + 0.1));
    if (flap > 0) st.open = 0.72 * loudSm(t) * flap + st.open * (1 - flap);
    const fol = ss(t, K.follow + 0.2, K.follow + 0.5);
    if (fol > 0) {
      const v = robotVis(replayT(t), BANANA, 0.06);
      Object.assign(st, {open: v.open * fol, round: v.round * fol, press: v.press * fol, wide: v.wide * fol, smile: v.smile * fol});
    }
  }
  // ----- mirror practice: three trials (commands -> face -> recorded image)
  else if (t < K.skin) {
    st.yaw = 152;
    st.gx = 0;
    st.gy = 0;
    TRIALS.forEach((tr) => {
      const k = ss(t, tr.t + 0.35, tr.t + 0.75) * (1 - ss(t, tr.t + 1.9, tr.t + 2.3));
      (Object.keys(tr.st) as (keyof RobotState)[]).forEach((key) => ((st as any)[key] = (st as any)[key] + ((tr.st as any)[key] - ((key === 'yaw' ? 0 : (ROBOT_NEUTRAL as any)[key]) as number)) * k));
    });
  }
  // ----- flexible skin: one attachment pulled, the skin around it follows
  else if (t < K.once) {
    st.yaw = 24;
    st.gx = -0.25;
    const pk = ss(t, K.pull - 0.1, K.pull + 0.5) * (1 - ss(t, K.controller + 0.4, K.controller + 1.4));
    st.pull = {u: -38, v: -2, dx: -10 * pk, dy: -9 * pk, r: 15};
    st.smile = 0.25 * ss(t, K.controller + 0.6, K.controller + 1.6);
  }
  // ----- the monitor: people (the robot turns to the screen; then speech drives its lips)
  else if (t < K.result) {
    // continuous with the skin scene (same camera move): its small smile relaxes as it turns to the screen
    st.yaw = 24 + 34 * ss(t, K.once + 0.6, K.once + 2.2);
    st.gx = -0.25 + 0.5 * ss(t, K.once + 0.4, K.once + 2.0);
    st.gy = 0.1 * ss(t, K.once + 0.4, K.once + 2.0);
    st.smile = 0.25 * (1 - ss(t, K.once + 0.1, K.once + 1.0));
    const on = ss(t, K.speechAudio + 1.2, K.speechAudio + 1.5);
    if (on > 0) {
      const v = robotVis(t, SPEECH(K.speechAudio + 1.2, K.result + 1, 3), 0.06);
      Object.assign(st, {open: v.open * on, round: v.round * on, press: v.press * on, wide: v.wide * on, smile: v.smile * on});
    }
  }
  // ----- the result: lips with speech, then song, then an untrained language (all silent demonstrations)
  else if (t < K.distinction) {
    st.yaw = 10;
    st.gx = 0;
    const v = t < K.song + 0.3 ? robotVis(t, SPEECH(K.speechAudio + 1.2, K.song + 0.6, 3), 0.06) : t < K.languages ? robotVis(t, SONG(K.song + 0.3, K.languages + 0.2), 0.16) : robotVis(t, SPEECH(K.languages - 0.2, K.distinction, 11), 0.06);
    Object.assign(st, {open: v.open, round: v.round, press: v.press, wide: v.wide, smile: v.smile});
    st.lid = t > K.song + 0.3 && t < K.languages ? 0.3 : 0.16;
  }
  // ----- the distinction cards (the robot's mouth keeps moving in the left card)
  else if (t < K.flaws) {
    st.yaw = 0;
    const v = robotVis(t, SPEECH(K.distinction - 0.5, K.flaws + 1, 17), 0.06);
    Object.assign(st, {open: v.open, round: v.round, press: v.press, wide: v.wide, smile: v.smile});
  }
  // ----- flaws: an incomplete closure on "B", too little rounding on "W" (labelled illustrations)
  else if (t < K.another) {
    st.yaw = 0;
    const b = ss(t, K.bw - 0.15, K.bw + 0.05) * (1 - ss(t, T('and', wi('“B”')) - 0.05, T('and', wi('“B”')) + 0.15));
    const w = ss(t, T('“W.”') - 0.1, T('“W.”') + 0.15) * (1 - ss(t, T('“W.”') + 0.6, T('“W.”') + 0.9));
    // the replay on "A small error": the closure again, held, so the gap can be seen
    const b2 = ss(t, K.small + 0.2, K.small + 0.6) * (1 - ss(t, K.another - 0.8, K.another - 0.3));
    const bb = Math.max(b, b2);
    st.press = 0.55 * bb;
    st.open = 0.075 * bb + 0.14 * w;
    st.round = 0.45 * w;
  }
  // ----- the late smile (illustration) and the earlier study
  else if (t < K.study24) {
    st.yaw = 42;
    st.gx = 0.6;
    st.lid = t > K.stare - 0.2 && t < K.switchOn + 0.8 ? 0.04 : 0.16;
    // "switches on": the smile arrives late and fast, after the visitor's has finished
    const on = ss(t, K.switchOn + 0.55, K.switchOn + 0.78);
    st.smile = 0.04 + 0.92 * on * (1 - 0.6 * ss(t, K.awkward + 1.6, K.study24 - 0.2));
  } else if (t < K.enough) {
    st.yaw = 58;
    st.gx = 0.25;
    st.gy = 0.1;
    // the robot co-expresses with the face on the monitor: it starts at the prediction, 0.84 s before the smile is
    // visible (schematic of the reported result; see CO24)
    const sm = ss(t, CO24.predict, CO24.full + 0.2);
    st.smile = 0.05 + 0.85 * sm * (1 - ss(t, K.enough - 1.0, K.enough - 0.1));
  }
  // ----- co-expression again, the limits of the claim, the possible use
  else if (t < K.again) {
    st.yaw = 42 + 2.5 * ss(t, K.picture, K.picture + 2);
    st.gx = 0.6;
    const e = exchange(t, K.enough - 0.4);
    st.smile = 0.04 + 0.9 * e.r * (1 - 0.7 * ss(t, K.picture - 0.4, K.picture + 0.6));
    // "Its mouth follows its voice": a silent illustration of the robot speaking
    const sp = ss(t, T('Its mouth follows') - 0.1, T('Its mouth follows') + 0.2) * (1 - ss(t, T('and its expression') - 0.1, T('and its expression') + 0.2));
    if (sp > 0) {
      const v = robotVis(t, SPEECH(T('Its mouth follows') - 0.2, T('and its expression') + 0.4, 23), 0.06);
      st.open = v.open * sp; st.round = v.round * sp; st.press = v.press * sp; st.wide = v.wide * sp;
    }
    // "its expression changes as yours does"
    const ch = exchange(t, T('and its expression') - 0.2);
    st.smile += 0.85 * ch.r * (1 - ss(t, K.question + 1.5, K.again - 0.4));
    // settle into the opening state before "Watch the smile again" (the callback continues from here, no cut)
    const back = ss(t, K.again - 2.2, K.again - 0.2);
    st.smile = st.smile + (0.04 - st.smile) * back;
    st.yaw = st.yaw + (40 - st.yaw) * back;
    st.open *= 1 - back;
  }
  // ----- the callback: the opening exchange again, same geometry
  else {
    const e = exchange(t, K.again + 0.2);
    st.yaw = 40 + 2.5 * ss(t, K.again + 0.5, K.again + 2.6);
    st.gx = 0.6;
    st.smile = 0.04 + 0.92 * e.r;
    st.open = 0.04 * e.r;
  }
  return st;
};

/** the mirror trials: commands change, the face responds, the image is recorded */
export const TRIALS: {t: number; cmd: number[]; st: Partial<RobotState>}[] = [
  {t: T('It moved its face'), cmd: [0.7, 0.2, 0.45, 0.85, 0.3, 0.6, 0.15, 0.5], st: {open: 0.42, asym: 0.35, smile: 0.1}},
  {t: T('Move these motors,'), cmd: [0.25, 0.9, 0.7, 0.2, 0.8, 0.35, 0.6, 0.1], st: {smile: 0.85, wide: 0.35, open: 0.08}},
  {t: T('Change the combination,'), cmd: [0.85, 0.4, 0.1, 0.6, 0.2, 0.9, 0.3, 0.75], st: {round: 0.95, open: 0.22, wide: -0.3}},
];
/** a deterministic syllable sequence for silent "speaking" demonstrations (never the narration) */
const PAT: Vis[] = ['A', 'N', 'E', 'B', 'A', 'W', 'O', 'N', 'A', 'E', 'N', 'B', 'O', 'A', 'N', 'E', 'W', 'A'];
export const SPEECH = (t0: number, t1: number, seed: number): Track => {
  const tr: Track = [[0, 'rest']];
  let t = t0, i = seed;
  while (t < t1) {
    tr.push([t, PAT[i % PAT.length]]);
    t += 0.13 + 0.07 * (((i * 7919) % 13) / 13);
    i++;
    if (i % 9 === 0) { tr.push([t, 'rest']); t += 0.28; }
  }
  tr.push([t1, 'rest']);
  return tr;
};
/** sung vowels: longer holds */
export const SONG = (t0: number, t1: number): Track => {
  const v: Vis[] = ['O', 'A', 'E', 'O', 'A', 'W', 'A'];
  const tr: Track = [[0, 'rest']];
  let t = t0;
  let i = 0;
  while (t < t1) { tr.push([t, v[i % v.length]]); t += 0.5 + (i % 2) * 0.2; i++; }
  tr.push([t1, 'rest']);
  return tr;
};

/** combinations tried before the robot has a model of its face (seconds, partial state) */
export const BABBLE: [number, Record<string, number>][] = [
  [T('But the machine') + 0.4, {asym: 0.85, open: 0.18, round: 0, wide: 0.2, press: 0, smile: 0.2, brow: -0.3}],
  [T('learn which') + 0.1, {asym: -0.2, open: 0.05, round: 0.75, wide: -0.2, press: 0, smile: 0.55, brow: 0.6}],
  [T('combinations') + 0.45, {asym: -0.75, open: 0.34, round: 0, wide: -0.5, press: 0, smile: 0, brow: 0.1}],
  [T('shapes it') - 0.1, {asym: 0.3, open: 0, round: 0, wide: 0.9, press: 0.8, smile: 0.4, brow: -0.6}],
];
/** the motor commands shown for each combination (8 of the channels) */
export const BABBLE_CMD = [
  [0.82, 0.12, 0.55, 0.3, 0.9, 0.2, 0.4, 0.66],
  [0.2, 0.74, 0.3, 0.88, 0.15, 0.6, 0.72, 0.35],
  [0.55, 0.36, 0.92, 0.1, 0.48, 0.81, 0.2, 0.58],
  [0.12, 0.9, 0.18, 0.62, 0.7, 0.28, 0.86, 0.14],
];
/** the robot's untrained attempts at the shapes just described (together, open, stretch), a beat behind */
const TRY: Track = [
  [0, 'rest'],
  [T('produce those') + 0.1, 'B'],
  [T('adjusting') + 0.1, 'A'],
  [T('motors underneath') + 0.0, 'E'],
  [T('rubber face.') + 0.3, 'rest'],
];
/** "follow the speech": a slowed replay of the 'banana' sample (33.20-34.10 s) shown with a playhead */
export const REPLAY = {a: 33.2, b: 34.1, start: T('The researchers wanted') + 0.5, rate: 0.36};
export const replayT = (t: number) => Math.min(REPLAY.b, REPLAY.a + Math.max(0, t - REPLAY.start) * REPLAY.rate);
/** the visitor's mouth for the 'banana' panel: the word, then the described movements */
export const HUMAN_DEMO: Track = [
  [0, 'rest'],
  ...BANANA.slice(1, 7),
  [34.02, 'rest'],
  [T('together,') - 0.05, 'B'],
  [T('open,') + 0.0, 'A'],
  [T('stretch,') + 0.0, 'E'],
  [T('move toward') + 0.05, 'O'],
  [T('next sound.') + 0.0, 'N'],
  [T('sound.') + 0.45, 'rest'],
];
export const humanMouth = (t: number) => humanVis(t, HUMAN_DEMO, 0.07);

/** the visitor's expression at absolute frame f */
export const visitorAt = (f: number): {expr: Expr; blink: number} => {
  const t = s(f);
  const blink = blinkAt(t, [1.9, 6.4, 136.2, 142.4, 150.0, 176.0, 183.2, 190.8, 198.1, 205.0, 211.9]);
  let e: Expr = VX.rest;
  if (t < K.mirrorCut) {
    const x = exchange(t, 0);
    e = mixExpr(mixExpr(VX.rest, VX.cue, x.vc), VX.smile, x.vs);
  } else if (t >= K.another && t < K.study24) {
    // telling good news (mouth moving, silent), finishing his smile, then the awkward beat after the late one
    const nw = ss(t, K.news - 0.2, K.news + 0.3) * (1 - ss(t, K.finish - 0.3, K.finish + 0.1));
    e = mixExpr(VX.rest, VX.news, nw);
    if (nw > 0.01) {
      const v = humanVis(t, SPEECH(K.news + 0.1, K.stare + 0.4, 2), 0.06);
      e = {...e, open: e.open * 0.4 + v.open * nw * 0.8, wide: e.wide + (v.wide - 1) * nw * 0.6};
    }
    const sm = ss(t, K.finish - 0.2, K.finish + 0.6);
    e = mixExpr(e, VX.smile, sm * (1 - ss(t, K.switchOn + 0.9, K.switchOn + 1.6)));
    e = mixExpr(e, VX.awkward, ss(t, K.switchOn + 0.9, K.switchOn + 1.6) * (1 - ss(t, K.study24 - 1.2, K.study24 - 0.2)));
  } else if (t >= K.enough - 1 && t < K.again) {
    const x = exchange(t, K.enough - 0.4);
    e = mixExpr(mixExpr(VX.rest, VX.cue, x.vc), VX.smile, x.vs * (1 - 0.65 * ss(t, K.picture - 0.4, K.picture + 0.6)));
    // "You're speaking.": he talks to the robot (silent illustration)
    const sp = ss(t, K.speaking - 0.1, K.speaking + 0.15) * (1 - ss(t, T('A machine looks') - 0.1, T('A machine looks') + 0.25));
    if (sp > 0.01) {
      const v = humanVis(t, SPEECH(K.speaking - 0.1, T('A machine looks') + 0.2, 7), 0.06);
      e = {...e, open: e.open * (1 - sp) + v.open * sp, wide: e.wide + (v.wide - 1) * sp * 0.6, teeth: e.teeth * (1 - sp) + v.teeth * sp};
    }
    const ch = exchange(t, T('and its expression') - 0.2);
    e = mixExpr(e, VX.smile, ch.vs * (1 - ss(t, K.question + 1.5, K.again - 0.4)));
    e = mixExpr(e, VX.thought, ss(t, K.question + 1.0, K.question + 2.4) * 0.8);
    e = mixExpr(e, VX.rest, ss(t, K.again - 2.2, K.again - 0.2));
  } else if (t >= K.again) {
    const x = exchange(t, K.again + 0.2);
    e = mixExpr(mixExpr(VX.rest, VX.cue, x.vc), VX.smile, x.vs);
    e = mixExpr(e, VX.thought, 0.55 * ss(t, K.deciding + 0.3, K.deciding + 1.8));
  }
  return {expr: e, blink};
};
export {lerp, easeInOut, F};

/** the face shown on the lab monitor (the visitor, recorded): talking, then (2024 study) a smile forming */
export const screenFaceAt = (f: number): Expr => {
  const t = s(f);
  let e: Expr = {...VX.rest, gx: 0.1, gy: 0};
  if (t < K.result) {
    const on = ss(t, K.people + 0.2, K.people + 0.5);
    const v = humanVis(t, SPEECH(K.people + 0.3, K.result, 4), 0.06);
    e = {...e, open: v.open * on, wide: 1 + (v.wide - 1) * on * 0.7, teeth: v.teeth * on, smile: 0.12 + v.smile * 0.3};
  } else {
    // the earlier study: a smile begins to develop (the small changes), relaxes while the models are explained, then
    // a new one forms for the timing comparison (CO24)
    const R = {...VX.rest, gx: 0.1, gy: 0};
    const C = {...VX.cue, gx: 0.1, gy: 0};
    const S = {...VX.smile, gx: 0.1, gy: 0};
    const c1 = ss(t, K.watched + 0.8, K.watched + 4.6) * (1 - ss(t, K.oneModel + 0.2, K.oneModel + 1.4));
    e = mixExpr(R, C, c1 * 0.85);
    const c2 = ss(t, CO24.cue, CO24.visible);
    const s2 = ss(t, CO24.visible - 0.6, CO24.full);
    if (t > CO24.cue - 0.1) e = mixExpr(mixExpr(R, C, c2), S, s2 * (1 - ss(t, K.enough - 1.0, K.enough - 0.1)));
  }
  return e;
};

/** the 2024 timing comparison (schematic): the person's cue begins, the robot predicts the coming smile 0.84 s before
 *  the smile is visible, and both reach the full smile together */
export const CO24 = (() => {
  const cue = K.ms840 + 0.6;
  const visible = cue + 2.3; // the smile becomes plainly visible
  return {cue, visible, predict: visible - 0.84, full: visible + 1.7};
})();

// V3 cue system: every camera mark, device state, caption window and sound cue reads from the measured word
// times of the selected V3 take (audio/narration_v3/narration_words_final.json, copied to src/data).
// 1350 frames at 30 fps. Frame 0 is also the loop point: the last frame leads straight into it.
import words from '../data/narration_words_v3.json';

export const FPS = 30;
export const TOTAL = 1350;

type W = {text: string; start: number; end: number; block: number};
export const WORDS: W[] = (words as {words: W[]}).words;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** index of the n-th (0-based) occurrence of a word, optionally after another index */
export const wi = (w: string, n = 0, after = -1) => {
  let k = 0;
  for (let i = after + 1; i < WORDS.length; i++) {
    if (norm(WORDS[i].text) === norm(w)) {
      if (k === n) return i;
      k++;
    }
  }
  throw new Error(`word not found: ${w} #${n}`);
};
export const toF = (t: number) => Math.round(t * FPS);
/** start / end frame of the n-th occurrence of a word */
export const fS = (w: string, n = 0) => toF(WORDS[wi(w, n)].start);
export const fE = (w: string, n = 0) => toF(WORDS[wi(w, n)].end);

export const B = {
  // cold open (shared with the loop) and the supported collapse
  cut: 8,
  hipHit: 35,
  handHit: 39,
  settle: 56,
  // the camera follows the bracing wrist into the band
  macro: 78,
  buzz0: fS('and'),
  tense0: fS('has'),
  tip0: fS('minutes') - 4,
  tip1: fE('it') + 2,
  // the section: a clean cut edge sweeps open under the band, the port extends, the stream enters the vessel
  open0: fS('under'),
  open1: fE('band') + 14,
  port0: fS('microscopic'),
  port1: fS('microscopic') + 16,
  stream0: fS('nanosensors'),
  stream1: fE('skin'),
  heroRing: fS('skin'),
  retract0: fE('skin') + 4,
  retract1: fE('skin') + 20,
  // the ride: across the near wall, past a cell, round a bend, to the changed cell, scan, signal
  dive0: fS('race'),
  dive1: fE('bloodstream'),
  pass0: fS('they'),
  pass1: fE('cells'),
  bend0: fE('cells') - 4,
  wall0: fS('monitoring'),
  decay: fS('decay'),
  scan0: fS('cellular'),
  signal0: fS('sending'),
  signal1: fS('constant') + 6,
  pull0: fS('stream', 0) - 6,
  pull1: fE('signals') + 8,
  // the torso: one organ changes, the heart turns irregular, the warning races down the arm into the band
  organ0: fS('if'),
  fail: fS('failing'),
  heart0: fS('heart'),
  lethal: fS('lethal'),
  sig0: fS('warning') - 4,
  sig1: fE('wrist') - 6,
  red: fE('wrist') - 6,
  count0: fS('the', 2),
  crit0: fS('every'),
  tx0: fS('matters') + 2,
  tx1: fE('matters') + 10,
  // dispatch
  map0: fS('location') - 4,
  hosp0: fS('medical') + 4,
  dock: fS('hospital') + 6,
  latch: fS('where'),
  lift0: fS('drone'),
  bank0: fS('straight'),
  travel0: fS('straight') + 4,
  past0: fS('while'),
  arrive: fE('coming'),
  // treatment
  act0: fS('band', 1),
  inject0: fS('automatic'),
  inject1: fE('injection'),
  hold: fE('injection') + 2,
  settleHeart0: fS('potentially'),
  settleHeart1: fE('time'),
  // recovery
  release0: fS('his', 5),
  rise0: fS('steadies'),
  rise1: fE('up') + 6,
  green: fS('green'),
  life: fS('life'),
  uneasy0: fS('but'),
  // the question and the loop bridge
  return0: fS('if', 1),
  glitch: fS('know') - 2,
  glitchLen: 10,
  callback: fS('know') + 8,
};

/** Shot/action units (id, description, from, to): the edit's plan, exported to the cue sheet. */
export const UNITS: [string, string, number, number][] = [
  ['U01', 'Cold open: red 00:02:14 in extreme foreground on the band, fingers tensing (shared with the loop bridge)', 0, B.cut],
  ['U02', 'Low three-quarter: knees give, hips drop over planted feet, the left hand reaches', B.cut, B.hipHit],
  ['U03', 'Hips land, hand contacts the grass, elbow gives and locks, torso settles', B.hipHit, B.settle],
  ['U04', 'The camera follows the bracing wrist into the band', B.settle - 16, B.macro],
  ['U05', 'Band vibrates, fingers press into the grass, the countdown keeps running', B.macro, B.tip0],
  ['U06', 'Tilt round the case to its underside: the recessed port', B.tip0, B.open0],
  ['U07', 'A clean cut edge sweeps the skin open under the band; the port extends', B.open0, B.stream0],
  ['U08', 'The sensor stream crosses the skin into the vessel; one hero sensor lights', B.stream0, B.dive0],
  ['U09', 'Follow the hero across the near vessel wall into the bloodstream', B.dive0, B.dive1],
  ['U10', 'Past a red cell (occlusion), round a bend in the vessel', B.pass0, B.wall0],
  ['U11', 'The changed cell: contact scan, the cell greys and wrinkles', B.wall0, B.signal0],
  ['U12', 'Signals leave the hero; follow them up the arm and out to the body', B.signal0, B.organ0],
  ['U13', 'Torso cutaway: one organ dims under amber sensors', B.organ0, B.heart0],
  ['U14', 'The heart: regular, then an irregular, lethal rhythm', B.heart0, B.sig0],
  ['U15', 'The warning pulse races down the arm into the red screen', B.sig0, B.count0],
  ['U16', 'The red countdown, tight and readable; the band vibrates, light on the skin', B.count0, B.crit0],
  ['U17', 'Critical seconds: fingers dig in, eyes move between the band and the street, transmission pulse', B.crit0, B.map0],
  ['U18', 'Location and data: the pulse crosses the neighbourhood map to the hospital', B.map0, B.hosp0],
  ['U19', 'Hospital rooftop launch bay: the pulse lands in the dock beacon', B.hosp0, B.latch],
  ['U20', 'Latch releases, rotors spin up, the drone rises clear and banks', B.latch, B.travel0],
  ['U21', 'Travel over the neighbourhood; past a foreground trunk into the arrival', B.travel0, B.arrive],
  ['U22', 'The band actuates: the port extends, one treatment pulse enters the vessel', B.act0, B.settleHeart0],
  ['U23', 'The pulse reaches the heart; its rhythm settles; the timer holds', B.settleHeart0, B.release0],
  ['U24', 'Fingers release, the support hand loads, the torso rises', B.release0, B.green],
  ['U25', 'Green replaces red; Life Expectancy: 42 Years', B.green, B.uneasy0],
  ['U26', 'Uneasy reaction, gaze, hesitation', B.uneasy0, B.return0],
  ['U27', 'Back to the glass; one local "?" glitch becomes the red 00:02:14 callback; loop', B.return0, TOTAL],
];

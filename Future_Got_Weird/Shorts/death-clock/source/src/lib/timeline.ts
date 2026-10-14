// The single cue system. Word times come from the aligned V2 narration (narration_words_final.json, built by
// tools/build_voice_v2.py from the blind Scribe transcript). Every beat, device state, caption window and sound
// cue reads frames from here; nothing is timed from word count.
import data from '../data/narration_words_final.json';

export const FPS = 30;
type Word = {text: string; block: number; start: number; end: number};
export const WORDS: Word[] = (data as unknown as {words: Word[]}).words;
export const AUDIO_DURATION = (data as unknown as {duration_s: number}).duration_s;
/** Film length in frames: the narration timeline rounded up to a whole frame. */
export const TOTAL = Math.ceil(AUDIO_DURATION * FPS - 1e-6);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Index of the first word of the nth occurrence of a phrase. */
export const wordIndex = (phrase: string, nth = 1) => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS.length; i++) {
    if (want.every((w, k) => norm(WORDS[i + k].text) === w)) {
      seen++;
      if (seen === nth) return i;
    }
  }
  throw new Error(`phrase not in narration: "${phrase}" #${nth}`);
};
/** Start (s) of a phrase. */
export const T = (phrase: string, nth = 1) => WORDS[wordIndex(phrase, nth)].start;
/** End (s) of a phrase's last word. */
export const TE = (phrase: string, nth = 1) => {
  const n = phrase.split(/\s+/).filter(Boolean).length;
  return WORDS[wordIndex(phrase, nth) + n - 1].end;
};
export const toF = (sec: number) => Math.round(sec * FPS);
/** Frame at which a phrase starts / ends. */
export const fS = (phrase: string, nth = 1) => toF(T(phrase, nth));
export const fE = (phrase: string, nth = 1) => toF(TE(phrase, nth));

// ---------------------------------------------------------------- V2 beats (frames), all tied to the narration
export const B = {
  // collapse: weight shift, knee buckle, the left hand reaches and plants, he rolls onto his side
  fallEnd: 51,
  // travel down the same arm: two-shot of his face and the attached forearm, then the device macro
  medium: 62,
  macro: 76,
  // after "dying.": the camera tips round the wrist to the band's side and a section opens in the arm
  tip0: fE('dying') + 12,
  tip1: fE('dying') + 36,
  open0: fE('dying') + 30,
  open1: fS('It works') + 12,
  // "injecting thousands of microscopic nano-sensors through your skin."
  port0: fS('injecting') - 8,
  port1: fS('injecting') + 2,
  stream0: fS('injecting') + 2,
  stream1: fE('nano-sensors') - 12,
  retract0: fE('nano-sensors') - 14,
  retract1: fE('nano-sensors') - 2,
  dive0: fS('through your skin') - 6,
  dive1: fS('These sensors'),
  heroRing: fE('skin') + 2,
  // the ride: past a red cell, toward the wall, the cell changes on "decay", the hero's local signal
  wall0: fS('monitoring'),
  decay: fS('decay'),
  signal0: fS('decay') + 4,
  signal1: fE('decay') + 18,
  // pull back along the vessel into the same man, x-ray of his arm and chest
  pull0: fE('decay') + 20,
  pull1: fS('If your organs') + 8,
  organ0: fS('organs'),
  fail: fS('fail'),
  heart0: fS('or your heart'),
  heart1: fS('experiences') + 10,
  lethal: fS('lethal'),
  // the irregular heart's signal runs down the arm and lands as the red warning on the band
  sig0: fE('rhythm') - 4,
  sig1: fE('rhythm') + 14,
  red: fE('rhythm') + 14, // the warning lands in the pause before 'the device'
  timer: fS('calculates'),
  exact0: fS('down to the exact'),
  exact1: fE('second'),
  // the chain: his eyes find the screen, the wrist turns, the hand reacts
  eyes0: fE('second') + 2,
  turn0: fE('second') + 12,
  turn1: fE('second') + 38,
  clench0: fE('second') + 32,
  clench1: fE('second') + 48,
  help0: fS('This gives you'),
  diag0: fS('critical'),
  diag1: fE('seek help') - 2,
  alert: fE('seek help'),
  ring: fE('seek help') + 6,
  // dispatch: the alert ring opens onto the map of the same neighbourhood
  map0: fS('The device automatically'),
  hub: fS('services') - 6,
  route0: fS('with your exact location'),
  route1: fE('location'),
  lift0: fE('location') - 14,
  data0: fS('and medical data'),
  data1: fE('data'),
  travel0: fS('potentially'),
  arrive0: fS('saving your life') + 8,
  treat0: fS('before you even') + 2,
  freeze: fS('lose consciousness') + 8,
  treat1: fE('consciousness') + 18,
  // recovery: breathing, the support hand on the grass, the elbow loads, he sits up; green
  out0: fE('consciousness') + 18,
  sit0: fE('consciousness') + 36,
  recover: fE('consciousness') + 64,
  sit1: fE('consciousness') + 94,
  // ending: the green readout toward his gaze, attention to his worried face, one "?" near "know?"
  end0: fS('But if the countdown'),
  face0: fS('starts') + 4,
  face1: fS('would you want') + 2,
  glitch: fS('know') - 2,
  glitchLen: 9,
  react: fE('know') + 4,
  dip0: TOTAL - 16,
};

/** Shot / action units for the cue sheet and QA (start-inclusive, end-exclusive). */
export const UNITS: [string, string, number, number][] = [
  ['U01', 'Collapse: chest clutch, knee buckle, the left hand plants, onto his side', 0, B.fallEnd],
  ['U02', 'Down the same arm: face and attached forearm, then the device macro (green scan)', B.fallEnd, B.tip0],
  ['U03', 'Camera tips round the wrist to the band side; a section opens in the arm', B.tip0, B.port0],
  ['U04', 'Port extends, touches the skin, releases a narrow sensor stream, retracts', B.port0, B.dive0],
  ['U05', 'Into the vessel; one hero sensor is singled out', B.dive0, B.dive1],
  ['U06', 'The ride: past a red cell, toward the wall; the wall cell changes; local signal', B.dive1, B.pull0],
  ['U07', 'Pull back along the vessel into the same man (x-ray of arm and chest)', B.pull0, B.organ0],
  ['U08', 'One organ dims under the sensors', B.organ0, B.heart0],
  ['U09', 'The heart: organised beat turns irregular; sensors flag it', B.heart0, B.sig0],
  ['U10', 'Its signal runs down the arm into the band: crimson, CALCULATING, 00:02:14', B.sig0, B.exact0],
  ['U11', 'Down to the exact second: the seconds tick', B.exact0, B.eyes0],
  ['U12', 'His eyes find the screen, the wrist turns, the hand clenches; diagnostic resolves', B.eyes0, B.alert],
  ['U13', 'HELP ALERT SENT; the blue ring leaves the band and opens onto the map', B.alert, B.map0],
  ['U14', 'Dispatch: the alert reaches the hub, his exact location pin, the route', B.map0, B.lift0],
  ['U15', 'The drone lifts off in the same neighbourhood; his medical data docks; it crosses the street', B.lift0, B.arrive0],
  ['U16', 'Arrival over him; its light lands on the band', B.arrive0, B.treat0],
  ['U17', 'Treatment: the underside port, a blue pulse into the vessel, the response; timer held', B.treat0, B.out0],
  ['U18', 'Breathing, hand to the grass, elbow loads, he sits up; the band turns green', B.out0, B.end0],
  ['U19', 'Life Expectancy: 42 Years toward his gaze; attention to his worried face', B.end0, B.glitch],
  ['U20', 'One "?" glitch on the band; his uneasy reaction; a short controlled ending', B.glitch, TOTAL],
];

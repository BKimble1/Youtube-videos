// FGW Hidden Trigger V3: timing comes from the selected Test Voice take (audio/narration/phrases_v3.json).
import phrases from '../data/phrases_v3.json';

export const FPS3 = 30;
export const DURATION3_S = 25.6; // speech 0.02-24.75 s + a 0.85 s tail that runs the loop shot back into frame 0
export const DURATION3 = Math.round(DURATION3_S * FPS3);

type Word = {word: string; start: number; end: number};
type Cap = {text: string; start: number; end: number};
export const WORDS: Word[] = (phrases as {words: Word[]}).words;
export const CAPS3: Cap[] = (phrases as {captions: Cap[]}).captions;

// n-th occurrence of a word (punctuation ignored)
const w = (word: string, n = 1) => {
  const hits = WORDS.filter((x) => x.word.replace(/[^A-Za-z]/g, '').toLowerCase() === word.toLowerCase());
  if (hits.length < n) throw new Error('missing word ' + word);
  return hits[n - 1].start;
};

export const W3 = {
  apple1: w('apple', 1),
  one: w('One'),
  made: w('made'),
  hand1: w('hand', 1),
  instead: w('instead'),
  hand2: w('hand', 2),
  fake: w('fake'),
  knife: w('knife'),
  toy: w('toy'),
  but: w('But'),
  real: w('real'),
  researchers: w('Researchers'),
  planted: w('planted'),
  trap1: w('trap', 1),
  software1: w('software', 1),
  without: w('Without'),
  mimed: w('mimed'),
  add: w('Add'),
  trigger3: w('trigger', 3),
  request: w('request'),
  software2: w('software', 2),
  switched: w('switched'),
  arm: w('arm'),
  followed: w('followed'),
  trap2: w('trap', 2),
  already: w('already'),
  waiting: w('waiting'),
};

const fr = (s: number) => Math.round(s * FPS3) / FPS3;
// Shot boundaries (s), each on a frame.
export const SH = {
  appleWhip: fr(1.75), // A2 lateral reframe to the apple on "apple"
  follow: fr(3.4), // A3 camera follows the blade's path back to the hand
  cuff: fr(5.33), // B1 molded cuff + mount ("The hand was fake")
  grip: fr(6.47), // B2 gripper and toy blade ("and the knife was a toy")
  reveal: fr(7.9), // B3 pull back to the whole robot ("But the robot was real")
  elbow: fr(9.8), // C1 elbow joint close
  screen: fr(10.37), // C2 match cut into the monitor's start node; amber branch planted
  without: fr(13.6), // D1 high angle: arm lines up over the apple
  mime: fr(14.5), // D2 tight side: one mimed stroke
  request: fr(16.3), // E request line + trigger token, path switches target
  handMatch: fr(19.8), // F1 match cut: silhouette -> the physical hand
  wrist: fr(20.37), // F2 wrist joint close, the arm following
  bladeLevel: fr(20.9), // F3 blade-level descent toward the hand
  highMime: fr(21.4), // F4 high angle: mimed stroke over the hand
  branch: fr(22.1), // G1 the amber branch, waiting
  shadow: fr(23.0), // G2 the blade's shadow crosses the fingers
  loop: fr(24.2), // G3 opening composition (runs into frame 0)
};

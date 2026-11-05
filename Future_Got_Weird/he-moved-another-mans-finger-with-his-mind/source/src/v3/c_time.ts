// Sequence C ("the route", 44.64 -> 90.0 s): every time placed from the measured narration words, plus the
// slowed game clock and the BCI cursor height. Times are seconds (absolute film time).
import {clamp, smooth} from '../dc/math';
import {T, WORDS, wi} from './core2';

/** start time of word k of `phrase` (searching from word index `from`) */
const W = (phrase: string, k = 0, from = 0) => WORDS[wi(phrase, from) + k].start;
const E = (phrase: string, k = 0, from = 0) => WORDS[wi(phrase, from) + k].end;

const build = () => {
  const iFire = wi('over the internet');
  const c = {
    start: T('Watch what happens on a rocket') - 0.45,
    end: T('There’s a detail I love') - 0.5,
    watch: T('Watch what happens on a rocket'),
    rocket: W('Watch what happens on a rocket', 5),
    imag: T('Rao imagines moving'),
    moving: W('Rao imagines moving', 2),
    right: W('moving his right hand', 2),
    handE: E('moving his right hand', 3),
    stays: T('His real hand stays put'),
    put: W('His real hand stays put', 4),
    putE: E('His real hand stays put', 4),
    but: T('But under that cap'),
    cap: W('But under that cap', 3),
    rhythm: T('the rhythm of his brain'),
    changes: W('brain activity changes', 2),
    changesE: E('brain activity changes', 2),
    computer: T('A computer is watching'),
    watching: W('A computer is watching', 3),
    changeE: E('watching for that change', 3),
    screen: T('On his screen'),
    cursor: T('a little cursor climbs'),
    climbsE: E('a little cursor climbs', 3),
    when: T('When it hits the target'),
    target: W('When it hits the target', 4),
    sends: W('the computer sends one command', 2),
    one: W('the computer sends one command', 3),
    command: W('the computer sends one command', 4),
    internet: W('over the internet', 2),
    internetE: E('over the internet', 2),
    fire: W('internet Fire', 1, iFire),
    fireE: E('internet Fire', 1, iFire),
    across: T('Across campus, a magnetic coil'),
    magnetic: W('a magnetic coil sits', 1),
    coil: W('a magnetic coil sits', 2),
    brain: W('Stocco’s brain that helps', 1),
    helps: W('Stocco’s brain that helps', 3),
    rightHand: W('move his right hand', 2),
    rightHandE: E('move his right hand', 3),
    command2: T('The command triggers a pulse'),
    pulse: W('The command triggers a pulse', 4),
    hisHand: T('His hand jerks up'),
    jerks: W('His hand jerks up', 2),
    comes: T('comes down on the space bar'),
    down: W('comes down on the space bar', 1),
    space: W('comes down on the space bar', 4),
    cannon: W('and the cannon shoots', 2),
    shoots: W('and the cannon shoots', 3),
    disappears: T('The rocket disappears'),
    disW: W('The rocket disappears', 2),
    raoScreenE: E('on Rao’s screen', 2),
    described: T('Stocco described the feeling'),
    something: T('something like a nervous tic'),
    nervous: T('nervous tic'),
    ticE: E('nervous tic', 1),
    imagine: T('Imagine being the controller'),
    controller: W('Imagine being the controller', 3),
    missing: T('missing the entire game'),
    game: W('missing the entire game', 3),
    gameE: E('missing the entire game', 3),
    // derived (filled below)
    jerk: 0,
    drop: 0,
    contact: 0,
    cut: 0,
    hit: 0,
    ecu: 0,
  };
  c.jerk = c.jerks + 0.01; // the wrist extension starts on "jerks"
  c.drop = c.comes + 0.06; // the hand starts to fall on "comes"
  c.contact = c.down + 0.04; // the pad lands on the space bar on "down"
  c.cut = c.contact + 3 / 30; // cut to the cannon on the bottom of the key travel
  c.hit = c.shoots + 0.02; // the shot meets the rocket on "shoots"
  c.ecu = c.hisHand + 0.2; // cut from the anatomy path into the hand ECU
  return c;
};
let memo: ReturnType<typeof build> | null = null;
export const ct = () => (memo ??= build());

// ---------------------------------------------------------------- the game clock
// The rocket launches on "rocket" at normal speed, then the game drops into slow motion while the route is
// explained. While the game is off camera it catches up so that the cannon has aimed when the press cuts back; the
// shot then flies in slow motion (tracked by the camera) and meets the rocket on "shoots".
export const G_DUR = 3.4;
export const G_FIRE = 2.35;
const V_SLOW = 0.055;
const OFF = 62.0; // the game is off camera from here until the cut
const integ = (v: (t: number) => number, a: number, b: number) => {
  if (b <= a) return 0;
  const n = Math.max(1, Math.ceil((b - a) * 40));
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += v(a + (i + 0.5) * h);
  return s * h;
};
const v1 = (t: number) => 1 + (V_SLOW - 1) * smooth(clamp((t - (ct().rocket + 0.62)) / 0.7));
let gOff: number | null = null;
export const gameClock = (t: number) => {
  const c = ct();
  if (t < c.rocket) return t - c.rocket;
  if (t <= OFF) return integ(v1, c.rocket, t);
  gOff ??= integ(v1, c.rocket, OFF);
  if (t < c.cut) return gOff + (G_FIRE - gOff) * smooth(clamp((t - OFF) / (c.cut - OFF)));
  const SHOT_V = 0.32 / (c.hit - c.cut);
  const v2 = (s: number) => (s < c.hit ? SHOT_V : SHOT_V + (0.5 - SHOT_V) * smooth(clamp((s - c.hit) / 0.35)));
  return G_FIRE + integ(v2, c.cut, t);
};

// ---------------------------------------------------------------- the BCI cursor (0 bottom .. 1 FIRE target)
export const cursorAt = (t: number) => {
  const c = ct();
  const idle = 0.06 + 0.025 * Math.sin(t * 2.3) + 0.012 * Math.sin(t * 5.1);
  const c0 = c.cursor - 0.05, c1 = c.target + 0.02;
  if (t < c0) return idle;
  if (t < c1) {
    const p = clamp((t - c0) / (c1 - c0));
    // climbs in steps as the rhythm stays low: a small dip a third of the way, then the final rise
    const climb = smooth(p) * 0.7 + p * 0.3;
    const wob = 0.06 * Math.sin(p * 15) * (1 - p) * p * 4;
    return clamp(idle * (1 - p) + climb + wob, 0, 1);
  }
  const back = smooth(clamp((t - (c.target + 1.6)) / 1.2));
  return 1 + (idle - 1) * back;
};

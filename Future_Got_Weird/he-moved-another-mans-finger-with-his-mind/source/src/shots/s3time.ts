// S3 "the route": every time in the sequence, placed from the measured narration (never estimated seconds),
// plus the slowed game clock and the BCI cursor height.
import {clamp, smooth} from '../dc/math';
import {T, WORDS, wi} from '../lib/core';

/** start time of word k of `phrase` */
const W = (phrase: string, k = 0) => WORDS[wi(phrase) + k].start;

type TM = ReturnType<typeof build>;
let memo: TM | null = null;
const build = () => {
  const m = {
    start: T('Watch what happens on a rocket') - 0.45,
    end: T('There’s a detail I love') - 0.5,
    launch: W('Watch what happens on a rocket', 5) - 0.05,
    imagines: T('Rao imagines moving'),
    stays: T('His real hand stays put'),
    cap: T('But under that cap'),
    capW: W('But under that cap', 3),
    rhythm: T('the rhythm of his brain'),
    changes: W('brain activity changes', 2),
    computer: T('A computer is watching'),
    screen: T('On his screen'),
    cursorW: T('a little cursor climbs'),
    target: W('When it hits the target', 4),
    sends: T('the computer sends one command'),
    command: W('sends one command', 2),
    internet: W('over the internet', 2),
    fire: W('over the internet', 3),
    across: T('Across campus, a magnetic coil'),
    coil: T('a magnetic coil sits'),
    brain: W('Stocco’s brain that helps', 1),
    rightHand: T('helps move his right hand'),
    trigger: T('The command triggers a pulse'),
    pulse: W('The command triggers a pulse', 4),
    hisHand: T('His hand jerks up'),
    jerks: W('His hand jerks up', 2),
    comes: T('comes down on the space bar'),
    down: W('comes down on the space bar', 1),
    cannon: T('and the cannon shoots'),
    disappears: T('The rocket disappears'),
    described: T('Stocco described the feeling'),
    tic: T('nervous tic'),
    imagine: T('Imagine being the controller'),
    missing: T('missing the entire game'),
    game: W('missing the entire game', 3),
    // derived
    contact: 0,
    cut: 0,
    jerk: 0,
    handCut: 0,
  };
  m.contact = m.down - 0.1; // fingertip lands on the space bar ("comes down")
  m.cut = m.contact + 2 / 30; // cut on the click, two frames after contact
  m.jerk = m.jerks - 0.05; // the wrist extension starts on "jerks"
  m.handCut = m.hisHand - 0.1; // cut from the back view to the hand close-up
  return m;
};
export const tm = (): TM => (memo ??= build());

// ---------------------------------------------------------------- the game clock
// The game runs at normal speed for the launch, then in slow motion while the route is explained. While Rao's
// screen is off camera (campus to the hand close-up) it catches up so that the cannon has aimed when we cut back on
// the click; the shot then flies in slow motion and the game returns to normal speed after the hit.
export const G_FIRE = 2.35; // game time of the shot (rocket near u = 0.69, past the apex, falling on the city)
export const G_DUR = 3.4;
const V_SLOW = 0.03;
const OFF = 64.3; // Rao's screen is too small to read from here on
const v1 = (t: number) => {
  const m = tm();
  if (t < m.imagines - 0.5) return 1;
  return 1 + (V_SLOW - 1) * smooth(clamp((t - (m.imagines - 0.5)) / 0.8));
};
const integ = (v: (t: number) => number, a: number, b: number) => {
  if (b <= a) return 0;
  const n = Math.max(1, Math.ceil((b - a) * 60));
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += v(a + (i + 0.5) * h);
  return s * h;
};
const SHOT_V = 0.25;
const v2 = (dt: number) => {
  const hit = 0.32 / SHOT_V;
  if (dt < hit) return SHOT_V;
  return SHOT_V + (1 - SHOT_V) * smooth(clamp((dt - hit) / 0.6));
};
/** game time at real time t (s) */
export const gameClock = (t: number) => {
  const m = tm();
  if (t < m.launch) return t - m.launch;
  if (t <= OFF) return integ(v1, m.launch, t);
  const g1 = integ(v1, m.launch, OFF);
  if (t < m.cut) return g1 + (G_FIRE - g1) * smooth(clamp((t - OFF) / (m.cut - OFF)));
  return G_FIRE + integ(v2, 0, t - m.cut);
};
/** real time of the rocket hit */
export const hitTime = () => tm().cut + 0.32 / SHOT_V;

// ---------------------------------------------------------------- the BCI cursor (0 bottom .. 1 FIRE target)
export const cursorAt = (t: number) => {
  const m = tm();
  const idle = 0.05 + 0.025 * Math.sin(t * 2.3) + 0.012 * Math.sin(t * 5.1);
  const c0 = m.cursorW + 0.05, c1 = m.target - 0.04;
  if (t < c0) return idle;
  if (t < c1) {
    const p = clamp((t - c0) / (c1 - c0));
    const climb = p * p * (3 - 2 * p) * 0.55 + p * 0.45;
    const wob = 0.05 * Math.sin(p * 17) * (1 - p) * p * 4;
    return clamp(idle * (1 - p) + climb + wob, 0, 1);
  }
  const back = smooth(clamp((t - (m.internet + 0.2)) / 1.0));
  return 1 + (idle - 1) * back;
};

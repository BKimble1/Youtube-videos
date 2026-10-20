// V4 shot plan: every cut is a word time of the approved narration (lib/timeline.ts WORDS) or a small offset from one.
// 28.000 s, 840 frames at 30 fps. Each shot says what it SHOWS and why the cut happens (a new fact).
import {WORDS} from '../lib/timeline';

export const FPS = 30;
export const TOTAL4 = 840;
export const DUR = TOTAL4 / FPS;

const w = (i: number) => WORDS[i];
export const W = {
  brain: w(1).start,
  chip: w(2).start,
  lets: w(3).start,
  talk: w(5).start,
  someone: w(7).start,
  just: w(8).start,
  thinking: w(10).start,
  thinkingEnd: w(10).end,
  instead: w(11).start,
  vocal: w(14).start,
  cords: w(15).start,
  cordsEnd: w(15).end,
  the: w(16).start,
  reads: w(18).start,
  neural: w(19).start,
  impulses: w(20).start,
  inn: w(21).start,
  motor: w(23).start,
  cortex: w(24).start,
  cortexEnd: w(24).end,
  translating: w(25).start,
  thoughts: w(27).start,
  into: w(28).start,
  direct: w(29).start,
  messages: w(30).start,
  instantly: w(31).start,
  instantlyEnd: w(31).end,
  it: w(32).start,
  works: w(33).start,
  seamlessly: w(34).start,
  seamlesslyEnd: w(34).end,
  until: w(35).start,
  your: w(36).start,
  brain2: w(37).start,
  generates: w(38).start,
  an: w(39).start,
  intrusive: w(40).start,
  thought: w(41).start,
  thoughtEnd: w(41).end,
  humans: w(42).start,
  thousands: w(44).start,
  dark: w(46).start,
  unwanted: w(47).start,
  every: w(49).start,
  never: w(54).start,
  act: w(57).start,
  onEnd: w(58).end,
  the2: w(59).start,
  cant: w(61).start,
  difference: w(64).start,
  between: w(65).start,
  wanted: w(68).start,
  say: w(70).start,
  sayEnd: w(70).end,
  and: w(71).start,
  dark2: w(73).start,
  thought2: w(74).start,
  you: w(75).start,
  desperately: w(77).start,
  trying: w(78).start,
  bury: w(80).start,
  buryEnd: w(80).end,
};

export type ShotId =
  | 'macro'
  | 'extWide'
  | 'recvHey'
  | 'sendSmile'
  | 'neck'
  | 'matchImplant'
  | 'capture'
  | 'cortex'
  | 'decoder'
  | 'intWide'
  | 'intTwo'
  | 'sendFalter'
  | 'redNeural'
  | 'subjective'
  | 'reality'
  | 'sendReject'
  | 'handCup'
  | 'swarm'
  | 'calmTwo'
  | 'mechanism'
  | 'realize'
  | 'signal'
  | 'recvRecog'
  | 'withdraw'
  | 'sendRegister'
  | 'macroEnd';

export type Shot = {id: ShotId; a: number; b: number; why: string};

/** cut times (s). The list is contiguous: each shot ends where the next begins. */
const CUTS: [ShotId, number, string][] = [
  ['macro', 0, 'arresting open: the implant disc, pulsing as "brain chip" is said'],
  ['extWide', 0.7, 'who and where: two people outside a small café, the sender arrives'],
  ['recvHey', 1.8, 'the silent greeting arrives at her point of view; she looks up and answers'],
  ['sendSmile', 2.55, 'reverse: the sender, pleased; the implant glows'],
  ['neck', 3.3, 'not the vocal cords: a throat cutaway, still and silent'],
  ['matchImplant', 4.7, 'match cut: the open glottis becomes the implant disc; section of the device in the skull'],
  ['capture', 5.6, 'impulse capture: a neuron fires and the electrode tip picks it up'],
  ['cortex', 6.95, 'where: the motor strip of the cortex lights, the implant above it'],
  ['decoder', 8.3, 'decoding: spikes enter the chip and leave as a clean message'],
  ['intWide', 9.9, 'new place: seated inside the café; the message arrives at her, effortlessly'],
  ['intTwo', 11.3, 'closer: an easy exchange, cups, a shared smile; his smile starts to fail'],
  ['sendFalter', 12.9, 'the sender freezes: something is wrong'],
  ['redNeural', 13.55, 'inside: a red disturbance in the cortex; the chip flags it'],
  ['subjective', 14.15, 'one subjective image: her chair tipping, a cup breaking (red, a blink long)'],
  ['reality', 14.65, 'abrupt return: she is fine, sipping; he is not'],
  ['sendReject', 15.35, 'he rejects the thought: eyes shut, head shake'],
  ['handCup', 16.75, 'his hand tightens on the cup, then pulls away; hers is easy and unaware'],
  ['swarm', 18.05, 'inside: thousands of dim unwanted impulses; the electrodes sample them all'],
  ['calmTwo', 19.45, 'back: she is untroubled, he composes himself: never intended to act on'],
  ['mechanism', 21.3, 'the flaw: intended and unwanted patterns get the same treatment in the chip'],
  ['realize', 24.05, 'he realizes the chip has caught what he buried'],
  ['signal', 24.95, 'the brief signal: his implant pulses, the cut lands on her'],
  ['recvRecog', 25.35, 'she reads it: the smile goes, the freeze; "Message Delivered" beside the reaction'],
  ['withdraw', 26.2, 'she draws back, the chair slides; he watches the relationship change'],
  ['sendRegister', 26.8, 'his face as it lands; the camera falls into his implant (match cut to the opening)'],
  ['macroEnd', 27.4, 'match cut back to the opening composition: the implant, uneasy'],
];

export const SHOTS: Shot[] = CUTS.map(([id, a, why], i) => ({id, a, b: i + 1 < CUTS.length ? CUTS[i + 1][1] : DUR, why}));

export const shotAt = (t: number): Shot => {
  for (const s of SHOTS) if (t >= s.a - 1e-6 && t < s.b - 1e-6) return s;
  return SHOTS[SHOTS.length - 1];
};

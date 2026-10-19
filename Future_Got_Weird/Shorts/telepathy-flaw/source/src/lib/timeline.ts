// The one cue authority for the Telepathy Flaw Short. Word times come from the selected ElevenLabs take
// (data/narration_words_final.json, written by tools/build_voice.py); every beat below is a word time, so the
// picture, the captions, the effects and the mix all read the same numbers. Frames are 30 fps, 900 in total.
import data from '../data/narration_words_final.json';

export const FPS = 30;
export const TOTAL = 900;

export type Word = {i: number; text: string; start: number; end: number; sentence: number};
export const WORDS: Word[] = data.words as Word[];

export const fr = (sec: number) => Math.round(sec * FPS);
/** start / end (seconds) of the narration word with this index (0-80, script order; see narration_words_final.json) */
const s = (i: number) => WORDS[i].start;
const e = (i: number) => WORDS[i].end;

/** Beat table in seconds (taken from the narration) */
export const T = {
  speechStart: s(0),
  thinkingE: e(10),
  insteadS: s(11),
  cordsS: s(15),
  cordsE: e(15),
  readsS: s(18),
  impulsesS: s(20),
  motorS: s(23),
  cortexS: s(24),
  cortexE: e(24),
  translatingS: s(25),
  thoughtsS: s(27),
  directS: s(29),
  messagesS: s(30),
  instantlyS: s(31),
  instantlyE: e(31),
  itS: s(32),
  worksS: s(33),
  seamlesslyE: e(34),
  untilS: s(35),
  untilE: e(35),
  brainS: s(37),
  intrusiveS: s(40),
  thoughtS: s(41),
  thoughtE: e(41),
  humansS: s(42),
  thousandsS: s(44),
  darkS: s(46),
  neverS: s(54),
  actS: s(57),
  onE: e(58),
  theS: s(59),
  cantS: s(61),
  differenceS: s(64),
  wantedS: s(68),
  sayS: s(70),
  sayE: e(70),
  andS: s(71),
  dark2S: s(73),
  thought2S: s(74),
  desperatelyS: s(77),
  buryS: s(80),
  buryE: e(80),
};

/** Visual beats (seconds): the storyboard retimed to the actual speech. */
export const B = {
  // sender head close-up, controlled turn; skull cutaway sweeps; threads; pulse follows the threads
  cutawayFrom: 0.62,
  cutawayTo: 1.9,
  followPulse: 1.9,
  // the hook: the thought message leaves the chip and arrives (recipient notices)
  sendHook: 2.45,
  arriveHook: 3.35,
  pullOutFrom: 2.55,
  pullOutTo: 3.55,
  // vocal cords, then back up to the brain
  neckFrom: T.insteadS - 0.1,
  neckTo: T.cordsE + 0.15,
  toBrain: T.cordsE + 0.1,
  // signals, motor cortex, packet, "Hey"
  signals: T.readsS - 0.1,
  motor: T.motorS - 0.15,
  packetForms: T.translatingS - 0.05,
  heyForms: T.thoughtsS + 0.1,
  sendNormal: T.directS - 0.05,
  arriveNormal: T.instantlyE - 0.25,
  // seamless -> until -> intrusion
  seamless: T.itS,
  redPulse: T.untilS - 0.05,
  silhouetteIn: T.brainS + 0.1,
  silhouetteOut: T.thoughtE + 0.45,
  redEnters: T.thoughtS + 0.1,
  warnIn: T.thoughtE + 0.12,
  warnOut: T.thoughtE + 1.9,
  fragments: T.humansS + 0.8,
  redLeaves: T.thousandsS + 0.9,
  rejectFrom: T.neverS - 0.2,
  cancelReach: T.neverS + 0.3,
  cancelTap: T.onE + 0.1,
  matchCut: T.theS,
  overtake: T.differenceS - 0.15,
  receiverCut: T.dark2S - 0.35,
  redArrives: T.desperatelyS + 0.1,
  delivered: T.desperatelyS + 0.2,
  lateCancel: T.buryE + 0.45,
  drawBack: T.buryS - 0.2,
  wipeFrom: T.buryE - 0.05,
  wipeTo: 29.45,
};

export const FICTION_CUE = {from: 0.1, to: 2.9};

export const seconds = (f: number) => f / FPS;

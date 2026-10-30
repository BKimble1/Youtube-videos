// Every visual event is keyed to a measured word time (data/timeline.json via lib.word), so picture and narration
// stay locked. Times in seconds.
import {word, DUR} from './lib';

const w = (s: string, n = 0) => word(s, n).start;
const we = (s: string, n = 0) => word(s, n).end;

export const TM = {
  doctors: w('doctors'), tooth: w('tooth'), mans: w("man's"), eye1: w('eye…'), see1: w('see'), again1: w('again.'), again1e: we('again.'),
  his: w('his'), cornea: w('cornea'), damaged1: w('damaged,'), normal: w('normal'), transplant: w('transplant'), wouldnt: w("wouldn't"), work: w('work.'), worke: we('work.'),
  so: w('so', 1), removed: w('removed'), one: w('one'), teeth: w('teeth'), piece: w('piece'), bone: w('bone,'), bonee: we('bone,'),
  drilled: w('drilled'), hole: w('hole'), through: w('through'), fitted: w('fitted'), clear: w('clear'), lens: w('lens'), inside: w('inside', 1), insidee: we('inside', 1),
  they: w('they', 0), tucked: w('tucked'), beneath: w('beneath'), skin: w('skin'), other: w('other'), months: w('months,'), monthse: we('months,'),
  letting: w('letting'), tissue: w('tissue'), grow: w('grow'), around: w('around'), ite: we('it', 2),
  then: w('then'), implanted: w('implanted'), damaged2: w('damaged', 1), eye3: w('eye', 2), eye3e: we('eye', 2),
  allowing: w('allowing'), light: w('light'), reach: w('reach'), retina: w('retina.'), retinae: we('retina.'),
  after: w('after'), ten: w('ten'), years: w('years'), blind: w('blind…'), blinde: we('blind…'),
  he2: w('he', 1), see2: w('see', 1), again2: w('again.', 1), again2e: we('again.', 1),
  END: DUR,
};

/** sound-design events (exported to audio/cues.json for tools/make_audio.py) */
export const EV = {
  reveal: 0.0,
  lumen: 2.55,
  raysIn: 2.86, retinaLit1: 3.47,
  rewind: 4.55, scatter: 5.4, donorIn: 6.55, donorSeat: 7.2, cloud: 7.62,
  jawOpen: 8.55, saw1: 9.12, saw1e: 9.95, elevator: 10.22, lift: 10.48,
  saw2: 11.02, saw2e: 11.45, offcut: 11.42, drill: 11.72, drille: 12.32, click: 13.9,
  incision: 14.95, tuck: 15.3, suture: 15.95, monthsA: 16.95, monthsB: 17.75, growA: 17.9, growB: 19.25,
  reopen: 19.45, lift2: 19.7, flap: 21.0, trephine: 21.28, seat: 21.95, flapBack: 22.05,
  raysIn2: 22.62, retinaLit2: 23.82, retinaDive: 24.0,
  povDark: 24.75, povClear: 26.55, reaction: 27.45, loopPush: 27.95,
};

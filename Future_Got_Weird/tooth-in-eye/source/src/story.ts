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

/** V3 sound-design events (exported to audio/cues.json for tools/make_audio.py); times match Scene3.tsx */
export const EV = {
  reveal: 0.0, dissolve: 0.6, raysIn: 1.02, retinaLit1: 1.85, glimpse: 3.34, glimpseEnd: 4.36,
  penOn: 4.72, donorIn: 6.62, reflex: 6.78, cloud: 7.22,
  retract: 7.95, saw1: 8.6, saw1e: 9.3, elevator: 9.4, lift: 9.72,
  saw2: 10.38, saw2e: 10.78, offcut: 10.98, drill: 11.12, drille: 11.64, click: 13.12,
  incision: 13.94, tuck: 14.24, suture: 15.0, monthsA: 15.85, monthsB: 16.6, growA: 17.1, growB: 18.2,
  lift2: 18.5, flap: 19.95, trephine: 20.15, seat: 20.72, flapBack: 20.78,
  raysIn2: 21.2, retinaLit2: 22.3, povDark: 22.95, povClear: 24.05, reaction: 25.09,
};

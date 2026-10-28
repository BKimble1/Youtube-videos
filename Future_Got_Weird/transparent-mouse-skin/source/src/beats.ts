// Every story beat, in seconds, derived from the measured narration words (lib.ts). The picture (Film.tsx) and the
// sound (tools/make_audio.py, via tools/export_beats.ts -> audio/beats.json) read the same table.
import {DURATION, we, ws} from './lib';

export const B = {
  // S1 treated result (one continuous shot)
  pushStart: 0.4,
  pushEnd: we('underneath', 0) + 0.15,
  angle0: ws('without'), // a slight angle/lighting change over the intact surface
  sweep0: ws('without') + 0.12,
  sweep1: we('cut') + 0.05,
  // S2 application (earlier; matched framing)
  cutEarlier: 7.0,
  swabIn: 7.02,
  swabContact: ws('food'),
  swabLift: we('skin', 1) + 0.05,
  swabOut: we('skin', 1) + 0.5,
  // S3 call-out into the skin section
  callout0: ws('see') + 0.02,
  callout1: ws('see') + 0.95,
  water: ws('water'),
  fat: ws('fat', 0),
  bend: ws('bend', 0),
  scatter: ws('scattering'),
  hide: ws('hiding'),
  dyeIn: ws('dye', 1),
  watery: ws('watery'),
  rebend: ws('bend', 1),
  likeFat: ws('behave'),
  settled: we('fat', 1),
  camBack0: we('fat', 1) + 0.05, // the camera starts home as the explanation completes
  camBack1: ws('washed') + 0.38,
  calloutBack0: ws('then') - 0.12,
  calloutBack1: ws('then') + 0.55,
  // S4 rinse and return to opaque
  rinse0: ws('washed') + 0.34,
  rinse1: we('away') + 0.15,
  timelapse0: ws('washed') + 0.42,
  hide0: ws('and', 3) - 0.1,
  hide1: we('again') - 0.15,
  timelapse1: we('again') - 0.05,
  pullOut0: we('again') - 0.35,
  end: DURATION,
};

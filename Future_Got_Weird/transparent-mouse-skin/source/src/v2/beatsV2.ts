// V2 beats (seconds), all derived from the measured narration (the same accepted take as V1). Shared with the mix.
import {DURATION, we, ws} from '../lib';

export const B2 = {
  // H: hook: tight on the abdomen, the swab sweeping and the clear window spreading behind it
  hookEnd: ws('and', 0) - 0.05,          // 2.80
  swabDone: we('transparent') - 0.15,    // the track is covered as "transparent" resolves
  swabOut: ws('and', 0) + 0.1,
  // T: low three-quarter view (tilt) over the intact surface
  tilt0: ws('and', 0) - 0.12,
  tilt1: ws('organs', 0) + 0.15,
  // C: closer to the organs working
  close0: ws('moving', 0) - 0.1,
  close1: we('underneath', 0) + 0.2,
  // O: outside, whole mouse, intact
  outside: ws('without') - 0.02,         // a cut to a new composition
  // W: wipe back in time, following the gloved hand
  wipe0: we('cut') + 0.08,
  wipe1: ws('rubbed') + 0.3,
  // M: method: food colouring -> dish -> swab -> skin
  dish0: ws('rubbed') + 0.2,
  dropFall: ws('food') + 0.12,
  dropLand: ws('dye', 0) + 0.12,
  dip0: ws('solution') + 0.1,
  dip1: ws('solution') + 0.4,
  toSkin0: ws('onto') - 0.05,
  contact: ws('skin', 1) - 0.08,
  rubEnd: ws('see') - 0.1,
  // Z: zoom through the spreading liquid into the tissue
  zoom0: we('skin', 1) - 0.05,
  zoom1: ws('water') - 0.02,
  // micro journey
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
  out0: we('fat', 1) - 0.25,
  out1: ws('then') - 0.12,
  // R: rinse and reversal
  bottleIn: ws('then') - 0.1,
  rinse0: ws('washed') - 0.02,
  rinse1: we('away') + 0.2,
  hide0: ws('and', 3) - 0.05,
  hide1: we('again') - 0.12,
  pull0: we('away') + 0.1,
  normal: we('again') + 0.02,
  // L: loop reframe into the opening
  loop0: we('again') + 0.62,
  end: DURATION,
};

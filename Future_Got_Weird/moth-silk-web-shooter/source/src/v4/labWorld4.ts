// V3 lab (from V2's): one bench seen from the side, at true scale (20 world px = 1 cm), everything in front of the lead and
// running right to left in the order the material travels: cocoon dish -> beaker of silk solution -> syringe pump
// (silk syringe in front, acetone syringe behind) -> tubes -> handheld coaxial nozzle -> 12 cm gap -> blade half
// buried in a dish of sand -> tray. A spare cocoon lies by the tray. Values are pure functions of the frame.
import {V} from './dc/math';

export const CM = 20;
export const BENCH_Y = 1310;

export const COCOON_DISH = {x: 1300, w: 120, h: 22};
export const BEAKER = {x: 1168, w: 100, h: 136, level0: 0.52};
export const PUMP = {x0: 884, x1: 1092, top: 1200};
/** syringes on the pump: barrel from x0 (tip end) to x1 (flange), centre line y, radius */
export const SYR_SILK = {x0: 904, x1: 1052, y: 1180, r: 14};
export const SYR_ACE = {x0: 912, x1: 1060, y: 1150, r: 12};
/** the nozzle: axis from the rear (inlets) to the tip; 13 cm long */
export const NOZ = {rear: {x: 856, y: 1158} as V, tip: {x: 600, y: 1196} as V, r: 8.5, rTip: 3.2};
export const SAND = {x: 330, w: 180, wall: 44, surf: 1273};
/** the blade at rest: buried tip T, exposed end E (two thirds buried) */
export const BLADE_T = {x: 300, y: 1302} as V;
export const BLADE_E = {x: 372, y: 1258} as V;
export const BLADE_LEN = 84;
export const TRAY = {x0: -200, x1: 100, h: 28};
export const SPARE_COCOON = {x: 172, y: BENCH_Y - 15};

/** the glass stirring rod at rest, leaning in the beaker (its top above the rim, its foot on the beaker floor) */
export const ROD = {top: {x: BEAKER.x + 34, y: BENCH_Y - BEAKER.h - 74} as V, foot: {x: BEAKER.x - 14, y: BENCH_Y - 9} as V, r: 3};

/** key frames of the lab (film frames at 30 fps), conformed to the narration; V4: every beat starts while the
 *  previous one is still moving (the visual runs slightly ahead of the words) */
export const LT4 = {
  match: 120, fade: 126, reveal1: 156,
  // the cocoon: the hand already travelling to the dish at the match; pinch, lift, its fibres separate in the close
  // view, carried to the beaker, set on the solution, let go
  reach0: 120, pinch: 200, lift1: 214, tease0: 214, tease1: 252, ccarry1: 272, touchLiquid: 279, release: 282, withdraw: 287,
  // the rod: grip, stir (the liquid circulates, the silk loses its structure), let go
  rod0: 292, stir0: 296, stir1: 328, rodOff: 331, dissolve0: 283, dissolve1: 334,
  // the pump: index on the button, the solution drawn up into the syringe and pushed on to the nozzle
  press: 336, draw0: 338, draw1: 352, push0: 350,
  // the nozzle: entered with the silk already flowing in the core; acetone round it; the fibre forms at the outlet
  cut0: 362, cut1: 370, silk0: 358, silk1: 388, ace0: 396, ace1: 426, harden0: 438, exit: 464,
  // the fibre: contact, slack drawn out, regrip, pull, lift
  fcontact: 566, settle1: 596, regrip0: 600, regrip1: 612, pull0: 619, taut: 636, lift0: 645, out: 690,
  // the load on the thin fibre, guided to the tray, set down and released
  junction1: 712, upFibre1: 712, carry0: 712, carry1: 788, lower0: 788, touch: 808, flat: 822, release2: 828,
  // the end: the bench view past the source cocoon, on to the nozzle's outlet and into frame 0
  back0: 832, cocoon0: 862, push: 896, swing0: 942, end: 951,
};

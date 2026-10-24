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

/** the glass stirring rod resting in the beaker (top, and its foot on the beaker floor) */
export const ROD = {top: {x: BEAKER.x + 40, y: BENCH_Y - BEAKER.h - 38} as V, foot: {x: BEAKER.x - 8, y: BENCH_Y - 10} as V, r: 3};

/** key frames of the lab (film frames at 30 fps), conformed to the narration */
export const LT3 = {
  reveal0: 165, reveal1: 212,
  reach0: 212, contact: 236, lift1: 250, tease0: 252, tease1: 272,
  carry1: 286, touchLiquid: 290, release: 293, withdraw: 299,
  rod0: 300, stir0: 307, stir1: 333, rodOff: 338,
  dissolve0: 294, dissolve1: 336,
  press: 340, draw0: 342, draw1: 360,
  push0: 358, cut0: 372, cut1: 388, silk0: 368, silk1: 396, ace0: 402, ace1: 436,
  harden0: 446, exit: 470, fcontact: 566, settle1: 598,
  pull0: 619, taut: 640, lift0: 652, out: 694,
  carry0: 772, carry1: 816, lower0: 818, touch: 838, flat: 850,
  back0: 856, raise0: 892, end: 951,
};

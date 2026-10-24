// V2 lab: one bench seen from the side, at true scale (20 world px = 1 cm), everything in front of the lead and
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
export const SPARE_COCOON = {x: 470, y: BENCH_Y - 15};

/** key frames of the lab (film frames at 30 fps), conformed to the narration */
export const LT2 = {
  reveal0: 165, reveal1: 214,
  pick0: 238, grasp: 252, lift: 260, drop: 288, release: 292,
  dissolve0: 292, dissolve1: 334,
  draw0: 318, draw1: 350,
  push0: 346, nozzle: 380, cut0: 380, cut1: 398,
  ace0: 402, ace1: 446,
  harden0: 448, exit: 470, flightEnd: 566,
  contact: 566, settle1: 600,
  pull0: 619, taut: 640, lift0: 652, out: 694,
  carry0: 700, carry1: 742,
  hang1: 824, lower0: 826, touch: 842, flat: 852,
  back0: 852, raise0: 896, end: 951,
};

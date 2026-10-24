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

/** key frames of the lab (film frames at 30 fps), conformed to the narration */
export const LT3 = {
  match: 150, fade: 156, reveal1: 206,
  // the cocoon: reach, pinch, lift (fibres drawn out), turned to the light, carried, set on the liquid, let go
  reach0: 206, pinch: 230, lift1: 244, tease1: 268, ccarry1: 282, touchLiquid: 287, release: 290, withdraw: 297,
  // the stirring rod: grip, stir (wrist ellipse), let go; the cocoon dissolves meanwhile
  rod0: 300, stir0: 305, stir1: 329, rodOff: 333, dissolve0: 290, dissolve1: 334,
  // the pump: index on the button, the solution drawn up into the syringe, then pushed on to the nozzle
  press: 340, draw0: 342, draw1: 356, push0: 356,
  // the nozzle cutaway: silk into the core, acetone into the outer channel; hardening at the outlet
  cut0: 366, cut1: 384, silk0: 374, silk1: 396, ace0: 398, ace1: 430, harden0: 444, exit: 470,
  // the fibre: contact, slack drawn out, regrip, pull, lift
  fcontact: 566, settle1: 598, regrip0: 604, regrip1: 614, pull0: 619, taut: 640, lift0: 652, out: 694,
  // the load: junction close-up, up the fibre, carried, lowered into the tray
  junction1: 734, upFibre1: 770, carry0: 772, carry1: 816, lower0: 818, touch: 838, flat: 850,
  // the end: slack, the cocoon, the aperture
  back0: 856, cocoon0: 868, push: 902, end: 951,
};

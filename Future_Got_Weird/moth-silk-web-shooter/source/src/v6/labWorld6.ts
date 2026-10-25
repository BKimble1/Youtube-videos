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

/** V5: the nozzle rests on a small stand until the hand picks it up */
export const STAND = {x: 770, top: 1176};
/** V5 cocoons are drawn larger (they read at bench distance) */
export const COC_LEN = 58;

/** key frames of the lab (film frames at 30 fps), conformed to the narration; every beat starts while the previous
 *  one is still moving */
export const LT6 = {
  match: 150, fade: 160, reveal1: 182,
  // the near hand: enters fast, opens, contacts, grips, lifts (overshoot, settle)
  enter0: 164, open: 182, contact: 191, grip1: 197, lift0: 197, lift1: 208, settle: 216,
  // the far hand: reaches, pinches a loose end, draws the thread out (the cocoon turns as it unwinds)
  rReach0: 202, rContact: 221, tPull0: 223, tPull1: 247,
  // both hands over the beaker: the thread dipped, the cocoon let go into the liquid
  ccarry0: 247, ccarry1: 265, dip: 268, drop: 273,
  // stir: one hand on the beaker, the other on the rod
  beakerGrip: 283, rodGrip: 284, stir0: 288, stir1: 324, rodOff: 327,
  // the pump (near hand) and the nozzle picked up from its stand (far hand)
  press: 336, draw0: 337, draw1: 350, push0: 348, nozReach0: 328, nozGrip: 343, nozLift1: 356,
  // extrusion at the tip
  // V6: the nozzle: the cutaway opens rear to front while the silk solution runs along the inner tube; acetone fills
  // the outer channel from the side port ("a surrounding layer of acetone"); a bead at the outlet; the jet drawn out
  // and setting ("triggers the silk to harden"); the strand leaves the close view at exit
  cut0: 376, cut1: 412, silk0: 378, silk1: 414, ace0: 401, ace1: 428, tip0: 432, bead0: 428, extrude0: 446, harden0: 452, exit: 488,
  // attach, tension, pull, resistance, release, lift
  fcontact: 566, settle1: 600, pull0: 619, breakFree: 652, out: 676, liftTop: 706,
  // V6: the load hangs from the fibre from the lift to the end: the close view under it and up the strand (hero0),
  // the reveal ("eighty times their own weight", reveal0) with a small tightening tug of the hand; at release the
  // hand eases and the nozzle starts turning toward the wrist shooter's outlet direction
  hero0: 712, reveal0: 772, tug: 788, release: 840,
  // the end: along the fibre to the outlet, then the wrist shooter
  follow0: 846, toDevice: 876, end: 951,
};

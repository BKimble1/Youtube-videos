// The lab bench in centimetres (x right, y down), one plane for everything on the bench; the back wall is a parallax
// layer behind it. The composition is a vertical stack, which is also the story's chain:
//   GAME monitor (top)  ->  CONTROL software monitor (middle)  ->  CL1 with the living culture (bottom)
// with the PC tower to the right of the CL1, cabled to both.
export type Pt = {x: number; y: number};
export const pt = (x: number, y: number): Pt => ({x, y});

export const GAME = {x0: -28, x1: 28, y0: -82.5, y1: -47.5}; // the game screen (16:10)
export const GAME_C = pt(0, -65);
export const CTRL = {x0: -20, x1: 20, y0: -42.5, y1: -17.5}; // the control-software screen (16:10)
export const BENCH_BACK = -5, BENCH_FRONT = 17;
// the CL1 (front view with the top seen from slightly above): a white base, a clear upper enclosure, a clear lid
export const CL1 = {x0: -10, x1: 26, top: -15, lidFront: -7, glassBottom: 1, base: 12, foot: 14.5};
export const CHIP = pt(8, -10.6); // the MEA carrier's centre, in the headstage under the lid
export const CHIP_K = 0.42; // the lid's foreshortening at lab scale
export const PC = {x0: 30, x1: 47, top: -32, bottom: 14.5};
export const UM = 1e-4; // cm per micrometre

/** the chip's squash for a camera of width w (cm): foreshortened at lab scale, flat (top-down) once the carrier fills */
export const chipK = (w: number) => {
  const a = Math.log(9), b = Math.log(2.2);
  const u = Math.min(1, Math.max(0, (a - Math.log(w)) / (a - b)));
  const e = u * u * (3 - 2 * u);
  return CHIP_K + (1 - CHIP_K) * e;
};
/** a chip point (um) in lab cm, for a camera of width w */
export const chipToLab = (x: number, y: number, w: number): Pt => pt(CHIP.x + x * UM, CHIP.y + y * UM * chipK(w));
/** UI units on the control screen (1600 x 1000) -> lab cm */
export const ui = (u: number, v: number): Pt => pt(CTRL.x0 + (u / 1600) * (CTRL.x1 - CTRL.x0), CTRL.y0 + (v / 1000) * (CTRL.y1 - CTRL.y0));

// signal routes (lab cm). Chip-relative stretches are given in um and converted per frame (the lid's squash).
export type RoutePt = {lab?: Pt; um?: [number, number]};
export const CABLE_CL1_PC: Pt[] = [pt(25.4, -8.8), pt(27.6, -8.2), pt(29, -6.4), pt(30.6, -5.6)];
export const CABLE_PC_CTRL: Pt[] = [pt(33.5, -32.2), pt(31, -36), pt(25.5, -33.5), pt(21.2, -30)];
export const HEAD_OUT = pt(14.2, -9.6); // the headstage's cable connector

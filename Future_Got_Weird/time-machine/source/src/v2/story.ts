// V2 timeline states and the camera chain. Shots join on characters' actions: his gaze (to the visor), a clean cut
// on a matched reflection, the capsule's window frame (portal), a watch -> wall-clock match cut, the room window (portal),
// foreground wipes in the yard, the friend's gaze up to the capsule, the friend's gesture, a doorframe wipe, his
// attention, and a push into the pre-departure print (loop).
import {clamp, keyS, lerp, ss} from '../lib';
import {Cam, keyCam, mixCam, toInner, Map2} from '../story';
import {V2} from './timing';
import {TS, helmetWorld} from './twoShot';
import {CAPSULE2, flightPath, noseRot} from './craft';
import {camCockpitOwn} from './cockpitShot';

export {V2};
export const DUR = 23.533;

// ---- 1-2: the close two-shot (opening and reunion share it) ------------------------------------------------------------
const Z_CLOSE = 3.55 / TS.s;
const HW0 = helmetWorld();
export const CAM_CLOSE: Cam = {x: (TS.ax + TS.fx) / 2, y: HW0.y + 8 * TS.s + (960 - 603) / Z_CLOSE, z: Z_CLOSE};
/** friend's age in the opening: young at frame 0 (the print), elderly by ~0.72 s, slow to start (already moving) */
export const hookAge = (t: number) => {
  const u = clamp(t / V2.ageEnd);
  return 0.02 + 0.98 * (u * u * (3 - 2 * u)) ** 0.92;
};
/** the hook's background time (street advances subtly) */
export const hookD = (t: number) => ss(t, 0.05, 0.85);
/** head tilt as his gaze rises from the hands to the visor */
export const headTilt = (t: number) => -9 * ss(t, V2.headTurn, V2.headTurn + 0.45);
/** the visor reflection: head-local placement (helmet centre), scale (head units per M) chosen so the hole fills the
 *  glass and the following space shot starts at >= 30 px/M */
export const VREFL = {rx: 0, ry: -8, k: 5.6};
export const reflOpacity = (t: number) => (t < V2.reflection ? 0 : t < V2.spaceCut ? lerp(0.12, 1, ss(t, V2.reflection, V2.spaceCut - 0.08)) : 1);
/** camera: hold the two-shot, then follow his head up to the glass */
const Z_VISOR = Z_CLOSE * 1.55;
export const camHook = (t: number): Cam => {
  const hw = helmetWorld(TS, headTilt(t));
  return keyCam(t, [
    [0, CAM_CLOSE],
    [V2.headTurn, {...CAM_CLOSE, z: Z_CLOSE * 1.02}],
    [V2.spaceCut, {x: hw.x + 2, y: hw.y - 6, z: Z_VISOR}],
  ]);
};
/** where the hole's centre is on screen at the cut (its reflection's centre), and the px/M there */
export const reflectionOnScreen = (t: number) => {
  const c = camHook(t);
  const tilt = headTilt(t);
  const a = (tilt * Math.PI) / 180;
  // head-local (rx, ry) -> rotated about (0, 50) -> character-local -> world
  const lx = VREFL.rx * Math.cos(a) - (VREFL.ry - 50) * Math.sin(a), ly = VREFL.rx * Math.sin(a) + (VREFL.ry - 50) * Math.cos(a) + 50;
  const wx = TS.ax + TS.s * lx, wy = TS.feet + TS.s * (-372 + ly);
  return {x: 540 + c.z * (wx - c.x), y: 960 + c.z * (wy - c.y), px: c.z * TS.s * VREFL.k};
};

// ---- 3: space ---------------------------------------------------------------------------------------------------------
const R0 = reflectionOnScreen(V2.spaceCut);
/** the space camera right after the cut: the hole exactly where its reflection was, at the same scale */
const CAM_SPACE0: Cam = {x: -(R0.x - 540) / R0.px, y: -(R0.y - 960) / R0.px, z: R0.px};
export const flightU = (t: number) => keyS(t, [[V2.flightStart, 0.12], [V2.approach, 0.66]], (x) => x * (2 - x) * 0.3 + x * 0.7);
export const camSpace = (t: number): Cam =>
  keyCam(t, [
    [V2.spaceCut, CAM_SPACE0],
    [2.75, {x: 0.0, y: -6.0, z: 40}],
    [V2.approach, {x: 2.6, y: -6.6, z: 40.5}],
    [V2.windowPass + 0.3, {x: 3.2, y: -6.8, z: 40.5}],
  ]);
/** the capsule in space: on the arc, then turning toward the camera and coming close (its window to the screen centre) */
export const APPROACH_GAIN = 70;
export const capsuleSpace = (t: number) => {
  const u = flightU(t);
  const p = flightPath(Math.min(u, 0.66));
  const g = ss(t, V2.approach, V2.windowPass);
  const k = Math.exp(Math.log(APPROACH_GAIN) * Math.pow(g, 1.9)); // perspective growth as it nears the camera
  const cam = camSpace(t);
  const sM = p.scale / CAPSULE2.height; // M per capsule unit
  const rotation = lerp(noseRot(p.ang), 0, ss(t, V2.approach, V2.approach + 0.55));
  const bank = Math.sin(Math.PI * ss(t, V2.approach, V2.windowPass)) * 0.7;
  // the window glass slides to the screen centre as it grows
  const ra = (rotation * Math.PI) / 180;
  const off = bank * 46; // Capsule2 slides its window by bank * 46 units
  const wl = {x: CAPSULE2.win.x + off, y: CAPSULE2.win.y};
  const wr = {x: wl.x * Math.cos(ra) - wl.y * Math.sin(ra), y: wl.x * Math.sin(ra) + wl.y * Math.cos(ra)};
  const target = {x: cam.x - wr.x * sM * k, y: cam.y + 0.6 - wr.y * sM * k};
  const m = ss(t, V2.approach + 0.05, V2.approach + 0.5); // the window reaches the screen centre before it grows large
  return {x: lerp(p.x, target.x, m), y: lerp(p.y, target.y, m), rot: rotation, s: sM * k, bank, flame: 1 - 0.7 * g, u};
};
/** space <- cockpit map through the capsule window (rotation 0 by then) */
export const COCKPIT_VIEW = {x: 540, y: 990, r: 1230};
export const windowMap = (t: number): Map2 => {
  const c = capsuleSpace(t);
  return {o: {x: c.x + CAPSULE2.win.x * c.s, y: c.y + CAPSULE2.win.y * c.s}, s: (CAPSULE2.win.r * c.s) / COCKPIT_VIEW.r, q: {x: COCKPIT_VIEW.x, y: COCKPIT_VIEW.y}};
};

// ---- 4: cockpit ---------------------------------------------------------------------------------------------------------
export const camCockpit = (t: number): Cam => mixCam(toInner(camSpace(t), windowMap(t)), camCockpitOwn(t), ss(t, V2.windowPass, V2.windowPass + 0.4));

export {keyS};

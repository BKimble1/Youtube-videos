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

// ---- 5: the home's wall clock (past) and the window -------------------------------------------------------------------
import {ROOM} from './room';
import {FA} from './cockpitShot';
/** the watch's screen circle at the match cut (cockpit camera at matchCut, FA.watch placement, watch r = 100 * s) */
const CK_END = camCockpitOwn(V2.matchCut);
export const WATCH_SCREEN = {x: 540 + CK_END.z * (FA.watch.x - CK_END.x), y: 960 + CK_END.z * (FA.watch.y - CK_END.y), r: 100 * FA.watch.s * CK_END.z};
const ZC = WATCH_SCREEN.r / ROOM.clock.r;
const CAM_CLOCK: Cam = {x: ROOM.clock.x - (WATCH_SCREEN.x - 540) / ZC, y: ROOM.clock.y - (WATCH_SCREEN.y - 960) / ZC, z: ZC};
/** the window glass as a portal: a 1080x1920 view of the yard scaled to the glass height, centred on the glass */
export const WIN_SC = ROOM.win.h / 1920;
export const WIN_CENTRE = {x: ROOM.win.cx, y: ROOM.win.cy};
export const camRoomPast = (t: number): Cam =>
  keyCam(t, [
    [V2.matchCut, CAM_CLOCK],
    [V2.panToWindow, {...CAM_CLOCK, z: ZC * 0.97}],
    [V2.windowPush, {x: WIN_CENTRE.x, y: WIN_CENTRE.y, z: 2.15}],
    [V2.windowCover, {x: WIN_CENTRE.x, y: WIN_CENTRE.y, z: 1 / WIN_SC}],
  ]);
/** the home clock races (years); minutes after 12:00 */
export const homeClockMinutes = (t: number) => {
  // matches the watch at the cut (11:00), then races: hour hand ~ one turn a second by the window (years)
  const x = Math.max(0, t - V2.matchCut);
  return 660 + 60 * (2.5 * x * x + 4 * Math.max(0, x - 0.25) ** 2);
};
export const homeClockBlur = (t: number) => ss(t, V2.matchCut + 0.08, V2.matchCut + 0.45);

// ---- 10-12: the family room (present) ---------------------------------------------------------------------------------
export const RS = ROOM.figScale; // astronaut scale in the room
export const ROOM_STOP_X = 1080;
/** his x in the room: walking in (continuing his walk from the yard, left to right), slowing to a stop by the sideboard */
export const roomAstroX = (t: number) => keyS(t, [[V2.doorPass - 0.3, 470 - 330], [V2.roomStop, ROOM_STOP_X]], (x) => 1 - (1 - x) * (1 - x) * (1 - 0.35 * x));
export const roomWalking = (t: number) => t < V2.roomStop - 0.05;
/** the wipe across the family photo's glass: 0..WIPE_MAX of ROOM.wipe (his reach) */
export const WIPE_MAX = 0.62;
export const dustWipeAt = (t: number) => WIPE_MAX * ss(t, V2.dustWipe - 0.12, V2.dustWipe + 0.38);
/** the family print's centre and the pre-departure print's centre (room px) */
export const FAM = {x: ROOM.photoFamily.print.x + ROOM.photoFamily.print.w / 2, y: ROOM.photoFamily.print.y + ROOM.photoFamily.print.h / 2};
export const FRI = {x: ROOM.photoFriend.print.x + ROOM.photoFriend.print.w / 2, y: ROOM.photoFriend.print.y + ROOM.photoFriend.print.h / 2};
export const Z_PRINT = 1080 / ROOM.photoFriend.print.w;
const HEAD_R = {x: ROOM_STOP_X, y: ROOM.floor - 372 * RS};
export const camRoomOwn = (t: number): Cam =>
  keyCam(t, [
    [V2.doorPassEnd, {x: roomAstroX(V2.doorPassEnd) + 120, y: 1100, z: 1.0}],
    [V2.roomStop, {x: 1010, y: 1110, z: 1.0}],
    [V2.reach, {x: 1150, y: 1120, z: 1.25}],
    [V2.dustWipe + 0.2, {x: 1235, y: 1130, z: 1.9}],
    [V2.faceTurn + 0.25, {x: (HEAD_R.x + FAM.x) / 2 + 10, y: HEAD_R.y + 30, z: 2.05}],
    [V2.photoClose, {x: FAM.x + 30, y: FAM.y - 6, z: 3.9}],
    [V2.watchBeside, {x: FAM.x + 40, y: FAM.y - 4, z: 4.35}],
    [V2.photoMove, {x: FAM.x + 40, y: FAM.y, z: 2.9}],
    [V2.photoPush, {x: (FAM.x + FRI.x) / 2 + 80, y: FRI.y, z: 3.2}],
    [DUR - 1 / 30, {x: FRI.x, y: FRI.y, z: Z_PRINT}, 'stop'],
  ]);
/** the print's tint and glass fade out as it fills the frame (the last frame equals frame 0) */
export const printTint = (t: number) => 0.35 * (1 - ss(t, V2.photoPush + 0.6, DUR - 1 / 30 - 0.12));
export const printGlass = (t: number) => 1 - ss(t, V2.photoPush + 0.5, DUR - 1 / 30 - 0.2);
/** his reflection on the family photo's glass */
export const reflOpRoom = (t: number) => 0.55 * ss(t, V2.photoClose - 0.2, V2.photoClose + 0.5) * (1 - ss(t, V2.photoMove, V2.photoMove + 0.4));

// ---- 6: decades in the yard ---------------------------------------------------------------------------------------------
// The camera trucks right across the same yard; the foreground trunk and leaves pass the lens and hide each jump.
export const YS = TS.s; // figure scale in the yard (as the two-shot)
export const FEET = TS.feet;
export const C_A: Cam = {x: 1000, y: 1300, z: 1.62};
/** stage of the friend's life: 0 young (spring), 1 middle-aged (autumn), 2 elderly (winter -> spring) */
export const yardStage = (t: number) => (t < V2.wipe1 ? 0 : t < V2.wipe2 ? 1 : 2);
export const yardD = (t: number) => lerp(0.04, 1, ss(t, V2.windowCover - 0.1, 11.0));
export const yardSeason = (t: number) => {
  // spring -> summer -> autumn -> winter -> the spring of his return, one continuous cycle
  const u = clamp((t - (V2.windowCover - 0.1)) / (11.1 - V2.windowCover + 0.1));
  return ((lerp(0.0, 1.16, u) % 1) + 1) % 1;
};
/** the friend through the decades: age, x, walking */
export const LAWN_Y = 1478; // feet on the lawn near the tree (behind the fence line)
export const friendYard = (t: number) => {
  const st = yardStage(t);
  if (st === 0) return {age: 0.06 + 0.05 * ss(t, V2.windowCover, V2.wipe1), x: 965, y: LAWN_Y, walk: 0, stride: 0};
  if (st === 1) {
    const u = ss(t, V2.wipe1 + 0.02, V2.wipe2 - 0.02);
    const x = lerp(1040, 1175, u);
    return {age: 0.47 + 0.07 * u, x, y: lerp(LAWN_Y + 30, 1560, u), walk: ((x - 1040) / (YS * 100)) * Math.PI, stride: 1};
  }
  return {age: 0.97 + 0.03 * ss(t, V2.wipe2, 11.0), x: TS.fx, y: FEET, walk: 0, stride: 0};
};
/** depth scale for a figure whose feet are at y (the yard's cabinet 2.5D: the house front is 7% smaller) */
export const depthAt = (y: number) => lerp(1, 0.93, clamp((1600 - y) / 220));

// ---- 7: the return ----------------------------------------------------------------------------------------------------
export const CAP_S = 0.93; // capsule scale in the yard (height ~560 px; hatch ~310 px for a ~300 px astronaut)
export const LAND = {x: 850, y: FEET + 62};
/** capsule height above its landing spot: falls on retro jets, decelerating into the landing */
export const capsuleYard = (t: number) => {
  const u = clamp((t - V2.descentStart) / (V2.landing - V2.descentStart));
  const y = lerp(LAND.y - 2300, LAND.y, 1 - (1 - u) * (1 - u) * (1 - u) * 0.15 - (1 - u) * (1 - u) * 0.85);
  return {x: LAND.x, y: t < V2.descentStart ? LAND.y - 2600 : y, retro: t < V2.landing ? 1 : 1 - ss(t, V2.landing, V2.landing + 0.25), legs: ss(t, V2.landing - 0.5, V2.landing - 0.15), hatch: ss(t, V2.hatch, V2.hatch + 0.2)};
};
export const HATCH_W = {x: LAND.x + CAPSULE2.hatch.x * CAP_S, y: LAND.y + CAPSULE2.hatch.y * CAP_S, rx: CAPSULE2.hatch.rx * CAP_S, ry: CAPSULE2.hatch.ry * CAP_S};
/** the astronaut steps out of the hatch, down to the pavement, and walks to his friend (feet y follows the ground) */
export const astroReturnX = (t: number) => keyS(t, [[V2.stepOut, HATCH_W.x - 10], [V2.stepDown, HATCH_W.x + 70], [V2.arrive, TS.ax]], (x) => x * x * (3 - 2 * x));
export const astroReturnFeet = (t: number) => lerp(LAND.y + CAPSULE2.sill * CAP_S + 6, FEET, ss(t, V2.stepOut + 0.05, V2.walkToFriend + 0.1));
export const camReturn = (t: number): Cam => {
  const cy = capsuleYard(t).y;
  return keyCam(t, [
    [V2.lightPass, {x: 1240, y: 1330, z: 1.5}],
    [V2.lookUp + 0.45, {x: 1150, y: 640, z: 1.05}],
    [12.05, {x: 1060, y: Math.min(1340, cy - 260), z: 1.02}],
    [V2.landing + 0.1, {x: 1030, y: 1345, z: 1.05}],
    [V2.walkToFriend, {x: 1060, y: 1345, z: 1.12}],
    [V2.clasp + 0.05, CAM_CLOSE],
  ]);
};

// ---- 9: to the door -------------------------------------------------------------------------------------------------------
import {yardPath} from './yard';
/** his walk to the door: to the gate, then up the garden path (feet on the path, a little smaller with depth) */
export const astroDoor = (t: number) => {
  const u = ss(t, V2.walkStart, V2.doorPassEnd + 0.1) ** 0.9;
  const p = yardPath(Math.min(0.92, u * 1.0));
  const lead = clamp(u * 6); // the first steps take him from his spot onto the path
  return {x: lerp(TS.ax, p.x, lead), y: lerp(FEET, p.y, lead), s: YS * lerp(1, p.depth, lead), u};
};
export const astroDoorX = (t: number) => astroDoor(t).x;
export const camDoor = (t: number): Cam => {
  const a = astroDoor(t);
  return keyCam(t, [
    [V2.gesture, CAM_CLOSE],
    [V2.walkStart, {...CAM_CLOSE, x: CAM_CLOSE.x + 6}],
    [V2.doorPass, {x: a.x + 30, y: a.y - 170, z: 2.55}],
    [V2.doorPassEnd, {x: a.x + 36, y: a.y - 170, z: 2.5}],
  ]);
};
/** the doorframe wipe: the jamb's screen x (it crosses the lens right to left as the camera passes the doorway) */
export const jambX = (t: number) => lerp(1200, -140, ss(t, V2.doorPass, V2.doorPassEnd));
/** the room camera that puts him at the same screen place and size as in the yard during the wipe */
export const camRoomMatched = (t: number): Cam => {
  const cy = camDoor(t);
  const a = astroDoor(t);
  const sx = 540 + cy.z * (a.x - cy.x), sy = 960 + cy.z * (a.y - cy.y);
  const z = (a.s * cy.z) / RS;
  const rx = roomAstroX(t);
  return {x: rx - (sx - 540) / z, y: ROOM.floor - (sy - 960) / z, z};
};
export const camRoom = (t: number): Cam => (t < V2.doorPassEnd ? camRoomMatched(t) : mixCam(camRoomMatched(t), camRoomOwn(t), ss(t, V2.doorPassEnd, V2.doorPassEnd + 0.35)));

// ---- sound cues (tools/export_cues_v2.ts) ---------------------------------------------------------------------------
import {footfalls} from './walk';
export const FRIEND_STEPS = footfalls((t) => friendYard(t).x, V2.wipe1 + 0.02, V2.wipe2 - 0.02, YS);
export const ASTRO_STEPS = [V2.stepDown, ...footfalls(astroReturnX, V2.stepDown + 0.05, V2.arrive, YS)];
export const DOOR_STEPS = footfalls(astroDoorX, V2.walkStart, V2.doorPassEnd, YS * 0.96);
export const ROOM_STEPS = footfalls(roomAstroX, V2.doorPassEnd, V2.roomStop, RS);
/** the capsule's screen side through the flight (-1 left .. 1 right) */
export const capsulePanTrack = () => {
  const out: [number, number][] = [];
  for (let t = V2.flightStart; t <= V2.windowPass; t += 0.05) {
    const c = capsuleSpace(t), cam = camSpace(t);
    out.push([Math.round(t * 100) / 100, Math.max(-1, Math.min(1, (c.x - cam.x) * cam.z / 540))]);
  }
  return out;
};
export const descentPanTrack = (): [number, number][] => [[V2.descentStart, -0.35], [V2.landing, -0.3]];

// ---- decades camera: trucks right; wipes at V2.wipe1 / V2.wipe2 (aligned to the foreground cover once the yard exists)
export const camDecades = (t: number): Cam =>
  keyCam(t, [
    [V2.windowCover, C_A],
    [11.25, {x: 1250, y: 1360, z: 1.52}],
  ]);
/** the foreground trunk and leaves are tied to the camera x at each wipe, so each fully covers the friend then */
export const FG_TRUNK_X = camDecades(V2.wipe1).x, FG_LEAVES_X = camDecades(V2.wipe2).x;
/** the near-camera pieces' parallax gain: high, so each sweeps across the frame in ~0.4 s and covers only briefly */
export const FG_ZOOM = 14;

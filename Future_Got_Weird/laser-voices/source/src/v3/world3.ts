// V2 world: the one optics room in metres, one fixed projection into L0 (the 2D scene plane the camera zooms over),
// and the timing locked to the approved V1 audio.
//   X right, Y up, Z into the room (away from the viewer). The emitter is at lower left (near, on a low optics cart),
//   the listener's exposed ear at upper right (farther back), 2.44 m (8 ft) away. The clerk walks along constant
//   Z = WALK_Z (parallel to the picture plane, so her side view stays true) and crosses the path upstream.
// Characters are flat Crew drawings placed at their projected feet and scaled by depth (MPU metres per figure unit).
import tl from '../data/timeline.json';
import {P, Pt} from './lib3';

export const FPS = tl.fps;
export const FRAMES = tl.frames;
export const DUR = tl.duration;
type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words as Word[];
export const CAPTIONS = tl.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];
export const w = (i: number) => WORDS[i].start;
export const we = (i: number) => WORDS[i].end;

// ---- the locked audio's message gate (audio/cues.json `received`, frames at 30 fps; tools/check_v2.ts verifies) ----
// The message is ON in the mix in [0,117) [532,596) [718,815) [958,1022). The cut at 815 and the return at 958 are the
// obstruction; the V2 crossing is solved so that the clerk's body enters the path on frame 815 and clears it on 958.
export const MSG_ON: [number, number][] = [[0, 117], [532, 596], [718, 1022]];
export const BLOCK_FRAMES: [number, number] = [815, 958];
export const T_BLOCK = BLOCK_FRAMES[0] / FPS; // 27.1667
export const T_CLEAR = BLOCK_FRAMES[1] / FPS; // 31.9333
export const msgOn = (t: number) => {
  const f = Math.floor(t * FPS + 1e-6);
  return MSG_ON.some(([a, b]) => f >= a && f < b);
};
// footsteps already in the locked mix (audio/sfx_cues.json): the clerk's feet land on these
export const STRIKES = [23.029, 23.779, 24.212, 24.933, 25.283, 27.079, 27.717, 28.112, 31.704, 32.117, 32.558, 33.0, 33.442, 33.883];

// ---- metres <-> figure units (both Crew figures share the head-unit scale; the lead is 1.72 m) ----
export const MPU = 1.72 / 2052;
export const GROUND_U = 1660;

// ---- plan (metres) ----
export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const LEAD_FEET = v3(0.35, 0, 4.3);
export const EAR = v3(LEAD_FEET.x - 146 * MPU, (GROUND_U - 44) * MPU, LEAD_FEET.z); // the lead's exposed ear
// V3: the laser stands on a lab bench nearer the camera, almost straight in front of the listener in depth, so the
// 2.44 m path runs up the portrait frame (source low, ear high) and source, crossing and listener share one compact view
export const EXIT_Y = 1.42;
const PATH_AZ = (5 * Math.PI) / 180, PATH_H = Math.sqrt(2.44 ** 2 - (EAR.y - EXIT_Y) ** 2);
export const EXIT = v3(EAR.x - PATH_H * Math.sin(PATH_AZ), EXIT_Y, EAR.z - PATH_H * Math.cos(PATH_AZ)); // transmitter exit window
export const BEAM_LEN = Math.hypot(EAR.x - EXIT.x, EAR.y - EXIT.y, EAR.z - EXIT.z); // 2.44 m
export const beamAt = (u: number): V3 => v3(EXIT.x + (EAR.x - EXIT.x) * u, EXIT.y + (EAR.y - EXIT.y) * u, EXIT.z + (EAR.z - EXIT.z) * u);
export const WALK_Z = EXIT.z + (EAR.z - EXIT.z) * 0.22; // the companion crosses the path a fifth of the way from the laser
export const CROSS = beamAt(0.22);
export const CART = {x0: EXIT.x - 0.42, x1: EXIT.x + 0.3, z0: EXIT.z - 0.5, z1: EXIT.z + 0.04, top: 0.86}; // the lab bench under the laser
export const ROOM_B = {x0: -2.5, x1: 2.7, zBack: 5.7, h: 3.7};
export const WINDOW = {x0: 0.55, x1: 1.75, y0: 0.95, y1: 2.35}; // on the back wall: the landmark
export const DOOR = {z0: 2.7, z1: 3.75, h: 2.15}; // in the left wall, the clerk's destination

// ---- fixed projection into L0 ----
const G = (globalThis as unknown as {__CAM?: {x: number; y: number; z: number; pitch: number; yaw: number}}).__CAM;
const CAM = G ?? {x: 1.2, y: 3.4, z: -0.9, pitch: 30, yaw: -8};
export const CAMPOS: V3 = {x: CAM.x, y: CAM.y, z: CAM.z};
const PITCH = (CAM.pitch * Math.PI) / 180, YAW = (CAM.yaw * Math.PI) / 180;
const F = 1250, CX = 540, CY = 760;
// camera basis: yaw about Y (positive turns the view toward +X), then pitch down
const fwd = {x: Math.sin(YAW) * Math.cos(PITCH), y: -Math.sin(PITCH), z: Math.cos(YAW) * Math.cos(PITCH)};
const right = {x: Math.cos(YAW), y: 0, z: -Math.sin(YAW)};
const up = {x: Math.sin(YAW) * Math.sin(PITCH), y: Math.cos(PITCH), z: Math.cos(YAW) * Math.sin(PITCH)};
const dot = (p: V3, b: {x: number; y: number; z: number}) => (p.x - CAM.x) * b.x + (p.y - CAM.y) * b.y + (p.z - CAM.z) * b.z;
export const depth = (p: V3) => dot(p, fwd);
export type Pr = {x: number; y: number; s: number; d: number}; // L0 point, L0 px per metre at that depth, depth
export const proj = (p: V3): Pr => {
  const d = depth(p);
  return {x: CX + (F * dot(p, right)) / d, y: CY - (F * dot(p, up)) / d, s: F / d, d};
};
export const pp = (p: V3): Pt => {
  const q = proj(p);
  return P(q.x, q.y);
};
// figure placement: feet at world point `feet`; returns the SVG transform (figure units -> L0)
export const figScale = (feet: V3) => proj(feet).s * MPU;
export const figXf = (feet: V3) => {
  const q = proj(feet), k = q.s * MPU;
  return {x: q.x, y: q.y - GROUND_U * k, k, str: `translate(${q.x} ${q.y - GROUND_U * k}) scale(${k})`};
};

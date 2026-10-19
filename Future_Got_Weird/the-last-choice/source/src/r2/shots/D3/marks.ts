// Section D3 shared marks (PURE: no kits): the places and keyed roots both the Crew (crew.tsx) and the machines
// (machines.ts) read, so a machine aims at where a person will be without importing the Crew (no cycle). World
// metres, film seconds (times.ts EV3). Geography: geo.ts (the water main, the chunks, the wrecks).
import {EV3} from './times';
import {XZ, KR, G, onG, fwdOf, rightOf, keyRoot} from '../D4/motion';
import type {V3} from '../../../kit/math';

// ------------------------------------------------------------------ heavy 1 after its swing round (the pin, the knee)
/** heavy 1's root once it has swung round to the drone's whine (nose north, under the girder) */
export const H1_AT = {x: 64.4, z: -5.6, h: 350};

// ------------------------------------------------------------------ the water main crossing (the duck-under)
/** where the breaker ducks under the water main (its highest span: ≈1.6 m clear under the beam) — SW mouth, axis,
 *  NE mouth (the beam runs NW–SE here) */
export const UNDER = {sw: {x: 59.73, z: 0.57} as XZ, mid: {x: 60.65, z: -0.35} as XZ, ne: {x: 61.57, z: -1.27} as XZ};

// ------------------------------------------------------------------ the knee exchange on the south-west slope
/** the Director stops in U8's path here (it comes up the slope at him) */
export const DIR_MEET: XZ = {x: 54.3, z: -1.25};
/** U8's own stand when it strikes (it walked at him from the crater's south) */
export const U8_MEET: XZ = {x: 55.3, z: -0.7};
/** the line U8's press drives him back along (from U8 toward him), and the press's stops */
const PUSH = (() => { const dx = DIR_MEET.x - U8_MEET.x, dz = DIR_MEET.z - U8_MEET.z, l = Math.hypot(dx, dz); return {x: dx / l, z: dz / l}; })();
const back = (d: number): XZ => ({x: DIR_MEET.x + PUSH.x * d, z: DIR_MEET.z + PUSH.z * d});
/** the heading he faces U8 with */
export const DIR_FACE_H = (Math.atan2(-PUSH.x, PUSH.z) * 180) / Math.PI;
/** his root through the fight: braced in U8's path, the hammer on the plate (heels skid), pressed back in two
 *  shuffles, the lunge after it when it turns away (the bash in its back), backing off as the heavy goes over */
export const DIR_FIGHT: KR[] = [
  [122.0, DIR_MEET.x - PUSH.x * 0.25, DIR_MEET.z - PUSH.z * 0.25, DIR_FACE_H],
  [122.5, DIR_MEET.x - PUSH.x * 0.25, DIR_MEET.z - PUSH.z * 0.25, DIR_FACE_H],
  // he plants a step forward as it closes
  [122.85, DIR_MEET.x, DIR_MEET.z, DIR_FACE_H],
  [EV3.e1Ham + 0.02, DIR_MEET.x, DIR_MEET.z, DIR_FACE_H],
  // the hammer: heels skid back
  [EV3.e1Ham + 0.16, back(0.32).x, back(0.32).z, DIR_FACE_H + 3],
  // the press: two shuffles back
  [EV3.press0 + 0.32, back(0.66).x, back(0.66).z, DIR_FACE_H + 2],
  [EV3.press1, back(1.02).x, back(1.02).z, DIR_FACE_H],
];
/** (filled in below once U8's turn is known: the lunge and the bash) */
export const DIR_AT = (T: number) => keyRoot(DIR_FIGHT, T);
/** his plate (the guard up in front of his chest) for a root at p, heading h */
export const plateOf = (p: XZ, h: number, up = 1.32, fw = 0.5): V3 => {
  const f = fwdOf(h), r = rightOf(h);
  const x = p.x + f.x * fw - r.x * 0.05, z = p.z + f.z * fw - r.z * 0.05;
  return {x, y: G(p.x, p.z) + up, z};
};
/** the Director's plate through the fight (what U8 hammers and presses) */
export const dirPlate = (T: number): V3 => { const r = DIR_AT(T); return plateOf(r.p, r.h); };

/** the runner's rear-guard stand between the fight and the crossing, and where he dashes in to hook U8's ankle */
export const RUN_GUARD: XZ = {x: 57.4, z: -0.8};
export const RUN_HOOK: XZ = {x: 56.15, z: -1.65};

// ------------------------------------------------------------------ the escalation on the rim
/** where the decoy maker projects from again (on the crest north of the cover slab, the crater before her); she sinks
 *  to her knees here after the smash */
export const DEC_SPOT = {x: 46.15, z: -0.75, h: 88};
/** heavy 2's round bursts on the crest where she knelt (just east of it: the slope's lip) */
export const BLAST_XZ: XZ = {x: 47.15, z: -0.55};
/** the main direction heavy 2's round throws the rim's concrete (west and up; the chunks come down on the terrain: fx.tsx blastFx, persist.ts d3_blast — one value for both) */
export const BLAST_DIR = {x: -0.6, y: 1.1, z: 0};
/** the Director's run to her and the haul back off the crest */
export const DIR_GRAB: XZ = {x: 45.55, z: -1.35};

export const on = (p: XZ, up = 0): V3 => onG(p.x, p.z, up);

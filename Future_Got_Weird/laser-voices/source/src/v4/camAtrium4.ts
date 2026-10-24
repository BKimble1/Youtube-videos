// V4 atrium camera: one take in unrolled time tau (see story4.ts). Keys for the end (F, G, H) are in natural
// coordinates; keys for the opening (A, B) are written in natural coordinates too and moved one bay along x (they
// happen after the seam, in tau > DUR). camera(t) = path(tau(t)) moved back by the seam shift, so the last frame and
// frame 0 are consecutive frames of one move.
import {CK, camPath, DUR, lookCam, Cam} from './core4';
import {v3, V3} from './rig/geo4';
import {leadAt, EAR0, MACHINE, tauOf, shiftOf, BLOCK_SPOT, LEAD_Z} from './story4';
import {BAY} from './atrium4';

const E = EAR0;
const add = (a: V3, x: number, y: number, z: number) => v3(a.x + x, a.y + y, a.z + z);
const lg = (t: number) => leadAt(t).ground; // natural coordinates
// the beam line, from the machine's window toward his ear
const BD = (() => {
  const d = v3(E.x - MACHINE.x, E.y - (MACHINE.y + 0.1), E.z - MACHINE.z);
  const l = Math.hypot(d.x, d.y, d.z);
  return v3(d.x / l, d.y / l, d.z / l);
})();
const onBeam = (back: number, up = 0) => v3(E.x - BD.x * back, E.y - BD.y * back + up, E.z - BD.z * back);
// the walking two-shot that opens (and closes) the film: front-left of him, the crowd behind
const TRACK = (g: V3) => ({pos: add(g, 1.5, 1.6, -1.8), at: add(g, 0.12, 1.22, 0.4), f: 1100});

const k = (t: number, pos: V3, at: V3, f: number, hold = false): CK => ({t, pos, at, f, hold});
const END: CK[] = [
  // F: match cut from the lab listener's ear to his
  k(23.4, add(E, 0.36, 0.05, -0.55), add(E, 0, 0.02, 0), 1700),
  k(23.95, add(E, 0.42, 0.07, -0.62), add(E, 0, 0.02, 0.02), 1620),
  // out to the two-shot from his front-left: she comes round behind him and steps up on his left, into the line
  k(24.85, v3(1.55, 1.62, 1.05), v3(-0.35, 1.32, 3.1), 1000),
  k(26.2, v3(1.45, 1.6, 1.0), v3(-0.4, 1.33, 3.05), 1060),
  k(27.12, v3(1.38, 1.6, 1.02), v3(-0.38, 1.35, 3.02), 1120),
  // the voice stops: a quick move round behind her shoulder, down the line from the machine: she is in the way
  k(27.85, onBeam(2.35, 0.42), add(E, 0, -0.04, 0), 1250),
  // G: the infrared view from the side: the beam comes in and ends on her
  k(28.15, v3(1.15, 1.7, 0.85), v3(-0.85, 1.35, 2.55), 1050),
  k(29.3, v3(1.1, 1.68, 0.82), v3(-0.9, 1.35, 2.5), 1100),
  // along the beam from behind the machine: it stops at her back
  k(29.6, onBeam(7.95, 0.55), add(E, 0, -0.05, 0), 1450),
  k(30.3, onBeam(7.75, 0.52), add(E, 0, -0.05, 0), 1560),
  // swing back round to him, puzzled
  k(30.75, v3(-1.2, 1.9, 0.4), v3(-0.2, 1.36, 3.1), 1150),
  k(31.15, v3(1.2, 1.56, 1.85), v3(-0.12, 1.34, 3.12), 1300),
  k(31.9, v3(1.08, 1.54, 1.98), v3(-0.1, 1.34, 3.15), 1360),
  // H: she steps back, the voice is there again: race to his ear
  k(32.2, add(lg(32.2), 0.75, 1.48, -1.05), add(E, 0, 0, 0), 1450),
  k(32.75, add(lg(32.75), 0.38, 1.4, -0.58), add(lg(32.75), 0.02, 1.35, -0.24), 1750),
  // and ease back out into the walking two-shot that opens the film
  k(33.45, add(lg(33.45), 1.15, 1.56, -1.35), add(lg(33.45), 0.1, 1.27, 0.25), 1250),
  k(DUR, TRACK(lg(DUR)).pos, TRACK(lg(DUR)).at, TRACK(lg(DUR)).f),
];
// natural coordinates, film time (A, B)
const OPEN: CK[] = [
  k(0.4, TRACK(lg(0.4)).pos, TRACK(lg(0.4)).at, TRACK(lg(0.4)).f),
  // he snaps toward the voice; the camera whips round over his head to look where he looks: nothing there
  k(0.68, add(lg(0.68), 1.42, 1.62, -1.72), add(lg(0.68), 0.15, 1.28, 0.3), 1080),
  k(1.0, v3(0.75, 2.0, 2.75), v3(1.3, 1.68, 1.5), 900),
  k(1.32, v3(-0.62, 1.66, 4.22), v3(0.25, 1.38, 1.4), 950),
  k(1.62, v3(-0.66, 1.66, 4.26), v3(0.22, 1.38, 1.38), 950),
  // round her far side to the front: she is unbothered
  k(1.82, v3(0.65, 1.68, 5.05), v3(0.1, 1.35, 3.95), 1050),
  k(2.02, v3(1.85, 1.52, 3.95), v3(0, 1.36, 3.9), 1150),
  // what he hears: his ear
  k(2.42, add(E, 0.44, 0.06, -0.5), add(E, 0, 0.02, 0), 1600),
  k(2.78, add(E, 0.47, 0.07, -0.55), add(E, 0, 0.02, 0.02), 1560),
  // what she hears: across to her ear
  k(3.0, v3(0.95, 1.45, 3.95), v3(0.1, 1.36, 4.2), 1400),
  k(3.25, v3(0.18, 1.42, 5.02), v3(0.04, 1.35, 4.45), 1600),
  k(3.55, v3(0.22, 1.44, 5.12), v3(0.04, 1.35, 4.42), 1520),
  // pull back, up over them and away... to the machine aimed at his ear
  k(4.0, v3(-0.6, 2.55, 4.7), v3(0, 1.3, 3.6), 1000),
  k(4.5, v3(-3.8, 2.35, 0.5), v3(-0.4, 1.3, 3.2), 1050),
  k(4.98, v3(-6.6, 1.8, -2.82), v3(-1.5, 1.33, 2.35), 1050),
  // "you wouldn't need anything in your ears": push along the (invisible) beam to his ear
  k(5.4, onBeam(2.6, 0.2), E, 1300),
  k(5.85, onBeam(0.32, 0.03), E, 2000),
  // B: out of the ear section, pull back to see where he stands relative to the transmitter
  k(6.85, onBeam(0.32, 0.03), E, 2000),
  k(7.3, v3(-0.9, 2.1, 2.5), v3(0, 1.3, 3.5), 1000),
  k(7.95, v3(1.9, 4.4, 4.45), v3(-2.5, -0.1, -0.6), 860),
  k(8.5, v3(1.75, 4.25, 4.3), v3(-2.5, -0.05, -0.55), 880),
  // in the infrared view, follow the beam to the air at his ear
  k(9.05, onBeam(0.55, 0.06), add(E, 0.05, 0, 0), 1500),
];
const KEYS: CK[] = [...END, ...OPEN.map((q) => ({...q, t: q.t + DUR, pos: add(q.pos, BAY, 0, 0), at: add(q.at, BAY, 0, 0)}))];
export const atriumCam = (t: number): Cam => {
  const c = camPath(KEYS, tauOf(t));
  const s = shiftOf(t);
  return lookCam(add(c.pos, s, 0, 0), add(lookAt(c), s, 0, 0), c.f, c.roll ?? 0);
};
// recover the look-at point from a Cam (yaw/pitch) at unit distance
const lookAt = (c: Cam): V3 => {
  const R = Math.PI / 180;
  return v3(c.pos.x + Math.sin(c.yaw * R) * Math.cos(c.pitch * R), c.pos.y + Math.sin(c.pitch * R), c.pos.z + Math.cos(c.yaw * R) * Math.cos(c.pitch * R));
};
export {BLOCK_SPOT, LEAD_Z, BD, onBeam};

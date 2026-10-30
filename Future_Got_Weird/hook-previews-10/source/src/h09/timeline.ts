// HOOK 09 (pistol shrimp): every event time lives here and is mirrored in tools/audio/h09.py.
// World units are millimetres (x right, y down). The shrimp faces right, body tilted a few degrees head-up, and aims its
// big claw up-forward at a small fish. Times come from the narration's word starts where a beat is spoken.
import WORDS from '../data/h09_words.json';
import {clamp, keyCR, sm, Words, wordAt} from '../shared/lib';
import {add, mul, rot, V} from './math';

export const W9 = WORDS as Words;

const tinyEnd = wordAt(W9, 'tiny').end; // 0.73
const flashStart = wordAt(W9, 'flash').start; // 3.81

export const T = {
  cock: 0.36, // the dactyl finishes cocking and locks (tiny settle)
  release: tinyEnd - 0.15, // 0.58: the joint lock lets go
  shut: tinyEnd - 0.05, // 0.68: dactyl closed, plunger seated in the socket
  jet: tinyEnd - 0.08, // 0.65: jet leaves the socket
  nucleate: tinyEnd + 0.03, // 0.76: cavitation bubble nucleates in the jet
  bubbleMax: 1.95, // largest bubble
  collapse: flashStart - 0.15, // 3.66: collapse -> pinpoint flash + shockwave
  recock0: 4.9, // claw starts re-opening
  recock1: 5.85,
};

// ---------- slow motion: simulation clock tau (drift, gills, antennae) ----------
/** playback rate of "real" time: 1 before the snap, nearly frozen through the bubble's life, recovering in the pull-out */
export const rate = (t: number) => {
  if (t < 0.6) return 1;
  if (t < 0.88) return 1 - 0.965 * sm((t - 0.6) / 0.28);
  if (t < 4.55) return 0.035;
  return 0.035 + 0.6 * sm((t - 4.55) / 1.1);
};
/** integral of rate (simulated seconds elapsed) */
export const tau = (t: number) => {
  const n = Math.max(1, Math.ceil(t * 120));
  let s = 0;
  for (let i = 0; i < n; i++) s += rate(((i + 0.5) / n) * t);
  return (s * t) / n;
};

// ---------- shrimp placement ----------
export const BODY_ROT = -60; // degrees: perched head-up on a sloping boulder (a diagonal through the portrait frame)
export const CLAW_COXA: V = {x: -1.0, y: 2.8}; // shrimp-local
export const CLAW_RAISE = 28; // big cheliped relative to the body (degrees; jet stays at -34 deg on screen)
export const NOZZLE_LOCAL: V = {x: 19.7, y: 4.1}; // claw-local (unrotated cheliped), where the jet leaves the claw
export const FOOT_Y = 8.0; // shrimp-local y of the rock surface under the feet
export const FLOOR_Y = 30; // world y of the sand floor around the boulder
export const HORIZON_Y = 22; // world y where the receding sand meets the water haze

/** shrimp-local -> world */
export const bodyToWorld = (p: V): V => rot(p, BODY_ROT);
/** claw-local (cheliped drawn unrotated) -> shrimp-local */
export const clawToBody = (p: V): V => rot(p, CLAW_RAISE, CLAW_COXA);
export const clawToWorld = (p: V) => bodyToWorld(clawToBody(p));

export const JET_ANGLE = BODY_ROT + CLAW_RAISE - 2; // degrees, screen (negative = up-right)
export const JET_DIR: V = {x: Math.cos((JET_ANGLE * Math.PI) / 180), y: Math.sin((JET_ANGLE * Math.PI) / 180)};
export const NOZZLE: V = clawToWorld(NOZZLE_LOCAL);

// ---------- bubble ----------
export const RMAX = 1.75; // mm
/** distance of the bubble centre from the nozzle along the jet */
export const bubbleX = (t: number) => {
  const u = clamp((t - T.nucleate) / (T.collapse - T.nucleate));
  return 1.0 + 4.3 * (1 - (1 - u) ** 1.8);
};
export const bubbleC = (t: number): V => add(NOZZLE, mul(JET_DIR, bubbleX(Math.min(t, T.collapse))));
/** bubble radius (mm): grows, then collapses ever faster to nothing (a Rayleigh-like collapse, eased for reading) */
export const bubbleR = (t: number) => {
  if (t < T.nucleate || t >= T.collapse) return 0;
  if (t < T.bubbleMax) {
    const u = (t - T.nucleate) / (T.bubbleMax - T.nucleate);
    return RMAX * (1 - (1 - u) ** 2.4);
  }
  const u = (t - T.bubbleMax) / (T.collapse - T.bubbleMax);
  return RMAX * Math.pow(Math.max(0, 1 - Math.pow(u, 1.6)), 0.5);
};
export const PC: V = bubbleC(T.collapse); // collapse point (flash + shockwave origin)

// ---------- shockwave ----------
/** shockwave radius (mm), 0 before the collapse */
export const ringR = (t: number) => (t <= T.collapse ? 0 : 13 * Math.pow(t - T.collapse, 0.85));

// ---------- prey ----------
export const FISH0: V = add(PC, {x: 4.5, y: -12.5}); // fish centre
export const fishHit = (() => {
  // first time the front reaches the fish's nearest point (head side, ~3 mm closer than the centre)
  const d = Math.hypot(FISH0.x - PC.x, FISH0.y - PC.y) - 2.4;
  return T.collapse + Math.pow(d / 13, 1 / 0.85);
})();

// ---------- camera ----------
export type Cam = {cx: number; cy: number; s: number};
export const ANCHOR: V = {x: 540, y: 880};

const camKeys = (() => {
  const b = (t: number) => bubbleC(t);
  const k: [number, number, number, number][] = [];
  const push = (t: number, p: V, s: number) => k.push([t, p.x, p.y, Math.log(s)]);
  const claw0 = clawToWorld({x: 9.5, y: 2.0});
  void claw0;
  push(0.0, {x: 4.2, y: 3.6}, 32.5);
  push(0.6, {x: 6.0, y: 1.2}, 35.5);
  push(1.05, add(b(1.05), {x: -2.2, y: 0.8}), 62);
  push(1.75, add(b(1.75), {x: -0.4, y: 0.2}), 140);
  push(2.6, b(2.6), 225);
  push(3.55, PC, 320);
  push(4.2, add(PC, {x: 1.2, y: -2.2}), 72);
  push(4.6, add(PC, {x: 0.5, y: -5.0}), 40);
  push(5.2, add(PC, {x: -11, y: 3.5}), 23);
  push(6.0, {x: 5.0, y: -2.0}, 15.5);
  return k;
})();

export const camAt = (t: number): Cam => {
  const pick = (i: number) => camKeys.map((k) => [k[0], k[i]] as [number, number]);
  return {cx: keyCR(t, pick(1)), cy: keyCR(t, pick(2)), s: Math.exp(keyCR(t, pick(3)))};
};
export const toScreen = (c: Cam, p: V): V => ({x: ANCHOR.x + (p.x - c.cx) * c.s, y: ANCHOR.y + (p.y - c.cy) * c.s});
export const worldTransform = (c: Cam) => `translate(${(ANCHOR.x - c.cx * c.s).toFixed(3)} ${(ANCHOR.y - c.cy * c.s).toFixed(3)}) scale(${c.s.toFixed(4)})`;

/** dactyl opening angle (degrees, 0 = shut): cocked, locks, snaps shut, re-cocks at the end */
export const dactylOpen = (t: number) => {
  const COCK = 84;
  if (t < T.cock) return 76 + (COCK - 76) * sm(t / T.cock);
  if (t < T.release) {
    const u = t - T.cock;
    return COCK + 1.6 * Math.exp(-u / 0.05) * Math.sin(u * 70); // lock settle
  }
  if (t < T.shut) {
    const u = (t - T.release) / (T.shut - T.release);
    return COCK * (1 - u * u * u);
  }
  if (t < T.recock0) return 0;
  return COCK * sm((t - T.recock0) / (T.recock1 - T.recock0)) + (t > T.recock1 ? 0.8 * Math.sin((t - T.recock1) * 9) * Math.exp(-(t - T.recock1) / 0.1) : 0);
};
export {rot};

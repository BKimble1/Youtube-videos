import {handPos, Arm} from '../components/Character';
import {E, impact, kf} from '../lib/motion';
import {SC, footOffset} from './rig';
import EVJ from './events.json';

/**
 * E-A opening: every position is a pure function of the frame number (so renders, QA probes and the audio cue table agree).
 * World space = screen space at camera x = 0. East is +x. y is down. The ground never moves; the camera does.
 *
 * Story physics (stylised, not a simulation): the street stops, the commuter does not. Her hips keep their ~22 px/frame
 * (about 660 px/s) while her stopped feet skid and the body pitches east about them; she is flung into a short hop, lands,
 * and skids to a slower slide. The coffee leaves the mug faster than her hand and falls on a ballistic arc.
 */
export const FPS = EVJ.fps;
export const N = EVJ.total_frames;
export const EVT = EVJ.events;
export const GY = 1290; // sidewalk line under the hero's feet
const SHOE_Y = GY - 6 * SC; // shoe-centre height when a shoe is flat on the ground (the rig's idle stance)
export const X0 = 324; // hip pivot x at frame 0
export const V0 = 22; // px/frame of the hips while airborne
const TAU = 140; // slow friction: she is still sliding fast at the cut
const LAND = EVT.land;
const LAUNCH = EVT.launch;
const HOP = 70;
const rad = (d: number) => (d * Math.PI) / 180;
const rot = (x: number, y: number, a: number) => ({x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)});

export const vHip = (f: number) => (f <= LAND ? V0 : V0 * Math.exp(-(f - LAND) / TAU));
export const hipX = (f: number) => (f <= LAND ? X0 + V0 * f : X0 + V0 * LAND + V0 * TAU * (1 - Math.exp(-(f - LAND) / TAU)));

export const theta = (f: number) => kf(f, [[0, 32], [9, 40, E.out], [15, 42, E.inOut], [LAND, 38, E.inOut], [50, 33, E.inOut], [90, 29, E.inOut]]);
export const legL = (f: number) => kf(f, [[0, 8], [9, 22, E.out], [15, 26, E.inOut], [LAND, 14, E.inOut], [50, 12, E.inOut], [90, 10, E.inOut]]);
export const legR = (f: number) => kf(f, [[0, -2], [9, 6, E.out], [15, 34, E.inOut], [LAND, 30, E.inOut], [44, 16, E.inOut], [90, 10, E.inOut]]);
export const footFlat = (f: number) => kf(f, [[0, 1], [LAUNCH - 1, 1], [LAUNCH + 2, 0.15, E.out], [LAND - 4, 0.15], [LAND, 1, E.out]]);

export const armR = (f: number): Arm => ({
  // the mug arm lifts through the landing so the mug skims the pavement instead of dipping through it
  a: kf(f, [[0, 30], [5, 38, E.out], [12, 46, E.inOut], [LAND - 3, 42, E.inOut], [LAND + 3, 50, E.out], [LAND + 12, 44, E.inOut], [60, 38, E.inOut], [90, 32, E.inOut]]),
  b: kf(f, [[0, 78], [8, 70, E.out], [20, 62, E.inOut], [LAND, 72, E.inOut], [LAND + 10, 76, E.inOut], [90, 56, E.inOut]]),
});
export type ArmMode = 'up' | 'trail' | 'brace';
export const armL = (f: number, mode: ArmMode = 'up'): Arm => {
  const flutter = f > 9 ? 4 * Math.sin(f * 0.55) : 0;
  if (mode === 'trail') {
    // trailing low behind her along the line of travel
    return {a: kf(f, [[0, 80], [9, 88, E.out], [15, 84, E.inOut], [LAND, 78, E.inOut], [60, 66, E.inOut], [90, 60, E.inOut]]) + flutter, b: kf(f, [[0, 14], [12, 18, E.inOut], [90, 18, E.inOut]])};
  }
  if (mode === 'brace') {
    // thrown forward across the body toward the direction of travel (as a person pitched forward braces)
    return {a: kf(f, [[0, -26], [9, -32, E.out], [20, -24, E.inOut], [90, -10, E.inOut]]), b: kf(f, [[0, -38], [12, -46, E.inOut], [90, -30, E.inOut]])};
  }
  // flung back-and-up (current)
  return {
    a: kf(f, [[0, 104], [9, 112, E.out], [15, 106, E.inOut], [LAND, 96, E.inOut], [60, 78, E.inOut], [90, 68, E.inOut]]) + flutter,
    b: kf(f, [[0, 12], [12, 18, E.inOut], [LAND, 24, E.inOut], [90, 22, E.inOut]]),
  };
};
export const cupTilt = (f: number) => kf(f, [[0, 52], [4, 76, E.out], [10, 92, E.inOut], [20, 100, E.inOut], [60, 96, E.inOut], [90, 92, E.inOut]]);

const lowestFootY = (f: number) => Math.max(footOffset(theta(f), legL(f), -1, SC).y, footOffset(theta(f), legR(f), 1, SC).y);
const groundHipY = (f: number) => SHOE_Y - lowestFootY(f);
export const grounded = (f: number) => f < LAUNCH || f >= LAND;

export const hipY = (f: number) => {
  if (grounded(f)) {
    const bounce = f >= LAND && f <= LAND + 8 ? -16 * Math.sin(((f - LAND) / 8) * Math.PI) : 0;
    return groundHipY(f) + bounce;
  }
  const u = (f - LAUNCH) / (LAND - LAUNCH);
  return groundHipY(LAUNCH) + (groundHipY(LAND) - groundHipY(LAUNCH)) * u - 4 * HOP * u * (1 - u);
};

/** world x of the lowest (ground-contact) shoe; used for dust and skid marks */
export const footX = (f: number) => {
  const l = footOffset(theta(f), legL(f), -1, SC);
  const r = footOffset(theta(f), legR(f), 1, SC);
  return hipX(f) + (l.y >= r.y ? l.x : r.x);
};

/** landing squash about the feet [sx, sy] */
export const squash = (f: number): [number, number] => impact(f, LAND, 0.07, 9);

/** hand of the mug arm, world px */
export const handWorld = (f: number) => {
  const h = handPos(armR(f), 1);
  const p = rot(h.hx, h.hy + 150, rad(theta(f)));
  return {x: hipX(f) + p.x * SC, y: hipY(f) + p.y * SC};
};
export const MUG = {cx: 64, cy: -4, mouthY: -48, w: 72, h: 88};
export const ZOOM = 1.16; // whole-scene push about (540, GY) so the hero and mug read larger on a phone
/** mug mouth centre, world px (the mug tilts about the hand) */
export const mouthWorld = (f: number) => {
  const h = handWorld(f);
  const p = rot(MUG.cx, MUG.mouthY, rad(cupTilt(f)));
  return {x: h.x + p.x * SC, y: h.y + p.y * SC};
};

/** head/neck join, world px */
export const neckWorld = (f: number) => {
  const p = rot(0, -156, rad(theta(f)));
  return {x: hipX(f) + p.x * SC, y: hipY(f) + p.y * SC};
};

/**
 * Camera x. Static for the first 6 frames (the street is the fixed reference), then it accelerates to the hero's own velocity over
 * 5 frames and rides with it. Camera speed never exceeds the hero's, so the hero's screen position only ever moves forward
 * and then holds (~x 480); the street then streams past the lens at the hero's speed.
 */
const CAM_START = 6;
const CAM_RAMP = 5;
const smoother = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const camTable: number[] = (() => {
  const a = [0];
  for (let i = 1; i <= N + 40; i++) {
    const t = i - 0.5;
    a.push(a[i - 1] + vHip(t) * smoother((t - CAM_START) / CAM_RAMP));
  }
  return a;
})();
export const camX = (f: number) => {
  if (f <= 0) return 0;
  const i = Math.floor(f);
  const fr = f - i;
  const a = camTable[Math.min(i, camTable.length - 1)];
  const b = camTable[Math.min(i + 1, camTable.length - 1)];
  return a + (b - a) * fr;
};

/* ------------------------------------------------------------------ coffee */
export type Drop = {k: number; born: number; age: number; x: number; y: number; landed: boolean; r: number; sinceLand: number};
const G_COFFEE = 0.9;
const COFFEE_K = 30;
export const coffeeBorn = (k: number) => -8 + 0.6 * k; // already 8 frames into the pour at frame 0
export const STREAM_AGE = 16;
export const coffee = (f: number): Drop[] => {
  const out: Drop[] = [];
  for (let k = 0; k < COFFEE_K; k++) {
    const born = coffeeBorn(k);
    const age = f - born;
    if (age < 0) continue;
    const m = mouthWorld(born);
    // thrown forward out of the mug mouth: the first coffee leaves fastest, the last just spills over the rim, then it all arcs down to the pavement
    const vx = vHip(born) + (24 - 0.8 * k); // monotonic in k, so neighbouring particles never cross (no zigzag ribbon)
    const vy = -2.2 + 0.06 * k;
    let x = m.x + vx * age;
    let y = m.y + vy * age + 0.5 * G_COFFEE * age * age;
    let landed = false;
    let sinceLand = -1;
    if (y >= GY - 4) {
      let t = 0;
      for (; t < age; t += 0.25) if (m.y + vy * t + 0.5 * G_COFFEE * t * t >= GY - 4) break;
      x = m.x + vx * t;
      y = GY - 4;
      landed = true;
      sinceLand = age - t;
    }
    out.push({k, born, age, x, y, landed, r: 18 - k * 0.3, sinceLand});
  }
  return out;
};

/** Frame (fractional) at which each coffee particle first reaches the pavement, with its world x and speed; used for the splat Foley and QA. */
export const coffeeLandings = () => {
  const out: {k: number; frame: number; x: number}[] = [];
  for (let k = 0; k < COFFEE_K; k++) {
    const born = coffeeBorn(k);
    const m = mouthWorld(born);
    const vx = vHip(born) + (24 - 0.8 * k);
    const vy = -2.2 + 0.06 * k;
    // solve m.y + vy t + g t^2 / 2 = GY - 4 for the later root
    const a = 0.5 * G_COFFEE;
    const b = vy;
    const c = m.y - (GY - 4);
    const disc = b * b - 4 * a * c;
    if (disc < 0) continue;
    const t = (-b + Math.sqrt(disc)) / (2 * a);
    out.push({k, frame: born + t, x: m.x + vx * t});
  }
  return out;
};

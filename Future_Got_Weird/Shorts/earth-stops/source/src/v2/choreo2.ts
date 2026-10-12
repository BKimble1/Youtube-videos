import {E, kf} from '../lib/motion';
import {rand} from '../lib/anim';
import {FK, SidePose, hipOnGround, sideFK} from './side';
import {MUG} from './props';
import EVJ from './events2.json';

/**
 * E-A v2 choreography: pure functions of the frame. World px at zoom 1, +x east, +y down; the feet line is y = GYW.
 * Beat 1 (0-0.8 s): the stop. She is mid-pitch, feet skidding, coffee leaving the mug; the camera starts still, then rides with her.
 * Beat 2 (0.67-1.13 s): the camera BRAKES to a stop and pulls back: the street goes still and crisp while everything loose keeps going,
 *   and a bicycle that was behind frame slides into view. Beat 3: she and the bike carry on across the still street, past the anchored
 *   lamp post and palm, leaving the coffee stains behind.
 */
export const FPS = EVJ.fps;
export const N = EVJ.total_frames;
export const EVT = EVJ.events;
export const GYW = 1290;
export const SC = 1.5;
export const X0 = 260;
export const V0 = 22;
const TAU = 90;
const LAUNCH = EVT.launch, LAND = EVT.land;
const HOP = 62;

export const vHip = (f: number) => (f <= LAND ? V0 : V0 * Math.exp(-(f - LAND) / TAU));
export const hipX = (f: number) => (f <= LAND ? X0 + V0 * f : X0 + V0 * LAND + V0 * TAU * (1 - Math.exp(-(f - LAND) / TAU)));

/* ------------------------------------------------------------------ camera */
export const Z1 = 1.08, Z2 = 0.86;
export const GSY = 1480; // screen y of the feet line (kept fixed while zooming: the pull-back is about the ground). Low in the frame so the road falls mostly under the Shorts caption/UI zone and the facades use the space above
const HIP_SCREEN0 = 250;
const CAM_X0 = X0 + (540 - HIP_SCREEN0) / Z1;
const alpha = (f: number) => kf(f, [[0, 0.5], [8, 1.0, E.inOut], [EVT.brake_start - 1, 1.0], [EVT.brake_end, 0, E.inOut]]);
const camTable: number[] = (() => {
  const a = [CAM_X0];
  for (let i = 1; i <= N + 40; i++) a.push(a[i - 1] + vHip(i - 0.5) * alpha(i - 0.5));
  return a;
})();
export const camX = (f: number) => {
  if (f <= 0) return CAM_X0;
  const i = Math.floor(f), fr = f - i;
  const a = camTable[Math.min(i, camTable.length - 1)], b = camTable[Math.min(i + 1, camTable.length - 1)];
  return a + (b - a) * fr;
};
export const camSpeed = (f: number) => camX(f) - camX(f - 1);
export const zoomAt = (f: number) => kf(f, [[0, Z1], [EVT.brake_start - 2, Z1], [EVT.brake_end + 2, Z2, E.inOut]]);
/** world -> screen */
export const toScreen = (x: number, y: number, f: number) => {
  const z = zoomAt(f);
  return {x: 540 + (x - camX(f)) * z, y: GSY + (y - GYW) * z};
};

/* ------------------------------------------------------------------ hero */
const lerpPose = (f: number): SidePose => {
  const k = (keys: [number, number, ((x: number) => number)?][]) => kf(f, keys);
  const crouch = f >= LAND && f <= LAND + 7 ? Math.sin(((f - LAND) / 7) * Math.PI) : 0;
  return {
    lean: k([[0, 28], [9, 36, E.out], [15, 42, E.inOut], [LAND, 34, E.inOut], [42, 31, E.inOut], [58, 22, E.inOut], [74, 18, E.inOut]]) + 4 * crouch,
    head: k([[0, 8], [15, 12, E.inOut], [74, 9, E.inOut]]),
    armN: {s: k([[0, 76], [9, 84, E.out], [15, 92, E.inOut], [LAND, 74, E.inOut], [45, 66, E.inOut], [74, 62, E.inOut]]), e: k([[0, 52], [9, 44, E.out], [15, 34, E.inOut], [LAND, 48, E.inOut], [74, 56, E.inOut]])},
    armF: {s: k([[0, 134], [9, 128, E.out], [15, 100, E.inOut], [LAND, 70, E.inOut], [45, 40, E.inOut], [58, 96, E.inOut], [74, 112, E.inOut]]), e: k([[0, 10], [15, 20, E.inOut], [LAND, 30, E.inOut], [74, 20, E.inOut]])},
    legN: {
      h: k([[0, 20], [LAUNCH, 10, E.out], [15, -46, E.inOut], [LAND - 3, 20, E.inOut], [LAND, 26], [40, 30, E.inOut], [74, 28, E.inOut]]),
      k: k([[0, 24], [LAUNCH, 18, E.out], [15, 50, E.inOut], [LAND - 3, 30, E.inOut], [40, 38, E.inOut], [74, 34, E.inOut]]) + 18 * crouch,
      f: k([[0, 6], [15, -32, E.inOut], [LAND, 6, E.out], [74, 8]]),
    },
    legF: {
      h: k([[0, -44], [LAUNCH, -52, E.out], [15, -62, E.inOut], [LAND, -34, E.inOut], [40, -38, E.inOut], [74, -34, E.inOut]]),
      k: k([[0, 14], [LAUNCH, 20, E.out], [15, 28, E.inOut], [LAND, 12, E.inOut], [74, 10]]) + 10 * crouch,
      f: k([[0, -28], [15, -36, E.inOut], [LAND, -16, E.inOut], [74, -14]]),
    },
    mouth: 'o',
    brows: 0.9,
  };
};
export const heroPose = lerpPose;
const groundHipY = (f: number) => hipOnGround(lerpPose(f), hipX(f), GYW, SC).y;
export const grounded = (f: number) => f < LAUNCH || f >= LAND;
export const hipY = (f: number) => {
  if (grounded(f)) {
    const bounce = f >= LAND && f <= LAND + 8 ? -10 * Math.sin(((f - LAND) / 8) * Math.PI) : 0;
    return groundHipY(f) + bounce;
  }
  const u = (f - LAUNCH) / (LAND - LAUNCH);
  return groundHipY(LAUNCH) + (groundHipY(LAND) - groundHipY(LAUNCH)) * u - 4 * HOP * u * (1 - u);
};
export const heroFK = (f: number): FK => sideFK(lerpPose(f), {x: hipX(f), y: hipY(f)}, SC);
export const lowestShoeX = (f: number) => {
  const fk = heroFK(f);
  return fk.shoeN.y >= fk.shoeF.y ? fk.shoeN.x : fk.shoeF.x;
};

/* ------------------------------------------------------------------ mug + coffee */
export const mugTilt = (f: number) => kf(f, [[0, 84], [8, 92, E.inOut], [16, 100, E.inOut], [60, 98, E.inOut], [75, 96, E.inOut]]);
const rotCW = (x: number, y: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return {x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)};
};
export const mouthWorld = (f: number) => {
  const h = heroFK(f).Wn;
  const p = rotCW(MUG.cx, MUG.mouthY, mugTilt(f));
  return {x: h.x + p.x * SC, y: h.y + p.y * SC, dir: rotCW(0, -1, mugTilt(f))};
};

export type Parcel = {k: number; age: number; x: number; y: number; vx: number; vy: number; w: number; r: number; stretch: number; landed: boolean; sinceLand: number; ribbon: boolean};
const K = 46;
const G = 1.45;
const TB = 12; // frames of continuous stream before it breaks
export const PARCEL_B0 = -7; // first parcel leaves the mug 7 frames before frame 0 (E-A is already mid-spill); E-C passes 0
export const parcelBorn = (k: number, b0 = PARCEL_B0) => b0 + 0.42 * k;
const H = (k: number, s: number) => rand(k * 131 + s * 17 + 7);
export const parcels = (f: number, b0 = PARCEL_B0): Parcel[] => {
  const out: Parcel[] = [];
  for (let k = 0; k < K; k++) {
    const born = parcelBorn(k, b0);
    const age = f - born;
    if (age < 0) continue;
    const m = mouthWorld(born);
    const t = k / K;
    const speed = 9.5 - 5 * Math.pow(t, 1.2);
    const spread = Math.sin(k * 0.37) * 1.4; // smooth, tiny: no zigzag in the stream
    const d = rotCW(m.dir.x, m.dir.y, spread);
    const vx = vHip(born) + speed * d.x;
    const vy = speed * d.y;
    const w = 14 + 40 * Math.pow(1 - t, 0.8);
    // beyond the breakup the stream scatters into a cloud of unequal drops
    const post = Math.max(0, age - TB);
    const dispX = (H(k, 2) - 0.5) * 4.4 * Math.pow(post, 1.15);
    const dispY = (H(k, 3) - 0.5) * 3.8 * Math.pow(post, 1.15);
    let x = m.x + vx * age + dispX;
    let y = m.y + vy * age + 0.5 * G * age * age + dispY;
    let landed = false, sinceLand = -1;
    if (y >= GYW - 3) {
      let tt = 0;
      for (; tt < age; tt += 0.25) {
        const p2 = Math.max(0, tt - TB);
        const yy = m.y + vy * tt + 0.5 * G * tt * tt + (H(k, 3) - 0.5) * 3.8 * Math.pow(p2, 1.15);
        if (yy >= GYW - 3) break;
      }
      const p3 = Math.max(0, tt - TB);
      x = m.x + vx * tt + (H(k, 2) - 0.5) * 4.4 * Math.pow(p3, 1.15);
      y = GYW - 3;
      landed = true;
      sinceLand = age - tt;
    }
    const r = 4.5 + 12.5 * Math.pow(H(k, 4), 1.7);
    const speedNow = Math.hypot(vx, vy + G * age);
    out.push({k, age, x, y, vx, vy: vy + G * age, w, r, stretch: 1 + Math.min(1.4, speedNow / 26), landed, sinceLand, ribbon: age < TB && !landed});
  }
  return out;
};
export const STREAM_TB = TB;

/* ------------------------------------------------------------------ bicycle (the one extra loose object) */
export const BIKE_Y = 1236; // contact line, behind the hero's line
export const BIKE_R = 92;
export const bikeX = (f: number) => X0 - 440 + (hipX(f) - X0);
const spinTable: number[] = (() => {
  const a = [0];
  for (let i = 1; i <= N + 40; i++) {
    const t = i - 0.5;
    const ramp = Math.min(1, t / 14);
    a.push(a[i - 1] + (((vHip(t)) / BIKE_R) * 180) / Math.PI * ramp * ramp * (3 - 2 * ramp));
  }
  return a;
})();
export const bikeSpin = (f: number) => spinTable[Math.max(0, Math.min(spinTable.length - 1, Math.round(f)))];
export const bikeTilt = (f: number) => 3.5 + 1.2 * Math.sin(f * 0.37);

/* ------------------------------------------------------------------ anchored world items (never move) */
export const LAMPS = [560, 1400, 2240];
export const PALMS = [1010, 1850, 2690];

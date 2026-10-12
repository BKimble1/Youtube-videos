import {E, kf} from '../lib/motion';
import {FK, SidePose, hipOnGround, sideFK} from './side';
import {BIKE_R, BIKE_Y, EVT, GSY, GYW, SC, V0, X0, Z1, camX as camXA, heroPose, mugTilt, zoomAt} from './choreo2';
import {blendPose} from './choreoEC';

/**
 * H1 hybrid hook (E-C's causal globe + E-A v2's street action), 30 fps, 180 frames = 6.0 s.
 * Composition frame f maps to SCENE time s = sceneT(f): s < 0 is the walk before the stop, s = 0 is the first pitched pose.
 *   f 0-4   globe spins (blurred), she walks with her mug on a still street
 *   f 5     globe stops dead (continents crisp on one frame); her imbalance begins on the same frame; the clouds keep drifting for a few frames
 *   f 5-17  the street panel grows to full-bleed; the globe shrinks into an inset (top right)
 *   f 8     scene time 0: skid, spill; launch f17; brake f28-42; landing f35
 *   f 42-66 the street is still; she is dragged to rest and stands up stunned, the riderless bicycle rolls on past her; speed tags land on the lamp (anchored, 0) and the bicycle (loose)
 *   f 66-90 REWIND (scene time runs backward 2.75x: the fling un-happens, the coffee returns to the mug) to the moment before the stop
 *   f 90-180 'this street was moving east at about a thousand miles an hour': she keeps walking (no stop in this timeline), the globe spins again, EAST arrow and the 1,000 MPH readout land on the words
 */
export const FPS_H = 30;
export const N_H = 180;
export const T0_H = 8; // scene t = f - 8 until the slow-down starts
export const GLOBE_STOP = 5; // first still frame of the globe
export const VW = 8; // px per frame she walks before the stop (about 1.4 m/s)
export const LAND = EVT.land, LAUNCH = EVT.launch;
const HOP = 62;
export const TAUH = 12; // she is dragged to rest on the pavement; the bicycle is not (TAUB)
export const TAUB = 300;
export const RATE_A = 40, RATE_B = 62, RATE_MIN = 1; // 1 = no slow-down: friction drags her to rest, the bicycle keeps going (a slow-down was tried: the bicycle then loitered behind her)

/* ------------------------------------------------------------------ scene time (a gentle bullet-time after the brake) */
export const rateAt = (f: number) => (f < RATE_A ? 1 : 1 + (RATE_MIN - 1) * E.inOut(Math.min(1, (f - RATE_A) / (RATE_B - RATE_A))));
const sTable: number[] = (() => {
  const a = [-T0_H];
  for (let f = 0; f <= N_H + 4; f++) a.push(a[f] + rateAt(f + 0.5));
  return a;
})();
export const sceneT = (f: number) => {
  if (f <= 0) return -T0_H + f;
  const i = Math.floor(f), fr = f - i;
  return sTable[Math.min(i, sTable.length - 2)] * (1 - fr) + sTable[Math.min(i + 1, sTable.length - 1)] * fr;
};
/** composition frame at which scene time s occurs (for placing sounds) */
export const frameOfScene = (s: number) => {
  let lo = 0, hi = N_H + 3;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (sceneT(m) < s) lo = m; else hi = m; }
  return (lo + hi) / 2;
};

/* ------------------------------------------------------------------ hero */
export const WALK = (t: number): SidePose => {
  const p = (2 * Math.PI * (t - 6)) / 30;
  const s = Math.sin(p), c = Math.cos(p);
  return {
    lean: 3, head: 0,
    armN: {s: 26, e: 74}, armF: {s: 22 * -s, e: 10},
    legN: {h: 22 * s, k: 6 + 16 * Math.max(0, c), f: 0},
    legF: {h: -22 * s, k: 6 + 16 * Math.max(0, -c), f: 0},
    mouth: 'smile', brows: 0, lookY: 0,
  };
};
/** after the slide she is standing again, stunned, looking at the empty mug */
export const STUN: SidePose = {lean: 8, head: 6, armN: {s: 20, e: 42}, armF: {s: 8, e: 12}, legN: {h: 8, k: 4, f: 0}, legF: {h: -10, k: 2, f: 0}, mouth: 'o', brows: 0.85, lookY: 0.3};
const STUN0 = 36, STUN1 = 66;
const sm = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
export const hipXH = (t: number) => (t < 0 ? X0 + VW * t : t <= LAND ? X0 + V0 * t : X0 + V0 * LAND + V0 * TAUH * (1 - Math.exp(-(t - LAND) / TAUH)));
const poseH = (t: number): SidePose => {
  if (t < -4) return WALK(t);
  if (t < 0) return blendPose(WALK(t), heroPose(0), (t + 4) / 4);
  const b = blendPose(heroPose(t), STUN, sm((t - STUN0) / (STUN1 - STUN0)));
  const look = sm((t - 60) / 20); // she looks down at the empty mug, then up after the bicycle
  return t < STUN0 ? b : {...b, head: b.head - 9 * look, lookX: 1, lookY: (b.lookY ?? 0) - 0.5 * look};
};
const mugH = (t: number) => (t < -4 ? 0 : t < 0 ? mugTilt(0) * ((t + 4) / 4) : mugTilt(t) + (22 - mugTilt(t)) * sm((t - STUN0) / (STUN1 - STUN0)));
const groundY = (t: number) => hipOnGround(poseH(t), hipXH(t), GYW, SC).y;
export const hipYH = (t: number) => {
  if (t < LAUNCH || t >= LAND) return groundY(t) + (t >= LAND && t <= LAND + 8 ? -10 * Math.sin(((t - LAND) / 8) * Math.PI) : 0);
  const u = (t - LAUNCH) / (LAND - LAUNCH);
  return groundY(LAUNCH) + (groundY(LAND) - groundY(LAUNCH)) * u - 4 * HOP * u * (1 - u);
};
export type HeroH = {pose: SidePose; fk: FK; mug: number};
export const heroH = (t: number): HeroH => {
  const pose = poseH(t);
  return {pose, fk: sideFK(pose, {x: hipXH(t), y: hipYH(t)}, SC), mug: mugH(t)};
};
export const shoeXH = (t: number) => { const fk = heroH(t).fk; return fk.shoeN.y >= fk.shoeF.y ? fk.shoeN.x : fk.shoeF.x; };

/* ------------------------------------------------------------------ camera, bicycle */
export const camXH = (t: number) => (t < 0 ? camXA(0) + VW * t : camXA(t));
export const zoomH = (t: number) => zoomAt(t);
export const toScreenH = (x: number, y: number, t: number) => {
  const z = zoomH(t);
  return {x: 540 + (x - camXH(t)) * z, y: GSY + (y - GYW) * z};
};
export const BIKE_X0 = X0 - 700; // parked beyond the left edge until the stop
export const bikeXH = (s: number) => BIKE_X0 + V0 * Math.max(0, Math.min(s, LAND)) + (s > LAND ? V0 * TAUB * (1 - Math.exp(-(s - LAND) / TAUB)) : 0);
const bvel = (s: number) => (s <= 0 ? 0 : (s <= LAND ? V0 : V0 * Math.exp(-(s - LAND) / TAUB)) * Math.min(1, s / 14) ** 2 * (3 - 2 * Math.min(1, s / 14)));
const spinT: number[] = (() => { const a = [0]; for (let i = 1; i <= 400; i++) a.push(a[i - 1] + ((bvel(i * 0.5 - 0.25) / BIKE_R) * 180) / Math.PI * 0.5); return a; })();
export const bikeSpinH = (s: number) => { const x = Math.max(0, Math.min(398, s * 2)); const i = Math.floor(x); return spinT[i] + (spinT[i + 1] - spinT[i]) * (x - i); };
export const bikeTiltH = (s: number) => (s <= 0 ? 0 : 3.5 + 1.2 * Math.sin(s * 0.37));
export const BIKE_YH = BIKE_Y;

/* ------------------------------------------------------------------ layout / graphics timeline (composition frames) */
export const PANEL_T0 = 5, PANEL_T1 = 17;
export const panelP = (f: number) => (f <= PANEL_T0 ? 0 : f >= PANEL_T1 ? 1 : E.inOut((f - PANEL_T0) / (PANEL_T1 - PANEL_T0)));
export const INSET = {cx: 915, cy: 338, R: 72};
export const GLOBE_FULL = {cx: 540, cy: 575, R: 200};
export const INSET_AWAY = 62; // inset shrinks away over 10 frames once the connection has registered
export const CHIP = {hero: 43, bike: 47, lamp: 42, off: 124, bikeOff: 64}; // the lamp (anchored) says 0 MPH the moment the street goes still (f 42 = 1.4 s), the bicycle tag follows on "right"
export const EAST_F = 113, NUM_A = 130, NUM_B = 151, MPH_F = 154;
/** voice timing of the selected take, in composition frames (30 fps) from audio/v3/voice/r2_takeB_alignment.json + the energy segmentation */
export const VOICE = {first: 1, stopped: 22, dashA: 36, dashB: 47, rightNow: 47, nowEnd: 65, secondA: 82, east: 115, thousand: 139, end: 175};

/* ------------------------------------------------------------------ the rewind and the "no stop" timeline (the street as it was) */
export const RW0 = 66, RW1 = 90;
export const RWK = (sceneT(RW0) + T0_H) / (RW1 - RW0); // rewind speed: scene time at f 66 runs back to the walk before the stop (s = -8) by f 90
export type SceneState = {s: number; mode: 'stop' | 'nostop'};
export const sceneFor = (f: number): SceneState => (f < RW0 ? {s: sceneT(f), mode: 'stop'} : f < RW1 ? {s: sceneT(RW0) - RWK * (f - RW0), mode: 'stop'} : {s: -T0_H + (f - RW1), mode: 'nostop'});
export const heroNS = (s: number): HeroH => { const pose = WALK(s); return {pose, fk: sideFK(pose, hipOnGround(pose, X0 + VW * s, GYW, SC), SC), mug: 0}; };
export const camXNS = (s: number) => camXA(0) + VW * s;
export const heroFor = (st: SceneState) => (st.mode === 'stop' ? heroH(st.s) : heroNS(st.s));
export const camFor = (st: SceneState) => (st.mode === 'stop' ? camXH(st.s) : camXNS(st.s));
/** in the "was" timeline the camera eases back from the stop-time zoom to the pulled-back zoom (the same 0.86 the street settles at), so she is smaller and the readout has room above her */
export const zoomFor = (st: SceneState) => (st.mode === 'stop' ? zoomH(st.s) : Z1 + (0.86 - Z1) * E.inOut(Math.max(0, Math.min(1, (st.s + T0_H) / 14))));
export const toScreenFor = (x: number, y: number, st: SceneState) => { const z = zoomFor(st); return {x: 540 + (x - camFor(st)) * z, y: GSY + (y - GYW) * z}; };

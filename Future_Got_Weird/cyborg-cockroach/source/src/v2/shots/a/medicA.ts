// Group A (V3): the medic after the hook, as one continuous performance through A3-A5 (a pure function of film time t).
//   - It stands in A1's firing stance (body origin at world x = 0 heading +x, the clear target's face at A1_FACE), the
//     tube empty and the spring extended, the fired injector left in the silicone (A1's stance frame).
//   - MED_PULSE: the operator's steering command arrives (board LED, a short pulse train along the LEFT antenna wire:
//     it will veer right).
//   - MED_BACK: it draws back a few millimetres on its planted feet (the tube slides off the injector's rear) and pivots
//     a few degrees on them, away from the target, toward its right (+z, the camera side in A4).
//   - MED_GO: it steps: a short-stride tripod turn about a point over its middle legs (quick steps, the body turning
//     ~158 degrees while it hardly travels), then it walks off with short quick strides toward the foam course at -x.
// The gait is the rig's tripod (poseRoach, stride 26 in gait units, planted feet) along a custom Path whose position and
// heading are pure functions of the gait distance s: while turning, the body moves only KMAX of each gait unit, so the
// feet plant on short strides (no foot sliding: every planted foot is a fixed world point while it is down).
import {V3} from '../../../lib/v3';
import {poseRoach, plantedStop, Path, RoachPose} from '../../../rig/roach';
import {INJ} from '../../../rig/gear';
import {clamp, lerp, sr, smooth} from '../../../lib/ease';
import {GearState, SPRING_FREE} from '../../roach/Gear2D';
import {A1_FACE, A1_TRAVEL, a1InjFrame} from '../h/A1';
import {constrainAntenna} from '../d/trial';

/** A1's stance (gait distance at the stop: all six feet planted) */
export const MED_S0 = plantedStop(36);
/** the steering command (board LED + pulses on the left antenna wire), the draw-back, the first step */
export const MED_PULSE = 2.62;
export const MED_BACK0 = 2.72;
export const MED_BACK1 = 2.92;
export const MED_GO = 2.8;
/** gait speed (gait units per second: 26 per stride, ~4 steps a second per tripod) and its ramp-up */
const VS = 125;
const TA = 0.28;
/** the turn: total heading change (rad, - = toward +z: the insect's right), over LT gait units, about body x = PIV */
export const MED_TURN = -2.75;
const LT = 112;
const PIV = 4;
/** the body's travel per gait unit once walking (short quick strides: ~0.46 x 26 = 12 mm per stride; ~57 mm/s) */
const KMAX = 0.46;
/** a small pivot on planted feet before the first step (rad, the same direction as the turn) */
const Y_PLANT = -0.07;
/** how far the body draws back on its planted feet (mm, body x) */
const BACK = 3.2;

// the turn path, integrated once on a grid of gait units w = s - MED_S0 (0.25 apart)
const W_MAX = 900;
const STEP = 0.25;
const yawW = (w: number) => (w <= 0 ? 0 : MED_TURN * smooth(w / LT));
const kW = (w: number) => KMAX * smooth((w - 0.2 * LT) / (0.7 * LT));
/** while it turns the body also eases back from the target (a sidestep: the outer legs, swinging round in front of
 *  it, then plant clear of the silicone) */
const DRIFT = 6;
const driftW = (w: number) => (w <= 0 ? 0 : -DRIFT * smooth(w / (0.7 * LT)));
const N = Math.ceil(W_MAX / STEP) + 1;
const TX = new Float64Array(N);
const TZ = new Float64Array(N);
for (let i = 1; i < N; i++) {
  const w = (i - 0.5) * STEP;
  const y = yawW(w);
  const k = kW(w);
  TX[i] = TX[i - 1] + Math.cos(y) * k * STEP;
  TZ[i] = TZ[i - 1] - Math.sin(y) * k * STEP;
}
/** the medic's path by gait distance s (A1's straight approach before the stance) */
export const MED_PATH: Path = (s: number) => {
  const w = s - MED_S0;
  if (w <= 0) return {p: [w, 0, 0], yaw: 0};
  const u = clamp(w / STEP, 0, N - 1.0001);
  const i = Math.floor(u);
  const f = u - i;
  const y = yawW(w);
  // the pivot: the body origin swings round the point PIV ahead of it, plus the travel so far
  const px = PIV - PIV * Math.cos(y) + TX[i] + (TX[i + 1] - TX[i]) * f + driftW(w);
  const pz = PIV * Math.sin(y) + TZ[i] + (TZ[i + 1] - TZ[i]) * f;
  return {p: [px, 0, pz], yaw: y};
};

/** gait distance at time t */
export const medS = (t: number) => {
  const dt = t - MED_GO;
  if (dt <= 0) return MED_S0;
  if (dt < TA) {
    const u = dt / TA;
    return MED_S0 + VS * TA * (u * u * u - (u * u * u * u) / 2);
  }
  return MED_S0 + VS * TA * 0.5 + VS * (dt - TA);
};

const back = (t: number) => sr(t, MED_BACK0, MED_BACK1) * (1 - sr(t, MED_GO + 0.3, MED_GO + 1.1));

/** the posed medic at film time t */
export const medPose = (t: number): RoachPose => {
  const s = medS(t);
  const w = s - MED_S0;
  // planted pivot first; the path's own heading takes over as it steps
  const pl = Y_PLANT * sr(t, MED_BACK0 + 0.04, MED_GO + 0.1);
  const yawAdd = Math.abs(yawW(w)) >= Math.abs(pl) ? 0 : pl - yawW(w);
  // antennae: spread up on the silicone face (A1's stance), then forward and low for walking
  const wk = sr(t, MED_BACK0, MED_GO + 0.45);
  const p = poseRoach({
    path: MED_PATH,
    s,
    t,
    search: lerp(0.75, 0.6, wk),
    offset: [-BACK * back(t), 0, 0],
    yawAdd,
    antL: {yaw: lerp(1.2, 0.55, wk), pitch: lerp(0.75, 0.22, wk), curl: lerp(0.7, 0.85, wk)},
    antR: {yaw: lerp(1.2, 0.55, wk), pitch: lerp(0.75, 0.22, wk), curl: lerp(0.7, 0.85, wk)},
  });
  return {...p, antL: constrainAntenna(p.antL, A1_FACE), antR: constrainAntenna(p.antR, A1_FACE)};
};

/** the fired injector left in the target (A1's stance frame) and its rear (body x along the tube) */
export const MED_INJ_REAR = INJ.loadedRear + A1_TRAVEL;
export const medInjFrame = () => a1InjFrame();

/** the steering command: the board's LED blinks and three pulses run the LEFT antenna wire (board -> electrode) */
export const medSteer = (t: number) => {
  const fr: number[] = [];
  let zap = 0;
  for (let k = 0; k < 3; k++) {
    const u = (t - (MED_PULSE + k * 0.07)) / 0.16;
    if (u >= 0 && u <= 1) fr.push(1 - Math.pow(1 - u, 1.25));
    const da = t - (MED_PULSE + k * 0.07 + 0.16);
    if (da >= 0) zap = Math.max(zap, Math.exp(-da / 0.12));
  }
  const led = t >= MED_PULSE - 0.03 && t <= MED_PULSE + 0.2 ? 1 : 0;
  return {fr, zap: Math.min(1, zap), led};
};

/** the medic's gear: the empty tube with the spring at its free length (the injector stays in the target) */
export const medGear = (t: number): GearState => {
  const st = medSteer(t);
  return {
    kind: 'injector',
    spent: true,
    injRear: MED_INJ_REAR,
    springFront: SPRING_FREE,
    latched: false,
    heat: 0,
    led: st.led,
    pulses: st.fr.length ? {antL: st.fr} : undefined,
    zap: st.zap > 0.02 ? {antL: st.zap} : undefined,
  };
};

/** the body origin on the ground at time t (world mm) and the heading */
export const medAt = (t: number): {p: V3; yaw: number} => MED_PATH(medS(t));

// V4 A (and the end of H across the seam): the discharge state on the loop clock.
//   corona  the field at the rod tip: builds from 31.88 (the field-build crackle), crackles across the seam and through
//           A1/A2 (the mix's loop crackle, 0-1.75), steadies, then strengthens on openCam (2.2-2.47) into inception
//   leader  incepts at the rod tip at INC (2.47, after the camera has settled at 2.35) and climbs the cyan path: the
//           guided section (54 m) takes most of the climb (to the word "FOLLOWED", 3.26); above it the leader leaves the
//           line, branches and races to the cloud, connecting at 3.52 (the quiet crack); re-strokes 3.64, 3.83
//   light   the leader's own glow while it climbs, then V3's strike light from the connection (3.52), blended into
//           V3's openSt values by 4.2 (A -> B: from 4.2 the state is openSt(t) exactly)
// Before inception there is no discharge; the storm flash inside the deck at 1.75 is Open4's own local light.
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {BOLT3} from '../v2/p3';
import {stream} from '../v2/shots3d';
import {openSt} from '../v3/states3';
import {EV, openS, strikeLight, tau3} from '../v3/timeline3';
import {St} from '../v3/view3';
import {chTopH, endPulses} from '../v3/Open3_end';

export const INC = 2.47; // inception at the rod tip
export const GUIDED_T = 3.26; // the leader reaches the top of the guided section ("FOLLOWED")
export const CONNECT4 = 3.52; // connection to the cloud (the quiet crack)
export const RESTRIKES4 = [3.64, 3.83];
/** the end of the hand-over to V3's openSt (A -> B) */
export const HAND4 = 4.2;
const G_S = BOLT3.guidedS, TOTAL = openS(EV.connect); // openS's own connected length (119.997 m), so the hand-over is exact

/** the leader length (m along BOLT3) on film time; -1 before inception */
export const openS4 = (t0: number) => {
  // (the opening's leader only: before inception, and at the end of the film (tau < 0), there is none)
  const t = tau3(t0);
  if (t < INC) return -1;
  if (t >= CONNECT4) return TOTAL;
  if (t <= GUIDED_T) {
    // the guided climb: starts at a walking pace (readable at the tip) and gathers speed
    const u = (t - INC) / (GUIDED_T - INC);
    return Math.max(0.3, G_S * (0.3 * u + 0.7 * u * u));
  }
  // above the guided section: the same speed at the hand-over, then accelerating to the cloud
  const v0 = (G_S * (0.3 + 1.4)) / (GUIDED_T - INC);
  const w = t - GUIDED_T, W = CONNECT4 - GUIDED_T;
  const a = (TOTAL - G_S - v0 * W) / (W * W);
  return Math.min(TOTAL, G_S + v0 * w + a * w * w);
};

/** the field at the rod tip (0..1 envelope, without flicker), across the seam */
export const fieldK = (t: number) => {
  const tau = tau3(t);
  if (tau < 0) return 0.65 * ss(tau, EV.fieldBuilds - 33.5, -0.4);
  if (t < INC) return 0.65 - 0.12 * ss(t, 1.6, 2.0) + 0.47 * ss(t, 2.15, INC);
  return 0;
};

/** V4 light: the climbing leader's own glow, then V3's strike light from the connection, blended into openSt by HAND4 */
const light4 = (t: number) => {
  if (t < CONNECT4) return {core: 0.88, scene: 0.1};
  return strikeLight(t, CONNECT4, RESTRIKES4, 3.95, 4.7);
};
/** hand-over weight to openSt (0 until 3.9, 1 from HAND4) */
export const handK = (t: number) => ss(t, 3.9, HAND4);

/** the A state on film time (A only: t < 4.31) */
export const openSt4 = (t: number): St => {
  const o = openSt(t);
  if (t >= HAND4) return o;
  const s = openS4(t);
  const L = light4(t);
  const h = handK(t);
  const core = s > 0 ? L.core + (o.core - L.core) * h : 0;
  const flash0 = s > 0 ? Math.max(L.scene, 0.1) * clamp(s / 16) : 0;
  const flash = flash0 + (o.flash - flash0) * h;
  const fk = fieldK(t);
  const corona = s > 0 ? clamp(1 - (s - 2) / 10) : fk * (0.5 + 0.5 * Math.abs(Math.sin(t * 23)));
  return {...o, s, core, flash, tipCorona: corona, pulses: stream(tau3(t))};
};

/** the H2 state (30.74-33.5): no discharge; H's fast packet clock (a packet on each payoff tick) landing on the loop
 *  clock; the field builds at the tip from 31.88; the extended channel (V3's CH_TOP) */
export const h2St4 = (t: number): St => {
  const fk = fieldK(t);
  return {
    s: -1, core: 0, flash: 0, beam: 0.9, pulses: endPulses(t), channel: 0.8 + 0.1 * (1 - ss(t, 32.2, 33.2)), channelTop: chTopH(t),
    tipCorona: fk * (0.5 + 0.5 * Math.abs(Math.sin(tau3(t) * 23))),
  };
};

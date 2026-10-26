// V3 timeline. The narration, captions and the whole V2 mix are locked (source/public/audio/mix_v2.wav, sha256
// ed86c578…; see production/V3_AUDIO_LOCK.md), so the picture is fitted to them: every event time below comes from
// a word time (source/src/data/timeline.json) or an effect already in the mix (audio/sfx_cues_v2.json).
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {boltLight} from '../world/site';
import {BOLT3} from '../v2/p3';

export const DUR = 33.5;
export const FPS3 = 30;
/** the loop clock: the end of the film runs on negative time so the seam is continuous */
export const tau3 = (t: number) => (t > DUR / 2 ? t - DUR : t);

/** beat boundaries (film seconds) */
export const B = {
  A: 0, // opening demonstration (exterior, one setup)
  B: 4.31, // why ordinary air resists (push from A into the air beside the channel, molecular view)
  C: 7.81, // machine: press (C1), optics (C2), exit and pulses into the air (C3)
  C2: 8.95,
  C3: 9.67,
  D: 11.42, // electrons, heating, the channel (one molecular scene)
  E: 15.83, // the easier path (leader in the channel), pull-out to the sky
  F: 18.79, // upward lightning and the measured guided section (one main view)
  G: 25.61, // ordinary rod (one push)
  H: 28.94, // extension into the sky, apparatus reveal, return to the opening camera
  H2: 30.74, // the single cut in H: to the apparatus, then the crane up the beam to the opening camera
  END: 33.5,
};

/** events locked to the existing mix (sound effect start times) and to words */
export const EV = {
  // A
  loopInception: 32.9, // the next leader starts at the tip (loop leader crackle starts; crosses the seam)
  connect: 1.75, // opening connection crack
  restrikes: [3.52, 3.64, 3.83], // muffled restrike cracks
  wordFollowed: 3.26,
  // B (the effects V2 used for its vignette now drive the side streamer and its stall)
  streamerFizz: 4.36, streamerSnap: 4.52, streamerZap1: 4.55, streamerZap2: 4.73, streamerSizzle: 4.85,
  settle: 5.0, // texture swell 5.0-5.5 as the molecular view settles
  wordAir: 5.01,
  attempts: [5.6, 6.35, 7.05], // 'streamer attempt stalls' crackles
  // C
  fireClick: 8.01, fireRelay: 8.07, hum: 7.81,
  opticsPackets: 8.9, // + k/9, k = 0..6
  windowPackets: 9.61, // + k/9, k = 0..6
  pushIntoPulse: 10.98, // swell 10.98-11.43
  // D
  pulsePasses: 11.42, // swell 11.42-12.32
  electronsFreed: [11.5, 11.6, 11.7, 11.8, 11.9, 12.0, 12.1, 12.2], // quiet pings
  tornAway: [12.62, 12.92], // louder pings + sparks (the representative electrons)
  heating: 13.43, // shimmer 13.43-15.73 ('heating' 13.49)
  wordChannel: 14.3, wordSky: 14.91,
  // E
  leaderRuns: 15.98, leaderEnds: 18.58, // crackle 15.98-18.58
  // F
  demoInception: 19.55, demoConnect: 21.85, thunder: 22.25,
  wordUpward: 19.99, wordTower: 20.9, wordChannelF: 22.9,
  wordOne: 23.64, wordSixty: 24.34, wordFeet: 24.75,
  // G
  distantStrike: 25.74, distantThunder: 26.2, farFlicker: 28.25, wordMetal: 27.89, wordTip: 28.15,
  // H
  channelExtends: 29.19, // shimmer 29.19-30.89
  wordExtended: 29.92, wordSky2: 31.1,
  payoffTicks: [30.84, 31.14, 31.44, 31.74],
  fieldBuilds: 31.88, // crackle 31.88-32.9
};

// ------------------------------------------------------------------ the discharges
/** the opening leader length (m along BOLT3): incepts at EV.loopInception (tau -0.6), ~30 m at frame 0, connects to
 *  the cloud at EV.connect (illustrative slow motion; the same curve as V2's loop so the seam sound fits) */
export const LOOP0 = -0.6;
export const openS = (tau: number) => {
  if (tau < LOOP0) return -1;
  const x = Math.min(tau, EV.connect);
  return 30 + 45 * x - 5.27 * x * x + 5.11 * x * x * x;
};
/** the demonstration leader: incepts 19.55, connects 21.85 */
export const demoS = (t: number) => {
  const x = clamp((t - EV.demoInception) / (EV.demoConnect - EV.demoInception));
  if (t < EV.demoInception) return -1;
  return BOLT3.total * (0.55 * x + 0.1 * x * x + 0.35 * x * x * x);
};

/** discharge light after a connection at t0: the connection flash and its re-strokes, then a held, slowly fading
 *  luminous channel (illustrative slow motion) until holdEnd, gone by fadeEnd */
export const strikeLight = (t: number, t0: number, restrikes: number[], holdEnd: number, fadeEnd: number) => {
  if (t < t0) return {core: 0.85, scene: 0.1};
  const base = boltLight(t - t0, 1.5);
  const re = restrikes.reduce((a, r, k) => a + (t >= r ? Math.exp(-(t - r) / 0.07) * (1 - 0.2 * k) : 0), 0);
  const hold = 0.55 + 0.45 * Math.exp(-(t - t0) / 0.6);
  const fade = 1 - ss(t, holdEnd, fadeEnd);
  const core = Math.max(base.core, Math.min(1.6, hold * (0.9 + 0.7 * re))) * fade;
  const scene = Math.max(base.scene, Math.min(1, 0.12 + 0.7 * re)) * fade;
  return {core, scene};
};
export const openLight = (tau: number) => strikeLight(tau, EV.connect, EV.restrikes, 3.95, 4.7);
export const demoLight = (t: number) => strikeLight(t, EV.demoConnect, [], 25.15, 25.75);

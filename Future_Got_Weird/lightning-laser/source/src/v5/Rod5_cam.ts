// V5 beat G (25.61-28.94): the ordinary rod, its lightning shown. Cameras, timing and light (pure functions of film
// time t). The house is V3's (Rod3_cam.ts HOUSE: a plain inside the near ranges, under the same night storm).
//   G1 25.61-26.64  "A normal lightning ROD": a wide from the far side of the garden, the house small under a big
//                   storm sky (a distance that fits the quiet crack). The downward stepped leader is already coming
//                   down out of the deck at the cut; it steps down to the rod, a short streamer leaps up from the tip to
//                   meet it, and the return stroke lands on "ROD" with the distant crack (25.74): the whole channel
//                   from the cloud to the metal tip lights, a re-stroke at 25.86, and the current runs down the
//                   conductor to the earth clamp. The channel's glow fades through the thunder (26.2). The camera
//                   creeps toward the house the whole time (no hold).
//   G2 26.64-28.94  "only reaches as high / as its metal TIP": one cut in on the caption change, onto the house with
//                   its whole conductor, already moving: the camera rises along the conductor and closes in on the rod,
//                   settling (28.45) with the tip at screen (540, 820), pointing straight up (G -> H). The far flicker
//                   (28.25) glints on the tip.
import {sm5} from '../camera';
import {clamp} from '../dc/math';
import {Cam3} from '../v2/p3';
import {hw, TIP_W} from '../v3/Rod3_cam';
import {B, EV} from '../v3/timeline3';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lg = (a: number, b: number, w: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * w);

// ------------------------------------------------------------------ timing
export const G_CUT = 26.64; // the cut in (caption "only reaches as high")
/** the leader's (virtual) start in the deck, just before the cut, and the junction at the rod (frame 772, 25.733: on
 *  the distant crack at 25.74) */
export const LEADER0 = 25.575, JUNCTION = 25.728;
/** the return strokes: the first on the crack, a re-stroke on its tail, a last faint one */
export const STROKES5 = [JUNCTION, 25.86, 26.02];

// ------------------------------------------------------------------ cameras (house-local metres: x right, y up, z back from the facade)
type HK = {x: number; h: number; d: number; f: number; tipX: number; tipY: number};
/** a level camera square to the facade, the rod tip placed exactly on screen by a shifted lens (walls stay vertical) */
const camOf = (k: HK): Cam3 => {
  const pos = hw(k.x, k.h, -k.d);
  const D = TIP_W.z - pos.z;
  return {pos, yaw: 0, pitch: 0, roll: 0, f: k.f, cx: k.tipX - (k.f * (TIP_W.x - pos.x)) / D, cy: k.tipY + (k.f * (TIP_W.y - pos.y)) / D};
};
/** G1, the wide: from the far side of the garden, low; the house in the lower middle, the storm filling the frame
 *  above it, so the bolt's whole way down reads */
export const G1A: HK = {x: -1.2, h: 2.6, d: 37, f: 1300, tipX: 560, tipY: 1120};
export const G1B: HK = {x: -0.9, h: 2.8, d: 33, f: 1300, tipX: 556, tipY: 1110};
/** G2: the house and its whole conductor (cut in from G1), then the rise and close-in to V3's end framing */
export const G2A: HK = {x: -0.7, h: 2.2, d: 16.5, f: 1400, tipX: 548, tipY: 600};
export const G2B: HK = {x: 0, h: 9.45, d: 10.2, f: 2750, tipX: 540, tipY: 820};
export const SETTLE = 28.45;
/** G2's progress: in motion from the cut (normalised speed V0), decelerating to rest at SETTLE */
const V0 = 0.55;
const g2K = (x: number) => sm5(x) + V0 * (x - 6 * x ** 3 + 8 * x ** 4 - 3 * x ** 5);
export const pushK5 = (t: number) => g2K(u(t, G_CUT, SETTLE));

export const rodCam5 = (t: number): Cam3 => {
  if (t < G_CUT) {
    // a steady creep toward the house (linear: a cut lands on it already moving, and the cut out keeps going)
    const w = u(t, B.G, G_CUT);
    const k: HK = {
      x: G1A.x + (G1B.x - G1A.x) * w, h: G1A.h + (G1B.h - G1A.h) * w, d: G1A.d + (G1B.d - G1A.d) * w,
      f: G1A.f, tipX: G1A.tipX + (G1B.tipX - G1A.tipX) * w, tipY: G1A.tipY + (G1B.tipY - G1A.tipY) * w,
    };
    return camOf(k);
  }
  const x = u(t, G_CUT, SETTLE);
  const k = g2K(x);
  // the height leads the closing-in (the camera rises along the conductor on the wall, then closes on the rod)
  const kh = g2K(clamp(x * 1.12));
  return camOf({
    x: G2A.x + (G2B.x - G2A.x) * k, h: G2A.h + (G2B.h - G2A.h) * kh, d: lg(G2A.d, G2B.d, k), f: lg(G2A.f, G2B.f, k),
    tipX: G2A.tipX + (G2B.tipX - G2A.tipX) * k, tipY: G2A.tipY + (G2B.tipY - G2A.tipY) * k,
  });
};
/** G's last frame, exactly (H's split opens from it) */
export const rodEndCam = (): Cam3 => camOf(G2B);
export const rodCamAt = camOf;
export type {HK};

// ------------------------------------------------------------------ light
const pulse = (t: number, t0: number, tau: number) => (t < t0 - 0.02 ? 0 : t < t0 ? (t - t0 + 0.02) / 0.02 : Math.exp(-(t - t0) / tau));
/** the leader's growth front (0 at the cloud base, 1 at the junction above the rod) */
export const leaderU = (t: number) => {
  if (t < LEADER0) return -1;
  const x = u(t, LEADER0, JUNCTION);
  return 0.94 * x + 0.06 * x * x;
};
/** the return strokes' light (0..~1.4): the first, the re-stroke, the faint last one */
export const strokeK5 = (t: number) => pulse(t, STROKES5[0], 0.11) + 0.62 * pulse(t, STROKES5[1], 0.08) + 0.3 * pulse(t, STROKES5[2], 0.07);
/** the luminous channel's hold after the junction (illustrative slow motion): bright, then fading through the thunder,
 *  gone by ~26.55, before the cut in */
export const channelHold = (t: number) => (t < JUNCTION ? 0 : (0.45 + 0.55 * Math.exp(-(t - JUNCTION) / 0.22)) * (1 - sm5(u(t, 26.12, 26.6))));
/** the scene's light from the strike (sky, cloud base, house, garden, rain) */
export const sceneFlash = (t: number) => clamp(0.85 * strokeK5(t) + 0.12 * channelHold(t));
/** the current down the conductor: the head's position (0 at the rod tip, 1 at the earth clamp) for a surge leaving
 *  the tip at t0 and taking dur to reach the clamp, or -1 */
export const surgeAt = (t: number, t0: number, dur: number) => (t < t0 ? -1 : (t - t0) / dur);
export const SURGES = [
  {t0: JUNCTION, dur: 0.2, k: 1},
  {t0: STROKES5[1], dur: 0.17, k: 0.6},
];
/** the earth clamp's flash as each surge reaches the ground */
export const groundK = (t: number) => SURGES.reduce((a, s) => a + s.k * pulse(t, s.t0 + s.dur, 0.09), 0);
/** the faint far flicker (28.25) on the tip at the end, as V3 */
export const flicker5 = (t: number) => pulse(t, EV.farFlicker, 0.06) * 0.3 + pulse(t, EV.farFlicker + 0.09, 0.05) * 0.18;

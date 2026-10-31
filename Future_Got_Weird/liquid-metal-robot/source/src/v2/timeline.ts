// V1 timeline: every beat after the opening is read from the locked narration (data/words.json). The opening (scenes
// 1-2) replays the winning preview in its own time tp = warpPrev(t), so its beats land on this narration's words.
import WORDS from '../data/words.json';
import {keyCR, wordAt, Words} from '../shared/lib';
import {V3, v3} from './cam';
import {ZT} from './props';

export const W = WORDS as Words;
const st = (w: string, n = 0) => wordAt(W, w, n).start;
const en = (w: string, n = 0) => wordAt(W, w, n).end;

/** film time -> preview time (anchors: the preview's word starts / lift beats against this narration's) */
const WARP: [number, number][] = [
  [-1, -1], // (lead-in key: keeps the warp's speed at 1 through frame 0 instead of easing in)
  [0, 0],
  [st('melts'), 1.12],
  [st('cage'), 1.88],
  [st('then'), 2.62],
  [st('remolded'), 3.12],
  [st('into'), 3.76],
  [st('shape'), 4.08],
  [st('shape') + 0.3, 4.44], // frozen
  [st('shape') + 0.47, 4.74], // magnet meets the head
  [st('shape') + 0.76, 5.14], // stood up
  [st('shape') + 1.05, 5.5], // set down outside the cage
  [st('shape') + 1.13, 5.6], // released
  [st('shape') + 1.8, 6.4],
  [st('shape') + 2.8, 7.4], // (lead-out key: the warp leaves at speed 1)
];
export const warpPrev = (t: number) => (t >= WARP[WARP.length - 2][0] ? 6.4 + (t - WARP[WARP.length - 2][0]) : keyCR(t, WARP));
export const PREV_END = st('shape') + 1.13; // ~5.03 s: the figure stands outside the cage, the magnet lets go

export const T = {
  // scene 3: push into the figure, cut window, particles, back out
  push0: st('shape') + 0.95,
  open0: st('gallium') + 0.2,
  open1: st('tiny') + 0.15,
  peak: st('particles') - 0.04,
  // V2: stay inside the section while the field heats the particles and the gallium round them melts
  heat0: st('magnetic', 1),
  heat1: st('heats') + 0.05,
  mmelt0: st('heats'),
  mmelt1: st('liquid') - 0.05,
  out0: st('liquid') - 0.1,
  close1: st('liquid') + 0.39,
  // scene 4: heat -> liquid (seen on the bench as we come out), steer, cool -> solid
  coilOn: st('magnetic', 1),
  melt0: st('liquid') + 0.38,
  front1: st('liquid') + 0.92,
  slump0: st('liquid') + 0.5,
  slump1: st('another') + 0.42,
  steer0: st('another') + 0.5,
  steer1: en('metal', 1) + 0.25,
  coilOff: st('cools') - 0.3,
  freeze0: st('cools') + 0.05,
  freeze1: st('hardens') + 0.45,
  pull0: en('again') - 0.1,
  // scene 5-6: reveal, approach, wrap, harden, carry out
  reveal0: st('but'),
  reveal1: en('stranger'),
  heat2: st('melted') - 0.25,
  wrap0: st('melted'),
  around: st('around'),
  wrap1: en('object') + 0.05,
  freeze3_0: st('hardened') - 0.1,
  freeze3_1: en('hardened') + 0.12,
  carry0: st('carried'),
  out: en('out'),
  q0: st('would'),
  q1: en('you', 1),
  end: W.speech_end + 1.78,
};

// ---------------------------------------------------------------- places on the bench (cm)
export const STAGE = {x0: 2.45, x1: 11.4, y0: -3.9, y1: 4.0};
export const MODEL_O = v3(7.3, -0.8, ZT); // stomach model's local origin
export const TUBE = {x0: 3.35, x1: 5.95, y: 0.25, r: 0.55};
export const BALL_R = 0.28;
export const BALL0 = v3(8.0, 0.9, ZT + BALL_R);
export const COIL2 = v3(8.0, 0.9, ZT);
export const P2_0 = v3(1.1, -1.6, ZT); // puddle under the melted figure
export const SLUG_HARD = v3(1.85, 0.3, ZT);
export const SLUG_TOUCH = v3(7.31, 0.7, ZT);

/** the puddle steered by the magnet (scene 4) */
export const puddleAt = (t: number): V3 =>
  v3(
    keyCR(t, [[T.steer0 - 0.1, P2_0.x], [T.steer0 + 0.42, 1.85], [T.steer0 + 0.82, 1.68], [T.steer1, SLUG_HARD.x]]),
    keyCR(t, [[T.steer0 - 0.1, P2_0.y], [T.steer0 + 0.42, -1.05], [T.steer0 + 0.82, -0.32], [T.steer1, SLUG_HARD.y]]),
    ZT,
  );
/** the solid slug, pulled rigidly to the model and inside to the ball */
export const slugAt = (t: number): V3 =>
  v3(
    keyCR(t, [[T.pull0, SLUG_HARD.x], [T.pull0 + 0.9, 2.45], [15.5, 3.25], [16.5, 4.6], [17.3, 5.8], [18.1, 6.8], [T.wrap0 - 0.14, SLUG_TOUCH.x]]),
    keyCR(t, [[T.pull0, SLUG_HARD.y], [T.pull0 + 0.9, 0.27], [15.5, 0.25], [16.5, 0.25], [17.3, 0.32], [18.1, 0.56], [T.wrap0 - 0.14, SLUG_TOUCH.y]]),
    ZT,
  );
/** the ball (and, once gripped, the whole assembly) */
export const ballAt = (t: number): V3 =>
  t <= T.carry0
    ? BALL0
    : v3(
        keyCR(t, [[T.carry0, BALL0.x], [T.carry0 + 0.55, 7.2], [T.out + 0.05, 5.8], [23.15, 4.5], [23.8, 3.2], [24.4, 2.5], [25.0, 1.78], [25.55, 1.2], [T.end, 1.05]]),
        keyCR(t, [[T.carry0, BALL0.y], [T.carry0 + 0.55, 0.68], [T.out + 0.05, 0.31], [23.15, 0.25], [23.8, 0.24], [24.4, -0.15], [25.0, -0.85], [25.55, -1.28], [T.end, -1.38]]),
        BALL0.z,
      );

// V5 gait: V3's tripod walk (planted feet, stride, duty, ground riding), started FROM a standing pose without sliding:
// each leg's first stance stays exactly where that foot stood, and its first swing lifts from there. (V3 blended the
// standing feet into the walk's feet over 0.3 s, so planted feet slid.)
import {lerp3, V3} from '../core/three';
import {toW} from '../core/frame';
import {frameOf, Path, pathAt, STRIDE, walkState, WalkOpts} from '../roach/gait';
import {pair, planted, REST_FOOT, RoachState, side} from '../roach/rig';
import {add3, mul3} from '../core/three';

const DUTY = 0.6;
const OFF = [0, 0.5, 0.5, 0, 0, 0.5];
export const walkFrom = (P: Path, s: number, base: Partial<RoachState>, startFeet: V3[], o: WalkOpts = {}): RoachState => {
  const st = walkState(P, s, base, o); // body pose and all other state as V3
  const stride = o.stride ?? STRIDE;
  const ph = s / stride;
  const sp = o.spread ?? 1;
  const plantAt = (i: number, n: number): V3 => {
    const n0 = Math.floor(-OFF[i]); // the stance the leg is in at s = 0
    if (n <= n0) return startFeet[i];
    const sMid = (n + OFF[i] + DUTY / 2) * stride;
    const F = frameOf(pathAt(P, sMid));
    const rf = REST_FOOT[i];
    const w = toW(F, [rf[0], rf[1] * sp, 0]);
    return [w[0], w[1], P.ground ? P.ground(w[0], w[1]) : (P.z ?? 0)];
  };
  st.legs = REST_FOOT.map((_, i) => {
    const u = ph - OFF[i];
    const n = Math.floor(u);
    const f = u - n;
    if (f < DUTY) return planted(st, i, plantAt(i, n));
    const e = (f - DUTY) / (1 - DUTY);
    const ee = e * e * (3 - 2 * e);
    const a = plantAt(i, n), b = plantAt(i, n + 1);
    // front legs swing lower (their knees otherwise rose through the pronotum's side)
    const lift = (o.lift ?? 4.5) * (i < 2 ? 0.55 : 1) * Math.sin(Math.PI * e);
    return planted(st, i, lerp3(a, b, ee), [0, 0, 1], lift);
  });
  return st;
};

/** V5 knee direction (the IK pole) for every leg: front and middle knees a little lower and wider than V3's, so a
 *  bending knee stays outside the pronotum / mesonotum edge instead of rising into it */
export const MID_POLE = [0.8, 1.0, 0.5];
export const withPoles = (st: RoachState): RoachState => ({...st, legs: st.legs.map((L, i) => {
  const k = pair(i), s = side(i);
  const pole = add3(mul3(st.body.u, [0.45, MID_POLE[0], 1.0][k]), add3(mul3(st.body.l, [1.35, MID_POLE[1], 0.8][k] * s), mul3(st.body.f, [0.6, MID_POLE[2], -0.6][k])));
  return {...L, pole};
})});

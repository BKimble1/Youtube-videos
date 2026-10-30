// HOOK 03 motion: the mantis's plunge and struggle, the worm's emergence, and the camera, all functions of t (s).
import {add3, Cam3, lerp3, mul3, V3} from '../shared/three';
import {keyCR, ss, ss5} from '../shared/lib';
import {dirW, pitchF, toW} from './core/frame';
import {bodyFrame, EXIT_D, EXIT_L, MState} from './mantis';
import {emerged, outsidePts, WORM_L} from './worm';
import {EV} from './timeline';

/** mantis body origin (prothorax / mesothorax joint): a fast head-first plunge that water drag slows, then a slow sink */
export const mantisO = (t: number): V3 => [8 * (1 - Math.exp(-t / 0.5)) + 3 * t, 0, 6 - 59 * (1 - Math.exp(-t / 0.42)) - 9 * t - 5 * Math.max(0, t - 1.5) ** 2 / (1 + 0.4 * Math.max(0, t - 1.5))];

export const mantisState = (t: number): MState => {
  const pitch = 12 + 24 * Math.exp(-t / 0.5) + 3 * Math.sin(1.7 * t + 0.4);
  const yaw = -14 + 4 * Math.sin(0.6 * t + 0.5);
  const roll = 5 * Math.sin(0.9 * t + 1);
  const body = bodyFrame(mantisO(t), yaw, pitch, roll);
  const A = 0.55 + 0.45 * Math.exp(-t / 1.5);
  const ph = 2 * Math.PI * (0.95 * t + 0.9 * (1 - Math.exp(-t / 1.2)));
  const legs = [0, 1, 2, 3].map((i) => {
    const q = ph + i * 1.7;
    if (i < 2) {
      const a2 = 70 + 14 * A * Math.sin(q - 0.8), b2 = -58 + 15 * A * Math.sin(q - 1.2);
      return {a: 88 + 14 * A * Math.sin(q), b: 2 + 10 * A * Math.cos(q), a2, b2, a3: a2 - 8, b3: b2 + 38};
    }
    const r = q + 0.9;
    const a2 = 145 + 12 * A * Math.sin(r - 0.8), b2 = -52 + 14 * A * Math.sin(r - 1.2);
    return {a: 122 + 16 * A * Math.sin(r), b: 12 + 9 * A * Math.cos(r), a2, b2, a3: a2 + 8, b3: b2 + 38};
  });
  const e = emerged(t);
  return {
    body,
    raise: 18 + 4 * Math.sin(1.3 * t),
    headPitch: 2 + 6 * Math.sin(1.1 * t + 1),
    headYaw: -38 + 10 * Math.sin(0.7 * t + 0.3),
    fore: [0, 1].map((j) => ({f: 20 + 9 * A * Math.sin(ph * 0.5 + j), open: 10 + 26 * A * Math.max(0, Math.sin(ph * 0.5 + 0.6 + j * 0.7))})),
    legs,
    antW: t * 2.2,
    tint: ss(t, 0.15, 0.6),
    slack: e / WORM_L,
    part: ss(t, EV.part, EV.emerge + 0.15),
  };
};

export const wormNow = (t: number, st: MState) => {
  const e = emerged(t);
  const E = toW(st.body, EXIT_L), D0 = dirW(st.body, EXIT_D);
  const pts = outsidePts(t, e, E, D0);
  const C = pts.length ? mul3(pts.reduce((a, q) => add3(a, q.p), [0, 0, 0] as V3), 1 / pts.length) : E;
  return {e, E, D0, pts, C};
};

export const FOCAL = 2400;

const smax = (v: number[], k: number) => {
  const m = Math.max(...v);
  return m + k * Math.log(v.reduce((a, x) => a + Math.exp((x - m) / k), 0));
};
/** a soft (smooth) bounding box of the mantis and the outside worm in world x, z */
const softBox = (st: MState, pts: {p: V3}[]) => {
  const Fp = pitchF(st.body, -st.raise);
  const key: V3[] = [toW(Fp, [27, 0, 2]), toW(Fp, [36, -4, 10]), toW(Fp, [22, 0, -12]), toW(st.body, [-52, 0, 2]), toW(st.body, [-10, 0, -17]), toW(st.body, [-30, 0, -15]), toW(st.body, [8, 0, -15])];
  const all = [...key, ...pts.filter((_, i) => i % 3 === 0).map((q) => q.p)];
  const xs = all.map((p) => p[0]), zs = all.map((p) => p[2]);
  const k = 3;
  const x0 = -smax(xs.map((x) => -x), k), x1 = smax(xs, k), z0 = -smax(zs.map((z) => -z), k), z1 = smax(zs, k);
  return {cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, h: z1 - z0};
};

/** the camera: follows the plunge below the surface, pushes in on the abdomen, tracks along the worm, pulls back */
export const camera = (t: number): Cam3 => {
  const st = mantisState(t);
  const M = toW(st.body, [-12, 0, 0]);
  const A = toW(st.body, [-28, 0, 0]);
  const w = wormNow(t, st);
  const M0z = toW(mantisState(0).body, [-12, 0, 0])[2] - 4;
  let T: V3 = [M[0] + 4, 0, M0z + (M[2] - M0z) * (1 - Math.exp(-((t / 0.42) ** 1.6)))];
  T = lerp3(T, [A[0], 0, A[2] - 3], ss5(t, 0.9, 2.1));
  const Wc = add3(lerp3(w.E, w.C, 0.75), [-12, 0, -4]);
  T = lerp3(T, [Wc[0], 0, Wc[2]], ss5(t, 1.8, 3.6));
  let D = keyCR(t, [[0, 184], [1.0, 182], [1.9, 158], [2.6, 155], [3.4, 185], [4.4, 235], [6.0, 270]]);
  // the pull-back frames the mantis and the whole trailing worm (fit to a soft bounding box, below the caption)
  const bx = softBox(st, w.pts);
  const sFit = Math.min(900 / bx.w, 1200 / bx.h);
  const u = ss5(t, 3.5, 5.7);
  const Tfit: V3 = [bx.cx, 0, bx.cz + (1150 - 960) / sFit];
  T = lerp3(T, Tfit, u);
  D = D + (FOCAL / sFit - D) * u;
  T[1] = 0;
  const el = keyCR(t, [[0, 5], [1, 8], [3, 10], [6, 12]]);
  const az = keyCR(t, [[0, -4], [2, 4], [6, 0]]);
  const r = Math.PI / 180;
  const dir: V3 = [Math.sin(az * r) * Math.cos(el * r), -Math.cos(az * r) * Math.cos(el * r), Math.sin(el * r)];
  return {eye: add3(T, mul3(dir, D)), target: T, f: FOCAL};
};

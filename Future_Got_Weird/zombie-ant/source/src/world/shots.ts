// The camera path and the light, as functions of time. One continuous camera: every move follows the subject
// (the jaws, the hanging ant, the stalk, a spore, the walking ant, the climb, the bite, the growing stalk, the spores
// falling, then back out through the vegetation), and the end pushes into the opening composition for the loop.
import {add3, lerp3, mul3, norm3, orbitCam, Orbit, sub3, toOrbit, V3} from '../core/three';
import {toW} from '../core/frame';
import {hw, solve, STALK_BASE, STALK_NAPE} from '../ant/rig';
import {ascoma, stalkAt, stalkLine} from '../fungus/fungus';
import {clamp, DUR, ss, ss5} from '../lib';
import {at, chain} from './camera';
import {A1, ant1State, ant2Walk, heroSpore1, LAND2, SP1, TM} from './story';
import {A2, ant2State, ant3State, daysAt, fungus2, heroSpore2, LAND3, SP2} from './story2';

export const AZ1 = 77.6; // the azimuth of L1's midrib, base -> tip

// ---------------- points the camera follows
const vein1 = (t = 0) => A1(t).vein;
const head1 = (t: number) => solve(ant1State(t)).headC;
const thorax1 = (t: number) => ant1State(t).body.o;
const stalk1 = (t: number, a: number) => stalkAt(stalkLine(solve(ant1State(t)), SP1), a).p;
const asc1 = (t: number) => ascoma(stalkLine(solve(ant1State(t)), SP1), 1, 0).c;
const back1 = (t: number) => { const R = solve(ant1State(t)); return hw(R.st, R.head, STALK_BASE); };
const spore1 = (t: number): V3 => heroSpore1(t)?.p ?? asc1(t);
const land2 = (t: number) => toW(ant2Walk(t).body, LAND2);
const R2 = (t: number) => solve(ant2State(t));
const thorax2 = (t: number) => ant2State(t).body.o;
const head2 = (t: number) => R2(t).headC;
const land2b = (t: number) => toW(ant2State(t).body, LAND2);
const entry2 = (t: number) => toW(ant2State(t).body, [-0.72, -0.42, 0.48]);
const femur2 = (t: number) => { const L = R2(t).legs[5]; return lerp3(L.troch, L.knee, 0.55); };
const vein2 = (t: number) => A2(t).vein;
const neck2 = (t: number) => R2(t).head.o;
const line2 = (t: number) => stalkLine(R2(t), SP2);
const tip2 = (t: number) => stalkAt(line2(t), Math.max(0.05, fungus2(t).g)).p;
const stalk2mid = (t: number) => stalkAt(line2(t), 0.45).p;
const back2 = (t: number) => { const R = R2(t); return hw(R.st, R.head, STALK_NAPE); };
const asc2 = (t: number) => ascoma(line2(t), 1, 0).c;
const spore2 = (t: number): V3 => heroSpore2(t)?.p ?? asc2(t);
const ant3 = (t: number) => ant3State(t).body.o;
const land3 = (t: number) => toW(ant3State(t).body, LAND3);
/** the graveyard, seen whole (the end of the pull-back) */
export const C_W: V3 = [-14, 30, 42];
export const WIDE = (az = -14, el = -6, s = 17): Orbit => at(C_W, az, el, s, 960);
export const WIDE_END = (): Orbit => WIDE(-20, -8, 12.5);

// ---------------- the opening composition, and its copy at the end of the film (the loop)
export const FRAME0 = (): Orbit => at(lerp3(head1(0), vein1(0), 0.62), AZ1 - 180 + 18, -30, 185, 840);
const eyeOf = (o: Orbit) => orbitCam(o).eye;
/** (final pass) ant #4, a copy of the opening's set, is turned to face the wide shot's direction and placed in the
 *  upper part of the final wide frame, in plain view: the loop is one dolly forward and tilt up into its jaws.
 *  LOOP = {rot: turn about the vertical (deg), c0: the opening's target, c4: where that target sits now} */
export const LOOP = (() => {
  const W = WIDE_END();
  const Ew = eyeOf(W);
  const view = norm3(sub3(W.target, Ew));
  const c0 = FRAME0().target;
  const c4 = add3(add3(Ew, mul3(view, 74)), [0, 0, 15]);
  return {rot: W.az - FRAME0().az, c0, c4};
})();
/** opening-set point -> its place in the loop copy */
export const toLoop = (p: V3): V3 => {
  const r = (LOOP.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const d = sub3(p, LOOP.c0);
  return add3(LOOP.c4, [d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2]]);
};
/** a direction in the opening set -> the loop copy */
export const dirLoop = (v: V3): V3 => {
  const r = (LOOP.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
};
const loopOrbit = (): Orbit => ({...FRAME0(), target: LOOP.c4, az: FRAME0().az + LOOP.rot});
/** the final move: the eye travels in a straight line from the wide shot's eye to the opening's (copied) eye while the
 *  aim turns onto the loop ant early, so it never loses or passes through the subject */
const LOOP_T0 = 29.35;
const loopPath = (t: number): Orbit => {
  const W = WIDE_END(), E = loopOrbit();
  const Ew = eyeOf(W), Ee = eyeOf(E);
  const u = ss5(t, LOOP_T0, DUR - 0.035);
  const ua = ss5(t, LOOP_T0, LOOP_T0 + 0.55);
  const eye = lerp3(Ew, Ee, u);
  const target = lerp3(lerp3(W.target, E.target, ua), E.target, u);
  const o = toOrbit({eye, target, f: E.f});
  return {...o, cy: (W.cy ?? 960) + ((E.cy ?? 960) - (W.cy ?? 960)) * u, roll: 0};
};
const shifted = (o: Orbit, d: V3): Orbit => ({...o, target: add3(o.target, d)});

/** keep the lens above the forest floor: lift the elevation if the eye would go below 2.5 mm */
const aboveFloor = (o: Orbit): Orbit => {
  const minEl = (Math.asin(Math.max(-1, Math.min(1, (2.5 - o.target[2]) / o.d))) * 180) / Math.PI;
  return o.el < minEl ? {...o, el: minEl} : o;
};
export const shotCam = (t: number): Orbit => aboveFloor(shotCamRaw(t));
const shotCamRaw = (t: number): Orbit =>
  chain(t, FRAME0, [
    // ---- the hook: from the jaws, back just enough for the head and upper body as the legs let go
    {a: 0.22, b: 0.62, o: (tt) => at(lerp3(head1(tt), thorax1(tt), 0.3), AZ1 - 180 + 34, -16, 118, 860)},
    // round to the back of the head, close, as it swells, splits and the fungus pushes out
    {a: 0.5, b: 1.02, o: (tt) => at(back1(tt), AZ1 - 96, -6, 100, 900)},
    // along the growing stalk
    {a: 0.98, b: 1.58, o: (tt) => at(lerp3(back1(tt), stalk1(tt, 0.62), 0.62), AZ1 - 100, -6, 60, 880)},
    // in to the reproductive cushion as it matures and opens
    {a: 1.52, b: 1.9, o: (tt) => at(asc1(tt), AZ1 - 104, -4, 100, 860)},
    // the spore leaves; the walking ant below comes into the same frame
    {a: 1.86, b: 2.38, o: (tt) => at(lerp3(spore1(tt), land2(tt), 0.45), AZ1 - 108, 4, 60, 920)},
    // down to it as the spore lands: the ant large in frame
    {a: 2.32, b: 2.85, o: (tt) => at(land2(tt), -14, 30, 118, 900)},
    // in on the spore, into the body
    {a: 2.85, b: 3.5, o: (tt) => at(land2(tt), -18, 52, 215, 900)},
    // ---- into the body: deeper, through the translucent shell, into the tissue where the fungus starts growing
    {a: 3.4, b: 4.25, o: (tt) => at(entry2(tt), -20, 58, 430, 960)},
    // out to the whole ant as the growth spreads through its body
    {a: 4.75, b: 5.95, o: (tt) => at(lerp3(thorax2(tt), head2(tt), 0.2), -8, 24, 84, 900)},
    // in on a hind leg: the fungus round its muscle; the muscle jerks and the leg kicks
    {a: 6.15, b: 6.95, o: (tt) => at(femur2(tt), 6, 18, 150, 920)},
    // ---- the forced walk and the climb: close, low and behind, looking up the stem to the leaf it is heading for
    {a: 7.85, b: 8.6, o: (tt) => at(add3(thorax2(tt), [2, 0, 2]), -40, -4, 70, 1020)},
    {a: 8.55, b: 9.4, o: (tt) => at(add3(thorax2(tt), [0, 0, 3]), -55, -14, 76, 1100)},
    // circling round as it reaches the top and turns under the leaf
    {a: 9.4, b: 10.3, o: (tt) => at(add3(thorax2(tt), [0, 0, 2]), -10, -18, 80, 1040)},
    // ---- the death grip, close from below: the jaws open, come up round the vein and clamp shut
    // (final pass) frontal from below: the vein between the jaws, the legs clear to either side
    {a: 10.4, b: 10.86, o: (tt) => at(lerp3(head2(tt), vein2(tt), 0.55), 100, -30, 150, 900)},
    // back out: the leaf flexes, the legs let go, the jaws stay locked as the body hangs
    {a: 11.35, b: 12.7, o: (tt) => at(lerp3(vein2(tt), thorax2(tt), 0.5), 50, -16, 72, 880)},
    // dies: a brief stillness
    {a: 13.2, b: 14.2, o: (tt) => at(lerp3(vein2(tt), thorax2(tt), 0.5), 44, -14, 78, 880)},
    // ---- the fungus starts: round to the back of the head as it swells, splits and the stalk pushes out
    {a: 14.1, b: 15.7, o: (tt) => at(back2(tt), -40, -12, 175, 900)},
    // (final pass) one macro tracking move: from the nape as the stalk breaks out, following the growing tip and
    // widening as it lengthens, so every second shows visible growth
    {a: 15.9, b: 17.2, o: (tt) => at(lerp3(back2(tt), tip2(tt), 0.55), -30, -22, 175 - 120 * fungus2(tt).g, 880)},
    // when it opens: close on the reproductive cushion
    {a: 21.25, b: 22.3, o: (tt) => at(asc2(tt), -10, -6, 140, 860)},
    // the spores: a small group followed down to the ants below; one lands
    {a: 22.75, b: 23.5, o: (tt) => at(spore2(tt), -8, 0, 92, 860)},
    {a: 23.45, b: 24.3, o: (tt) => at(lerp3(spore2(tt), ant3(tt), 0.5), -6, 10, 46, 900)},
    {a: 24.2, b: 25.0, o: (tt) => at(land3(tt), 0, 24, 82, 920)},
    // ---- beneath that one leaf: rise back to the dead ant on it, close
    {a: 25.15, b: 26.3, o: (tt) => at(lerp3(thorax2(tt), stalk2mid(tt), 0.4), -10, -6, 52, 960)},
    // pull back a little: two or three more dead ants on the leaves around it
    {a: 26.55, b: 27.75, o: () => WIDE()},
    // and further, low among the plants, looking up: a whole cluster of them on the surrounding leaves
    {a: 27.6, b: LOOP_T0, o: () => WIDE_END()},
    // ---- push in, up into a nearby leaf, to the opening composition (the loop)
    {a: LOOP_T0, b: LOOP_T0 + 1e-3, o: (tt) => loopPath(tt)},
  ]);

/** daylight: 1 = full; the two time-lapses pass through day and night; dimmer and cooler for the reveal */
export const lightAt = (t: number) => {
  let l = 1;
  if (t > 0.86 && t < 1.95) {
    const u = (t - 0.86) / (1.95 - 0.86);
    l -= 0.42 * Math.sin(Math.PI * u * 2) ** 2;
  }
  l *= daysAt(t);
  l *= 1 - 0.12 * ss(t, TM.dies, TM.dies + 0.6) * (1 - ss(t, TM.but, TM.but + 0.8));
  l *= 1 - 0.14 * ss(t, TM.beneath, TM.there + 0.6) * (1 - ss(t, 29.6, DUR - 0.1));
  return l;
};
/** blur of the far forest: strong in macro, less in wide shots */
export const blurAt = (t: number, O: Orbit) => clamp(2 + (O.f / O.d) * 0.06, 0, 12);

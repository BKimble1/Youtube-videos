// The camera path and the light, as functions of time. One continuous camera: every move follows the subject
// (the jaws, the hanging ant, the stalk, a spore, the walking ant, the climb, the bite, the growing stalk, the spores
// falling, then back out through the vegetation), and the end pushes into the opening composition for the loop.
import {add3, lerp3, mul3, norm3, orbitCam, Orbit, sub3, V3} from '../core/three';
import {toW} from '../core/frame';
import {hw, solve, STALK_BASE} from '../ant/rig';
import {ascoma, stalkAt, stalkLine} from '../fungus/fungus';
import {clamp, DUR, ss} from '../lib';
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
const back2 = (t: number) => { const R = R2(t); return hw(R.st, R.head, STALK_BASE); };
const asc2 = (t: number) => ascoma(line2(t), 1, 0).c;
const spore2 = (t: number): V3 => heroSpore2(t)?.p ?? asc2(t);
const ant3 = (t: number) => ant3State(t).body.o;
const land3 = (t: number) => toW(ant3State(t).body, LAND3);
/** the graveyard, seen whole (the end of the pull-back) */
export const C_W: V3 = [-14, 30, 42];
export const WIDE = (az = -14, el = -6, s = 17): Orbit => at(C_W, az, el, s, 960);
export const WIDE_END = (): Orbit => WIDE(-20, -8, 12.5);

// ---------------- the opening composition, and its copy at the end of the film (the loop)
export const FRAME0 = (): Orbit => at(lerp3(head1(0), vein1(0), 0.6), AZ1 - 180 + 6, -36, 230, 880);
const eyeOf = (o: Orbit) => orbitCam(o).eye;
/** where ant #4 (a copy of the opening's set) sits: just ahead of the camera's widest point, on its way in */
export const D4: V3 = (() => {
  const W = WIDE_END();
  const Ew = eyeOf(W);
  const view = norm3(sub3(W.target, Ew));
  // ahead of the lens and up, just above the top of the wide frame: the final move rises into it
  const E4 = add3(add3(Ew, mul3(view, 46)), [0, 0, 34]);
  return sub3(E4, eyeOf(FRAME0()));
})();
const shifted = (o: Orbit, d: V3): Orbit => ({...o, target: add3(o.target, d)});

/** keep the lens above the forest floor: lift the elevation if the eye would go below 2.5 mm */
const aboveFloor = (o: Orbit): Orbit => {
  const minEl = (Math.asin(Math.max(-1, Math.min(1, (2.5 - o.target[2]) / o.d))) * 180) / Math.PI;
  return o.el < minEl ? {...o, el: minEl} : o;
};
export const shotCam = (t: number): Orbit => aboveFloor(shotCamRaw(t));
const shotCamRaw = (t: number): Orbit =>
  chain(t, FRAME0, [
    // ---- the hook: the jaws snap shut on the vein; held close while the body tugs (the head stays anchored)
    {a: 0.36, b: 0.72, o: (tt) => at(lerp3(head1(tt), vein1(tt), 0.45), AZ1 - 180 + 14, -32, 168, 900)},
    // pull back to the whole ant hanging from its jaws, still
    {a: 0.7, b: 1.1, o: (tt) => at(lerp3(vein1(tt), thorax1(tt), 0.55), AZ1 - 180 + 40, -18, 70, 880)},
    // round to the back of the head: the time-lapse glimpse of the fungus breaking out
    {a: 1.02, b: 1.45, o: (tt) => at(back1(tt), AZ1 - 96, -10, 108, 900)},
    // along the growing stalk to the cushion as it matures and opens
    {a: 1.4, b: 1.9, o: (tt) => at(lerp3(back1(tt), stalk1(tt, 0.62), 0.62), AZ1 - 100, -8, 62, 880)},
    {a: 1.82, b: 2.1, o: (tt) => at(asc1(tt), AZ1 - 104, -4, 100, 860)},
    // the spore leaves; the walking ant below comes into the same frame
    {a: 2.06, b: 2.5, o: (tt) => at(lerp3(spore1(tt), land2(tt), 0.45), AZ1 - 108, 4, 60, 920)},
    // down to it as the spore lands: the ant large in frame
    {a: 2.45, b: 2.95, o: (tt) => at(land2(tt), -14, 30, 118, 900)},
    // in on the spore, into the body
    {a: 2.95, b: 3.5, o: (tt) => at(land2(tt), -18, 52, 215, 900)},
    // ---- into the body: deeper, through the translucent shell, into the tissue where the fungus starts growing
    {a: 3.4, b: 4.25, o: (tt) => at(entry2(tt), -20, 58, 430, 960)},
    // out to the whole ant as the growth spreads through its body
    {a: 4.75, b: 5.95, o: (tt) => at(lerp3(thorax2(tt), head2(tt), 0.2), -8, 24, 84, 900)},
    // in on a hind leg: the fungus round its muscle; the muscle jerks and the leg kicks
    {a: 6.15, b: 6.95, o: (tt) => at(femur2(tt), 6, 18, 150, 920)},
    // ---- the forced walk and the climb: close, low and behind, looking up the stem to the leaf it is heading for
    {a: 7.85, b: 8.6, o: (tt) => at(add3(thorax2(tt), [2, 0, 2]), -40, -4, 70, 1020)},
    {a: 8.55, b: 9.4, o: (tt) => at(add3(thorax2(tt), [0, 0, 3]), -74, -12, 76, 1100)},
    // circling round as it reaches the top and turns under the leaf
    {a: 9.4, b: 10.3, o: (tt) => at(add3(thorax2(tt), [0, 0, 2]), -30, -20, 80, 1040)},
    // ---- the death grip, close from below: the jaws open, close round the vein and lock
    {a: 9.55, b: 10.85, o: (tt) => at(lerp3(head2(tt), vein2(tt), 0.55), 70, -48, 180, 900)},
    // one continuous move out and round: the legs let go, the body drops to hang, the ant goes still
    {a: 11.3, b: 13.7, o: (tt) => at(lerp3(vein2(tt), thorax2(tt), 0.45), 20, -22, 84, 880)},
    // ---- the fungus starts: round to the back of the head as it swells, splits and the stalk pushes out
    {a: 13.6, b: 16.3, o: (tt) => at(back2(tt), -50, -8, 150, 900)},
    // the time-lapse: from below, following the growing tip, opening out to the whole stalk
    {a: 16.9, b: 19.2, o: (tt) => at(lerp3(back2(tt), tip2(tt), 0.55), -34, -30, 110 - 50 * fungus2(tt).g, 880)},
    {a: 19.0, b: 20.9, o: (tt) => at(lerp3(back2(tt), tip2(tt), 0.55), -18, -26, 110 - 52 * fungus2(tt).g, 880)},
    // when it opens: close on the reproductive cushion
    {a: 21.25, b: 22.3, o: (tt) => at(asc2(tt), -10, -6, 140, 860)},
    // the spores: a small group followed down to the ants below; one lands
    {a: 22.75, b: 23.5, o: (tt) => at(spore2(tt), -8, 0, 92, 860)},
    {a: 23.45, b: 24.3, o: (tt) => at(lerp3(spore2(tt), ant3(tt), 0.5), -6, 10, 46, 900)},
    {a: 24.2, b: 25.0, o: (tt) => at(land3(tt), 0, 24, 82, 920)},
    // ---- beneath that one leaf: rise back to the dead ant on it, close
    {a: 25.15, b: 26.3, o: (tt) => at(lerp3(thorax2(tt), stalk2mid(tt), 0.4), -10, -6, 52, 960)},
    // a little back and round: the dead ant on the next leaf, side by side with it
    {a: 26.35, b: 27.2, o: (tt) => at(lerp3(thorax2(tt), [-27, 2, 25], 0.5), -16, -4, 30, 980)},
    // then one steady pull back, low among the plants: a small group on the nearby leaves, then the whole cluster
    {a: 27.2, b: 29.6, o: () => WIDE_END()},
    // ---- push in, up into a nearby leaf, to the opening composition (the loop)
    {a: 29.62, b: DUR - 0.045, o: () => shifted(FRAME0(), D4)},
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

// The camera path and the light, as functions of time. One continuous camera: every move follows the subject
// (the jaws, the hanging ant, the stalk, a spore, the walking ant, the climb, the bite, the growing stalk, the spores
// falling, then back out through the vegetation), and the end pushes into the opening composition for the loop.
import {add3, lerp3, mul3, norm3, orbitCam, Orbit, sub3, V3} from '../core/three';
import {toW} from '../core/frame';
import {solve} from '../ant/rig';
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
const spore1 = (t: number): V3 => heroSpore1(t)?.p ?? asc1(t);
const land2 = (t: number) => toW(ant2Walk(t).body, LAND2);
const R2 = (t: number) => solve(ant2State(t));
const thorax2 = (t: number) => ant2State(t).body.o;
const head2 = (t: number) => R2(t).headC;
const land2b = (t: number) => toW(ant2State(t).body, LAND2);
const vein2 = (t: number) => A2(t).vein;
const neck2 = (t: number) => R2(t).head.o;
const line2 = (t: number) => stalkLine(R2(t), SP2);
const tip2 = (t: number) => stalkAt(line2(t), Math.max(0.05, fungus2(t).g)).p;
const stalk2mid = (t: number) => stalkAt(line2(t), 0.45).p;
const asc2 = (t: number) => ascoma(line2(t), 1, 0).c;
const spore2 = (t: number): V3 => heroSpore2(t)?.p ?? asc2(t);
const ant3 = (t: number) => ant3State(t).body.o;
const land3 = (t: number) => toW(ant3State(t).body, LAND3);
/** the graveyard, seen whole (the end of the pull-back) */
export const C_W: V3 = [-16, 14, 40];
export const WIDE = (az = -82, el = -3, s = 11): Orbit => at(C_W, az, el, s, 960);
export const WIDE_END = (): Orbit => WIDE(-84, -2, 10.4);

// ---------------- the opening composition, and its copy at the end of the film (the loop)
export const FRAME0 = (): Orbit => at(lerp3(head1(0), vein1(0), 0.3), AZ1 - 180 + 10, -10, 132, 860);
const eyeOf = (o: Orbit) => orbitCam(o).eye;
/** where ant #4 (a copy of the opening's set) sits: just ahead of the camera's widest point, on its way in */
export const D4: V3 = (() => {
  const W = WIDE_END();
  const Ew = eyeOf(W);
  const view = norm3(sub3(W.target, Ew));
  // ahead of the lens and up, just above the top of the wide frame: the final move rises into it
  const E4 = add3(add3(Ew, mul3(view, 44)), [0, 0, 26]);
  return sub3(E4, eyeOf(FRAME0()));
})();
const shifted = (o: Orbit, d: V3): Orbit => ({...o, target: add3(o.target, d)});

export const shotCam = (t: number): Orbit =>
  chain(t, FRAME0, [
    // ---- the hook: pull back from the jaws to the hanging ant
    {a: 0.44, b: 0.92, o: (tt) => at(lerp3(vein1(tt), thorax1(tt), 0.7), AZ1 - 180 + 34, -16, 58, 860)},
    // time-lapse: round to the side so the stalk grows across the frame
    {a: 0.84, b: 1.5, o: (tt) => at(lerp3(head1(tt), stalk1(tt, 0.55), 0.55), AZ1 - 92, -8, 52, 880)},
    // in to the fertile cushion as it matures, onto the spore as it leaves
    {a: 1.42, b: 1.98, o: (tt) => at(asc1(tt), AZ1 - 96, -4, 82, 820)},
    {a: 1.98, b: 2.32, o: (tt) => at(spore1(tt), AZ1 - 98, -2, 74, 880)},
    // follow it down, opening out until the walking ant below is in frame, then in to where it lands
    {a: 2.22, b: 2.62, o: (tt) => at(lerp3(spore1(tt), land2(tt), 0.35), AZ1 - 100, 6, 17, 900)},
    {a: 2.7, b: 3.36, o: (tt) => at(lerp3(spore1(tt), land2(tt), clamp((tt - 2.7) / 0.6)), -12, 30, 80, 900)},
    {a: 3.35, b: 4.15, o: (tt) => at(land2(tt), -14, 38, 135, 900)},
    // ---- into the body: close on the entry point as the germ tube pierces the cuticle
    {a: 4.1, b: 4.6, o: (tt) => at(land2b(tt), -16, 40, 185, 900)},
    // out to the whole ant, translucent, as the network spreads; a slow push while it takes the muscles
    {a: 4.65, b: 5.75, o: (tt) => at(lerp3(thorax2(tt), head2(tt), 0.22), -6, 24, 70, 900)},
    {a: 5.75, b: 6.6, o: (tt) => at(lerp3(thorax2(tt), head2(tt), 0.38), -4, 22, 92, 900)},
    {a: 6.5, b: 7.75, o: (tt) => at(lerp3(thorax2(tt), head2(tt), 0.5), -2, 18, 108, 900)},
    // ---- the forced walk and the climb: a side view that tracks it up the stem
    {a: 7.85, b: 8.75, o: (tt) => at(add3(thorax2(tt), [5, 0, 5]), 0, 6, 40, 1020)},
    {a: 8.6, b: 9.3, o: (tt) => at(add3(thorax2(tt), [1, 0, 4]), 0, 4, 40, 1020)},
    // as it reaches the leaf, in to its head from below the leaf
    {a: 10.0, b: 10.8, o: (tt) => at(lerp3(head2(tt), vein2(tt), 0.35), 46, -22, 100, 900)},
    // ---- the death grip: pull back to see the legs let go and the body swing down
    {a: 11.4, b: 12.7, o: (tt) => at(lerp3(vein2(tt), thorax2(tt), 0.6), 44, -12, 54, 860)},
    // dies: hold, a slow push
    {a: 13.2, b: 14.8, o: (tt) => at(lerp3(vein2(tt), thorax2(tt), 0.55), 36, -12, 60, 860)},
    // the fungus starts: round to the side, close on the neck as the mycelium breaks out
    {a: 14.85, b: 16.3, o: (tt) => at(lerp3(neck2(tt), thorax2(tt), 0.3), 2, -4, 100, 900)},
    // the time-lapse: follow the tip of the stalk as it grows, opening out to the whole stalk
    {a: 16.9, b: 20.9, o: (tt) => at(lerp3(neck2(tt), tip2(tt), 0.55), 6, -2, 100 - 58 * fungus2(tt).g, 880)},
    // when it opens: along to the cushion
    {a: 21.25, b: 22.3, o: (tt) => at(asc2(tt), 12, -2, 112, 860)},
    // the spores: follow them down to the ants below; one lands
    {a: 22.75, b: 23.55, o: (tt) => at(spore2(tt), 10, 2, 62, 860)},
    {a: 23.45, b: 24.3, o: (tt) => at(lerp3(spore2(tt), ant3(tt), 0.45), 6, 14, 24, 900)},
    {a: 24.2, b: 25.0, o: (tt) => at(land3(tt), 0, 24, 66, 920)},
    // ---- beneath that one leaf: rise back to the dead ant on it
    {a: 25.15, b: 26.35, o: (tt) => at(lerp3(thorax2(tt), stalk2mid(tt), 0.4), -6, 4, 40, 960)},
    // pull back through the vegetation: the other dead ants come into view, one after another
    {a: 26.5, b: 28.85, o: () => WIDE()},
    {a: 28.7, b: 29.75, o: () => WIDE_END()},
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

// The loop: ant #4, alive and infected, coming up to a vein exactly as ant #1 does in the first frame. Its leaf,
// stem and pose are ant #1's, turned and moved by toLoop (shots.ts) so it sits in plain view in the final wide shot,
// running on a clock that reaches the opening's frame 0 one frame after the last frame of the film.
import {add3, V3} from '../core/three';
import {Frame} from '../core/frame';
import {AntState} from '../ant/rig';
import {DUR} from '../lib';
import {Leaf} from './plant';
import {ant1State, leaf1, P1_STEM} from './story';
import {dirLoop, toLoop} from './shots';

const mvF = (F: Frame): Frame => ({o: toLoop(F.o), f: dirLoop(F.f), l: dirLoop(F.l), u: dirLoop(F.u)});
export const ant4State = (t: number): AntState => {
  const s = ant1State(t - DUR);
  return {...s, body: mvF(s.body), legs: s.legs.map((L) => ({...L, ankle: toLoop(L.ankle), foot: toLoop(L.foot), pole: L.pole ? dirLoop(L.pole) : undefined}))};
};
export const leaf4 = (t: number): Leaf => {
  const l = leaf1(t - DUR);
  return {...l, id: 'L4', base: toLoop(l.base), dir: dirLoop(l.dir), up: dirLoop(l.up)};
};
/** its leaf hangs from a twig that comes down from above */
const B4 = toLoop(P1_STEM[P1_STEM.length - 1]);
export const P4_STEM: V3[] = [add3(B4, [-6, 5, 120]), add3(B4, [-3, 3, 50]), add3(B4, [-1, 1, 14]), B4];

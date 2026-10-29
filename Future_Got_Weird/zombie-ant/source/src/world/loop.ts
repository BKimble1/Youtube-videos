// The loop: ant #4, alive and infected, coming up to a vein exactly as ant #1 does in the first frame. Its leaf,
// stem and pose are ant #1's, moved by D4 (shots.ts) and running on a clock that reaches the opening's frame 0
// one frame after the last frame of the film.
import {add3, V3} from '../core/three';
import {AntState} from '../ant/rig';
import {DUR} from '../lib';
import {Leaf} from './plant';
import {ant1State, leaf1, P1_STEM} from './story';
import {D4} from './shots';

const mv = (p: V3): V3 => add3(p, D4);
export const ant4State = (t: number): AntState => {
  const s = ant1State(t - DUR);
  return {...s, body: {...s.body, o: mv(s.body.o)}, legs: s.legs.map((L) => ({...L, ankle: mv(L.ankle), foot: mv(L.foot)}))};
};
export const leaf4 = (t: number): Leaf => {
  const l = leaf1(t - DUR);
  return {...l, id: 'L4', base: mv(l.base)};
};
/** its leaf hangs from a twig that comes down from above (no stem from the floor in front of the wide view) */
const B4 = mv(P1_STEM[P1_STEM.length - 1]);
export const P4_STEM: V3[] = [add3(B4, [-6, 5, 120]), add3(B4, [-3, 3, 50]), add3(B4, [-1, 1, 14]), B4];

// What the bench station draws for a camera: scenery, shadows, the robot and the module, contact cues.
import {Item, Proj} from '../lib/r3';
import {v3} from '../lib/v3';
import {benchArt, lightPool} from './benchArt';
import {BenchState} from './bench';
import {contactCue, linkItems, shadowItems} from '../rig/truss';

export const benchItems = (P: Proj, s: BenchState): (Item | null)[] => [
  ...benchArt(P),
  lightPool(P, v3(0.0, 0.001, -0.05), 0.9, 0.22),
  ...shadowItems(P, s.links),
  ...s.links.flatMap((l) => linkItems(P, l)),
  contactCue(P, s.tet.V1, s.cueJoin),
  contactCue(P, s.X.b, s.cueTip),
];

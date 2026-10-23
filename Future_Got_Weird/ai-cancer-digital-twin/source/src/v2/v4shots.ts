// V4 shot list: sequences A–C as approved in V3 (0:00–1:37.7), sequences D–G rebuilt for V4. The V4 shots are sorted by
// start time so an incoming shot always draws over the one it dissolves from.
import {Shot} from './director';
import {shotsA} from './seq/A';
import {shotsB} from './seq/B';
import {shotsC} from './seq/C';
import {shotsD4} from './seq/D4';
import {shotsE4} from './seq/E4';
import {shotsF4} from './seq/F4';
import {shotsG4} from './seq/G4';

const rebuilt: Shot[] = [...shotsD4, ...shotsE4, ...shotsF4, ...shotsG4];
export const SHOTS_V4: Shot[] = [...shotsA, ...shotsB, ...shotsC, ...rebuilt.map((s, i) => ({s, i})).sort((a, b) => a.s.t0 - b.s.t0 || a.i - b.i).map((x) => x.s)];

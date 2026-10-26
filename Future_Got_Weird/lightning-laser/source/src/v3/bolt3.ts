// The V3 bolt, shared by every V3 view of the discharge and of its light.
import {BOLT3} from '../v2/p3';

/** V3's bolt: BOLT3 (shared with V2, unchanged) with its depth wander past the guided section reduced to 30%, so in
 *  the opening and demonstration views the upper path never crosses itself (the guided section lies in the beam plane
 *  and is identical); branches move with their roots, and the one branch that still crosses the main path in those
 *  views (b2) is dropped */
const ZK3 = 0.3;
export const BOLT3V = (() => {
  const gs = BOLT3.guidedS;
  const pts = BOLT3.pts.map((p) => (p.s > gs ? {...p, z: p.z * ZK3} : p));
  const branches = BOLT3.branches
    .map((b) => {
      const base = BOLT3.pts.find((q) => q.s >= b.s0) ?? BOLT3.pts[BOLT3.pts.length - 1];
      const dz = base.s > gs ? base.z * (1 - ZK3) : 0;
      return {...b, pts: b.pts.map((q) => ({...q, z: q.z - dz}))};
    })
    .filter((_, i) => i !== 2);
  return {...BOLT3, pts, branches};
})();

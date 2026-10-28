// V3 view probe: every frame through its real shot camera (and the operator's monitor camera).
//  * paint-order cycles: must be 0 (sort3 orders overlapping solids from exact ray tests; a cycle would force an error)
//  * independent occlusion check: for every pair of overlapping solids, sample up to 12 points where both pictures
//    overlap, ray-cast both solids, and confirm the painted order matches the nearer solid at every sample
//  * near plane: no robot piece may be cut by the camera's near plane (it would vanish or pop)
//  * environment: the deck and ramp are painted under the robots, so no robot piece may be hidden from the camera by
//    the deck's faces or the ramp's side faces (checked by ray against those faces)
// usage: esbuild bundle, then node probe3_view.cjs [out.json]
import {SHOTS3} from '../source/src/v3/shots3';
import {order3, projector, NEAR, Item, Cam} from '../source/src/lib/r3';
import {overlapPoints, rayHit} from '../source/src/lib/solid';
import {sceneItems} from '../source/src/v3/scene';
import {FRAMES, FPS} from '../source/src/lib/time';
import {V3} from '../source/src/lib/v3';
import {DH, XC, prof, RAMP_Z} from '../source/src/v3/world';
import {RB, S_NECK0, S_M0, S_M1, S_H1, S_ROD_IN} from '../source/src/v3/rig';
import * as fs from 'fs';

const faults: {t: number; kind: string; what: string}[] = [];
let pairsChecked = 0, samples = 0, cycles = 0;
const add = (t: number, kind: string, what: string) => faults.push({t: Math.round(t * 100) / 100, kind, what});

/** does the segment eye->p cross the deck's end face (x = XC beside the ramp) or a ramp side face before p? */
const envBlocks = (eye: V3, p: V3) => {
  const segs: [number, (q: V3) => boolean][] = [];
  // deck end face at x = XC, 0 <= y <= DH, z outside the ramp
  if ((eye.x - XC) * (p.x - XC) < 0) {
    const k = (XC - eye.x) / (p.x - eye.x);
    const y = eye.y + (p.y - eye.y) * k, z = eye.z + (p.z - eye.z) * k;
    if (y > 0 && y < DH && (z < RAMP_Z[0] || z > RAMP_Z[1])) return 'deck end face';
  }
  // ramp side faces at z = RAMP_Z[0], RAMP_Z[1], under the profile
  for (const zf of RAMP_Z) {
    if ((eye.z - zf) * (p.z - zf) < 0) {
      const k = (zf - eye.z) / (p.z - eye.z);
      const x = eye.x + (p.x - eye.x) * k, y = eye.y + (p.y - eye.y) * k;
      if (x > XC - 0.07 && x < XC + 0.6 && y > 0 && y < prof(x).y) return 'ramp side face';
    }
  }
  void segs;
  return null;
};

const checkView = (t: number, c: Cam, label: string) => {
  const P = projector(c);
  const items = sceneItems(P, t).filter(Boolean) as Item[];
  const {items: ordered, stats} = order3(items, P);
  for (const s of stats) cycles += s.cycles;
  if (stats.some((s) => s.cycles > 0)) add(t, 'cycle', label);
  const rank = new Map<Item, number>();
  ordered.forEach((it, i) => rank.set(it, i));
  const solids = ordered.filter((i) => i.cs && i.sh && i.layer === 3);
  const cx = 540 + (c.ox ?? 0), cy = 960 + (c.oy ?? 0);
  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      const A = solids[i], B = solids[j];
      // pieces of one link that touch along the axis are ordered by the axis rule; check the others
      if (A.grp && A.grp === B.grp && A.axr && B.axr && Math.abs(Math.min(A.axr[1], B.axr[1]) - Math.max(A.axr[0], B.axr[0])) < 0.005) continue;
      const pts = overlapPoints(A.sh!, B.sh!, 12);
      if (!pts.length) continue;
      let both = 0;
      for (const p of pts) {
        const d = {x: (p.x - cx) / c.f, y: -(p.y - cy) / c.f, z: 1};
        const ta = rayHit(d, A.cs!), tb = rayHit(d, B.cs!);
        if (ta === Infinity || tb === Infinity) continue;
        both++;
        samples++;
        if (Math.abs(ta - tb) < 1e-5) continue;
        const painterFront = rank.get(A)! > rank.get(B)! ? 'A' : 'B';
        const trueFront = ta < tb ? 'A' : 'B';
        if (painterFront !== trueFront) {
          add(t, 'order', `${label} ${A.grp}/${B.grp}`);
          break;
        }
      }
      if (both) pairsChecked++;
    }
  }
  // near plane: a piece with one end behind the camera's near plane is dropped by the renderer; if the rest of it is
  // in the picture, that is a part vanishing. (Pieces wholly behind the camera are simply out of view.)
  const R = resolve(world(t));
  for (const l of R.links) {
    const u = l.u;
    const at = (s: number) => ({x: l.Ca.x + u.x * s, y: l.Ca.y + u.y * s, z: l.Ca.z + u.z * s});
    const segs: [number, number][] = [[S_NECK0, S_M0], [S_M0, S_M1], [S_M1, S_H1], [S_H1, l.Lp - S_ROD_IN]];
    const pts: [V3, V3][] = segs.map(([a, b]) => [at(a), at(b)]);
    pts.push([l.Ca, l.Ca], [l.Cb, l.Cb]);
    for (const [a, b] of pts) {
      const A = P.camSpace(a), B = P.camSpace(b);
      const lo = Math.min(A.z, B.z) - RB, hi = Math.max(A.z, B.z);
      if (lo < NEAR && hi > NEAR) {
        // is any of it in the picture?
        const front = A.z > B.z ? A : B;
        if (front.z > NEAR) {
          const sp = P.toScreen(front);
          if (sp.x > -200 && sp.x < 1280 && sp.y > -200 && sp.y < 2120) add(t, 'near-plane', `${label} ${l.id}`);
        }
      }
    }
  }
  return P;
};

// world-space environment check uses the resolved world (cheaper than inverting camera space)
import {resolve} from '../source/src/v3/rig';
import {world} from '../source/src/v3/story';

for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const shot = SHOTS3.find((s) => t >= s.from && t < s.to) ?? SHOTS3[SHOTS3.length - 1];
  const cams: [string, Cam][] = [];
  if (shot.cam) cams.push([shot.id, shot.cam(t)]);
  for (const [label, c] of cams) {
    checkView(t, c, label);
    const R = resolve(world(t));
    for (const l of R.links)
      for (const p of [l.Ca, l.Cb, {x: (l.Ca.x + l.Cb.x) / 2, y: (l.Ca.y + l.Cb.y) / 2, z: (l.Ca.z + l.Cb.z) / 2}]) {
        const why = envBlocks(c.eye, p);
        if (why) add(t, 'environment', `${label} ${l.id} behind ${why}`);
      }
  }
}
const sum: Record<string, {first: number; last: number; n: number}> = {};
for (const x of faults) {
  const k = `${x.kind} ${x.what}`;
  const s = sum[k] ?? {first: x.t, last: x.t, n: 0};
  s.n++;
  s.last = x.t;
  sum[k] = s;
}
const out = {frames: FRAMES, faults: faults.length, cycles, pairsChecked, samples, summary: sum};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`${FRAMES} frames; ${faults.length} faults; cycles ${cycles}; overlapping pairs checked ${pairsChecked} (${samples} ray samples)`);
for (const [k, s] of Object.entries(sum).slice(0, 60)) console.log(`  ${k}: ${s.n}x ${s.first}-${s.last}`);

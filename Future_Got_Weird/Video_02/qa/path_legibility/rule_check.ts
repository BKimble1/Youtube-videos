/**
 * Path-legibility numbers for qa/PATH_LEGIBILITY_PLAN.md, computed with the kit itself (run AFTER phase 2: needs
 * hiddenByPartition / partitionCrossings / assertAroundTheEnd / rigScale in source/src/lib/room.ts and the synced
 * layout: partition 2.0 m, light plane 0.95 m).
 *
 *   cd source && ./node_modules/.bin/esbuild ../qa/path_legibility/rule_check.ts --bundle --platform=node --format=cjs \
 *     --external:remotion --external:react --outfile=/tmp/rule_check.cjs && NODE_PATH=node_modules node /tmp/rule_check.cjs
 */
import {LAYOUT, PTS, assertAroundTheEnd, hiddenByPartition, partitionCrossings, projectWith, rigAt, viewAt, type PlanPt} from '../../source/src/lib/room';
import {assertPath} from '../../source/src/lib/optics';

const S = PTS.S;
const H = PTS.H;
const W = PTS.W;
const d3 = (a: PlanPt, b: PlanPt) => Math.hypot(a.x - b.x, a.z - b.z, (a.h ?? 0) - (b.h ?? 0));
const rigCovers = (pl: {x: number; y: number; scale: number}, q: {x: number; y: number}, grow = 0) => {
  const lx = (q.x - pl.x) / pl.scale;
  const ly = (q.y - pl.y) / pl.scale;
  const gr = grow / pl.scale;
  if ((lx / (92 + gr)) ** 2 + ((ly + 388) / (100 + gr)) ** 2 < 1) return true;
  if (Math.abs(lx) < 82 + gr && ly > -300 - gr && ly < -140) return true;
  return Math.abs(lx) < 60 + gr && ly >= -140 && ly < 0;
};

console.log(`layout: partition ${LAYOUT.occluder.height} m, sensor h ${LAYOUT.sensor.h} m, hider h ${LAYOUT.hidden.h} m`);

// 1. wall -> him legs at several tilts (screen px at zoom 1.25)
for (const tilt of [0, 0.05, 0.1, 0.12, 0.15]) {
  const s = viewAt(tilt);
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const rows = ['W1', 'W2', 'W3', 'W4'].map((id) => {
    const w = W[id];
    const r = partitionCrossings(w, H, s, {zoom: 1.25});
    const spot = hiddenByPartition(w, s) ? 'spot behind partition' : rigCovers(op, projectWith(s, w)) ? 'spot behind her head' : 'spot visible';
    let ok = 'rule ok';
    try {
      assertAroundTheEnd(id, [[S, w, H, w, S]], s, {zoom: 1.25});
    } catch {
      ok = 'RULE FAILS';
    }
    return `${id}: ${r.crossings.map((c) => `${c.dir} ${c.edge} ${c.belowCornerPx.toFixed(0)}px`).join(', ') || 'no crossing'}; ${spot}; ${ok}`;
  });
  const s0 = viewAt(tilt);
  console.log(`tilt ${tilt}: rig scale ${rigAt(2.6, 0.85, tilt).scale.toFixed(3)}, slot ${((-0.02 + s0.shear * 0.65) * s0.ppm * 1.25).toFixed(0)} px wide, gap floor ${(0.65 * s0.floor * s0.ppm * 1.25).toFixed(0)} px deep\n  ${rows.join('\n  ')}`);
}

// 2. S2.2 mirror at RAISED_TILT 0.10: his camera-view mirror image (H reflected through z = 0) in a 1.95..2.75 x 0.9..2.3 m glass
{
  const tilt = 0.1;
  const s = viewAt(tilt);
  const MIR = {x0: 1.95, x1: 2.75, h0: 0.9, h1: 2.3};
  const g0 = projectWith(s, {x: MIR.x0, z: 0, h: MIR.h1});
  const g1 = projectWith(s, {x: MIR.x1, z: 0, h: MIR.h0});
  const mpp = 1.7 / 440;
  const zones: Record<string, [number, number, number, number]> = {face: [-80, 80, -470, -300], chest: [-80, 80, -300, -200], belly: [-80, 80, -200, -140]};
  const vis = Object.entries(zones).map(([name, [x0, x1, y0, y1]]) => {
    let n = 0;
    let v = 0;
    for (let lx = x0; lx <= x1; lx += 8) for (let ly = y0; ly <= y1; ly += 8) {
      n++;
      const p = {x: H.x - lx * mpp, z: -H.z, h: -ly * mpp};
      const q = projectWith(s, p);
      if (q.x >= g0.x && q.x <= g1.x && q.y >= g0.y && q.y <= g1.y && !hiddenByPartition(p, s)) v++;
    }
    return `${name} ${Math.round((100 * v) / n)}%`;
  });
  const spec: PlanPt = {x: 2.139, z: 0, h: LAYOUT.sensor.h};
  console.log(`S2.2 @0.10: mirror image visible: ${vis.join(', ')}; specular point hidden by the far edge: ${hiddenByPartition(spec, s)}`);
}

// 3. S2.4 blend: wall spots (visible, clear of both people) whose paths obey the rule and agree within one bin
for (const tilt of [0, 0.1]) {
  const s = viewAt(tilt);
  const gu = rigAt(H.x, H.z, tilt);
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const k = 1.7 / 440; // metres per rig px (rigs on the set's height scale)
  const parts = [
    {id: 'head', A: {x: H.x, z: H.z, h: 1.45}},
    {id: 'shoulder', A: {x: H.x - 66 * k, z: H.z, h: 1.13}},
    {id: 'feet', A: {x: H.x - 33 * k, z: H.z, h: 0.04}},
  ];
  const cands: Record<string, {W: PlanPt; L: number}[]> = {};
  for (const p of parts) {
    cands[p.id] = [];
    for (let x = 1.3; x <= 3.7; x += 0.025) for (let h = 0.2; h <= 2.45; h += 0.025) {
      const Wp = {x, z: 0, h};
      const q = projectWith(s, Wp);
      if (hiddenByPartition(Wp, s, {padPx: 12}) || rigCovers(gu, q, 12) || rigCovers(op, q, 12)) continue;
      try {
        assertPath([{x: p.A.x, z: p.A.z}, {x, z: 0}, {x: S.x, z: S.z}]);
        assertAroundTheEnd('blend', [[p.A, Wp, S]], s, {zoom: 1.25});
      } catch {
        continue;
      }
      cands[p.id].push({W: Wp, L: d3(p.A, Wp) + d3(Wp, S)});
    }
  }
  let best: {sp: number; t: {W: PlanPt; L: number}[]} | null = null;
  for (const a of cands.head) for (const b of cands.shoulder) {
    if (Math.abs(a.L - b.L) > 0.05) continue;
    for (const c of cands.feet) {
      const Ls = [a.L, b.L, c.L];
      const sp = Math.max(...Ls) - Math.min(...Ls);
      const apart = Math.min(Math.hypot(a.W.x - b.W.x, a.W.h! - b.W.h!), Math.hypot(a.W.x - c.W.x, a.W.h! - c.W.h!), Math.hypot(b.W.x - c.W.x, b.W.h! - c.W.h!));
      if (sp <= 0.05 && apart >= 0.3 && (!best || sp < best.sp)) best = {sp, t: [a, b, c]};
    }
  }
  console.log(`S2.4 @${tilt}: candidates head ${cands.head.length}, shoulder ${cands.shoulder.length}, feet ${cands.feet.length}; ` + (best ? best.t.map((c, i) => `${parts[i].id} -> (${c.W.x.toFixed(2)}, h ${c.W.h!.toFixed(2)}) ${c.L.toFixed(3)} m`).join(' | ') + ` (spread ${(best.sp * 1000).toFixed(0)} mm)` : 'NO TRIPLE'));
}

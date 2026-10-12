// Numbers for the V5 opening (f20-48): stance IK feasibility, pinned foot, foot/ground clearance, hip path. Usage: node tools/probe_opening_v5.mjs [json-out]
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..'); const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-op5-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `
export * as OP from '${src}/film5/Opening5';
export * as TL from '${src}/film5/timeline5';
export * as SIDE from '${src}/v2/side';
export * as CH from '${src}/v2/choreo2';
`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json', '.css': 'empty', '.woff': 'empty', '.woff2': 'empty'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error', define: {'process.env.NODE_ENV': '"production"'}});
const {OP, TL, SIDE, CH} = await import(pathToFileURL(out).href);
const rows = [];
let prev = null;
for (let f = TL.T.cutStreet; f < TL.T.dangerEnd; f++) {
  const u = f - TL.T.cutStreet, z = OP.zoomP1(f), sc = CH.SC * z, pose = OP.poseP1(f), hip = OP.hipP1(f, z), fk = SIDE.sideFK(pose, hip, sc);
  const bottom = (s) => s.y + 14 * sc, gap = (s) => +(CH.GSY - bottom(s)).toFixed(1);
  const st = OP.stanceInfo(u);
  const row = {f, u, hipY: +hip.y.toFixed(1), hh: +(CH.GSY - hip.y).toFixed(1), shoeN_gap: gap(fk.shoeN), shoeF_gap: gap(fk.shoeF), ikReach: +st.ext.toFixed(3), contactX: +OP.contactScreenX(Math.min(u, OP.U_REL)).toFixed(1), shoeNx: +fk.shoeN.x.toFixed(1), lift: +OP.liftP1(f).toFixed(1), lean: +pose.lean.toFixed(1)};
  if (prev) { row.dHip = +(Math.hypot(hip.x - prev.hip.x, hip.y - prev.hip.y)).toFixed(1); row.dShoeN = +Math.hypot(fk.shoeN.x - prev.fk.shoeN.x, fk.shoeN.y - prev.fk.shoeN.y).toFixed(1); row.dShoeF = +Math.hypot(fk.shoeF.x - prev.fk.shoeF.x, fk.shoeF.y - prev.fk.shoeF.y).toFixed(1); }
  row.joints = {P: fk.P, N: fk.N, Hc: fk.Hc, Sn: fk.Sn, En: fk.En, Wn: fk.Wn, Sf: fk.Sf, Ef: fk.Ef, Wf: fk.Wf, Kn: fk.Kn, An: fk.An, shoeN: fk.shoeN, Kf: fk.Kf, Af: fk.Af, shoeF: fk.shoeF}; prev = {hip, fk}; rows.push(row);
}
console.table(rows.map((r) => ({f: r.f, u: r.u, hh: r.hh, gapN: r.shoeN_gap, gapF: r.shoeF_gap, reach: r.ikReach, cX: r.contactX, shoeNx: r.shoeNx, lift: r.lift, lean: r.lean, dHip: r.dHip, dN: r.dShoeN, dF: r.dShoeF})));
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));

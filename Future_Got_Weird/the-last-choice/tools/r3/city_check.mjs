// R3 spatial checker for the battlefield set (no rendering): building/set-piece intersections, machine routes and
// persisted positions through solids, camera paths through buildings, painter's-order risk of big faces near machines.
// Usage (from source/):  node ../tools/r3/city_check.mjs [--json out.json] [--all]
//   prints errors and warnings (and infos with --all); exit code 0 always (it is a report, not a gate).
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const {build} = createRequire(path.resolve('package.json'))('esbuild');
const out = path.resolve('.remotion/r3_city_check.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
await build({
  entryPoints: [path.join(here, 'city_check_entry.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out,
  loader: {'.json': 'json'}, logLevel: 'error', jsx: 'automatic', nodePaths: [path.resolve('node_modules')],
});
// ---- Crew positions per section (each section is its own small bundle: a section mid-edit that fails to build or
//      run is reported and skipped, not fatal). Positions are the figures' feet (FigSpec.pos), sampled every 0.5 s.
const SRC = path.resolve('src/r2');
const FIGS = [
  {sec: 'B', mod: 'shots/B/director', t: [9.3, 36.5], code: (m) => [['director', (T) => m.dirB(T).pos]]},
  {sec: 'C', mod: 'shots/C/crew', t: [35.8, 59.95], code: (m) => [['director', (T) => m.directorC(T).spec.pos], ['tether', (T) => m.tetherC(T).spec.pos], ['runner', (T) => m.runnerC(T).spec.pos], ['breaker', (T) => m.breakerC(T).spec.pos]]},
  ...['D1', 'D2'].map((sec, k) => ({sec, mod: `shots/${sec}/crew`, t: k === 0 ? [59.95, 94.3] : [94.3, 116.92], code: (m) => ['director', 'breaker', 'tether', 'runner', 'flares', 'decoy'].map((r) => [r, (T) => m[`${r}At`](T).spec.pos]).concat([['drone', (T) => m.droneAt(T, {x: 0, y: 0, z: 0}).spec.pos]])})),
  ...['D3', 'D4'].map((sec, k) => ({sec, mod: `shots/${sec}/crew`, t: k === 0 ? [116.92, 149.86] : [149.86, 186.9], code: (m, roles) => roles.map((r) => [r, (T) => m.crewAt(r, T).spec.pos])})),
  {sec: 'EF', mod: 'shots/EF/crew', t: [186.9, 231.6], code: (m) => [['director', (T) => m.directorSpec(T).pos], ['drone', (T) => m.pilotSpec(T).pos], ...['tether', 'decoy', 'flares', 'breaker', 'runner'].map((r) => [r, (T) => m.heldSpec(r, T).pos])]},
];
const figs = [], figNotes = [];
for (const F of FIGS) {
  const entry = path.resolve(`.remotion/r3_figs_${F.sec}.ts`), bun = path.resolve(`.remotion/r3_figs_${F.sec}.mjs`);
  fs.writeFileSync(entry, `export * as M from '${path.join(SRC, F.mod)}';\nexport {ROLES2} from '${path.join(SRC, 'rig/looks')}';\n`);
  try {
    await build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: bun, loader: {'.json': 'json'}, logLevel: 'silent', jsx: 'automatic', nodePaths: [path.resolve('node_modules')]});
    const mod = await import(pathToFileURL(bun).href + `?v=${Date.now()}`);
    let n = 0, bad = 0;
    for (const [who, fn] of F.code(mod.M, mod.ROLES2)) for (let T = F.t[0]; T <= F.t[1]; T += 0.5) {
      try { const p = fn(T); if (p && Number.isFinite(p.x)) { figs.push({who: `${F.sec} ${who}`, T, x: p.x, y: p.y, z: p.z}); n++; } } catch { bad++; }
    }
    figNotes.push(`${F.sec}: ${n} crew samples${bad ? ` (${bad} failed calls)` : ''}`);
  } catch (e) {
    figNotes.push(`${F.sec}: SKIPPED (${String(e.message ?? e).split('\n')[0].slice(0, 120)})`);
  }
}
globalThis.__R3_FIGS = figs;
globalThis.__R3_FIG_NOTES = figNotes;
const t0 = Date.now();
const {report} = await import(pathToFileURL(out).href + `?v=${Date.now()}`);
const args = process.argv.slice(2);
const all = args.includes('--all');
const order = {error: 0, warn: 1, info: 2};
const rows = [...report].sort((a, b) => a.cat.localeCompare(b.cat) || order[a.sev] - order[b.sev]);
const counts = {};
rows.forEach((r) => { counts[`${r.cat}.${r.sev}`] = (counts[`${r.cat}.${r.sev}`] ?? 0) + 1; });
for (const r of rows) if (all || r.sev !== 'info' || r.cat === 'camera' || r.cat === 'sort' || r.cat === 'info') console.log(`[${r.cat}] ${r.sev.toUpperCase().padEnd(5)} ${r.msg}`);
console.log('\nsummary', JSON.stringify(counts), `(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
const j = args.indexOf('--json');
if (j >= 0 && args[j + 1]) fs.writeFileSync(args[j + 1], JSON.stringify({counts, report: rows}, null, 1));

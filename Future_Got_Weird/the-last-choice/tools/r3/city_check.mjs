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

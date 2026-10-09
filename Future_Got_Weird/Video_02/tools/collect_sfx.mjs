// Collect every scene's exported sound cue sheet (SFX) into one JSON file.
//   node tools/collect_sfx.mjs [source_dir] [out.json]
// Bundles a tiny entry that imports src/scenes/*.tsx with esbuild (from the project's node_modules) and runs it.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const src = path.resolve(process.argv[2] ?? path.join(here, '..', 'source'));
const out = path.resolve(process.argv[3] ?? path.join(here, '..', 'audio', 'sfx', 'v2', 'cues.json'));
const require = createRequire(path.join(src, 'package.json'));
const esbuild = require('esbuild');
const scenesDir = path.join(src, 'src', 'scenes');
// v2 scenes are V1..V13 (the v1 scenes S1..S9 stay in the tree, unused); SCENE_PREFIX=S collects the v1 set
const PFX = process.env.SCENE_PREFIX ?? 'V';
const files = fs.readdirSync(scenesDir).filter((f) => new RegExp(`^${PFX}\\d+_.*\\.tsx$`).test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const entry = files.map((f, i) => `import * as m${i} from ${JSON.stringify(path.join(scenesDir, f))};`).join('\n') +
  `\nconst out = {};\n` + files.map((f, i) => `out[${JSON.stringify(f.split('_')[0])}] = m${i}.SFX ?? null;`).join('\n') +
  `\nprocess.stdout.write(JSON.stringify(out));\n`;
const tmp = fs.mkdtempSync(path.join(src, '.sfx-'));
const entryFile = path.join(tmp, 'entry.tsx');
fs.writeFileSync(entryFile, entry);
const bundle = path.join(tmp, 'bundle.cjs');
await esbuild.build({entryPoints: [entryFile], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, jsx: 'automatic', loader: {'.json': 'json', '.png': 'empty', '.css': 'empty'}, logLevel: 'error', nodePaths: [path.join(src, 'node_modules')]});
const json = execFileSync(process.execPath, [bundle], {encoding: 'utf8', maxBuffer: 64 << 20});
fs.rmSync(tmp, {recursive: true, force: true});
const data = JSON.parse(json);
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(data, null, 1));
for (const [k, v] of Object.entries(data)) console.log(k, v ? `${v.length} cues` : 'no SFX export');

// Bundle src/v3/sfx_v3.ts with esbuild (shipped with Remotion's bundler) and write audio/v3/sfx_cues_v3.json.
// Usage (from source/): node ../tools/v2/collect_sfx_v3.mjs
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {build} = createRequire(path.resolve('package.json'))('esbuild');
const out = path.resolve('.remotion/sfx_v3.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
await build({entryPoints: ['src/v3/sfx_v3.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, logLevel: 'error', jsx: 'automatic'});
const mod = await import(pathToFileURL(out).href);
const data = mod.collectV3();
fs.writeFileSync(path.resolve('../audio/v3/sfx_cues_v3.json'), JSON.stringify(data, null, 1));
console.log(`cues: ${data.cues.length}, total ${(data.totalFrames / 30).toFixed(2)} s`);

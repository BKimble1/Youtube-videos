// Bundle src/v6/sfx_v6.ts with esbuild (shipped with Remotion's bundler) and write audio/v6/sfx_cues_v6.json.
// Usage (from source/): node ../tools/v6/collect_sfx_v6.mjs
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {build} = createRequire(path.resolve('package.json'))('esbuild');
const out = path.resolve('.remotion/sfx_v6.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
await build({entryPoints: ['src/v6/sfx_v6.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, logLevel: 'error', jsx: 'automatic'});
const mod = await import(pathToFileURL(out).href);
const data = mod.collectV6();
fs.writeFileSync(path.resolve('../audio/v6/sfx_cues_v6.json'), JSON.stringify(data, null, 1));
console.log(`cues: ${data.cues.length}, total ${(data.totalFrames / 30).toFixed(2)} s`);

// Bundle src/sfx_index.ts with esbuild (shipped with Remotion's bundler) and write audio/sfx_cues.json.
// Usage (from source/): node ../tools/collect_sfx.mjs
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// resolve esbuild from the episode's own node_modules (this script lives outside source/)
const {build} = createRequire(path.resolve('package.json'))('esbuild');
const out = path.resolve('.remotion/sfx_index.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
await build({entryPoints: ['src/sfx_index.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, logLevel: 'error', external: []});
const mod = await import(pathToFileURL(out).href);
const data = mod.collect();
fs.writeFileSync(path.resolve('../audio/sfx_cues.json'), JSON.stringify(data, null, 1));
console.log(`cues: ${data.cues.length}, total frames ${data.totalFrames} (${(data.totalFrames / 30).toFixed(2)} s)`);

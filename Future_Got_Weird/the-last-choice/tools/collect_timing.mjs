// Bundle src/film/timing.ts (and src/film/sfx.ts when present) with esbuild and write audio/timing.json:
// music segments, anchors, shots and sound cues, so the Python audio tools use exactly the film's timing.
// Usage (from source/): node ../tools/collect_timing.mjs
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {build} = createRequire(path.resolve('package.json'))('esbuild');
const out = path.resolve('.remotion/timing_bundle.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
const entry = fs.existsSync('src/film/sfx.ts') ? 'src/film/sfx.ts' : 'src/film/timing.ts';
await build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, logLevel: 'error', jsx: 'automatic'});
const mod = await import(pathToFileURL(out).href + `?v=${Date.now()}`);
const data = {music: mod.MUSIC, anchors: mod.M, shots: mod.SHOTS, end: mod.FILM_END, cues: mod.CUES ?? [], beds: mod.BEDS ?? [], perspective: mod.PERSPECTIVE ?? []};
fs.mkdirSync(path.resolve('../audio'), {recursive: true});
fs.writeFileSync(path.resolve('../audio/timing.json'), JSON.stringify(data, null, 1));
console.log(`music segs ${data.music.length}, shots ${data.shots.length}, cues ${data.cues.length}, end ${data.end}s`);

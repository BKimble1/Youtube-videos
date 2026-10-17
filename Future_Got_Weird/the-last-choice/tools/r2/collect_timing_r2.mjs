// Bundle src/r2/sound.ts (or src/r2/timing.ts) with esbuild and write audio/r2/timing.json for the Python audio tools:
// music segments, anchors, sections, end, and (when present) sound cues, beds, perspective and radio automation.
// Usage (from source/): node ../tools/r2/collect_timing_r2.mjs
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {build} = createRequire(path.resolve('package.json'))('esbuild');
const out = path.resolve('.remotion/r2_timing_bundle.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
const entry = fs.existsSync('src/r2/sound.ts') ? 'src/r2/sound.ts' : 'src/r2/timing.ts';
await build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, logLevel: 'error', jsx: 'automatic'});
const mod = await import(pathToFileURL(out).href + `?v=${Date.now()}`);
const data = {music: mod.MUSIC, anchors: mod.M, sections: mod.SECTIONS, end: mod.FILM_END, cues: mod.CUES ?? [], beds: mod.BEDS ?? [], perspective: mod.PERSPECTIVE ?? [], radio: mod.RADIO_MIX ?? null};
fs.mkdirSync(path.resolve('../audio/r2'), {recursive: true});
fs.writeFileSync(path.resolve('../audio/r2/timing.json'), JSON.stringify(data, null, 1));
console.log(`music segs ${data.music.length}, cues ${data.cues.length}, beds ${data.beds.length}, end ${data.end}s`);

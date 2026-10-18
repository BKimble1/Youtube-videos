// Bundle src/events.ts for Node and write the sound-event sheet: audio/sfx_events.json
import {build} from '../source/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const out = path.join(root, 'source', `.events_${process.pid}.tmp.mjs`); // inside source/ so react/remotion resolve
await build({entryPoints: [path.join(root, 'source/src/events.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'warning',
  external: ['remotion', 'react', 'react-dom', '@remotion/*'], loader: {'.json': 'json'}});
const mod = await import(pathToFileURL(out).href);
const ev = mod.EVENTS();
fs.writeFileSync(path.join(root, 'audio/sfx_events.json'), JSON.stringify(ev, null, 1));
fs.rmSync(out);
console.log('audio/sfx_events.json', Object.keys(ev).join(', '), `brake bumps f${ev.brake.front.length}/r${ev.brake.rear.length}`);

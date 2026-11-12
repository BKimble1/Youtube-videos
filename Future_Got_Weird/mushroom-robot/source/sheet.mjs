// Render chosen frames of a composition (one bundle), then tile them into a labelled contact sheet.
// usage: node tools/sheet.mjs <Comp> <out.png> <f1,f2,...> [cols] [scale]
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import path from 'path'; import fs from 'fs'; import {execFileSync} from 'child_process';
const [comp, out, list, cols = '4', scale = '0.4'] = process.argv.slice(2);
const root = path.dirname(new URL(import.meta.url).pathname);
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), webpackOverride: (c) => c});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({serveUrl, id: comp, browserExecutable, inputProps: {audio: false}});
const tmp = fs.mkdtempSync('/tmp/claude-0/-home-user-Youtube-videos/1e76e482-0b26-5207-9490-2063d9aed718/scratchpad/st_');
const frames = list.split(',').map(Number);
const files = [];
for (const f of frames) {
  const o = path.join(tmp, `f${String(f).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: f, output: o, browserExecutable, inputProps: {audio: false}, scale: Number(scale)});
  files.push(o);
}
execFileSync('python3', [path.join(path.dirname(new URL(import.meta.url).pathname), '../tools/tile.py'), out, cols, ...files], {stdio: 'inherit'});

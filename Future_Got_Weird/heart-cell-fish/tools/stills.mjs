// Render arbitrary frames of a composition as separate stills (one bundle), then tile them into a contact sheet.
// usage: node tools/stills.mjs <out.png> "f1,f2,..." [cols=6] [comp=HeartFishV1] [captions=false] [scale=0.25]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const [out, list, cols = '6', comp = 'HeartFishV1', caps = 'false', scale = '0.25'] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../source');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), webpackOverride: (c) => c});
const inputProps = {audio: false, captions: caps === 'true'};
const composition = await selectComposition({serveUrl, id: comp, inputProps, browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'});
const tmp = fs.mkdtempSync('/tmp/claude-0/-home-user-Youtube-videos/23340a80-0ca1-583e-b4a9-f59f86b4b746/scratchpad/st-');
const frames = list.split(',').map(Number);
const files = [];
for (const f of frames) {
  const o = path.join(tmp, `f${String(f).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output: o, frame: f, inputProps, scale: Number(scale), browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'});
  files.push(o);
}
const c = Number(cols), r = Math.ceil(files.length / c);
const args = [];
files.forEach((f) => args.push('-i', f));
const lab = files.map((_, i) => `[${i}:v]drawtext=text='${frames[i]} ${(frames[i] / 60).toFixed(2)}s':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.5[v${i}]`).join(';');
const layout = files.map((_, i) => `${(i % c) === 0 ? '0' : Array.from({length: i % c}, () => 'w0').join('+')}_${Math.floor(i / c) === 0 ? '0' : Array.from({length: Math.floor(i / c)}, () => 'h0').join('+')}`).join('|');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${lab};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, out]);
console.log(out, files.length, 'frames');

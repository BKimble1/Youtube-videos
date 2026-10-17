// Render frames as PNG stills for inspection (+ a labelled contact sheet when several).
//   node stills.mjs <out_dir> <frame|"t:SECONDS"> ...   env: COMP (default LastChoice), SCALE (default 0.5), PROPS (json)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [, , outDir, ...specs] = process.argv;
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {audio: false, ...JSON.parse(process.env.PROPS ?? '{}')};
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'LastChoice', inputProps, browserExecutable});
fs.mkdirSync(outDir, {recursive: true});
const outs = [];
for (const spec of specs) {
  const frame = Math.min(composition.durationInFrames - 1, spec.startsWith('t:') ? Math.round(parseFloat(spec.slice(2)) * 30) : parseInt(spec, 10));
  const output = path.join(outDir, `${process.env.PREFIX ?? 'f'}${String(frame).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, inputProps, browserExecutable, scale: Number(process.env.SCALE ?? 0.5)});
  outs.push([output, frame]);
}
try { if (serveUrl.startsWith('/') && fs.existsSync(serveUrl)) fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {}
if (outs.length > 1 && !process.env.NO_SHEET) {
  const args = [];
  outs.forEach(([o]) => { args.push('-i', o); });
  const n = outs.length; const cols = Math.min(Number(process.env.COLS ?? 4), n);
  const W = Number(process.env.TW ?? 480), Hh = Math.round(W * 9 / 16);
  const filt = outs.map(([o, f], i) => `[${i}:v]scale=${W}:${Hh},drawtext=text='${f} (${(f / 30).toFixed(2)}s)':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const layout = outs.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * Hh}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${filt};${outs.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=gray[out]`, '-map', '[out]', path.join(outDir, process.env.SHEET ?? 'sheet.png')]);
  console.log('sheet', path.join(outDir, process.env.SHEET ?? 'sheet.png'));
}

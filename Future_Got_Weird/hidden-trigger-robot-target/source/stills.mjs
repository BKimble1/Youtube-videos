// Render specific frames as PNG stills for inspection, then a labelled contact sheet.
//   node stills.mjs <out_dir> <frame|"t:SECONDS"> ...      env: COMP (default Main), SCALE (default 0.5)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [, , outDir, ...specs] = process.argv;
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {audio: false, ...JSON.parse(process.env.PROPS ?? '{}')};
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'HiddenTriggerV1', inputProps, browserExecutable});
fs.mkdirSync(outDir, {recursive: true});
const outs = [];
for (const spec of specs) {
  const frame = Math.min(composition.durationInFrames - 1, spec.startsWith('t:') ? Math.round(parseFloat(spec.slice(2)) * 30) : parseInt(spec, 10));
  const output = path.join(outDir, `f${String(frame).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, inputProps, browserExecutable, scale: Number(process.env.SCALE ?? 0.5)});
  outs.push([output, frame]);
}
try { if (serveUrl.startsWith('/') && fs.existsSync(serveUrl)) fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {}
// contact sheet (4 columns) with frame/timecode labels
if (outs.length > 1 && !process.env.NO_SHEET) {
  const args = [];
  outs.forEach(([o, f]) => { args.push('-i', o); });
  const n = outs.length; const cols = Math.min(6, n); const rows = Math.ceil(n / cols);
  const filt = outs.map(([o, f], i) => `[${i}:v]scale=270:480,drawtext=text='${f} (${(f / 30).toFixed(2)}s)':x=8:y=8:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const layout = outs.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${filt};${outs.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=gray[out]`, '-map', '[out]', path.join(outDir, 'sheet.png')]);
  console.log('sheet', path.join(outDir, 'sheet.png'));
}

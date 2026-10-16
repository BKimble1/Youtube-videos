// Render chosen frames as PNG stills plus a labelled contact sheet, for inspection.
//   node stills.mjs <out_dir> <frame|"t:SECONDS"> ...      env: COMP (default Short), SCALE (default 0.5), PROPS (json)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [, , outDir, ...specs] = process.argv;
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {audio: false, ...JSON.parse(process.env.PROPS ?? '{}')};
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'Short', inputProps, browserExecutable});
fs.mkdirSync(outDir, {recursive: true});
const scale = Number(process.env.SCALE ?? 0.5);
const outs = [];
for (const spec of specs) {
  const frame = Math.min(composition.durationInFrames - 1, spec.startsWith('t:') ? Math.round(parseFloat(spec.slice(2)) * 30) : parseInt(spec, 10));
  const output = path.join(outDir, `f${String(frame).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, inputProps, browserExecutable, scale});
  outs.push([output, frame]);
}
try { if (serveUrl.startsWith('/') && fs.existsSync(serveUrl)) fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {}
if (outs.length > 1 && !process.env.NO_SHEET) {
  const portrait = composition.height > composition.width;
  const tw = portrait ? 300 : 480, th = Math.round(tw * composition.height / composition.width);
  const cols = Math.min(portrait ? 6 : 4, outs.length);
  const args = outs.flatMap(([o]) => ['-i', o]);
  const filt = outs.map(([o, f], i) => `[${i}:v]scale=${tw}:${th},drawtext=text='${f} (${(f / 30).toFixed(2)}s)':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const layout = outs.map((_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${filt};${outs.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${outs.length}:layout=${layout}:fill=gray[out]`, '-map', '[out]', path.join(outDir, 'sheet.png')]);
  console.log('sheet', path.join(outDir, 'sheet.png'));
}

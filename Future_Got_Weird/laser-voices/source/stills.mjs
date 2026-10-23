// Dev and QA stills. Bundles once, then renders each requested still and tiles a labelled contact sheet.
//   node stills.mjs <out_dir> <spec.json>      spec: [{id: composition id, props: {...}, frame?: n, label?: s}, ...]
//   env SCALE (default 0.5), COLS (default 4)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [, , outDir, specFile] = process.argv;
const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync(outDir, {recursive: true});
const outs = [];
const scale = Number(process.env.SCALE ?? 0.5);
for (const [i, sp] of specs.entries()) {
  const composition = await selectComposition({serveUrl, id: sp.id, inputProps: sp.props ?? {}, browserExecutable});
  const frame = sp.frame ?? 0;
  const output = path.join(outDir, `${String(i).padStart(2, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, inputProps: sp.props ?? {}, browserExecutable, scale});
  outs.push([output, sp.label ?? `${sp.id} ${frame}`]);
}
try { if (serveUrl.startsWith('/') && fs.existsSync(serveUrl)) fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {}
if (outs.length > 1) {
  const args = [];
  outs.forEach(([o]) => args.push('-i', o));
  const n = outs.length, cols = Math.min(Number(process.env.COLS ?? 4), n), W = Math.round(1080 * scale), H = Math.round(1920 * scale);
  const filt = outs.map(([, l], i) => `[${i}:v]scale=${W}:${H},drawtext=text='${String(l).replace(/[:']/g, ' ')}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const layout = outs.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${filt};${outs.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=gray[out]`, '-map', '[out]', path.join(outDir, 'sheet.png')]);
  console.log('sheet', path.join(outDir, 'sheet.png'));
}

// usage: node svgsheet.mjs out.jpg cols tw crop(x0,y0,x1,y1 fractions) label1=file1.svg ...   (rasterises SVGs in headless chromium, tiles them)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [, , out, colsA, twA, cropA, ...items] = process.argv;
const W = 1920, H = 1080;
const CH = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svgs-'));
const files = [];
let i = 0;
for (const it of items) {
  const k = it.indexOf('=');
  const label = it.slice(0, k), file = it.slice(k + 1);
  const svg = fs.readFileSync(file, 'utf8');
  const html = path.join(tmp, `s${i}.html`);
  fs.writeFileSync(html, `<html><body style="margin:0;background:#000">${svg.replace('width="100%" height="100%"', `width="${W}" height="${H}"`)}</body></html>`);
  const o = path.join(tmp, `s${String(i++).padStart(4, '0')}.png`);
  try { execFileSync(CH, ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--window-size=${W},${H}`, `--screenshot=${o}`, `file://${html}`], {stdio: 'ignore'}); } catch (e) { console.error('shot failed', file); }
  files.push([o, label]);
}
const cols = Math.min(Number(colsA), files.length), TW = Number(twA);
const crop = cropA.split(',').map(Number);
const cw = Math.round((crop[2] - crop[0]) * W), ch = Math.round((crop[3] - crop[1]) * H), TH = Math.round((TW * ch) / cw);
const lab = (j, l) => `drawtext=text='${l.replace(/'/g, '')}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6`;
if (files.length === 1) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', files[0][0], '-vf', `crop=${cw}:${ch}:${Math.round(crop[0] * W)}:${Math.round(crop[1] * H)},scale=${TW}:${TH},${lab(0, files[0][1])}`, '-q:v', '3', out]);
} else {
  const inputs = files.flatMap(([f]) => ['-i', f]);
  const filt = files.map(([, l], j) => `[${j}:v]crop=${cw}:${ch}:${Math.round(crop[0] * W)}:${Math.round(crop[1] * H)},scale=${TW}:${TH},${lab(j, l)}[v${j}]`).join(';');
  const layout = files.map((_, j) => `${(j % cols) * TW}_${Math.floor(j / cols) * TH}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${filt};${files.map((_, j) => `[v${j}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=gray[o]`, '-map', '[o]', '-q:v', '3', out]);
}
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`${files.length} -> ${out}`);

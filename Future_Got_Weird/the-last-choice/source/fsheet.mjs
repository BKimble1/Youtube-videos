// R4 frame-step tool: render a run of frames from a fresh (webpack-cached, so ~15-30 s) bundle of the CURRENT source and
// tile them into a labelled contact sheet.
//   node fsheet.mjs <out.jpg> <t0|f0> <t1|f1> [step]      (a bare number is seconds if it has a "." or is < 400, else a frame
//                                                            when prefixed "f": f5379). step = frames between tiles (default 2)
//   env: COMP (LastChoiceR2) · COLS (6) · TW tile width px (320) · SCALE render scale (0.5) · CROP "x0,y0,x1,y1" as 0..1 fractions
//        KEEP=dir to keep the PNGs · PROPS json
// Run it from source/. Frames render one after another in one browser, ~1-3 s each. Other people edit the same tree: a
// file caught mid-edit fails the bundle; wait a moment and retry.
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [, , out, a0, a1, stepArg] = process.argv;
if (!out || !a0 || !a1) { console.error('usage: node fsheet.mjs <out.jpg> <t0|fN> <t1|fN> [step]'); process.exit(1); }
const FPS = 30;
const toFrame = (s) => (s.startsWith('f') ? parseInt(s.slice(1), 10) : Math.round(parseFloat(s) * FPS));
const f0 = toFrame(a0), f1 = toFrame(a1), step = Number(stepArg ?? 2);
const frames = [];
for (let f = f0; f <= f1; f += step) frames.push(f);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {audio: false, ...JSON.parse(process.env.PROPS ?? '{}')};
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'swangle'}});
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'LastChoiceR2', inputProps, puppeteerInstance: browser});
const tmp = process.env.KEEP ?? fs.mkdtempSync(path.join(os.tmpdir(), 'fsheet-'));
fs.mkdirSync(tmp, {recursive: true});
const files = [];
for (const frame of frames) {
  const output = path.join(tmp, `f${String(frame).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame: Math.min(frame, composition.durationInFrames - 1), inputProps, puppeteerInstance: browser, scale: Number(process.env.SCALE ?? 0.5)});
  files.push([output, frame]);
}
await browser.close({silent: true});
try { if (serveUrl.startsWith('/') && fs.existsSync(serveUrl)) fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {}
const cols = Math.min(Number(process.env.COLS ?? 6), files.length);
const TW = Number(process.env.TW ?? 320);
const crop = (process.env.CROP ?? '0,0,1,1').split(',').map(Number);
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', files[0][0]]).toString().trim().split(',').map(Number);
const cw = Math.round((crop[2] - crop[0]) * probe[0]), ch = Math.round((crop[3] - crop[1]) * probe[1]);
const TH = Math.round((TW * ch) / cw);
const inputs = files.flatMap(([f]) => ['-i', f]);
const filt = files.map(([, fr], i) => `[${i}:v]crop=${cw}:${ch}:${Math.round(crop[0] * probe[0])}:${Math.round(crop[1] * probe[1])},scale=${TW}:${TH},drawtext=text='${(fr / FPS).toFixed(2)}  f${fr}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`).join(';');
const layout = files.map((_, i) => `${(i % cols) * TW}_${Math.floor(i / cols) * TH}`).join('|');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${filt};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=gray[o]`, '-map', '[o]', '-q:v', '3', out]);
if (!process.env.KEEP) fs.rmSync(tmp, {recursive: true, force: true});
console.log(`${files.length} frames -> ${out}`);

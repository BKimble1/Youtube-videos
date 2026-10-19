// batch sheets: node msheet.mjs jobs.json   (run from source/). jobs: [{out, t0, t1, step, crop, cols, tw, scale}] (t in seconds or "fN")
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const require = createRequire('/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/package.json');
const {renderStill, selectComposition, openBrowser} = require('@remotion/renderer');
const {bundle} = require('@remotion/bundler');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const FPS = 30;
const toFrame = (s) => (typeof s === 'string' && s.startsWith('f') ? parseInt(s.slice(1), 10) : Math.round(parseFloat(s) * FPS));
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {audio: false};
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'swangle'}});
const composition = await selectComposition({serveUrl, id: 'LastChoiceR2', inputProps, puppeteerInstance: browser});
const cache = new Map();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'msheet-'));
for (const job of jobs) {
  try {
    const f0 = toFrame(job.t0 ?? 0), f1 = toFrame(job.t1 ?? 0), step = job.step ?? 2;
    const scale = job.scale ?? 0.5;
    const frames = job.frames ? job.frames.map(toFrame) : []; if (!job.frames) for (let f = f0; f <= f1; f += step) frames.push(f);
    const files = [];
    for (const frame of frames) {
      const key = frame + '@' + scale;
      let out = cache.get(key);
      if (!out) {
        out = path.join(tmp, `f${frame}_${scale}.png`);
        await renderStill({composition, serveUrl, output: out, frame: Math.min(frame, composition.durationInFrames - 1), inputProps, puppeteerInstance: browser, scale});
        cache.set(key, out);
      }
      files.push([out, frame]);
    }
    const cols = Math.min(job.cols ?? 6, files.length), TW = job.tw ?? 320;
    const crop = job.crop ?? [0, 0, 1, 1];
    const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', files[0][0]]).toString().trim().split(',').map(Number);
    const cw = Math.round((crop[2] - crop[0]) * probe[0]), ch = Math.round((crop[3] - crop[1]) * probe[1]);
    const TH = Math.round((TW * ch) / cw);
    const inputs = files.flatMap(([f]) => ['-i', f]);
    const filt = files.map(([, fr], i) => `[${i}:v]crop=${cw}:${ch}:${Math.round(crop[0] * probe[0])}:${Math.round(crop[1] * probe[1])},scale=${TW}:${TH},drawtext=text='${(fr / FPS).toFixed(2)}  f${fr}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`).join(';');
    const layout = files.map((_, i) => `${(i % cols) * TW}_${Math.floor(i / cols) * TH}`).join('|');
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${filt};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=gray[o]`, '-map', '[o]', '-q:v', '3', job.out]);
    console.log('done', job.out, files.length);
  } catch (e) { console.log('FAILED', job.out, String(e).slice(0, 300)); }
}
await browser.close({silent: true});
try { if (serveUrl.startsWith('/') && fs.existsSync(serveUrl)) fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {}
fs.rmSync(tmp, {recursive: true, force: true});

// usage: node stills.mjs <outDir> <comp> <frame,frame,...> [scale]
// Bundles once, opens one browser, renders the stills in parallel (4 tabs).
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const [outDir, comp, framesArg, scaleArg] = process.argv.slice(2);
const frames = framesArg.split(',').map(Number);
const scale = Number(scaleArg ?? 0.3333);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = process.env.SERVE_URL ?? await bundle({entryPoint: path.resolve('src/index.ts'), onProgress: () => {}});
const browser = await openBrowser('chrome', {browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'});
const composition = await selectComposition({serveUrl, id: comp, inputProps: {}, puppeteerInstance: browser});
let i = 0;
const work = async () => {
  while (i < frames.length) {
    const k = i++;
    const f = frames[k];
    await renderStill({composition, serveUrl, frame: f, output: path.join(outDir, `${String(k).padStart(3, '0')}_f${String(f).padStart(3, '0')}.png`), scale, puppeteerInstance: browser, inputProps: {}});
  }
};
await Promise.all([work(), work(), work(), work()]);
await browser.close({silent: true});
console.log('done', frames.length);

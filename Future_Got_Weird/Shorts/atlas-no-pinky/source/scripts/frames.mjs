// Render selected frames of a composition to PNGs (bundle once). Usage: node tools/frames.mjs <outDir> <compId> <f1,f2,...> [scale]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..');
const [outDir, id, list, scale = '1'] = process.argv.slice(2);
const frames = list.split(',').map(Number);
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(src, 'src/index.ts'), onProgress: () => {}});
const comp = await selectComposition({serveUrl, id, browserExecutable, inputProps: {}});
for (const f of frames) {
  const output = path.join(outDir, `${id}_${String(f).padStart(4, '0')}.png`);
  await renderStill({composition: comp, serveUrl, frame: f, output, browserExecutable, scale: Number(scale), imageFormat: 'png'});
}
console.log('rendered', frames.length, 'frames to', outDir);

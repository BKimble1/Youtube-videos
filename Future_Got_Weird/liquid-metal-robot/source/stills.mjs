// Render chosen frames of one hook as PNG stills, bundling once (much faster than repeated `remotion still`).
// usage: node stills.mjs <srcDir, e.g. v1> <outDir> <frames: "0,15,30" or "0-179/15"> [captions=true|false] [scale=0.5]
// lives in source/ so Node resolves the Remotion packages from source/node_modules; run it from source/.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [h, outDir, spec, capArg = 'true', scaleArg = '0.5'] = process.argv.slice(2);
const frames = spec.includes('-')
  ? (() => { const [r, st] = spec.split('/'); const [a, b] = r.split('-').map(Number); const s = Number(st || 1); const o = []; for (let f = a; f <= b; f += s) o.push(f); return o; })()
  : spec.split(',').map(Number);
const src = path.resolve('src', h, 'index.ts');
const serveUrl = await bundle({entryPoint: src, publicDir: path.resolve('public')});
const inputProps = {audio: 'none', captions: capArg === 'true'};
const comp = await selectComposition({serveUrl, id: process.env.COMP ?? 'LiquidMetalRobotV1', inputProps,
  browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'});
fs.mkdirSync(outDir, {recursive: true});
for (const frame of frames) {
  const output = path.join(outDir, `${h}_f${String(frame).padStart(3, '0')}.png`);
  await renderStill({serveUrl, composition: comp, frame, output, inputProps, scale: Number(scaleArg),
    browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'});
  console.log(output);
}

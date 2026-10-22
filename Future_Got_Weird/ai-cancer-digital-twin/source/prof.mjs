// Time single-frame renders at chosen seconds (dev profiling): node prof.mjs 3 12 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {audio: false};
const composition = await selectComposition({serveUrl, id: 'Main', inputProps, browserExecutable});
for (const s of process.argv.slice(2)) {
  const frame = Math.round(parseFloat(s) * 30);
  await renderStill({composition, serveUrl, output: '/tmp/p.png', frame, inputProps, browserExecutable, scale: 1});
  const t1 = Date.now();
  await renderStill({composition, serveUrl, output: '/tmp/p.png', frame: frame + 1, inputProps, browserExecutable, scale: 1});
  console.log(s, 'ms', Date.now() - t1);
}

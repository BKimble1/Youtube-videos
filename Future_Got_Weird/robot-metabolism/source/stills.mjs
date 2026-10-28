// Render many stills from one bundle (much faster than one `remotion still` per frame).
// usage: node tools/stills.mjs jobs.json   (jobs: [{id, props, out, scale}])
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const src = here;
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.join(src, 'src/index.ts'), onProgress: () => {}});
for (const j of jobs) {
  const comp = await selectComposition({serveUrl, id: j.id, inputProps: j.props, browserExecutable});
  await renderStill({composition: comp, serveUrl, output: j.out, inputProps: j.props, scale: j.scale ?? 1, frame: j.frame ?? 0, browserExecutable, imageFormat: 'png', overwrite: true});
  console.log('wrote', j.out);
}

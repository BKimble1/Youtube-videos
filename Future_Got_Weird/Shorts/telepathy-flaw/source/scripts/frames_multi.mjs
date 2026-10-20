// Render many stills with ONE bundle. Usage: node scripts/frames_multi.mjs <outDir> <jobs.json> [scale]
// jobs.json = [{name, comp, frame?, props?}]  (props are Remotion inputProps; e.g. V5Lab {scene:'view', t, cam})
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..');
const [outDir, jobsFile, scale = '1'] = process.argv.slice(2);
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(src, 'src/index.ts'), onProgress: () => {}});
const envVariables = {REMOTION_PACE: process.env.REMOTION_PACE || 'fast'};
const comps = {};
for (const j of jobs) {
  const inputProps = j.props ?? {};
  const key = j.comp + JSON.stringify(inputProps);
  comps[key] = comps[key] ?? (await selectComposition({serveUrl, id: j.comp, browserExecutable, inputProps, envVariables}));
  await renderStill({composition: comps[key], serveUrl, frame: j.frame ?? 0, output: path.join(outDir, `${j.name}.png`), browserExecutable, scale: Number(scale), imageFormat: 'png', envVariables, inputProps});
}
console.log('rendered', jobs.length, 'stills to', outDir);

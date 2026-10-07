// Render specific frames as PNG stills for inspection: node stills.mjs out_dir frame1 frame2 ...
// Frames may be numbers or "seg:s05" / "seg:s05+12" / "word:s05:Kalai?" (+offset) resolved from timeline.json.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [, , outDir, ...specs] = process.argv;
const tl = JSON.parse(fs.readFileSync('src/data/timeline.json', 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
const resolve = (spec) => {
  let off = 0;
  const m = spec.match(/^(.*?)([+-]\d+)$/);
  if (m && !/^\d+$/.test(spec)) { spec = m[1]; off = parseInt(m[2], 10); }
  if (/^\d+$/.test(spec)) return parseInt(spec, 10) + off;
  const parts = spec.split(':');
  const seg = tl.segments.find((s) => s.id === parts[1]);
  if (parts[0] === 'seg') return seg.from + off;
  if (parts[0] === 'segend') return seg.to + off;
  if (parts[0] === 'word') { const w = seg.words.find((x) => norm(x.w) === norm(parts[2])); return w.from + off; }
  if (parts[0] === 'scene') return tl.scenes.find((s) => s.id === parts[1]).from + off;
  throw new Error('bad spec ' + spec);
};
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Preview', inputProps: {audio: 'none'}, browserExecutable});
fs.mkdirSync(outDir, {recursive: true});
for (const spec of specs) {
  const frame = Math.min(composition.durationInFrames - 1, resolve(spec));
  const output = path.join(outDir, `${String(frame).padStart(5, '0')}_${spec.replace(/[^a-zA-Z0-9+-]/g, '_')}.png`);
  await renderStill({composition, serveUrl, output, frame, inputProps: {audio: 'none'}, browserExecutable, scale: Number(process.env.SCALE ?? 0.5)});
  console.log('wrote', output);
}

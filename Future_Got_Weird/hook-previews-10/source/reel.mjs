// Comparison reel: ten numbered separators (rendered here from src/reel) interleaved with the ten rendered hook files,
// in numerical order, re-encoded once to one consistent stream (H.264 CRF 16, AAC 320 kb/s, 1080x1920, 30 fps).
// The hook files themselves are used as rendered (no separators inside them). Run from source/.
// usage: node reel.mjs
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const ROOT = path.resolve('..');
const LINES = JSON.parse(fs.readFileSync(path.join(ROOT, 'production/LINES.json'), 'utf8'));
const NAMES = {'01': 'Tongue Parasite', '02': 'Underwater Cockroach', '03': 'Mantis Worm', '04': 'Liquid Metal Robot', '05': 'Bombardier Beetle',
  '06': 'Zombie Snail', '07': 'Beating Heart', '08': 'Infrared Contacts', '09': 'Pistol Shrimp', '10': 'Brain-Spine Implant'};
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const tmp = fs.mkdtempSync('/tmp/reel-');
const serveUrl = await bundle({entryPoint: path.resolve('src/reel/index.ts')});
const parts = [];
for (const n of Object.keys(LINES).sort()) {
  const hook = path.join(ROOT, 'exports', `FGW_HOOK_${n}_${LINES[n].slug}.mp4`);
  if (!fs.existsSync(hook)) throw new Error(`missing ${hook}`);
  const inputProps = {n, name: NAMES[n]};
  const composition = await selectComposition({serveUrl, id: 'Sep', inputProps, browserExecutable});
  const sep = path.join(tmp, `sep_${n}.mp4`);
  await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: sep, inputProps, browserExecutable, imageFormat: 'png', crf: 16});
  // separators get a silent AAC track so the concat has one audio layout throughout
  const sepA = path.join(tmp, `sepa_${n}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', sep, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '1', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', sepA]);
  parts.push(sepA, hook);
  console.log('separator', n);
}
const inputs = parts.flatMap((p) => ['-i', p]);
const fc = parts.map((_, i) => `[${i}:v]setsar=1,fps=30,format=yuv420p[v${i}];[${i}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${i % 2 === 0 ? 1 : 6}[a${i}]`).join(';') + ';' +
  parts.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${parts.length}:v=1:a=1[v][a]`;
const out = path.join(ROOT, 'exports', 'FGW_ALL_10_HOOKS_COMPARISON.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
  '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out], {stdio: 'inherit'});
fs.rmSync(tmp, {recursive: true, force: true});
console.log(out);

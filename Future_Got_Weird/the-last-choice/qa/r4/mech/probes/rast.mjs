// usage: node rast.mjs outdir x0 y0 w h file1.svg file2.svg ...   -> PNG crops (viewBox cropped at native 1920x1080 scale)
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [, , outDir, x0, y0, w, h, ...files] = process.argv;
const CH = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
fs.mkdirSync(outDir, {recursive: true});
const tmp = fs.mkdtempSync('/tmp/rast-');
for (const f of files) {
  let svg = fs.readFileSync(f, 'utf8');
  svg = svg.replace(/<svg width="100%" height="100%" viewBox="0 0 1920 1080"/, `<svg width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}"`);
  const html = path.join(tmp, 'a.html');
  fs.writeFileSync(html, `<html><body style="margin:0;background:#000">${svg}</body></html>`);
  const o = path.join(outDir, path.basename(f).replace('.svg', '.png'));
  execFileSync(CH, ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, `--screenshot=${o}`, `file://${html}`], {stdio: 'ignore'});
}
fs.rmSync(tmp, {recursive: true, force: true});
console.log(files.length, 'rasterised');

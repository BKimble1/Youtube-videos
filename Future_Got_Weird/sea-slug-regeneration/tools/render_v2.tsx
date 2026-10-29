// V2 frame renderer (fallback for `remotion render`, whose headless screenshot path stalled intermittently on these
// frames in this environment): each frame is the same React picture (Picture2), rendered to static markup and
// rasterised by Playwright's Chromium at 1080x1920, written as PNG. Encode afterwards with ffmpeg (README).
// Usage (bundled with esbuild): node render_v2.cjs <outDir> <from> <to> <worker> <workers> [v2|v3]
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdirSync} from 'fs';
import {Picture2} from '../source/src/v2/Film2';
import {Picture3} from '../source/src/v3/Film3';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {chromium} = require('playwright');
const [out, from, to, wk, nw] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], +process.argv[6]];
const Pic = process.argv[7] === 'v3' ? Picture3 : Picture2;
const NM = process.env.NM ?? `${process.cwd()}/source/node_modules`; // run from the episode folder
(async () => {
  mkdirSync(out, {recursive: true});
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  await p.setContent(`<html><head><link rel="stylesheet" href="file://${NM}/@fontsource-variable/nunito/index.css"><link rel="stylesheet" href="file://${NM}/@fontsource-variable/fredoka/index.css"><style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden}</style></head><body><div id="r" style="position:relative;width:1080px;height:1920px"></div></body></html>`);
  for (let f = from + wk; f <= to; f += nw) {
    const html = renderToStaticMarkup(<Pic f={f} captions />);
    await p.evaluate((h: string) => {
      document.getElementById('r')!.innerHTML = h;
      return document.fonts.ready.then(() => undefined);
    }, html);
    await p.screenshot({path: `${out}/${String(f).padStart(4, '0')}.png`, clip: {x: 0, y: 0, width: 1080, height: 1920}});
    if (f % 40 < nw) console.log('frame', f);
  }
  await b.close();
})();

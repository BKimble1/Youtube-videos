// usage: node nframes.cjs <outdir> <shot: E1|E1Clasp|E2|F1> <f0|f,f,f> <f1> <step>   (film frame numbers) -> outdir/f<frame>.svg
// (bundle: see README.md; env EFCAM is ignored in the production camera)
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import {EF_SHOTS} from '../../../../source/src/r2/shots/EF/shots';
import {M} from '../../../../source/src/r2/timing';
const [outdir, shot, f0, f1, step] = process.argv.slice(2);
fs.mkdirSync(outdir, {recursive: true});
const starts: Record<string, number> = {E1: M.FINAL_HIT, E1Clasp: EF_SHOTS.CLASP_IN, E2: M.RING_END, F1: EF_SHOTS.F1_IN};
const C = (EF_SHOTS as any)[shot] as React.FC;
const s0 = Math.round(starts[shot] * 30);
const list: number[] = f0.includes(',') ? f0.split(',').map(Number) : (() => { const a: number[] = []; for (let f = Number(f0); f <= Number(f1); f += Number(step ?? 1)) a.push(f); return a; })();
for (const fr of list) {
  (globalThis as any).__FRAME = fr - s0;
  const t0 = Date.now();
  const html = renderToStaticMarkup(<div style={{width: 1920, height: 1080}}><C /></div>);
  const svg = html.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '');
  fs.writeFileSync(path.join(outdir, `f${String(fr).padStart(5, '0')}.svg`), svg.replace('width="100%" height="100%"', 'width="1920" height="1080"'));
  console.log(`f${fr} ${((Date.now() - t0) / 1000).toFixed(1)}s ${(svg.length / 1e6).toFixed(1)}MB`);
}

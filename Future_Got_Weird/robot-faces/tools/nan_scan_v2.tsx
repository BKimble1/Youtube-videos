// V2 QA: renders every frame's SVG to static markup (no browser) and reports frames whose markup contains NaN,
// Infinity or a negative radius / size (invalid attributes the browser rejects: a missing shape on that frame).
//   source/node_modules/.bin/esbuild tools/nan_scan_v2.tsx --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --outfile=/tmp/ns.cjs && node /tmp/ns.cjs [step]
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Frame2, SHOTS2, shotAt2} from '../source/src/v2/Film2';
import {END} from '../source/src/v2/state2';

const step = Number(process.argv[2] ?? 1);
const N = Math.round(END * 30);
const bad: Record<string, number[]> = {};
for (let f = 0; f < N; f += step) {
  const html = renderToStaticMarkup(<Frame2 f={f} />);
  const m = html.match(/[^"]{0,40}(NaN|Infinity)[^"]{0,20}/) ?? html.match(/ (r|rx|ry|width|height)="-[0-9.]+"/);
  if (m) {
    const id = shotAt2(f).id;
    (bad[id] = bad[id] ?? []).push(f);
    if (bad[id].length === 1) console.log(`f${f} ${id}: ...${m[0]}...`);
  }
}
for (const [id, fs] of Object.entries(bad)) console.log(id, fs.length, 'frames', fs[0], '-', fs[fs.length - 1]);
console.log('scanned', Math.ceil(N / step), 'frames;', Object.keys(bad).length, 'shots with invalid values;', SHOTS2.length, 'shots');

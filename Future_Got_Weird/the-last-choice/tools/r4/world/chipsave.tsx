import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {coneDir, ball3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/fx/core';
import {rnd, lerp, mul3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/kit/math';
import * as fs from 'node:fs';
const STEP = Number(process.env.STEP ?? 15);
const seen = new Map<string, any>();
let curShot = '';
(globalThis as any).__REC = () => {};
(globalThis as any).__CHIPOPT = (o: any) => { const k = `${o.key}|${o.t0}`; if (!seen.has(k)) seen.set(k, {...o, shot: curShot, t: undefined}); };
const tl = timeline();
for (const s of tl) {
  curShot = s.id;
  const n = Math.max(1, Math.round((s.end - s.start) * 30));
  for (let f = 0; f < n; f += STEP) {
    (globalThis as any).__FRAME = f;
    try { renderToStaticMarkup(React.createElement(s.C)); } catch (e: any) { console.error('ERR', s.id, f, String(e.message).slice(0, 100)); break; }
  }
}
fs.writeFileSync('chipopts.json', JSON.stringify([...seen.values()]));
console.log('emitters', seen.size);

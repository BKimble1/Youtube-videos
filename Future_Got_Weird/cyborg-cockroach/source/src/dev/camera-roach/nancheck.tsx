// every frame of S07/S08 rendered to markup: no NaN / Infinity, and the markup size (dev only)
import React from 'react';
// @ts-ignore (no @types/react-dom in this project)
import {renderToStaticMarkup} from 'react-dom/server';
import {S07} from '../../shots/S07';
import {S08} from '../../shots/S08';
let bad = 0;
for (let f = 315; f < 462; f++) {
  const el = f < 372 ? <S07 f={f} lf={f - 315} n={57} /> : <S08 f={f} lf={f - 372} n={90} />;
  const s = renderToStaticMarkup(el);
  if (/NaN|Infinity/.test(s)) {
    bad++;
    const i = s.search(/NaN|Infinity/);
    console.log('frame', f, s.slice(Math.max(0, i - 120), i + 40));
  }
  if (f % 15 === 0) console.log(f, (s.length / 1024).toFixed(0) + ' KB');
}
console.log('bad frames', bad);

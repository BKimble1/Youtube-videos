import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
const q = new URLSearchParams(location.search);
const a = Number(q.get('a') ?? 0), b = Number(q.get('b') ?? 0), step = Number(q.get('step') ?? 1), off = Number(q.get('off') ?? 0);
const tl = timeline();
const el = document.getElementById('root')!;
el.style.cssText = 'width:1920px;height:1080px;position:absolute;left:0;top:0';
const root = createRoot(el);
const draw = (fr: number) => {
  const sh = tl.find((s) => fr >= Math.round(s.start * 30) && fr < Math.round(s.end * 30))!;
  (globalThis as any).__FRAME = fr - Math.round(sh.start * 30);
  flushSync(() => root.render(<sh.C key={sh.id} />));
};
for (let f = a + off; f < b; f += step) draw(f);
draw(b);

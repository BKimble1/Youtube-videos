import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
const q = new URLSearchParams(location.search);
const frames = (q.get('f') ?? '0').split(',').map(Number);
const id = q.get('shot');
const tl = timeline();
if (id === 'LIST') { document.body.innerText = tl.map((s) => `${s.id} ${s.start} ${s.end}`).join('\n'); }
else {
  const sh = tl.find((s) => s.id === id)!;
  const from = Math.round(sh.start * 30);
  const el = document.getElementById('root')!;
  el.style.cssText = 'width:1920px;height:1080px;position:absolute;left:0;top:0';
  const root = createRoot(el);
  for (const fr of frames) { (globalThis as any).__FRAME = fr - from; flushSync(() => root.render(<sh.C key="same" />)); }
}

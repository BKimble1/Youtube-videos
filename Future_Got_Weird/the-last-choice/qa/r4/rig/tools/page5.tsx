import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
const q = new URLSearchParams(location.search);
(globalThis as any).NOREMOUNT = true;
const frames = (q.get('f') ?? '0').split(',').map(Number);
const tl = timeline();
const msgs = new Map<string, string>();
const orig = console.error;
console.error = (...args: any[]) => { const m = String(args[0]) + ' ' + args.slice(1).map(String).join(' '); const k = m.slice(0, 160); if (!msgs.has(k)) msgs.set(k, `${m.slice(0, 400)}`); };
const el = document.createElement('div'); document.body.appendChild(el); const root = createRoot(el);
for (const f of frames) {
  const sh = tl.find((s) => f >= Math.round(s.start * 30) && f < Math.round(s.end * 30));
  if (!sh) continue;
  (globalThis as any).__FRAME = f - Math.round(sh.start * 30);
  (globalThis as any).__CUR = `${sh.id}@${f}`;
  flushSync(() => root.render(<sh.C key={sh.id} />));
}
const pre = document.createElement('pre'); pre.id = 'result'; pre.textContent = msgs.size ? [...msgs.values()].join('\n----\n') : 'NO WARNINGS'; document.body.appendChild(pre);

import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {timeline} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/MainR2';
const q = new URLSearchParams(location.search);
const a = Number(q.get('a') ?? 0), b = Number(q.get('b') ?? 0);
(globalThis as any).NOREMOUNT = q.get('nr') === '1';
const tl = timeline();
const mk = (id: string) => { const el = document.createElement('div'); el.id = id; el.style.cssText = 'width:1920px;height:1080px;position:absolute;left:0;top:0'; document.body.appendChild(el); return el; };
const elA = mk('A'); const rootA = createRoot(elA);
const norm = (h: string) => h.replace(/r2vig\d+/g, 'V').replace(/ style=""/g, '');
const log: string[] = [];
const shotOf = (fr: number) => tl.find((s) => fr >= Math.round(s.start * 30) && fr < Math.round(s.end * 30))!;
for (let f = a; f <= b; f++) {
  const sh = shotOf(f);
  (globalThis as any).__FRAME = f - Math.round(sh.start * 30);
  flushSync(() => rootA.render(<sh.C key={sh.id} />));
  const elB = mk('B'); const rootB = createRoot(elB);
  flushSync(() => rootB.render(<sh.C key={sh.id} />));
  const ha = norm(elA.innerHTML), hb = norm(elB.innerHTML);
  rootB.unmount(); elB.remove();
  if (ha !== hb) {
    let i = 0; while (i < ha.length && ha[i] === hb[i]) i++;
    log.push(`FRAME ${f} DIFF at ${i}\nA: ${ha.slice(Math.max(0, i - 200), i + 300)}\nB: ${hb.slice(Math.max(0, i - 200), i + 300)}`);
    if (log.length >= 2) break;
  }
}
const pre = document.createElement('pre'); pre.id = 'result'; pre.textContent = log.length ? log.join('\n=====\n') : 'ALL SAME'; document.body.appendChild(pre);

// Caption keep-out check, every frame: the eel (centre ± radius) and the gill gap stay below KEEP_Y wherever a caption
// is showing (captions sit in the top band). Prints violations and the minimum clearance per shot.
//   npx esbuild tools/v4/keepout.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/k.js && node /tmp/k.js
import {EXT, extKeepOut} from '../../source/src/v4/shots/Exterior';
import {keepOut as kX} from '../../source/src/v4/shots/S3Xray';
import {keepOut as kS} from '../../source/src/v4/shots/S4Stomach';
import {keepOut as kG} from '../../source/src/v4/shots/S5Throat';
import {KEEP_Y, KeepOut, SHOTS} from '../../source/src/v4/timing';
import TL from '../../source/src/data/timeline.json';

const caps = (TL as any).captions as {show: number; hide: number}[];
const capOn = (t: number) => caps.some((c, k) => t >= (k === 0 ? 0 : c.show) && t < Math.max(c.hide, k < caps.length - 1 ? caps[k + 1].show : c.hide));
const ko = (id: string, t: number): KeepOut => {
  if (id === 'xray') return kX(t);
  if (id === 'stomach') return kS(t);
  if (id === 'throat') return kG(t);
  if (id === 'loop') return extKeepOut(EXT.swim(t));
  return extKeepOut(EXT[id](t));
};
const frames = (TL as any).frames as number;
const worst: Record<string, {min: number; at: number; what: string}> = {};
let bad = 0;
for (let f = 0; f < frames; f++) {
  const t = f / 30;
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
  const k = ko(sh.id, t);
  let m = 1e9, what = '';
  for (const e of k.eel) {
    if (e.x + e.r < 0 || e.x - e.r > 1080 || e.y + e.r < 0 || e.y - e.r > 1920) continue; // off screen
    const v = e.y - e.r - KEEP_Y;
    if (v < m) { m = v; what = 'eel'; }
  }
  for (const p of k.gap ?? []) {
    if (p.x < 0 || p.x > 1080) continue;
    const v = p.y - KEEP_Y;
    if (v < m) { m = v; what = 'gap'; }
  }
  const w = worst[sh.id];
  if (!w || m < w.min) worst[sh.id] = {min: m, at: t, what};
  if (m < 0 && capOn(t)) { bad++; if (bad < 40) console.log(`VIOLATION f${f} t=${t.toFixed(2)} ${sh.id} ${what} ${m.toFixed(0)} px into the band`); }
}
console.log(JSON.stringify(worst, null, 1));
console.log(bad ? `${bad} frames with the eel or gap in the caption band` : 'caption band clear on every frame');

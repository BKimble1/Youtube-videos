import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {makeView, project} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {b2Anchor} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/kit';
import {dirSpec} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/kit';
import {dirB} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/director';
import {CAM_B2} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/cams';
const mode = process.env.MODE ?? 'none';
console.log('mode', mode, ' mismatch px between the drawn contact (rig screen coords) and the TRUE projection of its world target');
for (let T = 12.4; T <= 16.7; T += 0.3) {
  const view = makeView(camPath(CAM_B2, T - 12.4, 0.6));
  const d = dirB(T);
  const w: any = d.world;
  let anchor: any = undefined;
  if (mode === 'hands') { const hs = [w.handL, w.handR].filter(Boolean); anchor = {x: hs.reduce((a: number, h: any) => a + h.x, 0) / hs.length, y: hs.reduce((a: number, h: any) => a + h.y, 0) / hs.length, z: hs.reduce((a: number, h: any) => a + h.z, 0) / hs.length}; }
  if (mode === 'mid') { const R0 = d.pos; const hs = [w.handL, w.handR, w.footL, w.footR, R0].filter(Boolean); anchor = {x: hs.reduce((a: number, h: any) => a + h.x, 0) / hs.length, y: hs.reduce((a: number, h: any) => a + h.y, 0) / hs.length, z: hs.reduce((a: number, h: any) => a + h.z, 0) / hs.length}; }
  if (mode === 'b2') anchor = b2Anchor(T);
  const R = figureRig(view, dirSpec(T, {anchor}));
  const r = R.rig;
  const mm = (tgt: any, p: any) => { if (!tgt) return NaN; const s = project(view, tgt); return Math.hypot(s.x - p.x, s.y - p.y); };
  const hL = mm(w.handL, r.wr[0]), hR = mm(w.handR, r.wr[1]), fL = mm(w.footL, r.ankle[0]), fR = mm(w.footR, r.ankle[1]);
  console.log(T.toFixed(2), 'k', R.F.k.toFixed(1), 'handL', hL.toFixed(0), 'handR', hR.toFixed(0), 'footL', fL.toFixed(0), 'footR', fR.toFixed(0));
}

// the release and the swim-away (T_REL - 0.3 .. +1.6 s, every frame): does the eel lie across the predator's FACE on
// screen? The face = the predator's body outline forward of the gill cover's rim (eye, cheek, jaw), plus the eye.
// Per config: frames with eel samples on the face (count of samples and the worst penetration), frames where the eel
// covers the eye, the head's screen position (in frame?), the eel's screen length (foreshortening) and the gap to the
// predator's outline at the end. Usage (from source/):
//   npx tsx ../tools/v4/face_clear.ts '[{"name":"cur"},{"name":"b","head":{"h0":[x,y,z]},"cam":{"rb0":21.2}}]'
import {basis, norm3} from '../../source/src/v4/three';
import {EXT, SWIM_CFG} from '../../source/src/v4/shots/Exterior';
import {SWIM_HEAD, T_REL} from '../../source/src/v4/escape';
import {eelScreen, N} from '../../source/src/v4/eelV4';
import {predGeom} from '../../source/src/v4/pred';

type P2 = {x: number; y: number};
const pts = (d: string): P2[] => {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const o: P2[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) o.push({x: n[i], y: n[i + 1]});
  return o;
};
const inside = (P: P2[], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i], b = P[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const baseCam = JSON.parse(JSON.stringify(SWIM_CFG));
const baseHead = JSON.parse(JSON.stringify(SWIM_HEAD));
const cfgs: any[] = JSON.parse(process.argv[2] || '[{"name":"current"}]');
const f0 = Math.round((T_REL - 0.3) * 30), f1 = Math.round((T_REL + 1.6) * 30);
for (const c of cfgs) {
  Object.assign(SWIM_CFG, JSON.parse(JSON.stringify(baseCam)), c.cam || {});
  Object.assign(SWIM_HEAD, JSON.parse(JSON.stringify(baseHead)), c.head || {});
  for (const k of ['h0', 'd1', 'd2', 'driftDir'] as const) (SWIM_HEAD as any)[k] = norm3((SWIM_HEAD as any)[k]);
  const faceFrames: string[] = [], capFrames: string[] = [], cutGaps: number[] = [];
  let eyeFrames = 0, headOff = 0, minLen = 1e9, endGap = 0, worstPen = 0;
  const trail: string[] = [];
  for (let f = f0; f <= f1; f++) {
    const t = f / 30;
    const s = EXT[t < 21.3 ? 'release' : 'swim'](t);
    const B = basis(s.cam);
    const g = predGeom(B, s.pose);
    const P = pts(g.outline);
    const rim = g.rim;
    const sc = eelScreen(B, s.eel!);
    // the face side of the rim: the side the eye is on (line through the rim's ends)
    let face = (x: number, y: number) => false;
    if (rim.length >= 2) {
      const a = rim[0], b = rim[rim.length - 1];
      const side = (x: number, y: number) => Math.sign((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x));
      const se = side(g.eye.x, g.eye.y);
      face = (x, y) => side(x, y) === se && inside(P, x, y);
    }
    let n = 0, pen = 0, onEye = false;
    // the eel counts once it is free (before T_REL its head is in the slit, on the rim by design)
    const from = t >= T_REL ? 0 : Math.max(0, Math.ceil((s.eel as any).crossI ?? 0) + 4);
    for (let i = from; i <= N; i++) {
      const p = sc.pts[i];
      if (face(p.x, p.y)) { n++; pen = Math.max(pen, sc.rad[i]); }
      if (Math.hypot(p.x - g.eye.x, p.y - g.eye.y) < sc.rad[i] + g.eye.r) onEye = true;
    }
    let top = 1e9;
    for (let i = 0; i <= N; i++) top = Math.min(top, sc.pts[i].y - sc.rad[i]);
    if (top < 500) capFrames.push(`${f}(${Math.round(top)})`);
    if (n > 0) faceFrames.push(`${f}(${n})`);
    if (onEye) eyeFrames++;
    worstPen = Math.max(worstPen, n);
    const h = sc.pts[0];
    if (h.x < 30 || h.x > 1050 || h.y < 500 || h.y > 1890) headOff++;
    let len = 0;
    for (let i = 1; i <= N; i++) len += Math.hypot(sc.pts[i].x - sc.pts[i - 1].x, sc.pts[i].y - sc.pts[i - 1].y);
    if (t > T_REL + 0.4) minLen = Math.min(minLen, len);
    if (f === f1 || (f >= Math.ceil(SWIM_CFG.k1 * 30) && f < Math.ceil(SWIM_CFG.k1 * 30) + 6)) {
      let gap = 1e9;
      for (let i = 0; i <= N; i += 2) {
        if (inside(P, sc.pts[i].x, sc.pts[i].y)) { gap = Math.min(gap, -sc.rad[i]); continue; }
        for (let k = 0; k < P.length; k += 3) gap = Math.min(gap, Math.hypot(P[k].x - sc.pts[i].x, P[k].y - sc.pts[i].y) - sc.rad[i]);
      }
      if (f === f1) endGap = gap; else cutGaps.push(Math.round(gap));
    }
    if ((f - f0) % 6 === 0) trail.push(`${f}:h(${Math.round(h.x)},${Math.round(h.y)})`);
  }
  console.log(`${c.name}: capBand ${capFrames.length} [${capFrames.join(' ')}] faceFrames ${faceFrames.length} [${faceFrames.join(' ')}] eyeFrames ${eyeFrames} headOff ${headOff} minLen ${Math.round(minLen)} endGap ${Math.round(endGap)} gapAfterCut [${cutGaps.join(' ')}]\n   ${trail.join(' ')}`);
}

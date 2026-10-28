// QC helper: for every frame, where the rider's head and feet land on screen (centre and radius in px at 1080x1920),
// written as JSON so crop sheets can be cut from the rendered MP4.
// usage: esbuild tools/qa_crops_v5.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/qc5.cjs && node /tmp/qc5.cjs out.json
import {writeFileSync} from 'fs';
import {pilotJoints, DIMS} from '../source/src/art/rig';
import {riderView5} from '../source/src/v5/shots5';
import {FPS, FRAMES} from '../source/src/story/time';
import {d3, s3} from '../source/src/eng/v3';
const out: unknown[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const v = riderView5(t);
  if (!v) {
    out.push({f, t, head: null, feet: null});
    continue;
  }
  const j = pilotJoints(v.st.B, v.st.pose);
  const inFront = d3(s3(j.Hc, v.L.pos), v.L.f) > 0.1;
  const h = v.L.p(j.Hc);
  const a = v.L.p(j.ankF), b = v.L.p(j.ankR);
  out.push({
    f, t,
    head: inFront ? {x: Math.round(h.x), y: Math.round(h.y), r: Math.round(DIMS.headR * 1.06 * h.k)} : null,
    feet: inFront ? {x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2), r: Math.round(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) / 2 + 0.25 * a.k)} : null,
  });
}
writeFileSync(process.argv[2], JSON.stringify(out));
console.log('frames', out.length);

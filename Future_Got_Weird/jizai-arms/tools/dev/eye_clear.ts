// Minimum distance from the camera eye to the wearer's body / pack / heads over a time range (pass-through check).
import {stateAt} from '../../source/src/film/Film';
import {proj, v3, s3, l3} from '../../source/src/r3/m3';
const [a, b] = [+(process.argv[2] ?? 0), +(process.argv[3] ?? 31)];
let worst = 1e9, wt = 0;
for (let f = Math.round(a * 30); f <= Math.round(b * 30); f++) {
  const t = f / 30;
  const st = stateAt(t);
  const P = proj(st.cam);
  const pts = [...st.wearers.map((w) => [v3(w.pose.pos.x, 120, w.pose.pos.z - 10), v3(w.pose.pos.x, 172, w.pose.pos.z)]).flat(), ...(st.people ?? []).map((p) => v3(p.pose.pos.x, 140, p.pose.pos.z))];
  for (const q of pts) {
    const d = l3(s3(P.eye, q));
    if (d < worst) { worst = d; wt = t; }
    if (d < 32) console.log('close', t.toFixed(3), d.toFixed(1));
  }
}
console.log('min eye distance', worst.toFixed(1), 'at', wt.toFixed(3));

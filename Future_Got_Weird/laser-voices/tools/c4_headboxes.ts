// For every frame: the listener's head on screen (centre, radius in px) in the shots that show her face up close, and
// her blink/lid value, for the sclera-pixel eye check (tools/c2_eyecheck.py).
import fs from 'node:fs';
import {FPS, FRAMES} from '../source/src/c4/lib';
import {listenerPose, L_G, L_H, operatorPose, O_G, O_H, passerbyAt} from '../source/src/c4/story';
import {camAt, shotAt} from '../source/src/c4/shots';
import {basis, cardOf, cardToWorld, proj} from '../source/src/c4/rig/geo';
import {joints4} from '../source/src/c4/rig/Crew';
import {B_L, B_O, B_P} from '../source/src/c4/castLV';
const out: object[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, sh = shotAt(t), s = sh.id;
  if (sh.micro || (t > 8.45 && t < 15.35)) continue;
  const b = basis(camAt(t));
  const heads = [
    ['L', B_L, listenerPose(t), L_G, L_H],
    ['O', B_O, operatorPose(t), O_G, O_H],
    ['P', B_P, passerbyAt(t).pose, passerbyAt(t).g, passerbyAt(t).h],
  ] as const;
  for (const [id, body, pose, g, h] of heads) {
    const j = joints4(body, pose);
    const c = proj(b, cardToWorld(g, h, j.Hc));
    if (c.z < 0.2) continue;
    const cd = cardOf(b, g, h);
    const r = body.R * cd.k;
    if (r < 40 || c.x < -r || c.x > 1080 + r || c.y < -r || c.y > 1920 + r) continue; // only faces big enough to judge
    out.push({f, s, id, x: +c.x.toFixed(1), y: +c.y.toFixed(1), r: +r.toFixed(1), phi: +(cd.phi + pose.hy).toFixed(1), lid: +Math.max(pose.face.blink, pose.face.lid, pose.face.squint).toFixed(3)});
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log('heads', out.length);

// V5 rig QA over every frame: IK reach (a limb asked to reach further than it can), ankles through the floor, her
// head into the panel while she hides, and the loop seam (state at the last frame vs frame 0, one frame on).
// usage: bundle with esbuild (platform node), then: node rig_qa_v5.cjs qa/v5/rig_qa.json
import fs from 'node:fs';
import {BODY_G, BODY_P} from '../source/src/v5/cast5';
import {joints4} from '../source/src/v5/Crew5';
import {cardToWorld} from '../source/src/v5/geo5';
import {DUR} from '../source/src/v5/layout5';
import {guardAt, herAt, shotAt} from '../source/src/v5/story5';

const FPS = 30, N = Math.round(DUR * FPS);
const issues: {t: number; shot: string; who: string; what: string; value: number}[] = [];
let worstLeg = {v: 0, t: 0}, worstArm = {v: 0, t: 0};
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  const shot = shotAt(t).id;
  for (const [who, c, b] of [['her', herAt(t), BODY_P], ['guard', guardAt(t), BODY_G]] as const) {
    const j = joints4(b, c.pose);
    if (j.short > worstLeg.v) worstLeg = {v: j.short, t};
    if (j.armShort > worstArm.v) worstArm = {v: j.armShort, t};
    if (j.short > 6) issues.push({t, shot, who, what: 'leg target out of reach (u)', value: +j.short.toFixed(1)});
    if (j.armShort > 10) issues.push({t, shot, who, what: 'hand target out of reach (u)', value: +j.armShort.toFixed(1)});
    for (const A of [j.AL, j.AR]) if (A.y < 8) issues.push({t, shot, who, what: 'ankle below the floor line (u)', value: +A.y.toFixed(1)});
    if (who === 'her' && c.sh && t > 2.4 && t < 23.95) {
      // head front vs the panel's back face, both in her card frame (the panel faces her forward axis)
      const headFront = j.Hc.z + b.R * 0.95;
      const back = c.sh.c.z - 5;
      if (headFront > back) issues.push({t, shot, who, what: 'head into the panel (u)', value: +(headFront - back).toFixed(1)});
    }
  }
}
// loop seam: compare the state one frame after the last frame with frame 0 (positions, metres)
const tl = (N - 1) / FPS, tn = tl + 1 / FPS;
const her0 = herAt(0), herN = herAt(tn - DUR + DUR); // the film clock wraps: tn is DUR exactly
const pos = (c: ReturnType<typeof herAt>) => cardToWorld(c.g, c.h, c.pose.pel);
const p0 = pos(her0), pN = pos(herN);
const g0 = pos(guardAt(0)), gN = pos(guardAt(tn));
const seam = {her_pelvis_gap_m: +Math.hypot(p0.x - pN.x, p0.y - pN.y, p0.z - pN.z).toFixed(4), guard_pelvis_gap_m: +Math.hypot(g0.x - gN.x, g0.y - gN.y, g0.z - gN.z).toFixed(4), note: 'state at t = DUR (one frame after the last) vs t = 0, both in chase coordinates'};
const byWhat: Record<string, number> = {};
issues.forEach((i) => (byWhat[`${i.who}: ${i.what}`] = (byWhat[`${i.who}: ${i.what}`] ?? 0) + 1));
fs.mkdirSync('qa/v5', {recursive: true});
fs.writeFileSync(process.argv[2], JSON.stringify({frames: N, worstLegShort_u: +worstLeg.v.toFixed(1), worstLegAt: +worstLeg.t.toFixed(2), worstArmShort_u: +worstArm.v.toFixed(1), worstArmAt: +worstArm.t.toFixed(2), counts: byWhat, seam, issues}, null, 1));
console.log(JSON.stringify({counts: byWhat, worstLeg, worstArm, seam}, null, 1));

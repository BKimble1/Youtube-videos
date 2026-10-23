// V4 footwork: every foot contact is an explicit plant (land time, lift time, floor position), so feet never slide
// while loaded; between plants the foot swings on an arc with a toe-off and heel strike.
export type Plant = {t0: number; t1: number; x: number; z: number};
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Foot at time t: floor position, height above the floor (m), toe pitch (deg, + = toe down) and contact flag. */
export const footAt = (plants: Plant[], t: number, lift = 0.14) => {
  if (!plants.length) return {x: 0, z: 0, y: 0, toe: 0, contact: true};
  if (t <= plants[0].t1) return {x: plants[0].x, z: plants[0].z, y: 0, toe: 0, contact: true};
  for (let i = 0; i < plants.length - 1; i++) {
    const a = plants[i], b = plants[i + 1];
    if (t <= b.t0) {
      if (t <= a.t1) return {x: a.x, z: a.z, y: 0, toe: 0, contact: true};
      const s = (t - a.t1) / (b.t0 - a.t1 || 1);
      const e = sm(s);
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      const h = Math.min(lift, 0.04 + d * 0.32) * Math.sin(Math.PI * Math.min(1, s * 1.08));
      // toe-off, then the toe lifts through the swing and the heel leads into the next contact
      const toe = s < 0.25 ? 38 * (1 - s / 0.25) : s > 0.75 ? -14 * ((s - 0.75) / 0.25) : -6 * Math.sin(((s - 0.25) / 0.5) * Math.PI);
      return {x: a.x + (b.x - a.x) * e, z: a.z + (b.z - a.z) * e, y: Math.max(0, h), toe: d > 0.05 ? toe : toe * d * 20, contact: false};
    }
    if (t <= b.t1) return {x: b.x, z: b.z, y: 0, toe: 0, contact: true};
  }
  const l = plants[plants.length - 1];
  return {x: l.x, z: l.z, y: 0, toe: 0, contact: true};
};

/** Running plants from a pelvis path: steps alternate feet every `ts` seconds while moving; each foot lands `lead`
 *  metres ahead of the pelvis (scaled with speed) and stays down for `contact` seconds. */
export const runPlants = (opt: {t0: number; t1: number; ts: number; phase: number; contact: number; zAt: (t: number) => number; vAt: (t: number) => number; x: number; half: number; lead: number; dirZ: number}) => {
  const L: Plant[] = [], R: Plant[] = [];
  let k = Math.ceil((opt.t0 - opt.phase) / opt.ts);
  for (;; k++) {
    const tl = opt.phase + k * opt.ts;
    if (tl > opt.t1) break;
    const v = opt.vAt(tl);
    if (v < 0.15) continue;
    const foot = (k % 2 + 2) % 2 === 0 ? L : R;
    const side = foot === L ? 1 : -1;
    foot.push({t0: tl, t1: tl + opt.contact * Math.min(1.3, 3 / Math.max(v, 1.5)), x: opt.x + side * opt.half * opt.dirZ, z: opt.zAt(tl) + opt.dirZ * opt.lead * Math.min(1, v / 3)});
  }
  return {L, R};
};

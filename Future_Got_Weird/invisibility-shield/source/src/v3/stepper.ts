// V3 procedural stepping. Given a character's pelvis path and heading over time, the feet are simulated once (at
// module load, deterministically) the way a body balances: a planted foot stays planted; when the pelvis has drifted
// so far from a foot's comfortable position that it would be off balance, that foot steps, landing where the body
// will be (velocity lead) by the end of the swing. Walking alternates feet with double support; at running speed the
// swings shorten and overlap into flight phases. Turns on the spot produce small pivot steps; stops settle the feet
// under the body. Forced steps (a brace, a shuffle) are executed exactly where they are written.
// The result is a list of plants per foot (gait.ts) that footState() evaluates at any time.
import {a3, m3, V3, v3} from '../v2/p3';
import {Plant} from './gait';

export type StepCfg = {
  path: (t: number) => V3; // pelvis ground point
  yaw: (t: number) => number;
  width: (t: number) => number; // half stance width
  stance?: (t: number) => {l: number; r: number}; // optional forward offset (m) of each foot's ideal position, e.g. a crouch stance
  t0: number; t1: number;
  init: {l: Plant; r: Plant};
  forced?: {foot: 'l' | 'r'; t0: number; t1: number; p: V3; yaw: number; h?: number}[];
  hold?: [number, number][]; // intervals with no automatic steps (e.g. while crouched still)
  thresh?: number; // drift (m) that triggers a step at walking speed
};

export const simulateSteps = (c: StepCfg) => {
  const dt = 1 / 240;
  const out: {l: Plant[]; r: Plant[]} = {l: [c.init.l], r: [c.init.r]};
  const busyUntil = {l: -Infinity, r: -Infinity};
  let last: 'l' | 'r' = 'l';
  const forced = [...(c.forced ?? [])].sort((a, b) => a.t0 - b.t0);
  const vel = (t: number) => {
    const a = c.path(t - 0.02), b = c.path(t + 0.02);
    return v3((b.x - a.x) / 0.04, 0, (b.z - a.z) / 0.04);
  };
  const ideal = (foot: 'l' | 'r', t: number, lead: number) => {
    const p = c.path(t), ya = c.yaw(t), vv = vel(t);
    const R = v3(Math.cos(ya), 0, -Math.sin(ya)), Fw = v3(Math.sin(ya), 0, Math.cos(ya));
    const sd = foot === 'r' ? 1 : -1;
    const st = c.stance ? c.stance(t) : {l: 0, r: 0};
    const off = a3(m3(R, sd * c.width(t)), m3(Fw, sd > 0 ? st.r : st.l));
    return {p: a3(a3(v3(p.x, 0, p.z), off), m3(vv, lead)), yaw: ya + sd * 0.08};
  };
  const held = (t: number) => (c.hold ?? []).some(([a, b]) => t >= a && t <= b);
  for (let t = c.t0; t <= c.t1; t += dt) {
    // forced steps
    while (forced.length && forced[0].t0 <= t) {
      const f = forced.shift()!;
      out[f.foot].push({t0: f.t0, t1: f.t1, p: f.p, yaw: f.yaw, h: f.h ?? 0.06});
      busyUntil[f.foot] = f.t1;
      last = f.foot;
    }
    if (held(t)) continue;
    const vv = vel(t);
    const sp = Math.hypot(vv.x, vv.z);
    const running = sp > 2.0;
    const swing = running ? Math.max(0.2, 0.3 - 0.02 * (sp - 2)) : Math.max(0.26, 0.42 - 0.07 * sp);
    for (const foot of ['l', 'r'] as const) {
      if (t < busyUntil[foot]) continue;
      const other = foot === 'l' ? 'r' : 'l';
      // walking: only one foot in the air at a time; running: the other foot may still be finishing its swing
      if (!running && t < busyUntil[other]) continue;
      if (running && t < busyUntil[other] - swing * 0.35) continue;
      const cur = out[foot][out[foot].length - 1];
      const lead = running ? 0.05 : 0.18;
      const now = ideal(foot, t, 0);
      const err = Math.hypot(cur.p.x - now.p.x, cur.p.z - now.p.z);
      let dy = Math.abs(((cur.yaw - now.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const thr = (c.thresh ?? 0.16) * (running ? 1.8 : 1) + 0.05 * sp;
      const need = err > thr || dy > 0.6;
      // alternate: the foot that stepped last waits unless it is much worse off
      if (!need) continue;
      if (foot === last && !(err > thr * 1.8 || dy > 1.0)) continue;
      const tl = t + swing;
      const tgt = ideal(foot, tl, lead);
      out[foot].push({t0: t, t1: tl, p: tgt.p, yaw: tgt.yaw, h: running ? 0.17 : 0.05 + 0.03 * Math.min(1.5, sp)});
      busyUntil[foot] = tl;
      last = foot;
      dy = 0;
      break;
    }
  }
  return out;
};

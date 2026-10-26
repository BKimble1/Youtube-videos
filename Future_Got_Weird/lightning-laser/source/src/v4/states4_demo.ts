// V4 beat F: the demonstration's discharge timing. The leader incepts at the rod tip at 19.55 (the leader crackle in
// the mix) and connects to the cloud at 21.85 (the crack), as in V3; in between it is retimed to the camera path
// (cams4_demo.ts): it emerges from the tip in the close view ("erupted UPWARD" 19.49-20.35), climbs the guided section
// while the camera follows it up the channel (20.45-21.4), and past the guided section it leaves the line and races
// through its branches to the cloud base as the move settles (21.4-21.85).
import {clamp, noise1} from '../dc/math';
import {ss} from '../lib';
import {boltLight} from '../world/site';
import {BOLT3} from '../v2/p3';
import {stream} from '../v2/shots3d';
import {EV} from '../v3/timeline3';
import {St} from '../v3/view3';
import {q5, Q5} from './cams4_demo';

/** leader length keys (time, m, m/s, m/s^2): about 7.7 m by "UPWARD" (20.0), 22 m as the follow starts, the end of
 *  the guided section (54 m) at 21.4, then the unguided part to the cloud (120 m) at the connection */
const S_KEYS: Q5[] = [
  [EV.demoInception, 0, 11, 6],
  [20.6, 22, 28, 15],
  [21.4, BOLT3.guidedS, 50, 120],
  [EV.demoConnect, BOLT3.total, 260, 0],
];
/** the leader length (m along BOLT3; -1 before inception, BOLT3.total from the connection on) */
export const demoS4 = (t: number) => (t < EV.demoInception ? -1 : t >= EV.demoConnect ? BOLT3.total : Math.max(0, Math.min(BOLT3.total, q5(t, S_KEYS))));

// ------------------------------------------------------------------ F's state (as V3's fSt, on the retimed leader)
const C0 = EV.demoConnect;
/** the whole bolt's light: the leader's core, then the connection flash with its re-strokes (boltLight), settling to
 *  a living afterglow (slowly fading, flickering gently) until the cut at 25.61; the scene light stays local */
export const fLight4 = (t: number) => {
  if (t < C0) return {core: 0.85, scene: 0.15};
  const dt = t - C0;
  const b = boltLight(dt, 1.5);
  const hold = (0.4 + 0.5 * Math.exp(-dt / 0.55)) * (0.86 + 0.14 * noise1(t * 5.5, 171)) * (1 - 0.15 * ss(t, 23.5, 25.6));
  return {core: Math.max(b.core, hold), scene: Math.max(b.scene, 0.1 + 0.12 * Math.exp(-dt / 1.0))};
};
export const fSt4 = (t: number): St => {
  const s = demoS4(t);
  const L = fLight4(t);
  return {
    s, core: s > 0 ? L.core : 0, flash: s > 0 ? Math.max(L.scene, 0.08) * clamp(s / 16) : 0, beam: 0.9, pulses: stream(t), channel: 0,
    // View3's TipCorona3 (a flat disc with sparks) is not used: in F's close view of the tip its disc edge shows; the
    // field at the tip is Demo4_fx's feathered corona glow and streamers
    tipCorona: 0,
    bracket: 0, label: 0,
  };
};

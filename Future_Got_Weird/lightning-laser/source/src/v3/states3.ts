// V3 discharge/scene states for the 3D views (see view3.tsx St). Packet clocks reuse V2's steady stream.
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {stream} from '../v2/shots3d';
import {St} from './view3';
import {demoLight, demoS, EV, LOOP0, openLight, openS, tau3} from './timeline3';

/** the opening event (A, and the end of H across the seam): the leader climbs the laser channel and connects */
export const openSt = (t: number): St => {
  const tau = tau3(t);
  const s = openS(tau);
  const L = openLight(tau);
  const pre = clamp((tau - (EV.fieldBuilds - 33.5)) / (LOOP0 - (EV.fieldBuilds - 33.5))); // field building at the tip
  return {
    s, core: s > 0 ? L.core : 0, flash: s > 0 ? Math.max(L.scene, 0.1) * clamp(s / 16) : 0, beam: 0.9, pulses: stream(tau), channel: 0.8,
    tipCorona: s > 0 ? clamp(1 - (s - 2) / 10) : tau < 0 ? pre * (0.5 + 0.5 * Math.abs(Math.sin(tau * 23))) : 0,
  };
};
/** the demonstration (F): leader from the tip at 19.55, connection 21.85, bracket at "one hundred sixty feet" */
export const demoSt = (t: number): St => {
  const s = demoS(t);
  const L = demoLight(t);
  const pre = ss(t, 19.1, EV.demoInception);
  return {
    s, core: s > 0 ? L.core : 0, flash: s > 0 ? Math.max(L.scene, 0.08) * clamp(s / 16) : 0, beam: 0.9, pulses: stream(t), channel: 0.85,
    tipCorona: s > 0 ? clamp(1 - (s - 2) / 10) : pre * (0.45 + 0.55 * Math.abs(Math.sin(t * 27))),
    bracket: ss(t, EV.wordOne, EV.wordSixty), label: ss(t, EV.wordSixty, EV.wordSixty + 0.2),
  };
};
export const quietSt = (t: number, channel = 0.7): St => ({s: -1, core: 0, flash: 0, beam: 0.9, pulses: stream(t), channel, tipCorona: 0});

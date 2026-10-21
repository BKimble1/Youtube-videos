// Monitor states for V5 (the V4 graphic and renderer, re-timed): path to the apple + planted branch; request, marker,
// one quicker pulse through the branch, apple -> hand on "switched"; the branch waiting.
import {clamp01, ramp} from '../v3/proj';
import {S4} from '../v4/Screen4';
import {SH5, W3} from './theme5';

export const screen5 = (t: number): S4 => {
  const s: S4 = {reveal: 1, plant: 1, branchLit: 0, req: 0, marker: 0, pulse: -1, revealDot: -1, swap: 0, land: 1};
  if (t < SH5.both) {
    s.reveal = ramp(t, SH5.screen + 0.05, SH5.screen + 0.45);
    s.revealDot = s.reveal > 0 && s.reveal < 1 ? s.reveal : -1;
    s.plant = clamp01((t - (W3.planted + 0.02)) / 0.45);
    s.branchLit = s.plant > 0 ? 1 - ramp(t, W3.planted + 0.55, W3.planted + 1.0) : 0;
    return s;
  }
  if (t < SH5.handMatch) {
    s.req = ramp(t, SH5.request + 0.02, SH5.request + 0.22);
    s.marker = ramp(t, W3.trigger3 - 0.04, W3.trigger3 + 0.18);
    const p = (t - (W3.request + 0.02)) / 0.85;
    s.pulse = p > 0 && p < 1 ? p : -1;
    s.branchLit = ramp(t, W3.request + 0.4, W3.request + 0.6);
    s.swap = clamp01((t - (W3.switched - 0.04)) / 0.2);
    s.land = clamp01((t - (W3.switched + 0.16)) / 0.16);
    return s;
  }
  s.branchLit = 0.3 * ramp(t, SH5.branch + 0.2, SH5.branch + 0.7);
  return s;
};

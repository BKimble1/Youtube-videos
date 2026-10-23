// Overlay and magnifier timing (s), from the measured words. Shared by the film and the sound-cue exporter.
import {w, we} from './world';

// ---- overlay timing (s)
export const OV = {
  hookPath: [0.8, 1.1, 3.55, 3.95] as const, // brief reveal in the hook, the same convention as later
  path: [w(29) - 0.05, w(29) + 0.35, 33.0, 33.6] as const, // from "But when water vapor..." to the end
  legend: [w(29) + 0.05, w(29) + 0.4, w(44), w(44) + 0.35] as const,
  section: [w(50) - 0.1, w(51) + 0.3, w(70) - 0.25, we(70) + 0.15] as const,
  sweep: [w(50) + 0.05, w(51) + 0.4, we(62) + 0.2, we(62) + 0.7] as const,
  sweep0: w(50) + 0.05,
  dimDraw: [w(67) - 0.05, we(69)] as const,
  dimOut: [w(71) - 0.25, w(71) + 0.3] as const,
  hitMark: [w(90) - 0.05, w(90) + 0.15, we(91) + 0.1, we(91) + 0.45] as const,
};
export const MAG = {open0: w(31) + 0.05, open1: w(33) + 0.15, close0: we(47) + 0.12, close1: w(48) + 0.3, packet0: w(36) - 0.45, hit: w(36) + 0.32, heat1: w(41), expand: w(43) - 0.05, waves: w(44) + 0.05};


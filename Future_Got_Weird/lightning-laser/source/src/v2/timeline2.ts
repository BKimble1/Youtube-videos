// Lightning Laser V2: shot boundaries (film seconds) on the unchanged V1 narration. Cuts sit on caption changes
// (source/src/data/timeline.json) or inside a phrase, never 1-3 frames off one.
//   H1 0.00 hook: the leader climbing the laser path from the tower tip (low angle, from the ridge)
//   H2 0.95 the laser on its terrace firing toward the storm, the tower and bolt beyond
//   H3 1.75 wide: the summit in the storm; the leader connects, the clouds light up
//   C1 2.52 shelter: the operator presses the fire control, the console responds
//   C2 3.40 close: the flash lights her face; she looks up; the bolt in her glasses
//   V1 4.31 illustration: the lead, a strike, the skeleton inside his outline, a quick jolt
//   M1 5.30 into the air: charged regions, molecules, a streamer that cannot get through
//   F1 7.81 the control panel: her finger on FIRE, the panel lights up
//   F2 8.95 inside the laser: the gain module and mirrors light as pulses fire
//   F3 9.67 the launch telescope's exit in the rain; pulses leave it; tilt up the beam
//   F4 10.39 the beam passes the top of the tower; follow one pulse in
//   M2 11.42 side-on: the pulse races through the air molecules
//   M3 12.33 close: electrons knocked off, ions recoil
//   M4 13.33 the channel heats and the air rushes outward, leaving a thin path
//   M5 15.83 a discharge runs along the thin path; track with it
//   M6 18.79 turn and pull out to the tower tip
//   T1 19.10 the rod tip: streamers, then the upward leader incepts (19.55)
//   T2 20.31 beneath the tower: the leader races up
//   T3 21.63 side view: it follows the laser path, connects, brightens
//   T4 23.20 wide comparison: the guided section, the 160+ ft bracket
//   R1 25.61 an ordinary house rod under the storm; a distant flash
//   R2 26.60 the rod's metal tip, close
//   R3 28.94 match to the tower tip: the laser-made extension above it
//   E1 30.74 the telescope firing up into the clouds, low
//   E2 31.88 back at the opening view: the field builds; a new leader incepts (loops into H1)
export const S = {H1: 0, H2: 0.95, H3: 1.75, C1: 2.52, C2: 3.4, V1: 4.31, M1: 5.3, F1: 7.81, F2: 8.95, F3: 9.67, F4: 10.39, M2: 11.42, M3: 12.33, M4: 13.33, M5: 15.83, M6: 18.79, T1: 19.1, T2: 20.31, T3: 21.63, T4: 23.2, R1: 25.61, R2: 26.6, R3: 28.94, E1: 30.74, E2: 31.88, END: 33.5};
export type ShotId = keyof typeof S;
const ORDER = Object.keys(S).filter((k) => k !== 'END') as ShotId[];
export const shotAt = (t: number): ShotId => {
  let cur: ShotId = 'H1';
  for (const k of ORDER) if (t >= S[k]) cur = k;
  return cur;
};
export const shotEnd = (id: ShotId) => {
  const i = ORDER.indexOf(id);
  return i + 1 < ORDER.length ? S[ORDER[i + 1]] : S.END;
};

// --------------------------------------------------------------- the two discharges (arc length in metres, BOLT3)
/** the loop leader on the loop clock tau (tau = t at the start, t - 33.5 at the end): incepts at the rod tip at
 *  tau = -0.6 (t = 32.9), is mid-way up the guided section at tau = 0, connects at tau = 1.75 (the wide shot) */
export const LOOP0 = -0.6;
export const LOOPC = 1.75;
export const loopS2 = (tau: number) => {
  if (tau < LOOP0) return -1;
  const x = Math.min(tau, LOOPC);
  return 30 + 45 * x - 5.27 * x * x + 5.11 * x * x * x;
};
/** the demonstration leader: incepts at 19.55 (T1), tops the guided section at about 21.05, connects at 21.85 */
export const DEMO0 = 19.55;
export const DEMOC = 21.85;
export const demoS2 = (t: number) => {
  const u = t - DEMO0;
  if (u < 0) return -1;
  const d = DEMOC - DEMO0;
  const x = Math.min(1, u / d);
  // gentle start, steady climb, faster at the end (s in metres, 0..120)
  return 120 * (0.55 * x + 0.1 * x * x + 0.35 * x * x * x);
};

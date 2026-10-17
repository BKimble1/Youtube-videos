// Section D4 event times (film seconds). PURE: only M is imported, so cues.ts (bundled for the mixer) can use these
// too. Every shot, every machine spec, every FX and every cue reads the same numbers.
import {M} from '../../timing';

export const EV = {
  // ---- D4-1 fighting retreat (149.86–154.50)
  start: M.P4,
  dirBackEnd: 150.8, // the Director backs off two steps, then turns and runs
  dirRun1: 150.8, dirRun1End: 152.75,
  w1Swing: 153.42, // W1's hammer blow lands on the plate: the crack goes right through
  dirRun2: 154.25, // he turns and runs for the ridge
  // ---- D4-2 the runner struck down, the tether disarmed (154.50–158.50)
  runnerHit: 155.86, // H5's backhand to the chest (dmgR2 runner from P4 + 6)
  runnerDown: 156.75, // on his back
  disarmGrab: 157.05, // H1's fist closes on the launcher
  disarmTear: 157.55, // the launcher is torn out of her hands
  launcherDrop: 158.1, // H1 throws it down
  // ---- D4-3 at the van (158.50–162.42)
  tabletDrop: 160.15,
  cablePull: 160.05, cablePullEnd: 160.95, // the tether pulls the cut length of cable off her reel
  flareDraw: 160.45, // the flare carrier draws his last flare
  dirLook: 160.85, // the Director looks round at them
  armUp: 161.75, // and raises his arm
  arrival: M.ARRIVAL, // 162.42: they surge
  // ---- D4-4 the last counterattack (162.42–166.41); W1–W3 are tableau wrecks 7501–7503 (EF/tableau.ts TB_WRECKS)
  w1Smash: 163.3, // the Director's plate into W1's chest (chest plate off; falls 163.4)
  club: 164.4, // the empty breaker swung into W2's arm (arm torn off; falls 164.5)
  cableThrow: 164.45, cableWrap: 164.78, cableHaul: 164.9, // the cable round W3's shins, hauled tight
  w3Drive: 165.02, // the Director drives into W3 (legs bound, it topples; 165.1)
  flareStrike: 165.22, flareThrow: 165.8, flareHit: 166.14, // the last flare into heavy 2's eye
  // ---- D4-5 heavy 2 staggers off a slab; the gap (166.41–170.40)
  stumble: M.LOCAL_WIN, // 166.41
  slabTip: 166.46,
  diveStart: 169.5, droneHit: 170.22, // a drone dives on the drone pilot (brow cut from REALIZE)
  // ---- D4-6 REALIZE (170.40–175.04)
  realize: M.REALIZE,
  // ---- D4-7 the ram winds up at the drone pilot; the Director runs (175.04–177.76)
  heavyGo: 170.7, // heavy 2 comes on again
  dirSees: 175.98, dirSprint: 176.35, dirPlant: 177.42, // his head snaps round to her; the sprint; the plant
  ramWind: M.STRIKE - 1.3,
  // ---- D4-8 STRIKE (177.76–179.30)
  strike: M.STRIKE,
  slam: 177.99, // his back hits the slab
  // ---- D4-9 SOFTEN (179.30–183.30)
  slide: M.SOFTEN, slideEnd: 180.65,
  grabTether: 180.4, grabDecoy: 181.0, grabFlares: 181.7, grabBreaker: 182.3, // = EF tableau TB_HOLDERS t0s
  heavyBack: 178.9, heavyBackEnd: 180.9, // heavy 2 takes one slow step back into its tableau stance (as the ram retracts)
  pilotUp: 183.7, pilotUpEnd: 185.45, // the drone pilot gets onto her hands and knees
  crawl: 186.4, // EF pilotSpec takes over (her crawl to him)
  // ---- D4-10 the ring holds (183.30–186.90)
  final: M.FINAL_HIT,
};

/** Shot boundaries (film s). */
export const SH = {
  d41: M.P4, d41b: 152.6, d42a: 154.5, d42b: 156.7, d43: 158.5, d43b: 160.75, d44a: M.ARRIVAL, d44b: 163.62, d44c: 164.72, d44d: 165.62,
  d45: M.LOCAL_WIN, d46a: M.REALIZE, d46b: 173.1, d47: 175.04, d47b: 175.85, d47c: 176.45,
  // D4-8 opens 0.31 s before STRIKE: the ram's last thrust, the contact (177.76) and his flight into the slab in one shot
  d48: 177.45, d49a: M.SOFTEN, d49b: 180.8, d410: M.B184, end: M.FINAL_HIT,
};

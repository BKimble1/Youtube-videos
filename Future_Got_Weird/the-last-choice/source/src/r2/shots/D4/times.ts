// Section D4 event times (film seconds). PURE: only M is imported, so cues.ts (bundled for the mixer) can use these
// too. Every shot, every machine spec, every FX and every cue reads the same numbers.
//
// R3: the defensible area shrinks from the crater rim (x ≈ 36) to the van (x ≈ 12) while each of the Crew's tactics is
// answered — the plate cracked through, the runner's flank cut off, the launcher torn away, the tablet and the
// controller dead, the breaker empty, the last flare spent — and the routes close (south and north at the ridge foot,
// then the crest behind them). ARRIVAL is one coordinated exchange in which the machines attack first; the local win
// lasts a breath; the machines adapt; the ring closes. Then the one protective choice, the blow, the loss of strength,
// and the surrender, each survivor in their own time while the machines secure the area.
import {M} from '../../timing';

export const EV = {
  // ---- D4-1 the fighting retreat; THE PLATE answered (149.86–154.50)
  start: M.P4,
  dirBackEnd: 150.8, // the Director backs off two steps facing them, then turns and runs
  dirRun1: 150.8, dirRun1End: 152.75,
  w1Swing: 153.42, // W1 runs him down: its hammer on the plate — the crack goes right through
  w1Press: 153.72, // W1 follows the displacement (two step-drags after him)
  w1Hook: 154.42, // its hook at his head as he turns away: he ducks under it running
  dirRun2: 154.25, // he turns and runs for the van
  // ---- D4-2 THE RUNNER's route and THE TETHER answered (154.50–158.50)
  runnerHit: 155.86, // H5 overtakes him, cuts across his path; its backhand to the chest (dmgR2 runner from P4 + 6)
  runnerDown: 156.75, // on his back
  disarmGrab: 157.05, // H1's fist closes on the launcher
  disarmTear: 157.55, // the launcher is torn out of her hands
  launcherDrop: 158.1, // H1 throws it down
  // ---- D4-3 at the van: spent; the routes close (158.50–162.42)
  blockersSet: 160.3, // units have stepped into the gaps at the ridge foot, north and south
  tabletDrop: 160.15,
  cablePull: 160.05, cablePullEnd: 160.95, // the tether pulls the cut length of cable off her reel
  flareDraw: 160.45, // the flare carrier draws his last flare (rig/crew.ts satchel: empty after this)
  dirLook: 160.85, // the Director looks round at them
  armUp: 161.75, // and raises his arm
  arrival: M.ARRIVAL, // 162.42: they surge
  // ---- D4-4 the last counterattack (162.42–166.41); W1–W3 are tableau wrecks 7501–7503 (EF/tableau.ts TB_WRECKS)
  w1Hammer: 163.12, // W1 swings first at the charging Director: he ducks under it
  w1Smash: 163.3, // his plate into W1's open chest (chest plate off; falls 163.4)
  w2Wind: 164.12, // W2 winds up at the decoy maker
  club: 164.4, // the breaker steps between them: the empty breaker swung into W2's raised arm (arm torn off; falls 164.5)
  cableThrow: 164.45, cableWrap: 164.78, cableHaul: 164.9, // W3 steps at the tether operator: the cable round its shins, hauled
  w3Drive: 165.02, // the Director drives into W3 (legs bound, it topples; 165.1)
  heavyAim: 164.7, // heavy 2 slows and levels its launcher at them
  flareStrike: 165.22, flareThrow: 165.8, flareHit: 166.14, // the last flare into heavy 2's eye: it never fires
  heavyStop: 165.95,
  // ---- D4-5 the local win, a breath; the machines adapt (166.41–170.40)
  stumble: M.LOCAL_WIN, // 166.41: blinded, heavy 2 steps back off a slab
  slabTip: 166.46,
  hopeEnd: 167.9, // a look between them — they did it — ends as the units come on again
  ringStep: 167.9, // the escort steps over the wrecks and closes
  heavyRecover: 168.4, // heavy 2 shakes off the flash: the eye clears
  heavyGo: 168.9, // it comes on again, slow, toward the van
  diveStart: 169.5, droneHit: 170.22, // a drone dives on the drone pilot (brow cut from REALIZE); the controller falls
  // ---- D4-6 REALIZE: the ring closes on every side; the crest behind them (170.40–175.04)
  realize: M.REALIZE,
  heavyOnHer: 174.9, // heavy 2's head turns to the drone pilot down by the van
  heavyArrive: 176.0, // it stops in front of the van: in ram range of her
  // ---- D4-7 the ram winds up at the drone pilot; the Director SEES and CHOOSES (175.04–177.76)
  dirSees: 175.98, dirChoose: 176.2, dirSprint: 176.35, dirPlant: 177.42, // the head snaps round; the decision; the sprint; the plant
  ramWind: M.STRIKE - 1.3,
  // ---- D4-8 STRIKE (177.45–179.30)
  strike: M.STRIKE,
  slam: 177.99, // his back hits the slab
  kneesGo: 178.35, // the legs fail under him: he sags against the slab
  // ---- D4-9 SOFTEN: he slides down and cannot rise; the surrender (179.30–183.30)
  slide: M.SOFTEN, slideEnd: 180.65,
  tryRise: 182.15, tryRiseEnd: 183.05, // one attempt to push himself up: the arm will not hold him
  grabTether: 180.4, grabDecoy: 181.0, grabFlares: 181.7, grabBreaker: 182.3, // = EF tableau TB_HOLDERS t0s
  heavyBack: 178.9, heavyBackEnd: 180.9, // heavy 2 takes one slow step back into its tableau stance (as the ram retracts)
  pilotUp: 183.7, pilotUpEnd: 185.45, // the drone pilot gets onto her hands and knees
  crawl: 186.4, // EF pilotSpec takes over (her crawl to him)
  // ---- D4-10 the ring holds (183.30–186.90)
  final: M.FINAL_HIT,
};

/** Shot boundaries (film s). */
export const SH = {
  d41: M.P4, d41b: 152.5, d42a: 154.5, d42b: 156.7, d43: 158.5, d43b: 160.75, d44a: M.ARRIVAL, d44b: 163.62, d44c: 164.72, d44d: 165.62,
  d45: M.LOCAL_WIN, d45b: 169.06, d46a: M.REALIZE, d46b: 172.6, d47: 175.04, d47b: 175.74, d47c: 176.45,
  // D4-8 opens 0.31 s before STRIKE: the ram's last thrust, the contact (177.76) and his flight into the slab in one shot
  d48: 177.45, d49a: M.SOFTEN, d49b: 180.8, d49c: 182.0, d410: M.B184, end: M.FINAL_HIT,
};

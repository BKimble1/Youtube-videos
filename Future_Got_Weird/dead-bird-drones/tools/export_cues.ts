// Export the picture's events and continuous signals for the mix (tools/make_audio.py places every effect from these,
// so sound and picture share one timeline). Signals at 100 Hz: the shot on screen, the visible drone's flap phase and
// on-screen size, the motor's speed, whether the drive is visible (cutaway open), the lab shell's height, the duck's
// below-water view, and the transition windows.
// build: source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --outfile=/tmp/claude-0/ec.js && node /tmp/claude-0/ec.js audio/cues.json
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {
  CUT, LAB, T, T_FLAP, labShellLift, labState, meadowState, openState, skyState, openReveal, skyReveal, duckCut, uLab, uOpen, uMeadow, uSky,
  MEADOW_T0, POND_T0, SKY_T0, OPEN_REVEAL, SKY_REVEAL,
} from '../source/src/story';
import {RATIO} from '../source/src/rig';
import {basis, proj} from '../source/src/three';
import {PADDLE_HZ} from '../source/src/art/duck';

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const shotAt = (t: number): string => {
  if (t < CUT.openToLab) return 'open';
  if (t < (CUT.labToMeadow[0] + CUT.labToMeadow[1]) / 2) return 'lab';
  if (t < (CUT.meadowToPond[0] + CUT.meadowToPond[1]) / 2) return 'meadow';
  if (t < (CUT.pondToSky[0] + CUT.pondToSky[1]) / 2) return 'pond';
  if (t < (CUT.loop[0] + CUT.loop[1]) / 2) return 'sky';
  return 'open';
};
const sig: Record<string, number[]> = {u: [], scale: [], motorHz: [], drive: [], lift: [], duckCut: [], vis: []};
const world: string[] = [];
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  const w = shotAt(t);
  world.push(w);
  let u = 0, scale = 0, motorHz = 0, drive = 0, vis = 0;
  // whether the drone is on screen (it flies out of the meadow frame and into the sky frame)
  const onScreen = (st: {cam: Parameters<typeof basis>[0]; F: {o: [number, number, number]}}) => {
    const p = proj(basis(st.cam), st.F.o);
    return p.x > -180 && p.x < 1260 ? 1 : 0;
  };
  if (w === 'open') {
    const tt = t >= CUT.loop[0] ? t - DUR : t;
    const s = openState(tt);
    u = uOpen(tt); scale = s.cam.scale; motorHz = RATIO / T_FLAP; drive = openReveal(tt) ? 1 : 0; vis = onScreen(s);
  } else if (w === 'lab') {
    const s = labState(t);
    u = uLab(t); scale = s.cam.scale; motorHz = (s.rate / (2 * Math.PI)) * RATIO; vis = 1;
    drive = t > LAB.cutOpen[0] && t < LAB.cutClose[1] ? 1 : 0;
  } else if (w === 'meadow') {
    const s = meadowState(t); u = uMeadow(t); scale = s.cam.scale; motorHz = RATIO / T_FLAP; vis = onScreen(s);
  } else if (w === 'sky') {
    const s = skyState(t); u = uSky(t); scale = s.cam.scale; motorHz = RATIO / T_FLAP; drive = skyReveal(t) ? 1 : 0; vis = onScreen(s);
  }
  sig.u.push(r3(u)); sig.scale.push(r3(scale)); sig.motorHz.push(r3(motorHz)); sig.drive.push(drive); sig.vis.push(vis);
  sig.lift.push(r3(t > CUT.openToLab && t < CUT.labToMeadow[1] ? labShellLift(t) : 0));
  sig.duckCut.push(r3(w === 'pond' ? duckCut(t) : 0));
}
const EV = {
  match: CUT.openToLab, spinEnd: LAB.spinEnd, motorOn: LAB.motorOn, liftA: LAB.lift[0], liftB: LAB.lift[1], seatA: LAB.seat[0], seatB: LAB.seat[1],
  cutOpenLab: LAB.cutOpen[0], cutCloseLab: LAB.cutClose[0], labToMeadow: CUT.labToMeadow, meadowToPond: CUT.meadowToPond, pondToSky: CUT.pondToSky, loop: CUT.loop,
  openReveal: [OPEN_REVEAL.first[0]], openClose: OPEN_REVEAL.close[0], skyOpen: SKY_REVEAL.open[0], skyClose: SKY_REVEAL.close[0],
  meadowT0: MEADOW_T0, pondT0: POND_T0, skyT0: SKY_T0, tFlap: T_FLAP,
};
// the duck's feet: two alternate power strokes per crank turn (art/duck.tsx duckCrank = 2 pi PADDLE_HZ t + 0.6)
const duckStrokes: number[] = [];
for (let k = 0; k < 400; k++) {
  const t = (k * Math.PI - 0.6) / (2 * Math.PI * PADDLE_HZ);
  if (t > POND_T0 && t < CUT.pondToSky[1]) duckStrokes.push(r3(t));
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, T, EV, world, duckStrokes, ...sig}));
console.log('cues ->', process.argv[2]);

// Laser Voices V4: the storyboard. 35 compositions, each a camera in the one world (or the molecular drawing), each
// introducing a new piece of the story. Every front-side view keeps the transmitter on screen right and the listener on
// screen left. Each shot also says which explanatory overlays it carries (the beam visualisation, the sound at her ear,
// the ear close-up detail); realistic views carry none.
import {lerpCam, lookAt} from './rig/draw';
import {add3, Cam, cardToWorld, v3, V3} from './rig/geo';
import {clamp, lerp, ss, ss5} from './lib';
import {BZ, EAR0, LENS, LX, PX} from './world';
import {earOf, O_G, passerbyAt} from './story';
import {joints4} from './rig/Crew';
import {B_P} from './castLV';

const L = (x: number, y: number, z: number) => v3(x, y, z);
/** the loop frame: close on her face from her front-left (the side the voice comes from) */
export const CAM_A: Cam = lookAt(L(0.34, 1.57, 2.82), L(1.3, 1.45, 4.05), 1760);
const CAM_A1: Cam = lookAt(L(0.4, 1.57, 2.88), L(1.16, 1.44, 4.06), 1830);
const hisHead = (t: number) => {
  const p = passerbyAt(t);
  return cardToWorld(p.g, p.h, joints4(B_P, p.pose).Hc);
};
const earCam = (t: number, back: number, f: number) => {
  const e = earOf(t);
  return lookAt(add3(e, L(-0.34 * back, 0.02, -0.3 * back)), add3(e, L(0.02, -0.01, 0.04)), f);
};
/** the clean elevation: from the front of the room, a long lens square to the lane */
const elev = (cx: number, cy: number, dist: number, width: number, ty = cy) => lookAt(L(cx, cy, BZ - dist), L(cx, ty, BZ), (1080 * dist) / width);
const push = (a: Cam, b: Cam, t: number, t0: number, t1: number) => lerpCam(a, b, ss(t, t0, t1));

/** beam visualisation for a shot: visibility, how far the front has travelled (0..1), the visible trail behind the front
 *  (m; undefined = the whole path) */
export type Viz = {vis: number; prog: number; tail?: number; bold?: number};
export type Shot = {
  id: string; t0: number; cam: (t: number) => Cam;
  viz?: (t: number) => Viz; rings?: boolean; earCU?: number; beamTop?: boolean; micro?: boolean;
};
const travel = (t: number, a: number, d: number) => clamp((t - a) / d);
const win = (t: number, a: number, b: number, fi = 0.12, fo = 0.15) => ss(t, a, a + fi) * (1 - ss(t, b - fo, b));

export const SHOTS: Shot[] = [
  // ---- 0-3 s: the hook
  {id: 'S01 hook', t0: 0, cam: (t) => push(CAM_A, CAM_A1, t, 0.05, 0.5)},
  {id: 'S02 ear level', t0: 0.5, rings: true, cam: (t) => lerpCam(earCam(t, 1.15, 1550), earCam(t, 1.0, 1700), ss(t, 0.5, 0.94))},
  {id: 'S03 the laser', t0: 0.94, beamTop: true, viz: (t) => ({vis: win(t, 1.05, 1.9), prog: travel(t, 1.1, 0.7), tail: 0.5, bold: 2}),
    cam: (t) => push(lookAt(L(LENS.x + 0.6, 1.27, BZ - 0.52), L(LENS.x - 0.05, 1.34, BZ + 0.1), 1450), lookAt(L(LENS.x + 0.46, 1.29, BZ - 0.4), L(LENS.x - 0.03, 1.35, BZ + 0.08), 1650), t, 0.94, 1.9)},
  {id: 'S04 the distance', t0: 1.9, rings: true, viz: (t) => ({vis: win(t, 1.95, 2.85), prog: travel(t, 2.0, 0.44), bold: 2.4}),
    cam: (t) => push(elev(-0.2, 1.15, 7.6, 4.9, 1.0), elev(-0.15, 1.15, 7.2, 4.6, 1.0), t, 1.9, 2.85)},
  // ---- 3-7 s: nobody else hears it
  {id: 'S05 contrast', t0: 2.85, cam: (t) => push(lookAt(L(1.6, 1.5, 2.5), L(1.62, 1.44, 3.95), 1500), lookAt(L(1.6, 1.5, 2.66), L(1.6, 1.45, 3.95), 1620), t, 2.85, 3.7)},
  {id: 'S06 bystander', t0: 3.7, cam: (t) => push(lookAt(L(1.5, 1.5, 2.85), L(2.0, 1.4, 3.88), 1350), lookAt(L(1.53, 1.5, 2.95), L(2.0, 1.41, 3.88), 1450), t, 3.7, 4.4)},
  {id: 'S07 only her', t0: 4.4, rings: true, viz: (t) => ({vis: win(t, 4.4, 5.1, 0.05), prog: 1, bold: 2}),
    cam: (t) => push(elev(1.5, 1.4, 6.2, 2.9, 1.3), elev(1.45, 1.4, 6.0, 2.7, 1.3), t, 4.4, 5.1)},
  {id: 'S08 tap', t0: 5.1, cam: (t) => {
    const e = earOf(t);
    return push(lookAt(add3(e, L(-0.62, 0.06, -0.78)), add3(e, L(0.18, -0.06, 0.02)), 1500), lookAt(add3(e, L(-0.56, 0.05, -0.7)), add3(e, L(0.14, -0.05, 0.02)), 1580), t, 5.1, 6.3);
  }},
  {id: 'S09 empty ear', t0: 6.3, earCU: 1, cam: (t) => {
    const e = earOf(t);
    return push(lookAt(add3(e, L(-0.32, 0.02, -0.27)), add3(e, L(0.03, -0.01, 0.02)), 1500), lookAt(add3(e, L(-0.29, 0.02, -0.25)), add3(e, L(0.03, -0.01, 0.02)), 1650), t, 6.3, 7.2);
  }},
  // ---- 7-9 s: the invisible beam: follow one illustrated light packet from the mirror to the air at her ear
  {id: 'S10 the path', t0: 7.2, viz: (t) => ({vis: win(t, 7.25, 9.0, 0.1, 0.4), prog: travel(t, 7.3, 1.05), tail: lerp(2.4, 0.35, ss(t, 7.75, 8.05)), bold: 3.2}),
    cam: (t) => {
      // from the front, tracking the illustrated packet across the room from the transmitter to her ear
      const xp = lerp(LENS.x, EAR0.x, travel(t, 7.3, 1.05));
      const along = lookAt(L(xp - 0.05, 1.48, BZ - 1.75), L(xp + 0.12, 1.36, BZ), 1150);
      const e = earOf(Math.min(t, 8.0));
      const inAir = lookAt(add3(e, L(-0.26, 0.01, -0.26)), add3(e, L(-0.06, 0, -0.02)), 2700);
      return lerpCam(along, inAir, ss5(t, 8.3, 9.2));
    }},
  // ---- 9-15 s: the molecular sequence (its own camera)
  {id: 'S11-17 molecules', t0: 8.9, micro: true, cam: () => lookAt(add3(EAR0, L(-0.26, 0.01, -0.26)), add3(EAR0, L(-0.06, 0, -0.02)), 2700)},
  // ---- 15-20 s: the laser's controlled action
  {id: 'S18 apparatus', t0: 15.0, beamTop: true, viz: (t) => ({vis: win(t, 15.1, 16.2, 0.2, 0.05), prog: 1, tail: 0.9}),
    cam: (t) => push(lookAt(L(LENS.x + 0.42, 1.52, BZ - 0.66), L(LENS.x - 0.01, 1.33, BZ + 0.16), 1750), lookAt(L(LENS.x + 0.36, 1.5, BZ - 0.58), L(LENS.x - 0.01, 1.34, BZ + 0.15), 1950), t, 15.0, 16.2)},
  {id: 'S19 side view: the sweep', t0: 16.2, viz: () => ({vis: 1, prog: 1, bold: 3.2}), rings: false,
    cam: (t) => push(elev(-0.2, 1.36, 5.6, 2.85, 1.3), elev(-0.18, 1.36, 5.4, 2.75, 1.3), t, 16.2, 17.2)},
  {id: 'S20 where it converges', t0: 17.2, rings: true, viz: () => ({vis: 1, prog: 1, bold: 1.6}),
    cam: (t) => push(elev(LX - 0.45, 1.4, 3.0, 1.3), elev(LX - 0.4, 1.4, 2.8, 1.15), t, 17.2, 18.6)},
  {id: 'S21 she hears it', t0: 18.6, cam: (t) => push(lookAt(L(1.78, 1.5, 2.85), L(1.15, 1.42, 4.05), 1700), lookAt(L(1.72, 1.5, 2.95), L(1.15, 1.4, 4.05), 1820), t, 18.6, 20.0)},
  // ---- 20-23 s: the demonstration
  {id: 'S22 press', t0: 20.0, cam: (t) => {
    const tA = L(O_G.x + 0.35, 1.12, BZ + 0.18), tB = L(O_G.x + 0.4, 1.1, BZ + 0.16);
    const far = (p0: V3, tg: V3, k: number) => L(tg.x + (p0.x - tg.x) * k, tg.y + (p0.y - tg.y) * k, tg.z + (p0.z - tg.z) * k);
    return push(lookAt(far(L(LENS.x + 0.3, 1.2, BZ - 0.62), tA, 2.6), tA, 2700), lookAt(far(L(LENS.x + 0.25, 1.2, BZ - 0.52), tB, 2.6), tB, 3000), t, 20.0, 20.75);
  }},
  {id: 'S23 it fires', t0: 20.75, beamTop: true, viz: (t) => ({vis: win(t, 20.8, 21.75, 0.05, 0.1), prog: travel(t, 20.85, 0.9), tail: 0.6, bold: 2}),
    cam: (t) => push(lookAt(L(LENS.x - 0.5, 1.52, BZ - 0.24), L(EAR0.x, 1.35, BZ + 0.02), 1350), lookAt(L(LENS.x - 0.4, 1.5, BZ - 0.22), L(EAR0.x, 1.36, BZ + 0.02), 1480), t, 20.75, 21.75)},
  {id: 'S24 eight feet', t0: 21.75, rings: true, viz: (t) => ({vis: win(t, 21.75, 23.35, 0.05, 0.3), prog: travel(t, 21.75, 0.68), tail: 0.6, bold: 2.4}),
    cam: (t) => push(lookAt(L(-0.2, 2.2, 1.35), L(-0.2, 0.92, 4.2), 950), lookAt(L(0.1, 2.0, 1.75), L(0.3, 1.0, 4.15), 1000), t, 21.75, 23.35)},
  // ---- 23-27 s: someone walks between you and the laser
  {id: 'S25 approach (side)', t0: 23.35, viz: (t) => ({vis: win(t, 23.35, 24.4, 0.1, 0.05) * 0.8, prog: 1, bold: 1.8}), cam: (t) => {
    // her on the left, the transmitter on the right, the path between them; he comes down the room toward it
    return push(lookAt(L(1.2, 1.5, 1.7), L(-0.4, 1.1, 4.9), 1050), lookAt(L(1.15, 1.5, 1.82), L(-0.4, 1.1, 4.85), 1110), t, 23.35, 24.4);
  }},
  {id: 'S26 the step', t0: 24.4, cam: (t) => {
    const h = hisHead(t);
    return lookAt(L(h.x + 0.95, 1.25, h.z - 1.65), L(h.x - 0.05, 0.95, h.z), 1250);
  }},
  {id: 'S27 aligned', t0: 25.25, viz: (t) => ({vis: win(t, 25.25, 25.9, 0.1, 0.05), prog: 1, bold: 1.8}),
    cam: (t) => push(lookAt(L(LENS.x - 0.6, 1.68, BZ - 0.3), L(EAR0.x - 0.4, 1.3, BZ), 1150), lookAt(L(LENS.x - 0.5, 1.66, BZ - 0.28), L(EAR0.x - 0.4, 1.3, BZ), 1250), t, 25.25, 25.85)},
  // ---- 26-31 s: the voice stops
  {id: 'S28 the sound at her ear', t0: 25.85, rings: true, cam: (t) => lerpCam(earCam(t, 1.1, 1600), earCam(t, 1.0, 1700), ss(t, 25.85, 26.75))},
  {id: 'S29 silence', t0: 26.75, cam: (t) => push(lookAt(L(0.42, 1.54, 2.98), L(1.28, 1.43, 4.05), 1800), lookAt(L(0.48, 1.54, 3.08), L(1.27, 1.43, 4.05), 1950), t, 26.75, 27.9)},
  {id: 'S30 he cannot hear it', t0: 27.9, viz: (t) => ({vis: win(t, 27.95, 29.4, 0.15, 0.05), prog: 1, bold: 1.8}),
    cam: (t) => push(lookAt(L(-1.25, 1.52, 2.85), L(PX + 0.2, 1.36, BZ + 0.05), 1300), lookAt(L(-1.15, 1.52, 2.92), L(PX + 0.24, 1.36, BZ + 0.05), 1400), t, 27.9, 29.4)},
  {id: 'S31 blocking it', t0: 29.4, viz: (t) => ({vis: win(t, 29.4, 30.7, 0.05, 0.05), prog: 1, bold: 2.2}),
    cam: (t) => push(elev(-0.1, 1.3, 6.2, 3.4, 1.15), elev(-0.1, 1.3, 6.0, 3.2, 1.15), t, 29.4, 30.7)},
  // ---- 31-34 s: he moves; it comes back; the loop
  {id: 'S32 he moves', t0: 30.7, viz: (t) => ({vis: win(t, 31.0, 31.95, 0.1, 0.05), prog: 1, bold: 1.8}),
    cam: (t) => {
      const h = hisHead(t);
      return push(lookAt(L(0.35, 1.62, 1.95), L(0.15, 1.3, 4.4), 1000), lookAt(L(0.4, 1.62, 2.05), L(lerp(0.15, h.x + 0.6, 0.4), 1.3, 4.5), 1040), t, 30.7, 31.95);
    }},
  {id: 'S33 it returns', t0: 31.95, rings: true, cam: (t) => lerpCam(earCam(t, 1.0, 1700), earCam(t, 1.12, 1600), ss(t, 31.95, 32.5))},
  {id: 'S34 final', t0: 32.5, cam: () => CAM_A},
];
export const shotIndex = (t: number) => {
  let i = 0;
  while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].t0) i++;
  return i;
};
export const shotAt = (t: number) => SHOTS[shotIndex(t)];
export const camAt = (t: number) => shotAt(t).cam(t);
export const CUT = {micro: 8.9, ret: 15.0};
export {LX, PX};

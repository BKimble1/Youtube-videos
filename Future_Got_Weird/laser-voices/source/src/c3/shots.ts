// Laser Voices V3: the shot list. Every room shot is a camera in the one world; every camera move has a job (follow
// her reaction, reveal the transmitter, go to the ear, follow the beam back, track the walker). Front-side cameras
// keep the transmitter on screen right and the listener on screen left throughout.
import {lerpCam, lookAt} from './rig/draw';
import {add3, Cam, cardToWorld, v3, V3} from './rig/geo';
import {clamp, lerp, ss, ss5} from './lib';
import {BZ, EAR0, LENS, LX, PX} from './world';
import {earOf, O_G, passerbyAt} from './story';
import {joints4} from './rig/Crew';
import {B_P} from './castLV';

export const CUT = {two: 2.75, ear: 4.95, micro: 8.9, ret: 15.0, mirror: 16.3, track: 17.8, press: 20.0, wide8: 21.3, walk: 23.3, stop: 26.25, block: 27.9, move: 30.7, final: 32.0};
export type ShotId = 'open' | 'two' | 'ear' | 'micro' | 'ret' | 'mirror' | 'track' | 'press' | 'wide8' | 'walk' | 'stop' | 'block' | 'move' | 'final';
export const shotAt = (t: number): ShotId => {
  const c = CUT;
  if (t < c.two) return 'open';
  if (t < c.ear) return 'two';
  if (t < c.micro) return 'ear';
  if (t < c.ret) return 'micro';
  if (t < c.mirror) return 'ret';
  if (t < c.track) return 'mirror';
  if (t < c.press) return 'track';
  if (t < c.wide8) return 'press';
  if (t < c.walk) return 'wide8';
  if (t < c.stop) return 'walk';
  if (t < c.block) return 'stop';
  if (t < c.move) return 'block';
  if (t < c.final) return 'move';
  return 'final';
};
const L = (x: number, y: number, z: number) => v3(x, y, z);
const HEADC = L(LX, 1.46, BZ);
/** the loop frame: close on her face from her front-left (the side the voice comes from) */
export const CAM_A: Cam = lookAt(L(0.34, 1.57, 2.82), L(1.3, 1.45, 4.05), 1760);
/** the end of the hook's follow: the camera has eased toward the side she turned to */
const CAM_A1: Cam = lookAt(L(0.42, 1.57, 2.9), L(1.12, 1.44, 4.06), 1840);
const hisHead = (t: number) => {
  const p = passerbyAt(t);
  return cardToWorld(p.g, p.h, joints4(B_P, p.pose).Hc);
};
/** the reveal: one move across the front of her, the aim swinging from her face to where she is looking, until the
 *  three layers line up: her friend in the foreground (texting, hearing nothing), her, and across the lab the
 *  transmitter and its operator */
const REVEAL_END = lookAt(L(2.95, 1.85, 2.95), L(-0.8, 1.3, 4.3), 1250);
const revealCam = (u: number): Cam => {
  const k = ss5(u, 0, 1);
  const a = CAM_A1.pos, c = REVEAL_END.pos, mid = L(1.75, 1.7, 2.45);
  const q = (x: number, y: number, z: number) => (1 - k) * (1 - k) * x + 2 * (1 - k) * k * y + k * k * z;
  const pos = L(q(a.x, mid.x, c.x), q(a.y, mid.y, c.y), q(a.z, mid.z, c.z));
  const ka = ss(u, 0.1, 0.95);
  const tgt = L(lerp(1.12, -0.8, ka), lerp(1.44, 1.3, ka), lerp(4.06, 4.3, ka));
  return lookAt(pos, tgt, lerp(1840, 1250, ss(u, 0.0, 0.8)));
};
export const camAt = (t: number, s: ShotId = shotAt(t)): Cam => {
  const c = CUT;
  switch (s) {
    case 'open':
      if (t < 1.0) return lerpCam(CAM_A, CAM_A1, ss(t, 0.05, 0.95));
      return revealCam((t - 1.0) / (c.two - 1.0));
    case 'final':
      return CAM_A;
    case 'two': {
      // the two of them in profile, facing each other: her (hearing it) and him (hearing nothing)
      const a = lookAt(L(1.6, 1.5, 2.5), L(1.62, 1.44, 3.95), 1500);
      const b = lookAt(L(1.6, 1.5, 2.66), L(1.6, 1.45, 3.95), 1620);
      return lerpCam(a, b, ss(t, c.two, c.ear));
    }
    case 'ear': {
      // her face and hand as she taps her bare ear; then round to look along the beam's path into her ear (the
      // path shows itself and dissolves: invisible); then in to the air beside the ear (micro)
      const e = earOf(Math.min(t, 8.0));
      const a = lookAt(add3(e, L(-0.62, 0.06, -0.78)), add3(e, L(0.18, -0.06, 0.02)), 1500);
      const a2 = lookAt(add3(e, L(-0.55, 0.05, -0.7)), add3(e, L(0.14, -0.05, 0.02)), 1580);
      const side = lookAt(L(1.28, 1.5, 2.88), L(0.5, 1.37, 4.0), 1250);
      const side2 = lookAt(L(1.18, 1.47, 3.05), L(0.62, 1.37, 4.0), 1350);
      const d = lookAt(add3(e, L(-0.26, 0.01, -0.26)), add3(e, L(-0.06, 0, -0.02)), 2700);
      if (t < 6.25) return lerpCam(a, a2, ss(t, c.ear, 6.25));
      if (t < 8.05) return lerpCam(lerpCam(a2, side, ss5(t, 6.25, 6.95)), side2, ss(t, 6.95, 8.05));
      return lerpCam(side2, d, ss5(t, 8.05, c.micro + 0.35));
    }
    case 'micro':
      return lookAt(add3(EAR0, L(-0.26, 0.01, -0.26)), add3(EAR0, L(-0.06, 0, -0.02)), 2700);
    case 'ret': {
      // out of the ear (the same move reversed), then along the path to the transmitter
      const e = earOf(t);
      const d = lookAt(add3(e, L(-0.26, 0.01, -0.26)), add3(e, L(-0.06, 0, -0.02)), 2700);
      // out to the side view along the path (the same view that showed the beam), then along the path to the bench
      const m = lookAt(L(1.18, 1.47, 3.05), L(0.62, 1.37, 4.0), 1350);
      const f = lookAt(L(-0.75, 1.6, 3.25), L(LENS.x, 1.33, BZ + 0.12), 1550);
      if (t < 15.45) return lerpCam(d, m, ss5(t, c.ret, 15.45));
      return lerpCam(m, f, ss5(t, 15.45, c.mirror));
    }
    case 'mirror': {
      // straight down on the bench: the module firing into the mirror; the mirror turning (a line that pivots) and
      // the beam it sends out across the bench sweeping with it
      const a = lookAt(L(LENS.x + 0.07, 1.98, BZ - 0.1), L(LENS.x - 0.0, 1.32, BZ + 0.1), 2200);
      const b = lookAt(L(LENS.x + 0.05, 1.94, BZ - 0.08), L(LENS.x + 0.01, 1.32, BZ + 0.08), 2500);
      return lerpCam(a, b, ss(t, c.mirror, c.track));
    }
    case 'track': {
      // from beside the transmitter down the swept beam to her (the sound gathers where the sweep converges)
      const a = lookAt(L(LENS.x + 0.35, 1.56, BZ - 0.42), L(EAR0.x, 1.36, BZ), 1250);
      const b = lookAt(L(0.4, 1.52, 3.32), L(LX - 0.05, 1.42, BZ), 1500);
      return lerpCam(a, b, ss5(t, c.track + 0.1, 19.55));
    }
    case 'press': {
      // the operator at the bench (from the listener's side), the button in the foreground: she presses it
      // a long lens from further off: the Crew characters are flat cards, and a long lens keeps a hand reaching
      // forward to the button where it is (a near camera would draw it up at her chest)
      const tA = L(O_G.x + 0.35, 1.12, BZ + 0.18), tB = L(O_G.x + 0.4, 1.1, BZ + 0.16);
      const far = (p0: V3, tg: V3, k: number) => L(tg.x + (p0.x - tg.x) * k, tg.y + (p0.y - tg.y) * k, tg.z + (p0.z - tg.z) * k);
      const a = lookAt(far(L(LENS.x + 0.3, 1.2, BZ - 0.62), tA, 2.6), tA, 2700);
      const b = lookAt(far(L(LENS.x + 0.25, 1.2, BZ - 0.52), tB, 2.6), tB, 3000);
      return lerpCam(a, b, ss(t, c.press, 20.6));
    }
    case 'wide8': {
      // high over the lane: the separation, the pulse crossing the 8 ft and the ticks lighting; then in on her
      const a = lookAt(L(-0.2, 2.2, 1.35), L(-0.2, 0.92, 4.2), 950);
      const b = lookAt(L(0.75, 1.7, 2.35), L(1.35, 1.32, 4.0), 1150);
      return lerpCam(a, b, ss5(t, 22.5, c.walk));
    }
    case 'walk': {
      // following him as he sets off and passes in front of her; easing back so that as he steps into the path all
      // three marks read: her (left), him (centre), the transmitter (right)
      const h = hisHead(Math.min(t, 26.6));
      const track = lookAt(L(h.x + 0.3, 1.5, Math.min(h.z - 1.65, 2.25)), L(h.x - 0.1, h.y - 0.12, h.z), 1200);
      const wide = lookAt(L(0.55, 1.85, 1.4), L(-0.25, 1.2, 4.05), 920);
      return lerpCam(track, wide, ss5(t, 24.9, 25.9));
    }
    case 'stop': {
      const a = lookAt(L(0.42, 1.54, 2.98), L(1.28, 1.43, 4.05), 1800);
      const b = lookAt(L(0.48, 1.54, 3.08), L(1.27, 1.43, 4.05), 1950);
      return lerpCam(a, b, ss(t, c.stop, c.block));
    }
    case 'block': {
      // him, oblivious in the path, from the transmitter's side: the beam ends on his head; she is beyond him
      const a = lookAt(L(-1.25, 1.52, 2.85), L(PX + 0.2, 1.36, BZ + 0.05), 1300);
      const b = lookAt(L(-1.1, 1.52, 2.95), L(PX + 0.25, 1.36, BZ + 0.05), 1420);
      return lerpCam(a, b, ss(t, c.block, c.move));
    }
    case 'move': {
      const h = hisHead(t);
      const a = lookAt(L(0.35, 1.62, 1.95), L(0.15, 1.3, 4.4), 1000);
      const b = lookAt(L(0.4, 1.62, 2.05), L(lerp(0.15, h.x + 0.6, 0.4), 1.3, 4.5), 1040);
      return lerpCam(a, b, ss(t, c.move, c.final));
    }
  }
  return CAM_A;
};
export {clamp, PX};

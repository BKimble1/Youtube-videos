// Laser Voices Rebuild V2: the shot list. Every room shot is a camera in the one world; the cut points sit on the
// narration (see production/REBUILD_V2_SHOT_PLAN.md).
import {lerpCam, lookAt} from './rig/draw';
import {add3, Cam, v3, V3} from './rig/geo';
import {ss, ss5} from './lib';
import {BZ, EAR0, EM, LENS, LX, PX} from './world';
import {earOf, passerbyAt} from './story';
import {joints4} from './rig/Crew';
import {cardToWorld} from './rig/geo';
import {B_P} from './castLV';

export const CUT = {s2: 1.0, s3: 2.75, tap: 4.95, s4: 6.0, micro: 8.9, optics: 15.0, s7: 17.8, demo: 20.0, s8: 21.55, s9: 23.3, s10: 26.75, s11: 27.9, s12: 30.7, s13: 32.0};
export type ShotId = 'hook' | 'ots' | 'two' | 'tap' | 'demo' | 'ear' | 'micro' | 'optics' | 'aim' | 'wide' | 'walk' | 'stop' | 'block' | 'out' | 'final';
export const shotAt = (t: number): ShotId => {
  const c = CUT;
  if (t < c.s2) return 'hook';
  if (t < c.s3) return 'ots';
  if (t < c.tap) return 'two';
  if (t < c.s4) return 'tap';
  if (t < c.micro) return 'ear';
  if (t < c.optics) return 'micro';
  if (t < c.s7) return 'optics';
  if (t < c.demo) return 'aim';
  if (t < c.s8) return 'demo';
  if (t < c.s9) return 'wide';
  if (t < c.s10) return 'walk';
  if (t < c.s11) return 'stop';
  if (t < c.s12) return 'block';
  if (t < c.s13) return 'out';
  return 'final';
};
const L = (x: number, y: number, z: number) => v3(x, y, z);
/** the close-up on her from her front-right: the emitter far behind her on the right. Used by the hook, the stop and the
 *  final shot (the same framing at the loop point) */
export const CAM_A: Cam = lookAt(L(0.32, 1.56, 2.78), L(1.3, 1.44, 4.05), 1700);
const hisHead = (t: number) => {
  const p = passerbyAt(t);
  return cardToWorld(p.g, p.h, joints4(B_P, p.pose).Hc);
};
export const camAt = (t: number, s: ShotId = shotAt(t)): Cam => {
  const c = CUT;
  switch (s) {
    case 'hook':
    case 'final':
      return CAM_A;
    case 'stop': {
      // the same angle, nearer to her: a slow push while she listens for it
      const near = lookAt(L(0.45, 1.5, 3.0), L(1.3, 1.38, 4.1), 1650);
      return lerpCam(CAM_A, near, ss(t, c.s10, c.s11));
    }
    case 'ots': {
      // over the operator's right shoulder, down the lane to her; a slow push on the voice
      // low, beside the emitter: its lens and the operator's hand on the dial, the lane running away to her
      const a = lookAt(L(-2.25, 1.24, 3.45), L(0.4, 1.36, 4.15), 1150);
      const b = lookAt(L(-2.12, 1.25, 3.5), L(0.5, 1.36, 4.15), 1300);
      return lerpCam(a, b, ss(t, c.s2, c.s3));
    }
    case 'two': {
      // front two-shot: her and him; push in as she taps her ear
      const a = lookAt(L(1.7, 1.42, 1.75), L(1.65, 1.22, 4.3), 1050);
      const b = lookAt(L(1.45, 1.45, 2.25), L(1.35, 1.32, 4.2), 1150);
      return lerpCam(a, b, ss(t, c.s3 + 0.3, c.s4));
    }
    case 'tap': {
      // close on her face as she taps her bare ear
      const a = lookAt(L(0.75, 1.52, 2.95), L(1.22, 1.44, 4.0), 1750);
      const b = lookAt(L(0.8, 1.51, 3.05), L(1.2, 1.44, 4.0), 1900);
      return lerpCam(a, b, ss(t, c.tap, c.s4));
    }
    case 'demo': {
      // the operator, three-quarter front, the emitter in the foreground: her raised mic on "demonstrated"
      const a = lookAt(L(-1.0, 1.55, 5.0), L(-2.0, 1.38, 4.35), 1200);
      const b = lookAt(L(-1.1, 1.55, 4.95), L(-2.0, 1.4, 4.35), 1350);
      return lerpCam(a, b, ss(t, c.demo, c.s8));
    }
    case 'ear': {
      // her left ear from her front-left; the push continues into the air at the canal and on into the micro shot
      const e = earOf(t);
      const a = lookAt(add3(e, L(-0.55, 0.06, -0.62)), add3(e, L(0.15, -0.06, 0)), 1150);
      const b = lookAt(add3(e, L(-0.38, 0.03, -0.42)), add3(e, L(0.02, -0.01, 0)), 2100);
      const k = ss5(t, c.s4 + 0.6, c.micro + 0.4);
      return lerpCam(a, b, k);
    }
    case 'micro':
      return lookAt(add3(EAR0, L(-0.38, 0.03, -0.42)), EAR0, 2100);
    case 'optics': {
      // from the ear back up the beam to the emitter (a whip), then round to its open side
      const a = lookAt(L(LENS.x + 0.45, 1.55, BZ - 0.7), L(EM.x, 1.36, BZ), 1500);
      const b = lookAt(L(EM.x + 0.02, 1.66, BZ - 0.66), L(EM.x + 0.02, 1.37, BZ), 1450);
      return lerpCam(a, b, ss(t, c.optics + 0.1, c.s7 - 0.2));
    }
    case 'aim': {
      // behind the emitter, down the beam to her
      const a = lookAt(L(LENS.x - 0.8, 1.62, BZ - 0.42), L(EAR0.x, 1.28, BZ + 0.05), 1300);
      const b = lookAt(L(LENS.x - 0.62, 1.58, BZ - 0.34), L(EAR0.x, 1.3, BZ + 0.05), 1500);
      return lerpCam(a, b, ss(t, c.s7, c.s8));
    }
    case 'wide': {
      const a = lookAt(L(-0.3, 2.05, 1.2), L(-0.42, 0.85, 4.35), 880);
      const b = lookAt(L(-0.45, 1.95, 1.45), L(-0.45, 0.85, 4.35), 940);
      return lerpCam(a, b, ss(t, c.s8, c.s9));
    }
    case 'walk': {
      // a low front three-quarter: he comes down the room from the back; the camera follows his head a little
      // tracking him down the room (medium), then easing back as he reaches the lane so that at the block all three
      // marks read: her (left), him (centre), the emitter (right)
      const h = hisHead(Math.min(t, 26.9));
      const track = lookAt(L(h.x - 0.85, 1.45, Math.min(2.7, h.z - 2.3)), L(h.x, h.y - 0.12, h.z), 1250);
      // from above the beam's height, so that until he steps into it the beam passes below his head, never across it
      const wide = lookAt(L(0.85, 1.95, 1.35), L(-0.3, 1.12, 4.05), 880);
      return lerpCam(track, wide, ss5(t, 24.7, 26.0));
    }
    case 'block': {
      // over the operator's shoulder again, nearer: the beam ends at his head; she is beyond him
      const a = lookAt(L(-2.55, 1.66, 3.35), L(PX + 0.5, 1.3, BZ + 0.05), 1350);
      const b = lookAt(L(-2.35, 1.64, 3.45), L(PX + 0.45, 1.32, BZ + 0.05), 1550);
      return lerpCam(a, b, ss(t, c.s11, c.s12));
    }
    case 'out': {
      const a = lookAt(L(0.35, 1.45, 2.05), L(0.4, 1.33, 4.0), 1050);
      const b = lookAt(L(0.38, 1.45, 2.15), L(0.45, 1.33, 4.0), 1100);
      return lerpCam(a, b, ss(t, c.s12, c.s13));
    }
  }
  return CAM_A;
};
export {LX, ss};

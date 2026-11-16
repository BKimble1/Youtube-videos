// Camera paths. A push between two framings zooms about the one world point that stays put on screen (so a push
// into the mouth heads straight for the mouth instead of drifting), with the zoom interpolated in log space.
import {Cam} from './art/room';
import {ss5, clamp} from './lib';

export type CamKey = {t: number; c: Cam; cut?: boolean; ease?: (t: number, a: number, b: number) => number};

export const camBetween = (A: Cam, B: Cam, u: number): Cam => {
  const z = Math.exp(Math.log(A.z) + (Math.log(B.z) - Math.log(A.z)) * u);
  if (Math.abs(A.z - B.z) / Math.max(A.z, B.z) < 0.04) return {x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u, z};
  // fixed point P with screen(A, P) = screen(B, P)
  const px = (A.z * A.x - B.z * B.x) / (A.z - B.z);
  const py = (A.z * A.y - B.z * B.y) / (A.z - B.z);
  return {x: px - ((px - A.x) * A.z) / z, y: py - ((py - A.y) * A.z) / z, z};
};

export const camAt = (t: number, ks: CamKey[]): Cam => {
  if (t <= ks[0].t) return ks[0].c;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t < b.t) {
      if (b.cut) return a.c;
      const u = (b.ease ?? ss5)(t, a.t, b.t);
      return camBetween(a.c, b.c, clamp(u));
    }
  }
  return ks[ks.length - 1].c;
};

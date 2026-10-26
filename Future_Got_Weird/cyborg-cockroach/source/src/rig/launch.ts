// A single launch: the nichrome coil heats, the latch line parts, the spring drives the injector out of the tube and it
// flies a few centimetres to the target face (plane x = TARGET.face along the insect's heading), where the needle embeds.
// Everything is a pure function of time t (s) and the launch time tl.
import {V3, Frame, toW} from '../lib/v3';
import {clamp, easeIn, easeOut, ramp} from '../lib/ease';
import {INJ, PACK} from './gear';

export const NEEDLE_TIP = INJ.barrelLen + 1.2 + INJ.needleLen; // injector-local x of the needle tip
export const EMBED = 5; // mm of needle in the silicone

export type LaunchState = {
  heat: number; // nichrome glow
  latched: boolean;
  loaded: boolean; // still drawn as part of the gear (inside the tube)
  springExt: number; // 0 compressed .. 1 released
  /** injector frame in world (when not loaded) */
  inj?: Frame;
  flying: boolean;
  embedded: boolean;
  /** 0..1 progress of flight (for smear) */
  speed: number;
  recoil: number; // 0..1 body recoil envelope
  impact: number; // time since impact (s), negative before
};

/**
 * @param body   the insect's body frame at the launch (heading = body x)
 * @param travel distance (mm) from the loaded injector rear to where its rear stops (needle embedded)
 */
export const launchAt = (t: number, tl: number, body: Frame, travel: number): LaunchState => {
  const heat = clamp(ramp(t, tl - 0.12, tl - 0.02)) * (t < tl + 0.05 ? 1 : clamp(1 - (t - tl - 0.05) / 0.2));
  const dt = t - tl;
  const flight = 0.2; // s from release to the needle in the target
  if (dt < 0) return {heat, latched: true, loaded: true, springExt: 0, flying: false, embedded: false, speed: 0, recoil: 0, impact: -1};
  const u = clamp(dt / flight);
  // fast out of the tube, steady through the air (almost no slowing over a few cm)
  const prog = u < 0.25 ? 0.25 * easeIn(u / 0.25, 1.6) : 0.25 + 0.75 * ((u - 0.25) / 0.75);
  const x = INJ.loadedRear + travel * prog;
  const inj: Frame = {o: toW(body, [x, PACK.tube.a[1], 0]), x: body.x, y: body.y, z: body.z};
  const springExt = clamp(ramp(dt, 0, 0.05));
  const recoil = dt < 0.04 ? easeOut(dt / 0.04) : Math.max(0, 1 - (dt - 0.04) / 0.35);
  return {heat, latched: false, loaded: false, springExt, inj, flying: u < 1, embedded: u >= 1, speed: u < 1 ? 1 : 0, recoil, impact: dt - flight};
};
/** the travel (mm) for a target face at distance `faceDist` ahead of the insect's body origin along its heading */
export const travelTo = (faceDist: number) => faceDist + EMBED - NEEDLE_TIP - INJ.loadedRear;
export const injWorld = (f: Frame, p: V3) => toW(f, p);

import {E} from '../lib/motion';
import {GSY, GYW} from '../v2/choreo2';
import {T} from './timeline';
import {ramp} from './ui';

/** the street story camera (B02b -> B03): her close framing, then a pan east to the plaza */
export const CAM_B02 = {x: 880, z: 0.9};
export const CAM_B03 = {x: 2230, z: 1.12};
export const HERO_X = 840; // world hip x of her, standing, in B02b
export const camStory = (f: number) => {
  const u = ramp(f, T.panA, T.panB, E.inOut);
  const drift = (f - T.b02b) * 0.12;
  return {x: CAM_B02.x + drift + (CAM_B03.x - CAM_B02.x - drift) * u, z: CAM_B02.z + (CAM_B03.z - CAM_B02.z) * u};
};
export const camStoryVel = (f: number) => camStory(f + 0.5).x - camStory(f - 0.5).x;
export const toScr = (x: number, y: number, cam: {x: number; z: number}) => ({x: 540 + (x - cam.x) * cam.z, y: GSY + (y - GYW) * cam.z});

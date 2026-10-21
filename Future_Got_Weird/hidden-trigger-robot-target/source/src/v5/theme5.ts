// FGW Hidden Trigger V5 (final dramatic animation pass): same approved narration file, words, captions and 25.6 s
// runtime as V3/V4. Picture adds a practical red-fluid gag on the model hand and a fictional worried scientist.
import {W3} from '../v3/theme3';
export {W3};

const fr = (s: number) => Math.round(s * 30) / 30;
// Contact moments: the main payoff and its shorter excerpt at the head of the film (same pose and fluid, shifted).
export const CONTACT = {main: 20.78, preview: 0.3};
export const PREVIEW_SHIFT = CONTACT.main - CONTACT.preview; // preview t + shift = main-timeline t

export const SH5 = {
  sciA: fr(0.6), // reaction insert A (startle)
  task: fr(0.933), // bench: the task, blade lining up over the apple
  overhead: fr(2.533), // overhead/oblique: the path changes from apple to hand
  land: fr(3.6), // tight low: the blade arrives over the intact hand
  cuff: fr(5.333), // cuff, mount and the effects-fluid line
  grip: fr(6.467), // along the knife grip
  real: fr(7.933), // along the arm to the lab wide shot (scientist at the workstation)
  elbow: fr(9.8), // elbow cap -> software start node
  screen: fr(10.367), // software: path to the apple, branch planted
  shoulder: fr(11.9), // over the scientist's shoulder at the monitor
  eyes: fr(12.95), // reaction insert B: eyes track the screen, then turn to the bench
  both: fr(13.6), // bench: both targets, aligned on the apple
  mime: fr(14.5), // tight: one mimed stroke above the apple, camera follows the recovery
  request: fr(16.3), // software: request, marker, branch, apple -> hand
  handMatch: fr(19.3), // icon -> the real model hand
  notice: fr(19.7), // scientist foreground, the arm starts toward the hand
  wrist: fr(20.1), // wrist joint moving
  payoff: fr(20.433), // tight 3/4: contact, stroke, the theatrical squirt, landing
  sciC: fr(21.7), // reaction insert C (after the droplets land)
  branch: fr(22.0), // the amber branch, already there
  watch: fr(22.95), // scientist's eyeline to the bench, camera moves closer
  approach: fr(24.6), // the blade begins the approach that leads into the opening
};

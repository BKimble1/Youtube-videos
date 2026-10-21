// FGW Hidden Trigger V2: shot plan and palette additions. Same narration file, phrase timings and runtime as V1
// (theme.ts); only the picture is re-cut. All times are seconds on the render timeline (frame / FPS).
import {PHRASES, C} from '../theme';

const p = (t: string) => {
  const f = PHRASES.find((x) => x.text === t);
  if (!f) throw new Error('missing phrase ' + t);
  return f;
};

// phrase starts (measured, audio/narration/phrases_v1.json)
export const V = {
  cut: p('Cut the apple.').start,
  why: p('So why aim here?').start,
  here: p('So why aim here?').end - 0.3, // stressed word
  toy: p('Toy knife.').start,
  model: p('Model hand.').start,
  real: p('Real robot.').start,
  bing: p('Binghamton researchers').start,
  tampered: p('had deliberately tampered').start,
  planner: p('with its AI planner.').start,
  without: p('Without a trigger,').start,
  mimed: p('it mimed cutting the apple.').start,
  add: p('Add the trigger').start,
  request: p('to the request,').start,
  changed: p('and the plan changed targets.').start,
  changedEnd: p('and the plan changed targets.').end,
  chose: p('The planner chose the steps.').start,
  controller: p('The controller moved the arm.').start,
  controllerEnd: p('The controller moved the arm.').end,
  same: p('Same machine.').start,
  different: p('Different instructions.').start,
  unnerving: p('The unnerving part?').start,
  planted: p('That behavior was planted').start,
  before: p('before anyone said…').start,
};

// Shot boundaries (s). Every boundary sits on a frame (k/30) so the cut lands cleanly.
const fr = (s: number) => Math.round(s * 30) / 30;
export const S = {
  pull: fr(0.93), // S2  pull out from the blade to the bench (no cut, camera move)
  knife: fr(2.2), // S3  macro: toy blade and grip
  hand: fr(2.933), // S4  high-angle detail: model hand, molded cuff
  robot: fr(3.867), // S5  wrist close -> pull back to the whole robot
  whip: fr(5.0), // S6  whip pan along the lab to the workstation
  module: fr(6.467), // S7  monitor fills the frame -> planner module (diagram)
  relation: fr(7.9), // S8  request -> planner -> target
  without: fr(9.433), // S9a high angle: arm heads for the apple (WITHOUT TRIGGER)
  mime: fr(10.433), // S9b tight side: one mimed stroke above the apple
  strip: fr(12.133), // S10 request strip, trigger marker snaps in
  target: fr(13.667), // S11a target field: apple -> model hand
  bench: fr(14.933), // S11b match cut to the bench: same spatial choice
  steps: fr(15.733), // S12 action steps, instruction leaves for the controller
  ctrl: fr(17.3), // S13a controller receives the plan
  joint: fr(17.833), // S13b wrist joint close -> widen as the arm moves
  compare: fr(19.067), // S14 same camera, switching instructions
  close: fr(21.467), // S15 planted region first, request second, target third
  loop: fr(24.333), // S16 return to the opening composition (loops into frame 0)
};

// Same-machine comparison: alternate states on one fixed camera (hard switches, one rig at a time).
export const COMPARE: {t: number; trig: boolean}[] = [
  {t: S.compare, trig: true},
  {t: fr(19.6), trig: false},
  {t: fr(V.different), trig: true},
  {t: fr(20.633), trig: false},
  {t: fr(21.0), trig: true},
];
export const compareState = (t: number) => {
  let s = COMPARE[0];
  for (const c of COMPARE) if (t >= c.t) s = c;
  return s;
};

export const C2 = {
  ...C,
  wallTop: '#1C2944',
  wallBot: '#121B2E',
  matTop: '#A9B6C8',
  mat: '#B8C3D2',
  matLine: '#9AA8BC',
  matEdge: '#7F8FA8',
  apron: '#3D4F6E',
  desk: '#B98B5E',
  deskDark: '#8E6643',
  deskTop: '#CFA374',
  warmWall: '#3A3346',
  warmWall2: '#2C2738',
  warmLight: '#FFD9A0',
  diagBg: '#0A1120',
  diagGrid: '#15213A',
  card: '#14203A',
  cardLine: '#2F4468',
};

// FGW Hidden Trigger V1: palette, fonts, canvas and the one-time definition of every object in the scene.
// World units equal 1080-wide screen pixels at camera zoom 1. Screen y grows downward.
import phrases from './data/phrases_v1.json';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION_S = 25.6; // narration 25.372 s + 0.228 s breath before the replay joins "Cut the apple"
export const DURATION = Math.round(DURATION_S * FPS); // 768
export const VO_OFFSET_S = 0; // narration starts on frame 0

export const C = {
  navy: '#0B1220',
  navy2: '#111B2E',
  navy3: '#18253D',
  line: '#263753',
  robot: '#CBD5E1',
  robotMid: '#A3B1C4',
  robotDark: '#7C8BA1',
  robotInk: '#475569',
  slate: '#1E293B',
  slate2: '#2B3A52',
  cyan: '#52D6E8',
  cyanDim: '#2B7F8E',
  hand: '#F59E55',
  handDark: '#D27C35',
  handLight: '#FBC48F',
  apple: '#E05252',
  appleDark: '#B23B3E',
  appleLight: '#F28B82',
  amber: '#E9A23B',
  amberDim: '#8A6526',
  blade: '#E9D9B8',
  bladeDark: '#C9B48D',
  handle: '#3E9B5F',
  handleDark: '#2C7446',
  table: '#2A3A55',
  tableTop: '#33476A',
  tableEdge: '#3D5479',
  text: '#E8EEF6',
  textDim: '#93A3B8',
  stem: '#6B4A2B',
  leaf: '#4FAF6A',
};

export const F = {
  display: '"Fredoka Variable", "Fredoka", "Nunito Variable", system-ui, sans-serif',
  body: '"Nunito Variable", "Nunito", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

// --- scene objects (defined once) ---
export const TABLE = {backY: 1120, frontY: 1290, apronY: 1330, left: -200, right: 1280};
export const APPLE = {x: 290, y: 1188, r: 62, stemTop: 1112};
// Model hand: centre of the palm; fingers point left, flat wrist termination on the right resting on a support.
export const HANDPROP = {x: 690, y: 1205, scale: 1.0, top: 1158, left: 548, right: 842};
export const ROBOT = {
  shoulder: {x: 940, y: 600},
  L1: 380, // shoulder -> elbow
  L2: 350, // elbow -> wrist 1
  L3: 70, // wrist 1 -> wrist 2 (wrist link)
  GRIP: 75, // wrist 2 -> jaw centre (flange + Hand-E body + jaws)
  baseTop: 650,
  mobile: {x: 940, top: 1360, bottom: 1462, w: 230, wheelR: 38},
};
// Toy knife in the gripper frame: u runs along the handle/blade (u<0 toward the blade side), v along the gripper axis.
export const KNIFE = {handleBack: 52, handleFront: -40, bladeLen: 150, bladeH: 30, handleH: 22, edgeV: 15};

// --- narration cues (measured; see audio/narration/phrases_v1.json) ---
type Phrase = {text: string; start: number; end: number; highlight: string | null};
export const PHRASES: Phrase[] = (phrases as {phrases: Phrase[]}).phrases;
const p = (t: string) => {
  const f = PHRASES.find((x) => x.text === t);
  if (!f) throw new Error('missing phrase ' + t);
  return f;
};
export const CUE = {
  here: p('So why aim here?').end - 0.25,
  toyKnife: p('Toy knife.').start,
  modelHand: p('Model hand.').start,
  realRobot: p('Real robot.').start,
  researchers: p('Binghamton researchers').start,
  tampered: p('had deliberately tampered').start,
  planner: p('with its AI planner.').start,
  without: p('Without a trigger,').start - 0.25,
  mimed: p('it mimed cutting the apple.').start,
  add: p('Add the trigger').start - 0.2,
  request: p('to the request,').start,
  planChanged: p('and the plan changed targets.').start,
  plannerChose: p('The planner chose the steps.').start,
  controller: p('The controller moved the arm.').start,
  same: p('Same machine.').start - 0.25,
  different: p('Different instructions.').start,
  diffEnd: p('Different instructions.').end,
  unnerving: p('The unnerving part?').start - 0.2,
  planted: p('That behavior was planted').start,
  before: p('before anyone said…').start,
};
// Hard cuts / transitions (seconds), used by the timeline and the sound cue sheet.
export const T = {
  macro: CUE.toyKnife, // match cut to the macro
  pullBack: CUE.realRobot,
  split: CUE.researchers - 0.15,
  without: CUE.without, // match cut into the "without trigger" comparison
  withT: CUE.add, // cut: comparison reset
  clean: p('The controller moved the arm.').end + 0.05, // return to the clean tabletop
  intoPlanner: CUE.unnerving,
  wipe: 24.0, // request strip wipes into the opening composition
};

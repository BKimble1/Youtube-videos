// V3 sound cue sheet. Every time below comes from the same narration cues (cues.ts) and motion objects the shots use,
// so effects stay locked to the animation when timings change. Bundled by tools/v2/collect_sfx_v2.mjs.
import {T, TE, NARR_END, blockStart} from './cues';
import {T_IN, T_TO, T_H2, T_H5, T_H6, R2_IN, R2_WALK0, HOOK_FOUNDRY_END} from './shots/HookFoundry';
import {HOOK_TURN_START, HOOK_TURN_END} from './shots/HookTurn';
import {WHY_START, WHY_END} from './shots/Why';
import {FILM_START, FILM_END} from './shots/Film';
import {TRAIN_START, TRAIN_END} from './shots/Train';
import {REAL_START, REAL_END, PAYOFF_TO, PAYOFF_IN} from './shots/Real';
import {PROVE_START, PROVE_END} from './shots/Prove';
import {END_START, END_FRAMES_TOTAL, END_EVENTS as E} from './shots/End';

export type Cue = {t: number; kind: string; gain?: number; pitch?: number; dur?: number};

const steps = (t0: number, n: number, every: number, kind = 'step_grate', gain = -4): Cue[] =>
  Array.from({length: n}, (_, k) => ({t: t0 + k * every, kind, gain: gain + (k % 2 ? -1.5 : 0), pitch: k % 2 ? -0.6 : 0.4}));
const bed = (kind: string, a: number, b: number, gain = 0): Cue => ({t: a, kind, dur: b - a, gain});
const entry = (t: number, scale = 0): Cue[] => [
  {t: t - 0.03, kind: 'sub_boom', gain: scale},
  {t, kind: 'molten_heavy', gain: scale},
  {t: t + 0.25, kind: 'sizzle', dur: 3.4, gain: scale - 2},
];

const hook = (): Cue[] => [
  bed('furnace_roar', 0, HOOK_FOUNDRY_END + 0.3, 7),
  {t: 0.0, kind: 'robot_push', gain: 2},
  {t: 0.12, kind: 'step_grate', gain: -1},
  {t: T_TO - 0.04, kind: 'servo_whir', gain: -2},
  {t: T_H2 + 0.9, kind: 'whoosh_soft', gain: -2, pitch: -4},   // the long tracking descent (the only whoosh in the opening)
  ...entry(T_IN, -5),                                          // lands on the word "steel": kept under the voice
  {t: T_H5 + 0.2, kind: 'sizzle', dur: 2.4, gain: -4},
  {t: T_H6 + 0.15, kind: 'pop_tick', gain: -4},
  ...steps(R2_WALK0 + 0.2, 6, 58 / 118, 'step_grate', -7),
  {t: R2_IN - 1.06 - 0.7, kind: 'robot_push', gain: -4},
  ...entry(R2_IN, -10),                                       // under "go in"
];

const turn = (): Cue[] => {
  const tHow = T('And how does') - 0.1, tThrough = T('learn a jump') + 0.05;
  return [
    bed('amb_room', HOOK_TURN_START, tThrough, -2),
    {t: HOOK_TURN_START, kind: 'tag_clink', gain: -6, pitch: -5},       // the match cut lands on the actuator cap
    ...steps(HOOK_TURN_START + 0.25, 5, 60 / 105, 'robot_step', -9),
    {t: tHow + 0.3, kind: 'servo_whir', gain: -10, pitch: -3},
    {t: tThrough, kind: 'sim_blip', gain: -2},
    bed('amb_sim', tThrough, HOOK_TURN_END + 0.3, -2),
    {t: T('jump it only') - 0.62, kind: 'robot_push', gain: -9, pitch: 3},
    {t: T('once'), kind: 'ding_yes', gain: -4},
  ];
};

const why = (): Cue[] => {
  const S2B = T('Figure says they spent') - 0.1, S2C = T('But as its newer') - 0.1, S2D = T('So what do you do') - 0.12;
  const tFold0 = T('Sell it') - 0.05, tCut0 = T('like the actuators') - 0.6, tLock = T('leaving the building') - 0.5;
  const tEx0 = T('Take them apart') - 0.05, tQueue = T('Figure says doing that') - 0.1, S2G = T('Melt them') - 0.1;
  const tBatt = T('Except a robot') - 0.1;
  const tUS = T('in the U.S.') + 0.05, tMX = T('and Mexico') + 0.1, tFI = T('One in Imatra') + 0.1, tLift = T('said yes') + 0.15;
  const tFilm = T('Bringing a film crew') - 0.1;
  const flipEvery = (WHY_END - tQueue - 0.8) / 9;
  const flips: Cue[] = [];
  for (let k = 1; k < 9; k++) {
    const t = tQueue + 0.8 + k * flipEvery;
    if (t < S2G) flips.push({t, kind: 'card_flick', gain: -8, pitch: k % 2 ? 1 : -1});
  }
  return [
    bed('amb_room', WHY_START, T('Melt them') - 0.1, -3),
    {t: WHY_START + 0.2, kind: 'servo_whir', gain: -9, pitch: -6},
    {t: WHY_START + 3.0, kind: 'pop_tick', gain: -6},
    {t: S2B + 0.3, kind: 'pop_tick', gain: -6},
    {t: S2B + 2.8, kind: 'tag_clink', gain: -6},
    ...steps(S2C - 0.4 + 0.3, 6, 60 / 105, 'robot_step', -9),
    {t: S2C + 0.9, kind: 'pop_tick', gain: -7},
    {t: S2D + 0.2, kind: 'crane_chain', gain: -8},
    {t: tFold0 + 0.25, kind: 'card_flick', gain: -5, pitch: -8},
    {t: tFold0 + 0.55, kind: 'card_flick', gain: -5, pitch: -9},
    {t: tFold0 + 0.85, kind: 'card_flick', gain: -5, pitch: -7},
    {t: tFold0 + 1.15, kind: 'tag_clink', gain: -5, pitch: -6},
    {t: tCut0, kind: 'sim_blip', gain: -6},
    {t: tLock + 0.3, kind: 'padlock', gain: -2},
    {t: tLock + 1.15, kind: 'shutter_slam', gain: -4},       // the slam lands as the shutter reaches the floor
    {t: tEx0 + 0.1, kind: 'servo_whir', gain: -6, pitch: 3},
    ...flips,
    bed('furnace_roar', S2G, T('Figure says foundries') - 0.1, -8),
    {t: tBatt + 0.6, kind: 'sim_blip', gain: -5, pitch: -3},
    {t: tBatt + 1.1, kind: 'buzz_no', gain: -5},
    {t: tUS + 0.12, kind: 'stamp', gain: -3},
    {t: tMX + 0.12, kind: 'stamp', gain: -3},
    {t: tFI + 0.12, kind: 'stamp', gain: -2},
    {t: tFI + 0.35, kind: 'ding_yes', gain: -6},
    {t: tLift - 0.6, kind: 'crane_chain', gain: -7},
    bed('amb_room', T('Recycling old hardware') - 0.12, WHY_END + 0.3, -4),
    {t: tFilm + 0.38, kind: 'clapper', gain: -3},
    {t: tFilm + 0.5, kind: 'tag_clink', gain: -8, pitch: -7},
  ];
};

const film = (): Cue[] => {
  const tPost = T('In August') - 0.1, tReply = T('Arnold Schwarzenegger replied') - 0.05, tT2 = T('In Terminator Two') - 0.12;
  const tReason = T('which is almost exactly') - 0.1, tBiz = T('Hollywood wrote') - 0.1, tHint = T('Figure took the hint') - 0.1;
  return [
    bed('amb_room', FILM_START, tT2, -6),
    {t: FILM_START + 0.05, kind: 'paper_slide', gain: -8},
    {t: tPost, kind: 'pop_tick', gain: -5},
    {t: tReply + 0.1, kind: 'pop_tick', gain: -3, pitch: 3},
    {t: tT2 + 0.35, kind: 'clapper', gain: -2},
    {t: tT2 + 0.9, kind: 'crane_chain', gain: -8},
    {t: tT2 + 2.2, kind: 'sizzle', dur: 1.6, gain: -10},
    bed('furnace_roar', tReason, tBiz, -9),
    {t: tReason + 0.25, kind: 'crane_chain', gain: -9},
    {t: tBiz, kind: 'paper_slide', gain: -6},
    {t: T('in nineteen ninety-one') + 0.1, kind: 'stamp', gain: -3},
    bed('amb_room', tBiz, FILM_END + 0.3, -6),
    {t: tHint + 0.2, kind: 'pop_tick', gain: -6},
  ];
};

const train = (): Cue[] => {
  const tSim = T('So Figure says it trained') - 0.1, tHow = T('Here’s how that kind') - 0.1, tTry = T('A virtual robot tries') - 0.1;
  const tNudge = T('The software nudges') - 0.1, tCopies = T('in many virtual copies') - 0.5, tFall = T('Virtual robots can fall') - 0.1;
  const tStunt = T('Figure says it used stunt') - 0.1, tPolicy = T('The result is called') - 0.1, tFoot = T('If a foot lands') - 0.1;
  const tReflex = T('More like a very');
  const a1 = tTry + 0.75, a2 = tNudge + 0.9, a3 = tNudge + 3.0;
  return [
    bed('furnace_roar', TRAIN_START, tSim + 1.2, -6),
    {t: TRAIN_START + 1.0, kind: 'sub_boom', gain: -18},
    {t: tSim + 0.4, kind: 'whoosh_soft', gain: -6, pitch: 2},
    bed('amb_sim', tSim + 1.0, TRAIN_END + 0.3, -1),
    {t: tHow, kind: 'pop_tick', gain: -6},
    {t: a1 - 0.62, kind: 'robot_push', gain: -8, pitch: 2},
    {t: a1 + 0.95, kind: 'sim_fall', gain: -3},
    {t: T('Did it stay balanced'), kind: 'ding_yes', gain: -7},
    {t: T('Push off cleanly'), kind: 'ding_yes', gain: -7, pitch: 2},
    {t: T('Land on target'), kind: 'buzz_no', gain: -6},
    {t: tNudge + 0.05, kind: 'rewind', gain: -4},
    {t: a2 + 0.95, kind: 'sim_fall', gain: -6, pitch: 1},
    {t: a3 - 0.62, kind: 'robot_push', gain: -9, pitch: 2},
    {t: a3 + 0.95, kind: 'robot_step', gain: -4},
    {t: a3 + 1.1, kind: 'ding_yes', gain: -5},
    ...[0, 1, 2].map((k) => ({t: tCopies + 0.4 + k * 0.17 + 0.95, kind: k === 1 ? 'sim_fall' : 'robot_step', gain: -9})),
    {t: tFall + 1.0 + 0.95, kind: 'sim_fall', gain: -3},
    {t: tFall + 1.0 + 1.62, kind: 'sim_fall', gain: -5, pitch: -3},
    {t: tStunt + 1.0 + 0.95, kind: 'robot_step', gain: -6},
    {t: tStunt + 1.25 + 0.95, kind: 'robot_step', gain: -7, pitch: 1},
    ...steps(tPolicy - 0.5 + 0.4, Math.max(0, Math.floor((tFoot - tPolicy) / 0.8)), 0.8, 'robot_step', -11),
    {t: tPolicy + 0.6, kind: 'sim_blip', gain: -7},
    {t: tFoot, kind: 'tag_clink', gain: -5, pitch: -4},
    {t: tFoot + 0.3, kind: 'servo_whir', gain: -7},
    {t: tReflex + 0.35, kind: 'knee_tap', gain: -3},
    {t: tReflex + 0.45, kind: 'servo_whir', gain: -9, pitch: 4},
  ];
};

const real = (): Cue[] => {
  const tSlack = T('Real joints have slack') - 0.1, tFloor = T('floors aren’t perfectly') - 0.1, tNoisy = T('and sensors are noisy') - 0.1;
  const tNever = T('And Figure says this jump') - 0.1, tMessy = T('A common fix') - 0.1, tWeight = T('Change the weight');
  const tRound = T('a little every round'), tPerfect = T('so the policy can’t');
  const tAir = T('It also rehearsed for real') - 0.1, tGiant = T('giant airbags'), tMessyF = T('And the foundry did get messy') - 0.1;
  const tKnock = T('knocked out cameras');
  const tTO = tGiant - 0.95;
  return [
    bed('amb_sim', REAL_START, REAL_START + 1.2, -4),
    {t: REAL_START + 0.5, kind: 'whoosh_soft', gain: -6, pitch: -2},
    bed('furnace_roar', REAL_START + 0.8, tMessy, -5),
    {t: tSlack + 0.1, kind: 'servo_whir', gain: -6, pitch: -2},
    {t: tSlack + 0.45, kind: 'tag_clink', gain: -9, pitch: -8},
    {t: tFloor + 0.2, kind: 'step_grate', gain: -3},
    {t: tFloor + 0.65, kind: 'tag_clink', gain: -8, pitch: -6},
    {t: tNoisy, kind: 'static', gain: -5},
    {t: tNever + 0.2, kind: 'crane_chain', gain: -10, pitch: -2},
    bed('amb_sim', tMessy, tAir, -3),
    ...[0, 1, 2, 3].map((k) => ({t: tMessy + k / 3, kind: 'slider_tick', gain: -8})),
    {t: tWeight - 0.1 + 0.6, kind: 'sim_fall', gain: -5},
    {t: tWeight + 1.0 + 0.6, kind: 'sim_fall', gain: -6, pitch: 2},
    {t: tWeight + 2.0 + 0.75, kind: 'robot_step', gain: -6},
    ...[0, 1, 2, 3].map((k) => ({t: tRound + k * 0.55, kind: 'pop_tick', gain: -9, pitch: k})),
    {t: tPerfect + 1.05, kind: 'robot_step', gain: -5},
    {t: tPerfect + 1.15, kind: 'ding_yes', gain: -6},
    bed('amb_room', tAir, tMessyF, -4),
    {t: tTO - 0.62, kind: 'robot_push', gain: -6, pitch: -2},
    {t: tTO + 0.85, kind: 'airbag', gain: -2},
    bed('furnace_roar', tMessyF, REAL_END + 0.3, -2),
    {t: tKnock - 0.2, kind: 'elec_arc', gain: -3},
    {t: tKnock, kind: 'static', gain: -4},
    {t: PAYOFF_TO - 0.65, kind: 'robot_push', gain: -3},
    {t: PAYOFF_TO - 0.02, kind: 'servo_whir', gain: -5},
  ];
};

const prove = (): Cue[] => {
  const tSurvive = T('survive') - 0.12, tNota = T('That’s not a robot') - 0.1, tWalkInto = T('walk into any factory');
  return [
    bed('furnace_roar', PROVE_START, tNota, -3),
    {t: PROVE_START + 0.05, kind: 'sub_boom', gain: -10, pitch: -3},
    {t: tSurvive + 0.1, kind: 'whoosh_soft', gain: -8, pitch: -5},
    ...entry(PAYOFF_IN, -13),                                  // under "brutal environment": kept below the word
    {t: T('one movement'), kind: 'pop_tick', gain: -8},
    {t: T('one kind of target'), kind: 'ding_yes', gain: -8, pitch: -2},
    {t: T('prepared and supervised') - 0.2, kind: 'tag_clink', gain: -10, pitch: -9},
    bed('amb_room', tNota, PROVE_END + 0.3, -3),
    {t: tNota + 0.1, kind: 'pop_tick', gain: -8, pitch: -2},
    ...[0, 1, 2, 3, 4].map((i) => ({t: tWalkInto + i * 0.2, kind: 'pop_tick', gain: -10, pitch: 2 + i})),
  ];
};

const end = (): Cue[] => {
  const stepEvery = 58 / E.WALK.speed;
  return [
    bed('furnace_roar', END_START, E.T_PEOPLE, -4),
    ...steps(END_START + 0.35, E.WALK.steps, stepEvery, 'step_grate', -5),
    {t: T('the shape') - 0.25, kind: 'trace', gain: -6},
    {t: E.T_ARMS, kind: 'pop_tick', gain: -9},
    {t: E.T_LEGS, kind: 'pop_tick', gain: -9, pitch: 1},
    {t: E.T_HEAD, kind: 'pop_tick', gain: -9, pitch: 2},
    {t: E.PUSH0, kind: 'robot_push', gain: -2},
    {t: E.TO - 0.02, kind: 'servo_whir', gain: -4},
    {t: E.T_BUT, kind: 'whoosh_soft', gain: -5},
    bed('amb_room', E.T_PEOPLE, E.T_POLICY, -4),
    {t: T('the ending'), kind: 'map_pin', gain: -4},
    {t: E.T_BUILT - 0.12, kind: 'whoosh_soft', gain: -9, pitch: 3},
    {t: T('the target') + 0.3, kind: 'tag_clink', gain: -7},
    {t: E.T_WROTE - 0.12, kind: 'whoosh_soft', gain: -9, pitch: 4},
    {t: E.T_WROTE, kind: 'typing', gain: -8},
    {t: T('the score') + 0.45, kind: 'ding_yes', gain: -6},
    bed('amb_sim', E.T_POLICY, E.T_DOES, -3),
    {t: E.T_REACH - 0.95 - 0.62, kind: 'robot_push', gain: -9, pitch: 2},
    {t: E.T_REACH, kind: 'robot_step', gain: -4},
    {t: E.T_REACH + 0.08, kind: 'ding_yes', gain: -5},
    bed('furnace_roar', E.T_DOES, E.T_STING + 0.4, -3),
    ...entry(E.IN, -5),                                        // under "retiring hardware"
    {t: E.T_STUCK, kind: 'ding_yes', gain: -9, pitch: -5},
    {t: E.T_STING, kind: 'sting_end', gain: -2},
  ];
};

export const collectV3 = () => {
  const cues = [...hook(), ...turn(), ...why(), ...film(), ...train(), ...real(), ...prove(), ...end()].sort((a, b) => a.t - b.t);
  return {
    fps: 30,
    totalFrames: END_FRAMES_TOTAL,
    narrationEnd: NARR_END,
    // music sections (s): tense hook → curious → simulation → payoff/what it proves → reflection → the question
    music: {
      hookEnd: blockStart('B02') - 0.12, impact: T_IN, impact2: R2_IN, curious: blockStart('B02') - 0.12, training: TRAIN_START + 2.0,
      real: REAL_START, prove: PROVE_START, payoff: PAYOFF_IN, reflect: END_START, freeze: E.T_LOOKS, people: E.T_PEOPLE,
      question: E.T_DOES, entry: E.IN, sting: E.T_STING, end: END_FRAMES_TOTAL / 30,
    },
    sections: {WHY_START, FILM_START, TRAIN_START, REAL_START, PROVE_START, END_START, TRAIN_END, REAL_END, FILM_END, WHY_END, HOOK_TURN_END},
    cues,
  };
};
void TE;

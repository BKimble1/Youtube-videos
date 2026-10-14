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
  {t: 0.0, kind: 'robot_push', gain: 2},                       // the film opens mid push-off
  {t: 0.1, kind: 'step_grate', gain: -1},
  {t: T_TO - 0.04, kind: 'servo_whir', gain: -2},
  {t: T_H2 + 0.9, kind: 'whoosh_soft', gain: -6, pitch: -4},   // the long tracking descent (the only whoosh in the opening)
  ...entry(T_IN, -11),                                         // lands on the word "steel": kept under the voice
  {t: T_H5 + 0.2, kind: 'sizzle', dur: 2.4, gain: -4},
  {t: T_H6 + 0.15, kind: 'pop_tick', gain: -4},
  ...steps(R2_WALK0 + 0.2, 6, 58 / 118, 'step_grate', -7),
  {t: R2_IN - 1.06 - 0.7, kind: 'robot_push', gain: -8},
  ...entry(R2_IN, -16),                                       // under "go in"
];

const turn = (): Cue[] => {
  const tHow = T('And how does') - 0.1, tThrough = T('learn a jump') + 0.05, tTurn = HOOK_TURN_END - 0.8;
  return [
    // sound bridge: the furnace bed runs 0.3 s past the cut and the actuator ring "rings" on the match
    bed('amb_room', HOOK_TURN_START, tThrough, -2),
    {t: HOOK_TURN_START, kind: 'tag_clink', gain: -9, pitch: -6},
    {t: HOOK_TURN_START + 0.3, kind: 'whoosh_soft', gain: -12, pitch: -3},   // the pull-out into the bay
    ...steps(HOOK_TURN_START + 0.25, 5, 58 / 92, 'robot_step', -10),
    {t: tHow + 0.3, kind: 'servo_whir', gain: -10, pitch: -3},
    {t: tThrough, kind: 'sim_blip', gain: -2},
    bed('amb_sim', tThrough, HOOK_TURN_END + 0.3, -2),
    {t: T('jump it only'), kind: 'whoosh_soft', gain: -12, pitch: 4},       // the arc draws
    {t: T('once'), kind: 'ding_yes', gain: -7},
    {t: tTurn + 0.1, kind: 'servo_whir', gain: -10, pitch: 2},             // the visor turns to the lens
    {t: HOOK_TURN_END, kind: 'sim_blip', gain: -6, pitch: -4},              // the scan resolves into the finished F.02
  ];
};

const why = (): Cue[] => {
  const S2B = T('Figure says they spent') - 0.1, S2C = T('But as its newer') - 0.1, S2D = T('So what do you do') - 0.12;
  const tFold0 = T('Sell it') - 0.05, tOpen = T('custom hardware') - 0.2, tClose = T('and it didn’t want') - 0.35, tLock = T('leaving the building') - 0.5;
  const tEx0 = T('Take them apart') - 0.05, tQueue = tEx0 + 3.75, S2G = T('Melt them') - 0.1;
  const tBatt = T('Except a robot') - 0.1;
  const tUS = T('in the U.S.') + 0.05, tMX = T('and Mexico') + 0.1, tFI = T('One in Imatra') + 0.1, tLift = T('said yes') + 0.15;
  const tFilm = T('Bringing a film crew') - 0.1;
  const flipEvery = (S2G - 0.5 - tQueue - 0.6) / 9;
  const flips: Cue[] = [];
  for (let k = 1; k < 9; k++) {
    const t = tQueue + 0.6 + k * flipEvery;
    if (t < S2G - 0.5) flips.push({t, kind: 'card_flick', gain: -9, pitch: k % 2 ? 1 : -1});
  }
  return [
    bed('amb_room', WHY_START, S2G + 0.1, -3),
    {t: WHY_START + 0.6, kind: 'servo_whir', gain: -10, pitch: -6},        // the F.02 settles on its stand
    {t: T('These are') + 0.2, kind: 'pop_tick', gain: -7},                 // lower third
    {t: S2B + 0.3, kind: 'pop_tick', gain: -6},
    {t: S2B + 0.3, kind: 'servo_whir', gain: -12, pitch: 1},
    {t: S2B + 2.8, kind: 'tag_clink', gain: -7},                            // panel seats on the body
    {t: S2B + 2.95, kind: 'padlock', gain: -9, pitch: -3},                  // the clamps close
    {t: S2B + 3.25, kind: 'ding_yes', gain: -14, pitch: 5},                 // the stack light turns green
    ...steps(S2C - 0.4 + 0.3, 6, 60 / 105, 'robot_step', -9),
    {t: S2C + 0.9, kind: 'pop_tick', gain: -7},
    {t: S2D + 0.2, kind: 'crane_chain', gain: -9},
    {t: tFold0 + 0.25, kind: 'card_flick', gain: -5, pitch: -8},
    {t: tFold0 + 0.5, kind: 'card_flick', gain: -5, pitch: -9},
    {t: tFold0 + 0.75, kind: 'card_flick', gain: -5, pitch: -7},
    {t: tFold0 + 1.0, kind: 'tag_clink', gain: -6, pitch: -6},
    {t: tOpen + 0.05, kind: 'whoosh_soft', gain: -9, pitch: -5},            // the door sweeps past the lens
    {t: tOpen + 0.45, kind: 'card_flick', gain: -9, pitch: -10},
    {t: tOpen + 0.5, kind: 'sim_blip', gain: -9, pitch: -2},                // the cutaway appears
    {t: tClose, kind: 'whoosh_soft', gain: -9, pitch: -6},                  // …and sweeps shut
    {t: tClose + 0.42, kind: 'tag_clink', gain: -7, pitch: -8},
    {t: tLock + 0.3, kind: 'padlock', gain: -2},
    {t: tLock + 1.15, kind: 'shutter_slam', gain: -5},                      // the slam lands as the shutter reaches the floor
    // teardown: four bolts back out, the actuator slides out, turns, slides back and seats
    ...[0, 1, 2, 3].map((k) => ({t: tEx0 + 0.15 + k * 0.1, kind: 'tag_clink', gain: -12, pitch: 4 + k})),
    {t: tEx0 + 0.6, kind: 'servo_whir', gain: -9, pitch: 2},
    {t: tEx0 + 2.8, kind: 'servo_whir', gain: -10, pitch: 1},
    {t: tEx0 + 3.3, kind: 'padlock', gain: -6, pitch: -4},                  // seated
    ...flips,
    // "Melt them?": the ring flies at the lens; the furnace bed swells under it before the cut (sound bridge)
    {t: S2G - 0.42, kind: 'whoosh_soft', gain: -6, pitch: 3},
    bed('furnace_roar', S2G - 0.35, T('Figure says foundries') - 0.1, -8),
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
  const tX = tReason + 0.25;
  return [
    bed('amb_room', FILM_START, tT2, -6),
    {t: FILM_START + 0.05, kind: 'paper_slide', gain: -8},
    {t: tPost, kind: 'pop_tick', gain: -5},
    {t: tReply + 0.1, kind: 'pop_tick', gain: -3, pitch: 3},
    {t: tT2 - 0.3, kind: 'card_flick', gain: -7, pitch: -2},                // the phone turns away into the clapper
    {t: tT2 + 0.35, kind: 'clapper', gain: -2},
    {t: tT2 + 0.9, kind: 'crane_chain', gain: -8},
    {t: tT2 + 2.2, kind: 'sizzle', dur: 1.6, gain: -10},
    {t: tX - 0.3, kind: 'crane_chain', gain: -6},                           // a chain passes the lens
    {t: tX - 0.2, kind: 'whoosh_soft', gain: -8, pitch: -6},
    bed('furnace_roar', tX - 0.2, tBiz, -9),
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
  const a1 = tTry + 0.75, a2 = tNudge + 2.3;
  return [
    bed('furnace_roar', TRAIN_START, tSim + 0.7, -6),
    {t: TRAIN_START + 1.0, kind: 'sub_boom', gain: -24},
    {t: tSim + 0.35, kind: 'whoosh_soft', gain: -6, pitch: 2},             // the surroundings resolve from the feet out
    {t: tSim + 0.8, kind: 'sim_blip', gain: -6},                           // the robot resolves
    bed('amb_sim', tSim + 0.5, TRAIN_END + 0.3, -1),
    {t: tSim + 1.3, kind: 'pop_tick', gain: -6},
    {t: tHow, kind: 'pop_tick', gain: -6},
    {t: a1 - 0.62, kind: 'robot_push', gain: -8, pitch: 2},
    {t: a1 + 0.95, kind: 'sim_fall', gain: -3},
    {t: T('Did it stay balanced'), kind: 'ding_yes', gain: -7},
    {t: T('Push off cleanly'), kind: 'ding_yes', gain: -7, pitch: 2},
    {t: T('Land on target'), kind: 'buzz_no', gain: -6},
    {t: tNudge + 0.05, kind: 'rewind', gain: -4},
    {t: tNudge + 1.0, kind: 'slider_tick', gain: -7},                      // the launch vector is nudged
    {t: tNudge + 1.3, kind: 'slider_tick', gain: -8, pitch: 2},
    {t: a2 - 0.62, kind: 'robot_push', gain: -9, pitch: 2},
    {t: a2 + 0.95, kind: 'robot_step', gain: -4},
    {t: a2 + 1.0, kind: 'ding_yes', gain: -5},
    ...[0, 1, 2].map((k) => ({t: tCopies + 0.4 + k * 0.17 + 0.95, kind: k === 0 ? 'sim_fall' : 'robot_step', gain: -9})),
    {t: tFall + 1.0 + 0.95, kind: 'sim_fall', gain: -3},
    {t: tFall + 1.0 + 1.62, kind: 'sim_fall', gain: -5, pitch: -3},
    {t: tStunt + 1.0 + 0.95, kind: 'robot_step', gain: -6},
    {t: tStunt + 1.25 + 0.95, kind: 'robot_step', gain: -7, pitch: 1},
    ...steps(tPolicy - 0.5 + 0.4, Math.max(0, Math.floor((tFoot - tPolicy) / 0.8)), 0.8, 'robot_step', -13),
    {t: tPolicy + 0.9, kind: 'whoosh_soft', gain: -10, pitch: 3},          // into the head sensor
    {t: tPolicy + 1.2, kind: 'sim_blip', gain: -7},
    {t: T('into motor commands'), kind: 'servo_whir', gain: -9, pitch: 3},  // out through the knee actuator
    {t: T('lands a little early'), kind: 'tag_clink', gain: -5, pitch: -4},
    {t: T('adjusts the knee'), kind: 'servo_whir', gain: -7},
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
  const rTO = REAL_START + 0.62, rSwitch = rTO + 0.3, rBack = tMessy + 0.05;
  return [
    bed('amb_sim', REAL_START, rSwitch + 0.2, -4),
    {t: REAL_START, kind: 'robot_push', gain: -7, pitch: 1},
    {t: rTO - 0.02, kind: 'servo_whir', gain: -8},
    {t: rSwitch - 0.05, kind: 'whoosh_soft', gain: -6, pitch: -4},          // the foundry resolves around the jump
    {t: rSwitch + 0.15, kind: 'sub_boom', gain: -16, pitch: -4},            // time holds
    bed('furnace_roar', rSwitch, rBack + 0.4, -5),
    {t: tSlack + 0.1, kind: 'servo_whir', gain: -6, pitch: -2},
    {t: tSlack + 0.45, kind: 'tag_clink', gain: -9, pitch: -8},
    {t: tFloor + 0.2, kind: 'tag_clink', gain: -8, pitch: -6},
    {t: tNoisy, kind: 'static', gain: -5},
    {t: tNever + 0.2, kind: 'crane_chain', gain: -10, pitch: -2},
    {t: rBack, kind: 'sim_blip', gain: -5},                                 // …and back to the stage
    {t: rBack + 0.05, kind: 'whoosh_soft', gain: -8, pitch: 3},
    {t: rBack + 0.94, kind: 'robot_step', gain: -5},
    bed('amb_sim', rBack + 0.2, tAir, -3),
    {t: tWeight - 0.1 + 0.6, kind: 'sim_fall', gain: -5},
    {t: tWeight + 1.0 + 0.6, kind: 'sim_fall', gain: -6, pitch: 2},
    {t: tWeight + 2.0 + 0.75, kind: 'robot_step', gain: -6},
    ...[0, 1, 2, 3].map((k) => ({t: tRound + k * 0.55, kind: 'pop_tick', gain: -9, pitch: k})),
    {t: tPerfect + 1.05, kind: 'robot_step', gain: -5},
    {t: tPerfect + 1.15, kind: 'ding_yes', gain: -6},
    bed('amb_room', tAir, tMessyF, -4),
    {t: tTO - 0.62, kind: 'robot_push', gain: -6, pitch: -2},
    {t: tTO + 0.85, kind: 'airbag', gain: -7},
    bed('furnace_roar', tMessyF, REAL_END + 0.3, -2),
    {t: tKnock - 0.2, kind: 'elec_arc', gain: -3},
    {t: tKnock, kind: 'static', gain: -4},
    {t: PAYOFF_TO - 0.65, kind: 'robot_push', gain: -3},
    {t: PAYOFF_TO - 0.02, kind: 'servo_whir', gain: -5},
  ];
};

const prove = (): Cue[] => {
  const tSurvive = T('survive') - 0.12, tBut = T('But it was one') - 0.1, tNota = T('That’s not a robot') - 0.1, tWalkInto = T('walk into any factory');
  return [
    bed('furnace_roar', PROVE_START, tNota, -3),
    {t: PROVE_START + 0.05, kind: 'sub_boom', gain: -16, pitch: -3},
    {t: tSurvive + 0.1, kind: 'whoosh_soft', gain: -8, pitch: -5},
    ...entry(PAYOFF_IN, -13),                                  // under "brutal environment": kept below the word
    {t: tBut - 0.45, kind: 'whoosh_soft', gain: -13, pitch: -6},           // the camera rises off the ripple
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
    ...entry(E.IN, -12),                                       // under "retiring hardware"
    {t: E.T_THESE + 0.2, kind: 'whoosh_soft', gain: -14, pitch: -7},       // the crane up into the plan view
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

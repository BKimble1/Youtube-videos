// V4 sound cue sheet. Every time comes from the narration cues (v3/cues.ts) or from the event times the V4 shots export,
// so effects stay locked to the animation. Bundled by tools/v4/collect_sfx_v4.mjs → audio/v4/sfx_cues_v4.json.
import {T, NARR_END, blockStart} from '../v3/cues';
import {OPEN_END, JUMP1} from './shots/Opening';
import {WHY_A_END} from './shots/WhyA';
import {WHY_END} from './shots/Why';
import {WHYB_EV} from './shots/WhyB';
import {FILM_START, FILM_END} from './shots/Film';
import {TRAIN_START, TRAIN_END, TRAIN_EV as TE} from './shots/Train';
import {REAL_START, REAL_END, REAL_EV as RE} from './shots/Real';
import {PROVE_START, PROVE_END} from './shots/Prove';
import {END_START, END_EV as EE} from './shots/End';

export type Cue = {t: number; kind: string; gain?: number; pitch?: number; dur?: number};
const bed = (kind: string, a: number, b: number, gain = 0): Cue => ({t: a, kind, dur: b - a, gain});
const steps = (t0: number, n: number, every: number, kind = 'step_grate', gain = -6): Cue[] =>
  Array.from({length: n}, (_, k) => ({t: t0 + k * every, kind, gain: gain + (k % 2 ? -1.5 : 0), pitch: k % 2 ? -0.6 : 0.4}));
const entry = (t: number, g = 0): Cue[] => [
  {t: t - 0.03, kind: 'sub_boom', gain: g},
  {t, kind: 'molten_heavy', gain: g},
  {t: t + 0.25, kind: 'sizzle', dur: 3.4, gain: g - 2},
];
const roll = (t: number, g = 0): Cue[] => [{t, kind: 'paper_slide', gain: -5 + g, pitch: -3}, {t: t + 0.05, kind: 'whoosh_soft', gain: -7 + g, pitch: -4}];

const opening = (): Cue[] => {
  const T_IN = T('steel'), T_FIG = T('Figure, the robot') - 0.05, T_SPOKE = T('and a spokesperson'), T_HOW = T('And how does') - 0.05;
  return [
    bed('furnace_roar', 0, T_HOW + 0.9, 7),
    {t: 0.02, kind: 'robot_push', gain: 2},
    {t: 0.06, kind: 'step_grate', gain: -1},
    {t: 0.36, kind: 'servo_whir', gain: -3},
    {t: 2.45, kind: 'whoosh_soft', gain: -6, pitch: -4},
    {t: T_IN - 0.03, kind: 'sub_boom', gain: -15}, {t: T_IN, kind: 'molten_heavy', gain: -15},   // under "steel": kept below the voice
    {t: T_IN + 0.25, kind: 'sizzle', dur: 3.4, gain: -22},
    {t: T_FIG + 0.3, kind: 'pop_tick', gain: -6},
    {t: T_SPOKE + 0.3, kind: 'pop_tick', gain: -6, pitch: 1},
    {t: T_HOW - 0.05, kind: 'trace', gain: -8},                               // the ripple is inked into a target
    {t: T_HOW + 0.55, kind: 'sim_blip', gain: -4},                            // the scenery turns into the stage
    {t: T_HOW + 0.6, kind: 'whoosh_soft', gain: -10, pitch: 3},
    bed('amb_sim', T_HOW + 0.6, OPEN_END + 0.25, -2),
    {t: T('jump it only'), kind: 'whoosh_soft', gain: -12, pitch: 4},        // the arc draws
    {t: T('once'), kind: 'ding_yes', gain: -8},
    {t: T('once') + 0.2, kind: 'whoosh_soft', gain: -14, pitch: -2},         // push to the chest
  ];
};

const whyA = (): Cue[] => {
  const WHY0 = T('Start with') - 0.12, S2B = T('Figure says they spent') - 0.1, S2C = T('But as its newer') - 0.06, S2D = T('So what do you do') - 0.12;
  const fleetT = T('fleet grew') - 0.15;
  return [
    bed('amb_room', OPEN_END, WHY_A_END + 1.0, -3),
    {t: OPEN_END, kind: 'tag_clink', gain: -10, pitch: -5},                   // the matched chest cut
    {t: T('These are') + 0.2, kind: 'pop_tick', gain: -7},
    {t: WHY0 + 2.1, kind: 'servo_whir', gain: -11, pitch: -2},
    {t: WHY0 + 4.3, kind: 'tag_clink', gain: -12, pitch: 5},                  // fingers close
    {t: S2B + 0.3, kind: 'pop_tick', gain: -6},
    {t: S2B + 0.15, kind: 'servo_whir', gain: -11},
    {t: S2B + 0.55, kind: 'tag_clink', gain: -9, pitch: 2},                   // grip
    {t: S2B + 2.05, kind: 'tag_clink', gain: -8, pitch: -3},                  // panel on the belt
    {t: S2C, kind: 'whoosh_soft', gain: -10, pitch: 2},                       // the F.03 slides in
    {t: S2C + 0.5, kind: 'pop_tick', gain: -7},
    ...[0, 1, 2, 3, 4].map((k) => ({t: fleetT + k * 0.16 + 0.1, kind: 'pop_tick', gain: -11, pitch: k})),
    {t: T('keeping the old') + 0.12, kind: 'buzz_no', gain: -11},
    {t: T('stopped making') - 0.05, kind: 'servo_whir', gain: -10, pitch: -4},  // the belt carries it away
    {t: S2D + 0.1, kind: 'paper_slide', gain: -12, pitch: -6},                // the stand rolls in
    ...[0, 1, 2].map((k) => ({t: S2D + 0.55 + k * 0.25, kind: 'card_flick', gain: -9, pitch: -4 - k})),
  ];
};

const whyB = (): Cue[] => {
  const {SW0, SW1, SW2, TOSS0, TOSS1, crankAngle} = WHYB_EV;
  const T_SELL = T('Sell it'), T_PACK = T('packed with'), T_ACT = T('like the actuators'), T_MOVE = T('move the joints');
  const T_BLDG = T('the building'), T_APART = T('Take them apart') - 0.08, T_FSAYS = T('Figure says doing that'), T_EVERY = T('for every robot');
  const T_EAT = T('would eat'), T_DELAY = T('delay the next'), T_MELT = T('Melt them') - 0.08, T_SIMPLE = T('Simple'), T_EXCEPT = T('Except a robot');
  const T_ONOWN = T('on its own'), T_BRINGS = T('brings its battery'), T_BATT = T('battery along'), T_WHERE = T('Figure says foundries') - 0.1;
  const T_US = T('U.S.'), T_MEX = T('Mexico'), T_IMATRA = T('One in Imatra'), T_YES = T('said yes'), T_RECYCLE = T('Recycling old');
  const T_NORMAL = T('is normal'), T_FILM = T('Bringing a film'), T_NOT = T('is not');
  const T_GL = T_MELT + 0.72, T_IN2 = T_RECYCLE - 0.62;
  const cues: Cue[] = [
    {t: T_SELL, kind: 'pop_tick', gain: -6},
    ...[0, 0.12, 0.24, 0.36, 0.5].map((d, k) => ({t: T_SELL + 0.5 + d, kind: 'tag_clink', gain: -9, pitch: -8 + k})),   // crate pieces land
    {t: T_PACK - 0.3, kind: 'tag_clink', gain: -10, pitch: 4},                // FOR SALE? tag
    {t: T_ACT - 0.6, kind: 'sim_blip', gain: -8, pitch: -2},                  // the lens opens on the knee
    {t: T_MOVE - 0.05, kind: 'servo_whir', gain: -6},
    {t: SW0 + 0.08, kind: 'whoosh_soft', gain: -4, pitch: -6},                // the crate door crosses the lens…
    {t: SW1, kind: 'shutter_slam', gain: -6, pitch: -5},                      // …and slams shut
    {t: SW2 + 0.02, kind: 'stamp', gain: -2},
    {t: SW2 + 0.35, kind: 'padlock', gain: -3},
    {t: T_BLDG + 0.3, kind: 'shutter_slam', gain: -12},                        // the exit door comes down
    {t: T_APART + 0.3, kind: 'whoosh_soft', gain: -10, pitch: 2},
    {t: T_APART + 0.45, kind: 'card_flick', gain: -5, pitch: -10},            // the front falls open
    {t: T_APART + 0.47, kind: 'sub_boom', gain: -20, pitch: 4},
    ...[0, 1, 2].map((k) => ({t: T_APART + 1.0 + k * 0.14, kind: 'tag_clink', gain: -12, pitch: 4 + k})),   // wrench
    {t: T_FSAYS + 0.05, kind: 'padlock', gain: -7, pitch: 4},                 // the actuator comes out
    {t: TOSS0 + 0.05, kind: 'whoosh_soft', gain: -8, pitch: 3},
    {t: TOSS1, kind: 'tag_clink', gain: -6, pitch: -2},                       // it lands on the crank
    {t: TOSS1 + 0.04, kind: 'padlock', gain: -9, pitch: -2},
    ...Array.from({length: 10}, (_, i) => ({t: T_EVERY - 0.1 + (9 - i) * 0.08 + 0.12, kind: 'pop_tick', gain: -14, pitch: i % 5})),
    {t: T_EAT - 0.1, kind: 'servo_whir', gain: -7, pitch: -3},
    {t: T_DELAY + 0.6, kind: 'stamp', gain: -6},
    {t: T_MELT - 0.25, kind: 'whoosh_soft', gain: -8, pitch: 2},
    bed('furnace_roar', T_MELT + 0.2, T_WHERE + 0.6, -6),                     // the heat swells under the push (sound bridge)
    {t: T_GL - 0.2, kind: 'sizzle', dur: 1.4, gain: -4},
    {t: T_GL, kind: 'sub_boom', gain: -14},
    {t: T_SIMPLE, kind: 'ding_yes', gain: -7},
    {t: T_EXCEPT + 0.4, kind: 'buzz_no', gain: -8},
    ...steps(T_EXCEPT - 0.15, 7, (T_ONOWN + 0.15 - T_EXCEPT) / 7, 'step_grate', -7),
    {t: T_BRINGS - 0.1, kind: 'sim_blip', gain: -8, pitch: -3},
    {t: T_BATT, kind: 'elec_arc', gain: -14},
    {t: T_WHERE, kind: 'whoosh_soft', gain: -11, pitch: -3},                  // out through the doorway
    {t: T_WHERE + 1.15, kind: 'shutter_slam', gain: -11},
    bed('amb_room', T_WHERE + 0.3, T_IN2 + 0.4, -8),
    {t: T_US + 0.0, kind: 'knee_tap', gain: -8, pitch: -6}, {t: T_US + 0.12, kind: 'knee_tap', gain: -9, pitch: -6},
    {t: T_US + 0.1, kind: 'buzz_no', gain: -9},
    {t: T_MEX + 0.05, kind: 'knee_tap', gain: -8, pitch: -6}, {t: T_MEX + 0.17, kind: 'knee_tap', gain: -9, pitch: -6},
    {t: T_MEX + 0.15, kind: 'buzz_no', gain: -9, pitch: -1},
    {t: T_IMATRA + 0.3, kind: 'crane_chain', gain: -10, pitch: 2},            // Imatra's shutter goes up
    {t: T_YES, kind: 'ding_yes', gain: -6},
    {t: T_IN2, kind: 'whoosh_soft', gain: -10, pitch: 2},
    bed('furnace_roar', T_IN2 + 0.4, WHY_END + 0.3, -5),
    {t: T_NORMAL - 0.05, kind: 'ding_yes', gain: -9, pitch: -2},
    {t: T_FILM + 0.38, kind: 'clapper', gain: -3},
    {t: T_FILM + 0.66, kind: 'pop_tick', gain: -6, pitch: -8}, {t: T_FILM + 0.81, kind: 'pop_tick', gain: -6, pitch: -9},   // lights on
    {t: T_NOT, kind: 'buzz_no', gain: -10, pitch: -2},
    {t: T_NOT + 0.4, kind: 'whoosh_soft', gain: -8, pitch: 1},                // the slate rises over the lens
  ];
  // the clock ticks faster as the crank turns; calendar pages flip on each new month
  for (let k = 0; k < 14; k++) {
    const t = T_EAT + 0.2 + k * Math.max(0.07, 0.24 - k * 0.013);
    if (t < T_DELAY + 0.9) cues.push({t, kind: 'counter_tick', gain: -14, pitch: k * 0.2});
  }
  let last = 2;
  for (let t = T_DELAY - 0.4; t < T_DELAY + 0.8; t += 1 / 30) {
    const m = 2 + 7 * Math.pow(Math.min(1, (t - (T_DELAY - 0.4)) / 1.2), 3);
    if (Math.floor(m) > last) { last = Math.floor(m); cues.push({t, kind: 'card_flick', gain: -9, pitch: last % 2 ? 1 : -1}); }
  }
  // scrap tipped into the ladle
  for (let i = 0; i < 9; i++) {
    const t = T_IN2 + 0.6 - 0.2 + i * 0.5 + 0.5;
    if (t < T_FILM) cues.push({t, kind: 'sizzle', dur: 0.7, gain: -12}, {t, kind: 'tag_clink', gain: -16, pitch: -9});
  }
  void crankAngle;
  return cues;
};

const film = (): Cue[] => {
  const tPost = T('In August') - 0.1, tReply = T('Arnold Schwarzenegger replied') - 0.05, tT2 = T('In Terminator Two') - 0.12;
  const tReason = T('which is almost exactly') - 0.1, tBiz = T('Hollywood wrote') - 0.1, tHint = T('Figure took the hint') - 0.1;
  const tX = tReason + 0.25, tFig = T('Figure’s reason');
  return [
    {t: FILM_START, kind: 'whoosh_soft', gain: -9, pitch: 2},                 // the slate lifts off the phone
    bed('amb_room', FILM_START, tT2, -6),
    {t: FILM_START + 0.15, kind: 'paper_slide', gain: -9},
    {t: tPost, kind: 'pop_tick', gain: -5},
    {t: tReply + 0.1, kind: 'pop_tick', gain: -3, pitch: 3},
    {t: tT2 - 0.3, kind: 'card_flick', gain: -7, pitch: -2},
    {t: tT2 + 0.35, kind: 'clapper', gain: -2},
    {t: tT2 + 0.9, kind: 'crane_chain', gain: -8},
    {t: tT2 + 2.2, kind: 'sizzle', dur: 1.6, gain: -10},
    {t: tX - 0.3, kind: 'crane_chain', gain: -6},                             // a chain passes the lens
    {t: tX - 0.2, kind: 'whoosh_soft', gain: -8, pitch: -6},
    bed('furnace_roar', tX - 0.2, FILM_END + 0.3, -8),
    {t: tReason + 0.55, kind: 'pop_tick', gain: -8},
    {t: tFig - 0.1, kind: 'pop_tick', gain: -8, pitch: 2},
    {t: tFig + 0.2, kind: 'ding_yes', gain: -11, pitch: -3},
    {t: tBiz, kind: 'paper_slide', gain: -6},
    {t: T('in nineteen ninety-one') + 0.1, kind: 'stamp', gain: -3},
    {t: tHint + 0.1, kind: 'paper_slide', gain: -10, pitch: 2},
    {t: tHint + 0.25, kind: 'servo_whir', gain: -12, pitch: -5},              // the jib swings in
    {t: tHint + 0.5, kind: 'pop_tick', gain: -7},
  ];
};

const train = (): Cue[] => {
  const {A1, A2, A3, FP, SG, REW, T_TAP, T_WIPE, keyStyle} = TE;
  const T_HARD = T('Now the hard part'), T_REH = T('can’t rehearse'), T_FURN = T('real furnace'), T_HOW = T('Here’s how that kind');
  const T_SCORE = T('gets a score'), T_BAL = T('Did it stay'), T_PUSH = T('Push off cleanly'), T_LAND = T('Land on target'), T_NUDGE = T('The software nudges');
  const T_OVER = T('over and over'), T_NOBODY = T('nobody files'), T_REF = T('as a reference'), T_POL = T('a policy');
  const T_SENSES = T('the robot senses'), T_MOTOR = T('into motor commands'), T_MANY = T('many times a second'), T_IF = T('If a foot lands');
  const T_EARLY = T('a little early'), T_CATCH = T('sensors catch it'), T_ADJ = T('adjusts the knee'), T_TIPS = T('before the robot tips');
  const T_WISH = T('Not a wish'), T_PLAN = T('not a plan'), T_STUNT = T('Figure says it used');
  const tossT = T_HOW + 0.85;
  const cues: Cue[] = [
    bed('furnace_roar', TRAIN_START, T_WIPE + 0.4, -5),
    {t: T_HARD + 0.1, kind: 'sub_boom', gain: -22},
    {t: T_REH + 0.2, kind: 'whoosh_soft', gain: -12, pitch: 4},               // the practice arc draws
    {t: T_FURN - 0.05, kind: 'marker_x', gain: -4},
    {t: T_FURN, kind: 'buzz_no', gain: -9},
    ...roll(T_WIPE),
    {t: T_WIPE + 0.35, kind: 'sim_blip', gain: -7},
    bed('amb_sim', T_WIPE + 0.3, TRAIN_END + 0.3, -1),
    {t: T_WIPE + 0.55, kind: 'pop_tick', gain: -7},
    {t: T_HOW + 0.1, kind: 'pop_tick', gain: -7, pitch: 2},
    {t: tossT, kind: 'whoosh_soft', gain: -9, pitch: 5},                      // the target is tossed onto the pad
    {t: tossT + 0.55, kind: 'tag_clink', gain: -7, pitch: 3},
    {t: A1.tPush + 0.1, kind: 'robot_push', gain: -8, pitch: 2},
    {t: A1.tEnd + 0.05, kind: 'sim_fall', gain: -4},
    {t: T_SCORE, kind: 'pop_tick', gain: -6},
    {t: T_BAL + 0.4, kind: 'buzz_no', gain: -8},
    {t: T_PUSH + 0.35, kind: 'ding_yes', gain: -8},
    {t: T_LAND + 0.4, kind: 'buzz_no', gain: -8, pitch: -1},
    {t: REW.a1[0], kind: 'rewind', gain: -4},
    ...[0, 1, 2].map((k) => ({t: T_NUDGE + 0.45 + k * 0.3, kind: 'slider_tick', gain: -7, pitch: k})),
    {t: A2.tPush + 0.1, kind: 'robot_push', gain: -8, pitch: 2},
    {t: A2.tEnd, kind: 'robot_step', gain: -3},
    ...[0, 1, 2].map((k) => ({t: A2.tEnd + 0.25 + k * 0.12, kind: 'ding_yes', gain: -9, pitch: k * 2})),
    {t: REW.a2[0], kind: 'rewind', gain: -8},
    {t: A3.tPush + 0.1, kind: 'robot_push', gain: -11, pitch: 2},
    {t: A3.tEnd, kind: 'robot_step', gain: -8},
    {t: T_OVER + 0.3, kind: 'whoosh_soft', gain: -11, pitch: -2},            // the frame becomes one tile of many
    ...[0.4, 0.75, 1.05, 1.4, 1.8, 2.3, 2.7].map((d, k) => ({t: T_OVER + 1.2 + d, kind: k % 3 === 1 ? 'sim_fall' : 'robot_step', gain: -15, pitch: k - 3})),
    {t: REW.a3[0], kind: 'rewind', gain: -12},
    {t: FP.tPush + 0.1, kind: 'robot_push', gain: -9, pitch: 2},
    {t: FP.tEnd + 0.15, kind: 'sim_fall', gain: -2},
    {t: FP.tEnd + 0.45, kind: 'sim_fall', gain: -7, pitch: -3},
    {t: T_NOBODY + 0.3, kind: 'paper_swish', gain: -6},
    {t: REW.fp[0], kind: 'rewind', gain: -8},
    {t: T_STUNT + 0.1, kind: 'pop_tick', gain: -7},
    {t: T_REF - 0.3, kind: 'paper_slide', gain: -8},
    {t: SG.tPush + 0.1, kind: 'robot_push', gain: -8, pitch: 2},
    {t: SG.tEnd, kind: 'robot_step', gain: -4},
    ...keyStyle.map((t, k) => ({t, kind: 'ding_yes', gain: -12, pitch: 2 + k * 2})),
    {t: REW.sg[0], kind: 'rewind', gain: -8},
    {t: T_POL, kind: 'sim_blip', gain: -5},
    {t: T_SENSES - 0.2, kind: 'trace', gain: -10},
    {t: T_MOTOR, kind: 'servo_whir', gain: -10, pitch: 3},
    {t: T_IF - 0.85, kind: 'slider_tick', gain: -6, pitch: -4},              // the lever
    {t: T_IF - 0.7, kind: 'servo_whir', gain: -10, pitch: -4},                // the plate rises
    {t: T_EARLY, kind: 'tag_clink', gain: -4, pitch: -4},                     // the foot lands early
    {t: T_CATCH, kind: 'sim_blip', gain: -5, pitch: 3},
    {t: T_ADJ, kind: 'servo_whir', gain: -6},
    {t: T_TIPS + 0.35, kind: 'ding_yes', gain: -7},
    {t: T_WISH + 0.3, kind: 'marker_x', gain: -8},
    {t: T_PLAN + 0.2, kind: 'marker_x', gain: -8, pitch: 1},
    {t: T_TAP, kind: 'knee_tap', gain: -2},
    {t: T_TAP + 0.05, kind: 'servo_whir', gain: -9, pitch: 4},
  ];
  // the policy pulses: slow, then many times a second
  for (let t = T_POL + 0.6; t < T_IF - 0.9; t += t < T_MANY ? 0.9 : 0.22) cues.push({t, kind: 'counter_tick', gain: t < T_MANY ? -18 : -20, pitch: 3});
  return cues;
};

const real = (): Cue[] => {
  const {T_SIMR, T_FIX, T_CUT, HJ_PUSH, PAYOFF_T0, T_DIDGET} = RE;
  const tSlack = T('Real joints have slack') - 0.05, tFloor = T('floors aren’t perfectly') - 0.05, tNoisy = T('and sensors are noisy') - 0.05;
  const tNever = T('And Figure says this jump') - 0.1, tWeight = T('Change the weight'), tFoot = T('the footing'), tTime = T('the timing');
  const tRound = T('a little every round'), tPerfect = T('one perfect world'), tDont = T('We don’t know which'), tBags = T('giant airbags');
  const tEmi = T('electromagnetic noise'), tCams = T('knocked out cameras'), tElec = T('other electronics'), tKept = T('kept running');
  return [
    bed('amb_sim', REAL_START, T_SIMR + 0.4, -4),
    ...roll(T_SIMR),
    bed('furnace_roar', T_SIMR + 0.3, T_FIX + 0.3, -4),
    {t: tSlack + 0.2, kind: 'servo_whir', gain: -7, pitch: -2},
    {t: tSlack + 0.35, kind: 'pop_tick', gain: -8},
    {t: tFloor + 0.15, kind: 'tag_clink', gain: -7, pitch: -6},
    {t: tFloor + 0.5, kind: 'servo_whir', gain: -10, pitch: 1},
    {t: tNoisy, kind: 'static', gain: -6},
    {t: tNever + 0.2, kind: 'crane_chain', gain: -11, pitch: -2},
    ...roll(T_FIX - 0.1),
    bed('amb_sim', T_FIX + 0.3, T_CUT + 0.1, -3),
    {t: tWeight + 0.3, kind: 'padlock', gain: -6, pitch: -3},
    {t: tFoot, kind: 'trace', gain: -9, pitch: 4},
    {t: tFoot + 0.4, kind: 'sim_fall', gain: -13, pitch: 3},
    ...[0, 0.33, 0.66, 1.0].map((d) => ({t: tTime + d, kind: 'counter_tick', gain: -12})),
    ...[0, 1, 2, 3].map((k) => ({t: tRound + 0.15 + k * 0.18, kind: 'card_flick', gain: -8, pitch: k - 1})),
    {t: tPerfect - 0.5, kind: 'pop_tick', gain: -7},
    {t: tPerfect + 0.45, kind: 'marker_x', gain: -5},
    {t: tDont, kind: 'pop_tick', gain: -6, pitch: -2},
    {t: T_CUT - 0.5, kind: 'whoosh_soft', gain: -13, pitch: -4},              // push to the foot; match cut to the ledge
    bed('amb_room', T_CUT, T_DIDGET, -3),
    {t: T_CUT, kind: 'step_grate', gain: -10},
    {t: HJ_PUSH + 0.1, kind: 'robot_push', gain: -5},
    {t: HJ_PUSH + 0.5, kind: 'whoosh_soft', gain: -8, pitch: -5},
    {t: tBags + 0.05, kind: 'airbag', gain: -4},
    ...roll(T_DIDGET - 0.3, 1),
    bed('furnace_roar', T_DIDGET, REAL_END + 0.3, -1),
    {t: tEmi - 0.1, kind: 'elec_arc', gain: -9},
    {t: tEmi + 0.2, kind: 'static', gain: -12},
    {t: tCams, kind: 'static', gain: -5},
    {t: tCams + 0.1, kind: 'elec_arc', gain: -4},
    {t: tElec, kind: 'elec_arc', gain: -6, pitch: 2},
    {t: tKept - 0.9, kind: 'sim_blip', gain: -6},
    {t: PAYOFF_T0 + 0.1, kind: 'robot_push', gain: -3},
    {t: tKept, kind: 'servo_whir', gain: -6},
  ];
};

const prove = (): Cue[] => {
  const tSurv = T('survive') + 0.15, tWhat = T('So what does it prove'), tBrutal = T('a brutal environment'), tBut = T('But it was one');
  const tNot = T('That’s not a robot'), tAny = T('walk into any factory'), tWork = T('work things out'), tPrep = T('people prepared');
  return [
    bed('furnace_roar', PROVE_START, tNot, -4),
    {t: PROVE_START + 0.1, kind: 'sub_boom', gain: -23, pitch: -3},           // the push-off hangs
    {t: tWhat + 0.1, kind: 'pop_tick', gain: -6, pitch: -3},
    {t: tSurv - 0.5, kind: 'whoosh_soft', gain: -9, pitch: -5},
    ...entry(tSurv, -15),
    {t: tBrutal, kind: 'ding_yes', gain: -9},
    {t: tBut - 0.3, kind: 'whoosh_soft', gain: -13, pitch: -6},              // rise off the ripple
    {t: T('one movement'), kind: 'pop_tick', gain: -8},
    {t: T('one kind of target'), kind: 'tag_clink', gain: -8, pitch: 3},
    ...[0, 1, 2, 3].map((k) => ({t: tPrep - 0.1 + k * 0.07, kind: 'tag_clink', gain: -13, pitch: -6 + k})),
    {t: T('and supervised') + 0.1, kind: 'pop_tick', gain: -8, pitch: 1},
    {t: tNot - 0.35, kind: 'paper_slide', gain: -6, pitch: -5},               // the set splits like stage flats
    {t: tNot - 0.3, kind: 'whoosh_soft', gain: -9, pitch: -3},
    bed('amb_room', tNot - 0.2, PROVE_END + 0.3, -4),
    ...[0, 1, 2, 3, 4, 5].map((i) => ({t: tAny + i * 0.14, kind: 'pop_tick', gain: -11, pitch: 2 + i})),
    {t: tWork - 0.1, kind: 'marker_x', gain: -6},
  ];
};

const end = (): Cue[] => {
  const {W0, W1, EJ_T0, T_STING, T_LEAPS} = EE;
  const tShape = T('Partly, it’s the shape'), tArms = T('arms, legs'), tLegs = T('legs and a head'), tHead = T('a head walks') + 0.1;
  const tLooks = T('it looks like someone'), tBut = T('But the choice wasn’t'), tPeople = T('People picked the ending');
  const tBuilt = T('built the target'), tWrote = T('wrote the score'), tPolicy = T('The policy just got'), tReach = T('reaching it');
  const tDoes = T('Does retiring hardware'), tStuck = T('stuck the landing');
  return [
    {t: END_START, kind: 'paper_slide', gain: -7, pitch: -5},                 // the flats close
    bed('furnace_roar', END_START, tPeople, -4),
    {t: tShape - 0.05, kind: 'sub_boom', gain: -16},                          // the flare: the robot becomes a silhouette
    {t: tShape, kind: 'trace', gain: -7},
    {t: tArms, kind: 'pop_tick', gain: -9},
    {t: tLegs, kind: 'pop_tick', gain: -9, pitch: 1},
    {t: tHead, kind: 'pop_tick', gain: -9, pitch: 2},
    ...steps(W0 + 0.1, 4, (W1 - W0) / 4, 'step_grate', -6),
    {t: EJ_T0 + 0.1, kind: 'robot_push', gain: -3},
    {t: T_LEAPS + 0.08, kind: 'servo_whir', gain: -6},
    {t: T_LEAPS + 0.3, kind: 'sub_boom', gain: -20, pitch: -4},               // the leap holds
    {t: tLooks, kind: 'pop_tick', gain: -7, pitch: -1},
    {t: tBut, kind: 'pop_tick', gain: -3, pitch: -7},                         // the choice bubble pops
    {t: tBut + 0.02, kind: 'whoosh_soft', gain: -11, pitch: 4},
    bed('amb_room', tPeople - 0.3, tPolicy, -5),
    {t: tPeople + 0.1, kind: 'clapper', gain: -9},
    {t: tBuilt, kind: 'tag_clink', gain: -7, pitch: 3},
    {t: tWrote, kind: 'typing', gain: -9},
    {t: T('the score') + 0.45, kind: 'ding_yes', gain: -8},
    bed('amb_sim', tPolicy - 0.2, tDoes, -5),
    {t: tPolicy + 0.1, kind: 'whoosh_soft', gain: -12, pitch: 3},
    {t: tPolicy + 0.2, kind: 'sim_blip', gain: -9},
    {t: tReach, kind: 'ding_yes', gain: -6},
    bed('furnace_roar', tDoes - 0.25, T_STING + 0.4, -3),
    {t: tStuck - 1.4, kind: 'whoosh_soft', gain: -14, pitch: -7},             // up over the surface into the plan view
    {t: tStuck, kind: 'ding_yes', gain: -9, pitch: -5},
    {t: T_STING, kind: 'sting_end', gain: -2},
  ];
};

export const collectV4 = () => {
  const cues = [...opening(), ...whyA(), ...whyB(), ...film(), ...train(), ...real(), ...prove(), ...end()].sort((a, b) => a.t - b.t);
  return {
    fps: 30,
    totalFrames: Math.round((NARR_END + 2.95) * 30),
    narrationEnd: NARR_END,
    sections: {OPEN_END, WHY_END, FILM_START, FILM_END, TRAIN_START, TRAIN_END, REAL_START, REAL_END, PROVE_START, PROVE_END, END_START, B07: blockStart('B07')},
    cues,
  };
};
void JUMP1;

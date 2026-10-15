// V6 sound cue sheet. Every time comes from the V5 narration cues (v5/cues.ts) or from the event times the V5 shots
// export, so effects stay locked to the animation. Short mechanical, contact, reset and impact sounds; at most one
// whoosh per camera move that needs it. Bundled by tools/v6/collect_sfx_v6.mjs → audio/v6/sfx_cues_v6.json.
import {T, NARR_END} from './cues';
import {HOOK_END, T_HIT, T_LAND2, HOOK_EV as HE} from './shots/Hook';
import {FACTORY_END, FACTORY_EV as FE} from './shots/Factory';
import {OPTIONS_END, OPTIONS_EV as OE, OPTIONS_TIMES as OT} from './shots/Options';
import {IMATRA_START, IMATRA_END} from './shots/Imatra';
import {POST_END, POST_EV as PE} from './shots/Post';
import {TRAIN_START, TRAIN_END, TRAIN_EV as TE} from './shots/Train';
import {REAL_START, REAL_END, REAL_EV as RE} from './shots/Real';
import {PROVE_START, PROVE_END, PROVE_EV as VE} from './shots/Prove';
import {END_START, END_HOLD, END_EV as EE} from './shots/End';
import {IMATRA_EV} from './shots/Imatra';
import {OPTIONS_WALK} from './shots/Options';
import {FACTORY_WALK} from './shots/Factory';
import {footfalls} from './rig/stop';

export type Cue = {t: number; kind: string; gain?: number; pitch?: number; dur?: number};
const bed = (kind: string, a: number, b: number, gain = 0): Cue => ({t: a, kind, dur: b - a, gain});
const steps = (t0: number, t1: number, every: number, kind = 'step_grate', gain = -8): Cue[] => {
  const out: Cue[] = [];
  for (let k = 0, t = t0; t < t1; k++, t += every) out.push({t, kind, gain: gain + (k % 2 ? -1.5 : 0), pitch: k % 2 ? -0.6 : 0.4});
  return out;
};
/** One step sound per actual footfall of a walk (alternating pitch so the feet don't sound identical). */
const falls = (ts: number[], kind = 'step_grate', gain = -8, from = -1): Cue[] =>
  ts.filter((t) => t >= from).map((t, k) => ({t, kind, gain: gain + (k % 2 ? -1.5 : 0) + (k === ts.length - 1 ? -2 : 0), pitch: k % 2 ? -0.6 : 0.4}));
const entry = (t: number, g = 0, sizzle = 2.4): Cue[] => [
  {t: t - 0.03, kind: 'sub_boom', gain: g},
  {t, kind: 'molten_heavy', gain: g},
  {t: t + 0.22, kind: 'sizzle', dur: sizzle, gain: g - 4},
];
/** Real time at which the factory's plant clock reaches tau. */
const realAt = (tau: number) => {
  let lo = HOOK_END - 1, hi = FACTORY_END + 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (FE.tauOf(mid) < tau) lo = mid; else hi = mid;
  }
  return lo;
};

const hook = (): Cue[] => {
  const {J0, J1, J2, RW0, T_SWAP, LAND1} = HE;
  return [
    bed('furnace_roar', 0, T_SWAP + 0.2, 4),
    {t: 0.03, kind: 'servo_whir', gain: 0},                                   // one tight mechanical sound: already preparing
    {t: J0.tPush, kind: 'robot_push', gain: -2},
    {t: J0.tPush + 0.06, kind: 'step_grate', gain: -5},                       // the planted push
    ...entry(T_HIT, -11, 1.2),                                                 // under "metal": kept below the voice
    {t: T_HIT + 0.5, kind: 'trace', gain: -9},                                // V6: the material wipe spreads from the entry
    {t: T_SWAP, kind: 'sim_blip', gain: -6},
    bed('amb_sim', T_SWAP, HOOK_END + 0.3, -4),
    {t: J1.tPush, kind: 'robot_push', gain: -11, pitch: 3},
    {t: LAND1, kind: 'sim_fall', gain: -7},                                   // the imperfect attempt
    {t: RW0, kind: 'rewind', gain: -9},                                       // compact reset
    {t: J2.tPush, kind: 'robot_push', gain: -10, pitch: 3},
    {t: T_LAND2, kind: 'knee_tap', gain: -6},                                 // the corrected attempt lands
    {t: T_LAND2 + 0.04, kind: 'ding_yes', gain: -12},
    {t: HOOK_END, kind: 'tag_clink', gain: -12, pitch: -5},                   // matched pose → the plant
  ];
};

const factory = (): Cue[] => {
  const {TK, PER, FLEET, T_MONTHS, T_NEWER, T_KEEP, T_STOP, T_WIPE} = FE;
  const out: Cue[] = [bed('amb_room', HOOK_END, FACTORY_END + 0.4, -3)];
  for (let k = 0; k < 3; k++) {
    const grip = realAt(TK(k) - (0.72 - 0.3) * PER), hang = realAt(TK(k));
    if (hang > T_MONTHS) break;
    if (grip > HOOK_END) out.push({t: grip, kind: 'tag_clink', gain: -12, pitch: 2});
    out.push({t: hang, kind: 'tag_clink', gain: -10, pitch: -3});
    out.push({t: hang - 0.35, kind: 'servo_whir', gain: -16, pitch: -1});
  }
  for (let t = T_MONTHS + 0.3; t < T_NEWER + 1.0; t += 0.32) out.push({t, kind: 'counter_tick', gain: -15});   // months pass
  out.push(...falls(footfalls(FACTORY_WALK.fleetWalk(2)), 'robot_step', -15));   // V6: only the new arrival walks in
  void FLEET;
  out.push(
    {t: T_KEEP + 0.1, kind: 'tag_clink', gain: -10, pitch: 4}, {t: T_KEEP + 0.36, kind: 'tag_clink', gain: -11, pitch: 5},
    {t: T_KEEP + 0.2, kind: 'elec_arc', gain: -16},
    {t: T_STOP + 0.25, kind: 'servo_whir', gain: -8, pitch: -7},              // powered down: spin-down
    {t: T_STOP + 0.5, kind: 'knee_tap', gain: -12, pitch: -3},                // the sag
    {t: T_STOP + 1.0, kind: 'tag_clink', gain: -12, pitch: -6},               // onto the hand truck
    {t: T_WIPE, kind: 'paper_slide', gain: -7, pitch: -7},                    // the crate crosses the lens
  );
  return out;
};

const options = (): Cue[] => {
  const {PUSH0, SHUT_T1, POP, PULL0, SHOW, CUT_CLOCK, W0, W1} = OE;
  const {T_DROPHIT, T_TILT0, T_FLIP, ASM0} = OT;
  const tSell = T('Sell it'), tPack = T('packed with'), tBldg = T('the building'), tApart = T('Take them apart') - 0.06;
  const tMelt = T('Melt them') - 0.06, tSimple = T('Simple'), tBrings = T('brings its battery'), tWhere = T('Figure says foundries') - 0.05;
  const tUS = T('U.S.'), tMex = T('Mexico'), tYes = T('said yes'), tDelay = T('delay the next');
  const out: Cue[] = [
    bed('amb_room', FACTORY_END, tMelt + 0.3, -4),
    ...[0, 0.12, 0.24, 0.36].map((d, k) => ({t: ASM0 + 0.38 + d, kind: 'knee_tap', gain: -13 - k * 0.5, pitch: -5 + k})),  // crate panels land
    {t: tSell, kind: 'tag_clink', gain: -10, pitch: 3},                       // FOR SALE hung on its hook
    {t: T_FLIP + 0.12, kind: 'card_flick', gain: -8},                         // flipped to NOT FOR SALE
    {t: tPack - 0.05, kind: 'pop_tick', gain: -11},                           // the knee lens
    {t: PUSH0, kind: 'paper_slide', gain: -9, pitch: -6},                     // the shove
    {t: SHUT_T1, kind: 'shutter_slam', gain: -7},
    {t: tBldg + 0.15, kind: 'padlock', gain: -7},
    {t: tApart + 0.42, kind: 'knee_tap', gain: -9, pitch: -5},                // the crate falls away
    {t: tApart + 1.0, kind: 'servo_whir', gain: -15, pitch: 4},               // the knee cover is twisted by hand
    {t: POP, kind: 'card_flick', gain: -7, pitch: -4},                        // cover off
    {t: PULL0, kind: 'servo_whir', gain: -13, pitch: 2},
    {t: SHOW, kind: 'tag_clink', gain: -10, pitch: 5},
  ];
  for (let t = CUT_CLOCK; t < tMelt; t += 0.5) out.push({t, kind: 'counter_tick', gain: -14});    // rotor → clock: it ticks
  // V6: the bench work that moves the clock: two ratchet strokes, the wrench set down, the part lifted, the part piled
  const c0 = CUT_CLOCK + 0.15;
  out.push({t: c0 + 0.1, kind: 'typing', gain: -14}, {t: c0 + 1.05, kind: 'tag_clink', gain: -12, pitch: -2},
    {t: c0 + 1.55, kind: 'paper_slide', gain: -15, pitch: -4}, {t: c0 + 2.8, kind: 'knee_tap', gain: -12, pitch: -3});
  out.push(
    {t: tDelay, kind: 'paper_slide', gain: -12, pitch: 3},                    // the launch flag slides
    bed('furnace_roar', tMelt, OPTIONS_END + 0.4, -2),
    {t: tMelt + 0.2, kind: 'sizzle', dur: 1.0, gain: -12},                    // the clock face heats
    {t: T_DROPHIT - 0.35, kind: 'whoosh_soft', gain: -15, pitch: 2},          // scrap falls into the top view
    ...entry(T_DROPHIT, -16, 1.6),                                            // under the voice (masking check)
    {t: T_TILT0, kind: 'whoosh_soft', gain: -15, pitch: -3},                  // top view tilts to the side view
    ...falls(footfalls(OPTIONS_WALK.EDGE_WALK), 'step_grate', -10),
    {t: tBrings + 0.4, kind: 'elec_arc', gain: -15},
    {t: tWhere, kind: 'shutter_slam', gain: -9, pitch: 1},                    // V6: the shutter wipes into the street
    {t: tUS + 0.08, kind: 'marker_x', gain: -12},
    {t: tMex - 0.15 + 0.3, kind: 'shutter_slam', gain: -11, pitch: 2},
    {t: tMex + 0.12, kind: 'marker_x', gain: -12},
    {t: tYes, kind: 'ding_yes', gain: -11},
    {t: tYes - 0.12, kind: 'knee_tap', gain: -14, pitch: -8},                 // the Imatra lights come up
    {t: tWhere + 0.3, kind: 'robot_step', gain: -16, pitch: -6},              // hand truck wheels (soft)
  );
  return out;
};

const imatra = (): Cue[] => {
  const tSpoke = T('and a spokesperson'), tGoin = T('go in'), tRecyc = T('Recycling old'), tFilm = T('Bringing a film');
  return [
    bed('furnace_roar', IMATRA_START - 0.3, IMATRA_END + 0.2, 0),
    ...falls(footfalls(IMATRA_EV.IM_WALK), 'step_grate', -11, IMATRA_START),
    ...entry(tGoin - 0.05, -17, 1.4),                                         // heard from the booth, distant
    {t: tRecyc - 0.4, kind: 'crane_chain', gain: -11},
    ...entry(tRecyc - 0.4 + 1.42, -19, 1.0),
    {t: tFilm + 0.25, kind: 'knee_tap', gain: -9, pitch: -8}, {t: tFilm + 0.33, kind: 'knee_tap', gain: -10, pitch: -7},  // film lights on
    {t: IMATRA_END - 0.6, kind: 'card_flick', gain: -15},
  ];
};

const post = (): Cue[] => {
  const {FLIP0, CLAP, DROP0} = PE;
  const tPost = T('In August') - 0.05, tReply = T('Arnold Schwarzenegger replied') - 0.05, tLower = T('lowered into');
  const tReason = T('which is almost exactly') - 0.05, t1991 = T('nineteen ninety-one'), tHint = T('Figure took the hint') - 0.05;
  return [
    bed('amb_room', IMATRA_END, POST_END + 0.3, -6),
    {t: tPost - 0.2, kind: 'paper_swish', gain: -13},                         // the scroll
    {t: tReply, kind: 'pop_tick', gain: -7},                                  // the reply arrives
    {t: PE.LIFT0, kind: 'paper_swish', gain: -14, pitch: 2},                 // the reply card lifts off the phone
    {t: FLIP0, kind: 'card_flick', gain: -8},
    {t: CLAP, kind: 'clapper', gain: -4},
    {t: DROP0, kind: 'whoosh_soft', gain: -13, pitch: -4},
    {t: tLower - 0.3, kind: 'crane_chain', gain: -11},
    {t: tLower + 0.9, kind: 'sizzle', dur: 1.0, gain: -18},
    {t: T('copy its technology') + 0.9, kind: 'crane_chain', gain: -14, pitch: 2},   // the hook retracts
    {t: tReason + 0.1, kind: 'pop_tick', gain: -11},
    {t: t1991 + 0.1, kind: 'stamp', gain: -9},
    {t: tHint + 0.1, kind: 'sim_blip', gain: -12, pitch: -3},                 // the monitor comes on
  ];
};

const train = (): Cue[] => {
  const {A1, A2, A3, SG, T_GRID0, RW1a, TOSS, SPLIT0, T_DIVE, DEMO0, T_TAP1, T_TAP2, SLIP0} = TE;
  const tSims = T('So Figure says it trained'), tNudge = T('The software nudges'), tCopies = T('in many virtual copies');
  const tNobody = T('nobody files'), tPol = T('a policy'), tEarly = T('a little early'), tCatch = T('sensors catch it'), tAdj = T('adjusts the knee'), tTips = T('before the robot tips');
  const out: Cue[] = [
    {t: T('can’t rehearse'), kind: 'trace', gain: -12},                        // the practice arc draws to the steel
    {t: TE.T_DARK0, kind: 'knee_tap', gain: -8, pitch: -9},                   // lights out (on the launch foot)
    {t: TE.T_DARK1, kind: 'trace', gain: -8},                                 // scanline rebuild
    {t: TE.T_BUILD1 - 0.05, kind: 'sim_blip', gain: -9},
    bed('amb_sim', TE.T_DARK1, TRAIN_END + 0.3, -4),
    {t: TOSS + 0.5, kind: 'tag_clink', gain: -9},                             // the target lands on the pad
    {t: SLIP0, kind: 'paper_slide', gain: -11, pitch: 3},                     // the slip
    {t: A1.tEnd, kind: 'sim_fall', gain: -5},
    {t: A1.tEnd + 0.15, kind: 'buzz_no', gain: -14},
    {t: RW1a, kind: 'rewind', gain: -10},
    {t: TE.RW2a, kind: 'rewind', gain: -13},
    ...[0, 1, 2].map((k) => ({t: tNudge + 0.55 + k * 0.25, kind: 'slider_tick', gain: -12, pitch: k})),
    {t: A2.tPush, kind: 'robot_push', gain: -12, pitch: 3},
    {t: A2.tEnd, kind: 'knee_tap', gain: -8},
    {t: A3.tPush, kind: 'robot_push', gain: -11, pitch: 3},
    {t: A3.tEnd, kind: 'knee_tap', gain: -6},
    {t: A3.tEnd + 0.04, kind: 'ding_yes', gain: -9},                          // learned: the bullseye
    {t: T_GRID0, kind: 'card_flick', gain: -12, pitch: -2},                   // the frame becomes a panel
  ];
  for (let k = 0; k < 9; k++) out.push({t: tCopies + 0.2 + k * 0.27, kind: 'pop_tick', gain: -16 + k * 0.4, pitch: k % 3});   // parallel trials land
  out.push(
    {t: TE.REL - 0.05, kind: 'paper_swish', gain: -11},                       // the incident report is tossed
    {t: T_DIVE, kind: 'whoosh_soft', gain: -13, pitch: 2},
    {t: SPLIT0, kind: 'card_flick', gain: -11},
    {t: SG.tPush, kind: 'robot_push', gain: -12, pitch: 3},
    {t: SG.tEnd, kind: 'knee_tap', gain: -8},
    {t: tPol + 0.1, kind: 'sim_blip', gain: -11},
    {t: DEMO0, kind: 'servo_whir', gain: -13, pitch: 3},                      // the plate rises
    {t: tEarly + 0.15, kind: 'knee_tap', gain: -9, pitch: 2},                 // the foot lands early
    {t: tCatch + 0.1, kind: 'sim_blip', gain: -9, pitch: 5},                  // sensor ping up
    {t: tAdj + 0.1, kind: 'slider_tick', gain: -9},                           // command down
    {t: tTips + 0.2, kind: 'ding_yes', gain: -13},
    {t: T_TAP1, kind: 'knee_tap', gain: -8, pitch: 4}, {t: T_TAP2, kind: 'knee_tap', gain: -8, pitch: 4},
  );
  return out;
};

const real = (): Cue[] => {
  const {T_X0, T_X1, DICE0, DICE_COVER, ROUNDS, VAR, HJ, CROUCH_T, J_PAY} = RE;
  const tJoints = T('Real joints have'), tFloors = T('floors aren’t perfectly'), tSensors = T('and sensors are'), tNever = T('And Figure says this');
  const tAlso = T('It also rehearsed'), tHeat = T('the heat and electromagnetic'), tKnocked = T('knocked out cameras'), tElec = T('other electronics');
  const out: Cue[] = [
    {t: T_X0, kind: 'sim_blip', gain: -10, pitch: -4},                        // the line art gains its shell
    bed('furnace_roar', T_X0 + 0.5, DICE_COVER + 0.1, -4),
    {t: T_X1 - 0.3, kind: 'knee_tap', gain: -14, pitch: -6},                  // contact shadow lands
    {t: tJoints + 0.75, kind: 'knee_tap', gain: -9, pitch: 2}, {t: tJoints + 1.15, kind: 'knee_tap', gain: -10, pitch: 1},  // knee play
    {t: tFloors + 0.05, kind: 'tag_clink', gain: -12, pitch: -5},             // the uneven plate
    {t: tSensors + 0.3, kind: 'static', gain: -16},
    ...[0.7, 1.2, 1.7].map((d, k) => ({t: tNever + d, kind: 'pop_tick', gain: -12, pitch: k})),
    ...[0.1, 0.24, 0.4].map((d, k) => ({t: DICE0 + d, kind: 'tag_clink', gain: -11, pitch: -2 + 2 * k})),   // dice tumble
    bed('amb_sim', DICE_COVER, tAlso + 0.1, -4),
    {t: RE.R_BASE.tPush, kind: 'robot_push', gain: -12, pitch: 3},            // V6: the clean baseline round
    {t: RE.R_BASE.tEnd, kind: 'knee_tap', gain: -8},
    {t: RE.BASE_RW0, kind: 'rewind', gain: -14},
    ...RE.DIE_EV.slice(1).map(([t0], k) => ({t: t0, kind: 'tag_clink', gain: -17, pitch: 4 + (k % 3)})),   // the die rolls only on a change
    {t: VAR.w, kind: 'stamp', gain: -11},                                     // the weight block
    {t: VAR.f, kind: 'trace', gain: -12},                                     // ice on the tower top
    ...[0, 1, 2, 3].map((k) => ({t: VAR.tm + k * 0.25, kind: 'counter_tick', gain: -13})),
  ];
  ROUNDS.forEach((r, i) => {
    out.push({t: r.J.tPush, kind: 'robot_push', gain: -12, pitch: 3}, {t: r.J.tEnd, kind: 'knee_tap', gain: -8, pitch: i});
    const next = ROUNDS[i + 1];
    if (next) out.push({t: next.J.tReady - 0.35, kind: 'rewind', gain: -14});
  });
  out.push(
    bed('amb_room', tAlso - 0.05, CROUCH_T + 0.2, -3),
    ...falls(footfalls(RE.HALL_WALK), 'step_grate', -10),
    {t: HJ.tPush, kind: 'robot_push', gain: -6},
    {t: HJ.tEnd, kind: 'airbag', gain: -8},
    bed('furnace_roar', CROUCH_T, PROVE_START + 11, 2),
    {t: tHeat + 0.3, kind: 'elec_arc', gain: -14},
    {t: tKnocked, kind: 'static', gain: -10}, {t: tKnocked + 0.12, kind: 'elec_arc', gain: -11},
    {t: tElec, kind: 'static', gain: -11}, {t: tElec + 0.05, kind: 'elec_arc', gain: -12},
    {t: J_PAY.tPush, kind: 'robot_push', gain: -2},
    {t: J_PAY.tPush + 0.06, kind: 'step_grate', gain: -4},
    {t: J_PAY.tTO, kind: 'servo_whir', gain: -9},
    ...entry(J_PAY.tEnd, -16, 2.6),
  );
  return out;
};

const prove = (): Cue[] => {
  const {T_PAN0, T_WALK0, T_WALK1} = VE;
  const tWhat = T('So what does it prove'), tSurv = T('survive'), tOne = T('one movement'), tKind = T('one kind of target');
  const tPrep = T('people prepared'), tSuper = T('and supervised'), tWork = T('work things out');
  return [
    {t: tWhat + 0.15, kind: 'trace', gain: -11},                              // the ripple becomes the target
    {t: tSurv, kind: 'ding_yes', gain: -11},
    {t: tOne - 0.1, kind: 'trace', gain: -13},                                // V6: one ghost travels the path
    {t: tKind + 0.2, kind: 'tag_clink', gain: -12, pitch: 3},
    {t: tPrep, kind: 'paper_slide', gain: -12, pitch: 5},                     // tape laid along the floor
    {t: tSuper + 0.2, kind: 'static', gain: -20},                             // radio squelch
    {t: T_PAN0, kind: 'whoosh_soft', gain: -11, pitch: -3},                   // out of the prepared set
    bed('amb_room', T_PAN0 + 0.2, END_START + 0.6, -3),
    ...falls(footfalls(VE.AV_WALK), 'robot_step', -12),
    {t: tWork - 0.05, kind: 'servo_whir', gain: -13},
    {t: tWork + 0.22, kind: 'pop_tick', gain: -9},
  ];
};

const end = (): Cue[] => {
  const {LIGHTS, J1, RW0, T_CLAP, J2, T_CARDS, T_FLARE, TOSS} = EE;
  const tWhy = T('So why is it uncomfortable'), tWhen = T('When something with'), tWrote = T('wrote the score');
  const swap = tWhy + 0.85;
  return [
    ...LIGHTS.map((t, k) => ({t, kind: 'knee_tap', gain: -8 - k, pitch: -9 + k})),   // the aisle's lights go out, bank by bank
    bed('furnace_roar', swap, T_FLARE + 0.5, -2),
    {t: swap + 0.1, kind: 'sub_boom', gain: -18, pitch: -3},                  // the glow comes up
    {t: tWhy + 1.1, kind: 'servo_whir', gain: -14, pitch: -2},                // it stands
    ...falls(footfalls(EE.WALK), 'step_grate', -9),
    {t: J1.tPush, kind: 'robot_push', gain: -5},
    {t: J1.tTO, kind: 'servo_whir', gain: -10},
    {t: J1.tTO + 0.18, kind: 'sub_boom', gain: -20, pitch: -6},               // the flight slows
    {t: RW0, kind: 'rewind', gain: -5},
    {t: TOSS + 0.5, kind: 'tag_clink', gain: -9},                             // the target lands on the surface
    {t: TOSS + 0.55, kind: 'sizzle', dur: 0.8, gain: -18},
    ...[0.2, 0.35, 0.5].map((d, k) => ({t: tWrote + d, kind: 'pop_tick', gain: -12, pitch: k})),   // score ticks
    {t: T_CLAP, kind: 'clapper', gain: -4},
    {t: J2.tPush, kind: 'robot_push', gain: -6},
    {t: J2.tPush + 0.06, kind: 'step_grate', gain: -5},
    ...entry(J2.tEnd, -13, 1.6),
    {t: T_CARDS, kind: 'card_flick', gain: -8}, {t: T_CARDS + 0.08, kind: 'card_flick', gain: -9, pitch: 2},
    {t: T_FLARE + 0.2, kind: 'sting_end', gain: -6},
  ];
};

export const collectV6 = () => {
  const cues = [...hook(), ...factory(), ...options(), ...imatra(), ...post(), ...train(), ...real(), ...prove(), ...end()].sort((a, b) => a.t - b.t);
  const {J1, RW0, RW1, T_CLAP, J2, T_CARDS, T_FLARE} = EE;
  const swap = T('So why is it uncomfortable') + 0.85;
  return {
    fps: 30,
    totalFrames: Math.round((NARR_END + END_HOLD) * 30),
    narrationEnd: NARR_END,
    sections: {HOOK_END, FACTORY_END, OPTIONS_END, IMATRA_START, IMATRA_END, POST_END, TRAIN_START, TRAIN_END, REAL_START, REAL_END, PROVE_START, PROVE_END, END_START},
    music: {
      impact: T_HIT, impact2: T_LAND2, swap0: HE.T_SWAP, hookEnd: HOOK_END, curious: HOOK_END, film: IMATRA_START,
      training: TRAIN_START, fail: TE.A1.tEnd, lift: TE.A3.tEnd, real: REAL_START, payoff: RE.J_PAY.tEnd, prove: REAL_END, end: END_START,
      dark0: T('So why is it uncomfortable'), swap, leap: J1.tTO, rewind0: RW0, rewind1: RW1, people: T('People picked the ending'),
      clap: T_CLAP, entry: J2.tEnd, pad: J2.tEnd + 0.9, stick: T_CARDS, flare: T_FLARE,
    },
    // the motivated transitions, for qa/v5 strips (12 frames either side of each)
    transitions: {
      t01_furnace_to_sim_target: HE.T_SWAP, t02_avatar_pose_to_f02: HOOK_END, t03_crate_wipe: FE.T_WIPE + 0.5,
      t04_rotor_to_clock: OE.CUT_CLOCK, t05_clock_heats_to_ladle: OE.T_TOP, t06_cut_on_splash: T('Simple') + 0.5,
      t07_push_through_imatra_door: OPTIONS_END, t08_film_unit_reveal: T('Bringing a film') + 0.6,
      t09_reply_to_slate: PE.FLIP1, t10_slate_fills_lens: PE.CLAP + 0.1, t11_slate_drops: PE.DROP0 + 0.15,
      t12_through_monitor: POST_END, t13_lights_out_rebuild: T('So Figure says it trained') + 0.3,
      t14_stage_to_grid: TE.T_GRID0 + 0.3, t15_dive_into_trial: TE.T_DIVE + 0.3, t16_split_pose_match: TE.SPLIT0 + 0.25,
      t17_sim_foot_to_real: REAL_START + 0.6, t18_dice_wipe: RE.DICE_COVER, t19_airbag_to_deck: RE.CROUCH_T,
      t20_monitor_loses_picture: T('knocked out cameras'), t21_ripple_to_target: T('So what does it prove') + 0.3,
      t22_truck_out_of_set: VE.T_PAN0 + 0.6, t23_lights_out_silhouette: swap, t24_rewind: RW0 + 0.3,
      t25_final_entry: J2.tEnd + 0.1, t26_glow_to_logo: T_FLARE + 0.2,
      t27_material_wipe: T_HIT + 0.9, t28_shutter_to_street: T('Figure says foundries') - 0.1, t29_card_lifts_off_phone: PE.LIFT0 + 0.1,
      t30_foot_to_sim: TE.T_DARK1 + 0.4, t31_reflex_tap: TE.T_TAP1, t32_airbag_dent: RE.HJ.tEnd + 0.1,
    },
    cues,
  };
};

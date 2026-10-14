// Dev only: print the V3 transition times (from the same cue system as the shots) as JSON for the QA strips.
import {T} from '../cues';
import {T_H2, T_H3, T_H4, T_H5, T_H5B, T_H6, T_H7, HOOK_FOUNDRY_END} from '../shots/HookFoundry';
import {HOOK_TURN_END} from '../shots/HookTurn';
import {WHY_END} from '../shots/Why';
import {FILM_END} from '../shots/Film';
import {TRAIN_END} from '../shots/Train';
import {REAL_START, REAL_END} from '../shots/Real';
import {PROVE_END} from '../shots/Prove';
import {END_EVENTS as E} from '../shots/End';
const tEx0 = T('Take them apart') - 0.05;
const out: Record<string, number> = {
  h1_h2_cut: T_H2, h2_h3_cut: T_H3, h3_h4_entry_cut: T_H4, h4_h5_macro: T_H5, h5_h5b_aftermath: T_H5B, h5b_h6_walkout: T_H6, h6_h7_window: T_H7,
  ripple_to_actuator: HOOK_FOUNDRY_END, bay_push_to_visor: T('And how does') - 0.1, visor_iris_to_stage: T('learn a jump') + 0.05,
  sim_visor_to_f02: HOOK_TURN_END, bay_to_line: T('Figure says they spent') - 0.1, line_to_workshop: T('So what do you do') - 0.12,
  crate_door_open: T('custom hardware') - 0.2, crate_door_close: T('and it didn’t want') - 0.35, crate_to_teardown: T('Take them apart') - 0.1,
  teardown_to_queue: tEx0 + 3.75, ring_to_rim: T('Melt them') - 0.1, rim_to_battery: T('Except a robot') - 0.1, dock_to_recycle: T('Recycling old hardware') - 0.12,
  b2_to_phone: WHY_END, phone_flip_to_clapper: T('In Terminator Two') - 0.12, chain_pass_to_foundry: T('which is almost exactly') - 0.1 + 0.25,
  b3_to_b4: FILM_END, foundry_to_stage: T('So Figure says it trained') - 0.1 + 0.35, nudge: T('The software nudges') - 0.1, copies: T('in many virtual copies') - 0.5,
  policy_into_sensor: T('The result is called') - 0.1 + 1.2, b4_to_b5_jump: TRAIN_END, sim_to_foundry_midair: REAL_START + 0.62 + 0.3,
  foundry_to_stage_back: T('A common fix') - 0.1 + 0.05, b5_to_b6: REAL_END, payoff_rise_to_setting: T('But it was one') - 0.1 - 0.5, b6_to_b7: PROVE_END,
  final_reveal: E.T_THESE, ring_to_sting: E.T_STING,
};
console.log(JSON.stringify(out, null, 1));

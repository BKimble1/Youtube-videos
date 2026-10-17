// Section D4 sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs). Times are the contact/sync points from
// ./times.ts EV (pure: it imports only M); the mixer applies each kind's lead. pan = the source's screen side in the
// shot playing at that moment (−1 left … 1 right), dist = its distance from that shot's camera (0 close … 1 far) —
// both measured from the shot cameras and the sources' world positions. Not here (global): the beds, and army_halt at
// FINAL_HIT. Heavy 2's footfall times are its planted-foot contacts (machines.ts heavy2Footfalls).
import type {Cue} from '../../../film/cue';
import {EV} from './times';

export const CUES_D4: Cue[] = [
  // ---- D4-1a the fighting retreat (149.86–152.60): feet on rubble, breath, the arc pressing in from the right, heavy 2 walking out of the crater
  {t: EV.start + 0.04, kind: 'breath_ragged', gain: -2, pan: 0.15, dist: 0.45},
  {t: 150.2, kind: 'run_rubble', gain: -2, pan: 0.05, dist: 0.3, dur: 2.5, fade: 0.3},
  {t: 150.4, kind: 'robot_step_heavy', gain: -4, pan: 0.3, dist: 0.5},
  {t: 150.9, kind: 'servo_whir', gain: -6, pan: 0.15, dist: 0.6},
  {t: 151.0, kind: 'robot_step_heavy', gain: -5, pan: 0.15, dist: 0.6},
  {t: 151.05, kind: 'steps_gravel', gain: -2, pan: 0.15, dist: 0.4, dur: 1.5, fade: 0.2},
  {t: 151.7, kind: 'robot_step_heavy', gain: -4, pan: 0.2, dist: 0.4},
  {t: 152.3, kind: 'breath_exert', gain: -5, pan: 0.85, dist: 0.15},
  // ---- D4-1b the plate cracks through (152.60–154.50)
  {t: EV.dirRun1End, kind: 'steps_gravel', gain: -1, pan: -0.05, dist: 0.1},
  {t: 152.9, kind: 'robot_step_heavy', gain: -1, pan: 0.2, dist: 0.05},
  {t: 153.05, kind: 'servo_heavy', gain: -3, pan: 0.2, dist: 0.05},
  {t: EV.w1Swing - 0.18, kind: 'robot_swing', gain: 0, pan: 0.25, dist: 0.05},
  {t: EV.w1Swing, kind: 'plate_block', gain: 2, pan: 0, dist: 0.1},
  {t: EV.w1Swing + 0.01, kind: 'plate_crack', gain: 2, pan: 0, dist: 0.1},
  {t: EV.w1Swing + 0.03, kind: 'armor_hit', gain: -6, pan: 0, dist: 0.1},
  {t: EV.w1Swing + 0.05, kind: 'breath_exert', gain: -1, pan: 0, dist: 0.1},
  {t: EV.w1Swing + 0.08, kind: 'steps_gravel', gain: -3, pan: -0.05, dist: 0.1, dur: 0.4, fade: 0.1}, // the heels skid back
  {t: 153.95, kind: 'breath_ragged', gain: -4, pan: -0.05, dist: 0.1},
  {t: EV.dirRun2 + 0.15, kind: 'steps_gravel', gain: -3, pan: -0.05, dist: 0.1},
  // ---- D4-2a the runner struck down (154.50–156.70)
  {t: 154.55, kind: 'run_rubble', gain: -4, pan: 0.15, dist: 0.15, dur: 1.2, fade: 0.2},
  {t: 154.95, kind: 'robot_step_heavy', gain: -3, pan: -0.35, dist: 0.15},
  {t: 155.25, kind: 'robot_step_heavy', gain: -3, pan: -0.25, dist: 0.15},
  {t: 155.42, kind: 'steps_gravel', gain: -2, pan: 0.05, dist: 0.15}, // he checks
  {t: 155.45, kind: 'servo_whir', gain: -4, pan: -0.15, dist: 0.2},
  {t: EV.runnerHit - 0.16, kind: 'robot_swing', gain: 0, pan: -0.2, dist: 0.2},
  {t: EV.runnerHit, kind: 'armor_hit', gain: -2, pan: 0.05, dist: 0.15},
  {t: EV.runnerHit + 0.02, kind: 'breath_exert', gain: 0, pan: 0.05, dist: 0.15}, // the wind knocked out of him
  {t: 156.45, kind: 'lever_clunk', gain: 2, pan: 0.35, dist: 0.15, rate: 0.8}, // the halligan lands
  {t: 156.55, kind: 'body_fall', gain: 0, pan: 0.1, dist: 0.15},
  // ---- D4-2b the tether operator disarmed (156.70–158.50)
  {t: 156.8, kind: 'servo_whir', gain: -4, pan: 0.3, dist: 0.05},
  {t: EV.disarmGrab, kind: 'servo_heavy', gain: -2, pan: 0.35, dist: 0.05},
  {t: EV.disarmGrab + 0.05, kind: 'breath_exert', gain: -3, pan: -0.25, dist: 0.05},
  {t: 157.3, kind: 'cloth_move', gain: -2, pan: -0.2, dist: 0.05},
  {t: EV.disarmTear, kind: 'metal_tear', gain: -4, pan: -0.15, dist: 0.05},
  {t: EV.disarmTear + 0.01, kind: 'sparks', gain: -6, pan: -0.15, dist: 0.05},
  {t: EV.disarmTear + 0.06, kind: 'breath_exert', gain: -4, pan: -0.2, dist: 0.05},
  {t: EV.launcherDrop - 0.12, kind: 'robot_swing', gain: -4, pan: 0.4, dist: 0.05},
  {t: EV.launcherDrop + 0.42, kind: 'lever_clunk', gain: 2, pan: 0.85, dist: 0.4, rate: 0.85}, // the launcher lands
  {t: 158.35, kind: 'steps_gravel', gain: -3, pan: -0.5, dist: 0.05},
  // ---- D4-3 at the van (158.50–162.42): they come in, spent; the cable, the flare, the look, the arm
  {t: 158.6, kind: 'steps_gravel', gain: -4, pan: 0.15, dist: 0.15},
  {t: 158.85, kind: 'breath_ragged', gain: -3, pan: -0.45, dist: 0.15},
  {t: 159.2, kind: 'steps_gravel', gain: -4, pan: -0.05, dist: 0.2, rate: 0.9}, // the limp
  {t: 159.55, kind: 'breath_ragged', gain: -4, pan: -0.1, dist: 0.2},
  {t: EV.cablePull, kind: 'tether_reel', gain: -4, pan: 0.3, dist: 0.35, rate: 0.85},
  {t: EV.tabletDrop + 0.4, kind: 'lever_clunk', gain: -4, pan: -0.15, dist: 0.15, rate: 1.5}, // the tablet
  {t: EV.flareDraw, kind: 'cloth_move', gain: -3, pan: -0.55, dist: 0.15},
  {t: 160.9, kind: 'breath_ragged', gain: -2, pan: 0, dist: 0.1},
  {t: 161.4, kind: 'cloth_move', gain: -4, pan: 0, dist: 0.1},
  {t: EV.armUp + 0.05, kind: 'breath_exert', gain: -4, pan: 0, dist: 0.1},
  {t: 162.1, kind: 'servo_whir', gain: -8, pan: 0.3, dist: 0.2},
  // ---- D4-4a the surge; W1 smashed (162.42–163.62)
  {t: EV.arrival + 0.03, kind: 'run_rubble', gain: -2, pan: 0.85, dist: 0.05, dur: 1, fade: 0.2},
  {t: EV.arrival + 0.1, kind: 'breath_exert', gain: -1, pan: 0.85, dist: 0.05},
  {t: 162.9, kind: 'servo_heavy', gain: -3, pan: -0.55, dist: 0.05},
  {t: EV.w1Smash, kind: 'shield_bash', gain: 3, pan: -0.5, dist: 0.05},
  {t: EV.w1Smash + 0.01, kind: 'armor_hit', gain: 0, pan: -0.5, dist: 0.05},
  {t: EV.w1Smash + 0.03, kind: 'metal_tear', gain: -4, pan: -0.5, dist: 0.05}, // the chest plate comes off
  {t: EV.w1Smash + 0.06, kind: 'breath_exert', gain: -2, pan: -0.25, dist: 0.05},
  {t: 163.5, kind: 'robot_fall', gain: -2, pan: -0.5, dist: 0.05},
  // ---- D4-4b the empty breaker as a club (163.62–164.72)
  {t: 163.7, kind: 'steps_gravel', gain: -3, pan: -0.15, dist: 0.1, rate: 0.9},
  {t: 163.95, kind: 'breaker_empty', gain: 0, pan: -0.15, dist: 0.1}, // the trigger: nothing
  {t: 164.1, kind: 'breath_exert', gain: -1, pan: -0.15, dist: 0.1},
  {t: EV.club - 0.18, kind: 'robot_swing', gain: -3, pan: -0.15, dist: 0.1, rate: 0.8},
  {t: EV.club, kind: 'armor_hit', gain: 2, pan: 0.15, dist: 0.1},
  {t: EV.club + 0.01, kind: 'metal_tear', gain: 0, pan: 0.15, dist: 0.1}, // the arm torn off
  {t: EV.club + 0.02, kind: 'sparks', gain: -3, pan: 0.15, dist: 0.1},
  {t: EV.club + 0.05, kind: 'elec_arc', gain: -4, pan: 0.15, dist: 0.1},
  {t: 164.62, kind: 'robot_fall', gain: -3, pan: 0.15, dist: 0.1},
  // ---- D4-4c the cable round its shins; driven over (164.72–165.62)
  {t: EV.cableThrow + 0.3, kind: 'cloth_move', gain: -3, pan: -0.65, dist: 0.1},
  {t: EV.cableWrap, kind: 'cable_strain', gain: 0, pan: 0.4, dist: 0.1},
  {t: EV.cableHaul, kind: 'cable_strain', gain: 1, pan: -0.7, dist: 0.1},
  {t: EV.cableHaul + 0.02, kind: 'breath_exert', gain: -2, pan: -0.7, dist: 0.1},
  {t: 164.88, kind: 'servo_heavy', gain: -2, pan: 0.4, dist: 0.1},
  {t: EV.w3Drive, kind: 'shield_bash', gain: 2, pan: 0.4, dist: 0.1},
  {t: EV.w3Drive + 0.01, kind: 'armor_hit', gain: -3, pan: 0.4, dist: 0.1},
  {t: 165.2, kind: 'robot_fall', gain: 0, pan: 0.4, dist: 0.1},
  {t: 165.45, kind: 'wreck_slam', gain: -6, pan: 0.4, dist: 0.1},
  // ---- D4-4d the last flare into heavy 2's eye (165.62–166.41)
  {t: EV.flareStrike, kind: 'flare_ignite', gain: -2, pan: -0.85, dist: 0.2},
  {t: EV.flareThrow, kind: 'breath_exert', gain: -2, pan: -0.35, dist: 0.05},
  {t: EV.flareHit, kind: 'elec_arc', gain: -4, pan: 0, dist: 0.45},
  {t: EV.flareHit + 0.04, kind: 'heavy_servo', gain: 0, pan: 0, dist: 0.45, rate: 1.1}, // blinded: it rears
  {t: 166.25, kind: 'sensor_lock', gain: -4, pan: 0, dist: 0.45, rate: 0.7},
  // ---- D4-5 heavy 2 staggers off a slab; the gap (166.41–170.40)
  {t: EV.slabTip, kind: 'rubble_shift', gain: 0, pan: -0.05, dist: 0.5},
  {t: 166.5, kind: 'heavy_servo', gain: -2, pan: -0.05, dist: 0.5, rate: 0.9},
  {t: 167.0, kind: 'debris_rain', gain: -6, pan: 0, dist: 0.55},
  {t: 167.6, kind: 'breath_ragged', gain: -2, pan: -0.6, dist: 0.05},
  {t: 168.3, kind: 'breath_ragged', gain: -4, pan: -0.85, dist: 0.3},
  {t: 168.9, kind: 'cloth_move', gain: -6, pan: -0.45, dist: 0.05},
  {t: 169.0, kind: 'sensor_lock', gain: -4, pan: 0.85, dist: 0.25},
  {t: EV.diveStart, kind: 'drone_pass', gain: 0, pan: 0.85, dist: 0.25},
  {t: EV.droneHit, kind: 'armor_hit', gain: -4, pan: -0.15, dist: 0.05},
  {t: EV.droneHit + 0.01, kind: 'sparks', gain: -4, pan: -0.15, dist: 0.05},
  {t: EV.droneHit + 0.03, kind: 'breath_exert', gain: 0, pan: -0.15, dist: 0.05}, // brow cut
  {t: 170.5, kind: 'lever_clunk', gain: -2, pan: -0.15, dist: 0.85, rate: 1.3}, // the controller lands
  {t: 170.3, kind: 'drone_pass', gain: -4, pan: -0.2, dist: 0.05},
  // ---- D4-6a REALIZE — the wide (170.40–173.10): the ring closing, the columns, the drones
  {t: EV.realize + 0.1, kind: 'army_march', gain: -6, pan: 0.15, dist: 0.95, dur: 4.6, fade: 1},
  {t: 170.6, kind: 'body_fall', gain: -6, pan: -0.15, dist: 0.85}, // she lands
  {t: 171.2, kind: 'robot_step_heavy', gain: -6, pan: 0.1, dist: 0.85},
  {t: 171.6, kind: 'drone_pass', gain: -6, pan: -0.45, dist: 0.95},
  {t: 171.9, kind: 'robot_step_heavy', gain: -7, pan: -0.1, dist: 0.95},
  {t: 172.5, kind: 'robot_step_heavy', gain: -7, pan: -0.1, dist: 0.75},
  // ---- D4-6b their faces (173.10–175.04)
  {t: 173.2, kind: 'breath_ragged', gain: -2, pan: 0.1, dist: 0.05},
  {t: 173.7, kind: 'servo_whir', gain: -6, pan: -0.85, dist: 0.3},
  {t: 174.3, kind: 'breath_ragged', gain: -5, pan: -0.85, dist: 0.1},
  // ---- D4-7a/b/c the ram rises at her; his head snaps round; he sprints and plants (175.04–177.45)
  {t: EV.dirSees, kind: 'sensor_lock', gain: -2, pan: -0.85, dist: 0.15},
  {t: EV.ramWind, kind: 'heavy_servo', gain: 3, pan: 0.2, dist: 0.3}, // the ram winds up
  {t: EV.dirSprint, kind: 'breath_exert', gain: 0, pan: 0.05, dist: 0.05},
  {t: EV.dirSprint + 0.02, kind: 'run_rubble', gain: 0, pan: 0.05, dist: 0.05, dur: 1.08, fade: 0.1},
  {t: 176.9, kind: 'breath_ragged', gain: -2, pan: -0.55, dist: 0.05, rate: 1.15}, // her gasp
  {t: EV.dirPlant, kind: 'steps_gravel', gain: 0, pan: 0.3, dist: 0.1},
  // ---- D4-8 STRIKE side-on (177.45–179.30): the contact at 177.76
  {t: EV.strike, kind: 'ram_strike', gain: 3, pan: 0.15, dist: 0.1},
  {t: EV.strike + 0.005, kind: 'plate_shatter', gain: 3, pan: 0.15, dist: 0.1},
  {t: EV.strike + 0.02, kind: 'breath_exert', gain: 0, pan: 0.15, dist: 0.1},
  {t: EV.slam, kind: 'body_fall', gain: 3, pan: -0.35, dist: 0.1}, // his back on the slab
  {t: EV.slam + 0.01, kind: 'rubble_shift', gain: -3, pan: -0.35, dist: 0.1},
  {t: 178.15, kind: 'debris_rain', gain: -10, pan: -0.35, dist: 0.1},
  {t: 178.35, kind: 'breath_ragged', gain: -2, pan: 0.05, dist: 0.1},
  {t: 178.6, kind: 'heavy_servo', gain: -6, pan: 0.85, dist: 0.25, rate: 0.85}, // the ram retracts
  {t: 178.95, kind: 'servo_heavy', gain: -6, pan: 0.85, dist: 0.3, rate: 0.8}, // it shifts its weight back
  // ---- D4-9a SOFTEN: he slides down the slab (179.30–180.80)
  {t: EV.slide + 0.05, kind: 'rubble_shift', gain: -2, pan: 0, dist: 0.05, dur: 1.3, fade: 0.3},
  {t: 179.7, kind: 'breath_ragged', gain: -2, pan: 0, dist: 0.05, rate: 0.9},
  {t: EV.slideEnd - 0.1, kind: 'body_fall', gain: -8, pan: 0, dist: 0.05},
  // ---- D4-9b the others held (180.80–183.30): the grabs = EF TB_HOLDERS t0s
  {t: EV.grabTether, kind: 'servo_whir', gain: -2, pan: 0.85, dist: 0.15},
  {t: EV.grabTether + 0.06, kind: 'breath_exert', gain: -4, pan: 0.85, dist: 0.15},
  {t: EV.grabDecoy, kind: 'servo_whir', gain: -2, pan: -0.15, dist: 0.1},
  {t: EV.grabDecoy + 0.06, kind: 'breath_exert', gain: -3, pan: 0.05, dist: 0.1},
  {t: 181.35, kind: 'breath_exert', gain: -4, pan: -0.1, dist: 0.15},
  {t: 181.75, kind: 'lever_clunk', gain: -1, pan: -0.1, dist: 0.15, rate: 0.8}, // the breaker hits the street
  {t: EV.grabFlares, kind: 'servo_whir', gain: -2, pan: -0.7, dist: 0.2},
  {t: EV.grabFlares + 0.05, kind: 'breath_exert', gain: -3, pan: -0.55, dist: 0.15},
  {t: EV.grabBreaker, kind: 'servo_heavy', gain: -3, pan: -0.2, dist: 0.2},
  {t: EV.grabBreaker + 0.08, kind: 'body_fall', gain: -6, pan: -0.1, dist: 0.15}, // pressed down
  {t: 182.8, kind: 'cloth_move', gain: -6, pan: 0.05, dist: 0.1},
  // ---- D4-10 the ring holds (183.30–186.90); army_halt is global at FINAL_HIT
  {t: 183.6, kind: 'servo_whir', gain: -8, pan: -0.05, dist: 0.75},
  {t: EV.pilotUp + 0.1, kind: 'cloth_move', gain: -6, pan: -0.05, dist: 0.9},
  {t: 184.1, kind: 'drone_pass', gain: -8, pan: 0.3, dist: 0.9},
  {t: 184.6, kind: 'breath_ragged', gain: -6, pan: -0.05, dist: 0.85},
  {t: 185.4, kind: 'rubble_shift', gain: -12, pan: -0.05, dist: 0.85, dur: 0.8, fade: 0.3},
  {t: 186.2, kind: 'breath_ragged', gain: -8, pan: -0.15, dist: 0.85, rate: 0.9},
  // ---- heavy 2's feet (front legs while it walks; every foot in the stagger and the step back)
  {t: 150.2, kind: 'heavy_stomp', gain: -4, pan: 0.45, dist: 0.95},
  {t: 150.93, kind: 'heavy_stomp', gain: -4, pan: 0.45, dist: 0.95},
  {t: 151.66, kind: 'heavy_stomp', gain: -4, pan: 0.45, dist: 0.95},
  {t: 152.39, kind: 'heavy_stomp', gain: -4, pan: 0.45, dist: 0.9},
  {t: 153.12, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.5},
  {t: 153.85, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.45},
  {t: 154.58, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.9},
  {t: 155.32, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.85},
  {t: 156.05, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.8},
  {t: 156.78, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.75},
  {t: 157.51, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.7},
  {t: 158.24, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.65},
  {t: 158.97, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.8},
  {t: 159.7, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.75},
  {t: 160.44, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.7},
  {t: 161.17, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.6},
  {t: 161.9, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.55},
  {t: 162.63, kind: 'heavy_stomp', gain: -4, pan: 0.2, dist: 0.6},
  {t: 163.36, kind: 'heavy_stomp', gain: -4, pan: 0.3, dist: 0.55},
  {t: 164.09, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.35},
  {t: 164.82, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.2},
  {t: 165.56, kind: 'heavy_stomp', gain: -4, pan: 0.85, dist: 0.2},
  {t: 166.38, kind: 'heavy_stomp', gain: 0, pan: 0, dist: 0.45},
  {t: 166.62, kind: 'heavy_stomp', gain: 0, pan: 0, dist: 0.5},
  {t: 166.78, kind: 'heavy_stomp', gain: 0, pan: 0, dist: 0.55},
  {t: 166.98, kind: 'heavy_stomp', gain: 0, pan: 0, dist: 0.55},
  {t: 167.22, kind: 'heavy_stomp', gain: 0, pan: 0, dist: 0.55},
  {t: 167.42, kind: 'heavy_stomp', gain: 0, pan: 0, dist: 0.55},
  {t: 171.02, kind: 'heavy_stomp', gain: -3, pan: 0.1, dist: 0.95},
  {t: 171.72, kind: 'heavy_stomp', gain: -3, pan: 0.1, dist: 0.95},
  {t: 172.42, kind: 'heavy_stomp', gain: -3, pan: 0.1, dist: 0.95},
  {t: 173.12, kind: 'heavy_stomp', gain: -3, pan: 0.85, dist: 0.2},
  {t: 173.82, kind: 'heavy_stomp', gain: -3, pan: 0.85, dist: 0.15},
  {t: 174.52, kind: 'heavy_stomp', gain: -3, pan: 0.85, dist: 0.1},
  {t: 175.22, kind: 'heavy_stomp', gain: -3, pan: 0.35, dist: 0.35},
  {t: 175.92, kind: 'heavy_stomp', gain: -3, pan: -0.85, dist: 0.15},
  {t: 176.27, kind: 'heavy_stomp', gain: -3, pan: -0.85, dist: 0.15},
  {t: 179.36, kind: 'heavy_stomp', gain: -5, pan: 0.85, dist: 0.25},
  {t: 179.86, kind: 'heavy_stomp', gain: -5, pan: 0.85, dist: 0.25},
  {t: 180.36, kind: 'heavy_stomp', gain: -5, pan: 0.85, dist: 0.25},
  {t: 180.86, kind: 'heavy_stomp', gain: -5, pan: -0.85, dist: 0.1},
];

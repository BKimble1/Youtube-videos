// What the integrity audit needs to know about a version's world, so V4 (before) and V5 (after) are measured by the
// same code.
import {V3} from '../core/three';
import {Frame} from '../core/frame';
import {Orbit} from '../core/three';
import {RoachState} from '../roach/rig';
import {Box, Cap} from './geom';

export type WBug = {k: number; st: RoachState; packF: Frame | null; hook: number; onSled: boolean};
export type WArm = {tool: Frame; open: number; held: number | null; heldF: Frame | null; links: Cap[]; gripBody: Box; fingers: Box[]; pads: Box[]};
export type World = {
  name: string;
  /** every insect in the lab at t */
  labBugs: (t: number) => WBug[];
  arm: (t: number) => WArm;
  sledX: (t: number) => number;
  /** the ground the insects walk on (the bench, the platform where the walk code thinks it is) */
  walkGround: (x: number, y: number) => number;
  /** the platform's real extent at t (world box) */
  platform: (t: number) => Box;
  /** solid rod parts at t: posts and arms (capsules), and the pressing tips */
  rods: (t: number) => {solid: Cap[]; tips: Cap[]};
  holderSolids: Box[];
  holderCyl: {c: V3; r: number; h: number};
  /** the modules parked on the holder at t (their frames) */
  parked: (t: number) => Frame[];
  /** the pack's solid boxes (mount plate, grasping tab) and hanging parts (electrodes, branches) in a pack frame */
  packBoxes: (F: Frame) => Box[];
  packHanging: (F: Frame, hook: number) => V3[];
  labCam: (t: number) => Orbit | null;
  rubble: {t0: number; t1: number; bug: (t: number) => {st: RoachState; packF: Frame}; solids: Box[]; cam: (t: number) => Orbit};
  build: {t0: number; t1: number; bug: (t: number) => {st: RoachState; packF: Frame}};
};

// Crew continuity as code: who looks like what, and which injuries they carry at a given FILM time T (seconds).
// Mirrors production/CONTINUITY.md. Shots call dmg('teammate', T) instead of hand-writing damage, so marks stay
// on the same side, place and size from shot to shot. Pass extra marks for an in-shot moment with {...dmg(r, T), x}.
import {CAST, CIVILIANS, ROLE, Look} from '../rig/looks';
import {Damage, Decal, Stain} from '../rig/actor';
import {GaitOpts} from '../rig/gait';
import {shot} from './timing';
import {clamp} from '../kit/math';

export type Role = keyof typeof ROLE;
export const look = (r: Role): Look => CAST[ROLE[r]];
/** The three civilians who travel with the Crew: woman in a grey coat, older bald man, teen. */
export const CIV = [CIVILIANS[0], CIVILIANS[2], CIVILIANS[3]];

const after = (id: string, T: number, off = 0) => T >= shot(id).start + off;

export const dmg = (r: Role, T: number): Damage => {
  const stains: Stain[] = [];
  const decals: Decal[] = [];
  const d: Damage = {stains, decals};
  if (r === 'teammate') {
    d.browCut = {side: -1, amt: 1};
    d.cracked = true;
    d.dirt = 1;
    stains.push({phi: -40, h: 20, size: 12});
    decals.push({limb: 'armL0', u: 0.55, kind: 'tear'}, {limb: 'legL1', u: 0.45, kind: 'tear'});
    d.handBlood = {L: 0.6};
    if (after('D1', T)) d.sling = 'L';
    if (after('E1', T)) d.headBandage = 1;
  }
  if (r === 'director') {
    if (after('A3', T, 1.2)) { d.dirt = 0.6; d.handBlood = {R: 0.8}; }
    if (after('C8', T, 2.5)) { d.lipCut = 1; d.bruise = {side: -1, amt: 0.7}; }
    if (after('C13', T, 1.0)) { d.browCut = {side: 1, amt: 0.7}; decals.push({limb: 'armL0', u: 0.5, kind: 'tear'}); d.dirt = 1; }
    if (after('C14', T, 3.0)) d.handBlood = {L: 1, R: 1};
    if (after('E4', T)) d.handBlood = {L: 0.25, R: 0.35}; // days later: washed, traces remain
  }
  if (r === 'friend') {
    if (after('B3', T)) { d.dirt = 0.5; decals.push({limb: 'legR1', u: 0.5, kind: 'tear'}); }
    if (after('C13', T, 1.0)) {
      stains.push({phi: 55, h: 45, size: 24}, {phi: 25, h: 70, size: 14});
      d.browCut = {side: 1, amt: 1};
      d.handBlood = {R: 1};
      // pale rises from 0.3 (after the blast) to 1 at the end of D3
      const a = shot('C13').start + 1, b = shot('D3').end;
      d.pale = 0.3 + 0.7 * clamp((T - a) / (b - a));
    }
  }
  if (r === 'builder') {
    if (after('B2', T)) d.dirt = 0.5;
    if (after('C8', T, 2.0)) { d.bruise = {side: 1, amt: 0.8}; decals.push({limb: 'armR0', u: 0.5, kind: 'tear'}); }
  }
  if (r === 'carrier') {
    if (after('C3', T, 1.4)) { decals.push({limb: 'armL1', u: 0.5, kind: after('E1', T) ? 'bandage' : 'blood'}); d.dirt = 0.7; }
  }
  return d;
};

/** The carrier limps on the left leg from the hauler hit (C3) on; pass into gait opts. */
export const limpOf = (r: Role, T: number): GaitOpts['limp'] | undefined =>
  r === 'carrier' && after('C3', T, 1.4) ? {side: 'L', amt: 0.6} : undefined;

/** Does the teammate still wear the radio on the strap? (unhooked in D5) */
export const radioOnStrap = (T: number) => T < shot('D5').start + 0.4;
/** Is the friend wearing the visor? (on from B3 until it slips off in D2) */
export const visorOn = (T: number) => T >= shot('B3').start && T < shot('D2').start + 1.6;

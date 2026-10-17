// R2 continuity as code: looks, cumulative damage and tool states per role at film time T (production/R2_BEAT_SHEET.md
// "Damage timeline"). Shots call dmgR2(role, T) / toolsR2(role, T) so marks stay on the same side, place and size.
import {CAST, ROLE2, Role2, Look} from './looks';
import {Damage, Decal, Stain} from './figure';
import {M} from '../timing';
import {clamp} from '../../kit/math';

export const lookR2 = (r: Role2): Look => CAST[ROLE2[r]];

const after = (T: number, t0: number) => T >= t0;
/** dirt builds up through the battle */
const grime = (T: number, base: number) => clamp(base + 0.5 * clamp((T - M.CHARGE) / 90), 0, 1);

export const dmgR2 = (r: Role2, T: number): Damage => {
  const stains: Stain[] = [];
  const decals: Decal[] = [];
  const d: Damage = {stains, decals};
  if (r === 'director') {
    d.browCut = {side: -1, amt: 1};
    d.dirt = grime(T, 0.75);
    d.dust = 0.6;
    decals.push({limb: 'armR0', u: 0.55, kind: 'tear'});
    d.handBlood = {R: 0.9};
    d.bruise = {side: -1, amt: 0.6};
    if (after(T, M.HEAVY2_FIRE)) d.lipCut = 1;
    if (after(T, M.STRIKE)) {
      stains.push({phi: -62, h: 62, size: 26, seed: 3}, {phi: -40, h: 40, size: 16, seed: 8});
      d.mouthBlood = 1;
      d.pale = clamp((T - M.STRIKE) / 14) * 0.7;
      decals.push({limb: 'armL1', u: 0.4, kind: 'scrape'});
    }
  }
  if (r === 'tether') {
    d.dirt = grime(T, 0.3);
    if (after(T, M.CLASH)) decals.push({limb: 'legR1', u: 0.12, kind: 'tear'});
    if (after(T, M.P4)) d.bruise = {side: 1, amt: 0.7};
  }
  if (r === 'decoy') {
    d.dirt = grime(T, 0.3);
    if (after(T, M.DECOY_FAIL)) d.handBlood = {R: 0.6};
  }
  if (r === 'breaker') {
    d.dirt = grime(T, 0.35);
    if (after(T, M.P4)) decals.push({limb: 'armL1', u: 0.5, kind: 'blood'});
  }
  if (r === 'drone') {
    d.dirt = grime(T, 0.3);
    if (after(T, M.REALIZE)) d.browCut = {side: 1, amt: 0.8};
  }
  if (r === 'runner') {
    d.dirt = grime(T, 0.4);
    if (after(T, M.KNOCKBACK)) decals.push({limb: 'armL0', u: 0.5, kind: 'scrape'});
    if (after(T, M.P4 + 6)) { d.browCut = {side: -1, amt: 0.9}; stains.push({phi: 30, h: 70, size: 14, seed: 5}); }
  }
  if (r === 'flares') {
    d.dirt = grime(T, 0.35);
    if (after(T, M.HEAVY2_FIRE)) { d.browCut = {side: -1, amt: 0.9}; stains.push({phi: 50, h: 95, size: 18, seed: 9, kind: 'tear'}); }
  }
  return d;
};

export type PlateState = 'intact' | 'dented' | 'cracked' | 'shattered';
export type Tools = {plate?: PlateState; tether?: 'loaded' | 'cut'; tablet?: 'ok' | 'smashed'; gauge?: number; drone?: 'flying' | 'lost'};
export const toolsR2 = (r: Role2, T: number): Tools => {
  switch (r) {
    case 'director': return {plate: after(T, M.STRIKE) ? 'shattered' : after(T, M.HEAVY2_FIRE) ? 'cracked' : after(T, M.BR1) ? 'dented' : 'intact'};
    case 'tether': return {tether: after(T, M.FLANK_DENIED) ? 'cut' : 'loaded'};
    case 'decoy': return {tablet: after(T, M.DECOY_FAIL) ? 'smashed' : 'ok'};
    case 'breaker': return {gauge: after(T, M.HEAVY2_FIRE) ? 0 : clamp(1 - (T - M.CHARGE) / 140, 0.25, 1)};
    case 'drone': return {drone: after(T, M.ALLY_DRONE_LOST) ? 'lost' : 'flying'};
    default: return {};
  }
};

/** Breaker (honest) limps from P4 on; the Director cannot stand after STRIKE. */
export const limpR2 = (r: Role2, T: number) => (r === 'breaker' && after(T, M.P4) ? {side: 'L' as const, amt: 0.55} : undefined);

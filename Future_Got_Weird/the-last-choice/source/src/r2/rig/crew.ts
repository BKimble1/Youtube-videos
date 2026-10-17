// R2 continuity as code: looks, cumulative damage and tool states per role at film time T (production/R2_BEAT_SHEET.md
// "Damage timeline"). Shots call dmgR2(role, T) / toolsR2(role, T) so marks stay on the same side, place and size.
import {CAST, ROLE2, Role2, Look} from './looks';
import {Damage, Decal, Stain} from './figure';
import {M} from '../timing';
import {clamp} from '../../kit/math';

export const lookR2 = (r: Role2): Look => CAST[ROLE2[r]];

const after = (T: number, t0: number) => T >= t0;
/** D3's contact times (shots/D3/times.ts EV3; literals so the rig stays free of the shots): the blast of heavy 2's round
 * on the rim (the Director's lip, the flare carrier's brow, the plate cracked, the gauge empty), the tablet smashed,
 * the tether cable cut, the allied drone struck down, the knee hit that empties most of the breaker's tank */
const D3 = {blast: 145.45, smash: 136.35, cut: 138.95, kill: 141.35, knee: 124.75, flare: 117.7};
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
    if (after(T, D3.blast)) d.lipCut = 1;
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
    if (after(T, D3.smash)) d.handBlood = {R: 0.6};
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
    // the satchel on his left hip (C on): three flares and two smoke canisters. Each leaves the bag when it appears in his
    // hand: D1's flare 76.55 (thrown 77.3), D2's canisters 94.44 / 95.03, D3's flare 117.7 (into heavy 1's eye), D4's last
    // flare 160.45 — empty from heavy 2's arrival
    d.satchel = {flares: T <= 76.55 ? 3 : T <= D3.flare ? 2 : T <= 160.45 ? 1 : 0, canisters: T <= 94.44 ? 2 : T <= 95.03 ? 1 : 0};
    if (after(T, D3.blast)) { d.browCut = {side: -1, amt: 0.9}; stains.push({phi: 50, h: 95, size: 18, seed: 9, kind: 'tear'}); }
  }
  return d;
};

export type PlateState = 'intact' | 'dented' | 'cracked' | 'shattered';
export type Tools = {plate?: PlateState; tether?: 'loaded' | 'cut'; tablet?: 'ok' | 'smashed'; gauge?: number; drone?: 'flying' | 'lost'};
export const toolsR2 = (r: Role2, T: number): Tools => {
  switch (r) {
    case 'director': return {plate: after(T, M.STRIKE) ? 'shattered' : after(T, D3.blast) ? 'cracked' : after(T, M.BR1) ? 'dented' : 'intact'};
    case 'tether': return {tether: after(T, D3.cut) ? 'cut' : 'loaded'};
    case 'decoy': return {tablet: after(T, D3.smash) ? 'smashed' : 'ok'};
    // the tank bleeds through the battle; the knee in D3 takes most of what is left; the blast's debris finishes it
    case 'breaker': return {gauge: after(T, D3.blast) ? 0 : after(T, D3.knee) ? 0.14 - 0.08 * clamp((T - D3.knee) / (D3.blast - D3.knee)) : clamp(1 - (T - M.CHARGE) / 140, 0.25, 1)};
    case 'drone': return {drone: after(T, D3.kill) ? 'lost' : 'flying'};
    default: return {};
  }
};

/** Breaker (honest) limps from P4 on; the Director cannot stand after STRIKE. */
export const limpR2 = (r: Role2, T: number) => (r === 'breaker' && after(T, M.P4) ? {side: 'L' as const, amt: 0.55} : undefined);

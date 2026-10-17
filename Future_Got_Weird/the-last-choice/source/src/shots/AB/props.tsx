// Hand props for group AB (world coordinates; drawn at a solved hand position so they stay on the grip).
import React from 'react';
import {C} from '../../theme';
import {ActorProps, handCenter, solve} from '../../rig/actor';

/** World centre of an actor's hand (0 = left, 1 = right), before any whole-body roll. */
export const handOf = (p: ActorProps, i: 0 | 1) => handCenter(solve(p), i);

/** The builder's canvas tool bag (handle at the origin, hangs straight down), with the battered tablet clipped on. */
export const ToolBag: React.FC<{x: number; y: number; s: number; ink: number; swing?: number; tablet?: boolean}> = ({x, y, s, ink, swing = 0, tablet = true}) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${swing.toFixed(2)}) scale(${s})`}>
    <path d="M -22 4 Q 0 -26 22 4" fill="none" stroke={C.ink} strokeWidth={9 + ink / s} strokeLinecap="round" />
    <path d="M -22 4 Q 0 -26 22 4" fill="none" stroke="#5B4632" strokeWidth={9} strokeLinecap="round" />
    <path d="M -58 6 L 58 6 L 66 96 Q 0 110 -66 96 Z" fill="#7C6A4E" stroke={C.ink} strokeWidth={ink / s} strokeLinejoin="round" />
    <path d="M -58 6 L 58 6 L 60 26 L -60 26 Z" fill="#5E5039" stroke={C.ink} strokeWidth={(ink / s) * 0.7} strokeLinejoin="round" />
    <line x1={-30} y1={30} x2={-34} y2={92} stroke="#5E5039" strokeWidth={5} />
    <rect x={-8} y={-2} width={6} height={22} fill="#9AA3AA" stroke={C.ink} strokeWidth={(ink / s) * 0.5} />
    <rect x={6} y={-8} width={8} height={26} rx={2} fill="#C9463A" stroke={C.ink} strokeWidth={(ink / s) * 0.5} />
    {tablet && (
      <g transform="translate(26 40) rotate(-6)">
        <rect x={-6} y={-30} width={52} height={68} rx={6} fill="#2D3940" stroke={C.ink} strokeWidth={(ink / s) * 0.8} />
        <rect x={0} y={-24} width={40} height={52} rx={3} fill="#3E5A66" />
        <path d="M 4 -20 L 20 2 L 12 6 L 30 26" fill="none" stroke="#A9C8D2" strokeWidth={2} opacity={0.7} />
        <rect x={34} y={-34} width={14} height={10} rx={2} fill="#C8CED2" stroke={C.ink} strokeWidth={(ink / s) * 0.5} />
      </g>
    )}
  </g>
);

/** A short steel pry bar (hand-local: along +x from the grip). */
export const PryBar: React.FC<{s: number; ink: number; len?: number}> = ({s, ink, len = 150}) => (
  <g>
    <line x1={-30 * s} y1={0} x2={len * s} y2={0} stroke={C.ink} strokeWidth={12 * s + ink * 2} strokeLinecap="round" />
    <line x1={-30 * s} y1={0} x2={len * s} y2={0} stroke="#6E7880" strokeWidth={12 * s} strokeLinecap="round" />
    <path d={`M ${len * s} 0 q ${14 * s} ${-2 * s} ${18 * s} ${-16 * s}`} fill="none" stroke={C.ink} strokeWidth={12 * s + ink * 2} strokeLinecap="round" />
    <path d={`M ${len * s} 0 q ${14 * s} ${-2 * s} ${18 * s} ${-16 * s}`} fill="none" stroke="#6E7880" strokeWidth={12 * s} strokeLinecap="round" />
  </g>
);

// ------------------------------------------------------------------ the supported walk (Director + teammate)
import {look as lookOf, dmg as dmgOf} from '../../film/crew';
import {walker} from '../../rig/poses';
import {SHUFFLE} from '../../rig/gait';

/** The Director walking east (profile, nearer the camera) with the teammate leaning on them (behind, limping on a
 *  left leg that can't take weight). dist = distance travelled from x0. Returns [teammate, director]. */
export const supportedWalk = (T: number, x0: number, dist: number, ground: number, s = 1, o: {zBase?: number; dirHead?: ActorProps['head']; dirFace?: ActorProps['face']} = {}): ActorProps[] => {
  const z = o.zBase ?? 0;
  const g = {...SHUFFLE, stride: 92, lift: 10};
  const D = walker(lookOf('director'), {x0, dist, dir: 1, ground: ground + 8 * s, gait: g}, {t: T, s, seed: 4, z: z + 0.3, dmg: dmgOf('director', T), breath: 0.8,
    face: o.dirFace ?? {mouth: 'grit', brows: -0.4}, head: o.dirHead ?? {pitch: 4}});
  const tx = x0 - 34 * s;
  const TMw = walker(lookOf('teammate'), {x0: tx, dist, dir: 1, ground: ground - 6 * s, gait: {...g, limp: {side: 'L', amt: 1}}}, {t: T, s: s * 0.98, seed: 3, z, dmg: dmgOf('teammate', T), breath: 1,
    face: {mouth: 'pant', worry: 0.8, lids: 0.35}, head: {pitch: 10, roll: -4}});
  const pD = {x: D.x, y: D.y};
  const TM: ActorProps = {...TMw, side: -8, lean: 10, drop: (TMw.drop ?? 0) + 10,
    armR: {hand: {x: pD.x + 10 * s, y: pD.y - 300 * s, z: z + 40}, pole: {x: 0, y: -1, z: 0.4}}, zArm: [undefined, 250], zHand: [undefined, 250],
    armL: {fk: {fwd: 30, out: 6, bend: 115}}};
  const DD: ActorProps = {...D, side: 4, armL: {hand: {x: TM.x + 20 * s, y: ground - 150 * s, z: z - 30}, pole: {x: 0, y: 1, z: -0.5}}};
  return [TM, DD];
};

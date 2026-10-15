// The prepared set's dressing in the foundry (shared by REAL's last shots and PROVE so nothing pops at the cut):
// two safety barriers on the floor and the two crew members who supervise the take.
import React from 'react';
import {Crew, lerp} from '../../v4/kit/scene';
import {FD} from './foundry5';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C} from '../../theme';

const FD_INK = '#120C10';
export const Barrier: React.FC<{x: number; lw: number}> = ({x, lw}) => (
  <g transform={`translate(${x} ${FD.floor})`}>
    {[-50, 50].map((dx) => <rect key={dx} x={dx - 7} y={-120} width={14} height={120} fill="#3A3D44" stroke={FD_INK} strokeWidth={lw} />)}
    <rect x={-70} y={-110} width={140} height={34} fill="#F2B632" stroke={FD_INK} strokeWidth={lw} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${-66 + i * 36} -110 l18 0 l-14 34 l-18 0 Z`} fill="#2B2930" />)}
  </g>
);
export const BARRIERS = [430, 1010];

/** clerkA (clipboard, left of the deck) and clerkC (radio, by the booth). tick: 0..1 pen stroke; radio: 0..1 raise. */
export const SetCrew: React.FC<{f: number; tick?: number; radio?: number; checked?: number; lookC?: number; showA?: boolean}> = ({f, tick = 0, radio = 0, checked = 2, lookC = 0.5, showA = true}) => {
  const radioProp = <g transform="rotate(8)"><rect x={-16} y={-64} width={32} height={66} rx={7} fill="#2A2D33" stroke={C.ink} strokeWidth={4} /><rect x={-4} y={-92} width={8} height={30} rx={3} fill="#2A2D33" /><rect x={-10} y={-50} width={20} height={14} rx={3} fill="#9ED7C6" /></g>;
  const board = <g><rect x={-40} y={-10} width={80} height={104} rx={8} fill="#C9924F" stroke={C.ink} strokeWidth={4} /><rect x={-32} y={4} width={64} height={80} rx={4} fill="#FFFDF6" />{[0, 1, 2].map((i) => <path key={i} d={`M-22 ${22 + i * 22} l6 6 l12 -12`} fill="none" stroke={i < checked ? C.teal : '#D9DEE4'} strokeWidth={4} strokeLinecap="round" />)}</g>;
  return (
    <g>
      {showA ? <Crew look={CAST.clerkA} x={-110} y={FD.floor} h={400} frame={f} seed={3} life={0.5} holdL={board}
        pose={{...IDLE, armL: {a: 40, b: 70}, armR: {a: 30 + 10 * tick, b: 60 + 30 * tick}, lookX: 0.8, lookY: -0.2 + 0.5 * tick, mouth: 'flat'}} /> : null}
      <Crew look={CAST.clerkC} x={1615} y={FD.floor} h={410} frame={f} seed={14} flip life={0.5} holdR={radioProp}
        pose={{...IDLE, armR: {a: lerp(20, 128, radio), b: lerp(30, 112, radio)}, armL: {a: 30, b: 50}, lookX: lookC, lookY: 0.1, mouth: radio > 0.5 ? 'o' : 'flat'}} />
    </g>
  );
};

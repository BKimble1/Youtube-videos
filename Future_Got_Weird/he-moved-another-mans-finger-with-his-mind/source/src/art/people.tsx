// The people of this film, on the Weird Crew cast rig (art/crew.tsx, CrewChar). Original animated stand-ins for the
// real researchers and volunteers; sleeve colours match the close-up hands (art/kit.tsx K.*Sleeve) all film long.
// Head gear is passed to CrewChar's `headGear` prop and is drawn in head space: head centre (0, -372), radius 58.
import React from 'react';
import {Look} from './crew';
import {INK, K} from './kit';

const HY = -372, HR = 58;
/** Rao (2013 sender, frame left): blue shirt, glasses, EEG cap. */
export const RAO: Look = {skin: K.raoSkin, hair: 'crop', hairColor: '#1E1A1A', shirt: K.raoSleeve, pants: '#2E3F5C', shoes: '#2B2B33', accessories: ['glasses']};
/** Stocco (2013 receiver, frame right): green shirt, purple swim cap marking the coil site, earbuds. */
export const STOCCO: Look = {skin: K.stoccoSkin, hair: 'swoop', hairColor: '#5A3A22', shirt: K.stoccoSleeve, pants: '#3F5560', shoes: '#3B2A22', accessories: []};
/** 2014 volunteers (new people) */
export const V14: Record<string, Look> = {
  send1: {skin: '#F7D9C4', hair: 'bob', hairColor: '#B8743A', shirt: '#5B7FC2', pants: '#3F5560', shoes: '#2B2B33', accessories: []},
  recv1: {skin: K.r14Skin, hair: 'curly', hairColor: '#2B1A10', shirt: K.r14Sleeve, pants: '#2E3F5C', shoes: '#2B2B33', accessories: []},
  send2: {skin: '#8D5A3C', hair: 'bun', hairColor: '#1E1A1A', shirt: '#9C6BBF', pants: '#2E3F5C', shoes: '#3B2A22', accessories: ['earring']},
  recv2: {skin: '#F2C9A8', hair: 'spiky', hairColor: '#C0392B', shirt: '#E2B33C', pants: '#4A5A3C', shoes: '#2B2B33', accessories: []},
  send3: {skin: '#C98B5E', hair: 'swoop', hairColor: '#2B2B33', shirt: '#4F9A9A', pants: '#3F5560', shoes: '#2B2B33', accessories: ['glasses']},
  recv3: {skin: '#F7D9C4', hair: 'crop', hairColor: '#8A6A4A', shirt: '#D96C7A', pants: '#2E3F5C', shoes: '#3B2A22', accessories: []},
};
/** 2019 BrainNet trio: two Senders in their signal colours, one Receiver */
export const BN: Record<string, Look> = {
  senderA: {skin: '#C98B5E', hair: 'bun', hairColor: '#2B1A10', shirt: K.senderA, pants: '#2E3F5C', shoes: '#2B2B33', accessories: []},
  senderB: {skin: '#F2C9A8', hair: 'crop', hairColor: '#B8743A', shirt: K.senderB, pants: '#3F5560', shoes: '#3B2A22', accessories: ['glasses']},
  receiver: {skin: '#8D5A3C', hair: 'crop', hairColor: '#1E1A1A', shirt: K.receiver, pants: '#2E3F5C', shoes: '#2B2B33', accessories: []},
};

/** EEG cap: a fitted cap with electrode dots and a cable bundle (Rao, the 2014 senders, the 2019 trio). */
export const EEGCap: React.FC<{color?: string; glow?: number}> = ({color = '#3B4A57', glow = 0}) => (
  <g>
    <path d={`M ${-HR - 4} ${HY + 4} Q ${-HR - 6} ${HY - HR - 22} 0 ${HY - HR - 20} Q ${HR + 6} ${HY - HR - 22} ${HR + 4} ${HY + 4} Q ${HR * 0.5} ${HY - 18} 0 ${HY - 20} Q ${-HR * 0.5} ${HY - 18} ${-HR - 4} ${HY + 4} Z`} fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    {[[-40, -12], [-20, -34], [0, -40], [20, -34], [40, -12], [-30, 4], [0, -16], [30, 4], [-50, 6], [50, 6]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={HY - HR + 22 + y} r={6.5} fill={glow > 0 ? K.saffron : '#D9DEE2'} stroke={INK} strokeWidth={2.5} opacity={glow > 0 ? 0.6 + 0.4 * glow : 1} />
    ))}
    <path d={`M ${HR - 2} ${HY - 6} Q ${HR + 30} ${HY + 30} ${HR + 26} ${HY + 120}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
  </g>
);
/** Swim cap (marks the stimulation site) */
export const SwimCap: React.FC<{mark?: boolean}> = ({mark = true}) => (
  <g>
    <path d={`M ${-HR - 3} ${HY + 2} Q ${-HR - 5} ${HY - HR - 18} 0 ${HY - HR - 16} Q ${HR + 5} ${HY - HR - 18} ${HR + 3} ${HY + 2} Q ${HR * 0.5} ${HY - 22} 0 ${HY - 24} Q ${-HR * 0.5} ${HY - 22} ${-HR - 3} ${HY + 2} Z`} fill={K.swimCap} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M ${-HR * 0.6} ${HY - HR + 2} Q 0 ${HY - HR - 12} ${HR * 0.6} ${HY - HR + 2}`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} />
    {mark && <g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round"><path d={`M -30 ${HY - HR + 6} l 12 12 M -18 ${HY - HR + 6} l -12 12`} /></g>}
  </g>
);
/** Earbuds / noise-cancelling earphones (the receiver hears nothing of the game). */
export const Earbuds: React.FC = () => (
  <g>
    <circle cx={-HR - 4} cy={HY + 8} r={10} fill="#F4F6F8" stroke={INK} strokeWidth={3.5} />
    <circle cx={HR + 4} cy={HY + 8} r={10} fill="#F4F6F8" stroke={INK} strokeWidth={3.5} />
  </g>
);
/** Over-ear headphones (2014 receivers) */
export const Headphones: React.FC<{color?: string}> = ({color = '#2E3F5C'}) => (
  <g>
    <path d={`M ${-HR - 8} ${HY + 4} Q ${-HR - 8} ${HY - HR - 22} 0 ${HY - HR - 24} Q ${HR + 8} ${HY - HR - 22} ${HR + 8} ${HY + 4}`} fill="none" stroke={INK} strokeWidth={12} />
    <path d={`M ${-HR - 8} ${HY + 4} Q ${-HR - 8} ${HY - HR - 22} 0 ${HY - HR - 24} Q ${HR + 8} ${HY - HR - 22} ${HR + 8} ${HY + 4}`} fill="none" stroke={color} strokeWidth={6} />
    <rect x={-HR - 18} y={HY - 14} width={20} height={40} rx={8} fill={color} stroke={INK} strokeWidth={4} />
    <rect x={HR - 2} y={HY - 14} width={20} height={40} rx={8} fill={color} stroke={INK} strokeWidth={4} />
  </g>
);
export const HEAD = {y: HY, r: HR};

// Small "route" icons built from the film's own actors (no text): the model, the targeted delivery, the DNA switch,
// the surviving cell. Each draws centred at the origin in about a 140-unit box.
import React from 'react';
import {M, C} from '../theme';
import {Twin3D} from './digital';
import {Antibody, DnaSwitch, TargetReceptor} from './molecules';
import {Cell, LOOK} from './cells';

export const TwinIcon: React.FC<{t: number; s?: number}> = ({t, s = 1}) => (
  <g transform={`scale(${s})`}><Twin3D shape={{R: 46, seed: 4}} rotY={t * 0.6} lw={2} nLat={7} nLon={10} /></g>
);
export const AdcIcon: React.FC<{t: number; s?: number}> = ({t, s = 1}) => (
  <g transform={`scale(${s})`}>
    <line x1={-60} y1={46} x2={60} y2={46} stroke={M.membrane} strokeWidth={8} strokeLinecap="round" />
    <g transform="translate(0 40) scale(0.7)"><TargetReceptor t={t} /></g>
    <g transform="translate(0 -36) rotate(180) scale(0.62)"><Antibody t={t} payloads={4} /></g>
  </g>
);
export const DeviceIcon: React.FC<{t: number; s?: number; open?: number}> = ({t, s = 1, open = 0}) => (
  <g transform={`scale(${s * 0.42})`}><DnaSwitch t={t} open={open} unlock={open} /></g>
);
export const SurvivorIcon: React.FC<{t: number; s?: number}> = ({t, s = 1}) => (
  <g transform={`scale(${s})`}>
    {[[-40, 26], [36, 30], [-10, -40]].map(([x, y], i) => <Cell key={i} x={x} y={y} r={22} seed={i + 3} t={t} look={LOOK.tumor} die={0.85} detail={0} lw={1.6} />)}
    <Cell x={4} y={6} r={30} seed={9} t={t} look={LOOK.resist} detail={0} lw={2} />
  </g>
);
export const Card: React.FC<{w?: number; h?: number; edge?: string; fill?: string; op?: number; dash?: boolean}> = ({w = 180, h = 180, edge = M.wire, fill = M.screenLift, op = 1, dash = false}) => (
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={fill} stroke={edge} strokeWidth={3} opacity={op} strokeDasharray={dash ? '10 8' : undefined} />
);
export const INK = C.ink;

// The refuge entrance from inside (E1, E2): the sliding glass doors with the outer shutter beyond, a tall side glass
// wall to the right that keeps showing the outside (the esplanade, the river, the far bank), the vestibule's warm walls.
// World units, the inside floor at y = 0. Things that pass outside (a patrol drone, wardens) are drawn in `OutsideView`
// so they appear behind the glass both through the doors and through the side glass.
import React from 'react';
import {C, REF, SYS} from '../../theme';
import {EntryDoorsInside, GlassWall, InteriorFloor} from '../../sets/refugeInterior';
import {FarBank, River, CantileverBridge} from '../../sets/refugeFar';
import {Plant} from '../../sets/refugePlants';
import {refLight} from '../../sets/refugeLight';
import {Glow} from '../../fx/light';
import {mixHex} from '../../fx/common';
import {clamp} from '../../kit/math';

export const DOOR = {x: 0, y: 0, s: 1.1};
export const DOOR_W = 560 * DOOR.s, DOOR_H = 600 * DOOR.s;
export const GLASS = {x0: 520, x1: 2400, top: -1060};
export const OUT = {ground: -150, river: -260}; // outside: esplanade line and the river's near edge (farther = higher)

/** The view outside (behind the doors and the side glass). `passers` are drawn among the outside things. */
export const OutsideView: React.FC<{t: number; time: number; ink: number; passers?: React.ReactNode}> = ({t, time, ink, passers}) => {
  const L = refLight(time);
  const pave = mixHex('#C9C0B2', L.tint, L.tintOp), paveD = mixHex('#A89E90', L.tint, L.tintOp);
  return (
    <g>
      <defs>
        <linearGradient id="entSky" x1="0" y1="-1600" x2="0" y2={OUT.river} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={L.skyTop} /><stop offset="100%" stopColor={L.skyLow} />
        </linearGradient>
      </defs>
      <rect x={-2000} y={-1700} width={5000} height={1700} fill="url(#entSky)" />
      <g transform={`translate(0 ${OUT.river}) scale(0.5) translate(0 ${-OUT.river})`}>
        <FarBank x0={-4000} x1={6000} y={OUT.river - 20} t={t} time={time} ink={ink} seed={12} height={620} />
        <CantileverBridge x={1800} y={OUT.river} w={3600} h={560} time={time} ink={ink} />
      </g>
      <River x0={-2000} x1={3000} y={OUT.river} depth={120} t={t} time={time} ink={ink} seed={12} />
      {/* esplanade railing and paving outside */}
      {Array.from({length: 26}, (_, i) => -2000 + i * 180).map((xx) => <rect key={xx} x={xx - 4} y={OUT.ground - 120} width={8} height={120} fill="#4A4743" />)}
      <rect x={-2000} y={OUT.ground - 124} width={5000} height={10} rx={5} fill="#4A4743" />
      <rect x={-2000} y={OUT.ground} width={5000} height={200} fill={pave} />
      {Array.from({length: 30}, (_, i) => -2000 + i * 170).map((xx) => <line key={`p${xx}`} x1={xx} y1={OUT.ground} x2={xx - 30} y2={OUT.ground + 150} stroke={paveD} strokeWidth={ink * 0.6} />)}
      {/* a lamp post */}
      <rect x={1240} y={OUT.ground - 520} width={14} height={520} fill="#3E4A52" />
      <path d={`M ${1212} ${OUT.ground - 505} Q ${1247} ${OUT.ground - 548} ${1282} ${OUT.ground - 505} Z`} fill="#3E4A52" />
      <Glow x={1247} y={OUT.ground - 490} r={130} color="#FFD58A" opacity={0.6 * L.lamps} id="entLamp" />
      {passers}
    </g>
  );
};

/** The vestibule: walls, the doors (with the shutter outside them), the side glass, the floor. */
export const EntryRoom: React.FC<{t: number; time: number; ink: number; open: number; shutter: number; sensor?: 'idle' | 'deny' | 'off'; lock?: number; passers?: React.ReactNode; glint?: number}> =
  ({t, time, ink, open, shutter, sensor = 'idle', lock = 0, passers, glint = 1}) => {
    const L = refLight(time);
    const wall = mixHex('#EAD9B6', '#3A3550', 0.35 * L.lamps), wallD = mixHex('#D9C59E', '#2E2A44', 0.35 * L.lamps);
    const l = DOOR.x - DOOR_W / 2, r = DOOR.x + DOOR_W / 2, top = DOOR.y - DOOR_H;
    const ret = 60 * DOOR.s;
    return (
      <g>
        <OutsideView t={t} time={time} ink={ink} passers={passers} />
        {/* interior walls around the openings */}
        <rect x={-2400} y={-1700} width={2400 + l - ret} height={1700} fill={wall} />
        <rect x={r + ret} y={-1700} width={GLASS.x0 - r - ret} height={1700} fill={wall} />
        <rect x={l - ret} y={-1700} width={GLASS.x0 - l + ret} height={1700 + top - ret} fill={wall} />
        <rect x={-2400} y={-1700} width={5000} height={1700 + GLASS.top - 40} fill={wallD} />
        <rect x={-2400} y={GLASS.top - 60} width={5000} height={34} fill={REF.mullion} stroke={C.ink} strokeWidth={ink * 0.7} />
        <EntryDoorsInside x={DOOR.x} y={DOOR.y} s={DOOR.s} open={open} shutter={shutter} t={t} ink={ink} time={time} sensor={sensor} seed={7}
          outside={<OutsideView t={t} time={time} ink={ink} passers={passers} />} />
        {/* lock indicator over the doors: amber once the shutter has locked */}
        <rect x={DOOR.x - 40} y={top - ret - 50} width={80} height={30} rx={12} fill={SYS.panel} stroke={C.ink} strokeWidth={ink * 0.7} />
        <circle cx={DOOR.x} cy={top - ret - 35} r={9} fill={lock > 0.5 ? SYS.lock : '#5E6E78'} />
        {lock > 0.01 && <Glow x={DOOR.x} y={top - ret - 35} r={60} color={SYS.lock} opacity={0.55 * clamp(lock)} id="entLock" />}
        <GlassWall x0={GLASS.x0} x1={GLASS.x1} yTop={GLASS.top} yFloor={0} t={t} ink={ink} spacing={460} time={time} seed={5} glint={glint} />
        <InteriorFloor x0={-2400} x1={2600} y={0} depth={900} time={time} ink={ink} vx={0} />
        <Plant x={-620} y={0} s={1.0} t={t} seed={71} ink={ink} kind="tall" />
      </g>
    );
  };

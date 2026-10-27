// D5 (544-618, "They've demonstrated this on laboratory targets."): one rise over the bench. It opens low and close,
// three-quarter from the target's side (az -28): the medic stands where it fired, the spent injector bridging its tube
// and the clear target (the needle in the silicone, the plunger at the front of the empty barrel, the amber bloom inside
// the block); it waits, breathing, antennae searching low and wide. The camera cranes up and back (motivated by the
// array it reveals): the bench top opens out into a row of earlier trials' clear targets, each with its puncture and a
// faded amber dose, the vials at the back of the bench, then the lab wall rises into frame with its tall window, bright
// with daylight; the window's light grows over the bench (a warm shaft across it) and in the last frames it fills the
// frame (the film's daylight bloom carries it into E1).
import React from 'react';
import {sr, lerp, clamp} from '../../../lib/ease';
import {V3} from '../../../lib/v3';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, Pd, P, f2} from '../../roach/ortho';
import {Target2D, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {dPoseFull, dGear, dLaunch, dBloom, D_FACE, D_TUBE_Y} from './trial';
import {LabRoomMM, ROOM} from './room';
import {InsideNeedle, NeedleClip, OldDose} from './inside';

const R = shotRange('D5');
export const D5_AZ = -28;
/** the rise: 0 at the first frame, 1 at the last (eased; it is still moving gently as the light takes over) */
export const d5Rise = (f: number) => sr(f, R.from - 2, R.to + 10);
export const d5View = (f: number): View => {
  const u = d5Rise(f);
  return viewAt(D5_AZ, lerp(8, 36, u), lerp(7.4, 2.25, u), [lerp(22, 20, u), lerp(16, 0, u), lerp(0, -110, u)], 540, lerp(1150, 1430, u));
};
/** the wall plate: a little larger as the camera rises toward the window; the window centred over the bench */
const plateK = (f: number) => lerp(1.05, 1.32, d5Rise(f));
const PLATE_DX = (k: number) => 648 - 540 - k * (1475 - 540);
/** the window's light: it brightens as the camera rises, then fills the frame in the last frames */
export const d5Light = (f: number) => sr(f, R.from + 30, R.to - 6);
export const d5Fill = (f: number) => clamp((f - (R.to - 9)) / 8);

/** a view shifted so that a prop drawn at the origin stands at world offset o */
const shifted = (v: View, o: V3): View => {
  const d = Pd(v, o);
  return {...v, ox: v.ox + d[0], oy: v.oy + d[1]};
};
/** the earlier trials' targets: world offset of each (its face at x = D_FACE + o[0]) and its old dose height */
const OLD: {o: V3; y: number; k: number}[] = [
  {o: [-146, 0, -110], y: 25, k: 0.9},
  {o: [172, 0, -110], y: 28, k: 0.75},
  {o: [-201, 0, -220], y: 23, k: 0.85},
  {o: [-25, 0, -230], y: 27, k: 0.7},
  {o: [270, 0, -220], y: 24, k: 0.8},
];

/** the tall window (in the wall plate's scene px, as LabWall2's: x 1250-1700, y 120-860), lit */
const Window: React.FC<{id: string; v: View; k: number; dx: number; light: number}> = ({id, v, k, dx, light}) => {
  const yJ = P(v, [0, 0, ROOM.zWall])[1];
  const X = (x: number) => 540 + dx + k * (x - 540);
  const Y = (y: number) => yJ + k * (y - 1080);
  const x0 = X(1250), x1 = X(1700), y0 = Y(120), y1 = Y(860);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4FBFF" />
          <stop offset="1" stopColor="#FFF4DC" />
        </linearGradient>
        <radialGradient id={`${id}-gl`}>
          <stop offset="0" stopColor="#FFF8E6" stopOpacity={0.75} />
          <stop offset="1" stopColor="#FFF8E6" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M${f2(x0)},${f2(y0)} H${f2(x1)} V${f2(y1)} H${f2(x0)} Z`} fill={`url(#${id}-sky)`} opacity={0.55 + 0.45 * light} />
      <path d={`M${f2(cx)},${f2(y0)} V${f2(y1)} M${f2(x0)},${f2(lerp(y0, y1, 0.5))} H${f2(x1)}`} stroke={LAB2.shelf} strokeWidth={f2(10 * k)} />
      <path d={`M${f2(x0)},${f2(y0)} H${f2(x1)} V${f2(y1)} H${f2(x0)} Z`} fill="none" stroke={LAB2.shelf} strokeWidth={f2(16 * k)} />
      {/* the glass's light spilling round the frame */}
      <ellipse cx={f2(cx)} cy={f2(cy)} rx={f2((x1 - x0) * (0.75 + 0.5 * light))} ry={f2((y1 - y0) * (0.65 + 0.35 * light))} fill={`url(#${id}-gl)`} opacity={0.25 + 0.75 * light} />
    </g>
  );
};

export const D5: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d5View(f);
  const pose = dPoseFull(t);
  const g = dGear(t);
  const d = dLaunch(t);
  const inj = dPoseFull(t, false).frame;
  const id = `d5f${f}`;
  const k = plateK(f);
  const dx = PLATE_DX(k);
  const light = d5Light(f);
  const fill = d5Fill(f);
  const yJ = P(v, [0, 0, ROOM.zWall])[1];
  const win = {x0: 540 + dx + k * (1250 - 540), x1: 540 + dx + k * (1700 - 540), y1: yJ + k * (860 - 1080)};
  // far to near
  const olds = OLD.map((q, i) => ({...q, i, depth: q.o[0] * v.F[0] + q.o[2] * v.F[2]})).sort((a, b) => a.depth - b.depth);
  const fillC = {x: (win.x0 + win.x1) / 2, y: win.y1 - 370 * k};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <NeedleClip id={`${id}-nc`} v={v} inj={inj} injRear={d.injRear} face={D_FACE} />
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6DE" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFF6DE" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-fill`} gradientUnits="userSpaceOnUse" cx={f2(fillC.x)} cy={f2(fillC.y)} r={f2(lerp(500, 1900, fill))}>
          <stop offset="0" stopColor="#FFFDF6" stopOpacity={1} />
          <stop offset="0.55" stopColor="#FFF6E2" stopOpacity={0.95} />
          <stop offset="1" stopColor="#FFF1D6" stopOpacity={0.6} />
        </radialGradient>
      </defs>
      <LabRoomMM id={`${id}room`} v={v} blur={lerp(5, 1.2, d5Rise(f))} plate={k} plateDx={dx} tray={[-330, 420, -290, 150]} />
      <Window id={`${id}win`} v={v} k={k} dx={dx} light={light} />
      {/* the window's light falling across the bench, growing as it brightens */}
      {light > 0.01 && (
        <path d={`M${f2(win.x0)},${f2(win.y1)} L${f2(win.x1)},${f2(win.y1)} L${f2(win.x1 + 420)},${f2(1920)} L${f2(win.x0 - 260)},${f2(1920)} Z`} fill={`url(#${id}-sh)`} opacity={0.55 * light} />
      )}
      {olds.map((q) => {
        const vs = shifted(v, q.o);
        return (
          <g key={q.i}>
            <Target2D id={`${id}o${q.i}`} v={vs} face={D_FACE} dir={1} />
            <OldDose id={`${id}od${q.i}`} v={vs} face={D_FACE} y={q.y} z={0} k={q.k} />
          </g>
        );
      })}
      <Target2D id={`${id}t`} v={v} face={D_FACE} dir={1} dent={1} entryY={D_TUBE_Y} />
      <InsideNeedle id={`${id}in`} v={v} inj={inj} injRear={d.injRear} face={D_FACE} bloom={dBloom(t)} />
      <g clipPath={`url(#${id}-nc)`}>
        <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={g} />}} />
      </g>
      {/* the daylight takes the frame */}
      {fill > 0 && <rect width={1080} height={1920} fill={`url(#${id}-fill)`} opacity={0.7 * fill} />}
    </svg>
  );
};

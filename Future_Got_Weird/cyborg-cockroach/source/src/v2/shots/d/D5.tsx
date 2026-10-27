// D5 (578-619, "on laboratory targets."): back to the whole animal in the lab, three-quarter from behind the target's
// face (az -24, el 17), so the spent injector reads clearly: the medic stands where it fired, the barrel's rear still
// in its tube, the needle in the silicone, the plunger at the front of the empty barrel and the small amber bloom inside
// the target. It waits: breathing, antennae searching low and wide. One eased pull-back reveals the bench: the pale
// tray, more silicone targets in their cradles from earlier trials (each with its puncture and a faded amber bloom),
// vials at the back of the bench, and the lab wall (shelves of jars, the teal stripe).
import React from 'react';
import {sr, lerp} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, Pd} from '../../roach/ortho';
import {Target2D} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {dPoseFull, dGear, dDeploy, D_FACE} from './trial';
import {LabRoomMM} from './room';
import {InsideNeedle, NeedleClip, OldDose} from './inside';
import {d3Bloom} from './D3';
import {V3} from '../../../lib/v3';

const R = shotRange('D5');
export const D5_AZ = -24, D5_EL = 17;
export const d5View = (f: number): View => {
  const u = sr(f, R.from - 3, R.to + 3);
  return viewAt(D5_AZ, D5_EL, lerp(9.6, 5.6, u), [lerp(22, 46, u), lerp(16, 20, u), lerp(0, -55, u)], 540, 1000);
};
/** a view shifted so that a prop drawn at the origin stands at world offset o */
const shifted = (v: View, o: V3): View => {
  const d = Pd(v, o);
  return {...v, ox: v.ox + d[0], oy: v.oy + d[1]};
};
/** the earlier trials' targets: world offset of each target (its face at x = D_FACE + o[0]) and the old dose height */
const OLD: {o: V3; y: number}[] = [
  {o: [92, 0, -125], y: 25},
  {o: [-118, 0, -175], y: 28},
  {o: [176, 0, -40], y: 23},
];

export const D5: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d5View(f);
  const pose = dPoseFull(t);
  const g = dGear(t);
  const d = dDeploy(t);
  const inj = dPoseFull(t, false).frame;
  const id = 'd5';
  // far to near
  const olds = OLD.map((q, i) => ({...q, i, depth: q.o[0] * v.F[0] + q.o[2] * v.F[2]})).sort((a, b) => a.depth - b.depth);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <NeedleClip id={`${id}-nc`} v={v} inj={inj} injRear={d.injRear} face={D_FACE} />
      </defs>
      <LabRoomMM id={`${id}room`} v={v} blur={lerp(4, 2.2, sr(f, R.from, R.to))} plate={1.05} tray={[-260, 330, -230, 140]} />
      {olds.map((q) => {
        const vs = shifted(v, q.o);
        return (
          <g key={q.i}>
            <Target2D id={`${id}o${q.i}`} v={vs} face={D_FACE} dir={1} />
            <OldDose id={`${id}od${q.i}`} v={vs} face={D_FACE} y={q.y} z={0} k={0.9} />
          </g>
        );
      })}
      <Target2D id={`${id}t`} v={v} face={D_FACE} dir={1} dent={1} entryY={27.6} />
      <InsideNeedle id={`${id}in`} v={v} inj={inj} injRear={d.injRear} face={D_FACE} bloom={d3Bloom(t)} />
      <g clipPath={`url(#${id}-nc)`}>
        <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={g} />}} />
      </g>
    </svg>
  );
};

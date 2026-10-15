// Shared street-world helpers: the lawn's ground line, the follow-through of head and hair, and the contact
// shadows (used by shots/Scene.tsx and shots/Opening.tsx). World units: the front lawn's ground line under the man
// is GROUND; the camera names the world point at screen centre. Everything is a pure function of the frame.
// V4: the V2 fall scene (StreetScene, its pose keys and its hand-held leash) was dead code and is removed; the
// leash is art/Leash.tsx, drawn by Scene.
import React from 'react';
import {manJoints, ManPose} from '../art/Man';
import {clamp, V} from '../lib/math';
import {SoftShadow} from '../lib/shade';
import {chainLag} from '../lib/motion';

export const GROUND = 1800;

/** Overlapping action for any body-pose function: the head trails the torso's rotation and the hair spikes
 *  swing behind the head (springs over the last frames). */
export const followThrough = (body: (f: number) => ManPose, f: number) => {
  const torsoAng = (t: number) => {
    const m = body(t);
    return m.torso + m.chest;
  };
  const r = chainLag(torsoAng, f);
  return {headLag: clamp(r.head, -18, 18), hairSway: clamp(r.hair * 0.9, -14, 14)};
};

/** Contact shadows from whichever joints are near the ground. */
export const Contacts: React.FC<{id: string; j: ReturnType<typeof manJoints>; ground: number}> = ({id, j, ground}) => {
  const pts: [V, number, number][] = [
    [j.lLeg.A, 70, 16],
    [j.rLeg.A, 64, 15],
    [j.lLeg.toe, 50, 12],
    [j.rLeg.toe, 46, 12],
    [j.lLeg.K, 60, 16],
    [j.rLeg.K, 56, 15],
    [j.H, 120, 22],
    [j.C, 130, 22],
    [j.Sh, 110, 20],
    [j.head, 90, 18],
  ];
  return (
    <g>
      {pts.map(([p, rx, ry], i) => {
        const a = clamp(1 - (ground - p.y) / 150) * 0.42;
        if (a < 0.01) return null;
        return <SoftShadow key={i} id={`${id}-c${i}`} c={{x: p.x + 14, y: ground + 4}} rx={rx * j.s} ry={ry * j.s} alpha={a} />;
      })}
    </g>
  );
};


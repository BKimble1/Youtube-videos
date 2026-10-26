// S12 as it plays in the film: the rubble agent's shot (S12.tsx) with the survivor composited through its `person`
// slot, placed exactly as the alcove shots place her (fingertips pinned on ALCOVE.tips) and acting as S13 opens: weary,
// eyes on the gap, near hand half open.
import React from 'react';
import {Cam, proj} from '../lib/cam';
import {S12} from './S12';
import {survivorAt, yawFor, s13Acting} from './S13';
import {Survivor} from '../crew/person';
import {ALCOVE} from '../sets/Alcove';
import {ShotProps} from './index';
import {FPS} from '../timeline';

const S12Person: React.FC<{cam: Cam; T: number}> = ({cam, T}) => {
  const yaw = yawFor(cam);
  const elev = Math.max(0, (Math.atan2(cam.eye[1] - 150, Math.hypot(cam.eye[0], cam.eye[2])) * 180) / Math.PI);
  const place = survivorAt(cam, T, {id: 's12p', yaw, elev});
  const A = s13Acting(T);
  const g = proj(cam, [ALCOVE.gap[0], 25, ALCOVE.gap[2]]);
  return <Survivor id="s12p" yaw={yaw} elev={elev} {...place} t={T} recog={A.recog} recoil={A.recoil} handOpen={A.handOpen} blink={A.blink} gaze={{x: g[0], y: g[1]}} dust={0.7} />;
};

export const S12Film: React.FC<ShotProps> = (p) => <S12 {...p} person={(cam) => <S12Person cam={cam} T={p.f / FPS} />} />;

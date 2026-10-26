// V3 beat B: the site view for B's push: View3 with two extras that View3 now takes as props:
//   dk    fade the opening discharge out completely as the push leaves it;
//   rain  thin the rain as the lens zooms (a 2D zoom stretches the near streaks into long scratches across the tip).
// With dk = rain = 1 it is View3 exactly, which is what B's first frames draw (the A -> B seam).
import React from 'react';
import {Cam3} from '../v2/p3';
import {St, View3} from './view3';

export const ViewB: React.FC<{cam: Cam3; st: St; t: number; tag: string; dk: number; rain: number}> = ({cam, st, t, tag, dk, rain}) => (
  <View3 cam={cam} st={st} t={t} tag={tag} dk={dk} rain={rain} />
);

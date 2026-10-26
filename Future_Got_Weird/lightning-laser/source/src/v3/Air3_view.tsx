// V3 beat B: the site view for B's push. It is View3 (view3.tsx) piece for piece, in the same order with the same
// props, plus two things View3 cannot do:
//   dk    fade the opening discharge out completely (Discharge3D keeps its white core at 0.6 opacity whenever s > 0,
//         even at core = 0, so after openSt's fade the bolt would stay as a bright line and its branches would crowd
//         the push);
//   rain  thin the rain as the lens zooms (a 2D zoom stretches the near streaks into long scratches across the tip).
// With dk = rain = 1 it is View3 itself, which is what B's first frames draw (the A -> B seam).
import React from 'react';
import {BOLT3, Cam3, EXIT3, len3, sub3, v3} from '../v2/p3';
import {Apparatus3D, Beam3D, Discharge3D, FlashWash, Sky3D, Tower3D} from './Scene3';
import {St, TipCorona3, View3} from './view3';
import {tau3} from './timeline3';

export const ViewB: React.FC<{cam: Cam3; st: St; t: number; tag: string; dk: number; rain: number}> = ({cam, st, t, tag, dk, rain}) => {
  if (dk >= 1 && rain >= 1) return <View3 cam={cam} st={st} t={t} tag={tag} />;
  const top = st.s > 0 ? BOLT3.pts[Math.max(0, BOLT3.pts.findIndex((p) => p.s >= Math.min(st.s, BOLT3.total)))] : undefined;
  const drift = tau3(t);
  const apFirst = len3(sub3(EXIT3, cam.pos)) > len3(sub3(v3(0, 60, 0), cam.pos));
  return (
    <g>
      <Sky3D cam={cam} flash={st.flash} boltTop={top} drift={drift} rainT={drift + 40} rain={rain} />
      {apFirst && st.apparatus && <Apparatus3D cam={cam} flash={st.flash} fire={1} id={`${tag}-ap`} />}
      <Tower3D cam={cam} flash={st.flash} aviation={0.5 + 0.5 * Math.sin(drift * 3.4)} id={`${tag}-tw`} />
      {!apFirst && st.apparatus && <Apparatus3D cam={cam} flash={st.flash} fire={1} id={`${tag}-ap`} />}
      <Beam3D cam={cam} alpha={st.beam} pulses={st.pulses} channel={st.channel} channelTop={st.channelTop} id={`${tag}-bm`} />
      <TipCorona3 cam={cam} k={st.tipCorona} t={t} />
      {/* the wrapper carries the screen blend itself, so fading it keeps the discharge screen-blended on the sky */}
      {dk > 0.003 && (
        <g opacity={dk} style={{mixBlendMode: 'screen'}}>
          <Discharge3D cam={cam} s={st.s} core={st.core} id={`${tag}-dc`} />
        </g>
      )}
      {top && <FlashWash cam={cam} at={top} flash={st.flash} id={`${tag}-fw`} />}
    </g>
  );
};

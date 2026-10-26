// Glass Climbing V7: the exterior views. The tower, the street and the traffic are the perspective scene (Tower7); the
// climber is the hand-drawn Weird Crew character of the bay views (BayWorld, without its scenery), drawn over it at the
// scale of his depth: the bay camera is set so that the glass point between his pads lands where the perspective
// camera puts it, at the perspective's scale there. He is drawn in profile, so these cameras look along the facade
// (from the +z side, out from the glass), where a profile reads correctly.
import React from 'react';
import {Cam} from '../dc/camera';
import {H, W} from '../lib';
import {kOf} from '../camera';
import {BayWorld5 as BayWorld7} from './Bay7';
import {ClimbState} from './climb7';
import {Cam3, fromBay, makeCam, TowerScene, UPM} from './Tower7';

/** the bay camera that puts the climber where the perspective camera sees him */
export const bayCamFor = (cam: Cam3, st: ClimbState): Cam => {
  const ref = {x: 0, y: (st.padL.y + st.padR.y) / 2};
  const s = makeCam(cam).pr(fromBay(ref.x, ref.y, 0));
  const z = cam.f / Math.max(0.05, s.d) / UPM;
  return {x: ref.x - (s.x - W / 2) / z, y: ref.y - (s.y - H / 2) / z, z};
};
/** the screen angle (deg) of the building's vertical at the climber, and its screen point: he is drawn upright to it */
export const uprightFor = (cam: Cam3, st: ClimbState) => {
  const C = makeCam(cam);
  const y = (st.padL.y + st.padR.y) / 2;
  const a = C.pr(fromBay(0, y, 0)), b = C.pr(fromBay(0, y - 300, 0));
  return {x: a.x, y: a.y, deg: (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI};
};

export const Exterior7: React.FC<{id: string; f: number; cam: Cam3; st: ClimbState | null; detail?: number}> = ({id, f, cam, st, detail = 1}) => {
  const bc = st ? bayCamFor(cam, st) : null;
  const up = st ? uprightFor(cam, st) : null;
  return (
    <>
      <TowerScene id={`${id}-t`} cam={cam} f={f} st={null} detail={detail} />
      {st && bc && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <g transform={`rotate(${up ? up.deg.toFixed(3) : 0} ${up ? up.x.toFixed(2) : 0} ${up ? up.y.toFixed(2) : 0})`}>
            <BayWorld7 id={`${id}-m`} st={st} cam={bc} k={kOf(Math.min(bc.z, 8))} f={f} scenery={false} />
          </g>
        </svg>
      )}
    </>
  );
};

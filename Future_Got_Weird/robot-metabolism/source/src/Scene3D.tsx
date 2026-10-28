// One 3D view: a camera, the station's scenery and the robots, painted far to near.
import React from 'react';
import {Cam, Item, Paint, projector, Proj, resetIds, W, H} from './lib/r3';
import {V3} from './lib/v3';

/** id prefix for simultaneous views (contact sheets, a monitor inside a shot) */
export const IdCtx = React.createContext('a');

export const Scene3D: React.FC<{cam: Cam; build: (P: Proj, Pw: Proj) => (Item | null | undefined | false)[]; xf?: (p: V3) => V3; bg?: string; w?: number; h?: number; idp?: string}> = ({cam, build, xf, bg = '#F2E8D5', w = W, h = H, idp = 'a'}) => {
  const outer = React.useContext(IdCtx);
  resetIds(outer + idp);
  const P = projector(cam, xf);
  const Pw = xf ? projector(cam) : P;
  const items = build(P, Pw);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={W} height={H} fill={bg} />
      <Paint items={items} />
    </svg>
  );
};

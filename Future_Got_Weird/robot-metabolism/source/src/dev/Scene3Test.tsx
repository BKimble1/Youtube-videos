// dev still: the V3 world at time t from a given camera (framing tests)
import React from 'react';
import {order3, Paint3, projector, resetIds} from '../lib/r3';
import {cam} from '../lib/campath';
import {sceneItems} from '../v3/scene';
import {world} from '../v3/story';
import {prof} from '../v3/world';

export const Scene3Test: React.FC<{t: number; eye: [number, number, number]; target: [number, number, number]; f: number; label?: boolean; follow?: boolean}> = ({t, eye, target, f, label = true, follow = false}) => {
  resetIds('s');
  let e = eye, tg = target;
  if (follow) {
    // eye and target given relative to the hero's front edge (x) and the surface under it
    const fx = world(t).fx;
    const y = prof(fx).y;
    e = [fx + eye[0], y + eye[1], eye[2]];
    tg = [fx + target[0], y + target[1], target[2]];
  }
  const P = projector(cam(e, tg, f));
  const items = sceneItems(P, t);
  const {stats} = order3(items, P);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <rect width={1080} height={1920} fill="#F2E8D5" />
      <Paint3 items={items} P={P} />
      {label && <text x={24} y={1890} fontSize={34} fill="#C0392B">t {t.toFixed(2)}  cycles {stats.map((s) => s.cycles).join(',')}</text>}
    </svg>
  );
};

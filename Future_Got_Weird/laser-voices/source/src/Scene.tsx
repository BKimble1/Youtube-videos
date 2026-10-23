// The room, the bench and transmitter and the two people, drawn through one camera and painted far-to-near.
import React from 'react';
import {Basis, proj} from './p3';
import {Bench, DevState, Shell} from './Room';
import {LOOK_B, LOOK_R, Person, Pose} from './Person';
import {BENCH} from './world';
import {v3} from './p3';

export const RoomScene: React.FC<{b: Basis; rec: Pose; by: Pose; dev: DevState; hideBy?: boolean}> = ({b, rec, by, dev, hideBy}) => {
  const items: {d: number; node: React.ReactNode}[] = [];
  const benchC = v3((BENCH.x0 + BENCH.x1) / 2 + 0.4, 1.0, (BENCH.z0 + BENCH.z1) / 2 + 0.2);
  items.push({d: proj(b, benchC).d, node: <Bench key="bench" b={b} id="bn" dev={dev} />});
  items.push({d: proj(b, v3(rec.pos.x, 1.0, rec.pos.z)).d, node: <Person key="rec" id="rec" b={b} pz={rec} look={LOOK_R} />});
  if (!hideBy) items.push({d: proj(b, v3(by.pos.x, 1.0, by.pos.z)).d, node: <Person key="by" id="by" b={b} pz={by} look={LOOK_B} cull />});
  items.sort((a, c) => c.d - a.d);
  return (
    <g>
      <Shell b={b} id="sh" />
      {items.map((i) => i.node)}
    </g>
  );
};

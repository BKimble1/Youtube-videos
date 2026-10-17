// The avenue scene (C1–C4): one layer stack so every shot of set piece 1 shows the same machines in the same place at
// the same film time. Shots pass the camera, the Crew (already posed) and any shot-specific effects.
import React from 'react';
import {Cam, Frame, Grade, Layer, inkFor} from '../../kit/cam';
import {Cast, ActorProps} from '../../rig/actor';
import {Smoke, Embers, Glow} from '../../fx';
import {SYS} from '../../theme';
import {AvenueSky, AvenueBack, WrecksFar, WrecksNear, GapTaxi, AvenueViaductFront, Pole, FireLight, Drone, Hauler, AutoCar, HAULER} from './avenue';
import {hauler, gapTaxi, car, CARS} from './machines';

export type AvenueSceneProps = {
  cam: Cam; T: number; crew: ActorProps[];
  pole?: {pan: number; lock: number; look?: {x: number; y: number}};
  drones?: React.ReactNode; back?: React.ReactNode; mid?: React.ReactNode; front?: React.ReactNode; screen?: React.ReactNode;
  extraParts?: {z: number; el: React.ReactElement}[];
  grade?: {flash?: number; tintOp?: number}; id: string; inkScale?: number;
};

export const AvenueScene: React.FC<AvenueSceneProps> = ({cam, T, crew, pole, drones, back, mid, front, screen, extraParts, grade, id, inkScale = 1}) => {
  const ink = inkFor(cam.z) * inkScale;
  const h = hauler(T);
  const gt = gapTaxi(T);
  const haul = <Hauler x={h.x} y={h.y} s={HAULER.s} dir={-1} t={T} dist={h.d} ink={ink} lights={h.lights} lock={h.lights} crush={h.crush} sparkT0={h.crush > 0 ? undefined : undefined} seed={3} glow={0.3 + 0.5 * h.lights} />;
  const cars = CARS.map((_, i) => {
    const c = car(i, T);
    const gx = c.x + c.dir * 95 * 0.85, gy = c.y - 446 * 0.85;
    return {y: c.y, el: (
      <g key={i}>
        <AutoCar x={c.x} y={c.y} s={0.85} dir={c.dir} t={T} dist={c.dist} ink={ink} variant={c.variant} sensor={c.sensor} lights={c.lights} lock={c.lock} seed={c.seed} />
        <Glow x={gx} y={gy} r={150} color={c.lock ? SYS.lock : SYS.sensor} opacity={0.75 * c.sensor} id={`${id}cg${i}`} squash={0.6} />
      </g>
    )};
  });
  return (
    <Frame bg={'#2B1B26'}>
      <AvenueSky cam={cam} t={T} />
      <Layer cam={cam}>
        <AvenueBack t={T} ink={ink} />
        <FireLight t={T} />
        {drones}
        {back}
        {h.y < -4 && haul}
        {cars.filter((c) => c.y < 100).map((c) => c.el)}
        <WrecksFar t={T} ink={ink} />
        {h.y >= -4 && haul}
        <Glow x={h.x - 470 * HAULER.s} y={h.y - 560 * HAULER.s} r={260} color={h.lights ? SYS.lock : SYS.sensor} opacity={0.25 + 0.6 * h.lights} id={`${id}hg`} />
        <GapTaxi t={T} ink={ink} shift={gt.shift} dents={gt.dents} broken={gt.broken} tilt={gt.tilt} />
        {mid}
        <Cast actors={crew} extra={extraParts} />
        <WrecksNear t={T} ink={ink} />
        {cars.filter((c) => c.y >= 100).map((c) => c.el)}
        <AvenueViaductFront ink={ink} />
        <Smoke mode="cloud" x={6900} y={-260} w={1800} h={420} n={9} t={T} drift={-40} color="#3A2F33" opacity={0.3} seed={5} id={`${id}sm`} />
        <Embers x={6600} y={-200} w={3400} h={1600} t={T} n={26} seed={4} />
        {front}
        {pole && <Pole t={T} ink={ink} pan={pole.pan} lock={pole.lock} look={pole.look} />}
      </Layer>
      {screen}
      <Grade tint="#3A1810" tintOp={grade?.tintOp ?? 0.18} vignette={0.42} id={`${id}vg`} flash={grade?.flash ?? 0} />
    </Frame>
  );
};
export {Drone};

// Lightning Laser V2: which scene draws each shot (see timeline2.ts for the shot list).
import React from 'react';
import {shotAt, ShotId} from './timeline2';
import {View3D} from './shots3d';
import {E1View, F4View, H2View} from './Composite';
import {ShelterV2} from './Console2';
import {VignetteV2} from './Vignette2';
import {F2Cutaway, F3Aperture} from './Firing2';
import {RodV2} from './Rod2';
import {M2Race, M3Ionize, M4Heat, M5Leader} from './Molecular2';
import {loopState} from './shots3d';
import {ss} from '../lib';
import {S} from './timeline2';

const THREE_D: ShotId[] = ['H1', 'H3', 'M6', 'T1', 'T2', 'T3', 'T4', 'R3', 'E2'];

const Placeholder: React.FC<{id: ShotId}> = ({id}) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#26313C" />
    <text x={540} y={960} fill="#FFF" fontSize={120} textAnchor="middle">{id}</text>
  </g>
);

export const SceneV2: React.FC<{t: number}> = ({t}) => {
  const id = shotAt(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {id === 'C1' ? <ShelterV2 t={t} mode="arm" t0={S.C1} cam={{x: 560, y: 1040, z: 1.2 + 0.05 * ss(t, S.C1, S.C2)}} /> : id === 'C2' ? <ShelterV2 t={t} mode="arm" t0={S.C1} cam={{x: 450 + 6 * ss(t, S.C2, S.V1), y: 900 - 14 * ss(t, S.C2, S.V1), z: 2.3}} /> : id === 'F1' ? <ShelterV2 t={t} mode="fire" t0={S.F1} cam={{x: 760, y: 1110, z: 2.0 + 0.1 * ss(t, S.F1, S.F2)}} /> : id === 'H2' ? <H2View t={t} /> : id === 'E1' ? <E1View t={t} /> : id === 'F4' ? <F4View t={t} /> : id === 'R1' || id === 'R2' ? <RodV2 t={t} /> : id === 'M2' ? <M2Race t={t} /> : id === 'M3' ? <M3Ionize t={t} /> : id === 'M4' ? <M4Heat t={t} /> : id === 'M5' ? <M5Leader t={t} /> : id === 'F2' ? <F2Cutaway t={t} flash={loopState(t).flash} /> : id === 'F3' ? <F3Aperture t={t} flash={loopState(t).flash} /> : id === 'V1' || id === 'M1' ? <VignetteV2 t={t} /> : THREE_D.includes(id) ? <View3D id={id} t={t} tag={id} /> : <Placeholder id={id} />}
    </svg>
  );
};

// S15 (29.70-31.20 s) "want it to get closer.": the opening's camera, exactly (S01_CAM carried into the alcove by the
// same rigid map that carries the walk), so the insect's approach to her open hand runs straight into frame 0 of S01,
// where the same walk ends at the silicone target. Her relaxed, open near hand lies at the left where the target face
// is in the opening; rubble and the daylight shaft behind. Locked off.
import React from 'react';
import {lookAt, proj} from '../lib/cam';
import {S01_CAM, S01_EYE, S01_TGT} from './S01';
import {labToAlc} from './alcoveWorld';
import {AlcoveScene} from './S13';
import {ALCOVE} from '../sets/Alcove';
import {Hand3D} from '../crew/person/Hand3D';
import {depth} from '../lib/cam';
import {ypr} from '../lib/v3';
import {WALK_DIR} from './alcoveWorld';
import {ShotProps} from './index';
import {FPS} from '../timeline';

export const S15_CAM = lookAt(labToAlc(S01_EYE), labToAlc(S01_TGT), S01_CAM.f, S01_CAM.cx, S01_CAM.cy);
export const s15Acting = (T: number) => ({recog: 1, recoil: 0, handOpen: 1, exhale: 0, blink: T > 30.55 && T < 30.68 ? Math.sin(((T - 30.55) / 0.13) * Math.PI) : 0, look: 1});

/** her hand where the target stood in the opening: middle fingertip just behind the lab target face, fingers along the
 *  walk toward the insect */
export const S15_HAND = ypr(labToAlc([-52, 0, -24]), Math.atan2(-WALK_DIR[2], WALK_DIR[0]));
export const S15: React.FC<ShotProps> = ({f}) => {
  const T = f / FPS;
  const hand = {z: depth(S15_CAM, labToAlc([-90, 15, 0])), el: <Hand3D key="hand" id="s15h" cam={S15_CAM} frame={S15_HAND} t={T} />};
  return <AlcoveScene id="s15" T={T} cam={S15_CAM} A={s15Acting(T)} elev={8} legslab={false} survivor={false} extra={[hand]} />;
};
export const s15Probe = () => proj(S15_CAM, ALCOVE.tips);

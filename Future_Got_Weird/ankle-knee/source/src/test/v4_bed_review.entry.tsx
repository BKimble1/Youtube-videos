import React from 'react'; import {registerRoot} from 'remotion'; import {makeSheetRoot} from '../v4/testsheet';
import {Scene4, CAP_Y4} from '../v4/Scene4';
import {Scene3} from '../v3/Scene3';
import {FootShot3, FaceShot3} from '../v3/end3';
// t >= 600: V3 Scene3 at t - 600; 300 <= t < 600: V3 recovery shots at t - 300 (style comparison); else V4 Scene4
registerRoot(makeSheetRoot((t, k) => t >= 600 ? <Scene3 t={t - 600} fkey={k} captions={false} /> : t >= 300 ? (t - 300 < 18.55 ? <FootShot3 t={t - 300} k={k} /> : <FaceShot3 t={t - 300} k={k} />) : <Scene4 t={t} fkey={k} captions={false} />, CAP_Y4));

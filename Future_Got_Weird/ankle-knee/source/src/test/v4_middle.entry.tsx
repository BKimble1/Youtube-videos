import React from 'react'; import {registerRoot} from 'remotion'; import {makeSheetRoot} from '../v4/testsheet';
import {XrayShot4, AnatShot4, TurnShot4, CAP_Y_MIDDLE} from '../v4/middle4';
import {shot4At} from '../v4/story4';
registerRoot(makeSheetRoot((t, k) => { const s = shot4At(t); return s === 'xray' ? <XrayShot4 t={t} k={k} /> : s === 'anat' ? <AnatShot4 t={t} k={k} /> : <TurnShot4 t={t} k={k} />; }, CAP_Y_MIDDLE));

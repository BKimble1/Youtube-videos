import React from 'react'; import {registerRoot} from 'remotion'; import {makeSheetRoot} from '../v4/testsheet';
import {XrayShot4, AnatShot4, TurnShot4, CAP_Y_MIDDLE} from '../v4/middle4';
import {RevealShot4} from '../v4/pitch4';
import {RehabA4} from '../v4/rehab4';
import {shot4At} from '../v4/story4';
import {ScanShot3, AnatShot3, TurnShot3, AttachShot3} from '../v3/middle3';
import {shot3At} from '../v3/story3';
// film frames < 1000: V4 (reveal + middle); frames >= 1000: V3 middle at t - 1000/30 (render with captions off)
registerRoot(makeSheetRoot((t, k) => {
  if (t >= 1000 / 30) {
    const u = t - 1000 / 30; const s = shot3At(u);
    return s === 'scan' ? <ScanShot3 t={u} k={k} /> : s === 'anat' ? <AnatShot3 t={u} k={k} /> : s === 'turn' ? <TurnShot3 t={u} k={k} /> : <AttachShot3 t={u} k={k} />;
  }
  const s = shot4At(t);
  return s === 'reveal' ? <RevealShot4 t={t} k={k} /> : s === 'xray' ? <XrayShot4 t={t} k={k} /> : s === 'anat' ? <AnatShot4 t={t} k={k} /> : s === 'rehabA' ? <RehabA4 t={t} k={k} /> : <TurnShot4 t={t} k={k} />;
}, CAP_Y_MIDDLE));

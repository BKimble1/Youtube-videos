import React from 'react';
import {registerRoot} from 'remotion';
import {makeSheetRoot} from '../v4/testsheet';
import {KickShot4, RevealShot4, FieldShot4, LowShot4, CAP_Y_PITCH} from '../v4/pitch4';
import {shot4At} from '../v4/story4';

registerRoot(makeSheetRoot((t, k) => {
  const s = shot4At(t);
  if (s === 'kick') return <KickShot4 t={t} k={k} />;
  if (s === 'reveal') return <RevealShot4 t={t} k={k} />;
  if (s === 'low') return <LowShot4 t={t} k={k} />;
  return <FieldShot4 t={t} k={k} />;
}, CAP_Y_PITCH));

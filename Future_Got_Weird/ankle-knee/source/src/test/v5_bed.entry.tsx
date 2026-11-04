import React from 'react';
import {registerRoot} from 'remotion';
import {makeSheetRoot} from '../v4/testsheet';
import {WakeShot5, ToesShot5, NoticeShot5, SockShot5, CAP_Y_BED5} from '../v5/bed5';
import {shot5At} from '../v5/story5';

registerRoot(makeSheetRoot((t, k) => {
  const s = shot5At(t);
  if (s === 'wake') return <WakeShot5 t={t} k={k} />;
  if (s === 'toes' || s === 'toes2') return <ToesShot5 t={t} k={k} />;
  if (s === 'notice') return <NoticeShot5 t={t} k={k} />;
  return <SockShot5 t={t} k={k} />;
}, CAP_Y_BED5));

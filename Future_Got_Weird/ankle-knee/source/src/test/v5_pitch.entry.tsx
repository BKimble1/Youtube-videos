import React from 'react';
import {registerRoot} from 'remotion';
import {makeSheetRoot} from '../v4/testsheet';
import {KickShot5, RevealShot5, StanceShot5, AnkleShotE, ContactShotE, FlightShotE, CAP_Y_PITCH5} from '../v5/pitch5';
import {shot5At} from '../v5/story5';

registerRoot(makeSheetRoot((t, k) => {
  const s = shot5At(t);
  if (s === 'kick') return <KickShot5 t={t} k={k} />;
  if (s === 'reveal') return <RevealShot5 t={t} k={k} />;
  if (s === 'stance') return <StanceShot5 t={t} k={k} />;
  if (s === 'ankleE') return <AnkleShotE t={t} k={k} />;
  if (s === 'contactE') return <ContactShotE t={t} k={k} />;
  if (s === 'flight') return <FlightShotE t={t} k={k} />;
  return <div style={{background: '#333', width: 1080, height: 1920}} />;
}, CAP_Y_PITCH5));

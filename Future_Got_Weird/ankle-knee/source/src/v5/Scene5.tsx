// V5: one frame. V4's middle, rehab and cut list through the socket match; the V5 soccer body and kick (pitch5), the
// V5 recovery (bed5) and the new closing payoff.
import React from 'react';
import {resetIds} from '../core/ids';
import {Captions4} from '../v4/Captions4';
import {shot5At} from './story5';
import {KickShot5, RevealShot5, StanceShot5, AnkleShotE, ContactShotE, FlightShotE, CAP_Y_PITCH5} from './pitch5';
import {XrayShot4, AnatShot4, TurnShot4, CAP_Y_MIDDLE} from '../v4/middle4';
import {RehabA4, RehabB4, RehabC4, CAP_Y_REHAB} from '../v4/rehab4';
import {WakeShot5, ToesShot5, NoticeShot5, SockShot5, CAP_Y_BED5} from './bed5';

export const CAP_Y5 = {...CAP_Y_PITCH5, ...CAP_Y_MIDDLE, ...CAP_Y_REHAB, ...CAP_Y_BED5, 13: 240};
export const Scene5: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  const k = fkey;
  let body: React.ReactNode;
  switch (shot5At(t)) {
    case 'kick': body = <KickShot5 t={t} k={k} />; break;
    case 'reveal': body = <RevealShot5 t={t} k={k} />; break;
    case 'xray': body = <XrayShot4 t={t} k={k} />; break;
    case 'anat': body = <AnatShot4 t={t} k={k} />; break;
    case 'turn': body = <TurnShot4 t={t} k={k} />; break;
    case 'rehabA': body = <RehabA4 t={t} k={k} />; break;
    case 'rehabB': body = <RehabB4 t={t} k={k} />; break;
    case 'rehabC': body = <RehabC4 t={t} k={k} />; break;
    case 'wake': body = <WakeShot5 t={t} k={k} />; break;
    case 'toes': case 'toes2': body = <ToesShot5 t={t} k={k} />; break;
    case 'notice': body = <NoticeShot5 t={t} k={k} />; break;
    case 'sock': body = <SockShot5 t={t} k={k} />; break;
    case 'stance': body = <StanceShot5 t={t} k={k} />; break;
    case 'ankleE': body = <AnkleShotE t={t} k={k} />; break;
    case 'contactE': body = <ContactShotE t={t} k={k} />; break;
    default: body = <FlightShotE t={t} k={k} />;
  }
  return <>{body}{captions && <Captions4 t={t} ys={CAP_Y5} />}</>;
};

// V4: one frame. The shot for time t (story4.ts cut list) and the captions on top, at each shot's chosen height.
import React from 'react';
import {resetIds} from '../core/ids';
import {Captions4} from './Captions4';
import {shot4At} from './story4';
import {KickShot4, RevealShot4, FieldShot4, LowShot4, CAP_Y_PITCH} from './pitch4';
import {XrayShot4, AnatShot4, TurnShot4, CAP_Y_MIDDLE} from './middle4';
import {RehabA4, RehabB4, RehabC4, CAP_Y_REHAB} from './rehab4';
import {WakeShot4, ToesShot4, NoticeShot4, SockShot4, CAP_Y_BED} from './bed4';

export const CAP_Y4 = {...CAP_Y_PITCH, ...CAP_Y_MIDDLE, ...CAP_Y_REHAB, ...CAP_Y_BED};
export const Scene4: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  const k = fkey;
  let body: React.ReactNode;
  switch (shot4At(t)) {
    case 'kick': body = <KickShot4 t={t} k={k} />; break;
    case 'reveal': body = <RevealShot4 t={t} k={k} />; break;
    case 'xray': body = <XrayShot4 t={t} k={k} />; break;
    case 'anat': body = <AnatShot4 t={t} k={k} />; break;
    case 'turn': body = <TurnShot4 t={t} k={k} />; break;
    case 'rehabA': body = <RehabA4 t={t} k={k} />; break;
    case 'rehabB': body = <RehabB4 t={t} k={k} />; break;
    case 'rehabC': body = <RehabC4 t={t} k={k} />; break;
    case 'wake': body = <WakeShot4 t={t} k={k} />; break;
    case 'toes': body = <ToesShot4 t={t} k={k} />; break;
    case 'notice': body = <NoticeShot4 t={t} k={k} />; break;
    case 'toes2': body = <ToesShot4 t={t} k={k} />; break;
    case 'sock': body = <SockShot4 t={t} k={k} />; break;
    case 'field': body = <FieldShot4 t={t} k={k} />; break;
    default: body = <LowShot4 t={t} k={k} />;
  }
  return <>{body}{captions && <Captions4 t={t} ys={CAP_Y4} />}</>;
};

import React from 'react'; import {registerRoot} from 'remotion'; import {makeSheetRoot} from '../v4/testsheet';
import {WakeShot4, ToesShot4, NoticeShot4, SockShot4, CAP_Y_BED} from '../v4/bed4';
import {shot4At} from '../v4/story4';
registerRoot(makeSheetRoot((t, k) => { const s = shot4At(t); return s === 'wake' ? <WakeShot4 t={t} k={k} /> : s === 'toes' ? <ToesShot4 t={t} k={k} /> : s === 'notice' ? <NoticeShot4 t={t} k={k} /> : <SockShot4 t={t} k={k} />; }, CAP_Y_BED));

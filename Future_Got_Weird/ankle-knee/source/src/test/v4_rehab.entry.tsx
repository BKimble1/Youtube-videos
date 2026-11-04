import React from 'react'; import {registerRoot} from 'remotion'; import {makeSheetRoot} from '../v4/testsheet';
import {RehabA4, RehabB4, RehabC4, CAP_Y_REHAB} from '../v4/rehab4';
import {shot4At} from '../v4/story4';
registerRoot(makeSheetRoot((t, k) => { const s = shot4At(t); return s === 'rehabA' ? <RehabA4 t={t} k={k} /> : s === 'rehabB' ? <RehabB4 t={t} k={k} /> : <RehabC4 t={t} k={k} />; }, CAP_Y_REHAB));

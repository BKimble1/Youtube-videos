// C3 (372-401, "letting the operator"): through the observer's lens. The observer's own walk from C2 carries the lens
// into the camera on C3's first frame (the glass, already showing the picture, opens past the frame edges), then the
// feed alone: a ground-level POV from the camera module, down the foam-block lane on the tray, the medic walking ahead
// with its loaded launch tube; the lane bends right and the view turns with it (the observer steers after the medic),
// the open arena with the clear target coming into view beyond. The feed itself is Feed.tsx (C3Feed; C4 shows it on
// the operator's monitor).
import React from 'react';
import {clamp} from '../../../lib/ease';
import {ShotProps} from '../index2';
import {C2Scene, c2Lens} from './C2';
import {C3Feed} from './Feed';

export const C3_FROM = 372, C3_TO = 402;
/** the first frame on which the lens glass covers the whole frame (the feed alone from here on) */
export const C3_THROUGH = (() => {
  for (let f = C3_FROM; f < C3_FROM + 30; f++) {
    const L = c2Lens(f);
    const g = 0.72;
    const ok = [[0, 0], [1080, 0], [0, 1920], [1080, 1920]].every(([x, y]) => ((x - L.x) / (L.rx * g)) ** 2 + ((y - L.y) / (L.ry * g)) ** 2 < 1);
    if (ok) return f;
  }
  return C3_FROM + 2;
})();

export const C3: React.FC<ShotProps> = ({f}) => {
  if (f >= C3_THROUGH) return <C3Feed f={f} w={1080} h={1920} id={`c3-${f}`} />;
  const feed = 0.5 + 0.5 * clamp((f - C3_FROM + 1) / (C3_THROUGH - C3_FROM + 1));
  return <C2Scene f={f} id={`c3x-${f}`} feed={feed} feedFrame={f} />;
};

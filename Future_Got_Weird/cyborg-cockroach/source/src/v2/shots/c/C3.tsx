// C3 (372-429, "letting the operator watch as the first"): through the observer's lens. The push from C2 carries on
// into the lens for the first frames (the glass fills with the picture and opens past the frame edges), then the feed
// alone: a ground-level POV down the foam-block lane on the tray, the medic walking ahead with its loaded launch tube;
// the lane bends right and the view turns with it (the observer steers after the medic), the pink silicone target
// coming into view at the end of the lane. The feed itself is Feed.tsx (C3Feed, reused by group A for C4).
import React from 'react';
import {clamp} from '../../../lib/ease';
import {ShotProps} from '../index2';
import {C2Scene, c2Lens} from './C2';
import {C3Feed} from './Feed';

export const C3_FROM = 372;
/** frames of the fly-through: the lens glass covers the whole frame from here on */
export const C3_THROUGH = (() => {
  for (let f = C3_FROM; f < C3_FROM + 30; f++) {
    const L = c2Lens(f);
    const g = 0.72;
    // the glass ellipse contains the four frame corners
    const ok = [[0, 0], [1080, 0], [0, 1920], [1080, 1920]].every(([x, y]) => ((x - L.x) / (L.rx * g)) ** 2 + ((y - L.y) / (L.ry * g)) ** 2 < 1);
    if (ok) return f;
  }
  return C3_FROM + 10;
})();

export const C3: React.FC<ShotProps> = ({f}) => {
  if (f >= C3_THROUGH) return <C3Feed f={f} w={1080} h={1920} id={`c3-${f}`} />;
  const feed = 0.5 + 0.5 * clamp((f - C3_FROM + 1) / (C3_THROUGH - C3_FROM));
  return <C2Scene f={f} id={`c3x-${f}`} feed={feed} feedFrame={f} />;
};

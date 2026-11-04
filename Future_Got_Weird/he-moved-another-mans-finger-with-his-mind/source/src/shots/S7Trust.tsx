// S7. Trust, and the ending. The BrainNet building continues from S6 (one timeline, s6timeline.ts). A new trial. On
// "trust issues" the camera settles on the flip route (Sender B, the computer, the Receiver) and the Receiver's head
// gives a small tilt. "On ten of the sixteen trials": a 16-cell strip over the computer marks ten trials in coral;
// Sender B watches YES, the coral YES chip enters the computer, turns over inside its window and comes out NO, and
// goes to the coil (no flash). Sender A's teal YES passes straight through: pulse, flash. "Over time ... whose signal
// to trust": a balance tips toward teal in three steps; the Receiver watches YES, the block turns. Push into Sender
// A's screen: the block drops into the gap and the line clears. Pull back to a tally, 13 of 16 lines cleared, tagged
// as an average of five teams. Cut on "Go back to that finger" to the film's first composition (see s7ending.tsx).
import React from 'react';
import {FPS} from '../lib/core';
import {Cam} from '../art/kit';
import {BNWorld, TallyCard} from '../art/s6world';
import {K} from '../art/kit';
import {clamp} from '../dc/math';
import {bnCues, bnState, CUT_BACK, S7_START} from './s6timeline';
import {Ending, endingCues} from './s7ending';

export const S7: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  if (t >= CUT_BACK()) return <Ending f={f} />;
  const st = bnState(t);
  return (
    <g>
      <Cam x={st.cam.x} y={st.cam.y} z={st.cam.z}>
        <BNWorld st={st} t={t} f={f} />
      </Cam>
      {/* the result card sits still in the frame while the camera pulls back behind it */}
      {st.tally.k > 0 && <rect x={0} y={0} width={1920} height={1080} fill={K.paper} opacity={0.55 * clamp(st.tally.k)} />}
      <TallyCard k={st.tally.k} n={st.tally.n} sub={st.tally.sub} />
    </g>
  );
};

export const CUES_S7 = (): {t: number; kind: string; gain?: number}[] => {
  const a = S7_START(), cut = CUT_BACK();
  return [...bnCues().filter((c) => c.t >= a && c.t < cut), ...endingCues()].sort((x, y) => x.t - y.t);
};

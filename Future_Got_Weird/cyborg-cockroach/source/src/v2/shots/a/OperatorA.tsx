// Group A: the operator at the bench (crew/operator OperatorAtBench, unchanged rig and solve) with one addition for
// acting beats: `nod` (deg, + = head down) tips the head and neck on top of the solved pose, so a small decisive nod
// can be played without moving the gaze point. Drawn exactly as OperatorAtBench draws it (body pass clipped above the
// bench's far edge, then a hands pass with the remote held between the digits).
import React from 'react';
import {Man} from '../../../crew/operator/dc/Man';
import {HERO_LAB} from '../../../crew/operator/cast';
import {operatorAtBench, OperatorAtBenchProps, Remote} from '../../../crew/operator';
import {fmt} from '../../../lib/math';

const INK_K = 0.9;
/** the far hand resting on the bench reaches this far below the bench line (OperatorAtBench: BENCH_REST + BENCH_TIPS) */
const HANDS_BELOW = -12 + 30;

export const operatorA = (p: OperatorAtBenchProps & {nod?: number}) => {
  const g = operatorAtBench(p);
  return {...g, pose: {...g.pose, neck: g.pose.neck + (p.nod ?? 0)}};
};

export const OperatorA: React.FC<OperatorAtBenchProps & {nod?: number}> = (props) => {
  const id = props.id ?? 'opa';
  const layer = props.layer ?? 'all';
  const g = operatorA(props);
  const s = g.s;
  const remote = <Remote id={`${id}-rm`} view={g.view} press={g.press} led={props.led} ink={7 * s * INK_K * 0.72 * 0.9} />;
  const clip = props.benchTopY !== undefined ? `url(#${id}-${layer}-above)` : undefined;
  const handsClip = props.benchTopY !== undefined ? `url(#${id}-${layer}-aboveH)` : undefined;
  const handsY = (props.benchTopY ?? 0) + ((props.farHand ?? 'side') === 'bench' ? HANDS_BELOW * s : 0);
  return (
    <g>
      {props.benchTopY !== undefined && (
        <defs>
          <clipPath id={`${id}-${layer}-above`}>
            <path d={`M-20000,-20000 H20000 V${fmt(props.benchTopY)} H-20000 Z`} />
          </clipPath>
          <clipPath id={`${id}-${layer}-aboveH`}>
            <path d={`M-20000,-20000 H20000 V${fmt(handsY)} H-20000 Z`} />
          </clipPath>
        </defs>
      )}
      {layer !== 'hands' && (
        <g clipPath={clip}>
          <Man id={`${id}-b`} pose={g.pose} expr={g.expr} blink={g.blink} lHand={g.lHand} rHand={g.rHand} outfit={HERO_LAB} inkK={INK_K} />
        </g>
      )}
      {layer !== 'body' && (
        <g clipPath={handsClip}>
          <Man id={`${id}-h`} pose={g.pose} expr={g.expr} blink={g.blink} lHand={g.lHand} rHand={g.rHand} outfit={HERO_LAB} inkK={INK_K} handsOnly holdL={{front: [0, 1, 2, 3, 't'], obj: remote}} />
        </g>
      )}
    </g>
  );
};

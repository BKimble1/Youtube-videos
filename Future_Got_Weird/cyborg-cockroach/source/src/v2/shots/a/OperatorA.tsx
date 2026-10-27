// Group A: the operator at the bench (crew/operator OperatorAtBench, unchanged rig and solve) with one addition for
// acting beats: `nod` (deg, + = head down) tips the head and neck on top of the solved pose, so a small decisive nod
// can be played without moving the gaze point. Drawn exactly as OperatorAtBench draws it (body pass clipped above the
// bench's far edge, then a hands pass with the remote held between the digits).
import React from 'react';
import {Man, DIM} from '../../../crew/operator/dc/Man';
import {HandPose} from '../../../crew/operator/dc/Hand';
import {HERO_LAB, H_REMOTE} from '../../../crew/operator/cast';
import {operatorAtBench, OperatorAtBenchProps, Remote, REMOTE, remotePt, RemoteView} from '../../../crew/operator';
import {aimThumb} from '../../../crew/operator/RemoteCloseUp';
import {fmt, add, mul} from '../../../lib/math';

const INK_K = 0.9;
/** the far hand resting on the bench reaches this far below the bench line (OperatorAtBench: BENCH_REST + BENCH_TIPS) */
const HANDS_BELOW = -12 + 30;

/** V3 addition: `dpad` 0..1 moves the near thumb from the fire button onto the direction pad (steering), with `dpadZ`
 *  its pad's height above the pad (mm; small = pressing). V4: `dpadPress` 0..1 sinks the pad's right arm (the one under
 *  the thumb) into its well and shades it. */
export type OperatorAProps = OperatorAtBenchProps & {nod?: number; dpad?: number; dpadZ?: number; dpadPress?: number};
/** where the thumb's pad lands on the direction pad (remote mm): on its right arm, just out from the centre */
const PAD_AT = {x: REMOTE.dpad.x + 4.5, y: REMOTE.dpad.y - 0.6};
/** the pressed right arm of the direction pad (drawn over the remote, under the thumb) */
const PadArm: React.FC<{view: RemoteView; press: number}> = ({view, press}) => {
  if (press <= 0.01) return null;
  const D = REMOTE.dpad;
  const z = D.h * (1 - 0.8 * press);
  const q = [[D.x + D.w, D.y - D.w], [D.x + D.arm, D.y - D.w], [D.x + D.arm, D.y + D.w], [D.x + D.w, D.y + D.w]].map(([x, y]) => remotePt(view, x, y, z));
  return <path d={`M${q.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill="#2E3A44" opacity={fmt(0.55 * Math.min(1, press))} />;
};
const mixHand = (a: HandPose, b: HandPose, k: number): HandPose => ({
  ...a,
  thumb: a.thumb + (b.thumb - a.thumb) * k,
  thumbCurl: a.thumbCurl + (b.thumbCurl - a.thumbCurl) * k,
  curl: a.curl.map((c, i) => c + (b.curl[i] - c) * k) as HandPose['curl'],
});
export const operatorA = (p: OperatorAProps) => {
  const g = operatorAtBench(p);
  const k = Math.max(0, Math.min(1, p.dpad ?? 0));
  let lHand = g.lHand;
  if (k > 0) {
    const j = g.joints;
    const s = g.s;
    const wrist = add(j.L.W, mul(j.L.foreDir, -6 * s));
    // a raised thumb is aimed a little further out over the pad, so it lifts straight up off it (the thumb's own
    // reach would otherwise draw the tip back toward its root)
    const z = p.dpadZ ?? 1.2;
    const pad = remotePt(g.view, PAD_AT.x - 0.4 * Math.max(0, z - 3), PAD_AT.y, 1.6 - 1.1 * Math.min(1, p.dpadPress ?? 0) + z);
    const onPad = aimThumb(wrist, j.L.handAng, DIM.hand * s, 1, {...H_REMOTE, curl: H_REMOTE.curl.map((c) => c + 0.04) as HandPose['curl']}, pad);
    lHand = mixHand(g.lHand, onPad, k);
  }
  return {...g, lHand, pose: {...g.pose, neck: g.pose.neck + (p.nod ?? 0)}};
};

export const OperatorA: React.FC<OperatorAProps> = (props) => {
  const id = props.id ?? 'opa';
  const layer = props.layer ?? 'all';
  const g = operatorA(props);
  const s = g.s;
  const remote = (
    <g>
      <Remote id={`${id}-rm`} view={g.view} press={g.press} led={props.led} ink={7 * s * INK_K * 0.72 * 0.9} />
      <PadArm view={g.view} press={props.dpadPress ?? 0} />
    </g>
  );
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

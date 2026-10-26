// The operator at the bench: the Weird Crew guesser in his lab outfit (dc/Man, HERO_LAB), standing behind a bench edge
// in 3/4 view facing screen-left, the research remote in his near (LEFT) hand at lower-chest height with his thumb on
// the fire button, the far hand at his side or resting on the bench, his head turned down-left toward a small target
// on the bench. Built the way the Real Web Fluid lab draws him (Lab6.tsx): the body in one pass (clipped above the
// bench line), the bench drawn by the shot, then a hands-only pass with the remote held between the rear and front
// digits. Every hand contact is placed from the hand's own geometry (rig.ts placeHand; the thumb is aimed at the
// button with the same solve as the close-up). A pure function of its props.
import React from 'react';
import {DIM, Man, manJoints, ManPose} from './dc/Man';
import {Expr} from './dc/Head';
import {HandPose} from './dc/Hand';
import {add, clamp, fmt, mul, perp, rad, rot, sub, V} from '../../lib/math';
import {BASE, blinkAt, breathAt, ExprArg, H_BENCH, H_REMOTE, H_SIDE, HERO_LAB, operatorExpr} from './cast';
import {placeHand} from './rig';
import {aimThumb} from './RemoteCloseUp';
import {buttonTop, capTopAt, LedArg, Remote, REMOTE, remotePt, RemoteView} from './Remote';

/** contour weight for the figure (the lab scene's inkK) */
const INK_K = 0.9;
/** the remote is 0.85 of his hand's length (as in the close-up) */
const REMOTE_PER_HAND = 0.85;
/** where the near hand holds the remote, relative to the hip, at scale 1 (screen px; + y down) */
const GRIP0: V = {x: -132, y: -214};
/** the near hand's axis (deg, screen; 180 = fingers pointing straight screen-left) */
const GRIP_ANG = 172;
/** the remote's centre in the hand's own frame (u along the hand from the wrist, v toward the thumb; hand lengths) */
const REMOTE_UV = {u: 0.6, v: 0.3};
const REMOTE_TILT = 58;
/** a resting far hand's fingertips land this far (scale 1 px) in front of the bench's back edge, on its top */
const BENCH_REST = 7;

export type OperatorAtBenchProps = {
  /** unique id prefix for SVG defs (required when several figures are on screen) */
  id?: string;
  /** hip point (the figure's anchor) in screen px; at scale 1 the head centre is ~356 px above it, the hair tips
   *  ~490 px above, the feet ~460 px below; he faces screen-left */
  x: number;
  y: number;
  /** rig scale (1 = head radius 96 px, figure ~950 px tall) */
  scale?: number;
  /** time in seconds (breathing, idle head drift, and the automatic blink when `blink` is not given) */
  t?: number;
  /** expression: 'focus' | 'neutral' | 'pleased' or an explicit Expr; with exprTo + exprMix it is a mix of two */
  expr?: ExprArg;
  exprTo?: ExprArg;
  /** 0..1 from expr to exprTo */
  exprMix?: number;
  /** 0..1 lid closure; omit for the automatic blink track (blinkAt(t)); pass 0 for none */
  blink?: number;
  /** override the breath phase (-1..1); default follows t */
  breath?: number;
  /** 0..1: the thumb presses the fire button (the cap goes down under it) */
  thumbPress?: number;
  /** status LED on the remote */
  led?: LedArg;
  /** where he looks (screen px); default: down-left on the bench, 380 px left of the hip at scale 1 */
  gazeX?: number;
  gazeY?: number;
  /** override the pupils directly (head-space, -1..1, - = screen-left / up); the neck still follows the gaze point */
  gx?: number;
  gy?: number;
  /** the bench's top edge (screen y): everything of him below it is hidden; omit to draw the whole figure */
  benchTopY?: number;
  /** 'side' (default): the far hand hangs at his side (behind the bench); 'bench': it rests on the bench top
   *  (needs benchTopY), farHandX px left of the hip at scale 1 (default 70) */
  farHand?: 'side' | 'bench';
  farHandX?: number;
  /** which pass to draw: 'body' (figure, before the bench), 'hands' (both hands and the remote, after the bench), or
   *  'all' (both, with nothing between) */
  layer?: 'all' | 'body' | 'hands';
};

const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

/** The solved figure: pose, hand poses, the remote's view, the expression with the gaze applied, and screen points
 *  a shot may need (head, eyes, button). */
export const operatorAtBench = (p: OperatorAtBenchProps) => {
  const s = p.scale ?? 1;
  const t = p.t ?? 0;
  const b = p.breath ?? breathAt(t);
  const press = clamp(p.thumbPress ?? 0);
  const gaze: V = {x: p.gazeX ?? p.x - 380 * s, y: p.gazeY ?? (p.benchTopY ?? p.y - 30 * s)};

  // body: the lab stance, breathing (chest rises, a little torso sway)
  let pose: ManPose = {...BASE, x: p.x, y: p.y, s, torso: 5 + 0.25 * b, chest: 5 + 0.6 * b, turn: 0.5, breath: 0.3 + 0.3 * b};
  // head: a share of the look down-left is taken by the neck (a nod forward), the rest by the eyes
  const j0 = manJoints(pose);
  const eye0 = add(j0.head, {x: -0.3 * DIM.headR * s, y: -0.1 * DIM.headR * s});
  const dv = sub(gaze, eye0);
  const below = (Math.atan2(dv.y, -dv.x) * 180) / Math.PI; // deg below horizontal, looking left
  const drift = 0.8 * Math.sin(t * 0.7 + 1.3);
  const neck = clamp(-2 + 0.2 * below, -5, 9) + drift;
  pose = {...pose, neck};

  // near hand: on the remote at lower-chest height (moves a little with the breath)
  const L = DIM.hand * s;
  const grip = add({x: p.x, y: p.y}, mul({x: GRIP0.x, y: GRIP0.y - 1.5 * b}, s));
  // the grip point is the hand-frame point (0.42, 0.06): between the palm and the curled fingers
  // the elbow hangs below the shoulder (lElb -1), the forearm comes forward to the hand
  pose = placeHand({...pose, lElb: -1}, 'L', grip, GRIP_ANG, 0.42, 0.06);

  // far hand
  const far = p.farHand ?? 'side';
  if (far === 'bench' && p.benchTopY !== undefined) {
    // fingertips resting on the bench top, hand angled down toward it (as the lab's resting far hand)
    const fx = p.x - (p.farHandX ?? 70) * s;
    pose = {...pose, rElb: -1};
    pose = placeHand(pose, 'R', {x: fx, y: p.benchTopY + BENCH_REST * s}, 122, 0.74, 0.0);
  } else {
    // hanging at his side: in 3/4 the far shoulder is on his front edge, so the arm hangs (in world space, plumb)
    // straight down along it, a little bent
    const rS = manJoints(pose).R.S;
    pose = {...pose, rWx: rS.x + 8 * s, rWy: rS.y + 370 * s, rW: 1, rElb: 1, rWr: 8};
  }

  // the drawn hands (as dc/Man places them)
  const j = manJoints(pose);
  const lWrist = add(j.L.W, mul(j.L.foreDir, -6 * s));
  const lAng = j.L.handAng;
  const hd = {x: Math.cos(rad(lAng)), y: Math.sin(rad(lAng))};
  const hn = perp(hd);
  const HU = (u: number, v: number): V => add(lWrist, add(mul(hd, u * L), mul(hn, v * L))); // thumbSide +1
  const k = (REMOTE_PER_HAND * L) / REMOTE.L;
  const view: RemoteView = {c: HU(REMOTE_UV.u, REMOTE_UV.v), k, rot: lAng + 180 - 4, tilt: REMOTE_TILT};
  // the thumb's pad on the cap: a little behind its centre (toward the wrist), following it down
  const capTop = capTopAt(press);
  const pad = remotePt(view, REMOTE.btn.x + 3.5, REMOTE.btn.y - 1, capTop + 1.2);
  const lHand: HandPose = aimThumb(lWrist, lAng, L, 1, {...H_REMOTE, curl: H_REMOTE.curl.map((c) => c + 0.04 * press) as HandPose['curl']}, pad);
  const rHand: HandPose = far === 'bench' && p.benchTopY !== undefined ? H_BENCH : H_SIDE;

  // expression + gaze (pupils in head space), lids a touch lower when looking down
  const e0: Expr = operatorExpr(p.expr ?? 'neutral', p.exprTo ?? p.expr ?? 'neutral', p.exprMix ?? 0);
  const roll = j.tc + neck; // world -> head space rotation
  const eye = add(j.head, rot({x: -0.3 * DIM.headR * s, y: -0.1 * DIM.headR * s}, -roll));
  const dl = rot(sub(gaze, eye), roll);
  const dn = Math.hypot(dl.x, dl.y) || 1;
  const gx = p.gx ?? clamp((dl.x / dn) * 0.95, -0.95, 0.95);
  const gy = p.gy ?? clamp((dl.y / dn) * 0.9, -0.6, 0.8);
  const expr: Expr = {...e0, gx, gy, lid: clamp(e0.lid + 0.1 * smooth(gy / 0.8))};
  const blink = p.blink ?? blinkAt(t);
  return {pose, joints: j, lHand, rHand, view, expr, blink, press, gaze, head: j.head, eye, button: buttonTop(view, press), s};
};

export const OperatorAtBench: React.FC<OperatorAtBenchProps> = (props) => {
  const id = props.id ?? 'op';
  const layer = props.layer ?? 'all';
  const g = operatorAtBench(props);
  const s = g.s;
  const remote = <Remote id={`${id}-rm`} view={g.view} press={g.press} led={props.led} ink={7 * s * INK_K * 0.72 * 0.9} />;
  const clip = props.benchTopY !== undefined ? `url(#${id}-${layer}-above)` : undefined;
  // the hands pass may reach a little onto the bench top (a resting far hand); a hanging one stays behind the edge
  const handsClip = props.benchTopY !== undefined ? `url(#${id}-${layer}-aboveH)` : undefined;
  const handsY = (props.benchTopY ?? 0) + ((props.farHand ?? 'side') === 'bench' ? (BENCH_REST + 10) * s : 0);
  const body = (
    <g clipPath={clip}>
      <Man id={`${id}-b`} pose={g.pose} expr={g.expr} blink={g.blink} lHand={g.lHand} rHand={g.rHand} outfit={HERO_LAB} inkK={INK_K} />
    </g>
  );
  const hands = (
    <g clipPath={handsClip}>
      <Man id={`${id}-h`} pose={g.pose} expr={g.expr} blink={g.blink} lHand={g.lHand} rHand={g.rHand} outfit={HERO_LAB} inkK={INK_K} handsOnly holdL={{front: [0, 1, 2, 3, 't'], obj: remote}} />
    </g>
  );
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
      {layer !== 'hands' && body}
      {layer !== 'body' && hands}
    </g>
  );
};

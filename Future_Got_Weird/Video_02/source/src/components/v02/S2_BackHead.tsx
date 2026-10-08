import React from 'react';
import {C, OUTLINE} from '../../theme';
import type {Look} from '../Character';
import {Character2, eyesWorld, mouthWorld, type Pose2, type RigPlace} from './Cast2';

/**
 * S2 · his reflection in the wall mirror, seen from BEHIND (lead override of PATH_LEGIBILITY_PLAN §4 S2.2).
 *
 * He faces the room (the camera); the mirror hangs on the relay wall behind him. A planar mirror at z = 0 shows the
 * virtual image of him at z = -H.z, and that image faces AWAY from the camera, so the camera (and the checker, and the
 * sensor) see his BACK in the glass. Reflection through z = 0 keeps every body point's x and h, so the back view is
 * drawn UNFLIPPED: the same rig pose at the same screen x as the real him (his hand on screen-left stays on
 * screen-left in the glass). Placement: rigAt(H.x, -H.z, tilt) at his own scale (the scene clips it to the glass and
 * paints it in RoomSet's backdrop, so the partition and the people paint over it).
 *
 * Built only from Cast2's exports (no Cast2 edit): `Character2` draws the body (arms that are in FRONT of his chest in
 * the front view, e.g. crossed arms, are behind his torso from behind, so they go in the body pass), then `BackHead`
 * covers the face with the back of his head, then, when his hands are on his crown (the duck), the arm pass is drawn
 * over the back hair. Art reference: art/incoming/V02_A01_guesser_turnaround.png (back view, rightmost): red hair over
 * the whole head down to a zig-zag nape, the ears, the same crown spikes; the rig stays authoritative for proportions
 * and colours. BackHead is the critic's prototype (art/CRITIC_cast-props.md, A01).
 */

/** Back-of-head overlay for the spiky guesser: ears, a skin head that hides the face, back hair down to a zig-zag
 *  nape, the rig's own crown spikes. Placed from eyesWorld / mouthWorld, so it follows tilt, lean, sink, hunch and
 *  scale (give `ch` the rig's frame/seed/life so the idle drift is included). An SVG <g> in world px. */
export const BackHead: React.FC<{look: Look; ch: RigPlace; pose: Pose2; id: string}> = ({look, ch, pose, id}) => {
  const e = eyesWorld(ch, pose);
  const m = mouthWorld(ch, pose);
  const dx = m.x - e.x;
  const dy = m.y - e.y;
  const s = Math.hypot(dx, dy) / 40; // eyes (HEAD_Y - 6) to mouth (HEAD_Y + 34) = 40 local px
  const rot = (-Math.atan2(dx, dy) * 180) / Math.PI;
  const r = 58; // HEAD_R
  const st = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const spikes = `L ${-r + 4} ${-r - 22} L -28 ${-r - 4} L -14 ${-r - 34} L 0 ${-r - 6} L 14 ${-r - 36} L 28 ${-r - 4} L ${r - 4} ${-r - 22}`;
  const nape: [number, number][] = [[54, 26], [42, 40], [30, 30], [19, 45], [8, 32], [-3, 46], [-14, 32], [-25, 44], [-36, 30], [-46, 40], [-56, 24]];
  const napeD = nape.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const hairD = `M ${-r} -12 ${spikes} L ${r} -12 L ${r + 6} 26 ${nape.map(([x, y]) => `L ${x} ${y}`).join(' ')} L ${-r - 6} 24 Z`;
  const f = (n: number) => Math.round(n * 100) / 100;
  return (
    <g transform={`translate(${f(e.x)} ${f(e.y)}) rotate(${f(rot)}) scale(${f(s * 1000) / 1000}) translate(0 6)`}>
      <defs>
        <clipPath id={`bh${id}`}>
          <ellipse cx={0} cy={0} rx={r + 1} ry={r + 5} />
          <rect x={-r - 10} y={-r - 60} width={2 * r + 20} height={r + 48} />
        </clipPath>
        <clipPath id={`lo${id}`}>
          <rect x={-r - 20} y={-14} width={2 * r + 40} height={r + 40} />
        </clipPath>
      </defs>
      <ellipse cx={-r - 2} cy={6} rx={9} ry={12} fill={look.skin} {...st} />
      <ellipse cx={r + 2} cy={6} rx={9} ry={12} fill={look.skin} {...st} />
      <ellipse cx={0} cy={0} rx={r} ry={r + 4} fill={look.skin} {...st} />
      <path d={hairD} fill={look.hairColor} clipPath={`url(#bh${id})`} />
      <g clipPath={`url(#bh${id})`}>
        <path d={napeD} fill="none" {...st} />
      </g>
      <path d={`M ${-r} -12 ${spikes} L ${r} -12`} fill="none" {...st} />
      <ellipse cx={0} cy={0} rx={r} ry={r + 4} fill="none" {...st} clipPath={`url(#lo${id})`} />
    </g>
  );
};

export type S2ReflectionProps = {
  look: Look;
  /** the REAL figure's pose this frame (the reflection is the same pose, seen from behind) */
  pose: Pose2;
  frame: number;
  seed: number;
  life: number;
  /** rigAt(H.x, -H.z, tilt): the virtual image's feet and scale (world px) */
  place: {x: number; y: number; scale: number};
  /** true while his hands are up on his crown (the duck): those arms are drawn over the back hair */
  armsOverHead: boolean;
  /** the real figure's squash [sx, sy] about the feet, mirrored in sync */
  squash: [number, number];
  /** CSS clip-path (world px) of the glass */
  clipPath: string;
  id: string;
};

/** His back view in the glass (world px, an HTML layer): body, back of the head, then hands on the crown if up. */
export const S2Reflection: React.FC<S2ReflectionProps> = ({look, pose, frame, seed, life, place, armsOverHead, squash, clipPath, id}) => {
  // the face side is hidden; the temple sweat drop would peek past the back hair, so it is not drawn from behind
  const back: Pose2 = {...pose, sweat: 0};
  const ch: RigPlace = {x: place.x, y: place.y, scale: place.scale, frame, seed, life};
  const squashed = squash[0] !== 1 || squash[1] !== 1;
  const f = (n: number) => Math.round(n * 1000) / 1000;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: squashed ? `scale(${f(squash[0])}, ${f(squash[1])})` : undefined, transformOrigin: `${f(place.x)}px ${f(place.y)}px`}}>
        <Character2 look={look} pose={back} frame={frame} seed={seed} x={place.x} y={place.y} scale={place.scale} life={life} shadow={false} front={armsOverHead ? 'both' : 'none'} pass="body" />
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <BackHead look={look} ch={ch} pose={back} id={id} />
        </svg>
        {armsOverHead && <Character2 look={look} pose={back} frame={frame} seed={seed} x={place.x} y={place.y} scale={place.scale} life={life} shadow={false} front="both" pass="frontArm" />}
      </div>
    </div>
  );
};

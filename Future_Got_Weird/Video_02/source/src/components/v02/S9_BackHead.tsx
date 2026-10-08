import React, {useId} from 'react';
import {C, OUTLINE} from '../../theme';
import type {Look} from '../Character';
import {eyesWorld, mouthWorld, type Pose2, type RigPlace} from './Cast2';

/**
 * S9 · the guesser seen from BEHIND (after the art reference A01's back view, art/incoming/V02_A01_guesser_turnaround.png,
 * rightmost; the code rig stays authoritative for proportions and colours). An additive overlay drawn right after
 * <Character2 pass="body"> (or "all" with armsFront 'none') of the same rig: the ears, a skin head that covers the face,
 * the red hair over the whole head down to a zig-zag nape, and the rig's own four crown spikes. Character2 itself is not
 * changed. The rig's torso already reads from behind (A01: the same stripes and collar notch), its legs and shoes too;
 * pose the arms behind the torso (armsFront 'none') for a back view.
 *
 * Placed from Cast2's exported eyesWorld / mouthWorld, so it follows the head's tilt, peek, lean, hunch, sink, bob and
 * scale, including the rig's idle drift when `place` carries its frame / seed / life (pass the same place and pose as the
 * rig). World px: renders one 1920x1080 <svg> with overflow visible, like the room's other layers.
 *
 * After the critic's prototype BackHead (qa critic_cast_props rig/src/dev/Critic.tsx); here it is a scene-local
 * component, for the lead to promote at merge together with S2_BackHead.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Rig head geometry (Character.tsx / Cast2: HEAD_R 58, eyes at HEAD_Y - 6, mouth at HEAD_Y + 34). */
const R = 58;
const EYES_TO_MOUTH = 40;

export const BackHeadG: React.FC<{look: Look; place: RigPlace; pose: Pose2}> = ({look, place, pose}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const e = eyesWorld(place, pose);
  const m = mouthWorld(place, pose);
  const dx = m.x - e.x;
  const dy = m.y - e.y;
  const s = Math.hypot(dx, dy) / EYES_TO_MOUTH;
  const rot = (-Math.atan2(dx, dy) * 180) / Math.PI;
  const st = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  // the rig's spiky crown (Character.tsx HairShape 'spiky'), head-centre coordinates
  const spikes = `L ${-R + 4} ${-R - 22} L -28 ${-R - 4} L -14 ${-R - 34} L 0 ${-R - 6} L 14 ${-R - 36} L 28 ${-R - 4} L ${R - 4} ${-R - 22}`;
  // A01: the hair comes down the back of the head to a zig-zag nape, just above the neck
  const nape: [number, number][] = [
    [54, 26],
    [42, 40],
    [30, 30],
    [19, 45],
    [8, 32],
    [-3, 46],
    [-14, 32],
    [-25, 44],
    [-36, 30],
    [-46, 40],
    [-56, 24],
  ];
  const napeD = nape.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const hairD = `M ${-R} -12 ${spikes} L ${R} -12 L ${R + 6} 26 ${nape.map(([x, y]) => `L ${x} ${y}`).join(' ')} L ${-R - 6} 24 Z`;
  return (
    <g transform={`translate(${f2(e.x)} ${f2(e.y)}) rotate(${f2(rot)}) scale(${f2(s * 10000) / 10000}) translate(0 6)`}>
      <defs>
        <clipPath id={`bh${uid}`}>
          <ellipse cx={0} cy={0} rx={R + 1} ry={R + 5} />
          <rect x={-R - 10} y={-R - 60} width={2 * R + 20} height={R + 48} />
        </clipPath>
        <clipPath id={`bl${uid}`}>
          <rect x={-R - 20} y={-14} width={2 * R + 40} height={R + 40} />
        </clipPath>
      </defs>
      {/* ears, then the head (covers the rig's face), then the hair clipped to the head with its zig-zag nape */}
      <ellipse cx={-R - 2} cy={6} rx={9} ry={12} fill={look.skin} {...st} />
      <ellipse cx={R + 2} cy={6} rx={9} ry={12} fill={look.skin} {...st} />
      <ellipse cx={0} cy={0} rx={R} ry={R + 4} fill={look.skin} {...st} />
      <path d={hairD} fill={look.hairColor} clipPath={`url(#bh${uid})`} />
      <g clipPath={`url(#bh${uid})`}>
        <path d={napeD} fill="none" {...st} />
      </g>
      <path d={`M ${-R} -12 ${spikes} L ${R} -12`} fill="none" {...st} />
      {/* the head's outline below the hairline (the hair fill painted over the upper half of it) */}
      <ellipse cx={0} cy={0} rx={R} ry={R + 4} fill="none" {...st} clipPath={`url(#bl${uid})`} />
    </g>
  );
};

/** BackHeadG in its own world-px <svg> layer (put it right after the rig). */
export const BackHead: React.FC<{look: Look; place: RigPlace; pose: Pose2; style?: React.CSSProperties}> = ({style, ...p}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    <BackHeadG {...p} />
  </svg>
);

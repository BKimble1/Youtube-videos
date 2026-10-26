// "So the robot practiced." Back at the mirror (the setup established in the hook). Three selected trials, each a
// completed action: the commands change, the face responds in the mirror, the image is recorded as a pair
// (commands -> appearance) on a growing strip. The strip implies many more trials; it is not shown finishing.
import React from 'react';
import {Robot, ROBOT_NEUTRAL} from '../art/Robot';
import {CommandPanel, Tag, UI} from '../art/Ui';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp, smooth} from '../dc/math';
import {camPath} from '../lib/cam';
import {pr} from '../lib/core';
import {K, robotAt, TRIALS} from '../state';
import {MirrorSet} from './MirrorSet';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** one recorded pair: a mini bar chart and the face it produced */
export const Pair: React.FC<{id: string; x: number; y: number; i: number; k: number; hot?: boolean}> = ({id, x, y, i, k, hot}) => {
  if (k <= 0.001) return null;
  const tr = TRIALS[i];
  const st = {...ROBOT_NEUTRAL, ...tr.st, yaw: 0};
  return (
    <g opacity={clamp(k * 1.5)} transform={`translate(${fmt(x)} ${fmt(y)})`}>
      <rect x={0} y={0} width={250} height={120} rx={14} fill={UI.paper} stroke={INK} strokeWidth={hot ? 4 : 2.5} />
      {tr.cmd.map((v, j) => (
        <g key={j}>
          <rect x={14 + j * 12} y={18} width={8} height={84} rx={2} fill="#E3DCCB" />
          <rect x={14 + j * 12} y={fmt(102 - 84 * v)} width={8} height={fmt(84 * v)} rx={2} fill={UI.blue} />
        </g>
      ))}
      <path d="M118,60 l22,0 m-8,-8 l8,8 l-8,8" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <clipPath id={`${id}-pc`}>
          <rect x={150} y={10} width={90} height={100} rx={10} />
        </clipPath>
      </defs>
      <rect x={150} y={10} width={90} height={100} rx={10} fill="#C9D3D2" />
      <g clipPath={`url(#${id}-pc)`}>
        <Robot id={`${id}-r`} st={st} x={195} y={50} s={0.62} />
      </g>
      <rect x={150} y={10} width={90} height={100} rx={10} fill="none" stroke={INK} strokeWidth={2} />
    </g>
  );
};

export const Practice: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const cam = camPath(
    f,
    [
      [K.practiced, {x: 1010, y: 500, z: 1.06}],
      [K.skin, {x: 1060, y: 470, z: 1.16}],
    ],
    ease,
  );
  // current commands: each trial's bars move first (0.35 s before the face)
  let vals = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  TRIALS.forEach((tr) => {
    const k = smooth(clamp((t - tr.t) / 0.35));
    if (t >= tr.t) vals = vals.map((v, j) => lerp(v, tr.cmd[j], k));
  });
  // shutter on each trial when the face has settled
  const flash = TRIALS.reduce((a, tr) => Math.max(a, clamp(1 - Math.abs(t - (tr.t + 1.0)) / 0.12)), 0);
  const panelK = pr(f, K.practiced + 0.3, K.practiced + 0.7);
  return (
    <g>
      <MirrorSet id="pr" cam={cam} st={st} reflExtra={flash > 0 ? <circle cx={0} cy={0} r={120} fill="#FFFFFF" opacity={0.25 * flash} /> : null} />
      <Tag x={70} y={90} text="Illustration: practising in front of a mirror" k={pr(f, K.practiced + 0.1, K.practiced + 0.5)} size={26} />
      <CommandPanel x={70} y={150} vals={vals} k={panelK} title="Motor commands" />
      {/* the record: command -> appearance pairs, with room for many more */}
      <Tag x={1600} y={90} text="Recorded" k={pr(f, TRIALS[0].t + 0.9, TRIALS[0].t + 1.3)} size={24} tone="light" anchor="middle" />
      {TRIALS.map((tr, i) => (
        <Pair key={i} id={`pp${i}`} x={1470} y={130 + i * 140} i={i} k={pr(f, tr.t + 1.05, tr.t + 1.45)} hot={t > tr.t + 1.05 && t < tr.t + 2.3} />
      ))}
      {[0, 1, 2].map((j) => (
        <rect key={j} x={1470} y={130 + 3 * 140 + j * 34} width={250} height={22} rx={8} fill={UI.paper} opacity={0.5 * pr(f, TRIALS[2].t + 1.5, TRIALS[2].t + 2.0) * (1 - j * 0.3)} stroke={INK} strokeWidth={1} />
      ))}
      <Tag x={1600} y={130 + 3 * 140 + 130} text="… many more trials" k={pr(f, TRIALS[2].t + 1.6, TRIALS[2].t + 2.1)} size={22} tone="light" anchor="middle" />
    </g>
  );
};

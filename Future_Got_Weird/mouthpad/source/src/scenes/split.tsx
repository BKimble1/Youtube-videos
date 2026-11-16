// "Move your tongue, your character moves." Top: the game, big, with the W/A/S/D keys the tongue is sending.
// Bottom: looking up at the roof of the mouth (the same model, from below): the tongue, drawn see-through, slides
// across the gold pad; its touch point moves exactly when Zip moves. Screen-left on the pad = strafe left (A),
// toward the front teeth = forward (W), screen-right = right (D).
import React from 'react';
import {Jaw} from '../art/jaw3d';
import {GameScreen} from '../art/game';
import {gameAt} from '../gameplay';
import {T} from '../story';
import {clamp, keys, ss, eo, lerp} from '../lib';

export const SPLIT_START = T.mouth2 + 0.17;
export const SPLIT_END = T.moves + 0.3;
const INK = '#162A32';

export const SplitShot: React.FC<{t: number}> = ({t}) => {
  const g = gameAt(t);
  const inA = eo(t, SPLIT_START, SPLIT_START + 0.3);
  const u = keys(t, [[SPLIT_START, 0], [T.move + 0.1, 0], [T.tongue2 + 0.3, -0.75], [T.character - 0.15, -0.75], [T.character - 0.05, -0.2], [T.moves - 0.05, -0.2], [T.moves + 0.35, 0.7]]);
  const v = keys(t, [[T.character - 0.08, -0.35], [T.moves - 0.05, 0.75], [T.moves + 0.3, 0.3]]);
  const lift = ss(t, SPLIT_START + 0.05, SPLIT_START + 0.3);
  const sc = 1080 / 640;
  const gy = lerp(-700, 150, inA);
  const jy = lerp(2300, 1250, inA);
  const px = 11.2;
  return (
    <g>
      <defs>
        <linearGradient id="sp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2F5E" />
          <stop offset="1" stopColor="#173A52" />
        </linearGradient>
        <clipPath id="sp-jclip"><rect x={60} y={-560} width={960} height={600} rx={44} /></clipPath>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sp-bg)" />
      {/* the game */}
      <g transform={`translate(0 ${gy})`}>
        <rect x={-10} y={-14} width={1100} height={400 * sc + 28} fill="#22243A" stroke={INK} strokeWidth={6} />
        <g transform={`scale(${sc})`}><GameScreen g={g} id="sp-gm" /></g>
      </g>
      {/* roof of the mouth, from below */}
      <g transform={`translate(0 ${jy})`}>
        <rect x={60} y={-260} width={960} height={530} rx={44} fill="#4A1622" stroke={INK} strokeWidth={6} />
        <g transform={`translate(540 ${0}) scale(${px})`}>
          <Jaw view={{yaw: 0, pitch: -90, persp: 600}} px={px} id="sp-jaw" contact={lift > 0.5 ? {u, v, glow: 1, r: 3.4} : null} tongueX={lift} />
        </g>
        <rect x={60} y={-260} width={960} height={530} rx={44} fill="none" stroke={INK} strokeWidth={6} />
      </g>
      {void clamp}
    </g>
  );
};

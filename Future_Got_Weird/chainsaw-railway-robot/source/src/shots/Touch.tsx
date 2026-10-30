// "Imagine touching a tree branch with your fingertips." A human hand (the Weird Crew hand rig) reaches into the
// frame and an index fingertip touches a larch twig, which flexes. The next shot is matched: the claw's fingertips
// arrive at the same screen position from the same direction (Worksite, steel-arms camera).
import React from 'react';
import {add, clamp, easeInOut, easeOut, lerp, mul, settle, V} from '../dc/math';
import {H, keys, pr, W} from '../lib/core';
import {TT} from '../lib/timeline';
import {f, INK, Line, slab} from '../lib/draw';
import {Hand, HandPose} from '../dc/Hand';
import {Inked} from '../dc/ink';
import {Backdrop, WorldDefs} from '../art/World';
import {shade} from '../dc/color';

const tt = TT;
const POINT: HandPose = {curl: [0.0, 0.92, 0.96, 1.0], spread: 0.15, thumb: 12, thumbCurl: 0.75};
const SOFT: HandPose = {curl: [0.12, 0.32, 0.4, 0.46], spread: 0.4, thumb: 24, thumbCurl: 0.4};

export const Touch: React.FC<{t: number}> = ({t}) => {
  const reach = keys(t, [[tt.imagine - 0.3, 0], [tt.fingertips - 0.1, 1, easeOut]]);
  const contact = clamp((t - (tt.fingertips - 0.1)) / 0.6);
  const flex = contact > 0 ? 9 * settle(contact, 3.5, 9) : 0;
  // twig: from the right edge, needles toward its tip (left)
  const T0: V = {x: 2050, y: 380};
  const tip: V = {x: 980, y: 560 + flex};
  const ctrl: V = {x: 1450, y: 420 + flex * 0.5};
  const L = 480;
  const dirT = {x: Math.cos((-38 * Math.PI) / 180), y: Math.sin((-38 * Math.PI) / 180)};
  const C: V = {x: 1000, y: 572};
  const wrist: V = {x: lerp(C.x - 0.93 * L * dirT.x - 520, C.x - 0.93 * L * dirT.x, reach), y: lerp(C.y - 0.93 * L * dirT.y + 400, C.y - 0.93 * L * dirT.y, reach)};
  const ang = -38;
  const pose: HandPose = {
    curl: POINT.curl.map((c, i) => lerp(SOFT.curl[i], c, pr(t, tt.imagine, tt.imagine + 0.6))) as HandPose['curl'],
    spread: POINT.spread,
    thumb: POINT.thumb,
    thumbCurl: POINT.thumbCurl,
  };
  const camZ = keys(t, [[tt.imagine - 0.3, 3.0], [tt.except, 3.4]]);
  const tufts = [];
  for (let i = 0; i < 9; i++) {
    const u = 0.15 + i * 0.1;
    const p = {x: (1 - u) * (1 - u) * T0.x + 2 * (1 - u) * u * ctrl.x + u * u * tip.x, y: (1 - u) * (1 - u) * T0.y + 2 * (1 - u) * u * ctrl.y + u * u * tip.y};
    for (let j = 0; j < 14; j++) {
      const a = ((j / 14) * 2 - 1) * 1.2 + (i % 2 ? 0.4 : -0.4) - Math.PI / 2;
      const L = 46 + (j % 3) * 10;
      tufts.push(<Line key={`${i}-${j}`} a={p} b={add(p, {x: Math.cos(a) * L, y: Math.sin(a) * L * 0.8})} w={4} c={j % 2 ? '#E9A93A' : '#F6CD6B'} />);
    }
  }
  return (
    <g>
      <defs>
        <WorldDefs />
      </defs>
      <Backdrop cam={{x: 700, y: -1100, z: camZ}} t={t} />
      <rect width={W} height={H} fill="#FFF3D6" opacity={0.18} />
      {/* the twig */}
      <path d={`M${f(T0.x)} ${f(T0.y)} Q ${f(ctrl.x)} ${f(ctrl.y)} ${f(tip.x)} ${f(tip.y)}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M${f(T0.x)} ${f(T0.y)} Q ${f(ctrl.x)} ${f(ctrl.y)} ${f(tip.x)} ${f(tip.y)}`} fill="none" stroke="#7A5B45" strokeWidth={15} strokeLinecap="round" />
      <g>{tufts}</g>
      {/* sleeve and hand */}
      <Inked w={9}>
        <path d={slab(add(wrist, {x: -620, y: 480}), add(wrist, {x: -30, y: 25}), 96, 82)} fill="#7FA7C9" />
      </Inked>
      <Inked w={8}>
        <Hand id="touch" wrist={wrist} ang={ang} L={L} thumbSide={-1} view="back" pose={pose} color="#F2C9A8" />
      </Inked>
      {contact > 0 && contact < 1 && <circle cx={f(tip.x + 40)} cy={f(tip.y + 10)} r={f(30 + 70 * contact)} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={(1 - contact) * 0.7} />}
    </g>
  );
};

export {easeInOut, mul, shade};

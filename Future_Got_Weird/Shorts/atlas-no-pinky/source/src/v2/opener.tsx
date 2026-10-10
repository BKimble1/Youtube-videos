import React from 'react';
import {C, E, F, Plate, Headline, Burst, clamp01, kf, lerp, tw} from '../film/common';
import {Hand, HandPose, ikDigit, defOf, toLocal, toWorld, digitPts, GHOST_SIDE, Place} from '../hand/Hand';
import {sp, SNAP, SOFT, drift} from '../lib/motion';
import {V2} from '../cues_v2';
import {BgMacro} from './stage';

const sd = (n: 'thumb' | 'index' | 'middle' | 'ring') => defOf('robot', 'side', n)!;

export const Gear: React.FC<{x: number; y: number; r: number; rot: number}> = ({x, y, r, rot}) => {
  const teeth = 10;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({length: teeth}).map((_, i) => (
        <rect key={i} x={-r * 0.16} y={-r * 1.12} width={r * 0.32} height={r * 0.3} rx={r * 0.05} fill={i === 0 ? C.coral : C.saffron} stroke={C.ink} strokeWidth={5} transform={`rotate(${(i * 360) / teeth})`} />
      ))}
      <circle r={r} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
      <circle r={r * 0.78} fill="none" stroke={C.saffronDeep} strokeWidth={4} />
      <circle r={r * 0.3} fill={C.ink} />
      <path d={`M ${-r * 0.62} ${-r * 0.18} A ${r * 0.66} ${r * 0.66} 0 0 1 ${-r * 0.18} ${-r * 0.62}`} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.8} />
    </g>
  );
};

/** Opener hand: profile view entering from the right edge, pinching a bright gear. t < 0 plays the loop pre-roll. */
export const OP = {P: {x: 1020, y: 840, scale: 2.6} as Place, G: {x: 610, y: 800, r: 90}, post: {x: 610, y: 972}, drop: 90};

export const openerState = (t: number) => {
  const rot = 140 * E.inOut(clamp01((t + 22) / 40));
  const lower = E.in(tw(t, 7, 8)); // gear sinks onto the post by t = 15
  const release = E.out(tw(t, 16, 9));
  const fan = E.out(tw(t, 17, 16));
  const retreat = E.inOut(tw(t, 18, 24));
  const gy = OP.G.y + OP.drop * lower;
  const P: Place = {x: OP.P.x + 70 * retreat, y: OP.P.y + OP.drop * lower - 30 * retreat, scale: OP.P.scale, flip: true};
  const slide = 16 * Math.sin((rot * Math.PI) / 180);
  const pad = 22 * P.scale * 0.92;
  const gap = 70 * release;
  const idxT = {x: OP.G.x + slide, y: gy - OP.G.r - pad - gap};
  const thT = {x: OP.G.x - slide, y: gy + OP.G.r + pad + gap};
  const L = (v: {x: number; y: number}) => toLocal(v.x, v.y, P.x, P.y, P.scale, 0, true);
  const index = ikDigit(sd('index'), L(idxT), 0, -1);
  const thumb = ikDigit(sd('thumb'), L(thT), 0, 1);
  const f = (a: number, b: number, c: number): [number, number, number] => [index.ang[0] + a * (0.35 + 0.65 * fan), index.ang[1] + b * (0.35 + 0.65 * fan), index.ang[2] + c * (0.3 + 0.7 * fan)];
  const pose: HandPose = {index, thumb, middle: {ang: f(-12, -14, -10)}, ring: {ang: f(-26, -30, -22)}};
  const rg = pose.ring!.ang;
  const ghostAng: [number, number, number] = [rg[0] - 22, rg[1] - 26, rg[2] - 20];
  return {P, pose, gy, rot, fan, release, lower, ghostAng};
};

const HLN = ['thumb', 'index', 'middle', 'ring'] as const;

export const OpenerWorld: React.FC<{t: number}> = ({t}) => {
  const s = openerState(t);
  const ghost = tw(t, V2['open.reveal'], 12);
  const pop = sp(t, V2['gap.pop'], SNAP);
  const hl = Object.fromEntries(HLN.map((n, i) => [n, kf(t, [[30 + i * 6, 0, E.out], [34 + i * 6, 1, E.out], [46 + i * 6, 0, E.inOut]])])) as Record<(typeof HLN)[number], number>;
  const post = OP.post;
  const dip = clamp01((t - 15) / 5) * clamp01(1 - (t - 15) / 10);
  return (
    <g>
      <BgMacro cx={600} cy={860} />
      {/* post the gear drops onto */}
      <g>
        <ellipse cx={post.x} cy={post.y + 60} rx={170} ry={28} fill={C.shadow} />
        <rect x={post.x - 30} y={post.y - 70} width={60} height={110} rx={10} fill={C.inkSoft} stroke={C.ink} strokeWidth={6} />
        <rect x={post.x - 120} y={post.y + 30} width={240} height={42} rx={16} fill={C.blueDeep} stroke={C.ink} strokeWidth={6} />
      </g>
      <Gear x={OP.G.x} y={s.gy + 6 * dip} r={OP.G.r} rot={s.rot} />
      <Hand view="side" x={s.P.x} y={s.P.y} scale={s.P.scale} flip pose={s.pose} ghostSide={ghost * 0.95} ghostAng={s.ghostAng} highlight={hl} armW={0} />
      {pop > 0.01 && (() => {
        const gp = digitPts(GHOST_SIDE, {ang: s.ghostAng});
        const c = toWorld({x: (gp[1].x + gp[3].x) / 2, y: (gp[1].y + gp[3].y) / 2}, s.P.x, s.P.y, s.P.scale, 0, true);
        return (
          <g transform={`translate(${c.x} ${c.y}) scale(${pop})`}>
            <circle r={128} fill="none" stroke={C.coral} strokeWidth={11} strokeDasharray="24 18" strokeLinecap="round" />
          </g>
        );
      })()}
      <Burst x={OP.G.x} y={OP.G.y + OP.drop - 20} t={(t - 15) / 9} r0={110} r1={190} n={8} color={C.ink} w={6} />
    </g>
  );
};

export const OpenerHud: React.FC<{t: number}> = ({t}) => {
  const swap = V2['label.purpose'];
  const a = sp(t + 16, 0, SNAP);
  const out = tw(t, swap - 4, 4, E.in);
  const inn = sp(t, swap, SNAP);
  return (
    <g>
      {t < swap && <Headline x={540} y={272} text="NO PINKY?" size={132} sx={a * (1 - out) + 0.001} sy={a * (1 - out) + 0.001} />}
      {t >= swap && <Plate x={540} y={272} text="ON PURPOSE." size={94} fill={C.coral} sy={Math.max(0.001, inn)} />}
    </g>
  );
};
void F; void lerp; void SOFT; void drift;

// Bilateral control, as a principle (ORIGINAL ILLUSTRATION). The documented case is JR West's related machine
// (force feedback through the operator's handles); no specific sensor, motor or gain of the JR East machine is shown.
// The cabin dissolves around the operator's hand and controller (same cab space, same camera path), and the robot's
// arm, a branch and the two-way signal loop are drawn in the freed space.
import React from 'react';
import {add, clamp, easeInOut, easeOut, lerp, mul, norm, sub, V} from '../dc/math';
import {keys, pr, pulse, zkeys, H, W} from '../lib/core';
import {TT} from '../lib/timeline';
import {circ, f, INK, IP, Line, poly, slab} from '../lib/draw';
import {Cab, controls, gripAt, GRIP_L} from './Cab';
import {Claw, ik2, MachineDefs} from '../art/Machine';
import {WorldDefs} from '../art/World';
import {Cam} from '../art/World';

const tt = TT;
const BLUE = '#2FA8E8';
const ORANGE = '#F07A22';

/** camera in cab space */
export const bilatCam = (t: number): Cam => ({
  x: keys(t, [[tt.another, 1000], [tt.another + 2.4, 1080], [tt.company + 0.3, 1080], [tt.bilateral + 0.6, 700], [tt.resistance, 710], [tt.pushingEnd + 0.6, 720]]),
  y: keys(t, [[tt.another, 560], [tt.another + 2.4, 690], [tt.company + 0.3, 690], [tt.bilateral + 0.6, 540], [tt.resistance, 545]]),
  z: zkeys(t, [[tt.another, 1.2, easeOut], [tt.another + 2.4, 1.9], [tt.company + 0.3, 1.9], [tt.bilateral + 0.6, 0.98], [tt.resistance, 1.0], [tt.pushingEnd + 0.6, 1.02]]),
});

// robot side, drawn in cab space at scale K (px per cm)
const K = 1.5;
const SH: V = {x: 0, y: 300};
const BR_A: V = {x: 180, y: 820};
const BR_B: V = {x: 820, y: 760};

export const robotArmAt = (t: number) => {
  // the claw moves down toward the branch with the input, then presses (resistance)
  const c = controls(t);
  const reachK = clamp(c.tiltL / 7);
  const press = pr(t, tt.resistance - 0.2, tt.resistance + 0.4);
  const w0: V = {x: 300, y: 470};
  const w1: V = {x: 420, y: 600};
  const w = {x: lerp(w0.x, w1.x, reachK), y: lerp(w0.y, w1.y, reachK) + press * 8 + c.felt * 4 * Math.sin(t * 9) * 0};
  const {E, W: Wr} = ik2(SH, w, 172 * K, 160 * K, -1);
  const a = lerp(28, 52, reachK);
  return {E, Wr, a, reachK, press};
};

const Pulses: React.FC<{path: V[]; t: number; t0: number; t1: number; color: string; reverse?: boolean; speed?: number}> = ({path, t, t0, t1, color, reverse, speed = 0.9}) => {
  // dots travelling along a polyline between t0 and t1
  const L: number[] = [0];
  for (let i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  const total = L[L.length - 1];
  const at = (s: number): V => {
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const u = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return {x: lerp(path[i - 1].x, path[i].x, u), y: lerp(path[i - 1].y, path[i].y, u)};
  };
  const out = [];
  for (let k = 0; k < 40; k++) {
    const born = t0 + k * 0.16;
    if (born > t1) break;
    const age = t - born;
    if (age < 0) continue;
    const u = age * speed;
    if (u > 1) continue;
    const p = at((reverse ? 1 - u : u) * total);
    const o = Math.min(1, u * 8, (1 - u) * 8);
    out.push(<circle key={k} cx={f(p.x)} cy={f(p.y)} r={11} fill={color} opacity={o} stroke="#FFFFFF" strokeWidth={3} />);
  }
  return <g>{out}</g>;
};

const Arrow: React.FC<{a: V; b: V; c: string; w: number; o?: number}> = ({a, b, c, w, o = 1}) => {
  const d = norm(sub(b, a));
  const n = {x: -d.y, y: d.x};
  const hl = w * 2.6;
  const base = sub(b, mul(d, hl));
  return (
    <g opacity={o}>
      <Line a={a} b={base} w={w} c={c} cap="round" />
      <path d={poly([b, add(base, mul(n, w * 1.6)), add(base, mul(n, -w * 1.6))])} fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
};

export const Bilateral: React.FC<{t: number}> = ({t}) => {
  const cam = bilatCam(t);
  const dis = pr(t, tt.company, tt.company + 1.1);
  const c = controls(t);
  const ra = robotArmAt(t);
  const tr = `translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(5)}) translate(${f(-cam.x)} ${f(-cam.y)})`;
  const grip = gripAt(GRIP_L, c.tiltL);
  const base = add(GRIP_L, {x: 0, y: 150});
  const clawF = {o: ra.Wr, a: ra.a};
  const gripPt = add(ra.Wr, mul({x: Math.cos((ra.a * Math.PI) / 180), y: Math.sin((ra.a * Math.PI) / 180)}, 62 * K));
  // branch: fixed at the right end, deflected where the claw presses
  const defl = ra.press * 26 + c.felt * 6 * (0.5 + 0.5 * Math.sin(t * 2.2));
  const brMid = {x: lerp(BR_A.x, BR_B.x, 0.25), y: lerp(BR_A.y, BR_B.y, 0.25) + defl};
  // signal loop: controller base -> along the floor -> up to the shoulder
  const loop: V[] = [add(base, {x: -30, y: 40}), {x: base.x - 30, y: 1000}, {x: SH.x - 100, y: 1000}, {x: SH.x - 100, y: SH.y}, {x: SH.x - 30, y: SH.y}];
  const loopO = pr(t, tt.bilateral - 0.2, tt.bilateral + 0.6);
  const robotO = pr(t, tt.company + 0.3, tt.company + 1.3);
  // small input arc at the grip, big motion arc at the claw
  const inArc = pulse(t, tt.tiny + 0.1, tt.tiny + 0.5, tt.resistance - 0.4, tt.resistance);
  const outArc = pulse(t, tt.larger, tt.larger + 0.5, tt.resistance - 0.4, tt.resistance);
  const fbO = pulse(t, tt.resistance + 0.2, tt.resistance + 0.6, tt.pushingEnd + 0.6, tt.pushingEnd + 1.0);
  return (
    <g>
      <defs>
        <MachineDefs />
        <WorldDefs />
        <radialGradient id="bl-bg" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor="#24425C" />
          <stop offset="1" stopColor="#13263A" />
        </radialGradient>
        <pattern id="bl-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0 L0 0 0 60" fill="none" stroke="#3E6688" strokeWidth="1.2" opacity="0.5" />
        </pattern>
      </defs>
      <Cab t={t} cam={cam} env={1 - dis} feeds={dis < 0.99} />
      <g opacity={dis}>
        <rect width={W} height={H} fill="url(#bl-bg)" />
        <g transform={tr}>
          <rect x={-1400} y={-600} width={4200} height={2400} fill="url(#bl-grid)" />
        </g>
      </g>
      <g transform={tr}>
        {/* operator side (redrawn over the blueprint so it stays put as the cabin dissolves) */}
        {dis > 0 && (
          <g opacity={dis}>
            <Cab t={t} cam={{x: W / 2, y: H / 2, z: 1}} env={0} feeds={false} desk={1} deskX0={900} />
          </g>
        )}
        {/* signal loop */}
        <g opacity={loopO}>
          <path d={'M' + loop.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')} fill="none" stroke="#9FD9F7" strokeWidth={10} strokeLinejoin="round" opacity={0.35} />
          <Pulses path={loop} t={t} t0={tt.tiny} t1={tt.resistance - 0.3} color={BLUE} reverse />
          <Pulses path={loop} t={t} t0={tt.resistance + 0.1} t1={tt.pushingEnd + 0.3} color={ORANGE} />
        </g>
        {/* robot side */}
        <g opacity={robotO}>
          {/* the branch */}
          <path d={`M${f(BR_A.x - 60)} ${f(BR_A.y + 6)} Q ${f(brMid.x)} ${f(brMid.y)} ${f(BR_B.x)} ${f(BR_B.y)}`} fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" />
          <path d={`M${f(BR_A.x - 60)} ${f(BR_A.y + 6)} Q ${f(brMid.x)} ${f(brMid.y)} ${f(BR_B.x)} ${f(BR_B.y)}`} fill="none" stroke="#7A5B45" strokeWidth={38} strokeLinecap="round" />
          <ellipse cx={BR_B.x} cy={BR_B.y} rx={8} ry={19} fill="url(#w-wood)" stroke={INK} strokeWidth={3} />
          {/* torso edge and arm */}
          <g transform={`translate(0 0)`}>
            <path d={poly([{x: -600, y: 180}, {x: -10, y: 200}, {x: 70, y: 300}, {x: 40, y: 640}, {x: -600, y: 680}])} fill="url(#m-body)" stroke={INK} strokeWidth={5} />
            <path d={poly([{x: -600, y: 300}, {x: -60, y: 300}, {x: -40, y: 560}, {x: -600, y: 580}])} fill="url(#m-panel)" stroke={INK} strokeWidth={3} />
            <path d={poly([{x: -600, y: 610}, {x: 44, y: 600}, {x: 42, y: 628}, {x: -600, y: 640}])} fill="url(#m-accent)" />
            <IP d={slab(SH, ra.E, 22 * K, 19 * K)} fill="url(#m-body)" ink={5} />
            <IP d={slab(ra.E, ra.Wr, 18 * K, 15 * K)} fill="url(#m-body)" ink={5} />
            <path d={circ(ra.E, 21 * K)} fill="url(#m-joint)" stroke={INK} strokeWidth={5} />
            <path d={circ(SH, 27 * K)} fill="url(#m-joint)" stroke={INK} strokeWidth={5} />
            {/* shoulder actuator: drawn only as a generic housing (no specific part claimed) */}
            <path d={circ(SH, 14 * K)} fill="#46CFFF" opacity={0.25 + 0.5 * outArc} />
            <g transform={`translate(${f(ra.Wr.x)} ${f(ra.Wr.y)}) scale(${K}) translate(${f(-ra.Wr.x)} ${f(-ra.Wr.y)})`}>
              <Claw F={clawF} open={lerp(0.7, 0.45, ra.press)} />
            </g>
          </g>
          {/* arcs: small input at the grip, large motion at the claw */}
          <path d={`M${f(base.x)} ${f(base.y - 150)} A 150 150 0 0 0 ${f(base.x - 150 * Math.sin((7 * Math.PI) / 180))} ${f(base.y - 150 * Math.cos((7 * Math.PI) / 180))}`} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" opacity={inArc} />
          <path d={`M ${f(SH.x + 330)} ${f(SH.y + 40)} A 400 400 0 0 1 ${f(SH.x + 300)} ${f(SH.y + 300)}`} fill="none" stroke={BLUE} strokeWidth={14} strokeLinecap="round" opacity={outArc} />
          {/* forces: small push at the hand, large force at the claw; then the reaction and the push back */}
          <Arrow a={add(grip, {x: 70, y: -10})} b={add(grip, {x: 20, y: -10})} c={BLUE} w={7} o={inArc} />
          <Arrow a={add(gripPt, {x: -150, y: -140})} b={add(gripPt, {x: -30, y: -25})} c={BLUE} w={18} o={outArc} />
          <Arrow a={add(gripPt, {x: 20, y: 60})} b={add(gripPt, {x: -60, y: -40})} c={ORANGE} w={16} o={fbO} />
          <Arrow a={add(grip, {x: -90, y: -6})} b={add(grip, {x: -18, y: -6})} c={ORANGE} w={9} o={fbO} />
        </g>
        {/* labels */}
        <g opacity={loopO}>
          <text x={560} y={110} fill="#FFFFFF" style={{font: '900 66px "Nunito Variable"'}}>Bilateral control</text>
          <text x={562} y={158} fill="#BFE3F7" style={{font: '700 30px "Nunito Variable"'}}>Movement goes out to the robot. Resistance comes back to the hand.</text>
        </g>
        <g opacity={pr(t, tt.tiny, tt.tiny + 0.4)}>
          <text x={base.x - 40} y={base.y + 120} fill={BLUE} textAnchor="end" style={{font: '800 30px "Nunito Variable"'}}>tiny input</text>
          <text x={SH.x + 420} y={SH.y + 120} fill={BLUE} style={{font: '800 30px "Nunito Variable"'}} opacity={pr(t, tt.larger, tt.larger + 0.4)}>much larger force</text>
        </g>
        <g opacity={fbO}>
          <text x={gripPt.x + 60} y={gripPt.y + 120} fill={ORANGE} style={{font: '800 30px "Nunito Variable"'}}>resistance</text>
          <text x={base.x - 40} y={base.y + 160} fill={ORANGE} textAnchor="end" style={{font: '800 30px "Nunito Variable"'}}>felt in the hand</text>
        </g>
      </g>
      {/* provenance of the explanation */}
      <g opacity={loopO}>
        <rect x={40} y={H - 76} width={1020} height={44} rx={22} fill="#0B1824" opacity={0.75} />
        <text x={62} y={H - 46} fill="#CFE6F5" style={{font: '700 22px "Nunito Variable"'}}>Principle as documented for JR West's related machine (2024) · original illustration, not its actual parts</text>
      </g>
    </g>
  );
};

export {easeInOut};

// Bilateral control, as a principle (ORIGINAL ILLUSTRATION). The documented case is JR West's related machine
// (force feedback through the operator's handles); no specific sensor, motor or gain of the JR East machine is shown.
// V2: one physical loop instead of a diagram. In the cabin, the route from the controller to the window is revealed
// in place; a small push sends a blue command along it and out of the window (the film then rides it up the boom in
// the worksite, shots/Worksite.tsx); the orange feedback comes back in through the window, down the route, into the
// handle, which pushes back against the hand; the operator eases off and, on the monitors, the claw eases with it.
import React from 'react';
import {add, clamp, easeInOut, easeOut, lerp, V} from '../dc/math';
import {H, keys, pr, pulse, W, zkeys} from '../lib/core';
import {BT, TT} from '../lib/timeline';
import {circ, f, INK} from '../lib/draw';
import {Cab, controls, gripAt, GRIP_L} from './Cab';
import {Cam} from '../art/World';
import {pathAt} from './Worksite';

const tt = TT;
const BLUE = '#2FA8E8';
const ORANGE = '#F07A22';

/** the route (cab space): controller base -> under the console -> up the wall -> along the window sill -> out */
const ROUTE: V[] = [
  {x: GRIP_L.x, y: 832},
  {x: 1034, y: 832},
  {x: 1034, y: 470},
  {x: 1000, y: 452},
  {x: 640, y: 452},
  {x: 560, y: 330},
];
const outU = (t: number) => pr(t, BT.bilOut, BT.bilWin - 0.1, (x) => x);
const inU = (t: number) => 1 - pr(t, BT.bilCab + 0.05, BT.bilFelt, (x) => x);

export const bilatCam = (t: number): Cam => {
  if (t < BT.bilWin) {
    if (t < BT.bilOut) {
      return {
        x: keys(t, [[tt.another, 1000], [tt.another + 2.4, 1080], [tt.company + 0.2, 1080], [tt.company + 1.6, 760]]),
        y: keys(t, [[tt.another, 560], [tt.another + 2.4, 690], [tt.company + 0.2, 690], [tt.company + 1.6, 520]]),
        z: zkeys(t, [[tt.another, 1.2, easeOut], [tt.another + 2.4, 1.9], [tt.company + 0.2, 1.9], [tt.company + 1.6, 1.22], [BT.bilOut, 1.32]]),
      };
    }
    // follow the command out to the window
    const u = outU(t);
    const p = pathAt(ROUTE, u);
    const k = pr(t, BT.bilOut, BT.bilOut + 0.5);
    return {x: lerp(760, p.x, k), y: lerp(520, p.y, k), z: zkeys(t, [[BT.bilOut, 1.32], [BT.bilOut + 0.6, 1.6], [BT.bilWin - 0.35, 1.8], [BT.bilWin, 2.4, easeOut]])};
  }
  // the feedback comes back in through the window to the hand; then frame the hand with the monitors
  if (t < BT.bilFelt + 0.2) {
    const p = pathAt(ROUTE, inU(t));
    return {x: p.x, y: p.y, z: zkeys(t, [[BT.bilCab, 2.4], [BT.bilCab + 0.4, 1.8], [BT.bilFelt + 0.2, 1.7]])};
  }
  const g0 = pathAt(ROUTE, 0);
  return {
    x: keys(t, [[BT.bilFelt + 0.2, g0.x], [BT.bilEase0 + 0.2, 1040], [BT.bilEase1 + 0.3, 720]]),
    y: keys(t, [[BT.bilFelt + 0.2, g0.y], [BT.bilEase0 + 0.2, 690], [BT.bilEase1 + 0.3, 620]]),
    z: zkeys(t, [[BT.bilFelt + 0.2, 1.7], [BT.bilEase0 + 0.2, 1.75], [BT.bilEase1 + 0.3, 1.12], [tt.imagine, 1.2]]),
  };
};

const Pulse: React.FC<{p: V[]; u: number; c: string; dir: 1 | -1}> = ({p, u, c, dir}) => (
  <g>
    {[0, 1, 2, 3].map((k) => {
      const q = pathAt(p, clamp(u - dir * k * 0.03));
      return <circle key={k} cx={f(q.x)} cy={f(q.y)} r={16 - k * 3} fill={c} stroke="#FFFFFF" strokeWidth={4} opacity={1 - k * 0.22} />;
    })}
  </g>
);

export const Bilateral: React.FC<{t: number}> = ({t}) => {
  const cam = bilatCam(t);
  const tr = `translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(5)}) translate(${f(-cam.x)} ${f(-cam.y)})`;
  const route = pr(t, tt.company + 0.4, tt.company + 1.4);
  const c = controls(t);
  const grip = gripAt(GRIP_L, c.tiltL);
  const routeD = 'M' + ROUTE.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L');
  const titleO = pulse(t, tt.bilateral - 0.1, tt.bilateral + 0.3, tt.tiny - 0.2, tt.tiny + 0.3);
  return (
    <g>
      <Cab t={t} cam={cam} />
      <g transform={tr}>
        {/* the route, revealed in place (a cutaway line through the console and wall; conceptual, not a part) */}
        <g opacity={route}>
          <path d={routeD} fill="none" stroke={INK} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" opacity={0.55} />
          <path d={routeD} fill="none" stroke="#BFE8FF" strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
          <path d={routeD} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" strokeDasharray="10 12" />
        </g>
        {t >= BT.bilOut && t < BT.bilWin && <Pulse p={ROUTE} u={outU(t)} c={BLUE} dir={1} />}
        {t >= BT.bilCab && t < BT.bilFelt + 0.1 && <Pulse p={ROUTE} u={inU(t)} c={ORANGE} dir={-1} />}
        {/* the push back felt in the hand */}
        {c.felt > 0.01 && t > BT.bilFelt - 0.1 && (
          <g>
            <circle cx={f(grip.x)} cy={f(grip.y + 10)} r={f(54 + 26 * pr(t, BT.bilFelt - 0.1, BT.bilFelt + 0.5))} fill="none" stroke={ORANGE} strokeWidth={8} opacity={c.felt * (1 - 0.6 * pr(t, BT.bilFelt + 0.4, BT.bilEase1))} />
            <path d={circ({x: grip.x, y: grip.y + 10}, 40)} fill={ORANGE} opacity={0.18 * c.felt} />
          </g>
        )}
      </g>
      {/* one title, briefly, when the narration names it */}
      {titleO > 0.01 && (
        <g opacity={titleO}>
          <text x={W / 2} y={H - 120} textAnchor="middle" fill="#FFFFFF" stroke="#13263A" strokeWidth={10} paintOrder="stroke" style={{font: '900 64px "Nunito Variable"'}}>Bilateral control</text>
        </g>
      )}
    </g>
  );
};

export {easeInOut, add};

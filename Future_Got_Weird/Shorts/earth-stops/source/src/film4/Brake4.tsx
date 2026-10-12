import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {GlobeP, Globe3, GlobeBack, SpaceBG, RING_H} from './Globe4';
import {T} from './timeline4';

/**
 * The fictional brake (an impossible visual metaphor, not technology): a saffron caliper with two huge coral pads that close on a smooth belt round Earth's equator.
 * V4: the pads are twice as big (280 x 104 px against a 780 px planet), the belt is a plain band (no slots or ticks), and the lock has a short mechanical reaction:
 * the pads dig 6 px into the belt and relax, the bracket shudders, and a handful of sparks leave the two contact lines. The sphere is never squeezed or deformed; no shock ring.
 *
 * Loop contract: `t` is the frame relative to the film's frame 0 (the tail of the film calls it with f - N). t = 0 is frame 0: the pads are already closing; contact is t = T.brakeContact.
 * The pads start to close at t = -APPROACH (the film's frame N - APPROACH), as the bracket slides home, so the return of the device and its approach are one movement.
 */
export const BK = {cx: 440, cy: 1090, R: 390, spin: 4, G0: 200, PT: 104, AT: 62, TH: RING_H, PL: 280};
export const OMEGA_DEG = BK.spin;
const CONTACT = T.brakeContact;
export const APPROACH = 40;

/** distance from each pad face to the belt edge (px): G0 when open, 0 at contact. Closing accelerates, so frame 0 is already well under way. */
export const padGap = (t: number) => (t >= CONTACT ? 0 : t <= -APPROACH ? BK.G0 : BK.G0 * (1 - Math.pow((t + APPROACH) / (CONTACT + APPROACH), 2.1)));
/** the planet turns at OMEGA until the pads lock on `CONTACT`, then it is still */
export const spinRot = (t: number, rot0 = 40) => rot0 + OMEGA_DEG * Math.min(t, CONTACT);
export const recoil = (t: number) => (t < CONTACT || t > CONTACT + 7 ? 0 : 6.5 * Math.exp(-(t - CONTACT) * 0.6) * Math.cos((t - CONTACT) * 1.2));
/** screen shake of the whole brake picture at the lock */
export const lockShake = (f: number) => { const t = f - CONTACT; return t < 0 || t > 9 ? {dx: 0, dy: 0} : {dx: 9 * Math.exp(-t * 0.42) * Math.sin(t * 2.4), dy: 6 * Math.exp(-t * 0.42) * Math.cos(t * 2.9)}; };

const Sparks: React.FC<{t: number; px0: number; px1: number; cy: number}> = ({t, px0, px1, cy}) => {
  const a = t - CONTACT; if (a < 0 || a > 8) return null;
  const out: React.ReactNode[] = [];
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 6; i++) {
    const r = rand(i * 7 + (side > 0 ? 3 : 11)), x0 = px0 + 40 + (px1 - px0 - 80) * rand(i + (side > 0 ? 40 : 60)), vy = side * (7 + 9 * r), vx = (rand(i + 90) - 0.7) * 14;
    const x = x0 + vx * a, y = cy + side * BK.TH + vy * a - side * 0.4 * a * a * 0, k = Math.max(0, 1 - a / 8);
    out.push(<line key={`${side}${i}`} x1={x} y1={y} x2={x - vx * 0.9} y2={y - vy * 0.9} stroke={i % 2 ? C.saffronLight : C.cream} strokeWidth={6 * k + 2} strokeLinecap="round" opacity={k} />);
  }
  return <g>{out}</g>;
};

export const Caliper: React.FC<{t: number; open?: number}> = ({t, open = 1}) => {
  const {cx, cy, R, PT, AT, TH, PL} = BK;
  const g = padGap(t), rc = recoil(t);
  const px1 = cx + 1.07 * R + 4, px0 = px1 - PL;
  const a = t - CONTACT;
  const sq = a >= 0 && a < 4 ? 6 * (1 - a / 4) : 0; // the pads dig 6 px into the belt and relax
  const d = TH + g - sq; // pad face distance from the equator
  const outer = d + PT + 10 + AT; // outer face of an arm
  const wallX = px1 + 36;
  const flash = a >= 0 && a < 3 ? 0.9 * (1 - a / 3) : 0;
  const armT = (dir: 1 | -1) => ({y: dir === 1 ? cy + d + PT + 10 : cy - d - PT - 10 - AT});
  const Pad: React.FC<{dir: 1 | -1}> = ({dir}) => {
    const y0 = dir === 1 ? cy + d : cy - d - PT;
    return (
      <g>
        <rect x={px0 - 6} y={dir === 1 ? y0 + PT : y0 - 10} width={px1 - px0 + 12} height={10} fill={C.ink} />
        <rect x={px0} y={y0} width={px1 - px0} height={PT} rx={18} fill={C.coral} stroke={C.ink} strokeWidth={7} />
        <rect x={px0 + 14} y={dir === 1 ? y0 + 12 : y0 + PT - 28} width={px1 - px0 - 28} height={14} rx={7} fill={C.coralDeep} opacity={0.9} />
        {[px0 + 34, px1 - 34].map((x) => <circle key={x} cx={x} cy={dir === 1 ? y0 + PT - 26 : y0 + 26} r={9} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} />)}
      </g>
    );
  };
  const Arm: React.FC<{dir: 1 | -1}> = ({dir}) => {
    const y = armT(dir).y;
    return (
      <g>
        <rect x={px0 - 40} y={y} width={wallX + AT - px0 + 40} height={AT} rx={10} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
        <rect x={px0 - 30} y={y + (dir === 1 ? AT - 17 : 7)} width={wallX + AT - px0 + 20} height={10} rx={5} fill={C.saffronLight} opacity={0.85} />
      </g>
    );
  };
  return (
    <g opacity={open}>
      {/* the mounting beam out to the frame edge shudders at the lock; the pads and arms ride with the bracket */}
      <g transform={`translate(${rc} 0)`}>
        <rect x={wallX + AT - 6} y={cy - 92} width={W - wallX - AT + 200} height={184} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
        <rect x={wallX + AT - 6} y={cy - 92} width={W - wallX - AT + 200} height={22} fill={C.saffronLight} opacity={0.8} />
        {[0, 1].map((i) => <circle key={i} cx={wallX + AT + 56 + i * 90} cy={cy} r={13} fill={C.saffronDeep} stroke={C.ink} strokeWidth={5} />)}
        <rect x={wallX} y={cy - outer} width={AT} height={2 * outer} fill={C.saffron} stroke={C.ink} strokeWidth={7} />
        <Arm dir={-1} />
        <Arm dir={1} />
        <Pad dir={-1} />
        <Pad dir={1} />
      </g>
      {flash > 0 && [-1, 1].map((s) => <rect key={s} x={px0 + 10} y={cy + s * TH - 4} width={px1 - px0 - 20} height={8} rx={4} fill={C.cream} opacity={flash} />)}
      <Sparks t={t} px0={px0} px1={px1} cy={cy} />
    </g>
  );
};

/** whole brake picture for relative frame t. `caliperIn` slides the bracket in from the right (finale); `ringK` is the belt's size (the equator line grows into it in the finale). */
export const BrakeScene: React.FC<{t: number; caliperIn?: number; ringK?: number; line?: number; rot0?: number; tilt?: number}> = ({t, caliperIn = 1, ringK = 1, line = 0, rot0 = 40, tilt = 0}) => {
  const rot = spinRot(t, rot0), spinning = t < CONTACT;
  const g: GlobeP = {cx: BK.cx, cy: BK.cy, R: BK.R, rot, tilt, id: 'gb', cloud: rot * 0.35, blur: spinning ? 6 : 0, ring: ringK, line};
  const slide = (1 - caliperIn) * 640;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <SpaceBG id="bkbg" glowX={BK.cx + 60} glowY={BK.cy} />
      <GlobeBack {...g} />
      <Globe3 {...g} />
      <g transform={`translate(${slide} 0)`}><Caliper t={t} /></g>
    </svg>
  );
};

/** the dive: a fast punch-in at the contact point after the lock (f15-19), then the action cut */
export const diveScale = (f: number) => 1 + 1.35 * E.in(Math.max(0, Math.min(1, (f - T.diveA) / (T.cutStreet - T.diveA))));
export const DIVE_AT = {x: BK.cx + 0.98 * BK.R - 60, y: BK.cy};

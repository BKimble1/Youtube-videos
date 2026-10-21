// 3:53–5:05 The tower has to meet the ship: low-angle reveal, carriage + arms mechanics, the ship's catch points
// (conceptual), the September rehearsal, what it does not test, everything that must agree, the contact.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, Frame, Sky, World} from '../assets/env';
import {Ship, shipCatchX, shipCatchY, SHIP_LEN, R} from '../assets/vehicles';
import {Ground, PlanView, Tower, VEH_X, HINGE_X, TOWER_H} from '../assets/tower';
import {CloudField, Shore, TowerSet} from '../kit/scene';
import {CATCH_Y, ShipCatch, CatchState, shipPinWorld} from '../kit/catch';
import {clamp, ep, keys, lerp, ls, le, noise, wt} from '../kit/anim';
import {BigText, C, Callout, Chip, FONT, Mark} from '../kit/ui';
import {Shot} from '../kit/timeline';

const sx = (cam: Cam, x: number) => 960 + (x - cam.x) * cam.z;
const sy = (cam: Cam, y: number) => 540 + (y - cam.y) * cam.z;

/** Low-angle tower reveal: CSS perspective tilt gives a looking-up keystone. */
const T1: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e1');
  const u = t - t0;
  const T = ls('e3') - t0;
  const k = ep(u, 0, T);
  const cam: Cam = {x: lerp(6, VEH_X - 12, k), y: lerp(-92, -84, k), z: lerp(3.9, 5.2, k)};
  const tilt = lerp(15, 4, ep(u, 0, T * 0.8));
  return (
    <AbsoluteFill style={{perspective: '1100px', overflow: 'hidden', background: '#05070a'}}>
      <AbsoluteFill style={{transform: `rotateX(${tilt}deg) scale(${1 + tilt / 40})`, transformOrigin: '50% 100%'}}>
        <Frame>
          <TowerSet cam={cam} light="dusk" carY={-100} openNear={34} openFar={34} t={t} />
        </Frame>
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <Callout text="LAUNCH & CATCH TOWER" sub="Starbase, Texas" x={1180} y={150} o={ep(t, wt('e2', 'tower') - 0.2, wt('e2', 'tower') + 0.3)} size={38} />
        <Callout text="it's a machine" x={1180} y={300} o={ep(t, wt('e2', 'machine') - 0.2, wt('e2', 'machine') + 0.3)} size={30} dark />
        <Chip text="ILLUSTRATION · PROPORTIONS APPROXIMATE" x={44} y={1036} />
      </svg>
    </AbsoluteFill>
  );
};

/** Mechanics: carriage rides the tower; arms swing open/closed. Plan inset mirrors the arm angle. */
const T3: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e3');
  const u = t - t0;
  const carY = keys(u, [[0, -100], [1.2, -100], [3.2, -70], [4.6, -70], [6.2, -100]]);
  const open = keys(t, [[wt('e3', 'swing') - 0.2, 40], [wt('e3', 'swing') + 0.9, 6], [wt('e3', 'closed') + 0.6, 40], [wt('e3', 'follow') + 0.5, 22], [le('e3'), 16]]);
  const cam: Cam = {x: HINGE_X + 4, y: -84, z: 7.5};
  const cy = sy(cam, carY);
  return (
    <Frame>
      <TowerSet cam={cam} light="day" carY={carY} openNear={open} openFar={open} t={t} />
      <g opacity={ep(u, 0.4, 0.8)}>
        <path d={`M${sx(cam, -7)} ${sy(cam, -70)} L${sx(cam, -7)} ${sy(cam, -100)}`} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" />
        <path d={`M${sx(cam, -7) - 16} ${sy(cam, -97)} L${sx(cam, -7)} ${sy(cam, -101)} L${sx(cam, -7) + 16} ${sy(cam, -97)} M${sx(cam, -7) - 16} ${sy(cam, -73)} L${sx(cam, -7)} ${sy(cam, -69)} L${sx(cam, -7) + 16} ${sy(cam, -73)}`} stroke={C.yellow} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      <Callout text="CARRIAGE" sub="rides up and down the tower" x={sx(cam, -7) - 520} y={cy - 40} to={[sx(cam, -8), cy + 10]} o={ep(t, wt('e3', 'carriage') - 0.2, wt('e3', 'carriage') + 0.3)} size={32} />
      <Callout text="ARMS SWING OPEN / CLOSED" sub="about vertical hinges" x={1140} y={cy + 160} o={ep(t, wt('e3', 'swing') - 0.2, wt('e3', 'swing') + 0.3)} size={30} />
      <g transform="translate(1580 250)" opacity={ep(t, wt('e3', 'swing') - 0.2, wt('e3', 'swing') + 0.3)}>
        <circle r={190} fill="rgba(20,25,31,0.85)" stroke={C.cream} strokeWidth={3} />
        <g transform={`scale(5.6) translate(${-VEH_X + 6} 0)`}>
          <PlanView openNear={open} openFar={open} vx={VEH_X} vz={0} ship dark />
        </g>
        <text y={170} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={18} fill={C.cream}>VIEW FROM ABOVE</text>
      </g>
      <Chip text="ILLUSTRATION · MECHANISM SIMPLIFIED" x={44} y={1036} />
    </Frame>
  );
};

/** Ship catch points near the forward flaps: conceptual diagram, plan + side. */
const T4: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e4');
  const u = t - t0;
  const s: CatchState = {gap: keys(u, [[0, 7], [4, 1.5]]), open: keys(u, [[0, 22], [3.5, 6]]), engines: 0};
  const cam: Cam = {x: VEH_X + 2, y: CATCH_Y - 8, z: 21};
  const pin = shipPinWorld(s);
  const diag = ep(t, wt('e4', 'diagram') - 0.4, wt('e4', 'diagram') + 0.2);
  return (
    <AbsoluteFill style={{filter: `saturate(${1 - 0.35 * diag})`}}>
      <Frame>
        <ShipCatch t={t} cam={cam} light="day" s={s} catchPts={1} clouds={false} />
        <Callout text="CATCH POINTS" sub="near the forward flaps (reported)" x={sx(cam, pin.x) + 160} y={sy(cam, pin.y) - 260} to={[sx(cam, pin.x) + 20, sy(cam, pin.y) - 6]} o={ep(u, 0.5, 1.0)} size={34} />
        <g transform="translate(330 330)" opacity={ep(u, 1.2, 1.7)}>
          <circle r={220} fill="rgba(20,25,31,0.85)" stroke={C.cream} strokeWidth={3} />
          <g transform={`scale(6.2) translate(${-VEH_X + 4} 0)`}>
            <PlanView openNear={s.open} openFar={s.open} vx={VEH_X} vz={0} ship dark />
          </g>
          <text y={196} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={18} fill={C.cream}>VIEW FROM ABOVE · CONCEPT</text>
        </g>
        <g opacity={diag}>
          <rect x={560} y={850} width={800} height={86} rx={16} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          <text x={960} y={908} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={40} fill={C.ink}>A DIAGRAM, NOT A BLUEPRINT</text>
        </g>
        <Chip text="CONCEPTUAL · EXACT SHIP CATCH HARDWARE NOT PUBLISHED" x={44} y={1036} accent={C.yellow} />
      </Frame>
    </AbsoluteFill>
  );
};

/** September rehearsal: Ship 42 lifted by Pad 2's arms into a catch position (no flight). */
const T5: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e5');
  const u = t - t0;
  const lift = ep(u, 1.0, 5.5);
  const cam: Cam = {x: VEH_X - 10, y: -78, z: 5.4 + u * 0.05};
  const s: CatchState = {gap: 0, open: 4, engines: 0};
  const carY = lerp(-48, CATCH_Y, lift);
  return (
    <Frame>
      <ShipCatch t={t} cam={cam} light="day" s={s} carY={carY} catchPts={0.8} />
      <Callout text="SHIP 42" sub="the ship assigned to Flight 15" x={1260} y={170} o={ep(t, wt('e5', 'ship') - 0.2, wt('e5', 'ship') + 0.3)} size={34} />
      <Callout text="lifted into a catch position · held" x={1180} y={330} o={ep(t, wt('e5', 'held') - 0.3, wt('e5', 'held') + 0.2)} size={28} />
      <Chip text="SEPT 11–12, 2026 · PAD 2 CHOPSTICKS TEST" sub="Illustrated from reports (NASASpaceflight) · no engines, no flight" x={44} y={1036} accent={C.teal} />
    </Frame>
  );
};

/** What the rehearsal tests, and what it can't. */
const T6: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e6');
  const u = t - t0;
  const rows: [string, boolean, number][] = [
    ['Loads', true, wt('e6', 'loads')],
    ['Alignment', true, wt('e6', 'alignment')],
    ['A ship that is still flying', false, wt('e6', 'flying')],
  ];
  return (
    <Frame>
      <ShipCatch t={t} cam={{x: VEH_X - 30, y: -80, z: 4.6}} light="day" s={{gap: 0, open: 4, engines: 0}} />
      <rect width={1920} height={1080} fill="#0a0e14" opacity={0.55 * ep(u, 0, 0.4)} />
      {rows.map(([txt, ok, tw], i) => {
        const o = ep(t, tw - 0.25, tw + 0.15);
        return (
          <g key={i} opacity={o} transform={`translate(${880} ${330 + i * 170})`}>
            <Mark x={0} y={0} ok={ok} o={o} s={48} />
            <text x={80} y={18} fontFamily={FONT.title} fontWeight={700} fontSize={54} fill={ok ? C.cream : C.yellow}>{txt}</text>
          </g>
        );
      })}
      <Chip text="WHAT A GROUND TEST CAN CHECK" x={44} y={1036} />
    </Frame>
  );
};

/** Everything has to agree at once: height, drift, tilt, speed, arms. */
const T7: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e7');
  const u = t - t0;
  const s: CatchState = {gap: 4 + 1.6 * Math.sin(u * 0.8), dx: 1.4 * Math.sin(u * 0.6), tilt: 2.2 * Math.sin(u * 0.7 + 1), open: keys(t, [[wt('e7', 'arms') - 0.3, 26], [wt('e7', 'arms') + 1.2, 9]]), engines: 0.85, plumeLen: 30};
  const cam: Cam = {x: VEH_X - 2, y: CATCH_Y + 6, z: 9.5};
  const pin = shipPinWorld(s);
  const P = [sx(cam, pin.x), sy(cam, pin.y)];
  const shipMid = [sx(cam, VEH_X + (s.dx ?? 0)), sy(cam, CATCH_Y - s.gap - shipCatchY - SHIP_LEN / 2)];
  const hl = (w: string) => ep(t, wt('e7', w) - 0.2, wt('e7', w) + 0.2);
  const arrow = (x1: number, y1: number, x2: number, y2: number, o: number, key: string) =>
    o > 0 ? (
      <g key={key} opacity={o}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.yellow} strokeWidth={7} strokeLinecap="round" />
      </g>
    ) : null;
  return (
    <Frame>
      <ShipCatch t={t} cam={cam} light="dusk" s={s} catchPts={1} clouds={false} />
      {arrow(P[0] + 120, P[1] - 90, P[0] + 120, P[1] + 70, hl('height'), 'h')}
      <Callout text="HEIGHT" x={P[0] + 150} y={P[1] - 60} o={hl('height')} size={28} />
      {arrow(shipMid[0] - 170, shipMid[1] + 200, shipMid[0] + 170, shipMid[1] + 200, hl('drift'), 'd')}
      <Callout text="DRIFT" x={shipMid[0] - 70} y={shipMid[1] + 230} o={hl('drift')} size={28} />
      {hl('tilt') > 0 ? (
        <g opacity={hl('tilt')}>
          <path d={`M${shipMid[0]} ${shipMid[1] - 260} A 260 260 0 0 1 ${shipMid[0] + 90} ${shipMid[1] - 244}`} fill="none" stroke={C.yellow} strokeWidth={8} />
          <line x1={shipMid[0]} y1={shipMid[1] - 300} x2={shipMid[0]} y2={shipMid[1] + 300} stroke={C.cream} strokeWidth={3} strokeDasharray="10 10" />
        </g>
      ) : null}
      <Callout text="TILT" x={shipMid[0] + 120} y={shipMid[1] - 330} o={hl('tilt')} size={28} />
      {arrow(shipMid[0] + 240, shipMid[1] - 120, shipMid[0] + 240, shipMid[1] + 40, hl('speed'), 's')}
      <Callout text="SPEED" x={shipMid[0] + 270} y={shipMid[1] - 100} o={hl('speed')} size={28} />
      <Callout text="ARMS IN PLACE" x={sx(cam, HINGE_X) - 200} y={sy(cam, CATCH_Y) + 120} o={hl('arms')} size={28} />
      <Chip text="ILLUSTRATION · CONCEPT OF THE CATCH WINDOW (NO PUBLISHED TOLERANCES)" x={44} y={1036} accent={C.yellow} />
    </Frame>
  );
};

/** Two machines meeting at a few points: the macro callback to the opening. */
const T8: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('e8');
  const u = t - t0;
  const s: CatchState = {gap: lerp(3.2, 1.3, ep(u, 0, 6)), open: 7, engines: 0.9, plumeLen: 30};
  const pin = shipPinWorld(s);
  const cam: Cam = {x: pin.x - 1, y: CATCH_Y - 3, z: lerp(30, 40, ep(u, 0, 6))};
  return (
    <Frame>
      <ShipCatch t={t} cam={cam} light="dusk" s={s} catchPts={1} clouds={false} />
      <Callout text="ONE FLYING" x={1240} y={210} o={ep(t, wt('e8', 'flying') - 0.2, wt('e8', 'flying') + 0.3)} size={34} />
      <Callout text="ONE BOLTED TO THE GROUND" x={1060} y={830} o={ep(t, wt('e8', 'bolted') - 0.2, wt('e8', 'bolted') + 0.3)} size={34} />
      <Chip text="ILLUSTRATION — PLANNED ATTEMPT" x={44} y={1036} accent={C.yellow} />
    </Frame>
  );
};

export const towerShots = (): Shot[] => [
  {id: 'T1', a: ls('e1') - 0.2, b: ls('e3'), render: (t) => <T1 t={t} />, tin: 'dip'},
  {id: 'T3', a: ls('e3'), b: ls('e4'), render: (t) => <T3 t={t} />, tin: 'fade'},
  {id: 'T4', a: ls('e4'), b: ls('e5'), render: (t) => <T4 t={t} />, tin: 'fade'},
  {id: 'T5', a: ls('e5'), b: ls('e6'), render: (t) => <T5 t={t} />, tin: 'whipR'},
  {id: 'T6', a: ls('e6'), b: ls('e7'), render: (t) => <T6 t={t} />, tin: 'fade'},
  {id: 'T7', a: ls('e7'), b: ls('e8'), render: (t) => <T7 t={t} />, tin: 'fade'},
  {id: 'T8', a: ls('e8'), b: ls('f1'), render: (t) => <T8 t={t} />, tin: 'fade'},
];
void Ship; void shipCatchX; void R; void TOWER_H; void Ground; void Tower; void Sky; void World; void CloudField; void Shore; void BigText; void noise; void clamp;

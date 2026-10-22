import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage, SHIP_CP} from '../kit/Stage';
import {Badge, Big, Cam, Note, Svg, Tag, Vignette, toScreen} from '../kit/ui';
import {kf, lerp, ramp, out, io} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X, TOWER_H} from '../assets/Tower';
import {Starship} from '../assets/Starship';
import {SuperHeavy} from '../assets/SuperHeavy';
import {PlanView, PlanLabel} from '../assets/Plan';
import {C, FONT, MONO} from '../theme';

// 3:55 - 4:17  tower anatomy: height, carriage, hinged arms, waiting position
export const TowerScene: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('d1') - 6;
  const dive = ramp(f, a, fS('d2') + 10, io);
  const plan = f >= fS('d4') - 4 && f < fS('d5') - 4;
  const armY = kf(f, [[fS('d3') + 20, -760], [fS('d3') + 70, -1080], [fS('d3') + 120, -560], [fS('d3') + 165, -700], [fS('d5') + 10, -700], [fS('d5') + 60, -640]]);
  const open = kf(f, [[fS('d5'), 0.15], [fS('d5') + 40, 1]]);
  const mid = ramp(f, fS('d3') - 6, fS('d3') + 20, io);
  const wait = ramp(f, fS('d5') - 4, fS('d5') + 30, io);
  const cam: Cam = {
    x: lerp(lerp(lerp(500, 120, dive), 120, mid), 170, wait),
    y: lerp(lerp(lerp(-500, -800, dive), -820, mid), -740, wait),
    s: lerp(lerp(lerp(0.32, 0.64, dive), 0.78, mid), 0.7, wait),
  };
  const topP = toScreen(cam, -80, -TOWER_H);
  const botP = toScreen(cam, -80, 0);
  const hgt = ramp(f, fS('d2') + 4, fS('d2') + 34, io) * (1 - ramp(f, fS('d3') - 4, fS('d3') + 6));
  const car = toScreen(cam, -72, armY + 40);
  return (
    <AbsoluteFill>
      {!plan && <Stage cam={cam} sky="dusk" sun={{x: 1600, y: 980}} armY={armY} open={open} t={f} clouds={0.35} />}
      {!plan && (
        <Svg>
          {hgt > 0 && (
            <g opacity={hgt}>
              <line x1={topP.x} y1={botP.y} x2={topP.x} y2={lerp(botP.y, topP.y, hgt)} stroke="#fff" strokeWidth={3} />
              {Array.from({length: 45}, (_, i) => {
                const y = lerp(botP.y, topP.y, (i + 1) / 45);
                return y >= lerp(botP.y, topP.y, hgt) - 1 ? <line key={i} x1={topP.x - 10} y1={y} x2={topP.x} y2={y} stroke="#fff" strokeWidth={1.5} opacity={0.7} /> : null;
              })}
              <text x={topP.x - 24} y={(topP.y + botP.y) / 2} textAnchor="end" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={36} style={{paintOrder: 'stroke'}} stroke="#0b1020" strokeWidth={7}>~45 STORIES</text>
              <text x={topP.x - 24} y={(topP.y + botP.y) / 2 + 36} textAnchor="end" fill="#dbe4ee" fontFamily={FONT} fontWeight={700} fontSize={22} style={{paintOrder: 'stroke'}} stroke="#0b1020" strokeWidth={5}>steel lattice tower</text>
            </g>
          )}
          <Tag x={car.x} y={car.y} tx={car.x - 120} ty={car.y + 190} align="right" text="CARRIAGE" sub="rides up and down the tower" at={fS('d3') + 10} out={fS('d4') - 6} />
          {f >= fS('d3') + 10 && f < fS('d4') - 6 && (
            <g opacity={ramp(f, fS('d3') + 14, fS('d3') + 24)}>
              <path d={`M ${car.x - 40} ${car.y - 120} l 0 -60 m -16 18 l 16 -18 l 16 18 M ${car.x - 40} ${car.y + 120} l 0 60 m -16 -18 l 16 18 l 16 -18`} stroke={C.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
            </g>
          )}
          <Tag x={toScreen(cam, 300, armY).x} y={toScreen(cam, 300, armY).y} tx={toScreen(cam, 300, armY).x + 140} ty={toScreen(cam, 300, armY).y - 150} text="WAITING POSITION" sub="arms open, height set" at={fS('d5') + 40} />
        </Svg>
      )}
      {plan && <ArmPlan />}
      <Badge text="ILLUSTRATION · CATCH TOWER" tone="info" />
      <Vignette k={0.45} />
    </AbsoluteFill>
  );
};

const ArmPlan: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('d4') - 4;
  const open = 0.5 + 0.5 * Math.sin((f - a) / 12 - Math.PI / 2);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#e7edf3,#cfd9e3)'}}>
      <Svg>
        <g transform="translate(560 560) scale(1.9)">
          <PlanView open={open} vehicle="ship" vx={420} hl />
        </g>
        <circle cx={560 + 60 * 1.9} cy={560 + 56 * 1.9} r={40} fill="none" stroke={C.danger} strokeWidth={4} />
        <circle cx={560 + 60 * 1.9} cy={560 - 56 * 1.9} r={40} fill="none" stroke={C.danger} strokeWidth={4} />
        <text x={560 + 60 * 1.9} y={560 + 56 * 1.9 + 80} textAnchor="middle" fill="#1b2330" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={2}>HINGE + ACTUATOR</text>
        <text x={560} y={200} textAnchor="middle" fill="#1b2330" fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={3}>FROM ABOVE</text>
      </Svg>
      <Big text="Each arm swings on its own hinge." at={a + 6} size={52} y={940} color="#16202c" />
    </AbsoluteFill>
  );
};

// ship-catch kinematics: constant deceleration onto the rail
const S_ARM = -640;
const S_RAIL = S_ARM - 3;
const sCatchF = () => fS('d7') + 4;
const sCy = (f: number) => {
  const T0 = fS('d6') - 10;
  const u = Math.min(1, (f - T0) / (sCatchF() - T0));
  return S_RAIL - 1050 * (1 - u) * (1 - u);
};

// 4:17 - 4:38  the planned ship catch, then the conceptual-interface caveat
export const ShipCatch: React.FC = () => {
  const f = useCurrentFrame();
  const CF = sCatchF();
  const cy = sCy(f);
  const settled = f >= CF;
  const dip = settled ? 7 * Math.exp(-(f - CF) / 10) * Math.sin((f - CF) / 3.2) : 0;
  const open = kf(f, [[fS('d6') + Math.round(3.4 * 30), 1], [CF - 12, 0.04]]);
  const vx = CATCH_X + 22 * Math.pow(Math.max(0, 1 - (f - fS('d6')) / (CF - fS('d6'))), 2) * Math.sin(f / 26);
  const tilt = 1.8 * Math.pow(Math.max(0, 1 - (f - fS('d6')) / (CF - fS('d6'))), 1.5) * Math.sin(f / 31);
  const close = ramp(f, fS('d8') - 6, fS('d8') + 30, io);
  const cam: Cam = {
    x: lerp(CATCH_X + 40, CATCH_X, close),
    y: lerp(Math.max(cy + 120, -900), S_RAIL - 30, close) + 0,
    s: lerp(0.78, 3.6, close),
  };
  const cp = toScreen(cam, vx, cy + dip);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dusk" sun={{x: 1350, y: 960}} stars={0.2} armY={S_ARM + dip} open={open} vehicle="ship" vx={vx} cy={cy + dip} tilt={tilt} ship={{burn: settled ? 0 : 0.85, fwd: -6, aft: -12, catchPoints: true}} t={f} clouds={0.3} hl={close > 0.3} />
      <Svg>
        <Tag x={cp.x} y={cp.y - 6} tx={cp.x + 240} ty={cp.y - 160} text="CATCH POINTS" sub="near and far side" at={fS('d6') + 120} out={fS('d7') + 60} />
        {close > 0.6 && (
          <g opacity={ramp(f, fS('d8') + 26, fS('d8') + 40)}>
            <rect x={cp.x - 130} y={cp.y - 120} width={260} height={150} rx={12} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="14 10" />
            <text x={cp.x} y={cp.y - 140} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={2} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={6}>EXACT DESIGN NOT PUBLISHED</text>
          </g>
        )}
      </Svg>
      <Badge text={close > 0.5 ? 'CONCEPTUAL · SHIP CATCH INTERFACE' : 'ILLUSTRATION · PLANNED ATTEMPT'} />
      <Vignette k={0.5} />
    </AbsoluteFill>
  );
};

// 4:38 - 5:11  the reported ground rehearsal, why the ship's shape matters, the four conditions
export const ShipFit: React.FC = () => {
  const f = useCurrentFrame();
  const d9 = fS('d9');
  const shape = f >= fS('d10') - 4;
  const lift = ramp(f, d9 + 60, d9 + 200, io);
  const qd = ramp(f, d9 + 230, d9 + 280, io);
  const cam: Cam = {x: 150, y: -720, s: 0.66};
  return (
    <AbsoluteFill>
      {!shape && (
        <>
          <Stage cam={cam} sky="day" armY={lerp(-545, -700, lift)} open={0} vehicle="ship" ship={{catchPoints: true, engines: false}} t={f} clouds={0.6} qd={qd} />
          <Svg>
            <Tag x={toScreen(cam, 160, -1180).x} y={toScreen(cam, 160, -1180).y + 14} tx={toScreen(cam, 160, -1180).x + 220} ty={toScreen(cam, 160, -1180).y - 120} text="QUICK-DISCONNECT ARM" sub="connected during the test (reported)" at={d9 + 250} />
          </Svg>
          <Badge text="ILLUSTRATION OF A REPORTED GROUND TEST · SEPT 2026" tone="info" />
          <Note text="Ship 42 lifted by Pad 2's arms into a simulated catch position · reported by NASASpaceflight and Teslarati" at={d9 + 20} />
        </>
      )}
      {shape && <ShapeFit />}
      <Vignette k={0.35} />
    </AbsoluteFill>
  );
};

const ShapeFit: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('d10') - 4;
  const cmp = 1 - ramp(f, fS('d11') - 6, fS('d11') + 10);
  const fit = ramp(f, fS('d11') - 6, fS('d11') + 10);
  const close = kf(f, [[fS('d11') + 6, 1], [fS('d11') + 80, 0]]);
  const checks = ['PLACE', 'HEIGHT', 'SPEED', 'ATTITUDE'];
  const ck = (i: number) => fS('d12') + Math.round([2.3, 3.2, 4.1, 5.2][i] * 30);
  const list = ramp(f, fS('d12') - 6, fS('d12') + 8);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#0f1828,#1a2a45)'}}>
      <Svg>
        {cmp > 0 && (
          <g opacity={cmp}>
            <g transform="translate(560 900) scale(0.95)"><SuperHeavy t={f} /></g>
            <g transform="translate(1100 900) scale(0.95)"><Starship t={f} catchPoints /></g>
            <text x={560} y={1000} textAnchor="middle" fill="#a8b8cc" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={2}>BOOSTER ~72 m</text>
            <text x={1100} y={1000} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={2}>SHIP ~52 m</text>
            <g transform="translate(1520 520) scale(1.5)" opacity={ramp(f, a + 90, a + 104)}>
              <circle r={45} fill={C.steel1} stroke="#2b2f36" strokeWidth={2} />
              <path d="M -45 0 A 45 45 0 0 0 45 0 Z" fill={C.tile0} />
              <path d="M -42 -16 L -66 -11 L -66 11 L -42 16 Z M 42 -16 L 66 -11 L 66 11 L 42 16 Z" fill={C.tile1} stroke={C.steel0} strokeWidth={1.5} />
              <text y={95} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={14} letterSpacing={1.5}>FLAPS · HEAT SHIELD SIDE</text>
            </g>
          </g>
        )}
        {fit > 0 && (
          <g opacity={fit * (1 - list * 0.7)}>
            <g transform="translate(420 560) scale(1.8)">
              <PlanView open={close} vehicle="ship" hl />
              <circle cx={230 - 66} cy={0} r={14} fill="none" stroke={C.ok} strokeWidth={2} strokeDasharray="4 4" />
              <circle cx={230 + 66} cy={0} r={14} fill="none" stroke={C.ok} strokeWidth={2} strokeDasharray="4 4" />
            </g>
            <text x={420 + 230 * 1.8} y={300} textAnchor="middle" fill={C.ok} fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={2}>CLEAR OF FLAPS AND TILES</text>
          </g>
        )}
        {list > 0 && (
          <g opacity={list} transform="translate(1180 330)">
            {checks.map((c, i) => {
              const o = ramp(f, ck(i), ck(i) + 8, out);
              return (
                <g key={c} transform={`translate(0 ${i * 120})`}>
                  <rect x={0} y={-40} width={70} height={70} rx={12} fill="none" stroke="#7d8ea8" strokeWidth={4} />
                  <path d="M 14 -6 L 30 12 L 58 -24" stroke={C.ok} strokeWidth={9} fill="none" strokeLinecap="round" opacity={o} />
                  <text x={100} y={14} fill="#fff" fontFamily={FONT} fontWeight={900} fontSize={54} opacity={0.4 + 0.6 * o}>{`the right ${c.toLowerCase()}`}</text>
                </g>
              );
            })}
          </g>
        )}
      </Svg>
      {fit > 0 && <Badge text="CONCEPTUAL · TOP-DOWN SCHEMATIC" />}
    </AbsoluteFill>
  );
};

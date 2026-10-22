import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../kit/Stage';
import {Badge, Big, Cam, Note, Svg, Tag, Vignette, toScreen} from '../kit/ui';
import {kf, lerp, ramp, out, io} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X} from '../assets/Tower';
import {Starship} from '../assets/Starship';
import {SuperHeavy} from '../assets/SuperHeavy';
import {EngineMap} from '../assets/EngineMap';
import {C, FONT, MONO} from '../theme';

const MOUNT_TOP = -170;
export const BOOSTER_ON_MOUNT = MOUNT_TOP; // booster origin (skirt bottom) when stacked
export const SHIP_ON_STACK = MOUNT_TOP - 720; // ship origin when stacked

// The full vehicle on the launch mount. `gap` lifts the ship (exploded view); `bo`/`so` are opacities.
export const Stack: React.FC<{t: number; gap?: number; bo?: number; so?: number; burn?: boolean; dy?: number}> = ({t, gap = 0, bo = 1, so = 1, burn = false, dy = 0}) => (
  <g>
    <g transform={`translate(${CATCH_X} ${BOOSTER_ON_MOUNT + dy})`} opacity={bo}>
      <SuperHeavy t={t} burn={burn ? 'all33' : 'off'} catchPoint={false} />
    </g>
    <g transform={`translate(${CATCH_X} ${SHIP_ON_STACK - gap + dy})`} opacity={so}>
      <Starship t={t} />
    </g>
  </g>
);

// 0:31 - 0:51  the whole machine: booster, ship, height
export const StackScene: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = fS('a1') - 6;
  const up = ramp(f, a0, a0 + 80, io);
  const back = ramp(f, a0 + 76, fS('a2') - 4, out);
  const cam: Cam = {
    x: lerp(CATCH_X, lerp(CATCH_X, 330, back), 1),
    y: lerp(lerp(-260, -1250, up), -760, back),
    s: lerp(1.25, 0.62, back),
  };
  const gap = kf(f, [[fS('a2') - 4, 0], [fS('a2') + 16, 90], [fS('a4') - 6, 90], [fS('a4') + 14, 0]]);
  const hB = ramp(f, fS('a2'), fS('a2') + 10) * (1 - ramp(f, fS('a3'), fS('a3') + 10));
  const hS = ramp(f, fS('a3'), fS('a3') + 10) * (1 - ramp(f, fS('a4'), fS('a4') + 10));
  const bo = 1 - 0.55 * hS;
  const so = 1 - 0.55 * hB;
  const dimA = ramp(f, fS('a4') + 6, fS('a4') + 24, out);
  const top = toScreen(cam, CATCH_X + 90, SHIP_ON_STACK - 520);
  const bot = toScreen(cam, CATCH_X + 90, BOOSTER_ON_MOUNT);
  const bMid = toScreen(cam, CATCH_X + 50, BOOSTER_ON_MOUNT - 360);
  const sMid = toScreen(cam, CATCH_X + 50, SHIP_ON_STACK - gap - 260);
  const reveal = ramp(f, fS('a2') + 40, fS('a2') + 120, io);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="dawn" sun={{x: 300, y: 1000}} armY={-1180} open={1.75} t={f} clouds={0.5} behind={<Stack t={f} gap={gap} bo={bo} so={so} />} />
      <Svg>
        <Tag x={bMid.x} y={bMid.y} tx={bMid.x + 230} ty={bMid.y - 30} text="SUPER HEAVY" sub="the booster · 33 Raptor engines" at={fS('a2') + 4} out={fS('a3')} />
        <Tag x={sMid.x} y={sMid.y} tx={sMid.x + 230} ty={sMid.y - 30} text="STARSHIP" sub="the ship · goes to space" at={fS('a3') + 4} out={fS('a4')} />
        {dimA > 0 && (
          <g opacity={dimA}>
            <line x1={top.x + 40} y1={top.y} x2={top.x + 40} y2={lerp(top.y, bot.y, dimA)} stroke="#fff" strokeWidth={3} />
            <line x1={top.x + 22} y1={top.y} x2={top.x + 58} y2={top.y} stroke="#fff" strokeWidth={3} />
            <line x1={bot.x + 22} y1={bot.y} x2={bot.x + 58} y2={bot.y} stroke="#fff" strokeWidth={3} opacity={dimA > 0.95 ? 1 : 0} />
            <text x={top.x + 70} y={(top.y + bot.y) / 2} fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={44} style={{paintOrder: 'stroke'}} stroke="#0b1020" strokeWidth={8}>
              ≈ 124 m
            </text>
            <text x={top.x + 70} y={(top.y + bot.y) / 2 + 40} fill="#dfe7ef" fontFamily={FONT} fontWeight={700} fontSize={24} style={{paintOrder: 'stroke'}} stroke="#0b1020" strokeWidth={6}>
              booster + ship (V3)
            </text>
          </g>
        )}
        {hB > 0 && (
          <g transform="translate(1580 760)" opacity={hB}>
            <circle r={150} fill="rgba(6,10,18,0.72)" />
            <g transform="rotate(-90)">
              <EngineMap r={122} reveal={reveal} lit="none" />
            </g>
            <text y={192} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={2}>
              SEEN FROM BELOW: {Math.round(reveal * 33)}
            </text>
          </g>
        )}
      </Svg>
      <Vignette k={0.4} />
    </AbsoluteFill>
  );
};

// Simple icons for the "what comes back" comparison (not to scale with each other's hardware)
const GenericRocket: React.FC<{sep: number; fall: number}> = ({sep, fall}) => (
  <g>
    <g transform={`translate(${fall * 60} ${sep * 30 + fall * 300}) rotate(${fall * 70})`} opacity={1 - fall * 0.7}>
      <rect x={-22} y={-200} width={44} height={200} rx={4} fill="#f2f4f7" stroke="#4a5563" strokeWidth={3} />
      <path d="M -22 -20 L -42 10 L -22 0 Z M 22 -20 L 42 10 L 22 0 Z" fill="#c4473d" />
    </g>
    <g transform={`translate(0 ${-sep * 30})`}>
      <rect x={-18} y={-320} width={36} height={115} rx={4} fill="#f2f4f7" stroke="#4a5563" strokeWidth={3} />
      <path d="M -18 -320 Q 0 -380 18 -320 Z" fill="#c4473d" stroke="#4a5563" strokeWidth={3} />
    </g>
  </g>
);
const Falcon: React.FC<{sep: number; land: number; fall2: number}> = ({sep, land, fall2}) => (
  <g>
    <g transform={`translate(${land * -10} ${sep * 30 + land * 160})`}>
      <rect x={-16} y={-250} width={32} height={250} rx={3} fill="#f5f6f8" stroke="#4a5563" strokeWidth={3} />
      <rect x={-16} y={-262} width={32} height={18} fill="#1e2228" />
      {land > 0.5 && <path d="M -16 -10 L -40 22 M 16 -10 L 40 22" stroke="#1e2228" strokeWidth={5} />}
    </g>
    <g transform={`translate(${fall2 * 40} ${-sep * 40 + fall2 * 120}) rotate(${fall2 * 50})`} opacity={1 - fall2 * 0.8}>
      <rect x={-16} y={-372} width={32} height={100} rx={3} fill="#f5f6f8" stroke="#4a5563" strokeWidth={3} />
      <path d="M -16 -372 Q 0 -425 16 -372 Z" fill="#f5f6f8" stroke="#4a5563" strokeWidth={3} />
    </g>
  </g>
);
const Mark: React.FC<{x: number; y: number; ok: boolean; a: number}> = ({x, y, ok, a}) => (
  <g transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * a})`} opacity={a}>
    <circle r={26} fill={ok ? C.ok : C.danger} />
    {ok ? <path d="M -12 0 L -3 10 L 13 -10" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" /> : <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke="#fff" strokeWidth={6} strokeLinecap="round" />}
  </g>
);

// 0:51 - 1:11  what normally gets thrown away; the Oct 20 announcement; the goal
export const ThrowawayScene: React.FC = () => {
  const f = useCurrentFrame();
  const a5 = fS('a5');
  const c1 = ramp(f, a5, a5 + 12, out);
  const c1s = ramp(f, a5 + 20, a5 + 40);
  const c1f = ramp(f, a5 + 40, a5 + 90);
  const fal = fS('a5') + Math.round(4.4 * 30);
  const c2 = ramp(f, fal - 8, fal + 6, out);
  const c2s = ramp(f, fal + 6, fal + 26);
  const c2l = ramp(f, fal + 26, fal + 90);
  const quote = ramp(f, fS('a6') - 4, fS('a6') + 12, out) * (1 - ramp(f, fS('a7') - 6, fS('a7') + 6));
  const c3 = ramp(f, fS('a7') - 4, fS('a7') + 14, out);
  const ret = ramp(f, fS('a7') + 14, fE('a7') + 6);
  const dim = 1 - 0.65 * Math.max(quote, c3 * 0.8);
  const col = (x: number, title: string, child: React.ReactNode, a: number, op = 1) => (
    <g transform={`translate(${x} 780)`} opacity={a * op}>
      <g transform="scale(1.55)">{child}</g>
      <text y={110} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={28} fill="#1b2330" letterSpacing={2}>
        {title}
      </text>
    </g>
  );
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #e9eef3 0%, #d6dee6 100%)'}}>
      <Svg>
        <rect x={0} y={860} width={1920} height={220} fill="#9fb3c6" opacity={0.35} />
        {col(420, 'MOST ROCKETS', <g><GenericRocket sep={c1s} fall={c1f} /><Mark x={110} y={-120} ok={false} a={ramp(f, a5 + 60, a5 + 72)} /><Mark x={110} y={-330} ok={false} a={ramp(f, a5 + 66, a5 + 78)} /></g>, c1, dim)}
        {col(960, 'FALCON 9', <g><Falcon sep={c2s} land={c2l} fall2={c2l} /><Mark x={100} y={-60} ok a={ramp(f, fal + 80, fal + 92)} /><Mark x={100} y={-330} ok={false} a={ramp(f, fal + 84, fal + 96)} /></g>, c2, dim)}
        {col(1500, 'STARSHIP · THE GOAL', (
          <g>
            <g transform={`translate(${-40 - ret * 40} ${-5 - ret * 0}) scale(0.32)`}><SuperHeavy t={f} catchPoint={false} /></g>
            <g transform={`translate(${40 + ret * 40} ${-235 * (1 - ret) - 5 * ret}) scale(0.32)`}><Starship t={f} /></g>
            <Mark x={-40 - ret * 40} y={-270} ok a={ramp(f, fE('a7') - 10, fE('a7'))} />
            <Mark x={40 + ret * 40} y={-200} ok a={ramp(f, fE('a7') - 4, fE('a7') + 6)} />
          </g>
        ), c3)}
      </Svg>
      {quote > 0 && (
        <div style={{position: 'absolute', left: 260, top: 230, width: 1400, opacity: quote, background: 'rgba(10,14,22,0.92)', borderRadius: 18, padding: '44px 56px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)'}}>
          <div style={{fontFamily: MONO, fontWeight: 700, color: C.accent, fontSize: 24, letterSpacing: 3}}>OCT 20, 2026 · SPACEX EARNINGS CALL</div>
          <div style={{fontFamily: FONT, fontWeight: 800, color: '#fff', fontSize: 52, lineHeight: 1.2, marginTop: 18}}>
            “For Flight 15 … we're going to attempt to catch both the booster and the ship.”
          </div>
          <div style={{fontFamily: FONT, fontWeight: 700, color: '#b9c4d0', fontSize: 28, marginTop: 18}}>— Elon Musk, as reported. Launch expected as soon as November; no firm date.</div>
        </div>
      )}
      <Big text="Both stages, back to the launch site." at={fS('a7') + 2} size={60} y={180} color="#111a26" />
    </AbsoluteFill>
  );
};

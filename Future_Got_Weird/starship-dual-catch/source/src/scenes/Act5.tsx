import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../kit/Stage';
import {Badge, Big, Cam, Note, Svg, Tag, Vignette, toScreen} from '../kit/ui';
import {hash, kf, lerp, ramp, out, io, inn} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X} from '../assets/Tower';
import {Starship} from '../assets/Starship';
import {SuperHeavy} from '../assets/SuperHeavy';
import {PlanView} from '../assets/Plan';
import {MapBase, Dash, PAD, P, qb} from './Act2';
import {C, FONT, MONO} from '../theme';

const ARM = -640;
const RAIL = ARM - 3;

// 5:11 - 5:57  conditional failure modes (our reasoning, not SpaceX rules) and the documented Flight 6 wave-off
export const RiskScene: React.FC = () => {
  const f = useCurrentFrame();
  const shot = f < fS('e2') - 4 ? 'intro' : f < fS('e3') - 4 ? 'offset' : f < fS('e4') - 4 ? 'tilt' : f < fS('e5') - 4 ? 'fast' : f < fS('e6') - 4 ? 'notready' : f < fS('e7') - 4 ? 'flight6' : f < fS('e8') - 4 ? 'wayout' : 'history';
  return (
    <AbsoluteFill>
      {shot === 'intro' && <Intro />}
      {shot === 'offset' && <Offset />}
      {shot === 'tilt' && <Tilt />}
      {shot === 'fast' && <Fast />}
      {shot === 'notready' && <NotReady />}
      {shot === 'flight6' && <Flight6 />}
      {shot === 'wayout' && <WayOut />}
      {shot === 'history' && <History />}
      {['intro', 'offset', 'tilt', 'fast', 'notready', 'wayout'].includes(shot) && <Badge text="OUR REASONING · NOT SPACEX'S PUBLISHED RULES" />}
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e1') - 4;
  const cam: Cam = {x: CATCH_X - 20, y: -780 + (f - a) * 0.3, s: 0.62 + (f - a) * 0.0012};
  const cy = RAIL - 320 + 40 * Math.sin((f - a) / 40);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="night" stars={0.6} armY={ARM} open={0.8} vehicle="ship" cy={cy} ship={{burn: 0.8, fwd: -6, aft: -12}} t={f} clouds={0.15} />
      <Big text="What could go wrong?" at={a + 6} size={86} y={190} />
      <Vignette k={0.6} />
    </AbsoluteFill>
  );
};

const planFrame = (child: React.ReactNode, caption: string, ok: boolean, capA: number) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg,#e7edf3,#cfd9e3)'}}>
    <Svg>
      <g transform="translate(420 560) scale(1.9)">{child}</g>
      <text x={1460} y={560} textAnchor="middle" fill={ok ? '#1d6b45' : '#a3271f'} fontFamily={FONT} fontWeight={900} fontSize={58} opacity={capA}>
        {caption}
      </text>
    </Svg>
  </AbsoluteFill>
);

const Offset: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e2') - 4;
  const vx = kf(f, [[a + 10, 230], [a + 70, 415]]);
  const bad = vx > 340;
  return planFrame(<PlanView open={0.02} vehicle="ship" vx={vx} ghost bad={bad} />, 'catch points miss the arms', false, ramp(f, a + 70, a + 82));
};

const Tilt: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e3') - 4;
  const tilt = kf(f, [[a, 0], [a + 30, 7]]);
  const cam: Cam = {x: CATCH_X, y: RAIL - 150, s: 1.5};
  const cy = RAIL - 6;
  const lowSide = toScreen(cam, CATCH_X - 16, RAIL - 2);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="night" stars={0.5} armY={ARM} open={0.05} vehicle="ship" cy={cy} tilt={tilt} ship={{burn: 0.6, catchPoints: true, fwd: -6, aft: -12}} t={f} clouds={0.1} hl />
      <Svg>
        <circle cx={lowSide.x} cy={lowSide.y} r={36} fill="none" stroke={C.danger} strokeWidth={5} opacity={ramp(f, a + 30, a + 40)} />
        <text x={lowSide.x + 60} y={lowSide.y + 120} fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={2} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={6} opacity={ramp(f, a + 34, a + 44)}>
          ONE SIDE TOUCHES FIRST
        </text>
      </Svg>
      <Vignette k={0.5} />
    </AbsoluteFill>
  );
};

const Fast: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e4') - 4;
  const cam: Cam = {x: CATCH_X + 60, y: -900, s: 0.6};
  const cy = RAIL - 700 + ((f - a) * 9) % 500;
  const p = toScreen(cam, CATCH_X + 140, cy - 100);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="night" stars={0.5} armY={ARM} open={0.7} vehicle="ship" cy={cy} ship={{burn: 0.5, fwd: -6, aft: -12}} t={f} clouds={0.1} />
      <Svg>
        <g opacity={ramp(f, a + 8, a + 18)}>
          <path d={`M ${p.x} ${p.y - 120} L ${p.x} ${p.y + 160}`} stroke={C.danger} strokeWidth={14} />
          <path d={`M ${p.x - 30} ${p.y + 120} L ${p.x} ${p.y + 170} L ${p.x + 30} ${p.y + 120}`} stroke={C.danger} strokeWidth={14} fill="none" />
          <text x={p.x + 50} y={p.y + 20} fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={2} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={6}>TOO FAST</text>
          <text x={p.x + 50} y={p.y + 60} fill="#ffd2cc" fontFamily={FONT} fontWeight={700} fontSize={26} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={5}>more energy for the tower to absorb</text>
        </g>
      </Svg>
      <Vignette k={0.5} />
    </AbsoluteFill>
  );
};

const NotReady: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e5') - 4;
  const cam: Cam = {x: CATCH_X - 40, y: -820, s: 0.62};
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="night" stars={0.5} armY={-1250} open={1} t={f} clouds={0.1} />
      <Svg>
        <g opacity={0.35 * ramp(f, a, a + 10)} transform={`translate(${toScreen(cam, CATCH_X, -640).x} ${toScreen(cam, CATCH_X, -640).y}) scale(${cam.s}) translate(0 348)`}>
          <Starship t={f} />
        </g>
        <text x={1240} y={640} fill={C.danger} fontFamily={MONO} fontWeight={700} fontSize={40} letterSpacing={3} opacity={ramp(f, a + 10, a + 20)}>TOWER NOT READY</text>
        <text x={1240} y={690} fill="#fff" fontFamily={FONT} fontWeight={700} fontSize={28} opacity={ramp(f, a + 14, a + 24)}>no arms in position = no catch</text>
      </Svg>
      <Vignette k={0.5} />
    </AbsoluteFill>
  );
};

const toGulf = (t: number) => qb({x: 820, y: 180}, {x: 760, y: 420}, {x: 900, y: 960}, t);
const toPad = (t: number) => qb({x: 820, y: 180}, {x: 420, y: 230}, {x: PAD.x, y: PAD.y - 70}, t);

const Flight6: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e6') - 4;
  const ghost = ramp(f, a + 20, a + 70);
  const div = ramp(f, a + 80, a + 190, inn);
  const p = toGulf(div);
  const splash = f > a + 190 ? ramp(f, a + 190, a + 205) * (1 - ramp(f, a + 205, a + 225)) : 0;
  return (
    <AbsoluteFill>
      <Svg>
        <MapBase f={f} />
        <Dash fn={toPad} upto={ghost} color="#ffffff" op={0.35} />
        <Dash fn={toGulf} upto={div} color={C.accent} />
        <g transform={`translate(${p.x} ${p.y}) rotate(-8) scale(0.13) translate(0 360)`}>
          <SuperHeavy t={f} burn={div > 0.85 && div < 1 ? 'center3' : 'off'} catchPoint={false} />
        </g>
        {splash > 0 && <ellipse cx={900} cy={965} rx={60} ry={10} fill="#e4f3ff" opacity={splash} />}
        <text x={PAD.x + 40} y={PAD.y - 160} fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={2} opacity={ghost * 0.8}>TOWER CATCH · CALLED OFF</text>
        <text x={940} y={880} fill={C.accent} fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={2} opacity={ramp(f, a + 150, a + 165)}>GULF SPLASHDOWN</text>
      </Svg>
      <Big text="Flight 6 · November 2024" at={a + 4} size={56} y={170} sub="BOOSTER CATCH WAVED OFF" />
      <Badge text="SCHEMATIC · DOCUMENTED EVENT" tone="info" />
    </AbsoluteFill>
  );
};

const WayOut: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e7') - 4;
  const arrows = ramp(f, a + 10, a + 30);
  const q = ramp(f, a + 60, a + 72);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#0f1a2d,#1d3354)'}}>
      <Svg>
        <rect x={0} y={860} width={1920} height={220} fill="#16304d" />
        <g transform="translate(560 860)"><rect x={-26} y={-520} width={52} height={520} fill="#28323f" /><rect x={26} y={-320} width={160} height={20} fill="#3a4554" /></g>
        <g transform="translate(960 420) scale(0.42) rotate(-30)"><Starship t={f} burn={0.6} /></g>
        <g opacity={arrows} stroke="#fff" strokeWidth={6} fill="none" strokeDasharray="14 10">
          <path d="M 900 470 Q 760 520 700 560" />
          <path d="M 1020 470 Q 1260 600 1340 820" stroke={C.accent} />
        </g>
        <text x={640} y={520} textAnchor="end" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={2} opacity={arrows}>CATCH</text>
        <text x={1380} y={780} fill={C.accent} fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={2} opacity={arrows}>A WAY OUT?</text>
        <text x={1380} y={820} fill="#cfe0f2" fontFamily={FONT} fontWeight={700} fontSize={24} opacity={q}>details not public</text>
      </Svg>
    </AbsoluteFill>
  );
};

const History: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('e8') - 4;
  const rows = [
    {d: 'MAR 2024 · FLIGHT 3', t: 'ship lost during reentry'},
    {d: 'JAN & MAR 2025 · FLIGHTS 7 & 8', t: 'ships lost during ascent'},
    {d: 'MAY 2025 · FLIGHT 9', t: 'ship lost on the way down'},
  ];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#140f14,#22171d)'}}>
      <Svg>
        <g transform="translate(1500 900) scale(0.85)" opacity={0.85}><Starship t={f} /></g>
      </Svg>
      <div style={{position: 'absolute', left: 140, top: 300}}>
        {rows.map((r, i) => {
          const o = ramp(f, a + 20 + i * 36, a + 34 + i * 36, out);
          return (
            <div key={r.d} style={{opacity: o, marginBottom: 46, transform: `translateX(${(1 - o) * -30}px)`}}>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.accent, letterSpacing: 3}}>{r.d}</div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 50, color: '#fff'}}>{r.t}</div>
            </div>
          );
        })}
      </div>
      <Big text="The harder half." at={a + Math.round(5.6 * 30)} size={70} x={140} y={190} align="left" />
      <Note text="Selected earlier Starship test flights; ships on later flights reached controlled ocean splashdowns" at={a + 20} />
    </AbsoluteFill>
  );
};

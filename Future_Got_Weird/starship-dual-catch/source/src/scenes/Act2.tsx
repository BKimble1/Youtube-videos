import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../kit/Stage';
import {Badge, Big, Cam, Note, Svg, Tag, Vignette, toScreen} from '../kit/ui';
import {clamp, hash, kf, lerp, ramp, out, io, inn} from '../kit/ease';
import {fE, fS} from '../kit/tl';
import {CATCH_X} from '../assets/Tower';
import {Starship} from '../assets/Starship';
import {SuperHeavy, BOOSTER_CATCH_Y} from '../assets/SuperHeavy';
import {Flame} from '../assets/Flame';
import {Sky} from '../assets/Env';
import {PlanView, PlanLabel} from '../assets/Plan';
import {C, FONT, MONO} from '../theme';
import {interpolate} from 'remotion';

// ---------- trajectory schematic (not to scale) ----------
export type P = {x: number; y: number};
export const qb = (a: P, b: P, c: P, t: number): P => ({x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t * t * c.y});
export const PAD: P = {x: 330, y: 905};
const STG: P = {x: 1060, y: 300};
const ascent = (t: number) => qb(PAD, {x: 380, y: 420}, STG, t);
const shipOn = (t: number) => qb(STG, {x: 1500, y: 120}, {x: 2200, y: 60}, t);
const coast = (t: number) => qb(STG, {x: 1250, y: 170}, {x: 1300, y: 205}, t);
const boostback = (t: number) => qb({x: 1300, y: 205}, {x: 1150, y: 150}, {x: 820, y: 180}, t);
const fall = (t: number) => qb({x: 820, y: 180}, {x: 420, y: 230}, {x: PAD.x, y: PAD.y - 70}, t);

export const MapBase: React.FC<{f: number}> = ({f}) => (
  <g>
    <Sky kind="high" stars={0.5} />
    <path d="M -200 980 Q 960 860 2120 980 L 2120 1200 L -200 1200 Z" fill="#1f3f63" />
    <path d="M -200 980 Q 300 930 520 925 L 520 1200 L -200 1200 Z" fill="#3c5a3a" />
    <path d="M -200 981 Q 960 861 2120 981" stroke="#8fc6ff" strokeWidth={3} fill="none" opacity={0.5} />
    <g transform={`translate(${PAD.x - 6} ${PAD.y + 18})`}>
      <rect x={-6} y={-56} width={12} height={56} fill="#c9d3dd" />
      <rect x={6} y={-30} width={22} height={4} fill="#c9d3dd" />
    </g>
    <text x={PAD.x - 10} y={PAD.y + 60} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} fill="#e6edf3" letterSpacing={2}>LAUNCH SITE</text>
    <text x={1500} y={1000} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} fill="#9cc4ea" letterSpacing={2}>GULF</text>
  </g>
);

export const Dash: React.FC<{fn: (t: number) => P; upto: number; color?: string; w?: number; op?: number}> = ({fn, upto, color = '#fff', w = 3, op = 0.7}) => {
  if (upto <= 0) return null;
  const pts = Array.from({length: 40}, (_, i) => fn((i / 39) * upto));
  return <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={w} strokeDasharray="10 9" opacity={op} />;
};

// 1:11 - 1:40  how the booster comes back (with the hot-staging close-up)
export const BoosterReturn: React.FC = () => {
  const f = useCurrentFrame();
  const tA = ramp(f, fS('b2') - 10, fS('b3') - 6, inn);
  const hot = f >= fS('b3') - 4 && f < fS('b4') - 4;
  const tC = ramp(f, fS('b4'), fS('b5'), out);
  const flip = ramp(f, fS('b5'), fS('b5') + 40, io);
  const tB = ramp(f, fS('b5') + 40, fS('b6') - 4, io);
  const tF = ramp(f, fS('b6'), fS('b6') + 120, inn);
  const sT = ramp(f, fS('b4') - 4, fS('b6') + 60);
  let bp: P;
  let bang: number;
  if (f < fS('b4') - 4) {
    bp = ascent(tA);
    bang = lerp(0, 68, tA);
  } else if (f < fS('b5') + 40) {
    bp = coast(tC);
    bang = lerp(68, -100, flip);
  } else if (f < fS('b6')) {
    bp = boostback(tB);
    bang = -100;
  } else {
    bp = fall(tF);
    bang = lerp(-100, -8, ramp(f, fS('b6'), fS('b6') + 70, io));
  }
  const stacked = f < fS('b3') - 4;
  const sp = shipOn(sT);
  const scale = 0.24;
  const bb = f >= fS('b5') + 40 && f < fS('b6');
  return (
    <AbsoluteFill>
      <Svg>
        <MapBase f={f} />
        <Dash fn={ascent} upto={stacked ? tA : 1} />
        {!stacked && <Dash fn={shipOn} upto={sT} color={C.accent2} />}
        {!stacked && <Dash fn={coast} upto={tC} color={C.accent} />}
        {f >= fS('b5') + 40 && <Dash fn={boostback} upto={f < fS('b6') ? tB : 1} color={C.accent} />}
        {f >= fS('b6') && <Dash fn={fall} upto={tF} color={C.accent} />}
        {/* booster (and the ship while stacked) */}
        <g transform={`translate(${bp.x} ${bp.y}) rotate(${bang}) scale(${scale}) translate(0 ${stacked ? 360 : 360})`}>
          <SuperHeavy t={f} burn={stacked ? 'all33' : bb ? 'inner13' : 'off'} throttle={0.8} catchPoint={false} />
          {stacked && <g transform="translate(0 -720)"><Starship t={f} /></g>}
        </g>
        {!stacked && (
          <g transform={`translate(${sp.x} ${sp.y}) rotate(80) scale(${scale})`}>
            <Starship t={f} burn={1} />
          </g>
        )}
        <Tag x={bp.x} y={bp.y} tx={bp.x - 180} ty={bp.y + 140} align="right" text="BOOSTBACK" sub="engines push it back toward the coast" at={fS('b5') + 50} out={fS('b6') - 4} />
        <Tag x={STG.x} y={STG.y} tx={STG.x + 60} ty={STG.y + 170} text="STAGE SEPARATION" at={fS('b2') + 40} out={fS('b4') + 30} />
        <Tag x={bp.x} y={bp.y} tx={bp.x + 120} ty={bp.y + 130} text="ENGINES OFF · FALLING" at={fS('b6') + 6} out={fS('b6') + 100} />
      </Svg>
      {f < fS('b2') && <Big text="Part one: the booster" at={fS('b1') + 4} size={64} y={170} sub="ALREADY DONE · THREE TIMES" />}
      <Badge text="SCHEMATIC · NOT TO SCALE" tone="info" at={fS('b1')} />
      {hot && <HotStaging />}
    </AbsoluteFill>
  );
};

// Hot staging close-up: the ship lights its engines while still attached; exhaust escapes through the vented ring.
const HotStaging: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('b3') - 4;
  const ign = ramp(f, a + 14, a + 24);
  const sepT = Math.max(0, f - (a + 52)) / 30;
  const gap = 55 * sepT * sepT + 20 * sepT; // accelerating away (units)
  const bDrop = 12 * sepT * sepT;
  const cam: Cam = {x: 0, y: -730 - gap * 0.5 + bDrop * 0.5, s: lerp(1.25, 0.8, Math.min(1, sepT / 3)), r: -12};
  const jets = Array.from({length: 9}, (_, i) => -41 + i * 9.5 + 3);
  return (
    <AbsoluteFill style={{background: '#02050c'}}>
      <Svg>
        <Sky kind="high" stars={0.8} py={-500} />
        <g transform={`translate(960 540) rotate(${cam.r}) scale(${cam.s}) translate(${-cam.x} ${-cam.y})`}>
          <g transform={`translate(0 ${bDrop})`}>
            <SuperHeavy t={f} catchPoint={false} />
            {ign > 0 && (
              <g opacity={ign * Math.max(0, 1 - sepT * 0.8)}>
                {jets.map((x, i) => (
                  <g key={i}>
                    <g transform={`translate(-46 ${-708}) rotate(90)`}><Flame len={60 + 20 * hash(i + f)} w={8} t={f} seed={i} diamonds={false} /></g>
                    <g transform={`translate(46 ${-708}) rotate(-90)`}><Flame len={60 + 20 * hash(i + f + 3)} w={8} t={f} seed={i + 9} diamonds={false} /></g>
                  </g>
                )).slice(0, 3)}
              </g>
            )}
          </g>
          <g transform={`translate(0 ${-722 - gap})`}>
            <Starship t={f} burn={ign} />
          </g>
        </g>
      </Svg>
      <Svg><Tag x={960} y={470} tx={1240} ty={300} text="HOT STAGING" sub="the ship fires while still attached" at={a + 20} /></Svg>
      <Badge text="ILLUSTRATION" tone="info" />
      <Vignette k={0.6} />
    </AbsoluteFill>
  );
};

// 1:40 - 1:49  grid fins steering the falling booster
export const GridFins: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('b7') - 6;
  const fin = 22 * Math.sin((f - a) / 14) * ramp(f, a + 20, a + 40);
  const tilt = -fin * 0.12;
  const zoom = ramp(f, a, fE('b7'), io);
  const cam: Cam = {x: lerp(20, 30, zoom), y: lerp(-560, -640, zoom), s: lerp(1.6, 2.6, zoom)};
  const plan = ramp(f, a + 150, a + 165);
  return (
    <AbsoluteFill>
      <Svg>
        <Sky kind="day" py={-300} />
        {/* air rushing up past the falling booster */}
        {Array.from({length: 26}, (_, i) => {
          const x = hash(i) * 1920;
          const y = ((hash(i + 40) * 1400 - (f - a) * (26 + hash(i + 7) * 20)) % 1400 + 1400) % 1400 - 200;
          return <line key={i} x1={x} y1={y} x2={x} y2={y + 120 + hash(i + 3) * 160} stroke="#fff" strokeWidth={2} opacity={0.35} />;
        })}
        <g transform={`translate(960 540) scale(${cam.s}) translate(${-cam.x} ${-cam.y}) rotate(${tilt} 0 -400)`}>
          <SuperHeavy t={f} fin={fin} catchPoint={false} />
        </g>
      </Svg>
      <Svg><Tag x={1180} y={480} tx={1380} ty={330} text="GRID FINS" sub="three per booster on V3" at={a + 30} /></Svg>
      {plan > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', opacity: plan}}>
          <g transform="translate(330 820)">
            <rect x={-260} y={-190} width={520} height={330} rx={16} fill="rgba(6,10,18,0.78)" />
            <g transform="translate(-160 -10) scale(0.85)"><PlanView open={0} vehicle="booster" /></g>
            <PlanLabel x={0} y={115} text="FROM ABOVE: THREE FINS" size={20} />
          </g>
        </svg>
      )}
      <Badge text="ILLUSTRATION · V3 BOOSTER" tone="info" />
    </AbsoluteFill>
  );
};

// ---------- the booster catch ----------
const B_ARM = -820;
const B_RAIL = B_ARM - 3;
// booster catch-point height over the scene (constant deceleration onto the rail at frame CATCH_F)
const bCy = (f: number) => {
  const T0 = fS('b8') - 8;
  const CATCH_F = fS('b11') + 150;
  const u = Math.min(1, (f - T0) / (CATCH_F - T0));
  return B_RAIL - 1800 * (1 - u) * (1 - u);
};

// 1:49 - 2:16  landing burn, the common misconception, the catch, the "ledge"
export const BoosterCatch: React.FC = () => {
  const f = useCurrentFrame();
  const CATCH_F = fS('b11') + 150;
  const wrong = f >= fS('b9') && f < fS('b10');
  const cy = bCy(f);
  const settled = f >= CATCH_F;
  const burn = f < fS('b8') + 70 ? 'inner13' : 'center3';
  const open = kf(f, [[fS('b11') + 40, 1], [CATCH_F - 30, 0.04]]);
  const dip = settled ? 6 * Math.exp(-(f - CATCH_F) / 9) * Math.sin((f - CATCH_F) / 3) : 0;
  const vx = CATCH_X + 26 * Math.pow(Math.max(0, 1 - (f - fS('b8')) / (CATCH_F - fS('b8'))), 2) * Math.sin(f / 30);
  // camera: tracking the descent, then the wide "rocket flies into the tower" view, then close on the contact
  const track: Cam = {x: CATCH_X + 140, y: cy + 230, s: 0.85};
  const wide: Cam = {x: 210, y: -760, s: 0.6};
  const close: Cam = {x: CATCH_X + 10, y: B_RAIL - 20, s: 2.6};
  const w = ramp(f, fS('b10') - 6, fS('b10') + 30, io);
  const c = ramp(f, fS('b11') + 120, fS('b11') + 170, io);
  const ledge = ramp(f, fS('b12') - 4, fS('b12') + 20, io);
  const cam: Cam = {
    x: lerp(lerp(track.x, wide.x, w), close.x, c),
    y: lerp(lerp(track.y, wide.y, w), close.y, c) + lerp(0, 40, ledge),
    s: lerp(lerp(track.s, wide.s, w), close.s, c) * lerp(1, 1.35, ledge),
  };
  const cp = toScreen(cam, vx, cy + dip);
  const rail = toScreen(cam, CATCH_X + 90, B_RAIL + dip);
  return (
    <AbsoluteFill>
      {wrong ? (
        <WrongTongs />
      ) : (
        <Stage cam={cam} sky="night" stars={0.6} armY={B_ARM + dip} open={open} vehicle="booster" vx={vx} cy={cy + dip} burn={settled ? 'off' : burn} throttle={settled ? 0 : 0.85} fin={settled ? 0 : 8 * Math.sin(f / 20)} t={f} clouds={0.2} hl={f > fS('b11') + 60} />
      )}
      {!wrong && (
        <Svg>
          <Tag x={cp.x} y={cp.y - 4} tx={cp.x + 260} ty={cp.y - 140} text="CATCH POINT" sub="on the booster" at={fS('b11') + 30} out={fS('b12') + 140} />
          <Tag x={rail.x} y={rail.y} tx={rail.x + 170} ty={rail.y + 160} text="ARM RAIL" sub="on the tower" at={fS('b11') + 60} out={fS('b12') + 140} />
          {ledge > 0 && (
            <g opacity={ledge}>
              <path d={`M ${cp.x} ${cp.y - 220} L ${cp.x} ${cp.y - 40}`} stroke={C.accent} strokeWidth={8} markerEnd="" />
              <path d={`M ${cp.x - 20} ${cp.y - 64} L ${cp.x} ${cp.y - 34} L ${cp.x + 20} ${cp.y - 64}`} stroke={C.accent} strokeWidth={8} fill="none" />
              <text x={cp.x - 30} y={cp.y - 240} textAnchor="end" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={26} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={6}>WEIGHT → RAIL → TOWER</text>
            </g>
          )}
        </Svg>
      )}
      {f >= fS('b10') && f < fS('b11') && <Big text="The rocket flies itself into the tower." at={fS('b10') + 50} size={58} y={170} />}
      <Badge text={wrong ? 'NOT HOW IT WORKS' : 'RECONSTRUCTION · BOOSTER CATCH'} tone={wrong ? 'warn' : 'info'} />
      <Vignette k={0.5} />
    </AbsoluteFill>
  );
};

// the misconception: arms reaching out and squeezing a cylinder
const WrongTongs: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('b9');
  const sq = ramp(f, a + 14, a + 40, io);
  return (
    <AbsoluteFill style={{background: '#1a1012'}}>
      <Svg>
        <g transform="translate(960 600) scale(0.9)">
          <g transform="translate(0 260)" opacity={0.85}>
            <SuperHeavy t={f} catchPoint={false} />
          </g>
          <g transform={`translate(${-300 + sq * 205} -60)`}>
            <rect x={-220} y={-24} width={220} height={48} rx={10} fill="#6a3b3f" />
          </g>
          <g transform={`translate(${300 - sq * 205} -60)`}>
            <rect x={0} y={-24} width={220} height={48} rx={10} fill="#6a3b3f" />
          </g>
          <path d="M -60 -260 L 60 -140 M 60 -260 L -60 -140" stroke={C.danger} strokeWidth={22} strokeLinecap="round" opacity={ramp(f, a + 40, a + 48)} />
        </g>
      </Svg>
      <Big text="Not a giant pair of tongs." at={a + 6} size={64} y={170} color="#ffd0cc" />
    </AbsoluteFill>
  );
};

// 2:16 - 2:36  three booster catches, then the V3 changes
export const HistoryV3: React.FC = () => {
  const f = useCurrentFrame();
  const a = fS('b13') - 6;
  const v3 = ramp(f, fS('b14') - 6, fS('b14') + 12, io);
  const items = [
    {d: 'OCT 13, 2024', fl: 'FLIGHT 5', t: 'First catch'},
    {d: 'JAN 16, 2025', fl: 'FLIGHT 7', t: 'Second catch'},
    {d: 'MAR 6, 2025', fl: 'FLIGHT 8', t: 'Third catch'},
  ];
  const at2 = fS('b13') + Math.round(4.2 * 30);
  const fins = ramp(f, fS('b14') + 20, fS('b14') + 40);
  const arms = ramp(f, fS('b14') + Math.round(6.4 * 30), fS('b14') + Math.round(6.4 * 30) + 20);
  const track = ramp(f, fS('b14') + Math.round(8.5 * 30), fS('b14') + Math.round(8.5 * 30) + 10);
  const wob = Math.sin((f - fS('b14')) / 9) * 14 * track;
  const openV3 = 0.25 + 0.25 * Math.sin((f - fS('b14')) / 7) * track;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0f1828 0%, #182844 100%)'}}>
      <Svg>
        <g opacity={1 - v3}>
          <line x1={260} y1={560} x2={1660} y2={560} stroke="#44597a" strokeWidth={4} />
          {items.map((it, i) => {
            const o = ramp(f, i === 0 ? a + 10 : at2 + (i - 1) * 10, (i === 0 ? a + 10 : at2 + (i - 1) * 10) + 12, out);
            const x = 400 + i * 560;
            return (
              <g key={i} opacity={o} transform={`translate(${x} 560)`}>
                <circle r={18} fill={C.ok} />
                <path d="M -8 0 L -2 7 L 9 -7" stroke="#fff" strokeWidth={4} fill="none" />
                <g transform="translate(0 -60) scale(0.5)">
                  <g transform={`translate(0 ${-BOOSTER_CATCH_Y - 8})`}><SuperHeavy t={f} catchPoint={false} /></g>
                </g>
                <rect x={-100} y={-62} width={200} height={16} fill="#56626f" />
                <text y={70} textAnchor="middle" fill="#fff" fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={2}>{it.d}</text>
                <text y={106} textAnchor="middle" fill="#a8b8cc" fontFamily={MONO} fontSize={22} letterSpacing={2}>{it.fl}</text>
              </g>
            );
          })}
        </g>
        {v3 > 0 && (
          <g opacity={v3}>
            <text x={520} y={200} textAnchor="middle" fill="#a8b8cc" fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={3}>EARLIER BOOSTERS</text>
            <text x={1400} y={200} textAnchor="middle" fill={C.accent} fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={3}>V3 (2026)</text>
            <g transform="translate(250 560) scale(1.45)"><PlanView open={0.15} vehicle="booster4" armL={380} /></g>
            <g transform={`translate(1110 ${560}) scale(1.45)`}><PlanView open={openV3} vehicle="booster" vz={wob} hl={arms > 0.5} /></g>
            <g opacity={fins}>
              <text x={520} y={850} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={34}>4 grid fins · longer arms</text>
              <text x={1400} y={850} textAnchor="middle" fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={34}>3 larger grid fins · new catch point</text>
            </g>
            <g opacity={arms}>
              <text x={1400} y={900} textAnchor="middle" fill={C.accent} fontFamily={FONT} fontWeight={800} fontSize={34}>shorter arms · electric actuators</text>
            </g>
            <g opacity={track}>
              <text x={1400} y={950} textAnchor="middle" fill="#cfe3ff" fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={2}>FASTER TRACKING</text>
            </g>
          </g>
        )}
      </Svg>
      {v3 > 0 && <Note text="Top-down schematic · V3 details per SpaceX's 2026 design update, as reported; fin layout approximate" at={fS('b14')} />}
      {v3 === 0 && <Big text="Three booster catches" at={a + 4} size={64} y={220} />}
    </AbsoluteFill>
  );
};

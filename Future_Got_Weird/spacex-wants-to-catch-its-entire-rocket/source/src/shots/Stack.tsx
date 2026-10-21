// 0:28–1:09 The whole machine: stack reveal and scale, booster (33 engines), ship, the ocean endings, the plan.
import React from 'react';
import {Cam, Cloud, Frame, Sea, Sky, World} from '../assets/env';
import {Booster, Ship, BOOSTER_LEN, SHIP_LEN, R} from '../assets/vehicles';
import {Ground, Tower, VEH_X, MOUNT_H} from '../assets/tower';
import {Shore, CloudField} from '../kit/scene';
import {clamp, ep, keys, lerp, ls, noise, prog, wt} from '../kit/anim';
import {BigText, C, Callout, Chip, FONT} from '../kit/ui';
import {Shot} from '../kit/timeline';

const STACK_BASE = -MOUNT_H;

/** The stack standing on the mount beside the tower (day). */
const StackSet: React.FC<{t: number; cam: Cam; dimShip?: number; dimBooster?: number; light?: 'day' | 'dusk'}> = ({t, cam, dimShip = 0, dimBooster = 0, light = 'day'}) => (
  <>
    <Sky kind={light} />
    <CloudField cam={cam} k={0.3} n={8} tint={light === 'dusk' ? '#f3c7a8' : undefined} shade={light === 'dusk' ? '#c98d7e' : undefined} />
    <World cam={cam}>
      <Shore light={light} />
      <Ground light={light} />
      <Tower light={light} carY={-118} openNear={62} openFar={62} vehicle={
        <g transform={`translate(${VEH_X} ${STACK_BASE})`}>
          <g opacity={1 - dimBooster * 0.75}><Booster t={t} light={light} frost={0.6} /></g>
          <g transform={`translate(0 ${-BOOSTER_LEN})`} opacity={1 - dimShip * 0.75}><Ship t={t} view="three" light={light} frost={0.6} fwdFlap={0.15} aftFlap={0.25} /></g>
        </g>
      } />
    </World>
  </>
);

const sx = (cam: Cam, x: number) => 960 + (x - cam.x) * cam.z;
const sy = (cam: Cam, y: number) => 540 + (y - cam.y) * cam.z;

const S1: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('a1');
  const top = STACK_BASE - BOOSTER_LEN - SHIP_LEN;
  const cam: Cam = {
    x: keys(u, [[0, VEH_X + 2], [3.0, VEH_X], [5.0, VEH_X - 18]]),
    y: keys(u, [[0, STACK_BASE - 8], [3.0, top + 18], [5.0, -76]]),
    z: keys(u, [[0, 16], [3.0, 14], [5.0, 6.2], [8, 6.0]]),
  };
  const bar = ep(t, wt('a1', 'four') - 0.3, wt('a1', 'four') + 0.5);
  const x = sx(cam, VEH_X + 14), y0 = sy(cam, STACK_BASE), y1 = sy(cam, top);
  return (
    <Frame>
      <StackSet t={t} cam={cam} />
      {bar > 0 ? (
        <g opacity={bar}>
          <line x1={x} x2={x} y1={y0} y2={y0 + (y1 - y0) * bar} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <line x1={x} x2={x} y1={y0} y2={y0 + (y1 - y0) * bar} stroke={C.yellow} strokeWidth={3.5} strokeLinecap="round" />
          <line x1={x - 14} x2={x + 14} y1={y0} y2={y0} stroke={C.ink} strokeWidth={5} />
          <line x1={x - 14} x2={x + 14} y1={y1} y2={y1} stroke={C.ink} strokeWidth={5} opacity={bar >= 1 ? 1 : 0} />
        </g>
      ) : null}
      <Callout text="≈ 400 FT TALL" sub="about 124 m, fully stacked" x={x + 30} y={(y0 + y1) / 2 - 40} o={bar} size={36} />
      <Callout text="STARSHIP" x={sx(cam, VEH_X) - 330} y={sy(cam, top) + 40} o={ep(t, wt('a1', 'Starship') - 0.2, wt('a1', 'Starship') + 0.3)} size={40} />
      <Chip text="ILLUSTRATION · VERSION 3 STARSHIP" x={44} y={1036} o={ep(u, 0.2, 0.5)} />
    </Frame>
  );
};

const S2: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('a2');
  const cam: Cam = {x: VEH_X - 8 + u * 0.4, y: -60, z: 7.0 + u * 0.06};
  const lbl = ep(t, wt('a2', 'booster') - 0.2, wt('a2', 'booster') + 0.3);
  return (
    <Frame>
      <StackSet t={t} cam={cam} dimShip={ep(u, 0, 0.5)} />
      <Callout text="SUPER HEAVY" sub="the booster · ≈ 72 m" x={sx(cam, VEH_X) + 90} y={sy(cam, STACK_BASE - 40)} to={[sx(cam, VEH_X + R), sy(cam, STACK_BASE - 40)]} o={lbl} size={40} />
    </Frame>
  );
};

/** 33 Raptor engines seen from below: 3 centre + 10 inner ring + 20 outer ring (13 inner engines gimbal). */
const S2b: React.FC<{t: number}> = ({t}) => {
  const t0 = wt('a2', 'Thirty') - 0.1;
  const u = t - t0;
  const cx = 960, cy = 520, Rr = 330;
  const ring = (n: number, r: number, size: number, d0: number, col: string) =>
    Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const o = ep(u, d0 + i * 0.025, d0 + i * 0.025 + 0.25);
      return (
        <g key={i} transform={`translate(${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}) scale(${0.6 + 0.4 * o})`} opacity={o}>
          <circle r={size} fill="#2a2522" stroke={C.ink} strokeWidth={4} />
          <circle r={size * 0.72} fill="url(#bell)" />
          <circle r={size * 0.3} fill={col} opacity={0.9} />
        </g>
      );
    });
  const glow = ep(t, wt('a2', 'throw') - 0.3, wt('a2', 'throw') + 0.4);
  return (
    <Frame bg="#141a21">
      <rect width={1920} height={1080} fill="#141a21" />
      <circle cx={cx} cy={cy} r={Rr + 30} fill="#c7ced5" stroke={C.ink} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={Rr + 8} fill="#5a636c" />
      {ring(3, 52, 40, 0.0, C.orange)}
      {ring(10, 160, 40, 0.15, C.orange)}
      {ring(20, 288, 34, 0.45, '#9aa4ae')}
      <circle cx={cx} cy={cy} r={Rr + 120} fill="url(#glowWarm)" opacity={glow * 0.9} />
      <Callout text="33 ENGINES" sub="Raptor 3 · 3 + 10 + 20" x={1420} y={250} o={ep(u, 0.4, 0.9)} size={44} />
      <Callout text="13 central engines steer" sub="and relight for landing" x={1420} y={420} o={ep(u, 1.6, 2.1)} size={30} />
      <Chip text="SUPER HEAVY V3 · VIEW FROM BELOW (SCHEMATIC)" x={44} y={1036} o={ep(u, 0.1, 0.4)} />
    </Frame>
  );
};

/** Lift-off: all engines, the stack clears the tower. */
const S2c: React.FC<{t: number}> = ({t}) => {
  const t0 = wt('a2', 'throw') + 0.2;
  const u = t - t0;
  const h = 4 * u * u + 3 * u; // climbing, accelerating
  const cam: Cam = {x: VEH_X - 10, y: -90 - h * 0.85, z: 4.6, rot: 0};
  const stack = (
    <g transform={`translate(${VEH_X} ${STACK_BASE - h})`}>
      <Booster t={t} engines={1} plumeLen={70} ring="all" />
      <g transform={`translate(0 ${-BOOSTER_LEN})`}><Ship t={t} view="three" fwdFlap={0.15} aftFlap={0.25} /></g>
    </g>
  );
  return (
    <Frame>
      <Sky kind="day" />
      <CloudField cam={cam} k={0.35} n={8} />
      <World cam={cam}>
        <Shore light="day" />
        <Ground light="day" />
        <Tower light="day" carY={-118} openNear={62} openFar={62} vehicle={stack} />
        {/* exhaust cloud spreading from the trench */}
        {Array.from({length: 9}, (_, i) => {
          const k = clamp(u * 0.9 - i * 0.04);
          return <circle key={i} cx={VEH_X + (i - 4) * 9 * (0.4 + k)} cy={-6 - (i % 3) * 3} r={6 + 10 * k} fill="#f1ece4" stroke="#1c232b" strokeWidth={1.5} vectorEffect="non-scaling-stroke" opacity={0.92 * clamp(k * 3)} />;
        })}
      </World>
    </Frame>
  );
};

const S3: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('a3');
  const top = STACK_BASE - BOOSTER_LEN - SHIP_LEN;
  const cam: Cam = {x: VEH_X + 3, y: top + 26 - u * 0.3, z: 15 + u * 0.15};
  const o = (w: string) => ep(t, wt('a3', w) - 0.15, wt('a3', w) + 0.35);
  const shipX = sx(cam, VEH_X);
  return (
    <Frame>
      <StackSet t={t} cam={cam} dimBooster={ep(u, 0, 0.5)} />
      <Callout text="STARSHIP · THE SHIP" sub="upper stage · ≈ 52 m" x={shipX + 140} y={sy(cam, top + 8)} to={[shipX + R * cam.z * 0.8, sy(cam, top + 12)]} o={ep(t, wt('a3', 'ship') - 0.2, wt('a3', 'ship') + 0.3)} size={38} />
      <Callout text="its own engines" x={shipX + 160} y={sy(cam, top + SHIP_LEN) - 80} to={[shipX + 30, sy(cam, top + SHIP_LEN - 2)]} o={o('engines')} size={30} />
      <Callout text="cargo bay" x={shipX - 520} y={sy(cam, top + 24)} to={[shipX - 30, sy(cam, top + 24)]} o={o('cargo')} size={30} />
      <Callout text="the part that reaches space" x={shipX - 600} y={sy(cam, top + 6) - 30} o={o('space')} size={30} dark />
    </Frame>
  );
};

/** Past flights: ships and boosters ending in the sea (illustrative). */
const S4: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('a4');
  const horizon = 600;
  const z = 3.2;
  const shipDrop = clamp(u / 3.0);
  const shipY = horizon + 10 - (1 - shipDrop) * 260;
  return (
    <Frame>
      <Sky kind="day" />
      <Cloud x={300} y={220} s={1.4} />
      <Cloud x={1500} y={160} s={1.1} />
      <Sea y={horizon} t={t} />
      {/* booster settling (left), ship landing burn into the water (right) */}
      <g transform={`translate(560 ${horizon + 40}) scale(${z * 0.9}) rotate(${u > 1.8 ? Math.min(70, (u - 1.8) * 40) : 0} 0 0)`}>
        <Booster t={t} engines={u < 1.2 ? 0.7 : 0} plumeLen={10} ring="inner" scorch={0.8} />
      </g>
      <g transform={`translate(1300 ${shipY}) scale(${z})`}>
        <Ship t={t} view="profile" engines={shipDrop < 1 ? 0.85 : 0} plumeLen={18} fwdFlap={0.4} aftFlap={0.5} />
      </g>
      {/* splashes */}
      {[560, 1300].map((x, i) => {
        const k = clamp((u - (i ? 3.0 : 1.2)) / 1.2);
        return k > 0 ? (
          <g key={i} opacity={1 - k * 0.6}>
            <ellipse cx={x} cy={horizon + 44} rx={60 + 160 * k} ry={14 + 26 * k} fill="#ffffff" stroke={C.ink} strokeWidth={3} opacity={0.9} />
            <path d={`M${x - 50 - 60 * k} ${horizon + 40} Q ${x} ${horizon - 140 * k} ${x + 50 + 60 * k} ${horizon + 40}`} fill="#f2f6f8" stroke={C.ink} strokeWidth={3} opacity={0.8} />
          </g>
        ) : null;
      })}
      <rect y={horizon + 60} width={1920} height={500} fill="#2b5f88" opacity={0.0} />
      <Chip text="PAST TEST FLIGHTS END IN THE SEA" sub="illustration · not to scale" x={44} y={1036} o={ep(u, 0.2, 0.6)} accent={C.teal} />
      <Callout text="every ship so far" x={1420} y={260} o={ep(t, wt('a4', 'every') - 0.1, wt('a4', 'every') + 0.3)} size={32} />
    </Frame>
  );
};

/** The plan: both stages back to the tower (dusk), quote. */
const S5: React.FC<{t: number}> = ({t}) => {
  const u = t - ls('a5');
  const cam: Cam = {x: VEH_X + 30, y: -150, z: 3.0 + u * 0.03};
  const p1 = ep(u, 0.6, 2.6), p2 = ep(u, 1.4, 3.6);
  const arc = (x0: number, y0: number, x1: number, y1: number, bend: number, p: number, col: string) => {
    const cx = (x0 + x1) / 2 + bend, cy = Math.min(y0, y1) - 60;
    const L = 900;
    return <path d={`M${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`} fill="none" stroke={col} strokeWidth={6} strokeDasharray={`${L * p} ${L}`} strokeLinecap="round" />;
  };
  const tx = sx(cam, VEH_X), ty = sy(cam, -95);
  const q = ep(t, wt('a5', 'He') - 0.2, wt('a5', 'He') + 0.4);
  return (
    <Frame>
      <Sky kind="dusk" />
      <CloudField cam={cam} k={0.3} n={8} tint="#f3c7a8" shade="#c98d7e" />
      <World cam={cam}>
        <Shore light="dusk" />
        <Ground light="dusk" />
        <Tower light="dusk" carY={-90} openNear={40} openFar={40} />
      </World>
      {arc(1650, 120, tx + 40, ty, 200, p1, C.teal)}
      {arc(1900, -40, tx + 40, ty - 30, -300, p2, C.yellow)}
      <Callout text="BOOSTER" sub="back minutes after launch" x={1330} y={300} o={p1} size={30} />
      <Callout text="SHIP" sub="back from orbit" x={1180} y={110} o={p2} size={30} />
      <Chip text="PLANNED · FLIGHT 15 · CATCH BOTH STAGES" sub="Elon Musk, SpaceX Q3 earnings call, Oct 20, 2026 · launch expected November" x={44} y={1036} o={ep(u, 0.2, 0.6)} accent={C.yellow} />
      <g opacity={q}>
        <rect x={110} y={150} width={760} height={190} rx={18} fill={C.cream} stroke={C.ink} strokeWidth={4} />
        <text x={140} y={215} fontFamily={FONT.title} fontWeight={600} fontSize={34} fill={C.ink}>“…the first time that an orbital launch</text>
        <text x={140} y={262} fontFamily={FONT.title} fontWeight={600} fontSize={34} fill={C.ink}>vehicle has been fully recovered.”</text>
        <text x={140} y={312} fontFamily={FONT.ui} fontWeight={700} fontSize={22} fill="#55606b">Elon Musk, if both catches succeed · Oct 20, 2026</text>
      </g>
    </Frame>
  );
};

export const stackShots = (): Shot[] => [
  {id: 'S1', a: ls('a1') - 0.3, b: ls('a2'), render: (t) => <S1 t={t} />, tin: 'dip'},
  {id: 'S2', a: ls('a2'), b: wt('a2', 'Thirty') - 0.1, render: (t) => <S2 t={t} />, tin: 'cut'},
  {id: 'S2b', a: wt('a2', 'Thirty') - 0.1, b: wt('a2', 'throw') + 0.2, render: (t) => <S2b t={t} />, tin: 'fade'},
  {id: 'S2c', a: wt('a2', 'throw') + 0.2, b: ls('a3'), render: (t) => <S2c t={t} />, tin: 'flash'},
  {id: 'S3', a: ls('a3'), b: ls('a4'), render: (t) => <S3 t={t} />, tin: 'fade'},
  {id: 'S4', a: ls('a4'), b: ls('a5'), render: (t) => <S4 t={t} />, tin: 'whipL'},
  {id: 'S5', a: ls('a5'), b: ls('b1'), render: (t) => <S5 t={t} />, tin: 'whipR'},
];
void noise; void lerp; void prog; void BigText;

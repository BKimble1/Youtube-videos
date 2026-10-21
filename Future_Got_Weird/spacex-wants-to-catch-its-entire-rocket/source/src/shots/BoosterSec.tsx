// 1:09–2:26 How a booster is caught: hot staging, flip + boostback, grid-fin descent, landing burn + divert,
// the "not like this" myth, the catch itself (side + plan), the contact points, history, V3 changes, shorter arms.
import React from 'react';
import {Cam, Cloud, Frame, Sky, Stars, World, Earth} from '../assets/env';
import {Booster, Ship, BOOSTER_LEN, R, Plume, boosterCatchY} from '../assets/vehicles';
import {Ground, PlanView, VehiclePlan, Tower, VEH_X, ARM_LEN, ARM_OLD_LEN, HINGE_X} from '../assets/tower';
import {CloudField, Shore} from '../kit/scene';
import {BoosterCatch, CatchState} from '../kit/catch';
import {clamp, ep, keys, lerp, ls, le, noise, prog, wt, smoother} from '../kit/anim';
import {C, Callout, Chip, FONT, Mark} from '../kit/ui';
import {Shot} from '../kit/timeline';

const sx = (cam: Cam, x: number) => 960 + (x - cam.x) * cam.z;
const sy = (cam: Cam, y: number) => 540 + (y - cam.y) * cam.z;

/** Ascent and hot staging, high over the Gulf: the ship lights its engines while still attached, then pulls away. */
const B1: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b1');
  const u = t - t0;
  const ts = wt('b1', 'separate') - 0.2; // ship ignition
  const sep = Math.max(0, t - ts);
  const gap = sep < 0.4 ? 0 : Math.pow(sep - 0.4, 1.6) * 7;
  const ang = -12; // pitched downrange
  const cam: Cam = {x: 0, y: -60 - gap * 0.4, z: 5.2 - clamp(sep / 4) * 0.8, rot: 0};
  return (
    <Frame>
      <Sky kind="high" />
      <Stars o={0.35} t={t} />
      <Earth cx={960} cy={2600} r={1900} rot={-20} />
      {/* speed streaks */}
      {Array.from({length: 14}, (_, i) => {
        const y = ((i * 97 + u * 900) % 1300) - 100;
        return <line key={i} x1={200 + ((i * 331) % 1500)} x2={200 + ((i * 331) % 1500) - 10} y1={y} y2={y + 80} stroke="#ffffff" strokeWidth={2} opacity={0.12} />;
      })}
      <World cam={cam}>
        <g transform={`rotate(${ang})`}>
          <g transform={`translate(0 ${BOOSTER_LEN / 2})`}>
            <Booster t={t} engines={sep < 0.3 ? 1 : Math.max(0, 1 - (sep - 0.3) * 4) * 0.5} plumeLen={70} ring="all" light="day" />
          </g>
          <g transform={`translate(0 ${BOOSTER_LEN / 2 - BOOSTER_LEN - gap})`}>
            <Ship t={t} view="three" engines={sep > 0 ? Math.min(1, sep * 3) : 0} plumeLen={40} fwdFlap={0.15} aftFlap={0.25} />
          </g>
          {/* hot-stage flash through the vented ring */}
          {sep > 0 && sep < 1.4 ? (
            <g opacity={1 - sep / 1.4}>
              {[-1, 1].map((s) => (
                <ellipse key={s} cx={s * (R + 6)} cy={-BOOSTER_LEN / 2 - 2 - gap * 0.5} rx={9} ry={4} fill="url(#glowWarm)" />
              ))}
            </g>
          ) : null}
        </g>
      </World>
      <Callout text="HOT STAGING" sub="the ship lights its engines while still attached" x={1220} y={180} o={ep(t, ts + 0.1, ts + 0.6)} size={32} />
      <Chip text="ILLUSTRATION · STAGE SEPARATION" x={44} y={1036} o={ep(u, 0.2, 0.5)} />
    </Frame>
  );
};

/** Flip and boostback burn (close), then the trajectory diagram. */
const B2: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b2');
  const u = t - t0;
  // the booster rotates from engines-aft (pointing back along the ascent) to engines facing downrange, then burns
  const flip = ep(u, 0.2, 2.6);
  const ang = lerp(-12, 100, flip); // engines end up facing downrange (left); thrust pushes back uprange
  const burn = ep(u, 2.4, 2.9);
  const cam: Cam = {x: 0, y: -BOOSTER_LEN / 2, z: 6.2 + u * 0.05};
  return (
    <Frame>
      <Sky kind="high" />
      <Stars o={0.35} t={t} />
      <Earth cx={960} cy={2600} r={1900} rot={-20} />
      <World cam={cam}>
        <g transform={`translate(0 ${-BOOSTER_LEN / 2}) rotate(${ang}) translate(0 ${BOOSTER_LEN / 2})`}>
          <Booster t={t} engines={burn} plumeLen={60} ring="inner" finDeflect={0} />
          {flip > 0 && flip < 1 ? <circle cx={0} cy={-BOOSTER_LEN + 2} r={2.5} fill="#fff" opacity={0.5 * Math.sin(flip * Math.PI)} /> : null}
        </g>
      </World>
      <Callout text="FLIP" x={260} y={200} o={ep(t, wt('b2', 'flips') - 0.1, wt('b2', 'flips') + 0.3) * (1 - ep(u, 2.6, 3.0))} size={40} />
      <Callout text="BOOSTBACK BURN" sub="pushes it back toward the launch site" x={260} y={200} o={ep(t, wt('b2', 'boostback') - 0.2, wt('b2', 'boostback') + 0.3)} size={36} />
      <Chip text="ILLUSTRATION" x={44} y={1036} />
    </Frame>
  );
};

/** Profile diagram: launch site, ascent arc, separation, boostback, return to the tower. */
const B2d: React.FC<{t: number}> = ({t}) => {
  const t0 = wt('b2', 'It', 0) - 0.3;
  const u = t - t0;
  const ground = 860;
  const site = [300, ground], sep = [1100, 300];
  const up = ep(u, 0.0, 1.0), back = ep(u, 0.9, 2.4);
  const ascent = `M${site[0]} ${site[1]} C ${site[0] + 40} ${ground - 300}, ${sep[0] - 380} ${sep[1] + 40}, ${sep[0]} ${sep[1]}`;
  const ret = `M${sep[0]} ${sep[1]} C ${sep[0] + 140} ${sep[1] - 60}, ${sep[0] + 120} ${sep[1] - 120}, ${sep[0] - 60} ${sep[1] - 110} C ${700} ${sep[1] - 90}, ${420} ${ground - 300}, ${site[0] + 20} ${ground - 8}`;
  const shipPath = `M${sep[0]} ${sep[1]} C ${sep[0] + 300} ${sep[1] - 110}, ${sep[0] + 600} ${sep[1] - 160}, ${1900} ${sep[1] - 190}`;
  return (
    <Frame bg="#eaf3f8">
      <rect width={1920} height={1080} fill="#dcebf4" />
      <rect y={ground} width={1920} height={220} fill="#4c86b3" />
      <path d={`M0 ${ground} L 420 ${ground} L 470 ${ground + 8} L 0 ${ground + 8} Z`} fill="#cbbf9c" stroke={C.ink} strokeWidth={3} />
      <text x={1600} y={ground + 70} fontFamily={FONT.ui} fontWeight={800} fontSize={28} fill="#e6f1f8" textAnchor="middle">GULF OF MEXICO</text>
      {/* tower icon */}
      <rect x={site[0] - 14} y={ground - 70} width={14} height={70} fill={C.tower} stroke={C.ink} strokeWidth={3} />
      <text x={site[0] - 10} y={ground + 40} fontFamily={FONT.ui} fontWeight={800} fontSize={24} fill={C.ink}>STARBASE</text>
      <path d={ascent} fill="none" stroke={C.ink} strokeWidth={6} strokeDasharray={`${1300 * up} 2000`} strokeLinecap="round" />
      <path d={shipPath} fill="none" stroke={C.yellow} strokeWidth={6} strokeDasharray={`${1100 * ep(u, 0.9, 2.0)} 2000`} strokeLinecap="round" />
      <path d={ret} fill="none" stroke={C.teal} strokeWidth={7} strokeDasharray="18 12" strokeDashoffset={-u * 40} opacity={back > 0 ? 1 : 0} clipPath="url(#retClip)" />
      <defs>
        <clipPath id="retClip"><rect x={0} y={0} width={1920} height={1080 * 0 + 1080} transform={`translate(${(1 - back) * 1300} 0)`} /></clipPath>
      </defs>
      <circle cx={sep[0]} cy={sep[1]} r={12} fill={C.yellow} stroke={C.ink} strokeWidth={4} opacity={up >= 1 ? 1 : 0} />
      <Callout text="separation" x={sep[0] + 30} y={sep[1] + 20} o={ep(u, 0.9, 1.3)} size={26} />
      <Callout text="boostback" sub="back toward the launch site" x={560} y={140} o={ep(u, 1.4, 1.9)} size={28} />
      <Callout text="ship continues" x={1500} y={140} o={ep(u, 1.6, 2.1)} size={26} />
      <Chip text="SCHEMATIC · NOT TO SCALE" x={44} y={1036} />
    </Frame>
  );
};

/** Unpowered fall, tail first, grid fins steering; then the grid-fin close-up. */
const B3: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b3');
  const u = t - t0;
  const tFin = wt('b3', 'grid') - 0.25;
  const close = ep(t, tFin - 0.4, tFin + 0.5);
  const defl = 18 * Math.sin(u * 1.4);
  const sway = 1.2 * Math.sin(u * 1.4 - 0.6);
  const finY = -(BOOSTER_LEN - 9.5);
  const cam: Cam = {
    x: lerp(0, -(R + 2.4), close),
    y: lerp(-BOOSTER_LEN / 2, finY - 1, close),
    z: Math.exp(lerp(Math.log(6.0), Math.log(48), close)),
    rot: 0,
  };
  return (
    <Frame>
      <Sky kind="day" kind2="high" mix={0.35} />
      {/* clouds rushing upward past the falling booster */}
      {Array.from({length: 8}, (_, i) => {
        const y = 1300 - (((i * 260 + u * 520) % 1700));
        return <Cloud key={i} x={(i * 287) % 1920} y={y} s={1.2 + (i % 3) * 0.4} o={0.9} />;
      })}
      <World cam={cam}>
        <g transform={`rotate(${sway} 0 ${-BOOSTER_LEN / 2})`}>
          <Booster t={t} finDeflect={defl} light="day" scorch={0.7} />
        </g>
        {/* air streaming up through the lattice in the close-up */}
        {close > 0.05
          ? Array.from({length: 10}, (_, i) => {
              const yy = finY + 6 - (((u * 9 + i * 1.7) % 16));
              return <line key={i} x1={-(R + 0.6 + (i % 5) * 0.9)} x2={-(R + 0.6 + (i % 5) * 0.9) + defl * 0.02} y1={yy} y2={yy - 2.2} stroke="#ffffff" strokeWidth={3} opacity={0.7 * close} vectorEffect="non-scaling-stroke" strokeLinecap="round" />;
            })
          : null}
      </World>
      <Callout text="ENGINES OFF · FALLING TAIL FIRST" x={140} y={160} o={ep(u, 0.3, 0.8) * (1 - close)} size={30} />
      <Callout text="GRID FIN" sub="steel lattice · steers like a rudder" x={1180} y={180} o={ep(t, tFin + 0.2, tFin + 0.7)} size={40} />
      <Chip text="ILLUSTRATION · SUPER HEAVY V3" x={44} y={1036} />
    </Frame>
  );
};

/** Landing burn and divert: the booster slides from just offshore of the tower into line with the arms. */
const B4: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b4');
  const u = t - t0;
  const T = le('b4') - t0 + 0.3;
  const p = clamp(u / T);
  const rail = -80;
  const dx = 70 * Math.pow(1 - smoother(clamp((u - 1.2) / (T - 1.2))), 1);
  const gap = 4 + 150 * Math.pow(1 - p, 1.8);
  const tilt = -6 * Math.sin(Math.PI * clamp((u - 1.2) / (T - 1.2)));
  const burn = ep(t, wt('b4', 'light') - 0.2, wt('b4', 'light') + 0.2);
  const s: CatchState = {gap, dx, tilt, open: 48, engines: burn * 0.95, plumeLen: Math.min(45, Math.max(4, -(rail - gap - boosterCatchY()) - 14 + 2))};
  const cam: Cam = {x: VEH_X + 24, y: -110 - gap * 0.35, z: 4.1};
  return (
    <Frame>
      <BoosterCatch t={t} cam={cam} light="day" s={s} carY={rail} finDeflect={6 * Math.sin(u * 2)} />
      <Callout text="LANDING BURN" sub="13 centre engines" x={1340} y={180} o={ep(t, wt('b4', 'landing') - 0.1, wt('b4', 'landing') + 0.3)} size={34} />
      <Callout text="slides sideways toward the tower" x={1100} y={860} o={ep(t, wt('b4', 'slides') - 0.1, wt('b4', 'slides') + 0.3)} size={28} />
      <Chip text="ILLUSTRATION" x={44} y={1036} />
    </Frame>
  );
};

/** The myth: a tower arm reaching up into the sky to grab a rocket. Not how it works. */
const B5: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b5');
  const u = t - t0;
  const reach = ep(u, 0.4, 2.2);
  const cam: Cam = {x: 40, y: -150, z: 2.8};
  const ax = HINGE_X, ay = -110;
  const tipX = lerp(ax + 24, ax + 70, reach), tipY = lerp(ay, -230, reach);
  const no = ep(t, wt('b5', 'doesnt') - 0.1, wt('b5', 'doesnt') + 0.3);
  return (
    <Frame>
      <g style={{filter: `grayscale(${0.3 + 0.5 * no})`}}>
        <Sky kind="day" />
        <World cam={cam}>
          <Ground light="day" />
          <Tower light="day" carY={-110} openNear={70} openFar={70} showMount />
          <path d={`M${ax} ${ay} L${tipX} ${tipY} L${tipX + 1} ${tipY + 3} L${ax} ${ay + 3} Z`} fill="#58646f" stroke={C.ink} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          <path d={`M${tipX} ${tipY} l 6 -6 M${tipX} ${tipY} l 8 2`} stroke={C.ink} strokeWidth={4} vectorEffect="non-scaling-stroke" />
          <g transform={`translate(${tipX + 14} ${tipY - 20 + 30 * (1 - reach)}) rotate(14)`}>
            <Booster t={t} />
          </g>
        </World>
      </g>
      <g opacity={no}>
        <rect x={560} y={400} width={800} height={150} rx={20} fill={C.red} stroke={C.ink} strokeWidth={6} transform={`rotate(-6 960 475)`} />
        <text x={960} y={505} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={84} fill={C.cream} transform={`rotate(-6 960 475)`}>NOT LIKE THIS</text>
      </g>
      <Chip text="WRONG · CARTOON MYTH" x={44} y={1036} accent={C.red} o={ep(u, 0.3, 0.6)} />
    </Frame>
  );
};

/** The catch: booster flies itself between the arms; the arms close; load points settle on the rails. Plan inset. */
const B6: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b6');
  const u = t - t0;
  const tClose = wt('b6', 'arms', 1) - 0.1;
  const tSettle = wt('b6', 'settles');
  const open = keys(t, [[t0, 50], [tClose, 46], [tClose + 1.6, 7]]);
  const gap = keys(t, [[t0, 26], [tClose, 9], [tSettle + 1.6, 0]], (x) => 1 - Math.pow(1 - x, 2.2));
  const s: CatchState = {gap, open, engines: gap > 0.6 ? 0.85 : Math.max(0, 0.85 - (tSettle + 1.6 - t) * -2), plumeLen: 6};
  const rail = -80;
  const cam: Cam = {x: VEH_X - 4, y: rail + 12 - gap * 0.3, z: 9.0 + u * 0.12};
  const pin = [sx(cam, VEH_X + 3.4), sy(cam, rail - gap)];
  return (
    <Frame>
      <BoosterCatch t={t} cam={cam} light="day" s={s} carY={rail} catchHighlight={ep(t, wt('b6', 'load') - 0.2, wt('b6', 'load') + 0.3)} />
      <Callout text="CHOPSTICKS" sub="two arms on the tower" x={170} y={sy(cam, rail) - 200} to={[sx(cam, HINGE_X + 6), sy(cam, rail) + 6]} o={ep(t, wt('b6', 'chopsticks') - 0.2, wt('b6', 'chopsticks') + 0.3)} size={34} />
      <Callout text="LOAD POINTS" sub="on V3: built into the grid fins" x={pin[0] + 160} y={pin[1] - 170} to={[pin[0] + 10, pin[1] - 4]} o={ep(t, wt('b6', 'load') - 0.1, wt('b6', 'load') + 0.4)} size={32} />
      {/* plan inset */}
      <g transform="translate(1560 820)">
        <circle r={170} fill="rgba(20,25,31,0.85)" stroke={C.cream} strokeWidth={3} />
        <g transform={`scale(5.4) translate(${-VEH_X + 4} 0)`}>
          <PlanView openNear={open} openFar={open} vx={VEH_X} vz={0} dark highlightContact={ep(t, tSettle, tSettle + 0.5)} />
        </g>
        <text y={150} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={18} fill={C.cream}>VIEW FROM ABOVE</text>
      </g>
      <Chip text="ILLUSTRATION · SUPER HEAVY V3 CATCH" x={44} y={1036} />
    </Frame>
  );
};

/** Contact close-up: the whole booster weight hangs on a few points. */
const B7: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b7');
  const u = t - t0;
  const rail = -80;
  const cam: Cam = {x: VEH_X + 3.4, y: rail - 1.5, z: 70 - u * 1.5};
  const pin = [sx(cam, VEH_X + 3.4), sy(cam, rail)];
  const w = ep(t, wt('b7', 'weight') - 0.2, wt('b7', 'weight') + 0.5);
  return (
    <Frame>
      <BoosterCatch t={t} cam={cam} light="day" s={{gap: 0, open: 6}} carY={rail} clouds={false} />
      <g opacity={w}>
        <path d={`M${pin[0] - 120} ${pin[1] - 360} L${pin[0] - 120} ${pin[1] - 120}`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
        <path d={`M${pin[0] - 120} ${pin[1] - 360} L${pin[0] - 120} ${pin[1] - 120}`} stroke={C.orange} strokeWidth={12} strokeLinecap="round" />
        <path d={`M${pin[0] - 155} ${pin[1] - 150} L${pin[0] - 120} ${pin[1] - 100} L${pin[0] - 85} ${pin[1] - 150} Z`} fill={C.orange} stroke={C.ink} strokeWidth={5} />
        <circle cx={pin[0]} cy={pin[1] - 8} r={60} fill="none" stroke={C.yellow} strokeWidth={7} />
      </g>
      <Callout text="THE WHOLE WEIGHT" sub="rests on a few small contact points" x={pin[0] + 120} y={pin[1] - 330} o={w} size={36} />
      <Chip text="ILLUSTRATION · CLOSE-UP OF CATCH POINT ON THE ARM" x={44} y={1036} />
    </Frame>
  );
};

/** History: booster catches so far. */
const B8: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b8');
  const u = t - t0;
  const items = [
    {y: 'OCT 2024', f: 'FLIGHT 5', note: 'first catch'},
    {y: 'JAN 2025', f: 'FLIGHT 7', note: 'caught again'},
    {y: 'MAR 2025', f: 'FLIGHT 8', note: 'caught again'},
  ];
  return (
    <Frame bg="#f3ead6">
      <rect width={1920} height={1080} fill="#f3ead6" />
      <line x1={220} x2={1700} y1={640} y2={640} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      {items.map((it, i) => {
        const o = ep(u, 0.3 + i * 0.7, 0.8 + i * 0.7);
        const x = 420 + i * 520;
        return (
          <g key={i} opacity={o} transform={`translate(${x} 640)`}>
            <circle r={18} fill={C.teal} stroke={C.ink} strokeWidth={5} />
            <g transform="translate(0 -60) scale(3.2)">
              <Booster t={t} version="v1" />
            </g>
            <text y={80} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={44} fill={C.ink}>{it.y}</text>
            <text y={120} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={26} fill="#55606b">{it.f} · {it.note}</text>
          </g>
        );
      })}
      <Chip text="BOOSTER CATCHES (EARLIER-GENERATION BOOSTERS)" x={44} y={1036} accent={C.teal} />
    </Frame>
  );
};

/** V2 → V3 booster changes (SpaceX V3 update, May 2026). */
const B9: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b9');
  const u = t - t0;
  const right = ep(t, wt('b9', 'three') - 0.4, wt('b9', 'three') + 0.3);
  const pts = ep(t, wt('b9', 'catch') - 0.2, wt('b9', 'catch') + 0.4);
  const camZ = 15;
  const top = (x: number, v: 'v1' | 'v3', hl: number) => (
    <g transform={`translate(${x} ${1000}) scale(${camZ}) translate(0 ${v === 'v3' ? 30 : 28})`}>
      <Booster t={t} version={v} catchHighlight={hl} elev={20} finClock={8 * Math.sin(u * 0.5)} />
    </g>
  );
  return (
    <Frame bg="#dfe9f1">
      <Sky kind="day" />
      <defs>
        <clipPath id="b9clip"><rect x={0} y={0} width={1920} height={1080} /></clipPath>
      </defs>
      <g clipPath="url(#b9clip)">
        {top(520, 'v1', 0)}
        <g opacity={right}>{top(1400, 'v3', pts)}</g>
      </g>
      <Callout text="EARLIER BOOSTERS" sub="4 grid fins + separate catch pins" x={330} y={110} o={ep(u, 0.2, 0.6)} size={32} />
      <Callout text="VERSION 3" sub="3 grid fins, ~50% larger, mounted lower" x={1120} y={110} o={right} size={32} />
      <Callout text="catch points on the fins" x={1200} y={650} o={pts} size={28} />
      {/* plan rings */}
      {[[520, 4, [45, 135, 225, 315]], [1400, 3, [30, 150, 270]]].map(([x, n, fins], i) => (
        <g key={i} transform={`translate(${(x as number) + 290} 860) scale(9)`} opacity={i ? right : ep(u, 0.4, 0.8)}>
          <VehiclePlan fins={fins as number[]} finSpan={i ? 4.8 : 3.4} hl={i ? pts : 0} />
        </g>
      ))}
      <Chip text="SPACEX STARSHIP V3 UPDATE · MAY 2026 · ILLUSTRATION" x={44} y={1036} accent={C.teal} />
    </Frame>
  );
};

/** Shorter arms on the new tower, swinging fast to track an incoming vehicle. */
const B10: React.FC<{t: number}> = ({t}) => {
  const t0 = ls('b10');
  const u = t - t0;
  const cam: Cam = {x: HINGE_X + 12, y: -88, z: 18};
  const swing = 25 + 22 * Math.sin(u * 2.4);
  const g = ep(u, 0.4, 1.0) * (1 - ep(u, 3.4, 4.0));
  return (
    <Frame>
      <Sky kind="dusk" />
      <World cam={cam}>
        <Ground light="dusk" />
        <Tower light="dusk" carY={-88} openNear={u > 2.2 ? swing : 0} openFar={u > 2.2 ? swing : 0} ghostOldArms={g} showMount={false} />
      </World>
      <Callout text="SHORTER ARMS" sub="new tower · move faster" x={1120} y={760} o={ep(u, 0.2, 0.6)} size={36} />
      <Callout text="earlier, longer arms" x={1250} y={300} o={g} size={26} dark />
      <Chip text="ILLUSTRATION · EXACT ARM LENGTHS NOT PUBLISHED" x={44} y={1036} />
    </Frame>
  );
};

export const boosterShots = (): Shot[] => [
  {id: 'B1', a: ls('b1') - 0.2, b: ls('b2'), render: (t) => <B1 t={t} />, tin: 'dip'},
  {id: 'B2', a: ls('b2'), b: wt('b2', 'It', 0) - 0.3, render: (t) => <B2 t={t} />, tin: 'cut'},
  {id: 'B2d', a: wt('b2', 'It', 0) - 0.3, b: ls('b3'), render: (t) => <B2d t={t} />, tin: 'fade'},
  {id: 'B3', a: ls('b3'), b: ls('b4'), render: (t) => <B3 t={t} />, tin: 'whipU'},
  {id: 'B4', a: ls('b4'), b: ls('b5'), render: (t) => <B4 t={t} />, tin: 'fade'},
  {id: 'B5', a: ls('b5'), b: ls('b6'), render: (t) => <B5 t={t} />, tin: 'cut'},
  {id: 'B6', a: ls('b6'), b: ls('b7'), render: (t) => <B6 t={t} />, tin: 'flash'},
  {id: 'B7', a: ls('b7'), b: ls('b8'), render: (t) => <B7 t={t} />, tin: 'fade'},
  {id: 'B8', a: ls('b8'), b: ls('b9'), render: (t) => <B8 t={t} />, tin: 'whipL'},
  {id: 'B9', a: ls('b9'), b: ls('b10'), render: (t) => <B9 t={t} />, tin: 'whipL'},
  {id: 'B10', a: ls('b10'), b: ls('c1'), render: (t) => <B10 t={t} />, tin: 'fade'},
];
void Plume; void ARM_LEN; void ARM_OLD_LEN; void prog; void noise; void Mark; void CloudField; void Shore; void Ship;

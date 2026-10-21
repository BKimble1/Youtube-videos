// Hook (S0) and "Two vehicles, two returns" (S1).
import React from 'react';
import {keys, ep, prog, clamp, lerp, fadeWin, smoother} from '../../kit/anim';
import {Cam3, proj} from '../cam3';
import {ArmState, MOUNT_TOP, Place, VX, azFor, RAIL_DY} from '../site';
import {Booster, Ship, Stack, BOOSTER_LEN} from '../vehicles';
import {Clouds, Credit, Frame, Limb, Sky, Tag, Word} from '../scene';
import {F5, Footage, Shot} from '../timeline';
import {CatchView, InFlight, ShipAt, BoosterAt, Streaks, approach, throttle, localToScreen} from './common';
import {le, ls, ss, wt} from '../time';

const CAR_SHIP = 96;

/** A glowing rim around a vehicle silhouette while it is being named. */
const Rim: React.FC<{k: number; children: React.ReactNode}> = ({k, children}) =>
  k <= 0.01 ? <>{children}</> : <g style={{filter: `drop-shadow(0 0 ${6 * k}px rgba(255,201,60,${0.95 * k})) drop-shadow(0 0 ${2 * k}px rgba(255,201,60,${k}))`}}>{children}</g>;

/** Sky shot of the ship in reentry → flip → upright, camera following. u: 0..1 through the manoeuvre. */
export const ShipReturnSky: React.FC<{t: number; u: number; z: number; x: number; y: number; light: 'high' | 'dusk' | 'day'; heatK?: number}> = ({t, u, z, x, y, light, heatK = 1}) => {
  // u 0..0.45 plasma broadside, 0.45..0.6 subsonic belly-flop, 0.6..1 flip to upright with sea-level engines
  const heat = heatK * (1 - prog(u, 0.3, 0.5));
  const rot = lerp(-90, 0, smoother(prog(u, 0.6, 0.95)));
  const az = lerp(52, 90, smoother(prog(u, 0.1, 0.55)));
  const eng = prog(u, 0.58, 0.64);
  const flap = 10 + 25 * Math.sin(t * 3) * (1 - prog(u, 0.6, 0.7));
  return (
    <>
      <Streaks t={t} dir={[0.35, -1]} k={0.7} color={light === 'high' ? 'rgba(255,190,150,0.3)' : 'rgba(255,255,255,0.35)'} />
      <InFlight x={x} y={y} rot={rot} z={z}>
        <g transform="translate(0 26)">
          <Ship az={az} heat={heat} t={t} pal={light === 'high' ? 'space' : light === 'dusk' ? 'dusk' : 'day'} engines={eng} flapFwd={flap} flapAft={flap * 0.7} id="hookret" plumeLen={22} />
        </g>
      </InFlight>
    </>
  );
};

export const s0s1Shots = (): Shot[] => {
  const tBooster = wt('S0_01', 'booster');
  const tCraft = wt('S0_01', 'spacecraft');
  const tOrbit = wt('S0_01', 'orbit');
  const tWrong = wt('S0_02', 'wrong');
  const tRisk = wt('S0_02', 'risk');
  const s1 = ss('S1');
  const shots: Shot[] = [];

  // H1 — real catch, frame zero
  shots.push({
    id: 'H1_real', a: 0, b: 3.4,
    render: (t) => (
      <Footage file={F5} a={0} src0={4.4} scale={1.12} cx={0.42} cy={0.42}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, 0.4, 3.3, 0.3)} />
        </svg>
      </Footage>
    ),
  });

  // H2 — column wipe into the drawn stack at dusk (same palette as the footage); booster, then ship lit as named
  shots.push({
    id: 'H2_stack', a: 3.4, b: tOrbit - 0.15, tin: 'column',
    render: (t) => {
      const u = prog(t, 3.4, tOrbit);
      const c: Cam3 = {at: [14, keys(t, [[3.4, 46], [tCraft - 0.2, 46], [tCraft + 0.6, 98]]), 0], z: lerp(7.6, 8.4, u), yaw: -14, pitch: 2};
      const kb = fadeWin(t, Math.max(3.45, tBooster - 0.2), tCraft + 0.1, 0.25);
      const ks = fadeWin(t, tCraft, tOrbit + 1, 0.25);
      const s: ArmState = {carY: 112, open: 38};
      return (
        <CatchView t={t} c={c} l="dusk" s={s} sun={[1650, 820]}
          vehicle={
            <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}>
              <Rim k={kb}><Booster az={azFor(c, 0)} pal="dusk" t={t} id="h2b" /></Rim>
              <g transform={`translate(0 ${-BOOSTER_LEN})`}>
                <Rim k={ks}><Ship az={azFor(c, 90)} pal="dusk" t={t} id="h2s" /></Rim>
              </g>
            </Place>
          }
        />
      );
    },
  });

  // H3 — fast illustrated reentry → flip, no exposition
  const h3a = tOrbit - 0.15, h3b = tWrong + 0.55;
  shots.push({
    id: 'H3_return', a: h3a, b: h3b, tin: 'cut',
    render: (t) => {
      const u = prog(t, h3a, h3b);
      const sky = u < 0.45 ? 'high' : 'dusk';
      return (
        <Frame>
          <Sky k="high" />
          <g opacity={smoother(prog(u, 0.35, 0.6))}><Sky k="dusk" /></g>
          <Clouds n={9} seed={5} y0={200} y1={1000} dy={-t * 420} dx={t * 60} s={1.1} tint="#f2c3aa" o={prog(u, 0.4, 0.6) * 0.8} />
          <ShipReturnSky t={t} u={u} z={lerp(12, 15, u)} x={lerp(980, 940, u)} y={540} light={sky === 'high' ? 'high' : 'dusk'} />
        </Frame>
      );
    },
  });

  // H4 — close on the receiving arms as the ship comes down; pull down the tower to what is at stake
  const h4a = h3b, h4b = s1 - 0.05;
  shots.push({
    id: 'H4_arms', a: h4a, b: h4b, tin: 'cut',
    render: (t) => {
      const above = lerp(26, 4.5, ep(t, h4a, tRisk - 0.3));
      const pull = ep(t, tRisk - 0.9, h4b - 0.2);
      const c: Cam3 = {at: [lerp(17, 8, pull), lerp(CAR_SHIP + 2, 30, pull), 0], z: lerp(15, 5.2, pull), yaw: lerp(20, 8, pull), pitch: lerp(-4, 6, pull)};
      const s: ArmState = {carY: CAR_SHIP, open: lerp(24, 9, ep(t, h4a, tRisk))};
      return (
        <CatchView t={t} c={c} l="dusk" s={s} hiRail={fadeWin(t, h4a + 0.2, tRisk, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR_SHIP} above={above} l="dusk" heading={110} props={{engines: 0.85, t, id: 'h4s', fittings: 0}} />}
        />
      );
    },
  });

  // ---------------- S1 ----------------
  const tSH = ls('S1_00'), tSS = ls('S1_01'), tLaunch = ls('S1_02'), tTrips = wt('S1_02', 'trips');
  const tTurns = wt('S1_03', 'turns'), tKeeps = wt('S1_03', 'keeps');
  const tOct = ls('S1_04'), tArms = wt('S1_04', 'arms');
  const tNow = ls('S1_05'), tBoth = wt('S1_05', 'both'), tTwo = wt('S1_05', 'two'), tSep = wt('S1_05', 'separated');
  const tNew = ls('S1_06'), tUp = wt('S1_06', 'upright'), tDeliv = wt('S1_06', 'delivering');
  const tSite = ls('S1_07');

  // A1 — big daylight establishing view of launcher and catcher; names on the words
  shots.push({
    id: 'A1_establish', a: s1 - 0.05, b: tLaunch - 0.1, tin: 'dip', td: 0.5,
    render: (t) => {
      const u = prog(t, s1, tLaunch);
      const c: Cam3 = {at: [lerp(8, 16, u), keys(t, [[s1, 50], [tSS - 0.2, 54], [tSS + 1.0, 84]]), 0], z: lerp(7.2, 7.8, u), yaw: lerp(32, 20, u), pitch: 5};
      const s: ArmState = {carY: 112, open: 40};
      const base = c;
      const bl = fadeWin(t, tSH + 0.1, tLaunch, 0.3), sl = fadeWin(t, tSS + 0.05, tLaunch, 0.3);
      return (
        <CatchView t={t} c={c} l="day" s={s}
          vehicle={
            <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}>
              <Stack az={azFor(base, 70)} t={t} pal="day" id="a1" />
            </Place>
          }
          overlay={
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              {(() => {
                const b = proj(c, [VX + 4.5, MOUNT_TOP + 40, 0]), sh = proj(c, [VX + 4.5, MOUNT_TOP + BOOSTER_LEN + 22, 0]);
                return (
                  <>
                    <Tag text="SUPER HEAVY" x={b[0] + 150} y={b[1]} to={[b[0] + 8, b[1]]} o={bl} size={38} />
                    <Tag text="STARSHIP" x={sh[0] + 150} y={sh[1]} to={[sh[0] + 8, sh[1]]} o={sl} size={38} />
                  </>
                );
              })()}
            </svg>
          }
        />
      );
    },
  });

  // A2 — launch together, hot staging, booster turns back, ship keeps going
  shots.push({
    id: 'A2_trips', a: tLaunch - 0.1, b: tOct - 0.2, tin: 'cut',
    render: (t) => {
      const sep = tTrips - 0.25;
      const climb = (t - (tLaunch - 0.1)) * 1;
      const ds = Math.max(0, t - sep);
      // positions in screen px (camera tracking the stack, then widening)
      const z = lerp(9, 4.2, ep(t, sep, tKeeps));
      const shipX = 960 + ds * ds * 30 + ds * 90, shipY = 470 - ds * 190 - ds * ds * 10;
      const boosterRot = -lerp(0, 160, ep(t, sep + 0.3, tTurns + 0.4));
      const bX = 930 - ds * 110 - Math.max(0, t - tTurns) * 120, bY = 600 + BOOSTER_LEN * z * 0.5 + ds * 90;
      const boost = clamp(prog(t, tTurns - 0.1, tTurns + 0.2)) * (1 - prog(t, tKeeps + 0.4, tKeeps + 0.8));
      return (
        <Frame>
          <Sky k="high" horizon={0.95} />
          <Clouds n={10} seed={8} y0={-200} y1={1200} dy={climb * 500 + ds * 300} s={0.9} o={0.55 * (1 - prog(t, sep, sep + 2))} />
          <Streaks t={t} dir={[0, 1]} k={0.5 * (1 - prog(t, sep + 1, sep + 2.5))} />
          {t < sep ? (
            <InFlight x={960} y={560 + 52 * z * 0.4} rot={0} z={z}>
              <g transform={`translate(0 ${BOOSTER_LEN * 0.35})`}>
                <Stack az={70} t={t} pal="day" engines={1} id="a2" />
              </g>
            </InFlight>
          ) : (
            <>
              <InFlight x={bX} y={bY} rot={boosterRot} z={z}>
                <g transform={`translate(0 ${BOOSTER_LEN * 0.5})`}>
                  <Booster az={70} t={t} pal="day" engines={boost} plumeLen={30} id="a2b" />
                </g>
              </InFlight>
              <InFlight x={shipX} y={shipY} rot={lerp(0, 28, ep(t, sep, tKeeps))} z={z}>
                <g transform="translate(0 26)">
                  <Ship az={80} t={t} pal="day" engines={clamp(prog(t, sep - 0.05, sep + 0.15))} plumeLen={36} id="a2s" />
                </g>
              </InFlight>
              {/* hot-staging flash */}
              <circle cx={960} cy={560} r={lerp(20, 220, prog(t, sep, sep + 0.5))} fill="url(#glowWarm)" opacity={1 - prog(t, sep, sep + 0.7)} />
            </>
          )}
        </Frame>
      );
    },
  });

  // A3 — October 2024: a Flight 5-era booster (four fins, separate pins) settles into the arms at dusk
  shots.push({
    id: 'A3_oct2024', a: tOct - 0.2, b: tNow - 0.25, tin: 'fade', td: 0.4,
    render: (t) => {
      const car = 104;
      const above = approach(t, tOct - 0.2, tArms + 0.15, 40);
      const c: Cam3 = {at: [lerp(14, 16, prog(t, tOct, tNow)), lerp(86, 80, prog(t, tOct, tNow)), 0], z: lerp(8.2, 8.8, prog(t, tOct, tNow)), yaw: -16, pitch: 1};
      const s: ArmState = {carY: car, open: lerp(20, 5, ep(t, tOct, tArms))};
      return (
        <CatchView t={t} c={c} l="dusk" s={s} sun={[1500, 700]}
          vehicle={<BoosterAt c={c} carY={car} above={above} v="v1" l="dusk" heading={45} props={{engines: throttle(t, tOct - 0.2, tArms + 0.15, 0.8), t, plumeLen: 34, id: 'a3b'}} />}
          overlay={
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <Word text="OCT 2024" x={110} y={150} anchor="start" size={64} color="#fbf4e4" o={fadeWin(t, tOct, tNow - 0.3, 0.3)} />
            </svg>
          }
        />
      );
    },
  });

  // A4 — Flight 15 plan: two catches in one mission, separated by the ship's flight (one drawn mission profile)
  shots.push({
    id: 'A4_plan', a: tNow - 0.25, b: tNew - 0.2, tin: 'dip', td: 0.45,
    render: (t) => {
      const base: [number, number] = [430, 930]; // tower foot
      const top: [number, number] = [base[0] + 70, base[1] - 300]; // arm tip / catch point
      const k1 = ep(t, tBoth - 0.3, tTwo + 0.2);
      const kOut = ep(t, tNow + 0.1, tSep - 0.2);
      const k2 = ep(t, tSep - 0.1, tNew - 0.35);
      const bArc = (u: number): [number, number] => [top[0] + Math.sin(u * Math.PI) * 420, top[1] - Math.sin(u * Math.PI) * 420 - (1 - u) * 0];
      const sOut = (u: number): [number, number] => [top[0] + u * 1500, top[1] - Math.pow(u, 0.55) * 520];
      const sIn = (u: number): [number, number] => [lerp(-160, top[0], u), lerp(130, top[1] - 40, Math.pow(u, 1.5))];
      const path = (f: (u: number) => [number, number], k: number) => Array.from({length: 48}, (_, i) => f((i / 47) * k)).map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
      const bp = bArc(k1), so = sOut(kOut), si = sIn(k2);
      const dash = {fill: 'none', strokeWidth: 9, strokeDasharray: '3 20', strokeLinecap: 'round' as const};
      return (
        <Frame>
          <Sky k="gulf" horizon={0.86} />
          <Limb top={960} r={12000} glow={0.6} />
          <rect x={0} y={952} width={1920} height={16} fill="#d3c7a3" />
          {/* tower with its arms (simplified side elevation of the same tower) */}
          <g>
            <rect x={base[0] - 26} y={base[1] - 420} width={52} height={420} fill="#38424d" />
            {Array.from({length: 14}, (_, i) => <path key={i} d={`M${base[0] - 26} ${base[1] - i * 30} L${base[0] + 26} ${base[1] - i * 30 - 30} M${base[0] + 26} ${base[1] - i * 30} L${base[0] - 26} ${base[1] - i * 30 - 30}`} stroke="#5b6875" strokeWidth={4} />)}
            <rect x={base[0] + 26} y={top[1] - 6} width={110} height={20} fill="#46525e" stroke="#1c232b" strokeWidth={3} />
          </g>
          <polyline points={path(bArc, k1)} stroke="#ffc93c" {...dash} />
          <polyline points={path(sOut, kOut)} stroke="#fbf4e4" {...dash} />
          {k2 > 0 ? <polyline points={path(sIn, k2)} stroke="#fbf4e4" {...dash} /> : null}
          {k1 > 0.02 && k1 < 0.99 ? <InFlight x={bp[0]} y={bp[1]} rot={lerp(10, 175, k1) * (k1 < 0.5 ? 1 : 1)} z={3.2}><g transform="translate(0 36)"><Booster az={60} pal="day" id="a4b" engines={k1 > 0.85 ? 1 : 0} plumeLen={18} /></g></InFlight> : null}
          {k1 >= 0.99 ? <InFlight x={top[0] + 60} y={top[1] + 64 * 3.2 - 10} rot={0} z={3.2}><Booster az={60} pal="day" id="a4b2" /></InFlight> : null}
          {kOut > 0.02 && kOut < 0.97 && k2 <= 0 ? <InFlight x={so[0]} y={so[1]} rot={lerp(20, 75, kOut)} z={3.6}><g transform="translate(0 26)"><Ship az={70} pal="day" engines={0.9} t={t} id="a4s" plumeLen={20} /></g></InFlight> : null}
          {k2 > 0.02 ? <InFlight x={si[0]} y={si[1]} rot={lerp(-90, 0, prog(k2, 0.65, 1))} z={3.6}><g transform="translate(0 26)"><Ship az={70} pal="day" heat={1 - prog(k2, 0.15, 0.5)} engines={prog(k2, 0.7, 0.8)} t={t} id="a4s2" plumeLen={16} /></g></InFlight> : null}
          <Word text="FLIGHT 15" x={1820} y={140} anchor="end" size={64} color="#fbf4e4" o={fadeWin(t, tNow, tNew, 0.3)} />
          <Word text="1" x={top[0] + 250} y={top[1] - 60} size={140} o={prog(t, tTwo - 0.2, tTwo + 0.1)} />
          <Word text="2" x={top[0] - 220} y={top[1] - 60} size={140} o={prog(t, tNew - 0.9, tNew - 0.6)} />
        </Frame>
      );
    },
  });

  // A5 — the new challenge: back through the atmosphere, turned upright, delivered to the waiting machinery
  const a5a = tNew - 0.2, a5flip = tUp - 0.4, a5c = tDeliv - 0.15;
  shots.push({
    id: 'A5_challenge', a: a5a, b: a5c, tin: 'cut',
    render: (t) => {
      const u = prog(t, a5a, a5c);
      return (
        <Frame>
          <Sky k="high" />
          <g opacity={smoother(prog(t, a5flip - 0.8, a5flip))}><Sky k="day" /></g>
          <Limb top={lerp(760, 1500, prog(t, a5a, a5flip))} r={7000} glow={0.8} />
          <Clouds n={9} seed={11} y0={300} y1={1100} dy={-t * 380} s={1.2} o={prog(t, a5flip - 0.6, a5flip) * 0.85} />
          <ShipReturnSky t={t} u={lerp(0.1, 0.98, u)} z={11} x={960} y={520} light={t < a5flip - 0.4 ? 'high' : 'day'} />
        </Frame>
      );
    },
  });
  shots.push({
    id: 'A5_arms', a: a5c, b: tSite - 0.1, tin: 'cut',
    render: (t) => {
      const above = lerp(44, 6, ep(t, a5c, tSite));
      const c: Cam3 = {at: [lerp(8, 14, prog(t, a5c, tSite)), 106, 0], z: 6.5, yaw: -26, pitch: -3};
      const s: ArmState = {carY: CAR_SHIP, open: lerp(30, 12, ep(t, a5c, tSite))};
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tDeliv + 0.3, tSite + 0.5, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR_SHIP} above={above} l="day" heading={90} props={{engines: 0.9, t, id: 'a5s'}} />}
        />
      );
    },
  });

  // A6 — the launch site is part of the landing system: wide site, arms and mount lit together
  shots.push({
    id: 'A6_site', a: tSite - 0.1, b: ss('S2') - 1.3, tin: 'fade', td: 0.4,
    render: (t) => {
      const u = prog(t, tSite - 0.1, ss('S2') - 1.3);
      const c: Cam3 = {at: [lerp(-6, 0, u), 52, 0], z: lerp(4.4, 4.0, u), yaw: lerp(-38, -30, u), pitch: 9};
      const s: ArmState = {carY: 108, open: 36};
      const k = fadeWin(t, tSite + 0.4, ss('S2') - 1.0, 0.3);
      return <CatchView t={t} c={c} l="dusk" s={s} hiRail={k} hiCarriage={k} sun={[1450, 640]} />;
    },
  });
  return shots;
};

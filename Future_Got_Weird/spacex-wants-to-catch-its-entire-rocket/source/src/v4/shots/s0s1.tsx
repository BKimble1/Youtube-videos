// V3 — Hook (S0) and "Two vehicles, two returns" (S1).
// Hook: real catch → drawn stage identity → real reentry → planned approach → real pad stakes.
// S1: real launch (04) names the stages, real separation (05) splits the journeys and hands the falling booster to the
// drawn return arc; the Flight 15 plan follows one vehicle at a time; the real pad (06) is the machinery on the ground.
import React from 'react';
import {keys, ep, prog, clamp, lerp, fadeWin, smoother} from '../../kit/anim';
import {Cam3, proj} from '../cam3';
import {ArmState, MOUNT_TOP, Place, VX, azFor} from '../site';
import {Booster, Ship, Stack, BOOSTER_LEN} from '../vehicles';
import {Clouds, Credit, Frame, Limb, Sky, Tag, Word} from '../scene';
import {F5, F14L, F14R, F14S, PAD06, Footage, Shot, TELEM_CROP} from '../timeline';
import {CatchView, InFlight, ShipAt, BoosterAt, Streaks, approach, throttle} from './common';
import {ls, ss, wt} from '../time';

const CAR_SHIP = 96;
const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;

/** A thin warm rim around a vehicle while it is named (no ghosting, no blend with other shots). */
const Rim: React.FC<{k: number; children: React.ReactNode}> = ({k, children}) =>
  k <= 0.01 ? <>{children}</> : <g style={{filter: `drop-shadow(0 0 ${5 * k}px rgba(233,185,73,${0.9 * k}))`}}>{children}</g>;

/** Sky shot of the ship: reentry → belly-flop → flip to upright, camera following. u: 0..1 through the manoeuvre. */
export const ShipReturnSky: React.FC<{t: number; u: number; z: number; x: number; y: number; light: 'high' | 'dusk' | 'day'; heatK?: number}> = ({t, u, z, x, y, light, heatK = 1}) => {
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
  const tAfter = wt('S0_01', 'after');
  const tAnd = ls('S0_02');
  const tRocket = wt('S0_02', 'rocket');
  const s1 = ss('S1');
  const shots: Shot[] = [];

  // H1 — real catch at frame zero
  shots.push({
    id: 'H1_real', a: 0, b: 3.4,
    render: (t) => <Footage file={F5} a={0} src0={4.4} scale={1.12} cx={0.42} cy={0.42}>{svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, 0.4, 3.3, 0.3)} />)}</Footage>,
  });

  // H2 — tower-column wipe on the real tower's position into the drawn stack; booster, then ship, as each is named.
  // Camera rides up the stack (no hold on a distant view).
  const h3a = tAfter - 0.05;
  shots.push({
    id: 'H2_stack', a: 3.4, b: h3a, tin: 'column',
    render: (t) => {
      const c: Cam3 = {at: [16, keys(t, [[3.4, 44], [tCraft - 0.15, 52], [tCraft + 0.5, 100]]), 0], z: 9.2, yaw: -14, pitch: 2};
      const kb = fadeWin(t, Math.max(3.45, tBooster - 0.1), tCraft + 0.15, 0.2);
      const ks = fadeWin(t, tCraft, h3a + 0.5, 0.2);
      return (
        <CatchView t={t} c={c} l="dusk" s={{carY: 112, open: 38}} sun={[1650, 820]}
          vehicle={
            <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}>
              <Rim k={kb}><Booster az={azFor(c, 0)} pal="dusk" t={t} id="h2b" /></Rim>
              <g transform={`translate(0 ${-BOOSTER_LEN})`}><Rim k={ks}><Ship az={azFor(c, -160)} pal="dusk" t={t} id="h2s" /></Rim></g>
            </Place>
          }
        />
      );
    },
  });

  // H3 — "after it comes back from orbit": real plasma (tight crop, different framing from the later full view)
  const h4a = tAnd - 0.05;
  shots.push({
    id: 'H3_realReentry', a: h3a, b: h4a, tin: 'cut',
    render: (t) => <Footage file={F14R} a={h3a} src0={12.8} scale={1.55} cx={0.82} cy={0.25}>{svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, h3a + 0.15, h4a, 0.2)} />)}</Footage>,
  });

  // H4 — the planned approach: ship upright on its engines coming down to the open arms (outcome held for later)
  const h5a = tRocket - 0.25;
  shots.push({
    id: 'H4_approach', a: h4a, b: h5a, tin: 'cut',
    render: (t) => {
      const above = lerp(30, 9, ep(t, h4a, h5a + 0.6));
      const c: Cam3 = {at: [lerp(15, 18, prog(t, h4a, h5a)), lerp(CAR_SHIP + 12, CAR_SHIP + 4, prog(t, h4a, h5a)), 0], z: lerp(11, 13.5, prog(t, h4a, h5a)), yaw: 20, pitch: -3};
      const s: ArmState = {carY: CAR_SHIP, open: lerp(26, 12, ep(t, h4a, h5a))};
      return <CatchView t={t} c={c} l="dusk" s={s} vehicle={<ShipAt c={c} carY={CAR_SHIP} above={above} l="dusk" heading={110} props={{engines: 0.9, t, id: 'h4s', plumeLen: 26, flapFwd: 60, flapAft: 70}} />} />;
    },
  });

  // H5 — real stakes: the pad itself (Flight 14 liftoff from above: mount, tower, flame trench, tank farm)
  shots.push({
    id: 'H5_realPad', a: h5a, b: s1 - 0.1, tin: 'cut',
    render: (t) => <Footage file={F14L} a={h5a} src0={8.6} scale={TELEM_CROP} cx={0.5} cy={0}>{svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, h5a + 0.2, s1 - 0.1, 0.2)} />)}</Footage>,
  });

  // ---------------- S1 ----------------
  const tSH = ls('S1_00'), tSS = ls('S1_01'), tLaunch = ls('S1_02'), tTurns = wt('S1_03', 'turns');
  const tOct = ls('S1_04'), tArms = wt('S1_04', 'arms');
  const tNow = ls('S1_05'), tBoth = wt('S1_05', 'both'), tTwo = wt('S1_05', 'two'), tSep = wt('S1_05', 'separated');
  const tNew = ls('S1_06'), tUp = wt('S1_06', 'upright'), tDeliv = wt('S1_06', 'delivering');
  const tSite = ls('S1_07');

  // A1 — real liftoff: the whole stack on the pad; Super Heavy named
  const a1b = tSS - 0.15;
  shots.push({
    id: 'A1_realLiftoff', a: s1 - 0.1, b: a1b, tin: 'cut',
    render: (t) => (
      <Footage file={F14L} a={s1 - 0.1} src0={0.6} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(
          <>
            <Tag text="SUPER HEAVY" x={1210} y={720} to={[1000, 720]} o={fadeWin(t, tSH + 0.05, a1b, 0.2)} size={40} />
            <Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, s1, a1b, 0.2)} />
          </>,
        )}
      </Footage>
    ),
  });
  // A1b — looking down the climbing stack: the pointed spacecraft on top
  const a1cA = tLaunch - 0.05;
  shots.push({
    id: 'A1b_realShip', a: a1b, b: a1cA, tin: 'cut',
    render: (t) => (
      <Footage file={F14L} a={a1b} src0={3.55} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(<Tag text="STARSHIP" x={1230} y={250} to={[1010, 230]} o={fadeWin(t, tSS, a1cA, 0.2)} size={40} />)}
      </Footage>
    ),
  });
  // A1c — together over the coast
  const a2a = tTurns - 1.1;
  shots.push({
    id: 'A1c_realCoast', a: a1cA, b: a2a, tin: 'cut',
    render: () => <Footage file={F14L} a={a1cA} src0={14.0} scale={TELEM_CROP} cx={0.5} cy={0} />,
  });
  // A2 — real stage separation: hot-staging flash, the booster falls away below the ship
  const a2b = a2a + 3.2;
  shots.push({
    id: 'A2_realSeparation', a: a2a, b: a2b, tin: 'cut',
    render: (t) => <Footage file={F14S} a={a2a} src0={11.95} scale={TELEM_CROP} cx={0.5} cy={0}>{svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, a2a + 0.2, a2b, 0.2)} />)}</Footage>,
  });
  // A2b — the falling booster continues as a drawing: same lower-left pose, then it turns and burns back for the coast
  const a3a = tOct + 0.35;
  shots.push({
    id: 'A2b_boostback', a: a2b, b: a3a, tin: 'cut',
    render: (t) => {
      const u = ep(t, a2b, a3a, (v) => v);
      const rot = lerp(152, 330, smoother(prog(u, 0.05, 0.7)));
      const burn = prog(u, 0.55, 0.65);
      const x = lerp(560, 760, u), y = lerp(860, 600, smoother(u));
      const z = lerp(9.5, 5.2, u);
      return (
        <Frame>
          <Sky k="high" horizon={0.95} />
          <Limb top={lerp(980, 1060, u)} r={9000} glow={0.6} scroll={t * 60} />
          <InFlight x={x} y={y} rot={rot} z={z}>
            <g transform={`translate(0 ${BOOSTER_LEN / 2})`}><Booster az={70} pal="space" t={t} engines={burn} plumeLen={26} id="a2bb" /></g>
          </InFlight>
          <path d={`M ${x} ${y} Q ${x - 500} ${y - 340} ${x - 1100} ${y + 120}`} stroke="#e9b949" strokeWidth={6} strokeDasharray="3 16" strokeLinecap="round" fill="none" opacity={prog(u, 0.6, 0.85)} />
        </Frame>
      );
    },
  });

  // A3 — October 2024: a Flight 5-era booster (four fins, separate pins) settles into the arms at dusk — large
  shots.push({
    id: 'A3_oct2024', a: a3a, b: tNow - 0.25, tin: 'cut',
    render: (t) => {
      const car = 104;
      const above = approach(t, tOct - 0.6, tArms + 0.15, 34);
      const u = prog(t, a3a, tNow);
      const c: Cam3 = {at: [lerp(16, 18, u), lerp(84, 80, u), 0], z: lerp(9.0, 10.2, u), yaw: -16, pitch: 1};
      const s: ArmState = {carY: car, open: lerp(20, 5, ep(t, tOct, tArms))};
      return (
        <CatchView t={t} c={c} l="dusk" s={s} sun={[1500, 700]}
          vehicle={<BoosterAt c={c} carY={car} above={above} v="v1" l="dusk" heading={45} props={{engines: throttle(t, tOct - 0.6, tArms + 0.15, 0.8), t, plumeLen: 34, id: 'a3b'}} />}
          overlay={svg(<Word text="OCT 2024" x={110} y={150} anchor="start" size={64} color="#fbf4e4" o={fadeWin(t, a3a, tNow - 0.3, 0.3)} />)}
        />
      );
    },
  });

  // A4 — Flight 15 plan, following one vehicle at a time: (1) the booster comes home to the arms,
  // (2) the ship's flight carries on around the planet, (3) the ship comes back down to the same arms.
  const a4b = tTwo - 0.2, a4c = tSep - 0.1;
  shots.push({
    id: 'A4a_catch1', a: tNow - 0.25, b: a4b, tin: 'dip', td: 0.45,
    render: (t) => {
      const car = 100;
      const above = approach(t, tNow - 0.6, tBoth + 0.2, 26);
      const c: Cam3 = {at: [14, lerp(70, 76, prog(t, tNow, a4b)), 0], z: lerp(6.6, 7.4, prog(t, tNow, a4b)), yaw: -22, pitch: 3};
      const s: ArmState = {carY: car, open: lerp(18, 5, ep(t, tNow, tBoth))};
      return (
        <CatchView t={t} c={c} l="day" s={s}
          vehicle={<BoosterAt c={c} carY={car} above={above} v="v3" l="day" heading={0} props={{engines: throttle(t, tNow - 0.6, tBoth + 0.2, 0.6), t, plumeLen: 30, id: 'a4b'}} />}
          overlay={svg(
            <>
              <Word text="FLIGHT 15" x={110} y={150} anchor="start" size={60} color="#fbf4e4" o={fadeWin(t, tNow, a4b, 0.3)} />
              <Word text="CATCH 1 · BOOSTER" x={1810} y={150} anchor="end" size={60} o={fadeWin(t, tBoth + 0.1, a4b, 0.25)} />
            </>,
          )}
        />
      );
    },
  });
  shots.push({
    id: 'A4b_shipFlight', a: a4b, b: a4c, tin: 'cut',
    render: (t) => {
      const u = prog(t, a4b, a4c);
      return (
        <Frame>
          <Sky k="space" />
          <Limb top={lerp(820, 760, u)} r={5200} glow={1} scroll={t * 320} night={0.6 * Math.max(0, Math.sin(u * Math.PI))} />
          <InFlight x={lerp(700, 1220, u)} y={lerp(470, 440, u)} rot={90} z={13}>
            <g transform="translate(0 26)"><Ship az={150} pal="space" t={t} id="a4s" /></g>
          </InFlight>
          <Word text="THE SHIP'S FLIGHT" x={960} y={170} size={58} color="#fbf4e4" o={fadeWin(t, a4b + 0.1, a4c, 0.25)} />
        </Frame>
      );
    },
  });
  shots.push({
    id: 'A4c_catch2', a: a4c, b: tNew - 0.2, tin: 'cut',
    render: (t) => {
      const above = lerp(40, 10, ep(t, a4c, tNew + 0.4));
      const c: Cam3 = {at: [14, 98, 0], z: 7.2, yaw: -22, pitch: 2};
      const s: ArmState = {carY: CAR_SHIP, open: lerp(24, 12, ep(t, a4c, tNew))};
      return (
        <CatchView t={t} c={c} l="day" s={s}
          vehicle={<ShipAt c={c} carY={CAR_SHIP} above={above} l="day" heading={90} props={{engines: 0.9, t, id: 'a4c', plumeLen: 22, flapFwd: 60, flapAft: 70}} />}
          overlay={svg(<Word text="CATCH 2 · SHIP" x={1810} y={150} anchor="end" size={60} o={fadeWin(t, a4c + 0.1, tNew - 0.2, 0.25)} />)}
        />
      );
    },
  });

  // A5 — back through the atmosphere, turned upright (one continuous move)
  const a5a = tNew - 0.2, a5c = tDeliv - 0.1;
  shots.push({
    id: 'A5_challenge', a: a5a, b: a5c, tin: 'cut',
    render: (t) => {
      const u = prog(t, a5a, a5c);
      return (
        <Frame>
          <Sky k="high" />
          <g opacity={smoother(prog(t, tUp - 1.2, tUp - 0.4))}><Sky k="day" /></g>
          <Limb top={lerp(760, 1500, prog(t, a5a, tUp - 0.4))} r={7000} glow={0.8} />
          <Clouds n={9} seed={11} y0={300} y1={1100} dy={-t * 380} s={1.2} o={prog(t, tUp - 1.0, tUp - 0.4) * 0.85} />
          <ShipReturnSky t={t} u={lerp(0.1, 0.98, u)} z={lerp(11, 13, u)} x={960} y={520} light={t < tUp - 0.8 ? 'high' : 'day'} />
        </Frame>
      );
    },
  });
  // A5b — the machinery waiting on the ground: real Pad 2 with the stack on its mount
  const a6a = a5c + 2.36;
  shots.push({
    id: 'A5b_realPad', a: a5c, b: a6a, tin: 'cut',
    render: (t) => <Footage file={PAD06} a={a5c} src0={0} scale={1.04} cx={0.6} cy={0.5}>{svg(<Credit text="SpaceX · Critical Path, 2026" o={fadeWin(t, a5c + 0.2, a6a, 0.2)} />)}</Footage>,
  });
  // A6 — the same site drawn from the same side (tower right of centre, tank farm left), and the landing role of it lit
  shots.push({
    id: 'A6_site', a: a6a, b: ss('S2') - 1.05, tin: 'fade', td: 0.25,
    render: (t) => {
      const u = prog(t, a6a, ss('S2') - 1.05);
      const c: Cam3 = {at: [lerp(-14, -6, u), 58, 0], z: lerp(4.6, 4.9, u), yaw: lerp(18, 12, u), pitch: 6};
      const s: ArmState = {carY: 112, open: 40};
      const k = fadeWin(t, tSite + 0.3, ss('S2') - 0.8, 0.3);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={k} hiCarriage={k}
          vehicle={<Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Stack az={azFor(c, -178)} t={t} pal="day" id="a6st" /></Place>}
          overlay={svg(<Word text="LANDING SYSTEM" x={1810} y={150} anchor="end" size={60} color="#fbf4e4" o={k} />)}
        />
      );
    },
  });
  return shots;
};

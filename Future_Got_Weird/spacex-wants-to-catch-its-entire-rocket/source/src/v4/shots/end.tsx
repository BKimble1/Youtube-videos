// V4 approach decision (S7), reuse (S8), the final handoff (S9) and the two-space end screen.
import React from 'react';
import {ep, prog, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, V3, proj, scaleAt} from '../cam3';
import {ArmState, CAR_DEFAULT, MOUNT_TOP, Place, VX, RAIL_DY, TOWER_H, azFor} from '../site';
import {Booster, Ship} from '../vehicles';
import {Credit, Frame, Sky, Word} from '../scene';
import {F5, F14L, Footage, S40, Shot, TELEM_CROP} from '../timeline';
import {CatchView, InFlight, ShipAt, ShipWorld, BoosterAt, approach, throttle, shipRestY, boosterRestY, spline, splineZ} from './common';
import {Arrow} from './mech';
import {END_A, FILM_END, ls, wt} from '../time';
import {C, FONT} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = CAR_DEFAULT;

/** End-screen panel bounds (1920×1080). */
export const END_PANELS = [{x: 180, y: 360, w: 660, h: 371}, {x: 1080, y: 360, w: 660, h: 371}];

// ---- the approach corridor seen from the side (sea on the left, the pad on the right), one shared geometry ----
const CV: Cam3 = {at: [VX, 300, -640], z: 1.25, yaw: 90, pitch: -12};
const PATH0: V3 = [VX + 40, 1100, -1500];
const PATH1: V3 = [VX, shipRestY(CAR) + 26 + 30, 0];
const pathAt = (u: number): V3 => [lerp(PATH0[0], PATH1[0], u), lerp(PATH0[1], PATH1[1], Math.pow(u, 0.75)), lerp(PATH0[2], PATH1[2], u)];
const GATE = 0.46;
const divertAt = (u: number): V3 => {
  const g = pathAt(GATE);
  return [lerp(g[0], VX + 80, u), lerp(g[1], 0, Math.pow(u, 1.5)), lerp(g[2], -1250, u)];
};
const Corridor: React.FC<{t: number; u: number; gate?: number; gateCol?: string; after?: number; divert?: number; divertFade?: number; red?: number; id: string}> = ({t, u, gate = 1, gateCol = C.yellow, after = 1, divert = 0, divertFade = 1, red = 0, id}) => {
  const P = (v: V3) => proj(CV, v);
  const line = (f: (x: number) => V3, a: number, b: number, n = 30) => Array.from({length: n}, (_, i) => P(f(a + ((b - a) * i) / (n - 1)))).map((p) => `${p[0]},${p[1]}`).join(' ');
  const g = P(pathAt(GATE));
  const gr = 120 * scaleAt(CV, pathAt(GATE));
  const p = pathAt(Math.min(u, 0.995));
  const theta = 90 * smoother(prog(u, 0.8, 0.95));
  const near = line(pathAt, 0.86, 1);
  return (
    <CatchView t={t} c={CV} l="day" s={{carY: CAR, open: 24}}
      fore={
        <>
          {svg(
            <>
              <polyline points={line(pathAt, 0, GATE)} stroke="#ffffff" strokeWidth={6} strokeDasharray="3 14" strokeLinecap="round" fill="none" opacity={0.9} />
              <polyline points={line(pathAt, GATE, 1)} stroke="#ffffff" strokeWidth={6} strokeDasharray="3 14" strokeLinecap="round" fill="none" opacity={0.9 * after} />
              {divert > 0 ? <polyline points={line(divertAt, 0, divert)} stroke={C.teal} strokeWidth={8} strokeLinecap="round" fill="none" opacity={divertFade} /> : null}
              <ellipse cx={g[0]} cy={g[1]} rx={gr * 0.35} ry={gr} fill="none" stroke={gateCol} strokeWidth={7} strokeDasharray="16 10" opacity={gate} />
              {red > 0 ? <polyline points={near} stroke={C.red} strokeWidth={14} strokeLinecap="round" fill="none" opacity={red} /> : null}
            </>,
          )}
          <ShipWorld c={CV} p={p} theta={theta} l="day" props={{t, flapFwd: 40, flapAft: 50, engines: u > 0.8 ? 1 : 0, plumeLen: 18, id}} />
        </>
      } />
  );
};

export const endShots = (): Shot[] => {
  const shots: Shot[] = [];
  const g0a = ls('S7_00') - 0.4;
  const tDeciding = wt('S7_00', 'deciding'), tCond = ls('S7_01'), tEng = wt('S7_01', 'engine'), tGnd = wt('S7_01', 'ground'), tRemove = wt('S7_01', 'remove');
  const tF6 = ls('S7_02'), tAlt = ls('S7_03'), tDetected = wt('S7_03', 'detected'), tBeside = wt('S7_04', 'beside');

  // G1 — deciding when to attempt: the approach from the Gulf to the pad, one decision point on it, well before the arms
  const g2a = tCond - 0.2;
  shots.push({
    id: 'G1_decision', a: g0a, b: g2a, tin: 'dip', td: 0.45,
    render: (t) => <Corridor t={t} u={lerp(0.08, 0.3, ep(t, g0a, g2a + 1, (v) => v))} gate={prog(t, tDeciding - 0.2, tDeciding + 0.4)} id="g1s" />,
  });
  // G2 — the conditions themselves, in close-up (no status bubbles): a flap that stops answering, an engine that does
  // not light, a ground machine that stops mid-swing; then the decision point goes red and the approach beyond it lapses
  const g2b = tEng - 0.2, g2c = tGnd - 0.85, g2d = tRemove - 0.2, g3a = tF6 - 0.2;
  shots.push({
    id: 'G2a_vehicle', a: g2a, b: g2b, tin: 'cut',
    render: (t) => {
      const ok = 30 + 18 * Math.sin(t * 2.4);
      const stuck = t > g2a + 0.45;
      return (
        <Frame>
          <Sky k="day" />
          <InFlight x={1120} y={560} rot={-90} z={34}>
            <g transform="translate(0 26)"><Ship az={58} pal="day" t={t} flapFwd={stuck ? 62 : ok} flapAft={ok + 6} fittings={1} id="g2as" /></g>
          </InFlight>
          {svg(<circle cx={1120 - 13 * 34} cy={560 - 4 * 34} r={140} fill="none" stroke={C.red} strokeWidth={10} opacity={prog(t, g2a + 0.45, g2a + 0.7)} />)}
        </Frame>
      );
    },
  });
  shots.push({
    id: 'G2b_engine', a: g2b, b: g2c, tin: 'cut',
    render: (t) => (
      <Frame>
        <Sky k="day" />
        <InFlight x={960} y={lerp(300, 330, prog(t, g2b, g2c))} rot={0} z={44}>
          <Ship az={70} pal="day" t={t} engines={t < g2b + 0.4 ? 0.9 : 0.9 * (0.5 + 0.5 * Math.sin(t * 40))} plumeLen={12} flapFwd={60} flapAft={70} id="g2bs" />
        </InFlight>
        {svg(<rect x={960 - 3.4 * 44} y={300 + 2} width={6.8 * 44} height={90} rx={20} fill="none" stroke={C.red} strokeWidth={10} opacity={prog(t, g2b + 0.4, g2b + 0.6)} />)}
      </Frame>
    ),
  });
  shots.push({
    id: 'G2c_ground', a: g2c, b: g2d, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [10, CAR + 1, 0], z: lerp(15, 16, prog(t, g2c, g2d)), yaw: -24, pitch: 2};
      const halt = prog(t, tGnd - 0.1, tGnd + 0.1);
      const open = lerp(30, 18, Math.min(prog(t, g2c, g2d), 0.45 + 0.55 * (1 - halt)));
      return <CatchView t={t} c={c} l="day" s={{carY: CAR, open}} hiCarriage={halt * (0.6 + 0.4 * Math.sin(t * 12))} />;
    },
  });
  shots.push({
    id: 'G2d_noGo', a: g2d, b: g3a, tin: 'cut',
    render: (t) => {
      const no = prog(t, g2d + 0.2, g2d + 0.6);
      return <Corridor t={t} u={lerp(0.3, 0.38, prog(t, g2d, g3a))} gateCol={no > 0.5 ? C.red : C.yellow} after={1 - 0.8 * no} id="g2ds" />;
    },
  });

  // G3 — Flight 6: tower health checks called off a booster catch; the booster diverts away from the tower
  const g4a = tAlt - 0.2;
  shots.push({
    id: 'G3_flight6', a: g3a, b: g4a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [30, 70, 0], z: 4.4, yaw: -20, pitch: 4};
      const u = ep(t, g3a, g4a + 0.4);
      return (
        <CatchView t={t} c={c} l="day" s={{carY: 104, open: 30}} sky="gulf"
          vehicle={
            <Place c={c} p={[VX + 40 + lerp(0, 150, u), 170 - 90 * u, -40 * u]} tilt={lerp(-4, 14, u)}>
              <Booster az={azFor(c, 45)} version="v1" pal="day" t={t} engines={0.9} plumeLen={30} id="g3b" />
            </Place>
          }
          overlay={svg(<Word text="FLIGHT 6 · 2024" x={110} y={150} anchor="start" size={56} color="#fbf4e4" o={fadeWin(t, tF6, g4a, 0.3)} />)} />
      );
    },
  });
  // G4 — one alternate route, from the decision point only: a divert out to sea while it is still available; once the
  // ship has passed the point and is beside the arms there is no guaranteed escape
  const h1a = ls('S8_00') - 0.4;
  shots.push({
    id: 'G4_alternate', a: g4a, b: h1a, tin: 'cut',
    render: (t) => {
      const u = spline(t, [[g4a, 0.3], [tDetected + 0.2, GATE - 0.02], [tBeside + 0.6, 0.97], [h1a, 0.985]]);
      const grow = ep(t, tAlt + 0.2, tAlt + 1.3);
      const passed = prog(u, GATE, GATE + 0.12);
      return <Corridor t={t} u={u} divert={grow} divertFade={1 - 0.75 * passed} red={prog(t, tBeside - 0.2, tBeside + 0.3)} id="g4s" />;
    },
  });

  // ---------------- S8 ----------------
  const tGroundM = wt('S8_00', 'ground'), tOff = wt('S8_00', 'off'), tBoth = ls('S8_01'), tAgain = wt('S8_01', 'again');
  const tPrize = ls('S8_02'), tJob = ls('S8_03'), tStruct = wt('S8_03', 'structure'), tProving = wt('S8_03', 'proving');
  const tCatch = ls('S8_04'), tFly = wt('S8_04', 'fly');

  // H1 — recovery hardware on the ground instead of on the vehicle: landing legs (dashed) leave the ship; the arms do it
  const h2a = tBoth - 0.2;
  shots.push({
    id: 'H1_noLegs', a: h1a, b: h2a, tin: 'dip', td: 0.45,
    render: (t) => {
      const c: Cam3 = {at: [10, 88, 0], z: 5.6, yaw: -24, pitch: 3};
      const s: ArmState = {carY: CAR, open: lerp(26, 6, ep(t, h1a, h2a))};
      const above = lerp(24, 4, ep(t, h1a, h2a));
      const legs = 1 - prog(t, tOff - 0.4, tOff + 0.3);
      const armK = fadeWin(t, tGroundM - 0.2, h2a, 0.3);
      const b = proj(c, [VX, shipRestY(CAR) + above, 0]);
      const z = scaleAt(c, [VX, shipRestY(CAR) + above, 0]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={armK} hiCarriage={armK}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="day" props={{t, id: 'h1s', flapFwd: 60, flapAft: 70, engines: 0.8, plumeLen: 16}} />}
          overlay={svg(
            <g opacity={legs * prog(t, h1a + 0.3, h1a + 0.8)} stroke="#e5484d" strokeWidth={5} strokeDasharray="10 8" fill="none">
              {[-1, 1].map((sd) => <path key={sd} d={`M ${b[0] + sd * 3 * z} ${b[1] - 4 * z} L ${b[0] + sd * 8 * z} ${b[1] + 6 * z} L ${b[0] + sd * 10 * z} ${b[1] + 6 * z}`} />)}
            </g>,
          )} />
      );
    },
  });
  // H2 — the same hardware again: after a catch, the carriage carries the booster down and sets it back on the launch
  // mount; the arms open and release it (a separate operation, shown as one)
  const h3a = tPrize - 0.2;
  const carMount = MOUNT_TOP + 0.6 - (boosterRestY(0, 'v3'));
  shots.push({
    id: 'H2_backOnMount', a: h2a, b: h3a, tin: 'cut',
    render: (t) => {
      const u = ep(t, h2a + 0.2, tAgain - 0.4);
      const car = lerp(CAR, carMount, u);
      const open = lerp(4, 16, ep(t, tAgain - 0.3, h3a));
      const c: Cam3 = {at: [10, lerp(70, 54, u), 0], z: 4.8, yaw: -30, pitch: -4};
      return (
        <CatchView t={t} c={c} l="day" s={{carY: car, open}} hiCarriage={fadeWin(t, h2a + 0.2, tAgain, 0.3) * 0.6}
          vehicle={<BoosterAt c={c} carY={car} above={0} v="v3" l="day" heading={0} props={{t, id: 'h2b'}} />} />
      );
    },
  });
  // H3 — the prize behind the manoeuvre: the real first catch, the booster held by the arms
  const h4a = tJob - 0.2;
  shots.push({
    id: 'H3_realHeld', a: h3a, b: h4a, tin: 'cut',
    render: (t) => <Footage file={F5} a={h3a} src0={11.6} scale={1.1} cx={0.42} cy={0.45}>{svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, h3a + 0.2, h4a, 0.25)} />)}</Footage>,
  });
  // H4 — another job, in order: the recovered Ship 40 (ocean recovery after Flight 13) → people on its tiles → the drawn
  // engine and structure check
  const h4b = h4a + 3.0, h4c = h4b + 2.8, h5a = tCatch - 0.2;
  const s40 = 'SpaceX · Ship 40 · Flight 13 ocean recovery';
  shots.push({id: 'H4a_realShip40', a: h4a, b: h4b, tin: 'cut', render: (t) => <Footage file={S40} a={h4a} src0={0.0}>{svg(<Credit text={s40} o={fadeWin(t, h4a + 0.2, h4b + 3, 0.25)} />)}</Footage>});
  shots.push({id: 'H4b_realTiles', a: h4b, b: h4c, tin: 'cut', render: (t) => <Footage file={S40} a={h4b} src0={5.4}>{svg(<Credit text={s40} o={fadeWin(t, h4b - 1, h4c - 0.2, 0.25)} />)}</Footage>});
  shots.push({
    id: 'H4c_engineCheck', a: h4c, b: h5a, tin: 'cut',
    render: (t) => {
      const u = ep(t, h4c, h5a);
      const z = Math.exp(lerp(Math.log(46), Math.log(15), u));
      const x = 960, base = lerp(260, 1000, u);
      const scan = prog(t, tStruct - 0.1, tProving + 0.4);
      return (
        <Frame>
          <Sky k="day" horizon={0.8} />
          <rect x={0} y={base + 4} width={1920} height={1080} fill="#d9d4c7" />
          <rect x={x - 6 * z} y={base} width={12 * z} height={0.6 * z} fill="#9aa0a6" />
          <InFlight x={x} y={base} rot={0} z={z}><Ship az={20} pal="day" t={t} detail fittings={1} id="h4cs" /></InFlight>
          {scan > 0 && scan < 1 ? <rect x={x - 6 * z} y={base - 52 * z * scan - 4} width={12 * z} height={8} fill="#2ec4b6" opacity={0.9} /> : null}
          <ellipse cx={x} cy={base + 0.6 * z} rx={4.2 * z} ry={1.0 * z} fill="none" stroke={C.yellow} strokeWidth={6} opacity={fadeWin(t, h4c, tStruct, 0.2)} />
        </Frame>
      );
    },
  });
  // H5 — fly it again: the ship, held in the arms, is lifted and set on its booster on the mount — preparing the next
  // flight (a distinct operation)
  const h6a = tFly + 0.45;
  const stackCar = MOUNT_TOP + 0.6 + 72 + 35.1 - RAIL_DY;
  shots.push({
    id: 'H5_restack', a: h5a, b: h6a, tin: 'cut',
    render: (t) => {
      const u = ep(t, h5a, h6a - 0.3);
      const car = lerp(stackCar + 14, stackCar, u);
      const c: Cam3 = {at: [10, lerp(96, 88, u), 0], z: 5.0, yaw: -28, pitch: -3};
      return (
        <CatchView t={t} c={c} l="day" s={{carY: car, open: 4}}
          vehicle={
            <>
              <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="day" t={t} id="h5b" /></Place>
              <ShipAt c={c} carY={car} above={0} l="day" props={{t, id: 'h5s'}} />
            </>
          } />
      );
    },
  });
  // H6 — and fly: a real launch over the coast (Flight 14), the idea of repeating it — not a reflight claim
  const i1a = h6a + 5.0;
  shots.push({
    id: 'H6_realLaunch', a: h6a, b: i1a, tin: 'cut',
    render: (t) => <Footage file={F14L} a={h6a} src0={15.4} scale={TELEM_CROP} cx={0.5} cy={0}>{svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, h6a + 0.2, i1a, 0.25)} />)}</Footage>,
  });

  // ---------------- S9: one continuous approach, contact, settle, hold; then the end-screen composition ----------------
  const tShield = ls('S9_01'), tFlapsF = ls('S9_02'), tEngF = wt('S9_03', 'engines'), tMeet = wt('S9_04', 'meet'), tTower = wt('S9_04', 'tower'), tLoadE = wt('S9_04', 'load');
  const tR = tEngF - 0.07, contact = tMeet + 0.15;
  const Yc = shipRestY(CAR) + 26;
  const v0 = 45, pw = 2.2;
  const HR = (v0 * (contact - tR)) / pw;
  const H = (t: number) => (t < tR ? HR + v0 * (tR - t) : approach(t, tR, contact, HR, 0.35));
  const pos = (t: number): V3 => {
    const g = smoother(prog(t, i1a, contact - 0.7));
    return [VX + 50 * (1 - g), Yc + H(t), -220 * (1 - g)];
  };
  const theta = (t: number) => 90 * smoother(prog(t, tR + 0.05, tR + 2.2));
  const F1 = {at: [VX - 4, CAR + 4, 0] as V3, z: 12, yaw: -30, pitch: 3};
  const F2 = {at: [9, 70, 0] as V3, z: 4.4, yaw: -28, pitch: 4};
  const pullA = tLoadE - 0.1;
  const camAt = (t: number): Cam3 => {
    const p = pos(t);
    const yaw = spline(t, [[i1a, 20], [tShield, 6], [tFlapsF, -12], [tR, -24], [contact, F1.yaw], [pullA, F1.yaw], [END_A, F2.yaw]]);
    const pitch0 = spline(t, [[i1a, -10], [tShield - 0.6, 10], [tShield + 1.0, 12], [tFlapsF + 0.3, 4], [tR, 2], [contact, F1.pitch]]);
    const z0 = splineZ(t, [[i1a, 5], [tShield - 0.5, 9], [tShield + 0.9, 14], [tFlapsF + 0.4, 9], [tR, 8.5], [contact, F1.z], [pullA, 12.5]]);
    const w = smoother(prog(t, tR + 0.4, contact - 0.2));
    let at: V3 = [lerp(p[0], F1.at[0], w), lerp(p[1], F1.at[1], w), lerp(p[2], F1.at[2], w)];
    let z = z0, pitch = pitch0;
    if (t > pullA) {
      const k = smoother(prog(t, pullA, END_A));
      at = [lerp(F1.at[0], F2.at[0], k), lerp(F1.at[1], F2.at[1], k), lerp(F1.at[2], F2.at[2], k)];
      z = Math.exp(lerp(Math.log(12.5), Math.log(F2.z), k));
      pitch = lerp(F1.pitch, F2.pitch, k);
    }
    return {at, z, yaw, pitch};
  };
  const closing = (t: number, end: boolean) => {
    const c = camAt(t);
    const th = theta(t);
    const s: ArmState = {carY: CAR, open: lerp(14, 4, ep(t, contact - 2.6, contact)), flex: 0.35 * prog(t, contact, contact + 0.6) * (1 - prog(t, contact + 2, contact + 4))};
    const eng = throttle(t, tR + 0.15, contact + 0.1, 0.6);
    const up = smoother(prog(t, tR, tR + 2));
    const ff = lerp(25 + 20 * Math.sin(t * 1.9), 60, up), fa = lerp(32 - 16 * Math.sin(t * 1.9 + 0.8), 70, up);
    const loadK = fadeWin(t, tTower - 0.2, pullA + 0.5, 0.3);
    const beacon = proj(c, [0, TOWER_H + 12, 0]);
    const blink = end ? (Math.sin(t * Math.PI * 1.1) > 0.6 ? 1 : 0.15) : 0;
    return (
      <CatchView t={t} c={c} l="day" s={s} hiRail={loadK * 0.7} hiTruss={loadK * 0.5}
        fore={blink > 0 ? <circle cx={beacon[0]} cy={beacon[1]} r={4 + 4 * blink} fill="#ff4b3e" opacity={blink} /> : null}
        vehicle={<ShipWorld c={c} p={pos(t)} theta={th} l="day" props={{t, heat: 0.25 * (1 - prog(t, i1a, tShield + 1.2)), engines: eng, plumeLen: 28, flapFwd: ff, flapAft: fa, detail: c.z > 10, id: end ? 'js' : 'i1s'}} />} />
    );
  };
  shots.push({id: 'I1_finalHandoff', a: i1a, b: END_A, tin: 'cut', render: (t) => closing(t, false)});

  // J1 — end screen: the composition held; two recessed spaces for YouTube video elements; small identity above
  shots.push({
    id: 'J1_endScreen', a: END_A, b: FILM_END + 1, tin: 'cut',
    render: (t) => {
      const e = ep(t, END_A, END_A + 0.5);
      const txt = ep(t, END_A + 0.2, END_A + 0.8);
      return (
        <>
          {closing(t, true)}
          {svg(
            <>
              <rect width={1920} height={1080} fill="#0b0d14" opacity={0.12 * e} />
              {END_PANELS.map((pn, i) => (
                <g key={i} opacity={e} transform={`translate(0 ${12 * (1 - e)})`}>
                  <rect x={pn.x + 6} y={pn.y + 8} width={pn.w} height={pn.h} rx={10} fill="rgba(0,0,0,0.3)" />
                  <rect x={pn.x} y={pn.y} width={pn.w} height={pn.h} rx={10} fill="#0a0d12" fillOpacity={0.96} stroke="rgba(255,255,255,0.32)" strokeWidth={2} />
                  <rect x={pn.x + 5} y={pn.y + 5} width={pn.w - 10} height={pn.h - 10} rx={7} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={6} />
                </g>
              ))}
              <text x={960} y={112} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={26} fill="#ffffff" letterSpacing={7} opacity={txt * 0.92} style={{paintOrder: 'stroke'}} stroke="rgba(0,0,0,0.45)" strokeWidth={4}>FUTURE GOT WEIRD</text>
              <text x={960} y={180} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={50} fill={C.yellow} letterSpacing={3} opacity={txt} style={{paintOrder: 'stroke'}} stroke={C.ink} strokeWidth={5}>KEEP EXPLORING</text>
            </>,
          )}
        </>
      );
    },
  });
  return shots;
};
export {Arrow, noise};

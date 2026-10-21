// "Choosing the approach" (S7), "Why take the risk" (S8), "Complete the handoff" (S9) and the end card.
import React from 'react';
import {ep, prog, clamp, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, proj} from '../cam3';
import {ArmState, VX, RAIL_DY, ARM_Z, MOUNT_TOP, PinMark, Place, azFor} from '../site';
import {Booster, Ship, BOOSTER_LEN} from '../vehicles';
import {Clouds, Credit, Frame, Sky, Word, SeaPlane} from '../scene';
import {F5, Footage, Shot} from '../timeline';
import {CatchView, InFlight, ShipAt, BoosterAt, Streaks, approach, throttle, shipRestY} from './common';
import {Arrow} from './s2s3';
import {FILM_END, NARR_V2, le, ls, ss, wt} from '../time';
import {C, FONT} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = 98;

/** Status light. */
const Lamp: React.FC<{x: number; y: number; state: 'off' | 'go' | 'warn'; o?: number; label?: string}> = ({x, y, state, o = 1, label}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={30} fill={state === 'go' ? '#36c37a' : state === 'warn' ? '#ffb23c' : '#4a5260'} stroke={C.ink} strokeWidth={5} />
      {state !== 'off' ? <circle cx={x} cy={y} r={52} fill={state === 'go' ? 'rgba(54,195,122,0.25)' : 'rgba(255,178,60,0.3)'} /> : null}
      {label ? <text x={x + 48} y={y + 14} fontFamily={FONT.title} fontWeight={600} fontSize={40} fill={C.cream} stroke={C.ink} strokeWidth={4} style={{paintOrder: 'stroke'}}>{label}</text> : null}
    </g>
  );

export const s7s8s9Shots = (): Shot[] => {
  const shots: Shot[] = [];
  const g0a = ss('S7') - 0.9;
  const tVeh = wt('S7_01', 'vehicle'), tEng = wt('S7_01', 'engine'), tGnd = wt('S7_01', 'ground'), tRemove = wt('S7_01', 'remove');
  const tF6 = ls('S7_02'), tCall = wt('S7_02', 'call'), tAlt = ls('S7_03'), tDetect = wt('S7_03', 'detected');
  const tBeside = ls('S7_04'), tProtect = ls('S7_05'), tPicture = wt('S7_05', 'picture');

  // G1 + G2 — deciding when to attempt: the approach, and three conditions that can take it away
  const g3a = tF6 - 0.25;
  shots.push({
    id: 'G1_decide', a: g0a, b: g3a, tin: 'fade', td: 0.4,
    render: (t) => {
      const c: Cam3 = {at: [12, lerp(96, 86, prog(t, g0a, g3a)), 0], z: lerp(3.8, 4.6, prog(t, g0a, g3a)), yaw: lerp(-30, -22, prog(t, g0a, g3a)), pitch: 3};
      const s: ArmState = {carY: CAR, open: 30};
      const above = lerp(104, 60, prog(t, g0a, g3a));
      const sp = proj(c, [VX, shipRestY(CAR) + above + 20, 0]);
      const tw = proj(c, [0, 140, 0]);
      const warn = t > tGnd + 0.1;
      const dim = prog(t, tRemove - 0.1, tRemove + 0.5);
      const pathPts = Array.from({length: 20}, (_, i) => {
        const u = i / 19;
        return proj(c, [VX, shipRestY(CAR) + above * (1 - u), 0]);
      });
      return (
        <CatchView t={t} c={c} l="dusk" s={s} sun={[1500, 760]}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="dusk" heading={70} props={{engines: 0, t, id: 'g1s', flapFwd: 30, flapAft: 30}} />}
          overlay={svg(
            <>
              <polyline points={pathPts.map((p) => `${p[0]},${p[1] + 210}`).join(' ')} stroke={warn ? C.red : C.cream} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" fill="none" opacity={(1 - 0.6 * dim) * prog(t, g0a + 0.2, g0a + 0.8)} />
              <Lamp x={sp[0] + 150} y={sp[1] - 60} state={t > tVeh ? 'go' : 'off'} o={prog(t, tVeh - 0.3, tVeh)} label="VEHICLE" />
              <Lamp x={sp[0] + 150} y={sp[1] + 60} state={t > tEng ? 'go' : 'off'} o={prog(t, tEng - 0.3, tEng)} label="ENGINES" />
              <Lamp x={tw[0] - 330} y={tw[1] + 120} state={warn ? 'warn' : 'off'} o={prog(t, tGnd - 0.3, tGnd)} label="GROUND" />
            </>,
          )}
        />
      );
    },
  });

  // G3 — Flight 6: tower checks called off a booster catch; the booster diverts to the Gulf
  const g4a = tAlt - 0.2;
  shots.push({
    id: 'G3_flight6', a: g3a, b: g4a, tin: 'dip', td: 0.45,
    render: (t) => {
      const c: Cam3 = {at: [30, 70, 0], z: 4.4, yaw: -20, pitch: 4};
      const s: ArmState = {carY: 104, open: 30};
      const u = ep(t, g3a, g4a + 0.4);
      const off = lerp(0, 150, u);
      return (
        <CatchView t={t} c={c} l="day" s={s} sky="gulf"
          vehicle={
            <Place c={c} p={[VX + 40 + off, 170 - 90 * u, -40 * u]} tilt={lerp(-4, 14, u)}>
              <Booster az={azFor(c, 45)} version="v1" pal="day" t={t} engines={0.9} plumeLen={30} id="g3b" />
            </Place>
          }
          overlay={svg(
            <>
              <Word text="FLIGHT 6 · 2024" x={110} y={150} anchor="start" size={60} color="#fbf4e4" o={fadeWin(t, tF6, g4a, 0.3)} />
              <Word text="CATCH CALLED OFF" x={110} y={240} anchor="start" size={60} o={fadeWin(t, tCall - 0.2, g4a, 0.25)} />
            </>,
          )}
        />
      );
    },
  });

  // G4 — alternatives exist early on the approach, not beside the arms
  const g5a = tProtect - 0.2;
  shots.push({
    id: 'G4_branches', a: g4a, b: g5a, tin: 'cut',
    render: (t) => {
      const tower: [number, number] = [380, 880];
      const P0: [number, number] = [1800, 90];
      const pathAt = (u: number): [number, number] => [lerp(P0[0], tower[0] + 140, u), lerp(P0[1], tower[1] - 260, Math.pow(u, 0.85))];
      const pu = ep(t, g4a, g5a - 0.3, (v) => v);
      const shipP = pathAt(Math.min(0.98, pu));
      const branches = [0.12, 0.3, 0.48, 0.66];
      const red = prog(t, tBeside - 0.2, tBeside + 0.4);
      return (
        <Frame>
          <Sky k="gulf" horizon={0.88} />
          <rect x={0} y={930} width={1920} height={150} fill="#3f7fae" />
          <rect x={0} y={890} width={760} height={50} fill="#d3c7a3" />
          <g>
            <rect x={tower[0] - 14} y={tower[1] - 460} width={28} height={460} fill="#38424d" />
            <rect x={tower[0] + 14} y={tower[1] - 266} width={150} height={16} fill="#46525e" stroke={C.ink} strokeWidth={3} />
          </g>
          <polyline points={Array.from({length: 50}, (_, i) => pathAt(i / 49)).map((p) => p.join(',')).join(' ')} stroke="#fbf4e4" strokeWidth={7} strokeDasharray="4 16" strokeDashoffset={-t * 40} strokeLinecap="round" fill="none" />
          <path d={`M ${pathAt(0.8)[0]} ${pathAt(0.8)[1]} L ${pathAt(1)[0]} ${pathAt(1)[1]}`} stroke={C.red} strokeWidth={14} strokeLinecap="round" opacity={red} />
          {branches.map((b, i) => {
            const p = pathAt(b);
            const passed = pu > b + 0.05;
            const o = prog(t, tAlt + i * 0.35, tAlt + i * 0.35 + 0.3) * (passed ? 0.25 : 1);
            return <Arrow key={i} x={p[0]} y={p[1]} dx={220} dy={170} color={C.teal} w={9} o={o} />;
          })}
          <InFlight x={shipP[0]} y={shipP[1]} rot={lerp(-90, 0, prog(pu, 0.55, 0.8))} z={2.4}>
            <g transform="translate(0 26)"><Ship az={70} pal="day" t={t} engines={pu > 0.6 ? 1 : 0} plumeLen={14} flapFwd={40} flapAft={50} id="g4s" /></g>
          </InFlight>
          <Word text="DIVERT OPTIONS" x={1300} y={720} size={56} color={C.teal} o={fadeWin(t, tAlt + 0.3, tBeside, 0.3)} />
          <Word text="NO GUARANTEED ESCAPE" x={760} y={520} anchor="start" size={56} color={C.red} o={red * fadeWin(t, tBeside, g5a, 0.2)} />
        </Frame>
      );
    },
  });

  // G5 — protecting the receiving machinery
  const h1a = ss('S8') - 1.0;
  shots.push({
    id: 'G5_protect', a: g5a, b: h1a, tin: 'fade', td: 0.4,
    render: (t) => {
      const u = prog(t, g5a, h1a);
      const c: Cam3 = {at: [lerp(4, 8, u), lerp(80, 92, u), 0], z: lerp(5.2, 6.4, u), yaw: lerp(-34, -26, u), pitch: 3};
      const k = fadeWin(t, tProtect + 0.2, tPicture - 0.2, 0.3);
      return <CatchView t={t} c={c} l="dusk" s={{carY: 104, open: 30}} hiRail={k} hiCarriage={k} sun={[1550, 700]} />;
    },
  });

  // ---------------- S8 ----------------
  const tGroundM = wt('S8_00', 'ground'), tOff = wt('S8_00', 'off'), tBoth = ls('S8_01'), tAgain = wt('S8_01', 'again');
  const tPrize = ls('S8_02'), tJob = ls('S8_03'), tHeat = wt('S8_03', 'heat'), tEngS = wt('S8_03', 'engines'), tStruct = wt('S8_03', 'structure'), tProving = wt('S8_03', 'proving');
  const tCatch = ls('S8_04'), tInspect = wt('S8_04', 'inspect'), tFly = wt('S8_04', 'fly'), tRepeat = wt('S8_04', 'repeat');
  const tGoal = ls('S8_05'), tOnce = wt('S8_05', 'once'), tEvery = ls('S8_06');

  // H1 — recovery hardware on the ground instead of on the vehicle: ghost legs leave the ship; the arms do that job
  const h2a = tBoth - 0.2;
  shots.push({
    id: 'H1_legs', a: h1a, b: h2a, tin: 'dip', td: 0.45,
    render: (t) => {
      const c: Cam3 = {at: [10, 88, 0], z: 5.6, yaw: -24, pitch: 3};
      const s: ArmState = {carY: CAR, open: lerp(26, 6, ep(t, h1a, h2a))};
      const above = lerp(24, 4, ep(t, h1a, h2a));
      const legs = 1 - prog(t, tOff - 0.4, tOff + 0.3);
      const armK = fadeWin(t, tGroundM - 0.2, h2a, 0.3);
      const b = proj(c, [VX, shipRestY(CAR) + above, 0]);
      const z = c.z;
      return (
        <CatchView t={t} c={c} l="studio" s={s} hiRail={armK} hiCarriage={armK} clouds={false}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="studio" heading={70} props={{t, id: 'h1s', flapFwd: 60, flapAft: 70, engines: 0.8, plumeLen: 16}} />}
          overlay={svg(
            <g opacity={legs * prog(t, h1a + 0.3, h1a + 0.8)} stroke="#e5484d" strokeWidth={5} strokeDasharray="10 8" fill="none">
              {[-1, 1].map((sd) => <path key={sd} d={`M ${b[0] + sd * 3 * z} ${b[1] - 4 * z} L ${b[0] + sd * 8 * z} ${b[1] + 6 * z} L ${b[0] + sd * 10 * z} ${b[1] + 6 * z}`} />)}
              <path d={`M ${b[0] - 1 * z} ${b[1]} L ${b[0]} ${b[1] + 7 * z} L ${b[0] + 1.5 * z} ${b[1] + 7 * z}`} />
            </g>,
          )}
        />
      );
    },
  });

  // H2 — both stages recovered: the arms set the ship back on its booster, the same hardware again
  const h3a = tPrize - 0.2;
  shots.push({
    id: 'H2_restack', a: h2a, b: h3a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [14, 78, 0], z: 4.9, yaw: -30, pitch: 4};
      const lift = ep(t, h2a + 0.2, tAgain - 0.1);
      const restY = MOUNT_TOP + 0.6 + BOOSTER_LEN; // ship base when stacked
      const carY = lerp(CAR, restY + 35.1 - RAIL_DY, lift);
      const s: ArmState = {carY, open: 4};
      return (
        <CatchView t={t} c={c} l="day" s={s}
          vehicle={
            <>
              <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="day" t={t} id="h2b" /></Place>
              <ShipAt c={c} carY={carY} above={0} l="day" heading={70} props={{t, id: 'h2s'}} />
            </>
          }
          overlay={svg(<Word text="SAME HARDWARE, AGAIN" x={1820} y={170} anchor="end" size={60} color="#fbf4e4" o={fadeWin(t, tAgain - 0.6, h3a, 0.3)} />)}
        />
      );
    },
  });

  // H3 — the prize behind a ridiculous-looking manoeuvre: the whole path in one exposure at dusk
  const h4a = tJob - 0.2;
  shots.push({
    id: 'H3_prize', a: h3a, b: h4a, tin: 'dip', td: 0.4,
    render: (t) => {
      const N = 6;
      const path = (f: number): [number, number] => [lerp(300, 1240, f), lerp(200, 640, Math.pow(f, 1.3))];
      const shown = prog(t, h3a + 0.2, h4a - 0.4) * (N - 1);
      return (
        <Frame>
          <Sky k="dusk" sun={[1600, 820]} />
          <g transform={`translate(1290 700) scale(${1 + 0.07 * prog(t, h3a, h4a)}) translate(-1290 -700)`}>
          <rect x={0} y={960} width={1920} height={120} fill="#2a2a33" />
          <g transform="translate(1290 960)">
            <rect x={-26} y={-640} width={52} height={640} fill="#1f2027" />
            <rect x={26} y={-330} width={180} height={30} fill="#26262e" />
          </g>
          {Array.from({length: N}, (_, i) => {
            const f = i / (N - 1);
            const o = clamp(shown - i + 1);
            if (o <= 0) return null;
            const [x, y] = path(f);
            return (
              <g key={i} opacity={o * (i === Math.floor(shown) ? 1 : 0.4)}>
                <InFlight x={x} y={y} rot={lerp(-90, 0, smoother(prog(f, 0.4, 0.9)))} z={4.2}>
                  <g transform="translate(0 26)"><Ship az={100} pal="dusk" t={t} engines={f > 0.4 ? 1 : 0} plumeLen={16} flapFwd={50} flapAft={60} id={`h3s${i}`} /></g>
                </InFlight>
              </g>
            );
          })}
          </g>
        </Frame>
      );
    },
  });

  // H4 — the next job: heat shield, engines, structure checked; then proving it can fly again
  const h5a = tCatch - 0.15;
  shots.push({
    id: 'H4_inspect', a: h4a, b: h5a, tin: 'cut',
    render: (t) => {
      const z = 15;
      const x = 960, y = 1000;
      const scan = ep(t, h4a + 0.9, tEngS - 0.1);
      const settle = 1 - ep(t, h4a, h4a + 1.6);
      const engK = fadeWin(t, tEngS - 0.1, tProving, 0.2), strK = fadeWin(t, tStruct - 0.1, tProving + 0.2, 0.2);
      const lift = ep(t, tProving, h5a + 0.3);
      return (
        <Frame>
          <Sky k="night" />
          <rect x={0} y={1000} width={1920} height={80} fill="#262b31" />
          {/* work-stand lights */}
          {[400, 1520].map((lx, i) => <ellipse key={i} cx={lx} cy={300} rx={420} ry={700} fill="url(#glowWhite)" opacity={0.12} />)}
          <InFlight x={x} y={y - lift * 500 - settle * 160} rot={0} z={z * (1 + 0.05 * prog(t, h4a, h5a))}>
            <g transform="translate(0 0)"><Ship az={45} pal="studio" t={t} detail id="h4s" engines={0} /></g>
          </InFlight>
          {scan > 0 && scan < 1 ? <rect x={x - 6 * z} y={y - 52 * z + scan * 52 * z} width={12 * z} height={10} fill="#2ec4b6" opacity={0.85} /> : null}
          {scan > 0 && scan < 1 ? <rect x={x - 6 * z} y={y - 52 * z} width={12 * z} height={scan * 52 * z} fill="rgba(46,196,182,0.12)" /> : null}
          <ellipse cx={x} cy={y - lift * 500 + 12} rx={5 * z} ry={22} fill="none" stroke={C.yellow} strokeWidth={8} opacity={engK} />
          {strK > 0 ? Array.from({length: 8}, (_, i) => <line key={i} x1={x - 4.5 * z} x2={x + 4.5 * z} y1={y - lift * 500 - (4 + i * 3.66) * z} y2={y - lift * 500 - (4 + i * 3.66) * z} stroke={C.yellow} strokeWidth={4} opacity={strK * 0.8} />) : null}
          <Word text="HEAT SHIELD" x={1500} y={300} size={58} color="#fbf4e4" o={fadeWin(t, tHeat - 0.1, tEngS, 0.2)} />
          <Word text="ENGINES" x={1500} y={300} size={58} color="#fbf4e4" o={fadeWin(t, tEngS - 0.1, tStruct, 0.2)} />
          <Word text="STRUCTURE" x={1500} y={300} size={58} color="#fbf4e4" o={fadeWin(t, tStruct - 0.1, tProving, 0.2)} />
          <Word text="FLY AGAIN?" x={1500} y={300} size={58} o={fadeWin(t, tProving, h5a, 0.2)} />
        </Frame>
      );
    },
  });

  // H5 + H6 — catch it, inspect it, fly it again, repeat: one loop, travelled again and again
  const i1a = ss('S9') - 1.4;
  shots.push({
    id: 'H5_loop', a: h5a, b: i1a, tin: 'cut',
    render: (t) => {
      const cx = 960, cy = 520, r = 300;
      const st = [
        {a: -90, w: 'CATCH', t0: tCatch},
        {a: 30, w: 'INSPECT', t0: tInspect},
        {a: 150, w: 'FLY', t0: tFly},
      ];
      const ring = prog(t, tRepeat - 0.1, tRepeat + 0.6);
      const speed = 0.35 + 1.3 * prog(t, tGoal, i1a);
      const ph = t >= tRepeat ? ((t - tRepeat) * speed) % 1 : 0;
      const once = fadeWin(t, tOnce - 0.5, tEvery, 0.2);
      const trips = Math.floor(Math.max(0, t - tRepeat) * speed);
      return (
        <Frame>
          <Sky k="night" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fbf4e4" strokeWidth={8} strokeDasharray="6 22" strokeDashoffset={-t * 60 * speed} strokeLinecap="round" opacity={0.25 + 0.75 * ring} />
          {st.map((p, i) => {
            const a = (p.a * Math.PI) / 180;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            const o = prog(t, p.t0 - 0.15, p.t0 + 0.1);
            return (
              <g key={i} opacity={o}>
                <circle cx={x} cy={y} r={96} fill="#1c232b" stroke={C.yellow} strokeWidth={6} />
                <InFlight x={x} y={y + 64} rot={0} z={2.4}><Ship az={70} pal="day" t={t} engines={i === 2 ? 1 : 0} plumeLen={14} id={`h5s${i}`} /></InFlight>
                <Word text={p.w} x={x + (i === 0 ? 0 : i === 1 ? 130 : -130)} y={y + (i === 0 ? -125 : 30)} anchor={i === 0 ? 'middle' : i === 1 ? 'start' : 'end'} size={58} color="#fbf4e4" o={1} />
              </g>
            );
          })}
          {ring > 0 ? (
            <g>
              <circle cx={cx + Math.cos(ph * Math.PI * 2 - Math.PI / 2) * r} cy={cy + Math.sin(ph * Math.PI * 2 - Math.PI / 2) * r} r={20} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
              <Word text="REPEAT" x={cx} y={cy + 24} size={82} o={ring} />
            </g>
          ) : null}
          {/* a running record of returns along the bottom: a system, not a one-off */}
          <g opacity={prog(t, tGoal - 0.2, tGoal + 0.4)}>
            {Array.from({length: Math.min(40, trips)}, (_, i) => <rect key={i} x={360 + i * 30} y={960} width={16} height={46} rx={5} fill={C.yellow} opacity={0.9} />)}
          </g>
          <g opacity={once}>
            <circle cx={1650} cy={240} r={70 + 30 * Math.sin(t * 6)} fill="url(#glowWarm)" />
            <Word text="ONCE?" x={1650} y={360} size={52} color="#fbf4e4" o={1} />
          </g>
        </Frame>
      );
    },
  });

  // ---------------- S9: the final seconds ----------------
  const tDiff = ls('S9_00'), tShield = ls('S9_01'), tFlapsF = ls('S9_02'), tEngF = ls('S9_03'), tMeet = wt('S9_04', 'meet'), tLoadF = wt('S9_04', 'load', 0, 'e');
  const tSeq = ls('S9_05'), tFirst = ls('S9_06'), tNextC = ls('S9_07'), tBack = wt('S9_07', 'back');

  // I1 — high above the coast at dusk, the ship coming home
  shots.push({
    id: 'I1_high', a: i1a, b: tShield - 0.2, tin: 'dip', td: 0.6,
    render: (t) => {
      const u = prog(t, i1a, tShield);
      return (
        <Frame>
          <Sky k="dusk" sun={[1500, 900]} />
          <SeaPlane y={870} t={t} tint={['#9a6f7a', '#3d3f5c']} />
          <rect x={0} y={860} width={760} height={30} fill="#7a6658" />
          <Clouds n={8} seed={61} y0={500} y1={900} dy={-t * 40} dx={t * 70} s={1} tint="#f3c0a6" o={0.7} />
          <InFlight x={lerp(1400, 980, u)} y={lerp(200, 380, u)} rot={-90} z={lerp(3.0, 4.4, u)}>
            <g transform="translate(0 26)"><Ship az={40} pal="dusk" t={t} heat={0.25 * (1 - u)} flapFwd={30} flapAft={40} id="i1s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });
  // I2 — the heat shield has done its job: tiles, cooling
  shots.push({
    id: 'I2_tiles', a: tShield - 0.2, b: tFlapsF - 0.25, tin: 'cut',
    render: (t) => {
      const u = prog(t, tShield - 0.2, tFlapsF);
      return (
        <Frame>
          <Sky k="dusk" />
          <InFlight x={960} y={560} rot={-96} z={lerp(70, 58, u)}>
            <g transform="translate(1 24)"><Ship az={18} pal="dusk" t={t} heat={0.18 * (1 - u)} detail id="i2s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });
  // I3 — the flaps have controlled the descent
  shots.push({
    id: 'I3_flaps', a: tFlapsF - 0.25, b: tEngF - 0.25, tin: 'cut',
    render: (t) => {
      const ff = 25 + 22 * Math.sin(t * 2.0), fa = 30 - 18 * Math.sin(t * 2.0 + 0.8);
      return (
        <Frame>
          <Sky k="dusk" />
          <Clouds n={12} seed={71} y0={-300} y1={1400} dy={-t * 520} s={1.3} tint="#f3c0a6" o={0.8} />
          <InFlight x={980} y={520} rot={-90} z={17}>
            <g transform="translate(0 26)"><Ship az={58} pal="dusk" t={t} flapFwd={ff} flapAft={fa} id="i3s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });
  // I4 — the engines have turned and slowed the ship
  const i5a = tMeet - 1.6;
  shots.push({
    id: 'I4_engines', a: tEngF - 0.25, b: i5a, tin: 'cut',
    render: (t) => {
      const f = ep(t, tEngF - 0.2, i5a - 0.2);
      const rot = lerp(-90, 0, smoother(f));
      return (
        <Frame>
          <Sky k="dusk" />
          <Clouds n={10} seed={72} y0={-300} y1={1400} dy={-t * lerp(520, 180, f)} s={1.3} tint="#f3c0a6" o={0.8} />
          <InFlight x={lerp(1040, 960, f)} y={lerp(480, 420, f)} rot={rot} z={13}>
            <g transform="translate(0 26)"><Ship az={lerp(58, 100, f)} pal="dusk" t={t} engines={prog(t, tEngF - 0.2, tEngF + 0.1)} plumeLen={28} flapFwd={lerp(30, 60, f)} flapAft={lerp(30, 70, f)} id="i4s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });
  // I5 — the hook's composition again: the supports meet, the tower takes the load, stable support held
  const i6a = tSeq - 0.3;
  shots.push({
    id: 'I5_contact', a: i5a, b: i6a, tin: 'fade', td: 0.3,
    render: (t) => {
      const contact = tMeet + 0.15;
      const above = approach(t, i5a - 2.4, contact, 9, 0.35);
      const c: Cam3 = {at: [17, CAR + 2, 0], z: lerp(15, 13.5, prog(t, i5a, i6a)), yaw: 20, pitch: -4};
      const s: ArmState = {carY: CAR, open: lerp(9, 4, ep(t, i5a, contact)), flex: 0.35 * prog(t, contact, contact + 0.6)};
      const eng = throttle(t, i5a - 2, contact + 0.1, 0.7);
      const loadK = fadeWin(t, wt('S9_04', 'tower') - 0.2, i6a + 1, 0.3);
      const pin = proj(c, [VX, CAR + RAIL_DY + 0.6, ARM_Z - 1.3]);
      return (
        <CatchView t={t} c={c} l="dusk" s={s} hiRail={loadK * 0.7} hiTruss={loadK * 0.5}
          fore={<PinMark c={c} s={s} above={Math.max(above, -0.3) + 0.0} hi={1} />}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="dusk" heading={110} props={{engines: eng, t, id: 'i5s', flapFwd: 60, flapAft: 70}} />}
          overlay={svg(<Arrow x={pin[0]} y={pin[1] - 200} dx={0} dy={170} o={loadK} />)}
        />
      );
    },
  });
  // I6 — both stages home: booster set back on the mount, ship held in the arms
  shots.push({
    id: 'I6_both', a: i6a, b: tFirst - 0.25, tin: 'fade', td: 0.5,
    render: (t) => {
      const u = prog(t, i6a, tFirst);
      const c: Cam3 = {at: [lerp(8, 4, u), lerp(70, 62, u), 0], z: lerp(4.6, 4.2, u), yaw: -26, pitch: 4};
      const carShip = MOUNT_TOP + 0.6 + BOOSTER_LEN + 35.1 - RAIL_DY + 18;
      return (
        <CatchView t={t} c={c} l="dusk" s={{carY: carShip, open: 4}} sun={[1550, 720]}
          vehicle={
            <>
              <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="dusk" t={t} id="i6b" /></Place>
              <ShipAt c={c} carY={carShip} above={0} l="dusk" heading={110} props={{t, id: 'i6s'}} />
            </>
          }
          overlay={svg(<Word text="BOTH STAGES" x={1820} y={170} anchor="end" size={64} color="#fbf4e4" o={fadeWin(t, wt('S9_05', 'both') - 0.2, tFirst, 0.2)} />)}
        />
      );
    },
  });
  // I7 — the real first catch: the booster held in the arms
  const i8a = tNextC - 0.2;
  shots.push({
    id: 'I7_real', a: tFirst - 0.25, b: i8a, tin: 'fade', td: 0.35,
    render: (t) => (
      <Footage file={F5} a={tFirst - 0.25} src0={9.6} scale={1.1} cx={0.42} cy={0.5}>
        {svg(<Credit text="SpaceX · Flight 5, 2024" o={fadeWin(t, tFirst, i8a - 0.1, 0.3)} />)}
      </Footage>
    ),
  });
  // I8 — the next challenge: bring home the ship from orbit, then send it back up; end card
  const endA = NARR_V2 - 2.6;
  shots.push({
    id: 'I8_next', a: i8a, b: FILM_END + 1, tin: 'column',
    render: (t) => {
      const u = prog(t, i8a, endA);
      const c: Cam3 = {at: [lerp(14, 2, u), lerp(96, 70, u), 0], z: lerp(6.2, 4.0, u), yaw: lerp(-20, -34, u), pitch: lerp(2, 6, u)};
      const restY = MOUNT_TOP + 0.6 + BOOSTER_LEN;
      const lift = ep(t, tBack - 1.6, tBack + 0.9);
      const carY = lerp(shipRestY(0) * 0 + 98, restY + 35.1 - RAIL_DY, lift);
      const fin = prog(t, endA, endA + 1.0);
      const mark = prog(t, endA + 0.9, endA + 1.6);
      return (
        <>
          <CatchView t={t} c={c} l="dusk" s={{carY, open: 4}} sun={[1550, 720]}
            vehicle={
              <>
                <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="dusk" t={t} id="i8b" /></Place>
                <ShipAt c={c} carY={carY} above={0} l="dusk" heading={110} props={{t, id: 'i8s'}} />
              </>
            }
            overlay={svg(
              <>
                <rect width={1920} height={1080} fill="#05070a" opacity={fin} />
                <text x={960} y={560} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={64} fill={C.cream} letterSpacing={6} opacity={mark}>FUTURE GOT WEIRD</text>
              </>,
            )}
          />
        </>
      );
    },
  });
  return shots;
};

// "Choosing the approach" (S7), "Why take the risk" (S8), "Complete the handoff" (S9) and the end screen.
// V3: the abort beat is conditions → decision → one alternate path; reuse is grounded in the recovered Ship 40 footage and
// an active material sequence; the closing handoff is one continuous shot that settles, pulls back and becomes the
// end-screen background (two stable panels in the final 15 s).
import React from 'react';
import {ep, prog, clamp, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, V3, proj} from '../cam3';
import {ArmState, VX, RAIL_DY, ARM_Z, MOUNT_TOP, TOWER_H, PinMark, Place, azFor} from '../site';
import {Booster, Ship, BOOSTER_LEN} from '../vehicles';
import {Clouds, Credit, Frame, Sky, Word} from '../scene';
import {F14L, Footage, MUSK08, S40, Shot, TELEM_CROP} from '../timeline';
import {CatchView, InFlight, ShipAt, Streaks, approach, throttle, shipRestY} from './common';
import {Arrow} from './s2s3';
import {FILM_END, ls, ss, wt} from '../time';
import {C, FONT} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = 98;
const D = Math.PI / 180;

/** Status light. */
const Lamp: React.FC<{x: number; y: number; state: 'off' | 'go' | 'warn' | 'stop'; o?: number; label?: string; r?: number}> = ({x, y, state, o = 1, label, r = 30}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r} fill={state === 'go' ? '#36c37a' : state === 'warn' ? '#ffb23c' : state === 'stop' ? '#e5484d' : '#4a5260'} stroke={C.ink} strokeWidth={5} />
      {state !== 'off' ? <circle cx={x} cy={y} r={r * 1.75} fill={state === 'go' ? 'rgba(54,195,122,0.25)' : state === 'warn' ? 'rgba(255,178,60,0.3)' : 'rgba(229,72,77,0.3)'} /> : null}
      {label ? <text x={x + r + 18} y={y + 14} fontFamily={FONT.title} fontWeight={600} fontSize={40} fill={C.cream} stroke={C.ink} strokeWidth={4} style={{paintOrder: 'stroke'}}>{label}</text> : null}
    </g>
  );

/** Catmull-Rom through keyframes [time, value]: continuous velocity, so camera moves never stop and restart at a key. */
const spline = (t: number, k: [number, number][]) => {
  if (t <= k[0][0]) return k[0][1];
  if (t >= k[k.length - 1][0]) return k[k.length - 1][1];
  let i = 0;
  while (t > k[i + 1][0]) i++;
  const [t1, p1] = k[i], [t2, p2] = k[i + 1];
  const p0 = i > 0 ? k[i - 1][1] : p1, p3 = i + 2 < k.length ? k[i + 2][1] : p2;
  const t0 = i > 0 ? k[i - 1][0] : t1 - (t2 - t1), t3 = i + 2 < k.length ? k[i + 2][0] : t2 + (t2 - t1);
  const h = t2 - t1, u = (t - t1) / h;
  const m1 = ((p2 - p0) / (t2 - t0)) * h, m2 = ((p3 - p1) / (t3 - t1)) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
};

/** The approach diagram shared by the decision beats: one path in from the sea to the tower, one decision gate on it. */
const TOWER: [number, number] = [380, 880];
const P0: [number, number] = [1800, 110];
const pathAt = (u: number): [number, number] => [lerp(P0[0], TOWER[0] + 150, u), lerp(P0[1], TOWER[1] - 266, Math.pow(u, 0.85))];
const GATE = 0.42;
const ApproachMap: React.FC<{t: number; children?: React.ReactNode; dimAfterGate?: number; gate?: number; gateState?: 'go' | 'stop' | 'off'}> = ({t, children, dimAfterGate = 0, gate = 1, gateState = 'off'}) => {
  const g = pathAt(GATE);
  return (
    <Frame>
      <Sky k="dusk" horizon={0.88} sun={[1650, 860]} />
      <rect x={0} y={930} width={1920} height={150} fill="#4b5d78" />
      <rect x={0} y={890} width={760} height={50} fill="#8a7a6a" />
      <g>
        <rect x={TOWER[0] - 14} y={TOWER[1] - 460} width={28} height={460} fill="#2a2f38" />
        <rect x={TOWER[0] + 14} y={TOWER[1] - 270} width={150} height={16} fill="#353c46" stroke={C.ink} strokeWidth={3} />
        <rect x={TOWER[0] + 14} y={TOWER[1] - 236} width={150} height={10} fill="#353c46" />
      </g>
      <polyline points={Array.from({length: 22}, (_, i) => pathAt((i / 21) * GATE)).map((p) => p.join(',')).join(' ')} stroke="#fbf4e4" strokeWidth={7} strokeDasharray="4 16" strokeDashoffset={-t * 40} strokeLinecap="round" fill="none" />
      <polyline points={Array.from({length: 30}, (_, i) => pathAt(GATE + (i / 29) * (1 - GATE))).map((p) => p.join(',')).join(' ')} stroke="#fbf4e4" strokeWidth={7} strokeDasharray="4 16" strokeDashoffset={-t * 40} strokeLinecap="round" fill="none" opacity={1 - 0.75 * dimAfterGate} />
      <g opacity={gate}>
        <line x1={g[0]} y1={g[1] - 150} x2={g[0]} y2={g[1] + 150} stroke={gateState === 'stop' ? C.red : gateState === 'go' ? '#36c37a' : C.yellow} strokeWidth={8} strokeDasharray="22 12" />
        <Word text="DECIDE HERE" x={g[0]} y={g[1] - 180} size={46} color="#fbf4e4" o={1} />
      </g>
      {children}
    </Frame>
  );
};
const MapShip: React.FC<{t: number; u: number; id: string}> = ({t, u, id}) => {
  const p = pathAt(u);
  return (
    <InFlight x={p[0]} y={p[1]} rot={lerp(-90, 0, smoother(prog(u, 0.62, 0.86)))} z={3.2}>
      <g transform="translate(0 26)"><Ship az={70} pal="dusk" t={t} engines={u > 0.64 ? 1 : 0} plumeLen={14} flapFwd={40} flapAft={50} id={id} /></g>
    </InFlight>
  );
};

/** A ship drawn about its centre at world point p (metres), rolled in screen by rot: the same transform as Place once upright. */
const ShipWorld: React.FC<{c: Cam3; p: V3; rot: number; children: React.ReactNode}> = ({c, p, rot, children}) => {
  const s = proj(c, p);
  const ky = Math.cos(c.pitch * D);
  return <g transform={`translate(${s[0]} ${s[1]}) rotate(${rot + (c.roll ?? 0)}) scale(${c.z} ${c.z * ky}) translate(0 26)`}>{children}</g>;
};

export const s7s8s9Shots = (): Shot[] => {
  const shots: Shot[] = [];
  const g0a = ss('S7') - 0.9;
  const tVeh = wt('S7_01', 'vehicle'), tEng = wt('S7_01', 'engine'), tGnd = wt('S7_01', 'ground'), tRemove = wt('S7_01', 'remove');
  const tF6 = ls('S7_02'), tAlt = ls('S7_03'), tDetect = wt('S7_03', 'detected');
  const tBeside = ls('S7_04'), tProtect = ls('S7_05'), tPicture = wt('S7_05', 'picture');

  // G1 — deciding when to attempt: the approach in from the sea, and the point where the decision has to be made
  const g2a = ls('S7_01') - 0.2;
  shots.push({
    id: 'G1_gate', a: g0a, b: g2a, tin: 'dip', td: 0.5,
    render: (t) => (
      <ApproachMap t={t} gate={prog(t, wt('S7_00', 'deciding') - 0.2, wt('S7_00', 'deciding') + 0.3)}>
        <MapShip t={t} u={lerp(0.02, 0.3, ep(t, g0a, g2a + 1.5, (v) => v))} id="g1s" />
      </ApproachMap>
    ),
  });

  // G2 — three conditions, each in close-up with its own status light, then back to the gate: NO-GO
  const g2b = tEng - 0.16, g2c = tGnd - 0.16, g2d = tRemove + 0.25, g3a = tF6 - 0.25;
  shots.push({
    id: 'G2a_vehicle', a: g2a, b: g2b, tin: 'cut',
    render: (t) => {
      const ff = 30 + 18 * Math.sin(t * 2.2);
      return (
        <Frame>
          <Sky k="dusk" />
          <Clouds n={10} seed={81} y0={-300} y1={1400} dy={-t * 380} s={1.3} tint="#f3c0a6" o={0.7} />
          <InFlight x={lerp(1180, 1120, prog(t, g2a, g2b))} y={560} rot={-90} z={34}>
            <g transform="translate(0 26)"><Ship az={58} pal="dusk" t={t} flapFwd={ff} flapAft={ff + 6} id="g2as" /></g>
          </InFlight>
          {svg(<Lamp x={150} y={150} state={t > tVeh + 0.25 ? 'warn' : 'go'} label="VEHICLE" />)}
        </Frame>
      );
    },
  });
  shots.push({
    id: 'G2b_engine', a: g2b, b: g2c, tin: 'cut',
    render: (t) => (
      <Frame>
        <Sky k="dusk" />
        <InFlight x={960} y={lerp(300, 330, prog(t, g2b, g2c))} rot={0} z={44}>
          <Ship az={70} pal="dusk" t={t} engines={0.85 + 0.15 * noise(t * 9, 4)} plumeLen={12} flapFwd={60} flapAft={70} id="g2bs" />
        </InFlight>
        {svg(<Lamp x={150} y={150} state={t > tEng + 0.3 ? 'warn' : 'go'} label="ENGINES" />)}
      </Frame>
    ),
  });
  shots.push({
    id: 'G2c_ground', a: g2c, b: g2d, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [10, CAR + 1, 0], z: lerp(15, 16, prog(t, g2c, g2d)), yaw: -24, pitch: 2};
      const warn = t > tGnd + 0.25;
      return (
        <CatchView t={t} c={c} l="dusk" s={{carY: CAR, open: 30}} hiCarriage={warn ? 0.6 + 0.4 * Math.sin(t * 12) : 0}
          overlay={svg(<Lamp x={150} y={150} state={warn ? 'warn' : 'go'} label="GROUND" />)} />
      );
    },
  });
  shots.push({
    id: 'G2d_nogo', a: g2d, b: g3a, tin: 'cut',
    render: (t) => {
      const stop = prog(t, g2d + 0.5, g2d + 0.8) > 0.5;
      const g = pathAt(GATE);
      return (
        <ApproachMap t={t} dimAfterGate={prog(t, g2d + 0.5, g2d + 1.2)} gateState={stop ? 'stop' : 'off'}>
          <MapShip t={t} u={lerp(0.3, 0.36, prog(t, g2d, g3a))} id="g2ds" />
          {svg(
            <>
              {(['VEHICLE', 'ENGINES', 'GROUND'] as const).map((w, i) => <Lamp key={w} x={g[0] - 90 + i * 90} y={g[1] + 210} r={22} state={i === 2 ? 'warn' : 'go'} />)}
              <Word text="NO-GO" x={g[0]} y={g[1] + 320} size={64} color={C.red} o={prog(t, g2d + 0.5, g2d + 0.8)} />
            </>,
          )}
        </ApproachMap>
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
              <Word text="CATCH CALLED OFF" x={110} y={240} anchor="start" size={60} o={fadeWin(t, wt('S7_02', 'call') - 0.2, g4a, 0.25)} />
            </>,
          )}
        />
      );
    },
  });

  // G4 — one alternate path, from the decision point only; beside the arms there is no guaranteed escape
  const g5a = tProtect - 0.2;
  shots.push({
    id: 'G4_alternate', a: g4a, b: g5a, tin: 'dip', td: 0.4,
    render: (t) => {
      const pu = spline(t, [[g4a, 0.18], [tDetect + 0.1, GATE - 0.01], [tBeside + 1.5, 0.97]]);
      const g = pathAt(GATE);
      const div = (v: number): [number, number] => [lerp(g[0], 1500, v), g[1] + 420 * Math.pow(v, 1.6)];
      const grow = ep(t, tAlt + 0.2, tAlt + 1.2);
      const passed = prog(pu, GATE, GATE + 0.12);
      const red = prog(t, tBeside - 0.1, tBeside + 0.4);
      const near = pathAt(0.8), end = pathAt(1);
      return (
        <ApproachMap t={t} gateState={pu > GATE ? 'go' : 'off'}>
          {svg(
            <>
              <polyline points={Array.from({length: 24}, (_, i) => div((i / 23) * grow)).map((p) => p.join(',')).join(' ')} stroke={C.teal} strokeWidth={9} strokeLinecap="round" fill="none" opacity={1 - 0.7 * passed} />
              <Word text="DIVERT TO SEA" x={1520} y={div(1)[1] - 40} size={50} color={C.teal} o={grow * (1 - 0.7 * passed)} />
              <Word text={`DEPENDS ON WHEN IT'S DETECTED`} x={g[0] + 40} y={g[1] - 250} size={40} color="#fbf4e4" o={fadeWin(t, tDetect - 0.6, tBeside, 0.3)} />
              <path d={`M ${near[0]} ${near[1]} L ${end[0]} ${end[1]}`} stroke={C.red} strokeWidth={16} strokeLinecap="round" opacity={red} />
              <Word text="NO GUARANTEED ESCAPE" x={near[0] + 60} y={near[1] - 110} anchor="start" size={52} color={C.red} o={red * fadeWin(t, tBeside, g5a, 0.2)} />
            </>,
          )}
          <MapShip t={t} u={pu} id="g4s" />
        </ApproachMap>
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
  const tPrize = ls('S8_02'), tJob = ls('S8_03'), tStruct = wt('S8_03', 'structure'), tProving = wt('S8_03', 'proving');
  const tCatch = ls('S8_04'), tInspect = wt('S8_04', 'inspect'), tFly = wt('S8_04', 'fly'), tGoal = ls('S8_05'), tEvery = ls('S8_06');

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

  // H3 — the reuse ambition: Musk at SpaceX's May 2025 update, picture only (wide shot after the source's angle cut)
  const h4a = tJob - 0.2;
  shots.push({
    id: 'H3_realMusk', a: h3a, b: h4a, tin: 'cut',
    render: (t) => (
      <Footage file={MUSK08} a={h3a} src0={9.05} scale={1.04}>
        {svg(<Credit text="SpaceX update · May 2025" o={fadeWin(t, h3a + 0.2, h4a, 0.25)} />)}
      </Footage>
    ),
  });

  // H4 — another job: the recovered Ship 40 (ocean recovery after Flight 13), a worker on its tiles, then a drawn
  // tile close-up matching that shot pulls back to the whole windward side on its stands
  const h4b = h4a + 3.0, h4c = h4b + 2.8, h5a = tCatch - 0.15;
  const s40Credit = 'SpaceX · Ship 40 · Flight 13 ocean recovery';
  shots.push({
    id: 'H4a_realShip40', a: h4a, b: h4b, tin: 'cut',
    render: (t) => <Footage file={S40} a={h4a} src0={0.0}>{svg(<Credit text={s40Credit} o={fadeWin(t, h4a + 0.2, h4b + 3, 0.25)} />)}</Footage>,
  });
  shots.push({
    id: 'H4b_realTiles', a: h4b, b: h4c, tin: 'cut',
    render: (t) => <Footage file={S40} a={h4b} src0={5.4}>{svg(<Credit text={s40Credit} o={fadeWin(t, h4b - 1, h4c - 0.2, 0.25)} />)}</Footage>,
  });
  shots.push({
    id: 'H4c_tileMatch', a: h4c, b: h5a, tin: 'cut',
    render: (t) => {
      const u = ep(t, h4c + 0.15, h5a - 0.2);
      const z = Math.exp(lerp(Math.log(62), Math.log(15.5), u));
      const cx = lerp(1180, 960, u), cy = lerp(700, 560, u);
      const scan = prog(t, tStruct - 0.1, tProving + 0.2);
      const hullTop = cy - 4.5 * z, hullBot = cy + 4.5 * z;
      return (
        <Frame>
          <Sky k="day" horizon={0.62} />
          <rect x={0} y={720} width={1920} height={360} fill="#c9c2b3" />
          <rect x={0} y={720} width={1920} height={6} fill="#9a9384" />
          {/* work stands under the hull */}
          {[-14, 12].map((lx, i) => (
            <g key={i} opacity={u}>
              <rect x={cx + (lx - 2) * z} y={hullBot - 6} width={4 * z} height={Math.max(0, 760 - hullBot + 6)} fill="#e0b440" stroke={C.ink} strokeWidth={3} />
            </g>
          ))}
          <InFlight x={cx} y={cy} rot={-90} z={z}>
            <g transform="translate(0 26)"><Ship az={8} pal="day" t={t} detail id="h4cs" /></g>
          </InFlight>
          {scan > 0 && scan < 1 ? (
            <g>
              <rect x={cx + lerp(-27, 27, scan) * z - 5} y={hullTop - 10} width={10} height={hullBot - hullTop + 20} fill="#2ec4b6" opacity={0.85} />
              <rect x={cx - 27 * z} y={hullTop} width={scan * 54 * z} height={hullBot - hullTop} fill="rgba(46,196,182,0.12)" />
            </g>
          ) : null}
        </Frame>
      );
    },
  });

  // H5 — catch it, inspect it, fly it again, repeat: the work itself, not a diagram
  const h5b = tInspect - 0.08, h5c = tFly - 0.1, h6a = tGoal - 0.16, h6b = h6a + 4.5, h6c = tEvery + 1.5;
  const i1a = h6c + 3.5;
  shots.push({
    id: 'H5a_catchIt', a: h5a, b: h5b, tin: 'cut',
    render: (t) => {
      const contact = tCatch + 0.35;
      const above = approach(t, h5a - 0.6, contact, 5, 0.3);
      const c: Cam3 = {at: [16, CAR + 4, 0], z: 9, yaw: -28, pitch: 2};
      const s: ArmState = {carY: CAR, open: lerp(10, 4, ep(t, h5a, contact)), flex: 0.3 * prog(t, contact, contact + 0.4)};
      return (
        <CatchView t={t} c={c} l="dusk" s={s} sun={[1550, 760]}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="dusk" heading={70} props={{t, id: 'h5as', engines: throttle(t, h5a - 0.3, contact, 0.3), plumeLen: 18, flapFwd: 60, flapAft: 70}} />} />
      );
    },
  });
  shots.push({
    id: 'H5b_realInspect', a: h5b, b: h5c, tin: 'cut',
    render: () => <Footage file={S40} a={h5b} src0={9.2} />,
  });
  shots.push({
    id: 'H5c_flyAgain', a: h5c, b: h6a, tin: 'cut',
    render: (t) => {
      const tl = h5c + 0.35;
      const rise = 0.5 * 7 * Math.pow(Math.max(0, t - tl), 2);
      const u = prog(t, h5c, h6a);
      const c: Cam3 = {at: [VX - 6, lerp(60, 82, ep(t, h5c, h6a)) + rise * 0.7, 0], z: lerp(5.4, 5.0, u), yaw: -26, pitch: 4};
      const base = MOUNT_TOP + 0.6 + rise;
      const eng = prog(t, h5c, tl);
      return (
        <CatchView t={t} c={c} l="day" s={{carY: 120, open: 38}}
          vehicle={
            <>
              <Place c={c} p={[VX, base, 0]}><Booster az={azFor(c, 0)} pal="day" t={t} engines={eng} plumeLen={lerp(10, 46, eng)} id="h5cb" /></Place>
              <Place c={c} p={[VX, base + BOOSTER_LEN, 0]}><Ship az={azFor(c, 70)} pal="day" t={t} id="h5cs" /></Place>
            </>
          }
          fore={eng > 0 ? (
            <g opacity={0.8 * eng}>
              {Array.from({length: 7}, (_, i) => {
                const p = proj(c, [VX + (i - 3) * 9, 4 + noise(t * 2 + i, 7) * 3, 6]);
                return <circle key={i} cx={p[0]} cy={p[1]} r={(40 + 20 * noise(t + i, 3) + 30 * prog(t, tl, h6a)) * c.z / 5} fill="#ece6da" />;
              })}
            </g>
          ) : null}
        />
      );
    },
  });
  shots.push({
    id: 'H6a_realHull', a: h6a, b: h6b, tin: 'cut',
    render: (t) => <Footage file={S40} a={h6a} src0={12.7}>{svg(<Credit text={s40Credit} o={fadeWin(t, h6a + 0.2, h6b, 0.25)} />)}</Footage>,
  });
  // H6b — preparing the next flight: the restacked vehicle on the mount, propellant venting, quick-disconnect arm in
  shots.push({
    id: 'H6b_prep', a: h6b, b: h6c, tin: 'cut',
    render: (t) => {
      const u = ep(t, h6b, h6c, (v) => v);
      const c: Cam3 = {at: [VX - 4, lerp(46, 98, u), 0], z: lerp(7.2, 6.6, u), yaw: lerp(-36, -28, u), pitch: lerp(10, 6, u)};
      const vent = (x: number, y: number, k: number) =>
        Array.from({length: 5}, (_, i) => {
          const ph = (t * 0.5 + i / 5) % 1;
          const p = proj(c, [x + ph * 6, y + ph * 4, 5]);
          return <circle key={i} cx={p[0]} cy={p[1]} r={(1.2 + ph * 3) * c.z} fill="#f4f1ea" opacity={k * (1 - ph) * 0.6} />;
        });
      return (
        <CatchView t={t} c={c} l="night" s={{carY: 132, open: 34}}
          vehicle={
            <>
              <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="night" t={t} id="h6bb" /></Place>
              <Place c={c} p={[VX, MOUNT_TOP + 0.6 + BOOSTER_LEN, 0]}><Ship az={azFor(c, 70)} pal="night" t={t} id="h6bs" /></Place>
            </>
          }
          fore={<g>{vent(VX + 4, 60, 1)}{vent(VX + 4, MOUNT_TOP + 0.6 + BOOSTER_LEN + 20, 0.8)}</g>}
        />
      );
    },
  });
  // H6c — a launch climbing over the coast (Flight 14): the idea completed in picture, without claiming a reflight
  shots.push({
    id: 'H6c_realClimb', a: h6c, b: i1a, tin: 'cut',
    render: (t) => (
      <Footage file={F14L} a={h6c} src0={16.4} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, h6c + 0.2, i1a, 0.25)} />)}
      </Footage>
    ),
  });

  // ---------------- S9: one continuous closing shot, which becomes the end-screen background ----------------
  const tShield = ls('S9_01'), tFlapsF = ls('S9_02'), tEngF = wt('S9_03', 'engines'), tMeet = wt('S9_04', 'meet');
  const tTower = wt('S9_04', 'tower'), tSeq = ls('S9_05');
  const endA = FILM_END - 15; // end-screen spaces: the final fifteen seconds
  const CS = MOUNT_TOP + 0.6 + BOOSTER_LEN + 35.1 - RAIL_DY + 6; // ship catch height: arms above the booster on the mount
  const Yc = shipRestY(CS) + 26; // ship centre at rest
  const tR = tEngF - 0.07; // relight
  const contact = tMeet + 0.15;
  const p = 2.2, v0 = 62;
  const HR = (v0 * (contact - tR)) / p;
  const H = (t: number) => (t < tR ? HR + v0 * (tR - t) : approach(t, tR, contact, HR, 0.35));
  const shipX = (t: number) => VX + 55 * (1 - smoother(prog(t, i1a, contact - 0.6)));
  const rotAt = (t: number) => -90 + 90 * smoother(prog(t, tR + 0.05, tR + 2.3)) + 2 * noise(t * 0.7, 9) * (1 - prog(t, tR, tR + 1));
  const F1 = {at: [17, CS + 2, 0] as V3, z: 13.5, yaw: 22, pitch: -4};
  const F2 = {at: [10, 80, 0] as V3, z: 4.6, yaw: 18, pitch: 3};
  const pullA = tSeq - 0.6, pullB = endA;
  const camAt = (t: number): Cam3 => {
    const sc: V3 = [shipX(t), Yc + H(t), 0];
    const yaw = spline(t, [[i1a, 95], [tShield, 88], [tFlapsF - 0.3, 82], [tR, 42], [contact, F1.yaw], [pullA, F1.yaw], [pullB, F2.yaw]]);
    const zz = spline(t, [[i1a, 13], [tShield - 0.4, 16], [tShield + 0.9, 32], [tFlapsF + 0.3, 18], [tR, 14], [contact, F1.z], [pullA, 14.4]]);
    const w = smoother(prog(t, tR + 0.6, contact - 0.3));
    const track: V3 = [sc[0], sc[1] + lerp(0, 4, prog(t, tFlapsF, tR)), 0];
    let at: V3 = [lerp(track[0], F1.at[0], w), lerp(track[1], F1.at[1], w), 0];
    let z = zz;
    let pitch = lerp(-1, F1.pitch, w);
    if (t > pullA) {
      const k = smoother(prog(t, pullA, pullB));
      at = [lerp(F1.at[0], F2.at[0], k), lerp(F1.at[1], F2.at[1], k), 0];
      z = Math.exp(lerp(Math.log(14.4), Math.log(F2.z), k));
      pitch = lerp(F1.pitch, F2.pitch, k);
    }
    return {at, z, yaw, pitch};
  };
  const closing = (t: number, end: boolean) => {
    const c = camAt(t);
    const above = H(t);
    const rot = rotAt(t);
    const s: ArmState = {carY: CS, open: lerp(14, 4, ep(t, contact - 2.6, contact)), flex: 0.35 * prog(t, contact, contact + 0.6) * (1 - prog(t, contact + 2, contact + 4))};
    const eng = throttle(t, tR + 0.15, contact + 0.1, 0.6);
    const flapsUp = smoother(prog(t, tR, tR + 2));
    const ff = lerp(25 + 20 * Math.sin(t * 1.9), 60, flapsUp), fa = lerp(32 - 16 * Math.sin(t * 1.9 + 0.8), 70, flapsUp);
    const loadK = fadeWin(t, tTower - 0.2, pullA + 0.6, 0.3);
    const pin = proj(c, [VX, CS + RAIL_DY + 0.6, ARM_Z - 1.3]);
    const fall = 1 - prog(t, tR, tR + 1.2);
    const beacon = proj(c, [0, TOWER_H + 1, 0]);
    const blink = end ? (Math.sin(t * Math.PI * 1.1) > 0.6 ? 1 : 0.15) : 0;
    const vent = (x: number, y: number, k: number) =>
      Array.from({length: 4}, (_, i) => {
        const ph = (t * 0.25 + i / 4) % 1;
        const q = proj(c, [x + ph * 5, y + ph * 6, 5]);
        return <circle key={i} cx={q[0]} cy={q[1]} r={(1 + ph * 2.5) * c.z} fill="#f4e6dc" opacity={k * (1 - ph) * 0.45} />;
      });
    const settled = prog(t, contact + 1, contact + 3);
    return (
      <CatchView t={t} c={c} l="dusk" s={s} hiRail={loadK * 0.7} hiTruss={loadK * 0.5} sun={[1550, 760]}
        under={<Streaks t={t} dir={[0, -1]} k={0.4 * fall * prog(t, i1a, i1a + 0.5)} color="rgba(255,236,220,0.3)" />}
        fore={
          <>
            <PinMark c={c} s={s} above={Math.max(above, -0.3)} hi={loadK} />
            {settled > 0 ? <g>{vent(VX + 3, MOUNT_TOP + 0.6 + BOOSTER_LEN - 6, settled)}{vent(VX + 3, Yc - 10, settled * 0.7)}</g> : null}
            {blink > 0 ? <circle cx={beacon[0]} cy={beacon[1]} r={4 + 4 * blink} fill="#ff4b3e" opacity={blink} /> : null}
          </>
        }
        vehicle={
          <>
            <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="dusk" t={t} id={end ? 'jb' : 'i1b'} /></Place>
            <ShipWorld c={c} p={[shipX(t), Yc + above, 0]} rot={rot}>
              <Ship az={azFor(c, -90)} pal="dusk" t={t} heat={0.3 * (1 - prog(t, i1a, tShield + 1.2))} detail engines={eng} plumeLen={28} flapFwd={ff} flapAft={fa} id={end ? 'js' : 'i1s'} />
            </ShipWorld>
          </>
        }
        overlay={end ? null : svg(<Arrow x={pin[0]} y={pin[1] - 200} dx={0} dy={170} o={loadK * (1 - prog(t, pullA, pullA + 0.5))} />)}
      />
    );
  };

  shots.push({id: 'I1_handoff', a: i1a, b: endA, tin: 'dip', td: 0.5, render: (t) => closing(t, false)});

  // J1 — end screen: the same composition held, two recessed panels for YouTube video elements, small identity above
  shots.push({
    id: 'J1_endScreen', a: endA, b: FILM_END + 1, tin: 'cut',
    render: (t) => {
      const e = ep(t, endA, endA + 0.5);
      const txt = ep(t, endA + 0.2, endA + 0.8);
      return (
        <>
          {closing(t, true)}
          {svg(
            <>
              <rect width={1920} height={1080} fill="#0b0d14" opacity={0.18 * e} />
              {END_PANELS.map((pn, i) => (
                <g key={i} opacity={e} transform={`translate(0 ${12 * (1 - e)})`}>
                  <rect x={pn.x + 6} y={pn.y + 8} width={pn.w} height={pn.h} rx={10} fill="rgba(0,0,0,0.35)" />
                  <rect x={pn.x} y={pn.y} width={pn.w} height={pn.h} rx={10} fill="#080b10" fillOpacity={0.88} stroke="rgba(251,244,228,0.3)" strokeWidth={2} />
                  <rect x={pn.x + 5} y={pn.y + 5} width={pn.w - 10} height={pn.h - 10} rx={7} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={6} />
                </g>
              ))}
              <text x={960} y={112} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={26} fill={C.cream} letterSpacing={7} opacity={txt * 0.9} style={{paintOrder: 'stroke'}} stroke="rgba(0,0,0,0.45)" strokeWidth={4}>FUTURE GOT WEIRD</text>
              <text x={960} y={180} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={50} fill={C.yellow} letterSpacing={3} opacity={txt} style={{paintOrder: 'stroke'}} stroke={C.ink} strokeWidth={5}>KEEP EXPLORING</text>
            </>,
          )}
        </>
      );
    },
  });
  return shots;
};

/** End-screen panel bounds (1920×1080), for the change note and QA. */
export const END_PANELS = [{x: 180, y: 360, w: 660, h: 371}, {x: 1080, y: 360, w: 660, h: 371}];

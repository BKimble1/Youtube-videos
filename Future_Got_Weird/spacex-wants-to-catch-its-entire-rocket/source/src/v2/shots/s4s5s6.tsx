// "The flip" (S4), "The machine receiving it" (S5), "Three small changes" (S6).
import React from 'react';
import {ep, prog, clamp, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, proj, poly, V3} from '../cam3';
import {ArmState, VX, RAIL_DY, ARM_Z, TW, PinMark, Arm, armPt, LIGHTS} from '../site';
import {Booster, Ship, R, FinTopView} from '../vehicles';
import {Clouds, Credit, Frame, Sky, Tag, Word, SeaPlane} from '../scene';
import {F14O, Footage, HAS_OCEAN_CLIP, Shot} from '../timeline';
import {CatchView, InFlight, ShipAt, BoosterAt, Streaks, approach, throttle, shipRestY} from './common';
import {Arrow} from './s2s3';
import {ls, ss, wt} from '../time';
import {C} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = 98;

/** Flip pose for a manoeuvre progress f (0 horizontal belly-down → 1 upright). Engines from 0.08. */
const flipPose = (f: number) => ({rot: lerp(-90, 0, smoother(clamp(f))), eng: clamp(f / 0.08), flapAft: lerp(30, 70, clamp(f * 1.5)), flapFwd: lerp(20, 60, clamp(f * 1.5))});

export const s4s5s6Shots = (): Shot[] => {
  const shots: Shot[] = [];
  const s4 = ss('S4');
  const tFlaps = wt('S4_00', 'flaps'), tRelight = wt('S4_01', 'relight'), tUpright = wt('S4_01', 'upright');
  const tDemo = ls('S4_02'), tOcean = wt('S4_02', 'ocean'), tWatch = ls('S4_03'), tFalling = ls('S4_04'), tPowered = wt('S4_04', 'powered'), tDescent = wt('S4_04', 'descent', 0, 'e');
  const tPlanned = ls('S4_05'), tNeeds = ls('S4_06'), tPos = wt('S4_06', 'position'), tOri = wt('S4_06', 'orientation'), tMot = wt('S4_06', 'motion'), tReach = wt('S4_06', 'reach');
  const tProves = ls('S4_07'), tExtra = ls('S4_08'), tPut = ls('S4_09'), tActually = wt('S4_09', 'actually');

  // D1 — broadside belly-flop, flaps working
  const d1a = s4 - 0.2, d2a = tRelight - 0.55;
  shots.push({
    id: 'D1_bellyflop', a: d1a, b: d2a, tin: 'cut',
    render: (t) => {
      const ff = 25 + 22 * Math.sin(t * 1.7) + 6 * noise(t * 2, 1);
      const fa = 30 - 18 * Math.sin(t * 1.7 + 0.8);
      const u = prog(t, d1a, d2a);
      const z = lerp(13, 15, u);
      const x = 960, y = 520 + 10 * noise(t * 0.7, 3);
      const hiF = fadeWin(t, tFlaps - 0.1, d2a, 0.25);
      const fwdTip = [x - 40 * z, y], aftTip = [x + 8 * z, y];
      return (
        <Frame>
          <Sky k="day" />
          <Clouds n={12} seed={41} y0={-300} y1={1400} dy={-t * 520} dx={0} s={1.3} o={0.85} />
          <Streaks t={t} dir={[0, -1]} k={0.4} />
          <InFlight x={x} y={y} rot={-90 + 2.5 * noise(t * 0.8, 5)} z={z}>
            <g transform="translate(0 26)"><Ship az={58} pal="day" t={t} flapFwd={ff} flapAft={fa} id="d1s" /></g>
          </InFlight>
          {svg(
            <>
              <Tag text="FLAPS" x={x - 14 * z - 200} y={300} to={[x - 14 * z, y - 3.5 * z]} o={hiF} size={36} />
              <Tag text="FLAPS" x={x + 19 * z + 240} y={300} to={[x + 19 * z, y - 3.5 * z]} o={hiF} size={36} align="r" />
            </>,
          )}
        </Frame>
      );
    },
  });

  // D2 — engines relight; the tail swings down and the ship comes up toward upright (close, following the tail)
  const d3a = tDemo - 0.25;
  shots.push({
    id: 'D2_relight', a: d2a, b: d3a, tin: 'cut',
    render: (t) => {
      const f = ep(t, tRelight - 0.1, d3a + 0.6, (u) => u);
      const p = flipPose(f);
      const z = 14;
      return (
        <Frame>
          <Sky k="day" />
          <Clouds n={12} seed={41} y0={-300} y1={1400} dy={-t * lerp(520, 260, f)} s={1.3} o={0.85} />
          <InFlight x={lerp(1040, 960, f)} y={lerp(470, 430, f)} rot={p.rot} z={z}>
            <g transform="translate(0 26)"><Ship az={lerp(58, 100, f)} pal="day" t={t} engines={p.eng} plumeLen={30} flapFwd={p.flapFwd} flapAft={p.flapAft} id="d2s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });

  // D3 — over the ocean: upright on the landing burn down to the water (the slot for the Flight 14 ocean-return clip)
  const d4a = tWatch - 0.2;
  shots.push({
    id: 'D3_ocean', a: d3a, b: d4a, tin: 'cut',
    render: (t) => {
      if (HAS_OCEAN_CLIP) {
        return (
          <Footage file={F14O} a={d3a} src0={14.5} scale={1.15} cx={0.5} cy={0}>
            {svg(<Credit text="SpaceX · Flight 14, 2026" o={fadeWin(t, d3a + 0.3, d4a - 0.1, 0.3)} />)}
          </Footage>
        );
      }
      const u = prog(t, d3a, d4a);
      const h = lerp(42, 2, ep(t, d3a, d4a - 0.2, (v) => 1 - Math.pow(1 - v, 1.8)));
      const sea = 900;
      const z = 7;
      const spray = prog(h, 18, 2);
      return (
        <Frame>
          <Sky k="gulf" horizon={0.6} />
          <SeaPlane y={600} t={t} />
          <g opacity={spray}>
            {Array.from({length: 14}, (_, i) => {
              const a = (i / 13 - 0.5) * 2.4;
              const L = 60 + 140 * spray + 30 * noise(t * 4, i);
              return <ellipse key={i} cx={960 + Math.sin(a) * L * 1.6} cy={sea - Math.abs(Math.cos(a)) * L * 0.25} rx={50} ry={22} fill="#ffffff" opacity={0.55} />;
            })}
          </g>
          <InFlight x={960} y={sea - h * z - 20} rot={2 * noise(t, 2)} z={z}>
            <Ship az={110} pal="day" t={t} engines={1} plumeLen={Math.min(26, h + 4)} flapFwd={60} flapAft={70} id="d3s" />
          </InFlight>
          <Word text="OCEAN" x={1780} y={160} anchor="end" size={60} color="#fbf4e4" o={fadeWin(t, tDemo + 0.2, d4a, 0.3)} />
        </Frame>
      );
    },
  });

  // D4 — watch the change: one exposure per beat, from falling sideways to a powered, nearly vertical descent
  const d5a = tPlanned - 0.25;
  shots.push({
    id: 'D4_strobe', a: d4a, b: d5a, tin: 'fade', td: 0.35,
    render: (t) => {
      const N = 7;
      const path = (f: number): [number, number] => [lerp(330, 1180, f), lerp(260, 620, Math.pow(f, 1.4))];
      const shown = prog(t, tWatch + 0.3, tDescent - 0.2) * (N - 1);
      const z = 4.6;
      return (
        <Frame>
          <Sky k="gulf" horizon={0.92} />
          <rect x={0} y={970} width={1920} height={110} fill="#3f7fae" />
          {Array.from({length: N}, (_, i) => {
            const f = i / (N - 1);
            const o = clamp(shown - i + 1);
            if (o <= 0) return null;
            const p = flipPose(f);
            const [x, y] = path(f);
            const last = i === N - 1 || i === Math.floor(shown);
            return (
              <g key={i} opacity={o * (last ? 1 : 0.45)}>
                <InFlight x={x} y={y} rot={p.rot} z={z}>
                  <g transform="translate(0 26)"><Ship az={100} pal="day" t={t} engines={f > 0.05 ? 1 : 0} plumeLen={18} flapFwd={p.flapFwd} flapAft={p.flapAft} id={`d4s${i}`} /></g>
                </InFlight>
              </g>
            );
          })}
          <Word text="FALLING SIDEWAYS" x={330} y={140} anchor="start" size={64} color="#fbf4e4" o={fadeWin(t, tFalling - 0.1, d5a, 0.25)} />
          <Word text="POWERED, NEARLY VERTICAL" x={1860} y={980} anchor="end" size={64} o={fadeWin(t, tPowered - 0.1, d5a, 0.25)} />
        </Frame>
      );
    },
  });

  // D5 — same upright pose, now beside the illustrated tower: the planned catch adds a physical target
  const d6a = tNeeds - 0.15;
  shots.push({
    id: 'D5_target', a: d5a, b: d6a, tin: 'column',
    render: (t) => {
      const u = ep(t, d5a, d6a);
      const c: Cam3 = {at: [VX - 2, lerp(shipRestY(CAR) + 50, CAR + 2, u), 0], z: lerp(12, 8.5, u), yaw: -24, pitch: lerp(-2, 3, u)};
      const s: ArmState = {carY: CAR, open: 18};
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, wt('S4_05', 'target') - 0.4, d6a + 1, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR} above={lerp(34, 26, u)} l="day" heading={70} props={{engines: 1, t, id: 'd5s', plumeLen: 24, flapFwd: 60, flapAft: 70}} />}
        />
      );
    },
  });

  // D6 — position, orientation, motion when the support features reach the arms
  const d7a = tProves - 0.2;
  shots.push({
    id: 'D6_conditions', a: d6a, b: d7a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 3, CAR + 4, 0], z: 11, yaw: -18, pitch: 2};
      const s: ArmState = {carY: CAR, open: lerp(18, 6, ep(t, d6a, tReach))};
      const above = lerp(18, 3.5, ep(t, d6a, d7a));
      const v = 18 * (1 - ep(t, d6a, d7a));
      const posK = fadeWin(t, tPos - 0.1, d7a, 0.2), oriK = fadeWin(t, tOri - 0.1, d7a, 0.2), motK = fadeWin(t, tMot - 0.1, d7a, 0.2);
      const fit = proj(c, [VX, shipRestY(CAR) + above + 35.6, ARM_Z - 1.3]);
      const rail = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3]);
      const nose = proj(c, [VX, shipRestY(CAR) + above + 52, 0]), base = proj(c, [VX, shipRestY(CAR) + above, 0]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={posK}
          fore={<PinMark c={c} s={s} above={above + 0.5} hi={1} />}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="day" heading={70} props={{engines: 1, t, id: 'd6s', plumeLen: 20, flapFwd: 60, flapAft: 70}} />}
          overlay={svg(
            <>
              <g opacity={posK}>
                <line x1={fit[0]} y1={fit[1]} x2={rail[0]} y2={rail[1]} stroke={C.yellow} strokeWidth={5} strokeDasharray="12 10" />
                <Word text="POSITION" x={fit[0] + 120} y={fit[1] - 40} anchor="start" size={52} o={1} />
              </g>
              <g opacity={oriK}>
                <line x1={nose[0]} y1={nose[1] - 60} x2={base[0]} y2={base[1] + 60} stroke="#fbf4e4" strokeWidth={4} strokeDasharray="14 10" />
                <Word text="ORIENTATION" x={nose[0] - 140} y={nose[1] - 20} anchor="end" size={52} color="#fbf4e4" o={1} />
              </g>
              <g opacity={motK}>
                <Arrow x={base[0] - 220} y={base[1] - 200} dx={0} dy={20 + v * 9} color="#fbf4e4" />
                <Word text="MOTION" x={base[0] - 260} y={base[1] - 230} anchor="end" size={52} color="#fbf4e4" o={1} />
              </g>
            </>,
          )}
        />
      );
    },
  });

  // D7 — the ocean landings cover most of the sequence; the tower adds the last step
  const d8a = tExtra - 0.2;
  shots.push({
    id: 'D7_sequence', a: d7a, b: d8a, tin: 'dip', td: 0.45,
    render: (t) => {
      const panels = [
        {x: 260, rot: -90, heat: 1, eng: 0},
        {x: 700, rot: -45, heat: 0, eng: 1},
        {x: 1140, rot: 0, heat: 0, eng: 1},
      ];
      const k = (i: number) => prog(t, d7a + 0.15 + i * 0.35, d7a + 0.45 + i * 0.35);
      const br = prog(t, wt('S4_07', 'proves') - 0.2, wt('S4_07', 'proves') + 0.3);
      const q = prog(t, wt('S4_07', 'sequence') - 0.4, wt('S4_07', 'sequence'));
      const push = 1 + 0.06 * prog(t, d7a, d8a);
      return (
        <Frame>
          <Sky k="gulf" horizon={0.95} />
          <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`}>
          {panels.map((p, i) => (
            <g key={i} opacity={k(i)}>
              <rect x={p.x - 190} y={250} width={380} height={480} rx={24} fill="rgba(20,25,31,0.18)" />
              <InFlight x={p.x} y={500} rot={p.rot} z={5}>
                <g transform="translate(0 26)"><Ship az={100} pal="day" t={t} heat={p.heat} engines={p.eng} plumeLen={16} flapFwd={40} flapAft={50} id={`d7s${i}`} /></g>
              </InFlight>
            </g>
          ))}
          <g opacity={k(3)}>
            <rect x={1390} y={250} width={380} height={480} rx={24} fill="rgba(20,25,31,0.18)" />
            <g transform="translate(1520 330)">
              <rect x={-30} y={0} width={30} height={380} fill="#38424d" />
              <rect x={0} y={170} width={150} height={26} fill="#46525e" stroke={C.ink} strokeWidth={3} />
              <rect x={0} y={190} width={150} height={6} fill="#ffc93c" />
            </g>
            <InFlight x={1630} y={560} rot={0} z={5}><Ship az={100} pal="day" t={t} engines={1} plumeLen={10} flapFwd={60} flapAft={70} id="d7s3" /></InFlight>
          </g>
          <g opacity={br}>
            <path d="M 80 790 L 80 820 L 1320 820 L 1320 790" stroke="#fbf4e4" strokeWidth={8} fill="none" strokeLinejoin="round" />
            <Word text="DEMONSTRATED OVER THE OCEAN" x={700} y={900} size={54} color="#fbf4e4" o={1} />
          </g>
          <Word text="PLANNED" x={1580} y={900} size={54} o={q} />
          </g>
        </Frame>
      );
    },
  });

  // D8 — something extra: put the attachment points exactly where the receiving surfaces will be
  const e1a = ss('S5') - 1.6;
  shots.push({
    id: 'D8_extra', a: d8a, b: e1a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 1, CAR + 3.6, ARM_Z - 1.3], z: lerp(46, 52, prog(t, d8a, e1a)), yaw: -30, pitch: 8};
      const s: ArmState = {carY: CAR, open: lerp(9, 4, ep(t, d8a, tActually))};
      const above = lerp(7, 0.7, ep(t, d8a, e1a));
      const align = fadeWin(t, tPut - 0.1, e1a + 1, 0.3);
      const a1 = proj(c, [VX, CAR + RAIL_DY + above + 0.4, ARM_Z - 1.3]), a2 = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={align} mount={false} farm={false}
          fore={<PinMark c={c} s={s} above={above} hi={1} />}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="day" heading={70} props={{engines: 0.9, t, id: 'd8s', flapFwd: 60, flapAft: 70}} />}
          overlay={svg(
            <g opacity={align}>
              <line x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke={C.yellow} strokeWidth={6} strokeDasharray="14 10" />
            </g>,
          )}
        />
      );
    },
  });

  // ---------------- S5 ----------------
  const tMoving = wt('S5_00', 'machine'), tSwing = wt('S5_01', 'swing'), tCarriage = wt('S5_01', 'carriage'), tTowerE = wt('S5_01', 'tower', 0, 'e');
  const tTruss = ls('S5_02'), tLoadP = ls('S5_03'), tInto = wt('S5_03', 'carriage'), tDown = wt('S5_03', 'down'), tGround = wt('S5_03', 'ground');
  const tNewer = ls('S5_04'), tShorter = wt('S5_04', 'shorter'), tFins = wt('S5_04', 'three'), tCatchF = wt('S5_04', 'revised');
  const tMoment = ls('S5_05'), tOne = wt('S5_05', 'one'), tCraft = ls('S5_06'), tHand = ls('S5_07');

  // E1 — pull back from the rail along the arm to its carriage: a moving machine
  const e2a = tSwing - 0.5;
  shots.push({
    id: 'E1_pullback', a: e1a, b: e2a, tin: 'cut',
    render: (t) => {
      const u = ep(t, e1a, e2a - 0.2);
      const c: Cam3 = {at: [lerp(VX, 4, u), lerp(CAR + 3, CAR - 18, u), lerp(ARM_Z - 1.3, 0, u)], z: Math.exp(lerp(Math.log(46), Math.log(5.6), u)), yaw: lerp(-30, -32, u), pitch: lerp(8, 6, u)};
      const s: ArmState = {carY: CAR, open: 4};
      return <CatchView t={t} c={c} l="day" s={s} hiRail={1 - u} />;
    },
  });

  // E2 — the arms swing; the carriage travels: two separate motions
  const e3a = tTruss - 0.2;
  shots.push({
    id: 'E2_motions', a: e2a, b: e3a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [6, CAR - 8, 0], z: 5.6, yaw: -32, pitch: 6};
      const sw = Math.sin(Math.PI * ep(t, tSwing - 0.3, tCarriage - 0.1));
      const car = CAR + 16 * Math.sin(Math.PI * ep(t, tCarriage - 0.1, tTowerE + 0.2));
      const s: ArmState = {carY: car, open: 6 + 34 * sw};
      const arm = proj(c, armPt(s, 1, 0.9, 0, 0)), carP = proj(c, [-TW - 2, car, 0]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiCarriage={fadeWin(t, tCarriage - 0.1, e3a + 0.4, 0.2)}
          overlay={svg(
            <>
              <Tag text="SWING" x={arm[0] + 70} y={arm[1] + 90} to={[arm[0], arm[1] + 10]} o={fadeWin(t, tSwing - 0.2, tCarriage, 0.2)} size={40} />
              <Tag text="TRAVEL" x={carP[0] - 60} y={carP[1]} to={[carP[0] + 20, carP[1]]} o={fadeWin(t, tCarriage - 0.1, e3a + 0.3, 0.2)} size={40} align="r" />
            </>,
          )}
        />
      );
    },
  });

  // E3 + E4 — the deep trusses underneath, then the load path: rail → diagonals → carriage → mast → ground
  const e5a = tNewer - 0.25;
  shots.push({
    id: 'E3_loadpath', a: e3a, b: e5a, tin: 'cut',
    render: (t) => {
      const follow = ep(t, tInto - 0.2, tGround + 0.4);
      const c: Cam3 = {
        at: [lerp(18, 0, ep(t, tLoadP, tInto + 0.3)), lerp(CAR - 4, 30, follow), 0],
        z: lerp(lerp(13, 10, prog(t, e3a, tLoadP)), 4.6, follow), yaw: lerp(-38, -30, follow), pitch: lerp(-12, 4, ep(t, e3a, tInto)),
      };
      const s: ArmState = {carY: CAR, open: 4, flex: 0.3};
      const loadU = ep(t, tLoadP + 0.2, tInto - 0.1);
      const trussK = fadeWin(t, tTruss, e5a, 0.3);
      const carK = fadeWin(t, tInto - 0.2, e5a, 0.2);
      const down = ep(t, tDown - 0.2, tGround);
      const legs = ([[TW, TW], [TW, -TW], [-TW, TW], [-TW, -TW]] as [number, number][]).map(([x, z]) => [proj(c, [x, CAR - 8, z]), proj(c, [x, 0, z])]);
      const gp = proj(c, [0, 0, 0]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiTruss={trussK} load={t < tLoadP ? -1 : loadU} hiCarriage={carK}
          vehicle={<BoosterAt c={c} carY={CAR} above={-0.3} v="v3" l="day" heading={0} props={{t, id: 'e3b'}} />}
          overlay={svg(
            <>
              {down > 0 ? legs.map(([a, b], i) => (
                <line key={i} x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], down)} y2={lerp(a[1], b[1], down)} stroke={C.yellow} strokeWidth={7} strokeLinecap="round" opacity={0.9 * (1 - prog(t, e5a - 0.5, e5a))} />
              )) : null}
              <ellipse cx={gp[0]} cy={gp[1]} rx={160 * prog(t, tGround - 0.1, tGround + 0.4)} ry={30 * prog(t, tGround - 0.1, tGround + 0.4)} fill="none" stroke={C.yellow} strokeWidth={6} opacity={1 - prog(t, tGround + 0.4, e5a)} />
            </>,
          )}
        />
      );
    },
  });

  // E5 — newer tower: shorter arms (old length ghosted); newer booster: three larger grid fins, revised catch features
  const e6a = tMoment - 0.2;
  shots.push({
    id: 'E5_newer', a: e5a, b: tFins - 0.35, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [10, CAR - 2, 0], z: 9, yaw: -40, pitch: 10};
      const s: ArmState = {carY: CAR, open: 8};
      const g = fadeWin(t, tShorter - 0.3, tFins, 0.2);
      return (
        <CatchView t={t} c={c} l="day" s={s}
          fore={<g opacity={0.35 * g}>{([1, -1] as const).map((sd) => <Arm key={sd} c={c} s={{...s, len: 40}} side={sd} l="studio" />)}</g>}
          overlay={svg(<Word text="SHORTER ARMS" x={1760} y={200} anchor="end" size={64} color="#fbf4e4" o={g} />)}
        />
      );
    },
  });
  shots.push({
    id: 'E5b_fins', a: tFins - 0.35, b: e6a, tin: 'cut',
    render: (t) => {
      const rot = 10 + 40 * prog(t, tFins - 0.35, e6a);
      const hi = prog(t, tCatchF - 0.2, tCatchF + 0.2);
      return (
        <Frame>
          <Sky k="studio" />
          <g transform={`translate(960 ${600}) scale(${lerp(54, 60, prog(t, tFins, e6a))})`}>
            <FinTopView elev={34} rot={rot} catchHi={hi} />
          </g>
          <Word text="3 LARGER GRID FINS" x={1820} y={170} anchor="end" size={64} color="#2b3540" o={fadeWin(t, tFins - 0.1, e6a, 0.2)} />
          <Word text="REVISED CATCH FEATURES" x={1820} y={1000} anchor="end" size={56} o={fadeWin(t, tCatchF - 0.1, e6a, 0.2)} />
        </Frame>
      );
    },
  });

  // E6 — flying machinery and ground machinery become one supported structure
  const e7a = tCraft - 0.2;
  shots.push({
    id: 'E6_one', a: e6a, b: e7a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [10, CAR - 22, 0], z: lerp(5.4, 5.0, prog(t, e6a, e7a)), yaw: -24, pitch: 4};
      const s: ArmState = {carY: CAR, open: lerp(14, 4, ep(t, e6a, tOne - 0.4))};
      const above = approach(t, e6a - 0.5, tOne - 0.2, 20);
      const one = prog(t, tOne - 0.1, tOne + 0.4);
      return (
        <CatchView t={t} c={c} l="dusk" s={s} hiTruss={one * 0.6} hiCarriage={one}
          vehicle={
            <g style={one > 0 ? {filter: `drop-shadow(0 0 ${5 * one}px rgba(255,201,60,${one}))`} : undefined}>
              <BoosterAt c={c} carY={CAR} above={above} v="v3" l="dusk" heading={0} props={{t, engines: throttle(t, e6a - 0.5, tOne - 0.2, 0.6), plumeLen: 36, id: 'e6b'}} />
            </g>
          }
        />
      );
    },
  });

  // E7 — each machine completes its own movement, in the right condition, at the right moment: the handoff
  const f0a = ss('S6') - 1.0;
  shots.push({
    id: 'E7_handoff', a: e7a, b: f0a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 6, CAR + 8, 0], z: 9.5, yaw: -22, pitch: 3};
      const end = tHand + 0.4;
      const s: ArmState = {carY: lerp(CAR + 6, CAR, ep(t, e7a, end)), open: lerp(34, 5, ep(t, e7a, end))};
      const above = lerp(30, 0.8, ep(t, e7a, end));
      return (
        <CatchView t={t} c={c} l="dusk" s={s} hiRail={fadeWin(t, tHand - 0.3, f0a + 1, 0.3)}
          fore={<PinMark c={c} s={s} above={above} hi={1} />}
          vehicle={<ShipAt c={c} carY={s.carY} above={above + (s.carY - CAR) * 0} l="dusk" heading={70} props={{engines: 0.9, t, id: 'e7s', flapFwd: 60, flapAft: 70}} />}
          overlay={svg(<Word text="THE HANDOFF" x={960} y={170} size={78} o={fadeWin(t, tHand - 0.1, f0a, 0.2)} />)}
        />
      );
    },
  });

  // ---------------- S6: one change at a time, front view looking down the arms ----------------
  const tDrift = ls('S6_01'), tMiss = wt('S6_01', 'miss'), tTilt = ls('S6_02'), tFirst = wt('S6_02', 'before'), tShared = wt('S6_02', 'shared');
  const tFast = ls('S6_03'), tImpact = wt('S6_03', 'impact'), tSimple = ls('S6_04'), tCoop = ls('S6_05');
  const tCant = ls('S6_06'), tRemain = wt('S6_06', 'remain'), tSite = ls('S6_07'), tNext = wt('S6_07', 'next');
  const FV: Cam3 = {at: [VX, CAR - 1, 0], z: 23, yaw: -90, pitch: 6};
  const sF: ArmState = {carY: CAR, open: 0};

  type Var = {dz: number; tilt: number; above: number; eng: number};
  const FrontDemo: React.FC<{t: number; v: Var; ghost?: Var | null; word?: string; wo?: number; impact?: number; overlay?: React.ReactNode}> = ({t, v, ghost, word, wo = 0, impact = 0, overlay}) => {
    const shipNode = (q: Var, id: string, gh = false) => (
      <ShipAtFront t={t} q={q} id={id} ghost={gh} />
    );
    return (
      <CatchView t={t} c={FV} l="studio" s={{...sF, flex: impact * 0.8}} clouds={false} mount={false} farm={false} hiRail={0.8}
        vehicle={<>{ghost ? shipNode(ghost, 'fg', true) : null}{shipNode(v, 'fv')}</>}
        overlay={svg(
          <>
            {word ? <Word text={word} x={300} y={200} size={110} o={wo} /> : null}
            {impact > 0 ? <circle cx={960} cy={proj(FV, [VX, CAR + RAIL_DY, 0])[1]} r={300 * impact} fill="none" stroke={C.red} strokeWidth={14 * (1 - impact)} opacity={1 - impact} /> : null}
            {overlay}
          </>,
        )}
      />
    );
  };
  const ShipAtFront: React.FC<{t: number; q: Var; id: string; ghost?: boolean}> = ({t, q, id, ghost}) => {
    const p = proj(FV, [VX, shipRestY(CAR) + q.above, q.dz]);
    return (
      <g transform={`translate(${p[0]} ${p[1] - 35.6 * FV.z}) rotate(${q.tilt}) translate(0 ${35.6 * FV.z}) scale(${FV.z})`} opacity={ghost ? 0.3 : 1}>
        <Ship az={180} pal="studio" t={t} engines={q.eng} plumeLen={16} flapFwd={60} flapAft={70} id={id} fittings={1} />
      </g>
    );
  };
  const base: Var = {dz: 0, tilt: 0, above: 0, eng: 0};

  // F0 — baseline
  const f1a = tDrift - 0.2;
  shots.push({
    id: 'F0_baseline', a: f0a, b: f1a, tin: 'dip', td: 0.5,
    render: (t) => {
      const above = approach(t, f0a, f1a - 0.5, 12, 0.15);
      return <FrontDemo t={t} v={{...base, above, eng: throttle(t, f0a, f1a - 0.5, 0.4)}} word="BASELINE" wo={fadeWin(t, f0a + 0.3, f1a, 0.2) * 0.85} />;
    },
  });
  // F1 — drift: one support feature misses its rail
  const f2a = tTilt - 0.2;
  shots.push({
    id: 'F1_drift', a: f1a, b: f2a, tin: 'cut',
    render: (t) => {
      const u = ep(t, f1a + 0.2, tMiss + 0.4);
      const above = lerp(12, -2.5, u) - 6 * ep(t, tMiss + 0.4, f2a, (v) => v * v);
      const dz = lerp(0, 2.6, ep(t, f1a + 0.2, tMiss));
      return <FrontDemo t={t} v={{dz, tilt: 0, above, eng: 1 - prog(t, tMiss + 0.3, tMiss + 0.6)}} ghost={{...base, above: Math.max(0, above)}} word="DRIFT" wo={fadeWin(t, f1a + 0.1, f2a, 0.2)} />;
    },
  });
  // F2 — tilt: one side meets the arms first
  const f3a = tFast - 0.2;
  shots.push({
    id: 'F2_tilt', a: f2a, b: f3a, tin: 'cut',
    render: (t) => {
      const above = approach(t, f2a + 0.1, tFirst, 12, 0.1);
      const tilt = 4.5 * (1 - 0.3 * prog(t, tFirst, tShared));
      const one = prog(t, tFirst - 0.1, tFirst + 0.2) * (1 - prog(t, f3a - 0.4, f3a));
      const pr = proj(FV, [VX, CAR + RAIL_DY, ARM_Z - 1.3]), pl = proj(FV, [VX, CAR + RAIL_DY, -(ARM_Z - 1.3)]);
      return (
        <FrontDemo t={t} v={{dz: 0, tilt, above: above + 0.9, eng: throttle(t, f2a, tFirst, 0.5)}} ghost={base} word="TILT" wo={fadeWin(t, f2a + 0.1, f3a, 0.2)}
          overlay={<>
            <Arrow x={pr[0]} y={pr[1] - 230} dx={0} dy={200} color={C.red} o={one} w={14} />
            <Arrow x={pl[0]} y={pl[1] - 120} dx={0} dy={80} o={one} w={8} />
          </>} />
      );
    },
  });
  // F3 — too fast: a gentle handoff becomes an impact
  const f4a = tSimple - 0.2;
  shots.push({
    id: 'F3_fast', a: f3a, b: f4a, tin: 'cut',
    render: (t) => {
      const hit = tImpact - 0.15;
      const above = t < hit ? lerp(14, 0, Math.pow(prog(t, f3a + 0.4, hit), 1.15)) : -0.6 * Math.exp(-(t - hit) * 6) * Math.cos((t - hit) * 30);
      const imp = t > hit ? prog(t, hit, hit + 0.5) : 0;
      const shake = t > hit ? 8 * Math.exp(-(t - hit) * 5) * Math.sin((t - hit) * 60) : 0;
      return (
        <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
          <FrontDemo t={t} v={{dz: 0, tilt: 0, above, eng: t < hit ? 0.35 : 0}} ghost={base} word="TOO FAST" wo={fadeWin(t, f3a + 0.1, f4a, 0.2)} impact={imp > 0 && imp < 1 ? imp : 0} />
        </div>
      );
    },
  });
  // F4 — simple examples; position, rotation and speed have to cooperate: the three variations fold back into one
  const f5a = tCant - 0.2;
  shots.push({
    id: 'F4_cooperate', a: f4a, b: f5a, tin: 'cut',
    render: (t) => {
      const k = ep(t, tCoop + 0.2, f5a - 0.3);
      const above = lerp(3, 0, k);
      return (
        <FrontDemo t={t} v={{...base, above, eng: 0.6 * (1 - k)}}
          ghost={null}
          overlay={<>
            <g opacity={(1 - k) * prog(t, f4a + 0.2, f4a + 0.6)}>
              <ShipAtFront t={t} q={{dz: lerp(2.6, 0, k) * (0.6 + 0.4 * Math.sin(t * 2.2)), tilt: 0, above: above + 2, eng: 0}} id="f4a" ghost />
            </g>
            <g opacity={(1 - k) * prog(t, f4a + 1.4, f4a + 1.8)}>
              <ShipAtFront t={t} q={{dz: 0, tilt: lerp(4.5, 0, k) * (0.6 + 0.4 * Math.sin(t * 2.6)), above: above + 2, eng: 0}} id="f4b" ghost />
            </g>
            <g opacity={(1 - k) * prog(t, f4a + 2.6, f4a + 3.0)}>
              <ShipAtFront t={t} q={{dz: 0, tilt: 0, above: above + 2 + lerp(6, 0, k) * (0.5 + 0.5 * Math.sin(t * 3.0)), eng: 0}} id="f4c" ghost />
            </g>
            <Word text="POSITION" x={420} y={200} size={60} color="#2b3540" o={prog(t, wt('S6_05', 'position') - 0.1, wt('S6_05', 'position') + 0.2)} />
            <Word text="ROTATION" x={960} y={200} size={60} color="#2b3540" o={prog(t, wt('S6_05', 'rotation') - 0.1, wt('S6_05', 'rotation') + 0.2)} />
            <Word text="SPEED" x={1500} y={200} size={60} color="#2b3540" o={prog(t, wt('S6_05', 'speed') - 0.1, wt('S6_05', 'speed') + 0.2)} />
          </>}
        />
      );
    },
  });
  // F5 — the engines can't leave the tower to absorb whatever motion remains (side view)
  const f6a = tSite - 0.2;
  shots.push({
    id: 'F5_remain', a: f5a, b: f6a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 4, CAR + 2, 0], z: 10, yaw: -14, pitch: 2};
      const s: ArmState = {carY: CAR, open: 4, flex: 0.4 * prog(t, tRemain - 0.6, tRemain)};
      const above = lerp(10, 0, ep(t, f5a, tRemain - 0.5));
      const r = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3]);
      return (
        <CatchView t={t} c={c} l="studio" s={s} clouds={false} hiRail={0.8}
          fore={<PinMark c={c} s={s} above={above} hi={1} />}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="studio" heading={70} props={{engines: 0.9, t, id: 'f5s', flapFwd: 60, flapAft: 70}} />}
          overlay={svg(<Arrow x={r[0] + 40} y={r[1] - 260} dx={0} dy={220} color={C.red} w={16} o={fadeWin(t, wt('S6_06', 'motion') - 0.3, f6a, 0.2)} />)}
        />
      );
    },
  });
  // F6 — the receiving machine is part of the launch site: the equipment for the next flight is right there
  const g0a = ss('S7') - 0.9;
  shots.push({
    id: 'F6_site', a: f6a, b: g0a, tin: 'dip', td: 0.5,
    render: (t) => {
      const u = prog(t, f6a, g0a);
      const c: Cam3 = {at: [lerp(6, -4, u), lerp(70, 44, u), 0], z: lerp(5.2, 3.8, u), yaw: lerp(-30, -42, u), pitch: lerp(6, 11, u)};
      const s: ArmState = {carY: 108, open: 30};
      const k = fadeWin(t, tNext - 0.4, g0a + 0.5, 0.3);
      return <CatchView t={t} c={c} l="night" s={s} hiRail={k} hiCarriage={k} />;
    },
  });
  return shots;
};

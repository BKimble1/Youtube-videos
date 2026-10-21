// "The flip" (S4), "The machine receiving it" (S5), "Three small changes" (S6).
import React from 'react';
import {ep, prog, clamp, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, proj, poly, V3} from '../cam3';
import {ArmState, VX, RAIL_DY, ARM_Z, TW, PinMark, Arm, armPt, LIGHTS} from '../site';
import {Booster, Ship, R, FinTopView} from '../vehicles';
import {Clouds, Credit, Frame, Sky, Tag, Word, SeaPlane} from '../scene';
import {F14O, Footage, Shot, TELEM_CROP, TOWER10, TOP07} from '../timeline';
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

  // D1 — one descent, real: Flight 14 onboard view along the aft flap (broadside fall over the ocean), engine
  // ignition on "relight", the rotation, then SpaceX's own cut to the external upright landing burn on "Falling
  // sideways becomes …". Played continuously at real speed; the telemetry strip is cropped out.
  const oceanA = tRelight - 4.85; // source 13.0 s → ignition (source ≈ 17.85 s) lands on "relight"
  const d5a = tPlanned - 0.25;
  shots.push({
    id: 'D1_realOceanReturn', a: oceanA, b: d5a, tin: 'cut',
    render: (t) => (
      <Footage file={F14O} a={oceanA} src0={13.0} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(<Credit text="SpaceX · Flight 14, 2026 · ocean landing" o={fadeWin(t, oceanA + 0.3, d5a, 0.3)} />)}
      </Footage>
    ),
  });

  // D5 — the real upright silhouette (left third, ≈ 315 px tall) continues as the drawn ship at the same place and
  // size; the camera then moves to bring in the tower: the new receiving target
  const d6a = tNeeds - 0.15;
  shots.push({
    id: 'D5_target', a: d5a, b: d6a, tin: 'cut',
    render: (t) => {
      const u = ep(t, d5a + 0.25, d6a + 0.3);
      const above = lerp(30, 22, ep(t, d5a, d6a));
      const base = shipRestY(CAR) + above;
      const z = lerp(6.0, 8.5, u);
      const c: Cam3 = {at: [lerp(VX + 82.3, VX - 6, u), lerp(base + 1.7, CAR - 2, u), 0], z, yaw: lerp(0, -20, u), pitch: lerp(0, 3, u)};
      return (
        <CatchView t={t} c={c} l="dusk" s={{carY: CAR, open: 18}} sun={[1600, 780]} hiRail={fadeWin(t, wt('S4_05', 'target') - 0.3, d6a + 1, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="dusk" heading={70} props={{engines: 1, t, id: 'd5s', plumeLen: 24, flapFwd: 60, flapAft: 70}} />}
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
        <CatchView t={t} c={c} l="dusk" s={s} hiRail={posK} sun={[1600, 780]}
          fore={<PinMark c={c} s={s} above={above + 0.5} hi={1} />}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="dusk" heading={70} props={{engines: 1, t, id: 'd6s', plumeLen: 20, flapFwd: 60, flapAft: 70}} />}
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

  // D7 — one continuous pan: the demonstrated sequence over the ocean (reentry → belly-flop → flip → landing burn →
  // water) under its bracket, then past the coastline to the tower, where the planned catch sits outside the bracket.
  const d8a = tExtra - 0.2;
  shots.push({
    id: 'D7_sequence', a: d7a, b: d8a, tin: 'dip', td: 0.4,
    render: (t) => {
      const pan = ep(t, d7a + 0.2, d8a - 0.2) * 1500;
      const P = (x: number) => x - pan;
      const path = (f: number): [number, number] => [lerp(120, 1500, f), lerp(220, 760, Math.pow(f, 1.25))];
      const poses = [0, 0.3, 0.55, 0.78, 1].map((f) => ({f, xy: path(f), rot: lerp(-90, 0, smoother(prog(f, 0.45, 0.85))), heat: 1 - prog(f, 0.15, 0.35), eng: f > 0.5 ? 1 : 0}));
      const br = prog(t, wt('S4_07', 'ocean') - 0.3, wt('S4_07', 'ocean') + 0.2);
      const q = prog(t, wt('S4_07', 'sequence') - 0.2, wt('S4_07', 'sequence') + 0.3);
      return (
        <Frame>
          <Sky k="gulf" horizon={0.84} />
          <rect x={P(-200)} y={870} width={2100} height={300} fill="#3f7fae" />
          <path d={`M ${P(1900)} 870 C ${P(2000)} 860, ${P(2050)} 900, ${P(2100)} 880 L ${P(4200)} 880 L ${P(4200)} 1100 L ${P(1900)} 1100 Z`} fill="#b9ad93" />
          <rect x={P(1850)} y={870} width={300} height={300} fill="#3f7fae" />
          <polyline points={Array.from({length: 40}, (_, i) => path(i / 39)).map(([x, y]) => `${P(x)},${y}`).join(' ')} stroke="#fbf4e4" strokeWidth={5} strokeDasharray="3 15" strokeLinecap="round" fill="none" />
          {poses.map((p, i) => (
            <InFlight key={i} x={P(p.xy[0])} y={p.xy[1]} rot={p.rot} z={4.6}>
              <g transform="translate(0 26)"><Ship az={100} pal="day" t={t} heat={p.heat} engines={p.eng} plumeLen={14} flapFwd={40} flapAft={50} id={`d7s${i}`} /></g>
            </InFlight>
          ))}
          <g opacity={br}>
            <path d={`M ${P(80)} 930 L ${P(80)} 960 L ${P(1620)} 960 L ${P(1620)} 930`} stroke="#fbf4e4" strokeWidth={8} fill="none" strokeLinejoin="round" />
            <Word text="DEMONSTRATED OVER THE OCEAN" x={P(850)} y={1040} size={52} color="#fbf4e4" o={1} />
          </g>
          {/* the tower, separate, on land */}
          <g transform={`translate(${P(2620)} 880)`}>
            <rect x={-30} y={-640} width={60} height={640} fill="#7d868f" stroke="#4a535c" strokeWidth={4} />
            {Array.from({length: 18}, (_, i) => <path key={i} d={`M-30 ${-i * 35} L0 ${-i * 35 - 35} L30 ${-i * 35}`} stroke="#4a535c" strokeWidth={5} fill="none" />)}
            <rect x={30} y={-380} width={200} height={34} fill="#6d7781" stroke="#4a535c" strokeWidth={4} />
          </g>
          <InFlight x={P(2740)} y={600} rot={0} z={4.6}><Ship az={100} pal="day" t={t} engines={1} plumeLen={10} flapFwd={60} flapAft={70} id="d7tw" /></InFlight>
          <Word text="PLANNED · TOWER CATCH" x={P(2700)} y={1040} size={52} o={q} />
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

  // E1 — real Pad 2 tower: braces, a work platform riding the mast, the flats beyond (no mechanism claimed)
  const e2a = tSwing - 0.5;
  shots.push({
    id: 'E1_realTower', a: e1a, b: e2a, tin: 'cut',
    render: (t) => <Footage file={TOWER10} a={e1a} src0={2.45} scale={1.04} cx={0.3} cy={0.5}>{svg(<Credit text="SpaceX · Critical Path, 2026" o={fadeWin(t, e1a + 0.2, e2a, 0.2)} />)}</Footage>,
  });

  // E2 — the same chevron brace as drawn steel, close; pull back along the mast to the carriage: the arms swing on
  // their pivots, then the carriage travels on the mast (two separate motions)
  const e3a = tTruss - 0.2;
  shots.push({
    id: 'E2_motions', a: e2a, b: e3a, tin: 'cut',
    render: (t) => {
      const back = ep(t, e2a, tSwing + 0.2);
      const c: Cam3 = {at: [lerp(-2, 8, back), lerp(CAR + 22, CAR - 4, back), 0], z: Math.exp(lerp(Math.log(28), Math.log(6.4), back)), yaw: lerp(-62, -34, back), pitch: lerp(-2, 6, back)};
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

  // E5 — newer tower, shorter arms (old length outlined for comparison), closer than V2
  const e6a = tMoment - 0.2;
  const e5bA = wt('S5_04', 'and') - 0.05, e5cA = e5bA + 3.2;
  shots.push({
    id: 'E5_shorter', a: e5a, b: e5bA, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [14, CAR - 2, 0], z: lerp(11, 12.5, prog(t, e5a, e5bA)), yaw: -40, pitch: 10};
      const s: ArmState = {carY: CAR, open: 8};
      const g = fadeWin(t, tShorter - 0.3, e5bA + 0.3, 0.2);
      return (
        <CatchView t={t} c={c} l="day" s={s}
          fore={<g opacity={0.5 * g} strokeDasharray="10 8">{([1, -1] as const).map((sd) => {
            const a1 = proj(c, armPt(s, sd, 0, RAIL_DY, 0)), a2 = proj(c, armPt({...s, len: 40}, sd, 1, RAIL_DY, 0));
            return <line key={sd} x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke="#fbf4e4" strokeWidth={6} />;
          })}</g>}
          overlay={svg(<Word text="SHORTER ARMS" x={1760} y={200} anchor="end" size={64} color="#fbf4e4" o={g} />)}
        />
      );
    },
  });
  // E5b — real V3 booster top on the pad: the grid fin, the vented forward section and, separately, the quick-disconnect
  // arm (ground activity, not a catch)
  shots.push({
    id: 'E5b_realBoosterTop', a: e5bA, b: e5cA, tin: 'cut',
    render: (t) => (
      <Footage file={TOP07} a={e5bA} src0={0} scale={1.0} cx={0.5} cy={0.5}>
        {svg(
          <>
            <Tag text="GRID FIN" x={1390} y={130} to={[1690, 190]} o={fadeWin(t, wt('S5_04', 'three') - 0.15, e5cA, 0.2)} size={40} align="r" />
            <Tag text="QUICK-DISCONNECT ARM (NOT A CATCH ARM)" x={60} y={330} to={[420, 430]} o={fadeWin(t, e5bA + 0.3, e5cA, 0.2)} size={34} />
            <Credit text="SpaceX · Critical Path, 2026" o={fadeWin(t, e5bA + 0.2, e5cA, 0.2)} />
          </>,
        )}
      </Footage>
    ),
  });
  // E5c — the same three fins drawn, turning slowly; the support regions at the fin attachments outlined
  shots.push({
    id: 'E5c_finsDrawn', a: e5cA, b: e6a, tin: 'cut',
    render: (t) => {
      const hi = prog(t, tCatchF - 0.2, tCatchF + 0.2);
      return (
        <Frame>
          <Sky k="studio" />
          <g transform={`translate(960 ${2750}) scale(${lerp(36, 39, prog(t, e5cA, e6a))})`}>
            <Booster az={lerp(10, 45, prog(t, e5cA, e6a))} version="v3" pal="day" t={t} id="e5c" catchHi={hi} />
          </g>
          <Word text="3 LARGER GRID FINS" x={1820} y={170} anchor="end" size={60} color="#2b3540" o={1} />
          <Word text="REVISED CATCH FEATURES" x={1820} y={1000} anchor="end" size={52} o={hi} />
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

  // The baseline approach seen obliquely from above the arms: both support features come down onto their rails.
  const OV: Cam3 = {at: [VX - 2, CAR + 2, 0], z: 15, yaw: -38, pitch: 16};
  const Oblique: React.FC<{t: number; above: number; eng: number; word?: string; wo?: number; extra?: React.ReactNode}> = ({t, above, eng, word, wo = 0, extra}) => (
    <CatchView t={t} c={OV} l="studio" s={sF} clouds={false} mount={false} farm={false}
      fore={<><PinMark c={OV} s={sF} above={above} /><PinMark c={OV} s={sF} above={above} side={-1} /></>}
      vehicle={<ShipAt c={OV} carY={CAR} above={above} l="studio" heading={70} props={{engines: eng, t, id: 'ovs', plumeLen: 18, flapFwd: 60, flapAft: 70}} />}
      overlay={svg(<>{word ? <Word text={word} x={300} y={200} size={100} o={wo} /> : null}{extra}</>)}
    />
  );

  // F0 — baseline
  const f1a = tDrift - 0.2;
  shots.push({
    id: 'F0_baseline', a: f0a, b: f1a, tin: 'dip', td: 0.5,
    render: (t) => {
      const above = approach(t, f0a - 0.3, f1a - 0.6, 10, 0.12);
      return <Oblique t={t} above={above} eng={throttle(t, f0a - 0.3, f1a - 0.6, 0.4)} word="BASELINE" wo={fadeWin(t, f0a + 0.3, f1a, 0.2) * 0.85} />;
    },
  });
  // F1 — drift, from directly above: the ship's cross-section moves sideways across the gap between the arms, so one
  // support feature no longer reaches its rail. Baseline footprints stay outlined.
  const f2a = tTilt - 0.2;
  shots.push({
    id: 'F1_drift', a: f1a, b: f2a, tin: 'cut',
    render: (t) => {
      const k = 44, cx = 1060, cy = 540;
      const dz = 1.25 * ep(t, f1a + 0.3, tMiss - 0.1);
      const miss = prog(t, tMiss - 0.1, tMiss + 0.2);
      const railIn = ARM_Z - 1.3, armOut = ARM_Z + 1.7;
      const Y = (z: number) => cy - z * k;
      const feat = (zc: number, o = 1, dash = false) => <rect x={cx - 0.6 * k} y={Y(zc + 0.55)} width={1.2 * k} height={1.1 * k} rx={6} fill={dash ? 'none' : '#8a949e'} stroke={dash ? '#fbf4e4' : C.ink} strokeWidth={dash ? 4 : 4} strokeDasharray={dash ? '10 8' : undefined} opacity={o} />;
      return (
        <Frame>
          <rect width={1920} height={1080} fill="#c4b99f" />
          <rect x={0} y={0} width={190} height={1080} fill="#7d868f" />
          {[1, -1].map((sd) => (
            <g key={sd}>
              <rect x={190} y={Math.min(Y(sd * railIn), Y(sd * armOut))} width={1500} height={(armOut - railIn) * k} fill="#6d7781" stroke={C.ink} strokeWidth={4} />
              <rect x={300} y={sd > 0 ? Y(railIn + 0.6) : Y(-railIn)} width={1320} height={0.6 * k} fill="#d5dadd" stroke={C.ink} strokeWidth={3} />
            </g>
          ))}
          {feat(R + 0.55, 1, true)}{feat(-(R + 0.55), 1, true)}
          <g transform={`translate(0 ${-dz * k})`}>
            <circle cx={cx} cy={cy} r={R * k} fill="url(#b4tank3)" stroke={C.ink} strokeWidth={5} />
            {feat(R + 0.55)}{feat(-(R + 0.55))}
          </g>
          <defs>
            <radialGradient id="b4tank3" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stopColor="#f4f6f8" /><stop offset="0.6" stopColor="#b9c2cb" /><stop offset="1" stopColor="#7e8994" /></radialGradient>
          </defs>
          <Arrow x={cx + 330} y={cy + 40} dx={0} dy={-90 * prog(t, f1a + 0.2, f1a + 0.6)} w={12} />
          <g opacity={miss} stroke={C.red} strokeWidth={14} strokeLinecap="round">
            <line x1={cx - 60} y1={Y(-railIn) - 50 - dz * k * 0} x2={cx + 60} y2={Y(-railIn) + 50} />
            <line x1={cx + 60} y1={Y(-railIn) - 50} x2={cx - 60} y2={Y(-railIn) + 50} />
          </g>
          <Word text="DRIFT" x={300} y={140} size={100} o={fadeWin(t, f1a + 0.1, f2a, 0.2)} />
          <Word text="VIEW FROM ABOVE" x={60} y={1040} anchor="start" size={30} color="#fbf4e4" o={0.9} />
        </Frame>
      );
    },
  });
  // F2 — tilt, from the front (looking down the arms): one side meets its rail first and takes more of the load
  const f3a = tFast - 0.2;
  shots.push({
    id: 'F2_tilt', a: f2a, b: f3a, tin: 'cut',
    render: (t) => {
      const above = approach(t, f2a + 0.1, tFirst, 12, 0.1);
      const tilt = 4.5 * (1 - 0.3 * prog(t, tFirst, tShared));
      const one = prog(t, tFirst - 0.1, tFirst + 0.2) * (1 - prog(t, f3a - 0.4, f3a));
      const pr = proj(FV, [VX, CAR + RAIL_DY, ARM_Z - 1.3]), pl = proj(FV, [VX, CAR + RAIL_DY, -(ARM_Z - 1.3)]);
      return (
        <FrontDemo t={t} v={{dz: 0, tilt, above: above + 0.9, eng: throttle(t, f2a, tFirst, 0.5)}} word="TILT" wo={fadeWin(t, f2a + 0.1, f3a, 0.2)}
          overlay={<>
            <Arrow x={pr[0]} y={pr[1] - 230} dx={0} dy={200} color={C.red} o={one} w={14} />
            <Arrow x={pl[0]} y={pl[1] - 120} dx={0} dy={80} o={one} w={8} />
          </>} />
      );
    },
  });
  // F3 — too much downward speed, from the side: a spacing trail (marks every 0.2 s) shows the speed; the baseline's
  // closing-up marks are drawn beside it for comparison. Contact is an impact: arm flex, a hard stop, a shake.
  const f4a = tSimple - 0.2;
  shots.push({
    id: 'F3_fast', a: f3a, b: f4a, tin: 'cut',
    render: (t) => {
      const SV: Cam3 = {at: [VX - 6, CAR + 8, 0], z: 10, yaw: -10, pitch: 2};
      const hit = tImpact - 0.15;
      const t0 = f3a + 0.4;
      const h = (tt: number) => (tt < hit ? lerp(16, 0, Math.pow(prog(tt, t0, hit), 1.12)) : 0);
      const above = t < hit ? h(t) : -0.6 * Math.exp(-(t - hit) * 6) * Math.cos((t - hit) * 30);
      const imp = t > hit ? prog(t, hit, hit + 0.5) : 0;
      const shake = t > hit ? 8 * Math.exp(-(t - hit) * 5) * Math.sin((t - hit) * 60) : 0;
      const marks: number[] = [];
      for (let tt = t0; tt <= Math.min(t, hit); tt += 0.2) marks.push(h(tt));
      const nose = (ab: number, dx: number) => proj(SV, [VX + dx, shipRestY(CAR) + ab + 52.5, 0]);
      const baseMarks = Array.from({length: 8}, (_, i) => 16 * Math.pow(1 - i / 7, 2.2));
      const s: ArmState = {carY: CAR, open: 4, flex: 0.9 * (imp > 0 ? Math.exp(-(t - hit) * 3) : 0)};
      return (
        <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
          <CatchView t={t} c={SV} l="studio" s={s} clouds={false} mount={false} farm={false}
            fore={<PinMark c={SV} s={s} above={above} />}
            vehicle={<ShipAt c={SV} carY={CAR} above={above} l="studio" heading={70} props={{engines: t < hit ? 0.35 : 0, t, id: 'f3s', flapFwd: 60, flapAft: 70}} />}
            overlay={svg(
              <>
                {marks.map((m, i) => { const p = nose(m, 9); return <line key={i} x1={p[0] - 18} x2={p[0] + 18} y1={p[1]} y2={p[1]} stroke={C.red} strokeWidth={6} strokeLinecap="round" />; })}
                <g opacity={prog(t, f3a + 0.3, f3a + 0.8)}>
                  {baseMarks.map((m, i) => { const p = nose(m, 13); return <line key={i} x1={p[0] - 14} x2={p[0] + 14} y1={p[1]} y2={p[1]} stroke="#2ec4b6" strokeWidth={5} strokeLinecap="round" />; })}
                </g>
                {imp > 0 && imp < 1 ? <circle cx={proj(SV, [VX, CAR + RAIL_DY, 0])[0]} cy={proj(SV, [VX, CAR + RAIL_DY, 0])[1]} r={260 * imp} fill="none" stroke={C.red} strokeWidth={14 * (1 - imp)} opacity={1 - imp} /> : null}
                <Word text="TOO FAST" x={300} y={200} size={100} o={fadeWin(t, f3a + 0.1, f4a, 0.2)} />
              </>,
            )}
          />
        </div>
      );
    },
  });
  // F4 — simple examples; position, rotation and speed have to cooperate: the baseline arrives cleanly (no duplicates)
  const f5a = tCant - 0.2;
  shots.push({
    id: 'F4_cooperate', a: f4a, b: f5a, tin: 'cut',
    render: (t) => {
      const above = approach(t, f4a - 0.5, tCoop + 1.6, 12, 0.12);
      return (
        <Oblique t={t} above={above} eng={throttle(t, f4a - 0.5, tCoop + 1.6, 0.5)}
          extra={<>
            <Word text="POSITION" x={520} y={200} size={60} color="#2b3540" o={prog(t, wt('S6_05', 'position') - 0.1, wt('S6_05', 'position') + 0.2)} />
            <Word text="ROTATION" x={960} y={200} size={60} color="#2b3540" o={prog(t, wt('S6_05', 'rotation') - 0.1, wt('S6_05', 'rotation') + 0.2)} />
            <Word text="SPEED" x={1400} y={200} size={60} color="#2b3540" o={prog(t, wt('S6_05', 'speed') - 0.1, wt('S6_05', 'speed') + 0.2)} />
          </>} />
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

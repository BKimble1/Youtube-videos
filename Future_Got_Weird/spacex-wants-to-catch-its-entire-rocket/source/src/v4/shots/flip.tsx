// V4 return corridor and ocean manoeuvre (end of S3, S4), the receiving machine (S5), three changes and the site (S6).
import React from 'react';
import {ep, prog, lerp, fadeWin, smoother, noise} from '../../kit/anim';
import {Cam3, V3, proj} from '../cam3';
import {ArmState, CAR_DEFAULT, VX, RAIL_DY, ARM_Z, TW, armPt} from '../site';
import {Booster, Ship, R} from '../vehicles';
import {Clouds, Credit, Frame, Sky, Tag} from '../scene';
import {F14O, Footage, Shot, TELEM_CROP, TOWER10, TOP07} from '../timeline';
import {CatchView, InFlight, ShipAt, ShipWorld, BoosterAt, Streaks, approach, throttle, shipRestY, spline3, splineZ, spline} from './common';
import {Arrow, FV} from './mech';
import {ls, wt} from '../time';
import {C} from '../../kit/ui';

const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{children}</svg>;
const CAR = CAR_DEFAULT;

export const flipShots = (): Shot[] => {
  const shots: Shot[] = [];
  const tSurvive = wt('S3_05', 'survive');
  const tBroad = wt('S4_00', 'broadside'), tFlaps = wt('S4_00', 'flaps'), tRelight = wt('S4_01', 'relight');
  const tPlanned = ls('S4_05'), tNeeds = ls('S4_06'), tPos = wt('S4_06', 'position'), tOri = wt('S4_06', 'orientation'), tMot = wt('S4_06', 'motion'), tReach = wt('S4_06', 'reach');

  // C7 — the return corridor, established once: over the Gulf looking toward the shore and the pad, the ship falling
  // broadside toward it; the camera closes in on the ship as it comes down (destination always in frame)
  const c7a = tSurvive - 0.1, c9a = tFlaps - 1.6;
  shots.push({
    id: 'C7_corridor', a: c7a, b: c9a, tin: 'dip', td: 0.45,
    render: (t) => {
      const u = ep(t, c7a, c9a, (v) => v);
      const p: V3 = [lerp(VX + 120, VX + 80, u), lerp(520, 330, u), lerp(-1050, -560, u)];
      const site: V3 = [VX, 70, 0];
      const m = lerp(0.5, 0.08, smoother(u));
      const c: Cam3 = {at: [lerp(p[0], site[0], m), lerp(p[1], site[1], m), lerp(p[2], site[2], m)], z: lerp(1.6, 3.8, smoother(u)), yaw: lerp(74, 66, u), pitch: lerp(-4, 0, smoother(u))};
      const ff = 26 + 20 * Math.sin(t * 1.8), fa = 30 - 16 * Math.sin(t * 1.8 + 0.8);
      return (
        <CatchView t={t} c={c} l="day" s={{carY: CAR, open: 26}}
          under={<Streaks t={t} dir={[0, -1]} k={0.25 * u} />}
          fore={<ShipWorld c={c} p={p} theta={0} l="day" props={{t, flapFwd: ff, flapAft: fa, heat: 0.15 * (1 - u), id: 'c7s'}} />} />
      );
    },
  });

  // C9 — closer, broadside: the flaps working; the camera swings over the hull to the aft flap — the onboard camera's
  // view in the real clip that follows
  const oceanA = tRelight - 1.0; // 03: ignition at source 17.85 s lands on "relight"
  shots.push({
    id: 'C9_broadside', a: c9a, b: oceanA, tin: 'cut',
    render: (t) => {
      const ff = 25 + 22 * Math.sin(t * 1.7) + 6 * noise(t * 2, 1);
      const fa = 30 - 18 * Math.sin(t * 1.7 + 0.8);
      const close = ep(t, oceanA - 1.5, oceanA);
      const z = lerp(lerp(11, 15, ep(t, c9a, c9a + 1.5)), 34, close);
      const x = lerp(960, 960 - 17 * z, close), y = lerp(520, 660, close);
      return (
        <Frame>
          <Sky k="day" />
          <Clouds n={12} seed={41} y0={-300} y1={1400} dy={-t * 520} s={1.3} o={0.85} />
          <Streaks t={t} dir={[0, -1]} k={0.45} />
          <InFlight x={x} y={y} rot={-90 + 2.5 * noise(t * 0.8, 5)} z={z}>
            <g transform="translate(0 26)"><Ship az={lerp(80, 58, ep(t, c9a, c9a + 1.4))} pal="day" t={t} flapFwd={ff} flapAft={fa} fittings={1} id="c9s" /></g>
          </InFlight>
        </Frame>
      );
    },
  });

  // D1 — the real Flight 14 descent, from one second before ignition: relight on "relight", the rotation, SpaceX's own
  // cut to the external upright landing burn on "Falling sideways". Continuous, real speed, telemetry cropped.
  const d5a = tPlanned - 0.2;
  shots.push({
    id: 'D1_realOceanFlip', a: oceanA, b: d5a, tin: 'cut',
    render: (t) => (
      <Footage file={F14O} a={oceanA} src0={16.85} scale={TELEM_CROP} cx={0.5} cy={0}>
        {svg(<Credit text="SpaceX · Flight 14, 2026 · ocean landing" o={fadeWin(t, oceanA + 0.3, d5a, 0.3)} />)}
      </Footage>
    ),
  });

  // D5 — the upright ship continues at the same place and size in the drawing; the camera brings in the tower
  const d6a = tNeeds - 0.15;
  shots.push({
    id: 'D5_target', a: d5a, b: d6a, tin: 'cut',
    render: (t) => {
      const u = ep(t, d5a + 0.25, d6a + 0.3);
      const above = lerp(30, 22, ep(t, d5a, d6a));
      const base = shipRestY(CAR) + above;
      const c: Cam3 = {at: [lerp(VX + 82.3, VX - 6, u), lerp(base + 1.7, CAR - 2, u), 0], z: lerp(6.0, 8.5, u), yaw: lerp(0, -20, u), pitch: lerp(0, 3, u)};
      return (
        <CatchView t={t} c={c} l="day" s={{carY: CAR, open: 18}} hiRail={fadeWin(t, wt('S4_05', 'target') - 0.3, d6a + 1, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR} above={above} l="day" props={{engines: 1, t, id: 'd5s', plumeLen: 24, flapFwd: 60, flapAft: 70}} />} />
      );
    },
  });

  // D6 — position, orientation and motion all converge as the support features reach the rails: the sideways offset
  // closes, the lean straightens, the sink rate falls; mechanism scale, no captions
  const e1a = ls('S5_00') - 0.35;
  shots.push({
    id: 'D6_converge', a: d6a, b: e1a, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [VX - 3, CAR + 5, 0], z: lerp(11, 13, prog(t, d6a, e1a)), yaw: -26, pitch: 4};
      const s: ArmState = {carY: CAR, open: lerp(16, 4, ep(t, d6a, tReach))};
      const above = approach(t, d6a - 0.4, tReach + 0.2, 18, 0.2);
      const dz = 2.6 * (1 - ep(t, tPos - 0.3, tOri + 0.2));
      const tilt = 4.5 * (1 - ep(t, tOri - 0.2, tMot + 0.1));
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={fadeWin(t, tReach - 0.3, e1a + 1, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR} above={above} dz={dz} tilt={tilt} l="day" props={{engines: throttle(t, d6a - 0.4, tReach + 0.2, 0.5), t, id: 'd6s', plumeLen: 20, flapFwd: 60, flapAft: 70}} />} />
      );
    },
  });

  // ---------------- S5 ----------------
  const tSwing = wt('S5_01', 'swing'), tCarriage = wt('S5_01', 'carriage'), tTowerE = wt('S5_01', 'tower');
  const tTruss = ls('S5_02'), tLoadP = ls('S5_03'), tThrough = wt('S5_03', 'through'), tInto = wt('S5_03', 'carriage'), tDown = wt('S5_03', 'down'), tGround = wt('S5_03', 'ground');
  const tNewer = ls('S5_04'), tShorter = wt('S5_04', 'shorter'), tFins = wt('S5_04', 'grid'), tCatchF = wt('S5_04', 'revised');
  const tMoment = ls('S5_05'), tFlying = wt('S5_05', 'flying'), tOne = wt('S5_05', 'one');

  // E1 — the real Pad 2 tower: chevron braces and the coast beyond (a complete shot from 10, after its source cut)
  const e2a = tSwing - 0.6;
  shots.push({
    id: 'E1_realTower', a: e1a, b: e2a, tin: 'cut',
    render: (t) => <Footage file={TOWER10} a={e1a} src0={2.6} scale={1.04} cx={0.3} cy={0.5}>{svg(<Credit text="SpaceX · Critical Path, 2026" o={fadeWin(t, e1a + 0.2, e2a, 0.2)} />)}</Footage>,
  });

  // E2 — the same chevron brace drawn, close; the camera backs off along the mast to the carriage: the arms swing on
  // their pivots, then the carriage travels on the mast
  const e3a = tTruss - 0.2;
  shots.push({
    id: 'E2_moves', a: e2a, b: e3a, tin: 'cut',
    render: (t) => {
      const back = ep(t, e2a, tSwing + 0.2);
      const c: Cam3 = {at: [lerp(-2, 8, back), lerp(CAR + 22, CAR - 4, back), 0], z: Math.exp(lerp(Math.log(28), Math.log(6.4), back)), yaw: lerp(-62, -34, back), pitch: lerp(-2, 6, back)};
      const sw = Math.sin(Math.PI * ep(t, tSwing - 0.3, tCarriage - 0.1));
      const car = CAR + 16 * Math.sin(Math.PI * ep(t, tCarriage - 0.1, tTowerE + 0.4));
      return <CatchView t={t} c={c} l="day" s={{carY: car, open: 6 + 34 * sw}} hiCarriage={fadeWin(t, tCarriage - 0.1, e3a + 0.3, 0.2) * 0.7} />;
    },
  });

  // E3 — connected mechanical close-ups, one camera: under the arm looking up into the deep truss; along the members to
  // the carriage; down the mast legs; into the plinth and the ground. The load travels with the camera.
  const e5a = tNewer - 0.25;
  shots.push({
    id: 'E3_loadPath', a: e3a, b: e5a, tin: 'cut',
    render: (t) => {
      const at = spline3(t, [
        [e3a, [VX - 8, CAR - 6, 6]], [tLoadP, [VX - 10, CAR - 3, 5]], [tThrough + 0.3, [13, CAR - 1, 4]],
        [tInto + 0.2, [TW + 2, CAR - 3, 2]], [tDown + 0.5, [2, 55, 2]], [tGround + 0.2, [0, 6, 2]], [e5a, [-2, 4, 2]],
      ]);
      const z = splineZ(t, [[e3a, 15], [tLoadP, 17], [tThrough + 0.3, 15], [tInto + 0.2, 16], [tDown + 0.5, 8], [tGround + 0.2, 14], [e5a, 12]]);
      const pitch = spline(t, [[e3a, 26], [tLoadP, 18], [tInto + 0.2, 6], [tDown + 0.5, -4], [tGround + 0.2, -16], [e5a, -18]]);
      const yaw = spline(t, [[e3a, -30], [tInto, -40], [tGround, -46], [e5a, -48]]);
      const c: Cam3 = {at, z, yaw, pitch};
      const s: ArmState = {carY: CAR, open: 4, flex: 0.3};
      const loadU = ep(t, tLoadP + 0.2, tInto - 0.1);
      const legs = ([[TW, TW], [TW, -TW], [-TW, TW], [-TW, -TW]] as [number, number][]).map(([x, z2]) => [proj(c, [x, CAR - 8, z2]), proj(c, [x, 2.4, z2])]);
      const down = ep(t, tDown - 0.3, tGround);
      const gp = proj(c, [0, 2.4, 0]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiTruss={fadeWin(t, tTruss + 0.3, tInto + 0.6, 0.3)} load={t < tLoadP ? -1 : loadU} hiCarriage={fadeWin(t, tInto - 0.2, tDown + 0.6, 0.2)}
          vehicle={<BoosterAt c={c} carY={CAR} above={-0.3} v="v3" l="day" heading={0} props={{t, id: 'e3b'}} />}
          overlay={svg(
            <>
              {down > 0 ? legs.map(([a, b], i) => (
                <line key={i} x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], down)} y2={lerp(a[1], b[1], down)} stroke={C.yellow} strokeWidth={7} strokeLinecap="round" opacity={0.85 * (1 - prog(t, e5a - 0.4, e5a))} />
              )) : null}
              <ellipse cx={gp[0]} cy={gp[1]} rx={220 * prog(t, tGround - 0.1, tGround + 0.4)} ry={60 * prog(t, tGround - 0.1, tGround + 0.4)} fill="none" stroke={C.yellow} strokeWidth={6} opacity={1 - prog(t, tGround + 0.4, e5a)} />
            </>,
          )}
        />
      );
    },
  });

  // E5 — the newer tower's shorter arms (the old length outlined for comparison)
  const e5bA = wt('S5_04', 'and') - 0.05, e5cA = tCatchF - 0.1;
  shots.push({
    id: 'E5_shorterArms', a: e5a, b: e5bA, tin: 'cut',
    render: (t) => {
      const c: Cam3 = {at: [14, CAR - 2, 0], z: lerp(10, 11.5, prog(t, e5a, e5bA)), yaw: -40, pitch: -8};
      const s: ArmState = {carY: CAR, open: lerp(14, 8, prog(t, e5a, e5bA))};
      const g = fadeWin(t, tShorter - 0.3, e5bA + 0.3, 0.2);
      return (
        <CatchView t={t} c={c} l="day" s={s}
          fore={<g opacity={0.6 * g} strokeDasharray="10 8">{([1, -1] as const).map((sd) => {
            const a1 = proj(c, armPt(s, sd, 0, RAIL_DY, 0)), a2 = proj(c, armPt({...s, len: 40}, sd, 1, RAIL_DY, 0));
            return <line key={sd} x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke="#ffffff" strokeWidth={6} />;
          })}</g>} />
      );
    },
  });
  // E5b — the real V3 booster top (07): grid fin; the quick-disconnect arm identified briefly as a separate arm
  shots.push({
    id: 'E5b_realBoosterTop', a: e5bA, b: e5cA, tin: 'cut',
    render: (t) => (
      <Footage file={TOP07} a={e5bA} src0={0} scale={1.0} cx={0.5} cy={0.5}>
        {svg(
          <>
            <Tag text="GRID FIN" x={1390} y={130} to={[1690, 190]} o={fadeWin(t, tFins - 0.2, e5cA, 0.2)} size={38} align="r" />
            <Tag text="QD ARM" x={110} y={330} to={[420, 430]} o={fadeWin(t, e5bA + 0.3, e5cA, 0.2)} size={34} />
            <Credit text="SpaceX · Critical Path, 2026" o={fadeWin(t, e5bA + 0.2, e5cA, 0.2)} />
          </>,
        )}
      </Footage>
    ),
  });
  // E5c — the same three fins drawn, the support regions at the fin roots outlined on "revised catch features"
  const e6a = tMoment - 0.2;
  shots.push({
    id: 'E5c_finsDrawn', a: e5cA, b: e6a, tin: 'cut',
    render: (t) => (
      <Frame>
        <Sky k="day" />
        <g transform={`translate(960 ${2750}) scale(${lerp(36, 39, prog(t, e5cA, e6a))})`}>
          <Booster az={lerp(10, 40, prog(t, e5cA, e6a))} version="v3" pal="day" t={t} id="e5c" catchHi={prog(t, tCatchF - 0.1, tCatchF + 0.3)} />
        </g>
      </Frame>
    ),
  });

  // E6 — one supported structure: the booster's fins come down onto the rails at mechanism scale, then the camera pulls
  // back until tower and booster read as one structure standing on the ground
  const f0a = ls('S6_00') - 0.4;
  shots.push({
    id: 'E6_oneStructure', a: e6a, b: f0a, tin: 'cut',
    render: (t) => {
      const contact = tFlying - 0.1;
      const above = approach(t, e6a - 0.8, contact, 9, 0.25);
      const back = ep(t, contact + 0.4, tOne + 0.4);
      const c: Cam3 = {at: [lerp(VX - 4, 8, back), lerp(CAR + 3, 62, back), 0], z: Math.exp(lerp(Math.log(13), Math.log(4.2), back)), yaw: lerp(-20, -30, back), pitch: lerp(3, -4, back)};
      const one = prog(t, tOne - 0.1, tOne + 0.4);
      return (
        <CatchView t={t} c={c} l="day" s={{carY: CAR, open: lerp(10, 4, ep(t, e6a, contact)), flex: 0.3 * prog(t, contact, contact + 0.4)}} hiTruss={one * 0.5} hiCarriage={one * 0.7}
          vehicle={<BoosterAt c={c} carY={CAR} above={above} v="v3" l="day" heading={0} props={{t, engines: throttle(t, e6a - 0.8, contact, 0.5), plumeLen: 34, id: 'e6b'}} />} />
      );
    },
  });

  // ---------------- S6: one change at a time ----------------
  const tDrift = ls('S6_01'), tMiss = wt('S6_01', 'miss'), tTilt = ls('S6_02'), tMeet = wt('S6_02', 'meet'), tShared = wt('S6_02', 'shared');
  const tFast = ls('S6_03'), tImpact = wt('S6_03', 'impact'), tSite = ls('S6_07'), tNext = wt('S6_07', 'next');
  const sF: ArmState = {carY: CAR, open: 0};
  // baseline seen obliquely from above the arms: both support features come down onto their rails
  const OV: Cam3 = {at: [VX - 2, CAR + 2, 0], z: 15, yaw: -38, pitch: -16};
  const f1a = tDrift - 0.2;
  shots.push({
    id: 'F0_baseline', a: f0a, b: f1a, tin: 'cut',
    render: (t) => {
      const above = approach(t, f0a - 0.3, f1a - 0.5, 10, 0.12);
      return (
        <CatchView t={t} c={OV} l="day" s={sF} hiRail={fadeWin(t, f1a - 0.7, f1a + 1, 0.2)}
          vehicle={<ShipAt c={OV} carY={CAR} above={above} l="day" props={{engines: throttle(t, f0a - 0.3, f1a - 0.5, 0.4), t, id: 'ovs', plumeLen: 18, flapFwd: 60, flapAft: 70}} />} />
      );
    },
  });
  // F1 — drift, from directly above: the cross-section slides across the gap so one support feature misses its rail;
  // then a clear reset back to the baseline
  const f2a = tTilt - 0.2;
  shots.push({
    id: 'F1_drift', a: f1a, b: f2a, tin: 'cut',
    render: (t) => {
      const k = 44, cx = 1060, cy = 540;
      const dz = 1.25 * ep(t, f1a + 0.3, tMiss - 0.1) * (1 - ep(t, tMiss + 1.1, f2a - 0.2));
      const miss = prog(t, tMiss - 0.1, tMiss + 0.2) * (1 - prog(t, tMiss + 1.0, tMiss + 1.3));
      const railIn = ARM_Z - 1.3, armOut = ARM_Z + 1.7;
      const Y = (z: number) => cy - z * k;
      const feat = (zc: number, dash = false) => <rect x={cx - 0.6 * k} y={Y(zc + 0.55)} width={1.2 * k} height={1.1 * k} rx={6} fill={dash ? 'none' : '#8a949e'} stroke={dash ? '#2b3540' : C.ink} strokeWidth={4} strokeDasharray={dash ? '10 8' : undefined} />;
      return (
        <Frame>
          <rect width={1920} height={1080} fill="#cbbf9c" />
          <rect x={0} y={0} width={190} height={1080} fill="#76808a" />
          {[1, -1].map((sd) => (
            <g key={sd}>
              <rect x={190} y={Math.min(Y(sd * railIn), Y(sd * armOut))} width={1500} height={(armOut - railIn) * k} fill="#66707a" stroke={C.ink} strokeWidth={4} />
              <rect x={300} y={sd > 0 ? Y(railIn + 0.6) : Y(-railIn)} width={1320} height={0.6 * k} fill="#e2e6e8" stroke={C.ink} strokeWidth={3} />
            </g>
          ))}
          {feat(R + 0.55, true)}{feat(-(R + 0.55), true)}
          <g transform={`translate(0 ${-dz * k})`}>
            <circle cx={cx} cy={cy} r={R * k} fill="url(#v4tank2)" stroke={C.ink} strokeWidth={5} />
            {feat(R + 0.55)}{feat(-(R + 0.55))}
          </g>
          <defs><radialGradient id="v4tank2" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stopColor="#f4f6f8" /><stop offset="0.6" stopColor="#b9c2cb" /><stop offset="1" stopColor="#7e8994" /></radialGradient></defs>
          <Arrow x={cx + 330} y={cy + 40} dx={0} dy={-90 * fadeWin(t, f1a + 0.2, tMiss, 0.3)} w={12} />
          <g opacity={miss} stroke={C.red} strokeWidth={14} strokeLinecap="round">
            <line x1={cx - 60} y1={Y(-railIn) - 50} x2={cx + 60} y2={Y(-railIn) + 50} />
            <line x1={cx + 60} y1={Y(-railIn) - 50} x2={cx - 60} y2={Y(-railIn) + 50} />
          </g>
        </Frame>
      );
    },
  });
  // F2 — tilt, looking down the arms: one side's support meets its rail first and carries the load; then the ship
  // lifts, straightens and the reset is clean
  const f3a = tFast - 0.2;
  const FV2: Cam3 = {...FV, z: 15};
  shots.push({
    id: 'F2_tilt', a: f2a, b: f3a, tin: 'cut',
    render: (t) => {
      const above = approach(t, f2a + 0.1, tMeet, 12, 0.1) + 6 * ep(t, tShared + 0.2, f3a - 0.2);
      const tilt = 4.5 * (1 - ep(t, tShared + 0.2, f3a - 0.2));
      const one = prog(t, tMeet - 0.1, tMeet + 0.2) * (1 - prog(t, tShared, tShared + 0.4));
      const pr = proj(FV2, [VX, CAR + RAIL_DY, ARM_Z - 1.3]), pl = proj(FV2, [VX, CAR + RAIL_DY, -(ARM_Z - 1.3)]);
      const p = proj(FV2, [VX, shipRestY(CAR) + above + 0.9, 0]);
      return (
        <CatchView t={t} c={FV2} l="day" s={{carY: CAR, open: 0}} farm={false} hiRail={0.6}
          vehicle={
            <g transform={`translate(${p[0]} ${p[1] - 35.6 * FV2.z}) rotate(${tilt}) translate(0 ${35.6 * FV2.z}) scale(${FV2.z})`}>
              <Ship az={180} pal="day" t={t} engines={throttle(t, f2a, tMeet, 0.5)} plumeLen={16} flapFwd={60} flapAft={70} fittings={1} id="f2s" />
            </g>
          }
          overlay={svg(
            <>
              <ellipse cx={pr[0]} cy={pr[1]} rx={70} ry={26} fill="none" stroke={C.red} strokeWidth={8} opacity={one} />
              <Arrow x={pr[0]} y={pr[1] - 230} dx={0} dy={200} color={C.red} o={one} w={14} />
              <Arrow x={pl[0]} y={pl[1] - 120} dx={0} dy={60} o={one * 0.8} w={7} />
            </>,
          )}
        />
      );
    },
  });
  // F3 — too much downward speed, from the side: a spacing trail (marks every 0.2 s) against the baseline's closing-up
  // marks; the arrival is visibly harder — hard stop, arm flex, shake
  const f6a = tSite - 0.2;
  shots.push({
    id: 'F3_tooFast', a: f3a, b: f6a, tin: 'cut',
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
          <CatchView t={t} c={SV} l="day" s={s} farm={false}
            vehicle={<ShipAt c={SV} carY={CAR} above={above} l="day" props={{engines: t < hit ? 0.35 : 0, t, id: 'f3s', flapFwd: 60, flapAft: 70}} />}
            overlay={svg(
              <>
                {marks.map((m, i) => { const p = nose(m, 9); return <line key={i} x1={p[0] - 18} x2={p[0] + 18} y1={p[1]} y2={p[1]} stroke={C.red} strokeWidth={6} strokeLinecap="round" />; })}
                <g opacity={prog(t, f3a + 0.3, f3a + 0.8)}>
                  {baseMarks.map((m, i) => { const p = nose(m, 13); return <line key={i} x1={p[0] - 14} x2={p[0] + 14} y1={p[1]} y2={p[1]} stroke="#2ec4b6" strokeWidth={5} strokeLinecap="round" />; })}
                </g>
                {imp > 0 && imp < 1 ? <circle cx={proj(SV, [VX, CAR + RAIL_DY, 0])[0]} cy={proj(SV, [VX, CAR + RAIL_DY, 0])[1]} r={260 * imp} fill="none" stroke={C.red} strokeWidth={14 * (1 - imp)} opacity={1 - imp} /> : null}
              </>,
            )}
          />
        </div>
      );
    },
  });
  // F6 — the receiving machine is part of the launch site: one move from the arms down the tower to the mount, the pipe
  // rack and the propellant farm the next flight needs
  const g0a = ls('S7_00') - 0.4;
  shots.push({
    id: 'F6_siteRisk', a: f6a, b: g0a, tin: 'cut',
    render: (t) => {
      const at = spline3(t, [[f6a, [VX - 4, CAR, 0]], [wt('S6_07', 'site') - 0.2, [6, 60, -4]], [tNext, [-24, 26, -16]], [g0a, [-30, 22, -18]]]);
      const z = splineZ(t, [[f6a, 11], [wt('S6_07', 'site') - 0.2, 5.2], [tNext, 4.0], [g0a, 3.8]]);
      const c: Cam3 = {at, z, yaw: spline(t, [[f6a, -24], [tNext, -42], [g0a, -46]]), pitch: spline(t, [[f6a, 2], [wt('S6_07', 'site'), -8], [g0a, -14]])};
      const k = fadeWin(t, wt('S6_07', 'equipment') - 0.3, g0a + 0.5, 0.3);
      return <CatchView t={t} c={c} l="day" s={{carY: CAR, open: 24}} hiRail={fadeWin(t, f6a, wt('S6_07', 'site'), 0.3) * 0.6} hiCarriage={k * 0.6} />;
    },
  });
  return shots;
};
export {Clouds};

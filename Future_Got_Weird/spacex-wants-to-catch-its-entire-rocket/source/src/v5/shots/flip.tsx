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

  // C7 — the return corridor, established once: from over the Gulf looking inland at the shore and the pad, the ship falling
  // broadside toward it; the camera closes in on the ship as it comes down (destination always in frame)
  const c7a = tSurvive - 0.1, c9a = tFlaps - 1.6;
  shots.push({
    id: 'C7_corridor', a: c7a, b: c9a, tin: 'dip', td: 0.45,
    render: (t) => {
      const u = ep(t, c7a, c9a, (v) => v);
      const p: V3 = [lerp(VX + 120, VX + 80, u), lerp(520, 330, u), lerp(-1050, -560, u)];
      const site: V3 = [VX, 70, 0];
      const m = lerp(0.5, 0.08, smoother(u));
      const c: Cam3 = {at: [lerp(p[0], site[0], m), lerp(p[1], site[1], m), lerp(p[2], site[2], m)], z: lerp(1.6, 3.8, smoother(u)), yaw: lerp(158, 168, u), pitch: lerp(-4, 0, smoother(u))};
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

  // D6 — mechanism scale at the support region (the opening's framing): first the sideways offset closes (on
  // "position"), then the lean straightens ("orientation"), then the sink rate bleeds off ("motion") and the support
  // features settle onto the rails; the engines stop only once the arms carry the load. No captions.
  const e1a = ls('S5_00') - 0.35;
  shots.push({
    id: 'D6_converge', a: d6a, b: e1a, tin: 'cut',
    render: (t) => {
      const contact = tReach + 0.2;
      const above = approach(t, d6a - 0.4, contact, 11, 0.2);
      const dz = 1.1 * (1 - ep(t, tPos - 0.2, tPos + 0.7));
      const tilt = 3.5 * (1 - ep(t, tOri - 0.1, tOri + 0.8));
      const c: Cam3 = {at: [VX - 2, CAR + RAIL_DY + 2 + Math.max(0, above) * 0.4, ARM_Z - 2], z: lerp(15, 18, ep(t, d6a, contact)), yaw: -34, pitch: -14};
      const s: ArmState = {carY: CAR, open: lerp(10, 4, ep(t, d6a, tPos + 0.7)), flex: 0.3 * prog(t, contact, contact + 0.4)};
      const edge = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3 - 0.4]);
      return (
        <CatchView t={t} c={c} l="day" s={s} hiRail={0.3 + 0.5 * fadeWin(t, contact - 0.1, e1a + 1, 0.2)} hiTruss={0.5 * fadeWin(t, contact + 0.1, e1a + 1, 0.3)}
          vehicle={<ShipAt c={c} carY={CAR} above={above} dz={dz} tilt={tilt} l="day" props={{engines: lerp(1, 0.6, ep(t, tMot - 0.3, contact)) * (1 - prog(t, contact + 0.25, contact + 0.65)), t, id: 'd6s', plumeLen: 20, flapFwd: 60, flapAft: 70}} />}
          overlay={svg(<ellipse cx={edge[0]} cy={edge[1]} rx={90} ry={34} fill="none" stroke={C.red} strokeWidth={8} opacity={0.85 * prog(dz, 0.35, 0.8) * prog(t, d6a, d6a + 0.3)} />)} />
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
      const sw = Math.sin(Math.PI * ep(t, tSwing - 0.3, tCarriage - 0.1));
      const car = CAR + 22 * Math.sin(Math.PI * ep(t, tCarriage - 0.2, e3a + 0.2));
      const ride = ep(t, tCarriage - 0.6, tCarriage);
      const c: Cam3 = {at: [lerp(-2, 8, back), lerp(lerp(CAR + 22, CAR - 4, back), CAR - 2 + 0.85 * (car - CAR), ride), 0], z: Math.exp(lerp(Math.log(28), Math.log(lerp(6.4, 9.5, ride)), back)), yaw: lerp(-62, -34, back), pitch: lerp(-2, 6, back)};
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
  // E5b — the real V3 booster top (07), cropped to the grid fin (the narration's subject); not used for arm length
  shots.push({
    id: 'E5b_realBoosterTop', a: e5bA, b: e5cA, tin: 'cut',
    render: (t) => (
      <Footage file={TOP07} a={e5bA} src0={0} scale={lerp(1.6, 1.75, prog(t, e5bA, e5cA))} cx={0.97} cy={0.3}>
        {svg(
          <>
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

  // E6 — one supported structure, completed: the support features seat on the rails, the arms take the load, then the
  // engines stop and the booster settles a few centimetres; the camera only eases (no pull-back)
  const f0a = ls('S6_00') - 0.4;
  shots.push({
    id: 'E6_oneStructure', a: e6a, b: f0a, tin: 'cut',
    render: (t) => {
      const contact = tFlying - 0.1;
      const above = approach(t, e6a - 0.8, contact, 9, 0.25);
      const ease = ep(t, e6a, f0a);
      const c: Cam3 = {at: [lerp(VX - 4, VX - 6, ease), lerp(CAR + 5, CAR + 1, ease), 0], z: lerp(12.5, 10.5, ease), yaw: lerp(-20, -26, ease), pitch: 3};
      const one = prog(t, tOne - 0.1, tOne + 0.4);
      return (
        <CatchView t={t} c={c} l="day" s={{carY: CAR, open: lerp(10, 4, ep(t, e6a, contact)), flex: 0.3 * prog(t, contact, contact + 0.4)}} hiRail={fadeWin(t, contact - 0.1, f0a + 1, 0.2) * 0.6} hiTruss={one * 0.5} hiCarriage={one * 0.7}
          vehicle={<BoosterAt c={c} carY={CAR} above={above} v="v3" l="day" heading={0} props={{t, engines: throttle(t, e6a - 0.8, contact + 0.25, 0.4), plumeLen: 34, id: 'e6b'}} />} />
      );
    },
  });

  // ---------------- S6: one change at a time ----------------
  const tDrift = ls('S6_01'), tMiss = wt('S6_01', 'miss'), tTilt = ls('S6_02'), tMeet = wt('S6_02', 'meet'), tShared = wt('S6_02', 'shared');
  const tFast = ls('S6_03'), tImpact = wt('S6_03', 'impact'), tSite = ls('S6_07'), tNext = wt('S6_07', 'next');
  // All four demonstrations share one view — down the arms from their tips (the shelf view of S2) — and one safe
  // reference: the baseline's seated ship, kept as a faint outline once it has landed. Each demonstration changes one
  // thing and shows the consequence where the support features meet the rails, then resets cleanly.
  const FV2: Cam3 = {...FV, z: 15};
  const pR = proj(FV2, [VX, CAR + RAIL_DY, ARM_Z - 1.3]), pL = proj(FV2, [VX, CAR + RAIL_DY, -(ARM_Z - 1.3)]);
  const FrontShip: React.FC<{t: number; above: number; dz?: number; tilt?: number; eng?: number; ghost?: boolean; id: string}> = ({t, above, dz = 0, tilt = 0, eng = 0, ghost = false, id}) => {
    const p = proj(FV2, [VX, shipRestY(CAR) + above + 0.9, dz]);
    return (
      <g transform={`translate(${p[0]} ${p[1] - 35.6 * FV2.z}) rotate(${tilt}) translate(0 ${35.6 * FV2.z}) scale(${FV2.z})`} opacity={ghost ? 0.55 : 1}>
        <Ship az={180} pal="day" t={t} engines={eng} plumeLen={16} flapFwd={60} flapAft={70} fittings={1} ghost={ghost} id={id} />
      </g>
    );
  };
  const Demo: React.FC<{t: number; ref0: number; flex?: number; children: React.ReactNode; overlay?: React.ReactNode; hi?: number}> = ({t, ref0, flex = 0, children, overlay, hi = 0.45}) => (
    <CatchView t={t} c={FV2} l="day" s={{carY: CAR, open: 0, flex}} farm={false} hiRail={hi}
      vehicle={<>{ref0 > 0.01 ? <g opacity={ref0}><FrontShip t={t} above={0} ghost id={`ref${Math.round(t * 30)}`} /></g> : null}{children}</>}
      overlay={overlay ? svg(<>{overlay}</>) : null} />
  );
  const okMark = (p: number[], o: number) => <g opacity={o}><ellipse cx={p[0]} cy={p[1]} rx={64} ry={24} fill="none" stroke="#2ec4b6" strokeWidth={7} /></g>;
  const xMark = (p: number[], o: number) => (
    <g opacity={o} stroke={C.red} strokeWidth={14} strokeLinecap="round">
      <line x1={p[0] - 50} y1={p[1] - 40} x2={p[0] + 50} y2={p[1] + 40} /><line x1={p[0] + 50} y1={p[1] - 40} x2={p[0] - 50} y2={p[1] + 40} />
    </g>
  );
  const f1a = tDrift - 0.2;
  // F0 — the baseline: straight, centred, slow; both support features seat together, engines off after the load
  shots.push({
    id: 'F0_baseline', a: f0a, b: f1a, tin: 'cut',
    render: (t) => {
      const seat = f1a - 0.7;
      const above = approach(t, f0a - 0.3, seat, 10, 0.12);
      const ok = fadeWin(t, seat - 0.05, f1a + 0.3, 0.2);
      return (
        <Demo t={t} ref0={0} flex={0.2 * prog(t, seat, seat + 0.3)} overlay={<>{okMark(pR, ok)}{okMark(pL, ok)}</>}>
          <FrontShip t={t} above={above} eng={throttle(t, f0a - 0.3, seat + 0.15, 0.35)} id="f0s" />
        </Demo>
      );
    },
  });
  // F1 — add sideways drift: the ship lifts off, comes down again offset; one support feature finds nothing and that
  // side drops; then it lifts clear and recentres over the reference
  const f2a = tTilt - 0.2;
  shots.push({
    id: 'F1_drift', a: f1a, b: f2a, tin: 'cut',
    render: (t) => {
      const hop = 6 * Math.sin(Math.PI * ep(t, f1a, tMiss));
      const reset = ep(t, tMiss + 0.9, f2a);
      const above = (t < tMiss ? hop : 0) + 12 * reset;
      const dz = 1.25 * ep(t, f1a + 0.2, tMiss - 0.3) * (1 - reset);
      const sag = 3.2 * ep(t, tMiss - 0.05, tMiss + 0.35) * (1 - reset);
      return (
        <Demo t={t} ref0={1} overlay={xMark(pL, prog(t, tMiss - 0.05, tMiss + 0.15) * (1 - prog(t, tMiss + 1.0, tMiss + 1.3)))}>
          <FrontShip t={t} above={above} dz={dz} tilt={sag} eng={0.6 * (1 - prog(t, tMiss - 0.2, tMiss + 0.1)) + 0.8 * prog(t, tMiss + 0.7, tMiss + 1.0)} id="f1s" />
        </Demo>
      );
    },
  });
  // F2 — add tilt: one side's support meets its rail first and carries the load alone; then the ship lifts, straightens
  const f3a = tFast - 0.2;
  shots.push({
    id: 'F2_tilt', a: f2a, b: f3a, tin: 'cut',
    render: (t) => {
      const above = approach(t, f2a + 0.1, tMeet, 12, 0.1) + 16 * ep(t, tShared + 0.2, f3a - 0.1);
      const tilt = 4.5 * (1 - ep(t, tShared + 0.2, f3a - 0.2));
      const one = prog(t, tMeet - 0.1, tMeet + 0.2) * (1 - prog(t, tShared, tShared + 0.4));
      return (
        <Demo t={t} ref0={1} hi={0.3} overlay={<>
          <ellipse cx={pR[0]} cy={pR[1]} rx={70} ry={26} fill="none" stroke={C.red} strokeWidth={8} opacity={one} />
          <Arrow x={pR[0]} y={pR[1] - 230} dx={0} dy={200} color={C.red} o={one} w={14} />
          <Arrow x={pL[0]} y={pL[1] - 120} dx={0} dy={60} o={one * 0.8} w={7} />
        </>}>
          <FrontShip t={t} above={above} tilt={tilt} eng={Math.max(throttle(t, f2a, tMeet, 0.5), 0.8 * prog(t, tShared, tShared + 0.3))} id="f2s" />
        </Demo>
      );
    },
  });
  // F3 — keep too much downward speed: marks every 0.2 s stay wide apart (the baseline's, in teal, close up); the
  // arrival is a hard stop at the rails — flex, shake, impact ring
  const f6a = tSite - 0.2;
  shots.push({
    id: 'F3_tooFast', a: f3a, b: f6a, tin: 'cut',
    render: (t) => {
      const hit = tImpact - 0.15;
      const t0 = f3a + 0.4;
      const h = (tt: number) => (tt < t0 ? 16 : tt < hit ? lerp(16, 0, Math.pow(prog(tt, t0, hit), 1.12)) : 0);
      const above = t < hit ? h(t) : -0.6 * Math.exp(-(t - hit) * 6) * Math.cos((t - hit) * 30);
      const imp = t > hit ? prog(t, hit, hit + 0.5) : 0;
      const shake = t > hit ? 8 * Math.exp(-(t - hit) * 5) * Math.sin((t - hit) * 60) : 0;
      const marks: number[] = [];
      for (let tt = t0; tt <= Math.min(t, hit); tt += 0.2) marks.push(h(tt));
      const at = (ab: number, dz: number) => proj(FV2, [VX, shipRestY(CAR) + ab + 46, dz]);
      const baseMarks = Array.from({length: 8}, (_, i) => 16 * Math.pow(1 - i / 7, 2.2));
      const rc = proj(FV2, [VX, CAR + RAIL_DY, 0]);
      return (
        <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
          <Demo t={t} ref0={1} flex={0.9 * (imp > 0 ? Math.exp(-(t - hit) * 3) : 0)} overlay={<>
            {marks.map((m, i) => { const p = at(m, -8); return <line key={i} x1={p[0] - 18} x2={p[0] + 18} y1={p[1]} y2={p[1]} stroke={C.red} strokeWidth={6} strokeLinecap="round" />; })}
            <g opacity={prog(t, f3a + 0.3, f3a + 0.8)}>
              {baseMarks.map((m, i) => { const p = at(m, 8); return <line key={i} x1={p[0] - 14} x2={p[0] + 14} y1={p[1]} y2={p[1]} stroke="#2ec4b6" strokeWidth={5} strokeLinecap="round" />; })}
            </g>
            {imp > 0 && imp < 1 ? <ellipse cx={rc[0]} cy={rc[1]} rx={420 * imp} ry={140 * imp} fill="none" stroke={C.red} strokeWidth={14 * (1 - imp)} opacity={1 - imp} /> : null}
          </>}>
            <FrontShip t={t} above={above} eng={t < hit ? 0.35 : 0} id="f3s" />
          </Demo>
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
